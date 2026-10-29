// ==================== FAROS (cooperativo, tipo Hanabi) ====================
// Ven las cartas del otro pero no las propias. Por turno: dar una pista
// (un color o un número: se marcan todas las que coinciden en la mano del
// otro), encender un faro jugando una carta, o descartar para recuperar
// una pista. Cada color se enciende en orden del 1 al 4. Tres errores y la
// tormenta apaga la noche. Cartas: color + número ("r3"), 8 por color.
const COLORES_FAROS = { r: { e: '🔴', n: 'rojo' }, a: { e: '🔵', n: 'azul' }, v: { e: '🟢', n: 'verde' }, m: { e: '🟡', n: 'amarillo' } };
const CANTIDAD_FAROS = { 1: 3, 2: 2, 3: 2, 4: 1 };
const PISTAS_FAROS = 6, TORMENTAS_FAROS = 3, MANO_FAROS = 4;
let _cartaFaros = null;

function mazoFaros(){
    const m = [];
    Object.keys(COLORES_FAROS).forEach(c => Object.entries(CANTIDAD_FAROS).forEach(([n, k]) => { for (let i = 0; i < k; i++) m.push(c + n); }));
    for (let i = m.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [m[i], m[j]] = [m[j], m[i]]; }
    return m;
}
const totalFaros = (f) => Object.values(f || {}).reduce((a, b) => a + b, 0);
function cartaFarosHtml(c, k, extra){
    const col = COLORES_FAROS[c[0]];
    return `<span class="carta-faro c-${c[0]}${extra || ''}"><b>${c[1]}</b><i>${col.e}</i>${k ? `<small>${k.kc ? '🎨' : ''}${k.kn ? '#' : ''}</small>` : ''}</span>`;
}
// Después de jugar o descartar: roba, pasa el turno y controla la última ronda.
function cerrarJugadaFaros(e, manos, cambios){
    const mazo = [...e.mazo];
    if (mazo.length) manos[miIdentidad] = [...manos[miIdentidad], { c: mazo.pop(), kc: false, kn: false }];
    let ultimaRonda = e.ultimaRonda;
    if (ultimaRonda != null) ultimaRonda--;
    else if (!mazo.length) ultimaRonda = 2; // se acabó el mazo: un turno más para cada uno
    const res = { ...cambios, manos, mazo, ultimaRonda, turno: miRival };
    const total = totalFaros(res.faros || e.faros);
    if (total >= 16) return { ...res, ganador: 'empate', motivo: '🎉 ¡Encendieron los 16 faros!' };
    if ((res.tormentas ?? e.tormentas) >= TORMENTAS_FAROS) return { ...res, ganador: 'empate', motivo: `La tormenta los alcanzó con ${total} faros encendidos.` };
    if (ultimaRonda != null && ultimaRonda <= 0) return { ...res, ganador: 'empate', motivo: `Se terminó el mazo: encendieron ${total} de 16 faros.` };
    return res;
}

