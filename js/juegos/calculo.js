// ==================== CÁLCULO MENTAL RAYO ====================
// Cuentas simples, los dos las ven al mismo tiempo (se generan con la
// misma fórmula a partir del número de ronda, no hace falta guardarlas
// en Firestore). El primero en tocar la respuesta correcta suma el
// punto; a 5 puntos gana la partida.
const META_CALCULO = 5;

function refCalculo(){ return window.doc(window.db, 'juegos', 'calculo'); }

function problemaCalculo(ronda){
    const rng = window.rngRonda(ronda * 7919 + 13);
    const operador = window.elegirRnd(rng, ['+', '-', '×']);
    let a, b, resultado;
    if (operador === '+') { a = window.enteroRnd(rng, 2, 40); b = window.enteroRnd(rng, 2, 40); resultado = a + b; }
    else if (operador === '-') { a = window.enteroRnd(rng, 10, 50); b = window.enteroRnd(rng, 1, a - 1); resultado = a - b; }
    else { a = window.enteroRnd(rng, 2, 12); b = window.enteroRnd(rng, 2, 9); resultado = a * b; }
    const opciones = new Set([resultado]);
    while (opciones.size < 4) {
        const ruido = window.enteroRnd(rng, -8, 8) || 3;
        const falsa = resultado + ruido * window.enteroRnd(rng, 1, 3);
        if (falsa !== resultado) opciones.add(falsa);
    }
    return { enunciado: `${a} ${operador} ${b}`, opciones: window.barajarRnd(rng, [...opciones]), correcta: resultado };
}

let _calculoFaseAnterior = null;
function iniciarCalculo(){
    _calculoFaseAnterior = null;
    if (window._unsubCalculo) window._unsubCalculo();
    window._unsubCalculo = window.onSnapshot(refCalculo(), (snap) => {
        const datos = snap.exists() ? snap.data() : null;
        if (datos && datos.fase === 'terminado' && _calculoFaseAnterior === 'jugando' && window.sfx) {
            window.sfx[datos.ganador === miIdentidad ? 'victoria' : 'derrota']();
            if (window.fx && datos.ganador === miIdentidad) window.fx.confeti();
        }
        _calculoFaseAnterior = datos ? datos.fase : null;
        renderCalculo(datos);
    }, (err) => {
        console.error('Error de Firestore en cálculo:', err);
        document.getElementById('contenido-calculo').innerHTML = `<div class="panel texto-centro texto-tenue">⚠️ No se pudo conectar (${err.code || 'error'}).</div>`;
    });
}

