// ==================== TANQUES (en vivo) ====================
// Un laberinto chico visto de arriba, un tanque para cada uno. ◀ ▶ giran,
// ▲ avanza y 💥 dispara. Las balas rebotan en las paredes (dos veces) y
// también te pueden dar a vos. Al mejor de 5 rondas (gana el primero en 3).
// El laberinto sale de una semilla y es simétrico (justo para los dos).
// Cada uno simula su tanque y sus balas; al disparar se avisa al otro (la
// bala sigue el mismo camino en los dos celus) y el impacto lo decide quien
// lo recibe: avisa "me dieron" y anota la ronda.
const COLS_TQ = 20, FILAS_TQ = 26, CEL_TQ = 12, W_TQ = COLS_TQ * CEL_TQ, H_TQ = FILAS_TQ * CEL_TQ, R_TQ = 7, R_BALA_TQ = 2.5, RONDAS_TQ = 3;
const TQ = { canvas: null, ctx: null, enlace: null, loop: null, estado: null, clave: null, muros: null, yo: null, el: null, balas: [], teclas: {}, ultimoEnvio: 0, ultimoTs: 0, muerto: false, chispas: [], nBala: 0, fuegoPrevio: false };

function rngTq(semilla){ let a = semilla >>> 0; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const salidaTq = (q) => q === 'nico' ? { x: 2.5 * CEL_TQ, y: (FILAS_TQ - 2.5) * CEL_TQ, a: -Math.PI / 2 } : { x: (COLS_TQ - 2.5) * CEL_TQ, y: 2.5 * CEL_TQ, a: Math.PI / 2 };
// Laberinto simétrico (si lo das vuelta 180° es igual), con las salidas libres y conectadas.
function armarMurosTq(semilla){
    for (let intento = 0; intento < 20; intento++) {
        const r = rngTq(semilla + intento * 101), m = Array.from({ length: FILAS_TQ }, (_, y) => Array.from({ length: COLS_TQ }, (_, x) => x === 0 || y === 0 || x === COLS_TQ - 1 || y === FILAS_TQ - 1));
        const pon = (x, y) => { if (x > 0 && y > 0 && x < COLS_TQ - 1 && y < FILAS_TQ - 1) { m[y][x] = true; m[FILAS_TQ - 1 - y][COLS_TQ - 1 - x] = true; } };
        for (let k = 0; k < 11; k++) {
            const x = 1 + Math.floor(r() * (COLS_TQ - 2)), y = 1 + Math.floor(r() * (FILAS_TQ / 2)), largo = 2 + Math.floor(r() * 4), hor = r() < 0.5;
            for (let i = 0; i < largo; i++) pon(hor ? x + i : x, hor ? y : y + i);
        }
        // Libres las salidas
        [salidaTq('nico'), salidaTq('carito')].forEach(s => { const cx = Math.floor(s.x / CEL_TQ), cy = Math.floor(s.y / CEL_TQ); for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const y = cy + dy, x = cx + dx; if (x > 0 && y > 0 && x < COLS_TQ - 1 && y < FILAS_TQ - 1) m[y][x] = false; } });
        // ¿Se puede ir de una salida a la otra?
        const ini = [Math.floor(salidaTq('nico').x / CEL_TQ), Math.floor(salidaTq('nico').y / CEL_TQ)], fin = [Math.floor(salidaTq('carito').x / CEL_TQ), Math.floor(salidaTq('carito').y / CEL_TQ)];
        const visto = new Set([ini.join()]), cola = [ini];
        while (cola.length) { const [x, y] = cola.shift(); [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => { const k = (x + dx) + ',' + (y + dy); if (!m[y + dy][x + dx] && !visto.has(k)) { visto.add(k); cola.push([x + dx, y + dy]); } }); }
        if (visto.has(fin.join())) return m;
    }
    return Array.from({ length: FILAS_TQ }, (_, y) => Array.from({ length: COLS_TQ }, (_, x) => x === 0 || y === 0 || x === COLS_TQ - 1 || y === FILAS_TQ - 1));
}
const muroTq = (x, y) => { const cx = Math.floor(x / CEL_TQ), cy = Math.floor(y / CEL_TQ); return !TQ.muros || !TQ.muros[cy] || TQ.muros[cy][cx] !== false; };
function chocaTq(x, y, r){
    for (let cy = Math.floor((y - r) / CEL_TQ); cy <= Math.floor((y + r) / CEL_TQ); cy++) for (let cx = Math.floor((x - r) / CEL_TQ); cx <= Math.floor((x + r) / CEL_TQ); cx++) {
        if (!TQ.muros[cy] || TQ.muros[cy][cx] === false) continue;
        const nx = Math.max(cx * CEL_TQ, Math.min(x, cx * CEL_TQ + CEL_TQ)), ny = Math.max(cy * CEL_TQ, Math.min(y, cy * CEL_TQ + CEL_TQ));
        if ((x - nx) ** 2 + (y - ny) ** 2 < r * r) return true;
    }
    return false;
}
function reiniciarTq(e){
    TQ.clave = e.clave;
    TQ.muros = armarMurosTq(e.semilla || 1);
    const s = salidaTq(miIdentidad);
    TQ.yo = { x: s.x, y: s.y, a: s.a };
    const o = salidaTq(miRival);
    TQ.el = { x: o.x, y: o.y, a: o.a };
    TQ.balas = []; TQ.chispas = []; TQ.muerto = false; TQ.fuegoPrevio = false;
}
function moverBalaTq(b, dt){
    for (const eje of ['x', 'y']) {
        const v = eje === 'x' ? 'vx' : 'vy';
        b[eje] += b[v] * dt;
        if (muroTq(b.x, b.y)) { b[eje] -= b[v] * dt; b[v] = -b[v]; b.rebotes++; }
    }
}
function pasoTq(dt){
    const e = TQ.estado, p = TQ.yo;
    if (!e || e.fase !== 'jugando' || !p) return;
    const ahora = window.ahoraSync();
    // Las balas siguen aunque yo esté muerto (las del otro también).
    TQ.balas.forEach(b => moverBalaTq(b, dt));
    TQ.balas = TQ.balas.filter(b => b.rebotes <= 2 && ahora - b.t < 4000);
    TQ.chispas = TQ.chispas.filter(c => Date.now() - c.t < 500);
    if (ahora < e.inicio || TQ.muerto) return;
    const k = TQ.teclas;
    p.a += ((k.der ? 1 : 0) - (k.izq ? 1 : 0)) * 0.075 * dt;
    const vel = (k.gas ? 1.35 : 0) - (k.atras ? 0.8 : 0);
    if (vel) {
        const nx = p.x + Math.cos(p.a) * vel * dt, ny = p.y + Math.sin(p.a) * vel * dt;
        if (!chocaTq(nx, p.y, R_TQ)) p.x = nx;
        if (!chocaTq(p.x, ny, R_TQ)) p.y = ny;
    }
    // Disparo (al tocar, no manteniendo): hasta 3 balas mías a la vez.
    if (k.fuego && !TQ.fuegoPrevio && TQ.balas.filter(b => b.de === miIdentidad).length < 3) dispararTq(p);
    TQ.fuegoPrevio = !!k.fuego;
    // ¿Me dio alguna? (las mías también, después de un ratito)
    for (const b of TQ.balas) {
        if (b.de === miIdentidad && ahora - b.t < 250) continue;
        if ((b.x - p.x) ** 2 + (b.y - p.y) ** 2 < (R_TQ + R_BALA_TQ) ** 2) { meDieronTq(b); break; }
    }
}
function dispararTq(p){
    const b = { id: miIdentidad[0] + (++TQ.nBala), de: miIdentidad, x: p.x + Math.cos(p.a) * (R_TQ + 4), y: p.y + Math.sin(p.a) * (R_TQ + 4), vx: Math.cos(p.a) * 3, vy: Math.sin(p.a) * 3, t: window.ahoraSync(), rebotes: 0 };
    if (muroTq(b.x, b.y)) return;
    TQ.balas.push(b);
    vibrarJ(8);
    if (window.sfx) window.sfx.golpe();
    TQ.enlace && TQ.enlace.enviar('bala', { ...b, c: TQ.clave }, true);
}
async function meDieronTq(b){
    if (TQ.muerto) return;
    TQ.muerto = true;
    TQ.balas = TQ.balas.filter(x => x !== b);
    TQ.chispas.push({ x: TQ.yo.x, y: TQ.yo.y, t: Date.now() });
    vibrarJ([40, 30, 60]);
    if (window.sfx) window.sfx.explosion();
    TQ.enlace && TQ.enlace.enviar('boom', { x: TQ.yo.x, y: TQ.yo.y, bala: b.id, c: TQ.clave }, true);
    const clave = TQ.clave, otro = miRival, propia = b.de === miIdentidad;
    await Tanques.accionEnCola((e) => {
        if (e.clave !== clave) return null;
        const puntos = { ...e.puntos, [otro]: e.puntos[otro] + 1 };
        const texto = propia ? `¡${nombreJugador(miIdentidad)} se dio con su propia bala! Ronda para ${nombreJugador(otro)}.` : `¡${nombreJugador(otro)} le dio a ${nombreJugador(miIdentidad)}!`;
        if (puntos[otro] >= RONDAS_TQ) return { puntos, ganador: otro, motivo: `${puntos.nico} a ${puntos.carito} en rondas.` };
        return { puntos, clave: Math.random().toString(36).slice(2, 7), semilla: Math.floor(Math.random() * 1e9), inicio: window.ahoraSync() + 2600, aviso: texto };
    });
}
function dibujarTq(){
    const c = TQ.ctx, e = TQ.estado;
    if (!c || !e || !TQ.muros) return;
    c.setTransform(2, 0, 0, 2, 0, 0);
    c.fillStyle = '#d9c9a3'; c.fillRect(0, 0, W_TQ, H_TQ);
    c.fillStyle = 'rgba(120,90,50,0.08)'; for (let i = 0; i < 60; i++) c.fillRect((i * 67) % W_TQ, (i * 41) % H_TQ, 3, 2);
    for (let y = 0; y < FILAS_TQ; y++) for (let x = 0; x < COLS_TQ; x++) if (TQ.muros[y][x]) {
        c.fillStyle = '#5a4a36'; c.fillRect(x * CEL_TQ, y * CEL_TQ, CEL_TQ, CEL_TQ);
        c.fillStyle = 'rgba(255,255,255,0.1)'; c.fillRect(x * CEL_TQ, y * CEL_TQ, CEL_TQ, 2);
    }
    const tanque = (t, col, oscuro, vivo) => {
        if (!t) return;
        c.save(); c.translate(t.x, t.y); c.rotate(t.a);
        c.globalAlpha = vivo ? 1 : 0.3;
        c.fillStyle = oscuro; c.fillRect(-R_TQ, -R_TQ, R_TQ * 2, 3); c.fillRect(-R_TQ, R_TQ - 3, R_TQ * 2, 3);
        c.fillStyle = col; c.fillRect(-R_TQ + 1, -R_TQ + 2, R_TQ * 2 - 2, R_TQ * 2 - 4);
        c.fillStyle = oscuro; c.beginPath(); c.arc(0, 0, 3.5, 0, Math.PI * 2); c.fill(); c.fillRect(0, -1.2, R_TQ + 4, 2.4);
        c.restore();
    };
    const col = (q) => q === 'nico' ? ['#3d8bfd', '#1d4f9a'] : ['#e8496b', '#8a1f3a'];
    const o = TQ.el;
    if (o) { const pos = o.t ? VivoComun.suave(o) : [o.x, o.y]; tanque({ x: pos[0], y: pos[1], a: o.a }, ...col(miRival), !o.muerto); }
    tanque(TQ.yo, ...col(miIdentidad), !TQ.muerto);
    c.fillStyle = '#2a1f33'; TQ.balas.forEach(b => { c.beginPath(); c.arc(b.x, b.y, R_BALA_TQ, 0, Math.PI * 2); c.fill(); });
    TQ.chispas.forEach(ch => { const v = (Date.now() - ch.t) / 500; c.fillStyle = `rgba(255,${150 - v * 100},40,${1 - v})`; c.beginPath(); c.arc(ch.x, ch.y, 6 + v * 16, 0, Math.PI * 2); c.fill(); });
    // Marcador
    c.fillStyle = 'rgba(20,16,30,0.55)'; c.fillRect(0, 0, W_TQ, 14);
    c.fillStyle = '#fff'; c.font = 'bold 9px monospace';
    c.fillText(`${nombreJugador(miIdentidad)} ${e.puntos[miIdentidad]} · ${e.puntos[miRival]} ${nombreJugador(miRival)}  (a ${RONDAS_TQ})`, 4, 10);
    const falta = e.inicio - window.ahoraSync();
    if (e.fase === 'jugando' && falta > 0) {
        c.fillStyle = 'rgba(20,16,30,0.6)'; c.fillRect(0, H_TQ / 2 - 26, W_TQ, 44);
        c.fillStyle = '#fff'; c.textAlign = 'center'; c.font = 'bold 22px monospace'; c.fillText(String(Math.ceil(falta / 1000)), W_TQ / 2, H_TQ / 2);
        c.font = '9px monospace'; c.fillText(e.aviso || 'Las balas rebotan… ¡cuidado con las tuyas!', W_TQ / 2, H_TQ / 2 + 12); c.textAlign = 'left';
    } else if (TQ.muerto && e.fase === 'jugando') { c.fillStyle = '#2a1f33'; c.textAlign = 'center'; c.font = 'bold 16px monospace'; c.fillText('💥 ¡Te dieron!', W_TQ / 2, H_TQ / 2); c.textAlign = 'left'; }
    VivoComun.estado(c, W_TQ, H_TQ, TQ.enlace, nombreJugador(miRival), e.fase === 'jugando' && falta < -500 && !TQ.muerto && !(TQ.el && TQ.el.muerto));
}
function bucleTq(ts){
    const pantalla = document.getElementById('pantalla-tanques');
    if (!pantalla || !pantalla.classList.contains('activa')) { pararTq(); return; }
    const dt = Math.min(2.5, (ts - (TQ.ultimoTs || ts)) / 16.67 || 1);
    TQ.ultimoTs = ts;
    pasoTq(dt);
    if (TQ.enlace && TQ.yo && Date.now() - TQ.ultimoEnvio > 50) {
        TQ.ultimoEnvio = Date.now();
        TQ.enlace.enviar('p', { x: +TQ.yo.x.toFixed(1), y: +TQ.yo.y.toFixed(1), a: +TQ.yo.a.toFixed(3), m: TQ.muerto ? 1 : 0, c: TQ.clave });
    }
    if (TQ.estado && TQ.estado.fase === 'jugando') VivoComun.cuenta('TQ', TQ.estado.inicio);
    dibujarTq();
    TQ.loop = requestAnimationFrame(bucleTq);
}
function arrancarTq(){
    if (!TQ.canvas) {
        TQ.canvas = document.createElement('canvas');
        TQ.canvas.width = W_TQ * 2; TQ.canvas.height = H_TQ * 2;
        TQ.canvas.className = 'lienzo-tanques';
        TQ.ctx = TQ.canvas.getContext('2d');
        TQ.controles = VivoComun.botones([[{ k: 'izq', txt: '⟲', aria: 'Girar a la izquierda' }, { k: 'der', txt: '⟳', aria: 'Girar a la derecha' }], [{ k: 'atras', txt: '▼', aria: 'Atrás' }, { k: 'gas', txt: '▲', aria: 'Avanzar' }], { k: 'fuego', txt: '💥', clase: 'salto', aria: 'Disparar' }], TQ.teclas);
        TQ.controles.classList.add('compactos');
    }
    if (!TQ.teclado) TQ.teclado = VivoComun.teclado('pantalla-tanques', { ArrowLeft: 'izq', KeyA: 'izq', ArrowRight: 'der', KeyD: 'der', ArrowUp: 'gas', KeyW: 'gas', ArrowDown: 'atras', KeyS: 'atras', Space: 'fuego', Enter: 'fuego' }, TQ.teclas);
    if (!TQ.enlace) {
        TQ.enlace = EnlaceVivo.conectar('tanques', {
            alMensaje(t, d) {
                if (d.c !== TQ.clave) return;
                if (t === 'p') { TQ.el = VivoComun.recibir(TQ.el, { x: d.x, y: d.y }); TQ.el.a = d.a; TQ.el.muerto = !!d.m; }
                if (t === 'bala' && !TQ.balas.some(b => b.id === d.id)) {
                    // La bala salió hace un ratito: la adelanto lo que tardó en llegar.
                    const b = { id: d.id, de: d.de, x: d.x, y: d.y, vx: d.vx, vy: d.vy, t: d.t, rebotes: 0 };
                    const atraso = Math.min(20, Math.max(0, (window.ahoraSync() - d.t) / 16.67));
                    for (let i = 0; i < atraso; i++) moverBalaTq(b, 1);
                    TQ.balas.push(b);
                    if (window.sfx) window.sfx.golpe();
                }
                if (t === 'boom') { TQ.balas = TQ.balas.filter(b => b.id !== d.bala); TQ.chispas.push({ x: d.x, y: d.y, t: Date.now() }); if (TQ.el) TQ.el.muerto = true; if (window.sfx) window.sfx.explosion(); }
            }
        });
    }
    if (!TQ.loop) TQ.loop = requestAnimationFrame(bucleTq);
    window._unsubLoopTanques = pararTq;
}
function pararTq(){
    if (TQ.loop) cancelAnimationFrame(TQ.loop);
    TQ.loop = null;
    if (TQ.enlace) TQ.enlace.cerrar();
    TQ.enlace = null; Object.keys(TQ.teclas).forEach(k => { TQ.teclas[k] = false; });
}

