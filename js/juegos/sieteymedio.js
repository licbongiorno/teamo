// ==================== SIETE Y MEDIO ====================
// Mazo español de 40: del 1 al 7 valen lo que dicen, las figuras (sota,
// caballo y rey) medio punto. En cada mano uno es la banca y el otro el
// punto. El punto pide cartas (la primera, tapada para el otro) y se planta
// o se pasa de 7½; después juega la banca. Gana el más cercano a 7½ sin
// pasarse; si empatan, gana la banca. Se turnan la banca y gana el primero
// en llevarse 5 manos. Los puntos se guardan dobles (7½ = 15).
const PALOS_SYM = ['espada', 'basto', 'oro', 'copa'];
const EMOJI_PALO_SYM = { espada: '🗡️', basto: '🌳', oro: '🪙', copa: '🏆' };
const MANOS_SYM = 5;
const numSym = (c) => Number(c.split('_')[1]);
const valorSym = (c) => numSym(c) >= 10 ? 1 : numSym(c) * 2;
const totalSym = (l) => l.reduce((a, c) => a + valorSym(c), 0);
const textoPuntosSym = (v) => `${Math.floor(v / 2)}${v % 2 ? '½' : ''}`;
const nombreNumSym = (n) => ({ 1: 'As', 10: 'Sota', 11: 'Caballo', 12: 'Rey' }[n] || String(n));
const naipeSym = (c) => `<div class="naipe-chinchon" data-aj-id="sym-${c}"><span class="nc-palo">${EMOJI_PALO_SYM[c.split('_')[0]]}</span>${nombreNumSym(numSym(c))}</div>`;

function mazoSym(){
    const m = [];
    PALOS_SYM.forEach(p => [1, 2, 3, 4, 5, 6, 7, 10, 11, 12].forEach(n => m.push(p + '_' + n)));
    for (let i = m.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [m[i], m[j]] = [m[j], m[i]]; }
    return m;
}
function manoNuevaSym(banca){
    const mazo = mazoSym(), punto = banca === 'nico' ? 'carito' : 'nico';
    return { mazo, cartas: { [punto]: [mazo.pop()], [banca]: [mazo.pop()] }, banca, etapa: 'punto', turno: punto, resultado: null };
}

const SieteYMedio = JuegoTurnos.crear({
    id: 'sieteymedio',
    emojiListo: '🃏',
    intro: `Acercate a 7½ sin pasarte. Del 1 al 7 valen su número y las figuras medio punto. El punto juega primero y después la banca (que gana los empates). Gana el primero en llevarse ${MANOS_SYM} manos.`,
    inicial: () => { const banca = Math.random() < 0.5 ? 'nico' : 'carito'; return { ...manoNuevaSym(banca), manos: { nico: 0, carito: 0 } }; },
    textoTurno: (e) => `🃏 Tu turno (${e.banca === miIdentidad ? 'sos la banca' : 'sos el punto'}): ¿pedís o te plantás?`,
    render(e, c) {
        const ver = (q) => {
            const l = e.cartas[q] || [], mio = q === c.yo, abierto = mio || e.etapa === 'resultado';
            const visible = abierto ? totalSym(l) : totalSym(l.slice(1));
            return `<div class="lugar-sym${e.turno === q && e.etapa !== 'resultado' ? ' turno' : ''}">
                <div class="texto-tenue">${mio ? 'Vos' : nombreJugador(q)} ${e.banca === q ? '🏦 banca' : '🎯 punto'} · ${abierto ? '' : 'se ve '}${textoPuntosSym(visible)}${!abierto ? ' + ?' : ''}${abierto && visible > 15 ? ' 💥 ¡se pasó!' : ''}</div>
                <div class="mano-sym" ${mio ? 'data-aj-mia' : 'data-aj-rival'}>${l.map((k, i) => !abierto && i === 0 ? '<div class="naipe-chinchon dorso"></div>' : naipeSym(k)).join('')}</div></div>`;
        };
        let h = `<div class="texto-centro" style="font-size:0.85rem;">Manos: ${nombreJugador('nico')} ${e.manos.nico} · ${nombreJugador('carito')} ${e.manos.carito} <span class="texto-tenue">(a ${MANOS_SYM})</span></div>
            <div class="mesa-sym">${ver(c.rival)}<div class="mazo-sym"><div class="naipe-chinchon dorso" data-aj-mazo></div><span class="texto-tenue">${e.mazo.length}</span></div>${ver(c.yo)}</div>`;
        if (e.etapa === 'resultado') {
            h += `<div class="panel texto-centro">${e.resultado}</div>`;
            if (e.fase === 'jugando') h += `<button class="btn-principal" onclick="siguienteSym()">🃏 Siguiente mano</button>`;
        } else if (c.miTurno) {
            h += `<div class="btn-fila"><button class="btn-principal" onclick="pedirSym()">🂠 Pedir carta</button><button class="btn-secundario" onclick="plantarseSym()">✋ Me planto con ${textoPuntosSym(totalSym(e.cartas[c.yo]))}</button></div>`;
        }
        return h;
    },
    compu: {
        paso(e, bot, yo, nivel) {
            if (e.fase !== 'jugando') return null;
            if (e.etapa === 'resultado') {
                // Que se alcance a ver cómo terminó la mano antes de repartir.
                const falta = 3500 - (Date.now() - (e.resultadoEn || 0));
                return falta > 0 ? { esperar: falta } : () => siguienteSym();
            }
            if (e.turno !== bot) return null;
            const t = totalSym(e.cartas[bot]);
            let pide;
            if (e.etapa === 'punto') {
                const tope = nivel === 'facil' ? 8 + Math.floor(Math.random() * 5) : 11;
                pide = t < tope;
                if (nivel === 'dificil') {
                    // Probabilidad de pasarse con las cartas que no ve.
                    const noVistas = [...e.mazo, e.cartas[yo][0]];
                    const pasa = noVistas.filter(k => t + valorSym(k) > 15).length / noVistas.length;
                    pide = t < 9 || pasa < 0.42;
                }
            } else {
                // Banca: conoce todo lo del punto menos la primera.
                const minimoPunto = totalSym(e.cartas[yo].slice(1)) + 1;
                pide = t < Math.max(nivel === 'facil' ? 7 : 9, minimoPunto) && t < 15;
            }
            return pide ? () => pedirSym() : () => plantarseSym();
        }
    }
});

