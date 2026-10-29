// ==================== ¿TENÉS…? (Pescar, con naipes españoles) ====================
// Cada uno arranca con 7 cartas. En tu turno pedís un número que tengas:
// si el otro tiene, te da todas las de ese número y seguís; si no,
// "¡Pescá!" y sacás una del pozo (si sacaste justo lo que pediste, seguís).
// Las cuatro de un número forman un juego. Gana quien arma más juegos.
const EMOJI_PALO_PES = { espada: '🗡️', basto: '🌳', oro: '🪙', copa: '🏆' };
const NUMS_PES = [1, 2, 3, 4, 5, 6, 7, 10, 11, 12];
const numPes = (c) => Number(c.split('_')[1]);
const nombrePes = (n) => ({ 1: 'As', 10: 'Sota', 11: 'Caballo', 12: 'Rey' }[n] || String(n));
const pluralPes = (n) => ({ 1: 'ases', 10: 'sotas', 11: 'caballos', 12: 'reyes' }[n] || `${n}s`);
const naipePes = (c, extra) => `<div class="naipe-chinchon${extra || ''}" data-aj-id="pes-${c}"><span class="nc-palo">${EMOJI_PALO_PES[c.split('_')[0]]}</span>${nombrePes(numPes(c))}</div>`;

// Saca los juegos de 4 de una mano.
function juntarJuegosPes(mano, juegos){
    const nuevos = NUMS_PES.filter(n => mano.filter(c => numPes(c) === n).length === 4);
    return { mano: mano.filter(c => !nuevos.includes(numPes(c))), juegos: [...juegos, ...nuevos], nuevos };
}
function ordenarPes(mano){ return [...mano].sort((a, b) => numPes(a) - numPes(b)); }

const Pescar = JuegoTurnos.crear({
    id: 'pescar',
    emojiListo: '🎣',
    intro: 'Pedile al otro un número que tengas en la mano. Si tiene, te da todas y seguís; si no, ¡pescá del pozo! Con las cuatro de un número armás un juego. Gana quien arma más.',
    inicial: () => {
        const m = [];
        Object.keys(EMOJI_PALO_PES).forEach(p => NUMS_PES.forEach(n => m.push(p + '_' + n)));
        for (let i = m.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [m[i], m[j]] = [m[j], m[i]]; }
        const a = juntarJuegosPes(m.splice(0, 7), []), b = juntarJuegosPes(m.splice(0, 7), []);
        return { manos: { nico: a.mano, carito: b.mano }, juegos: { nico: a.juegos, carito: b.juegos }, pozo: m, pedidos: [], turno: Math.random() < 0.5 ? 'nico' : 'carito' };
    },
    textoTurno: () => '🎣 Tu turno: tocá un número de tu mano para pedírselo',
    render(e, c) {
        const mia = ordenarPes(e.manos[c.yo] || []);
        const juegosHtml = (q) => (e.juegos[q] || []).map(n => `<span class="juego-pes">${nombrePes(n)}</span>`).join('') || '<span class="texto-tenue">—</span>';
        let h = `<div class="lugar-sym"><div class="texto-tenue">${nombreJugador(c.rival)} · ${(e.manos[c.rival] || []).length} cartas · juegos: ${juegosHtml(c.rival)}</div>
            <div class="mano-sym" data-aj-rival>${(e.manos[c.rival] || []).map(() => '<div class="naipe-chinchon dorso"></div>').join('')}</div></div>
            <div class="mazo-sym">${e.pozo.length ? '<div class="naipe-chinchon dorso" data-aj-mazo></div>' : ''}<span class="texto-tenue">🎣 ${e.pozo.length ? e.pozo.length + ' en el pozo' : 'El pozo está vacío'}</span></div>`;
        h += `<div class="lugar-sym"><div class="texto-tenue">Vos · juegos: ${juegosHtml(c.yo)}</div>
            <div class="mano-sym" data-aj-mia>${mia.map(k => c.miTurno ? `<button class="boton-naipe-pes" onclick="pedirPes(${numPes(k)})">${naipePes(k)}</button>` : naipePes(k)).join('') || '<span class="texto-tenue">Sin cartas</span>'}</div></div>`;
        return h;
    },
    compu: {
        paso(e, bot, yo, nivel) {
            if (e.fase !== 'jugando' || e.turno !== bot) return null;
            const mano = e.manos[bot];
            if (!mano.length) return null;
            const tengo = [...new Set(mano.map(numPes))];
            // Lo que el otro pidió hace poco (y no se lo llevó nadie): seguro lo tiene.
            const memoria = nivel === 'dificil' ? 12 : nivel === 'normal' ? 4 : 0;
            const sabe = (e.pedidos || []).filter(p => p.quien === yo).slice(-memoria).map(p => p.n).filter(n => tengo.includes(n));
            let n;
            if (sabe.length && (nivel !== 'normal' || Math.random() < 0.7)) n = sabe[sabe.length - 1];
            else if (nivel === 'facil') n = tengo[Math.floor(Math.random() * tengo.length)];
            else n = tengo.sort((a, b) => mano.filter(c => numPes(c) === b).length - mano.filter(c => numPes(c) === a).length)[0];
            return () => pedirPes(n);
        }
    }
});

