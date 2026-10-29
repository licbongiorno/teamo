// ============================================================
// pm-entrada.js — InputHandler del Pac-Neón de a Dos.
//
//   const ent = PMEntrada.crear(zona, alGirar);
//   alGirar([dx, dy]) cada vez que se pide una dirección.
//
// Deslizamiento continuo ("swipe to queue"): mientras el dedo está apoyado,
// cada vez que se desliza ~16 px en una dirección esa dirección queda
// ENCOLADA; el Pac dobla solo al llegar a la próxima esquina donde se pueda.
// Se puede ir encadenando giros sin levantar el dedo. Así la jugada se anota
// antes de la esquina y la latencia no se nota. También teclado (flechas/WASD).
// ============================================================
(function () {
    const TECLAS = { ArrowUp: [0, -1], KeyW: [0, -1], ArrowDown: [0, 1], KeyS: [0, 1], ArrowLeft: [-1, 0], KeyA: [-1, 0], ArrowRight: [1, 0], KeyD: [1, 0] };
    function crear(zona, alGirar, activo) {
        let ini = null;
        const ok = () => !activo || activo();
        const abajo = (ev) => { if (!ok()) return; ini = [ev.clientX, ev.clientY]; try { zona.setPointerCapture(ev.pointerId); } catch (_) { /* nada */ } };
        const mover = (ev) => {
            if (!ini || !ok()) return;
            const dx = ev.clientX - ini[0], dy = ev.clientY - ini[1];
            if (Math.max(Math.abs(dx), Math.abs(dy)) < 16) return;
            ev.preventDefault();
            alGirar(Math.abs(dx) > Math.abs(dy) ? [Math.sign(dx), 0] : [0, Math.sign(dy)]);
            ini = [ev.clientX, ev.clientY]; // sigue deslizando: se puede encolar el próximo giro
        };
        const arriba = () => { ini = null; };
        zona.addEventListener('pointerdown', abajo);
        zona.addEventListener('pointermove', mover, { passive: false });
        zona.addEventListener('pointerup', arriba); zona.addEventListener('pointercancel', arriba);
        zona.style.touchAction = 'none';
        const tecla = (ev) => {
            const d = TECLAS[ev.code];
            if (!d || !ok() || (ev.target && /INPUT|TEXTAREA/.test(ev.target.tagName))) return;
            ev.preventDefault(); alGirar(d);
        };
        window.addEventListener('keydown', tecla);
        return { destruir() { zona.removeEventListener('pointerdown', abajo); zona.removeEventListener('pointermove', mover); window.removeEventListener('keydown', tecla); } };
    }
    window.PMEntrada = { crear };
})();
