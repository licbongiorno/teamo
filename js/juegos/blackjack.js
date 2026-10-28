// ==================== BLACKJACK ====================
// Los dos juegan contra la casa, cada uno con sus fichas (arrancan con
// 100). Cada mano: apuestan, reciben 2 cartas y por turno piden, se
// plantan o doblan. Pasarse de 21 pierde. Después juega la casa (pide
// hasta 17) y se paga: ganar paga 1 a 1, un blackjack (21 con dos
// cartas) paga 3 a 2. Después de 8 manos gana quien tenga más fichas.
const MANOS_BLACKJACK = 8;
const APUESTAS_BLACKJACK = [10, 20, 50];

function totalBJ(cartas) {
    let t = 0, ases = 0;
    cartas.forEach(c => { const v = valorFr(c); if (v === 14) { ases++; t += 11; } else t += Math.min(v, 10); });
    while (t > 21 && ases) { t -= 10; ases--; }
    return t;
}
const esBlackjack = (cs) => cs.length === 2 && totalBJ(cs) === 21;

// Qué pasa después de que uno termina su mano: le toca al otro, o juega la casa y se paga.
function siguienteBJ(e, cambios) {
    const est = cambios.estados || e.estados;
    const pendiente = ['nico', 'carito'].find(q => est[q] === 'jugando');
    if (pendiente) return { ...cambios, turno: pendiente };
    const mazo = [...(cambios.mazo || e.mazo)];
    const casa = [...e.casa];
    const manos = cambios.manos || e.manos;
    const alguienVivo = ['nico', 'carito'].some(q => est[q] !== 'pasado');
    while (alguienVivo && totalBJ(casa) < 17) casa.push(mazo.shift());
    const tc = totalBJ(casa), bjCasa = esBlackjack(casa);
    const apuestas = cambios.apuestas || e.apuestas;
    const fichas = { ...e.fichas }, resultados = {};
    ['nico', 'carito'].forEach(q => {
        const a = apuestas[q], t = totalBJ(manos[q]);
        let delta, texto;
        if (est[q] === 'pasado') { delta = -a; texto = 'Se pasó 💥'; }
        else if (est[q] === 'blackjack' && !bjCasa) { delta = Math.round(a * 1.5); texto = '¡Blackjack! 🃏'; }
        else if (bjCasa && est[q] !== 'blackjack') { delta = -a; texto = 'La casa tiene blackjack'; }
        else if (tc > 21) { delta = a; texto = 'La casa se pasó 🎉'; }
        else if (t > tc) { delta = a; texto = `Ganó ${t} a ${tc}`; }
        else if (t < tc) { delta = -a; texto = `Perdió ${t} a ${tc}`; }
        else { delta = 0; texto = `Empate a ${t}`; }
        fichas[q] = Math.max(0, fichas[q] + delta);
        resultados[q] = { delta, texto };
    });
    const mano = (e.mano || 0) + 1;
    const res = { ...cambios, mazo, casa, fichas, resultados, etapa: 'resultado', turno: null, mano };
    if (mano >= MANOS_BLACKJACK || fichas.nico === 0 || fichas.carito === 0) {
        res.ganador = fichas.nico === fichas.carito ? 'empate' : fichas.nico > fichas.carito ? 'nico' : 'carito';
        res.motivo = `Fichas: ${nombreJugador('nico')} ${fichas.nico} — ${fichas.carito} ${nombreJugador('carito')}`;
    }
    return res;
}

