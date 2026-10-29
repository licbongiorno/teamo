// ==================== CARRERA DE AUTITOS (en vivo, vista de arriba) ====================
// Cada uno maneja su autito desde su celu, en la misma pista y en vivo.
// 3 vueltas: la pista se divide en sectores que hay que pasar en orden (así
// cortar por el pasto no sirve). Semáforo de largada con el reloj
// compartido, el primero en terminar gana y se guarda la mejor vuelta de
// cada circuito. Se maneja con botones o inclinando el celu.
// Cada uno simula su auto y manda su posición por js/enlace-vivo.js.
const W_AU = 300, H_AU = 400, ANCHO_PISTA = 20, VUELTAS_AU = 3, SECTORES_AU = 8, N_AU = 240;
const CIRCUITOS_AU = [
    { nombre: 'Óvalo del Parque', pasto: '#5fa35a', puntos: [[150, 40], [250, 58], [272, 200], [250, 342], [150, 362], [50, 342], [28, 200], [50, 58]] },
    { nombre: 'La Ese', pasto: '#6aa84f', puntos: [[60, 48], [240, 48], [268, 108], [205, 160], [115, 165], [92, 215], [150, 250], [240, 250], [268, 322], [228, 366], [62, 366], [34, 300], [34, 110]] },
    { nombre: 'Curvas de la Sierra', pasto: '#7aa35a', puntos: [[40, 62], [120, 38], [262, 50], [272, 140], [205, 152], [182, 202], [262, 232], [272, 332], [200, 372], [118, 334], [150, 272], [92, 232], [42, 302], [28, 182]] },
    { nombre: 'Zigzag de la Costanera', pasto: '#8fbf6a', puntos: [[40, 50], [150, 40], [262, 52], [270, 120], [200, 140], [200, 200], [268, 230], [268, 340], [200, 370], [100, 370], [40, 330], [90, 270], [40, 220], [90, 170], [40, 120]] },
];
const AU = { canvas: null, ctx: null, enlace: null, loop: null, estado: null, clave: null, pista: null, fondo: null, yo: null, el: null, teclas: {}, inclinar: false, giroTilt: 0, ultimoEnvio: 0, ultimoTs: 0, terminado: false, fx: null, marcas: null };

