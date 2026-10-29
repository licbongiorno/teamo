// ==================== PELIS EN EMOJIS (cooperativo) ====================
// Uno elige una peli, serie o canción (del banco o una propia) y la cuenta
// sólo con emojis. El otro tiene 3 intentos; las pistas cuestan puntos.
// Se turnan durante 8 rondas y suman juntos.
const RONDAS_EMOJI = 8;
const BANCO_EMOJI = [
    ['El Rey León', 'peli'], ['Titanic', 'peli'], ['Toy Story', 'peli'], ['Buscando a Nemo', 'peli'], ['Harry Potter', 'peli'], ['Jurassic Park', 'peli'],
    ['La Sirenita', 'peli'], ['Frozen', 'peli'], ['Shrek', 'peli'], ['Ratatouille', 'peli'], ['Up', 'peli'], ['Coco', 'peli'], ['Volver al Futuro', 'peli'],
    ['El Señor de los Anillos', 'peli'], ['Piratas del Caribe', 'peli'], ['Star Wars', 'peli'], ['Spiderman', 'peli'], ['Batman', 'peli'], ['Matrix', 'peli'],
    ['La Bella y la Bestia', 'peli'], ['Cenicienta', 'peli'], ['Mi Villano Favorito', 'peli'], ['Intensa-Mente', 'peli'], ['Tiburón', 'peli'], ['ET', 'peli'],
    ['El Secreto de sus Ojos', 'peli'], ['Relatos Salvajes', 'peli'], ['Esperando la Carroza', 'peli'], ['Nueve Reinas', 'peli'], ['Argentina 1985', 'peli'],
    ['Casados con Hijos', 'serie'], ['Los Simuladores', 'serie'], ['Friends', 'serie'], ['Stranger Things', 'serie'], ['La Casa de Papel', 'serie'],
    ['Game of Thrones', 'serie'], ['Los Simpson', 'serie'], ['Breaking Bad', 'serie'], ['El Chavo del 8', 'serie'], ['Bob Esponja', 'serie'],
    ['Muchachos', 'canción'], ['De Música Ligera', 'canción'], ['Despacito', 'canción'], ['La Bamba', 'canción'], ['Thriller', 'canción'],
    ['Yellow Submarine', 'canción'], ['Persiana Americana', 'canción'], ['Mil Horas', 'canción'], ['Cielito Lindo', 'canción'], ['Let It Go', 'canción'],
];
const TECLADO_EMOJI = ['🦁', '👑', '🚢', '🧊', '💔', '🐟', '🔎', '🧙', '⚡', '🦖', '🧜‍♀️', '❄️', '👸', '🤴', '🐀', '👨‍🍳', '🎈', '🏠', '💀', '🎸', '⏰', '🚗', '💍', '🌋',
    '🏴‍☠️', '⭐', '⚔️', '🕷️', '🦇', '🕶️', '🌹', '🐻', '👠', '😈', '😀', '😢', '😡', '😱', '🦈', '👽', '👁️', '🔫', '🃏', '👮', '⚖️', '👨‍👩‍👧', '🍕', '🍔',
    '☕', '🍷', '🎤', '🎵', '🎻', '🥁', '💃', '🕺', '⚽', '🏆', '🇦🇷', '🌎', '🌙', '☀️', '🌧️', '🔥', '💧', '🌳', '🐶', '🐱', '🐴', '🐉', '🤖', '👻', '💰', '🏦',
    '🔑', '🚀', '✈️', '🚂', '🏝️', '❤️', '🧽', '🦀', '🎄', '🎃', '1️⃣', '2️⃣', '3️⃣', '9️⃣', '➕', '➡️', '❌', '🔙', '🔜'];
let _emojisArmando = [], _tituloEmoji = null, _opcionesEmoji = null;

