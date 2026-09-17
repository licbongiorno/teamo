// ============================================================
// auth-gate.js — portón de acceso (usuario + contraseña) para todo
// el sitio ("nuestro refugio" y "nuestros juegos"). Se incluye como
// script clásico justo después del <div id="gate-acceso"> en cada
// página, así corre apenas el navegador lo lee (sin esperar a que
// cargue el resto de la página) y tapa el contenido antes de pintarlo.
//
// Importante: esto es un candado simple del lado del cliente, no
// seguridad real — cualquiera que abra el "ver código fuente" puede
// leer la contraseña. Alcanza para frenar a alguien que llega al
// link por curiosidad, no a alguien decidido a entrar igual. Si en
// algún momento hace falta seguridad de verdad, hay que validar esto
// contra un servidor (por ejemplo con Firebase Authentication).
// ============================================================
(function () {
    var USUARIOS_VALIDOS = ['carito', 'nico'];
    var CLAVE_VALIDA = '777';
    var LLAVE_SESION = 'sesionRefugio';

    var usuarioElegido = null;

    function sesionActiva() {
        try {
            var datos = JSON.parse(localStorage.getItem(LLAVE_SESION) || 'null');
            return !!(datos && USUARIOS_VALIDOS.indexOf(datos.usuario) !== -1);
        } catch (e) {
            return false;
        }
    }

    function ocultarPorton() {
        var gate = document.getElementById('gate-acceso');
        if (gate) gate.classList.add('gate-oculto');
        document.body.style.overflow = '';
    }

    function mostrarChipSesion(usuario) {
        var chip = document.getElementById('gate-chip-sesion');
        if (!chip) {
            chip = document.createElement('button');
            chip.id = 'gate-chip-sesion';
            chip.className = 'gate-chip-sesion';
            chip.type = 'button';
            chip.title = 'Tocá para cerrar sesión';
            chip.onclick = window.gateCerrarSesion;
            document.body.appendChild(chip);
        }
        chip.textContent = (usuario === 'carito' ? 'Carito 💖' : 'Nico 💙') + ' · salir';
    }

    function concederAcceso(usuario) {
        localStorage.setItem(LLAVE_SESION, JSON.stringify({ usuario: usuario, ts: Date.now() }));
        // Compat: el resto del sitio (chat, juegos, muro, etc.) ya lee
        // esta misma llave para saber "quién sos", así que con esto
        // alcanza para que no vuelvan a pedir identidad por separado.
        localStorage.setItem('identidadRefugio', usuario);
        ocultarPorton();
        mostrarChipSesion(usuario);
        document.dispatchEvent(new CustomEvent('acceso-concedido', { detail: { usuario: usuario } }));
    }

    window.gateCerrarSesion = function () {
        if (!window.confirm('¿Cerrar sesión y volver a pedir usuario y contraseña en este dispositivo?')) return;
        localStorage.removeItem(LLAVE_SESION);
        localStorage.removeItem('identidadRefugio');
        location.reload();
    };

    window.gateElegirUsuario = function (boton) {
        usuarioElegido = boton.getAttribute('data-usuario');
        var botones = document.querySelectorAll('.gate-btn-usuario');
        for (var i = 0; i < botones.length; i++) {
            botones[i].classList.toggle('gate-seleccionado', botones[i] === boton);
        }
        var error = document.getElementById('gate-error');
        if (error) error.textContent = '';
    };

    window.gateEntrar = function () {
        var claveInput = document.getElementById('gate-clave');
        var error = document.getElementById('gate-error');
        var clave = claveInput ? claveInput.value.trim() : '';

        if (!usuarioElegido) {
            if (error) error.textContent = 'Elegí quién sos primero 💭';
            return;
        }
        if (clave === CLAVE_VALIDA) {
            if (navigator.vibrate) { try { navigator.vibrate(15); } catch (e) {} }
            concederAcceso(usuarioElegido);
        } else {
            if (navigator.vibrate) { try { navigator.vibrate([10, 40, 10]); } catch (e) {} }
            if (error) error.textContent = 'Contraseña incorrecta 💔';
            if (claveInput) claveInput.value = '';
        }
    };

    window.gateEntrarConEnter = function (event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            window.gateEntrar();
        }
    };

    function usuarioDeSesion() {
        try {
            var datos = JSON.parse(localStorage.getItem(LLAVE_SESION) || 'null');
            return datos ? datos.usuario : null;
        } catch (e) {
            return null;
        }
    }

    // El <div id="gate-acceso"> ya está en el DOM en este punto porque
    // este script se incluye inmediatamente después en el HTML.
    if (sesionActiva()) {
        ocultarPorton();
        document.addEventListener('DOMContentLoaded', function () {
            mostrarChipSesion(usuarioDeSesion());
        });
    } else {
        document.body.style.overflow = 'hidden';
    }
})();
