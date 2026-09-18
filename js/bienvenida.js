// ============================================================
// bienvenida.js — tour de bienvenida la primera vez que alguien
// entra (una sola vez por dispositivo, se guarda en localStorage).
// Se dispara con el mismo evento 'acceso-concedido' que ya usa
// auth-gate.js — o sea, sólo aparece justo después de escribir la
// contraseña por primera vez, nunca en una sesión ya guardada.
// Con 71 juegos y siete secciones distintas, vale la pena un mapa
// rápido antes de largarse a explorar solo.
// Se auto-inyecta su propio HTML/CSS, así no hace falta tocar el
// <body> de index.html a mano.
// ============================================================
(function () {
    const LLAVE_VISTO = 'tourBienvenidaVisto';

    const secciones = [
        { emoji: '📖', nombre: 'Nuestro Universo', desc: 'el libro de mensajes con el que arranca todo' },
        { emoji: '💬', nombre: 'Chat privado', desc: 'con "visto" y hasta un zumbido al estilo MSN' },
        { emoji: '🕊️', nombre: 'Muro en el Tiempo', desc: 'recuerdos que quedan guardados para siempre' },
        { emoji: '💛', nombre: 'Rincón de la Gratitud', desc: '"hoy te amo por..." cuando quieran' },
        { emoji: '🌠', nombre: 'Lista de Deseos', desc: 'sueños compartidos, para ir tachando juntos' },
        { emoji: '🎮', nombre: 'Nuestros Juegos', desc: 'más de 70 — hay buscador si se pierden' },
        { emoji: '🐱', nombre: 'Chokurei', desc: 'nuestra mascota virtual, cuídenla entre los dos' },
    ];

    const html = `
        <div id="modal-bienvenida" class="gate-acceso gate-oculto" style="z-index:999990;">
            <div class="gate-tarjeta" style="width:min(92vw,400px);">
                <div class="gate-candado">💕</div>
                <h2>¡Bienvenidos a nuestro refugio!</h2>
                <p>Un mapa rápido de lo que hay para explorar, a su ritmo, cuando quieran:</p>
                <div class="bienvenida-grilla">
                    ${secciones.map(s => `
                        <div class="bienvenida-item">
                            <span class="bienvenida-emoji">${s.emoji}</span>
                            <span class="bienvenida-nombre">${s.nombre}</span>
                            <span class="bienvenida-desc">${s.desc}</span>
                        </div>
                    `).join('')}
                </div>
                <button class="gate-btn-entrar" id="btn-cerrar-bienvenida" style="margin-top:16px;">¡Vamos! 💕</button>
            </div>
        </div>
        <button id="btn-ayuda-bienvenida" class="gate-chip-sesion" style="right:12px; left:auto; bottom:calc(56px + env(safe-area-inset-bottom,0px));" title="Ver de nuevo el mapa de bienvenida">❓ Guía</button>
    `;

    const estilos = document.createElement('style');
    estilos.textContent = `
        .bienvenida-grilla{ display:grid; grid-template-columns:repeat(2,1fr); gap:10px; text-align:left; margin-bottom:6px; }
        .bienvenida-item{ background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:14px; padding:10px; display:flex; flex-direction:column; gap:2px; }
        .bienvenida-emoji{ font-size:1.4rem; }
        .bienvenida-nombre{ font-size:0.78rem; font-weight:bold; color:#ffc2d9; }
        .bienvenida-desc{ font-size:0.68rem; color:rgba(255,255,255,0.65); line-height:1.3; }
    `;

    function inyectar(){
        document.body.insertAdjacentHTML('beforeend', html);
        document.head.appendChild(estilos);
        document.getElementById('btn-cerrar-bienvenida').addEventListener('click', cerrarBienvenida);
        document.getElementById('btn-ayuda-bienvenida').addEventListener('click', mostrarBienvenida);
    }

    function mostrarBienvenida(){
        const modal = document.getElementById('modal-bienvenida');
        if (modal) modal.classList.remove('gate-oculto');
        if (navigator.vibrate) { try { navigator.vibrate(12); } catch (e) {} }
    }
    function cerrarBienvenida(){
        const modal = document.getElementById('modal-bienvenida');
        if (modal) modal.classList.add('gate-oculto');
        try { localStorage.setItem(LLAVE_VISTO, '1'); } catch (e) {}
    }
    window.mostrarBienvenida = mostrarBienvenida;

    function alListo(fn){
        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
        else fn();
    }

    alListo(() => {
        inyectar();
        document.addEventListener('acceso-concedido', () => {
            let yaVisto = false;
            try { yaVisto = localStorage.getItem(LLAVE_VISTO) === '1'; } catch (e) {}
            if (!yaVisto) setTimeout(mostrarBienvenida, 650);
        });
    });
})();
