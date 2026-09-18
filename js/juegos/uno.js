// ==================== UNO ====================
// Mazo completo de 108 cartas, reglas clásicas simplificadas para
// dos: con sólo dos jugadores, "Reversa" y "Salto" hacen lo mismo
// (el rival pierde el turno y jugás de nuevo). Sin apilar +2/+4 y
// sin el reto de "no podías tener otra" del +4 — como el resto de
// los juegos de mesa de acá, reglas reales pero sin la parte más
// enredada.
const COLORES_UNO = ['rojo', 'amarillo', 'verde', 'azul'];
const HEX_UNO = { rojo: '#e6543f', amarillo: '#e8b93d', verde: '#3fae5c', azul: '#3f7fe6' };

function crearMazoUno(){
    let mazo = [];
    COLORES_UNO.forEach(c => {
        mazo.push(c + '_0');
        for (let n = 1; n <= 9; n++) { mazo.push(c + '_' + n); mazo.push(c + '_' + n); }
        ['salto', 'reversa', '+2'].forEach(s => { mazo.push(c + '_' + s); mazo.push(c + '_' + s); });
    });
    for (let i = 0; i < 4; i++) { mazo.push('comodin'); mazo.push('comodin+4'); }
    for (let i = mazo.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [mazo[i], mazo[j]] = [mazo[j], mazo[i]];
    }
    return mazo;
}
function esComodinUno(c){ return c === 'comodin' || c === 'comodin+4'; }
function colorUno(c){ return esComodinUno(c) ? null : c.split('_')[0]; }
function valorUno(c){ return esComodinUno(c) ? c : c.split('_')[1]; }
function simboloUno(v){ return v === 'salto' ? '🚫' : v === 'reversa' ? '🔄' : v === '+2' ? '+2' : v; }
function nombreCartaUno(c){
    if (c === 'comodin') return '🌈 Comodín';
    if (c === 'comodin+4') return '🌈 +4';
    const v = valorUno(c);
    return simboloUno(v);
}

function refUno(){ return window.doc(window.db, 'juegos', 'uno'); }

let _unoFaseAnterior = null;
function iniciarUno(){
    _unoFaseAnterior = null;
    _comodinPendienteUno = null;
    if (window._unsubUno) window._unsubUno();
    window._unsubUno = window.onSnapshot(refUno(), (snap) => {
        const datos = snap.exists() ? snap.data() : null;
        if (datos && datos.fase === 'terminado' && _unoFaseAnterior === 'jugando' && window.sfx) {
            window.sfx[datos.ganador === miIdentidad ? 'victoria' : 'derrota']();
            if (datos.ganador === miIdentidad && window.fx) window.fx.confeti();
        }
        _unoFaseAnterior = datos ? datos.fase : null;
        renderUno(datos);
    }, (err) => {
        console.error('Error de Firestore en uno:', err);
        const cont = document.getElementById('contenido-uno');
        if (cont) cont.innerHTML = `<div class="panel texto-centro texto-tenue">⚠️ No se pudo conectar (${err.code || 'error'}).</div>`;
    });
}

async function leerUnoActual(){
    return await new Promise(res => { const u = window.onSnapshot(refUno(), s => { u(); res(s.exists() ? s.data() : null); }); });
}

async function marcarListoUno(){
    vibrarJ(12);
    if (window.sfx) window.sfx.click();
    const ref = refUno();
    await window.runTransaction(window.db, async (tx) => {
        const snap = await tx.get(ref);
        const estado = snap.exists() ? snap.data() : null;
        if (estado?.listos?.[miIdentidad] && estado.fase === 'esperando') return;
        const listos = { ...(estado?.listos || {}), [miIdentidad]: true };
        if (listos.nico && listos.carito) {
            const mazo = crearMazoUno();
            const manoNico = mazo.splice(0, 7);
            const manoCarito = mazo.splice(0, 7);
            let primera = mazo.shift();
            while (primera === 'comodin+4') { mazo.push(primera); primera = mazo.shift(); }
            const colorInicial = esComodinUno(primera) ? COLORES_UNO[Math.floor(Math.random() * 4)] : colorUno(primera);
            const turnoInicial = Math.random() < 0.5 ? 'nico' : 'carito';
            tx.set(ref, {
                fase: 'jugando', mazo, descarte: [primera], colorActual: colorInicial,
                manoNico, manoCarito, turno: turnoInicial, ganador: null, listos,
                historial: [`Arranca la partida. Empieza ${nombreJugador(turnoInicial)}.`]
            });
        } else {
            tx.set(ref, { fase: 'esperando', listos }, { merge: true });
        }
    });
}

function pushLogUno(estado, mensaje){ return [...(estado?.historial || []), mensaje].slice(-6); }

