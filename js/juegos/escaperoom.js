// ==================== ESCAPE ROOM VIRTUAL ====================
// Versión simplificada y cooperativa: 3 etapas con un acertijo cada
// una. Cualquiera de los dos puede proponer una respuesta; si acierta,
// se desbloquea la siguiente etapa. No hay pistas separadas para cada
// uno (una escape room "de verdad" combinando pistas distintas es
// mucho más compleja) — acá los dos ven el mismo acertijo y lo
// resuelven juntos, a las apuradas o pensando tranquilos.
const ETAPAS_ESCAPEROOM = [
    {
        titulo: 'La puerta de entrada',
        pista: 'Escriban, sin espacios ni tildes, la palabra que resulta de unir: el número de letras de "AMOR" + la primera letra de "NOSOTROS" + la última letra de "JUNTOS".',
        respuesta: '4ns',
    },
    {
        titulo: 'El cofre cerrado',
        pista: 'Piensen en el día que se conocieron (o el día que arrancó todo esto). Escriban el mes en el que fue, en minúsculas (por ejemplo: "marzo").',
        respuesta: null, // se completa dinámicamente la primera vez que se juega
        personalizable: true,
    },
    {
        titulo: 'La última cerradura',
        pista: 'Para salir del todo, escriban juntos (uno lo tipea) una palabra que resuma esta relación en una sola palabra. Cualquier palabra vale — el "acierto" acá es ponerse de acuerdo en cuál escriben.',
        respuesta: null,
        libre: true,
    },
];

function refEscapeRoom(){ return window.doc(window.db, 'juegos', 'escaperoom'); }

let _escapeRoomEtapaAnterior = null;
function iniciarEscapeRoom(){
    _escapeRoomEtapaAnterior = null;
    if (window._unsubEscapeRoom) window._unsubEscapeRoom();
    window._unsubEscapeRoom = window.onSnapshot(refEscapeRoom(), (snap) => {
        const datos = snap.exists() ? snap.data() : null;
        if (datos && window.sfx && _escapeRoomEtapaAnterior !== null && datos.etapaActual > _escapeRoomEtapaAnterior) {
            window.sfx[datos.etapaActual >= ETAPAS_ESCAPEROOM.length ? 'logro' : 'acierto']();
            if (window.fx && (datos.etapaActual >= ETAPAS_ESCAPEROOM.length)) window.fx.confeti();
        }
        _escapeRoomEtapaAnterior = datos ? datos.etapaActual : null;
        renderEscapeRoom(datos);
    }, (err) => {
        console.error('Error de Firestore en escape room:', err);
        document.getElementById('contenido-escaperoom').innerHTML = `<div class="panel texto-centro texto-tenue">⚠️ No se pudo conectar (${err.code || 'error'}).</div>`;
    });
}

