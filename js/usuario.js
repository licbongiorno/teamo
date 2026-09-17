// usuario.js — identidad compartida (nico/carito) y helper de vibración.
// Script clásico (no módulo): sus funciones quedan en window para que
// cualquier otro archivo (navegacion.js, js/juegos/*.js) las use directo.
// ==================== IDENTIDAD (compartida con index.html) ====================
let miIdentidad = localStorage.getItem("identidadRefugio");
let miRival = null;
let _juegosYaIniciados = false;

function actualizarChipIdentidad(){
    miRival = miIdentidad === 'nico' ? 'carito' : 'nico';
    const chip = document.getElementById('chip-identidad');
    chip.innerText = miIdentidad === 'carito' ? 'Carito 💖' : 'Nico 💙';
}

// Punto único por el que se confirma la identidad y se arranca el menú,
// venga de donde venga (portón nuevo, modal viejo de respaldo, o ya
// estaba guardada de antes) — así iniciarJuegos() nunca corre dos veces
// aunque más de un camino confirme la identidad casi al mismo tiempo.
function confirmarIdentidadJuegos(usuario){
    miIdentidad = usuario;
    actualizarChipIdentidad();
    const modalViejo = document.getElementById('modal-acceso');
    if (modalViejo) modalViejo.classList.add('oculto');
    if (_juegosYaIniciados) return;
    _juegosYaIniciados = true;
    if (typeof iniciarJuegos === 'function') iniciarJuegos();
}

function pedirIdentidadSiHaceFalta(){
    if (miIdentidad === 'nico' || miIdentidad === 'carito') {
        confirmarIdentidadJuegos(miIdentidad);
    } else {
        document.getElementById('modal-acceso').classList.remove('oculto');
        setTimeout(() => document.getElementById('input-clave-juegos').focus(), 150);
    }
}

// El portón de acceso (js/auth-gate.js) confirma quién es de forma
// asincrónica (recién cuando el usuario completa el formulario), pero
// arrancarJuegos() en juegos.html puede dispararse antes de eso (apenas
// termina el login anónimo de Firebase, que suele ser más rápido que
// llenar el formulario) — en ese momento miIdentidad todavía es null,
// así que pedirIdentidadSiHaceFalta() mostraba el modal viejo (sin
// contraseña) encima del portón nuevo. Escuchando este evento nos
// enteramos apenas el portón confirma, sin depender de esa carrera.
document.addEventListener('acceso-concedido', (e) => {
    confirmarIdentidadJuegos(e.detail.usuario);
});

function verificarIdentidadJuegos(){
    const clave = document.getElementById('input-clave-juegos').value.toLowerCase().trim();
    if (clave === 'nico' || clave === 'carito') {
        localStorage.setItem('identidadRefugio', clave);
        confirmarIdentidadJuegos(clave);
    } else {
        document.getElementById('error-clave-juegos').innerText = 'Llave incorrecta 💔';
        document.getElementById('input-clave-juegos').value = '';
    }
}

function vibrarJ(patron){ if (navigator.vibrate) { try { navigator.vibrate(patron); } catch(e){} } }

// Helper compartido para los juegos nuevos (los juegos más viejos
// tienen su propia versión local con otro nombre, por compatibilidad).
function nombreJugador(id){ return id === 'carito' ? 'Carito' : 'Nico'; }