let _comodinPendienteUno = null;

function renderUno(estado){
    const cont = document.getElementById('contenido-uno');
    if (!cont) return;

    if (!estado || estado.fase === 'esperando') {
        const listoYo = estado?.listos?.[miIdentidad];
        const listoRival = estado?.listos?.[miRival];
        cont.innerHTML = `
            <div class="panel texto-centro">
                <p class="texto-tenue">El clásico de las cartas de colores, de a dos. Primero en quedarse sin cartas gana.</p>
                <div class="texto-tenue" style="margin-bottom:10px;">
                    ${nombreJugador(miIdentidad)}: ${listoYo ? '✅ listo/a' : '⏳ esperando'}<br>
                    ${nombreJugador(miRival)}: ${listoRival ? '✅ listo/a' : '⏳ esperando'}
                </div>
                <button class="btn-principal" ${listoYo ? 'disabled style="opacity:0.5;"' : ''} onclick="marcarListoUno()">${listoYo ? 'Esperando al otro…' : '¡Estoy listo/a! 🎴'}</button>
            </div>`;
        return;
    }

    if (estado.fase === 'terminado') {
        cont.innerHTML = `
            <div class="panel texto-centro logro-animado">
                <div style="font-size:1.3rem; margin-bottom:10px;">${estado.ganador === miIdentidad ? '🏆 ¡Ganaste!' : `🏆 ¡Ganó ${nombreJugador(estado.ganador)}!`}</div>
                <button class="btn-principal" onclick="revanchaUno()">🔁 Jugar de nuevo</button>
            </div>`;
        return;
    }

    const miMano = estado[`mano${miIdentidad === 'nico' ? 'Nico' : 'Carito'}`] || [];
    const manoRival = estado[`mano${miIdentidad === 'nico' ? 'Carito' : 'Nico'}`] || [];
    const top = estado.descarte[estado.descarte.length - 1];
    const esMiTurno = estado.turno === miIdentidad;

    let html = `<div class="panel">
        <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.85rem;">
            <span>${nombreJugador(miRival)}: ${manoRival.length} carta${manoRival.length === 1 ? '' : 's'}</span>
            <span>Mazo: ${(estado.mazo || []).length}</span>
        </div>
        <div class="info-turno-tablero">${esMiTurno ? '🎯 Tu turno' : `Turno de ${nombreJugador(estado.turno)}…`}</div>
    </div>`;

    html += `<div class="panel texto-centro">
        <div class="texto-tenue" style="margin-bottom:8px;">Última carta</div>
        <div style="display:flex; justify-content:center;">
            <div class="naipe-uno ${colorUno(top) || estado.colorActual}">${nombreCartaUno(top)}</div>
        </div>
        <div class="texto-tenue" style="margin-top:8px;">Color actual: <b style="color:${HEX_UNO[estado.colorActual]};">${estado.colorActual}</b></div>
    </div>`;

    if (_comodinPendienteUno && esMiTurno) {
        html += `<div class="panel texto-centro">
            <div class="texto-tenue" style="margin-bottom:8px;">Elegí un color:</div>
            <div style="display:flex; gap:8px; justify-content:center;">
                ${COLORES_UNO.map(c => `<button class="naipe-uno ${c}" style="width:44px; height:60px; cursor:pointer;" onclick="elegirColorUno('${c}')"></button>`).join('')}
            </div>
        </div>`;
    } else {
        html += `<div class="panel">
            <div class="texto-tenue" style="margin-bottom:8px;">Tu mano:</div>
            <div class="fila-cartas-uno">
                ${miMano.map((c, i) => `<div class="naipe-uno ${colorUno(c) || 'comodin'} ${esMiTurno ? '' : 'deshabilitada'}" onclick="jugarCartaUno(${i})">${nombreCartaUno(c)}</div>`).join('')}
            </div>
            <div class="btn-fila" style="margin-top:12px;">
                <button class="btn-secundario" ${esMiTurno ? '' : 'style="opacity:0.4;" disabled'} onclick="robarCartaUno()">Robar carta 🂠</button>
            </div>
        </div>`;
    }

    if (miMano.length === 2 && esMiTurno) {
        html += `<div class="panel texto-centro"><button class="btn-secundario" onclick="decirUnoGrito()">📣 ¡UNO!</button></div>`;
    }

    if (estado.historial && estado.historial.length) {
        html += `<div class="panel texto-tenue" style="font-size:0.72rem; line-height:1.6;">${estado.historial.slice(-4).map(h => '• ' + h).join('<br>')}</div>`;
    }

    cont.innerHTML = html;
}

function decirUnoGrito(){
    vibrarJ([10, 20, 10]);
    if (window.sfx) window.sfx.pop();
}

