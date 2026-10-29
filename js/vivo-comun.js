// ============================================================
// vivo-comun.js — lo que comparten los juegos en vivo de pantalla
// compartida (Fuego y Agua, Autitos, Vóley, Viborita, Rompeladrillos...):
//
//  VivoComun.botones(grupos, teclas)  → <div class="controles-aventura">
//      grupos: [[{k:'izq', txt:'◀'}, ...], {k:'salto', txt:'⤒', clase:'salto'}]
//      Mantener apretado = teclas[k] true (pointerdown/up/cancel/leave).
//  VivoComun.teclado(idPantalla, mapa, teclas, alTocar?) → teclado (una vez).
//  VivoComun.recibir(prev, d) → el otro con la hora y su velocidad estimada.
//  VivoComun.suave(o) → [x, y] para dibujar: interpola entre los últimos
//      mensajes unos ms en el pasado (o.ra: el ángulo, si manda `a`).
//  VivoComun.adelantar(b, remoto, avanzar) / posBola(b) → pelota del otro
//      adelantada por el retraso, corregida de a poco al dibujarla.
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
//  Música: cada juego tiene su tema (TEMAS_MUSICA, con js/audio-arcade.js) que
//      suena solo mientras se juega, baja en la pausa y se corta al salir.
//      La barrita suma 🎵 para prenderla o apagarla (se recuerda).
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
    // El otro jugador se dibuja un poquito en el pasado (unos 60–160 ms, según
    // cuánto varíe la red), interpolando entre los mensajes que ya llegaron:
    // así se ve fluido aunque algún paquete llegue tarde o se pierda.
    // Cada mensaje trae la hora en que salió (EnlaceVivo.sello).
    const ahoraJ = () => (typeof window.ahoraSync === 'function' ? window.ahoraSync() : Date.now());
    function recibir(prev, d) {
        const t = performance.now(), o = prev || {}, sello = window.EnlaceVivo && window.EnlaceVivo.sello;
        if (o.x != null && o.t && d.x != null) {
            const dt = t - o.t;
            if (dt > 8) { o.vxe = (d.x - o.x) / dt; o.vye = (d.y - o.y) / dt; }
        }
        if (sello && d.x != null) {
            const buf = o.buf || (o.buf = []);
            if (!buf.length || sello > buf[buf.length - 1].s) {
                buf.push({ s: sello, x: d.x, y: d.y, a: d.a, lat: ahoraJ() - sello });
                if (buf.length > 14) buf.shift();
            }
        }
        Object.assign(o, d, { t, visto: Date.now() });
        return o;
    }
    const lerpAng = (a, b, f) => { let d = b - a; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return a + d * f; };
    function objetivo(o) {
        const buf = o.buf;
        if (!buf || buf.length < 2) {
            const ext = Math.min(100, performance.now() - (o.t || 0));
            return { x: o.x + (o.vxe || 0) * ext, y: o.y + (o.vye || 0) * ext, a: o.a };
        }
        const lats = buf.map(m => m.lat), jitter = Math.max(...lats) - Math.min(...lats);
        const retardo = Math.max(50, Math.min(160, 35 + jitter));
        const tr = ahoraJ() - retardo;
        for (let k = buf.length - 1; k > 0; k--) {
            const a = buf[k - 1], b = buf[k];
            if (tr >= a.s && tr <= b.s) {
                const f = (tr - a.s) / Math.max(1, b.s - a.s);
                // Un salto grande (reaparecer, teletransporte) no se interpola.
                if (Math.hypot(b.x - a.x, b.y - a.y) > 70) return { x: b.x, y: b.y, a: b.a };
                return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f, a: a.a != null && b.a != null ? lerpAng(a.a, b.a, f) : b.a };
            }
        }
        const ult = buf[buf.length - 1], ant = buf[buf.length - 2];
        if (tr < buf[0].s) return { x: buf[0].x, y: buf[0].y, a: buf[0].a };
        // Pasado el último: sigue un poquito con la velocidad que traía.
        const ext = Math.min(120, tr - ult.s), dt = Math.max(1, ult.s - ant.s);
        if (Math.hypot(ult.x - ant.x, ult.y - ant.y) > 70) return { x: ult.x, y: ult.y, a: ult.a };
        return { x: ult.x + (ult.x - ant.x) / dt * ext, y: ult.y + (ult.y - ant.y) / dt * ext, a: ult.a };
    }
    function suave(o) {
        if (!o || o.x == null) return null;
        const p = objetivo(o);
        if (o.rx == null || Math.hypot(p.x - o.rx, p.y - o.ry) > 48) { o.rx = p.x; o.ry = p.y; }
        else { o.rx += (p.x - o.rx) * 0.55; o.ry += (p.y - o.ry) * 0.55; }
        if (p.a != null) o.ra = o.ra == null ? p.a : lerpAng(o.ra, p.a, 0.55);
        return [o.rx, o.ry];
    }
    // Pelota/disco que manda el otro: se adelanta lo que tardó el mensaje
    // (con la misma física del juego, `avanzar(copia, dt)`), y la diferencia
    // con lo que yo ya tenía se corrige de a poco en el dibujo (sin saltos).
    function adelantar(b, remoto, avanzar) {
        const sello = window.EnlaceVivo && window.EnlaceVivo.sello;
        const lat = sello ? Math.max(0, Math.min(250, ahoraJ() - sello)) : 0;
        const c = { ...b, ...remoto };
        let falta = lat / 16.67;
        while (falta > 0.001 && avanzar) { const paso = Math.min(1, falta); avanzar(c, paso); falta -= paso; }
        const ex = (b.x - c.x) + (b.ox || 0), ey = (b.y - c.y) + (b.oy || 0);
        Object.assign(b, c);
        if (Math.hypot(ex, ey) < 45) { b.ox = ex; b.oy = ey; } else { b.ox = 0; b.oy = 0; }
        return b;
    }
    // Dónde dibujar la pelota (con la corrección que se va apagando).
    function posBola(b) {
        if (!b) return [0, 0];
        b.ox = (b.ox || 0) * 0.8; b.oy = (b.oy || 0) * 0.8;
        if (Math.abs(b.ox) < 0.05) b.ox = 0; if (Math.abs(b.oy) < 0.05) b.oy = 0;
        return [b.x + b.ox, b.y + b.oy];
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
        else if (falta <= 0 && falta > -300 && ultimaCuenta[clave] !== 0 && ultimaCuenta[clave] != null) { ultimaCuenta[clave] = 0; if (!(window.AudioArcade && AudioArcade.sfx('ya'))) window.sfx.punto(); }
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
        // Se dibuja en píxeles reales del lienzo (algunos juegos dibujan con escala x2).
        c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
        const quien = e.pausa.por === miIdentidad ? 'Pausaste vos' : `Pausó ${typeof nombreJugador === 'function' ? nombreJugador(e.pausa.por) : e.pausa.por}`;
        c.save();
        c.fillStyle = 'rgba(14,10,24,0.62)'; c.fillRect(0, 0, W, H);
        c.textAlign = 'center'; c.fillStyle = '#fff';
        const f = Math.max(12, Math.round(Math.min(W, H) / 11));
        c.font = `bold ${f}px sans-serif`; c.fillText('⏸ Pausa', W / 2, H / 2 - f * 0.3);
        c.font = `${Math.round(f * 0.5)}px sans-serif`; c.fillText(`${quien} · tocá ▶ Seguir`, W / 2, H / 2 + f * 0.6);
        c.restore();
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
        const A = window.AudioArcade;
        b.bMus.style.display = TEMAS_MUSICA[id] && A ? '' : 'none';
        if (A) { b.bMus.textContent = A.musicaActiva() ? '🎵' : '🔇'; b.bMus.title = A.musicaActiva() ? 'Apagar la música' : 'Prender la música'; b.bMus.classList.toggle('activo', !A.musicaActiva()); }
        document.body.classList.toggle('vivo-pausado', !!p && actual === id);
    }
    // opciones.velo: elemento sobre el que se pone el velo de pausa (juegos sin lienzo).
    function montar(id, G, host, e, opciones) {
        estados[id] = e; juegos[id] = G; actual = id;
        if (!barras[id]) {
            const el = document.createElement('div');
            el.className = 'barra-vivo';
            el.innerHTML = '<button type="button" class="b-pausa"></button><button type="button" class="b-encuadre"></button><button type="button" class="b-musica" aria-label="Música"></button>';
            const bPausa = el.querySelector('.b-pausa'), bEnc = el.querySelector('.b-encuadre'), bMus = el.querySelector('.b-musica');
            bPausa.addEventListener('click', () => cambiarPausa(id, !pausa(id)));
            bEnc.addEventListener('click', () => encuadrar(!encuadrado()));
            bMus.addEventListener('click', () => { if (window.AudioArcade) { AudioArcade.alternarMusica(); musicaAct = ''; controlMusica(); Object.keys(barras).forEach(refrescar); } });
            barras[id] = { el, bPausa, bEnc, bMus };
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
    // ---------- Música de cada juego ----------
    const TEMAS_MUSICA = {
        autitos: 'carrera', aventura: 'aventura', obstaculos: 'aventura', snake2: 'aventura',
        bombitas: 'batalla', tanques: 'batalla', motos: 'neon', pongcoop: 'neon',
        futbolcabezas: 'deporte', hockey: 'deporte', voley: 'deporte', pingpongvivo: 'deporte',
        natacion: 'agua', pescavivo: 'agua', fuegoagua: 'templo', cocina: 'tranqui', bloques: 'tranqui',
    };
    let musicaAct = '';
    function controlMusica() {
        const A = window.AudioArcade;
        if (!A) return;
        const p = document.querySelector('.pantalla-juego.activa'), id = p && p.id.replace('pantalla-', '');
        const tema = TEMAS_MUSICA[id], e = estados[id], jugando = !!(tema && e && e.fase === 'jugando' && !document.hidden);
        // Mientras hay un juego en vivo, los sonidos de sfx.js salen por el motor arcade.
        A.enVivo = jugando || id === 'multiverso';
        const quiero = jugando ? tema + ':' + (pausa(id) ? 'pausa' : 'juego') : '';
        if (quiero === musicaAct) return;
        // El Multiverso maneja su propia música: si no la puse yo, no la toco.
        if (!quiero && !musicaAct) return;
        musicaAct = quiero;
        if (jugando) A.musica(tema, pausa(id) ? 'pausa' : 'juego');
        else if (id !== 'multiverso') A.musica(null);
    }
    setInterval(controlMusica, 400);
    document.addEventListener('visibilitychange', controlMusica);

    window.VivoComun = { botones, teclado, recibir, suave, adelantar, posBola, estado, cuenta, montar, reloj, pausa, cartelPausa, encuadrar, soloEncuadre, escritor, sync, TEMAS_MUSICA };
})();
