// ==================== AJEDREZ ====================
function refAjedrez(){ return window.doc(window.db, 'juegos', 'ajedrez'); }

function crearTableroInicialAjedrez(){
    const t = new Array(64).fill(null);
    const filaAtras = ['R','N','B','Q','K','B','N','R'];
    for (let col=0; col<8; col++){
        t[0*8+col] = 'c'+filaAtras[col];
        t[1*8+col] = 'cP';
        t[6*8+col] = 'nP';
        t[7*8+col] = 'n'+filaAtras[col];
    }
    return t;
}

let _ajedrezSeleccion = null;
let _ajedrezDestinos = [];

let _ajedrezFaseAnterior = null;
function iniciarAjedrez(){
    _ajedrezSeleccion = null; _ajedrezDestinos = [];
    _ajedrezFaseAnterior = null;
    if (window._unsubAjedrez) window._unsubAjedrez();
    window._unsubAjedrez = window.onSnapshot(refAjedrez(), (snap) => {
        const datos = snap.exists() ? snap.data() : null;
        if (datos && datos.fase === 'terminado' && _ajedrezFaseAnterior === 'jugando' && window.sfx) {
            window.sfx[datos.ganador === miIdentidad ? 'victoria' : 'derrota']();
            if (window.fx && (datos.ganador === miIdentidad)) window.fx.confeti();
        }
        _ajedrezFaseAnterior = datos ? datos.fase : null;
        renderAjedrez(datos);
    }, (err) => {
        console.error('Error de Firestore en ajedrez:', err);
        const cont = document.getElementById('contenido-ajedrez');
        if (cont) cont.innerHTML = `<div class="panel texto-centro texto-tenue">⚠️ No se pudo conectar (${err.code || 'error'}). Si el error dice "permission-denied", hay que sumar la colección "juegos" a las Reglas de Firestore.</div>`;
    });
}

async function leerAjedrezActual(){
    return await new Promise(res => { const u = window.onSnapshot(refAjedrez(), s => { u(); res(s.exists() ? s.data() : null); }); });
}

async function marcarListoAjedrez(){
    vibrarJ(12);
    // Transacción: si los dos tocan "listo" casi al mismo tiempo, cada
    // lectura suelta (leerAjedrezActual) puede no ver todavía la marca
    // del otro, y entonces ninguno de los dos dispara el arranque de la
    // partida. Con una transacción, Firestore reintenta automáticamente
    // si detecta que el documento cambió mientras se decidía, así que
    // el segundo en confirmar siempre ve la marca del primero.
    const ref = refAjedrez();
    await window.runTransaction(window.db, async (tx) => {
        const snap = await tx.get(ref);
        const estado = snap.exists() ? snap.data() : null;
        if (estado?.fase === 'jugando' || estado?.listos?.[miIdentidad]) return;
        const listos = { ...(estado?.listos||{}), [miIdentidad]: true };
        if (listos.nico && listos.carito) {
            tx.set(ref, {
                fase:'jugando', tablero: crearTableroInicialAjedrez(), turno: 'nico',
                enroques: { ...ENROQUES_INICIALES_AJEDREZ }, alPaso: null, medioMov: 0,
                jaque: null, motivoFin: null, ultimoMov: null,
                listos, historial: ['Arranca la partida. Empiezan las blancas (Nico).'], ganador: null,
                victorias: estado?.victorias || { nico: 0, carito: 0 }
            });
        } else {
            tx.set(ref, { fase:'esperando', listos, victorias: estado?.victorias || { nico: 0, carito: 0 } }, { merge:true });
        }
    });
}

// Sólo vuelve a "esperando" si la partida terminó: antes había un botón
// "Reiniciar partida" a la vista durante el juego y cualquiera podía
// borrarle al otro una partida en curso. Ahora para eso está "Rendirse".
async function reiniciarAjedrez(){
    vibrarJ(12);
    const ref = refAjedrez();
    await window.runTransaction(window.db, async (tx) => {
        const snap = await tx.get(ref);
        const estado = snap.exists() ? snap.data() : null;
        if (estado && estado.fase === 'jugando') return;
        tx.set(ref, { fase:'esperando', listos:{}, victorias: estado?.victorias || { nico: 0, carito: 0 } });
    });
}

