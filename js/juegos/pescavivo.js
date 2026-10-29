// ==================== PESCA EN VIVO (cooperativo) ====================
// Un lago compartido, en vivo: los peces nadan igual en los dos celus (su
// camino sale de la semilla y del reloj). Cada uno tira la caña tocando el
// agua; cuando un pez pica hay que apurarse a tocar 🎣 y después sacarlo
// sin que se corte la línea (mantener = tira, soltar = afloja). 3 minutos
// para juntar puntos entre los dos, contra el récord de la pareja.
// Si los dos sacan un pez casi a la vez: ¡pesca en equipo, +15!
const W_PV = 300, H_PV = 400, AGUA_PV = [40, 320], PECES_PV = 7, DURA_PV = 180000;
const TIPOS_PV = [
    { nombre: 'mojarra', art: 'una', pts: 10, col: '#8fb8d8', panza: '#dfeaf2', tam: 9, tiron: 0.35, prob: 0.55 },
    { nombre: 'pez payaso', art: 'un', pts: 20, col: '#ff8a3a', panza: '#ffffff', tam: 8, tiron: 0.55, prob: 0.3 },
    { nombre: 'pez globo', art: 'un', pts: 35, col: '#e8d25a', panza: '#fff6c8', tam: 10, tiron: 0.8, prob: 0.12 },
    { nombre: 'pez dorado', art: 'un', pts: 60, col: '#ffd700', panza: '#fff2a8', tam: 9, tiron: 1.1, prob: 0.03, brilla: true },
];
const PV = { canvas: null, ctx: null, enlace: null, loop: null, estado: null, clave: null, caña: null, el: null, teclas: {}, ultimoEnvio: 0, ultimoTs: 0, tomadosOtro: {}, cerrando: false, burbujas: [], fx: null, prevSt: {}, saltos: [], anillo: {} };

