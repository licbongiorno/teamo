// ==================== MEMORIA DE EMOJIS ====================
const POOL_EMOJIS_MEMORIA = ['🍎','🍊','🍋','🍇','🍓','🍉','🍑','🍒','🌸','⭐','🌙','☀️','💙','💗','🎈','🔥'];
const NIVELES_MEMORIA = [5, 6, 7, 8, 10];

function refMemoria(){ return window.doc(window.db, 'juegos', 'memoria'); }

function iniciarMemoria(){
    if (window._unsubMemoria) window._unsubMemoria();
    window._unsubMemoria = window.onSnapshot(refMemoria(), (snap) => {
        renderMemoria(snap.exists() ? snap.data() : null);
    }, (err) => {
        console.error('Error de Firestore en memoria:', err);
        document.getElementById('contenido-memoria').innerHTML = `<div class="panel texto-centro texto-tenue">⚠️ No se pudo conectar (${err.code || 'error'}).</div>`;
    });
}

let _intentoLocalMemoria = [];
let _mostrandoSecuenciaMemoria = false;

function renderMemoria(estado){
    const cont = document.getElementById('contenido-memoria');
    if (!estado || estado.fase === 'sin_ronda') {
        cont.innerHTML = `<div class="panel texto-centro">
            <p class="texto-tenue">Memoricen la secuencia y reconstrúyanla. La dificultad sube de a poco: 5 → 6 → 7 → 8 → 10.</p>
            <button class="btn-principal" onclick="nuevaRondaMemoria()">Empezar</button>
        </div>`;
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
    vibrarJ(8);
    _intentoLocalMemoria.push(e);
    refrescarVistaMemoria();
}
function reiniciarIntentoMemoria(){ _intentoLocalMemoria = []; vibrarJ(8); refrescarVistaMemoria(); }
async function refrescarVistaMemoria(){
    const snap = await new Promise(res => { const u = window.onSnapshot(refMemoria(), s => { u(); res(s); }); });
    if (snap.exists()) renderMemoria(snap.data());
}

function generarSecuenciaMemoria(n){
    const seq = [];
    for (let i = 0; i < n; i++) seq.push(POOL_EMOJIS_MEMORIA[Math.floor(Math.random() * POOL_EMOJIS_MEMORIA.length)]);
    return seq;
}

async function nuevaRondaMemoria(){
    vibrarJ(12);
    _intentoLocalMemoria = []; _mostrandoSecuenciaMemoria = false;
    await window.setDoc(refMemoria(), {
        fase: 'jugando', dificultad: NIVELES_MEMORIA[0], secuencia: generarSecuenciaMemoria(NIVELES_MEMORIA[0]),
        vistaNico: false, vistaCarito: false, intentoNico: null, intentoCarito: null
    });
}

async function siguienteRondaMemoria(dificultadActual){
    vibrarJ(12);
    _intentoLocalMemoria = []; _mostrandoSecuenciaMemoria = false;
    const idx = NIVELES_MEMORIA.indexOf(dificultadActual);
    const siguiente = NIVELES_MEMORIA[Math.min(idx + 1, NIVELES_MEMORIA.length - 1)];
    await window.setDoc(refMemoria(), {
        fase: 'jugando', dificultad: siguiente, secuencia: generarSecuenciaMemoria(siguiente),
        vistaNico: false, vistaCarito: false, intentoNico: null, intentoCarito: null
    });
}

async function enviarIntentoMemoria(){
    vibrarJ([15, 30, 15]);
    const campo = miIdentidad === 'nico' ? 'intentoNico' : 'intentoCarito';
    const snap = await new Promise(res => { const u = window.onSnapshot(refMemoria(), s => { u(); res(s); }); });
    const data = snap.data();
    const otro = miIdentidad === 'nico' ? data.intentoCarito : data.intentoNico;
    await window.updateDoc(refMemoria(), { [campo]: [..._intentoLocalMemoria], ...(otro ? { fase: 'revelado' } : {}) });
}
