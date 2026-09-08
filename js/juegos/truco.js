// ==================== TRUCO ARGENTINO ====================
function nombreJugador(id){ return id === 'carito' ? 'Carito' : 'Nico'; }

function crearMazoTruco(){
    const palos = ['espada','basto','oro','copa'];
    const numeros = [1,2,3,4,5,6,7,10,11,12];
    let mazo = [];
    palos.forEach(p => numeros.forEach(n => mazo.push(p + '_' + n)));
    for (let i = mazo.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [mazo[i], mazo[j]] = [mazo[j], mazo[i]];
    }
    return mazo;
}
function numDeCarta(id){ return parseInt(id.split('_')[1]); }
function paloDeCarta(id){ return id.split('_')[0]; }
function valorTruco(id){
    const n = numDeCarta(id), p = paloDeCarta(id);
    if (p === 'espada' && n === 1) return 14;
    if (p === 'basto' && n === 1) return 13;
    if (p === 'espada' && n === 7) return 12;
    if (p === 'oro' && n === 7) return 11;
    if (n === 3) return 10;
    if (n === 2) return 9;
    if ((p === 'copa' || p === 'oro') && n === 1) return 8;
    if (n === 12) return 7;
    if (n === 11) return 6;
    if (n === 10) return 5;
    if ((p === 'copa' || p === 'basto') && n === 7) return 4;
    if (n === 6) return 3;
    if (n === 5) return 2;
    return 1; // el 4, la más baja
}
function valorEnvido(id){ const n = numDeCarta(id); return n <= 7 ? n : 0; }
function calcularEnvido(cartas){
    const porPalo = {};
    cartas.forEach(c => { const p = paloDeCarta(c); (porPalo[p] = porPalo[p] || []).push(c); });
    let mejor = 0;
    Object.values(porPalo).forEach(grupo => {
        if (grupo.length >= 2) {
            const vals = grupo.map(valorEnvido).sort((a,b) => b-a);
            mejor = Math.max(mejor, 20 + vals[0] + vals[1]);
        }
    });
    if (mejor === 0) mejor = Math.max(...cartas.map(valorEnvido));
    return mejor;
}
function nombreCartaTruco(id){
    const n = numDeCarta(id), p = paloDeCarta(id);
    const nombresNum = {1:'As', 10:'Sota', 11:'Caballo', 12:'Rey'};
    const nombresPalo = {espada:'Espada 🗡️', basto:'Basto 🌳', oro:'Oro 🪙', copa:'Copa 🏆'};
    return `${nombresNum[n] || n} de ${nombresPalo[p]}`;
}
function nombreCantoTruco(tipo){
    return {envido:'Envido', envido_envido:'Envido', real_envido:'Real Envido', falta_envido:'Falta Envido',
            truco:'Truco', retruco:'Retruco', vale_cuatro:'Vale Cuatro'}[tipo] || tipo;
}
function pushLog(estado, mensaje){
    const hist = [...(estado?.historial || []), mensaje];
    return hist.slice(-6);
}
function determinarGanadorManoTruco(gr, mano){
    const cuenta = {nico:0, carito:0};
    gr.forEach(g => { if (g === 'nico') cuenta.nico++; else if (g === 'carito') cuenta.carito++; });
    if (cuenta.nico >= 2) return 'nico';
    if (cuenta.carito >= 2) return 'carito';
    if (gr[0] === 'parda' && gr[1] && gr[1] !== 'parda') return gr[1];
    if (gr[1] === 'parda' && gr[0] && gr[0] !== 'parda') return gr[0];
    if (gr[0] === 'parda' && gr[1] === 'parda' && gr[2] && gr[2] !== 'parda') return gr[2];
    if (gr[0] === 'parda' && gr[1] === 'parda' && gr[2] === 'parda') return mano;
    if (gr[2] === 'parda' && gr[0] && gr[0] !== 'parda' && gr[1] && gr[1] !== 'parda') return gr[0];
    return null;
}
function valorQueridoTruco(nivel){ return {1:2, 2:3, 3:4}[nivel] || 1; }
function opcionesEnvidoSiguientes(cadena){
    const planos = cadena.filter(c => c.tipo === 'envido').length;
    const hayReal = cadena.some(c => c.tipo === 'real_envido');
    const hayFalta = cadena.some(c => c.tipo === 'falta_envido');
    let op = [];
    if (planos < 2 && !hayReal && !hayFalta) op.push('envido');
    if (!hayReal && !hayFalta) op.push('real_envido');
    if (!hayFalta) op.push('falta_envido');
    return op;
}
function calcularPuntosEnvidoQuerido(cadena, puntosParaGanar, puntajes){
    const ultimo = cadena[cadena.length - 1];
    if (ultimo.tipo === 'falta_envido') {
        const lider = Math.max(puntajes.nico, puntajes.carito);
        return Math.max(1, puntosParaGanar - lider);
    }
    return cadena.reduce((tot, c) => tot + (c.tipo === 'real_envido' ? 3 : 2), 0);
}

