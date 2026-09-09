// ==================== BATALLA NAVAL ====================
const TAM_TABLERO_BN = 6; // 6x6
const CELDAS_FLOTA_BN = 7; // 1 barco de 3 + 2 barcos de 2 = 7 celdas (simplificado: sin trazar formas)

function refBatallaNaval(){ return window.doc(window.db, 'juegos', 'batallanaval'); }

function iniciarBatallaNaval(){
    if (window._unsubBatallaNaval) window._unsubBatallaNaval();
    window._unsubBatallaNaval = window.onSnapshot(refBatallaNaval(), (snap) => {
        renderBatallaNaval(snap.exists() ? snap.data() : null);
    }, (err) => {
        console.error('Error de Firestore en batallanaval:', err);
        document.getElementById('contenido-batallanaval').innerHTML = `<div class="panel texto-centro texto-tenue">⚠️ No se pudo conectar (${err.code || 'error'}).</div>`;
    });
}

let _seleccionFlotaBN = [];

function renderBatallaNaval(estado){
    const cont = document.getElementById('contenido-batallanaval');
    const campoBarcos = miIdentidad === 'nico' ? 'barcosNico' : 'barcosCarito';
    const campoBarcosRival = miIdentidad === 'nico' ? 'barcosCarito' : 'barcosNico';
    const campoDisparos = miIdentidad === 'nico' ? 'disparosNico' : 'disparosCarito';
    const campoDisparosRival = miIdentidad === 'nico' ? 'disparosCarito' : 'disparosNico';

    if (!estado || estado.fase === 'sin_partida') {
        _seleccionFlotaBN = [];
        cont.innerHTML = `<div class="panel texto-centro">
            <p class="texto-tenue">Tablero de ${TAM_TABLERO_BN}x${TAM_TABLERO_BN}. Ubiquen su flota (${CELDAS_FLOTA_BN} celdas) y después ataquen por turnos.</p>
            <button class="btn-principal" onclick="nuevaPartidaBatallaNaval()">Empezar partida</button>
        </div>`;
        return;
    }

    if (estado.fase === 'colocando') {
        const yaListo = estado.listos?.[miIdentidad];
        if (yaListo) {
            cont.innerHTML = `<div class="panel texto-centro texto-tenue">Tu flota está lista. Esperando a ${nombreJugador(miRival)}…</div>`;
            return;
        }
        let html = `<div class="panel texto-centro">
            <p class="texto-tenue">Tocá ${CELDAS_FLOTA_BN} celdas para ubicar tu flota (${_seleccionFlotaBN.length}/${CELDAS_FLOTA_BN}).</p>
        </div>
        <div class="tablero-juego" style="grid-template-columns:repeat(${TAM_TABLERO_BN},1fr); max-width:340px; margin:0 auto 14px;">`;
        for (let i = 0; i < TAM_TABLERO_BN * TAM_TABLERO_BN; i++) {
            const marcado = _seleccionFlotaBN.includes(i);
            html += `<div class="casilla-tablero ${marcado ? 'casilla-seleccionada casilla-oscura' : 'casilla-clara'}" onclick="toggleCeldaFlotaBN(${i})">${marcado ? '🚢' : ''}</div>`;
        }
        html += `</div>
        <button class="btn-principal" ${_seleccionFlotaBN.length === CELDAS_FLOTA_BN ? '' : 'style="opacity:0.4;" disabled'} onclick="confirmarFlotaBN()">Listo ✅</button>`;
        cont.innerHTML = html;
        return;
    }

    if (estado.fase === 'terminado') {
        cont.innerHTML = `<div class="panel texto-centro">
            <div style="font-size:1.2rem; margin-bottom:14px;">🏆 ¡Ganó ${nombreJugador(estado.ganador)}!</div>
            <button class="btn-principal" onclick="nuevaPartidaBatallaNaval()">🔁 Revancha</button>
        </div>`;
        return;
    }

    // fase 'atacando'
    const misDisparos = estado[campoDisparos] || [];
    const barcosRival = estado[campoBarcosRival] || [];
    const disparosRivalAMi = estado[campoDisparosRival] || [];
    const misBarcos = estado[campoBarcos] || [];
    const esMiTurno = estado.turno === miIdentidad;

    let html = `<div class="info-turno-tablero">${esMiTurno ? '🎯 Tu turno: atacá el radar' : `Turno de ${nombreJugador(estado.turno)}…`}</div>`;
    html += `<div class="panel"><div class="texto-tenue" style="margin-bottom:8px;">Radar (ataque):</div>
        <div class="tablero-juego" style="grid-template-columns:repeat(${TAM_TABLERO_BN},1fr); max-width:340px; margin:0 auto;">`;
    for (let i = 0; i < TAM_TABLERO_BN * TAM_TABLERO_BN; i++) {
        let contenido = '';
        if (misDisparos.includes(i)) contenido = barcosRival.includes(i) ? '💥' : '💦';
        html += `<div class="casilla-tablero casilla-clara" onclick="atacarBN(${i})">${contenido}</div>`;
    }
    html += `</div></div>`;

    html += `<div class="panel"><div class="texto-tenue" style="margin-bottom:8px;">Tu flota:</div>
        <div class="tablero-juego" style="grid-template-columns:repeat(${TAM_TABLERO_BN},1fr); max-width:220px; margin:0 auto;">`;
    for (let i = 0; i < TAM_TABLERO_BN * TAM_TABLERO_BN; i++) {
        let contenido = '';
        if (misBarcos.includes(i)) contenido = disparosRivalAMi.includes(i) ? '💥' : '🚢';
        else if (disparosRivalAMi.includes(i)) contenido = '💦';
        html += `<div class="casilla-tablero casilla-oscura" style="font-size:min(4.5vw,20px);">${contenido}</div>`;
    }
    html += `</div></div>`;

    cont.innerHTML = html;
}

