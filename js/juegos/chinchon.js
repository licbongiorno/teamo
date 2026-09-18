// ==================== CHINCHÓN ====================
// Mazo español de 40 cartas (como Escoba de 15: sin 8 ni 9). Cada
// uno arranca con 7 cartas; en tu turno robás (del mazo o de la
// mesa) y después descartás o, si tu mano queda armada en grupos
// (mismo número) y escaleras (mismo palo, consecutivas) con a lo
// sumo una carta suelta, podés cerrar la ronda.
const ORDEN_CHINCHON = [1, 2, 3, 4, 5, 6, 7, 10, 11, 12];
const PALOS_CHINCHON = ['espada', 'basto', 'oro', 'copa'];
const EMOJI_PALO_CHINCHON = { espada: '🗡️', basto: '🌳', oro: '🪙', copa: '🏆' };

function crearMazoChinchon(){
    let mazo = [];
    PALOS_CHINCHON.forEach(p => ORDEN_CHINCHON.forEach(n => mazo.push(p + '_' + n)));
    for (let i = mazo.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [mazo[i], mazo[j]] = [mazo[j], mazo[i]];
    }
    return mazo;
}
function numChinchon(c){ return parseInt(c.split('_')[1]); }
function paloChinchon(c){ return c.split('_')[0]; }
function ordenChinchon(c){ return ORDEN_CHINCHON.indexOf(numChinchon(c)); }
function valorChinchon(c){ const n = numChinchon(c); return n <= 7 ? n : 10; }
function nombreNumChinchon(n){ return { 1: 'As', 10: 'Sota', 11: 'Caballo', 12: 'Rey' }[n] || String(n); }

function refChinchon(){ return window.doc(window.db, 'juegos', 'chinchon'); }

// Encuentra todos los grupos/escaleras posibles dentro de una mano.
function candidatosMelds(cartas){
    const candidatos = [];
    const porNumero = {};
    cartas.forEach(c => { const n = numChinchon(c); (porNumero[n] = porNumero[n] || []).push(c); });
    Object.values(porNumero).forEach(grupo => {
        if (grupo.length === 3) candidatos.push(grupo);
        else if (grupo.length === 4) {
            candidatos.push(grupo);
            for (let omit = 0; omit < 4; omit++) candidatos.push(grupo.filter((_, i) => i !== omit));
        }
    });
    const porPalo = {};
    cartas.forEach(c => { const p = paloChinchon(c); (porPalo[p] = porPalo[p] || []).push(c); });
    Object.values(porPalo).forEach(mismos => {
        const ordenados = [...mismos].sort((a, b) => ordenChinchon(a) - ordenChinchon(b));
        for (let i = 0; i < ordenados.length; i++) {
            for (let j = i + 2; j < ordenados.length; j++) {
                const tramo = ordenados.slice(i, j + 1);
                let consecutivo = true;
                for (let k = 1; k < tramo.length; k++) {
                    if (ordenChinchon(tramo[k]) !== ordenChinchon(tramo[k - 1]) + 1) { consecutivo = false; break; }
                }
                if (consecutivo) candidatos.push(tramo);
            }
        }
    });
    return candidatos;
}

// Mejor forma de agrupar una mano: la combinación de melds que deja
// menos puntos sueltos (deadwood). Con 7-8 cartas y pocos candidatos,
// la búsqueda exhaustiva es instantánea.
function mejorParticion(cartas){
    const candidatos = candidatosMelds(cartas);
    let mejor = { melds: [], sueltas: cartas, deadwood: cartas.reduce((t, c) => t + valorChinchon(c), 0) };
    function backtrack(restantes, elegidos){
        const deadwoodActual = restantes.reduce((t, c) => t + valorChinchon(c), 0);
        if (deadwoodActual < mejor.deadwood) mejor = { melds: [...elegidos], sueltas: restantes, deadwood: deadwoodActual };
        for (const m of candidatos) {
            if (m.every(c => restantes.includes(c))) {
                backtrack(restantes.filter(c => !m.includes(c)), [...elegidos, m]);
            }
        }
    }
    backtrack(cartas, []);
    return mejor;
}

