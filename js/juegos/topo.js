// ==================== TOPO VELOZ ====================
// Duelo en tiempo real, 25 segundos, mismo patrón que Derribá Piñatas:
// cada uno juega su propio tablero de 9 pozos en paralelo, el puntaje
// se sincroniza en vivo, y gana quien haya sumado más al terminar el
// tiempo. Acá el topo sale siempre de un pozo fijo de la grilla (no
// flota libre), así que hay que anticipar dónde va a aparecer.
const DURACION_TOPO = 25000;
const TIEMPO_VIDA_TOPO = 850;
const POZOS_TOPO = 9;

function refTopo(){ return window.doc(window.db, 'juegos', 'topo'); }

let _topoFaseAnterior = null;
function iniciarTopo(){
    if (window._detenerRondaTopo) { window._detenerRondaTopo(); window._detenerRondaTopo = null; }
    const cont = document.getElementById('contenido-topo');
    if (cont) delete cont.dataset.jugandoLocal;
    _topoFaseAnterior = null;
    if (window._unsubTopo) window._unsubTopo();
    window._unsubTopo = window.onSnapshot(refTopo(), (snap) => {
        const datos = snap.exists() ? snap.data() : null;
        if (datos && datos.fase === 'terminado' && _topoFaseAnterior && _topoFaseAnterior !== 'terminado' && window.sfx) {
            const p = datos.puntajes || { nico: 0, carito: 0 };
            if (p.nico === p.carito) window.sfx.empate();
            else window.sfx[(p.nico > p.carito ? 'nico' : 'carito') === miIdentidad ? 'victoria' : 'derrota']();
            if (window.fx && ((p.nico > p.carito ? 'nico' : 'carito') === miIdentidad)) window.fx.confeti();
        }
        _topoFaseAnterior = datos ? datos.fase : null;
        renderTopo(datos);
    }, (err) => {
        console.error('Error de Firestore en topo:', err);
        if (cont && cont.dataset.jugandoLocal !== '1') {
            cont.innerHTML = `<div class="panel texto-centro texto-tenue">⚠️ No se pudo conectar (${err.code || 'error'}).</div>`;
        }
    });
}

