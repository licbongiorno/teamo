// ==================== DUELO DE REFLEJOS ====================
// A diferencia de los demás juegos por turnos, este SÍ necesita que
// los dos estén conectados al mismo momento (es justamente una
// carrera de reflejos). Se usa el mismo patrón "ambos listos" que
// ya usa el Truco para arrancar.
function refReflejos(){ return window.doc(window.db, 'juegos', 'reflejos'); }

function iniciarReflejos(){
    if (window._unsubReflejos) window._unsubReflejos();
    window._unsubReflejos = window.onSnapshot(refReflejos(), (snap) => {
        renderReflejos(snap.exists() ? snap.data() : null);
    }, (err) => {
        console.error('Error de Firestore en reflejos:', err);
        document.getElementById('contenido-reflejos').innerHTML = `<div class="panel texto-centro texto-tenue">⚠️ No se pudo conectar (${err.code || 'error'}).</div>`;
    });
}

let _timeoutFuegoReflejos = null;
let _iniciandoReflejos = false;

function renderReflejos(estado){
    const cont = document.getElementById('contenido-reflejos');
    if (_timeoutFuegoReflejos) { clearTimeout(_timeoutFuegoReflejos); _timeoutFuegoReflejos = null; }

    if (!estado || estado.fase === 'esperando') {
        const listoYo = estado?.listos?.[miIdentidad];
        const listoRival = estado?.listos?.[miRival];
        const puntajes = estado?.puntajes || { nico: 0, carito: 0 };
        cont.innerHTML = `<div class="panel texto-centro">
            <p class="texto-tenue">Los dos tienen que estar acá al mismo tiempo. Cuando la pantalla se ponga roja, tocá lo más rápido que puedas — pero si tocás antes, perdés la ronda.</p>
            <div class="texto-tenue" style="margin:10px 0;">Nico ${puntajes.nico || 0} — Carito ${puntajes.carito || 0}</div>
            <div class="texto-tenue" style="margin-bottom:10px;">
                ${nombreJugador(miIdentidad)}: ${listoYo ? '✅ listo/a' : '⏳ esperando'}<br>
                ${nombreJugador(miRival)}: ${listoRival ? '✅ listo/a' : '⏳ esperando'}
            </div>
            <button class="btn-principal" ${listoYo ? 'disabled style="opacity:0.5;"' : ''} onclick="marcarListoReflejos()">${listoYo ? 'Esperando al otro…' : '¡Estoy listo/a! 💥'}</button>
        </div>`;
        if (listoYo && listoRival) iniciarRondaReflejosSiCorresponde(estado);
        return;
    }

    if (estado.fase === 'preparados') {
        cont.innerHTML = `<div class="area-reflejos area-espera" onclick="tocarReflejos('falso')">
            <div class="texto-reflejos">Preparados…</div>
        </div>`;
        const restante = (estado.horaFuego || Date.now()) - Date.now();
        // Cualquiera de los dos dispositivos puede ser quien efectivamente
        // dispare 'fuego' al llegar la hora (con guarda para no duplicar).
        _timeoutFuegoReflejos = setTimeout(() => dispararFuegoSiCorresponde(estado), Math.max(0, restante));
        return;
    }

    if (estado.fase === 'fuego') {
        cont.innerHTML = `<div class="area-reflejos area-fuego" onclick="tocarReflejos('valido')">
            <div class="texto-reflejos">💥 ¡AHORA!</div>
        </div>`;
        return;
    }

    if (estado.fase === 'terminado') {
        const puntajes = estado.puntajes || { nico: 0, carito: 0 };
        cont.innerHTML = `<div class="panel texto-centro">
            <div style="font-size:1.2rem; margin-bottom:6px;">${estado.mensajeRonda || ''}</div>
            <div class="texto-tenue" style="margin-bottom:14px;">Nico ${puntajes.nico || 0} — Carito ${puntajes.carito || 0}</div>
            <button class="btn-principal" onclick="revanchaReflejos()">🔁 Otra ronda</button>
        </div>`;
    }
}