function renderEscapeRoom(estado){
    const cont = document.getElementById('contenido-escaperoom');
    // Si llega un cambio del otro (por ejemplo, un intento fallido) en la
    // misma etapa, no se borra lo que uno estaba escribiendo.
    const inputPrevio = document.getElementById('input-respuesta-escaperoom');
    const textoPrevio = inputPrevio && cont.dataset.etapa === String(estado?.etapaActual) ? inputPrevio.value : '';
    const teniaFoco = inputPrevio && document.activeElement === inputPrevio;
    cont.dataset.etapa = String(estado?.etapaActual);

    if (!estado) {
        cont.innerHTML = `<div class="panel texto-centro">
            <p class="texto-tenue">3 etapas para "escapar" juntos. Resuelvan cada acertijo entre los dos — el que lo tipee y mande, no importa.</p>
            <button class="btn-principal" onclick="empezarEscapeRoom()">🔓 Empezar</button>
        </div>`;
        return;
    }

    if (estado.etapaActual >= ETAPAS_ESCAPEROOM.length) {
        cont.innerHTML = `<div class="panel texto-centro logro-animado">
            <div style="font-size:2.4rem;">🎉🔓</div>
            <div style="font-family:var(--fuente-titulo); font-size:1.4rem; margin:8px 0;">¡Escaparon juntos!</div>
            <div class="texto-tenue">Resolvieron las 3 etapas en equipo.</div>
            <button class="btn-secundario" style="margin-top:12px;" onclick="empezarEscapeRoom()">🔁 Jugar otra vez</button>
        </div>`;
        return;
    }

    const etapa = ETAPAS_ESCAPEROOM[estado.etapaActual];
    const intentosFallidos = estado.intentosFallidos || 0;

    let html = `<div class="panel texto-centro">
        <div class="texto-tenue">Etapa ${estado.etapaActual + 1} de ${ETAPAS_ESCAPEROOM.length}</div>
        <div style="font-family:var(--fuente-titulo); font-size:1.3rem; margin:6px 0;">${etapa.titulo}</div>
    </div>
    <div class="panel"><p style="margin:0;">${etapa.pista}</p></div>
    <div class="panel">
        <input type="text" id="input-respuesta-escaperoom" placeholder="Respuesta..." autocomplete="off"
            style="width:100%; padding:12px; border-radius:12px; border:1px solid var(--borde); background:rgba(255,255,255,0.06); color:var(--texto); margin-bottom:10px; text-align:center;"
            onkeydown="if(event.key==='Enter') intentarEscapeRoom()">
        <button class="btn-principal" onclick="intentarEscapeRoom()">Probar</button>
        ${intentosFallidos > 0 ? `<div class="texto-tenue" style="margin-top:8px;">${intentosFallidos} intento${intentosFallidos===1?'':'s'} fallido${intentosFallidos===1?'':'s'} en esta etapa.</div>` : ''}
    </div>`;

    cont.innerHTML = html;
    const input = document.getElementById('input-respuesta-escaperoom');
    if (input && textoPrevio) input.value = textoPrevio;
    if (input && teniaFoco) input.focus();
}

// Sólo arranca (o reinicia) si no hay partida o si ya escaparon: así
// nadie le borra al otro una partida a medias.
async function empezarEscapeRoom(){
    vibrarJ(12);
    const ref = refEscapeRoom();
    await window.runTransaction(window.db, async (tx) => {
        const snap = await tx.get(ref);
        const data = snap.exists() ? snap.data() : null;
        if (data && data.etapaActual < ETAPAS_ESCAPEROOM.length) return;
        tx.set(ref, { etapaActual: 0, intentosFallidos: 0, respuestaEtapa2: null });
    });
}

// El intento se valida contra el estado recién leído, en una
// transacción: antes, si los dos acertaban casi a la vez, cada uno
// sumaba una etapa y se salteaban la siguiente sin verla.
async function intentarEscapeRoom(){
    const input = document.getElementById('input-respuesta-escaperoom');
    const intento = input.value.trim().toLowerCase().replace(/\s+/g, '');
    if (!intento) return;
    const res = await window.jugadaSegura(refEscapeRoom(), (data) => {
        if (!data || data.etapaActual >= ETAPAS_ESCAPEROOM.length) return null;
        const etapa = ETAPAS_ESCAPEROOM[data.etapaActual];
        const cambios = {};
        let correcta = false;
        if (etapa.libre) {
            // La última etapa se "resuelve" con cualquier respuesta no vacía:
            // lo importante es que se hayan puesto de acuerdo en escribirla.
            correcta = true;
        } else if (etapa.personalizable) {
            // La primera vez que alguien responde esta etapa, esa respuesta
            // queda guardada como la "correcta" (el mes que decidan entre
            // los dos), y de ahí en más hay que repetirla.
            if (!data.respuestaEtapa2) {
                cambios.respuestaEtapa2 = intento;
                correcta = true;
            } else {
                correcta = intento === data.respuestaEtapa2;
            }
        } else {
            correcta = intento === etapa.respuesta;
        }
        if (correcta) {
            cambios.etapaActual = data.etapaActual + 1;
            cambios.intentosFallidos = 0;
        } else {
            cambios.intentosFallidos = (data.intentosFallidos || 0) + 1;
        }
        return cambios;
    });
    if (!res) return;
    input.value = '';
    if (res.cambios.etapaActual !== undefined) {
        vibrarJ([15, 30, 15]);
        if (res.cambios.etapaActual >= ETAPAS_ESCAPEROOM.length && typeof registrarEvento === 'function') {
            registrarEvento('cuidado_compartido', `Escaparon juntos del Escape Room Virtual`);
        }
    } else {
        vibrarJ([10, 30, 10]);
        if (window.sfx) window.sfx.error();
        if (window.fx) window.fx.sacudirJuego();
    }
}