const Blackjack = JuegoTurnos.crear({
    id: 'blackjack',
    sinTurno: true,
    emojiListo: '🃏',
    intro: `Los dos contra la casa, con 100 fichas cada uno. Apostá, pedí cartas y acercate a 21 sin pasarte. Después de ${MANOS_BLACKJACK} manos gana quien tenga más fichas.`,
    inicial: () => ({ etapa: 'apostar', fichas: { nico: 100, carito: 100 }, apuestas: { nico: 0, carito: 0 }, manos: { nico: [], carito: [] }, casa: [], estados: { nico: null, carito: null }, mazo: [], mano: 0, resultados: null, turno: null }),
    render(e, c) {
        const yo = c.yo, el = c.rival;
        const tapada = e.etapa === 'jugar';
        let h = `<div class="texto-centro texto-tenue" style="font-size:0.8rem;">Mano ${Math.min(e.mano + 1, MANOS_BLACKJACK)} de ${MANOS_BLACKJACK} · Fichas: ${nombreJugador('nico')} ${e.fichas.nico} · ${nombreJugador('carito')} ${e.fichas.carito}</div>`;
        h += `<div class="mesa-bj"><div class="lugar-bj casa"><div class="texto-tenue">🏦 La casa ${e.casa.length && !tapada ? `· ${totalBJ(e.casa)}` : ''}</div>
            <div class="cartas-bj">${e.casa.map((cc, i) => htmlCartaFr(cc, { dorso: tapada && i === 1 })).join('')}</div></div>`;
        [el, yo].forEach(q => {
            const m = e.manos[q] || [];
            const r = e.resultados && e.etapa === 'resultado' ? e.resultados[q] : null;
            h += `<div class="lugar-bj${q === yo ? ' mio' : ''}${e.turno === q ? ' turno' : ''}"><div class="texto-tenue">${q === yo ? 'Vos' : nombreJugador(q)} ${m.length ? `· ${totalBJ(m)}` : ''} ${e.apuestas[q] ? `· apuesta ${e.apuestas[q]}` : ''}</div>
                <div class="cartas-bj" ${q === yo ? 'data-aj-mia' : 'data-aj-rival'}>${m.map(cc => htmlCartaFr(cc)).join('')}</div>
                ${r ? `<div class="resultado-bj ${r.delta > 0 ? 'gano' : r.delta < 0 ? 'perdio' : ''}">${r.texto} ${r.delta > 0 ? '+' : ''}${r.delta}</div>` : ''}</div>`;
        });
        h += `<div data-aj-mazo class="mazo-bj">${htmlCartaFr(null, { dorso: true, chica: true })}</div></div>`;
        if (e.fase === 'jugando') {
            if (e.etapa === 'apostar') {
                h += e.apuestas[yo] ? `<div class="panel texto-centro texto-tenue">Apostaste ${e.apuestas[yo]}. Esperando a ${nombreJugador(el)}…</div>`
                    : `<div class="panel texto-centro"><div style="margin-bottom:8px;">¿Cuánto apostás?</div><div class="btn-fila">${APUESTAS_BLACKJACK.filter(a => a <= e.fichas[yo] || a === APUESTAS_BLACKJACK[0]).map(a => `<button class="btn-secundario ficha-apuesta" onclick="apostarBlackjack(${Math.min(a, e.fichas[yo])})">🪙 ${Math.min(a, e.fichas[yo])}</button>`).join('')}</div></div>`;
            } else if (e.etapa === 'jugar') {
                if (e.turno === yo) {
                    const puedeDoblar = (e.manos[yo] || []).length === 2 && e.fichas[yo] >= e.apuestas[yo] * 2;
                    h += `<div class="panel texto-centro"><div style="margin-bottom:8px;">🎯 Tenés ${totalBJ(e.manos[yo])}</div><div class="btn-fila">
                        <button class="btn-principal" onclick="pedirBlackjack()">➕ Pedir</button>
                        <button class="btn-secundario" onclick="plantarseBlackjack()">✋ Plantarse</button>
                        ${puedeDoblar ? `<button class="btn-secundario" onclick="doblarBlackjack()">✖️2 Doblar</button>` : ''}</div></div>`;
                } else h += `<div class="panel texto-centro texto-tenue">Juega ${nombreJugador(e.turno)}…</div>`;
            } else if (e.etapa === 'resultado') {
                h += `<div class="texto-centro"><button class="btn-principal" onclick="siguienteBlackjack()">Siguiente mano ▶️</button></div>`;
            }
        }
        return h;
    },
    compu: {
        paso(e, bot, yo, nivel) {
            if (e.fase !== 'jugando') return null;
            if (e.etapa === 'apostar' && !e.apuestas[bot]) { const a = nivel === 'dificil' ? 20 : APUESTAS_BLACKJACK[Math.floor(Math.random() * 2)]; return () => apostarBlackjack(Math.min(a, e.fichas[bot])); }
            if (e.etapa !== 'jugar' || e.turno !== bot) return null;
            const t = totalBJ(e.manos[bot]), arriba = valorFr(e.casa[0]), carta = arriba === 14 ? 11 : Math.min(arriba, 10);
            if (nivel === 'facil') return t < 15 ? () => pedirBlackjack() : () => plantarseBlackjack();
            if (nivel === 'dificil' && e.manos[bot].length === 2 && (t === 10 || t === 11) && carta <= 9 && e.fichas[bot] >= e.apuestas[bot] * 2) return () => doblarBlackjack();
            if (t <= 11) return () => pedirBlackjack();
            if (t >= 17) return () => plantarseBlackjack();
            if (t === 12) return (carta >= 4 && carta <= 6) ? () => plantarseBlackjack() : () => pedirBlackjack();
            return carta <= 6 ? () => plantarseBlackjack() : () => pedirBlackjack();
        }
    }
});

