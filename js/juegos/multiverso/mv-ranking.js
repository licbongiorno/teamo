// ============================================================
// mv-ranking.js — Tabla de Clasificación de Parejas del Multiverso.
// Colección de Firestore "multiversoRanking": un documento por partida
// guardada { equipo, puntos, modo, j1, j2, nivel, quien, fecha }.
// Usa el Firestore que ya inicializa js/firebase.js (window.db, etc.).
//
//   MVRanking.guardar({ equipo, puntos, modo, j1, j2, nivel }) → Promise
//   const cortar = MVRanking.escuchar((top10) => ..., modo?)  // en tiempo real
// ============================================================
(function () {
    const COLECCION = 'multiversoRanking';
    const limpiar = (t) => String(t || '').replace(/[<>]/g, '').trim().slice(0, 24) || 'Pareja sin nombre';

    async function guardar(r) {
        if (!window.db || !window.addDoc) throw new Error('Firestore no está listo');
        const datos = {
            equipo: limpiar(r.equipo), puntos: Math.max(0, Math.round(r.puntos || 0)), modo: r.modo || 'invasion',
            j1: Math.round(r.j1 || 0), j2: Math.round(r.j2 || 0), nivel: r.nivel || 1,
            quien: typeof miIdentidad !== 'undefined' ? miIdentidad : null,
            fecha: window.serverTimestamp ? window.serverTimestamp() : Date.now(),
        };
        return window.addDoc(window.collection(window.db, COLECCION), datos);
    }
    // Top 10 global (o de un modo) que se actualiza solo cuando alguien guarda.
    function escuchar(cb, modo) {
        if (!window.db || !window.onSnapshot) { cb([]); return () => {}; }
        const col = window.collection(window.db, COLECCION);
        // Sin "where" + "orderBy" juntos para no necesitar un índice compuesto:
        // se traen los mejores y se filtra el modo acá.
        const q = window.query(col, window.orderBy('puntos', 'desc'), window.limit(modo ? 60 : 10));
        return window.onSnapshot(q, (snap) => {
            const filas = [];
            snap.forEach(d => { const x = d.data(); if (!modo || x.modo === modo) filas.push({ id: d.id, ...x }); });
            cb(filas.slice(0, 10));
        }, (err) => { console.warn('ranking del multiverso:', err); cb(null); });
    }
    window.MVRanking = { guardar, escuchar, COLECCION };
})();
