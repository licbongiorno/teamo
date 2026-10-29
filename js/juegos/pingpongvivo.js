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
const PP = { canvas: null, ctx: null, enlace: null, loop: null, estado: null, clave: null, mio: null, suyo: null, bola: null, dueno: false, dedo: null, ultimoEnvio: 0, ultimoTs: 0, puntoMarcado: null, golpes: 0 };

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
    PP.suyo = { x: W_PP / 2, y: yBasePp(miRival), vx: 0, vy: 0 };
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
    if (!b.enMesa && (abajoPp(receptor) ? b.y > H_PP / 2 + 20 : b.y < H_PP / 2 - 20) && b.x > MESA_PP.x0 && b.x < MESA_PP.x1) b.enMesa = true;
}
function chocarPp(p, b, quien){
    if (b.de === quien && b.sacada) return false; // no se le pega dos veces seguidas
    const mitad = PALETA_PP / 2;
    if (Math.abs(b.x - p.x) > mitad + R_BOLA_PP || Math.abs(b.y - p.y) > 7 + R_BOLA_PP) return false;
    const hacia = abajoPp(quien) ? -1 : 1;
    if (b.sacada && Math.sign(b.vy) === hacia) return false; // tiene que venir hacia mí
    PP.golpes++;
    const vel = Math.min(6.2, 3.3 + PP.golpes * 0.14 + Math.abs(p.vy) * 0.15);
    b.vy = hacia * vel;
    b.vx = (b.x - p.x) / mitad * 2.1 + p.vx * 0.22;
    b.efecto = Math.max(-0.07, Math.min(0.07, -p.vx * 0.012));
    b.y = p.y + hacia * (8 + R_BOLA_PP);
    b.de = quien; b.enMesa = false; b.sacada = true;
    return true;
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
async function marcarPuntoPp(quien, como){
    if (PP.puntoMarcado) return;
    PP.puntoMarcado = quien;
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
    c.fillStyle = '#2a1f33'; c.fillRect(0, 0, W_PP, H_PP);
    c.fillStyle = '#3a2d47'; for (let i = 0; i < 12; i++) c.fillRect(0, i * 30, W_PP, 15);
    // Mesa (igual de los dos lados, así que no hace falta girarla)
    c.fillStyle = '#1f6fb5'; c.fillRect(MESA_PP.x0, MESA_PP.y0, MESA_PP.x1 - MESA_PP.x0, MESA_PP.y1 - MESA_PP.y0);
    c.strokeStyle = '#fff'; c.lineWidth = 2; c.strokeRect(MESA_PP.x0 + 1, MESA_PP.y0 + 1, MESA_PP.x1 - MESA_PP.x0 - 2, MESA_PP.y1 - MESA_PP.y0 - 2);
    c.lineWidth = 1; c.beginPath(); c.moveTo(W_PP / 2, MESA_PP.y0); c.lineTo(W_PP / 2, MESA_PP.y1); c.stroke();
    // Red
    c.fillStyle = 'rgba(255,255,255,0.85)'; c.fillRect(MESA_PP.x0 - 6, H_PP / 2 - 2, MESA_PP.x1 - MESA_PP.x0 + 12, 4);
    c.fillStyle = '#222'; c.fillRect(MESA_PP.x0 - 8, H_PP / 2 - 3, 4, 6); c.fillRect(MESA_PP.x1 + 4, H_PP / 2 - 3, 4, 6);
    const paleta = (p, col) => {
        if (!p) return;
        const [sx, sy] = aPantallaPp(p.x, p.y);
        c.fillStyle = 'rgba(0,0,0,0.3)'; c.fillRect(sx - PALETA_PP / 2 + 2, sy - 4 + 3, PALETA_PP, 9);
        c.fillStyle = col; c.beginPath(); c.roundRect ? c.roundRect(sx - PALETA_PP / 2, sy - 5, PALETA_PP, 10, 5) : c.rect(sx - PALETA_PP / 2, sy - 5, PALETA_PP, 10); c.fill();
        c.fillStyle = '#c9a26b'; c.fillRect(sx - 3, sy + (sy > H_PP / 2 ? 5 : -12), 6, 7);
    };
    const yoCol = miIdentidad === 'nico' ? '#3d8bfd' : '#e8496b', elCol = miIdentidad === 'nico' ? '#e8496b' : '#3d8bfd';
    if (PP.suyo) {
        const s = PP.suyo;
        if (!compuPp()) { s.rx = s.rx == null ? s.x : s.rx + (s.x - s.rx) * 0.5; s.ry = s.ry == null ? s.y : s.ry + (s.y - s.ry) * 0.5; paleta({ x: s.rx, y: s.ry }, elCol); }
        else paleta(s, elCol);
    }
    const b = PP.bola;
    if (b) {
        const [sx, sy] = aPantallaPp(b.x, b.y);
        // Altura de mentira: sube después del golpe y pica en la mesa del otro.
        const lejos = b.sacada ? Math.abs(b.y - yBasePp(b.de)) / (H_PP * 0.7) : 0;
        const alto = b.sacada ? Math.abs(Math.sin(Math.min(1, lejos) * Math.PI)) * 9 + 2 : 3;
        c.fillStyle = 'rgba(0,0,0,0.35)'; c.beginPath(); c.ellipse(sx + alto * 0.6, sy + alto * 0.6, R_BOLA_PP, R_BOLA_PP * 0.7, 0, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#fff'; c.beginPath(); c.arc(sx, sy - alto * 0.3, R_BOLA_PP + alto * 0.08, 0, Math.PI * 2); c.fill();
        if (Math.abs(b.efecto) > 0.02) { c.strokeStyle = 'rgba(255,210,90,0.8)'; c.lineWidth = 1; c.beginPath(); c.arc(sx, sy - alto * 0.3, R_BOLA_PP + 3, 0, Math.PI * (b.efecto > 0 ? 1 : -1)); c.stroke(); }
    }
    paleta(PP.mio, yoCol);
    const yo = e.puntos[miIdentidad], el = e.puntos[miRival];
    c.fillStyle = 'rgba(255,255,255,0.55)'; c.font = 'bold 26px monospace'; c.textAlign = 'right';
    c.fillText(String(el), W_PP - 6, H_PP / 2 - 12); c.fillText(String(yo), W_PP - 6, H_PP / 2 + 34);
    const falta = e.inicio - VivoComun.reloj('pingpongvivo');
    c.textAlign = 'center';
    if (e.fase === 'jugando' && (falta > 0 || PP.puntoMarcado)) {
        c.fillStyle = 'rgba(0,0,0,0.45)'; c.fillRect(0, H_PP / 2 - 46, W_PP, 30);
        c.fillStyle = '#fff'; c.font = 'bold 13px monospace';
        const quien = PP.puntoMarcado || (falta > 0 && e.ultimoPunto);
        const saca = quienSacaPp(e);
        c.fillText(quien ? (quien === miIdentidad ? '¡Punto tuyo!' : `Punto de ${nombreJugador(quien)}`) : (saca === miIdentidad ? 'Sacás vos' : `Saca ${nombreJugador(saca)}`), W_PP / 2, H_PP / 2 - 27);
    }
    c.textAlign = 'left';
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
                    PP.suyo = { ...(PP.suyo || {}), x: d.mx, y: d.my };
                    if (d.bx != null && !PP.dueno && b && !PP.puntoMarcado) { b.x += (d.bx - b.x) * 0.5; b.y += (d.by - b.y) * 0.5; b.vx = d.vx; b.vy = d.vy; b.efecto = d.ef; b.enMesa = !!d.em; }
                }
                if (t === 'golpe' && b) { PP.dueno = false; PP.golpes++; Object.assign(b, { x: d.x, y: d.y, vx: d.vx, vy: d.vy, efecto: d.efecto || 0, de: d.de, enMesa: false, sacada: true }); if (window.sfx) window.sfx.toque(); }
                if (t === 'punto' && b && !PP.puntoMarcado) { PP.puntoMarcado = d.q; Object.assign(b, { x: d.x, y: d.y, vx: 0, vy: 0, efecto: 0 }); if (window.sfx) window.sfx[d.q === miIdentidad ? 'punto' : 'error'](); }
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
