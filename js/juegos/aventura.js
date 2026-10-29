// ==================== AVENTURA DE A DOS (plataformas cooperativo en vivo) ====================
// Al estilo de los Mario de antes, pero de a dos y en el mismo nivel: cada
// uno maneja su personaje en su celu y ve al otro moverse en vivo (las
// posiciones viajan por js/enlace-vivo.js, directo entre los celulares).
// Cooperación: subirse a la cabeza del otro para llegar alto, pisar una
// placa para abrir puertas o hacer aparecer escaleras, y llegar los dos a
// la bandera. Vidas compartidas, monedas compartidas, 4 niveles.
//
// El doc juegos/aventura (base-turnos) guarda lo que tiene que quedar:
// nivel, vidas, quién llegó a la bandera y qué se tomó (monedas, bloques,
// bichos pisados). Lo que pasa 20 veces por segundo (dónde está cada uno)
// va sólo por el enlace. Los bichos caminan "solos" según el reloj
// compartido, así los dos los ven en el mismo lugar sin sincronizarlos.
const T_AV = 16, FILAS_AV = 11, VISTA_AV = 16;
const GRAV_AV = 0.45, SALTO_AV = 7.2, VEL_AV = 1.9, CAIDA_AV = 7;
const VIDAS_AV = 6;
const ANCHO_PJ = 11, ALTO_PJ = 15;

// ---------- Niveles (se arman con piezas, más fácil de leer que un mapa a mano) ----------
function armarNivelAv(ancho, piezas){
    const g = Array.from({ length: FILAS_AV }, (_, f) => Array(ancho).fill(f >= 9 ? '#' : '.'));
    const pon = (x, y, c) => { if (x >= 0 && x < ancho && y >= 0 && y < FILAS_AV) g[y][x] = c; };
    piezas.forEach(([tipo, x, a, b]) => {
        if (tipo === 'hueco') for (let i = 0; i < a; i++) { pon(x + i, 9, '.'); pon(x + i, 10, '.'); }
        if (tipo === 'fila') [...b].forEach((c, i) => pon(x + i, a, c));          // ['fila', x, y, '=?=']
        if (tipo === 'col') for (let i = 0; i < a; i++) pon(x, 8 - i, '#');      // columna de a altos
        if (tipo === 'monedas') for (let i = 0; i < b; i++) pon(x + i, a, 'o');   // ['monedas', x, y, n]
        if (tipo === 'pinchos') for (let i = 0; i < a; i++) pon(x + i, 8, '^');
        if (tipo === 'puerta') { for (let y = 0; y <= 5; y++) pon(x, y, '#'); for (let y = 6; y <= 8; y++) pon(x, y, 'D'); }
        if (tipo === 'muro') for (let i = 0; i < a; i++) for (let y = 5; y <= 8; y++) pon(x + i, y, '#'); // muro de 4: hay que subirse al otro
        if (tipo === 'escalera') { for (let k = 0; k < 3; k++) for (let y = 8 - k; y <= 8; y++) pon(x + k, y, 'L'); } // aparece con la placa
        if (tipo === 'placa') pon(x, a == null ? 8 : a, 'b');
        if (['E', 'C', 'F', 'S'].includes(tipo)) pon(x, tipo === 'F' ? 8 : 8, tipo === 'E' ? 'E' : tipo);
    });
    return g.map(f => f.join(''));
}
const NIVELES_AV = [
    { nombre: 'La pradera', cielo: ['#7cc8ff', '#c8ecff'], suelo: '#8a5a36', pasto: '#4cbf5a', mapa: armarNivelAv(92, [
        ['S', 2], ['monedas', 6, 6, 4], ['fila', 12, 5, '?=?'], ['E', 18], ['hueco', 24, 2], ['monedas', 23, 6, 4], ['col', 30, 2], ['E', 36], ['E', 41],
        ['placa', 46], ['puerta', 50], ['placa', 54], ['C', 57], ['hueco', 62, 2], ['pinchos', 68, 2], ['fila', 72, 5, '=?='], ['E', 77],
        ['col', 80, 1], ['col', 81, 2], ['col', 82, 3], ['monedas', 84, 6, 2], ['F', 88]]) },
    { nombre: 'El atardecer', cielo: ['#ff9a8b', '#ffd7a8'], suelo: '#7a4a2e', pasto: '#3fae6a', mapa: armarNivelAv(90, [
        ['S', 2], ['monedas', 5, 6, 3], ['E', 11], ['escalera', 17], ['muro', 20, 6], ['placa', 24, 4], ['monedas', 21, 3, 4], ['C', 30],
        ['hueco', 34, 3], ['fila', 34, 6, '==='], ['E', 41], ['E', 45], ['escalera', 49], ['muro', 52, 3], ['placa', 53, 4],
        ['pinchos', 60, 3], ['fila', 64, 5, '?=?=?'], ['E', 70], ['hueco', 75, 2], ['col', 80, 2], ['F', 86]]) },
    { nombre: 'La noche estrellada', cielo: ['#1b1d4a', '#3b2a6e'], suelo: '#4a3a5a', pasto: '#5d7bd6', estrellas: true, mapa: armarNivelAv(92, [
        ['S', 2], ['E', 12], ['E', 16], ['monedas', 14, 6, 3], ['E', 21], ['hueco', 26, 3], ['pinchos', 34, 2], ['fila', 36, 5, '?'],
        ['placa', 40], ['puerta', 44], ['placa', 48], ['C', 51], ['escalera', 55], ['muro', 58, 4], ['placa', 60, 4], ['monedas', 58, 3, 4],
        ['E', 66], ['E', 70], ['hueco', 76, 2], ['pinchos', 80, 2], ['monedas', 79, 6, 4], ['F', 88]]) },
    { nombre: 'El castillo', cielo: ['#2a2238', '#4a3550'], suelo: '#5a5068', pasto: '#9a8fb0', castillo: true, mapa: armarNivelAv(94, [
        ['S', 2], ['fila', 8, 6, '====='], ['monedas', 8, 5, 5], ['pinchos', 9, 3], ['E', 16], ['placa', 22], ['puerta', 26], ['placa', 30], ['C', 32],
        ['hueco', 36, 4], ['fila', 37, 7, '=='], ['escalera', 43], ['muro', 46, 4], ['placa', 48, 4], ['fila', 54, 6, '====='], ['pinchos', 54, 5],
        ['E', 62], ['E', 66], ['E', 70], ['col', 76, 1], ['col', 77, 2], ['col', 78, 3], ['fila', 82, 5, '?=?'], ['F', 90]]) },
];

