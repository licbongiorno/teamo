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
    if (typeof window.registrarProgresoDesafioSemanal === 'function') {
        window.registrarProgresoDesafioSemanal(tipo);
    }
}

// Antes se pedían TODOS los eventos guardados desde siempre (filtrando
// sólo por tipo) y recién después se ordenaban y recortaban acá: cada
// visita a Punto de Encuentro / Nostalgia bajaba miles de documentos
// y tardaba cada vez más. Ahora se piden ya ordenados por fecha y con
// límite. (Se ordena por "creadoEn" solo, que Firestore indexa sin
// configurar nada; los pocos documentos de otros tipos que también
// tienen ese campo se descartan acá.)
function _consultaEventos(limite, desde){
    return window.query(
        window.collection(window.db, 'juegos'),
        window.where('creadoEn', '>=', desde || 0),
        window.orderBy('creadoEn', 'desc'),
        window.limit(Math.min(2000, (limite || 20) * 2 + 40))
    );
}
function _eventosDeSnapshot(snap, limite){
    const eventos = [];
    snap.forEach(d => { const e = d.data(); if (e.tipo === 'evento-historial') eventos.push(e); });
    return eventos.slice(0, limite || 20);
}

// Trae los ultimos 'limite' eventos (una sola vez). 'desde' (ms,
// opcional) corta los más viejos que esa fecha.
async function leerUltimosEventos(limite, desde){
    if (!window.db) return [];
    try {
        const snap = await new Promise((res, rej) => {
            const u = window.onSnapshot(_consultaEventos(limite, desde), s => { u(); res(s); }, e => { u(); rej(e); });
        });
        return _eventosDeSnapshot(snap, limite);
    } catch (e) {
        console.warn('No se pudo leer el historial:', e);
        return [];
    }
}

// Igual, pero en vivo: callback(eventos) cada vez que hay un evento
// nuevo. Devuelve la función para dejar de escuchar.
function escucharUltimosEventos(limite, callback){
    return window.onSnapshot(_consultaEventos(limite), (snap) => callback(_eventosDeSnapshot(snap, limite)),
        (e) => console.warn('No se pudo escuchar el historial:', e));
}

window.registrarEvento = registrarEvento;
window.leerUltimosEventos = leerUltimosEventos;
window.escucharUltimosEventos = escucharUltimosEventos;

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
