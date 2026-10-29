// ==================== 36 PREGUNTAS PARA ENAMORARSE (motor de reflexión) ====================
// Las 36 preguntas del estudio de Arthur Aron (1997), en tres sets que
// van ganando en profundidad. Van en orden y al terminar queda el cierre:
// cuatro minutos mirándose a los ojos (en persona o por videollamada).
window.CONFIG_REFLEXION = window.CONFIG_REFLEXION || {};
window.CONFIG_REFLEXION['treintayseis'] = {
    nombreJuego: '36 Preguntas',
    enOrden: true,
    botonNuevo: '💞 Empezar con la pregunta 1',
    instrucciones: 'Las 36 preguntas del famoso estudio para enamorarse (o enamorarse más). Van en orden, de a una: cada uno responde a solas y se revelan juntos. Sin apuro: pueden hacer un set por noche.',
    placeholder: 'Tu respuesta, con el corazón en la mano…',
    secciones: [
        { desde: 0, nombre: 'Set I · para entrar en confianza' },
        { desde: 12, nombre: 'Set II · un poco más hondo' },
        { desde: 24, nombre: 'Set III · a corazón abierto' },
    ],
    alFinal: (juegoId) => `<div class="texto-centro" style="margin:6px 0 10px;">🎉 ¡Hicieron las 36!</div>
        <button class="btn-principal" onclick="abrirCuatroMinutos()">👀 Los 4 minutos mirándose</button>`,
    mensajePostRevelado: 'Tómense un ratito para charlarlo antes de pasar a la siguiente 💬',
    banco: [
        // Set I
        'Si pudieras elegir a cualquier persona del mundo, ¿a quién invitarías a cenar?',
        '¿Te gustaría ser famoso o famosa? ¿De qué manera?',
        'Antes de hacer una llamada, ¿alguna vez ensayás lo que vas a decir? ¿Por qué?',
        '¿Cómo sería para vos un día "perfecto"?',
        '¿Cuándo fue la última vez que cantaste a solas? ¿Y para otra persona?',
        'Si pudieras vivir hasta los 90 y conservar la mente o el cuerpo de alguien de 30 durante los últimos 60 años, ¿qué elegirías?',
        '¿Tenés alguna corazonada secreta sobre cómo vas a morir?',
        'Nombrá tres cosas que creas que tenés en común con {otro}.',
        '¿Por qué cosa de tu vida te sentís más agradecido o agradecida?',
        'Si pudieras cambiar algo de cómo te criaron, ¿qué sería?',
        'Contá la historia de tu vida con el mayor detalle posible (¡te dejamos más de cuatro minutos!).',
        'Si mañana pudieras despertarte con una cualidad o habilidad nueva, ¿cuál sería?',
        // Set II
        'Si una bola de cristal pudiera decirte la verdad sobre vos, tu vida, el futuro o cualquier cosa, ¿qué querrías saber?',
        '¿Hay algo que soñás con hacer desde hace mucho? ¿Por qué no lo hiciste todavía?',
        '¿Cuál es el mayor logro de tu vida?',
        '¿Qué es lo que más valorás en una amistad?',
        '¿Cuál es tu recuerdo más preciado?',
        '¿Cuál es tu recuerdo más difícil?',
        'Si supieras que dentro de un año te vas a morir de repente, ¿cambiarías algo de cómo vivís ahora? ¿Por qué?',
        '¿Qué significa la amistad para vos?',
        '¿Qué lugar ocupan el amor y el cariño en tu vida?',
        'Escribí cinco cualidades lindas que ves en {otro}.',
        '¿Qué tan unida y cálida es tu familia? ¿Sentís que tu infancia fue más feliz que la de la mayoría?',
        '¿Cómo te sentís con tu relación con tu mamá?',
        // Set III
        'Armá tres frases verdaderas que empiecen con "Nosotros…". Por ejemplo: "Nosotros dos estamos sintiendo…"',
        'Completá esta frase: "Ojalá tuviera a alguien con quien compartir…"',
        'Si fueras a ser su amigo o amiga del alma, ¿qué sería importante que {otro} supiera de vos?',
        'Contale a {otro} qué te gusta de su forma de ser. Sé muy honesto/a: decí cosas que no le dirías a alguien que acabás de conocer.',
        'Contá un momento vergonzoso de tu vida.',
        '¿Cuándo fue la última vez que lloraste delante de alguien? ¿Y a solas?',
        'Contale a {otro} algo que ya te encante de cómo es.',
        '¿Hay algo que te parezca demasiado serio como para hacer chistes?',
        'Si esta noche te murieras sin poder hablar con nadie, ¿qué te arrepentirías de no haberle dicho a alguien? ¿Por qué no se lo dijiste todavía?',
        'Se te incendia la casa con todo adentro. Después de salvar a tus seres queridos y mascotas, tenés tiempo de rescatar una sola cosa. ¿Cuál sería y por qué?',
        'De todas las personas de tu familia, ¿qué pérdida te dolería más? ¿Por qué?',
        'Contá un problema personal y preguntale a {otro} cómo lo manejaría. Pedile también que te diga cómo te ve a vos frente a ese problema.',
    ]
};

// Cierre: cuatro minutos mirándose a los ojos, sin hablar.
function abrirCuatroMinutos(){
    document.querySelectorAll('.cuatro-min-fondo').forEach(x => x.remove());
    const fondo = document.createElement('div');
    fondo.className = 'compu-selector-fondo cuatro-min-fondo';
    fondo.innerHTML = `<div class="compu-selector panel texto-centro" role="dialog" aria-label="Cuatro minutos">
        <div class="compu-selector-titulo">👀 Cuatro minutos</div>
        <p class="texto-tenue" style="font-size:0.88rem;">El último paso del estudio: mírense a los ojos durante cuatro minutos, sin hablar. Si están lejos, háganlo por videollamada.</p>
        <div class="reloj-cuatro" id="reloj-cuatro">4:00</div>
        <button class="btn-principal" id="btn-cuatro" onclick="arrancarCuatroMinutos()">Empezar</button>
        <button class="btn-secundario" style="margin-top:8px;" onclick="cerrarCuatroMinutos()">Cerrar</button>
    </div>`;
    document.body.appendChild(fondo);
}
let _timerCuatro = null;
function arrancarCuatroMinutos(){
    clearInterval(_timerCuatro);
    const fin = Date.now() + 240000;
    const b = document.getElementById('btn-cuatro');
    if (b) b.style.display = 'none';
    if (window.sfx) window.sfx.revelar();
    const tic = () => {
        const r = document.getElementById('reloj-cuatro');
        if (!r) { clearInterval(_timerCuatro); return; }
        const s = Math.max(0, Math.ceil((fin - Date.now()) / 1000));
        r.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
        if (s <= 0) {
            clearInterval(_timerCuatro);
            r.innerHTML = '💞';
            if (window.fx) window.fx.confeti();
            if (window.sfx) window.sfx.victoria && window.sfx.victoria();
            if (typeof registrarEvento === 'function') registrarEvento('reflexion_completada', 'Terminaron las 36 preguntas y los 4 minutos 💞');
        }
    };
    tic();
    _timerCuatro = setInterval(tic, 500);
}
function cerrarCuatroMinutos(){ clearInterval(_timerCuatro); document.querySelectorAll('.cuatro-min-fondo').forEach(x => x.remove()); }
