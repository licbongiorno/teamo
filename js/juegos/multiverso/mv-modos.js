// ============================================================
// mv-modos.js — los cuatro modos del Multiverso Arcade. Cada uno tiene
// su propia física y desafío, y todos usan lo común de mv-naves.js
// (disparos, power-ups compartidos, escudo, Bomba Nova).
//
//   const modo = MVModos.crear('invasion' | 'orbital' | 'nebulosa' | 'exoplaneta', J);
//   modo.actualizar(dt, [entradaJ1, entradaJ2]);  modo.dibujar(ctx);  modo.hud() → texto
//   modo.camX / modo.camY → para el parallax del fondo; J.fin → terminó
// ============================================================
(function () {
    const azar = (a, b) => a + Math.random() * (b - a);
    const ahora = () => performance.now();
    const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
    const INFO = {
        invasion: { nombre: 'Invasión', icono: '👾', desc: 'Oleadas de aliens que bajan en picada. Movete abajo y coordinen el fuego cruzado: si los dos le pegan al mismo, vale doble.', musica: 'combate' },
        orbital: { nombre: 'Supervivencia Orbital', icono: '☄️', desc: 'Espacio abierto, sin gravedad y con inercia. Espalda con espalda contra asteroides y naves que llegan de los bordes.', musica: 'combate' },
        nebulosa: { nombre: 'Carrera Nebulosa', icono: '🌌', desc: 'A toda velocidad, unidos por un rayo de energía: si se separan demasiado, se dañan. El rayo corta la chatarra chica. ¡Pasen juntos por los huecos!', musica: 'exploracion' },
        exoplaneta: { nombre: 'Defensa del Exoplaneta', icono: '🪐', desc: 'Orbiten el planeta con su gravedad e intercepten los misiles antes de que lo alcancen.', musica: 'combate' },
    };

    // Movimiento básico con un poquito de inercia y dash (Invasión, Nebulosa)
    function moverDirecto(J, n, e, dt, vel, soloX) {
        const t = ahora();
        if (e.dash && n.cdDash <= 0) { n.cdDash = 900; n.dashHasta = t + 220; const dx = e.mx || (n.vx >= 0 ? 1 : -1), dy = soloX ? 0 : e.my; n.vx += dx * 11; if (!soloX) n.vy += dy * 11; window.MVAudio && MVAudio.sfx('dash'); J.fx && J.fx.particulas({ x: n.x, y: n.y, n: 10, color: n.col.fuego, vel: 2.5, vida: 300, grav: 0, dir: Math.atan2(-dy, -dx), abanico: 0.6 }); }
        n.vx += ((e.mx * vel) - n.vx) * Math.min(1, 0.22 * dt);
        if (!soloX) n.vy += ((e.my * vel) - n.vy) * Math.min(1, 0.22 * dt); else n.vy = 0;
        n.x += n.vx * dt; n.y += n.vy * dt;
        n.empuje = Math.min(1, Math.hypot(n.vx, n.vy) / vel);
    }

    // ==================== INVASIÓN (estilo Galaga) ====================
    function invasion(J) {
        const M = { id: 'invasion', camX: 0, camY: 0, enemigos: [], balasE: [], ola: 0, proxPicada: 0, aviso: 0, ...INFO.invasion };
        const piso = () => J.H - 40;
        J.naves[0].x = J.W * 0.38; J.naves[1].x = J.W * 0.62; J.naves.forEach(n => { n.y = piso(); n.ang = -Math.PI / 2; });
        function nuevaOla() {
            M.ola++; J.nivel = M.ola;
            const cols = Math.min(10, Math.max(6, Math.floor(J.W / 46))), filas = Math.min(5, 3 + Math.floor(M.ola / 2));
            const sepX = Math.min(40, (J.W - 60) / cols), x0 = J.W / 2 - (cols - 1) * sepX / 2;
            for (let f = 0; f < filas; f++) for (let k = 0; k < cols; k++) {
                const tipo = f === 0 && M.ola >= 2 && k % 3 === 1 ? 2 : f <= 1 ? 1 : 0;
                // Entran volando en curva desde arriba hasta su lugar en la formación
                M.enemigos.push({ tipo, hp: [1, 2, 4][tipo], fx: x0 + k * sepX, fy: 60 + f * 32, x: k % 2 ? -30 : J.W + 30, y: -40 - f * 30, estado: 'entrando', t0: ahora() + (f * cols + k) * 55, golpes: {}, fase: Math.random() * 6 });
            }
            M.aviso = ahora();
            if (J.fx) J.fx.texto(J.W / 2, J.H * 0.42, `Oleada ${M.ola}`, { tam: 20, color: '#c8f0ff', vida: 1500 });
        }
        nuevaOla();
        M.actualizar = (dt, ent) => {
            const t = ahora(), sway = Math.sin(t / 900) * 18;
            J.actualizarComun(dt);
            J.naves.forEach((n, j) => {
                if (n.muerta) return;
                moverDirecto(J, n, ent[j], dt, 4.4, true);
                n.x = Math.max(16, Math.min(J.W - 16, n.x)); n.y = piso();
                if (ent[j].fuego) J.disparar(n, -Math.PI / 2, { cada: 210 });
                J.propulsor(n, -Math.PI / 2, 0.35 + n.empuje * 0.4);
            });
            // Las dos naves no se pisan
            const [a, b] = J.naves; if (!a.muerta && !b.muerta && Math.abs(a.x - b.x) < 22) { const m = (a.x + b.x) / 2, s = a.x < b.x ? -1 : 1; a.x = m + s * 11; b.x = m - s * 11; }
            if (J.intentarNova(ent)) { M.enemigos.forEach(en => { J.sumar(en.golpes[1] && !en.golpes[0] ? 1 : 0, 50, en.x, en.y); J.fx && J.fx.explosion(en.x, en.y, 14); }); M.enemigos = []; M.balasE = []; }
            // Enemigos
            const vel = 1 + M.ola * 0.12;
            if (t > M.proxPicada && M.enemigos.some(e => e.estado === 'formacion')) {
                const candidatos = M.enemigos.filter(e => e.estado === 'formacion');
                const en = candidatos[Math.floor(Math.random() * candidatos.length)], blanco = J.vivas()[Math.floor(Math.random() * J.vivas().length)];
                if (en && blanco) { en.estado = 'picada'; en.t0 = t; en.px = en.x; en.py = en.y; en.bx = blanco.x; en.disparos = en.tipo === 2 ? 3 : 1 + (M.ola > 2 ? 1 : 0); }
                M.proxPicada = t + Math.max(450, 2300 - M.ola * 180);
            }
            for (const en of M.enemigos) {
                const slotX = en.fx + sway, slotY = en.fy;
                if (en.estado === 'entrando') {
                    if (t < en.t0) continue;
                    const k = Math.min(1, (t - en.t0) / 1300), cx = J.W / 2 + (en.x < J.W / 2 ? -1 : 1) * J.W * 0.4;
                    en.x = (1 - k) * (1 - k) * en.x + 2 * (1 - k) * k * cx + k * k * slotX; en.y = (1 - k) * (1 - k) * en.y + 2 * (1 - k) * k * (J.H * 0.45) + k * k * slotY;
                    if (k >= 1) en.estado = 'formacion';
                } else if (en.estado === 'formacion') { en.x += (slotX - en.x) * 0.2 * dt; en.y += (slotY - en.y) * 0.2 * dt; }
                else if (en.estado === 'picada') {
                    // Picada en curva hacia el jugador elegido, disparando
                    const k = (t - en.t0) / (2200 / vel);
                    en.x = en.px + (en.bx - en.px) * Math.min(1, k * 1.2) + Math.sin(k * 7 + en.fase) * 45;
                    en.y = en.py + k * (J.H + 40 - en.py);
                    if (en.disparos > 0 && k > 0.2 + (3 - en.disparos) * 0.12) {
                        en.disparos--;
                        const bl = J.vivas()[0] ? J.vivas().reduce((p, q) => Math.abs(q.x - en.x) < Math.abs(p.x - en.x) ? q : p) : null;
                        const ang = bl ? Math.atan2(bl.y - en.y, bl.x - en.x) : Math.PI / 2;
                        M.balasE.push({ x: en.x, y: en.y + 8, vx: Math.cos(ang) * 3.2, vy: Math.sin(ang) * 3.2 });
                    }
                    if (en.y > J.H + 30) { en.estado = 'volviendo'; en.x = slotX; en.y = -30; }
                } else if (en.estado === 'volviendo') { en.x += (slotX - en.x) * 0.08 * dt; en.y += (slotY - en.y) * 0.05 * dt; if (Math.abs(en.y - slotY) < 2) en.estado = 'formacion'; }
                // Choque con una nave
                for (const n of J.vivas()) if (dist(en, n) < 16) { J.golpear(n); en.hp = 0; en.porChoque = true; }
            }
            // Disparos contra enemigos (fuego cruzado: si los dos le pegaron hace poco, vale doble)
            for (const bl of J.balas) for (const en of M.enemigos) {
                if (en.hp <= 0 || bl.muerta || Math.abs(bl.x - en.x) > 13 || Math.abs(bl.y - en.y) > 12) continue;
                bl.muerta = true; en.hp -= bl.dmg; en.golpes[bl.j] = t; en.flash = t;
                if (en.hp <= 0) {
                    const base = [100, 160, 400][en.tipo] * (en.estado === 'picada' ? 1.5 : 1);
                    const cruzado = en.golpes[0] && en.golpes[1] && Math.abs(en.golpes[0] - en.golpes[1]) < 1500;
                    J.sumar(bl.j, Math.round(base * (cruzado ? 2 : 1)), en.x, en.y);
                    if (cruzado && J.fx) { J.fx.texto(en.x, en.y - 16, '¡Fuego cruzado! x2', { tam: 10, color: '#ffd23a' }); J.sin.rayoT = t; J.sin.rayoTipo = 'rapido'; window.MVAudio && MVAudio.sfx('sinergia'); }
                    J.fx && J.fx.explosion(en.x, en.y, [10, 16, 30][en.tipo]);
                    if (en.tipo === 2) J.fx && J.fx.temblor(5, 300);
                    window.MVAudio && MVAudio.sfx('explosion', { tam: [0.2, 0.4, 0.9][en.tipo] });
                    J.soltarItem(en.x, en.y, [0.05, 0.1, 0.5][en.tipo]);
                } else window.MVAudio && MVAudio.sfx('golpe');
            }
            M.enemigos = M.enemigos.filter(en => { if (en.hp <= 0 && en.porChoque) J.fx && J.fx.explosion(en.x, en.y, 14); return en.hp > 0; });
            for (const b of M.balasE) { b.x += b.vx * dt; b.y += b.vy * dt; for (const n of J.vivas()) if (dist(b, n) < 10) { b.muerta = true; J.golpear(n); } }
            M.balasE = M.balasE.filter(b => !b.muerta && b.y < J.H + 20 && b.x > -20 && b.x < J.W + 20);
            if (!M.enemigos.length && !J.fin) nuevaOla();
            M.camY -= 0.6 * dt;
        };
        const dibujarAlien = (c, en, t) => {
            const flash = en.flash && t - en.flash < 80, aleteo = Math.sin(t / 90 + en.fase);
            c.save(); c.translate(en.x, en.y);
            if (en.estado === 'picada') c.rotate(Math.sin((t - en.t0) / 200) * 0.4);
            const col = flash ? '#ffffff' : ['#5affb4', '#c78bff', '#ff5a6e'][en.tipo], osc = ['#1f8a5a', '#5a2a9a', '#8a1f3a'][en.tipo];
            c.globalCompositeOperation = 'lighter'; const g = c.createRadialGradient(0, 0, 1, 0, 0, 16 + en.tipo * 4); g.addColorStop(0, col + '55'); g.addColorStop(1, col + '00'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, 16 + en.tipo * 4, 0, Math.PI * 2); c.fill(); c.globalCompositeOperation = 'source-over';
            const s = [1, 1.15, 1.6][en.tipo];
            c.scale(s, s);
            if (en.tipo === 0) { // bichito con alas que aletean
                c.fillStyle = osc; c.beginPath(); c.ellipse(-7, -2 - aleteo * 2, 5, 3, -0.5 + aleteo * 0.3, 0, Math.PI * 2); c.ellipse(7, -2 - aleteo * 2, 5, 3, 0.5 - aleteo * 0.3, 0, Math.PI * 2); c.fill();
                c.fillStyle = col; c.beginPath(); c.ellipse(0, 0, 5, 7, 0, 0, Math.PI * 2); c.fill();
            } else if (en.tipo === 1) { // cangrejo con pinzas
                c.strokeStyle = col; c.lineWidth = 2; c.beginPath(); c.moveTo(-6, 0); c.lineTo(-11, -4 + aleteo * 2); c.moveTo(6, 0); c.lineTo(11, -4 + aleteo * 2); c.moveTo(-4, 5); c.lineTo(-7, 9); c.moveTo(4, 5); c.lineTo(7, 9); c.stroke();
                c.fillStyle = col; c.beginPath(); c.roundRect ? c.roundRect(-7, -6, 14, 11, 4) : c.rect(-7, -6, 14, 11); c.fill();
            } else { // jefe con un ojo
                c.fillStyle = osc; c.beginPath(); c.moveTo(-12, 2); c.lineTo(-8, -8); c.lineTo(8, -8); c.lineTo(12, 2); c.lineTo(6, 8); c.lineTo(-6, 8); c.closePath(); c.fill();
                c.fillStyle = col; c.beginPath(); c.arc(0, -1, 6, 0, Math.PI * 2); c.fill();
                c.fillStyle = '#fff'; c.beginPath(); c.arc(0, -1, 3.4, 0, Math.PI * 2); c.fill();
                const bl = J.vivas()[0]; const ang = bl ? Math.atan2(bl.y - en.y, bl.x - en.x) : Math.PI / 2;
                c.fillStyle = '#1a0010'; c.beginPath(); c.arc(Math.cos(ang) * 1.6, -1 + Math.sin(ang) * 1.6, 1.7, 0, Math.PI * 2); c.fill();
            }
            if (en.tipo < 2) { c.fillStyle = '#0a0a20'; c.fillRect(-3, -2, 2, 2); c.fillRect(1, -2, 2, 2); }
            c.restore();
        };
        M.dibujar = (c) => {
            const t = ahora();
            for (const en of M.enemigos) if (en.estado !== 'entrando' || t >= en.t0) dibujarAlien(c, en, t);
            c.globalCompositeOperation = 'lighter';
            for (const b of M.balasE) { c.fillStyle = '#ff6b6b'; c.beginPath(); c.arc(b.x, b.y, 3.2, 0, Math.PI * 2); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(b.x, b.y, 1.3, 0, Math.PI * 2); c.fill(); }
            c.globalCompositeOperation = 'source-over';
            J.naves.forEach(n => J.dibujarNave(c, n, -Math.PI / 2));
        };
        M.hud = () => `Oleada ${M.ola}`;
        return M;
    }

    // ==================== SUPERVIVENCIA ORBITAL (estilo Asteroids) ====================
    function orbital(J) {
        const M = { id: 'orbital', camX: 0, camY: 0, rocas: [], ovnis: [], balasE: [], prox: 0, proxOvni: ahora() + 15000, inicio: ahora(), ...INFO.orbital };
        J.envolver = true;
        const cx = J.W / 2, cy = J.H / 2;
        J.naves[0].x = cx - 16; J.naves[0].y = cy; J.naves[0].ang = Math.PI;
        J.naves[1].x = cx + 16; J.naves[1].y = cy; J.naves[1].ang = 0;
        function roca(tam, x, y, vx, vy) {
            const r = [0, 11, 20, 34][tam], lados = 9 + tam * 2, forma = Array.from({ length: lados }, () => azar(0.72, 1.12));
            return { tam, r, x, y, vx, vy, ang: Math.random() * 6, giro: azar(-0.02, 0.02), forma, crateres: Array.from({ length: tam }, () => [azar(-0.5, 0.5), azar(-0.5, 0.5), azar(0.12, 0.25)]) };
        }
        function lanzarRoca() {
            const lado = Math.floor(Math.random() * 4), x = lado === 0 ? -30 : lado === 1 ? J.W + 30 : Math.random() * J.W, y = lado === 2 ? -30 : lado === 3 ? J.H + 30 : Math.random() * J.H;
            const ang = Math.atan2(cy + azar(-80, 80) - y, cx + azar(-80, 80) - x), v = azar(0.6, 1.2) + J.nivel * 0.08;
            M.rocas.push(roca(Math.random() < 0.6 ? 3 : 2, x, y, Math.cos(ang) * v, Math.sin(ang) * v));
        }
        const envolver = (o, m = 30) => { if (o.x < -m) o.x = J.W + m; if (o.x > J.W + m) o.x = -m; if (o.y < -m) o.y = J.H + m; if (o.y > J.H + m) o.y = -m; };
        function romper(r, j, porBala) {
            r.muerta = true;
            J.sumar(j, [0, 150, 100, 50][r.tam], r.x, r.y);
            J.fx && J.fx.explosion(r.x, r.y, r.tam * 8);
            J.fx && J.fx.particulas({ x: r.x, y: r.y, n: 6 + r.tam * 3, color: ['#8a7f90', '#b8aab8', '#5a5060'], vel: 2, vida: 700, grav: 0, roce: 0.97, forma: 'cuadro', tam: 2.5 });
            if (r.tam === 3) J.fx && J.fx.temblor(3, 200);
            window.MVAudio && MVAudio.sfx('explosion', { tam: r.tam / 3.5 });
            if (r.tam > 1) for (let k = 0; k < 2; k++) { const a = Math.random() * 6.28; M.rocas.push(roca(r.tam - 1, r.x, r.y, r.vx + Math.cos(a) * 1.1, r.vy + Math.sin(a) * 1.1)); }
            if (porBala) J.soltarItem(r.x, r.y, [0, 0.06, 0.08, 0.12][r.tam]);
        }
        M.actualizar = (dt, ent) => {
            const t = ahora();
            J.nivel = 1 + Math.floor((t - M.inicio) / 40000);
            J.actualizarComun(dt);
            J.naves.forEach((n, j) => {
                if (n.muerta) return;
                const e = ent[j];
                let empuje = 0;
                if (e.tactil && (e.mx || e.my)) {
                    // Joystick: hacia dónde apuntar y cuánto acelerar
                    const meta = Math.atan2(e.my, e.mx); let d = meta - n.ang; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
                    n.ang += Math.max(-0.14, Math.min(0.14, d)) * dt; empuje = Math.hypot(e.mx, e.my);
                } else { n.ang += e.mx * 0.075 * dt; if (e.my < 0) empuje = 1; if (e.my > 0) { n.vx *= 0.96; n.vy *= 0.96; } }
                n.vx += Math.cos(n.ang) * empuje * 0.15 * dt; n.vy += Math.sin(n.ang) * empuje * 0.15 * dt;
                if (e.dash && n.cdDash <= 0) { n.cdDash = 1100; n.dashHasta = t + 260; n.vx += Math.cos(n.ang) * 6; n.vy += Math.sin(n.ang) * 6; window.MVAudio && MVAudio.sfx('dash'); }
                const v = Math.hypot(n.vx, n.vy), max = n.dashHasta > t ? 11 : 6; if (v > max) { n.vx *= max / v; n.vy *= max / v; }
                n.vx *= Math.pow(0.996, dt); n.vy *= Math.pow(0.996, dt);
                n.x += n.vx * dt; n.y += n.vy * dt; envolver(n, 12);
                n.empuje = empuje;
                J.propulsor(n, n.ang, empuje);
                if (e.fuego) J.disparar(n, n.ang, { cada: 200, vel: 8, heredar: true, vida: 1000 });
            });
            for (const b of J.balas) envolver(b, 4);
            if (J.intentarNova(ent)) { M.rocas.forEach(r => { if (!r.muerta) { r.muerta = true; J.sumar(0, 25, r.x, r.y); J.fx && J.fx.explosion(r.x, r.y, r.tam * 6); } }); M.ovnis = []; M.balasE = []; }
            if (t > M.prox && M.rocas.length < 9 + J.nivel * 2) { lanzarRoca(); M.prox = t + Math.max(700, 2600 - J.nivel * 250); }
            if (t > M.proxOvni) { const izq = Math.random() < 0.5; M.ovnis.push({ x: izq ? -30 : J.W + 30, y: azar(60, J.H - 60), vx: izq ? 1.4 : -1.4, hp: 3, proxTiro: t + 1200, fase: Math.random() * 6 }); M.proxOvni = t + Math.max(7000, 18000 - J.nivel * 1500); }
            for (const r of M.rocas) {
                r.x += r.vx * dt; r.y += r.vy * dt; r.ang += r.giro * dt; envolver(r, r.r + 10);
                for (const n of J.vivas()) if (dist(r, n) < r.r * 0.85 + n.r) { if (J.golpear(n)) { n.vx += (n.x - r.x) * 0.05; n.vy += (n.y - r.y) * 0.05; } romper(r, n.j, false); break; }
            }
            for (const b of J.balas) for (const r of M.rocas) if (!r.muerta && !b.muerta && dist(b, r) < r.r * 0.9) { b.muerta = true; romper(r, b.j, true); }
            M.rocas = M.rocas.filter(r => !r.muerta);
            for (const o of M.ovnis) {
                o.x += o.vx * dt; o.y += Math.sin(t / 500 + o.fase) * 0.8 * dt;
                if (t > o.proxTiro && J.vivas().length) { o.proxTiro = t + 1600; const bl = J.vivas().reduce((p, q) => dist(q, o) < dist(p, o) ? q : p); const a = Math.atan2(bl.y - o.y, bl.x - o.x) + azar(-0.15, 0.15); M.balasE.push({ x: o.x, y: o.y, vx: Math.cos(a) * 3.4, vy: Math.sin(a) * 3.4, t }); }
                for (const b of J.balas) if (!b.muerta && dist(b, o) < 14) { b.muerta = true; o.hp--; o.flash = t; if (o.hp <= 0) { J.sumar(b.j, 500, o.x, o.y); J.fx && J.fx.explosion(o.x, o.y, 26); window.MVAudio && MVAudio.sfx('explosion', { tam: 0.8 }); J.soltarItem(o.x, o.y, 0.9); } }
                for (const n of J.vivas()) if (dist(o, n) < 18) { J.golpear(n); o.hp = 0; }
            }
            M.ovnis = M.ovnis.filter(o => o.hp > 0 && o.x > -50 && o.x < J.W + 50);
            for (const b of M.balasE) { b.x += b.vx * dt; b.y += b.vy * dt; for (const n of J.vivas()) if (dist(b, n) < 10) { b.muerta = true; J.golpear(n); } }
            M.balasE = M.balasE.filter(b => !b.muerta && t - b.t < 3000 && b.x > -10 && b.x < J.W + 10 && b.y > -10 && b.y < J.H + 10);
            M.camX += (J.naves[0].vx + J.naves[1].vx) * 0.3 * dt; M.camY += (J.naves[0].vy + J.naves[1].vy) * 0.3 * dt;
        };
        M.dibujar = (c) => {
            const t = ahora();
            for (const r of M.rocas) {
                c.save(); c.translate(r.x, r.y); c.rotate(r.ang);
                const g = c.createRadialGradient(-r.r * 0.3, -r.r * 0.3, 1, 0, 0, r.r); g.addColorStop(0, '#a79cb0'); g.addColorStop(1, '#4a4258');
                c.fillStyle = g; c.beginPath(); r.forma.forEach((f, k) => { const a = k / r.forma.length * Math.PI * 2; c.lineTo(Math.cos(a) * r.r * f, Math.sin(a) * r.r * f); }); c.closePath(); c.fill();
                c.strokeStyle = 'rgba(220,210,255,0.35)'; c.lineWidth = 1; c.stroke();
                c.fillStyle = 'rgba(30,25,40,0.35)'; for (const [cx2, cy2, cr] of r.crateres) { c.beginPath(); c.arc(cx2 * r.r, cy2 * r.r, cr * r.r, 0, Math.PI * 2); c.fill(); }
                c.restore();
            }
            for (const o of M.ovnis) {
                const flash = o.flash && t - o.flash < 80;
                c.save(); c.translate(o.x, o.y);
                c.globalCompositeOperation = 'lighter'; const g = c.createRadialGradient(0, 0, 2, 0, 0, 24); g.addColorStop(0, 'rgba(255,90,110,0.4)'); g.addColorStop(1, 'rgba(255,90,110,0)'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, 24, 0, Math.PI * 2); c.fill(); c.globalCompositeOperation = 'source-over';
                c.fillStyle = flash ? '#fff' : '#9aa0b8'; c.beginPath(); c.ellipse(0, 2, 16, 5, 0, 0, Math.PI * 2); c.fill();
                c.fillStyle = flash ? '#fff' : '#7fe0ff'; c.beginPath(); c.ellipse(0, -2, 7, 6, 0, Math.PI, 0); c.fill();
                for (let k = -2; k <= 2; k++) { c.fillStyle = Math.floor(t / 150 + k) % 2 ? '#ffd23a' : '#ff5a6e'; c.beginPath(); c.arc(k * 6, 3, 1.4, 0, Math.PI * 2); c.fill(); }
                c.restore();
            }
            c.globalCompositeOperation = 'lighter';
            for (const b of M.balasE) { c.fillStyle = '#ff5a6e'; c.beginPath(); c.arc(b.x, b.y, 3, 0, Math.PI * 2); c.fill(); }
            c.globalCompositeOperation = 'source-over';
            J.naves.forEach(n => J.dibujarNave(c, n, n.ang));
        };
        M.hud = () => `Nivel ${J.nivel}`;
        return M;
    }

    // ==================== CARRERA NEBULOSA (corredor infinito) ====================
    function nebulosa(J) {
        const M = { id: 'nebulosa', camX: 0, camY: 0, vel: 3.2, cosas: [], prox: 0, proxPared: ahora() + 6000, distancia: 0, danioT: 0, cortados: 0, ...INFO.nebulosa };
        const maxD = () => Math.min(J.W, J.H) * 0.55, avisoD = () => maxD() * 0.8;
        J.naves[0].x = J.W * 0.42; J.naves[1].x = J.W * 0.58; J.naves.forEach(n => { n.y = J.H * 0.78; n.ang = -Math.PI / 2; });
        function lanzar() {
            const r = Math.random(), x = azar(20, J.W - 20);
            if (r < 0.42) M.cosas.push({ tipo: 'chatarra', x, y: -30, vx: azar(-0.6, 0.6), w: azar(14, 26), h: azar(5, 9), ang: Math.random() * 6, giro: azar(-0.06, 0.06), liviana: true });
            else if (r < 0.62) M.cosas.push({ tipo: 'roca', x, y: -40, vx: azar(-0.3, 0.3), r: azar(14, 24), ang: 0, giro: azar(-0.02, 0.02), forma: Array.from({ length: 10 }, () => azar(0.75, 1.1)) });
            else if (r < 0.78) M.cosas.push({ tipo: 'mina', x, y: -20, vx: 0, r: 8, fase: Math.random() * 6 });
            else M.cosas.push({ tipo: 'orbe', x, y: -20, vx: azar(-0.3, 0.3), r: 6 });
        }
        M.actualizar = (dt, ent) => {
            const t = ahora();
            M.vel = Math.min(9, 3.2 + M.distancia / 9000);
            J.nivel = 1 + Math.floor(M.distancia / 4000);
            J.actualizarComun(dt);
            J.naves.forEach((n, j) => {
                if (n.muerta) return;
                moverDirecto(J, n, ent[j], dt, 4.6, false);
                n.x = Math.max(14, Math.min(J.W - 14, n.x)); n.y = Math.max(J.H * 0.3, Math.min(J.H - 22, n.y));
                J.propulsor(n, -Math.PI / 2, 0.55 + M.vel / 14);
                if (ent[j].fuego) J.disparar(n, -Math.PI / 2, { cada: 260, vel: 10 });
            });
            if (J.intentarNova(ent)) { M.cosas.forEach(o => { if (o.tipo !== 'pared' && o.tipo !== 'orbe') { o.muerta = true; J.fx && J.fx.explosion(o.x, o.y, 10); J.sumar(0, 30, o.x, o.y); } }); }
            M.distancia += M.vel * dt; M.camY -= M.vel * dt; J.fondo && J.fondo.velocidad(M.vel);
            // Puntos por distancia, para los dos
            if (Math.floor(M.distancia / 120) !== Math.floor((M.distancia - M.vel * dt) / 120)) J.vivas().forEach(n => { n.puntos += 5; });
            if (t > M.prox) { lanzar(); M.prox = t + Math.max(220, 900 - M.vel * 60); }
            // Pared con un hueco: tienen que pasar los dos por ahí (sincronizar)
            if (t > M.proxPared) { const hueco = Math.max(70, 150 - J.nivel * 8); M.cosas.push({ tipo: 'pared', y: -20, hx: azar(hueco / 2 + 10, J.W - hueco / 2 - 10), hueco, h: 12 }); M.proxPared = t + Math.max(3500, 8000 - J.nivel * 400); }
            const vivas = J.vivas();
            for (const o of M.cosas) {
                o.y += M.vel * dt * (o.tipo === 'roca' ? 0.85 : 1); o.x += (o.vx || 0) * dt; if (o.giro) o.ang += o.giro * dt;
                if (o.tipo === 'pared') {
                    for (const n of vivas) if (Math.abs(n.y - o.y) < o.h / 2 + n.r * 0.6 && Math.abs(n.x - o.hx) > o.hueco / 2 - n.r * 0.5) { if (J.golpear(n)) n.y += 14; }
                    if (!o.pasada && o.y > Math.max(...vivas.map(n => n.y), 0) + 20 && vivas.length) { o.pasada = true; const bien = vivas.length === 2; if (bien) { J.sumar(0, 150, o.hx, o.y); J.sumar(1, 150, o.hx, o.y); J.fx && J.fx.texto(o.hx, o.y - 30, '¡Juntos! +300', { tam: 11, color: '#5affb4' }); } }
                    continue;
                }
                for (const n of vivas) {
                    const rr = o.tipo === 'chatarra' ? Math.max(o.w, o.h) / 2 : o.r;
                    if (dist(o, n) < rr + n.r * 0.8) {
                        if (o.tipo === 'orbe') { o.muerta = true; J.sumar(n.j, 60, o.x, o.y, '#7fffd4'); window.MVAudio && MVAudio.sfx('click'); J.fx && J.fx.estrellitas(o.x, o.y, 5, ['#7fffd4', '#fff']); }
                        else { o.muerta = true; J.golpear(n); J.fx && J.fx.explosion(o.x, o.y, 10); }
                    }
                }
                if (o.tipo === 'mina') { const cerca = vivas.find(n => dist(n, o) < 40); if (cerca && !o.arma) o.arma = t; if (o.arma && t - o.arma > 450) { o.muerta = true; J.fx && J.fx.explosion(o.x, o.y, 18); window.MVAudio && MVAudio.sfx('explosion', { tam: 0.5 }); vivas.forEach(n => { if (dist(n, o) < 46) J.golpear(n); }); } }
                // El rayo que une a las naves corta la chatarra liviana
                if (o.liviana && vivas.length === 2 && !o.muerta) {
                    const [a, b] = vivas, abx = b.x - a.x, aby = b.y - a.y, l2 = abx * abx + aby * aby || 1, k = Math.max(0, Math.min(1, ((o.x - a.x) * abx + (o.y - a.y) * aby) / l2));
                    if (k > 0.05 && k < 0.95 && Math.hypot(a.x + abx * k - o.x, a.y + aby * k - o.y) < 6 && dist(a, b) < avisoD()) { o.muerta = true; M.cortados++; J.sumar(k < 0.5 ? 0 : 1, 80, o.x, o.y, '#c8f0ff'); J.fx && J.fx.chispas(o.x, o.y, ['#c8f0ff', '#fff'], 10); window.MVAudio && MVAudio.sfx('click'); }
                }
            }
            for (const b of J.balas) for (const o of M.cosas) if (!o.muerta && !b.muerta && (o.tipo === 'chatarra' || o.tipo === 'mina') && Math.hypot(b.x - o.x, b.y - o.y) < 12) { b.muerta = true; o.muerta = true; J.sumar(b.j, 40, o.x, o.y); J.fx && J.fx.explosion(o.x, o.y, 9); window.MVAudio && MVAudio.sfx('explosion', { tam: 0.25 }); J.soltarItem(o.x, o.y, 0.07); }
            M.cosas = M.cosas.filter(o => !o.muerta && o.y < J.H + 50);
            // Si se separan demasiado, el rayo los lastima a los dos
            if (vivas.length === 2) {
                const d = dist(vivas[0], vivas[1]);
                if (d > maxD() && t - M.danioT > 1100) { M.danioT = t; vivas.forEach(n => J.golpear(n)); J.fx && J.fx.texto(J.W / 2, J.H * 0.5, '¡El rayo se rompe! Acérquense', { tam: 12, color: '#ff8fa3' }); }
            }
        };
        M.dibujar = (c) => {
            const t = ahora(), vivas = J.vivas();
            // Líneas de velocidad
            c.strokeStyle = 'rgba(200,220,255,0.18)'; c.lineWidth = 1;
            for (let i = 0; i < 14; i++) { const x = (i * 97 + 13) % J.W, y = ((i * 131 + M.distancia * 2.2) % (J.H + 80)) - 40; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + 10 + M.vel * 4); c.stroke(); }
            for (const o of M.cosas) {
                if (o.tipo === 'pared') {
                    c.fillStyle = '#3a2f5a'; c.fillRect(0, o.y - o.h / 2, o.hx - o.hueco / 2, o.h); c.fillRect(o.hx + o.hueco / 2, o.y - o.h / 2, J.W, o.h);
                    c.fillStyle = '#ff5a8a'; c.fillRect(0, o.y - o.h / 2, o.hx - o.hueco / 2, 2); c.fillRect(o.hx + o.hueco / 2, o.y - o.h / 2, J.W, 2);
                    c.fillStyle = Math.floor(t / 150) % 2 ? '#ffd23a' : '#ff9f43'; c.fillRect(o.hx - o.hueco / 2 - 3, o.y - o.h / 2 - 3, 3, o.h + 6); c.fillRect(o.hx + o.hueco / 2, o.y - o.h / 2 - 3, 3, o.h + 6);
                    continue;
                }
                c.save(); c.translate(o.x, o.y);
                if (o.tipo === 'chatarra') { c.rotate(o.ang); c.fillStyle = '#8f9bb0'; c.fillRect(-o.w / 2, -o.h / 2, o.w, o.h); c.fillStyle = '#5a6478'; for (let x = -o.w / 2 + 3; x < o.w / 2; x += 6) c.fillRect(x, -o.h / 2, 2, o.h); c.fillStyle = 'rgba(255,255,255,0.4)'; c.fillRect(-o.w / 2, -o.h / 2, o.w, 1.2); }
                else if (o.tipo === 'roca') { c.rotate(o.ang); c.fillStyle = '#6a5f78'; c.beginPath(); o.forma.forEach((f, k) => { const a = k / o.forma.length * 6.283; c.lineTo(Math.cos(a) * o.r * f, Math.sin(a) * o.r * f); }); c.closePath(); c.fill(); c.strokeStyle = 'rgba(220,210,255,0.3)'; c.stroke(); }
                else if (o.tipo === 'mina') { const arma = o.arma && Math.floor((t - o.arma) / 60) % 2; c.fillStyle = arma ? '#ff3a3a' : '#c23a4a'; c.beginPath(); c.arc(0, 0, o.r, 0, Math.PI * 2); c.fill(); c.strokeStyle = '#ffb3b3'; c.lineWidth = 1.5; for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4 + t / 800; c.beginPath(); c.moveTo(Math.cos(a) * o.r, Math.sin(a) * o.r); c.lineTo(Math.cos(a) * (o.r + 4), Math.sin(a) * (o.r + 4)); c.stroke(); } c.fillStyle = Math.floor(t / 300 + o.fase) % 2 ? '#fff' : '#ff8a8a'; c.beginPath(); c.arc(0, 0, 2.2, 0, Math.PI * 2); c.fill(); }
                else if (o.tipo === 'orbe') { c.globalCompositeOperation = 'lighter'; const g = c.createRadialGradient(0, 0, 1, 0, 0, 14); g.addColorStop(0, 'rgba(127,255,212,0.9)'); g.addColorStop(1, 'rgba(127,255,212,0)'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, 14, 0, Math.PI * 2); c.fill(); c.globalCompositeOperation = 'source-over'; c.fillStyle = '#eafff8'; c.beginPath(); c.arc(0, 0, 3.5 + Math.sin(t / 150) * 0.8, 0, Math.PI * 2); c.fill(); }
                c.restore();
            }
            // El rayo de energía que une a las naves (cambia de color según la distancia)
            if (vivas.length === 2) {
                const [a, b] = vivas, d = dist(a, b), riesgo = Math.max(0, Math.min(1, (d - avisoD()) / (maxD() - avisoD())));
                const col = riesgo > 0.8 ? '#ff4a6a' : riesgo > 0 ? '#ffd23a' : '#9fe8ff';
                c.globalCompositeOperation = 'lighter';
                for (const [w, al] of [[7, 0.18], [3, 0.5], [1.2, 1]]) {
                    c.strokeStyle = w < 2 ? '#fff' : col; c.globalAlpha = al; c.lineWidth = w; c.beginPath(); c.moveTo(a.x, a.y);
                    const pasos = 12, nx = -(b.y - a.y) / (d || 1), ny = (b.x - a.x) / (d || 1);
                    for (let i = 1; i < pasos; i++) { const f = i / pasos, ond = Math.sin(f * Math.PI * 3 + t / 60) * (2 + riesgo * 7) + (riesgo > 0.5 ? (Math.random() - 0.5) * 8 * riesgo : 0); c.lineTo(a.x + (b.x - a.x) * f + nx * ond, a.y + (b.y - a.y) * f + ny * ond); }
                    c.lineTo(b.x, b.y); c.stroke();
                }
                c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
                if (riesgo > 0.3 && J.fx && Math.random() < riesgo * 0.3) J.fx.chispas((a.x + b.x) / 2, (a.y + b.y) / 2, ['#ffd23a', '#ff6b6b'], 2);
            }
            J.naves.forEach(n => J.dibujarNave(c, n, -Math.PI / 2));
        };
        M.hud = () => `${Math.floor(M.distancia / 100)} km · x${(M.vel / 3.2).toFixed(1)}`;
        return M;
    }

    // ==================== DEFENSA DEL EXOPLANETA (órbitas con gravedad) ====================
    function exoplaneta(J) {
        const M = { id: 'exoplaneta', camX: 0, camY: 0, misiles: [], prox: ahora() + 2000, inicio: ahora(), vidaPlaneta: 12, golpeT: 0, giro: 0, ...INFO.exoplaneta };
        const P = { x: J.W / 2, y: J.H / 2, r: Math.min(J.W, J.H) * 0.11 };
        const r0 = P.r * 2.5, v0 = 2.4, G = v0 * v0 * r0;
        // Arrancan en órbita circular, uno de cada lado
        [[0, Math.PI], [1, 0]].forEach(([j, a]) => { const n = J.naves[j]; n.x = P.x + Math.cos(a) * r0; n.y = P.y + Math.sin(a) * r0; n.vx = -Math.sin(a) * v0; n.vy = Math.cos(a) * v0; });
        function lanzarMisil() {
            const a = Math.random() * Math.PI * 2, R = Math.hypot(J.W, J.H) / 2 + 20;
            M.misiles.push({ x: P.x + Math.cos(a) * R, y: P.y + Math.sin(a) * R, vx: 0, vy: 0, vel: 0.7 + J.nivel * 0.08 + Math.random() * 0.3, nace: ahora(), giro: azar(-0.6, 0.6), grande: Math.random() < 0.15 + J.nivel * 0.02 });
        }
        M.actualizar = (dt, ent) => {
            const t = ahora();
            J.nivel = 1 + Math.floor((t - M.inicio) / 30000);
            M.giro += 0.003 * dt;
            J.actualizarComun(dt);
            J.naves.forEach((n, j) => {
                if (n.muerta) return;
                const e = ent[j], dx = P.x - n.x, dy = P.y - n.y, r = Math.hypot(dx, dy) || 1;
                // Gravedad del planeta + propulsores en la dirección del control
                const g = G / (r * r);
                n.vx += (dx / r * g + e.mx * 0.11) * dt; n.vy += (dy / r * g + e.my * 0.11) * dt;
                if (e.dash && n.cdDash <= 0) { n.cdDash = 1000; n.dashHasta = t + 240; const v = Math.hypot(n.vx, n.vy) || 1; n.vx += n.vx / v * 5; n.vy += n.vy / v * 5; window.MVAudio && MVAudio.sfx('dash'); }
                const v = Math.hypot(n.vx, n.vy), max = n.dashHasta > t ? 10 : 6; if (v > max) { n.vx *= max / v; n.vy *= max / v; }
                n.x += n.vx * dt; n.y += n.vy * dt;
                // Rebotar en la atmósfera y no irse muy lejos
                const r2 = Math.hypot(n.x - P.x, n.y - P.y);
                if (r2 < P.r + n.r + 6) { const ux = (n.x - P.x) / r2, uy = (n.y - P.y) / r2; n.x = P.x + ux * (P.r + n.r + 6); n.y = P.y + uy * (P.r + n.r + 6); const vr = n.vx * ux + n.vy * uy; if (vr < 0) { n.vx -= 1.6 * vr * ux; n.vy -= 1.6 * vr * uy; } J.fx && J.fx.chispas(n.x - ux * n.r, n.y - uy * n.r, ['#9fe8ff', '#fff'], 4); }
                const lejos = Math.max(J.W, J.H) * 0.55; if (r2 > lejos) { n.vx += (P.x - n.x) / r2 * 0.25 * dt; n.vy += (P.y - n.y) / r2 * 0.25 * dt; }
                n.ang = Math.atan2(n.vy, n.vx); n.empuje = Math.min(1, Math.hypot(e.mx, e.my));
                J.propulsor(n, n.ang, 0.25 + n.empuje * 0.75);
                // Disparo con mira automática al misil más cercano
                if (e.fuego) { let bl = null, bd = 260; for (const m of M.misiles) { const d = dist(m, n); if (d < bd) { bd = d; bl = m; } } J.disparar(n, bl ? Math.atan2(bl.y - n.y, bl.x - n.x) : n.ang, { cada: 230, vel: 8.5 }); }
            });
            if (J.intentarNova(ent)) { M.misiles.forEach(m => { J.fx && J.fx.explosion(m.x, m.y, 12); J.sumar(0, 40, m.x, m.y); }); M.misiles = []; }
            if (t > M.prox) { lanzarMisil(); if (J.nivel > 2 && Math.random() < 0.3) lanzarMisil(); M.prox = t + Math.max(650, 2600 - J.nivel * 220); }
            for (const m of M.misiles) {
                // Van hacia el planeta en espiral, cada vez más rápido
                const dx = P.x - m.x, dy = P.y - m.y, r = Math.hypot(dx, dy) || 1, a = Math.atan2(dy, dx) + m.giro * Math.min(1, r / 300);
                m.vx += (Math.cos(a) * m.vel - m.vx) * 0.05 * dt; m.vy += (Math.sin(a) * m.vel - m.vy) * 0.05 * dt;
                m.x += m.vx * dt; m.y += m.vy * dt; m.vel += 0.0015 * dt;
                if (J.fx && Math.random() < 0.35) J.fx.particulas({ x: m.x, y: m.y, n: 1, color: m.grande ? 'rgba(255,140,90,0.6)' : 'rgba(200,200,220,0.5)', vel: 0.3, vida: 500, grav: 0, tam: m.grande ? 2.4 : 1.6, crece: 0.03 });
                if (r < P.r + 2) {
                    m.muerta = true; M.vidaPlaneta -= m.grande ? 2 : 1; M.golpeT = t;
                    J.fx && (J.fx.explosion(m.x, m.y, m.grande ? 26 : 16), J.fx.temblor(m.grande ? 8 : 5, 400), J.fx.flash('rgba(255,90,60,0.25)', 160));
                    window.MVAudio && MVAudio.sfx('explosion', { tam: m.grande ? 0.9 : 0.6 });
                    if (M.vidaPlaneta <= 3) window.MVAudio && MVAudio.sfx('alerta');
                    if (M.vidaPlaneta <= 0) J.fin = true;
                }
                // Interceptar: chocarlo con la nave también lo destruye (sin daño, pero empuja)
                for (const n of J.vivas()) if (!m.muerta && dist(m, n) < n.r + 7) { m.muerta = true; J.sumar(n.j, m.grande ? 250 : 120, m.x, m.y); J.fx && J.fx.explosion(m.x, m.y, 12); n.vx -= m.vx * 0.6; n.vy -= m.vy * 0.6; window.MVAudio && MVAudio.sfx('explosion', { tam: 0.35 }); J.soltarItem(m.x, m.y, 0.08); }
            }
            for (const b of J.balas) for (const m of M.misiles) if (!m.muerta && !b.muerta && dist(b, m) < 10) { b.muerta = true; if (m.grande && !m.tocado) { m.tocado = true; m.vel *= 0.6; continue; } m.muerta = true; J.sumar(b.j, m.grande ? 200 : 100, m.x, m.y); J.fx && J.fx.explosion(m.x, m.y, 10); window.MVAudio && MVAudio.sfx('explosion', { tam: 0.3 }); J.soltarItem(m.x, m.y, 0.07); }
            M.misiles = M.misiles.filter(m => !m.muerta);
        };
        M.dibujar = (c) => {
            const t = ahora();
            // Órbita ideal punteada
            c.strokeStyle = 'rgba(160,200,255,0.12)'; c.setLineDash([4, 8]); c.lineWidth = 1; c.beginPath(); c.arc(P.x, P.y, r0, 0, Math.PI * 2); c.stroke(); c.setLineDash([]);
            // Atmósfera que se pone roja con los golpes
            const golpe = Math.max(0, 1 - (t - M.golpeT) / 500);
            const atm = c.createRadialGradient(P.x, P.y, P.r * 0.9, P.x, P.y, P.r * 1.7); atm.addColorStop(0, golpe ? `rgba(255,120,90,${0.5 * golpe + 0.2})` : 'rgba(110,200,255,0.4)'); atm.addColorStop(1, 'rgba(110,200,255,0)');
            c.fillStyle = atm; c.beginPath(); c.arc(P.x, P.y, P.r * 1.7, 0, Math.PI * 2); c.fill();
            // Planeta con bandas que giran y sombra
            c.save(); c.beginPath(); c.arc(P.x, P.y, P.r, 0, Math.PI * 2); c.clip();
            const gp = c.createLinearGradient(P.x - P.r, P.y - P.r, P.x + P.r, P.y + P.r); gp.addColorStop(0, '#5fd3a8'); gp.addColorStop(0.5, '#2f8fb8'); gp.addColorStop(1, '#1b3f7a');
            c.fillStyle = gp; c.fillRect(P.x - P.r, P.y - P.r, P.r * 2, P.r * 2);
            for (let k = -4; k <= 4; k++) { c.fillStyle = k % 2 ? 'rgba(255,255,255,0.1)' : 'rgba(20,60,90,0.18)'; const off = ((M.giro * 40 + k * 23) % (P.r * 2)) - P.r; c.beginPath(); c.ellipse(P.x + off, P.y + k * P.r * 0.22, P.r * 0.8, P.r * 0.08, 0, 0, Math.PI * 2); c.fill(); }
            const sombra = c.createRadialGradient(P.x - P.r * 0.4, P.y - P.r * 0.4, P.r * 0.2, P.x, P.y, P.r * 1.05); sombra.addColorStop(0, 'rgba(0,0,0,0)'); sombra.addColorStop(1, 'rgba(0,0,20,0.6)');
            c.fillStyle = sombra; c.fillRect(P.x - P.r, P.y - P.r, P.r * 2, P.r * 2);
            c.restore();
            // Anillo
            c.save(); c.translate(P.x, P.y); c.rotate(-0.35); c.scale(1, 0.3); c.strokeStyle = 'rgba(255,220,170,0.55)'; c.lineWidth = 5; c.beginPath(); c.arc(0, 0, P.r * 1.55, 0.1, Math.PI - 0.1); c.stroke(); c.restore();
            // Vida del planeta
            const vw = P.r * 2;
            c.fillStyle = 'rgba(255,255,255,0.15)'; c.fillRect(P.x - vw / 2, P.y + P.r + 12, vw, 4);
            c.fillStyle = M.vidaPlaneta <= 3 ? '#ff5a6e' : '#5affb4'; c.fillRect(P.x - vw / 2, P.y + P.r + 12, vw * Math.max(0, M.vidaPlaneta) / 12, 4);
            for (const m of M.misiles) {
                const a = Math.atan2(m.vy, m.vx);
                c.save(); c.translate(m.x, m.y); c.rotate(a);
                c.globalCompositeOperation = 'lighter'; c.fillStyle = m.grande ? 'rgba(255,120,60,0.5)' : 'rgba(255,200,120,0.4)'; c.beginPath(); c.arc(-6, 0, 5 + Math.sin(t / 40) * 1.5, 0, Math.PI * 2); c.fill(); c.globalCompositeOperation = 'source-over';
                const s = m.grande ? 1.5 : 1; c.scale(s, s);
                c.fillStyle = m.tocado ? '#ffb3b3' : '#e0e4f0'; c.beginPath(); c.moveTo(8, 0); c.lineTo(-4, -3); c.lineTo(-4, 3); c.closePath(); c.fill();
                c.fillStyle = '#ff5a6e'; c.fillRect(-6, -4, 3, 8);
                c.restore();
                // Aviso en el borde si el misil todavía no entró en pantalla
                if (m.x < 0 || m.x > J.W || m.y < 0 || m.y > J.H) { const ex = Math.max(8, Math.min(J.W - 8, m.x)), ey = Math.max(26, Math.min(J.H - 8, m.y)); c.fillStyle = Math.floor(t / 200) % 2 ? '#ff5a6e' : '#ffd23a'; c.beginPath(); c.arc(ex, ey, 3.5, 0, Math.PI * 2); c.fill(); }
            }
            J.naves.forEach(n => J.dibujarNave(c, n, n.ang));
        };
        M.hud = () => `Nivel ${J.nivel} · Planeta ${Math.max(0, M.vidaPlaneta)}/12`;
        return M;
    }
    const CREAR = { invasion, orbital, nebulosa, exoplaneta };
    window.MVModos = { crear: (id, J) => CREAR[id](J), INFO, LISTA: Object.keys(CREAR) };
})();
