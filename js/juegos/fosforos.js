// ==================== EL ÚLTIMO FÓSFORO (Nim) ====================
// Cuatro filas de fósforos (1, 3, 5 y 7). En tu turno sacás los que
// quieras, pero de una sola fila. Pierde el que se lleva el último.
const FILAS_FOSFOROS = [1, 3, 5, 7];
let _selFos = { fila: null, cant: 0 };

// Posiciones perdedoras para quien mueve (misère), con memoria.
const _memoFos = {};
function ganaQuienMueveFos(filas){
    const k = [...filas].sort().join(',');
    if (k in _memoFos) return _memoFos[k];
    if (filas.every(x => x === 0)) return (_memoFos[k] = true); // el otro se llevó el último: gano yo
    let gana = false;
    for (let f = 0; f < filas.length && !gana; f++) for (let n = 1; n <= filas[f] && !gana; n++) {
        const nf = [...filas]; nf[f] -= n;
        if (!ganaQuienMueveFos(nf)) gana = true;
    }
    return (_memoFos[k] = gana);
}

const Fosforos = JuegoTurnos.crear({
    id: 'fosforos',
    emojiListo: '🔥',
    intro: 'Sacá los fósforos que quieras, pero todos de la misma fila. El que se lleva el último fósforo ¡pierde!',
    inicial: () => ({ filas: [...FILAS_FOSFOROS], turno: Math.random() < 0.5 ? 'nico' : 'carito', ultima: null }),
    textoTurno: () => '🎯 Tu turno: tocá los fósforos que sacás (de una fila)',
    render(e, c) {
        let h = `<div class="mesa-fosforos">`;
        e.filas.forEach((n, f) => {
            h += `<div class="fila-fosforos">`;
            for (let k = 0; k < FILAS_FOSFOROS[f]; k++) {
                const vivo = k < n;
                const sel = vivo && _selFos.fila === f && k >= n - _selFos.cant;
                const recien = !vivo && e.ultima && e.ultima.fila === f && k < n + e.ultima.cant;
                h += `<button class="fosforo${vivo ? '' : ' quemado'}${sel ? ' elegido' : ''}${recien ? ' recien' : ''}" ${c.miTurno && vivo ? `onclick="tocarFosforo(${f}, ${k})"` : 'tabindex="-1"'} data-aj-id="fos-${f}-${k}"></button>`;
            }
            h += `<span class="texto-tenue">${n}</span></div>`;
        });
        h += `</div>`;
        if (e.ultima) h += `<div class="texto-centro texto-tenue" style="font-size:0.8rem;">${nombreJugador(e.ultima.quien)} sacó ${e.ultima.cant} de la fila ${e.ultima.fila + 1}</div>`;
        if (c.miTurno) h += `<button class="btn-principal" ${_selFos.cant ? '' : 'disabled style="opacity:0.5;"'} onclick="sacarFosforos()">🔥 Sacar ${_selFos.cant || ''}</button>`;
        return h;
    },
    alDibujar(cont, e) { if (e.fase !== 'jugando' || e.turno !== miIdentidad) _selFos = { fila: null, cant: 0 }; },
    compu: {
        paso(e, bot, yo, nivel) {
            if (e.fase !== 'jugando' || e.turno !== bot) return null;
            const m = jugadaCompuFos(e.filas, nivel);
            return () => { _selFos = m; return sacarFosforos(); };
        }
    }
});

// Tocar un fósforo marca ese y todos los de su derecha en la fila.
function tocarFosforo(f, k){
    vibrarJ(6);
    const n = Fosforos.estado.filas[f];
    const cant = n - k;
    _selFos = _selFos.fila === f && _selFos.cant === cant ? { fila: null, cant: 0 } : { fila: f, cant };
    if (window.sfx) window.sfx.click();
    Fosforos.redibujar();
}
async function sacarFosforos(){
    const { fila, cant } = _selFos;
    if (fila == null || !cant) return;
    const res = await Fosforos.jugar((e) => {
        if (e.filas[fila] < cant) return null;
        const filas = [...e.filas]; filas[fila] -= cant;
        const ultima = { fila, cant, quien: miIdentidad };
        if (filas.every(x => x === 0)) return { filas, ultima, ganador: miRival, motivo: `${nombreJugador(miIdentidad)} se llevó el último fósforo 🔥` };
        return { filas, ultima, turno: miRival };
    });
    _selFos = { fila: null, cant: 0 };
    if (res && window.sfx) window.sfx.toque();
}
function jugadaCompuFos(filas, nivel){
    const movs = [];
    filas.forEach((n, f) => { for (let c = 1; c <= n; c++) movs.push({ fila: f, cant: c }); });
    const buenas = movs.filter(m => { const nf = [...filas]; nf[m.fila] -= m.cant; return !ganaQuienMueveFos(nf); });
    const prob = nivel === 'dificil' ? 1 : nivel === 'normal' ? 0.7 : 0.25;
    const l = buenas.length && Math.random() < prob ? buenas : movs;
    return l[Math.floor(Math.random() * l.length)];
}
