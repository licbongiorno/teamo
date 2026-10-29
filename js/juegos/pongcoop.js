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
    ['#..#..#..#', '1111111111', '2.2#22#2.2', '3333LL3333', '.4444444M.'],
    ['5555555555', '#4#4#4#4#4', '3M33333L33', '2#2#22#2#2', '1111111111', '..######..'],
];
// # = ladrillo duro: hay que pegarle dos veces.
const COLORES_PC = { '#': '#9aa0b4', 1: '#ff6b6b', 2: '#ffb347', 3: '#ffd23a', 4: '#4cd18a', 5: '#3da8ff', L: '#c78bff', M: '#ff8fd8' };
const PC = { tocados: new Set(), canvas: null, ctx: null, enlace: null, loop: null, estado: null, clave: null, ladrillos: [], rotos: new Set(), bolas: [], dueno: false, yo: null, el: null, teclas: {}, dedo: null, ultimoEnvio: 0, ultimoTs: 0, perdida: false, lanzada: false , fx: null, golpeT: {}, estelas: [], vidaT: 0, nivelT: 0};

function armarLadrillosPc(nivel){
    const filas = NIVELES_PC[nivel - 1], l = [], bw = W_PC / COLS_PC;
    filas.forEach((f, y) => f.split('').forEach((ch, x) => { if (ch !== '.') l.push({ id: y * COLS_PC + x, x: x * bw + 1.5, y: 40 + y * 16, w: bw - 3, h: 12, tipo: ch }); }));
    return l;
}
const anchoPaletaPc = () => (PC.estado && PC.estado.larga && VivoComun.reloj('pongcoop') < PC.estado.larga ? 84 : 56);
// Contra la compu: la paleta del otro la mueve la compu en este celu.
const compuPc = () => { const m = typeof window.modoCompu === 'function' && window.modoCompu(); return m && m.juego === 'pongcoop' ? m : null; };
const limitesPc = (q) => q === 'nico' ? [0, W_PC / 2] : [W_PC / 2, W_PC];
function reiniciarPc(e){
    PC.clave = e.clave;
    PC.ladrillos = armarLadrillosPc(e.nivel);
    PC.rotos = new Set(e.rotos || []);
    PC.tocados = new Set(e.tocados || []);
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
    if (VivoComun.reloj('pongcoop') < e.inicio || PC.perdida) return;
    const w = anchoPaletaPc();
    const paletas = [{ x: PC.yo.x, vx: PC.yo.vx || 0, mia: true }, ...(PC.el ? [{ x: PC.el.x, vx: 0, mia: false }] : [])];
    const vivas = [];
    for (const b of PC.bolas) {
        b.x += b.vx * dt; b.y += b.vy * dt;
        paredesPc(b);
        // Paletas: el ángulo depende de dónde pega.
        for (const pa of paletas) {
            if (b.vy > 0 && b.y + R_BOLA_PC >= Y_PALETA && b.y < Y_PALETA + ALTO_PALETA && Math.abs(b.x - pa.x) < w / 2 + R_BOLA_PC) {
                const rel = (b.x - pa.x) / (w / 2), v = Math.min(6.2, Math.hypot(b.vx, b.vy) * 1.02);
                const ang = rel * 1.05;
                b.vx = Math.sin(ang) * v + pa.vx * 0.15; b.vy = -Math.abs(Math.cos(ang) * v); b.y = Y_PALETA - R_BOLA_PC;
                PC.golpeT[pa.mia ? 'yo' : 'el'] = performance.now();
                if (PC.fx) PC.fx.chispas(b.x, Y_PALETA, ['#fff', '#ffe58a'], 5);
                if (pa.mia) {
                    if (!(window.sonarArcade && sonarArcade('paleta')) && window.sfx) window.sfx.toque();
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
// Rebote en las paredes (también lo usa la predicción de las pelotas del otro).
function paredesPc(b, sinEfecto){
    const chispa = (x, y) => { if (!sinEfecto && PC.fx) PC.fx.chispas(x, y, ['#fff', '#c8b8ff'], 3); };
    if (b.x < R_BOLA_PC) { b.x = R_BOLA_PC; b.vx = Math.abs(b.vx); chispa(0, b.y); }
    if (b.x > W_PC - R_BOLA_PC) { b.x = W_PC - R_BOLA_PC; b.vx = -Math.abs(b.vx); chispa(W_PC, b.y); }
    if (b.y < 18 + R_BOLA_PC) { b.y = 18 + R_BOLA_PC; b.vy = Math.abs(b.vy); chispa(b.x, 18); }
}
const avanzarBolaPc = (b, dt) => { b.x += b.vx * dt; b.y += b.vy * dt; paredesPc(b, true); };
function efectoLadrilloPc(l, medio){
    if (!PC.fx) return;
    const col = COLORES_PC[l.tipo] || '#fff', cx = l.x + l.w / 2, cy = l.y + l.h / 2;
    if (medio) { PC.fx.chispas(cx, cy, ['#fff', '#d0d4e4'], 8); PC.fx.onda(cx, cy, { radio: 12, vida: 220 }); return; }
    PC.fx.particulas({ x: cx, y: cy, n: 10, color: [col, '#ffffff'], vel: 2.4, vida: 600, grav: 0.12, forma: 'cuadro', tam: 3.2, r: 6 });
    const especial = l.tipo === 'L' || l.tipo === 'M';
    PC.fx.texto(cx, cy, especial ? (l.tipo === 'L' ? '⬌ ¡Largas!' : '✦ ¡Multibola!') : '+10', { tam: especial ? 11 : 8, color: especial ? col : '#fff', vida: especial ? 1000 : 600, sube: 12 });
    if (especial) { PC.fx.onda(cx, cy, { radio: 30, vida: 450, color: col }); PC.fx.temblor(2.5, 200); }
}
const bolasPlanasPc = () => PC.bolas.flatMap(b => [+b.x.toFixed(1), +b.y.toFixed(1), +b.vx.toFixed(2), +b.vy.toFixed(2)]);
function desplanarPc(a){ const l = []; for (let i = 0; i + 3 < a.length; i += 4) l.push({ x: a[i], y: a[i + 1], vx: a[i + 2], vy: a[i + 3] }); return l; }
function romperPc(l, b){
    if (l.tipo === '#' && !PC.tocados.has(l.id)) {
        // Primer golpe a un ladrillo duro: queda rajado.
        PC.tocados.add(l.id);
        efectoLadrilloPc(l, true);
        if (window.sfx) window.sfx.golpe();
        PC.enlace && PC.enlace.enviar('roto', { id: l.id, medio: 1, c: PC.clave }, true);
        const clave = PC.clave, id = l.id;
        Rompeladrillos.accionEnCola((e) => e.clave !== clave || (e.tocados || []).includes(id) ? null : { tocados: [...(e.tocados || []), id] });
        return;
    }
    PC.rotos.add(l.id);
    efectoLadrilloPc(l);
    vibrarJ(6);
    if (!(window.sonarArcade && sonarArcade(l.tipo === 'L' || l.tipo === 'M' ? 'powerup' : 'ladrillo', { tono: 1 + (l.y || 0) / 200 })) && window.sfx) window.sfx[l.tipo === 'L' || l.tipo === 'M' ? 'logro' : 'rebote']();
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
        if (larga) cambios.larga = VivoComun.reloj('pongcoop') + 12000;
        if (rotos.length >= total) {
            if (e.nivel >= NIVELES_PC.length) return { ...cambios, ganador: 'empate', motivo: `🎉 ¡Rompieron todos los ladrillos de los ${NIVELES_PC.length} niveles! ${cambios.puntos} puntos con ${e.vidas} vida${e.vidas === 1 ? '' : 's'} de sobra.` };
            return { ...cambios, nivel: e.nivel + 1, rotos: [], tocados: [], larga: 0, clave: Math.random().toString(36).slice(2, 7), inicio: VivoComun.reloj('pongcoop') + 2500, saque: e.saque === 'nico' ? 'carito' : 'nico', aviso: `✅ ¡Nivel ${e.nivel} completo!` };
        }
        return cambios;
    });
}
function efectoVidaPc(){
    PC.vidaT = performance.now();
    if (!PC.fx) return;
    PC.fx.temblor(5, 380); PC.fx.flash('rgba(255,70,90,0.3)', 220);
    PC.fx.texto(W_PC / 2, 220, '💔 ¡Se cayó!', { tam: 16, color: '#ffb3c6', vida: 1200 });
}
async function perderVidaPc(){
    if (PC.perdida) return;
    PC.perdida = true;
    efectoVidaPc();
    PC.enlace && PC.enlace.enviar('cae', { c: PC.clave }, true);
    vibrarJ([30, 40, 30]);
    if (window.sfx) window.sfx.error();
    const clave = PC.clave;
    await Rompeladrillos.accionEnCola((e) => {
        if (e.clave !== clave) return null;
        const vidas = e.vidas - 1;
        if (vidas <= 0) return { vidas: 0, ganador: 'empate', motivo: `Se quedaron sin vidas en el nivel ${e.nivel}. ${e.puntos || 0} puntos.` };
        return { vidas, clave: Math.random().toString(36).slice(2, 7), inicio: VivoComun.reloj('pongcoop') + 2000, saque: e.saque === 'nico' ? 'carito' : 'nico', aviso: `💔 Se cayó la pelota. Quedan ${vidas}.` };
    });
}
function dibujarPc(){
    const c = PC.ctx, e = PC.estado;
    if (!c || !e) return;
    const pt = performance.now(), tt = pt / 1000;
    c.setTransform(2, 0, 0, 2, 0, 0);
    if (PC.fx) PC.fx.antes(c);
    const g = c.createLinearGradient(0, 0, 0, H_PC); g.addColorStop(0, '#150f30'); g.addColorStop(1, '#2d1f4a');
    c.fillStyle = g; c.fillRect(-10, -10, W_PC + 20, H_PC + 20);
    // Grilla de neón que se desliza despacio y estrellitas
    c.strokeStyle = 'rgba(160,120,255,0.08)'; c.lineWidth = 1;
    for (let y = ((tt * 12) % 24) + 200; y < H_PC; y += 24) { c.beginPath(); c.moveTo(0, y); c.lineTo(W_PC, y); c.stroke(); }
    for (let x = 0; x <= W_PC; x += 30) { c.beginPath(); c.moveTo(x, 200); c.lineTo(W_PC / 2 + (x - W_PC / 2) * 1.6, H_PC); c.stroke(); }
    for (let i = 0; i < 26; i++) { c.fillStyle = `rgba(255,255,255,${0.25 + Math.sin(tt * 2 + i) * 0.2})`; c.fillRect((i * 67) % W_PC, 24 + (i * 41) % 170, 1.2, 1.2); }
    c.strokeStyle = 'rgba(255,255,255,0.06)'; c.setLineDash([4, 6]); c.beginPath(); c.moveTo(W_PC / 2, 200); c.lineTo(W_PC / 2, H_PC); c.stroke(); c.setLineDash([]);
    // Ladrillos con volumen; los especiales laten y los duros tienen remaches
    for (const l of PC.ladrillos) {
        if (PC.rotos.has(l.id)) continue;
        const col = COLORES_PC[l.tipo] || '#fff', especial = l.tipo === 'L' || l.tipo === 'M';
        if (especial) { const late = 0.35 + Math.sin(pt / 200 + l.id) * 0.2; c.fillStyle = col; c.globalAlpha = late; c.fillRect(l.x - 2, l.y - 2, l.w + 4, l.h + 4); c.globalAlpha = 1; }
        const gl = c.createLinearGradient(0, l.y, 0, l.y + l.h); gl.addColorStop(0, '#ffffff'); gl.addColorStop(0.18, col); gl.addColorStop(1, col);
        c.fillStyle = gl; c.fillRect(l.x, l.y, l.w, l.h);
        c.fillStyle = 'rgba(0,0,0,0.22)'; c.fillRect(l.x, l.y + l.h - 2.5, l.w, 2.5); c.fillRect(l.x + l.w - 2, l.y, 2, l.h);
        // Brillo que pasa por la fila de vez en cuando
        const barrido = ((pt / 18 + l.y * 4) % 900) - 300;
        if (barrido > l.x - 10 && barrido < l.x + l.w) { c.fillStyle = 'rgba(255,255,255,0.35)'; c.fillRect(Math.max(l.x, barrido), l.y + 1, 5, l.h - 3); }
        if (l.tipo === '#') {
            c.fillStyle = 'rgba(40,40,60,0.6)'; [[3, 3], [l.w - 4, 3], [3, l.h - 4], [l.w - 4, l.h - 4]].forEach(([x, y]) => c.fillRect(l.x + x - 1, l.y + y - 1, 2, 2));
            if (PC.tocados.has(l.id)) { c.strokeStyle = 'rgba(30,30,45,0.8)'; c.lineWidth = 1; c.beginPath(); c.moveTo(l.x + 6, l.y + 1); c.lineTo(l.x + 12, l.y + 7); c.lineTo(l.x + 9, l.y + 11); c.moveTo(l.x + 12, l.y + 7); c.lineTo(l.x + 20, l.y + 5); c.stroke(); }
        }
        if (especial) { c.fillStyle = '#fff'; c.font = 'bold 9px monospace'; c.textAlign = 'center'; c.fillText(l.tipo === 'L' ? '⬌' : '✦', l.x + l.w / 2, l.y + 9.5); c.textAlign = 'left'; }
    }
    const w = anchoPaletaPc(), larga = w > 60;
    const paleta = (x, col, clave) => {
        const golpe = Math.max(0, 1 - (pt - (PC.golpeT[clave] || 0)) / 160);
        const ww = w * (1 + golpe * 0.08), hh = ALTO_PALETA * (1 - golpe * 0.3);
        const halo = c.createRadialGradient(x, Y_PALETA + 4, 2, x, Y_PALETA + 4, ww * 0.7); halo.addColorStop(0, col + '66'); halo.addColorStop(1, col + '00');
        c.fillStyle = halo; c.fillRect(x - ww, Y_PALETA - 14, ww * 2, 30);
        const gp = c.createLinearGradient(0, Y_PALETA, 0, Y_PALETA + hh); gp.addColorStop(0, '#ffffff'); gp.addColorStop(0.35, col); gp.addColorStop(1, col);
        c.fillStyle = gp; c.beginPath(); c.roundRect ? c.roundRect(x - ww / 2, Y_PALETA + (ALTO_PALETA - hh), ww, hh, 4) : c.rect(x - ww / 2, Y_PALETA, ww, hh); c.fill();
        if (larga) { const k = (pt / 400) % 1; c.fillStyle = 'rgba(255,255,255,0.5)'; c.fillRect(x - ww / 2 + k * (ww - 6), Y_PALETA + 1, 6, 2); }
        if (golpe > 0) { c.strokeStyle = `rgba(255,255,255,${golpe})`; c.lineWidth = 1.5; c.strokeRect(x - ww / 2 - 2, Y_PALETA - 2, ww + 4, ALTO_PALETA + 4); }
    };
    const col = (q) => q === 'nico' ? '#3d8bfd' : '#e8496b';
    if (PC.el) { const pos = compuPc() ? [PC.el.x] : VivoComun.suave(PC.el) || [PC.el.x]; paleta(pos[0], col(miRival), 'el'); }
    if (PC.yo) paleta(PC.yo.x, col(miIdentidad), 'yo');
    // Pelotas con estela y brillo (sin sombra difuminada, que es lenta en celus)
    PC.bolas.forEach((b, i) => {
        const [bx, by] = VivoComun.posBola(b);
        const est = PC.estelas[i] || (PC.estelas[i] = []); est.push([bx, by]); if (est.length > 8) est.shift();
        est.forEach(([x, y], k) => { c.globalAlpha = k / est.length * 0.35; c.fillStyle = '#c8b8ff'; c.beginPath(); c.arc(x, y, R_BOLA_PC * (0.4 + k / 14), 0, Math.PI * 2); c.fill(); });
        c.globalAlpha = 1;
        const gb = c.createRadialGradient(bx, by, 0.5, bx, by, R_BOLA_PC * 2.4); gb.addColorStop(0, 'rgba(255,255,255,0.9)'); gb.addColorStop(0.4, 'rgba(200,180,255,0.35)'); gb.addColorStop(1, 'rgba(200,180,255,0)');
        c.fillStyle = gb; c.beginPath(); c.arc(bx, by, R_BOLA_PC * 2.4, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#fff'; c.beginPath(); c.arc(bx, by, R_BOLA_PC, 0, Math.PI * 2); c.fill();
    });
    PC.estelas.length = PC.bolas.length;
    if (PC.fx) PC.fx.dibujar(c);
    // Tablero
    c.fillStyle = 'rgba(0,0,0,0.45)'; c.fillRect(0, 0, W_PC, 18);
    c.fillStyle = '#fff'; c.font = 'bold 10px monospace';
    const popVida = PC.vidaT ? Math.max(0, 1 - (pt - PC.vidaT) / 600) : 0;
    c.fillText(`Nivel ${e.nivel}/${NIVELES_PC.length} · `, 5, 13);
    const xv = 5 + c.measureText(`Nivel ${e.nivel}/${NIVELES_PC.length} · `).width;
    c.save(); c.translate(xv, 9); c.scale(1 + popVida * 0.4, 1 + popVida * 0.4); c.fillText('❤️'.repeat(Math.max(0, e.vidas)), 0, 4); c.restore();
    c.textAlign = 'right'; c.fillText(`${e.puntos || 0} pts`, W_PC - 12, 13); c.textAlign = 'left';
    if (e.larga && VivoComun.reloj('pongcoop') < e.larga) { c.fillStyle = '#c78bff'; c.font = 'bold 9px monospace'; c.textAlign = 'center'; c.fillText(`⬌ paletas largas ${Math.ceil((e.larga - VivoComun.reloj('pongcoop')) / 1000)}s`, W_PC / 2, 30); c.textAlign = 'left'; }
    const falta = e.inicio - VivoComun.reloj('pongcoop');
    if (e.fase === 'jugando' && falta > 0) {
        const n = Math.ceil(falta / 1000), k = 1 - (falta % 1000) / 1000, esc = FxVivo.rebote(Math.min(1, k * 3));
        if (e.aviso && e.aviso.startsWith('✅') && pt - PC.nivelT > 3000 && falta > 1800) { PC.nivelT = pt; if (PC.fx) { PC.fx.confeti(W_PC / 2, 120, 50); PC.fx.texto(W_PC / 2, 160, e.aviso, { tam: 13, color: '#7dffb0', vida: 1600 }); } }
        c.save(); c.translate(W_PC / 2, 245); c.scale(esc, esc); c.fillStyle = '#fff'; c.textAlign = 'center'; c.font = 'bold 28px monospace'; c.fillText(String(n), 0, 0); c.restore();
        c.fillStyle = '#fff'; c.textAlign = 'center'; c.font = '10px monospace'; c.fillText(e.saque === miIdentidad ? 'Sacás vos' : `Saca ${nombreJugador(e.saque)}`, W_PC / 2, 268); c.textAlign = 'left';
    }
    if (PC.fx) PC.fx.despues(c);
    VivoComun.estado(c, W_PC, H_PC, PC.enlace, nombreJugador(miRival));
}
function bucleRl(ts){
    const pantalla = document.getElementById('pantalla-pongcoop');
    if (!pantalla || !pantalla.classList.contains('activa')) { pararPc(); return; }
    if (VivoComun.pausa('pongcoop')) { PC.ultimoTs = 0; dibujarPc(); VivoComun.cartelPausa(PC.ctx); PC.loop = requestAnimationFrame(bucleRl); return; }
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
    PC.fx = PC.fx || FxVivo.crear();
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
                    PC.el = VivoComun.recibir(PC.el, { x: d.px, y: Y_PALETA });
                    if (d.b && !PC.dueno && !PC.perdida) {
                        const nuevas = desplanarPc(d.b);
                        // Las adelanto lo que tardó el mensaje y corrijo de a poco; si cambió la cantidad, copio todo.
                        if (nuevas.length !== PC.bolas.length) PC.bolas = nuevas;
                        else nuevas.forEach((n, i) => VivoComun.adelantar(PC.bolas[i], n, avanzarBolaPc));
                    }
                }
                if (t === 'toma') { PC.dueno = false; const nuevas = desplanarPc(d.b); PC.bolas = nuevas.map(n => VivoComun.adelantar({ ...n }, n, avanzarBolaPc)); PC.golpeT.el = performance.now(); if (window.sfx) window.sfx.toque(); }
                const lad = PC.ladrillos.find(x => x.id === d.id);
                if (t === 'roto' && d.medio) { PC.tocados.add(d.id); if (lad) efectoLadrilloPc(lad, true); if (window.sfx) window.sfx.golpe(); }
                else if (t === 'roto' && !PC.rotos.has(d.id)) { PC.rotos.add(d.id); if (lad) efectoLadrilloPc(lad); if (window.sfx) window.sfx.rebote(); }
                if (t === 'cae' && !PC.perdida) efectoVidaPc();
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
    inicial: () => ({ nivel: 1, vidas: VIDAS_PC, puntos: 0, rotos: [], tocados: [], larga: 0, saque: Math.random() < 0.5 ? 'nico' : 'carito', clave: Math.random().toString(36).slice(2, 7), inicio: window.ahoraSync() + 3000, turno: null }),
    tituloFin: (e) => (e.motivo || '').startsWith('🎉') ? '🧱 ¡Lo lograron juntos!' : '💔 Casi…',
    render() { return `<div id="pongcoop-host"></div><div class="texto-centro texto-tenue" style="font-size:0.75rem;">Arrastrá el dedo sobre la cancha (o ◀ ▶ en la compu). Tu mitad es la de tu color.</div>`; },
    alDibujar(cont, e) {
        PC.estado = e;
        const host = cont.querySelector('#pongcoop-host');
        if (!host) return;
        VivoComun.montar('pongcoop', Rompeladrillos, host, e);
        if (PC.clave !== e.clave) reiniciarPc(e);
        (e.rotos || []).forEach(id => PC.rotos.add(id));
        (e.tocados || []).forEach(id => PC.tocados && PC.tocados.add(id));
        if (e.fase === 'jugando') arrancarPc();
        if (PC.canvas) { host.appendChild(PC.canvas); dibujarPc(); }
    }
});
window._pongcoop = PC; // para pruebas
