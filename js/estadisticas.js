// ============================================================
// estadisticas.js - pantalla "Nuestra Historia": junta los
// contadores que ya alimenta logros.js, los puntos compartidos y
// la racha, en un solo resumen. Ademas muestra la grilla de logros
// (desbloqueados y pendientes).
// ============================================================
async function _leerDocUnaVez(coleccionId){
    const ref = window.doc(window.db, 'juegos', coleccionId);
    const snap = await new Promise((res) => { const u = window.onSnapshot(ref, s => { u(); res(s); }); });
    return snap.exists() ? snap.data() : {};
}

const _ETIQUETAS_CONTADOR = {
    gano_truco: { icono: '🃏', nombre: 'Partidas de truco' },
    gano_ajedrez: { icono: '♟️', nombre: 'Partidas de ajedrez' },
    gano_damas: { icono: '⚫', nombre: 'Partidas de damas' },
    reflexion_completada: { icono: '💭', nombre: 'Rondas de reflexion reveladas' },
    carta_indagacion: { icono: '🌙', nombre: 'Cartas de indagacion' },
    espejo_respondido: { icono: '🪞', nombre: 'Rondas de El Espejo' },
    mentegemela_coincidencia: { icono: '👯', nombre: 'Coincidencias en Mente Gemela' },
    carta_tiempo_enviada: { icono: '💌', nombre: 'Cartas para abrir despues' },
    letra_agregada: { icono: '🪶', nombre: 'Fragmentos escritos juntos' },
    dibujo_completado: { icono: '🎨', nombre: 'Dibujos adivinados' },
};

async function iniciarEstadisticas(){
    const cont = document.getElementById('contenido-estadisticas');
    cont.innerHTML = `<div class="panel texto-centro texto-tenue">Cargando…</div>`;
    registrarEvento('visita_estadisticas', `${nombreJugador(miIdentidad)} miro Nuestra Historia`);

    const [contadores, logrosDoc, puntos, racha] = await Promise.all([
        _leerDocUnaVez('contadores'),
        _leerDocUnaVez('logros'),
        new Promise((res) => { if (window.escucharPuntos) { const u = window.escucharPuntos((p) => { res(p); }); } else res({}); }),
        _leerDocUnaVez('racha'),
    ]);

    renderEstadisticas(contadores, logrosDoc.desbloqueados || {}, puntos || {}, racha);
}

// Categorías de eventos que cuentan para el "nivel de variedad": jugar
// siempre lo mismo no suma niveles, probar cosas distintas sí. Cada
// tipo de evento de _ETIQUETAS_CONTADOR + los géneros de juego más
// generales (arcade, cooperativos) sumados por registrarEvento en otros
// lados quedan afuera a propósito — el nivel mide variedad de EXPERIENCIA
// (charla profunda, tablero, escritura, etc), no cuántos juegos distintos.
const _CATEGORIAS_VARIEDAD = {
    gano_truco: 'tablero', gano_ajedrez: 'tablero', gano_damas: 'tablero', gano_partida: 'tablero',
    reflexion_completada: 'conexion', carta_indagacion: 'conexion', espejo_respondido: 'conexion', mentegemela_coincidencia: 'conexion',
    carta_tiempo_enviada: 'cuidado', cuidado_compartido: 'cuidado',
    letra_agregada: 'creativo', dibujo_completado: 'creativo',
};
const _NIVELES_VARIEDAD = [
    { desde: 0, nombre: 'Recién arrancando' },
    { desde: 1, nombre: 'Curiosos' },
    { desde: 2, nombre: 'Exploradores' },
    { desde: 3, nombre: 'Compinches' },
    { desde: 4, nombre: 'Equipo completo' },
];
function calcularNivelVariedad(contadores){
    const categoriasConActividad = new Set(
        Object.entries(contadores)
            .filter(([tipo, valor]) => valor > 0 && _CATEGORIAS_VARIEDAD[tipo])
            .map(([tipo]) => _CATEGORIAS_VARIEDAD[tipo])
    );
    const n = categoriasConActividad.size;
    let nivel = _NIVELES_VARIEDAD[0];
    for (const nv of _NIVELES_VARIEDAD) if (n >= nv.desde) nivel = nv;
    return { nivel: _NIVELES_VARIEDAD.indexOf(nivel) + 1, nombre: nivel.nombre, categorias: n, total: 4 };
}

