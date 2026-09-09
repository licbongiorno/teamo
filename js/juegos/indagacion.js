// ==================== CARTAS DE INDAGACIÓN ====================
// Preguntas profundas para antes de dormir: quien crea la carta
// responde primero (a solas, sin que el otro vea), y después el
// otro tiene que ADIVINAR qué respondió. Se revelan juntas al final
// y quedan guardadas para releer.
const PREGUNTAS_INDAGACION = [
    "¿Qué parte del día de hoy te hubiese gustado compartir en persona y no por chat?",
    "¿Qué es lo que más te cuesta sostener de esta distancia, aunque no lo digas?",
    "Si hoy tuvieras que describir cómo estás con una sola palabra, ¿cuál sería y por qué?",
    "¿Qué de nuestros días juntos pensás más seguido de lo que admitís?",
    "¿Qué necesitás escuchar de mí esta semana que todavía no te dije?",
    "¿Qué parte de vos le mostrás menos a la gente, y por qué a mí sí (o todavía no)?",
    "¿Qué miedo tenés sobre el futuro nuestro que casi nunca ponés en palabras?",
    "¿Qué hiciste hoy que, en el fondo, hiciste pensando en mí?",
    "Si pudieras cambiar una sola cosa de cómo nos comunicamos, ¿cuál sería?",
    "¿Qué creés que es lo más difícil de amar a alguien lejos, más allá de la distancia física?",
    "¿En qué momento de esta semana te sentiste más cerca de mí, a pesar de los kilómetros?",
    "¿Qué parte de tu rutina diaria te gustaría que yo conociera mejor?",
    "¿Qué es algo que aprendiste de vos mismo/a gracias a esta relación a distancia?",
    "¿Qué le dirías a la versión de vos que dudaba si esto iba a funcionar?",
    "¿Qué cosa cotidiana (una canción, un lugar, un objeto) te hizo acordar a mí sin que yo lo supiera?",
    "¿Qué es lo que más agradecés de cómo somos como pareja, incluso en los días difíciles?",
    "¿Hay algo que te gustaría pedirme y todavía no te animaste?",
    "¿Qué versión de vos aparece cuando hablás conmigo que no aparece con nadie más?",
    "¿Qué fue lo más valiente que hiciste por esta relación, aunque nadie lo haya notado?",
    "¿Qué te gustaría que supiera de cómo estás hoy, sin que tengas que explicarlo del todo?",
    "¿Qué parte de tu día de hoy sentiste más sola/o, incluso sabiendo que yo estaba a un mensaje de distancia?",
    "¿Qué es algo que perdonaste sin decirlo en voz alta?",
    "¿Qué creés que todavía no logramos entender del todo el uno del otro?",
    "¿Cuál fue el pensamiento más honesto que tuviste hoy sobre nosotros?",
    "¿Qué es lo que más te sostiene en los días en que la distancia pesa más?",
    "¿Qué le agradecerías a la persona que sos ahora, comparada con quien eras antes de esto?",
    "¿Qué gesto pequeño mío te hace sentir que valgo la espera?",
    "¿Qué parte de tu futuro imaginado conmigo te da más ilusión?",
    "¿Qué te gustaría soltar hoy, antes de dormir, para no cargarlo mañana?",
    "¿Qué significa para vos, en este momento de tu vida, elegir esta relación cada día?",
    "¿Qué es algo que te gustaría que dejáramos de discutir, definitivamente?",
    "¿Qué parte de mí te costó entender al principio y hoy ya no?",
    "¿Qué es algo que hacés distinto desde que estamos juntos, sin darte cuenta?",
    "¿Qué necesitarías que te dijera hoy para sentirte más tranquilo/a?",
    "¿Qué parte de esta relación sentís que todavía está en construcción?",
    "¿Qué te gustaría que entendiera de tu forma de demostrar cariño?",
    "¿Qué es algo que te da paz sobre nosotros, incluso en los días inciertos?",
    "¿Qué palabra dirías que define esta etapa de nuestra relación?",
    "¿Qué es algo que te gustaría que dejemos de asumir el uno del otro?",
    "¿Qué parte de tu identidad sentís que se fortaleció gracias a esta relación?",
    "¿Qué es lo más difícil de que yo no esté ahí en los momentos importantes de tu día a día?",
    "¿Qué necesitás sentir de mí para bajar completamente la guardia?",
    "¿Qué es algo de mí que admirás y nunca me lo dijiste con esas palabras?",
    "¿Qué parte de vos se volvió más paciente gracias a esta distancia?",
    "¿Qué es lo que más te gustaría que celebráramos juntos, aunque sea chico?",
    "¿Qué creencia sobre el amor cambió en vos desde que estamos juntos?",
    "¿Qué parte de esta relación sentís que es completamente tuya, única?",
    "¿Qué te gustaría que yo supiera sobre cómo procesás las malas noticias?",
    "¿Qué es algo que te gustaría que habláramos con más frecuencia?",
    "¿Qué momento de esta semana sentiste que fuimos un verdadero equipo?",
    "¿Qué parte de tu forma de amar heredaste de alguien de tu familia?",
    "¿Qué te gustaría escuchar de mí que no tenga que ver con 'te amo'?",
    "¿Qué es algo que te asusta de lo bien que estamos ahora mismo?",
    "¿Qué parte de esta relación te enseñó a confiar más en vos mismo/a?",
    "¿Qué necesitás que entendamos mejor sobre cómo vivimos el tiempo separados?",
    "¿Qué es algo que te gustaría agradecerme sin que suene a obligación?",
    "¿Qué momento reciente sentiste que fue completamente 'nuestro', sin nadie más?",
    "¿Qué parte de tu forma de pelear te gustaría cambiar?",
    "¿Qué te gustaría que yo hiciera distinto cuando estás mal, aunque no lo hayas pedido nunca?",
    "¿Qué es algo que sentís que maduró en vos gracias a esta relación?",
    "¿Qué parte del silencio entre nosotros se siente más cómoda?",
    "¿Qué es lo que más valorás de cómo cuido (o intento cuidar) de vos a la distancia?",
    "¿Qué necesitás que dejemos de postergar como pareja?",
    "¿Qué parte de tu día a día te gustaría compartir más, aunque parezca poco importante?",
    "¿Qué es algo que te da esperanza sobre nuestro futuro, hoy puntualmente?",
    "¿Qué parte de mí te resulta más fácil de amar, y cuál más difícil?",
    "¿Qué es algo de esta relación que te gustaría proteger a toda costa?",
    "¿Qué necesitás sentir para saber que estamos avanzando, no sólo esperando?",
    "¿Qué parte de tu vulnerabilidad te costó más mostrarme, y ya lo hiciste?",
    "¿Qué es algo que te gustaría que dejemos de dar por sentado?",
    "¿Qué parte de nuestra comunicación sentís que mejoró más con el tiempo?",
    "¿Qué es lo que más te reconforta saber sobre mí, en los días difíciles?",
    "¿Qué parte de tu forma de ser sentís que yo entiendo mejor que nadie?",
    "¿Qué te gustaría que supiéramos hacer mejor cuando uno de los dos está mal?",
    "¿Qué es algo que te enseñó esta distancia sobre el valor del tiempo?",
    "¿Qué parte de nuestra rutina virtual sentís que se volvió sagrada para vos?",
    "¿Qué necesitás que te recuerde en los días que dudás de vos mismo/a?",
    "¿Qué es algo que te gustaría que reconociéramos juntos, como logro de pareja?",
    "¿Qué parte de tu pasado sentís que ya sanaste gracias a esta relación?",
    "¿Qué es lo que más te gustaría que yo aprenda sobre tu cultura o tu forma de vivir?",
    "¿Qué parte de esta relación sentís que todavía te da miedo nombrar?",
    "¿Qué te gustaría que supiéramos manejar mejor: los silencios o las palabras?",
    "¿Qué es algo que sentís que ya no necesitás demostrar en esta relación?",
    "¿Qué parte de mí sentís que conocés mejor que yo mismo/a?",
    "¿Qué necesitás que prioricemos en las próximas semanas?",
    "¿Qué es lo que más te gustaría que dejáramos de comparar con otras parejas?",
    "¿Qué parte de tu forma de querer sentís que todavía estás aprendiendo a expresar?",
    "¿Qué te gustaría agradecerte a vos mismo/a por sostener esta relación?",
    "¿Qué es algo que sentís que cambió en la forma en que discutimos, para mejor?",
    "¿Qué parte de nuestra historia sentís que es la más difícil de explicarle a otros?",
    "¿Qué necesitás sentir de mí en los días en que todo pesa más de lo normal?",
    "¿Qué es lo que más valorás de que elijamos esto todos los días, sin garantías?",
    "¿Qué parte de tu forma de amar creés que cambió desde que empezamos esto?",
    "¿Qué te gustaría que dejemos de temer decirnos?",
    "¿Qué es algo que sentís que todavía no perdonamos del todo, aunque digamos que sí?",
    "¿Qué parte de nuestra conexión sentís que es imposible de explicar con palabras?",
    "¿Qué necesitás que hagamos distinto la próxima vez que la distancia se sienta insoportable?",
    "¿Qué es lo que más te gustaría que supiéramos celebrar más seguido, sin esperar fechas especiales?",
    "¿Qué parte de vos sentís que sólo yo conozco, entre toda la gente que te rodea?",
    "¿Qué te gustaría decirme ahora mismo, sin filtro, aprovechando esta pregunta?"
];