async function marcarListoReflejos(){
    vibrarJ(12);
    const estado = await new Promise(res => { const u = window.onSnapshot(refReflejos(), s => { u(); res(s.exists() ? s.data() : null); }); });
    await window.setDoc(refReflejos(), {
        fase: 'esperando',
        listos: { ...(estado?.listos || {}), [miIdentidad]: true },
        puntajes: estado?.puntajes || { nico: 0, carito: 0 }
    }, { merge: true });
}

async function iniciarRondaReflejosSiCorresponde(estado){
    if (estado.fase !== 'esperando' || _iniciandoReflejos) return;
    _iniciandoReflejos = true;
    const horaFuego = Date.now() + 2000 + Math.random() * 5000;
    await window.updateDoc(refReflejos(), { fase: 'preparados', horaFuego, tocoNico: null, tocoCarito: null });
    setTimeout(() => { _iniciandoReflejos = false; }, 1000);
}

let _fuegoDisparado = false;
async function dispararFuegoSiCorresponde(estadoPrevio){
    if (_fuegoDisparado) return;
    _fuegoDisparado = true;
    try {
        const snap = await new Promise(res => { const u = window.onSnapshot(refReflejos(), s => { u(); res(s); }); });
        const estado = snap.exists() ? snap.data() : null;
        if (estado && estado.fase === 'preparados') {
            await window.updateDoc(refReflejos(), { fase: 'fuego' });
        }
    } finally {
        setTimeout(() => { _fuegoDisparado = false; }, 500);
    }
}

async function tocarReflejos(tipo){
    vibrarJ(tipo === 'falso' ? [10, 30, 10] : [15, 30, 15]);
    const snap = await new Promise(res => { const u = window.onSnapshot(refReflejos(), s => { u(); res(s); }); });
    if (!snap.exists()) return;
    const estado = snap.data();
    if (estado.fase === 'terminado') return;

    if (tipo === 'falso' && estado.fase === 'preparados') {
        // Tiro en falso: pierde quien tocó antes de tiempo.
        const nuevosPuntajes = { ...(estado.puntajes || { nico: 0, carito: 0 }) };
        nuevosPuntajes[miRival] = (nuevosPuntajes[miRival] || 0) + 1;
        await window.updateDoc(refReflejos(), {
            fase: 'terminado', puntajes: nuevosPuntajes,
            mensajeRonda: `${nombreJugador(miIdentidad)} tocó antes de tiempo 🙈 — punto para ${nombreJugador(miRival)}.`
        });
        return;
    }

    if (estado.fase === 'fuego') {
        // Primero en llegar gana: se protege con un chequeo de fase
        // fresco antes de escribir, para minimizar el margen de doble toque.
        const snapFresco = await new Promise(res => { const u = window.onSnapshot(refReflejos(), s => { u(); res(s); }); });
        const estadoFresco = snapFresco.data();
        if (!estadoFresco || estadoFresco.fase !== 'fuego') return;
        const nuevosPuntajes = { ...(estadoFresco.puntajes || { nico: 0, carito: 0 }) };
        nuevosPuntajes[miIdentidad] = (nuevosPuntajes[miIdentidad] || 0) + 1;
        await window.updateDoc(refReflejos(), {
            fase: 'terminado', puntajes: nuevosPuntajes,
            mensajeRonda: `🏆 ¡Ganó ${nombreJugador(miIdentidad)}!`
        });
    }
}

async function revanchaReflejos(){
    vibrarJ(10);
    const estado = await new Promise(res => { const u = window.onSnapshot(refReflejos(), s => { u(); res(s.exists() ? s.data() : null); }); });
    await window.setDoc(refReflejos(), {
        fase: 'esperando', listos: {}, puntajes: estado?.puntajes || { nico: 0, carito: 0 }
    });
}
