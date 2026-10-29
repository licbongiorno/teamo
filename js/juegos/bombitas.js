// ==================== BOMBITAS (en vivo, tipo Bomberman) ====================
// Laberinto con bloques que se rompen. Cada uno pone bombas que explotan a
// los 2 segundos en cruz; si la explosión te toca, perdés la ronda. Algunos
// bloques esconden mejoras (🔥 más alcance, 💣 una bomba más). Al mejor de 3.
// Los dos arman el mismo laberinto con la misma semilla, cada uno mueve su
// personaje en su celu (posiciones por js/enlace-vivo.js) y las bombas
// viajan como eventos confiables con su hora de explosión (reloj compartido),
// así las explosiones —y las cadenas— dan igual en los dos celus.
const COLS_BOM = 13, FILAS_BOM = 11, T_BOM = 16, MECHA_BOM = 2000, FUEGO_BOM = 500, RONDAS_BOM = 2;
const BM = { canvas: null, ctx: null, enlace: null, loop: null, estado: null, clave: null, mapa: null, mejoras: null, bombas: [], fuegos: [], yo: null, el: null, teclas: {}, muerto: false, alcance: 2, maxBombas: 1, ultimoEnvio: 0, ultimoTs: 0, idsBomba: new Set(), fx: null, escombros: [], tMuerte: 0 };