// ---------- Estado local del motor ----------
const AV = {
    nivelCargado: null, mapa: null, ancho: 0, bichos: [], yo: null, otro: null, enlace: null, loop: null,
    canvas: null, ctx: null, controles: null, teclas: { izq: false, der: false, salto: false }, tomados: new Set(),
    ultimoEnvio: 0, checkpoint: null, invulnerable: 0, estado: null, camara: 0, saltoPrevio: false, llegue: false, monedasLocal: 0, muriendo: false,
};

function cargarNivelAv(e){
    const n = NIVELES_AV[e.nivel - 1];
    AV.nivelCargado = e.nivel + '-' + e.inicio;
    AV.mapa = n.mapa.map(f => f.split(''));
    AV.ancho = AV.mapa[0].length;
    AV.tomados = new Set(e.tomados || []);
    AV.bichos = [];
    for (let y = 0; y < FILAS_AV; y++) for (let x = 0; x < AV.ancho; x++) {
        const c = AV.mapa[y][x];
        if (c === 'E') {
            AV.mapa[y][x] = '.';
            // Camina entre paredes o bordes de pozos.
            let a = x, b = x;
            while (a > 0 && !esSolidoPatrullaAv(a - 1, y) && esSolidoPatrullaAv(a - 1, y + 1)) a--;
            while (b < AV.ancho - 1 && !esSolidoPatrullaAv(b + 1, y) && esSolidoPatrullaAv(b + 1, y + 1)) b++;
            AV.bichos.push({ id: `e-${x}-${y}`, min: a * T_AV, max: b * T_AV + T_AV - 14, y: y * T_AV + 4, fase: (x * 37) % 100 });
        }
        if (c === 'S') { AV.mapa[y][x] = '.'; AV.inicioX = x * T_AV; AV.inicioY = y * T_AV; }
    }
    AV.tomados.forEach(id => aplicarTomadoAv(id));
    const separa = miIdentidad === 'nico' ? 0 : 18;
    AV.checkpoint = { x: AV.inicioX + separa, y: AV.inicioY };
    AV.yo = { x: AV.checkpoint.x, y: AV.checkpoint.y, vx: 0, vy: 0, suelo: false, dir: 1, paso: 0 };
    AV.otro = AV.otro || null;
    AV.llegue = !!(e.llegaron && e.llegaron[miIdentidad]);
    AV.invulnerable = 0;
}
function aplicarTomadoAv(id){
    const [t, xs, ys] = id.split('-'), x = +xs, y = +ys;
    if (t === 'c' && AV.mapa[y] && AV.mapa[y][x] === 'o') AV.mapa[y][x] = '.';
    if (t === 'q' && AV.mapa[y] && AV.mapa[y][x] === '?') AV.mapa[y][x] = 'X';
}
const celdaAv = (x, y) => (y < 0 ? '.' : y >= FILAS_AV || x < 0 || x >= AV.ancho ? (y >= FILAS_AV ? '.' : '#') : AV.mapa[y][x]);
function esSolidoPatrullaAv(x, y){ const c = celdaAv(x, y); return c === '#' || c === '=' || c === '?' || c === 'X' || c === 'D'; }
function placaApretadaAv(){
    const otroAprieta = AV.otro && AV.otro.p && AV.otro.n === AV.estado?.nivel && Date.now() - AV.otro.visto < 1500;
    return pisoPlacaAv(AV.yo) || !!otroAprieta;
}
function pisoPlacaAv(p){
    if (!p) return false;
    const x0 = Math.floor((p.x + 1) / T_AV), x1 = Math.floor((p.x + ANCHO_PJ - 1) / T_AV), y = Math.floor((p.y + ALTO_PJ - 2) / T_AV);
    for (let x = x0; x <= x1; x++) if (celdaAv(x, y) === 'b') return true;
    return false;
}
function esSolidoAv(x, y, placa){
    const c = celdaAv(x, y);
    if (c === '#' || c === '=' || c === '?' || c === 'X') return true;
    if (c === 'D') return !placa;
    if (c === 'L') return placa;
    return false;
}
function posBichoAv(b){
    const largo = b.max - b.min;
    if (largo <= 0) return b.min;
    const t = (window.ahoraSync() - (AV.estado?.inicio || 0)) / 1000 * 28 + b.fase;
    const p = ((t % (2 * largo)) + 2 * largo) % (2 * largo);
    return b.min + (p < largo ? p : 2 * largo - p);
}

