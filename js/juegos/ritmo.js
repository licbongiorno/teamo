// ==================== RITMO A DÚO ====================
// Duelo en tiempo real: un pulso se repite cada 1.2s durante 16 pulsos.
// Cada uno toca cuando cree que "es el momento" — se mide qué tan
// cerca estuvo del pulso exacto. Gana quien tenga mejor precisión
// promedio (menor diferencia en milisegundos).
const INTERVALO_RITMO_MS = 1200;
const PULSOS_RITMO = 16;

function refRitmo(){ return window.doc(window.db, 'juegos', 'ritmo'); }

let _ritmoFaseAnterior = null;
function iniciarRitmo(){
    // Por si quedó el loop de una ronda anterior corriendo (se salió de
    // esta pantalla a mitad de partida y se volvió a entrar antes de
    // que terminara sola): lo apagamos antes de que se pueda arrancar
    // uno nuevo en paralelo, que si no terminaban compitiendo por
    // escribir el resultado con datos de pulsos mezclados.
    if (window._tickRitmoTimeout) { clearTimeout(window._tickRitmoTimeout); window._tickRitmoTimeout = null; }
    const cont = document.getElementById('contenido-ritmo');
    if (cont) delete cont.dataset.jugandoLocal;
    _ritmoFaseAnterior = null;
    if (window._unsubRitmo) window._unsubRitmo();
    window._unsubRitmo = window.onSnapshot(refRitmo(), (snap) => {
        const datos = snap.exists() ? snap.data() : null;
        if (datos && datos.fase === 'terminado' && _ritmoFaseAnterior && _ritmoFaseAnterior !== 'terminado' && window.sfx) {
            if (!datos.ganador) window.sfx.empate();
            else window.sfx[datos.ganador === miIdentidad ? 'victoria' : 'derrota']();
            if (window.fx && (datos.ganador === miIdentidad)) window.fx.confeti();
        }
        _ritmoFaseAnterior = datos ? datos.fase : null;
        renderRitmo(datos);
    }, (err) => {
        console.error('Error de Firestore en ritmo:', err);
        if (cont && cont.dataset.jugandoLocal !== '1') {
            cont.innerHTML = `<div class="panel texto-centro texto-tenue">⚠️ No se pudo conectar (${err.code || 'error'}).</div>`;
        }
    });
}

let _cuentaRegresivaRitmo = null;

function renderRitmo(estado){
    const cont = document.getElementById('contenido-ritmo');
    if (cont.dataset.jugandoLocal === '1') return;
    if (_cuentaRegresivaRitmo) { clearTimeout(_cuentaRegresivaRitmo); _cuentaRegresivaRitmo = null; }

    if (!estado || estado.fase === 'esperando') {
        const listoYo = estado?.listos?.[miIdentidad];
        const listoRival = estado?.listos?.[miRival];
        const v = estado?.victorias || { nico: 0, carito: 0 };
        cont.innerHTML = `<div class="panel texto-centro">
            <p class="texto-tenue">Un círculo late cada poco más de un segundo, ${PULSOS_RITMO} veces. Tocá justo cuando se agranda del todo — gana quien tenga mejor puntería promedio.</p>
            <div class="texto-tenue" style="margin:10px 0;">Rondas ganadas — Nico ${v.nico || 0} — Carito ${v.carito || 0}</div>
            <div class="texto-tenue" style="margin-bottom:10px;">
                ${nombreJugador(miIdentidad)}: ${listoYo ? '✅ listo/a' : '⏳ esperando'}<br>
                ${nombreJugador(miRival)}: ${listoRival ? '✅ listo/a' : '⏳ esperando'}
            </div>
            <button class="btn-principal" ${listoYo ? 'disabled style="opacity:0.5;"' : ''} onclick="marcarListoRitmo()">${listoYo ? 'Esperando…' : '¡Estoy listo/a! 🥁'}</button>
        </div>`;
        if (listoYo && listoRival) iniciarRondaArcadeSiCorresponde(refRitmo(), 'ritmo', INTERVALO_RITMO_MS * PULSOS_RITMO + 3000, {});
        return;
    }

    if (estado.fase === 'jugando') {
        const restante = (estado.horaInicio || Date.now()) - Date.now();
        if (restante > -500) {
            if (!estado.horaInicio) repararRondaArcadeSiCorresponde(refRitmo(), 'ritmo');
            cont.innerHTML = htmlCuentaRegresivaArcade(restante);
            _cuentaRegresivaRitmo = setTimeout(() => renderRitmo(estado), msHastaProximoTickArcade(restante));
            return;
        }
        jugarRondaRitmo(estado.horaInicio);
        return;
    }

    if (estado.fase === 'terminado') {
        const v = estado.victorias || { nico: 0, carito: 0 };
        const pNico = estado.precisionNico, pCarito = estado.precisionCarito;
        cont.innerHTML = `<div class="panel texto-centro logro-animado">
            <div style="font-size:1.2rem; margin-bottom:6px;">${estado.ganador ? `🏆 ¡Ganó ${nombreJugador(estado.ganador)}!` : '🤝 ¡Empataron!'}</div>
            <div class="texto-tenue">Nico: ${pNico != null ? Math.round(pNico) + 'ms de error prom.' : 'sin datos'}</div>
            <div class="texto-tenue">Carito: ${pCarito != null ? Math.round(pCarito) + 'ms de error prom.' : 'sin datos'}</div>
            <div class="texto-tenue" style="margin-top:8px;">Rondas ganadas — Nico ${v.nico} — Carito ${v.carito}</div>
            <button class="btn-principal" style="margin-top:14px;" onclick="revanchaRitmo()">🔁 Otra ronda</button>
        </div>`;
    }
}

