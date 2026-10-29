// ==================== AVENTURA DE A DOS (plataformas cooperativo en vivo) ====================
// Al estilo de los Mario de antes, pero de a dos y en el mismo nivel: cada
// uno maneja su personaje en su celu y ve al otro moverse en vivo (las
// posiciones viajan por js/enlace-vivo.js, directo entre los celulares).
// Cooperación: subirse a la cabeza del otro para llegar alto, pisar una
// placa para abrir puertas o hacer aparecer escaleras, y llegar los dos a
// la bandera. Vidas compartidas, monedas compartidas, 10 niveles: pradera,
// atardecer, noche, castillo, cueva oscura (sólo se ve alrededor de cada
// uno), lago (se nada), montaña nevada (hielo, resortes, plataformas que
// se mueven), el castillo del jefe (hay que pisarle la cabeza 3 veces),
// la selva y el volcán (plataformas que se caen al pisarlas).
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
        if (tipo === 'agua') for (let i = 0; i < a; i++) for (let y = b; y <= 8; y++) if (g[y][x + i] === '.') pon(x + i, y, '~'); // ['agua', x, ancho, desdeFila]
        if (tipo === 'hielo') for (let i = 0; i < a; i++) if (g[9][x + i] === '#') pon(x + i, 9, '_');
        if (tipo === 'R') pon(x, 8, 'R');
        if (tipo === 'cae') for (let i = 0; i < b; i++) pon(x + i, a, 'Q'); // ['cae', x, y, ancho]: se cae al pisarla
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
    { nombre: 'La cueva', cielo: ['#0d0a14', '#1c1626'], suelo: '#4a4252', pasto: '#7a6a8a', castillo: true, oscuro: true,
        moviles: [[18, 7, 2, 3, 'h'], [72, 6, 2, 4, 'h']], mapa: armarNivelAv(92, [
        ['S', 2], ['monedas', 6, 6, 3], ['E', 12], ['hueco', 18, 6], ['monedas', 19, 5, 4], ['C', 26], ['E', 30], ['pinchos', 34, 3], ['fila', 33, 5, '==='],
        ['placa', 40], ['puerta', 44], ['placa', 48], ['escalera', 54], ['muro', 57, 4], ['placa', 59, 4], ['monedas', 57, 3, 4], ['E', 64], ['E', 68],
        ['hueco', 72, 7], ['monedas', 73, 4, 4], ['col', 82, 2], ['F', 87]]) },
    { nombre: 'El lago', cielo: ['#5ec4e8', '#bdeeff'], suelo: '#a8834e', pasto: '#e8d28a', mapa: armarNivelAv(94, [
        ['S', 2], ['E', 8], ['col', 13, 2], ['agua', 14, 30, 3], ['col', 20, 4], ['fila', 26, 4, '===='], ['monedas', 16, 5, 4], ['monedas', 27, 3, 4], ['monedas', 36, 6, 5],
        ['pinchos', 31, 2], ['col', 44, 2], ['C', 47], ['R', 52], ['fila', 53, 3, '====='], ['monedas', 53, 2, 5], ['E', 60],
        ['placa', 64], ['puerta', 68], ['placa', 72], ['agua', 76, 8, 5], ['monedas', 77, 7, 6], ['col', 84, 2], ['F', 89]]) },
    { nombre: 'La montaña nevada', cielo: ['#a9c7e8', '#eef6ff'], suelo: '#7a8aa0', pasto: '#ffffff', nieve: true,
        moviles: [[34, 7, 2, 4, 'v'], [66, 7, 2, 3, 'h']], mapa: armarNivelAv(92, [
        ['S', 2], ['hielo', 6, 20], ['E', 12], ['hueco', 18, 3], ['R', 25], ['fila', 27, 3, '===='], ['monedas', 27, 2, 4], ['col', 33, 1], ['fila', 36, 3, '==='],
        ['C', 40], ['escalera', 43], ['muro', 46, 4], ['placa', 48, 4], ['hielo', 50, 16], ['pinchos', 54, 2], ['E', 58], ['hueco', 66, 4], ['monedas', 66, 5, 4],
        ['R', 74], ['fila', 75, 2, '==='], ['col', 80, 3], ['F', 86]]) },
    { nombre: 'El castillo del jefe', cielo: ['#1a1024', '#3a1c34'], suelo: '#4a3a48', pasto: '#c25a7a', castillo: true, jefe: { x0: 42, x1: 78 }, mapa: armarNivelAv(90, [
        ['S', 2], ['pinchos', 8, 2], ['E', 14], ['fila', 18, 6, '?=?'], ['placa', 24], ['puerta', 28], ['placa', 32], ['C', 36], ['monedas', 44, 5, 6],
        ['fila', 50, 5, '=='], ['fila', 66, 5, '=='], ['F', 85]]) },
    { nombre: 'La selva', cielo: ['#3f9a5a', '#b8e8a0'], suelo: '#5a3a1e', pasto: '#2f8a3a',
        moviles: [[16, 7, 2, 3, 'v'], [44, 6, 2, 3, 'h']], mapa: armarNivelAv(94, [
        ['S', 2], ['monedas', 5, 6, 3], ['E', 10], ['hueco', 15, 6], ['monedas', 16, 3, 2], ['C', 24], ['R', 28], ['fila', 30, 3, '===='], ['monedas', 30, 2, 4],
        ['E', 36], ['hueco', 42, 7], ['monedas', 44, 4, 4], ['col', 51, 2], ['hueco', 55, 5], ['cae', 55, 7, 5], ['monedas', 55, 6, 5], ['E', 64],
        ['placa', 68], ['puerta', 72], ['placa', 76], ['hueco', 80, 3], ['monedas', 80, 6, 3], ['col', 86, 1], ['F', 90]]) },
    { nombre: 'El volcán', cielo: ['#2a0e0a', '#7a2a14'], suelo: '#4a221a', pasto: '#ff6a2a', castillo: true,
        moviles: [[47, 7, 2, 3, 'h']], mapa: armarNivelAv(96, [
        ['S', 2], ['pinchos', 7, 2], ['hueco', 12, 4], ['cae', 12, 7, 4], ['monedas', 12, 5, 4], ['E', 20], ['C', 24], ['hueco', 28, 6], ['cae', 28, 6, 2], ['cae', 32, 7, 2],
        ['R', 37], ['fila', 38, 3, '==='], ['monedas', 38, 2, 3], ['pinchos', 42, 3], ['hueco', 47, 5], ['E', 55], ['E', 59], ['placa', 63], ['puerta', 67], ['placa', 71], ['C', 73],
        ['hueco', 76, 7], ['cae', 76, 7, 2], ['cae', 79, 6, 2], ['cae', 82, 7, 1], ['col', 86, 2], ['monedas', 85, 3, 3], ['F', 92]]) },
];

