// ==================== FUEGO Y AGUA (puzzles cooperativos en vivo) ====================
// Nico es 🔥 y Carito es 💧, en la misma pantalla y en vivo. La lava sólo
// la puede pisar Fuego, el agua sólo Agua y el líquido verde no lo puede
// pisar nadie. Placas que abren puertas mientras alguien las pisa, una
// palanca que abre una reja, cajas para empujar y gemas de cada color.
// El nivel se pasa cuando cada uno está en su puerta a la vez. 5 niveles.
// Usa js/plataformas-comun.js (física) y js/enlace-vivo.js (posiciones).
// Mapas: # pared · = plataforma · r lava · a agua · v verde · b placa · D puerta
// (placa) · p palanca · G reja (palanca) · R gema roja · B gema azul · X puerta
// de Fuego · Y puerta de Agua · F/W salidas · K caja · E ascensor (sube
// mientras alguien pisa una placa e) · T/U portales de a pares.
const T_FA = 16, COLS_FA = 20, FILAS_FA = 14, ANCHO_FA = 11, ALTO_FA = 14;
const NIVELES_FA = [
    { nombre: 'Primeros pasos', mapa: [
        '####################',
        '#..................#',
        '#..................#',
        '#..................#',
        '#..................#',
        '#..................#',
        '#...R.........B....#',
        '#.=====.....=====..#',
        '#..................#',
        '#........RB........#',
        '#.......====.......#',
        '#..................#',
        '#FY............X..W#',
        '####rrr#####aaa#####'] },
    { nombre: 'La puerta', mapa: [
        '####################',
        '#........#.........#',
        '#........#.........#',
        '#........#.........#',
        '#........#.........#',
        '#........#.........#',
        '#........#.........#',
        '#........#.........#',
        '#........#.........#',
        '#...R....D....B....#',
        '#..====..D..====...#',
        '#........D.........#',
        '#F.b..Y..D..X..b..W#',
        '####################'] },
    { nombre: 'Escaleras cruzadas', mapa: [
        '####################',
        '#..................#',
        '#..................#',
        '#.Y..............X.#',
        '######........######',
        '#..................#',
        '#.......R..B.......#',
        '#...====aa==rr===..#',
        '#..................#',
        '#..................#',
        '#####..........#####',
        '#..................#',
        '#F...............W.#',
        '#######vvvvvv#######'] },
    { nombre: 'Las cajas', mapa: [
        '####################',
        '#..................#',
        '#..................#',
        '#..................#',
        '#..................#',
        '#..................#',
        '#.....R......B.....#',
        '#..................#',
        '#.....X......Y.....#',
        '#....##########....#',
        '#..................#',
        '#..................#',
        '#F..K........K...W.#',
        '####################'] },
    { nombre: 'Todo junto', mapa: [
        '####################',
        '#.........#....#...#',
        '#.........#....#...#',
        '#.........#....#...#',
        '#.........#....#...#',
        '#.........#....#...#',
        '#.........#....#...#',
        '#.........#....#...#',
        '#.........G....D...#',
        '#.........G....D...#',
        '#.........G....D...#',
        '#....R....G.B..D...#',
        '#FWp......G..b.DXbY#',
        '#####rr#v##aa#######'] },
    { nombre: 'El ascensor', mapa: [
        '####################',
        '#..................#',
        '#..................#',
        '#.X..e.......e..Y..#',
        '#######......#######',
        '#..................#',
        '#..................#',
        '#..................#',
        '#..................#',
        '#..................#',
        '#........R.B.......#',
        '#..................#',
        '#F.e.....EE.....e.W#',
        '#####rr####aa#######'] },
    { nombre: 'Portales', mapa: [
        '####################',
        '#..............#...#',
        '#..............#...#',
        '#..............#T.X#',
        '#..............#####',
        '#..............#...#',
        '#..............#U.Y#',
        '#..............#####',
        '#..............#####',
        '#...R......B...#####',
        '#..............#####',
        '#..............#####',
        '#F....T..W....U#####',
        '##rrrr####aaaa######'] },
    { nombre: 'Puente de cajas', mapa: [
        '####################',
        '#..................#',
        '#..................#',
        '#..................#',
        '#..................#',
        '#..................#',
        '#..................#',
        '#..................#',
        '#.......RB.........#',
        '#..................#',
        '#..................#',
        '#FW.K.K.........X.Y#',
        '#######....#rr######',
        '#######vvvv#########'] },
    { nombre: 'Reja y ascensor', mapa: [
        '####################',
        '#..................#',
        '#.X.eY.............#',
        '#######............#',
        '#...........#......#',
        '#...........#......#',
        '#...........#......#',
        '#...........#......#',
        '#...........G......#',
        '#...........G......#',
        '#.........R.G...B..#',
        '#...........G......#',
        '#......EE...GFWp..e#',
        '#########rr#########'] },
    { nombre: 'La gran torre', mapa: [
        '####################',
        '#...B..............#',
        '#.Y..b..T.......X..#',
        '###########rrr######',
        '#........#.........#',
        '#........#.........#',
        '#........#.........#',
        '#........#.........#',
        '#........D.........#',
        '#........D.........#',
        '#........D.........#',
        '#........D..R......#',
        '#F.W.b...D....T....#',
        '###########aa#######'] },
];
const ELEM_FA = { nico: 'fuego', carito: 'agua' };
const SUBE_FA = 7 * T_FA; // cuánto sube un ascensor
const FA = { ascensores: [], enPortal: false, canvas: null, ctx: null, enlace: null, loop: null, estado: null, clave: null, mapa: null, yo: null, el: null, cajas: [], teclas: {}, tomados: new Set(), salida: null, muriendo: false, ultimoEnvio: 0, ultimoTs: 0, enPalanca: false, enPuerta: false, fx: null };
const ESC_FA = 3; // lienzo a 3x: pixel art nítido y efectos suaves
// Efectos con el color de cada elemento
const colFxFa = (quien) => ELEM_FA[quien] === 'fuego' ? ['#ffd23a', '#ff9f43', '#ff5a3a'] : ['#bfe9ff', '#7fd0f5', '#ffffff'];
function efectoGemaFa(id, mio){
    const fx = FA.fx; if (!fx) return;
    const [, x, y] = id.split('-'), ch = FA.mapa[+y] && FA.mapa[+y][+x], cx = +x * T_FA + 8, cy = +y * T_FA + 8;
    const col = ch === 'R' ? ['#ff5a4a', '#ffd0c8', '#fff'] : ['#4aa8ff', '#cfe8ff', '#fff'];
    fx.estrellitas(cx, cy, 9, col); fx.onda(cx, cy, { color: col[0], radio: 12 });
    if (mio) fx.texto(cx, cy - 6, '+💎', { tam: 8 });
}