// ---------- Física de mi personaje ----------
function pasoFisicaAv(dt){
    const p = AV.yo, e = AV.estado;
    if (!p || !e || e.fase !== 'jugando' || window.ahoraSync() < e.inicio || AV.muriendo) return;
    const placa = placaApretadaAv();
    const k = AV.teclas;
    const objetivo = (k.der ? 1 : 0) - (k.izq ? 1 : 0);
    if (objetivo) p.dir = objetivo;
    p.vx += (objetivo * VEL_AV - p.vx) * Math.min(1, (p.suelo ? 0.35 : 0.18) * dt);
    if (k.salto && !AV.saltoPrevio && p.suelo) { p.vy = -SALTO_AV; p.suelo = false; if (window.sfx) window.sfx.click(); }
    if (!k.salto && p.vy < -2.5) p.vy *= 0.6; // salto variable: soltar antes = saltito
    AV.saltoPrevio = k.salto;
    p.vy = Math.min(CAIDA_AV, p.vy + GRAV_AV * dt);
    // Horizontal
    p.x += p.vx * dt;
    const chocaX = () => { const y0 = Math.floor(p.y / T_AV), y1 = Math.floor((p.y + ALTO_PJ - 1) / T_AV), xc = Math.floor((p.vx > 0 ? p.x + ANCHO_PJ - 1 : p.x) / T_AV); for (let y = y0; y <= y1; y++) if (esSolidoAv(xc, y, placa)) return xc; return null; };
    const cx = chocaX();
    if (cx != null) { p.x = p.vx > 0 ? cx * T_AV - ANCHO_PJ : (cx + 1) * T_AV; p.vx = 0; }
    if (p.x < 0) p.x = 0;
    // Vertical
    const yAntes = p.y;
    p.y += p.vy * dt;
    p.suelo = false;
    const x0 = Math.floor(p.x / T_AV), x1 = Math.floor((p.x + ANCHO_PJ - 1) / T_AV);
    if (p.vy > 0) {
        const yc = Math.floor((p.y + ALTO_PJ) / T_AV);
        for (let x = x0; x <= x1; x++) if (esSolidoAv(x, yc, placa)) { p.y = yc * T_AV - ALTO_PJ; p.vy = 0; p.suelo = true; break; }
        // ¡Arriba de la cabeza del otro!
        const o = AV.otro;
        if (!p.suelo && o && o.n === e.nivel && Date.now() - o.visto < 1500 && p.x + ANCHO_PJ > o.x + 1 && p.x < o.x + ANCHO_PJ - 1 && yAntes + ALTO_PJ <= o.y + 3 && p.y + ALTO_PJ >= o.y) {
            p.y = o.y - ALTO_PJ; p.vy = 0; p.suelo = true; p.x += (o.vx || 0) * dt * 0.8;
        }
    } else if (p.vy < 0) {
        const yc = Math.floor(p.y / T_AV);
        for (let x = x0; x <= x1; x++) if (esSolidoAv(x, yc, placa)) {
            p.y = (yc + 1) * T_AV; p.vy = 0;
            if (celdaAv(x, yc) === '?') tomarAv(`q-${x}-${yc}`, true);
            break;
        }
    }
    p.paso += Math.abs(p.vx) * dt;
    // Monedas, pinchos, bandera, checkpoint
    const cx0 = Math.floor((p.x + 2) / T_AV), cx1 = Math.floor((p.x + ANCHO_PJ - 2) / T_AV), cy0 = Math.floor((p.y + 2) / T_AV), cy1 = Math.floor((p.y + ALTO_PJ - 1) / T_AV);
    for (let y = cy0; y <= cy1; y++) for (let x = cx0; x <= cx1; x++) {
        const c = celdaAv(x, y);
        if (c === 'o') tomarAv(`c-${x}-${y}`, true);
        if (c === '^' && y === cy1 && AV.invulnerable <= 0) { morirAv('¡Ay, los pinchos!'); return; }
        if (c === 'C' && (AV.checkpoint.x !== x * T_AV)) { AV.checkpoint = { x: x * T_AV, y: 8 * T_AV }; if (window.sfx) window.sfx.acierto(); }
        if (c === 'F' && !AV.llegue) llegarAv();
    }
    if (p.y > FILAS_AV * T_AV + 20) { morirAv('¡Al pozo!'); return; }
    // Bichos
    if (AV.invulnerable > 0) AV.invulnerable -= dt;
    for (const b of AV.bichos) {
        if (AV.tomados.has(b.id)) continue;
        const bx = posBichoAv(b);
        if (p.x + ANCHO_PJ > bx + 1 && p.x < bx + 13 && p.y + ALTO_PJ > b.y + 2 && p.y < b.y + 12) {
            if (p.vy > 0 && yAntes + ALTO_PJ <= b.y + 6) { tomarAv(b.id, true); p.vy = -5; if (window.sfx) window.sfx.toque(); }
            else if (AV.invulnerable <= 0) { morirAv('¡Te agarró un bichito!'); return; }
        }
    }
}
// Algo que se toma una sola vez para los dos (moneda, bloque ?, bicho pisado).
function tomarAv(id, mio){
    if (AV.tomados.has(id)) return;
    AV.tomados.add(id);
    aplicarTomadoAv(id);
    if (id[0] !== 'e') AV.monedasLocal++;
    if (!mio) return;
    if (window.sfx) id[0] === 'e' ? null : window.sfx.acierto();
    if (AV.enlace) AV.enlace.enviar('tomar', { id, n: AV.estado.nivel }, true);
    const nivel = AV.estado.nivel;
    Aventura.accion((e) => e.nivel !== nivel || (e.tomados || []).includes(id) ? null : { tomados: [...(e.tomados || []), id], monedas: (e.monedas || 0) + (id[0] === 'e' ? 0 : 1) });
}
async function morirAv(porque){
    if (AV.muriendo) return;
    AV.muriendo = true;
    vibrarJ([30, 40, 30]);
    if (window.sfx) window.sfx.error();
    if (window.animJuegos) window.animJuegos.cartel(porque, { dur: 900, sonido: false });
    const nivel = AV.estado.nivel;
    await Aventura.accion((e) => {
        if (e.nivel !== nivel) return null;
        const vidas = e.vidas - 1;
        if (vidas <= 0) return { vidas: 0, ganador: 'empate', motivo: `Se quedaron sin vidas en el nivel ${e.nivel} (${NIVELES_AV[e.nivel - 1].nombre}). Juntaron ${e.monedas || 0} monedas.` };
        return { vidas };
    });
    setTimeout(() => {
        const p = AV.yo;
        if (p) { p.x = AV.checkpoint.x; p.y = AV.checkpoint.y; p.vx = 0; p.vy = 0; }
        AV.invulnerable = 90;
        AV.muriendo = false;
    }, 700);
}
async function llegarAv(){
    AV.llegue = true;
    if (window.sfx) window.sfx.acierto();
    const nivel = AV.estado.nivel;
    let paso = null;
    await Aventura.accion((e) => {
        paso = null;
        if (e.nivel !== nivel) return null;
        const llegaron = { ...(e.llegaron || {}), [miIdentidad]: true };
        if (!(llegaron.nico && llegaron.carito)) return { llegaron };
        paso = e.nivel;
        if (e.nivel >= NIVELES_AV.length) return { llegaron, ganador: 'empate', motivo: `🎉 ¡Terminaron la aventura con ${e.monedas || 0} monedas y ${e.vidas} vidas!` };
        return { nivel: e.nivel + 1, inicio: window.ahoraSync() + 3500, llegaron: {}, tomados: [], vidas: Math.min(VIDAS_AV, e.vidas + 1) };
    });
    if (paso && paso < NIVELES_AV.length && window.guardarMomento) window.guardarMomento({ id: `aventura-${paso}-${Date.now().toString(36)}`, juego: 'aventura', icono: '🍄', titulo: `¡Pasaron "${NIVELES_AV[paso - 1].nombre}" juntos!`, sub: `Nivel ${paso} de la Aventura de a Dos` });
}

