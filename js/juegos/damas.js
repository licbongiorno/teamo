// ==================== DAMAS ====================
function refDamas(){ return window.doc(window.db, 'juegos', 'damas'); }

function crearTableroInicialDamas(){
    const t = new Array(64).fill(null);
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            if ((row + col) % 2 === 1) {
                if (row <= 2) t[row*8+col] = 'n';
                else if (row >= 5) t[row*8+col] = 'c';
            }
        }
    }
    return t;
}

let _damasSeleccion = null;
let _damasDestinos = [];
let _damasCapturasActuales = [];

function iniciarDamas(){
    _damasSeleccion = null; _damasDestinos = []; _damasCapturasActuales = [];
    if (window._unsubDamas) window._unsubDamas();
    window._unsubDamas = window.onSnapshot(refDamas(), (snap) => {
        renderDamas(snap.exists() ? snap.data() : null);
    }, (err) => {
        console.error('Error de Firestore en damas:', err);
        const cont = document.getElementById('contenido-damas');
        if (cont) cont.innerHTML = `<div class="panel texto-centro texto-tenue">⚠️ No se pudo conectar (${err.code || 'error'}). Si el error dice "permission-denied", hay que sumar la colección "juegos" a las Reglas de Firestore.</div>`;
    });
}

async function leerDamasActual(){
    return await new Promise(res => { const u = window.onSnapshot(refDamas(), s => { u(); res(s.exists() ? s.data() : null); }); });
}

async function marcarListoDamas(){
    vibrarJ(12);
    const estado = await leerDamasActual();
    if (estado?.listos?.[miIdentidad]) return;
    const listos = { ...(estado?.listos||{}), [miIdentidad]: true };
    if (listos.nico && listos.carito) {
        const manoElegida = Math.random() < 0.5 ? 'nico' : 'carito';
        await window.setDoc(refDamas(), {
            fase:'jugando', tablero: crearTableroInicialDamas(), turno: manoElegida,
            listos, historial: [`Arranca la partida. Empieza ${nombreJugador(manoElegida)}.`], ganador: null
        });
    } else {
        await window.setDoc(refDamas(), { fase:'esperando', listos }, { merge:true });
    }
}

async function reiniciarDamas(){
    vibrarJ(12);
    await window.setDoc(refDamas(), { fase:'esperando', listos:{} });
}

function esPropiaFichaDamas(pieza, jugador){
    return !!pieza && pieza[0] === (jugador === 'nico' ? 'n' : 'c');
}
function esRivalFichaDamas(pieza, jugador){
    return !!pieza && pieza[0] !== (jugador === 'nico' ? 'n' : 'c');
}
function esDamaCoronada(pieza){ return !!pieza && pieza.length > 1; }

function movimientosPosiblesDamas(tablero, idx, jugador){
    const fila = Math.floor(idx/8), col = idx%8;
    const pieza = tablero[idx];
    if (!esPropiaFichaDamas(pieza, jugador)) return { simples:[], capturas:[] };
    const esDama = esDamaCoronada(pieza);
    const direcciones = esDama ? [[-1,-1],[-1,1],[1,-1],[1,1]]
        : (jugador === 'nico' ? [[1,-1],[1,1]] : [[-1,-1],[-1,1]]);
    const simples = [], capturas = [];
    direcciones.forEach(([dr,dc]) => {
        const f1 = fila+dr, c1 = col+dc;
        if (f1<0||f1>7||c1<0||c1>7) return;
        const idx1 = f1*8+c1;
        if (!tablero[idx1]) { simples.push(idx1); return; }
        if (esRivalFichaDamas(tablero[idx1], jugador)) {
            const f2 = fila+dr*2, c2 = col+dc*2;
            if (f2<0||f2>7||c2<0||c2>7) return;
            const idx2 = f2*8+c2;
            if (!tablero[idx2]) capturas.push({ destino: idx2, capturada: idx1 });
        }
    });
    return { simples, capturas };
}

function hayCapturasDisponiblesDamas(tablero, jugador){
    for (let i=0;i<64;i++){
        if (esPropiaFichaDamas(tablero[i], jugador)) {
            const { capturas } = movimientosPosiblesDamas(tablero, i, jugador);
            if (capturas.length) return true;
        }
    }
    return false;
}

