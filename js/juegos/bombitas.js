// ==================== BOMBITAS (en vivo, tipo Bomberman) ====================
// Laberinto con bloques que se rompen. Cada uno pone bombas que explotan a
// los 2 segundos en cruz; si la explosión te toca, perdés la ronda. Algunos
// bloques esconden mejoras (🔥 más alcance, 💣 una bomba más). Al mejor de 3.
// Los dos arman el mismo laberinto con la misma semilla, cada uno mueve su
// personaje en su celu (posiciones por js/enlace-vivo.js) y las bombas
// viajan como eventos confiables con su hora de explosión (reloj compartido),
// así las explosiones —y las cadenas— dan igual en los dos celus.
const COLS_BOM = 13, FILAS_BOM = 11, T_BOM = 16, MECHA_BOM = 2000, FUEGO_BOM = 500, RONDAS_BOM = 2;
const BM = { canvas: null, ctx: null, enlace: null, loop: null, estado: null, clave: null, mapa: null, mejoras: null, bombas: [], fuegos: [], yo: null, el: null, teclas: {}, muerto: false, alcance: 2, maxBombas: 1, ultimoEnvio: 0, ultimoTs: 0, idsBomba: new Set() };

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
    BM.mapa = m; BM.mejoras = mej; BM.bombas = []; BM.fuegos = []; BM.idsBomba = new Set();
    const s = salidaBom(miIdentidad), o = salidaBom(miRival);
    BM.yo = { x: s.x * T_BOM + 2, y: s.y * T_BOM + 2 };
    BM.el = { x: o.x * T_BOM + 2, y: o.y * T_BOM + 2 };
    BM.muerto = false; BM.alcance = 2; BM.maxBombas = 1;
}
const celdaBom = (x, y) => (BM.mapa[y] && BM.mapa[y][x]) || '#';
// Bomba sólida, salvo la que tengo abajo recién puesta (para poder salir).
function bloqueaBom(cx, cy, p){
    const c = celdaBom(cx, cy);
    if (c === '#' || c === '=') return true;
    return BM.bombas.some(b => !b.exploto && b.x === cx && b.y === cy && !(p && b.duenio === miIdentidad && b.pisando));
}
// Simula explosiones (con cadenas) hasta ahora. Igual en los dos celus.
function simularBom(){
    const ahora = window.ahoraSync();
    let cambio = true;
    while (cambio) {
        cambio = false;
        const proxima = BM.bombas.filter(b => !b.exploto && b.t <= ahora).sort((a, b) => a.t - b.t || (a.id < b.id ? -1 : 1))[0];
        if (!proxima) break;
        proxima.exploto = true; cambio = true;
        const celdas = [[proxima.x, proxima.y]];
        [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => {
            for (let k = 1; k <= proxima.alcance; k++) {
                const x = proxima.x + dx * k, y = proxima.y + dy * k, c = celdaBom(x, y);
                if (c === '#') break;
                celdas.push([x, y]);
                if (c === '=') { BM.mapa[y][x] = '.'; break; }
                // Cadena: otra bomba en el camino explota al mismo tiempo.
                BM.bombas.forEach(o => { if (!o.exploto && o.x === x && o.y === y && o.t > proxima.t) o.t = proxima.t; });
            }
        });
        BM.fuegos.push({ celdas, hasta: proxima.t + FUEGO_BOM });
        if (window.sfx && ahora - proxima.t < 300) window.sfx.dado ? window.sfx.dado() : window.sfx.toque();
    }
    BM.fuegos = BM.fuegos.filter(f => f.hasta > ahora);
}
function pasoBom(dt){
    const e = BM.estado, p = BM.yo;
    if (!e || e.fase !== 'jugando' || !p || !BM.mapa) return;
    simularBom();
    if (window.ahoraSync() < e.inicio || BM.muerto) return;
    const k = BM.teclas, v = 1.35 * dt, tam = 12;
    let dx = (k.der ? 1 : 0) - (k.izq ? 1 : 0), dy = dx ? 0 : (k.abajo ? 1 : 0) - (k.arriba ? 1 : 0);
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
    const cx = Math.floor((p.x + tam / 2) / T_BOM), cy = Math.floor((p.y + tam / 2) / T_BOM);
    BM.bombas.forEach(b => { if (b.pisando && (b.x !== cx || b.y !== cy)) b.pisando = false; });
    // Mejoras
    const mej = BM.mejoras[cx + ',' + cy];
    if (mej && celdaBom(cx, cy) === '.') {
        delete BM.mejoras[cx + ',' + cy];
        if (mej === 'fuego') BM.alcance++; else BM.maxBombas++;
        BM.enlace && BM.enlace.enviar('mejora', { k: cx + ',' + cy, c: BM.clave }, true);
        if (window.sfx) window.sfx.acierto();
    }
    // ¿Me alcanzó el fuego?
    if (BM.fuegos.some(f => f.celdas.some(([x, y]) => x === cx && y === cy))) morirBom();
}
function ponerBombaBom(){
    const e = BM.estado, p = BM.yo;
    if (!e || e.fase !== 'jugando' || !p || BM.muerto || window.ahoraSync() < e.inicio) return;
    const cx = Math.floor((p.x + 6) / T_BOM), cy = Math.floor((p.y + 6) / T_BOM);
    const mias = BM.bombas.filter(b => !b.exploto && b.duenio === miIdentidad).length;
    if (mias >= BM.maxBombas || BM.bombas.some(b => !b.exploto && b.x === cx && b.y === cy)) return;
    const b = { id: miIdentidad[0] + Date.now().toString(36) + Math.random().toString(36).slice(2, 4), x: cx, y: cy, t: window.ahoraSync() + MECHA_BOM, alcance: BM.alcance, duenio: miIdentidad, pisando: true };
    BM.bombas.push(b); BM.idsBomba.add(b.id);
    vibrarJ(8);
    BM.enlace && BM.enlace.enviar('bomba', { ...b, pisando: false, c: BM.clave }, true);
}
async function morirBom(){
    if (BM.muerto) return;
    BM.muerto = true;
    vibrarJ([40, 30, 60]);
    if (window.sfx) window.sfx.error();
    BM.enlace && BM.enlace.enviar('muerto', { c: BM.clave }, true);
    const clave = BM.clave;
    await Bombitas.accion((e) => {
        if (e.clave !== clave) return null;
        const otro = miIdentidad === 'nico' ? 'carito' : 'nico';
        const rondas = { ...e.rondas, [otro]: e.rondas[otro] + 1 };
        if (rondas[otro] >= RONDAS_BOM) return { rondas, ganador: otro, motivo: `${rondas.nico} a ${rondas.carito} en rondas.` };
        return { rondas, clave: Math.random().toString(36).slice(2, 7), semilla: Math.floor(Math.random() * 1e9), inicio: window.ahoraSync() + 3000, aviso: `💥 Explotó ${nombreJugador(miIdentidad)}: ronda para ${nombreJugador(otro)}.` };
    });
}
function dibujarBom(){
    const c = BM.ctx, e = BM.estado;
    if (!c || !e || !BM.mapa) return;
    const W = COLS_BOM * T_BOM, H = FILAS_BOM * T_BOM, ahora = window.ahoraSync();
    c.fillStyle = '#3f8a5c'; c.fillRect(0, 0, W, H);
    for (let y = 0; y < FILAS_BOM; y++) for (let x = 0; x < COLS_BOM; x++) {
        const ch = BM.mapa[y][x], px = x * T_BOM, py = y * T_BOM;
        if ((x + y) % 2 === 0 && ch === '.') { c.fillStyle = '#4a9a68'; c.fillRect(px, py, T_BOM, T_BOM); }
        if (ch === '#') { c.fillStyle = '#6b6478'; c.fillRect(px, py, T_BOM, T_BOM); c.fillStyle = '#8a84a0'; c.fillRect(px + 1, py + 1, T_BOM - 3, 3); c.fillStyle = '#4a4458'; c.fillRect(px, py + T_BOM - 2, T_BOM, 2); }
        if (ch === '=') { c.fillStyle = '#c0693a'; c.fillRect(px, py, T_BOM, T_BOM); c.fillStyle = '#7a3a1c'; c.fillRect(px, py + 7, T_BOM, 1); c.fillRect(px + 7, py, 1, 7); c.fillRect(px + 3, py + 8, 1, 8); c.fillRect(px + 12, py + 8, 1, 8); }
        const mej = BM.mejoras[x + ',' + y];
        if (mej && ch === '.') { c.font = '11px serif'; c.fillText(mej === 'fuego' ? '🔥' : '💣', px + 2, py + 12); }
    }
    BM.bombas.forEach(b => {
        if (b.exploto) return;
        const px = b.x * T_BOM, py = b.y * T_BOM, lat = 1 + Math.sin(ahora / 90) * 0.08 * (1 + (MECHA_BOM - (b.t - ahora)) / 500);
        c.save(); c.translate(px + 8, py + 9); c.scale(lat, lat);
        c.fillStyle = '#1a1622'; c.beginPath(); c.arc(0, 0, 6, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#fff'; c.fillRect(-3, -4, 2, 2);
        c.fillStyle = Math.floor(ahora / 120) % 2 ? '#ffd93d' : '#ff6b6b'; c.fillRect(2, -8, 2, 3);
        c.restore();
    });
    BM.fuegos.forEach(f => f.celdas.forEach(([x, y]) => {
        const g = c.createRadialGradient(x * T_BOM + 8, y * T_BOM + 8, 1, x * T_BOM + 8, y * T_BOM + 8, 9);
        g.addColorStop(0, '#fff6c8'); g.addColorStop(0.5, '#ffb347'); g.addColorStop(1, 'rgba(255,80,60,0.6)');
        c.fillStyle = g; c.fillRect(x * T_BOM, y * T_BOM, T_BOM, T_BOM);
    }));
    const pj = (p, quien, muerto) => {
        if (!p) return;
        const x = Math.round(p.x), y = Math.round(p.y), col = quien === 'nico' ? '#3d8bfd' : '#ff6f9a';
        c.globalAlpha = muerto ? 0.35 : 1;
        c.fillStyle = col; c.fillRect(x + 1, y + 5, 10, 6);
        c.fillStyle = '#f6cfa8'; c.fillRect(x + 2, y, 8, 6);
        c.fillStyle = '#2a1f33'; c.fillRect(x + 4, y + 2, 1, 2); c.fillRect(x + 7, y + 2, 1, 2);
        c.fillStyle = col; if (quien === 'nico') c.fillRect(x + 1, y - 1, 10, 2); else { c.fillRect(x, y - 2, 4, 3); c.fillRect(x + 8, y - 2, 4, 3); }
        c.fillStyle = '#2a2235'; c.fillRect(x + 2, y + 11, 3, 2); c.fillRect(x + 7, y + 11, 3, 2);
        c.globalAlpha = 1;
    };
    if (BM.el) { BM.el.rx = BM.el.rx == null ? BM.el.x : BM.el.rx + (BM.el.x - BM.el.rx) * 0.45; BM.el.ry = BM.el.ry == null ? BM.el.y : BM.el.ry + (BM.el.y - BM.el.ry) * 0.45; pj({ x: BM.el.rx, y: BM.el.ry }, miRival, BM.el.muerto); }
    pj(BM.yo, miIdentidad, BM.muerto);
    c.fillStyle = 'rgba(0,0,0,0.45)'; c.fillRect(0, 0, W, 11);
    c.fillStyle = '#fff'; c.font = 'bold 8px monospace';
    c.fillText(`${nombreJugador('nico')} ${e.rondas.nico} · ${e.rondas.carito} ${nombreJugador('carito')}   🔥${BM.alcance} 💣${BM.maxBombas}`, 3, 8);
    const falta = e.inicio - ahora;
    if (e.fase === 'jugando' && falta > 0) { c.fillStyle = 'rgba(0,0,0,0.4)'; c.fillRect(0, H / 2 - 16, W, 30); c.fillStyle = '#fff'; c.textAlign = 'center'; c.font = 'bold 18px monospace'; c.fillText(String(Math.ceil(falta / 1000)), W / 2, H / 2 + 6); c.textAlign = 'left'; }
}
function bucleBom(ts){
    const pantalla = document.getElementById('pantalla-bombitas');
    if (!pantalla || !pantalla.classList.contains('activa')) { pararBom(); return; }
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
        BM.canvas.width = COLS_BOM * T_BOM; BM.canvas.height = FILAS_BOM * T_BOM;
        BM.canvas.className = 'lienzo-aventura';
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
    if (!BM.enlace) {
        BM.enlace = EnlaceVivo.conectar('bombitas', {
            alMensaje(t, d) {
                if (d.c !== BM.clave || !BM.el) return;
                if (t === 'pos') { BM.el.x = d.x; BM.el.y = d.y; }
                if (t === 'bomba' && !BM.idsBomba.has(d.id)) { BM.idsBomba.add(d.id); BM.bombas.push({ id: d.id, x: d.x, y: d.y, t: d.t, alcance: d.alcance, duenio: d.duenio, pisando: false }); }
                if (t === 'mejora') delete BM.mejoras[d.k];
                if (t === 'muerto') BM.el.muerto = true;
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
        if (BM.clave !== e.clave) reiniciarBom(e);
        if (e.fase === 'jugando') arrancarBom();
        if (BM.canvas) { host.appendChild(BM.canvas); if (BM.controles && e.fase === 'jugando') host.appendChild(BM.controles); dibujarBom(); }
    }
});
window._bombitas = BM; // para pruebas
