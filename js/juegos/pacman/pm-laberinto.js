// ============================================================
// pm-laberinto.js — MazeGenerator del Pac-Neón de a Dos.
//
//   const lab = PMLaberinto.generar(semilla);
//   lab.W, lab.H         tamaño en casillas
//   lab.m[y][x]          0 pared · 1 pasillo · 2 casa de los fantasmas · 3 puerta de la casa
//   lab.puntos (Set)     índices (y * W + x) con punto · lab.pildoras (Set) con píldora de poder
//   lab.salidas          [[x, y], [x, y]] donde arranca cada Pac (J1 y J2)
//   lab.casa             { puerta: [x, y], afuera: [x, y], adentro: [[x, y], …] }
//   lab.tunel            fila del túnel lateral (sale por un costado y entra por el otro)
//
// Con la misma semilla sale el mismo laberinto en los dos celus.
// Cómo se arma:
//   1. "Recursive backtracking" en la mitad izquierda (pasillos de una casilla).
//   2. Se espeja a la derecha (simétrico, como el original) y se abren cruces al medio.
//   3. Casa de los fantasmas en el centro con un anillo alrededor y el túnel lateral.
//   4. Se rompen los callejones sin salida (quedan bucles: en Pac-Man son esenciales)
//      y se borra cualquier pedazo que no se pueda alcanzar.
// ============================================================
(function () {
    const W = 21, H = 25, CX = 10, CY = 12;
    function rng(s) { let a = s >>> 0; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
    const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

    function generar(semilla) {
        const r = rng(semilla || 1);
        const m = Array.from({ length: H }, () => new Array(W).fill(0));
        const pon = (x, y, v) => { if (x > 0 && x < W - 1 && y > 0 && y < H - 1) { m[y][x] = v; m[y][W - 1 - x] = v; } };

        // 1) Backtracker sobre las casillas impares de la mitad izquierda (x = 1..9)
        const visto = new Set(), pila = [[9, H - 4]];
        visto.add('9,' + (H - 4)); pon(9, H - 4, 1);
        while (pila.length) {
            const [x, y] = pila[pila.length - 1];
            const vecinos = DIRS.map(([dx, dy]) => [x + dx * 2, y + dy * 2, x + dx, y + dy]).filter(([nx, ny]) => nx >= 1 && nx <= 9 && ny >= 1 && ny <= H - 2 && !visto.has(nx + ',' + ny));
            if (!vecinos.length) { pila.pop(); continue; }
            const [nx, ny, wx, wy] = vecinos[Math.floor(r() * vecinos.length)];
            pon(wx, wy, 1); pon(nx, ny, 1); visto.add(nx + ',' + ny); pila.push([nx, ny]);
        }
        // 2) Cruces por la columna del medio (la mitad derecha ya quedó espejada)
        const filas = []; for (let y = 1; y < H - 1; y += 2) filas.push(y);
        let cruces = 0;
        filas.forEach(y => { if (m[y][9] && r() < 0.42) { m[y][CX] = 1; cruces++; } });
        while (cruces < 3) { const y = filas[Math.floor(r() * filas.length)]; if (m[y][9] && !m[y][CX]) { m[y][CX] = 1; cruces++; } else if (r() < 0.05) break; }

        // 3) Casa de los fantasmas con un anillo de pasillo alrededor
        for (let y = CY - 3; y <= CY + 3; y++) for (let x = CX - 4; x <= CX + 4; x++) {
            const borde = y === CY - 3 || y === CY + 3 || x === CX - 4 || x === CX + 4;
            m[y][x] = borde ? 1 : 0;
        }
        for (let y = CY - 1; y <= CY + 1; y++) for (let x = CX - 2; x <= CX + 2; x++) m[y][x] = 2;
        m[CY - 2][CX] = 3; // la puerta
        // Túnel lateral: desde cada borde hasta el anillo
        const tunel = CY;
        for (let x = 0; x <= CX - 4; x++) { m[tunel][x] = 1; m[tunel][W - 1 - x] = 1; }

        // 4) Sin callejones: cada punta muerta se abre hacia otro pasillo (y su espejo)
        const esCamino = (x, y) => y >= 0 && y < H && x >= 0 && x < W && m[y][x] === 1;
        for (let vuelta = 0; vuelta < 4; vuelta++) {
            let cambios = 0;
            for (let y = 1; y < H - 1; y++) for (let x = 1; x <= CX; x++) {
                if (m[y][x] !== 1 || y === tunel) continue;
                const abiertos = DIRS.filter(([dx, dy]) => esCamino(x + dx, y + dy)).length;
                if (abiertos !== 1) continue;
                const opciones = DIRS.filter(([dx, dy]) => {
                    const wx = x + dx, wy = y + dy;
                    return wx > 0 && wx < W - 1 && wy > 0 && wy < H - 1 && m[wy][wx] === 0 && esCamino(x + dx * 2, y + dy * 2);
                });
                if (opciones.length) { const [dx, dy] = opciones[Math.floor(r() * opciones.length)]; pon(x + dx, y + dy, 1); if (x + dx === CX) m[y + dy][CX] = 1; cambios++; }
            }
            if (!cambios) break;
        }
        // Lo que no se puede alcanzar desde el anillo se vuelve pared
        const alcanza = new Set([(CY - 3) * W + CX]), cola = [[CX, CY - 3]];
        while (cola.length) {
            const [x, y] = cola.shift();
            for (const [dx, dy] of DIRS) {
                let nx = x + dx; const ny = y + dy;
                if (nx < 0) nx = W - 1; if (nx >= W) nx = 0;
                const k = ny * W + nx;
                if (ny >= 0 && ny < H && m[ny][nx] === 1 && !alcanza.has(k)) { alcanza.add(k); cola.push([nx, ny]); }
            }
        }
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (m[y][x] === 1 && !alcanza.has(y * W + x)) m[y][x] = 0;

        // Salidas de los Pac, puntos y píldoras
        const cercano = (tx, ty) => { let mejor = null, md = Infinity; for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) if (m[y][x] === 1) { const d = Math.abs(x - tx) + Math.abs(y - ty) * 1.01; if (d < md) { md = d; mejor = [x, y]; } } return mejor; };
        const s1 = cercano(CX - 2, H - 4), salidas = [s1, [W - 1 - s1[0], s1[1]]];
        // Las 4 píldoras cerca de las esquinas (espejadas, así quedan parejas)
        const p1 = cercano(1, 3), p2 = cercano(1, H - 5);
        const pildoras = new Set([p1, p2].flatMap(([x, y]) => [y * W + x, y * W + (W - 1 - x)]));
        const puntos = new Set();
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
            if (m[y][x] !== 1) continue;
            const k = y * W + x;
            if (pildoras.has(k) || salidas.some(([sx, sy]) => sx === x && sy === y)) continue;
            if (y === tunel && (x < 3 || x > W - 4)) continue; // el túnel va vacío
            puntos.add(k);
        }
        const casa = { puerta: [CX, CY - 2], afuera: [CX, CY - 3], adentro: [[CX, CY], [CX - 1, CY], [CX + 1, CY], [CX, CY - 3]] };
        return { W, H, m, puntos, pildoras, salidas, casa, tunel, semilla };
    }
    window.PMLaberinto = { generar, W, H };
})();