let _cuentaRegresivaCalculo = null;
function renderCalculo(estado){
    const cont = document.getElementById('contenido-calculo');
    if (_cuentaRegresivaCalculo) { clearTimeout(_cuentaRegresivaCalculo); _cuentaRegresivaCalculo = null; }

    if (!estado || estado.fase === 'sin_partida') {
        const v = estado?.victorias || { nico: 0, carito: 0 };
        cont.innerHTML = `<div class="panel texto-centro">
            <p class="texto-tenue">Cuentas simples, el primero en tocar la respuesta correcta suma el punto. A ${META_CALCULO} puntos gana la partida.</p>
            <div class="texto-tenue" style="margin:10px 0;">Partidas ganadas — Nico ${v.nico || 0} — Carito ${v.carito || 0}</div>
            <button class="btn-principal" onclick="marcarListoCalculo()">Empezar</button>
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
            <button class="btn-principal" ${listoYo ? 'disabled style="opacity:0.5;"' : ''} onclick="marcarListoCalculo()">${listoYo ? 'Esperando al otro…' : '¡Estoy listo/a! 🧮'}</button>
        </div>`;
        if (listoYo && listoRival) iniciarRondaArcadeSiCorresponde(refCalculo(), 'calculo', 0, { ronda: 1, puntajes: { nico: 0, carito: 0 }, ganador: null });
        return;
    }

    if (estado.fase === 'terminado') {
        const p = estado.puntajes || { nico: 0, carito: 0 };
        cont.innerHTML = `<div class="panel texto-centro logro-animado">
            <div style="font-size:1.2rem; margin-bottom:8px;">🏆 ¡Ganó ${nombreJugador(estado.ganador)}!</div>
            <div class="texto-tenue">Nico ${p.nico || 0} — Carito ${p.carito || 0}</div>
            <button class="btn-principal" style="margin-top:14px;" onclick="revanchaCalculo()">🔁 Revancha</button>
        </div>`;
        return;
    }

    const restante = (estado.horaInicio || Date.now()) - Date.now();
    if (restante > -500) {
        if (!estado.horaInicio) repararRondaArcadeSiCorresponde(refCalculo(), 'calculo');
        cont.innerHTML = htmlCuentaRegresivaArcade(restante);
        _cuentaRegresivaCalculo = setTimeout(() => renderCalculo(estado), msHastaProximoTickArcade(restante));
        return;
    }

    const p = estado.puntajes || { nico: 0, carito: 0 };
    const prob = problemaCalculo(estado.ronda || 1);
    cont.innerHTML = `<div class="texto-tenue texto-centro" style="margin-bottom:8px;">Nico ${p.nico || 0} — Carito ${p.carito || 0} · a ${META_CALCULO}</div>
    <div class="panel texto-centro">
        <div style="font-family:var(--fuente-titulo); font-size:2.4rem; margin:6px 0 16px;">${prob.enunciado} = ?</div>
        <div style="display:grid; grid-template-columns:repeat(2,1fr); gap:10px;">
            ${prob.opciones.map(op => `<button class="btn-secundario" style="padding:16px 0; font-size:1.2rem;" onclick="responderCalculo(${estado.ronda || 1}, ${op})">${op}</button>`).join('')}
        </div>
    </div>`;
}

async function marcarListoCalculo(){
    vibrarJ(12);
    // Transacción (en vez de leer con onSnapshot y despues escribir
    // con merge suelto): si los dos tocan "listo" casi al mismo
    // tiempo, una lectura suelta puede no ver todavía la marca del
    // otro y la escritura de uno pisa la del otro, dejando la
    // partida esperando para siempre.
    await window.runTransaction(window.db, async (tx) => {
        const snap = await tx.get(refCalculo());
        const estado = snap.exists() ? snap.data() : null;
        if (estado?.fase === 'esperando' && estado?.listos?.[miIdentidad]) return;
        tx.set(refCalculo(), {
            fase: 'esperando',
            listos: { ...(estado?.listos || {}), [miIdentidad]: true },
            victorias: estado?.victorias || { nico: 0, carito: 0 }
        }, { merge: true });
    });
}

async function responderCalculo(rondaEsperada, valor){
    const ref = refCalculo();
    const resultado = await window.runTransaction(window.db, async (tx) => {
        const snap = await tx.get(ref);
        const data = snap.data();
        if (!data || data.fase !== 'jugando' || (data.ronda || 1) !== rondaEsperada) return { acierto: false };
        const prob = problemaCalculo(data.ronda || 1);
        if (valor !== prob.correcta) return { acierto: false };
        const puntajes = { ...(data.puntajes || { nico: 0, carito: 0 }) };
        puntajes[miIdentidad] = (puntajes[miIdentidad] || 0) + 1;
        const gano = puntajes[miIdentidad] >= META_CALCULO;
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
            registrarEvento('gano_partida', `${nombreJugador(miIdentidad)} ganó Cálculo Mental Rayo`);
        }
    } else {
        vibrarJ([10, 30, 10]);
        if (window.sfx) window.sfx.error();
        if (window.fx) window.fx.sacudirJuego();
    }
}

async function revanchaCalculo(){
    vibrarJ(10);
    const estado = await new Promise(res => { const u = window.onSnapshot(refCalculo(), s => { u(); res(s.exists() ? s.data() : null); }); });
    await window.setDoc(refCalculo(), { fase: 'esperando', listos: {}, victorias: estado?.victorias || { nico: 0, carito: 0 } });
}
