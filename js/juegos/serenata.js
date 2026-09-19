// ==================== SERENATA A CIEGAS ====================
// Uno graba tarareando (o cantando mal, vale) un pedacito de una
// canción sin decir cuál es; el otro la escucha a ciegas y arriesga
// qué tema es. Recién ahí se revela el título real. El audio se graba
// corto (máx. 12s, poca calidad) y se guarda como data URI base64
// directo en el documento de Firestore — no hace falta Firebase
// Storage, un audio así de corto pesa apenas unos KB, muy lejos del
// límite de 1 MiB por documento. Mismo truco que Letras Compartidas y
// ¿Quién Tiene Razón?: documentos con tipo:'serenata' dentro de la
// colección 'juegos', sin tocar las Reglas de Firestore.
const DURACION_MAX_SERENATA_SEG = 12;

function refSerenata(id){ return window.doc(window.db, 'juegos', id); }

function _escaparTextoSerenata(texto){
    const div = document.createElement('div');
    div.innerText = texto == null ? '' : String(texto);
    return div.innerHTML;
}

function _elegirMimeTypeSerenata(){
    const candidatos = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4'];
    if (!window.MediaRecorder || !MediaRecorder.isTypeSupported) return '';
    for (const m of candidatos) { if (MediaRecorder.isTypeSupported(m)) return m; }
    return '';
}

function iniciarSerenata(){
    mostrarListaSerenatas();
}

function mostrarListaSerenatas(){
    const cont = document.getElementById('contenido-serenata');
    if (!cont) return;
    cont.innerHTML = `<div class="panel texto-centro texto-tenue">Cargando…</div>`;
    if (window._unsubSerenatas) window._unsubSerenatas();
    const q = window.query(window.collection(window.db, 'juegos'), window.where('tipo', '==', 'serenata'));
    window._unsubSerenatas = window.onSnapshot(q, (snap) => {
        const serenatas = [];
        snap.forEach(d => serenatas.push({ id: d.id, ...d.data() }));
        serenatas.sort((a, b) => (b.creadoEn || 0) - (a.creadoEn || 0));
        renderListaSerenatas(serenatas);
    }, (err) => {
        console.error('Error de Firestore en serenata:', err);
        cont.innerHTML = `<div class="panel texto-centro texto-tenue">⚠️ No se pudo conectar (${err.code || 'error'}).</div>`;
    });
}

function renderListaSerenatas(serenatas){
    const cont = document.getElementById('contenido-serenata');
    const paraAdivinar = serenatas.filter(s => s.autor !== miIdentidad);
    const conAcierto = paraAdivinar.filter(s => s.acertada !== null && s.acertada !== undefined);
    const aciertos = conAcierto.filter(s => s.acertada === true).length;

    let html = `<div class="panel texto-centro">
        <p class="texto-tenue">Grabá tarareando una canción sin decir cuál es. ${nombreJugador(miRival)} la escucha a ciegas y arriesga qué tema es.</p>
        ${conAcierto.length ? `<p style="margin:6px 0 0;">🎯 Adivinaste ${aciertos} de ${conAcierto.length}</p>` : ''}
        <button class="btn-principal" style="margin-top:10px;" onclick="mostrarGrabadorSerenata()">🎤 Grabar una serenata nueva</button>
    </div>
    <div id="grabador-serenata"></div>`;

    if (serenatas.length) {
        serenatas.forEach(s => { html += _htmlTarjetaSerenata(s); });
    } else {
        html += `<div class="panel texto-centro texto-tenue">Todavía no grabaron ninguna serenata. ¡Animate a la primera! 🎶</div>`;
    }
    cont.innerHTML = html;
}

