// ==================== TE PREGUNTO YO (motor de reflexión) ====================
// Este juego usa js/motor-reflexion.js — acá sólo va su configuración.
// Sin banco: cada uno escribe su propia pregunta ("permitePropia"), los
// dos la responden a solas y se revela junta. Mientras el otro no
// respondió, se le puede mandar por WhatsApp con un link directo.
window.CONFIG_REFLEXION = window.CONFIG_REFLEXION || {};
window.CONFIG_REFLEXION['tepreguntoyo'] = {
    tipo: 'texto',
    permitePropia: true,
    nombreJuego: 'Te Pregunto Yo',
    placeholder: 'Tu respuesta...',
    placeholderPropia: 'Ej: ¿Qué es lo que más te gusta de nuestros domingos?',
    instrucciones: 'Escribí la pregunta que quieras. Los dos la responden a solas (vos también) y se revela cuando están las dos respuestas.',
    banco: []
};
