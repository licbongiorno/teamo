// ==================== VERDAD O RETO ====================
const VERDADES_JUEGO = [
    "¿Qué es lo primero que pensás cuando te despertás y me extrañás?",
    "¿Qué costumbre mía te costó más entender al principio?",
    "¿Hay algo que no me dijiste todavía por miedo a mi reacción?",
    "¿Qué es lo que más te asusta de esta distancia?",
    "¿Cuál fue el momento en el que sentiste más ganas de tirar la toalla, y por qué no lo hiciste?",
    "¿Qué inseguridad tenés respecto a nosotros que casi nunca compartís?",
    "¿Qué extrañás de mí que no se puede mandar por chat?",
    "Contame algo que hiciste esta semana y no me contaste.",
    "¿Qué parte de vos creés que todavía no conozco del todo?",
    "¿Alguna vez sentiste celos de alguien por mí? ¿De quién?",
    "¿Qué es lo que más te gustaría que cambiara de cómo nos comunicamos?",
    "¿Cuál fue tu primera impresión real de mí, sin filtro?",
    "¿Qué palabra usarías para describir cómo te sentís hoy con nosotros?",
    "¿Qué es algo que te gustaría que te pregunte más seguido?",
    "¿Hay algo de nuestros días juntos que todavía no me contaste?",
    "¿Qué es lo que menos te gusta de vos cuando estás triste?",
    "¿Qué te da más miedo: que esto no funcione, o que funcione y cambie todo?",
    "¿En qué momento del día me extrañás más?",
    "¿Qué fue lo más difícil de aceptar de mí?",
    "¿Qué necesitás de mí en los días que estás mal y no me lo pedís?",
    "¿Qué es algo que te da vergüenza admitir que hacés cuando estamos separados?",
    "¿Alguna vez pensaste en terminar la relación, aunque sea un segundo?",
    "¿Qué es lo que más te gusta de mi cuerpo, físicamente?",
    "¿Qué mentira piadosa me dijiste alguna vez?",
    "¿Qué es lo que más te gustaría que hiciéramos y todavía no hicimos?",
    "¿Qué es algo tuyo que te gustaría que yo aceptara mejor?",
    "¿Qué fue lo más raro que pensaste sobre nosotros y nunca me contaste?",
    "¿Qué tan seguido pensás en nuestro futuro, comparado con el presente?",
    "¿Qué es lo que más extrañás de tu vida antes de esta relación?",
    "¿Qué es algo que te gustaría escuchar de mí y nunca te lo dije?",
    "¿Cuál es tu mayor miedo sobre vos mismo/a en esta relación?",
    "¿Qué es lo que más te costó perdonarme, si hubo algo?",
    "¿Qué fue lo más lindo que sentiste esta semana gracias a mí?",
    "¿Qué es algo de mi personalidad que te sorprendió con el tiempo?",
    "¿Alguna vez comparaste esta relación con una anterior? ¿En qué?",
    "¿Qué tan celoso/a sos, en una escala del 1 al 10?",
    "¿Qué es lo que más te gustaría que supiera de tu día a día?",
    "¿Qué fue lo que más te costó decirme por primera vez?",
    "¿Qué parte de nuestra rutina te gustaría cambiar?",
    "¿Hay algo que hago que te molesta y nunca me lo dijiste?",
    "¿Qué es lo que más admirás de mí, aunque nunca me lo hayas dicho así?",
    "¿Cuál fue el chiste o comentario mío que más te dolió, aunque no lo dijiste?",
    "¿Qué es algo que te gustaría que hagamos juntos la próxima vez que nos veamos, sin excusas?",
    "¿Qué tan seguido pensás en cómo sería vivir juntos?",
    "¿Qué es lo que más te da miedo perder de esta relación?",
    "¿Cuál fue el momento en que más orgulloso/a te sentiste de mí?",
    "¿Qué costumbre mía te gustaría que adoptara vos también?",
    "¿Qué fue lo más difícil de contarme sobre tu pasado?",
    "¿Qué es algo que hacés cuando estás enojado/a conmigo y nunca me lo dijiste?",
    "¿Qué canción te hace acordar a un momento difícil nuestro?",
    "¿Qué es lo que más te gustaría cambiar de vos mismo/a por esta relación?",
    "¿Hay algo de mi familia o amigos que te incomoda un poco?",
    "¿Qué es lo más honesto que podrías decirme ahora mismo sobre nosotros?",
    "¿Qué fue lo que más te costó de adaptarte a la distancia?",
    "¿Qué tan seguido dudás de vos mismo/a en esta relación?",
    "¿Qué es algo que te gustaría que dejemos de discutir para siempre?",
    "¿Cuál es el recuerdo más doloroso que tenés de nosotros?",
    "¿Qué es lo que más valorás de cómo peleamos (si peleamos bien)?",
    "¿Qué fue lo más vulnerable que compartiste conmigo?",
    "¿Qué tan seguido pensás en un 'plan B' si esto no funciona?",
    "¿Qué es algo que te gustaría escuchar de mí todos los días?",
    "¿Cuál fue el momento en que más sola/o te sentiste en esta relación?",
    "¿Qué es lo que más te gustaría que entendiera de tu cultura o forma de ser?",
    "¿Qué fue lo más difícil de confiar en mí al principio?",
    "¿Qué es algo de mí que te costó aceptar con el tiempo?",
    "¿Qué tan a menudo revisás nuestras fotos o chats viejos?",
    "¿Qué es lo que más te asusta de mostrarte 100% vulnerable conmigo?",
    "¿Cuál fue el halago mío que más te marcó?",
    "¿Qué es algo que te gustaría que dijéramos más seguido el uno al otro?",
    "¿Qué tan realista te parece nuestro plan de futuro, hoy?",
    "¿Qué fue lo más difícil de esta semana que no me contaste del todo?",
    "¿Qué es algo que te da culpa sentir en esta relación?",
    "¿Cuál es tu mayor inseguridad física, y cómo te ayudo (o no) con eso?",
    "¿Qué es lo que más te gustaría que dejemos de postergar?",
    "¿Qué fue lo más romántico que hice y no lo noté como tal?",
    "¿Qué tan seguido pensás en presentarme (o presentarte) a más gente de tu vida?",
    "¿Qué es algo que te gustaría que sepa sobre cómo te gusta que te quieran?",
    "¿Cuál fue el momento en que sentiste que esto era 'para siempre', por primera vez?",
    "¿Qué es lo más difícil de mantener la confianza a la distancia, para vos?",
    "¿Qué fue lo que más te costó perdonarte a vos mismo/a en esta relación?",
    "¿Qué tan seguido sentís que damos lo mismo los dos en esta relación?",
    "¿Qué es algo que te gustaría agradecerme ahora mismo, en voz alta?",
    "¿Cuál es tu mayor duda sin resolver sobre nosotros?",
    "¿Qué es lo que más te sorprendió de mí en los últimos meses?",
    "¿Qué fue lo más difícil de esta relación que superamos juntos?",
    "¿Qué tan seguido soñás conmigo, literalmente?",
    "¿Qué es algo que te gustaría que hagamos distinto la próxima vez que discutamos?",
    "¿Cuál fue el gesto más chico mío que más significó para vos?",
    "¿Qué es lo que más te gustaría escuchar de mí antes de dormir?",
    "¿Qué tan preparado/a te sentís para el día que vivamos juntos?",
    "¿Qué es algo tuyo que te gustaría que yo defienda más frente a otros?",
    "¿Cuál fue el momento más incómodo entre nosotros que ya quedó atrás?",
    "¿Qué es lo que más te gustaría que aprendiéramos juntos de acá a fin de año?",
    "¿Qué tan seguido pensás en cómo sería envejecer conmigo?",
    "¿Qué es algo que te gustaría decirme y esta pregunta te da la excusa perfecta?",
    "¿Cuál es el chiste interno que más amás de los nuestros?",
    "¿Qué es lo que más te gustaría que yo supiera sin tener que preguntarlo?",
    "¿Qué fue lo más lindo que alguien dijo de nosotros como pareja?",
    "¿Qué tan seguido pensás en la palabra 'para siempre' con nosotros?",
    "¿Qué es algo pendiente que te gustaría resolver conmigo esta semana?",
    "¿Cuál es tu verdad más incómoda sobre esta relación, ahora mismo?"
];