let _cuentaRegresivaTopo = null;
function renderTopo(estado){
    const cont = document.getElementById('contenido-topo');
    if (cont.dataset.jugandoLocal === '1') return;
    if (_cuentaRegresivaTopo) { clearTimeout(_cuentaRegresivaTopo); _cuentaRegresivaTopo = null; }

    if (!estado || estado.fase === 'esperando') {
        const listoYo = estado?.listos?.[miIdentidad];
        const listoRival = estado?.listos?.[miRival];
        const p = estado?.puntajes || { nico: 0, carito: 0 };
        cont.innerHTML = `<div class="panel texto-centro">
            <p class="texto-tenue">25 segundos. El topo aparece en un pozo al azar — tocalo antes de que se esconda.</p>
            <div class="texto-tenue" style="margin:10px 0;">Nico ${p.nico || 0} — Carito ${p.carito || 0}</div>
            <div class="texto-tenue" style="margin-bottom:10px;">
                ${nombreJugador(miIdentidad)}: ${listoYo ? '✅ listo/a' : '⏳ esperando'}<br>
                ${nombreJugador(miRival)}: ${listoRival ? '✅ listo/a' : '⏳ esperando'}
            </div>
            <button class="btn-principal" ${listoYo ? 'disabled style="opacity:0.5;"' : ''} onclick="marcarListoTopo()">${listoYo ? 'Esperando…' : '¡Estoy listo/a! 🔨'}</button>
        </div>`;
        if (listoYo && listoRival) iniciarRondaArcadeSiCorresponde(refTopo(), 'topo', DURACION_TOPO, { puntajeVivoNico: 0, puntajeVivoCarito: 0 });
        return;
    }

    if (estado.fase === 'jugando') {
        const restante = (estado.horaInicio || Date.now()) - Date.now();
        if (restante > -500) {
            if (!estado.horaInicio) repararRondaArcadeSiCorresponde(refTopo(), 'topo');
            cont.innerHTML = htmlCuentaRegresivaArcade(restante);
            _cuentaRegresivaTopo = setTimeout(() => renderTopo(estado), msHastaProximoTickArcade(restante));
            return;
        }
        jugarRondaTopo(estado.horaFin);
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
            <button class="btn-principal" style="margin-top:14px;" onclick="revanchaTopo()">🔁 Otra ronda</button>
        </div>`;
    }
}

async function marcarListoTopo(){
    vibrarJ(12);
    await marcarListoArcade(refTopo(), { puntajes: (await leerPuntajesTopo()) });
}
async function leerPuntajesTopo(){
    const snap = await new Promise(res => { const u = window.onSnapshot(refTopo(), s => { u(); res(s); }); });
    const data = snap.exists() ? snap.data() : null;
    return data?.puntajes || { nico: 0, carito: 0 };
}

function jugarRondaTopo(horaFin){
    const cont = document.getElementById('contenido-topo');
    cont.dataset.jugandoLocal = '1';
    let pozosHtml = '';
    for (let i = 0; i < POZOS_TOPO; i++) {
        pozosHtml += `<div class="pozo-topo" id="pozo-topo-${i}" onclick="tocarPozoTopo(${i})"><span class="topo-cara" id="topo-cara-${i}"></span></div>`;
    }
    cont.innerHTML = `
        <div class="panel">
            <div style="display:flex; justify-content:space-between; font-size:0.9rem; margin-bottom:8px;">
                <span>Vos: <b id="marcador-yo-topo">0</b></span>
                <span id="tiempo-topo">25s</span>
                <span>${nombreJugador(miRival)}: <b id="marcador-rival-topo">0</b></span>
            </div>
            <div class="grilla-topo">${pozosHtml}</div>
        </div>`;
    arrancarTopo(horaFin);
}

function arrancarTopo(horaFin){
    let puntaje = 0, terminando = false, pozoActivo = -1, idTopoActual = 0;
    let spawnTimeout = null, escondeTimeout = null, unsubRival = null;

    unsubRival = window.onSnapshot(refTopo(), (snap) => {
        const data = snap.exists() ? snap.data() : null;
        const el = document.getElementById('marcador-rival-topo');
        if (el && data) el.innerText = data[miRival === 'nico' ? 'puntajeVivoNico' : 'puntajeVivoCarito'] || 0;
    });

    function spawnTopo(){
        if (terminando) return;
        pozoActivo = Math.floor(Math.random() * POZOS_TOPO);
        idTopoActual++;
        const cara = document.getElementById('topo-cara-' + pozoActivo);
        if (cara) { cara.innerText = '🐹'; cara.classList.add('topo-arriba'); }
        const miId = idTopoActual;
        escondeTimeout = setTimeout(() => {
            if (idTopoActual !== miId) return;
            const c = document.getElementById('topo-cara-' + pozoActivo);
            if (c) { c.classList.remove('topo-arriba'); c.innerText = ''; }
            pozoActivo = -1;
            if (!terminando) spawnTimeout = setTimeout(spawnTopo, 200 + Math.random() * 350);
        }, TIEMPO_VIDA_TOPO);
    }
    spawnTimeout = setTimeout(spawnTopo, 400);

    window.tocarPozoTopo = function(idx){
        if (idx !== pozoActivo) return;
        idTopoActual++; // invalida el escondeTimeout pendiente de este topo
        const c = document.getElementById('topo-cara-' + idx);
        if (c) { c.classList.remove('topo-arriba'); c.innerText = '💫'; setTimeout(() => { if (c.innerText === '💫') c.innerText = ''; }, 200); }
        pozoActivo = -1;
        puntaje++;
        vibrarJ(12);
        if (window.sfx) window.sfx.golpe();
        const m = document.getElementById('marcador-yo-topo');
        if (m) m.innerText = puntaje;
        sincronizarPuntajeEnVivo(refTopo(), miIdentidad === 'nico' ? 'puntajeVivoNico' : 'puntajeVivoCarito', puntaje);
        if (!terminando) spawnTimeout = setTimeout(spawnTopo, 150 + Math.random() * 300);
    };

    function tick(){
        const el = document.getElementById('tiempo-topo');
        const seg = Math.max(0, Math.ceil((horaFin - Date.now()) / 1000));
        if (el) el.innerText = seg + 's';
        if (Date.now() >= horaFin) { terminar(); return; }
        window._timerTopo = setTimeout(tick, 200);
    }
    tick();

    window._detenerRondaTopo = function pararTimersTopo(){
        terminando = true;
        if (spawnTimeout) clearTimeout(spawnTimeout);
        if (escondeTimeout) clearTimeout(escondeTimeout);
        if (window._timerTopo) { clearTimeout(window._timerTopo); window._timerTopo = null; }
        if (unsubRival) unsubRival();
    };

    async function terminar(){
        if (terminando) return;
        window._detenerRondaTopo();
        window._detenerRondaTopo = null;
        await finalizarRondaTopo(puntaje);
    }
}

async function finalizarRondaTopo(puntajeObtenido){
    vibrarJ([15, 30, 15]);
    try {
        const campo = miIdentidad === 'nico' ? 'terminoNico' : 'terminoCarito';
        const campoPtos = miIdentidad === 'nico' ? 'ptsFinalesNico' : 'ptsFinalesCarito';
        await window.updateDoc(refTopo(), { [campo]: true, [campoPtos]: puntajeObtenido });
        const snap = await new Promise(res => { const u = window.onSnapshot(refTopo(), s => { u(); res(s); }); });
        const data = snap.data();
        if (data.terminoNico && data.terminoCarito) {
            const puntajes = { nico: data.ptsFinalesNico || 0, carito: data.ptsFinalesCarito || 0 };
            await window.updateDoc(refTopo(), { fase: 'terminado', puntajes });
            if (typeof registrarEvento === 'function') {
                registrarEvento('gano_partida', `Jugaron Topo Veloz (${puntajes.nico} - ${puntajes.carito})`);
            }
        }
    } catch (e) {
        console.error('No se pudo finalizar la ronda de topo:', e);
    }
    const cont = document.getElementById('contenido-topo');
    delete cont.dataset.jugandoLocal;
}

async function revanchaTopo(){
    vibrarJ(10);
    const puntajes = await leerPuntajesTopo();
    await window.setDoc(refTopo(), { fase: 'esperando', listos: {}, puntajes });
}