async function rendirseAjedrez(){
    if (!confirm('¿Seguro que querés rendirte? La partida la gana ' + nombreJugador(miRival) + '.')) return;
    const res = await window.jugadaSegura(refAjedrez(), (actual) => {
        if (!actual || actual.fase !== 'jugando') return null;
        const victorias = { ...(actual.victorias || { nico: 0, carito: 0 }) };
        victorias[miRival] = (victorias[miRival] || 0) + 1;
        return { fase: 'terminado', ganador: miRival, motivoFin: 'rendición', victorias,
            historial: pushLog(actual, `🏳️ ${nombreJugador(miIdentidad)} se rindió.`) };
    });
    if (res && typeof registrarEvento === 'function') {
        registrarEvento('gano_ajedrez', `${nombreJugador(miRival)} le ganó a ${nombreJugador(miIdentidad)} en Ajedrez`);
        if (typeof registrarVictoria === 'function') registrarVictoria('ajedrez', miRival);
    }
}

function colorPiezaAjedrez(pieza){ return pieza ? pieza[0] : null; }
function tipoPiezaAjedrez(pieza){ return pieza ? pieza[1] : null; }
function colorDeJugadorAjedrez(jugador){ return jugador === 'nico' ? 'n' : 'c'; }
function jugadorDeColorAjedrez(color){ return color === 'n' ? 'nico' : 'carito'; }
function otroColorAjedrez(color){ return color === 'n' ? 'c' : 'n'; }

// ==================== MOTOR DE REGLAS ====================
// Reglas completas: enroque (corto y largo), captura al paso, coronación
// a elección, jaque, jaque mate, rey ahogado, material insuficiente y
// regla de los 50 movimientos. Ya no se puede dejar (ni poner) al propio
// rey en jaque, así que nunca se "captura al rey": la partida termina
// en el mate.
// Blancas = 'n' (Nico, filas 6-7, avanzan hacia la fila 0).
// Negras  = 'c' (Carito, filas 0-1, avanzan hacia la fila 7).
const ENROQUES_INICIALES_AJEDREZ = { nK: true, nQ: true, cK: true, cQ: true };
const DIRS_TORRE_AJEDREZ = [[-1,0],[1,0],[0,-1],[0,1]];
const DIRS_ALFIL_AJEDREZ = [[-1,-1],[-1,1],[1,-1],[1,1]];
const SALTOS_CABALLO_AJEDREZ = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];

function dentroAjedrez(f, c){ return f >= 0 && f < 8 && c >= 0 && c < 8; }

// ¿La casilla idx está atacada por alguna pieza del color "por"?
function casillaAtacadaAjedrez(tablero, idx, por){
    const f0 = Math.floor(idx / 8), c0 = idx % 8;
    // Peones: atacan en diagonal hacia adelante (para el color que ataca).
    const dirPeon = por === 'n' ? -1 : 1;
    for (const dc of [-1, 1]) {
        const f = f0 - dirPeon, c = c0 + dc;
        if (dentroAjedrez(f, c) && tablero[f * 8 + c] === por + 'P') return true;
    }
    for (const [df, dc] of SALTOS_CABALLO_AJEDREZ) {
        const f = f0 + df, c = c0 + dc;
        if (dentroAjedrez(f, c) && tablero[f * 8 + c] === por + 'N') return true;
    }
    for (let df = -1; df <= 1; df++) for (let dc = -1; dc <= 1; dc++) {
        if (!df && !dc) continue;
        const f = f0 + df, c = c0 + dc;
        if (dentroAjedrez(f, c) && tablero[f * 8 + c] === por + 'K') return true;
    }
    const deslizar = (dirs, tipos) => dirs.some(([df, dc]) => {
        let f = f0 + df, c = c0 + dc;
        while (dentroAjedrez(f, c)) {
            const p = tablero[f * 8 + c];
            if (p) return p[0] === por && tipos.includes(p[1]);
            f += df; c += dc;
        }
        return false;
    });
    return deslizar(DIRS_TORRE_AJEDREZ, ['R', 'Q']) || deslizar(DIRS_ALFIL_AJEDREZ, ['B', 'Q']);
}