function cargarNivelFa(e){
    FA.clave = e.nivel + '-' + e.inicio;
    const n = NIVELES_FA[e.nivel - 1];
    FA.mapa = n.mapa.map(f => f.split(''));
    FA.cajas = [];
    const yoLetra = miIdentidad === 'nico' ? 'F' : 'W';
    for (let y = 0; y < FILAS_FA; y++) for (let x = 0; x < COLS_FA; x++) {
        const c = FA.mapa[y][x];
        if (c === 'K') { FA.mapa[y][x] = '.'; FA.cajas.push({ id: FA.cajas.length, x: x * T_FA, y: y * T_FA + 2, w: T_FA, h: T_FA - 2, vy: 0 }); }
        if (c === 'F' || c === 'W') { if (c === yoLetra) FA.salida = { x: x * T_FA + 2, y: y * T_FA + 2 }; FA.mapa[y][x] = '.'; }
    }
    // Ascensores: cada tira de E en una fila es una plataforma que sube.
    FA.ascensores = [];
    for (let y = 0; y < FILAS_FA; y++) for (let x = 0; x < COLS_FA; x++) {
        if (FA.mapa[y][x] !== 'E') continue;
        let w = 0; while (FA.mapa[y][x + w] === 'E') { FA.mapa[y][x + w] = '.'; w++; }
        FA.ascensores.push({ ascensor: true, x: x * T_FA, y: y * T_FA + 8, base: y * T_FA + 8, w: w * T_FA, h: 8 });
    }
    FA.enPortal = false;
    // Cajas: donde quedaron (si ya se movieron en esta partida).
    (e.cajas || []).forEach(c => { const cj = FA.cajas[c.i]; if (cj) { cj.x = c.x; cj.y = c.y; } });
    FA.tomados = new Set(e.tomados || []);
    FA.tomados.forEach(id => { const [, x, y] = id.split('-'); if (FA.mapa[+y]) FA.mapa[+y][+x] = '.'; });
    FA.yo = { x: FA.salida.x, y: FA.salida.y, vx: 0, vy: 0, suelo: false, dir: 1 };
    FA.muriendo = false; FA.enPuerta = false;
    if (FA.fx) FA.fx.limpiar();
}
const celdaFa = (x, y) => (FA.mapa[y] && FA.mapa[y][x]) || '#';
function placaFa(){
    const pisa = (p) => p && [p.x + 2, p.x + ANCHO_FA - 2].some(px => celdaFa(Math.floor(px / T_FA), Math.floor((p.y + ALTO_FA - 2) / T_FA)) === 'b');
    const cajaPisa = FA.cajas.some(cj => celdaFa(Math.floor((cj.x + cj.w / 2) / T_FA), Math.floor((cj.y + cj.h - 2) / T_FA)) === 'b');
    return pisa(FA.yo) || (FA.el && FA.el.p && Date.now() - FA.el.visto < 1500) || cajaPisa;
}
// Placas de ascensor (e): la mía, la del otro o una caja encima.
function placaEFa(){
    const pisa = (p) => p && [p.x + 2, p.x + ANCHO_FA - 2].some(px => celdaFa(Math.floor(px / T_FA), Math.floor((p.y + ALTO_FA - 2) / T_FA)) === 'e');
    const cajaPisa = FA.cajas.some(cj => celdaFa(Math.floor((cj.x + cj.w / 2) / T_FA), Math.floor((cj.y + cj.h - 2) / T_FA)) === 'e');
    return pisa(FA.yo) || (FA.el && FA.el.pe && Date.now() - FA.el.visto < 1500) || cajaPisa;
}
function moverAscensoresFa(dt){
    const sube = placaEFa();
    FA.ascensores.forEach(a => {
        const meta = sube ? a.base - SUBE_FA : a.base;
        const antes = a.y;
        a.y += Math.max(-1.1 * dt, Math.min(1.6 * dt, meta - a.y));
        a.dy = a.y - antes;
    });
}
// Portales: pisar el centro de uno te lleva al otro de la misma letra.
function portalFa(p){
    const cx = Math.floor((p.x + ANCHO_FA / 2) / T_FA), cy = Math.floor((p.y + ALTO_FA / 2) / T_FA), c = celdaFa(cx, cy);
    if (c !== 'T' && c !== 'U') { FA.enPortal = false; return; }
    if (FA.enPortal) return;
    for (let y = 0; y < FILAS_FA; y++) for (let x = 0; x < COLS_FA; x++) if (FA.mapa[y][x] === c && (x !== cx || y !== cy)) {
        p.x = x * T_FA + 2; p.y = y * T_FA + 2; p.vx = 0; p.vy = 0;
        if (FA.fx) { FA.fx.onda(cx * T_FA + 8, cy * T_FA + 8, { color: 'rgba(200,150,255,0.9)', radio: 14 }); FA.fx.onda(x * T_FA + 8, y * T_FA + 8, { color: 'rgba(200,150,255,0.9)', radio: 14 }); FA.fx.estrellitas(x * T_FA + 8, y * T_FA + 8, 6, ['#e0b0ff', '#fff']); }
        FA.enPortal = true; vibrarJ(10); if (window.sfx) window.sfx.swoosh();
        return;
    }
}
function solidoFa(x, y, placa){
    const c = celdaFa(x, y);
    if ('#=rav'.includes(c)) return true;
    if (c === 'D') return !placa;
    if (c === 'G') return !(FA.estado && FA.estado.palanca);
    return false;
}
function pasoFa(dt){
    const e = FA.estado, p = FA.yo;
    if (!e || e.fase !== 'jugando' || !p || FA.muriendo || VivoComun.reloj('fuegoagua') < e.inicio) return;
    const placa = placaFa();
    const otro = FA.el && Date.now() - FA.el.visto < 1500 ? FA.el : null;
    moverAscensoresFa(dt);
    // Si estoy parado en un ascensor, me lleva con él.
    FA.ascensores.forEach(a => { if (p.suelo && Math.abs(p.y + ALTO_FA - (a.y - a.dy)) < 2 && p.x + ANCHO_FA > a.x && p.x < a.x + a.w) p.y += a.dy; });
    Plataformas.mover(p, dt, FA.teclas, {
        T: T_FA, ancho: ANCHO_FA, alto: ALTO_FA, esSolido: (x, y) => solidoFa(x, y, placa), cajas: [...FA.cajas, ...FA.ascensores], otro,
        // Al ascensor (que es bajito) se sube caminando, como a un escalón.
        alEmpujar: (cj, d) => { if (!cj.ascensor) return empujarCajaFa(cj, d, placa); if (p.y + ALTO_FA - cj.y <= 9) { p.y = cj.y - ALTO_FA; return d; } return 0; },
    });
    desatascarFa(p, placa);
    portalFa(p);
    // Polvo y aplaste al aterrizar; estirón al saltar.
    if (p.suelo && !p.sueloAntes && (p.vyAntes || 0) > 3 && FA.fx) { FA.fx.polvo(p.x + ANCHO_FA / 2, p.y + ALTO_FA, 'rgba(220,200,170,0.6)', 4); p.aplasta = 1; }
    if (!p.suelo && p.sueloAntes && p.vy < -2) p.estira = 1;
    p.sueloAntes = p.suelo; p.vyAntes = p.vy;
    p.aplasta = Math.max(0, (p.aplasta || 0) - 0.12 * dt); p.estira = Math.max(0, (p.estira || 0) - 0.08 * dt);
    FA.cajas.forEach(cj => Plataformas.caerCaja(cj, dt, (x, y) => solidoFa(x, y, placa), T_FA, FA.cajas));
    const mio = ELEM_FA[miIdentidad];
    // Lo que piso: lava, agua o verde.
    const yPie = Math.floor((p.y + ALTO_FA + 1) / T_FA);
    if (p.suelo) for (const px of [p.x + 2, p.x + ANCHO_FA - 2]) {
        const c = celdaFa(Math.floor(px / T_FA), yPie);
        if (c === 'v' || (c === 'r' && mio === 'agua') || (c === 'a' && mio === 'fuego')) { morirFa(c === 'v' ? '¡El líquido verde no lo pisa nadie!' : mio === 'agua' ? '¡El agua se evaporó en la lava!' : '¡El fuego se apagó en el agua!'); return; }
    }
    // Gemas, palanca y puerta propia.
    let enPalanca = false, enPuerta = false;
    for (let y = Math.floor(p.y / T_FA); y <= Math.floor((p.y + ALTO_FA - 1) / T_FA); y++) for (let x = Math.floor(p.x / T_FA); x <= Math.floor((p.x + ANCHO_FA - 1) / T_FA); x++) {
        const c = celdaFa(x, y);
        if ((c === 'R' && mio === 'fuego') || (c === 'B' && mio === 'agua')) tomarGemaFa(`g-${x}-${y}`);
        if (c === 'p') enPalanca = true;
        if ((c === 'X' && mio === 'fuego') || (c === 'Y' && mio === 'agua')) enPuerta = true;
    }
    // La palanca se empuja: caminando hacia la derecha abre, hacia la izquierda cierra.
    const quiere = p.vx > 0.4 ? true : p.vx < -0.4 ? false : null;
    if (enPalanca && quiere !== null && quiere !== !!(e.palanca) && !FA.moviendoPalanca) moverPalancaFa(quiere);
    FA.enPalanca = enPalanca;
    FA.enPuerta = enPuerta;
    if (enPuerta && FA.el && FA.el.en && Date.now() - FA.el.visto < 1500) completarFa();
    if (p.y > FILAS_FA * T_FA) morirFa('¡Te caíste!');
}
// Si una puerta o reja se cerró con alguien adentro, lo saca al costado libre más cercano.
function desatascarFa(p, placa){
    const y0 = Math.floor(p.y / T_FA), y1 = Math.floor((p.y + ALTO_FA - 1) / T_FA);
    const trabado = (x) => { for (let y = y0; y <= y1; y++) for (const cx of [Math.floor(x / T_FA), Math.floor((x + ANCHO_FA - 1) / T_FA)]) if (solidoFa(cx, y, placa)) return true; return false; };
    if (!trabado(p.x)) return;
    for (let d = 1; d <= T_FA * 2; d++) for (const s of [-1, 1]) if (!trabado(p.x + s * d)) { p.x += s * d; return; }
}
function empujarCajaFa(cj, d, placa){
    // Se mueve si no choca con paredes ni con otra caja.
    const nx = cj.x + d, x0 = Math.floor(nx / T_FA), x1 = Math.floor((nx + cj.w - 1) / T_FA), y0 = Math.floor(cj.y / T_FA), y1 = Math.floor((cj.y + cj.h - 1) / T_FA);
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (solidoFa(x, y, placa)) return 0;
    if (FA.cajas.some(o => o !== cj && Plataformas.solape({ x: nx, y: cj.y, w: cj.w, h: cj.h }, o))) return 0;
    cj.x = nx; cj.movida = Date.now();
    return d;
}
function tomarGemaFa(id){
    if (FA.tomados.has(id)) return;
    FA.tomados.add(id);
    efectoGemaFa(id, true);
    const [, x, y] = id.split('-'); FA.mapa[+y][+x] = '.';
    if (window.sfx) window.sfx.acierto();
    FA.enlace && FA.enlace.enviar('gema', { id, c: FA.clave }, true);
    const clave = FA.clave;
    FuegoAgua.accionEnCola((e) => e.nivel + '-' + e.inicio !== clave || (e.tomados || []).includes(id) ? null : { tomados: [...(e.tomados || []), id], gemas: (e.gemas || 0) + 1 });
}
async function moverPalancaFa(abrir){
    FA.moviendoPalanca = true;
    vibrarJ(10);
    if (FA.fx && FA.yo) FA.fx.chispas(FA.yo.x + ANCHO_FA / 2, FA.yo.y + 2, ['#fff', '#f5d36b'], 8);
    if (window.sfx) window.sfx.click();
    const clave = FA.clave;
    try { await FuegoAgua.accionEnCola((e) => e.nivel + '-' + e.inicio !== clave || !!e.palanca === abrir ? null : { palanca: abrir }); }
    finally { FA.moviendoPalanca = false; }
}
function morirFa(porque){
    if (FA.muriendo) return;
    FA.muriendo = true;
    vibrarJ([30, 40, 30]);
    efectoMuerteFa(FA.yo, miIdentidad);
    FA.enlace && FA.enlace.enviar('muere', { c: FA.clave }, true);
    if (window.sfx) window.sfx.error();
    if (window.animJuegos) window.animJuegos.cartel(porque, { dur: 900, sonido: false });
    const clave = FA.clave;
    FuegoAgua.accionEnCola((e) => e.nivel + '-' + e.inicio !== clave ? null : { muertes: (e.muertes || 0) + 1 });
    setTimeout(() => { if (FA.yo) Object.assign(FA.yo, { x: FA.salida.x, y: FA.salida.y, vx: 0, vy: 0 }); FA.muriendo = false; }, 700);
}
function efectoMuerteFa(p, quien){
    const fx = FA.fx; if (!fx || !p) return;
    const x = p.x + ANCHO_FA / 2, y = p.y + ALTO_FA / 2;
    // El fuego se apaga en vapor; el agua salpica.
    if (ELEM_FA[quien] === 'fuego') { fx.polvo(x, y, 'rgba(230,230,235,0.7)', 10); fx.chispas(x, y, colFxFa(quien), 8); }
    else fx.salpicadura(x, y, colFxFa(quien), 16);
    fx.temblor(3, 280);
}
let _completandoFa = false;
async function completarFa(){
    if (_completandoFa) return;
    _completandoFa = true;
    const clave = FA.clave;
    let paso = null;
    try {
        await FuegoAgua.accionEnCola((e) => {
            paso = null;
            if (e.nivel + '-' + e.inicio !== clave) return null;
            paso = e.nivel;
            if (FA.fx && FA.yo) FA.fx.confeti(FA.yo.x + 5, FA.yo.y, 30);
            const tiempo = Math.round((VivoComun.reloj('fuegoagua') - e.inicio) / 1000);
            if (e.nivel >= NIVELES_FA.length) return { ganador: 'empate', motivo: `🎉 ¡Pasaron los ${NIVELES_FA.length} niveles! Gemas: ${e.gemas || 0} · tropezones: ${e.muertes || 0}` };
            return { nivel: e.nivel + 1, inicio: VivoComun.reloj('fuegoagua') + 3000, tomados: [], palanca: false, cajas: [], aviso: `✅ Nivel ${e.nivel} en ${tiempo} s` };
        });
    } finally { setTimeout(() => { _completandoFa = false; }, 1500); }
    if (paso && window.sfx) window.sfx.victoria ? window.sfx.victoria() : window.sfx.acierto();
}
function dibujarFa(){
    const c = FA.ctx, e = FA.estado;
    if (!c || !e || !FA.mapa) return;
    const W = COLS_FA * T_FA, H = FILAS_FA * T_FA, t = Date.now(), placa = placaFa(), fx = FA.fx;
    c.setTransform(ESC_FA, 0, 0, ESC_FA, 0, 0);
    fx && fx.antes(c);
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#2b2016'); g.addColorStop(1, '#1a130c');
    c.fillStyle = g; c.fillRect(-4, -4, W + 8, H + 8);
    // Ladrillos del templo en el fondo
    c.fillStyle = 'rgba(255,220,150,0.035)';
    for (let y = 0; y < H; y += 8) for (let x = (y / 8) % 2 ? 0 : -8; x < W; x += 16) c.fillRect(x + 0.5, y + 0.5, 15, 7);
    const liquido = (px, py, col, brillo, x) => {
        c.fillStyle = col; c.fillRect(px, py + 4, T_FA, T_FA - 4);
        c.fillStyle = brillo;
        for (let k = 0; k < T_FA; k += 2) { const ola = Math.sin(t / 260 + (px + k) / 5) * 1.2; c.fillRect(px + k, py + 3 + ola, 2, 2); }
        c.fillStyle = 'rgba(255,255,255,0.12)'; c.fillRect(px + ((t / 40 + x * 5) % T_FA), py + 8, 3, 1);
    };
    for (let y = 0; y < FILAS_FA; y++) for (let x = 0; x < COLS_FA; x++) {
        const ch = FA.mapa[y][x], px = x * T_FA, py = y * T_FA;
        if (ch === '#' || ch === '=') {
            c.fillStyle = ch === '#' ? '#5a4a36' : '#7a6448'; c.fillRect(px, py, T_FA, T_FA);
            c.fillStyle = 'rgba(0,0,0,0.18)'; c.fillRect(px, py + 7.5, T_FA, 1); c.fillRect(px + ((y % 2) ? 4 : 11), py, 1, 7.5); c.fillRect(px + ((y % 2) ? 11 : 4), py + 8.5, 1, 7.5);
            c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(px, py + T_FA - 2, T_FA, 2);
            if (celdaFa(x, y - 1) !== '#' && celdaFa(x, y - 1) !== '=') { c.fillStyle = 'rgba(255,230,180,0.2)'; c.fillRect(px, py, T_FA, 1.5); }
        }
        else if (ch === 'r') { liquido(px, py, '#e84a2a', '#ffb347', x); if (fx && Math.random() < 0.012) fx.particulas({ x: px + Math.random() * T_FA, y: py + 4, n: 1, color: ['#ffd23a', '#ff9f43'], vel: 0.5, vida: 700, grav: -0.025, tam: 1.2, dir: -Math.PI / 2, abanico: 0.6 }); }
        else if (ch === 'a') { liquido(px, py, '#2a8ae8', '#a8e0ff', x); if (fx && Math.random() < 0.006) fx.burbujas(px + Math.random() * T_FA, py + 12, 1); }
        else if (ch === 'v') { liquido(px, py, '#4cd13a', '#b8ff8a', x); if (fx && Math.random() < 0.008) fx.particulas({ x: px + Math.random() * T_FA, y: py + 6, n: 1, color: 'rgba(184,255,138,0.8)', vel: 0.3, vida: 600, grav: -0.02, tam: 1.4, forma: 'anillo' }); }
        else if (ch === 'D') { if (!placa) { c.fillStyle = '#6b4a8a'; c.fillRect(px + 2, py, 12, T_FA); c.fillStyle = '#8a66ad'; c.fillRect(px + 2, py, 2, T_FA); c.fillStyle = '#4a3060'; c.fillRect(px + 12, py, 2, T_FA); } else { c.fillStyle = 'rgba(107,74,138,0.25)'; c.fillRect(px + 2, py, 12, T_FA); } }
        else if (ch === 'G') { const ab = e.palanca; c.fillStyle = ab ? 'rgba(245,211,107,0.2)' : '#c9a227'; for (let k = 0; k < 4; k++) c.fillRect(px + 1 + k * 4, py, 2, T_FA); if (!ab) { c.fillStyle = '#f5e08a'; for (let k = 0; k < 4; k++) c.fillRect(px + 1 + k * 4, py, 0.7, T_FA); } }
        else if (ch === 'e') { const on = placaEFa(); c.fillStyle = on ? '#3d8bfd' : '#8cc4ff'; c.fillRect(px + 2, py + (on ? 14 : 12), 12, on ? 2 : 4); c.fillStyle = '#fff'; c.fillRect(px + 7, py + (on ? 10 : 8), 2, 3); }
        else if (ch === 'T' || ch === 'U') {
            const col = ch === 'T' ? '200,120,255' : '120,230,200', g2 = 0.5 + Math.sin(t / 180 + x) * 0.3;
            const gl = c.createRadialGradient(px + 8, py + 8, 1, px + 8, py + 8, 12); gl.addColorStop(0, `rgba(${col},0.5)`); gl.addColorStop(1, `rgba(${col},0)`); c.fillStyle = gl; c.fillRect(px - 4, py - 4, 24, 24);
            c.fillStyle = `rgba(${col},${g2})`; c.beginPath(); c.ellipse(px + 8, py + 8, 6, 8, 0, 0, Math.PI * 2); c.fill(); c.strokeStyle = `rgb(${col})`; c.lineWidth = 1.5; c.stroke();
            c.save(); c.translate(px + 8, py + 8); c.rotate(t / 300); c.strokeStyle = 'rgba(255,255,255,0.5)'; c.lineWidth = 0.8; c.beginPath(); c.ellipse(0, 0, 3.5, 5, 0, 0, Math.PI * 1.2); c.stroke(); c.restore();
        }
        else if (ch === 'b') { c.fillStyle = placa ? '#e8496b' : '#ff8fa3'; c.fillRect(px + 2, py + (placa ? 14 : 12), 12, placa ? 2 : 4); }
        else if (ch === 'p') { c.fillStyle = '#888'; c.fillRect(px + 4, py + 13, 8, 3); c.save(); c.translate(px + 8, py + 13); c.rotate(e.palanca ? 0.6 : -0.6); c.fillStyle = '#ddd'; c.fillRect(-1, -10, 2, 10); c.fillStyle = e.palanca ? '#4cd18a' : '#ff6b6b'; c.beginPath(); c.arc(0, -10, 3, 0, Math.PI * 2); c.fill(); c.restore(); }
        else if (ch === 'R' || ch === 'B') {
            const col = ch === 'R' ? '#ff5a4a' : '#4aa8ff', s = 1 + Math.sin(t / 200 + x) * 0.1, fl = Math.sin(t / 350 + x) * 1.2;
            const gl = c.createRadialGradient(px + 8, py + 8 + fl, 1, px + 8, py + 8 + fl, 10); gl.addColorStop(0, ch === 'R' ? 'rgba(255,90,74,0.45)' : 'rgba(74,168,255,0.45)'); gl.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = gl; c.fillRect(px - 2, py - 2, 20, 20);
            c.save(); c.translate(px + 8, py + 8 + fl); c.scale(s, s); c.fillStyle = col; c.beginPath(); c.moveTo(0, -6); c.lineTo(5, -1); c.lineTo(0, 6); c.lineTo(-5, -1); c.closePath(); c.fill();
            c.fillStyle = 'rgba(255,255,255,0.35)'; c.beginPath(); c.moveTo(0, -6); c.lineTo(5, -1); c.lineTo(0, -1); c.closePath(); c.fill();
            c.fillStyle = 'rgba(255,255,255,0.85)'; c.fillRect(-2, -3, 1.5, 1.5); c.restore();
        }
        else if (ch === 'X' || ch === 'Y') {
            const col = ch === 'X' ? '#ff6b4a' : '#4aa8ff', mia = (ch === 'X') === (ELEM_FA[miIdentidad] === 'fuego'), brillo = mia && FA.enPuerta ? 0.6 + Math.sin(t / 120) * 0.3 : 0.25 + Math.sin(t / 500) * 0.1;
            const gl = c.createRadialGradient(px + 8, py + 3, 2, px + 8, py + 3, 18); gl.addColorStop(0, ch === 'X' ? `rgba(255,107,74,${brillo})` : `rgba(74,168,255,${brillo})`); gl.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = gl; c.fillRect(px - 10, py - 15, 36, 36);
            c.fillStyle = 'rgba(0,0,0,0.45)'; c.fillRect(px + 1, py - 10, 14, 26); c.strokeStyle = col; c.lineWidth = 2; c.strokeRect(px + 1, py - 10, 14, 26);
            c.font = '9px serif'; c.textAlign = 'center'; c.fillText(ch === 'X' ? '🔥' : '💧', px + 8, py + 2); c.textAlign = 'left';
        }
    }
    FA.ascensores.forEach(a => { c.fillStyle = 'rgba(255,255,255,0.15)'; c.fillRect(a.x + a.w / 2 - 1, a.y + a.h, 2, a.base - a.y); c.fillStyle = '#8a8fa0'; c.fillRect(a.x, a.y, a.w, a.h); c.fillStyle = '#b5bac8'; c.fillRect(a.x, a.y, a.w, 1); c.fillStyle = '#f5d36b'; for (let k = 0; k < a.w; k += 8) c.fillRect(a.x + k, a.y, 4, 2); });
    FA.cajas.forEach(cj => {
        c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(cj.x + 1, cj.y + cj.h, cj.w - 2, 1);
        c.fillStyle = '#b8864e'; c.fillRect(cj.x, cj.y, cj.w, cj.h); c.fillStyle = '#d0a06a'; c.fillRect(cj.x, cj.y, cj.w, 1.5);
        c.strokeStyle = '#6b4a2a'; c.lineWidth = 2; c.strokeRect(cj.x + 1, cj.y + 1, cj.w - 2, cj.h - 2); c.beginPath(); c.moveTo(cj.x + 2, cj.y + 2); c.lineTo(cj.x + cj.w - 2, cj.y + cj.h - 2); c.stroke();
        if (cj.movida && Date.now() - cj.movida < 80 && fx && Math.random() < 0.3) fx.polvo(cj.x + cj.w / 2, cj.y + cj.h, 'rgba(220,200,170,0.5)', 1);
    });
    const pj = (p, quien, aplasta = 0) => {
        const x = Math.round(p.x * ESC_FA) / ESC_FA, y = Math.round(p.y * ESC_FA) / ESC_FA, fuego = ELEM_FA[quien] === 'fuego';
        const col = fuego ? '#ff6b3a' : '#3aa0ff', luz = fuego ? '#ffd23a' : '#bfe8ff';
        // Halo de luz
        const gl = c.createRadialGradient(x + 5.5, y + 6, 2, x + 5.5, y + 6, 18); gl.addColorStop(0, fuego ? 'rgba(255,150,60,0.35)' : 'rgba(80,170,255,0.3)'); gl.addColorStop(1, 'rgba(0,0,0,0)');
        c.fillStyle = gl; c.fillRect(x - 13, y - 12, 37, 36);
        const sy = 1 - aplasta * 0.22, sx = 1 + aplasta * 0.18;
        c.save(); c.translate(x + 5.5, y + 14); c.scale(sx, sy); c.translate(-(x + 5.5), -(y + 14));
        c.fillStyle = col; c.fillRect(x + 1, y + 5, 9, 8);
        c.fillStyle = 'rgba(255,255,255,0.18)'; c.fillRect(x + 1, y + 5, 2, 8);
        c.fillStyle = '#2a2235'; c.fillRect(x + 2, y + 12, 3, 2); c.fillRect(x + 6, y + 12, 3, 2);
        c.fillStyle = luz; c.fillRect(x + 2, y + 1, 7, 6);
        // Llama o gota en la cabeza
        c.fillStyle = col;
        if (fuego) { const f = Math.floor(t / 120) % 2; c.fillRect(x + 3, y - 3 - f, 2, 4); c.fillRect(x + 6, y - 2 + f, 2, 3); c.fillRect(x + 4, y - 5, 2, 3); c.fillStyle = '#ffd23a'; c.fillRect(x + 4.5, y - 3, 1, 2); }
        else { c.beginPath(); c.moveTo(x + 5.5, y - 6); c.lineTo(x + 9, y); c.lineTo(x + 2, y); c.fill(); c.fillStyle = 'rgba(255,255,255,0.6)'; c.fillRect(x + 4, y - 2, 1, 1.5); }
        c.fillStyle = '#2a1f33'; c.fillRect(x + ((p.dir || 1) > 0 ? 6 : 3), y + 3, 1, 2);
        c.restore();
        // Chispitas de fuego o gotitas de agua
        if (fx && Math.random() < (fuego ? 0.22 : 0.06)) {
            if (fuego) fx.particulas({ x: x + 5, y: y - 3, n: 1, color: ['#ffd23a', '#ff9f43', '#ff5a3a'], vel: 0.5, vida: 450, grav: -0.03, tam: 1.3, dir: -Math.PI / 2, abanico: 0.7 });
            else fx.particulas({ x: x + 5.5, y: y + 10, n: 1, color: '#9fd8ff', vel: 0.2, vida: 500, grav: 0.06, tam: 1.1, forma: 'gota' });
        }
    };
    if (FA.el && Date.now() - FA.el.visto < 4000 && !FA.el.muerto) {
        const [rx, ry] = VivoComun.suave(FA.el);
        if (FA.el.sAntes != null && FA.el.s && !FA.el.sAntes) FA.el.aplasta = 1;
        FA.el.sAntes = FA.el.s; FA.el.aplasta = Math.max(0, (FA.el.aplasta || 0) - 0.12);
        pj({ x: rx, y: ry, dir: FA.el.d }, miRival, FA.el.aplasta);
    }
    if (FA.yo && !FA.muriendo) pj(FA.yo, miIdentidad, (FA.yo.aplasta || 0) - (FA.yo.estira || 0));
    fx && fx.dibujar(c);
    fx && fx.despues(c);
    c.fillStyle = 'rgba(0,0,0,0.5)'; c.fillRect(0, 0, W, 12);
    c.fillStyle = '#fff'; c.font = 'bold 8px monospace';
    c.fillText(`${e.nivel}/${NIVELES_FA.length} ${NIVELES_FA[e.nivel - 1].nombre} · 💎 ${e.gemas || 0} · ⏱ ${Math.max(0, Math.round((VivoComun.reloj('fuegoagua') - e.inicio) / 1000))}s`, 3, 9);
    VivoComun.estado(c, W, H, FA.enlace, nombreJugador(miRival));
    const falta = e.inicio - VivoComun.reloj('fuegoagua');
    if (e.fase === 'jugando' && falta > 0) {
        const k = 1 - (falta % 1000) / 1000, esc = FxVivo.rebote(Math.min(1, k * 2.5));
        c.fillStyle = 'rgba(0,0,0,0.45)'; c.fillRect(0, H / 2 - 22, W, 40);
        c.save(); c.translate(W / 2, H / 2 - 4); c.scale(esc, esc); c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = 'bold 20px monospace'; c.lineWidth = 3; c.strokeStyle = '#1a1424'; c.strokeText(String(Math.ceil(falta / 1000)), 0, 0); c.fillStyle = '#ffd23a'; c.fillText(String(Math.ceil(falta / 1000)), 0, 0); c.restore();
        c.fillStyle = '#fff'; c.textAlign = 'center'; c.font = '8px monospace'; c.fillText(e.aviso && e.nivel > 1 ? `${e.aviso} · ${NIVELES_FA[e.nivel - 1].nombre}` : NIVELES_FA[e.nivel - 1].nombre, W / 2, H / 2 + 13); c.textAlign = 'left';
    }
    else if (FA.enPuerta) { c.fillStyle = '#fff'; c.textAlign = 'center'; c.font = '8px monospace'; c.fillText(`¡En tu puerta! Falta ${nombreJugador(miRival)}…`, W / 2, 24); c.textAlign = 'left'; }
}
function bucleFa(ts){
    const pantalla = document.getElementById('pantalla-fuegoagua');
    if (!pantalla || !pantalla.classList.contains('activa')) { pararFa(); return; }
    if (VivoComun.pausa('fuegoagua')) { FA.ultimoTs = 0; dibujarFa(); VivoComun.cartelPausa(FA.ctx); FA.loop = requestAnimationFrame(bucleFa); return; }
    const dt = Math.min(2.5, (ts - (FA.ultimoTs || ts)) / 16.67 || 1);
    FA.ultimoTs = ts;
    pasoFa(dt);
    if (FA.enlace && FA.yo && Date.now() - FA.ultimoEnvio > 50) {
        FA.ultimoEnvio = Date.now();
        const p = FA.yo;
        const pisaCelda = (ch) => [p.x + 2, p.x + ANCHO_FA - 2].some(px => celdaFa(Math.floor(px / T_FA), Math.floor((p.y + ALTO_FA - 2) / T_FA)) === ch);
        const pisa = pisaCelda('b'), pisaE = pisaCelda('e');
        // Cajas que movi recién (las mando para que el otro las vea igual).
        const cajas = FA.cajas.filter(cj => cj.movida && Date.now() - cj.movida < 400).map(cj => ({ i: cj.id, x: Math.round(cj.x * 10) / 10, y: Math.round(cj.y) }));
        FA.enlace.enviar('pos', { x: Math.round(p.x * 10) / 10, y: Math.round(p.y * 10) / 10, vx: +p.vx.toFixed(2), d: p.dir, s: p.suelo ? 1 : 0, p: pisa ? 1 : 0, pe: pisaE ? 1 : 0, en: FA.enPuerta ? 1 : 0, cj: cajas, c: FA.clave });
        if (cajas.length && !FA._guardandoCajas) {
            FA._guardandoCajas = true;
            setTimeout(() => {
                FA._guardandoCajas = false;
                const clave = FA.clave, estado = FA.cajas.map(cj => ({ i: cj.id, x: Math.round(cj.x), y: Math.round(cj.y) }));
                FuegoAgua.accionEnCola((e) => e.nivel + '-' + e.inicio !== clave ? null : { cajas: estado });
            }, 1200);
        }
    }
    if (FA.estado && FA.estado.fase === 'jugando') VivoComun.cuenta('FA', FA.estado.inicio);
    dibujarFa();
    FA.loop = requestAnimationFrame(bucleFa);
}
function arrancarFa(){
    if (!FA.canvas) {
        FA.canvas = document.createElement('canvas');
        FA.canvas.width = COLS_FA * T_FA * ESC_FA; FA.canvas.height = FILAS_FA * T_FA * ESC_FA;
        FA.canvas.className = 'lienzo-aventura';
        FA.canvas.style.aspectRatio = `${COLS_FA}/${FILAS_FA}`;
        FA.ctx = FA.canvas.getContext('2d');
        FA.ctx.imageSmoothingEnabled = false;
        FA.controles = VivoComun.botones([[{ k: 'izq', txt: '◀' }, { k: 'der', txt: '▶' }], { k: 'salto', txt: '⤒', clase: 'salto' }], FA.teclas);
    }
    if (!FA.teclado) FA.teclado = VivoComun.teclado('pantalla-fuegoagua', { ArrowLeft: 'izq', KeyA: 'izq', ArrowRight: 'der', KeyD: 'der', ArrowUp: 'salto', KeyW: 'salto', Space: 'salto' }, FA.teclas);
    FA.fx = FA.fx || FxVivo.crear();
    if (!FA.enlace) {
        FA.enlace = EnlaceVivo.conectar('fuegoagua', {
            alMensaje(t, d) {
                if (d.c !== FA.clave) return;
                if (t === 'pos') {
                    FA.el = VivoComun.recibir(FA.el, d);
                    if (FA.el.muerto && Date.now() - FA.el.muerto > 600) FA.el.muerto = 0;
                    (d.cj || []).forEach(c => { const cj = FA.cajas[c.i]; if (cj && !(cj.movida && Date.now() - cj.movida < 300)) { cj.x = c.x; cj.y = c.y; } });
                }
                if (t === 'gema' && !FA.tomados.has(d.id)) { FA.tomados.add(d.id); efectoGemaFa(d.id, false); const [, x, y] = d.id.split('-'); FA.mapa[+y][+x] = '.'; }
                if (t === 'muere' && FA.el && FA.el.rx != null) { efectoMuerteFa({ x: FA.el.rx, y: FA.el.ry }, miRival); FA.el.muerto = Date.now(); FA.el.buf = []; }
            }
        });
    }
    if (!FA.loop) FA.loop = requestAnimationFrame(bucleFa);
    window._unsubLoopFuegoAgua = pararFa;
}
function pararFa(){
    if (FA.loop) cancelAnimationFrame(FA.loop);
    FA.loop = null;
    if (FA.enlace) FA.enlace.cerrar();
    FA.enlace = null; Object.keys(FA.teclas).forEach(k => { FA.teclas[k] = false; });
}

