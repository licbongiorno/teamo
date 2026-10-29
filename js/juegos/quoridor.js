// ==================== QUORIDOR ====================
// Tablero de 9x9. En tu turno movés tu peón un casillero (o saltás al otro
// si está pegado) o ponés una pared de dos casilleros para trabarlo. Cada
// uno tiene 10 paredes y nunca se puede cerrar del todo el camino. Gana el
// primero que llega a la otra punta. Nico arranca abajo y va hacia arriba.
// Paredes: "h" + fila + col (debajo de las casillas (f,c) y (f,c+1)) o
// "v" + fila + col (a la derecha de (f,c) y (f+1,c)), con fila y col de 0 a 7.
const N_QUO = 9, PAREDES_QUO = 10;
const META_QUO = { nico: 0, carito: N_QUO - 1 };
let _modoQuo = 'mover', _paredQuo = null;

const filaQuo = (i) => Math.floor(i / N_QUO), colQuo = (i) => i % N_QUO;
// ¿Hay pared entre la casilla a y la vecina b?
function bloqueadoQuo(paredes, a, b){
    const fa = filaQuo(a), ca = colQuo(a), fb = filaQuo(b), cb = colQuo(b);
    const p = new Set(paredes);
    if (fa === fb) { // movimiento horizontal: paredes verticales
        const c = Math.min(ca, cb);
        return p.has(`v${fa}${c}`) || p.has(`v${fa - 1}${c}`);
    }
    const f = Math.min(fa, fb); // vertical: paredes horizontales
    return p.has(`h${f}${ca}`) || p.has(`h${f}${ca - 1}`);
}
function vecinasQuo(paredes, i){
    const f = filaQuo(i), c = colQuo(i), r = [];
    [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(([df, dc]) => {
        const nf = f + df, nc = c + dc;
        if (nf < 0 || nf >= N_QUO || nc < 0 || nc >= N_QUO) return;
        const j = nf * N_QUO + nc;
        if (!bloqueadoQuo(paredes, i, j)) r.push(j);
    });
    return r;
}
function distanciaQuo(paredes, desde, filaMeta){
    const d = { [desde]: 0 }, cola = [desde];
    while (cola.length) {
        const i = cola.shift();
        if (filaQuo(i) === filaMeta) return d[i];
        vecinasQuo(paredes, i).forEach(j => { if (!(j in d)) { d[j] = d[i] + 1; cola.push(j); } });
    }
    return Infinity;
}
function caminoQuo(paredes, desde, filaMeta){
    const prev = { [desde]: null }, cola = [desde];
    while (cola.length) {
        const i = cola.shift();
        if (filaQuo(i) === filaMeta) { const r = []; let k = i; while (k !== desde) { r.unshift(k); k = prev[k]; } return r; }
        vecinasQuo(paredes, i).forEach(j => { if (!(j in prev)) { prev[j] = i; cola.push(j); } });
    }
    return null;
}
// Movimientos del peón (con salto recto o en diagonal si atrás hay pared).
function movidasQuo(e, quien){
    const yo = e.peones[quien], el = e.peones[quien === 'nico' ? 'carito' : 'nico'], r = [];
    vecinasQuo(e.paredes, yo).forEach(j => {
        if (j !== el) { r.push(j); return; }
        const df = filaQuo(j) - filaQuo(yo), dc = colQuo(j) - colQuo(yo);
        const atras = (filaQuo(j) + df) * N_QUO + colQuo(j) + dc;
        const dentro = filaQuo(j) + df >= 0 && filaQuo(j) + df < N_QUO && colQuo(j) + dc >= 0 && colQuo(j) + dc < N_QUO;
        if (dentro && !bloqueadoQuo(e.paredes, j, atras)) r.push(atras);
        else vecinasQuo(e.paredes, j).forEach(k => { if (k !== yo && k !== atras) r.push(k); });
    });
    return r;
}
function paredValidaQuo(e, w){
    if (!/^[hv][0-7][0-7]$/.test(w)) return false;
    const t = w[0], f = Number(w[1]), c = Number(w[2]), p = new Set(e.paredes);
    if (p.has(w)) return false;
    if (t === 'h' && (p.has(`h${f}${c - 1}`) || p.has(`h${f}${c + 1}`) || p.has(`v${f}${c}`))) return false;
    if (t === 'v' && (p.has(`v${f - 1}${c}`) || p.has(`v${f + 1}${c}`) || p.has(`h${f}${c}`))) return false;
    const nuevas = [...e.paredes, w];
    return distanciaQuo(nuevas, e.peones.nico, META_QUO.nico) < Infinity && distanciaQuo(nuevas, e.peones.carito, META_QUO.carito) < Infinity;
}

const Quoridor = JuegoTurnos.crear({
    id: 'quoridor',
    emojiListo: '🧱',
    intro: `Llevá tu peón a la otra punta antes que el otro. En tu turno: mover un casillero o poner una pared (tenés ${PAREDES_QUO}). Nunca se puede encerrar del todo a nadie.`,
    inicial: () => ({ peones: { nico: (N_QUO - 1) * N_QUO + 4, carito: 4 }, paredes: [], quedan: { nico: PAREDES_QUO, carito: PAREDES_QUO }, turno: Math.random() < 0.5 ? 'nico' : 'carito', ultima: null }),
    render(e, c) {
        const giro = c.yo === 'carito'; // cada uno ve su peón abajo
        const movs = c.miTurno && _modoQuo === 'mover' ? new Set(movidasQuo(e, c.yo)) : new Set();
        const p = new Set(e.paredes), prev = _paredQuo && c.miTurno ? _paredQuo : null;
        let h = `<div class="tablero-juego tablero-quo">`;
        for (let k = 0; k < N_QUO * N_QUO; k++) {
            const i = giro ? N_QUO * N_QUO - 1 - k : k;
            const f = filaQuo(i), col = colQuo(i);
            // Bordes según paredes (en coordenadas reales; si está girado se intercambian lados).
            const abajo = p.has(`h${f}${col}`) || p.has(`h${f}${col - 1}`), arriba = p.has(`h${f - 1}${col}`) || p.has(`h${f - 1}${col - 1}`);
            const der = p.has(`v${f}${col}`) || p.has(`v${f - 1}${col}`), izq = p.has(`v${f}${col - 1}`) || p.has(`v${f - 1}${col - 1}`);
            const pv = prev && ((prev[0] === 'h' && (f === +prev[1] || f === +prev[1] + 1) && (col === +prev[2] || col === +prev[2] + 1) && (f === +prev[1] ? 'abajo' : 'arriba'))
                || (prev[0] === 'v' && (f === +prev[1] || f === +prev[1] + 1) && (col === +prev[2] || col === +prev[2] + 1) && (col === +prev[2] ? 'der' : 'izq')));
            const lados = { arriba, abajo, der, izq };
            const cls = ['casilla-quo', f === META_QUO[c.yo] ? 'meta-mia' : '', movs.has(i) ? 'destino' : '', String(e.ultima) === String(i) ? 'ultima' : ''];
            const real = (lado) => giro ? { arriba: 'abajo', abajo: 'arriba', der: 'izq', izq: 'der' }[lado] : lado;
            Object.entries(lados).forEach(([lado, si]) => { if (si) cls.push('p-' + real(lado)); });
            if (pv) cls.push('pv-' + real(pv));
            const peon = e.peones.nico === i ? 'nico' : e.peones.carito === i ? 'carito' : null;
            const accion = !c.miTurno ? '' : _modoQuo === 'mover' ? (movs.has(i) ? `moverQuo(${i})` : '') : `marcarParedQuo(${i})`;
            h += `<button class="${cls.join(' ')}" ${accion ? `onclick="${accion}"` : 'tabindex="-1"'}>${peon ? `<span class="peon-quo ficha-${peon}" data-aj-id="peon-${peon}"></span>` : ''}</button>`;
        }
        h += `</div>`;
        h += `<div class="texto-centro" style="font-size:0.85rem;">🧱 Paredes: ${nombreJugador('nico')} ${e.quedan.nico} · ${nombreJugador('carito')} ${e.quedan.carito}
            <span class="texto-tenue"> · Te faltan ${distanciaQuo(e.paredes, e.peones[c.yo], META_QUO[c.yo])} pasos, a ${nombreJugador(c.rival)} ${distanciaQuo(e.paredes, e.peones[c.rival], META_QUO[c.rival])}</span></div>`;
        if (c.miTurno) {
            h += `<div class="modos-quo">${[['mover', '🚶 Mover'], ['h', '➖ Pared'], ['v', '➗ Pared']].map(([m, t]) => `<button class="${_modoQuo === m ? 'activa' : ''}" ${m !== 'mover' && !e.quedan[c.yo] ? 'disabled' : ''} onclick="modoQuo('${m}')">${m === 'v' ? '│ Pared' : t}</button>`).join('')}</div>`;
            if (_modoQuo !== 'mover') h += `<div class="texto-tenue texto-centro" style="font-size:0.78rem;">Tocá una casilla para ubicar la pared ${_modoQuo === 'h' ? 'acostada (va debajo de esa casilla y la de al lado)' : 'parada (va a la derecha de esa casilla y la de abajo)'}.</div>
                ${_paredQuo ? `<div class="btn-fila"><button class="btn-principal" onclick="ponerParedQuo()">🧱 Poner acá</button><button class="btn-secundario" onclick="marcarParedQuo(null)">Cancelar</button></div>` : ''}`;
        }
        return h;
    },
    alDibujar(cont, e) { if (e.fase !== 'jugando' || e.turno !== miIdentidad) { _paredQuo = null; _modoQuo = 'mover'; } },
    compu: {
        paso(e, bot, yo, nivel) {
            if (e.fase !== 'jugando' || e.turno !== bot) return null;
            const j = jugadaCompuQuo(e, bot, nivel);
            if (!j) return null;
            return j.tipo === 'pared' ? () => { _paredQuo = j.w; return ponerParedQuo(); } : () => moverQuo(j.a);
        }
    }
});

function modoQuo(m){ vibrarJ(6); _modoQuo = m; _paredQuo = null; Quoridor.redibujar(); }
function marcarParedQuo(i){
    vibrarJ(6);
    if (i == null) { _paredQuo = null; Quoridor.redibujar(); return; }
    // La pared se ancla en la casilla tocada (desde la vista de cada uno).
    let f = filaQuo(i), c = colQuo(i);
    if (miIdentidad === 'carito') { f -= 1; c -= 1; } // tablero girado: "debajo" y "a la derecha" se invierten
    f = Math.max(0, Math.min(7, f)); c = Math.max(0, Math.min(7, c));
    _paredQuo = `${_modoQuo}${f}${c}`;
    Quoridor.redibujar();
}
async function moverQuo(j){
    vibrarJ(10);
    const res = await Quoridor.jugar((e) => {
        if (!movidasQuo(e, miIdentidad).includes(j)) return null;
        const peones = { ...e.peones, [miIdentidad]: j };
        if (filaQuo(j) === META_QUO[miIdentidad]) return { peones, ultima: j, ganador: miIdentidad, motivo: '¡Llegó a la otra punta!' };
        return { peones, ultima: j, turno: miRival };
    });
    if (res && window.sfx) window.sfx.toque();
}
async function ponerParedQuo(){
    const w = _paredQuo;
    if (!w) return;
    const res = await Quoridor.jugar((e) => {
        if (!e.quedan[miIdentidad] || !paredValidaQuo(e, w)) return null;
        return { paredes: [...e.paredes, w], quedan: { ...e.quedan, [miIdentidad]: e.quedan[miIdentidad] - 1 }, ultima: null, turno: miRival };
    });
    _paredQuo = null; _modoQuo = 'mover';
    if (!res) { if (window.sfx) window.sfx.error(); if (window.animJuegos) window.animJuegos.cartel('Ahí no se puede', { sub: 'Se cruza con otra pared o encierra a alguien', dur: 1300, sonido: false }); Quoridor.redibujar(); }
    else if (window.sfx) window.sfx.dado ? window.sfx.dado() : window.sfx.toque();
}

// Compu: si va ganando la carrera, avanza; si no, busca la pared que más
// alarga el camino del otro sin alargar tanto el propio.
function jugadaCompuQuo(e, bot, nivel){
    const yo = bot === 'nico' ? 'carito' : 'nico';
    const dBot = distanciaQuo(e.paredes, e.peones[bot], META_QUO[bot]), dYo = distanciaQuo(e.paredes, e.peones[yo], META_QUO[yo]);
    const avanzar = () => {
        const movs = movidasQuo(e, bot);
        let mejor = movs[0], mv = Infinity;
        movs.forEach(m => { const d = distanciaQuo(e.paredes, m, META_QUO[bot]) + (filaQuo(m) === META_QUO[bot] ? -99 : 0); if (d < mv) { mv = d; mejor = m; } });
        if (nivel === 'facil' && Math.random() < 0.25) mejor = movs[Math.floor(Math.random() * movs.length)];
        return { tipo: 'mover', a: mejor };
    };
    const tirar = nivel === 'facil' ? 0.2 : nivel === 'normal' ? 0.7 : 1;
    if (!e.quedan[bot] || dBot < dYo || (dBot === dYo && e.turno === bot) || Math.random() > tirar) return avanzar();
    // Candidatas: paredes junto al camino corto del otro.
    const camino = [e.peones[yo], ...(caminoQuo(e.paredes, e.peones[yo], META_QUO[yo]) || [])].slice(0, nivel === 'dificil' ? 6 : 3);
    const cand = new Set();
    camino.forEach(i => { const f = filaQuo(i), c = colQuo(i); for (let df = -1; df <= 0; df++) for (let dc = -1; dc <= 0; dc++) ['h', 'v'].forEach(t => cand.add(`${t}${f + df}${c + dc}`)); });
    let mejor = null, mv = 0;
    cand.forEach(w => {
        if (!paredValidaQuo(e, w)) return;
        const nuevas = [...e.paredes, w];
        const v = (distanciaQuo(nuevas, e.peones[yo], META_QUO[yo]) - dYo) - (distanciaQuo(nuevas, e.peones[bot], META_QUO[bot]) - dBot) * 0.9;
        if (v > mv) { mv = v; mejor = w; }
    });
    return mejor && mv >= (nivel === 'dificil' ? 1 : 2) ? { tipo: 'pared', w: mejor } : avanzar();
}