function reyEnJaqueAjedrez(tablero, color){
    const rey = tablero.indexOf(color + 'K');
    return rey >= 0 && casillaAtacadaAjedrez(tablero, rey, otroColorAjedrez(color));
}

// Movimientos "geométricos" (sin mirar si dejan al rey en jaque).
// Cada uno: { a: destino, tipo?: 'doble'|'alpaso'|'enroqueCorto'|'enroqueLargo' }
function movimientosBrutosAjedrez(estado, idx){
    const tablero = estado.tablero;
    const pieza = tablero[idx];
    if (!pieza) return [];
    const color = pieza[0], tipo = pieza[1];
    const f0 = Math.floor(idx / 8), c0 = idx % 8;
    const res = [];
    const agregarSiPuede = (f, c) => {
        if (!dentroAjedrez(f, c)) return false;
        const p = tablero[f * 8 + c];
        if (!p) { res.push({ a: f * 8 + c }); return true; }
        if (p[0] !== color) res.push({ a: f * 8 + c });
        return false;
    };
    const deslizar = (dirs) => dirs.forEach(([df, dc]) => {
        let f = f0 + df, c = c0 + dc;
        while (agregarSiPuede(f, c)) { f += df; c += dc; }
    });

    if (tipo === 'P') {
        const dir = color === 'n' ? -1 : 1;
        const filaInicial = color === 'n' ? 6 : 1;
        const f1 = f0 + dir;
        if (dentroAjedrez(f1, c0) && !tablero[f1 * 8 + c0]) {
            res.push({ a: f1 * 8 + c0 });
            const f2 = f0 + 2 * dir;
            if (f0 === filaInicial && !tablero[f2 * 8 + c0]) res.push({ a: f2 * 8 + c0, tipo: 'doble' });
        }
        for (const dc of [-1, 1]) {
            const f = f0 + dir, c = c0 + dc;
            if (!dentroAjedrez(f, c)) continue;
            const destino = f * 8 + c;
            const p = tablero[destino];
            if (p && p[0] !== color) res.push({ a: destino });
            else if (!p && estado.alPaso === destino) res.push({ a: destino, tipo: 'alpaso' });
        }
    } else if (tipo === 'N') {
        SALTOS_CABALLO_AJEDREZ.forEach(([df, dc]) => agregarSiPuede(f0 + df, c0 + dc));
    } else if (tipo === 'B') {
        deslizar(DIRS_ALFIL_AJEDREZ);
    } else if (tipo === 'R') {
        deslizar(DIRS_TORRE_AJEDREZ);
    } else if (tipo === 'Q') {
        deslizar([...DIRS_ALFIL_AJEDREZ, ...DIRS_TORRE_AJEDREZ]);
    } else if (tipo === 'K') {
        for (let df = -1; df <= 1; df++) for (let dc = -1; dc <= 1; dc++) {
            if (df || dc) agregarSiPuede(f0 + df, c0 + dc);
        }
        // Enroque: rey y torre sin mover, casillas del medio vacías, y el
        // rey no puede estar en jaque ni pasar ni caer en casilla atacada.
        const enroques = estado.enroques || ENROQUES_INICIALES_AJEDREZ;
        const filaRey = color === 'n' ? 7 : 0;
        const inicioRey = filaRey * 8 + 4;
        const rival = otroColorAjedrez(color);
        if (idx === inicioRey && !casillaAtacadaAjedrez(tablero, idx, rival)) {
            if (enroques[color + 'K'] && tablero[filaRey * 8 + 7] === color + 'R'
                && !tablero[inicioRey + 1] && !tablero[inicioRey + 2]
                && !casillaAtacadaAjedrez(tablero, inicioRey + 1, rival)) {
                res.push({ a: inicioRey + 2, tipo: 'enroqueCorto' });
            }
            if (enroques[color + 'Q'] && tablero[filaRey * 8] === color + 'R'
                && !tablero[inicioRey - 1] && !tablero[inicioRey - 2] && !tablero[inicioRey - 3]
                && !casillaAtacadaAjedrez(tablero, inicioRey - 1, rival)) {
                res.push({ a: inicioRey - 2, tipo: 'enroqueLargo' });
            }
        }
    }
    return res;
}

