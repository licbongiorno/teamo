// ==================== TA-TE-TI INFINITO ====================
// Grilla de 3x3, pero cada jugador sólo tiene 3 marcas activas: al
// poner la 4ta, se le borra automáticamente la más vieja (cola FIFO).
const COMBOS_TATETI = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];

function refTateti(){ return window.doc(window.db, 'juegos', 'tateti'); }

function iniciarTateti(){
    if (window._unsubTateti) window._unsubTateti();
    window._unsubTateti = window.onSnapshot(refTateti(), (snap) => {
        renderTateti(snap.exists() ? snap.data() : null);
    }, (err) => {
        console.error('Error de Firestore en tateti:', err);
        document.getElementById('contenido-tateti').innerHTML = `<div class="panel texto-centro texto-tenue">⚠️ No se pudo conectar (${err.code || 'error'}).</div>`;
    });
}

function tableroVacioTateti(){ return new Array(9).fill(null); }

function renderTateti(estado){
    const cont = document.getElementById('contenido-tateti');
    if (!estado || estado.fase === 'sin_partida') {
        cont.innerHTML = `<div class="panel texto-centro">
            <p class="texto-tenue">Tres en línea, pero cada uno sólo tiene 3 marcas activas: al poner la 4ta, se te borra la más vieja.</p>
            <button class="btn-principal" onclick="nuevaPartidaTateti()">Empezar partida</button>
        </div>`;
        return;
    }

    const tablero = estado.tablero || tableroVacioTateti();
    const colas = estado.colas || { nico: [], carito: [] };
    const antiguaNico = colas.nico.length >= 3 ? colas.nico[0] : null;
    const antiguaCarito = colas.carito.length >= 3 ? colas.carito[0] : null;

    let html = '';
    if (estado.fase === 'terminado') {
        html += `<div class="panel texto-centro">
            <div style="font-size:1.2rem; margin-bottom:10px;">${estado.ganador === 'empate' ? '🤝 ¡Empate!' : `🏆 ¡Ganó ${nombreJugador(estado.ganador)}!`}</div>
            <button class="btn-principal" onclick="nuevaPartidaTateti()">🔁 Jugar de nuevo</button>
        </div>`;
    } else {
        const esMiTurno = estado.turno === miIdentidad;
        html += `<div class="info-turno-tablero">${esMiTurno ? '🎯 Tu turno' : `Turno de ${nombreJugador(estado.turno)}…`}</div>`;
    }

    html += `<div class="tablero-juego" style="grid-template-columns:repeat(3,1fr); max-width:320px; margin:0 auto;">`;
    for (let i = 0; i < 9; i++) {
        const marca = tablero[i];
        const esOscura = (Math.floor(i / 3) + i) % 2 === 1;
        let contenido = '';
        let claseExtra = '';
        if (marca === 'nico') { contenido = '❌'; if (i === antiguaNico) claseExtra = ' marca-antigua'; }
        if (marca === 'carito') { contenido = '⭕'; if (i === antiguaCarito) claseExtra = ' marca-antigua'; }
        html += `<div class="casilla-tablero ${esOscura ? 'casilla-oscura' : 'casilla-clara'}${claseExtra}" onclick="jugarTateti(${i})">${contenido}</div>`;
    }
    html += `</div>`;

    cont.innerHTML = html;
}

async function nuevaPartidaTateti(){
    vibrarJ(12);
    await window.setDoc(refTateti(), {
        fase: 'jugando',
        tablero: tableroVacioTateti(),
        colas: { nico: [], carito: [] },
        turno: 'nico',
        ganador: null
    });
}

function ganadorTateti(tablero, jugador){
    return COMBOS_TATETI.some(([a, b, c]) => tablero[a] === jugador && tablero[b] === jugador && tablero[c] === jugador);
}

async function jugarTateti(idx){
    vibrarJ(12);
    const snap = await new Promise(res => { const u = window.onSnapshot(refTateti(), s => { u(); res(s); }); });
    if (!snap.exists()) return;
    const estado = snap.data();
    if (estado.fase !== 'jugando' || estado.turno !== miIdentidad || estado.tablero[idx]) return;

    const tablero = [...estado.tablero];
    const colas = { nico: [...(estado.colas?.nico || [])], carito: [...(estado.colas?.carito || [])] };
    const miCola = colas[miIdentidad];
    miCola.push(idx);
    if (miCola.length > 3) {
        const viejaIdx = miCola.shift();
        tablero[viejaIdx] = null;
    }
    tablero[idx] = miIdentidad;

    let updates = { tablero, colas };
    if (ganadorTateti(tablero, miIdentidad)) {
        updates.fase = 'terminado';
        updates.ganador = miIdentidad;
    } else {
        updates.turno = miIdentidad === 'nico' ? 'carito' : 'nico';
    }
    await window.updateDoc(refTateti(), updates);
}
