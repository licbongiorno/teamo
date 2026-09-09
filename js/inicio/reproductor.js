// ==================== REPRODUCTOR DE MÚSICA ====================
// Migrado del index inline. Antes, el script de la API de YouTube se
// cargaba SIEMPRE al abrir la página (aunque nunca se tocara música).
// Ahora sólo se pide la primera vez que se abre la burbuja del
// reproductor — ver iniciarReproductorInterno() al final y
// toggleReproductor() en index.html, que la llama bajo demanda.

// REPRODUCTOR MUSICA — playlist de YouTube Music embebida con el IFrame Player API.
        // Vive dentro de la misma página (iframe invisible), nunca abre la app ni una pestaña nueva.
        //
        // ⚠️ IMPORTANTE: el ID de playlist que llegó ("PLU9aN4KQMAs4") es más corto de lo normal
        // (los IDs de playlist de YouTube suelen tener 34 caracteres). Puede haberse cortado al
        // copiar el link. Si la música no carga, entrá a la playlist desde YouTube Music en escritorio,
        // copiá el link completo y reemplazá el valor de ID_PLAYLIST de acá abajo.
        // Además, para que suene también en el celu/PC de Carito, la playlist tiene que estar
        // configurada como "Pública" o "No incluida en listados" (no "Privada").
        const ID_PLAYLIST = "PLU9aN4KQMAs4";

        let ytPlayer = null;
        let ytListo = false;
        let esRandom = true; // Arranca en aleatorio, igual que antes
        let esRepetir = false;
        let intentoAutoplayPendiente = false;

        // Carga async del script oficial de YouTube IFrame API
        function cargarYouTubeAPI() {
            const tag = document.createElement('script');
            tag.src = "https://www.youtube.com/iframe_api";
            document.head.appendChild(tag);
        }

        function formatearTiempo(segundos) {
            if (isNaN(segundos) || segundos === Infinity || segundos == null) return "0:00";
            const min = Math.floor(segundos / 60);
            const seg = Math.floor(segundos % 60).toString().padStart(2, '0');
            return `${min}:${seg}`;
        }

        const barraProgreso = document.getElementById('barra-progreso');
        const tiempoActualEl = document.getElementById('tiempo-actual');
        const tiempoTotalEl = document.getElementById('tiempo-total');
        let arrastrandoBarra = false;

        function actualizarInfoCancion() {
            if (!ytPlayer || typeof ytPlayer.getVideoData !== 'function') return;
            const datos = ytPlayer.getVideoData();
            let titulo = (datos.title || 'Cargando...').trim();
            if (titulo.length > 25) titulo = titulo.substring(0, 22) + "...";
            document.getElementById('info-cancion').innerText = "🎵 " + titulo;

            // Actualiza también la notificación / pantalla de bloqueo (Media Session API)
            if ('mediaSession' in navigator && datos.title) {
                navigator.mediaSession.metadata = new MediaMetadata({
                    title: datos.title,
                    artist: datos.author || 'Nuestra playlist',
                    album: 'Nuestro Universo 💕',
                    artwork: [{ src: 'https://i.ytimg.com/vi/' + datos.video_id + '/hqdefault.jpg', sizes: '480x360', type: 'image/jpeg' }]
                });
            }
        }

        // Registra los controles de reproducción del sistema operativo (notificación,
        // pantalla de bloqueo, auriculares bluetooth) para que la música se banque mejor
        // los cambios de app / bloqueos de pantalla en el celular.
        function configurarMediaSession() {
            if (!('mediaSession' in navigator)) return;
            try {
                navigator.mediaSession.setActionHandler('play', () => { ytPlayer.playVideo(); });
                navigator.mediaSession.setActionHandler('pause', () => { ytPlayer.pauseVideo(); });
                navigator.mediaSession.setActionHandler('previoustrack', () => { cambiarCancion(-1); });
                navigator.mediaSession.setActionHandler('nexttrack', () => { cambiarCancion(1); });
            } catch (e) { console.warn('Media Session no soportada del todo:', e); }
        }

        // Llamado automáticamente por el script de YouTube apenas está listo
        window.onYouTubeIframeAPIReady = function () {
            ytPlayer = new YT.Player('yt-audio-player', {
                height: '1',
                width: '1',
                playerVars: {
                    listType: 'playlist',
                    list: ID_PLAYLIST,
                    autoplay: 0,
                    controls: 0,
                    disablekb: 1,
                    playsinline: 1,
                    modestbranding: 1,
                    rel: 0,
                    origin: window.location.origin
                },
                events: {
                    onReady: onYtPlayerListo,
                    onStateChange: onYtEstadoCambio,
                    onError: onYtError
                }
            });
        };

        function onYtPlayerListo() {
            ytListo = true;
            ytPlayer.setVolume(80);
            ytPlayer.setShuffle(esRandom); // el orden de next/previous queda aleatorio

            // Elegimos al azar con qué canción arrancar (si no, siempre carga la primera de la lista)
            try {
                const lista = ytPlayer.getPlaylist();
                if (lista && lista.length > 1) {
                    const indiceAzar = Math.floor(Math.random() * lista.length);
                    // cuePlaylist con "index" recarga la playlist arrancando en esa posición,
                    // sin reproducir todavía (autoplay real solo cuando el usuario toca play)
                    ytPlayer.cuePlaylist({ listType: 'playlist', list: ID_PLAYLIST, index: indiceAzar });
                }
            } catch (e) { console.warn('No se pudo randomizar la canción inicial:', e); }

            document.getElementById('btn-random').classList.add('activo');
            actualizarInfoCancion();
            configurarMediaSession();
            setInterval(actualizarBarraProgreso, 500);
            // Si el usuario ya había tocado play mientras la API cargaba, reproducimos ahora
            if (intentoAutoplayPendiente) {
                intentoAutoplayPendiente = false;
                ytPlayer.playVideo();
            }
        }

        function actualizarBarraProgreso() {
            if (!ytListo || arrastrandoBarra) return;
            const duracion = ytPlayer.getDuration();
            const actual = ytPlayer.getCurrentTime();
            if (duracion > 0) {
                barraProgreso.max = duracion;
                barraProgreso.value = actual;
                tiempoTotalEl.innerText = formatearTiempo(duracion);
                tiempoActualEl.innerText = formatearTiempo(actual);
            }
        }

        function onYtEstadoCambio(event) {
            const btn = document.getElementById('btn-play-pause');
            const burbuja = document.getElementById('burbuja-reproductor');
            if (event.data === YT.PlayerState.PLAYING) {
                btn.innerText = "⏸";
                burbuja.classList.add('sonando');
                actualizarInfoCancion();
                if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing';
            } else if (event.data === YT.PlayerState.PAUSED) {
                btn.innerText = "▶";
                burbuja.classList.remove('sonando');
                if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused';
            } else if (event.data === YT.PlayerState.ENDED) {
                if (esRepetir) {
                    ytPlayer.seekTo(0);
                    ytPlayer.playVideo();
                } else {
                    burbuja.classList.remove('sonando');
                }
            } else if (event.data === YT.PlayerState.CUED) {
                actualizarInfoCancion();
            }
        }

        function onYtError() {
            // Si un video de la playlist no está disponible, saltamos al siguiente
            console.warn('No se pudo cargar una canción de la playlist, saltando a la siguiente.');
            setTimeout(() => { if (ytListo) ytPlayer.nextVideo(); }, 150);
        }

        function togglePlayPause() {
            vibrar(12);
            if (!ytListo) {
                // La API de YouTube puede tardar unos instantes en cargar la primera vez
                intentoAutoplayPendiente = true;
                document.getElementById('info-cancion').innerText = "🎵 Cargando...";
                return;
            }
            const estado = ytPlayer.getPlayerState();
            if (estado === YT.PlayerState.PLAYING) {
                ytPlayer.pauseVideo();
            } else {
                ytPlayer.playVideo();
            }
        }

        function toggleRandom() {
            // La música siempre es aleatoria: este botón ya no la desactiva.
            vibrar(10);
        }

        function toggleRepeat() {
            esRepetir = !esRepetir;
            const btn = document.getElementById('btn-repeat');
            if (esRepetir) btn.classList.add('activo');
            else btn.classList.remove('activo');
        }

        function cambiarCancion(direccion) {
            if (!ytListo) return;
            if (direccion > 0) ytPlayer.nextVideo();
            else ytPlayer.previousVideo();
        }

        function cambiarVolumen(vol) {
            if (ytListo) ytPlayer.setVolume(Math.round(vol * 100));
        }

        barraProgreso.addEventListener('input', () => {
            arrastrandoBarra = true;
            tiempoActualEl.innerText = formatearTiempo(barraProgreso.value);
        });

        barraProgreso.addEventListener('change', () => {
            if (ytListo) ytPlayer.seekTo(Number(barraProgreso.value), true);
            arrastrandoBarra = false;
        });

        // BURBUJA DEL REPRODUCTOR: se abre/cierra sin invadir nunca el resto de la pantalla


function iniciarReproductorInterno(){
    cargarYouTubeAPI();
}
