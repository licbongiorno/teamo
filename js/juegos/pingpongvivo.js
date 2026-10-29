// ==================== PING-PONG EN VIVO ====================
// (No confundir con js/juegos/pingpong.js, el Ping Pong de Preguntas.)
// La mesa vista desde arriba, como el Hockey: cada uno mueve su paleta con
// el dedo en su lado (la tuya siempre abajo). Si le pegás moviendo la
// paleta de costado, la pelota sale con efecto y se curva. Punto si el
// otro no la devuelve, o si la tuya se va por el costado antes de pasar la
// mesa del otro. A 11 con 2 de diferencia; el saque cambia cada 2 puntos.
// La pelota la simula quien le pegó último (js/enlace-vivo.js), y ese
// mismo decide el punto. En el mundo Nico está abajo; a Carito se le da vuelta.
const W_PP = 240, H_PP = 360, MESA_PP = { x0: 24, x1: 216, y0: 30, y1: 330 }, PALETA_PP = 44, R_BOLA_PP = 5, PUNTOS_PP = 11;
const PP = { canvas: null, ctx: null, enlace: null, loop: null, estado: null, clave: null, mio: null, suyo: null, bola: null, dueno: false, dedo: null, ultimoEnvio: 0, ultimoTs: 0, puntoMarcado: null, golpes: 0, fx: null, estela: [], golpeVis: {}, redT: 0, puntoT: 0 };

