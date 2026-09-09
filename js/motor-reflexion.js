// ============================================================
// motor-reflexion.js — motor genérico para todos los juegos con la
// forma "aparece una consigna → cada uno responde a solas → se
// revela todo junto". Once game files (dilema, decisiones,
// quehariassi, futuro, maquinatiempo, antesdedormir, album,
// nuncapregunte, conoceme, detective, destino) sólo definen su
// configuración (banco de consignas + textos) y este motor hace
// el resto: listar rondas, guardar en Firestore, revelar, animar.
// ============================================================
window.CONFIG_REFLEXION = window.CONFIG_REFLEXION || {};

function _colReflexion(){ return window.collection(window.db, 'juegos'); }
function _refReflexionCarta(id){ return window.doc(window.db, 'juegos', id); }

function iniciarReflexionGenerico(juegoId){ mostrarListaReflexion(juegoId); }

function mostrarListaReflexion(juegoId){
    const cfg = window.CONFIG_REFLEXION[juegoId];
    if (window['_unsubReflexionActual_' + juegoId]) { window['_unsubReflexionActual_' + juegoId](); window['_unsubReflexionActual_' + juegoId] = null; }
    const cont = document.getElementById('contenido-' + juegoId);
    cont.innerHTML = `<div class="panel texto-centro texto-tenue">Cargando…</div>`;
    if (window['_unsubReflexionLista_' + juegoId]) window['_unsubReflexionLista_' + juegoId]();
    const q = window.query(_colReflexion(), window.where('tipo', '==', 'reflexion-' + juegoId));
    window['_unsubReflexionLista_' + juegoId] = window.onSnapshot(q, (snap) => {
        const cartas = [];
        snap.forEach(d => cartas.push({ id: d.id, ...d.data() }));
        cartas.sort((a, b) => (b.creadaEn || 0) - (a.creadaEn || 0));
        renderListaReflexion(juegoId, cartas);
    }, (err) => {
        console.error(`Error de Firestore en ${juegoId}:`, err);
        cont.innerHTML = `<div class="panel texto-centro texto-tenue">⚠️ No se pudo conectar (${err.code || 'error'}).</div>`;
    });
}

function renderListaReflexion(juegoId, cartas){
    const cfg = window.CONFIG_REFLEXION[juegoId];
    const cont = document.getElementById('contenido-' + juegoId);
    let html = `<div class="panel texto-centro">
        <p class="texto-tenue">${cfg.instrucciones}</p>
        <button class="btn-principal" onclick="crearCartaReflexion('${juegoId}')">${cfg.botonNuevo || 'Nueva ronda'}</button>
    </div>`;
    if (cartas.length) {
        html += `<div class="lista-escrituras">`;
        cartas.forEach(c => {
            const estadoTexto = c.fase === 'revelado' ? 'Revelada' : 'Respondiendo';
            const preview = typeof c.pregunta === 'string' ? c.pregunta : (c.pregunta?.texto || '');
            html += `<div class="item-escritura" onclick="abrirCartaReflexion('${juegoId}','${c.id}')">
                <div class="info-escritura"><div class="titulo-escritura">${preview.length > 60 ? preview.slice(0, 60) + '…' : preview}</div>
                <div class="detalle-escritura">${estadoTexto}</div></div>
                <span class="badge-estado ${c.fase === 'revelado' ? 'badge-terminada' : 'badge-activa'}">${estadoTexto}</span>
            </div>`;
        });
        html += `</div>`;
    } else {
        html += `<div class="panel texto-centro texto-tenue">Todavía no jugaron ninguna ronda.</div>`;
    }
    cont.innerHTML = html;
}

async function crearCartaReflexion(juegoId){
    vibrarJ(12);
    const cfg = window.CONFIG_REFLEXION[juegoId];
    const pregunta = cfg.banco[Math.floor(Math.random() * cfg.banco.length)];
    const docRef = await window.addDoc(_colReflexion(), {
        tipo: 'reflexion-' + juegoId, pregunta, creadaEn: Date.now(), fase: 'respondiendo',
        respuestas: { nico: null, carito: null }, sorteo: null
    });
    abrirCartaReflexion(juegoId, docRef.id);
}

function abrirCartaReflexion(juegoId, id){
    vibrarJ(10);
    if (window['_unsubReflexionLista_' + juegoId]) { window['_unsubReflexionLista_' + juegoId](); window['_unsubReflexionLista_' + juegoId] = null; }
    if (window['_unsubReflexionActual_' + juegoId]) window['_unsubReflexionActual_' + juegoId]();
    window['_reflexionActualId_' + juegoId] = id;
    window['_unsubReflexionActual_' + juegoId] = window.onSnapshot(_refReflexionCarta(id), (snap) => {
        if (!snap.exists()) { mostrarListaReflexion(juegoId); return; }
        renderCartaReflexion(juegoId, { id: snap.id, ...snap.data() });
    }, (err) => console.error(`Error de Firestore en carta ${juegoId}:`, err));
}