function refCartaIndagacion(id){ return window.doc(window.db, 'juegos', id); }

function iniciarIndagacion(){
    mostrarListaIndagacion();
}

function mostrarListaIndagacion(){
    if (window._unsubIndagacionActual) { window._unsubIndagacionActual(); window._unsubIndagacionActual = null; }
    const cont = document.getElementById('contenido-indagacion');
    cont.innerHTML = `<div class="panel texto-centro texto-tenue">Cargando…</div>`;

    if (window._unsubIndagacionLista) window._unsubIndagacionLista();
    const q = window.query(window.collection(window.db, 'juegos'), window.where('tipo', '==', 'carta-indagacion'));
    window._unsubIndagacionLista = window.onSnapshot(q, (snap) => {
        const cartas = [];
        snap.forEach(d => cartas.push({ id: d.id, ...d.data() }));
        cartas.sort((a, b) => (b.creadaEn || 0) - (a.creadaEn || 0));
        renderListaIndagacion(cartas);
    }, (err) => {
        console.error('Error de Firestore en indagación:', err);
        cont.innerHTML = `<div class="panel texto-centro texto-tenue">⚠️ No se pudo conectar (${err.code || 'error'}).</div>`;
    });
}

function renderListaIndagacion(cartas){
    const cont = document.getElementById('contenido-indagacion');
    let html = `<div class="panel texto-centro">
        <p class="texto-tenue">Una pregunta profunda por carta. Vos respondés a solas y el otro adivina qué dijiste — después se revela todo junto.</p>
        <button class="btn-principal" onclick="crearCartaIndagacion()">🌙 Nueva carta</button>
    </div>`;

    if (cartas.length) {
        html += `<div class="lista-escrituras">`;
        cartas.forEach(c => {
            const esperandoMiTurno = (c.fase === 'necesita_respuesta' && c.creadaPor === miIdentidad) ||
                                      (c.fase === 'necesita_adivinanza' && c.creadaPor !== miIdentidad);
            const estadoTexto = c.fase === 'revelado' ? 'Revelada' : 'En curso';
            html += `<div class="item-escritura" onclick="abrirCartaIndagacion('${c.id}')">
                <div class="info-escritura">
                    <div class="titulo-escritura">${c.pregunta.length > 60 ? c.pregunta.slice(0, 60) + '…' : c.pregunta}</div>
                    <div class="detalle-escritura">${estadoTexto}${esperandoMiTurno ? ' · tu turno' : ''}</div>
                </div>
                <span class="badge-estado ${c.fase === 'revelado' ? 'badge-terminada' : 'badge-activa'}">${estadoTexto}</span>
            </div>`;
        });
        html += `</div>`;
    } else {
        html += `<div class="panel texto-centro texto-tenue">Todavía no escribieron ninguna carta. La primera siempre queda guardada para siempre.</div>`;
    }
    cont.innerHTML = html;
}

