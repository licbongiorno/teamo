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

function iniciarAjedrez(){
    _ajedrezSeleccion = null; _ajedrezDestinos = [];
    if (window._unsubAjedrez) window._unsubAjedrez();
    window._unsubAjedrez = window.onSnapshot(refAjedrez(), (snap) => {
        renderAjedrez(snap.exists() ? snap.data() : null);
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
    const estado = await leerAjedrezActual();
    if (estado?.listos?.[miIdentidad]) return;
    const listos = { ...(estado?.listos||{}), [miIdentidad]: true };
    if (listos.nico && listos.carito) {
        await window.setDoc(refAjedrez(), {
            fase:'jugando', tablero: crearTableroInicialAjedrez(), turno: 'nico',
            listos, historial: ['Arranca la partida. Empiezan las blancas (Nico).'], ganador: null
        });
    } else {
        await window.setDoc(refAjedrez(), { fase:'esperando', listos }, { merge:true });
    }
}

async function reiniciarAjedrez(){
    vibrarJ(12);
    await window.setDoc(refAjedrez(), { fase:'esperando', listos:{} });
}

function colorPiezaAjedrez(pieza){ return pieza ? pieza[0] : null; }
function tipoPiezaAjedrez(pieza){ return pieza ? pieza[1] : null; }
function colorDeJugadorAjedrez(jugador){ return jugador === 'nico' ? 'n' : 'c'; }

function destinosDeslizantesAjedrez(tablero, fila, col, direcciones, colorPropio){
    const destinos = [];
    direcciones.forEach(([dr,dc]) => {
        let f = fila+dr, c = col+dc;
        while (f>=0 && f<8 && c>=0 && c<8) {
            const idx = f*8+c;
            if (!tablero[idx]) { destinos.push(idx); }
            else { if (colorPiezaAjedrez(tablero[idx]) !== colorPropio) destinos.push(idx); break; }
            f += dr; c += dc;
        }
    });
    return destinos;
}

function movimientosPosiblesAjedrez(tablero, idx, jugador){
    const pieza = tablero[idx];
    const colorPropio = colorDeJugadorAjedrez(jugador);
    if (!pieza || colorPiezaAjedrez(pieza) !== colorPropio) return [];
    const tipo = tipoPiezaAjedrez(pieza);
    const fila = Math.floor(idx/8), col = idx%8;
    let destinos = [];

    if (tipo === 'P') {
        const dir = colorPropio === 'n' ? -1 : 1;
        const filaInicial = colorPropio === 'n' ? 6 : 1;
        const f1 = fila+dir;
        if (f1>=0 && f1<8 && !tablero[f1*8+col]) {
            destinos.push(f1*8+col);
            const f2 = fila+dir*2;
            if (fila === filaInicial && !tablero[f2*8+col]) destinos.push(f2*8+col);
        }
        [[dir,-1],[dir,1]].forEach(([dr,dc]) => {
            const f = fila+dr, c = col+dc;
            if (f>=0 && f<8 && c>=0 && c<8) {
                const objetivo = tablero[f*8+c];
                if (objetivo && colorPiezaAjedrez(objetivo) !== colorPropio) destinos.push(f*8+c);
            }
        });
    } else if (tipo === 'N') {
        [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]].forEach(([dr,dc]) => {
            const f = fila+dr, c = col+dc;
            if (f>=0 && f<8 && c>=0 && c<8) {
                const objetivo = tablero[f*8+c];
                if (!objetivo || colorPiezaAjedrez(objetivo) !== colorPropio) destinos.push(f*8+c);
            }
        });
    } else if (tipo === 'B') {
        destinos = destinosDeslizantesAjedrez(tablero, fila, col, [[-1,-1],[-1,1],[1,-1],[1,1]], colorPropio);
    } else if (tipo === 'R') {
        destinos = destinosDeslizantesAjedrez(tablero, fila, col, [[-1,0],[1,0],[0,-1],[0,1]], colorPropio);
    } else if (tipo === 'Q') {
        destinos = destinosDeslizantesAjedrez(tablero, fila, col, [[-1,-1],[-1,1],[1,-1],[1,1],[-1,0],[1,0],[0,-1],[0,1]], colorPropio);
    } else if (tipo === 'K') {
        [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]].forEach(([dr,dc]) => {
            const f = fila+dr, c = col+dc;
            if (f>=0 && f<8 && c>=0 && c<8) {
                const objetivo = tablero[f*8+c];
                if (!objetivo || colorPiezaAjedrez(objetivo) !== colorPropio) destinos.push(f*8+c);
            }
        });
    }
    return destinos;
}

const NOMBRES_PIEZAS_AJEDREZ = { P:'peón', N:'caballo', B:'alfil', R:'torre', Q:'reina', K:'rey' };
const EMOJI_PIEZAS_AJEDREZ = {
    nP:'♙', nN:'♘', nB:'♗', nR:'♖', nQ:'♕', nK:'♔',
    cP:'♟', cN:'♞', cB:'♝', cR:'♜', cQ:'♛', cK:'♚'
};

