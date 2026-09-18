// ==================== STROOP A DOS ====================
// Aparece el nombre de un color escrito con OTRA tinta ("ROJO" en
// letra azul). Hay que tocar el color de la TINTA, no el que dice la
// palabra. Mismo patrón de ronda determinista + primera respuesta
// correcta gana que Cálculo Mental Rayo.
const META_STROOP = 5;
const COLORES_STROOP = [
    { id: 'rojo', nombre: 'ROJO', hex: '#ff6b6b' },
    { id: 'azul', nombre: 'AZUL', hex: '#6fb8e8' },
    { id: 'verde', nombre: 'VERDE', hex: '#6bcf8e' },
    { id: 'amarillo', nombre: 'AMARILLO', hex: '#f5d95e' },
    { id: 'morado', nombre: 'MORADO', hex: '#c9b6ff' },
];

function refStroop(){ return window.doc(window.db, 'juegos', 'stroop'); }

function problemaStroop(ronda){
    const rng = window.rngRonda(ronda * 104729 + 7);
    const palabra = window.elegirRnd(rng, COLORES_STROOP);
    // La tinta nunca coincide con la palabra — si no, no habría truco.
    let tinta = window.elegirRnd(rng, COLORES_STROOP);
    let vueltas = 0;
    while (tinta.id === palabra.id && vueltas < 10) { tinta = window.elegirRnd(rng, COLORES_STROOP); vueltas++; }
    const opciones = window.barajarRnd(rng, [...COLORES_STROOP]);
    return { palabra, tinta, opciones };
}

let _stroopFaseAnterior = null;
function iniciarStroop(){
    _stroopFaseAnterior = null;
    if (window._unsubStroop) window._unsubStroop();
    window._unsubStroop = window.onSnapshot(refStroop(), (snap) => {
        const datos = snap.exists() ? snap.data() : null;
        if (datos && datos.fase === 'terminado' && _stroopFaseAnterior === 'jugando' && window.sfx) {
            window.sfx[datos.ganador === miIdentidad ? 'victoria' : 'derrota']();
            if (window.fx && datos.ganador === miIdentidad) window.fx.confeti();
        }
        _stroopFaseAnterior = datos ? datos.fase : null;
        renderStroop(datos);
    }, (err) => {
        console.error('Error de Firestore en stroop:', err);
        document.getElementById('contenido-stroop').innerHTML = `<div class="panel texto-centro texto-tenue">⚠️ No se pudo conectar (${err.code || 'error'}).</div>`;
    });
}

let _cuentaRegresivaStroop = null;
function renderStroop(estado){
    const cont = document.getElementById('contenido-stroop');
    if (_cuentaRegresivaStroop) { clearTimeout(_cuentaRegresivaStroop); _cuentaRegresivaStroop = null; }

    if (!estado || estado.fase === 'sin_partida') {
        const v = estado?.victorias || { nico: 0, carito: 0 };
        cont.innerHTML = `<div class="panel texto-centro">
            <p class="texto-tenue">Tocá el color de la TINTA, no el que dice la palabra. A ${META_STROOP} puntos gana la partida.</p>
            <div class="texto-tenue" style="margin:10px 0;">Partidas ganadas — Nico ${v.nico || 0} — Carito ${v.carito || 0}</div>
            <button class="btn-principal" onclick="marcarListoStroop()">Empezar</button>
        </div>`;
        return;
    }

    if (estado.fase === 'esperando') {
        const listoYo = estado.listos?.[miIdentidad];
        const listoRival = estado.listos?.[miRival];
        cont.innerHTML = `<div class="panel texto-centro">
            <div class="texto-tenue" style="margin-bottom:10px;">
                ${nombreJugador(miIdentidad)}: ${listoYo ? '✅ listo/a' : '⏳ esperando'}<br>
                ${nombreJugador(miRival)}: ${listoRival ? '✅ listo/a' : '⏳ esperando'}
            </div>
            <button class="btn-principal" ${listoYo ? 'disabled style="opacity:0.5;"' : ''} onclick="marcarListoStroop()">${listoYo ? 'Esperando al otro…' : '¡Estoy listo/a! 🎨'}</button>
        </div>`;
        if (listoYo && listoRival) iniciarRondaArcadeSiCorresponde(refStroop(), 'stroop', 0, { ronda: 1, puntajes: { nico: 0, carito: 0 }, ganador: null });
        return;
    }

    if (estado.fase === 'terminado') {
        const p = estado.puntajes || { nico: 0, carito: 0 };
        cont.innerHTML = `<div class="panel texto-centro logro-animado">
            <div style="font-size:1.2rem; margin-bottom:8px;">🏆 ¡Ganó ${nombreJugador(estado.ganador)}!</div>
            <div class="texto-tenue">Nico ${p.nico || 0} — Carito ${p.carito || 0}</div>
            <button class="btn-principal" style="margin-top:14px;" onclick="revanchaStroop()">🔁 Revancha</button>
        </div>`;
        return;
    }

    const restante = (estado.horaInicio || Date.now()) - Date.now();
    if (restante > -500) {
        if (!estado.horaInicio) repararRondaArcadeSiCorresponde(refStroop(), 'stroop');
        cont.innerHTML = htmlCuentaRegresivaArcade(restante);
        _cuentaRegresivaStroop = setTimeout(() => renderStroop(estado), msHastaProximoTickArcade(restante));
        return;
    }

    const p = estado.puntajes || { nico: 0, carito: 0 };
    const prob = problemaStroop(estado.ronda || 1);
    cont.innerHTML = `<div class="texto-tenue texto-centro" style="margin-bottom:8px;">Nico ${p.nico || 0} — Carito ${p.carito || 0} · a ${META_STROOP}</div>
    <div class="panel texto-centro">
        <div style="font-family:var(--fuente-titulo); font-weight:bold; font-size:2.6rem; margin:6px 0 16px; color:${prob.tinta.hex};">${prob.palabra.nombre}</div>
        <div style="display:grid; grid-template-columns:repeat(2,1fr); gap:10px;">
            ${prob.opciones.map(c => `<button class="btn-secundario" style="padding:16px 0; background:${c.hex}; color:#1a1220; border:none;" onclick="responderStroop(${estado.ronda || 1}, '${c.id}')">${c.nombre}</button>`).join('')}
        </div>
    </div>`;
}

