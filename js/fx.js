// ============================================================
// fx.js — efectos visuales compartidos (confeti, sacudida,
// resplandor). Sin dependencias externas: los CDN de librerías de
// confeti/partículas están bloqueados desde donde se armó este
// sitio, así que esto es un mini-confeti hecho a mano con divs y
// CSS — liviano, sin imágenes, funciona offline.
//
// Uso: if (window.fx) window.fx.confeti();
// Respeta prefers-reduced-motion (no dispara nada si la persona
// pidió menos movimiento) y la sordina de sonido no lo afecta —
// son dos preferencias independientes.
// ============================================================
(function () {
    const COLORES_CONFETI = ['#ffb3c6', '#c9b6ff', '#a8d8ff', '#a8edea', '#f5d9a0', '#fdf6f0'];

    function reduceMovimiento() {
        return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    // Lluvia de confeti sobre toda la pantalla — para victorias, logros
    // desbloqueados, récords nuevos, etc. Se limpia sola.
    function confeti(cantidad) {
        if (reduceMovimiento()) return;
        cantidad = cantidad || 34;
        const cont = document.createElement('div');
        cont.className = 'fx-capa-confeti';
        for (let i = 0; i < cantidad; i++) {
            const p = document.createElement('div');
            const color = COLORES_CONFETI[Math.floor(Math.random() * COLORES_CONFETI.length)];
            const izq = Math.random() * 100;
            const retraso = Math.random() * 0.35;
            const duracion = 1.7 + Math.random() * 1.3;
            const tam = 6 + Math.random() * 7;
            const giroFinal = (360 + Math.random() * 360) * (Math.random() < 0.5 ? -1 : 1);
            const derivaX = (Math.random() * 60 - 30) + 'px';
            p.className = 'fx-confeti-pieza';
            p.style.cssText =
                `left:${izq}vw; width:${tam}px; height:${tam * 0.42}px; background:${color};` +
                `animation-duration:${duracion}s; animation-delay:${retraso}s;` +
                `--fx-giro:${giroFinal}deg; --fx-deriva-x:${derivaX};`;
            cont.appendChild(p);
        }
        document.body.appendChild(cont);
        setTimeout(() => cont.remove(), 3400);
    }

    // Sacude un elemento (fallo, error) — reutiliza @keyframes sacudirError de juegos.css.
    function sacudir(el) {
        if (!el || reduceMovimiento()) return;
        el.classList.remove('sacudir');
        void el.offsetWidth;
        el.classList.add('sacudir');
    }

    // Resalta un elemento con el mismo "pop" que ya usan los logros.
    function destacar(el) {
        if (!el || reduceMovimiento()) return;
        el.classList.remove('logro-animado');
        void el.offsetWidth;
        el.classList.add('logro-animado');
    }

    // Ondas cortas que se expanden desde el centro de la pantalla —
    // para momentos de impacto puntual (golpe fuerte, explosión).
    function destello(color) {
        if (reduceMovimiento()) return;
        const el = document.createElement('div');
        el.className = 'fx-destello-pantalla';
        if (color) el.style.background = color;
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 420);
    }

    window.fx = { confeti, sacudir, destacar, destello };
})();
