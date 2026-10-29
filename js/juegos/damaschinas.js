// ==================== DAMAS CHINAS (de a dos) ====================
// Tablero estrella de 121 agujeros. Cada uno arranca con 10 fichas en una
// punta y tiene que llevarlas todas a la punta de enfrente. Se mueve a un
// agujero vecino o se salta por encima de una ficha (de cualquiera) a un
// agujero libre, y los saltos se pueden encadenar.
// Coordenadas cúbicas (x, y, z) con x+y+z = 0: la estrella es la unión de
// los triángulos {x,y,z ≥ -4} y {x,y,z ≤ 4}. Nico arranca en x > 4 (abajo)
// y va a x < -4 (arriba); Carito al revés.
const PUNTOS_DCH = (() => {
    const l = [];
    for (let x = -8; x <= 8; x++) for (let y = -8; y <= 8; y++) {
        const z = -x - y;
        const t1 = x >= -4 && y >= -4 && z >= -4, t2 = x <= 4 && y <= 4 && z <= 4;
        if (t1 || t2) l.push([x, y, z]);
    }
    return l;
})();
const INDICE_DCH = new Map(PUNTOS_DCH.map((p, i) => [p.join(','), i]));
const DIRS_DCH = [[1, -1, 0], [1, 0, -1], [0, 1, -1], [-1, 1, 0], [-1, 0, 1], [0, -1, 1]];
const VECINO_DCH = (i, d, k) => { const p = PUNTOS_DCH[i]; return INDICE_DCH.get([p[0] + d[0] * k, p[1] + d[1] * k, p[2] + d[2] * k].join(',')); };
const CASA_DCH = { nico: (p) => p[0] > 4, carito: (p) => p[0] < -4 };
const META_DCH = { nico: CASA_DCH.carito, carito: CASA_DCH.nico };
const LETRA_DCH = { nico: 'n', carito: 'c' };
let _origenDch = null;

function tableroInicialDch(){
    return PUNTOS_DCH.map(p => CASA_DCH.nico(p) ? 'n' : CASA_DCH.carito(p) ? 'c' : '.').join('');
}
// Destinos posibles desde i: pasos simples y cadenas de saltos.
function destinosDch(t, i){
    const res = new Set();
    DIRS_DCH.forEach(d => { const j = VECINO_DCH(i, d, 1); if (j != null && t[j] === '.') res.add(j); });
    const vistos = new Set([i]), cola = [i];
    while (cola.length) {
        const k = cola.shift();
        DIRS_DCH.forEach(d => {
            const m = VECINO_DCH(k, d, 1), j = VECINO_DCH(k, d, 2);
            if (m != null && j != null && t[m] !== '.' && t[j] === '.' && !vistos.has(j)) { vistos.add(j); res.add(j); cola.push(j); }
        });
    }
    res.delete(i);
    return [...res];
}
function ganoDch(t, quien){
    // La punta de enfrente llena y con al menos una ficha propia (así el otro no la puede bloquear).
    const meta = PUNTOS_DCH.map((p, i) => META_DCH[quien](p) ? i : -1).filter(i => i >= 0);
    return meta.every(i => t[i] !== '.') && meta.some(i => t[i] === LETRA_DCH[quien]);
}
// Avance: qué tan cerca está cada ficha de la punta de enfrente (x hacia -8 o 8).
function avanceDch(t, quien){
    const s = quien === 'nico' ? -1 : 1;
    let v = 0;
    for (let i = 0; i < t.length; i++) if (t[i] === LETRA_DCH[quien]) { const p = PUNTOS_DCH[i]; v += s * p[0] * 2 - Math.abs(p[1] - p[2]) * 0.3; }
    return v;
}

