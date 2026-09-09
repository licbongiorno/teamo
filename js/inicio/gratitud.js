// ==================== RINCÓN DE LA GRATITUD ====================
// Migrado del index inline. Usa la colección "gratitud" en Firestore,
// igual que antes. abrirGratitudInterno() es lo que llama el cargador
// genérico (ver js/inicio-cargador.js) la primera vez que se abre.
let gratitudIniciado = false;

// ================== RINCÓN DE LA GRATITUD ==================
                function abrirGratitudInterno() {
            document.getElementById('gratitud-flotante').classList.add('abierto');
            setTimeout(() => document.getElementById('input-gratitud').focus(), 300);

            if (!gratitudIniciado) {
                gratitudIniciado = true;
                const q = window.query(window.collection(window.db, "gratitud"), window.orderBy("timestamp", "desc"));
                window.onSnapshot(q, (snapshot) => {
                    const lista = document.getElementById('lista-gratitud');
                    if (snapshot.empty) {
                        lista.innerHTML = '<p class="sin-mensajes">Este rincón espera el primer "te amo por"... empezá vos 💛</p>';
                        return;
                    }
                    lista.innerHTML = '';
                    snapshot.forEach((docSnap) => {
                        const nota = docSnap.data();
                        const div = document.createElement('div');
                        div.className = 'tarjeta-gratitud';
                        const autorEl = document.createElement('div');
                        autorEl.className = 'gr-autor';
                        autorEl.innerText = nota.autor === "carito" ? "Carito 💖" : "Nico 💙";
                        const textoEl = document.createElement('div');
                        textoEl.className = 'gr-texto';
                        textoEl.innerText = nota.texto;
                        const fechaEl = document.createElement('div');
                        fechaEl.className = 'gr-fecha';
                        fechaEl.innerText = nota.fecha || '';
                        div.appendChild(autorEl); div.appendChild(textoEl); div.appendChild(fechaEl);
                        if (nota.autor === miIdentidad) {
                            div.appendChild(crearFilaAcciones('gratitud', docSnap.id, textoEl, '¿Borrar este "te amo por" para siempre?'));
                        }
                        lista.appendChild(div);
                    });
                }, (error) => {
                    console.error('Error escuchando la gratitud:', error);
                    const lista = document.getElementById('lista-gratitud');
                    if (lista) lista.innerHTML = `<p class="sin-mensajes">⚠️ No se pudo conectar (${error.code || 'error'}).</p>`;
                });
            }
        }

        function verificarEnterGratitud(e) { if (e.key === "Enter") guardarGratitud(); }

        async function guardarGratitud() {
            const input = document.getElementById('input-gratitud');
            const texto = input.value.trim();
            if (!texto || !miIdentidad) return;
            vibrar(15);
            input.value = '';
            try {
                await window.addDoc(window.collection(window.db, "gratitud"), {
                    autor: miIdentidad,
                    texto: texto,
                    fecha: new Date().toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' }),
                    timestamp: window.serverTimestamp()
                });
            } catch (e) { console.error("Error gratitud:", e); }
        }

        