const girarPp = () => miIdentidad === 'carito';
const compuPp = () => { const m = typeof window.modoCompu === 'function' && window.modoCompu(); return m && m.juego === 'pingpongvivo' ? m : null; };
const aPantallaPp = (x, y) => girarPp() ? [W_PP - x, H_PP - y] : [x, y];
const abajoPp = (q) => q === 'nico';
// Dónde para cada uno la paleta (detrás de su punta de la mesa).
const yBasePp = (q) => abajoPp(q) ? MESA_PP.y1 + 10 : MESA_PP.y0 - 10;
function quienSacaPp(e){
    const total = e.puntos.nico + e.puntos.carito, otro = e.primero === 'nico' ? 'carito' : 'nico';
    if (e.puntos.nico >= PUNTOS_PP - 1 && e.puntos.carito >= PUNTOS_PP - 1) return total % 2 ? otro : e.primero;
    return Math.floor(total / 2) % 2 ? otro : e.primero;
}
function reiniciarPp(e){
    PP.clave = e.clave;
    PP.mio = { x: W_PP / 2, y: yBasePp(miIdentidad), vx: 0, vy: 0 };
    // Contra la otra persona se conserva (tiene el historial para dibujarla suave).
    if (compuPp() || !PP.suyo) PP.suyo = { x: W_PP / 2, y: yBasePp(miRival), vx: 0, vy: 0 };
    const saca = quienSacaPp(e);
    PP.bola = { x: W_PP / 2, y: yBasePp(saca) + (abajoPp(saca) ? -14 : 14), vx: 0, vy: 0, efecto: 0, de: saca, enMesa: false, sacada: false };
    PP.dueno = saca === miIdentidad || !!compuPp();
    PP.puntoMarcado = null; PP.golpes = 0;
}
// La pelota va hacia el que no le pegó último.
const haciaPp = (b) => b.de === 'nico' ? 'carito' : 'nico';
function moverBolaPp(b, dt){
    b.vx += b.efecto * dt; b.efecto *= Math.pow(0.985, dt);
    b.x += b.vx * dt; b.y += b.vy * dt;
    // ¿Ya pasó la red y llegó a la mitad del otro? Desde ahí cuenta como "en la mesa".
    const receptor = haciaPp(b);
    if (!b.enMesa && (abajoPp(receptor) ? b.y > H_PP / 2 + 20 : b.y < H_PP / 2 - 20) && b.x > MESA_PP.x0 && b.x < MESA_PP.x1) { b.enMesa = true; b.pique = performance.now(); b.px = b.x; b.py = b.y; }
    // Cruza la red
    const lado = b.y < H_PP / 2;
    if (b.ladoAnt != null && b.ladoAnt !== lado) b.cruce = performance.now();
    b.ladoAnt = lado;
}
function chocarPp(p, b, quien){
    if (b.de === quien && b.sacada) return false; // no se le pega dos veces seguidas
    const mitad = PALETA_PP / 2;
    if (Math.abs(b.x - p.x) > mitad + R_BOLA_PP || Math.abs(b.y - p.y) > 7 + R_BOLA_PP) return false;
    const hacia = abajoPp(quien) ? -1 : 1;
    if (b.sacada && Math.sign(b.vy) === hacia) return false; // tiene que venir hacia mí
    PP.golpes++;
    PP.golpeVis[quien] = performance.now();
    efectoGolpePp(b, p, quien);
    const vel = Math.min(6.2, 3.3 + PP.golpes * 0.14 + Math.abs(p.vy) * 0.15);
    b.vy = hacia * vel;
    b.vx = (b.x - p.x) / mitad * 2.1 + p.vx * 0.22;
    b.efecto = Math.max(-0.07, Math.min(0.07, -p.vx * 0.012));
    b.y = p.y + hacia * (8 + R_BOLA_PP);
    b.de = quien; b.enMesa = false; b.sacada = true;
    return true;
}
function efectoGolpePp(b, p, quien){
    if (!PP.fx) return;
    const [sx, sy] = aPantallaPp(b.x, b.y), fuerte = Math.abs(p.vx) + Math.abs(p.vy) > 4;
    PP.fx.chispas(sx, sy, ['#fff', '#ffe58a', quien === 'nico' ? '#9fd0ff' : '#ffb3c6'], fuerte ? 14 : 7);
    PP.fx.onda(sx, sy, { radio: fuerte ? 18 : 11, vida: 240 });
    if (fuerte) { PP.fx.temblor(1.5, 120); PP.fx.texto(sx, sy - 14, Math.abs(p.vx) > 3 ? '¡Efecto!' : '¡Smash!', { tam: 10, color: '#ffe58a', vida: 600 }); }
}
function pasoPp(dt){
    const e = PP.estado;
    if (!e || e.fase !== 'jugando' || !PP.mio) return;
    const m = PP.mio, abajo = abajoPp(miIdentidad);
    if (PP.dedo) {
        const tx = Math.max(0, Math.min(W_PP, PP.dedo.x));
        const ty = abajo ? Math.max(H_PP / 2 + 24, Math.min(H_PP - 8, PP.dedo.y)) : Math.max(8, Math.min(H_PP / 2 - 24, PP.dedo.y));
        const nx = m.x + (tx - m.x) * Math.min(1, 0.6 * dt), ny = m.y + (ty - m.y) * Math.min(1, 0.6 * dt);
        m.vx = (nx - m.x) / dt; m.vy = (ny - m.y) / dt; m.x = nx; m.y = ny;
    } else { m.vx *= 0.5; m.vy *= 0.5; }
    const b = PP.bola, compu = compuPp(), ahora = VivoComun.reloj('pingpongvivo');
    if (compu) pensarCompuPp(PP.suyo, b, compu.nivel, dt);
    if (PP.puntoMarcado) return;
    // Antes del saque la pelota está en la mano del que saca.
    if (!b.sacada) {
        const saca = b.de, pal = saca === miIdentidad ? m : PP.suyo;
        if (pal) { b.x = pal.x; b.y = pal.y + (abajoPp(saca) ? -14 : 14); }
        if (ahora < e.inicio) return;
        // Saca solo al terminar la cuenta (con un poco de ángulo al azar).
        if (PP.dueno) { b.vy = abajoPp(saca) ? -3.1 : 3.1; b.vx = (Math.random() - 0.5) * 1.6; b.sacada = true; b.enMesa = false; if (window.sfx) window.sfx.toque(); PP.enlace && PP.enlace.enviar('golpe', { ...b, c: PP.clave }, true); }
        return;
    }
    moverBolaPp(b, dt);
    if (compu && PP.suyo && chocarPp(PP.suyo, b, miRival) && window.sfx) window.sfx.toque();
    if (chocarPp(m, b, miIdentidad)) {
        if (window.sfx) window.sfx.toque();
        vibrarJ(6);
        if (!PP.dueno) PP.dueno = true;
        PP.enlace && PP.enlace.enviar('golpe', { x: b.x, y: b.y, vx: b.vx, vy: b.vy, efecto: b.efecto, de: b.de, c: PP.clave }, true);
    }
    if (!PP.dueno) return;
    // El punto lo decide el que le pegó último.
    const receptor = haciaPp(b), pego = b.de;
    const enMitadReceptor = abajoPp(receptor) ? b.y > H_PP / 2 : b.y < H_PP / 2;
    const paso = abajoPp(receptor) ? b.y > H_PP + 14 : b.y < -14;
    // Se fue por el costado antes de picar en la mesa del otro: error del que pegó.
    if (!b.enMesa && enMitadReceptor && (b.x < MESA_PP.x0 - 6 || b.x > MESA_PP.x1 + 6)) marcarPuntoPp(receptor, 'afuera');
    else if (paso || b.x < -R_BOLA_PP || b.x > W_PP + R_BOLA_PP) marcarPuntoPp(b.enMesa ? pego : receptor, b.enMesa ? 'no la devolvió' : 'afuera');
}
// La compu: va hacia donde va a llegar la pelota, con un error según el nivel.
function pensarCompuPp(p, b, nivel, dt){
    if (!p) return;
    const n = { facil: { vel: 2.2, error: 26 }, normal: { vel: 3.2, error: 12 }, dificil: { vel: 4.3, error: 4 } }[nivel] || { vel: 3.2, error: 12 };
    const viene = b.sacada && b.de !== miRival;
    let tx = W_PP / 2, ty = yBasePp(miRival);
    if (viene) {
        const pasos = Math.abs((ty - b.y) / (b.vy || 1));
        tx = b.x + b.vx * pasos + b.efecto * pasos * pasos * 0.5;
        if (p.err == null || Math.random() < 0.02) p.err = (Math.random() - 0.5) * n.error * 2;
        tx += p.err;
    } else p.err = null;
    const dx = tx - p.x, dy = ty - p.y, d = Math.hypot(dx, dy) || 1, paso = Math.min(d, n.vel * dt);
    const nx = p.x + dx / d * paso, ny = p.y + dy / d * paso;
    p.vx = (nx - p.x) / dt; p.vy = (ny - p.y) / dt; p.x = Math.max(0, Math.min(W_PP, nx)); p.y = ny;
}
function efectoPuntoPp(quien, b){
    PP.puntoT = performance.now();
    if (!PP.fx) return;
    const [sx, sy] = aPantallaPp(Math.max(0, Math.min(W_PP, b.x)), Math.max(0, Math.min(H_PP, b.y)));
    PP.fx.onda(sx, sy, { radio: 30, vida: 500, color: 'rgba(255,255,255,0.7)' });
    PP.fx.temblor(3, 260);
    const mio = quien === miIdentidad;
    PP.fx.flash(mio ? 'rgba(120,255,170,0.22)' : 'rgba(255,110,140,0.22)', 200);
    PP.fx.texto(W_PP / 2, mio ? H_PP * 0.72 : H_PP * 0.28, mio ? '+1 ¡Punto!' : `+1 ${nombreJugador(quien)}`, { tam: 16, color: mio ? '#7dffb0' : '#ffb3c6', vida: 1100 });
    if (mio) PP.fx.estrellitas(W_PP / 2, H_PP * 0.72, 10);
}
async function marcarPuntoPp(quien, como){
    if (PP.puntoMarcado) return;
    PP.puntoMarcado = quien;
    efectoPuntoPp(quien, PP.bola);
    PP.enlace && PP.enlace.enviar('punto', { q: quien, x: PP.bola.x, y: PP.bola.y, c: PP.clave }, true);
    vibrarJ([20, 40, 20]);
    if (window.sfx) window.sfx[quien === miIdentidad ? 'punto' : 'error']();
    const clave = PP.clave;
    await PingPongVivo.accionEnCola((e) => {
        if (e.clave !== clave) return null;
        const puntos = { ...e.puntos, [quien]: e.puntos[quien] + 1 };
        const otro = quien === 'nico' ? 'carito' : 'nico';
        if (puntos[quien] >= PUNTOS_PP && puntos[quien] - puntos[otro] >= 2) return { puntos, ganador: quien, motivo: `¡${puntos.nico} a ${puntos.carito}!` };
        return { puntos, clave: Math.random().toString(36).slice(2, 7), inicio: VivoComun.reloj('pingpongvivo') + 1500, ultimoPunto: quien, como };
    });
}
function dibujarPp(){
    const c = PP.ctx, e = PP.estado;
    if (!c || !e) return;
    const ahora = performance.now();
    if (PP.fx) PP.fx.antes(c);
    // Piso del gimnasio con reflejo de luz
    c.fillStyle = '#241a2e'; c.fillRect(-10, -10, W_PP + 20, H_PP + 20);
    for (let i = 0; i < 12; i++) { c.fillStyle = i % 2 ? '#2e2240' : '#2a1f3a'; c.fillRect(0, i * 30, W_PP, 30); }
    const luz = c.createRadialGradient(W_PP / 2, H_PP / 2, 20, W_PP / 2, H_PP / 2, 240); luz.addColorStop(0, 'rgba(255,250,230,0.12)'); luz.addColorStop(1, 'rgba(255,250,230,0)');
    c.fillStyle = luz; c.fillRect(0, 0, W_PP, H_PP);
    // Mesa: sombra, borde con grosor y superficie con brillo
    c.fillStyle = 'rgba(0,0,0,0.35)'; c.fillRect(MESA_PP.x0 + 5, MESA_PP.y0 + 7, MESA_PP.x1 - MESA_PP.x0, MESA_PP.y1 - MESA_PP.y0);
    c.fillStyle = '#123f6b'; c.fillRect(MESA_PP.x0 - 2, MESA_PP.y0 - 2, MESA_PP.x1 - MESA_PP.x0 + 4, MESA_PP.y1 - MESA_PP.y0 + 6);
    const gm = c.createLinearGradient(MESA_PP.x0, MESA_PP.y0, MESA_PP.x1, MESA_PP.y1); gm.addColorStop(0, '#2b86cf'); gm.addColorStop(0.5, '#1f6fb5'); gm.addColorStop(1, '#1b62a1');
    c.fillStyle = gm; c.fillRect(MESA_PP.x0, MESA_PP.y0, MESA_PP.x1 - MESA_PP.x0, MESA_PP.y1 - MESA_PP.y0);
    c.strokeStyle = '#fff'; c.lineWidth = 2; c.strokeRect(MESA_PP.x0 + 1, MESA_PP.y0 + 1, MESA_PP.x1 - MESA_PP.x0 - 2, MESA_PP.y1 - MESA_PP.y0 - 2);
    c.lineWidth = 1; c.beginPath(); c.moveTo(W_PP / 2, MESA_PP.y0); c.lineTo(W_PP / 2, MESA_PP.y1); c.stroke();
    const b = PP.bola, pb = b ? VivoComun.posBola(b) : null;
    // Marca del pique en la mesa
    if (b && b.pique && ahora - b.pique < 600) { const [px, py] = aPantallaPp(b.px, b.py), k = (ahora - b.pique) / 600; c.strokeStyle = `rgba(255,255,255,${0.7 * (1 - k)})`; c.lineWidth = 1.5; c.beginPath(); c.ellipse(px, py, 4 + k * 12, (4 + k * 12) * 0.6, 0, 0, Math.PI * 2); c.stroke(); }
    // Red: tiembla cuando pasa la pelota
    const tiembla = b && b.cruce ? Math.max(0, 1 - (ahora - b.cruce) / 300) : 0;
    c.fillStyle = 'rgba(255,255,255,0.18)'; c.fillRect(MESA_PP.x0 - 6, H_PP / 2 - 5, MESA_PP.x1 - MESA_PP.x0 + 12, 6);
    c.strokeStyle = 'rgba(255,255,255,0.35)'; c.lineWidth = 0.6;
    for (let x = MESA_PP.x0 - 4; x < MESA_PP.x1 + 6; x += 4) { const ond = Math.sin(x / 6 + ahora / 40) * tiembla * 1.5; c.beginPath(); c.moveTo(x, H_PP / 2 - 5 + ond); c.lineTo(x, H_PP / 2 + 1 + ond); c.stroke(); }
    c.fillStyle = 'rgba(255,255,255,0.92)'; c.fillRect(MESA_PP.x0 - 6, H_PP / 2 - 6 + Math.sin(ahora / 30) * tiembla, MESA_PP.x1 - MESA_PP.x0 + 12, 2);
    c.fillStyle = '#d8d8e0'; c.fillRect(MESA_PP.x0 - 9, H_PP / 2 - 7, 4, 9); c.fillRect(MESA_PP.x1 + 5, H_PP / 2 - 7, 4, 9);
    const paleta = (p, col, quien) => {
        if (!p) return;
        const [sx, sy] = aPantallaPp(p.x, p.y), arriba = sy < H_PP / 2;
        const golpe = Math.max(0, 1 - (ahora - (PP.golpeVis[quien] || 0)) / 180);
        const incl = Math.max(-0.45, Math.min(0.45, (p.vxd || 0) * 0.08)) * (girarPp() ? -1 : 1);
        c.save(); c.translate(sx, sy); c.rotate(incl); c.scale(1 + golpe * 0.18, 1 + golpe * 0.3);
        c.fillStyle = 'rgba(0,0,0,0.35)'; c.beginPath(); c.ellipse(3, 4, PALETA_PP / 2, 7, 0, 0, Math.PI * 2); c.fill();
        // Mango de madera
        c.fillStyle = '#c99a5b'; c.fillRect(-3, arriba ? -15 : 5, 6, 10); c.fillStyle = '#a77a43'; c.fillRect(-3, arriba ? -15 : 5, 2, 10);
        // Goma con borde y brillo
        c.fillStyle = '#1b1b22'; c.beginPath(); c.ellipse(0, 0, PALETA_PP / 2 + 1.5, 7.5, 0, 0, Math.PI * 2); c.fill();
        c.fillStyle = col; c.beginPath(); c.ellipse(0, 0, PALETA_PP / 2, 6, 0, 0, Math.PI * 2); c.fill();
        c.fillStyle = 'rgba(255,255,255,0.28)'; c.beginPath(); c.ellipse(-PALETA_PP / 6, -2, PALETA_PP / 4, 1.8, 0, 0, Math.PI * 2); c.fill();
        if (golpe > 0) { c.strokeStyle = `rgba(255,255,255,${golpe})`; c.lineWidth = 2; c.beginPath(); c.ellipse(0, 0, PALETA_PP / 2 + 4, 10, 0, 0, Math.PI * 2); c.stroke(); }
        c.restore();
    };
    const yoCol = miIdentidad === 'nico' ? '#3d8bfd' : '#e8496b', elCol = miIdentidad === 'nico' ? '#e8496b' : '#3d8bfd';
    // Velocidad lateral de cada paleta (para inclinarla)
    const velX = (p) => { if (!p) return; const x = p.dx != null ? p.dx : p.x; p.vxd = (p.vxd || 0) * 0.7 + ((x - (p.ux != null ? p.ux : x)) || 0) * 0.3; p.ux = x; };
    if (PP.suyo) {
        const s = PP.suyo, pos = compuPp() ? [s.x, s.y] : VivoComun.suave(s);
        if (pos) { s.dx = pos[0]; velX(s); paleta({ x: pos[0], y: pos[1], vxd: s.vxd }, elCol, miRival); }
    }
    if (pb) {
        const [sx, sy] = aPantallaPp(pb[0], pb[1]);
        // Altura de mentira: sube después del golpe y pica en la mesa del otro.
        const lejos = b.sacada ? Math.abs(b.y - yBasePp(b.de)) / (H_PP * 0.7) : 0;
        const alto = b.sacada ? Math.abs(Math.sin(Math.min(1, lejos) * Math.PI)) * 10 + 2 : 3 + Math.sin(ahora / 160) * 2;
        PP.estela.push({ x: sx, y: sy - alto * 0.3 }); if (PP.estela.length > 8) PP.estela.shift();
        const vel = Math.hypot(b.vx, b.vy);
        if (vel > 3.6) PP.estela.forEach((q, k) => { c.globalAlpha = k / PP.estela.length * 0.3; c.fillStyle = Math.abs(b.efecto) > 0.02 ? '#ffe58a' : '#fff'; c.beginPath(); c.arc(q.x, q.y, R_BOLA_PP * (0.4 + k / 16), 0, Math.PI * 2); c.fill(); });
        c.globalAlpha = 1;
        c.fillStyle = 'rgba(0,0,0,0.35)'; c.beginPath(); c.ellipse(sx + alto * 0.6, sy + alto * 0.6, R_BOLA_PP, R_BOLA_PP * 0.7, 0, 0, Math.PI * 2); c.fill();
        // Antes del saque la pelota "late" para avisar que ya sale.
        if (!b.sacada) { c.strokeStyle = `rgba(255,255,255,${0.4 + Math.sin(ahora / 120) * 0.3})`; c.lineWidth = 1; c.beginPath(); c.arc(sx, sy - alto * 0.3, R_BOLA_PP + 4 + Math.sin(ahora / 120) * 2, 0, Math.PI * 2); c.stroke(); }
        const gb = c.createRadialGradient(sx - 1.5, sy - alto * 0.3 - 1.5, 0.5, sx, sy - alto * 0.3, R_BOLA_PP + alto * 0.08);
        gb.addColorStop(0, '#ffffff'); gb.addColorStop(1, '#ffe3b8');
        c.fillStyle = gb; c.beginPath(); c.arc(sx, sy - alto * 0.3, R_BOLA_PP + alto * 0.08, 0, Math.PI * 2); c.fill();
        if (Math.abs(b.efecto) > 0.02) { c.strokeStyle = 'rgba(255,210,90,0.85)'; c.lineWidth = 1.2; const g = ahora / 60 * Math.sign(b.efecto); c.beginPath(); c.arc(sx, sy - alto * 0.3, R_BOLA_PP + 3, g, g + Math.PI * 1.2); c.stroke(); }
    }
    if (PP.mio) { velX(PP.mio); paleta(PP.mio, yoCol, miIdentidad); }
    if (PP.fx) PP.fx.dibujar(c);
    // Marcador (salta cuando cambia)
    const yo = e.puntos[miIdentidad], el = e.puntos[miRival], pop = PP.puntoT ? FxVivo.rebote(Math.min(1, (ahora - PP.puntoT) / 450)) : 1;
    c.textAlign = 'right'; c.font = 'bold 26px monospace';
    c.save(); c.translate(W_PP - 6, H_PP / 2 - 12); if (PP.puntoMarcado === miRival) c.scale(pop, pop); c.fillStyle = 'rgba(255,255,255,0.6)'; c.fillText(String(el), 0, 0); c.restore();
    c.save(); c.translate(W_PP - 6, H_PP / 2 + 34); if (PP.puntoMarcado === miIdentidad || e.ultimoPunto === miIdentidad && ahora - PP.puntoT < 450) c.scale(pop, pop); c.fillStyle = 'rgba(255,255,255,0.6)'; c.fillText(String(yo), 0, 0); c.restore();
    // Puntitos de saque: quién saca y cuántos saques le quedan
    const saca = quienSacaPp(e), total = e.puntos.nico + e.puntos.carito, deuce = e.puntos.nico >= PUNTOS_PP - 1 && e.puntos.carito >= PUNTOS_PP - 1;
    const quedanSaques = deuce ? 1 : 2 - (total % 2);
    for (let k = 0; k < quedanSaques; k++) { c.fillStyle = '#ffe58a'; c.beginPath(); c.arc(W_PP - 10 - k * 7, saca === miIdentidad ? H_PP / 2 + 44 : H_PP / 2 - 44, 2.2, 0, Math.PI * 2); c.fill(); }
    const falta = e.inicio - VivoComun.reloj('pingpongvivo');
    c.textAlign = 'center';
    if (e.fase === 'jugando' && (falta > 0 || PP.puntoMarcado)) {
        const quien = PP.puntoMarcado || (falta > 0 && e.ultimoPunto);
        if (!quien && falta > 0) {
            const n = Math.ceil(falta / 1000), k = 1 - (falta % 1000) / 1000, esc = FxVivo.rebote(Math.min(1, k * 3));
            c.save(); c.translate(W_PP / 2, H_PP / 2 - 30); c.scale(esc, esc); c.font = 'bold 30px monospace'; c.lineWidth = 4; c.strokeStyle = 'rgba(0,0,0,0.5)'; c.fillStyle = '#fff'; c.strokeText(String(n), 0, 0); c.fillText(String(n), 0, 0); c.restore();
        }
        c.fillStyle = 'rgba(0,0,0,0.45)'; c.fillRect(0, H_PP / 2 + 12, W_PP, 22);
        c.fillStyle = '#fff'; c.font = 'bold 11px monospace';
        c.fillText(quien ? (quien === miIdentidad ? '¡Punto tuyo!' : `Punto de ${nombreJugador(quien)}`) + (e.como && !PP.puntoMarcado ? ` · ${e.como}` : '') : (saca === miIdentidad ? 'Sacás vos' : `Saca ${nombreJugador(saca)}`), W_PP / 2, H_PP / 2 + 27);
    }
    c.textAlign = 'left';
    if (PP.fx) PP.fx.despues(c);
    VivoComun.estado(c, W_PP, H_PP, PP.enlace, nombreJugador(miRival));
}
function buclePp(ts){
    const pantalla = document.getElementById('pantalla-pingpongvivo');
    if (!pantalla || !pantalla.classList.contains('activa')) { pararPp(); return; }
    if (VivoComun.pausa('pingpongvivo')) { PP.ultimoTs = 0; dibujarPp(); VivoComun.cartelPausa(PP.ctx); PP.loop = requestAnimationFrame(buclePp); return; }
    const dt = Math.min(2.5, (ts - (PP.ultimoTs || ts)) / 16.67 || 1);
    PP.ultimoTs = ts;
    pasoPp(dt);
    if (PP.enlace && PP.mio && Date.now() - PP.ultimoEnvio > 33) {
        PP.ultimoEnvio = Date.now();
        const m = { mx: Math.round(PP.mio.x), my: Math.round(PP.mio.y), c: PP.clave };
        if (PP.dueno && PP.bola && PP.bola.sacada) Object.assign(m, { bx: +PP.bola.x.toFixed(1), by: +PP.bola.y.toFixed(1), vx: +PP.bola.vx.toFixed(2), vy: +PP.bola.vy.toFixed(2), ef: +PP.bola.efecto.toFixed(4), em: PP.bola.enMesa ? 1 : 0 });
        PP.enlace.enviar('p', m);
    }
    if (PP.estado && PP.estado.fase === 'jugando') VivoComun.cuenta('PP', PP.estado.inicio);
    dibujarPp();
    PP.loop = requestAnimationFrame(buclePp);
}
function arrancarPp(){
    PP.fx = PP.fx || FxVivo.crear();
    if (!PP.canvas) {
        PP.canvas = document.createElement('canvas');
        PP.canvas.width = W_PP; PP.canvas.height = H_PP;
        PP.canvas.className = 'lienzo-hockey';
        PP.ctx = PP.canvas.getContext('2d');
        const dedo = (ev) => {
            ev.preventDefault();
            if (VivoComun.pausa('pingpongvivo')) return;
            const r = PP.canvas.getBoundingClientRect();
            let x = (ev.clientX - r.left) * W_PP / r.width, y = (ev.clientY - r.top) * H_PP / r.height;
            if (girarPp()) { x = W_PP - x; y = H_PP - y; }
            PP.dedo = { x, y };
        };
        PP.canvas.addEventListener('pointerdown', (ev) => { PP.canvas.setPointerCapture && PP.canvas.setPointerCapture(ev.pointerId); dedo(ev); });
        PP.canvas.addEventListener('pointermove', (ev) => { if (PP.dedo || ev.pointerType === 'mouse') dedo(ev); });
        PP.canvas.addEventListener('pointerup', () => { PP.dedo = null; });
    }
    if (!PP.enlace && !compuPp()) {
        PP.enlace = EnlaceVivo.conectar('pingpongvivo', {
            alMensaje(t, d) {
                if (d.c && d.c !== PP.clave) return;
                const b = PP.bola;
                if (t === 'p') {
                    PP.suyo = VivoComun.recibir(PP.suyo, { x: d.mx, y: d.my });
                    if (d.bx != null && !PP.dueno && b && !PP.puntoMarcado) { VivoComun.adelantar(b, { x: d.bx, y: d.by, vx: d.vx, vy: d.vy, efecto: d.ef }, moverBolaPp); b.enMesa = b.enMesa || !!d.em; }
                }
                if (t === 'golpe' && b) {
                    PP.dueno = false; PP.golpes++;
                    VivoComun.adelantar(b, { x: d.x, y: d.y, vx: d.vx, vy: d.vy, efecto: d.efecto || 0, de: d.de, enMesa: false, sacada: true }, moverBolaPp);
                    if (window.sfx) window.sfx.toque();
                    PP.golpeVis[d.de] = performance.now();
                    if (PP.fx) { const [sx, sy] = aPantallaPp(d.x, d.y); PP.fx.chispas(sx, sy, ['#fff', '#ffe58a'], 8); PP.fx.onda(sx, sy, { radio: 12, vida: 240 }); }
                }
                if (t === 'punto' && b && !PP.puntoMarcado) { PP.puntoMarcado = d.q; Object.assign(b, { x: d.x, y: d.y, vx: 0, vy: 0, efecto: 0 }); efectoPuntoPp(d.q, b); if (window.sfx) window.sfx[d.q === miIdentidad ? 'punto' : 'error'](); }
            }
        });
    }
    if (!PP.loop) PP.loop = requestAnimationFrame(buclePp);
    window._unsubLoopPingpongvivo = pararPp;
}
function pararPp(){
    if (PP.loop) cancelAnimationFrame(PP.loop);
    PP.loop = null;
    if (PP.enlace) PP.enlace.cerrar();
    PP.enlace = null;
    PP.dedo = null;
}