// Aplica un movimiento y devuelve el estado nuevo (tablero, enroques,
// alPaso, contador de 50 movimientos). No valida: eso lo hace quien llama.
function aplicarMovimientoAjedrez(estado, desde, mov, coronarEn){
    const tablero = [...estado.tablero];
    const pieza = tablero[desde];
    const color = pieza[0], tipo = pieza[1];
    const capturada = mov.tipo === 'alpaso' ? tablero[mov.a + (color === 'n' ? 8 : -8)] : tablero[mov.a];
    tablero[desde] = null;
    if (mov.tipo === 'alpaso') tablero[mov.a + (color === 'n' ? 8 : -8)] = null;
    let final = pieza;
    const filaDestino = Math.floor(mov.a / 8);
    if (tipo === 'P' && (filaDestino === 0 || filaDestino === 7)) final = color + (coronarEn || 'Q');
    tablero[mov.a] = final;
    if (mov.tipo === 'enroqueCorto') { tablero[mov.a - 1] = tablero[mov.a + 1]; tablero[mov.a + 1] = null; }
    if (mov.tipo === 'enroqueLargo') { tablero[mov.a + 1] = tablero[mov.a - 2]; tablero[mov.a - 2] = null; }

    const enroques = { ...(estado.enroques || ENROQUES_INICIALES_AJEDREZ) };
    if (tipo === 'K') { enroques[color + 'K'] = false; enroques[color + 'Q'] = false; }
    // Si se mueve o se captura una torre en su esquina, se pierde ese enroque.
    [[56, 'nQ'], [63, 'nK'], [0, 'cQ'], [7, 'cK']].forEach(([esq, clave]) => {
        if (desde === esq || mov.a === esq) enroques[clave] = false;
    });
    const alPaso = mov.tipo === 'doble' ? (desde + mov.a) / 2 : null;
    const medioMov = (tipo === 'P' || capturada) ? 0 : (estado.medioMov || 0) + 1;
    return { tablero, enroques, alPaso, medioMov, capturada };
}

// Movimientos legales de la pieza en idx (no dejan al propio rey en jaque).
function movimientosLegalesAjedrez(estado, idx){
    const pieza = estado.tablero[idx];
    if (!pieza) return [];
    return movimientosBrutosAjedrez(estado, idx).filter(mov =>
        !reyEnJaqueAjedrez(aplicarMovimientoAjedrez(estado, idx, mov).tablero, pieza[0]));
}

function tieneMovimientosAjedrez(estado, color){
    for (let i = 0; i < 64; i++) {
        if (estado.tablero[i] && estado.tablero[i][0] === color && movimientosLegalesAjedrez(estado, i).length) return true;
    }
    return false;
}

// Sólo reyes, o rey + un alfil/caballo contra rey: nadie puede dar mate.
function materialInsuficienteAjedrez(tablero){
    const resto = tablero.filter(p => p && p[1] !== 'K');
    if (!resto.length) return true;
    return resto.length === 1 && (resto[0][1] === 'B' || resto[0][1] === 'N');
}

// Compatibilidad con la UI de antes: lista de destinos (índices).
function movimientosPosiblesAjedrez(tablero, idx, jugador, estado){
    if (!tablero[idx] || tablero[idx][0] !== colorDeJugadorAjedrez(jugador)) return [];
    return movimientosLegalesAjedrez({ ...(estado || {}), tablero }, idx).map(m => m.a);
}

const NOMBRES_PIEZAS_AJEDREZ = { P:'peón', N:'caballo', B:'alfil', R:'torre', Q:'reina', K:'rey' };
const EMOJI_PIEZAS_AJEDREZ = {
    nP:'♙', nN:'♘', nB:'♗', nR:'♖', nQ:'♕', nK:'♔',
    cP:'♟', cN:'♞', cB:'♝', cR:'♜', cQ:'♛', cK:'♚'
};

let _ajedrezCoronacionPendiente = null; // { origen, destino } mientras se elige la pieza

