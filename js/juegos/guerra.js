// ==================== LA GUERRA ====================
// Mazo francés repartido en dos. Los dos dan vuelta su carta de arriba
// (cada uno cuando quiere); la más alta se lleva las dos. Si empatan es
// ¡GUERRA!: cada uno pone 3 cartas boca abajo y otra boca arriba, y la
// más alta se lleva todo. Gana quien se queda con todas las cartas (o
// quien tenga más después de 120 rondas).
const RONDAS_MAX_GUERRA = 120;

function mezclarGuerra(a) {
    const m = [...a];
    for (let i = m.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [m[i], m[j]] = [m[j], m[i]]; }
    return m;
}

const Guerra = JuegoTurnos.crear({
    id: 'guerra',
    sinTurno: true,
    emojiListo: '⚔️',
    intro: 'Cada uno tiene medio mazo. Den vuelta su carta de arriba: la más alta se lleva las dos. Si empatan, ¡GUERRA! Gana quien se queda con todas las cartas.',
    inicial: () => {
        const m = mazoFrances();
        return { mazos: { nico: m.slice(0, 26), carito: m.slice(26) }, mesa: { nico: null, carito: null }, pozo: [], ronda: 0, ultima: null, enGuerra: false, turno: null };
    },
    render(e, c) {
        const yo = c.yo, el = c.rival;
        const carta = (q) => e.mesa[q] ? htmlCartaFr(e.mesa[q]) : (e.ultima && e.ultima[q] ? htmlCartaFr(e.ultima[q], { clase: 'apagada' }) : '<div class="aj-hueco-naipe fr"></div>');
        let h = `<div class="texto-centro texto-tenue" style="font-size:0.8rem;">Ronda ${e.ronda} · ${nombreJugador(el)}: ${e.mazos[el].length} cartas</div>`;
        h += `<div class="mesa-guerra">
            <div class="lado-guerra"><div class="pila-guerra">${e.mazos[el].length ? htmlCartaFr(null, { dorso: true }) : ''}</div>${carta(el)}</div>
            <div class="centro-guerra">${e.enGuerra ? '<div class="cartel-guerra">⚔️ ¡GUERRA!</div>' : ''}${e.pozo.length ? `<div class="pozo-guerra">${'<div class="naipe-frances dorso chica"></div>'.repeat(Math.min(e.pozo.length, 6))}<small>${e.pozo.length} en juego</small></div>` : ''}
                ${e.ultima && e.ultima.ganador ? `<div class="texto-tenue" style="font-size:0.78rem;">Se las llevó ${nombreJugador(e.ultima.ganador)}</div>` : ''}</div>
            <div class="lado-guerra">${carta(yo)}<div class="pila-guerra" data-aj-mia>${e.mazos[yo].length ? htmlCartaFr(null, { dorso: true, mazo: true }) : ''}</div></div>
        </div>`;
        const yaDi = !!e.mesa[yo];
        h += `<div class="texto-centro"><button class="btn-principal" ${yaDi ? 'disabled style="opacity:0.5;"' : ''} onclick="voltearGuerra()">${yaDi ? `Esperando a ${nombreJugador(el)}…` : '🂠 Dar vuelta'}</button>
            <div class="texto-tenue" style="margin-top:6px; font-size:0.8rem;">Tus cartas: ${e.mazos[yo].length}</div></div>`;
        return h;
    },
    alDibujar(cont, e) {
        if (!e.ultima || cont.dataset.guerraVisto === e.ultima.id) return;
        const primera = cont.dataset.guerraVisto === undefined;
        cont.dataset.guerraVisto = e.ultima.id;
        if (!primera && e.ultima.guerra && window.animJuegos) window.animJuegos.cartel('⚔️ ¡GUERRA!', { dur: 1200, sonido: 'explosion', color: '#ff9b6b' });
    },
    compu: { paso: (e, bot) => (e.fase === 'jugando' && !e.mesa[bot] && e.mazos[bot].length) ? () => voltearGuerra() : null }
});

async function voltearGuerra() {
    vibrarJ(10);
    const res = await Guerra.accion((e) => {
        const yo = miIdentidad, el = miRival;
        if (e.mesa[yo] || !e.mazos[yo].length) return null;
        const mazos = { nico: [...e.mazos.nico], carito: [...e.mazos.carito] };
        const mesa = { ...e.mesa, [yo]: mazos[yo].shift() };
        if (!mesa[el]) return { mazos, mesa };
        // Dieron vuelta los dos: se resuelve.
        const a = valorFr(mesa.nico), b = valorFr(mesa.carito);
        let pozo = [...e.pozo, mesa.nico, mesa.carito];
        const id = String(Date.now()) + yo;
        if (a === b) {
            // ¡Guerra! 3 boca abajo cada uno (o las que tengan, guardando una para dar vuelta).
            ['nico', 'carito'].forEach(q => { const n = Math.min(3, Math.max(0, mazos[q].length - 1)); pozo = pozo.concat(mazos[q].splice(0, n)); });
            const cambios = { mazos, mesa: { nico: null, carito: null }, pozo, enGuerra: true, ronda: e.ronda + 1, ultima: { id, nico: mesa.nico, carito: mesa.carito, guerra: true } };
            const sinCartas = ['nico', 'carito'].filter(q => !mazos[q].length);
            if (sinCartas.length) { const g = sinCartas.length === 2 ? 'empate' : (sinCartas[0] === 'nico' ? 'carito' : 'nico'); return { ...cambios, ganador: g, motivo: 'Se quedó sin cartas en plena guerra.' }; }
            return cambios;
        }
        const ganador = a > b ? 'nico' : 'carito';
        mazos[ganador] = mazos[ganador].concat(mezclarGuerra(pozo));
        const cambios = { mazos, mesa: { nico: null, carito: null }, pozo: [], enGuerra: false, ronda: e.ronda + 1, ultima: { id, nico: mesa.nico, carito: mesa.carito, ganador } };
        const perdedor = ganador === 'nico' ? 'carito' : 'nico';
        if (!mazos[perdedor].length) return { ...cambios, ganador, motivo: '¡Se quedó con las 52 cartas!' };
        if (cambios.ronda >= RONDAS_MAX_GUERRA) {
            const n = mazos.nico.length, c = mazos.carito.length;
            return { ...cambios, ganador: n === c ? 'empate' : n > c ? 'nico' : 'carito', motivo: `Después de ${RONDAS_MAX_GUERRA} rondas: ${nombreJugador('nico')} ${n} — ${c} ${nombreJugador('carito')} cartas` };
        }
        return cambios;
    });
    if (res && window.sfx) window.sfx.cartaFlip();
}