const Faros = JuegoTurnos.crear({
    id: 'faros',
    emojiListo: '🗼',
    intro: `Juegan en equipo. Ven las cartas del otro pero no las tuyas. En tu turno: dale una pista (un color o un número), jugá una carta para encender un faro (cada color va del 1 al 4, en orden) o descartá para recuperar una pista. ¡${TORMENTAS_FAROS} errores y se viene la tormenta!`,
    inicial: () => {
        const mazo = mazoFaros();
        const mano = () => Array.from({ length: MANO_FAROS }, () => ({ c: mazo.pop(), kc: false, kn: false }));
        return { manos: { nico: mano(), carito: mano() }, mazo, faros: { r: 0, a: 0, v: 0, m: 0 }, pistas: PISTAS_FAROS, tormentas: 0, descarte: [], ultimaRonda: null, registro: '', marcadas: null };
    },
    tituloFin: (e) => totalFaros(e.faros) >= 16 ? '🌟 ¡Todos los faros encendidos!' : e.tormentas >= TORMENTAS_FAROS ? '⛈️ Ganó la tormenta' : `✨ ${totalFaros(e.faros)} de 16 faros`,
    textoTurno: () => '🎯 Tu turno: pista, jugar o descartar',
    render(e, c) {
        const marc = e.marcadas && e.marcadas.para ? e.marcadas : null;
        let h = `<div class="faros-fila">${Object.entries(COLORES_FAROS).map(([k, col]) => `<div class="faro c-${k}" data-aj-id="faro-${k}">
            <div class="torre">${[4, 3, 2, 1].map(n => `<i class="${e.faros[k] >= n ? 'on' : ''}"></i>`).join('')}</div><span>${col.e} ${e.faros[k]}</span></div>`).join('')}</div>
            <div class="texto-centro" style="font-size:0.85rem; margin:6px 0;">💡 ${e.pistas}/${PISTAS_FAROS} pistas · ⛈️ ${e.tormentas}/${TORMENTAS_FAROS} · 🂠 ${e.mazo.length} en el mazo${e.ultimaRonda != null ? ' · ⏳ ¡última ronda!' : ''}</div>`;
        if (e.registro) h += `<div class="registro-faros">${e.registro}</div>`;
        // Mano del otro: se ve, con lo que ya sabe de cada carta.
        h += `<div class="texto-tenue" style="font-size:0.78rem;">Cartas de ${nombreJugador(c.rival)} (🎨 sabe el color · # sabe el número):</div>
            <div class="mano-faros">${e.manos[c.rival].map((k, i) => cartaFarosHtml(k.c, k, marc && marc.para === c.rival && marc.idx.includes(i) ? ' marcada' : '')).join('')}</div>`;
        if (c.miTurno && e.pistas > 0) {
            h += `<div class="pistas-faros"><span>Pista:</span>${Object.entries(COLORES_FAROS).map(([k, col]) => `<button onclick="pistaFaros('c','${k}')">${col.e}</button>`).join('')}
                ${[1, 2, 3, 4].map(n => `<button onclick="pistaFaros('n','${n}')">${n}</button>`).join('')}</div>`;
        }
        // Mi mano: sólo lo que sé por las pistas.
        h += `<div class="texto-tenue" style="font-size:0.78rem; margin-top:10px;">Tus cartas (no las ves: sólo lo que te dijeron):</div>
            <div class="mano-faros mia">${e.manos[c.yo].map((k, i) => {
                const col = k.kc ? COLORES_FAROS[k.c[0]] : null;
                return `<button class="carta-faro oculta${col ? ' c-' + k.c[0] : ''}${_cartaFaros === i ? ' elegida' : ''}${marc && marc.para === c.yo && marc.idx.includes(i) ? ' marcada' : ''}" ${c.miTurno ? `onclick="elegirCartaFaros(${i})"` : ''}>
                    <b>${k.kn ? k.c[1] : '?'}</b><i>${col ? col.e : '❔'}</i></button>`;
            }).join('')}</div>`;
        if (c.miTurno && _cartaFaros != null) {
            h += `<div class="btn-fila"><button class="btn-principal" onclick="jugarCartaFaros()">🗼 Jugarla</button>
                <button class="btn-secundario" ${e.pistas >= PISTAS_FAROS ? 'disabled style="opacity:0.5;"' : ''} onclick="descartarFaros()">🗑️ Descartar (+1 💡)</button></div>`;
        }
        if (e.descarte.length) h += `<div class="descarte-faros"><span class="texto-tenue">Descartadas:</span> ${[...e.descarte].sort().map(x => cartaFarosHtml(x)).join('')}</div>`;
        return h;
    },
    alDibujar(cont, e) { if (e.fase !== 'jugando' || e.turno !== miIdentidad) _cartaFaros = null; }
});

