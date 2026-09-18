// ==================== MASCOTA VIRTUAL (Chokurei) ====================
// Tamagotchi completo: 4 necesidades que decaen con el tiempo real,
// comida variada, nivel/XP con etapas de vida (bebé → joven → adulto),
// estados de ánimo (incluida la tristeza sostenida), enfermedad
// derivada del abandono prolongado, cumpleaños anual y una fiesta que
// se puede tirar cuando quieran. Todo cooperativo: los dos cuidan a la
// misma mascota, no hay "mi Chokurei" vs "tu Chokurei".
const DECAY_HAMBRE = 5;    // % por hora real
const DECAY_DIVERSION = 4;
const DECAY_CARINO = 3;
const DECAY_HIGIENE = 2;
const HORAS_PARA_ENFERMAR = 10; // horas seguidas con una necesidad en 0

const COMIDAS_CHOKUREI = [
    { id: 'pescado', nombre: 'Pescado', emoji: '🐟', costo: 0, efectos: { hambre: 35 } },
    { id: 'torta',   nombre: 'Torta',   emoji: '🍰', costo: 5, efectos: { hambre: 40, diversion: 20, higiene: -10 } },
    { id: 'salmon',  nombre: 'Salmón premium', emoji: '🍣', costo: 8, efectos: { hambre: 50, carino: 10 } },
];

const ETAPAS_CHOKUREI = [
    { nivelDesde: 1, id: 'bebe',   nombre: 'bebé',   emoji: '🐱' },
    { nivelDesde: 3, id: 'joven',  nombre: 'joven',  emoji: '🐈' },
    { nivelDesde: 6, id: 'adulto', nombre: 'adulto', emoji: '🐈‍⬛' },
];
const ACCESORIOS_CHOKUREI = [
    { nivelDesde: 9, emoji: '🕶️' },
    { nivelDesde: 6, emoji: '👑' },
    { nivelDesde: 3, emoji: '🎀' },
];

function refMascota(){ return window.doc(window.db, 'juegos', 'mascota'); }

function iniciarMascota(){
    _regaloEvaluadoEstaVisita = false;
    if (window._unsubMascota) window._unsubMascota();
    window._unsubMascota = window.onSnapshot(refMascota(), (snap) => {
        renderMascota(snap.exists() ? snap.data() : {});
    }, (err) => {
        console.error('Error de Firestore en mascota:', err);
        document.getElementById('contenido-mascota').innerHTML = `<div class="panel texto-centro texto-tenue">⚠️ No se pudo conectar (${err.code || 'error'}).</div>`;
    });
    if (window._unsubPuntosMascota) window._unsubPuntosMascota();
    window._unsubPuntosMascota = window.escucharPuntos((p) => { window._puntosMascota = p; });
}

function valorConDecaimiento(valorGuardado, actualizadoEn, decayPorHora){
    if (valorGuardado == null) return 100;
    const horas = (Date.now() - (actualizadoEn || Date.now())) / 3600000;
    return Math.max(0, Math.round(valorGuardado - horas * decayPorHora));
}

// Hace cuánto que una necesidad está clavada en 0 (para la enfermedad).
// Se calcula del todo en el cliente, sin guardar nada extra: se
// reconstruye el momento exacto en el que el valor cruzó el cero a
// partir del último valor guardado y su velocidad de caída.
function horasEnCero(valorGuardado, actualizadoEn, decayPorHora){
    if (valorGuardado == null || !actualizadoEn) return 0;
    const horasHastaCero = valorGuardado / decayPorHora;
    const momentoCero = actualizadoEn + horasHastaCero * 3600000;
    return Math.max(0, (Date.now() - momentoCero) / 3600000);
}

function haceCuanto(ms){
    if (!ms) return '';
    const minutos = Math.floor((Date.now() - ms) / 60000);
    if (minutos < 1) return 'recién';
    if (minutos < 60) return `hace ${minutos} min`;
    const horas = Math.floor(minutos / 60);
    if (horas < 24) return `hace ${horas} h`;
    const dias = Math.floor(horas / 24);
    return `hace ${dias} día${dias === 1 ? '' : 's'}`;
}

function fechaISO(d){ return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }

function etapaDeNivel(nivel){
    let etapa = ETAPAS_CHOKUREI[0];
    for (const e of ETAPAS_CHOKUREI) if (nivel >= e.nivelDesde) etapa = e;
    return etapa;
}
function accesorioDeNivel(nivel){
    return ACCESORIOS_CHOKUREI.find(a => nivel >= a.nivelDesde) || null;
}

