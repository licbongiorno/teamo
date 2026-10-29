// ==================== CARRERA DE OBSTÁCULOS (en vivo) ====================
// Estilo "Fall Guys" en 2D, de costado: los dos corren a la vez por la
// misma pista (sale de una semilla), cada uno en su celu y viendo al otro
// como un fantasmita. Pozos, escalones, martillos que bajan, plataformas que
// se caen, resortes y las puertas falsas (¡sólo una de las tres se abre!).
// Gana el primero que llega a la meta. Usa js/plataformas-comun.js.
const T_OB = 16, FILAS_OB = 14, VISTA_OB = 20, ANCHO_OB = 11, ALTO_OB = 15, PISO_OB = 11;
const OB = { canvas: null, ctx: null, enlace: null, loop: null, estado: null, clave: null, mapa: null, ancho: 0, martillos: [], meta: 0, yo: null, el: null, teclas: {}, camara: 0, caidas: {}, revelados: new Set(), control: 0, muriendo: false, llegue: false, ultimoEnvio: 0, ultimoTs: 0 , fx: null, anim: {}, vistosCaer: new Set(), resorteT: {}, banderaT: 0};

function rngOb(semilla){ let a = semilla >>> 0; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
// Arma la pista con tramos al azar (los mismos para los dos).
function armarPistaOb(semilla){
    const r = rngOb(semilla), cols = [], martillos = [], controles = [0];
    const col = () => Array.from({ length: FILAS_OB }, (_, y) => (y >= PISO_OB ? '#' : '.'));
    const llano = (n) => { for (let i = 0; i < n; i++) cols.push(col()); };
    const tramos = {
        hueco() { llano(2); const n = 2 + Math.floor(r() * 2); for (let i = 0; i < n; i++) { const c = col(); c[11] = c[12] = c[13] = '.'; cols.push(c); } llano(3); },
        escalones() { llano(1); [1, 2, 3, 3, 2, 1].forEach(h => { const c = col(); for (let y = PISO_OB - h; y < PISO_OB; y++) c[y] = '#'; cols.push(c); }); llano(2); },
        martillos() { llano(2); for (let k = 0; k < 2; k++) { martillos.push({ x: cols.length * T_OB, w: 2 * T_OB, fase: r() * 6.28, vel: 1.6 + r() * 0.8 }); llano(5); } },
        caen() { llano(2); const n = 6 + Math.floor(r() * 3); for (let i = 0; i < n; i++) { const c = col(); c[11] = c[12] = c[13] = '.'; c[9] = 'Q'; cols.push(c); } llano(2); },
        resortes() { llano(2); const c = col(); c[10] = 'R'; cols.push(c); for (let i = 0; i < 4; i++) { const m = col(); for (let y = 6; y < PISO_OB; y++) m[y] = '#'; cols.push(m); } llano(3); },
        puertas() {
            llano(1);
            // Escalera de plataformas para llegar a las puertas de arriba.
            const a = col(); a[8] = '='; cols.push(a); const b = col(); b[8] = '='; b[5] = '='; cols.push(b); const b2 = col(); b2[5] = '='; cols.push(b2);
            const real = Math.floor(r() * 3), muro = col();
            for (let y = 0; y < PISO_OB; y++) muro[y] = '#';
            [10, 7, 4].forEach((y, i) => { muro[y] = i === real ? 'D' : 'X'; });
            cols.push(muro); llano(3);
        },
    };
    llano(6);
    const nombres = Object.keys(tramos);
    let ultimo = null;
    for (let k = 0; k < 9; k++) {
        let n; do { n = nombres[Math.floor(r() * nombres.length)]; } while (n === ultimo);
        ultimo = n;
        controles.push(cols.length);
        tramos[n]();
    }
    const meta = cols.length + 2;
    llano(8);
    const mapa = Array.from({ length: FILAS_OB }, (_, y) => cols.map(c => c[y]).join(''));
    return { mapa, martillos, meta: meta * T_OB, controles: controles.map(x => x * T_OB) };
}
const celdaOb = (x, y) => (y < 0 ? '.' : y >= FILAS_OB ? '.' : x < 0 ? '#' : x >= OB.ancho ? '#' : OB.mapa[y][x]);
function caidaOb(x, y){
    const t = OB.caidas[x + ',' + y];
    if (!t) return 0;
    const d = VivoComun.reloj('obstaculos') - t;
    return d < 500 ? 1 : d < 3000 ? 2 : 0;
}
function solidoOb(x, y){
    const c = celdaOb(x, y);
    if (c === '#' || c === '=' || c === 'X') return true;
    if (c === 'Q') return caidaOb(x, y) !== 2;
    return false;
}
// Martillo: baja y sube con el reloj compartido (igual en los dos celus).
function posMartilloOb(m){
    const t = (VivoComun.reloj('obstaculos') - (OB.estado ? OB.estado.inicio : 0)) / 1000;
    const baja = Math.max(0, Math.sin(t * m.vel + m.fase)) ** 0.6;
    return { x: m.x, y: -2 * T_OB + baja * (PISO_OB * T_OB - 3 * T_OB + 2 * T_OB), w: m.w, h: 3 * T_OB };
}
function reiniciarOb(e){
    OB.clave = e.clave;
    const p = armarPistaOb(e.semilla || 1);
    OB.mapa = p.mapa; OB.ancho = p.mapa[0].length; OB.martillos = p.martillos; OB.meta = p.meta; OB.tramos = p.controles;
    OB.yo = { x: 2 * T_OB + (miIdentidad === 'nico' ? 0 : 10), y: (PISO_OB - 1) * T_OB, vx: 0, vy: 0, suelo: false, dir: 1 };
    OB.el = null; OB.anim = {}; if (OB.fx) OB.fx.limpiar(); OB.caidas = {}; OB.revelados = new Set(); OB.control = 0; OB.muriendo = false; OB.llegue = false; OB.camara = 0;
}
function pasoOb(dt){
    const e = OB.estado, p = OB.yo;
    if (!e || e.fase !== 'jugando' || !p || OB.muriendo || OB.llegue || VivoComun.reloj('obstaculos') < e.inicio) return;
    const cajas = OB.martillos.map(posMartilloOb);
    Plataformas.mover(p, dt, OB.teclas, { T: T_OB, ancho: ANCHO_OB, alto: ALTO_OB, esSolido: solidoOb, cajas, otro: null, alEmpujar: () => 0, vel: 2.1 });
    // Martillo encima: te tira para atrás.
    for (const m of cajas) if (Plataformas.solape({ x: p.x, y: p.y, w: ANCHO_OB, h: ALTO_OB }, m)) { p.x = m.x - ANCHO_OB - 4; p.vx = -2.5; p.vy = -3; vibrarJ(20); if (window.sfx) window.sfx.golpe(); if (OB.fx && Date.now() - (OB.golpeT || 0) > 400) { OB.golpeT = Date.now(); OB.fx.estrellitas(p.x + ANCHO_OB / 2, p.y, 8); OB.fx.texto(p.x + ANCHO_OB / 2, p.y - 8, '¡Pum!', { tam: 11, color: '#ffd23a' }); OB.fx.temblor(4, 260); } }
    if (p.x < 0) p.x = 0;
    const x0 = Math.floor((p.x + 1) / T_OB), x1 = Math.floor((p.x + ANCHO_OB - 2) / T_OB), yPie = Math.floor((p.y + ALTO_OB + 1) / T_OB);
    if (p.suelo) for (const x of [x0, x1]) {
        const c = celdaOb(x, yPie);
        if (c === 'Q' && !caidaOb(x, yPie)) OB.caidas[x + ',' + yPie] = VivoComun.reloj('obstaculos');
        if (c === 'R' || celdaOb(x, yPie - 1) === 'R') { p.vy = -10.5; p.suelo = false; if (window.sfx) window.sfx.rebote(); resorteOb(x, c === 'R' ? yPie : yPie - 1, p); }
    }
    // Resorte también si lo piso (está arriba del piso)
    for (const x of [x0, x1]) if (celdaOb(x, Math.floor((p.y + ALTO_OB - 1) / T_OB)) === 'R' && p.vy >= 0) { p.vy = -10.5; p.suelo = false; if (window.sfx) window.sfx.rebote(); resorteOb(x, Math.floor((p.y + ALTO_OB - 1) / T_OB), p); }
    // Puerta falsa: si la empujo, se ve que era de mentira.
    const yMedio = Math.floor((p.y + ALTO_OB / 2) / T_OB);
    for (const x of [Math.floor((p.x + ANCHO_OB + 1) / T_OB), Math.floor((p.x - 1) / T_OB)]) if (celdaOb(x, yMedio) === 'X' && !OB.revelados.has(x + ',' + yMedio)) { OB.revelados.add(x + ',' + yMedio); vibrarJ(15); if (window.sfx) window.sfx.error(); if (OB.fx) { OB.fx.particulas({ x: x * T_OB + T_OB / 2, y: yMedio * T_OB + 8, n: 12, color: ['#ffd23a', '#e8496b', '#fff'], vel: 2, vida: 500, forma: 'cuadro' }); OB.fx.texto(x * T_OB + T_OB / 2, yMedio * T_OB - 4, '¡Falsa!', { tam: 10, color: '#ff8fa3' }); } }
    // Banderines de control
    for (let i = OB.tramos.length - 1; i > OB.control; i--) if (p.x >= OB.tramos[i]) { OB.control = i; OB.banderaT = performance.now(); if (OB.fx) { OB.fx.texto(OB.tramos[i] + 8, PISO_OB * T_OB - 40, '¡Control! 🚩', { tam: 10, color: '#fff' }); OB.fx.estrellitas(OB.tramos[i] + 8, PISO_OB * T_OB - 30, 6); } break; }
    if (p.y > FILAS_OB * T_OB) caerOb();
    if (p.x >= OB.meta) llegarOb();
}
function resorteOb(x, y, p){
    OB.resorteT[x + ',' + y] = performance.now();
    if (!OB.fx) return;
    OB.fx.texto(p.x + ANCHO_OB / 2, p.y - 6, '¡Boing!', { tam: 11, color: '#ffd23a' });
    OB.fx.polvo(x * T_OB + T_OB / 2, (y + 1) * T_OB - 4, 'rgba(255,255,255,0.8)', 6);
}
function caerOb(){
    if (OB.muriendo) return;
    if (OB.fx && OB.yo) { OB.fx.texto(OB.yo.x + ANCHO_OB / 2, FILAS_OB * T_OB - 30, '¡Uy!', { tam: 14, color: '#fff' }); OB.fx.temblor(3, 240); }
    OB.muriendo = true;
    vibrarJ([30, 30]);
    if (window.sfx) window.sfx.error();
    setTimeout(() => { Object.assign(OB.yo, { x: OB.tramos[OB.control] + 4, y: (PISO_OB - 2) * T_OB, vx: 0, vy: 0 }); OB.muriendo = false; }, 600);
}
async function llegarOb(){
    if (OB.llegue) return;
    OB.llegue = true;
    const clave = OB.clave, quien = miIdentidad, tiempo = VivoComun.reloj('obstaculos') - OB.estado.inicio;
    if (window.sfx) window.sfx.victoria();
    if (OB.fx && OB.yo) { OB.fx.confeti(OB.yo.x, OB.yo.y - 20, 60); OB.fx.estrellitas(OB.yo.x, OB.yo.y, 12); }
    OB.enlace && OB.enlace.enviar('meta', { c: clave }, true);
    await Obstaculos.accionEnCola((e) => e.clave !== clave ? null : { ganador: quien, motivo: `${nombreJugador(quien)} llegó primero en ${(tiempo / 1000).toFixed(1)} s` });
}
function dibujarOb(){
    const c = OB.ctx, e = OB.estado;
    if (!c || !e || !OB.mapa) return;
    const W = VISTA_OB * T_OB, H = FILAS_OB * T_OB, t = Date.now();
    if (OB.yo) OB.camara += (Math.max(0, Math.min(OB.ancho * T_OB - W, OB.yo.x - W * 0.35)) - OB.camara) * 0.2;
    const cam = Math.round(OB.camara), pt = performance.now();
    if (OB.fx) OB.fx.antes(c);
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#ff8fd0'); g.addColorStop(0.6, '#ffc4ea'); g.addColorStop(1, '#ffe6f6');
    c.fillStyle = g; c.fillRect(-10, -10, W + 20, H + 20);
    // Fondo con capas que se mueven distinto (profundidad)
    c.fillStyle = 'rgba(255,255,255,0.55)'; for (let i = 0; i < 6; i++) { const x = ((i * 97 - cam * 0.2 + pt / 120) % (W + 60) + W + 60) % (W + 60) - 30; c.beginPath(); c.arc(x, 26 + (i % 3) * 16, 9, 0, Math.PI * 2); c.arc(x + 11, 26 + (i % 3) * 16, 12, 0, Math.PI * 2); c.arc(x + 22, 28 + (i % 3) * 16, 8, 0, Math.PI * 2); c.fill(); }
    c.fillStyle = 'rgba(200,120,220,0.35)'; c.beginPath(); c.moveTo(0, H); for (let x = 0; x <= W; x += 10) c.lineTo(x, 120 + Math.sin((x + cam * 0.35) / 40) * 14); c.lineTo(W, H); c.fill();
    c.fillStyle = 'rgba(160,90,200,0.35)'; c.beginPath(); c.moveTo(0, H); for (let x = 0; x <= W; x += 10) c.lineTo(x, 140 + Math.sin((x + cam * 0.55) / 26 + 2) * 10); c.lineTo(W, H); c.fill();
    // Confeti de fondo que cae despacio
    for (let i = 0; i < 14; i++) { const x = ((i * 53 - cam * 0.4) % W + W) % W, y = ((i * 37 + pt / 30) % (H + 20)) - 10; c.fillStyle = ['#ffd23a', '#5aa9ff', '#4cd18a', '#fff'][i % 4]; c.globalAlpha = 0.5; c.fillRect(x, y, 2, 3); } c.globalAlpha = 1;
    const x0 = Math.floor(cam / T_OB), x1 = x0 + VISTA_OB + 1;
    for (let y = 0; y < FILAS_OB; y++) for (let x = x0; x <= x1; x++) {
        const ch = celdaOb(x, y), px = x * T_OB - cam, py = y * T_OB;
        if (ch === '#') { c.fillStyle = y === PISO_OB || celdaOb(x, y - 1) !== '#' ? '#7c5cff' : '#5a3fcf'; c.fillRect(px, py, T_OB, T_OB); if (celdaOb(x, y - 1) !== '#') { c.fillStyle = '#b8a8ff'; c.fillRect(px, py, T_OB, 3); } }
        else if (ch === '=') { c.fillStyle = '#ffb347'; c.fillRect(px, py, T_OB, 6); }
        else if (ch === 'Q') { const st = caidaOb(x, y); if (st === 2 && !OB.vistosCaer.has(x + ',' + y + ',' + OB.caidas[x + ',' + y])) { OB.vistosCaer.add(x + ',' + y + ',' + OB.caidas[x + ',' + y]); if (OB.fx) OB.fx.particulas({ x: x * T_OB + 8, y: py + 3, n: 8, color: ['#4cd1c0', '#2fa898'], vel: 1.2, vida: 700, grav: 0.15, forma: 'cuadro', tam: 3 }); } if (st !== 2) { const tb = st === 1 ? (Math.random() - 0.5) * 2 : 0; c.fillStyle = '#4cd1c0'; c.fillRect(px + tb, py, T_OB, 6); c.fillStyle = 'rgba(0,0,0,0.2)'; c.fillRect(px + tb, py + 5, T_OB, 1); } }
        else if (ch === 'R') {
            // Resorte que se aplasta y rebota al pisarlo
            const k = Math.max(0, 1 - (pt - (OB.resorteT[x + ',' + y] || 0)) / 350), alto = 6 + Math.sin(k * Math.PI * 3) * 4 * k;
            c.fillStyle = '#ff5a8a'; c.fillRect(px + 2, py + 16 - alto, 12, alto);
            c.strokeStyle = '#c23a66'; c.lineWidth = 1; for (let z = 0; z < 3; z++) { c.beginPath(); c.moveTo(px + 2, py + 16 - alto * (z + 0.5) / 3); c.lineTo(px + 14, py + 16 - alto * (z + 0.5) / 3); c.stroke(); }
            c.fillStyle = '#ffd23a'; c.fillRect(px + 1, py + 14 - alto, 14, 3);
        }
        else if (ch === 'D' || ch === 'X') {
            const rev = ch === 'X' && OB.revelados.has(x + ',' + y);
            c.fillStyle = '#5a3fcf'; c.fillRect(px, py, T_OB, T_OB);
            c.fillStyle = rev ? '#888' : '#ffd23a'; c.fillRect(px + 2, py + 1, 12, 15);
            c.fillStyle = rev ? '#ff4a4a' : '#e8496b'; c.font = 'bold 9px monospace'; c.fillText(rev ? '✕' : '?', px + 5, py + 11);
        }
    }
    // Meta
    const mx = OB.meta - cam;
    if (mx > -20 && mx < W + 20) for (let y = 0; y < PISO_OB; y++) for (let k = 0; k < 2; k++) { c.fillStyle = (y + k) % 2 ? '#fff' : '#2a1f33'; c.fillRect(mx + k * 4, y * T_OB, 4, T_OB); }
    // Martillos
    OB.martillos.forEach(m => {
        const q = posMartilloOb(m), px = q.x - cam; if (px < -40 || px > W + 40) return;
        // Cadena, mazo con franjas y sombra en el piso según la altura
        const sombra = Math.max(0.1, (q.y + q.h) / (PISO_OB * T_OB));
        c.fillStyle = `rgba(60,20,60,${0.25 * sombra})`; c.beginPath(); c.ellipse(px + q.w / 2, PISO_OB * T_OB, q.w / 2 * sombra + 4, 3, 0, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#8a8fa0'; for (let y = 0; y < q.y; y += 5) c.fillRect(px + q.w / 2 - 2 + ((y / 5) % 2), y, 3, 4);
        c.fillStyle = '#ff5a6e'; c.beginPath(); c.roundRect ? c.roundRect(px, q.y, q.w, q.h, 6) : c.rect(px, q.y, q.w, q.h); c.fill();
        c.fillStyle = '#ffd23a'; c.fillRect(px, q.y + q.h * 0.4, q.w, 5);
        c.fillStyle = 'rgba(255,255,255,0.35)'; c.fillRect(px + 3, q.y + 3, q.w - 6, 3);
        c.fillStyle = 'rgba(0,0,0,0.15)'; c.fillRect(px, q.y + q.h - 4, q.w, 4);
    });
    // Jugadores: el otro como fantasmita
    const pj = (clave, x, y, q, alfa, dir) => {
        const col = q === 'nico' ? '#3d8bfd' : '#e8496b', claro = q === 'nico' ? '#a8d8ff' : '#ffc2d4';
        // Animación según cómo se mueve (igual para el mío y el del otro)
        const a = OB.anim[clave] || (OB.anim[clave] = { x, y, paso: 0, vy: 0, aire: false, cae: 0 });
        const vx = x + cam - a.x, vy = y - a.y, enAire = Math.abs(vy) > 0.4;
        a.paso += Math.abs(vx) * 0.35;
        if (a.aire && !enAire && Math.abs(a.vy) > 1.5) { a.cae = pt; OB.fx && OB.fx.polvo(x + cam + ANCHO_OB / 2, y + ALTO_OB, 'rgba(255,255,255,0.85)', 6); }
        if (!a.aire && enAire && vy < -2 && OB.fx) OB.fx.polvo(x + cam + ANCHO_OB / 2, y + ALTO_OB + 2, 'rgba(255,255,255,0.7)', 4);
        a.vy = vy; a.aire = enAire; a.x = x + cam; a.y = y;
        const aplasta = Math.max(0, 1 - (pt - a.cae) / 200), estira = enAire ? Math.min(0.2, Math.abs(vy) * 0.03) : 0;
        const ex = 1 + aplasta * 0.25 - estira * 0.5, ey = 1 - aplasta * 0.22 + estira;
        const cx = x + ANCHO_OB / 2, pie = y + ALTO_OB;
        c.globalAlpha = alfa;
        c.fillStyle = 'rgba(80,20,80,0.2)'; c.beginPath(); c.ellipse(cx, pie + 1, ANCHO_OB / 2 + 1, 2, 0, 0, Math.PI * 2); c.fill();
        c.save(); c.translate(cx, pie); c.scale(ex, ey);
        // Patitas que corren
        const ciclo = Math.sin(a.paso), quieto = Math.abs(vx) < 0.2 && !enAire;
        c.fillStyle = col;
        c.fillRect(-4 + (quieto ? 0 : ciclo * 1.5), -3, 3, 3); c.fillRect(1 - (quieto ? 0 : ciclo * 1.5), -3, 3, 3);
        // Cuerpo de gomita con brillo
        const g = c.createRadialGradient(-2, -ALTO_OB + 4, 1, 0, -ALTO_OB / 2, ALTO_OB / 1.3); g.addColorStop(0, claro); g.addColorStop(1, col);
        c.fillStyle = g; c.beginPath(); c.ellipse(0, -ALTO_OB / 2 - 1, ANCHO_OB / 2 + 1, ALTO_OB / 2, 0, 0, Math.PI * 2); c.fill();
        // Bracitos: arriba en el aire, se balancean al correr
        c.strokeStyle = col; c.lineWidth = 2; c.lineCap = 'round';
        const brazo = enAire ? -5 : quieto ? 0 : ciclo * 2;
        c.beginPath(); c.moveTo(-ANCHO_OB / 2, -ALTO_OB / 2); c.lineTo(-ANCHO_OB / 2 - 3, -ALTO_OB / 2 + 3 + brazo); c.stroke();
        c.beginPath(); c.moveTo(ANCHO_OB / 2, -ALTO_OB / 2); c.lineTo(ANCHO_OB / 2 + 3, -ALTO_OB / 2 + 3 - brazo); c.stroke();
        // Visor con ojos que parpadean
        c.fillStyle = 'rgba(255,255,255,0.95)'; c.beginPath(); c.ellipse(dir * 1.5, -ALTO_OB + 5, 4.5, 3, 0, 0, Math.PI * 2); c.fill();
        const parp = (Math.floor(pt / 100) + (clave === 'yo' ? 0 : 13)) % 31 === 0;
        c.fillStyle = '#2a1f33'; c.fillRect(dir * 1.5 - 2.5, -ALTO_OB + 4 + (parp ? 1 : 0), 1.6, parp ? 0.6 : 2); c.fillRect(dir * 1.5 + 1, -ALTO_OB + 4 + (parp ? 1 : 0), 1.6, parp ? 0.6 : 2);
        c.restore();
        c.globalAlpha = 1;
    };
    if (OB.el && OB.el.x != null && Date.now() - OB.el.visto < 4000) {
        const [rx, ry] = VivoComun.suave(OB.el);
        pj('el', rx - cam, ry, miRival, 0.6, OB.el.d || 1);
        c.fillStyle = 'rgba(42,31,51,0.55)'; c.font = 'bold 6px monospace'; c.textAlign = 'center'; c.fillText(nombreJugador(miRival), rx - cam + ANCHO_OB / 2, ry - 4); c.textAlign = 'left';
    }
    if (OB.yo && !OB.muriendo) pj('yo', OB.yo.x - cam, OB.yo.y, miIdentidad, 1, OB.yo.dir || 1);
    if (OB.fx) { c.save(); c.translate(-cam, 0); OB.fx.dibujar(c); c.restore(); }
    // Barra de progreso
    c.fillStyle = 'rgba(20,16,30,0.5)'; c.fillRect(0, 0, W, 12);
    c.fillStyle = 'rgba(255,255,255,0.3)'; c.fillRect(40, 5, W - 80, 2);
    const marca = (x, q) => { const f = Math.max(0, Math.min(1, x / OB.meta)); c.fillStyle = q === 'nico' ? '#3d8bfd' : '#e8496b'; c.beginPath(); c.arc(40 + f * (W - 80), 6, 3.5, 0, Math.PI * 2); c.fill(); };
    if (OB.el) marca(OB.el.x, miRival);
    if (OB.yo) marca(OB.yo.x, miIdentidad);
    c.fillStyle = '#fff'; c.font = 'bold 8px monospace'; c.fillText('🏁', W - 36, 9);
    if (OB.yo && OB.el) { c.fillText(OB.yo.x >= OB.el.x ? '1°' : '2°', 6, 9); }
    const falta = e.inicio - VivoComun.reloj('obstaculos');
    if (e.fase === 'jugando' && falta > 0) { c.fillStyle = 'rgba(20,16,30,0.5)'; c.fillRect(0, H / 2 - 22, W, 36); c.fillStyle = '#fff'; c.textAlign = 'center'; c.font = 'bold 20px monospace'; c.fillText(String(Math.ceil(falta / 1000)), W / 2, H / 2 + 2); c.font = '8px monospace'; c.fillText('¡Sólo una de las tres puertas se abre!', W / 2, H / 2 + 11); c.textAlign = 'left'; }
    else if (OB.llegue && e.fase === 'jugando') { c.fillStyle = '#2a1f33'; c.textAlign = 'center'; c.font = 'bold 14px monospace'; c.fillText('🏁 ¡Llegaste!', W / 2, H / 2); c.textAlign = 'left'; }
    if (OB.fx) OB.fx.despues(c);
    VivoComun.estado(c, W, H, OB.enlace, nombreJugador(miRival), e.fase === 'jugando' && falta < -500 && !OB.llegue);
}
function bucleOb(ts){
    const pantalla = document.getElementById('pantalla-obstaculos');
    if (!pantalla || !pantalla.classList.contains('activa')) { pararOb(); return; }
    if (VivoComun.pausa('obstaculos')) { OB.ultimoTs = 0; dibujarOb(); VivoComun.cartelPausa(OB.ctx); OB.loop = requestAnimationFrame(bucleOb); return; }
    const dt = Math.min(2.5, (ts - (OB.ultimoTs || ts)) / 16.67 || 1);
    OB.ultimoTs = ts;
    pasoOb(dt);
    if (OB.enlace && OB.yo && Date.now() - OB.ultimoEnvio > 50) {
        OB.ultimoEnvio = Date.now();
        OB.enlace.enviar('p', { x: Math.round(OB.yo.x * 10) / 10, y: Math.round(OB.yo.y * 10) / 10, d: OB.yo.dir, c: OB.clave });
    }
    if (OB.estado && OB.estado.fase === 'jugando') VivoComun.cuenta('OB', OB.estado.inicio);
    dibujarOb();
    OB.loop = requestAnimationFrame(bucleOb);
}
function arrancarOb(){
    OB.fx = OB.fx || FxVivo.crear();
    if (!OB.canvas) {
        OB.canvas = document.createElement('canvas');
        OB.canvas.width = VISTA_OB * T_OB; OB.canvas.height = FILAS_OB * T_OB;
        OB.canvas.className = 'lienzo-aventura';
        OB.canvas.style.aspectRatio = `${VISTA_OB}/${FILAS_OB}`;
        OB.ctx = OB.canvas.getContext('2d');
        OB.controles = VivoComun.botones([[{ k: 'izq', txt: '◀' }, { k: 'der', txt: '▶' }], { k: 'salto', txt: '⤒', clase: 'salto' }], OB.teclas);
    }
    if (!OB.teclado) OB.teclado = VivoComun.teclado('pantalla-obstaculos', { ArrowLeft: 'izq', KeyA: 'izq', ArrowRight: 'der', KeyD: 'der', ArrowUp: 'salto', KeyW: 'salto', Space: 'salto' }, OB.teclas);
    if (!OB.enlace) {
        OB.enlace = EnlaceVivo.conectar('obstaculos', {
            alMensaje(t, d) {
                if (d.c !== OB.clave) return;
                if (t === 'p') { OB.el = VivoComun.recibir(OB.el, { x: d.x, y: d.y }); OB.el.d = d.d; }
            }
        });
    }
    if (!OB.loop) OB.loop = requestAnimationFrame(bucleOb);
    window._unsubLoopObstaculos = pararOb;
}
function pararOb(){
    if (OB.loop) cancelAnimationFrame(OB.loop);
    OB.loop = null;
    if (OB.enlace) OB.enlace.cerrar();
    OB.enlace = null; Object.keys(OB.teclas).forEach(k => { OB.teclas[k] = false; });
}

const Obstaculos = JuegoTurnos.crear({
    id: 'obstaculos',
    sinTurno: true,
    emojiListo: '🏃',
    intro: 'Una carrera de obstáculos de costado, en vivo, los dos a la vez: pozos, escalones, martillos, plataformas que se caen, resortes y tres puertas de las que sólo una se abre. ◀ ▶ y ⤒. ¡Gana el primero en la meta! Cada carrera es una pista distinta.',
    inicial: () => ({ semilla: Math.floor(Math.random() * 1e9), clave: Math.random().toString(36).slice(2, 7), inicio: window.ahoraSync() + 3500, turno: null }),
    render() { return `<div id="obstaculos-host"></div><div class="texto-centro texto-tenue" style="font-size:0.75rem;">El fantasmita es ${nombreJugador(miRival)}. Si te caés, volvés al último tramo.</div>`; },
    alDibujar(cont, e) {
        OB.estado = e;
        const host = cont.querySelector('#obstaculos-host');
        if (!host) return;
        VivoComun.montar('obstaculos', Obstaculos, host, e);
        if (OB.clave !== e.clave) reiniciarOb(e);
        if (e.fase === 'jugando') { arrancarOb(); host.appendChild(OB.canvas); host.appendChild(OB.controles); }
        else if (OB.canvas) { host.appendChild(OB.canvas); dibujarOb(); }
    }
});
window._obstaculos = OB; // para pruebas
