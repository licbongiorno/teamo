// ==================== CONECTA 4 ====================
// Tablero de 7 columnas x 6 filas, guardado como array plano de 42
// (índice = fila*7 + columna, fila 0 = arriba).
const FILAS_C4 = 6, COLS_C4 = 7;

function refConecta4(){ return window.doc(window.db, 'juegos', 'conecta4'); }

let _conecta4FaseAnterior = null;
function iniciarConecta4(){
    if (window._unsubConecta4) window._unsubConecta4();
    _conecta4FaseAnterior = null;
    window._unsubConecta4 = window.onSnapshot(refConecta4(), (snap) => {
        const datos = snap.exists() ? snap.data() : null;
        if (datos && datos.fase === 'terminado' && _conecta4FaseAnterior === 'jugando' && window.sfx) {
            if (datos.ganador === 'empate') window.sfx.empate();
            else window.sfx[datos.ganador === miIdentidad ? 'victoria' : 'derrota']();
            if (window.fx && (datos.ganador === miIdentidad)) window.fx.confeti();
        }
        _conecta4FaseAnterior = datos ? datos.fase : null;
        renderConecta4(datos);
    }, (err) => {
        console.error('Error de Firestore en conecta4:', err);
        document.getElementById('contenido-conecta4').innerHTML = `<div class="panel texto-centro texto-tenue">⚠️ No se pudo conectar (${err.code || 'error'}).</div>`;
    });
}

function tableroVacioC4(){ return new Array(FILAS_C4 * COLS_C4).fill(null); }

function renderConecta4(estado){
    const cont = document.getElementById('contenido-conecta4');
    if (!estado || estado.fase === 'sin_partida' || estado.fase === 'esperando') {
        const listoYo = estado?.listos?.[miIdentidad];
        const listoRival = estado?.listos?.[miRival];
        cont.innerHTML = `<div class="panel texto-centro">
            <p class="texto-tenue">El clásico de las fichas que caen. Primero en hacer 4 en línea gana.</p>
            <div class="texto-tenue" style="margin-bottom:10px;">
                ${nombreJugador(miIdentidad)}: ${listoYo ? '✅ listo/a' : '⏳ esperando'}<br>
                ${nombreJugador(miRival)}: ${listoRival ? '✅ listo/a' : '⏳ esperando'}
            </div>
            <button class="btn-principal" ${listoYo ? 'disabled style="opacity:0.5;"' : ''} onclick="marcarListoConecta4()">${listoYo ? 'Esperando al otro…' : '¡Estoy listo/a! 🔴🟡'}</button>
        </div>`;
        return;
    }

    const tablero = estado.tablero || tableroVacioC4();
    const puntajes = estado.puntajes || { nico: 0, carito: 0 };
    const lineaGanadora = estado.lineaGanadora || [];
    let html = `<div class="texto-tenue texto-centro" style="margin-bottom:8px;">Nico ${puntajes.nico || 0} — Carito ${puntajes.carito || 0}</div>`;
    if (estado.fase === 'terminado') {
        html += `<div class="panel texto-centro">
            <div style="font-size:1.2rem; margin-bottom:10px;">${estado.ganador === 'empate' ? '🤝 ¡Empate!' : `🏆 ¡Ganó ${nombreJugador(estado.ganador)}!`}</div>
            <button class="btn-principal" onclick="reiniciarConecta4()">🔁 Revancha</button>
        </div>`;
    } else {
        const esMiTurno = estado.turno === miIdentidad;
        html += `<div class="info-turno-tablero">${esMiTurno ? '🎯 Tu turno' : `Turno de ${nombreJugador(estado.turno)}…`}</div>`;
    }

    html += `<div class="tablero-juego" style="grid-template-columns:repeat(${COLS_C4},1fr); max-width:380px; margin:0 auto;">`;
    for (let f = 0; f < FILAS_C4; f++) {
        for (let c = 0; c < COLS_C4; c++) {
            const i = f * COLS_C4 + c;
            const marca = tablero[i];
            let contenido = '';
            if (marca === 'nico') contenido = '<span class="ficha-c4 ficha-nico"></span>';
            if (marca === 'carito') contenido = '<span class="ficha-c4 ficha-carito"></span>';
            const claseGanadora = lineaGanadora.includes(i) ? ' casilla-ganadora' : '';
            html += `<div class="casilla-tablero casilla-oscura${claseGanadora}" onclick="jugarConecta4(${c})">${contenido}</div>`;
        }
    }
    html += `</div>`;

    cont.innerHTML = html;
}

