// ============================================================
// sfx.js — motor de efectos de sonido, sintetizados en vivo con
// Web Audio API (sin archivos de audio, sin ninguna librería: los
// CDN están bloqueados desde donde se armó este sitio, así que en
// vez de depender de un paquete de sonidos externo, cada efecto es
// una función que arma un sonido cortito con osciladores/ruido —
// mismo resultado, cero dependencias, funciona offline).
//
// Uso desde cualquier juego: if (window.sfx) window.sfx.acierto();
// Sordina persistente (localStorage) + botón <button data-btn-sonido>
// en el header de juegos.html.
// ============================================================
(function () {
    let ctx = null;
    function obtenerContexto() {
        if (ctx) return ctx;
        try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; }
        return ctx;
    }
    // Los navegadores (sobre todo en celular) no dejan sonar audio hasta
    // el primer gesto del usuario: apenas toca algo, se destraba solo.
    function desbloquear() {
        const c = obtenerContexto();
        if (c && c.state === 'suspended') c.resume().catch(() => {});
    }
    ['pointerdown', 'touchstart', 'keydown'].forEach(ev =>
        document.addEventListener(ev, desbloquear, { once: true, passive: true }));

    function silenciado() { return localStorage.getItem('sonidoRefugio') === 'off'; }
    function alternarSonido() {
        const nuevo = silenciado() ? 'on' : 'off';
        localStorage.setItem('sonidoRefugio', nuevo);
        actualizarBotonSonido();
        if (nuevo === 'on') tono({ freq: 660, dur: 0.09, tipo: 'sine', vol: 0.16 });
    }
    function actualizarBotonSonido() {
        document.querySelectorAll('[data-btn-sonido]').forEach(btn => {
            btn.innerHTML = `<svg class="icono-svg"><use href="#${silenciado() ? 'icono-sonido-mute' : 'icono-sonido'}"></use></svg>`;
            btn.title = silenciado() ? 'Activar sonido' : 'Silenciar';
        });
    }

    // Un tono simple con envolvente de volumen corta (ataque rápido,
    // caída exponencial) — la base de casi todos los efectos.
    function tono({ freq = 440, dur = 0.15, tipo = 'sine', vol = 0.2, delay = 0, freqFinal = null }) {
        if (silenciado()) return;
        const c = obtenerContexto();
        if (!c) return;
        const t0 = c.currentTime + delay;
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.type = tipo;
        osc.frequency.setValueAtTime(freq, t0);
        if (freqFinal) osc.frequency.exponentialRampToValueAtTime(freqFinal, t0 + dur);
        gain.gain.setValueAtTime(0, t0);
        gain.gain.linearRampToValueAtTime(vol, t0 + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
        osc.connect(gain); gain.connect(c.destination);
        osc.start(t0); osc.stop(t0 + dur + 0.03);
    }

    // Ruido blanco filtrado, corto: golpes secos, "pop", cartas, dados.
    function ruido({ dur = 0.15, vol = 0.15, delay = 0, filtro = 1200 }) {
        if (silenciado()) return;
        const c = obtenerContexto();
        if (!c) return;
        const t0 = c.currentTime + delay;
        const bufferSize = Math.max(1, Math.floor(c.sampleRate * dur));
        const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        const src = c.createBufferSource();
        src.buffer = buffer;
        const filter = c.createBiquadFilter();
        filter.type = 'lowpass'; filter.frequency.value = filtro;
        const gain = c.createGain();
        gain.gain.setValueAtTime(vol, t0);
        gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
        src.connect(filter); filter.connect(gain); gain.connect(c.destination);
        src.start(t0); src.stop(t0 + dur + 0.03);
    }

    const sfx = {
        // Interacción genérica
        click() { tono({ freq: 520, dur: 0.05, tipo: 'sine', vol: 0.11 }); },
        toque() { tono({ freq: 440, dur: 0.04, tipo: 'sine', vol: 0.09 }); },
        pop() { tono({ freq: 300, dur: 0.09, tipo: 'sine', vol: 0.17, freqFinal: 520 }); },
        seleccionar() { tono({ freq: 660, dur: 0.05, tipo: 'triangle', vol: 0.1 }); },

        // Resultado de una jugada/pregunta
        acierto() { tono({ freq: 523.25, dur: 0.1, tipo: 'sine', vol: 0.17 }); tono({ freq: 659.25, dur: 0.15, tipo: 'sine', vol: 0.15, delay: 0.07 }); },
        error() { tono({ freq: 180, dur: 0.18, tipo: 'sawtooth', vol: 0.13, freqFinal: 90 }); },
        revelar() { [523.25, 659.25, 830.61].forEach((f, i) => tono({ freq: f, dur: 0.18, tipo: 'sine', vol: 0.14, delay: i * 0.06 })); },
        empate() { tono({ freq: 440, dur: 0.14, tipo: 'sine', vol: 0.13 }); tono({ freq: 440, dur: 0.14, tipo: 'sine', vol: 0.13, delay: 0.16 }); },

        // Cierre de partida
        victoria() { [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tono({ freq: f, dur: 0.22, tipo: 'triangle', vol: 0.17, delay: i * 0.09 })); },
        derrota() { [392, 349.23, 293.66].forEach((f, i) => tono({ freq: f, dur: 0.28, tipo: 'sine', vol: 0.14, delay: i * 0.12 })); },

        // Progreso / economía del juego
        punto() { tono({ freq: 880, dur: 0.08, tipo: 'sine', vol: 0.14 }); },
        moneda() { tono({ freq: 988, dur: 0.06, tipo: 'square', vol: 0.08 }); tono({ freq: 1319, dur: 0.1, tipo: 'square', vol: 0.08, delay: 0.05 }); },
        logro() { [659.25, 830.61, 987.77, 1318.51].forEach((f, i) => tono({ freq: f, dur: 0.16, tipo: 'sine', vol: 0.15, delay: i * 0.06 })); },

        // Objetos / texturas
        swoosh() { ruido({ dur: 0.22, vol: 0.1, filtro: 2200 }); },
        cartaFlip() { ruido({ dur: 0.09, vol: 0.08, filtro: 3500 }); },
        dado() { ruido({ dur: 0.1, vol: 0.09, filtro: 3000 }); ruido({ dur: 0.09, vol: 0.07, filtro: 2500, delay: 0.09 }); },
        golpe() { ruido({ dur: 0.08, vol: 0.14, filtro: 1400 }); tono({ freq: 140, dur: 0.09, tipo: 'sine', vol: 0.1 }); },
        rebote() { tono({ freq: 300, dur: 0.05, tipo: 'triangle', vol: 0.1, freqFinal: 500 }); },
        explosion() { ruido({ dur: 0.3, vol: 0.18, filtro: 800 }); tono({ freq: 90, dur: 0.25, tipo: 'sawtooth', vol: 0.12 }); },

        // Cronómetro / navegación
        tick() { tono({ freq: 900, dur: 0.025, tipo: 'square', vol: 0.06 }); },
        tiempoFinal() { tono({ freq: 220, dur: 0.5, tipo: 'square', vol: 0.15 }); },
        abrirJuego() { tono({ freq: 400, dur: 0.11, tipo: 'sine', vol: 0.11, freqFinal: 700 }); },
        cerrarJuego() { tono({ freq: 500, dur: 0.09, tipo: 'sine', vol: 0.09, freqFinal: 300 }); },
    };

    window.sfx = sfx;
    window.sonidoSilenciado = silenciado;
    window.alternarSonido = alternarSonido;
    document.addEventListener('DOMContentLoaded', actualizarBotonSonido);
})();
