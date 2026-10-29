// ==================== FUEGO Y AGUA (puzzles cooperativos en vivo) ====================
// Nico es 🔥 y Carito es 💧, en la misma pantalla y en vivo. La lava sólo
// la puede pisar Fuego, el agua sólo Agua y el líquido verde no lo puede
// pisar nadie. Placas que abren puertas mientras alguien las pisa, una
// palanca que abre una reja, cajas para empujar y gemas de cada color.
// El nivel se pasa cuando cada uno está en su puerta a la vez. 5 niveles.
// Usa js/plataformas-comun.js (física) y js/enlace-vivo.js (posiciones).
// Mapas: # pared · = plataforma · r lava · a agua · v verde · b placa · D puerta
// (placa) · p palanca · G reja (palanca) · R gema roja · B gema azul · X puerta
// de Fuego · Y puerta de Agua · F/W salidas · K caja.
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
];
const ELEM_FA = { nico: 'fuego', carito: 'agua' };
const FA = { canvas: null, ctx: null, enlace: null, loop: null, estado: null, clave: null, mapa: null, yo: null, el: null, cajas: [], teclas: {}, tomados: new Set(), salida: null, muriendo: false, ultimoEnvio: 0, ultimoTs: 0, enPalanca: false, enPuerta: false };

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
    // Cajas: donde quedaron (si ya se movieron en esta partida).
    (e.cajas || []).forEach(c => { const cj = FA.cajas[c.i]; if (cj) { cj.x = c.x; cj.y = c.y; } });
    FA.tomados = new Set(e.tomados || []);
    FA.tomados.forEach(id => { const [, x, y] = id.split('-'); if (FA.mapa[+y]) FA.mapa[+y][+x] = '.'; });
    FA.yo = { x: FA.salida.x, y: FA.salida.y, vx: 0, vy: 0, suelo: false, dir: 1 };
    FA.muriendo = false; FA.enPuerta = false;
}
const celdaFa = (x, y) => (FA.mapa[y] && FA.mapa[y][x]) || '#';
function placaFa(){
    const pisa = (p) => p && [p.x + 2, p.x + ANCHO_FA - 2].some(px => celdaFa(Math.floor(px / T_FA), Math.floor((p.y + ALTO_FA - 2) / T_FA)) === 'b');
    const cajaPisa = FA.cajas.some(cj => celdaFa(Math.floor((cj.x + cj.w / 2) / T_FA), Math.floor((cj.y + cj.h - 2) / T_FA)) === 'b');
    return pisa(FA.yo) || (FA.el && FA.el.p && Date.now() - FA.el.visto < 1500) || cajaPisa;
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
    if (!e || e.fase !== 'jugando' || !p || FA.muriendo || window.ahoraSync() < e.inicio) return;
    const placa = placaFa();
    const otro = FA.el && Date.now() - FA.el.visto < 1500 ? FA.el : null;
    Plataformas.mover(p, dt, FA.teclas, {
        T: T_FA, ancho: ANCHO_FA, alto: ALTO_FA, esSolido: (x, y) => solidoFa(x, y, placa), cajas: FA.cajas, otro,
        alEmpujar: (cj, d) => empujarCajaFa(cj, d, placa),
    });
    FA.cajas.forEach(cj => Plataformas.caerCaja(cj, dt, (x, y) => solidoFa(x, y, placa), T_FA));
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
    const [, x, y] = id.split('-'); FA.mapa[+y][+x] = '.';
    if (window.sfx) window.sfx.acierto();
    FA.enlace && FA.enlace.enviar('gema', { id, c: FA.clave }, true);
    const clave = FA.clave;
    FuegoAgua.accion((e) => e.nivel + '-' + e.inicio !== clave || (e.tomados || []).includes(id) ? null : { tomados: [...(e.tomados || []), id], gemas: (e.gemas || 0) + 1 });
}
async function moverPalancaFa(abrir){
    FA.moviendoPalanca = true;
    vibrarJ(10);
    if (window.sfx) window.sfx.click();
    const clave = FA.clave;
    try { await FuegoAgua.accion((e) => e.nivel + '-' + e.inicio !== clave || !!e.palanca === abrir ? null : { palanca: abrir }); }
    finally { FA.moviendoPalanca = false; }
}
function morirFa(porque){
    if (FA.muriendo) return;
    FA.muriendo = true;
    vibrarJ([30, 40, 30]);
    if (window.sfx) window.sfx.error();
    if (window.animJuegos) window.animJuegos.cartel(porque, { dur: 900, sonido: false });
    const clave = FA.clave;
    FuegoAgua.accion((e) => e.nivel + '-' + e.inicio !== clave ? null : { muertes: (e.muertes || 0) + 1 });
    setTimeout(() => { if (FA.yo) Object.assign(FA.yo, { x: FA.salida.x, y: FA.salida.y, vx: 0, vy: 0 }); FA.muriendo = false; }, 700);
}
let _completandoFa = false;
async function completarFa(){
    if (_completandoFa) return;
    _completandoFa = true;
    const clave = FA.clave;
    let paso = null;
    try {
        await FuegoAgua.accion((e) => {
            paso = null;
            if (e.nivel + '-' + e.inicio !== clave) return null;
            paso = e.nivel;
            const tiempo = Math.round((window.ahoraSync() - e.inicio) / 1000);
            if (e.nivel >= NIVELES_FA.length) return { ganador: 'empate', motivo: `🎉 ¡Pasaron los ${NIVELES_FA.length} niveles! Gemas: ${e.gemas || 0} · tropezones: ${e.muertes || 0}` };
            return { nivel: e.nivel + 1, inicio: window.ahoraSync() + 3000, tomados: [], palanca: false, cajas: [], aviso: `✅ Nivel ${e.nivel} en ${tiempo} s` };
        });
    } finally { setTimeout(() => { _completandoFa = false; }, 1500); }
    if (paso && window.sfx) window.sfx.victoria ? window.sfx.victoria() : window.sfx.acierto();
}
function dibujarFa(){
    const c = FA.ctx, e = FA.estado;
    if (!c || !e || !FA.mapa) return;
    const W = COLS_FA * T_FA, H = FILAS_FA * T_FA, t = Date.now(), placa = placaFa();
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#2b2016'); g.addColorStop(1, '#1a130c');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.fillStyle = 'rgba(255,220,150,0.04)'; for (let i = 0; i < 12; i++) c.fillRect((i * 53) % W, (i * 37) % H, 12, 6);
    const liquido = (px, py, col, brillo) => { c.fillStyle = col; c.fillRect(px, py + 3, T_FA, T_FA - 3); c.fillStyle = brillo; c.fillRect(px, py + 3 + Math.round(Math.sin(t / 250 + px) * 1), T_FA, 2); };
    for (let y = 0; y < FILAS_FA; y++) for (let x = 0; x < COLS_FA; x++) {
        const ch = FA.mapa[y][x], px = x * T_FA, py = y * T_FA;
        if (ch === '#' || ch === '=') { c.fillStyle = ch === '#' ? '#5a4a36' : '#7a6448'; c.fillRect(px, py, T_FA, T_FA); c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(px, py + T_FA - 2, T_FA, 2); c.fillStyle = 'rgba(255,255,255,0.08)'; c.fillRect(px, py, T_FA, 2); }
        else if (ch === 'r') liquido(px, py, '#e84a2a', '#ffb347');
        else if (ch === 'a') liquido(px, py, '#2a8ae8', '#a8e0ff');
        else if (ch === 'v') liquido(px, py, '#4cd13a', '#b8ff8a');
        else if (ch === 'D') { if (!placa) { c.fillStyle = '#6b4a8a'; c.fillRect(px + 2, py, 12, T_FA); } else { c.fillStyle = 'rgba(107,74,138,0.25)'; c.fillRect(px + 2, py, 12, T_FA); } }
        else if (ch === 'G') { const ab = e.palanca; c.fillStyle = ab ? 'rgba(245,211,107,0.2)' : '#c9a227'; for (let k = 0; k < 4; k++) c.fillRect(px + 1 + k * 4, py, 2, T_FA); }
        else if (ch === 'b') { c.fillStyle = placa ? '#e8496b' : '#ff8fa3'; c.fillRect(px + 2, py + (placa ? 14 : 12), 12, placa ? 2 : 4); }
        else if (ch === 'p') { c.fillStyle = '#888'; c.fillRect(px + 4, py + 13, 8, 3); c.save(); c.translate(px + 8, py + 13); c.rotate(e.palanca ? 0.6 : -0.6); c.fillStyle = '#ddd'; c.fillRect(-1, -10, 2, 10); c.fillStyle = e.palanca ? '#4cd18a' : '#ff6b6b'; c.beginPath(); c.arc(0, -10, 3, 0, Math.PI * 2); c.fill(); c.restore(); }
        else if (ch === 'R' || ch === 'B') { const col = ch === 'R' ? '#ff5a4a' : '#4aa8ff'; const s = 1 + Math.sin(t / 200 + x) * 0.1; c.save(); c.translate(px + 8, py + 8); c.scale(s, s); c.fillStyle = col; c.beginPath(); c.moveTo(0, -6); c.lineTo(5, 0); c.lineTo(0, 6); c.lineTo(-5, 0); c.closePath(); c.fill(); c.fillStyle = 'rgba(255,255,255,0.6)'; c.fillRect(-1, -3, 2, 2); c.restore(); }
        else if (ch === 'X' || ch === 'Y') { const col = ch === 'X' ? '#ff6b4a' : '#4aa8ff'; c.fillStyle = 'rgba(0,0,0,0.4)'; c.fillRect(px + 1, py - 10, 14, 26); c.strokeStyle = col; c.lineWidth = 2; c.strokeRect(px + 1, py - 10, 14, 26); c.fillStyle = col; c.font = '9px serif'; c.fillText(ch === 'X' ? '🔥' : '💧', px + 2, py + 2); }
    }
    FA.cajas.forEach(cj => { c.fillStyle = '#b8864e'; c.fillRect(cj.x, cj.y, cj.w, cj.h); c.strokeStyle = '#6b4a2a'; c.lineWidth = 2; c.strokeRect(cj.x + 1, cj.y + 1, cj.w - 2, cj.h - 2); c.beginPath(); c.moveTo(cj.x + 2, cj.y + 2); c.lineTo(cj.x + cj.w - 2, cj.y + cj.h - 2); c.stroke(); });
    const pj = (p, quien) => {
        const x = Math.round(p.x), y = Math.round(p.y), fuego = ELEM_FA[quien] === 'fuego';
        const col = fuego ? '#ff6b3a' : '#3aa0ff', luz = fuego ? '#ffd23a' : '#bfe8ff';
        c.fillStyle = col; c.fillRect(x + 1, y + 5, 9, 8);
        c.fillStyle = '#2a2235'; c.fillRect(x + 2, y + 12, 3, 2); c.fillRect(x + 6, y + 12, 3, 2);
        c.fillStyle = luz; c.fillRect(x + 2, y + 1, 7, 6);
        // Llama o gota en la cabeza
        c.fillStyle = col;
        if (fuego) { const f = Math.floor(t / 120) % 2; c.fillRect(x + 3, y - 3 - f, 2, 4); c.fillRect(x + 6, y - 2 + f, 2, 3); c.fillRect(x + 4, y - 5, 2, 3); }
        else { c.beginPath(); c.moveTo(x + 5.5, y - 6); c.lineTo(x + 9, y); c.lineTo(x + 2, y); c.fill(); }
        c.fillStyle = '#2a1f33'; c.fillRect(x + ((p.dir || 1) > 0 ? 6 : 3), y + 3, 1, 2);
    };
    if (FA.el && Date.now() - FA.el.visto < 4000) { FA.el.rx = FA.el.rx == null ? FA.el.x : FA.el.rx + (FA.el.x - FA.el.rx) * 0.45; FA.el.ry = FA.el.ry == null ? FA.el.y : FA.el.ry + (FA.el.y - FA.el.ry) * 0.45; pj({ x: FA.el.rx, y: FA.el.ry, dir: FA.el.d }, miRival); }
    if (FA.yo && !FA.muriendo) pj(FA.yo, miIdentidad);
    c.fillStyle = 'rgba(0,0,0,0.5)'; c.fillRect(0, 0, W, 12);
    c.fillStyle = '#fff'; c.font = 'bold 8px monospace';
    c.fillText(`${e.nivel}/${NIVELES_FA.length} ${NIVELES_FA[e.nivel - 1].nombre} · 💎 ${e.gemas || 0} · ⏱ ${Math.max(0, Math.round((window.ahoraSync() - e.inicio) / 1000))}s`, 3, 9);
    c.fillStyle = FA.enlace && FA.enlace.estado === 'directo' ? '#4cd18a' : '#f5d36b'; c.fillRect(W - 8, 3, 5, 5);
    const falta = e.inicio - window.ahoraSync();
    if (e.fase === 'jugando' && falta > 0) { c.fillStyle = 'rgba(0,0,0,0.45)'; c.fillRect(0, H / 2 - 20, W, 36); c.fillStyle = '#fff'; c.textAlign = 'center'; c.font = 'bold 18px monospace'; c.fillText(String(Math.ceil(falta / 1000)), W / 2, H / 2 + 2); c.font = '8px monospace'; c.fillText(NIVELES_FA[e.nivel - 1].nombre, W / 2, H / 2 + 12); c.textAlign = 'left'; }
    else if (FA.enPuerta) { c.fillStyle = '#fff'; c.textAlign = 'center'; c.font = '8px monospace'; c.fillText(`¡En tu puerta! Falta ${nombreJugador(miRival)}…`, W / 2, 24); c.textAlign = 'left'; }
}
function bucleFa(ts){
    const pantalla = document.getElementById('pantalla-fuegoagua');
    if (!pantalla || !pantalla.classList.contains('activa')) { pararFa(); return; }
    const dt = Math.min(2.5, (ts - (FA.ultimoTs || ts)) / 16.67 || 1);
    FA.ultimoTs = ts;
    pasoFa(dt);
    if (FA.enlace && FA.yo && Date.now() - FA.ultimoEnvio > 50) {
        FA.ultimoEnvio = Date.now();
        const p = FA.yo;
        const pisa = [p.x + 2, p.x + ANCHO_FA - 2].some(px => celdaFa(Math.floor(px / T_FA), Math.floor((p.y + ALTO_FA - 2) / T_FA)) === 'b');
        // Cajas que movi recién (las mando para que el otro las vea igual).
        const cajas = FA.cajas.filter(cj => cj.movida && Date.now() - cj.movida < 400).map(cj => ({ i: cj.id, x: Math.round(cj.x * 10) / 10, y: Math.round(cj.y) }));
        FA.enlace.enviar('pos', { x: Math.round(p.x * 10) / 10, y: Math.round(p.y * 10) / 10, vx: +p.vx.toFixed(2), d: p.dir, p: pisa ? 1 : 0, en: FA.enPuerta ? 1 : 0, cj: cajas, c: FA.clave });
        if (cajas.length && !FA._guardandoCajas) {
            FA._guardandoCajas = true;
            setTimeout(() => {
                FA._guardandoCajas = false;
                const clave = FA.clave, estado = FA.cajas.map(cj => ({ i: cj.id, x: Math.round(cj.x), y: Math.round(cj.y) }));
                FuegoAgua.accion((e) => e.nivel + '-' + e.inicio !== clave ? null : { cajas: estado });
            }, 1200);
        }
    }
    dibujarFa();
    FA.loop = requestAnimationFrame(bucleFa);
}
function arrancarFa(){
    if (!FA.canvas) {
        FA.canvas = document.createElement('canvas');
        FA.canvas.width = COLS_FA * T_FA; FA.canvas.height = FILAS_FA * T_FA;
        FA.canvas.className = 'lienzo-aventura';
        FA.canvas.style.aspectRatio = `${COLS_FA}/${FILAS_FA}`;
        FA.ctx = FA.canvas.getContext('2d');
        FA.controles = document.createElement('div');
        FA.controles.className = 'controles-aventura';
        FA.controles.innerHTML = `<div><button data-k="izq">◀</button><button data-k="der">▶</button></div><button data-k="salto" class="salto">⤒</button>`;
        FA.controles.querySelectorAll('button').forEach(b => {
            const k = b.dataset.k;
            b.addEventListener('pointerdown', (ev) => { ev.preventDefault(); FA.teclas[k] = true; b.classList.add('apretado'); });
            const off = (ev) => { ev.preventDefault(); FA.teclas[k] = false; b.classList.remove('apretado'); };
            b.addEventListener('pointerup', off); b.addEventListener('pointercancel', off); b.addEventListener('pointerleave', off);
            b.addEventListener('contextmenu', (ev) => ev.preventDefault());
        });
    }
    if (!FA.teclado) {
        const mapa = { ArrowLeft: 'izq', KeyA: 'izq', ArrowRight: 'der', KeyD: 'der', ArrowUp: 'salto', KeyW: 'salto', Space: 'salto' };
        FA.teclado = (ev) => { const k = mapa[ev.code]; if (!k || !document.getElementById('pantalla-fuegoagua')?.classList.contains('activa') || (ev.target && ev.target.tagName === 'INPUT')) return; ev.preventDefault(); FA.teclas[k] = ev.type === 'keydown'; };
        window.addEventListener('keydown', FA.teclado); window.addEventListener('keyup', FA.teclado);
    }
    if (!FA.enlace) {
        FA.enlace = EnlaceVivo.conectar('fuegoagua', {
            alMensaje(t, d) {
                if (d.c !== FA.clave) return;
                if (t === 'pos') {
                    FA.el = { ...(FA.el || {}), ...d, visto: Date.now() };
                    (d.cj || []).forEach(c => { const cj = FA.cajas[c.i]; if (cj && !(cj.movida && Date.now() - cj.movida < 300)) { cj.x = c.x; cj.y = c.y; } });
                }
                if (t === 'gema' && !FA.tomados.has(d.id)) { FA.tomados.add(d.id); const [, x, y] = d.id.split('-'); FA.mapa[+y][+x] = '.'; }
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
    FA.enlace = null; FA.teclas = {};
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
        if (e.fase === 'jugando' && FA.clave !== e.nivel + '-' + e.inicio) cargarNivelFa(e);
        if (e.fase === 'jugando') {
            (e.tomados || []).forEach(id => { if (!FA.tomados.has(id)) { FA.tomados.add(id); const [, x, y] = id.split('-'); FA.mapa[+y][+x] = '.'; } });
            arrancarFa();
            host.appendChild(FA.canvas); host.appendChild(FA.controles);
        } else if (FA.canvas) { host.appendChild(FA.canvas); dibujarFa(); }
    }
});
window._fuegoagua = FA; // para pruebas
