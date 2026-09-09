// ==================== MARTILLO DE COCODRILOS ====================
// Colaborativo en tiempo real: tablero compartido de 9 pozos, los dos
// pueden martillar cualquiera. Meta conjunta en 30 segundos.
const DURACION_COCODRILOS = 30000;
const META_COCODRILOS = 35;
const CANTIDAD_POZOS = 9;

function refCocodrilos(){ return window.doc(window.db, 'juegos', 'cocodrilos'); }

function iniciarCocodrilos(){
    const cont = document.getElementById('contenido-cocodrilos');
    if (cont) delete cont.dataset.jugandoLocal;
    if (window._unsubCocodrilos) window._unsubCocodrilos();
    window._unsubCocodrilos = window.onSnapshot(refCocodrilos(), (snap) => {
        renderCocodrilos(snap.exists() ? snap.data() : null);
    }, (err) => {
        console.error('Error de Firestore en cocodrilos:', err);
        if (cont && cont.dataset.jugandoLocal !== '1') {
            cont.innerHTML = `<div class="panel texto-centro texto-tenue">⚠️ No se pudo conectar (${err.code || 'error'}).</div>`;
        }
    });
}

let _cuentaRegresivaCocodrilos = null;

function renderCocodrilos(estado){
    const cont = document.getElementById('contenido-cocodrilos');
    if (cont.dataset.jugandoLocal === '1') return;
    if (_cuentaRegresivaCocodrilos) { clearTimeout(_cuentaRegresivaCocodrilos); _cuentaRegresivaCocodrilos = null; }

    if (!estado || estado.fase === 'esperando') {
        const listoYo = estado?.listos?.[miIdentidad];
        const listoRival = estado?.listos?.[miRival];
        const mejor = estado?.mejorConjunto || 0;
        cont.innerHTML = `<div class="panel texto-centro">
            <p class="texto-tenue">Cooperativo: los dos martillan el mismo tablero. ¿Llegan a ${META_COCODRILOS} entre los dos en 30 segundos?</p>
            <div class="texto-tenue" style="margin:10px 0;">Mejor marca conjunta: ${mejor}</div>
            <div class="texto-tenue" style="margin-bottom:10px;">
                ${nombreJugador(miIdentidad)}: ${listoYo ? '✅ listo/a' : '⏳ esperando'}<br>
                ${nombreJugador(miRival)}: ${listoRival ? '✅ listo/a' : '⏳ esperando'}
            </div>
            <button class="btn-principal" ${listoYo ? 'disabled style="opacity:0.5;"' : ''} onclick="marcarListoCocodrilos()">${listoYo ? 'Esperando…' : '¡Estoy listo/a! 🐊'}</button>
        </div>`;
        if (listoYo && listoRival) {
            iniciarRondaArcadeSiCorresponde(refCocodrilos(), 'cocodrilos', DURACION_COCODRILOS, {
                contador: 0, pozos: new Array(CANTIDAD_POZOS).fill(false)
            });
        }
        return;
    }

    if (estado.fase === 'jugando') {
        const restante = (estado.horaInicio || Date.now()) - Date.now();
        if (restante > 0) {
            cont.innerHTML = `<div class="panel texto-centro" style="font-size:2rem;">${Math.ceil(restante / 1000)}</div>`;
            _cuentaRegresivaCocodrilos = setTimeout(() => renderCocodrilos(estado), Math.min(restante, 200));
            return;
        }
        renderTableroCocodrilos(estado);
        arrancarSpawnCocodrilosSiCorresponde(estado.horaFin);
        return;
    }

    if (estado.fase === 'terminado') {
        const lograron = estado.contador >= META_COCODRILOS;
        cont.innerHTML = `<div class="panel texto-centro logro-animado">
            <div style="font-size:1.2rem; margin-bottom:6px;">${lograron ? '🎉 ¡Lo lograron!' : '⏰ Se acabó el tiempo'}</div>
            <div style="font-size:1.6rem;">${estado.contador} / ${META_COCODRILOS}</div>
            <button class="btn-principal" style="margin-top:14px;" onclick="revanchaCocodrilos()">🔁 Otra ronda</button>
        </div>`;
    }
}

async function marcarListoCocodrilos(){
    vibrarJ(12);
    await marcarListoArcade(refCocodrilos(), { mejorConjunto: (await leerMejorCocodrilos()) });
}
async function leerMejorCocodrilos(){
    const snap = await new Promise(res => { const u = window.onSnapshot(refCocodrilos(), s => { u(); res(s); }); });
    const data = snap.exists() ? snap.data() : null;
    return data?.mejorConjunto || 0;
}

