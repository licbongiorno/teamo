// ============================================================
// logros.js - insignias compartidas de la pareja (no por jugador).
// Se apoya en el mismo contador de eventos que ya usa el historial:
// cada vez que se llama a registrarEvento(tipo, detalle), ademas de
// guardar el evento, suma 1 al contador de ese tipo en el documento
// 'juegos/contadores', y revisa si algun logro nuevo se desbloqueo.
// ============================================================
window.CATALOGO_LOGROS = [
    { id: 'primer_paso',        nombre: 'Primer paso',           icono: '👣', tipo: 'cualquier_evento',       umbral: 1,  descripcion: 'Vivieron el primer momento juntos en el sitio.' },
    { id: 'truco_10',           nombre: 'Buenos para el naipe',  icono: '🃏', tipo: 'gano_truco',              umbral: 10, descripcion: '10 partidas de truco jugadas hasta el final.' },
    { id: 'reflexion_20',       nombre: 'Almas curiosas',        icono: '💭', tipo: 'reflexion_completada',    umbral: 20, descripcion: '20 rondas reveladas entre todos los juegos de reflexion.' },
    { id: 'reflexion_100',      nombre: 'Se conocen de memoria', icono: '🧠', tipo: 'reflexion_completada',    umbral: 100, descripcion: '100 rondas reveladas. Se lo saben todo.' },
    { id: 'indagacion_15',      nombre: 'Confidentes',           icono: '🌙', tipo: 'carta_indagacion',        umbral: 15, descripcion: '15 cartas de indagacion respondidas.' },
    { id: 'espejo_15',          nombre: 'Autoconocimiento',      icono: '🪞', tipo: 'espejo_respondido',       umbral: 15, descripcion: '15 rondas de El Espejo completadas.' },
    { id: 'mentegemela_10',     nombre: 'Mente gemela de verdad',icono: '👯', tipo: 'mentegemela_coincidencia',umbral: 10, descripcion: '10 coincidencias exactas en Mente Gemela.' },
    { id: 'cartas_5',           nombre: 'Cartas al futuro',      icono: '💌', tipo: 'carta_tiempo_enviada',    umbral: 5,  descripcion: '5 cartas para abrir despues, enviadas.' },
    { id: 'ajedrez_5',          nombre: 'Jaque mate',            icono: '♟️', tipo: 'gano_ajedrez',            umbral: 5,  descripcion: '5 partidas de ajedrez terminadas.' },
    { id: 'damas_5',            nombre: 'Coronados',             icono: '⚫', tipo: 'gano_damas',              umbral: 5,  descripcion: '5 partidas de damas terminadas.' },
    { id: 'letras_20',          nombre: 'Escritores',            icono: '🪶', tipo: 'letra_agregada',          umbral: 20, descripcion: '20 fragmentos escritos juntos en Letras Compartidas.' },
    { id: 'dibujos_10',         nombre: 'Artistas',              icono: '🎨', tipo: 'dibujo_completado',       umbral: 10, descripcion: '10 dibujos adivinados en Dibuja y Adivina.' },
    { id: 'racha_7',            nombre: 'Una semana entera',     icono: '🔥', tipo: 'racha_dias',              umbral: 7,  descripcion: '7 dias seguidos jugando algo los dos.' },
    { id: 'racha_30',           nombre: 'Un mes entero',         icono: '🔥', tipo: 'racha_dias',              umbral: 30, descripcion: '30 dias seguidos jugando algo los dos.' },
];

function _refContadores(){ return window.doc(window.db, 'juegos', 'contadores'); }
function _refLogros(){ return window.doc(window.db, 'juegos', 'logros'); }

// Suma 1 al contador del tipo indicado (y a 'cualquier_evento') y
// revisa si eso alcanza para desbloquear algun logro nuevo.
async function sumarContadorYVerificarLogros(tipo){
    if (!window.db) return;
    try {
        const ref = _refContadores();
        const snap = await new Promise((res) => { const u = window.onSnapshot(ref, s => { u(); res(s); }); });
        const datos = snap.exists() ? snap.data() : {};
        const nuevoValorTipo = (datos[tipo] || 0) + 1;
        const nuevoValorTotal = tipo === 'cualquier_evento' ? nuevoValorTipo : (datos['cualquier_evento'] || 0) + 1;
        const cambios = { [tipo]: nuevoValorTipo };
        if (tipo !== 'cualquier_evento') cambios['cualquier_evento'] = nuevoValorTotal;
        await window.setDoc(ref, cambios, { merge: true });
        await _verificarDesbloqueos({ ...datos, ...cambios });
    } catch (e) {
        console.warn('No se pudo actualizar el contador de logros:', e);
    }
}

// Llamado directo (sin pasar por un evento del historial) para cosas
// como la racha, que ya lleva su propio contador en otro documento.
async function verificarLogroDeValor(tipo, valorActual){
    try {
        await _verificarDesbloqueos({ [tipo]: valorActual });
    } catch (e) { /* silencioso */ }
}

async function _verificarDesbloqueos(contadores){
    const candidatos = window.CATALOGO_LOGROS.filter(l => (contadores[l.tipo] || 0) >= l.umbral);
    if (!candidatos.length) return;
    const ref = _refLogros();
    const snap = await new Promise((res) => { const u = window.onSnapshot(ref, s => { u(); res(s); }); });
    const yaDesbloqueados = snap.exists() ? (snap.data().desbloqueados || {}) : {};
    const nuevos = candidatos.filter(l => !yaDesbloqueados[l.id]);
    if (!nuevos.length) return;
    const cambios = { ...yaDesbloqueados };
    nuevos.forEach(l => { cambios[l.id] = { fecha: Date.now(), por: miIdentidad || null }; });
    await window.setDoc(ref, { desbloqueados: cambios }, { merge: true });
    nuevos.forEach(l => mostrarToastLogro(l));
}

function mostrarToastLogro(logro){
    const toast = document.createElement('div');
    toast.className = 'toast-logro';
    toast.innerHTML = `<div class="toast-logro-icono">${logro.icono}</div>
        <div><div class="toast-logro-titulo">Logro desbloqueado</div><div class="toast-logro-nombre">${logro.nombre}</div></div>`;
    document.body.appendChild(toast);
    vibrarJ([15, 40, 15]);
    setTimeout(() => toast.classList.add('toast-logro-salir'), 3200);
    setTimeout(() => toast.remove(), 3700);
}

window.sumarContadorYVerificarLogros = sumarContadorYVerificarLogros;
window.verificarLogroDeValor = verificarLogroDeValor;
