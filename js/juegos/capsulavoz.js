// ==================== CÁPSULA DE VOZ DIARIA ====================
// Un mensajito de audio de hasta 10 segundos, una vez por día. Se
// guarda como data URI base64 directo en Firestore (mismo truco que
// Serenata a Ciegas, sin necesitar Firebase Storage: 10s de audio de
// baja calidad pesan apenas unos KB). La gracia es que se autodestruye:
// apenas el otro aprieta play, se borra para siempre — ni se puede
// volver a escuchar, ni queda guardada en ningún historial.
const DURACION_MAX_CAPSULA_SEG = 10;

function refCapsulaVoz(){ return window.doc(window.db, 'juegos', 'capsula-voz'); }
function _campoCapsula(identidad){ return identidad === 'nico' ? 'capsulaNico' : 'capsulaCarito'; }
// Campo aparte de la cápsula en sí: el límite de "una vez por día" no
// puede depender de fecha guardada DENTRO de la cápsula, porque esa
// cápsula se borra apenas la escuchan — si el otro la escucha rápido,
// el remitente vería el gate liberado y podría mandar otra el mismo
// día. Esta fecha queda aparte y nunca se borra al escuchar.
function _campoFechaEnvio(identidad){ return identidad === 'nico' ? 'fechaEnvioNico' : 'fechaEnvioCarito'; }
function _fechaHoyCapsula(){
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function _elegirMimeTypeCapsula(){
    const candidatos = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4'];
    if (!window.MediaRecorder || !MediaRecorder.isTypeSupported) return '';
    for (const m of candidatos) { if (MediaRecorder.isTypeSupported(m)) return m; }
    return '';
}

function iniciarCapsulaVoz(){
    if (window._unsubCapsulaVoz) window._unsubCapsulaVoz();
    window._unsubCapsulaVoz = window.onSnapshot(refCapsulaVoz(), (snap) => {
        renderCapsulaVoz(snap.exists() ? snap.data() : {});
    }, (err) => {
        console.error('Error de Firestore en cápsula de voz:', err);
        document.getElementById('contenido-capsulavoz').innerHTML = `<div class="panel texto-centro texto-tenue">⚠️ No se pudo conectar (${err.code || 'error'}).</div>`;
    });
}

function renderCapsulaVoz(estado){
    const cont = document.getElementById('contenido-capsulavoz');
    const hoy = _fechaHoyCapsula();
    const capsulaRival = estado[_campoCapsula(miRival)] || null;
    const yaEnvieHoy = estado[_campoFechaEnvio(miIdentidad)] === hoy;

    let html = `<div class="panel texto-centro">
        <p class="texto-tenue">Un mensajito de voz de hasta ${DURACION_MAX_CAPSULA_SEG} segundos, una vez por día. Apenas ${nombreJugador(miRival)} lo escucha, se borra para siempre.</p>
    </div>`;

    if (capsulaRival) {
        html += `<div class="panel texto-centro logro-animado">
            <p style="font-size:1.8rem; margin:0 0 6px;">🎙️💌</p>
            <p style="margin:0 0 10px;">Tenés una cápsula de ${nombreJugador(miRival)}</p>
            <button class="btn-principal" onclick="reproducirCapsulaVoz()">▶️ Escuchar (se borra al toque)</button>
        </div>`;
    }

    html += `<div class="panel texto-centro">
        ${yaEnvieHoy
            ? `<p class="texto-tenue">Ya mandaste la cápsula de hoy. Esperando a que ${nombreJugador(miRival)} la escuche…</p>`
            : `<button class="btn-secundario" id="btn-grabar-capsula" onclick="mostrarGrabadorCapsulaVoz()">🎤 Grabar la cápsula de hoy</button>`}
    </div>
    <div id="grabador-capsula-voz"></div>`;

    cont.innerHTML = html;
}

async function reproducirCapsulaVoz(){
    const snap = await new Promise(res => { const u = window.onSnapshot(refCapsulaVoz(), s => { u(); res(s); }); });
    const datos = snap.exists() ? snap.data() : {};
    const capsula = datos[_campoCapsula(miRival)];
    if (!capsula || !capsula.audio) return;
    vibrarJ(15);
    try {
        const audio = new Audio(capsula.audio);
        audio.play().catch(e => console.error('No se pudo reproducir la cápsula:', e));
    } catch (e) { console.error('No se pudo reproducir la cápsula:', e); }
    // Se autodestruye apenas se aprieta play: a partir de acá ya no
    // existe para nadie más, ni siquiera para volver a escucharla.
    try {
        await window.setDoc(refCapsulaVoz(), { [_campoCapsula(miRival)]: null }, { merge: true });
    } catch (e) { console.error('No se pudo borrar la cápsula tras escucharla:', e); }
}

// ---- Grabación (mismo patrón que Serenata a Ciegas) ----
let _grabadorCapsulaStream = null;
let _grabadorCapsulaRecorder = null;
let _grabadorCapsulaChunks = [];
let _grabadorCapsulaTimer = null;
let _grabadorCapsulaAudioUri = null;

function mostrarGrabadorCapsulaVoz(){
    const cont = document.getElementById('grabador-capsula-voz');
    if (!cont) return;
    _grabadorCapsulaAudioUri = null;
    cont.innerHTML = `<div class="panel texto-centro">
        <button class="btn-principal" id="btn-grabar-capsula-toggle" onclick="alternarGrabacionCapsulaVoz()">🔴 Grabar</button>
        <p class="texto-tenue" id="estado-grabacion-capsula" style="margin-top:8px; min-height:1.2em;"></p>
    </div>`;
}

async function alternarGrabacionCapsulaVoz(){
    if (_grabadorCapsulaRecorder && _grabadorCapsulaRecorder.state === 'recording') {
        _grabadorCapsulaRecorder.stop();
        return;
    }
    const estadoEl = document.getElementById('estado-grabacion-capsula');
    const btn = document.getElementById('btn-grabar-capsula-toggle');
    try {
        _grabadorCapsulaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (e) {
        console.error('No se pudo acceder al micrófono:', e);
        if (estadoEl) estadoEl.innerText = '⚠️ No pudimos acceder al micrófono. Revisá los permisos.';
        return;
    }
    const mimeType = _elegirMimeTypeCapsula();
    try {
        _grabadorCapsulaRecorder = mimeType
            ? new MediaRecorder(_grabadorCapsulaStream, { mimeType, audioBitsPerSecond: 24000 })
            : new MediaRecorder(_grabadorCapsulaStream);
    } catch (e) {
        console.error('No se pudo iniciar la grabación:', e);
        if (estadoEl) estadoEl.innerText = '⚠️ Este navegador no puede grabar audio.';
        _grabadorCapsulaStream.getTracks().forEach(t => t.stop());
        return;
    }
    _grabadorCapsulaChunks = [];
    _grabadorCapsulaRecorder.ondataavailable = (e) => { if (e.data && e.data.size > 0) _grabadorCapsulaChunks.push(e.data); };
    _grabadorCapsulaRecorder.onstop = () => {
        if (_grabadorCapsulaTimer) { clearInterval(_grabadorCapsulaTimer); _grabadorCapsulaTimer = null; }
        if (_grabadorCapsulaStream) { _grabadorCapsulaStream.getTracks().forEach(t => t.stop()); _grabadorCapsulaStream = null; }
        const blob = new Blob(_grabadorCapsulaChunks, { type: mimeType || 'audio/webm' });
        const lector = new FileReader();
        lector.onload = () => { _grabadorCapsulaAudioUri = lector.result; mostrarPreviaCapsulaVoz(); };
        lector.readAsDataURL(blob);
    };
    _grabadorCapsulaRecorder.start();
    vibrarJ(15);
    let segundos = 0;
    if (btn) btn.innerText = '⏹ Parar';
    if (estadoEl) estadoEl.innerText = `Grabando… 0s / ${DURACION_MAX_CAPSULA_SEG}s`;
    _grabadorCapsulaTimer = setInterval(() => {
        segundos++;
        if (estadoEl) estadoEl.innerText = `Grabando… ${segundos}s / ${DURACION_MAX_CAPSULA_SEG}s`;
        if (segundos >= DURACION_MAX_CAPSULA_SEG && _grabadorCapsulaRecorder && _grabadorCapsulaRecorder.state === 'recording') {
            _grabadorCapsulaRecorder.stop();
        }
    }, 1000);
}

function mostrarPreviaCapsulaVoz(){
    const cont = document.getElementById('grabador-capsula-voz');
    if (!cont || !_grabadorCapsulaAudioUri) return;
    cont.innerHTML = `<div class="panel texto-centro">
        <audio controls src="${_grabadorCapsulaAudioUri}" style="width:100%; margin-bottom:10px;"></audio>
        <div style="display:flex; gap:8px;">
            <button class="btn-secundario" style="flex:1;" onclick="mostrarGrabadorCapsulaVoz()">🔁 Grabar de nuevo</button>
            <button class="btn-principal" style="flex:1;" onclick="guardarCapsulaVoz()">Mandar</button>
        </div>
    </div>`;
}

async function guardarCapsulaVoz(){
    if (!_grabadorCapsulaAudioUri || !miIdentidad) return;
    vibrarJ([15, 30, 15]);
    try {
        // setDoc con merge (no updateDoc): la primera vez que alguien
        // manda una cápsula, el documento todavía no existe.
        await window.setDoc(refCapsulaVoz(), {
            [_campoCapsula(miIdentidad)]: { audio: _grabadorCapsulaAudioUri, enviadoEn: Date.now() },
            [_campoFechaEnvio(miIdentidad)]: _fechaHoyCapsula(),
        }, { merge: true });
        _grabadorCapsulaAudioUri = null;
        const cont = document.getElementById('grabador-capsula-voz');
        if (cont) cont.innerHTML = '';
        if (typeof registrarEvento === 'function') registrarEvento('capsula_voz_enviada', `${nombreJugador(miIdentidad)} mandó la cápsula de voz de hoy`);
    } catch (e) { console.error('No se pudo guardar la cápsula de voz:', e); }
}
