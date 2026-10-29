// ============================================================
// mv-fondo.js — el espacio de fondo del Multiverso Arcade: tres capas
// de estrellas en parallax (las lejanas se mueven menos), nebulosas de
// colores dibujadas una vez en un lienzo aparte, estrellas fugaces y un
// agujero negro con disco de acreción que gira.
//
//   const fondo = MVFondo.crear(semilla);
//   fondo.dibujar(ctx, W, H, camX, camY, t)   // cam: cuánto "avanzó" la nave
// ============================================================
(function () {
    function rng(s) { let a = s >>> 0; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
    const PALETAS = [['#5b2a86', '#e0487a', '#2b4bb0'], ['#14506e', '#3fd0c9', '#7b3fbf'], ['#6e1f3f', '#ff8a3a', '#3a2b8a']];

    function crear(semilla = 7) {
        const r = rng(semilla);
        const capas = [0.12, 0.35, 0.8].map((vel, k) => ({ vel, estrellas: Array.from({ length: [90, 55, 28][k] }, () => ({ x: r(), y: r(), tam: [0.6, 1.1, 1.8][k] * (0.6 + r() * 0.7), brillo: 0.4 + r() * 0.6, fase: r() * 6.28, col: r() < 0.15 ? '#ffd9a8' : r() < 0.3 ? '#a8d0ff' : '#ffffff' })) }));
        const paleta = PALETAS[Math.floor(r() * PALETAS.length)];
        const hoyo = { x: 0.18 + r() * 0.64, y: 0.2 + r() * 0.5, r: 18 + r() * 14 };
        let nebulosa = null, tamNeb = '';
        const fugaces = [];
        function armarNebulosa(W, H) {
            const c = document.createElement('canvas'); c.width = Math.ceil(W / 2); c.height = Math.ceil(H / 2);
            const x = c.getContext('2d'), rr = rng(semilla * 31 + 5);
            for (let i = 0; i < 9; i++) {
                const cx = rr() * c.width, cy = rr() * c.height, rad = (0.25 + rr() * 0.45) * Math.max(c.width, c.height);
                const g = x.createRadialGradient(cx, cy, 0, cx, cy, rad), col = paleta[i % 3];
                g.addColorStop(0, col + '55'); g.addColorStop(0.5, col + '22'); g.addColorStop(1, col + '00');
                x.fillStyle = g; x.fillRect(0, 0, c.width, c.height);
            }
            // Polvo oscuro que corta la nebulosa
            for (let i = 0; i < 5; i++) { const cx = rr() * c.width, cy = rr() * c.height, g = x.createRadialGradient(cx, cy, 0, cx, cy, 60 + rr() * 80); g.addColorStop(0, 'rgba(5,4,14,0.5)'); g.addColorStop(1, 'rgba(5,4,14,0)'); x.fillStyle = g; x.fillRect(0, 0, c.width, c.height); }
            nebulosa = c; tamNeb = W + 'x' + H;
        }
        function dibujar(c, W, H, camX = 0, camY = 0, t = performance.now() / 1000) {
            const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#05030f'); g.addColorStop(1, '#0d0820');
            c.fillStyle = g; c.fillRect(0, 0, W, H);
            if (tamNeb !== W + 'x' + H) armarNebulosa(W, H);
            // La nebulosa se mueve muy poco (está lejísimos)
            const nx = ((-camX * 0.05) % W + W) % W, ny = ((-camY * 0.05) % H + H) % H;
            c.globalAlpha = 0.9;
            for (const dx of [nx - W, nx]) for (const dy of [ny - H, ny]) c.drawImage(nebulosa, dx, dy, W, H);
            c.globalAlpha = 1;
            // Agujero negro con disco de acreción que gira
            const hx = ((hoyo.x * W - camX * 0.08) % (W + 200) + W + 200) % (W + 200) - 100, hy = ((hoyo.y * H - camY * 0.08) % (H + 200) + H + 200) % (H + 200) - 100;
            c.save(); c.translate(hx, hy);
            const halo = c.createRadialGradient(0, 0, hoyo.r * 0.8, 0, 0, hoyo.r * 3.2); halo.addColorStop(0, 'rgba(255,170,90,0.35)'); halo.addColorStop(0.4, 'rgba(200,80,160,0.12)'); halo.addColorStop(1, 'rgba(0,0,0,0)');
            c.fillStyle = halo; c.beginPath(); c.arc(0, 0, hoyo.r * 3.2, 0, Math.PI * 2); c.fill();
            c.rotate(t * 0.25); c.scale(1, 0.38);
            for (let k = 0; k < 3; k++) { c.strokeStyle = ['rgba(255,200,120,0.55)', 'rgba(255,120,80,0.4)', 'rgba(180,90,255,0.3)'][k]; c.lineWidth = 3 - k * 0.6; c.beginPath(); c.arc(0, 0, hoyo.r * (1.5 + k * 0.45), 0, Math.PI * 2); c.stroke(); }
            c.restore();
            c.fillStyle = '#000'; c.beginPath(); c.arc(hx, hy, hoyo.r, 0, Math.PI * 2); c.fill();
            c.strokeStyle = 'rgba(255,220,170,0.7)'; c.lineWidth = 1; c.beginPath(); c.arc(hx, hy, hoyo.r + 1, 0, Math.PI * 2); c.stroke();
            // Estrellas en tres capas, titilando
            for (const capa of capas) for (const s of capa.estrellas) {
                const x = ((s.x * W - camX * capa.vel) % W + W) % W, y = ((s.y * H - camY * capa.vel) % H + H) % H;
                c.globalAlpha = s.brillo * (0.7 + Math.sin(t * 2 + s.fase) * 0.3);
                c.fillStyle = s.col; c.fillRect(x, y, s.tam, s.tam);
                // Las cercanas se estiran si vamos rápido
                if (capa.vel > 0.5 && Math.abs(camY) > 0) { const v = capa._v || 0; if (v > 2) c.fillRect(x, y - v * 2, s.tam * 0.6, v * 2); }
            }
            c.globalAlpha = 1;
            // Estrellas fugaces de vez en cuando
            if (Math.random() < 0.004) fugaces.push({ x: Math.random() * W, y: Math.random() * H * 0.5, vx: 6 + Math.random() * 4, vy: 2 + Math.random() * 2, vida: 1 });
            for (const f of fugaces) { f.x += f.vx; f.y += f.vy; f.vida -= 0.025; c.strokeStyle = `rgba(255,255,255,${f.vida})`; c.lineWidth = 1.2; c.beginPath(); c.moveTo(f.x, f.y); c.lineTo(f.x - f.vx * 5, f.y - f.vy * 5); c.stroke(); }
            for (let i = fugaces.length - 1; i >= 0; i--) if (fugaces[i].vida <= 0) fugaces.splice(i, 1);
        }
        // Velocidad de scroll (para estirar las estrellas cercanas en la Carrera Nebulosa)
        function velocidad(v) { capas[2]._v = v; }
        return { dibujar, velocidad };
    }
    window.MVFondo = { crear };
})();
