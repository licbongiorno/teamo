// ==================== SERPIENTES Y ESCALERAS ====================
// Tablero de 1 a 100 en zigzag (el 1 abajo a la izquierda). Se tira el
// dado y se avanza; si caés al pie de una escalera subís, si caés en la
// cabeza de una serpiente bajás. Hay que llegar justo al 100: si sobra,
// se rebota para atrás. Con un 6 se vuelve a tirar.
const ESCALERAS_SYE = { 4: 25, 13: 46, 33: 49, 42: 63, 50: 69, 62: 81, 74: 92 };
const SERPIENTES_SYE = { 27: 5, 40: 3, 43: 18, 54: 31, 66: 45, 76: 58, 89: 53, 95: 77, 99: 41 };
const CARAS_SYE = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

// Casilla n (1..100) → posición en la grilla de 10x10 (fila 0 = arriba).
function celdaSYE(n) {
    const f = Math.floor((n - 1) / 10), c = (n - 1) % 10;
    return { fila: 9 - f, col: f % 2 === 0 ? c : 9 - c };
}

function svgCaminosSYE() {
    const centro = (n) => { const p = celdaSYE(n); return [p.col * 10 + 5, p.fila * 10 + 5]; };
    let s = '<svg class="caminos-sye" viewBox="0 0 100 100" preserveAspectRatio="none">';
    Object.entries(ESCALERAS_SYE).forEach(([a, b]) => {
        const [x1, y1] = centro(+a), [x2, y2] = centro(b);
        const dx = x2 - x1, dy = y2 - y1, l = Math.hypot(dx, dy), nx = -dy / l * 1.6, ny = dx / l * 1.6;
        s += `<line x1="${x1 + nx}" y1="${y1 + ny}" x2="${x2 + nx}" y2="${y2 + ny}" class="escalera-lado"/><line x1="${x1 - nx}" y1="${y1 - ny}" x2="${x2 - nx}" y2="${y2 - ny}" class="escalera-lado"/>`;
        for (let k = 1; k < l / 4; k++) { const t = k * 4 / l; s += `<line x1="${x1 + dx * t + nx}" y1="${y1 + dy * t + ny}" x2="${x1 + dx * t - nx}" y2="${y1 + dy * t - ny}" class="escalera-peldano"/>`; }
    });
    Object.entries(SERPIENTES_SYE).forEach(([a, b]) => {
        const [x1, y1] = centro(+a), [x2, y2] = centro(b);
        const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, ox = (y2 - y1) * 0.25, oy = (x1 - x2) * 0.25;
        s += `<path d="M${x1},${y1} Q${mx + ox},${my + oy} ${mx},${my} T${x2},${y2}" class="serpiente-cuerpo"/><circle cx="${x1}" cy="${y1}" r="2.2" class="serpiente-cabeza"/>`;
    });
    return s + '</svg>';
}

const Serpientes = JuegoTurnos.crear({
    id: 'serpientes',
    emojiListo: '🐍',
    intro: 'Tiren el dado por turnos y avancen. Las escaleras 🪜 te suben, las serpientes 🐍 te bajan. Gana el primero en llegar justo al 100. Con un 6, volvés a tirar.',
    inicial: () => ({ pos: { nico: 0, carito: 0 }, dado: null, ultima: null }),
    textoTurno: () => '🎯 Tu turno: tirá el dado',
    render(e, c) {
        let h = '<div class="tablero-sye">' + svgCaminosSYE() + '<div class="grilla-sye">';
        const celdas = new Array(100);
        for (let n = 1; n <= 100; n++) { const p = celdaSYE(n); celdas[p.fila * 10 + p.col] = n; }
        celdas.forEach(n => {
            const fichas = ['nico', 'carito'].filter(q => e.pos[q] === n);
            h += `<div class="casilla-sye${n % 2 ? '' : ' par'}${ESCALERAS_SYE[n] ? ' pie' : ''}${SERPIENTES_SYE[n] ? ' cabeza' : ''}"><small>${n}</small>${fichas.map(q => `<span class="ficha-sye f-${q}" data-aj-id="sye-${q}"></span>`).join('')}</div>`;
        });
        h += '</div></div>';
        const enSalida = ['nico', 'carito'].filter(q => !e.pos[q]);
        h += `<div class="salida-sye">${enSalida.length ? 'Salida: ' + enSalida.map(q => `<span class="ficha-sye f-${q}" data-aj-id="sye-${q}"></span>`).join('') : ''}</div>`;
        h += `<div class="panel texto-centro"><div class="fila-dados-generala"><span class="dado-generala">${e.dado ? CARAS_SYE[e.dado] : '?'}</span></div>
            ${c.miTurno ? `<button class="btn-principal" style="margin-top:10px;" onclick="tirarSerpientes()">🎲 Tirar</button>` : ''}
            <div class="texto-tenue" style="margin-top:6px; font-size:0.8rem;">${nombreJugador('nico')}: ${e.pos.nico || 'salida'} · ${nombreJugador('carito')}: ${e.pos.carito || 'salida'}</div></div>`;
        return h;
    },
    alDibujar(cont, e) {
        const u = e.ultima;
        if (!u || cont.dataset.syeVisto === u.id) return;
        const primera = cont.dataset.syeVisto === undefined;
        cont.dataset.syeVisto = u.id;
        if (primera || !window.animJuegos) return;
        if (u.escalera) setTimeout(() => window.animJuegos.cartel('🪜 ¡Escalera!', { dur: 1000, sonido: 'logro' }), 450);
        if (u.serpiente) setTimeout(() => window.animJuegos.cartel('🐍 ¡Serpiente!', { dur: 1000, sonido: 'error' }), 450);
    },
    compu: { paso: (e, bot) => (e.fase === 'jugando' && e.turno === bot) ? () => tirarSerpientes() : null }
});

async function tirarSerpientes() {
    vibrarJ([8, 20, 8]);
    const res = await Serpientes.jugar((e) => {
        const d = 1 + Math.floor(Math.random() * 6);
        let p = (e.pos[miIdentidad] || 0) + d;
        if (p > 100) p = 100 - (p - 100);
        const u = { id: String(Date.now()) + miIdentidad, quien: miIdentidad, dado: d };
        if (ESCALERAS_SYE[p]) { u.escalera = [p, ESCALERAS_SYE[p]]; p = ESCALERAS_SYE[p]; }
        else if (SERPIENTES_SYE[p]) { u.serpiente = [p, SERPIENTES_SYE[p]]; p = SERPIENTES_SYE[p]; }
        const cambios = { pos: { ...e.pos, [miIdentidad]: p }, dado: d, ultima: u, turno: d === 6 ? miIdentidad : miRival };
        if (p === 100) { cambios.ganador = miIdentidad; cambios.motivo = '¡Llegó al 100!'; }
        return cambios;
    });
    if (res && window.sfx) window.sfx.dado();
}
