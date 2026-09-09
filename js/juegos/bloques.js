// ==================== BATALLA DE BLOQUES ====================
// Versión simplificada de Tetris competitivo: cada uno tiene su
// propia grilla (6x10), local a su dispositivo — no se sincroniza
// cuadro a cuadro. Un bloque de un solo color cae por vez; tocás una
// columna para moverlo ahí. Al completar una fila se limpia y suma
// puntos. Cada 2 líneas limpiadas, le mandás una fila de "basura" al
// otro (como en el Tetris competitivo de verdad). Pierde quien llena
// su grilla hasta arriba.
const COLUMNAS_BLOQUES = 6, FILAS_BLOQUES = 10;
const TOTAL_CELDAS_BLOQUES = COLUMNAS_BLOQUES * FILAS_BLOQUES;
const COLORES_BLOQUES = ['#ffb3c6', '#c9b6ff', '#a8d8ff', '#a8edea', '#f5d9a0'];
const INTERVALO_CAIDA_BLOQUES = 650;

function refBloques(){ return window.doc(window.db, 'juegos', 'bloques'); }

function iniciarBloques(){
    const cont = document.getElementById('contenido-bloques');
    if (cont) delete cont.dataset.jugandoLocal;
    if (window._unsubBloques) window._unsubBloques();
    window._unsubBloques = window.onSnapshot(refBloques(), (snap) => {
        const data = snap.exists() ? snap.data() : null;
        manejarSnapshotBloques(data);
        if (cont && cont.dataset.jugandoLocal !== '1') renderBloques(data);
    }, (err) => {
        console.error('Error de Firestore en bloques:', err);
        if (cont && cont.dataset.jugandoLocal !== '1') {
            cont.innerHTML = `<div class="panel texto-centro texto-tenue">⚠️ No se pudo conectar (${err.code || 'error'}).</div>`;
        }
    });
}

let _cuentaRegresivaBloques = null;

function renderBloques(estado){
    const cont = document.getElementById('contenido-bloques');
    if (cont.dataset.jugandoLocal === '1') return;
    if (_cuentaRegresivaBloques) { clearTimeout(_cuentaRegresivaBloques); _cuentaRegresivaBloques = null; }

    if (!estado || estado.fase === 'esperando') {
        const listoYo = estado?.listos?.[miIdentidad];
        const listoRival = estado?.listos?.[miRival];
        const v = estado?.victorias || { nico: 0, carito: 0 };
        cont.innerHTML = `<div class="panel texto-centro">
            <p class="texto-tenue">Cada uno tiene su propia grilla. Tocá una columna para mandar ahí el bloque que cae. Al completar 2 filas, le mandás una fila de basura al otro. Pierde quien se llena hasta arriba.</p>
            <div class="texto-tenue" style="margin:10px 0;">Partidas ganadas — Nico ${v.nico || 0} — Carito ${v.carito || 0}</div>
            <div class="texto-tenue" style="margin-bottom:10px;">
                ${nombreJugador(miIdentidad)}: ${listoYo ? '✅ listo/a' : '⏳ esperando'}<br>
                ${nombreJugador(miRival)}: ${listoRival ? '✅ listo/a' : '⏳ esperando'}
            </div>
            <button class="btn-principal" ${listoYo ? 'disabled style="opacity:0.5;"' : ''} onclick="marcarListoBloques()">${listoYo ? 'Esperando…' : '¡Estoy listo/a! 🧱'}</button>
        </div>`;
        if (listoYo && listoRival) {
            iniciarRondaArcadeSiCorresponde(refBloques(), 'bloques', 600000, {
                garbageParaNico: 0, garbageParaCarito: 0, perdioNico: false, perdioCarito: false,
                puntajeNico: 0, puntajeCarito: 0, ganador: null
            });
        }
        return;
    }

    if (estado.fase === 'jugando') {
        const restante = (estado.horaInicio || Date.now()) - Date.now();
        if (restante > 0) {
            cont.innerHTML = `<div class="panel texto-centro" style="font-size:2rem;">${Math.ceil(restante / 1000)}</div>`;
            _cuentaRegresivaBloques = setTimeout(() => renderBloques(estado), Math.min(restante, 200));
            return;
        }
        jugarRondaBloques();
        return;
    }

    if (estado.fase === 'terminado') {
        const v = estado.victorias || { nico: 0, carito: 0 };
        cont.innerHTML = `<div class="panel texto-centro logro-animado">
            <div style="font-size:1.2rem; margin-bottom:6px;">${estado.ganador ? `🏆 ¡Ganó ${nombreJugador(estado.ganador)}!` : '🤝 Terminó sin definirse'}</div>
            <div class="texto-tenue">Nico: ${estado.puntajeNico || 0} pts — Carito: ${estado.puntajeCarito || 0} pts</div>
            <div class="texto-tenue" style="margin-top:8px;">Partidas ganadas — Nico ${v.nico} — Carito ${v.carito}</div>
            <button class="btn-principal" style="margin-top:14px;" onclick="revanchaBloques()">🔁 Revancha</button>
        </div>`;
    }
}

