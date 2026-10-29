// ============================================================
// vivo-comun.js — lo que comparten los juegos en vivo de pantalla
// compartida (Fuego y Agua, Autitos, Vóley, Viborita, Rompeladrillos...):
//
//  VivoComun.botones(grupos, teclas)  → <div class="controles-aventura">
//      grupos: [[{k:'izq', txt:'◀'}, ...], {k:'salto', txt:'⤒', clase:'salto'}]
//      Mantener apretado = teclas[k] true (pointerdown/up/cancel/leave).
//  VivoComun.teclado(idPantalla, mapa, teclas, alTocar?) → teclado (una vez).
//  VivoComun.recibir(prev, d) → el otro con la hora y su velocidad estimada.
//  VivoComun.suave(o) → [x, y] para dibujar: extrapola un poquito con la
//      velocidad (así no se ve "a los saltos") y se acerca suave.
//  VivoComun.cuenta(id, inicio) → pitidos de la cuenta regresiva (llamar en cada cuadro).
//  VivoComun.estado(ctx, W, H, enlace, nombreOtro, activo) → puntito de conexión
//      y avisos de "conexión lenta" / "el otro salió de la pantalla".
// ============================================================
(function () {
    function botones(grupos, teclas) {
        const cont = document.createElement('div');
        cont.className = 'controles-aventura';
        const boton = (b) => `<button type="button" data-k="${b.k}" class="${b.clase || ''}" aria-label="${b.aria || b.k}">${b.txt}</button>`;
        cont.innerHTML = grupos.map(g => Array.isArray(g) ? `<div>${g.map(boton).join('')}</div>` : boton(g)).join('');
        cont.querySelectorAll('button').forEach(b => {
            const k = b.dataset.k;
            b.addEventListener('pointerdown', (ev) => { ev.preventDefault(); teclas[k] = true; b.classList.add('apretado'); });
            const off = (ev) => { ev.preventDefault(); teclas[k] = false; b.classList.remove('apretado'); };
            b.addEventListener('pointerup', off); b.addEventListener('pointercancel', off); b.addEventListener('pointerleave', off);
            b.addEventListener('contextmenu', (ev) => ev.preventDefault());
        });
        return cont;
    }
    function teclado(idPantalla, mapa, teclas, alTocar) {
        const f = (ev) => {
            const k = mapa[ev.code];
            if (!k || !document.getElementById(idPantalla)?.classList.contains('activa') || (ev.target && /INPUT|TEXTAREA/.test(ev.target.tagName))) return;
            ev.preventDefault();
            if (alTocar) { if (ev.type === 'keydown') alTocar(k); return; }
            teclas[k] = ev.type === 'keydown';
        };
        window.addEventListener('keydown', f);
        if (!alTocar) window.addEventListener('keyup', f);
        return f;
    }
    function recibir(prev, d) {
        const t = performance.now(), o = prev || {};
        if (o.x != null && o.t && d.x != null) {
            const dt = t - o.t;
            if (dt > 8) { o.vxe = (d.x - o.x) / dt; o.vye = (d.y - o.y) / dt; }
        }
        Object.assign(o, d, { t, visto: Date.now() });
        return o;
    }
    function suave(o) {
        if (!o || o.x == null) return null;
        const ext = Math.min(100, performance.now() - (o.t || 0));
        const tx = o.x + (o.vxe || 0) * ext, ty = o.y + (o.vye || 0) * ext;
        if (o.rx == null || Math.hypot(tx - o.rx, ty - o.ry) > 48) { o.rx = tx; o.ry = ty; }
        else { o.rx += (tx - o.rx) * 0.4; o.ry += (ty - o.ry) * 0.4; }
        return [o.rx, o.ry];
    }
    // activo = false mientras el otro no tiene por qué mandar nada (cuenta regresiva, entre rondas).
    function estado(c, W, H, enlace, nombreOtro, activo = true) {
        if (!c || !enlace) return;
        const ahora = Date.now(), quieto = enlace.ultimo ? ahora - enlace.ultimo : (ahora - (enlace.creado || ahora));
        const col = enlace.estado === 'directo' ? '#4cd18a' : enlace.estado === 'respaldo' ? '#f5d36b' : '#ff6b6b';
        c.save();
        c.fillStyle = col; c.beginPath(); c.arc(W - 6, 6, 3, 0, Math.PI * 2); c.fill();
        let aviso = null;
        if (activo !== false) {
            if (!enlace.ultimo && quieto > 5000) aviso = `⏳ Esperando a ${nombreOtro}…`;
            else if (enlace.ultimo && quieto > 4000) aviso = `⏸ ${nombreOtro} salió de la pantalla`;
            else if (enlace.ultimo && quieto > 1500) aviso = '📶 Conexión lenta, sigan igual';
        }
        if (aviso) {
            c.font = 'bold 10px sans-serif'; c.textAlign = 'center';
            const w = c.measureText(aviso).width + 16;
            const y = Math.round(H * 0.3);
            c.fillStyle = 'rgba(20,16,30,0.78)'; c.fillRect(W / 2 - w / 2, y, w, 18);
            c.fillStyle = '#fff'; c.fillText(aviso, W / 2, y + 13);
        }
        c.restore();
    }
    // Pitidos de la cuenta regresiva (3, 2, 1) y uno más agudo al arrancar.
    const ultimaCuenta = {};
    function cuenta(id, inicio) {
        if (!inicio || !window.sfx || typeof window.ahoraSync !== 'function') return;
        const falta = inicio - window.ahoraSync(), seg = Math.ceil(falta / 1000);
        const clave = id + inicio;
        if (falta > 0 && seg <= 3 && ultimaCuenta[clave] !== seg) { ultimaCuenta[clave] = seg; window.sfx.tick(); }
        else if (falta <= 0 && falta > -300 && ultimaCuenta[clave] !== 0 && ultimaCuenta[clave] != null) { ultimaCuenta[clave] = 0; window.sfx.punto(); }
    }
    window.VivoComun = { botones, teclado, recibir, suave, estado, cuenta };
})();
