// ==================== EL ESPEJO ====================
// Cada uno responde a solas, y además intenta predecir qué respondió
// el otro. Se revela todo junto: respuesta real + predicción + qué tan
// cerca estuvieron. No es un diagnóstico, es sólo curiosidad.
const PREGUNTAS_ESPEJO = [
    "¿Qué parte de vos mostrás poco, incluso conmigo?",
    "¿Qué necesitás cuando estás mal, aunque no lo pidas?",
    "¿Qué miedo influye más en tus decisiones sin que te des cuenta?",
    "¿Qué creés que yo no comprendo completamente de vos todavía?",
    "¿Qué te hace sentir orgulloso/a de vos mismo/a que casi nunca decís en voz alta?",
    "¿Qué parte de tu personalidad cambió más en el último año?",
    "¿Qué es algo que te cuesta pedir, aunque lo necesites?",
    "¿Qué rol cumplís sin querer en los grupos donde estás?",
    "¿Qué te hace sentir más vulnerable frente a otra persona?",
    "¿Qué parte de vos creés que se nota más de lo que pensás?",
    "¿Qué necesitás escuchar cuando cometés un error?",
    "¿Qué es algo que aprendiste a esconder desde chico/a?",
    "¿Qué te cuesta más: pedir ayuda o aceptarla cuando te la ofrecen?",
    "¿Qué parte de tu día a día revela más quién sos, sin que lo notes?",
    "¿Qué creés que la gente asume mal de vos al conocerte?",
    "¿Qué te hace sentir en control cuando todo lo demás es incierto?",
    "¿Qué parte de vos se parece más a como eras de chico/a?",
    "¿Qué es lo que más te cuesta perdonarte?",
    "¿Qué necesitás para sentirte realmente escuchado/a?",
    "¿Qué parte tuya se activa cuando sentís que perdés el control de algo?",
];

function refEspejo(id){ return window.doc(window.db, 'juegos', id); }

function iniciarEspejo(){ mostrarListaEspejo(); }

function mostrarListaEspejo(){
    if (window._unsubEspejoActual) { window._unsubEspejoActual(); window._unsubEspejoActual = null; }
    const cont = document.getElementById('contenido-espejo');
    cont.innerHTML = `<div class="panel texto-centro texto-tenue">Cargando…</div>`;
    if (window._unsubEspejoLista) window._unsubEspejoLista();
    const q = window.query(window.collection(window.db, 'juegos'), window.where('tipo', '==', 'espejo-carta'));
    window._unsubEspejoLista = window.onSnapshot(q, (snap) => {
        const cartas = [];
        snap.forEach(d => cartas.push({ id: d.id, ...d.data() }));
        cartas.sort((a, b) => (b.creadaEn || 0) - (a.creadaEn || 0));
        renderListaEspejo(cartas);
    }, (err) => {
        console.error('Error de Firestore en espejo:', err);
        cont.innerHTML = `<div class="panel texto-centro texto-tenue">⚠️ No se pudo conectar (${err.code || 'error'}).</div>`;
    });
}

function renderListaEspejo(cartas){
    const cont = document.getElementById('contenido-espejo');
    let html = `<div class="panel texto-centro">
        <p class="texto-tenue">Los dos responden a solas y también intentan adivinar qué dijo el otro. Se revela todo junto.</p>
        <button class="btn-principal" onclick="crearCartaEspejo()">🪞 Nueva ronda</button>
    </div>`;
    if (cartas.length) {
        html += `<div class="lista-escrituras">`;
        cartas.forEach(c => {
            const estadoTexto = c.fase === 'revelado' ? 'Revelada' : c.fase === 'prediciendo' ? 'Adivinando' : 'Respondiendo';
            html += `<div class="item-escritura" onclick="abrirCartaEspejo('${c.id}')">
                <div class="info-escritura">
                    <div class="titulo-escritura">${c.pregunta.length > 60 ? c.pregunta.slice(0, 60) + '…' : c.pregunta}</div>
                    <div class="detalle-escritura">${estadoTexto}</div>
                </div>
                <span class="badge-estado ${c.fase === 'revelado' ? 'badge-terminada' : 'badge-activa'}">${estadoTexto}</span>
            </div>`;
        });
        html += `</div>`;
    } else {
        html += `<div class="panel texto-centro texto-tenue">Todavía no jugaron ninguna ronda.</div>`;
    }
    cont.innerHTML = html;
}

async function crearCartaEspejo(){
    vibrarJ(12);
    const pregunta = PREGUNTAS_ESPEJO[Math.floor(Math.random() * PREGUNTAS_ESPEJO.length)];
    const docRef = await window.addDoc(window.collection(window.db, 'juegos'), {
        tipo: 'espejo-carta', pregunta, creadaEn: Date.now(), fase: 'respondiendo',
        respuestas: { nico: null, carito: null }, predicciones: { nico: null, carito: null }
    });
    abrirCartaEspejo(docRef.id);
}