async function marcarListoBloques(){
    vibrarJ(12);
    await marcarListoArcade(refBloques(), { victorias: (await leerVictoriasBloques()) });
}
async function leerVictoriasBloques(){
    const snap = await new Promise(res => { const u = window.onSnapshot(refBloques(), s => { u(); res(s); }); });
    const data = snap.exists() ? snap.data() : null;
    return data?.victorias || { nico: 0, carito: 0 };
}

// ---------- Estado local de la partida (no se sincroniza cuadro a cuadro) ----------
let _gridBloques = [];
let _piezaFilaBloques = 0, _piezaColBloques = 0, _piezaColorBloques = '';
let _puntajeBloques = 0, _lineasAcumBloques = 0, _garbageYaEnviadasBloques = 0;
let _timerCaidaBloques = null;
let _jugandoLocalBloques = false;
let _terminadaBloques = false;

function jugarRondaBloques(){
    const cont = document.getElementById('contenido-bloques');
    cont.dataset.jugandoLocal = '1';
    _gridBloques = new Array(TOTAL_CELDAS_BLOQUES).fill(null);
    _puntajeBloques = 0; _lineasAcumBloques = 0; _garbageYaEnviadasBloques = 0;
    _jugandoLocalBloques = true; _terminadaBloques = false;

    let html = `<div class="panel texto-centro">
        <span id="puntaje-bloques">0 pts</span> &nbsp;·&nbsp;
        <span class="texto-tenue">${nombreJugador(miRival)}: <span id="puntaje-rival-bloques">0</span> pts</span>
    </div>
    <div class="panel"><div id="grilla-bloques" style="display:grid; grid-template-columns:repeat(${COLUMNAS_BLOQUES},1fr); gap:2px; max-width:280px; margin:0 auto;">`;
    for (let i = 0; i < TOTAL_CELDAS_BLOQUES; i++) {
        html += `<div id="celda-bloques-${i}" style="aspect-ratio:1; border-radius:3px; background:rgba(255,255,255,0.05);"></div>`;
    }
    html += `</div></div>
    <div class="panel"><div style="display:grid; grid-template-columns:repeat(${COLUMNAS_BLOQUES},1fr); gap:4px;">
        ${Array.from({ length: COLUMNAS_BLOQUES }, (_, c) => `<button class="btn-secundario" style="padding:12px 0;" onclick="moverColumnaBloques(${c})">${c + 1}</button>`).join('')}
    </div></div>`;
    cont.innerHTML = html;

    spawnPiezaBloques();
    _timerCaidaBloques = setInterval(tickCaidaBloques, INTERVALO_CAIDA_BLOQUES);
}

function idxBloques(fila, col){ return fila * COLUMNAS_BLOQUES + col; }
function colisionaBloques(fila, col){
    if (fila >= FILAS_BLOQUES) return true;
    if (fila < 0) return false;
    return !!_gridBloques[idxBloques(fila, col)];
}