let _chinchonFaseAnterior = null;
function iniciarChinchon(){
    _chinchonFaseAnterior = null;
    _seleccionManoChinchon = null;
    if (window._unsubChinchon) window._unsubChinchon();
    window._unsubChinchon = window.onSnapshot(refChinchon(), (snap) => {
        const datos = snap.exists() ? snap.data() : null;
        if (datos && datos.fase === 'revelado' && _chinchonFaseAnterior === 'jugando' && window.sfx) {
            const r = datos.resultado;
            if (!r.ganador) window.sfx.empate();
            else window.sfx[r.ganador === miIdentidad ? 'victoria' : 'derrota']();
            if (r.chinchonPerfecto && r.ganador === miIdentidad && window.fx) window.fx.confeti();
        }
        _chinchonFaseAnterior = datos ? datos.fase : null;
        renderChinchon(datos);
    }, (err) => {
        console.error('Error de Firestore en chinchón:', err);
        const cont = document.getElementById('contenido-chinchon');
        if (cont) cont.innerHTML = `<div class="panel texto-centro texto-tenue">⚠️ No se pudo conectar (${err.code || 'error'}).</div>`;
    });
}

async function leerChinchonActual(){
    return await new Promise(res => { const u = window.onSnapshot(refChinchon(), s => { u(); res(s.exists() ? s.data() : null); }); });
}

function repartirChinchon(puntajesPrevios){
    const mazo = crearMazoChinchon();
    const manoNico = mazo.splice(0, 7);
    const manoCarito = mazo.splice(0, 7);
    const descarte = [mazo.shift()];
    const turnoInicial = Math.random() < 0.5 ? 'nico' : 'carito';
    return {
        fase: 'jugando', mazo, descarte, manoNico, manoCarito, turno: turnoInicial, yaRobo: false,
        puntajes: puntajesPrevios || { nico: 0, carito: 0 }, resultado: null,
        historial: [`Reparto nuevo. Empieza ${nombreJugador(turnoInicial)}.`]
    };
}

async function marcarListoChinchon(){
    vibrarJ(12);
    if (window.sfx) window.sfx.click();
    const ref = refChinchon();
    await window.runTransaction(window.db, async (tx) => {
        const snap = await tx.get(ref);
        const estado = snap.exists() ? snap.data() : null;
        if (estado?.listos?.[miIdentidad] && estado.fase === 'esperando') return;
        const listos = { ...(estado?.listos || {}), [miIdentidad]: true };
        if (listos.nico && listos.carito) {
            tx.set(ref, { ...repartirChinchon(estado?.puntajes), listos });
        } else {
            tx.set(ref, { fase: 'esperando', listos, puntajes: estado?.puntajes || { nico: 0, carito: 0 } }, { merge: true });
        }
    });
}

function pushLogChinchon(estado, mensaje){ return [...(estado?.historial || []), mensaje].slice(-6); }

let _seleccionManoChinchon = null;

