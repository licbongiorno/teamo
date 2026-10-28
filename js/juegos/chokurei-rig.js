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
    return {
        miau, ronroneo,
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
        <g class="ck-cola"><path class="ck-cola-trazo" d="M80 102 C 100 100, 104 82, 98 66"/><path class="ck-cola-punta" d="M99.5 71 C 100.5 68, 99.5 65, 98 63"/></g>
        <ellipse class="ck-pelo ck-cuerpo" cx="60" cy="93" rx="24" ry="20"/>
        <ellipse class="ck-panza" cx="60" cy="98" rx="13.5" ry="13"/>
        <g class="ck-pata ck-pata-i"><ellipse class="ck-puntas" cx="50" cy="110" rx="7.5" ry="5"/><path class="ck-dedos" d="M47.5 109 v3 M51 109.3 v3"/></g>
        <g class="ck-pata ck-pata-d"><ellipse class="ck-puntas" cx="70" cy="110" rx="7.5" ry="5"/><path class="ck-dedos" d="M69 109.3 v3 M72.5 109 v3"/></g>
        <g class="ck-cabeza">
            <g class="ck-oreja ck-oreja-i"><path class="ck-puntas" d="M33 50 L 37 18 L 58 37 Z"/><path class="ck-oreja-int" d="M38.5 45 L 40.5 26 L 52 37.5 Z"/></g>
            <g class="ck-oreja ck-oreja-d"><path class="ck-puntas" d="M87 50 L 83 18 L 62 37 Z"/><path class="ck-oreja-int" d="M81.5 45 L 79.5 26 L 68 37.5 Z"/></g>
            <ellipse class="ck-pelo ck-cara" cx="60" cy="56" rx="31" ry="26"/>
            <ellipse class="ck-mascara" cx="60" cy="63" rx="15" ry="11"/>
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
            <g class="ck-bigotes"><path d="M44 62 L 28 59 M44 65 L 28 66 M76 62 L 92 59 M76 65 L 92 66"/></g>
            <g class="ck-termometro"><rect x="63" y="64" width="16" height="3" rx="1.5" fill="#fff" stroke="#c9c9c9" stroke-width="0.6"/><circle cx="78.5" cy="65.5" r="2.2" fill="#ff5c6c"/></g>
            <!-- Accesorios: se ven según el nivel (ver mascota.js) -->
            <g class="ck-acc ck-acc-mono"><path d="M78 30 l-7 -5 v10 z M78 30 l7 -5 v10 z" fill="#ff7aa2" stroke="#d94f7c" stroke-width="0.8"/><circle cx="78" cy="30" r="2.2" fill="#ff9dbb"/></g>
            <g class="ck-acc ck-acc-corona"><path d="M48 29 L 50 18 L 55 24 L 60 15 L 65 24 L 70 18 L 72 29 Z" fill="#ffd34d" stroke="#d1a21c" stroke-width="0.9"/><circle cx="60" cy="22" r="1.6" fill="#ff6f91"/></g>
            <g class="ck-acc ck-acc-anteojos"><circle cx="47" cy="54" r="8" fill="rgba(30,30,40,0.55)" stroke="#222" stroke-width="1.4"/><circle cx="73" cy="54" r="8" fill="rgba(30,30,40,0.55)" stroke="#222" stroke-width="1.4"/><path d="M55 54 h10" stroke="#222" stroke-width="1.4"/></g>
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
        maullar(texto){
            return accion(async () => {
                const antes = [...svg.classList].filter(c => CARAS.includes(c));
                clases(['boca-abierta'], ['boca-triste']);
                sonidosChokurei.miau(Math.random() < 0.5);
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
            (function zzz(){ despues(1300, () => { if (!dormido) return; particula('z', { dx: 25, dy: -50, dur: 1800, tam: 0.9 + Math.random() * 0.4 }); zzz(); }); })();
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