function spawnPiezaBloques(){
    _piezaColBloques = Math.floor(Math.random() * COLUMNAS_BLOQUES);
    _piezaFilaBloques = 0;
    _piezaColorBloques = COLORES_BLOQUES[Math.floor(Math.random() * COLORES_BLOQUES.length)];
    if (colisionaBloques(0, _piezaColBloques)) { gameOverBloques(); return; }
    dibujarGrillaBloques();
}

function moverColumnaBloques(col){
    if (!_jugandoLocalBloques || _terminadaBloques) return;
    vibrarJ(6);
    _piezaColBloques = col;
    dibujarGrillaBloques();
}

function tickCaidaBloques(){
    if (!_jugandoLocalBloques || _terminadaBloques) return;
    if (colisionaBloques(_piezaFilaBloques + 1, _piezaColBloques)) {
        _gridBloques[idxBloques(_piezaFilaBloques, _piezaColBloques)] = _piezaColorBloques;
        limpiarFilasBloques();
        spawnPiezaBloques();
    } else {
        _piezaFilaBloques++;
        dibujarGrillaBloques();
    }
}

function limpiarFilasBloques(){
    let filasLimpiadas = 0;
    for (let f = FILAS_BLOQUES - 1; f >= 0; f--) {
        const llena = _gridBloques.slice(idxBloques(f, 0), idxBloques(f, 0) + COLUMNAS_BLOQUES).every(c => c);
        if (llena) {
            _gridBloques.splice(idxBloques(f, 0), COLUMNAS_BLOQUES);
            for (let i = 0; i < COLUMNAS_BLOQUES; i++) _gridBloques.unshift(null);
            filasLimpiadas++;
            f++; // volvemos a chequear la misma posición (bajó una fila nueva)
        }
    }
    if (filasLimpiadas > 0) {
        _puntajeBloques += filasLimpiadas * 10;
        _lineasAcumBloques += filasLimpiadas;
        vibrarJ([10, 20, 10]);
        const elP = document.getElementById('puntaje-bloques');
        if (elP) elP.innerText = _puntajeBloques + ' pts';
        sincronizarPuntajeEnVivo(refBloques(), miIdentidad === 'nico' ? 'puntajeNico' : 'puntajeCarito', _puntajeBloques, 400);

        const garbageQueCorresponde = Math.floor(_lineasAcumBloques / 2);
        const aEnviar = garbageQueCorresponde - _garbageYaEnviadasBloques;
        if (aEnviar > 0) {
            _garbageYaEnviadasBloques = garbageQueCorresponde;
            enviarGarbageBloques(aEnviar);
        }
    }
}

async function enviarGarbageBloques(cantidad){
    try {
        const snap = await new Promise(res => { const u = window.onSnapshot(refBloques(), s => { u(); res(s); }); });
        const data = snap.data();
        if (!data) return;
        const campo = miRival === 'nico' ? 'garbageParaNico' : 'garbageParaCarito';
        await window.updateDoc(refBloques(), { [campo]: (data[campo] || 0) + cantidad });
    } catch (e) { /* silencioso */ }
}

function aplicarGarbageLocalBloques(cantidad){
    for (let i = 0; i < cantidad; i++) {
        _gridBloques.splice(0, COLUMNAS_BLOQUES);
        const filaGarbage = new Array(COLUMNAS_BLOQUES).fill('garbage');
        filaGarbage[Math.floor(Math.random() * COLUMNAS_BLOQUES)] = null;
        _gridBloques.push(...filaGarbage);
    }
    vibrarJ([20, 40, 20]);
    if (_gridBloques[idxBloques(_piezaFilaBloques, _piezaColBloques)]) { gameOverBloques(); return; }
    dibujarGrillaBloques();
}