// ---------- Estado local del motor ----------
const AV = {
    nivelCargado: null, mapa: null, ancho: 0, bichos: [], yo: null, otro: null, enlace: null, loop: null,
    canvas: null, ctx: null, controles: null, teclas: { izq: false, der: false, salto: false }, tomados: new Set(),
    ultimoEnvio: 0, checkpoint: null, invulnerable: 0, estado: null, camara: 0, saltoPrevio: false, llegue: false, monedasLocal: 0, muriendo: false,
    moviles: [], jefe: null, jefeGolpeLocal: 0, progreso: { max: 0, elegido: 1 }, sombra: null,
    fx: null, golpes: {}, aplastados: [],
};
const ESC_AV = 3; // el lienzo se dibuja a 3x: el pixel art queda nítido y los efectos, suaves
// Hasta qué nivel llegaron (para poder arrancar más adelante): juegos/aventura-progreso.
const refProgresoAv = () => window.doc(window.db, 'juegos', 'aventura-progreso');
(function escucharProgresoAv(){
    if (!window.db || !window.onSnapshot) { setTimeout(escucharProgresoAv, 500); return; }
    (window._onSnapshotSinCompu || window.onSnapshot)(refProgresoAv(), (s) => {
        AV.progreso = { max: 0, elegido: 1, ...(s.exists() ? s.data() : {}) };
        if (Aventura.estado && Aventura.estado.fase !== 'jugando') Aventura.redibujar();
    }, () => {});
})();
function elegirNivelAv(n){
    if (n > Math.min(NIVELES_AV.length, (AV.progreso.max || 0) + 1)) return;
    vibrarJ(8);
    window.setDoc(refProgresoAv(), { elegido: n }, { merge: true }).catch(() => {});
}
function posMovilAv(m){
    const largo = m.rango * T_AV;
    const t = (VivoComun.reloj('aventura') - (AV.estado?.inicio || 0)) / 1000 * 26;
    const q = ((t % (2 * largo)) + 2 * largo) % (2 * largo), off = q < largo ? q : 2 * largo - q;
    return m.eje === 'h' ? { x: m.x * T_AV + off, y: m.y * T_AV } : { x: m.x * T_AV, y: m.y * T_AV - off };
}
function posJefeAv(){
    const j = AV.jefe, golpes = (AV.estado && AV.estado.jefeGolpes) || 0;
    const largo = j.x1 - j.x0, t = (VivoComun.reloj('aventura') - (AV.estado?.inicio || 0)) / 1000 * (42 + golpes * 18);
    const q = ((t % (2 * largo)) + 2 * largo) % (2 * largo);
    // Salta cada tanto: más enojado con cada golpe.
    const salto = Math.max(0, Math.sin((VivoComun.reloj('aventura') - (AV.estado?.inicio || 0)) / (900 - golpes * 150))) * (golpes ? 26 : 0);
    return { x: j.x0 + (q < largo ? q : 2 * largo - q), y: j.y - salto };
}
const jefeVivoAv = () => AV.jefe && ((AV.estado && AV.estado.jefeGolpes) || 0) < 3;