function robarUnaCartaUno(estado){
    let mazo = [...estado.mazo];
    let descarte = [...estado.descarte];
    if (mazo.length === 0) {
        const top = descarte.pop();
        mazo = descarte.sort(() => Math.random() - 0.5);
        descarte = [top];
    }
    const carta = mazo.shift();
    return { carta, mazo, descarte };
}

async function robarCartaUno(){
    const estado = await leerUnoActual();
    if (!estado || estado.fase !== 'jugando' || estado.turno !== miIdentidad) return;
    vibrarJ(10);
    if (window.sfx) window.sfx.cartaFlip();
    const { carta, mazo, descarte } = robarUnaCartaUno(estado);
    const campoMano = miIdentidad === 'nico' ? 'manoNico' : 'manoCarito';
    const mano = [...estado[campoMano], carta];
    await window.updateDoc(refUno(), {
        [campoMano]: mano, mazo, descarte,
        turno: miRival,
        historial: pushLogUno(estado, `${nombreJugador(miIdentidad)} robó una carta.`)
    });
}

async function jugarCartaUno(indice){
    const estado = await leerUnoActual();
    if (!estado || estado.fase !== 'jugando' || estado.turno !== miIdentidad) return;
    if (_comodinPendienteUno) return;
    const campoMano = miIdentidad === 'nico' ? 'manoNico' : 'manoCarito';
    const mano = estado[campoMano];
    const carta = mano[indice];
    if (!carta) return;
    const top = estado.descarte[estado.descarte.length - 1];
    const valorTop = valorUno(top);
    const puedeJugar = esComodinUno(carta) || colorUno(carta) === estado.colorActual || valorUno(carta) === valorTop;
    if (!puedeJugar) { vibrarJ([10, 30, 10]); if (window.sfx) window.sfx.error(); return; }

    if (esComodinUno(carta)) {
        _comodinPendienteUno = { indice };
        renderUno(estado);
        return;
    }
    await confirmarJugadaUno(estado, indice, colorUno(carta));
}

async function elegirColorUno(color){
    if (!_comodinPendienteUno) return;
    const estado = await leerUnoActual();
    const indice = _comodinPendienteUno.indice;
    _comodinPendienteUno = null;
    await confirmarJugadaUno(estado, indice, color);
}

async function confirmarJugadaUno(estado, indice, colorNuevo){
    const campoMano = miIdentidad === 'nico' ? 'manoNico' : 'manoCarito';
    const mano = [...estado[campoMano]];
    const carta = mano.splice(indice, 1)[0];
    const v = valorUno(carta);
    let mazo = [...estado.mazo];
    let descarteFinal = [...estado.descarte, carta];
    let turnoSiguiente = miRival;
    let mensaje = `${nombreJugador(miIdentidad)} jugó ${nombreCartaUno(carta)}.`;
    let sonido = 'cartaFlip';

    if (v === 'salto' || v === 'reversa') {
        turnoSiguiente = miIdentidad; // con 2 jugadores, ambos efectos vuelven el turno a quien jugó
        mensaje += v === 'salto' ? ' Turno salteado.' : ' Reversa.';
        sonido = 'swoosh';
    } else if (v === '+2' || carta === 'comodin+4') {
        const cuantas = v === '+2' ? 2 : 4;
        const campoManoRival = miIdentidad === 'nico' ? 'manoCarito' : 'manoNico';
        let manoRival = [...estado[campoManoRival]];
        for (let i = 0; i < cuantas; i++) {
            const r = robarUnaCartaUno({ mazo, descarte: descarteFinal });
            manoRival.push(r.carta); mazo = r.mazo; descarteFinal = r.descarte;
        }
        turnoSiguiente = miIdentidad;
        mensaje += ` ${nombreJugador(miRival)} roba ${cuantas}.`;
        sonido = 'explosion';
        await window.updateDoc(refUno(), { [campoManoRival]: manoRival });
    }

    vibrarJ(12);
    if (window.sfx) window.sfx[sonido]();

    const gano = mano.length === 0;
    const updates = {
        [campoMano]: mano, mazo, descarte: descarteFinal,
        colorActual: colorNuevo, turno: gano ? estado.turno : turnoSiguiente,
        historial: pushLogUno(estado, mensaje)
    };
    if (gano) { updates.fase = 'terminado'; updates.ganador = miIdentidad; }
    await window.updateDoc(refUno(), updates);
    if (gano && typeof registrarEvento === 'function') {
        registrarEvento('gano_partida', `${nombreJugador(miIdentidad)} ganó al UNO`);
    }
}

async function revanchaUno(){
    vibrarJ(12);
    await window.setDoc(refUno(), { fase: 'esperando', listos: {} });
}
