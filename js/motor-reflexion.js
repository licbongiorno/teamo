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

// Las preguntas propias y las respuestas las escribe la gente: se
// escapan antes de meterlas en el HTML.
function _escaparHtmlReflexion(t){
    return String(t ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function _colReflexion(){ return window.collection(window.db, 'juegos'); }
function _refReflexionCarta(id){ return window.doc(window.db, 'juegos', id); }

function iniciarReflexionGenerico(juegoId){
    // Link directo a una pregunta (el que se manda por WhatsApp):
    // juegos.html?juego=<id>&carta=<idCarta> abre esa ronda al toque.
    const params = new URLSearchParams(window.location.search);
    const cartaPedida = params.get('carta');
    if (cartaPedida && params.get('juego') === juegoId) {
        params.delete('carta');
        history.replaceState(null, '', '?' + params.toString());
        abrirCartaReflexion(juegoId, cartaPedida);
        return;
    }
    mostrarListaReflexion(juegoId);
}

function _fechaLocalReflexion(){
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

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
    let botonNuevo = '';
    if (cfg.unaPorDia) {
        const hoy = cartas.find(c => c.fecha === _fechaLocalReflexion());
        const yaRespondi = hoy && hoy.respuestas?.[miIdentidad];
        botonNuevo = `<button class="btn-principal" onclick="crearCartaReflexion('${juegoId}')">${!hoy ? '☀️ Ver la pregunta de hoy' : (yaRespondi ? '☀️ Abrir la pregunta de hoy' : '☀️ Responder la pregunta de hoy')}</button>`;
    } else if (cfg.banco && cfg.banco.length) {
        botonNuevo = `<button class="btn-principal" onclick="crearCartaReflexion('${juegoId}')">${cfg.botonNuevo || 'Nueva ronda'}</button>`;
    }
    let html = `<div class="panel texto-centro">
        <p class="texto-tenue">${cfg.instrucciones}</p>
        ${botonNuevo}
    </div>`;
    if (cfg.permitePropia) {
        html += `<div class="panel">
            <p class="texto-tenue" style="margin:0 0 8px;">✍️ O escribí tu propia pregunta para ${nombreJugador(miRival)}:</p>
            <textarea id="input-propia-${juegoId}" rows="2" maxlength="300" placeholder="${cfg.placeholderPropia || '¿Qué le querés preguntar?'}"
                style="width:100%; box-sizing:border-box; background:rgba(255,255,255,0.06); border:1px solid var(--borde); border-radius:14px; padding:10px; color:var(--texto); font-family:var(--fuente-texto); font-size:0.92rem; resize:vertical; margin-bottom:8px;"></textarea>
            <button class="btn-secundario" onclick="crearPreguntaPropiaReflexion('${juegoId}')">Crear pregunta</button>
            <div id="error-propia-${juegoId}" class="texto-tenue" style="font-size:0.8rem; margin-top:6px;"></div>
        </div>`;
    }
    // Juegos de opciones: marcador de cuántas veces coincidieron.
    if (cfg.tipo === 'opciones') {
        const reveladas = cartas.filter(c => c.fase === 'revelado' && c.respuestas);
        if (reveladas.length) {
            const coinciden = reveladas.filter(c => c.respuestas.nico === c.respuestas.carito).length;
            html += `<div class="panel texto-centro"><b>🎯 Coincidieron en ${coinciden} de ${reveladas.length}</b> <span class="texto-tenue">(${Math.round(coinciden * 100 / reveladas.length)}%)</span></div>`;
        }
    }
    if (cartas.length) {
        html += `<div class="lista-escrituras">`;
        cartas.forEach(c => {
            const estadoTexto = c.fase === 'revelado' ? 'Revelada' : 'Respondiendo';
            const preview = typeof c.pregunta === 'string' ? c.pregunta : (c.pregunta?.texto || '');
            html += `<div class="item-escritura" onclick="abrirCartaReflexion('${juegoId}','${c.id}')">
                <div class="info-escritura"><div class="titulo-escritura">${_escaparHtmlReflexion(preview.length > 60 ? preview.slice(0, 60) + '…' : preview)}</div>
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
    if (window.sfx) window.sfx.cartaFlip();
    const cfg = window.CONFIG_REFLEXION[juegoId];
    if (cfg.unaPorDia) {
        // Una sola pregunta por día, la misma para los dos: el id del
        // documento es la fecha, y se crea en una transacción para que
        // si los dos la abren a la vez no queden dos preguntas distintas.
        const fecha = _fechaLocalReflexion();
        const id = `reflexion-${juegoId}-${fecha}`;
        const ref = _refReflexionCarta(id);
        const dias = Math.floor(new Date(fecha + 'T12:00:00').getTime() / 86400000);
        const pregunta = cfg.banco[(dias * 7919) % cfg.banco.length];
        try {
            await window.runTransaction(window.db, async (tx) => {
                const snap = await tx.get(ref);
                if (snap.exists()) return;
                tx.set(ref, {
                    tipo: 'reflexion-' + juegoId, pregunta, fecha, creadaEn: Date.now(), fase: 'respondiendo',
                    respuestas: { nico: null, carito: null }, sorteo: null
                });
            });
        } catch (e) { console.error('No se pudo crear la pregunta del día:', e); return; }
        abrirCartaReflexion(juegoId, id);
        return;
    }
    const pregunta = cfg.banco[Math.floor(Math.random() * cfg.banco.length)];
    const docRef = await window.addDoc(_colReflexion(), {
        tipo: 'reflexion-' + juegoId, pregunta, creadaEn: Date.now(), fase: 'respondiendo',
        respuestas: { nico: null, carito: null }, sorteo: null
    });
    abrirCartaReflexion(juegoId, docRef.id);
}

async function crearPreguntaPropiaReflexion(juegoId){
    const input = document.getElementById('input-propia-' + juegoId);
    const texto = (input?.value || '').trim();
    const error = document.getElementById('error-propia-' + juegoId);
    if (texto.length < 5) { if (error) error.innerText = 'Escribí una pregunta un poco más larga.'; return; }
    vibrarJ(12);
    if (window.sfx) window.sfx.cartaFlip();
    try {
        const docRef = await window.addDoc(_colReflexion(), {
            tipo: 'reflexion-' + juegoId, pregunta: texto, autor: miIdentidad, creadaEn: Date.now(), fase: 'respondiendo',
            respuestas: { nico: null, carito: null }, sorteo: null
        });
        abrirCartaReflexion(juegoId, docRef.id);
    } catch (e) {
        console.error('No se pudo crear la pregunta propia:', e);
        if (error) error.innerText = `⚠️ No se pudo guardar (${e.code || 'error'}). Probá de nuevo.`;
    }
}

function abrirCartaReflexion(juegoId, id){
    vibrarJ(10);
    if (window['_unsubReflexionLista_' + juegoId]) { window['_unsubReflexionLista_' + juegoId](); window['_unsubReflexionLista_' + juegoId] = null; }
    if (window['_unsubReflexionActual_' + juegoId]) window['_unsubReflexionActual_' + juegoId]();
    window['_reflexionActualId_' + juegoId] = id;
    let faseAnterior = null;
    window['_unsubReflexionActual_' + juegoId] = window.onSnapshot(_refReflexionCarta(id), (snap) => {
        if (!snap.exists()) { mostrarListaReflexion(juegoId); return; }
        const datos = snap.data();
        // Sonido de revelación sólo en la transición real (no al reabrir
        // una ronda que ya estaba revelada de antes): así suena para los
        // dos, cada uno en su propio dispositivo, apenas se completa.
        if (faseAnterior === 'respondiendo' && datos.fase === 'revelado') {
            if (window.sfx) window.sfx.revelar();
            const cfg = window.CONFIG_REFLEXION[juegoId];
            if (cfg.tipo === 'opciones' && datos.respuestas.nico === datos.respuestas.carito && window.fx) window.fx.confeti();
        }
        faseAnterior = datos.fase;
        renderCartaReflexion(juegoId, { id: snap.id, ...datos });
    }, (err) => console.error(`Error de Firestore en carta ${juegoId}:`, err));
}

function renderCartaReflexion(juegoId, c){
    const cfg = window.CONFIG_REFLEXION[juegoId];
    window['_reflexionCartaActual_' + juegoId] = c;
    const cont = document.getElementById('contenido-' + juegoId);
    const preguntaTexto = typeof c.pregunta === 'string' ? c.pregunta : c.pregunta.texto;
    let html = `<button class="btn-secundario" style="margin-bottom:12px;" onclick="mostrarListaReflexion('${juegoId}')">⬅️ Todas las rondas</button>
        <div class="panel flip-carta">${c.autor ? `<div class="texto-tenue" style="font-size:0.75rem; margin-bottom:6px;">✍️ Pregunta de ${nombreJugador(c.autor)}</div>` : ''}<p style="font-family:var(--fuente-titulo); font-size:1.2rem; line-height:1.35; margin:0;">${_escaparHtmlReflexion(preguntaTexto)}</p></div>`;

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
        // Mientras el otro no respondió, se le puede mandar la pregunta
        // por WhatsApp (por si no está mirando la app en este momento).
        if (!c.respuestas[miRival] && NUMEROS_WHATSAPP_PAREJA[miRival]) {
            html += `<div class="panel texto-centro">
                <button class="btn-secundario" style="display:flex; align-items:center; justify-content:center; gap:8px;" onclick="mandarPreguntaWhatsApp('${juegoId}')">
                    <svg class="icono-svg" style="color:#25D366;"><use href="#icono-whatsapp"></use></svg>
                    Mandarle la pregunta a ${nombreJugador(miRival)}
                </button>
            </div>`;
        }
    } else if (c.fase === 'revelado') {
        html += `<div class="panel reflexion-reveal">
            <span class="texto-tenue" style="font-size:0.75rem;">Nico:</span><p style="margin:4px 0 12px;">${_escaparHtmlReflexion(c.respuestas.nico)}</p>
            <span class="texto-tenue" style="font-size:0.75rem;">Carito:</span><p style="margin:4px 0;">${_escaparHtmlReflexion(c.respuestas.carito)}</p>
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
        if (cfg.compartirWhatsApp && cfg.numerosWhatsApp) {
            html += `<div class="panel texto-centro">
                <button class="btn-secundario" style="display:flex; align-items:center; justify-content:center; gap:8px;" onclick="compartirReflexionWhatsApp('${juegoId}', miRival)">
                    <svg class="icono-svg" style="color:#25D366;"><use href="#icono-whatsapp"></use></svg>
                    Mandarle esto a ${nombreJugador(miRival)}
                </button>
            </div>`;
        }
    }
    cont.innerHTML = html;
}

// Números para los botones de WhatsApp de todos los juegos de este
// motor (los mismos que usan js/inicio/preguntas.js y el ticket).
// NUMEROS_WHATSAPP_PAREJA vive en js/te-toca.js (cargado en las dos páginas).

function mandarPreguntaWhatsApp(juegoId){
    vibrarJ(10);
    const c = window['_reflexionCartaActual_' + juegoId];
    const numero = NUMEROS_WHATSAPP_PAREJA[miRival];
    if (!c || !numero) return;
    const pregunta = typeof c.pregunta === 'string' ? c.pregunta : (c.pregunta?.texto || '');
    const opciones = Array.isArray(c.pregunta?.opciones) ? '\n' + c.pregunta.opciones.map(o => `• ${o}`).join('\n') : '';
    const juego = (window.JUEGOS || []).find(j => j.id === juegoId);
    // Si es un juego de juegos.html, el link abre directo esta pregunta.
    const enlace = juego
        ? `${location.origin}${location.pathname}?juego=${encodeURIComponent(juegoId)}&carta=${encodeURIComponent(c.id)}`
        : location.href.split('#')[0];
    const texto = `💌 ${nombreJugador(miIdentidad)} te mandó una pregunta${juego ? ` de "${juego.nombre}"` : ''}:\n\n${pregunta}${opciones}\n\nRespondela en la app y revelamos juntos: ${enlace}`;
    window.open(`https://wa.me/${numero}?text=${encodeURIComponent(texto)}`, '_blank');
}

function compartirReflexionWhatsApp(juegoId, destinatario){
    vibrarJ(10);
    const cfg = window.CONFIG_REFLEXION[juegoId];
    const numero = cfg.numerosWhatsApp && cfg.numerosWhatsApp[destinatario];
    if (!numero) return;
    const contNodo = document.getElementById('contenido-' + juegoId);
    if (!contNodo) return;
    const preguntaEl = contNodo.querySelector('.flip-carta p');
    const parrafos = contNodo.querySelectorAll('.reflexion-reveal p');
    const pregunta = preguntaEl ? preguntaEl.innerText : '';
    const respNico = parrafos[0] ? parrafos[0].innerText : '';
    const respCarito = parrafos[1] ? parrafos[1].innerText : '';
    const texto = `${pregunta}\n\nNico: ${respNico}\nCarito: ${respCarito}`;
    const url = `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`;
    window.open(url, '_blank');
}

async function responderReflexionTexto(juegoId){
    const input = document.getElementById('input-reflexion-' + juegoId);
    const texto = input.value.trim();
    if (!texto) return;
    await responderReflexion(juegoId, texto);
}

async function responderReflexion(juegoId, valor){
    vibrarJ(12);
    if (window.sfx) window.sfx.click();
    const id = window['_reflexionActualId_' + juegoId];
    if (!id) return;
    const ref = _refReflexionCarta(id);
    // Transacción: antes se leía "respuestas", se le agregaba la mía y
    // se escribía el objeto entero. Si los dos respondían casi a la vez,
    // cada uno escribía su versión sin la respuesta del otro: una se
    // perdía y la ronda quedaba "respondiendo" para siempre.
    let ambos = false;
    try {
        await window.runTransaction(window.db, async (tx) => {
            ambos = false;
            const snap = await tx.get(ref);
            const data = snap.exists() ? snap.data() : null;
            if (!data || data.fase !== 'respondiendo' || data.respuestas?.[miIdentidad]) return;
            const respuestas = { ...data.respuestas, [miIdentidad]: valor };
            ambos = !!(respuestas.nico && respuestas.carito);
            tx.update(ref, { respuestas, ...(ambos ? { fase: 'revelado' } : {}) });
        });
    } catch (e) {
        console.error('No se pudo guardar la respuesta:', e);
        return;
    }
    if (ambos && typeof registrarEvento === 'function') {
        const cfg = window.CONFIG_REFLEXION[juegoId];
        registrarEvento('reflexion_completada', `Revelaron una ronda de ${cfg.nombreJuego || juegoId}`);
    }
}

async function sortearReflexion(juegoId){
    vibrarJ([15, 30, 15]);
    if (window.sfx) window.sfx.dado();
    const id = window['_reflexionActualId_' + juegoId];
    const ref = _refReflexionCarta(id);
    // Transacción: si los dos tocan "que decida la suerte" a la vez,
    // vale el primer sorteo (antes el segundo pisaba al primero y el
    // resultado cambiaba frente a los ojos del otro).
    const moneda = Math.random() < 0.5 ? 'nico' : 'carito';
    await window.runTransaction(window.db, async (tx) => {
        const snap = await tx.get(ref);
        const data = snap.exists() ? snap.data() : null;
        if (!data || data.sorteo) return;
        tx.update(ref, { sorteo: data.respuestas[moneda] });
    }).catch(e => console.error('No se pudo sortear:', e));
}
