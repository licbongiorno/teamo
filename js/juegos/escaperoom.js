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

function iniciarEscapeRoom(){
    if (window._unsubEscapeRoom) window._unsubEscapeRoom();
    window._unsubEscapeRoom = window.onSnapshot(refEscapeRoom(), (snap) => {
        renderEscapeRoom(snap.exists() ? snap.data() : null);
    }, (err) => {
        console.error('Error de Firestore en escape room:', err);
        document.getElementById('contenido-escaperoom').innerHTML = `<div class="panel texto-centro texto-tenue">⚠️ No se pudo conectar (${err.code || 'error'}).</div>`;
    });
}

function renderEscapeRoom(estado){
    const cont = document.getElementById('contenido-escaperoom');

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
}

async function empezarEscapeRoom(){
    vibrarJ(12);
    await window.setDoc(refEscapeRoom(), { etapaActual: 0, intentosFallidos: 0, respuestaEtapa2: null });
}

async function intentarEscapeRoom(){
    const input = document.getElementById('input-respuesta-escaperoom');
    const intento = input.value.trim().toLowerCase().replace(/\s+/g, '');
    if (!intento) return;
    const snap = await new Promise(res => { const u = window.onSnapshot(refEscapeRoom(), s => { u(); res(s); }); });
    const data = snap.data();
    if (!data) return;
    const etapa = ETAPAS_ESCAPEROOM[data.etapaActual];

    let correcta = false;
    if (etapa.libre) {
        // La última etapa se "resuelve" con cualquier respuesta no vacía:
        // lo importante es que se hayan puesto de acuerdo en escribirla.
        correcta = intento.length > 0;
    } else if (etapa.personalizable) {
        // La primera vez que alguien responde esta etapa, esa respuesta
        // queda guardada como la "correcta" (el mes que decidan entre
        // los dos), y de ahí en más hay que repetirla.
        if (!data.respuestaEtapa2) {
            await window.updateDoc(refEscapeRoom(), { respuestaEtapa2: intento });
            correcta = true;
        } else {
            correcta = intento === data.respuestaEtapa2;
        }
    } else {
        correcta = intento === etapa.respuesta;
    }

    input.value = '';
    if (correcta) {
        vibrarJ([15, 30, 15]);
        await window.updateDoc(refEscapeRoom(), { etapaActual: data.etapaActual + 1, intentosFallidos: 0 });
        if (data.etapaActual + 1 >= ETAPAS_ESCAPEROOM.length && typeof registrarEvento === 'function') {
            registrarEvento('cuidado_compartido', `Escaparon juntos del Escape Room Virtual`);
        }
    } else {
        vibrarJ([10, 30, 10]);
        await window.updateDoc(refEscapeRoom(), { intentosFallidos: (data.intentosFallidos || 0) + 1 });
    }
}
