// ==================== PÓKER TEXAS HOLD'EM (de a dos) ====================
// 200 fichas cada uno, ciegas de 5 y 10. Dos cartas propias y cinco en
// la mesa que se van mostrando (flop 3, turn 1, river 1). En cada calle
// se pasa, se iguala, se sube o se retira. Gana la mano la mejor
// combinación de 5 cartas. La partida termina cuando uno se queda sin
// fichas o después de 15 manos (gana quien tenga más).
const CHICA_POKER = 5, GRANDE_POKER = 10, MANOS_POKER = 15;
const NOMBRES_CALLE_POKER = ['Antes del flop', 'Flop', 'Turn', 'River'];

function nuevaManoPoker(fichas, repartidor, mano) {
    const mazo = mazoFrances();
    const otro = repartidor === 'nico' ? 'carito' : 'nico';
    const cartas = { nico: [mazo[0], mazo[2]], carito: [mazo[1], mazo[3]] };
    const tablero = mazo.slice(4, 9);
    const f = { ...fichas };
    const chica = Math.min(CHICA_POKER, f[repartidor]), grande = Math.min(GRANDE_POKER, f[otro]);
    f[repartidor] -= chica; f[otro] -= grande;
    const apuesta = { [repartidor]: chica, [otro]: grande };
    return { etapa: 'apuestas', fichas: f, cartas, tablero, apuesta, aportado: { ...apuesta }, pozo: 0, calle: 0, actuo: { nico: false, carito: false },
        repartidor, turno: repartidor, mano, resultado: null, ultimaAccion: null };
}
function finManoPoker(e, cambios, ganador, porRetiro) {
    const est = { ...e, ...cambios };
    const fichas = { ...est.fichas };
    const a = est.aportado;
    let texto, manos = null;
    if (porRetiro) {
        fichas[ganador] += a.nico + a.carito;
        texto = `${nombreJugador(porRetiro)} se retiró: ${nombreJugador(ganador)} se lleva ${a.nico + a.carito}`;
    } else {
        const mn = mejorManoPoker([...est.cartas.nico, ...est.tablero]), mc = mejorManoPoker([...est.cartas.carito, ...est.tablero]);
        manos = { nico: mn.nombre, carito: mc.nombre };
        const comun = Math.min(a.nico, a.carito);
        // Lo que uno puso de más (all-in corto del otro) se le devuelve.
        ['nico', 'carito'].forEach(q => { fichas[q] += a[q] - comun; });
        if (mn.valor === mc.valor) { fichas.nico += comun; fichas.carito += comun; ganador = 'empate'; texto = `Empate con ${mn.nombre}: se reparte`; }
        else { ganador = mn.valor > mc.valor ? 'nico' : 'carito'; fichas[ganador] += comun * 2; texto = `${nombreJugador(ganador)} gana ${comun * 2} con ${manos[ganador]}`; }
    }
    const res = { ...cambios, fichas, etapa: 'fin_mano', turno: null, calle: porRetiro ? est.calle : 3, resultado: { ganador, texto, manos, mostrar: !porRetiro } };
    if (fichas.nico === 0 || fichas.carito === 0 || (e.mano || 1) >= MANOS_POKER) {
        res.ganador = fichas.nico === fichas.carito ? 'empate' : fichas.nico > fichas.carito ? 'nico' : 'carito';
        res.motivo = `Fichas: ${nombreJugador('nico')} ${fichas.nico} — ${fichas.carito} ${nombreJugador('carito')}`;
    }
    return res;
}
// Después de una acción: ¿terminó la calle? ¿hay que ir directo al final?
function avanzarPoker(e, c) {
    const est = { ...e, ...c };
    const yo = miIdentidad, el = miRival;
    const igual = est.apuesta[yo] === est.apuesta[el];
    const sinFichas = est.fichas[yo] === 0 || est.fichas[el] === 0;
    const terminada = est.actuo[yo] && est.actuo[el] && (igual || sinFichas);
    if (!terminada) return { ...c, turno: el };
    const pozo = est.pozo + est.apuesta.nico + est.apuesta.carito;
    if (est.calle >= 3 || sinFichas) return finManoPoker(e, { ...c, pozo, apuesta: { nico: 0, carito: 0 } }, null, null);
    const primero = est.repartidor === 'nico' ? 'carito' : 'nico';
    return { ...c, pozo, apuesta: { nico: 0, carito: 0 }, calle: est.calle + 1, actuo: { nico: false, carito: false }, turno: primero };
}

