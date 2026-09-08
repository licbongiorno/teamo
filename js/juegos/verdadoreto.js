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
    "¿Hay algo de nuestros 3 días juntos que todavía no me contaste?",
    "¿Qué es lo que menos te gusta de vos cuando estás triste?",
    "¿Qué te da más miedo: que esto no funcione, o que funcione y cambie todo?",
    "¿En qué momento del día me extrañás más?",
    "¿Qué fue lo más difícil de aceptar de mí?",
    "¿Qué necesitás de mí en los días que estás mal y no me lo pedís?",
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
