// ==================== HEX ====================
// Tablero rombo de 9×9 hexágonos. Nico 🔵 une el borde de arriba con el de
// abajo; Carito 🩷 el de la izquierda con el de la derecha. Nunca hay
// empate. Regla del cambio: después de la primera ficha, el segundo puede
// quedársela (pasa a ser suya) en vez de jugar.
// Tablero: texto de 81 letras ('.', 'n', 'c'); casilla = fila*9 + columna.
const N_HEX = 9;
const LETRA_HEX = { nico: 'n', carito: 'c' };
const VECINOS_HEX = (i) => {
    const f = Math.floor(i / N_HEX), c = i % N_HEX, r = [];
    [[-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0]].forEach(([df, dc]) => {
        const nf = f + df, nc = c + dc;
        if (nf >= 0 && nf < N_HEX && nc >= 0 && nc < N_HEX) r.push(nf * N_HEX + nc);
    });
    return r;
};
const inicioHex = (q, i) => q === 'nico' ? Math.floor(i / N_HEX) === 0 : i % N_HEX === 0;
const finHex = (q, i) => q === 'nico' ? Math.floor(i / N_HEX) === N_HEX - 1 : i % N_HEX === N_HEX - 1;

// Camino ganador (lista de casillas) o null.
function caminoHex(t, q){
    const l = LETRA_HEX[q], prev = {}, cola = [];
    for (let i = 0; i < N_HEX * N_HEX; i++) if (t[i] === l && inicioHex(q, i)) { prev[i] = -1; cola.push(i); }
    while (cola.length) {
        const i = cola.shift();
        if (finHex(q, i)) { const r = []; let k = i; while (k !== -1) { r.push(k); k = prev[k]; } return r; }
        VECINOS_HEX(i).forEach(j => { if (t[j] === l && !(j in prev)) { prev[j] = i; cola.push(j); } });
    }
    return null;
}
// Cuántas casillas vacías le faltan a q para unir sus bordes (0-1 BFS).
function faltanHex(t, q){
    const l = LETRA_HEX[q], dist = Array(N_HEX * N_HEX).fill(Infinity), dq = [];
    const costo = (i) => t[i] === l ? 0 : t[i] === '.' ? 1 : Infinity;
    for (let i = 0; i < N_HEX * N_HEX; i++) if (inicioHex(q, i) && costo(i) < Infinity) { dist[i] = costo(i); costo(i) ? dq.push(i) : dq.unshift(i); }
    while (dq.length) {
        const i = dq.shift();
        VECINOS_HEX(i).forEach(j => {
            const cj = costo(j);
            if (cj === Infinity || dist[i] + cj >= dist[j]) return;
            dist[j] = dist[i] + cj;
            cj ? dq.push(j) : dq.unshift(j);
        });
    }
    let m = Infinity;
    for (let i = 0; i < N_HEX * N_HEX; i++) if (finHex(q, i)) m = Math.min(m, dist[i]);
    return m;
}

const Hex = JuegoTurnos.crear({
    id: 'hex',
    emojiListo: '⬡',
    intro: 'Uní tus dos bordes con un camino de fichas: Nico 🔵 de arriba a abajo, Carito 🩷 de izquierda a derecha. ¡En Hex nunca hay empate! Después de la primera ficha, el otro puede "cambiar" y quedársela.',
    inicial: () => ({ tablero: '.'.repeat(N_HEX * N_HEX), turno: Math.random() < 0.5 ? 'nico' : 'carito', jugadas: 0, ultima: null, linea: null }),
    render(e, c) {
        const linea = new Set(e.linea || []);
        const ancho = 100 / (N_HEX + (N_HEX - 1) / 2);
        let h = `<div class="tablero-hex">`;
        for (let i = 0; i < N_HEX * N_HEX; i++) {
            const f = Math.floor(i / N_HEX), col = i % N_HEX, v = e.tablero[i];
            const cls = ['celda-hex', v === 'n' ? 'ficha-nico' : v === 'c' ? 'ficha-carito' : '',
                f === 0 || f === N_HEX - 1 ? 'borde-n' : '', col === 0 || col === N_HEX - 1 ? 'borde-c' : '',
                linea.has(i) ? 'ganadora' : '', e.ultima === i ? 'ultima' : ''].filter(Boolean).join(' ');
            h += `<button class="${cls}" style="left:${(col + f / 2) * ancho}%; top:${f * 10.71}%; width:${ancho}%;" ${c.miTurno && v === '.' ? `onclick="jugarHex(${i})"` : 'tabindex="-1"'} data-aj-id="hex-${i}"></button>`;
        }
        h += `</div><div class="texto-centro texto-tenue" style="font-size:0.8rem;">🔵 ${nombreJugador('nico')}: arriba ↕ abajo · 🩷 ${nombreJugador('carito')}: izquierda ↔ derecha</div>`;
        if (c.miTurno && e.jugadas === 1) h += `<button class="btn-secundario" onclick="cambiarHex()">🔄 Cambiar: quedarme con esa ficha</button>`;
        return h;
    },
    compu: {
        paso(e, bot, yo, nivel) {
            if (e.fase !== 'jugando' || e.turno !== bot) return null;
            const i = mejorJugadaHex(e.tablero, bot, nivel);
            return i == null ? null : () => jugarHex(i);
        }
    }
});

