// ==================== BACKGAMMON ====================
// 24 puntos (índices 0..23). puntos[i] > 0 = fichas de Nico, < 0 = de
// Carito. Nico avanza de 23 hacia 0 (su casa es 0..5) y Carito de 0
// hacia 23 (su casa es 18..23). Se tiran dos dados y se mueve una ficha
// por dado (con dobles, cuatro movimientos). Una ficha sola se puede
// comer: va a la barra y tiene que volver a entrar antes de mover otra.
// Con todas las fichas en casa se empiezan a sacar. Gana quien saca las 15.
// (Simplificado: no obliga a usar el dado más alto.)
const signoBG = (q) => q === 'nico' ? 1 : -1;
const propiasBG = (v, q) => q === 'nico' ? Math.max(0, v) : Math.max(0, -v);
const ajenasBG = (v, q) => q === 'nico' ? Math.max(0, -v) : Math.max(0, v);

function todasEnCasaBG(e, q) {
    if (e.barra[q]) return false;
    for (let i = 0; i < 24; i++) {
        if (!propiasBG(e.puntos[i], q)) continue;
        if (q === 'nico' ? i > 5 : i < 18) return false;
    }
    return true;
}
// Destino de mover desde 'from' ('bar' o índice) con el dado d; null si no se puede.
function destinoBG(e, q, from, d) {
    if (e.barra[q] && from !== 'bar') return null;
    if (from === 'bar' && !e.barra[q]) return null;
    if (from !== 'bar' && !propiasBG(e.puntos[from], q)) return null;
    const origen = from === 'bar' ? (q === 'nico' ? 24 : -1) : from;
    const t = q === 'nico' ? origen - d : origen + d;
    if (t >= 0 && t <= 23) return ajenasBG(e.puntos[t], q) >= 2 ? null : t;
    if (!todasEnCasaBG(e, q)) return null;
    const exacto = q === 'nico' ? t === -1 : t === 24;
    if (exacto) return 'fuera';
    // Con un dado más alto sólo se saca la ficha más lejana.
    for (let i = 0; i < 24; i++) {
        if (!propiasBG(e.puntos[i], q)) continue;
        if (q === 'nico' ? i > from : i < from) return null;
    }
    return 'fuera';
}
function aplicarBG(e, q, from, d) {
    const t = destinoBG(e, q, from, d);
    if (t == null) return null;
    const puntos = [...e.puntos], barra = { ...e.barra }, fuera = { ...e.fuera };
    const s = signoBG(q), otro = q === 'nico' ? 'carito' : 'nico';
    if (from === 'bar') barra[q]--; else puntos[from] -= s;
    let comio = false;
    if (t === 'fuera') fuera[q]++;
    else {
        if (ajenasBG(puntos[t], q) === 1) { puntos[t] = 0; barra[otro]++; comio = true; }
        puntos[t] += s;
    }
    const dados = [...e.dados];
    dados.splice(dados.indexOf(d), 1);
    return { puntos, barra, fuera, dados, t, comio };
}
function movidasBG(e, q) {
    const res = [];
    [...new Set(e.dados)].forEach(d => {
        const origenes = e.barra[q] ? ['bar'] : [...Array(24).keys()].filter(i => propiasBG(e.puntos[i], q));
        origenes.forEach(from => { const t = destinoBG(e, q, from, d); if (t != null) res.push({ from, d, t }); });
    });
    return res;
}
function pipsBG(e, q) {
    let p = e.barra[q] * 25;
    for (let i = 0; i < 24; i++) p += propiasBG(e.puntos[i], q) * (q === 'nico' ? i + 1 : 24 - i);
    return p;
}

let _origenBG = null;

