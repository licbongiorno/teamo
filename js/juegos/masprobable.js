// ==================== ¿QUIÉN ES MÁS PROBABLE QUE…? (motor de reflexión) ====================
// Este juego usa js/motor-reflexion.js — acá sólo va su configuración.
// Cada uno vota a solas; si coinciden, punto para la pareja. La lista
// muestra el marcador de coincidencias. 77 consignas.
window.CONFIG_REFLEXION = window.CONFIG_REFLEXION || {};
window.CONFIG_REFLEXION['masprobable'] = {
    tipo: 'opciones',
    desempatePorSorteo: false,
    nombreJuego: '¿Quién es más probable que…?',
    botonNuevo: 'Nueva pregunta',
    instrucciones: 'Votá a solas quién de los dos es más probable que haga cada cosa. ¿Cuántas veces piensan lo mismo?',
    banco: [
    {
        "texto": "¿Quién es más probable que… llegar tarde a una cita?",
        "opciones": [
            "Nico",
            "Carito",
            "Los dos por igual"
        ]
    },
    {
        "texto": "¿Quién es más probable que… llorar con una publicidad?",
        "opciones": [
            "Nico",
            "Carito",
            "Los dos por igual"
        ]
    },
    {
        "texto": "¿Quién es más probable que… olvidarse dónde dejó las llaves?",
        "opciones": [
            "Nico",
            "Carito",
            "Los dos por igual"
        ]
    },
    {
        "texto": "¿Quién es más probable que… comerse la última porción sin preguntar?",
        "opciones": [
            "Nico",
            "Carito",
            "Los dos por igual"
        ]
    },
    {
        "texto": "¿Quién es más probable que… quedarse dormido/a viendo una película?",
        "opciones": [
            "Nico",
            "Carito",
            "Los dos por igual"
        ]
    },
    {
        "texto": "¿Quién es más probable que… mandar un audio de más de 3 minutos?",
        "opciones": [
            "Nico",
            "Carito",
            "Los dos por igual"
        ]
    },
    {
        "texto": "¿Quién es más probable que… hablarle a las plantas?",
        "opciones": [
            "Nico",
            "Carito",
            "Los dos por igual"
        ]
    },
    {
        "texto": "¿Quién es más probable que… perderse aun usando el GPS?",
        "opciones": [
            "Nico",
            "Carito",
            "Los dos por igual"
        ]
    },
    {
        "texto": "¿Quién es más probable que… reírse en un momento serio?",
        "opciones": [
            "Nico",
            "Carito",
            "Los dos por igual"
        ]
    },
    {
        "texto": "¿Quién es más probable que… comprar algo que no necesita?",
        "opciones": [
            "Nico",
            "Carito",
            "Los dos por igual"
        ]
    },
    {
        "texto": "¿Quién es más probable que… cantar en la ducha a todo volumen?",
        "opciones": [
            "Nico",
            "Carito",
            "Los dos por igual"
        ]
    },
    {
        "texto": "¿Quién es más probable que… pedir perdón primero después de una pelea?",
        "opciones": [
            "Nico",
            "Carito",
            "Los dos por igual"
        ]
    },
    {
        "texto": "¿Quién es más probable que… planear un viaje sorpresa?",
        "opciones": [
            "Nico",
            "Carito",
            "Los dos por igual"
        ]
    },
    {
        "texto": "¿Quién es más probable que… olvidarse de una fecha importante?",
        "opciones": [
            "Nico",
            "Carito",
            "Los dos por igual"
        ]
    },
    {
        "texto": "¿Quién es más probable que… adoptar un animal sin consultar?",
        "opciones": [
            "Nico",
            "Carito",
            "Los dos por igual"
        ]
    },
    {
        "texto": "¿Quién es más probable que… ganar una discusión por cansancio?",
        "opciones": [
            "Nico",
            "Carito",
            "Los dos por igual"
        ]
    },
    {
        "texto": "¿Quién es más probable que… empezar una dieta el lunes y dejarla el martes?",
        "opciones": [
            "Nico",
            "Carito",
            "Los dos por igual"
        ]
    },
    {
        "texto": "¿Quién es más probable que… hacerse amigo/a de un desconocido en la fila?",
        "opciones": [
            "Nico",
            "Carito",
            "Los dos por igual"
        ]
    },
    {
        "texto": "¿Quién es más probable que… quemar la comida?",
        "opciones": [
            "Nico",
            "Carito",
            "Los dos por igual"
        ]
    },
    {
        "texto": "¿Quién es más probable que… ver el final de una serie sin esperar al otro?",
        "opciones": [
            "Nico",
            "Carito",
            "Los dos por igual"
        ]
    },
    {
        "texto": "¿Quién es más probable que… gastar todo el sueldo en comida?",
        "opciones": [
            "Nico",
            "Carito",
            "Los dos por igual"
        ]
    },
    {
        "texto": "¿Quién es más probable que… despertarse de mal humor?",
        "opciones": [
            "Nico",
            "Carito",
            "Los dos por igual"
        ]
    },
    {
        "texto": "¿Quién es más probable que… proponer una aventura loca a medianoche?",
        "opciones": [
            "Nico",
            "Carito",
            "Los dos por igual"
        ]
    },
    {
        "texto": "¿Quién es más probable que… sobrevivir en una isla desierta?",
        "opciones": [
            "Nico",
            "Carito",
            "Los dos por igual"
        ]
    },
    {
        "texto": "¿Quién es más probable que… volverse famoso/a en internet?",
        "opciones": [
            "Nico",
            "Carito",
            "Los dos por igual"
        ]
    },
    {
        "texto": "¿Quién es más probable que… contar un secreto sin querer?",
        "opciones": [
            "Nico",
            "Carito",
            "Los dos por igual"
        ]
    },
    {
        "texto": "¿Quién es más probable que… llorar en una boda?",
        "opciones": [
            "Nico",
            "Carito",
            "Los dos por igual"
        ]
    },
    {
        "texto": "¿Quién es más probable que… quedarse despierto/a hasta las 4 de la mañana?",
        "opciones": [
            "Nico",
            "Carito",
            "Los dos por igual"
        ]
    },
    {
        "texto": "¿Quién es más probable que… cambiar de opinión a último momento?",
        "opciones": [
            "Nico",
            "Carito",
            "Los dos por igual"
        ]
    },
    {
        "texto": "¿Quién es más probable que… decir \"te lo dije\"?",
        "opciones": [
            "Nico",
            "Carito",
            "Los dos por igual"
        ]
    },
    {
        "texto": "¿Quién es más probable que… ser el alma de la fiesta?",
        "opciones": [
            "Nico",
            "Carito",
            "Los dos por igual"
        ]
    },
    {
        "texto": "¿Quién es más probable que… dejar la ropa tirada en el piso?",
        "opciones": [
            "Nico",
            "Carito",
            "Los dos por igual"
        ]
    },
    {
        "texto": "¿Quién es más probable que… olvidarse de responder un mensaje?",
        "opciones": [
            "Nico",
            "Carito",
            "Los dos por igual"
        ]
    },
    {
        "texto": "¿Quién es más probable que… hacer una sorpresa romántica?",
        "opciones": [
            "Nico",
            "Carito",
            "Los dos por igual"
        ]
    },
    {
        "texto": "¿Quién es más probable que… asustarse con una película de terror?",
        "opciones": [
            "Nico",
            "Carito",
            "Los dos por igual"
        ]
    },
    {
        "texto": "¿Quién es más probable que… pedir lo mismo que el otro en un restaurante?",
        "opciones": [
            "Nico",
            "Carito",
            "Los dos por igual"
        ]
    },
    {
        "texto": "¿Quién es más probable que… tener la última palabra?",
        "opciones": [
            "Nico",
            "Carito",
            "Los dos por igual"
        ]
    },
    {
        "texto": "¿Quién es más probable que… mudarse a otro país?",
        "opciones": [
            "Nico",
            "Carito",
            "Los dos por igual"
        ]
    },
    {
        "texto": "¿Quién es más probable que… aprender un idioma nuevo este año?",
        "opciones": [
            "Nico",
            "Carito",
            "Los dos por igual"
        ]
    },
    {
        "texto": "¿Quién es más probable que… emocionarse viendo fotos viejas?",
        "opciones": [
            "Nico",
            "Carito",
            "Los dos por igual"
        ]
    },
    {
        "texto": "¿Quién es más probable que… hablar con la boca llena?",
        "opciones": [
            "Nico",
            "Carito",
            "Los dos por igual"
        ]
    },
    {
        "texto": "¿Quién es más probable que… quejarse del frío?",
        "opciones": [
            "Nico",
            "Carito",
            "Los dos por igual"
        ]
    },
    {
        "texto": "¿Quién es más probable que… quejarse del calor?",
        "opciones": [
            "Nico",
            "Carito",
            "Los dos por igual"
        ]
    },
    {
        "texto": "¿Quién es más probable que… equivocarse de camino y no admitirlo?",
        "opciones": [
            "Nico",
            "Carito",
            "Los dos por igual"
        ]
    },
    {
        "texto": "¿Quién es más probable que… hacer trampa en un juego de mesa?",
        "opciones": [
            "Nico",
            "Carito",
            "Los dos por igual"
        ]
    },
    {
        "texto": "¿Quién es más probable que… ganar al truco?",
        "opciones": [
            "Nico",
            "Carito",
            "Los dos por igual"
        ]
    },
    {
        "texto": "¿Quién es más probable que… dormirse en un viaje en auto?",
        "opciones": [
            "Nico",
            "Carito",
            "Los dos por igual"
        ]
    },
    {
        "texto": "¿Quién es más probable que… tener una idea millonaria?",
        "opciones": [
            "Nico",
            "Carito",
            "Los dos por igual"
        ]
    },
    {
        "texto": "¿Quién es más probable que… acordarse de lo que dijo el otro hace un año?",
        "opciones": [
            "Nico",
            "Carito",
            "Los dos por igual"
        ]
    },
    {
        "texto": "¿Quién es más probable que… pedir comida a domicilio en vez de cocinar?",
        "opciones": [
            "Nico",
            "Carito",
            "Los dos por igual"
        ]
    },
    {
        "texto": "¿Quién es más probable que… dejar la heladera abierta?",
        "opciones": [
            "Nico",
            "Carito",
            "Los dos por igual"
        ]
    },
    {
        "texto": "¿Quién es más probable que… comprar un regalo a último momento?",
        "opciones": [
            "Nico",
            "Carito",
            "Los dos por igual"
        ]
    },
    {
        "texto": "¿Quién es más probable que… regalar algo hecho a mano?",
        "opciones": [
            "Nico",
            "Carito",
            "Los dos por igual"
        ]
    },
    {
        "texto": "¿Quién es más probable que… perder el celular dentro de casa?",
        "opciones": [
            "Nico",
            "Carito",
            "Los dos por igual"
        ]
    },
    {
        "texto": "¿Quién es más probable que… bailar sin música?",
        "opciones": [
            "Nico",
            "Carito",
            "Los dos por igual"
        ]
    },
    {
        "texto": "¿Quién es más probable que… saludar a alguien que no lo estaba saludando?",
        "opciones": [
            "Nico",
            "Carito",
            "Los dos por igual"
        ]
    },
    {
        "texto": "¿Quién es más probable que… enojarse con un videojuego?",
        "opciones": [
            "Nico",
            "Carito",
            "Los dos por igual"
        ]
    },
    {
        "texto": "¿Quién es más probable que… abrazar a un perro desconocido?",
        "opciones": [
            "Nico",
            "Carito",
            "Los dos por igual"
        ]
    },
    {
        "texto": "¿Quién es más probable que… pedir una segunda porción de postre?",
        "opciones": [
            "Nico",
            "Carito",
            "Los dos por igual"
        ]
    },
    {
        "texto": "¿Quién es más probable que… contar el mismo chiste dos veces?",
        "opciones": [
            "Nico",
            "Carito",
            "Los dos por igual"
        ]
    },
    {
        "texto": "¿Quién es más probable que… reírse de su propio chiste?",
        "opciones": [
            "Nico",
            "Carito",
            "Los dos por igual"
        ]
    },
    {
        "texto": "¿Quién es más probable que… volver tarde de una salida con amigos?",
        "opciones": [
            "Nico",
            "Carito",
            "Los dos por igual"
        ]
    },
    {
        "texto": "¿Quién es más probable que… hacer una lista para todo?",
        "opciones": [
            "Nico",
            "Carito",
            "Los dos por igual"
        ]
    },
    {
        "texto": "¿Quién es más probable que… dejar todo para último momento?",
        "opciones": [
            "Nico",
            "Carito",
            "Los dos por igual"
        ]
    },
    {
        "texto": "¿Quién es más probable que… mandar un mensaje al chat equivocado?",
        "opciones": [
            "Nico",
            "Carito",
            "Los dos por igual"
        ]
    },
    {
        "texto": "¿Quién es más probable que… adivinar el final de una película?",
        "opciones": [
            "Nico",
            "Carito",
            "Los dos por igual"
        ]
    },
    {
        "texto": "¿Quién es más probable que… tener razón en una discusión tonta?",
        "opciones": [
            "Nico",
            "Carito",
            "Los dos por igual"
        ]
    },
    {
        "texto": "¿Quién es más probable que… emocionarse con un atardecer?",
        "opciones": [
            "Nico",
            "Carito",
            "Los dos por igual"
        ]
    },
    {
        "texto": "¿Quién es más probable que… comer algo del piso (regla de los 5 segundos)?",
        "opciones": [
            "Nico",
            "Carito",
            "Los dos por igual"
        ]
    },
    {
        "texto": "¿Quién es más probable que… gastar en una planta que después se seca?",
        "opciones": [
            "Nico",
            "Carito",
            "Los dos por igual"
        ]
    },
    {
        "texto": "¿Quién es más probable que… olvidarse de cargar el celular?",
        "opciones": [
            "Nico",
            "Carito",
            "Los dos por igual"
        ]
    },
    {
        "texto": "¿Quién es más probable que… ser el/la primero/a en decir \"te amo\" en una pelea?",
        "opciones": [
            "Nico",
            "Carito",
            "Los dos por igual"
        ]
    },
    {
        "texto": "¿Quién es más probable que… llevar demasiado equipaje a un viaje?",
        "opciones": [
            "Nico",
            "Carito",
            "Los dos por igual"
        ]
    },
    {
        "texto": "¿Quién es más probable que… sobrevivir a un apocalipsis zombi?",
        "opciones": [
            "Nico",
            "Carito",
            "Los dos por igual"
        ]
    },
    {
        "texto": "¿Quién es más probable que… ganar un concurso de baile?",
        "opciones": [
            "Nico",
            "Carito",
            "Los dos por igual"
        ]
    },
    {
        "texto": "¿Quién es más probable que… escribirle una carta de amor al otro?",
        "opciones": [
            "Nico",
            "Carito",
            "Los dos por igual"
        ]
    },
    {
        "texto": "¿Quién es más probable que… pedir disculpas a un mueble después de chocarlo?",
        "opciones": [
            "Nico",
            "Carito",
            "Los dos por igual"
        ]
    }
]
};
