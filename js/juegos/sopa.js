// ==================== SOPA DE LETRAS (duelo) ====================
// La misma sopa de 10x10 para los dos, con 8 palabras de un tema. Se
// marca tocando la primera letra y la última. Gana el primero en
// encontrar las 8, o quien tenga más cuando pasan 3 minutos.
const TAM_SOPA = 10, SEGUNDOS_SOPA = 180;
const TEMAS_SOPA = {
    '🍕 Comidas': ['pizza', 'asado', 'fideos', 'empanada', 'milanesa', 'tarta', 'ensalada', 'helado', 'locro', 'sushi'],
    '🐾 Animales': ['gato', 'perro', 'conejo', 'tortuga', 'caballo', 'jirafa', 'leon', 'pinguino', 'delfin', 'zorro'],
    '🏖️ Vacaciones': ['playa', 'arena', 'valija', 'avion', 'hotel', 'mar', 'sol', 'carpa', 'pileta', 'mapa'],
    '💞 Nosotros': ['amor', 'beso', 'abrazo', 'cita', 'carta', 'regalo', 'flores', 'mimos', 'risas', 'sueños'],
    '🎵 Música': ['guitarra', 'piano', 'bateria', 'cancion', 'banda', 'ritmo', 'tango', 'cumbia', 'rock', 'violin'],
    '🏠 La casa': ['cocina', 'living', 'cama', 'mesa', 'silla', 'ventana', 'puerta', 'balcon', 'techo', 'patio'],
    '⚽ Deportes': ['futbol', 'tenis', 'rugby', 'hockey', 'boxeo', 'natacion', 'voley', 'golf', 'yoga', 'surf'],
    '🌦️ Clima': ['lluvia', 'viento', 'nieve', 'trueno', 'nube', 'niebla', 'calor', 'frio', 'granizo', 'rayo'],
};
const DIRS_SOPA = [[0, 1], [1, 0], [1, 1], [-1, 1], [0, -1], [1, -1]];

function armarSopa() {
    const temas = Object.keys(TEMAS_SOPA), tema = temas[Math.floor(Math.random() * temas.length)];
    for (let intento = 0; intento < 40; intento++) {
        const g = Array(TAM_SOPA * TAM_SOPA).fill('');
        const elegidas = [...TEMAS_SOPA[tema]].filter(p => p.length <= TAM_SOPA).sort(() => Math.random() - 0.5);
        const palabras = [];
        for (const p of elegidas) {
            if (palabras.length >= 8) break;
            const letras = [...p.toUpperCase()];
            let puesta = false;
            for (let k = 0; k < 120 && !puesta; k++) {
                const [df, dc] = DIRS_SOPA[Math.floor(Math.random() * DIRS_SOPA.length)];
                const f0 = Math.floor(Math.random() * TAM_SOPA), c0 = Math.floor(Math.random() * TAM_SOPA);
                const celdas = letras.map((_, i) => [f0 + df * i, c0 + dc * i]);
                if (!celdas.every(([f, c]) => f >= 0 && f < TAM_SOPA && c >= 0 && c < TAM_SOPA)) continue;
                if (!celdas.every(([f, c], i) => !g[f * TAM_SOPA + c] || g[f * TAM_SOPA + c] === letras[i])) continue;
                celdas.forEach(([f, c], i) => { g[f * TAM_SOPA + c] = letras[i]; });
                palabras.push({ p: p.toUpperCase(), c: celdas.map(([f, c]) => f * TAM_SOPA + c) });
                puesta = true;
            }
        }
        if (palabras.length < 8) continue;
        const abc = 'ABCDEFGHIJLMNOPRSTUV';
        return { tema, grilla: g.map(x => x || abc[Math.floor(Math.random() * abc.length)]).join(''), palabras };
    }
    return armarSopa();
}
let _primeraSopa = null, _timerSopa = null;