function toggleCeldaFlotaBN(i){
    const idx = _seleccionFlotaBN.indexOf(i);
    if (idx !== -1) { _seleccionFlotaBN.splice(idx, 1); }
    else if (_seleccionFlotaBN.length < CELDAS_FLOTA_BN) { _seleccionFlotaBN.push(i); }
    vibrarJ(8);
    refrescarVistaBN();
}
async function refrescarVistaBN(){
    const snap = await new Promise(res => { const u = window.onSnapshot(refBatallaNaval(), s => { u(); res(s); }); });
    if (snap.exists()) renderBatallaNaval(snap.data());
}

async function nuevaPartidaBatallaNaval(){
    vibrarJ(12);
    _seleccionFlotaBN = [];
    await window.setDoc(refBatallaNaval(), {
        fase: 'colocando', listos: {},
        barcosNico: [], barcosCarito: [],
        disparosNico: [], disparosCarito: [],
        turno: 'nico', ganador: null
    });
}

async function confirmarFlotaBN(){
    if (_seleccionFlotaBN.length !== CELDAS_FLOTA_BN) return;
    vibrarJ(12);
    const campoBarcos = miIdentidad === 'nico' ? 'barcosNico' : 'barcosCarito';
    const snap = await new Promise(res => { const u = window.onSnapshot(refBatallaNaval(), s => { u(); res(s); }); });
    const data = snap.data();
    const listos = { ...(data.listos || {}), [miIdentidad]: true };
    const ambosListos = listos.nico && listos.carito;
    await window.updateDoc(refBatallaNaval(), {
        [campoBarcos]: [..._seleccionFlotaBN],
        listos,
        ...(ambosListos ? { fase: 'atacando' } : {})
    });
}

async function atacarBN(i){
    vibrarJ(12);
    const snap = await new Promise(res => { const u = window.onSnapshot(refBatallaNaval(), s => { u(); res(s); }); });
    const data = snap.data();
    if (data.fase !== 'atacando' || data.turno !== miIdentidad) return;
    const campoDisparos = miIdentidad === 'nico' ? 'disparosNico' : 'disparosCarito';
    const campoBarcosRival = miIdentidad === 'nico' ? 'barcosCarito' : 'barcosNico';
    if ((data[campoDisparos] || []).includes(i)) return;

    const disparos = [...(data[campoDisparos] || []), i];
    const barcosRival = data[campoBarcosRival] || [];
    const tocado = barcosRival.includes(i);
    vibrarJ(tocado ? [20, 40, 20] : 10);

    const hundioTodo = tocado && barcosRival.every(idx => disparos.includes(idx));
    let updates = { [campoDisparos]: disparos };
    if (hundioTodo) {
        updates.fase = 'terminado';
        updates.ganador = miIdentidad;
    } else if (!tocado) {
        updates.turno = miIdentidad === 'nico' ? 'carito' : 'nico';
    }
    // si tocó, sigue jugando (turno extra por acierto)
    await window.updateDoc(refBatallaNaval(), updates);
    if (updates.fase === 'terminado' && typeof registrarEvento === 'function') {
        registrarEvento('gano_partida', `${nombreJugador(updates.ganador)} ganó a Batalla Naval`);
    }
}
