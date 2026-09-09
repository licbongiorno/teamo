// ============================================================
// records.js - records historicos simples, un documento por juego
// dentro de 'juegos/records' (campo = id del juego, valor = mejor
// marca alcanzada). Pensado para juegos donde "mejor marca" es un
// solo numero que sólo puede crecer (nivel alcanzado, puntaje, etc).
// ============================================================
function _refRecords(){ return window.doc(window.db, 'juegos', 'records'); }

async function leerRecord(juego){
    try {
        const snap = await new Promise((res) => { const u = window.onSnapshot(_refRecords(), s => { u(); res(s); }); });
        const datos = snap.exists() ? snap.data() : {};
        return datos[juego] || 0;
    } catch (e) {
        return 0;
    }
}

// Guarda 'valor' como record de 'juego' si es mayor al que ya habia.
// Devuelve true si quedo un record nuevo.
async function actualizarRecordSiSupera(juego, valor){
    try {
        const ref = _refRecords();
        const snap = await new Promise((res) => { const u = window.onSnapshot(ref, s => { u(); res(s); }); });
        const datos = snap.exists() ? snap.data() : {};
        const actual = datos[juego] || 0;
        if (valor <= actual) return false;
        await window.setDoc(ref, { [juego]: valor }, { merge: true });
        return true;
    } catch (e) {
        console.warn('No se pudo actualizar el record de', juego, e);
        return false;
    }
}

window.leerRecord = leerRecord;
window.actualizarRecordSiSupera = actualizarRecordSiSupera;