function cargarNivelAv(e){
    const n = NIVELES_AV[e.nivel - 1];
    AV.nivelCargado = e.nivel + '-' + e.inicio;
    AV.mapa = n.mapa.map(f => f.split(''));
    AV.ancho = AV.mapa[0].length;
    AV.tomados = new Set(e.tomados || []);
    AV.bichos = [];
    AV.caidas = {};
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
    AV.moviles = (n.moviles || []).map(([x, y, w, rango, eje]) => ({ x, y, w, rango, eje, ultimo: null }));
    AV.jefe = n.jefe ? { x0: n.jefe.x0 * T_AV, x1: n.jefe.x1 * T_AV - 28, y: 9 * T_AV - 24 } : null;
    const separa = miIdentidad === 'nico' ? 0 : 18;
    AV.checkpoint = { x: AV.inicioX + separa, y: AV.inicioY };
    AV.yo = { x: AV.checkpoint.x, y: AV.checkpoint.y, vx: 0, vy: 0, suelo: false, dir: 1, paso: 0 };
    AV.otro = AV.otro || null;
    AV.llegue = !!(e.llegaron && e.llegaron[miIdentidad]);
    AV.invulnerable = 0;
    AV.golpes = {}; AV.aplastados = [];
    if (AV.fx) AV.fx.limpiar();
}
// Efectos de lo que se toma (también cuando lo toma el otro).
function efectoTomadoAv(id, mio){
    const fx = AV.fx; if (!fx) return;
    const [t, xs, ys] = id.split('-'), x = +xs, y = +ys, cx = x * T_AV + 8, cy = y * T_AV + 8;
    if (t === 'c') { fx.estrellitas(cx, cy, 6, ['#ffd93d', '#fff3a0']); if (mio) fx.texto(cx, cy - 4, '+1', { tam: 8, color: '#ffd93d' }); }
    if (t === 'q') { AV.golpes[x + ',' + y] = performance.now(); fx.particulas({ x: cx, y: cy - 10, n: 1, color: '#ffd93d', vel: 0.1, vida: 450, grav: -0.02, tam: 4, forma: 'cuadro' }); fx.estrellitas(cx, cy - 12, 6, ['#ffd93d', '#fff']); if (mio) fx.texto(cx, cy - 14, '+1', { tam: 8, color: '#ffd93d' }); }
    if (t === 'e') {
        const b = AV.bichos.find(q => q.id === id);
        if (b) { const bx = posBichoAv(b); AV.aplastados.push({ x: bx, y: b.y, t: performance.now() }); fx.polvo(bx + 7, b.y + 11, 'rgba(240,230,210,0.8)', 6); fx.texto(bx + 7, b.y - 2, '¡Plop!', { tam: 7, color: '#fff' }); }
    }
}
function aplicarTomadoAv(id){
    const [t, xs, ys] = id.split('-'), x = +xs, y = +ys;
    if (t === 'c' && AV.mapa[y] && AV.mapa[y][x] === 'o') AV.mapa[y][x] = '.';
    if (t === 'q' && AV.mapa[y] && AV.mapa[y][x] === '?') AV.mapa[y][x] = 'X';
}
const celdaAv = (x, y) => (y < 0 ? '.' : y >= FILAS_AV || x < 0 || x >= AV.ancho ? (y >= FILAS_AV ? '.' : '#') : AV.mapa[y][x]);
function esSolidoPatrullaAv(x, y){ const c = celdaAv(x, y); return c === '#' || c === '=' || c === '?' || c === 'X' || c === 'D' || c === '_'; }
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
// Plataformas que se caen: al pisarlas tiemblan, a los 0,65 s desaparecen y a los 3,8 s vuelven.
// El momento lo marca el reloj compartido y se avisa al otro (evento 'cae').
function caidaAv(x, y){
    const t = AV.caidas && AV.caidas[x + ',' + y];
    if (!t) return 0;
    const d = VivoComun.reloj('aventura') - t;
    return d < 650 ? 1 : d < 3800 ? 2 : 0; // 1 tiembla · 2 no está
}
function pisarCaeAv(x, y){
    const k = x + ',' + y;
    if (caidaAv(x, y)) return;
    const t = VivoComun.reloj('aventura');
    AV.caidas[k] = t;
    if (AV.enlace && AV.estado) AV.enlace.enviar('cae', { k, t, n: AV.estado.nivel }, true);
}
function esSolidoAv(x, y, placa){
    const c = celdaAv(x, y);
    if (c === 'Q') return caidaAv(x, y) !== 2;
    if (c === '#' || c === '=' || c === '?' || c === 'X' || c === '_') return true;
    if (c === 'D') return !placa;
    if (c === 'L') return placa;
    return false;
}
function posBichoAv(b){
    const largo = b.max - b.min;
    if (largo <= 0) return b.min;
    const t = (VivoComun.reloj('aventura') - (AV.estado?.inicio || 0)) / 1000 * 28 + b.fase;
    const p = ((t % (2 * largo)) + 2 * largo) % (2 * largo);
    return b.min + (p < largo ? p : 2 * largo - p);
}

