// ==================== MANCALA (KALAH) ====================
// 14 lugares: 0-5 pozos de Nico, 6 su granero; 7-12 pozos de Carito,
// 13 su granero. Se toma un pozo propio y se siembra de a una semilla
// en sentido antihorario, salteando el granero del otro.
//  - Si la última cae en tu granero, jugás de nuevo.
//  - Si cae en un pozo tuyo vacío y enfrente hay semillas, te llevás
//    las dos cosas a tu granero.
// Termina cuando un lado queda vacío: el resto va a su dueño.
const POZOS_MANCALA = { nico: [0, 1, 2, 3, 4, 5], carito: [7, 8, 9, 10, 11, 12] };
const GRANERO_MANCALA = { nico: 6, carito: 13 };

function sembrarMancala(h, desde, q) {
    const t = [...h];
    let n = t[desde];
    if (!n) return null;
    t[desde] = 0;
    let i = desde;
    const recorrido = [];
    const ajeno = GRANERO_MANCALA[q === 'nico' ? 'carito' : 'nico'];
    while (n > 0) {
        i = (i + 1) % 14;
        if (i === ajeno) continue;
        t[i]++; n--; recorrido.push(i);
    }
    let otraVez = i === GRANERO_MANCALA[q], captura = null;
    if (!otraVez && POZOS_MANCALA[q].includes(i) && t[i] === 1 && t[12 - i] > 0) {
        captura = { pozo: i, enfrente: 12 - i, cant: t[12 - i] + 1 };
        t[GRANERO_MANCALA[q]] += t[12 - i] + 1;
        t[i] = 0; t[12 - i] = 0;
    }
    let fin = false;
    const vacio = (who) => POZOS_MANCALA[who].every(p => t[p] === 0);
    if (vacio('nico') || vacio('carito')) {
        fin = true;
        ['nico', 'carito'].forEach(who => POZOS_MANCALA[who].forEach(p => { t[GRANERO_MANCALA[who]] += t[p]; t[p] = 0; }));
    }
    return { t, otraVez, captura, recorrido, fin };
}

function htmlPozoMancala(n, i, clickable, granero) {
    const semillas = [];
    for (let k = 0; k < Math.min(n, 14); k++) {
        const ang = k * 2.4, rad = 6 + (k % 5) * 3.5;
        semillas.push(`<i style="left:calc(50% + ${Math.cos(ang) * rad}px);top:calc(50% + ${Math.sin(ang) * rad}px);--h:${(k * 47) % 360}"></i>`);
    }
    return `<div class="pozo-mancala${granero ? ' granero' : ''}${clickable ? ' jugable' : ''}" data-pozo="${i}" ${clickable ? `onclick="jugarMancala(${i})"` : ''}>
        <span class="semillas">${semillas.join('')}</span><b class="cuenta">${n}</b></div>`;
}

