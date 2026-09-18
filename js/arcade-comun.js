// ============================================================
// arcade-comun.js - bureaucracia compartida para los juegos de
// reflejos en tiempo real (los dos tienen que estar conectados a la
// vez). Cada juego sigue teniendo su propio render/loop; esto sólo
// evita repetir 9 veces el mismo "esperar a que ambos estén listos
// y arrancar sincronizados".
// ============================================================
// Antes esto era un "leer con onSnapshot y después escribir con merge"
// suelto: si los dos jugadores tocaban "listo" casi al mismo tiempo,
// cada lectura podía no ver todavía la marca del otro, y la escritura
// de uno pisaba (borraba) la del otro — la partida se quedaba
// esperando para siempre. Con una transacción, Firestore reintenta
// solo si detecta que el documento cambió mientras se decidía, así
// que el segundo en confirmar siempre ve la marca del primero (mismo
// patrón ya usado en ajedrez.js/damas.js/chinchon.js/uno.js).
async function marcarListoArcade(refDoc, extra){
    await window.runTransaction(window.db, async (tx) => {
        const snap = await tx.get(refDoc);
        const estado = snap.exists() ? snap.data() : null;
        if (estado?.fase === 'esperando' && estado?.listos?.[miIdentidad]) return;
        tx.set(refDoc, {
            fase: 'esperando',
            listos: { ...(estado?.listos || {}), [miIdentidad]: true },
            ...(extra || {})
        }, { merge: true });
    });
}

// _iniciandoRondaArcade evita que el mismo dispositivo dispare dos
// transacciones redundantes casi seguidas (por ejemplo si el
// onSnapshot local vuelve a disparar antes de que la primera
// transacción termine). Va dentro de un try/finally: antes, si
// updateDoc/la transacción fallaba (red, permisos), la bandera se
// quedaba en `true` para siempre y ese dispositivo nunca más podía
// arrancar una ronda de ese juego. La transacción en sí (chequeando
// fase==='esperando' adentro) es lo que evita que arranque dos veces
// aunque los dos dispositivos entren a la vez.
const _iniciandoRondaArcade = {};
async function iniciarRondaArcadeSiCorresponde(refDoc, juegoId, duracionMs, extraInicial){
    if (_iniciandoRondaArcade[juegoId]) return;
    _iniciandoRondaArcade[juegoId] = true;
    try {
        await window.runTransaction(window.db, async (tx) => {
            const snap = await tx.get(refDoc);
            const estado = snap.exists() ? snap.data() : null;
            if (!estado || estado.fase !== 'esperando') return; // ya arrancó (el otro dispositivo ganó la carrera) o cambió mientras tanto
            const horaInicio = Date.now() + 3000;
            tx.set(refDoc, {
                fase: 'jugando', horaInicio, horaFin: horaInicio + duracionMs,
                ...(extraInicial || {})
            }, { merge: true });
        });
    } finally {
        _iniciandoRondaArcade[juegoId] = false;
    }
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

// Autoreparación: si un documento quedó en un estado roto — fase que
// no es 'sin_partida'/'esperando'/'terminado' pero sin un horaInicio
// válido — antes eso dejaba a los dos jugadores mirando "¡YA!" para
// siempre (con la vieja condición de carrera no transaccional, un
// documento podía quedar así de antes de este arreglo, y el código
// nuevo nunca lo iba a curar solo porque nunca vuelve a escribir
// fase:'jugando' sin horaInicio). Ahora, apenas cualquiera de los dos
// dispositivos detecta esta combinación imposible, reinicia la
// partida solo (vuelve a 'sin_partida') para que puedan arrancar de
// nuevo en vez de quedar trabados.
const _reparandoRondaArcade = {};
async function repararRondaArcadeSiCorresponde(refDoc, juegoId){
    if (_reparandoRondaArcade[juegoId]) return;
    _reparandoRondaArcade[juegoId] = true;
    try {
        await window.runTransaction(window.db, async (tx) => {
            const snap = await tx.get(refDoc);
            const estado = snap.exists() ? snap.data() : null;
            if (!estado || typeof estado.horaInicio === 'number') return; // ya no hace falta (se reparó solo, o alguien ganó la carrera)
            if (estado.fase === 'sin_partida' || estado.fase === 'esperando' || estado.fase === 'terminado') return; // no es el caso roto
            tx.set(refDoc, { fase: 'sin_partida', listos: {} }, { merge: true });
        });
    } finally {
        setTimeout(() => { _reparandoRondaArcade[juegoId] = false; }, 1000);
    }
}
window.repararRondaArcadeSiCorresponde = repararRondaArcadeSiCorresponde;

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
