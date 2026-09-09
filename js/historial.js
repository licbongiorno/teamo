// ============================================================
// historial.js — línea de tiempo de "momentos" compartidos entre
// los juegos (ganar una partida, completar una carta de indagación,
// escribir una letra compartida, etc.). Cada evento es un documento
// dentro de la MISMA colección 'juegos' (tipo:'evento-historial'),
// para no depender de una colección nueva en las Reglas de Firestore.
// Pensado para que "Punto de Encuentro" (cooperativos) lo lea más
// adelante y arme el álbum de momentos.
// ============================================================

// tipo: string corto ('gano_partida','carta_indagacion','letra',...)
// detalle: texto libre, ej. "Nico le ganó a Carito al Truco"
async function registrarEvento(tipo, detalle){
    if (!window.db || typeof window.addDoc !== 'function') return;
    try {
        await window.addDoc(window.collection(window.db, 'juegos'), {
            tipo: 'evento-historial',// ============================================================
// historial.js — línea de tiempo de "momentos" compartidos entre
// los juegos (ganar una partida, completar una carta de indagación,
// escribir una letra compartida, etc.). Cada evento es un documento
// dentro de la MISMA colección 'juegos' (tipo:'evento-historial'),
// para no depender de una colección nueva en las Reglas de Firestore.
// Pensado para que "Punto de Encuentro" (cooperativos) lo lea más
// adelante y arme el álbum de momentos.
// ============================================================

// tipo: string corto ('gano_partida','carta_indagacion','letra',...)
// detalle: texto libre, ej. "Nico le ganó a Carito al Truco"
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
}

// Trae los últimos 'limite' eventos (una sola vez, no en vivo, para
// no dejar un listener abierto en juegos que sólo quieren mostrar
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
// pushLog — utilidad compartida para el historial corto que
// muestran varios juegos (damas, ajedrez, jardín, truco...) debajo
// del tablero. Vive acá porque historial.js se carga siempre, sin
// importar qué juego se abra primero — antes esto sólo estaba
// definido dentro de truco.js, así que damas/ajedrez/jardín se
// rompían (el movimiento no se guardaba) si no se había abierto
// Truco primero en esa sesión, desde que los juegos se cargan bajo
// demanda (ver js/cargador-juegos.js).
function pushLog(estado, mensaje){
    const hist = [...(estado?.historial || []), mensaje];
    return hist.slice(-6);
}
window.pushLog = pushLog;

// escaparHtml — evita que texto escrito por el otro (cartas, fragmentos
// de historia, etc.) se interprete como HTML al mostrarlo. Vive acá por
// el mismo motivo que pushLog: varios juegos la necesitan y esto se
// carga siempre, sin importar cuál se abra primero.
function escaparHtml(texto){
    const div = document.createElement('div');
    div.innerText = texto;
    return div.innerHTML;
}
window.escaparHtml = escaparHtml;

            evento: tipo,
            detalle: detalle,
            autor: (typeof miIdentidad !== 'undefined' && miIdentidad) ? miIdentidad : null,
            creadoEn: Date.now()
        });
    } catch (e) {
        console.warn('No se pudo registrar el evento en el historial:', e);
    }
}

// Trae los últimos 'limite' eventos (una sola vez, no en vivo, para
// no dejar un listener abierto en juegos que sólo quieren mostrar
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
