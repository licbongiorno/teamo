// ==================== TRIVIA RELÁMPAGO ====================
// La misma pregunta para los dos (se elige con una fórmula a partir
// del número de ronda, mismo patrón que Cálculo Mental Rayo). El
// primero en tocar la respuesta correcta suma el punto. A 5 gana.
const META_TRIVIA = 5;
const BANCO_TRIVIA = [
    { p: '¿Cuál es el río más largo del mundo?', o: ['Amazonas', 'Nilo', 'Mississippi', 'Yangtsé'], c: 0 },
    { p: '¿En qué país se originó el tango?', o: ['España', 'Argentina', 'Brasil', 'Uruguay'], c: 1 },
    { p: '¿Cuántos huesos tiene el cuerpo humano adulto?', o: ['186', '206', '226', '246'], c: 1 },
    { p: '¿Cuál es el planeta más grande del sistema solar?', o: ['Saturno', 'Neptuno', 'Júpiter', 'Urano'], c: 2 },
    { p: '¿Quién pintó la Mona Lisa?', o: ['Miguel Ángel', 'Rafael', 'Da Vinci', 'Botticelli'], c: 2 },
    { p: '¿Cuál es el metal líquido a temperatura ambiente?', o: ['Plomo', 'Mercurio', 'Estaño', 'Zinc'], c: 1 },
    { p: '¿Cuántos lados tiene un hexágono?', o: ['5', '6', '7', '8'], c: 1 },
    { p: '¿Cuál es el océano más grande?', o: ['Atlántico', 'Índico', 'Ártico', 'Pacífico'], c: 3 },
    { p: '¿En qué continente está Egipto?', o: ['Asia', 'África', 'Europa', 'Oceanía'], c: 1 },
    { p: '¿Cuál es la capital de Japón?', o: ['Seúl', 'Pekín', 'Tokio', 'Bangkok'], c: 2 },
    { p: '¿Cuántas cuerdas tiene una guitarra clásica?', o: ['4', '5', '6', '7'], c: 2 },
    { p: '¿Qué gas respiramos principalmente del aire?', o: ['Oxígeno', 'Nitrógeno', 'Dióxido de carbono', 'Hidrógeno'], c: 1 },
    { p: '¿Cuál es el animal terrestre más rápido?', o: ['León', 'Guepardo', 'Caballo', 'Avestruz'], c: 1 },
    { p: '¿Cuántos minutos dura un partido de fútbol (sin descuento)?', o: ['80', '90', '100', '120'], c: 1 },
    { p: '¿Cuál es el idioma más hablado del mundo (nativos)?', o: ['Inglés', 'Español', 'Mandarín', 'Hindi'], c: 2 },
    { p: '¿Qué instrumento mide la temperatura?', o: ['Barómetro', 'Termómetro', 'Altímetro', 'Manómetro'], c: 1 },
    { p: '¿Cuántos colores tiene el arcoíris?', o: ['5', '6', '7', '8'], c: 2 },
    { p: '¿Cuál es el hueso más largo del cuerpo humano?', o: ['Húmero', 'Tibia', 'Fémur', 'Radio'], c: 2 },
];

function refTrivia(){ return window.doc(window.db, 'juegos', 'trivia'); }

function problemaTrivia(ronda){
    const rng = window.rngRonda(ronda * 275604 + 41);
    const base = BANCO_TRIVIA[Math.floor(rng() * BANCO_TRIVIA.length)];
    const opciones = base.o.map((texto, i) => ({ texto, correcta: i === base.c }));
    window.barajarRnd(rng, opciones);
    return { pregunta: base.p, opciones };
}

let _triviaFaseAnterior = null;
function iniciarTrivia(){
    _triviaFaseAnterior = null;
    if (window._unsubTrivia) window._unsubTrivia();
    window._unsubTrivia = window.onSnapshot(refTrivia(), (snap) => {
        const datos = snap.exists() ? snap.data() : null;
        if (datos && datos.fase === 'terminado' && _triviaFaseAnterior === 'jugando' && window.sfx) {
            window.sfx[datos.ganador === miIdentidad ? 'victoria' : 'derrota']();
            if (window.fx && datos.ganador === miIdentidad) window.fx.confeti();
        }
        _triviaFaseAnterior = datos ? datos.fase : null;
        renderTrivia(datos);
    }, (err) => {
        console.error('Error de Firestore en trivia:', err);
        document.getElementById('contenido-trivia').innerHTML = `<div class="panel texto-centro texto-tenue">⚠️ No se pudo conectar (${err.code || 'error'}).</div>`;
    });
}

