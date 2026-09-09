// ============================================================
// historial.js - linea de tiempo de "momentos" compartidos entre
// los juegos (ganar una partida, completar una carta, escribir una
// letra compartida, etc.). Cada evento es un documento dentro de la
// MISMA coleccion 'juegos' (tipo:'evento-historial'), para no
// depender de una coleccion nueva en las Reglas de Firestore.
// Pensado para que "Punto de Encuentro" (cooperativos) lo lea mas
// adelante y arme el album de momentos.
// ============================================================

// tipo: string corto ('gano_partida','carta_indagacion','letra',...)
// detalle: texto libre, ej. "Nico le gano a Carito al Truco"
async function registrarEvento(tipo, detalle){
    if (!window.db || typeof window.addDoc !== 'function') return;
    try {
        await window.addDoc(window.collection(window.db, 'juegos'), {
            tipo: 'evento-historial',
            evento: tipo,
            detalle: detalle,
            autor: (typeof miIdentidad !== 'undefined' && miIdentidad) ? miIdentidad : null,
            creadoEn: Date.now()
        });
    } catch (e) {
        console.warn('No se pudo registrar el evento en el historial:', e);
    }
    // Ademas de guardar el momento en la linea de tiempo, sumamos al
    // contador de logros (si el modulo esta cargado).
    if (typeof window.sumarContadorYVerificarLogros === 'function') {
        window.sumarContadorYVerificarLogros(tipo);
    }
}

// Trae los ultimos 'limite' eventos (una sola vez, no en vivo, para
// no dejar un listener abierto en juegos que solo quieren mostrar
// un resumen puntual).
async function leerUltimosEventos(limite){
    if (!window.db) return [];
    try {
        const q = window.query(window.collection(window.db, 'juegos'), window.where('tipo', '==', 'evento-historial'));
        const snap = await new Promise((res, rej) => {
            const u = window.onSnapshot(q, s => { u(); res(s); }, e => { u(); rej(e); });
        });
        const eventos = [];
        snap.forEach(d => eventos.push(d.data()));
        eventos.sort((a, b) => (b.creadoEn || 0) - (a.creadoEn || 0));
        return eventos.slice(0, limite || 20);
    } catch (e) {
        console.warn('No se pudo leer el historial:', e);
        return [];
    }
}

window.registrarEvento = registrarEvento;
window.leerUltimosEventos = leerUltimosEventos;

// ============================================================
// pushLog - utilidad compartida para el historial corto que
// muestran varios juegos (damas, ajedrez, jardin, truco...) debajo
// del tablero. Vive aca porque historial.js se carga siempre, sin
// importar que juego se abra primero.
// ============================================================
function pushLog(estado, mensaje){
    const hist = [...(estado && estado.historial ? estado.historial : []), mensaje];
    return hist.slice(-6);
}
window.pushLog = pushLog;

// escaparHtml - evita que texto escrito por el otro (cartas, fragmentos
// de historia, etc.) se interprete como HTML al mostrarlo. Vive aca por
// el mismo motivo que pushLog: varios juegos la necesitan y esto se
// carga siempre, sin importar cual se abra primero.
function escaparHtml(texto){
    const div = document.createElement('div');
    div.innerText = texto;
    return div.innerHTML;
}
window.escaparHtml = escaparHtml;