// ---------- Física de mi personaje ----------
function pasoFisicaAv(dt){
    const p = AV.yo, e = AV.estado;
    if (!p || !e || e.fase !== 'jugando' || VivoComun.reloj('aventura') < e.inicio || AV.muriendo) return;
    const placa = placaApretadaAv();
    const k = AV.teclas;
    const objetivo = (k.der ? 1 : 0) - (k.izq ? 1 : 0);
    if (objetivo) p.dir = objetivo;
    const enAgua = celdaAv(Math.floor((p.x + ANCHO_PJ / 2) / T_AV), Math.floor((p.y + ALTO_PJ / 2) / T_AV)) === '~';
    p.agua = enAgua;
    // En el hielo cuesta arrancar y frenar; en el agua todo es más lento.
    const agarre = p.suelo ? (p.hielo ? 0.035 : 0.35) : 0.18;
    p.vx += (objetivo * VEL_AV * (enAgua ? 0.7 : 1) - p.vx) * Math.min(1, agarre * dt);
    if (enAgua && k.salto && !AV.saltoPrevio) { p.vy = -3.4; p.suelo = false; if (!(window.sonarArcade && sonarArcade('chapuzon')) && window.sfx) window.sfx.click(); } // brazada
    else if (k.salto && !AV.saltoPrevio && p.suelo) { p.vy = -SALTO_AV; p.suelo = false; if (!(window.sonarArcade && sonarArcade('salto')) && window.sfx) window.sfx.click(); if (AV.fx) AV.fx.polvo(p.x + ANCHO_PJ / 2, p.y + ALTO_PJ, 'rgba(240,235,220,0.7)', 4); p.estira = 1; }
    if (enAgua && AV.fx && Math.random() < 0.04) AV.fx.burbujas(p.x + ANCHO_PJ / 2, p.y + 3, 1);
    if (!enAgua && !k.salto && p.vy < -2.5 && !p.resorte) p.vy *= 0.6; // salto variable: soltar antes = saltito
    AV.saltoPrevio = k.salto;
    p.vy = Math.min(enAgua ? 1.6 : CAIDA_AV, p.vy + GRAV_AV * (enAgua ? 0.28 : 1) * dt);
    if (p.vy >= 0) p.resorte = false;
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
        p.hielo = p.suelo && [x0, x1].some(x => celdaAv(x, yc) === '_');
        if (p.suelo) [x0, x1].forEach(x => { if (celdaAv(x, yc) === 'Q') pisarCaeAv(x, yc); });
        // Plataformas que se mueven: me subo y me llevan.
        if (!p.suelo) for (const m of AV.moviles) {
            const q = posMovilAv(m);
            if (p.x + ANCHO_PJ > q.x + 1 && p.x < q.x + m.w * T_AV - 1 && yAntes + ALTO_PJ <= q.y + 4 && p.y + ALTO_PJ >= q.y) {
                p.y = q.y - ALTO_PJ; p.vy = 0; p.suelo = true; p.hielo = false;
                if (m.ultimo) p.x += q.x - m.ultimo.x;
                break;
            }
        }
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
    // Aterrizar fuerte levanta polvo y aplasta un poquito al personaje.
    if (p.suelo && !p.sueloAntes && p.vyAntes > 3.5) { if (AV.fx) AV.fx.polvo(p.x + ANCHO_PJ / 2, p.y + ALTO_PJ, 'rgba(240,235,220,0.7)', 5); p.aplasta = 1; }
    if (p.suelo && Math.abs(p.vx) > 1.2 && Math.sign(p.vx) !== objetivo && objetivo && AV.fx && Math.random() < 0.3) AV.fx.polvo(p.x + ANCHO_PJ / 2, p.y + ALTO_PJ, 'rgba(240,235,220,0.6)', 1);
    p.sueloAntes = p.suelo; p.vyAntes = p.vy;
    p.aplasta = Math.max(0, (p.aplasta || 0) - 0.12 * dt); p.estira = Math.max(0, (p.estira || 0) - 0.08 * dt);
    // Monedas, pinchos, bandera, checkpoint
    const cx0 = Math.floor((p.x + 2) / T_AV), cx1 = Math.floor((p.x + ANCHO_PJ - 2) / T_AV), cy0 = Math.floor((p.y + 2) / T_AV), cy1 = Math.floor((p.y + ALTO_PJ - 1) / T_AV);
    for (let y = cy0; y <= cy1; y++) for (let x = cx0; x <= cx1; x++) {
        const c = celdaAv(x, y);
        if (c === 'o') tomarAv(`c-${x}-${y}`, true);
        if (c === '^' && y === cy1 && AV.invulnerable <= 0) { morirAv('¡Ay, los pinchos!'); return; }
        if (c === 'C' && (AV.checkpoint.x !== x * T_AV)) { AV.checkpoint = { x: x * T_AV, y: 8 * T_AV }; if (window.sfx) window.sfx.acierto(); if (AV.fx) { AV.fx.onda(x * T_AV + 12, y * T_AV + 5, { color: 'rgba(76,209,138,0.9)', radio: 16 }); AV.fx.estrellitas(x * T_AV + 12, y * T_AV + 5, 8, ['#4cd18a', '#fff']); } }
        if (c === 'F' && !AV.llegue && !jefeVivoAv()) llegarAv();
        if (c === 'R' && p.vy >= 0 && y === cy1) { p.vy = -11.2; p.resorte = true; p.suelo = false; if (!(window.sonarArcade && sonarArcade('rebote')) && window.sfx) window.sfx.acierto(); AV.golpes['r' + x + ',' + y] = performance.now(); p.estira = 1; if (AV.fx) AV.fx.onda(x * T_AV + 8, y * T_AV + 12, { color: 'rgba(255,255,255,0.8)', radio: 12, achatar: 0.4 }); }
    }
    if (p.y > FILAS_AV * T_AV + 20) { morirAv('¡Al pozo!'); return; }
    // Jefe
    if (jefeVivoAv()) {
        const jp = posJefeAv();
        if (p.x + ANCHO_PJ > jp.x + 2 && p.x < jp.x + 26 && p.y + ALTO_PJ > jp.y + 2 && p.y < jp.y + 24) {
            if (p.vy > 0 && yAntes + ALTO_PJ <= jp.y + 9) { p.vy = -7.5; golpearJefeAv(); }
            else if (AV.invulnerable <= 0) { morirAv('¡El jefe te aplastó!'); return; }
        }
    }
    // Bichos
    if (AV.invulnerable > 0) AV.invulnerable -= dt;
    for (const b of AV.bichos) {
        if (AV.tomados.has(b.id)) continue;
        const bx = posBichoAv(b);
        if (p.x + ANCHO_PJ > bx + 1 && p.x < bx + 13 && p.y + ALTO_PJ > b.y + 2 && p.y < b.y + 12) {
            if (p.vy > 0 && yAntes + ALTO_PJ <= b.y + 6) { tomarAv(b.id, true); p.vy = -5; if (!(window.sonarArcade && sonarArcade('pisar')) && window.sfx) window.sfx.toque(); }
            else if (AV.invulnerable <= 0) { morirAv('¡Te agarró un bichito!'); return; }
        }
    }
}
async function golpearJefeAv(){
    if (Date.now() - AV.jefeGolpeLocal < 900) return;
    AV.jefeGolpeLocal = Date.now();
    vibrarJ([20, 30, 20]);
    if (window.sfx) window.sfx.toque();
    if (AV.fx) { const jp = posJefeAv(); AV.fx.chispas(jp.x + 14, jp.y + 2, ['#fff', '#f5d36b', '#c78bff'], 14); AV.fx.temblor(3, 260); AV.fx.texto(jp.x + 14, jp.y - 10, '¡Pum!', { tam: 10, color: '#f5d36b' }); }
    const nivel = AV.estado.nivel;
    let vencido = false;
    await Aventura.accion((e) => {
        if (e.nivel !== nivel || (e.jefeGolpes || 0) >= 3 || VivoComun.reloj('aventura') - (e.jefeT || 0) < 900) return null;
        const jefeGolpes = (e.jefeGolpes || 0) + 1;
        vencido = jefeGolpes >= 3;
        return { jefeGolpes, jefeT: VivoComun.reloj('aventura') };
    });
    if (vencido) {
        if (window.animJuegos) window.animJuegos.cartel('👑 ¡Vencieron al jefe!', { sub: '¡A la bandera!', dur: 2000 });
        if (window.fx) window.fx.confeti(60);
    }
}
// Algo que se toma una sola vez para los dos (moneda, bloque ?, bicho pisado).
function tomarAv(id, mio){
    if (AV.tomados.has(id)) return;
    AV.tomados.add(id);
    efectoTomadoAv(id, mio);
    aplicarTomadoAv(id);
    if (id[0] !== 'e') AV.monedasLocal++;
    if (!mio) return;
    if (id[0] !== 'e' && !(window.sonarArcade && sonarArcade('moneda')) && window.sfx) window.sfx.acierto();
    if (AV.enlace) AV.enlace.enviar('tomar', { id, n: AV.estado.nivel }, true);
    const nivel = AV.estado.nivel;
    Aventura.accion((e) => e.nivel !== nivel || (e.tomados || []).includes(id) ? null : { tomados: [...(e.tomados || []), id], monedas: (e.monedas || 0) + (id[0] === 'e' ? 0 : 1) });
}
async function morirAv(porque){
    if (AV.muriendo) return;
    AV.muriendo = true;
    vibrarJ([30, 40, 30]);
    if (AV.fx && AV.yo) { AV.fx.estrellitas(AV.yo.x + 6, AV.yo.y + 6, 10, ['#fff', '#ffd23a']); AV.fx.temblor(3, 300); }
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
    if (AV.fx && AV.yo) AV.fx.confeti(AV.yo.x + 6, AV.yo.y, 40);
    const nivel = AV.estado.nivel;
    let paso = null;
    await Aventura.accion((e) => {
        paso = null;
        if (e.nivel !== nivel) return null;
        const llegaron = { ...(e.llegaron || {}), [miIdentidad]: true };
        if (!(llegaron.nico && llegaron.carito)) return { llegaron };
        paso = e.nivel;
        if (e.nivel >= NIVELES_AV.length) return { llegaron, ganador: 'empate', motivo: `🎉 ¡Terminaron la aventura con ${e.monedas || 0} monedas y ${e.vidas} vidas!` };
        return { nivel: e.nivel + 1, inicio: VivoComun.reloj('aventura') + 3500, llegaron: {}, tomados: [], vidas: Math.min(VIDAS_AV, e.vidas + 1), jefeGolpes: 0, jefeT: 0 };
    });
    if (paso && paso > (AV.progreso.max || 0)) window.setDoc(refProgresoAv(), { max: paso, elegido: Math.min(NIVELES_AV.length, paso + 1) }, { merge: true }).catch(() => {});
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
    const cam = Math.round(AV.camara * ESC_AV) / ESC_AV, fx = AV.fx;
    c.setTransform(ESC_AV, 0, 0, ESC_AV, 0, 0);
    fx && fx.antes(c);
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
        const ch = AV.mapa[y][x], px = x * T_AV - cam; let py = y * T_AV;
        if (ch === '#') { c.fillStyle = n.suelo; c.fillRect(px, py, T_AV, T_AV); if (celdaAv(x, y - 1) !== '#') { c.fillStyle = n.pasto; c.fillRect(px, py, T_AV, 4); } c.fillStyle = 'rgba(0,0,0,0.12)'; c.fillRect(px + 3, py + 8, 3, 3); c.fillRect(px + 10, py + 12, 2, 2); }
        else if (ch === '=') { c.fillStyle = '#c0693a'; c.fillRect(px, py, T_AV, T_AV); c.fillStyle = '#7a3a1c'; c.fillRect(px, py + 7, T_AV, 1); c.fillRect(px + 7, py, 1, 7); c.fillRect(px + 3, py + 8, 1, 8); c.fillRect(px + 12, py + 8, 1, 8); }
        else if (ch === '?') { c.fillStyle = '#f2b134'; c.fillRect(px, py, T_AV, T_AV); c.fillStyle = '#ffd27a'; c.fillRect(px, py, T_AV, 1); c.fillRect(px, py, 1, T_AV); c.fillStyle = '#a8651a'; c.fillRect(px, py + 15, T_AV, 1); c.fillStyle = '#fff6d8'; c.font = 'bold 12px monospace'; c.fillText('?', px + 4, py + 12 + Math.round(Math.sin(t / 200) * 1)); }
        else if (ch === 'X') { const gb = AV.golpes[x + ',' + y], sube = gb ? Math.max(0, Math.sin(Math.min(1, (performance.now() - gb) / 220) * Math.PI)) * 5 : 0; py -= sube; c.fillStyle = '#8a6a4a'; c.fillRect(px, py, T_AV, T_AV); c.fillStyle = '#5a4430'; c.fillRect(px + 2, py + 2, 12, 12); }
        else if (ch === 'o') { const w = 2 + Math.abs(Math.sin(t / 220 + x)) * 8, fl = Math.sin(t / 300 + x * 0.7) * 1; c.fillStyle = '#c99a1a'; c.fillRect(px + 8 - w / 2, py + 3 + fl, w, 10); c.fillStyle = '#ffd93d'; c.fillRect(px + 8 - w / 2 + 0.5, py + 3 + fl, Math.max(0.5, w - 1.5), 9.5); c.fillStyle = '#fff3a0'; c.fillRect(px + 8 - w / 4, py + 5 + fl, Math.max(0.6, w / 4), 6); if ((t / 90 + x * 7) % 40 < 2) { c.fillStyle = '#fff'; c.fillRect(px + 10, py + 2 + fl, 1, 3); c.fillRect(px + 9, py + 3 + fl, 3, 1); } }
        else if (ch === '^') { c.fillStyle = '#d9d9e8'; for (let k = 0; k < 3; k++) { c.beginPath(); c.moveTo(px + k * 5 + 1, py + 16); c.lineTo(px + k * 5 + 3.5, py + 8); c.lineTo(px + k * 5 + 6, py + 16); c.fill(); } }
        else if (ch === 'D') { if (!placa) { c.fillStyle = '#6b4a8a'; c.fillRect(px + 1, py, 14, T_AV); c.fillStyle = '#f5d9a0'; c.fillRect(px + 10, py + 7, 2, 2); } else { c.fillStyle = 'rgba(107,74,138,0.25)'; c.fillRect(px + 1, py, 14, T_AV); } }
        else if (ch === 'L') { c.fillStyle = placa ? '#5fd3a0' : 'rgba(95,211,160,0.18)'; c.fillRect(px, py, T_AV, T_AV); c.strokeStyle = placa ? '#2f8a62' : 'rgba(95,211,160,0.4)'; c.strokeRect(px + 0.5, py + 0.5, T_AV - 1, T_AV - 1); }
        else if (ch === 'b') { const ap = placa; c.fillStyle = ap ? '#e8496b' : '#ff8fa3'; c.fillRect(px + 2, py + (ap ? 14 : 12), 12, ap ? 2 : 4); c.fillStyle = '#555'; c.fillRect(px + 1, py + 15, 14, 1); }
        else if (ch === 'C') { c.fillStyle = '#ddd'; c.fillRect(px + 7, py + 2, 2, 14); c.fillStyle = AV.checkpoint && AV.checkpoint.x === x * T_AV ? '#4cd18a' : '#aaa'; c.fillRect(px + 9, py + 2, 6, 5); }
        else if (ch === '~') { c.fillStyle = 'rgba(60,150,230,0.42)'; c.fillRect(px, py, T_AV, T_AV); if (celdaAv(x, y - 1) !== '~') { c.fillStyle = 'rgba(220,245,255,0.7)'; c.fillRect(px, py + Math.round(Math.sin(t / 300 + x) * 1) + 1, T_AV, 2); } }
        else if (ch === 'Q') {
            const st = caidaAv(x, y), tiembla = st === 1 ? (Math.random() - 0.5) * 2 : 0;
            if (st !== 2) { c.fillStyle = '#b07a4a'; c.fillRect(px + tiembla, py, T_AV, 7); c.fillStyle = '#6a4424'; c.fillRect(px + 4 + tiembla, py + 2, 1, 4); c.fillRect(px + 10 + tiembla, py + 1, 1, 3); c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(px + tiembla, py + 6, T_AV, 1); }
            else { c.strokeStyle = 'rgba(255,255,255,0.15)'; c.setLineDash([2, 2]); c.strokeRect(px + 0.5, py + 0.5, T_AV - 1, 6); c.setLineDash([]); }
        }
        else if (ch === '_') { c.fillStyle = '#bfe6ff'; c.fillRect(px, py, T_AV, T_AV); c.fillStyle = '#ffffff'; c.fillRect(px, py, T_AV, 3); c.fillStyle = 'rgba(255,255,255,0.6)'; c.fillRect(px + 3, py + 6, 6, 1); }
        else if (ch === 'R') { const gr = AV.golpes['r' + x + ',' + y], comp = gr && performance.now() - gr < 200 ? 3 : 0; c.fillStyle = '#ff6b6b'; c.fillRect(px + 2, py + 10 - comp, 12, 3); c.fillStyle = '#ccc'; for (let k = 0; k < 3; k++) c.fillRect(px + 4 + k * 3, py + 13, 2, 3); }
        else if (ch === 'F' && jefeVivoAv()) { /* la bandera aparece al vencer al jefe */ }
        else if (ch === 'F') { c.fillStyle = '#eee'; c.fillRect(px + 7, py - 6 * T_AV, 2, 7 * T_AV); c.fillStyle = '#4cd18a'; c.fillRect(px + 9, py - 6 * T_AV + 2 + Math.round(Math.sin(t / 300) * 1), 10, 7); c.fillStyle = '#ffd93d'; c.fillRect(px + 6, py - 6 * T_AV - 3, 4, 4); }
    }
    // Plataformas móviles
    AV.moviles.forEach(m => {
        const q = posMovilAv(m), px = q.x - cam;
        m.ultimo = q;
        if (px < -40 || px > W + 40) return;
        c.fillStyle = n.nieve ? '#dcefff' : '#c9a36a'; c.fillRect(px, q.y, m.w * T_AV, 6);
        c.fillStyle = n.nieve ? '#9bbbd8' : '#7a5a34'; c.fillRect(px, q.y + 6, m.w * T_AV, 2);
    });
    // Jefe
    if (jefeVivoAv()) {
        const jp = posJefeAv(), jx = jp.x - cam, golpes = e.jefeGolpes || 0, parpadeo = VivoComun.reloj('aventura') - (e.jefeT || 0) < 900 && Math.floor(Date.now() / 80) % 2;
        if (!parpadeo) {
            c.fillStyle = '#7a3aa8'; c.beginPath(); c.arc(jx + 14, jp.y + 14, 14, Math.PI, 0); c.fill(); c.fillRect(jx, jp.y + 14, 28, 10);
            c.fillStyle = '#f5d36b'; c.fillRect(jx + 6, jp.y - 4, 16, 4); c.fillRect(jx + 6, jp.y - 8, 3, 4); c.fillRect(jx + 12, jp.y - 9, 4, 5); c.fillRect(jx + 19, jp.y - 8, 3, 4);
            c.fillStyle = '#fff'; c.fillRect(jx + 6, jp.y + 7, 6, 6); c.fillRect(jx + 16, jp.y + 7, 6, 6);
            c.fillStyle = '#c2335f'; c.fillRect(jx + 8, jp.y + 9, 3, 3); c.fillRect(jx + 17, jp.y + 9, 3, 3);
            c.fillStyle = '#2a1030'; c.fillRect(jx + 9, jp.y + 17, 10, 2);
        }
        c.fillStyle = '#fff'; c.font = 'bold 8px monospace'; c.fillText('JEFE ' + '❤'.repeat(3 - golpes), Math.max(2, Math.min(W - 52, jx - 6)), 22);
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
    AV.aplastados = AV.aplastados.filter(a => performance.now() - a.t < 400);
    AV.aplastados.forEach(a => { const k = (performance.now() - a.t) / 400, bx = a.x - cam; c.globalAlpha = 1 - k; c.fillStyle = '#8a4b2a'; c.fillRect(bx, a.y + 10, 14, 4); c.fillStyle = '#f3d9b0'; c.fillRect(bx + 3, a.y + 12, 8, 2); c.fillStyle = '#000'; c.fillRect(bx + 3, a.y + 10, 3, 1); c.fillRect(bx + 8, a.y + 10, 3, 1); c.globalAlpha = 1; });
    // Personajes: primero el otro (suavizado), después yo.
    const o = AV.otro;
    if (o && o.n === e.nivel && Date.now() - o.visto < 4000) {
        VivoComun.suave(o);
        // Polvo cuando el otro salta o cae (se ve igual que el propio).
        if (o.sAntes != null && o.sAntes !== o.s && fx) { fx.polvo(o.rx + ANCHO_PJ / 2, o.ry + ALTO_PJ, 'rgba(240,235,220,0.6)', 3); if (o.s) o.aplasta = 1; else o.estira = 1; }
        o.sAntes = o.s;
        o.aplasta = Math.max(0, (o.aplasta || 0) - 0.12); o.estira = Math.max(0, (o.estira || 0) - 0.08);
        const ox = o.rx - cam;
        if (ox < -ANCHO_PJ) flechaAv(c, 4, o.ry, '◀', miRival); else if (ox > W) flechaAv(c, W - 12, o.ry, '▶', miRival);
        else pjAv(c, ox, o.ry, miRival, o.d || 1, o.paso || 0, !o.s, false, o.aplasta - o.estira);
    }
    if (AV.yo && !(AV.invulnerable > 0 && Math.floor(Date.now() / 90) % 2)) pjAv(c, AV.yo.x - cam, AV.yo.y, miIdentidad, AV.yo.dir, AV.yo.paso, !AV.yo.suelo, true, (AV.yo.aplasta || 0) - (AV.yo.estira || 0));
    if (fx) { c.save(); c.translate(-cam, 0); fx.dibujar(c); c.restore(); }
    // Cueva: sólo se ve alrededor de cada uno.
    if (n.oscuro) {
        if (!AV.sombra) { AV.sombra = document.createElement('canvas'); AV.sombra.width = W; AV.sombra.height = H; }
        c.imageSmoothingEnabled = true;
        const s = AV.sombra.getContext('2d');
        s.globalCompositeOperation = 'source-over'; s.clearRect(0, 0, W, H); s.fillStyle = 'rgba(4,2,10,0.95)'; s.fillRect(0, 0, W, H);
        s.globalCompositeOperation = 'destination-out';
        const luz = (x, y, r) => { const g2 = s.createRadialGradient(x, y, 4, x, y, r); g2.addColorStop(0, 'rgba(0,0,0,1)'); g2.addColorStop(0.7, 'rgba(0,0,0,0.85)'); g2.addColorStop(1, 'rgba(0,0,0,0)'); s.fillStyle = g2; s.beginPath(); s.arc(x, y, r, 0, Math.PI * 2); s.fill(); };
        if (AV.yo) luz(AV.yo.x - cam + 6, AV.yo.y + 7, 56);
        if (o && o.n === e.nivel && o.rx != null) luz(o.rx - cam + 6, o.ry + 7, 44);
        c.drawImage(AV.sombra, 0, 0);
        c.imageSmoothingEnabled = false;
    }
    fx && fx.despues(c);
    // HUD
    c.fillStyle = 'rgba(0,0,0,0.35)'; c.fillRect(0, 0, W, 13);
    c.fillStyle = '#fff'; c.font = 'bold 9px monospace';
    c.fillText(`🪙 ${e.monedas || 0}`, 4, 10); c.fillText(`❤ ${e.vidas}`, 52, 10); c.fillText(`${e.nivel}/${NIVELES_AV.length} ${n.nombre}`, 92, 10);
    VivoComun.estado(c, W, H, AV.enlace, nombreJugador(miRival));
    // Cuenta regresiva o espera en la bandera
    const falta = e.inicio - VivoComun.reloj('aventura');
    if (e.fase === 'jugando' && falta > 0) { textoGrandeAv(c, W, H, falta > 1000 ? String(Math.ceil(falta / 1000) - 0) : '¡YA!', `Nivel ${e.nivel}: ${n.nombre}`, 1 - (falta % 1000) / 1000); }
    else if (AV.llegue && e.fase === 'jugando') textoGrandeAv(c, W, H, '🚩', `¡Llegaste! Esperando a ${nombreJugador(miRival)}…`);
}
function textoGrandeAv(c, W, H, grande, chico, k = 1){
    c.fillStyle = 'rgba(0,0,0,0.35)'; c.fillRect(0, H / 2 - 28, W, 48);
    const esc = FxVivo.rebote(Math.min(1, k * 2.5));
    c.save(); c.translate(W / 2, H / 2 - 7); c.scale(esc, esc); c.textAlign = 'center'; c.font = 'bold 22px monospace'; c.lineWidth = 3; c.strokeStyle = '#1a1424'; c.strokeText(grande, 0, 7); c.fillStyle = '#fff'; c.fillText(grande, 0, 7); c.restore();
    c.fillStyle = '#fff'; c.textAlign = 'center';
    c.font = '9px monospace'; c.fillText(chico, W / 2, H / 2 + 14); c.textAlign = 'left';
}
function flechaAv(c, x, y, s, quien){ c.fillStyle = quien === 'nico' ? '#a8d8ff' : '#ffb3c6'; c.font = 'bold 12px monospace'; c.fillText(s, x, Math.max(24, Math.min(160, y + 10))); }
// Pixel art: Nico con gorra celeste, Carito con moño rosa.
function pjAv(c, x, y, quien, dir, paso, aire, soyYo, aplasta = 0){
    x = Math.round(x * ESC_AV) / ESC_AV; y = Math.round(y * ESC_AV) / ESC_AV;
    // Aplastar (al caer) o estirar (al saltar), con los pies en el piso.
    const sy = 1 - aplasta * 0.22, sx = 1 + aplasta * 0.18;
    c.save(); c.translate(x + 5.5, y + 15); c.scale(sx, sy); c.translate(-(x + 5.5), -(y + 15));
    if (!aire) { c.fillStyle = 'rgba(0,0,0,0.18)'; c.fillRect(x, y + 14.5, 11, 1); }
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
    c.restore();
}