async function pedirPes(n){
    vibrarJ(10);
    let que = null;
    await Pescar.jugar((e) => {
        que = null;
        let mia = [...e.manos[miIdentidad]], suya = [...e.manos[miRival]];
        if (!mia.some(c => numPes(c) === n)) return null;
        const pozo = [...e.pozo];
        const pedidos = [...(e.pedidos || []), { quien: miIdentidad, n }].slice(-20);
        const dadas = suya.filter(c => numPes(c) === n);
        let sigo, aviso;
        if (dadas.length) {
            mia = [...mia, ...dadas]; suya = suya.filter(c => numPes(c) !== n);
            sigo = true; que = 'dio';
            aviso = `🙌 ${nombreJugador(miRival)} le dio ${dadas.length} ${dadas.length === 1 ? nombrePes(n).toLowerCase() : pluralPes(n)} a ${nombreJugador(miIdentidad)}.`;
        } else {
            const pescada = pozo.pop();
            if (pescada) mia.push(pescada);
            sigo = !!pescada && numPes(pescada) === n;
            que = 'pesca';
            aviso = `🎣 "¡Pescá!" ${nombreJugador(miIdentidad)} pidió ${pluralPes(n)}${sigo ? ' ¡y pescó justo uno!' : '.'}`;
        }
        const j1 = juntarJuegosPes(mia, e.juegos[miIdentidad]);
        mia = j1.mano;
        if (j1.nuevos.length) aviso += ` 🎉 Armó el juego de ${pluralPes(j1.nuevos[0])}.`;
        // Sin cartas en la mano: se roba del pozo para poder seguir.
        if (!mia.length && pozo.length) mia.push(pozo.pop());
        if (!suya.length && pozo.length) suya.push(pozo.pop());
        const juegos = { ...e.juegos, [miIdentidad]: j1.juegos };
        const total = juegos.nico.length + juegos.carito.length;
        const sinCartas = !mia.length && !suya.length;
        const manos = { [miIdentidad]: mia, [miRival]: suya };
        if (total >= NUMS_PES.length || sinCartas) {
            const a = juegos.nico.length, b = juegos.carito.length;
            return { manos, pozo, juegos, pedidos, aviso, ganador: a === b ? 'empate' : a > b ? 'nico' : 'carito', motivo: `Juegos: ${nombreJugador('nico')} ${a} — ${b} ${nombreJugador('carito')}` };
        }
        // Si me quedé sin cartas no puedo seguir pidiendo: pasa el turno.
        return { manos, pozo, juegos, pedidos, aviso, turno: sigo && mia.length ? miIdentidad : (suya.length ? miRival : miIdentidad) };
    });
    if (window.sfx) que === 'dio' ? window.sfx.acierto() : que ? window.sfx.toque() : null;
}
