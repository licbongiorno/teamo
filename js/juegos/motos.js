// ==================== MOTOS DE LUZ (en vivo, tipo Tron) ====================
// Cada uno maneja una moto que deja una estela de luz. Chocar contra una
// pared o contra cualquier estela hace perder la ronda. Gana el primero en
// llevarse 3 rondas. Cada uno simula su propia moto (12 pasos por segundo)
// y manda por js/enlace-vivo.js dónde está y cada giro (confiable), así el
// otro reconstruye la estela exacta. Nico arranca abajo, Carito arriba; a
// Carito se le da vuelta la pantalla.
const COLS_MOTO = 30, FILAS_MOTO = 44, CEL_MOTO = 8, PASO_MOTO = 1000 / 12, RONDAS_MOTO = 3;
const DIR_MOTO = { arriba: [0, -1], abajo: [0, 1], izq: [-1, 0], der: [1, 0] };
const MT = { canvas: null, ctx: null, enlace: null, loop: null, estado: null, clave: null, yo: null, el: null, ocupado: null, choque: false, pendiente: null, ultimoPaso: 0, fx: null, rondaT: 0 };

const girarMoto = () => miIdentidad === 'carito';
function reiniciarMoto(e){
    MT.clave = e.clave;
    const salida = (q) => q === 'nico' ? { x: Math.floor(COLS_MOTO / 2), y: FILAS_MOTO - 4, dir: 'arriba' } : { x: Math.floor(COLS_MOTO / 2) - 1, y: 3, dir: 'abajo' };
    MT.yo = { ...salida(miIdentidad), k: 0, estela: [] };
    MT.el = { ...salida(miRival), k: 0, estela: [], giros: [] };
    MT.ocupado = new Set();
    MT.choque = false; MT.pendiente = null; MT.ultimoPaso = 0; MT.boomVisto = {};
    if (MT.fx) MT.fx.limpiar();
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
    if (x !== o.x || y !== o.y) { o.dx = Math.sign(x - o.x); o.dy = Math.sign(y - o.y); o.tPos = performance.now(); }
    o.x = x; o.y = y;
}
function pasoMoto(){
    const e = MT.estado, p = MT.yo;
    if (!e || e.fase !== 'jugando' || !p || MT.choque) return;
    const ahora = VivoComun.reloj('motos');
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
// Explosión en la punta de la moto y pedazos de estela que saltan.
function efectoChoqueMoto(m, mio){
    if (!MT.fx || !m) return;
    const [sx, sy] = posMoto(m.x, m.y), col = (mio ? miIdentidad : miRival) === 'nico' ? '#3da8ff' : '#ff4f8b';
    MT.fx.explosion(sx + CEL_MOTO / 2, sy + CEL_MOTO / 2, 34);
    MT.fx.particulas({ x: sx + 4, y: sy + 4, n: 18, color: [col, '#ffffff'], vel: 3.4, vida: 900, grav: 0, roce: 0.95, forma: 'chispa', tam: 2 });
    MT.fx.temblor(mio ? 7 : 4, 450);
    if (mio) MT.fx.flash('rgba(255,80,120,0.35)', 200);
    MT.fx.texto(W_MOTO() / 2, H_MOTO() / 2 - 40, mio ? '💥 ¡CHOQUE!' : `💥 ¡Chocó ${nombreJugador(miRival)}!`, { tam: 18, color: mio ? '#ff8fa3' : '#7dffb0', vida: 1500 });
}
const W_MOTO = () => COLS_MOTO * CEL_MOTO, H_MOTO = () => FILAS_MOTO * CEL_MOTO;
const posMoto = (x, y) => girarMoto() ? [(COLS_MOTO - 1 - x) * CEL_MOTO, (FILAS_MOTO - 1 - y) * CEL_MOTO] : [x * CEL_MOTO, y * CEL_MOTO];
async function chocarMoto(){
    if (MT.choque) return;
    MT.choque = true;
    efectoChoqueMoto(MT.yo, true);
    vibrarJ([40, 30, 40]);
    if (!(window.sonarArcade && sonarArcade('explosion', { tam: 0.7 })) && window.sfx) window.sfx.error();
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
        return { rondas, clave: Math.random().toString(36).slice(2, 7), inicio: VivoComun.reloj('motos') + 2500, aviso: texto };
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
    const W = W_MOTO(), H = H_MOTO(), pt = performance.now(), tt = pt / 1000;
    c.setTransform(2, 0, 0, 2, 0, 0);
    if (MT.fx) MT.fx.antes(c);
    // Piso de la grilla: oscuro con líneas que laten desde el centro
    const g = c.createRadialGradient(W / 2, H / 2, 20, W / 2, H / 2, H * 0.7); g.addColorStop(0, '#1a1438'); g.addColorStop(1, '#07060f');
    c.fillStyle = g; c.fillRect(-10, -10, W + 20, H + 20);
    for (let x = 0; x <= COLS_MOTO; x += 2) { const d = Math.abs(x - COLS_MOTO / 2) / COLS_MOTO; c.strokeStyle = `rgba(120,110,255,${0.1 + Math.max(0, Math.sin(tt * 2 - d * 8)) * 0.1})`; c.lineWidth = 1; c.beginPath(); c.moveTo(x * CEL_MOTO + 0.5, 0); c.lineTo(x * CEL_MOTO + 0.5, H); c.stroke(); }
    for (let y = 0; y <= FILAS_MOTO; y += 2) { const d = Math.abs(y - FILAS_MOTO / 2) / FILAS_MOTO; c.strokeStyle = `rgba(120,110,255,${0.1 + Math.max(0, Math.sin(tt * 2 - d * 8)) * 0.1})`; c.beginPath(); c.moveTo(0, y * CEL_MOTO + 0.5); c.lineTo(W, y * CEL_MOTO + 0.5); c.stroke(); }
    c.strokeStyle = 'rgba(160,150,255,0.5)'; c.lineWidth = 2; c.strokeRect(1, 1, W - 2, H - 2);
    const centro = (x, y) => { const [sx, sy] = posMoto(x, y); return [sx + CEL_MOTO / 2, sy + CEL_MOTO / 2]; };
    // Fracción del paso actual: la punta se desliza entre celdas (no salta de a una).
    const fracYo = MT.choque || VivoComun.reloj('motos') < e.inicio ? 0 : Math.max(0, Math.min(1, (VivoComun.reloj('motos') - e.inicio) / PASO_MOTO - MT.yo.k));
    const pintar = (m, col, claro, frac, dirX, dirY, quien) => {
        const [hx, hy] = centro(m.x, m.y), signo = girarMoto() ? -1 : 1;
        const px = hx + dirX * frac * CEL_MOTO * signo, py = hy + dirY * frac * CEL_MOTO * signo;
        // Estela: una línea de luz continua (ancha y suave + fina y brillante)
        if (m.estela.length) {
            c.globalCompositeOperation = 'lighter'; c.lineJoin = 'round'; c.lineCap = 'round';
            for (const [ancho, alfa, color] of [[7, 0.18, col], [3.4, 0.7, col], [1.2, 0.9, '#ffffff']]) {
                c.strokeStyle = color; c.globalAlpha = alfa; c.lineWidth = ancho; c.beginPath();
                m.estela.forEach(([x, y], i) => { const [cx, cy] = centro(x, y); if (i) c.lineTo(cx, cy); else c.moveTo(cx, cy); });
                if (!m.choco && !(m === MT.yo && MT.choque)) c.lineTo(px, py); else c.lineTo(hx, hy);
                c.stroke();
            }
            c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
        }
        if (m.choco || (m === MT.yo && MT.choque)) return;
        // La moto: cuña con rueditas, orientada hacia donde va, con halo
        const ang = Math.atan2(dirY * signo, dirX * signo);
        c.globalCompositeOperation = 'lighter'; const halo = c.createRadialGradient(px, py, 1, px, py, 16); halo.addColorStop(0, col + 'aa'); halo.addColorStop(1, col + '00'); c.fillStyle = halo; c.beginPath(); c.arc(px, py, 16, 0, Math.PI * 2); c.fill(); c.globalCompositeOperation = 'source-over';
        c.save(); c.translate(px, py); c.rotate(ang);
        c.fillStyle = '#111'; c.fillRect(-5, -3.2, 3, 1.6); c.fillRect(-5, 1.6, 3, 1.6); c.fillRect(2, -3.2, 3, 1.6); c.fillRect(2, 1.6, 3, 1.6);
        c.fillStyle = claro; c.beginPath(); c.moveTo(6, 0); c.lineTo(-4, -3); c.lineTo(-6, 0); c.lineTo(-4, 3); c.closePath(); c.fill();
        c.fillStyle = col; c.fillRect(-3, -1, 5, 2);
        c.fillStyle = '#fff'; c.fillRect(4, -0.8, 2, 1.6);
        c.restore();
        // Chispitas que suelta atrás
        if (MT.fx && Math.random() < 0.35 && frac > 0) MT.fx.particulas({ x: px - Math.cos(ang) * 5, y: py - Math.sin(ang) * 5, n: 1, color: [col, '#fff'], vel: 0.8, vida: 260, grav: 0, tam: 1.2, dir: ang + Math.PI, abanico: 0.6 });
    };
    const col = (q) => q === 'nico' ? ['#3da8ff', '#c8e8ff'] : ['#ff4f8b', '#ffd0e0'];
    const [dxY, dyY] = DIR_MOTO[MT.yo.dir];
    const o = MT.el, fracEl = o.tPos && !o.choco ? Math.max(0, Math.min(1, (pt - o.tPos) / PASO_MOTO)) : 0;
    pintar(o, ...col(miRival), fracEl, o.dx || 0, o.dy || (miRival === 'nico' ? -1 : 1), miRival);
    pintar(MT.yo, ...col(miIdentidad), fracYo, dxY, dyY, miIdentidad);
    if (MT.fx) MT.fx.dibujar(c);
    // Marcador con un puntito por ronda
    c.fillStyle = 'rgba(7,6,15,0.6)'; c.fillRect(0, 0, W, 18);
    c.fillStyle = '#fff'; c.font = 'bold 9px monospace';
    c.fillText(nombreJugador(miIdentidad), 6, 12); c.textAlign = 'right'; c.fillText(nombreJugador(miRival), W - 14, 12); c.textAlign = 'left';
    const puntos = (q, x0, dir) => { for (let k = 0; k < RONDAS_MOTO; k++) { c.fillStyle = k < e.rondas[q] ? col(q)[0] : 'rgba(255,255,255,0.2)'; c.beginPath(); c.arc(x0 + dir * k * 9, 9, 3, 0, Math.PI * 2); c.fill(); } };
    puntos(miIdentidad, W / 2 - 14, -1); puntos(miRival, W / 2 + 14, 1);
    const falta = e.inicio - VivoComun.reloj('motos');
    if (e.fase === 'jugando' && falta > 0) {
        const n = Math.ceil(falta / 1000), k = 1 - (falta % 1000) / 1000, esc = FxVivo.rebote(Math.min(1, k * 3));
        c.save(); c.translate(W / 2, H / 2); c.scale(esc, esc); c.textAlign = 'center'; c.font = 'bold 30px monospace'; c.fillStyle = '#fff'; c.fillText(String(n), 0, 0); c.restore();
        c.textAlign = 'center'; c.font = '11px monospace'; c.fillStyle = '#c8c0ff'; c.fillText(e.aviso || 'Esquivá las estelas', W / 2, H / 2 + 22); c.textAlign = 'left';
    }
    if (MT.fx) MT.fx.despues(c);
}
function bucleMoto(){
    const pantalla = document.getElementById('pantalla-motos');
    if (!pantalla || !pantalla.classList.contains('activa')) { pararMoto(); return; }
    if (VivoComun.pausa('motos')) { MT.ultimoTs = 0; dibujarMoto(); VivoComun.cartelPausa(MT.ctx); MT.loop = requestAnimationFrame(bucleMoto); return; }
    pasoMoto();
    if (MT.enlace && MT.yo && MT.yo.k !== MT.ultimoPaso) { MT.ultimoPaso = MT.yo.k; MT.enlace.enviar('pos', { k: MT.yo.k, x: MT.yo.x, y: MT.yo.y, c: MT.clave }); }
    dibujarMoto();
    VivoComun.estado(MT.ctx, COLS_MOTO * CEL_MOTO, FILAS_MOTO * CEL_MOTO, MT.enlace, nombreJugador(miRival), !!(MT.estado && MT.estado.fase === 'jugando' && VivoComun.reloj('motos') > MT.estado.inicio + 500 && !MT.choque && !(MT.el && MT.el.choco)));
    MT.loop = requestAnimationFrame(bucleMoto);
}
function arrancarMoto(){
    MT.fx = MT.fx || FxVivo.crear();
    if (!MT.canvas) {
        MT.canvas = document.createElement('canvas');
        MT.canvas.width = COLS_MOTO * CEL_MOTO * 2; MT.canvas.height = FILAS_MOTO * CEL_MOTO * 2;
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
                if (t === 'choque' && !MT.el.choco) { MT.el.choco = true; efectoChoqueMoto(MT.el, false); }
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
        VivoComun.montar('motos', Motos, host, e);
        if (MT.clave !== e.clave) reiniciarMoto(e);
        if (e.fase === 'jugando') arrancarMoto();
        if (MT.canvas) { host.appendChild(MT.canvas); if (MT.botones) host.appendChild(MT.botones); dibujarMoto(); }
    }
});
window._motos = MT; // para pruebas