function _htmlTarjetaSerenata(s){
    const esMia = s.autor === miIdentidad;
    const audioTag = s.audio ? `<audio controls src="${s.audio}" style="width:100%; margin:8px 0;"></audio>` : '';
    if (esMia) {
        const estadoTxt = s.estado === 'revelado'
            ? `${nombreJugador(miRival)} arriesgó: <b>${_escaparTextoSerenata(s.adivinanza)}</b> ${s.acertada === true ? '✅ ¡Le achuntó!' : (s.acertada === false ? '❌ No le achuntó.' : '')}`
            : `Esperando a que ${nombreJugador(miRival)} la escuche y arriesgue…`;
        return `<div class="panel">
            <p class="texto-tenue" style="margin:0 0 4px;">Tu serenata — era "${_escaparTextoSerenata(s.tituloReal)}"</p>
            ${audioTag}
            <p style="margin:0; font-size:0.9rem;">${estadoTxt}</p>
        </div>`;
    }
    if (s.estado === 'revelado') {
        return `<div class="panel">
            <p class="texto-tenue" style="margin:0 0 4px;">Serenata de ${nombreJugador(s.autor)}</p>
            ${audioTag}
            <p style="margin:0 0 4px; font-size:0.9rem;">Arriesgaste: <b>${_escaparTextoSerenata(s.adivinanza)}</b></p>
            <p style="margin:0 0 8px; font-size:0.9rem;">Era: <b>${_escaparTextoSerenata(s.tituloReal)}</b></p>
            ${s.acertada === null || s.acertada === undefined ? `<div style="display:flex; gap:8px;">
                <button class="btn-secundario" style="flex:1;" onclick="marcarAciertoSerenata('${s.id}', true)">✅ Le achunté</button>
                <button class="btn-secundario" style="flex:1;" onclick="marcarAciertoSerenata('${s.id}', false)">❌ No le achunté</button>
            </div>` : (s.acertada ? '<p style="margin:0;">✅ ¡Le achuntaste!</p>' : '<p style="margin:0;">❌ No le achuntaste, ¡a seguir practicando!</p>')}
        </div>`;
    }
    return `<div class="panel">
        <p class="texto-tenue" style="margin:0 0 4px;">Serenata de ${nombreJugador(s.autor)}</p>
        ${audioTag}
        <textarea id="input-adivinanza-${s.id}" placeholder="¿Qué canción es?" rows="2" maxlength="140" style="width:100%; box-sizing:border-box; font-family:var(--fuente-texto); background:rgba(255,255,255,0.06); color:var(--texto); border:1px solid var(--borde); border-radius:12px; padding:10px; resize:none;"></textarea>
        <button class="btn-principal" style="margin-top:8px;" onclick="adivinarSerenata('${s.id}')">Arriesgar</button>
    </div>`;
}

async function adivinarSerenata(id){
    const input = document.getElementById('input-adivinanza-' + id);
    if (!input) return;
    const adivinanza = input.value.trim();
    if (!adivinanza) return;
    vibrarJ(12);
    try {
        await window.updateDoc(refSerenata(id), { adivinanza, estado: 'revelado' });
        if (typeof registrarEvento === 'function') registrarEvento('serenata_adivinada', `${nombreJugador(miIdentidad)} arriesgó una serenata`);
    } catch (e) { console.error('No se pudo mandar la adivinanza:', e); }
}

async function marcarAciertoSerenata(id, acerte){
    vibrarJ(acerte ? [10, 20, 10] : 10);
    if (window.sfx) window.sfx[acerte ? 'victoria' : 'toque']();
    try {
        await window.updateDoc(refSerenata(id), { acertada: acerte });
    } catch (e) { console.error('No se pudo guardar el resultado:', e); }
}

// ---- Grabación ----
let _grabadorSerenataStream = null;
let _grabadorSerenataRecorder = null;
let _grabadorSerenataChunks = [];
let _grabadorSerenataTimer = null;
let _grabadorSerenataAudioUri = null;

function mostrarGrabadorSerenata(){
    const cont = document.getElementById('grabador-serenata');
    if (!cont) return;
    _grabadorSerenataAudioUri = null;
    cont.innerHTML = `<div class="panel texto-centro">
        <p class="texto-tenue" style="margin:0 0 10px;">Grabá hasta ${DURACION_MAX_SERENATA_SEG} segundos tarareando la canción.</p>
        <button class="btn-principal" id="btn-grabar-serenata" onclick="alternarGrabacionSerenata()">🔴 Grabar</button>
        <p class="texto-tenue" id="estado-grabacion-serenata" style="margin-top:8px; min-height:1.2em;"></p>
    </div>`;
}

