// ==================== ROMPELADRILLOS DE A DOS (cooperativo en vivo) ====================
// Dos paletas abajo, una al lado de la otra (Nico a la izquierda, Carito a
// la derecha), y ladrillos arriba. Las vidas son de los dos: 3 entre ambos.
// Tres niveles; algunos ladrillos traen mejoras: ⬌ paletas largas y ✦
// multibola. Las pelotas las simula quien las tocó último (como en el
// Hockey) y los ladrillos rotos van como evento confiable + doc.
const W_PC = 300, H_PC = 400, Y_PALETA = 372, ALTO_PALETA = 8, R_BOLA_PC = 5, COLS_PC = 10, VIDAS_PC = 3;
const NIVELES_PC = [
    ['..........', '.11111111.', '.2222L222.', '.33333333.', '..........'],
    ['1111111111', '2.2.MM.2.2', '3333333333', '.4.4LL4.4.', '5555555555'],
    ['L........L', '.11.11.11.', '.22M22M22.', '3333333333', '4.44.44.44', '5555555555'],
];
const COLORES_PC = { 1: '#ff6b6b', 2: '#ffb347', 3: '#ffd23a', 4: '#4cd18a', 5: '#3da8ff', L: '#c78bff', M: '#ff8fd8' };
const PC = { canvas: null, ctx: null, enlace: null, loop: null, estado: null, clave: null, ladrillos: [], rotos: new Set(), bolas: [], dueno: false, yo: null, el: null, teclas: {}, dedo: null, ultimoEnvio: 0, ultimoTs: 0, perdida: false, lanzada: false };