function refTruco(){ return window.doc(window.db, 'juegos', 'truco'); }
async function leerTrucoActual(){
    return await new Promise(res => { const u = window.onSnapshot(refTruco(), s => { u(); res(s.exists() ? s.data() : null); }); });
}

function iniciarTruco(){
    if (window._unsubTruco) window._unsubTruco();
    window._unsubTruco = window.onSnapshot(refTruco(), snap => renderTruco(snap.exists() ? snap.data() : null), (err) => {
        console.error('Error de Firestore en truco:', err);
        const cont = document.getElementById('contenido-truco');
        if (cont) cont.innerHTML = `<div class="panel texto-centro texto-tenue">⚠️ No se pudo conectar (${err.code || 'error'}). Si el error dice "permission-denied", hay que sumar la colección "juegos" a las Reglas de Firestore.</div>`;
    });
}

let _iniciandoTruco = false;
async function iniciarPartidaTrucoSiCorresponde(estado){
    if (estado.fase !== 'esperando' || _iniciandoTruco) return;
    _iniciandoTruco = true;
    const manoElegida = Math.random() < 0.5 ? 'nico' : 'carito';
    await repartirNuevaManoTruco(estado, manoElegida, { nico:0, carito:0 });
    setTimeout(() => { _iniciandoTruco = false; }, 2000);
}

async function repartirNuevaManoTruco(estadoPrevio, manoElegida, puntajesIniciales){
    const mazo = crearMazoTruco();
    const cartasNico = mazo.slice(0,3), cartasCarito = mazo.slice(3,6);
    await window.setDoc(refTruco(), {
        fase: 'jugando',
        puntosParaGanar: estadoPrevio.puntosParaGanar || 30,
        puntajes: puntajesIniciales || estadoPrevio.puntajes || {nico:0, carito:0},
        mano: manoElegida,
        cartas: { nico: cartasNico, carito: cartasCarito },
        cartasJugadas: [],
        rondaActual: 1,
        ganadoresRonda: [null,null,null],
        jugadorEnTurno: manoElegida,
        cantoPendiente: null,
        envidoCadena: [],
        envidoResuelto: false,
        envidoGanador: null,
        trucoNivel: 0,
        trucoQueridoNivel: 0,
        trucoUltimoCantadoPor: null,
        historial: pushLog(estadoPrevio, `Nueva mano. Reparte ${nombreJugador(manoElegida)}.`),
        manoGanadorTexto: null,
        ganadorPartida: null
    }, { merge: false });
}

async function elegirMetaTruco(meta){
    const estado = await leerTrucoActual();
    if (estado?.listos?.[miIdentidad]) return;
    await window.setDoc(refTruco(), { fase:'esperando', puntosParaGanar: meta,
        listos: estado?.listos || {}, puntajes: estado?.puntajes || {nico:0,carito:0} }, { merge:true });
}
async function marcarListoTruco(){
    vibrarJ(12);
    const estado = await leerTrucoActual();
    await window.setDoc(refTruco(), {
        fase: 'esperando',
        listos: { ...(estado?.listos||{}), [miIdentidad]: true },
        puntosParaGanar: estado?.puntosParaGanar || 30,
        puntajes: estado?.puntajes || {nico:0, carito:0}
    }, { merge: true });
}

