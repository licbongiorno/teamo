// ==================== ASTRO FÚTBOL ====================
// Duelo de naves en la misma pantalla (mismo celu o compu): cada uno
// defiende su arco y empuja una pelota de plasma hacia el del otro.
// Patada de choque, dash, supertiro que se carga tocando la pelota y
// power-ups (⚡ turbo, 🧲 imán, 🛡️ muro, 🔶 gigante). A 3, 5 o 7 goles
// o 3 minutos (si empatan: gol de oro). También contra la compu.
//
// Usa el motor del Multiverso: MVEntrada (dos jugadores con teclado o
// multitouch por mitades), MVFondo (el espacio), MVNaves (el dibujo y el
// propulsor de las naves), FxVivo y AudioArcade (música y efectos).
//
// La física se hace siempre "acostada" (cancha de LARGO × ANCHO, J1 a la
// izquierda); con el celu parado se dibuja girada 90° (J1 abajo).
(function () {
    const LARGO = 900, ANCHO = 520, M = 24, R_BOLA = 13, R_NAVE = 15, BOCA = 92;
    const COMPU_VEL = { facil: 0.62, normal: 0.8, dificil: 0.95 };
    const POWERUPS = [
        { id: 'turbo', ic: '⚡', col: '#ffd23a', dura: 6000, txt: '¡Turbo!' },
        { id: 'iman', ic: '🧲', col: '#ff6b6b', dura: 6000, txt: '¡Imán!' },
        { id: 'muro', ic: '🛡️', col: '#7ad8ff', dura: 0, txt: '¡Muro en el arco!' },
        { id: 'gigante', ic: '🔶', col: '#ff9f43', dura: 7000, txt: '¡Gigante!' },
    ];
    const AF = {
        canvas: null, ctx: null, entrada: null, fondo: null, fx: null, fxT: null, loop: null, ultimoTs: 0,
        estado: 'menu', parado: false, escala: 1, dpr: 1, ox: 0, oy: 0, SW: LARGO, SH: ANCHO,
        opciones: { goles: 5, compu: false, nivel: 'normal', j1: 'nico' }, historial: null, cortarHist: null,
    };
    const ahora = () => performance.now();
    const A = () => window.AudioArcade;
    const sonar = (n, o) => A() && A().sfx(n, o);
    const nombre = (q) => q === 'compu' ? 'la Compu 🤖' : (typeof nombreJugador === 'function' ? nombreJugador(q) : q);
    const quienJ = (j) => j === 0 ? AF.opciones.j1 : AF.opciones.compu ? 'compu' : (AF.opciones.j1 === 'nico' ? 'carito' : 'nico');

    // ---------- Tamaño ----------
    function medir() {
        const host = document.getElementById('af-host');
        if (!host || !AF.canvas) return;
        const ancho = host.clientWidth || 360, encuadre = document.body.classList.contains('encuadre');
        const arriba = AF.canvas.getBoundingClientRect().top;
        const libre = window.innerHeight - Math.max(0, arriba + (encuadre ? 0 : window.scrollY)) - 8;
        const alto = Math.max(260, Math.min(encuadre ? libre : Math.max(libre, window.innerHeight * 0.6), ancho * 1.9));
        AF.dpr = Math.min(2, window.devicePixelRatio || 1);
        AF.canvas.style.height = alto + 'px';
        AF.canvas.width = Math.round(ancho * AF.dpr); AF.canvas.height = Math.round(alto * AF.dpr);
        AF.anchoPx = ancho; AF.altoPx = alto;
        // La orientación de la cancha se fija al empezar el partido.
        if (AF.estado === 'menu' || !AF.P) AF.parado = alto > ancho * 1.05;
        AF.SW = AF.parado ? ANCHO : LARGO; AF.SH = AF.parado ? LARGO : ANCHO;
        AF.escala = Math.min(ancho / AF.SW, alto / AF.SH);
        AF.ox = (ancho - AF.SW * AF.escala) / 2; AF.oy = (alto - AF.SH * AF.escala) / 2;
    }
    // Cancha (x a lo largo, y a lo ancho) → pantalla del mundo.
    const aPantalla = (x, y) => AF.parado ? [y, LARGO - x] : [x, y];
    // Joystick en pantalla → dirección en la cancha.
    const aCancha = (mx, my) => AF.parado ? [-my, mx] : [mx, my];

    // ---------- Partido ----------
    function crearPartido() {
        const J = MVNaves.crearJuego(LARGO, ANCHO, AF.fx);
        const naves = J.naves;
        const P = {
            J, naves, bola: null, goles: [0, 0], inicio: ahora(), saqueHasta: 0, golHasta: 0, items: [], proxItem: ahora() + 7000,
            muro: [0, 0], fin: false, oro: false, rastro: [], ultimoToque: -1, pausaTotal: 0, pausaDesde: 0, duracion: 180000,
        };
        naves.forEach((n, j) => Object.assign(n, { carga: 0, superHasta: 0, turbo: 0, iman: 0, gigante: 0, cdPatada: 0, cdDash: 0, empuje: 0, ang: j === 0 ? 0 : Math.PI, r: R_NAVE }));
        AF.P = P;
        saque(-1);
        return P;
    }
    const reloj = () => { const P = AF.P; return ahora() - P.pausaTotal - (AF.estado === 'pausa' ? ahora() - P.pausaDesde : 0); };
    function saque(quienRecibio) {
        const P = AF.P;
        P.bola = { x: LARGO / 2, y: ANCHO / 2, vx: 0, vy: 0, giro: 0 };
        P.rastro = [];
        P.naves.forEach((n, j) => { n.x = j === 0 ? LARGO * 0.25 : LARGO * 0.75; n.y = ANCHO / 2; n.vx = n.vy = 0; n.ang = j === 0 ? 0 : Math.PI; });
        // El que recibió el gol saca: la pelota sale un poquito hacia su lado.
        if (quienRecibio >= 0) P.bola.x += quienRecibio === 0 ? -30 : 30;
        P.saqueHasta = reloj() + 1600;
    }
    const radio = (n) => R_NAVE * (n.gigante > reloj() ? 1.6 : 1);

    function actualizar(dt) {
        const P = AF.P, t = reloj();
        if (!P || P.fin) return;
        const ent = [AF.entrada.leer(0), AF.opciones.compu ? cerebroCompu(dt) : AF.entrada.leer(1)];
        const quieto = t < P.saqueHasta || t < P.golHasta;
        P.naves.forEach((n, j) => {
            const e = ent[j];
            let [dx, dy] = j === 1 && AF.opciones.compu ? [e.mx, e.my] : aCancha(e.mx, e.my);
            if (quieto && t < P.golHasta) dx = dy = 0;
            n.cdPatada = Math.max(0, n.cdPatada - dt); n.cdDash = Math.max(0, n.cdDash - dt);
            const turbo = n.turbo > t, max = turbo ? 6.6 : 5.1, fuerza = Math.hypot(dx, dy);
            n.vx += dx * 0.62 * dt; n.vy += dy * 0.62 * dt;
            const roce = Math.pow(0.9, dt); n.vx *= roce; n.vy *= roce;
            const v = Math.hypot(n.vx, n.vy);
            if (v > max && n.dashHasta < ahora()) { n.vx *= max / v; n.vy *= max / v; }
            if (e.dash && n.cdDash <= 0 && !(quieto && t < P.golHasta)) {
                const [ax, ay] = fuerza > 0.1 ? [dx / fuerza, dy / fuerza] : [Math.cos(n.ang), Math.sin(n.ang)];
                n.vx = ax * 12; n.vy = ay * 12; n.cdDash = 70; n.dashHasta = ahora() + 180;
                sonar('dash'); AF.fx.particulas({ x: n.x, y: n.y, n: 10, color: n.col.fuego, vel: 2.5, vida: 300, grav: 0, tam: 2 });
            }
            n.x += n.vx * dt; n.y += n.vy * dt;
            const r = radio(n);
            if (n.x < M + r) { n.x = M + r; n.vx = Math.abs(n.vx) * 0.4; } if (n.x > LARGO - M - r) { n.x = LARGO - M - r; n.vx = -Math.abs(n.vx) * 0.4; }
            if (n.y < M + r) { n.y = M + r; n.vy = Math.abs(n.vy) * 0.4; } if (n.y > ANCHO - M - r) { n.y = ANCHO - M - r; n.vy = -Math.abs(n.vy) * 0.4; }
            if (v > 0.4) { let d = Math.atan2(n.vy, n.vx) - n.ang; d = Math.atan2(Math.sin(d), Math.cos(d)); n.ang += d * Math.min(1, 0.25 * dt); }
            n.empuje = Math.min(1, fuerza);
            P.J.propulsor(n, n.ang, n.empuje * (turbo ? 1 : 0.7));
            // Supertiro: con la barra llena, ★ lo activa por 5 segundos
            if (e.especial && n.carga >= 1 && n.superHasta < t) { n.carga = 0; n.superHasta = t + 5000; sonar('powerup'); textoEn(n.x, n.y - 26, '¡SUPERTIRO!', n.col.base, 13); AF.fx.onda(n.x, n.y, { color: n.col.base, radio: 40 }); }
            if (e.fuego && n.cdPatada <= 0 && !(quieto && t < P.golHasta)) patear(n, j);
        });
        // Naves entre sí: se empujan
        const [a, b] = P.naves, ddx = b.x - a.x, ddy = b.y - a.y, dd = Math.hypot(ddx, ddy), rr = radio(a) + radio(b);
        if (dd < rr && dd > 0) {
            const nx = ddx / dd, ny = ddy / dd, solapa = (rr - dd) / 2;
            a.x -= nx * solapa; a.y -= ny * solapa; b.x += nx * solapa; b.y += ny * solapa;
            const rel = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
            if (rel > 0) { a.vx -= nx * rel; a.vy -= ny * rel; b.vx += nx * rel; b.vy += ny * rel; if (rel > 3) { sonar('choque'); AF.fx.chispas(a.x + nx * radio(a), a.y + ny * radio(a), ['#fff', '#ffd23a'], 8); AF.fx.temblor(2, 150); } }
        }
        if (t >= P.saqueHasta && t >= P.golHasta) moverBola(dt, t);
        else if (P.golHasta && t >= P.golHasta) { P.golHasta = 0; }
        // Power-ups
        if (t > P.proxItem && P.items.length < 2 && t >= P.saqueHasta) {
            const tipo = POWERUPS[Math.floor(Math.random() * POWERUPS.length)];
            P.items.push({ ...tipo, x: LARGO * (0.3 + Math.random() * 0.4), y: ANCHO * (0.18 + Math.random() * 0.64), nace: t });
            P.proxItem = t + 8000 + Math.random() * 5000;
            AF.fx.onda(P.items[P.items.length - 1].x, P.items[P.items.length - 1].y, { color: tipo.col, radio: 22 });
        }
        P.items = P.items.filter(it => {
            if (t - it.nace > 11000) return false;
            for (let j = 0; j < 2; j++) {
                const n = P.naves[j];
                if (Math.hypot(n.x - it.x, n.y - it.y) < radio(n) + 14) { tomarItem(it, n, j, t); return false; }
            }
            return true;
        });
        // Reloj: a los 3 minutos, el que va ganando; si empatan, gol de oro
        if (!P.oro && t - P.inicio > P.duracion) {
            if (P.goles[0] !== P.goles[1]) terminar(P.goles[0] > P.goles[1] ? 0 : 1);
            else { P.oro = true; textoCentro('⭐ ¡GOL DE ORO!', '#ffd23a'); sonar('alerta'); }
        }
    }
    function patear(n, j) {
        const P = AF.P, b = P.bola, t = reloj(), d = Math.hypot(b.x - n.x, b.y - n.y), alcance = radio(n) + R_BOLA + 40;
        n.cdPatada = 32; n.retro = ahora();
        AF.fx.onda(n.x, n.y, { color: n.col.base, radio: alcance, vida: 260, ancho: 2 });
        if (d > alcance || t < P.saqueHasta) { sonar('swoosh'); return; }
        const sup = n.superHasta > t, f = sup ? 17 : 10.5, nx = (b.x - n.x) / (d || 1), ny = (b.y - n.y) / (d || 1);
        b.vx = nx * f + n.vx * 0.4; b.vy = ny * f + n.vy * 0.4; b.fuego = sup ? ahora() + 900 : 0; b.de = j;
        P.ultimoToque = j;
        n.carga = Math.min(1, n.carga + 0.18);
        if (sup) { n.superHasta = 0; sonar('explosion', { tam: 0.5 }); AF.fx.temblor(5, 260); AF.fx.particulas({ x: b.x, y: b.y, n: 22, color: n.col.fuego, vel: 4, vida: 450, grav: 0, tam: 2.4, dir: Math.atan2(ny, nx), abanico: 0.5 }); }
        else { sonar('disparo'); AF.fx.chispas(b.x, b.y, n.col.fuego, 10); }
    }
    function tomarItem(it, n, j, t) {
        const P = AF.P;
        sonar('powerup');
        AF.fx.estrellitas(it.x, it.y, 10, [it.col, '#fff']);
        textoEn(it.x, it.y - 18, it.txt, it.col, 11);
        if (it.id === 'turbo') n.turbo = t + it.dura;
        if (it.id === 'iman') n.iman = t + it.dura;
        if (it.id === 'gigante') n.gigante = t + it.dura;
        if (it.id === 'muro') P.muro[j] = 1;
    }
    function moverBola(dt, t) {
        const P = AF.P, b = P.bola;
        // Imán: la pelota se acerca a quien lo tiene
        P.naves.forEach(n => { if (n.iman > t) { const dx = n.x - b.x, dy = n.y - b.y, d = Math.hypot(dx, dy); if (d < 150 && d > 1) { b.vx += dx / d * 0.32 * dt; b.vy += dy / d * 0.32 * dt; } } });
        b.vx *= Math.pow(0.991, dt); b.vy *= Math.pow(0.991, dt);
        const v = Math.hypot(b.vx, b.vy); if (v > 18) { b.vx *= 18 / v; b.vy *= 18 / v; }
        b.x += b.vx * dt; b.y += b.vy * dt; b.giro += v * 0.04 * dt;
        P.rastro.push({ x: b.x, y: b.y }); if (P.rastro.length > 14) P.rastro.shift();
        const enBoca = Math.abs(b.y - ANCHO / 2) < BOCA - R_BOLA * 0.3;
        // Paredes de los costados largos
        if (b.y < M + R_BOLA) { b.y = M + R_BOLA; b.vy = Math.abs(b.vy) * 0.86; rebote(b, b.x, M); }
        if (b.y > ANCHO - M - R_BOLA) { b.y = ANCHO - M - R_BOLA; b.vy = -Math.abs(b.vy) * 0.86; rebote(b, b.x, ANCHO - M); }
        // Fondos (con la boca del arco)
        for (const lado of [0, 1]) {
            const linea = lado === 0 ? M : LARGO - M, dentro = lado === 0 ? b.x - R_BOLA < linea : b.x + R_BOLA > linea;
            if (!dentro) continue;
            if (P.muro[lado] && enBoca) {
                // El muro frena un gol y se rompe
                P.muro[lado] = 0; b.x = lado === 0 ? linea + R_BOLA : linea - R_BOLA; b.vx = -b.vx * 0.9;
                const [sx, sy] = [linea, b.y]; AF.fx.particulas({ x: sx, y: sy, n: 18, color: ['#7ad8ff', '#fff'], vel: 3, vida: 500, grav: 0, tam: 2.4, forma: 'cuadro' });
                textoEn(sx + (lado === 0 ? 40 : -40), sy, '¡Atajado!', '#7ad8ff', 12); sonar('golpe'); continue;
            }
            if (enBoca) {
                // Adentro del arco: cuenta cuando la pelota cruzó entera la línea
                if (lado === 0 ? b.x < linea - R_BOLA + 2 : b.x > linea + R_BOLA - 2) { gol(lado === 0 ? 1 : 0); return; }
                // Red: fondo y costados del arco
                const fondo = lado === 0 ? 4 : LARGO - 4;
                if (lado === 0 ? b.x - R_BOLA < fondo : b.x + R_BOLA > fondo) { b.x = lado === 0 ? fondo + R_BOLA : fondo - R_BOLA; b.vx *= -0.3; }
            } else { b.x = lado === 0 ? linea + R_BOLA : linea - R_BOLA; b.vx = -b.vx * 0.86; rebote(b, linea, b.y); }
        }
        // Palos
        for (const px of [M, LARGO - M]) for (const py of [ANCHO / 2 - BOCA, ANCHO / 2 + BOCA]) {
            const dx = b.x - px, dy = b.y - py, d = Math.hypot(dx, dy);
            if (d < R_BOLA + 5 && d > 0) { const nx = dx / d, ny = dy / d, vn = b.vx * nx + b.vy * ny; b.x = px + nx * (R_BOLA + 5); b.y = py + ny * (R_BOLA + 5); if (vn < 0) { b.vx -= 1.8 * vn * nx; b.vy -= 1.8 * vn * ny; } sonar('golpe'); AF.fx.chispas(px, py, ['#fff', '#ffd23a'], 8); }
        }
        // Naves
        P.naves.forEach((n, j) => {
            const r = radio(n), dx = b.x - n.x, dy = b.y - n.y, d = Math.hypot(dx, dy);
            if (d < r + R_BOLA && d > 0) {
                const nx = dx / d, ny = dy / d;
                b.x = n.x + nx * (r + R_BOLA); b.y = n.y + ny * (r + R_BOLA);
                const rel = (b.vx - n.vx) * nx + (b.vy - n.vy) * ny;
                if (rel < 0) { b.vx -= 1.7 * rel * nx; b.vy -= 1.7 * rel * ny; }
                b.vx += n.vx * 0.35; b.vy += n.vy * 0.35;
                if (P.ultimoToque !== j || Math.abs(rel) > 2) { n.carga = Math.min(1, n.carga + 0.06); sonar('paleta'); if (Math.abs(rel) > 3) AF.fx.chispas(b.x - nx * R_BOLA, b.y - ny * R_BOLA, n.col.fuego, 5); }
                P.ultimoToque = j; b.de = j;
            }
        });
    }
    function rebote(b, x, y) { const v = Math.hypot(b.vx, b.vy); if (v > 3) { sonar('rebote'); AF.fx.chispas(x, y, ['#bfe9ff', '#fff'], Math.min(8, Math.round(v / 2))); } }
    function gol(j) {
        const P = AF.P, b = P.bola, n = P.naves[j];
        P.goles[j]++;
        sonar('gol'); sonar('explosion', { tam: 0.8 });
        AF.fx.explosion(b.x, b.y, 30); AF.fx.confeti(b.x, b.y, 60); AF.fx.temblor(9, 500); AF.fx.flash(n.col.base + '55', 220);
        textoCentro(`¡GOL de ${nombre(quienJ(j))}!`, n.col.base);
        if (typeof vibrarJ === 'function') vibrarJ([30, 40, 60]);
        b.vx = b.vy = 0; b.x = -999;
        P.golHasta = reloj() + 1900;
        const objetivo = AF.opciones.goles;
        if (P.oro || P.goles[j] >= objetivo) { setTimeout(() => terminar(j), 1500); return; }
        setTimeout(() => { if (AF.P === P && !P.fin) saque(j === 0 ? 1 : 0); }, 1900);
    }
    function terminar(j) {
        const P = AF.P;
        if (!P || P.fin) return;
        P.fin = true; P.ganador = j;
        cambiar('fin');
    }
    // ---------- La compu (J2) ----------
    function cerebroCompu(dt) {
        const P = AF.P, n = P.naves[1], b = P.bola, t = reloj(), vel = COMPU_VEL[AF.opciones.nivel] || 0.8;
        if (!b || b.x < -100) return { mx: 0, my: 0 };
        const arco = { x: M, y: ANCHO / 2 }, propio = { x: LARGO - M, y: ANCHO / 2 };
        // Se pone detrás de la pelota mirando al arco del otro
        const ax = arco.x - b.x, ay = arco.y - b.y, ad = Math.hypot(ax, ay) || 1, ux = ax / ad, uy = ay / ad;
        let tx = b.x - ux * (R_NAVE + R_BOLA + 12) + b.vx * 6, ty = b.y - uy * (R_NAVE + R_BOLA + 12) + b.vy * 6;
        // Si la pelota viene rápido a su arco, defiende entre la pelota y el arco
        if (b.vx > 3 && b.x > LARGO * 0.45) { tx = (b.x + propio.x) / 2 + 40; ty = (b.y + propio.y) / 2; }
        const dx = tx - n.x, dy = ty - n.y, d = Math.hypot(dx, dy);
        let mx = d > 6 ? dx / d * vel : 0, my = d > 6 ? dy / d * vel : 0;
        const db = Math.hypot(b.x - n.x, b.y - n.y), alineado = ((b.x - n.x) * ux + (b.y - n.y) * uy) / (db || 1);
        const fuego = db < R_NAVE + R_BOLA + 34 && alineado > 0.55 && Math.random() < 0.25 * vel;
        const dash = d > 220 && Math.random() < 0.01 * vel;
        const especial = n.carga >= 1 && b.x < LARGO * 0.55 && Math.random() < 0.02;
        return { mx, my, fuego, dash, especial };
    }

    // ---------- Dibujo ----------
    function textoEn(x, y, txt, color, tam = 12) { const [sx, sy] = aPantalla(x, y); AF.fxT.texto(sx, sy, txt, { tam, color, vida: 1100 }); }
    function textoCentro(txt, color) { AF.fxT.texto(AF.SW / 2, AF.SH / 2, txt, { tam: 26, color, vida: 1700, sube: 10 }); }
    function dibujarCancha(c, t) {
        const P = AF.P;
        // Césped de luz: franjas muy suaves
        c.fillStyle = 'rgba(10,20,50,0.55)'; c.fillRect(M, M, LARGO - 2 * M, ANCHO - 2 * M);
        for (let i = 0; i < 10; i++) if (i % 2) { c.fillStyle = 'rgba(90,140,255,0.04)'; c.fillRect(M + i * (LARGO - 2 * M) / 10, M, (LARGO - 2 * M) / 10, ANCHO - 2 * M); }
        c.save(); c.globalCompositeOperation = 'lighter';
        const linea = (w, col) => { c.strokeStyle = col; c.lineWidth = w; };
        for (const [w, a] of [[6, 0.12], [2, 0.6]]) {
            linea(w, `rgba(160,200,255,${a})`);
            c.strokeRect(M, M, LARGO - 2 * M, ANCHO - 2 * M);
            c.beginPath(); c.moveTo(LARGO / 2, M); c.lineTo(LARGO / 2, ANCHO - M); c.stroke();
            c.beginPath(); c.arc(LARGO / 2, ANCHO / 2, 70, 0, Math.PI * 2); c.stroke();
            for (const lado of [0, 1]) { const x = lado ? LARGO - M : M, s = lado ? -1 : 1; c.beginPath(); c.moveTo(x, ANCHO / 2 - BOCA - 40); c.lineTo(x + s * 90, ANCHO / 2 - BOCA - 40); c.lineTo(x + s * 90, ANCHO / 2 + BOCA + 40); c.lineTo(x, ANCHO / 2 + BOCA + 40); c.stroke(); }
        }
        // Arcos con el color de quien defiende, la red latiendo
        P.naves.forEach((n, j) => {
            const x0 = j === 0 ? 4 : LARGO - M, lat = 0.5 + Math.sin(t / 300 + j) * 0.2;
            const g = c.createLinearGradient(j === 0 ? M : LARGO - M, 0, j === 0 ? 4 : LARGO - 4, 0); g.addColorStop(0, n.col.base + '00'); g.addColorStop(1, n.col.base + Math.round(lat * 120).toString(16).padStart(2, '0'));
            c.fillStyle = g; c.fillRect(x0, ANCHO / 2 - BOCA, M - 4, BOCA * 2);
            c.strokeStyle = n.col.base + '55'; c.lineWidth = 1;
            for (let y = ANCHO / 2 - BOCA; y <= ANCHO / 2 + BOCA; y += 12) { c.beginPath(); c.moveTo(x0, y); c.lineTo(x0 + M - 4, y); c.stroke(); }
            c.strokeStyle = n.col.base; c.lineWidth = 3; c.beginPath(); c.moveTo(j === 0 ? M : LARGO - M, ANCHO / 2 - BOCA); c.lineTo(j === 0 ? 4 : LARGO - 4, ANCHO / 2 - BOCA); c.lineTo(j === 0 ? 4 : LARGO - 4, ANCHO / 2 + BOCA); c.lineTo(j === 0 ? M : LARGO - M, ANCHO / 2 + BOCA); c.stroke();
            if (P.muro[j]) { c.strokeStyle = `rgba(122,216,255,${0.6 + Math.sin(t / 90) * 0.3})`; c.lineWidth = 5; c.beginPath(); c.moveTo(j === 0 ? M : LARGO - M, ANCHO / 2 - BOCA); c.lineTo(j === 0 ? M : LARGO - M, ANCHO / 2 + BOCA); c.stroke(); }
        });
        c.restore();
        // Palos
        for (const px of [M, LARGO - M]) for (const py of [ANCHO / 2 - BOCA, ANCHO / 2 + BOCA]) { c.fillStyle = '#fff'; c.beginPath(); c.arc(px, py, 5, 0, Math.PI * 2); c.fill(); }
    }
    function dibujarBola(c, t) {
        const P = AF.P, b = P.bola;
        if (!b || b.x < -100) return;
        const fuego = b.fuego > ahora(), col = b.de != null ? P.naves[b.de].col : null;
        c.save(); c.globalCompositeOperation = 'lighter';
        P.rastro.forEach((p, i) => { const k = i / P.rastro.length; c.fillStyle = fuego ? `rgba(255,${120 + k * 100},60,${k * 0.5})` : `rgba(180,220,255,${k * 0.28})`; c.beginPath(); c.arc(p.x, p.y, R_BOLA * (0.3 + k * 0.7), 0, Math.PI * 2); c.fill(); });
        const halo = c.createRadialGradient(b.x, b.y, 2, b.x, b.y, R_BOLA * 2.6); halo.addColorStop(0, fuego ? 'rgba(255,170,60,0.7)' : 'rgba(170,220,255,0.55)'); halo.addColorStop(1, 'rgba(0,0,0,0)');
        c.fillStyle = halo; c.beginPath(); c.arc(b.x, b.y, R_BOLA * 2.6, 0, Math.PI * 2); c.fill();
        c.restore();
        // Sombra en la cancha
        c.fillStyle = 'rgba(0,0,0,0.3)'; c.beginPath(); c.ellipse(b.x + 4, b.y + 6, R_BOLA, R_BOLA * 0.6, 0, 0, Math.PI * 2); c.fill();
        const g = c.createRadialGradient(b.x - 4, b.y - 4, 1, b.x, b.y, R_BOLA); g.addColorStop(0, '#ffffff'); g.addColorStop(0.5, fuego ? '#ffd27a' : '#cfe8ff'); g.addColorStop(1, fuego ? '#ff6a2a' : (col ? col.base : '#6aa8ff'));
        c.fillStyle = g; c.beginPath(); c.arc(b.x, b.y, R_BOLA, 0, Math.PI * 2); c.fill();
        // Vetas que giran (se nota la velocidad)
        c.save(); c.translate(b.x, b.y); c.rotate(b.giro); c.strokeStyle = 'rgba(255,255,255,0.55)'; c.lineWidth = 1.5;
        c.beginPath(); c.arc(0, 0, R_BOLA * 0.62, 0, Math.PI * 0.9); c.stroke(); c.beginPath(); c.arc(0, 0, R_BOLA * 0.62, Math.PI, Math.PI * 1.9); c.stroke(); c.restore();
        if (fuego && Math.random() < 0.6) AF.fx.particulas({ x: b.x, y: b.y, n: 2, color: ['#ffd23a', '#ff9f43', '#ff5a3a'], vel: 1.2, vida: 300, grav: 0, tam: 2.2 });
    }
    function dibujarItems(c, t) {
        AF.P.items.forEach(it => {
            const k = (t - it.nace) / 11000, fl = Math.sin(t / 250) * 3, a = k > 0.8 && Math.floor(t / 120) % 2 ? 0.35 : 1;
            c.globalAlpha = a;
            const g = c.createRadialGradient(it.x, it.y + fl, 2, it.x, it.y + fl, 22); g.addColorStop(0, it.col + 'aa'); g.addColorStop(1, it.col + '00');
            c.fillStyle = g; c.beginPath(); c.arc(it.x, it.y + fl, 22, 0, Math.PI * 2); c.fill();
            c.strokeStyle = it.col; c.lineWidth = 2; c.beginPath(); c.arc(it.x, it.y + fl, 13, t / 300, t / 300 + Math.PI * 1.5); c.stroke();
            c.save(); c.translate(it.x, it.y + fl); if (AF.parado) c.rotate(Math.PI / 2);
            c.font = '15px serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(it.ic, 0, 1); c.restore();
            c.globalAlpha = 1;
        });
    }
    function dibujarNaves(c, t) {
        const P = AF.P;
        P.naves.forEach((n, j) => {
            const esc = n.gigante > t ? 1.6 : 1;
            // Barra de supertiro alrededor + aura cuando está activo
            if (n.superHasta > t) { c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = n.col.base; c.lineWidth = 3; c.globalAlpha = 0.6 + Math.sin(t / 60) * 0.3; c.beginPath(); c.arc(n.x, n.y, radio(n) + 9, 0, Math.PI * 2); c.stroke(); c.restore(); }
            else if (n.carga > 0) { c.strokeStyle = n.carga >= 1 ? '#ffd23a' : n.col.base + '99'; c.lineWidth = 2.5; c.beginPath(); c.arc(n.x, n.y, radio(n) + 8, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * n.carga); c.stroke(); }
            if (n.turbo > t && Math.random() < 0.5) AF.fx.particulas({ x: n.x, y: n.y, n: 1, color: ['#ffd23a', '#fff'], vel: 0.6, vida: 300, grav: 0, tam: 1.6, forma: 'chispa' });
            if (n.iman > t) { c.strokeStyle = `rgba(255,107,107,${0.25 + Math.sin(t / 120) * 0.15})`; c.setLineDash([4, 6]); c.lineWidth = 1.5; c.beginPath(); c.arc(n.x, n.y, 150, 0, Math.PI * 2); c.stroke(); c.setLineDash([]); }
            c.save(); c.translate(n.x, n.y); c.scale(esc * 1.25, esc * 1.25); c.translate(-n.x, -n.y);
            P.J.dibujarNave(c, n, n.ang);
            c.restore();
        });
    }
    function dibujarHud(c, t) {
        const P = AF.P, W = AF.SW;
        const n0 = nombre(quienJ(0)), n1 = nombre(quienJ(1));
        // Parado, el marcador va al lado de la mitad de cancha (arriba taparía el arco)
        const y0 = AF.parado ? AF.SH / 2 - 52 : 0;
        c.save(); c.translate(0, y0);
        c.fillStyle = AF.parado ? 'rgba(5,4,20,0.4)' : 'rgba(5,4,20,0.6)'; c.fillRect(W / 2 - 130, 4, 260, 30);
        c.font = 'bold 18px sans-serif'; c.textBaseline = 'middle'; c.textAlign = 'center'; c.fillStyle = '#fff';
        c.fillText(`${P.goles[0]}  –  ${P.goles[1]}`, W / 2, 19);
        c.font = 'bold 10px sans-serif';
        c.textAlign = 'right'; c.fillStyle = P.naves[0].col.base; c.fillText(n0, W / 2 - 42, 19);
        c.textAlign = 'left'; c.fillStyle = P.naves[1].col.base; c.fillText(n1, W / 2 + 42, 19);
        const resta = Math.max(0, P.duracion - (reloj() - P.inicio));
        c.textAlign = 'center'; c.font = '9px sans-serif'; c.fillStyle = P.oro ? '#ffd23a' : '#c8d8ff';
        c.fillText(P.oro ? '⭐ GOL DE ORO' : `${Math.floor(resta / 60000)}:${String(Math.floor(resta / 1000) % 60).padStart(2, '0')} · a ${AF.opciones.goles}`, W / 2, 42);
        c.restore();
        // Cuenta del saque
        const falta = P.saqueHasta - reloj();
        if (falta > 0 && !P.golHasta) {
            const k = 1 - (falta % 800) / 800, esc = FxVivo.rebote(Math.min(1, k * 2.5)), txt = falta > 800 ? 'Listos…' : '¡YA!';
            c.save(); c.translate(W / 2, AF.SH * 0.36); c.scale(esc, esc); c.font = 'bold 26px sans-serif'; c.lineWidth = 4; c.strokeStyle = 'rgba(5,4,20,0.8)'; c.strokeText(txt, 0, 0); c.fillStyle = '#fff'; c.fillText(txt, 0, 0); c.restore();
            if (!AF._ya && falta <= 800) { AF._ya = true; sonar('ya'); }
            if (falta > 800) AF._ya = false;
        }
        c.textAlign = 'left'; c.textBaseline = 'alphabetic';
        const k = (ahora() - (AF.inicioCartel || 0)) / 4200;
        if (k < 1) {
            c.globalAlpha = Math.min(1, (1 - k) * 2.5);
            c.fillStyle = 'rgba(5,4,20,0.6)'; c.fillRect(0, AF.SH * 0.6, W, 50);
            c.fillStyle = '#c8d8ff'; c.textAlign = 'center'; c.font = '10px sans-serif';
            const tactil = AF.entrada.zonas().tactil;
            const l = tactil ? ['Cada uno en su mitad: arrastrá para mover · tocá para patear', 'doble toque = dash · ★ = supertiro (con la barra llena)'] : ['J1: W A S D, Espacio patea, E dash, Q supertiro', AF.opciones.compu ? 'Contra la compu 🤖' : 'J2: flechas, Enter patea, Ctrl der. dash, Shift der. supertiro'];
            l.forEach((x, i) => c.fillText(x, W / 2, AF.SH * 0.6 + 20 + i * 14));
            c.globalAlpha = 1; c.textAlign = 'left';
        }
    }
    function dibujarControlesTactiles(c) {
        const z = AF.entrada.zonas();
        if (!z.tactil) return;
        c.setTransform(AF.dpr, 0, 0, AF.dpr, 0, 0);
        c.strokeStyle = 'rgba(255,255,255,0.08)'; c.setLineDash([4, 8]); c.beginPath();
        if (z.acostado) { c.moveTo(z.w / 2, 30); c.lineTo(z.w / 2, z.h - 10); } else { c.moveTo(10, z.h / 2); c.lineTo(z.w - 10, z.h / 2); }
        c.stroke(); c.setLineDash([]);
        for (const j of z.joys) {
            const col = MVNaves.COLORES[j.j].base, rad = Math.max(34, Math.min(z.w, z.h) * 0.09);
            c.strokeStyle = col + '88'; c.lineWidth = 2; c.beginPath(); c.arc(j.x0, j.y0, rad, 0, Math.PI * 2); c.stroke();
            const dx = j.x - j.x0, dy = j.y - j.y0, m = Math.hypot(dx, dy), f = m > rad ? rad / m : 1;
            c.fillStyle = col + 'aa'; c.beginPath(); c.arc(j.x0 + dx * f, j.y0 + dy * f, rad * 0.42, 0, Math.PI * 2); c.fill();
        }
        z.botones.forEach((b, j) => {
            if (j === 1 && AF.opciones.compu) return;
            const col = MVNaves.COLORES[j].base, carga = AF.P ? AF.P.naves[j].carga : 0;
            c.fillStyle = z.especial[j] ? col + '99' : 'rgba(255,255,255,0.08)'; c.beginPath(); c.arc(b.x, b.y, b.r, 0, Math.PI * 2); c.fill();
            c.strokeStyle = carga >= 1 ? '#ffd23a' : col + '88'; c.lineWidth = 3; c.beginPath(); c.arc(b.x, b.y, b.r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * carga); c.stroke();
            c.fillStyle = '#fff'; c.font = `bold ${Math.round(b.r * 0.8)}px sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('★', b.x, b.y + 1);
        });
        c.textAlign = 'left'; c.textBaseline = 'alphabetic';
    }
    function dibujar(c, ts) {
        const t = ahora();
        AF.fondo.dibujar(c, AF.SW, AF.SH, t * 0.01, t * 0.004, t / 1000);
        if (!AF.P) return;
        const tr = reloj();
        AF.fx.antes(c);
        c.save();
        if (AF.parado) { c.translate(0, LARGO); c.rotate(-Math.PI / 2); }
        dibujarCancha(c, t);
        dibujarItems(c, tr);
        dibujarBola(c, t);
        dibujarNaves(c, tr);
        AF.fx.dibujar(c);
        c.restore();
        AF.fx.despues(c);
        AF.fxT.dibujar(c);
        dibujarHud(c, t);
        if (AF.estado === 'pausa') { c.fillStyle = 'rgba(5,4,20,0.55)'; c.fillRect(0, 0, AF.SW, AF.SH); }
    }

    // ---------- Estados y bucle ----------
    function cambiar(est) {
        const antes = AF.estado;
        AF.estado = est;
        if (est === 'menu') { AF.P = null; medir(); panel(htmlMenu()); A() && A().musica('neon', 'calma'); escucharHistorial(); }
        if (est === 'jugando') {
            if (antes === 'pausa' && AF.P) AF.P.pausaTotal += ahora() - AF.P.pausaDesde;
            panel(''); A() && A().musica('neon', 'combate');
        }
        if (est === 'pausa') { AF.P.pausaDesde = ahora(); panel(htmlPausa()); A() && A().musica('neon', 'pausa'); if (AF.entrada) AF.entrada.limpiar(); }
        if (est === 'fin') {
            const P = AF.P, g = P.ganador;
            sonar(AF.opciones.compu && g === 1 ? 'derrota' : 'victoria');
            AF.fx.confeti(LARGO / 2, ANCHO / 2, 90);
            A() && A().musica('neon', 'calma');
            guardarResultado(quienJ(g));
            panel(htmlFin());
        }
    }
    function bucle(ts) {
        const pantalla = document.getElementById('pantalla-astrofutbol');
        if (!pantalla || !pantalla.classList.contains('activa')) { parar(); return; }
        const dt = Math.min(2.5, (ts - (AF.ultimoTs || ts)) / 16.67 || 1);
        AF.ultimoTs = ts;
        const enc = document.body.classList.contains('encuadre');
        if (enc !== AF.encAnt) { AF.encAnt = enc; setTimeout(medir, 30); setTimeout(medir, 300); }
        AF.loop = requestAnimationFrame(bucle);
        const c = AF.ctx;
        try {
            if (AF.estado === 'jugando') actualizar(dt);
            c.setTransform(1, 0, 0, 1, 0, 0);
            c.fillStyle = '#05030f'; c.fillRect(0, 0, AF.canvas.width, AF.canvas.height);
            c.setTransform(AF.escala * AF.dpr, 0, 0, AF.escala * AF.dpr, AF.ox * AF.dpr, AF.oy * AF.dpr);
            c.save(); c.beginPath(); c.rect(0, 0, AF.SW, AF.SH); c.clip();
            dibujar(c, ts);
            c.restore();
            if (AF.estado === 'jugando') dibujarControlesTactiles(c);
        } catch (err) {
            if (!AF.errorAvisado) { AF.errorAvisado = true; console.error('astrofutbol:', err); }
            try { c.restore(); } catch (e) { /* nada */ }
        }
    }
    function parar() {
        if (AF.loop) cancelAnimationFrame(AF.loop);
        AF.loop = null;
        A() && A().musica(null);
        if (AF.cortarHist) { AF.cortarHist(); AF.cortarHist = null; }
        if (AF.entrada) AF.entrada.limpiar();
        if (AF.estado === 'jugando') cambiar('pausa');
    }

    // ---------- Historial (Firestore: juegos/astrofutbol) ----------
    const refHist = () => window.doc(window.db, 'juegos', 'astrofutbol');
    function escucharHistorial() {
        if (AF.cortarHist || !window.onSnapshot || !window.db) return;
        AF.cortarHist = window.onSnapshot(refHist(), (s) => { AF.historial = s.exists() ? s.data() : {}; const h = document.getElementById('af-hist'); if (h) h.innerHTML = htmlHistorial(); }, () => { });
    }
    function guardarResultado(quien) {
        const P = AF.P;
        if (!window.setDoc || !window.db || P.guardado) return;
        P.guardado = true;
        const campo = AF.opciones.compu ? (quien === 'compu' ? 'compu' : 'vsCompu_' + quien) : quien;
        const datos = { victorias: { [campo]: window.increment ? window.increment(1) : 1 }, partidas: window.increment ? window.increment(1) : 1, ultimo: { ganador: quien, goles: P.goles, compu: AF.opciones.compu, j1: AF.opciones.j1, fecha: Date.now() } };
        window.setDoc(refHist(), datos, { merge: true }).catch(() => { });
    }
    function htmlHistorial() {
        const v = (AF.historial && AF.historial.victorias) || {};
        const linea = `<span style="color:${MVNaves.COLORES[0].base}">${esc(nombre('nico'))} ${v.nico || 0}</span> — <span style="color:${MVNaves.COLORES[1].base}">${v.carito || 0} ${esc(nombre('carito'))}</span>`;
        const compu = (v.compu || v.vsCompu_nico || v.vsCompu_carito) ? `<div class="texto-tenue" style="font-size:0.75rem;">Contra la compu: ganaron ${(v.vsCompu_nico || 0) + (v.vsCompu_carito || 0)} · perdieron ${v.compu || 0}</div>` : '';
        return `<div class="mv-puntos">🏆 ${linea}</div>${compu}`;
    }

    // ---------- Paneles ----------
    function panel(html) { const p = document.getElementById('af-panel'); if (p) { p.innerHTML = html; p.style.display = html ? '' : 'none'; } }
    const esc = (t) => String(t).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
    function htmlMenu() {
        const o = AF.opciones, b = (activo, txt, js) => `<button class="mv-tab ${activo ? 'activo' : ''}" onclick="AFJuego.${js}">${txt}</button>`;
        return `<div class="mv-menu">
            <div class="mv-titulo">⚽ Astro Fútbol</div>
            <div class="texto-tenue mv-sub">Duelo de naves en la misma pantalla: empujá la pelota de plasma al arco del otro.</div>
            <div id="af-hist" class="mv-centro" style="min-height:0;">${htmlHistorial()}</div>
            <div class="mv-sub2">Rival</div>
            <div class="mv-tabs">${b(!o.compu, '👫 De a dos', "op('compu', false)")}${b(o.compu, '🤖 Contra la compu', "op('compu', true)")}</div>
            ${o.compu ? `<div class="mv-tabs">${['facil', 'normal', 'dificil'].map(n => b(o.nivel === n, { facil: '😊 Fácil', normal: '🙂 Normal', dificil: '😈 Difícil' }[n], `op('nivel', '${n}')`)).join('')}</div>` : ''}
            <div class="mv-sub2">Goles para ganar</div>
            <div class="mv-tabs">${[3, 5, 7].map(g => b(o.goles === g, 'A ' + g, `op('goles', ${g})`)).join('')}</div>
            <div class="mv-sub2">Lados</div>
            <div class="mv-tabs">${b(true, `<span style="color:${MVNaves.COLORES[0].base}">● ${esc(nombre(quienJ(0)))}</span> ${AF.parado ? 'abajo' : 'a la izquierda'}`, "op('lados')")}</div>
            <div class="mv-botones"><button class="btn-principal" onclick="AFJuego.jugar()">▶ ¡A jugar!</button></div>
            <details class="mv-ayuda"><summary>🎮 Controles y power-ups</summary>
                <p><b>Teclado:</b> J1 W A S D, Espacio patea, E dash, Q supertiro · J2 flechas, Enter patea, Ctrl der. (o /) dash, Shift der. supertiro.</p>
                <p><b>Celu:</b> cada uno en su mitad. Arrastrá para mover, tocá para patear, doble toque para el dash y ★ para el supertiro.</p>
                <p><b>Supertiro:</b> la barra se llena tocando la pelota; con ★ el próximo tiro sale prendido fuego.</p>
                <p><b>Power-ups:</b> ⚡ Turbo · 🧲 Imán (atrae la pelota) · 🛡️ Muro (ataja un gol en tu arco) · 🔶 Gigante.</p>
            </details>
        </div>`;
    }
    function htmlPausa() {
        return `<div class="mv-menu mv-centro"><div class="mv-titulo">⏸ Pausa</div>
            <div class="mv-puntos">${AF.P ? AF.P.goles.join(' – ') : ''}</div>
            <button class="btn-principal" onclick="AFJuego.seguir()">▶ Seguir</button>
            <button class="btn-secundario" onclick="AFJuego.menu()">↩ Abandonar y volver al menú</button></div>`;
    }
    function htmlFin() {
        const P = AF.P, g = P.ganador, quien = quienJ(g), col = P.naves[g].col.base;
        const titulo = quien === 'compu' ? '🤖 Ganó la compu' : `🏆 ¡Ganó ${esc(nombre(quien))}!`;
        return `<div class="mv-menu mv-centro">
            <div class="mv-titulo" style="text-shadow:0 0 16px ${col};">${titulo}</div>
            <div class="mv-total"><b>${P.goles[0]} – ${P.goles[1]}</b></div>
            <div id="af-hist">${htmlHistorial()}</div>
            <div class="mv-botones"><button class="btn-principal" onclick="AFJuego.jugar()">🔁 Revancha</button><button class="btn-secundario" onclick="AFJuego.menu()">↩ Menú</button></div>
        </div>`;
    }

    // ---------- Acciones ----------
    window.AFJuego = {
        jugar() {
            A() && (A().iniciar(), A().sfx('click'));
            const tactil = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
            if (tactil && Math.min(window.innerWidth, window.innerHeight) < 700 && window.VivoComun && !document.body.classList.contains('encuadre')) VivoComun.encuadrar(true, false);
            const arrancar = () => { AF.P = null; medir(); crearPartido(); AF.fx.limpiar(); AF.fxT.limpiar(); AF.inicioCartel = ahora(); medir(); cambiar('jugando'); };
            if (tactil) setTimeout(arrancar, 150); else arrancar();
        },
        op(k, v) {
            const o = AF.opciones;
            if (k === 'lados') o.j1 = o.j1 === 'nico' ? 'carito' : 'nico'; else o[k] = v;
            try { localStorage.setItem('astrofutbolOpciones', JSON.stringify(o)); } catch (_) { }
            A() && A().sfx('click');
            panel(htmlMenu());
        },
        pausar() { if (AF.estado === 'jugando') cambiar('pausa'); else if (AF.estado === 'pausa') cambiar('jugando'); },
        seguir() { cambiar('jugando'); },
        menu() { cambiar('menu'); },
        _estado: () => AF, // para pruebas
    };

    function iniciarAstroFutbol() {
        const cont = document.getElementById('contenido-astrofutbol');
        if (!cont) return;
        try { Object.assign(AF.opciones, JSON.parse(localStorage.getItem('astrofutbolOpciones') || '{}')); } catch (_) { }
        if (!AF.canvas) {
            AF.canvas = document.createElement('canvas');
            AF.canvas.className = 'lienzo-multiverso';
            AF.ctx = AF.canvas.getContext('2d');
            AF.fondo = MVFondo.crear(Math.floor(Math.random() * 1e6));
            AF.fx = FxVivo.crear({ max: 420 });
            AF.fxT = FxVivo.crear({ max: 40 });
            AF.entrada = MVEntrada.crear(AF.canvas, { activo: () => AF.estado === 'jugando', alPrimerGesto: () => A() && A().iniciar() });
            window.addEventListener('resize', () => setTimeout(medir, 80));
            window.addEventListener('keydown', (ev) => { if ((ev.code === 'Escape' || ev.code === 'KeyP') && document.getElementById('pantalla-astrofutbol')?.classList.contains('activa') && (AF.estado === 'jugando' || AF.estado === 'pausa')) { ev.preventDefault(); AFJuego.pausar(); } });
            document.addEventListener('visibilitychange', () => { if (document.hidden && AF.estado === 'jugando') cambiar('pausa'); });
        }
        cont.innerHTML = `<div id="af-host" class="mv-host"><div class="mv-barra"><button type="button" class="mv-btn" onclick="AFJuego.pausar()" title="Pausa (Esc)">⏸</button></div><div id="af-panel" class="mv-panel"></div></div>`;
        const host = cont.querySelector('#af-host');
        host.insertBefore(AF.canvas, host.querySelector('#af-panel'));
        if (window.VivoComun) VivoComun.montar('astrofutbol', null, cont, { fase: 'menu' }, { area: '#af-sin-ajuste' });
        AF.estado = 'menu';
        medir();
        cambiar('menu');
        if (!AF.loop) { AF.ultimoTs = 0; AF.loop = requestAnimationFrame(bucle); }
        window._unsubLoopAstroFutbol = parar;
        setTimeout(medir, 50);
    }
    window.INICIAR_JUEGO = window.INICIAR_JUEGO || {};
    window.INICIAR_JUEGO.astrofutbol = iniciarAstroFutbol;
    window._astrofutbol = AF; // para pruebas
})();
