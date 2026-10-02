// ==================== REVERSI ====================
// Tablero 8x8 (array plano de 64, índice = fila*8 + columna). Nico
// juega con las fichas celestes y empieza; Carito con las rosas. Cada
// jugada tiene que encerrar al menos una ficha del otro en línea recta
// (horizontal, vertical o diagonal) y las da vuelta. Si alguien no
// tiene jugadas posibles, pasa solo. Termina cuando ninguno puede
// mover; gana quien tenga más fichas.
// Las jugadas van por jugadaSegura (js/jugada-segura.js): lectura,
// validación y escritura en una sola transacción.
const TAM_REVERSI = 8;
const DIRS_REVERSI = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];

function refReversi(){ return window.doc(window.db, 'juegos', 'reversi'); }

function tableroInicialReversi(){
    const t = new Array(64).fill(null);
    t[27] = 'carito'; t[28] = 'nico'; t[35] = 'nico'; t[36] = 'carito';
    return t;
}

// Fichas que da vuelta jugar en idx (vacío = jugada inválida).
function volteosReversi(tablero, idx, jugador){
    if (tablero[idx]) return [];
    const otro = jugador === 'nico' ? 'carito' : 'nico';
    const f0 = Math.floor(idx / TAM_REVERSI), c0 = idx % TAM_REVERSI;
    const total = [];
    for (const [df, dc] of DIRS_REVERSI) {
        const linea = [];
        let f = f0 + df, c = c0 + dc;
        while (f >= 0 && f < TAM_REVERSI && c >= 0 && c < TAM_REVERSI && tablero[f * TAM_REVERSI + c] === otro) {
            linea.push(f * TAM_REVERSI + c);
            f += df; c += dc;
        }
        if (linea.length && f >= 0 && f < TAM_REVERSI && c >= 0 && c < TAM_REVERSI && tablero[f * TAM_REVERSI + c] === jugador) {
            total.push(...linea);
        }
    }
    return total;
}

function jugadasPosiblesReversi(tablero, jugador){
    const res = [];
    for (let i = 0; i < 64; i++) if (volteosReversi(tablero, i, jugador).length) res.push(i);
    return res;
}

function contarReversi(tablero){
    return {
        nico: tablero.filter(x => x === 'nico').length,
        carito: tablero.filter(x => x === 'carito').length,
    };
}

let _reversiFaseAnterior = null;
function iniciarReversi(){
    if (window._unsubReversi) window._unsubReversi();
    _reversiFaseAnterior = null;
    window._unsubReversi = window.onSnapshot(refReversi(), (snap) => {
        const datos = snap.exists() ? snap.data() : null;
        if (datos && datos.fase === 'terminado' && _reversiFaseAnterior === 'jugando' && window.sfx) {
            if (datos.ganador === 'empate') window.sfx.empate();
            else window.sfx[datos.ganador === miIdentidad ? 'victoria' : 'derrota']();
            if (window.fx && datos.ganador === miIdentidad) window.fx.confeti();
        }
        _reversiFaseAnterior = datos ? datos.fase : null;
        renderReversi(datos);
    }, (err) => {
        console.error('Error de Firestore en reversi:', err);
        document.getElementById('contenido-reversi').innerHTML = `<div class="panel texto-centro texto-tenue">⚠️ No se pudo conectar (${err.code || 'error'}).</div>`;
    });
}

function renderReversi(estado){
    const cont = document.getElementById('contenido-reversi');
    if (!cont) return;
    if (!estado || estado.fase === 'esperando') {
        const listoYo = estado?.listos?.[miIdentidad];
        const listoRival = estado?.listos?.[miRival];
        cont.innerHTML = `<div class="panel texto-centro">
            <p class="texto-tenue">Poné tu ficha encerrando fichas del otro en línea recta para darlas vuelta. Gana quien tenga más fichas al final. Nico (celeste) empieza.</p>
            <div class="texto-tenue" style="margin-bottom:10px;">
                ${nombreJugador(miIdentidad)}: ${listoYo ? '✅ listo/a' : '⏳ esperando'}<br>
                ${nombreJugador(miRival)}: ${listoRival ? '✅ listo/a' : '⏳ esperando'}
            </div>
            <button class="btn-principal" ${listoYo ? 'disabled style="opacity:0.5;"' : ''} onclick="marcarListoReversi()">${listoYo ? 'Esperando al otro…' : '¡Estoy listo/a! ⚪'}</button>
        </div>`;
        return;
    }

    const tablero = estado.tablero || tableroInicialReversi();
    const cuenta = contarReversi(tablero);
    const victorias = estado.victorias || { nico: 0, carito: 0 };
    const esMiTurno = estado.fase === 'jugando' && estado.turno === miIdentidad;
    const posibles = esMiTurno ? jugadasPosiblesReversi(tablero, miIdentidad) : [];

    let html = `<div class="texto-tenue texto-centro" style="margin-bottom:6px;">Partidas: Nico ${victorias.nico || 0} — Carito ${victorias.carito || 0}</div>
        <div class="texto-centro" style="margin-bottom:8px;"><span class="ficha-reversi-mini ficha-nico"></span> ${cuenta.nico} &nbsp;—&nbsp; <span class="ficha-reversi-mini ficha-carito"></span> ${cuenta.carito}</div>`;
    if (estado.fase === 'terminado') {
        html += `<div class="panel texto-centro">
            <div style="font-size:1.2rem; margin-bottom:10px;">${estado.ganador === 'empate' ? '🤝 ¡Empate!' : `🏆 ¡Ganó ${nombreJugador(estado.ganador)}!`}</div>
            <button class="btn-principal" onclick="reiniciarReversi()">🔁 Revancha</button>
        </div>`;
    } else {
        html += `<div class="info-turno-tablero">${esMiTurno ? '🎯 Tu turno' : `Turno de ${nombreJugador(estado.turno)}…`}${estado.aviso ? `<br><span class="texto-tenue">${estado.aviso}</span>` : ''}</div>`;
    }

    html += `<div class="tablero-juego tablero-reversi" style="grid-template-columns:repeat(8,1fr); max-width:380px; margin:0 auto;">`;
    for (let i = 0; i < 64; i++) {
        const marca = tablero[i];
        let contenido = '';
        if (marca) contenido = `<span class="ficha-reversi ficha-${marca}${(estado.ultimosVolteos || []).includes(i) ? ' ficha-volteada' : ''}"></span>`;
        const clase = posibles.includes(i) ? ' casilla-destino' : '';
        const ultima = estado.ultimaJugada === i ? ' casilla-ultima-reversi' : '';
        html += `<div class="casilla-tablero casilla-reversi${clase}${ultima}" onclick="jugarReversi(${i})">${contenido}</div>`;
    }
    html += `</div>`;
    cont.innerHTML = html;
}