async function apostarBlackjack(monto) {
    vibrarJ(10);
    const res = await Blackjack.accion((e) => {
        const yo = miIdentidad;
        if (e.etapa !== 'apostar' || e.apuestas[yo] || monto <= 0 || monto > e.fichas[yo]) return null;
        const apuestas = { ...e.apuestas, [yo]: monto };
        if (!apuestas.nico || !apuestas.carito) return { apuestas };
        const mazo = mazoFrances();
        const manos = { nico: [mazo.shift(), mazo.shift()], carito: [mazo.shift(), mazo.shift()] };
        const casa = [mazo.shift(), mazo.shift()];
        const estados = { nico: esBlackjack(manos.nico) ? 'blackjack' : 'jugando', carito: esBlackjack(manos.carito) ? 'blackjack' : 'jugando' };
        return siguienteBJ({ ...e, casa }, { apuestas, mazo, manos, casa, estados, etapa: 'jugar', resultados: null });
    });
    if (res && window.sfx) window.sfx.moneda();
}
function jugadaBJ(fn) {
    return Blackjack.accion((e) => {
        if (e.etapa !== 'jugar' || e.turno !== miIdentidad) return null;
        return fn(e);
    });
}
async function pedirBlackjack() {
    vibrarJ(10);
    const res = await jugadaBJ((e) => {
        const mazo = [...e.mazo], mano = [...e.manos[miIdentidad], mazo.shift()];
        const t = totalBJ(mano);
        const manos = { ...e.manos, [miIdentidad]: mano };
        if (t < 21) return { mazo, manos };
        return siguienteBJ(e, { mazo, manos, estados: { ...e.estados, [miIdentidad]: t > 21 ? 'pasado' : 'plantado' } });
    });
    if (res && window.sfx) window.sfx.cartaFlip();
}
async function plantarseBlackjack() {
    vibrarJ(10);
    await jugadaBJ((e) => siguienteBJ(e, { estados: { ...e.estados, [miIdentidad]: 'plantado' } }));
}
async function doblarBlackjack() {
    vibrarJ(12);
    const res = await jugadaBJ((e) => {
        if (e.manos[miIdentidad].length !== 2 || e.fichas[miIdentidad] < e.apuestas[miIdentidad] * 2) return null;
        const mazo = [...e.mazo], mano = [...e.manos[miIdentidad], mazo.shift()];
        return siguienteBJ(e, { mazo, manos: { ...e.manos, [miIdentidad]: mano }, apuestas: { ...e.apuestas, [miIdentidad]: e.apuestas[miIdentidad] * 2 },
            estados: { ...e.estados, [miIdentidad]: totalBJ(mano) > 21 ? 'pasado' : 'plantado' } });
    });
    if (res && window.sfx) window.sfx.moneda();
}
async function siguienteBlackjack() {
    await Blackjack.accion((e) => e.etapa === 'resultado' ? { etapa: 'apostar', apuestas: { nico: 0, carito: 0 }, manos: { nico: [], carito: [] }, casa: [], estados: { nico: null, carito: null }, resultados: null } : null);
}
