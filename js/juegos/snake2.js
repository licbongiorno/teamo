// ==================== VIBORITA DE A DOS (en vivo) ====================
// Las dos víboras en la misma grilla, en vivo, durante 2 minutos. Hay una
// manzana por vez y sale en el mismo lugar para los dos (sale de la semilla
// y del número de manzana). La come quien llega primero (transacción en el
// doc). Chocar con tu cuerpo o con el del otro te corta a la mitad. Los
// bordes son pasadizos (salís por el otro lado). Al final gana la más larga.
// Cada uno simula su víbora a 8 pasos por segundo con el reloj compartido
// y manda su cuerpo entero por js/enlace-vivo.js (lista plana x,y,x,y...).
const COLS_SN = 24, FILAS_SN = 30, CEL_SN = 12, PASO_SN = 125, DURA_SN = 120000;
const DIR_SN = { arriba: [0, -1], abajo: [0, 1], izq: [-1, 0], der: [1, 0] };
const SN = { canvas: null, ctx: null, enlace: null, loop: null, estado: null, clave: null, yo: null, el: null, pendiente: [], comiendo: null, ultimoPaso: -1, fantasma: 0, cerrando: false, fx: null, manzanaVista: 0, comioT: {} };

function rngSn(semilla){ let a = semilla >>> 0; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
// La manzana número n: misma en los dos celus. Evita las filas de salida.
function manzanaSn(e, n){
    const r = rngSn((e.semilla || 1) + n * 7919);
    return [1 + Math.floor(r() * (COLS_SN - 2)), 2 + Math.floor(r() * (FILAS_SN - 4))];
}
function salidaSn(q){
    return q === 'nico' ? { x: 5, y: FILAS_SN - 5, dir: 'arriba' } : { x: COLS_SN - 6, y: 4, dir: 'abajo' };
}
function reiniciarSn(e){
    SN.clave = e.clave;
    const s = salidaSn(miIdentidad), [dx, dy] = DIR_SN[s.dir];
    SN.yo = { cuerpo: [0, 1, 2].map(i => [s.x - dx * i, s.y - dy * i]), dir: s.dir, k: 0, crecer: 0 };
    const o = salidaSn(miRival), [ox, oy] = DIR_SN[o.dir];
    SN.el = { cuerpo: [0, 1, 2].map(i => [o.x - ox * i, o.y - oy * i]), visto: 0 };
    if (compuSn()) Object.assign(SN.el, { bot: true, dir: o.dir, crecer: 0, hasta: 0, visto: Date.now() });
    SN.pendiente = []; SN.comiendo = null; SN.ultimoPaso = -1; SN.fantasma = 0; SN.cerrando = false;
    SN.manzanaVista = e.manzana || 0; if (SN.fx) SN.fx.limpiar();
}
// Contra la compu: la otra víbora la maneja la compu en este celu.
const compuSn = () => { const m = typeof window.modoCompu === 'function' && window.modoCompu(); return m && m.juego === 'snake2' ? m : null; };
const envolverSn = (x, y) => [(x + COLS_SN) % COLS_SN, (y + FILAS_SN) % FILAS_SN];
function pasoSn(){
    const e = SN.estado, p = SN.yo;
    if (!e || e.fase !== 'jugando' || !p) return;
    const ahora = VivoComun.reloj('snake2');
    if (ahora < e.inicio) return;
    if (ahora >= e.inicio + DURA_SN) { terminarSn(); return; }
    const debido = Math.floor((ahora - e.inicio) / PASO_SN);
    let n = 0;
    while (p.k < debido && n++ < 4) {
        // Giros en fila (para que dos toques rápidos hagan una U).
        while (SN.pendiente.length) {
            const d = SN.pendiente.shift(), [ax, ay] = DIR_SN[p.dir], [bx, by] = DIR_SN[d];
            if (ax + bx !== 0 || ay + by !== 0) { p.dir = d; break; }
        }
        const [dx, dy] = DIR_SN[p.dir], cab = p.cuerpo[0];
        p.antes = p.cuerpo.map(c => c.slice());
        const nueva = envolverSn(cab[0] + dx, cab[1] + dy);
        p.cuerpo.unshift(nueva);
        if (p.crecer > 0) p.crecer--; else p.cuerpo.pop();
        p.k++;
        // Manzana
        const m = manzanaSn(e, e.manzana || 0);
        if (nueva[0] === m[0] && nueva[1] === m[1] && SN.comiendo !== e.manzana) comerSn(e.manzana || 0);
        // Choques (con un segundito de fantasma después de cortarte)
        if (Date.now() > SN.fantasma) {
            const contra = (lista, desde) => lista.slice(desde).some(c => c[0] === nueva[0] && c[1] === nueva[1]);
            // La cola del otro puede venir un paso atrasada: esa celda no cuenta.
            const otro = SN.el && Date.now() - SN.el.visto < 2000 && !SN.el.fantasma ? SN.el.cuerpo.slice(0, -1) : [];
            if (contra(p.cuerpo, 1) || contra(otro, 0)) cortarSn();
        }
        const compu = compuSn();
        if (compu && SN.el && SN.el.bot) pasoBotSn(e, SN.el, compu.nivel);
    }
}
// La compu: va hacia la manzana por las celdas libres; en fácil a veces se distrae.
function pasoBotSn(e, b, nivel){
    const ocupada = (c) => b.cuerpo.slice(0, -1).some(x => x[0] === c[0] && x[1] === c[1]) || SN.yo.cuerpo.some(x => x[0] === c[0] && x[1] === c[1]);
    const [mx, my] = manzanaSn(e, e.manzana || 0), cab = b.cuerpo[0];
    const opciones = Object.keys(DIR_SN).filter(d => { const [a, c] = DIR_SN[d], [x, y] = DIR_SN[b.dir]; return a + x !== 0 || c + y !== 0; })
        .map(d => { const [a, c] = DIR_SN[d], n = envolverSn(cab[0] + a, cab[1] + c); return { d, n, libre: !ocupada(n), dist: Math.abs(n[0] - mx) + Math.abs(n[1] - my) }; });
    const libres = opciones.filter(o => o.libre).sort((a, c) => a.dist - c.dist);
    const distraida = { facil: 0.3, normal: 0.1, dificil: 0 }[nivel] ?? 0.1;
    let elegida = libres[0] || opciones[0];
    if (libres.length > 1 && Math.random() < distraida) elegida = libres[1 + Math.floor(Math.random() * (libres.length - 1))];
    b.dir = elegida.d;
    b.antes = b.cuerpo.map(c => c.slice()); b.k = (b.k || 0) + 1;
    b.cuerpo.unshift(elegida.n);
    if (b.crecer > 0) b.crecer--; else b.cuerpo.pop();
    b.visto = Date.now(); b.fantasma = Date.now() < b.hasta;
    const n = e.manzana || 0;
    if (elegida.n[0] === mx && elegida.n[1] === my && b.comiendo !== n) {
        b.comiendo = n;
        const clave = SN.clave, bot = miRival;
        Snake2.accionEnCola((st) => st.clave !== clave || (st.manzana || 0) !== n ? null : { manzana: n + 1, largos: { ...st.largos, [bot]: b.cuerpo.length + 2 } })
            .then(res => { if (res) b.crecer += 2; });
    } else if (!b.fantasma && !elegida.libre) {
        b.hasta = Date.now() + 1200;
        b.cuerpo = b.cuerpo.slice(0, Math.max(3, Math.ceil(b.cuerpo.length / 2))); b.crecer = 0;
        const clave = SN.clave, bot = miRival, largo = b.cuerpo.length;
        Snake2.accionEnCola((st) => st.clave !== clave ? null : { largos: { ...st.largos, [bot]: largo } });
    }
}
async function comerSn(n){
    SN.comiendo = n;
    const clave = SN.clave, quien = miIdentidad;
    const res = await Snake2.accionEnCola((e) => {
        if (e.clave !== clave || (e.manzana || 0) !== n) return null;
        return { manzana: n + 1, largos: { ...e.largos, [quien]: SN.yo.cuerpo.length + 2 } };
    });
    if (res) { SN.yo.crecer += 2; SN.comioT[miIdentidad] = performance.now(); vibrarJ(12); if (window.sfx) window.sfx.acierto(); }
}
function cortarSn(){
    const p = SN.yo;
    SN.fantasma = Date.now() + 1200;
    const queda = Math.max(3, Math.ceil(p.cuerpo.length / 2));
    // Los pedazos que se pierden salen volando
    if (SN.fx) p.cuerpo.slice(queda).forEach(([x, y]) => SN.fx.particulas({ x: x * CEL_SN + CEL_SN / 2, y: y * CEL_SN + CEL_SN / 2, n: 2, color: [miIdentidad === 'nico' ? '#8cc4ff' : '#ffa3b8', '#fff'], vel: 2, vida: 700, grav: 0.05, forma: 'cuadro', tam: 3.5 }));
    if (SN.fx) { SN.fx.temblor(4, 300); const [hx, hy] = p.cuerpo[0]; SN.fx.texto(hx * CEL_SN + 6, hy * CEL_SN - 6, '¡Ay!', { tam: 12, color: '#ffd23a' }); }
    p.cuerpo = p.cuerpo.slice(0, queda);
    p.antes = null;
    p.crecer = 0;
    vibrarJ([30, 30, 30]);
    if (window.sfx) window.sfx.error();
    if (window.animJuegos) window.animJuegos.cartel('¡Ay! Te cortaste a la mitad', { dur: 800, sonido: false });
    const clave = SN.clave, quien = miIdentidad, largo = p.cuerpo.length;
    Snake2.accionEnCola((e) => e.clave !== clave ? null : { largos: { ...e.largos, [quien]: largo } });
}
async function terminarSn(){
    if (SN.cerrando) return;
    SN.cerrando = true;
    const clave = SN.clave, quien = miIdentidad, largo = SN.yo.cuerpo.length;
    // Primero dejo mi largo final; el que cierra compara los dos.
    const bot = compuSn() && SN.el ? { [miRival]: SN.el.cuerpo.length } : {};
    await Snake2.accionEnCola((e) => e.clave !== clave ? null : { largos: { ...e.largos, [quien]: largo, ...bot } });
    setTimeout(() => Snake2.accionEnCola((e) => {
        if (e.clave !== clave || VivoComun.reloj('snake2') < e.inicio + DURA_SN) return null;
        const l = e.largos, g = l.nico === l.carito ? 'empate' : l.nico > l.carito ? 'nico' : 'carito';
        return { ganador: g, motivo: `Largos: ${nombreJugador('nico')} ${l.nico} · ${nombreJugador('carito')} ${l.carito}` };
    }), 700);
}
function dibujarSn(){
    const c = SN.ctx, e = SN.estado;
    if (!c || !e || !SN.yo) return;
    const W = COLS_SN * CEL_SN, H = FILAS_SN * CEL_SN, pt = performance.now(), tt = pt / 1000;
    c.setTransform(2, 0, 0, 2, 0, 0);
    if (SN.fx) SN.fx.antes(c);
    // Pasto a cuadros con matitas y flores (siempre iguales)
    c.fillStyle = '#1e3523'; c.fillRect(-10, -10, W + 20, H + 20);
    for (let y = 0; y < FILAS_SN; y++) for (let x = 0; x < COLS_SN; x++) if ((x + y) % 2) { c.fillStyle = '#22402a'; c.fillRect(x * CEL_SN, y * CEL_SN, CEL_SN, CEL_SN); }
    for (let i = 0; i < 40; i++) { const x = (i * 53) % W, y = (i * 89) % H; c.fillStyle = 'rgba(120,200,110,0.25)'; c.fillRect(x, y, 1, 3); c.fillRect(x + 2, y + 1, 1, 2); if (i % 7 === 0) { c.fillStyle = ['#ffd23a', '#ffffff', '#ff9ab8'][i % 3]; c.beginPath(); c.arc(x + 5, y + 2, 1.3, 0, Math.PI * 2); c.fill(); } }
    // Los bordes son pasadizos: una línea punteada que corre
    c.strokeStyle = `rgba(150,255,200,${0.25 + Math.sin(tt * 2) * 0.1})`; c.lineWidth = 2; c.setLineDash([6, 6]); c.lineDashOffset = -tt * 10; c.strokeRect(1, 1, W - 2, H - 2); c.setLineDash([]); c.lineDashOffset = 0;
    if (e.fase === 'jugando') {
        // Manzana que rebota, con brillo, hoja y sombra
        const [mx, my] = manzanaSn(e, e.manzana || 0), bote = Math.abs(Math.sin(tt * 3)) * 2.5;
        const cx = mx * CEL_SN + CEL_SN / 2, cy = my * CEL_SN + CEL_SN / 2 - bote;
        c.fillStyle = 'rgba(0,0,0,0.3)'; c.beginPath(); c.ellipse(cx, my * CEL_SN + CEL_SN - 1, 4.5 - bote * 0.4, 1.5, 0, 0, Math.PI * 2); c.fill();
        const ga = c.createRadialGradient(cx - 2, cy - 2, 0.5, cx, cy, CEL_SN / 2); ga.addColorStop(0, '#ff9a8a'); ga.addColorStop(0.5, '#ff3a3a'); ga.addColorStop(1, '#b81f2f');
        c.fillStyle = ga; c.beginPath(); c.arc(cx - 1.4, cy + 0.5, CEL_SN / 2 - 1.2, 0, Math.PI * 2); c.arc(cx + 1.4, cy + 0.5, CEL_SN / 2 - 1.2, 0, Math.PI * 2); c.fill();
        c.strokeStyle = '#6a3a1a'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(cx, cy - 4); c.lineTo(cx + 0.5, cy - 7); c.stroke();
        c.fillStyle = '#5bd15b'; c.beginPath(); c.ellipse(cx + 2.5, cy - 6, 2.6, 1.2, -0.5, 0, Math.PI * 2); c.fill();
        c.fillStyle = 'rgba(255,255,255,0.7)'; c.beginPath(); c.arc(cx - 2.5, cy - 1.5, 1.2, 0, Math.PI * 2); c.fill();
        if (Math.floor(tt * 2) % 4 === 0) { c.fillStyle = 'rgba(255,255,255,0.8)'; c.fillRect(cx + 3, cy - 3, 1, 3); c.fillRect(cx + 2, cy - 2, 3, 1); }
    }
    // Cada segmento se desliza desde donde estaba el de adelante (si no cruzó un borde)
    const deslizar = (cuerpo, antes, frac) => cuerpo.map(([x, y], i) => {
        const prev = i === 0 ? antes[0] : antes[i - 1];
        if (!prev || Math.abs(prev[0] - x) > 1 || Math.abs(prev[1] - y) > 1) return [x, y];
        return [prev[0] + (x - prev[0]) * frac, prev[1] + (y - prev[1]) * frac];
    });
    const vibora = (cuerpo, col, claro, dir, fantasma, quien) => {
        if (!cuerpo.length) return;
        c.globalAlpha = fantasma ? 0.45 + Math.sin(pt / 60) * 0.25 : 1;
        const n = cuerpo.length, comio = Math.max(0, 1 - (pt - (SN.comioT[quien] || 0)) / 500);
        // De la cola a la cabeza: se va afinando hacia la cola, y un bulto recorre el cuerpo al comer
        for (let i = n - 1; i >= 0; i--) {
            const [x, y] = cuerpo[i], cx = x * CEL_SN + CEL_SN / 2, cy = y * CEL_SN + CEL_SN / 2;
            const r = (CEL_SN / 2 - 0.5) * (0.6 + 0.4 * (1 - i / Math.max(1, n))) + (comio && Math.abs(i - (1 - comio) * n) < 1.5 ? 1.6 : 0);
            if (i > 0) { const [nx, ny] = cuerpo[i - 1]; if (Math.abs(nx - x) <= 1 && Math.abs(ny - y) <= 1) { c.strokeStyle = i % 2 ? col : claro; c.lineWidth = r * 1.8; c.lineCap = 'round'; c.beginPath(); c.moveTo(cx, cy); c.lineTo(nx * CEL_SN + CEL_SN / 2, ny * CEL_SN + CEL_SN / 2); c.stroke(); } }
            c.fillStyle = i % 2 ? col : claro; c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2); c.fill();
            if (i % 3 === 0) { c.fillStyle = 'rgba(255,255,255,0.18)'; c.beginPath(); c.arc(cx - r * 0.3, cy - r * 0.3, r * 0.4, 0, Math.PI * 2); c.fill(); }
        }
        const [x, y] = cuerpo[0], [dx, dy] = DIR_SN[dir] || [0, -1];
        const cx = x * CEL_SN + CEL_SN / 2, cy = y * CEL_SN + CEL_SN / 2;
        // Cabeza más grande, con lengua que sale y entra y ojos que miran para adelante
        c.fillStyle = col; c.beginPath(); c.arc(cx, cy, CEL_SN / 2 + 0.8, 0, Math.PI * 2); c.fill();
        if (Math.floor(pt / 300) % 3 === 0) { c.strokeStyle = '#ff3a5a'; c.lineWidth = 1; c.beginPath(); c.moveTo(cx + dx * 6, cy + dy * 6); c.lineTo(cx + dx * 9, cy + dy * 9); c.lineTo(cx + dx * 10 - dy * 1.5, cy + dy * 10 + dx * 1.5); c.moveTo(cx + dx * 9, cy + dy * 9); c.lineTo(cx + dx * 10 + dy * 1.5, cy + dy * 10 - dx * 1.5); c.stroke(); }
        [-1, 1].forEach(sg => { const ox = cx + dx * 1.8 - dy * sg * 3, oy = cy + dy * 1.8 + dx * sg * 3; c.fillStyle = '#fff'; c.beginPath(); c.arc(ox, oy, 2.2, 0, Math.PI * 2); c.fill(); c.fillStyle = '#1a1a2a'; c.beginPath(); c.arc(ox + dx * 0.8, oy + dy * 0.8, 1.1, 0, Math.PI * 2); c.fill(); });
        c.globalAlpha = 1;
    };
    const col = (q) => q === 'nico' ? ['#3d8bfd', '#8cc4ff'] : ['#e8496b', '#ffa3b8'];
    const ahoraJ = VivoComun.reloj('snake2'), corriendo = e.fase === 'jugando' && ahoraJ >= e.inicio;
    if (SN.el) {
        const o = SN.el, cu = o.cuerpo, d = cu.length > 1 ? Object.keys(DIR_SN).find(k => { const [dx, dy] = DIR_SN[k]; return envolverSn(cu[1][0] + dx, cu[1][1] + dy).join() === cu[0].join(); }) : 'abajo';
        const frac = !corriendo ? 1 : o.bot ? Math.max(0, Math.min(1, (ahoraJ - e.inicio) / PASO_SN - SN.yo.k + 1)) : o.t0 ? Math.max(0, Math.min(1, (pt - o.t0) / PASO_SN)) : 1;
        vibora(o.antes && o.antes.length >= cu.length - 1 && o.antes.length ? deslizar(cu, o.antes, frac) : cu, ...col(miRival), d, o.fantasma, miRival);
    }
    const p = SN.yo, fracYo = !corriendo ? 1 : Math.max(0, Math.min(1, (ahoraJ - e.inicio) / PASO_SN - p.k + 1));
    vibora(p.antes && p.antes.length ? deslizar(p.cuerpo, p.antes, fracYo) : p.cuerpo, ...col(miIdentidad), p.dir, Date.now() < SN.fantasma, miIdentidad);
    if (SN.fx) SN.fx.dibujar(c);
    // Tablero
    c.fillStyle = 'rgba(0,0,0,0.5)'; c.fillRect(0, 0, W, 16);
    c.fillStyle = '#fff'; c.font = 'bold 10px monospace';
    const quedan = Math.max(0, Math.ceil((e.inicio + DURA_SN - ahoraJ) / 1000));
    const ly = SN.yo.cuerpo.length, le = SN.el ? SN.el.cuerpo.length : 3;
    c.fillText(`🐍 Vos ${ly} · ${nombreJugador(miRival)} ${le}`, 4, 12);
    c.textAlign = 'right';
    if (quedan <= 10 && corriendo) { const late = 1 + Math.sin(pt / 90) * 0.12; c.save(); c.translate(W - 12, 9); c.scale(late, late); c.fillStyle = '#ff8fa3'; c.fillText(`⏱ 0:${String(quedan).padStart(2, '0')}`, 0, 3); c.restore(); }
    else c.fillText(`⏱ ${Math.floor(quedan / 60)}:${String(quedan % 60).padStart(2, '0')}`, W - 12, 12);
    c.textAlign = 'left';
    const falta = e.inicio - ahoraJ;
    if (e.fase === 'jugando' && falta > 0) {
        const n = Math.ceil(falta / 1000), k = 1 - (falta % 1000) / 1000, esc = FxVivo.rebote(Math.min(1, k * 3));
        c.save(); c.translate(W / 2, H / 2); c.scale(esc, esc); c.fillStyle = '#fff'; c.textAlign = 'center'; c.font = 'bold 30px monospace'; c.fillText(String(n), 0, 0); c.restore();
        c.fillStyle = '#fff'; c.textAlign = 'center'; c.font = '10px monospace'; c.fillText('Vos sos la ' + (miIdentidad === 'nico' ? 'azul' : 'rosa'), W / 2, H / 2 + 20); c.textAlign = 'left';
    }
    if (SN.fx) SN.fx.despues(c);
    VivoComun.estado(c, W, H, SN.enlace, nombreJugador(miRival), e.fase === 'jugando' && ahoraJ > e.inicio + 500);
}
function bucleSn(){
    const pantalla = document.getElementById('pantalla-snake2');
    if (!pantalla || !pantalla.classList.contains('activa')) { pararSn(); return; }
    if (VivoComun.pausa('snake2')) { SN.ultimoTs = 0; dibujarSn(); VivoComun.cartelPausa(SN.ctx); SN.loop = requestAnimationFrame(bucleSn); return; }
    pasoSn();
    if (SN.enlace && SN.yo && SN.yo.k !== SN.ultimoPaso) {
        SN.ultimoPaso = SN.yo.k;
        SN.enlace.enviar('cuerpo', { k: SN.yo.k, b: SN.yo.cuerpo.flat(), f: Date.now() < SN.fantasma ? 1 : 0, c: SN.clave });
    }
    if (SN.estado && SN.estado.fase === 'jugando') VivoComun.cuenta('SN', SN.estado.inicio);
    dibujarSn();
    SN.loop = requestAnimationFrame(bucleSn);
}
function girarSn(d){ if (!SN.yo) return; vibrarJ(5); if (SN.pendiente.length < 3) SN.pendiente.push(d); }
function arrancarSn(){
    SN.fx = SN.fx || FxVivo.crear();
    if (!SN.canvas) {
        SN.canvas = document.createElement('canvas');
        SN.canvas.width = COLS_SN * CEL_SN * 2; SN.canvas.height = FILAS_SN * CEL_SN * 2;
        SN.canvas.className = 'lienzo-snake2';
        SN.ctx = SN.canvas.getContext('2d');
        let ini = null;
        SN.canvas.addEventListener('pointerdown', (ev) => { ini = [ev.clientX, ev.clientY]; });
        SN.canvas.addEventListener('pointermove', (ev) => {
            if (!ini) return;
            const dx = ev.clientX - ini[0], dy = ev.clientY - ini[1];
            if (Math.max(Math.abs(dx), Math.abs(dy)) < 16) return;
            girarSn(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'der' : 'izq') : (dy > 0 ? 'abajo' : 'arriba')); ini = [ev.clientX, ev.clientY];
        });
        SN.canvas.addEventListener('pointerup', () => { ini = null; });
        SN.botones = document.createElement('div');
        SN.botones.className = 'cruceta-sn';
        SN.botones.innerHTML = ['arriba', 'izq', 'der', 'abajo'].map(d => `<button class="sn-${d}" aria-label="${d}">${{ arriba: '▲', izq: '◀', der: '▶', abajo: '▼' }[d]}</button>`).join('');
        SN.botones.querySelectorAll('button').forEach((b, i) => b.addEventListener('pointerdown', (ev) => { ev.preventDefault(); girarSn(['arriba', 'izq', 'der', 'abajo'][i]); }));
    }
    if (!SN.teclado) {
        const mapa = { ArrowUp: 'arriba', KeyW: 'arriba', ArrowDown: 'abajo', KeyS: 'abajo', ArrowLeft: 'izq', KeyA: 'izq', ArrowRight: 'der', KeyD: 'der' };
        SN.teclado = (ev) => { const d = mapa[ev.code]; if (!d || !document.getElementById('pantalla-snake2')?.classList.contains('activa') || (ev.target && ev.target.tagName === 'INPUT')) return; ev.preventDefault(); girarSn(d); };
        window.addEventListener('keydown', SN.teclado);
    }
    if (!SN.enlace && !compuSn()) {
        SN.enlace = EnlaceVivo.conectar('snake2', {
            alMensaje(t, d) {
                if (d.c !== SN.clave || t !== 'cuerpo' || !Array.isArray(d.b)) return;
                const cuerpo = [];
                for (let i = 0; i + 1 < d.b.length; i += 2) cuerpo.push([d.b[i], d.b[i + 1]]);
                // El cuerpo anterior sirve para deslizar la víbora del otro hasta el nuevo.
                const antes = SN.el && SN.el.cuerpo;
                SN.el = { cuerpo, antes, t0: performance.now(), visto: Date.now(), fantasma: !!d.f };
            }
        });
    }
    if (!SN.loop) SN.loop = requestAnimationFrame(bucleSn);
    window._unsubLoopSnake2 = pararSn;
}
function pararSn(){
    if (SN.loop) cancelAnimationFrame(SN.loop);
    SN.loop = null;
    if (SN.enlace) SN.enlace.cerrar();
    SN.enlace = null;
}