const RETOS_JUEGO = [
    "Mandale un audio cantando, aunque cantes mal.",
    "Escribile un piropo cursi de al menos 3 líneas.",
    "Mandale una foto de cómo estás vestido/a ahora mismo, sin arreglarte.",
    "Contale un secreto chiquito que nunca le contaste.",
    "Grabate diciendo 'te amo' en 3 idiomas distintos.",
    "Mandale la última foto random de tu galería, sin elegir.",
    "Describí en un audio cómo te imaginás nuestro próximo reencuentro, con lujo de detalle.",
    "Escribile una lista de 5 cosas que amás de él/ella, ahora mismo.",
    "Mandale un video de 10 segundos bailando lo primero que suene.",
    "Contale cuál fue tu sueño más raro con él/ella.",
    "Hacé una videollamada de 1 minuto solo para mirarse en silencio.",
    "Mandale un meme que te haga acordar a los dos.",
    "Escribile qué harías si apareciera ahora mismo en tu puerta.",
    "Grabate leyendo en voz alta el último mensaje lindo que te mandó.",
    "Mandale una nota de voz susurrando algo tierno.",
    "Contale tres cosas que hiciste hoy que no le habías contado.",
    "Elegí una canción y mandásela diciendo por qué te hace acordar a él/ella.",
    "Escribile 3 razones por las que vale la pena la distancia.",
    "Mandale una foto vieja de cuando eras chico/a.",
    "Prometele algo concreto para el próximo reencuentro y decilo en voz alta grabado.",
    "Mandale un dibujo hecho por vos, aunque sea feo.",
    "Contale un miedo tuyo que nunca le contaste.",
    "Grabate imitando su forma de hablar o alguna frase típica suya.",
    "Mandale una foto de tu comida de hoy con una nota graciosa.",
    "Escribile un mini-poema, aunque rime mal.",
    "Contale cuál fue tu primera impresión de él/ella, bien sincera.",
    "Mandale un audio de 30 segundos hablando sólo en piropos.",
    "Hacé una lista de 3 planes para cuando se vean y mandásela.",
    "Grabate haciendo una cara graciosa y mandásela sin explicación.",
    "Contale qué es lo que más extrañás de él/ella ahora mismo.",
    "Mandale la canción que más te hace acordar a esta relación.",
    "Escribile una carta corta como si fuera la última que le fueras a mandar (con final feliz).",
    "Contale un chiste malo y grabá su reacción (o la tuya al contarlo).",
    "Mandale un audio contando tu día como si fuera una noticia de telediario.",
    "Prometé cocinarle algo especial la próxima vez que se vean, y describilo.",
    "Mandale una foto de tus manos ahora mismo.",
    "Contale algo que admirás de su familia.",
    "Grabate agradeciéndole por 3 cosas específicas de esta semana.",
    "Mandale un audio contando cómo te imaginás que va a ser cuando vivan juntos.",
    "Escribile qué canción sonaría si entrara caminando ahora mismo.",
    "Contale un recuerdo de la infancia que nunca le contaste.",
    "Mandale una selfie con la cara más rara que puedas hacer.",
    "Grabate contando qué fue lo que más te gustó de él/ella hoy.",
    "Escribile una lista de apodos cariñosos nuevos para probar.",
    "Mandale un audio leyendo el horóscopo de hoy como si fuera importantísimo.",
    "Contale qué es lo que más te gustaría que hicieran juntos que todavía no probaron.",
    "Grabate haciendo un baile de 10 segundos, sin importar qué tan mal salga.",
    "Mandale una captura de la última canción que escuchaste y explicá por qué.",
    "Escribile qué fue lo mejor que te dijo en toda la relación.",
    "Contale algo gracioso que te pasó hoy con lujo de detalle.",
    "Mandale un audio contando un plan sorpresa que te gustaría organizar para él/ella.",
    "Grabate diciendo 3 cosas que te gustan de su personalidad.",
    "Escribile una adivinanza sobre algo de la relación para que resuelva.",
    "Mandale una foto del cielo o el clima de donde estás ahora.",
    "Contale qué canción te gustaría que sea 'la nuestra' si no tienen una.",
    "Grabate haciendo de cuenta que sos reportero/a entrevistándote a vos mismo/a sobre la relación.",
    "Mandale un audio contando qué extrañás de un lugar específico con él/ella.",
    "Escribile 3 cosas que te gustaría aprender de él/ella.",
    "Contale la anécdota más vergonzosa que tengas con él/ella.",
    "Mandale una nota de voz recitando algo (poema, canción, lo que sea) de memoria.",
    "Grabate un video corto explicando por qué esta relación vale la pena, en 20 segundos.",
    "Escribile una lista de 5 lugares a los que te gustaría ir con él/ella.",
    "Mandale un emoji story: contale tu día usando sólo emojis.",
    "Contale qué fue lo que más te costó de esta semana, sin filtro.",
    "Grabate cantando el estribillo de su canción favorita (o la que creas que es).",
    "Mandale una foto de algo que te recordó a él/ella hoy, sin decir qué es hasta que pregunte.",
    "Escribile una carta de agradecimiento por algo específico de esta semana.",
    "Contale un secreto de tu infancia que nunca compartiste.",
    "Grabate haciendo un resumen de 'nuestra historia' en 30 segundos, como tráiler de película.",
    "Mandale un audio susurrando 5 cosas que te gustan de él/ella.",
    "Escribile qué te gustaría que hicieran en su primera semana de convivencia.",
    "Contale cuál es tu mayor sueño personal que todavía no le contaste en detalle.",
    "Grabate un video mandándole un beso exagerado, tipo dibujo animado.",
    "Mandale una lista de 3 cosas random que tenés cerca tuyo ahora mismo.",
    "Escribile una frase que resuma cómo te sentís hoy, en formato de titular de diario.",
    "Contale qué fue lo que más te sorprendió de él/ella en el último mes.",
    "Grabate un audio de 1 minuto contando por qué elegís esto, todos los días.",
    "Mandale una captura de pantalla de algo gracioso que viste hoy.",
    "Escribile 3 preguntas que te gustaría hacerle y nunca le hiciste.",
    "Contale qué canción te gustaría bailar juntos algún día.",
    "Grabate haciendo de cuenta que sos meteorólogo/a pronosticando 'el clima' de la relación.",
    "Mandale un audio contando qué extrañás específicamente de estar en persona con él/ella.",
    "Escribile una lista de cosas que te gustaría que prueben juntos la próxima vez que se vean.",
    "Contale qué fue lo más lindo que le dijiste alguna vez y que sentís que no valoró del todo.",
    "Grabate un video corto agradeciendo la paciencia del otro con la distancia.",
    "Mandale una foto de un objeto que te recuerda al otro, con una historia corta.",
    "Escribile qué es lo que más te gustaría mejorar de vos mismo/a por él/ella.",
    "Contale un plan loco que te gustaría hacer juntos alguna vez en la vida.",
    "Grabate diciendo 'gracias por elegirme' con la mayor sinceridad posible.",
    "Mandale un audio contando cómo fue tu primer pensamiento del día sobre él/ella.",
    "Escribile 3 cosas que te encantaría que haga el día que se reencuentren.",
    "Contale una duda tonta que tuviste sobre la relación y ya se te pasó.",
    "Grabate un video mostrando tu lugar favorito de tu casa y explicá por qué.",
    "Mandale una lista con el top 3 de mejores momentos de esta semana juntos.",
    "Escribile qué palabra usarías para describir esta relación, con una breve explicación.",
    "Contale qué es lo que más te gustaría que la gente supiera de ustedes como pareja.",
    "Grabate un audio prometiendo algo chiquito para cumplir esta semana.",
    "Mandale una captura de tu clima actual (app del tiempo) con un comentario random.",
    "Escribile una carta corta imaginando cómo será su primer aniversario en persona.",
    "Contale qué es lo que más valorás de cómo se comunican como pareja.",
    "Grabate diciendo 3 razones por las que hoy es un buen día para seguir eligiéndose."
];