const Poker = JuegoTurnos.crear({
    id: 'poker',
    emojiListo: '♠️',
    intro: `Texas Hold'em de a dos: 200 fichas cada uno, ciegas de ${CHICA_POKER} y ${GRANDE_POKER}. Armá la mejor mano de 5 con tus 2 cartas y las 5 de la mesa. Gana quien deja al otro sin fichas (o tiene más después de ${MANOS_POKER} manos).`,
    inicial: () => nuevaManoPoker({ nico: 200, carito: 200 }, Math.random() < 0.5 ? 'nico' : 'carito', 1),
    textoTurno: (e) => e.etapa === 'fin_mano' ? 'Mano terminada' : '🎯 Te toca hablar',
    render(e, c) {
        const yo = c.yo, el = c.rival;
        const visibles = [0, 3, 4, 5][e.calle] || 0;
        const mostrar = e.etapa === 'fin_mano' && e.resultado && e.resultado.mostrar;
        let h = `<div class="texto-centro texto-tenue" style="font-size:0.8rem;">Mano ${e.mano} de ${MANOS_POKER} · ${NOMBRES_CALLE_POKER[e.calle] || ''} · Reparte ${nombreJugador(e.repartidor)}</div>`;
        h += `<div class="mesa-poker">
            <div class="lugar-poker"><div class="fichas-poker">🪙 ${e.fichas[el]}${e.apuesta[el] ? ` · apuesta ${e.apuesta[el]}` : ''}</div>
                <div class="cartas-bj" data-aj-rival>${e.cartas[el].map(cc => htmlCartaFr(cc, { dorso: !mostrar })).join('')}</div>
                ${mostrar && e.resultado.manos ? `<div class="texto-tenue" style="font-size:0.75rem;">${e.resultado.manos[el]}</div>` : ''}</div>
            <div class="comunitarias-poker">${e.tablero.map((cc, i) => i < visibles ? htmlCartaFr(cc) : htmlCartaFr(null, { dorso: true, clase: 'apagada' })).join('')}</div>
            <div class="pozo-poker">Pozo: ${e.pozo + e.apuesta.nico + e.apuesta.carito}</div>
            <div class="lugar-poker mio"><div class="cartas-bj" data-aj-mia>${e.cartas[yo].map(cc => htmlCartaFr(cc)).join('')}</div>
                <div class="fichas-poker">🪙 ${e.fichas[yo]}${e.apuesta[yo] ? ` · apuesta ${e.apuesta[yo]}` : ''}${visibles ? ` · <span class="ayuda-juego">${mejorManoPoker([...e.cartas[yo], ...e.tablero.slice(0, visibles)]).nombre}</span>` : ''}</div></div>
        </div>`;
        if (e.ultimaAccion) h += `<div class="texto-centro texto-tenue" style="font-size:0.78rem;">${e.ultimaAccion}</div>`;
        if (e.fase === 'jugando' && e.etapa === 'apuestas' && c.miTurno) {
            const falta = e.apuesta[el] - e.apuesta[yo];
            const pozoTotal = e.pozo + e.apuesta.nico + e.apuesta.carito;
            const subidas = [...new Set([e.apuesta[el] + Math.max(GRANDE_POKER, falta) * 2, e.apuesta[el] + Math.max(GRANDE_POKER, Math.round(pozoTotal * 0.75))])]
                .filter(x => x - e.apuesta[yo] < e.fichas[yo] && x > e.apuesta[el] && e.fichas[el] > 0);
            h += `<div class="panel"><div class="btn-fila acciones-poker">
                ${falta > 0 ? `<button class="btn-secundario" onclick="accionPoker('retirarse')">🏳️ Retirarse</button>` : ''}
                ${falta > 0 ? `<button class="btn-principal" onclick="accionPoker('igualar')">Igualar ${Math.min(falta, e.fichas[yo])}</button>` : `<button class="btn-principal" onclick="accionPoker('pasar')">✋ Pasar</button>`}
                ${subidas.map(x => `<button class="btn-secundario" onclick="accionPoker('subir', ${x})">⬆️ A ${x}</button>`).join('')}
                ${e.fichas[yo] > Math.max(0, falta) && e.fichas[el] > 0 ? `<button class="btn-secundario" onclick="accionPoker('todo')">🔥 All-in (${e.fichas[yo] + e.apuesta[yo]})</button>` : ''}
            </div></div>`;
        } else if (e.fase === 'jugando' && e.etapa === 'fin_mano') {
            h += `<div class="panel texto-centro"><div style="margin-bottom:8px;">${e.resultado ? e.resultado.texto : ''}</div><button class="btn-principal" onclick="siguientePoker()">Repartir otra mano ▶️</button></div>`;
        } else if (e.fase === 'terminado' && e.resultado) {
            h += `<div class="panel texto-centro texto-tenue">${e.resultado.texto}</div>`;
        }
        return h;
    },
    compu: {
        paso(e, bot, yo, nivel) {
            if (e.fase !== 'jugando' || e.etapa !== 'apuestas' || e.turno !== bot) return null;
            const visibles = [0, 3, 4, 5][e.calle];
            const eq = nivel === 'facil' ? 0.3 + Math.random() * 0.5 : equidadPoker(e.cartas[bot], e.tablero.slice(0, visibles), nivel === 'dificil' ? 320 : 140);
            const falta = e.apuesta[yo] - e.apuesta[bot];
            const pozo = e.pozo + e.apuesta.nico + e.apuesta.carito;
            const odds = falta / (pozo + falta || 1);
            const r = Math.random();
            const subirA = (x) => () => accionPoker('subir', x);
            const subida = e.apuesta[yo] + Math.max(GRANDE_POKER, Math.round(pozo * 0.7));
            const puedeSubir = subida - e.apuesta[bot] < e.fichas[bot] && e.fichas[yo] > 0;
            if (eq > 0.82 && e.fichas[yo] > 0 && r < 0.4) return () => accionPoker('todo');
            if (eq > 0.68 && puedeSubir && r < 0.75) return subirA(subida);
            if (nivel === 'dificil' && falta === 0 && puedeSubir && r < 0.1) return subirA(subida); // farol
            if (falta === 0) return () => accionPoker('pasar');
            if (eq >= odds + (nivel === 'dificil' ? 0.04 : 0.0) || (nivel === 'facil' && r < 0.6)) return () => accionPoker('igualar');
            return () => accionPoker('retirarse');
        }
    }
});