async function jugarCartaTruco(cartaId){
    vibrarJ(12);
    const estado = await leerTrucoActual();
    if (!estado || estado.fase !== 'jugando' || estado.cantoPendiente || estado.jugadorEnTurno !== miIdentidad) return;
    const jugadas = estado.cartasJugadas.filter(c => c.jugador === miIdentidad);
    if (jugadas.some(c => c.carta === cartaId)) return;
    if (!estado.cartas[miIdentidad].includes(cartaId)) return;

    const nuevasJugadas = [...estado.cartasJugadas, { jugador: miIdentidad, carta: cartaId, ronda: estado.rondaActual }];
    const jugadasRonda = nuevasJugadas.filter(c => c.ronda === estado.rondaActual);
    let updates = { cartasJugadas: nuevasJugadas };

    if (estado.rondaActual === 1 && jugadasRonda.length === 2 && !estado.envidoResuelto && estado.envidoCadena.length === 0) {
        updates.envidoResuelto = true; // se pasó el momento de cantar envido
    }

    if (jugadasRonda.length < 2) {
        updates.jugadorEnTurno = miRival;
        await window.updateDoc(refTruco(), updates);
        return;
    }

    const [j1, j2] = jugadasRonda;
    const v1 = valorTruco(j1.carta), v2 = valorTruco(j2.carta);
    let ganadorRonda = v1 > v2 ? j1.jugador : (v2 > v1 ? j2.jugador : 'parda');
    const nuevosGanadores = [...estado.ganadoresRonda];
    nuevosGanadores[estado.rondaActual - 1] = ganadorRonda;
    updates.ganadoresRonda = nuevosGanadores;

    const ganadorMano = determinarGanadorManoTruco(nuevosGanadores, estado.mano);
    if (ganadorMano || estado.rondaActual === 3) {
        await finalizarManoTruco(estado, updates, ganadorMano || estado.mano);
    } else {
        updates.rondaActual = estado.rondaActual + 1;
        const siguienteLider = ganadorRonda === 'parda' ? estado.mano : ganadorRonda;
        updates.jugadorEnTurno = siguienteLider;
        await window.updateDoc(refTruco(), updates);
    }
}

async function finalizarManoTruco(estado, updatesParciales, ganadorHand){
    const puntos = estado.trucoQueridoNivel > 0 ? valorQueridoTruco(estado.trucoQueridoNivel) : 1;
    const nuevosPuntajes = { ...estado.puntajes };
    nuevosPuntajes[ganadorHand] = (nuevosPuntajes[ganadorHand] || 0) + puntos;
    const updates = {
        ...updatesParciales,
        puntajes: nuevosPuntajes,
        historial: pushLog(estado, `${nombreJugador(ganadorHand)} ganó la mano (+${puntos}).`)
    };
    if (nuevosPuntajes[ganadorHand] >= estado.puntosParaGanar) {
        updates.fase = 'terminado';
        updates.ganadorPartida = ganadorHand;
    } else {
        updates.fase = 'mano_terminada';
        updates.manoGanadorTexto = `${nombreJugador(ganadorHand)} ganó la mano`;
    }
    await window.updateDoc(refTruco(), updates);
}

async function siguienteManoTruco(){
    const estado = await leerTrucoActual();
    if (!estado || estado.fase !== 'mano_terminada') return;
    const siguienteMano = estado.mano === 'nico' ? 'carito' : 'nico';
    await repartirNuevaManoTruco(estado, siguienteMano, estado.puntajes);
}

