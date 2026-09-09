// ==================== ADN DE LA PAREJA ====================
const DIMENSIONES_ADN = {
    conexion: { icono: '❤️', nombre: 'Conexión' },
    comprension: { icono: '🧠', nombre: 'Comprensión' },
    diversion: { icono: '😂', nombre: 'Diversión' },
    quimica: { icono: '🔥', nombre: 'Química' },
    aventura: { icono: '🌎', nombre: 'Aventura' },
    estabilidad: { icono: '🏡', nombre: 'Estabilidad' },
    profundidad: { icono: '💭', nombre: 'Profundidad' },
};
const PREGUNTAS_ADN = [
    {
        "texto": "¿Qué buscás más en un momento juntos?",
        "opciones": [
            [
                "Explicarnos con paciencia",
                "comprension"
            ],
            [
                "Imitarnos el uno al otro",
                "diversion"
            ],
            [
                "Romper la rutina de golpe",
                "aventura"
            ]
        ]
    },
    {
        "texto": "Si tuvieran una tarde libre, ¿qué prevalece?",
        "opciones": [
            [
                "Sentir que encajamos",
                "conexion"
            ],
            [
                "La seguridad de lo constante",
                "estabilidad"
            ],
            [
                "La atracción del primer día, intacta",
                "quimica"
            ]
        ]
    },
    {
        "texto": "En una charla larga, ¿qué es lo que más valorás?",
        "opciones": [
            [
                "Buscar memes para mandarnos",
                "diversion"
            ],
            [
                "Reflexionar juntos sobre la vida",
                "profundidad"
            ],
            [
                "Explicarnos con paciencia",
                "comprension"
            ]
        ]
    },
    {
        "texto": "Si hoy tuvieran que elegir una sola cosa para sentir, ¿cuál sería?",
        "opciones": [
            [
                "Saber que puedo contar con vos siempre",
                "estabilidad"
            ],
            [
                "Vivir algo fuera del plan",
                "aventura"
            ],
            [
                "Sentirnos cerca",
                "conexion"
            ]
        ]
    },
    {
        "texto": "¿Qué te hace sentir más conectado/a hoy?",
        "opciones": [
            [
                "Bucear en lo que sentimos de verdad",
                "profundidad"
            ],
            [
                "Sentir el corazón acelerado al verlo/la",
                "quimica"
            ],
            [
                "Buscar memes para mandarnos",
                "diversion"
            ]
        ]
    },
    {
        "texto": "En un reencuentro, ¿qué es lo primero que buscás?",
        "opciones": [
            [
                "Tirarnos a la pileta sin pensarlo",
                "aventura"
            ],
            [
                "Explicarnos con paciencia",
                "comprension"
            ],
            [
                "La certeza de que esto no se derrumba",
                "estabilidad"
            ]
        ]
    },
    {
        "texto": "¿Qué extrañás más cuando no estamos juntos?",
        "opciones": [
            [
                "Esa chispa que no se explica",
                "quimica"
            ],
            [
                "El silencio cómodo entre los dos",
                "conexion"
            ],
            [
                "Una charla que nos hace pensar",
                "profundidad"
            ]
        ]
    },
    {
        "texto": "Si esta relación fuera un ingrediente principal, ¿cuál sería?",
        "opciones": [
            [
                "Hablar hasta entendernos del todo",
                "comprension"
            ],
            [
                "Reírnos sin parar",
                "diversion"
            ],
            [
                "Probar algo que da un poco de miedo",
                "aventura"
            ]
        ]
    },
    {
        "texto": "¿Qué necesitás más en un mal día?",
        "opciones": [
            [
                "Sentir que somos uno solo",
                "conexion"
            ],
            [
                "La certeza de que esto no se derrumba",
                "estabilidad"
            ],
            [
                "Esa chispa que no se explica",
                "quimica"
            ]
        ]
    },
    {
        "texto": "Al pensar en 'nosotros', ¿qué palabra pesa más?",
        "opciones": [
            [
                "Buscar memes para mandarnos",
                "diversion"
            ],
            [
                "Una conversación que nos deja pensando días",
                "profundidad"
            ],
            [
                "Validar lo que el otro siente",
                "comprension"
            ]
        ]
    },
    {
        "texto": "¿Qué te da más ganas de seguir eligiendo esta relación?",
        "opciones": [
            [
                "La certeza de que esto no se derrumba",
                "estabilidad"
            ],
            [
                "Probar algo que da un poco de miedo",
                "aventura"
            ],
            [
                "El silencio cómodo entre los dos",
                "conexion"
            ]
        ]
    },
    {
        "texto": "En una noche cualquiera, ¿qué buscás más?",
        "opciones": [
            [
                "Compartir algo que no le contamos a nadie más",
                "profundidad"
            ],
            [
                "Esa mirada que dice todo",
                "quimica"
            ],
            [
                "Buscar memes para mandarnos",
                "diversion"
            ]
        ]
    },
    {
        "texto": "¿Qué te hace sentir que esto vale la pena?",
        "opciones": [
            [
                "Hacer algo nuevo y arriesgado",
                "aventura"
            ],
            [
                "Escuchar sin juzgar",
                "comprension"
            ],
            [
                "Confiar en que mañana seguimos igual",
                "estabilidad"
            ]
        ]
    },
    {
        "texto": "Si tuvieras que resumir el último mes, ¿qué prevalece?",
        "opciones": [
            [
                "Esa mirada que dice todo",
                "quimica"
            ],
            [
                "La sensación de 'te entiendo sin hablar'",
                "conexion"
            ],
            [
                "Filosofar sobre nosotros",
                "profundidad"
            ]
        ]
    },
    {
        "texto": "¿Qué es lo que más disfrutás de estar en pareja?",
        "opciones": [
            [
                "Escuchar sin juzgar",
                "comprension"
            ],
            [
                "Bailar mal a propósito",
                "diversion"
            ],
            [
                "Explorar un lugar desconocido",
                "aventura"
            ]
        ]
    },
    {
        "texto": "En una crisis, ¿qué necesitás más del otro?",
        "opciones": [
            [
                "Sentir que somos uno solo",
                "conexion"
            ],
            [
                "El hogar que armamos entre los dos",
                "estabilidad"
            ],
            [
                "Esa mirada que dice todo",
                "quimica"
            ]
        ]
    },
    {
        "texto": "¿Qué te emociona más pensar del futuro juntos?",
        "opciones": [
            [
                "Reírnos sin parar",
                "diversion"
            ],
            [
                "Una charla que nos hace pensar",
                "profundidad"
            ],
            [
                "Repetir con otras palabras hasta entender",
                "comprension"
            ]
        ]
    },
    {
        "texto": "Si hoy definieras el 'núcleo' de esta relación, ¿cuál sería?",
        "opciones": [
            [
                "Saber que puedo contar con vos siempre",
                "estabilidad"
            ],
            [
                "Animarnos a lo impredecible",
                "aventura"
            ],
            [
                "Mirarnos a los ojos un rato",
                "conexion"
            ]
        ]
    },
    {
        "texto": "¿Qué buscás más cuando hablamos por videollamada?",
        "opciones": [
            [
                "Reflexionar juntos sobre la vida",
                "profundidad"
            ],
            [
                "Sentir el corazón acelerado al verlo/la",
                "quimica"
            ],
            [
                "Hacer alguna tontería juntos",
                "diversion"
            ]
        ]
    },
    {
        "texto": "¿Qué es lo que más te sostiene en los días difíciles?",
        "opciones": [
            [
                "Hacer algo nuevo y arriesgado",
                "aventura"
            ],
            [
                "Hablar hasta entendernos del todo",
                "comprension"
            ],
            [
                "Un plan tranquilo y predecible",
                "estabilidad"
            ]
        ]
    },
    {
        "texto": "Si tuvieras que elegir el ingrediente secreto de esta relación, ¿cuál es?",
        "opciones": [
            [
                "El deseo de estar cerca físicamente",
                "quimica"
            ],
            [
                "Sentirnos cerca",
                "conexion"
            ],
            [
                "Buscar el sentido de las cosas juntos",
                "profundidad"
            ]
        ]
    },
    {
        "texto": "¿Qué necesitás sentir más seguido?",
        "opciones": [
            [
                "Preguntar en vez de asumir",
                "comprension"
            ],
            [
                "Hacer una competencia tonta",
                "diversion"
            ],
            [
                "Animarnos a lo impredecible",
                "aventura"
            ]
        ]
    },
    {
        "texto": "En una charla nocturna, ¿qué priorizás?",
        "opciones": [
            [
                "Mirarnos a los ojos un rato",
                "conexion"
            ],
            [
                "La certeza de que esto no se derrumba",
                "estabilidad"
            ],
            [
                "El deseo de estar cerca físicamente",
                "quimica"
            ]
        ]
    },
    {
        "texto": "¿Qué es lo que más buscás de un abrazo (real o virtual)?",
        "opciones": [
            [
                "Bailar mal a propósito",
                "diversion"
            ],
            [
                "Una conversación que nos deja pensando días",
                "profundidad"
            ],
            [
                "Escuchar sin juzgar",
                "comprension"
            ]
        ]
    },
    {
        "texto": "¿Qué buscás más al planear el próximo encuentro?",
        "opciones": [
            [
                "Sentir que esto no se mueve",
                "estabilidad"
            ],
            [
                "Explorar un lugar desconocido",
                "aventura"
            ],
            [
                "Sentirnos cerca",
                "conexion"
            ]
        ]
    },
    {
        "texto": "¿Qué es lo que más valorás de cómo nos llevamos?",
        "opciones": [
            [
                "Hablar de miedos y sueños",
                "profundidad"
            ],
            [
                "La atracción del primer día, intacta",
                "quimica"
            ],
            [
                "Un chiste interno que sólo entendemos nosotros",
                "diversion"
            ]
        ]
    },
    {
        "texto": "Si pudieras elegir una sola sensación para hoy, ¿cuál sería?",
        "opciones": [
            [
                "Probar algo que da un poco de miedo",
                "aventura"
            ],
            [
                "Escuchar sin juzgar",
                "comprension"
            ],
            [
                "Una rutina que nos hace bien",
                "estabilidad"
            ]
        ]
    },
    {
        "texto": "¿Qué te da más ganas de seguir construyendo esto?",
        "opciones": [
            [
                "Esa chispa que no se explica",
                "quimica"
            ],
            [
                "Sentirnos parte del mismo equipo",
                "conexion"
            ],
            [
                "Buscar el sentido de las cosas juntos",
                "profundidad"
            ]
        ]
    },
    {
        "texto": "¿Qué necesitás sentir apenas nos vemos de nuevo?",
        "opciones": [
            [
                "Explicarnos con paciencia",
                "comprension"
            ],
            [
                "Imitarnos el uno al otro",
                "diversion"
            ],
            [
                "Probar algo que da un poco de miedo",
                "aventura"
            ]
        ]
    },
    {
        "texto": "¿Qué es lo que más te atrae de esta relación hoy?",
        "opciones": [
            [
                "Sentirnos parte del mismo equipo",
                "conexion"
            ],
            [
                "El hogar que armamos entre los dos",
                "estabilidad"
            ],
            [
                "El deseo de estar cerca físicamente",
                "quimica"
            ]
        ]
    },
    {
        "texto": "Al recordar un buen momento juntos, ¿qué destaca más?",
        "opciones": [
            [
                "Un chiste interno que sólo entendemos nosotros",
                "diversion"
            ],
            [
                "Hablar de miedos y sueños",
                "profundidad"
            ],
            [
                "Preguntar en vez de asumir",
                "comprension"
            ]
        ]
    },
    {
        "texto": "¿Qué buscás más cuando estás triste y hablamos?",
        "opciones": [
            [
                "Saber que puedo contar con vos siempre",
                "estabilidad"
            ],
            [
                "Animarnos a lo impredecible",
                "aventura"
            ],
            [
                "La sensación de 'te entiendo sin hablar'",
                "conexion"
            ]
        ]
    },
    {
        "texto": "¿Qué te hace confiar más en que esto va a funcionar?",
        "opciones": [
            [
                "Compartir algo que no le contamos a nadie más",
                "profundidad"
            ],
            [
                "Esa chispa que no se explica",
                "quimica"
            ],
            [
                "Bailar mal a propósito",
                "diversion"
            ]
        ]
    },
    {
        "texto": "Si tuvieras que elegir qué cultivar más este mes, ¿qué sería?",
        "opciones": [
            [
                "Tirarnos a la pileta sin pensarlo",
                "aventura"
            ],
            [
                "Aclarar todo antes de dormir",
                "comprension"
            ],
            [
                "Una rutina que nos hace bien",
                "estabilidad"
            ]
        ]
    },
    {
        "texto": "¿Qué es lo que más te llena de esta relación hoy?",
        "opciones": [
            [
                "El deseo de estar cerca físicamente",
                "quimica"
            ],
            [
                "Un abrazo largo",
                "conexion"
            ],
            [
                "Hablar de miedos y sueños",
                "profundidad"
            ]
        ]
    },
    {
        "texto": "¿Qué necesitás sentir para saber que vamos bien?",
        "opciones": [
            [
                "Repetir con otras palabras hasta entender",
                "comprension"
            ],
            [
                "Reírnos de nuestros propios errores",
                "diversion"
            ],
            [
                "Planear un viaje improvisado",
                "aventura"
            ]
        ]
    },
    {
        "texto": "¿Qué buscás más en un mensaje de buenos días?",
        "opciones": [
            [
                "Sentirnos cerca",
                "conexion"
            ],
            [
                "La seguridad de lo constante",
                "estabilidad"
            ],
            [
                "El deseo de estar cerca físicamente",
                "quimica"
            ]
        ]
    },
    {
        "texto": "¿Qué es lo que más te emociona de imaginarnos juntos en el futuro?",
        "opciones": [
            [
                "Buscar memes para mandarnos",
                "diversion"
            ],
            [
                "Reflexionar juntos sobre la vida",
                "profundidad"
            ],
            [
                "Hablar hasta entendernos del todo",
                "comprension"
            ]
        ]
    },
    {
        "texto": "¿Qué necesitás para sentir que la distancia no nos afecta?",
        "opciones": [
            [
                "La certeza de que esto no se derrumba",
                "estabilidad"
            ],
            [
                "Explorar un lugar desconocido",
                "aventura"
            ],
            [
                "Estar en la misma sintonía",
                "conexion"
            ]
        ]
    },
    {
        "texto": "¿Qué es lo que más rescatás de esta última semana juntos?",
        "opciones": [
            [
                "Hablar de miedos y sueños",
                "profundidad"
            ],
            [
                "La atracción del primer día, intacta",
                "quimica"
            ],
            [
                "Hacer alguna tontería juntos",
                "diversion"
            ]
        ]
    },
    {
        "texto": "Si esta relación tuviera un 'plato fuerte', ¿cuál sería?",
        "opciones": [
            [
                "Planear un viaje improvisado",
                "aventura"
            ],
            [
                "Ponernos en el lugar del otro",
                "comprension"
            ],
            [
                "La certeza de que esto no se derrumba",
                "estabilidad"
            ]
        ]
    },
    {
        "texto": "¿Qué buscás más al despertarte y pensar en mí?",
        "opciones": [
            [
                "El deseo de estar cerca físicamente",
                "quimica"
            ],
            [
                "Sentirnos cerca",
                "conexion"
            ],
            [
                "Bucear en lo que sentimos de verdad",
                "profundidad"
            ]
        ]
    },
    {
        "texto": "¿Qué necesitás sentir para dormir tranquilo/a?",
        "opciones": [
            [
                "Entender el porqué, no sólo el qué",
                "comprension"
            ],
            [
                "Contar anécdotas graciosas",
                "diversion"
            ],
            [
                "Tirarnos a la pileta sin pensarlo",
                "aventura"
            ]
        ]
    },
    {
        "texto": "¿Qué es lo que más te gustaría cultivar más en nosotros?",
        "opciones": [
            [
                "Sentirnos parte del mismo equipo",
                "conexion"
            ],
            [
                "La seguridad de lo constante",
                "estabilidad"
            ],
            [
                "Esa conexión física que no se apaga",
                "quimica"
            ]
        ]
    },
    {
        "texto": "¿Qué buscás más en una charla sobre el futuro?",
        "opciones": [
            [
                "Buscar memes para mandarnos",
                "diversion"
            ],
            [
                "Bucear en lo que sentimos de verdad",
                "profundidad"
            ],
            [
                "Explicarnos con paciencia",
                "comprension"
            ]
        ]
    },
    {
        "texto": "¿Qué te hace sentir que esta relación es única?",
        "opciones": [
            [
                "Construir algo sólido, de a poco",
                "estabilidad"
            ],
            [
                "Salir de la zona de confort juntos",
                "aventura"
            ],
            [
                "Un abrazo largo",
                "conexion"
            ]
        ]
    },
    {
        "texto": "Si tuvieras que elegir un solo motivo para seguir, ¿cuál sería?",
        "opciones": [
            [
                "Reflexionar juntos sobre la vida",
                "profundidad"
            ],
            [
                "El deseo de estar cerca físicamente",
                "quimica"
            ],
            [
                "Reírnos de nuestros propios errores",
                "diversion"
            ]
        ]
    },
    {
        "texto": "¿Qué necesitás sentir en un día común, sin nada especial?",
        "opciones": [
            [
                "Probar algo que da un poco de miedo",
                "aventura"
            ],
            [
                "Ponernos en el lugar del otro",
                "comprension"
            ],
            [
                "La seguridad de lo constante",
                "estabilidad"
            ]
        ]
    },
    {
        "texto": "¿Qué es lo que más rescatás de cómo resolvemos los problemas?",
        "opciones": [
            [
                "Ganas de estar pegados",
                "quimica"
            ],
            [
                "Sentir que somos uno solo",
                "conexion"
            ],
            [
                "Hablar de miedos y sueños",
                "profundidad"
            ]
        ]
    },
    {
        "texto": "¿Qué buscás más al pensar en mudarnos juntos algún día?",
        "opciones": [
            [
                "Validar lo que el otro siente",
                "comprension"
            ],
            [
                "Reírnos de nuestros propios errores",
                "diversion"
            ],
            [
                "Planear un viaje improvisado",
                "aventura"
            ]
        ]
    },
    {
        "texto": "¿Qué te hace sentir orgulloso/a de esta relación?",
        "opciones": [
            [
                "La sensación de 'te entiendo sin hablar'",
                "conexion"
            ],
            [
                "Una rutina que nos hace bien",
                "estabilidad"
            ],
            [
                "La atracción del primer día, intacta",
                "quimica"
            ]
        ]
    },
    {
        "texto": "¿Qué necesitás para sentir que estamos avanzando?",
        "opciones": [
            [
                "Hacer alguna tontería juntos",
                "diversion"
            ],
            [
                "Hablar de algo importante",
                "profundidad"
            ],
            [
                "Buscar el origen del problema juntos",
                "comprension"
            ]
        ]
    },
    {
        "texto": "¿Qué es lo que más te gustaría que no cambie nunca?",
        "opciones": [
            [
                "Sentir que esto no se mueve",
                "estabilidad"
            ],
            [
                "Probar algo que da un poco de miedo",
                "aventura"
            ],
            [
                "La sensación de 'te entiendo sin hablar'",
                "conexion"
            ]
        ]
    },
    {
        "texto": "¿Qué buscás más en la forma en que nos cuidamos?",
        "opciones": [
            [
                "Reflexionar juntos sobre la vida",
                "profundidad"
            ],
            [
                "Sentir el corazón acelerado al verlo/la",
                "quimica"
            ],
            [
                "Reírnos de nuestros propios errores",
                "diversion"
            ]
        ]
    },
    {
        "texto": "¿Qué te da más ganas de contarle a otros sobre nosotros?",
        "opciones": [
            [
                "Romper la rutina de golpe",
                "aventura"
            ],
            [
                "Aclarar todo antes de dormir",
                "comprension"
            ],
            [
                "El hogar que armamos entre los dos",
                "estabilidad"
            ]
        ]
    },
    {
        "texto": "¿Qué necesitás sentir cuando algo sale mal?",
        "opciones": [
            [
                "Sentir mariposas todavía",
                "quimica"
            ],
            [
                "Mirarnos a los ojos un rato",
                "conexion"
            ],
            [
                "Ir más allá de lo superficial",
                "profundidad"
            ]
        ]
    },
    {
        "texto": "¿Qué es lo que más valorás de nuestras charlas de todos los días?",
        "opciones": [
            [
                "Ponernos en el lugar del otro",
                "comprension"
            ],
            [
                "Buscar memes para mandarnos",
                "diversion"
            ],
            [
                "Vivir algo fuera del plan",
                "aventura"
            ]
        ]
    },
    {
        "texto": "¿Qué buscás más al imaginar nuestra futura casa?",
        "opciones": [
            [
                "Sentir que encajamos",
                "conexion"
            ],
            [
                "La certeza de que esto no se derrumba",
                "estabilidad"
            ],
            [
                "La atracción del primer día, intacta",
                "quimica"
            ]
        ]
    },
    {
        "texto": "¿Qué te hace sentir que valió la pena la espera?",
        "opciones": [
            [
                "Bailar mal a propósito",
                "diversion"
            ],
            [
                "Compartir algo que no le contamos a nadie más",
                "profundidad"
            ],
            [
                "Ponernos en el lugar del otro",
                "comprension"
            ]
        ]
    },
    {
        "texto": "¿Qué necesitás sentir para bajar la guardia del todo?",
        "opciones": [
            [
                "Una rutina que nos hace bien",
                "estabilidad"
            ],
            [
                "Planear un viaje improvisado",
                "aventura"
            ],
            [
                "Estar en la misma sintonía",
                "conexion"
            ]
        ]
    },
    {
        "texto": "¿Qué es lo que más te gustaría que definiera esta etapa?",
        "opciones": [
            [
                "Hablar de miedos y sueños",
                "profundidad"
            ],
            [
                "El magnetismo de siempre",
                "quimica"
            ],
            [
                "Jugar algo random",
                "diversion"
            ]
        ]
    },
    {
        "texto": "¿Qué buscás más en un festejo, aunque sea chico?",
        "opciones": [
            [
                "Hacer algo nuevo y arriesgado",
                "aventura"
            ],
            [
                "Hablar hasta entendernos del todo",
                "comprension"
            ],
            [
                "La seguridad de lo constante",
                "estabilidad"
            ]
        ]
    },
    {
        "texto": "¿Qué te hace sentir que este amor es distinto a todo lo anterior?",
        "opciones": [
            [
                "Esa mirada que dice todo",
                "quimica"
            ],
            [
                "Sentir que nada más importa",
                "conexion"
            ],
            [
                "Filosofar sobre nosotros",
                "profundidad"
            ]
        ]
    },
    {
        "texto": "¿Qué necesitás para sentir que somos un buen equipo?",
        "opciones": [
            [
                "Repetir con otras palabras hasta entender",
                "comprension"
            ],
            [
                "Un chiste interno que sólo entendemos nosotros",
                "diversion"
            ],
            [
                "Planear un viaje improvisado",
                "aventura"
            ]
        ]
    },
    {
        "texto": "¿Qué es lo que más rescatás de esta relación hoy, sin dudar?",
        "opciones": [
            [
                "Sentir que nada más importa",
                "conexion"
            ],
            [
                "La seguridad de lo constante",
                "estabilidad"
            ],
            [
                "El magnetismo de siempre",
                "quimica"
            ]
        ]
    },
    {
        "texto": "¿Qué buscás más al pensar en el día que estemos juntos para siempre?",
        "opciones": [
            [
                "Contar anécdotas graciosas",
                "diversion"
            ],
            [
                "Filosofar sobre nosotros",
                "profundidad"
            ],
            [
                "Repetir con otras palabras hasta entender",
                "comprension"
            ]
        ]
    },
    {
        "texto": "¿Qué te hace sentir en paz con esta relación?",
        "opciones": [
            [
                "La seguridad de lo constante",
                "estabilidad"
            ],
            [
                "Tirarnos a la pileta sin pensarlo",
                "aventura"
            ],
            [
                "Sentirnos cerca",
                "conexion"
            ]
        ]
    },
    {
        "texto": "¿Qué necesitás sentir para confiar plenamente?",
        "opciones": [
            [
                "Hablar de algo importante",
                "profundidad"
            ],
            [
                "El magnetismo de siempre",
                "quimica"
            ],
            [
                "Contar anécdotas graciosas",
                "diversion"
            ]
        ]
    },
    {
        "texto": "¿Qué es lo que más te gustaría celebrar de nosotros?",
        "opciones": [
            [
                "Decir que sí sin pensarlo tanto",
                "aventura"
            ],
            [
                "Hablar hasta entendernos del todo",
                "comprension"
            ],
            [
                "Una rutina que nos hace bien",
                "estabilidad"
            ]
        ]
    },
    {
        "texto": "¿Qué buscás más en una charla sobre nuestros miedos?",
        "opciones": [
            [
                "Esa conexión física que no se apaga",
                "quimica"
            ],
            [
                "Mirarnos a los ojos un rato",
                "conexion"
            ],
            [
                "Buscar el sentido de las cosas juntos",
                "profundidad"
            ]
        ]
    },
    {
        "texto": "¿Qué te hace sentir que crecemos juntos?",
        "opciones": [
            [
                "Escuchar sin juzgar",
                "comprension"
            ],
            [
                "Bailar mal a propósito",
                "diversion"
            ],
            [
                "Explorar un lugar desconocido",
                "aventura"
            ]
        ]
    },
    {
        "texto": "¿Qué necesitás para sentir que esto es sólido?",
        "opciones": [
            [
                "Un abrazo largo",
                "conexion"
            ],
            [
                "Saber que puedo contar con vos siempre",
                "estabilidad"
            ],
            [
                "La atracción del primer día, intacta",
                "quimica"
            ]
        ]
    },
    {
        "texto": "¿Qué es lo que más te emociona de esta etapa?",
        "opciones": [
            [
                "Buscar memes para mandarnos",
                "diversion"
            ],
            [
                "Filosofar sobre nosotros",
                "profundidad"
            ],
            [
                "Entender el porqué, no sólo el qué",
                "comprension"
            ]
        ]
    },
    {
        "texto": "¿Qué buscás más al escuchar mi voz?",
        "opciones": [
            [
                "Una rutina que nos hace bien",
                "estabilidad"
            ],
            [
                "Salir de la zona de confort juntos",
                "aventura"
            ],
            [
                "Sentir que nada más importa",
                "conexion"
            ]
        ]
    },
    {
        "texto": "¿Qué te hace sentir agradecido/a por esta relación?",
        "opciones": [
            [
                "Una conversación que nos deja pensando días",
                "profundidad"
            ],
            [
                "La atracción del primer día, intacta",
                "quimica"
            ],
            [
                "Buscar memes para mandarnos",
                "diversion"
            ]
        ]
    },
    {
        "texto": "¿Qué necesitás sentir en un abrazo de despedida?",
        "opciones": [
            [
                "Planear un viaje improvisado",
                "aventura"
            ],
            [
                "Preguntar en vez de asumir",
                "comprension"
            ],
            [
                "Una rutina que nos hace bien",
                "estabilidad"
            ]
        ]
    },
    {
        "texto": "¿Qué es lo que más te gustaría que perdure con el tiempo?",
        "opciones": [
            [
                "El magnetismo de siempre",
                "quimica"
            ],
            [
                "Sentir que encajamos",
                "conexion"
            ],
            [
                "Hablar de algo importante",
                "profundidad"
            ]
        ]
    },
    {
        "texto": "¿Qué buscás más en los días que nos vemos poco?",
        "opciones": [
            [
                "Repetir con otras palabras hasta entender",
                "comprension"
            ],
            [
                "Hacer una competencia tonta",
                "diversion"
            ],
            [
                "Animarnos a lo impredecible",
                "aventura"
            ]
        ]
    },
    {
        "texto": "¿Qué te hace sentir que somos compatibles?",
        "opciones": [
            [
                "Sentir que encajamos",
                "conexion"
            ],
            [
                "Una rutina que nos hace bien",
                "estabilidad"
            ],
            [
                "Esa conexión física que no se apaga",
                "quimica"
            ]
        ]
    },
    {
        "texto": "¿Qué necesitás para sentir que la relación fluye?",
        "opciones": [
            [
                "Hacer alguna tontería juntos",
                "diversion"
            ],
            [
                "Una charla que nos hace pensar",
                "profundidad"
            ],
            [
                "Escuchar sin juzgar",
                "comprension"
            ]
        ]
    },
    {
        "texto": "¿Qué es lo que más rescatás de cómo te trato?",
        "opciones": [
            [
                "Saber que puedo contar con vos siempre",
                "estabilidad"
            ],
            [
                "Decir que sí sin pensarlo tanto",
                "aventura"
            ],
            [
                "La sensación de 'te entiendo sin hablar'",
                "conexion"
            ]
        ]
    },
    {
        "texto": "¿Qué buscás más al pensar en nuestra próxima charla profunda?",
        "opciones": [
            [
                "Una conversación que nos deja pensando días",
                "profundidad"
            ],
            [
                "Sentir el corazón acelerado al verlo/la",
                "quimica"
            ],
            [
                "Reírnos de nuestros propios errores",
                "diversion"
            ]
        ]
    },
    {
        "texto": "¿Qué te hace sentir que esta relación tiene futuro?",
        "opciones": [
            [
                "Romper la rutina de golpe",
                "aventura"
            ],
            [
                "Validar lo que el otro siente",
                "comprension"
            ],
            [
                "Confiar en que mañana seguimos igual",
                "estabilidad"
            ]
        ]
    },
    {
        "texto": "¿Qué necesitás sentir para animarte a un paso grande juntos?",
        "opciones": [
            [
                "Ganas de estar pegados",
                "quimica"
            ],
            [
                "Mirarnos a los ojos un rato",
                "conexion"
            ],
            [
                "Filosofar sobre nosotros",
                "profundidad"
            ]
        ]
    },
    {
        "texto": "¿Qué es lo que más te gustaría profundizar en nosotros?",
        "opciones": [
            [
                "Buscar el origen del problema juntos",
                "comprension"
            ],
            [
                "Reírnos sin parar",
                "diversion"
            ],
            [
                "Decir que sí sin pensarlo tanto",
                "aventura"
            ]
        ]
    },
    {
        "texto": "¿Qué buscás más en un mensaje de 'buenas noches'?",
        "opciones": [
            [
                "Sentir que encajamos",
                "conexion"
            ],
            [
                "Saber que puedo contar con vos siempre",
                "estabilidad"
            ],
            [
                "El magnetismo de siempre",
                "quimica"
            ]
        ]
    },
    {
        "texto": "¿Qué te hace sentir que valemos la pena, como pareja?",
        "opciones": [
            [
                "Reírnos sin parar",
                "diversion"
            ],
            [
                "Compartir algo que no le contamos a nadie más",
                "profundidad"
            ],
            [
                "Escuchar sin juzgar",
                "comprension"
            ]
        ]
    },
    {
        "texto": "¿Qué necesitás sentir cuando estamos en silencio juntos?",
        "opciones": [
            [
                "Confiar en que mañana seguimos igual",
                "estabilidad"
            ],
            [
                "Tirarnos a la pileta sin pensarlo",
                "aventura"
            ],
            [
                "Sentirnos parte del mismo equipo",
                "conexion"
            ]
        ]
    },
    {
        "texto": "¿Qué es lo que más te llena el alma de esta relación?",
        "opciones": [
            [
                "Reflexionar juntos sobre la vida",
                "profundidad"
            ],
            [
                "Esa chispa que no se explica",
                "quimica"
            ],
            [
                "Contar anécdotas graciosas",
                "diversion"
            ]
        ]
    },
    {
        "texto": "¿Qué buscás más al recordar cómo empezó todo?",
        "opciones": [
            [
                "Decir que sí sin pensarlo tanto",
                "aventura"
            ],
            [
                "Explicarnos con paciencia",
                "comprension"
            ],
            [
                "La certeza de que esto no se derrumba",
                "estabilidad"
            ]
        ]
    },
    {
        "texto": "¿Qué te hace sentir que esto es 'para siempre'?",
        "opciones": [
            [
                "El deseo de estar cerca físicamente",
                "quimica"
            ],
            [
                "El silencio cómodo entre los dos",
                "conexion"
            ],
            [
                "Ir más allá de lo superficial",
                "profundidad"
            ]
        ]
    },
    {
        "texto": "¿Qué necesitás sentir para animarte a soñar en grande juntos?",
        "opciones": [
            [
                "Entender el porqué, no sólo el qué",
                "comprension"
            ],
            [
                "Buscar memes para mandarnos",
                "diversion"
            ],
            [
                "Romper la rutina de golpe",
                "aventura"
            ]
        ]
    },
    {
        "texto": "¿Qué es lo que más valorás de nuestra forma de discutir?",
        "opciones": [
            [
                "Sentir que somos uno solo",
                "conexion"
            ],
            [
                "La calma de lo cotidiano",
                "estabilidad"
            ],
            [
                "Sentir el corazón acelerado al verlo/la",
                "quimica"
            ]
        ]
    },
    {
        "texto": "¿Qué buscás más al pensar en presentarnos a nuestras familias?",
        "opciones": [
            [
                "Bailar mal a propósito",
                "diversion"
            ],
            [
                "Compartir algo que no le contamos a nadie más",
                "profundidad"
            ],
            [
                "Preguntar en vez de asumir",
                "comprension"
            ]
        ]
    },
    {
        "texto": "¿Qué te hace sentir que somos un buen refugio el uno para el otro?",
        "opciones": [
            [
                "Un plan tranquilo y predecible",
                "estabilidad"
            ],
            [
                "Probar algo que da un poco de miedo",
                "aventura"
            ],
            [
                "La sensación de 'te entiendo sin hablar'",
                "conexion"
            ]
        ]
    },
    {
        "texto": "¿Qué necesitás sentir en un día de mucho estrés?",
        "opciones": [
            [
                "Compartir algo que no le contamos a nadie más",
                "profundidad"
            ],
            [
                "Esa conexión física que no se apaga",
                "quimica"
            ],
            [
                "Contar anécdotas graciosas",
                "diversion"
            ]
        ]
    },
    {
        "texto": "¿Qué es lo que más te gustaría que definiera nuestro próximo año?",
        "opciones": [
            [
                "Probar algo que da un poco de miedo",
                "aventura"
            ],
            [
                "Explicarnos con paciencia",
                "comprension"
            ],
            [
                "La seguridad de lo constante",
                "estabilidad"
            ]
        ]
    },
    {
        "texto": "¿Qué buscás más al pensar en nuestro primer aniversario en persona?",
        "opciones": [
            [
                "El magnetismo de siempre",
                "quimica"
            ],
            [
                "Sentir que nada más importa",
                "conexion"
            ],
            [
                "Hablar de algo importante",
                "profundidad"
            ]
        ]
    },
    {
        "texto": "¿Qué te hace sentir que esto es más que una relación a distancia?",
        "opciones": [
            [
                "Escuchar sin juzgar",
                "comprension"
            ],
            [
                "Bailar mal a propósito",
                "diversion"
            ],
            [
                "Salir de la zona de confort juntos",
                "aventura"
            ]
        ]
    },
    {
        "texto": "¿Qué necesitás sentir para saber que estamos bien, sin dudar?",
        "opciones": [
            [
                "Mirarnos a los ojos un rato",
                "conexion"
            ],
            [
                "Confiar en que mañana seguimos igual",
                "estabilidad"
            ],
            [
                "El magnetismo de siempre",
                "quimica"
            ]
        ]
    },
    {
        "texto": "¿Qué es lo que más rescatás de todo lo que construimos hasta hoy?",
        "opciones": [
            [
                "Bailar mal a propósito",
                "diversion"
            ],
            [
                "Compartir algo que no le contamos a nadie más",
                "profundidad"
            ],
            [
                "Preguntar en vez de asumir",
                "comprension"
            ]
        ]
    }
];

