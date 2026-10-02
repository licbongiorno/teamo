// ==================== PUNTOS Y CAJITAS ====================
// Grilla de 5x5 cajitas (6x6 puntos). Por turno se traza una línea
// entre dos puntos vecinos. Quien cierra el 4º lado de una cajita se la
// queda y vuelve a jugar. Cuando no quedan líneas, gana quien tenga más
// cajitas.
// Líneas: 'h-f-c' (horizontal, fila f de puntos 0..5, columna c 0..4)
// y 'v-f-c' (vertical, fila f 0..4, columna c de puntos 0..5).
// Cajitas: 'f-c' (0..4, 0..4).
// Las jugadas van por jugadaSegura (js/jugada-segura.js).
const N_CAJITAS = 5;
const TOTAL_LINEAS_CAJITAS = 2 * N_CAJITAS * (N_CAJITAS + 1);

function refCajitas(){ return window.doc(window.db, 'juegos', 'cajitas'); }

// Las cajitas (f,c) que toca una línea.
function cajitasDeLinea(id){
    const [tipo, fs, cs] = id.split('-');
    const f = +fs, c = +cs;
    const res = [];
    if (tipo === 'h') {
        if (f > 0) res.push([f - 1, c]);
        if (f < N_CAJITAS) res.push([f, c]);
    } else {
        if (c > 0) res.push([f, c - 1]);
        if (c < N_CAJITAS) res.push([f, c]);
    }
    return res;
}
function ladosDeCajita(f, c){
    return [`h-${f}-${c}`, `h-${f + 1}-${c}`, `v-${f}-${c}`, `v-${f}-${c + 1}`];
}

let _cajitasFaseAnterior = null;
function iniciarCajitas(){
    if (window._unsubCajitas) window._unsubCajitas();
    _cajitasFaseAnterior = null;
    window._unsubCajitas = window.onSnapshot(refCajitas(), (snap) => {
        const datos = snap.exists() ? snap.data() : null;
        if (datos && datos.fase === 'terminado' && _cajitasFaseAnterior === 'jugando' && window.sfx) {
            if (datos.ganador === 'empate') window.sfx.empate();
            else window.sfx[datos.ganador === miIdentidad ? 'victoria' : 'derrota']();
            if (window.fx && datos.ganador === miIdentidad) window.fx.confeti();
        }
        _cajitasFaseAnterior = datos ? datos.fase : null;
        renderCajitas(datos);
    }, (err) => {
        console.error('Error de Firestore en cajitas:', err);
        document.getElementById('contenido-cajitas').innerHTML = `<div class="panel texto-centro texto-tenue">⚠️ No se pudo conectar (${err.code || 'error'}).</div>`;
    });
}

function renderCajitas(estado){
    const cont = document.getElementById('contenido-cajitas');
    if (!cont) return;
    if (!estado || estado.fase === 'esperando') {
        const listoYo = estado?.listos?.[miIdentidad];
        const listoRival = estado?.listos?.[miRival];
        cont.innerHTML = `<div class="panel texto-centro">
            <p class="texto-tenue">Por turno, trazá una línea entre dos puntos. Si cerrás una cajita, es tuya y volvés a jugar. Gana quien junte más cajitas.</p>
            <div class="texto-tenue" style="margin-bottom:10px;">
                ${nombreJugador(miIdentidad)}: ${listoYo ? '✅ listo/a' : '⏳ esperando'}<br>
                ${nombreJugador(miRival)}: ${listoRival ? '✅ listo/a' : '⏳ esperando'}
            </div>
            <button class="btn-principal" ${listoYo ? 'disabled style="opacity:0.5;"' : ''} onclick="marcarListoCajitas()">${listoYo ? 'Esperando al otro…' : '¡Estoy listo/a! ✏️'}</button>
        </div>`;
        return;
    }

    const lineas = estado.lineas || {};
    const cajas = estado.cajas || {};
    const cuenta = { nico: 0, carito: 0 };
    Object.values(cajas).forEach(j => { cuenta[j] = (cuenta[j] || 0) + 1; });
    const victorias = estado.victorias || { nico: 0, carito: 0 };
    const esMiTurno = estado.fase === 'jugando' && estado.turno === miIdentidad;

    let html = `<div class="texto-tenue texto-centro" style="margin-bottom:6px;">Partidas: Nico ${victorias.nico || 0} — Carito ${victorias.carito || 0}</div>
        <div class="texto-centro" style="margin-bottom:8px;">💙 Nico ${cuenta.nico} &nbsp;—&nbsp; 💖 Carito ${cuenta.carito}</div>`;
    if (estado.fase === 'terminado') {
        html += `<div class="panel texto-centro">
            <div style="font-size:1.2rem; margin-bottom:10px;">${estado.ganador === 'empate' ? '🤝 ¡Empate!' : `🏆 ¡Ganó ${nombreJugador(estado.ganador)}!`}</div>
            <button class="btn-principal" onclick="reiniciarCajitas()">🔁 Revancha</button>
        </div>`;
    } else {
        html += `<div class="info-turno-tablero">${esMiTurno ? '🎯 Tu turno' : `Turno de ${nombreJugador(estado.turno)}…`}</div>`;
    }

    // Grilla de (2N+1)x(2N+1): puntos en (par,par), líneas horizontales
    // en (par,impar), verticales en (impar,par) y cajitas en (impar,impar).
    const lado = 2 * N_CAJITAS + 1;
    const columnas = Array.from({ length: lado }, (_, i) => i % 2 === 0 ? '10px' : '1fr').join(' ');
    html += `<div class="grilla-cajitas" style="grid-template-columns:${columnas}; grid-template-rows:${columnas};">`;
    for (let r = 0; r < lado; r++) {
        for (let c = 0; c < lado; c++) {
            const parR = r % 2 === 0, parC = c % 2 === 0;
            if (parR && parC) { html += `<div class="punto-cajitas"></div>`; continue; }
            if (!parR && !parC) {
                const dueño = cajas[`${(r - 1) / 2}-${(c - 1) / 2}`];
                html += `<div class="caja-cajitas ${dueño ? 'caja-' + dueño : ''}">${dueño ? (dueño === 'nico' ? '💙' : '💖') : ''}</div>`;
                continue;
            }
            const id = parR ? `h-${r / 2}-${(c - 1) / 2}` : `v-${(r - 1) / 2}-${c / 2}`;
            const dueño = lineas[id];
            const ultima = estado.ultimaLinea === id ? ' linea-ultima' : '';
            html += `<div class="linea-cajitas ${parR ? 'linea-h' : 'linea-v'} ${dueño ? 'linea-' + dueño : (esMiTurno ? 'linea-libre' : '')}${ultima}" onclick="jugarCajitas('${id}')"></div>`;
        }
    }
    html += `</div>`;
    cont.innerHTML = html;
}

