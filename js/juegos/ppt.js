// ==================== PIEDRA, PAPEL O TIJERA EXTENDIDO ====================
// El clásico de toda la vida, pero llevando la cuenta: mejor de 5.
// Los dos eligen en simultáneo (no se ve la elección del otro hasta
// que ambos ya eligieron); se resuelve con una transacción para que
// no importe quién escribe primero.
const META_PPT = 3; // primero en 3 rondas gana el mejor-de-5
const OPCIONES_PPT = [
    { id: 'piedra', emoji: '🪨', nombre: 'Piedra', leGanaA: 'tijera' },
    { id: 'papel', emoji: '📄', nombre: 'Papel', leGanaA: 'piedra' },
    { id: 'tijera', emoji: '✂️', nombre: 'Tijera', leGanaA: 'papel' },
];

function refPPT(){ return window.doc(window.db, 'juegos', 'ppt'); }

let _pptFaseAnterior = null;
function iniciarPPT(){
    _pptFaseAnterior = null;
    if (window._unsubPPT) window._unsubPPT();
    window._unsubPPT = window.onSnapshot(refPPT(), (snap) => {
        const datos = snap.exists() ? snap.data() : null;
        if (datos && datos.fase === 'terminado' && _pptFaseAnterior === 'jugando' && window.sfx) {
            window.sfx[datos.ganador === miIdentidad ? 'victoria' : 'derrota']();
            if (window.fx && datos.ganador === miIdentidad) window.fx.confeti();
        }
        _pptFaseAnterior = datos ? datos.fase : null;
        renderPPT(datos);
    }, (err) => {
        console.error('Error de Firestore en piedra/papel/tijera:', err);
        document.getElementById('contenido-ppt').innerHTML = `<div class="panel texto-centro texto-tenue">⚠️ No se pudo conectar (${err.code || 'error'}).</div>`;
    });
}

function _nombrePPT(id){ return OPCIONES_PPT.find(o => o.id === id)?.nombre || id; }
function _emojiPPT(id){ return OPCIONES_PPT.find(o => o.id === id)?.emoji || '❔'; }

let _cuentaRegresivaPPT = null;
function renderPPT(estado){
    const cont = document.getElementById('contenido-ppt');
    if (_cuentaRegresivaPPT) { clearTimeout(_cuentaRegresivaPPT); _cuentaRegresivaPPT = null; }

    if (!estado || estado.fase === 'sin_partida') {
        const v = estado?.victorias || { nico: 0, carito: 0 };
        cont.innerHTML = `<div class="panel texto-centro">
            <p class="texto-tenue">El clásico de toda la vida. Mejor de 5 rondas.</p>
            <div class="texto-tenue" style="margin:10px 0;">Partidas ganadas — Nico ${v.nico || 0} — Carito ${v.carito || 0}</div>
            <button class="btn-principal" onclick="marcarListoPPT()">Empezar</button>
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
            <button class="btn-principal" ${listoYo ? 'disabled style="opacity:0.5;"' : ''} onclick="marcarListoPPT()">${listoYo ? 'Esperando al otro…' : '¡Estoy listo/a! ✊'}</button>
        </div>`;
        if (listoYo && listoRival) iniciarRondaArcadeSiCorresponde(refPPT(), 'ppt', 0, { ronda: 1, elecciones: {}, puntajes: { nico: 0, carito: 0 }, resultadoRonda: null, ganador: null });
        return;
    }

    if (estado.fase === 'terminado') {
        const p = estado.puntajes || { nico: 0, carito: 0 };
        cont.innerHTML = `<div class="panel texto-centro logro-animado">
            <div style="font-size:1.2rem; margin-bottom:8px;">🏆 ¡Ganó ${nombreJugador(estado.ganador)}!</div>
            <div class="texto-tenue">Nico ${p.nico || 0} — Carito ${p.carito || 0}</div>
            <button class="btn-principal" style="margin-top:14px;" onclick="revanchaPPT()">🔁 Revancha</button>
        </div>`;
        return;
    }

    const restante = (estado.horaInicio || Date.now()) - Date.now();
    if (restante > -500) {
        if (!estado.horaInicio) repararRondaArcadeSiCorresponde(refPPT(), 'ppt');
        cont.innerHTML = htmlCuentaRegresivaArcade(restante);
        _cuentaRegresivaPPT = setTimeout(() => renderPPT(estado), restante > 0 ? Math.min(restante, 200) : 150);
        return;
    }

    const p = estado.puntajes || { nico: 0, carito: 0 };
    const elecciones = estado.elecciones || {};

    if (estado.resultadoRonda) {
        const r = estado.resultadoRonda;
        const msg = r.empate ? '🤝 Empate' : `${_emojiPPT(r[r.ganador])} le gana a ${_emojiPPT(r[r.ganador === 'nico' ? 'carito' : 'nico'])} — ¡Punto para ${nombreJugador(r.ganador)}!`;
        cont.innerHTML = `<div class="texto-tenue texto-centro" style="margin-bottom:8px;">Nico ${p.nico || 0} — Carito ${p.carito || 0} · a ${META_PPT}</div>
        <div class="panel texto-centro">
            <div style="display:flex; justify-content:center; gap:24px; font-size:3rem; margin:6px 0 14px;">
                <span>${_emojiPPT(r.nico)}</span><span>${_emojiPPT(r.carito)}</span>
            </div>
            <div style="margin-bottom:14px;">${msg}</div>
            <button class="btn-principal" onclick="siguienteRondaPPT(${estado.ronda || 1})">Siguiente ronda ➡️</button>
        </div>`;
        return;
    }

    const yaElegi = !!elecciones[miIdentidad];
    cont.innerHTML = `<div class="texto-tenue texto-centro" style="margin-bottom:8px;">Nico ${p.nico || 0} — Carito ${p.carito || 0} · a ${META_PPT}</div>
    <div class="panel texto-centro">
        <div class="texto-tenue" style="margin-bottom:14px;">${yaElegi ? 'Esperando a que elija el otro…' : 'Elegí tu jugada'}</div>
        <div style="display:flex; justify-content:center; gap:14px;">
            ${OPCIONES_PPT.map(o => `<button class="btn-secundario" style="padding:16px; font-size:2rem; ${yaElegi ? 'opacity:0.4;' : ''}" ${yaElegi ? 'disabled' : ''} onclick="elegirPPT(${estado.ronda || 1}, '${o.id}')">${o.emoji}</button>`).join('')}
        </div>
    </div>`;
}