function cerrarManoSym(e, cartas, ganador, texto){
    const manos = { ...e.manos, [ganador]: e.manos[ganador] + 1 };
    const res = { cartas, mazo: e.mazo, etapa: 'resultado', resultadoEn: Date.now(), manos, resultado: `${texto}<br><b>Mano para ${nombreJugador(ganador)}</b>`, turno: null };
    if (manos[ganador] >= MANOS_SYM) return { ...res, ganador, motivo: `Se llevó ${MANOS_SYM} manos.` };
    return res;
}
async function pedirSym(){
    vibrarJ(8);
    await SieteYMedio.jugar((e) => {
        if (e.etapa === 'resultado') return null;
        const mazo = [...e.mazo];
        const carta = mazo.pop();
        const mias = [...e.cartas[miIdentidad], carta];
        const cartas = { ...e.cartas, [miIdentidad]: mias };
        if (totalSym(mias) > 15) {
            return cerrarManoSym({ ...e, mazo }, cartas, miRival, `💥 ${nombreJugador(miIdentidad)} se pasó con ${textoPuntosSym(totalSym(mias))}.`);
        }
        return { mazo, cartas };
    });
    if (window.sfx) window.sfx.cartaFlip ? window.sfx.cartaFlip() : window.sfx.toque();
}
async function plantarseSym(){
    vibrarJ(10);
    await SieteYMedio.jugar((e) => {
        if (e.etapa === 'punto') return { etapa: 'banca', turno: e.banca, aviso: `✋ ${nombreJugador(miIdentidad)} se plantó.` };
        if (e.etapa !== 'banca') return null;
        const punto = e.banca === 'nico' ? 'carito' : 'nico';
        const tp = totalSym(e.cartas[punto]), tb = totalSym(e.cartas[e.banca]);
        const gana = tp > tb ? punto : e.banca;
        return cerrarManoSym(e, e.cartas, gana, `${nombreJugador(punto)} ${textoPuntosSym(tp)} · ${nombreJugador(e.banca)} (banca) ${textoPuntosSym(tb)}${tp === tb ? ' — empate: gana la banca' : ''}`);
    });
}
async function siguienteSym(){
    await SieteYMedio.accion((e) => e.etapa === 'resultado' ? { ...manoNuevaSym(e.banca === 'nico' ? 'carito' : 'nico'), aviso: null } : null);
}