// Probabilidad de ganar simulando cartas al azar para el otro y la mesa.
function equidadPoker(mias, mesa, sims) {
    const usadas = new Set([...mias, ...mesa]);
    const resto = mazoFrances().filter(c => !usadas.has(c));
    let gano = 0;
    for (let s = 0; s < sims; s++) {
        const m = [...resto];
        for (let i = 0; i < 2 + (5 - mesa.length); i++) { const j = i + Math.floor(Math.random() * (m.length - i)); [m[i], m[j]] = [m[j], m[i]]; }
        const suyas = [m[0], m[1]], completa = [...mesa, ...m.slice(2, 2 + 5 - mesa.length)];
        const a = mejorManoPoker([...mias, ...completa]).valor, b = mejorManoPoker([...suyas, ...completa]).valor;
        gano += a > b ? 1 : a === b ? 0.5 : 0;
    }
    return gano / sims;
}

async function accionPoker(tipo, hasta) {
    vibrarJ(10);
    const res = await Poker.jugar((e) => {
        if (e.etapa !== 'apuestas') return null;
        const yo = miIdentidad, el = miRival;
        const falta = e.apuesta[el] - e.apuesta[yo];
        const fichas = { ...e.fichas }, apuesta = { ...e.apuesta }, aportado = { ...e.aportado }, actuo = { ...e.actuo, [yo]: true };
        const poner = (n) => { n = Math.max(0, Math.min(n, fichas[yo])); fichas[yo] -= n; apuesta[yo] += n; aportado[yo] += n; };
        let texto;
        if (tipo === 'retirarse') return finManoPoker(e, { actuo, ultimaAccion: `${nombreJugador(yo)} se retiró.` }, el, yo);
        if (tipo === 'pasar') { if (falta !== 0) return null; texto = 'pasó'; }
        else if (tipo === 'igualar') { if (falta <= 0) return null; poner(falta); texto = fichas[yo] === 0 ? 'igualó con todo' : `igualó ${falta}`; }
        else if (tipo === 'subir') { if (!(hasta > apuesta[el]) || hasta - apuesta[yo] > fichas[yo]) return null; poner(hasta - apuesta[yo]); actuo[el] = false; texto = `subió a ${apuesta[yo]}`; }
        else if (tipo === 'todo') { poner(fichas[yo]); if (apuesta[yo] > apuesta[el]) actuo[el] = false; texto = '¡fue all-in! 🔥'; }
        else return null;
        return avanzarPoker(e, { fichas, apuesta, aportado, actuo, ultimaAccion: `${nombreJugador(yo)} ${texto}` });
    });
    if (res && window.sfx) window.sfx[tipo === 'retirarse' ? 'toque' : 'moneda']();
}

async function siguientePoker() {
    await Poker.accion((e) => {
        if (e.etapa !== 'fin_mano') return null;
        const rep = e.repartidor === 'nico' ? 'carito' : 'nico';
        return nuevaManoPoker(e.fichas, rep, (e.mano || 1) + 1);
    });
}