let _regaloEvaluadoEstaVisita = false;

function renderMascota(estado){
    const cont = document.getElementById('contenido-mascota');

    // Primera vez que alguien abre a Chokurei: queda registrado el
    // momento de "nacimiento" para poder festejarle el cumpleaños todos
    // los años, sin que nadie tenga que configurar nada a mano.
    if (!estado.nacioEn) {
        const ahora = Date.now();
        window.setDoc(refMascota(), { nacioEn: ahora }, { merge: true });
        estado = { ...estado, nacioEn: ahora };
    }

    const hambre = valorConDecaimiento(estado.hambre ?? 100, estado.hambreActualizada, DECAY_HAMBRE);
    const diversion = valorConDecaimiento(estado.diversion ?? 100, estado.diversionActualizada, DECAY_DIVERSION);
    const carino = valorConDecaimiento(estado.carino ?? 100, estado.carinoActualizada, DECAY_CARINO);
    const higiene = valorConDecaimiento(estado.higiene ?? 100, estado.higieneActualizada, DECAY_HIGIENE);
    const promedio = (hambre + diversion + carino + higiene) / 4;
    const minimo = Math.min(hambre, diversion, carino, higiene);

    const enferma = [
        horasEnCero(estado.hambre ?? 100, estado.hambreActualizada, DECAY_HAMBRE),
        horasEnCero(estado.diversion ?? 100, estado.diversionActualizada, DECAY_DIVERSION),
        horasEnCero(estado.carino ?? 100, estado.carinoActualizada, DECAY_CARINO),
        horasEnCero(estado.higiene ?? 100, estado.higieneActualizada, DECAY_HIGIENE),
    ].some(h => h >= HORAS_PARA_ENFERMAR);

    const fiestaActiva = estado.fiestaHasta && estado.fiestaHasta > Date.now();

    const xp = estado.xp || 0;
    const nivel = Math.floor(xp / 50) + 1;
    const xpEnNivel = xp % 50;
    const etapa = etapaDeNivel(nivel);
    const accesorio = accesorioDeNivel(nivel);

    let mood = { id: 'contento', emoji: '😺', msg: 'Chokurei está tranquilo.' };
    if (fiestaActiva) mood = { id: 'fiesta', emoji: '🥳', msg: '¡Chokurei está de fiesta!' };
    else if (enferma) mood = { id: 'enferma', emoji: '🤒', msg: 'Chokurei no se siente bien. Necesita medicina 💊.' };
    else if (promedio < 20) mood = { id: 'deprimido', emoji: '😭', msg: 'Chokurei está pasando un momento difícil. Un poco de mimos y juego lo van a ayudar 💜.' };
    else if (minimo < 30 || promedio < 45) mood = { id: 'triste', emoji: '😿', msg: 'Chokurei extraña más atención.' };
    else if (promedio > 88) mood = { id: 'feliz', emoji: '😻', msg: '¡Chokurei está feliz de la vida!' };

    // Cumpleaños: compara sólo mes y día contra "nacioEn", así se
    // repite todos los años sin tener que guardar nada aparte.
    const hoy = new Date();
    const nacimiento = new Date(estado.nacioEn);
    const esCumple = hoy.getMonth() === nacimiento.getMonth() && hoy.getDate() === nacimiento.getDate();
    const yaFestejadoHoy = estado.ultimoCumpleFestejado === fechaISO(hoy);
    const edadDias = Math.floor((Date.now() - estado.nacioEn) / 86400000);
    const edadAnios = Math.floor(edadDias / 365);

    // Regalito aleatorio: se sortea una sola vez por visita (no en cada
    // actualización que llega de Firestore), y como mucho cada 3 horas.
    if (!_regaloEvaluadoEstaVisita) {
        _regaloEvaluadoEstaVisita = true;
        const puedeHaberRegalo = !estado.ultimoRegalo || (Date.now() - estado.ultimoRegalo) > 3 * 3600000;
        window._hayRegaloMascota = puedeHaberRegalo && Math.random() < 0.18;
    }

    const puntos = window._puntosMascota || { nico: 0, carito: 0 };
    const misPuntos = puntos[miIdentidad] || 0;

    let html = '';

    if (esCumple && !yaFestejadoHoy) {
        html += `<div class="chokurei-banner-cumple">
            <div style="font-size:1.8rem;">🎂🎉</div>
            <div style="font-weight:bold; margin:4px 0;">¡Feliz cumpleaños, Chokurei!</div>
            <div class="texto-tenue" style="margin-bottom:10px;">Hoy cumple ${edadAnios >= 1 ? `${edadAnios} año${edadAnios === 1 ? '' : 's'}` : `${edadDias} días`} con nosotros.</div>
            <button class="btn-principal" onclick="festejarCumpleMascota()">Festejar 🎂</button>
        </div>`;
    } else if (window._hayRegaloMascota) {
        html += `<div class="chokurei-banner-regalo" onclick="reclamarRegaloMascota()">
            <div style="font-size:1.6rem;">🎁</div>
            <div>Chokurei te dejó un regalito — tocá para abrirlo</div>
        </div>`;
    }

    const accesorioHtml = accesorio ? `<span class="chokurei-accesorio">${accesorio.emoji}</span>` : '';

    html += `<div class="panel texto-centro">
        <div class="chokurei-nivel">Nivel ${nivel} · Chokurei ${etapa.nombre}</div>
        <div class="chokurei-escena chokurei-${mood.id}" style="position:relative;">${etapa.emoji}${accesorioHtml}</div>
        <div class="texto-tenue" style="margin:4px 0 2px;">${edadDias} día${edadDias === 1 ? '' : 's'} con nosotros</div>
        <div style="margin-bottom:10px; font-size:0.85rem;">${mood.emoji} ${mood.msg}</div>
        <div class="barra-progreso-jardin" title="${xpEnNivel}/50 XP para el próximo nivel"><div class="relleno-progreso-jardin" style="width:${(xpEnNivel / 50) * 100}%;"></div></div>
    </div>`;

    html += `<div class="panel">
        <div class="medidor-jardin">
            <div style="display:flex; justify-content:space-between; font-size:0.75rem; margin-bottom:3px;"><span>🐟 Hambre</span><span>${hambre}%</span></div>
            <div class="barra-medidor"><div class="relleno-medidor relleno-agua" style="width:${hambre}%;"></div></div>
        </div>
        <div class="medidor-jardin">
            <div style="display:flex; justify-content:space-between; font-size:0.75rem; margin-bottom:3px;"><span>🧶 Diversión</span><span>${diversion}%</span></div>
            <div class="barra-medidor"><div class="relleno-medidor relleno-sol" style="width:${diversion}%;"></div></div>
        </div>
        <div class="medidor-jardin">
            <div style="display:flex; justify-content:space-between; font-size:0.75rem; margin-bottom:3px;"><span>🖐️ Cariño</span><span>${carino}%</span></div>
            <div class="barra-medidor"><div class="relleno-medidor" style="width:${carino}%; background:linear-gradient(90deg,var(--rosa),var(--lila));"></div></div>
        </div>
        <div class="medidor-jardin">
            <div style="display:flex; justify-content:space-between; font-size:0.75rem; margin-bottom:3px;"><span>🧼 Higiene</span><span>${higiene}%</span></div>
            <div class="barra-medidor"><div class="relleno-medidor" style="width:${higiene}%; background:linear-gradient(90deg,var(--celeste),var(--verde));"></div></div>
        </div>
    </div>`;

    html += `<div class="btn-fila" style="margin-bottom:10px;">
        <button class="btn-secundario" onclick="darComidaMascota('pescado')">Pescado 🐟</button>
        <button class="btn-secundario" onclick="jugarConMascota()">Jugar 🧶</button>
    </div>
    <div class="btn-fila" style="margin-bottom:10px;">
        <button class="btn-secundario" onclick="mimarMascota()">Mimar 🖐️</button>
        <button class="btn-secundario" onclick="banarMascota()">Bañar 🧼</button>
    </div>`;

    if (enferma) {
        html += `<div class="btn-fila" style="margin-bottom:10px;">
            <button class="btn-principal" onclick="darMedicinaMascota()">Dar medicina 💊</button>
        </div>`;
    }

    html += `<div class="panel">
        <div class="texto-tenue" style="margin-bottom:8px;">🎁 Gustitos (con los puntos compartidos — tenés ${misPuntos})</div>
        <div style="display:flex; flex-wrap:wrap; gap:8px;">
            <button class="btn-secundario" style="width:auto; padding:8px 10px;" onclick="darComidaMascota('torta')">🍰 Torta (5)</button>
            <button class="btn-secundario" style="width:auto; padding:8px 10px;" onclick="darComidaMascota('salmon')">🍣 Salmón (8)</button>
            <button class="btn-secundario" style="width:auto; padding:8px 10px;" onclick="hacerFiestaMascota()">🎉 Fiesta (15)</button>
        </div>
    </div>`;

    const historial = (estado.historial || []).slice(-8).reverse();
    html += `<div class="panel historial-kaizen">
        ${historial.length ? historial.map(h => `${nombreJugador(h.autor)} ${h.detalle} ${haceCuanto(h.timestamp)}`).join('<br>') : 'Todavía nadie cuidó a Chokurei hoy.'}
    </div>`;

    cont.innerHTML = html;
}

