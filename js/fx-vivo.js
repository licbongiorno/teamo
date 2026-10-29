// ============================================================
// fx-vivo.js — efectos para los juegos en vivo dibujados en canvas:
// partículas (chispas, polvo, salpicaduras, confeti, explosiones,
// burbujas), textos que saltan ("¡GOL!", "+10"), ondas, destellos y
// temblor de pantalla. Todo en coordenadas de pantalla del lienzo.
//
//   const fx = FxVivo.crear();
//   fx.chispas(x, y, '#fff');  fx.texto(x, y, '¡GOL!', { tam: 20 });
//   fx.temblor(4, 300);  fx.flash('#fff', 120);  fx.onda(x, y);
//   // al dibujar:
//   fx.antes(ctx);   ... dibujar el mundo ...   fx.dibujar(ctx);  fx.despues(ctx);
//
// También: FxVivo.suave(t) (easing), FxVivo.rebote(t) (para que algo
// "salte" al aparecer) y FxVivo.cuadro() (un contador para animaciones).
// ============================================================
(function () {
    const azar = (a, b) => a + Math.random() * (b - a);
    const elegir = (l) => Array.isArray(l) ? l[Math.floor(Math.random() * l.length)] : l;
    const suave = (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    // Pasa de 0 a ~1.15 y vuelve a 1: para textos y carteles que aparecen.
    const rebote = (t) => { t = Math.max(0, Math.min(1, t)); const c = 1.70158 * 1.5; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };

    function crear(opciones = {}) {
        const max = opciones.max || 260;
        let parts = [], textos = [], ondas = [], temblorF = 0, temblorHasta = 0, flashCol = null, flashHasta = 0, flashDura = 1, ultimo = performance.now();
        const ahora = () => performance.now();

        function particulas(o) {
            const n = o.n || 10;
            for (let i = 0; i < n && parts.length < max; i++) {
                const ang = o.dir != null ? o.dir + azar(-(o.abanico || Math.PI), (o.abanico || Math.PI)) : azar(0, Math.PI * 2);
                const v = azar(o.vel ? o.vel * 0.4 : 0.5, o.vel || 2.5);
                const vida = azar((o.vida || 600) * 0.6, o.vida || 600);
                parts.push({
                    x: o.x + azar(-(o.r || 0), o.r || 0), y: o.y + azar(-(o.r || 0), o.r || 0),
                    vx: Math.cos(ang) * v + (o.vx || 0), vy: Math.sin(ang) * v + (o.vy || 0),
                    g: o.grav != null ? o.grav : 0.08, roce: o.roce != null ? o.roce : 0.98,
                    tam: azar((o.tam || 2.5) * 0.6, o.tam || 2.5), col: elegir(o.color || '#fff'),
                    forma: o.forma || 'circulo', nace: ahora(), vida, giro: azar(-0.3, 0.3), ang: azar(0, 6.28), crece: o.crece || 0
                });
            }
        }
        const api = {
            particulas,
            chispas: (x, y, color = ['#fff7c2', '#ffd23a', '#ffffff'], n = 12) => particulas({ x, y, n, color, vel: 3.2, vida: 380, grav: 0.04, tam: 2, forma: 'chispa' }),
            polvo: (x, y, color = 'rgba(230,220,200,0.7)', n = 6) => particulas({ x, y, n, color, vel: 0.9, vida: 520, grav: -0.01, tam: 3, dir: -Math.PI / 2, abanico: 1.3, crece: 0.025 }),
            salpicadura: (x, y, color = ['#bfe9ff', '#ffffff', '#7fd0f5'], n = 12, dir = -Math.PI / 2) => particulas({ x, y, n, color, vel: 2.6, vida: 560, grav: 0.13, tam: 2.2, dir, abanico: 0.9, forma: 'gota' }),
            burbujas: (x, y, n = 3) => particulas({ x, y, n, color: 'rgba(255,255,255,0.65)', vel: 0.5, vida: 900, grav: -0.02, tam: 2, forma: 'anillo', r: 4 }),
            confeti: (x, y, n = 40) => particulas({ x, y, n, color: ['#ff6b9a', '#ffd23a', '#4cd18a', '#5aa9ff', '#c78bff', '#ff9f43'], vel: 4.2, vida: 1500, grav: 0.07, tam: 3.2, forma: 'cuadro', dir: -Math.PI / 2, abanico: 1.2, roce: 0.97 }),
            explosion: (x, y, n = 26) => {
                particulas({ x, y, n, color: ['#ffd23a', '#ff9f43', '#ff5a3a', '#fff3b0'], vel: 3.6, vida: 520, grav: 0.02, tam: 3, roce: 0.93 });
                particulas({ x, y, n: 10, color: 'rgba(80,70,70,0.55)', vel: 1.2, vida: 900, grav: -0.015, tam: 5, crece: 0.05 });
                api.onda(x, y, { color: 'rgba(255,220,120,0.9)', radio: 26, vida: 320 });
                api.flash('rgba(255,240,200,0.5)', 90);
            },
            estrellitas: (x, y, n = 8, color = ['#ffd23a', '#fff']) => particulas({ x, y, n, color, vel: 1.8, vida: 800, grav: -0.01, tam: 3.4, forma: 'estrella' }),
            texto(x, y, txt, o = {}) { textos.push({ x, y, txt, col: o.color || '#fff', borde: o.borde || 'rgba(20,16,30,0.75)', tam: o.tam || 14, nace: ahora(), vida: o.vida || 900, sube: o.sube != null ? o.sube : 18, fuente: o.fuente || 'bold {t}px sans-serif' }); },
            onda(x, y, o = {}) { ondas.push({ x, y, col: o.color || 'rgba(255,255,255,0.8)', radio: o.radio || 18, nace: ahora(), vida: o.vida || 420, ancho: o.ancho || 2, achatar: o.achatar || 1 }); },
            temblor(f = 3, ms = 250) { temblorF = Math.max(temblorF, f); temblorHasta = Math.max(temblorHasta, ahora() + ms); },
            flash(col = 'rgba(255,255,255,0.6)', ms = 120) { flashCol = col; flashHasta = ahora() + ms; flashDura = ms; },
            hay: () => parts.length + textos.length + ondas.length,
            limpiar() { parts = []; textos = []; ondas = []; temblorHasta = 0; flashHasta = 0; },
            antes(c) {
                c.save();
                const t = ahora();
                if (t < temblorHasta) { const f = temblorF * (temblorHasta - t) / 300; c.translate(azar(-f, f), azar(-f, f)); } else temblorF = 0;
            },
            dibujar(c) {
                const t = ahora(), dt = Math.min(3, (t - ultimo) / 16.67); ultimo = t;
                for (const o of ondas) {
                    const k = (t - o.nace) / o.vida; if (k >= 1) continue;
                    c.globalAlpha = 1 - k; c.strokeStyle = o.col; c.lineWidth = o.ancho * (1 - k * 0.6);
                    c.beginPath(); c.ellipse(o.x, o.y, o.radio * suave(k) + 1, (o.radio * suave(k) + 1) * o.achatar, 0, 0, Math.PI * 2); c.stroke();
                }
                ondas = ondas.filter(o => t - o.nace < o.vida);
                for (const p of parts) {
                    p.vx *= Math.pow(p.roce, dt); p.vy = p.vy * Math.pow(p.roce, dt) + p.g * dt;
                    p.x += p.vx * dt; p.y += p.vy * dt; p.ang += p.giro * dt; p.tam += p.crece * dt;
                    const k = (t - p.nace) / p.vida; if (k >= 1) continue;
                    c.globalAlpha = Math.min(1, (1 - k) * 1.4);
                    c.fillStyle = p.col; c.strokeStyle = p.col;
                    if (p.forma === 'cuadro') { c.save(); c.translate(p.x, p.y); c.rotate(p.ang); c.fillRect(-p.tam / 2, -p.tam / 4, p.tam, p.tam / 2 * (0.4 + Math.abs(Math.sin(p.ang * 2)))); c.restore(); }
                    else if (p.forma === 'chispa') { c.lineWidth = p.tam * 0.6; c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x - p.vx * 2.2, p.y - p.vy * 2.2); c.stroke(); }
                    else if (p.forma === 'gota') { c.beginPath(); c.ellipse(p.x, p.y, p.tam * 0.7, p.tam, Math.atan2(p.vy, p.vx) + Math.PI / 2, 0, Math.PI * 2); c.fill(); }
                    else if (p.forma === 'anillo') { c.lineWidth = 0.8; c.beginPath(); c.arc(p.x, p.y, p.tam, 0, Math.PI * 2); c.stroke(); }
                    else if (p.forma === 'estrella') { c.save(); c.translate(p.x, p.y); c.rotate(p.ang); c.beginPath(); for (let i = 0; i < 10; i++) { const r = i % 2 ? p.tam * 0.45 : p.tam; c.lineTo(Math.cos(i * Math.PI / 5) * r, Math.sin(i * Math.PI / 5) * r); } c.closePath(); c.fill(); c.restore(); }
                    else { c.beginPath(); c.arc(p.x, p.y, Math.max(0.3, p.tam), 0, Math.PI * 2); c.fill(); }
                }
                parts = parts.filter(p => t - p.nace < p.vida);
                c.globalAlpha = 1;
                for (const o of textos) {
                    const k = (t - o.nace) / o.vida; if (k >= 1) continue;
                    const esc = rebote(Math.min(1, k * 4)) * (k > 0.8 ? 1 - (k - 0.8) * 2 : 1);
                    c.save(); c.translate(o.x, o.y - o.sube * suave(k)); c.scale(esc, esc);
                    c.globalAlpha = k > 0.75 ? (1 - k) * 4 : 1;
                    c.font = o.fuente.replace('{t}', o.tam); c.textAlign = 'center'; c.textBaseline = 'middle';
                    c.lineWidth = Math.max(2, o.tam / 5); c.strokeStyle = o.borde; c.strokeText(o.txt, 0, 0);
                    c.fillStyle = o.col; c.fillText(o.txt, 0, 0);
                    c.restore();
                }
                textos = textos.filter(o => t - o.nace < o.vida);
                c.globalAlpha = 1;
                if (flashCol && t < flashHasta) { c.globalAlpha = (flashHasta - t) / flashDura; c.fillStyle = flashCol; c.fillRect(-20, -20, c.canvas.width + 40, c.canvas.height + 40); c.globalAlpha = 1; }
            },
            despues(c) { c.restore(); }
        };
        return api;
    }
    // Un reloj de animación que no depende del juego (para ciclos de caminar, olas, etc.).
    const cuadro = () => performance.now() / 16.67;
    window.FxVivo = { crear, suave, rebote, cuadro, azar };
})();