function renderChinchon(estado){
    const cont = document.getElementById('contenido-chinchon');
    if (!cont) return;

    if (!estado || estado.fase === 'esperando') {
        const listoYo = estado?.listos?.[miIdentidad];
        const listoRival = estado?.listos?.[miRival];
        const p = estado?.puntajes || { nico: 0, carito: 0 };
        cont.innerHTML = `
            <div class="panel texto-centro">
                <p class="texto-tenue">Armá grupos (mismo número) y escaleras (mismo palo, consecutivas). Cerrá cuando te quede a lo sumo una carta suelta.</p>
                ${(p.nico || p.carito) ? `<div class="texto-tenue" style="margin-bottom:8px;">Puntaje — Nico: ${p.nico || 0} · Carito: ${p.carito || 0}</div>` : ''}
                <div class="texto-tenue" style="margin-bottom:10px;">
                    ${nombreJugador(miIdentidad)}: ${listoYo ? '✅ listo/a' : '⏳ esperando'}<br>
                    ${nombreJugador(miRival)}: ${listoRival ? '✅ listo/a' : '⏳ esperando'}
                </div>
                <button class="btn-principal" ${listoYo ? 'disabled style="opacity:0.5;"' : ''} onclick="marcarListoChinchon()">${listoYo ? 'Esperando al otro…' : '¡Estoy listo/a! 🃑'}</button>
            </div>`;
        return;
    }

    if (estado.fase === 'revelado') {
        const r = estado.resultado;
        cont.innerHTML = `
            <div class="panel texto-centro logro-animado">
                <div style="font-size:1.2rem; margin-bottom:8px;">
                    ${r.chinchonPerfecto ? `🎉 ¡Chinchón de ${nombreJugador(r.ganador)}!` : r.ganador ? `🏆 Cierra ${nombreJugador(r.ganador)}` : '🤝 Empate'}
                </div>
                <div class="texto-tenue">Nico: ${r.deadwoodNico} puntos sueltos · Carito: ${r.deadwoodCarito} puntos sueltos</div>
                <div class="texto-tenue" style="margin-top:6px;">Puntaje total — Nico: ${estado.puntajes.nico} · Carito: ${estado.puntajes.carito}</div>
                <button class="btn-principal" style="margin-top:14px;" onclick="marcarListoChinchon()">🔁 Repartir de nuevo</button>
            </div>`;
        return;
    }

    const miMano = estado[`mano${miIdentidad === 'nico' ? 'Nico' : 'Carito'}`] || [];
    const manoRival = estado[`mano${miIdentidad === 'nico' ? 'Carito' : 'Nico'}`] || [];
    const top = estado.descarte[estado.descarte.length - 1];
    const esMiTurno = estado.turno === miIdentidad;
    const debeRobar = esMiTurno && !estado.yaRobo;
    const debeDescartar = esMiTurno && estado.yaRobo;

    let puedeCerrar = false, previewDeadwood = null;
    if (debeDescartar && _seleccionManoChinchon != null) {
        const restantes = miMano.filter((_, i) => i !== _seleccionManoChinchon);
        const mejor = mejorParticion(restantes);
        previewDeadwood = mejor.deadwood;
        puedeCerrar = mejor.sueltas.length <= 1;
    }

    let html = `<div class="panel">
        <div style="display:flex; justify-content:space-between; font-size:0.85rem;">
            <span>${nombreJugador(miRival)}: ${manoRival.length} cartas</span>
            <span>Mazo: ${(estado.mazo || []).length}</span>
        </div>
        <div class="info-turno-tablero">${!esMiTurno ? `Turno de ${nombreJugador(estado.turno)}…` : debeRobar ? '🎯 Tu turno: robá una carta' : '🎯 Elegí una carta para descartar (o cerrar)'}</div>
    </div>`;

    html += `<div class="panel texto-centro">
        <div class="texto-tenue" style="margin-bottom:6px;">Mesa</div>
        <div style="display:flex; gap:14px; justify-content:center; align-items:center;">
            <div class="naipe-chinchon dorso" style="${debeRobar ? 'cursor:pointer;' : 'opacity:0.55;'}" ${debeRobar ? `onclick="robarChinchon('mazo')"` : ''}>🂠</div>
            <div class="naipe-chinchon ${debeRobar ? '' : 'deshabilitada'}" style="${debeRobar ? 'cursor:pointer;' : 'opacity:0.55;'}" ${debeRobar ? `onclick="robarChinchon('descarte')"` : ''}>
                <span class="nc-palo">${EMOJI_PALO_CHINCHON[paloChinchon(top)]}</span>${nombreNumChinchon(numChinchon(top))}
            </div>
        </div>
    </div>`;

    html += `<div class="panel">
        <div class="texto-tenue" style="margin-bottom:8px;">Tu mano ${previewDeadwood != null ? `(sueltas si descartás esta: ${previewDeadwood} pts)` : ''}</div>
        <div class="fila-cartas-chinchon">
            ${miMano.map((c, i) => `<div class="naipe-chinchon ${_seleccionManoChinchon === i ? 'seleccionada' : ''}" onclick="seleccionarCartaChinchon(${i})">
                <span class="nc-palo">${EMOJI_PALO_CHINCHON[paloChinchon(c)]}</span>${nombreNumChinchon(numChinchon(c))}
            </div>`).join('')}
        </div>
        ${debeDescartar ? `<div class="btn-fila" style="margin-top:12px;">
            <button class="btn-secundario" ${_seleccionManoChinchon != null ? '' : 'style="opacity:0.4;" disabled'} onclick="descartarChinchon()">Descartar</button>
            <button class="btn-principal" ${puedeCerrar ? '' : 'style="opacity:0.4;" disabled'} onclick="cerrarChinchon()">🔒 Cerrar</button>
        </div>` : ''}
    </div>`;

    if (estado.historial && estado.historial.length) {
        html += `<div class="panel texto-tenue" style="font-size:0.72rem; line-height:1.6;">${estado.historial.slice(-4).map(h => '• ' + h).join('<br>')}</div>`;
    }

    cont.innerHTML = html;
}

function seleccionarCartaChinchon(i){
    _seleccionManoChinchon = (_seleccionManoChinchon === i) ? null : i;
    vibrarJ(8);
    if (window.sfx) window.sfx.toque();
    refrescarVistaChinchon();
}
async function refrescarVistaChinchon(){
    const snap = await new Promise(res => { const u = window.onSnapshot(refChinchon(), s => { u(); res(s); }); });
    if (snap.exists()) renderChinchon(snap.data());
}

