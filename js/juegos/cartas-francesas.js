// ==================== CARTAS FRANCESAS (compartido) ====================
// Lo usan La Guerra, Blackjack y Póker. Cada carta es un texto corto:
// número/letra + palo ("As" = As de picas, "Th" = 10 de corazones).
//   valores: 2..9, T (10), J, Q, K, A · palos: s ♠, h ♥, d ♦, c ♣
const PALOS_FR = { s: '♠', h: '♥', d: '♦', c: '♣' };
const VALOR_FR = { 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8, 9: 9, T: 10, J: 11, Q: 12, K: 13, A: 14 };
const NOMBRE_FR = { T: '10', J: 'J', Q: 'Q', K: 'K', A: 'A' };

function mazoFrances() {
    const m = [];
    Object.keys(PALOS_FR).forEach(p => Object.keys(VALOR_FR).forEach(v => m.push(v + p)));
    for (let i = m.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [m[i], m[j]] = [m[j], m[i]]; }
    return m;
}
const valorFr = (c) => VALOR_FR[c[0]];
const paloFr = (c) => c[1];
const nombreFr = (c) => (NOMBRE_FR[c[0]] || c[0]) + PALOS_FR[c[1]];

// opts: { dorso, clase, onclick, chica }
function htmlCartaFr(c, opts) {
    opts = opts || {};
    if (!c || opts.dorso) return `<div class="naipe-frances dorso${opts.chica ? ' chica' : ''}${opts.clase ? ' ' + opts.clase : ''}" ${opts.mazo ? 'data-aj-mazo' : ''}></div>`;
    const roja = c[1] === 'h' || c[1] === 'd';
    const v = NOMBRE_FR[c[0]] || c[0], p = PALOS_FR[c[1]];
    const figura = { J: '🤴', Q: '👸', K: '🤴🏻' }[c[0]];
    return `<div class="naipe-frances${roja ? ' roja' : ''}${opts.chica ? ' chica' : ''}${opts.clase ? ' ' + opts.clase : ''}" data-carta="${c}" ${opts.onclick ? `onclick="${opts.onclick}"` : ''}>
        <span class="fr-esq">${v}<br>${p}</span><span class="fr-centro">${figura || (c[0] === 'A' ? `<b class="fr-as">${p}</b>` : p)}</span><span class="fr-esq abajo">${v}<br>${p}</span></div>`;
}

// ---------- Evaluador de manos de póker (la mejor de 5 entre 5..7 cartas) ----------
// Devuelve un número comparable: categoría * 15^5 + desempates.
const NOMBRES_MANO_POKER = ['Carta alta', 'Par', 'Doble par', 'Trío', 'Escalera', 'Color', 'Full', 'Póker', 'Escalera de color'];
function valor5Poker(cs) {
    const vs = cs.map(valorFr).sort((a, b) => b - a);
    const color = cs.every(c => c[1] === cs[0][1]);
    let unicos = [...new Set(vs)];
    let escalera = 0;
    if (unicos.length === 5 && vs[0] - vs[4] === 4) escalera = vs[0];
    if (unicos.length === 5 && vs[0] === 14 && vs[1] === 5) escalera = 5; // A-2-3-4-5
    const cuenta = {};
    vs.forEach(v => { cuenta[v] = (cuenta[v] || 0) + 1; });
    const grupos = Object.entries(cuenta).map(([v, n]) => [n, +v]).sort((a, b) => b[0] - a[0] || b[1] - a[1]);
    const orden = grupos.map(g => g[1]);
    let cat;
    if (escalera && color) cat = 8;
    else if (grupos[0][0] === 4) cat = 7;
    else if (grupos[0][0] === 3 && grupos[1][0] === 2) cat = 6;
    else if (color) cat = 5;
    else if (escalera) cat = 4;
    else if (grupos[0][0] === 3) cat = 3;
    else if (grupos[0][0] === 2 && grupos[1][0] === 2) cat = 2;
    else if (grupos[0][0] === 2) cat = 1;
    else cat = 0;
    const desempate = escalera ? [escalera] : orden;
    let v = cat;
    for (let i = 0; i < 5; i++) v = v * 15 + (desempate[i] || 0);
    return v;
}
function mejorManoPoker(cartas) {
    let mejor = -1, mejores = null;
    const n = cartas.length;
    for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) for (let c = b + 1; c < n; c++) for (let d = c + 1; d < n; d++) for (let e = d + 1; e < n; e++) {
        const cs = [cartas[a], cartas[b], cartas[c], cartas[d], cartas[e]];
        const v = valor5Poker(cs);
        if (v > mejor) { mejor = v; mejores = cs; }
    }
    return { valor: mejor, cartas: mejores, nombre: NOMBRES_MANO_POKER[Math.floor(mejor / Math.pow(15, 5))] };
}
