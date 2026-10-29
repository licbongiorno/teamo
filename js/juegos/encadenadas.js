// ==================== PALABRAS ENCADENADAS ====================
// Por turnos, contra reloj: cada palabra tiene que empezar con la última
// sílaba de la anterior (casa → sapo → pozo…). Se controla sola la sílaba
// y que no se repita; si el otro cree que la palabra no existe, la puede
// "dudar" y quien la puso pierde una vida (se validan entre ustedes, como
// en el Tutti Frutti). Se te acaba el tiempo: perdés una vida. 3 vidas.
const SEGUNDOS_ENCADENADAS = 30, VIDAS_ENCADENADAS = 3;
const ARRANQUES_ENCADENADAS = ['casa', 'mesa', 'gato', 'luna', 'playa', 'perro', 'fiesta', 'mate', 'torta', 'beso', 'nube', 'piano', 'campo', 'risa', 'cama', 'pelota', 'moto', 'flores'];
let _timerEnc = null;

const _sinTildeEnc = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ü/g, 'u');
// Última sílaba (aproximada, alcanza para jugar): núcleo vocálico final
// (con diptongos, separando hiatos) más su consonante de arranque.
function ultimaSilabaEnc(palabra){
    const w = palabra.toLowerCase().replace(/[^a-záéíóúüñ]/g, '');
    const vocal = (ch) => 'aeiouáéíóúü'.includes(ch);
    const fuerte = (ch) => 'aeoáéóíú'.includes(ch);
    let fin = w.length - 1;
    while (fin >= 0 && !vocal(w[fin])) fin--;
    if (fin < 0) return _sinTildeEnc(w);
    let ini = fin;
    while (ini > 0 && vocal(w[ini - 1]) && !(fuerte(w[ini - 1]) && fuerte(w[ini]))) ini--;
    // "qu" y "gu" delante de e/i: la u no suena, va con la consonante.
    let cons = ini;
    while (cons > 0 && !vocal(w[cons - 1])) cons--;
    const grupo = w.slice(cons, ini);
    const inseparables = ['bl', 'br', 'cl', 'cr', 'dr', 'fl', 'fr', 'gl', 'gr', 'pl', 'pr', 'tr', 'ch', 'll', 'rr', 'tl'];
    const arranque = grupo.length >= 2 && inseparables.includes(grupo.slice(-2)) ? grupo.slice(-2) : grupo.slice(-1);
    let s = _sinTildeEnc(arranque + w.slice(ini));
    if (s.startsWith('rr')) s = s.slice(1);
    return s;
}
function empiezaBienEnc(palabra, silaba){ return _sinTildeEnc(palabra.toLowerCase()).startsWith(silaba); }

const Encadenadas = JuegoTurnos.crear({
    id: 'encadenadas',
    emojiListo: '🔗',
    intro: `Cada palabra empieza con la última sílaba de la anterior: casa → sapo → pozo… Tenés ${SEGUNDOS_ENCADENADAS} segundos por turno. Si no se te ocurre, perdés una vida (hay ${VIDAS_ENCADENADAS}). ¿Te pusieron una palabra inventada? ¡Dudala!`,
    inicial: () => {
        const w = ARRANQUES_ENCADENADAS[Math.floor(Math.random() * ARRANQUES_ENCADENADAS.length)];
        return { cadena: [{ w, por: null }], silaba: ultimaSilabaEnc(w), vidas: { nico: VIDAS_ENCADENADAS, carito: VIDAS_ENCADENADAS }, turno: Math.random() < 0.5 ? 'nico' : 'carito', desde: window.ahoraSync(), usadas: [_sinTildeEnc(w)] };
    },
    textoTurno: (e) => `🎯 Tu turno: una palabra que empiece con "${e.silaba.toUpperCase()}"`,
    render(e, c) {
        const ult = e.cadena[e.cadena.length - 1];
        let h = `<div class="texto-centro" style="font-size:0.9rem;">${nombreJugador('nico')} ${'❤️'.repeat(e.vidas.nico)}${'🖤'.repeat(VIDAS_ENCADENADAS - e.vidas.nico)} · ${nombreJugador('carito')} ${'❤️'.repeat(e.vidas.carito)}${'🖤'.repeat(VIDAS_ENCADENADAS - e.vidas.carito)}</div>`;
        h += `<div class="cadena-enc">${e.cadena.slice(-6).map((x, k, arr) => `<span class="${x.por ? 'de-' + x.por : ''}${k === arr.length - 1 ? ' ultima' : ''}" data-aj-id="enc-${JuegoTurnos.esc(x.w)}">${JuegoTurnos.esc(x.w)}</span>`).join('<i>→</i>')}</div>`;
        if (e.fase === 'jugando') {
            h += `<div class="silaba-enc">Ahora con: <b>${e.silaba.toUpperCase()}…</b> <span>⏱️ <b id="reloj-enc">${SEGUNDOS_ENCADENADAS}</b>s</span></div>`;
            if (c.miTurno) {
                h += `<div class="entrada-enc"><input id="input-enc" maxlength="24" autocomplete="off" autocapitalize="off" placeholder="${e.silaba}…" onkeydown="if(event.key==='Enter')mandarEncadenada()"><button class="btn-principal" onclick="mandarEncadenada()">Mandar</button></div>`;
                if (ult.por && ult.por !== c.yo) h += `<button class="btn-secundario" onclick="dudarEncadenada()">🚫 "${JuegoTurnos.esc(ult.w)}" no existe</button>`;
            } else {
                h += `<div class="texto-centro texto-tenue destello">${nombreJugador(e.turno)} está pensando…</div>`;
            }
        }
        return h;
    },
    alDibujar(cont, e, c) {
        clearInterval(_timerEnc);
        if (e.fase !== 'jugando') return;
        if (c && c.miTurno) { const i = document.getElementById('input-enc'); if (i && document.activeElement !== i) setTimeout(() => i.focus(), 50); }
        const tic = () => {
            const quedan = Math.max(0, Math.ceil(SEGUNDOS_ENCADENADAS - (window.ahoraSync() - e.desde) / 1000));
            const r = document.getElementById('reloj-enc');
            if (r) { r.textContent = quedan; r.parentElement.classList.toggle('apurado', quedan <= 8); }
            if (quedan <= 0 && (window.ahoraSync() - e.desde) / 1000 > SEGUNDOS_ENCADENADAS + 1) { clearInterval(_timerEnc); vencerEncadenada(); }
        };
        tic();
        _timerEnc = setInterval(tic, 500);
        window._unsubTimerEnc = () => clearInterval(_timerEnc);
    }
});

