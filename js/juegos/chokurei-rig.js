// ============================================================
// chokurei-rig.js — Chokurei dibujado y animado.
//
// Antes Chokurei era un emoji quieto. Ahora es un gatito en SVG armado
// por partes (cuerpo, cabeza, orejas, ojos, boca, patas y cola), como
// un muñeco con articulaciones: cada parte se mueve por separado, así
// puede parpadear, mover la cola, caminar por la habitación, comer,
// lavarse la patita, bostezar, dormirse, ronronear, saltar, rodar…
//
// Sin librerías (los CDN están bloqueados desde donde se arma el
// sitio, ver sfx.js): las animaciones continuas (respirar, cola) son
// CSS y las de una vez (saltar, comer, caminar) usan la Web Animations
// API (elemento.animate), que viene en todos los navegadores.
// Los sonidos (miau, ronroneo, ñam, burbujas) se sintetizan en vivo
// con Web Audio, igual que el resto de los efectos del sitio.
//
// Uso: const ck = crearChokurei(contenedor); ck.caminarA(70); ck.comer();
// ============================================================

const PELAJES_CHOKUREI = {
    negro:   { nombre: 'Negro',   pelo: '#36303d', panza: '#5a5263', puntas: '#2a2530', ojos: '#f3d35b', borde: '#1d1922' },
    naranja: { nombre: 'Naranja', pelo: '#f0a25a', panza: '#fde3c4', puntas: '#d9823a', ojos: '#6fbf73', borde: '#a5602a' },
    gris:    { nombre: 'Gris',    pelo: '#9ea4b0', panza: '#e6e8ed', puntas: '#7b818e', ojos: '#5fb0e0', borde: '#5d626d' },
    blanco:  { nombre: 'Blanco',  pelo: '#f6f2ec', panza: '#ffffff', puntas: '#e7ddd2', ojos: '#7cc3e8', borde: '#b8aea3' },
    siames:  { nombre: 'Siamés',  pelo: '#efe1cc', panza: '#fbf4ea', puntas: '#6b4e3d', ojos: '#4f9be0', borde: '#8a6c58' },
};

// ==================== SONIDOS ====================
const sonidosChokurei = (function () {
    let ctx = null;
    const mudo = () => (typeof window.sonidoSilenciado === 'function' && window.sonidoSilenciado());
    function c(){
        if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } }
        if (ctx.state === 'suspended') ctx.resume().catch(() => {});
        return ctx;
    }
    // Maullido: una sierra que sube y baja, pasada por un filtro que
    // imita la boca abriéndose ("mi-áu").
    function miau(agudo){
        if (mudo()) return; const a = c(); if (!a) return;
        const t = a.currentTime, base = agudo ? 720 : 560, dur = agudo ? 0.45 : 0.6;
        const o = a.createOscillator(), f = a.createBiquadFilter(), g = a.createGain();
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(base, t);
        o.frequency.linearRampToValueAtTime(base * 1.45, t + dur * 0.35);
        o.frequency.linearRampToValueAtTime(base * 0.85, t + dur);
        f.type = 'bandpass'; f.Q.value = 6;
        f.frequency.setValueAtTime(900, t); f.frequency.linearRampToValueAtTime(2200, t + dur * 0.4); f.frequency.linearRampToValueAtTime(1100, t + dur);
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.22, t + 0.05); g.gain.linearRampToValueAtTime(0.16, t + dur * 0.7); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.connect(f); f.connect(g); g.connect(a.destination); o.start(t); o.stop(t + dur + 0.05);
    }
    // Ronroneo: ruido grave que "late" ~24 veces por segundo.
    function ronroneo(seg){
        if (mudo()) return; const a = c(); if (!a) return;
        const t = a.currentTime, dur = seg || 1.6;
        const buf = a.createBuffer(1, a.sampleRate * dur, a.sampleRate), d = buf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1);
        const src = a.createBufferSource(); src.buffer = buf;
        const lp = a.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 160;
        const g = a.createGain(), lfo = a.createOscillator(), lfoG = a.createGain();
        lfo.frequency.value = 24; lfoG.gain.value = 0.28; lfo.connect(lfoG); lfoG.connect(g.gain);
        g.gain.setValueAtTime(0.3, t); g.gain.setValueAtTime(0.3, t + dur - 0.3); g.gain.linearRampToValueAtTime(0, t + dur);
        src.connect(lp); lp.connect(g); g.connect(a.destination);
        src.start(t); lfo.start(t); src.stop(t + dur); lfo.stop(t + dur);
    }
    function blip(freq, dur, tipo, vol, delay){
        if (mudo()) return; const a = c(); if (!a) return;
        const t = a.currentTime + (delay || 0), o = a.createOscillator(), g = a.createGain();
        o.type = tipo || 'sine'; o.frequency.setValueAtTime(freq, t); o.frequency.exponentialRampToValueAtTime(freq * 1.6, t + dur);
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol || 0.12, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + dur + 0.02);
    }
    // Maullido con "personalidad": mimoso (trino corto), pidiendo (largo e
    // insistente), triste (grave y lento), enojado (siseo de ruido).
    function miauSegun(tipo){
        if (mudo()) return; const a = c(); if (!a) return;
        if (tipo === 'enojado') {
            const t = a.currentTime, dur = 0.6;
            const buf = a.createBuffer(1, a.sampleRate * dur, a.sampleRate), d = buf.getChannelData(0);
            for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1);
            const src = a.createBufferSource(); src.buffer = buf;
            const hp = a.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 2500;
            const g = a.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.25, t + 0.05); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
            src.connect(hp); hp.connect(g); g.connect(a.destination); src.start(t); src.stop(t + dur);
            return;
        }
        const conf = { mimoso: [900, 0.22, 1.25, 0.9], pidiendo: [620, 0.8, 1.35, 0.8], triste: [420, 0.9, 1.15, 0.7] }[tipo] || [600, 0.5, 1.45, 0.85];
        const [base, dur, sube, baja] = conf, t = a.currentTime;
        const o = a.createOscillator(), f = a.createBiquadFilter(), g = a.createGain();
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(base, t); o.frequency.linearRampToValueAtTime(base * sube, t + dur * 0.35); o.frequency.linearRampToValueAtTime(base * baja, t + dur);
        if (tipo === 'mimoso') { const l = a.createOscillator(), lg = a.createGain(); l.frequency.value = 28; lg.gain.value = 40; l.connect(lg); lg.connect(o.frequency); l.start(t); l.stop(t + dur); }
        f.type = 'bandpass'; f.Q.value = 6; f.frequency.setValueAtTime(900, t); f.frequency.linearRampToValueAtTime(2000, t + dur * 0.4); f.frequency.linearRampToValueAtTime(1000, t + dur);
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.2, t + 0.04); g.gain.linearRampToValueAtTime(0.14, t + dur * 0.7); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.connect(f); f.connect(g); g.connect(a.destination); o.start(t); o.stop(t + dur + 0.05);
        if (tipo === 'pidiendo') setTimeout(() => miauSegun('pidiendo-2'), (dur + 0.25) * 1000);
    }
    // Musiquita propia de Chokurei (una cajita de música de 8 compases).
    let musicaHasta = 0;
    function musica(alGolpe){
        if (mudo()) return 0; const a = c(); if (!a) return 0;
        const notas = [523, 659, 784, 659, 587, 698, 880, 698, 523, 659, 784, 1046, 988, 784, 659, 523];
        const t0 = a.currentTime + 0.05, paso = 0.42;
        notas.forEach((f, i) => {
            const o = a.createOscillator(), g = a.createGain(), t = t0 + i * paso;
            o.type = 'triangle'; o.frequency.value = f;
            g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.1, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + paso * 0.95);
            o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + paso);
            if (alGolpe) setTimeout(() => alGolpe(i), (t - a.currentTime) * 1000);
        });
        musicaHasta = Date.now() + notas.length * paso * 1000;
        return notas.length * paso * 1000;
    }
    return {
        miau, ronroneo, miauSegun, musica,
        nam: () => { blip(220, 0.07, 'square', 0.07); blip(180, 0.07, 'square', 0.07, 0.11); },
        burbuja: () => blip(700 + Math.random() * 600, 0.08, 'sine', 0.08),
        salto: () => blip(330, 0.18, 'triangle', 0.12),
        brillo: () => [880, 1175, 1568].forEach((f, i) => blip(f, 0.14, 'sine', 0.08, i * 0.07)),
        bostezo: () => { if (mudo()) return; const a = c(); if (!a) return; const t = a.currentTime, o = a.createOscillator(), g = a.createGain();
            o.type = 'triangle'; o.frequency.setValueAtTime(420, t); o.frequency.linearRampToValueAtTime(260, t + 0.9);
            g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.1, t + 0.15); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.95);
            o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + 1); },
        atrapar: () => { blip(523, 0.1, 'triangle', 0.12); blip(784, 0.14, 'triangle', 0.12, 0.08); },
    };
})();

