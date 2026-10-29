// ==================== HOCKEY DE AIRE (en vivo) ====================
// La mesa de los bares, en el celu: cada uno mueve su mazo con el dedo en
// su mitad y trata de meter el disco en el arco del otro. Gana el primero
// que hace 7. Va por js/enlace-vivo.js: el disco lo "manda" quien lo tocó
// último (lo simula y lo transmite), así nunca hay dos versiones peleando.
// Mundo: Nico abajo, Carito arriba; a Carito se le da vuelta la mesa.
const W_HOC = 240, H_HOC = 360, ARCO_HOC = 84, R_MAZO = 17, R_DISCO = 10, GOLES_HOC = 7;
const HC = { canvas: null, ctx: null, enlace: null, loop: null, estado: null, clave: null, mio: null, suyo: null, disco: null, dueno: false, dedo: null, ultimoEnvio: 0, golMarcado: null, ultimoTs: 0, fx: null, estela: [], golT: 0, toqueT: {}, tToque: 0 };

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
    const golpeBaranda = (x, y) => { if (HC.fx && !d.adelantando && Math.hypot(d.vx, d.vy) > 3) { const [sx, sy] = aPantallaHoc(x, y); HC.fx.chispas(sx, sy, ['#fff', '#a8d8ff'], 4); } };
    if (d.x < R_DISCO) { d.x = R_DISCO; d.vx = Math.abs(d.vx); golpeBaranda(0, d.y); }
    if (d.x > W_HOC - R_DISCO) { d.x = W_HOC - R_DISCO; d.vx = -Math.abs(d.vx); golpeBaranda(W_HOC, d.y); }
    const enArco = Math.abs(d.x - W_HOC / 2) < ARCO_HOC / 2;
    if (!enArco) {
        if (d.y < R_DISCO) { d.y = R_DISCO; d.vy = Math.abs(d.vy); golpeBaranda(d.x, 0); }
        if (d.y > H_HOC - R_DISCO) { d.y = H_HOC - R_DISCO; d.vy = -Math.abs(d.vy); golpeBaranda(d.x, H_HOC); }
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
    if (compu && HC.suyo) { pensarCompuHoc(HC.suyo, d, compu.nivel, dt); if (chocarHoc(HC.suyo, d)) { if (window.sfx) window.sfx.toque(); efectoToqueHoc(miRival, d); } }
    if (chocarHoc(m, d)) {
        if (window.sfx) window.sfx.toque();
        const nuevo = Date.now() - (HC.toqueT[miIdentidad] || 0) > 120;
        if (nuevo) efectoToqueHoc(miIdentidad, d);
        HC.tToque = window.ahoraSync();
        // Si los dos le pegan casi a la vez, manda el toque más nuevo.
        if (!HC.dueno || nuevo) { HC.dueno = true; HC.enlace && HC.enlace.enviar('golpe', { x: d.x, y: d.y, vx: d.vx, vy: d.vy, c: HC.clave }, true); }
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
function efectoToqueHoc(quien, d){
    HC.toqueT[quien] = Date.now();
    if (!HC.fx) return;
    const [sx, sy] = aPantallaHoc(d.x, d.y), fuerte = Math.hypot(d.vx, d.vy) > 7;
    HC.fx.chispas(sx, sy, ['#fff', '#ffe58a', quien === 'nico' ? '#9fd0ff' : '#ffb3c6'], fuerte ? 12 : 6);
    HC.fx.onda(sx, sy, { radio: fuerte ? 20 : 12, vida: 260 });
    if (fuerte) HC.fx.temblor(2, 140);
}
function efectoGolHoc(quien){
    HC.golT = performance.now();
    if (!HC.fx) return;
    // El arco donde entró: si el gol es mío, entró en el de arriba (el del otro).
    const arriba = quien === miIdentidad, y = arriba ? 10 : H_HOC - 10;
    HC.fx.confeti(W_HOC / 2, y, 50);
    HC.fx.temblor(5, 400);
    HC.fx.flash(quien === 'nico' ? 'rgba(90,170,255,0.3)' : 'rgba(255,90,130,0.3)', 240);
    HC.fx.texto(W_HOC / 2, H_HOC / 2, '¡GOL!', { tam: 34, color: quien === 'nico' ? '#3d8bfd' : '#e8496b', borde: '#fff', vida: 1300, sube: 4 });
}
async function marcarGolHoc(quien){
    if (HC.golMarcado) return;
    HC.golMarcado = quien;
    efectoGolHoc(quien);
    HC.enlace && HC.enlace.enviar('gol', { q: quien, c: HC.clave }, true);
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
    const ahora = performance.now();
    if (HC.fx) HC.fx.antes(c);
    // Mesa: hielo con agujeritos de aire, luz arriba y bordes con brillo
    const g = c.createLinearGradient(0, 0, 0, H_HOC); g.addColorStop(0, '#eaf5ff'); g.addColorStop(0.5, '#f7fbff'); g.addColorStop(1, '#e3f0ff');
    c.fillStyle = g; c.fillRect(-10, -10, W_HOC + 20, H_HOC + 20);
    c.fillStyle = 'rgba(120,160,210,0.22)'; for (let y = 14; y < H_HOC; y += 16) for (let x = 12 + ((y / 16) % 2) * 8; x < W_HOC; x += 16) c.fillRect(x, y, 1.4, 1.4);
    const luz = c.createRadialGradient(W_HOC / 2, H_HOC / 2, 10, W_HOC / 2, H_HOC / 2, 220); luz.addColorStop(0, 'rgba(255,255,255,0.6)'); luz.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = luz; c.fillRect(0, 0, W_HOC, H_HOC);
    c.strokeStyle = '#ff8fa3'; c.lineWidth = 4; c.strokeRect(2, 2, W_HOC - 4, H_HOC - 4);
    c.strokeStyle = 'rgba(255,255,255,0.7)'; c.lineWidth = 1; c.strokeRect(4.5, 4.5, W_HOC - 9, H_HOC - 9);
    c.strokeStyle = '#a8c8ff'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(0, H_HOC / 2); c.lineTo(W_HOC, H_HOC / 2); c.stroke();
    c.beginPath(); c.arc(W_HOC / 2, H_HOC / 2, 34, 0, Math.PI * 2); c.stroke();
    c.fillStyle = '#a8c8ff'; c.beginPath(); c.arc(W_HOC / 2, H_HOC / 2, 4, 0, Math.PI * 2); c.fill();
    c.strokeStyle = 'rgba(168,200,255,0.7)'; c.beginPath(); c.arc(W_HOC / 2, 0, 46, 0, Math.PI); c.stroke(); c.beginPath(); c.arc(W_HOC / 2, H_HOC, 46, Math.PI, 0); c.stroke();
    // Arcos con luz que se prende en el gol
    const gol = Math.max(0, 1 - (ahora - HC.golT) / 1200);
    c.fillStyle = '#2a1f33';
    c.fillRect(W_HOC / 2 - ARCO_HOC / 2, 0, ARCO_HOC, 5); c.fillRect(W_HOC / 2 - ARCO_HOC / 2, H_HOC - 5, ARCO_HOC, 5);
    if (gol > 0) { const arriba = HC.golMarcado ? HC.golMarcado === miIdentidad : true; const y = arriba ? 0 : H_HOC - 18; const gg = c.createLinearGradient(0, arriba ? 0 : H_HOC, 0, arriba ? 30 : H_HOC - 30); gg.addColorStop(0, `rgba(255,220,90,${0.8 * gol})`); gg.addColorStop(1, 'rgba(255,220,90,0)'); c.fillStyle = gg; c.fillRect(W_HOC / 2 - ARCO_HOC / 2 - 10, y, ARCO_HOC + 20, 18); }
    const ficha = (x, y, r, col, borde, golpe) => {
        const [sx, sy] = aPantallaHoc(x, y);
        c.fillStyle = 'rgba(40,60,100,0.22)'; c.beginPath(); c.ellipse(sx + 3, sy + 4, r, r * 0.9, 0, 0, Math.PI * 2); c.fill();
        const esc = 1 + golpe * 0.12;
        c.save(); c.translate(sx, sy); c.scale(esc, esc);
        const gm = c.createRadialGradient(-r * 0.35, -r * 0.4, 1, 0, 0, r); gm.addColorStop(0, '#fff'); gm.addColorStop(0.3, col); gm.addColorStop(1, borde);
        c.beginPath(); c.arc(0, 0, r, 0, Math.PI * 2); c.fillStyle = gm; c.fill();
        c.lineWidth = 2.5; c.strokeStyle = borde; c.stroke();
        // Manija de arriba
        c.beginPath(); c.arc(0, 0, r * 0.45, 0, Math.PI * 2); c.fillStyle = borde; c.fill();
        c.beginPath(); c.arc(-r * 0.12, -r * 0.14, r * 0.3, 0, Math.PI * 2); c.fillStyle = col; c.fill();
        c.fillStyle = 'rgba(255,255,255,0.7)'; c.beginPath(); c.arc(-r * 0.22, -r * 0.24, r * 0.1, 0, Math.PI * 2); c.fill();
        if (golpe > 0) { c.strokeStyle = `rgba(255,255,255,${golpe})`; c.lineWidth = 2; c.beginPath(); c.arc(0, 0, r + 4, 0, Math.PI * 2); c.stroke(); }
        c.restore();
    };
    const colYo = miIdentidad === 'nico' ? ['#a8d8ff', '#3d8bfd'] : ['#ffc2d4', '#e8496b'];
    const colEl = miIdentidad === 'nico' ? ['#ffc2d4', '#e8496b'] : ['#a8d8ff', '#3d8bfd'];
    const golpeDe = (q) => Math.max(0, 1 - (Date.now() - (HC.toqueT[q] || 0)) / 180);
    if (HC.suyo) { const pos = compuHoc() ? [HC.suyo.x, HC.suyo.y] : VivoComun.suave(HC.suyo); if (pos) ficha(pos[0], pos[1], R_MAZO, colEl[0], colEl[1], golpeDe(miRival)); }
    if (HC.disco) {
        const [dx, dy] = VivoComun.posBola(HC.disco), [sx, sy] = aPantallaHoc(dx, dy), vel = Math.hypot(HC.disco.vx, HC.disco.vy);
        HC.estela.push({ x: sx, y: sy }); if (HC.estela.length > 9) HC.estela.shift();
        if (vel > 4) HC.estela.forEach((q, k) => { c.globalAlpha = k / HC.estela.length * 0.3; c.fillStyle = '#2a1f33'; c.beginPath(); c.arc(q.x, q.y, R_DISCO * (0.4 + k / 18), 0, Math.PI * 2); c.fill(); });
        c.globalAlpha = 1;
        HC.disco.giro = (HC.disco.giro || 0) + (HC.disco.vx - HC.disco.vy) * 0.02;
        c.fillStyle = 'rgba(40,60,100,0.25)'; c.beginPath(); c.ellipse(sx + 2, sy + 3, R_DISCO, R_DISCO * 0.85, 0, 0, Math.PI * 2); c.fill();
        c.save(); c.translate(sx, sy); c.rotate(HC.disco.giro);
        c.beginPath(); c.arc(0, 0, R_DISCO, 0, Math.PI * 2); c.fillStyle = '#2a1f33'; c.fill(); c.strokeStyle = '#f5d9a0'; c.lineWidth = 2; c.stroke();
        c.strokeStyle = 'rgba(245,217,160,0.6)'; c.lineWidth = 1; c.beginPath(); c.arc(0, 0, R_DISCO * 0.55, 0.3, 2.2); c.stroke();
        c.fillStyle = 'rgba(255,255,255,0.25)'; c.beginPath(); c.arc(-3, -3, 2.5, 0, Math.PI * 2); c.fill();
        c.restore();
    }
    if (HC.mio) ficha(HC.mio.x, HC.mio.y, R_MAZO, colYo[0], colYo[1], golpeDe(miIdentidad));
    if (HC.fx) HC.fx.dibujar(c);
    // Marcador (salta en el gol)
    const yo = e.goles[miIdentidad], el = e.goles[miRival], pop = HC.golT ? FxVivo.rebote(Math.min(1, (ahora - HC.golT) / 500)) : 1;
    c.fillStyle = 'rgba(42,31,51,0.5)'; c.font = 'bold 28px monospace'; c.textAlign = 'right';
    c.save(); c.translate(W_HOC - 12, H_HOC / 2 - 10); if (HC.golMarcado === miRival || e.ultimoGol === miRival && ahora - HC.golT < 600) c.scale(pop, pop); c.fillText(String(el), 0, 0); c.restore();
    c.save(); c.translate(W_HOC - 12, H_HOC / 2 + 32); if (HC.golMarcado === miIdentidad || e.ultimoGol === miIdentidad && ahora - HC.golT < 600) c.scale(pop, pop); c.fillText(String(yo), 0, 0); c.restore();
    c.textAlign = 'left';
    const falta = e.inicio - VivoComun.reloj('hockey');
    if (e.fase === 'jugando' && falta > 0 && !HC.golMarcado && !(e.ultimoGol && ahora - HC.golT < 1300)) {
        const n = Math.ceil(falta / 1000), k = 1 - (falta % 1000) / 1000, esc = FxVivo.rebote(Math.min(1, k * 3));
        c.save(); c.translate(W_HOC / 2, H_HOC / 2); c.scale(esc, esc); c.fillStyle = 'rgba(42,31,51,0.75)'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = 'bold 30px monospace'; c.fillText(String(n), 0, 0); c.restore();
        c.textBaseline = 'alphabetic'; c.textAlign = 'left';
    }
    if (HC.fx) HC.fx.despues(c);
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
    HC.fx = HC.fx || FxVivo.crear();
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
            alMensaje(t, d, s) {
                if (d.c && d.c !== HC.clave) return;
                const avanzar = (o, k) => { o.adelantando = true; moverDiscoHoc(o, k); o.adelantando = false; };
                if (t === 'p') {
                    HC.suyo = VivoComun.recibir(HC.suyo, { x: d.mx, y: d.my });
                    // El disco del dueño se adelanta lo que tardó el mensaje y se corrige de a poco.
                    if (d.dx != null && !HC.dueno && HC.disco && !HC.golMarcado) VivoComun.adelantar(HC.disco, { x: d.dx, y: d.dy, vx: d.vx, vy: d.vy }, avanzar);
                }
                if (t === 'golpe' && HC.disco) {
                    if (HC.dueno && s && HC.tToque > s) return; // yo le pegué después: sigo mandando yo
                    HC.dueno = false;
                    VivoComun.adelantar(HC.disco, { x: d.x, y: d.y, vx: d.vx, vy: d.vy }, avanzar);
                    if (window.sfx) window.sfx.toque();
                    efectoToqueHoc(miRival, HC.disco);
                }
                if (t === 'gol' && !HC.golMarcado) { HC.golMarcado = d.q; efectoGolHoc(d.q); }
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
