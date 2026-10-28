// ==================== GOMOKU (5 EN LÍNEA) ====================
// Tablero de 13x13 (array plano de 169). Por turno se pone una piedra;
// gana quien arma 5 seguidas en horizontal, vertical o diagonal.
const TAM_GOMOKU = 13;
const DIRS_GOMOKU = [[0, 1], [1, 0], [1, 1], [1, -1]];

function lineaGomoku(t, i, q) {
    const f0 = Math.floor(i / TAM_GOMOKU), c0 = i % TAM_GOMOKU;
    for (const [df, dc] of DIRS_GOMOKU) {
        const linea = [i];
        for (const s of [1, -1]) {
            let f = f0 + df * s, c = c0 + dc * s;
            while (f >= 0 && f < TAM_GOMOKU && c >= 0 && c < TAM_GOMOKU && t[f * TAM_GOMOKU + c] === q) { linea.push(f * TAM_GOMOKU + c); f += df * s; c += dc * s; }
        }
        if (linea.length >= 5) return linea;
    }
    return null;
}

const Gomoku = JuegoTurnos.crear({
    id: 'gomoku',
    emojiListo: '⚫',
    intro: 'Tablero de 13×13. Por turnos pongan una piedra: el primero en armar 5 seguidas (horizontal, vertical o diagonal) gana.',
    inicial: () => ({ tablero: new Array(TAM_GOMOKU * TAM_GOMOKU).fill(null), ultima: null, linea: null, turno: 'nico' }),
    render(e, c) {
        let h = `<div class="tablero-juego tablero-gomoku" style="grid-template-columns:repeat(${TAM_GOMOKU},1fr);">`;
        e.tablero.forEach((x, i) => {
            const clases = ['casilla-tablero', 'casilla-gomoku'];
            if ((e.linea || []).includes(i)) clases.push('casilla-ganadora');
            h += `<div class="${clases.join(' ')}" ${!x && c.miTurno ? `onclick="jugarGomoku(${i})"` : ''}>${x ? `<span class="piedra-gomoku p-${x}${e.ultima === i ? ' ultima' : ''}" data-aj-id="g${i}"></span>` : ''}</div>`;
        });
        return h + '</div>';
    },
    compu: {
        paso(e, bot, yo, nivel) {
            if (e.fase !== 'jugando' || e.turno !== bot) return null;
            const i = mejorJugadaGomoku(e.tablero, bot, yo, nivel);
            return i == null ? null : () => jugarGomoku(i);
        }
    }
});

async function jugarGomoku(i) {
    vibrarJ(10);
    const res = await Gomoku.jugar((e) => {
        if (e.tablero[i]) return null;
        const t = [...e.tablero];
        t[i] = miIdentidad;
        const linea = lineaGomoku(t, i, miIdentidad);
        if (linea) return { tablero: t, ultima: i, linea, ganador: miIdentidad, motivo: '¡Cinco en línea!' };
        if (t.every(Boolean)) return { tablero: t, ultima: i, ganador: 'empate', motivo: 'Se llenó el tablero.' };
        return { tablero: t, ultima: i, turno: miRival };
    });
    if (res && window.sfx) window.sfx.toque();
}

// La compu puntúa cada casilla vacía cerca de las piedras: cuánto arma
// para ella (ataque) y cuánto le corta al otro (defensa).
function valorTramoGomoku(n, abiertos) {
    if (n >= 5) return 100000;
    if (n === 4) return abiertos === 2 ? 20000 : abiertos === 1 ? 4000 : 0;
    if (n === 3) return abiertos === 2 ? 3000 : abiertos === 1 ? 300 : 0;
    if (n === 2) return abiertos === 2 ? 200 : abiertos === 1 ? 30 : 0;
    return abiertos === 2 ? 10 : 2;
}
function puntajeCasillaGomoku(t, i, q) {
    const f0 = Math.floor(i / TAM_GOMOKU), c0 = i % TAM_GOMOKU;
    let total = 0;
    for (const [df, dc] of DIRS_GOMOKU) {
        let n = 1, abiertos = 0;
        for (const s of [1, -1]) {
            let f = f0 + df * s, c = c0 + dc * s;
            while (f >= 0 && f < TAM_GOMOKU && c >= 0 && c < TAM_GOMOKU && t[f * TAM_GOMOKU + c] === q) { n++; f += df * s; c += dc * s; }
            if (f >= 0 && f < TAM_GOMOKU && c >= 0 && c < TAM_GOMOKU && !t[f * TAM_GOMOKU + c]) abiertos++;
        }
        total += valorTramoGomoku(n, abiertos);
    }
    return total;
}
function mejorJugadaGomoku(t, bot, yo, nivel) {
    const centro = Math.floor(TAM_GOMOKU * TAM_GOMOKU / 2);
    if (t.every(x => !x)) return centro;
    const candidatas = [];
    t.forEach((x, i) => {
        if (x) return;
        const f = Math.floor(i / TAM_GOMOKU), c = i % TAM_GOMOKU;
        let cerca = false;
        for (let df = -2; df <= 2 && !cerca; df++) for (let dc = -2; dc <= 2; dc++) {
            const ff = f + df, cc = c + dc;
            if (ff >= 0 && ff < TAM_GOMOKU && cc >= 0 && cc < TAM_GOMOKU && t[ff * TAM_GOMOKU + cc]) { cerca = true; break; }
        }
        if (cerca) candidatas.push(i);
    });
    const defensa = nivel === 'facil' ? 0.5 : nivel === 'normal' ? 0.9 : 1.05;
    let mejor = null;
    candidatas.forEach(i => {
        let v = puntajeCasillaGomoku(t, i, bot) + defensa * puntajeCasillaGomoku(t, i, yo);
        v *= 1 + (Math.random() - 0.5) * (nivel === 'facil' ? 1.2 : nivel === 'normal' ? 0.2 : 0.04);
        if (!mejor || v > mejor.v) mejor = { i, v };
    });
    return mejor ? mejor.i : null;
}
