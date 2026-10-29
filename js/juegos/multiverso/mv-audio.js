// ============================================================
// mv-audio.js — el sonido del Multiverso Arcade. El motor se pasó a
// js/audio-arcade.js (AudioArcade) para que lo usen todos los juegos de
// acción; acá queda la misma interfaz de siempre:
//
//   MVAudio.iniciar()  ·  MVAudio.sfx('laser', {jugador}) …
//   MVAudio.musica('menu' | 'exploracion' | 'combate' | null)
// ============================================================
(function () {
    const A = () => window.AudioArcade;
    const MODOS = { menu: 'pausa', exploracion: 'calma', combate: 'combate' };
    window.MVAudio = {
        iniciar() { if (A()) A().iniciar(); },
        sfx(nombre, o) { if (A()) A().sfx(nombre, o); },
        musica(modo) { if (A()) A().musica(modo ? 'espacio' : null, MODOS[modo] || 'calma'); },
        get listo() { return !!(A() && A().listo); },
    };
})();
