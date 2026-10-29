// ============================================================
// mv-audio.js — AudioManager del Multiverso Arcade.
// Todo se sintetiza con Web Audio (no hay archivos que bajar): al
// iniciar se "precargan" los buffers de ruido y la cadena de mezcla.
//
//   MVAudio.iniciar()            → crea/reanuda el AudioContext (llamarlo
//                                  en el primer toque o tecla: los
//                                  navegadores no dejan sonar antes).
//   MVAudio.sfx('laser', {jugador})  · 'explosion' {tam: 0..1} · 'golpe'
//         'powerup' · 'sinergia' · 'nova' · 'dash' · 'alerta' · 'vida'
//   MVAudio.musica('menu' | 'exploracion' | 'combate' | null)
//                                → música ambiente generativa; cambia de
//                                  capa con fundido (más tensa en combate).
// Respeta el botón de silencio de la app (window.sonidoSilenciado).
// ============================================================
(function () {
    let ctx = null, maestro = null, busSfx = null, busMus = null, ruido = null, reverb = null;
    let modoMus = null, capas = {}, timerMus = null, paso = 0;
    const silenciado = () => typeof window.sonidoSilenciado === 'function' && window.sonidoSilenciado();

    function iniciar() {
        try {
            if (!ctx) {
                const AC = window.AudioContext || window.webkitAudioContext;
                if (!AC) return;
                ctx = new AC();
                maestro = ctx.createGain(); maestro.gain.value = 0.8; maestro.connect(ctx.destination);
                busSfx = ctx.createGain(); busSfx.gain.value = 0.55; busSfx.connect(maestro);
                busMus = ctx.createGain(); busMus.gain.value = 0.32; busMus.connect(maestro);
                // Ruido blanco precargado (explosiones, propulsores)
                ruido = ctx.createBuffer(1, ctx.sampleRate * 1.5, ctx.sampleRate);
                const d = ruido.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
                // Reverb de espacio: respuesta al impulso que se apaga despacio
                reverb = ctx.createConvolver();
                const largo = ctx.sampleRate * 3, ir = ctx.createBuffer(2, largo, ctx.sampleRate);
                for (let ch = 0; ch < 2; ch++) { const x = ir.getChannelData(ch); for (let i = 0; i < largo; i++) x[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / largo, 2.6); }
                reverb.buffer = ir;
                const ret = ctx.createGain(); ret.gain.value = 0.5; reverb.connect(ret); ret.connect(maestro);
                capas = { calma: crearCapa(), tension: crearCapa() };
            }
            if (ctx.state === 'suspended') ctx.resume();
        } catch (e) { /* sin audio */ }
    }
    function crearCapa() { const g = ctx.createGain(); g.gain.value = 0; g.connect(busMus); g.connect(reverb); return g; }
    const t0 = () => ctx.currentTime;

    function nota(freq, cuando, dur, o = {}) {
        const osc = ctx.createOscillator(), g = ctx.createGain();
        osc.type = o.tipo || 'sine'; osc.frequency.setValueAtTime(freq, cuando);
        if (o.hasta) osc.frequency.exponentialRampToValueAtTime(o.hasta, cuando + dur);
        if (o.detune) osc.detune.value = o.detune;
        const vol = o.vol || 0.3, ataque = o.ataque || 0.005;
        g.gain.setValueAtTime(0.0001, cuando); g.gain.exponentialRampToValueAtTime(vol, cuando + ataque); g.gain.exponentialRampToValueAtTime(0.0001, cuando + dur);
        let ultimo = g;
        if (o.filtro) { const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = o.filtro; g.connect(f); ultimo = f; }
        osc.connect(g); ultimo.connect(o.destino || busSfx);
        if (o.eco) ultimo.connect(reverb);
        osc.start(cuando); osc.stop(cuando + dur + 0.05);
    }
    function ruidoCorto(cuando, dur, o = {}) {
        const s = ctx.createBufferSource(); s.buffer = ruido;
        const f = ctx.createBiquadFilter(); f.type = o.tipoFiltro || 'lowpass'; f.frequency.setValueAtTime(o.desde || 2000, cuando); f.frequency.exponentialRampToValueAtTime(o.hasta || 120, cuando + dur);
        const g = ctx.createGain(); g.gain.setValueAtTime(o.vol || 0.5, cuando); g.gain.exponentialRampToValueAtTime(0.0001, cuando + dur);
        s.connect(f); f.connect(g); g.connect(busSfx); if (o.eco) g.connect(reverb);
        s.start(cuando, Math.random() * 0.5); s.stop(cuando + dur + 0.05);
    }

    // Para no saturar: el mismo efecto no suena más de N veces por segundo.
    const ultimoSfx = {};
    function sfx(nombre, o = {}) {
        if (!ctx || silenciado()) return;
        const ahora = performance.now(), clave = nombre + (o.jugador || '');
        const minimo = { laser: 55, explosion: 40, golpe: 80 }[nombre] || 0;
        if (minimo && ahora - (ultimoSfx[clave] || 0) < minimo) return;
        ultimoSfx[clave] = ahora;
        const t = t0();
        switch (nombre) {
            case 'laser': { const base = o.jugador === 1 ? 880 : 1180; nota(base, t, 0.12, { tipo: 'square', hasta: base / 3.2, vol: 0.09, filtro: 3200 }); break; }
            case 'explosion': {
                // Más grande = más grave y más larga
                const tam = Math.max(0, Math.min(1, o.tam == null ? 0.4 : o.tam));
                ruidoCorto(t, 0.25 + tam * 0.9, { desde: 2600 - tam * 1800, hasta: 60, vol: 0.35 + tam * 0.4, eco: tam > 0.5 });
                nota(160 - tam * 110, t, 0.2 + tam * 0.6, { tipo: 'sine', hasta: 30, vol: 0.25 + tam * 0.35 });
                break;
            }
            case 'golpe': ruidoCorto(t, 0.3, { desde: 1800, hasta: 200, vol: 0.5 }); nota(220, t, 0.3, { tipo: 'sawtooth', hasta: 70, vol: 0.18, filtro: 900 }); break;
            case 'powerup': [523, 659, 784, 1047].forEach((f, i) => nota(f, t + i * 0.06, 0.25, { tipo: 'triangle', vol: 0.16, eco: true })); break;
            case 'sinergia': {
                // Acorde armónico (quinta + octava) que se abre: el sonido del trabajo en equipo
                [392, 587.3, 784, 1174.7].forEach((f, i) => { nota(f, t + i * 0.035, 1.2, { tipo: 'sine', vol: 0.12, ataque: 0.02, eco: true }); nota(f * 2.005, t + i * 0.035, 0.9, { tipo: 'sine', vol: 0.04, eco: true }); });
                break;
            }
            case 'nova': ruidoCorto(t, 1.6, { desde: 6000, hasta: 40, vol: 0.7, eco: true }); nota(55, t, 1.8, { tipo: 'sawtooth', hasta: 28, vol: 0.4, filtro: 600 }); [261.6, 329.6, 392, 523.3].forEach((f, i) => nota(f, t + 0.2 + i * 0.05, 1.4, { tipo: 'triangle', vol: 0.1, eco: true })); break;
            case 'dash': ruidoCorto(t, 0.18, { tipoFiltro: 'bandpass', desde: 900, hasta: 4000, vol: 0.25 }); break;
            case 'alerta': [0, 0.22].forEach(d => nota(740, t + d, 0.16, { tipo: 'square', vol: 0.08, filtro: 2400 })); break;
            case 'vida': nota(330, t, 0.5, { tipo: 'triangle', hasta: 660, vol: 0.15, eco: true }); break;
            case 'click': nota(660, t, 0.06, { tipo: 'triangle', vol: 0.1 }); break;
        }
    }

    // ---------- Música generativa ----------
    // Calma: acordes de pad que respiran (modo lidio, zen) + campanitas sueltas.
    // Tensión: bajo pulsante, platillo suave y arpegio más rápido, que se suman
    // al pad con un fundido cuando hay combate.
    const ACORDES = [[146.8, 220, 277.2, 329.6], [130.8, 196, 246.9, 329.6], [110, 164.8, 220, 277.2], [123.5, 185, 246.9, 311.1]];
    function tic() {
        if (!ctx || !modoMus) return;
        const t = t0(), compas = Math.floor(paso / 16), ac = ACORDES[compas % ACORDES.length], p = paso % 16;
        if (p === 0) ac.forEach((f, i) => { nota(f, t, 7.5, { tipo: 'sine', vol: 0.07, ataque: 1.8, destino: capas.calma, detune: (i - 1.5) * 6 }); nota(f / 2, t, 7.5, { tipo: 'triangle', vol: 0.04, ataque: 2, destino: capas.calma }); });
        if (Math.random() < 0.22) nota(ac[Math.floor(Math.random() * 4)] * 4, t, 2.4, { tipo: 'sine', vol: 0.05, ataque: 0.01, destino: capas.calma });
        if (p % 4 === 0) nota(ac[0] / 2, t, 0.35, { tipo: 'sawtooth', vol: 0.12, filtro: 420, destino: capas.tension });
        if (p % 2 === 1) { const s = ctx.createBufferSource(); s.buffer = ruido; const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 7000; const g = ctx.createGain(); g.gain.setValueAtTime(0.06, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06); s.connect(f); f.connect(g); g.connect(capas.tension); s.start(t, Math.random()); s.stop(t + 0.08); }
        nota(ac[p % 4] * 2, t, 0.18, { tipo: 'triangle', vol: 0.045, filtro: 2600, destino: capas.tension });
        paso++;
    }
    function musica(modo) {
        if (!ctx) { modoMus = modo; return; }
        modoMus = modo;
        const t = t0(), fundido = 1.6;
        const calma = modo === 'menu' || modo === 'exploracion' ? 1 : modo === 'combate' ? 0.6 : 0;
        const tension = modo === 'combate' ? 1 : modo === 'exploracion' ? 0.15 : 0;
        if (capas.calma) { capas.calma.gain.cancelScheduledValues(t); capas.calma.gain.setTargetAtTime(silenciado() ? 0 : calma, t, fundido / 3); }
        if (capas.tension) { capas.tension.gain.cancelScheduledValues(t); capas.tension.gain.setTargetAtTime(silenciado() ? 0 : tension, t, fundido / 3); }
        if (modo && !timerMus) timerMus = setInterval(tic, 470 / 2);
        if (!modo && timerMus) { clearInterval(timerMus); timerMus = null; }
    }
    window.MVAudio = { iniciar, sfx, musica, get listo() { return !!ctx && ctx.state === 'running'; } };
})();