const DamasChinas = JuegoTurnos.crear({
    id: 'damaschinas',
    emojiListo: '⭐',
    intro: 'Llevá tus 10 fichas a la punta de enfrente. Movés a un agujero vecino o saltás sobre cualquier ficha a un agujero libre… ¡y los saltos se encadenan!',
    inicial: () => ({ tablero: tableroInicialDch(), turno: Math.random() < 0.5 ? 'nico' : 'carito', ultima: null, jugadas: 0 }),
    render(e, c) {
        const t = e.tablero, mia = LETRA_DCH[c.yo];
        const destinos = c.miTurno && _origenDch != null && t[_origenDch] === mia ? new Set(destinosDch(t, _origenDch)) : new Set();
        const ultima = e.ultima ? e.ultima.split('-').map(Number) : [];
        // Nico juega de abajo hacia arriba; a Carito se le da vuelta el tablero.
        const giro = c.yo === 'carito' ? -1 : 1;
        let h = `<div class="estrella-dch">`;
        PUNTOS_DCH.forEach(([x, y], i) => {
            const px = 50 + giro * (y + x / 2) * 6.4, py = 50 + giro * x * 5.54;
            const f = t[i];
            const cls = ['agujero-dch', CASA_DCH.nico(PUNTOS_DCH[i]) ? 'zona-n' : CASA_DCH.carito(PUNTOS_DCH[i]) ? 'zona-c' : '',
                destinos.has(i) ? 'destino' : '', _origenDch === i ? 'origen' : '', ultima.includes(i) ? 'ultima' : ''].join(' ');
            const accion = c.miTurno ? (destinos.has(i) ? `moverDch(${i})` : f === mia ? `elegirDch(${i})` : '') : '';
            h += `<button class="${cls}" style="left:${px}%; top:${py}%;" ${accion ? `onclick="${accion}"` : 'tabindex="-1"'}>${f !== '.' ? `<span class="ficha-dch ficha-${f === 'n' ? 'nico' : 'carito'}" data-aj-id="dch-${i}"></span>` : ''}</button>`;
        });
        h += `</div>`;
        const enMeta = (q) => PUNTOS_DCH.filter((p, i) => t[i] === LETRA_DCH[q] && META_DCH[q](p)).length;
        h += `<div class="texto-centro texto-tenue" style="font-size:0.8rem;">En la meta: ${nombreJugador('nico')} ${enMeta('nico')}/10 · ${nombreJugador('carito')} ${enMeta('carito')}/10</div>`;
        return h;
    },
    alDibujar(cont, e) { if (e.fase !== 'jugando' || e.turno !== miIdentidad) _origenDch = null; },
    compu: {
        paso(e, bot, yo, nivel) {
            if (e.fase !== 'jugando' || e.turno !== bot) return null;
            const m = mejorJugadaDch(e.tablero, bot, nivel);
            return m ? () => { _origenDch = m[0]; return moverDch(m[1]); } : null;
        }
    }
});

function elegirDch(i){ vibrarJ(6); _origenDch = _origenDch === i ? null : i; if (window.sfx) window.sfx.seleccionar && window.sfx.seleccionar(); DamasChinas.redibujar(); }
async function moverDch(j){
    const i = _origenDch;
    if (i == null) return;
    vibrarJ(10);
    const res = await DamasChinas.jugar((e) => {
        const t = e.tablero, mia = LETRA_DCH[miIdentidad];
        if (t[i] !== mia || !destinosDch(t, i).includes(j)) return null;
        const nt = t.split(''); nt[i] = '.'; nt[j] = mia;
        const tablero = nt.join(''), jugadas = (e.jugadas || 0) + 1;
        if (ganoDch(tablero, miIdentidad)) return { tablero, ultima: `${i}-${j}`, jugadas, ganador: miIdentidad, motivo: '¡Llegaron las 10 fichas a la punta de enfrente!' };
        if (jugadas >= 400) return { tablero, ultima: `${i}-${j}`, jugadas, ganador: 'empate', motivo: 'Demasiadas jugadas: quedó empatada.' };
        return { tablero, ultima: `${i}-${j}`, jugadas, turno: miRival };
    });
    _origenDch = null;
    if (res && window.sfx) window.sfx.toque();
}

// La compu busca la jugada que más avanza; en normal y difícil mira
// además la mejor respuesta propia siguiente y no deja fichas atrás.
function mejorJugadaDch(t, bot, nivel){
    const mia = LETRA_DCH[bot];
    const jugadas = [];
    for (let i = 0; i < t.length; i++) if (t[i] === mia) destinosDch(t, i).forEach(j => jugadas.push([i, j]));
    if (!jugadas.length) return null;
    const aplicar = (tt, [i, j]) => { const n = tt.split(''); n[i] = '.'; n[j] = mia; return n.join(''); };
    const base = avanceDch(t, bot);
    let mejor = null, mejorV = -Infinity;
    jugadas.forEach(m => {
        const nt = aplicar(t, m);
        if (ganoDch(nt, bot)) { mejorV = Infinity; mejor = m; return; }
        let v = avanceDch(nt, bot) - base;
        // No dejar fichas en la casa de salida mucho tiempo.
        const rezagadas = PUNTOS_DCH.filter((p, k) => nt[k] === mia && CASA_DCH[bot](p)).length;
        v -= rezagadas * (nivel === 'facil' ? 0 : 0.4);
        if (nivel !== 'facil' && v > -2) {
            let sig = 0;
            for (let k = 0; k < nt.length && sig < 30; k++) if (nt[k] === mia) destinosDch(nt, k).forEach(d => { sig = Math.max(sig, avanceDch(aplicar(nt, [k, d]), bot) - avanceDch(nt, bot)); });
            v += sig * (nivel === 'dificil' ? 0.5 : 0.25);
        }
        v += (Math.random() - 0.5) * (nivel === 'facil' ? 6 : nivel === 'normal' ? 1 : 0.2);
        if (v > mejorV) { mejorV = v; mejor = m; }
    });
    return mejor;
}
