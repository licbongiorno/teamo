// ==================== HOCKEY DE AIRE (en vivo) ====================
// La mesa de los bares, en el celu: cada uno mueve su mazo con el dedo en
// su mitad y trata de meter el disco en el arco del otro. Gana el primero
// que hace 7. Va por js/enlace-vivo.js: el disco lo "manda" quien lo tocó
// último (lo simula y lo transmite), así nunca hay dos versiones peleando.
// Mundo: Nico abajo, Carito arriba; a Carito se le da vuelta la mesa.
const W_HOC = 240, H_HOC = 360, ARCO_HOC = 84, R_MAZO = 17, R_DISCO = 10, GOLES_HOC = 7;
const HC = { canvas: null, ctx: null, enlace: null, loop: null, estado: null, clave: null, mio: null, suyo: null, disco: null, dueno: false, dedo: null, ultimoEnvio: 0, golMarcado: null, ultimoTs: 0 };

const girarHoc = () => miIdentidad === 'carito';
// Contra la compu: el mazo del otro lo mueve la compu en este celu (y el disco lo simulo yo).
const compuHoc = () => { const m = typeof window.modoCompu === 'function' && window.modoCompu(); return m && m.juego === 'hockey' ? m : null; };
const aPantallaHoc = (x, y) => girarHoc() ? [W_HOC - x, H_HOC - y] : [x, y];
function reiniciarHoc(e){
    HC.clave = e.clave;
    const abajo = miIdentidad === 'nico';
    HC.mio = { x: W_HOC / 2, y: abajo ? H_HOC - 50 : 50, vx: 0, vy: 0 };
    HC.suyo = HC.suyo || { x: W_HOC / 2, y: abajo ? 50 : H_HOC - 50 };
    // Saca quien recibió el gol: el disco arranca quieto en su mitad.
    HC.disco = { x: W_HOC / 2, y: e.saque === 'nico' ? H_HOC * 0.62 : H_HOC * 0.38, vx: 0, vy: 0 };
    HC.dueno = e.saque === miIdentidad || !!compuHoc();
    HC.golMarcado = null;
    if (compuHoc()) HC.suyo = { x: W_HOC / 2, y: abajo ? 50 : H_HOC - 50, vx: 0, vy: 0 };
}
function moverDiscoHoc(d, dt){
    d.x += d.vx * dt; d.y += d.vy * dt;
    d.vx *= Math.pow(0.996, dt); d.vy *= Math.pow(0.996, dt);
    if (d.x < R_DISCO) { d.x = R_DISCO; d.vx = Math.abs(d.vx); }
    if (d.x > W_HOC - R_DISCO) { d.x = W_HOC - R_DISCO; d.vx = -Math.abs(d.vx); }
    const enArco = Math.abs(d.x - W_HOC / 2) < ARCO_HOC / 2;
    if (!enArco) {
        if (d.y < R_DISCO) { d.y = R_DISCO; d.vy = Math.abs(d.vy); }
        if (d.y > H_HOC - R_DISCO) { d.y = H_HOC - R_DISCO; d.vy = -Math.abs(d.vy); }
    }
}
// Choque mazo–disco: lo empuja afuera y le pasa la velocidad del mazo.
function chocarHoc(m, d){
    const dx = d.x - m.x, dy = d.y - m.y, dist = Math.hypot(dx, dy);
    if (dist >= R_MAZO + R_DISCO || dist === 0) return false;
    const nx = dx / dist, ny = dy / dist;
    d.x = m.x + nx * (R_MAZO + R_DISCO + 0.5); d.y = m.y + ny * (R_MAZO + R_DISCO + 0.5);
    const rel = (d.vx - m.vx) * nx + (d.vy - m.vy) * ny;
    if (rel < 0) { d.vx -= 1.9 * rel * nx; d.vy -= 1.9 * rel * ny; }
    d.vx += m.vx * 0.5; d.vy += m.vy * 0.5;
    const v = Math.hypot(d.vx, d.vy), max = 11;
    if (v > max) { d.vx *= max / v; d.vy *= max / v; }
    return true;
}
function pasoHoc(dt){
    const e = HC.estado;
    if (!e || e.fase !== 'jugando' || !HC.mio || VivoComun.reloj('hockey') < e.inicio) return;
    // Mi mazo sigue al dedo, sólo en mi mitad.
    const m = HC.mio, abajo = miIdentidad === 'nico';
    if (HC.dedo) {
        const tx = Math.max(R_MAZO, Math.min(W_HOC - R_MAZO, HC.dedo.x));
        const ty = abajo ? Math.max(H_HOC / 2 + R_MAZO, Math.min(H_HOC - R_MAZO, HC.dedo.y)) : Math.max(R_MAZO, Math.min(H_HOC / 2 - R_MAZO, HC.dedo.y));
        const nx = m.x + (tx - m.x) * Math.min(1, 0.55 * dt), ny = m.y + (ty - m.y) * Math.min(1, 0.55 * dt);
        m.vx = (nx - m.x) / dt; m.vy = (ny - m.y) / dt; m.x = nx; m.y = ny;
    } else { m.vx = 0; m.vy = 0; }
    const d = HC.disco;
    if (HC.golMarcado) return;
    moverDiscoHoc(d, dt);
    const compu = compuHoc();
    if (compu && HC.suyo) { pensarCompuHoc(HC.suyo, d, compu.nivel, dt); if (chocarHoc(HC.suyo, d) && window.sfx) window.sfx.toque(); }
    if (chocarHoc(m, d)) {
        if (window.sfx) window.sfx.toque();
        if (!HC.dueno) { HC.dueno = true; HC.enlace && HC.enlace.enviar('golpe', { x: d.x, y: d.y, vx: d.vx, vy: d.vy, c: HC.clave }, true); }
    }
    // Un mazo no puede meter el disco adentro de la baranda (se quedaba trabado en las esquinas).
    d.x = Math.max(R_DISCO, Math.min(W_HOC - R_DISCO, d.x));
    if (Math.abs(d.x - W_HOC / 2) >= ARCO_HOC / 2) d.y = Math.max(R_DISCO, Math.min(H_HOC - R_DISCO, d.y));
    if (HC.dueno) {
        // ¿Gol? Sólo lo decide el dueño del disco.
        if (d.y < -R_DISCO) marcarGolHoc('nico');
        else if (d.y > H_HOC + R_DISCO) marcarGolHoc('carito');
    }
}
// La compu: si el disco está en su mitad va a pegarle (desde atrás, para
// mandarlo al arco de enfrente); si no, cuida su arco.
function pensarCompuHoc(m, d, nivel, dt){
    const n = { facil: 2.2, normal: 3.4, dificil: 4.6 }[nivel] || 3.4;
    const arriba = miRival === 'carito'; // la mitad de la compu en el mundo
    const enSuMitad = arriba ? d.y < H_HOC / 2 : d.y > H_HOC / 2;
    let tx, ty;
    const atras = arriba ? -1 : 1, lento = Math.hypot(d.vx, d.vy) < 1.5;
    // Si el disco quedó quieto pegado, retrocede un poco para tomar envión (y apunta un poco al costado).
    if (enSuMitad && lento && Math.hypot(d.x - m.x, d.y - m.y) < R_MAZO + R_DISCO + 1.5 && !(m.retro > Date.now()) && !(m.golpeo > Date.now())) { m.retro = Date.now() + 350; m.lado = (Math.random() - 0.5) * 16; }
    if (m.retro > Date.now()) { tx = d.x + (m.lado || 0); ty = d.y + atras * (R_MAZO + 34); m.golpeo = m.retro + 700; }
    // Va a través del disco (apuntando un poco más allá) para pegarle con fuerza hacia el arco de enfrente.
    else if (enSuMitad) { tx = d.x + (m.lado || 0) * 0.5; ty = d.y - atras * 6; }
    else { tx = W_HOC / 2 + (d.x - W_HOC / 2) * 0.5; ty = arriba ? 45 : H_HOC - 45; }
    const dx = tx - m.x, dy = ty - m.y, dist = Math.hypot(dx, dy) || 1, paso = Math.min(dist, n * dt);
    const nx = m.x + dx / dist * paso, ny = m.y + dy / dist * paso;
    const yMin = arriba ? R_MAZO : H_HOC / 2 + R_MAZO, yMax = arriba ? H_HOC / 2 - R_MAZO : H_HOC - R_MAZO;
    const fx = Math.max(R_MAZO, Math.min(W_HOC - R_MAZO, nx)), fy = Math.max(yMin, Math.min(yMax, ny));
    m.vx = (fx - m.x) / dt; m.vy = (fy - m.y) / dt; m.x = fx; m.y = fy;
}
async function marcarGolHoc(quien){
    if (HC.golMarcado) return;
    HC.golMarcado = quien;
    vibrarJ([20, 40, 20]);
    if (window.sfx) window.sfx[quien === miIdentidad ? 'punto' : 'error']();
    const clave = HC.clave;
    await Hockey.accion((e) => {
        if (e.clave !== clave) return null;
        const goles = { ...e.goles, [quien]: e.goles[quien] + 1 };
        const otro = quien === 'nico' ? 'carito' : 'nico';
        if (goles[quien] >= GOLES_HOC) return { goles, ganador: quien, motivo: `¡${goles.nico} a ${goles.carito}!` };
        return { goles, saque: otro, clave: Math.random().toString(36).slice(2, 7), inicio: VivoComun.reloj('hockey') + 1200, ultimoGol: quien };
    });
}
function dibujarHoc(){
    const c = HC.ctx, e = HC.estado;
    if (!c || !e) return;
    c.fillStyle = '#e9f4ff'; c.fillRect(0, 0, W_HOC, H_HOC);
    c.strokeStyle = '#ff8fa3'; c.lineWidth = 3; c.strokeRect(2, 2, W_HOC - 4, H_HOC - 4);
    c.strokeStyle = '#a8c8ff'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(0, H_HOC / 2); c.lineTo(W_HOC, H_HOC / 2); c.stroke();
    c.beginPath(); c.arc(W_HOC / 2, H_HOC / 2, 34, 0, Math.PI * 2); c.stroke();
    // Arcos (el de abajo en pantalla es siempre el mío)
    c.fillStyle = '#2a1f33';
    c.fillRect(W_HOC / 2 - ARCO_HOC / 2, 0, ARCO_HOC, 5); c.fillRect(W_HOC / 2 - ARCO_HOC / 2, H_HOC - 5, ARCO_HOC, 5);
    const ficha = (x, y, r, col, borde) => { const [sx, sy] = aPantallaHoc(x, y); c.beginPath(); c.arc(sx, sy, r, 0, Math.PI * 2); c.fillStyle = col; c.fill(); c.lineWidth = 3; c.strokeStyle = borde; c.stroke(); c.beginPath(); c.arc(sx, sy, r * 0.45, 0, Math.PI * 2); c.fillStyle = borde; c.fill(); };
    const colYo = miIdentidad === 'nico' ? ['#a8d8ff', '#3d8bfd'] : ['#ffc2d4', '#e8496b'];
    const colEl = miIdentidad === 'nico' ? ['#ffc2d4', '#e8496b'] : ['#a8d8ff', '#3d8bfd'];
    if (HC.suyo) { HC.suyo.rx = HC.suyo.rx == null ? HC.suyo.x : HC.suyo.rx + (HC.suyo.x - HC.suyo.rx) * 0.5; HC.suyo.ry = HC.suyo.ry == null ? HC.suyo.y : HC.suyo.ry + (HC.suyo.y - HC.suyo.ry) * 0.5; ficha(HC.suyo.rx, HC.suyo.ry, R_MAZO, colEl[0], colEl[1]); }
    if (HC.disco) { const [sx, sy] = aPantallaHoc(HC.disco.x, HC.disco.y); c.beginPath(); c.arc(sx, sy, R_DISCO, 0, Math.PI * 2); c.fillStyle = '#2a1f33'; c.fill(); c.strokeStyle = '#f5d9a0'; c.lineWidth = 2; c.stroke(); }
    if (HC.mio) ficha(HC.mio.x, HC.mio.y, R_MAZO, colYo[0], colYo[1]);
    // Marcador
    const yo = e.goles[miIdentidad], el = e.goles[miRival];
    c.fillStyle = 'rgba(42,31,51,0.55)'; c.font = 'bold 28px monospace'; c.textAlign = 'right';
    c.fillText(String(el), W_HOC - 12, H_HOC / 2 - 10); c.fillText(String(yo), W_HOC - 12, H_HOC / 2 + 32); c.textAlign = 'left';
    const falta = e.inicio - VivoComun.reloj('hockey');
    if (e.fase === 'jugando' && (falta > 0 || HC.golMarcado)) {
        c.fillStyle = 'rgba(42,31,51,0.7)'; c.textAlign = 'center'; c.font = 'bold 26px monospace';
        c.fillText(HC.golMarcado || (e.ultimoGol && falta > 0 && e.goles.nico + e.goles.carito > 0) ? '¡GOL!' : String(Math.ceil(falta / 1000)), W_HOC / 2, H_HOC / 2 + 9);
        c.textAlign = 'left';
    }
}
function bucleHoc(ts){
    const pantalla = document.getElementById('pantalla-hockey');
    if (!pantalla || !pantalla.classList.contains('activa')) { pararHoc(); return; }
    if (VivoComun.pausa('hockey')) { HC.ultimoTs = 0; dibujarHoc(); VivoComun.cartelPausa(HC.ctx); HC.loop = requestAnimationFrame(bucleHoc); return; }
    const dt = Math.min(2.5, (ts - (HC.ultimoTs || ts)) / 16.67 || 1);
    HC.ultimoTs = ts;
    pasoHoc(dt);
    if (HC.enlace && HC.mio && Date.now() - HC.ultimoEnvio > 33) {
        HC.ultimoEnvio = Date.now();
        const m = { mx: Math.round(HC.mio.x), my: Math.round(HC.mio.y), c: HC.clave };
        if (HC.dueno && HC.disco) Object.assign(m, { dx: +HC.disco.x.toFixed(1), dy: +HC.disco.y.toFixed(1), vx: +HC.disco.vx.toFixed(2), vy: +HC.disco.vy.toFixed(2) });
        HC.enlace.enviar('p', m);
    }
    if (HC.estado && HC.estado.fase === 'jugando') VivoComun.cuenta('HC', HC.estado.inicio);
    dibujarHoc();
    VivoComun.estado(HC.ctx, W_HOC, H_HOC, HC.enlace, nombreJugador(miRival));
    HC.loop = requestAnimationFrame(bucleHoc);
}
function arrancarHoc(){
    if (!HC.canvas) {
        HC.canvas = document.createElement('canvas');
        HC.canvas.width = W_HOC; HC.canvas.height = H_HOC;
        HC.canvas.className = 'lienzo-hockey';
        HC.ctx = HC.canvas.getContext('2d');
        const dedo = (ev) => {
            ev.preventDefault();
            const r = HC.canvas.getBoundingClientRect();
            let x = (ev.clientX - r.left) * W_HOC / r.width, y = (ev.clientY - r.top) * H_HOC / r.height;
            if (girarHoc()) { x = W_HOC - x; y = H_HOC - y; }
            HC.dedo = { x, y };
        };
        HC.canvas.addEventListener('pointerdown', (ev) => { HC.canvas.setPointerCapture && HC.canvas.setPointerCapture(ev.pointerId); dedo(ev); });
        HC.canvas.addEventListener('pointermove', (ev) => { if (HC.dedo || ev.pointerType === 'mouse') dedo(ev); });
        HC.canvas.addEventListener('pointerup', () => { HC.dedo = null; });
    }
    if (!HC.enlace && !compuHoc()) {
        HC.enlace = EnlaceVivo.conectar('hockey', {
            alMensaje(t, d) {
                if (d.c && d.c !== HC.clave) return;
                if (t === 'p') {
                    HC.suyo = { ...(HC.suyo || {}), x: d.mx, y: d.my };
                    if (d.dx != null && !HC.dueno && HC.disco) {
                        // Corrijo suave hacia lo que dice el dueño.
                        HC.disco.x += (d.dx - HC.disco.x) * 0.5; HC.disco.y += (d.dy - HC.disco.y) * 0.5; HC.disco.vx = d.vx; HC.disco.vy = d.vy;
                    }
                }
                if (t === 'golpe' && HC.disco) { HC.dueno = false; Object.assign(HC.disco, { x: d.x, y: d.y, vx: d.vx, vy: d.vy }); if (window.sfx) window.sfx.toque(); }
            }
        });
    }
    if (!HC.loop) HC.loop = requestAnimationFrame(bucleHoc);
    window._unsubLoopHockey = pararHoc;
}
function pararHoc(){
    if (HC.loop) cancelAnimationFrame(HC.loop);
    HC.loop = null;
    if (HC.enlace) HC.enlace.cerrar();
    HC.enlace = null;
    HC.dedo = null;
}

