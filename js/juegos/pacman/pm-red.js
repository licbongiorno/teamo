// ============================================================
// pm-red.js — NetworkManager del Pac-Neón de a Dos, sobre js/enlace-vivo.js
// (WebRTC directo entre los dos celus, con respaldo por Firestore).
//
// Autoridad del anfitrión: el celu que arrancó la partida (e.host) calcula
// la IA de los fantasmas, las colisiones, la píldora, el rescate, las vidas y
// el puntaje, y los manda; el otro celu sólo mueve su Pac (al instante, sin
// esperar a la red) y avisa qué puntos se comió.
//
//   const red = PMRed.conectar({ alPos, alFoto, alEvento, alComer, alPuntos });
//   Anfitrión → invitado:   red.foto(s)            15 por segundo (se puede perder)
//                           red.evento(k, datos)    confiable (fantasma comido, atrapado, rescate, vida…)
//                           red.puntos([i, …])      confiable (puntos que se comió el anfitrión)
//   Invitado → anfitrión:   red.pos(p)              20 por segundo (se puede perder)
//                           red.comer(i)            confiable
//   Cada mensaje lleva la clave del nivel: lo de un nivel viejo se descarta.
// ============================================================
(function () {
    function conectar(cb) {
        let clave = null;
        const enlace = EnlaceVivo.conectar('pacman', {
            alMensaje(t, d) {
                if (!d || d.c !== clave) return;
                if (t === 'p') cb.alPos && cb.alPos(d);
                else if (t === 'e') cb.alFoto && cb.alFoto(d);
                else if (t === 'ev') cb.alEvento && cb.alEvento(d.k, d);
                else if (t === 'come') cb.alComer && cb.alComer(d.i);
                else if (t === 'c') cb.alPuntos && cb.alPuntos(d.l || []);
            },
        });
        const env = (t, d, seguro) => enlace.enviar(t, { ...d, c: clave }, !!seguro);
        return {
            enlace,
            set clave(v) { clave = v; }, get clave() { return clave; },
            pos: (p) => env('p', p),
            foto: (s) => env('e', s),
            evento: (k, d) => env('ev', { ...(d || {}), k }, true),
            comer: (i) => env('come', { i }, true),
            puntos: (l) => env('c', { l }, true),
            cerrar: () => enlace.cerrar(),
        };
    }
    window.PMRed = { conectar };
})();
