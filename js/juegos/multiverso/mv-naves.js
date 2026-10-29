// ============================================================
// mv-naves.js — lo que comparten los cuatro modos del Multiverso:
// las naves (dibujo neón, propulsor que responde a la inercia, retroceso
// al disparar, parpadeo al ser invulnerable), los disparos, los power-ups
// y el sistema de SINERGIA: todo lo que junta uno mejora a los dos.
//
//   const J = MVNaves.crearJuego(W, H, fx)   → estado común de la partida
//   J.disparar(nave, ang)  J.golpear(nave)  J.sumar(j, pts, x, y)
//   J.soltarItem(x, y, prob)  J.actualizarComun(dt, entradas)  J.dibujarComun(c)
//
// Power-ups (efecto para AMBAS naves al instante):
//   gemelos  Láseres Gemelos: doble láser en abanico (12 s)
//   rapido   Hiperfuego: dispara el doble de rápido (10 s)
//   escudo   Escudo Vinculado: un campo que absorbe UN golpe a cualquiera de los dos
//   nova     carga la Bomba Nova (se usa cuando los dos tocan el especial a la vez)
//   rescate  revive a la nave caída (o +1 vida a la que tenga menos)
// ============================================================
(function () {
    const COLORES = [{ base: '#5ad1ff', claro: '#d8f4ff', oscuro: '#1a6f9a', fuego: ['#bff0ff', '#5ad1ff', '#2a7bff'] }, { base: '#ff6bd5', claro: '#ffe0f6', oscuro: '#9a1f7a', fuego: ['#ffe0f6', '#ff6bd5', '#ff3a7a'] }];
    const TIPOS = {
        gemelos: { nombre: 'Láseres Gemelos', icono: 'II', col: '#5affb4', dura: 12000 },
        rapido: { nombre: 'Hiperfuego', icono: '»', col: '#ffd23a', dura: 10000 },
        escudo: { nombre: 'Escudo Vinculado', icono: '⬡', col: '#7fb2ff' },
        nova: { nombre: 'Carga Nova', icono: '✦', col: '#ff9f43' },
        rescate: { nombre: 'Rescate', icono: '+', col: '#ff6b8a' },
    };
    const azar = (a, b) => a + Math.random() * (b - a);

    function crearNave(j, x, y) {
        return { j, x, y, vx: 0, vy: 0, ang: -Math.PI / 2, vidas: 3, inv: 0, puntos: 0, retro: 0, cdFuego: 0, cdDash: 0, dashHasta: 0, muerta: false, empuje: 0, r: 11, col: COLORES[j] };
    }
    function crearJuego(W, H, fx) {
        const ahora = () => performance.now();
        const J = {
            W, H, fx, t: 0,
            naves: [crearNave(0, W * 0.4, H * 0.75), crearNave(1, W * 0.6, H * 0.75)],
            balas: [], items: [], textos: [],
            sin: { gemelos: 0, rapido: 0, escudo: 0, nova: 0, rayoT: 0, rayoTipo: null, especialT: [0, 0], novaT: 0, avisoNova: 0 },
            nivel: 1, fin: false, alertaVida: false,
            vivas() { return J.naves.filter(n => !n.muerta); },
            puntosPareja() { return J.naves[0].puntos + J.naves[1].puntos; },
        };
        J.disparar = (n, ang, o = {}) => {
            if (n.muerta || n.cdFuego > 0) return false;
            const s = J.sin, t = ahora();
            const rapido = s.rapido > t, gem = s.gemelos > t;
            n.cdFuego = (o.cada || 190) * (rapido ? 0.5 : 1);
            const vel = o.vel || 9, punta = n.r + 4;
            const tiros = gem ? [-0.12, 0.12] : [0];
            for (const d of tiros) {
                const a = ang + d, lado = gem ? Math.sign(d) * 5 : 0;
                J.balas.push({ x: n.x + Math.cos(ang) * punta + Math.cos(ang + Math.PI / 2) * lado, y: n.y + Math.sin(ang) * punta + Math.sin(ang + Math.PI / 2) * lado, vx: Math.cos(a) * vel + (o.heredar ? n.vx : 0), vy: Math.sin(a) * vel + (o.heredar ? n.vy : 0), j: n.j, vida: o.vida || 900, nace: t, dmg: 1 });
            }
            n.retro = t;
            // Fogonazo en la punta
            if (fx) fx.particulas({ x: n.x + Math.cos(ang) * punta, y: n.y + Math.sin(ang) * punta, n: 4, color: n.col.fuego, vel: 2, vida: 140, grav: 0, tam: 2, dir: ang, abanico: 0.45 });
            window.MVAudio && MVAudio.sfx('laser', { jugador: n.j + 1 });
            return true;
        };
        J.golpear = (n, o = {}) => {
            const t = ahora();
            if (n.muerta || n.inv > t || n.dashHasta > t) return false;
            if (J.sin.escudo > 0) {
                // El Escudo Vinculado absorbe el golpe de cualquiera de los dos.
                J.sin.escudo--; n.inv = t + 900;
                if (fx) { fx.onda(n.x, n.y, { radio: 30, vida: 450, color: 'rgba(127,178,255,0.9)', ancho: 3 }); fx.texto(n.x, n.y - 20, '¡Escudo!', { tam: 11, color: '#bcd6ff' }); fx.temblor(3, 200); }
                window.MVAudio && MVAudio.sfx('golpe');
                return false;
            }
            n.vidas--; n.inv = t + 2000;
            if (fx) { fx.explosion(n.x, n.y, 22); fx.temblor(7, 450); fx.flash('rgba(255,255,255,0.55)', 120); }
            window.MVAudio && MVAudio.sfx('explosion', { tam: 0.7 });
            if (n.vidas <= 0) { n.muerta = true; if (fx) fx.texto(n.x, n.y - 24, n.j === 0 ? '¡J1 caído!' : '¡J2 caído!', { tam: 13, color: '#ff8fa3', vida: 1400 }); }
            if (J.vivas().length === 0 && !o.noTerminar) J.fin = true;
            return true;
        };
        J.sumar = (j, pts, x, y, col) => {
            const n = J.naves[j] || J.naves[0];
            n.puntos += pts;
            // Cada punto también carga un poquito la Bomba Nova.
            J.sin.nova = Math.min(1, J.sin.nova + pts / 4000);
            if (fx && x != null) fx.texto(x, y, '+' + pts, { tam: 9, color: col || n.col.claro, vida: 700, sube: 14 });
        };
        J.soltarItem = (x, y, prob = 0.08) => {
            if (Math.random() > prob) return;
            const caidas = J.vivas().length < 2 ? ['rescate', 'escudo', 'gemelos'] : ['gemelos', 'rapido', 'escudo', 'nova', 'gemelos', 'escudo'];
            J.items.push({ x, y, vx: azar(-0.4, 0.4), vy: azar(0.4, 0.9), tipo: caidas[Math.floor(Math.random() * caidas.length)], nace: ahora() });
        };
        J.recoger = (it, n) => {
            const s = J.sin, t = ahora(), tipo = TIPOS[it.tipo];
            if (it.tipo === 'gemelos') s.gemelos = Math.max(s.gemelos, t) + tipo.dura;
            if (it.tipo === 'rapido') s.rapido = Math.max(s.rapido, t) + tipo.dura;
            if (it.tipo === 'escudo') s.escudo = Math.min(3, s.escudo + 1);
            if (it.tipo === 'nova') s.nova = Math.min(1, s.nova + 0.5);
            if (it.tipo === 'rescate') {
                const caida = J.naves.find(x => x.muerta);
                if (caida) { caida.muerta = false; caida.vidas = 1; caida.inv = t + 2500; caida.x = n.x + 30; caida.y = n.y; caida.vx = caida.vy = 0; }
                else { const menos = J.naves.reduce((a, b) => a.vidas <= b.vidas ? a : b); menos.vidas = Math.min(5, menos.vidas + 1); }
                window.MVAudio && MVAudio.sfx('vida');
            }
            // Sinergia: rayo de luz que une a las dos naves por un instante
            s.rayoT = t; s.rayoTipo = it.tipo;
            if (fx) {
                fx.texto(n.x, n.y - 26, tipo.nombre, { tam: 11, color: tipo.col, vida: 1300 });
                J.vivas().forEach(m => { fx.onda(m.x, m.y, { radio: 26, vida: 500, color: tipo.col, ancho: 2.5 }); fx.estrellitas(m.x, m.y, 6, [tipo.col, '#fff']); });
            }
            window.MVAudio && (MVAudio.sfx('powerup'), MVAudio.sfx('sinergia'));
        };
        // Bomba Nova: hay que tocar el especial los DOS dentro de 0,45 s (y tenerla cargada).
        J.intentarNova = (entradas) => {
            const t = ahora(), s = J.sin;
            entradas.forEach((e, j) => { if (e.especial && !e._antes) s.especialT[j] = t; e._antes = e.especial; });
            const vivas = J.vivas();
            if (s.nova < 1) { if (entradas.some(e => e.especial) && t - s.avisoNova > 1500 && fx) { s.avisoNova = t; fx.texto(J.W / 2, J.H * 0.45, `Nova al ${Math.floor(s.nova * 100)}%`, { tam: 12, color: '#ffbf7a' }); } return false; }
            const listos = vivas.length === 2 ? Math.abs(s.especialT[0] - s.especialT[1]) < 450 && t - Math.max(...s.especialT) < 60 : vivas.length === 1 && t - s.especialT[vivas[0].j] < 60;
            if (!listos) {
                if (vivas.length === 2 && entradas.some(e => e.especial) && t - s.avisoNova > 1200 && fx) { s.avisoNova = t; fx.texto(J.W / 2, J.H * 0.45, '¡Los dos a la vez! ★', { tam: 12, color: '#ffbf7a' }); }
                return false;
            }
            s.nova = 0; s.novaT = t; s.especialT = [0, 0]; s.rayoT = t; s.rayoTipo = 'nova';
            if (fx) { fx.flash('rgba(255,250,235,0.95)', 420); fx.temblor(12, 700); fx.texto(J.W / 2, J.H / 2, '¡BOMBA NOVA!', { tam: 26, color: '#ffd23a', vida: 1600 }); vivas.forEach(m => fx.onda(m.x, m.y, { radio: Math.max(J.W, J.H), vida: 900, color: 'rgba(255,230,160,0.9)', ancho: 6 })); }
            window.MVAudio && MVAudio.sfx('nova');
            return true;
        };
        J.actualizarComun = (dt) => {
            const t = ahora();
            J.t += dt;
            for (const n of J.naves) { n.cdFuego = Math.max(0, n.cdFuego - dt * 16.67); n.cdDash = Math.max(0, n.cdDash - dt * 16.67); }
            // Disparos
            for (const b of J.balas) { b.x += b.vx * dt; b.y += b.vy * dt; if (J.envolver) { if (b.x < 0) b.x += J.W; if (b.x > J.W) b.x -= J.W; if (b.y < 0) b.y += J.H; if (b.y > J.H) b.y -= J.H; } }
            J.balas = J.balas.filter(b => t - b.nace < b.vida && b.x > -40 && b.x < J.W + 40 && b.y > -40 && b.y < J.H + 40 && !b.muerta);
            // Power-ups: flotan, los atrae la nave cercana y se juntan al tocarlos
            for (const it of J.items) {
                it.x += it.vx * dt; it.y += it.vy * dt;
                for (const n of J.vivas()) {
                    const d = Math.hypot(n.x - it.x, n.y - it.y);
                    if (d < 70) { it.x += (n.x - it.x) * 0.06 * dt; it.y += (n.y - it.y) * 0.06 * dt; }
                    if (d < n.r + 10) { it.tomado = true; J.recoger(it, n); break; }
                }
            }
            J.items = J.items.filter(it => !it.tomado && t - it.nace < 12000 && it.y < J.H + 30 && it.y > -60 && it.x > -60 && it.x < J.W + 60);
            // Alerta de poca vida (una vez cada vez que alguna nave queda con 1)
            const poca = J.vivas().some(n => n.vidas === 1);
            if (poca && !J.alertaVida && window.MVAudio) MVAudio.sfx('alerta');
            J.alertaVida = poca;
        };
        // Partículas del propulsor (más largas cuanto más empuja la nave)
        J.propulsor = (n, ang, fuerza) => {
            if (!fx || n.muerta || fuerza < 0.08) return;
            const atras = ang + Math.PI;
            fx.particulas({ x: n.x + Math.cos(atras) * n.r, y: n.y + Math.sin(atras) * n.r, n: fuerza > 0.6 ? 2 : 1, color: n.col.fuego, vel: 1 + fuerza * 2.5, vida: 220 + fuerza * 260, grav: 0, roce: 0.94, tam: 1.6 + fuerza * 1.6, dir: atras, abanico: 0.35, vx: n.vx * 0.4, vy: n.vy * 0.4 });
        };
        J.dibujarNave = (c, n, ang) => {
            if (n.muerta) return;
            const t = ahora();
            if (n.inv > t && Math.floor(t / 90) % 2) return;
            const retro = Math.max(0, 1 - (t - n.retro) / 110) * 3;
            const dash = n.dashHasta > t;
            c.save(); c.translate(n.x - Math.cos(ang) * retro, n.y - Math.sin(ang) * retro); c.rotate(ang + Math.PI / 2);
            // Llama del propulsor
            const llama = 6 + n.empuje * 12 + Math.sin(t / 30) * 2;
            const gf = c.createLinearGradient(0, 8, 0, 8 + llama); gf.addColorStop(0, n.col.fuego[0]); gf.addColorStop(0.5, n.col.fuego[1]); gf.addColorStop(1, 'rgba(0,0,0,0)');
            c.fillStyle = gf; c.beginPath(); c.moveTo(-4, 8); c.lineTo(0, 8 + llama); c.lineTo(4, 8); c.fill();
            // Halo neón
            c.globalCompositeOperation = 'lighter';
            const halo = c.createRadialGradient(0, 0, 2, 0, 0, 22); halo.addColorStop(0, n.col.base + '66'); halo.addColorStop(1, n.col.base + '00');
            c.fillStyle = halo; c.beginPath(); c.arc(0, 0, 22, 0, Math.PI * 2); c.fill();
            c.globalCompositeOperation = 'source-over';
            // Casco: flecha con alas
            const gc = c.createLinearGradient(0, -12, 0, 10); gc.addColorStop(0, n.col.claro); gc.addColorStop(1, n.col.oscuro);
            c.fillStyle = gc; c.beginPath(); c.moveTo(0, -13); c.lineTo(5, -2); c.lineTo(11, 7); c.lineTo(4, 5); c.lineTo(0, 9); c.lineTo(-4, 5); c.lineTo(-11, 7); c.lineTo(-5, -2); c.closePath(); c.fill();
            c.strokeStyle = n.col.base; c.lineWidth = 1.2; c.stroke();
            c.fillStyle = '#0b1030'; c.beginPath(); c.ellipse(0, -3, 2.4, 4, 0, 0, Math.PI * 2); c.fill();
            c.fillStyle = 'rgba(255,255,255,0.8)'; c.fillRect(-0.8, -6, 1.2, 2.2);
            c.restore();
            if (dash) { c.strokeStyle = n.col.base; c.globalAlpha = 0.5; c.lineWidth = 2; c.beginPath(); c.arc(n.x, n.y, n.r + 6, 0, Math.PI * 2); c.stroke(); c.globalAlpha = 1; }
            // Número del jugador
            c.fillStyle = n.col.claro; c.font = 'bold 8px sans-serif'; c.textAlign = 'center'; c.fillText('J' + (n.j + 1), n.x, n.y + n.r + 14); c.textAlign = 'left';
        };
        J.dibujarComun = (c) => {
            const t = ahora(), s = J.sin;
            // Disparos: núcleo blanco con halo del color de cada uno
            c.globalCompositeOperation = 'lighter';
            for (const b of J.balas) {
                const col = b.col || COLORES[b.j] ? (b.col || COLORES[b.j].base) : '#fff';
                c.strokeStyle = col; c.lineWidth = 3; c.globalAlpha = 0.6; c.beginPath(); c.moveTo(b.x, b.y); c.lineTo(b.x - b.vx * 1.6, b.y - b.vy * 1.6); c.stroke();
                c.strokeStyle = '#fff'; c.lineWidth = 1.2; c.globalAlpha = 1; c.beginPath(); c.moveTo(b.x, b.y); c.lineTo(b.x - b.vx * 0.9, b.y - b.vy * 0.9); c.stroke();
            }
            c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
            // Power-ups: cápsula hexagonal que gira y late
            for (const it of J.items) {
                const tp = TIPOS[it.tipo], late = 1 + Math.sin(t / 160) * 0.1, ang = t / 600;
                c.save(); c.translate(it.x, it.y); c.scale(late, late);
                c.globalCompositeOperation = 'lighter';
                const g = c.createRadialGradient(0, 0, 2, 0, 0, 18); g.addColorStop(0, tp.col + 'aa'); g.addColorStop(1, tp.col + '00'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, 18, 0, Math.PI * 2); c.fill();
                c.globalCompositeOperation = 'source-over';
                c.rotate(ang); c.strokeStyle = tp.col; c.lineWidth = 2; c.beginPath(); for (let k = 0; k < 6; k++) c.lineTo(Math.cos(k * Math.PI / 3) * 9, Math.sin(k * Math.PI / 3) * 9); c.closePath(); c.stroke();
                c.rotate(-ang); c.fillStyle = '#fff'; c.font = 'bold 9px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(tp.icono, 0, 0.5);
                c.restore();
            }
            c.textBaseline = 'alphabetic'; c.textAlign = 'left';
            const vivas = J.vivas();
            // Escudo Vinculado: una burbuja en cada nave y un hilo de energía entre las dos
            if (s.escudo > 0) for (const n of vivas) {
                c.strokeStyle = `rgba(127,178,255,${0.4 + Math.sin(t / 200) * 0.15})`; c.lineWidth = 1.5; c.beginPath();
                for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3 + t / 900; c.lineTo(n.x + Math.cos(a) * (n.r + 9), n.y + Math.sin(a) * (n.r + 9)); }
                c.closePath(); c.stroke();
            }
            if (s.escudo > 0 && vivas.length === 2) { c.strokeStyle = 'rgba(127,178,255,0.18)'; c.lineWidth = 1; c.setLineDash([3, 5]); c.beginPath(); c.moveTo(vivas[0].x, vivas[0].y); c.lineTo(vivas[1].x, vivas[1].y); c.stroke(); c.setLineDash([]); }
            // Rayo de sinergia (al juntar un power-up): eléctrico, zigzag que cambia cada cuadro
            const k = (t - s.rayoT) / 450;
            if (k < 1 && vivas.length === 2) {
                const [a, b] = vivas, col = s.rayoTipo && TIPOS[s.rayoTipo] ? TIPOS[s.rayoTipo].col : '#fff';
                c.globalCompositeOperation = 'lighter';
                for (const [ancho, alfa, colr] of [[6, 0.25, col], [2.5, 0.8, col], [1, 1, '#fff']]) {
                    c.strokeStyle = colr; c.globalAlpha = alfa * (1 - k); c.lineWidth = ancho; c.beginPath(); c.moveTo(a.x, a.y);
                    const pasos = 9, nx = -(b.y - a.y), ny = b.x - a.x, l = Math.hypot(nx, ny) || 1;
                    for (let i = 1; i < pasos; i++) { const f = i / pasos, off = (Math.random() - 0.5) * 18 * Math.sin(f * Math.PI); c.lineTo(a.x + (b.x - a.x) * f + nx / l * off, a.y + (b.y - a.y) * f + ny / l * off); }
                    c.lineTo(b.x, b.y); c.stroke();
                }
                c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
            }
        };
        // HUD común: vidas, puntos, power-ups activos y la barra de la Nova
        J.dibujarHud = (c, extra) => {
            const t = ahora(), s = J.sin;
            c.fillStyle = 'rgba(5,4,20,0.55)'; c.fillRect(0, 0, J.W, 22);
            J.naves.forEach((n, j) => {
                const x = j === 0 ? 8 : J.W - 8; c.textAlign = j === 0 ? 'left' : 'right';
                c.fillStyle = n.col.base; c.font = 'bold 10px sans-serif';
                c.fillText(`J${j + 1} ${n.muerta ? '✖' : '♥'.repeat(Math.max(0, n.vidas))}  ${n.puntos}`, x, 15);
            });
            c.textAlign = 'center'; c.fillStyle = '#fff'; c.font = 'bold 11px sans-serif';
            c.fillText(`Pareja: ${J.puntosPareja()}${extra ? '  ·  ' + extra : ''}`, J.W / 2, 15);
            // Barra de la Bomba Nova (abajo al centro)
            const bw = Math.min(160, J.W * 0.35), bx = J.W / 2 - bw / 2, by = J.H - 12;
            c.fillStyle = 'rgba(255,255,255,0.12)'; c.fillRect(bx, by, bw, 5);
            const llena = s.nova >= 1;
            c.fillStyle = llena ? (Math.floor(t / 200) % 2 ? '#ffd23a' : '#ff9f43') : '#ff9f43'; c.fillRect(bx, by, bw * s.nova, 5);
            c.font = '8px sans-serif'; c.fillStyle = llena ? '#ffd23a' : 'rgba(255,255,255,0.6)';
            c.fillText(llena ? '★ BOMBA NOVA LISTA: ¡los dos a la vez! ★' : 'Bomba Nova', J.W / 2, by - 3);
            // Power-ups activos
            const act = [];
            if (s.gemelos > t) act.push(['II', '#5affb4', (s.gemelos - t) / 1000]);
            if (s.rapido > t) act.push(['»', '#ffd23a', (s.rapido - t) / 1000]);
            if (s.escudo > 0) act.push(['⬡×' + s.escudo, '#7fb2ff', null]);
            act.forEach(([ic, col, seg], i) => { c.fillStyle = col; c.font = 'bold 9px sans-serif'; c.fillText(ic + (seg != null ? ' ' + Math.ceil(seg) + 's' : ''), J.W / 2 + (i - (act.length - 1) / 2) * 46, 34); });
            // Viñeta roja si alguna nave está con la última vida
            if (J.alertaVida) { const a = 0.18 + Math.sin(t / 180) * 0.1; const g = c.createRadialGradient(J.W / 2, J.H / 2, Math.min(J.W, J.H) * 0.35, J.W / 2, J.H / 2, Math.max(J.W, J.H) * 0.75); g.addColorStop(0, 'rgba(255,0,60,0)'); g.addColorStop(1, `rgba(255,0,60,${a})`); c.fillStyle = g; c.fillRect(0, 0, J.W, J.H); }
            c.textAlign = 'left';
        };
        return J;
    }
    window.MVNaves = { crearJuego, crearNave, COLORES, TIPOS };
})();
