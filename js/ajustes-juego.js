// ============================================================
// ajustes-juego.js — "🎛️ Sonido y mesa" (botón 🔊 del encabezado).
//  - Efectos de sonido (sfx.js y los maullidos de Chokurei).
//  - Música de fondo suave para jugar, generada en vivo con Web Audio
//    (sin archivos: acordes tranquilos con un arpegio encima).
//  - Vibración.
//  - Diseño de mesa: clásico, paño verde, madera o noche. Cambia los
//    tableros, el paño del Truco y el dorso de las cartas (css/juegos.css,
//    html[data-mesa=...]).
// Todo se guarda en este celular (localStorage).
// ============================================================
(function () {
    const leer = (k, def) => { try { const v = localStorage.getItem(k); return v === null ? def : v; } catch (e) { return def; } };
    const guardar = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* sin almacenamiento */ } };

    const MESAS = {
        clasico: { nombre: 'Clásico', muestra: 'linear-gradient(135deg,#3a2f45 50%,#1d1724 50%)' },
        pano: { nombre: 'Paño verde', muestra: 'linear-gradient(135deg,#3f8a5c 50%,#25603f 50%)' },
        madera: { nombre: 'Madera', muestra: 'linear-gradient(135deg,#e0bb8f 50%,#8a5a3a 50%)' },
        noche: { nombre: 'Noche', muestra: 'radial-gradient(circle at 30% 30%,#fff 1px,transparent 2px),linear-gradient(135deg,#2e2c55 50%,#16142b 50%)' },
        // Se desbloquean con el Nivel de pareja (js/nivel-pareja.js).
        playa: { nombre: 'Playa', nivel: 3, muestra: 'linear-gradient(135deg,#f3dfb4 50%,#4fb3c9 50%)' },
        otono: { nombre: 'Otoño', nivel: 5, muestra: 'linear-gradient(135deg,#e9a25a 50%,#8a3f22 50%)' },
        sanvalentin: { nombre: 'San Valentín', nivel: 7, muestra: 'linear-gradient(135deg,#ffc2d4 50%,#c2335f 50%)' },
        dorado: { nombre: 'Dorada', nivel: 8, muestra: 'linear-gradient(135deg,#f7e29a 50%,#a8812c 50%)' },
    };
    const nivelActual = () => window.nivelPareja ? window.nivelPareja.nivel() : 1;
    const bloqueada = (id) => MESAS[id] && MESAS[id].nivel && nivelActual() < MESAS[id].nivel;
    function aplicarMesa(m) {
        if (!MESAS[m]) m = 'clasico';
        document.documentElement.dataset.mesa = m;
        guardar('mesaJuegos', m);
    }
    aplicarMesa(leer('mesaJuegos', 'clasico'));

    // ---------- Vibración ----------
    function envolverVibracion() {
        const orig = window.vibrarJ;
        if (typeof orig !== 'function' || orig._ajustes) return;
        const nueva = function () { if (leer('vibracionJuegos', 'on') === 'off') return; return orig.apply(this, arguments); };
        nueva._ajustes = true;
        window.vibrarJ = nueva;
    }
    envolverVibracion();

    // ---------- Música de fondo ----------
    // Cuatro acordes que se repiten (Do maj7 · La m7 · Fa maj7 · Sol 6),
    // un colchón suave y un arpegio que va eligiendo notas del acorde.
    const ACORDES = [[261.6, 329.6, 392, 493.9], [220, 261.6, 329.6, 392], [174.6, 220, 261.6, 329.6], [196, 246.9, 293.7, 329.6]];
    let ctx = null, master = null, timerMusica = null, compas = 0, sonando = false;
    function volumen() { return Math.max(0, Math.min(1, Number(leer('volumenMusicaJuegos', '0.5')))); }
    function prepararAudio() {
        if (ctx) return ctx;
        try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; }
        master = ctx.createGain();
        master.gain.value = 0;
        const filtro = ctx.createBiquadFilter();
        filtro.type = 'lowpass'; filtro.frequency.value = 1800;
        const eco = ctx.createDelay(); eco.delayTime.value = 0.38;
        const vuelta = ctx.createGain(); vuelta.gain.value = 0.28;
        master.connect(filtro); filtro.connect(ctx.destination);
        filtro.connect(eco); eco.connect(vuelta); vuelta.connect(eco); vuelta.connect(ctx.destination);
        return ctx;
    }
    function nota(f, t, dur, vol, tipo) {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = tipo || 'sine'; o.frequency.value = f;
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(vol, t + Math.min(0.8, dur * 0.3));
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.connect(g); g.connect(master);
        o.start(t); o.stop(t + dur + 0.05);
    }
    function tocarCompas() {
        if (!ctx || !sonando) return;
        const t = ctx.currentTime + 0.05, acorde = ACORDES[compas % ACORDES.length];
        acorde.forEach(f => nota(f / 2, t, 4.2, 0.05, 'triangle'));
        nota(acorde[0] / 4, t, 4, 0.06, 'sine');
        for (let i = 0; i < 8; i++) {
            if (Math.random() < 0.3) continue;
            nota(acorde[Math.floor(Math.random() * acorde.length)] * (Math.random() < 0.3 ? 2 : 1), t + i * 0.5, 0.9, 0.035, 'sine');
        }
        compas++;
    }
    function arrancarMusica() {
        if (sonando || leer('musicaJuegos', 'off') !== 'on' || document.hidden) return;
        if (!prepararAudio()) return;
        if (ctx.state === 'suspended') ctx.resume().catch(() => {});
        sonando = true;
        master.gain.cancelScheduledValues(ctx.currentTime);
        master.gain.linearRampToValueAtTime(0.9 * volumen(), ctx.currentTime + 2);
        tocarCompas();
        timerMusica = setInterval(tocarCompas, 4000);
    }
    function pararMusica() {
        if (!sonando) return;
        sonando = false;
        clearInterval(timerMusica);
        if (ctx && master) { master.gain.cancelScheduledValues(ctx.currentTime); master.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.8); }
    }
    // Los navegadores sólo dejan sonar después de un toque.
    ['pointerdown', 'keydown'].forEach(ev => document.addEventListener(ev, arrancarMusica, { passive: true }));
    document.addEventListener('visibilitychange', () => { if (document.hidden) pararMusica(); else arrancarMusica(); });

    // ---------- Hoja de ajustes ----------
    const efectosOn = () => !(typeof window.sonidoSilenciado === 'function' && window.sonidoSilenciado());
    function interruptor(id, on, texto, sub) {
        return `<button type="button" class="ajuste-fila" onclick="cambiarAjusteJuego('${id}')" aria-pressed="${on}">
            <span><b>${texto}</b><br><span class="texto-tenue">${sub}</span></span>
            <span class="ajuste-switch${on ? ' on' : ''}"><i></i></span></button>`;
    }
    function dibujar() {
        const hoja = document.querySelector('.ajustes-hoja');
        if (!hoja) return;
        const mesa = leer('mesaJuegos', 'clasico'), musica = leer('musicaJuegos', 'off') === 'on';
        hoja.querySelector('.ajustes-cuerpo').innerHTML = `
            ${interruptor('efectos', efectosOn(), '🔊 Efectos de sonido', 'Cartas, dados, aciertos y maullidos')}
            ${interruptor('musica', musica, '🎵 Música de fondo', 'Una melodía tranquila mientras juegan')}
            ${musica ? `<label class="ajuste-volumen">🔉 <input type="range" min="0" max="1" step="0.05" value="${volumen()}" oninput="volumenMusicaJuego(this.value)" aria-label="Volumen de la música"> 🔊</label>` : ''}
            ${interruptor('vibracion', leer('vibracionJuegos', 'on') !== 'off', '📳 Vibración', 'Un toquecito al jugar')}
            <div class="ajuste-titulo">🎨 Diseño de mesa</div>
            <div class="ajuste-mesas">${Object.entries(MESAS).map(([id, m]) => `<button type="button" class="ajuste-mesa${mesa === id ? ' elegida' : ''}${bloqueada(id) ? ' bloqueada' : ''}" onclick="elegirMesaJuego('${id}')">
                <span class="ajuste-muestra" style="background:${m.muestra}; background-size:${id === 'noche' ? '12px 12px, auto' : 'auto'};">${bloqueada(id) ? '🔒' : ''}</span>${m.nombre}${bloqueada(id) ? `<small>Nivel ${m.nivel}</small>` : ''}</button>`).join('')}</div>`;
    }
    function abrir() {
        cerrar();
        const fondo = document.createElement('div');
        fondo.className = 'compu-selector-fondo ajustes-fondo';
        fondo.onclick = (ev) => { if (ev.target === fondo) cerrar(); };
        fondo.innerHTML = `<div class="compu-selector panel ajustes-hoja" role="dialog" aria-label="Sonido y mesa">
            <div class="compu-selector-titulo">🎛️ Sonido y mesa</div>
            <div class="ajustes-cuerpo"></div>
            <button type="button" class="btn-principal" style="margin-top:12px;" onclick="cerrarAjustesJuego()">Listo</button>
        </div>`;
        document.body.appendChild(fondo);
        dibujar();
    }
    function cerrar() { document.querySelectorAll('.ajustes-fondo').forEach(x => x.remove()); }
    function cambiar(id) {
        if (id === 'efectos' && typeof window.alternarSonido === 'function') window.alternarSonido();
        if (id === 'musica') {
            const on = leer('musicaJuegos', 'off') !== 'on';
            guardar('musicaJuegos', on ? 'on' : 'off');
            if (on) arrancarMusica(); else pararMusica();
        }
        if (id === 'vibracion') {
            const on = leer('vibracionJuegos', 'on') === 'off';
            guardar('vibracionJuegos', on ? 'on' : 'off');
            if (on && navigator.vibrate) { try { navigator.vibrate(15); } catch (e) { /* nada */ } }
        }
        dibujar();
    }

    window.abrirAjustesJuego = abrir;
    window.cerrarAjustesJuego = cerrar;
    window.cambiarAjusteJuego = cambiar;
    window.elegirMesaJuego = (m) => {
        if (bloqueada(m)) {
            if (window.sfx) window.sfx.error();
            if (window.animJuegos) window.animJuegos.cartel(`🔒 Se desbloquea en el nivel ${MESAS[m].nivel}`, { sub: 'Jueguen juntos para subir el Nivel de pareja ⭐', dur: 1800, sonido: false });
            return;
        }
        aplicarMesa(m); if (window.sfx) window.sfx.toque(); dibujar();
    };
    window.volumenMusicaJuego = (v) => {
        guardar('volumenMusicaJuegos', String(v));
        if (ctx && master && sonando) { master.gain.cancelScheduledValues(ctx.currentTime); master.gain.setTargetAtTime(0.9 * volumen(), ctx.currentTime, 0.1); }
    };
})();
