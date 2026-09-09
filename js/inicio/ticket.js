// ==================== TICKETS DIARIOS DE PAREJA (365 vales) ====================
// Migrado del index inline. abrirTicketInterno() es lo que llama el
// cargador (ver cargarTicketSiHaceFalta() en index.html) la primera
// vez que se abre. cerrarTicket() también vive acá porque sólo se
// puede invocar una vez que el modal ya está abierto (o sea, una vez
// que este archivo ya cargó).

// ================== TICKETS DIARIOS DE PAREJA (365 vales) ==================
        const ticketsDiarios = [
            { id: 1, nivel: 'bronce', texto: "Vale por un \"Mate Virtual\": hoy te toca llamarme a la tarde para tomar unos mates a la distancia." },
            { id: 2, nivel: 'bronce', texto: "Vale por pedirte un audio largo donde me cuentes algo de tu vida o tu infancia que yo todavía no conozca." },
            { id: 3, nivel: 'bronce', texto: "Vale por una foto o video tuyo en tiempo real mostrando exactamente qué estás haciendo ahora." },
            { id: 4, nivel: 'bronce', texto: "Vale por pedirte que elijas la canción que tengo que escuchar sí o sí hoy." },
            { id: 5, nivel: 'bronce', texto: "Vale por un video tuyo mandándome un beso en cámara lenta." },
            { id: 6, nivel: 'bronce', texto: "Vale por pedirte un mensaje de audio con tu voz suave para escuchar justo antes de dormirme." },
            { id: 7, nivel: 'bronce', texto: "Vale por exigirte un elogio sincero sobre algo que admirás de mi personalidad." },
            { id: 8, nivel: 'bronce', texto: "Vale por pedirte que me mandes un delivery sorpresa con mi café o comida favorita a mi casa." },
            { id: 9, nivel: 'bronce', texto: "Vale por una videollamada de 2 minutos donde solo te pido que me mires a los ojos y me sonrías." },
            { id: 10, nivel: 'bronce', texto: "Vale por pedirte que me busques y me mandes el meme o video más divertido que encuentres hoy." },
            { id: 11, nivel: 'bronce', texto: "Vale por aplicarte a vos un \"vale de silencio\": hoy tenés permiso de no contestarme si estás con mucho trabajo o cansada/o." },
            { id: 12, nivel: 'bronce', texto: "Vale por pedirte una lista redactada por vos con 3 cosas que te gustaron de mí hoy." },
            { id: 13, nivel: 'bronce', texto: "Vale por pedirte que elijas una película para que pongamos los dos al mismo tiempo esta noche." },
            { id: 14, nivel: 'bronce', texto: "Vale por un mensaje tuyo apenas te despiertes contándome con detalle qué soñaste." },
            { id: 15, nivel: 'bronce', texto: "Vale por pedirte una foto de tu infancia y que me contás la historia detrás de esa foto." },
            { id: 16, nivel: 'bronce', texto: "Vale por pedirte un audio explicándome con exactitud cómo me abrazarías si estuvieras acá al lado mío." },
            { id: 17, nivel: 'bronce', texto: "Vale por pedirte que me recuerdes la razón exacta por la que vale la pena esta distancia." },
            { id: 18, nivel: 'bronce', texto: "Vale por pedirte 20 minutos de contención pura: hoy me escuchás quejarme de todo sin darme soluciones." },
            { id: 19, nivel: 'bronce', texto: "Vale por pedirte una foto o video del atardecer desde tu ventana o tu ciudad." },
            { id: 20, nivel: 'bronce', texto: "Vale por pedirte que me mandes tu sticker o emoji secreto para decirme que me extrañás." },
            { id: 21, nivel: 'plata', texto: "Vale por exigirte una \"Cena Romántica Virtual\": te vestís lindo/a, te servís una copa y cenamos por videollamada." },
            { id: 22, nivel: 'plata', texto: "Vale por pedirte que perdonemos y soltemos ese malentendido o molestia reciente por mensaje." },
            { id: 23, nivel: 'plata', texto: "Vale por pedirte una charla de indagación estoica por videollamada para analizar cómo estuvo nuestro día." },
            { id: 24, nivel: 'plata', texto: "Vale por pedirte que me confieses un secreto o una vulnerabilidad que nunca le contaste a nadie." },
            { id: 25, nivel: 'plata', texto: "Vale por pedirte una noche de erotismo y complicidad a la distancia (vía llamada o chat privado)." },
            { id: 26, nivel: 'plata', texto: "Vale por pedirte tu opinión profesional y sincera para destrabar una situación difícil que estoy pasando." },
            { id: 27, nivel: 'plata', texto: "Vale por exigirte que me escribas una carta a mano, la metas en un sobre y me la mandes por correo postal." },
            { id: 28, nivel: 'plata', texto: "Vale por pedirte que nos sentemos a armar la lista de todo lo que vamos a hacer apenas nos volvamos a ver." },
            { id: 29, nivel: 'plata', texto: "Vale por pedirte que me leas un capítulo de un libro en voz alta por teléfono antes de irme a dormir." },
            { id: 30, nivel: 'plata', texto: "Vale por pedirte 2 horas de desconexión total del mundo para hablar solo los dos por teléfono." },
            { id: 31, nivel: 'plata', texto: "Vale por pedirte que me confieses una fantasía íntima que querés que cumplamos en el próximo reencuentro." },
            { id: 32, nivel: 'plata', texto: "Vale por pedirte que agregues 5 canciones a nuestra playlist compartida que te hagan acordar a mí." },
            { id: 33, nivel: 'plata', texto: "Vale por exigirte un regalo físico sorpresa mandado por correo a mi casa (un libro, un detalle, algo rico)." },
            { id: 34, nivel: 'plata', texto: "Vale por pedirte que cocinemos la misma receta en simultáneo por videollamada." },
            { id: 35, nivel: 'plata', texto: "Vale por pedirte un \"Tour Virtual\": una videollamada paseando por un lugar lindo de tu ciudad." },
            { id: 36, nivel: 'plata', texto: "Vale por pedirte que me enseñes o me expliques en detalle un tema que a vos te apasione y yo no domine." },
            { id: 37, nivel: 'plata', texto: "Vale por pedirte una carta digital recordando punto por punto el día en que nos conocimos." },
            { id: 38, nivel: 'plata', texto: "Vale por pedirte que hagas un test de personalidad online para que comparemos nuestros resultados." },
            { id: 39, nivel: 'plata', texto: "Vale por pedirte que me cuentes cuál es tu mayor miedo actual con respecto al futuro." },
            { id: 40, nivel: 'plata', texto: "Vale por pedirte una noche de juegos online juntos (juegos retro, trivias o lo que elijamos)." },
            { id: 41, nivel: 'oro', texto: "Vale por pedirte que pongamos fecha y saquemos los pasajes para nuestro próximo reencuentro." },
            { id: 42, nivel: 'oro', texto: "Vale por pedirte que elijas y planifiques una escapada juntos a un lugar de Argentina que no conozcamos." },
            { id: 43, nivel: 'oro', texto: "Vale por pedirte que cerremos y perdonemos definitivamente un tema doloroso del pasado." },
            { id: 44, nivel: 'oro', texto: "Vale por pedirte un día entero en nuestro próximo reencuentro donde el plan lo elijo yo al 100%." },
            { id: 45, nivel: 'oro', texto: "Vale por pedirte que reservemos un fin de semana entero en un hotel o cabaña para estar solos." },
            { id: 46, nivel: 'oro', texto: "Vale por pedirte que te sumes a mi próximo viaje de trabajo/congreso para transformarlo en mini luna de miel." },
            { id: 47, nivel: 'oro', texto: "Vale por pedirte una charla profunda dedicada exclusivamente a planificar el día en que vivamos juntos." },
            { id: 48, nivel: 'oro', texto: "Vale por pedirte 24 horas continuas sin celulares ni pantallas la próxima vez que estemos juntos en persona." },
            { id: 49, nivel: 'oro', texto: "Vale por pedirte que hagamos una actividad atrevida o nueva juntos en nuestra próxima visita." },
            { id: 50, nivel: 'oro', texto: "Vale por pedirte un día completo de spa y masajes en persona durante nuestro reencuentro." },
            { id: 51, nivel: 'oro', texto: "Vale por pedirte que me esperes con una cena casera a la luz de las velas el primer día que llegue a tu ciudad." },
            { id: 52, nivel: 'oro', texto: "Vale por pedirte que cumplamos esa fantasía íntima pendiente penas pisemos la misma habitación." },
            { id: 53, nivel: 'oro', texto: "Vale por pedirte un \"Día Libre de Distancia\": 24 horas en persona enfocados en el presente, sin hablar de la despedida." },
            { id: 54, nivel: 'oro', texto: "Vale por pedirte una prenda u objeto personal tuyo para llevarme a mi casa cuando me toque volver." },
            { id: 55, nivel: 'oro', texto: "Vale por pedirte una noche entera de desvelo, abrazos y charla cara a cara." },
            { id: 56, nivel: 'oro', texto: "Vale por pedirte que saques entradas para ir a un concierto, teatro o show juntos en nuestra próxima visita." },
            { id: 57, nivel: 'oro', texto: "Vale por pedirte que armes un álbum de fotos físico con los mejores momentos de nuestros viajes del año." },
            { id: 58, nivel: 'oro', texto: "Vale por pedirte que cedas en una decisión sobre nuestro próximo viaje, confiando en lo que yo elija." },
            { id: 59, nivel: 'oro', texto: "Vale por pedirte una carta donde me escribas tus compromisos para el futuro que estamos construyendo." },
            { id: 60, nivel: 'oro', texto: "Vale por pedirte que dejes una notita o mensaje escondido en mi casa antes de volverte a tu ciudad." },
            { id: 61, nivel: 'bronce', texto: "Vale por pedirte un audio de buenos días contándome qué es lo primero que pensaste al despertar." },
            { id: 62, nivel: 'bronce', texto: "Vale por pedirte una recomendación de una canción que te haga pensar en mí para escucharla en mi caminata." },
            { id: 63, nivel: 'bronce', texto: "Vale por pedirte una foto de tu almuerzo o cena de hoy para sentir que estamos comiendo juntos." },
            { id: 64, nivel: 'bronce', texto: "Vale por pedirte que me mandes una selfie haciendo una cara divertida justo en este momento." },
            { id: 65, nivel: 'bronce', texto: "Vale por pedirte que me mandes un \"checklist\" de 3 cosas simples que querés cumplir hoy para alentarte." },
            { id: 66, nivel: 'bronce', texto: "Vale por pedirte un mensaje corto al mediodía diciéndome qué es lo que más extrañás de mí hoy." },
            { id: 67, nivel: 'bronce', texto: "Vale por pedirte que elijas el fondo de pantalla que tengo que usar en mi celular durante todo el día." },
            { id: 68, nivel: 'bronce', texto: "Vale por pedirte un video de 15 segundos mostrándome cómo está el clima y tu entorno en tu ciudad." },
            { id: 69, nivel: 'bronce', texto: "Vale por pedirte que me mandes tu sticker más usado en WhatsApp y me expliques por qué te gusta tanto." },
            { id: 70, nivel: 'bronce', texto: "Vale por pedirte que me digas 3 cualidades mías que te den seguridad en nuestra relación a distancia." },
            { id: 71, nivel: 'bronce', texto: "Vale por aplicarte un \"vale de desconexión\": tenés permitido irte a dormir temprano sin dar explicaciones." },
            { id: 72, nivel: 'bronce', texto: "Vale por pedirte un audio donde me leas una frase, poema o párrafo de un libro que te haya gustado." },
            { id: 73, nivel: 'bronce', texto: "Vale por pedirte que me mandes una foto de algún objeto de tu casa que tenga una historia especial." },
            { id: 74, nivel: 'bronce', texto: "Vale por pedirte un mensaje de voz recordándome algún logro reciente del que estés orgullosa/o de mí." },
            { id: 75, nivel: 'bronce', texto: "Vale por pedirte que elijas qué postre o antojo me tengo que comprar hoy para mimarme." },
            { id: 76, nivel: 'bronce', texto: "Vale por pedirte que me mandes una nota de voz susurrando un saludo antes de dormir." },
            { id: 77, nivel: 'bronce', texto: "Vale por pedirte un gif que represente exactamente cómo te sentís hoy con tu rutina." },
            { id: 78, nivel: 'bronce', texto: "Vale por pedirte que me envíes un recuerdo en foto de un viaje o salida pasada que te haga sonreír." },
            { id: 79, nivel: 'bronce', texto: "Vale por pedirte un consejo rápido sobre qué ponerme o cómo resolver un dilema cotidiano simple." },
            { id: 80, nivel: 'bronce', texto: "Vale por pedirte que me dediques el primer pensamiento de tu tarde con un mensaje espontáneo." },
            { id: 81, nivel: 'plata', texto: "Vale por pedirte una cita virtual de \"Noche de Preguntas\": 10 preguntas incómodas o divertidas para responder con verdad." },
            { id: 82, nivel: 'plata', texto: "Vale por pedirte que planifiquemos un menú ideal para la primera cena que tengamos cuando nos volvamos a ver." },
            { id: 83, nivel: 'plata', texto: "Vale por pedirte una llamada de 30 minutos donde solo hablemos de nuestros proyectos personales sin tocar temas de trabajo." },
            { id: 84, nivel: 'plata', texto: "Vale por pedirte que me confieses algo que te daba vergüenza decirme cuando recién empezamos a hablar." },
            { id: 85, nivel: 'plata', texto: "Vale por pedirte que busques un test o juego de preguntas online sobre relaciones y lo completemos en videollamada." },
            { id: 86, nivel: 'plata', texto: "Vale por pedirte que me mandes una encomienda o paquete chico con algo típico o rico de tu ciudad." },
            { id: 87, nivel: 'plata', texto: "Vale por pedirte una noche de juego retro o partida online donde el perdedor le debe un masaje al otro." },
            { id: 88, nivel: 'plata', texto: "Vale por pedirte que me cuentes en detalle cómo imaginas que será nuestra primera mañana juntos cuando convivamos." },
            { id: 89, nivel: 'plata', texto: "Vale por pedirte una videollamada donde cada uno se sirva una bebida y compartamos un análisis de nuestro mes." },
            { id: 90, nivel: 'plata', texto: "Vale por pedirte que me compartas una meta personal que tengas a mediano plazo y cómo puedo apoyarte a la distancia." },
            { id: 91, nivel: 'plata', texto: "Vale por pedirte un audio de 5 minutos donde me hagas un resumen completo de un tema que estés estudiando o leyendo." },
            { id: 92, nivel: 'plata', texto: "Vale por pedirte que me envíes una lista de 5 hábitos que te gustaría que cultivemos juntos a futuro." },
            { id: 93, nivel: 'plata', texto: "Vale por pedirte un espacio para pedirnos disculpas sinceras por alguna falta de paciencia reciente." },
            { id: 94, nivel: 'plata', texto: "Vale por pedirte una sesión de audios eróticos contándome qué te gustaría que te haga en nuestro próximo reencuentro." },
            { id: 95, nivel: 'plata', texto: "Vale por pedirte que elijas una película de tu infancia para ver simultáneamente este fin de semana." },
            { id: 96, nivel: 'plata', texto: "Vale por pedirte que me escribas una reflexión sobre qué significa para vos el amor maduro en este momento." },
            { id: 97, nivel: 'plata', texto: "Vale por pedirte que hagamos una caminata sincronizada: los dos caminando por nuestras ciudades mientras hablamos por teléfono." },
            { id: 98, nivel: 'plata', texto: "Vale por pedirte que me cuentes sobre una tradición familiar tuya que te gustaría mantener cuando vivamos juntos." },
            { id: 99, nivel: 'plata', texto: "Vale por pedirte que me envíes una foto luciendo tu ropa favorita y me cuentes por qué te hace sentir bien." },
            { id: 100, nivel: 'plata', texto: "Vale por pedirte que planifiquemos un presupuesto o ahorro simulado para nuestro próximo viaje juntos." },
            { id: 101, nivel: 'oro', texto: "Vale por pedirte que definamos hoy mismo la ciudad o lugar donde vamos a pasar nuestras próximas vacaciones largas." },
            { id: 102, nivel: 'oro', texto: "Vale por pedirte un \"Día de Exploradores\" en nuestro próximo reencuentro: todo el día visitando lugares nuevos sin mirar el reloj." },
            { id: 103, nivel: 'oro', texto: "Vale por pedirte que reserves una noche en un lugar especial para cenar en la ciudad que visite la próxima vez." },
            { id: 104, nivel: 'oro', texto: "Vale por pedirte un \"Día de Picnic\" al aire libre en un parque o lugar tranquilo apenas estemos en la misma provincia." },
            { id: 105, nivel: 'oro', texto: "Vale por pedirte que me regales una pieza de ropa o accesorio tuyo con tu perfume para llevarme de regreso." },
            { id: 106, nivel: 'oro', texto: "Vale por pedirte un compromiso firme para dar un paso concreto hacia la convivencia antes de que termine el año." },
            { id: 107, nivel: 'oro', texto: "Vale por pedirte un maratón entero de cocina juntos durante el fin de semana del reencuentro." },
            { id: 108, nivel: 'oro', texto: "Vale por pedirte una noche de desconexión absoluta del teléfono en nuestro primer día de visita." },
            { id: 109, nivel: 'oro', texto: "Vale por pedirte que planifiquemos una visita a un museo, exposición o show cultural para nuestro próximo viaje." },
            { id: 110, nivel: 'oro', texto: "Vale por pedirte un masaje de pies y piernas de 20 minutos apenas me baje del colectivo o avión para darme la bienvenida." },
            { id: 111, nivel: 'oro', texto: "Vale por pedirte que hagamos una sesión de fotos casuales y lindas juntos en la calle durante el reencuentro." },
            { id: 112, nivel: 'oro', texto: "Vale por pedirte que abramos un tema importante sobre nuestras dinámicas de pareja para dejarlo saldado en persona." },
            { id: 113, nivel: 'oro', texto: "Vale por pedirte un día dedicado 100% a descansar en la cama, mirando películas y pidiendo delivery cuando estemos juntos." },
            { id: 114, nivel: 'oro', texto: "Vale por pedirte que compremos juntos un objeto de decoración que quede guardado para cuando tengamos nuestra casa definitiva." },
            { id: 115, nivel: 'oro', texto: "Vale por pedirte una escapada sorpresa de un día a un pueblo o localidad cercana de la provincia donde nos encontremos." },
            { id: 116, nivel: 'oro', texto: "Vale por pedirte que me dediques un espacio a solas para leerme una carta cara a cara durante nuestra visita." },
            { id: 117, nivel: 'oro', texto: "Vale por pedirte que cedas la elección del itinerario completo del último día que pasemos juntos en la misma ciudad." },
            { id: 118, nivel: 'oro', texto: "Vale por pedirte un pacto de \"Cero Discusiones\" durante todo el fin de semana de nuestro reencuentro." },
            { id: 119, nivel: 'oro', texto: "Vale por pedirte que organicemos un desayuno de bienvenida espectacular para la primera mañana de nuestra visita." },
            { id: 120, nivel: 'oro', texto: "Vale por pedirte que hagamos una lista escrita a mano con los mejores 10 recuerdos de nuestras visitas pasadas." },
            { id: 121, nivel: 'bronce', texto: "Vale por pedirte un audio rápido de 30 segundos diciéndome qué es lo que más te gusta de mi voz." },
            { id: 122, nivel: 'bronce', texto: "Vale por pedirte que me mandes una foto del lugar donde estás trabajando o descansando en este preciso instante." },
            { id: 123, nivel: 'bronce', texto: "Vale por pedirte que elijas qué voy a cenar hoy (me comprometo a hacerte caso o pedir lo que digas)." },
            { id: 124, nivel: 'bronce', texto: "Vale por pedirte un mensaje contándome qué aprendizaje te dejó el día de hoy." },
            { id: 125, nivel: 'bronce', texto: "Vale por pedirte que me mandes una canción que sientas que describe cómo está nuestro vínculo en este momento." },
            { id: 126, nivel: 'bronce', texto: "Vale por pedirte un audio corto riéndote (contame un chiste malo o acordate de un blooper)." },
            { id: 127, nivel: 'bronce', texto: "Vale por pedirte que me mandes un \"checklist\" de 3 cosas por las que estés agradecido/a hoy." },
            { id: 128, nivel: 'bronce', texto: "Vale por pedirte un mensaje de buenas noches deseándome un sueño específico." },
            { id: 129, nivel: 'bronce', texto: "Vale por pedirte que me compartas un meme que solo nosotros dos entendamos." },
            { id: 130, nivel: 'bronce', texto: "Vale por pedirte una foto de tu mirada o tus ojos en primer plano justo ahora." },
            { id: 131, nivel: 'bronce', texto: "Vale por pedirte un audio de 1 minuto diciéndome qué fue lo mejor que te pasó en la semana." },
            { id: 132, nivel: 'bronce', texto: "Vale por pedirte que me digas cuál es tu palabra favorita de nuestro vocabulario de pareja." },
            { id: 133, nivel: 'bronce', texto: "Vale por aplicarte a vos un \"vale de descanso\": hoy te libero de darme reportes, tomate la tarde para vos." },
            { id: 134, nivel: 'bronce', texto: "Vale por pedirte que me recomiendes una serie o película para empezar a ver esta semana." },
            { id: 135, nivel: 'bronce', texto: "Vale por pedirte una foto del cielo o el entorno desde donde estés parado/a ahora." },
            { id: 136, nivel: 'bronce', texto: "Vale por pedirte un mensaje de apoyo y motivación para afrontar una tarea difícil de mi día." },
            { id: 137, nivel: 'bronce', texto: "Vale por pedirte que me mandes un emoji o sticker que exprese las ganas que tenés de abrazarme." },
            { id: 138, nivel: 'bronce', texto: "Vale por pedirte que me recuerdes un momento vergonzoso pero divertido que hayamos pasado juntos." },
            { id: 139, nivel: 'bronce', texto: "Vale por pedirte que me mandes una captura de pantalla del último tema que escuchaste en Spotify." },
            { id: 140, nivel: 'bronce', texto: "Vale por pedirte un saludito de 10 segundos en video antes de salir de tu casa." },
            { id: 141, nivel: 'bronce', texto: "Vale por pedirte que me mandes una foto de algo que te cruzaste hoy en la calle y te hizo acordar a mí." },
            { id: 142, nivel: 'bronce', texto: "Vale por pedirte un audio contándome qué fue lo primero que te atrajo de mí cuando nos conocimos." },
            { id: 143, nivel: 'bronce', texto: "Vale por pedirte que elijas qué infusión (café, té o mate) tengo que tomarme esta tarde pensando en vos." },
            { id: 144, nivel: 'bronce', texto: "Vale por pedirte un \"ticket de pausa\": cuando la rutina nos abrume, este ticket congela la charla pesada por 1 hora." },
            { id: 145, nivel: 'bronce', texto: "Vale por pedirte que me mandes una lista de 3 canciones que querés que escuchemos juntos la próxima vez." },
            { id: 146, nivel: 'bronce', texto: "Vale por pedirte un mensaje explicándome qué superpoder te gustaría tener por un día." },
            { id: 147, nivel: 'bronce', texto: "Vale por pedirte una selfie usando algo que te haya regalado o que te recuerde a mí." },
            { id: 148, nivel: 'bronce', texto: "Vale por pedirte un audio cortito mandándome un beso susurrado." },
            { id: 149, nivel: 'bronce', texto: "Vale por pedirte que me digas un hábito mío que te parezca tierno o gracioso." },
            { id: 150, nivel: 'bronce', texto: "Vale por pedirte que me mandes un mensaje diciéndome qué es lo primero que querés que hagamos cuando nos bajemos del transporte en la otra ciudad." },
            { id: 151, nivel: 'plata', texto: "Vale por pedirte una \"Cita de Mates y MÚSICA\": videollamada para escuchar un álbum completo de punta a punta juntos." },
            { id: 152, nivel: 'plata', texto: "Vale por pedirte que me contés en detalle una experiencia de tu infancia que te haya marcado la personalidad." },
            { id: 153, nivel: 'plata', texto: "Vale por pedirte que hagamos una videollamada mientras preparamos juntos la cena en nuestras respectivas cocinas." },
            { id: 154, nivel: 'plata', texto: "Vale por pedirte que me escribas una nota digital con 5 metas que querés que cumplamos en los próximos 6 meses." },
            { id: 155, nivel: 'plata', texto: "Vale por pedirte que me organices una trivia de 10 preguntas sobre vos a ver qué tanto te conozco." },
            { id: 156, nivel: 'plata', texto: "Vale por pedirte una noche de confesiones eróticas por audio contándome algo que nunca te atreviste a pedirme." },
            { id: 157, nivel: 'plata', texto: "Vale por pedirte que me leas una poesía, cuento corto o ensayo que te guste antes de dormir." },
            { id: 158, nivel: 'plata', texto: "Vale por pedirte una videollamada para repasar nuestras fotos antiguas y recordar cada momento." },
            { id: 159, nivel: 'plata', texto: "Vale por pedirte que me mandes una carta escrita a mano y escaneada o enviada por foto con buena luz." },
            { id: 160, nivel: 'plata', texto: "Vale por pedirte que hagamos una sesión de Indagación Estoica por videollamada: ¿en qué fuimos débiles esta semana y cómo nos fortalecemos?" },
            { id: 161, nivel: 'plata', texto: "Vale por pedirte un envío por correo con una golosina o snack que no consiga fácilmente en mi ciudad." },
            { id: 162, nivel: 'plata', texto: "Vale por pedirte que planifiquemos virtualmente el mapa de nuestro próximo viaje (lugares, restaurantes, paseos)." },
            { id: 163, nivel: 'plata', texto: "Vale por pedirte que compartamos un libro: leer un capítulo por semana cada uno y comentarlo en una cita los domingos." },
            { id: 164, nivel: 'plata', texto: "Vale por pedirte un espacio en videollamada para hablar sin tapujos de nuestras finanzas o proyectos a futuro." },
            { id: 165, nivel: 'plata', texto: "Vale por pedirte que me hagas una crítica constructiva con mucho amor sobre algo que pueda mejorar en la relación." },
            { id: 166, nivel: 'plata', texto: "Vale por pedirte que me armes una playlist de 10 canciones para cuando necesite concentrarme o relajarme." },
            { id: 167, nivel: 'plata', texto: "Vale por pedirte que juguemos a un juego de rol o simulación divertida durante una videollamada." },
            { id: 168, nivel: 'plata', texto: "Vale por pedirte que me cuentes sobre algún sueño no cumplido que tengas y cómo puedo ayudarte a alcanzarlo." },
            { id: 169, nivel: 'plata', texto: "Vale por pedirte que busquemos una receta compleja en YouTube y la hagamos en simultáneo el fin de semana." },
            { id: 170, nivel: 'plata', texto: "Vale por pedirte que me envíes un mensaje en clave o código que yo tenga que descifrar." },
            { id: 171, nivel: 'plata', texto: "Vale por pedirte que me compartas qué opinión tenías de mí antes de empezar a salir y cómo cambió." },
            { id: 172, nivel: 'plata', texto: "Vale por pedirte que me des una clase magistral de 15 minutos sobre un tema en el que seas experto/a." },
            { id: 173, nivel: 'plata', texto: "Vale por pedirte que dediquemos una videollamada a diseñar la distribución de la casa o espacio que compartiremos a futuro." },
            { id: 174, nivel: 'plata', texto: "Vale por pedirte que perdonemos y dejemos en el olvido una pequeña falta de atención o distracción reciente." },
            { id: 175, nivel: 'plata', texto: "Vale por pedirte que me envíes un audio detallando cómo te imaginas nuestra vejez juntos." },
            { id: 176, nivel: 'plata', texto: "Vale por pedirte que elijas un podcast o charla TED para que escuchemos los dos y debatamos a la noche." },
            { id: 177, nivel: 'plata', texto: "Vale por pedirte una \"Cita Virtual Formosa\": vestirnos elegantes como si fuéramos al mejor restaurante, pero en videollamada." },
            { id: 178, nivel: 'plata', texto: "Vale por pedirte que me mandes una foto de tu diario, libreta o espacio de trabajo revelándome una nota secreta." },
            { id: 179, nivel: 'plata', texto: "Vale por pedirte que hagamos un test de inteligencia emocional online juntos y analicemos los puntos en común." },
            { id: 180, nivel: 'plata', texto: "Vale por pedirte que me cuentes un momento en el que te hayas sentido profundamente amado/a por mí a la distancia." },
            { id: 181, nivel: 'oro', texto: "Vale por pedirte que reservemos hoy los pasajes para nuestro próximo reencuentro sin dar más vueltas." },
            { id: 182, nivel: 'oro', texto: "Vale por pedirte que organicemos un viaje de fin de semana largo a una provincia o pueblo que ninguno conozca." },
            { id: 183, nivel: 'oro', texto: "Vale por pedirte un \"Día de Desconexión Digital\": 24 horas continuas de reencuentro sin mirar el celular." },
            { id: 184, nivel: 'oro', texto: "Vale por pedirte un desayuno en la cama preparado por vos la primera mañana que pasemos juntos." },
            { id: 185, nivel: 'oro', texto: "Vale por pedirte una sesión de masajes corporales de al menos 40 minutos en nuestro próximo reencuentro." },
            { id: 186, nivel: 'oro', texto: "Vale por pedirte que hagamos una visita cultural o vayamos a una obra de teatro/concierto la próxima vez que nos veamos." },
            { id: 187, nivel: 'oro', texto: "Vale por pedirte un paseo nocturno caminando de la mano por la ciudad donde nos encontremos." },
            { id: 188, nivel: 'oro', texto: "Vale por pedirte que tengamos una conversación seria y amorosa para definir la fecha estimada de mudanza o convivencia definitiva." },
            { id: 189, nivel: 'oro', texto: "Vale por pedirte un día donde yo elija el 100% de las actividades, comidas y horarios durante la visita." },
            { id: 190, nivel: 'oro', texto: "Vale por pedirte que cumplamos una fantasía o juego íntimo pendiente en cuanto estemos en la misma habitación." },
            { id: 191, nivel: 'oro', texto: "Vale por pedirte una cena Romántica a la luz de las velas preparada por vos en la casa donde nos alojemos." },
            { id: 192, nivel: 'oro', texto: "Vale por pedirte un \"Día de Pijama\": pasar todo el día en la cama comiendo rico y mirando películas en persona." },
            { id: 193, nivel: 'oro', texto: "Vale por pedirte que me regales una prenda de ropa tuya usada para llevarme en la valija al volver." },
            { id: 194, nivel: 'oro', texto: "Vale por pedirte que visitemos un lugar con naturaleza (parque, río, reserva) en nuestro próximo viaje juntos." },
            { id: 195, nivel: 'oro', texto: "Vale por pedirte un pacto de perdón absoluto y borrón y cuenta nueva sobre una discusión del pasado que nos haya marcado." },
            { id: 196, nivel: 'oro', texto: "Vale por pedirte que armemos una caja con recuerdos físicos de nuestro año para abrirla dentro de 5 años." },
            { id: 197, nivel: 'oro', texto: "Vale por pedirte un día entero de turismo en tu ciudad guiado exclusivamente por vos a lugares no comerciales." },
            { id: 198, nivel: 'oro', texto: "Vale por pedirte una noche de fiesta, baile o bar temático la próxima vez que nos encontremos." },
            { id: 199, nivel: 'oro', texto: "Vale por pedirte que dejemos coordinado el próximo encuentro antes de despedirnos en la terminal/aeropuerto." },
            { id: 200, nivel: 'oro', texto: "Vale por pedirte que preparemos juntos una comida típica o compleja durante el fin de semana del reencuentro." },
            { id: 201, nivel: 'oro', texto: "Vale por pedirte que compartamos un día entero con tus amigos/familia o los míos para integrarnos más." },
            { id: 202, nivel: 'oro', texto: "Vale por pedirte que me escribas una nota de amor a mano y la escondas en mi valija para que la encuentre al llegar a mi casa." },
            { id: 203, nivel: 'oro', texto: "Vale por pedirte un día completo donde la respuesta a todas mis propuestas razonables sea \"Sí\"." },
            { id: 204, nivel: 'oro', texto: "Vale por pedirte que reservemos un hotel con spa o jacuzzi para pasar un día entero de relajación en persona." },
            { id: 205, nivel: 'oro', texto: "Vale por pedirte una caminata matutina temprano para ver el amanecer o el inicio del día juntos." },
            { id: 206, nivel: 'oro', texto: "Vale por pedirte que me hagas una sesión de fotos bien cuidada en un lugar lindo durante el viaje." },
            { id: 207, nivel: 'oro', texto: "Vale por pedirte que me compres o consigas un recuerdo físico de la ciudad donde nos reencontremos." },
            { id: 208, nivel: 'oro', texto: "Vale por pedirte un compromiso escrito de 3 metas de pareja para cumplir antes de nuestro próximo aniversario." },
            { id: 209, nivel: 'oro', texto: "Vale por pedirte una noche entera dedicada exclusivamente al placer y la reconexión íntima sin apuros." },
            { id: 210, nivel: 'oro', texto: "Vale por pedirte que dediquemos una tarde del reencuentro a hacer compras juntos para la casa o proyectos futuros." },
            { id: 211, nivel: 'oro', texto: "Vale por pedirte un \"Día sin Rutina\": levantarnos sin alarma y hacer lo que vaya surgiendo en el momento." },
            { id: 212, nivel: 'oro', texto: "Vale por pedirte que me dediques unas palabras de agradecimiento en persona mirándome a los ojos antes de cenar." },
            { id: 213, nivel: 'oro', texto: "Vale por pedirte que visitemos un mercado o feria local en la ciudad en la que nos encontremos." },
            { id: 214, nivel: 'oro', texto: "Vale por pedirte un picnic sorpresa preparado por vos en un parque lindo." },
            { id: 215, nivel: 'oro', texto: "Vale por pedirte que tomemos una clase o taller juntos durante nuestro viaje (cocina, baile, cerámica, etc.)." },
            { id: 216, nivel: 'oro', texto: "Vale por pedirte que me cedas el control de la música durante todos los viajes en auto o traslados del reencuentro." },
            { id: 217, nivel: 'oro', texto: "Vale por pedirte que hagamos una caminata larga bajo la lluvia si el clima se da durante nuestra visita." },
            { id: 218, nivel: 'oro', texto: "Vale por pedirte que me lleves a conocer tu rincón preferido o más secreto de la ciudad donde estás." },
            { id: 219, nivel: 'oro', texto: "Vale por pedirte que grabemos un video corto juntos hablando a nuestro \"yo del futuro\" para verlo en un año." },
            { id: 220, nivel: 'oro', texto: "Vale por pedirte un abrazo interminable de bienvenida de al menos 3 minutos apenas nos veamos en persona." },
            { id: 221, nivel: 'bronce', texto: "Vale por pedirte un audio de 20 segundos diciéndome qué es lo que más extrañás de mi cuerpo hoy." },
            { id: 222, nivel: 'bronce', texto: "Vale por pedirte una foto de lo que estás leyendo o estudiando en este momento." },
            { id: 223, nivel: 'bronce', texto: "Vale por pedirte que me mandes un saludo en voz alta grabado en medio de la calle o donde estés." },
            { id: 224, nivel: 'bronce', texto: "Vale por pedirte que elijas qué infusión (café, té o mate) nos vamos a tomar esta tarde \"juntos\" en videollamada." },
            { id: 225, nivel: 'bronce', texto: "Vale por pedirte que me mandes una captura de tu pantalla de inicio de celular." },
            { id: 226, nivel: 'bronce', texto: "Vale por pedirte que me digas 3 cualidades mías que te den tranquilidad en momentos de estrés." },
            { id: 227, nivel: 'bronce', texto: "Vale por pedirte un audio rápido imitando de forma divertida un acento o personaje." },
            { id: 228, nivel: 'bronce', texto: "Vale por pedirte que me envíes una foto del cielo o del atardecer desde el lugar donde estés ahora." },
            { id: 229, nivel: 'bronce', texto: "Vale por pedirte un mensaje contándome qué fue lo primero que pensaste sobre mi familia cuando la conociste." },
            { id: 230, nivel: 'bronce', texto: "Vale por pedirte que me envíes tu meme o sticker favorito sobre relaciones a distancia." },
            { id: 231, nivel: 'bronce', texto: "Vale por pedirte un \"vale de paciencia\": hoy te pido que me escuches con extra de empatía si ando irritable." },
            { id: 232, nivel: 'bronce', texto: "Vale por pedirte que me mandes una foto de tu rincón favorito de la casa donde vivís." },
            { id: 233, nivel: 'bronce', texto: "Vale por pedirte un audio de 1 minuto recomendándome un libro, película o podcast con tus razones." },
            { id: 234, nivel: 'bronce', texto: "Vale por pedirte que me digas qué prenda o ropa mía es tu favorita y por qué te gusta tanto." },
            { id: 235, nivel: 'bronce', texto: "Vale por pedirte un mensaje sorpresa a mitad de la tarde recordándome cuánto me querés." },
            { id: 236, nivel: 'bronce', texto: "Vale por pedirte que me mandes un video corto de 5 segundos mandándome un beso gigante." },
            { id: 237, nivel: 'bronce', texto: "Vale por pedirte que elijas la playlist que va a sonar en mi casa durante las próximas 2 horas." },
            { id: 238, nivel: 'bronce', texto: "Vale por pedirte un audio contándome algún recuerdo lindo de tu infancia relacionado a un viaje." },
            { id: 239, nivel: 'bronce', texto: "Vale por pedirte que me envíes una foto de tus manos o tus pies justo ahora." },
            { id: 240, nivel: 'bronce', texto: "Vale por pedirte un mensaje de apoyo y buena onda para arrancar mi jornada laboral de hoy." },
            { id: 241, nivel: 'bronce', texto: "Vale por pedirte que me envíes un sticker o emoji que resuma cómo te sentís con tu día hasta ahora." },
            { id: 242, nivel: 'bronce', texto: "Vale por pedirte un audio susurrado antes de ir a dormir diciéndome qué soñás que hagamos pronto." },
            { id: 243, nivel: 'bronce', texto: "Vale por pedirte que me mandes una foto de algo rojo o de tu color favorito que tengas cerca." },
            { id: 244, nivel: 'bronce', texto: "Vale por pedirte que me recuerdes un momento ridículo en el que nos hayamos reído sin poder parar." },
            { id: 245, nivel: 'bronce', texto: "Vale por pedirte que me digas qué pequeña costumbre cotidiana mía te gustaría adoptar para vos." },
            { id: 246, nivel: 'bronce', texto: "Vale por pedirte un audio contándome qué fue lo más rico que comiste en esta semana." },
            { id: 247, nivel: 'bronce', texto: "Vale por pedirte una selfie rápida sin filtros ni poses, 100% al natural." },
            { id: 248, nivel: 'bronce', texto: "Vale por pedirte que me envíes una lista de 3 hábitos saludables que querés que sostengamos." },
            { id: 249, nivel: 'bronce', texto: "Vale por pedirte un mensaje directo contándome algo que te haya enorgullecido de vos mismo/a hoy." },
            { id: 250, nivel: 'bronce', texto: "Vale por pedirte un \"vale de silencio\": hoy te libero de darme reportes por chat para que descanses la cabeza." },
            { id: 251, nivel: 'bronce', texto: "Vale por pedirte un audio de 30 segundos explicándome qué es lo que más te gusta de nuestra química." },
            { id: 252, nivel: 'bronce', texto: "Vale por pedirte que me compartas una foto de tu infancia en la que estés haciendo alguna travesura." },
            { id: 253, nivel: 'bronce', texto: "Vale por pedirte que me digas cuál es la canción que más escuchaste en este último mes." },
            { id: 254, nivel: 'bronce', texto: "Vale por pedirte un mensaje contándome qué rasgo de mi personalidad sentís que te complementa mejor." },
            { id: 255, nivel: 'bronce', texto: "Vale por pedirte que me mandes una foto de tu outfit de hoy y me cuentes por qué lo elegiste." },
            { id: 256, nivel: 'bronce', texto: "Vale por pedirte un audio corto con un mensaje de aliento para un proyecto o tarea que tengo pendiente." },
            { id: 257, nivel: 'bronce', texto: "Vale por pedirte que me digas cuál es tu lugar favorito del mundo entre los que ya conocés." },
            { id: 258, nivel: 'bronce', texto: "Vale por pedirte un gif divertido que represente lo que querés hacerme cuando me veas." },
            { id: 259, nivel: 'bronce', texto: "Vale por pedirte una captura de pantalla de la última nota o recordatorio que anotaste en tu celular." },
            { id: 260, nivel: 'bronce', texto: "Vale por pedirte un audio recordándome la primera impresión que tuviste de mí al conocernos." },
            { id: 261, nivel: 'plata', texto: "Vale por pedirte una cita virtual de \"Noche de Lectura\": leernos mutuamente capítulos o artículos que nos gusten." },
            { id: 262, nivel: 'plata', texto: "Vale por pedirte que me envíes un paquete o sobre por correo con una carta manuscrita y un detalle chico." },
            { id: 263, nivel: 'plata', texto: "Vale por pedirte una videollamada para repasar los hitos más importantes de nuestro año como pareja." },
            { id: 264, nivel: 'plata', texto: "Vale por pedirte que me contés un secreto o miedo profundo que sientas respecto a tu crecimiento personal." },
            { id: 265, nivel: 'plata', texto: "Vale por pedirte una sesión de audios eróticos detallándome exactamente qué vamos a hacer la primera noche que nos veamos." },
            { id: 266, nivel: 'plata', texto: "Vale por pedirte que busquemos una receta nueva y la cocinemos en simultáneo por videollamada el fin de semana." },
            { id: 267, nivel: 'plata', texto: "Vale por pedirte una charla de Indagación Estoica por videollamada: ¿qué virtudes trabajamos bien esta semana y cuáles descuidamos?" },
            { id: 268, nivel: 'plata', texto: "Vale por pedirte que planifiquemos virtualmente el presupuesto y detalles para nuestro próximo gran viaje." },
            { id: 269, nivel: 'plata', texto: "Vale por pedirte que me compartas un sueño recurrente o extraño que hayas tenido en tu vida." },
            { id: 270, nivel: 'plata', texto: "Vale por pedirte un audio de 5 minutos explicándome a fondo una teoría, idea o concepto que te fascine." },
            { id: 271, nivel: 'plata', texto: "Vale por pedirte que me envíes una lista de 5 cosas en las que sentís que maduramos desde que estamos juntos." },
            { id: 272, nivel: 'plata', texto: "Vale por pedirte un espacio en videollamada para pedirnos disculpas sinceras por alguna falta de atención reciente." },
            { id: 273, nivel: 'plata', texto: "Vale por pedirte que elijas una película de suspenso o drama para ver \"juntos\" al mismo tiempo y comentarla por chat." },
            { id: 274, nivel: 'plata', texto: "Vale por pedirte que me hagas un regalo sorpresa sin motivo, enviado directamente a mi casa por delivery o correo." },
            { id: 275, nivel: 'plata', texto: "Vale por pedirte que me cuentes sobre una meta financiera o profesional que quieras alcanzar en los próximos 2 años." },
            { id: 276, nivel: 'plata', texto: "Vale por pedirte que armemos una lista de 10 restaurantes o bares que queramos visitar cuando estemos en la misma ciudad." },
            { id: 277, nivel: 'plata', texto: "Vale por pedirte una noche de juegos retro online o trivias donde el que pierde paga el postre en el próximo encuentro." },
            { id: 278, nivel: 'plata', texto: "Vale por pedirte que me escribas una reflexión sobre qué valores considerás innegociables para nuestro proyecto compartido." },
            { id: 279, nivel: 'plata', texto: "Vale por pedirte una cita virtual de \"Mates y Preguntas Profundas\": responder 5 preguntas de desarrollo personal elegidas por el otro." },
            { id: 280, nivel: 'plata', texto: "Vale por pedirte que me enseñes en videollamada una técnica o habilidad práctica que vos domines y yo no." },
            { id: 281, nivel: 'plata', texto: "Vale por pedirte que compartamos un test de estilo de apego o personalidad y analicemos nuestros puntos de contacto." },
            { id: 282, nivel: 'plata', texto: "Vale por pedirte que me contés cuál fue el momento exacto en el que te diste cuenta de que te habías enamorado de mí." },
            { id: 283, nivel: 'plata', texto: "Vale por pedirte un audio contándome qué aspecto de nuestra vida cotidiana juntos es el que más te entusiasma a futuro." },
            { id: 284, nivel: 'plata', texto: "Vale por pedirte que preparemos un playlist de 15 canciones exclusivo para escuchar en la carretera durante nuestro próximo viaje." },
            { id: 285, nivel: 'plata', texto: "Vale por pedirte que me muestres en videollamada objetos con valor sentimental que guardes en tu habitación." },
            { id: 286, nivel: 'plata', texto: "Vale por pedirte que me contés una historia graciosa o vergonzosa de tu etapa escolar o universitaria." },
            { id: 287, nivel: 'plata', texto: "Vale por pedirte que perdonemos y soltemos definitivamente una actitud que nos haya causado distanciamiento reciente." },
            { id: 288, nivel: 'plata', texto: "Vale por pedirte un audio de 3 minutos describiéndome cómo sería un día perfecto de fin de semana en nuestra futura casa." },
            { id: 289, nivel: 'plata', texto: "Vale por pedirte que escojamos un documental breve para ver y debatirlo profundamente por llamada." },
            { id: 290, nivel: 'plata', texto: "Vale por pedirte una carta digital repasando todo lo que superamos juntos para sostener esta relación a distancia." },
            { id: 291, nivel: 'plata', texto: "Vale por pedirte que me compartas una foto de un lugar de tu ciudad que te brinde paz y me contés por qué." },
            { id: 292, nivel: 'plata', texto: "Vale por pedirte que nos conectemos a una llamada solo para acompañarnos en silencio mientras cada uno trabaja o lee." },
            { id: 293, nivel: 'plata', texto: "Vale por pedirte que planifiquemos un proyecto creativo o de mejora para la casa/espacio que compartiremos." },
            { id: 294, nivel: 'plata', texto: "Vale por pedirte que me envíes un audio detallando 3 cosas que admiras de cómo enfrento mis momentos difíciles." },
            { id: 295, nivel: 'plata', texto: "Vale por pedirte una cita virtual vestida/o formal con una copa de vino para brindar por nuestro camino recorrido." },
            { id: 296, nivel: 'plata', texto: "Vale por pedirte que me leas en voz alta el capítulo de un libro de desarrollo personal o psicología que te haya servido." },
            { id: 297, nivel: 'plata', texto: "Vale por pedirte que juguemos a imaginarnos en 10 años y describir en detalle dónde estamos y qué hacemos." },
            { id: 298, nivel: 'plata', texto: "Vale por pedirte que me contés qué hábito de tu rutina te gustaría modificar con mi ayuda cuando convivamos." },
            { id: 299, nivel: 'plata', texto: "Vale por pedirte un audio confesándome un deseo o fantasía que todavía no hayamos llevado a la práctica a la distancia." },
            { id: 300, nivel: 'plata', texto: "Vale por pedirte que dediquemos una videollamada a repasar nuestros compromisos y apoyos mutuos para el próximo mes." },
            { id: 301, nivel: 'oro', texto: "Vale por pedirte que saquemos los pasajes para nuestro próximo reencuentro hoy mismo sin postergarlo más." },
            { id: 302, nivel: 'oro', texto: "Vale por pedirte que reserves un fin de semana entero en una cabaña o lugar de descanso alejado de la ciudad." },
            { id: 303, nivel: 'oro', texto: "Vale por pedirte un \"Día de Desconexión Total\": 24 horas continuas en persona sin mirar celulares ni pantallas." },
            { id: 304, nivel: 'oro', texto: "Vale por pedirte un desayuno sorpresa en la cama preparado por vos la primera mañana que nos encontremos." },
            { id: 305, nivel: 'oro', texto: "Vale por pedirte una sesión de masajes corporales relajantes de al menos 40 minutos en nuestro reencuentro." },
            { id: 306, nivel: 'oro', texto: "Vale por pedirte que vayamos a un show en vivo, concierto o función de teatro durante nuestra visita." },
            { id: 307, nivel: 'oro', texto: "Vale por pedirte un día completo de turismo en persona donde el recorrido y las actividades las elija yo al 100%." },
            { id: 308, nivel: 'oro', texto: "Vale por pedirte que tengamos una conversación clara y amorosa para definir la fecha de nuestra mudanza definitiva." },
            { id: 309, nivel: 'oro', texto: "Vale por pedirte que cumplamos esa fantasía íntima pendiente apenas entremos a la habitación en nuestro reencuentro." },
            { id: 310, nivel: 'oro', texto: "Vale por pedirte una cena Romántica a la luz de las velas con comida casera o delivery de nivel en nuestra visita." },
            { id: 311, nivel: 'oro', texto: "Vale por pedirte un \"Día de Pijama y Maratón\": pasar todo el día en la cama comiendo rico y mirando películas en persona." },
            { id: 312, nivel: 'oro', texto: "Vale por pedirte que me regales una prenda de ropa o accesorio tuyo con tu perfume para llevarme de regreso a mi ciudad." },
            { id: 313, nivel: 'oro', texto: "Vale por pedirte una escapada de un día a un río, parque natural o reserva durante nuestro viaje juntos." },
            { id: 314, nivel: 'oro', texto: "Vale por pedirte un pacto de perdón definitivo sobre cualquier malentendido o dolor del pasado, abriendo una etapa limpia." },
            { id: 315, nivel: 'oro', texto: "Vale por pedirte que armemos un álbum o caja con recuerdos físicos de nuestras visitas y viajes de este año." },
            { id: 316, nivel: 'oro', texto: "Vale por pedirte que me lleves a un recorrido por tu ciudad guiado exclusivamente por vos a lugares no turísticos." },
            { id: 317, nivel: 'oro', texto: "Vale por pedirte una salida nocturna a un bar temático o lugar con buena música durante el reencuentro." },
            { id: 318, nivel: 'oro', texto: "Vale por pedirte que dejemos coordinada la fecha exacta del próximo reencuentro antes de despedirnos en la terminal o aeropuerto." },
            { id: 319, nivel: 'oro', texto: "Vale por pedirte que preparemos juntos una receta gastronómica compleja o típica durante el fin de semana juntos." },
            { id: 320, nivel: 'oro', texto: "Vale por pedirte que compartamos una tarde entera con tu círculo cercano de amigos o familia para integrarnos más." },
            { id: 321, nivel: 'oro', texto: "Vale por pedirte que me dejes una notita o carta manuscrita escondida en mi valija o casa para que la encuentre al volver." },
            { id: 322, nivel: 'oro', texto: "Vale por pedirte un día entero de reencuentro donde la respuesta a todas mis propuestas razonables sea \"Sí\"." },
            { id: 323, nivel: 'oro', texto: "Vale por pedirte que reservemos un día de spa, circuito de agua o masajes profesionales durante nuestro viaje." },
            { id: 324, nivel: 'oro', texto: "Vale por pedirte una caminata temprano en la mañana para ver el amanecer y tomar mates juntos en la naturaleza." },
            { id: 325, nivel: 'oro', texto: "Vale por pedirte una sesión de fotos casuales e improvisadas juntos por la ciudad para guardar de recuerdo." },
            { id: 326, nivel: 'oro', texto: "Vale por pedirte que compremos un objeto simbólico durante el viaje que quede destinado a nuestra futura casa compartida." },
            { id: 327, nivel: 'oro', texto: "Vale por pedirte un compromiso escrito con 3 metas de pareja claras para cumplir antes de nuestro próximo aniversario." },
            { id: 328, nivel: 'oro', texto: "Vale por pedirte una noche entera dedicada exclusivamente al disfrute y la reconexión íntima sin apuros ni horarios." },
            { id: 329, nivel: 'oro', texto: "Vale por pedirte que dediquemos una tarde del reencuentro a salir de compras juntos para lo que necesitemos." },
            { id: 330, nivel: 'oro', texto: "Vale por pedirte un \"Día sin Alarma ni Agenda\": levantarnos a la hora que sea y decidir los planes sobre la marcha." },
            { id: 331, nivel: 'oro', texto: "Vale por pedirte que me dediques unas palabras de agradecimiento cara a cara mirando a los ojos antes de nuestra cena de reencuentro." },
            { id: 332, nivel: 'oro', texto: "Vale por pedirte que visitemos un mercado gastronómico o feria artesanal local en la ciudad donde nos encontremos." },
            { id: 333, nivel: 'oro', texto: "Vale por pedirte un picnic al aire libre organizado por vos en un parque lindo de la ciudad." },
            { id: 334, nivel: 'oro', texto: "Vale por pedirte que tomemos una clase o taller relámpago juntos en persona (baile, cocina, alfarería, etc.)." },
            { id: 335, nivel: 'oro', texto: "Vale por pedirte que me cedas el control de la música en todos los traslados y viajes en auto de nuestra visita." },
            { id: 336, nivel: 'oro', texto: "Vale por pedirte que hagamos una caminata bajo la lluvia si el clima se presta durante nuestro encuentro." },
            { id: 337, nivel: 'oro', texto: "Vale por pedirte que me lleves a conocer tu rincón personal más especial o tranquilo de tu ciudad." },
            { id: 338, nivel: 'oro', texto: "Vale por pedirte que grabemos un video corto juntos hablando a nuestro \"yo del futuro\" para volver a verlo en un año." },
            { id: 339, nivel: 'oro', texto: "Vale por pedirte un abrazo de bienvenida sostenido de al menos 3 minutos penas nos volvamos a ver cara a cara." },
            { id: 340, nivel: 'oro', texto: "Vale por pedirte que organicemos una tarde de juegos de mesa o cartas en persona acompañados de café o vino." },
            { id: 341, nivel: 'oro', texto: "Vale por pedirte un \"Día de Mimos Absolutos\": ser vos quien tome la iniciativa de todo el contacto físico y cariños durante el día." },
            { id: 342, nivel: 'oro', texto: "Vale por pedirte que salgamos a caminar sin rumbo fijo por un barrio lindo al atardecer en nuestra estancia juntos." },
            { id: 343, nivel: 'oro', texto: "Vale por pedirte que cocines tu plato fuerte o especialidad para mí en la primera cena del reencuentro." },
            { id: 344, nivel: 'oro', texto: "Vale por pedirte que planifiquemos un viaje sorpresa donde uno de los dos elija el destino sin decírselo al otro hasta llegar." },
            { id: 345, nivel: 'oro', texto: "Vale por pedirte un momento a solas en la noche para leernos cartas escritas a mano el uno al otro." },
            { id: 346, nivel: 'oro', texto: "Vale por pedirte que probemos un restaurante de comida internacional o exótica que ninguno de los dos haya probado." },
            { id: 347, nivel: 'oro', texto: "Vale por pedirte que dediquemos un bloque de tiempo en el reencuentro a hacer una actividad física o caminata por la naturaleza." },
            { id: 348, nivel: 'oro', texto: "Vale por pedirte un día completo libre de cualquier conversación sobre obligaciones, trabajo o estrés externo." },
            { id: 349, nivel: 'oro', texto: "Vale por pedirte que me regales una foto enmarcada de un momento lindo nuestro para poner en mi mesa de noche." },
            { id: 350, nivel: 'oro', texto: "Vale por pedirte que reservemos una cena romántica en un lugar con vista panorámica de la ciudad que visitemos." },
            { id: 351, nivel: 'oro', texto: "Vale por pedirte una tarde entera de maratón de la saga de películas o serie favorita de ambos en la cama." },
            { id: 352, nivel: 'oro', texto: "Vale por pedirte que me hagas un peinado, lavado de pelo o masaje capilar relajante antes de ir a dormir." },
            { id: 353, nivel: 'oro', texto: "Vale por pedirte un recorrido por la noche de la ciudad para ver las luces y los monumentos principales." },
            { id: 354, nivel: 'oro', texto: "Vale por pedirte un compromiso explícito para resolver en persona cualquier tensión acumulada por la distancia." },
            { id: 355, nivel: 'oro', texto: "Vale por pedirte que preparemos juntos una merienda especial con pastelitos o cosas ricas hechas en casa." },
            { id: 356, nivel: 'oro', texto: "Vale por pedirte un \"Día de Rey/Reina\": ser atendid@ por el otro durante 24 horas en las cosas pequeñas de la casa." },
            { id: 357, nivel: 'oro', texto: "Vale por pedirte que compremos ropa o accesorios combinados o que hagan juego durante nuestras compras del viaje." },
            { id: 358, nivel: 'oro', texto: "Vale por pedirte un paseo en bicicleta o medio de transporte divertido por un parque o costanera." },
            { id: 359, nivel: 'oro', texto: "Vale por pedirte que me leas un cuento o capítulo de un libro en persona apoyando la cabeza en tu pecho." },
            { id: 360, nivel: 'oro', texto: "Vale por pedirte que elijas y compres las entradas para una exposición o museo especial que quieras que veamos juntos." },
            { id: 361, nivel: 'oro', texto: "Vale por pedirte una noche de tragos caseros o degustación de vinos preparados y servidos en la casa." },
            { id: 362, nivel: 'oro', texto: "Vale por pedirte un pacto escrito de 5 acuerdos que mantendremos vivos en la distancia hasta nuestro próximo reencuentro." },
            { id: 363, nivel: 'oro', texto: "Vale por pedirte que tengamos una sesión de fotos espontánea en la naturaleza durante nuestro viaje." },
            { id: 364, nivel: 'oro', texto: "Vale por pedirte un momento para renovar verbalmente nuestros compromisos de pareja mirando hacia el futuro juntos." },
            { id: 365, nivel: 'oro', texto: "Vale por pedirte una última despedida en el transporte llena de besos y con la promesa firme de que la próxima vez será para siempre." },
        ];
        function obtenerFechaHoyISO() {
            const d = new Date();
            const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), day = String(d.getDate()).padStart(2, '0');
            return `${y}-${m}-${day}`;
        }

                function abrirTicketInterno() {
            vibrar(15);
            const modal = document.getElementById('modal-ticket');
            modal.classList.remove('oculto');
            setTimeout(() => document.getElementById('ticket-tarjeta').classList.add('mostrar'), 60);

            const hoy = obtenerFechaHoyISO();
            const fechaGuardada = localStorage.getItem('ticketDiarioFecha');
            const idGuardado = localStorage.getItem('ticketDiarioId');

            if (fechaGuardada === hoy && idGuardado) {
                mostrarTicketRevelado(parseInt(idGuardado, 10), true);
            } else {
                mostrarSobreCerrado();
            }
        }

        function cerrarTicket() {
            const modal = document.getElementById('modal-ticket');
            document.getElementById('ticket-tarjeta').classList.remove('mostrar');
            setTimeout(() => modal.classList.add('oculto'), 300);
        }

        function mostrarSobreCerrado() {
            document.getElementById('ticket-vista-sobre').style.display = 'flex';
            document.getElementById('ticket-vista-revelado').style.display = 'none';
            document.getElementById('ticket-mensaje-repetido').style.display = 'none';
            document.getElementById('ticket-sobre-icono').classList.remove('abriendose');
            document.getElementById('ticket-tarjeta').classList.remove('nivel-bronce', 'nivel-plata', 'nivel-oro');
        }

        function mostrarTicketRevelado(id, yaEstabaAbierto) {
            const ticket = ticketsDiarios.find(t => t.id === id);
            if (!ticket) return;

            document.getElementById('ticket-vista-sobre').style.display = 'none';
            document.getElementById('ticket-vista-revelado').style.display = 'flex';
            document.getElementById('ticket-mensaje-repetido').style.display = yaEstabaAbierto ? 'block' : 'none';

            const tarjeta = document.getElementById('ticket-tarjeta');
            tarjeta.classList.remove('nivel-bronce', 'nivel-plata', 'nivel-oro');
            tarjeta.classList.add('nivel-' + ticket.nivel);

            const etiquetas = { bronce: '🥉 Nivel Bronce', plata: '🥈 Nivel Plata', oro: '🥇 Nivel Oro' };
            document.getElementById('ticket-nivel-etiqueta').innerText = etiquetas[ticket.nivel] || '';
            document.getElementById('ticket-texto').innerText = ticket.texto;

            window.ticketTextoActual = ticket.texto; // lo usan los botones de WhatsApp
        }

        function abrirSobreDelDia() {
            vibrar([15, 30, 15]);
            if (typeof reproducirAcordeMagico === 'function') reproducirAcordeMagico();

            const idElegido = Math.floor(Math.random() * ticketsDiarios.length) + 1; // 1..365, al azar
            const hoy = obtenerFechaHoyISO();
            localStorage.setItem('ticketDiarioFecha', hoy);
            localStorage.setItem('ticketDiarioId', String(idElegido));

            const sobre = document.getElementById('ticket-sobre-icono');
            sobre.classList.add('abriendose');
            setTimeout(() => {
                mostrarTicketRevelado(idElegido, false);
                registrarTicketEnHistorial(idElegido, hoy);
            }, 550);
        }

        // Guarda en Firestore qué ticket salió, quién lo abrió y qué día (si Firebase está activo)
        async function registrarTicketEnHistorial(id, fecha) {
            if (!window.db || typeof window.addDoc !== 'function') return;
            try {
                const ticket = ticketsDiarios.find(t => t.id === id);
                await window.addDoc(window.collection(window.db, "ticketsDiarios"), {
                    ticketId: id,
                    nivel: ticket ? ticket.nivel : null,
                    texto: ticket ? ticket.texto : null,
                    abiertoPor: miIdentidad || 'desconocido',
                    fecha: fecha,
                    timestamp: window.serverTimestamp()
                });
            } catch (e) { console.warn('No se pudo registrar el ticket en el historial:', e); }
        }

        function enviarTicketWhatsApp(destinatario) {
            vibrar(15);
            const numeros = { nico: "5493516575261", carito: "5491170131229" };
            const numero = numeros[destinatario];
            if (!numero || !window.ticketTextoActual) return;
            const url = `https://wa.me/${numero}?text=${encodeURIComponent(window.ticketTextoActual)}`;
            window.open(url, '_blank');
        }

        