// Spline cerrada (Catmull-Rom) y después puntos a la misma distancia.
function armarPistaAu(cto){
    const P = cto.puntos, fino = [];
    for (let i = 0; i < P.length; i++) {
        const p0 = P[(i - 1 + P.length) % P.length], p1 = P[i], p2 = P[(i + 1) % P.length], p3 = P[(i + 2) % P.length];
        for (let k = 0; k < 20; k++) {
            const t = k / 20, t2 = t * t, t3 = t2 * t;
            fino.push([0, 1].map(j => 0.5 * (2 * p1[j] + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3)));
        }
    }
    const largos = [0];
    for (let i = 1; i <= fino.length; i++) largos.push(largos[i - 1] + Math.hypot(fino[i % fino.length][0] - fino[i - 1][0], fino[i % fino.length][1] - fino[i - 1][1]));
    const total = largos[fino.length], pts = [];
    let j = 0;
    for (let i = 0; i < N_AU; i++) {
        const d = i * total / N_AU;
        while (largos[j + 1] < d) j++;
        const f = (d - largos[j]) / ((largos[j + 1] - largos[j]) || 1), a = fino[j], b = fino[(j + 1) % fino.length];
        pts.push([a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]);
    }
    return { pts, largo: total };
}
// El punto de la pista más cercano: primero cerca del último (rápido); si
// quedé lejos (me fui por el pasto) busco en toda la pista.
function cercanoAu(x, y, desde){
    const pts = AU.pista.pts;
    let mejor = -1, md = Infinity;
    const probar = (i) => { const p = pts[(i + N_AU) % N_AU], d = (p[0] - x) ** 2 + (p[1] - y) ** 2; if (d < md) { md = d; mejor = (i + N_AU) % N_AU; } };
    if (desde != null) for (let k = -20; k <= 20; k++) probar(desde + k);
    if (desde == null || md > 45 * 45) for (let i = 0; i < N_AU; i++) probar(i);
    return { i: mejor, d: Math.sqrt(md) };
}
function dibujarFondoAu(cto){
    const f = document.createElement('canvas'); f.width = W_AU * 2; f.height = H_AU * 2;
    const c = f.getContext('2d'); c.scale(2, 2);
    c.fillStyle = cto.pasto; c.fillRect(0, 0, W_AU, H_AU);
    // Pastito y arbolitos
    for (let i = 0; i < 160; i++) { c.fillStyle = i % 2 ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'; c.fillRect((i * 97) % W_AU, (i * 61) % H_AU, 3, 2); }
    const pts = AU.pista.pts;
    const camino = () => { c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath(); };
    c.lineJoin = 'round'; c.lineCap = 'round';
    // Pianitos (rojo y blanco) abajo del asfalto
    camino(); c.strokeStyle = '#fff'; c.lineWidth = ANCHO_PISTA * 2 + 6; c.stroke();
    c.lineCap = 'butt'; camino(); c.strokeStyle = '#e8496b'; c.setLineDash([6, 6]); c.stroke(); c.setLineDash([]); c.lineCap = 'round';
    camino(); c.strokeStyle = '#4a4a55'; c.lineWidth = ANCHO_PISTA * 2; c.stroke();
    camino(); c.strokeStyle = 'rgba(255,255,255,0.55)'; c.lineWidth = 1.5; c.setLineDash([7, 9]); c.stroke(); c.setLineDash([]);
    // Línea de largada a cuadros
    const p0 = pts[0], p1 = pts[1], ang = Math.atan2(p1[1] - p0[1], p1[0] - p0[0]);
    c.save(); c.translate(p0[0], p0[1]); c.rotate(ang);
    for (let k = -ANCHO_PISTA; k < ANCHO_PISTA; k += 4) for (let m = 0; m < 2; m++) { c.fillStyle = ((k / 4 + m) & 1) ? '#fff' : '#222'; c.fillRect(-4 + m * 4, k, 4, 4); }
    c.restore();
    for (let i = 0; i < 14; i++) {
        const x = (i * 137 + 23) % W_AU, y = (i * 89 + 41) % H_AU;
        if (cercanoAu(x, y).d > ANCHO_PISTA + 14) {
            c.fillStyle = 'rgba(0,0,0,0.22)'; c.beginPath(); c.ellipse(x + 3, y + 4, 8, 6, 0.3, 0, Math.PI * 2); c.fill();
            c.fillStyle = '#2f6b34'; c.beginPath(); c.arc(x, y, 7, 0, Math.PI * 2); c.fill();
            c.fillStyle = '#3f8a44'; c.beginPath(); c.arc(x - 2, y - 2, 4.5, 0, Math.PI * 2); c.fill();
            c.fillStyle = 'rgba(255,255,255,0.18)'; c.beginPath(); c.arc(x - 3, y - 3.5, 1.8, 0, Math.PI * 2); c.fill();
        }
    }
    // Florcitas en el pasto
    for (let i = 0; i < 40; i++) {
        const x = (i * 53 + 11) % W_AU, y = (i * 131 + 7) % H_AU;
        if (cercanoAu(x, y).d > ANCHO_PISTA + 6) { c.fillStyle = ['#fff6a8', '#ffd0e0', '#ffffff'][i % 3]; c.fillRect(x, y, 1.6, 1.6); }
    }
    return f;
}
// El que toca: el que eligieron en la espera, o si no, el siguiente al último.
function proximoCircuitoAu(e){
    if (e && e.elegido != null) return e.elegido;
    return e && e.circuito != null ? (e.circuito + 1) % CIRCUITOS_AU.length : 0;
}
function elegirCircuitoAu(i){
    if (!CIRCUITOS_AU[i]) return;
    vibrarJ(8);
    if (window.sfx) window.sfx.click();
    window.setDoc(Autitos.ref(), { elegido: i }, { merge: true }).catch(() => {});
}
window.elegirCircuitoAu = elegirCircuitoAu;
function cargarCarreraAu(e){
    AU.clave = e.clave;
    const cto = CIRCUITOS_AU[e.circuito || 0];
    AU.pista = armarPistaAu(cto);
    AU.fondo = dibujarFondoAu(cto);
    const pts = AU.pista.pts, a = pts[N_AU - 6], b = pts[N_AU - 5], ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
    const lado = miIdentidad === 'nico' ? -1 : 1, nx = -Math.sin(ang), ny = Math.cos(ang);
    AU.yo = { x: a[0] + nx * 9 * lado, y: a[1] + ny * 9 * lado, a: ang, v: 0, vx: 0, vy: 0, i: N_AU - 6, sig: 1, vuelta: 0, tVuelta: null, mejor: null, humo: [] };
    AU.el = null; AU.terminado = false;
    AU.marcas = document.createElement('canvas'); AU.marcas.width = W_AU * 2; AU.marcas.height = H_AU * 2;
    AU.ctxMarcas = AU.marcas.getContext('2d'); AU.ctxMarcas.scale(2, 2);
    if (AU.fx) AU.fx.limpiar();
}
// Marcas de goma en el asfalto (quedan en una capa aparte y se van borrando de a poco).
function marcaAu(x, y, a, ant){
    const m = AU.ctxMarcas; if (!m || !ant) return;
    m.strokeStyle = 'rgba(25,22,30,0.35)'; m.lineWidth = 1.3; m.lineCap = 'round';
    for (const lado of [-3.6, 3.6]) {
        const ox = -Math.cos(a) * 5 - Math.sin(a) * lado, oy = -Math.sin(a) * 5 + Math.cos(a) * lado;
        const pox = -Math.cos(ant.a) * 5 - Math.sin(ant.a) * lado, poy = -Math.sin(ant.a) * 5 + Math.cos(ant.a) * lado;
        m.beginPath(); m.moveTo(ant.x + pox, ant.y + poy); m.lineTo(x + ox, y + oy); m.stroke();
    }
}
// Humo al derrapar, tierra por el pasto (para los dos autos).
function efectosRuedasAu(q, x, y, a, vel, derrapa, enPasto){
    const fx = AU.fx; if (!fx) return;
    q.antMarca = q.antMarca || null;
    if (derrapa && !enPasto) { marcaAu(x, y, a, q.antMarca); if (Math.random() < 0.5) fx.polvo(x - Math.cos(a) * 6, y - Math.sin(a) * 6, 'rgba(235,235,240,0.55)', 1); }
    if (enPasto && vel > 0.8 && Math.random() < 0.35) fx.particulas({ x: x - Math.cos(a) * 6, y: y - Math.sin(a) * 6, n: 1, color: ['#8a6a3a', '#6b8f3a', '#a5844e'], vel: 1, vida: 420, grav: 0, tam: 1.6, roce: 0.9 });
    q.antMarca = derrapa && !enPasto ? { x, y, a } : null;
}
function progresoAu(p){
    const pasados = p.vuelta * SECTORES_AU + ((p.sig - 1 + SECTORES_AU) % SECTORES_AU);
    const ini = ((p.sig - 1 + SECTORES_AU) % SECTORES_AU) * N_AU / SECTORES_AU;
    return pasados * 1000 + ((p.i - ini + N_AU) % N_AU);
}
function pasoAu(dt){
    const e = AU.estado, p = AU.yo;
    if (!e || e.fase !== 'jugando' || !p || AU.terminado) return;
    const ahora = VivoComun.reloj('autitos');
    if (ahora < e.inicio) return;
    if (p.tVuelta == null) p.tVuelta = e.inicio;
    const k = AU.teclas;
    const giro = AU.inclinar ? AU.giroTilt : (k.der ? 1 : 0) - (k.izq ? 1 : 0);
    const cerca = cercanoAu(p.x, p.y, p.i);
    const enPasto = cerca.d > ANCHO_PISTA + 1;
    const max = enPasto ? 1.5 : 3.6;
    if (k.gas) p.v += 0.09 * dt; else p.v *= Math.pow(0.985, dt);
    if (k.freno) p.v -= 0.16 * dt;
    if (p.v > max) p.v += (max - p.v) * 0.12 * dt;
    p.v = Math.max(-1, p.v);
    p.a += giro * 0.06 * Math.min(1, Math.abs(p.v) / 1.4) * Math.sign(p.v || 1) * dt;
    // Derrape: la velocidad real va girando de a poco hacia donde apunta el auto.
    const agarre = enPasto ? 0.3 : 0.16;
    p.vx += (Math.cos(p.a) * p.v - p.vx) * Math.min(1, agarre * dt);
    p.vy += (Math.sin(p.a) * p.v - p.vy) * Math.min(1, agarre * dt);
    p.x = Math.max(6, Math.min(W_AU - 6, p.x + p.vx * dt));
    p.y = Math.max(6, Math.min(H_AU - 6, p.y + p.vy * dt));
    // Choque con el otro: empujón suave.
    const o = AU.el;
    if (o && Date.now() - o.visto < 1500) {
        const dx = p.x - o.x, dy = p.y - o.y, d = Math.hypot(dx, dy);
        if (d < 12 && d > 0) { p.x += dx / d * (12 - d) * 0.6; p.y += dy / d * (12 - d) * 0.6; p.v *= 0.9; if (!AU._choque || Date.now() - AU._choque > 500) { AU._choque = Date.now(); vibrarJ(15); if (window.sfx) window.sfx.toque(); if (AU.fx) { AU.fx.chispas((p.x + o.x) / 2, (p.y + o.y) / 2, ['#fff7c2', '#ffd23a', '#ff9f43'], 10); AU.fx.temblor(2, 180); } } }
    }
    const derrapa = Math.abs(Math.atan2(p.vy, p.vx) - p.a) % (Math.PI * 2);
    if (Math.abs(p.v) > 2.4 && (derrapa > 0.35 && derrapa < Math.PI * 2 - 0.35)) p.humo.push({ x: p.x, y: p.y, t: Date.now() });
    p.humo = p.humo.filter(h => Date.now() - h.t < 500);
    efectosRuedasAu(p, p.x, p.y, p.a, Math.abs(p.v), Math.abs(p.v) > 2.4 && derrapa > 0.35 && derrapa < Math.PI * 2 - 0.35, enPasto);
    p.enPasto = enPasto;
    // Sectores en orden: así se cuentan las vueltas y no valen los atajos.
    p.i = cercanoAu(p.x, p.y, p.i).i;
    const sector = Math.floor(p.i / (N_AU / SECTORES_AU));
    if (sector === p.sig) {
        if (p.sig === 0) {
            p.vuelta++;
            const t = ahora - p.tVuelta; p.tVuelta = ahora;
            if (p.mejor == null || t < p.mejor) p.mejor = t;
            guardarVueltaAu(t);
            if (p.vuelta >= VUELTAS_AU) llegarAu(ahora - e.inicio);
            if (AU.fx) { AU.fx.onda(p.x, p.y, { color: 'rgba(255,255,255,0.9)', radio: 22 }); AU.fx.estrellitas(p.x, p.y, 8); }
            if (p.vuelta >= VUELTAS_AU && AU.fx) { const m = AU.pista.pts[0]; AU.fx.confeti(m[0], m[1], 60); }
            else { vibrarJ(20); if (window.sfx) window.sfx.punto(); if (window.animJuegos) window.animJuegos.cartel(p.vuelta === VUELTAS_AU - 1 ? '¡Última vuelta!' : `Vuelta ${p.vuelta + 1}`, { dur: 800, sonido: false }); }
        }
        p.sig = (p.sig + 1) % SECTORES_AU;
    }
}
function guardarVueltaAu(t){
    const clave = AU.clave, quien = miIdentidad;
    Autitos.accionEnCola((e) => {
        if (e.clave !== clave) return null;
        const r = (e.records || {})['c' + e.circuito];
        if (r && r.t <= t) return null;
        return { records: { ...(e.records || {}), ['c' + e.circuito]: { t: Math.round(t), q: quien } } };
    }).then(res => { if (res && window.animJuegos) window.animJuegos.cartel(`⏱ ¡Récord del circuito! ${(t / 1000).toFixed(1)} s`, { dur: 1100, sonido: false }); });
}
async function llegarAu(tiempo){
    AU.terminado = true;
    const clave = AU.clave, quien = miIdentidad, mejor = AU.yo.mejor;
    await Autitos.accionEnCola((e) => {
        if (e.clave !== clave) return null;
        return { ganador: quien, motivo: `${nombreJugador(quien)} llegó primero en ${(tiempo / 1000).toFixed(1)} s · mejor vuelta ${(mejor / 1000).toFixed(1)} s` };
    });
}
function dibujarAutoAu(c, x, y, a, col, techo, giro = 0, frena = false){
    c.save(); c.translate(x + 1.5, y + 2); c.rotate(a);
    c.fillStyle = 'rgba(0,0,0,0.28)'; c.beginPath(); c.roundRect ? c.roundRect(-8, -5, 16, 10, 4) : c.rect(-8, -5, 16, 10); c.fill();
    c.restore();
    c.save(); c.translate(x, y); c.rotate(a);
    // ruedas (las de adelante doblan)
    c.fillStyle = '#1a1a20';
    c.fillRect(-6.5, -6, 4, 2.2); c.fillRect(-6.5, 3.8, 4, 2.2);
    for (const ly of [-4.9, 4.9]) { c.save(); c.translate(4.5, ly); c.rotate(giro * 0.45); c.fillRect(-2, -1.1, 4, 2.2); c.restore(); }
    // carrocería con brillo
    const g = c.createLinearGradient(0, -5, 0, 5); g.addColorStop(0, techo); g.addColorStop(0.35, col); g.addColorStop(1, col);
    c.fillStyle = g; c.beginPath(); c.roundRect ? c.roundRect(-8, -4.6, 16, 9.2, [2.5, 4.5, 4.5, 2.5]) : c.rect(-8, -4.6, 16, 9.2); c.fill();
    c.strokeStyle = 'rgba(0,0,0,0.35)'; c.lineWidth = 0.6; c.stroke();
    // alerón
    c.fillStyle = '#222'; c.fillRect(-8.8, -4.8, 1.6, 9.6);
    // cabina
    c.fillStyle = 'rgba(25,30,45,0.85)'; c.beginPath(); c.roundRect ? c.roundRect(-3.5, -3, 6, 6, 2) : c.rect(-3.5, -3, 6, 6); c.fill();
    c.fillStyle = 'rgba(200,235,255,0.75)'; c.fillRect(1.2, -2.4, 1.2, 4.8);
    // raya
    c.fillStyle = 'rgba(255,255,255,0.8)'; c.fillRect(3.4, -0.7, 4, 1.4);
    // luces
    c.fillStyle = '#fff6c0'; c.fillRect(7, -3.8, 1, 1.6); c.fillRect(7, 2.2, 1, 1.6);
    c.fillStyle = frena ? '#ff3a3a' : '#8a2030'; c.fillRect(-8, -3.8, 0.9, 1.6); c.fillRect(-8, 2.2, 0.9, 1.6);
    if (frena) { c.fillStyle = 'rgba(255,60,60,0.35)'; c.beginPath(); c.arc(-9, 0, 4, 0, Math.PI * 2); c.fill(); }
    c.restore();
}
function dibujarAu(){
    const c = AU.ctx, e = AU.estado;
    if (!c || !e || !AU.fondo) return;
    c.setTransform(1, 0, 0, 1, 0, 0); c.drawImage(AU.fondo, 0, 0);
    if (AU.marcas) c.drawImage(AU.marcas, 0, 0);
    c.setTransform(2, 0, 0, 2, 0, 0);
    // Las marcas de goma se borran de a poco
    if (AU.ctxMarcas && Math.random() < 0.05) { const m = AU.ctxMarcas; m.save(); m.setTransform(1, 0, 0, 1, 0, 0); m.globalCompositeOperation = 'destination-out'; m.fillStyle = 'rgba(0,0,0,0.04)'; m.fillRect(0, 0, W_AU * 2, H_AU * 2); m.restore(); }
    const fx = AU.fx;
    fx && fx.antes(c);
    const colYo = miIdentidad === 'nico' ? ['#3d8bfd', '#a8d8ff'] : ['#e8496b', '#ffc2d4'];
    const colEl = miIdentidad === 'nico' ? ['#e8496b', '#ffc2d4'] : ['#3d8bfd', '#a8d8ff'];
    const p = AU.yo;
    const o = AU.el;
    if (o && Date.now() - o.visto < 4000) {
        const ax = o.rx, ay = o.ry, aa = o.ra;
        VivoComun.suave(o);
        if (ax != null) {
            // Del movimiento suavizado se sacan la velocidad y el derrape del otro, para sus efectos.
            const vx = o.rx - ax, vy = o.ry - ay, vel = Math.hypot(vx, vy);
            let dif = Math.abs(Math.atan2(vy, vx) - o.ra) % (Math.PI * 2);
            const enPasto = AU.pista && cercanoAu(o.rx, o.ry, o.ip).d > ANCHO_PISTA + 1;
            o.ip = cercanoAu(o.rx, o.ry, o.ip).i;
            let dg = (o.ra - (aa == null ? o.ra : aa)); dg = Math.atan2(Math.sin(dg), Math.cos(dg));
            o.giro = (o.giro || 0) * 0.8 + Math.max(-1, Math.min(1, dg * 12)) * 0.2;
            o.frena = vel < (o.vel || 0) - 0.05; o.vel = vel;
            efectosRuedasAu(o, o.rx, o.ry, o.ra, vel, vel > 2.2 && dif > 0.35 && dif < Math.PI * 2 - 0.35, enPasto);
        }
        dibujarAutoAu(c, o.rx, o.ry, o.ra, colEl[0], colEl[1], o.giro || 0, o.frena);
    }
    if (p) { const k = AU.teclas; dibujarAutoAu(c, p.x, p.y, p.a, colYo[0], colYo[1], AU.inclinar ? AU.giroTilt : (k.der ? 1 : 0) - (k.izq ? 1 : 0), !!k.freno); }
    fx && fx.dibujar(c);
    fx && fx.despues(c);
    // Tablero
    const cto = CIRCUITOS_AU[e.circuito || 0];
    c.fillStyle = 'rgba(20,16,30,0.6)'; c.fillRect(0, 0, W_AU, 16);
    c.fillStyle = '#fff'; c.font = 'bold 9px monospace';
    const vuelta = p ? Math.min(VUELTAS_AU, p.vuelta + 1) : 1;
    let pos = '';
    if (p && o && o.pr != null) pos = progresoAu(p) >= o.pr ? ' · 1°' : ' · 2°';
    const rec = (e.records || {})['c' + (e.circuito || 0)];
    c.fillText(`${cto.nombre} · Vuelta ${vuelta}/${VUELTAS_AU}${pos}`, 4, 11);
    c.textAlign = 'right';
    c.fillText(rec ? `⏱ ${(rec.t / 1000).toFixed(1)}s ${nombreJugador(rec.q)}` : '', W_AU - 12, 11);
    c.textAlign = 'left';
    VivoComun.estado(c, W_AU, H_AU, AU.enlace, nombreJugador(miRival));
    // Semáforo
    const falta = e.inicio - VivoComun.reloj('autitos');
    if (e.fase === 'jugando' && falta > -900) {
        const prendidas = falta > 0 ? Math.min(3, 4 - Math.ceil(falta / 1000)) : 0;
        c.fillStyle = 'rgba(20,16,30,0.85)'; c.fillRect(W_AU / 2 - 44, 150, 88, 34);
        const kk = falta > 0 ? 1 - (falta % 1000) / 1000 : Math.min(1, -falta / 300);
        for (let k = 0; k < 3; k++) {
            const prendida = falta <= 0 || k < prendidas, col = falta <= 0 ? '#4cd18a' : '#ff4a4a', cx = W_AU / 2 - 26 + k * 26;
            if (prendida) { const g = c.createRadialGradient(cx, 167, 2, cx, 167, 20); g.addColorStop(0, col + 'aa'); g.addColorStop(1, col + '00'); c.fillStyle = g; c.fillRect(cx - 20, 147, 40, 40); }
            const r = 10 * (prendida && (k === prendidas - 1 || falta <= 0) ? FxVivo.rebote(Math.min(1, kk * 3)) : 1);
            c.fillStyle = prendida ? col : '#3a3428'; c.beginPath(); c.arc(cx, 167, r, 0, Math.PI * 2); c.fill();
            c.fillStyle = 'rgba(255,255,255,0.35)'; c.beginPath(); c.arc(cx - 3, 163, r * 0.3, 0, Math.PI * 2); c.fill();
        }
        if (falta <= 0) { const esc = FxVivo.rebote(kk); c.save(); c.translate(W_AU / 2, 206); c.scale(esc, esc); c.font = 'bold 24px monospace'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineWidth = 4; c.strokeStyle = '#1a1424'; c.strokeText('¡YA!', 0, 0); c.fillStyle = '#fff'; c.fillText('¡YA!', 0, 0); c.restore(); }
    } else if (AU.terminado && e.fase === 'jugando') {
        c.fillStyle = 'rgba(20,16,30,0.7)'; c.fillRect(0, 180, W_AU, 30); c.fillStyle = '#fff'; c.textAlign = 'center'; c.font = 'bold 13px monospace'; c.fillText('🏁 ¡Llegaste!', W_AU / 2, 200); c.textAlign = 'left';
    }
}
function bucleAu(ts){
    const pantalla = document.getElementById('pantalla-autitos');
    if (!pantalla || !pantalla.classList.contains('activa')) { pararAu(); return; }
    if (VivoComun.pausa('autitos')) { AU.ultimoTs = 0; dibujarAu(); VivoComun.cartelPausa(AU.ctx); AU.loop = requestAnimationFrame(bucleAu); return; }
    const dt = Math.min(2.5, (ts - (AU.ultimoTs || ts)) / 16.67 || 1);
    AU.ultimoTs = ts;
    pasoAu(dt);
    if (AU.enlace && AU.yo && Date.now() - AU.ultimoEnvio > 50) {
        AU.ultimoEnvio = Date.now();
        const p = AU.yo;
        AU.enlace.enviar('p', { x: +p.x.toFixed(1), y: +p.y.toFixed(1), a: +p.a.toFixed(3), pr: progresoAu(p), v: p.vuelta, c: AU.clave });
    }
    if (AU.estado && AU.estado.fase === 'jugando') VivoComun.cuenta('AU', AU.estado.inicio);
    dibujarAu();
    AU.loop = requestAnimationFrame(bucleAu);
}
function activarInclinacionAu(){
    const prender = () => {
        AU.inclinar = !AU.inclinar;
        if (!AU.orientacion) {
            AU.orientacion = (ev) => { if (ev.gamma != null) AU.giroTilt = Math.max(-1, Math.min(1, ev.gamma / 25)); };
            window.addEventListener('deviceorientation', AU.orientacion);
        }
        const b = document.getElementById('btn-inclinar-au');
        if (b) b.textContent = AU.inclinar ? '📱 Manejando inclinando (tocá para usar botones)' : '📱 Manejar inclinando el celu';
        if (window.sfx) window.sfx.click();
    };
    if (!AU.inclinar && typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission().then(r => { if (r === 'granted') prender(); }).catch(() => {});
    } else prender();
}
function arrancarAu(){
    if (!AU.canvas) {
        AU.canvas = document.createElement('canvas');
        AU.canvas.width = W_AU * 2; AU.canvas.height = H_AU * 2;
        AU.canvas.className = 'lienzo-autitos';
        AU.ctx = AU.canvas.getContext('2d');
        AU.controles = VivoComun.botones([[{ k: 'izq', txt: '◀' }, { k: 'der', txt: '▶' }], [{ k: 'freno', txt: '🛑', aria: 'Frenar' }, { k: 'gas', txt: '⏩', clase: 'salto', aria: 'Acelerar' }]], AU.teclas);
    }
    if (!AU.teclado) AU.teclado = VivoComun.teclado('pantalla-autitos', { ArrowLeft: 'izq', KeyA: 'izq', ArrowRight: 'der', KeyD: 'der', ArrowUp: 'gas', KeyW: 'gas', Space: 'gas', ArrowDown: 'freno', KeyS: 'freno' }, AU.teclas);
    AU.fx = AU.fx || FxVivo.crear();
    if (!AU.enlace) {
        AU.enlace = EnlaceVivo.conectar('autitos', {
            alMensaje(t, d) {
                if (d.c !== AU.clave) return;
                if (t === 'p') AU.el = VivoComun.recibir(AU.el, d);
            }
        });
    }
    if (!AU.loop) AU.loop = requestAnimationFrame(bucleAu);
    window._unsubLoopAutitos = pararAu;
}
function pararAu(){
    if (AU.loop) cancelAnimationFrame(AU.loop);
    AU.loop = null;
    if (AU.enlace) AU.enlace.cerrar();
    AU.enlace = null; Object.keys(AU.teclas).forEach(k => { AU.teclas[k] = false; });
}

const Autitos = JuegoTurnos.crear({
    id: 'autitos',
    sinTurno: true,
    emojiListo: '🏎️',
    conservar: ['circuito', 'records', 'elegido'],
    intro: `Carrera de autitos vista de arriba, en vivo: ${VUELTAS_AU} vueltas, semáforo de largada y gana el primero en cruzar la meta. Por el pasto se va lento y cortar camino no cuenta. Hay ${CIRCUITOS_AU.length} circuitos que van rotando.`,
    inicial: (previo) => ({ circuito: proximoCircuitoAu(previo), elegido: null, records: (previo && previo.records) || {}, clave: Math.random().toString(36).slice(2, 7), inicio: window.ahoraSync() + 4500, turno: null }),
    extraEspera: (e) => {
        const prox = proximoCircuitoAu(e);
        const rec = e && e.records && e.records['c' + prox];
        return `<div class="texto-tenue" style="margin-top:8px;font-size:0.8rem;">Circuito: <b>${CIRCUITOS_AU[prox].nombre}</b>${rec ? ` · récord ${(rec.t / 1000).toFixed(1)} s de ${nombreJugador(rec.q)}` : ''}</div>
            <div class="niveles-av">${CIRCUITOS_AU.map((c, i) => `<button type="button" class="${i === prox ? 'activa' : ''}" title="${c.nombre}" onclick="elegirCircuitoAu(${i})">${i + 1}</button>`).join('')}</div>`;
    },
    render() { return `<div id="autitos-host"></div><div class="texto-centro" style="margin-top:2px;"><button class="btn-secundario" id="btn-inclinar-au" style="font-size:0.78rem;padding:6px 12px;" onclick="activarInclinacionAu()">${AU.inclinar ? '📱 Manejando inclinando (tocá para usar botones)' : '📱 Manejar inclinando el celu'}</button></div>`; },
    alDibujar(cont, e) {
        AU.estado = e;
        const host = cont.querySelector('#autitos-host');
        if (!host) return;
        VivoComun.montar('autitos', Autitos, host, e);
        if (AU.clave !== e.clave) cargarCarreraAu(e);
        if (e.fase === 'jugando') {
            arrancarAu();
            host.appendChild(AU.canvas); host.appendChild(AU.controles);
        } else if (AU.canvas) { host.appendChild(AU.canvas); dibujarAu(); }
    }
});
window.activarInclinacionAu = activarInclinacionAu;
window._autitos = AU; // para pruebas
