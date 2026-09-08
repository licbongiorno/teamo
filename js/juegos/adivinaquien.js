// ==================== ADIVINA QUIÉN (EMOJIS) ====================
const POOL_ADIVINAQUIEN = [
    '🦁','🐯','🐻','🐼','🦊','🐺','🐷','🐸','🦉','🦄',
    '👨‍🚀','👩‍🚒','👨‍⚕️','👩‍🍳','🧙','🧛','🧜','🥷','🤴','👸'
];

function refAdivinaQuien(){ return window.doc(window.db, 'juegos', 'adivinaquien'); }

function iniciarAdivinaQuien(){
    if (window._unsubAdivinaQuien) window._unsubAdivinaQuien();
    window._unsubAdivinaQuien = window.onSnapshot(refAdivinaQuien(), (snap) => {
        renderAdivinaQuien(snap.exists() ? snap.data() : null);
    }, (err) => {
        console.error('Error de Firestore en adivinaquien:', err);
        document.getElementById('contenido-adivinaquien').innerHTML = `<div class="panel texto-centro texto-tenue">⚠️ No se pudo conectar (${err.code || 'error'}).</div>`;
    });
}

let _descartadosAQ = new Set();
let _modoArriesgoAQ = false;

function renderAdivinaQuien(estado){
    const cont = document.getElementById('contenido-adivinaquien');
    if (!estado || estado.fase === 'sin_partida') {
        _descartadosAQ = new Set(); _modoArriesgoAQ = false;
        cont.innerHTML = `<div class="panel texto-centro">
            <p class="texto-tenue">Cada uno recibe un personaje secreto. Pregúntense de sí/no por el chat y arriesguen cuando estén seguros.</p>
            <button class="btn-principal" onclick="nuevaPartidaAdivinaQuien()">Empezar partida</button>
        </div>`;
        return;
    }

    if (estado.fase === 'terminado') {
        cont.innerHTML = `<div class="panel texto-centro logro-animado">
            <div style="font-size:1.2rem; margin-bottom:8px;">${estado.ganador === 'empate' ? '🤝 Empate' : `🏆 ¡Ganó ${nombreJugador(estado.ganador)}!`}</div>
            <div class="texto-tenue">El personaje de Nico era ${estado.secretoNico} · El de Carito era ${estado.secretoCarito}</div>
            <button class="btn-principal" style="margin-top:14px;" onclick="nuevaPartidaAdivinaQuien()">🔁 Jugar de nuevo</button>
        </div>`;
        return;
    }

    const miSecreto = estado[`secreto${miIdentidad === 'nico' ? 'Nico' : 'Carito'}`];
    let html = `<div class="panel texto-centro">
        <div class="texto-tenue">Tu personaje secreto:</div>
        <div style="font-size:2.5rem;" class="latir">${miSecreto}</div>
    </div>`;

    if (_modoArriesgoAQ) {
        html += `<div class="panel texto-centro texto-tenue">Tocá el emoji que creés que tiene ${nombreJugador(miRival)}</div>`;
    }

    html += `<div class="panel" style="display:grid; grid-template-columns:repeat(4,1fr); gap:8px;">`;
    POOL_ADIVINAQUIEN.forEach(e => {
        const descartado = _descartadosAQ.has(e);
        html += `<button class="btn-secundario" style="font-size:1.5rem; padding:10px 0; ${descartado ? 'opacity:0.25; text-decoration:line-through;' : ''}" onclick="tocarEmojiAQ('${e}')">${e}</button>`;
    });
    html += `</div>`;

    html += `<button class="btn-principal ${_modoArriesgoAQ ? '' : ''}" onclick="toggleArriesgoAQ()">${_modoArriesgoAQ ? 'Cancelar' : '🎯 ¡Arriesgar!'}</button>`;

    cont.innerHTML = html;
}

function toggleArriesgoAQ(){
    vibrarJ(12);
    _modoArriesgoAQ = !_modoArriesgoAQ;
    refrescarVistaAQ();
}
function tocarEmojiAQ(e){
    if (_modoArriesgoAQ) { arriesgarAdivinaQuien(e); return; }
    vibrarJ(8);
    if (_descartadosAQ.has(e)) _descartadosAQ.delete(e); else _descartadosAQ.add(e);
    refrescarVistaAQ();
}
async function refrescarVistaAQ(){
    const snap = await new Promise(res => { const u = window.onSnapshot(refAdivinaQuien(), s => { u(); res(s); }); });
    if (snap.exists()) renderAdivinaQuien(snap.data());
}

async function nuevaPartidaAdivinaQuien(){
    vibrarJ(12);
    _descartadosAQ = new Set(); _modoArriesgoAQ = false;
    const barajado = [...POOL_ADIVINAQUIEN].sort(() => Math.random() - 0.5);
    await window.setDoc(refAdivinaQuien(), {
        fase: 'jugando', secretoNico: barajado[0], secretoCarito: barajado[1], ganador: null
    });
}

async function arriesgarAdivinaQuien(emoji){
    vibrarJ([20, 40, 20]);
    _modoArriesgoAQ = false;
    const snap = await new Promise(res => { const u = window.onSnapshot(refAdivinaQuien(), s => { u(); res(s); }); });
    const data = snap.data();
    if (data.fase !== 'jugando') return;
    const secretoRival = data[`secreto${miIdentidad === 'nico' ? 'Carito' : 'Nico'}`];
    const acerte = emoji === secretoRival;
    await window.updateDoc(refAdivinaQuien(), { fase: 'terminado', ganador: acerte ? miIdentidad : miRival });
}