function elegirCartaFaros(i){ vibrarJ(6); _cartaFaros = _cartaFaros === i ? null : i; Faros.redibujar(); }
async function pistaFaros(tipo, valor){
    vibrarJ(10);
    const res = await Faros.jugar((e) => {
        if (e.pistas <= 0) return null;
        const mano = e.manos[miRival];
        const idx = mano.map((k, i) => (tipo === 'c' ? k.c[0] === valor : k.c[1] === valor) ? i : -1).filter(i => i >= 0);
        if (!idx.length) return null;
        const nueva = mano.map((k, i) => idx.includes(i) ? { ...k, [tipo === 'c' ? 'kc' : 'kn']: true } : k);
        const que = tipo === 'c' ? `${COLORES_FAROS[valor].e} ${COLORES_FAROS[valor].n}` : `el ${valor}`;
        const res = { manos: { ...e.manos, [miRival]: nueva }, pistas: e.pistas - 1, turno: miRival, marcadas: { para: miRival, idx },
            registro: `💡 ${nombreJugador(miIdentidad)}: "tenés ${que} en ${idx.length === 1 ? 'la carta' : 'las cartas'} ${idx.map(i => i + 1).join(' y ')}"` };
        if (e.ultimaRonda != null) {
            res.ultimaRonda = e.ultimaRonda - 1;
            if (res.ultimaRonda <= 0) return { ...res, ganador: 'empate', motivo: `Se terminó el mazo: encendieron ${totalFaros(e.faros)} de 16 faros.` };
        }
        return res;
    });
    if (!res) { if (window.sfx) window.sfx.error(); if (window.animJuegos) window.animJuegos.cartel('No tiene ninguna así', { dur: 900, sonido: false }); }
    else if (window.sfx) window.sfx.click();
}
async function jugarCartaFaros(){
    const i = _cartaFaros;
    if (i == null) return;
    _cartaFaros = null;
    let bien = false;
    await Faros.jugar((e) => {
        const mano = [...e.manos[miIdentidad]], carta = mano[i];
        if (!carta) return null;
        mano.splice(i, 1);
        const col = carta.c[0], n = Number(carta.c[1]);
        bien = e.faros[col] === n - 1;
        const manos = { ...e.manos, [miIdentidad]: mano };
        if (bien) {
            const faros = { ...e.faros, [col]: n };
            return cerrarJugadaFaros(e, manos, { faros, pistas: n === 4 ? Math.min(PISTAS_FAROS, e.pistas + 1) : e.pistas, marcadas: null,
                registro: `🗼 ${nombreJugador(miIdentidad)} encendió el ${COLORES_FAROS[col].e} ${n}${n === 4 ? ' ¡y completó el color! (+1 💡)' : ''}` });
        }
        return cerrarJugadaFaros(e, manos, { tormentas: e.tormentas + 1, descarte: [...e.descarte, carta.c], marcadas: null,
            registro: `⛈️ ${nombreJugador(miIdentidad)} jugó el ${COLORES_FAROS[col].e} ${n} y no iba. ¡Rayo!` });
    });
    if (window.sfx) bien ? window.sfx.acierto() : window.sfx.error();
}
async function descartarFaros(){
    const i = _cartaFaros;
    if (i == null) return;
    _cartaFaros = null;
    await Faros.jugar((e) => {
        if (e.pistas >= PISTAS_FAROS) return null;
        const mano = [...e.manos[miIdentidad]], carta = mano[i];
        if (!carta) return null;
        mano.splice(i, 1);
        return cerrarJugadaFaros(e, { ...e.manos, [miIdentidad]: mano }, { pistas: e.pistas + 1, descarte: [...e.descarte, carta.c], marcadas: null,
            registro: `🗑️ ${nombreJugador(miIdentidad)} descartó el ${COLORES_FAROS[carta.c[0]].e} ${carta.c[1]} (+1 💡)` });
    });
    if (window.sfx) window.sfx.click();
}
