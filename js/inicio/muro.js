// ==================== MURO EN EL TIEMPO ====================
// Migrado del index inline. abrirMuroInterno() es lo que llama el
// cargador (ver abrirMuro()/toggleMuro() en index.html).
let muroIniciado = false;

function abrirMuroInterno() {
            const modal = document.getElementById('modal-muro');
            modal.classList.remove('oculto');
            modal.style.display = 'flex';

            if (!muroIniciado) {
                muroIniciado = true;
                const q = window.query(window.collection(window.db, "muro"), window.orderBy("timestamp", "desc"));
                window.onSnapshot(q, (snapshot) => {
                    const contenedor = document.getElementById('contenedor-tarjetas-muro');
                    if (snapshot.empty) {
                        contenedor.innerHTML = '<p class="sin-notas">Este muro todavía está en blanco... dejá el primer recuerdo 🕊️</p>';
                        return;
                    }
                    contenedor.innerHTML = '';
                    snapshot.forEach((docSnap) => {
                        const nota = docSnap.data();
                        const div = document.createElement('div');
                        div.className = `tarjeta-nota ${nota.autor === "carito" ? 'nota-carito' : 'nota-nico'}`;
                        const autorEl = document.createElement('div');
                        autorEl.className = 'nota-autor';
                        autorEl.innerText = nota.autor === "carito" ? "Carito 💖" : "Nico 💙";
                        const textoEl = document.createElement('div');
                        textoEl.className = 'nota-texto';
                        textoEl.innerText = nota.texto;
                        const fechaEl = document.createElement('div');
                        fechaEl.className = 'nota-fecha';
                        fechaEl.innerText = nota.fecha || '';
                        div.appendChild(autorEl); div.appendChild(textoEl); div.appendChild(fechaEl);
                        if (nota.autor === miIdentidad) {
                            div.appendChild(crearFilaAcciones('muro', docSnap.id, textoEl, '¿Borrar este recuerdo para siempre?'));
                        }
                        contenedor.appendChild(div);
                    });
                }, (error) => {
                    console.error('Error escuchando el muro:', error);
                    const contenedor = document.getElementById('contenedor-tarjetas-muro');
                    if (contenedor) contenedor.innerHTML = `<p class="sin-notas">⚠️ No se pudo conectar (${error.code || 'error'}). Revisá las Reglas de Firestore.</p>`;
                });
            }
        }

async function guardarEnMuro() {
            const textarea = document.getElementById('texto-muro');
            const texto = textarea.value.trim();
            if (!texto || !miIdentidad) return;

            const btn = document.querySelector('.btn-publicar-muro');
            btn.innerText = "Guardando... ⏳";
            btn.disabled = true;
            vibrar(15);

            try {
                await window.addDoc(window.collection(window.db, "muro"), {
                    autor: miIdentidad,
                    texto: texto,
                    fecha: new Date().toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' }),
                    timestamp: window.serverTimestamp()
                });
                textarea.value = '';
            } catch (e) { console.error("Error muro:", e); }

            btn.innerText = "Inmortalizar mensaje ✨";
            btn.disabled = false;
        }
