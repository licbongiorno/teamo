// ==================== PARCHÍS (de a dos) ====================
// Tablero en cruz de 15x15 con un circuito de 52 casillas. Cada uno
// tiene 4 fichas. Posición de cada ficha relativa a su salida:
//   -1 = en casa · 0..50 = en el circuito · 51..55 = pasillo de llegada
//   56 = llegó a la meta.
// Con un 6 se saca una ficha y se vuelve a tirar; comer una ficha del
// otro (fuera de los seguros ★) la manda a su casa y da otro tiro.
// Tres 6 seguidos pierden el turno. Gana quien mete las 4.
const CIRCUITO_PARCHIS = [
    [6, 1], [6, 2], [6, 3], [6, 4], [6, 5], [5, 6], [4, 6], [3, 6], [2, 6], [1, 6], [0, 6], [0, 7], [0, 8],
    [1, 8], [2, 8], [3, 8], [4, 8], [5, 8], [6, 9], [6, 10], [6, 11], [6, 12], [6, 13], [6, 14], [7, 14], [8, 14],
    [8, 13], [8, 12], [8, 11], [8, 10], [8, 9], [9, 8], [10, 8], [11, 8], [12, 8], [13, 8], [14, 8], [14, 7], [14, 6],
    [13, 6], [12, 6], [11, 6], [10, 6], [9, 6], [8, 5], [8, 4], [8, 3], [8, 2], [8, 1], [8, 0], [7, 0], [6, 0]];
const SALIDA_PARCHIS = { nico: 0, carito: 26 };
const SEGUROS_PARCHIS = [0, 8, 13, 21, 26, 34, 39, 47];
const PASILLO_PARCHIS = { nico: [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5]], carito: [[7, 13], [7, 12], [7, 11], [7, 10], [7, 9]] };
const CASA_PARCHIS = { nico: [[1, 1], [1, 4], [4, 1], [4, 4]], carito: [[10, 10], [10, 13], [13, 10], [13, 13]] };
const META_PARCHIS = { nico: [7, 6], carito: [7, 8] };
const CARAS_PARCHIS = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

function absolutaParchis(q, rel) { return (SALIDA_PARCHIS[q] + rel) % 52; }
function celdaFichaParchis(q, rel, k) {
    if (rel < 0) return CASA_PARCHIS[q][k];
    if (rel <= 50) return CIRCUITO_PARCHIS[absolutaParchis(q, rel)];
    if (rel <= 55) return PASILLO_PARCHIS[q][rel - 51];
    return META_PARCHIS[q];
}
function destinoParchis(rel, d) {
    if (rel < 0) return d === 6 ? 0 : null;
    if (rel >= 56) return null;
    const n = rel + d;
    return n > 56 ? null : n;
}
function movibles(e, q) {
    if (!e.dado) return [];
    return e.fichas[q].map((rel, k) => destinoParchis(rel, e.dado) == null ? -1 : k).filter(k => k >= 0);
}

