// ============================================================
// animar-juegos.js — da vida a los juegos de mesa (Truco, Escoba,
// Chinchón, UNO, Ajedrez, Damas, Conecta 4, Ta-Te-Ti, Reversi,
// Generala y Mentiroso) sin tocar su lógica.
//
// Cada juego se redibuja entero (cont.innerHTML = ...) en cada jugada.
// Un MutationObserver mira esos contenedores y, justo después de que
// cambian y antes de que el navegador pinte:
//   1. "adorna": cambia los naipes de texto por naipes españoles
//      dibujados en SVG, las cartas de UNO por cartas de verdad, los
//      dados de emoji por dados con puntos, las X/O por trazos, etc.
//   2. anima (técnica FLIP): compara dónde estaba cada carta/ficha en
//      el dibujo anterior y dónde quedó, y la hace viajar de un lugar
//      al otro. Las que aparecen vuelan desde el mazo o la mano del
//      otro; las que se van (capturas, bazas) salen volando.
// Además expone window.animJuegos con carteles ("¡TRUCO!") leídos del
// historial de cada partida y los fosforitos para anotar los tantos.
// ============================================================
(function () {
    const JUEGOS = ['truco', 'escoba', 'chinchon', 'uno', 'ajedrez', 'damas', 'conecta4', 'tateti', 'reversi', 'generala', 'mentiroso',
        'batallanaval', 'ahorcado', 'cajitas', 'memoria', 'buscaminas', 'sudoku'];
    // Juegos donde se compara casilla por casilla (qué cambió desde el dibujo anterior).
    const JUEGOS_CASILLAS = ['batallanaval', 'cajitas', 'buscaminas', 'sudoku'];
    const SEL_CARTAS = '.naipe-chinchon, div.naipe-uno';
    const SEL_PIEZAS = '.pieza-tablero, .ficha-damas, .ficha-c4, .ficha-reversi, .marca-tateti';
    const NS = 'http://www.w3.org/2000/svg';

    function sinMovimiento() {
        return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    // Las jugadas propias ya suenan desde cada juego; acá sólo se suena
    // lo que llega del otro celular (si no tocaste nada recién).
    let ultimoToque = 0;
    document.addEventListener('pointerdown', () => { ultimoToque = Date.now(); }, { capture: true, passive: true });
    function esJugadaAjena() { return Date.now() - ultimoToque > 900; }
    function sonar(nombre) { if (window.sfx && window.sfx[nombre]) window.sfx[nombre](); }

    // ==================== NAIPES ESPAÑOLES ====================
    const COLOR_PALO = { oro: '#b8860b', copa: '#b3261e', espada: '#2d4f7c', basto: '#3d6b1e' };
    const PALO_DE_EMOJI = [['🗡', 'espada'], ['🌳', 'basto'], ['🪙', 'oro'], ['🏆', 'copa']];
    const NUM_DE_NOMBRE = { As: 1, Sota: 10, Caballo: 11, Rey: 12 };
    const FIGURA = { 10: '🧒', 11: '🐴', 12: '👑' };

    function simboloPalo(palo) {
        switch (palo) {
            case 'oro': return `<circle r="9" fill="#f3c74a" stroke="#9a6f00" stroke-width="1.2"/>
                <circle r="6" fill="none" stroke="#9a6f00" stroke-width="0.9"/>
                <circle r="2.4" fill="#c9302c"/>`;
            case 'copa': return `<path d="M-7,-8 H7 Q7,1.5 0,2.5 Q-7,1.5 -7,-8 Z" fill="#e3b23c" stroke="#8a5a00" stroke-width="0.9"/>
                <rect x="-7" y="-8" width="14" height="2.4" fill="#c9302c"/>
                <rect x="-1.3" y="2.3" width="2.6" height="5" fill="#e3b23c" stroke="#8a5a00" stroke-width="0.6"/>
                <ellipse cy="8.2" rx="5.2" ry="1.7" fill="#e3b23c" stroke="#8a5a00" stroke-width="0.7"/>`;
            case 'espada': return `<path d="M0,-10.5 L2,-7 L2,4.6 L-2,4.6 L-2,-7 Z" fill="#a9c6ea" stroke="#2d4f7c" stroke-width="0.9"/>
                <line x1="0" y1="-8" x2="0" y2="3.8" stroke="#2d4f7c" stroke-width="0.5"/>
                <rect x="-6" y="4.6" width="12" height="2" rx="1" fill="#e3b23c" stroke="#8a5a00" stroke-width="0.5"/>
                <rect x="-1.2" y="6.6" width="2.4" height="2.8" fill="#8a4b2a"/>
                <circle cy="10.2" r="1.4" fill="#e3b23c"/>`;
            case 'basto': return `<path d="M-1.8,10 L-3.4,-5.5 Q-3.8,-10.5 0,-10.5 Q3.8,-10.5 3.4,-5.5 L1.8,10 Z" fill="#7da34a" stroke="#3d5a1e" stroke-width="0.9"/>
                <circle cx="-3.4" cy="-1.5" r="1.3" fill="#557a2c"/><circle cx="3.2" cy="2.5" r="1.2" fill="#557a2c"/>
                <circle cx="-2.6" cy="5.5" r="1" fill="#557a2c"/><path d="M0,-10.5 q2,-2 4,-1.2" stroke="#3d6b1e" stroke-width="1" fill="none"/>`;
        }
        return '';
    }
    const PIPS = {
        1: [[25, 37, 1.65]],
        2: [[25, 22, 1], [25, 52, 1]],
        3: [[25, 19, 0.88], [25, 37, 0.88], [25, 55, 0.88]],
        4: [[15, 23, 0.85], [35, 23, 0.85], [15, 51, 0.85], [35, 51, 0.85]],
        5: [[15, 21, 0.78], [35, 21, 0.78], [25, 37, 0.78], [15, 53, 0.78], [35, 53, 0.78]],
        6: [[15, 20, 0.74], [35, 20, 0.74], [15, 37, 0.74], [35, 37, 0.74], [15, 54, 0.74], [35, 54, 0.74]],
        7: [[15, 19, 0.7], [35, 19, 0.7], [25, 28, 0.7], [15, 38, 0.7], [35, 38, 0.7], [15, 56, 0.7], [35, 56, 0.7]]
    };
    function svgNaipe(palo, num) {
        const c = COLOR_PALO[palo];
        let centro;
        if (PIPS[num]) {
            centro = PIPS[num].map(([x, y, s]) => `<g transform="translate(${x},${y}) scale(${s})">${simboloPalo(palo)}</g>`).join('');
        } else {
            // Figuras: el personaje arriba y su palo abajo, como en la baraja.
            centro = `<rect x="9" y="14" width="32" height="46" rx="3" fill="${c}" opacity="0.08"/>
                <text x="25" y="35" font-size="17" text-anchor="middle">${FIGURA[num] || ''}</text>
                <g transform="translate(25,49) scale(0.8)">${simboloPalo(palo)}</g>`;
        }
        return `<svg class="aj-svg-naipe" viewBox="0 0 50 72" aria-hidden="true">
            <rect x="0.5" y="0.5" width="49" height="71" rx="5" fill="#fdf8ef"/>
            <rect x="3" y="3" width="44" height="66" rx="3" fill="none" stroke="${c}" stroke-width="1" stroke-dasharray="${palo === 'oro' ? '0' : palo === 'copa' ? '30 3' : palo === 'espada' ? '18 3' : '10 3'}" opacity="0.7"/>
            ${centro}
            <text x="6.5" y="12" font-size="9" font-weight="800" fill="${c}" font-family="Georgia,serif">${num}</text>
            <text x="43.5" y="66" font-size="9" font-weight="800" fill="${c}" font-family="Georgia,serif" text-anchor="end">${num}</text>
        </svg>`;
    }
    const SVG_DORSO = `<svg class="aj-svg-naipe" viewBox="0 0 50 72" aria-hidden="true">
        <rect x="0.5" y="0.5" width="49" height="71" rx="5" fill="#7a2944"/>
        <rect x="3.5" y="3.5" width="43" height="65" rx="3" fill="none" stroke="#e8c27a" stroke-width="1.2"/>
        <path d="M6,6 L44,66 M18,6 L44,46 M30,6 L44,26 M6,26 L32,66 M6,46 L20,66 M44,6 L6,66 M32,6 L6,46 M20,6 L6,26 M44,26 L18,66 M44,46 L30,66" stroke="#e8c27a" stroke-width="0.5" opacity="0.35"/>
        <circle cx="25" cy="36" r="10" fill="#7a2944" stroke="#e8c27a" stroke-width="1.2"/>
        <path d="M25,41 C18,36 20,30 25,33 C30,30 32,36 25,41 Z" fill="#ffb3c6"/>
    </svg>`;

    function adornarNaipe(el) {
        if (el.dataset.ajK) return;
        if (el.classList.contains('dorso')) {
            el.innerHTML = SVG_DORSO;
            el.classList.add('aj-naipe');
            el.dataset.ajK = el.hasAttribute('data-aj-mazo') ? 'mazo' : 'dorso';
            return;
        }
        const paloSpan = el.querySelector('.nc-palo');
        if (!paloSpan) { el.dataset.ajK = 'vacio'; return; }
        const emoji = paloSpan.textContent;
        const par = PALO_DE_EMOJI.find(([e]) => emoji.includes(e));
        const nombre = el.textContent.replace(emoji, '').trim();
        const num = NUM_DE_NOMBRE[nombre] || parseInt(nombre, 10);
        if (!par || !num) { el.dataset.ajK = 'vacio'; return; }
        el.setAttribute('aria-label', `${nombre} de ${par[1]}`);
        el.innerHTML = svgNaipe(par[1], num);
        el.classList.add('aj-naipe');
        el.dataset.ajK = par[1] + '_' + num;
    }

    // ==================== CARTAS DE UNO ====================
    function adornarUno(el) {
        if (el.dataset.ajK) return;
        if (el.classList.contains('dorso-uno')) {
            el.innerHTML = `<span class="aj-uno-ovalo"></span><span class="aj-uno-v aj-uno-logo">UNO</span>`;
            el.dataset.ajK = el.hasAttribute('data-aj-mazo') ? 'mazo' : 'dorso';
            return;
        }
        const txt = el.textContent.trim();
        if (!txt) { el.dataset.ajK = 'vacio'; return; }
        const color = ['rojo', 'amarillo', 'verde', 'azul', 'comodin'].find(c => el.classList.contains(c)) || 'comodin';
        const v = txt.includes('+4') ? '+4' : txt.includes('Comodín') ? '★' : txt;
        el.setAttribute('aria-label', txt);
        el.innerHTML = `<span class="aj-uno-ovalo"></span><span class="aj-uno-v">${v}</span><span class="aj-uno-esq">${v}</span><span class="aj-uno-esq aj-abajo">${v}</span>`;
        el.classList.add('aj-uno');
        el.dataset.ajK = 'uno:' + color + ':' + v;
    }

    // ==================== DADOS ====================
    const CARAS = { '⚀': 1, '⚁': 2, '⚂': 3, '⚃': 4, '⚄': 5, '⚅': 6 };
    const PUNTOS_DADO = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
    function htmlPuntos(v) {
        const on = PUNTOS_DADO[v] || [];
        let h = '';
        for (let i = 0; i < 9; i++) h += `<i${on.includes(i) ? ' class="on"' : ''}></i>`;
        return h;
    }
    function adornarDado(el) {
        if (el.dataset.ajV) return;
        const v = CARAS[el.textContent.trim()];
        if (!v) { el.dataset.ajV = '?'; el.classList.add('aj-dado-tapado'); return; }
        el.dataset.ajV = String(v);
        el.innerHTML = `<span class="aj-dado">${htmlPuntos(v)}</span>`;
        el.classList.add('aj-dado-lindo');
    }

    // ==================== PIEZAS ====================
    const BLANCAS = '♙♘♗♖♕♔', LLENA = { '♙': '♟', '♘': '♞', '♗': '♝', '♖': '♜', '♕': '♛', '♔': '♚' };
    function adornarPieza(el) {
        if (el.dataset.ajT) return;
        let tipo = '', color = '';
        if (el.classList.contains('pieza-tablero')) {
            const g = el.textContent.trim();
            color = BLANCAS.includes(g) ? 'b' : 'n';
            tipo = 'p' + g;
            // Mismo dibujo relleno para las dos, coloreado: en celulares el
            // ♟ negro salía como emoji y el blanco como contorno finito.
            el.textContent = (LLENA[g] || g) + '︎';
            el.classList.add(color === 'b' ? 'aj-pieza-blanca' : 'aj-pieza-negra');
        } else if (el.classList.contains('ficha-damas')) {
            color = el.classList.contains('blanca') ? 'b' : 'n';
            tipo = 'd' + color + (el.classList.contains('coronada') ? 'K' : '');
        } else if (el.classList.contains('ficha-c4')) {
            color = el.classList.contains('ficha-nico') ? 'b' : 'n'; tipo = 'c' + color;
        } else if (el.classList.contains('ficha-reversi')) {
            color = el.classList.contains('ficha-nico') ? 'b' : 'n'; tipo = 'r' + color;
        } else if (el.classList.contains('marca-tateti')) {
            const x = el.classList.contains('marca-x');
            color = x ? 'b' : 'n'; tipo = 't' + color;
            el.innerHTML = x
                ? `<svg viewBox="0 0 40 40"><path class="aj-trazo" pathLength="100" d="M8,8 L32,32"/><path class="aj-trazo aj-trazo2" pathLength="100" d="M32,8 L8,32"/></svg>`
                : `<svg viewBox="0 0 40 40"><circle class="aj-trazo" pathLength="100" cx="20" cy="20" r="13.5" transform="rotate(-90 20 20)"/></svg>`;
            el.classList.add('aj-marca');
        }
        el.dataset.ajT = tipo;
        el.dataset.ajC = color;
    }

    function adornar(cont) {
        cont.querySelectorAll('.naipe-chinchon').forEach(adornarNaipe);
        cont.querySelectorAll('div.naipe-uno').forEach(adornarUno);
        cont.querySelectorAll('.dado-generala').forEach(adornarDado);
        cont.querySelectorAll(SEL_PIEZAS).forEach(adornarPieza);
    }

    // ==================== FOTOS (posiciones) ====================
    function rel(el, base) {
        const r = el.getBoundingClientRect();
        return { x: r.left - base.left, y: r.top - base.top, w: r.width, h: r.height };
    }
    function visible(cont) { return cont.getClientRects().length > 0 && cont.offsetWidth > 0; }

    function sacarFoto(cont) {
        const base = cont.getBoundingClientRect();
        const cartas = [...cont.querySelectorAll(SEL_CARTAS)]
            .filter(el => el.dataset.ajK && el.dataset.ajK !== 'vacio')
            .map(el => ({ el, k: el.dataset.ajK, r: rel(el, base), mia: !!el.closest('[data-aj-mia]'), pila: !!el.closest('[data-aj-pila]') }));
        const tablero = cont.querySelector('.tablero-juego');
        const piezas = [];
        if (tablero) {
            [...tablero.children].forEach((celda, i) => {
                const p = celda.querySelector(SEL_PIEZAS);
                if (p) piezas.push({ el: p, t: p.dataset.ajT, c: p.dataset.ajC, celda: i, r: rel(p, base) });
            });
        }
        const filasDados = [...cont.querySelectorAll('.fila-dados-generala')].map(f => {
            const dados = [...f.querySelectorAll('.dado-generala')];
            return { el: f, vals: dados.map(d => d.dataset.ajV), dados, r: rel(f, base), quien: f.dataset.ajQuien || '' };
        });
        const tableros = [...cont.querySelectorAll('.tablero-juego, .grilla-cajitas, .tablero-sudoku')].map(t =>
            [...t.children].map(c => ({ el: c, k: c.className + '|' + c.textContent.trim() })));
        const letras = [...cont.querySelectorAll('.aj-palabra > .aj-letra')].map(l => l.textContent);
        const partes = cont.querySelectorAll('.ahorcado-muneco > *').length;
        const intento = cont.querySelectorAll('.aj-intento > span').length;
        const rival = cont.querySelector('[data-aj-rival]');
        const mazo = cont.querySelector('[data-aj-mazo]');
        return {
            cartas, piezas, filasDados, tableros, letras, partes, intento,
            tableroR: tablero ? rel(tablero, base) : null,
            rivalR: rival ? rel(rival, base) : null,
            mazoR: mazo ? rel(mazo, base) : null,
            jaque: !!cont.querySelector('.casilla-jaque'),
            ancho: base.width
        };
    }

    // ==================== ANIMACIONES ====================
    function transformBase(el) {
        const t = getComputedStyle(el).transform;
        return t && t !== 'none' ? ' ' + t : '';
    }
    function viajar(el, dx, dy, opts) {
        opts = opts || {};
        const base = transformBase(el);
        const giro = opts.girar ? ` rotate(${opts.girar}deg)` : '';
        const esc = opts.escala ? ` scale(${opts.escala})` : '';
        let frames;
        if (opts.voltear) {
            frames = [
                { transform: `translate(${dx}px,${dy}px)${esc} rotateY(90deg)${base}`, opacity: 0.6 },
                { transform: `translate(${dx * 0.45}px,${dy * 0.45 - 14}px) rotateY(0deg)${base}`, opacity: 1, offset: 0.55 },
                { transform: `translate(0,0)${base}` }
            ];
        } else {
            frames = [
                { transform: `translate(${dx}px,${dy}px)${esc}${giro}${base}` },
                { transform: `translate(0,0)${base}` }
            ];
        }
        el.classList.add('aj-en-vuelo');
        const a = el.animate(frames, { duration: opts.dur || 380, delay: opts.delay || 0, easing: opts.easing || 'cubic-bezier(0.22,0.9,0.3,1.08)', fill: 'backwards' });
        a.onfinish = a.oncancel = () => el.classList.remove('aj-en-vuelo');
        return a;
    }

    // Capa fija sobre la página para las cartas/fichas que "se van":
    // vive fuera del contenedor del juego para que el próximo redibujo
    // no la borre a mitad de vuelo.
    let capa = null;
    function capaFantasmas() {
        if (!capa || !capa.isConnected) {
            capa = document.createElement('div');
            capa.className = 'aj-capa';
            document.body.appendChild(capa);
        }
        return capa;
    }
    function fantasma(viejo, base, haciaX, haciaY, opts) {
        opts = opts || {};
        const el = viejo.el;
        if (!el || !el.style) return;
        const capaF = capaFantasmas();
        el.classList.remove('aj-en-vuelo');
        el.style.cssText += `;position:fixed;left:${base.left + viejo.r.x}px;top:${base.top + viejo.r.y}px;width:${viejo.r.w}px;height:${viejo.r.h}px;margin:0;pointer-events:none;`;
        capaF.appendChild(el);
        const a = el.animate([
            { transform: 'translate(0,0) scale(1) rotate(0deg)', opacity: 1 },
            { transform: `translate(${haciaX}px,${haciaY}px) scale(${opts.escala || 0.55}) rotate(${opts.girar || 0}deg)`, opacity: 0 }
        ], { duration: opts.dur || 520, delay: opts.delay || 0, easing: 'cubic-bezier(0.5,0,0.75,0)', fill: 'both' });
        a.onfinish = () => el.remove();
        setTimeout(() => el.remove(), (opts.dur || 520) + (opts.delay || 0) + 200);
    }
    // La carta vieja del pozo se queda un ratito debajo de la que llega.
    function quedarDebajo(viejo, pila, base) {
        const el = viejo.el;
        const r = pila.getBoundingClientRect();
        pila.style.position = 'relative';
        el.classList.remove('aj-en-vuelo');
        el.style.cssText += `;position:absolute;left:${base.left + viejo.r.x - r.left}px;top:${base.top + viejo.r.y - r.top}px;margin:0;z-index:0;pointer-events:none;`;
        pila.insertBefore(el, pila.firstChild);
        setTimeout(() => el.remove(), 650);
    }
    function centro(r) { return { x: r.x + r.w / 2, y: r.y + r.h / 2 }; }

    function animarCartas(cont, vieja, nueva, base) {
        const usadas = new Set();
        const sinPareja = [];
        let movidas = 0;
        nueva.cartas.forEach(n => {
            // De las viejas con la misma carta, la más cercana.
            let mejor = null, dist = Infinity;
            vieja.cartas.forEach((v, i) => {
                if (usadas.has(i) || v.k !== n.k) return;
                const d = Math.hypot(v.r.x - n.r.x, v.r.y - n.r.y);
                if (d < dist) { dist = d; mejor = i; }
            });
            if (mejor === null) { sinPareja.push(n); return; }
            usadas.add(mejor);
            const v = vieja.cartas[mejor];
            const dx = v.r.x - n.r.x, dy = v.r.y - n.r.y;
            if (Math.abs(dx) < 1.5 && Math.abs(dy) < 1.5) return;
            const aPila = n.pila && !v.pila;
            viajar(n.el, dx, dy, { girar: aPila && n.k.startsWith('uno:') ? -200 : (aPila ? -12 : 0), dur: aPila ? 460 : 340 });
            movidas++;
        });
        const idas = vieja.cartas.filter((v, i) => !usadas.has(i));
        // Un dorso que desaparece + una carta nueva boca arriba = el otro
        // la jugó: vuela desde su mano y se da vuelta en el camino.
        const dorsosIdos = idas.filter(v => v.k === 'dorso');
        // (en el UNO nadie roba del pozo: ahí los dorsos nuevos salen del mazo)
        const carasIdas = idas.filter(v => v.k !== 'dorso' && v.k !== 'mazo' && !v.k.startsWith('uno:'));
        let reparto = 0;
        sinPareja.forEach(n => {
            let origen = null, voltear = false;
            if (n.k === 'dorso') {
                // Dorso nuevo: el otro robó (de la mesa si se fue una carta, si no del mazo).
                const cara = carasIdas.shift();
                if (cara) { origen = cara.r; cara.usada = true; }
                else if (nueva.mazoR) origen = nueva.mazoR;
            } else if (n.k !== 'mazo') {
                const dorso = dorsosIdos.shift();
                if (dorso) { origen = dorso.r; voltear = true; dorso.usada = true; }
                else if (nueva.mazoR && !n.pila) { origen = nueva.mazoR; voltear = true; }
                else if (n.pila && n.k.startsWith('uno:') && nueva.rivalR) { origen = nueva.rivalR; voltear = true; }
                else if (n.pila) {
                    // Quedó a la vista la carta de abajo del pozo: aparece ahí mismo.
                    n.el.animate([{ opacity: 0, transform: 'scale(0.92)' }, { opacity: 1, transform: 'scale(1)' }], { duration: 260, delay: 120, fill: 'backwards' });
                    return;
                }
            }
            let delay = 0;
            if (!origen) {
                // Reparto: desde arriba al centro, de a una.
                origen = { x: nueva.ancho / 2 - n.r.w / 2, y: -n.r.h * 1.2, w: n.r.w, h: n.r.h };
                voltear = n.k !== 'dorso';
                delay = Math.min(reparto, 9) * 70;
                reparto++;
            }
            const co = centro(origen), cn = centro(n.r);
            viajar(n.el, co.x - cn.x, co.y - cn.y, { voltear, delay, dur: 480, escala: 0.8 });
            movidas++;
        });
        // Lo que se fue sin reaparecer: bazas levantadas, cartas que se
        // llevó alguien. Van hacia quien las levantó.
        const bajan = idas.some(v => v.mia && !v.usada);
        idas.forEach((v, i) => {
            if (v.usada || v.k === 'mazo') return;
            // La carta de arriba del pozo queda tapada por la nueva.
            const pilaNueva = v.pila && cont.querySelector('[data-aj-pila]');
            if (pilaNueva && nueva.cartas.some(c => c.pila)) { quedarDebajo(v, pilaNueva, base); return; }
            const destino = bajan ? { x: nueva.ancho / 2, y: (nueva.cartas.length ? Math.max(...nueva.cartas.map(c => c.r.y)) : 300) + 90 }
                : (nueva.rivalR ? centro(nueva.rivalR) : { x: nueva.ancho / 2, y: -80 });
            const c = centro(v.r);
            fantasma(v, base, destino.x - c.x, destino.y - c.y, { girar: bajan ? 25 : -25, delay: i * 40 });
            movidas++;
        });
        return movidas;
    }

    function animarTablero(cont, vieja, nueva, juego, base) {
        if (!vieja.tableroR || !nueva.tableroR) return 0;
        const viejas = new Map(vieja.piezas.map(p => [p.celda, p]));
        const nuevas = new Map(nueva.piezas.map(p => [p.celda, p]));
        const fueron = [], vinieron = [];
        nueva.piezas.forEach(n => {
            const v = viejas.get(n.celda);
            if (v && v.t === n.t) return; // quieta
            vinieron.push(n);
        });
        vieja.piezas.forEach(v => {
            const n = nuevas.get(v.celda);
            if (n && n.t === v.t) return;
            fueron.push(v);
        });
        let movidas = 0;
        const emparejar = (criterio, alLlegar) => {
            vinieron.slice().forEach(n => {
                if (n.listo) return;
                let mejor = null, dist = Infinity;
                fueron.forEach(v => {
                    if (v.listo || !criterio(v, n)) return;
                    const d = Math.hypot(v.r.x - n.r.x, v.r.y - n.r.y);
                    if (d < dist) { dist = d; mejor = v; }
                });
                if (!mejor) return;
                mejor.listo = n.listo = true;
                const a = viajar(n.el, mejor.r.x - n.r.x, mejor.r.y - n.r.y, { dur: Math.min(520, 240 + dist * 0.6), easing: 'cubic-bezier(0.3,0.8,0.3,1)' });
                if (alLlegar) a.addEventListener('finish', () => alLlegar(n));
                movidas++;
            });
        };
        // 1) la misma pieza que se movió, 2) la misma pieza "ascendida"
        // (peón coronado, dama de damas).
        if (juego !== 'reversi' && juego !== 'conecta4' && juego !== 'tateti') {
            emparejar((v, n) => v.t === n.t);
            emparejar((v, n) => v.c === n.c, (n) => n.el.animate(
                [{ filter: 'drop-shadow(0 0 0 #f5d9a0) brightness(1)' }, { filter: 'drop-shadow(0 0 10px #f5d9a0) brightness(1.5)' }, { filter: 'drop-shadow(0 0 0 #f5d9a0) brightness(1)' }],
                { duration: 900 }));
        }
        vinieron.forEach((n, i) => {
            if (n.listo) return;
            const v = viejas.get(n.celda);
            if (v && juego === 'reversi') { v.listo = true; return; } // ya se da vuelta con su propia animación
            if (juego === 'conecta4') {
                const caida = n.r.y - nueva.tableroR.y + n.r.h;
                n.el.animate([
                    { transform: `translateY(${-caida}px)`, opacity: 0.7 },
                    { transform: 'translateY(0)', opacity: 1, offset: 0.72, easing: 'ease-out' },
                    { transform: `translateY(${-Math.min(14, caida * 0.08)}px)`, offset: 0.86, easing: 'ease-in' },
                    { transform: 'translateY(0)' }
                ], { duration: 260 + Math.sqrt(caida) * 22, easing: 'cubic-bezier(0.55,0,1,0.45)' });
                if (esJugadaAjena()) setTimeout(() => sonar('golpe'), 230 + Math.sqrt(caida) * 14);
            } else if (juego === 'tateti') {
                n.el.classList.add('aj-dibujando');
            } else {
                n.el.animate([{ transform: 'scale(0.2)', opacity: 0 }, { transform: 'scale(1.15)', opacity: 1, offset: 0.65 }, { transform: 'scale(1)' }],
                    { duration: 340, delay: i * 30, easing: 'ease-out' });
            }
            movidas++;
        });
        // Capturadas: saltan fuera del tablero girando.
        fueron.forEach((v, i) => {
            if (v.listo) return;
            const haciaArriba = v.r.y < nueva.tableroR.y + nueva.tableroR.h / 2;
            const lado = (v.r.x < nueva.tableroR.x + nueva.tableroR.w / 2) ? -1 : 1;
            if (juego === 'tateti') fantasma(v, base, 0, 0, { escala: 0.2, dur: 420 });
            else fantasma(v, base, lado * (60 + Math.random() * 40), haciaArriba ? -120 : 120, { girar: lado * 220, escala: 0.4, dur: 650, delay: 120 + i * 60 });
            movidas++;
        });
        if (nueva.jaque && !vieja.jaque) {
            const rey = cont.querySelector('.casilla-jaque');
            if (rey) rey.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-5px)' }, { transform: 'translateX(5px)' }, { transform: 'translateX(-3px)' }, { transform: 'translateX(0)' }],
                { duration: 420, delay: 380 });
            cartel('¡JAQUE!', { color: '#ff8a80', dur: 1100 });
        }
        if (movidas && esJugadaAjena() && juego !== 'conecta4') setTimeout(() => sonar(fueron.some(v => !v.listo) ? 'golpe' : 'toque'), 260);
        return movidas;
    }

    function animarDados(cont, vieja, nueva, base) {
        nueva.filasDados.forEach((fila, i) => {
            const antes = fila.quien ? vieja.filasDados.find(f => f.quien === fila.quien) : vieja.filasDados[i];
            if (!fila.dados.length) return;
            const cambio = !antes || antes.vals.join() !== fila.vals.join();
            if (!cambio) return;
            const destapa = antes && antes.vals.length && antes.vals.every(v => v === '?') && fila.vals.every(v => v !== '?');
            if (destapa) {
                // Mentiroso: se levanta el cubilete.
                const vaso = document.createElement('div');
                vaso.className = 'aj-cubilete';
                vaso.style.cssText = `left:${base.left + fila.r.x + fila.r.w / 2 - 50}px;top:${base.top + fila.r.y - 12}px;`;
                capaFantasmas().appendChild(vaso);
                vaso.animate([{ transform: 'translateY(0) rotate(0)', opacity: 1 }, { transform: 'translateY(-14px) rotate(-6deg)', opacity: 1, offset: 0.35 }, { transform: 'translateY(-90px) rotate(-18deg)', opacity: 0 }],
                    { duration: 900, easing: 'ease-in', fill: 'both' }).onfinish = () => vaso.remove();
                setTimeout(() => vaso.remove(), 1200);
                fila.dados.forEach((d, j) => d.animate([{ transform: 'scale(0.6)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }], { duration: 300, delay: 300 + j * 50, fill: 'backwards' }));
                sonar('revelar');
                return;
            }
            let algunoRodo = false;
            fila.dados.forEach((d, j) => {
                if (d.dataset.ajV === '?') return;
                if (d.classList.contains('dado-guardado')) return;
                // En el Mentiroso sólo ruedan los dados recién tirados, no los que se muestran al revelar.
                if (fila.quien && antes && antes.vals[j] === d.dataset.ajV) return;
                rodarDado(d, j);
                algunoRodo = true;
            });
            if (algunoRodo) sonar('dado');
        });
    }
    function rodarDado(d, j) {
        const real = d.dataset.ajV;
        const cara = d.querySelector('.aj-dado');
        if (!cara) return;
        const giro = (Math.random() < 0.5 ? -1 : 1) * (300 + Math.random() * 200);
        d.animate([
            { transform: `translateY(-26px) rotate(${giro}deg) scale(0.85)` },
            { transform: 'translateY(0) rotate(0deg) scale(1.05)', offset: 0.7 },
            { transform: 'translateY(-5px) scale(1)', offset: 0.85 },
            { transform: 'translateY(0)' }
        ], { duration: 620, delay: j * 45, easing: 'ease-out' });
        let n = 0;
        const t = setInterval(() => {
            if (!cara.isConnected || ++n > 7) { clearInterval(t); if (cara.isConnected) cara.innerHTML = htmlPuntos(Number(real)); return; }
            cara.innerHTML = htmlPuntos(1 + Math.floor(Math.random() * 6));
        }, 60);
    }

    // ==================== CASILLAS: NAVAL, CAJITAS, BUSCAMINAS, SUDOKU ====================
    // Efectos sueltos sobre la capa fija: explosión, salpicadura, chispas.
    function efectoEn(el, clase, dur) {
        const r = el.getBoundingClientRect();
        const fx = document.createElement('div');
        fx.className = 'aj-fx ' + clase;
        fx.style.cssText = `left:${r.left + r.width / 2}px;top:${r.top + r.height / 2}px;--aj-t:${Math.max(r.width, 24)}px;`;
        if (clase.includes('explosion') || clase.includes('chispas')) {
            for (let i = 0; i < 10; i++) {
                const p = document.createElement('i');
                const ang = (i / 10) * Math.PI * 2 + Math.random() * 0.4;
                const d = (clase.includes('chispas') ? 18 : 26) + Math.random() * 22;
                p.style.cssText = `--dx:${Math.cos(ang) * d}px;--dy:${Math.sin(ang) * d}px;animation-delay:${Math.random() * 60}ms;`;
                fx.appendChild(p);
            }
        }
        capaFantasmas().appendChild(fx);
        setTimeout(() => fx.remove(), dur || 900);
    }
    function sacudirEl(el, fuerza) {
        const f = fuerza || 5;
        el.animate([{ transform: 'translate(0,0)' }, { transform: `translate(${-f}px,${f / 2}px)` }, { transform: `translate(${f}px,${-f / 2}px)` },
            { transform: `translate(${-f / 2}px,0)` }, { transform: 'translate(0,0)' }], { duration: 380 });
    }
    function animarCasillas(cont, vieja, nueva, juego) {
        nueva.tableros.forEach((celdas, b) => {
            const antes = vieja.tableros[b];
            if (!antes || antes.length !== celdas.length) return;
            const cambiadas = celdas.map((c, i) => ({ ...c, i, previo: antes[i].k })).filter(c => c.k !== c.previo);
            if (!cambiadas.length || cambiadas.length > celdas.length * 0.8) return; // tablero nuevo: nada que animar
            const tablero = celdas[0].el.parentElement;
            if (juego === 'batallanaval') {
                cambiadas.forEach(c => {
                    const txt = c.el.textContent;
                    if (txt.includes('💥') && !c.previo.includes('💥')) {
                        efectoEn(c.el, 'aj-explosion', 900);
                        pop(c.el, 1.6);
                        sacudirEl(tablero, 6);
                        sonar('explosion');
                        cartel(b === 0 ? '💥 ¡TOCADO!' : '💥 ¡Te dieron!', { color: '#ff9b6b', dur: 1000, sonido: false });
                    } else if (txt.includes('💦') && !c.previo.includes('💦')) {
                        efectoEn(c.el, 'aj-salpicadura', 900);
                        pop(c.el, 1.3);
                        sonar('swoosh');
                        if (b === 0 || esJugadaAjena()) cartel('💦 Agua', { color: '#a8d8ff', dur: 800, sonido: false });
                    } else if (txt.includes('🚢') && !c.previo.includes('🚢')) {
                        c.el.animate([{ transform: 'translateY(-14px) rotate(-12deg)', opacity: 0 }, { transform: 'translateY(2px) rotate(4deg)', opacity: 1, offset: 0.7 }, { transform: 'none' }], { duration: 380, easing: 'ease-out' });
                    }
                });
            } else if (juego === 'cajitas') {
                cambiadas.forEach(c => {
                    const el = c.el;
                    if (/linea-(nico|carito)/.test(c.k) && !/linea-(nico|carito)/.test(c.previo)) {
                        const h = el.classList.contains('linea-h');
                        el.animate([{ transform: h ? 'scaleX(0)' : 'scaleY(0)' }, { transform: 'none' }], { duration: 260, easing: 'ease-out' });
                        if (esJugadaAjena()) sonar('toque');
                    } else if (/caja-(nico|carito)/.test(c.k) && !/caja-(nico|carito)/.test(c.previo)) {
                        el.animate([{ transform: 'scale(0.2)', opacity: 0 }, { transform: 'scale(1.25)', opacity: 1, offset: 0.6 }, { transform: 'scale(1)' }], { duration: 460, delay: 200, easing: 'ease-out', fill: 'backwards' });
                        efectoEn(el, 'aj-chispas', 800);
                        sonar('punto');
                    }
                });
            } else if (juego === 'buscaminas') {
                const origen = cambiadas[0];
                const cols = getComputedStyle(tablero).gridTemplateColumns.split(' ').length || 6;
                cambiadas.forEach(c => {
                    const d = Math.hypot((c.i % cols) - (origen.i % cols), Math.floor(c.i / cols) - Math.floor(origen.i / cols));
                    if (c.el.textContent.includes('💥')) {
                        efectoEn(c.el, 'aj-explosion aj-grande', 1000);
                        sacudirEl(tablero, 9);
                        sonar('explosion');
                        if (navigator.vibrate && esJugadaAjena()) { try { navigator.vibrate([40, 30, 60]); } catch (e) { /* nada */ } }
                    } else {
                        c.el.animate([{ transform: 'scale(0.4) rotateX(90deg)', opacity: 0.3 }, { transform: 'scale(1.08)', opacity: 1, offset: 0.7 }, { transform: 'none' }],
                            { duration: 300, delay: d * 45, easing: 'ease-out', fill: 'backwards' });
                    }
                });
            } else if (juego === 'sudoku') {
                const llenas = celdas.map(c => /\d/.test(c.k.split('|')[1] || ''));
                const llenasAntes = antes.map(c => /\d/.test(c.k.split('|')[1] || ''));
                cambiadas.forEach(c => {
                    if (llenas[c.i] && c.el.textContent !== (c.previo.split('|')[1] || '')) pop(c.el, 1.5);
                });
                // Fila, columna o cuadro recién completos: una ola de brillo.
                const grupos = [];
                for (let g = 0; g < 9; g++) {
                    grupos.push([...Array(9)].map((_, k) => g * 9 + k));
                    grupos.push([...Array(9)].map((_, k) => k * 9 + g));
                    const f0 = Math.floor(g / 3) * 3, c0 = (g % 3) * 3;
                    grupos.push([...Array(9)].map((_, k) => (f0 + Math.floor(k / 3)) * 9 + c0 + (k % 3)));
                }
                let hubo = false;
                grupos.forEach(gr => {
                    if (gr.every(i => llenas[i]) && !gr.every(i => llenasAntes[i])) {
                        hubo = true;
                        gr.forEach((i, k) => celdas[i].el.animate([{ background: 'rgba(245,217,160,0)' }, { background: 'rgba(245,217,160,0.55)' }, { background: 'rgba(245,217,160,0)' }],
                            { duration: 600, delay: k * 50 }));
                    }
                });
                if (hubo) sonar('logro');
            }
        });
    }
    function pop(el, escala) {
        el.animate([{ transform: `scale(${escala || 1.4})` }, { transform: 'scale(1)' }], { duration: 320, easing: 'cubic-bezier(0.34,1.56,0.64,1)' });
    }

    // ==================== AHORCADO ====================
    function animarAhorcado(cont, vieja, nueva) {
        const spans = [...cont.querySelectorAll('.aj-palabra > .aj-letra')];
        let aparecieron = 0;
        if (vieja.letras.length === nueva.letras.length) {
            spans.forEach((s, i) => {
                if (vieja.letras[i] === '_' && nueva.letras[i] !== '_') {
                    s.animate([{ transform: 'rotateY(90deg) scale(0.6)', color: '#f5d9a0' }, { transform: 'rotateY(0) scale(1.3)', offset: 0.6 }, { transform: 'none' }],
                        { duration: 420, delay: aparecieron++ * 90, easing: 'ease-out', fill: 'backwards' });
                }
            });
        }
        const svg = cont.querySelector('.ahorcado-svg');
        if (nueva.partes > vieja.partes && svg) {
            const hijos = [...cont.querySelectorAll('.ahorcado-muneco > *')].slice(vieja.partes);
            hijos.forEach(h => {
                const largo = h.getTotalLength ? h.getTotalLength() : 60;
                h.style.strokeDasharray = largo;
                h.animate([{ strokeDashoffset: largo }, { strokeDashoffset: 0 }], { duration: 450, easing: 'ease-out', fill: 'backwards' });
            });
            sacudirEl(svg, 4);
            if (esJugadaAjena()) sonar('error');
        }
        const muneco = cont.querySelector('.ahorcado-muneco');
        if (muneco && nueva.partes >= 6 && vieja.partes < 6) muneco.classList.add('aj-colgado');
        if (aparecieron && nueva.letras.every(l => l !== '_') && vieja.letras.some(l => l === '_')) {
            spans.forEach((s, i) => s.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-12px)' }, { transform: 'translateY(0)' }], { duration: 420, delay: 500 + i * 70 }));
        }
    }

    // ==================== MEMORIA ====================
    function animarMemoria(cont, vieja, nueva) {
        if (nueva.intento > vieja.intento) {
            const ultimo = cont.querySelector('.aj-intento > span:last-child');
            if (ultimo) ultimo.animate([{ transform: 'translateY(40px) scale(0.3)', opacity: 0 }, { transform: 'translateY(-6px) scale(1.2)', opacity: 1, offset: 0.7 }, { transform: 'none' }], { duration: 360, easing: 'ease-out' });
        }
    }

    // ==================== OBSERVADOR ====================
    const fotos = new Map();
    function procesar(cont) {
        const juego = cont.id.replace('contenido-', '');
        cont.classList.add('aj-activo');
        adornar(cont);
        if (!visible(cont)) { fotos.delete(cont); return; }
        const nueva = sacarFoto(cont);
        const vieja = fotos.get(cont);
        fotos.set(cont, nueva);
        if (!vieja || sinMovimiento()) {
            cont.classList.add('aj-sin-entrada');
            return;
        }
        cont.classList.remove('aj-sin-entrada');
        const hayAlgo = nueva.cartas.length || nueva.piezas.length || nueva.filasDados.length || nueva.tableros.length || nueva.letras.length || nueva.partes || nueva.intento;
        if (!hayAlgo) return;
        const base = cont.getBoundingClientRect();
        const movidasCartas = animarCartas(cont, vieja, nueva, base);
        animarTablero(cont, vieja, nueva, juego, base);
        animarDados(cont, vieja, nueva, base);
        if (JUEGOS_CASILLAS.includes(juego)) animarCasillas(cont, vieja, nueva, juego);
        if (juego === 'ahorcado') animarAhorcado(cont, vieja, nueva);
        if (juego === 'memoria') animarMemoria(cont, vieja, nueva);
        if (movidasCartas && esJugadaAjena()) sonar('cartaFlip');
    }
    const observador = new MutationObserver((registros) => {
        const tocados = new Set();
        registros.forEach(r => { if (r.type === 'childList' && JUEGOS.includes(r.target.id && r.target.id.replace('contenido-', ''))) tocados.add(r.target); });
        tocados.forEach(cont => { try { procesar(cont); } catch (e) { console.warn('animar-juegos:', e); } });
        observador.takeRecords(); // lo que cambió adornando no cuenta como jugada
    });
    function enganchar() {
        JUEGOS.forEach(j => {
            const cont = document.getElementById('contenido-' + j);
            if (cont) observador.observe(cont, { childList: true });
        });
        // Al cerrar un juego se olvida todo: al volver a abrirlo no se
        // anima "lo que pasó mientras no mirabas" de golpe.
        const original = window.detenerListenersActivos;
        if (typeof original === 'function' && !original._aj) {
            const envuelta = function () { olvidar(); return original.apply(this, arguments); };
            envuelta._aj = true;
            window.detenerListenersActivos = envuelta;
        }
    }
    function olvidar() { fotos.clear(); historiales.clear(); Object.keys(fosforosPrevios).forEach(k => delete fosforosPrevios[k]); }

    // ==================== CARTELES ====================
    const colaCarteles = [];
    let cartelActivo = false;
    function cartel(texto, opts) {
        opts = opts || {};
        colaCarteles.push({ texto, opts });
        if (!cartelActivo) siguienteCartel();
    }
    function siguienteCartel() {
        const item = colaCarteles.shift();
        if (!item) { cartelActivo = false; return; }
        cartelActivo = true;
        const { texto, opts } = item;
        const el = document.createElement('div');
        el.className = 'aj-cartel';
        el.innerHTML = `<div class="aj-cartel-texto" style="--aj-color:${opts.color || '#f5d9a0'}">${texto}</div>${opts.sub ? `<div class="aj-cartel-sub">${opts.sub}</div>` : ''}`;
        document.body.appendChild(el);
        if (opts.sonido !== false) sonar(opts.sonido || 'revelar');
        if (opts.vibrar && navigator.vibrate) { try { navigator.vibrate(opts.vibrar); } catch (e) { /* sin vibración */ } }
        const dur = opts.dur || 1400;
        if (sinMovimiento()) {
            setTimeout(() => { el.remove(); siguienteCartel(); }, dur);
            return;
        }
        el.animate([
            { transform: 'translate(-50%,-50%) scale(0.3) rotate(-12deg)', opacity: 0 },
            { transform: 'translate(-50%,-50%) scale(1.15) rotate(3deg)', opacity: 1, offset: 0.18 },
            { transform: 'translate(-50%,-50%) scale(1) rotate(-2deg)', opacity: 1, offset: 0.3 },
            { transform: 'translate(-50%,-50%) scale(1) rotate(-2deg)', opacity: 1, offset: 0.8 },
            { transform: 'translate(-50%,-60%) scale(0.9) rotate(-2deg)', opacity: 0 }
        ], { duration: dur, easing: 'ease-out', fill: 'both' }).onfinish = () => { el.remove(); siguienteCartel(); };
    }
    function colorDe(texto) {
        const m = /Nico|Carito/.exec(texto || '');
        return m ? (m[0] === 'Nico' ? '#a8d8ff' : '#ffb3c6') : '#f5d9a0';
    }

    // Reglas: qué renglón del historial merece cartel grande.
    const REGLAS = {
        truco: [
            [/^(\S+) (?:cantó|subió a) (Envido|Real Envido|Falta Envido|Truco|Retruco|Vale Cuatro)\./, m => ({ t: `¡${m[2].toUpperCase()}!`, sub: m[1], vibrar: [20, 30, 20] })],
            [/cantó flor/, () => ({ t: '¡FLOR! 🌺' })],
            [/^(\S+) quiso el/, () => ({ t: '¡QUIERO!', sonido: 'acierto' })],
            [/no querido/, () => ({ t: 'NO QUIERO', sonido: 'error' })],
            [/^Envido querido: gana (\S+) con (\d+)/, m => ({ t: `${m[2]} de envido`, sub: `gana ${m[1]}`, sonido: 'logro' })],
            [/se fue al mazo/, () => ({ t: 'AL MAZO 🏳️', sonido: 'swoosh' })],
        ],
        escoba: [[/¡Escoba!/, () => ({ t: '¡ESCOBA! 🧹', sonido: 'logro', confeti: true })]],
        chinchon: [[/cerró la ronda/, () => ({ t: '¡CORTÓ! 🔒', sonido: 'logro' })]],
        uno: [
            [/roba 4\./, () => ({ t: '+4 💥', sonido: 'explosion', vibrar: [30, 40, 30] })],
            [/roba 2\./, () => ({ t: '+2', sonido: 'golpe' })],
            [/Turno salteado/, () => ({ t: '🚫 ¡SALTO!', sonido: 'swoosh' })],
            [/Reversa/, () => ({ t: '🔄 ¡REVERSA!', sonido: 'swoosh' })],
        ],
    };
    const historiales = new Map();
    function renglonesNuevos(viejo, nuevo) {
        for (let d = 0; d <= viejo.length; d++) {
            const cola = viejo.slice(d);
            if (cola.every((x, i) => nuevo[i] === x)) return nuevo.slice(cola.length);
        }
        return nuevo.slice(-1);
    }
    function historial(juego, lista) {
        lista = Array.isArray(lista) ? lista : [];
        const previo = historiales.get(juego);
        historiales.set(juego, lista.slice());
        if (!previo) return;
        const nuevos = renglonesNuevos(previo, lista).slice(-2);
        nuevos.forEach(linea => {
            for (const [re, armar] of (REGLAS[juego] || [])) {
                const m = re.exec(linea);
                if (!m) continue;
                const c = armar(m);
                cartel(c.t, { sub: c.sub, color: colorDe(c.sub || linea), sonido: c.sonido, vibrar: esJugadaAjena() ? c.vibrar : null });
                if (c.confeti && window.fx) window.fx.confeti(20);
                break;
            }
        });
    }
    // Un aviso que no sale del historial (ej. "¡UNO!" al quedar con una).
    const avisosPrevios = {};
    function siCambia(clave, valor, fn) {
        const antes = avisosPrevios[clave];
        avisosPrevios[clave] = valor;
        if (antes !== undefined && antes !== valor) fn(valor, antes);
    }

    // ==================== FOSFORITOS ====================
    // Los tantos del truco anotados como en la mesa: de a cinco, un
    // cuadradito y la diagonal. Los fósforos nuevos se "dibujan".
    const fosforosPrevios = {};
    const TRAZOS = [[3, 3, 3, 19], [3, 3, 19, 3], [19, 3, 19, 19], [3, 19, 19, 19], [3, 19, 19, 3]];
    function fosforos(n, clave, meta) {
        n = Math.max(0, n | 0);
        const antes = fosforosPrevios[clave];
        fosforosPrevios[clave] = n;
        const desde = (antes === undefined || antes > n) ? n : antes;
        let h = '<span class="aj-fosforos">';
        const grupos = Math.ceil(n / 5);
        let k = 0;
        for (let g = 0; g < grupos; g++) {
            if (meta === 30 && g === 3) h += '<span class="aj-fosforos-buenas" title="buenas"></span>';
            h += '<svg viewBox="0 0 22 22" class="aj-fosforo-grupo">';
            for (let s = 0; s < 5 && g * 5 + s < n; s++) {
                const i = g * 5 + s;
                const [x1, y1, x2, y2] = TRAZOS[s];
                const nuevo = i >= desde;
                const estilo = nuevo ? ` style="animation-delay:${(k++) * 0.18 + 0.2}s"` : '';
                h += `<g class="${nuevo ? 'aj-fosforo-nuevo' : ''}"${estilo}><line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="aj-palito"/><circle cx="${x2}" cy="${y2}" r="1.7" class="aj-cabeza"/></g>`;
            }
            h += '</svg>';
        }
        return h + '</span>';
    }

    window.animJuegos = { historial, cartel, fosforos, siCambia, colorDe, olvidar, naipe: svgNaipe };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', enganchar);
    else enganchar();
})();