// ---------- Dibujo ----------
function dibujarAv(){
    const c = AV.ctx, e = AV.estado;
    if (!c || !e || !AV.mapa) return;
    const W = VISTA_AV * T_AV, H = FILAS_AV * T_AV, n = NIVELES_AV[e.nivel - 1];
    const placa = placaApretadaAv();
    // Cámara: sigue a mi personaje.
    const objetivo = Math.max(0, Math.min(AV.ancho * T_AV - W, (AV.yo ? AV.yo.x : 0) - W * 0.42));
    AV.camara += (objetivo - AV.camara) * 0.15;
    const cam = Math.round(AV.camara);
    const g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, n.cielo[0]); g.addColorStop(1, n.cielo[1]);
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    if (n.estrellas) { c.fillStyle = '#fff'; for (let i = 0; i < 40; i++) { const sx = ((i * 73) - cam * 0.2) % (W + 20); c.fillRect((sx + W + 20) % (W + 20), (i * 37) % 90, 1, 1); } }
    // Colinas y nubes con paralaje
    c.fillStyle = n.castillo ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.18)';
    for (let i = 0; i < 6; i++) { const hx = ((i * 140 - cam * 0.35) % (W + 160) + W + 160) % (W + 160) - 80; c.beginPath(); c.arc(hx, H - 32, 46 + (i % 3) * 10, Math.PI, 0); c.fill(); }
    if (!n.castillo && !n.estrellas) { c.fillStyle = 'rgba(255,255,255,0.85)'; for (let i = 0; i < 4; i++) { const nx = ((i * 110 - cam * 0.15) % (W + 80) + W + 80) % (W + 80) - 40; c.fillRect(nx, 18 + (i % 2) * 14, 26, 8); c.fillRect(nx + 6, 13 + (i % 2) * 14, 14, 6); } }
    // Tiles visibles
    const x0 = Math.floor(cam / T_AV), x1 = Math.min(AV.ancho - 1, x0 + VISTA_AV + 1), t = Date.now();
    for (let y = 0; y < FILAS_AV; y++) for (let x = x0; x <= x1; x++) {
        const ch = AV.mapa[y][x], px = x * T_AV - cam, py = y * T_AV;
        if (ch === '#') { c.fillStyle = n.suelo; c.fillRect(px, py, T_AV, T_AV); if (celdaAv(x, y - 1) !== '#') { c.fillStyle = n.pasto; c.fillRect(px, py, T_AV, 4); } c.fillStyle = 'rgba(0,0,0,0.12)'; c.fillRect(px + 3, py + 8, 3, 3); c.fillRect(px + 10, py + 12, 2, 2); }
        else if (ch === '=') { c.fillStyle = '#c0693a'; c.fillRect(px, py, T_AV, T_AV); c.fillStyle = '#7a3a1c'; c.fillRect(px, py + 7, T_AV, 1); c.fillRect(px + 7, py, 1, 7); c.fillRect(px + 3, py + 8, 1, 8); c.fillRect(px + 12, py + 8, 1, 8); }
        else if (ch === '?') { c.fillStyle = '#f2b134'; c.fillRect(px, py, T_AV, T_AV); c.fillStyle = '#a8651a'; c.fillRect(px, py + 15, T_AV, 1); c.fillStyle = '#fff6d8'; c.font = 'bold 12px monospace'; c.fillText('?', px + 4, py + 12 + Math.round(Math.sin(t / 200) * 1)); }
        else if (ch === 'X') { c.fillStyle = '#8a6a4a'; c.fillRect(px, py, T_AV, T_AV); c.fillStyle = '#5a4430'; c.fillRect(px + 2, py + 2, 12, 12); }
        else if (ch === 'o') { const w = 6 + Math.round(Math.abs(Math.sin(t / 220 + x)) * 4); c.fillStyle = '#ffd93d'; c.fillRect(px + 8 - w / 2, py + 3, w, 10); c.fillStyle = '#fff3a0'; c.fillRect(px + 8 - w / 4, py + 5, Math.max(1, w / 4), 6); }
        else if (ch === '^') { c.fillStyle = '#d9d9e8'; for (let k = 0; k < 3; k++) { c.beginPath(); c.moveTo(px + k * 5 + 1, py + 16); c.lineTo(px + k * 5 + 3.5, py + 8); c.lineTo(px + k * 5 + 6, py + 16); c.fill(); } }
        else if (ch === 'D') { if (!placa) { c.fillStyle = '#6b4a8a'; c.fillRect(px + 1, py, 14, T_AV); c.fillStyle = '#f5d9a0'; c.fillRect(px + 10, py + 7, 2, 2); } else { c.fillStyle = 'rgba(107,74,138,0.25)'; c.fillRect(px + 1, py, 14, T_AV); } }
        else if (ch === 'L') { c.fillStyle = placa ? '#5fd3a0' : 'rgba(95,211,160,0.18)'; c.fillRect(px, py, T_AV, T_AV); c.strokeStyle = placa ? '#2f8a62' : 'rgba(95,211,160,0.4)'; c.strokeRect(px + 0.5, py + 0.5, T_AV - 1, T_AV - 1); }
        else if (ch === 'b') { const ap = placa; c.fillStyle = ap ? '#e8496b' : '#ff8fa3'; c.fillRect(px + 2, py + (ap ? 14 : 12), 12, ap ? 2 : 4); c.fillStyle = '#555'; c.fillRect(px + 1, py + 15, 14, 1); }
        else if (ch === 'C') { c.fillStyle = '#ddd'; c.fillRect(px + 7, py + 2, 2, 14); c.fillStyle = AV.checkpoint && AV.checkpoint.x === x * T_AV ? '#4cd18a' : '#aaa'; c.fillRect(px + 9, py + 2, 6, 5); }
        else if (ch === 'F') { c.fillStyle = '#eee'; c.fillRect(px + 7, py - 6 * T_AV, 2, 7 * T_AV); c.fillStyle = '#4cd18a'; c.fillRect(px + 9, py - 6 * T_AV + 2 + Math.round(Math.sin(t / 300) * 1), 10, 7); c.fillStyle = '#ffd93d'; c.fillRect(px + 6, py - 6 * T_AV - 3, 4, 4); }
    }
    // Bichos
    AV.bichos.forEach(b => {
        if (AV.tomados.has(b.id)) return;
        const bx = posBichoAv(b) - cam;
        if (bx < -20 || bx > W + 20) return;
        const pie = Math.floor(Date.now() / 160) % 2;
        c.fillStyle = '#8a4b2a'; c.beginPath(); c.arc(bx + 7, b.y + 7, 7, Math.PI, 0); c.fill(); c.fillRect(bx, b.y + 7, 14, 3);
        c.fillStyle = '#f3d9b0'; c.fillRect(bx + 3, b.y + 9, 8, 3);
        c.fillStyle = '#fff'; c.fillRect(bx + 3, b.y + 3, 3, 4); c.fillRect(bx + 8, b.y + 3, 3, 4);
        c.fillStyle = '#000'; c.fillRect(bx + 4, b.y + 4, 1, 2); c.fillRect(bx + 9, b.y + 4, 1, 2);
        c.fillStyle = '#3a2214'; c.fillRect(bx + (pie ? 1 : 3), b.y + 12, 4, 2); c.fillRect(bx + (pie ? 9 : 7), b.y + 12, 4, 2);
    });
    // Personajes: primero el otro (suavizado), después yo.
    const o = AV.otro;
    if (o && o.n === e.nivel && Date.now() - o.visto < 4000) {
        o.rx = o.rx == null ? o.x : o.rx + (o.x - o.rx) * 0.4;
        o.ry = o.ry == null ? o.y : o.ry + (o.y - o.ry) * 0.4;
        const ox = o.rx - cam;
        if (ox < -ANCHO_PJ) flechaAv(c, 4, o.ry, '◀', miRival); else if (ox > W) flechaAv(c, W - 12, o.ry, '▶', miRival);
        else pjAv(c, ox, o.ry, miRival, o.d || 1, o.paso || 0, !o.s, false);
    }
    if (AV.yo && !(AV.invulnerable > 0 && Math.floor(Date.now() / 90) % 2)) pjAv(c, AV.yo.x - cam, AV.yo.y, miIdentidad, AV.yo.dir, AV.yo.paso, !AV.yo.suelo, true);
    // HUD
    c.fillStyle = 'rgba(0,0,0,0.35)'; c.fillRect(0, 0, W, 13);
    c.fillStyle = '#fff'; c.font = 'bold 9px monospace';
    c.fillText(`🪙 ${e.monedas || 0}`, 4, 10); c.fillText(`❤ ${e.vidas}`, 52, 10); c.fillText(`${e.nivel}/${NIVELES_AV.length} ${n.nombre}`, 92, 10);
    c.fillStyle = AV.enlace && AV.enlace.estado === 'directo' ? '#4cd18a' : AV.enlace && AV.enlace.estado === 'respaldo' ? '#f5d36b' : '#ff6b6b';
    c.fillRect(W - 9, 3, 6, 6);
    // Cuenta regresiva o espera en la bandera
    const falta = e.inicio - window.ahoraSync();
    if (e.fase === 'jugando' && falta > 0) { textoGrandeAv(c, W, H, falta > 1000 ? String(Math.ceil(falta / 1000) - 0) : '¡YA!', `Nivel ${e.nivel}: ${n.nombre}`); }
    else if (AV.llegue && e.fase === 'jugando') textoGrandeAv(c, W, H, '🚩', `¡Llegaste! Esperando a ${nombreJugador(miRival)}…`);
}
function textoGrandeAv(c, W, H, grande, chico){
    c.fillStyle = 'rgba(0,0,0,0.35)'; c.fillRect(0, H / 2 - 28, W, 48);
    c.fillStyle = '#fff'; c.textAlign = 'center'; c.font = 'bold 22px monospace'; c.fillText(grande, W / 2, H / 2);
    c.font = '9px monospace'; c.fillText(chico, W / 2, H / 2 + 14); c.textAlign = 'left';
}
function flechaAv(c, x, y, s, quien){ c.fillStyle = quien === 'nico' ? '#a8d8ff' : '#ffb3c6'; c.font = 'bold 12px monospace'; c.fillText(s, x, Math.max(24, Math.min(160, y + 10))); }
// Pixel art: Nico con gorra celeste, Carito con moño rosa.
function pjAv(c, x, y, quien, dir, paso, aire, soyYo){
    x = Math.round(x); y = Math.round(y);
    const nico = quien === 'nico';
    const ropa = nico ? '#3d8bfd' : '#ff6f9a', detalle = nico ? '#1f4fa8' : '#c2335f', pelo = nico ? '#4a2f1c' : '#6b3a1e';
    const pierna = aire ? 0 : Math.floor(paso / 5) % 2;
    // Piernas
    c.fillStyle = '#2a2235';
    if (aire) { c.fillRect(x + 2, y + 12, 3, 3); c.fillRect(x + 7, y + 11, 3, 3); }
    else { c.fillRect(x + 2 + pierna, y + 12, 3, 3); c.fillRect(x + 7 - pierna, y + 12, 3, 3); }
    // Cuerpo
    c.fillStyle = ropa; c.fillRect(x + 1, y + 7, 9, 6);
    c.fillStyle = detalle; c.fillRect(x + 1, y + 11, 9, 2);
    // Cabeza
    c.fillStyle = '#f6cfa8'; c.fillRect(x + 2, y + 2, 7, 6);
    c.fillStyle = '#2a1f33'; c.fillRect(x + (dir > 0 ? 6 : 4), y + 4, 1, 2);
    if (nico) { c.fillStyle = ropa; c.fillRect(x + 1, y, 9, 3); c.fillRect(x + (dir > 0 ? 7 : -1), y + 2, 5, 1); c.fillStyle = pelo; c.fillRect(x + (dir > 0 ? 2 : 8), y + 3, 1, 3); }
    else { c.fillStyle = pelo; c.fillRect(x + 1, y + 1, 9, 2); c.fillRect(x + (dir > 0 ? 1 : 9), y + 2, 1, 6); c.fillStyle = ropa; c.fillRect(x + (dir > 0 ? 0 : 7), y - 1, 4, 3); }
    if (soyYo) { c.fillStyle = 'rgba(255,255,255,0.8)'; c.fillRect(x + 5, y - 5, 1, 2); }
}

