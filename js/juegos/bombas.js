// ==================== ESQUIVÁ LAS BOMBAS ====================
// Duelo en tiempo real: los dos arrancan juntos, 30 segundos, corazones
// y bombas que cruzan HORIZONTAL. Los corazones suman, las bombas
// restan si las tocás.
const DURACION_BOMBAS = 30000;
const PROB_BOMBA_BOMBAS = 0.22;

function refBombas(){ return window.doc(window.db, 'juegos', 'bombas'); }

function iniciarBombas(){
    const cont = document.getElementById('contenido-bombas');
    if (cont) delete cont.dataset.jugandoLocal;
    if (window._unsubBombas) window._unsubBombas();
    window._unsubBombas = window.onSnapshot(refBombas(), (snap) => {
        renderBombas(snap.exists() ? snap.data() : null);
    }, (err) => {
        console.error('Error de Firestore en bombas:', err);
        if (cont && cont.dataset.jugandoLocal !== '1') {
            cont.innerHTML = `<div class="panel texto-centro texto-tenue">⚠️ No se pudo conectar (${err.code || 'error'}).</div>`;
        }
    });
}

let _cuentaRegresivaBombas = null;

function renderBombas(estado){
    const cont = document.getElementById('contenido-bombas');
    if (cont.dataset.jugandoLocal === '1') return;
    if (_cuentaRegresivaBombas) { clearTimeout(_cuentaRegresivaBombas); _cuentaRegresivaBombas = null; }

    if (!estado || estado.fase === 'esperando') {
        const listoYo = estado?.listos?.[miIdentidad];
        const listoRival = estado?.listos?.[miRival];
        const p = estado?.puntajes || { nico: 0, carito: 0 };
        cont.innerHTML = `<div class="panel texto-centro">
            <p class="texto-tenue">30 segundos. Los corazones suman, las bombas restan si las tocás. Gana quien tenga más puntos.</p>
            <div class="texto-tenue" style="margin:10px 0;">Nico ${p.nico || 0} — Carito ${p.carito || 0}</div>
            <div class="texto-tenue" style="margin-bottom:10px;">
                ${nombreJugador(miIdentidad)}: ${listoYo ? '✅ listo/a' : '⏳ esperando'}<br>
                ${nombreJugador(miRival)}: ${listoRival ? '✅ listo/a' : '⏳ esperando'}
            </div>
            <button class="btn-principal" ${listoYo ? 'disabled style="opacity:0.5;"' : ''} onclick="marcarListoBombas()">${listoYo ? 'Esperando…' : '¡Estoy listo/a! 🫧'}</button>
        </div>`;
        if (listoYo && listoRival) iniciarRondaArcadeSiCorresponde(refBombas(), 'bombas', DURACION_BOMBAS, { puntajeVivoNico: 0, puntajeVivoCarito: 0 });
        return;
    }

    if (estado.fase === 'jugando') {
        const restante = (estado.horaInicio || Date.now()) - Date.now();
        if (restante > 0) {
            cont.innerHTML = `<div class="panel texto-centro" style="font-size:2rem;">${Math.ceil(restante / 1000)}</div>`;
            _cuentaRegresivaBombas = setTimeout(() => renderBombas(estado), Math.min(restante, 200));
            return;
        }
        jugarRondaBombas(estado.horaFin);
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
            <button class="btn-principal" style="margin-top:14px;" onclick="revanchaBombas()">🔁 Otra ronda</button>
        </div>`;
    }
}

async function marcarListoBombas(){
    vibrarJ(12);
    await marcarListoArcade(refBombas(), { puntajes: (await leerPuntajesBombas()) });
}
async function leerPuntajesBombas(){
    const snap = await new Promise(res => { const u = window.onSnapshot(refBombas(), s => { u(); res(s); }); });
    const data = snap.exists() ? snap.data() : null;
    return data?.puntajes || { nico: 0, carito: 0 };
}

function jugarRondaBombas(horaFin){
    const cont = document.getElementById('contenido-bombas');
    cont.dataset.jugandoLocal = '1';
    cont.innerHTML = `
        <div class="panel">
            <div style="display:flex; justify-content:space-between; font-size:0.9rem; margin-bottom:8px;">
                <span>Vos: <b id="marcador-yo-bombas">0</b></span>
                <span id="tiempo-bombas">30s</span>
                <span>${nombreJugador(miRival)}: <b id="marcador-rival-bombas">0</b></span>
            </div>
            <div style="position:relative; width:100%; aspect-ratio:4/3; max-height:55vh; background:rgba(0,0,0,0.25); border-radius:14px; overflow:hidden;" id="area-bombas">
                <canvas id="canvas-bombas" style="position:absolute; inset:0; width:100%; height:100%;"></canvas>
            </div>
            <p class="texto-tenue texto-centro" style="margin-top:8px;">Atrapá los corazones ❤️ — evitá las bombas 💣</p>
        </div>`;
    arrancarCanvasBombas(horaFin);
}

function arrancarCanvasBombas(horaFin){
    const canvas = document.getElementById('canvas-bombas');
    if (!canvas) return;
    const area = document.getElementById('area-bombas');
    const ctx = canvas.getContext('2d');
    function ajustar(){ canvas.width = area.clientWidth; canvas.height = area.clientHeight; }
    ajustar();
    window.addEventListener('resize', ajustar);

    let objetos = [];
    let puntaje = 0;
    let terminando = false;
    let spawnAcumulado = 0;
    let unsubRival = null;

    unsubRival = window.onSnapshot(refBombas(), (snap) => {
        const data = snap.exists() ? snap.data() : null;
        const el = document.getElementById('marcador-rival-bombas');
        if (el && data) el.innerText = data[miRival === 'nico' ? 'puntajeVivoNico' : 'puntajeVivoCarito'] || 0;
    });

    function spawnCorazonOBomba(){
        const esBomba = Math.random() < PROB_BOMBA_BOMBAS;
        objetos.push({
            x: canvas.width + 20,
            y: 20 + Math.random() * (canvas.height - 40),
            vel: 1.4 + Math.random() * 2,
            r: 16 + Math.random() * 10,
            esBomba
        });
    }

    function onTap(clientX, clientY){
        const rect = canvas.getBoundingClientRect();
        const x = clientX - rect.left, y = clientY - rect.top;
        for (let i = objetos.length - 1; i >= 0; i--) {
            const o = objetos[i];
            if (Math.hypot(o.x - x, o.y - y) < o.r + 8) {
                objetos.splice(i, 1);
                if (o.esBomba) { puntaje = Math.max(0, puntaje - 1); vibrarJ([10, 30, 10]); }
                else { puntaje++; vibrarJ(10); }
                const marcador = document.getElementById('marcador-yo-bombas');
                if (marcador) marcador.innerText = puntaje;
                sincronizarPuntajeEnVivo(refBombas(), miIdentidad === 'nico' ? 'puntajeVivoNico' : 'puntajeVivoCarito', puntaje);
                break;
            }
        }
    }
    const onClick = (e) => onTap(e.clientX, e.clientY);
    const onTouch = (e) => { e.preventDefault(); if (e.changedTouches[0]) onTap(e.changedTouches[0].clientX, e.changedTouches[0].clientY); };
    canvas.addEventListener('click', onClick);
    canvas.addEventListener('touchstart', onTouch, { passive: false });

    function actualizarTiempo(){
        const el = document.getElementById('tiempo-bombas');
        const seg = Math.max(0, Math.ceil((horaFin - Date.now()) / 1000));
        if (el) el.innerText = seg + 's';
    }

    async function terminar(){
        if (terminando) return;
        terminando = true;
        window.removeEventListener('resize', ajustar);
        canvas.removeEventListener('click', onClick);
        canvas.removeEventListener('touchstart', onTouch);
        if (unsubRival) unsubRival();
        await finalizarRondaBombas(puntaje);
    }

    function loop(){
        if (terminando) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        spawnAcumulado++;
        if (spawnAcumulado > 34) { spawnCorazonOBomba(); spawnAcumulado = 0; }
        for (let i = objetos.length - 1; i >= 0; i--) {
            const o = objetos[i];
            o.x -= o.vel;
            ctx.font = `${o.r * 1.8}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.fillText(o.esBomba ? '💣' : '❤️', o.x, o.y + o.r / 2);
            if (o.x < -30) objetos.splice(i, 1);
        }
        actualizarTiempo();
        if (Date.now() >= horaFin) { terminar(); return; }
        window._loopBombas = requestAnimationFrame(loop);
    }
    loop();
}

