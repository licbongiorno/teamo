// ==================== DECISIONES (motor de reflexión) ====================
// Este juego usa js/motor-reflexion.js — acá sólo va su configuración.
// Banco expandido a 101 consignas.
window.CONFIG_REFLEXION = window.CONFIG_REFLEXION || {};
window.CONFIG_REFLEXION['decisiones'] = {
    "tipo": "opciones",
    "desempatePorSorteo": true,
    "instrucciones": "Situaciones con varias opciones: ¿eligen lo mismo, o el azar decide?",
    "banco": [
        {
            "texto": "Tenemos una tarde libre. ¿Qué hacemos?",
            "opciones": [
                "Ver una peli",
                "Charla profunda",
                "Jugar algo online",
                "Salir a caminar"
            ]
        },
        {
            "texto": "Es viernes a la noche. ¿Plan ideal?",
            "opciones": [
                "Cena especial",
                "Noche de juegos",
                "Ver una serie",
                "Dormir temprano"
            ]
        },
        {
            "texto": "Tenemos $100 extra para gastar juntos. ¿En qué?",
            "opciones": [
                "Comida rica",
                "Algo para la casa",
                "Ahorrarlo",
                "Un gustito random"
            ]
        },
        {
            "texto": "Un domingo lluvioso. ¿Qué elegimos?",
            "opciones": [
                "Maratón de series",
                "Cocinar algo nuevo",
                "Leer cada uno lo suyo",
                "Llamada larga"
            ]
        },
        {
            "texto": "Si pudiéramos viajar este finde, ¿a dónde?",
            "opciones": [
                "Playa",
                "Montaña",
                "Ciudad grande",
                "Pueblo tranquilo"
            ]
        },
        {
            "texto": "Para el próximo regalo, ¿qué preferís?",
            "opciones": [
                "Algo material",
                "Una experiencia",
                "Una carta",
                "Tiempo juntos"
            ]
        },
        {
            "texto": "¿Qué tipo de peli elegimos hoy?",
            "opciones": [
                "Comedia",
                "Drama",
                "Terror",
                "Documental"
            ]
        },
        {
            "texto": "Si armamos una playlist juntos, ¿de qué género arranca?",
            "opciones": [
                "Pop",
                "Rock",
                "Reggaetón",
                "Baladas"
            ]
        },
        {
            "texto": "Para desayunar mañana (imaginario), ¿qué preferís?",
            "opciones": [
                "Dulce",
                "Salado",
                "Café solo",
                "Algo raro"
            ]
        },
        {
            "texto": "¿Qué mascota tendríamos si pudiéramos?",
            "opciones": [
                "Perro",
                "Gato",
                "Algo exótico",
                "Ninguna"
            ]
        },
        {
            "texto": "Si tuviéramos una hora libre ahora mismo, ¿qué hacemos?",
            "opciones": [
                "Hablar por videollamada",
                "Jugar algo de la web",
                "Mandarnos audios",
                "Cada uno lo suyo, en paralelo"
            ]
        },
        {
            "texto": "¿Cuál sería nuestro estilo de casa ideal?",
            "opciones": [
                "Moderna",
                "Rústica",
                "Minimalista",
                "Llena de cosas"
            ]
        },
        {
            "texto": "Para nuestro próximo reencuentro, ¿prioridad número uno?",
            "opciones": [
                "Comer rico",
                "Estar tranquilos",
                "Salir a explorar",
                "No hacer nada"
            ]
        },
        {
            "texto": "¿Qué tipo de sorpresa te gusta más recibir?",
            "opciones": [
                "Carta escrita",
                "Regalo físico",
                "Gesto inesperado",
                "Plan sorpresa"
            ]
        },
        {
            "texto": "Si discutimos, ¿qué preferís que pase después?",
            "opciones": [
                "Hablarlo enseguida",
                "Enfriar y después hablar",
                "Un abrazo primero",
                "Escribirlo por mensaje"
            ]
        },
        {
            "texto": "¿Qué tipo de música para una cita virtual?",
            "opciones": [
                "Instrumental",
                "Nuestras canciones",
                "Algo nuevo",
                "Silencio, sólo hablar"
            ]
        },
        {
            "texto": "Un año a partir de hoy, ¿qué priorizamos?",
            "opciones": [
                "Vernos más seguido",
                "Estabilidad económica",
                "Un plan de convivencia",
                "Disfrutar el presente"
            ]
        },
        {
            "texto": "¿Qué comida pedimos 'juntos' por delivery hoy?",
            "opciones": [
                "Pizza",
                "Sushi",
                "Comida casera",
                "Algo dulce"
            ]
        },
        {
            "texto": "Para el próximo mensaje de buenos días, ¿qué preferís?",
            "opciones": [
                "Un audio",
                "Una foto",
                "Un texto largo",
                "Un simple 'te amo'"
            ]
        },
        {
            "texto": "¿Qué actividad nueva probamos juntos algún día?",
            "opciones": [
                "Cocinar algo difícil",
                "Aprender un idioma",
                "Un deporte",
                "Un hobby creativo"
            ]
        },
        {
            "texto": "Si tuviéramos que elegir un color para 'nuestra' bandera, ¿cuál sería el estilo?",
            "opciones": [
                "Pasteles suaves",
                "Colores fuertes",
                "Blanco y negro",
                "Multicolor"
            ]
        },
        {
            "texto": "Para un cumpleaños ideal, ¿qué priorizás?",
            "opciones": [
                "Sorpresa total",
                "Plan pedido por mí",
                "Algo íntimo, sólo nosotros",
                "Festejo con más gente"
            ]
        },
        {
            "texto": "Si tuviéramos que aprender algo nuevo juntos este mes, ¿qué elegimos?",
            "opciones": [
                "Un idioma",
                "Una receta",
                "Un baile",
                "Un juego de mesa"
            ]
        },
        {
            "texto": "¿Qué tipo de vacaciones preferís?",
            "opciones": [
                "Todo planeado",
                "Improvisando sobre la marcha",
                "Relax total",
                "Aventura activa"
            ]
        },
        {
            "texto": "Para decorar 'nuestro' espacio virtual (fondo de pantalla, etc.), ¿qué elegimos?",
            "opciones": [
                "Una foto nuestra",
                "Algo de naturaleza",
                "Algo minimalista",
                "Algo con humor"
            ]
        },
        {
            "texto": "Si tuviéramos que elegir un hobby en común, ¿cuál sería?",
            "opciones": [
                "Cocinar",
                "Jugar videojuegos",
                "Leer y comentar libros",
                "Hacer ejercicio"
            ]
        },
        {
            "texto": "Para nuestra próxima llamada larga, ¿qué formato preferís?",
            "opciones": [
                "Charla libre",
                "Con un juego de preguntas",
                "Viendo algo juntos",
                "Simplemente acompañándonos en silencio"
            ]
        },
        {
            "texto": "¿Cómo preferís resolver quién elige el plan hoy?",
            "opciones": [
                "Se turnan",
                "Decide quien tuvo peor semana",
                "Lo deciden juntos siempre",
                "Cara o cruz"
            ]
        },
        {
            "texto": "Si tuviéramos que elegir una app nueva para usar juntos, ¿cuál tipo?",
            "opciones": [
                "De juegos",
                "De películas compartidas",
                "De organización de viajes",
                "De fotos compartidas"
            ]
        },
        {
            "texto": "Para el próximo aniversario, ¿qué formato preferís?",
            "opciones": [
                "Carta larga",
                "Videollamada especial",
                "Regalo sorpresa por correo",
                "Plan para cuando nos veamos"
            ]
        },
        {
            "texto": "¿Qué tipo de conversación preferís tener hoy?",
            "opciones": [
                "Liviana y divertida",
                "Profunda y reflexiva",
                "Práctica, de planificación",
                "De recuerdos"
            ]
        },
        {
            "texto": "Si tuviéramos que elegir un destino para una escapada de fin de semana, ¿qué tipo de lugar?",
            "opciones": [
                "Con playa",
                "Con naturaleza y trekking",
                "Ciudad con vida nocturna",
                "Pueblo tranquilo y chico"
            ]
        },
        {
            "texto": "Para el desayuno de nuestro primer día juntos (cuando se pueda), ¿qué elegimos?",
            "opciones": [
                "Algo elaborado",
                "Algo simple y rápido",
                "Salir a desayunar afuera",
                "Quedarnos en la cama sin desayunar"
            ]
        },
        {
            "texto": "¿Qué tipo de regalo sorpresa preferís hacer vos?",
            "opciones": [
                "Algo hecho a mano",
                "Algo comprado especial",
                "Una experiencia",
                "Una carta"
            ]
        },
        {
            "texto": "Si tuviéramos que elegir el nombre de una mascota imaginaria juntos, ¿qué estilo de nombre?",
            "opciones": [
                "Nombre humano gracioso",
                "Nombre en otro idioma",
                "Nombre relacionado a nosotros",
                "Nombre random"
            ]
        },
        {
            "texto": "Para una noche de películas, ¿qué tipo de final preferís?",
            "opciones": [
                "Final feliz",
                "Final que te hace pensar",
                "Final triste pero real",
                "Final con giro sorpresa"
            ]
        },
        {
            "texto": "¿Qué tipo de mensaje te gusta más recibir de sorpresa?",
            "opciones": [
                "Uno gracioso",
                "Uno romántico",
                "Uno reflexivo",
                "Uno con una foto"
            ]
        },
        {
            "texto": "Si tuviéramos que elegir un plan para 'no hacer nada' juntos, ¿cómo sería?",
            "opciones": [
                "Cada uno en lo suyo, en videollamada",
                "Charlando sin parar",
                "Viendo algo sin hablar mucho",
                "Durmiendo cada uno una siesta 'juntos'"
            ]
        },
        {
            "texto": "Para el clima ideal de nuestra próxima cita virtual, ¿qué elegís?",
            "opciones": [
                "Lluvia con mate",
                "Sol y ventana abierta",
                "Noche estrellada",
                "No importa el clima"
            ]
        },
        {
            "texto": "¿Qué tipo de juego preferís para una noche entre nosotros?",
            "opciones": [
                "De preguntas",
                "De estrategia",
                "De cartas",
                "De reflejos o rapidez"
            ]
        },
        {
            "texto": "Si tuviéramos que elegir cómo pasar un cumpleaños de alguno, a la distancia, ¿qué preferís?",
            "opciones": [
                "Videollamada todo el día",
                "Sorpresa por correo",
                "Carta especial",
                "Regalo virtual (juego, suscripción, etc.)"
            ]
        },
        {
            "texto": "Para nuestra próxima charla difícil, ¿qué formato preferís?",
            "opciones": [
                "Por videollamada",
                "Por mensajes de voz",
                "Por escrito, con calma",
                "Cara a cara cuando se pueda"
            ]
        },
        {
            "texto": "¿Qué tipo de comida nueva probamos la próxima vez que nos veamos?",
            "opciones": [
                "Algo exótico",
                "Algo típico del lugar",
                "Algo que ya conocemos y amamos",
                "Algo que cocinemos nosotros"
            ]
        },
        {
            "texto": "Si tuviéramos que elegir cómo celebrar un logro grande de alguno, ¿qué preferís?",
            "opciones": [
                "Fiesta con amigos",
                "Festejo íntimo los dos",
                "Un regalo especial",
                "Un mensaje muy sentido"
            ]
        },
        {
            "texto": "Para nuestra próxima 'cita' virtual, ¿qué actividad elegimos?",
            "opciones": [
                "Cocinar lo mismo en simultáneo",
                "Ver la misma peli a la vez",
                "Jugar un juego online",
                "Simplemente charlar con una copa de algo"
            ]
        },
        {
            "texto": "¿Qué tipo de sorpresa preferís para un mal día?",
            "opciones": [
                "Un meme o video gracioso",
                "Un audio largo de aliento",
                "Un regalo por delivery",
                "Que te escuchen sin dar consejos"
            ]
        },
        {
            "texto": "Si tuviéramos que elegir el próximo idioma para aprender juntos, ¿cuál tipo?",
            "opciones": [
                "Uno útil para viajar",
                "El del país del otro",
                "Uno random por diversión",
                "Ninguno, con el español alcanza"
            ]
        },
        {
            "texto": "Para nuestra próxima meta como pareja, ¿qué priorizamos?",
            "opciones": [
                "Ahorrar para vernos más seguido",
                "Planificar la convivencia",
                "Mejorar la comunicación",
                "Simplemente disfrutar más el presente"
            ]
        },
        {
            "texto": "¿Qué tipo de despedida preferís cuando termina una videollamada?",
            "opciones": [
                "Rápida, sin hacerla larga",
                "Larga, cuesta cortar",
                "Con una frase especial siempre",
                "Depende del día"
            ]
        },
        {
            "texto": "Si tuviéramos que elegir el tono de nuestra próxima pelea (si la hay), ¿cuál preferís?",
            "opciones": [
                "Calmado desde el principio",
                "Intenso pero corto",
                "Con humor para bajar la tensión",
                "Directo, sin vueltas"
            ]
        },
        {
            "texto": "Para el próximo regalo random sin motivo, ¿qué elegís?",
            "opciones": [
                "Algo dulce",
                "Algo para leer",
                "Algo para escuchar (música, podcast)",
                "Algo para usar todos los días"
            ]
        },
        {
            "texto": "¿Qué tipo de foto preferís mandar hoy?",
            "opciones": [
                "Una selfie tal cual estás",
                "Algo de tu entorno",
                "Una vieja, con historia",
                "Una graciosa"
            ]
        },
        {
            "texto": "Si tuviéramos que elegir el próximo lugar para 'visitar' por videollamada (mostrando cámara), ¿cuál?",
            "opciones": [
                "Tu barrio",
                "Un lugar nuevo que descubriste",
                "Tu lugar favorito de siempre",
                "Tu cuarto, tal cual está"
            ]
        },
        {
            "texto": "Para el próximo domingo, ¿qué actividad conjunta preferís?",
            "opciones": [
                "Cocinar el mismo plato",
                "Hacer ejercicio 'juntos' por videollamada",
                "Leer el mismo libro por capítulos",
                "No hacer nada en particular, sólo estar"
            ]
        },
        {
            "texto": "¿Qué tipo de charla preferís para bajar el estrés de la semana?",
            "opciones": [
                "Hablar de planes futuros",
                "Hablar de anécdotas graciosas",
                "Simplemente contar cómo estuvo el día",
                "Charla random sin rumbo"
            ]
        },
        {
            "texto": "Si tuviéramos que armar una lista de reproducción para 'nuestros' viajes, ¿qué estilo?",
            "opciones": [
                "Canciones que nos gustan a los dos",
                "Canciones que cada uno recomienda al otro",
                "Instrumental para relajar",
                "Lo que suene, sin filtro"
            ]
        },
        {
            "texto": "Para nuestra próxima charla sobre el futuro, ¿qué tema priorizamos?",
            "opciones": [
                "Dónde vivir",
                "Cuándo vernos de nuevo",
                "Planes de convivencia",
                "Metas personales de cada uno"
            ]
        },
        {
            "texto": "¿Qué tipo de gesto preferís para un 'te extraño' random?",
            "opciones": [
                "Un mensaje de texto simple",
                "Un audio",
                "Una foto vieja nuestra",
                "Una videollamada sorpresa"
            ]
        },
        {
            "texto": "Si tuviéramos que elegir el próximo reto o desafío juntos, ¿cuál tipo?",
            "opciones": [
                "Físico (ejercicio, caminata)",
                "Creativo (arte, escritura)",
                "Mental (aprender algo)",
                "Emocional (hablar de algo pendiente)"
            ]
        },
        {
            "texto": "Para una noche de nostalgia, ¿qué preferís revisar juntos?",
            "opciones": [
                "Fotos viejas nuestras",
                "Mensajes viejos",
                "Canciones de una época",
                "Videos viejos"
            ]
        },
        {
            "texto": "¿Qué tipo de plan preferís para bajar la ansiedad antes de un reencuentro?",
            "opciones": [
                "Hacer una lista de todo lo que van a hacer",
                "No planear nada, dejarse llevar",
                "Hablar de cómo se sienten con la espera",
                "Distraerse con otra cosa hasta que llegue el día"
            ]
        },
        {
            "texto": "Si tuviéramos que elegir un 'ritual' semanal fijo, ¿cuál preferís?",
            "opciones": [
                "Una videollamada larga los domingos",
                "Mandarse un resumen de la semana los viernes",
                "Ver algo juntos un día fijo",
                "Un mensaje de gratitud una vez por semana"
            ]
        },
        {
            "texto": "Para el próximo gesto romántico sorpresa, ¿qué elegís?",
            "opciones": [
                "Escribir una carta",
                "Mandar flores o algo físico",
                "Organizar algo para cuando se vean",
                "Grabar un video especial"
            ]
        },
        {
            "texto": "¿Qué tipo de comida 'de la casa de cada uno' te gustaría que probemos algún día?",
            "opciones": [
                "Un plato típico familiar",
                "Algo que cocina tu mamá/papá",
                "Tu comida reconfortante favorita",
                "Algo random del freezer"
            ]
        },
        {
            "texto": "Si tuviéramos que elegir el próximo tema tabú para hablar sin filtro, ¿cuál?",
            "opciones": [
                "Plata y finanzas",
                "Ex parejas",
                "Miedos sobre el futuro",
                "Diferencias culturales"
            ]
        },
        {
            "texto": "Para nuestra próxima charla sobre expectativas, ¿qué priorizamos?",
            "opciones": [
                "Qué esperamos del otro en el día a día",
                "Qué esperamos a largo plazo",
                "Qué NO esperamos, para aclarar límites",
                "Cómo nos gusta que nos traten en un mal día"
            ]
        },
        {
            "texto": "¿Qué tipo de 'cita' de bajo presupuesto preferís?",
            "opciones": [
                "Picnic virtual (cada uno en su casa)",
                "Ver el atardecer por videollamada",
                "Cocinar algo barato juntos",
                "Simplemente charlar largo y tendido"
            ]
        },
        {
            "texto": "Si tuviéramos que elegir un mote o apodo cariñoso nuevo, ¿de qué estilo?",
            "opciones": [
                "Basado en un chiste interno",
                "Tierno y clásico",
                "Random y gracioso",
                "Relacionado a un recuerdo"
            ]
        },
        {
            "texto": "Para un desayuno sorpresa (aunque sea virtual), ¿qué elegís mandar?",
            "opciones": [
                "Foto de algo rico que cocinaste",
                "Un vale para 'invitar el café' cuando se vean",
                "Un mensaje con la receta de algo tuyo",
                "Nada, sólo un buenos días especial"
            ]
        },
        {
            "texto": "¿Qué tipo de reto de superación elegimos para este mes?",
            "opciones": [
                "Hacer ejercicio 3 veces por semana",
                "Leer un libro cada uno y comentarlo",
                "No pelear por temas viejos ya hablados",
                "Escribirse algo lindo todos los días"
            ]
        },
        {
            "texto": "Si tuviéramos que armar el itinerario de un viaje soñado juntos, ¿qué priorizamos primero?",
            "opciones": [
                "Elegir el destino",
                "Elegir el presupuesto",
                "Elegir las fechas",
                "Elegir con quién más iríamos (si con alguien)"
            ]
        },
        {
            "texto": "Para una tarde de autocuidado 'compartido' a la distancia, ¿qué elegimos hacer cada uno?",
            "opciones": [
                "Un baño relajante",
                "Ejercicio o caminata",
                "Ver algo liviano",
                "Escribir en un diario"
            ]
        },
        {
            "texto": "¿Qué tipo de juego de mesa (aunque sea virtual) preferís?",
            "opciones": [
                "Uno de estrategia",
                "Uno de trivia",
                "Uno de palabras",
                "Uno de azar y suerte"
            ]
        },
        {
            "texto": "Si tuviéramos que definir un lema para nosotros como pareja, ¿de qué estilo sería?",
            "opciones": [
                "Gracioso",
                "Romántico",
                "Motivacional",
                "Simple y directo"
            ]
        },
        {
            "texto": "Para el próximo aniversario mensual (si lo festejan), ¿qué formato preferís?",
            "opciones": [
                "Carta o mensaje especial",
                "Videollamada con brindis",
                "Repasar fotos del mes",
                "Simplemente decir gracias por el mes"
            ]
        },
        {
            "texto": "¿Qué tipo de plan proponés para cuando uno tenga un examen o entrega importante?",
            "opciones": [
                "Acompañar en silencio mientras estudia/trabaja",
                "Motivar con mensajes cada tanto",
                "No molestar hasta que termine",
                "Festejar apenas termine, sin importar el resultado"
            ]
        },
        {
            "texto": "Si tuviéramos que elegir un nuevo canal para comunicarnos además del chat, ¿cuál?",
            "opciones": [
                "Notas de voz más largas",
                "Videollamadas más cortas y seguidas",
                "Cartas escritas a mano",
                "Un diario compartido online"
            ]
        },
        {
            "texto": "Para acompañar un café/mate virtual, ¿qué elegís?",
            "opciones": [
                "Algo dulce",
                "Algo salado",
                "Nada, sólo la bebida",
                "Depende del día"
            ]
        },
        {
            "texto": "¿Qué tipo de fondo de pantalla compartido elegimos?",
            "opciones": [
                "Una foto nuestra",
                "Un paisaje",
                "Algo con frase",
                "Algo random y gracioso"
            ]
        },
        {
            "texto": "Si tuviéramos que elegir el próximo desafío de cocina, ¿cuál?",
            "opciones": [
                "Un postre difícil",
                "Un plato salado nuevo",
                "Comida de otro país",
                "Algo saludable"
            ]
        },
        {
            "texto": "Para la próxima charla sobre nuestras familias, ¿qué priorizamos?",
            "opciones": [
                "Contar cómo son un poco más",
                "Planear una presentación futura",
                "Hablar de diferencias culturales",
                "Simplemente compartir anécdotas"
            ]
        },
        {
            "texto": "¿Qué tipo de ejercicio 'juntos' (aunque sea a la distancia) preferís?",
            "opciones": [
                "Yoga o estiramiento",
                "Caminata mientras hablan por teléfono",
                "Rutina de fuerza cada uno en su casa",
                "Bailar algo random"
            ]
        },
        {
            "texto": "Si tuviéramos que elegir un tema para investigar juntos, ¿cuál?",
            "opciones": [
                "Historia de algún lugar",
                "Curiosidades de ciencia",
                "Algo de psicología o relaciones",
                "Algo totalmente random"
            ]
        },
        {
            "texto": "Para la próxima vez que estén tristes, ¿qué prefieren que haga el otro primero?",
            "opciones": [
                "Preguntar qué pasó",
                "Simplemente decir 'estoy acá'",
                "Mandar algo que los haga reír",
                "Dejar espacio y esperar a que hablen"
            ]
        },
        {
            "texto": "¿Qué tipo de plan proponés para un cumpleaños del otro que no pueden pasar juntos?",
            "opciones": [
                "Organizar algo con sus amigos de allá",
                "Mandar regalos escalonados durante el día",
                "Videollamada a la medianoche",
                "Una sorpresa que dure toda la semana"
            ]
        },
        {
            "texto": "Si tuvieran que elegir una palabra clave para cuando alguien necesita espacio, ¿de qué tipo sería?",
            "opciones": [
                "Algo gracioso e inventado",
                "Una palabra simple y directa",
                "Un emoji específico",
                "No hace falta palabra clave, se habla directo"
            ]
        },
        {
            "texto": "Para el próximo 'experimento' de pareja (algo nuevo para probar), ¿qué eligen?",
            "opciones": [
                "Escribirse cartas por una semana",
                "No usar el celular una hora antes de dormir, cada uno",
                "Aprender algo nuevo juntos",
                "Un día sin quejarse de nada"
            ]
        },
        {
            "texto": "¿Qué tipo de comida reconfortante mandarías si pudieras, en un mal día?",
            "opciones": [
                "Algo casero",
                "Comida rápida",
                "Algo dulce",
                "Lo que más le guste, sin dudar"
            ]
        },
        {
            "texto": "Si tuvieran que elegir el próximo lugar 'virtual' para pasear (Google Street View, etc.), ¿cuál?",
            "opciones": [
                "Una ciudad que quieren visitar juntos",
                "El barrio de la infancia de alguno",
                "Un lugar random del mundo",
                "Su futura casa imaginaria"
            ]
        },
        {
            "texto": "Para la próxima charla sobre el pasado, ¿qué prefieren explorar?",
            "opciones": [
                "Cómo eran de chicos",
                "Relaciones anteriores, con honestidad",
                "Momentos difíciles que los formaron",
                "Anécdotas graciosas de la familia"
            ]
        },
        {
            "texto": "¿Qué tipo de plan eligen para 'festejar' que sobrevivieron una semana difícil?",
            "opciones": [
                "Pedir algo rico para cada uno",
                "Una videollamada larga sin agenda",
                "Escribirse algo lindo",
                "Simplemente descansar, cada uno por su lado"
            ]
        },
        {
            "texto": "Si tuvieran que elegir cómo avisar que están de mal humor, ¿qué prefieren?",
            "opciones": [
                "Decirlo directo apenas pasa",
                "Un código simple (emoji, palabra)",
                "Dejar que el otro lo note solo",
                "Escribirlo cuando ya se calmaron"
            ]
        },
        {
            "texto": "Para su próxima 'noche de cine' virtual, ¿qué género eligen?",
            "opciones": [
                "Comedia romántica",
                "Ciencia ficción",
                "Thriller o suspenso",
                "Animación"
            ]
        },
        {
            "texto": "¿Qué tipo de regalo 'de la nada' preferís recibir?",
            "opciones": [
                "Algo para comer",
                "Algo para leer",
                "Algo para decorar",
                "Una experiencia para cuando se vean"
            ]
        },
        {
            "texto": "Si tuvieran que definir el próximo objetivo de ahorro en pareja, ¿cuál priorizan?",
            "opciones": [
                "El próximo pasaje para verse",
                "Un fondo para la futura convivencia",
                "Algo especial para regalarse",
                "Ahorrar sin un objetivo específico todavía"
            ]
        },
        {
            "texto": "Para la próxima charla incómoda que vienen postergando, ¿qué prefieren?",
            "opciones": [
                "Sacarla ya, cuanto antes",
                "Esperar un buen momento, pero pronto",
                "Escribirla primero para ordenar ideas",
                "Pedir ayuda externa para encararla (terapia, amigos)"
            ]
        },
        {
            "texto": "¿Qué tipo de sorpresa audiovisual preferís mandar (video, audio, foto en movimiento)?",
            "opciones": [
                "Un video cantando o bailando",
                "Un audio leyendo algo",
                "Un boomerang o gif gracioso",
                "Una videollamada sorpresa sin avisar"
            ]
        },
        {
            "texto": "Si tuvieran que elegir un nuevo lugar de 'encuentro' online (además del chat de siempre), ¿cuál?",
            "opciones": [
                "Un juego online juntos",
                "Una app de notas compartidas",
                "Un tablero de ideas (Pinterest, etc.)",
                "Nada nuevo, con lo que tienen alcanza"
            ]
        },
        {
            "texto": "Para la próxima charla sobre sueños personales (no de pareja), ¿qué priorizan?",
            "opciones": [
                "Metas profesionales",
                "Metas de viaje",
                "Metas creativas o artísticas",
                "Metas de bienestar personal"
            ]
        },
        {
            "texto": "¿Qué tipo de plan eligen si uno se siente inseguro de la relación por un día?",
            "opciones": [
                "Hablarlo enseguida y sin drama",
                "Dar reafirmación con gestos concretos",
                "Escuchar sin necesitar 'arreglarlo' ya",
                "Recordarle todo lo que construyeron juntos"
            ]
        },
        {
            "texto": "Si tuvieran que elegir el próximo hito para festejar juntos, ¿cuál sería?",
            "opciones": [
                "Un mes más de relación",
                "Un logro personal de alguno",
                "El día que se vean de nuevo",
                "Cualquier excusa, no hace falta un hito"
            ]
        }
    ]
};
