// ==================== CHAT FLOTANTE ====================
// El recibo de lectura compartido, el indicador de "mensaje nuevo" y
// el zumbido viven en js/chat-comun.js (se usan igual acá y en
// index.html). Este archivo sólo arma la lista de mensajes y el
// envío, específicos de esta pantalla.
let chatIniciadoJuegos = false;
let _ultimoSnapshotChatJuegos = null;

function toggleChat(event){
    if (event) event.stopPropagation();
    const chatFlotante = document.getElementById('chat-flotante');
    const abierto = chatFlotante.classList.toggle('abierto');
    if (abierto) {
        marcarChatComoVisto();
        setTimeout(() => document.getElementById('input-chat').focus(), 300);
        if (!chatIniciadoJuegos) {
            chatIniciadoJuegos = true;
            // Últimos mensajes nada más, con "ver anteriores" (ver
            // escucharMensajesChat en js/chat-comun.js).
            window.escucharMensajesChat((mensajes, hayMas) => {
                _ultimoSnapshotChatJuegos = { mensajes, hayMas };
                renderMensajesChatJuegos(mensajes, hayMas);
                // Si llegan mensajes nuevos mientras el chat sigue abierto,
                // los marcamos como vistos ahí mismo.
                if (document.getElementById('chat-flotante').classList.contains('abierto')) marcarChatComoVisto();
            }, (err) => {
                console.error('Error de Firestore en chat:', err);
                chatIniciadoJuegos = false; // al reabrir, se vuelve a intentar
                const contenedor = document.getElementById('mensajes-chat');
                if (contenedor) contenedor.innerHTML = `<p class="sin-mensajes">⚠️ No se pudo conectar (${err.code || 'error'}).</p>`;
            });
        }
    }
}

function renderMensajesChatJuegos(mensajes, hayMas){
    // Se dibuja igual que en el inicio (js/chat-plus.js): fotos, audios,
    // respuestas, reacciones e invitaciones a jugar.
    window.renderListaChatComun(document.getElementById('mensajes-chat'), mensajes, hayMas, etiquetaFechaChatJuegos);
}

// Enganchado desde chat-comun.js cuando cambia el recibo de lectura
// del otro, para refrescar el "Visto ✓✓" sin esperar un mensaje nuevo.
window.actualizarChecksVistoChat = function(){
    if (_ultimoSnapshotChatJuegos) renderMensajesChatJuegos(_ultimoSnapshotChatJuegos.mensajes, _ultimoSnapshotChatJuegos.hayMas);
};

function etiquetaFechaChatJuegos(fecha){
    const hoy = new Date();
    const ayer = new Date(); ayer.setDate(hoy.getDate() - 1);
    const mismoDia = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
    if (mismoDia(fecha, hoy)) return 'Hoy';
    if (mismoDia(fecha, ayer)) return 'Ayer';
    const opciones = { day: 'numeric', month: 'long' };
    if (fecha.getFullYear() !== hoy.getFullYear()) opciones.year = 'numeric';
    return fecha.toLocaleDateString('es-AR', opciones);
}

async function enviarMensajeChat(){
    const input = document.getElementById('input-chat');
    const texto = input.value.trim();
    if (!texto || !miIdentidad) return;
    vibrarJ(12);
    input.value = '';
    try {
        await window.enviarChatComun({ texto });
    } catch (e) {
        console.error('Error chat:', e);
        input.value = texto;
    }
}