const Parchis = JuegoTurnos.crear({
    id: 'parchis',
    emojiListo: '🎲',
    intro: 'Cada uno tiene 4 fichas en su casa. Con un 6 sacás una y volvés a tirar. Comé las fichas del otro (fuera de las casillas ★) para mandarlas a su casa. Gana el primero en llevar las 4 a la meta.',
    inicial: () => ({ fichas: { nico: [-1, -1, -1, -1], carito: [-1, -1, -1, -1] }, dado: null, seises: 0, ultima: null }),
    textoTurno: (e) => e.dado ? '🎯 Elegí qué ficha mover' : '🎯 Tu turno: tirá el dado',
    render(e, c) {
        const puede = c.miTurno && e.dado ? movibles(e, c.yo) : [];
        const enCelda = {};
        ['nico', 'carito'].forEach(q => e.fichas[q].forEach((rel, k) => {
            const [f, col] = celdaFichaParchis(q, rel, k);
            (enCelda[f * 15 + col] = enCelda[f * 15 + col] || []).push({ q, k, rel });
        }));
        const tipo = (f, col) => {
            if (f < 6 && col < 6) return 'casa-nico';
            if (f > 8 && col > 8) return 'casa-carito';
            if ((f < 6 && col > 8) || (f > 8 && col < 6)) return 'casa-vacia';
            if (f >= 6 && f <= 8 && col >= 6 && col <= 8) return 'centro';
            if (PASILLO_PARCHIS.nico.some(([a, b]) => a === f && b === col)) return 'pasillo-nico';
            if (PASILLO_PARCHIS.carito.some(([a, b]) => a === f && b === col)) return 'pasillo-carito';
            const i = CIRCUITO_PARCHIS.findIndex(([a, b]) => a === f && b === col);
            if (i < 0) return 'nada';
            if (i === SALIDA_PARCHIS.nico) return 'camino salida-nico';
            if (i === SALIDA_PARCHIS.carito) return 'camino salida-carito';
            return SEGUROS_PARCHIS.includes(i) ? 'camino seguro' : 'camino';
        };
        let h = '<div class="tablero-parchis">';
        for (let f = 0; f < 15; f++) for (let col = 0; col < 15; col++) {
            const fichas = enCelda[f * 15 + col] || [];
            const t = tipo(f, col);
            h += `<div class="celda-parchis ${t}">${t.includes('seguro') ? '<i class="estrella">★</i>' : ''}${fichas.map((x, n) => {
                const mia = x.q === c.yo && puede.includes(x.k);
                return `<span class="ficha-parchis f-${x.q}${mia ? ' movible' : ''}${fichas.length > 1 ? ' apilada' : ''}" style="--n:${n}" data-aj-id="pa-${x.q}${x.k}" ${mia ? `onclick="moverParchis(${x.k})"` : ''}></span>`;
            }).join('')}</div>`;
        }
        h += '</div>';
        const llegaron = (q) => e.fichas[q].filter(r => r === 56).length;
        h += `<div class="panel texto-centro"><div class="fila-dados-generala"><span class="dado-generala">${(e.dado || e.ultimoDado) ? CARAS_PARCHIS[e.dado || e.ultimoDado] : '?'}</span></div>
            ${c.miTurno && !e.dado ? `<button class="btn-principal" style="margin-top:10px;" onclick="tirarParchis()">🎲 Tirar</button>` : ''}
            ${c.miTurno && e.dado ? '<div class="texto-tenue" style="margin-top:6px;">Tocá una de tus fichas que brillan</div>' : ''}
            <div class="texto-tenue" style="margin-top:6px; font-size:0.8rem;">En la meta: ${nombreJugador('nico')} ${llegaron('nico')}/4 · ${nombreJugador('carito')} ${llegaron('carito')}/4</div></div>`;
        return h;
    },
    alDibujar(cont, e) {
        const u = e.ultima;
        if (!u || cont.dataset.parchisVisto === u.id) return;
        const primera = cont.dataset.parchisVisto === undefined;
        cont.dataset.parchisVisto = u.id;
        if (primera || !window.animJuegos) return;
        if (u.comio) setTimeout(() => window.animJuegos.cartel('💥 ¡A casa!', { sub: `${nombreJugador(u.quien)} se comió una ficha`, color: window.animJuegos.colorDe(nombreJugador(u.quien)), dur: 1200, sonido: 'golpe' }), 350);
        else if (u.meta) setTimeout(() => window.animJuegos.cartel('🏁 ¡A la meta!', { dur: 1000, sonido: 'logro' }), 350);
        else if (u.pasa) window.animJuegos.cartel('Sin jugadas 😅', { sub: 'pasa el turno', dur: 1000, sonido: 'toque' });
    },
    compu: {
        paso(e, bot, yo, nivel) {
            if (e.fase !== 'jugando' || e.turno !== bot) return null;
            if (!e.dado) return () => tirarParchis();
            const ops = movibles(e, bot);
            if (!ops.length) return null;
            if (nivel === 'facil' && Math.random() < 0.5) { const k = ops[Math.floor(Math.random() * ops.length)]; return () => moverParchis(k); }
            let mejor = null;
            ops.forEach(k => {
                const rel = e.fichas[bot][k], n = destinoParchis(rel, e.dado);
                let v = n * 0.2;
                if (rel < 0) v += 30;
                if (n === 56) v += 45;
                if (n > 50 && rel <= 50) v += 22;
                if (n <= 50) {
                    const abs = absolutaParchis(bot, n);
                    if (!SEGUROS_PARCHIS.includes(abs) && e.fichas[yo].some(r => r >= 0 && r <= 50 && absolutaParchis(yo, r) === abs)) v += 60;
                    if (SEGUROS_PARCHIS.includes(abs)) v += nivel === 'dificil' ? 8 : 4;
                    // ¿Queda a tiro de una ficha del otro (1 a 6 atrás)?
                    if (nivel !== 'facil' && !SEGUROS_PARCHIS.includes(abs) && e.fichas[yo].some(r => r >= 0 && r <= 50 && [1, 2, 3, 4, 5, 6].some(d => r + d <= 50 && absolutaParchis(yo, r + d) === abs))) v -= nivel === 'dificil' ? 18 : 10;
                }
                v += Math.random() * 2;
                if (!mejor || v > mejor.v) mejor = { k, v };
            });
            return () => moverParchis(mejor.k);
        }
    }
});

