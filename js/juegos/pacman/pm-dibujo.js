// ============================================================
// pm-dibujo.js — Renderer del Pac-Neón de a Dos (canvas).
//
//   const r = PMDibujo.crear(canvas);
//   r.medir()            → ajusta el lienzo al lugar disponible sin deformar el laberinto
//   r.dibujar(escena)    → un cuadro
//
// El laberinto con sus bordes de neón se pinta UNA vez en un lienzo aparte
// (con resplandor) y en cada cuadro sólo se le dibuja encima lo que se mueve:
// así anda fluido hasta en celus de gama media.
// ============================================================
(function () {
    const T = 16, HUD = 28;
    function crear(canvas) {
        const c = canvas.getContext('2d');
        let fondo = null, claveFondo = '', dpr = 1, W = 0, H = 0;
        function medir() {
            const host = canvas.parentElement;
            const ancho = Math.max(200, (host && host.clientWidth) || 340);
            const arriba = canvas.getBoundingClientRect().top + (document.body.classList.contains('encuadre') ? 0 : window.scrollY);
            const libre = window.innerHeight - Math.max(0, arriba - window.scrollY) - 70;
            const proporcion = H / W || 1;
            let cssW = Math.min(ancho, 520), cssH = cssW * proporcion;
            if (cssH > libre && libre > 220) { cssH = libre; cssW = cssH / proporcion; }
            canvas.style.width = Math.round(cssW) + 'px'; canvas.style.height = Math.round(cssH) + 'px';
            dpr = Math.min(2, window.devicePixelRatio || 1);
            canvas.width = Math.round(cssW * dpr); canvas.height = Math.round(cssH * dpr);
            claveFondo = '';
        }
        // Bordes de luz: una línea por cada lado de pared que da a un pasillo, en tres pasadas (halo, medio, núcleo).
        function armarFondo(lab, escala) {
            const f = document.createElement('canvas');
            f.width = Math.round(lab.W * T * escala); f.height = Math.round(lab.H * T * escala);
            const g = f.getContext('2d'); g.scale(escala, escala);
            g.fillStyle = '#05030f'; g.fillRect(0, 0, lab.W * T, lab.H * T);
            // grilla muy tenue
            g.strokeStyle = 'rgba(90,80,200,0.06)'; g.lineWidth = 1;
            for (let x = 0; x <= lab.W; x++) { g.beginPath(); g.moveTo(x * T, 0); g.lineTo(x * T, lab.H * T); g.stroke(); }
            for (let y = 0; y <= lab.H; y++) { g.beginPath(); g.moveTo(0, y * T); g.lineTo(lab.W * T, y * T); g.stroke(); }
            const pared = (x, y) => y < 0 || y >= lab.H || x < 0 || x >= lab.W ? (y === lab.tunel ? false : true) : lab.m[y][x] === 0;
            const segmentos = [];
            const ins = T * 0.32;
            for (let y = 0; y < lab.H; y++) for (let x = 0; x < lab.W; x++) {
                if (!pared(x, y)) continue;
                const x0 = x * T, y0 = y * T;
                if (!pared(x, y - 1) && lab.m[y - 1] && lab.m[y - 1][x] !== 3) segmentos.push([x0, y0 + ins, x0 + T, y0 + ins]);
                if (!pared(x, y + 1)) segmentos.push([x0, y0 + T - ins, x0 + T, y0 + T - ins]);
                if (!pared(x - 1, y)) segmentos.push([x0 + ins, y0, x0 + ins, y0 + T]);
                if (!pared(x + 1, y)) segmentos.push([x0 + T - ins, y0, x0 + T - ins, y0 + T]);
            }
            // Relleno oscuro de las paredes para que se lean como bloques
            g.fillStyle = 'rgba(30,20,90,0.55)';
            for (let y = 0; y < lab.H; y++) for (let x = 0; x < lab.W; x++) if (pared(x, y)) g.fillRect(x * T + 3, y * T + 3, T - 6, T - 6);
            g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
            for (const [ancho, color] of [[7, 'rgba(70,90,255,0.10)'], [4, 'rgba(90,120,255,0.28)'], [1.6, 'rgba(170,200,255,0.95)']]) {
                g.strokeStyle = color; g.lineWidth = ancho; g.beginPath();
                segmentos.forEach(([a, b, cc, d]) => { g.moveTo(a, b); g.lineTo(cc, d); });
                g.stroke();
            }
            // Puerta de la casa
            const [px, py] = lab.casa.puerta;
            g.strokeStyle = 'rgba(255,120,200,0.9)'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(px * T + 1, py * T + T / 2); g.lineTo(px * T + T - 1, py * T + T / 2); g.stroke();
            g.globalCompositeOperation = 'source-over';
            return f;
        }
        function pac(p, t) {
            const x = (p.x + 0.5) * T, y = (p.y + 0.5) * T + HUD, r = T * 0.47;
            const ang = Math.atan2(p.dir ? p.dir[1] : 0, p.dir ? p.dir[0] : 1) || 0;
            const boca = p.quieto ? 0.08 : 0.08 + Math.abs(Math.sin(t / 70)) * 0.32;
            c.save(); c.globalCompositeOperation = 'lighter';
            const halo = c.createRadialGradient(x, y, 2, x, y, r * 2.6); halo.addColorStop(0, p.color + (p.cautivo ? '33' : '88')); halo.addColorStop(1, p.color + '00');
            c.fillStyle = halo; c.beginPath(); c.arc(x, y, r * 2.6, 0, Math.PI * 2); c.fill();
            c.restore();
            if (p.inv && Math.floor(t / 90) % 2) return;
            c.save(); c.translate(x, y); c.rotate(ang);
            if (p.cautivo) c.globalAlpha = 0.45;
            const g = c.createRadialGradient(-r * 0.3, -r * 0.35, 1, 0, 0, r); g.addColorStop(0, '#ffffff'); g.addColorStop(0.35, p.color); g.addColorStop(1, p.oscuro);
            c.fillStyle = g; c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, r, boca * Math.PI, (2 - boca) * Math.PI); c.closePath(); c.fill();
            c.fillStyle = '#111'; c.beginPath(); c.arc(r * 0.15, -r * 0.5, r * 0.13, 0, Math.PI * 2); c.fill();
            c.restore();
            if (p.cautivo) {
                // Jaula que late + corazoncito
                const lat = 1 + Math.sin(t / 120) * 0.12;
                c.strokeStyle = 'rgba(255,255,255,0.8)'; c.lineWidth = 1.2;
                c.beginPath(); c.arc(x, y, r * 1.25 * lat, 0, Math.PI * 2); c.stroke();
                for (let k = -1; k <= 1; k++) { c.beginPath(); c.moveTo(x + k * r * 0.6, y - r * 1.15); c.lineTo(x + k * r * 0.6, y + r * 1.15); c.stroke(); }
                c.font = `${Math.round(9 * lat)}px sans-serif`; c.textAlign = 'center'; c.fillText('💔', x, y - r * 1.6);
            }
            if (p.dash) { c.strokeStyle = p.color; c.globalAlpha = 0.6; c.lineWidth = 2; c.beginPath(); c.arc(x, y, r * 1.35, 0, Math.PI * 2); c.stroke(); c.globalAlpha = 1; }
        }
        function fantasma(f, t, power) {
            const x = (f.x + 0.5) * T, y = (f.y + 0.5 + (f.yv || 0)) * T + HUD, r = T * 0.46;
            const asustado = f.estado === 'asustado', ojos = f.estado === 'ojos';
            const parpadea = asustado && power < 2000 && Math.floor(t / 160) % 2;
            const col = asustado ? (parpadea ? '#ffffff' : '#3a5bff') : f.color;
            if (!ojos) {
                c.save(); c.globalCompositeOperation = 'lighter';
                const halo = c.createRadialGradient(x, y, 2, x, y, r * 2.4); halo.addColorStop(0, col + '77'); halo.addColorStop(1, col + '00');
                c.fillStyle = halo; c.beginPath(); c.arc(x, y, r * 2.4, 0, Math.PI * 2); c.fill();
                c.restore();
                c.fillStyle = col; c.beginPath(); c.arc(x, y - r * 0.15, r, Math.PI, 0);
                const ola = Math.floor(t / 130) % 2;
                c.lineTo(x + r, y + r * 0.85);
                for (let k = 0; k < 4; k++) { const xa = x + r - (k + 0.5) * (r / 2), xb = x + r - (k + 1) * (r / 2); c.quadraticCurveTo(xa, y + r * (ola ^ (k % 2) ? 0.45 : 1.15), xb, y + r * 0.85); }
                c.closePath(); c.fill();
            }
            if (asustado) {
                c.fillStyle = parpadea ? '#ff3a5a' : '#ffe0f0';
                c.fillRect(x - r * 0.45, y - r * 0.35, r * 0.22, r * 0.25); c.fillRect(x + r * 0.23, y - r * 0.35, r * 0.22, r * 0.25);
                c.strokeStyle = c.fillStyle; c.lineWidth = 1; c.beginPath();
                for (let k = 0; k <= 4; k++) c.lineTo(x - r * 0.55 + k * r * 0.275, y + r * 0.32 + (k % 2 ? -1 : 1) * r * 0.1);
                c.stroke();
                return;
            }
            const dx = f.dir ? f.dir[0] : 0, dy = f.dir ? f.dir[1] : 0;
            for (const s of [-1, 1]) {
                c.fillStyle = '#fff'; c.beginPath(); c.ellipse(x + s * r * 0.36, y - r * 0.25, r * 0.26, r * 0.32, 0, 0, Math.PI * 2); c.fill();
                c.fillStyle = '#1a2cff'; c.beginPath(); c.arc(x + s * r * 0.36 + dx * r * 0.12, y - r * 0.25 + dy * r * 0.14, r * 0.13, 0, Math.PI * 2); c.fill();
            }
        }
        function dibujar(e) {
            const lab = e.lab;
            if (!lab) return;
            if (W !== lab.W * T || H !== lab.H * T + HUD) { W = lab.W * T; H = lab.H * T + HUD; medir(); }
            const escala = canvas.width / W, t = performance.now();
            c.setTransform(1, 0, 0, 1, 0, 0);
            c.fillStyle = '#05030f'; c.fillRect(0, 0, canvas.width, canvas.height);
            c.setTransform(escala, 0, 0, escala, 0, 0);
            const fx = e.fx;
            fx && fx.antes(c);
            if (claveFondo !== lab.semilla + ':' + escala) { fondo = armarFondo(lab, escala); claveFondo = lab.semilla + ':' + escala; }
            c.drawImage(fondo, 0, HUD, lab.W * T, lab.H * T);
            // Puntos y píldoras
            c.fillStyle = '#ffe9b8';
            lab.puntos.forEach(k => { const x = k % lab.W, y = (k / lab.W) | 0; c.fillRect(x * T + T / 2 - 1.3, y * T + T / 2 - 1.3 + HUD, 2.6, 2.6); });
            const pul = 0.75 + Math.sin(t / 180) * 0.25;
            lab.pildoras.forEach(k => {
                const x = (k % lab.W + 0.5) * T, y = (((k / lab.W) | 0) + 0.5) * T + HUD;
                c.save(); c.globalCompositeOperation = 'lighter';
                const g = c.createRadialGradient(x, y, 1, x, y, T * 0.9); g.addColorStop(0, `rgba(255,240,180,${0.8 * pul})`); g.addColorStop(1, 'rgba(255,200,120,0)');
                c.fillStyle = g; c.beginPath(); c.arc(x, y, T * 0.9, 0, Math.PI * 2); c.fill(); c.restore();
                c.fillStyle = '#fff6d8'; c.beginPath(); c.arc(x, y, T * 0.3 * pul, 0, Math.PI * 2); c.fill();
            });
            // Núcleo de rescate: gema que late con el tiempo que queda alrededor
            if (e.core) {
                const x = (e.core.x + 0.5) * T, y = (e.core.y + 0.5) * T + HUD, k = Math.max(0, e.core.resto / 10000), lat = 1 + Math.sin(t / 90) * 0.15;
                c.save(); c.globalCompositeOperation = 'lighter';
                const g = c.createRadialGradient(x, y, 1, x, y, T * 1.6); g.addColorStop(0, 'rgba(120,255,200,0.75)'); g.addColorStop(1, 'rgba(120,255,200,0)');
                c.fillStyle = g; c.beginPath(); c.arc(x, y, T * 1.6, 0, Math.PI * 2); c.fill(); c.restore();
                c.save(); c.translate(x, y); c.rotate(t / 400); c.scale(lat, lat);
                c.fillStyle = '#7dffc8'; c.beginPath(); c.moveTo(0, -T * 0.42); c.lineTo(T * 0.32, 0); c.lineTo(0, T * 0.42); c.lineTo(-T * 0.32, 0); c.closePath(); c.fill();
                c.fillStyle = 'rgba(255,255,255,0.8)'; c.beginPath(); c.moveTo(0, -T * 0.42); c.lineTo(T * 0.32, 0); c.lineTo(0, 0); c.closePath(); c.fill();
                c.restore();
                c.strokeStyle = k < 0.3 ? '#ff6b6b' : '#7dffc8'; c.lineWidth = 2;
                c.beginPath(); c.arc(x, y, T * 0.75, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * k); c.stroke();
                // Flecha desde el Pac libre hacia el núcleo (si está lejos)
                const libreP = e.pacs.find(p => !p.cautivo && p.mio);
                if (libreP) {
                    const px = (libreP.x + 0.5) * T, py = (libreP.y + 0.5) * T + HUD, d = Math.hypot(x - px, y - py);
                    if (d > T * 3) { const a = Math.atan2(y - py, x - px); c.save(); c.translate(px + Math.cos(a) * T * 1.3, py + Math.sin(a) * T * 1.3); c.rotate(a); c.fillStyle = 'rgba(125,255,200,0.85)'; c.beginPath(); c.moveTo(6, 0); c.lineTo(-3, -4); c.lineTo(-3, 4); c.closePath(); c.fill(); c.restore(); }
                }
            }
            // Hilo de energía entre los dos durante la píldora
            if (e.power > 0 && e.pacs.length === 2) {
                const [a, b] = e.pacs.map(p => [(p.x + 0.5) * T, (p.y + 0.5) * T + HUD]);
                const mx = (a[0] + b[0]) / 2 + Math.sin(t / 150) * 10, my = (a[1] + b[1]) / 2 + Math.cos(t / 170) * 10;
                c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
                for (const [ancho, alfa] of [[7, 0.12], [3.5, 0.35], [1.4, 0.95]]) {
                    const g = c.createLinearGradient(a[0], a[1], b[0], b[1]); g.addColorStop(0, `rgba(90,209,255,${alfa})`); g.addColorStop(1, `rgba(255,107,213,${alfa})`);
                    c.strokeStyle = g; c.lineWidth = ancho; c.beginPath(); c.moveTo(a[0], a[1]); c.quadraticCurveTo(mx, my, b[0], b[1]); c.stroke();
                }
                c.restore();
            }
            e.fantasmas.forEach(f => fantasma(f, t, e.power));
            e.pacs.forEach(p => pac(p, t));
            if (fx) { c.save(); c.translate(0, HUD); fx.dibujar(c); c.restore(); }
            fx && fx.despues(c);
            // HUD
            c.fillStyle = 'rgba(5,3,15,0.85)'; c.fillRect(0, 0, W, HUD);
            c.textBaseline = 'middle'; c.font = 'bold 11px monospace';
            c.fillStyle = '#ffe9b8'; c.textAlign = 'left'; c.fillText(String(e.hud.puntos).padStart(6, '0'), 6, HUD / 2);
            c.textAlign = 'center'; c.fillStyle = '#c8d0ff'; c.fillText(`NIVEL ${e.hud.nivel}`, W / 2, HUD / 2);
            c.textAlign = 'right'; c.fillStyle = '#ff6b9a'; c.fillText('♥'.repeat(Math.max(0, e.hud.vidas)), W - 16, HUD / 2);
            if (e.power > 0) { c.fillStyle = 'rgba(255,240,180,0.85)'; c.fillRect(0, HUD - 2, W * Math.min(1, e.power / e.powerTotal), 2); }
            // Carteles (cuenta, rescate, nivel)
            if (e.cartel) {
                const k = e.cartel.k == null ? 1 : e.cartel.k, esc = window.FxVivo ? FxVivo.rebote(Math.min(1, k * 2.5)) : 1;
                c.fillStyle = 'rgba(5,3,15,0.5)'; c.fillRect(0, HUD + lab.H * T * 0.42 - 22, W, 50);
                c.save(); c.translate(W / 2, HUD + lab.H * T * 0.42);
                c.font = 'bold 20px sans-serif';
                const cabe = Math.min(1, (W - 24) / Math.max(1, c.measureText(e.cartel.texto).width)); // que entre a lo ancho
                c.scale(esc * cabe, esc * cabe); c.lineWidth = 4; c.strokeStyle = '#05030f'; c.strokeText(e.cartel.texto, 0, 0); c.fillStyle = e.cartel.color || '#fff'; c.fillText(e.cartel.texto, 0, 0);
                c.restore();
                if (e.cartel.sub) { c.font = '10px sans-serif'; c.fillStyle = '#c8d0ff'; c.textAlign = 'center'; c.fillText(e.cartel.sub, W / 2, HUD + lab.H * T * 0.42 + 18); }
            }
            c.textAlign = 'left'; c.textBaseline = 'alphabetic';
        }
        return { medir, dibujar, get escala() { return canvas.width / (W || 1); }, T, HUD };
    }
    window.PMDibujo = { crear, T, HUD };
})();
