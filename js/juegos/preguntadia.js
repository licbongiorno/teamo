// ==================== LA PREGUNTA DEL DÍA (motor de reflexión) ====================
// Este juego usa js/motor-reflexion.js — acá sólo va su configuración.
// Una sola pregunta por día, la misma para los dos (el motor la elige
// según la fecha, ver "unaPorDia" en motor-reflexion.js). Usa el banco
// de 787 preguntas del "Ping Pong de Preguntas" del inicio
// (js/inicio/preguntas.js, que el cargador baja junto con este archivo);
// si por algo no estuviera, usa un banco chico de respaldo.
window.CONFIG_REFLEXION = window.CONFIG_REFLEXION || {};
const _RESPALDO_PREGUNTA_DIA = [
    "¿Qué fue lo mejor de tu día de hoy?",
    "¿Qué te gustaría que hagamos este fin de semana?",
    "¿Qué canción no podés sacarte de la cabeza estos días?",
    "¿Qué te preocupa últimamente y todavía no me contaste?",
    "¿Qué pequeño logro tuyo de esta semana merece un festejo?",
    "¿Qué recuerdo nuestro te vino a la mente hoy?",
    "¿Qué necesitás de mí esta semana?",
    "¿Qué comida te gustaría comer mañana?",
    "¿De qué te reíste hoy?",
    "¿Qué te gustaría aprender este mes?"
];
window.CONFIG_REFLEXION['preguntadia'] = {
    tipo: 'texto',
    unaPorDia: true,
    nombreJuego: 'La Pregunta del Día',
    placeholder: 'Tu respuesta de hoy…',
    instrucciones: 'Una pregunta nueva cada día, la misma para los dos. Respondan cuando puedan y se revela cuando están las dos respuestas. Si el otro no la vio, mandásela por WhatsApp.',
    get banco() {
        const grande = window.CONFIG_REFLEXION['preguntasindex']?.banco;
        return (grande && grande.length) ? grande : _RESPALDO_PREGUNTA_DIA;
    }
};