async function jugarHex(i){
    vibrarJ(10);
    const res = await Hex.jugar((e) => {
        if (e.tablero[i] !== '.') return null;
        const t = e.tablero.slice(0, i) + LETRA_HEX[miIdentidad] + e.tablero.slice(i + 1);
        const camino = caminoHex(t, miIdentidad);
        if (camino) return { tablero: t, ultima: i, jugadas: e.jugadas + 1, linea: camino, ganador: miIdentidad, motivo: '¡Unió sus dos bordes!' };
        return { tablero: t, ultima: i, jugadas: e.jugadas + 1, turno: miRival };
    });
    if (res && window.sfx) window.sfx.toque();
}
async function cambiarHex(){
    vibrarJ(10);
    await Hex.jugar((e) => {
        if (e.jugadas !== 1) return null;
        const i = e.tablero.search(/[nc]/);
        // La ficha se refleja sobre la diagonal para que valga igual con mi dirección.
        const f = Math.floor(i / N_HEX), c = i % N_HEX, j = c * N_HEX + f;
        const t = '.'.repeat(N_HEX * N_HEX).split(''); t[j] = LETRA_HEX[miIdentidad];
        return { tablero: t.join(''), ultima: j, jugadas: 2, turno: miRival, aviso: `🔄 ${nombreJugador(miIdentidad)} usó el cambio.` };
    });
}
// Compu: la casilla que más le acorta su camino y más le alarga el del otro.
function mejorJugadaHex(t, bot, nivel){
    const yo = bot === 'nico' ? 'carito' : 'nico';
    const libres = [];
    for (let i = 0; i < t.length; i++) if (t[i] === '.') libres.push(i);
    if (t.indexOf('n') < 0 && t.indexOf('c') < 0) return 40 + (nivel === 'facil' ? Math.floor(Math.random() * 7) - 3 : 0);
    const valor = (tt) => faltanHex(tt, yo) - faltanHex(tt, bot) * 1.1;
    const pon = (tt, i, q) => tt.slice(0, i) + LETRA_HEX[q] + tt.slice(i + 1);
    let lista = libres.map(i => {
        const nt = pon(t, i, bot);
        if (caminoHex(nt, bot)) return { i, v: Infinity };
        // Cerca de las fichas suma un poquito (jugar conectado).
        const cerca = VECINOS_HEX(i).filter(j => t[j] !== '.').length * 0.05;
        return { i, v: valor(nt) + cerca + (Math.random() - 0.5) * (nivel === 'facil' ? 3 : nivel === 'normal' ? 0.4 : 0.05) };
    }).sort((a, b) => b.v - a.v);
    if (nivel === 'dificil' && lista[0].v !== Infinity) {
        // Mira la mejor respuesta del otro para las mejores 6.
        lista = lista.slice(0, 6).map(({ i }) => {
            const nt = pon(t, i, bot);
            let peor = Infinity;
            libres.forEach(j => { if (j === i) return; const r = pon(nt, j, yo); peor = Math.min(peor, caminoHex(r, yo) ? -Infinity : valor(r)); });
            return { i, v: peor };
        }).sort((a, b) => b.v - a.v);
    }
    return lista[0].i;
}
