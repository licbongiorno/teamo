// ============================================================
// pm-entidades.js — movimiento por la grilla y la IA de los fantasmas.
//
//   PMEnt.mover(lab, ent, velocidad, dt, elegir)
//       ent { x, y, dir: [dx, dy], tx, ty } en casillas. Avanza de centro a
//       centro de casilla; en cada centro llama a elegir(ent) → [dx, dy] | null.
//       El túnel lateral pasa de un borde al otro.
//   PMEnt.elegirPac(lab, ent)   → usa ent.quiere (la jugada encolada) si se puede.
//   PMEnt.crearFantasmas(lab)   → los 4 (Blinky, Pinky, Inky, Clyde)
//   PMEnt.pensarFantasmas(lab, fantasmas, pacs, dt, modoGlobal) → mueve y decide
//
// La IA es la clásica, adaptada a DOS objetivos:
//   Blinky (rojo)    persigue al Pac más cercano.
//   Pinky (rosa)     apunta 4 casillas adelante del J1 (o del que quede libre).
//   Inky (cian)      usa a Blinky y 2 casillas adelante del J2: ataca en pinza.
//   Clyde (naranja)  persigue al más cercano, pero si se acerca mucho se va a su rincón.
// Un Pac cautivo no cuenta: todos van por el que puede rescatarlo.
// ============================================================
(function () {
    const DIRS = [[0, -1], [-1, 0], [0, 1], [1, 0]]; // orden de desempate clásico: arriba, izquierda, abajo, derecha
    const opuesta = (a, b) => a && b && a[0] === -b[0] && a[1] === -b[1] && (a[0] || a[1]);
    function libre(lab, x, y, puedeCasa) {
        if (y < 0 || y >= lab.H) return false;
        if (x < 0) x += lab.W; if (x >= lab.W) x -= lab.W;
        const c = lab.m[y][x];
        return c === 1 || (puedeCasa && (c === 2 || c === 3));
    }
    function mover(lab, e, vel, dt, elegir) {
        let paso = vel * dt, guarda = 0;
        if (e.tx == null) { e.tx = Math.round(e.x); e.ty = Math.round(e.y); }
        while (paso > 1e-6 && guarda++ < 8) {
            const dx = e.tx - e.x, dy = e.ty - e.y, d = Math.abs(dx) + Math.abs(dy);
            if (d <= paso) {
                e.x = e.tx; e.y = e.ty; paso -= d;
                // Túnel: del borde izquierdo al derecho y al revés
                if (e.x < 0) { e.x += lab.W; e.tx = e.x; } else if (e.x >= lab.W) { e.x -= lab.W; e.tx = e.x; }
                const nd = elegir(e);
                if (!nd) { e.dir = [0, 0]; break; }
                e.dir = nd; e.tx = e.x + nd[0]; e.ty = e.y + nd[1];
            } else {
                e.x += Math.sign(dx) * Math.min(paso, Math.abs(dx));
                e.y += Math.sign(dy) * Math.min(paso, Math.abs(dy));
                paso = 0;
            }
        }
    }
    // Pac: dobla apenas puede hacia donde se deslizó el dedo (la jugada queda encolada).
    function elegirPac(lab, e) {
        if (e.quiere && libre(lab, e.x + e.quiere[0], e.y + e.quiere[1])) return e.quiere;
        if (e.dir && (e.dir[0] || e.dir[1]) && libre(lab, e.x + e.dir[0], e.y + e.dir[1])) return e.dir;
        return null;
    }
    // Media vuelta inmediata (sin esperar a llegar al centro), como en el original.
    function darVuelta(e) {
        if (!e.quiere || !opuesta(e.quiere, e.dir)) return;
        e.tx -= e.dir[0]; e.ty -= e.dir[1]; e.dir = e.quiere;
    }

    // ---------- Fantasmas ----------
    const DATOS = [
        { nombre: 'Blinky', color: '#ff4b5c', rincon: [18, -2], sale: 0 },
        { nombre: 'Pinky', color: '#ff9ce4', rincon: [2, -2], sale: 1.5 },
        { nombre: 'Inky', color: '#4ff0ff', rincon: [20, 26], sale: 5 },
        { nombre: 'Clyde', color: '#ffb347', rincon: [0, 26], sale: 9 },
    ];
    function crearFantasmas(lab) {
        return DATOS.map((d, i) => {
            const [x, y] = lab.casa.adentro[i === 0 ? 3 : i - 1];
            return { i, ...d, x, y, tx: null, ty: null, dir: i === 0 ? [-1, 0] : [0, -1], estado: i === 0 ? 'caza' : 'casa', espera: d.sale, rebote: 0 };
        });
    }
    function distancia2(a, b) { return (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2; }
    function objetivo(f, pacs, fantasmas, modo, lab) {
        const vivos = pacs.filter(p => !p.cautivo);
        if (!vivos.length) return f.rincon;
        const cerca = vivos.slice().sort((a, b) => distancia2([a.x, a.y], [f.x, f.y]) - distancia2([b.x, b.y], [f.x, f.y]))[0];
        if (modo === 'disperso') return f.rincon;
        const adelante = (p, n) => [p.x + (p.dir ? p.dir[0] : 0) * n, p.y + (p.dir ? p.dir[1] : 0) * n];
        if (f.i === 0) return [cerca.x, cerca.y];
        if (f.i === 1) { const p = vivos.find(x => x.j === 0) || cerca; return adelante(p, 4); }
        if (f.i === 2) { const p = vivos.find(x => x.j === 1) || cerca, b = fantasmas[0], a = adelante(p, 2); return [a[0] * 2 - b.x, a[1] * 2 - b.y]; }
        return distancia2([cerca.x, cerca.y], [f.x, f.y]) > 64 ? [cerca.x, cerca.y] : f.rincon;
    }
    function elegirFantasma(lab, f, meta, rnd) {
        const casa = f.estado === 'ojos' || f.estado === 'saliendo';
        let ops = DIRS.filter(d => !opuesta(d, f.dir) && libre(lab, f.x + d[0], f.y + d[1], casa));
        // Fuera de la casa, no se vuelve a meter por la puerta
        if (!casa) ops = ops.filter(d => lab.m[f.y + d[1]] && lab.m[f.y + d[1]][(f.x + d[0] + lab.W) % lab.W] !== 3);
        if (!ops.length) ops = DIRS.filter(d => libre(lab, f.x + d[0], f.y + d[1], casa));
        if (!ops.length) return null;
        if (f.estado === 'asustado') return ops[Math.floor(rnd() * ops.length)];
        return ops.slice().sort((a, b) => distancia2([f.x + a[0], f.y + a[1]], meta) - distancia2([f.x + b[0], f.y + b[1]], meta))[0];
    }
    // vel: { caza, asustado, ojos, tunel }
    function pensarFantasmas(lab, fantasmas, pacs, dt, modo, vel, rnd = Math.random) {
        for (const f of fantasmas) {
            if (f.estado === 'casa') {
                // Rebota adentro hasta que le toca salir
                f.espera -= dt; f.rebote += dt * 4;
                f.yv = Math.sin(f.rebote) * 0.25;
                if (f.espera <= 0) { f.estado = 'saliendo'; f.tx = null; f.x = Math.round(f.x); f.y = Math.round(f.y); }
                continue;
            }
            f.yv = 0;
            const enTunel = f.y === lab.tunel && (f.x < 4 || f.x > lab.W - 5);
            const v = f.estado === 'ojos' ? vel.ojos : f.estado === 'asustado' ? vel.asustado : enTunel ? vel.tunel : vel.caza;
            mover(lab, f, v, dt, (e) => {
                if (e.estado === 'saliendo' && e.x === lab.casa.afuera[0] && e.y === lab.casa.afuera[1]) { e.estado = 'caza'; e.dir = [-1, 0]; }
                if (e.estado === 'ojos' && e.x === lab.casa.adentro[0][0] && e.y === lab.casa.adentro[0][1]) { e.estado = 'saliendo'; e.dir = [0, -1]; }
                const m = e.estado === 'saliendo' ? lab.casa.afuera : e.estado === 'ojos' ? lab.casa.adentro[0] : objetivo(e, pacs, fantasmas, modo, lab);
                return elegirFantasma(lab, e, m, rnd);
            });
        }
    }
    window.PMEnt = { mover, elegirPac, darVuelta, crearFantasmas, pensarFantasmas, libre, opuesta, DATOS };
})();
