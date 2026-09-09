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
