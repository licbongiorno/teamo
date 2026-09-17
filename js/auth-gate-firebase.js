// ============================================================
// auth-gate-firebase.js — OPCIONAL, no se usa a menos que lo actives.
//
// Es una versión del portón de acceso que valida usuario/contraseña
// contra Firebase Authentication (cuentas reales, contraseña propia
// por persona) en vez de la contraseña compartida "777" que usa
// js/auth-gate.js. La diferencia importante: con esto, la contraseña
// NUNCA viaja dentro del código de la web — vive del lado de Firebase,
// así que alguien mirando "ver código fuente" no la puede leer.
//
// ---- Antes de activar esto, hace falta (una sola vez, en la consola
// de Firebase, no se puede hacer desde acá): ----
//   1. https://console.firebase.google.com → proyecto "carolina-634a1"
//   2. Authentication → Sign-in method → habilitar "Correo/contraseña"
//   3. Authentication → Users → "Add user" y crear DOS cuentas:
//        - carito@nuestro-refugio.app   con la contraseña que Carito elija
//        - nico@nuestro-refugio.app     con la contraseña que Nico elija
//      (el "email" es sólo un identificador para Firebase, no hace
//      falta que reciba correos de verdad — pero tiene que existir
//      exactamente como se escribe acá, o cambiar EMAILS más abajo)
//   4. Recién ahí esto puede funcionar — antes de crear las cuentas,
//      cualquier intento de entrar va a fallar con "credenciales
//      inválidas" aunque la contraseña esté bien escrita.
//
// ---- Cómo activarlo en la web (después del paso anterior): ----
//   En cada página, reemplazar:
//       <script src="js/auth-gate.js"></script>
//   por:
//       <script type="module" src="js/auth-gate-firebase.js"></script>
//   El HTML del portón (los botones "Carito"/"Nico" + el input de
//   contraseña) no cambia, así que no hace falta tocar nada más.
//
// No se probó contra un proyecto de Firebase real (no hay acceso a la
// consola desde acá) — probarlo con las dos cuentas ya creadas antes
// de confiar en que reemplaza a auth-gate.js.
// ============================================================
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut }
    from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

var EMAILS = {
    carito: 'carito@nuestro-refugio.app',
    nico: 'nico@nuestro-refugio.app'
};

var usuarioElegido = null;

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

function esperarAuth() {
    // js/firebase.js o js/index-firebase.js ya inicializan la app antes
    // de este script — acá sólo tomamos la instancia ya creada.
    return getAuth();
}

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
    var clave = claveInput ? claveInput.value : '';

    if (!usuarioElegido) {
        if (error) error.textContent = 'Elegí quién sos primero 💭';
        return;
    }
    var auth = esperarAuth();
    signInWithEmailAndPassword(auth, EMAILS[usuarioElegido], clave)
        .then(function () {
            if (navigator.vibrate) { try { navigator.vibrate(15); } catch (e) {} }
            localStorage.setItem('identidadRefugio', usuarioElegido); // compat con el resto del sitio
            ocultarPorton();
            mostrarChipSesion(usuarioElegido);
        })
        .catch(function () {
            if (navigator.vibrate) { try { navigator.vibrate([10, 40, 10]); } catch (e) {} }
            if (error) error.textContent = 'Contraseña incorrecta 💔';
            if (claveInput) claveInput.value = '';
        });
};

window.gateEntrarConEnter = function (event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        window.gateEntrar();
    }
};

window.gateCerrarSesion = function () {
    if (!window.confirm('¿Cerrar sesión y volver a pedir usuario y contraseña en este dispositivo?')) return;
    signOut(esperarAuth()).finally(function () {
        localStorage.removeItem('identidadRefugio');
        location.reload();
    });
};

onAuthStateChanged(esperarAuth(), function (user) {
    if (user && user.email) {
        var usuario = user.email === EMAILS.carito ? 'carito' : (user.email === EMAILS.nico ? 'nico' : null);
        if (usuario) {
            localStorage.setItem('identidadRefugio', usuario);
            ocultarPorton();
            mostrarChipSesion(usuario);
            return;
        }
    }
    document.body.style.overflow = 'hidden';
});