// ---------- Bucle, red y controles ----------
function bucleAv(ts){
    const pantalla = document.getElementById('pantalla-aventura');
    if (!pantalla || !pantalla.classList.contains('activa')) { pararMotorAv(); return; }
    if (VivoComun.pausa('aventura')) { AV.ultimoTs = 0; dibujarAv(); VivoComun.cartelPausa(AV.ctx); AV.loop = requestAnimationFrame(bucleAv); return; }
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
        AV.canvas.width = VISTA_AV * T_AV * ESC_AV; AV.canvas.height = FILAS_AV * T_AV * ESC_AV;
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
    AV.fx = AV.fx || FxVivo.crear();
    if (!AV.enlace) {
        AV.enlace = EnlaceVivo.conectar('aventura', {
            alMensaje(tipo, d) {
                if (tipo === 'pos') AV.otro = VivoComun.recibir(AV.otro, d);
                if (tipo === 'tomar' && AV.estado && d.n === AV.estado.nivel) tomarAv(d.id, false);
                if (tipo === 'cae' && AV.estado && d.n === AV.estado.nivel && AV.caidas && !caidaAv(...d.k.split(',').map(Number))) AV.caidas[d.k] = d.t;
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
    extraEspera: () => {
        const max = AV.progreso.max || 0, el = AV.progreso.elegido || 1;
        if (!max) return '';
        return `<div class="texto-tenue" style="font-size:0.8rem; margin-top:12px;">Arrancar en el nivel:</div><div class="niveles-av">${NIVELES_AV.map((n, i) => {
            const k = i + 1, abierto = k <= Math.min(NIVELES_AV.length, max + 1);
            return `<button class="${k === el ? 'activa' : ''}" ${abierto ? `onclick="elegirNivelAv(${k})"` : 'disabled'} title="${n.nombre}">${abierto ? k : '🔒'}</button>`;
        }).join('')}</div><div class="texto-tenue" style="font-size:0.72rem;">${NIVELES_AV[el - 1].nombre}</div>`;
    },
    intro: 'Un plataformas de a dos, en vivo y en el mismo nivel. ◀ ▶ para caminar, ⤒ para saltar. Súbanse a la cabeza del otro para llegar alto, pisen las placas para abrir puertas y hacer aparecer escaleras, y lleguen los dos a la bandera 🚩. Las vidas son compartidas.',
    inicial: (previo) => ({ nivel: Math.max(1, Math.min(NIVELES_AV.length, (AV.progreso.max || 0) + 1, AV.progreso.elegido || 1)), inicio: window.ahoraSync() + 3500, jefeGolpes: 0, jefeT: 0, vidas: VIDAS_AV, monedas: 0, tomados: [], llegaron: {}, turno: null, mejor: previo.mejor || 0 }),
    tituloFin: (e) => e.motivo && e.motivo.startsWith('🎉') ? '🏰 ¡Aventura completa!' : '💔 Game over',
    render(e) {
        return `<div id="aventura-host"></div>
            <div class="texto-centro texto-tenue" style="font-size:0.75rem;">${e.fase === 'terminado' ? `Llegaron hasta el nivel ${e.nivel} · 🪙 ${e.monedas || 0}` : 'Tip: uno se queda en la placa mientras el otro pasa 😉'}</div>`;
    },
    alDibujar(cont, e) {
        AV.estado = e;
        const host = cont.querySelector('#aventura-host');
        if (!host) return;
        VivoComun.montar('aventura', Aventura, host, e);
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