async function cantarEnvido(tipo){
    vibrarJ(12);
    const estado = await leerTrucoActual();
    if (!estado || estado.cantoPendiente || estado.jugadorEnTurno !== miIdentidad) return;
    if (estado.rondaActual !== 1 || estado.envidoResuelto || estado.trucoNivel > 0) return;
    if (estado.envidoCadena.length > 0) return;
    const nuevaCadena = [...estado.envidoCadena, { tipo, de: miIdentidad }];
    await window.updateDoc(refTruco(), {
        cantoPendiente: { familia:'envido', tipo, de: miIdentidad },
        envidoCadena: nuevaCadena,
        historial: pushLog(estado, `${nombreJugador(miIdentidad)} cantó ${nombreCantoTruco(tipo)}.`)
    });
}
async function escalarEnvido(tipo){
    vibrarJ(12);
    const estado = await leerTrucoActual();
    if (!estado || !estado.cantoPendiente || estado.cantoPendiente.familia !== 'envido' || estado.cantoPendiente.de !== miRival) return;
    const nuevaCadena = [...estado.envidoCadena, { tipo, de: miIdentidad }];
    await window.updateDoc(refTruco(), {
        cantoPendiente: { familia:'envido', tipo, de: miIdentidad },
        envidoCadena: nuevaCadena,
        historial: pushLog(estado, `${nombreJugador(miIdentidad)} subió a ${nombreCantoTruco(tipo)}.`)
    });
}
async function cantarTruco(){
    vibrarJ(12);
    const estado = await leerTrucoActual();
    if (!estado || estado.cantoPendiente || estado.jugadorEnTurno !== miIdentidad) return;
    if (estado.trucoNivel >= 3) return;
    if (estado.trucoNivel > 0 && estado.trucoUltimoCantadoPor === miIdentidad) return;
    const siguienteNivel = estado.trucoNivel + 1;
    const tipos = ['','truco','retruco','vale_cuatro'];
    await window.updateDoc(refTruco(), {
        cantoPendiente: { familia:'truco', tipo: tipos[siguienteNivel], de: miIdentidad, nivel: siguienteNivel },
        historial: pushLog(estado, `${nombreJugador(miIdentidad)} cantó ${nombreCantoTruco(tipos[siguienteNivel])}.`)
    });
}
async function escalarTruco(){
    vibrarJ(12);
    const estado = await leerTrucoActual();
    const canto = estado?.cantoPendiente;
    if (!canto || canto.familia !== 'truco' || canto.de !== miRival || canto.nivel >= 3) return;
    const siguienteNivel = canto.nivel + 1;
    const tipos = ['','truco','retruco','vale_cuatro'];
    await window.updateDoc(refTruco(), {
        cantoPendiente: { familia:'truco', tipo: tipos[siguienteNivel], de: miIdentidad, nivel: siguienteNivel },
        historial: pushLog(estado, `${nombreJugador(miIdentidad)} subió a ${nombreCantoTruco(tipos[siguienteNivel])}.`)
    });
}