// ---------- Bucle, red y controles ----------
function bucleAv(ts){
    const pantalla = document.getElementById('pantalla-aventura');
    if (!pantalla || !pantalla.classList.contains('activa')) { pararMotorAv(); return; }
    const dt = Math.min(2.5, (ts - (AV.ultimoTs || ts)) / 16.67 || 1);
    AV.ultimoTs = ts;
    pasoFisicaAv(dt);
    const ahora = Date.now();
    if (AV.enlace && AV.yo && ahora - AV.ultimoEnvio > 50) {
        AV.ultimoEnvio = ahora;
        const p = AV.yo;
        AV.enlace.enviar('pos', { x: Math.round(p.x * 10) / 10, y: Math.round(p.y * 10) / 10, vx: Math.round(p.vx * 10) / 10, d: p.dir, s: p.suelo ? 1 : 0, paso: Math.round(p.paso), p: pisoPlacaAv(p) ? 1 : 0, n: AV.estado ? AV.estado.nivel : 0 });
    }
    dibujarAv();
    AV.loop = requestAnimationFrame(bucleAv);
}
function arrancarMotorAv(){
    if (!AV.canvas) {
        AV.canvas = document.createElement('canvas');
        AV.canvas.width = VISTA_AV * T_AV; AV.canvas.height = FILAS_AV * T_AV;
        AV.canvas.className = 'lienzo-aventura';
        AV.ctx = AV.canvas.getContext('2d');
        AV.ctx.imageSmoothingEnabled = false;
        AV.controles = document.createElement('div');
        AV.controles.className = 'controles-aventura';
        AV.controles.innerHTML = `<div><button data-k="izq" aria-label="Izquierda">◀</button><button data-k="der" aria-label="Derecha">▶</button></div><button data-k="salto" class="salto" aria-label="Saltar">⤒</button>`;
        AV.controles.querySelectorAll('button').forEach(b => {
            const k = b.dataset.k;
            const on = (ev) => { ev.preventDefault(); AV.teclas[k] = true; b.classList.add('apretado'); };
            const off = (ev) => { ev.preventDefault(); AV.teclas[k] = false; b.classList.remove('apretado'); };
            b.addEventListener('pointerdown', on); b.addEventListener('pointerup', off); b.addEventListener('pointercancel', off); b.addEventListener('pointerleave', off);
            b.addEventListener('contextmenu', (ev) => ev.preventDefault());
        });
    }
    if (!AV.teclado) {
        const mapa = { ArrowLeft: 'izq', KeyA: 'izq', ArrowRight: 'der', KeyD: 'der', ArrowUp: 'salto', KeyW: 'salto', Space: 'salto' };
        AV.teclado = (ev) => { const k = mapa[ev.code]; if (!k || !document.getElementById('pantalla-aventura')?.classList.contains('activa')) return; if (ev.target && ev.target.tagName === 'INPUT') return; ev.preventDefault(); AV.teclas[k] = ev.type === 'keydown'; };
        window.addEventListener('keydown', AV.teclado); window.addEventListener('keyup', AV.teclado);
    }
    if (!AV.enlace) {
        AV.enlace = EnlaceVivo.conectar('aventura', {
            alMensaje(tipo, d) {
                if (tipo === 'pos') { AV.otro = { ...(AV.otro || {}), ...d, visto: Date.now() }; }
                if (tipo === 'tomar' && AV.estado && d.n === AV.estado.nivel) tomarAv(d.id, false);
            },
            alEstado() {}
        });
    }
    if (!AV.loop) AV.loop = requestAnimationFrame(bucleAv);
    window._unsubLoopAventura = pararMotorAv;
}
function pararMotorAv(){
    if (AV.loop) cancelAnimationFrame(AV.loop);
    AV.loop = null;
    if (AV.enlace) AV.enlace.cerrar();
    AV.enlace = null;
    AV.teclas = { izq: false, der: false, salto: false };
}