async function seleccionarCasillaAjedrez(idx){
    const estado = await leerAjedrezActual();
    if (!estado || estado.fase !== 'jugando' || estado.turno !== miIdentidad) return;
    if (_ajedrezCoronacionPendiente) return;
    const tablero = estado.tablero;
    const colorPropio = colorDeJugadorAjedrez(miIdentidad);

    const elegir = (i) => {
        vibrarJ(8);
        if (window.sfx) window.sfx.seleccionar();
        _ajedrezSeleccion = i;
        _ajedrezDestinos = movimientosLegalesAjedrez(estado, i).map(m => m.a);
        renderAjedrez(estado);
    };
    if (_ajedrezSeleccion === null) {
        if (tablero[idx] && colorPiezaAjedrez(tablero[idx]) === colorPropio) elegir(idx);
        return;
    }
    if (idx === _ajedrezSeleccion) { _ajedrezSeleccion = null; _ajedrezDestinos = []; renderAjedrez(estado); return; }
    if (tablero[idx] && colorPiezaAjedrez(tablero[idx]) === colorPropio) { elegir(idx); return; }
    if (!_ajedrezDestinos.includes(idx)) return;

    const origen = _ajedrezSeleccion;
    // Coronación: antes siempre era reina; ahora se elige.
    const filaDestino = Math.floor(idx / 8);
    if (tipoPiezaAjedrez(tablero[origen]) === 'P' && (filaDestino === 0 || filaDestino === 7)) {
        _ajedrezCoronacionPendiente = { origen, destino: idx };
        renderAjedrez(estado);
        return;
    }
    await confirmarMovimientoAjedrez(origen, idx, null, tablero);
}

async function elegirCoronacionAjedrez(tipo){
    const p = _ajedrezCoronacionPendiente;
    if (!p) return;
    if (!tipo) { _ajedrezCoronacionPendiente = null; _ajedrezSeleccion = null; _ajedrezDestinos = []; renderAjedrez(await leerAjedrezActual()); return; }
    const estado = await leerAjedrezActual();
    _ajedrezCoronacionPendiente = null;
    await confirmarMovimientoAjedrez(p.origen, p.destino, tipo, estado?.tablero);
}