const Tanques = JuegoTurnos.crear({
    id: 'tanques',
    sinTurno: true,
    emojiListo: '🎯',
    intro: `Un tanque para cada uno en un laberinto, en vivo. ⟲ ⟳ para girar, ▲ ▼ para moverte y 💥 para disparar. Las balas rebotan en las paredes… ¡y te pueden dar a vos! Gana el primero en ganar ${RONDAS_TQ} rondas.`,
    inicial: () => ({ puntos: { nico: 0, carito: 0 }, semilla: Math.floor(Math.random() * 1e9), clave: Math.random().toString(36).slice(2, 7), inicio: window.ahoraSync() + 3000, turno: null }),
    render(e) { return `<div id="tanques-host"></div><div class="texto-centro texto-tenue" style="font-size:0.75rem;">Vos sos el ${miIdentidad === 'nico' ? 'azul (abajo)' : 'rosa (arriba)'}. Rondas: ${nombreJugador('nico')} ${e.puntos.nico} — ${e.puntos.carito} ${nombreJugador('carito')}</div>`; },
    alDibujar(cont, e) {
        TQ.estado = e;
        const host = cont.querySelector('#tanques-host');
        if (!host) return;
        if (TQ.clave !== e.clave) reiniciarTq(e);
        if (e.fase === 'jugando') { arrancarTq(); host.appendChild(TQ.canvas); host.appendChild(TQ.controles); }
        else if (TQ.canvas) { host.appendChild(TQ.canvas); dibujarTq(); }
    }
});
window._tanques = TQ; // para pruebas
