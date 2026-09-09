// ==================== EL REFUGIO ====================
// Usa el sistema de puntos compartido (js/puntos.js): la "moneda" es
// la suma de puntos de Nico + Carito. Comprar un elemento resta esos
// puntos del pozo compartido.
const FILAS_REFUGIO = 4, COLS_REFUGIO = 6;
const CATALOGO_REFUGIO = [
    { id: 'pergola', nombre: 'Pérgola de madera', emoji: '🛖', costo: 10 },
    { id: 'piso', nombre: 'Piso de microcemento', emoji: '⬜', costo: 5 },
    { id: 'planta', nombre: 'Planta', emoji: '🪴', costo: 3 },
    { id: 'luz', nombre: 'Luces cálidas', emoji: '✨', costo: 4 },
];

function refRefugio(){ return window.doc(window.db, 'juegos', 'refugio'); }

function iniciarRefugio(){
    if (window._unsubRefugio) window._unsubRefugio();
    window._unsubRefugio = window.onSnapshot(refRefugio(), (snap) => {
        window._refugioEstado = snap.exists() ? snap.data() : { elementos: [] };
        renderRefugio();
    }, (err) => {
        console.error('Error de Firestore en refugio:', err);
        document.getElementById('contenido-refugio').innerHTML = `<div class="panel texto-centro texto-tenue">⚠️ No se pudo conectar (${err.code || 'error'}).</div>`;
    });
    if (window._unsubPuntosRefugio) window._unsubPuntosRefugio();
    window._unsubPuntosRefugio = window.escucharPuntos((p) => { window._refugioPuntos = p; renderRefugio(); });
}

let _elementoSeleccionadoRefugio = null;

function renderRefugio(){
    const cont = document.getElementById('contenido-refugio');
    const estado = window._refugioEstado || { elementos: [] };
    const puntos = window._refugioPuntos || { nico: 0, carito: 0 };
    const totalPuntos = (puntos.nico || 0) + (puntos.carito || 0);
    const elementos = estado.elementos || [];

    let html = `<div class="panel texto-centro">
        <p class="texto-tenue">Diseñen juntos el patio con los puntos que van ganando en otros juegos.</p>
        <div style="font-size:1.1rem; margin-top:6px;">💰 ${totalPuntos} puntos disponibles</div>
    </div>`;

    html += `<div class="panel"><div class="texto-tenue" style="margin-bottom:8px;">Catálogo (elegí y después tocá una celda del lado derecho):</div>
        <div style="display:flex; flex-wrap:wrap; gap:8px;">
        ${CATALOGO_REFUGIO.map(item => `<button class="btn-secundario ${_elementoSeleccionadoRefugio === item.id ? 'opcion-elegida' : ''}" style="width:auto; padding:8px 10px;" onclick="seleccionarItemRefugio('${item.id}')">${item.emoji} ${item.nombre} (${item.costo})</button>`).join('')}
        </div></div>`;

    html += `<div class="tablero-juego" style="grid-template-columns:repeat(${COLS_REFUGIO},1fr); max-width:360px; margin:0 auto;">`;
    for (let f = 0; f < FILAS_REFUGIO; f++) {
        for (let c = 0; c < COLS_REFUGIO; c++) {
            const i = f * COLS_REFUGIO + c;
            const permitido = c >= COLS_REFUGIO / 2; // sólo el lado derecho
            const elemento = elementos.find(e => e.celda === i);
            const item = elemento ? CATALOGO_REFUGIO.find(it => it.id === elemento.tipo) : null;
            html += `<div class="casilla-tablero ${permitido ? 'casilla-clara' : 'casilla-oscura'}" style="${permitido ? 'cursor:pointer;' : 'opacity:0.35;'}" onclick="${permitido ? `colocarEnRefugio(${i})` : ''}">${item ? item.emoji : ''}</div>`;
        }
    }
    html += `</div>`;
    cont.innerHTML = html;
}

function seleccionarItemRefugio(id){
    vibrarJ(10);
    _elementoSeleccionadoRefugio = _elementoSeleccionadoRefugio === id ? null : id;
    renderRefugio();
}

async function colocarEnRefugio(celda){
    if (!_elementoSeleccionadoRefugio) return;
    const item = CATALOGO_REFUGIO.find(it => it.id === _elementoSeleccionadoRefugio);
    const puntos = window._refugioPuntos || { nico: 0, carito: 0 };
    const total = (puntos.nico || 0) + (puntos.carito || 0);
    if (total < item.costo) { vibrarJ([10, 30, 10]); return; }

    const estado = window._refugioEstado || { elementos: [] };
    if ((estado.elementos || []).some(e => e.celda === celda)) return; // celda ocupada

    vibrarJ([15, 30, 15]);
    const nuevosElementos = [...(estado.elementos || []), { tipo: item.id, celda }];
    await window.setDoc(refRefugio(), { elementos: nuevosElementos }, { merge: true });
    await window.sumarPuntos(miIdentidad, -item.costo);
    if (typeof registrarEvento === 'function') {
        registrarEvento('cuidado_compartido', `${nombreJugador(miIdentidad)} agregó ${item.nombre || 'algo'} a El Refugio`);
    }
    _elementoSeleccionadoRefugio = null;
}