function refVerdadOReto(){ return window.doc(window.db, 'juegos', 'verdadoreto'); }

function iniciarVerdadOReto(){
    if (window._unsubVerdadOReto) window._unsubVerdadOReto();
    window._unsubVerdadOReto = window.onSnapshot(refVerdadOReto(), (snap) => {
        renderVerdadOReto(snap.exists() ? snap.data() : null);
    }, (err) => {
        console.error('Error de Firestore en verdadoreto:', err);
        document.getElementById('contenido-verdadoreto').innerHTML = `<div class="panel texto-centro texto-tenue">⚠️ No se pudo conectar (${err.code || 'error'}).</div>`;
    });
}

function renderVerdadOReto(estado){
    const cont = document.getElementById('contenido-verdadoreto');
    if (!estado) estado = { turno: miIdentidad, fase: 'eligiendo', puntajes: { nico: 0, carito: 0 }, historial: [] };
    const puntajes = estado.puntajes || { nico: 0, carito: 0 };

    let html = `<div class="panel">
        <div style="display:flex; justify-content:space-between; font-size:0.9rem;">
            <span>Nico: <b>${puntajes.nico || 0}</b></span>
            <span>Carito: <b>${puntajes.carito || 0}</b></span>
        </div>
    </div>`;

    const esMiTurno = estado.turno === miIdentidad;

    if (estado.fase === 'eligiendo' || !estado.fase) {
        if (esMiTurno) {
            html += `<div class="panel texto-centro">
                <p class="texto-tenue">Tu turno. ¿Verdad o reto?</p>
                <div class="btn-fila">
                    <button class="btn-principal" onclick="elegirVerdadOReto('verdad')">💬 Verdad</button>
                    <button class="btn-principal" style="background:linear-gradient(135deg,#ffb3c6,#f5d9a0);" onclick="elegirVerdadOReto('reto')">🔥 Reto</button>
                </div>
            </div>`;
        } else {
            html += `<div class="panel texto-centro texto-tenue">Le toca elegir a ${nombreJugador(estado.turno)}…</div>`;
        }
    } else if (estado.tipo === 'verdad') {
        html += `<div class="panel"><div class="texto-tenue" style="margin-bottom:8px;">Verdad para ${nombreJugador(estado.turno)}:</div>
            <p style="line-height:1.5;">${estado.contenido}</p></div>`;

        if (estado.fase === 'esperando_respuesta') {
            if (esMiTurno) {
                html += `<div class="panel">
                    <textarea id="input-respuesta-vor" rows="3" placeholder="Tu respuesta sincera..." maxlength="500"
                        style="width:100%; box-sizing:border-box; background:rgba(255,255,255,0.06); border:1px solid var(--borde); border-radius:14px; padding:12px; color:var(--texto); font-family:var(--fuente-texto); font-size:0.92rem; resize:vertical; margin-bottom:10px;"></textarea>
                    <button class="btn-principal" onclick="responderVerdad()">Enviar</button>
                </div>`;
            } else {
                html += `<div class="panel texto-centro texto-tenue">🔒 ${nombreJugador(estado.turno)} está escribiendo su verdad…</div>`;
            }
        } else if (estado.fase === 'bloqueado') {
            if (!esMiTurno) {
                html += `<div class="panel texto-centro">
                    <p class="texto-tenue" style="margin-bottom:10px;">Respuesta guardada bajo llave 🔒</p>
                    <button class="btn-principal" onclick="leerRespuestaVerdad()">Leer respuesta</button>
                </div>`;
            } else {
                html += `<div class="panel texto-centro texto-tenue">Esperando que ${nombreJugador(miRival)} la lea…</div>`;
            }
        } else if (estado.fase === 'revelado') {
            html += `<div class="panel"><span class="texto-tenue" style="font-size:0.75rem;">Respondió ${nombreJugador(estado.turno)}:</span>
                <p style="margin-top:6px; line-height:1.5;">${estado.respuesta}</p></div>
                <button class="btn-principal" onclick="siguienteTurnoVerdadOReto()">Siguiente turno ▶️</button>`;
        }
    } else if (estado.tipo === 'reto') {
        html += `<div class="panel"><div class="texto-tenue" style="margin-bottom:8px;">Reto para ${nombreJugador(estado.turno)}:</div>
            <p style="line-height:1.5;">${estado.contenido}</p></div>`;
        if (esMiTurno) {
            html += `<div class="panel texto-centro texto-tenue">Cumplilo fuera de la app. Cuando ${nombreJugador(miRival)} lo confirme, suma el punto.</div>`;
        } else {
            html += `<div class="panel texto-centro">
                <button class="btn-principal" onclick="validarRetoVerdadOReto()">✅ Validar reto</button>
            </div>`;
        }
    }

    if (estado.historial && estado.historial.length) {
        html += `<div class="panel texto-tenue" style="font-size:0.72rem; line-height:1.6;">${estado.historial.slice(-4).map(h => '• ' + h).join('<br>')}</div>`;
    }

    cont.innerHTML = html;
}