// ==================== EL DIBUJO ====================
// viewBox 0 0 120 120, mirando de frente, sentado. Las clases de la
// raíz (.ojos-felices, .orejas-bajas, .boca-abierta…) cambian la cara.
function svgChokurei(){
    return `<svg class="ck-svg" viewBox="0 0 120 124" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <ellipse class="ck-sombra" cx="60" cy="114" rx="27" ry="4.5"/>
    <g class="ck-cuerpo-g">
        <g class="ck-ropa ck-ropa-capa"><path d="M41 76 Q 30 96 24 114 L 96 114 Q 90 96 79 76 Z" fill="#8e6cf0" stroke="#5f43b8" stroke-width="1"/><path d="M41 76 Q 60 84 79 76" fill="none" stroke="#ffd34d" stroke-width="2.5"/></g>
        <g class="ck-forma ck-forma-angel"><path d="M38 86 C 14 70, 8 96, 22 104 C 28 98, 34 96, 40 96 Z M82 86 C 106 70, 112 96, 98 104 C 92 98, 86 96, 80 96 Z" fill="#ffffff" stroke="#e3dcff" stroke-width="1.2"/></g>
        <g class="ck-cola"><path class="ck-cola-trazo" d="M80 102 C 100 100, 104 82, 98 66"/><path class="ck-cola-punta" d="M99.5 71 C 100.5 68, 99.5 65, 98 63"/></g>
        <ellipse class="ck-pelo ck-cuerpo" cx="60" cy="93" rx="24" ry="20"/>
        <ellipse class="ck-panza" cx="60" cy="98" rx="13.5" ry="13"/>
        <g class="ck-pata ck-pata-i"><ellipse class="ck-puntas" cx="50" cy="110" rx="7.5" ry="5"/><path class="ck-dedos" d="M47.5 109 v3 M51 109.3 v3"/></g>
        <g class="ck-pata ck-pata-d"><ellipse class="ck-puntas" cx="70" cy="110" rx="7.5" ry="5"/><path class="ck-dedos" d="M69 109.3 v3 M72.5 109 v3"/></g>
        <g class="ck-ropa ck-ropa-calabaza"><ellipse cx="60" cy="95" rx="26.5" ry="20.5" fill="#ff9a3c" stroke="#d96d14" stroke-width="1.2"/><path d="M48 77 Q 44 95 48 114 M60 75 V 115 M72 77 Q 76 95 72 114" fill="none" stroke="#d96d14" stroke-width="1"/><path d="M52 92 l3 -4 l3 4 Z M62 92 l3 -4 l3 4 Z M53 100 q7 5 14 0" fill="#5a2a00"/></g>
        <g class="ck-ropa ck-ropa-bufanda"><path d="M37 74 Q 60 87 83 74 L 83 81 Q 60 94 37 81 Z" fill="#ff6b81" stroke="#d94a63" stroke-width="0.9"/><path d="M45 79 L 45 85 M53 81 L 53 88 M61 82 L 61 89 M69 81 L 69 87 M77 79 L 77 84" stroke="#fff" stroke-width="1.6" opacity="0.8"/><path d="M71 83 L 79 101 L 71 102 L 66 85 Z" fill="#ff6b81" stroke="#d94a63" stroke-width="0.9"/></g>
        <g class="ck-cabeza">
            <g class="ck-oreja ck-oreja-i"><path class="ck-puntas" d="M33 50 L 37 18 L 58 37 Z"/><path class="ck-oreja-int" d="M38.5 45 L 40.5 26 L 52 37.5 Z"/></g>
            <g class="ck-oreja ck-oreja-d"><path class="ck-puntas" d="M87 50 L 83 18 L 62 37 Z"/><path class="ck-oreja-int" d="M81.5 45 L 79.5 26 L 68 37.5 Z"/></g>
            <ellipse class="ck-pelo ck-cara" cx="60" cy="56" rx="31" ry="26"/>
            <g class="ck-rasgos">
            <ellipse class="ck-mascara" cx="60" cy="63" rx="15" ry="11"/>
            <g class="ck-cejas"><path d="M39 43 L 53 47"/><path d="M81 43 L 67 47"/></g>
            <g class="ck-ojo ck-ojo-i" transform="translate(47 54)">
                <g class="ck-ojo-abierto"><ellipse class="ck-iris" rx="6" ry="7.2"/><ellipse class="ck-pupila" rx="3" ry="5.4"/><circle class="ck-brillo" cx="-1.8" cy="-2.8" r="1.9"/><circle class="ck-brillo" cx="1.6" cy="1.8" r="0.9"/><path class="ck-parpado-triste" d="M-7 -5 L 7 -8 L 7 -10 L -7 -10 Z"/></g>
                <path class="ck-ojo-feliz" d="M-5.5 1.5 Q 0 -5 5.5 1.5"/>
                <path class="ck-ojo-cerrado" d="M-5.5 0 Q 0 3.5 5.5 0"/>
                <path class="ck-ojo-espiral" d="M0 0 m-1 0 a1 1 0 1 1 2 0 a2 2 0 1 1 -4 0 a3 3 0 1 1 6 0 a4 4 0 1 1 -8 0"/>
            </g>
            <g class="ck-ojo ck-ojo-d" transform="translate(73 54)">
                <g class="ck-ojo-abierto"><ellipse class="ck-iris" rx="6" ry="7.2"/><ellipse class="ck-pupila" rx="3" ry="5.4"/><circle class="ck-brillo" cx="-1.8" cy="-2.8" r="1.9"/><circle class="ck-brillo" cx="1.6" cy="1.8" r="0.9"/><path class="ck-parpado-triste" d="M-7 -8 L 7 -5 L 7 -10 L -7 -10 Z"/></g>
                <path class="ck-ojo-feliz" d="M-5.5 1.5 Q 0 -5 5.5 1.5"/>
                <path class="ck-ojo-cerrado" d="M-5.5 0 Q 0 3.5 5.5 0"/>
                <path class="ck-ojo-espiral" d="M0 0 m-1 0 a1 1 0 1 1 2 0 a2 2 0 1 1 -4 0 a3 3 0 1 1 6 0 a4 4 0 1 1 -8 0"/>
            </g>
            <ellipse class="ck-cachete" cx="40" cy="64" rx="5.5" ry="3.2"/>
            <ellipse class="ck-cachete" cx="80" cy="64" rx="5.5" ry="3.2"/>
            <path class="ck-nariz" d="M57.6 60.5 h4.8 l-2.4 2.8 Z"/>
            <path class="ck-boca ck-boca-normal" d="M54.5 64.2 Q 57.2 67.5 60 64.2 Q 62.8 67.5 65.5 64.2"/>
            <path class="ck-boca ck-boca-triste" d="M55 67.5 Q 60 63.5 65 67.5"/>
            <g class="ck-boca ck-boca-abierta"><path d="M55 64 Q 60 75 65 64 Z" class="ck-boca-int"/><path d="M57 68.5 Q 60 71.5 63 68.5" class="ck-lengua"/></g>
            <ellipse class="ck-boca ck-boca-o" cx="60" cy="66.5" rx="2.4" ry="3"/>
            <g class="ck-bigotes"><path d="M44 62 L 28 59 M44 65 L 28 66 M76 62 L 92 59 M76 65 L 92 66"/></g>
            <g class="ck-termometro"><rect x="63" y="64" width="16" height="3" rx="1.5" fill="#fff" stroke="#c9c9c9" stroke-width="0.6"/><circle cx="78.5" cy="65.5" r="2.2" fill="#ff5c6c"/></g>
            <!-- Accesorios: se ven según el nivel (ver mascota.js) -->
            <g class="ck-acc ck-acc-mono"><path d="M78 30 l-7 -5 v10 z M78 30 l7 -5 v10 z" fill="#ff7aa2" stroke="#d94f7c" stroke-width="0.8"/><circle cx="78" cy="30" r="2.2" fill="#ff9dbb"/></g>
            <g class="ck-acc ck-acc-corona"><path d="M48 29 L 50 18 L 55 24 L 60 15 L 65 24 L 70 18 L 72 29 Z" fill="#ffd34d" stroke="#d1a21c" stroke-width="0.9"/><circle cx="60" cy="22" r="1.6" fill="#ff6f91"/></g>
            </g>
            <g class="ck-acc ck-acc-anteojos"><circle cx="47" cy="54" r="8" fill="rgba(30,30,40,0.55)" stroke="#222" stroke-width="1.4"/><circle cx="73" cy="54" r="8" fill="rgba(30,30,40,0.55)" stroke="#222" stroke-width="1.4"/><path d="M55 54 h10" stroke="#222" stroke-width="1.4"/></g>
            <g class="ck-ropa ck-ropa-gorrolana"><path d="M33 38 Q 60 2 87 38 Z" fill="#7ec8ff" stroke="#4aa6dd" stroke-width="1"/><path d="M33 38 Q 60 30 87 38 L 87 44 Q 60 36 33 44 Z" fill="#ffd34d" stroke="#d1a21c" stroke-width="0.8"/><circle cx="60" cy="9" r="5" fill="#fff" stroke="#ddd" stroke-width="0.6"/></g>
            <g class="ck-ropa ck-ropa-navidad"><path d="M36 36 Q 52 2 86 12 Q 70 20 82 36 Z" fill="#e8384f" stroke="#b5243a" stroke-width="1"/><path d="M33 36 Q 60 28 86 36 L 86 42 Q 60 34 33 42 Z" fill="#fff"/><circle cx="88" cy="13" r="4.5" fill="#fff"/></g>
            <g class="ck-ropa ck-ropa-hoja"><path d="M58 32 q2 -8 7 -10 q-1 7 -7 10 Z" fill="#5fbf6b"/><path d="M58 33 v-5" stroke="#5a3a1a" stroke-width="2"/></g>
            <g class="ck-forma ck-forma-angel"><ellipse cx="60" cy="16" rx="16" ry="4" fill="none" stroke="#ffd84d" stroke-width="3"/></g>
            <g class="ck-forma ck-forma-mago"><path d="M38 34 L 62 -6 L 84 34 Z" fill="#5b3fd1" stroke="#3a2697" stroke-width="1"/><path d="M33 34 Q 60 26 88 34 L 88 39 Q 60 31 33 39 Z" fill="#3a2697"/><text x="56" y="22" font-size="9" fill="#ffd84d">✦</text><text x="66" y="10" font-size="6" fill="#ffd84d">✦</text></g>
            <g class="ck-forma ck-forma-astronauta"><circle cx="60" cy="56" r="37" fill="rgba(180,225,255,0.22)" stroke="#e8f4ff" stroke-width="3"/><path d="M38 34 Q 50 26 58 30" stroke="#fff" stroke-width="2.5" fill="none" opacity="0.8"/><circle cx="96" cy="44" r="3" fill="#ff6b6b"/></g>
            <g class="ck-forma ck-forma-pirata"><path d="M33 36 Q 60 6 87 36 Q 60 28 33 36 Z" fill="#2b2530" stroke="#111" stroke-width="1"/><text x="54" y="31" font-size="9" fill="#fff">☠</text><path d="M66 48 h14 v10 h-14 z" fill="#111"/><path d="M33 50 L 66 50 M80 50 L 88 47" stroke="#111" stroke-width="1.4"/></g>
            <g class="ck-acc ck-acc-gorro"><path d="M44 31 L 56 4 L 66 33 Z" fill="#8fd3ff" stroke="#4aa6dd" stroke-width="0.9"/><path d="M48 23 L 61 19 M51 15 L 59 12" stroke="#ff7aa2" stroke-width="2"/><circle cx="56" cy="4" r="3" fill="#ffd34d"/></g>
        </g>
        <g class="ck-mugre"><circle cx="46" cy="88" r="3"/><circle cx="73" cy="95" r="2.4"/><circle cx="64" cy="82" r="1.8"/><circle cx="52" cy="104" r="2"/></g>
    </g>
    </svg>`;
}

