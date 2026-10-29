// ==================== FÚTBOL DE CABEZAS (en vivo) ====================
// Dos cabezones en una cancha de costado, un arco en cada punta. Se corre
// con ◀ ▶, se salta con ⤒ y se patea con 🦶; la pelota también rebota en
// la cabeza. Gana el primero en meter 5, o el que va ganando a los 2
// minutos (si van empatados, el próximo gol gana: gol de oro).
// Como en el Vóley, la pelota la simula quien la tocó último y la manda por
// js/enlace-vivo.js. En el mundo Nico defiende el arco de la izquierda; a
// Carito se le da vuelta la cancha, así cada uno ve su arco a la izquierda.
const W_FB = 320, H_FB = 200, PISO_FB = 180, R_CAB = 15, R_PEL_FB = 7, GOLES_FB = 5, DURA_FB = 120000;
const ARCO_ALTO_FB = 112, ARCO_ANCHO_FB = 18; // el travesaño está a esa altura y sale esa distancia del borde
const FB = { canvas: null, ctx: null, enlace: null, loop: null, estado: null, clave: null, yo: null, el: null, pelota: null, dueno: false, teclas: {}, ultimoEnvio: 0, ultimoTs: 0, golMarcado: null, ultimoToque: 0, patada: 0, cerrando: false };

