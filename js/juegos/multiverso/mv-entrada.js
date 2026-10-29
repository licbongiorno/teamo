// ============================================================
// mv-entrada.js — controles del Multiverso Arcade (dos jugadores en la
// misma pantalla).
//
// Teclado (cada jugador con su propio grupo de teclas, por e.code):
//   J1: W A S D mover · Espacio disparar · Q especial (Bomba Nova) · E dash
//   J2: flechas mover · Enter disparar · Shift derecho especial · Ctrl derecho (o "/") dash
// El estado de cada tecla se guarda aparte (keydown/keyup) y se resetea al
// perder el foco, así una tecla nunca queda "pegada". El ghosting de
// verdad es del hardware del teclado: los grupos de teclas están elegidos
// lejos entre sí (izquierda / derecha) para que choquen lo menos posible.
//
// Táctil (Pointer Events, cada dedo con su pointerId):
//   La pantalla se divide en dos zonas (izquierda/derecha si está acostado,
//   abajo/arriba si está parado). En cada zona:
//   - el primer dedo es un joystick relativo: donde apoyás es el centro;
//   - un segundo dedo: tocar = disparar (mantener = ráfaga);
//   - doble toque rápido = dash;
//   - el botón ★ de la esquina de la zona = especial.
//   Cada jugador puede usar dos dedos a la vez: cuatro pulgares en total.
//
//   const ent = MVEntrada.crear(canvas);
//   ent.leer(0) → { mx, my (−1..1), fuego, dash (sólo el cuadro en que se pidió), especial }
//   ent.zonas() → para dibujar joysticks y botones; ent.destruir()
// ============================================================
(function () {
    const TECLAS = [
        { arriba: ['KeyW'], abajo: ['KeyS'], izq: ['KeyA'], der: ['KeyD'], fuego: ['Space'], especial: ['KeyQ'], dash: ['KeyE'] },
        { arriba: ['ArrowUp'], abajo: ['ArrowDown'], izq: ['ArrowLeft'], der: ['ArrowRight'], fuego: ['Enter', 'NumpadEnter'], especial: ['ShiftRight', 'Numpad0'], dash: ['ControlRight', 'Slash', 'NumpadDecimal'] },
    ];
    const TODAS = new Set(TECLAS.flatMap(t => Object.values(t).flat()));

    function crear(canvas, opciones = {}) {
        const abajo = new Set(), dashPedido = [false, false];
        const dedos = new Map(); // pointerId → { j, tipo: 'joy'|'fuego'|'especial', x0, y0, x, y, t }
        const ultimoToque = [0, 0];
        let tactil = false;
        const activo = () => !opciones.activo || opciones.activo();

        const teclaAbajo = (ev) => {
            if (!activo() || !TODAS.has(ev.code)) return;
            if (ev.target && /INPUT|TEXTAREA/.test(ev.target.tagName)) return;
            ev.preventDefault();
            if (!abajo.has(ev.code)) TECLAS.forEach((t, j) => { if (t.dash.includes(ev.code)) dashPedido[j] = true; });
            abajo.add(ev.code);
            if (opciones.alPrimerGesto) opciones.alPrimerGesto();
        };
        const teclaArriba = (ev) => { abajo.delete(ev.code); };
        const limpiar = () => { abajo.clear(); dedos.clear(); };
        window.addEventListener('keydown', teclaAbajo);
        window.addEventListener('keyup', teclaArriba);
        window.addEventListener('blur', limpiar);

        // Zona de cada jugador según la orientación del lienzo.
        function zonaDe(x, y) {
            const r = canvas.getBoundingClientRect(), acostado = r.width >= r.height;
            return acostado ? (x - r.left < r.width / 2 ? 0 : 1) : (y - r.top > r.height / 2 ? 0 : 1);
        }
        function botonEspecial(j) {
            const r = canvas.getBoundingClientRect(), acostado = r.width >= r.height, rad = Math.min(r.width, r.height) * 0.075;
            if (acostado) return { x: j === 0 ? rad * 1.5 : r.width - rad * 1.5, y: r.height - rad * 1.5, r: rad };
            return { x: r.width - rad * 1.5, y: j === 0 ? r.height - rad * 1.5 : rad * 1.5, r: rad };
        }
        const abajoPtr = (ev) => {
            if (!activo()) return;
            ev.preventDefault();
            tactil = true;
            if (opciones.alPrimerGesto) opciones.alPrimerGesto();
            canvas.setPointerCapture && canvas.setPointerCapture(ev.pointerId);
            const r = canvas.getBoundingClientRect(), j = zonaDe(ev.clientX, ev.clientY), lx = ev.clientX - r.left, ly = ev.clientY - r.top;
            const be = botonEspecial(j);
            let tipo = 'joy';
            if (Math.hypot(lx - be.x, ly - be.y) < be.r * 1.25) tipo = 'especial';
            else if ([...dedos.values()].some(d => d.j === j && d.tipo === 'joy')) tipo = 'fuego';
            const ahora = performance.now();
            if (tipo !== 'especial' && ahora - ultimoToque[j] < 260) dashPedido[j] = true;
            if (tipo !== 'especial') ultimoToque[j] = ahora;
            dedos.set(ev.pointerId, { j, tipo, x0: lx, y0: ly, x: lx, y: ly, t: ahora });
        };
        const moverPtr = (ev) => {
            const d = dedos.get(ev.pointerId); if (!d) return;
            ev.preventDefault();
            const r = canvas.getBoundingClientRect(); d.x = ev.clientX - r.left; d.y = ev.clientY - r.top;
        };
        const arribaPtr = (ev) => {
            const d = dedos.get(ev.pointerId); if (!d) return;
            // Un toque corto con el dedo del joystick también dispara.
            if (d.tipo === 'joy' && performance.now() - d.t < 200 && Math.hypot(d.x - d.x0, d.y - d.y0) < 12) d.tap = performance.now();
            dedos.delete(ev.pointerId);
            if (d.tap) tapsPend[d.j] = 3; // dispara durante unos cuadros
        };
        const tapsPend = [0, 0];
        canvas.addEventListener('pointerdown', abajoPtr);
        canvas.addEventListener('pointermove', moverPtr);
        canvas.addEventListener('pointerup', arribaPtr);
        canvas.addEventListener('pointercancel', arribaPtr);
        canvas.addEventListener('contextmenu', (ev) => ev.preventDefault());

        function leer(j) {
            const t = TECLAS[j], k = (l) => l.some(c => abajo.has(c));
            let mx = (k(t.der) ? 1 : 0) - (k(t.izq) ? 1 : 0), my = (k(t.abajo) ? 1 : 0) - (k(t.arriba) ? 1 : 0);
            let fuego = k(t.fuego), especial = k(t.especial), analogico = false;
            const r = canvas.getBoundingClientRect(), radio = Math.max(34, Math.min(r.width, r.height) * 0.09);
            for (const d of dedos.values()) {
                if (d.j !== j) continue;
                if (d.tipo === 'joy') {
                    const dx = d.x - d.x0, dy = d.y - d.y0, m = Math.hypot(dx, dy);
                    if (m > 6) { const f = Math.min(1, m / radio); mx = dx / m * f; my = dy / m * f; analogico = true; }
                    // Si el dedo se va muy lejos, el centro lo sigue (joystick "flotante").
                    if (m > radio * 1.4) { d.x0 = d.x - dx / m * radio * 1.4; d.y0 = d.y - dy / m * radio * 1.4; }
                }
                if (d.tipo === 'fuego') fuego = true;
                if (d.tipo === 'especial') especial = true;
            }
            if (tapsPend[j] > 0) { fuego = true; tapsPend[j]--; }
            if (!analogico && mx && my) { mx *= Math.SQRT1_2; my *= Math.SQRT1_2; }
            const dash = dashPedido[j]; dashPedido[j] = false;
            return { mx, my, fuego, dash, especial, tactil };
        }
        // Para dibujar: joysticks activos y botones especiales (en px del lienzo en pantalla).
        function zonas() {
            const joys = [], r = canvas.getBoundingClientRect();
            for (const d of dedos.values()) if (d.tipo === 'joy') joys.push({ j: d.j, x0: d.x0, y0: d.y0, x: d.x, y: d.y });
            return { tactil, joys, botones: [botonEspecial(0), botonEspecial(1)], acostado: r.width >= r.height, w: r.width, h: r.height, especial: [0, 1].map(j => [...dedos.values()].some(d => d.j === j && d.tipo === 'especial')) };
        }
        function destruir() {
            window.removeEventListener('keydown', teclaAbajo); window.removeEventListener('keyup', teclaArriba); window.removeEventListener('blur', limpiar);
            canvas.removeEventListener('pointerdown', abajoPtr); canvas.removeEventListener('pointermove', moverPtr); canvas.removeEventListener('pointerup', arribaPtr); canvas.removeEventListener('pointercancel', arribaPtr);
        }
        return { leer, zonas, destruir, limpiar };
    }
    window.MVEntrada = { crear, TECLAS };
})();
