// ==================== VÓLEY DE PLAYA (en vivo) ====================
// Al estilo de los "slime volleyball": cada uno es una gotita en su mitad
// de la cancha, con la red al medio. Se mueve con ◀ ▶ y salta con ⤒; la
// pelota rebota en la cabeza. Punto cuando la pelota toca la arena; a 11
// con 2 de diferencia. Como en el Hockey, la pelota la simula quien la tocó
// último y la transmite por js/enlace-vivo.js. Cada uno se ve a la izquierda.
const W_VO = 320, H_VO = 200, PISO_VO = 178, RED_X = 160, RED_ALTO = 108, R_SLIME = 22, R_PELOTA = 8, PUNTOS_VO = 11;
const VO = { canvas: null, ctx: null, enlace: null, loop: null, estado: null, clave: null, yo: null, el: null, pelota: null, dueno: false, teclas: {}, ultimoEnvio: 0, ultimoTs: 0, puntoMarcado: null, ultimoToque: 0, fx: null, estela: [], anim: {}, puntoT: 0, tToque: 0 };

const espejoVo = () => miIdentidad === 'carito';
// Contra la compu: la gotita del otro la maneja la compu en este mismo celu.
const compuVo = () => { const m = typeof window.modoCompu === 'function' && window.modoCompu(); return m && m.juego === 'voley' ? m : null; };
const aPantallaVo = (x) => espejoVo() ? W_VO - x : x;
const ladoVo = (q) => q === 'nico' ? [R_SLIME, RED_X - 3 - R_SLIME] : [RED_X + 3 + R_SLIME, W_VO - R_SLIME];
function reiniciarVo(e){
    VO.clave = e.clave;
    const [a, b] = ladoVo(miIdentidad);
    VO.yo = { x: (a + b) / 2, y: PISO_VO, vx: 0, vy: 0 };
    VO.pelota = { x: e.saque === 'nico' ? 80 : 240, y: 60, vx: 0, vy: 0 };
    VO.dueno = e.saque === miIdentidad || !!compuVo();
    VO.puntoMarcado = null;
    if (compuVo()) { const [c0, c1] = ladoVo(miRival); VO.el = { x: (c0 + c1) / 2, y: PISO_VO, vx: 0, vy: 0, bot: true }; }
}
function moverPelotaVo(b, dt){
    b.vy += 0.24 * dt;
    b.x += b.vx * dt; b.y += b.vy * dt;
    b.giro = (b.giro || 0) + b.vx * dt * 0.08;
    if (b.x < R_PELOTA) { b.x = R_PELOTA; b.vx = Math.abs(b.vx); }
    if (b.x > W_VO - R_PELOTA) { b.x = W_VO - R_PELOTA; b.vx = -Math.abs(b.vx); }
    if (b.y < -200) { b.y = -200; b.vy = Math.abs(b.vy); }
    // Red: el palo es un rectángulo finito; arriba tiene una punta redonda.
    if (b.y + R_PELOTA > RED_ALTO && Math.abs(b.x - RED_X) < R_PELOTA + 2) {
        if (b.y < RED_ALTO + 4 && b.vy > 0) { b.y = RED_ALTO - R_PELOTA; b.vy = -Math.abs(b.vy) * 0.7; }
        else { b.x = b.x < RED_X ? RED_X - R_PELOTA - 2 : RED_X + R_PELOTA + 2; b.vx = -b.vx * 0.8; }
    }
}
// Choque gotita–pelota: la gotita es media circunferencia apoyada en (x, y).
function chocarVo(s, b){
    const dx = b.x - s.x, dy = b.y - s.y, d = Math.hypot(dx, dy);
    if (d >= R_SLIME + R_PELOTA || d === 0 || dy > 2) return false;
    const nx = dx / d, ny = dy / d;
    b.x = s.x + nx * (R_SLIME + R_PELOTA + 0.5); b.y = s.y + ny * (R_SLIME + R_PELOTA + 0.5);
    const rel = (b.vx - s.vx) * nx + (b.vy - s.vy) * ny;
    if (rel < 0) { b.vx -= 1.85 * rel * nx; b.vy -= 1.85 * rel * ny; }
    b.vx += s.vx * 0.35; b.vy += Math.min(0, s.vy) * 0.35;
    const v = Math.hypot(b.vx, b.vy), max = 9;
    if (v > max) { b.vx *= max / v; b.vy *= max / v; }
    if (v < 3.5) { b.vx += nx * 1.5; b.vy += ny * 1.5 - 1; }
    return true;
}
function pasoVo(dt){
    const e = VO.estado, s = VO.yo;
    if (!e || e.fase !== 'jugando' || !s) return;
    // Mi gotita: se mueve aunque la pelota esté quieta (antes del saque).
    const dir = ((VO.teclas.der ? 1 : 0) - (VO.teclas.izq ? 1 : 0)) * (espejoVo() ? -1 : 1);
    moverGotitaVo(s, dir, VO.teclas.salto, miIdentidad, dt, 3.1);
    const compu = compuVo();
    if (compu && VO.el && VivoComun.reloj('voley') >= e.inicio) pensarCompuVo(VO.el, compu.nivel, dt);
    if (VivoComun.reloj('voley') < e.inicio || VO.puntoMarcado) return;
    const b = VO.pelota;
    moverPelotaVo(b, dt);
    if (compu && VO.el && chocarVo(VO.el, b) && Date.now() - VO.ultimoToque > 120) { VO.ultimoToque = Date.now(); if (window.sfx) window.sfx.toque(); efectoToqueVo(b, 'el'); }
    if (chocarVo(s, b)) {
        const nuevo = Date.now() - VO.ultimoToque > 120;
        if (nuevo && window.sfx) window.sfx.toque();
        if (nuevo) efectoToqueVo(b, 'yo');
        VO.ultimoToque = Date.now();
        VO.tToque = window.ahoraSync();
        if (!VO.dueno || nuevo) { VO.dueno = true; VO.enlace && VO.enlace.enviar('golpe', { x: b.x, y: b.y, vx: b.vx, vy: b.vy, c: VO.clave }, true); }
    }
    if (VO.dueno && b.y + R_PELOTA >= PISO_VO) marcarPuntoVo(b.x < RED_X ? 'carito' : 'nico');
    else if (b.y + R_PELOTA >= PISO_VO) { b.y = PISO_VO - R_PELOTA; b.vy = 0; b.vx = 0; }
}
function moverGotitaVo(s, dir, salto, quien, dt, vel){
    s.vx = dir * vel;
    if (salto && s.y >= PISO_VO) s.vy = -6.6;
    s.vy = (s.vy || 0) + 0.42 * dt;
    s.x += s.vx * dt; s.y = Math.min(PISO_VO, s.y + s.vy * dt);
    if (s.y >= PISO_VO) s.vy = 0;
    const [a, b] = ladoVo(quien);
    s.x = Math.max(a, Math.min(b, s.x));
}
// La compu: se para un poco detrás de donde va a caer la pelota (así la
// devuelve hacia la red) y salta cuando la tiene encima. Según el nivel es
// más lenta y se equivoca más.
function pensarCompuVo(s, nivel, dt){
    const n = { facil: { vel: 1.9, error: 26, reaccion: 0.08 }, normal: { vel: 2.6, error: 12, reaccion: 0.2 }, dificil: { vel: 3.1, error: 3, reaccion: 0.5 } }[nivel] || { vel: 2.6, error: 12, reaccion: 0.2 };
    const b = VO.pelota, atras = miRival === 'nico' ? -1 : 1;
    // Dónde va a estar la pelota cuando baje a la altura de la cabeza (simulación corta).
    let px = b.x, py = b.y, vx = b.vx, vy = b.vy;
    for (let k = 0; k < 120 && py < PISO_VO - R_SLIME; k++) { vy += 0.24; px += vx; py += vy; if (px < R_PELOTA || px > W_VO - R_PELOTA) vx = -vx; }
    const deMiLado = miRival === 'nico' ? px < RED_X : px > RED_X;
    if (s.meta == null || Math.random() < n.reaccion) s.meta = (deMiLado ? px + atras * 8 : (miRival === 'nico' ? 80 : 240)) + (Math.random() - 0.5) * n.error;
    const dir = Math.abs(s.meta - s.x) < 3 ? 0 : Math.sign(s.meta - s.x);
    const salto = deMiLado && Math.abs(b.x - s.x) < 26 && b.y > 100 && b.vy > 0 && Math.random() < 0.6;
    moverGotitaVo(s, dir, salto, miRival, dt, n.vel);
}
function efectoToqueVo(b, clave){
    if (VO.anim[clave]) VO.anim[clave].toque = performance.now();
    if (!VO.fx) return;
    const x = aPantallaVo(b.x), fuerte = Math.hypot(b.vx, b.vy) > 6.5;
    VO.fx.chispas(x, b.y, ['#fff', '#ffe58a'], fuerte ? 10 : 5);
    VO.fx.onda(x, b.y, { radio: fuerte ? 16 : 10, vida: 240 });
    if (fuerte) VO.fx.texto(x, b.y - 14, '¡Remate!', { tam: 9, color: '#fff', vida: 600 });
}
function efectoPuntoVo(quien, x){
    VO.puntoT = performance.now();
    if (!VO.fx) return;
    const sx = aPantallaVo(x);
    VO.fx.particulas({ x: sx, y: PISO_VO, n: 18, color: ['#f1d9a0', '#e3c27e', '#fff3d0'], vel: 2.4, vida: 700, grav: 0.12, dir: -Math.PI / 2, abanico: 1.1, tam: 2.2 });
    VO.fx.onda(sx, PISO_VO + 2, { radio: 18, vida: 500, achatar: 0.35, color: 'rgba(160,120,60,0.6)' });
    VO.fx.temblor(3, 260);
    const mio = quien === miIdentidad;
    VO.fx.texto(W_VO / 2, 80, mio ? '¡Punto tuyo!' : `Punto de ${nombreJugador(quien)}`, { tam: 13, color: mio ? '#7dffb0' : '#ffb3c6', vida: 1200 });
    if (mio) VO.fx.confeti(W_VO / 4, 60, 30);
}
async function marcarPuntoVo(quien){
    if (VO.puntoMarcado) return;
    VO.puntoMarcado = quien;
    efectoPuntoVo(quien, VO.pelota.x);
    VO.pelota.y = PISO_VO - R_PELOTA; VO.pelota.vx = 0; VO.pelota.vy = 0;
    VO.enlace && VO.enlace.enviar('pique', { x: VO.pelota.x, c: VO.clave }, true);
    vibrarJ([20, 40, 20]);
    if (window.sfx) window.sfx[quien === miIdentidad ? 'punto' : 'error']();
    const clave = VO.clave;
    await Voley.accionEnCola((e) => {
        if (e.clave !== clave) return null;
        const puntos = { ...e.puntos, [quien]: e.puntos[quien] + 1 };
        const otro = quien === 'nico' ? 'carito' : 'nico';
        if (puntos[quien] >= PUNTOS_VO && puntos[quien] - puntos[otro] >= 2) return { puntos, ganador: quien, motivo: `¡${puntos.nico} a ${puntos.carito}!` };
        return { puntos, saque: quien, clave: Math.random().toString(36).slice(2, 7), inicio: VivoComun.reloj('voley') + 1400, ultimoPunto: quien, pique: Math.round(VO.pelota.x) };
    });
}
function dibujarVo(){
    const c = VO.ctx, e = VO.estado;
    if (!c || !e) return;
    const pt = performance.now(), t = pt / 1000;
    c.setTransform(2, 0, 0, 2, 0, 0);
    if (VO.fx) VO.fx.antes(c);
    const cielo = c.createLinearGradient(0, 0, 0, PISO_VO); cielo.addColorStop(0, '#62b9ec'); cielo.addColorStop(0.7, '#bfe6ff'); cielo.addColorStop(1, '#ffe9c2');
    c.fillStyle = cielo; c.fillRect(-10, -10, W_VO + 20, H_VO + 20);
    // Sol con rayos que giran
    const sx0 = aPantallaVo(268);
    c.save(); c.translate(sx0, 34); c.rotate(t * 0.2); c.fillStyle = 'rgba(255,240,170,0.35)'; for (let k = 0; k < 8; k++) { c.rotate(Math.PI / 4); c.fillRect(-1.5, 16, 3, 9); } c.restore();
    c.fillStyle = '#fff4b0'; c.beginPath(); c.arc(sx0, 34, 14, 0, Math.PI * 2); c.fill();
    // Nubes y gaviota
    c.fillStyle = 'rgba(255,255,255,0.85)'; for (let k = 0; k < 3; k++) { const x = ((t * 5 + k * 130) % (W_VO + 80)) - 40, y = 22 + k * 14; c.beginPath(); c.ellipse(x, y, 18, 6, 0, 0, Math.PI * 2); c.ellipse(x + 12, y - 3, 12, 6, 0, 0, Math.PI * 2); c.fill(); }
    const gx = ((t * 22) % (W_VO + 60)) - 30, gy = 50 + Math.sin(t * 1.5) * 6, ala = Math.sin(t * 9) * 3;
    c.strokeStyle = '#4a5a6a'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(gx - 6, gy - ala); c.quadraticCurveTo(gx - 3, gy - 2, gx, gy); c.quadraticCurveTo(gx + 3, gy - 2, gx + 6, gy - ala); c.stroke();
    // Mar con olas
    c.fillStyle = '#3aa0d8'; c.fillRect(0, 136, W_VO, 18);
    c.fillStyle = '#5fc0ea'; c.beginPath(); c.moveTo(0, 140); for (let x = 0; x <= W_VO; x += 8) c.lineTo(x, 139 + Math.sin(x / 14 + t * 2) * 1.6); c.lineTo(W_VO, 136); c.lineTo(0, 136); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.7)'; c.beginPath(); c.moveTo(0, 153); for (let x = 0; x <= W_VO; x += 6) c.lineTo(x, 151 + Math.sin(x / 9 + t * 3) * 1.4); c.lineTo(W_VO, 155); c.lineTo(0, 155); c.fill();
    // Palmeras
    for (const px of [aPantallaVo(18), aPantallaVo(302)]) {
        c.strokeStyle = '#8a5a30'; c.lineWidth = 4; c.beginPath(); c.moveTo(px, 160); c.quadraticCurveTo(px + 6, 120, px + 2, 96); c.stroke();
        for (let k = 0; k < 5; k++) { const a = -Math.PI / 2 + (k - 2) * 0.6 + Math.sin(t * 1.4 + k) * 0.06; c.strokeStyle = '#3f9a4a'; c.lineWidth = 3; c.beginPath(); c.moveTo(px + 2, 96); c.quadraticCurveTo(px + 2 + Math.cos(a) * 12, 96 + Math.sin(a) * 6 - 6, px + 2 + Math.cos(a) * 22, 96 + Math.sin(a) * 12 + 10); c.stroke(); }
    }
    // Arena con textura
    const ga = c.createLinearGradient(0, 152, 0, H_VO); ga.addColorStop(0, '#f4dfaa'); ga.addColorStop(1, '#e8c98a');
    c.fillStyle = ga; c.fillRect(0, 152, W_VO, H_VO - 152);
    c.fillStyle = 'rgba(180,140,80,0.3)'; for (let i = 0; i < 50; i++) c.fillRect((i * 73) % W_VO, 156 + (i * 29) % 40, 2, 1);
    // Red con postes, faja y sombra
    c.fillStyle = 'rgba(0,0,0,0.15)'; c.fillRect(RED_X - 1, PISO_VO + 1, 16, 3);
    c.fillStyle = '#5a4a36'; c.fillRect(RED_X - 2, RED_ALTO, 4, PISO_VO - RED_ALTO + 4);
    c.strokeStyle = 'rgba(255,255,255,0.8)'; c.lineWidth = 0.6;
    for (let y = RED_ALTO + 4; y < RED_ALTO + 40; y += 4) { c.beginPath(); c.moveTo(RED_X - 1.8, y); c.lineTo(RED_X + 1.8, y); c.stroke(); }
    c.fillStyle = '#fff'; c.fillRect(RED_X - 3, RED_ALTO - 1, 6, 3);
    c.fillStyle = '#e8496b'; c.fillRect(RED_X - 3, RED_ALTO + 2, 6, 1);
    const b = VO.pelota, pb = b ? VivoComun.posBola(b) : null;
    // Sombra de la pelota
    if (pb) { const sx = aPantallaVo(pb[0]), alto = Math.max(0, PISO_VO - pb[1]); c.fillStyle = `rgba(0,0,0,${Math.max(0.06, 0.25 - alto / 800)})`; c.beginPath(); c.ellipse(sx, PISO_VO + 2, 7 + alto / 40, 2, 0, 0, Math.PI * 2); c.fill(); }
    const gotita = (clave, s, col, brillo) => {
        if (!s) return;
        const x = aPantallaVo(s.x), y = s.y;
        // Estirarse al saltar, aplastarse al caer y temblequear al pegarle
        const a = VO.anim[clave] || (VO.anim[clave] = { y, aire: false, cae: 0, toque: 0, vy: 0 });
        const vy = y - a.y, enAire = y < PISO_VO - 0.5;
        if (a.aire && !enAire) { a.cae = pt; VO.fx && VO.fx.polvo(x, PISO_VO, 'rgba(240,220,170,0.9)', 6); }
        a.aire = enAire; a.vy = vy; a.y = y;
        const cae = Math.max(0, 1 - (pt - a.cae) / 200), est = enAire ? Math.min(0.18, Math.abs(vy) * 0.03) : 0, toq = Math.max(0, 1 - (pt - a.toque) / 220);
        const ex = 1 + cae * 0.22 - est * 0.5 + Math.sin(pt / 25) * toq * 0.06, ey = 1 - cae * 0.2 + est + Math.cos(pt / 25) * toq * 0.06;
        c.fillStyle = 'rgba(0,0,0,0.18)'; c.beginPath(); c.ellipse(x, PISO_VO + 2, R_SLIME * (0.7 + (s.y / PISO_VO) * 0.3), 3, 0, 0, Math.PI * 2); c.fill();
        c.save(); c.translate(x, y); c.scale(ex, ey);
        const gg = c.createRadialGradient(-8, -14, 2, 0, -6, R_SLIME + 4); gg.addColorStop(0, brillo); gg.addColorStop(0.45, col); gg.addColorStop(1, col);
        c.fillStyle = gg; c.beginPath(); c.arc(0, 0, R_SLIME, Math.PI, 0); c.closePath(); c.fill();
        c.fillStyle = 'rgba(255,255,255,0.55)'; c.beginPath(); c.ellipse(-8, -13, 4, 2.6, -0.5, 0, Math.PI * 2); c.fill();
        // Ojo que mira la pelota y parpadea
        const lado = x < W_VO / 2 ? 1 : -1, ox = lado * 9, oy = -12;
        const parp = (Math.floor(pt / 100) + (clave === 'yo' ? 0 : 19)) % 41 === 0;
        c.fillStyle = '#fff'; c.beginPath(); c.ellipse(ox, oy, 5, parp ? 0.8 : 5, 0, 0, Math.PI * 2); c.fill();
        if (pb && !parp) { const ang = Math.atan2(pb[1] - (y + oy), aPantallaVo(pb[0]) - (x + ox)); c.fillStyle = '#2a1f33'; c.beginPath(); c.arc(ox + Math.cos(ang) * 2.2, oy + Math.sin(ang) * 2.2, 2.4, 0, Math.PI * 2); c.fill(); c.fillStyle = '#fff'; c.fillRect(ox + Math.cos(ang) * 2.2 - 0.5, oy + Math.sin(ang) * 2.2 - 1.6, 1, 1); }
        // Boquita: sonríe si ganó el último punto
        const yoSoy = clave === 'yo' ? miIdentidad : miRival, ult = VO.puntoMarcado || (pt - VO.puntoT < 2500 && e.ultimoPunto);
        c.strokeStyle = 'rgba(30,20,40,0.7)'; c.lineWidth = 1.2; c.beginPath();
        if (ult === yoSoy) c.arc(lado * 6, -6, 3, 0.1, Math.PI - 0.1); else if (ult) c.arc(lado * 6, -3, 2.6, Math.PI + 0.3, -0.3); else c.arc(lado * 6, -6, 2.2, 0.3, Math.PI - 0.3);
        c.stroke();
        c.restore();
    };
    const colYo = miIdentidad === 'nico' ? ['#3d8bfd', '#a8d8ff'] : ['#e8496b', '#ffc2d4'];
    const colEl = miIdentidad === 'nico' ? ['#e8496b', '#ffc2d4'] : ['#3d8bfd', '#a8d8ff'];
    const o = VO.el;
    if (o) { const [rx, ry] = o.bot ? [o.x, o.y] : (VivoComun.suave(o) || [o.x, o.y]); gotita('el', { x: rx, y: Math.min(PISO_VO, ry) }, colEl[0], colEl[1]); }
    gotita('yo', VO.yo, colYo[0], colYo[1]);
    if (pb) {
        const x = aPantallaVo(pb[0]), y = pb[1];
        VO.estela.push({ x, y }); if (VO.estela.length > 7) VO.estela.shift();
        if (Math.hypot(b.vx, b.vy) > 6) VO.estela.forEach((q, k) => { c.globalAlpha = k / VO.estela.length * 0.35; c.fillStyle = '#fff'; c.beginPath(); c.arc(q.x, q.y, R_PELOTA * (0.4 + k / 14), 0, Math.PI * 2); c.fill(); });
        c.globalAlpha = 1;
        if (y < -R_PELOTA) { c.fillStyle = '#fff'; c.beginPath(); c.moveTo(x, 3); c.lineTo(x - 4, 9); c.lineTo(x + 4, 9); c.fill(); }
        else {
            c.save(); c.translate(x, y); c.rotate((espejoVo() ? -1 : 1) * (b.giro || 0));
            c.fillStyle = '#fff'; c.beginPath(); c.arc(0, 0, R_PELOTA, 0, Math.PI * 2); c.fill();
            c.strokeStyle = '#f5b93a'; c.lineWidth = 1.8; c.beginPath(); c.arc(0, 0, R_PELOTA - 1, -0.6, 1.4); c.stroke();
            c.strokeStyle = '#3d8bfd'; c.beginPath(); c.arc(0, 0, R_PELOTA - 1, 2.2, 3.9); c.stroke();
            c.strokeStyle = '#e8496b'; c.beginPath(); c.arc(0, 0, R_PELOTA - 1, 4.3, 5.4); c.stroke();
            c.restore();
            c.strokeStyle = 'rgba(0,0,0,0.25)'; c.lineWidth = 0.8; c.beginPath(); c.arc(x, y, R_PELOTA, 0, Math.PI * 2); c.stroke();
            c.fillStyle = 'rgba(255,255,255,0.8)'; c.beginPath(); c.arc(x - 2.5, y - 2.5, 1.6, 0, Math.PI * 2); c.fill();
        }
    }
    if (VO.fx) VO.fx.dibujar(c);
    // Marcador: el mío a la izquierda
    const yo = e.puntos[miIdentidad], el = e.puntos[miRival];
    c.fillStyle = 'rgba(42,31,51,0.65)'; c.font = 'bold 20px monospace'; c.textAlign = 'center';
    c.fillText(String(yo), W_VO / 2 - 40, 26); c.fillText(String(el), W_VO / 2 + 40, 26);
    c.font = 'bold 9px monospace'; c.fillText('—', W_VO / 2, 23);
    const saco = e.saque === miIdentidad;
    const falta = e.inicio - VivoComun.reloj('voley');
    if (e.fase === 'jugando' && (falta > 0 || VO.puntoMarcado)) {
        c.font = 'bold 13px monospace'; c.fillStyle = 'rgba(42,31,51,0.75)';
        const quien = VO.puntoMarcado || (falta > 0 && e.ultimoPunto);
        c.fillText(quien ? (quien === miIdentidad ? '¡Punto tuyo!' : `Punto de ${nombreJugador(quien)}`) : (saco ? 'Sacás vos' : `Saca ${nombreJugador(e.saque)}`), W_VO / 2, 52);
        const mp = Math.max(yo, el) >= PUNTOS_VO - 1 && Math.abs(yo - el) >= 1 && falta > 0;
        if (mp) { c.font = 'bold 9px monospace'; c.fillStyle = '#e8496b'; c.fillText(yo > el ? '¡Punto para ganar!' : '¡Salvá el partido!', W_VO / 2, 66); }
    }
    c.textAlign = 'left';
    if (VO.fx) VO.fx.despues(c);
    VivoComun.estado(c, W_VO, H_VO, VO.enlace, nombreJugador(miRival));
}
function bucleVo(ts){
    const pantalla = document.getElementById('pantalla-voley');
    if (!pantalla || !pantalla.classList.contains('activa')) { pararVo(); return; }
    if (VivoComun.pausa('voley')) { VO.ultimoTs = 0; dibujarVo(); VivoComun.cartelPausa(VO.ctx); VO.loop = requestAnimationFrame(bucleVo); return; }
    const dt = Math.min(2.5, (ts - (VO.ultimoTs || ts)) / 16.67 || 1);
    VO.ultimoTs = ts;
    pasoVo(dt);
    if (VO.enlace && VO.yo && Date.now() - VO.ultimoEnvio > 33) {
        VO.ultimoEnvio = Date.now();
        const m = { x: Math.round(VO.yo.x * 10) / 10, y: Math.round(VO.yo.y * 10) / 10, c: VO.clave };
        if (VO.dueno && VO.pelota) Object.assign(m, { bx: +VO.pelota.x.toFixed(1), by: +VO.pelota.y.toFixed(1), bvx: +VO.pelota.vx.toFixed(2), bvy: +VO.pelota.vy.toFixed(2) });
        VO.enlace.enviar('p', m);
    }
    if (VO.estado && VO.estado.fase === 'jugando') VivoComun.cuenta('VO', VO.estado.inicio);
    dibujarVo();
    VO.loop = requestAnimationFrame(bucleVo);
}
function arrancarVo(){
    VO.fx = VO.fx || FxVivo.crear();
    if (!VO.canvas) {
        VO.canvas = document.createElement('canvas');
        VO.canvas.width = W_VO * 2; VO.canvas.height = H_VO * 2;
        VO.canvas.className = 'lienzo-voley';
        VO.ctx = VO.canvas.getContext('2d');
        VO.controles = VivoComun.botones([[{ k: 'izq', txt: '◀' }, { k: 'der', txt: '▶' }], { k: 'salto', txt: '⤒', clase: 'salto' }], VO.teclas);
    }
    if (!VO.teclado) VO.teclado = VivoComun.teclado('pantalla-voley', { ArrowLeft: 'izq', KeyA: 'izq', ArrowRight: 'der', KeyD: 'der', ArrowUp: 'salto', KeyW: 'salto', Space: 'salto' }, VO.teclas);
    if (!VO.enlace && !compuVo()) {
        VO.enlace = EnlaceVivo.conectar('voley', {
            alMensaje(t, d, s) {
                if (d.c !== VO.clave) return;
                const b = VO.pelota;
                if (t === 'p') {
                    VO.el = VivoComun.recibir(VO.el, { x: d.x, y: d.y });
                    if (d.bx != null && !VO.dueno && b && !VO.puntoMarcado) VivoComun.adelantar(b, { x: d.bx, y: d.by, vx: d.bvx, vy: d.bvy }, moverPelotaVo);
                }
                if (t === 'golpe' && b) {
                    if (VO.dueno && s && VO.tToque > s) return; // yo la toqué después: sigo mandando yo
                    VO.dueno = false;
                    VivoComun.adelantar(b, { x: d.x, y: d.y, vx: d.vx, vy: d.vy }, moverPelotaVo);
                    if (window.sfx) window.sfx.toque();
                    efectoToqueVo(b, 'el');
                }
                if (t === 'pique' && b && !VO.puntoMarcado) efectoPuntoVo(d.x < RED_X ? 'carito' : 'nico', d.x);
                if (t === 'pique' && b) { VO.puntoMarcado = VO.puntoMarcado || (d.x < RED_X ? 'carito' : 'nico'); if (window.sfx) window.sfx[VO.puntoMarcado === miIdentidad ? 'punto' : 'error'](); Object.assign(b, { x: d.x, y: PISO_VO - R_PELOTA, vx: 0, vy: 0 }); }
            }
        });
    }
    if (!VO.loop) VO.loop = requestAnimationFrame(bucleVo);
    window._unsubLoopVoley = pararVo;
}
function pararVo(){
    if (VO.loop) cancelAnimationFrame(VO.loop);
    VO.loop = null;
    if (VO.enlace) VO.enlace.cerrar();
    VO.enlace = null; Object.keys(VO.teclas).forEach(k => { VO.teclas[k] = false; });
}

