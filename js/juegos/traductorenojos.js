// ==================== TRADUCTOR DE ENOJOS ====================
// Escribís cómo te sentís en modo dramático y esto te devuelve una
// versión más tierna — no es IA real, es un diccionario de frases
// típicas de bronca suavizadas + una rebajada de gritos (MAYÚSCULAS,
// signos de exclamación repetidos). Pensado como un paso intermedio
// ANTES de mandarle el mensaje de verdad al otro: escribilo acá
// primero, mirá cómo suena más calmo, y ahí decidís qué decir. No
// necesita Firestore — todo pasa en el navegador, nada se guarda.
const SUSTITUCIONES_ENOJO = [
    [/\bte odio\b/gi, 'te quiero, pero ahora mismo estoy re enojado/a con vos'],
    [/\bodio\b/gi, 'no estoy nada contento/a con'],
    [/\bno (te )?soporto\b/gi, 'me está costando bastante'],
    [/\bno aguanto\b/gi, 'me está costando bastante'],
    [/\bsiempre\b/gi, 'a veces'],
    [/\bnunca\b/gi, 'no siempre'],
    [/\bhart[oa]\b/gi, 'un poco cansado/a'],
    [/\best[uú]pid[oa]\b/gi, 'medio despistado/a'],
    [/\bidiota\b/gi, 'medio torpe'],
    [/\bme arruinaste\b/gi, 'me complicaste un poco'],
    [/\btodo mal\b/gi, 'no salió como esperaba'],
    [/\bqu[eé] bronca\b/gi, 'qué fastidio, nada grave'],
    [/\bno me importa\b/gi, 'en realidad sí me importa, pero estoy dolido/a'],
    [/\bsos un desastre\b/gi, 'te desordenás bastante, pero se puede hablar'],
    [/\bme tenés cansad[oa]\b/gi, 'necesito un poco de espacio hoy'],
];

const PREAMBULOS_ENOJO = [
    'Lo que en el fondo quiero decir es:',
    'Traducido del enojo al amor:',
    'En criollo, sin tanto drama:',
    'Versión calmada de lo mismo:',
    'Lo que realmente siento, sin gritos:',
];
const POSTAMBULOS_ENOJO = [
    '(pero te sigo queriendo un montón) 💜',
    '(nada que una charla tranquila no arregle) 🤗',
    '(ya se me va a pasar, dame un rato) ⏳',
    '(y después de esto, un abrazo cae bien) 🫂',
    '(el enojo es real, pero el amor también) ❤️‍🩹',
];

const NIVELES_ENOJO = [
    { hasta: 1,  emoji: '🌤️', etiqueta: 'Brisa suave' },
    { hasta: 4,  emoji: '⛅',  etiqueta: 'Alguna nube' },
    { hasta: 8,  emoji: '🌧️', etiqueta: 'Lloviznando' },
    { hasta: 14, emoji: '⛈️', etiqueta: 'Tormenta' },
    { hasta: Infinity, emoji: '🌪️', etiqueta: 'Huracán total' },
];

function _medirEnojo(texto){
    let puntos = 0;
    puntos += (texto.match(/!/g) || []).length;
    puntos += (texto.match(/\b[A-ZÁÉÍÓÚÑ]{3,}\b/g) || []).length * 2;
    SUSTITUCIONES_ENOJO.forEach(([patron]) => { if (new RegExp(patron.source, 'i').test(texto)) puntos += 2; });
    return NIVELES_ENOJO.find(n => puntos <= n.hasta);
}

function _suavizarTexto(texto){
    let t = texto;
    SUSTITUCIONES_ENOJO.forEach(([patron, reemplazo]) => { t = t.replace(patron, reemplazo); });
    // Baja el volumen: palabras enteras en MAYÚSCULAS pasan a minúscula (con la inicial en mayúscula).
    t = t.replace(/\b[A-ZÁÉÍÓÚÑ]{3,}\b/g, (w) => w.charAt(0) + w.slice(1).toLowerCase());
    t = t.replace(/!{2,}/g, '.');
    t = t.replace(/\?{2,}/g, '?');
    return t.trim();
}

function _escaparTextoTraductor(texto){
    const div = document.createElement('div');
    div.innerText = texto == null ? '' : String(texto);
    return div.innerHTML;
}

function iniciarTraductorEnojos(){
    const cont = document.getElementById('contenido-traductorenojos');
    if (!cont) return;
    cont.innerHTML = `<div class="panel texto-centro">
        <p class="texto-tenue">Escribí cómo te sentís, tal cual, con toda la bronca. Después mirá cómo suena más calmo — es un paso intermedio antes de la charla de verdad, no se guarda en ningún lado.</p>
        <textarea id="input-traductor-enojo" placeholder="Ej: NUNCA me ayudás con nada y ya estoy HARTO/A!!!" rows="4" maxlength="300" style="width:100%; box-sizing:border-box; font-family:var(--fuente-texto); background:rgba(255,255,255,0.06); color:var(--texto); border:1px solid var(--borde); border-radius:12px; padding:10px; resize:none; margin-top:10px;"></textarea>
        <button class="btn-principal" style="margin-top:10px;" onclick="traducirEnojo()">💬 Traducir</button>
    </div>
    <div id="resultado-traductor-enojo"></div>`;
    const ta = document.getElementById('input-traductor-enojo');
    if (ta) ta.focus();
}

function traducirEnojo(){
    const input = document.getElementById('input-traductor-enojo');
    const cont = document.getElementById('resultado-traductor-enojo');
    if (!input || !cont) return;
    const original = input.value.trim();
    if (!original) return;
    vibrarJ(12);
    const nivel = _medirEnojo(original);
    const suavizado = _suavizarTexto(original);
    const preambulo = PREAMBULOS_ENOJO[Math.floor(Math.random() * PREAMBULOS_ENOJO.length)];
    const postambulo = POSTAMBULOS_ENOJO[Math.floor(Math.random() * POSTAMBULOS_ENOJO.length)];
    cont.innerHTML = `<div class="panel texto-centro logro-animado">
        <p class="texto-tenue" style="margin:0 0 4px;">Medidor de enojo</p>
        <p style="font-size:2rem; margin:0;">${nivel.emoji}</p>
        <p style="margin:0;">${nivel.etiqueta}</p>
    </div>
    <div class="panel">
        <p class="texto-tenue" style="margin:0 0 8px;">${preambulo}</p>
        <p style="margin:0 0 10px; font-weight:600;">${_escaparTextoTraductor(suavizado)}</p>
        <p class="texto-tenue" style="margin:0;">${postambulo}</p>
    </div>
    <button class="btn-secundario" onclick="iniciarTraductorEnojos()">🔁 Escribir otra cosa</button>`;
    if (window.sfx) window.sfx.revelar();
}
