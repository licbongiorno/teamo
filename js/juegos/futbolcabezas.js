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
const FB = { canvas: null, ctx: null, enlace: null, loop: null, estado: null, clave: null, yo: null, el: null, pelota: null, dueno: false, teclas: {}, ultimoEnvio: 0, ultimoTs: 0, golMarcado: null, ultimoToque: 0, patada: 0, cerrando: false, fx: null, tToque: 0, festejo: 0, red: null, estela: [], anim: {} };

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
    b.rot = (b.rot || 0) + b.vx * dt * 0.14;
    if (b.y > PISO_FB - R_PEL_FB) { if (b.vy > 2.2) b.pique = performance.now(); b.y = PISO_FB - R_PEL_FB; b.vy = -Math.abs(b.vy) * 0.62; b.vx *= 0.96; if (Math.abs(b.vy) < 0.6) b.vy = 0; }
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
    const toque = (quien, fuerte) => {
        const nuevo = Date.now() - FB.ultimoToque > 110;
        if (nuevo && window.sfx) window.sfx.toque();
        if (nuevo) efectoToqueFb(b, fuerte);
        const quienAnim = FB.anim[quien === miIdentidad ? 'yo' : 'el'];
        if (!fuerte && quienAnim) quienAnim.cabeceo = performance.now();
        FB.ultimoToque = Date.now();
        if (quien === miIdentidad) {
            FB.tToque = window.ahoraSync(); // misma escala que el sello de los mensajes
            // Siempre aviso mi toque: si los dos le pegamos casi a la vez, gana el más nuevo.
            if (!FB.dueno || nuevo) { FB.dueno = true; FB.enlace && FB.enlace.enviar('golpe', { x: b.x, y: b.y, vx: b.vx, vy: b.vy, k: fuerte ? 1 : 0, c: FB.clave }, true); }
        }
    };
    if (compu && FB.el) { if (chocarFb(FB.el, b)) toque(miRival); if (FB.el.patear) { FB.el.patear = false; FB.el.patada = Date.now(); if (patearFb(FB.el, b, miRival)) toque(miRival, true); } }
    if (chocarFb(s, b)) toque(miIdentidad);
    if (FB.teclas.patada && Date.now() - FB.patada > 350) {
        FB.patada = Date.now();
        if (patearFb(s, b, miIdentidad)) { toque(miIdentidad, true); vibrarJ(12); }
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
    // Se pone detrás de la pelota (del lado de su arco) para empujarla hacia el mío.
    // Si la pelota quedó entre ella y su arco, la saltea por arriba en vez de
    // llevársela por delante (si no, se hacía goles en contra).
    const meta = b.x - ataca * 16;
    const adelante = Math.sign(b.x - s.x) === ataca;
    const baja = b.y > PISO_FB - 34, dx = Math.abs(b.x - s.x);
    // Para saltearla salta con tiempo (pasa por arriba en lo más alto del salto);
    // si la pelota viene alta, espera a que baje en vez de llevársela puesta.
    let dir = Math.abs(meta - s.x) < 3 ? 0 : Math.sign(meta - s.x);
    if (!adelante && !baja && dx < 40 && s.y >= PISO_FB) dir = 0;
    const cerca = dx < 34;
    const saltear = !adelante && baja && dx < 48 && dx > 20;
    const salto = saltear || (cerca && adelante && b.y < PISO_FB - 40 && b.vy > -1 && Math.random() < n.salto * 0.2);
    moverJugadorFb(s, dir, salto, dt, n.vel);
    s.mira = ataca;
    if (cerca && Math.sign(b.x - s.x) === ataca && Math.random() < n.patea) s.patear = true;
}
function efectoToqueFb(b, fuerte){
    if (!FB.fx) return;
    const x = aPantallaFb(b.x), y = b.y;
    if (fuerte) { FB.fx.chispas(x, y, ['#fff', '#ffe58a', '#ffd23a'], 14); FB.fx.onda(x, y, { radio: 16, vida: 260 }); FB.fx.temblor(2, 160); }
    else { FB.fx.chispas(x, y, ['#fff', '#cfe6ff'], 6); FB.fx.onda(x, y, { radio: 10, vida: 220, color: 'rgba(255,255,255,0.6)' }); }
}
function efectoGolFb(quien, b){
    FB.festejo = performance.now();
    const lado = b.x < W_FB / 2 ? 0 : 1, xs = aPantallaFb(lado ? W_FB - ARCO_ANCHO_FB / 2 : ARCO_ANCHO_FB / 2);
    FB.red = { x: xs, y: b.y, t: performance.now(), lado: aPantallaFb(lado ? W_FB : 0) > W_FB / 2 ? 1 : 0 };
    if (!FB.fx) return;
    FB.fx.confeti(xs, ARCO_ALTO_FB + 10, 46);
    FB.fx.confeti(W_FB / 2, 40, 30);
    FB.fx.temblor(5, 420);
    FB.fx.flash(quien === miIdentidad ? 'rgba(120,200,255,0.35)' : 'rgba(255,120,150,0.35)', 220);
    FB.fx.texto(W_FB / 2, 72, '¡GOOOL!', { tam: 26, color: quien === 'nico' ? '#9fd0ff' : '#ffb3c6', vida: 1500, sube: 6 });
}
async function marcarGolFb(quien){
    if (FB.golMarcado) return;
    FB.golMarcado = quien;
    efectoGolFb(quien, FB.pelota);
    FB.enlace && FB.enlace.enviar('gol', { q: quien, x: FB.pelota.x, y: FB.pelota.y, c: FB.clave }, true);
    vibrarJ([20, 40, 20]);
    if (!(window.sonarArcade && sonarArcade('gol')) && window.sfx) window.sfx[quien === miIdentidad ? 'punto' : 'error']();
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
// Estado de animación de cada cabezón (sale de cómo se mueve en pantalla,
// así el mío y el del otro se animan igual).
function animarFb(clave, x, y, ahora){
    const a = FB.anim[clave] || (FB.anim[clave] = { x, y, paso: 0, aire: false, aterrizo: 0, salto: 0, vx: 0 });
    const vx = x - a.x, enAire = y < PISO_FB - 0.5;
    a.vx = a.vx * 0.6 + vx * 0.4;
    if (!enAire) a.paso += Math.abs(a.vx) * 0.32;
    if (a.aire && !enAire) { a.aterrizo = ahora; FB.fx && FB.fx.polvo(x, PISO_FB, 'rgba(210,235,190,0.8)', 7); }
    if (!a.aire && enAire) a.salto = ahora;
    // Polvito al arrancar a correr fuerte.
    if (!enAire && Math.abs(a.vx) > 2.2 && Math.random() < 0.12 && FB.fx) FB.fx.polvo(x - Math.sign(a.vx) * 8, PISO_FB, 'rgba(210,235,190,0.6)', 1);
    a.aire = enAire; a.x = x; a.y = y;
    return a;
}
function dibujarFb(){
    const c = FB.ctx, e = FB.estado;
    if (!c || !e) return;
    const ahora = performance.now(), tAnim = ahora / 1000;
    c.setTransform(2, 0, 0, 2, 0, 0);
    if (FB.fx) FB.fx.antes(c);
    const cielo = c.createLinearGradient(0, 0, 0, PISO_FB); cielo.addColorStop(0, '#141d44'); cielo.addColorStop(0.55, '#2c4a86'); cielo.addColorStop(1, '#4f74b4');
    c.fillStyle = cielo; c.fillRect(-10, -10, W_FB + 20, H_FB + 20);
    // Reflectores con halo
    for (const lx of [26, W_FB - 26]) {
        const g = c.createRadialGradient(lx, 12, 1, lx, 12, 60); g.addColorStop(0, 'rgba(255,255,220,0.55)'); g.addColorStop(1, 'rgba(255,255,220,0)');
        c.fillStyle = g; c.fillRect(lx - 60, -40, 120, 110);
        c.fillStyle = '#fffbe0'; c.fillRect(lx - 9, 8, 18, 6); c.fillStyle = '#8a8fa8'; c.fillRect(lx - 1, 14, 2, 40);
    }
    // Tribuna: la gente salta cuando hay gol y se mueve sola de a ratos.
    const festejo = Math.max(0, 1 - (ahora - FB.festejo) / 2200);
    c.fillStyle = 'rgba(20,24,50,0.55)'; c.fillRect(0, 44, W_FB, 64);
    const coloresHinchas = ['#3d8bfd', '#e8496b', '#f5d36b', '#ffffff', '#7ad36b'];
    for (let i = 0; i < 64; i++) {
        const fila = i % 4, x = (i * 23 + fila * 11) % W_FB + 4, base = 54 + fila * 14;
        const salto = Math.max(0, Math.sin(tAnim * (5 + (i % 3)) + i)) * (1.2 + festejo * 7);
        c.fillStyle = coloresHinchas[i % coloresHinchas.length]; c.globalAlpha = 0.55 + fila * 0.1;
        c.beginPath(); c.arc(x, base - salto, 3, 0, Math.PI * 2); c.fill();
        c.fillRect(x - 3, base - salto + 2, 6, 5);
        if (festejo > 0.2 && i % 2) { c.fillRect(x - 5, base - salto - 5, 2, 5); c.fillRect(x + 3, base - salto - 5, 2, 5); }
    }
    c.globalAlpha = 1;
    // Pasto a rayas con brillo
    for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? '#3fae4f' : '#48bd59'; c.fillRect(i * W_FB / 8, PISO_FB, W_FB / 8, H_FB - PISO_FB); }
    c.fillStyle = 'rgba(255,255,255,0.12)'; c.fillRect(0, PISO_FB, W_FB, 2);
    c.fillStyle = 'rgba(255,255,255,0.7)'; c.fillRect(W_FB / 2 - 0.5, PISO_FB, 1, H_FB - PISO_FB);
    c.strokeStyle = 'rgba(255,255,255,0.45)'; c.lineWidth = 1; c.beginPath(); c.ellipse(W_FB / 2, PISO_FB + 10, 26, 6, 0, 0, Math.PI * 2); c.stroke();
    // Arcos: la red se infla donde entró la pelota.
    for (const ladoPant of [0, 1]) {
        const x0 = ladoPant ? W_FB - ARCO_ANCHO_FB : 0;
        const inflado = FB.red && FB.red.lado === ladoPant ? Math.max(0, 1 - (ahora - FB.red.t) / 700) : 0;
        c.fillStyle = 'rgba(255,255,255,0.1)'; c.fillRect(x0, ARCO_ALTO_FB, ARCO_ANCHO_FB, PISO_FB - ARCO_ALTO_FB);
        c.strokeStyle = 'rgba(255,255,255,0.4)'; c.lineWidth = 0.5;
        const fondo = ladoPant ? W_FB : 0, dirFondo = ladoPant ? 1 : -1;
        for (let y = ARCO_ALTO_FB + 6; y < PISO_FB; y += 6) {
            const bulto = inflado ? inflado * 7 * Math.exp(-Math.pow((y - FB.red.y) / 18, 2)) * Math.sin((ahora - FB.red.t) / 60) : 0;
            c.beginPath(); c.moveTo(x0 + (ladoPant ? 0 : 0), y); c.quadraticCurveTo(x0 + ARCO_ANCHO_FB / 2, y + bulto * 0.3, fondo - dirFondo * (2 - Math.abs(bulto)), y); c.stroke();
        }
        for (let x = 4; x < ARCO_ANCHO_FB; x += 5) { c.beginPath(); c.moveTo(x0 + x, ARCO_ALTO_FB); c.lineTo(x0 + x + (inflado ? dirFondo * inflado * 2 : 0), PISO_FB); c.stroke(); }
        c.fillStyle = '#fff'; c.fillRect(x0, ARCO_ALTO_FB - 2, ARCO_ANCHO_FB, 3);
        c.fillRect(ladoPant ? x0 : ARCO_ANCHO_FB - 2, ARCO_ALTO_FB - 2, 2, PISO_FB - ARCO_ALTO_FB + 2);
    }
    const b = FB.pelota, pb = b ? VivoComun.posBola(b) : null;
    if (pb) { const alto = Math.max(0, PISO_FB - pb[1]); c.fillStyle = `rgba(0,0,0,${Math.max(0.06, 0.28 - alto / 600)})`; c.beginPath(); c.ellipse(aPantallaFb(pb[0]), PISO_FB + 2, 6 + alto / 40, 1.8, 0, 0, Math.PI * 2); c.fill(); }
    const cabezon = (clave, s, piel, camiseta, pelo, short) => {
        if (!s) return;
        const x = aPantallaFb(s.x), y = s.y, mira = (espejoFb() ? -1 : 1) * (s.mira || 1);
        const a = animarFb(clave, x, y, ahora);
        // Estirarse al saltar y aplastarse al caer.
        const caer = Math.max(0, 1 - (ahora - a.aterrizo) / 180), subir = a.aire ? Math.min(1, Math.max(0, 1 - (ahora - a.salto) / 260)) : 0;
        const ex = 1 + caer * 0.18 - subir * 0.08, ey = 1 - caer * 0.16 + subir * 0.1;
        const pateando = Date.now() - (s.patada || 0) < 220;
        c.fillStyle = 'rgba(0,0,0,0.25)'; c.beginPath(); c.ellipse(x, PISO_FB + 2, 12 * (1 - (PISO_FB - y) / 160), 2.5, 0, 0, Math.PI * 2); c.fill();
        c.save(); c.translate(x, y); c.scale(ex, ey);
        // Piernas: ciclo de carrera, encogidas en el aire, una estirada al patear.
        const ciclo = Math.sin(a.paso), quieto = Math.abs(a.vx) < 0.2 && !a.aire;
        const pierna = (lado, fase) => {
            let ang = quieto ? 0 : fase * 0.7;
            if (a.aire) ang = lado * 0.5;
            if (pateando && lado === 1) ang = -1.3 * mira * (1 - (Date.now() - s.patada) / 220) - 0.2 * mira;
            c.save(); c.translate(lado * 3, -6); c.rotate(pateando && lado === 1 ? ang : ang * mira);
            c.fillStyle = short; c.fillRect(-2.5, 0, 5, 3);
            c.fillStyle = piel; c.fillRect(-1.5, 3, 3, 2);
            c.fillStyle = '#1d1d24'; c.fillRect(mira > 0 ? -2 : -3, 5, 5, 2.4);
            c.restore();
        };
        pierna(-1, ciclo); pierna(1, -ciclo);
        // Cuerpito con número
        c.fillStyle = camiseta; c.beginPath(); c.roundRect ? c.roundRect(-6.5, -14, 13, 9, 3) : c.rect(-6.5, -14, 13, 9); c.fill();
        c.fillStyle = 'rgba(255,255,255,0.85)'; c.font = 'bold 5px monospace'; c.textAlign = 'center'; c.fillText(clave === 'yo' ? '10' : '9', 0, -7.5);
        // Bracitos que se balancean
        c.strokeStyle = piel; c.lineWidth = 2; c.lineCap = 'round';
        c.beginPath(); c.moveTo(-6, -12); c.lineTo(-9, -8 + (quieto ? 0 : ciclo * 2) - subir * 4); c.stroke();
        c.beginPath(); c.moveTo(6, -12); c.lineTo(9, -8 - (quieto ? 0 : ciclo * 2) - subir * 4); c.stroke();
        c.restore();
        // Cabeza (se aplasta un poquito al cabecear)
        const h = cabezaFb(s), hy = h.y, cabeceo = Math.max(0, 1 - (ahora - (a.cabeceo || 0)) / 160);
        const bal = quieto ? Math.sin(tAnim * 2.2 + (clave === 'yo' ? 0 : 1)) * 0.6 : Math.sin(a.paso * 2) * 0.8;
        c.save(); c.translate(x, hy + bal); c.scale(1 + cabeceo * 0.12, 1 - cabeceo * 0.12);
        const gc = c.createRadialGradient(-5, -6, 2, 0, 0, R_CAB + 2); gc.addColorStop(0, '#fff3e6'); gc.addColorStop(0.35, piel); gc.addColorStop(1, '#c98f68');
        c.fillStyle = gc; c.beginPath(); c.arc(0, 0, R_CAB, 0, Math.PI * 2); c.fill();
        c.fillStyle = pelo; c.beginPath(); c.arc(0, -3, R_CAB, Math.PI * 1.02, Math.PI * 1.98); c.fill();
        c.beginPath(); c.arc(-mira * 9, -9, 5, 0, Math.PI * 2); c.fill();
        // Oreja
        c.fillStyle = piel; c.beginPath(); c.arc(-mira * 11, 1, 3, 0, Math.PI * 2); c.fill();
        // Ojo que sigue a la pelota y parpadea
        const parpadeo = (Math.floor(tAnim * 10) + (clave === 'yo' ? 0 : 17)) % 37 === 0;
        c.fillStyle = '#fff'; c.beginPath(); c.ellipse(mira * 6, -1, 4.2, parpadeo ? 0.6 : 4.2, 0, 0, Math.PI * 2); c.fill();
        if (pb && !parpadeo) { const ang = Math.atan2(pb[1] - (hy - 1), aPantallaFb(pb[0]) - (x + mira * 6)); c.fillStyle = '#2a1f33'; c.beginPath(); c.arc(mira * 6 + Math.cos(ang) * 1.8, -1 + Math.sin(ang) * 1.8, 2.1, 0, Math.PI * 2); c.fill(); c.fillStyle = '#fff'; c.fillRect(mira * 6 + Math.cos(ang) * 1.8 - 0.4, -2 + Math.sin(ang) * 1.8, 1, 1); }
        // Ceja y boca según cómo va: contento si hizo el último gol, triste si se lo hicieron.
        const ultimo = FB.golMarcado || e.ultimoGol, yoSoy = clave === 'yo' ? miIdentidad : miRival;
        const animo = ultimo && (FB.golMarcado || ahora - FB.festejo < 3000) ? (ultimo === yoSoy ? 1 : -1) : 0;
        c.strokeStyle = '#4a2a1a'; c.lineWidth = 1.2;
        c.beginPath(); c.moveTo(mira * 3, -7 - (animo < 0 ? -1 : 0)); c.lineTo(mira * 9, -7 + (animo < 0 ? -1.5 : 0)); c.stroke();
        c.strokeStyle = '#7a3b2e';
        c.beginPath();
        if (animo > 0) { c.fillStyle = '#7a3b2e'; c.arc(mira * 4, 6, 3.6, 0, Math.PI); c.fill(); }
        else if (animo < 0) c.arc(mira * 4, 9, 3, Math.PI + 0.3, -0.3);
        else c.arc(mira * 4, 5.5, 3.2, 0.3, Math.PI - 0.3);
        c.stroke();
        // Cachetes
        c.fillStyle = 'rgba(255,120,120,0.25)'; c.beginPath(); c.arc(mira * 9, 4, 2.6, 0, Math.PI * 2); c.fill();
        c.restore();
    };
    const colYo = miIdentidad === 'nico' ? ['#f2c9a0', '#3d8bfd', '#5a3a22', '#1f4fa8'] : ['#f6d2b4', '#e8496b', '#2b1a12', '#a8243f'];
    const colEl = miIdentidad === 'nico' ? ['#f6d2b4', '#e8496b', '#2b1a12', '#a8243f'] : ['#f2c9a0', '#3d8bfd', '#5a3a22', '#1f4fa8'];
    const o = FB.el;
    if (o) { const p = o.bot ? [o.x, o.y] : VivoComun.suave(o); if (p) cabezon('el', { x: p[0], y: Math.min(PISO_FB, p[1]), mira: o.mira, patada: o.patada }, ...colEl); }
    cabezon('yo', { ...FB.yo, patada: FB.patada }, ...colYo);
    if (pb) {
        const x = aPantallaFb(pb[0]), y = pb[1], vel = Math.hypot(b.vx, b.vy);
        // Estela cuando va rápido
        FB.estela.push({ x, y }); if (FB.estela.length > 7) FB.estela.shift();
        if (vel > 5) FB.estela.forEach((q, k) => { c.globalAlpha = k / FB.estela.length * 0.35; c.fillStyle = '#fff'; c.beginPath(); c.arc(q.x, q.y, R_PEL_FB * (0.5 + k / 14), 0, Math.PI * 2); c.fill(); });
        c.globalAlpha = 1;
        const aplasta = Math.max(0, 1 - (ahora - (b.pique || 0)) / 140);
        c.save(); c.translate(x, y + aplasta * 2); c.scale(1 + aplasta * 0.25, 1 - aplasta * 0.25); c.rotate((espejoFb() ? -1 : 1) * (b.rot || 0));
        const gb = c.createRadialGradient(-2, -3, 1, 0, 0, R_PEL_FB); gb.addColorStop(0, '#ffffff'); gb.addColorStop(1, '#d9dde6');
        c.fillStyle = gb; c.beginPath(); c.arc(0, 0, R_PEL_FB, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#2a1f33';
        c.beginPath(); for (let k = 0; k < 5; k++) { const ang = k * Math.PI * 0.4 - Math.PI / 2; c.lineTo(Math.cos(ang) * 2.6, Math.sin(ang) * 2.6); } c.closePath(); c.fill();
        for (let k = 0; k < 5; k++) { const ang = k * Math.PI * 0.4 - Math.PI / 2; c.beginPath(); c.arc(Math.cos(ang) * 5.6, Math.sin(ang) * 5.6, 1.5, 0, Math.PI * 2); c.fill(); }
        c.restore();
    }
    if (FB.fx) FB.fx.dibujar(c);
    // Marcador y reloj
    const yo = e.goles[miIdentidad], el = e.goles[miRival];
    const popGol = FB.festejo ? FxVivo.rebote(Math.min(1, (ahora - FB.festejo) / 500)) : 1;
    c.fillStyle = 'rgba(10,12,30,0.6)'; c.beginPath(); c.roundRect ? c.roundRect(W_FB / 2 - 56, 3, 112, 22, 7) : c.rect(W_FB / 2 - 56, 3, 112, 22); c.fill();
    const colMio = miIdentidad === 'nico' ? '#3d8bfd' : '#e8496b', colSuyo = miIdentidad === 'nico' ? '#e8496b' : '#3d8bfd';
    c.fillStyle = colMio; c.fillRect(W_FB / 2 - 54, 5, 4, 18); c.fillStyle = colSuyo; c.fillRect(W_FB / 2 + 50, 5, 4, 18);
    c.save(); c.translate(W_FB / 2, 14); c.scale(popGol, popGol);
    c.fillStyle = '#fff'; c.font = 'bold 14px monospace'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(`${yo}  -  ${el}`, 0, 1);
    c.restore();
    c.textBaseline = 'alphabetic';
    const ahoraJ = VivoComun.reloj('futbolcabezas'), quedan = Math.max(0, finPartidoFb(e) - Math.max(ahoraJ, e.inicio));
    c.font = 'bold 8px monospace'; c.textAlign = 'center';
    const oro = e.fase === 'jugando' && ahoraJ >= finPartidoFb(e);
    c.fillStyle = oro ? '#f5d36b' : quedan < 10000 ? '#ff8fa3' : 'rgba(255,255,255,0.85)';
    c.fillText(oro ? '⚽ ¡GOL DE ORO!' : `${Math.floor(quedan / 60000)}:${String(Math.floor(quedan / 1000) % 60).padStart(2, '0')}`, W_FB / 2, 34);
    const falta = e.inicio - ahoraJ;
    if (e.fase === 'jugando' && falta > 0 && !FB.golMarcado && !(e.ultimoGol && ahora - FB.festejo < 1600)) {
        // Cuenta regresiva: cada número salta al aparecer.
        const n = Math.ceil(falta / 1000), k = 1 - (falta % 1000) / 1000;
        c.save(); c.translate(W_FB / 2, 76); c.scale(FxVivo.rebote(Math.min(1, k * 3)), FxVivo.rebote(Math.min(1, k * 3)));
        c.font = 'bold 30px monospace'; c.fillStyle = '#fff'; c.strokeStyle = 'rgba(10,12,30,0.7)'; c.lineWidth = 4; c.textBaseline = 'middle';
        c.strokeText(String(n), 0, 0); c.fillText(String(n), 0, 0);
        c.restore(); c.textBaseline = 'alphabetic';
    } else if (falta > 0 && e.ultimoGol && !FB.golMarcado) {
        c.font = 'bold 9px monospace'; c.fillStyle = '#fff'; c.fillText(e.ultimoGol === miIdentidad ? 'Gol tuyo · saca el otro' : `Gol de ${nombreJugador(e.ultimoGol)} · sacás vos`, W_FB / 2, 92);
    }
    c.textAlign = 'left';
    if (FB.fx) FB.fx.despues(c);
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
        const m = { x: Math.round(FB.yo.x * 10) / 10, y: Math.round(FB.yo.y * 10) / 10, m: FB.yo.mira, k: FB.patada, c: FB.clave };
        if (FB.dueno && FB.pelota) Object.assign(m, { bx: +FB.pelota.x.toFixed(1), by: +FB.pelota.y.toFixed(1), bvx: +FB.pelota.vx.toFixed(2), bvy: +FB.pelota.vy.toFixed(2) });
        FB.enlace.enviar('p', m);
    }
    if (FB.estado && FB.estado.fase === 'jugando') VivoComun.cuenta('FB', FB.estado.inicio);
    dibujarFb();
    FB.loop = requestAnimationFrame(bucleFb);
}
function arrancarFb(){
    FB.fx = FB.fx || FxVivo.crear();
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
            alMensaje(t, d, s) {
                if (d.c !== FB.clave) return;
                const b = FB.pelota;
                if (t === 'p') {
                    FB.el = VivoComun.recibir(FB.el, { x: d.x, y: d.y }); FB.el.mira = d.m;
                    if (d.k && FB.el.k !== d.k) FB.el.patada = Date.now();
                    FB.el.k = d.k;
                    if (d.bx != null && !FB.dueno && b && !FB.golMarcado) VivoComun.adelantar(b, { x: d.bx, y: d.by, vx: d.bvx, vy: d.bvy }, moverPelotaFb);
                }
                if (t === 'golpe' && b) {
                    // Si yo la toqué después que el otro, sigo mandando yo (el otro recibe mi toque y cede).
                    if (FB.dueno && s && FB.tToque > s) return;
                    FB.dueno = false;
                    VivoComun.adelantar(b, { x: d.x, y: d.y, vx: d.vx, vy: d.vy }, moverPelotaFb);
                    if (window.sfx) window.sfx.toque();
                    efectoToqueFb(b, !!d.k);
                    if (d.k && FB.el) FB.el.patada = Date.now();
                    else if (FB.anim.el) FB.anim.el.cabeceo = performance.now();
                }
                if (t === 'gol' && b && !FB.golMarcado) { FB.golMarcado = d.q; Object.assign(b, { x: d.x, y: d.y, vx: 0, vy: 0 }); efectoGolFb(d.q, b); vibrarJ([20, 40, 20]); if (window.sfx) window.sfx[d.q === miIdentidad ? 'punto' : 'error'](); }
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