const espejoFb = () => miIdentidad === 'carito';
const compuFb = () => { const m = typeof window.modoCompu === 'function' && window.modoCompu(); return m && m.juego === 'futbolcabezas' ? m : null; };
const aPantallaFb = (x) => espejoFb() ? W_FB - x : x;
// Hacia dónde ataca cada uno en el mundo (Nico ataca a la derecha).
const ataqueFb = (q) => q === 'nico' ? 1 : -1;
const inicioXFb = (q) => q === 'nico' ? 70 : W_FB - 70;
function reiniciarFb(e){
    FB.clave = e.clave;
    FB.yo = { x: inicioXFb(miIdentidad), y: PISO_FB, vx: 0, vy: 0, mira: ataqueFb(miIdentidad) };
    FB.pelota = { x: W_FB / 2, y: 70, vx: e.saque === 'nico' ? -0.6 : e.saque === 'carito' ? 0.6 : 0, vy: 0 };
    FB.dueno = (e.saque || 'nico') === miIdentidad || !!compuFb(); // al arranque la tiene Nico
    FB.golMarcado = null;
    if (compuFb()) FB.el = { x: inicioXFb(miRival), y: PISO_FB, vx: 0, vy: 0, mira: ataqueFb(miRival), bot: true };
}
function moverPelotaFb(b, dt){
    b.vy += 0.22 * dt;
    b.vx *= Math.pow(0.997, dt);
    b.x += b.vx * dt; b.y += b.vy * dt;
    if (b.y > PISO_FB - R_PEL_FB) { b.y = PISO_FB - R_PEL_FB; b.vy = -Math.abs(b.vy) * 0.62; b.vx *= 0.96; if (Math.abs(b.vy) < 0.6) b.vy = 0; }
    if (b.y < R_PEL_FB) { b.y = R_PEL_FB; b.vy = Math.abs(b.vy) * 0.8; }
    // Paredes de atrás del arco (abajo del travesaño entra; arriba es pared).
    for (const lado of [0, 1]) {
        const borde = lado ? W_FB - R_PEL_FB : R_PEL_FB;
        if (lado ? b.x > borde : b.x < borde) { b.x = borde; b.vx = (lado ? -1 : 1) * Math.abs(b.vx) * 0.75; }
        // Travesaño: una barrita horizontal desde el borde hasta ARCO_ANCHO_FB.
        const dentro = lado ? b.x > W_FB - ARCO_ANCHO_FB - R_PEL_FB * 0.5 : b.x < ARCO_ANCHO_FB + R_PEL_FB * 0.5;
        if (dentro && Math.abs(b.y - ARCO_ALTO_FB) < R_PEL_FB + 2) {
            if (b.vy > 0 && b.y < ARCO_ALTO_FB) { b.y = ARCO_ALTO_FB - R_PEL_FB - 2; b.vy = -Math.abs(b.vy) * 0.6; b.vx += lado ? -0.8 : 0.8; }
            else if (b.vy < 0 && b.y > ARCO_ALTO_FB) { b.y = ARCO_ALTO_FB + R_PEL_FB + 2; b.vy = Math.abs(b.vy) * 0.5; }
        }
    }
}
// La cabeza es un círculo a R_CAB arriba de los pies.
const cabezaFb = (s) => ({ x: s.x, y: s.y - R_CAB - 4 });
function chocarFb(s, b){
    const h = cabezaFb(s), dx = b.x - h.x, dy = b.y - h.y, d = Math.hypot(dx, dy);
    // Pies: un rectangulito abajo de la cabeza también la empuja (para que no pase por debajo).
    if (d >= R_CAB + R_PEL_FB || d === 0) {
        if (Math.abs(b.x - s.x) < 9 + R_PEL_FB && b.y > s.y - 10 && b.y < s.y + R_PEL_FB) {
            b.x = s.x + Math.sign(b.x - s.x || s.mira) * (9 + R_PEL_FB + 0.5);
            b.vx = s.vx * 1.1 + Math.sign(b.x - s.x) * 1.2; b.vy = Math.min(b.vy, -1.5);
            return true;
        }
        return false;
    }
    const nx = dx / d, ny = dy / d;
    b.x = h.x + nx * (R_CAB + R_PEL_FB + 0.5); b.y = h.y + ny * (R_CAB + R_PEL_FB + 0.5);
    const rel = (b.vx - s.vx) * nx + (b.vy - s.vy) * ny;
    if (rel < 0) { b.vx -= 1.75 * rel * nx; b.vy -= 1.75 * rel * ny; }
    b.vx += s.vx * 0.4; b.vy += Math.min(0, s.vy) * 0.4;
    const v = Math.hypot(b.vx, b.vy);
    if (v > 9) { b.vx *= 9 / v; b.vy *= 9 / v; }
    return true;
}
// Patada: si la pelota está cerca de los pies, sale fuerte hacia el arco de enfrente.
function patearFb(s, b, quien){
    const dx = b.x - s.x, dy = b.y - (s.y - 8);
    if (Math.abs(dx) > 26 || Math.abs(dy) > 24) return false;
    const dir = ataqueFb(quien);
    b.vx = dir * (6.2 + Math.random() * 0.8) + s.vx * 0.3;
    b.vy = -3.2 - (dy < -8 ? 1.5 : 0) - Math.random();
    b.x = s.x + dir * (12 + R_PEL_FB);
    return true;
}
function moverJugadorFb(s, dir, salto, dt, vel){
    s.vx = dir * vel;
    if (dir) s.mira = dir;
    if (salto && s.y >= PISO_FB) s.vy = -6.4;
    s.vy = (s.vy || 0) + 0.42 * dt;
    s.x += s.vx * dt; s.y = Math.min(PISO_FB, s.y + s.vy * dt);
    if (s.y >= PISO_FB) s.vy = 0;
    s.x = Math.max(R_CAB, Math.min(W_FB - R_CAB, s.x));
}
function pasoFb(dt){
    const e = FB.estado, s = FB.yo;
    if (!e || e.fase !== 'jugando' || !s) return;
    const dir = ((FB.teclas.der ? 1 : 0) - (FB.teclas.izq ? 1 : 0)) * (espejoFb() ? -1 : 1);
    moverJugadorFb(s, dir, FB.teclas.salto, dt, 2.9);
    // Los dos cuerpos no se atraviesan (corrijo sólo el mío).
    const o = FB.el && (FB.el.bot ? FB.el : FB.el.x != null && { x: FB.el.rx != null ? FB.el.rx : FB.el.x, y: FB.el.ry != null ? FB.el.ry : FB.el.y });
    if (o && Math.abs(o.x - s.x) < R_CAB * 1.7 && Math.abs(o.y - s.y) < R_CAB * 1.5) s.x = o.x + Math.sign(s.x - o.x || -ataqueFb(miIdentidad)) * R_CAB * 1.7;
    s.x = Math.max(R_CAB, Math.min(W_FB - R_CAB, s.x));
    const compu = compuFb(), ahora = VivoComun.reloj('futbolcabezas');
    if (compu && FB.el && ahora >= e.inicio) pensarCompuFb(FB.el, compu.nivel, dt);
    if (ahora < e.inicio || FB.golMarcado) return;
    const b = FB.pelota;
    moverPelotaFb(b, dt);
    const toque = (quien) => {
        if (Date.now() - FB.ultimoToque > 110 && window.sfx) window.sfx.toque();
        FB.ultimoToque = Date.now();
        if (quien === miIdentidad && !FB.dueno) { FB.dueno = true; FB.enlace && FB.enlace.enviar('golpe', { x: b.x, y: b.y, vx: b.vx, vy: b.vy, c: FB.clave }, true); }
    };
    if (compu && FB.el) { if (chocarFb(FB.el, b)) toque(miRival); if (FB.el.patear) { FB.el.patear = false; if (patearFb(FB.el, b, miRival)) toque(miRival); } }
    if (chocarFb(s, b)) toque(miIdentidad);
    if (FB.teclas.patada && Date.now() - FB.patada > 350) {
        FB.patada = Date.now();
        if (patearFb(s, b, miIdentidad)) { toque(miIdentidad); vibrarJ(10); }
    }
    // ¿Gol? Lo decide el dueño de la pelota: entró entera abajo del travesaño.
    if (FB.dueno && b.y > ARCO_ALTO_FB + 2) {
        if (b.x < ARCO_ANCHO_FB * 0.55) marcarGolFb('carito');
        else if (b.x > W_FB - ARCO_ANCHO_FB * 0.55) marcarGolFb('nico');
    }
    // Se acabó el tiempo y alguien va ganando: cierra cualquiera (el doc decide una vez).
    if (ahora >= finPartidoFb(e) && e.goles.nico !== e.goles.carito && !FB.cerrando) cerrarPorTiempoFb();
}
const finPartidoFb = (e) => e.finPartido || (e.inicio + DURA_FB);
// La compu: se pone del lado de la pelota que da a su arco (para empujarla
// hacia el mío), salta si viene alta y patea cuando la tiene a tiro.
function pensarCompuFb(s, nivel, dt){
    const n = { facil: { vel: 1.9, salto: 0.25, patea: 0.04 }, normal: { vel: 2.5, salto: 0.5, patea: 0.09 }, dificil: { vel: 2.9, salto: 0.8, patea: 0.16 } }[nivel] || { vel: 2.5, salto: 0.5, patea: 0.09 };
    const b = FB.pelota, ataca = ataqueFb(miRival);
    // Detrás de la pelota (mirando a mi arco); si la pelota está muy cerca de su arco, se apura a cubrir.
    let meta = b.x - ataca * 16;
    const suArco = ataca > 0 ? 0 : W_FB;
    if (Math.abs(b.x - suArco) < 70 && Math.abs(s.x - suArco) > Math.abs(b.x - suArco)) meta = b.x - ataca * 22;
    const dir = Math.abs(meta - s.x) < 3 ? 0 : Math.sign(meta - s.x);
    const cerca = Math.abs(b.x - s.x) < 34;
    const salto = cerca && b.y < PISO_FB - 40 && b.vy > -1 && Math.random() < n.salto * 0.2;
    moverJugadorFb(s, dir, salto, dt, n.vel);
    s.mira = ataca;
    if (cerca && Math.sign(b.x - s.x) === ataca && Math.random() < n.patea) s.patear = true;
}
async function marcarGolFb(quien){
    if (FB.golMarcado) return;
    FB.golMarcado = quien;
    FB.enlace && FB.enlace.enviar('gol', { q: quien, x: FB.pelota.x, y: FB.pelota.y, c: FB.clave }, true);
    vibrarJ([20, 40, 20]);
    if (window.sfx) window.sfx[quien === miIdentidad ? 'punto' : 'error']();
    const clave = FB.clave;
    await FutbolCabezas.accionEnCola((e) => {
        if (e.clave !== clave) return null;
        const goles = { ...e.goles, [quien]: e.goles[quien] + 1 };
        const otro = quien === 'nico' ? 'carito' : 'nico';
        const sinTiempo = VivoComun.reloj('futbolcabezas') >= finPartidoFb(e);
        if (goles[quien] >= GOLES_FB || sinTiempo) return { goles, ganador: quien, motivo: `¡${goles.nico} a ${goles.carito}!${sinTiempo && goles[quien] < GOLES_FB ? ' (gol de oro)' : ''}` };
        // Después del gol saca el que lo recibió; el reloj del partido se corre lo que dura el festejo.
        return { goles, saque: otro, clave: Math.random().toString(36).slice(2, 7), inicio: VivoComun.reloj('futbolcabezas') + 1600, finPartido: finPartidoFb(e) + 1600, ultimoGol: quien };
    });
}
async function cerrarPorTiempoFb(){
    FB.cerrando = true;
    await FutbolCabezas.accionEnCola((e) => {
        if (VivoComun.reloj('futbolcabezas') < finPartidoFb(e) || e.goles.nico === e.goles.carito) return null;
        const g = e.goles.nico > e.goles.carito ? 'nico' : 'carito';
        return { ganador: g, motivo: `¡Se terminó el tiempo: ${e.goles.nico} a ${e.goles.carito}!` };
    });
    setTimeout(() => { FB.cerrando = false; }, 1500);
}
function dibujarFb(){
    const c = FB.ctx, e = FB.estado;
    if (!c || !e) return;
    c.setTransform(2, 0, 0, 2, 0, 0);
    const cielo = c.createLinearGradient(0, 0, 0, PISO_FB); cielo.addColorStop(0, '#1d2a55'); cielo.addColorStop(1, '#41659e');
    c.fillStyle = cielo; c.fillRect(0, 0, W_FB, H_FB);
    // Tribuna y reflectores
    c.fillStyle = 'rgba(255,255,255,0.08)'; for (let i = 0; i < 46; i++) { c.beginPath(); c.arc((i * 37) % W_FB, 40 + (i * 13) % 50, 2.5, 0, Math.PI * 2); c.fill(); }
    c.fillStyle = 'rgba(255,255,210,0.5)'; c.beginPath(); c.arc(30, 14, 5, 0, Math.PI * 2); c.arc(W_FB - 30, 14, 5, 0, Math.PI * 2); c.fill();
    // Pasto a rayas
    for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? '#3fae4f' : '#46bb57'; c.fillRect(i * W_FB / 8, PISO_FB, W_FB / 8, H_FB - PISO_FB); }
    c.fillStyle = 'rgba(255,255,255,0.7)'; c.fillRect(W_FB / 2 - 0.5, PISO_FB, 1, H_FB - PISO_FB);
    // Arcos (red y travesaño)
    for (const lado of [0, 1]) {
        const x0 = lado ? W_FB - ARCO_ANCHO_FB : 0;
        c.fillStyle = 'rgba(255,255,255,0.12)'; c.fillRect(x0, ARCO_ALTO_FB, ARCO_ANCHO_FB, PISO_FB - ARCO_ALTO_FB);
        c.strokeStyle = 'rgba(255,255,255,0.35)'; c.lineWidth = 0.5;
        for (let y = ARCO_ALTO_FB + 6; y < PISO_FB; y += 6) { c.beginPath(); c.moveTo(x0, y); c.lineTo(x0 + ARCO_ANCHO_FB, y); c.stroke(); }
        for (let x = 4; x < ARCO_ANCHO_FB; x += 5) { c.beginPath(); c.moveTo(x0 + x, ARCO_ALTO_FB); c.lineTo(x0 + x, PISO_FB); c.stroke(); }
        c.fillStyle = '#fff'; c.fillRect(x0, ARCO_ALTO_FB - 2, ARCO_ANCHO_FB, 3);
        c.fillRect(lado ? x0 : ARCO_ANCHO_FB - 2, ARCO_ALTO_FB - 2, 2, PISO_FB - ARCO_ALTO_FB + 2);
    }
    const b = FB.pelota;
    if (b) { const alto = Math.max(0, PISO_FB - b.y); c.fillStyle = `rgba(0,0,0,${Math.max(0.06, 0.25 - alto / 700)})`; c.beginPath(); c.ellipse(aPantallaFb(b.x), PISO_FB + 2, 6 + alto / 40, 1.8, 0, 0, Math.PI * 2); c.fill(); }
    const cabezon = (s, piel, camiseta, pelo) => {
        if (!s) return;
        const x = aPantallaFb(s.x), y = s.y, mira = (espejoFb() ? -1 : 1) * (s.mira || 1);
        c.fillStyle = 'rgba(0,0,0,0.25)'; c.beginPath(); c.ellipse(x, PISO_FB + 2, 12, 2.5, 0, 0, Math.PI * 2); c.fill();
        // Cuerpito y botín
        c.fillStyle = camiseta; c.fillRect(x - 6, y - 10, 12, 8);
        c.fillStyle = '#222'; c.fillRect(x - 6, y - 2, 5, 2); c.fillRect(x + 1, y - 2, 5, 2);
        if (s === FB.yo && Date.now() - FB.patada < 160) { c.fillStyle = '#222'; c.fillRect(x + mira * 6, y - 6, mira * 9, 3); }
        // Cabeza
        const h = cabezaFb(s), hy = h.y;
        c.fillStyle = piel; c.beginPath(); c.arc(x, hy, R_CAB, 0, Math.PI * 2); c.fill();
        c.fillStyle = pelo; c.beginPath(); c.arc(x, hy - 3, R_CAB, Math.PI * 1.05, Math.PI * 1.95); c.fill();
        c.fillStyle = '#fff'; c.beginPath(); c.arc(x + mira * 6, hy, 4, 0, Math.PI * 2); c.fill();
        if (b) { const a = Math.atan2(b.y - hy, aPantallaFb(b.x) - (x + mira * 6)); c.fillStyle = '#2a1f33'; c.beginPath(); c.arc(x + mira * 6 + Math.cos(a) * 1.8, hy + Math.sin(a) * 1.8, 2, 0, Math.PI * 2); c.fill(); }
        c.strokeStyle = '#7a3b2e'; c.lineWidth = 1.2; c.beginPath(); c.arc(x + mira * 4, hy + 6, 3.5, 0.2, Math.PI - 0.2); c.stroke();
    };
    const colYo = miIdentidad === 'nico' ? ['#f2c9a0', '#3d8bfd', '#5a3a22'] : ['#f6d2b4', '#e8496b', '#2b1a12'];
    const colEl = miIdentidad === 'nico' ? ['#f6d2b4', '#e8496b', '#2b1a12'] : ['#f2c9a0', '#3d8bfd', '#5a3a22'];
    const o = FB.el;
    if (o) { const p = o.bot ? [o.x, o.y] : VivoComun.suave(o); if (p) cabezon({ x: p[0], y: Math.min(PISO_FB, p[1]), mira: o.mira }, ...colEl); }
    cabezon(FB.yo, ...colYo);
    if (b) {
        const x = aPantallaFb(b.x);
        c.fillStyle = '#fff'; c.beginPath(); c.arc(x, b.y, R_PEL_FB, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#2a1f33'; c.beginPath(); c.arc(x, b.y, 2.4, 0, Math.PI * 2); c.fill();
        for (let k = 0; k < 5; k++) { const a = k * Math.PI * 0.4 + b.x / 9; c.beginPath(); c.arc(x + Math.cos(a) * 5, b.y + Math.sin(a) * 5, 1.4, 0, Math.PI * 2); c.fill(); }
    }
    // Marcador y reloj
    const yo = e.goles[miIdentidad], el = e.goles[miRival];
    c.fillStyle = 'rgba(10,12,30,0.55)'; c.fillRect(W_FB / 2 - 52, 4, 104, 20);
    c.fillStyle = '#fff'; c.font = 'bold 14px monospace'; c.textAlign = 'center';
    c.fillText(`${yo}  -  ${el}`, W_FB / 2, 19);
    const ahora = VivoComun.reloj('futbolcabezas'), quedan = Math.max(0, finPartidoFb(e) - Math.max(ahora, e.inicio));
    c.font = 'bold 8px monospace';
    const oro = e.fase === 'jugando' && ahora >= finPartidoFb(e);
    c.fillStyle = oro ? '#f5d36b' : 'rgba(255,255,255,0.8)';
    c.fillText(oro ? '⚽ ¡GOL DE ORO!' : `${Math.floor(quedan / 60000)}:${String(Math.floor(quedan / 1000) % 60).padStart(2, '0')}`, W_FB / 2, 33);
    const falta = e.inicio - ahora;
    if (e.fase === 'jugando' && (falta > 0 || FB.golMarcado)) {
        c.font = 'bold 18px monospace'; c.fillStyle = '#fff';
        const quien = FB.golMarcado || (falta > 0 && e.ultimoGol);
        c.fillText(quien ? '¡GOOOL!' : String(Math.ceil(falta / 1000)), W_FB / 2, 70);
        if (quien) { c.font = 'bold 9px monospace'; c.fillText(quien === miIdentidad ? 'de vos' : `de ${nombreJugador(quien)}`, W_FB / 2, 84); }
    }
    c.textAlign = 'left';
    VivoComun.estado(c, W_FB, H_FB, FB.enlace, nombreJugador(miRival));
}
function bucleFb(ts){
    const pantalla = document.getElementById('pantalla-futbolcabezas');
    if (!pantalla || !pantalla.classList.contains('activa')) { pararFb(); return; }
    if (VivoComun.pausa('futbolcabezas')) { FB.ultimoTs = 0; dibujarFb(); VivoComun.cartelPausa(FB.ctx); FB.loop = requestAnimationFrame(bucleFb); return; }
    const dt = Math.min(2.5, (ts - (FB.ultimoTs || ts)) / 16.67 || 1);
    FB.ultimoTs = ts;
    pasoFb(dt);
    if (FB.enlace && FB.yo && Date.now() - FB.ultimoEnvio > 33) {
        FB.ultimoEnvio = Date.now();
        const m = { x: Math.round(FB.yo.x * 10) / 10, y: Math.round(FB.yo.y * 10) / 10, m: FB.yo.mira, c: FB.clave };
        if (FB.dueno && FB.pelota) Object.assign(m, { bx: +FB.pelota.x.toFixed(1), by: +FB.pelota.y.toFixed(1), bvx: +FB.pelota.vx.toFixed(2), bvy: +FB.pelota.vy.toFixed(2) });
        FB.enlace.enviar('p', m);
    }
    if (FB.estado && FB.estado.fase === 'jugando') VivoComun.cuenta('FB', FB.estado.inicio);
    dibujarFb();
    FB.loop = requestAnimationFrame(bucleFb);
}
function arrancarFb(){
    if (!FB.canvas) {
        FB.canvas = document.createElement('canvas');
        FB.canvas.width = W_FB * 2; FB.canvas.height = H_FB * 2;
        FB.canvas.className = 'lienzo-voley';
        FB.ctx = FB.canvas.getContext('2d');
        FB.controles = VivoComun.botones([[{ k: 'izq', txt: '◀' }, { k: 'der', txt: '▶' }], [{ k: 'patada', txt: '🦶', aria: 'Patear' }, { k: 'salto', txt: '⤒', clase: 'salto', aria: 'Saltar' }]], FB.teclas);
    }
    if (!FB.teclado) FB.teclado = VivoComun.teclado('pantalla-futbolcabezas', { ArrowLeft: 'izq', KeyA: 'izq', ArrowRight: 'der', KeyD: 'der', ArrowUp: 'salto', KeyW: 'salto', Space: 'patada', KeyS: 'patada', ArrowDown: 'patada' }, FB.teclas);
    if (!FB.enlace && !compuFb()) {
        FB.enlace = EnlaceVivo.conectar('futbolcabezas', {
            alMensaje(t, d) {
                if (d.c !== FB.clave) return;
                const b = FB.pelota;
                if (t === 'p') {
                    FB.el = VivoComun.recibir(FB.el, { x: d.x, y: d.y }); FB.el.mira = d.m;
                    if (d.bx != null && !FB.dueno && b && !FB.golMarcado) { b.x += (d.bx - b.x) * 0.5; b.y += (d.by - b.y) * 0.5; b.vx = d.bvx; b.vy = d.bvy; }
                }
                if (t === 'golpe' && b) { FB.dueno = false; Object.assign(b, { x: d.x, y: d.y, vx: d.vx, vy: d.vy }); if (window.sfx) window.sfx.toque(); }
                if (t === 'gol' && b && !FB.golMarcado) { FB.golMarcado = d.q; Object.assign(b, { x: d.x, y: d.y, vx: 0, vy: 0 }); vibrarJ([20, 40, 20]); if (window.sfx) window.sfx[d.q === miIdentidad ? 'punto' : 'error'](); }
            }
        });
    }
    if (!FB.loop) FB.loop = requestAnimationFrame(bucleFb);
    window._unsubLoopFutbolcabezas = pararFb;
}
function pararFb(){
    if (FB.loop) cancelAnimationFrame(FB.loop);
    FB.loop = null;
    if (FB.enlace) FB.enlace.cerrar();
    FB.enlace = null; Object.keys(FB.teclas).forEach(k => { FB.teclas[k] = false; });
}