function armarLadrillosPc(nivel){
    const filas = NIVELES_PC[nivel - 1], l = [], bw = W_PC / COLS_PC;
    filas.forEach((f, y) => f.split('').forEach((ch, x) => { if (ch !== '.') l.push({ id: y * COLS_PC + x, x: x * bw + 1.5, y: 40 + y * 16, w: bw - 3, h: 12, tipo: ch }); }));
    return l;
}
const anchoPaletaPc = () => (PC.estado && PC.estado.larga && window.ahoraSync() < PC.estado.larga ? 84 : 56);
// Contra la compu: la paleta del otro la mueve la compu en este celu.
const compuPc = () => { const m = typeof window.modoCompu === 'function' && window.modoCompu(); return m && m.juego === 'pongcoop' ? m : null; };
const limitesPc = (q) => q === 'nico' ? [0, W_PC / 2] : [W_PC / 2, W_PC];
function reiniciarPc(e){
    PC.clave = e.clave;
    PC.ladrillos = armarLadrillosPc(e.nivel);
    PC.rotos = new Set(e.rotos || []);
    const [a, b] = limitesPc(miIdentidad);
    PC.yo = PC.yo || { x: (a + b) / 2 };
    PC.yo.x = (a + b) / 2;
    PC.el = PC.el || { x: miIdentidad === 'nico' ? W_PC * 0.75 : W_PC * 0.25 };
    const sx = e.saque === 'nico' ? W_PC / 4 : W_PC * 3 / 4;
    PC.bolas = [{ x: sx, y: Y_PALETA - R_BOLA_PC - 2, vx: e.saque === 'nico' ? 1.6 : -1.6, vy: -3.4 }];
    PC.dueno = e.saque === miIdentidad || !!compuPc();
    PC.perdida = false;
}
function pensarCompuPc(o, nivel, dt){
    const vel = { facil: 2.2, normal: 3.2, dificil: 4.4 }[nivel] || 3.2;
    const [a, b] = limitesPc(miRival), w = anchoPaletaPc();
    const suyas = PC.bolas.filter(x => x.vy > 0 && x.x >= a - 10 && x.x <= b + 10).sort((x, y) => y.y - x.y);
    // Un poco corrida para no devolverla siempre derecho.
    const meta = suyas[0] ? suyas[0].x + (o.sesgo || 0) : (a + b) / 2;
    if (!suyas[0] || Math.random() < 0.01) o.sesgo = (Math.random() - 0.5) * w * 0.6;
    o.x += Math.max(-vel * dt, Math.min(vel * dt, meta - o.x));
    o.x = Math.max(a + w / 2, Math.min(b - w / 2, o.x));
}
function moverPaletaPc(dt){
    const p = PC.yo, [a, b] = limitesPc(miIdentidad), w = anchoPaletaPc();
    let x = p.x;
    if (PC.dedo != null) x += (PC.dedo - x) * Math.min(1, 0.5 * dt);
    else x += ((PC.teclas.der ? 1 : 0) - (PC.teclas.izq ? 1 : 0)) * 4.2 * dt;
    x = Math.max(a + w / 2, Math.min(b - w / 2, x));
    p.vx = (x - p.x) / dt; p.x = x;
}
function pasoPc(dt){
    const e = PC.estado;
    if (!e || e.fase !== 'jugando' || !PC.yo) return;
    moverPaletaPc(dt);
    const compu = compuPc();
    if (compu && PC.el) pensarCompuPc(PC.el, compu.nivel, dt);
    if (window.ahoraSync() < e.inicio || PC.perdida) return;
    const w = anchoPaletaPc();
    const paletas = [{ x: PC.yo.x, vx: PC.yo.vx || 0, mia: true }, ...(PC.el ? [{ x: PC.el.x, vx: 0, mia: false }] : [])];
    const vivas = [];
    for (const b of PC.bolas) {
        b.x += b.vx * dt; b.y += b.vy * dt;
        if (b.x < R_BOLA_PC) { b.x = R_BOLA_PC; b.vx = Math.abs(b.vx); }
        if (b.x > W_PC - R_BOLA_PC) { b.x = W_PC - R_BOLA_PC; b.vx = -Math.abs(b.vx); }
        if (b.y < 18 + R_BOLA_PC) { b.y = 18 + R_BOLA_PC; b.vy = Math.abs(b.vy); }
        // Paletas: el ángulo depende de dónde pega.
        for (const pa of paletas) {
            if (b.vy > 0 && b.y + R_BOLA_PC >= Y_PALETA && b.y < Y_PALETA + ALTO_PALETA && Math.abs(b.x - pa.x) < w / 2 + R_BOLA_PC) {
                const rel = (b.x - pa.x) / (w / 2), v = Math.min(6.2, Math.hypot(b.vx, b.vy) * 1.02);
                const ang = rel * 1.05;
                b.vx = Math.sin(ang) * v + pa.vx * 0.15; b.vy = -Math.abs(Math.cos(ang) * v); b.y = Y_PALETA - R_BOLA_PC;
                if (pa.mia) {
                    if (window.sfx) window.sfx.toque();
                    if (!PC.dueno) { PC.dueno = true; PC.enlace && PC.enlace.enviar('toma', { b: bolasPlanasPc(), c: PC.clave }, true); }
                }
            }
        }
        // Ladrillos: los rompe sólo el dueño; el otro sólo rebota (y después se corrige).
        for (const l of PC.ladrillos) {
            if (PC.rotos.has(l.id)) continue;
            if (b.x + R_BOLA_PC < l.x || b.x - R_BOLA_PC > l.x + l.w || b.y + R_BOLA_PC < l.y || b.y - R_BOLA_PC > l.y + l.h) continue;
            const dx = Math.min(b.x + R_BOLA_PC - l.x, l.x + l.w - (b.x - R_BOLA_PC)), dy = Math.min(b.y + R_BOLA_PC - l.y, l.y + l.h - (b.y - R_BOLA_PC));
            if (dx < dy) b.vx = -b.vx; else b.vy = -b.vy;
            if (PC.dueno) romperPc(l, b);
            break;
        }
        if (b.y - R_BOLA_PC <= H_PC) vivas.push(b);
    }
    PC.bolas = vivas;
    if (PC.dueno && !PC.bolas.length) perderVidaPc();
}
const bolasPlanasPc = () => PC.bolas.flatMap(b => [+b.x.toFixed(1), +b.y.toFixed(1), +b.vx.toFixed(2), +b.vy.toFixed(2)]);
function desplanarPc(a){ const l = []; for (let i = 0; i + 3 < a.length; i += 4) l.push({ x: a[i], y: a[i + 1], vx: a[i + 2], vy: a[i + 3] }); return l; }
function romperPc(l, b){
    PC.rotos.add(l.id);
    vibrarJ(6);
    if (window.sfx) window.sfx[l.tipo === 'L' || l.tipo === 'M' ? 'logro' : 'rebote']();
    if (l.tipo === 'M') {
        // Multibola: dos pelotas más desde esta.
        PC.bolas.push({ x: b.x, y: b.y, vx: -b.vx - 1, vy: b.vy }, { x: b.x, y: b.y, vx: b.vx + 1, vy: -Math.abs(b.vy) });
    }
    PC.enlace && PC.enlace.enviar('roto', { id: l.id, c: PC.clave }, true);
    const clave = PC.clave, id = l.id, total = PC.ladrillos.length, larga = l.tipo === 'L';
    Rompeladrillos.accionEnCola((e) => {
        if (e.clave !== clave || (e.rotos || []).includes(id)) return null;
        const rotos = [...(e.rotos || []), id];
        const cambios = { rotos, puntos: (e.puntos || 0) + (l.tipo === 'L' || l.tipo === 'M' ? 25 : 10) };
        if (larga) cambios.larga = window.ahoraSync() + 12000;
        if (rotos.length >= total) {
            if (e.nivel >= NIVELES_PC.length) return { ...cambios, ganador: 'empate', motivo: `🎉 ¡Rompieron todos los ladrillos de los ${NIVELES_PC.length} niveles! ${cambios.puntos} puntos con ${e.vidas} vida${e.vidas === 1 ? '' : 's'} de sobra.` };
            return { ...cambios, nivel: e.nivel + 1, rotos: [], larga: 0, clave: Math.random().toString(36).slice(2, 7), inicio: window.ahoraSync() + 2500, saque: e.saque === 'nico' ? 'carito' : 'nico', aviso: `✅ ¡Nivel ${e.nivel} completo!` };
        }
        return cambios;
    });
}
async function perderVidaPc(){
    if (PC.perdida) return;
    PC.perdida = true;
    vibrarJ([30, 40, 30]);
    if (window.sfx) window.sfx.error();
    const clave = PC.clave;
    await Rompeladrillos.accionEnCola((e) => {
        if (e.clave !== clave) return null;
        const vidas = e.vidas - 1;
        if (vidas <= 0) return { vidas: 0, ganador: 'empate', motivo: `Se quedaron sin vidas en el nivel ${e.nivel}. ${e.puntos || 0} puntos.` };
        return { vidas, clave: Math.random().toString(36).slice(2, 7), inicio: window.ahoraSync() + 2000, saque: e.saque === 'nico' ? 'carito' : 'nico', aviso: `💔 Se cayó la pelota. Quedan ${vidas}.` };
    });
}
function dibujarPc(){
    const c = PC.ctx, e = PC.estado;
    if (!c || !e) return;
    c.setTransform(2, 0, 0, 2, 0, 0);
    const g = c.createLinearGradient(0, 0, 0, H_PC); g.addColorStop(0, '#1d1638'); g.addColorStop(1, '#2d1f4a');
    c.fillStyle = g; c.fillRect(0, 0, W_PC, H_PC);
    c.strokeStyle = 'rgba(255,255,255,0.06)'; c.setLineDash([4, 6]); c.beginPath(); c.moveTo(W_PC / 2, 200); c.lineTo(W_PC / 2, H_PC); c.stroke(); c.setLineDash([]);
    for (const l of PC.ladrillos) {
        if (PC.rotos.has(l.id)) continue;
        c.fillStyle = COLORES_PC[l.tipo] || '#fff'; c.fillRect(l.x, l.y, l.w, l.h);
        c.fillStyle = 'rgba(255,255,255,0.3)'; c.fillRect(l.x, l.y, l.w, 2);
        c.fillStyle = 'rgba(0,0,0,0.2)'; c.fillRect(l.x, l.y + l.h - 2, l.w, 2);
        if (l.tipo === 'L' || l.tipo === 'M') { c.fillStyle = '#fff'; c.font = 'bold 9px monospace'; c.textAlign = 'center'; c.fillText(l.tipo === 'L' ? '⬌' : '✦', l.x + l.w / 2, l.y + 9.5); c.textAlign = 'left'; }
    }
    const w = anchoPaletaPc();
    const paleta = (x, col) => { c.fillStyle = col; c.beginPath(); c.roundRect ? c.roundRect(x - w / 2, Y_PALETA, w, ALTO_PALETA, 4) : c.rect(x - w / 2, Y_PALETA, w, ALTO_PALETA); c.fill(); c.fillStyle = 'rgba(255,255,255,0.35)'; c.fillRect(x - w / 2 + 3, Y_PALETA + 1, w - 6, 2); };
    const col = (q) => q === 'nico' ? '#3d8bfd' : '#e8496b';
    if (PC.el) { PC.el.rx = PC.el.rx == null || compuPc() ? PC.el.x : PC.el.rx + (PC.el.x - PC.el.rx) * 0.5; paleta(PC.el.rx, col(miRival)); }
    if (PC.yo) paleta(PC.yo.x, col(miIdentidad));
    c.shadowColor = '#fff'; c.shadowBlur = 8; c.fillStyle = '#fff';
    PC.bolas.forEach(b => { c.beginPath(); c.arc(b.x, b.y, R_BOLA_PC, 0, Math.PI * 2); c.fill(); });
    c.shadowBlur = 0;
    // Tablero
    c.fillStyle = 'rgba(0,0,0,0.4)'; c.fillRect(0, 0, W_PC, 18);
    c.fillStyle = '#fff'; c.font = 'bold 10px monospace';
    c.fillText(`Nivel ${e.nivel}/${NIVELES_PC.length} · ${'❤️'.repeat(Math.max(0, e.vidas))} · ${e.puntos || 0} pts`, 5, 13);
    VivoComun.estado(c, W_PC, H_PC, PC.enlace, nombreJugador(miRival));
    if (e.larga && window.ahoraSync() < e.larga) { c.fillStyle = '#c78bff'; c.font = 'bold 9px monospace'; c.textAlign = 'center'; c.fillText(`⬌ paletas largas ${Math.ceil((e.larga - window.ahoraSync()) / 1000)}s`, W_PC / 2, 30); c.textAlign = 'left'; }
    const falta = e.inicio - window.ahoraSync();
    if (e.fase === 'jugando' && falta > 0) { c.fillStyle = '#fff'; c.textAlign = 'center'; c.font = 'bold 28px monospace'; c.fillText(String(Math.ceil(falta / 1000)), W_PC / 2, 250); c.font = '10px monospace'; c.fillText(e.saque === miIdentidad ? 'Sacás vos' : `Saca ${nombreJugador(e.saque)}`, W_PC / 2, 268); c.textAlign = 'left'; }
}
function bucleRl(ts){
    const pantalla = document.getElementById('pantalla-pongcoop');
    if (!pantalla || !pantalla.classList.contains('activa')) { pararPc(); return; }
    const dt = Math.min(2.5, (ts - (PC.ultimoTs || ts)) / 16.67 || 1);
    PC.ultimoTs = ts;
    pasoPc(dt);
    if (PC.enlace && PC.yo && Date.now() - PC.ultimoEnvio > 33) {
        PC.ultimoEnvio = Date.now();
        const m = { px: Math.round(PC.yo.x * 10) / 10, c: PC.clave };
        if (PC.dueno) m.b = bolasPlanasPc();
        PC.enlace.enviar('p', m);
    }
    if (PC.estado && PC.estado.fase === 'jugando') VivoComun.cuenta('PC', PC.estado.inicio);
    dibujarPc();
    PC.loop = requestAnimationFrame(bucleRl);
}
function arrancarPc(){
    if (!PC.canvas) {
        PC.canvas = document.createElement('canvas');
        PC.canvas.width = W_PC * 2; PC.canvas.height = H_PC * 2;
        PC.canvas.className = 'lienzo-autitos';
        PC.ctx = PC.canvas.getContext('2d');
        const dedo = (ev) => { ev.preventDefault(); const r = PC.canvas.getBoundingClientRect(); PC.dedo = (ev.clientX - r.left) * W_PC / r.width; };
        PC.canvas.addEventListener('pointerdown', (ev) => { PC.canvas.setPointerCapture && PC.canvas.setPointerCapture(ev.pointerId); dedo(ev); });
        PC.canvas.addEventListener('pointermove', (ev) => { if (PC.dedo != null || ev.pointerType === 'mouse') dedo(ev); });
        PC.canvas.addEventListener('pointerup', () => { PC.dedo = null; });
        PC.canvas.addEventListener('pointerleave', (ev) => { if (ev.pointerType === 'mouse') PC.dedo = null; });
    }
    if (!PC.teclado) {
        const mapa = { ArrowLeft: 'izq', KeyA: 'izq', ArrowRight: 'der', KeyD: 'der' };
        PC.teclado = (ev) => { const k = mapa[ev.code]; if (!k || !document.getElementById('pantalla-pongcoop')?.classList.contains('activa') || (ev.target && ev.target.tagName === 'INPUT')) return; ev.preventDefault(); PC.teclas[k] = ev.type === 'keydown'; };
        window.addEventListener('keydown', PC.teclado); window.addEventListener('keyup', PC.teclado);
    }
    if (!PC.enlace && !compuPc()) {
        PC.enlace = EnlaceVivo.conectar('pongcoop', {
            alMensaje(t, d) {
                if (d.c !== PC.clave) return;
                if (t === 'p') {
                    PC.el = { ...(PC.el || {}), x: d.px };
                    if (d.b && !PC.dueno && !PC.perdida) {
                        const nuevas = desplanarPc(d.b);
                        // Corrijo suave las que coinciden; si cambió la cantidad, copio todo.
                        if (nuevas.length !== PC.bolas.length) PC.bolas = nuevas;
                        else nuevas.forEach((n, i) => { const b = PC.bolas[i]; b.x += (n.x - b.x) * 0.5; b.y += (n.y - b.y) * 0.5; b.vx = n.vx; b.vy = n.vy; });
                    }
                }
                if (t === 'toma') { PC.dueno = false; PC.bolas = desplanarPc(d.b); if (window.sfx) window.sfx.toque(); }
                if (t === 'roto' && !PC.rotos.has(d.id)) { PC.rotos.add(d.id); if (window.sfx) window.sfx.rebote(); }
            }
        });
    }
    if (!PC.loop) PC.loop = requestAnimationFrame(bucleRl);
    window._unsubLoopPongcoop = pararPc;
}
function pararPc(){
    if (PC.loop) cancelAnimationFrame(PC.loop);
    PC.loop = null;
    if (PC.enlace) PC.enlace.cerrar();
    PC.enlace = null; Object.keys(PC.teclas).forEach(k => { PC.teclas[k] = false; }); PC.dedo = null;
}

