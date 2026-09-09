// ==================== DERRIBÁ PIÑATAS ====================
// Duelo en tiempo real, 30 segundos. Piñatas aparecen en posiciones al
// azar por poco tiempo; si las tocás a tiempo suman, y tocarlas
// seguidas sin fallar sube un combo que multiplica los puntos.
const DURACION_PINATAS = 30000;
const TIEMPO_VIDA_PINATA = 1200;

function refPinatas(){ return window.doc(window.db, 'juegos', 'pinatas'); }

function iniciarPinatas(){
    const cont = document.getElementById('contenido-pinatas');
    if (cont) delete cont.dataset.jugandoLocal;
    if (window._unsubPinatas) window._unsubPinatas();
    window._unsubPinatas = window.onSnapshot(refPinatas(), (snap) => {
        renderPinatas(snap.exists() ? snap.data() : null);
    }, (err) => {
        console.error('Error de Firestore en piñatas:', err);
        if (cont && cont.dataset.jugandoLocal !== '1') {
            cont.innerHTML = `<div class="panel texto-centro texto-tenue">⚠️ No se pudo conectar (${err.code || 'error'}).</div>`;
        }
    });
}

let _cuentaRegresivaPinatas = null;

function renderPinatas(estado){
    const cont = document.getElementById('contenido-pinatas');
    if (cont.dataset.jugandoLocal === '1') return;
    if (_cuentaRegresivaPinatas) { clearTimeout(_cuentaRegresivaPinatas); _cuentaRegresivaPinatas = null; }

    if (!estado || estado.fase === 'esperando') {
        const listoYo = estado?.listos?.[miIdentidad];
        const listoRival = estado?.listos?.[miRival];
        const p = estado?.puntajes || { nico: 0, carito: 0 };
        cont.innerHTML = `<div class="panel texto-centro">
            <p class="texto-tenue">30 segundos. Las piñatas aparecen un instante — tocalas antes de que se vayan. Tocar varias seguidas sube el combo.</p>
            <div class="texto-tenue" style="margin:10px 0;">Nico ${p.nico || 0} — Carito ${p.carito || 0}</div>
            <div class="texto-tenue" style="margin-bottom:10px;">
                ${nombreJugador(miIdentidad)}: ${listoYo ? '✅ listo/a' : '⏳ esperando'}<br>
                ${nombreJugador(miRival)}: ${listoRival ? '✅ listo/a' : '⏳ esperando'}
            </div>
            <button class="btn-principal" ${listoYo ? 'disabled style="opacity:0.5;"' : ''} onclick="marcarListoPinatas()">${listoYo ? 'Esperando…' : '¡Estoy listo/a! 🎯'}</button>
        </div>`;
        if (listoYo && listoRival) iniciarRondaArcadeSiCorresponde(refPinatas(), 'pinatas', DURACION_PINATAS, { puntajeVivoNico: 0, puntajeVivoCarito: 0 });
        return;
    }

    if (estado.fase === 'jugando') {
        const restante = (estado.horaInicio || Date.now()) - Date.now();
        if (restante > 0) {
            cont.innerHTML = `<div class="panel texto-centro" style="font-size:2rem;">${Math.ceil(restante / 1000)}</div>`;
            _cuentaRegresivaPinatas = setTimeout(() => renderPinatas(estado), Math.min(restante, 200));
            return;
        }
        jugarRondaPinatas(estado.horaFin);
        return;
    }

    if (estado.fase === 'terminado') {
        const p = estado.puntajes || { nico: 0, carito: 0 };
        let msg = '🤝 ¡Empataron!';
        if (p.nico > p.carito) msg = miIdentidad === 'nico' ? '🏆 ¡Ganaste vos!' : `🏆 Ganó ${nombreJugador('nico')}`;
        else if (p.carito > p.nico) msg = miIdentidad === 'carito' ? '🏆 ¡Ganaste vos!' : `🏆 Ganó ${nombreJugador('carito')}`;
        cont.innerHTML = `<div class="panel texto-centro logro-animado">
            <div style="font-size:1.2rem; margin-bottom:6px;">${msg}</div>
            <div class="texto-tenue">Nico ${p.nico} — Carito ${p.carito}</div>
            <button class="btn-principal" style="margin-top:14px;" onclick="revanchaPinatas()">🔁 Otra ronda</button>
        </div>`;
    }
}

async function marcarListoPinatas(){
    vibrarJ(12);
    await marcarListoArcade(refPinatas(), { puntajes: (await leerPuntajesPinatas()) });
}
async function leerPuntajesPinatas(){
    const snap = await new Promise(res => { const u = window.onSnapshot(refPinatas(), s => { u(); res(s); }); });
    const data = snap.exists() ? snap.data() : null;
    return data?.puntajes || { nico: 0, carito: 0 };
}

