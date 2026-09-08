// ==================== RULETA DE CITAS ====================
const OPCIONES_RULETA = [
    { texto: 'Ver una peli 🎬', color: '#ffb3c6' },
    { texto: 'Charla profunda 💭', color: '#c9b6ff' },
    { texto: 'Jugar algo juntos 🎮', color: '#a8d8ff' },
    { texto: 'Pedir delivery "juntos" 🍔', color: '#a8edea' },
    { texto: 'Playlist a dúo 🎵', color: '#f5d9a0' },
    { texto: 'Mandarnos fotos del día 📸', color: '#ffd8ea' },
];

function refRuleta(){ return window.doc(window.db, 'juegos', 'ruleta'); }
let _ultimaRotacionRuleta = null;

function iniciarRuleta(){
    _ultimaRotacionRuleta = null;
    const cont = document.getElementById('contenido-ruleta');
    const gradiente = OPCIONES_RULETA.map((o, i) => `${o.color} ${i * 60}deg ${(i + 1) * 60}deg`).join(', ');
    cont.innerHTML = `
        <div class="panel texto-centro">
            <p class="texto-tenue">Cualquiera de los dos puede girar. Sale un plan para hoy — o para cuando puedan.</p>
            <div class="rueda-container" style="width:min(64vw,240px); aspect-ratio:1; margin:18px auto;">
                <div id="puntero-rueda" style="text-align:center; font-size:1.6rem; margin-bottom:-6px; position:relative; z-index:2;">🔻</div>
                <div id="rueda-citas" style="width:100%; height:100%; border-radius:50%; border:4px solid var(--borde);
                    background: conic-gradient(from 0deg, ${gradiente}); transition: transform 4s cubic-bezier(0.17,0.67,0.32,1.01);"></div>
            </div>
            <button class="btn-principal" onclick="girarRuleta()">🎡 Girar</button>
            <div id="mensaje-ruleta" style="margin-top:12px; font-family:var(--fuente-titulo); font-size:1.2rem; min-height:1.4em;"></div>
        </div>
        <div class="panel">
            <div class="texto-tenue" style="margin-bottom:8px;">Opciones de la rueda:</div>
            <div id="leyenda-ruleta" style="display:flex; flex-direction:column; gap:6px;">
                ${OPCIONES_RULETA.map((o, i) => `
                    <div class="item-leyenda" id="leyenda-ruleta-${i}" style="display:flex; align-items:center; gap:8px; padding:6px 10px; border-radius:10px;">
                        <span style="width:14px; height:14px; border-radius:50%; background:${o.color}; flex-shrink:0;"></span>
                        <span style="font-size:0.85rem;">${o.texto}</span>
                    </div>`).join('')}
            </div>
        </div>
        <div id="historial-ruleta" class="panel texto-tenue" style="font-size:0.75rem;"></div>
    `;

    if (window._unsubRuleta) window._unsubRuleta();
    window._unsubRuleta = window.onSnapshot(refRuleta(), (snap) => {
        actualizarRuleta(snap.exists() ? snap.data() : null);
    }, (err) => {
        console.error('Error de Firestore en ruleta:', err);
        cont.innerHTML = `<div class="panel texto-centro texto-tenue">⚠️ No se pudo conectar (${err.code || 'error'}).</div>`;
    });
}

function actualizarRuleta(estado){
    const rueda = document.getElementById('rueda-citas');
    const nuevaRot = estado?.rotacion || 0;
    if (rueda) rueda.style.transform = `rotate(${nuevaRot}deg)`;

    const mensaje = document.getElementById('mensaje-ruleta');
    document.querySelectorAll('#leyenda-ruleta .item-leyenda').forEach(el => {
        el.style.background = 'transparent'; el.style.boxShadow = 'none';
    });

    const revelar = (idx) => {
        const item = document.getElementById('leyenda-ruleta-' + idx);
        if (item) { item.style.background = 'rgba(255,255,255,0.12)'; item.style.boxShadow = '0 0 0 2px var(--rosa)'; }
        if (mensaje) mensaje.innerText = `¡Salió: ${OPCIONES_RULETA[idx].texto}!`;
    };

    if (_ultimaRotacionRuleta !== null && nuevaRot !== _ultimaRotacionRuleta) {
        if (mensaje) mensaje.innerText = 'Girando…';
        setTimeout(() => { if (estado && estado.ganadorIndice != null) { revelar(estado.ganadorIndice); vibrarJ([15, 30, 15]); } }, 4200);
    } else if (estado && estado.ganadorIndice != null) {
        revelar(estado.ganadorIndice);
    }
    _ultimaRotacionRuleta = nuevaRot;

    const histCont = document.getElementById('historial-ruleta');
    if (histCont) {
        const hist = (estado?.historial || []).slice().reverse();
        histCont.innerHTML = hist.length
            ? 'Últimos resultados: ' + hist.map(h => h.opcion).join(' · ')
            : '';
    }
}

async function girarRuleta(){
    vibrarJ(12);
    const estado = await new Promise((res) => {
        const u = window.onSnapshot(refRuleta(), s => { u(); res(s.exists() ? s.data() : { rotacion: 0, historial: [] }); });
    });
    const idx = Math.floor(Math.random() * OPCIONES_RULETA.length);
    const anguloObjetivo = (360 - (idx * 60 + 30) + 360) % 360;
    const rotActual = estado.rotacion || 0;
    const nuevaRot = rotActual + 1440 + ((anguloObjetivo - (rotActual % 360) + 360) % 360);
    const hist = [...(estado.historial || []), { opcion: OPCIONES_RULETA[idx].texto }].slice(-8);
    await window.setDoc(refRuleta(), { rotacion: nuevaRot, ganadorIndice: idx, historial: hist }, { merge: true });
}
