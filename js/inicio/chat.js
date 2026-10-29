// ==================== CHAT ====================
// Migrado del index inline. abrirChatInterno() es lo que llama el
// cargador (ver toggleChat() en index.html). El indicador de "mensaje
// no leído", el recibo de lectura compartido y el zumbido siguen
// siendo eager (viven en js/chat-comun.js) — tienen que funcionar
// aunque nunca se abra el chat en esta sesión.
let chatIniciado = false;
let _ultimoSnapshotChatIndex = null;

function abrirChatInterno() {
            document.getElementById('chat-flotante').classList.add('abierto');
            marcarChatComoVisto();
            setTimeout(() => document.getElementById('input-chat').focus(), 300);

            if (!chatIniciado) {
                chatIniciado = true;
                // Últimos mensajes nada más, con "ver anteriores" (ver
                // escucharMensajesChat en js/chat-comun.js).
                window.escucharMensajesChat((mensajes, hayMas) => {
                    _ultimoSnapshotChatIndex = { mensajes, hayMas };
                    renderMensajesChatIndex(mensajes, hayMas);
                    if (document.getElementById('chat-flotante').classList.contains('abierto')) marcarChatComoVisto();
                }, (error) => {
                    console.error('Error escuchando el chat:', error);
                    chatIniciado = false; // al reabrir, se vuelve a intentar
                    const contenedor = document.getElementById('mensajes-chat');
                    if (contenedor) contenedor.innerHTML = `<p class="sin-mensajes">⚠️ No se pudo conectar (${error.code || 'error'}). Revisá las Reglas de Firestore.</p>`;
                });
            }
        }

function renderMensajesChatIndex(mensajes, hayMas) {
    // Se dibuja igual que en juegos (js/chat-plus.js): fotos, audios,
    // respuestas, reacciones e invitaciones a jugar.
    window.renderListaChatComun(document.getElementById('mensajes-chat'), mensajes, hayMas, etiquetaFechaChat);
}

// Enganchado desde chat-comun.js cuando cambia el recibo de lectura
// del otro, para refrescar el "Visto ✓✓" sin esperar un mensaje nuevo.
window.actualizarChecksVistoChat = function(){
    if (_ultimoSnapshotChatIndex) renderMensajesChatIndex(_ultimoSnapshotChatIndex.mensajes, _ultimoSnapshotChatIndex.hayMas);
};

async function enviarMensajeChat() {
            const input = document.getElementById('input-chat');
            const texto = input.value.trim();
            if (!texto || !miIdentidad) return;
            vibrar(12);
            input.value = '';

            try {
                await window.enviarChatComun({ texto });
            } catch (e) {
                console.error("Error chat:", e);
                input.value = texto; // devolvemos el texto para que no se pierda
                const contenedor = document.getElementById('mensajes-chat');
                if (contenedor) {
                    const aviso = document.createElement('p');
                    aviso.className = 'sin-mensajes';
                    aviso.innerText = `⚠️ No se pudo enviar (${e.code || 'error'}). Revisá las Reglas de Firestore.`;
                    contenedor.appendChild(aviso);
                    contenedor.scrollTop = contenedor.scrollHeight;
                }
            }
        }

function verificarEnterChat(e) { if (e.key === "Enter") enviarMensajeChat(); }

function etiquetaFechaChat(fecha) {
            const hoy = new Date();
            const ayer = new Date();
            ayer.setDate(hoy.getDate() - 1);
            const mismoDia = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
            if (mismoDia(fecha, hoy)) return 'Hoy';
            if (mismoDia(fecha, ayer)) return 'Ayer';
            const opciones = { day: 'numeric', month: 'long' };
            if (fecha.getFullYear() !== hoy.getFullYear()) opciones.year = 'numeric';
            return fecha.toLocaleDateString('es-AR', opciones);
        }
