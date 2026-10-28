// ==================== DUELO DE REFLEJOS ====================
// A diferencia de los demás juegos por turnos, este SÍ necesita que
// los dos estén conectados al mismo momento (es justamente una
// carrera de reflejos). Se usa el mismo patrón "ambos listos" que
// ya usa el Truco para arrancar.
function refReflejos(){ return window.doc(window.db, 'juegos', 'reflejos'); }

let _reflejosFaseAnterior = null;
let _reflejosPuntajesAnteriores = null;
function iniciarReflejos(){
    _reflejosFaseAnterior = null;
    _reflejosPuntajesAnteriores = null;
    if (window._unsubReflejos) window._unsubReflejos();
    window._unsubReflejos = window.onSnapshot(refReflejos(), (snap) => {
        const datos = snap.exists() ? snap.data() : null;
        if (window.sfx && datos) {
            if (datos.fase === 'terminado' && _reflejosFaseAnterior !== 'terminado') {
                const gano = datos.ganadorRonda;
                if (gano) window.sfx[gano === miIdentidad ? 'victoria' : 'derrota']();
                if (gano === miIdentidad && window.fx) window.fx.confeti();
            }
        }
        _reflejosFaseAnterior = datos ? datos.fase : null;
        _reflejosPuntajesAnteriores = datos ? datos.puntajes : null;
        renderReflejos(datos);
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

    // La pantalla roja ya no espera a que llegue 'fuego' por internet
    // (le aparecía antes al celular que lo escribía): cada uno la pone
    // sola a la hora sincronizada "horaFuego", y gana el menor tiempo de
    // reacción medido contra esa misma hora.
    if (estado.fase === 'preparados' || estado.fase === 'fuego') {
        const yaToque = estado.tiempos?.[miIdentidad] != null;
        if (yaToque) {
            cont.innerHTML = `<div class="panel texto-centro">
                <div style="font-size:1.4rem;">⚡ ${estado.tiempos[miIdentidad]} ms</div>
                <div class="texto-tenue destello">Esperando a ${nombreJugador(miRival)}…</div>
            </div>`;
        } else {
            const rojo = ahoraSync() >= (estado.horaFuego || 0);
            cont.innerHTML = rojo
                ? `<div class="area-reflejos area-fuego" onpointerdown="tocarReflejos()"><div class="texto-reflejos">💥 ¡AHORA!</div></div>`
                : `<div class="area-reflejos area-espera" onpointerdown="tocarReflejos()"><div class="texto-reflejos">Preparados…</div></div>`;
            if (!rojo) _timeoutFuegoReflejos = setTimeout(() => { if (window.sfx) window.sfx.tiempoFinal(); renderReflejos(estado); }, Math.max(0, estado.horaFuego - ahoraSync()));
        }
        // Si el otro no toca nunca (se fue), a los 3 s del fuego se cierra igual.
        const cierre = (estado.horaFuego || 0) + 3000 - ahoraSync();
        clearTimeout(window._cierreReflejos);
        window._cierreReflejos = setTimeout(() => cerrarRondaReflejos(), Math.max(0, cierre) + 100);
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
    // Transacción (en vez de leer con onSnapshot y despues escribir
    // con merge suelto): si los dos tocan "listo" casi al mismo
    // tiempo, una lectura suelta puede no ver todavía la marca del
    // otro y la escritura de uno pisa la del otro, dejando la
    // partida esperando para siempre.
    await window.runTransaction(window.db, async (tx) => {
        const snap = await tx.get(refReflejos());
        const estado = snap.exists() ? snap.data() : null;
        if (estado?.fase === 'esperando' && estado?.listos?.[miIdentidad]) return;
        tx.set(refReflejos(), {
            fase: 'esperando',
            listos: { ...(estado?.listos || {}), [miIdentidad]: true },
            puntajes: estado?.puntajes || { nico: 0, carito: 0 }
        }, { merge: true });
    });
}

async function iniciarRondaReflejosSiCorresponde(estado){
    if (estado.fase !== 'esperando' || _iniciandoReflejos) return;
    _iniciandoReflejos = true;
    try {
        const horaFuego = ahoraSync() + 2000 + Math.random() * 5000;
        await window.updateDoc(refReflejos(), { fase: 'preparados', horaFuego, tiempos: {}, ganadorRonda: null });
    } finally {
        setTimeout(() => { _iniciandoReflejos = false; }, 1000);
    }
}

async function tocarReflejos(){
    const t = ahoraSync(); // hora del toque, antes de esperar a la red
    let falso = false;
    const res = await window.jugadaSegura(refReflejos(), (estado) => {
        if (!estado || (estado.fase !== 'preparados' && estado.fase !== 'fuego') || estado.tiempos?.[miIdentidad] != null) return null;
        const puntajes = { ...(estado.puntajes || { nico: 0, carito: 0 }) };
        if (t < estado.horaFuego) {
            // Tiro en falso: pierde quien tocó antes de tiempo.
            falso = true;
            puntajes[miRival] = (puntajes[miRival] || 0) + 1;
            return { fase: 'terminado', puntajes, ganadorRonda: miRival,
                mensajeRonda: `${nombreJugador(miIdentidad)} tocó antes de tiempo 🙈 — punto para ${nombreJugador(miRival)}.` };
        }
        const tiempos = { ...(estado.tiempos || {}), [miIdentidad]: Math.round(t - estado.horaFuego) };
        if (tiempos[miRival] == null) return { tiempos };
        return { tiempos, ..._resultadoReflejos(tiempos, puntajes) };
    });
    vibrarJ(falso ? [10, 30, 10] : [15, 30, 15]);
    if (res?.cambios.ganadorRonda && typeof registrarVictoria === 'function') registrarVictoria('reflejos', res.cambios.ganadorRonda);
}

function _resultadoReflejos(tiempos, puntajes){
    const n = tiempos.nico, c = tiempos.carito;
    const ganador = n == null ? 'carito' : c == null ? 'nico' : (n <= c ? 'nico' : 'carito');
    puntajes[ganador] = (puntajes[ganador] || 0) + 1;
    const detalle = n != null && c != null ? ` (Nico ${n} ms · Carito ${c} ms)` : ` (${tiempos[ganador]} ms)`;
    return { fase: 'terminado', puntajes, ganadorRonda: ganador, mensajeRonda: `🏆 ¡Ganó ${nombreJugador(ganador)}!${detalle}` };
}

// Cierre por tiempo: el que tocó gana; si nadie tocó, nadie suma.
async function cerrarRondaReflejos(){
    const res = await window.jugadaSegura(refReflejos(), (estado) => {
        if (!estado || (estado.fase !== 'preparados' && estado.fase !== 'fuego') || ahoraSync() < estado.horaFuego + 3000) return null;
        const tiempos = estado.tiempos || {};
        if (tiempos.nico == null && tiempos.carito == null) return { fase: 'terminado', ganadorRonda: null, mensajeRonda: '😴 Nadie tocó a tiempo.' };
        return _resultadoReflejos(tiempos, { ...(estado.puntajes || { nico: 0, carito: 0 }) });
    });
    if (res?.cambios.ganadorRonda && typeof registrarVictoria === 'function') registrarVictoria('reflejos', res.cambios.ganadorRonda);
}

async function revanchaReflejos(){
    vibrarJ(10);
    const estado = await new Promise(res => { const u = window.onSnapshot(refReflejos(), s => { u(); res(s.exists() ? s.data() : null); }); });
    await revanchaUnToque(refReflejos(), 'reflejos', { puntajes: estado?.puntajes || { nico: 0, carito: 0 } });
}
