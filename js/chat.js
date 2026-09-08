// ==================== CHAT FLOTANTE ====================
let chatIniciadoJuegos = false;

function toggleChat(event){
    if (event) event.stopPropagation();
    const chatFlotante = document.getElementById('chat-flotante');
    const abierto = chatFlotante.classList.toggle('abierto');
    if (abierto) {
        setTimeout(() => document.getElementById('input-chat').focus(), 300);
        if (!chatIniciadoJuegos) {
            chatIniciadoJuegos = true;
            const q = window.query(window.collection(window.db, 'chat'), window.orderBy('timestamp', 'asc'));
            window.onSnapshot(q, (snapshot) => {
                const contenedor = document.getElementById('mensajes-chat');
                if (snapshot.empty) {
                    contenedor.innerHTML = '<p class="sin-mensajes">Este espacio está esperando nuestras primeras palabras... escribí vos 💌</p>';
                    return;
                }
                contenedor.innerHTML = '';
                let ultimaEtiqueta = null;
                snapshot.forEach((docSnap) => {
                    const msg = docSnap.data();
                    const fecha = msg.timestamp && msg.timestamp.toDate ? msg.timestamp.toDate() : new Date();
                    const etiqueta = etiquetaFechaChatJuegos(fecha);
                    if (etiqueta !== ultimaEtiqueta) {
                        const sep = document.createElement('div');
                        sep.className = 'separador-fecha-chat';
                        sep.innerText = etiqueta;
                        contenedor.appendChild(sep);
                        ultimaEtiqueta = etiqueta;
                    }
                    const div = document.createElement('div');
                    div.className = `burbuja-msg ${msg.autor === 'carito' ? 'msg-carito' : 'msg-nico'} ${msg.autor === miIdentidad ? 'msg-propio' : 'msg-otro'}`;
                    div.innerText = msg.texto;
                    contenedor.appendChild(div);
                });
                contenedor.scrollTop = contenedor.scrollHeight;
            }, (err) => {
                console.error('Error de Firestore en chat:', err);
                const contenedor = document.getElementById('mensajes-chat');
                if (contenedor) contenedor.innerHTML = `<p class="sin-mensajes">⚠️ No se pudo conectar (${err.code || 'error'}).</p>`;
            });
        }
    }
}

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
        await window.addDoc(window.collection(window.db, 'chat'), {
            autor: miIdentidad, texto: texto, timestamp: window.serverTimestamp()
        });
    } catch (e) {
        console.error('Error chat:', e);
        input.value = texto;
    }
}
