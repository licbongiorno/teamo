// ==================== RANKING GENERAL ====================
// Partidas ganadas por cada uno en todos los juegos de competencia, en
// vivo. Los datos los suma registrarVictoria() (js/historial.js) en el
// documento 'juegos/ranking' cada vez que termina una partida.
//
// La primera vez que se abre, se incorporan las victorias que ya estaban
// guardadas en cada juego de antes de que existiera el ranking (sólo de
// los juegos que llevan un contador acumulado confiable). Para no contar
// dos veces lo que ya se sumó desde entonces, por juego se toma el mayor
// entre lo histórico y lo nuevo.
const HISTORICO_RANKING = {
    tateti: 'puntajes', conecta4: 'puntajes', buscaminas: 'rondasGanadas',
    ajedrez: 'victorias', reversi: 'victorias', cajitas: 'victorias', generala: 'victorias',
    anagramas: 'victorias', calculo: 'victorias', stroop: 'victorias', tipeo: 'victorias',
    trivia: 'victorias', memoriarelampago: 'victorias', ppt: 'victorias', simon: 'victorias',
    ritmo: 'victorias', bloques: 'victorias', carreraglobos: 'victorias',
};

function refRanking(){ return window.doc(window.db, 'juegos', 'ranking'); }

async function migrarHistoricoRanking(){
    const ref = refRanking();
    try {
        await window.runTransaction(window.db, async (tx) => {
            const snap = await tx.get(ref);
            const actual = snap.exists() ? snap.data() : {};
            if (actual.migrado) return;
            const ids = Object.keys(HISTORICO_RANKING);
            const docs = await Promise.all(ids.map(id => tx.get(window.doc(window.db, 'juegos', id))));
            const porJuego = { ...(actual.porJuego || {}) };
            ids.forEach((id, i) => {
                const d = docs[i].exists() ? docs[i].data() : {};
                const hist = d[HISTORICO_RANKING[id]] || {};
                const nuevo = porJuego[id] || {};
                porJuego[id] = {
                    nico: Math.max(nuevo.nico || 0, hist.nico || 0),
                    carito: Math.max(nuevo.carito || 0, hist.carito || 0),
                };
            });
            const total = { nico: 0, carito: 0 };
            Object.values(porJuego).forEach(v => { total.nico += v.nico || 0; total.carito += v.carito || 0; });
            tx.set(ref, { porJuego, total, migrado: true, ultima: actual.ultima || null });
        });
    } catch (e) {
        console.warn('No se pudo incorporar el historial al ranking:', e);
    }
}

function iniciarRanking(){
    const cont = document.getElementById('contenido-ranking');
    if (cont) cont.innerHTML = `<div class="panel texto-centro texto-tenue">Cargando…</div>`;
    if (window._unsubRanking) window._unsubRanking();
    window._unsubRanking = window.onSnapshot(refRanking(), (snap) => {
        const datos = snap.exists() ? snap.data() : {};
        if (!datos.migrado) migrarHistoricoRanking();
        renderRanking(datos);
    }, (err) => {
        console.error('Error de Firestore en ranking:', err);
        if (cont) cont.innerHTML = `<div class="panel texto-centro texto-tenue">⚠️ No se pudo conectar (${err.code || 'error'}).</div>`;
    });
}

function renderRanking(datos){
    const cont = document.getElementById('contenido-ranking');
    if (!cont) return;
    const total = datos.total || { nico: 0, carito: 0 };
    const tN = total.nico || 0, tC = total.carito || 0;
    const suma = tN + tC;
    const lider = tN === tC ? null : (tN > tC ? 'nico' : 'carito');
    const pctN = suma ? Math.round(tN * 100 / suma) : 50;

    let html = `<div class="panel texto-centro">
        <div style="font-size:1.1rem; margin-bottom:6px;">${suma ? (lider ? `👑 Va ganando ${nombreJugador(lider)}` : '🤝 ¡Van empatados!') : 'Todavía no hay partidas en el ranking'}</div>
        <div class="marcador-ranking">
            <div><div class="numero-ranking">${tN}</div><div class="texto-tenue">💙 Nico</div></div>
            <div class="texto-tenue">vs</div>
            <div><div class="numero-ranking">${tC}</div><div class="texto-tenue">💖 Carito</div></div>
        </div>
        <div class="barra-ranking" role="img" aria-label="Nico ${tN} partidas, Carito ${tC} partidas">
            <div class="barra-ranking-nico" style="width:${pctN}%"></div><div class="barra-ranking-carito" style="width:${100 - pctN}%"></div>
        </div>
        <div class="texto-tenue" style="font-size:0.75rem; margin-top:6px;">Partidas ganadas en todos los juegos de competencia.</div>
    </div>`;

    if (datos.ultima && datos.ultima.ganador) {
        const j = (window.JUEGOS || []).find(x => x.id === datos.ultima.juego);
        const fecha = datos.ultima.fecha ? new Date(datos.ultima.fecha).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' }) : '';
        html += `<div class="panel texto-centro texto-tenue" style="font-size:0.85rem;">Última: ${nombreJugador(datos.ultima.ganador)} ganó ${j ? `${j.icono} ${j.nombre}` : datos.ultima.juego}${fecha ? ` · ${fecha}` : ''}</div>`;
    }

    const filas = Object.entries(datos.porJuego || {})
        .map(([id, v]) => ({ id, nico: v.nico || 0, carito: v.carito || 0, juego: (window.JUEGOS || []).find(x => x.id === id) }))
        .filter(f => f.nico + f.carito > 0)
        .sort((a, b) => (b.nico + b.carito) - (a.nico + a.carito));
    if (filas.length) {
        html += `<div class="panel"><div class="texto-tenue" style="margin-bottom:8px;">Por juego</div>`;
        filas.forEach(f => {
            const s = f.nico + f.carito;
            const p = Math.round(f.nico * 100 / s);
            const corona = f.nico === f.carito ? '🤝' : (f.nico > f.carito ? '💙' : '💖');
            html += `<div class="fila-ranking" ${f.juego ? `onclick="abrirJuego('${f.id}')"` : ''}>
                <div class="fila-ranking-nombre">${f.juego ? f.juego.icono + ' ' + f.juego.nombre : f.id}</div>
                <div class="fila-ranking-marcador">${f.nico} – ${f.carito} ${corona}</div>
                <div class="barra-ranking barra-ranking-chica"><div class="barra-ranking-nico" style="width:${p}%"></div><div class="barra-ranking-carito" style="width:${100 - p}%"></div></div>
            </div>`;
        });
        html += `</div>`;
    }
    cont.innerHTML = html;
}
