// ==================== NUESTRO ÁRBOL ====================
const ETAPAS_ARBOL = [
    { hasta: 15, emoji: '🌰', nombre: 'Semilla' },
    { hasta: 35, emoji: '🌱', nombre: 'Brote' },
    { hasta: 60, emoji: '🌿', nombre: 'Árbol pequeño' },
    { hasta: 85, emoji: '🌳', nombre: 'Árbol grande' },
    { hasta: Infinity, emoji: '🌸', nombre: 'Árbol florecido' },
];

function refArbol(){ return window.doc(window.db, 'juegos', 'arbol'); }

function iniciarArbol(){
    if (window._unsubArbol) window._unsubArbol();
    window._unsubArbol = window.onSnapshot(refArbol(), (snap) => {
        renderArbol(snap.exists() ? snap.data() : null);
    }, (err) => {
        console.error('Error de Firestore en arbol:', err);
        document.getElementById('contenido-arbol').innerHTML = `<div class="panel texto-centro texto-tenue">⚠️ No se pudo conectar (${err.code || 'error'}).</div>`;
    });
}

function etapaArbol(puntos){ return ETAPAS_ARBOL.find(e => puntos <= e.hasta); }

function renderArbol(estado){
    const cont = document.getElementById('contenido-arbol');
    const puntos = estado?.puntos || 0;
    const etapa = etapaArbol(puntos);
    const idxEtapa = ETAPAS_ARBOL.indexOf(etapa);
    const historial = (estado?.historial || []).slice(-6).reverse();

    cont.innerHTML = `
        <div class="panel texto-centro">
            <div class="escena-jardin latir">${etapa.emoji}</div>
            <div style="font-family:var(--fuente-titulo); font-size:1.2rem; margin-bottom:6px;">${etapa.nombre}</div>
            <div class="barra-progreso-jardin"><div class="relleno-progreso-jardin barra-crecer" style="width:${Math.min(100, (idxEtapa + 1) * 20)}%;"></div></div>
            <div class="texto-tenue" style="margin-top:6px;">${puntos} puntos de cariño acumulados</div>
        </div>
        <div class="panel">
            <textarea id="input-lindo-arbol" rows="2" placeholder="Decile algo lindo (hace crecer el árbol)..." maxlength="300"
                style="width:100%; box-sizing:border-box; background:rgba(255,255,255,0.06); border:1px solid var(--borde); border-radius:14px; padding:10px; color:var(--texto); font-family:var(--fuente-texto); font-size:0.88rem; resize:vertical; margin-bottom:8px;"></textarea>
            <button class="btn-principal" onclick="regarConLindoArbol()">❤️ Decir algo lindo (+3)</button>
        </div>
        <div class="btn-fila">
            <button class="btn-secundario" onclick="cuidarArbol('riego')">💧 Regarlo (+2)</button>
            <button class="btn-secundario" onclick="cuidarArbol('logro')">🍎 Marcar un logro (+5)</button>
        </div>
        <div class="panel historial-kaizen" style="margin-top:14px;">
            ${historial.length ? historial.map(h => h.texto).join('<br>') : 'Todavía no hicieron crecer el árbol hoy.'}
        </div>
    `;
}

async function agregarPuntosArbol(cantidad, mensaje){
    vibrarJ([12, 20, 12]);
    const snap = await new Promise(res => { const u = window.onSnapshot(refArbol(), s => { u(); res(s); }); });
    const data = snap.exists() ? snap.data() : { puntos: 0, historial: [] };
    const historial = [...(data.historial || []), { texto: mensaje, autor: miIdentidad, ts: Date.now() }].slice(-12);
    await window.setDoc(refArbol(), { puntos: (data.puntos || 0) + cantidad, historial }, { merge: true });
    if (typeof registrarEvento === 'function') {
        registrarEvento('cuidado_compartido', `${nombreJugador(miIdentidad)} cuidó Nuestro Árbol: ${mensaje}`);
    }
}

async function regarConLindoArbol(){
    const input = document.getElementById('input-lindo-arbol');
    const texto = input.value.trim();
    if (!texto) return;
    input.value = '';
    await agregarPuntosArbol(3, `${nombreJugador(miIdentidad)}: "${texto}"`);
}
async function cuidarArbol(tipo){
    const mensajes = { riego: `${nombreJugador(miIdentidad)} regó el árbol 💧`, logro: `${nombreJugador(miIdentidad)} marcó un logro 🍎` };
    await agregarPuntosArbol(tipo === 'riego' ? 2 : 5, mensajes[tipo]);
}
