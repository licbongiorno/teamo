// ==================== DOMINÓ (doble seis, de a dos) ====================
// 28 fichas, 7 para cada uno y 14 al pozo. Por turno se pone una ficha
// que coincida con una de las dos puntas de la mesa. Si no tenés, robás
// del pozo; si el pozo está vacío, pasás. Gana quien se queda sin fichas;
// si los dos pasan seguido (tranque), gana quien tenga menos puntos.
// Las fichas se guardan como texto "a-b" (Firestore no acepta listas de listas).
const PUNTOS_DOMINO = { 0: [], 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
const partesDomino = (f) => f.split('-').map(Number);
const claveDomino = (f) => { const [a, b] = partesDomino(f); return Math.min(a, b) + '-' + Math.max(a, b); };
const sumaDomino = (mano) => mano.reduce((t, f) => { const [a, b] = partesDomino(f); return t + a + b; }, 0);
function puntasDomino(cadena) {
    if (!cadena.length) return null;
    return { izq: partesDomino(cadena[0])[0], der: partesDomino(cadena[cadena.length - 1])[1] };
}
// Lados donde entra la ficha: [] si no entra.
function ladosDomino(cadena, f) {
    const p = puntasDomino(cadena);
    if (!p) return ['der'];
    const [a, b] = partesDomino(f), res = [];
    if (a === p.izq || b === p.izq) res.push('izq');
    if (a === p.der || b === p.der) res.push('der');
    return res;
}
function htmlFichaDomino(f, opts) {
    opts = opts || {};
    const [a, b] = partesDomino(f);
    const mitad = (n) => `<span class="mitad-domino">${[...Array(9)].map((_, i) => `<i${PUNTOS_DOMINO[n].includes(i) ? ' class="on"' : ''}></i>`).join('')}</span>`;
    return `<span class="ficha-domino${opts.clase ? ' ' + opts.clase : ''}${a === b ? ' doble' : ''}" data-aj-id="do-${claveDomino(f)}" ${opts.onclick ? `onclick="${opts.onclick}"` : ''}>${mitad(a)}<span class="raya-domino"></span>${mitad(b)}</span>`;
}

let _fichaElegidaDomino = null;

const Domino = JuegoTurnos.crear({
    id: 'domino',
    emojiListo: '🁫',
    intro: 'Dominó de doble seis: 7 fichas para cada uno. Poné una ficha que coincida con una de las puntas de la mesa. Si no tenés, robá del pozo. Gana el primero en quedarse sin fichas.',
    inicial: () => {
        const todas = [];
        for (let a = 0; a <= 6; a++) for (let b = a; b <= 6; b++) todas.push(a + '-' + b);
        for (let i = todas.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [todas[i], todas[j]] = [todas[j], todas[i]]; }
        return { manos: { nico: todas.slice(0, 7), carito: todas.slice(7, 14) }, pozo: todas.slice(14), cadena: [], pases: 0 };
    },
    textoTurno: (e) => {
        const mano = e.manos[miIdentidad] || [];
        return mano.some(f => ladosDomino(e.cadena, f).length) ? '🎯 Tu turno: poné una ficha' : (e.pozo.length ? '🎯 No tenés: robá del pozo' : '🎯 No tenés ni hay pozo: pasá');
    },
    render(e, c) {
        const mano = e.manos[c.yo] || [], rival = (e.manos[c.rival] || []).length;
        const p = puntasDomino(e.cadena);
        const elegida = c.miTurno && _fichaElegidaDomino && mano.includes(_fichaElegidaDomino) ? _fichaElegidaDomino : null;
        const lados = elegida ? ladosDomino(e.cadena, elegida) : [];
        let h = `<div class="texto-centro texto-tenue" style="font-size:0.8rem;">${nombreJugador(c.rival)}: ${rival} ficha${rival === 1 ? '' : 's'} · Pozo: ${e.pozo.length}</div>
            <div class="aj-mano-rival">${'<span class="ficha-domino dorso"></span>'.repeat(Math.min(rival, 10))}</div>`;
        h += `<div class="mesa-domino">`;
        if (!e.cadena.length) h += '<span class="texto-tenue">La mesa está vacía: cualquier ficha sirve</span>';
        if (lados.includes('izq') && e.cadena.length) h += `<button class="punta-domino" onclick="ponerDomino('izq')">◀ acá</button>`;
        e.cadena.forEach(f => { h += htmlFichaDomino(f, { clase: 'en-mesa' }); });
        if (lados.includes('der') && e.cadena.length) h += `<button class="punta-domino" onclick="ponerDomino('der')">acá ▶</button>`;
        h += `</div>`;
        if (p) h += `<div class="texto-centro texto-tenue" style="font-size:0.75rem;">Puntas: ${p.izq} y ${p.der}</div>`;
        const juegaAlgo = mano.some(f => ladosDomino(e.cadena, f).length);
        h += `<div class="panel"><div class="texto-tenue" style="margin-bottom:8px;">Tu mano (${sumaDomino(mano)} puntos):</div><div class="mano-domino" data-aj-mia>`;
        mano.forEach(f => {
            const ok = c.miTurno && ladosDomino(e.cadena, f).length;
            h += htmlFichaDomino(f, { clase: (ok ? 'jugable' : 'apagada') + (f === elegida ? ' elegida' : ''), onclick: ok ? `elegirDomino('${f}')` : '' });
        });
        h += `</div>`;
        if (c.miTurno && !juegaAlgo) h += `<div class="btn-fila" style="margin-top:10px;">${e.pozo.length ? `<button class="btn-principal" onclick="robarDomino()">🀫 Robar del pozo</button>` : `<button class="btn-secundario" onclick="pasarDomino()">Pasar</button>`}</div>`;
        return h + `</div>`;
    },
    compu: {
        paso(e, bot, yo, nivel) {
            if (e.fase !== 'jugando' || e.turno !== bot) return null;
            const mano = e.manos[bot] || [];
            const ops = [];
            mano.forEach(f => ladosDomino(e.cadena, f).forEach(l => ops.push({ f, l })));
            if (!ops.length) return e.pozo.length ? () => robarDomino() : () => pasarDomino();
            let elegida;
            if (nivel === 'facil') elegida = ops[Math.floor(Math.random() * ops.length)];
            else {
                elegida = ops.map(o => {
                    const [a, b] = partesDomino(o.f);
                    const resto = mano.filter(x => x !== o.f);
                    // Puntas que quedan: mejor si después tengo con qué seguir.
                    const p = puntasDomino(e.cadena);
                    const p2 = !p ? { izq: a, der: b } : o.l === 'izq' ? { izq: a === p.izq ? b : a, der: p.der } : { izq: p.izq, der: a === p.der ? b : a };
                    const sigo = resto.filter(x => partesDomino(x).some(v => v === p2.izq || v === p2.der)).length;
                    return { ...o, v: a + b + (a === b ? 4 : 0) + (nivel === 'dificil' ? sigo * 2.5 : sigo) + Math.random() };
                }).sort((x, y) => y.v - x.v)[0];
            }
            return () => ponerDomino(elegida.l, elegida.f);
        }
    }
});

function elegirDomino(f) {
    vibrarJ(8);
    const e = Domino.estado;
    if (!e) return;
    const lados = ladosDomino(e.cadena, f);
    if (lados.length === 1 || !e.cadena.length) { _fichaElegidaDomino = f; ponerDomino(lados[0] || 'der'); return; }
    // Entra en las dos puntas: que elija dónde (salvo que sean iguales).
    const p = puntasDomino(e.cadena);
    if (p.izq === p.der) { _fichaElegidaDomino = f; ponerDomino('der'); return; }
    _fichaElegidaDomino = _fichaElegidaDomino === f ? null : f;
    if (window.sfx) window.sfx.seleccionar();
    Domino.redibujar();
}

async function ponerDomino(lado, fichaCompu) {
    const f = fichaCompu || _fichaElegidaDomino;
    if (!f) return;
    _fichaElegidaDomino = null;
    const res = await Domino.jugar((e) => {
        const mano = e.manos[miIdentidad] || [];
        if (!mano.includes(f) || !ladosDomino(e.cadena, f).includes(lado)) return null;
        const [a, b] = partesDomino(f);
        const p = puntasDomino(e.cadena);
        let cadena;
        if (!p) cadena = [f];
        else if (lado === 'izq') cadena = [(b === p.izq ? a + '-' + b : b + '-' + a), ...e.cadena];
        else cadena = [...e.cadena, (a === p.der ? a + '-' + b : b + '-' + a)];
        const nuevaMano = mano.filter(x => x !== f);
        const cambios = { cadena, manos: { ...e.manos, [miIdentidad]: nuevaMano }, pases: 0, turno: miRival };
        if (!nuevaMano.length) { cambios.ganador = miIdentidad; cambios.motivo = `¡Se quedó sin fichas! (${nombreJugador(miRival)} tenía ${sumaDomino(e.manos[miRival] || [])} puntos)`; }
        return cambios;
    });
    if (res && window.sfx) window.sfx.golpe();
    if (!res) Domino.redibujar();
}

async function robarDomino() {
    vibrarJ(8);
    const res = await Domino.jugar((e) => {
        const mano = e.manos[miIdentidad] || [];
        if (!e.pozo.length || mano.some(f => ladosDomino(e.cadena, f).length)) return null;
        return { pozo: e.pozo.slice(1), manos: { ...e.manos, [miIdentidad]: [...mano, e.pozo[0]] } };
    });
    if (res && window.sfx) window.sfx.cartaFlip();
}

async function pasarDomino() {
    await Domino.jugar((e) => {
        const mano = e.manos[miIdentidad] || [];
        if (e.pozo.length || mano.some(f => ladosDomino(e.cadena, f).length)) return null;
        const pases = (e.pases || 0) + 1;
        if (pases >= 2) {
            const sn = sumaDomino(e.manos.nico || []), sc = sumaDomino(e.manos.carito || []);
            return { pases, ganador: sn === sc ? 'empate' : sn < sc ? 'nico' : 'carito', motivo: `¡Tranque! Puntos en la mano: ${nombreJugador('nico')} ${sn} — ${sc} ${nombreJugador('carito')}` };
        }
        return { pases, turno: miRival, aviso: `${nombreJugador(miIdentidad)} pasó.` };
    });
}