function _perderVidaEnc(e, quien, extra, aviso){
    const vidas = { ...e.vidas, [quien]: e.vidas[quien] - 1 };
    const otro = quien === 'nico' ? 'carito' : 'nico';
    if (vidas[quien] <= 0) return { ...extra, vidas, ganador: otro, motivo: aviso };
    return { ...extra, vidas, aviso };
}
async function mandarEncadenada(){
    const input = document.getElementById('input-enc');
    const w = (input?.value || '').trim().toLowerCase();
    if (!w) return;
    let error = null;
    const res = await Encadenadas.jugar((e) => {
        error = null;
        if (!/^[a-záéíóúüñ]{3,24}$/.test(w)) { error = 'Sólo letras, y de 3 o más'; return null; }
        if (!empiezaBienEnc(w, e.silaba)) { error = `Tiene que empezar con "${e.silaba.toUpperCase()}"`; return null; }
        if ((e.usadas || []).includes(_sinTildeEnc(w))) { error = 'Esa ya se usó'; return null; }
        return { cadena: [...e.cadena, { w, por: miIdentidad, silabaAntes: e.silaba }].slice(-40), silaba: ultimaSilabaEnc(w), usadas: [...(e.usadas || []), _sinTildeEnc(w)], turno: miRival, desde: window.ahoraSync(), aviso: null };
    });
    if (!res) {
        if (window.sfx) window.sfx.error();
        if (error && window.animJuegos) window.animJuegos.cartel(error, { dur: 1200, sonido: false });
        return;
    }
    if (window.sfx) window.sfx.acierto();
}
// Dudar: la última palabra se borra, quien la puso pierde una vida y
// vuelve a tocarte a vos con la sílaba de antes.
async function dudarEncadenada(){
    vibrarJ([10, 30, 10]);
    await Encadenadas.jugar((e) => {
        const ult = e.cadena[e.cadena.length - 1];
        if (!ult.por || ult.por === miIdentidad) return null;
        return _perderVidaEnc(e, ult.por, { cadena: e.cadena.slice(0, -1), silaba: ult.silabaAntes, desde: window.ahoraSync() },
            `🚫 ${nombreJugador(miIdentidad)} dudó de "${ult.w}": ${nombreJugador(ult.por)} pierde una vida.`);
    });
    if (window.sfx) window.sfx.error();
}
async function vencerEncadenada(){
    await Encadenadas.accion((e) => {
        if ((window.ahoraSync() - e.desde) / 1000 < SEGUNDOS_ENCADENADAS + 1) return null;
        const w = ARRANQUES_ENCADENADAS[Math.floor(Math.random() * ARRANQUES_ENCADENADAS.length)];
        const quien = e.turno, otro = quien === 'nico' ? 'carito' : 'nico';
        return _perderVidaEnc(e, quien, { cadena: [...e.cadena, { w, por: null }].slice(-40), silaba: ultimaSilabaEnc(w), turno: otro, desde: window.ahoraSync() },
            `⌛ A ${nombreJugador(quien)} se le acabó el tiempo. Arranca de nuevo con "${w}".`);
    });
}
