// ==================== RUEDAPREMIOS DE CITAS ====================
const OPCIONES_RUEDAPREMIOS = [
    { texto: 'Elegí una peli sin que el otro proteste 🎬', color: '#a8edea', tipo: 'tierna' },
    { texto: 'Carta de amor sorpresa 💌', color: '#ffb3c6', tipo: 'tierna' },
    { texto: 'Un beso apenas se vean 💋', color: '#ffd8ea', tipo: 'picante' },
    { texto: 'Masaje de 10 minutos 💆', color: '#f5d9a0', tipo: 'picante' },
    { texto: 'Desayuno en la cama 🥐', color: '#a8d8ff', tipo: 'tierna' },
    { texto: 'Un secreto que nunca contaste 🤫', color: '#c9b6ff', tipo: 'picante' },
    { texto: 'Foto random del rollo, sin elegir 📸', color: '#ffb3c6', tipo: 'tierna' },
    { texto: 'Cita sorpresa organizada por el otro 🎁', color: '#a8edea', tipo: 'picante' },
];

function refRuedaPremios(){ return window.doc(window.db, 'juegos', 'ruedapremios'); }
let _ultimaRotacionRuedaPremios = null;

function iniciarRuedaPremios(){
    _ultimaRotacionRuedaPremios = null;
    const cont = document.getElementById('contenido-ruedapremios');
    const gradiente = OPCIONES_RUEDAPREMIOS.map((o, i) => `${o.color} ${i * 45}deg ${(i + 1) * 45}deg`).join(', ');
    cont.innerHTML = `
        <div class="panel texto-centro">
            <p class="texto-tenue">Mitad tiernas 🌸, mitad picantes 🌶️. Giren y cumplan el premio que toque para el próximo encuentro (o ya, si se puede).</p>
            <div class="rueda-container" style="width:min(64vw,240px); aspect-ratio:1; margin:18px auto;">
                <div id="puntero-premios" style="text-align:center; font-size:1.6rem; margin-bottom:-6px; position:relative; z-index:2;">🔻</div>
                <div id="rueda-premios" style="width:100%; height:100%; border-radius:50%; border:4px solid var(--borde);
                    background: conic-gradient(from 0deg, ${gradiente}); transition: transform 4s cubic-bezier(0.17,0.67,0.32,1.01);"></div>
            </div>
            <button class="btn-principal" onclick="girarRuedaPremios()">🎡 Girar</button>
            <div id="mensaje-premios" style="margin-top:12px; font-family:var(--fuente-titulo); font-size:1.2rem; min-height:1.4em;"></div>
        </div>
        <div class="panel">
            <div class="texto-tenue" style="margin-bottom:8px;">Opciones de la rueda:</div>
            <div id="leyenda-premios" style="display:flex; flex-direction:column; gap:6px;">
                ${OPCIONES_RUEDAPREMIOS.map((o, i) => `
                    <div class="item-leyenda" id="leyenda-premios-${i}" style="display:flex; align-items:center; gap:8px; padding:6px 10px; border-radius:10px;">
                        <span style="width:14px; height:14px; border-radius:50%; background:${o.color}; flex-shrink:0;"></span>
                        <span style="font-size:0.85rem;">${o.tipo === 'picante' ? '🌶️' : '🌸'} ${o.texto}</span>
                    </div>`).join('')}
            </div>
        </div>
        <div id="historial-premios" class="panel texto-tenue" style="font-size:0.75rem;"></div>
    `;

    if (window._unsubRuedaPremios) window._unsubRuedaPremios();
    window._unsubRuedaPremios = window.onSnapshot(refRuedaPremios(), (snap) => {
        actualizarRuedaPremios(snap.exists() ? snap.data() : null);
    }, (err) => {
        console.error('Error de Firestore en ruleta:', err);
        cont.innerHTML = `<div class="panel texto-centro texto-tenue">⚠️ No se pudo conectar (${err.code || 'error'}).</div>`;
    });
}

function actualizarRuedaPremios(estado){
    const rueda = document.getElementById('rueda-premios');
    const nuevaRot = estado?.rotacion || 0;
    if (rueda) rueda.style.transform = `rotate(${nuevaRot}deg)`;

    const mensaje = document.getElementById('mensaje-premios');
    document.querySelectorAll('#leyenda-premios .item-leyenda').forEach(el => {
        el.style.background = 'transparent'; el.style.boxShadow = 'none';
    });

    const revelar = (idx) => {
        const item = document.getElementById('leyenda-premios-' + idx);
        if (item) { item.style.background = 'rgba(255,255,255,0.12)'; item.style.boxShadow = '0 0 0 2px var(--rosa)'; }
        if (mensaje) mensaje.innerText = `¡Salió: ${OPCIONES_RUEDAPREMIOS[idx].texto}!`;
    };

    if (_ultimaRotacionRuedaPremios !== null && nuevaRot !== _ultimaRotacionRuedaPremios) {
        if (mensaje) mensaje.innerText = 'Girando…';
        setTimeout(() => { if (estado && estado.ganadorIndice != null) { revelar(estado.ganadorIndice); vibrarJ([15, 30, 15]); } }, 4200);
    } else if (estado && estado.ganadorIndice != null) {
        revelar(estado.ganadorIndice);
    }
    _ultimaRotacionRuedaPremios = nuevaRot;

    const histCont = document.getElementById('historial-premios');
    if (histCont) {
        const hist = (estado?.historial || []).slice().reverse();
        histCont.innerHTML = hist.length
            ? 'Últimos resultados: ' + hist.map(h => h.opcion).join(' · ')
            : '';
    }
}

async function girarRuedaPremios(){
    vibrarJ(12);
    const estado = await new Promise((res) => {
        const u = window.onSnapshot(refRuedaPremios(), s => { u(); res(s.exists() ? s.data() : { rotacion: 0, historial: [] }); });
    });
    const idx = Math.floor(Math.random() * OPCIONES_RUEDAPREMIOS.length);
    const anguloObjetivo = (360 - (idx * 45 + 22.5) + 360) % 360;
    const rotActual = estado.rotacion || 0;
    const nuevaRot = rotActual + 1440 + ((anguloObjetivo - (rotActual % 360) + 360) % 360);
    const hist = [...(estado.historial || []), { opcion: OPCIONES_RUEDAPREMIOS[idx].texto }].slice(-8);
    await window.setDoc(refRuedaPremios(), { rotacion: nuevaRot, ganadorIndice: idx, historial: hist }, { merge: true });
    if (typeof registrarEvento === 'function') {
        registrarEvento('cuidado_compartido', `Giraron la Rueda de Premios: ${OPCIONES_RUEDAPREMIOS[idx].texto}`);
    }
}