function renderCartaReflexion(juegoId, c){
    const cfg = window.CONFIG_REFLEXION[juegoId];
    const cont = document.getElementById('contenido-' + juegoId);
    const preguntaTexto = typeof c.pregunta === 'string' ? c.pregunta : c.pregunta.texto;
    let html = `<button class="btn-secundario" style="margin-bottom:12px;" onclick="mostrarListaReflexion('${juegoId}')">⬅️ Todas las rondas</button>
        <div class="panel flip-carta"><p style="font-family:var(--fuente-titulo); font-size:1.2rem; line-height:1.35; margin:0;">${preguntaTexto}</p></div>`;

    if (c.fase === 'respondiendo') {
        if (!c.respuestas[miIdentidad]) {
            if (cfg.tipo === 'opciones') {
                const opciones = c.pregunta.opciones;
                html += `<div class="panel">${opciones.map(op => `<button class="btn-secundario" style="margin-bottom:8px; text-align:left;" onclick="responderReflexion('${juegoId}', this.dataset.valor)" data-valor="${op.replace(/"/g, '&quot;')}">${op}</button>`).join('')}</div>`;
            } else {
                html += `<div class="panel">
                    <textarea id="input-reflexion-${juegoId}" rows="4" placeholder="${cfg.placeholder || 'Tu respuesta...'}" maxlength="600"
                        style="width:100%; box-sizing:border-box; background:rgba(255,255,255,0.06); border:1px solid var(--borde); border-radius:14px; padding:12px; color:var(--texto); font-family:var(--fuente-texto); font-size:0.92rem; resize:vertical; margin-bottom:10px;"></textarea>
                    <button class="btn-principal" onclick="responderReflexionTexto('${juegoId}')">Enviar</button>
                </div>`;
            }
        } else {
            html += `<div class="panel texto-centro texto-tenue destello">Ya respondiste. Esperando a ${nombreJugador(miRival)}…</div>`;
        }
    } else if (c.fase === 'revelado') {
        html += `<div class="panel reflexion-reveal">
            <span class="texto-tenue" style="font-size:0.75rem;">Nico:</span><p style="margin:4px 0 12px;">${c.respuestas.nico}</p>
            <span class="texto-tenue" style="font-size:0.75rem;">Carito:</span><p style="margin:4px 0;">${c.respuestas.carito}</p>
        </div>`;
        if (cfg.tipo === 'opciones') {
            const coincide = c.respuestas.nico === c.respuestas.carito;
            html += `<div class="panel texto-centro ${coincide ? 'logro-animado' : ''}">${coincide ? '✅ ¡Coincidieron!' : '🤔 Eligieron distinto'}</div>`;
            if (!coincide && cfg.desempatePorSorteo) {
                if (!c.sorteo) {
                    html += `<div class="panel texto-centro"><button class="btn-principal" onclick="sortearReflexion('${juegoId}')">🎲 Que decida la suerte</button></div>`;
                } else {
                    html += `<div class="panel texto-centro logro-animado"><div style="font-size:1.15rem;">🎉 Gana: <b>${c.sorteo}</b></div></div>`;
                }
            }
        } else if (cfg.mensajePostRevelado) {
            html += `<div class="panel texto-centro texto-tenue">${cfg.mensajePostRevelado}</div>`;
        }
    }
    cont.innerHTML = html;
}

async function responderReflexionTexto(juegoId){
    const input = document.getElementById('input-reflexion-' + juegoId);
    const texto = input.value.trim();
    if (!texto) return;
    await responderReflexion(juegoId, texto);
}

async function responderReflexion(juegoId, valor){
    vibrarJ(12);
    const id = window['_reflexionActualId_' + juegoId];
    if (!id) return;
    const ref = _refReflexionCarta(id);
    const snap = await new Promise(res => { const u = window.onSnapshot(ref, s => { u(); res(s); }); });
    const data = snap.data();
    const respuestas = { ...data.respuestas, [miIdentidad]: valor };
    const ambos = respuestas.nico && respuestas.carito;
    await window.updateDoc(ref, { respuestas, ...(ambos ? { fase: 'revelado' } : {}) });
    if (ambos && typeof registrarEvento === 'function') {
        const cfg = window.CONFIG_REFLEXION[juegoId];
        registrarEvento('reflexion_completada', `Revelaron una ronda de ${cfg.nombreJuego || juegoId}`);
    }
}

async function sortearReflexion(juegoId){
    vibrarJ([15, 30, 15]);
    const id = window['_reflexionActualId_' + juegoId];
    const ref = _refReflexionCarta(id);
    const snap = await new Promise(res => { const u = window.onSnapshot(ref, s => { u(); res(s); }); });
    const data = snap.data();
    const elegido = Math.random() < 0.5 ? data.respuestas.nico : data.respuestas.carito;
    await window.updateDoc(ref, { sorteo: elegido });
}