let _cuentaRegresivaTrivia = null;
function renderTrivia(estado){
    const cont = document.getElementById('contenido-trivia');
    if (_cuentaRegresivaTrivia) { clearTimeout(_cuentaRegresivaTrivia); _cuentaRegresivaTrivia = null; }

    if (!estado || estado.fase === 'sin_partida') {
        const v = estado?.victorias || { nico: 0, carito: 0 };
        cont.innerHTML = `<div class="panel texto-centro">
            <p class="texto-tenue">La misma pregunta para los dos, el primero en tocar la respuesta correcta suma el punto. A ${META_TRIVIA} gana.</p>
            <div class="texto-tenue" style="margin:10px 0;">Partidas ganadas — Nico ${v.nico || 0} — Carito ${v.carito || 0}</div>
            <button class="btn-principal" onclick="marcarListoTrivia()">Empezar</button>
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
            <button class="btn-principal" ${listoYo ? 'disabled style="opacity:0.5;"' : ''} onclick="marcarListoTrivia()">${listoYo ? 'Esperando al otro…' : '¡Estoy listo/a! 🧠'}</button>
        </div>`;
        if (listoYo && listoRival) iniciarRondaArcadeSiCorresponde(refTrivia(), 'trivia', 0, { ronda: 1, puntajes: { nico: 0, carito: 0 }, ganador: null });
        return;
    }

    if (estado.fase === 'terminado') {
        const p = estado.puntajes || { nico: 0, carito: 0 };
        cont.innerHTML = `<div class="panel texto-centro logro-animado">
            <div style="font-size:1.2rem; margin-bottom:8px;">🏆 ¡Ganó ${nombreJugador(estado.ganador)}!</div>
            <div class="texto-tenue">Nico ${p.nico || 0} — Carito ${p.carito || 0}</div>
            <button class="btn-principal" style="margin-top:14px;" onclick="revanchaTrivia()">🔁 Revancha</button>
        </div>`;
        return;
    }

    const restante = (estado.horaInicio || Date.now()) - Date.now();
    if (restante > -500) {
        cont.innerHTML = htmlCuentaRegresivaArcade(restante);
        _cuentaRegresivaTrivia = setTimeout(() => renderTrivia(estado), restante > 0 ? Math.min(restante, 200) : 150);
        return;
    }

    const p = estado.puntajes || { nico: 0, carito: 0 };
    const ronda = estado.ronda || 1;
    const prob = problemaTrivia(ronda);
    cont.innerHTML = `<div class="texto-tenue texto-centro" style="margin-bottom:8px;">Nico ${p.nico || 0} — Carito ${p.carito || 0} · a ${META_TRIVIA}</div>
    <div class="panel texto-centro">
        <div style="font-size:1.05rem; margin:6px 0 16px; line-height:1.4;">${prob.pregunta}</div>
        <div style="display:grid; grid-template-columns:repeat(2,1fr); gap:10px;">
            ${prob.opciones.map(o => `<button class="btn-secundario" style="padding:14px 6px; font-size:0.9rem;" onclick="responderTrivia(${ronda}, '${o.texto.replace(/'/g, "\\'")}')">${o.texto}</button>`).join('')}
        </div>
    </div>`;
}

async function marcarListoTrivia(){
    vibrarJ(12);
    // Transacción (en vez de leer con onSnapshot y despues escribir
    // con merge suelto): si los dos tocan "listo" casi al mismo
    // tiempo, una lectura suelta puede no ver todavía la marca del
    // otro y la escritura de uno pisa la del otro, dejando la
    // partida esperando para siempre.
    await window.runTransaction(window.db, async (tx) => {
        const snap = await tx.get(refTrivia());
        const estado = snap.exists() ? snap.data() : null;
        if (estado?.fase === 'esperando' && estado?.listos?.[miIdentidad]) return;
        tx.set(refTrivia(), {
            fase: 'esperando',
            listos: { ...(estado?.listos || {}), [miIdentidad]: true },
            victorias: estado?.victorias || { nico: 0, carito: 0 }
        }, { merge: true });
    });
}

async function responderTrivia(rondaEsperada, textoElegido){
    const ref = refTrivia();
    const resultado = await window.runTransaction(window.db, async (tx) => {
        const snap = await tx.get(ref);
        const data = snap.data();
        if (!data || data.fase !== 'jugando' || (data.ronda || 1) !== rondaEsperada) return { acierto: false };
        const prob = problemaTrivia(data.ronda || 1);
        const opcion = prob.opciones.find(o => o.texto === textoElegido);
        if (!opcion || !opcion.correcta) return { acierto: false };
        const puntajes = { ...(data.puntajes || { nico: 0, carito: 0 }) };
        puntajes[miIdentidad] = (puntajes[miIdentidad] || 0) + 1;
        const gano = puntajes[miIdentidad] >= META_TRIVIA;
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
            registrarEvento('gano_partida', `${nombreJugador(miIdentidad)} ganó Trivia Relámpago`);
        }
    } else {
        vibrarJ([10, 30, 10]);
        if (window.sfx) window.sfx.error();
        if (window.fx) window.fx.sacudirJuego();
    }
}

async function revanchaTrivia(){
    vibrarJ(10);
    const estado = await new Promise(res => { const u = window.onSnapshot(refTrivia(), s => { u(); res(s.exists() ? s.data() : null); }); });
    await window.setDoc(refTrivia(), { fase: 'esperando', listos: {}, victorias: estado?.victorias || { nico: 0, carito: 0 } });
}
