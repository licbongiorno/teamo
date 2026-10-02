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
        // Transacción: antes se leía el documento y después se escribía
        // el mapa "ultimoDia" ENTERO. Si los dos entraban casi a la vez,
        // cada uno escribía su día con el día viejo del otro: la marca
        // del primero se borraba y la racha de ese día no avanzaba.
        let resultado = null;
        await window.runTransaction(window.db, async (tx) => {
            resultado = null;
            const snap = await tx.get(ref);
            const datos = snap.exists() ? snap.data() : {};
            const hoy = _fechaHoyLocal();
            const ultimoDia = { ...(datos.ultimoDia || {}) };
            if (ultimoDia[miIdentidad] === hoy) return; // ya marcamos hoy
            ultimoDia[miIdentidad] = hoy;

            let rachaActual = datos.rachaActual || 0;
            let mejorRacha = datos.mejorRacha || 0;
            let ultimaFechaAmbos = datos.ultimaFechaAmbos || null;
            // Historial de días en que jugaron los dos: alimenta el
            // calendario de "Nuestra Historia". Nunca se resetea, sólo se
            // recorta a los últimos 90 días.
            const diasAmbos = [...(datos.diasAmbos || [])];

            const ambosHoy = ultimoDia.nico === hoy && ultimoDia.carito === hoy;
            if (ambosHoy && ultimaFechaAmbos !== hoy) {
                const diff = ultimaFechaAmbos ? _diasEntre(ultimaFechaAmbos, hoy) : null;
                if (diff === 1) rachaActual += 1;
                else rachaActual = 1;
                ultimaFechaAmbos = hoy;
                mejorRacha = Math.max(mejorRacha, rachaActual);
                if (!diasAmbos.includes(hoy)) diasAmbos.push(hoy);
            }
            while (diasAmbos.length > 90) diasAmbos.shift();
            tx.set(ref, { ultimoDia, rachaActual, mejorRacha, ultimaFechaAmbos, diasAmbos }, { merge: true });
            resultado = rachaActual;
        });
        if (resultado !== null && typeof window.verificarLogroDeValor === 'function') {
            window.verificarLogroDeValor('racha_dias', resultado);
        }
    } catch (e) {
        console.warn('No se pudo actualizar la racha:', e);
    }
    escucharChipRacha();
}

// El chip de racha del menú, en vivo: antes se dibujaba una sola vez al
// entrar, así que cuando el otro entraba después y la racha subía, el
// chip seguía mostrando el número viejo hasta actualizar la página.
let _escuchaChipRacha = null;
function escucharChipRacha(){
    if (_escuchaChipRacha) return;
    _escuchaChipRacha = window.onSnapshot(_refRacha(), (snap) => {
        renderChipRacha(snap.exists() ? (snap.data().rachaActual || 0) : 0);
    }, (e) => { _escuchaChipRacha = null; console.warn('No se pudo escuchar la racha:', e); });
}

function renderChipRacha(racha){
    const cont = document.getElementById('chip-racha');
    if (!cont) return;
    if (!racha || racha < 1) { cont.innerHTML = ''; return; }
    cont.innerHTML = `<span class="chip-racha-activa">🔥 ${racha} ${racha === 1 ? 'dia' : 'dias'} seguidos</span>`;
}

window.registrarActividadRacha = registrarActividadRacha;
