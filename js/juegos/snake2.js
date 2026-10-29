// ==================== VIBORITA DE A DOS (en vivo) ====================
// Las dos víboras en la misma grilla, en vivo, durante 2 minutos. Hay una
// manzana por vez y sale en el mismo lugar para los dos (sale de la semilla
// y del número de manzana). La come quien llega primero (transacción en el
// doc). Chocar con tu cuerpo o con el del otro te corta a la mitad. Los
// bordes son pasadizos (salís por el otro lado). Al final gana la más larga.
// Cada uno simula su víbora a 8 pasos por segundo con el reloj compartido
// y manda su cuerpo entero por js/enlace-vivo.js (lista plana x,y,x,y...).
const COLS_SN = 24, FILAS_SN = 30, CEL_SN = 12, PASO_SN = 125, DURA_SN = 120000;
const DIR_SN = { arriba: [0, -1], abajo: [0, 1], izq: [-1, 0], der: [1, 0] };
const SN = { canvas: null, ctx: null, enlace: null, loop: null, estado: null, clave: null, yo: null, el: null, pendiente: [], comiendo: null, ultimoPaso: -1, fantasma: 0, cerrando: false };

function rngSn(semilla){ let a = semilla >>> 0; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
// La manzana número n: misma en los dos celus. Evita las filas de salida.
function manzanaSn(e, n){
    const r = rngSn((e.semilla || 1) + n * 7919);
    return [1 + Math.floor(r() * (COLS_SN - 2)), 2 + Math.floor(r() * (FILAS_SN - 4))];
}
function salidaSn(q){
    return q === 'nico' ? { x: 5, y: FILAS_SN - 5, dir: 'arriba' } : { x: COLS_SN - 6, y: 4, dir: 'abajo' };
}
function reiniciarSn(e){
    SN.clave = e.clave;
    const s = salidaSn(miIdentidad), [dx, dy] = DIR_SN[s.dir];
    SN.yo = { cuerpo: [0, 1, 2].map(i => [s.x - dx * i, s.y - dy * i]), dir: s.dir, k: 0, crecer: 0 };
    const o = salidaSn(miRival), [ox, oy] = DIR_SN[o.dir];
    SN.el = { cuerpo: [0, 1, 2].map(i => [o.x - ox * i, o.y - oy * i]), visto: 0 };
    if (compuSn()) Object.assign(SN.el, { bot: true, dir: o.dir, crecer: 0, hasta: 0, visto: Date.now() });
    SN.pendiente = []; SN.comiendo = null; SN.ultimoPaso = -1; SN.fantasma = 0; SN.cerrando = false;
}
// Contra la compu: la otra víbora la maneja la compu en este celu.
const compuSn = () => { const m = typeof window.modoCompu === 'function' && window.modoCompu(); return m && m.juego === 'snake2' ? m : null; };
const envolverSn = (x, y) => [(x + COLS_SN) % COLS_SN, (y + FILAS_SN) % FILAS_SN];
function pasoSn(){
    const e = SN.estado, p = SN.yo;
    if (!e || e.fase !== 'jugando' || !p) return;
    const ahora = window.ahoraSync();
    if (ahora < e.inicio) return;
    if (ahora >= e.inicio + DURA_SN) { terminarSn(); return; }
    const debido = Math.floor((ahora - e.inicio) / PASO_SN);
    let n = 0;
    while (p.k < debido && n++ < 4) {
        // Giros en fila (para que dos toques rápidos hagan una U).
        while (SN.pendiente.length) {
            const d = SN.pendiente.shift(), [ax, ay] = DIR_SN[p.dir], [bx, by] = DIR_SN[d];
            if (ax + bx !== 0 || ay + by !== 0) { p.dir = d; break; }
        }
        const [dx, dy] = DIR_SN[p.dir], cab = p.cuerpo[0];
        const nueva = envolverSn(cab[0] + dx, cab[1] + dy);
        p.cuerpo.unshift(nueva);
        if (p.crecer > 0) p.crecer--; else p.cuerpo.pop();
        p.k++;
        // Manzana
        const m = manzanaSn(e, e.manzana || 0);
        if (nueva[0] === m[0] && nueva[1] === m[1] && SN.comiendo !== e.manzana) comerSn(e.manzana || 0);
        // Choques (con un segundito de fantasma después de cortarte)
        if (Date.now() > SN.fantasma) {
            const contra = (lista, desde) => lista.slice(desde).some(c => c[0] === nueva[0] && c[1] === nueva[1]);
            // La cola del otro puede venir un paso atrasada: esa celda no cuenta.
            const otro = SN.el && Date.now() - SN.el.visto < 2000 && !SN.el.fantasma ? SN.el.cuerpo.slice(0, -1) : [];
            if (contra(p.cuerpo, 1) || contra(otro, 0)) cortarSn();
        }
        const compu = compuSn();
        if (compu && SN.el && SN.el.bot) pasoBotSn(e, SN.el, compu.nivel);
    }
}
// La compu: va hacia la manzana por las celdas libres; en fácil a veces se distrae.
function pasoBotSn(e, b, nivel){
    const ocupada = (c) => b.cuerpo.slice(0, -1).some(x => x[0] === c[0] && x[1] === c[1]) || SN.yo.cuerpo.some(x => x[0] === c[0] && x[1] === c[1]);
    const [mx, my] = manzanaSn(e, e.manzana || 0), cab = b.cuerpo[0];
    const opciones = Object.keys(DIR_SN).filter(d => { const [a, c] = DIR_SN[d], [x, y] = DIR_SN[b.dir]; return a + x !== 0 || c + y !== 0; })
        .map(d => { const [a, c] = DIR_SN[d], n = envolverSn(cab[0] + a, cab[1] + c); return { d, n, libre: !ocupada(n), dist: Math.abs(n[0] - mx) + Math.abs(n[1] - my) }; });
    const libres = opciones.filter(o => o.libre).sort((a, c) => a.dist - c.dist);
    const distraida = { facil: 0.3, normal: 0.1, dificil: 0 }[nivel] ?? 0.1;
    let elegida = libres[0] || opciones[0];
    if (libres.length > 1 && Math.random() < distraida) elegida = libres[1 + Math.floor(Math.random() * (libres.length - 1))];
    b.dir = elegida.d;
    b.cuerpo.unshift(elegida.n);
    if (b.crecer > 0) b.crecer--; else b.cuerpo.pop();
    b.visto = Date.now(); b.fantasma = Date.now() < b.hasta;
    const n = e.manzana || 0;
    if (elegida.n[0] === mx && elegida.n[1] === my && b.comiendo !== n) {
        b.comiendo = n;
        const clave = SN.clave, bot = miRival;
        Snake2.accionEnCola((st) => st.clave !== clave || (st.manzana || 0) !== n ? null : { manzana: n + 1, largos: { ...st.largos, [bot]: b.cuerpo.length + 2 } })
            .then(res => { if (res) b.crecer += 2; });
    } else if (!b.fantasma && !elegida.libre) {
        b.hasta = Date.now() + 1200;
        b.cuerpo = b.cuerpo.slice(0, Math.max(3, Math.ceil(b.cuerpo.length / 2))); b.crecer = 0;
        const clave = SN.clave, bot = miRival, largo = b.cuerpo.length;
        Snake2.accionEnCola((st) => st.clave !== clave ? null : { largos: { ...st.largos, [bot]: largo } });
    }
}
async function comerSn(n){
    SN.comiendo = n;
    const clave = SN.clave, quien = miIdentidad;
    const res = await Snake2.accionEnCola((e) => {
        if (e.clave !== clave || (e.manzana || 0) !== n) return null;
        return { manzana: n + 1, largos: { ...e.largos, [quien]: SN.yo.cuerpo.length + 2 } };
    });
    if (res) { SN.yo.crecer += 2; vibrarJ(12); if (window.sfx) window.sfx.acierto(); }
}
function cortarSn(){
    const p = SN.yo;
    SN.fantasma = Date.now() + 1200;
    p.cuerpo = p.cuerpo.slice(0, Math.max(3, Math.ceil(p.cuerpo.length / 2)));
    p.crecer = 0;
    vibrarJ([30, 30, 30]);
    if (window.sfx) window.sfx.error();
    if (window.animJuegos) window.animJuegos.cartel('¡Ay! Te cortaste a la mitad', { dur: 800, sonido: false });
    const clave = SN.clave, quien = miIdentidad, largo = p.cuerpo.length;
    Snake2.accionEnCola((e) => e.clave !== clave ? null : { largos: { ...e.largos, [quien]: largo } });
}
async function terminarSn(){
    if (SN.cerrando) return;
    SN.cerrando = true;
    const clave = SN.clave, quien = miIdentidad, largo = SN.yo.cuerpo.length;
    // Primero dejo mi largo final; el que cierra compara los dos.
    const bot = compuSn() && SN.el ? { [miRival]: SN.el.cuerpo.length } : {};
    await Snake2.accionEnCola((e) => e.clave !== clave ? null : { largos: { ...e.largos, [quien]: largo, ...bot } });
    setTimeout(() => Snake2.accionEnCola((e) => {
        if (e.clave !== clave || window.ahoraSync() < e.inicio + DURA_SN) return null;
        const l = e.largos, g = l.nico === l.carito ? 'empate' : l.nico > l.carito ? 'nico' : 'carito';
        return { ganador: g, motivo: `Largos: ${nombreJugador('nico')} ${l.nico} · ${nombreJugador('carito')} ${l.carito}` };
    }), 700);
}
function dibujarSn(){
    const c = SN.ctx, e = SN.estado;
    if (!c || !e || !SN.yo) return;
    const W = COLS_SN * CEL_SN, H = FILAS_SN * CEL_SN;
    c.fillStyle = '#1b2a1e'; c.fillRect(0, 0, W, H);
    for (let y = 0; y < FILAS_SN; y++) for (let x = 0; x < COLS_SN; x++) if ((x + y) % 2) { c.fillStyle = '#1f3123'; c.fillRect(x * CEL_SN, y * CEL_SN, CEL_SN, CEL_SN); }
    if (e.fase === 'jugando') {
        const [mx, my] = manzanaSn(e, e.manzana || 0), t = Date.now() / 200;
        const r = CEL_SN / 2 - 1 + Math.sin(t) * 0.6;
        c.fillStyle = '#ff4a4a'; c.beginPath(); c.arc(mx * CEL_SN + CEL_SN / 2, my * CEL_SN + CEL_SN / 2 + 1, r, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#5bd15b'; c.fillRect(mx * CEL_SN + CEL_SN / 2, my * CEL_SN, 3, 3);
        c.fillStyle = 'rgba(255,255,255,0.5)'; c.fillRect(mx * CEL_SN + 3, my * CEL_SN + 4, 2, 2);
    }
    const vibora = (cuerpo, col, claro, dir, fantasma) => {
        c.globalAlpha = fantasma ? 0.5 + Math.sin(Date.now() / 60) * 0.25 : 1;
        cuerpo.forEach(([x, y], i) => { c.fillStyle = i % 2 ? col : claro; c.fillRect(x * CEL_SN + 1, y * CEL_SN + 1, CEL_SN - 2, CEL_SN - 2); });
        if (cuerpo.length) {
            const [x, y] = cuerpo[0], [dx, dy] = DIR_SN[dir] || [0, -1];
            c.fillStyle = col; c.fillRect(x * CEL_SN, y * CEL_SN, CEL_SN, CEL_SN);
            c.fillStyle = '#fff';
            const cx = x * CEL_SN + CEL_SN / 2, cy = y * CEL_SN + CEL_SN / 2;
            [-1, 1].forEach(s => { c.fillRect(cx + dx * 2 - dy * s * 3 - 1.5, cy + dy * 2 + dx * s * 3 - 1.5, 3, 3); });
        }
        c.globalAlpha = 1;
    };
    const col = (q) => q === 'nico' ? ['#3d8bfd', '#8cc4ff'] : ['#e8496b', '#ffa3b8'];
    if (SN.el) {
        const o = SN.el.cuerpo, d = o.length > 1 ? Object.keys(DIR_SN).find(k => { const [dx, dy] = DIR_SN[k]; return envolverSn(o[1][0] + dx, o[1][1] + dy).join() === o[0].join(); }) : 'abajo';
        vibora(o, ...col(miRival), d, SN.el.fantasma);
    }
    vibora(SN.yo.cuerpo, ...col(miIdentidad), SN.yo.dir, Date.now() < SN.fantasma);
    // Tablero
    c.fillStyle = 'rgba(0,0,0,0.5)'; c.fillRect(0, 0, W, 16);
    c.fillStyle = '#fff'; c.font = 'bold 10px monospace';
    const quedan = Math.max(0, Math.ceil((e.inicio + DURA_SN - window.ahoraSync()) / 1000));
    const ly = SN.yo.cuerpo.length, le = SN.el ? SN.el.cuerpo.length : 3;
    c.fillText(`🐍 Vos ${ly} · ${nombreJugador(miRival)} ${le}`, 4, 12);
    c.textAlign = 'right'; c.fillText(`⏱ ${Math.floor(quedan / 60)}:${String(quedan % 60).padStart(2, '0')}`, W - 12, 12); c.textAlign = 'left';
    VivoComun.estado(c, W, H, SN.enlace, nombreJugador(miRival), e.fase === 'jugando' && window.ahoraSync() > e.inicio + 500);
    const falta = e.inicio - window.ahoraSync();
    if (e.fase === 'jugando' && falta > 0) { c.fillStyle = '#fff'; c.textAlign = 'center'; c.font = 'bold 30px monospace'; c.fillText(String(Math.ceil(falta / 1000)), W / 2, H / 2); c.font = '10px monospace'; c.fillText('Vos sos la ' + (miIdentidad === 'nico' ? 'azul' : 'rosa'), W / 2, H / 2 + 20); c.textAlign = 'left'; }
}
function bucleSn(){
    const pantalla = document.getElementById('pantalla-snake2');
    if (!pantalla || !pantalla.classList.contains('activa')) { pararSn(); return; }
    pasoSn();
    if (SN.enlace && SN.yo && SN.yo.k !== SN.ultimoPaso) {
        SN.ultimoPaso = SN.yo.k;
        SN.enlace.enviar('cuerpo', { k: SN.yo.k, b: SN.yo.cuerpo.flat(), f: Date.now() < SN.fantasma ? 1 : 0, c: SN.clave });
    }
    if (SN.estado && SN.estado.fase === 'jugando') VivoComun.cuenta('SN', SN.estado.inicio);
    dibujarSn();
    SN.loop = requestAnimationFrame(bucleSn);
}
function girarSn(d){ if (!SN.yo) return; vibrarJ(5); if (SN.pendiente.length < 3) SN.pendiente.push(d); }
function arrancarSn(){
    if (!SN.canvas) {
        SN.canvas = document.createElement('canvas');
        SN.canvas.width = COLS_SN * CEL_SN; SN.canvas.height = FILAS_SN * CEL_SN;
        SN.canvas.className = 'lienzo-snake2';
        SN.ctx = SN.canvas.getContext('2d');
        let ini = null;
        SN.canvas.addEventListener('pointerdown', (ev) => { ini = [ev.clientX, ev.clientY]; });
        SN.canvas.addEventListener('pointermove', (ev) => {
            if (!ini) return;
            const dx = ev.clientX - ini[0], dy = ev.clientY - ini[1];
            if (Math.max(Math.abs(dx), Math.abs(dy)) < 16) return;
            girarSn(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'der' : 'izq') : (dy > 0 ? 'abajo' : 'arriba')); ini = [ev.clientX, ev.clientY];
        });
        SN.canvas.addEventListener('pointerup', () => { ini = null; });
        SN.botones = document.createElement('div');
        SN.botones.className = 'cruceta-sn';
        SN.botones.innerHTML = ['arriba', 'izq', 'der', 'abajo'].map(d => `<button class="sn-${d}" aria-label="${d}">${{ arriba: '▲', izq: '◀', der: '▶', abajo: '▼' }[d]}</button>`).join('');
        SN.botones.querySelectorAll('button').forEach((b, i) => b.addEventListener('pointerdown', (ev) => { ev.preventDefault(); girarSn(['arriba', 'izq', 'der', 'abajo'][i]); }));
    }
    if (!SN.teclado) {
        const mapa = { ArrowUp: 'arriba', KeyW: 'arriba', ArrowDown: 'abajo', KeyS: 'abajo', ArrowLeft: 'izq', KeyA: 'izq', ArrowRight: 'der', KeyD: 'der' };
        SN.teclado = (ev) => { const d = mapa[ev.code]; if (!d || !document.getElementById('pantalla-snake2')?.classList.contains('activa') || (ev.target && ev.target.tagName === 'INPUT')) return; ev.preventDefault(); girarSn(d); };
        window.addEventListener('keydown', SN.teclado);
    }
    if (!SN.enlace && !compuSn()) {
        SN.enlace = EnlaceVivo.conectar('snake2', {
            alMensaje(t, d) {
                if (d.c !== SN.clave || t !== 'cuerpo' || !Array.isArray(d.b)) return;
                const cuerpo = [];
                for (let i = 0; i + 1 < d.b.length; i += 2) cuerpo.push([d.b[i], d.b[i + 1]]);
                SN.el = { cuerpo, visto: Date.now(), fantasma: !!d.f };
            }
        });
    }
    if (!SN.loop) SN.loop = requestAnimationFrame(bucleSn);
    window._unsubLoopSnake2 = pararSn;
}
function pararSn(){
    if (SN.loop) cancelAnimationFrame(SN.loop);
    SN.loop = null;
    if (SN.enlace) SN.enlace.cerrar();
    SN.enlace = null;
}

const Snake2 = JuegoTurnos.crear({
    id: 'snake2',
    sinTurno: true,
    emojiListo: '🐍',
    compu: { paso: () => null }, // la compu juega adentro del bucle (pasoBotSn)
    intro: `Las dos víboras en la misma grilla, en vivo, durante 2 minutos. Comé las manzanas antes que el otro 🍎 y no choques con ningún cuerpo, que te corta a la mitad. Los bordes son pasadizos. ¡Gana la más larga!`,
    inicial: () => ({ semilla: Math.floor(Math.random() * 1e9), manzana: 0, largos: { nico: 3, carito: 3 }, clave: Math.random().toString(36).slice(2, 7), inicio: window.ahoraSync() + 3000, turno: null }),
    render(e) { return `<div id="snake2-host"></div><div class="texto-centro texto-tenue" style="font-size:0.75rem;">${nombreJugador('nico')} es la azul · ${nombreJugador('carito')} la rosa · deslizá el dedo o usá las flechas</div>`; },
    alDibujar(cont, e) {
        SN.estado = e;
        const host = cont.querySelector('#snake2-host');
        if (!host) return;
        if (SN.clave !== e.clave) reiniciarSn(e);
        if (e.fase === 'jugando') { arrancarSn(); host.appendChild(SN.canvas); host.appendChild(SN.botones); }
        else if (SN.canvas) { host.appendChild(SN.canvas); dibujarSn(); }
    }
});
window._snake2 = SN; // para pruebas