async function tirarParchis() {
    vibrarJ([8, 20, 8]);
    const res = await Parchis.jugar((e) => {
        if (e.dado) return null;
        const d = 1 + Math.floor(Math.random() * 6);
        const seises = d === 6 ? (e.seises || 0) + 1 : 0;
        const id = String(Date.now()) + miIdentidad;
        if (seises >= 3) return { dado: null, seises: 0, turno: miRival, ultima: { id, quien: miIdentidad, pasa: true }, aviso: `${nombreJugador(miIdentidad)} sacó tres 6 seguidos: pierde el turno.` };
        const prueba = { ...e, dado: d };
        if (!movibles(prueba, miIdentidad).length) return { dado: null, seises: 0, turno: d === 6 ? miIdentidad : miRival, ultima: { id, quien: miIdentidad, pasa: true, dado: d }, aviso: null, ultimoDado: d };
        return { dado: d, ultimoDado: d, seises, aviso: null };
    });
    if (res && window.sfx) window.sfx.dado();
}

async function moverParchis(k) {
    vibrarJ(10);
    const res = await Parchis.jugar((e) => {
        if (!e.dado) return null;
        const rel = e.fichas[miIdentidad][k], n = destinoParchis(rel, e.dado);
        if (n == null) return null;
        const fichas = { nico: [...e.fichas.nico], carito: [...e.fichas.carito] };
        fichas[miIdentidad][k] = n;
        let comio = false;
        if (n <= 50) {
            const abs = absolutaParchis(miIdentidad, n);
            if (!SEGUROS_PARCHIS.includes(abs)) fichas[miRival] = fichas[miRival].map(r => (r >= 0 && r <= 50 && absolutaParchis(miRival, r) === abs) ? (comio = true, -1) : r);
        }
        const otraVez = e.dado === 6 || comio;
        const cambios = { fichas, dado: null, seises: e.dado === 6 ? e.seises : 0, turno: otraVez ? miIdentidad : miRival, ultima: { id: String(Date.now()) + miIdentidad + k, quien: miIdentidad, comio, meta: n === 56 } };
        if (fichas[miIdentidad].every(r => r === 56)) { cambios.ganador = miIdentidad; cambios.motivo = '¡Metió las 4 fichas!'; }
        return cambios;
    });
    if (res && window.sfx) window.sfx.rebote();
}