async function leerVorActual(){
    return await new Promise(res => { const u = window.onSnapshot(refVerdadOReto(), s => { u(); res(s.exists() ? s.data() : null); }); });
}
function pushLogVor(estado, mensaje){ return [...(estado?.historial || []), mensaje].slice(-6); }

async function elegirVerdadOReto(tipo){
    vibrarJ(12);
    const estado = await leerVorActual();
    if (estado && estado.turno && estado.turno !== miIdentidad) return;
    let contenido, fase;
    if (tipo === 'verdad') {
        contenido = VERDADES_JUEGO[Math.floor(Math.random() * VERDADES_JUEGO.length)];
        fase = 'esperando_respuesta';
    } else {
        contenido = RETOS_JUEGO[Math.floor(Math.random() * RETOS_JUEGO.length)];
        fase = 'reto_activo';
    }
    await window.setDoc(refVerdadOReto(), {
        turno: miIdentidad, tipo, contenido, fase,
        respuesta: null,
        puntajes: estado?.puntajes || { nico: 0, carito: 0 },
        historial: pushLogVor(estado, `${nombreJugador(miIdentidad)} eligió ${tipo === 'verdad' ? 'Verdad' : 'Reto'}.`)
    }, { merge: true });
}

async function responderVerdad(){
    const texto = document.getElementById('input-respuesta-vor').value.trim();
    if (!texto) return;
    vibrarJ(12);
    const estado = await leerVorActual();
    if (!estado || estado.turno !== miIdentidad) return;
    await window.updateDoc(refVerdadOReto(), { respuesta: texto, fase: 'bloqueado' });
}