async function crearCartaIndagacion(){
    vibrarJ(12);
    const pregunta = PREGUNTAS_INDAGACION[Math.floor(Math.random() * PREGUNTAS_INDAGACION.length)];
    const docRef = await window.addDoc(window.collection(window.db, 'juegos'), {
        tipo: 'carta-indagacion',
        pregunta,
        creadaPor: miIdentidad,
        creadaEn: Date.now(),
        fase: 'necesita_respuesta',
        respuesta: null,
        adivinanza: null
    });
    abrirCartaIndagacion(docRef.id);
}

function abrirCartaIndagacion(id){
    vibrarJ(10);
    if (window._unsubIndagacionLista) { window._unsubIndagacionLista(); window._unsubIndagacionLista = null; }
    if (window._unsubIndagacionActual) window._unsubIndagacionActual();
    window._cartaIndagacionActualId = id;
    window._unsubIndagacionActual = window.onSnapshot(refCartaIndagacion(id), (snap) => {
        if (!snap.exists()) { mostrarListaIndagacion(); return; }
        renderCartaIndagacion({ id: snap.id, ...snap.data() });
    }, (err) => console.error('Error de Firestore en carta:', err));
}

function renderCartaIndagacion(c){
    const cont = document.getElementById('contenido-indagacion');
    const soyCreador = c.creadaPor === miIdentidad;
    let html = `<button class="btn-secundario" style="margin-bottom:12px;" onclick="mostrarListaIndagacion()">⬅️ Todas las cartas</button>
    <div class="panel"><p style="font-family:var(--fuente-titulo); font-size:1.3rem; line-height:1.35; margin:0;">${c.pregunta}</p></div>`;

    if (c.fase === 'necesita_respuesta') {
        if (soyCreador) {
            html += `<div class="panel">
                <textarea id="input-respuesta-indagacion" rows="4" placeholder="Tu respuesta, sincera y a solas..." maxlength="600"
                    style="width:100%; box-sizing:border-box; background:rgba(255,255,255,0.06); border:1px solid var(--borde); border-radius:14px; padding:12px; color:var(--texto); font-family:var(--fuente-texto); font-size:0.92rem; resize:vertical; margin-bottom:10px;"></textarea>
                <button class="btn-principal" onclick="responderIndagacion()">Guardar bajo llave 🔒</button>
            </div>`;
        } else {
            html += `<div class="panel texto-centro texto-tenue">🔒 ${nombreJugador(c.creadaPor)} está escribiendo su verdad…</div>`;
        }
    } else if (c.fase === 'necesita_adivinanza') {
        if (!soyCreador) {
            html += `<div class="panel">
                <p class="texto-tenue" style="margin-bottom:8px;">Respuesta guardada bajo llave 🔒 — ¿qué creés que respondió ${nombreJugador(c.creadaPor)}?</p>
                <textarea id="input-adivinanza-indagacion" rows="4" placeholder="Tu adivinanza..." maxlength="600"
                    style="width:100%; box-sizing:border-box; background:rgba(255,255,255,0.06); border:1px solid var(--borde); border-radius:14px; padding:12px; color:var(--texto); font-family:var(--fuente-texto); font-size:0.92rem; resize:vertical; margin-bottom:10px;"></textarea>
                <button class="btn-principal" onclick="adivinarIndagacion()">Enviar adivinanza</button>
            </div>`;
        } else {
            html += `<div class="panel texto-centro texto-tenue">Ya respondiste. Esperando la adivinanza de ${nombreJugador(miRival)}…</div>`;
        }
    } else if (c.fase === 'revelado') {
        html += `<div class="panel">
            <span class="texto-tenue" style="font-size:0.75rem;">Respuesta real de ${nombreJugador(c.creadaPor)}:</span>
            <p style="margin:6px 0 14px; line-height:1.5;">${c.respuesta}</p>
            <span class="texto-tenue" style="font-size:0.75rem;">Lo que adivinó ${nombreJugador(c.creadaPor === 'nico' ? 'carito' : 'nico')}:</span>
            <p style="margin:6px 0 0; line-height:1.5;">${c.adivinanza}</p>
        </div>`;
    }

    cont.innerHTML = html;
}

async function responderIndagacion(){
    const texto = document.getElementById('input-respuesta-indagacion').value.trim();
    if (!texto || !window._cartaIndagacionActualId) return;
    vibrarJ(12);
    await window.updateDoc(refCartaIndagacion(window._cartaIndagacionActualId), {
        respuesta: texto, fase: 'necesita_adivinanza'
    });
}

async function adivinarIndagacion(){
    const texto = document.getElementById('input-adivinanza-indagacion').value.trim();
    if (!texto || !window._cartaIndagacionActualId) return;
    vibrarJ([15, 30, 15]);
    await window.updateDoc(refCartaIndagacion(window._cartaIndagacionActualId), {
        adivinanza: texto, fase: 'revelado'
    });
    if (typeof registrarEvento === 'function') {
        registrarEvento('carta_indagacion', `Completaron una carta de indagación`);
    }
}
