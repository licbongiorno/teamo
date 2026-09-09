// ==================== CARGA DIFERIDA DE JUEGOS ====================
// Antes, juegos.html bajaba los 40 archivos js/juegos/*.js apenas se
// abría la página, aunque esa sesión sólo fuera a usar uno o dos.
// Ahora cada juego se carga recién la primera vez que se abre. Las
// cargas posteriores del mismo juego son instantáneas (queda cacheado).

// Estos 11 juegos comparten el motor genérico de "responder y revelar"
// (js/motor-reflexion.js), así que necesitan ese archivo además del suyo.
// Esta lista tiene que coincidir con JUEGOS_MOTOR_REFLEXION de navegacion.js.
const JUEGOS_QUE_USAN_MOTOR_REFLEXION = ['dilema', 'quehariassi', 'futuro', 'maquinatiempo', 'antesdedormir', 'album', 'nuncapregunte', 'conoceme', 'detective', 'destino', 'decisiones', 'trivianosotros', 'batallacanciones'];

// Versión de caché: sumale 1 cada vez que se actualicen archivos de
// juegos y el navegador/Vercel puedan estar sirviendo una copia vieja
// en caché. Cambiar este número fuerza a descargar la versión nueva.
const VERSION_CACHE = 3;

function scriptsNecesariosPara(juegoId) {
    // 'estadisticas' no es un juego del catálogo: su script (js/estadisticas.js)
    // ya se carga siempre de entrada, junto con el resto de la infraestructura
    // compartida — no hay nada más que bajar bajo demanda para esta pantalla.
    if (juegoId === 'estadisticas') return [];
    const propio = `js/juegos/${juegoId}.js?v=${VERSION_CACHE}`;
    if (JUEGOS_QUE_USAN_MOTOR_REFLEXION.includes(juegoId)) {
        return [`js/motor-reflexion.js?v=${VERSION_CACHE}`, propio];
    }
    return [propio];
}

const _scriptsYaCargados = new Set();
const _cargasEnCurso = new Map();

function cargarScript(src) {
    if (_scriptsYaCargados.has(src)) return Promise.resolve();
    if (_cargasEnCurso.has(src)) return _cargasEnCurso.get(src);
    const promesa = new Promise((resolve, reject) => {
        const tag = document.createElement('script');
        tag.src = src;
        tag.onload = () => { _scriptsYaCargados.add(src); _cargasEnCurso.delete(src); resolve(); };
        tag.onerror = () => { _cargasEnCurso.delete(src); reject(new Error('No se pudo cargar ' + src)); };
        document.body.appendChild(tag);
    });
    _cargasEnCurso.set(src, promesa);
    return promesa;
}

// Descarga (si hace falta) todo lo necesario para abrir un juego.
// Devuelve una promesa que se resuelve cuando ya está todo listo para
// llamar a su función iniciar<Juego>().
window.asegurarJuegoCargado = function (juegoId) {
    const scripts = scriptsNecesariosPara(juegoId);
    return Promise.all(scripts.map(cargarScript));
};
