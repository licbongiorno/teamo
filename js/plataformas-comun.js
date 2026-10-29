// ============================================================
// plataformas-comun.js — física de plataformas reutilizable para los
// juegos en vivo de pantalla compartida (por ahora Fuego y Agua).
// Un cuerpo {x, y, vx, vy, suelo, dir} se mueve sobre una grilla de tiles
// (esSolido(x, y)), choca con cajas (rectángulos sólidos que se pueden
// empujar) y puede pararse sobre la cabeza del otro.
//
//   Plataformas.mover(cuerpo, dt, teclas, {
//       T, ancho, alto, esSolido(cx, cy), cajas: [{x, y, w, h}], otro: {x, y, vx} | null,
//       grav, salto, vel, caida, alEmpujar(caja, dx) → dx real que se movió
//   }) → { saltó, aterrizó, cabezazo: [cx, cy] | null }
// ============================================================
(function () {
    const def = { grav: 0.45, salto: 7.2, vel: 1.9, caida: 7 };
    const solape = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

    function mover(p, dt, k, o) {
        const c = { ...def, ...o }, T = c.T, W = c.ancho, H = c.alto, cajas = c.cajas || [];
        const res = { salto: false, aterrizo: false, cabezazo: null };
        const objetivo = (k.der ? 1 : 0) - (k.izq ? 1 : 0);
        if (objetivo) p.dir = objetivo;
        p.vx += (objetivo * c.vel - p.vx) * Math.min(1, (p.suelo ? 0.35 : 0.18) * dt);
        if (k.salto && !p.saltoPrevio && p.suelo) { p.vy = -c.salto; p.suelo = false; res.salto = true; }
        if (!k.salto && p.vy < -2.5) p.vy *= 0.6;
        p.saltoPrevio = k.salto;
        p.vy = Math.min(c.caida, p.vy + c.grav * dt);
        // Horizontal: tiles y cajas (que se empujan si se puede).
        let dx = p.vx * dt;
        p.x += dx;
        const y0 = Math.floor(p.y / T), y1 = Math.floor((p.y + H - 1) / T);
        const xc = Math.floor((dx > 0 ? p.x + W - 1 : p.x) / T);
        for (let y = y0; y <= y1; y++) if (c.esSolido(xc, y)) { p.x = dx > 0 ? xc * T - W : (xc + 1) * T; p.vx = 0; dx = 0; break; }
        for (const cj of cajas) {
            const yo = { x: p.x, y: p.y, w: W, h: H };
            if (!solape(yo, cj)) continue;
            const quiero = dx > 0 ? p.x + W - cj.x : p.x - (cj.x + cj.w);
            const movio = c.alEmpujar && p.suelo ? c.alEmpujar(cj, quiero) : 0;
            if (Math.abs(movio - quiero) > 0.01) {
                // La caja no se movió (o no del todo): me frena.
                p.x = dx > 0 ? cj.x - W : cj.x + cj.w;
                p.vx *= 0.3;
            }
        }
        // Vertical
        const yAntes = p.y;
        p.y += p.vy * dt;
        p.suelo = false;
        const x0 = Math.floor(p.x / T), x1 = Math.floor((p.x + W - 1) / T);
        if (p.vy > 0) {
            const yc = Math.floor((p.y + H) / T);
            for (let x = x0; x <= x1; x++) if (c.esSolido(x, yc)) { p.y = yc * T - H; p.vy = 0; p.suelo = true; break; }
            if (!p.suelo) for (const cj of cajas) {
                if (p.x + W > cj.x + 1 && p.x < cj.x + cj.w - 1 && yAntes + H <= cj.y + 3 && p.y + H >= cj.y) { p.y = cj.y - H; p.vy = 0; p.suelo = true; break; }
            }
            const ot = c.otro;
            if (!p.suelo && ot && p.x + W > ot.x + 1 && p.x < ot.x + W - 1 && yAntes + H <= ot.y + 3 && p.y + H >= ot.y) {
                p.y = ot.y - H; p.vy = 0; p.suelo = true; p.x += (ot.vx || 0) * dt * 0.8;
            }
            if (p.suelo) res.aterrizo = true;
        } else if (p.vy < 0) {
            const yc = Math.floor(p.y / T);
            for (let x = x0; x <= x1; x++) if (c.esSolido(x, yc)) { p.y = (yc + 1) * T; p.vy = 0; res.cabezazo = [x, yc]; break; }
            for (const cj of cajas) if (solape({ x: p.x, y: p.y, w: W, h: H }, cj)) { p.y = cj.y + cj.h; p.vy = 0; }
        }
        p.paso = (p.paso || 0) + Math.abs(p.vx) * dt;
        return res;
    }
    // Una caja cae sola si no tiene nada abajo (igual en los dos celus).
    // otras: las demás cajas (una caja puede quedar apoyada arriba de otra).
    function caerCaja(cj, dt, esSolido, T, otras) {
        const yAntes = cj.y;
        cj.vy = Math.min(6, (cj.vy || 0) + 0.45 * dt);
        cj.y += cj.vy * dt;
        const yc = Math.floor((cj.y + cj.h) / T), x0 = Math.floor((cj.x + 1) / T), x1 = Math.floor((cj.x + cj.w - 2) / T);
        for (let x = x0; x <= x1; x++) if (esSolido(x, yc)) { cj.y = yc * T - cj.h; cj.vy = 0; return; }
        for (const o of otras || []) {
            if (o === cj || cj.x + cj.w <= o.x + 2 || cj.x >= o.x + o.w - 2) continue;
            if (yAntes + cj.h <= o.y + 1 && cj.y + cj.h >= o.y) { cj.y = o.y - cj.h; cj.vy = 0; return; }
        }
    }
    window.Plataformas = { mover, caerCaja, solape };
})();
