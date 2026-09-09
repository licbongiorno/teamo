// ==================== CONECTA 4 ====================
// Tablero de 7 columnas x 6 filas, guardado como array plano de 42
// (índice = fila*7 + columna, fila 0 = arriba).
const FILAS_C4 = 6, COLS_C4 = 7;

function refConecta4(){ return window.doc(window.db, 'juegos', 'conecta4'); }

function iniciarConecta4(){
    if (window._unsubConecta4) window._unsubConecta4();
    window._unsubConecta4 = window.onSnapshot(refConecta4(), (snap) => {
        renderConecta4(snap.exists() ? snap.data() : null);
    }, (err) => {
        console.error('Error de Firestore en conecta4:', err);
        document.getElementById('contenido-conecta4').innerHTML = `<div class="panel texto-centro texto-tenue">⚠️ No se pudo conectar (${err.code || 'error'}).</div>`;
    });
}

function tableroVacioC4(){ return new Array(FILAS_C4 * COLS_C4).fill(null); }

function renderConecta4(estado){
    const cont = document.getElementById('contenido-conecta4');
    if (!estado || estado.fase === 'sin_partida') {
        cont.innerHTML = `<div class="panel texto-centro">
            <p class="texto-tenue">El clásico de las fichas que caen. Primero en hacer 4 en línea gana.</p>
            <button class="btn-principal" onclick="nuevaPartidaConecta4()">Empezar partida</button>
        </div>`;
        return;
    }

    const tablero = estado.tablero || tableroVacioC4();
    let html = '';
    if (estado.fase === 'terminado') {
        html += `<div class="panel texto-centro">
            <div style="font-size:1.2rem; margin-bottom:10px;">${estado.ganador === 'empate' ? '🤝 ¡Empate!' : `🏆 ¡Ganó ${nombreJugador(estado.ganador)}!`}</div>
            <button class="btn-principal" onclick="nuevaPartidaConecta4()">🔁 Revancha</button>
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
            html += `<div class="casilla-tablero casilla-oscura" onclick="jugarConecta4(${c})">${contenido}</div>`;
        }
    }
    html += `</div>`;

    cont.innerHTML = html;
}

async function nuevaPartidaConecta4(){
    vibrarJ(12);
    await window.setDoc(refConecta4(), {
        fase: 'jugando', tablero: tableroVacioC4(), turno: 'nico', ganador: null
    });
}

function filaLibreC4(tablero, col){
    for (let f = FILAS_C4 - 1; f >= 0; f--) {
        if (!tablero[f * COLS_C4 + col]) return f;
    }
    return -1;
}

function hayGanadorC4(tablero, fila, col, jugador){
    const direcciones = [[0,1],[1,0],[1,1],[1,-1]];
    return direcciones.some(([df, dc]) => {
        let cuenta = 1;
        for (const signo of [1, -1]) {
            let f = fila + df * signo, c = col + dc * signo;
            while (f >= 0 && f < FILAS_C4 && c >= 0 && c < COLS_C4 && tablero[f * COLS_C4 + c] === jugador) {
                cuenta++; f += df * signo; c += dc * signo;
            }
        }
        return cuenta >= 4;
    });
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
    let updates = { tablero };
    if (hayGanadorC4(tablero, fila, col, miIdentidad)) {
        updates.fase = 'terminado';
        updates.ganador = miIdentidad;
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
