// ==================== MENTE SINCRONIZADA ====================
// Cooperativo en vivo (tipo The Mind). En el nivel N cada uno recibe N
// cartas del 1 al 100. Sin hablar, hay que ir tirándolas al centro de
// menor a mayor: cada uno tira su carta más baja cuando "siente" que es
// el momento. Si alguien tira una y el otro tenía una más baja, pierden
// una vida (y esas cartas más bajas se descartan). Pasan de nivel cuando
// se quedan sin cartas. 3 vidas; la meta es pasar el nivel 8.
const NIVELES_MENTE = 8, VIDAS_MENTE = 3;

function repartirMente(nivel) {
    const m = [...Array(100).keys()].map(x => x + 1).sort(() => Math.random() - 0.5);
    return { nivel, manos: { nico: m.slice(0, nivel).sort((a, b) => a - b), carito: m.slice(nivel, nivel * 2).sort((a, b) => a - b) }, pila: [], ultima: null };
}

const Mente = JuegoTurnos.crear({
    id: 'mente',
    sinTurno: true,
    emojiListo: '🧠',
    intro: 'Cooperativo y en vivo (los dos conectados a la vez). Cada uno tiene cartas del 1 al 100 y hay que tirarlas al centro de menor a mayor... ¡sin hablar! Tirá tu carta más baja cuando sientas que es el momento. 3 vidas, 8 niveles.',
    inicial: () => ({ ...repartirMente(1), vidas: VIDAS_MENTE, turno: null }),
    tituloFin: (e) => e.motivo && e.motivo.startsWith('🎉') ? '🧠 ¡Mentes sincronizadas!' : '💔 Se acabaron las vidas',
    render(e, c) {
        const yo = c.yo, el = c.rival;
        const mias = e.manos[yo] || [], suyas = (e.manos[el] || []).length;
        const top = e.pila[e.pila.length - 1];
        let h = `<div class="texto-centro" style="font-size:0.9rem;">Nivel <b>${e.nivel}</b> de ${NIVELES_MENTE} · ${'❤️'.repeat(e.vidas)}${'🖤'.repeat(Math.max(0, VIDAS_MENTE - e.vidas))}</div>`;
        h += `<div class="mesa-mente">
            <div class="texto-tenue">${nombreJugador(el)}: ${suyas} carta${suyas === 1 ? '' : 's'}</div>
            <div class="aj-mano-rival">${'<div class="naipe-frances dorso chica"></div>'.repeat(suyas)}</div>
            <div class="centro-mente">${top ? `<div class="carta-mente" data-aj-id="m${top}">${top}</div>` : '<div class="carta-mente vacia">—</div>'}</div>
            ${e.ultima ? `<div class="texto-tenue" style="font-size:0.78rem;">${JuegoTurnos.esc(e.ultima.texto)}</div>` : ''}
            <div class="mano-mente">${mias.map(n => `<div class="carta-mente mia" data-aj-id="m${n}">${n}</div>`).join('')}</div>
        </div>`;
        if (e.fase === 'jugando' && mias.length) h += `<div class="texto-centro"><button class="btn-principal boton-mente" onclick="tirarMente()">Tirar mi ${mias[0]} 🧠</button>
            <div class="texto-tenue" style="font-size:0.75rem; margin-top:6px;">Respiren, mírense (o imagínense), y tiren cuando sientan que es el momento.</div></div>`;
        else if (e.fase === 'jugando') h += `<div class="panel texto-centro texto-tenue">Ya tiraste todo. Esperando a ${nombreJugador(el)}…</div>`;
        return h;
    },
    alDibujar(cont, e) {
        if (!e.ultima || cont.dataset.menteVisto === e.ultima.id) return;
        const primera = cont.dataset.menteVisto === undefined;
        cont.dataset.menteVisto = e.ultima.id;
        if (primera || !window.animJuegos) return;
        if (e.ultima.error) { window.animJuegos.cartel('💔 ¡Ups!', { sub: e.ultima.texto, color: '#ff8a80', dur: 1600, sonido: 'error', vibrar: [40, 30, 40] }); }
        else if (e.ultima.nivel) { window.animJuegos.cartel(`✨ ¡Nivel ${e.ultima.nivel - 1} superado!`, { dur: 1500, sonido: 'logro' }); if (window.fx) window.fx.confeti(30); }
    }
});

async function tirarMente() {
    vibrarJ(12);
    await Mente.accion((e) => {
        const yo = miIdentidad, el = miRival;
        const mias = [...(e.manos[yo] || [])];
        if (!mias.length) return null;
        const carta = mias.shift();
        let suyas = [...(e.manos[el] || [])];
        const id = String(Date.now()) + yo;
        const menores = suyas.filter(n => n < carta);
        let vidas = e.vidas, ultima = { id, texto: `${nombreJugador(yo)} tiró el ${carta}` };
        if (menores.length) {
            vidas--;
            suyas = suyas.filter(n => n > carta);
            ultima = { id, error: true, texto: `${nombreJugador(el)} tenía ${menores.join(', ')}` };
        }
        const manos = { [yo]: mias, [el]: suyas };
        const pila = [...e.pila, carta];
        if (vidas <= 0) return { manos, pila, vidas: 0, ultima, ganador: 'empate', motivo: `Llegaron al nivel ${e.nivel}.` };
        if (!mias.length && !suyas.length) {
            if (e.nivel >= NIVELES_MENTE) return { manos, pila, vidas, ultima, ganador: 'empate', motivo: `🎉 ¡Pasaron los ${NIVELES_MENTE} niveles con ${vidas} vida${vidas === 1 ? '' : 's'}!` };
            return { ...repartirMente(e.nivel + 1), vidas, ultima: { id, nivel: e.nivel + 1, texto: `¡Nivel ${e.nivel} superado!` } };
        }
        return { manos, pila, vidas, ultima };
    });
    if (window.sfx) window.sfx.cartaFlip();
}