const Snake2 = JuegoTurnos.crear({
    id: 'snake2',
    sinTurno: true,
    emojiListo: '🐍',
    compu: { paso: () => null }, // la compu juega adentro del bucle (pasoBotSn)
    intro: `Las dos víboras en la misma grilla, en vivo, durante 2 minutos. Comé las manzanas antes que el otro 🍎 y no choques con ningún cuerpo, que te corta a la mitad. Los bordes son pasadizos. ¡Gana la más larga!`,
    inicial: () => ({ semilla: Math.floor(Math.random() * 1e9), manzana: 0, largos: { nico: 3, carito: 3 }, clave: Math.random().toString(36).slice(2, 7), inicio: window.ahoraSync() + 3000, turno: null }),
    render(e) { return `<div id="snake2-host"></div><div class="texto-centro texto-tenue" style="font-size:0.75rem;">${nombreJugador('nico')} es la azul · ${nombreJugador('carito')} la rosa · deslizá el dedo o usá las flechas</div>`; },
    alDibujar(cont, e) {
        if (SN.estado && e.clave === SN.clave && (e.manzana || 0) > SN.manzanaVista && SN.fx) {
            const [mx, my] = manzanaSn(e, SN.manzanaVista), x = mx * CEL_SN + CEL_SN / 2, y = my * CEL_SN + CEL_SN / 2;
            SN.fx.particulas({ x, y, n: 14, color: ['#ff4a4a', '#ff9a8a', '#5bd15b'], vel: 2.2, vida: 600, grav: 0.06, tam: 2.6 });
            SN.fx.onda(x, y, { radio: 18, vida: 380, color: 'rgba(255,120,120,0.8)' });
            SN.fx.texto(x, y - 10, '+2', { tam: 11, color: '#fff' });
        }
        SN.manzanaVista = Math.max(SN.manzanaVista, e.manzana || 0);
        SN.estado = e;
        const host = cont.querySelector('#snake2-host');
        if (!host) return;
        VivoComun.montar('snake2', Snake2, host, e);
        if (SN.clave !== e.clave) reiniciarSn(e);
        if (e.fase === 'jugando') { arrancarSn(); host.appendChild(SN.canvas); host.appendChild(SN.botones); }
        else if (SN.canvas) { host.appendChild(SN.canvas); dibujarSn(); }
    }
});
window._snake2 = SN; // para pruebas
