// ==================== COCINA DE A DOS (cooperativo en vivo) ====================
// Llegan pedidos y cada uno tiene la mitad de los ingredientes en su
// alacena. El plato es compartido: los dos van agregando lo suyo y cuando
// coincide con un pedido, sale servido. Si alguien pone algo que no va en
// ningún pedido, el plato se quema. Sirvan 8 antes de que se acabe el turno.
const INGREDIENTES_COCINA = { a: '🍞', b: '🧀', c: '🍅', d: '🥬', e: '🥩', f: '🥚', g: '🥑', h: '🥓' };
const NOMBRES_COCINA = { a: 'pan', b: 'queso', c: 'tomate', d: 'lechuga', e: 'carne', f: 'huevo', g: 'palta', h: 'panceta' };
const SEGUNDOS_COCINA = 120, META_COCINA = 8, VIDA_PEDIDO = 35, MAX_PERDIDOS_COCINA = 3;
let _timerCocina = null, _ultimoVencerCocina = 0;

function pedidoCocina(alacenas, ahora, extra){
    // Siempre lleva algo de cada alacena: obliga a cocinar de a dos.
    const tam = Math.random() < 0.35 ? 2 : Math.random() < 0.7 ? 3 : 4;
    const de = (q) => alacenas[q].split('').sort(() => Math.random() - 0.5);
    const n = de('nico'), c = de('carito');
    const ing = [n[0], c[0]];
    const resto = [...n.slice(1), ...c.slice(1)].sort(() => Math.random() - 0.5);
    while (ing.length < tam) ing.push(resto.shift());
    return { id: Math.random().toString(36).slice(2, 7), ing: ing.sort().join(''), hasta: ahora + (VIDA_PEDIDO + (extra || 0)) * 1000 };
}

const Cocina = JuegoTurnos.crear({
    id: 'cocina',
    sinTurno: true,
    emojiListo: '👩‍🍳',
    intro: `Juegan en equipo y en vivo. Cada uno tiene la mitad de los ingredientes: agreguen lo suyo al plato compartido para armar los pedidos. Si ponen algo que no va, ¡se quema! Sirvan ${META_COCINA} en ${SEGUNDOS_COCINA / 60} minutos.`,
    inicial: () => {
        const todos = Object.keys(INGREDIENTES_COCINA).sort(() => Math.random() - 0.5);
        const alacenas = { nico: todos.slice(0, 4).sort().join(''), carito: todos.slice(4).sort().join('') };
        const t = window.ahoraSync();
        return { alacenas, pedidos: [pedidoCocina(alacenas, t, 5), pedidoCocina(alacenas, t, 15), pedidoCocina(alacenas, t, 25)], plato: '', servidos: 0, perdidos: 0, quemados: 0, inicio: t, turno: null };
    },
    tituloFin: (e) => e.motivo && e.motivo.startsWith('🎉') ? '👩‍🍳 ¡Servicio impecable!' : '🔥 Se cerró la cocina',
    render(e, c) {
        VivoComun.sync('cocina', e);
        const mia = (e.alacenas && e.alacenas[c.yo]) || '';
        const ahora = VivoComun.reloj('cocina');
        let h = `<div class="zona-cocina"><div class="texto-centro" style="font-size:0.9rem;">🍽️ Servidos <b>${e.servidos}</b>/${META_COCINA} · ⏱️ <b id="reloj-cocina">${SEGUNDOS_COCINA}</b>s · ❌ ${e.perdidos}/${MAX_PERDIDOS_COCINA}</div>`;
        h += `<div class="pedidos-cocina">${e.pedidos.map(p => {
            const quedan = Math.max(0, Math.ceil((p.hasta - ahora) / 1000));
            const enPlato = e.plato && [...e.plato].every(k => p.ing.includes(k));
            return `<div class="pedido-cocina${enPlato ? ' encaminado' : ''}" data-aj-id="ped-${p.id}">
                <div class="ing-pedido">${[...p.ing].map(k => `<span class="${e.plato.includes(k) ? 'puesto' : ''}${mia.includes(k) ? ' mio' : ''}">${INGREDIENTES_COCINA[k]}</span>`).join('')}</div>
                <div class="barra-pedido"><i data-hasta="${p.hasta}" style="width:${Math.min(100, quedan * 100 / VIDA_PEDIDO)}%"></i></div></div>`;
        }).join('')}</div>`;
        h += `<div class="plato-cocina"><span class="texto-tenue">Plato:</span> ${e.plato ? [...e.plato].map(k => INGREDIENTES_COCINA[k]).join(' ') : '<span class="texto-tenue">vacío</span>'}</div>`;
        h += `<div class="texto-tenue texto-centro" style="font-size:0.78rem;">Tu alacena (los de ${nombreJugador(c.rival)} los pone ${nombreJugador(c.rival)}):</div>
            <div class="alacena-cocina">${[...mia].map(k => `<button ${e.fase === 'jugando' ? `onclick="agregarCocina('${k}')"` : 'disabled'}><span>${INGREDIENTES_COCINA[k]}</span>${NOMBRES_COCINA[k]}</button>`).join('')}</div>`;
        if (e.fase === 'jugando' && e.plato) h += `<button class="btn-secundario" onclick="tirarPlatoCocina()">🗑️ Tirar el plato</button>`;
        return h + '</div>';
    },
    alDibujar(cont, e) {
        clearInterval(_timerCocina);
        VivoComun.montar('cocina', Cocina, cont, e, { velo: cont.querySelector('.zona-cocina') });
        if (e.fase !== 'jugando') return;
        const tic = () => {
            if (VivoComun.pausa('cocina')) return;
            const ahora = VivoComun.reloj('cocina');
            const quedan = Math.max(0, Math.ceil(SEGUNDOS_COCINA - (ahora - e.inicio) / 1000));
            const r = document.getElementById('reloj-cocina');
            if (r) r.textContent = quedan;
            document.querySelectorAll('.barra-pedido i').forEach(i => { i.style.width = Math.max(0, Math.min(100, (Number(i.dataset.hasta) - ahora) / 10 / VIDA_PEDIDO)) + '%'; });
            if ((quedan <= 0 || e.pedidos.some(p => p.hasta <= ahora)) && Date.now() - _ultimoVencerCocina > 1500) { _ultimoVencerCocina = Date.now(); vencerCocina(); }
        };
        tic();
        _timerCocina = setInterval(tic, 400);
        window._unsubTimerCocina = () => clearInterval(_timerCocina);
    }
});

