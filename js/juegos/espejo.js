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
    "¿Qué es algo que decís que te gusta pero en realidad tolerás?",
    "¿Qué parte de vos se esconde detrás del humor?",
    "¿Qué necesitás sentir para animarte a intentar algo nuevo?",
    "¿Qué parte de tu forma de ser heredaste sin querer de tus padres?",
    "¿Qué te cuesta más soltar: el control o la expectativa?",
    "¿Qué parte de vos aparece sólo cuando estás muy cansado/a?",
    "¿Qué es algo que te gustaría que la gente entendiera de vos sin explicarlo?",
    "¿Qué parte de tu autoestima depende más de la validación externa?",
    "¿Qué necesitás para confiar plenamente en alguien nuevo?",
    "¿Qué parte de vos se activa cuando te sentís criticado/a?",
    "¿Qué es algo que te cuesta reconocer que sentís?",
    "¿Qué parte de tu forma de amar te gustaría entender mejor?",
    "¿Qué necesitás para sentir que un espacio es 'tu lugar seguro'?",
    "¿Qué parte de vos cambia cuando estás con gente que no conocés bien?",
    "¿Qué es algo que idealizás de vos mismo/a que no siempre es real?",
    "¿Qué parte de tu pasado sentís que todavía te define, para bien o para mal?",
    "¿Qué necesitás para poder decir 'no' sin sentir culpa?",
    "¿Qué parte de vos aparece cuando tenés miedo, aunque lo disimules?",
    "¿Qué es algo que sabés de vos mismo/a que casi nadie más sabe?",
    "¿Qué parte de tu identidad sentís que está más en construcción hoy?",
    "¿Qué necesitás para sentir que perteneces a un lugar o grupo?",
    "¿Qué parte de vos se resiste más al cambio?",
    "¿Qué es algo que hacés por costumbre y ya no sabés bien por qué?",
    "¿Qué parte de tu forma de comunicarte creés que es tu mayor fortaleza?",
    "¿Qué necesitás para sentir que fuiste realmente escuchado/a en una discusión?",
    "¿Qué parte de vos aparece más cuando estás enamorado/a?",
    "¿Qué es algo que te cuesta aceptar de tu cuerpo o tu apariencia?",
    "¿Qué parte de tu niñez sentís que sigue viva en vos hoy?",
    "¿Qué necesitás para perdonar a alguien de verdad, no sólo de palabra?",
    "¿Qué parte de vos se hace más chica cuando estás con ciertas personas?",
    "¿Qué es algo que proyectás hacia afuera que no siempre sentís por dentro?",
    "¿Qué parte de tu forma de pensar heredaste de una figura de autoridad de tu vida?",
    "¿Qué necesitás para sentir que estás avanzando, no estancado/a?",
    "¿Qué parte de vos se pone a la defensiva más rápido de lo que quisieras?",
    "¿Qué es algo que te enseñaron a valorar y hoy cuestionás?",
    "¿Qué parte de tu autoimagen se construyó gracias a esta relación?",
    "¿Qué necesitás para sentirte cómodo/a mostrando enojo?",
    "¿Qué parte de vos evita el conflicto a toda costa?",
    "¿Qué es algo que te cuesta admitir que te importa la opinión ajena?",
    "¿Qué parte de tu forma de ser sentís que todavía no mostraste del todo, ni a mí?",
    "¿Qué necesitás para sentir seguridad en una relación, más allá del amor?",
    "¿Qué parte de vos se activa en situaciones de mucha presión?",
    "¿Qué es algo que idealizás del pasado que quizás no era tan así?",
    "¿Qué parte de tu carácter creés que te define más, para bien o para mal?",
    "¿Qué necesitás para sentir que un logro es realmente tuyo?",
    "¿Qué parte de vos se resiste a pedir perdón primero?",
    "¿Qué es algo que hacés para sentirte útil que en el fondo es para sentirte querido/a?",
    "¿Qué parte de tu personalidad creés que atrae a la gente hacia vos?",
    "¿Qué necesitás para animarte a mostrar tristeza frente a otros?",
    "¿Qué parte de vos aparece cuando sentís que decepcionaste a alguien?",
    "¿Qué es algo que hoy hacés distinto a como lo hacía tu familia de origen?",
    "¿Qué parte de tu forma de vincularte creés que viene de una herida vieja?",
    "¿Qué necesitás para sentirte pleno/a en un día común, sin nada especial?",
    "¿Qué parte de vos se ilumina cuando hablás de algo que amás?",
    "¿Qué es algo que te enorgullece de cómo enfrentaste una crisis?",
    "¿Qué parte de tu identidad sentís que fortaleció esta distancia?",
    "¿Qué necesitás para poder mostrarte imperfecto/a sin miedo?",
    "¿Qué parte de vos se activa cuando alguien te ignora?",
    "¿Qué es algo que te cuesta reconocer que hiciste por miedo, no por convicción?",
    "¿Qué parte de tu forma de ser creés que heredarán (si los hay) tus hijos?",
    "¿Qué necesitás para dejar de compararte con otros?",
    "¿Qué parte de vos aparece sólo cuando estás completamente solo/a?",
    "¿Qué es algo que sentís profundamente pero rara vez expresás con palabras?",
    "¿Qué parte de tu forma de amar creés que todavía está sanando?",
    "¿Qué necesitás para confiar en tus propias decisiones sin dudar tanto?",
    "¿Qué parte de vos se activa cuando sentís que perdés el control de una situación?",
    "¿Qué es algo que aprendiste a fingir que no te importa, aunque sí te importa?",
    "¿Qué parte de tu forma de ser creés que más cambió gracias a mí?",
    "¿Qué necesitás para sentir que estás siendo 100% honesto/a con vos mismo/a?",
    "¿Qué parte de vos se pone incómoda cuando te elogian mucho?",
    "¿Qué es algo que idealizás de una relación que quizás no es realista?",
    "¿Qué parte de tu forma de pensar te gustaría cambiar, si pudieras?",
    "¿Qué necesitás para animarte a pedir lo que realmente querés?",
    "¿Qué parte de vos se activa cuando te sentís comparado/a con alguien más?",
    "¿Qué es algo que aprendiste sobre el perdón gracias a esta relación?",
    "¿Qué parte de tu forma de ser sentís que finalmente aceptaste, después de mucho tiempo?",
    "¿Qué necesitás para sentir paz con una decisión difícil que ya tomaste?",
    "¿Qué parte de vos aparece cuando sabés que alguien te está mintiendo?",
    "¿Qué es algo que te gustaría entender de vos mismo/a antes de que termine el año?",
    "¿Qué parte de vos creés que todavía no le mostraste a nadie, ni siquiera a mí?",
    "¿Qué necesitás sentir para animarte a soñar en grande sin miedo al fracaso?"
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
    if (ambosPredijeron && typeof registrarEvento === 'function') {
        registrarEvento('espejo_respondido', `Revelaron una ronda de El Espejo`);
    }
}