function abrirCartaEspejo(id){
    vibrarJ(10);
    if (window._unsubEspejoLista) { window._unsubEspejoLista(); window._unsubEspejoLista = null; }
    if (window._unsubEspejoActual) window._unsubEspejoActual();
    window._cartaEspejoActualId = id;
    window._unsubEspejoActual = window.onSnapshot(refEspejo(id), (snap) => {
        if (!snap.exists()) { mostrarListaEspejo(); return; }
        renderCartaEspejo({ id: snap.id, ...snap.data() });
    }, (err) => console.error('Error de Firestore en carta espejo:', err));
}

function renderCartaEspejo(c){
    const cont = document.getElementById('contenido-espejo');
    let html = `<button class="btn-secundario" style="margin-bottom:12px;" onclick="mostrarListaEspejo()">⬅️ Todas las rondas</button>
    <div class="panel"><p style="font-family:var(--fuente-titulo); font-size:1.25rem; line-height:1.35; margin:0;">${c.pregunta}</p></div>`;

    if (c.fase === 'respondiendo') {
        if (!c.respuestas[miIdentidad]) {
            html += `<div class="panel">
                <textarea id="input-respuesta-espejo" rows="3" placeholder="Tu respuesta, a solas..." maxlength="500"
                    style="width:100%; box-sizing:border-box; background:rgba(255,255,255,0.06); border:1px solid var(--borde); border-radius:14px; padding:12px; color:var(--texto); font-family:var(--fuente-texto); font-size:0.92rem; resize:vertical; margin-bottom:10px;"></textarea>
                <button class="btn-principal" onclick="responderEspejo()">Guardar</button>
            </div>`;
        } else {
            html += `<div class="panel texto-centro texto-tenue">Ya respondiste. Esperando a ${nombreJugador(miRival)}…</div>`;
        }
    } else if (c.fase === 'prediciendo') {
        if (!c.predicciones[miIdentidad]) {
            html += `<div class="panel">
                <p class="texto-tenue" style="margin-bottom:8px;">Ahora intentá adivinar: ¿qué creés que respondió ${nombreJugador(miRival)}?</p>
                <textarea id="input-prediccion-espejo" rows="3" placeholder="Tu predicción..." maxlength="500"
                    style="width:100%; box-sizing:border-box; background:rgba(255,255,255,0.06); border:1px solid var(--borde); border-radius:14px; padding:12px; color:var(--texto); font-family:var(--fuente-texto); font-size:0.92rem; resize:vertical; margin-bottom:10px;"></textarea>
                <button class="btn-principal" onclick="predecirEspejo()">Enviar predicción</button>
            </div>`;
        } else {
            html += `<div class="panel texto-centro texto-tenue">Ya enviaste tu predicción. Esperando a ${nombreJugador(miRival)}…</div>`;
        }
    } else if (c.fase === 'revelado') {
        html += `<div class="panel">
            <span class="texto-tenue" style="font-size:0.75rem;">Respuesta real de Nico:</span>
            <p style="margin:4px 0 10px;">${c.respuestas.nico}</p>
            <span class="texto-tenue" style="font-size:0.75rem;">Lo que predijo Carito sobre Nico:</span>
            <p style="margin:4px 0 0; opacity:0.85;">${c.predicciones.carito}</p>
        </div>
        <div class="panel">
            <span class="texto-tenue" style="font-size:0.75rem;">Respuesta real de Carito:</span>
            <p style="margin:4px 0 10px;">${c.respuestas.carito}</p>
            <span class="texto-tenue" style="font-size:0.75rem;">Lo que predijo Nico sobre Carito:</span>
            <p style="margin:4px 0 0; opacity:0.85;">${c.predicciones.nico}</p>
        </div>`;
    }

    cont.innerHTML = html;
}

async function responderEspejo(){
    const texto = document.getElementById('input-respuesta-espejo').value.trim();
    if (!texto || !window._cartaEspejoActualId) return;
    vibrarJ(12);
    const ref = refEspejo(window._cartaEspejoActualId);
    const snap = await new Promise(res => { const u = window.onSnapshot(ref, s => { u(); res(s); }); });
    const data = snap.data();
    const respuestas = { ...data.respuestas, [miIdentidad]: texto };
    const ambosRespondieron = respuestas.nico && respuestas.carito;
    await window.updateDoc(ref, { respuestas, ...(ambosRespondieron ? { fase: 'prediciendo' } : {}) });
}

async function predecirEspejo(){
    const texto = document.getElementById('input-prediccion-espejo').value.trim();
    if (!texto || !window._cartaEspejoActualId) return;
    vibrarJ([15, 30, 15]);
    const ref = refEspejo(window._cartaEspejoActualId);
    const snap = await new Promise(res => { const u = window.onSnapshot(ref, s => { u(); res(s); }); });
    const data = snap.data();
    const predicciones = { ...data.predicciones, [miIdentidad]: texto };
    const ambosPredijeron = predicciones.nico && predicciones.carito;
    await window.updateDoc(ref, { predicciones, ...(ambosPredijeron ? { fase: 'revelado' } : {}) });
}
