// ============================================================
// arcade-comun.js - bureaucracia compartida para los juegos de
// reflejos en tiempo real (los dos tienen que estar conectados a la
// vez). Cada juego sigue teniendo su propio render/loop; esto sólo
// evita repetir 9 veces el mismo "esperar a que ambos estén listos
// y arrancar sincronizados".
// ============================================================
async function marcarListoArcade(refDoc, extra){
    const estado = await new Promise(res => { const u = window.onSnapshot(refDoc, s => { u(); res(s.exists() ? s.data() : null); }); });
    await window.setDoc(refDoc, {
        fase: 'esperando',
        listos: { ...(estado?.listos || {}), [miIdentidad]: true },
        ...(extra || {})
    }, { merge: true });
}

const _iniciandoRondaArcade = {};
async function iniciarRondaArcadeSiCorresponde(refDoc, juegoId, duracionMs, extraInicial){
    if (_iniciandoRondaArcade[juegoId]) return;
    _iniciandoRondaArcade[juegoId] = true;
    const horaInicio = Date.now() + 3000;
    await window.updateDoc(refDoc, {
        fase: 'jugando', horaInicio, horaFin: horaInicio + duracionMs,
        ...(extraInicial || {})
    });
    setTimeout(() => { _iniciandoRondaArcade[juegoId] = false; }, 1000);
}

// HTML compartido para el "3, 2, 1, ¡Ya!" que se ve mientras
// horaInicio todavía no llegó: mismo momento para los dos (calculado
// contra el horaInicio guardado en Firestore, no contra el reloj de
// cada dispositivo por separado), así arrancan realmente parejos.
function htmlCuentaRegresivaArcade(restanteMs){
    if (restanteMs > 0) {
        return `<div class="panel texto-centro cuenta-regresiva-arcade">
            <div class="numero-cuenta-regresiva">${Math.ceil(restanteMs / 1000)}</div>
        </div>`;
    }
    return `<div class="panel texto-centro cuenta-regresiva-arcade">
        <div class="numero-cuenta-regresiva numero-cuenta-regresiva-ya">¡YA!</div>
    </div>`;
}
window.htmlCuentaRegresivaArcade = htmlCuentaRegresivaArcade;

// Escribe el puntaje propio "en vivo" sin saturar Firestore: como
// mucho una escritura cada `intervaloMs`.
const _ultimaEscrituraVivo = {};
function sincronizarPuntajeEnVivo(refDoc, campo, valor, intervaloMs){
    const ahora = Date.now();
    const clave = campo;
    if (_ultimaEscrituraVivo[clave] && ahora - _ultimaEscrituraVivo[clave] < (intervaloMs || 600)) return;
    _ultimaEscrituraVivo[clave] = ahora;
    window.updateDoc(refDoc, { [campo]: valor }).catch(() => {});
}

window.marcarListoArcade = marcarListoArcade;
window.iniciarRondaArcadeSiCorresponde = iniciarRondaArcadeSiCorresponde;
window.sincronizarPuntajeEnVivo = sincronizarPuntajeEnVivo;
