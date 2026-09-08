// usuario.js — identidad compartida (nico/carito) y helper de vibración.
// Script clásico (no módulo): sus funciones quedan en window para que
// cualquier otro archivo (navegacion.js, js/juegos/*.js) las use directo.
// ==================== IDENTIDAD (compartida con index.html) ====================
let miIdentidad = localStorage.getItem("identidadRefugio");
let miRival = null;

function actualizarChipIdentidad(){
    miRival = miIdentidad === 'nico' ? 'carito' : 'nico';
    const chip = document.getElementById('chip-identidad');
    chip.innerText = miIdentidad === 'carito' ? 'Carito 💖' : 'Nico 💙';
}

function pedirIdentidadSiHaceFalta(){
    if (miIdentidad === 'nico' || miIdentidad === 'carito') {
        actualizarChipIdentidad();
        iniciarJuegos();
    } else {
        document.getElementById('modal-acceso').classList.remove('oculto');
        setTimeout(() => document.getElementById('input-clave-juegos').focus(), 150);
    }
}

function verificarIdentidadJuegos(){
    const clave = document.getElementById('input-clave-juegos').value.toLowerCase().trim();
    if (clave === 'nico' || clave === 'carito') {
        miIdentidad = clave;
        localStorage.setItem('identidadRefugio', miIdentidad);
        document.getElementById('modal-acceso').classList.add('oculto');
        actualizarChipIdentidad();
        iniciarJuegos();
    } else {
        document.getElementById('error-clave-juegos').innerText = 'Llave incorrecta 💔';
        document.getElementById('input-clave-juegos').value = '';
    }
}

function vibrarJ(patron){ if (navigator.vibrate) { try { navigator.vibrate(patron); } catch(e){} } }

// Helper compartido para los juegos nuevos (los juegos más viejos
// tienen su propia versión local con otro nombre, por compatibilidad).
function nombreJugador(id){ return id === 'carito' ? 'Carito' : 'Nico'; }