const Rompeladrillos = JuegoTurnos.crear({
    id: 'pongcoop',
    sinTurno: true,
    emojiListo: '🧱',
    compu: { paso: () => null }, // la compu juega adentro del bucle (pensarCompuPc)
    intro: `Juntos contra los ladrillos: cada uno tiene su paleta abajo (${nombreJugador('nico')} a la izquierda, ${nombreJugador('carito')} a la derecha). Arrastrá el dedo para moverla. Las 3 vidas son de los dos. ⬌ alarga las paletas y ✦ suma pelotas. ${NIVELES_PC.length} niveles.`,
    inicial: () => ({ nivel: 1, vidas: VIDAS_PC, puntos: 0, rotos: [], larga: 0, saque: Math.random() < 0.5 ? 'nico' : 'carito', clave: Math.random().toString(36).slice(2, 7), inicio: window.ahoraSync() + 3000, turno: null }),
    tituloFin: (e) => (e.motivo || '').startsWith('🎉') ? '🧱 ¡Lo lograron juntos!' : '💔 Casi…',
    render() { return `<div id="pongcoop-host"></div><div class="texto-centro texto-tenue" style="font-size:0.75rem;">Arrastrá el dedo sobre la cancha (o ◀ ▶ en la compu). Tu mitad es la de tu color.</div>`; },
    alDibujar(cont, e) {
        PC.estado = e;
        const host = cont.querySelector('#pongcoop-host');
        if (!host) return;
        if (PC.clave !== e.clave) reiniciarPc(e);
        (e.rotos || []).forEach(id => PC.rotos.add(id));
        if (e.fase === 'jugando') arrancarPc();
        if (PC.canvas) { host.appendChild(PC.canvas); dibujarPc(); }
    }
});
window._pongcoop = PC; // para pruebas
