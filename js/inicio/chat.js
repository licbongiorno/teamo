// ==================== CHAT ====================
// Migrado del index inline. abrirChatInterno() es lo que llama el
// cargador (ver toggleChat() en index.html). El indicador de "mensaje
// no leído" (iniciarEscuchaChatNoLeidos, etc.) sigue siendo eager en
// el script principal — tiene que funcionar aunque nunca se abra el
// chat en esta sesión.
let chatIniciado = false;

function abrirChatInterno() {
            document.getElementById('chat-flotante').classList.add('abierto');
            marcarChatComoVisto();
            setTimeout(() => document.getElementById('input-chat').focus(), 300);

            if (!chatIniciado) {
                chatIniciado = true;
                const q = window.query(window.collection(window.db, "chat"), window.orderBy("timestamp", "asc"));
                window.onSnapshot(q, (snapshot) => {
                    const contenedor = document.getElementById('mensajes-chat');
                    if (snapshot.empty) {
                        contenedor.innerHTML = '<p class="sin-mensajes">Este espacio está esperando nuestras primeras palabras... escribí vos 💌</p>';
                        return;
                    }
                    contenedor.innerHTML = '';
                    let ultimaEtiquetaFecha = null;
                    snapshot.forEach((doc) => {
                        const msg = doc.data();
                        const fechaMsg = msg.timestamp && msg.timestamp.toDate ? msg.timestamp.toDate() : new Date();
                        const etiqueta = etiquetaFechaChat(fechaMsg);
                        if (etiqueta !== ultimaEtiquetaFecha) {
                            const separador = document.createElement('div');
                            separador.className = 'separador-fecha-chat';
                            separador.innerText = etiqueta;
                            contenedor.appendChild(separador);
                            ultimaEtiquetaFecha = etiqueta;
                        }
                        const div = document.createElement('div');
                        div.className = `burbuja-msg ${msg.autor === "carito" ? 'msg-carito' : 'msg-nico'} ${msg.autor === miIdentidad ? 'msg-propio' : 'msg-otro'}`;
                        div.innerText = msg.texto;
                        contenedor.appendChild(div);
                    });
                    contenedor.scrollTop = contenedor.scrollHeight; // Auto-scroll
                }, (error) => {
                    console.error('Error escuchando el chat:', error);
                    const contenedor = document.getElementById('mensajes-chat');
                    if (contenedor) contenedor.innerHTML = `<p class="sin-mensajes">⚠️ No se pudo conectar (${error.code || 'error'}). Revisá las Reglas de Firestore.</p>`;
                });
            }
        }

async function enviarMensajeChat() {
            const input = document.getElementById('input-chat');
            const texto = input.value.trim();
            if (!texto || !miIdentidad) return;
            vibrar(12);
            input.value = '';

            try {
                await window.addDoc(window.collection(window.db, "chat"), {
                    autor: miIdentidad, texto: texto, timestamp: window.serverTimestamp()
                });
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
