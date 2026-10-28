// ============================================================
// reloj.js — reloj compartido para los juegos en vivo.
//
// Cada celular tiene su propia hora y casi nunca coinciden al
// segundo: con 1 o 2 segundos de diferencia, el "3, 2, 1, ¡YA!" le
// arrancaba antes a uno, en los duelos de 30 segundos uno tenía más
// tiempo, y en los de "el primero que toca" no se podía comparar quién
// tocó antes. Acá se mide cuánto se adelanta o atrasa este celular
// respecto de la hora del servidor de Firebase, y ahoraSync() devuelve
// la hora "del servidor" en milisegundos: la misma para los dos.
//
// Cómo se mide: se escribe un serverTimestamp() en un documento propio
// y se lee de vuelta; el servidor puso la hora en algún momento entre
// que se mandó y que volvió, así que se toma el punto medio. Se repite
// unas veces y se queda con la medición de viaje más corto (la más
// precisa). Error típico: menos de 100 ms.
// ============================================================
window._desfaseReloj = window._desfaseReloj || 0;
window.ahoraSync = () => Date.now() + (window._desfaseReloj || 0);

let _midiendoReloj = false;
async function medirDesfaseReloj(){
    if (_midiendoReloj || !window.db || typeof window.getDocFromServer !== 'function') return;
    _midiendoReloj = true;
    try {
        const ref = window.doc(window.db, 'juegos', 'reloj-' + (window._miUid || 'anon'));
        let mejor = null;
        for (let i = 0; i < 3; i++) {
            const t0 = Date.now();
            await window.setDoc(ref, { t: window.serverTimestamp() });
            const t1 = Date.now();
            const snap = await window.getDocFromServer(ref);
            const t = snap.data()?.t;
            if (!t || typeof t.toMillis !== 'function') continue;
            const viaje = t1 - t0;
            if (!mejor || viaje < mejor.viaje) mejor = { viaje, desfase: t.toMillis() - (t0 + t1) / 2 };
        }
        if (mejor) window._desfaseReloj = Math.round(mejor.desfase);
    } catch (e) {
        console.warn('No se pudo sincronizar el reloj (se usa la hora del celular):', e);
    } finally {
        _midiendoReloj = false;
    }
}

// juegos.html avisa con 'firebase-listo'; index.html con 'firebase-listo-index'.
if (window._firebaseListo || window._firebaseListoIndex) medirDesfaseReloj();
else {
    document.addEventListener('firebase-listo', medirDesfaseReloj, { once: true });
    document.addEventListener('firebase-listo-index', medirDesfaseReloj, { once: true });
}

// Al volver de un rato en segundo plano el reloj del celular pudo
// corregirse solo (o dormirse): se vuelve a medir.
let _relojOcultoDesde = 0;
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') { _relojOcultoDesde = Date.now(); return; }
    if (_relojOcultoDesde && Date.now() - _relojOcultoDesde > 60000) medirDesfaseReloj();
});
window.medirDesfaseReloj = medirDesfaseReloj;