async function marcarListoCajitas(){
    vibrarJ(12);
    const ref = refCajitas();
    await window.runTransaction(window.db, async (tx) => {
        const snap = await tx.get(ref);
        const estado = snap.exists() ? snap.data() : null;
        if (estado?.fase === 'jugando' || estado?.listos?.[miIdentidad]) return;
        const listos = { ...(estado?.listos || {}), [miIdentidad]: true };
        const victorias = estado?.victorias || { nico: 0, carito: 0 };
        if (listos.nico && listos.carito) {
            // Empieza quien perdió la anterior (o Nico la primera vez).
            const empieza = estado?.ultimoGanador === 'nico' ? 'carito' : 'nico';
            tx.set(ref, { fase: 'jugando', listos, lineas: {}, cajas: {}, turno: empieza, ganador: null, ultimaLinea: null, victorias, ultimoGanador: estado?.ultimoGanador || null });
        } else {
            tx.set(ref, { fase: 'esperando', listos, victorias }, { merge: true });
        }
    });
}

async function reiniciarCajitas(){
    vibrarJ(12);
    const ref = refCajitas();
    await window.runTransaction(window.db, async (tx) => {
        const snap = await tx.get(ref);
        const estado = snap.exists() ? snap.data() : null;
        if (estado && estado.fase === 'jugando') return;
        tx.set(ref, { fase: 'esperando', listos: {}, victorias: estado?.victorias || { nico: 0, carito: 0 }, ultimoGanador: estado?.ganador || null });
    });
}

async function jugarCajitas(id){
    const res = await window.jugadaSegura(refCajitas(), (estado) => {
        if (!estado || estado.fase !== 'jugando' || estado.turno !== miIdentidad) return null;
        const lineas = { ...(estado.lineas || {}) };
        if (lineas[id]) return null;
        lineas[id] = miIdentidad;
        const cajas = { ...(estado.cajas || {}) };
        cajitasDeLinea(id).forEach(([f, c]) => {
            if (ladosDeCajita(f, c).every(l => lineas[l])) { cajas[`${f}-${c}`] = miIdentidad; }
        });
        const cerro = Object.keys(cajas).length > Object.keys(estado.cajas || {}).length;
        const updates = { lineas, cajas, ultimaLinea: id, turno: cerro ? miIdentidad : miRival };
        if (Object.keys(lineas).length >= TOTAL_LINEAS_CAJITAS) {
            const cuenta = { nico: 0, carito: 0 };
            Object.values(cajas).forEach(j => { cuenta[j]++; });
            updates.fase = 'terminado';
            updates.ganador = cuenta.nico === cuenta.carito ? 'empate' : (cuenta.nico > cuenta.carito ? 'nico' : 'carito');
            if (updates.ganador !== 'empate') {
                const v = { ...(estado.victorias || { nico: 0, carito: 0 }) };
                v[updates.ganador] = (v[updates.ganador] || 0) + 1;
                updates.victorias = v;
            }
        }
        return updates;
    });
    if (!res) return;
    const cerradas = Object.keys(res.cambios.cajas).length - Object.keys(res.estado.cajas || {}).length;
    vibrarJ(cerradas ? [12, 25, 12] : 10);
    if (window.sfx) window.sfx[cerradas ? 'acierto' : 'toque']();
    if (res.cambios.fase === 'terminado' && res.cambios.ganador !== 'empate' && typeof registrarEvento === 'function') {
        registrarEvento('gano_partida', `${nombreJugador(res.cambios.ganador)} ganó a Puntos y Cajitas`);
        if (typeof registrarVictoria === 'function') registrarVictoria('cajitas', res.cambios.ganador);
    }
}