// Calendario de los últimos 35 días (5 semanas): un cuadradito por día,
// resaltado si esa fecha está en el historial de racha compartida.
function renderCalendarioRacha(diasAmbos){
    const set = new Set(diasAmbos || []);
    const hoy = new Date();
    const celdas = [];
    for (let i = 34; i >= 0; i--) {
        const d = new Date(hoy);
        d.setDate(d.getDate() - i);
        const fecha = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        celdas.push({ fecha, jugado: set.has(fecha), esHoy: i === 0 });
    }
    return `<div class="panel">
        <div class="texto-tenue" style="margin-bottom:8px;">🗓️ Últimos 35 días jugando juntos</div>
        <div class="calendario-racha">
            ${celdas.map(c => `<div class="celda-racha ${c.jugado ? 'jugado' : ''} ${c.esHoy ? 'es-hoy' : ''}" title="${c.fecha}${c.jugado ? ' · jugaron los dos' : ''}"></div>`).join('')}
        </div>
    </div>`;
}

function renderEstadisticas(contadores, desbloqueados, puntos, racha){
    const cont = document.getElementById('contenido-estadisticas');

    let html = `<div class="panel texto-centro">
        <p style="font-family:var(--fuente-titulo); font-size:1.4rem; margin:0 0 6px;">Nuestra Historia</p>
        <p class="texto-tenue" style="margin:0;">Todo lo que fueron construyendo juntos, en un solo lugar.</p>
    </div>`;

    html += `<div class="panel">
        <div style="display:flex; justify-content:space-around; text-align:center;">
            <div><div style="font-size:1.4rem;">🔥</div><div class="texto-tenue">${racha.rachaActual || 0} racha actual</div></div>
            <div><div style="font-size:1.4rem;">🏅</div><div class="texto-tenue">${racha.mejorRacha || 0} mejor racha</div></div>
            <div><div style="font-size:1.4rem;">💙💖</div><div class="texto-tenue">${(puntos.nico || 0) + (puntos.carito || 0)} puntos totales</div></div>
        </div>
    </div>`;

    html += renderCalendarioRacha(racha.diasAmbos);

    const nv = calcularNivelVariedad(contadores);
    html += `<div class="panel texto-centro">
        <div class="texto-tenue" style="margin-bottom:4px;">Nivel ${nv.nivel} de 5</div>
        <div style="font-family:var(--fuente-titulo); font-size:1.3rem;">${nv.nombre}</div>
        <div class="barra-progreso-jardin" style="margin-top:8px;"><div class="relleno-progreso-jardin barra-crecer" style="width:${(nv.categorias / nv.total) * 100}%;"></div></div>
        <div class="texto-tenue" style="margin-top:6px; font-size:0.75rem;">Probaron ${nv.categorias} de ${nv.total} tipos de juego distintos</div>
    </div>`;

    const filas = Object.keys(_ETIQUETAS_CONTADOR)
        .map(k => ({ ...(_ETIQUETAS_CONTADOR[k]), valor: contadores[k] || 0 }))
        .filter(f => f.valor > 0)
        .sort((a, b) => b.valor - a.valor);

    html += `<div class="panel"><div class="texto-tenue" style="margin-bottom:10px;">📊 Numeros</div>`;
    if (filas.length) {
        filas.forEach(f => {
            html += `<div style="display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px solid rgba(255,255,255,0.08); font-size:0.88rem;">
                <span>${f.icono} ${f.nombre}</span><b>${f.valor}</b>
            </div>`;
        });
    } else {
        html += `<p class="texto-tenue">Todavia no hay numeros para mostrar. Van a ir apareciendo a medida que jueguen.</p>`;
    }
    html += `</div>`;

    const total = window.CATALOGO_LOGROS.length;
    const desbloqueadosCant = window.CATALOGO_LOGROS.filter(l => desbloqueados[l.id]).length;
    html += `<div class="panel"><div class="texto-tenue" style="margin-bottom:10px;">🏆 Logros (${desbloqueadosCant}/${total})</div>
        <div class="grilla-logros">`;
    window.CATALOGO_LOGROS.forEach(l => {
        const logrado = !!desbloqueados[l.id];
        html += `<div class="tarjeta-logro ${logrado ? 'tarjeta-logro-desbloqueada' : 'tarjeta-logro-bloqueada'}" title="${l.descripcion}">
            <div class="tarjeta-logro-icono">${logrado ? l.icono : '🔒'}</div>
            <div class="tarjeta-logro-nombre">${l.nombre}</div>
        </div>`;
    });
    html += `</div></div>`;

    cont.innerHTML = html;
}
