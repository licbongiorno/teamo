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
const PV = { canvas: null, ctx: null, enlace: null, loop: null, estado: null, clave: null, caña: null, el: null, teclas: {}, ultimoEnvio: 0, ultimoTs: 0, tomadosOtro: {}, cerrando: false, burbujas: [] };

function rngPv(semilla){ let a = semilla >>> 0; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
// El pez del lugar i en su generación g (cada vez que lo pescan, aparece otro).
function pezPv(e, i){
    const g = (e.pescados || {})['p' + i] || 0, r = rngPv((e.semilla || 1) + i * 977 + g * 31);
    let u = r(), tipo = 0; for (let k = 0; k < TIPOS_PV.length; k++) { if (u < TIPOS_PV[k].prob) { tipo = k; break; } u -= TIPOS_PV[k].prob; }
    return { i, g, tipo, cx: 55 + r() * 190, cy: 80 + r() * 210, ax: 20 + r() * 55, ay: 10 + r() * 35, w: 0.3 + r() * 0.5, ph: r() * 6.28, ph2: r() * 6.28, nace: ((e.pescadosT || {})['p' + i]) || 0 };
}
function posPezPv(e, f){
    const t = (window.ahoraSync() - e.inicio) / 1000;
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
    if (!c || !e || e.fase !== 'jugando' || window.ahoraSync() < e.inicio) return;
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
    Object.assign(c, { st: 'listo', pez: null, x: muelleX(miIdentidad), y: AGUA_PV[1] - 6 });
    if (motivo && window.animJuegos) window.animJuegos.cartel(motivo, { dur: 900, sonido: false });
}
function pasoPv(dt){
    const e = PV.estado, c = PV.caña;
    if (!e || e.fase !== 'jugando' || !c) return;
    const ahora = window.ahoraSync();
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
async function pescarPv(f){
    const c = PV.caña, tipo = TIPOS_PV[f.tipo], quien = miIdentidad, clave = PV.clave;
    Object.assign(c, { st: 'listo', pez: null, x: muelleX(miIdentidad), y: AGUA_PV[1] - 6 });
    vibrarJ([20, 40, 20]);
    if (window.sfx) window.sfx[tipo.brilla ? 'logro' : 'acierto']();
    PV.enlace && PV.enlace.enviar('pescado', { i: f.i, c: clave }, true);
    let equipo = false;
    const res = await PescaVivo.accionEnCola((e) => {
        if (e.clave !== clave || ((e.pescados || {})['p' + f.i] || 0) !== f.g) return null;
        const ahora = window.ahoraSync(), ult = e.ultima;
        equipo = !!(ult && ult.q !== quien && ahora - ult.t < 4000);
        return {
            pescados: { ...(e.pescados || {}), ['p' + f.i]: f.g + 1 }, pescadosT: { ...(e.pescadosT || {}), ['p' + f.i]: ahora },
            puntos: (e.puntos || 0) + tipo.pts + (equipo ? 15 : 0), cantidad: (e.cantidad || 0) + 1,
            porJugador: { ...(e.porJugador || {}), [quien]: ((e.porJugador || {})[quien] || 0) + 1 },
            ultima: { q: quien, t: ahora }, aviso: `${nombreJugador(quien)} sacó ${tipo.art} ${tipo.nombre} (+${tipo.pts})${equipo ? ' · ¡pesca en equipo! +15' : ''}`,
        };
    });
    if (res && window.animJuegos) window.animJuegos.cartel(equipo ? `🤝 ¡Pesca en equipo! +${tipo.pts + 15}` : `🐟 ¡${tipo.art === 'una' ? 'Una' : 'Un'} ${tipo.nombre}! +${tipo.pts}`, { dur: 1000, sonido: false });
}
async function terminarPv(){
    if (PV.cerrando) return;
    PV.cerrando = true;
    const clave = PV.clave;
    await PescaVivo.accionEnCola((e) => {
        if (e.clave !== clave || window.ahoraSync() < e.inicio + DURA_PV) return null;
        const pts = e.puntos || 0, rec = e.record || 0, nuevo = pts > rec;
        return { record: Math.max(rec, pts), ganador: 'empate', motivo: `🎉 Pescaron ${e.cantidad || 0} peces juntos: ${pts} puntos${nuevo ? ' · ¡nuevo récord de la pareja!' : ` · récord: ${rec}`}` };
    });
}
function dibujarPezPv(c, x, y, dir, tipo, alfa){
    const t = TIPOS_PV[tipo], s = t.tam;
    c.save(); c.translate(x, y); c.scale(dir, 1); c.globalAlpha = alfa;
    if (t.brilla) { c.fillStyle = 'rgba(255,230,120,0.35)'; c.beginPath(); c.arc(0, 0, s * 1.8, 0, Math.PI * 2); c.fill(); }
    c.fillStyle = t.col; c.beginPath(); c.ellipse(0, 0, s, s * 0.55, 0, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.moveTo(-s * 0.8, 0); c.lineTo(-s * 1.5, -s * 0.5); c.lineTo(-s * 1.5, s * 0.5); c.closePath(); c.fill();
    c.fillStyle = t.panza; c.beginPath(); c.ellipse(s * 0.1, s * 0.2, s * 0.6, s * 0.25, 0, 0, Math.PI * 2); c.fill();
    if (tipo === 1) { c.fillStyle = '#fff'; c.fillRect(-s * 0.2, -s * 0.55, 2, s * 1.1); }
    c.fillStyle = '#1a1a2a'; c.beginPath(); c.arc(s * 0.55, -s * 0.12, 1.4, 0, Math.PI * 2); c.fill();
    c.restore();
}
function dibujarPv(){
    const c = PV.ctx, e = PV.estado;
    if (!c || !e) return;
    c.setTransform(2, 0, 0, 2, 0, 0);
    c.fillStyle = '#9fd47a'; c.fillRect(0, 0, W_PV, H_PV);
    const g = c.createLinearGradient(0, AGUA_PV[0], 0, AGUA_PV[1]); g.addColorStop(0, '#5ab4d8'); g.addColorStop(1, '#2a78b0');
    c.fillStyle = g; c.beginPath(); c.roundRect ? c.roundRect(8, AGUA_PV[0], W_PV - 16, AGUA_PV[1] - AGUA_PV[0], 26) : c.rect(8, AGUA_PV[0], W_PV - 16, AGUA_PV[1] - AGUA_PV[0]); c.fill();
    const t = Date.now() / 1000;
    c.strokeStyle = 'rgba(255,255,255,0.18)'; c.lineWidth = 1;
    for (let i = 0; i < 9; i++) { const y = AGUA_PV[0] + 20 + i * 31, x = 30 + ((i * 71 + t * 8) % 220); c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + 8, y - 3, x + 16, y); c.stroke(); }
    [[40, 70], [255, 120], [60, 260]].forEach(([x, y]) => { c.fillStyle = '#4f9a4a'; c.beginPath(); c.arc(x, y, 10, 0.3, Math.PI * 2); c.lineTo(x, y); c.fill(); });
    const ahora = window.ahoraSync();
    if (e.fase === 'jugando') for (let i = 0; i < PECES_PV; i++) {
        const f = pezPv(e, i);
        const mio = PV.caña && PV.caña.pez && PV.caña.pez.i === i && (PV.caña.st === 'pica' || PV.caña.st === 'recogiendo');
        const delOtro = PV.tomadosOtro[i] === f.g && PV.el && (PV.el.st === 'pica' || PV.el.st === 'recogiendo');
        if (mio) { dibujarPezPv(c, PV.caña.x + Math.sin(t * 20) * 1.5, PV.caña.y + 5, 1, f.tipo, 1); continue; }
        if (delOtro) { dibujarPezPv(c, PV.el.x + Math.sin(t * 20) * 1.5, PV.el.y + 5, 1, f.tipo, 1); continue; }
        const p = posPezPv(e, f), alfa = Math.min(1, (ahora - f.nace) / 1500);
        dibujarPezPv(c, p.x, p.y, p.dir, f.tipo, 0.85 * alfa);
    }
    // Muelle y pescadores
    c.fillStyle = '#a0703a'; c.fillRect(40, AGUA_PV[1] - 4, 80, 10); c.fillRect(180, AGUA_PV[1] - 4, 80, 10);
    c.fillStyle = '#7a5028'; for (let x = 44; x < 120; x += 12) c.fillRect(x, AGUA_PV[1] - 4, 1, 10); for (let x = 184; x < 260; x += 12) c.fillRect(x, AGUA_PV[1] - 4, 1, 10);
    const pescador = (q, caña) => {
        const x = muelleX(q), y = AGUA_PV[1] + 22, col = q === 'nico' ? '#3d8bfd' : '#e8496b';
        c.fillStyle = col; c.fillRect(x - 6, y - 10, 12, 14);
        c.fillStyle = '#f2c9a0'; c.beginPath(); c.arc(x, y - 15, 6, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#c8a050'; c.fillRect(x - 8, y - 22, 16, 3);
        const px = x + 4, py = y - 30;
        c.strokeStyle = '#5a3a1a'; c.lineWidth = 2; c.beginPath(); c.moveTo(x + 4, y - 6); c.lineTo(px, py); c.stroke();
        if (caña && caña.st !== 'listo') {
            const tenso = caña.st === 'recogiendo' ? caña.tension / 100 : 0;
            c.strokeStyle = tenso > 0.75 ? '#ff5a5a' : 'rgba(255,255,255,0.8)'; c.lineWidth = 0.8;
            c.beginPath(); c.moveTo(px, py); c.quadraticCurveTo((px + caña.x) / 2, Math.min(py, caña.y) - 10 * (1 - tenso), caña.x, caña.y); c.stroke();
            if (caña.st !== 'lanzando') { const hunde = caña.st === 'pica' ? Math.sin(Date.now() / 40) * 2 + 2 : 0; c.fillStyle = '#fff'; c.beginPath(); c.arc(caña.x, caña.y + hunde, 3, 0, Math.PI * 2); c.fill(); c.fillStyle = '#ff4a4a'; c.beginPath(); c.arc(caña.x, caña.y + hunde, 3, Math.PI, 0); c.fill(); }
        }
    };
    if (PV.el) { const pos = VivoComun.suave(PV.el); pescador(miRival, pos ? { ...PV.el, x: pos[0], y: pos[1] } : null); }
    else pescador(miRival, null);
    pescador(miIdentidad, PV.caña);
    // Tablero
    c.fillStyle = 'rgba(20,16,30,0.55)'; c.fillRect(0, 0, W_PV, 18);
    c.fillStyle = '#fff'; c.font = 'bold 10px monospace';
    const quedan = Math.max(0, Math.ceil((e.inicio + DURA_PV - ahora) / 1000));
    c.fillText(`🎣 ${e.puntos || 0} pts · ${e.cantidad || 0} peces`, 5, 13);
    c.textAlign = 'right'; c.fillText(`⏱ ${Math.floor(quedan / 60)}:${String(quedan % 60).padStart(2, '0')}`, W_PV - 12, 13); c.textAlign = 'left';
    if (e.record) { c.font = '8px monospace'; c.fillStyle = 'rgba(255,255,255,0.8)'; c.fillText(`récord ${e.record}`, 5, 30); }
    const cn = PV.caña;
    c.textAlign = 'center';
    if (cn && cn.st === 'pica') { c.fillStyle = '#fff'; c.font = 'bold 16px monospace'; c.fillText('¡PICÓ! Tocá 🎣', W_PV / 2, 70); }
    if (cn && cn.st === 'recogiendo') {
        c.fillStyle = 'rgba(20,16,30,0.6)'; c.fillRect(40, 340, 220, 30);
        c.fillStyle = cn.tension > 75 ? '#ff5a5a' : '#f5d36b'; c.fillRect(44, 344, 212 * cn.tension / 100, 8);
        c.fillStyle = '#4cd18a'; c.fillRect(44, 357, 212 * cn.avance / 100, 8);
        c.fillStyle = '#fff'; c.font = '8px monospace'; c.fillText('tensión', 20, 351); c.fillText('afuera', 20, 364);
    }
    if (cn && cn.st === 'listo' && e.fase === 'jugando' && ahora > e.inicio) { c.fillStyle = 'rgba(255,255,255,0.85)'; c.font = '9px monospace'; c.fillText('Tocá el agua para tirar la caña', W_PV / 2, AGUA_PV[0] + 14); }
    const falta = e.inicio - ahora;
    if (e.fase === 'jugando' && falta > 0) { c.fillStyle = '#fff'; c.font = 'bold 28px monospace'; c.fillText(String(Math.ceil(falta / 1000)), W_PV / 2, 190); }
    c.textAlign = 'left';
    VivoComun.estado(c, W_PV, H_PV, PV.enlace, nombreJugador(miRival), e.fase === 'jugando' && falta < -500);
}
function buclePv(ts){
    const pantalla = document.getElementById('pantalla-pescavivo');
    if (!pantalla || !pantalla.classList.contains('activa')) { pararPv(); return; }
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
    if (!PV.canvas) {
        PV.canvas = document.createElement('canvas');
        PV.canvas.width = W_PV * 2; PV.canvas.height = H_PV * 2;
        PV.canvas.className = 'lienzo-autitos';
        PV.ctx = PV.canvas.getContext('2d');
        PV.canvas.addEventListener('pointerdown', (ev) => {
            ev.preventDefault();
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
        if (PV.clave !== e.clave) reiniciarPv(e);
        if (e.fase === 'jugando') { arrancarPv(); host.appendChild(PV.canvas); host.appendChild(PV.controles); }
        else if (PV.canvas) { host.appendChild(PV.canvas); dibujarPv(); }
    }
});
window._pescavivo = PV; // para pruebas
