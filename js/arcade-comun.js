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
            // Se limpian las marcas de "terminé" de la ronda anterior: el
            // documento se mezcla (merge), así que si no, podían quedar de
            // antes y la ronda nueva arrancaba como "ya terminada".
            const del = window.deleteField();
            tx.set(refDoc, {
                fase: 'jugando', horaInicio, horaFin: horaInicio + duracionMs,
                terminoNico: false, terminoCarito: false,
                ptsFinalesNico: del, ptsFinalesCarito: del,
                resultadosNico: del, resultadosCarito: del,
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

// Cuánto esperar antes del próximo re-render de la cuenta regresiva.
// Antes cada juego reintentaba cada ~200ms sin importar nada más — eso
// significa que el número "3, 2, 1" se reconstruía de cero 4-5 veces
// por segundo, y como .numero-cuenta-regresiva tiene una animación de
// "aparecer" (pulsoCuentaRegresiva) que se reinicia cada vez que se
// vuelve a crear el elemento, el resultado era un parpadeo constante
// en vez de un número quieto que cambia una vez por segundo. Ahora se
// calcula el tiempo exacto hasta que el número mostrado (Math.ceil de
// segundos) vaya a cambiar, y sólo se re-renderiza en ese momento.
function msHastaProximoTickArcade(restanteMs){
    if (restanteMs <= 0) return 150; // ya se ve "¡YA!"; hay que sondear seguido para pasar a jugar apenas corresponda
    const segundoActual = Math.ceil(restanteMs / 1000);
    return Math.max(50, restanteMs - (segundoActual - 1) * 1000 + 30);
}
window.msHastaProximoTickArcade = msHastaProximoTickArcade;

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
// Antes, si un punto llegaba dentro de ese intervalo simplemente se
// descartaba: el último punto (o los últimos) nunca se mandaban y el
// otro veía el marcador en vivo atrasado o congelado. Ahora se guarda
// el valor pendiente y se manda al cumplirse el intervalo.
const _ultimaEscrituraVivo = {};
const _pendienteVivo = {};
function sincronizarPuntajeEnVivo(refDoc, campo, valor, intervaloMs){
    const intervalo = intervaloMs || 600;
    const clave = refDoc.path + '/' + campo;
    const ahora = Date.now();
    const escribir = (v) => {
        _ultimaEscrituraVivo[clave] = Date.now();
        window.updateDoc(refDoc, { [campo]: v }).catch(() => {});
    };
    const transcurrido = ahora - (_ultimaEscrituraVivo[clave] || 0);
    if (transcurrido >= intervalo) {
        if (_pendienteVivo[clave]) { clearTimeout(_pendienteVivo[clave].timer); delete _pendienteVivo[clave]; }
        escribir(valor);
        return;
    }
    if (_pendienteVivo[clave]) { _pendienteVivo[clave].valor = valor; return; }
    _pendienteVivo[clave] = {
        valor,
        timer: setTimeout(() => {
            const p = _pendienteVivo[clave];
            delete _pendienteVivo[clave];
            if (p) escribir(p.valor);
        }, intervalo - transcurrido)
    };
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

// ==================== CIERRE DE RONDA (común) ====================
// Antes cada juego cerraba la ronda así: escribía "terminé + mi
// puntaje", después LEÍA aparte para ver si el otro también había
// terminado, y recién ahí marcaba 'terminado'. Si los dos terminaban
// casi juntos, cada uno podía leer antes de que llegara la escritura
// del otro: ninguno cerraba la ronda y la pantalla quedaba trabada
// esperando hasta actualizar la página. Además, durante el juego la
// pantalla ignora las actualizaciones (dataset.jugandoLocal) y al
// terminar no se volvía a dibujar con el último estado: si el otro ya
// había cerrado la ronda, el marcador final no aparecía.
//
// Ahora: todo en una transacción (el que termina segundo SIEMPRE ve
// al primero y cierra), y al final se vuelve a dibujar la pantalla
// con el estado más reciente. Si el otro nunca termina (cerró la app),
// a los 15 s se cierra igual con su último puntaje en vivo.
async function cerrarRondaArcade(refDoc, juegoId, puntajeObtenido, renderFn, textoEvento){
    const yo = miIdentidad === 'nico' ? 'Nico' : 'Carito';
    const otro = miIdentidad === 'nico' ? 'Carito' : 'Nico';
    const cerrar = async (forzar) => {
        let cerro = null;
        await window.runTransaction(window.db, async (tx) => {
            cerro = null;
            const snap = await tx.get(refDoc);
            const data = snap.exists() ? snap.data() : null;
            if (!data || data.fase !== 'jugando') return;
            const cambios = forzar ? {} : { ['termino' + yo]: true, ['ptsFinales' + yo]: puntajeObtenido };
            const terminoOtro = data['termino' + otro];
            if (terminoOtro || forzar) {
                const ptsYo = forzar ? (data['ptsFinales' + yo] ?? puntajeObtenido) : puntajeObtenido;
                const ptsOtro = data['ptsFinales' + otro] ?? data['puntajeVivo' + otro] ?? 0;
                const puntajes = { [miIdentidad]: ptsYo, [miRival]: ptsOtro };
                cambios.fase = 'terminado';
                cambios.puntajes = puntajes;
                cerro = puntajes;
            }
            if (Object.keys(cambios).length) tx.update(refDoc, cambios);
        });
        return cerro;
    };
    try {
        const puntajes = await cerrar(false);
        if (puntajes && textoEvento && typeof registrarEvento === 'function') {
            registrarEvento('gano_partida', `${textoEvento} (${puntajes.nico} - ${puntajes.carito})`);
        }
        if (puntajes && typeof registrarVictoria === 'function') registrarVictoria(juegoId, ganadorPorPuntos(puntajes));
        if (!puntajes) {
            setTimeout(() => { cerrar(true).catch(() => {}); }, 15000);
        }
    } catch (e) {
        console.error(`No se pudo cerrar la ronda de ${juegoId}:`, e);
    }
    redibujarTrasJuegoLocal(juegoId, refDoc, renderFn);
}
window.cerrarRondaArcade = cerrarRondaArcade;

// Saca la marca de "jugando en este dispositivo" y vuelve a dibujar la
// pantalla con el estado actual (los snapshots que llegaron mientras
// se jugaba se habían ignorado a propósito).
function redibujarTrasJuegoLocal(juegoId, refDoc, renderFn){
    const cont = document.getElementById('contenido-' + juegoId);
    if (cont) delete cont.dataset.jugandoLocal;
    if (typeof renderFn !== 'function') return;
    const u = window.onSnapshot(refDoc, (s) => { u(); renderFn(s.exists() ? s.data() : null); }, () => {});
}
window.redibujarTrasJuegoLocal = redibujarTrasJuegoLocal;

// ¿Ya terminé mi parte de esta ronda? (el otro todavía no). Sirve para
// que la pantalla muestre "esperando al otro" en vez de volver a lanzar
// el juego: antes, cualquier actualización que llegara en ese momento
// (por ejemplo el puntaje en vivo del otro) volvía a arrancar la ronda,
// que terminaba al instante, se volvía a guardar, y así en bucle
// mientras el otro seguía jugando.
function yaTermineRondaArcade(estado){
    const yo = miIdentidad === 'nico' ? 'Nico' : 'Carito';
    return !!(estado && (estado['termino' + yo] || estado['resultados' + yo]));
}
function htmlEsperandoRivalArcade(estado){
    const yo = miIdentidad === 'nico' ? 'Nico' : 'Carito';
    const pts = estado?.['ptsFinales' + yo];
    return `<div class="panel texto-centro">
        <div style="font-size:1.1rem; margin-bottom:6px;">✅ ¡Terminaste${pts != null ? ` con ${pts} puntos` : ''}!</div>
        <div class="texto-tenue destello">Esperando a que ${nombreJugador(miRival)} termine…</div>
    </div>`;
}
window.yaTermineRondaArcade = yaTermineRondaArcade;
window.htmlEsperandoRivalArcade = htmlEsperandoRivalArcade;
