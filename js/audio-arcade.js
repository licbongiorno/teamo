// ============================================================
// audio-arcade.js — motor de sonido de los juegos de acción (el del
// Multiverso Arcade, ahora para todos). Todo se sintetiza con Web Audio:
// no hay archivos que bajar.
//
//   AudioArcade.iniciar()        → crea/reanuda el AudioContext (se llama
//                                  solo en el primer toque o tecla).
//   AudioArcade.sfx(nombre, o)   → efectos con mezcla, filtro y eco:
//       laser {jugador} · explosion {tam 0..1} · golpe · powerup · sinergia
//       nova · dash · alerta · vida · click · salto · moneda · gema · rebote
//       paleta · ladrillo · comer · pisar · choque · gol · silbato · chapuzon
//       disparo · punto · acierto · error · victoria · derrota · tick · ya
//       swoosh · motor {vel 0..1}
//   AudioArcade.musica(tema, modo) → música generativa que no se repite igual:
//       tema: espacio · aventura · carrera · neon · deporte · templo · batalla
//             · tranqui · agua · arcade    (null = apagar)
//       modo: 'calma' · 'juego' · 'combate' · 'pausa' (cambia con fundido)
//   AudioArcade.musicaActiva() / alternarMusica() → preferencia de música
//       (aparte del silencio general de la app, que también la apaga).
//   AudioArcade.enVivo = true mientras hay un juego en vivo: sfx.js usa
//       entonces estos sonidos para golpes, rebotes, monedas, etc.
// ============================================================
(function () {
    let ctx = null, maestro = null, comp = null, busSfx = null, busMus = null, ruido = null, reverb = null;
    let capas = {}, temaAct = null, modoAct = null, timer = null, proxPaso = 0, paso = 0, compas = 0;
    const silenciado = () => typeof window.sonidoSilenciado === 'function' && window.sonidoSilenciado();
    const CLAVE_MUS = 'musicaArcade';
    let musicaOn = true;
    try { musicaOn = localStorage.getItem(CLAVE_MUS) !== 'off'; } catch (_) { }

    function iniciar() {
        try {
            if (!ctx) {
                const AC = window.AudioContext || window.webkitAudioContext;
                if (!AC) return;
                ctx = new AC();
                // Compresor al final: así muchos efectos juntos no saturan.
                comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.knee.value = 10; comp.ratio.value = 4; comp.connect(ctx.destination);
                maestro = ctx.createGain(); maestro.gain.value = 0.85; maestro.connect(comp);
                busSfx = ctx.createGain(); busSfx.gain.value = 0.55; busSfx.connect(maestro);
                busMus = ctx.createGain(); busMus.gain.value = 0.3; busMus.connect(maestro);
                ruido = ctx.createBuffer(1, ctx.sampleRate * 1.5, ctx.sampleRate);
                const d = ruido.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
                reverb = ctx.createConvolver();
                const largo = ctx.sampleRate * 2.6, ir = ctx.createBuffer(2, largo, ctx.sampleRate);
                for (let ch = 0; ch < 2; ch++) { const x = ir.getChannelData(ch); for (let i = 0; i < largo; i++) x[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / largo, 2.6); }
                reverb.buffer = ir;
                const ret = ctx.createGain(); ret.gain.value = 0.45; reverb.connect(ret); ret.connect(maestro);
                capas = { calma: crearCapa(), tension: crearCapa(), ritmo: crearCapa() };
                if (temaAct) arrancarSecuenciador();
            }
            if (ctx.state === 'suspended') ctx.resume();
        } catch (e) { /* sin audio */ }
    }
    ['pointerdown', 'keydown', 'touchstart'].forEach(ev => document.addEventListener(ev, iniciar, { passive: true }));
    function crearCapa() { const g = ctx.createGain(); g.gain.value = 0; g.connect(busMus); g.connect(reverb); return g; }
    const t0 = () => ctx.currentTime;

    function nota(freq, cuando, dur, o = {}) {
        const osc = ctx.createOscillator(), g = ctx.createGain();
        osc.type = o.tipo || 'sine'; osc.frequency.setValueAtTime(freq, cuando);
        if (o.hasta) osc.frequency.exponentialRampToValueAtTime(o.hasta, cuando + (o.rampa || dur));
        if (o.detune) osc.detune.value = o.detune;
        const vol = o.vol || 0.3, ataque = o.ataque || 0.005;
        g.gain.setValueAtTime(0.0001, cuando); g.gain.exponentialRampToValueAtTime(vol, cuando + ataque); g.gain.exponentialRampToValueAtTime(0.0001, cuando + dur);
        let ultimo = g;
        if (o.filtro) { const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = o.filtro; if (o.q) f.Q.value = o.q; g.connect(f); ultimo = f; }
        osc.connect(g); ultimo.connect(o.destino || busSfx);
        if (o.eco) ultimo.connect(reverb);
        osc.start(cuando); osc.stop(cuando + dur + 0.05);
    }
    function ruidoCorto(cuando, dur, o = {}) {
        const s = ctx.createBufferSource(); s.buffer = ruido;
        const f = ctx.createBiquadFilter(); f.type = o.tipoFiltro || 'lowpass'; f.frequency.setValueAtTime(o.desde || 2000, cuando); f.frequency.exponentialRampToValueAtTime(o.hasta || 120, cuando + dur);
        if (o.q) f.Q.value = o.q;
        const g = ctx.createGain(); g.gain.setValueAtTime(o.vol || 0.5, cuando); g.gain.exponentialRampToValueAtTime(0.0001, cuando + dur);
        s.connect(f); f.connect(g); g.connect(o.destino || busSfx); if (o.eco) g.connect(reverb);
        s.start(cuando, Math.random() * 0.5); s.stop(cuando + dur + 0.05);
    }

    // ---------- Efectos ----------
    // Para no saturar: el mismo efecto no suena más de N veces por segundo.
    const ultimoSfx = {};
    const MINIMO = { laser: 55, explosion: 40, golpe: 70, rebote: 45, paleta: 45, ladrillo: 35, moneda: 40, pisar: 60, choque: 90, motor: 90, tick: 120 };
    // Un poquito de variación de tono en cada golpe: suena menos a "máquina".
    const vari = () => 1 + (Math.random() - 0.5) * 0.08;
    function sfx(nombre, o = {}) {
        if (!ctx || silenciado() || ctx.state !== 'running') return false;
        const ahora = performance.now(), clave = nombre + (o.jugador || '');
        const minimo = MINIMO[nombre] || 0;
        if (minimo && ahora - (ultimoSfx[clave] || 0) < minimo) return true;
        ultimoSfx[clave] = ahora;
        const t = t0(), v = vari();
        switch (nombre) {
            case 'laser': { const base = o.jugador === 1 ? 880 : 1180; nota(base, t, 0.12, { tipo: 'square', hasta: base / 3.2, vol: 0.09, filtro: 3200 }); break; }
            case 'explosion': {
                const tam = Math.max(0, Math.min(1, o.tam == null ? 0.4 : o.tam));
                ruidoCorto(t, 0.25 + tam * 0.9, { desde: 2600 - tam * 1800, hasta: 60, vol: 0.35 + tam * 0.4, eco: tam > 0.5 });
                nota(160 - tam * 110, t, 0.2 + tam * 0.6, { tipo: 'sine', hasta: 30, vol: 0.25 + tam * 0.35 });
                break;
            }
            case 'golpe': ruidoCorto(t, 0.22, { desde: 1800 * v, hasta: 200, vol: 0.42 }); nota(200 * v, t, 0.22, { tipo: 'sawtooth', hasta: 70, vol: 0.14, filtro: 900 }); break;
            case 'powerup': [523, 659, 784, 1047].forEach((f, i) => nota(f, t + i * 0.06, 0.25, { tipo: 'triangle', vol: 0.16, eco: true })); break;
            case 'sinergia': [392, 587.3, 784, 1174.7].forEach((f, i) => { nota(f, t + i * 0.035, 1.2, { tipo: 'sine', vol: 0.12, ataque: 0.02, eco: true }); nota(f * 2.005, t + i * 0.035, 0.9, { tipo: 'sine', vol: 0.04, eco: true }); }); break;
            case 'nova': ruidoCorto(t, 1.6, { desde: 6000, hasta: 40, vol: 0.7, eco: true }); nota(55, t, 1.8, { tipo: 'sawtooth', hasta: 28, vol: 0.4, filtro: 600 }); [261.6, 329.6, 392, 523.3].forEach((f, i) => nota(f, t + 0.2 + i * 0.05, 1.4, { tipo: 'triangle', vol: 0.1, eco: true })); break;
            case 'dash': ruidoCorto(t, 0.18, { tipoFiltro: 'bandpass', desde: 900, hasta: 4000, vol: 0.25 }); break;
            case 'alerta': [0, 0.22].forEach(d => nota(740, t + d, 0.16, { tipo: 'square', vol: 0.08, filtro: 2400 })); break;
            case 'vida': nota(330, t, 0.5, { tipo: 'triangle', hasta: 660, vol: 0.15, eco: true }); break;
            case 'click': nota(660, t, 0.06, { tipo: 'triangle', vol: 0.1 }); break;
            case 'salto': nota(260 * v, t, 0.16, { tipo: 'square', hasta: 620 * v, rampa: 0.12, vol: 0.07, filtro: 2200 }); break;
            case 'moneda': nota(988, t, 0.07, { tipo: 'square', vol: 0.07, filtro: 5000 }); nota(1319, t + 0.06, 0.22, { tipo: 'square', vol: 0.07, filtro: 5000, eco: true }); break;
            case 'gema': [1046.5, 1318.5, 1568, 2093].forEach((f, i) => nota(f, t + i * 0.045, 0.3, { tipo: 'sine', vol: 0.1, eco: true })); break;
            case 'rebote': nota(330 * v, t, 0.07, { tipo: 'triangle', hasta: 520 * v, vol: 0.14 }); break;
            case 'paleta': nota(520 * v, t, 0.06, { tipo: 'square', vol: 0.07, filtro: 2600 }); ruidoCorto(t, 0.04, { desde: 4000, hasta: 1500, vol: 0.12 }); break;
            case 'ladrillo': { const f = (o.tono || 1) * 700 * v; nota(f, t, 0.09, { tipo: 'square', hasta: f * 0.6, vol: 0.06, filtro: 3000 }); ruidoCorto(t, 0.09, { desde: 3500, hasta: 600, vol: 0.18 }); break; }
            case 'comer': nota(400 * v, t, 0.05, { tipo: 'sine', hasta: 900, vol: 0.14 }); nota(1200, t + 0.05, 0.08, { tipo: 'triangle', vol: 0.07 }); break;
            case 'pisar': nota(180 * v, t, 0.12, { tipo: 'square', hasta: 60, vol: 0.1, filtro: 900 }); ruidoCorto(t, 0.08, { desde: 1200, hasta: 200, vol: 0.2 }); break;
            case 'choque': ruidoCorto(t, 0.35, { desde: 3000, hasta: 150, vol: 0.45 }); nota(110 * v, t, 0.3, { tipo: 'sawtooth', hasta: 50, vol: 0.16, filtro: 700 }); break;
            case 'gol': {
                // Hinchada: ruido que sube y baja + bocinazo de fanfarria
                ruidoCorto(t, 1.6, { tipoFiltro: 'bandpass', desde: 900, hasta: 1400, q: 0.6, vol: 0.32, eco: true });
                [523.3, 659.3, 784, 1046.5].forEach((f, i) => nota(f, t + 0.05 + i * 0.09, 0.4, { tipo: 'sawtooth', vol: 0.06, filtro: 2400, eco: true }));
                break;
            }
            case 'silbato': nota(2300, t, 0.35, { tipo: 'sine', vol: 0.09, detune: 0 }); nota(2360, t, 0.35, { tipo: 'sine', vol: 0.05 }); break;
            case 'chapuzon': ruidoCorto(t, 0.4, { desde: 2400, hasta: 300, vol: 0.32 }); nota(320, t, 0.25, { tipo: 'sine', hasta: 120, vol: 0.12 }); break;
            case 'disparo': ruidoCorto(t, 0.18, { desde: 3000, hasta: 300, vol: 0.32 }); nota(260 * v, t, 0.15, { tipo: 'square', hasta: 90, vol: 0.1, filtro: 1400 }); break;
            case 'punto': nota(880, t, 0.08, { tipo: 'triangle', vol: 0.13 }); nota(1320, t + 0.07, 0.16, { tipo: 'triangle', vol: 0.1, eco: true }); break;
            case 'acierto': nota(523.3, t, 0.1, { tipo: 'triangle', vol: 0.14 }); nota(784, t + 0.07, 0.2, { tipo: 'triangle', vol: 0.12, eco: true }); break;
            case 'error': nota(200, t, 0.25, { tipo: 'sawtooth', hasta: 90, vol: 0.12, filtro: 900 }); break;
            case 'victoria': [523.3, 659.3, 784, 1046.5, 1318.5].forEach((f, i) => { nota(f, t + i * 0.1, 0.5, { tipo: 'triangle', vol: 0.14, eco: true }); nota(f / 2, t + i * 0.1, 0.4, { tipo: 'square', vol: 0.04, filtro: 1500 }); }); break;
            case 'derrota': [392, 349.2, 311.1, 261.6].forEach((f, i) => nota(f, t + i * 0.16, 0.45, { tipo: 'triangle', vol: 0.12, eco: true })); break;
            case 'tick': nota(880, t, 0.06, { tipo: 'square', vol: 0.06, filtro: 3000 }); break;
            case 'ya': nota(1320, t, 0.3, { tipo: 'square', vol: 0.08, filtro: 3500, eco: true }); nota(660, t, 0.3, { tipo: 'triangle', vol: 0.1 }); break;
            case 'swoosh': ruidoCorto(t, 0.22, { tipoFiltro: 'bandpass', desde: 600, hasta: 3500, vol: 0.22 }); break;
            case 'motor': { const vel = Math.max(0, Math.min(1, o.vel || 0)); nota(70 + vel * 110, t, 0.12, { tipo: 'sawtooth', vol: 0.035 + vel * 0.03, filtro: 500 + vel * 700 }); break; }
            default: return false;
        }
        return true;
    }

    // ---------- Música generativa ----------
    // Cada tema tiene acordes, tempo y una forma de tocar el bajo, el
    // arpegio y la batería. Hay tres capas que se mezclan según el modo:
    // calma (pad y campanitas), tension (bajo y arpegio) y ritmo (batería
    // y melodía). La melodía se arma al azar con la escala del tema pero se
    // repite cada dos compases, así se pega como una canción.
    const N = (n) => 440 * Math.pow(2, (n - 69) / 12); // número MIDI → Hz
    const TEMAS = {
        aventura: { bpm: 132, acordes: [[60, 64, 67], [65, 69, 72], [67, 71, 74], [60, 64, 67]], escala: [72, 74, 76, 79, 81, 84], bajo: 'saltito', bat: 'pop', lead: 'square', pad: 'triangle' },
        carrera: { bpm: 140, acordes: [[57, 60, 64], [53, 57, 60], [55, 59, 62], [52, 55, 59]], escala: [69, 72, 74, 76, 79, 81], bajo: 'corcheas', bat: 'four', lead: 'sawtooth', pad: 'sawtooth' },
        neon: { bpm: 118, acordes: [[57, 60, 64, 67], [53, 57, 60, 64], [48, 52, 55, 59], [55, 59, 62, 65]], escala: [69, 72, 76, 79, 81, 84], bajo: 'corcheas', bat: 'synth', lead: 'sawtooth', pad: 'sawtooth' },
        deporte: { bpm: 126, acordes: [[62, 66, 69], [67, 71, 74], [64, 67, 71], [69, 73, 76]], escala: [74, 76, 78, 81, 83, 86], bajo: 'saltito', bat: 'palmas', lead: 'square', pad: 'triangle' },
        templo: { bpm: 96, acordes: [[50, 53, 57], [46, 50, 53], [48, 52, 55], [45, 49, 52]], escala: [62, 65, 67, 69, 72, 74], bajo: 'lento', bat: 'tribal', lead: 'triangle', pad: 'sine' },
        batalla: { bpm: 136, acordes: [[52, 55, 59], [48, 52, 55], [50, 53, 57], [47, 50, 54]], escala: [64, 67, 69, 71, 74, 76], bajo: 'galope', bat: 'marcha', lead: 'square', pad: 'sawtooth' },
        tranqui: { bpm: 92, acordes: [[60, 64, 67, 71], [57, 60, 64, 67], [62, 65, 69, 72], [55, 59, 62, 65]], escala: [72, 74, 76, 79, 81], bajo: 'lento', bat: 'suave', lead: 'sine', pad: 'triangle' },
        arcade: { bpm: 150, acordes: [[60, 64, 67], [57, 60, 64], [65, 69, 72], [67, 71, 74]], escala: [72, 74, 76, 79, 81, 84, 86], bajo: 'saltito', bat: 'pop', lead: 'square', pad: 'triangle' },
        agua: { bpm: 104, acordes: [[64, 68, 71], [61, 64, 68], [57, 61, 64], [59, 63, 66]], escala: [76, 78, 80, 83, 85, 88], bajo: 'lento', bat: 'suave', lead: 'sine', pad: 'sine' },
    };
    let motivo = [];
    function armarMotivo(tema) {
        const T = TEMAS[tema]; motivo = [];
        for (let i = 0; i < 32; i++) {
            // Más notas en los tiempos fuertes; silencios en el resto
            const fuerte = i % 4 === 0, prob = fuerte ? 0.75 : i % 2 === 0 ? 0.4 : 0.15;
            motivo.push(Math.random() < prob ? T.escala[Math.floor(Math.random() * T.escala.length)] : null);
        }
    }
    function bateria(T, p, t, dest) {
        const kick = (vol = 0.5) => nota(150, t, 0.18, { tipo: 'sine', hasta: 42, vol, destino: dest });
        const hat = (vol = 0.05) => ruidoCorto(t, 0.04, { tipoFiltro: 'highpass', desde: 7000, hasta: 6000, vol, destino: dest });
        const caja = (vol = 0.16) => { ruidoCorto(t, 0.13, { tipoFiltro: 'bandpass', desde: 1800, hasta: 1200, vol, destino: dest }); nota(190, t, 0.08, { tipo: 'triangle', vol: vol * 0.5, destino: dest }); };
        const palma = () => [0, 0.012, 0.024].forEach(d => ruidoCorto(t + d, 0.05, { tipoFiltro: 'bandpass', desde: 1500, hasta: 1100, vol: 0.09, destino: dest }));
        switch (T.bat) {
            case 'four': if (p % 4 === 0) kick(); if (p % 4 === 2) hat(0.08); if (p === 4 || p === 12) caja(); break;
            case 'synth': if (p === 0 || p === 8 || p === 10) kick(0.45); if (p === 4 || p === 12) caja(0.14); if (p % 2) hat(0.035); break;
            case 'pop': if (p === 0 || p === 6 || p === 8) kick(0.4); if (p === 4 || p === 12) caja(0.12); if (p % 2 === 0) hat(0.04); break;
            case 'palmas': if (p % 4 === 0) kick(0.42); if (p === 4 || p === 12) palma(); if (p % 2 === 1) hat(0.04); break;
            case 'tribal': if (p === 0 || p === 3 || p === 8 || p === 11) nota(95, t, 0.25, { tipo: 'sine', hasta: 55, vol: 0.32, destino: dest }); if (p === 6 || p === 14) nota(220, t, 0.12, { tipo: 'triangle', hasta: 160, vol: 0.12, destino: dest }); break;
            case 'marcha': if (p % 4 === 0) kick(0.45); if (p === 4 || p === 12 || p === 14) caja(0.13); if (p % 2) hat(0.035); break;
            case 'suave': if (p === 0 || p === 10) kick(0.25); if (p % 4 === 2) hat(0.025); break;
        }
    }
    function tocarPaso(t) {
        const T = TEMAS[temaAct];
        const p = paso % 16, ac = T.acordes[compas % T.acordes.length], raiz = N(ac[0] - 12), dur16 = 60 / T.bpm / 4;
        // Calma: pad del acorde al empezar el compás + alguna campanita
        if (p === 0) ac.forEach((n, i) => nota(N(n), t, dur16 * 16, { tipo: T.pad, vol: T.pad === 'sawtooth' ? 0.025 : 0.05, ataque: dur16 * 3, filtro: T.pad === 'sawtooth' ? 1300 : 0, destino: capas.calma, detune: (i - 1) * 7 }));
        if (Math.random() < 0.06) nota(N(T.escala[Math.floor(Math.random() * T.escala.length)] + 12), t, 1.4, { tipo: 'sine', vol: 0.03, destino: capas.calma });
        // Tensión: bajo + arpegio
        const bajo = T.bajo;
        if ((bajo === 'corcheas' && p % 2 === 0) || (bajo === 'saltito' && (p % 4 === 0 || p % 4 === 3)) || (bajo === 'lento' && p % 8 === 0) || (bajo === 'galope' && [0, 3, 4, 8, 11, 12].includes(p))) {
            const f = bajo === 'saltito' && p % 4 === 3 ? raiz * 1.5 : raiz;
            nota(f, t, dur16 * (bajo === 'lento' ? 7 : 1.8), { tipo: bajo === 'lento' ? 'triangle' : 'sawtooth', vol: bajo === 'lento' ? 0.12 : 0.09, filtro: 520, destino: capas.tension });
        }
        if (p % 2 === 0) nota(N(ac[(p / 2) % ac.length] + 12), t, dur16 * 1.4, { tipo: 'triangle', vol: 0.03, filtro: 2600, destino: capas.tension });
        // Ritmo: batería + melodía que se repite cada dos compases
        bateria(T, p, t, capas.ritmo);
        const m = motivo[(compas % 2) * 16 + p];
        if (m != null) nota(N(m), t, dur16 * 1.7, { tipo: T.lead, vol: T.lead === 'sine' ? 0.06 : 0.03, filtro: 2400, destino: capas.ritmo });
        paso++;
        if (paso % 16 === 0) { compas++; if (compas % 8 === 0) armarMotivo(temaAct); }
    }
    // Música del Multiverso (la original: pad lidio que respira + tensión en combate)
    const ACORDES_ESP = [[146.8, 220, 277.2, 329.6], [130.8, 196, 246.9, 329.6], [110, 164.8, 220, 277.2], [123.5, 185, 246.9, 311.1]];
    function tocarEspacio(t) {
        const ac = ACORDES_ESP[Math.floor(paso / 16) % ACORDES_ESP.length], p = paso % 16;
        if (p === 0) ac.forEach((f, i) => { nota(f, t, 7.5, { tipo: 'sine', vol: 0.07, ataque: 1.8, destino: capas.calma, detune: (i - 1.5) * 6 }); nota(f / 2, t, 7.5, { tipo: 'triangle', vol: 0.04, ataque: 2, destino: capas.calma }); });
        if (Math.random() < 0.22) nota(ac[Math.floor(Math.random() * 4)] * 4, t, 2.4, { tipo: 'sine', vol: 0.05, ataque: 0.01, destino: capas.calma });
        if (p % 4 === 0) nota(ac[0] / 2, t, 0.35, { tipo: 'sawtooth', vol: 0.12, filtro: 420, destino: capas.tension });
        if (p % 2 === 1) ruidoCorto(t, 0.06, { tipoFiltro: 'highpass', desde: 7000, hasta: 6500, vol: 0.06, destino: capas.tension });
        nota(ac[p % 4] * 2, t, 0.18, { tipo: 'triangle', vol: 0.045, filtro: 2600, destino: capas.tension });
        paso++;
    }
    // Se agenda un poquito por adelantado con el reloj del audio: el tempo queda parejo aunque el celu ande cargado.
    function programar() {
        if (!ctx || !temaAct) return;
        const dur = temaAct === 'espacio' ? 0.235 : 60 / TEMAS[temaAct].bpm / 4;
        if (proxPaso < t0()) proxPaso = t0() + 0.05;
        while (proxPaso < t0() + 0.16) { (temaAct === 'espacio' ? tocarEspacio : tocarPaso)(proxPaso); proxPaso += dur; }
    }
    function arrancarSecuenciador() { if (!timer) { proxPaso = 0; timer = setInterval(programar, 50); } }
    const MEZCLA = {
        calma: { calma: 1, tension: 0.15, ritmo: 0 },
        juego: { calma: 0.7, tension: 0.8, ritmo: 0.75 },
        combate: { calma: 0.6, tension: 1, ritmo: 1 },
        pausa: { calma: 0.45, tension: 0, ritmo: 0 },
    };
    function mezclar() {
        if (!ctx || !capas.calma) return;
        const t = t0(), apagar = silenciado() || !musicaOn || !temaAct;
        let m = MEZCLA[modoAct] || MEZCLA.juego;
        // El espacio del Multiverso: combate suma la tensión sin batería (la batería la pone el láser)
        if (temaAct === 'espacio') m = modoAct === 'combate' ? { calma: 0.6, tension: 1, ritmo: 0 } : modoAct === 'pausa' || modoAct === 'calma' ? { calma: 1, tension: modoAct === 'calma' ? 0.15 : 0, ritmo: 0 } : { calma: 1, tension: 0.15, ritmo: 0 };
        for (const k of ['calma', 'tension', 'ritmo']) { capas[k].gain.cancelScheduledValues(t); capas[k].gain.setTargetAtTime(apagar ? 0 : m[k], t, 0.5); }
    }
    function musica(tema, modo = 'juego') {
        if (tema && tema !== 'espacio' && !TEMAS[tema]) tema = 'aventura';
        if (tema !== temaAct) { temaAct = tema; paso = 0; compas = 0; if (tema && tema !== 'espacio') armarMotivo(tema); }
        modoAct = modo;
        if (!ctx) return;
        mezclar();
        if (tema) arrancarSecuenciador();
        else if (timer) { const tt = timer; setTimeout(() => { if (!temaAct && timer === tt) { clearInterval(timer); timer = null; } }, 1800); }
    }
    // Si se silencia la app con la música sonando, se apaga sola (y vuelve al prender).
    setInterval(() => { if (ctx && temaAct) mezclar(); }, 1000);
    function alternarMusica() {
        musicaOn = !musicaOn;
        try { localStorage.setItem(CLAVE_MUS, musicaOn ? 'on' : 'off'); } catch (_) { }
        iniciar(); mezclar();
        return musicaOn;
    }
    window.AudioArcade = {
        iniciar, sfx, musica, alternarMusica, TEMAS,
        musicaActiva: () => musicaOn,
        get tema() { return temaAct; }, get modo() { return modoAct; },
        get listo() { return !!ctx && ctx.state === 'running'; },
        enVivo: false,
    };
    // Atajo para los juegos: suena con el motor arcade y devuelve true (si no, el juego usa su sonido de siempre).
    window.sonarArcade = (nombre, o) => !!(ctx && sfx(nombre, o));
})();
