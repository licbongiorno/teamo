// ==================== PESCA COOPERATIVA ====================
// Colaborativo: peces cruzan la pantalla, cualquiera puede tocarlos.
// Meta conjunta en 30 segundos. Cada dispositivo genera sus propios
// peces localmente (más peces si los dos están activos a la vez, es
// parte de la gracia de jugarlo juntos).
const DURACION_PESCA = 30000;
const META_PESCA = 25;
const EMOJI_PECES = ['🐟', '🐠', '🐡'];

function refPesca(){ return window.doc(window.db, 'juegos', 'pesca'); }

function iniciarPesca(){
    const cont = document.getElementById('contenido-pesca');
    if (cont) delete cont.dataset.jugandoLocal;
    if (window._unsubPesca) window._unsubPesca();
    window._unsubPesca = window.onSnapshot(refPesca(), (snap) => {
        renderPesca(snap.exists() ? snap.data() : null);
    }, (err) => {
        console.error('Error de Firestore en pesca:', err);
        if (cont && cont.dataset.jugandoLocal !== '1') {
            cont.innerHTML = `<div class="panel texto-centro texto-tenue">⚠️ No se pudo conectar (${err.code || 'error'}).</div>`;
        }
    });
}

let _cuentaRegresivaPesca = null;

function renderPesca(estado){
    const cont = document.getElementById('contenido-pesca');
    if (cont.dataset.jugandoLocal === '1') return;
    if (_cuentaRegresivaPesca) { clearTimeout(_cuentaRegresivaPesca); _cuentaRegresivaPesca = null; }

    if (!estado || estado.fase === 'esperando') {
        const listoYo = estado?.listos?.[miIdentidad];
        const listoRival = estado?.listos?.[miRival];
        const mejor = estado?.mejorConjunto || 0;
        cont.innerHTML = `<div class="panel texto-centro">
            <p class="texto-tenue">Cooperativo: entre los dos, ¿pescan ${META_PESCA} peces en 30 segundos?</p>
            <div class="texto-tenue" style="margin:10px 0;">Mejor marca conjunta: ${mejor}</div>
            <div class="texto-tenue" style="margin-bottom:10px;">
                ${nombreJugador(miIdentidad)}: ${listoYo ? '✅ listo/a' : '⏳ esperando'}<br>
                ${nombreJugador(miRival)}: ${listoRival ? '✅ listo/a' : '⏳ esperando'}
            </div>
            <button class="btn-principal" ${listoYo ? 'disabled style="opacity:0.5;"' : ''} onclick="marcarListoPesca()">${listoYo ? 'Esperando…' : '¡Estoy listo/a! 🎣'}</button>
        </div>`;
        if (listoYo && listoRival) iniciarRondaArcadeSiCorresponde(refPesca(), 'pesca', DURACION_PESCA, { contador: 0 });
        return;
    }

    if (estado.fase === 'jugando') {
        const restante = (estado.horaInicio || Date.now()) - Date.now();
        if (restante > 0) {
            cont.innerHTML = `<div class="panel texto-centro" style="font-size:2rem;">${Math.ceil(restante / 1000)}</div>`;
            _cuentaRegresivaPesca = setTimeout(() => renderPesca(estado), Math.min(restante, 200));
            return;
        }
        jugarRondaPesca(estado.horaFin);
        return;
    }

    if (estado.fase === 'terminado') {
        const lograron = estado.contador >= META_PESCA;
        cont.innerHTML = `<div class="panel texto-centro logro-animado">
            <div style="font-size:1.2rem; margin-bottom:6px;">${lograron ? '🎉 ¡Llenaron la red!' : '⏰ Se acabó el tiempo'}</div>
            <div style="font-size:1.6rem;">${estado.contador} / ${META_PESCA} 🐟</div>
            <button class="btn-principal" style="margin-top:14px;" onclick="revanchaPesca()">🔁 Otra ronda</button>
        </div>`;
    }
}

async function marcarListoPesca(){
    vibrarJ(12);
    await marcarListoArcade(refPesca(), { mejorConjunto: (await leerMejorPesca()) });
}
async function leerMejorPesca(){
    const snap = await new Promise(res => { const u = window.onSnapshot(refPesca(), s => { u(); res(s); }); });
    const data = snap.exists() ? snap.data() : null;
    return data?.mejorConjunto || 0;
}

function jugarRondaPesca(horaFin){
    const cont = document.getElementById('contenido-pesca');
    cont.dataset.jugandoLocal = '1';
    cont.innerHTML = `
        <div class="panel">
            <div style="display:flex; justify-content:space-between; font-size:0.95rem; margin-bottom:8px;">
                <span id="contador-pesca">0 / ${META_PESCA}</span>
                <span id="tiempo-pesca">30s</span>
            </div>
            <div style="position:relative; width:100%; aspect-ratio:4/3; max-height:55vh; background:linear-gradient(180deg, rgba(50,120,200,0.25), rgba(10,40,80,0.35)); border-radius:14px; overflow:hidden;" id="area-pesca">
                <canvas id="canvas-pesca" style="position:absolute; inset:0; width:100%; height:100%;"></canvas>
            </div>
            <p class="texto-tenue texto-centro" style="margin-top:8px;">Tocá los peces 🐟 apenas crucen</p>
        </div>`;
    arrancarCanvasPesca(horaFin);
}