function dibujarGrillaBloques(){
    for (let i = 0; i < TOTAL_CELDAS_BLOQUES; i++) {
        const el = document.getElementById('celda-bloques-' + i);
        if (!el) continue;
        const valor = _gridBloques[i];
        el.style.background = valor === 'garbage' ? 'rgba(255,255,255,0.35)' : valor || 'rgba(255,255,255,0.05)';
    }
    if (!_terminadaBloques) {
        const elPieza = document.getElementById('celda-bloques-' + idxBloques(_piezaFilaBloques, _piezaColBloques));
        if (elPieza) elPieza.style.background = _piezaColorBloques;
    }
}

async function gameOverBloques(){
    if (_terminadaBloques) return;
    _terminadaBloques = true;
    _jugandoLocalBloques = false;
    if (_timerCaidaBloques) clearInterval(_timerCaidaBloques);
    vibrarJ([20, 40, 20, 40, 80]);
    try {
        const campoPerdio = miIdentidad === 'nico' ? 'perdioNico' : 'perdioCarito';
        const campoPuntaje = miIdentidad === 'nico' ? 'puntajeNico' : 'puntajeCarito';
        await window.updateDoc(refBloques(), { [campoPerdio]: true, [campoPuntaje]: _puntajeBloques });
        await intentarCerrarPartidaBloques();
    } catch (e) { console.error('No se pudo registrar el game over de bloques:', e); }
}

async function intentarCerrarPartidaBloques(){
    const snap = await new Promise(res => { const u = window.onSnapshot(refBloques(), s => { u(); res(s); }); });
    const data = snap.data();
    if (!data || data.fase === 'terminado') return;
    let ganador = null;
    if (data.perdioNico && !data.perdioCarito) ganador = 'carito';
    else if (data.perdioCarito && !data.perdioNico) ganador = 'nico';
    else if (data.perdioNico && data.perdioCarito) {
        // Perdieron los dos casi a la vez: gana quien tenía más puntos.
        ganador = (data.puntajeNico || 0) >= (data.puntajeCarito || 0) ? 'nico' : 'carito';
    } else return; // todavía no perdió nadie
    const victorias = { ...(data.victorias || { nico: 0, carito: 0 }) };
    victorias[ganador] = (victorias[ganador] || 0) + 1;
    await window.updateDoc(refBloques(), { fase: 'terminado', ganador, victorias });
    if (typeof registrarEvento === 'function') {
        registrarEvento('gano_partida', `${nombreJugador(ganador)} ganó Batalla de Bloques`);
    }
}

// Escucha permanente (vía iniciarBloques): aplica basura entrante y
// detecta si el rival perdió mientras jugamos nuestra propia partida.
function manejarSnapshotBloques(data){
    if (!data) return;
    if (_jugandoLocalBloques && !_terminadaBloques) {
        const campoGarbage = miIdentidad === 'nico' ? 'garbageParaNico' : 'garbageParaCarito';
        const pendiente = data[campoGarbage] || 0;
        if (pendiente > 0) {
            aplicarGarbageLocalBloques(pendiente);
            window.updateDoc(refBloques(), { [campoGarbage]: 0 }).catch(() => {});
        }
        const elRival = document.getElementById('puntaje-rival-bloques');
        if (elRival) elRival.innerText = data[miRival === 'nico' ? 'puntajeNico' : 'puntajeCarito'] || 0;
        const perdioRival = miIdentidad === 'nico' ? data.perdioCarito : data.perdioNico;
        if (perdioRival && data.fase !== 'terminado') {
            intentarCerrarPartidaBloques();
        }
    }
    if (data.fase === 'terminado' && _jugandoLocalBloques) {
        _jugandoLocalBloques = false;
        if (_timerCaidaBloques) clearInterval(_timerCaidaBloques);
        const cont = document.getElementById('contenido-bloques');
        if (cont) delete cont.dataset.jugandoLocal;
        renderBloques(data);
    }
}

async function revanchaBloques(){
    vibrarJ(10);
    const victorias = await leerVictoriasBloques();
    await window.setDoc(refBloques(), { fase: 'esperando', listos: {}, victorias });
}