function rngPv(semilla){ let a = semilla >>> 0; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
// El pez del lugar i en su generación g (cada vez que lo pescan, aparece otro).
function pezPv(e, i){
    const g = (e.pescados || {})['p' + i] || 0, r = rngPv((e.semilla || 1) + i * 977 + g * 31);
    let u = r(), tipo = 0; for (let k = 0; k < TIPOS_PV.length; k++) { if (u < TIPOS_PV[k].prob) { tipo = k; break; } u -= TIPOS_PV[k].prob; }
    return { i, g, tipo, cx: 55 + r() * 190, cy: 80 + r() * 210, ax: 20 + r() * 55, ay: 10 + r() * 35, w: 0.3 + r() * 0.5, ph: r() * 6.28, ph2: r() * 6.28, nace: ((e.pescadosT || {})['p' + i]) || 0 };
}
function posPezPv(e, f){
    const t = (VivoComun.reloj('pescavivo') - e.inicio) / 1000;
    return { x: f.cx + f.ax * Math.sin(f.w * t + f.ph), y: f.cy + f.ay * Math.sin(f.w * 0.7 * t + f.ph2), dir: Math.cos(f.w * t + f.ph) >= 0 ? 1 : -1 };
}
const muelleX = (q) => q === 'nico' ? 80 : 220;
function reiniciarPv(e){
    PV.clave = e.clave;
    PV.caña = { st: 'listo', x: muelleX(miIdentidad), y: AGUA_PV[1] - 6, desde: 0, tx: 0, ty: 0, pez: null, tension: 0, avance: 0 };
    PV.el = null; PV.tomadosOtro = {}; PV.cerrando = false;
}
function tirarCañaPv(x, y){
    const c = PV.caña, e = PV.estado;
    if (!c || !e || e.fase !== 'jugando' || VivoComun.reloj('pescavivo') < e.inicio) return;
    if (c.st === 'pica') { empezarARecogerPv(); return; }
    if (c.st === 'recogiendo') return;
    if (y < AGUA_PV[0] + 4 || y > AGUA_PV[1] - 8) return;
    Object.assign(c, { st: 'lanzando', desde: Date.now(), ox: c.x, oy: c.y, tx: x, ty: y, pez: null });
    if (window.sfx) window.sfx.swoosh();
}
function empezarARecogerPv(){
    const c = PV.caña;
    Object.assign(c, { st: 'recogiendo', tension: 25, avance: 0 });
    vibrarJ(15);
}
function soltarPv(motivo){
    const c = PV.caña;
    if (c.pez) PV.enlace && PV.enlace.enviar('suelta', { i: c.pez.i, c: PV.clave }, true);
    if (c.pez && PV.fx) { PV.fx.salpicadura(c.x, c.y, undefined, 8); PV.fx.texto(c.x, c.y - 12, motivo && motivo.includes('cortó') ? '¡Se cortó!' : '¡Se fue!', { tam: 10, color: '#ffd0d8' }); }
    Object.assign(c, { st: 'listo', pez: null, x: muelleX(miIdentidad), y: AGUA_PV[1] - 6 });
    if (motivo && window.animJuegos) window.animJuegos.cartel(motivo, { dur: 900, sonido: false });
}
function pasoPv(dt){
    const e = PV.estado, c = PV.caña;
    if (!e || e.fase !== 'jugando' || !c) return;
    const ahora = VivoComun.reloj('pescavivo');
    if (ahora >= e.inicio + DURA_PV) { terminarPv(); return; }
    if (ahora < e.inicio) return;
    if (c.st === 'lanzando') {
        const f = Math.min(1, (Date.now() - c.desde) / 420);
        c.x = c.ox + (c.tx - c.ox) * f; c.y = c.oy + (c.ty - c.oy) * f - Math.sin(f * Math.PI) * 40;
        if (f >= 1) { c.st = 'esperando'; c.x = c.tx; c.y = c.ty; if (window.sfx) window.sfx.pop(); }
    } else if (c.st === 'esperando') {
        for (let i = 0; i < PECES_PV; i++) {
            const f = pezPv(e, i);
            if (ahora - f.nace < 1500 || PV.tomadosOtro[i] === f.g) continue;
            const p = posPezPv(e, f);
            if (Math.hypot(p.x - c.x, p.y - c.y) < 15) {
                Object.assign(c, { st: 'pica', pez: f, tPica: Date.now() });
                PV.enlace && PV.enlace.enviar('engancha', { i, g: f.g, c: PV.clave }, true);
                vibrarJ([20, 30, 20]);
                if (window.sfx) window.sfx.seleccionar();
                break;
            }
        }
    } else if (c.st === 'pica') {
        if (PV.teclas.tirar) empezarARecogerPv();
        else if (Date.now() - c.tPica > 1100) soltarPv('Se escapó… ¡hay que tocar 🎣 rápido!');
    } else if (c.st === 'recogiendo') {
        const tipo = TIPOS_PV[c.pez.tipo], t = Date.now() / 1000;
        const tiron = (0.5 + 0.5 * Math.sin(t * (2.4 + c.pez.tipo) + c.pez.ph)) * tipo.tiron;
        if (PV.teclas.tirar) { c.avance += 0.75 * dt; c.tension += (0.9 + tiron * 1.6) * dt; }
        else { c.avance = Math.max(0, c.avance - 0.12 * dt); c.tension = Math.max(0, c.tension - 1.5 * dt + tiron * 0.4 * dt); }
        // El pez se acerca al muelle a medida que lo sacás.
        c.x += (muelleX(miIdentidad) - c.x) * 0.004 * c.avance * dt / 10; c.y += (AGUA_PV[1] - 10 - c.y) * 0.004 * c.avance * dt / 10;
        if (c.tension >= 100) soltarPv('¡Se cortó la línea! 💔');
        else if (c.avance >= 100) pescarPv(c.pez);
    }
}
// El pez sale del agua y vuela en un arco hasta el pescador.
function saltoPezPv(tipo, x, y, q){
    PV.saltos.push({ tipo, x0: x, y0: y, x1: muelleX(q), y1: AGUA_PV[1] + 4, t: performance.now() });
    if (!PV.fx) return;
    PV.fx.salpicadura(x, y, undefined, 16);
    PV.fx.onda(x, y + 2, { radio: 20, vida: 600, achatar: 0.45 });
    const tp = TIPOS_PV[tipo];
    PV.fx.texto(muelleX(q), AGUA_PV[1] - 30, `+${tp.pts}`, { tam: 14, color: tp.brilla ? '#ffd700' : '#fff', vida: 1100 });
    if (tp.brilla) PV.fx.estrellitas(muelleX(q), AGUA_PV[1] - 10, 14);
}
async function pescarPv(f){
    const c = PV.caña, tipo = TIPOS_PV[f.tipo], quien = miIdentidad, clave = PV.clave;
    saltoPezPv(f.tipo, c.x, c.y, miIdentidad);
    Object.assign(c, { st: 'listo', pez: null, x: muelleX(miIdentidad), y: AGUA_PV[1] - 6 });
    vibrarJ([20, 40, 20]);
    if (window.sfx) window.sfx[tipo.brilla ? 'logro' : 'acierto']();
    PV.enlace && PV.enlace.enviar('pescado', { i: f.i, c: clave }, true);
    let equipo = false;
    const res = await PescaVivo.accionEnCola((e) => {
        if (e.clave !== clave || ((e.pescados || {})['p' + f.i] || 0) !== f.g) return null;
        const ahora = VivoComun.reloj('pescavivo'), ult = e.ultima;
        equipo = !!(ult && ult.q !== quien && ahora - ult.t < 4000);
        return {
            pescados: { ...(e.pescados || {}), ['p' + f.i]: f.g + 1 }, pescadosT: { ...(e.pescadosT || {}), ['p' + f.i]: ahora },
            puntos: (e.puntos || 0) + tipo.pts + (equipo ? 15 : 0), cantidad: (e.cantidad || 0) + 1,
            porJugador: { ...(e.porJugador || {}), [quien]: ((e.porJugador || {})[quien] || 0) + 1 },
            ultima: { q: quien, t: ahora }, aviso: `${nombreJugador(quien)} sacó ${tipo.art} ${tipo.nombre} (+${tipo.pts})${equipo ? ' · ¡pesca en equipo! +15' : ''}`,
        };
    });
    if (res && equipo && PV.fx) PV.fx.confeti(W_PV / 2, AGUA_PV[1] - 20, 40);
    if (res && window.animJuegos) window.animJuegos.cartel(equipo ? `🤝 ¡Pesca en equipo! +${tipo.pts + 15}` : `🐟 ¡${tipo.art === 'una' ? 'Una' : 'Un'} ${tipo.nombre}! +${tipo.pts}`, { dur: 1000, sonido: false });
}
async function terminarPv(){
    if (PV.cerrando) return;
    PV.cerrando = true;
    const clave = PV.clave;
    await PescaVivo.accionEnCola((e) => {
        if (e.clave !== clave || VivoComun.reloj('pescavivo') < e.inicio + DURA_PV) return null;
        const pts = e.puntos || 0, rec = e.record || 0, nuevo = pts > rec;
        return { record: Math.max(rec, pts), ganador: 'empate', motivo: `🎉 Pescaron ${e.cantidad || 0} peces juntos: ${pts} puntos${nuevo ? ' · ¡nuevo récord de la pareja!' : ` · récord: ${rec}`}` };
    });
}
function dibujarPezPv(c, x, y, dir, tipo, alfa, agitado){
    const t = TIPOS_PV[tipo], s = t.tam, ahora = performance.now() / 1000;
    // La cola aletea (más rápido si está enganchado) y el cuerpo ondula.
    const aleteo = Math.sin(ahora * (agitado ? 28 : 7) + tipo * 2 + x * 0.05) * (agitado ? 0.55 : 0.3);
    c.save(); c.translate(x, y); c.scale(dir, 1); c.globalAlpha = alfa;
    c.fillStyle = 'rgba(10,40,70,0.25)'; c.beginPath(); c.ellipse(2, 5, s * 1.1, s * 0.35, 0, 0, Math.PI * 2); c.fill();
    if (t.brilla) { const g = c.createRadialGradient(0, 0, 1, 0, 0, s * 2.2); g.addColorStop(0, 'rgba(255,230,120,0.55)'); g.addColorStop(1, 'rgba(255,230,120,0)'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, s * 2.2, 0, Math.PI * 2); c.fill(); }
    c.save(); c.translate(-s * 0.8, 0); c.rotate(aleteo);
    c.fillStyle = t.col; c.beginPath(); c.moveTo(0, 0); c.lineTo(-s * 0.75, -s * 0.55); c.quadraticCurveTo(-s * 0.55, 0, -s * 0.75, s * 0.55); c.closePath(); c.fill();
    c.restore();
    const g = c.createLinearGradient(0, -s * 0.55, 0, s * 0.55); g.addColorStop(0, t.col); g.addColorStop(1, t.panza);
    c.fillStyle = g; c.beginPath(); c.ellipse(0, 0, s, s * 0.55 * (1 + Math.sin(ahora * 3 + x) * 0.04), 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = t.col; c.beginPath(); c.moveTo(-s * 0.2, -s * 0.45); c.quadraticCurveTo(s * 0.1, -s * 0.95, s * 0.35, -s * 0.45); c.fill();
    if (tipo === 1) { c.fillStyle = '#fff'; c.fillRect(-s * 0.2, -s * 0.55, 2, s * 1.1); c.fillRect(s * 0.35, -s * 0.45, 1.5, s * 0.9); }
    if (tipo === 2) { c.fillStyle = 'rgba(120,90,20,0.5)'; for (let k = 0; k < 5; k++) c.fillRect(-s * 0.5 + k * s * 0.25, -s * 0.2 + (k % 2) * s * 0.25, 1.4, 1.4); }
    c.fillStyle = '#fff'; c.beginPath(); c.arc(s * 0.55, -s * 0.12, 2, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#1a1a2a'; c.beginPath(); c.arc(s * 0.6, -s * 0.12, 1.2, 0, Math.PI * 2); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.35)'; c.beginPath(); c.ellipse(-s * 0.1, -s * 0.25, s * 0.45, s * 0.12, 0, 0, Math.PI * 2); c.fill();
    c.restore();
}
function dibujarPv(){
    const c = PV.ctx, e = PV.estado;
    if (!c || !e) return;
    const fx = PV.fx, pt = performance.now(), t = Date.now() / 1000;
    c.setTransform(2, 0, 0, 2, 0, 0);
    if (fx) fx.antes(c);
    // Pasto con matas y florcitas
    c.fillStyle = '#93cc6c'; c.fillRect(-10, -10, W_PV + 20, H_PV + 20);
    c.fillStyle = 'rgba(70,140,60,0.35)'; for (let i = 0; i < 70; i++) { const x = (i * 53) % W_PV, y = (i * 97) % H_PV; if (y > AGUA_PV[0] - 4 && y < AGUA_PV[1] + 4 && x > 4 && x < W_PV - 4) continue; c.fillRect(x, y, 1, 3); c.fillRect(x + 2, y + 1, 1, 2); }
    ['#fff', '#ffd23a', '#ff9ab8'].forEach((col, k) => { for (let i = 0; i < 6; i++) { const x = (i * 131 + k * 37) % W_PV, y = (i * 61 + k * 23) % 34 + (i % 2 ? 4 : H_PV - 40); c.fillStyle = col; c.beginPath(); c.arc(x, y, 1.6, 0, Math.PI * 2); c.fill(); } });
    // Laguna con borde de arena, degradé y reflejo del cielo
    const W0 = 8, Wl = W_PV - 16, H0 = AGUA_PV[0], Hl = AGUA_PV[1] - AGUA_PV[0];
    c.fillStyle = '#d9c48f'; c.beginPath(); c.roundRect ? c.roundRect(W0 - 4, H0 - 4, Wl + 8, Hl + 8, 30) : c.rect(W0 - 4, H0 - 4, Wl + 8, Hl + 8); c.fill();
    const g = c.createLinearGradient(0, H0, 0, AGUA_PV[1]); g.addColorStop(0, '#6cc3e3'); g.addColorStop(0.5, '#3d97c8'); g.addColorStop(1, '#2a72a8');
    c.fillStyle = g; c.beginPath(); c.roundRect ? c.roundRect(W0, H0, Wl, Hl, 26) : c.rect(W0, H0, Wl, Hl); c.fill();
    c.save(); c.beginPath(); c.roundRect ? c.roundRect(W0, H0, Wl, Hl, 26) : c.rect(W0, H0, Wl, Hl); c.clip();
    // Nubes reflejadas que pasan
    c.fillStyle = 'rgba(255,255,255,0.12)'; for (let k = 0; k < 3; k++) { const x = ((t * 6 + k * 120) % (Wl + 120)) - 60, y = H0 + 40 + k * 80; c.beginPath(); c.ellipse(x, y, 40, 10, 0, 0, Math.PI * 2); c.ellipse(x + 25, y - 4, 26, 8, 0, 0, Math.PI * 2); c.fill(); }
    // Olitas y destellos de sol
    c.strokeStyle = 'rgba(255,255,255,0.22)'; c.lineWidth = 1;
    for (let i = 0; i < 12; i++) { const y = H0 + 14 + i * 23, x = 20 + ((i * 71 + t * 9) % 250); c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + 8, y - 3, x + 16, y); c.quadraticCurveTo(x + 24, y + 3, x + 32, y); c.stroke(); }
    for (let i = 0; i < 8; i++) { const a = (Math.sin(t * 3 + i * 1.7) + 1) / 2; c.fillStyle = `rgba(255,255,230,${a * 0.7})`; const x = 30 + (i * 37) % 240, y = H0 + 20 + (i * 53) % 240; c.fillRect(x, y, 2 + a * 2, 1); }
    c.restore();
    // Juncos que se mueven con el viento
    for (const [bx, by] of [[14, H0 + 30], [18, H0 + 200], [W_PV - 16, H0 + 90], [W_PV - 12, H0 + 240]]) for (let k = 0; k < 4; k++) {
        const vi = Math.sin(t * 1.6 + k + bx) * 2.5; c.strokeStyle = '#4f8a3a'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(bx + k * 2 - 3, by + 14); c.quadraticCurveTo(bx + k * 2 - 3 + vi * 0.5, by, bx + k * 2 - 3 + vi, by - 10 - k * 2); c.stroke();
        if (k === 1) { c.fillStyle = '#8a5a30'; c.fillRect(bx + k * 2 - 4 + vi, by - 16 - k * 2, 3, 7); }
    }
    // Hojas de nenúfar que flotan (una con flor)
    [[42, 72, 1], [255, 122, 0], [62, 262, 0], [230, 230, 1]].forEach(([x, y, flor], k) => {
        const bob = Math.sin(t * 1.3 + k) * 1.2;
        c.fillStyle = 'rgba(20,60,40,0.25)'; c.beginPath(); c.ellipse(x + 2, y + 3 + bob, 11, 7, 0, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#4f9a4a'; c.beginPath(); c.ellipse(x, y + bob, 11, 7, 0, 0.35, Math.PI * 2); c.lineTo(x, y + bob); c.fill();
        c.strokeStyle = '#3d7d3a'; c.lineWidth = 0.6; c.beginPath(); c.moveTo(x, y + bob); c.lineTo(x - 8, y + bob - 2); c.moveTo(x, y + bob); c.lineTo(x - 5, y + bob + 5); c.stroke();
        if (flor) { for (let p = 0; p < 6; p++) { c.fillStyle = p % 2 ? '#ffb3d1' : '#ffd0e4'; c.beginPath(); c.ellipse(x - 2 + Math.cos(p) * 2.5, y + bob - 2 + Math.sin(p) * 1.6, 2.6, 1.4, p, 0, Math.PI * 2); c.fill(); } c.fillStyle = '#ffd23a'; c.beginPath(); c.arc(x - 2, y + bob - 2, 1.3, 0, Math.PI * 2); c.fill(); }
    });
    // Libélula que da vueltas
    const lx = W_PV / 2 + Math.cos(t * 0.7) * 110, ly = H0 + 60 + Math.sin(t * 1.3) * 40 + Math.sin(t * 9) * 2;
    c.fillStyle = 'rgba(200,240,255,0.6)'; c.beginPath(); c.ellipse(lx - 3, ly - 1 + Math.sin(t * 40), 3.5, 1.2, -0.4, 0, Math.PI * 2); c.ellipse(lx + 3, ly - 1 - Math.sin(t * 40), 3.5, 1.2, 0.4, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#3aa0a0'; c.fillRect(lx - 0.8, ly - 2, 1.6, 7);
    const ahora = VivoComun.reloj('pescavivo');
    if (e.fase === 'jugando') for (let i = 0; i < PECES_PV; i++) {
        const f = pezPv(e, i);
        const mio = PV.caña && PV.caña.pez && PV.caña.pez.i === i && (PV.caña.st === 'pica' || PV.caña.st === 'recogiendo');
        const delOtro = PV.tomadosOtro[i] === f.g && PV.el && (PV.el.st === 'pica' || PV.el.st === 'recogiendo');
        if (mio) { dibujarPezPv(c, PV.caña.x + Math.sin(t * 20) * 1.5, PV.caña.y + 5, Math.sin(t * 6) > 0 ? 1 : -1, f.tipo, 1, true); continue; }
        if (delOtro) { const px = PV.el.rx != null ? PV.el.rx : PV.el.x, py = PV.el.ry != null ? PV.el.ry : PV.el.y; dibujarPezPv(c, px + Math.sin(t * 20) * 1.5, py + 5, Math.sin(t * 6) > 0 ? 1 : -1, f.tipo, 1, true); continue; }
        const p = posPezPv(e, f), alfa = Math.min(1, (ahora - f.nace) / 1500);
        dibujarPezPv(c, p.x, p.y, p.dir, f.tipo, 0.85 * alfa);
        // Burbujitas que suben de los peces
        if (fx && Math.random() < 0.006) fx.burbujas(p.x + p.dir * 6, p.y - 3, 1);
    }
    // Peces volando hacia el muelle
    PV.saltos = PV.saltos.filter(sv => pt - sv.t < 700);
    PV.saltos.forEach(sv => { const k = (pt - sv.t) / 700, x = sv.x0 + (sv.x1 - sv.x0) * k, y = sv.y0 + (sv.y1 - sv.y0) * k - Math.sin(k * Math.PI) * 60; c.save(); c.translate(x, y); c.rotate(k * Math.PI * 3); dibujarPezPv(c, 0, 0, 1, sv.tipo, 1, true); c.restore(); });
    // Muelles de madera con sombra
    for (const mx of [40, 180]) {
        c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(mx + 3, AGUA_PV[1] + 2, 80, 8);
        c.fillStyle = '#b27c42'; c.fillRect(mx, AGUA_PV[1] - 4, 80, 10);
        c.fillStyle = '#8a5a2c'; for (let x = mx + 4; x < mx + 80; x += 12) c.fillRect(x, AGUA_PV[1] - 4, 1, 10);
        c.fillStyle = '#6a4220'; c.fillRect(mx + 4, AGUA_PV[1] + 6, 4, 8); c.fillRect(mx + 72, AGUA_PV[1] + 6, 4, 8);
    }
    const pescador = (q, caña) => {
        const x = muelleX(q), y = AGUA_PV[1] + 22, col = q === 'nico' ? '#3d8bfd' : '#e8496b', oscuro = q === 'nico' ? '#1d4f9a' : '#8a1f3a';
        // Transiciones de la línea (salpica al caer el anzuelo, al picar, etc.)
        const st = caña ? caña.st : 'listo', prev = PV.prevSt[q];
        if (caña && prev !== st && fx) {
            if (st === 'esperando') { fx.salpicadura(caña.x, caña.y, undefined, 6); fx.onda(caña.x, caña.y + 1, { radio: 12, vida: 500, achatar: 0.45 }); }
            if (st === 'pica') { fx.salpicadura(caña.x, caña.y, undefined, 10); fx.texto(caña.x, caña.y - 16, '!', { tam: 18, color: '#ffd23a', vida: 700 }); }
        }
        PV.prevSt[q] = st;
        const respira = Math.sin(pt / 600 + (q === 'nico' ? 0 : 2)) * 0.8;
        c.fillStyle = 'rgba(0,0,0,0.2)'; c.beginPath(); c.ellipse(x, y + 5, 9, 2.5, 0, 0, Math.PI * 2); c.fill();
        c.fillStyle = oscuro; c.fillRect(x - 5, y, 4, 5); c.fillRect(x + 1, y, 4, 5);
        c.fillStyle = col; c.beginPath(); c.roundRect ? c.roundRect(x - 6, y - 11 + respira, 12, 13, 3) : c.rect(x - 6, y - 11 + respira, 12, 13); c.fill();
        c.fillStyle = '#f2c9a0'; c.beginPath(); c.arc(x, y - 16 + respira, 6, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#1a1a2a'; c.fillRect(x - 2.5, y - 17 + respira, 1.4, 1.6); c.fillRect(x + 1.2, y - 17 + respira, 1.4, 1.6);
        c.fillStyle = '#c8a050'; c.beginPath(); c.ellipse(x, y - 21 + respira, 9, 2.4, 0, 0, Math.PI * 2); c.fill(); c.fillRect(x - 5, y - 26 + respira, 10, 5);
        c.fillStyle = col; c.fillRect(x - 5, y - 23 + respira, 10, 1.4);
        // Caña: se dobla al recoger y hace el swing al tirar.
        const tenso = st === 'recogiendo' ? (caña.tension || 0) / 100 : 0;
        const swing = st === 'lanzando' ? Math.sin(Math.min(1, (Date.now() - (caña.desde || 0)) / 420) * Math.PI) : 0;
        const ang = -1.2 + swing * 0.9 + (st === 'pica' ? Math.sin(pt / 40) * 0.08 : 0);
        const largo = 26, bx = x + 5, by = y - 6;
        const px = bx + Math.cos(ang) * largo * (1 - tenso * 0.15), py = by + Math.sin(ang) * largo + tenso * 8;
        c.strokeStyle = '#5a3a1a'; c.lineWidth = 2; c.lineCap = 'round';
        c.beginPath(); c.moveTo(bx, by); c.quadraticCurveTo(bx + Math.cos(ang) * largo * 0.6, by + Math.sin(ang) * largo * 0.6 + tenso * 2, px, py); c.stroke();
        c.fillStyle = '#333'; c.beginPath(); c.arc(bx + 2, by - 2, 1.6, 0, Math.PI * 2); c.fill();
        if (caña && st !== 'listo') {
            c.strokeStyle = tenso > 0.75 ? '#ff5a5a' : 'rgba(255,255,255,0.85)'; c.lineWidth = tenso > 0.75 ? 1.1 : 0.8;
            const vib = tenso > 0.75 ? Math.sin(pt / 20) * 1.5 : 0;
            c.beginPath(); c.moveTo(px, py); c.quadraticCurveTo((px + caña.x) / 2 + vib, Math.min(py, caña.y) - 10 * (1 - tenso), caña.x, caña.y); c.stroke();
            if (st !== 'lanzando') {
                const hunde = st === 'pica' ? Math.sin(Date.now() / 40) * 2 + 2 : st === 'esperando' ? Math.sin(pt / 400) * 0.8 : 0;
                // Anillitos alrededor del corcho mientras espera
                if (st === 'esperando' && fx && pt - (PV.anillo[q] || 0) > 1400) { PV.anillo[q] = pt; fx.onda(caña.x, caña.y + 2, { radio: 9, vida: 900, achatar: 0.45, color: 'rgba(255,255,255,0.55)', ancho: 1 }); }
                c.fillStyle = '#fff'; c.beginPath(); c.arc(caña.x, caña.y + hunde, 3, 0, Math.PI * 2); c.fill(); c.fillStyle = '#ff4a4a'; c.beginPath(); c.arc(caña.x, caña.y + hunde, 3, Math.PI, 0); c.fill();
                c.fillStyle = 'rgba(255,255,255,0.7)'; c.fillRect(caña.x - 1, caña.y + hunde - 2.4, 1, 1);
            }
            if (st === 'recogiendo' && fx && Math.random() < 0.25) fx.salpicadura(caña.x, caña.y + 3, undefined, 1);
        }
    };
    if (PV.el) { const pos = VivoComun.suave(PV.el); pescador(miRival, pos ? { ...PV.el, x: pos[0], y: pos[1] } : null); }
    else pescador(miRival, null);
    pescador(miIdentidad, PV.caña);
    if (fx) fx.dibujar(c);
    // Tablero
    c.fillStyle = 'rgba(20,16,30,0.6)'; c.fillRect(0, 0, W_PV, 18);
    c.fillStyle = '#fff'; c.font = 'bold 10px monospace';
    const quedan = Math.max(0, Math.ceil((e.inicio + DURA_PV - ahora) / 1000));
    c.fillText(`🎣 ${e.puntos || 0} pts · ${e.cantidad || 0} peces`, 5, 13);
    c.textAlign = 'right'; c.fillStyle = quedan <= 15 ? '#ff8fa3' : '#fff'; c.fillText(`⏱ ${Math.floor(quedan / 60)}:${String(quedan % 60).padStart(2, '0')}`, W_PV - 12, 13); c.textAlign = 'left';
    if (e.record) { c.font = '8px monospace'; c.fillStyle = 'rgba(255,255,255,0.85)'; c.fillText(`récord ${e.record}`, 5, 30); }
    const cn = PV.caña;
    c.textAlign = 'center';
    if (cn && cn.st === 'pica') { const pop = 1 + Math.sin(pt / 70) * 0.08; c.save(); c.translate(W_PV / 2, 70); c.scale(pop, pop); c.fillStyle = '#fff'; c.strokeStyle = 'rgba(20,16,30,0.6)'; c.lineWidth = 3; c.font = 'bold 16px monospace'; c.strokeText('¡PICÓ! Tocá 🎣', 0, 0); c.fillText('¡PICÓ! Tocá 🎣', 0, 0); c.restore(); }
    if (cn && cn.st === 'recogiendo') {
        const sacude = cn.tension > 75 ? Math.sin(pt / 25) * 1.5 : 0;
        c.fillStyle = 'rgba(20,16,30,0.65)'; c.beginPath(); c.roundRect ? c.roundRect(38 + sacude, 338, 224, 34, 8) : c.rect(38, 338, 224, 34); c.fill();
        c.fillStyle = 'rgba(255,255,255,0.12)'; c.fillRect(44 + sacude, 344, 212, 8); c.fillRect(44 + sacude, 357, 212, 8);
        const gt = c.createLinearGradient(44, 0, 256, 0); gt.addColorStop(0, '#4cd18a'); gt.addColorStop(0.6, '#f5d36b'); gt.addColorStop(1, '#ff5a5a');
        c.fillStyle = gt; c.fillRect(44 + sacude, 344, 212 * cn.tension / 100, 8);
        c.fillStyle = '#5ab4ff'; c.fillRect(44 + sacude, 357, 212 * cn.avance / 100, 8);
        c.fillStyle = '#fff'; c.font = '8px monospace'; c.fillText('tensión', 20, 351); c.fillText('afuera', 20, 364);
    }
    if (cn && cn.st === 'listo' && e.fase === 'jugando' && ahora > e.inicio) { c.fillStyle = `rgba(255,255,255,${0.6 + Math.sin(pt / 300) * 0.25})`; c.font = '9px monospace'; c.fillText('Tocá el agua para tirar la caña', W_PV / 2, AGUA_PV[0] + 14); }
    const falta = e.inicio - ahora;
    if (e.fase === 'jugando' && falta > 0) { const n = Math.ceil(falta / 1000), k = 1 - (falta % 1000) / 1000, esc = FxVivo.rebote(Math.min(1, k * 3)); c.save(); c.translate(W_PV / 2, 180); c.scale(esc, esc); c.fillStyle = '#fff'; c.strokeStyle = 'rgba(20,16,30,0.5)'; c.lineWidth = 4; c.font = 'bold 30px monospace'; c.strokeText(String(n), 0, 0); c.fillText(String(n), 0, 0); c.restore(); }
    c.textAlign = 'left';
    if (fx) fx.despues(c);
    VivoComun.estado(c, W_PV, H_PV, PV.enlace, nombreJugador(miRival), e.fase === 'jugando' && falta < -500);
}
function buclePv(ts){
    const pantalla = document.getElementById('pantalla-pescavivo');
    if (!pantalla || !pantalla.classList.contains('activa')) { pararPv(); return; }
    if (VivoComun.pausa('pescavivo')) { PV.ultimoTs = 0; dibujarPv(); VivoComun.cartelPausa(PV.ctx); PV.loop = requestAnimationFrame(buclePv); return; }
    const dt = Math.min(2.5, (ts - (PV.ultimoTs || ts)) / 16.67 || 1);
    PV.ultimoTs = ts;
    pasoPv(dt);
    if (PV.enlace && PV.caña && Date.now() - PV.ultimoEnvio > 66) {
        PV.ultimoEnvio = Date.now();
        PV.enlace.enviar('p', { x: Math.round(PV.caña.x), y: Math.round(PV.caña.y), st: PV.caña.st, tension: Math.round(PV.caña.tension || 0), c: PV.clave });
    }
    if (PV.estado && PV.estado.fase === 'jugando') VivoComun.cuenta('PV', PV.estado.inicio);
    dibujarPv();
    PV.loop = requestAnimationFrame(buclePv);
}
function arrancarPv(){
    PV.fx = PV.fx || FxVivo.crear();
    if (!PV.canvas) {
        PV.canvas = document.createElement('canvas');
        PV.canvas.width = W_PV * 2; PV.canvas.height = H_PV * 2;
        PV.canvas.className = 'lienzo-autitos';
        PV.ctx = PV.canvas.getContext('2d');
        PV.canvas.addEventListener('pointerdown', (ev) => {
            ev.preventDefault();
            if (VivoComun.pausa('pescavivo')) return;
            const r = PV.canvas.getBoundingClientRect();
            if (PV.caña && (PV.caña.st === 'pica' || PV.caña.st === 'recogiendo')) { PV.teclas.tirar = true; if (PV.caña.st === 'pica') empezarARecogerPv(); return; }
            tirarCañaPv((ev.clientX - r.left) * W_PV / r.width, (ev.clientY - r.top) * H_PV / r.height);
        });
        const off = () => { if (PV.toqueCanvas !== false) PV.teclas.tirar = false; };
        PV.canvas.addEventListener('pointerup', off); PV.canvas.addEventListener('pointercancel', off);
        PV.controles = VivoComun.botones([{ k: 'tirar', txt: '🎣', clase: 'salto', aria: 'Tirar de la línea' }], PV.teclas);
        PV.controles.style.justifyContent = 'center';
    }
    if (!PV.teclado) PV.teclado = VivoComun.teclado('pantalla-pescavivo', { Space: 'tirar', ArrowUp: 'tirar', KeyW: 'tirar' }, PV.teclas);
    if (!PV.enlace) {
        PV.enlace = EnlaceVivo.conectar('pescavivo', {
            alMensaje(t, d) {
                if (d.c !== PV.clave) return;
                if (t === 'p') { PV.el = VivoComun.recibir(PV.el, { x: d.x, y: d.y }); PV.el.st = d.st; PV.el.tension = d.tension; }
                if (t === 'engancha') { PV.tomadosOtro[d.i] = d.g; if (PV.caña && PV.caña.pez && PV.caña.pez.i === d.i && PV.caña.st === 'pica' && miIdentidad === 'carito') soltarPv(); }
                if (t === 'suelta' || t === 'pescado') delete PV.tomadosOtro[d.i];
                if (t === 'pescado' && window.sfx) window.sfx.punto();
                if (t === 'pescado' && PV.el && PV.el.x != null) { const f = pezPv(PV.estado, d.i); saltoPezPv(f.tipo, PV.el.rx != null ? PV.el.rx : PV.el.x, PV.el.ry != null ? PV.el.ry : PV.el.y, miRival); }
                if (t === 'suelta' && PV.fx && PV.el && PV.el.x != null) PV.fx.salpicadura(PV.el.x, PV.el.y, undefined, 8);
            }
        });
    }
    if (!PV.loop) PV.loop = requestAnimationFrame(buclePv);
    window._unsubLoopPescavivo = pararPv;
}
function pararPv(){
    if (PV.loop) cancelAnimationFrame(PV.loop);
    PV.loop = null;
    if (PV.enlace) PV.enlace.cerrar();
    PV.enlace = null; Object.keys(PV.teclas).forEach(k => { PV.teclas[k] = false; });
}

const PescaVivo = JuegoTurnos.crear({
    id: 'pescavivo',
    sinTurno: true,
    emojiListo: '🎣',
    conservar: ['record'],
    intro: `Un lago para los dos, en vivo, durante 3 minutos. Tocá el agua para tirar la caña; cuando pique, tocá 🎣 rápido y sacalo sin que se corte la línea (mantené para tirar, soltá para aflojar). Juntan puntos entre los dos… ¡y si sacan uno casi a la vez, pesca en equipo!`,
    inicial: (previo) => ({ semilla: Math.floor(Math.random() * 1e9), pescados: {}, pescadosT: {}, puntos: 0, cantidad: 0, porJugador: { nico: 0, carito: 0 }, ultima: null, record: (previo && previo.record) || 0, clave: Math.random().toString(36).slice(2, 7), inicio: window.ahoraSync() + 3000, turno: null }),
    tituloFin: () => '🎣 ¡Qué buena pesca!',
    extraEspera: (e) => e && e.record ? `<div class="texto-tenue" style="margin-top:8px;font-size:0.8rem;">Récord de la pareja: <b>${e.record}</b> puntos</div>` : '',
    render(e) { return `<div id="pescavivo-host"></div><div class="texto-centro texto-tenue" style="font-size:0.75rem;">${nombreJugador('nico')} pescó ${(e.porJugador || {}).nico || 0} · ${nombreJugador('carito')} ${(e.porJugador || {}).carito || 0}</div>`; },
    alDibujar(cont, e) {
        PV.estado = e;
        const host = cont.querySelector('#pescavivo-host');
        if (!host) return;
        VivoComun.montar('pescavivo', PescaVivo, host, e);
        if (PV.clave !== e.clave) reiniciarPv(e);
        if (e.fase === 'jugando') { arrancarPv(); host.appendChild(PV.canvas); host.appendChild(PV.controles); }
        else if (PV.canvas) { host.appendChild(PV.canvas); dibujarPv(); }
    }
});
window._pescavivo = PV; // para pruebas
