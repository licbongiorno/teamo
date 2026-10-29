// ============================================================
// pm-ranking.js — Tabla de Clasificación de Parejas del Pac-Neón (Firestore).
// Colección "pacmanRanking": un documento por partida (id = la partida, así
// si los dos tocan "guardar" queda una sola fila).
//   { equipo, puntos, nivel, fantasmas, quien, fecha }
//
//   PMRanking.guardar(id, { equipo, puntos, nivel, fantasmas }) → Promise
//   const cortar = PMRanking.escuchar((top10) => …)
// ============================================================
(function () {
    const COLECCION = 'pacmanRanking';
    const limpiar = (t) => String(t || '').replace(/[<>]/g, '').trim().slice(0, 24) || 'Pareja sin nombre';
    function guardar(id, r) {
        if (!window.db || !window.setDoc) return Promise.reject(new Error('Firestore no está listo'));
        return window.setDoc(window.doc(window.db, COLECCION, id), {
            equipo: limpiar(r.equipo), puntos: Math.max(0, Math.round(r.puntos || 0)), nivel: r.nivel || 1, fantasmas: r.fantasmas || 0,
            quien: typeof miIdentidad !== 'undefined' ? miIdentidad : null,
            fecha: window.serverTimestamp ? window.serverTimestamp() : Date.now(),
        });
    }
    function escuchar(cb) {
        if (!window.db || !window.onSnapshot || !window.query) { cb([]); return () => {}; }
        const orig = window._onSnapshotSinCompu || window.onSnapshot;
        const q = window.query(window.collection(window.db, COLECCION), window.orderBy('puntos', 'desc'), window.limit(10));
        return orig(q, (snap) => { const filas = []; snap.forEach(d => filas.push({ id: d.id, ...d.data() })); cb(filas); }, () => cb(null));
    }
    window.PMRanking = { guardar, escuchar, COLECCION };
})();