async function seleccionarCasillaAjedrez(idx){
    const estado = await leerAjedrezActual();
    if (!estado || estado.fase !== 'jugando' || estado.turno !== miIdentidad) return;
    const tablero = estado.tablero;
    const colorPropio = colorDeJugadorAjedrez(miIdentidad);

    if (_ajedrezSeleccion === null) {
        if (tablero[idx] && colorPiezaAjedrez(tablero[idx]) === colorPropio) {
            vibrarJ(8);
            _ajedrezSeleccion = idx;
            _ajedrezDestinos = movimientosPosiblesAjedrez(tablero, idx, miIdentidad);
            renderAjedrez(estado);
        }
        return;
    }
    if (idx === _ajedrezSeleccion) { _ajedrezSeleccion = null; _ajedrezDestinos = []; renderAjedrez(estado); return; }
    if (tablero[idx] && colorPiezaAjedrez(tablero[idx]) === colorPropio) {
        _ajedrezSeleccion = idx;
        _ajedrezDestinos = movimientosPosiblesAjedrez(tablero, idx, miIdentidad);
        renderAjedrez(estado);
        return;
    }
    if (!_ajedrezDestinos.includes(idx)) return;

    const nuevoTablero = [...tablero];
    const pieza = nuevoTablero[_ajedrezSeleccion];
    const objetivo = nuevoTablero[idx];
    nuevoTablero[_ajedrezSeleccion] = null;

    let mensaje = `${nombreJugador(miIdentidad)} movió ${NOMBRES_PIEZAS_AJEDREZ[tipoPiezaAjedrez(pieza)]}.`;
    let terminoPartida = false;
    if (objetivo) {
        mensaje = `${nombreJugador(miIdentidad)} capturó ${NOMBRES_PIEZAS_AJEDREZ[tipoPiezaAjedrez(objetivo)]} con su ${NOMBRES_PIEZAS_AJEDREZ[tipoPiezaAjedrez(pieza)]}.`;
        if (tipoPiezaAjedrez(objetivo) === 'K') terminoPartida = true;
    }

    let piezaFinal = pieza;
    const filaDestino = Math.floor(idx/8);
    if (tipoPiezaAjedrez(pieza) === 'P' && (filaDestino === 0 || filaDestino === 7)) {
        piezaFinal = colorPropio + 'Q';
        mensaje += ' ¡Corona reina! 👑';
    }
    nuevoTablero[idx] = piezaFinal;

    vibrarJ(objetivo ? [10,20,10] : 10);
    _ajedrezSeleccion = null; _ajedrezDestinos = [];

    const updates = { tablero: nuevoTablero, turno: miRival, historial: pushLog(estado, mensaje) };
    if (terminoPartida) {
        updates.fase = 'terminado';
        updates.ganador = miIdentidad;
        updates.historial = pushLog(estado, `${mensaje} 🏆 ¡${nombreJugador(miIdentidad)} ganó la partida!`);
    }
    await window.updateDoc(refAjedrez(), updates);
}

function renderAjedrez(estado){
    const cont = document.getElementById('contenido-ajedrez');
    if (!cont) return;

    if (!estado || estado.fase === 'esperando') {
        const listoYo = estado?.listos?.[miIdentidad];
        const listoRival = estado?.listos?.[miRival];
        cont.innerHTML = `
            <div class="panel texto-centro">
                <p class="texto-tenue">Ajedrez clásico simplificado (sin enroque, sin captura al paso; el rey no tiene detección de jaque — la partida termina al capturarlo). Vos jugás con las piezas ${miIdentidad==='nico'?'blancas (abajo)':'negras (arriba)'}.</p>
                <div class="texto-tenue" style="margin-bottom:10px;">
                    ${nombreJugador(miIdentidad)}: ${listoYo ? '✅ listo/a' : '⏳ esperando'}<br>
                    ${nombreJugador(miRival)}: ${listoRival ? '✅ listo/a' : '⏳ esperando'}
                </div>
                <button class="btn-principal" ${listoYo ? 'disabled style="opacity:0.5;"' : ''} onclick="marcarListoAjedrez()">${listoYo ? 'Esperando al otro…' : '¡Estoy listo/a! ♞'}</button>
            </div>`;
        return;
    }

    if (estado.fase === 'terminado') {
        cont.innerHTML = `
            <div class="panel texto-centro">
                <div style="font-size:1.3rem; margin-bottom:10px;">🏆 ¡Ganó ${nombreJugador(estado.ganador)}!</div>
                <button class="btn-principal" onclick="reiniciarAjedrez()">🔁 Jugar de nuevo</button>
            </div>`;
        return;
    }

    const esMiTurno = estado.turno === miIdentidad;
    let html = `<div class="info-turno-tablero">${esMiTurno ? '🎯 Tu turno' : `Turno de ${nombreJugador(miRival)}…`}</div>`;
    html += `<div class="tablero-juego">`;
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const idx = row*8+col;
            const oscura = (row+col)%2===1;
            const pieza = estado.tablero[idx];
            let clases = 'casilla-tablero ' + (oscura ? 'casilla-oscura' : 'casilla-clara');
            if (_ajedrezSeleccion === idx) clases += ' casilla-seleccionada';
            if (_ajedrezDestinos.includes(idx)) clases += ' casilla-destino';
            const contenidoPieza = pieza ? `<span class="pieza-tablero">${EMOJI_PIEZAS_AJEDREZ[pieza]}</span>` : '';
            html += `<div class="${clases}" onclick="${esMiTurno ? `seleccionarCasillaAjedrez(${idx})` : ''}">${contenidoPieza}</div>`;
        }
    }
    html += `</div>`;
    if (estado.historial && estado.historial.length) {
        html += `<div class="panel texto-tenue" style="font-size:0.72rem; line-height:1.6; margin-top:12px;">${estado.historial.slice(-4).map(h => '• ' + h).join('<br>')}</div>`;
    }
    html += `<button class="btn-secundario" style="margin-top:10px;" onclick="reiniciarAjedrez()">🔁 Reiniciar partida</button>`;
    cont.innerHTML = html;
}
