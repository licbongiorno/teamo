// ==================== CAMINO DE SANACIÓN ====================
// Migrado del index inline. abrirSanacionInterno() es lo que llama el
// cargador (ver cargarSanacionSiHaceFalta() en index.html).

// ================== CAMINO DE SANACIÓN ==================
        class SanacionTracker {
            constructor() {
                this.CACHE_KEY = 'sanacionFechasCache';
                this.FECHAS_BASE = [
                    '2026-08-05', '2026-08-26', '2026-09-16',
                    '2026-10-07', '2026-10-28', '2026-11-18',
                ];
                this.DIAS_CICLO = 21;
                this.fechas = this.cargarCache();
            }

            cargarCache() {
                try {
                    const guardadas = localStorage.getItem(this.CACHE_KEY);
                    const parsed = guardadas ? JSON.parse(guardadas) : null;
                    if (Array.isArray(parsed) && parsed.length === 6) return parsed;
                } catch (e) { console.warn('No se pudo leer la caché de sanación:', e); }
                return [...this.FECHAS_BASE];
            }

            guardarCache() { localStorage.setItem(this.CACHE_KEY, JSON.stringify(this.fechas)); }

            // Cambia la fecha de la sesión N y recalcula en cascada las siguientes, sumando 21 días
            actualizarFecha(indice, nuevaFechaStr) {
                if (indice < 0 || indice > 5 || !nuevaFechaStr) return;
                this.fechas[indice] = nuevaFechaStr;
                let base = this._parsear(nuevaFechaStr);
                for (let i = indice + 1; i < 6; i++) {
                    base = this._sumarDias(base, this.DIAS_CICLO);
                    this.fechas[i] = this._formatearISO(base);
                }
                this.guardarCache();
            }

            _parsear(str) { const [y, m, d] = str.split('-').map(Number); return new Date(y, m - 1, d); }
            _sumarDias(f, d) { const n = new Date(f); n.setDate(n.getDate() + d); return n; }
            _formatearISO(f) {
                const y = f.getFullYear(), m = String(f.getMonth() + 1).padStart(2, '0'), d = String(f.getDate()).padStart(2, '0');
                return `${y}-${m}-${d}`;
            }

            obtenerFechasComoDate() { return this.fechas.map(f => this._parsear(f)); }

            obtenerNumeroSesionActual() {
                const ahora = new Date();
                let sesion = 1;
                this.obtenerFechasComoDate().forEach((f, i) => { if (ahora >= f) sesion = i + 1; });
                return Math.min(sesion, 6);
            }

            obtenerProximaSesionIndice() {
                const ahora = new Date();
                const fechas = this.obtenerFechasComoDate();
                for (let i = 0; i < fechas.length; i++) if (fechas[i] > ahora) return i;
                return -1;
            }

            tratamientoCompleto() { return new Date() >= this.obtenerFechasComoDate()[5]; }

            obtenerTiempoRestanteHasta(fechaDate) {
                let diff = fechaDate - new Date();
                if (diff < 0) diff = 0;
                return {
                    dias: Math.floor(diff / 86400000),
                    horas: Math.floor((diff / 3600000) % 24),
                };
            }
        }

        const sanacionTracker = new SanacionTracker();
        let sanacionFirestoreIniciada = false;

        const MENSAJES_ABRAZO = "Hoy nos abrazamos más fuerte que nunca. Estoy con vos en cada gota 💖";
        const MENSAJES_DESCANSO = "Hoy toca ir despacito: descansar, tomar mucha agua y mimarte un poco más. Yo te cuido desde acá 🤍";
        const MENSAJE_VICTORIA_CORTO = "¡Lo lograste! Hoy brillás con toda tu luz, mi amor 💫";

        function obtenerFechaHoyISOSanacion() {
            const d = new Date();
            const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), day = String(d.getDate()).padStart(2, '0');
            return `${y}-${m}-${day}`;
        }

        // Decide qué mensaje mostrar hoy: día de sesión, días de descanso posteriores, o
        // día intermedio celebrando la vitalidad y lo cerca que está la próxima parada.
        function obtenerContextoSanacion() {
            const hoyISO = obtenerFechaHoyISOSanacion();

            if (sanacionTracker.fechas.includes(hoyISO)) {
                return { tipo: 'abrazo', mensaje: MENSAJES_ABRAZO };
            }
            if (sanacionTracker.tratamientoCompleto()) {
                return { tipo: 'victoria', mensaje: MENSAJE_VICTORIA_CORTO };
            }

            const hoyDate = sanacionTracker._parsear(hoyISO);
            for (const f of sanacionTracker.fechas) {
                const fechaSesion = sanacionTracker._parsear(f);
                const diffDias = Math.round((hoyDate - fechaSesion) / 86400000);
                if (diffDias >= 1 && diffDias <= 2) {
                    return { tipo: 'descanso', mensaje: MENSAJES_DESCANSO };
                }
            }

            const idxProxima = sanacionTracker.obtenerProximaSesionIndice();
            const restante = idxProxima !== -1
                ? sanacionTracker.obtenerTiempoRestanteHasta(sanacionTracker.obtenerFechasComoDate()[idxProxima])
                : null;
            const diasFaltan = restante ? restante.dias : 0;
            const plural = diasFaltan === 1 ? '' : 's';
            return {
                tipo: 'vitalidad',
                mensaje: `Un día más lleno de luz. Estás a ${diasFaltan} día${plural} de tu próxima parada, cada vez más cerca de la meta ✨`
            };
        }

        function formatearFechaLarga(fechaDate) {
            const opciones = { day: 'numeric', month: 'long', year: 'numeric' };
            return fechaDate.toLocaleDateString('es-AR', opciones);
        }

        function renderizarSanacion() {
            const vistaNormal = document.getElementById('sanacion-vista-normal');
            const vistaVictoria = document.getElementById('sanacion-vista-victoria');
            if (!vistaNormal || !vistaVictoria) return;

            if (sanacionTracker.tratamientoCompleto()) {
                vistaNormal.style.display = 'none';
                vistaVictoria.style.display = 'flex';
                return;
            }
            vistaNormal.style.display = 'block';
            vistaVictoria.style.display = 'none';

            const sesionActual = sanacionTracker.obtenerNumeroSesionActual();
            document.getElementById('sanacion-etapa-texto').innerText = `Sesión ${sesionActual} de 6`;
            document.getElementById('svg-corazon-cristal').setAttribute('data-etapa', String(sesionActual));

            // El corazón de cristal se va llenando de luz: nivel 0 a 1 según la sesión actual
            const relleno = document.getElementById('relleno-luz-sanacion');
            relleno.style.setProperty('--nivel-luz', (sesionActual / 6).toFixed(3));

            // Colores: de frío/lila (sesión 1) a cálido/dorado (sesión 6)
            const paletaPorEtapa = {
                1: ['#9483e0', '#c7b3fa'], 2: ['#a894e6', '#d4c2fb'], 3: ['#d19fc9', '#ffc2d9'],
                4: ['#e0ab8c', '#ffd9ad'], 5: ['#ecc08a', '#f5d9a0'], 6: ['#f0d0a0', '#fdf6f0'],
            };
            const colores = paletaPorEtapa[sesionActual] || paletaPorEtapa[1];
            const contenedor = document.querySelector('.corazon-cristal-contenedor');
            contenedor.style.setProperty('--sanacion-luz-abajo', colores[0]);
            contenedor.style.setProperty('--sanacion-luz-arriba', colores[1]);

            // Mensaje contextual del día
            const contexto = obtenerContextoSanacion();
            document.getElementById('sanacion-mensaje-texto').innerText = contexto.mensaje;

            // Próxima parada
            const idxProxima = sanacionTracker.obtenerProximaSesionIndice();
            if (idxProxima !== -1) {
                const fechaProxima = sanacionTracker.obtenerFechasComoDate()[idxProxima];
                document.getElementById('sanacion-proxima-fecha').innerText = formatearFechaLarga(fechaProxima);
                const restante = sanacionTracker.obtenerTiempoRestanteHasta(fechaProxima);
                document.getElementById('sanacion-proxima-cuenta').innerText =
                    restante.dias === 0 ? 'Es hoy 💖' : `Faltan ${restante.dias} día${restante.dias === 1 ? '' : 's'}`;
            }

            // Línea de meta
            const fechaMeta = sanacionTracker.obtenerFechasComoDate()[5];
            document.getElementById('sanacion-meta-fecha').innerText = formatearFechaLarga(fechaMeta);
            const restanteMeta = sanacionTracker.obtenerTiempoRestanteHasta(fechaMeta);
            document.getElementById('sanacion-meta-cuenta').innerText =
                restanteMeta.dias === 0 ? 'Es hoy 🌟' : `Faltan ${restanteMeta.dias} día${restanteMeta.dias === 1 ? '' : 's'}`;
        }

                function abrirSanacionInterno() {
            vibrar(15);
            const modal = document.getElementById('modal-sanacion');
            modal.classList.remove('oculto');
            elegirFraseMotivadoraSanacion();
            renderizarSanacion();

            if (!sanacionFirestoreIniciada) {
                sanacionFirestoreIniciada = true;
                suscribirSanacionFirestore();
            }
        }

        function cerrarSanacion() {
            document.getElementById('modal-sanacion').classList.add('oculto');
            document.getElementById('sanacion-edicion-fecha').classList.add('oculto');
        }

        function toggleEdicionFecha() {
            vibrar(10);
            const idx = sanacionTracker.obtenerProximaSesionIndice();
            if (idx === -1) return; // ya no hay próxima sesión que editar
            const input = document.getElementById('input-proxima-fecha');
            input.value = sanacionTracker.fechas[idx];
            document.getElementById('sanacion-edicion-fecha').classList.toggle('oculto');
        }

        function guardarProximaFecha() {
            const idx = sanacionTracker.obtenerProximaSesionIndice();
            const input = document.getElementById('input-proxima-fecha');
            if (idx === -1 || !input.value) return;

            sanacionTracker.actualizarFecha(idx, input.value);
            vibrar([15, 30, 15]);
            document.getElementById('sanacion-edicion-fecha').classList.add('oculto');
            renderizarSanacion();
            guardarSanacionEnFirestore();
        }

        // Firestore: colección "sanacion", un solo documento "tratamiento" que sincroniza
        // las fechas entre los dos celulares en tiempo real (con caché local para offline).
        async function guardarSanacionEnFirestore() {
            if (!window.db || typeof window.setDoc !== 'function') return;
            try {
                await window.setDoc(window.doc(window.db, "sanacion", "tratamiento"), {
                    fechas: sanacionTracker.fechas,
                    actualizadoPor: (typeof miIdentidad !== 'undefined' && miIdentidad) ? miIdentidad : 'desconocido',
                    actualizadoEn: window.serverTimestamp()
                }, { merge: true });
            } catch (e) { console.warn('No se pudo sincronizar la sanación con Firestore:', e); }
        }

        function suscribirSanacionFirestore() {
            if (!window.db || typeof window.onSnapshot !== 'function' || typeof window.doc !== 'function') return;
            try {
                window.onSnapshot(window.doc(window.db, "sanacion", "tratamiento"), (snap) => {
                    if (snap.exists()) {
                        const data = snap.data();
                        if (Array.isArray(data.fechas) && data.fechas.length === 6) {
                            sanacionTracker.fechas = data.fechas;
                            sanacionTracker.guardarCache();
                            renderizarSanacion();
                        }
                    }
                });
            } catch (e) { console.warn('No se pudo suscribir la sanación a Firestore:', e); }
        }

        // Frases motivadoras: una distinta cada vez que se abre el panel, para acompañar
        // sin agobiar con fechas ni trámites — solo aliento para seguir.
        const FRASES_MOTIVADORAS_SANACION = [
            "La fuerza está en seguir.",
            "Un paso hoy, un paso mañana: así se llega.",
            "Cada día que pasa es un día menos y un día más fuerte.",
            "No hace falta ser invencible, alcanza con no rendirse.",
            "Vas más lejos de lo que creés.",
            "Respirá. Estás avanzando, aunque hoy no lo sientas.",
            "Lo estás haciendo mejor de lo que pensás.",
            "Hoy también sos valiente, aunque no lo parezca.",
            "El cuerpo se cansa, el amor no.",
            "Falta menos que ayer.",
            "Esto también va a pasar, y vas a estar del otro lado.",
            "Tu fuerza inspira más de lo que imaginás.",
            "Un día a la vez. Ese es todo el secreto.",
            "No estás sola en ningún paso de esto.",
            "Cada sesión es una prueba más de lo fuerte que sos.",
        ];

        function elegirFraseMotivadoraSanacion() {
            const idx = Math.floor(Math.random() * FRASES_MOTIVADORAS_SANACION.length);
            const el = document.getElementById('sanacion-frase-motivadora');
            if (el) el.innerText = FRASES_MOTIVADORAS_SANACION[idx];
        }

        