// Escritura genérica: aplica efectos a las 4 necesidades (con piso 0 y
// techo 100), suma XP de forma atómica y deja constancia en el
// historial. `efectos` es un objeto parcial, ej. {hambre:35}.
async function _aplicarCuidadoMascota(efectos, detalle, xpGanada){
    const estado = await new Promise(res => { const u = window.onSnapshot(refMascota(), s => { u(); res(s.exists() ? s.data() : {}); }); });
    const ahora = Date.now();
    const actualizaciones = { xp: window.increment(xpGanada) };
    const decays = { hambre: DECAY_HAMBRE, diversion: DECAY_DIVERSION, carino: DECAY_CARINO, higiene: DECAY_HIGIENE };
    for (const campo of Object.keys(decays)) {
        const actual = valorConDecaimiento(estado[campo] ?? 100, estado[campo + 'Actualizada'], decays[campo]);
        const delta = efectos[campo] || 0;
        if (delta !== 0) {
            actualizaciones[campo] = Math.max(0, Math.min(100, actual + delta));
            actualizaciones[campo + 'Actualizada'] = ahora;
        }
    }
    const historial = [...(estado.historial || []), { detalle, autor: miIdentidad, timestamp: ahora }].slice(-15);
    actualizaciones.historial = historial;
    await window.setDoc(refMascota(), actualizaciones, { merge: true });

    const nivelAntes = Math.floor((estado.xp || 0) / 50) + 1;
    const nivelDespues = Math.floor(((estado.xp || 0) + xpGanada) / 50) + 1;
    if (nivelDespues > nivelAntes) {
        vibrarJ([15, 30, 15, 30, 60]);
        if (window.sfx) window.sfx.logro();
        if (window.fx) window.fx.confeti();
        const etapaAntes = etapaDeNivel(nivelAntes), etapaDespues = etapaDeNivel(nivelDespues);
        const detalleNivel = etapaDespues.id !== etapaAntes.id
            ? `¡Chokurei evolucionó a ${etapaDespues.nombre} ${etapaDespues.emoji}! (nivel ${nivelDespues})`
            : `Chokurei subió a nivel ${nivelDespues} 🎉`;
        await window.setDoc(refMascota(), { historial: [...historial, { detalle: detalleNivel, autor: miIdentidad, timestamp: ahora + 1 }].slice(-15) }, { merge: true });
        if (typeof registrarEvento === 'function') registrarEvento('cuidado_compartido', detalleNivel);
    }
}