async function responderQuieroTruco(){
    vibrarJ(15);
    const estado = await leerTrucoActual();
    const canto = estado?.cantoPendiente;
    if (!canto || canto.de !== miRival) return;
    let updates = { cantoPendiente: null };
    if (canto.familia === 'envido') {
        const vN = calcularEnvido(estado.cartas.nico), vC = calcularEnvido(estado.cartas.carito);
        let ganador;
        if (vN === vC) ganador = estado.mano; else ganador = vN > vC ? 'nico' : 'carito';
        const puntos = calcularPuntosEnvidoQuerido(estado.envidoCadena, estado.puntosParaGanar, estado.puntajes);
        const nuevosPuntajes = { ...estado.puntajes };
        nuevosPuntajes[ganador] += puntos;
        updates.puntajes = nuevosPuntajes;
        updates.envidoResuelto = true;
        updates.envidoGanador = ganador;
        const perdedorEnvido = ganador === 'nico' ? 'carito' : 'nico';
        const puntosGanador = ganador === 'nico' ? vN : vC;
        const puntosPerdedor = ganador === 'nico' ? vC : vN;
        updates.historial = pushLog(estado, `Envido querido: gana ${nombreJugador(ganador)} con ${puntosGanador} (+${puntos}). ${nombreJugador(perdedorEnvido)} tenía ${puntosPerdedor}.`);
        if (nuevosPuntajes[ganador] >= estado.puntosParaGanar) { updates.fase = 'terminado'; updates.ganadorPartida = ganador; }
    } else {
        updates.trucoNivel = canto.nivel;
        updates.trucoQueridoNivel = canto.nivel;
        updates.trucoUltimoCantadoPor = canto.de;
        updates.historial = pushLog(estado, `${nombreJugador(miIdentidad)} quiso el ${nombreCantoTruco(canto.tipo)}.`);
    }
    await window.updateDoc(refTruco(), updates);
}
async function responderNoQuieroTruco(){
    vibrarJ([10,30,10]);
    const estado = await leerTrucoActual();
    const canto = estado?.cantoPendiente;
    if (!canto || canto.de !== miRival) return;
    let updates = { cantoPendiente: null };
    if (canto.familia === 'envido') {
        const puntos = estado.envidoCadena.length;
        const nuevosPuntajes = { ...estado.puntajes };
        nuevosPuntajes[canto.de] += puntos;
        updates.puntajes = nuevosPuntajes;
        updates.envidoResuelto = true;
        updates.historial = pushLog(estado, `Envido no querido: +${puntos} para ${nombreJugador(canto.de)}.`);
        if (nuevosPuntajes[canto.de] >= estado.puntosParaGanar) { updates.fase = 'terminado'; updates.ganadorPartida = canto.de; }
        await window.updateDoc(refTruco(), updates);
    } else {
        const puntos = canto.nivel;
        const nuevosPuntajes = { ...estado.puntajes };
        nuevosPuntajes[canto.de] += puntos;
        updates.puntajes = nuevosPuntajes;
        updates.historial = pushLog(estado, `${nombreCantoTruco(canto.tipo)} no querido: +${puntos} para ${nombreJugador(canto.de)}.`);
        if (nuevosPuntajes[canto.de] >= estado.puntosParaGanar) {
            updates.fase = 'terminado'; updates.ganadorPartida = canto.de;
        } else {
            updates.fase = 'mano_terminada';
            updates.manoGanadorTexto = `${nombreJugador(canto.de)} ganó la mano (no querido)`;
        }
        await window.updateDoc(refTruco(), updates);
    }
}
async function irseAlMazoTruco(){
    vibrarJ([10,30,10]);
    const estado = await leerTrucoActual();
    if (!estado || estado.fase !== 'jugando' || estado.cantoPendiente) return;
    const puntos = estado.trucoQueridoNivel > 0 ? valorQueridoTruco(estado.trucoQueridoNivel) : 1;
    const nuevosPuntajes = { ...estado.puntajes };
    nuevosPuntajes[miRival] += puntos;
    let updates = {
        puntajes: nuevosPuntajes,
        historial: pushLog(estado, `${nombreJugador(miIdentidad)} se fue al mazo (+${puntos} para ${nombreJugador(miRival)}).`)
    };
    if (nuevosPuntajes[miRival] >= estado.puntosParaGanar) {
        updates.fase = 'terminado'; updates.ganadorPartida = miRival;
    } else {
        updates.fase = 'mano_terminada';
        updates.manoGanadorTexto = `${nombreJugador(miRival)} ganó la mano (se fue al mazo)`;
    }
    await window.updateDoc(refTruco(), updates);
}
async function reiniciarTruco(){
    vibrarJ(12);
    await window.setDoc(refTruco(), { fase:'esperando', listos:{}, puntajes:{nico:0,carito:0}, puntosParaGanar:30 });
}
async function ajustarPuntajeTruco(jugador, delta){
    const estado = await leerTrucoActual();
    if (!estado) return;
    const nuevosPuntajes = { ...estado.puntajes };
    nuevosPuntajes[jugador] = Math.max(0, (nuevosPuntajes[jugador]||0) + delta);
    await window.updateDoc(refTruco(), { puntajes: nuevosPuntajes });
}