function rngBom(semilla){ let a = semilla >>> 0; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function armarMapaBom(semilla){
    const r = rngBom(semilla), m = [], mej = {};
    for (let y = 0; y < FILAS_BOM; y++) {
        m.push([]);
        for (let x = 0; x < COLS_BOM; x++) {
            const borde = x === 0 || y === 0 || x === COLS_BOM - 1 || y === FILAS_BOM - 1;
            const pilar = x % 2 === 0 && y % 2 === 0;
            // Las esquinas de salida quedan libres.
            const salida = (x <= 2 && y <= 2) || (x >= COLS_BOM - 3 && y >= FILAS_BOM - 3);
            let c = borde || pilar ? '#' : (!salida && r() < 0.62 ? '=' : '.');
            if (c === '=' && r() < 0.22) mej[x + ',' + y] = r() < 0.5 ? 'fuego' : 'bomba';
            m[y].push(c);
        }
    }
    return { m, mej };
}
const salidaBom = (q) => q === 'nico' ? { x: 1, y: 1 } : { x: COLS_BOM - 2, y: FILAS_BOM - 2 };
function reiniciarBom(e){
    BM.clave = e.clave;
    const { m, mej } = armarMapaBom(e.semilla);
    BM.mapa = m; BM.mejoras = mej; BM.bombas = []; BM.fuegos = []; BM.idsBomba = new Set(); BM.escombros = [];
    if (BM.fx) BM.fx.limpiar();
    const s = salidaBom(miIdentidad), o = salidaBom(miRival);
    BM.yo = { x: s.x * T_BOM + 2, y: s.y * T_BOM + 2 };
    BM.el = { x: o.x * T_BOM + 2, y: o.y * T_BOM + 2 };
    BM.muerto = false; BM.alcance = 2; BM.maxBombas = 1;
}
const celdaBom = (x, y) => (BM.mapa[y] && BM.mapa[y][x]) || '#';
// Bomba sólida, salvo la que todavía tengo abajo (recién puesta, mía o del otro), para poder salir.
// Se cuenta toda la caja del personaje: si se miraba sólo el centro, al salir a medias quedaba trabado.
// (Mismas celdas que mira el movimiento: de x a x + 11.)
const pisaBom = (p, b) => !!p && Math.floor(p.x / T_BOM) <= b.x && Math.floor((p.x + 11) / T_BOM) >= b.x && Math.floor(p.y / T_BOM) <= b.y && Math.floor((p.y + 11) / T_BOM) >= b.y;
function bloqueaBom(cx, cy, p){
    const c = celdaBom(cx, cy);
    if (c === '#' || c === '=') return true;
    return BM.bombas.some(b => !b.exploto && b.x === cx && b.y === cy && !(p && b.pisando));
}
// Simula explosiones (con cadenas) hasta ahora. Igual en los dos celus.
function simularBom(){
    const ahora = VivoComun.reloj('bombitas');
    let cambio = true;
    while (cambio) {
        cambio = false;
        const proxima = BM.bombas.filter(b => !b.exploto && b.t <= ahora).sort((a, b) => a.t - b.t || (a.id < b.id ? -1 : 1))[0];
        if (!proxima) break;
        proxima.exploto = true; cambio = true;
        const fresca = ahora - proxima.t < 300;
        const celdas = [[proxima.x, proxima.y]];
        [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => {
            for (let k = 1; k <= proxima.alcance; k++) {
                const x = proxima.x + dx * k, y = proxima.y + dy * k, c = celdaBom(x, y);
                if (c === '#') break;
                celdas.push([x, y]);
                if (c === '=') { BM.mapa[y][x] = '.'; if (fresca) efectoBloqueBom(x, y); break; }
                // Cadena: otra bomba en el camino explota al mismo tiempo.
                BM.bombas.forEach(o => { if (!o.exploto && o.x === x && o.y === y && o.t > proxima.t) o.t = proxima.t; });
            }
        });
        BM.fuegos.push({ celdas, hasta: proxima.t + FUEGO_BOM });
        if (fresca) { efectoExplosionBom(proxima, celdas); vibrarJ(15); }
        if (fresca && !(window.sonarArcade && sonarArcade('explosion', { tam: Math.min(1, 0.35 + proxima.alcance * 0.12) })) && window.sfx) window.sfx.dado ? window.sfx.dado() : window.sfx.toque();
    }
    BM.fuegos = BM.fuegos.filter(f => f.hasta > ahora);
}
function pasoBom(dt){
    const e = BM.estado, p = BM.yo;
    if (!e || e.fase !== 'jugando' || !p || !BM.mapa) return;
    simularBom();
    if (VivoComun.reloj('bombitas') < e.inicio || BM.muerto) return;
    const k = BM.teclas, v = 1.35 * dt, tam = 12;
    let dx = (k.der ? 1 : 0) - (k.izq ? 1 : 0), dy = dx ? 0 : (k.abajo ? 1 : 0) - (k.arriba ? 1 : 0);
    const x0 = p.x, y0 = p.y;
    if (dx) p.mira = dx;
    const mover = (nx, ny) => {
        const x0 = Math.floor(nx / T_BOM), x1 = Math.floor((nx + tam - 1) / T_BOM), y0 = Math.floor(ny / T_BOM), y1 = Math.floor((ny + tam - 1) / T_BOM);
        for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (bloqueaBom(x, y, p)) return false;
        p.x = nx; p.y = ny; return true;
    };
    if (dx || dy) {
        if (!mover(p.x + dx * v, p.y + dy * v)) {
            // Ayuda en las esquinas: se acomoda solo al pasillo.
            if (dx) { const cy = Math.round((p.y - 2) / T_BOM) * T_BOM + 2; if (Math.abs(cy - p.y) < 7) mover(p.x, p.y + Math.sign(cy - p.y) * Math.min(v, Math.abs(cy - p.y))); }
            if (dy) { const cx = Math.round((p.x - 2) / T_BOM) * T_BOM + 2; if (Math.abs(cx - p.x) < 7) mover(p.x + Math.sign(cx - p.x) * Math.min(v, Math.abs(cx - p.x)), p.y); }
        }
    }
    p.camina = Math.abs(p.x - x0) + Math.abs(p.y - y0) > 0.05;
    const cx = Math.floor((p.x + tam / 2) / T_BOM), cy = Math.floor((p.y + tam / 2) / T_BOM);
    BM.bombas.forEach(b => { if (b.pisando && !pisaBom(p, b)) b.pisando = false; });
    // Mejoras
    const mej = BM.mejoras[cx + ',' + cy];
    if (mej && celdaBom(cx, cy) === '.') {
        delete BM.mejoras[cx + ',' + cy];
        if (mej === 'fuego') BM.alcance++; else BM.maxBombas++;
        efectoMejoraBom(cx, cy, mej, true);
        BM.enlace && BM.enlace.enviar('mejora', { k: cx + ',' + cy, c: BM.clave }, true);
        if (!(window.sonarArcade && sonarArcade('powerup')) && window.sfx) window.sfx.acierto();
    }
    // ¿Me alcanzó el fuego?
    if (BM.fuegos.some(f => f.celdas.some(([x, y]) => x === cx && y === cy))) morirBom();
}
function ponerBombaBom(){
    const e = BM.estado, p = BM.yo;
    if (!e || e.fase !== 'jugando' || !p || BM.muerto || VivoComun.pausa('bombitas') || VivoComun.reloj('bombitas') < e.inicio) return;
    const cx = Math.floor((p.x + 6) / T_BOM), cy = Math.floor((p.y + 6) / T_BOM);
    const mias = BM.bombas.filter(b => !b.exploto && b.duenio === miIdentidad).length;
    if (mias >= BM.maxBombas || BM.bombas.some(b => !b.exploto && b.x === cx && b.y === cy)) return;
    const b = { id: miIdentidad[0] + Date.now().toString(36) + Math.random().toString(36).slice(2, 4), x: cx, y: cy, t: VivoComun.reloj('bombitas') + MECHA_BOM, alcance: BM.alcance, duenio: miIdentidad, pisando: true };
    BM.bombas.push(b); BM.idsBomba.add(b.id);
    vibrarJ(8);
    if (BM.fx) BM.fx.polvo(cx * T_BOM + 8, cy * T_BOM + 13, 'rgba(230,230,210,0.6)', 4);
    BM.enlace && BM.enlace.enviar('bomba', { ...b, pisando: false, c: BM.clave }, true);
}
async function morirBom(){
    if (BM.muerto) return;
    BM.muerto = true; BM.tMuerte = performance.now();
    efectoMuerteBom(BM.yo, miIdentidad);
    vibrarJ([40, 30, 60]);
    if (window.sfx) window.sfx.error();
    BM.enlace && BM.enlace.enviar('muerto', { c: BM.clave }, true);
    const clave = BM.clave;
    await Bombitas.accion((e) => {
        if (e.clave !== clave) return null;
        const otro = miIdentidad === 'nico' ? 'carito' : 'nico';
        const rondas = { ...e.rondas, [otro]: e.rondas[otro] + 1 };
        if (rondas[otro] >= RONDAS_BOM) return { rondas, ganador: otro, motivo: `${rondas.nico} a ${rondas.carito} en rondas.` };
        return { rondas, clave: Math.random().toString(36).slice(2, 7), semilla: Math.floor(Math.random() * 1e9), inicio: VivoComun.reloj('bombitas') + 3000, aviso: `💥 Explotó ${nombreJugador(miIdentidad)}: ronda para ${nombreJugador(otro)}.` };
    });
}
// Bloques que se rompen: se desarman en pedacitos durante un ratito.
function efectoBloqueBom(x, y){
    const fx = BM.fx, px = x * T_BOM + 8, py = y * T_BOM + 8;
    BM.escombros.push({ x, y, t: performance.now() });
    if (fx) { fx.particulas({ x: px, y: py, n: 9, color: ['#c0693a', '#8a4524', '#e08a55'], vel: 2.2, vida: 600, grav: 0.12, tam: 2.6, forma: 'cuadro', r: 4 }); fx.polvo(px, py, 'rgba(210,180,150,0.6)', 4); }
}
function efectoExplosionBom(b, celdas){
    const fx = BM.fx; if (!fx) return;
    fx.explosion(b.x * T_BOM + 8, b.y * T_BOM + 8, 18);
    celdas.forEach(([x, y], i) => { if (i && i % 2 === 0) fx.chispas(x * T_BOM + 8, y * T_BOM + 8, ['#fff3b0', '#ffb347'], 3); });
    fx.temblor(3.5, 260);
}
function efectoMuerteBom(p, quien){
    const fx = BM.fx; if (!fx || !p) return;
    const x = p.x + 6, y = p.y + 6;
    fx.estrellitas(x, y, 10, quien === 'nico' ? ['#8cc0ff', '#fff'] : ['#ffb0c8', '#fff']);
    fx.texto(x, y - 6, '¡Pum!', { tam: 9, color: '#ffd23a' });
    fx.temblor(4, 320);
}
function efectoMejoraBom(cx, cy, mej, mio){
    const fx = BM.fx; if (!fx) return;
    fx.estrellitas(cx * T_BOM + 8, cy * T_BOM + 8, 7);
    if (mio) fx.texto(cx * T_BOM + 8, cy * T_BOM + 2, mej === 'fuego' ? '+🔥' : '+💣', { tam: 8 });
}
function bloqueBom(c, px, py, roto){
    // Ladrillo con relieve
    c.fillStyle = '#b55e32'; c.fillRect(px, py, T_BOM, T_BOM);
    c.fillStyle = '#d27a48';
    c.fillRect(px + 0.5, py + 0.5, 7, 6.5); c.fillRect(px + 8.5, py + 0.5, 7, 6.5);
    c.fillRect(px + 0.5, py + 8.5, 3, 7); c.fillRect(px + 4.5, py + 8.5, 7, 7); c.fillRect(px + 12.5, py + 8.5, 3, 7);
    c.fillStyle = 'rgba(255,230,200,0.35)';
    c.fillRect(px + 0.5, py + 0.5, 7, 1); c.fillRect(px + 8.5, py + 0.5, 7, 1); c.fillRect(px + 4.5, py + 8.5, 7, 1);
    c.fillStyle = 'rgba(60,20,5,0.35)'; c.fillRect(px, py + T_BOM - 1.5, T_BOM, 1.5);
}
function pilarBom(c, px, py){
    c.fillStyle = '#5e5870'; c.fillRect(px, py, T_BOM, T_BOM);
    c.fillStyle = '#8f88a8'; c.fillRect(px + 1, py + 1, T_BOM - 2, T_BOM - 5);
    c.fillStyle = '#a9a2c2'; c.fillRect(px + 1, py + 1, T_BOM - 2, 2);
    c.fillStyle = '#433d52'; c.fillRect(px, py + T_BOM - 4, T_BOM, 4);
    c.fillStyle = 'rgba(255,255,255,0.18)'; c.fillRect(px + 3, py + 5, 3, 2); c.fillRect(px + 9, py + 7, 2, 2);
}
function personajeBom(c, p, quien, ahora){
    const col = quien === 'nico' ? '#3d8bfd' : '#ff6f9a', osc = quien === 'nico' ? '#2a5fb8' : '#d24d7a';
    const camina = p.camina, paso = camina ? Math.sin(ahora / 70) : 0, rebote = camina ? Math.abs(paso) * 1.2 : Math.sin(ahora / 400) * 0.4;
    const x = p.x + 6, y = p.y + 6 - rebote, mira = p.mira || 1;
    c.save();
    if (p.muerto) { const k = Math.min(1, (ahora - (p.tMuerte || ahora)) / 600); c.globalAlpha = 1 - k * 0.7; c.translate(x, y + 6); c.rotate(k * mira * 1.4); c.scale(1, 1 - k * 0.5); c.translate(-x, -y - 6); }
    // sombra
    c.fillStyle = 'rgba(0,0,0,0.25)'; c.beginPath(); c.ellipse(p.x + 6, p.y + 13, 5.5, 1.8, 0, 0, Math.PI * 2); c.fill();
    // pies
    c.fillStyle = '#2a2235';
    c.beginPath(); c.ellipse(x - 2.5 + paso * 1.2, y + 6, 2, 1.4, 0, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.ellipse(x + 2.5 - paso * 1.2, y + 6, 2, 1.4, 0, 0, Math.PI * 2); c.fill();
    // cuerpo
    c.fillStyle = col; c.beginPath(); c.ellipse(x, y + 3, 4.5, 3.5, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = osc; c.fillRect(x - 4, y + 4.5, 8, 1);
    // cabeza
    c.fillStyle = '#f6cfa8'; c.beginPath(); c.arc(x, y - 2, 4.6, 0, Math.PI * 2); c.fill();
    c.fillStyle = 'rgba(255,140,140,0.5)'; c.beginPath(); c.arc(x - 2.6 + mira, y - 0.6, 1, 0, Math.PI * 2); c.arc(x + 2.6 + mira, y - 0.6, 1, 0, Math.PI * 2); c.fill();
    // ojos (parpadean)
    c.fillStyle = '#2a1f33';
    const parpadea = (ahora + (quien === 'nico' ? 0 : 900)) % 3200 < 120;
    if (parpadea) { c.fillRect(x - 2.2 + mira * 0.8, y - 2.2, 1.6, 0.5); c.fillRect(x + 0.8 + mira * 0.8, y - 2.2, 1.6, 0.5); }
    else { c.beginPath(); c.arc(x - 1.5 + mira * 0.8, y - 2, 0.9, 0, Math.PI * 2); c.arc(x + 1.5 + mira * 0.8, y - 2, 0.9, 0, Math.PI * 2); c.fill(); }
    // gorra (Nico) o moño (Carito)
    c.fillStyle = col;
    if (quien === 'nico') { c.beginPath(); c.arc(x, y - 3.2, 4.7, Math.PI, 0); c.fill(); c.fillRect(x + mira * 1.5 - 1.5 + (mira > 0 ? 1 : -3), y - 3.6, 4, 1.4); c.fillStyle = '#fff'; c.beginPath(); c.arc(x, y - 7.6, 0.9, 0, Math.PI * 2); c.fill(); }
    else { c.beginPath(); c.moveTo(x, y - 6.5); c.lineTo(x - 4, y - 9); c.lineTo(x - 4, y - 4.5); c.closePath(); c.moveTo(x, y - 6.5); c.lineTo(x + 4, y - 9); c.lineTo(x + 4, y - 4.5); c.closePath(); c.fill(); c.fillStyle = osc; c.beginPath(); c.arc(x, y - 6.6, 1.2, 0, Math.PI * 2); c.fill(); }
    c.restore();
}
function dibujarBom(){
    const c = BM.ctx, e = BM.estado;
    if (!c || !e || !BM.mapa) return;
    const W = COLS_BOM * T_BOM, H = FILAS_BOM * T_BOM, ahora = VivoComun.reloj('bombitas'), t = performance.now(), fx = BM.fx;
    c.setTransform(3, 0, 0, 3, 0, 0);
    fx && fx.antes(c);
    // Piso: pasto a cuadros con matas
    c.fillStyle = '#3f8a5c'; c.fillRect(-4, -4, W + 8, H + 8);
    for (let y = 0; y < FILAS_BOM; y++) for (let x = 0; x < COLS_BOM; x++) {
        const px = x * T_BOM, py = y * T_BOM;
        if ((x + y) % 2 === 0) { c.fillStyle = '#479863'; c.fillRect(px, py, T_BOM, T_BOM); }
        if ((x * 7 + y * 13) % 5 === 0) { c.fillStyle = 'rgba(120,200,130,0.5)'; c.fillRect(px + 4, py + 10, 1, 2); c.fillRect(px + 6, py + 9, 1, 3); c.fillRect(px + 11, py + 5, 1, 2); }
    }
    // Sombras de los bloques sobre el piso
    c.fillStyle = 'rgba(10,30,20,0.28)';
    for (let y = 0; y < FILAS_BOM; y++) for (let x = 0; x < COLS_BOM; x++) { const ch = BM.mapa[y][x]; if (ch === '#' || ch === '=') c.fillRect(x * T_BOM + 3, y * T_BOM + T_BOM, T_BOM - 1, 3); }
    // Mejoras: flotan y brillan
    for (const k in BM.mejoras) {
        const [x, y] = k.split(',').map(Number); if (celdaBom(x, y) !== '.') continue;
        const px = x * T_BOM + 8, py = y * T_BOM + 8 + Math.sin(t / 260 + x) * 1.3;
        const g = c.createRadialGradient(px, py, 1, px, py, 8); g.addColorStop(0, BM.mejoras[k] === 'fuego' ? 'rgba(255,170,60,0.7)' : 'rgba(150,170,255,0.7)'); g.addColorStop(1, 'rgba(255,255,255,0)');
        c.fillStyle = g; c.fillRect(px - 8, py - 8, 16, 16);
        c.fillStyle = 'rgba(0,0,0,0.2)'; c.beginPath(); c.ellipse(x * T_BOM + 8, y * T_BOM + 14, 4, 1.3, 0, 0, Math.PI * 2); c.fill();
        c.font = '10px serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(BM.mejoras[k] === 'fuego' ? '🔥' : '💣', px, py); c.textAlign = 'left'; c.textBaseline = 'alphabetic';
    }
    for (let y = 0; y < FILAS_BOM; y++) for (let x = 0; x < COLS_BOM; x++) {
        const ch = BM.mapa[y][x], px = x * T_BOM, py = y * T_BOM;
        if (ch === '#') pilarBom(c, px, py);
        if (ch === '=') bloqueBom(c, px, py);
    }
    // Escombros que se achican
    BM.escombros = BM.escombros.filter(s => t - s.t < 350);
    BM.escombros.forEach(s => { const k = (t - s.t) / 350, m = T_BOM * (1 - k); c.globalAlpha = 1 - k; c.save(); c.translate(s.x * T_BOM + 8, s.y * T_BOM + 8); c.rotate(k * 0.6); c.fillStyle = '#c0693a'; c.fillRect(-m / 2, -m / 2, m, m); c.restore(); c.globalAlpha = 1; });
    // Bombas: laten más rápido cuanto menos falta
    BM.bombas.forEach(b => {
        if (b.exploto) return;
        const falta = Math.max(0, b.t - ahora), urg = 1 - falta / MECHA_BOM, vel = 140 - urg * 90;
        const lat = 1 + Math.sin(ahora / vel) * (0.06 + urg * 0.1), px = b.x * T_BOM + 8, py = b.y * T_BOM + 9;
        c.fillStyle = 'rgba(0,0,0,0.3)'; c.beginPath(); c.ellipse(px, py + 5.5, 5 * lat, 1.6, 0, 0, Math.PI * 2); c.fill();
        c.save(); c.translate(px, py); c.scale(lat, 2 - lat);
        const g = c.createRadialGradient(-2, -2, 0.5, 0, 0, 6.5); g.addColorStop(0, '#5a5068'); g.addColorStop(1, '#14111b');
        c.fillStyle = g; c.beginPath(); c.arc(0, 0, 6, 0, Math.PI * 2); c.fill();
        if (urg > 0.6 && Math.floor(ahora / 90) % 2) { c.fillStyle = 'rgba(255,60,60,0.45)'; c.beginPath(); c.arc(0, 0, 6, 0, Math.PI * 2); c.fill(); }
        c.fillStyle = 'rgba(255,255,255,0.75)'; c.beginPath(); c.ellipse(-2.3, -2.4, 1.6, 1, -0.6, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#6a6070'; c.fillRect(-1.2, -7.5, 2.4, 2);
        c.strokeStyle = '#d9c7a0'; c.lineWidth = 0.9; c.beginPath(); c.moveTo(0, -7.3); c.quadraticCurveTo(2.5, -9.5, 3.5, -8.5); c.stroke();
        c.restore();
        // chispita de la mecha
        const sx = px + 3.5 * lat, sy = py - 8.5;
        c.fillStyle = Math.floor(ahora / 60) % 2 ? '#fff3b0' : '#ff9f43'; c.beginPath(); c.arc(sx, sy, 1.3 + Math.random() * 0.6, 0, Math.PI * 2); c.fill();
        if (fx && Math.random() < 0.25) fx.particulas({ x: sx, y: sy, n: 1, color: ['#ffd23a', '#ff9f43'], vel: 0.9, vida: 260, grav: 0.03, tam: 1.1, dir: -Math.PI / 2, abanico: 1 });
    });
    // Fuego: cruz con núcleo blanco que titila
    BM.fuegos.forEach(f => {
        const vida = Math.max(0, Math.min(1, (f.hasta - ahora) / FUEGO_BOM)), anch = 0.55 + vida * 0.45;
        // Brazos de la cruz (para que el fuego se vea continuo)
        const [ox, oy] = f.celdas[0];
        c.fillStyle = 'rgba(255,170,70,0.85)';
        f.celdas.forEach(([x, y], i) => { if (!i) return; const hz = y === oy, g = 9 * anch; if (hz) c.fillRect(Math.min(x, ox) * T_BOM + 8, y * T_BOM + 8 - g / 2, (Math.abs(x - ox)) * T_BOM, g); else c.fillRect(x * T_BOM + 8 - g / 2, Math.min(y, oy) * T_BOM + 8, g, Math.abs(y - oy) * T_BOM); });
        f.celdas.forEach(([x, y], i) => {
            const cx = x * T_BOM + 8, cy = y * T_BOM + 8, tit = 1 + Math.sin(t / 40 + i) * 0.08;
            const r = 8 * anch * tit;
            const g = c.createRadialGradient(cx, cy, 0.5, cx, cy, r + 1.5);
            g.addColorStop(0, 'rgba(255,255,235,1)'); g.addColorStop(0.35, 'rgba(255,225,120,0.95)'); g.addColorStop(0.7, 'rgba(255,130,50,0.85)'); g.addColorStop(1, 'rgba(230,50,40,0)');
            c.fillStyle = g; c.fillRect(cx - r - 2, cy - r - 2, (r + 2) * 2, (r + 2) * 2);
        });
    });
    // Personajes (el otro, suavizado)
    if (BM.el) {
        const pos = VivoComun.suave(BM.el);
        if (pos) {
            const dx = pos[0] - (BM.el.px == null ? pos[0] : BM.el.px);
            BM.el.camina = Math.abs(dx) + Math.abs(pos[1] - (BM.el.py == null ? pos[1] : BM.el.py)) > 0.15;
            if (Math.abs(dx) > 0.1) BM.el.mira = dx > 0 ? 1 : -1;
            BM.el.px = pos[0]; BM.el.py = pos[1];
            personajeBom(c, { x: pos[0], y: pos[1], camina: BM.el.camina && !BM.el.muerto, mira: BM.el.mira, muerto: BM.el.muerto, tMuerte: BM.el.tMuerte }, miRival, t);
        }
    }
    if (BM.yo) personajeBom(c, { ...BM.yo, muerto: BM.muerto, tMuerte: BM.tMuerte }, miIdentidad, t);
    fx && fx.dibujar(c);
    fx && fx.despues(c);
    // Barra de arriba
    c.fillStyle = 'rgba(10,8,18,0.55)'; c.fillRect(0, 0, W, 11);
    c.font = 'bold 7.5px monospace'; c.textBaseline = 'middle';
    c.fillStyle = '#8cc0ff'; c.fillText(`${nombreJugador('nico')} ${'●'.repeat(e.rondas.nico)}${'○'.repeat(RONDAS_BOM - e.rondas.nico)}`, 3, 6);
    c.fillStyle = '#ffb0c8'; c.textAlign = 'right'; c.fillText(`${'●'.repeat(e.rondas.carito)}${'○'.repeat(RONDAS_BOM - e.rondas.carito)} ${nombreJugador('carito')}`, W - 11, 6);
    c.fillStyle = '#fff'; c.textAlign = 'center'; c.fillText(`🔥${BM.alcance} 💣${BM.maxBombas}`, W / 2, 6);
    c.textAlign = 'left'; c.textBaseline = 'alphabetic';
    const falta = e.inicio - ahora;
    if (e.fase === 'jugando' && falta > 0) {
        const n = Math.ceil(falta / 1000), k = 1 - (falta % 1000) / 1000, esc = FxVivo.rebote(Math.min(1, k * 2.5));
        c.fillStyle = 'rgba(0,0,0,0.35)'; c.fillRect(0, H / 2 - 18, W, 34);
        c.save(); c.translate(W / 2, H / 2 - 2); c.scale(esc, esc);
        c.font = 'bold 22px monospace'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineWidth = 4; c.strokeStyle = '#2a1f33'; c.strokeText(String(n), 0, 0); c.fillStyle = '#ffd23a'; c.fillText(String(n), 0, 0);
        c.restore();
        if (e.aviso) { c.font = 'bold 7px sans-serif'; c.textAlign = 'center'; c.fillStyle = '#fff'; c.fillText(e.aviso, W / 2, H / 2 + 12); c.textAlign = 'left'; }
    }
}
function bucleBom(ts){
    const pantalla = document.getElementById('pantalla-bombitas');
    if (!pantalla || !pantalla.classList.contains('activa')) { pararBom(); return; }
    if (VivoComun.pausa('bombitas')) { BM.ultimoTs = 0; dibujarBom(); VivoComun.cartelPausa(BM.ctx); BM.loop = requestAnimationFrame(bucleBom); return; }
    const dt = Math.min(2.5, (ts - (BM.ultimoTs || ts)) / 16.67 || 1);
    BM.ultimoTs = ts;
    pasoBom(dt);
    if (BM.enlace && BM.yo && Date.now() - BM.ultimoEnvio > 50) { BM.ultimoEnvio = Date.now(); BM.enlace.enviar('pos', { x: Math.round(BM.yo.x), y: Math.round(BM.yo.y), c: BM.clave }); }
    dibujarBom();
    VivoComun.estado(BM.ctx, COLS_BOM * T_BOM, FILAS_BOM * T_BOM, BM.enlace, nombreJugador(miRival));
    BM.loop = requestAnimationFrame(bucleBom);
}
function arrancarBom(){
    if (!BM.canvas) {
        BM.canvas = document.createElement('canvas');
        BM.canvas.width = COLS_BOM * T_BOM * 3; BM.canvas.height = FILAS_BOM * T_BOM * 3;
        BM.canvas.className = 'lienzo-bombitas';
        BM.canvas.style.aspectRatio = `${COLS_BOM}/${FILAS_BOM}`;
        BM.ctx = BM.canvas.getContext('2d');
        BM.controles = document.createElement('div');
        BM.controles.className = 'controles-bombitas';
        BM.controles.innerHTML = `<div class="cruz-bom"><span></span><button data-k="arriba">▲</button><span></span><button data-k="izq">◀</button><span></span><button data-k="der">▶</button><span></span><button data-k="abajo">▼</button><span></span></div><button class="salto" data-bomba="1" aria-label="Poner bomba">💣</button>`;
        BM.controles.querySelectorAll('button').forEach(b => {
            const k = b.dataset.k;
            b.addEventListener('pointerdown', (ev) => { ev.preventDefault(); if (b.dataset.bomba) ponerBombaBom(); else BM.teclas[k] = true; b.classList.add('apretado'); });
            const off = (ev) => { ev.preventDefault(); if (k) BM.teclas[k] = false; b.classList.remove('apretado'); };
            b.addEventListener('pointerup', off); b.addEventListener('pointercancel', off); b.addEventListener('pointerleave', off);
            b.addEventListener('contextmenu', (ev) => ev.preventDefault());
        });
    }
    if (!BM.teclado) {
        const mapa = { ArrowLeft: 'izq', ArrowRight: 'der', ArrowUp: 'arriba', ArrowDown: 'abajo', KeyA: 'izq', KeyD: 'der', KeyW: 'arriba', KeyS: 'abajo' };
        BM.teclado = (ev) => {
            if (!document.getElementById('pantalla-bombitas')?.classList.contains('activa') || (ev.target && ev.target.tagName === 'INPUT')) return;
            if (ev.code === 'Space') { ev.preventDefault(); if (ev.type === 'keydown' && !ev.repeat) ponerBombaBom(); return; }
            const k = mapa[ev.code]; if (!k) return; ev.preventDefault(); BM.teclas[k] = ev.type === 'keydown';
        };
        window.addEventListener('keydown', BM.teclado); window.addEventListener('keyup', BM.teclado);
    }
    BM.fx = BM.fx || FxVivo.crear();
    if (!BM.enlace) {
        BM.enlace = EnlaceVivo.conectar('bombitas', {
            alMensaje(t, d) {
                if (d.c !== BM.clave || !BM.el) return;
                if (t === 'pos') VivoComun.recibir(BM.el, { x: d.x, y: d.y });
                if (t === 'bomba' && !BM.idsBomba.has(d.id)) { BM.idsBomba.add(d.id); BM.bombas.push({ id: d.id, x: d.x, y: d.y, t: d.t, alcance: d.alcance, duenio: d.duenio, pisando: !!pisaBom(BM.yo, d) }); if (BM.fx) BM.fx.polvo(d.x * T_BOM + 8, d.y * T_BOM + 13, 'rgba(230,230,210,0.6)', 4); }
                if (t === 'mejora' && BM.mejoras[d.k]) { const [mx, my] = d.k.split(',').map(Number); efectoMejoraBom(mx, my, BM.mejoras[d.k], false); delete BM.mejoras[d.k]; }
                if (t === 'muerto' && !BM.el.muerto) { BM.el.muerto = true; BM.el.tMuerte = performance.now(); efectoMuerteBom({ x: BM.el.rx != null ? BM.el.rx : BM.el.x, y: BM.el.ry != null ? BM.el.ry : BM.el.y }, miRival); }
            }
        });
    }
    if (!BM.loop) BM.loop = requestAnimationFrame(bucleBom);
    window._unsubLoopBombitas = pararBom;
}
function pararBom(){
    if (BM.loop) cancelAnimationFrame(BM.loop);
    BM.loop = null;
    if (BM.enlace) BM.enlace.cerrar();
    BM.enlace = null; BM.teclas = {};
}

const Bombitas = JuegoTurnos.crear({
    id: 'bombitas',
    sinTurno: true,
    emojiListo: '💣',
    intro: `Poné bombas 💣 para romper bloques y encerrar al otro: explotan a los 2 segundos en cruz. Si el fuego te toca, perdés la ronda. Buscá mejoras escondidas (🔥 más alcance, 💣 una bomba más). ¡Gana el primero en llevarse ${RONDAS_BOM} rondas!`,
    inicial: () => ({ rondas: { nico: 0, carito: 0 }, clave: Math.random().toString(36).slice(2, 7), semilla: Math.floor(Math.random() * 1e9), inicio: window.ahoraSync() + 3000, turno: null }),
    render(e) { return `<div id="bombitas-host"></div><div class="texto-centro texto-tenue" style="font-size:0.75rem;">${nombreJugador('nico')} 🔵 arranca arriba a la izquierda · ${nombreJugador('carito')} 🩷 abajo a la derecha</div>`; },
    alDibujar(cont, e) {
        BM.estado = e;
        const host = cont.querySelector('#bombitas-host');
        if (!host) return;
        VivoComun.montar('bombitas', Bombitas, host, e);
        // Si alguien acaba de explotar, se deja ver la explosión un momento antes de armar la ronda nueva.
        if (BM.clave !== e.clave) {
            if (BM.mapa && (BM.muerto || (BM.el && BM.el.muerto))) {
                if (!BM.esperaRonda) BM.esperaRonda = setTimeout(() => { BM.esperaRonda = null; if (BM.estado && BM.clave !== BM.estado.clave) { reiniciarBom(BM.estado); } }, 900);
            } else reiniciarBom(e);
        }
        if (e.fase === 'jugando') arrancarBom();
        if (BM.canvas) { host.appendChild(BM.canvas); if (BM.controles && e.fase === 'jugando') host.appendChild(BM.controles); dibujarBom(); }
    }
});
window._bombitas = BM; // para pruebas