const FuegoAgua = JuegoTurnos.crear({
    id: 'fuegoagua',
    sinTurno: true,
    emojiListo: '🔥',
    intro: `Nico es 🔥 y Carito es 💧. La lava sólo la pisa Fuego, el agua sólo Agua, y el verde ¡nadie! Ayúdense con placas, palancas y cajas, y lleguen cada uno a su puerta a la vez. ${NIVELES_FA.length} niveles.`,
    inicial: () => ({ nivel: 1, inicio: window.ahoraSync() + 3000, tomados: [], gemas: 0, muertes: 0, palanca: false, cajas: [], turno: null }),
    tituloFin: () => '🔥💧 ¡Lo lograron!',
    render(e) { return `<div id="fuegoagua-host"></div><div class="texto-centro texto-tenue" style="font-size:0.75rem;">${nombreJugador('nico')} es 🔥 · ${nombreJugador('carito')} es 💧 · Esperen juntos cada uno en su puerta</div>`; },
    alDibujar(cont, e) {
        FA.estado = e;
        const host = cont.querySelector('#fuegoagua-host');
        if (!host) return;
        VivoComun.montar('fuegoagua', FuegoAgua, host, e);
        if (e.fase === 'jugando' && FA.clave !== e.nivel + '-' + e.inicio) cargarNivelFa(e);
        if (e.fase === 'jugando') {
            (e.tomados || []).forEach(id => { if (!FA.tomados.has(id)) { FA.tomados.add(id); const [, x, y] = id.split('-'); FA.mapa[+y][+x] = '.'; } });
            arrancarFa();
            host.appendChild(FA.canvas); host.appendChild(FA.controles);
        } else if (FA.canvas) { host.appendChild(FA.canvas); dibujarFa(); }
    }
});
window._fuegoagua = FA; // para pruebas
