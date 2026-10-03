// ==================== MEMORIA DE EMOJIS ====================
const POOL_EMOJIS_MEMORIA = ['🍎','🍊','🍋','🍇','🍓','🍉','🍑','🍒','🌸','⭐','🌙','☀️','💙','💗','🎈','🔥'];
const NIVELES_MEMORIA = [5, 6, 7, 8, 10];

function refMemoria(){ return window.doc(window.db, 'juegos', 'memoria'); }

let _memoriaFaseAnterior = null;
function iniciarMemoria(){
    _memoriaFaseAnterior = null;
    if (window._unsubMemoria) window._unsubMemoria();
    window._unsubMemoria = window.onSnapshot(refMemoria(), (snap) => {
        const datos = snap.exists() ? snap.data() : null;
        if (datos && datos.fase === 'revelado' && _memoriaFaseAnterior === 'jugando' && window.sfx) window.sfx.revelar();
        _memoriaFaseAnterior = datos ? datos.fase : null;
        _estadoMemoria = datos;
        renderMemoria(datos);
    }, (err) => {
        console.error('Error de Firestore en memoria:', err);
        document.getElementById('contenido-memoria').innerHTML = `<div class="panel texto-centro texto-tenue">⚠️ No se pudo conectar (${err.code || 'error'}).</div>`;
    });
    if (typeof leerRecord === 'function') {
        leerRecord('memoria').then(r => { _recordMemoria = r; actualizarChipRecordMemoria(); });
    }
}

let _recordMemoria = 0;
function actualizarChipRecordMemoria(){
    const chip = document.getElementById('chip-record-memoria');
    if (chip && _recordMemoria > 0) chip.innerText = `🏆 Récord: nivel ${_recordMemoria}`;
}

let _intentoLocalMemoria = [];
let _mostrandoSecuenciaMemoria = false;
// Último estado que mandó el listener: los toques redibujan con esto
// en vez de abrir una consulta nueva a Firestore por cada emoji.
let _estadoMemoria = null;

function renderMemoria(estado){
    const cont = document.getElementById('contenido-memoria');
    if (!estado || estado.fase === 'sin_ronda') {
        cont.innerHTML = `<div class="panel texto-centro">
            <p class="texto-tenue">Memoricen la secuencia y reconstrúyanla. La dificultad sube de a poco: 5 → 6 → 7 → 8 → 10.</p>
            <div class="texto-tenue" id="chip-record-memoria" style="margin-bottom:8px;"></div>
            <button class="btn-principal" onclick="nuevaRondaMemoria()">Empezar</button>
        </div>`;
        actualizarChipRecordMemoria();
        return;
    }

    const yaEnvie = !!estado[`intento${miIdentidad === 'nico' ? 'Nico' : 'Carito'}`];

    if (estado.fase === 'revelado') {
        const intentoNico = estado.intentoNico, intentoCarito = estado.intentoCarito;
        const correctasNico = estado.secuencia.filter((e, i) => intentoNico[i] === e).length;
        const correctasCarito = estado.secuencia.filter((e, i) => intentoCarito[i] === e).length;
        let html = `<div class="panel texto-centro logro-animado">
            <div class="texto-tenue">Secuencia real:</div>
            <div style="font-size:1.8rem; margin:8px 0;">${estado.secuencia.join(' ')}</div>
            <div class="texto-tenue">Nico acertó ${correctasNico}/${estado.secuencia.length} · Carito acertó ${correctasCarito}/${estado.secuencia.length}</div>
        </div>
        <button class="btn-principal" onclick="siguienteRondaMemoria(${estado.dificultad})">Siguiente ronda ▶️</button>`;
        cont.innerHTML = html;
        return;
    }

    if (yaEnvie) {
        cont.innerHTML = `<div class="panel texto-centro texto-tenue destello">Enviaste tu intento. Esperando a ${nombreJugador(miRival)}…</div>`;
        return;
    }

    if (_mostrandoSecuenciaMemoria) {
        cont.innerHTML = `<div class="panel texto-centro"><div style="font-size:2.2rem; letter-spacing:8px;" class="flip-carta">${estado.secuencia.join(' ')}</div>
            <p class="texto-tenue" style="margin-top:10px;">Memorizá... 👀</p></div>`;
        return;
    }

    if (!estado[`vista${miIdentidad === 'nico' ? 'Nico' : 'Carito'}`]) {
        cont.innerHTML = `<div class="panel texto-centro">
            <p class="texto-tenue">Dificultad: ${estado.dificultad} emojis.</p>
            <button class="btn-principal" onclick="mostrarSecuenciaMemoria()">👀 Mostrar secuencia (3s)</button>
        </div>`;
        return;
    }

    // Reconstrucción
    let html = `<div class="panel texto-centro">
        <p class="texto-tenue">Tocá los emojis en el orden que recordás (${_intentoLocalMemoria.length}/${estado.dificultad}):</p>
        <div style="font-size:1.5rem; min-height:2em; margin:10px 0;">${_intentoLocalMemoria.join(' ') || '—'}</div>
    </div>
    <div class="panel" style="display:grid; grid-template-columns:repeat(4,1fr); gap:8px;">
        ${POOL_EMOJIS_MEMORIA.map(e => `<button class="btn-secundario" style="font-size:1.4rem; padding:10px 0;" onclick="tocarEmojiMemoria('${e}')">${e}</button>`).join('')}
    </div>
    <div class="btn-fila">
        <button class="btn-secundario" onclick="reiniciarIntentoMemoria()">Reiniciar</button>
        <button class="btn-principal" ${_intentoLocalMemoria.length === estado.dificultad ? '' : 'style="opacity:0.4;" disabled'} onclick="enviarIntentoMemoria()">Enviar</button>
    </div>`;
    cont.innerHTML = html;
}

