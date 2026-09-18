// ============================================================
// desafio-semanal.js - un reto chiquito y rotativo por semana,
// igual para los dos (no hay ranking ni comparación entre ellos).
// Se apoya en los mismos "tipos" de evento que ya usan
// logros.js/historial.js, así no hace falta tocar cada juego para
// etiquetarlo por categoría.
// Sin castigo: si no llegan a completarlo, la semana que viene
// arranca un desafío nuevo solo — no se pierde nada ni se resetea
// ninguna racha por no terminarlo.
// ============================================================
const CATALOGO_DESAFIOS_SEMANALES = [
    { id: 'charlas',    texto: 'Compartan 3 rondas de algún juego de Reflexión', icono: '💭', tipos: ['reflexion_completada'], meta: 3 },
    { id: 'indagacion', texto: 'Respondan 3 Cartas de Indagación', icono: '🌙', tipos: ['carta_indagacion'], meta: 3 },
    { id: 'mimos',      texto: 'Sumen 4 gestos de cuidado (Jardín, Árbol, Refugio y compañía)', icono: '🌱', tipos: ['cuidado_compartido'], meta: 4 },
    { id: 'revancha',   texto: 'Terminen 3 partidas de algún clásico o duelo', icono: '🏆', tipos: ['gano_partida'], meta: 3 },
    { id: 'creativos',  texto: 'Sumen 3 momentos creativos (Letras Compartidas, Dibuja y Adivina)', icono: '🎨', tipos: ['letra_agregada', 'dibujo_completado'], meta: 3 },
    { id: 'espejo',     texto: 'Completen 2 rondas de El Espejo o Mente Gemela', icono: '🪞', tipos: ['espejo_respondido', 'mentegemela_coincidencia'], meta: 2 },
];

// Semana ISO (AAAA-Www) a partir de una fecha, sólo para elegir el
// mismo desafío para los dos sin necesidad de coordinarse.
function _semanaISO(fecha){
    const d = new Date(Date.UTC(fecha.getFullYear(), fecha.getMonth(), fecha.getDate()));
    const diaSemana = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - diaSemana);
    const inicioAno = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const numSemana = Math.ceil((((d - inicioAno) / 86400000) + 1) / 7);
    return `${d.getUTCFullYear()}-W${String(numSemana).padStart(2, '0')}`;
}
function _semanaActual(){ return _semanaISO(new Date()); }

function _desafioDeLaSemana(semana){
    let hash = 0;
    for (let i = 0; i < semana.length; i++) hash = (hash * 31 + semana.charCodeAt(i)) >>> 0;
    return CATALOGO_DESAFIOS_SEMANALES[hash % CATALOGO_DESAFIOS_SEMANALES.length];
}

function _refDesafioSemanal(){ return window.doc(window.db, 'juegos', 'desafio-semanal'); }

// Enganchado desde registrarEvento (historial.js): si el tipo de
// evento pertenece al desafío activo de esta semana, suma 1 a su
// progreso. Si el documento guardado quedó de una semana anterior,
// arranca de cero solo (no hace falta resetear nada a mano).
async function registrarProgresoDesafioSemanal(tipo){
    if (!window.db) return;
    const semana = _semanaActual();
    const desafio = _desafioDeLaSemana(semana);
    if (!desafio.tipos.includes(tipo)) return;
    try {
        const ref = _refDesafioSemanal();
        const snap = await new Promise((res) => { const u = window.onSnapshot(ref, s => { u(); res(s); }); });
        const datos = snap.exists() ? snap.data() : {};
        const progresoPrevio = datos.semana === semana ? (datos.progreso || 0) : 0;
        const progreso = progresoPrevio + 1;
        await window.setDoc(ref, { semana, progreso });
        if (progreso === desafio.meta) {
            if (window.sfx) window.sfx.logro();
            if (window.fx) window.fx.confeti();
        }
    } catch (e) {
        console.warn('No se pudo actualizar el desafío semanal:', e);
    }
}

function iniciarDesafioSemanal(){
    const cont = document.getElementById('desafio-semanal');
    if (!cont || !window.db) return;
    const semana = _semanaActual();
    const desafio = _desafioDeLaSemana(semana);
    if (window._unsubDesafioSemanal) window._unsubDesafioSemanal();
    window._unsubDesafioSemanal = window.onSnapshot(_refDesafioSemanal(), (snap) => {
        const datos = snap.exists() ? snap.data() : {};
        const progreso = datos.semana === semana ? (datos.progreso || 0) : 0;
        renderDesafioSemanal(desafio, progreso);
    }, () => { renderDesafioSemanal(desafio, 0); });
}

function renderDesafioSemanal(desafio, progreso){
    const cont = document.getElementById('desafio-semanal');
    if (!cont) return;
    const completo = progreso >= desafio.meta;
    const pct = Math.min(100, Math.round((progreso / desafio.meta) * 100));
    cont.innerHTML = `<div class="panel ${completo ? 'desafio-semanal-completo' : ''}">
        <div class="texto-tenue" style="margin-bottom:4px;">🗓️ Desafío de la semana</div>
        <div style="font-size:0.95rem; margin-bottom:8px;">${desafio.icono} ${desafio.texto}</div>
        <div class="barra-progreso-jardin"><div class="relleno-progreso-jardin barra-crecer" style="width:${pct}%;"></div></div>
        <div class="texto-tenue" style="margin-top:6px; font-size:0.75rem;">${completo ? '¡Completado! 🎉 La semana que viene arranca uno nuevo.' : `${progreso} de ${desafio.meta} — sin apuro, no se pierde nada si no llegan.`}</div>
    </div>`;
}

window.registrarProgresoDesafioSemanal = registrarProgresoDesafioSemanal;
window.iniciarDesafioSemanal = iniciarDesafioSemanal;