function refAdn(){ return window.doc(window.db, 'juegos', 'adn'); }

function iniciarAdn(){
    if (window._unsubAdn) window._unsubAdn();
    window._unsubAdn = window.onSnapshot(refAdn(), (snap) => {
        renderAdn(snap.exists() ? snap.data() : null);
    }, (err) => {
        console.error('Error de Firestore en adn:', err);
        document.getElementById('contenido-adn').innerHTML = `<div class="panel texto-centro texto-tenue">⚠️ No se pudo conectar (${err.code || 'error'}).</div>`;
    });
}

let _respuestasLocalesAdn = [];

function renderAdn(estado){
    const cont = document.getElementById('contenido-adn');
    if (!estado || estado.fase === 'sin_ronda') {
        cont.innerHTML = `<div class="panel texto-centro">
            <p class="texto-tenue">${PREGUNTAS_ADN.length} preguntas para armar el "ADN" visual de la pareja. No es un test clínico, sólo curiosidad.</p>
            <button class="btn-principal" onclick="nuevaRondaAdn()">Empezar</button>
        </div>`;
        return;
    }

    const yaEnvie = !!estado[`respuestas${miIdentidad === 'nico' ? 'Nico' : 'Carito'}`];

    if (estado.fase === 'revelado') {
        const conteos = {};
        Object.keys(DIMENSIONES_ADN).forEach(k => conteos[k] = 0);
        [...estado.respuestasNico, ...estado.respuestasCarito].forEach(dim => { conteos[dim] = (conteos[dim] || 0) + 1; });
        const total = estado.respuestasNico.length + estado.respuestasCarito.length;

        let html = `<div class="panel texto-centro logro-animado"><p style="font-family:var(--fuente-titulo); font-size:1.3rem;">Nuestro ADN 🧬</p></div><div class="panel">`;
        Object.entries(DIMENSIONES_ADN).forEach(([k, d]) => {
            const pct = total ? Math.round((conteos[k] / total) * 100) : 0;
            html += `<div style="margin-bottom:12px;">
                <div style="display:flex; justify-content:space-between; font-size:0.85rem; margin-bottom:4px;"><span>${d.icono} ${d.nombre}</span><span>${pct}%</span></div>
                <div class="barra-medidor"><div class="relleno-medidor barra-crecer" style="width:${pct}%; background:linear-gradient(90deg,var(--rosa),var(--lila));"></div></div>
            </div>`;
        });
        html += `</div><button class="btn-principal" onclick="nuevaRondaAdn()">🔁 Otra ronda</button>
        <button class="btn-secundario" style="margin-top:8px;" onclick="compartirResultadoAdn()">📸 Descargar como imagen</button>`;
        cont.innerHTML = html;
        window._ultimoResultadoAdn = { conteos, total };
        return;
    }

    if (yaEnvie) {
        cont.innerHTML = `<div class="panel texto-centro texto-tenue destello">Ya respondiste. Esperando a ${nombreJugador(miRival)}…</div>`;
        return;
    }

    if (_respuestasLocalesAdn.length !== PREGUNTAS_ADN.length) _respuestasLocalesAdn = new Array(PREGUNTAS_ADN.length).fill(null);

    let html = '';
    PREGUNTAS_ADN.forEach((p, i) => {
        html += `<div class="panel">
            <p style="margin:0 0 10px; font-size:0.92rem;">${i + 1}. ${p.texto}</p>
            <div style="display:flex; flex-direction:column; gap:6px;">
                ${p.opciones.map((op, oi) => `<button class="btn-secundario ${_respuestasLocalesAdn[i] === oi ? 'opcion-elegida' : ''}" style="text-align:left;" onclick="elegirAdn(${i},${oi})">${op[0]}</button>`).join('')}
            </div>
        </div>`;
    });
    const completo = _respuestasLocalesAdn.every(r => r !== null);
    html += `<button class="btn-principal" ${completo ? '' : 'style="opacity:0.4;" disabled'} onclick="enviarAdn()">Enviar mis respuestas</button>`;
    cont.innerHTML = html;
}

