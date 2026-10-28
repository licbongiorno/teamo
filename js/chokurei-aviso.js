// ============================================================
// chokurei-aviso.js — Chokurei se hace notar fuera de su pantalla.
// Se usa en index.html (carita sobre el planeta Juegos) y en el menú
// de juegos.html (tarjetita "Chokurei te extraña"). Escucha el mismo
// documento juegos/mascota y calcula cómo está con las mismas reglas
// de decaimiento que js/juegos/mascota.js.
// ============================================================
(function () {
    const DECAY = { hambre: 5, diversion: 4, carino: 3, higiene: 2 };
    const NOMBRES = { hambre: 'tiene hambre 🐟', diversion: 'está aburrido 🧶', carino: 'quiere mimos 🖐️', higiene: 'necesita un baño 🫧' };
    let avisadoEstaVisita = false;

    function estadoChokurei(e){
        const ahora = typeof ahoraSync === 'function' ? ahoraSync() : Date.now();
        const val = {}, cero = [];
        for (const k of Object.keys(DECAY)) {
            const g = e[k] ?? 100, t = e[k + 'Actualizada'];
            val[k] = g == null ? 100 : Math.max(0, Math.round(g - ((ahora - (t || ahora)) / 3600000) * DECAY[k]));
            if (t) cero.push(Math.max(0, (ahora - (t + (g / DECAY[k]) * 3600000)) / 3600000));
        }
        const enferma = cero.some(h => h >= 10);
        const prom = (val.hambre + val.diversion + val.carino + val.higiene) / 4;
        const peor = Object.keys(val).sort((a, b) => val[a] - val[b])[0];
        const cara = enferma ? '🤒' : prom < 25 ? '😿' : val[peor] < 30 ? '🥺' : prom > 85 ? '😻' : '😺';
        return { val, enferma, peor, cara, necesita: enferma || val[peor] < 30 };
    }

    function iniciarAvisoChokurei(){
        if (!window.db) {
            const reintentar = () => iniciarAvisoChokurei();
            document.addEventListener('firebase-listo', reintentar, { once: true });
            document.addEventListener('firebase-listo-index', reintentar, { once: true });
            return;
        }
        if (window._escuchaAvisoChokurei) return; // a propósito sin _unsub: no es de un juego
        let ultimo = null;
        const pintar = () => { if (ultimo) render(estadoChokurei(ultimo)); };
        window._escuchaAvisoChokurei = window.onSnapshot(window.doc(window.db, 'juegos', 'mascota'), (snap) => {
            ultimo = snap.exists() ? snap.data() : null;
            pintar();
        }, () => {});
        setInterval(pintar, 5 * 60000); // las necesidades bajan con el tiempo aunque nadie escriba
    }

    function render(s){
        const enlace = 'juegos.html?juego=mascota';
        const texto = s.enferma ? 'no se siente bien 🤒' : NOMBRES[s.peor];
        // Inicio: carita sobre el planeta Juegos.
        const planeta = document.querySelector('.planeta-juegos');
        if (planeta) {
            let c = planeta.querySelector('.carita-chokurei');
            if (!c) { c = document.createElement('span'); c.className = 'carita-chokurei'; planeta.appendChild(c); }
            c.textContent = s.cara;
            c.classList.toggle('necesita', s.necesita);
            c.title = s.necesita ? `Chokurei ${texto}` : 'Chokurei está bien';
        }
        // Menú de juegos: tarjetita cuando necesita algo.
        const menu = document.getElementById('aviso-chokurei');
        if (menu) {
            menu.innerHTML = s.necesita ? `<div class="aviso-chokurei" onclick="abrirJuego('mascota')"><span class="cara">${s.cara}</span><span><b>Chokurei ${texto}</b><small>Tocá para ir a verlo</small></span></div>` : '';
        }
        // Una vez por visita, un cartelito (si existe el sistema de carteles).
        if (s.necesita && !avisadoEstaVisita && typeof mostrarCartelEnVivo === 'function' && !document.querySelector('#pantalla-mascota.activa')) {
            avisadoEstaVisita = true;
            setTimeout(() => mostrarCartelEnVivo({ titulo: `${s.cara} Chokurei te extraña`, sub: `Chokurei ${texto}`, si: 'Ir a verlo', no: 'Después',
                alSi: () => { if (typeof abrirJuego === 'function' && document.getElementById('pantalla-mascota')) abrirJuego('mascota'); else location.href = enlace; }, duracion: 9000 }), 2500);
        }
    }

    // Estilos propios (sirven en las dos páginas).
    const css = document.createElement('style');
    css.textContent = `
        .carita-chokurei{ position:absolute; bottom:-6px; right:-8px; font-size:1.05rem; line-height:1; filter:drop-shadow(0 1px 2px #0008); pointer-events:none; }
        .carita-chokurei.necesita{ animation:caritaChokurei 1.2s ease-in-out infinite; }
        @keyframes caritaChokurei{ 0%,100%{ transform:scale(1) rotate(0); } 50%{ transform:scale(1.25) rotate(-10deg); } }
        .aviso-chokurei{ display:flex; align-items:center; gap:10px; margin:0 0 14px; padding:10px 14px; border-radius:14px; cursor:pointer;
            background:rgba(255,179,198,0.14); border:1px solid rgba(255,179,198,0.55); }
        .aviso-chokurei .cara{ font-size:1.8rem; animation:caritaChokurei 1.2s ease-in-out infinite; }
        .aviso-chokurei span{ display:flex; flex-direction:column; font-size:0.88rem; }
        .aviso-chokurei small{ opacity:0.7; font-size:0.72rem; }
        @media (prefers-reduced-motion: reduce){ .carita-chokurei.necesita, .aviso-chokurei .cara{ animation:none; } }
    `;
    document.head.appendChild(css);

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciarAvisoChokurei);
    else iniciarAvisoChokurei();
    window.estadoChokureiAviso = estadoChokurei;
})();