async function confirmarMovimientoAjedrez(origen, destino, coronarEn, tableroVistoArr){
    _ajedrezSeleccion = null; _ajedrezDestinos = [];
    // Se escribe en una transacción que confirma que el tablero y el turno
    // no cambiaron (ver js/jugada-segura.js): un doble toque no puede mover
    // dos piezas en el mismo turno. El movimiento se vuelve a validar con
    // las reglas completas sobre el estado recién leído.
    const tableroVisto = JSON.stringify(tableroVistoArr);
    const res = await window.jugadaSegura(refAjedrez(), (actual) => {
        if (!actual || actual.fase !== 'jugando' || actual.turno !== miIdentidad) return null;
        if (JSON.stringify(actual.tablero) !== tableroVisto) return null;
        const pieza = actual.tablero[origen];
        if (!pieza || pieza[0] !== colorDeJugadorAjedrez(miIdentidad)) return null;
        const mov = movimientosLegalesAjedrez(actual, origen).find(m => m.a === destino);
        if (!mov) return null;
        const nuevo = aplicarMovimientoAjedrez(actual, origen, mov, coronarEn);
        const rivalColor = colorDeJugadorAjedrez(miRival);
        const estadoNuevo = { ...actual, ...nuevo };

        const nombrePieza = NOMBRES_PIEZAS_AJEDREZ[tipoPiezaAjedrez(pieza)];
        let mensaje;
        if (mov.tipo === 'enroqueCorto') mensaje = `${nombreJugador(miIdentidad)} enrocó corto.`;
        else if (mov.tipo === 'enroqueLargo') mensaje = `${nombreJugador(miIdentidad)} enrocó largo.`;
        else if (nuevo.capturada) mensaje = `${nombreJugador(miIdentidad)} capturó ${NOMBRES_PIEZAS_AJEDREZ[tipoPiezaAjedrez(nuevo.capturada)]} con su ${nombrePieza}${mov.tipo === 'alpaso' ? ' (al paso)' : ''}.`;
        else mensaje = `${nombreJugador(miIdentidad)} movió ${nombrePieza}.`;
        if (nuevo.tablero[destino] !== pieza) mensaje += ` ¡Corona ${NOMBRES_PIEZAS_AJEDREZ[tipoPiezaAjedrez(nuevo.tablero[destino])]}! 👑`;

        const enJaque = reyEnJaqueAjedrez(nuevo.tablero, rivalColor);
        const puedeMover = tieneMovimientosAjedrez(estadoNuevo, rivalColor);
        const updates = {
            tablero: nuevo.tablero, enroques: nuevo.enroques, alPaso: nuevo.alPaso, medioMov: nuevo.medioMov,
            turno: miRival, jaque: enJaque ? miRival : null, ultimoMov: { desde: origen, a: destino },
        };
        if (!puedeMover && enJaque) {
            const victorias = { ...(actual.victorias || { nico: 0, carito: 0 }) };
            victorias[miIdentidad] = (victorias[miIdentidad] || 0) + 1;
            Object.assign(updates, { fase: 'terminado', ganador: miIdentidad, motivoFin: 'jaque mate', victorias });
            mensaje += ` ¡Jaque mate! 🏆 Ganó ${nombreJugador(miIdentidad)}.`;
        } else if (!puedeMover) {
            Object.assign(updates, { fase: 'terminado', ganador: 'empate', motivoFin: 'rey ahogado' });
            mensaje += ' Rey ahogado: tablas. 🤝';
        } else if (materialInsuficienteAjedrez(nuevo.tablero)) {
            Object.assign(updates, { fase: 'terminado', ganador: 'empate', motivoFin: 'material insuficiente' });
            mensaje += ' No queda material para dar mate: tablas. 🤝';
        } else if (nuevo.medioMov >= 100) {
            Object.assign(updates, { fase: 'terminado', ganador: 'empate', motivoFin: '50 movimientos sin capturas ni peones' });
            mensaje += ' 50 movimientos sin capturas: tablas. 🤝';
        } else if (enJaque) {
            mensaje += ' ¡Jaque! ⚠️';
        }
        updates.historial = pushLog(actual, mensaje);
        return updates;
    });
    if (!res) { renderAjedrez(await leerAjedrezActual()); return; }

    const capturo = !!res.estado.tablero[destino] || (tipoPiezaAjedrez(res.estado.tablero[origen]) === 'P' && destino === res.estado.alPaso);
    vibrarJ(res.cambios.jaque ? [15, 30, 15] : (capturo ? [10,20,10] : 10));
    if (window.sfx) window.sfx[res.cambios.jaque ? 'error' : (capturo ? 'golpe' : 'rebote')]();
    if (res.cambios.fase === 'terminado' && res.cambios.ganador === miIdentidad && typeof registrarEvento === 'function') {
        registrarEvento('gano_ajedrez', `${nombreJugador(miIdentidad)} le ganó a ${nombreJugador(miRival)} en Ajedrez`);
        if (typeof registrarVictoria === 'function') registrarVictoria('ajedrez', miIdentidad);
    }
}