async function darComidaMascota(comidaId){
    const item = COMIDAS_CHOKUREI.find(c => c.id === comidaId);
    if (!item) return;
    vibrarJ(12);
    if (item.costo > 0) {
        const pagado = await _gastarPuntosMascota(item.costo);
        if (!pagado) { vibrarJ([10, 30, 10]); if (window.sfx) window.sfx.error(); if (window.fx) window.fx.sacudirJuego(); return; }
    }
    if (window.sfx) window.sfx.moneda();
    await _aplicarCuidadoMascota(item.efectos, `le dio ${item.nombre.toLowerCase()} a Chokurei`, 5);
}

async function jugarConMascota(){
    vibrarJ(12);
    if (window.sfx) window.sfx.toque();
    await _aplicarCuidadoMascota({ diversion: 40 }, 'jugó con Chokurei', 5);
}
async function mimarMascota(){
    vibrarJ(12);
    if (window.sfx) window.sfx.toque();
    await _aplicarCuidadoMascota({ carino: 40 }, 'le hizo mimos a Chokurei', 5);
}
async function banarMascota(){
    vibrarJ(12);
    if (window.sfx) window.sfx.toque();
    await _aplicarCuidadoMascota({ higiene: 50 }, 'bañó a Chokurei', 5);
}
async function darMedicinaMascota(){
    vibrarJ([15, 30, 15]);
    if (window.sfx) window.sfx.acierto();
    const estado = await new Promise(res => { const u = window.onSnapshot(refMascota(), s => { u(); res(s.exists() ? s.data() : {}); }); });
    const decays = { hambre: DECAY_HAMBRE, diversion: DECAY_DIVERSION, carino: DECAY_CARINO, higiene: DECAY_HIGIENE };
    const efectos = {};
    for (const campo of Object.keys(decays)) {
        const actual = valorConDecaimiento(estado[campo] ?? 100, estado[campo + 'Actualizada'], decays[campo]);
        if (actual < 60) efectos[campo] = 60 - actual;
    }
    await _aplicarCuidadoMascota(efectos, 'le dio medicina a Chokurei', 8);
}

