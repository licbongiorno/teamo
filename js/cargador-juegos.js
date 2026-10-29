// ==================== CARGA DIFERIDA DE JUEGOS ====================
// Antes, juegos.html bajaba los 40 archivos js/juegos/*.js apenas se
// abría la página, aunque esa sesión sólo fuera a usar uno o dos.
// Ahora cada juego se carga recién la primera vez que se abre. Las
// cargas posteriores del mismo juego son instantáneas (queda cacheado).

// Estos 11 juegos comparten el motor genérico de "responder y revelar"
// (js/motor-reflexion.js), así que necesitan ese archivo además del suyo.
// Esta lista tiene que coincidir con JUEGOS_MOTOR_REFLEXION de navegacion.js.
const JUEGOS_QUE_USAN_MOTOR_REFLEXION = ['dilema', 'quehariassi', 'futuro', 'maquinatiempo', 'antesdedormir', 'album', 'nuncapregunte', 'conoceme', 'detective', 'destino', 'decisiones', 'trivianosotros', 'batallacanciones', 'queprefieres', 'masprobable', 'completafrase', 'preguntadia', 'tepreguntoyo', 'treintayseis', 'mapaamor'];

// Estos juegos son "en vivo, los dos a la vez" y comparten la
// bureaucracia de js/arcade-comun.js (esperar a que ambos estén
// listos, arrancar sincronizados con cuenta regresiva, etc).
const JUEGOS_QUE_USAN_ARCADE_COMUN = ['burbujas', 'bombas', 'pinatas', 'carreraglobos', 'ritmo', 'bloques', 'cocodrilos', 'pesca', 'ladrillos', 'tiraafloja', 'calculo', 'stroop', 'anagramas', 'tipeo', 'topo', 'blancomovil', 'buscaminas', 'ppt', 'trivia', 'simon', 'memoriarelampago', 'semaforo', 'palabras'];

// Juegos nuevos armados sobre js/juegos/base-turnos.js (listos, turnos,
// fin de partida, revancha, compu).
const JUEGOS_QUE_USAN_BASE_TURNOS = ['gomoku', 'mancala', 'serpientes', 'parchis', 'domino', 'backgammon', 'guerra', 'blackjack', 'poker', 'codigo', 'onda', 'mente', 'palabradia', 'rosco', 'sopa', 'laberinto', 'cocina', 'faros', 'damaschinas', 'quoridor', 'cifras', 'encadenadas', 'exquisito', 'mastermind', 'hex', 'fosforos', 'chancho', 'sieteymedio', 'pescar', 'historia', 'emojipelis', 'tabu', 'aventura', 'hockey', 'motos', 'bombitas', 'fuegoagua', 'autitos', 'voley', 'snake2', 'pongcoop', 'tanques', 'pescavivo', 'obstaculos', 'futbolcabezas', 'pingpongvivo', 'natacion'];

// Versión de caché: sumale 1 cada vez que se actualicen archivos de
// juegos y el navegador/Vercel puedan estar sirviendo una copia vieja
// en caché. Cambiar este número fuerza a descargar la versión nueva.
const VERSION_CACHE = 89;

function scriptsNecesariosPara(juegoId) {
    // 'estadisticas' no es un juego del catálogo: su script (js/estadisticas.js)
    // ya se carga siempre de entrada, junto con el resto de la infraestructura
    // compartida — no hay nada más que bajar bajo demanda para esta pantalla.
    if (juegoId === 'estadisticas' || juegoId === 'momentos') return []; // momentos.js se carga siempre
    const propio = `js/juegos/${juegoId}.js?v=${VERSION_CACHE}`;
    // La Pregunta del Día reusa el banco grande del "Ping Pong de
    // Preguntas" del inicio, así que baja también ese archivo.
    if (juegoId === 'preguntadia') {
        return [`js/motor-reflexion.js?v=${VERSION_CACHE}`, `js/inicio/preguntas.js?v=${VERSION_CACHE}`, propio];
    }
    // El Ping Pong tiene su banco de preguntas en un archivo aparte.
    // Chokurei: el personaje animado va en un archivo aparte.
    if (juegoId === 'mascota') {
        return [`js/juegos/chokurei-rig.js?v=${VERSION_CACHE}`, propio,
            `js/juegos/chokurei-tienda.js?v=${VERSION_CACHE}`, `js/juegos/chokurei-juegos.js?v=${VERSION_CACHE}`, `js/juegos/chokurei-mundo.js?v=${VERSION_CACHE}`,
            `js/juegos/chokurei-crecer.js?v=${VERSION_CACHE}`, `js/juegos/chokurei-casa.js?v=${VERSION_CACHE}`, `js/juegos/chokurei-conexion.js?v=${VERSION_CACHE}`];
    }
    if (juegoId === 'multiverso') {
        const mv = ['mv-audio', 'mv-entrada', 'mv-fondo', 'mv-ranking', 'mv-naves', 'mv-modos'].map(n => `js/juegos/multiverso/${n}.js?v=${VERSION_CACHE}`);
        return [...mv, propio];
    }
    if (juegoId === 'anagramas') {
        return [`js/arcade-comun.js?v=${VERSION_CACHE}`, `js/juegos/anagramas-banco.js?v=${VERSION_CACHE}`, propio];
    }
    if (juegoId === 'pingpong') {
        return [`js/juegos/pingpong-banco.js?v=${VERSION_CACHE}`, propio];
    }
    if (JUEGOS_QUE_USAN_MOTOR_REFLEXION.includes(juegoId)) {
        return [`js/motor-reflexion.js?v=${VERSION_CACHE}`, propio];
    }
    if (JUEGOS_QUE_USAN_BASE_TURNOS.includes(juegoId)) {
        const extra = ['guerra', 'blackjack', 'poker'].includes(juegoId) ? [`js/juegos/cartas-francesas.js?v=${VERSION_CACHE}`] : [];
        return [`js/juegos/base-turnos.js?v=${VERSION_CACHE}`, ...extra, propio];
    }
    if (JUEGOS_QUE_USAN_ARCADE_COMUN.includes(juegoId)) {
        return [`js/arcade-comun.js?v=${VERSION_CACHE}`, propio];
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
window.asegurarJuegoCargado = async function (juegoId) {
    const scripts = scriptsNecesariosPara(juegoId);
    // Los juegos sobre base-turnos.js usan la base apenas se ejecutan:
    // primero la base, después el juego (en paralelo el orden no está
    // garantizado). Los demás se siguen bajando todos juntos.
    if (scripts.length > 1 && JUEGOS_QUE_USAN_BASE_TURNOS.includes(juegoId)) {
        for (const src of scripts) await cargarScript(src);
        return;
    }
    await Promise.all(scripts.map(cargarScript));
};
