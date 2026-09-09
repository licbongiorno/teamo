// ============================================================
// racha.js - racha diaria de "los dos jugaron algo hoy". Un solo
// documento en la coleccion 'juegos' (id 'racha'). Cada uno marca
// su propio dia al entrar; cuando los DOS marcaron el mismo dia,
// la racha avanza (o se resetea si hubo un dia salteado).
// ============================================================
function _refRacha(){ return window.doc(window.db, 'juegos', 'racha'); }

// Fecha local en formato AAAA-MM-DD (hora del dispositivo de cada uno,
// suficiente para una app de dos personas, sin depender de un huso fijo).
function _fechaHoyLocal(){
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
}

function _diasEntre(fechaA, fechaB){
    const a = new Date(fechaA + 'T00:00:00');
    const b = new Date(fechaB + 'T00:00:00');
    return Math.round((b - a) / 86400000);
}

async function registrarActividadRacha(){
    if (!miIdentidad) return;
    try {
        const ref = _refRacha();
        const snap = await new Promise((res) => { const u = window.onSnapshot(ref, s => { u(); res(s); }); });
        const datos = snap.exists() ? snap.data() : {};
        const hoy = _fechaHoyLocal();
        const ultimoDia = { ...(datos.ultimoDia || {}) };

        if (ultimoDia[miIdentidad] === hoy) {
            // Ya marcamos hoy: sólo mostramos el estado actual.
            renderChipRacha(datos.rachaActual || 0);
            return;
        }
        ultimoDia[miIdentidad] = hoy;

        let rachaActual = datos.rachaActual || 0;
        let mejorRacha = datos.mejorRacha || 0;
        let ultimaFechaAmbos = datos.ultimaFechaAmbos || null;

        const ambosHoy = ultimoDia.nico === hoy && ultimoDia.carito === hoy;
        if (ambosHoy && ultimaFechaAmbos !== hoy) {
            const diff = ultimaFechaAmbos ? _diasEntre(ultimaFechaAmbos, hoy) : null;
            if (diff === 1) rachaActual += 1;
            else rachaActual = 1;
            ultimaFechaAmbos = hoy;
            mejorRacha = Math.max(mejorRacha, rachaActual);
        }

        await window.setDoc(ref, { ultimoDia, rachaActual, mejorRacha, ultimaFechaAmbos }, { merge: true });
        renderChipRacha(rachaActual);
        if (typeof window.verificarLogroDeValor === 'function') {
            window.verificarLogroDeValor('racha_dias', rachaActual);
        }
    } catch (e) {
        console.warn('No se pudo actualizar la racha:', e);
    }
}

function renderChipRacha(racha){
    const cont = document.getElementById('chip-racha');
    if (!cont) return;
    if (!racha || racha < 1) { cont.innerHTML = ''; return; }
    cont.innerHTML = `<span class="chip-racha-activa">🔥 ${racha} ${racha === 1 ? 'dia' : 'dias'} seguidos</span>`;
}

window.registrarActividadRacha = registrarActividadRacha;
