// ==================== LISTA DE DESEOS JUNTOS (BUCKET LIST) ====================
// Migrado del index inline. Usa la colección "deseos" en Firestore.
let deseosIniciado = false;

// ================== LISTA DE DESEOS JUNTOS (BUCKET LIST) ==================
                let deseosCache = [];
        let pestanaDeseosActiva = 'pendientes'; // 'pendientes' o 'cumplidos'

        function abrirDeseosInterno() {
            document.getElementById('deseos-flotante').classList.add('abierto');

            if (!deseosIniciado) {
                deseosIniciado = true;
                const q = window.query(window.collection(window.db, "deseos"), window.orderBy("timestamp", "asc"));
                window.onSnapshot(q, (snapshot) => {
                    deseosCache = [];
                    snapshot.forEach((docSnap) => {
                        deseosCache.push({ id: docSnap.id, data: docSnap.data() });
                    });
                    renderizarDeseos();
                }, (error) => {
                    console.error('Error escuchando los deseos:', error);
                    const lista = document.getElementById('lista-deseos');
                    if (lista) lista.innerHTML = `<p class="sin-mensajes">⚠️ No se pudo conectar (${error.code || 'error'}).</p>`;
                });
            }
        }

        function cambiarTabDeseos(tab) {
            if (tab === pestanaDeseosActiva) return;
            vibrar(10);
            pestanaDeseosActiva = tab;
            document.getElementById('tab-deseo-pendientes').classList.toggle('activo', tab === 'pendientes');
            document.getElementById('tab-deseo-cumplidos').classList.toggle('activo', tab === 'cumplidos');
            renderizarDeseos();
        }

        function renderizarDeseos() {
            const lista = document.getElementById('lista-deseos');
            if (!lista) return;
            const mostrarCumplidos = pestanaDeseosActiva === 'cumplidos';
            const filtrados = deseosCache.filter(d => !!d.data.cumplido === mostrarCumplidos);

            if (deseosCache.length === 0) {
                lista.innerHTML = '<p class="sin-mensajes">Todavía no hay sueños anotados. El primero siempre queda grabado 🌠</p>';
                return;
            }
            if (filtrados.length === 0) {
                lista.innerHTML = mostrarCumplidos
                    ? '<p class="sin-mensajes">Ningún sueño cumplido todavía... el primero va a ser inolvidable 💫</p>'
                    : '<p class="sin-mensajes">Ni un sueño anotado todavía. ¿Cuál va a ser el nuestro? 🌠</p>';
                return;
            }
            lista.innerHTML = '';
            filtrados.forEach(({ id, data: deseo }) => {
                const fila = document.createElement('div');
                fila.className = `fila-deseo ${deseo.cumplido ? 'cumplido' : ''}`;
                fila.onclick = (ev) => marcarDeseo(id, !!deseo.cumplido, ev);
                const check = document.createElement('span');
                check.className = 'check-deseo';
                check.innerText = deseo.cumplido ? '💗' : '🤍';
                const texto = document.createElement('span');
                texto.className = 'texto-deseo';
                texto.innerText = deseo.texto;
                fila.appendChild(check); fila.appendChild(texto);
                if (deseo.autor === miIdentidad) {
                    fila.appendChild(crearFilaAcciones('deseos', id, texto, '¿Borrar este sueño para siempre?'));
                }
                lista.appendChild(fila);
            });
        }

        function verificarEnterDeseo(e) { if (e.key === "Enter") agregarDeseo(); }

        async function agregarDeseo() {
            const input = document.getElementById('input-deseo');
            const texto = input.value.trim();
            if (!texto || !miIdentidad) return;
            vibrar(15);
            input.value = '';
            try {
                await window.addDoc(window.collection(window.db, "deseos"), {
                    autor: miIdentidad,
                    texto: texto,
                    cumplido: false,
                    timestamp: window.serverTimestamp()
                });
            } catch (e) { console.error("Error deseo:", e); }
        }

        async function marcarDeseo(id, estabaCumplido, event) {
            const seEstaCumpliendoAhora = !estabaCumplido;
            if (seEstaCumpliendoAhora) {
                // Momento de logro compartido: vibración distinta y un estallido de corazones,
                // como para que se sienta como un pequeño festejo, no un simple check.
                vibrar([20, 40, 20, 40, 80]);
                if (event && typeof lanzarCorazonSutil === 'function') {
                    const rect = (event.currentTarget || event.target).getBoundingClientRect();
                    lanzarCorazonSutil(rect.left + rect.width / 2, rect.top + rect.height / 2);
                }
            } else {
                vibrar(12);
            }
            try {
                await window.updateDoc(window.doc(window.db, "deseos", id), { cumplido: seEstaCumpliendoAhora });
            } catch (e) { console.error("Error marcando deseo:", e); }
        }

        