function jugarRondaPinatas(horaFin){
    const cont = document.getElementById('contenido-pinatas');
    cont.dataset.jugandoLocal = '1';
    cont.innerHTML = `
        <div class="panel">
            <div style="display:flex; justify-content:space-between; font-size:0.9rem; margin-bottom:8px;">
                <span>Vos: <b id="marcador-yo-pinatas">0</b> <span id="combo-pinatas" class="texto-tenue"></span></span>
                <span id="tiempo-pinatas">30s</span>
                <span>${nombreJugador(miRival)}: <b id="marcador-rival-pinatas">0</b></span>
            </div>
            <div style="position:relative; width:100%; aspect-ratio:4/3; max-height:55vh; background:rgba(0,0,0,0.25); border-radius:14px; overflow:hidden;" id="area-pinatas"></div>
            <p class="texto-tenue texto-centro" style="margin-top:8px;">Tocá las piñatas 🪅 antes de que se vayan</p>
        </div>`;
    arrancarPinatas(horaFin);
}

function arrancarPinatas(horaFin){
    const area = document.getElementById('area-pinatas');
    if (!area) return;
    let puntaje = 0, combo = 0, terminando = false, idPinataActual = 0;
    let spawnTimeout = null, unsubRival = null;

    unsubRival = window.onSnapshot(refPinatas(), (snap) => {
        const data = snap.exists() ? snap.data() : null;
        const el = document.getElementById('marcador-rival-pinatas');
        if (el && data) el.innerText = data[miRival === 'nico' ? 'puntajeVivoNico' : 'puntajeVivoCarito'] || 0;
    });

    function actualizarUI(){
        const m = document.getElementById('marcador-yo-pinatas');
        if (m) m.innerText = puntaje;
        const c = document.getElementById('combo-pinatas');
        if (c) c.innerText = combo >= 2 ? `🔥x${combo}` : '';
    }

    function spawnPinata(){
        if (terminando) return;
        idPinataActual++;
        const miId = idPinataActual;
        const el = document.createElement('div');
        el.className = 'destello';
        el.style.cssText = `position:absolute; left:${5 + Math.random() * 80}%; top:${5 + Math.random() * 75}%; font-size:2.4rem; cursor:pointer; transition:transform 0.15s;`;
        el.innerText = '🪅';
        el.onclick = () => {
            if (!area.contains(el)) return;
            el.remove();
            puntaje += Math.max(1, combo);
            combo++;
            vibrarJ(12);
            actualizarUI();
            sincronizarPuntajeEnVivo(refPinatas(), miIdentidad === 'nico' ? 'puntajeVivoNico' : 'puntajeVivoCarito', puntaje);
        };
        area.appendChild(el);
        setTimeout(() => {
            if (el.isConnected) { el.remove(); combo = 0; actualizarUI(); }
            if (!terminando) spawnTimeout = setTimeout(spawnPinata, 350 + Math.random() * 500);
        }, TIEMPO_VIDA_PINATA);
    }
    spawnTimeout = setTimeout(spawnPinata, 400);

    function tick(){
        const el = document.getElementById('tiempo-pinatas');
        const seg = Math.max(0, Math.ceil((horaFin - Date.now()) / 1000));
        if (el) el.innerText = seg + 's';
        if (Date.now() >= horaFin) { terminar(); return; }
        window._timerPinatas = setTimeout(tick, 200);
    }
    tick();

    async function terminar(){
        if (terminando) return;
        terminando = true;
        if (spawnTimeout) clearTimeout(spawnTimeout);
        if (window._timerPinatas) clearTimeout(window._timerPinatas);
        if (unsubRival) unsubRival();
        area.innerHTML = '';
        await finalizarRondaPinatas(puntaje);
    }
}

async function finalizarRondaPinatas(puntajeObtenido){
    vibrarJ([15, 30, 15]);
    try {
        const campo = miIdentidad === 'nico' ? 'terminoNico' : 'terminoCarito';
        const campoPtos = miIdentidad === 'nico' ? 'ptsFinalesNico' : 'ptsFinalesCarito';
        await window.updateDoc(refPinatas(), { [campo]: true, [campoPtos]: puntajeObtenido });
        const snap = await new Promise(res => { const u = window.onSnapshot(refPinatas(), s => { u(); res(s); }); });
        const data = snap.data();
        if (data.terminoNico && data.terminoCarito) {
            const puntajes = { nico: data.ptsFinalesNico || 0, carito: data.ptsFinalesCarito || 0 };
            await window.updateDoc(refPinatas(), { fase: 'terminado', puntajes });
            if (typeof registrarEvento === 'function') {
                registrarEvento('gano_partida', `Jugaron Derribá Piñatas (${puntajes.nico} - ${puntajes.carito})`);
            }
        }
    } catch (e) {
        console.error('No se pudo finalizar la ronda de piñatas:', e);
    }
    const cont = document.getElementById('contenido-pinatas');
    delete cont.dataset.jugandoLocal;
}

async function revanchaPinatas(){
    vibrarJ(10);
    const puntajes = await leerPuntajesPinatas();
    await window.setDoc(refPinatas(), { fase: 'esperando', listos: {}, puntajes });
}