function elegirAdn(i, oi){
    vibrarJ(8);
    _respuestasLocalesAdn[i] = oi;
    refrescarVistaAdn();
}
async function refrescarVistaAdn(){
    const snap = await new Promise(res => { const u = window.onSnapshot(refAdn(), s => { u(); res(s); }); });
    if (snap.exists()) renderAdn(snap.data());
}

async function nuevaRondaAdn(){
    vibrarJ(12);
    _respuestasLocalesAdn = [];
    await window.setDoc(refAdn(), { fase: 'jugando', respuestasNico: null, respuestasCarito: null });
}

async function enviarAdn(){
    vibrarJ([15, 30, 15]);
    const dimensiones = _respuestasLocalesAdn.map((oi, i) => PREGUNTAS_ADN[i].opciones[oi][1]);
    const campo = miIdentidad === 'nico' ? 'respuestasNico' : 'respuestasCarito';
    const snap = await new Promise(res => { const u = window.onSnapshot(refAdn(), s => { u(); res(s); }); });
    const data = snap.data();
    const otro = miIdentidad === 'nico' ? data.respuestasCarito : data.respuestasNico;
    await window.updateDoc(refAdn(), { [campo]: dimensiones, ...(otro ? { fase: 'revelado' } : {}) });
}

function compartirResultadoAdn(){
    vibrarJ(12);
    if (typeof generarTarjetaImagen !== 'function' || !window._ultimoResultadoAdn) return;
    const { conteos, total } = window._ultimoResultadoAdn;
    let top = null, topPct = -1;
    Object.entries(DIMENSIONES_ADN).forEach(([k, d]) => {
        const pct = total ? Math.round((conteos[k] / total) * 100) : 0;
        if (pct > topPct) { topPct = pct; top = d; }
    });
    generarTarjetaImagen({
        titulo: 'Nuestro ADN de Pareja',
        numeroGrande: top ? top.icono : '🧬',
        subtitulo: top ? `${top.nombre}: ${topPct}%` : '',
        pie: 'Nico & Carito · Nuestros Juegos',
        nombreArchivo: 'adn-de-la-pareja'
    });
}