async function finalizarRondaBombas(puntajeObtenido){
    vibrarJ([15, 30, 15]);
    try {
        const campo = miIdentidad === 'nico' ? 'terminoNico' : 'terminoCarito';
        const campoPtos = miIdentidad === 'nico' ? 'ptsFinalesNico' : 'ptsFinalesCarito';
        await window.updateDoc(refBombas(), { [campo]: true, [campoPtos]: puntajeObtenido });
        const snap = await new Promise(res => { const u = window.onSnapshot(refBombas(), s => { u(); res(s); }); });
        const data = snap.data();
        if (data.terminoNico && data.terminoCarito) {
            const puntajes = { nico: data.ptsFinalesNico || 0, carito: data.ptsFinalesCarito || 0 };
            await window.updateDoc(refBombas(), { fase: 'terminado', puntajes });
            if (typeof registrarEvento === 'function') {
                registrarEvento('gano_partida', `Jugaron Esquivá las Bombas (${puntajes.nico} - ${puntajes.carito})`);
            }
        }
    } catch (e) {
        console.error('No se pudo finalizar la ronda de bombas:', e);
    }
    const cont = document.getElementById('contenido-bombas');
    delete cont.dataset.jugandoLocal;
}

async function revanchaBombas(){
    vibrarJ(10);
    const puntajes = await leerPuntajesBombas();
    await window.setDoc(refBombas(), { fase: 'esperando', listos: {}, puntajes });
}