// Mismo patrón "los dos listos" que Ta-Te-Ti/Ajedrez/Escoba: antes
// cualquiera podía arrancar o reiniciar sin el otro, pisándole una
// partida en curso.
async function marcarListoConecta4(){
    vibrarJ(12);
    const ref = refConecta4();
    await window.runTransaction(window.db, async (tx) => {
        const snap = await tx.get(ref);
        const estado = snap.exists() ? snap.data() : null;
        if (estado?.listos?.[miIdentidad]) return;
        const listos = { ...(estado?.listos || {}), [miIdentidad]: true };
        if (listos.nico && listos.carito) {
            tx.set(ref, {
                fase: 'jugando', listos, tablero: tableroVacioC4(), turno: 'nico', ganador: null,
                lineaGanadora: null, puntajes: estado?.puntajes || { nico: 0, carito: 0 }
            });
        } else {
            tx.set(ref, { fase: 'esperando', listos, puntajes: estado?.puntajes || { nico: 0, carito: 0 } }, { merge: true });
        }
    });
}

async function reiniciarConecta4(){
    vibrarJ(12);
    const anterior = await new Promise(res => { const u = window.onSnapshot(refConecta4(), s => { u(); res(s.exists() ? s.data() : null); }); });
    await window.setDoc(refConecta4(), { fase: 'esperando', listos: {}, puntajes: anterior?.puntajes || { nico: 0, carito: 0 } });
}

function filaLibreC4(tablero, col){
    for (let f = FILAS_C4 - 1; f >= 0; f--) {
        if (!tablero[f * COLS_C4 + col]) return f;
    }
    return -1;
}

// Devuelve las 4 casillas en línea que ganaron (para resaltarlas) o
// null si todavía no hay 4 en línea.
function lineaGanadoraC4(tablero, fila, col, jugador){
    const direcciones = [[0,1],[1,0],[1,1],[1,-1]];
    for (const [df, dc] of direcciones) {
        const linea = [[fila, col]];
        for (const signo of [1, -1]) {
            let f = fila + df * signo, c = col + dc * signo;
            while (f >= 0 && f < FILAS_C4 && c >= 0 && c < COLS_C4 && tablero[f * COLS_C4 + c] === jugador) {
                linea.push([f, c]); f += df * signo; c += dc * signo;
            }
        }
        if (linea.length >= 4) return linea.map(([f, c]) => f * COLS_C4 + c);
    }
    return null;
}

async function jugarConecta4(col){
    vibrarJ(12);
    const snap = await new Promise(res => { const u = window.onSnapshot(refConecta4(), s => { u(); res(s); }); });
    if (!snap.exists()) return;
    const estado = snap.data();
    if (estado.fase !== 'jugando' || estado.turno !== miIdentidad) return;
    const tablero = [...estado.tablero];
    const fila = filaLibreC4(tablero, col);
    if (fila === -1) return; // columna llena

    tablero[fila * COLS_C4 + col] = miIdentidad;
    if (window.sfx) window.sfx.rebote();
    let updates = { tablero };
    const lineaGanadora = lineaGanadoraC4(tablero, fila, col, miIdentidad);
    if (lineaGanadora) {
        updates.fase = 'terminado';
        updates.ganador = miIdentidad;
        updates.lineaGanadora = lineaGanadora;
        const puntajes = { ...(estado.puntajes || { nico: 0, carito: 0 }) };
        puntajes[miIdentidad] = (puntajes[miIdentidad] || 0) + 1;
        updates.puntajes = puntajes;
        vibrarJ([15, 30, 15]);
    } else if (tablero.every(c => c)) {
        updates.fase = 'terminado';
        updates.ganador = 'empate';
    } else {
        updates.turno = miIdentidad === 'nico' ? 'carito' : 'nico';
    }
    await window.updateDoc(refConecta4(), updates);
    if (updates.fase === 'terminado' && updates.ganador !== 'empate' && typeof registrarEvento === 'function') {
        registrarEvento('gano_partida', `${nombreJugador(updates.ganador)} ganó al Conecta 4`);
    }
}