async function agregarCocina(k){
    if (VivoComun.pausa('cocina')) return;
    vibrarJ(8);
    let resultado = null;
    await Cocina.accion((e) => {
        resultado = null;
        if (!(e.alacenas[miIdentidad] || '').includes(k) || e.plato.includes(k)) return null;
        const plato = [...e.plato, k].sort().join('');
        const sirve = e.pedidos.find(p => p.ing === plato);
        if (sirve) {
            resultado = 'servido';
            const servidos = e.servidos + 1;
            if (servidos >= META_COCINA) return { plato: '', servidos, ganador: 'empate', motivo: `🎉 ¡Sirvieron los ${META_COCINA} pedidos!` };
            const pedidos = e.pedidos.map(p => p.id === sirve.id ? pedidoCocina(e.alacenas, VivoComun.reloj('cocina')) : p);
            return { plato: '', servidos, pedidos, aviso: `🍽️ ¡Pedido servido!` };
        }
        if (!e.pedidos.some(p => [...plato].every(x => p.ing.includes(x)))) {
            resultado = 'quemado';
            return { plato: '', quemados: (e.quemados || 0) + 1, aviso: `🔥 ¡${NOMBRES_COCINA[k]} no iba en ningún pedido! Se quemó el plato.` };
        }
        resultado = 'ok';
        return { plato, aviso: null };
    });
    if (!window.sfx) return;
    if (resultado === 'servido') window.sfx.acierto(); else if (resultado === 'quemado') window.sfx.error(); else if (resultado) window.sfx.click();
}
async function tirarPlatoCocina(){ if (VivoComun.pausa('cocina')) return; vibrarJ(10); await Cocina.accion((e) => e.plato ? { plato: '', aviso: null } : null); }
// Pedidos vencidos y fin del turno (lo puede disparar cualquiera de los dos).
async function vencerCocina(){
    await Cocina.accion((e) => {
        const ahora = VivoComun.reloj('cocina');
        if ((ahora - e.inicio) / 1000 >= SEGUNDOS_COCINA) return { ganador: 'empate', motivo: `Sirvieron ${e.servidos} de ${META_COCINA}. ¡Casi!` };
        const vencidos = e.pedidos.filter(p => p.hasta <= ahora);
        if (!vencidos.length) return null;
        const perdidos = e.perdidos + vencidos.length;
        if (perdidos >= MAX_PERDIDOS_COCINA) return { perdidos, ganador: 'empate', motivo: `Se les pasaron ${perdidos} pedidos. Sirvieron ${e.servidos}.` };
        return { perdidos, pedidos: e.pedidos.map(p => p.hasta <= ahora ? pedidoCocina(e.alacenas, ahora) : p), aviso: '⌛ ¡Se fue un cliente sin comer!' };
    });
}
