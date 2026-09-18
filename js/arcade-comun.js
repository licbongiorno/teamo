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

// PRNG determinista chiquito (mulberry32): a partir del mismo número
// de ronda, los dos dispositivos generan exactamente el mismo
// problema/palabra/opciones sin tener que guardar el contenido de la
// ronda en Firestore (menos escrituras, cero desincronización).
function rngRonda(semilla){
    let a = semilla >>> 0;
    return function(){
        a |= 0; a = (a + 0x6D2B79F5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
function elegirRnd(rng, lista){ return lista[Math.floor(rng() * lista.length)]; }
function enteroRnd(rng, min, max){ return min + Math.floor(rng() * (max - min + 1)); }
// Baraja "lista" in-place con Fisher-Yates usando el rng determinista.
function barajarRnd(rng, lista){
    for (let i = lista.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [lista[i], lista[j]] = [lista[j], lista[i]];
    }
    return lista;
}
window.rngRonda = rngRonda;
window.elegirRnd = elegirRnd;
window.enteroRnd = enteroRnd;
window.barajarRnd = barajarRnd;

window.marcarListoArcade = marcarListoArcade;
window.iniciarRondaArcadeSiCorresponde = iniciarRondaArcadeSiCorresponde;
window.sincronizarPuntajeEnVivo = sincronizarPuntajeEnVivo;