// ==================== EL PERSONAJE ====================
function crearChokurei(contenedor){
    const actor = document.createElement('div');
    actor.className = 'ck-actor';
    actor.innerHTML = `<div class="ck-volteo">${svgChokurei()}</div><div class="ck-globo"></div>`;
    contenedor.appendChild(actor);
    const svg = actor.querySelector('svg');
    const q = (s) => svg.querySelector(s);
    const qa = (s) => svg.querySelectorAll(s);
    const volteo = actor.querySelector('.ck-volteo');
    const globo = actor.querySelector('.ck-globo');

    let x = 50;              // posición horizontal (% de la habitación)
    let ocupado = false;     // haciendo una acción "de una vez"
    let siguiendo = false;   // persiguiendo el láser o una mariposa
    let dormido = false;
    let timers = [];
    const vivo = () => document.body.contains(actor);
    const despues = (ms, fn) => { const t = setTimeout(() => { timers = timers.filter(y => y !== t); if (vivo()) fn(); }, ms); timers.push(t); return t; };
    const esperar = (ms) => new Promise(res => despues(ms, res));
    const reducido = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const anim = (el, frames, opts) => el ? el.animate(frames, { easing: 'ease-in-out', ...opts }) : { finished: Promise.resolve(), cancel(){} };

    function clases(agregar, sacar){
        (sacar || []).forEach(c => svg.classList.remove(c));
        (agregar || []).forEach(c => svg.classList.add(c));
    }
    const CARAS = ['ojos-felices', 'ojos-cerrados', 'ojos-tristes', 'ojos-espiral', 'boca-abierta', 'boca-triste', 'orejas-bajas'];

    // ---------- Partículas (corazones, zzz, burbujas, migas, brillos) ----------
    function particula(texto, opts){
        const o = { dx: 0, dy: -70, dur: 1400, desde: 'cabeza', tam: 1.1, ...opts };
        const p = document.createElement('div');
        p.className = 'ck-particula';
        p.textContent = texto;
        p.style.fontSize = o.tam + 'rem';
        const r = actor.getBoundingClientRect(), rc = contenedor.getBoundingClientRect();
        const bx = (r.left - rc.left) + r.width * (o.desde === 'boca' ? 0.5 : o.desde === 'cuerpo' ? 0.5 + (Math.random() - 0.5) * 0.5 : 0.5 + (Math.random() - 0.5) * 0.4);
        const by = (r.top - rc.top) + r.height * (o.desde === 'boca' ? 0.52 : o.desde === 'cuerpo' ? 0.75 : 0.25);
        p.style.left = bx + 'px'; p.style.top = by + 'px';
        contenedor.appendChild(p);
        p.animate([{ transform: 'translate(-50%,-50%) scale(0.4)', opacity: 0 }, { transform: 'translate(-50%,-50%) scale(1)', opacity: 1, offset: 0.15 },
            { transform: `translate(calc(-50% + ${o.dx}px), calc(-50% + ${o.dy}px)) scale(0.9)`, opacity: 0 }], { duration: o.dur, easing: 'ease-out' })
            .finished.then(() => p.remove());
    }
    function decir(texto, ms){
        globo.textContent = texto;
        globo.classList.add('visible');
        clearTimeout(globo._t);
        globo._t = setTimeout(() => globo.classList.remove('visible'), ms || 1800);
    }

    // ---------- Parpadeo, orejas y mirada ----------
    function parpadear(){
        if (svg.classList.contains('ojos-cerrados') || svg.classList.contains('ojos-felices')) return;
        qa('.ck-ojo-abierto').forEach(o => anim(o, [{ transform: 'scaleY(1)' }, { transform: 'scaleY(0.08)' }, { transform: 'scaleY(1)' }], { duration: 170 }));
    }
    (function cicloParpadeo(){ despues(1800 + Math.random() * 3500, () => { if (!dormido) parpadear(); if (Math.random() < 0.25) despues(220, parpadear); cicloParpadeo(); }); })();
    (function cicloOrejas(){ despues(3000 + Math.random() * 6000, () => {
        const o = q(Math.random() < 0.5 ? '.ck-oreja-i' : '.ck-oreja-d');
        if (!dormido) anim(o, [{ transform: 'rotate(0)' }, { transform: `rotate(${o.classList.contains('ck-oreja-i') ? -14 : 14}deg)` }, { transform: 'rotate(0)' }], { duration: 260 });
        cicloOrejas();
    }); })();
    // Los ojos siguen al dedo / al mouse.
    function mirarHacia(px, py){
        if (dormido) return;
        const r = svg.getBoundingClientRect();
        const cx = r.left + r.width / 2, cy = r.top + r.height * 0.44;
        const ang = Math.atan2(py - cy, px - cx), dist = Math.min(1, Math.hypot(px - cx, py - cy) / 160);
        const flip = volteo.classList.contains('izquierda') ? -1 : 1;
        qa('.ck-pupila, .ck-brillo').forEach(p => { p.style.transform = `translate(${Math.cos(ang) * 1.8 * dist * flip}px, ${Math.sin(ang) * 1.6 * dist}px)`; });
    }
    function mirarAlFrente(){ qa('.ck-pupila, .ck-brillo').forEach(p => { p.style.transform = ''; }); }
    const alMover = (e) => mirarHacia(e.clientX, e.clientY);
    window.addEventListener('pointermove', alMover, { passive: true });

    // ---------- Movimientos ----------
    function mirarA(lado){ volteo.classList.toggle('izquierda', lado === 'izquierda'); }
    async function caminarA(destino, rapido){
        destino = Math.max(14, Math.min(86, destino));
        const dist = Math.abs(destino - x);
        if (dist < 1.5) return;
        mirarA(destino < x ? 'izquierda' : 'derecha');
        const dur = reducido ? 10 : dist * (rapido ? 11 : 26) + 200;
        svg.classList.add('caminando');
        if (rapido) svg.classList.add('corriendo');
        const a = anim(actor, [{ left: x + '%' }, { left: destino + '%' }], { duration: dur, easing: 'ease-in-out', fill: 'forwards' });
        await a.finished.catch(() => {});
        x = destino; actor.style.left = x + '%'; a.cancel?.();
        svg.classList.remove('caminando', 'corriendo');
    }
    async function saltar(alto){
        sonidosChokurei.salto();
        const h = alto || 34;
        await anim(volteo, [{ transform: 'translateY(0) scale(1,1)' }, { transform: 'translateY(0) scale(1.12,0.86)', offset: 0.15 },
            { transform: `translateY(-${h}px) scale(0.92,1.1)`, offset: 0.5 }, { transform: 'translateY(0) scale(1.1,0.9)', offset: 0.85 }, { transform: 'translateY(0) scale(1,1)' }],
            { duration: 620 }).finished.catch(() => {});
    }
    async function rodar(){
        await anim(volteo, [{ transform: 'rotate(0)' }, { transform: 'translateY(-14px) rotate(180deg)', offset: 0.5 }, { transform: 'rotate(360deg)' }], { duration: 800 }).finished.catch(() => {});
    }

    // Una acción "de una vez" a la vez: si llega otra mientras tanto, espera.
    // Red de seguridad: si alguna se colgara, a los 10 s la cola sigue igual.
    let cola = Promise.resolve();
    function accion(fn){
        cola = cola.then(async () => { ocupado = true; try { await Promise.race([fn(), new Promise(r => setTimeout(r, 10000))]); } catch (e) {} finally { ocupado = false; } });
        return cola;
    }

    function cara(lista, ms){
        clases(lista, CARAS);
        if (ms) despues(ms, () => clases([], lista));
    }

    const ck = {
        actor, decir, particula, caminarA, saltar, mirarA, mirarHacia, mirarAlFrente,
        get x(){ return x; },
        get ocupado(){ return ocupado || siguiendo; },
        get dormido(){ return dormido; },
        ponerX(nx){ x = nx; actor.style.left = x + '%'; },
        estilo(pelajeId, etapa, accesorios){
            const p = PELAJES_CHOKUREI[pelajeId] || PELAJES_CHOKUREI.negro;
            svg.style.setProperty('--ck-pelo', p.pelo); svg.style.setProperty('--ck-panza', p.panza);
            svg.style.setProperty('--ck-puntas', pelajeId === 'siames' ? p.puntas : p.pelo); svg.style.setProperty('--ck-ojos', p.ojos);
            svg.style.setProperty('--ck-borde', p.borde);
            svg.classList.toggle('siames', pelajeId === 'siames');
            actor.dataset.etapa = etapa || 'bebe';
            ['mono', 'corona', 'anteojos', 'gorro'].forEach(a => svg.classList.toggle('con-' + a, !!(accesorios || []).includes(a)));
        },
        // Ropa puesta (una a la vez): 'bufanda', 'gorrolana', 'capa', 'calabaza', 'navidad' o null.
        vestir(ropaId){
            ['bufanda', 'gorrolana', 'capa', 'calabaza', 'navidad'].forEach(r => svg.classList.toggle('ropa-' + r, r === ropaId));
            svg.classList.toggle('ropa-hoja', ropaId === 'calabaza');
        },
        // Un pasito de baile al ritmo (no usa la cola de acciones: se puede
        // llamar en cada golpe de la música).
        golpe(i){
            if (dormido) return;
            const lado = i % 2 ? 1 : -1;
            anim(volteo, [{ transform: 'translateY(0) rotate(0)' }, { transform: `translateY(-7px) rotate(${lado * 8}deg)` }, { transform: 'translateY(0) rotate(0)' }], { duration: 300 });
            if (i % 4 === 0) particula(['🎵', '🎶', '✨'][Math.floor(i / 4) % 3], { dx: lado * 40, dy: -50, dur: 1200 });
            if (i === 0) clases(['ojos-felices'], []);
        },
        // Forma especial (nivel 15): 'angel', 'mago', 'astronauta', 'pirata' o null.
        forma(id){
            ['angel', 'mago', 'astronauta', 'pirata'].forEach(f => svg.classList.toggle('forma-' + f, f === id));
        },
        // ---------- Trucos ----------
        truco(id){
            return accion(async () => {
                if (dormido) { dormido = false; svg.classList.remove('dormido', 'ojos-cerrados'); }
                mirarAlFrente();
                const pd = q('.ck-pata-d'), cabeza = q('.ck-cabeza');
                if (id === 'patita') {
                    cara(['ojos-felices']);
                    decir('¡Patita! 🐾', 1600);
                    await anim(pd, [{ transform: 'translate(0,0) scale(1)' }, { transform: 'translate(-4px,-20px) scale(1.5)', offset: 0.35 }, { transform: 'translate(-4px,-20px) scale(1.5)', offset: 0.75 }, { transform: 'translate(0,0) scale(1)' }], { duration: 1500 }).finished;
                } else if (id === 'sentarse') {
                    decir('¡Sentado! 😼', 1400);
                    await anim(volteo, [{ transform: 'scale(1,1)' }, { transform: 'scale(1.08,0.88)', offset: 0.3 }, { transform: 'scale(1.08,0.88)', offset: 0.8 }, { transform: 'scale(1,1)' }], { duration: 1400 }).finished;
                    ck.expresion('guino', 900);
                } else if (id === 'girar') {
                    cara(['ojos-felices', 'boca-abierta']);
                    svg.classList.add('caminando');
                    await anim(volteo, [{ transform: 'rotateY(0)' }, { transform: 'rotateY(360deg)' }], { duration: 900 }).finished;
                    svg.classList.remove('caminando');
                    decir('¡Tarán! ✨', 1200);
                } else if (id === 'saludar') {
                    cara(['ojos-felices']);
                    decir('¡Holaaa! 👋', 1600);
                    await anim(pd, [{ transform: 'translate(0,0) rotate(0)' }, { transform: 'translate(8px,-46px) rotate(-20deg)', offset: 0.2 }, { transform: 'translate(12px,-48px) rotate(20deg)', offset: 0.35 },
                        { transform: 'translate(8px,-46px) rotate(-20deg)', offset: 0.5 }, { transform: 'translate(12px,-48px) rotate(20deg)', offset: 0.65 }, { transform: 'translate(0,0) rotate(0)' }], { duration: 1600 }).finished;
                } else if (id === 'besito') {
                    ck.expresion('guino', 1600);
                    clases(['boca-abierta']);
                    await anim(cabeza, [{ transform: 'rotate(0)' }, { transform: 'rotate(-8deg) translateY(-2px)' }, { transform: 'rotate(0)' }], { duration: 600 }).finished;
                    clases([], ['boca-abierta']);
                    for (let i = 0; i < 3; i++) particula('💋', { dx: 40 + i * 15, dy: -40 - i * 10, dur: 1300, tam: 1.2 });
                    decir('Mua 😘', 1400);
                } else if (id === 'muerto') {
                    decir('¡Bang! 🔫', 900);
                    await esperar(500);
                    cara(['ojos-espiral', 'boca-abierta']);
                    await anim(volteo, [{ transform: 'rotate(0) translateY(0)' }, { transform: 'rotate(90deg) translateY(-18%)' }], { duration: 450, fill: 'forwards' }).finished;
                    particula('💫', { dur: 1300 });
                    await esperar(1700);
                    volteo.getAnimations().forEach(a => a.cancel());
                    cara([]);
                    await saltar(20);
                    decir('¡Jaja, era chiste! 😹', 1600);
                }
                cara([]);
            });
        },
        // Cara pasajera: 'sorprendido', 'enojado' o 'guino'.
        expresion(id, ms){
            ['sorprendido', 'enojado', 'guino'].forEach(c => svg.classList.remove(c));
            if (id === 'enojado') sonidosChokurei.miauSegun('enojado');
            if (id === 'enojado') clases(['orejas-bajas'], ['ojos-felices', 'ojos-cerrados']);
            svg.classList.add(id);
            despues(ms || 1600, () => { svg.classList.remove(id); if (id === 'enojado') clases([], ['orejas-bajas']); });
        },
        // Lo que sueña mientras duerme (burbujita cada tanto).
        suenos: ['🐟', '💕', '🦋', '🧶', '👫', '🌙', '🍣'],
        // Estado de fondo según el ánimo (no es una acción de una vez).
        animo(id, opts){
            const o = opts || {};
            svg.classList.toggle('enfermo', id === 'enferma');
            svg.classList.toggle('triste', id === 'triste' || id === 'deprimido');
            svg.classList.toggle('muy-triste', id === 'deprimido');
            svg.classList.toggle('de-fiesta', id === 'fiesta');
            svg.classList.toggle('sucio', (o.higiene ?? 100) < 35);
            svg.classList.toggle('muy-sucio', (o.higiene ?? 100) < 15);
            if (!ocupado && !dormido) {
                clases(id === 'enferma' ? ['ojos-espiral', 'boca-triste', 'orejas-bajas']
                    : id === 'deprimido' ? ['ojos-tristes', 'boca-triste', 'orejas-bajas']
                    : id === 'triste' ? ['ojos-tristes', 'orejas-bajas'] : [], CARAS);
            }
        },
        // ---------- Acciones ----------
        maullar(texto, tono){
            return accion(async () => {
                const antes = [...svg.classList].filter(c => CARAS.includes(c));
                clases(['boca-abierta'], ['boca-triste']);
                if (tono) sonidosChokurei.miauSegun(tono); else sonidosChokurei.miau(Math.random() < 0.5);
                decir(texto || ['¡Miau!', 'Miau 💕', 'Mrrp?', '¡Miauuu!'][Math.floor(Math.random() * 4)]);
                await anim(q('.ck-cabeza'), [{ transform: 'rotate(0)' }, { transform: 'rotate(-6deg) translateY(-2px)' }, { transform: 'rotate(0)' }], { duration: 520 }).finished;
                clases(antes, ['boca-abierta']);
            });
        },
        alegrarse(){
            return accion(async () => {
                cara(['ojos-felices', 'boca-abierta']);
                sonidosChokurei.miau(true);
                for (let i = 0; i < 3; i++) particula(['💖', '💕', '✨'][i], { dx: (i - 1) * 30, dur: 1300 });
                await saltar();
                cara([]);
            });
        },
        comer(emoji){
            return accion(async () => {
                if (dormido) await ck.despertar();
                await caminarA(76);
                mirarA('derecha');
                cara(['ojos-felices']);
                const cabeza = q('.ck-cabeza');
                for (let i = 0; i < 4; i++) {
                    clases(['boca-abierta'], []);
                    sonidosChokurei.nam();
                    particula(i % 2 ? '·' : '✦', { desde: 'boca', dx: (Math.random() - 0.5) * 50, dy: 30, dur: 600, tam: 0.8 });
                    await anim(cabeza, [{ transform: 'translateY(0) rotate(0)' }, { transform: 'translateY(7px) rotate(4deg)' }, { transform: 'translateY(0) rotate(0)' }], { duration: 330 }).finished;
                    clases([], ['boca-abierta']);
                }
                decir('¡Ñam ñam! ' + (emoji || '🐟'));
                // Se relame.
                clases(['boca-abierta']); await esperar(260); clases([], ['boca-abierta']);
                particula('💛', { dur: 1200 });
                cara([]);
            });
        },
        jugarCon(){
            return accion(async () => {
                if (dormido) await ck.despertar();
                cara(['ojos-felices', 'boca-abierta']);
                await caminarA(x < 50 ? 72 : 28, true);
                await saltar(40);
                await rodar();
                particula('🧶', { dy: -50 }); particula('✨', { dx: 30 });
                cara([]);
            });
        },
        ronronear(seg){
            return accion(async () => {
                if (dormido) { sonidosChokurei.ronroneo(1.2); return; }
                cara(['ojos-felices']);
                sonidosChokurei.ronroneo(seg || 1.6);
                decir('Prrrr… 💜', (seg || 1.6) * 1000);
                const a = anim(q('.ck-cuerpo-g'), [{ transform: 'translateX(0)' }, { transform: 'translateX(0.6px)' }, { transform: 'translateX(-0.6px)' }], { duration: 80, iterations: Math.round((seg || 1.6) * 1000 / 80) });
                for (let i = 0; i < 3; i++) despues(i * 450, () => particula('💜', { dx: (Math.random() - 0.5) * 60, dur: 1200 }));
                await a.finished.catch(() => {});
                cara([]);
            });
        },
        lavarse(){
            return accion(async () => {
                cara(['ojos-cerrados']);
                const pata = q('.ck-pata-d'), cabeza = q('.ck-cabeza');
                anim(cabeza, [{ transform: 'rotate(0)' }, { transform: 'rotate(8deg)' }, { transform: 'rotate(8deg)', offset: 0.85 }, { transform: 'rotate(0)' }], { duration: 1800 });
                await anim(pata, [{ transform: 'translate(0,0)' }, { transform: 'translate(-6px,-38px)', offset: 0.15 }, { transform: 'translate(-9px,-44px)', offset: 0.3 }, { transform: 'translate(-6px,-38px)', offset: 0.45 },
                    { transform: 'translate(-9px,-44px)', offset: 0.6 }, { transform: 'translate(-6px,-38px)', offset: 0.75 }, { transform: 'translate(0,0)' }], { duration: 1800 }).finished;
                cara([]);
            });
        },
        bostezar(){
            return accion(async () => {
                cara(['ojos-cerrados', 'boca-abierta', 'orejas-bajas']);
                sonidosChokurei.bostezo();
                await anim(q('.ck-cuerpo-g'), [{ transform: 'scale(1,1)' }, { transform: 'scale(1.06,0.94)' }, { transform: 'scale(1,1)' }], { duration: 1000 }).finished;
                cara([]);
            });
        },
        estirarse(){
            return accion(async () => {
                cara(['ojos-cerrados']);
                await anim(volteo, [{ transform: 'scale(1,1)' }, { transform: 'scale(1.18,0.82) translateY(6px)', offset: 0.4 }, { transform: 'scale(1.18,0.82) translateY(6px)', offset: 0.7 }, { transform: 'scale(1,1)' }], { duration: 1400 }).finished;
                cara([]);
            });
        },
        bailar(){
            return accion(async () => {
                cara(['ojos-felices', 'boca-abierta']);
                await anim(volteo, [{ transform: 'rotate(0)' }, { transform: 'rotate(-12deg) translateY(-6px)' }, { transform: 'rotate(0)' }, { transform: 'rotate(12deg) translateY(-6px)' }, { transform: 'rotate(0)' }], { duration: 700, iterations: 3 }).finished;
                particula('🎶', { dx: -30 }); particula('🎉', { dx: 30 });
                cara([]);
            });
        },
        // ---------- Momentos raros ----------
        perseguirCola(){
            return accion(async () => {
                cara(['ojos-felices']);
                svg.classList.add('caminando', 'corriendo');
                await anim(volteo, [{ transform: 'rotate(0)' }, { transform: 'rotate(360deg)' }], { duration: 650, iterations: 3, easing: 'linear' }).finished;
                svg.classList.remove('caminando', 'corriendo');
                ck.expresion('sorprendido', 900);
                decir('¿Eh? ¿De quién es esta cola?', 1800);
                cara([]);
            });
        },
        mirarLaNada(){
            return accion(async () => {
                mirarAlFrente();
                ck.expresion('sorprendido', 2600);
                qa('.ck-pupila').forEach(p => { p.style.transform = 'translate(1.5px,-2px) scale(0.7)'; });
                await esperar(2500);
                mirarAlFrente();
                decir('…👀', 1200);
            });
        },
        biscochitos(){
            return accion(async () => {
                cara(['ojos-felices']);
                sonidosChokurei.ronroneo(2.2);
                const pi = q('.ck-pata-i'), pd = q('.ck-pata-d');
                for (let i = 0; i < 4; i++) {
                    await anim(i % 2 ? pd : pi, [{ transform: 'translateY(0)' }, { transform: 'translateY(-5px)' }, { transform: 'translateY(0)' }], { duration: 380 }).finished;
                }
                particula('💜', { dur: 1200 });
                cara([]);
            });
        },
        zoomies(){
            return accion(async () => {
                ck.expresion('sorprendido', 3500);
                decir('¡ZOOM! 💨', 1500);
                for (const destino of [84, 16, 80, 50]) await caminarA(destino, true);
                cara(['ojos-felices']); await esperar(400); cara([]);
            });
        },
        // Manotazo hacia un costado (para tirar la planta, jugar con la pelota).
        manotazo(){
            return accion(async () => {
                ck.expresion('guino', 900);
                await anim(q('.ck-pata-d'), [{ transform: 'translate(0,0)' }, { transform: 'translate(10px,-16px)', offset: 0.4 }, { transform: 'translate(18px,-6px)', offset: 0.6 }, { transform: 'translate(0,0)' }], { duration: 520 }).finished;
            });
        },
        rascar(){
            return accion(async () => {
                cara(['ojos-felices']);
                const pi = q('.ck-pata-i'), pd = q('.ck-pata-d');
                for (let i = 0; i < 6; i++) await anim(i % 2 ? pd : pi, [{ transform: 'translateY(0)' }, { transform: 'translateY(-30px)' }, { transform: 'translateY(-14px)' }], { duration: 230 }).finished;
                particula('✨', { dx: 20, dur: 900 });
                cara([]);
            });
        },
        // Se mete en algo (caja/cama): se agacha hasta que sólo asoma la cabeza.
        meterse(adentro){
            svg.classList.toggle('adentro', !!adentro);
        },
        tiritar(){
            return accion(async () => {
                await anim(volteo, [{ transform: 'translateX(0)' }, { transform: 'translateX(-2px)' }, { transform: 'translateX(2px)' }, { transform: 'translateX(0)' }], { duration: 160, iterations: 8 }).finished;
            });
        },
        sacudirse(){
            return accion(async () => {
                cara(['ojos-cerrados']);
                for (let i = 0; i < 6; i++) particula('💧', { desde: 'cuerpo', dx: (Math.random() - 0.5) * 120, dy: -20 - Math.random() * 30, dur: 700, tam: 0.9 });
                await anim(volteo, [{ transform: 'rotate(0)' }, { transform: 'rotate(-10deg)' }, { transform: 'rotate(10deg)' }, { transform: 'rotate(0)' }], { duration: 180, iterations: 5 }).finished;
                cara(['ojos-felices']);
                sonidosChokurei.brillo();
                for (let i = 0; i < 4; i++) particula('✨', { desde: 'cuerpo', dx: (Math.random() - 0.5) * 90, dur: 1100 });
                await esperar(500);
                cara([]);
            });
        },
        evolucionar(){
            return accion(async () => {
                sonidosChokurei.brillo();
                actor.classList.add('evolucionando');
                for (let i = 0; i < 10; i++) despues(i * 120, () => particula(['✨', '⭐', '💫'][i % 3], { desde: 'cuerpo', dx: (Math.random() - 0.5) * 140, dy: -40 - Math.random() * 60, dur: 1300 }));
                await anim(volteo, [{ transform: 'scale(1)', filter: 'brightness(1)' }, { transform: 'scale(1.25)', filter: 'brightness(2.2)', offset: 0.5 }, { transform: 'scale(1)', filter: 'brightness(1)' }], { duration: 1600 }).finished;
                actor.classList.remove('evolucionando');
                // Ojo: acá no se puede llamar a ck.alegrarse(): es otra acción de la
                // cola y esperaría a que termine ésta, que la está esperando a ella.
                cara(['ojos-felices', 'boca-abierta']);
                sonidosChokurei.miau(true);
                for (let i = 0; i < 3; i++) particula(['💖', '💕', '✨'][i], { dx: (i - 1) * 30, dur: 1300 });
                await saltar();
                cara([]);
            });
        },
        async dormir(){
            if (dormido) return;
            await accion(async () => {
                await caminarA(22);
                dormido = true;
                mirarAlFrente();
                clases(['ojos-cerrados', 'dormido'], CARAS.filter(c => c !== 'ojos-cerrados'));
                svg.classList.add('dormido');
            });
            let n = 0;
            (function zzz(){ despues(1300, () => {
                if (!dormido) return;
                n++;
                if (n % 5 === 0) particula('💭' + ck.suenos[Math.floor(Math.random() * ck.suenos.length)], { dx: -10, dy: -60, dur: 2600, tam: 1.3 });
                else particula('z', { dx: 25, dy: -50, dur: 1800, tam: 0.9 + Math.random() * 0.4 });
                zzz();
            }); })();
        },
        async despertar(){
            if (!dormido) return;
            dormido = false;
            svg.classList.remove('dormido', 'ojos-cerrados');
            decir('¿Mmm…? 😪');
            await anim(volteo, [{ transform: 'translateY(0)' }, { transform: 'translateY(-6px)' }, { transform: 'translateY(0)' }], { duration: 300 }).finished.catch(() => {});
        },
        // Persigue un objetivo que se mueve (el puntero láser): cada cuadro
        // se acerca a objetivo() a velocidad de carrera. Devuelve "parar".
        seguir(objetivo){
            let activo = true, ultimo = performance.now();
            siguiendo = true;
            if (dormido) { dormido = false; svg.classList.remove('dormido', 'ojos-cerrados'); }
            clases(['ojos-felices'], CARAS);
            function paso(ahora){
                if (!activo || !vivo()) return;
                const dt = Math.min(0.05, (ahora - ultimo) / 1000); ultimo = ahora;
                const t = objetivo();
                if (t != null) {
                    const dif = Math.max(14, Math.min(86, t)) - x;
                    if (Math.abs(dif) > 1.2) {
                        mirarA(dif < 0 ? 'izquierda' : 'derecha');
                        x += Math.sign(dif) * Math.min(Math.abs(dif), 62 * dt);
                        actor.style.left = x + '%';
                        svg.classList.add('caminando', 'corriendo');
                    } else svg.classList.remove('caminando', 'corriendo');
                }
                requestAnimationFrame(paso);
            }
            requestAnimationFrame(paso);
            return () => { activo = false; siguiendo = false; svg.classList.remove('caminando', 'corriendo'); clases([], CARAS); };
        },
        // Para el modo baño: espuma donde se frota.
        espuma(px, py){
            const rc = contenedor.getBoundingClientRect();
            const b = document.createElement('div');
            b.className = 'ck-espuma';
            b.style.left = (px - rc.left) + 'px'; b.style.top = (py - rc.top) + 'px';
            b.style.setProperty('--t', (14 + Math.random() * 18) + 'px');
            contenedor.appendChild(b);
            return b;
        },
        destruir(){
            timers.forEach(clearTimeout); timers = [];
            window.removeEventListener('pointermove', alMover);
            actor.remove();
        },
    };
    actor.style.left = x + '%';
    return ck;
}

window.crearChokurei = crearChokurei;
window.sonidosChokurei = sonidosChokurei;
window.PELAJES_CHOKUREI = PELAJES_CHOKUREI;