const Mancala = JuegoTurnos.crear({
    id: 'mancala',
    emojiListo: '🌰',
    intro: 'Tocá uno de tus pozos y las semillas se siembran de a una. Si la última cae en tu granero, jugás de nuevo; si cae en un pozo tuyo vacío, te llevás lo de enfrente. Gana quien junte más.',
    inicial: () => ({ hoyos: [4, 4, 4, 4, 4, 4, 0, 4, 4, 4, 4, 4, 4, 0], ultima: null, turno: Math.random() < 0.5 ? 'nico' : 'carito' }),
    render(e, c) {
        const yo = c.yo, el = c.rival;
        // Mis pozos abajo de izquierda a derecha; los del otro arriba, al revés.
        const mios = POZOS_MANCALA[yo], suyos = [...POZOS_MANCALA[el]].reverse();
        let h = `<div class="tablero-mancala">`;
        h += htmlPozoMancala(e.hoyos[GRANERO_MANCALA[el]], GRANERO_MANCALA[el], false, true);
        h += `<div class="filas-mancala"><div class="fila-mancala">${suyos.map(i => htmlPozoMancala(e.hoyos[i], i, false)).join('')}</div>`;
        h += `<div class="fila-mancala">${mios.map(i => htmlPozoMancala(e.hoyos[i], i, c.miTurno && e.hoyos[i] > 0)).join('')}</div></div>`;
        h += htmlPozoMancala(e.hoyos[GRANERO_MANCALA[yo]], GRANERO_MANCALA[yo], false, true);
        h += `</div><div class="texto-centro texto-tenue" style="font-size:0.75rem; margin-top:4px;">${nombreJugador(el)} arriba (granero a la izquierda) · vos abajo (granero a la derecha)</div>`;
        return h;
    },
    alDibujar(cont, e) {
        // Siembra animada: las casillas del recorrido se iluminan en orden.
        const u = e.ultima;
        if (!u || !u.recorrido || u.visto === cont.dataset.mancalaVisto) return;
        if (cont.dataset.mancalaVisto === undefined) { cont.dataset.mancalaVisto = u.visto; return; }
        cont.dataset.mancalaVisto = u.visto;
        const origen = cont.querySelector(`[data-pozo="${u.desde}"]`);
        if (origen) origen.animate([{ transform: 'scale(0.85)' }, { transform: 'none' }], { duration: 300 });
        u.recorrido.forEach((p, k) => {
            const pozo = cont.querySelector(`[data-pozo="${p}"]`);
            if (!pozo) return;
            pozo.animate([{ boxShadow: '0 0 0 0 rgba(245,217,160,0)' }, { boxShadow: '0 0 0 4px rgba(245,217,160,0.85)', transform: 'scale(1.08)' }, { boxShadow: '0 0 0 0 rgba(245,217,160,0)', transform: 'none' }],
                { duration: 380, delay: k * 130 });
            setTimeout(() => { if (window.sfx && k % 2 === 0) window.sfx.toque(); }, k * 130);
        });
        if (u.captura) setTimeout(() => {
            [u.captura.pozo, u.captura.enfrente].forEach(p => { const pz = cont.querySelector(`[data-pozo="${p}"]`); if (pz) pz.animate([{ transform: 'scale(1.2)', filter: 'brightness(1.6)' }, { transform: 'none', filter: 'none' }], { duration: 500 }); });
            if (window.animJuegos) window.animJuegos.cartel(`🌰 ¡Se lleva ${u.captura.cant}!`, { dur: 1100, sonido: 'acierto' });
        }, u.recorrido.length * 130 + 150);
        else if (u.otraVez) setTimeout(() => { if (window.animJuegos) window.animJuegos.cartel('¡Otra vez!', { dur: 900, sonido: 'pop' }); }, u.recorrido.length * 130 + 150);
    },
    compu: {
        paso(e, bot, yo, nivel) {
            if (e.fase !== 'jugando' || e.turno !== bot) return null;
            const opciones = POZOS_MANCALA[bot].filter(p => e.hoyos[p] > 0);
            if (!opciones.length) return null;
            if (nivel === 'facil' && Math.random() < 0.5) { const p = opciones[Math.floor(Math.random() * opciones.length)]; return () => jugarMancala(p); }
            const prof = nivel === 'facil' ? 1 : nivel === 'normal' ? 4 : 7;
            let mejor = null;
            opciones.forEach(p => {
                const v = minimaxMancala(e.hoyos, p, bot, bot, prof, -Infinity, Infinity) + Math.random() * 0.3;
                if (!mejor || v > mejor.v) mejor = { p, v };
            });
            return () => jugarMancala(mejor.p);
        }
    }
});

function minimaxMancala(h, pozo, quien, bot, prof, a, b) {
    const r = sembrarMancala(h, pozo, quien);
    const otro = quien === 'nico' ? 'carito' : 'nico';
    const sigue = r.otraVez ? quien : otro;
    const ev = () => r.t[GRANERO_MANCALA[bot]] - r.t[GRANERO_MANCALA[bot === 'nico' ? 'carito' : 'nico']];
    if (r.fin || prof <= 1) return ev();
    const ops = POZOS_MANCALA[sigue].filter(p => r.t[p] > 0);
    if (!ops.length) return ev();
    if (sigue === bot) {
        let m = -Infinity;
        for (const p of ops) { m = Math.max(m, minimaxMancala(r.t, p, sigue, bot, prof - 1, a, b)); a = Math.max(a, m); if (a >= b) break; }
        return m;
    }
    let m = Infinity;
    for (const p of ops) { m = Math.min(m, minimaxMancala(r.t, p, sigue, bot, prof - 1, a, b)); b = Math.min(b, m); if (a >= b) break; }
    return m;
}

async function jugarMancala(p) {
    vibrarJ(10);
    const res = await Mancala.jugar((e) => {
        if (!POZOS_MANCALA[miIdentidad].includes(p) || !e.hoyos[p]) return null;
        const r = sembrarMancala(e.hoyos, p, miIdentidad);
        const cambios = { hoyos: r.t, ultima: { desde: p, recorrido: r.recorrido, captura: r.captura, otraVez: r.otraVez, visto: String(Date.now()) + p }, turno: r.otraVez ? miIdentidad : miRival };
        if (r.fin) {
            const gn = r.t[GRANERO_MANCALA.nico], gc = r.t[GRANERO_MANCALA.carito];
            cambios.ganador = gn === gc ? 'empate' : gn > gc ? 'nico' : 'carito';
            cambios.motivo = `Graneros: ${nombreJugador('nico')} ${gn} — ${gc} ${nombreJugador('carito')}`;
        }
        return cambios;
    });
    if (res && window.sfx) window.sfx.pop();
}
