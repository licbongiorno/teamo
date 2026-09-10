// ==================== PING PONG DE PREGUNTAS (motor de reflexión) ====================
// Mismo banco de 284 preguntas que ya estaba en el index (6 categorías
// originales, ahora todas juntas en un solo banco). Antes esto sólo
// mostraba una pregunta al azar para mandar por WhatsApp; ahora los
// dos pueden responderla acá mismo, revelan juntos, y además pueden
// seguir mandándola por WhatsApp si quieren.
window.CONFIG_REFLEXION = window.CONFIG_REFLEXION || {};
window.CONFIG_REFLEXION['preguntasindex'] = {
    tipo: 'texto',
    placeholder: 'Tu respuesta...',
    instrucciones: 'Una pregunta para los dos. Respondan por su lado y revelen juntos.',
    compartirWhatsApp: true,
    numerosWhatsApp: { nico: '5493516575261', carito: '5491170131229' },
    banco: [
    "¿Cuál fue el primer momento en que sentiste que esta relación era difere// ==================== REPRODUCTOR DE MÚSICA ====================
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
                    // sin reproducir todavía (autoplay real solo cuando el usuario toca play).
                    // OJO: esto es ASINCRÓNICO — el autoplay pendiente (si lo hay) se dispara
                    // más abajo, en onYtEstadoCambio cuando llegue el evento CUED real, no acá
                    // directo, porque si no a veces se pisa con la canción que estaba cargada
                    // antes de este cuePlaylist (por eso a veces arrancaba desde el segundo tema).
                    ytPlayer.cuePlaylist({ listType: 'playlist', list: ID_PLAYLIST, index: indiceAzar });
                    // Red de seguridad: si por algún motivo el evento CUED no llegara a
                    // disparar (no debería pasar, pero mejor curarse en salud), no
                    // queremos que el autoplay quede esperando para siempre.
                    setTimeout(() => {
                        if (intentoAutoplayPendiente) { intentoAutoplayPendiente = false; ytPlayer.playVideo(); }
                    }, 1500);
                } else if (intentoAutoplayPendiente) {
                    // Playlist de 1 sola canción (o no se pudo leer): no hay cue que esperar.
                    intentoAutoplayPendiente = false;
                    ytPlayer.playVideo();
                }
            } catch (e) {
                console.warn('No se pudo randomizar la canción inicial:', e);
                if (intentoAutoplayPendiente) { intentoAutoplayPendiente = false; ytPlayer.playVideo(); }
            }

            document.getElementById('btn-random').classList.add('activo');
            actualizarInfoCancion();
            configurarMediaSession();
            setInterval(actualizarBarraProgreso, 500);
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
                // Acá es donde de verdad terminó de asentarse el cuePlaylist() de
                // onYtPlayerListo. Si el usuario había tocado play mientras tanto,
                // recién ahora es seguro reproducir (evita el "arranca en el segundo tema").
                if (intentoAutoplayPendiente) {
                    intentoAutoplayPendiente = false;
                    ytPlayer.playVideo();
                }
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
nte a las demás?",
    "¿Qué recuerdo nuestro te hace sonreír instantáneamente?",
    "¿Qué conversación nuestra nunca quisieras olvidar?",
    "¿Qué detalle mío te sorprendió al principio?",
    "¿Cuál fue el día más emocionante que vivimos juntos?",
    "¿Qué recuerdo te gustaría volver a vivir exactamente igual?",
    "¿Qué momento marcó un antes y un después para nosotros?",
    "¿Qué foto nuestra cuenta mejor nuestra historia?",
    "¿Cuál fue tu primera impresión de mí y cuánto cambió?",
    "¿Qué mensaje mío recuerdas con más cariño?",
    "¿Qué momento te hizo sentir especialmente amado/a?",
    "¿Qué pequeña anécdota merece estar en un libro sobre nosotros?",
    "¿Cuál fue nuestro momento más espontáneo?",
    "¿Qué recuerdo te genera más ternura?",
    "¿Qué recuerdo te gustaría contarles algún día a nuestros nietos?",
    "¿Cuál fue nuestra etapa más divertida?",
    "¿Qué situación difícil nos hizo más fuertes?",
    "¿Qué regalo o detalle significó más para ti?",
    "¿Qué recuerdo te hace pensar 'qué suerte tuve'?",
    "¿Cuál fue nuestra primera gran aventura?",
    "¿Qué momento cotidiano terminó convirtiéndose en algo especial?",
    "¿Qué recuerdo sigue emocionándote como el primer día?",
    "¿Qué escena de nuestra historia parece sacada de una película?",
    "¿Qué recuerdo te gustaría conservar para siempre en una cápsula del tiempo?",
    "¿Cuál fue la primera vez que te sentiste realmente comprendido/a por mí?",
    "¿Qué recuerdo te hace reír más fuerte?",
    "¿Qué costumbre nació por casualidad y se volvió importante?",
    "¿Cuál fue el mejor reencuentro que hemos tenido?",
    "¿Qué recuerdo te hace sentir más orgulloso/a de nosotros?",
    "¿Qué momento te hizo pensar que éramos un gran equipo?",
    "¿Qué recuerdo te hace extrañarme más?",
    "¿Qué viaje o salida recuerdas con más cariño?",
    "¿Qué detalle mío descubriste con el tiempo?",
    "¿Qué momento te hizo enamorarte un poco más?",
    "¿Qué recuerdo tiene una canción especial asociada?",
    "¿Cuál fue nuestro momento más romántico?",
    "¿Qué recuerdo te gustaría revivir durante un día entero?",
    "¿Qué experiencia nos unió más?",
    "¿Qué recuerdo demuestra cuánto hemos crecido juntos?",
    "¿Qué rutina nuestra extrañarías más?",
    "¿Cuál es nuestro chiste interno favorito?",
    "¿Qué hago sin darme cuenta que te hace feliz?",
    "¿Cuál es nuestro ritual más especial?",
    "¿Qué costumbre compartida te da tranquilidad?",
    "¿Qué momento del día asocias más conmigo?",
    "¿Qué palabra o frase nuestra tiene un significado especial?",
    "¿Qué hábito mío te resulta adorable?",
    "¿Qué costumbre nuestra nunca deberíamos perder?",
    "¿Qué hacemos juntos que parece insignificante pero significa mucho?",
    "¿Cuál es nuestra tradición más linda?",
    "¿Qué gesto cotidiano te hace sentir amado/a?",
    "¿Qué actividad compartida nos representa mejor?",
    "¿Qué pequeña locura hacemos que nadie entendería?",
    "¿Qué es lo primero que te gustaría contarme cuando te pasa algo bueno?",
    "¿Qué es lo primero que te gustaría contarme cuando te pasa algo malo?",
    "¿Qué momento simple se volvió imprescindible?",
    "¿Cuál es nuestro idioma secreto?",
    "¿Qué costumbre nació accidentalmente?",
    "¿Qué mensaje mío reconoces sin mirar el nombre?",
    "¿Qué te hace sentir acompañado/a cuando estamos lejos?",
    "¿Qué serie o película te recuerda a nosotros?",
    "¿Qué emoji nos representa?",
    "¿Qué comida te recuerda a mí?",
    "¿Qué canción parece escrita para nosotros?",
    "¿Qué situación cotidiana nos hace reír siempre?",
    "¿Qué momento compartido parece insignificante para otros pero no para nosotros?",
    "¿Qué rutina diaria te gustaría mantener siempre?",
    "¿Qué tema nunca nos cansamos de hablar?",
    "¿Qué actividad podríamos repetir mil veces?",
    "¿Qué costumbre surgió durante la distancia?",
    "¿Qué gesto mío te hace sentir cerca?",
    "¿Qué cosa hacemos mejor como equipo?",
    "¿Qué momento de nuestras videollamadas disfrutas más?",
    "¿Qué hábito compartido deberíamos inventar?",
    "¿Qué tradición te gustaría comenzar?",
    "¿Qué conversación parece eterna pero nunca aburrida?",
    "¿Qué hacemos diferente al resto de las parejas?",
    "¿Qué detalle cotidiano te enamora todavía?",
    "¿Qué momento simple describe mejor nuestra conexión?",
    "¿Qué aprendiste sobre el amor gracias a nosotros?",
    "¿Qué valoras más de mi forma de quererte?",
    "¿Qué crees que aporto a tu vida?",
    "¿Qué versión de ti aparece cuando estás conmigo?",
    "¿Qué admiras más de mí?",
    "¿Qué te hace sentir seguro/a en esta relación?",
    "¿Cuál es la lección más importante que hemos aprendido juntos?",
    "¿Qué aspecto de tu vida mejoró gracias a nuestra relación?",
    "¿Qué te gustaría que nunca cambiara entre nosotros?",
    "¿Qué significa para ti sentirte amado/a?",
    "¿Cuándo te has sentido más comprendido/a por mí?",
    "¿Qué fortaleza tenemos como pareja?",
    "¿Qué vulnerabilidad puedes mostrar conmigo?",
    "¿Qué emoción asocias más a nuestra historia?",
    "¿Qué cualidad mía te inspira?",
    "¿Qué te hace confiar en mí?",
    "¿Qué crees que hacemos bien cuando enfrentamos problemas?",
    "¿Qué parte de tu vida sería diferente sin mí?",
    "¿Qué sueño personal te gustaría compartir más conmigo?",
    "¿Qué te gustaría que entendiera mejor de ti?",
    "¿Qué significa para ti ser compañeros de vida?",
    "¿Qué es lo que más agradeces de nosotros?",
    "¿Qué miedo hemos superado juntos?",
    "¿Qué emoción te gustaría compartir más?",
    "¿Qué significa para ti la palabra hogar?",
    "¿Cuándo sentiste más orgullo de nosotros?",
    "¿Qué momento te hizo sentir profundamente amado/a?",
    "¿Qué cualidad nuestra nos hace únicos?",
    "¿Qué valor compartimos más intensamente?",
    "¿Qué aspecto de nuestra relación te da esperanza?",
    "¿Qué has descubierto sobre ti gracias a mí?",
    "¿Qué significa para ti nuestro apoyo mutuo?",
    "¿Qué sacrificio mutuo valoras más?",
    "¿Qué desafío nos fortaleció?",
    "¿Qué emoción positiva te genera pensar en nuestro futuro?",
    "¿Qué sueño te emociona compartir conmigo?",
    "¿Qué cualidad tuya crees que floreció gracias a nuestra relación?",
    "¿Qué palabra define mejor nuestro vínculo?",
    "¿Qué te gustaría agradecerme hoy?",
    "¿Qué sentimiento resume nuestra historia?",
    "¿Cómo imaginas nuestro próximo reencuentro?",
    "¿Qué lugar sueñas visitar conmigo?",
    "¿Qué experiencia te gustaría vivir juntos al menos una vez?",
    "¿Cómo imaginas un día perfecto juntos?",
    "¿Qué sueño compartido te emociona más?",
    "¿Qué aventura deberíamos planear pronto?",
    "¿Dónde te gustaría celebrar un aniversario importante?",
    "¿Qué proyecto te gustaría construir juntos?",
    "¿Cómo imaginas nuestra vida dentro de cinco años?",
    "¿Qué hábito nos ayudaría a acercarnos a nuestros sueños?",
    "¿Qué país deberíamos conocer juntos?",
    "¿Qué experiencia romántica está pendiente?",
    "¿Qué tradición futura te gustaría crear?",
    "¿Qué meta deberíamos alcanzar como equipo?",
    "¿Qué tipo de hogar imaginas?",
    "¿Qué ciudad te gustaría explorar conmigo?",
    "¿Qué aventura espontánea deberíamos vivir?",
    "¿Qué sueño parece imposible pero vale la pena intentar?",
    "¿Qué experiencia te gustaría regalarme?",
    "¿Qué experiencia te gustaría que yo te regalara?",
    "¿Cómo imaginas nuestros fines de semana ideales?",
    "¿Qué lista de deseos deberíamos crear?",
    "¿Qué aprendizaje te gustaría vivir juntos?",
    "¿Qué proyecto creativo haríamos bien?",
    "¿Qué viaje repetiríamos varias veces?",
    "¿Qué experiencia nos haría crecer más?",
    "¿Qué sueño compartido te parece más emocionante?",
    "¿Cómo imaginas nuestro aniversario número veinte?",
    "¿Qué recuerdo futuro quieres empezar a construir ya?",
    "¿Qué aventura debería ocurrir este año?",
    "¿Qué celebración imaginaria organizarías para nosotros?",
    "¿Qué sueño personal quieres que apoyemos juntos?",
    "¿Qué lugar del mundo te recuerda a nosotros?",
    "¿Qué meta te gustaría alcanzar conmigo?",
    "¿Qué experiencia extrema te animarías a vivir juntos?",
    "¿Cómo te imaginas nuestras vacaciones perfectas?",
    "¿Qué historia quieres que contemos en el futuro?",
    "¿Qué momento futuro te emociona más esperar?",
    "¿Qué deseo compartido aún no hemos dicho en voz alta?",
    "¿Qué legado te gustaría construir juntos?",
    "¿Qué preferirías: leer mi mente o que yo lea la tuya?",
    "¿Quién sobreviviría más tiempo en una isla desierta?",
    "¿Quién gastaría primero un millón de dólares?",
    "¿Qué superpoder sería perfecto para nuestra relación?",
    "¿Quién ganaría una competencia de terquedad?",
    "¿Qué animal representa mejor nuestra pareja?",
    "¿Qué personaje ficticio se parece más a nosotros?",
    "¿Qué harías si aparezco de sorpresa en tu puerta ahora mismo?",
    "¿Qué emoji sería nuestro escudo oficial?",
    "¿Quién sería peor espía?",
    "¿Qué sería más peligroso: cocinar juntos o armar muebles juntos?",
    "¿Qué nombre tendría nuestra sitcom?",
    "¿Qué concurso de televisión podríamos ganar?",
    "¿Quién perdería primero en un juego de silencio?",
    "¿Qué ley absurda tendría nuestro país imaginario?",
    "¿Qué castigo gracioso pondrías por olvidar fechas?",
    "¿Qué habilidad inútil nos haría millonarios?",
    "¿Qué harías si un genio te concede un deseo para nosotros?",
    "¿Quién tiene más probabilidades de iniciar una aventura accidental?",
    "¿Qué haríamos si quedamos encerrados en un supermercado toda la noche?",
    "¿Qué haríamos si ganamos la lotería mañana?",
    "¿Qué objeto cotidiano representa nuestra relación?",
    "¿Qué apodo ridículamente cursi nos pondríamos?",
    "¿Qué haríamos en un apocalipsis zombie?",
    "¿Qué harías si solo pudiéramos comunicarnos con memes durante una semana?",
    "¿Qué trabajo extraño podríamos hacer juntos?",
    "¿Qué harías si descubres que soy un extraterrestre?",
    "¿Qué sería más difícil: no hablarme una semana o no usar internet una semana?",
    "¿Qué invento absurdo crearíamos?",
    "¿Quién ganaría una competencia de memes?",
    "¿Qué título tendría nuestro reality show?",
    "¿Qué harías si nos vuelven personajes de dibujos animados?",
    "¿Qué objeto salvarías primero de nuestra historia?",
    "¿Qué tres cosas llevaríamos a una isla desierta?",
    "¿Qué sería más divertido: viajar al pasado o al futuro juntos?",
    "¿Qué misión imposible aceptaríamos como equipo?",
    "¿Cuál es tu amistad íntima más reciente?",
    "¿En qué cambiaste de opinión?",
    "¿Qué te hace reír?",
    "¿Cuál fue el mejor regalo que hiciste?",
    "¿Qué otra persona te gustaría ser por un día?",
    "¿Qué harías si pudieras tomarte un año sabático?",
    "¿Cuál fue el viaje más memorable que hiciste?",
    "¿Qué canción te hace sentir bien?",
    "¿Qué sabés hoy que te hubiera gustado saber años atrás?",
    "¿Qué norma social eliminarías?",
    "¿Qué hábito te gustaría incorporar en tu vida?",
    "¿De qué te arrepentís?",
    "¿Qué harías si supieras que no vas a fracasar?",
    "¿Cuál fue la decisión más difícil que tomaste?",
    "¿Cuál fue el mejor reconocimiento que recibiste en tu vida?",
    "¿Cómo nacieron tus pasiones?",
    "¿Cuál fue el mayor ataque de risa de tu vida?",
    "¿Qué superpoder te gustaría tener?",
    "¿Qué docentes u otras personas te influyeron profundamente?",
    "¿Cuál es la locura más grande que hiciste en tu vida?",
    "¿Qué te enoja?",
    "¿Qué no te gusta de vos y estás trabajando en cambiar?",
    "¿Qué características sentís que tenés de las personas que te criaron?",
    "¿Cuál sentís que es la invención más importante de los últimos 2000 años?",
    "¿Qué es lo más importante que tenés en la lista de pendientes para tu vida?",
    "¿Qué es lo más bello que creaste en tu vida?",
    "¿Cuál fue el mayor papelón de tu vida?",
    "¿Qué sueños de tu infancia se hicieron realidad? ¿Cuáles no?",
    "¿Cuál fue la conversación más difícil que tuviste en tu vida?",
    "¿En qué sentís que opinás distinto a la gente que te rodea?",
    "¿Qué frase sentís que condensa lo más importante de la sabiduría humana?",
    "¿Qué querrías lograr el año que viene?",
    "¿Qué aprendiste porque sí, es decir, sin una necesidad concreta?",
    "¿Qué te gustaría dejar de hacer?",
    "¿Qué harías distinto hoy, si supieras que te quedan 5 años de vida?",
    "¿Qué cosas no te perdonás?",
    "¿En qué sos optimista?",
    "¿Qué pregunta ya no te hacés más?",
    "¿Qué te gustaría saber pero no querés dedicarle el tiempo y esfuerzo para aprender?",
    "¿Qué vivencias de la niñez te marcaron?",
    "¿Qué harías si no tuvieras que trabajar para ganar dinero?",
    "¿Con quién te gustaría compartir un proyecto?",
    "¿Con quiénes te sentís bien estando en silencio?",
    "¿Qué le preguntarías a un extraterrestre?",
    "¿Cuál fue el mejor regalo que recibiste?",
    "¿Cuándo fue la última vez que hiciste algo por primera vez?",
    "¿Qué olor o aroma te recuerda un momento importante de tu vida?",
    "¿Cuál fue tu primer amor?",
    "¿Sentís que tenés un propósito en la vida? ¿Cuál es?",
    "¿Tenés alguna habilidad inútil? ¿Cuál es?",
    "¿Cuál es tu hábito actual favorito?",
    "¿Qué actividad te hace perder la noción del tiempo?",
    "¿Qué debería enseñarse en las escuelas que no se está enseñando?",
    "¿Por qué aspectos de tu vida sentís gratitud?",
    "¿Qué no entienden las generaciones mayores o menores a vos?",
    "¿Qué querés hacer antes de que termine el día de hoy?",
    "¿Cuál es el mejor consejo que te han dado?",
    "¿Qué diría tu etiquetado frontal? Es decir, ¿qué deberían saber de vos las otras personas?",
    "¿Qué aspectos de tu personalidad de la infancia tenés todavía hoy?",
    "¿Qué cosas innecesarias acumulás?",
    "¿Cuándo sentís que estás usando bien tu tiempo?",
    "¿Qué te asombra? ¿Cuáles son esas cosas que ves y decís ¡guau!?",
    "¿Cuáles son los libros, series o películas que más te impactaron en la vida?",
    "¿Estás priorizando lo que considerás más importante en tu vida?",
    "¿Cuál es la anécdota que más te gusta contar?",
    "¿Qué te gustaría aprender que no sabés todavía?",
    "¿Cuál fue el riesgo más grande que tomaste en tu vida?",
    "¿En qué momentos sentís que tu vida es plena?",
    "¿Qué lograste que no creías posible?",
    "¿En qué sentís que sos una persona creativa?",
    "¿Cuál fue la situación más extrema a la que te enfrentaste?",
    "¿Cuándo fue la última vez que lloraste?",
    "¿Qué es lo más importante que aprendiste haciendo lo que hacés?",
    "¿De qué tenés miedo?",
    "¿Qué dijiste que nunca harías y terminaste haciendo?",
    "¿Con qué figura histórica te gustaría ir a cenar?",
    "¿Creés en algo que no puedas demostrar?",
    "¿Con qué estás procrastinando (postponiendo más de lo que deberías)?",
    "¿De qué aspecto de tu vida sentís orgullo?",
    "¿Qué le dirías a tu yo de dentro de 10 años?",
    "¿Qué nuevo invento necesitamos?",
    "¿Cómo sería tu trabajo ideal?",
    "¿Cuál creés que es la noticia reciente más interesante?",
    "¿Qué te quita el sueño?",
    "¿Qué concepto o idea debería conocerse más?",
    "¿Qué harías distinto hoy, si supieras que vas a vivir 200 años?",
    "¿Qué pregunta te hacés todo el tiempo?",
    "¿Tus hábitos están alineados con lo que querés lograr en tu vida?",
    "¿Cuándo fue la última vez que le alegraste el día a alguien?"
]
};