const Backgammon = JuegoTurnos.crear({
    id: 'backgammon',
    emojiListo: '⚪',
    intro: 'Tiren los dados y muevan sus 15 fichas hacia su casa. Una ficha sola se puede comer y vuelve a empezar desde la barra. Con todas en casa se sacan: gana el primero en sacar las 15.',
    inicial: () => {
        const p = new Array(24).fill(0);
        p[23] = 2; p[12] = 5; p[7] = 3; p[5] = 5;
        p[0] = -2; p[11] = -5; p[16] = -3; p[18] = -5;
        return { puntos: p, barra: { nico: 0, carito: 0 }, fuera: { nico: 0, carito: 0 }, dados: [], tirados: [], ultimos: [] };
    },
    textoTurno: (e) => !e.dados.length ? '🎯 Tu turno: tirá los dados' : '🎯 Mové tus fichas (tocá una pila y después el destino)',
    render(e, c) {
        const yo = c.yo;
        const ops = c.miTurno && e.dados.length ? movidasBG(e, yo) : [];
        const desdeOk = new Set(ops.map(o => String(o.from)));
        const destinos = _origenBG != null ? ops.filter(o => String(o.from) === String(_origenBG)) : [];
        const destOk = new Map(destinos.map(o => [String(o.t), o.d]));
        const arriba = yo === 'nico' ? [12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23] : [11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0];
        const abajo = yo === 'nico' ? [11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0] : [12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];
        const punto = (i, fila) => {
            const v = e.puntos[i], n = Math.abs(v), q = v > 0 ? 'nico' : 'carito';
            const clic = destOk.has(String(i)) ? `onclick="moverBackgammon(${_origenBG === 'bar' ? "'bar'" : _origenBG}, ${destOk.get(String(i))})"` : desdeOk.has(String(i)) ? `onclick="elegirOrigenBG(${i})"` : '';
            const fichas = [...Array(Math.min(n, 5))].map((_, k) => `<span class="ficha-bg f-${q}">${k === 4 && n > 5 ? n : ''}</span>`).join('');
            return `<div class="punto-bg ${fila} ${(i % 2) ? 'p-a' : 'p-b'}${destOk.has(String(i)) ? ' destino' : ''}${String(_origenBG) === String(i) ? ' origen' : ''}${desdeOk.has(String(i)) && _origenBG == null ? ' jugable' : ''}${(e.ultimos || []).includes(i) ? ' ultimo' : ''}" ${clic}>${fichas}</div>`;
        };
        let h = '<div class="tablero-bg">';
        h += `<div class="fila-bg">${arriba.slice(0, 6).map(i => punto(i, 'arriba')).join('')}<div class="barra-bg">${'<span class="ficha-bg f-' + c.rival + '"></span>'.repeat(e.barra[c.rival])}</div>${arriba.slice(6).map(i => punto(i, 'arriba')).join('')}</div>`;
        h += `<div class="fila-bg">${abajo.slice(0, 6).map(i => punto(i, 'abajo')).join('')}<div class="barra-bg${desdeOk.has('bar') ? ' jugable' : ''}${_origenBG === 'bar' ? ' origen' : ''}" ${desdeOk.has('bar') ? `onclick="elegirOrigenBG('bar')"` : ''}>${'<span class="ficha-bg f-' + yo + '"></span>'.repeat(e.barra[yo])}</div>${abajo.slice(6).map(i => punto(i, 'abajo')).join('')}</div>`;
        h += '</div>';
        h += `<div class="pie-bg"><span>Afuera: ${nombreJugador('nico')} ${e.fuera.nico}/15 · ${nombreJugador('carito')} ${e.fuera.carito}/15</span>
            ${destOk.has('fuera') ? `<button class="btn-principal" style="width:auto;" onclick="moverBackgammon(${_origenBG}, ${destOk.get('fuera')})">⬇️ Sacar ficha</button>` : ''}</div>`;
        h += `<div class="panel texto-centro"><div class="fila-dados-generala">${(e.tirados || []).map(d => `<span class="dado-generala">${['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'][d]}</span>`).join('') || '<span class="dado-generala">?</span>'}</div>
            ${e.dados.length ? `<div class="texto-tenue" style="margin-top:4px; font-size:0.8rem;">Te quedan: ${e.dados.join(', ')}</div>` : ''}
            ${c.miTurno && !e.dados.length ? `<button class="btn-principal" style="margin-top:10px;" onclick="tirarBackgammon()">🎲 Tirar</button>` : ''}
            <div class="texto-tenue" style="margin-top:4px; font-size:0.72rem;">Pips (cuánto les falta): vos ${pipsBG(e, yo)} · ${nombreJugador(c.rival)} ${pipsBG(e, c.rival)}</div></div>`;
        return h;
    },
    compu: {
        paso(e, bot, yo, nivel) {
            if (e.fase !== 'jugando' || e.turno !== bot) return null;
            if (!e.dados.length) return () => tirarBackgammon();
            const secuencia = mejorSecuenciaBG(e, bot, nivel);
            if (!secuencia.length) return null;
            return async () => { for (const m of secuencia) { const r = await moverBackgammon(m.from, m.d); if (!r) break; await new Promise(ok => setTimeout(ok, 420)); } };
        }
    }
});