function arrancarCanvasPesca(horaFin){
    const canvas = document.getElementById('canvas-pesca');
    if (!canvas) return;
    const area = document.getElementById('area-pesca');
    const ctx = canvas.getContext('2d');
    function ajustar(){ canvas.width = area.clientWidth; canvas.height = area.clientHeight; }
    ajustar();
    window.addEventListener('resize', ajustar);

    let objetos = [], terminando = false, spawnAcumulado = 0;
    let unsubContador = window.onSnapshot(refPesca(), (snap) => {
        const data = snap.exists() ? snap.data() : null;
        const el = document.getElementById('contador-pesca');
        if (el && data) el.innerText = `${data.contador || 0} / ${META_PESCA}`;
    });

    function spawnPez(){
        const deIzqADer = Math.random() < 0.5;
        objetos.push({
            x: deIzqADer ? -20 : canvas.width + 20,
            y: 20 + Math.random() * (canvas.height - 40),
            vel: (1.2 + Math.random() * 1.8) * (deIzqADer ? 1 : -1),
            emoji: EMOJI_PECES[Math.floor(Math.random() * EMOJI_PECES.length)],
            r: 18
        });
    }

    async function atrapar(o){
        vibrarJ(12);
        try {
            const snap = await new Promise(res => { const u = window.onSnapshot(refPesca(), s => { u(); res(s); }); });
            const data = snap.data();
            if (data && data.fase === 'jugando') {
                await window.updateDoc(refPesca(), { contador: (data.contador || 0) + 1 });
            }
        } catch (e) { /* silencioso */ }
    }

    function onTap(clientX, clientY){
        const rect = canvas.getBoundingClientRect();
        const x = clientX - rect.left, y = clientY - rect.top;
        for (let i = objetos.length - 1; i >= 0; i--) {
            const o = objetos[i];
            if (Math.hypot(o.x - x, o.y - y) < o.r + 10) {
                objetos.splice(i, 1);
                atrapar(o);
                break;
            }
        }
    }
    const onClick = (e) => onTap(e.clientX, e.clientY);
    const onTouch = (e) => { e.preventDefault(); if (e.changedTouches[0]) onTap(e.changedTouches[0].clientX, e.changedTouches[0].clientY); };
    canvas.addEventListener('click', onClick);
    canvas.addEventListener('touchstart', onTouch, { passive: false });

    async function terminar(){
        if (terminando) return;
        terminando = true;
        window.removeEventListener('resize', ajustar);
        canvas.removeEventListener('click', onClick);
        canvas.removeEventListener('touchstart', onTouch);
        if (unsubContador) unsubContador();
        await finalizarRondaPesca();
    }

    function loop(){
        if (terminando) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        spawnAcumulado++;
        if (spawnAcumulado > 40) { spawnPez(); spawnAcumulado = 0; }
        ctx.font = '30px sans-serif';
        ctx.textAlign = 'center';
        for (let i = objetos.length - 1; i >= 0; i--) {
            const o = objetos[i];
            o.x += o.vel;
            ctx.save();
            if (o.vel < 0) { ctx.translate(o.x, o.y); ctx.scale(-1, 1); ctx.fillText(o.emoji, 0, 8); }
            else ctx.fillText(o.emoji, o.x, o.y + 8);
            ctx.restore();
            if (o.x < -30 || o.x > canvas.width + 30) objetos.splice(i, 1);
        }
        const el = document.getElementById('tiempo-pesca');
        const seg = Math.max(0, Math.ceil((horaFin - Date.now()) / 1000));
        if (el) el.innerText = seg + 's';
        if (Date.now() >= horaFin) { terminar(); return; }
        window._loopPesca = requestAnimationFrame(loop);
    }
    loop();
}

let _finalizandoPesca = false;
async function finalizarRondaPesca(){
    if (_finalizandoPesca) return;
    _finalizandoPesca = true;
    vibrarJ([15, 30, 15]);
    try {
        const snap = await new Promise(res => { const u = window.onSnapshot(refPesca(), s => { u(); res(s); }); });
        const data = snap.data();
        if (data.fase !== 'terminado') {
            const mejorConjunto = Math.max(data.mejorConjunto || 0, data.contador || 0);
            await window.updateDoc(refPesca(), { fase: 'terminado', mejorConjunto });
            if ((data.contador || 0) >= META_PESCA && typeof registrarEvento === 'function') {
                registrarEvento('cuidado_compartido', `Lograron la meta juntos en Pesca Cooperativa`);
            }
        }
    } catch (e) {
        console.error('No se pudo finalizar la pesca:', e);
    }
    const cont = document.getElementById('contenido-pesca');
    if (cont) delete cont.dataset.jugandoLocal;
    _finalizandoPesca = false;
}

async function revanchaPesca(){
    vibrarJ(10);
    const mejorConjunto = await leerMejorPesca();
    await window.setDoc(refPesca(), { fase: 'esperando', listos: {}, mejorConjunto });
}