async function alternarGrabacionSerenata(){
    if (_grabadorSerenataRecorder && _grabadorSerenataRecorder.state === 'recording') {
        _grabadorSerenataRecorder.stop();
        return;
    }
    const estadoEl = document.getElementById('estado-grabacion-serenata');
    const btn = document.getElementById('btn-grabar-serenata');
    try {
        _grabadorSerenataStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (e) {
        console.error('No se pudo acceder al micrófono:', e);
        if (estadoEl) estadoEl.innerText = '⚠️ No pudimos acceder al micrófono. Revisá los permisos.';
        return;
    }
    const mimeType = _elegirMimeTypeSerenata();
    try {
        _grabadorSerenataRecorder = mimeType
            ? new MediaRecorder(_grabadorSerenataStream, { mimeType, audioBitsPerSecond: 24000 })
            : new MediaRecorder(_grabadorSerenataStream);
    } catch (e) {
        console.error('No se pudo iniciar la grabación:', e);
        if (estadoEl) estadoEl.innerText = '⚠️ Este navegador no puede grabar audio.';
        _grabadorSerenataStream.getTracks().forEach(t => t.stop());
        return;
    }
    _grabadorSerenataChunks = [];
    _grabadorSerenataRecorder.ondataavailable = (e) => { if (e.data && e.data.size > 0) _grabadorSerenataChunks.push(e.data); };
    _grabadorSerenataRecorder.onstop = () => {
        if (_grabadorSerenataTimer) { clearInterval(_grabadorSerenataTimer); _grabadorSerenataTimer = null; }
        if (_grabadorSerenataStream) { _grabadorSerenataStream.getTracks().forEach(t => t.stop()); _grabadorSerenataStream = null; }
        const blob = new Blob(_grabadorSerenataChunks, { type: mimeType || 'audio/webm' });
        const lector = new FileReader();
        lector.onload = () => { _grabadorSerenataAudioUri = lector.result; mostrarPreviaGrabacionSerenata(); };
        lector.readAsDataURL(blob);
    };
    _grabadorSerenataRecorder.start();
    vibrarJ(15);
    let segundos = 0;
    if (btn) btn.innerText = '⏹ Parar';
    if (estadoEl) estadoEl.innerText = `Grabando… 0s / ${DURACION_MAX_SERENATA_SEG}s`;
    _grabadorSerenataTimer = setInterval(() => {
        segundos++;
        if (estadoEl) estadoEl.innerText = `Grabando… ${segundos}s / ${DURACION_MAX_SERENATA_SEG}s`;
        if (segundos >= DURACION_MAX_SERENATA_SEG && _grabadorSerenataRecorder && _grabadorSerenataRecorder.state === 'recording') {
            _grabadorSerenataRecorder.stop();
        }
    }, 1000);
}

function mostrarPreviaGrabacionSerenata(){
    const cont = document.getElementById('grabador-serenata');
    if (!cont || !_grabadorSerenataAudioUri) return;
    cont.innerHTML = `<div class="panel texto-centro">
        <audio controls src="${_grabadorSerenataAudioUri}" style="width:100%; margin-bottom:10px;"></audio>
        <input type="text" id="input-titulo-serenata" placeholder="¿Qué canción es? (esto no lo ve ${nombreJugador(miRival)} hasta que adivine)" maxlength="80" style="width:100%; box-sizing:border-box; font-family:var(--fuente-texto); background:rgba(255,255,255,0.06); color:var(--texto); border:1px solid var(--borde); border-radius:12px; padding:10px; margin-bottom:8px;">
        <div style="display:flex; gap:8px;">
            <button class="btn-secundario" style="flex:1;" onclick="mostrarGrabadorSerenata()">🔁 Grabar de nuevo</button>
            <button class="btn-principal" style="flex:1;" onclick="guardarSerenata()">Mandar</button>
        </div>
    </div>`;
}

async function guardarSerenata(){
    const input = document.getElementById('input-titulo-serenata');
    if (!input || !_grabadorSerenataAudioUri) return;
    const tituloReal = input.value.trim();
    if (!tituloReal || !miIdentidad) return;
    vibrarJ([15, 30, 15]);
    try {
        await window.addDoc(window.collection(window.db, 'juegos'), {
            tipo: 'serenata', autor: miIdentidad, audio: _grabadorSerenataAudioUri,
            tituloReal, estado: 'esperando', adivinanza: null, acertada: null,
            creadoEn: Date.now(),
        });
        _grabadorSerenataAudioUri = null;
        const cont = document.getElementById('grabador-serenata');
        if (cont) cont.innerHTML = '';
        if (typeof registrarEvento === 'function') registrarEvento('nueva_serenata', `${nombreJugador(miIdentidad)} grabó una serenata a ciegas`);
    } catch (e) {
        console.error('No se pudo guardar la serenata:', e);
    }
}
