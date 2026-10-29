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
//  VivoComun.montar(id, G, host, e) → en alDibujar: guarda el estado y pone la
//      barrita de ⏸ Pausa (para los dos) y ⛶ Encuadrar arriba del juego.
//  VivoComun.reloj(id) → el reloj de juego: ahoraSync() menos lo que estuvo en
//      pausa (y quieto mientras dura). Usarlo en vez de ahoraSync() en el juego.
//  VivoComun.pausa(id) → true si está en pausa. VivoComun.cartelPausa(ctx) → el velo.
//  VivoComun.soloEncuadre(id, selector) → juegos rápidos: sólo ⛶ Encuadrar.
//  VivoComun.escritor(refFn) → G para montar() en juegos que no usan JuegoTurnos.
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
            if (document.body.classList.contains('vivo-pausado') && ev.type === 'keydown') return;
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
        if (activo !== false && !pausa(actual)) {
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
        if (!inicio || !window.sfx || typeof window.ahoraSync !== 'function' || pausa(actual)) return;
        const falta = inicio - reloj(actual), seg = Math.ceil(falta / 1000);
        const clave = id + inicio;
        if (falta > 0 && seg <= 3 && ultimaCuenta[clave] !== seg) { ultimaCuenta[clave] = seg; window.sfx.tick(); }
        else if (falta <= 0 && falta > -300 && ultimaCuenta[clave] !== 0 && ultimaCuenta[clave] != null) { ultimaCuenta[clave] = 0; window.sfx.punto(); }
    }

    // ---------- Pausa compartida ----------
    // En el doc: pausa = {por, desde} mientras dura y pausaTotal = ms ya pausados.
    // Todos los tiempos del juego (inicio, plazos, plataformas) se miden con
    // reloj(id), así que al seguir todo retoma donde quedó, igual en los dos.
    const estados = {}, juegos = {}, barras = {}, areas = {};
    let actual = null;
    const ahora = () => (typeof window.ahoraSync === 'function' ? window.ahoraSync() : Date.now());
    function pausa(id) { const e = estados[id]; return !!(e && e.fase === 'jugando' && e.pausa); }
    function reloj(id) {
        const e = estados[id] || {}, total = e.pausaTotal || 0;
        return (pausa(id) ? e.pausa.desde : ahora()) - total;
    }
    async function cambiarPausa(id, quiero) {
        const G = juegos[id], e = estados[id];
        if (!G || !e || e.fase !== 'jugando' || !!e.pausa === quiero) return;
        if (typeof vibrarJ === 'function') vibrarJ(12);
        if (window.sfx) window.sfx.click();
        // Lo aplico ya en este celu (el doc llega enseguida y manda).
        const antes = e;
        const local = estados[id] = quiero ? { ...e, pausa: { por: miIdentidad, desde: ahora() } } : { ...e, pausa: null, pausaTotal: (e.pausaTotal || 0) + ahora() - e.pausa.desde };
        refrescar(id);
        const res = await G.accionEnCola((d) => {
            if (!!d.pausa === quiero) return null;
            return quiero ? { pausa: { por: miIdentidad, desde: ahora() } } : { pausa: null, pausaTotal: (d.pausaTotal || 0) + Math.max(0, ahora() - d.pausa.desde) };
        }).catch(() => null);
        // No se escribió y el doc no trajo nada nuevo: vuelvo a lo que había.
        if (!res && estados[id] === local) { estados[id] = antes; refrescar(id); }
    }
    function cartelPausa(c) {
        const e = estados[actual];
        if (!c || !pausa(actual)) return;
        const W = c.canvas.width, H = c.canvas.height;
        const quien = e.pausa.por === miIdentidad ? 'Pausaste vos' : `Pausó ${typeof nombreJugador === 'function' ? nombreJugador(e.pausa.por) : e.pausa.por}`;
        c.save();
        c.fillStyle = 'rgba(14,10,24,0.62)'; c.fillRect(0, 0, W, H);
        c.textAlign = 'center'; c.fillStyle = '#fff';
        const f = Math.max(12, Math.round(Math.min(W, H) / 11));
        c.font = `bold ${f}px sans-serif`; c.fillText('⏸ Pausa', W / 2, H / 2 - f * 0.3);
        c.font = `${Math.round(f * 0.5)}px sans-serif`; c.fillText(`${quien} · tocá ▶ Seguir`, W / 2, H / 2 + f * 0.6);
        c.restore();
    }

    // ---------- Encuadre ----------
    // Deja el juego fijo ocupando toda la pantalla (sin scroll ni rebote),
    // con pantalla completa donde el celu la deja. Se recuerda la elección.
    const CLAVE_ENC = 'vivoEncuadre';
    let quiereEncuadre = false;
    try { quiereEncuadre = localStorage.getItem(CLAVE_ENC) === '1'; } catch (_) { }
    const encuadrado = () => document.body.classList.contains('encuadre');
    function ajustar() {
        if (!encuadrado()) return;
        const p = document.querySelector('.pantalla-juego.activa');
        const id = p && p.id.replace('pantalla-', ''), sel = areas[id];
        let lienzo = sel ? p.querySelector(sel) : (p && p.querySelector('canvas'));
        // Sólo se achica lo que guarda su proporción (aspect-ratio); lo demás queda como está.
        if (lienzo && sel && getComputedStyle(lienzo).aspectRatio === 'auto') lienzo = null;
        if (!lienzo) return;
        lienzo.style.maxWidth = '';
        const sobra = p.scrollHeight - p.clientHeight;
        if (sobra > 0) {
            const h = lienzo.getBoundingClientRect().height, w = lienzo.getBoundingClientRect().width;
            const nuevoH = Math.max(120, h - sobra - 4);
            lienzo.style.maxWidth = Math.floor(w * nuevoH / h) + 'px';
        }
    }
    function encuadrar(si, recordar = true) {
        if (si === encuadrado()) { ajustar(); return; }
        document.body.classList.toggle('encuadre', si);
        if (recordar) { quiereEncuadre = si; try { localStorage.setItem(CLAVE_ENC, si ? '1' : '0'); } catch (_) { } }
        try {
            if (si && document.documentElement.requestFullscreen && !document.fullscreenElement) document.documentElement.requestFullscreen({ navigationUI: 'hide' }).catch(() => { });
            if (!si && document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(() => { });
        } catch (_) { }
        window.scrollTo(0, 0);
        if (!si) document.querySelectorAll('.pantalla-juego canvas, .pantalla-juego [style*="max-width"]').forEach(l => { if (l.closest('.barra-vivo')) return; if (l.tagName === 'CANVAS' || Object.values(areas).some(a => l.matches(a))) l.style.maxWidth = ''; });
        Object.keys(barras).forEach(refrescar);
        setTimeout(ajustar, 60); setTimeout(ajustar, 400);
    }
    document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement && encuadrado()) encuadrar(false); });
    window.addEventListener('resize', () => setTimeout(ajustar, 120));
    // Encuadrado no se scrollea nada (el rebote y el arrastre corrían la pantalla).
    document.addEventListener('touchmove', (ev) => {
        if (!encuadrado()) return;
        const p = document.querySelector('.pantalla-juego.activa'), t = ev.target;
        const enJuego = t && t.closest && t.closest('canvas, .controles-aventura, .barra-vivo, .area-vivo');
        if (enJuego || !p || p.scrollHeight <= p.clientHeight) ev.preventDefault();
    }, { passive: false });
    // Si se sale del juego, se saca el encuadre (sin olvidar la preferencia).
    setInterval(() => {
        if (!encuadrado()) return;
        const p = document.querySelector('.pantalla-juego.activa');
        if (!p || !Object.keys(barras).some(id => p.id === 'pantalla-' + id)) encuadrar(false, false);
        else ajustar();
    }, 700);

    function refrescar(id) {
        const b = barras[id];
        if (!b) return;
        const e = estados[id], jugando = e && e.fase === 'jugando', p = pausa(id);
        b.bPausa.style.display = juegos[id] ? '' : 'none';
        if (b.velo) {
            let v = b.velo.querySelector(':scope > .velo-pausa');
            if (p && b.velo.isConnected) {
                if (!v) { v = document.createElement('div'); v.className = 'velo-pausa'; b.velo.appendChild(v); }
                if (getComputedStyle(b.velo).position === 'static') b.velo.style.position = 'relative';
                v.innerHTML = `<b>⏸ Pausa</b><span>${e.pausa.por === miIdentidad ? 'Pausaste vos' : 'Pausó ' + (typeof nombreJugador === 'function' ? nombreJugador(e.pausa.por) : e.pausa.por)} · tocá ▶ Seguir</span>`;
            } else if (v) v.remove();
        }
        b.bPausa.textContent = p ? '▶ Seguir' : '⏸ Pausa';
        b.bPausa.disabled = !jugando;
        b.bPausa.classList.toggle('activo', p);
        b.bEnc.textContent = encuadrado() ? '✕ Salir del encuadre' : '⛶ Encuadrar';
        document.body.classList.toggle('vivo-pausado', !!p && actual === id);
    }
    // opciones.velo: elemento sobre el que se pone el velo de pausa (juegos sin lienzo).
    function montar(id, G, host, e, opciones) {
        estados[id] = e; juegos[id] = G; actual = id;
        if (!barras[id]) {
            const el = document.createElement('div');
            el.className = 'barra-vivo';
            el.innerHTML = '<button type="button" class="b-pausa"></button><button type="button" class="b-encuadre"></button>';
            const bPausa = el.querySelector('.b-pausa'), bEnc = el.querySelector('.b-encuadre');
            bPausa.addEventListener('click', () => cambiarPausa(id, !pausa(id)));
            bEnc.addEventListener('click', () => encuadrar(!encuadrado()));
            barras[id] = { el, bPausa, bEnc };
        }
        if (opciones && opciones.velo) barras[id].velo = opciones.velo;
        if (opciones && opciones.area) areas[id] = opciones.area;
        refrescar(id);
        if (host && barras[id].el.parentNode !== host) host.prepend(barras[id].el);
        if (quiereEncuadre && e && e.fase === 'jugando' && !encuadrado()) encuadrar(true, false);
        else setTimeout(ajustar, 30);
    }
    // Juegos rápidos (rondas de 30 s): sólo el botón de encuadre, que aparece
    // cuando en #contenido-<id> está la ronda (se reconoce por `selector`).
    function soloEncuadre(id, selector) {
        const arrancar = () => {
            const cont = document.getElementById('contenido-' + id);
            if (!cont) return;
            areas[id] = selector;
            const revisar = () => {
                const area = cont.querySelector(selector);
                if (!area) return;
                area.classList.add('area-vivo');
                if (!barras[id] || barras[id].el.parentNode !== cont) montar(id, null, cont, { fase: 'jugando' });
            };
            new MutationObserver(revisar).observe(cont, { childList: true });
            revisar();
        };
        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', arrancar); else arrancar();
    }
    // Para los juegos que no usan JuegoTurnos: misma interfaz que G.accionEnCola.
    function escritor(refFn) {
        let cola = Promise.resolve();
        const accion = (calcular) => window.jugadaSegura(refFn(), (d) => (!d || d.fase !== 'jugando') ? null : calcular(d));
        return { accionEnCola(calcular) { const p = cola.then(() => accion(calcular)); cola = p.catch(() => null); return p; } };
    }
    // Para los que dibujan con HTML: guarda el estado antes de dibujar (así reloj() ya lo usa).
    function sync(id, e) { if (e) { estados[id] = e; actual = id; refrescar(id); } }
    window.VivoComun = { botones, teclado, recibir, suave, estado, cuenta, montar, reloj, pausa, cartelPausa, encuadrar, soloEncuadre, escritor, sync };
})();
