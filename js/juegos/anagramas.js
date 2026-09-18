// ==================== CARRERA DE ANAGRAMAS ====================
// Aparecen las letras de una palabra desordenadas; el primero en
// escribirla bien gana el punto. Mismo patrón de ronda determinista
// + primera respuesta correcta que Cálculo Mental Rayo, pero
// verificando texto en vez de una opción de un botón.
const META_ANAGRAMAS = 5;
const BANCO_ANAGRAMAS = [
    'CASA', 'AMOR', 'PLAYA', 'LIBRO', 'MUSICA', 'CAFE', 'NOCHE', 'ESTRELLA',
    'VIAJE', 'JARDIN', 'LLUVIA', 'FUEGO', 'RISA', 'ABRAZO', 'SUEÑO', 'CIELO',
    'FLOR', 'BESO', 'LUNA', 'MAR', 'MONTAÑA', 'CAMINO', 'PUENTE', 'VENTANA',
    'CANCION', 'BAILE', 'FIESTA', 'HISTORIA', 'RECUERDO', 'FAMILIA', 'AMIGO',
    'VERANO', 'INVIERNO', 'OTOÑO', 'PRIMAVERA', 'CHOCOLATE', 'HELADO', 'PIZZA',
];

function refAnagramas(){ return window.doc(window.db, 'juegos', 'anagramas'); }