function mostrarSecuenciaMemoria(){
    vibrarJ(12);
    _mostrandoSecuenciaMemoria = true;
    refrescarVistaMemoria();
    setTimeout(async () => {
        _mostrandoSecuenciaMemoria = false;
        const campo = 'vista' + (miIdentidad === 'nico' ? 'Nico' : 'Carito');
        try { await window.updateDoc(refMemoria(), { [campo]: true }); } catch (e) {}
    }, 3000);
}

function tocarEmojiMemoria(e){
    if (_estadoMemoria && _intentoLocalMemoria.length >= _estadoMemoria.dificultad) return;
    vibrarJ(8);
    if (window.sfx) window.sfx.toque();
    _intentoLocalMemoria.push(e);
    refrescarVistaMemoria();
}
function reiniciarIntentoMemoria(){ _intentoLocalMemoria = []; vibrarJ(8); refrescarVistaMemoria(); }
function refrescarVistaMemoria(){
    if (_estadoMemoria) renderMemoria(_estadoMemoria);
}

function generarSecuenciaMemoria(n){
    const seq = [];
    for (let i = 0; i < n; i++) seq.push(POOL_EMOJIS_MEMORIA[Math.floor(Math.random() * POOL_EMOJIS_MEMORIA.length)]);
    return seq;
}

// Las dos arrancan ronda con una transacción: si los dos tocan casi a
// la vez, el segundo ve que ya hay una ronda en juego y no la pisa con
// otra secuencia (antes uno podía estar memorizando una secuencia que
// el otro reemplazaba un segundo después).
async function nuevaRondaMemoria(){
    vibrarJ(12);
    _intentoLocalMemoria = []; _mostrandoSecuenciaMemoria = false;
    const ref = refMemoria();
    await window.runTransaction(window.db, async (tx) => {
        const snap = await tx.get(ref);
        const data = snap.exists() ? snap.data() : null;
        if (data && data.fase && data.fase !== 'sin_ronda') return;
        tx.set(ref, {
            fase: 'jugando', dificultad: NIVELES_MEMORIA[0], secuencia: generarSecuenciaMemoria(NIVELES_MEMORIA[0]),
            vistaNico: false, vistaCarito: false, intentoNico: null, intentoCarito: null
        });
    });
}

async function siguienteRondaMemoria(dificultadActual){
    vibrarJ(12);
    _intentoLocalMemoria = []; _mostrandoSecuenciaMemoria = false;
    const idx = NIVELES_MEMORIA.indexOf(dificultadActual);
    const siguiente = NIVELES_MEMORIA[Math.min(idx + 1, NIVELES_MEMORIA.length - 1)];
    const ref = refMemoria();
    const avanzo = await window.runTransaction(window.db, async (tx) => {
        const snap = await tx.get(ref);
        const data = snap.exists() ? snap.data() : null;
        if (!data || data.fase !== 'revelado' || data.dificultad !== dificultadActual) return false;
        tx.set(ref, {
            fase: 'jugando', dificultad: siguiente, secuencia: generarSecuenciaMemoria(siguiente),
            vistaNico: false, vistaCarito: false, intentoNico: null, intentoCarito: null
        });
        return true;
    });
    if (avanzo && typeof actualizarRecordSiSupera === 'function') {
        actualizarRecordSiSupera('memoria', dificultadActual);
    }
}

async function enviarIntentoMemoria(){
    vibrarJ([15, 30, 15]);
    const campo = miIdentidad === 'nico' ? 'intentoNico' : 'intentoCarito';
    const ref = refMemoria();
    // Transacción: si los dos envían casi al mismo tiempo, una lectura
    // suelta puede no ver todavía el intento del otro y ninguno de los
    // dos dispara "revelado" — la ronda queda trabada en "Esperando…"
    // para siempre, sin ningún timeout que la rescate.
    await window.runTransaction(window.db, async (tx) => {
        const snap = await tx.get(ref);
        const data = snap.data();
        if (!data || data.fase !== 'jugando' || data[campo]) return;
        const otro = miIdentidad === 'nico' ? data.intentoCarito : data.intentoNico;
        tx.update(ref, { [campo]: [..._intentoLocalMemoria], ...(otro ? { fase: 'revelado' } : {}) });
    });
}