const Voley = JuegoTurnos.crear({
    id: 'voley',
    sinTurno: true,
    emojiListo: '🏐',
    compu: { paso: () => null }, // la compu juega adentro del bucle (pensarCompuVo)
    intro: `Vóley de playa en vivo: cada uno es una gotita en su mitad. Movete con ◀ ▶, saltá con ⤒ y pegale con la cabeza para pasarla por arriba de la red. Punto si pica en la arena del otro. ¡A ${PUNTOS_VO}, con 2 de diferencia!`,
    inicial: () => ({ puntos: { nico: 0, carito: 0 }, saque: Math.random() < 0.5 ? 'nico' : 'carito', clave: Math.random().toString(36).slice(2, 7), inicio: window.ahoraSync() + 3000, turno: null }),
    render(e) { return `<div id="voley-host"></div><div class="texto-centro texto-tenue" style="font-size:0.75rem;">Vos sos la gotita de la izquierda. ${nombreJugador('nico')} ${e.puntos.nico} — ${e.puntos.carito} ${nombreJugador('carito')}</div>`; },
    alDibujar(cont, e) {
        VO.estado = e;
        const host = cont.querySelector('#voley-host');
        if (!host) return;
        VivoComun.montar('voley', Voley, host, e);
        if (VO.clave !== e.clave) reiniciarVo(e);
        if (e.fase === 'jugando') { arrancarVo(); host.appendChild(VO.canvas); host.appendChild(VO.controles); }
        else if (VO.canvas) { host.appendChild(VO.canvas); dibujarVo(); }
    }
});
window._voley = VO; // para pruebas