async function marcarListoStroop(){
    vibrarJ(12);
    // Transacción (en vez de leer con onSnapshot y despues escribir
    // con merge suelto): si los dos tocan "listo" casi al mismo
    // tiempo, una lectura suelta puede no ver todavía la marca del
    // otro y la escritura de uno pisa la del otro, dejando la
    // partida esperando para siempre.
    await window.runTransaction(window.db, async (tx) => {
        const snap = await tx.get(refStroop());
        const estado = snap.exists() ? snap.data() : null;
        if (estado?.fase === 'esperando' && estado?.listos?.[miIdentidad]) return;
        tx.set(refStroop(), {
            fase: 'esperando',
            listos: { ...(estado?.listos || {}), [miIdentidad]: true },
            victorias: estado?.victorias || { nico: 0, carito: 0 }
        }, { merge: true });
    });
}

async function responderStroop(rondaEsperada, colorId){
    const ref = refStroop();
    const resultado = await window.runTransaction(window.db, async (tx) => {
        const snap = await tx.get(ref);
        const data = snap.data();
        if (!data || data.fase !== 'jugando' || (data.ronda || 1) !== rondaEsperada) return { acierto: false };
        const prob = problemaStroop(data.ronda || 1);
        if (colorId !== prob.tinta.id) return { acierto: false };
        const puntajes = { ...(data.puntajes || { nico: 0, carito: 0 }) };
        puntajes[miIdentidad] = (puntajes[miIdentidad] || 0) + 1;
        const gano = puntajes[miIdentidad] >= META_STROOP;
        const updates = { puntajes, ronda: (data.ronda || 1) + 1 };
        if (gano) {
            updates.fase = 'terminado'; updates.ganador = miIdentidad;
            const victorias = { ...(data.victorias || { nico: 0, carito: 0 }) };
            victorias[miIdentidad] = (victorias[miIdentidad] || 0) + 1;
            updates.victorias = victorias;
        }
        tx.update(ref, updates);
        return { acierto: true, gano };
    });
    if (resultado.acierto) {
        vibrarJ(15);
        if (window.sfx) window.sfx.acierto();
        if (resultado.gano && typeof registrarEvento === 'function') {
            registrarEvento('gano_partida', `${nombreJugador(miIdentidad)} ganó Stroop a Dos`);
        }
    } else {
        vibrarJ([10, 30, 10]);
        if (window.sfx) window.sfx.error();
        if (window.fx) window.fx.sacudirJuego();
    }
}

async function revanchaStroop(){
    vibrarJ(10);
    const estado = await new Promise(res => { const u = window.onSnapshot(refStroop(), s => { u(); res(s.exists() ? s.data() : null); }); });
    await window.setDoc(refStroop(), { fase: 'esperando', listos: {}, victorias: estado?.victorias || { nico: 0, carito: 0 } });
}