const PingPongVivo = JuegoTurnos.crear({
    id: 'pingpongvivo',
    sinTurno: true,
    emojiListo: '🏓',
    compu: { paso: () => null }, // la compu juega adentro del bucle (pensarCompuPp)
    intro: `Ping-pong en vivo, la mesa vista desde arriba: mové tu paleta con el dedo (la tuya es la de abajo). Si le pegás moviéndola de costado, sale con efecto. Punto si el otro no la devuelve o si la tuya se va por el costado. ¡A ${PUNTOS_PP}, con 2 de diferencia!`,
    inicial: () => ({ puntos: { nico: 0, carito: 0 }, primero: Math.random() < 0.5 ? 'nico' : 'carito', clave: Math.random().toString(36).slice(2, 7), inicio: window.ahoraSync() + 3000, turno: null }),
    render(e) { return `<div id="pingpongvivo-host"></div><div class="texto-centro texto-tenue" style="font-size:0.75rem;">Tu paleta es la de abajo. ${nombreJugador('nico')} ${e.puntos.nico} — ${e.puntos.carito} ${nombreJugador('carito')}</div>`; },
    alDibujar(cont, e) {
        PP.estado = e;
        const host = cont.querySelector('#pingpongvivo-host');
        if (!host) return;
        VivoComun.montar('pingpongvivo', PingPongVivo, host, e);
        if (PP.clave !== e.clave) reiniciarPp(e);
        if (e.fase === 'jugando') arrancarPp();
        if (PP.canvas) { host.appendChild(PP.canvas); dibujarPp(); }
    }
});
window._pingpongvivo = PP; // para pruebas