const Aventura = JuegoTurnos.crear({
    id: 'aventura',
    sinTurno: true,
    emojiListo: '🍄',
    intro: 'Un plataformas de a dos, en vivo y en el mismo nivel. ◀ ▶ para caminar, ⤒ para saltar. Súbanse a la cabeza del otro para llegar alto, pisen las placas para abrir puertas y hacer aparecer escaleras, y lleguen los dos a la bandera 🚩. Las vidas son compartidas.',
    inicial: (previo) => ({ nivel: 1, inicio: window.ahoraSync() + 3500, vidas: VIDAS_AV, monedas: 0, tomados: [], llegaron: {}, turno: null, mejor: previo.mejor || 0 }),
    tituloFin: (e) => e.motivo && e.motivo.startsWith('🎉') ? '🏰 ¡Aventura completa!' : '💔 Game over',
    render(e) {
        return `<div id="aventura-host"></div>
            <div class="texto-centro texto-tenue" style="font-size:0.75rem;">${e.fase === 'terminado' ? `Llegaron hasta el nivel ${e.nivel} · 🪙 ${e.monedas || 0}` : 'Tip: uno se queda en la placa mientras el otro pasa 😉'}</div>`;
    },
    alDibujar(cont, e) {
        AV.estado = e;
        const host = cont.querySelector('#aventura-host');
        if (!host) return;
        if (e.fase === 'jugando' && AV.nivelCargado !== e.nivel + '-' + e.inicio) cargarNivelAv(e);
        if (e.fase === 'jugando') {
            // Lo que el otro tomó mientras tanto (por si se perdió algún mensaje).
            (e.tomados || []).forEach(id => tomarAv(id, false));
            arrancarMotorAv();
            host.appendChild(AV.canvas);
            host.appendChild(AV.controles);
        } else if (AV.canvas) {
            host.appendChild(AV.canvas);
            dibujarAv();
        }
    }
});
window._aventura = AV; // para pruebas