async function marcarListoRitmo(){
    vibrarJ(12);
    await marcarListoArcade(refRitmo(), { victorias: (await leerVictoriasRitmo()) });
}
async function leerVictoriasRitmo(){
    const snap = await new Promise(res => { const u = window.onSnapshot(refRitmo(), s => { u(); res(s); }); });
    const data = snap.exists() ? snap.data() : null;
    return data?.victorias || { nico: 0, carito: 0 };
}

function jugarRondaRitmo(horaInicio){
    const cont = document.getElementById('contenido-ritmo');
    cont.dataset.jugandoLocal = '1';
    cont.innerHTML = `
        <div class="panel texto-centro">
            <div id="pulso-ritmo" class="texto-centro" style="font-size:4rem; transition:transform 0.15s ease;">🔴</div>
            <div class="texto-tenue" id="contador-pulso-ritmo" style="margin-top:8px;">Pulso 0 / ${PULSOS_RITMO}</div>
            <div class="texto-tenue" id="ultimo-toque-ritmo" style="margin-top:4px; min-height:1.2em;"></div>
        </div>
        <div class="panel texto-centro">
            <button class="btn-principal" style="width:100%; padding:24px 0; font-size:1.1rem;" ontouchstart="event.preventDefault(); tocarRitmo();" onclick="tocarRitmo()">TOCÁ AL COMPÁS</button>
        </div>`;
    arrancarLoopRitmo(horaInicio);
}

let _erroresRitmo = [];
let _pulsoActualRitmo = 0;
let _yaTocoEstePulsoRitmo = false;
let _horaUltimoPulsoRitmo = 0;

function arrancarLoopRitmo(horaInicio){
    _erroresRitmo = [];
    _pulsoActualRitmo = 0;
    _yaTocoEstePulsoRitmo = false;

    function marcarPulso(){
        _pulsoActualRitmo++;
        _yaTocoEstePulsoRitmo = false;
        _horaUltimoPulsoRitmo = performance.now();
        const el = document.getElementById('pulso-ritmo');
        if (el) { el.style.transform = 'scale(1.4)'; setTimeout(() => { if (el) el.style.transform = 'scale(1)'; }, 150); }
        vibrarJ(8);
        if (window.sfx) window.sfx.tick();
        const c = document.getElementById('contador-pulso-ritmo');
        if (c) c.innerText = `Pulso ${_pulsoActualRitmo} / ${PULSOS_RITMO}`;

        if (_pulsoActualRitmo >= PULSOS_RITMO) {
            window._tickRitmoTimeout = setTimeout(() => terminarRitmo(), INTERVALO_RITMO_MS / 2);
            return;
        }
        window._tickRitmoTimeout = setTimeout(marcarPulso, INTERVALO_RITMO_MS);
    }
    const esperar = Math.max(0, horaInicio - Date.now());
    window._tickRitmoTimeout = setTimeout(marcarPulso, esperar);
}

function tocarRitmo(){
    if (_yaTocoEstePulsoRitmo || _pulsoActualRitmo === 0) return;
    _yaTocoEstePulsoRitmo = true;
    vibrarJ(10);
    const ahora = performance.now();
    const error = Math.abs(ahora - _horaUltimoPulsoRitmo);
    if (window.sfx) window.sfx[error < 150 ? 'acierto' : 'toque']();
    _erroresRitmo.push(error);
    const u = document.getElementById('ultimo-toque-ritmo');
    if (u) u.innerText = error < 150 ? '🎯 ¡Justo!' : error < 350 ? '👍 Cerca' : '😅 Lejos';
}

async function terminarRitmo(){
    if (window._tickRitmoTimeout) { clearTimeout(window._tickRitmoTimeout); window._tickRitmoTimeout = null; }
    vibrarJ([15, 30, 15]);
    const promedio = _erroresRitmo.length ? _erroresRitmo.reduce((a, b) => a + b, 0) / _erroresRitmo.length : 9999;
    try {
        const campo = miIdentidad === 'nico' ? 'precisionNico' : 'precisionCarito';
        const campoListo = miIdentidad === 'nico' ? 'terminoNico' : 'terminoCarito';
        await window.updateDoc(refRitmo(), { [campo]: promedio, [campoListo]: true });
        const snap = await new Promise(res => { const u = window.onSnapshot(refRitmo(), s => { u(); res(s); }); });
        const data = snap.data();
        if (data.terminoNico && data.terminoCarito && data.fase !== 'terminado') {
            let ganador = null;
            if (data.precisionNico < data.precisionCarito) ganador = 'nico';
            else if (data.precisionCarito < data.precisionNico) ganador = 'carito';
            const victorias = { ...(data.victorias || { nico: 0, carito: 0 }) };
            if (ganador) victorias[ganador] = (victorias[ganador] || 0) + 1;
            await window.updateDoc(refRitmo(), { fase: 'terminado', ganador, victorias });
            if (ganador && typeof registrarEvento === 'function') {
                registrarEvento('gano_partida', `${nombreJugador(ganador)} ganó Ritmo a Dúo`);
            }
        }
    } catch (e) {
        console.error('No se pudo terminar ritmo:', e);
    }
    const cont = document.getElementById('contenido-ritmo');
    if (cont) delete cont.dataset.jugandoLocal;
}

async function revanchaRitmo(){
    vibrarJ(10);
    const victorias = await leerVictoriasRitmo();
    await window.setDoc(refRitmo(), { fase: 'esperando', listos: {}, victorias });
}
