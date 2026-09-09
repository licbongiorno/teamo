// ==================== ROMPE LADRILLOS A DÚO ====================
// Colaborativo: una pared compartida de ladrillos (6x8 = 48). Cada
// toque de cualquiera rompe un ladrillo. Se cronometra cuánto tardan
// los dos juntos en dejarla vacía. Se guarda el mejor tiempo.
const FILAS_LADRILLOS = 8, COLUMNAS_LADRILLOS = 6;
const TOTAL_LADRILLOS = FILAS_LADRILLOS * COLUMNAS_LADRILLOS;
const COLORES_LADRILLOS = ['#ffb3c6', '#c9b6ff', '#a8d8ff', '#a8edea', '#f5d9a0'];

function refLadrillos(){ return window.doc(window.db, 'juegos', 'ladrillos'); }

function iniciarLadrillos(){
    _ladrillosMostrados = false;
    if (window._unsubLadrillos) window._unsubLadrillos();
    window._unsubLadrillos = window.onSnapshot(refLadrillos(), (snap) => {
        renderLadrillos(snap.exists() ? snap.data() : null);
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
let _tickLadrillos = null;

function renderLadrillos(estado){
    const cont = document.getElementById('contenido-ladrillos');

    if (!estado || estado.fase === 'sin_partida') {
        _ladrillosMostrados = false;
        if (_tickLadrillos) { clearInterval(_tickLadrillos); _tickLadrillos = null; }
        const mejor = estado?.mejorTiempoMs;
        cont.innerHTML = `<div class="panel texto-centro">
            <p class="texto-tenue">Pared compartida de ${TOTAL_LADRILLOS} ladrillos. Entre los dos, a la vez, rompanla lo más rápido posible.</p>
            ${mejor ? `<div class="texto-tenue" style="margin-bottom:10px;">🏆 Mejor tiempo: ${(mejor / 1000).toFixed(1)}s</div>` : ''}
            <button class="btn-principal" onclick="empezarLadrillos()">Empezar</button>
        </div>`;
        return;
    }

    if (estado.fase === 'terminado') {
        _ladrillosMostrados = false;
        if (_tickLadrillos) { clearInterval(_tickLadrillos); _tickLadrillos = null; }
        const tiempo = ((estado.horaFinReal || Date.now()) - estado.horaInicio) / 1000;
        cont.innerHTML = `<div class="panel texto-centro logro-animado">
            <div style="font-size:1.3rem; margin-bottom:6px;">🎉 ¡Pared limpia!</div>
            <div style="font-size:1.6rem;">${tiempo.toFixed(1)}s</div>
            <div class="texto-tenue" style="margin-top:6px;">${estado.mejorTiempoMs && estado.mejorTiempoMs < (tiempo*1000 - 1) ? `Mejor marca sigue siendo ${(estado.mejorTiempoMs/1000).toFixed(1)}s` : '🏆 ¡Nuevo mejor tiempo!'}</div>
            <button class="btn-principal" style="margin-top:14px;" onclick="empezarLadrillos()">🔁 Otra pared</button>
        </div>`;
        return;
    }

    // jugando
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
        _tickLadrillos = setInterval(() => {
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

async function empezarLadrillos(){
    vibrarJ(12);
    const snap = await new Promise(res => { const u = window.onSnapshot(refLadrillos(), s => { u(); res(s); }); });
    const anterior = snap.exists() ? snap.data() : null;
    await window.setDoc(refLadrillos(), {
        fase: 'jugando', ladrillos: nuevaParedLadrillos(), horaInicio: Date.now(),
        mejorTiempoMs: anterior?.mejorTiempoMs || null
    });
}

async function romperLadrillo(indice){
    const snap = await new Promise(res => { const u = window.onSnapshot(refLadrillos(), s => { u(); res(s); }); });
    const data = snap.data();
    if (!data || data.fase !== 'jugando' || !data.ladrillos[indice]) return;
    vibrarJ(8);
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
    await window.updateDoc(refLadrillos(), updates);
    if (!quedan && typeof registrarEvento === 'function') {
        registrarEvento('cuidado_compartido', `Limpiaron la pared en Rompe Ladrillos a Dúo`);
    }
}