function renderAjedrez(estado){
    const cont = document.getElementById('contenido-ajedrez');
    if (!cont) return;
    const victorias = estado?.victorias || { nico: 0, carito: 0 };
    const marcador = `<div class="texto-tenue texto-centro" style="margin-bottom:6px;">Partidas: Nico ${victorias.nico || 0} — Carito ${victorias.carito || 0}</div>`;

    if (!estado || estado.fase === 'esperando') {
        const listoYo = estado?.listos?.[miIdentidad];
        const listoRival = estado?.listos?.[miRival];
        cont.innerHTML = marcador + `
            <div class="panel texto-centro">
                <p class="texto-tenue">Ajedrez con todas las reglas: enroque, captura al paso, coronación a elección, jaque, jaque mate y tablas. Vos jugás con las piezas ${miIdentidad==='nico'?'blancas (empezás vos)':'negras'}, siempre abajo en tu pantalla.</p>
                <div class="texto-tenue" style="margin-bottom:10px;">
                    ${nombreJugador(miIdentidad)}: ${listoYo ? '✅ listo/a' : '⏳ esperando'}<br>
                    ${nombreJugador(miRival)}: ${listoRival ? '✅ listo/a' : '⏳ esperando'}
                </div>
                <button class="btn-principal" ${listoYo ? 'disabled style="opacity:0.5;"' : ''} onclick="marcarListoAjedrez()">${listoYo ? 'Esperando al otro…' : '¡Estoy listo/a! ♞'}</button>
            </div>`;
        return;
    }

    let html = marcador;
    const enJuego = estado.fase === 'jugando';
    const esMiTurno = enJuego && estado.turno === miIdentidad;
    if (estado.fase === 'terminado') {
        const titulo = estado.ganador === 'empate' ? '🤝 ¡Tablas!' : `🏆 ¡Ganó ${nombreJugador(estado.ganador)}!`;
        html += `<div class="panel texto-centro">
            <div style="font-size:1.3rem; margin-bottom:4px;">${titulo}</div>
            ${estado.motivoFin ? `<div class="texto-tenue" style="margin-bottom:10px;">Por ${estado.motivoFin}.</div>` : ''}
            <button class="btn-principal" onclick="reiniciarAjedrez()">🔁 Jugar de nuevo</button>
        </div>`;
    } else {
        const jaqueAMi = estado.jaque === miIdentidad;
        html += `<div class="info-turno-tablero">${esMiTurno ? (jaqueAMi ? '⚠️ ¡Estás en jaque! Tu turno' : '🎯 Tu turno') : `Turno de ${nombreJugador(miRival)}…${estado.jaque === miRival ? ' (en jaque)' : ''}`} <span id="crono-ajedrez" class="texto-tenue" style="font-size:0.75rem;"></span></div>`;
    }

    if (_ajedrezCoronacionPendiente && esMiTurno) {
        const c = colorDeJugadorAjedrez(miIdentidad);
        html += `<div class="panel texto-centro"><div style="margin-bottom:8px;">¿En qué querés coronar el peón?</div>
            <div style="display:flex; justify-content:center; gap:8px;">
                ${['Q','R','B','N'].map(t => `<button class="btn-secundario" style="font-size:1.8rem; width:auto; padding:4px 12px;" onclick="elegirCoronacionAjedrez('${t}')" aria-label="${NOMBRES_PIEZAS_AJEDREZ[t]}">${EMOJI_PIEZAS_AJEDREZ[c + t]}</button>`).join('')}
            </div>
            <button class="btn-secundario" style="margin-top:8px;" onclick="elegirCoronacionAjedrez(null)">Cancelar</button></div>`;
    }

    // El tablero se ve desde el lado de cada uno: Carito (negras) lo ve
    // dado vuelta, con sus piezas abajo.
    const girar = miIdentidad === 'carito';
    const reyEnJaque = estado.jaque ? estado.tablero.indexOf(colorDeJugadorAjedrez(estado.jaque) + 'K') : -1;
    const ultimo = estado.ultimoMov || {};
    html += `<div class="tablero-juego">`;
    for (let vr = 0; vr < 8; vr++) {
        for (let vc = 0; vc < 8; vc++) {
            const row = girar ? 7 - vr : vr, col = girar ? 7 - vc : vc;
            const idx = row*8+col;
            const oscura = (row+col)%2===1;
            const pieza = estado.tablero[idx];
            let clases = 'casilla-tablero ' + (oscura ? 'casilla-oscura' : 'casilla-clara');
            if (_ajedrezSeleccion === idx) clases += ' casilla-seleccionada';
            if (_ajedrezDestinos.includes(idx)) clases += ' casilla-destino';
            if (idx === reyEnJaque) clases += ' casilla-jaque';
            if (idx === ultimo.desde || idx === ultimo.a) clases += ' casilla-ultimo-mov';
            const contenidoPieza = pieza ? `<span class="pieza-tablero">${EMOJI_PIEZAS_AJEDREZ[pieza]}</span>` : '';
            html += `<div class="${clases}" onclick="${esMiTurno ? `seleccionarCasillaAjedrez(${idx})` : ''}">${contenidoPieza}</div>`;
        }
    }
    html += `</div>`;
    if (estado.historial && estado.historial.length) {
        html += `<div class="panel texto-tenue" style="font-size:0.72rem; line-height:1.6; margin-top:12px;">${estado.historial.slice(-4).map(h => '• ' + h).join('<br>')}</div>`;
    }
    if (enJuego) html += `<button class="btn-secundario" style="margin-top:10px;" onclick="rendirseAjedrez()">🏳️ Rendirse</button>`;
    cont.innerHTML = html;
    if (enJuego && typeof actualizarCronometroTurno === 'function') actualizarCronometroTurno('crono-ajedrez', estado.turno);
}