const FutbolCabezas = JuegoTurnos.crear({
    id: 'futbolcabezas',
    sinTurno: true,
    emojiListo: '⚽',
    compu: { paso: () => null }, // la compu juega adentro del bucle (pensarCompuFb)
    intro: `Fútbol de cabezones, en vivo: corré con ◀ ▶, saltá con ⤒ y pateá con 🦶 (o cabeceala). Tu arco es el de la izquierda. Gana el primero en meter ${GOLES_FB}, o el que va ganando a los 2 minutos. Si van empatados, ¡gol de oro!`,
    inicial: () => { const inicio = window.ahoraSync() + 3000; return { goles: { nico: 0, carito: 0 }, saque: null, clave: Math.random().toString(36).slice(2, 7), inicio, finPartido: inicio + DURA_FB, turno: null }; },
    render(e) { return `<div id="futbolcabezas-host"></div><div class="texto-centro texto-tenue" style="font-size:0.75rem;">Tu arco es el de la izquierda. ${nombreJugador('nico')} ${e.goles.nico} — ${e.goles.carito} ${nombreJugador('carito')}</div>`; },
    alDibujar(cont, e) {
        FB.estado = e;
        const host = cont.querySelector('#futbolcabezas-host');
        if (!host) return;
        VivoComun.montar('futbolcabezas', FutbolCabezas, host, e);
        if (FB.clave !== e.clave) reiniciarFb(e);
        if (e.fase === 'jugando') { arrancarFb(); host.appendChild(FB.canvas); host.appendChild(FB.controles); }
        else if (FB.canvas) { host.appendChild(FB.canvas); dibujarFb(); }
    }
});
window._futbol = FB; // para pruebas