async function marcarListoReversi(){
    vibrarJ(12);
    const ref = refReversi();
    await window.runTransaction(window.db, async (tx) => {
        const snap = await tx.get(ref);
        const estado = snap.exists() ? snap.data() : null;
        if (estado?.fase === 'jugando' || estado?.listos?.[miIdentidad]) return;
        const listos = { ...(estado?.listos || {}), [miIdentidad]: true };
        const victorias = estado?.victorias || { nico: 0, carito: 0 };
        if (listos.nico && listos.carito) {
            tx.set(ref, {
                fase: 'jugando', listos, tablero: tableroInicialReversi(), turno: 'nico',
                ganador: null, aviso: null, ultimaJugada: null, ultimosVolteos: [], victorias
            });
        } else {
            tx.set(ref, { fase: 'esperando', listos, victorias }, { merge: true });
        }
    });
}

// Sólo vuelve a "esperando" si la partida ya terminó: así nadie le
// puede reiniciar al otro una partida en curso.
async function reiniciarReversi(){
    vibrarJ(12);
    const ref = refReversi();
    await window.runTransaction(window.db, async (tx) => {
        const snap = await tx.get(ref);
        const estado = snap.exists() ? snap.data() : null;
        if (estado && estado.fase === 'jugando') return;
        tx.set(ref, { fase: 'esperando', listos: {}, victorias: estado?.victorias || { nico: 0, carito: 0 } });
    });
}

async function jugarReversi(idx){
    const res = await window.jugadaSegura(refReversi(), (estado) => {
        if (!estado || estado.fase !== 'jugando' || estado.turno !== miIdentidad) return null;
        const tablero = [...estado.tablero];
        const volteos = volteosReversi(tablero, idx, miIdentidad);
        if (!volteos.length) return null;
        tablero[idx] = miIdentidad;
        volteos.forEach(i => { tablero[i] = miIdentidad; });

        const updates = { tablero, ultimaJugada: idx, ultimosVolteos: volteos, aviso: null };
        const puedeRival = jugadasPosiblesReversi(tablero, miRival).length > 0;
        const puedoYo = jugadasPosiblesReversi(tablero, miIdentidad).length > 0;
        if (puedeRival) {
            updates.turno = miRival;
        } else if (puedoYo) {
            // El otro no tiene jugadas: pasa solo y sigo yo.
            updates.turno = miIdentidad;
            updates.aviso = `${nombreJugador(miRival)} no tiene jugadas y pasa.`;
        } else {
            const c = contarReversi(tablero);
            updates.fase = 'terminado';
            updates.ganador = c.nico === c.carito ? 'empate' : (c.nico > c.carito ? 'nico' : 'carito');
            if (updates.ganador !== 'empate') {
                const v = { ...(estado.victorias || { nico: 0, carito: 0 }) };
                v[updates.ganador] = (v[updates.ganador] || 0) + 1;
                updates.victorias = v;
            }
        }
        return updates;
    });
    if (!res) {
        vibrarJ([10, 30, 10]);
        return;
    }
    vibrarJ(12);
    if (window.sfx) window.sfx.rebote();
    if (res.cambios.fase === 'terminado' && res.cambios.ganador !== 'empate' && typeof registrarEvento === 'function') {
        registrarEvento('gano_partida', `${nombreJugador(res.cambios.ganador)} ganó al Reversi`);
    }
}