async function marcarListoPPT(){
    vibrarJ(12);
    // Transacción (en vez de leer con onSnapshot y despues escribir
    // con merge suelto): si los dos tocan "listo" casi al mismo
    // tiempo, una lectura suelta puede no ver todavía la marca del
    // otro y la escritura de uno pisa la del otro, dejando la
    // partida esperando para siempre.
    await window.runTransaction(window.db, async (tx) => {
        const snap = await tx.get(refPPT());
        const estado = snap.exists() ? snap.data() : null;
        if (estado?.fase === 'esperando' && estado?.listos?.[miIdentidad]) return;
        tx.set(refPPT(), {
            fase: 'esperando',
            listos: { ...(estado?.listos || {}), [miIdentidad]: true },
            victorias: estado?.victorias || { nico: 0, carito: 0 }
        }, { merge: true });
    });
}

async function elegirPPT(rondaEsperada, opcionId){
    vibrarJ(10);
    const ref = refPPT();
    await window.runTransaction(window.db, async (tx) => {
        const snap = await tx.get(ref);
        const data = snap.data();
        if (!data || data.fase !== 'jugando' || (data.ronda || 1) !== rondaEsperada) return;
        const elecciones = { ...(data.elecciones || {}) };
        if (elecciones[miIdentidad]) return; // ya habías elegido
        elecciones[miIdentidad] = opcionId;
        const updates = { elecciones };
        if (elecciones.nico && elecciones.carito) {
            const a = OPCIONES_PPT.find(o => o.id === elecciones.nico);
            const empate = elecciones.nico === elecciones.carito;
            let ganadorRonda = null;
            if (!empate) ganadorRonda = a.leGanaA === elecciones.carito ? 'nico' : 'carito';
            const puntajes = { ...(data.puntajes || { nico: 0, carito: 0 }) };
            if (ganadorRonda) puntajes[ganadorRonda] = (puntajes[ganadorRonda] || 0) + 1;
            updates.resultadoRonda = { nico: elecciones.nico, carito: elecciones.carito, empate, ganador: ganadorRonda };
            updates.puntajes = puntajes;
            if (ganadorRonda && puntajes[ganadorRonda] >= META_PPT) {
                updates.fase = 'terminado'; updates.ganador = ganadorRonda;
                const victorias = { ...(data.victorias || { nico: 0, carito: 0 }) };
                victorias[ganadorRonda] = (victorias[ganadorRonda] || 0) + 1;
                updates.victorias = victorias;
            }
        }
        tx.update(ref, updates);
    });
}

async function siguienteRondaPPT(rondaAnterior){
    vibrarJ(10);
    const ref = refPPT();
    await window.runTransaction(window.db, async (tx) => {
        const snap = await tx.get(ref);
        const data = snap.data();
        if (!data || data.fase !== 'jugando' || (data.ronda || 1) !== rondaAnterior) return;
        tx.update(ref, { ronda: rondaAnterior + 1, elecciones: {}, resultadoRonda: null });
    });
    if (typeof registrarEvento === 'function') {
        registrarEvento('gano_partida', `Jugaron Piedra, Papel o Tijera`);
    }
}

async function revanchaPPT(){
    vibrarJ(10);
    const estado = await new Promise(res => { const u = window.onSnapshot(refPPT(), s => { u(); res(s.exists() ? s.data() : null); }); });
    await window.setDoc(refPPT(), { fase: 'esperando', listos: {}, victorias: estado?.victorias || { nico: 0, carito: 0 } });
}