function renderTruco(estado){
    const cont = document.getElementById('contenido-truco');

    if (!estado || estado.fase === 'esperando') {
        const listoYo = estado?.listos?.[miIdentidad];
        const listoRival = estado?.listos?.[miRival];
        const meta = estado?.puntosParaGanar || 30;
        cont.innerHTML = `
            <div class="panel texto-centro">
                <p class="texto-tenue">Truco de a dos, con envido. Gana quien llegue primero a los tantos.</p>
                <div class="btn-fila" style="margin:10px 0;">
                    <button class="btn-secundario" style="${meta===15?'border-color:var(--rosa);':''}" onclick="elegirMetaTruco(15)">A 15</button>
                    <button class="btn-secundario" style="${meta===30?'border-color:var(--rosa);':''}" onclick="elegirMetaTruco(30)">A 30</button>
                </div>
                <div class="texto-tenue" style="margin-bottom:10px;">
                    ${nombreJugador(miIdentidad)}: ${listoYo ? '✅ listo/a' : '⏳ esperando'}<br>
                    ${nombreJugador(miRival)}: ${listoRival ? '✅ listo/a' : '⏳ esperando'}
                </div>
                <button class="btn-principal" ${listoYo ? 'disabled style="opacity:0.5;"' : ''} onclick="marcarListoTruco()">${listoYo ? 'Esperando al otro…' : '¡Estoy listo/a! 🃏'}</button>
            </div>`;
        if (listoYo && listoRival) iniciarPartidaTrucoSiCorresponde(estado);
        return;
    }

    if (estado.fase === 'terminado') {
        cont.innerHTML = `
            <div class="panel texto-centro">
                <div style="font-size:1.3rem; margin-bottom:10px;">🏆 ¡Ganó ${nombreJugador(estado.ganadorPartida)}!</div>
                <div class="texto-tenue" style="margin-bottom:14px;">Nico ${estado.puntajes.nico} — Carito ${estado.puntajes.carito}</div>
                <button class="btn-principal" onclick="reiniciarTruco()">🔁 Jugar de nuevo</button>
            </div>`;
        return;
    }

    if (estado.fase === 'mano_terminada') {
        cont.innerHTML = `
            <div class="panel texto-centro">
                <div style="font-size:1.15rem; margin-bottom:8px;">${estado.manoGanadorTexto}</div>
                <div class="texto-tenue" style="margin-bottom:14px;">Nico ${estado.puntajes.nico} — Carito ${estado.puntajes.carito} (a ${estado.puntosParaGanar})</div>
                <button class="btn-principal" onclick="siguienteManoTruco()">Repartir siguiente mano ▶️</button>
            </div>`;
        return;
    }

    // fase 'jugando'
    const misCartas = estado.cartas[miIdentidad] || [];
    const misJugadas = estado.cartasJugadas.filter(c => c.jugador === miIdentidad).map(c => c.carta);
    const misDisponibles = misCartas.filter(c => !misJugadas.includes(c));
    const canto = estado.cantoPendiente;

    let filaCartasArea = '';
    for (let r = 1; r <= estado.rondaActual; r++) {
        const mia = estado.cartasJugadas.find(c => c.jugador === miIdentidad && c.ronda === r);
        const delRival = estado.cartasJugadas.find(c => c.jugador === miRival && c.ronda === r);
        filaCartasArea += `<div style="display:flex; justify-content:space-between; align-items:center; padding:6px 0; ${r<estado.rondaActual?'opacity:0.55;':''} border-bottom:${r<estado.rondaActual?'1px dashed rgba(255,255,255,0.1)':'none'};">
            <span style="font-size:0.8rem;">${delRival ? nombreCartaTruco(delRival.carta) : '🂠 —'}</span>
            <span style="font-size:0.7rem; opacity:0.5;">ronda ${r}</span>
            <span style="font-size:0.8rem;">${mia ? nombreCartaTruco(mia.carta) : '—'}</span>
        </div>`;
    }

    let html = `
        <div class="panel">
            <div style="display:flex; justify-content:space-between; font-size:0.9rem; margin-bottom:6px;">
                <span>Nico: <b>${estado.puntajes.nico}</b></span>
                <span class="texto-tenue">a ${estado.puntosParaGanar}</span>
                <span>Carito: <b>${estado.puntajes.carito}</b></span>
            </div>
            <div style="text-align:center; font-size:0.72rem; opacity:0.55;">mano: ${nombreJugador(miRival)} arriba · vos abajo</div>
            <div style="margin-top:8px;">${filaCartasArea}</div>
        </div>
    `;

    if (canto && canto.de === miRival) {
        const opciones = canto.familia === 'envido' ? opcionesEnvidoSiguientes(estado.envidoCadena) : [];
        html += `<div class="panel texto-centro">
            <div style="font-size:1.1rem; margin-bottom:10px;">${nombreJugador(miRival)} cantó: <b>${nombreCantoTruco(canto.tipo)}</b></div>
            <div class="btn-fila" style="margin-bottom:8px;">
                <button class="btn-principal" onclick="responderQuieroTruco()">Quiero</button>
                <button class="btn-secundario" onclick="responderNoQuieroTruco()">No quiero</button>
            </div>`;
        if (canto.familia === 'envido') {
            opciones.filter(o => o !== canto.tipo).forEach(op => {
                html += `<button class="btn-secundario" style="margin-top:6px;" onclick="escalarEnvido('${op}')">${nombreCantoTruco(op)}</button>`;
            });
        } else if (canto.nivel < 3) {
            html += `<button class="btn-secundario" style="margin-top:6px;" onclick="escalarTruco()">${nombreCantoTruco(['','truco','retruco','vale_cuatro'][canto.nivel+1])}</button>`;
        }
        html += `</div>`;
    } else if (canto && canto.de === miIdentidad) {
        html += `<div class="panel texto-centro texto-tenue">Cantaste ${nombreCantoTruco(canto.tipo)}. Esperando la respuesta de ${nombreJugador(miRival)}…</div>`;
    } else {
        const esMiTurno = estado.jugadorEnTurno === miIdentidad;
        const puedeEnvido = esMiTurno && estado.rondaActual === 1 && !estado.envidoResuelto && estado.trucoNivel === 0 && estado.envidoCadena.length === 0;
        const puedeTruco = esMiTurno && estado.trucoNivel < 3 && !(estado.trucoNivel > 0 && estado.trucoUltimoCantadoPor === miIdentidad);
        html += `<div class="panel texto-centro texto-tenue">${esMiTurno ? '🎯 Tu turno' : `Turno de ${nombreJugador(miRival)}…`}</div>`;

        if (esMiTurno) {
            html += `<div class="panel"><div class="btn-fila" style="flex-wrap:wrap;">`;
            if (puedeEnvido) {
                html += `<button class="btn-secundario" onclick="cantarEnvido('envido')">Envido</button>
                         <button class="btn-secundario" onclick="cantarEnvido('real_envido')">Real Envido</button>
                         <button class="btn-secundario" onclick="cantarEnvido('falta_envido')">Falta Envido</button>`;
            }
            if (puedeTruco) {
                const nombreSiguiente = nombreCantoTruco(['','truco','retruco','vale_cuatro'][estado.trucoNivel+1]);
                html += `<button class="btn-secundario" onclick="cantarTruco()">${nombreSiguiente}</button>`;
            }
            html += `</div></div>`;
        }

        html += `<div class="panel">
            <div class="texto-tenue" style="margin-bottom:8px;">Tu mano:</div>
            <div style="display:flex; gap:8px; flex-wrap:wrap;">`;
        misDisponibles.forEach(c => {
            html += `<button class="btn-secundario" style="flex:1; min-width:100px; ${esMiTurno ? '' : 'opacity:0.5;'}" ${esMiTurno ? '' : 'disabled'} onclick="jugarCartaTruco('${c}')">${nombreCartaTruco(c)}</button>`;
        });
        html += `</div></div>`;

        html += `<button class="btn-secundario" onclick="irseAlMazoTruco()">🏳️ Irse al mazo</button>`;
    }

    if (estado.historial && estado.historial.length) {
        html += `<div class="panel texto-tenue" style="font-size:0.72rem; line-height:1.6;">${estado.historial.slice(-4).map(h => '• ' + h).join('<br>')}</div>`;
    }

    html += `<div class="texto-centro" style="margin-top:6px;">
        <button class="btn-secundario" style="font-size:0.7rem; padding:6px 10px; width:auto;" onclick="document.getElementById('ajuste-puntaje-truco').classList.toggle('oculto')">⚙️ Corregir puntaje</button>
        <div id="ajuste-puntaje-truco" class="oculto panel" style="margin-top:8px;">
            <div style="display:flex; justify-content:space-around; font-size:0.8rem;">
                <span>Nico
                    <button class="btn-secundario" style="width:auto; padding:2px 8px;" onclick="ajustarPuntajeTruco('nico',-1)">−</button>
                    <button class="btn-secundario" style="width:auto; padding:2px 8px;" onclick="ajustarPuntajeTruco('nico',1)">+</button>
                </span>
                <span>Carito
                    <button class="btn-secundario" style="width:auto; padding:2px 8px;" onclick="ajustarPuntajeTruco('carito',-1)">−</button>
                    <button class="btn-secundario" style="width:auto; padding:2px 8px;" onclick="ajustarPuntajeTruco('carito',1)">+</button>
                </span>
            </div>
        </div>
    </div>`;

    cont.innerHTML = html;
}