async function hacerFiestaMascota(){
    vibrarJ(12);
    const pagado = await _gastarPuntosMascota(15);
    if (!pagado) { vibrarJ([10, 30, 10]); if (window.sfx) window.sfx.error(); if (window.fx) window.fx.sacudirJuego(); return; }
    if (window.sfx) window.sfx.logro();
    if (window.fx) window.fx.confeti();
    const estado = await new Promise(res => { const u = window.onSnapshot(refMascota(), s => { u(); res(s.exists() ? s.data() : {}); }); });
    const ahora = Date.now();
    const historial = [...(estado.historial || []), { detalle: 'organizó una fiesta para Chokurei 🎉', autor: miIdentidad, timestamp: ahora }].slice(-15);
    await window.setDoc(refMascota(), {
        hambre: 100, hambreActualizada: ahora,
        diversion: 100, diversionActualizada: ahora,
        carino: 100, carinoActualizada: ahora,
        higiene: 100, higieneActualizada: ahora,
        fiestaHasta: ahora + 2 * 3600000,
        xp: window.increment(10),
        historial
    }, { merge: true });
    if (typeof registrarEvento === 'function') registrarEvento('cuidado_compartido', 'Organizaron una fiesta para Chokurei');
}

async function festejarCumpleMascota(){
    vibrarJ([15, 30, 15]);
    if (window.sfx) window.sfx.logro();
    if (window.fx) window.fx.confeti();
    const hoy = fechaISO(new Date());
    const estado = await new Promise(res => { const u = window.onSnapshot(refMascota(), s => { u(); res(s.exists() ? s.data() : {}); }); });
    const ahora = Date.now();
    const historial = [...(estado.historial || []), { detalle: '¡festejó el cumpleaños de Chokurei! 🎂', autor: miIdentidad, timestamp: ahora }].slice(-15);
    await window.setDoc(refMascota(), { ultimoCumpleFestejado: hoy, xp: window.increment(15), historial }, { merge: true });
    if (window.sumarPuntos) { window.sumarPuntos('nico', 10); window.sumarPuntos('carito', 10); }
    if (typeof registrarEvento === 'function') registrarEvento('cuidado_compartido', 'Festejaron el cumpleaños de Chokurei');
}

async function reclamarRegaloMascota(){
    vibrarJ([10, 20, 10]);
    if (window.sfx) window.sfx.moneda();
    if (window.fx) window.fx.confeti();
    window._hayRegaloMascota = false;
    await window.setDoc(refMascota(), { ultimoRegalo: Date.now() }, { merge: true });
    if (window.sumarPuntos) window.sumarPuntos(miIdentidad, 3);
    renderMascota((await new Promise(res => { const u = window.onSnapshot(refMascota(), s => { u(); res(s.exists() ? s.data() : {}); }); })));
}

// Transacción sobre el pozo de puntos compartido (mismo patrón que "El
// Refugio"): si no alcanza, no descuenta nada y devuelve false.
async function _gastarPuntosMascota(costo){
    const puntosRef = window.doc(window.db, 'juegos', 'puntos-globales');
    const resultado = await window.runTransaction(window.db, async (tx) => {
        const snap = await tx.get(puntosRef);
        const puntos = snap.exists() ? snap.data() : { nico: 0, carito: 0 };
        if ((puntos[miIdentidad] || 0) < costo) return false;
        tx.set(puntosRef, { [miIdentidad]: (puntos[miIdentidad] || 0) - costo }, { merge: true });
        return true;
    });
    return resultado;
}