const Hockey = JuegoTurnos.crear({
    id: 'hockey',
    sinTurno: true,
    emojiListo: '🏒',
    compu: { paso: () => null }, // la compu juega adentro del bucle (pensarCompuHoc)
    intro: `La mesa de hockey de aire, en vivo: mové tu mazo con el dedo en tu mitad y meté el disco en el arco del otro. ¡Gana el primero en hacer ${GOLES_HOC}!`,
    inicial: () => ({ goles: { nico: 0, carito: 0 }, saque: Math.random() < 0.5 ? 'nico' : 'carito', clave: Math.random().toString(36).slice(2, 7), inicio: window.ahoraSync() + 3000, turno: null }),
    render(e) { return `<div id="hockey-host"></div><div class="texto-centro texto-tenue" style="font-size:0.75rem;">Tu arco es el de abajo. ${nombreJugador('nico')} ${e.goles.nico} — ${e.goles.carito} ${nombreJugador('carito')}</div>`; },
    alDibujar(cont, e) {
        HC.estado = e;
        const host = cont.querySelector('#hockey-host');
        if (!host) return;
        VivoComun.montar('hockey', Hockey, host, e);
        if (HC.clave !== e.clave) reiniciarHoc(e);
        if (e.fase === 'jugando') arrancarHoc();
        if (HC.canvas) { host.appendChild(HC.canvas); dibujarHoc(); }
    }
});
window._hockey = HC; // para pruebas
