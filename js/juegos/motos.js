// ==================== MOTOS DE LUZ (en vivo, tipo Tron) ====================
// Cada uno maneja una moto que deja una estela de luz. Chocar contra una
// pared o contra cualquier estela hace perder la ronda. Gana el primero en
// llevarse 3 rondas. Cada uno simula su propia moto (12 pasos por segundo)
// y manda por js/enlace-vivo.js dónde está y cada giro (confiable), así el
// otro reconstruye la estela exacta. Nico arranca abajo, Carito arriba; a
// Carito se le da vuelta la pantalla.
const COLS_MOTO = 30, FILAS_MOTO = 44, CEL_MOTO = 8, PASO_MOTO = 1000 / 12, RONDAS_MOTO = 3;
const DIR_MOTO = { arriba: [0, -1], abajo: [0, 1], izq: [-1, 0], der: [1, 0] };
const MT = { canvas: null, ctx: null, enlace: null, loop: null, estado: null, clave: null, yo: null, el: null, ocupado: null, choque: false, pendiente: null, ultimoPaso: 0 };

const girarMoto = () => miIdentidad === 'carito';
function reiniciarMoto(e){
    MT.clave = e.clave;
    const salida = (q) => q === 'nico' ? { x: Math.floor(COLS_MOTO / 2), y: FILAS_MOTO - 4, dir: 'arriba' } : { x: Math.floor(COLS_MOTO / 2) - 1, y: 3, dir: 'abajo' };
    MT.yo = { ...salida(miIdentidad), k: 0, estela: [] };
    MT.el = { ...salida(miRival), k: 0, estela: [], giros: [] };
    MT.ocupado = new Set();
    MT.choque = false; MT.pendiente = null; MT.ultimoPaso = 0;
}
const celdaMoto = (x, y) => x + ',' + y;
// La estela del otro: se completa entre posiciones recibidas (si se perdió algún mensaje).
function avanzarOtroMoto(x, y){
    const o = MT.el;
    let cx = o.x, cy = o.y;
    let guarda = 0;
    while ((cx !== x || cy !== y) && guarda++ < 60) {
        MT.ocupado.add(celdaMoto(cx, cy)); o.estela.push([cx, cy]);
        if (cx !== x) cx += Math.sign(x - cx); else cy += Math.sign(y - cy);
    }
    o.x = x; o.y = y;
}
function pasoMoto(){
    const e = MT.estado, p = MT.yo;
    if (!e || e.fase !== 'jugando' || !p || MT.choque) return;
    const ahora = window.ahoraSync();
    if (ahora < e.inicio) return;
    const debido = Math.floor((ahora - e.inicio) / PASO_MOTO);
    let n = 0;
    while (p.k < debido && n++ < 4 && !MT.choque) {
        if (MT.pendiente) {
            const [ax, ay] = DIR_MOTO[p.dir], [bx, by] = DIR_MOTO[MT.pendiente];
            if (ax + bx !== 0 || ay + by !== 0) { p.dir = MT.pendiente; MT.enlace && MT.enlace.enviar('giro', { k: p.k, x: p.x, y: p.y, dir: p.dir, c: MT.clave }, true); }
            MT.pendiente = null;
        }
        MT.ocupado.add(celdaMoto(p.x, p.y)); p.estela.push([p.x, p.y]);
        const [dx, dy] = DIR_MOTO[p.dir];
        p.x += dx; p.y += dy; p.k++;
        const fuera = p.x < 0 || p.x >= COLS_MOTO || p.y < 0 || p.y >= FILAS_MOTO;
        if (fuera || MT.ocupado.has(celdaMoto(p.x, p.y)) || (MT.el && MT.el.x === p.x && MT.el.y === p.y)) chocarMoto();
    }
}
async function chocarMoto(){
    if (MT.choque) return;
    MT.choque = true;
    vibrarJ([40, 30, 40]);
    if (window.sfx) window.sfx.error();
    const clave = MT.clave, k = MT.yo.k;
    MT.enlace && MT.enlace.enviar('choque', { k, c: clave }, true);
    // El primero que choca pierde la ronda (y la ronda se cierra ahí: si el
    // otro choca después, su choque ya cae en una ronda vieja y no cuenta).
    await Motos.accion((e) => {
        if (e.clave !== clave) return null;
        const otro = miIdentidad === 'nico' ? 'carito' : 'nico';
        const rondas = { ...e.rondas, [otro]: e.rondas[otro] + 1 };
        const texto = `Chocó ${nombreJugador(miIdentidad)}: ronda para ${nombreJugador(otro)}.`;
        if (rondas[otro] >= RONDAS_MOTO) return { rondas, ganador: otro, motivo: `${rondas.nico} a ${rondas.carito} en rondas.` };
        return { rondas, clave: Math.random().toString(36).slice(2, 7), inicio: window.ahoraSync() + 2500, aviso: texto };
    });
}
function girarHacia(dir){ if (!MT.yo || MT.choque) return; vibrarJ(5); MT.pendiente = dir; }
// Los botones giran relativo a la moto (⟲ a su izquierda, ⟳ a su derecha).
function girarRelativoMoto(lado){
    if (!MT.yo) return;
    const orden = ['arriba', 'der', 'abajo', 'izq'];
    const i = orden.indexOf(MT.pendiente || MT.yo.dir);
    girarHacia(orden[(i + (lado === 'der' ? 1 : 3)) % 4]);
}
function dibujarMoto(){
    const c = MT.ctx, e = MT.estado;
    if (!c || !e || !MT.yo) return;
    const W = COLS_MOTO * CEL_MOTO, H = FILAS_MOTO * CEL_MOTO;
    c.fillStyle = '#0d0b1a'; c.fillRect(0, 0, W, H);
    c.strokeStyle = 'rgba(120,110,255,0.12)'; c.lineWidth = 1;
    for (let x = 0; x <= COLS_MOTO; x += 2) { c.beginPath(); c.moveTo(x * CEL_MOTO + 0.5, 0); c.lineTo(x * CEL_MOTO + 0.5, H); c.stroke(); }
    for (let y = 0; y <= FILAS_MOTO; y += 2) { c.beginPath(); c.moveTo(0, y * CEL_MOTO + 0.5); c.lineTo(W, y * CEL_MOTO + 0.5); c.stroke(); }
    const pos = (x, y) => girarMoto() ? [(COLS_MOTO - 1 - x) * CEL_MOTO, (FILAS_MOTO - 1 - y) * CEL_MOTO] : [x * CEL_MOTO, y * CEL_MOTO];
    const pintar = (m, col, brillo) => {
        c.shadowColor = brillo; c.shadowBlur = 6; c.fillStyle = col;
        m.estela.forEach(([x, y]) => { const [sx, sy] = pos(x, y); c.fillRect(sx + 1, sy + 1, CEL_MOTO - 2, CEL_MOTO - 2); });
        const [hx, hy] = pos(m.x, m.y); c.fillStyle = '#fff'; c.fillRect(hx, hy, CEL_MOTO, CEL_MOTO);
        c.shadowBlur = 0;
    };
    const col = (q) => q === 'nico' ? ['#3da8ff', '#a8d8ff'] : ['#ff4f8b', '#ffb3c6'];
    pintar(MT.el, ...col(miRival));
    pintar(MT.yo, ...col(miIdentidad));
    c.fillStyle = '#fff'; c.font = 'bold 11px monospace';
    c.fillText(`${nombreJugador(miIdentidad)} ${e.rondas[miIdentidad]} · ${e.rondas[miRival]} ${nombreJugador(miRival)}`, 6, 14);
    const falta = e.inicio - window.ahoraSync();
    if (e.fase === 'jugando' && falta > 0) { c.textAlign = 'center'; c.font = 'bold 30px monospace'; c.fillText(String(Math.ceil(falta / 1000)), W / 2, H / 2); c.font = '11px monospace'; c.fillText(e.aviso || 'Esquivá las estelas', W / 2, H / 2 + 22); c.textAlign = 'left'; }
    if (MT.choque && e.fase === 'jugando') { c.textAlign = 'center'; c.font = 'bold 22px monospace'; c.fillStyle = '#ff8fa3'; c.fillText('💥 ¡CHOQUE!', W / 2, H / 2); c.textAlign = 'left'; }
}
function bucleMoto(){
    const pantalla = document.getElementById('pantalla-motos');
    if (!pantalla || !pantalla.classList.contains('activa')) { pararMoto(); return; }
    pasoMoto();
    if (MT.enlace && MT.yo && MT.yo.k !== MT.ultimoPaso) { MT.ultimoPaso = MT.yo.k; MT.enlace.enviar('pos', { k: MT.yo.k, x: MT.yo.x, y: MT.yo.y, c: MT.clave }); }
    dibujarMoto();
    VivoComun.estado(MT.ctx, COLS_MOTO * CEL_MOTO, FILAS_MOTO * CEL_MOTO, MT.enlace, nombreJugador(miRival), !!(MT.estado && MT.estado.fase === 'jugando' && window.ahoraSync() > MT.estado.inicio + 500 && !MT.choque && !(MT.el && MT.el.choco)));
    MT.loop = requestAnimationFrame(bucleMoto);
}
function arrancarMoto(){
    if (!MT.canvas) {
        MT.canvas = document.createElement('canvas');
        MT.canvas.width = COLS_MOTO * CEL_MOTO; MT.canvas.height = FILAS_MOTO * CEL_MOTO;
        MT.canvas.className = 'lienzo-motos';
        MT.ctx = MT.canvas.getContext('2d');
        // Deslizar el dedo: dirección absoluta en pantalla.
        let ini = null;
        MT.canvas.addEventListener('pointerdown', (ev) => { ini = [ev.clientX, ev.clientY]; });
        MT.canvas.addEventListener('pointermove', (ev) => {
            if (!ini) return;
            const dx = ev.clientX - ini[0], dy = ev.clientY - ini[1];
            if (Math.max(Math.abs(dx), Math.abs(dy)) < 18) return;
            let d = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'der' : 'izq') : (dy > 0 ? 'abajo' : 'arriba');
            if (girarMoto()) d = { der: 'izq', izq: 'der', arriba: 'abajo', abajo: 'arriba' }[d];
            girarHacia(d); ini = [ev.clientX, ev.clientY];
        });
        MT.canvas.addEventListener('pointerup', () => { ini = null; });
        MT.botones = document.createElement('div');
        MT.botones.className = 'controles-aventura';
        MT.botones.innerHTML = `<button onpointerdown="event.preventDefault(); girarRelativoMoto('izq')" aria-label="Girar a la izquierda">⟲</button><span class="texto-tenue" style="font-size:0.72rem;">o deslizá el dedo</span><button onpointerdown="event.preventDefault(); girarRelativoMoto('der')" aria-label="Girar a la derecha">⟳</button>`;
    }
    if (!MT.teclado) {
        const mapa = { ArrowUp: 'arriba', ArrowDown: 'abajo', ArrowLeft: 'izq', ArrowRight: 'der' };
        MT.teclado = (ev) => { const d = mapa[ev.code]; if (!d || !document.getElementById('pantalla-motos')?.classList.contains('activa')) return; ev.preventDefault(); girarHacia(girarMoto() ? { der: 'izq', izq: 'der', arriba: 'abajo', abajo: 'arriba' }[d] : d); };
        window.addEventListener('keydown', MT.teclado);
    }
    if (!MT.enlace) {
        MT.enlace = EnlaceVivo.conectar('motos', {
            alMensaje(t, d) {
                if (!MT.el || d.c !== MT.clave) return;
                if (t === 'pos' || t === 'giro') avanzarOtroMoto(d.x, d.y);
                if (t === 'choque') MT.el.choco = true;
            }
        });
    }
    if (!MT.loop) MT.loop = requestAnimationFrame(bucleMoto);
    window._unsubLoopMotos = pararMoto;
}
function pararMoto(){
    if (MT.loop) cancelAnimationFrame(MT.loop);
    MT.loop = null;
    if (MT.enlace) MT.enlace.cerrar();
    MT.enlace = null;
}

const Motos = JuegoTurnos.crear({
    id: 'motos',
    sinTurno: true,
    emojiListo: '🏍️',
    intro: `Manejá tu moto de luz y no choques contra las paredes ni contra ninguna estela. Girá con ⟲ ⟳ o deslizando el dedo. ¡Gana el primero en llevarse ${RONDAS_MOTO} rondas!`,
    inicial: () => ({ rondas: { nico: 0, carito: 0 }, clave: Math.random().toString(36).slice(2, 7), inicio: window.ahoraSync() + 3000, turno: null }),
    render(e) { return `<div id="motos-host"></div><div class="texto-centro texto-tenue" style="font-size:0.75rem;">Rondas: ${nombreJugador('nico')} ${e.rondas.nico} — ${e.rondas.carito} ${nombreJugador('carito')}</div>`; },
    alDibujar(cont, e) {
        MT.estado = e;
        const host = cont.querySelector('#motos-host');
        if (!host) return;
        if (MT.clave !== e.clave) reiniciarMoto(e);
        if (e.fase === 'jugando') arrancarMoto();
        if (MT.canvas) { host.appendChild(MT.canvas); if (MT.botones) host.appendChild(MT.botones); dibujarMoto(); }
    }
});
window._motos = MT; // para pruebas