async function leerRespuestaVerdad(){
    vibrarJ(10);
    const estado = await leerVorActual();
    if (!estado) return;
    const nuevosPuntajes = { ...(estado.puntajes || { nico: 0, carito: 0 }) };
    nuevosPuntajes[estado.turno] = (nuevosPuntajes[estado.turno] || 0) + 1;
    await window.updateDoc(refVerdadOReto(), {
        fase: 'revelado', puntajes: nuevosPuntajes,
        historial: pushLogVor(estado, `Se reveló la verdad de ${nombreJugador(estado.turno)} (+1).`)
    });
}

async function validarRetoVerdadOReto(){
    vibrarJ([15, 30, 15]);
    const estado = await leerVorActual();
    if (!estado) return;
    const nuevosPuntajes = { ...(estado.puntajes || { nico: 0, carito: 0 }) };
    nuevosPuntajes[estado.turno] = (nuevosPuntajes[estado.turno] || 0) + 1;
    const siguienteTurno = estado.turno === 'nico' ? 'carito' : 'nico';
    await window.setDoc(refVerdadOReto(), {
        turno: siguienteTurno, fase: 'eligiendo', tipo: null, contenido: null, respuesta: null,
        puntajes: nuevosPuntajes,
        historial: pushLogVor(estado, `Reto de ${nombreJugador(estado.turno)} validado (+1).`)
    }, { merge: true });
}

async function siguienteTurnoVerdadOReto(){
    vibrarJ(10);
    const estado = await leerVorActual();
    if (!estado) return;
    const siguienteTurno = estado.turno === 'nico' ? 'carito' : 'nico';
    await window.setDoc(refVerdadOReto(), {
        turno: siguienteTurno, fase: 'eligiendo', tipo: null, contenido: null, respuesta: null,
        puntajes: estado.puntajes || { nico: 0, carito: 0 },
        historial: estado.historial || []
    }, { merge: true });
}
