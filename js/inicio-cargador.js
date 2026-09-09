// ============================================================
// inicio-cargador.js — mismo patrón que js/cargador-juegos.js,
// pero para las secciones de index.html. Por ahora sólo mapea
// "Preguntas" (la primera sección migrada a este sistema); a medida
// que se migren más secciones (Ticket, Gratitud, Deseos, etc.) se
// van agregando acá, sin tocar el resto.
// ============================================================
const VERSION_CACHE_INICIO = 1;

function scriptsNecesariosParaFeature(featureId) {
    if (featureId === 'preguntasindex') {
        return [
            `js/motor-reflexion.js?v=${VERSION_CACHE_INICIO}`,
            `js/inicio/preguntas.js?v=${VERSION_CACHE_INICIO}`
        ];
    }
    if (['gratitud', 'deseos', 'ticket', 'sanacion', 'boleto', 'cielo', 'chat', 'muro', 'reproductor'].includes(featureId)) {
        return [`js/inicio/${featureId}.js?v=${VERSION_CACHE_INICIO}`];
    }
    return [];
}

const _scriptsYaCargadosInicio = new Set();
const _cargasEnCursoInicio = new Map();

function cargarScriptInicio(src) {
    if (_scriptsYaCargadosInicio.has(src)) return Promise.resolve();
    if (_cargasEnCursoInicio.has(src)) return _cargasEnCursoInicio.get(src);
    const promesa = new Promise((resolve, reject) => {
        const tag = document.createElement('script');
        tag.src = src;
        tag.onload = () => { _scriptsYaCargadosInicio.add(src); _cargasEnCursoInicio.delete(src); resolve(); };
        tag.onerror = () => { _cargasEnCursoInicio.delete(src); reject(new Error('No se pudo cargar ' + src)); };
        document.body.appendChild(tag);
    });
    _cargasEnCursoInicio.set(src, promesa);
    return promesa;
}

window.asegurarFeatureCargada = function (featureId) {
    const scripts = scriptsNecesariosParaFeature(featureId);
    return Promise.all(scripts.map(cargarScriptInicio));
};

// ============================================================
// Helper genérico para las burbujas flotantes simples (Gratitud,
// Deseos, Ticket, etc.): togglear la clase 'abierto', pedir la llave
// si hace falta, cargar el script bajo demanda la primera vez, y
// llamar a la función que arranca esa sección.
// ============================================================
async function abrirFeatureFlotante(featureId, flotanteId, nombreFuncionAbrir, accion){
    const flotante = document.getElementById(flotanteId);
    const estabaAbierto = flotante.classList.toggle('abierto');
    if (!estabaAbierto) return;
    if (!miIdentidad) { flotante.classList.remove('abierto'); requerirIdentidad(accion); return; }
    await cargarFeatureFlotanteSiHaceFalta(featureId, flotanteId, nombreFuncionAbrir);
}

async function cargarFeatureFlotanteSiHaceFalta(featureId, flotanteId, nombreFuncionAbrir){
    document.getElementById(flotanteId).classList.add('abierto');
    if (window['_featureCargada_' + featureId]) { window[nombreFuncionAbrir](); return; }
    try {
        await window.asegurarFeatureCargada(featureId);
        window['_featureCargada_' + featureId] = true;
        window[nombreFuncionAbrir]();
    } catch (err) {
        console.error('No se pudo cargar la sección ' + featureId + ':', err);
    }
}
window.abrirFeatureFlotante = abrirFeatureFlotante;
window.cargarFeatureFlotanteSiHaceFalta = cargarFeatureFlotanteSiHaceFalta;