function normalizarPalabra(t){
    return (t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().trim();
}

function problemaAnagrama(ronda){
    const rng = window.rngRonda(ronda * 65599 + 31);
    const palabra = window.elegirRnd(rng, BANCO_ANAGRAMAS);
    let letras = window.barajarRnd(rng, palabra.split(''));
    // Si por azar quedó igual a la palabra original, la volvemos a
    // barajar una vez más (si la palabra tiene 1-2 letras puede quedar
    // igual de todos modos, pero el banco no tiene palabras tan cortas).
    if (letras.join('') === palabra) letras = window.barajarRnd(rng, letras);
    return { palabra, desordenada: letras.join(' ') };
}

let _anagramasFaseAnterior = null;
function iniciarAnagramas(){
    _anagramasFaseAnterior = null;
    if (window._unsubAnagramas) window._unsubAnagramas();
    window._unsubAnagramas = window.onSnapshot(refAnagramas(), (snap) => {
        const datos = snap.exists() ? snap.data() : null;
        if (datos && datos.fase === 'terminado' && _anagramasFaseAnterior === 'jugando' && window.sfx) {
            window.sfx[datos.ganador === miIdentidad ? 'victoria' : 'derrota']();
            if (window.fx && datos.ganador === miIdentidad) window.fx.confeti();
        }
        _anagramasFaseAnterior = datos ? datos.fase : null;
        renderAnagramas(datos);
    }, (err) => {
        console.error('Error de Firestore en anagramas:', err);
        document.getElementById('contenido-anagramas').innerHTML = `<div class="panel texto-centro texto-tenue">⚠️ No se pudo conectar (${err.code || 'error'}).</div>`;
    });
}

let _cuentaRegresivaAnagramas = null;
function renderAnagramas(estado){
    const cont = document.getElementById('contenido-anagramas');
    if (_cuentaRegresivaAnagramas) { clearTimeout(_cuentaRegresivaAnagramas); _cuentaRegresivaAnagramas = null; }

    if (!estado || estado.fase === 'sin_partida') {
        const v = estado?.victorias || { nico: 0, carito: 0 };
        cont.innerHTML = `<div class="panel texto-centro">
            <p class="texto-tenue">Reordená las letras y escribí la palabra. El primero en acertar suma el punto. A ${META_ANAGRAMAS} puntos gana.</p>
            <div class="texto-tenue" style="margin:10px 0;">Partidas ganadas — Nico ${v.nico || 0} — Carito ${v.carito || 0}</div>
            <button class="btn-principal" onclick="marcarListoAnagramas()">Empezar</button>
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
            <button class="btn-principal" ${listoYo ? 'disabled style="opacity:0.5;"' : ''} onclick="marcarListoAnagramas()">${listoYo ? 'Esperando al otro…' : '¡Estoy listo/a! 🔤'}</button>
        </div>`;
        if (listoYo && listoRival) iniciarRondaArcadeSiCorresponde(refAnagramas(), 'anagramas', 0, { ronda: 1, puntajes: { nico: 0, carito: 0 }, ganador: null });
        return;
    }

    if (estado.fase === 'terminado') {
        const p = estado.puntajes || { nico: 0, carito: 0 };
        cont.innerHTML = `<div class="panel texto-centro logro-animado">
            <div style="font-size:1.2rem; margin-bottom:8px;">🏆 ¡Ganó ${nombreJugador(estado.ganador)}!</div>
            <div class="texto-tenue">Nico ${p.nico || 0} — Carito ${p.carito || 0}</div>
            <button class="btn-principal" style="margin-top:14px;" onclick="revanchaAnagramas()">🔁 Revancha</button>
        </div>`;
        return;
    }

    const restante = (estado.horaInicio || Date.now()) - Date.now();
    if (restante > -500) {
        if (!estado.horaInicio) repararRondaArcadeSiCorresponde(refAnagramas(), 'anagramas');
        cont.innerHTML = htmlCuentaRegresivaArcade(restante);
        _cuentaRegresivaAnagramas = setTimeout(() => renderAnagramas(estado), msHastaProximoTickArcade(restante));
        return;
    }

    const p = estado.puntajes || { nico: 0, carito: 0 };
    const ronda = estado.ronda || 1;
    const prob = problemaAnagrama(ronda);
    cont.innerHTML = `<div class="texto-tenue texto-centro" style="margin-bottom:8px;">Nico ${p.nico || 0} — Carito ${p.carito || 0} · a ${META_ANAGRAMAS}</div>
    <div class="panel texto-centro">
        <div style="font-family:var(--fuente-titulo); font-size:2rem; letter-spacing:6px; margin:6px 0 16px;">${prob.desordenada}</div>
        <input type="text" id="input-anagrama" placeholder="¿Qué palabra es?" autocomplete="off"
            style="width:100%; padding:12px; border-radius:12px; border:1px solid var(--borde); background:rgba(255,255,255,0.06); color:var(--texto); font-size:1rem; margin-bottom:10px; text-align:center; text-transform:uppercase;"
            onkeydown="if(event.key==='Enter') responderAnagrama(${ronda})">
        <button class="btn-principal" onclick="responderAnagrama(${ronda})">Responder</button>
    </div>`;
    setTimeout(() => document.getElementById('input-anagrama')?.focus(), 50);
}

async function marcarListoAnagramas(){
    vibrarJ(12);
    // Transacción (en vez de leer con onSnapshot y despues escribir
    // con merge suelto): si los dos tocan "listo" casi al mismo
    // tiempo, una lectura suelta puede no ver todavía la marca del
    // otro y la escritura de uno pisa la del otro, dejando la
    // partida esperando para siempre.
    await window.runTransaction(window.db, async (tx) => {
        const snap = await tx.get(refAnagramas());
        const estado = snap.exists() ? snap.data() : null;
        if (estado?.fase === 'esperando' && estado?.listos?.[miIdentidad]) return;
        tx.set(refAnagramas(), {
            fase: 'esperando',
            listos: { ...(estado?.listos || {}), [miIdentidad]: true },
            victorias: estado?.victorias || { nico: 0, carito: 0 }
        }, { merge: true });
    });
}

async function responderAnagrama(rondaEsperada){
    const input = document.getElementById('input-anagrama');
    const intento = normalizarPalabra(input ? input.value : '');
    if (!intento) return;
    const ref = refAnagramas();
    const resultado = await window.runTransaction(window.db, async (tx) => {
        const snap = await tx.get(ref);
        const data = snap.data();
        if (!data || data.fase !== 'jugando' || (data.ronda || 1) !== rondaEsperada) return { acierto: false };
        const prob = problemaAnagrama(data.ronda || 1);
        if (intento !== normalizarPalabra(prob.palabra)) return { acierto: false };
        const puntajes = { ...(data.puntajes || { nico: 0, carito: 0 }) };
        puntajes[miIdentidad] = (puntajes[miIdentidad] || 0) + 1;
        const gano = puntajes[miIdentidad] >= META_ANAGRAMAS;
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
            registrarEvento('gano_partida', `${nombreJugador(miIdentidad)} ganó la Carrera de Anagramas`);
        }
    } else {
        vibrarJ([10, 30, 10]);
        if (window.sfx) window.sfx.error();
        if (window.fx) window.fx.sacudir(input);
        if (input) input.value = '';
    }
}

async function revanchaAnagramas(){
    vibrarJ(10);
    const estado = await new Promise(res => { const u = window.onSnapshot(refAnagramas(), s => { u(); res(s.exists() ? s.data() : null); }); });
    await window.setDoc(refAnagramas(), { fase: 'esperando', listos: {}, victorias: estado?.victorias || { nico: 0, carito: 0 } });
}