let _cocodrilosMostrados = false;
function renderTableroCocodrilos(estado){
    const cont = document.getElementById('contenido-cocodrilos');
    if (_cocodrilosMostrados) {
        // Ya está el tablero armado: sólo actualizamos contador y pozos.
        const marcador = document.getElementById('contador-cocodrilos');
        if (marcador) marcador.innerText = `${estado.contador} / ${META_COCODRILOS}`;
        (estado.pozos || []).forEach((activo, i) => {
            const el = document.getElementById('pozo-cocodrilo-' + i);
            if (el) el.innerText = activo ? '🐊' : '🕳️';
        });
        return;
    }
    _cocodrilosMostrados = true;
    let html = `<div class="panel texto-centro">
        <div id="contador-cocodrilos" style="font-size:1.4rem;">0 / ${META_COCODRILOS}</div>
        <div id="tiempo-cocodrilos" class="texto-tenue">30s</div>
    </div>
    <div class="panel"><div style="display:grid; grid-template-columns:repeat(3,1fr); gap:10px;">`;
    for (let i = 0; i < CANTIDAD_POZOS; i++) {
        html += `<div id="pozo-cocodrilo-${i}" onclick="martillarCocodrilo(${i})" style="aspect-ratio:1; display:flex; align-items:center; justify-content:center; font-size:2.2rem; background:rgba(0,0,0,0.2); border-radius:14px; cursor:pointer;">🕳️</div>`;
    }
    html += `</div></div>`;
    cont.innerHTML = html;
}

async function martillarCocodrilo(indice){
    const snap = await new Promise(res => { const u = window.onSnapshot(refCocodrilos(), s => { u(); res(s); }); });
    const data = snap.data();
    if (!data || data.fase !== 'jugando' || !data.pozos[indice]) return;
    vibrarJ(15);
    const pozos = [...data.pozos];
    pozos[indice] = false;
    await window.updateDoc(refCocodrilos(), { pozos, contador: (data.contador || 0) + 1 });
}

let _spawnCocodrilosActivo = false;
function arrancarSpawnCocodrilosSiCorresponde(horaFin){
    if (_spawnCocodrilosActivo) return;
    _spawnCocodrilosActivo = true;

    function tick(){
        const el = document.getElementById('tiempo-cocodrilos');
        const seg = Math.max(0, Math.ceil((horaFin - Date.now()) / 1000));
        if (el) el.innerText = seg + 's';
        if (Date.now() >= horaFin) { finalizarRondaCocodrilos(); return; }
        window._timerCocodrilos = setTimeout(tick, 200);
    }
    tick();

    async function spawnLoop(){
        if (Date.now() >= horaFin) return;
        try {
            const snap = await new Promise(res => { const u = window.onSnapshot(refCocodrilos(), s => { u(); res(s); }); });
            const data = snap.data();
            if (data && data.fase === 'jugando') {
                const libres = data.pozos.map((v, i) => v ? -1 : i).filter(i => i >= 0);
                if (libres.length && Math.random() < 0.6) {
                    const idx = libres[Math.floor(Math.random() * libres.length)];
                    const pozos = [...data.pozos];
                    pozos[idx] = true;
                    await window.updateDoc(refCocodrilos(), { pozos });
                    setTimeout(async () => {
                        const snap2 = await new Promise(res => { const u = window.onSnapshot(refCocodrilos(), s => { u(); res(s); }); });
                        const d2 = snap2.data();
                        if (d2 && d2.fase === 'jugando' && d2.pozos[idx]) {
                            const p2 = [...d2.pozos]; p2[idx] = false;
                            window.updateDoc(refCocodrilos(), { pozos: p2 }).catch(() => {});
                        }
                    }, 900);
                }
            }
        } catch (e) { /* silencioso */ }
        if (Date.now() < horaFin) window._spawnLoopCocodrilos = setTimeout(spawnLoop, 700);
    }
    spawnLoop();
}

let _finalizandoCocodrilos = false;
async function finalizarRondaCocodrilos(){
    if (_finalizandoCocodrilos) return;
    _finalizandoCocodrilos = true;
    if (window._timerCocodrilos) clearTimeout(window._timerCocodrilos);
    if (window._spawnLoopCocodrilos) clearTimeout(window._spawnLoopCocodrilos);
    _spawnCocodrilosActivo = false;
    _cocodrilosMostrados = false;
    try {
        const snap = await new Promise(res => { const u = window.onSnapshot(refCocodrilos(), s => { u(); res(s); }); });
        const data = snap.data();
        if (data.fase !== 'terminado') {
            const mejorConjunto = Math.max(data.mejorConjunto || 0, data.contador || 0);
            await window.updateDoc(refCocodrilos(), { fase: 'terminado', mejorConjunto });
            if ((data.contador || 0) >= META_COCODRILOS && typeof registrarEvento === 'function') {
                registrarEvento('cuidado_compartido', `Lograron la meta juntos en Martillo de Cocodrilos`);
            }
        }
    } catch (e) { console.error('No se pudo finalizar cocodrilos:', e); }
    _finalizandoCocodrilos = false;
}

async function revanchaCocodrilos(){
    vibrarJ(10);
    const mejorConjunto = await leerMejorCocodrilos();
    _cocodrilosMostrados = false;
    await window.setDoc(refCocodrilos(), { fase: 'esperando', listos: {}, mejorConjunto });
}