const Sopa = JuegoTurnos.crear({
    id: 'sopa',
    sinTurno: true,
    emojiListo: '🔎',
    intro: `La misma sopa de letras para los dos, ${SEGUNDOS_SOPA / 60} minutos. Marcá cada palabra tocando su primera y su última letra (pueden estar en horizontal, vertical, diagonal o al revés). Gana el primero en encontrar las 8.`,
    inicial: () => ({ ...armarSopa(), encontradas: { nico: [], carito: [] }, inicio: window.ahoraSync(), turno: null }),
    render(e, c) {
        const yo = c.yo, el = c.rival, mias = e.encontradas[yo] || [], suyas = e.encontradas[el] || [];
        const marcadas = new Set(mias.flatMap(k => e.palabras[k].c));
        let h = `<div class="texto-centro" style="font-size:0.9rem;">${e.tema} · ⏱️ <b id="reloj-sopa">${SEGUNDOS_SOPA}</b>s</div>
            <div class="texto-centro texto-tenue" style="font-size:0.8rem;">Vos ${mias.length}/8 · ${nombreJugador(el)} ${suyas.length}/8</div>`;
        h += `<div class="grilla-sopa">${[...e.grilla].map((l, i) => `<button class="letra-sopa${marcadas.has(i) ? ' encontrada' : ''}${_primeraSopa === i ? ' primera' : ''}" ${e.fase === 'jugando' ? `onclick="tocarSopa(${i})"` : ''}>${l}</button>`).join('')}</div>`;
        h += `<div class="lista-sopa">${e.palabras.map((w, k) => `<span class="${mias.includes(k) ? 'tachada' : ''}${suyas.includes(k) ? ' del-otro' : ''}">${w.p}</span>`).join('')}</div>
            <div class="texto-tenue texto-centro" style="font-size:0.72rem;">Tachadas: las tuyas · con puntito: las que ya encontró ${nombreJugador(el)}</div>`;
        return h;
    },
    alDibujar(cont, e) {
        clearInterval(_timerSopa);
        if (e.fase !== 'jugando') return;
        const tic = () => {
            const quedan = Math.max(0, Math.ceil(SEGUNDOS_SOPA - (window.ahoraSync() - e.inicio) / 1000));
            const r = document.getElementById('reloj-sopa');
            if (r) r.textContent = quedan;
            if (quedan <= 0) { clearInterval(_timerSopa); finSopa(); }
        };
        tic();
        _timerSopa = setInterval(tic, 500);
        window._unsubTimerSopa = () => clearInterval(_timerSopa);
    }
});

function tocarSopa(i) {
    vibrarJ(6);
    if (_primeraSopa === null) { _primeraSopa = i; if (window.sfx) window.sfx.seleccionar(); Sopa.redibujar(); return; }
    const a = _primeraSopa;
    _primeraSopa = null;
    if (a === i) { Sopa.redibujar(); return; }
    marcarSopa(a, i);
}
async function marcarSopa(a, b) {
    let k = -1;
    const res = await Sopa.accion((e) => {
        k = e.palabras.findIndex(w => (w.c[0] === a && w.c[w.c.length - 1] === b) || (w.c[0] === b && w.c[w.c.length - 1] === a));
        const mias = e.encontradas[miIdentidad] || [];
        if (k < 0 || mias.includes(k)) return null;
        const nuevas = [...mias, k];
        const cambios = { encontradas: { ...e.encontradas, [miIdentidad]: nuevas } };
        if (nuevas.length >= e.palabras.length) return { ...cambios, ganador: miIdentidad, motivo: '¡Encontró las 8 palabras!' };
        return cambios;
    });
    if (res && window.sfx) window.sfx.acierto();
    if (!res) { if (window.sfx) window.sfx.error(); Sopa.redibujar(); }
}
async function finSopa() {
    await Sopa.accion((e) => {
        if ((window.ahoraSync() - e.inicio) / 1000 < SEGUNDOS_SOPA) return null;
        const n = (e.encontradas.nico || []).length, c = (e.encontradas.carito || []).length;
        return { ganador: n === c ? 'empate' : n > c ? 'nico' : 'carito', motivo: `Se terminó el tiempo: ${nombreJugador('nico')} ${n} — ${c} ${nombreJugador('carito')}` };
    });
}