const _normEmoji = (t) => String(t).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9ñ ]/g, ' ').replace(/\b(el|la|los|las|de|del|un|una)\b/g, ' ').replace(/\s+/g, ' ').trim();
function parecidoEmoji(a, b){
    a = _normEmoji(a); b = _normEmoji(b);
    if (a === b) return true;
    if (Math.min(a.length, b.length) < 6) return false;
    // Hasta 2 letras de diferencia (distancia de edición).
    const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
    for (let j = 1; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return d[a.length][b.length] <= 2;
}

const EmojiPelis = JuegoTurnos.crear({
    id: 'emojipelis',
    emojiListo: '🎬',
    intro: `Uno cuenta una peli, serie o canción sólo con emojis y el otro la adivina (3 intentos). Juegan en equipo: ${RONDAS_EMOJI} rondas turnándose, y suman puntos juntos.`,
    inicial: (previo) => ({ usados: (previo.usados || []).slice(-24), ronda: 1, etapa: 'contar', titulo: '', cat: '', emojis: '', intentos: [], pistas: [], puntos: 0, record: previo.record || 0, turno: Math.random() < 0.5 ? 'nico' : 'carito' }),
    tituloFin: (e) => e.motivo && e.motivo.startsWith('🎉') ? '🎬 ¡Récord de cinéfilos!' : `🎬 ${e.puntos} puntos juntos`,
    textoTurno: (e) => e.etapa === 'contar' ? '🎬 Elegí algo y contalo con emojis' : '🤔 ¡Adiviná!',
    render(e, c) {
        const esc = JuegoTurnos.esc;
        let h = `<div class="texto-centro" style="font-size:0.85rem;">Ronda ${e.ronda}/${RONDAS_EMOJI} · ⭐ ${e.puntos} puntos juntos${e.record ? ` · récord ${e.record}` : ''}</div>`;
        if (e.ultimo) h += `<div class="texto-centro texto-tenue" style="font-size:0.8rem;">${esc(e.ultimo)}</div>`;
        if (e.etapa === 'contar') {
            if (!c.miTurno) return h + `<div class="panel texto-centro texto-tenue destello">${nombreJugador(e.turno)} está armando el acertijo con emojis… 🤫</div>`;
            if (!_tituloEmoji) {
                if (!_opcionesEmoji || _opcionesEmoji.ronda !== e.ronda) _opcionesEmoji = { ronda: e.ronda, op: BANCO_EMOJI.filter(([t]) => !(e.usados || []).includes(t)).sort(() => Math.random() - 0.5).slice(0, 3) };
                const op = _opcionesEmoji.op;
                return h + `<div class="panel texto-centro"><b>Elegí qué vas a contar</b>${op.map(([t, k]) => `<button class="opcion-lenguaje" onclick="elegirEmoji(this.dataset.t, '${k}')" data-t="${esc(t)}">${k === 'peli' ? '🎬' : k === 'serie' ? '📺' : '🎵'} ${esc(t)}</button>`).join('')}
                    <div class="entrada-enc"><input id="propio-emoji" maxlength="40" placeholder="…o escribí la tuya"><button class="btn-secundario" onclick="elegirEmoji(document.getElementById('propio-emoji').value, 'peli')">Usar</button></div></div>`;
            }
            return h + `<div class="panel texto-centro"><div class="texto-tenue" style="font-size:0.8rem;">Contá con emojis: <b>${esc(_tituloEmoji.t)}</b></div>
                <div class="emojis-armados">${_emojisArmando.join('') || '…'}</div>
                <div class="teclado-emoji">${TECLADO_EMOJI.map(x => `<button onclick="sumarEmoji('${x}')">${x}</button>`).join('')}</div>
                <div class="btn-fila"><button class="btn-secundario" onclick="sacarEmoji()">⌫</button><button class="btn-secundario" onclick="_tituloEmoji=null;_emojisArmando=[];EmojiPelis.redibujar()">Cambiar</button>
                <button class="btn-principal" ${_emojisArmando.length >= 2 ? '' : 'disabled style="opacity:0.5;"'} onclick="mandarEmojis()">Mandar</button></div></div>`;
        }
        const adivina = e.turno === c.yo;
        h += `<div class="emojis-acertijo">${esc(e.emojis)}</div>`;
        if (e.pistas.includes('cat')) h += `<div class="texto-centro">💡 Es ${e.cat === 'canción' ? 'una canción' : e.cat === 'serie' ? 'una serie' : 'una peli'}</div>`;
        if (e.pistas.includes('letra')) h += `<div class="texto-centro">💡 Empieza con <b>${esc(e.titulo[0].toUpperCase())}</b> y tiene ${e.titulo.split(' ').length} palabra${e.titulo.split(' ').length === 1 ? '' : 's'}</div>`;
        if (e.intentos.length) h += `<div class="texto-centro texto-tenue" style="font-size:0.85rem;">❌ ${e.intentos.map(esc).join(' · ')}</div>`;
        if (adivina && e.fase === 'jugando') {
            h += `<div class="entrada-enc"><input id="input-emoji" maxlength="50" placeholder="¿Qué es? (intento ${e.intentos.length + 1}/3)" onkeydown="if(event.key==='Enter')adivinarEmoji()"><button class="btn-principal" onclick="adivinarEmoji()">Probar</button></div>
                <div class="btn-fila">${!e.pistas.includes('cat') ? `<button class="btn-secundario" onclick="pistaEmoji('cat')">💡 ¿Peli, serie o canción? (−1)</button>` : ''}${!e.pistas.includes('letra') ? `<button class="btn-secundario" onclick="pistaEmoji('letra')">🔤 Primera letra (−1)</button>` : ''}</div>`;
        } else if (e.fase === 'jugando') {
            h += `<div class="panel texto-centro texto-tenue">Era <b>${esc(e.titulo)}</b>. ${nombreJugador(e.turno)} está adivinando…</div>`;
        }
        return h;
    }
});

function elegirEmoji(t, cat){
    t = String(t || '').trim().slice(0, 40);
    if (t.length < 2) return;
    vibrarJ(8);
    _tituloEmoji = { t, cat };
    _emojisArmando = [];
    EmojiPelis.redibujar();
}
function sumarEmoji(x){ vibrarJ(4); if (_emojisArmando.length < 12) _emojisArmando.push(x); EmojiPelis.redibujar(); }
function sacarEmoji(){ _emojisArmando.pop(); EmojiPelis.redibujar(); }
async function mandarEmojis(){
    if (!_tituloEmoji || _emojisArmando.length < 2) return;
    const { t, cat } = _tituloEmoji, emojis = _emojisArmando.join('');
    const res = await EmojiPelis.jugar((e) => e.etapa === 'contar' ? { etapa: 'adivinar', titulo: t, cat, emojis, intentos: [], pistas: [], turno: miRival, ultimo: '', usados: [...(e.usados || []), t].slice(-30) } : null);
    if (res) { _tituloEmoji = null; _emojisArmando = []; if (window.sfx) window.sfx.click(); }
}
function _siguienteRondaEmoji(e, puntos, ultimo){
    if (e.ronda >= RONDAS_EMOJI) {
        const record = Math.max(e.record || 0, puntos);
        return { puntos, record, ultimo, ganador: 'empate', motivo: puntos > (e.record || 0) ? `🎉 ¡Nuevo récord: ${puntos} puntos!` : `Hicieron ${puntos} puntos (récord: ${e.record}).` };
    }
    // Ahora cuenta el que recién adivinó.
    return { puntos, ultimo, ronda: e.ronda + 1, etapa: 'contar', titulo: '', emojis: '', intentos: [], pistas: [], turno: miIdentidad };
}
async function adivinarEmoji(){
    const g = (document.getElementById('input-emoji')?.value || '').trim();
    if (!g) return;
    let bien = false;
    await EmojiPelis.jugar((e) => {
        if (e.etapa !== 'adivinar') return null;
        bien = parecidoEmoji(g, e.titulo);
        if (bien) {
            const gano = Math.max(0, 3 - e.intentos.length - e.pistas.length);
            return _siguienteRondaEmoji(e, e.puntos + gano, `✅ ${e.emojis} = ${e.titulo} (+${gano})`);
        }
        const intentos = [...e.intentos, g.slice(0, 50)];
        if (intentos.length >= 3) return _siguienteRondaEmoji(e, e.puntos, `😅 ${e.emojis} era ${e.titulo}`);
        return { intentos };
    });
    if (window.sfx) bien ? window.sfx.acierto() : window.sfx.error();
    if (bien && window.fx) window.fx.confeti(20);
}
async function pistaEmoji(tipo){ vibrarJ(6); await EmojiPelis.jugar((e) => e.etapa === 'adivinar' && !e.pistas.includes(tipo) ? { pistas: [...e.pistas, tipo] } : null); }
