// ==================== ROMPE LADRILLOS A DÚO ====================
// Colaborativo: una pared compartida de ladrillos (6x8 = 48). Cada
// toque de cualquiera rompe un ladrillo. Se cronometra cuánto tardan
// los dos juntos en dejarla vacía. Se guarda el mejor tiempo.
// Antes arrancaba apenas uno tocaba "Empezar" (uno solo podía romper
// toda la pared sin que el otro llegara a entrar): ahora espera a que
// los dos estén listos, con la misma cuenta regresiva de los demás
// juegos en vivo (ver arcade-comun.js).
const FILAS_LADRILLOS = 8, COLUMNAS_LADRILLOS = 6;
const TOTAL_LADRILLOS = FILAS_LADRILLOS * COLUMNAS_LADRILLOS;
const COLORES_LADRILLOS = ['#ffb3c6', '#c9b6ff', '#a8d8ff', '#a8edea', '#f5d9a0'];

function refLadrillos(){ return window.doc(window.db, 'juegos', 'ladrillos'); }

let _ladrillosFaseAnterior = null;
function iniciarLadrillos(){
    _ladrillosMostrados = false;
    _ladrillosFaseAnterior = null;
    if (window._unsubLadrillos) window._unsubLadrillos();
    window._unsubLadrillos = window.onSnapshot(refLadrillos(), (snap) => {
        const datos = snap.exists() ? snap.data() : null;
        if (datos && datos.fase === 'terminado' && _ladrillosFaseAnterior === 'jugando' && window.sfx) window.sfx.logro();
        if (window.fx) window.fx.confeti();
        _ladrillosFaseAnterior = datos ? datos.fase : null;
        renderLadrillos(datos);
    }, (err) => {
        console.error('Error de Firestore en ladrillos:', err);
        document.getElementById('contenido-ladrillos').innerHTML = `<div class="panel texto-centro texto-tenue">⚠️ No se pudo conectar (${err.code || 'error'}).</div>`;
    });
}

function nuevaParedLadrillos(){
    const ladrillos = [];
    for (let i = 0; i < TOTAL_LADRILLOS; i++) ladrillos.push(true);
    return ladrillos;
}

let _ladrillosMostrados = false;
let _cuentaRegresivaLadrillos = null;

function renderLadrillos(estado){
    const cont = document.getElementById('contenido-ladrillos');
    if (_cuentaRegresivaLadrillos) { clearTimeout(_cuentaRegresivaLadrillos); _cuentaRegresivaLadrillos = null; }

    if (!estado || estado.fase === 'sin_partida') {
        _ladrillosMostrados = false;
        if (window._tickLadrillos) { clearInterval(window._tickLadrillos); window._tickLadrillos = null; }
        const mejor = estado?.mejorTiempoMs;
        cont.innerHTML = `<div class="panel texto-centro">
            <p class="texto-tenue">Pared compartida de ${TOTAL_LADRILLOS} ladrillos. Entre los dos, a la vez, rompanla lo más rápido posible.</p>
            ${mejor ? `<div class="texto-tenue" style="margin-bottom:10px;">🏆 Mejor tiempo: ${(mejor / 1000).toFixed(1)}s</div>` : ''}
            <button class="btn-principal" onclick="marcarListoLadrillos()">Empezar</button>
        </div>`;
        return;
    }

    if (estado.fase === 'esperando') {
        _ladrillosMostrados = false;
        if (window._tickLadrillos) { clearInterval(window._tickLadrillos); window._tickLadrillos = null; }
        const listoYo = estado.listos?.[miIdentidad];
        const listoRival = estado.listos?.[miRival];
        const mejor = estado.mejorTiempoMs;
        cont.innerHTML = `<div class="panel texto-centro">
            <p class="texto-tenue">Pared compartida de ${TOTAL_LADRILLOS} ladrillos. Entre los dos, a la vez, rompanla lo más rápido posible.</p>
            ${mejor ? `<div class="texto-tenue" style="margin-bottom:10px;">🏆 Mejor tiempo: ${(mejor / 1000).toFixed(1)}s</div>` : ''}
            <div class="texto-tenue" style="margin-bottom:10px;">
                ${nombreJugador(miIdentidad)}: ${listoYo ? '✅ listo/a' : '⏳ esperando'}<br>
                ${nombreJugador(miRival)}: ${listoRival ? '✅ listo/a' : '⏳ esperando'}
            </div>
            <button class="btn-principal" ${listoYo ? 'disabled style="opacity:0.5;"' : ''} onclick="marcarListoLadrillos()">${listoYo ? 'Esperando al otro…' : '¡Estoy listo/a! 🧱'}</button>
        </div>`;
        if (listoYo && listoRival) iniciarRondaArcadeSiCorresponde(refLadrillos(), 'ladrillos', 0, { ladrillos: nuevaParedLadrillos() });
        return;
    }

    if (estado.fase === 'terminado') {
        _ladrillosMostrados = false;
        if (window._tickLadrillos) { clearInterval(window._tickLadrillos); window._tickLadrillos = null; }
        const tiempo = ((estado.horaFinReal || Date.now()) - estado.horaInicio) / 1000;
        cont.innerHTML = `<div class="panel texto-centro logro-animado">
            <div style="font-size:1.3rem; margin-bottom:6px;">🎉 ¡Pared limpia!</div>
            <div style="font-size:1.6rem;">${tiempo.toFixed(1)}s</div>
            <div class="texto-tenue" style="margin-top:6px;">${estado.mejorTiempoMs && estado.mejorTiempoMs < (tiempo*1000 - 1) ? `Mejor marca sigue siendo ${(estado.mejorTiempoMs/1000).toFixed(1)}s` : '🏆 ¡Nuevo mejor tiempo!'}</div>
            <button class="btn-principal" style="margin-top:14px;" onclick="revanchaLadrillos()">🔁 Otra pared</button>
        </div>`;
        return;
    }

    // fase === 'jugando'
    const restante = (estado.horaInicio || Date.now()) - Date.now();
    if (restante > -500) {
        if (!estado.horaInicio) repararRondaArcadeSiCorresponde(refLadrillos(), 'ladrillos');
        _ladrillosMostrados = false;
        cont.innerHTML = htmlCuentaRegresivaArcade(restante);
        _cuentaRegresivaLadrillos = setTimeout(() => renderLadrillos(estado), msHastaProximoTickArcade(restante));
        return;
    }

    if (!_ladrillosMostrados) {
        _ladrillosMostrados = true;
        let html = `<div class="panel texto-centro">
            <div id="tiempo-ladrillos" style="font-size:1.3rem;">0.0s</div>
            <div class="texto-tenue" id="restantes-ladrillos"></div>
        </div>
        <div class="panel"><div style="display:grid; grid-template-columns:repeat(${COLUMNAS_LADRILLOS},1fr); gap:4px;">`;
        for (let i = 0; i < TOTAL_LADRILLOS; i++) {
            html += `<div id="ladrillo-${i}" onclick="romperLadrillo(${i})" style="aspect-ratio:2/1; border-radius:4px; cursor:pointer; background:${COLORES_LADRILLOS[i % COLORES_LADRILLOS.length]};"></div>`;
        }
        html += `</div></div>`;
        cont.innerHTML = html;
        // Por las dudas quedara uno corriendo de antes (salir del juego a
        // mitad de partida y volver a entrar), lo apagamos antes de armar
        // uno nuevo para no duplicar el cronómetro.
        if (window._tickLadrillos) clearInterval(window._tickLadrillos);
        window._tickLadrillos = setInterval(() => {
            const el = document.getElementById('tiempo-ladrillos');
            if (el) el.innerText = ((Date.now() - estado.horaInicio) / 1000).toFixed(1) + 's';
        }, 100);
    }
    (estado.ladrillos || []).forEach((activo, i) => {
        const el = document.getElementById('ladrillo-' + i);
        if (el) el.style.visibility = activo ? 'visible' : 'hidden';
    });
    const restantes = (estado.ladrillos || []).filter(Boolean).length;
    const elR = document.getElementById('restantes-ladrillos');
    if (elR) elR.innerText = `${restantes} ladrillos quedan`;
}