async function seleccionarCasillaDamas(idx){
    const estado = await leerDamasActual();
    if (!estado || estado.fase !== 'jugando' || estado.turno !== miIdentidad) return;
    const tablero = estado.tablero;

    if (_damasSeleccion === null) {
        if (esPropiaFichaDamas(tablero[idx], miIdentidad)) {
            vibrarJ(8);
            _damasSeleccion = idx;
            const { simples, capturas } = movimientosPosiblesDamas(tablero, idx, miIdentidad);
            const hayCapturaGlobal = hayCapturasDisponiblesDamas(tablero, miIdentidad);
            _damasDestinos = hayCapturaGlobal ? capturas.map(c=>c.destino) : [...simples, ...capturas.map(c=>c.destino)];
            _damasCapturasActuales = capturas;
            renderDamas(estado);
        }
        return;
    }
    if (idx === _damasSeleccion) { _damasSeleccion = null; _damasDestinos = []; renderDamas(estado); return; }
    if (esPropiaFichaDamas(tablero[idx], miIdentidad)) {
        _damasSeleccion = idx;
        const { simples, capturas } = movimientosPosiblesDamas(tablero, idx, miIdentidad);
        const hayCapturaGlobal = hayCapturasDisponiblesDamas(tablero, miIdentidad);
        _damasDestinos = hayCapturaGlobal ? capturas.map(c=>c.destino) : [...simples, ...capturas.map(c=>c.destino)];
        _damasCapturasActuales = capturas;
        renderDamas(estado);
        return;
    }
    if (!_damasDestinos.includes(idx)) return;

    const nuevoTablero = [...tablero];
    const pieza = nuevoTablero[_damasSeleccion];
    nuevoTablero[_damasSeleccion] = null;
    const captura = _damasCapturasActuales.find(c => c.destino === idx);
    let mensaje = captura ? `${nombreJugador(miIdentidad)} comió una ficha.` : `${nombreJugador(miIdentidad)} movió una ficha.`;
    if (captura) nuevoTablero[captura.capturada] = null;

    const filaDestino = Math.floor(idx/8);
    let piezaFinal = pieza;
    if (!esDamaCoronada(pieza) && ((miIdentidad==='nico' && filaDestino===7) || (miIdentidad==='carito' && filaDestino===0))) {
        piezaFinal = pieza + 'D';
        mensaje += ' ¡Corona dama! 👑';
    }
    nuevoTablero[idx] = piezaFinal;

    vibrarJ(captura ? [10,20,10] : 10);
    _damasSeleccion = null; _damasDestinos = []; _damasCapturasActuales = [];

    const quedanRival = nuevoTablero.some(p => esRivalFichaDamas(p, miIdentidad));
    const updates = { tablero: nuevoTablero, turno: miRival, historial: pushLog(estado, mensaje) };
    if (!quedanRival) {
        updates.fase = 'terminado';
        updates.ganador = miIdentidad;
        updates.historial = pushLog(estado, `${mensaje} 🏆 ¡${nombreJugador(miIdentidad)} ganó la partida!`);
    }
    await window.updateDoc(refDamas(), updates);
}

function renderDamas(estado){
    const cont = document.getElementById('contenido-damas');
    if (!cont) return;

    if (!estado || estado.fase === 'esperando') {
        const listoYo = estado?.listos?.[miIdentidad];
        const listoRival = estado?.listos?.[miRival];
        cont.innerHTML = `
            <div class="panel texto-centro">
                <p class="texto-tenue">Tablero de damas clásico, sin captura obligatoria. Vos jugás con las fichas ${miIdentidad==='nico'?'blancas ⚪ (arriba)':'negras ⚫ (abajo)'}.</p>
                <div class="texto-tenue" style="margin-bottom:10px;">
                    ${nombreJugador(miIdentidad)}: ${listoYo ? '✅ listo/a' : '⏳ esperando'}<br>
                    ${nombreJugador(miRival)}: ${listoRival ? '✅ listo/a' : '⏳ esperando'}
                </div>
                <button class="btn-principal" ${listoYo ? 'disabled style="opacity:0.5;"' : ''} onclick="marcarListoDamas()">${listoYo ? 'Esperando al otro…' : '¡Estoy listo/a! ⚫'}</button>
            </div>`;
        return;
    }

    if (estado.fase === 'terminado') {
        cont.innerHTML = `
            <div class="panel texto-centro">
                <div style="font-size:1.3rem; margin-bottom:10px;">🏆 ¡Ganó ${nombreJugador(estado.ganador)}!</div>
                <button class="btn-principal" onclick="reiniciarDamas()">🔁 Jugar de nuevo</button>
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
            if (_damasSeleccion === idx) clases += ' casilla-seleccionada';
            if (_damasDestinos.includes(idx)) clases += ' casilla-destino';
            let contenidoPieza = '';
            if (pieza) {
                const color = pieza[0] === 'n' ? '⚪' : '⚫';
                contenidoPieza = `<span class="pieza-tablero">${color}${esDamaCoronada(pieza) ? '<span class="corona-dama">👑</span>' : ''}</span>`;
            }
            html += `<div class="${clases}" onclick="${(oscura && esMiTurno) ? `seleccionarCasillaDamas(${idx})` : ''}">${contenidoPieza}</div>`;
        }
    }
    html += `</div>`;
    if (estado.historial && estado.historial.length) {
        html += `<div class="panel texto-tenue" style="font-size:0.72rem; line-height:1.6; margin-top:12px;">${estado.historial.slice(-4).map(h => '• ' + h).join('<br>')}</div>`;
    }
    html += `<button class="btn-secundario" style="margin-top:10px;" onclick="reiniciarDamas()">🔁 Reiniciar partida</button>`;
    cont.innerHTML = html;
}