function robarUnaCartaChinchon(mazo, descarte){
    let m = [...mazo], d = [...descarte];
    if (m.length === 0) {
        const top = d.pop();
        m = d.sort(() => Math.random() - 0.5);
        d = [top];
    }
    const carta = m.shift();
    return { carta, mazo: m, descarte: d };
}

async function robarChinchon(origen){
    const estado = await leerChinchonActual();
    if (!estado || estado.fase !== 'jugando' || estado.turno !== miIdentidad || estado.yaRobo) return;
    vibrarJ(10);
    if (window.sfx) window.sfx.cartaFlip();
    const campoMano = miIdentidad === 'nico' ? 'manoNico' : 'manoCarito';
    let carta, mazo = [...estado.mazo], descarte = [...estado.descarte];
    if (origen === 'descarte') {
        if (!descarte.length) return;
        carta = descarte.pop();
    } else {
        const r = robarUnaCartaChinchon(mazo, descarte);
        carta = r.carta; mazo = r.mazo; descarte = r.descarte;
    }
    const mano = [...estado[campoMano], carta];
    await window.updateDoc(refChinchon(), {
        [campoMano]: mano, mazo, descarte, yaRobo: true,
        historial: pushLogChinchon(estado, `${nombreJugador(miIdentidad)} robó ${origen === 'descarte' ? 'de la mesa' : 'del mazo'}.`)
    });
}

async function descartarChinchon(){
    if (_seleccionManoChinchon == null) return;
    const estado = await leerChinchonActual();
    if (!estado || estado.fase !== 'jugando' || estado.turno !== miIdentidad || !estado.yaRobo) return;
    const campoMano = miIdentidad === 'nico' ? 'manoNico' : 'manoCarito';
    const mano = [...estado[campoMano]];
    const carta = mano.splice(_seleccionManoChinchon, 1)[0];
    _seleccionManoChinchon = null;
    vibrarJ(12);
    if (window.sfx) window.sfx.swoosh();
    await window.updateDoc(refChinchon(), {
        [campoMano]: mano, descarte: [...estado.descarte, carta],
        turno: miRival, yaRobo: false,
        historial: pushLogChinchon(estado, `${nombreJugador(miIdentidad)} descartó.`)
    });
}

async function cerrarChinchon(){
    if (_seleccionManoChinchon == null) return;
    const estado = await leerChinchonActual();
    if (!estado || estado.fase !== 'jugando' || estado.turno !== miIdentidad || !estado.yaRobo) return;
    const campoMano = miIdentidad === 'nico' ? 'manoNico' : 'manoCarito';
    const mano = [...estado[campoMano]];
    const descartada = mano[_seleccionManoChinchon];
    const restantes = mano.filter((_, i) => i !== _seleccionManoChinchon);
    const mejorMia = mejorParticion(restantes);
    if (mejorMia.sueltas.length > 1) return; // no cumple la condición de cierre

    const campoManoRival = miIdentidad === 'nico' ? 'manoCarito' : 'manoNico';
    const mejorRival = mejorParticion(estado[campoManoRival]);
    const deadwoodMio = mejorMia.deadwood;
    const deadwoodRival = mejorRival.deadwood;
    const chinchonPerfecto = mejorMia.sueltas.length === 0;
    const gano = deadwoodMio <= deadwoodRival;
    const empate = deadwoodMio === deadwoodRival && !chinchonPerfecto;

    const puntajes = { ...estado.puntajes };
    if (!empate) puntajes[gano ? miIdentidad : miRival] = (puntajes[gano ? miIdentidad : miRival] || 0) + (chinchonPerfecto ? 3 : 1);

    vibrarJ([15, 30, 15]);
    if (window.sfx) window.sfx.acierto();

    const deadwoodNico = miIdentidad === 'nico' ? deadwoodMio : deadwoodRival;
    const deadwoodCarito = miIdentidad === 'carito' ? deadwoodMio : deadwoodRival;

    await window.updateDoc(refChinchon(), {
        [campoMano]: restantes, descarte: [...estado.descarte, descartada],
        fase: 'revelado', puntajes,
        resultado: {
            ganador: empate ? null : (gano ? miIdentidad : miRival),
            chinchonPerfecto, deadwoodNico, deadwoodCarito
        },
        historial: pushLogChinchon(estado, `${nombreJugador(miIdentidad)} cerró la ronda.`)
    });
    _seleccionManoChinchon = null;
    if (typeof registrarEvento === 'function') {
        registrarEvento('cuidado_compartido', `Jugaron una ronda de Chinchón`);
    }
}