// Prueba todas las formas de usar los dados y se queda con la mejor posición.
function mejorSecuenciaBG(e, q, nivel) {
    const otro = q === 'nico' ? 'carito' : 'nico';
    const finales = [];
    const vistos = new Set();
    (function rec(est, camino) {
        const ops = est.dados.length ? movidasBG(est, q) : [];
        if (!ops.length) {
            const clave = JSON.stringify([est.puntos, est.barra, est.fuera]);
            if (!vistos.has(clave)) { vistos.add(clave); finales.push({ est, camino }); }
            return;
        }
        ops.forEach(o => {
            const r = aplicarBG(est, q, o.from, o.d);
            rec({ ...est, puntos: r.puntos, barra: r.barra, fuera: r.fuera, dados: r.dados }, [...camino, { from: o.from, d: o.d }]);
        });
    })(e, []);
    if (!finales.length) return [];
    if (nivel === 'facil') return finales[Math.floor(Math.random() * finales.length)].camino;
    const evaluar = (est) => {
        let v = (pipsBG(est, otro) - pipsBG(est, q)) + est.fuera[q] * 8 + est.barra[otro] * 12;
        for (let i = 0; i < 24; i++) {
            const n = propiasBG(est.puntos[i], q);
            if (n === 1) v -= nivel === 'dificil' ? 6 : 3; // ficha sola: la pueden comer
            if (n >= 2) v += 2.5 + ((q === 'nico' ? i <= 5 : i >= 18) ? 2 : 0);
        }
        return v + Math.random() * 0.5;
    };
    return finales.map(f => ({ ...f, v: evaluar(f.est) })).sort((a, b) => b.v - a.v)[0].camino;
}

function elegirOrigenBG(from) {
    vibrarJ(8);
    _origenBG = String(_origenBG) === String(from) ? null : from;
    if (window.sfx) window.sfx.seleccionar();
    Backgammon.redibujar();
}

async function tirarBackgammon() {
    vibrarJ([8, 20, 8]);
    _origenBG = null;
    const res = await Backgammon.jugar((e) => {
        if (e.dados.length) return null;
        const a = 1 + Math.floor(Math.random() * 6), b = 1 + Math.floor(Math.random() * 6);
        const dados = a === b ? [a, a, a, a] : [a, b];
        const prueba = { ...e, dados };
        if (!movidasBG(prueba, miIdentidad).length) return { tirados: [a, b], dados: [], turno: miRival, aviso: `${nombreJugador(miIdentidad)} sacó ${a} y ${b} y no tiene movidas: pasa.` };
        return { tirados: [a, b], dados, aviso: null, ultimos: [] };
    });
    if (res && window.sfx) window.sfx.dado();
}

async function moverBackgammon(from, d) {
    vibrarJ(10);
    _origenBG = null;
    const res = await Backgammon.jugar((e) => {
        if (!e.dados.includes(d)) return null;
        const r = aplicarBG(e, miIdentidad, from, d);
        if (!r) return null;
        const est = { ...e, puntos: r.puntos, barra: r.barra, fuera: r.fuera, dados: r.dados };
        const sigue = r.dados.length && movidasBG(est, miIdentidad).length;
        const cambios = { puntos: r.puntos, barra: r.barra, fuera: r.fuera, dados: sigue ? r.dados : [], turno: sigue ? miIdentidad : miRival,
            ultimos: [...(e.ultimos || []), ...(from === 'bar' ? [] : [from]), ...(r.t === 'fuera' ? [] : [r.t])],
            aviso: r.comio ? `💥 ${nombreJugador(miIdentidad)} comió una ficha.` : null };
        if (r.fuera[miIdentidad] >= 15) { cambios.ganador = miIdentidad; cambios.motivo = '¡Sacó las 15 fichas!'; }
        return cambios;
    });
    if (res && window.sfx) window.sfx[res.cambios.aviso ? 'golpe' : 'rebote']();
    if (!res) Backgammon.redibujar();
    return res;
}