async function marcarListoLadrillos(){
    vibrarJ(12);
    // Transacción (en vez de leer con onSnapshot y despues escribir
    // con merge suelto): si los dos tocan "listo" casi al mismo
    // tiempo, una lectura suelta puede no ver todavía la marca del
    // otro y la escritura de uno pisa la del otro, dejando la
    // partida esperando para siempre.
    await window.runTransaction(window.db, async (tx) => {
        const snap = await tx.get(refLadrillos());
        const estado = snap.exists() ? snap.data() : null;
        if (estado?.fase === 'esperando' && estado?.listos?.[miIdentidad]) return;
        tx.set(refLadrillos(), {
            fase: 'esperando',
            listos: { ...(estado?.listos || {}), [miIdentidad]: true },
            mejorTiempoMs: estado?.mejorTiempoMs || null
        }, { merge: true });
    });
}

async function revanchaLadrillos(){
    vibrarJ(10);
    const estado = await new Promise(res => { const u = window.onSnapshot(refLadrillos(), s => { u(); res(s.exists() ? s.data() : null); }); });
    await window.setDoc(refLadrillos(), {
        fase: 'esperando', listos: {}, mejorTiempoMs: estado?.mejorTiempoMs || null
    });
}

async function romperLadrillo(indice){
    const ref = refLadrillos();
    // Transacción: leer el array completo y escribirlo de nuevo sin
    // transacción hacía que, si los dos rompían ladrillos distintos casi
    // a la vez, la segunda escritura pisara el array entero con datos
    // viejos y "revivía" el ladrillo que ya había roto el otro.
    const resultado = await window.runTransaction(window.db, async (tx) => {
        const snap = await tx.get(ref);
        const data = snap.data();
        if (!data || data.fase !== 'jugando' || !data.ladrillos[indice]) return null;
        const ladrillos = [...data.ladrillos];
        ladrillos[indice] = false;
        const quedan = ladrillos.some(Boolean);
        const updates = { ladrillos };
        if (!quedan) {
            const horaFinReal = Date.now();
            const tiempoMs = horaFinReal - data.horaInicio;
            const mejorTiempoMs = data.mejorTiempoMs && data.mejorTiempoMs < tiempoMs ? data.mejorTiempoMs : tiempoMs;
            updates.fase = 'terminado';
            updates.horaFinReal = horaFinReal;
            updates.mejorTiempoMs = mejorTiempoMs;
        }
        tx.update(ref, updates);
        return { quedan };
    });
    if (!resultado) return;
    vibrarJ(8);
    if (window.sfx) window.sfx.golpe();
    if (!resultado.quedan && typeof registrarEvento === 'function') {
        registrarEvento('cuidado_compartido', `Limpiaron la pared en Rompe Ladrillos a Dúo`);
    }
}
