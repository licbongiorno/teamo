// ==================== EL CHANCHO (dados) ====================
// En tu turno tirás el dado las veces que quieras y vas sumando. Si sale
// un 1, perdés todo lo del turno. Si te plantás, lo guardás. Gana el
// primero que llega a 100.
const META_CHANCHO = 100;
const CARAS_CHANCHO = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

const Chancho = JuegoTurnos.crear({
    id: 'chancho',
    emojiListo: '🐷',
    intro: `Tirá el dado las veces que quieras sumando puntos… pero si sale un 1 ¡perdés todo lo del turno! Plantate a tiempo. Gana el primero en llegar a ${META_CHANCHO}.`,
    inicial: () => ({ puntos: { nico: 0, carito: 0 }, enJuego: 0, dado: null, tiradas: [], turno: Math.random() < 0.5 ? 'nico' : 'carito' }),
    textoTurno: (e) => e.enJuego ? `🎲 Llevás ${e.enJuego} en este turno` : '🎲 Tu turno: tirá el dado',
    render(e, c) {
        const barra = (q) => `<div class="barra-chancho"><span>${nombreJugador(q)}</span><div><i class="ficha-${q}" style="width:${Math.min(100, e.puntos[q])}%"></i><i class="enjuego" style="width:${e.turno === q ? Math.min(100 - Math.min(100, e.puntos[q]), e.enJuego) : 0}%"></i></div><b>${e.puntos[q]}</b></div>`;
        let h = barra('nico') + barra('carito');
        h += `<div class="dado-chancho${e.dado === 1 ? ' uno' : ''}" data-aj-id="dado-chancho-${(e.tiradas || []).length}">${e.dado ? CARAS_CHANCHO[e.dado] : '🎲'}</div>
            <div class="texto-centro">${e.dado === 1 ? '🐷 ¡Salió el chancho! Se pierde lo del turno.' : `En juego: <b>${e.enJuego}</b>`}</div>
            <div class="tiradas-chancho">${(e.tiradas || []).map(d => CARAS_CHANCHO[d]).join(' ')}</div>`;
        if (c.miTurno) h += `<div class="btn-fila"><button class="btn-principal" onclick="tirarChancho()">🎲 Tirar</button><button class="btn-secundario" ${e.enJuego ? '' : 'disabled style="opacity:0.5;"'} onclick="plantarseChancho()">✋ Plantarme (+${e.enJuego})</button></div>`;
        return h;
    },
    compu: {
        paso(e, bot, yo, nivel) {
            if (e.fase !== 'jugando' || e.turno !== bot) return null;
            const mio = e.puntos[bot], suyo = e.puntos[yo];
            let tope = nivel === 'facil' ? 12 : 20;
            if (nivel === 'dificil') tope = suyo >= 80 ? 35 : mio > suyo + 25 ? 15 : 22;
            if (mio + e.enJuego >= META_CHANCHO || (e.enJuego >= tope)) return () => plantarseChancho();
            return () => tirarChancho();
        }
    }
});

async function tirarChancho(){
    vibrarJ([8, 20, 8]);
    if (window.sfx) window.sfx.dado ? window.sfx.dado() : window.sfx.toque();
    const d = 1 + Math.floor(Math.random() * 6);
    await Chancho.jugar((e) => {
        const tiradas = [...(e.tiradas || []), d].slice(-12);
        if (d === 1) return { dado: 1, enJuego: 0, tiradas: [], turno: miRival, aviso: `🐷 ${nombreJugador(miIdentidad)} sacó un 1 y perdió lo del turno.` };
        return { dado: d, enJuego: e.enJuego + d, tiradas, aviso: null };
    });
}
async function plantarseChancho(){
    vibrarJ(10);
    await Chancho.jugar((e) => {
        if (!e.enJuego) return null;
        const puntos = { ...e.puntos, [miIdentidad]: e.puntos[miIdentidad] + e.enJuego };
        if (puntos[miIdentidad] >= META_CHANCHO) return { puntos, enJuego: 0, ganador: miIdentidad, motivo: `¡Llegó a ${puntos[miIdentidad]}!` };
        return { puntos, enJuego: 0, dado: null, tiradas: [], turno: miRival, aviso: `✋ ${nombreJugador(miIdentidad)} se plantó con ${e.enJuego}.` };
    });
    if (window.sfx) window.sfx.acierto();
}
