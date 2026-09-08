// ============================================================
// juegos-data.js — catálogo único de TODOS los juegos (los que ya
// se pueden jugar y los que están planeados). Lo usan:
//  - juegos.html (para armar la grilla de categorías)
//  - categorias/*.html (para listar los juegos de cada categoría)
// "disponible:true" = tiene pantalla y lógica real en juegos.html.
// "disponible:false" = todavía no está construido ("Próximamente").
// Cuando se agregue un juego nuevo, alcanza con: 1) sumar su
// pantalla+lógica en juegos.html/js/juegos/<id>.js, y 2) poner
// disponible:true acá. Las páginas de categoría se actualizan solas.
// ============================================================
window.CATEGORIAS = [
    { id: 'clasicos',     nombre: 'Clásicos',     icono: '🃏', color: '#a8d8ff' },
    { id: 'competencia',  nombre: 'Competencia',  icono: '⚡', color: '#ffb3c6' },
    { id: 'conexion',     nombre: 'Conexión',     icono: '💬', color: '#c9b6ff' },
    { id: 'reflexion',    nombre: 'Reflexión',    icono: '🌙', color: '#a8edea' },
    { id: 'cooperativos', nombre: 'Cooperativos', icono: '🤝', color: '#f5d9a0' },
];

window.JUEGOS = [
    // ---- CLÁSICOS ----
    { id:'ahorcado',   nombre:'Ahorcado',            icono:'🔤', categoria:'clasicos',    disponible:true,  descripcion:'Uno propone una palabra secreta, el otro la adivina letra por letra.' },
    { id:'truco',      nombre:'Truco Argentino',     icono:'🃏', categoria:'clasicos',    disponible:true,  descripcion:'El clásico de a dos, con envido y truco, reglas reales.' },
    { id:'damas',      nombre:'Damas',                icono:'⚫', categoria:'clasicos',    disponible:true,  descripcion:'El tablero de siempre, con damas voladoras al coronar.' },
    { id:'ajedrez',    nombre:'Ajedrez',              icono:'♟️', categoria:'clasicos',    disponible:true,  descripcion:'Partida completa: enroque, al paso, jaque y jaque mate.' },
    { id:'tateti',     nombre:'Ta-Te-Ti Infinito',   icono:'❌', categoria:'clasicos',    disponible:true, descripcion:'Tres en línea, pero cada jugador sólo tiene 3 marcas activas.' },
    { id:'conecta4',   nombre:'Conecta 4',            icono:'🔴', categoria:'clasicos',    disponible:true, descripcion:'El clásico de las fichas que caen, a 4 en línea.' },
    { id:'escoba',     nombre:'Escoba de 15',        icono:'🧹', categoria:'clasicos',    disponible:false, descripcion:'Cartas españolas: sumá 15 y levantá la mesa.' },
    { id:'batallanaval', nombre:'Batalla Naval',      icono:'🚢', categoria:'clasicos',    disponible:false, descripcion:'Ubicá tu flota y hundí la del otro por turnos.' },

    // ---- COMPETENCIA ----
    { id:'frutas',     nombre:'Atrapar Frutas',       icono:'🍓', categoria:'competencia', disponible:true,  descripcion:'30 segundos atrapando frutas. Se compara el mejor puntaje.' },
    { id:'reflejos',   nombre:'Duelo de Reflejos',    icono:'💥', categoria:'competencia', disponible:true, descripcion:'Esperá la señal y tocá lo más rápido posible.' },
    { id:'tiraafloja', nombre:'Tira y Afloja',        icono:'❤️', categoria:'competencia', disponible:false, descripcion:'Toques rápidos para llevar el corazón a tu lado.' },
    { id:'palabraexplosiva', nombre:'Palabra Explosiva', icono:'💣', categoria:'competencia', disponible:false, descripcion:'Una letra, una categoría, 30 segundos para anotar palabras.' },
    { id:'memoria',    nombre:'Memoria de Emojis',    icono:'🧠', categoria:'competencia', disponible:false, descripcion:'Memorizá la secuencia antes de que desaparezca.' },
    { id:'adivinaquien', nombre:'Adivina Quién',      icono:'❓', categoria:'competencia', disponible:false, descripcion:'Personaje secreto en emojis: preguntá y arriesgá.' },
    { id:'decisiones', nombre:'Duelo de Decisiones',  icono:'🎯', categoria:'competencia', disponible:false, descripcion:'Situaciones con 4 opciones: ¿eligen lo mismo?' },

    // ---- CONEXIÓN ----
    { id:'indagacion', nombre:'Cartas de Indagación', icono:'🌙', categoria:'conexion',    disponible:true,  descripcion:'Preguntas profundas para antes de dormir: respondé y adiviná qué respondió el otro.' },
    { id:'verdadoreto', nombre:'Verdad o Reto',       icono:'🔥', categoria:'conexion',    disponible:true,  descripcion:'El clásico de siempre, con preguntas y retos pensados para nosotros.' },
    { id:'conoceme',   nombre:'¿Cuánto me conocés?',  icono:'🧩', categoria:'conexion',    disponible:false, descripcion:'Elegí qué haría el otro y comparen qué tanto se conocen.' },
    { id:'mentegemela', nombre:'Mente Gemela',        icono:'👯', categoria:'conexion',    disponible:false, descripcion:'5 preguntas de opción múltiple: ¿qué % de coincidencia tienen?' },
    { id:'adn',        nombre:'ADN de la Pareja',      icono:'🧬', categoria:'conexion',    disponible:false, descripcion:'20 preguntas que arman un perfil visual de la relación.' },
    { id:'mentiraverdad', nombre:'Mentira o Verdad',  icono:'🎭', categoria:'conexion',    disponible:false, descripcion:'Tres afirmaciones, una es mentira. ¿La descubrís?' },
    { id:'detective',  nombre:'Detective de Nosotros', icono:'🔍', categoria:'conexion',    disponible:false, descripcion:'Pistas sobre momentos que vivieron juntos, a adivinar entre los dos.' },
    { id:'nuncapregunte', nombre:'Lo que nunca te pregunté', icono:'💭', categoria:'conexion', disponible:false, descripcion:'Preguntas inesperadas para conversaciones profundas.' },

    // ---- REFLEXIÓN ----
    { id:'espejo',     nombre:'El Espejo',             icono:'🪞', categoria:'reflexion',   disponible:false, descripcion:'Respondé y predecí qué respondió el otro. Sin diagnósticos, sólo curiosidad.' },
    { id:'dilema',     nombre:'El Dilema Imposible',   icono:'⚖️', categoria:'reflexion',   disponible:false, descripcion:'Dos opciones igual de difíciles. No hay respuesta correcta.' },
    { id:'quehariassi', nombre:'¿Qué harías si...?',  icono:'🤯', categoria:'reflexion',   disponible:false, descripcion:'Situaciones absurdas, románticas y filosóficas para responder.' },
    { id:'futuro',     nombre:'Nuestro Futuro',        icono:'🔮', categoria:'reflexion',   disponible:false, descripcion:'10 rondas imaginando cómo se ven juntos más adelante.' },
    { id:'maquinatiempo', nombre:'Máquina del Tiempo', icono:'⏳', categoria:'reflexion',   disponible:false, descripcion:'Recuerdos compartidos: ¿tienen la misma memoria de un momento?' },
    { id:'antesdedormir', nombre:'Antes de Dormir',    icono:'🌜', categoria:'reflexion',   disponible:false, descripcion:'Rutina nocturna de 5 preguntas: emoción, gratitud y algo divertido.' },
    { id:'album',      nombre:'Nuestro Álbum Invisible', icono:'📸', categoria:'reflexion', disponible:false, descripcion:'Describan escenas que guardarían para siempre, sin fotos de verdad.' },
    { id:'destino',    nombre:'El Destino Decide',     icono:'🎡', categoria:'reflexion',   disponible:false, descripcion:'Voten un plan; si no coinciden, decide la ruleta.' },

    // ---- COOPERATIVOS ----
    { id:'letras',     nombre:'Letras Compartidas',    icono:'🪶', categoria:'cooperativos', disponible:true,  descripcion:'Cadáver exquisito: escriben una historia de a turnos, cada uno con su color.' },
    { id:'jardin',     nombre:'El Jardín Compartido',  icono:'🌱', categoria:'cooperativos', disponible:true,  descripcion:'Riéguenlo y cuídenlo entre los dos para verlo florecer.' },
    { id:'ruleta',     nombre:'Ruleta de Citas',       icono:'🎡', categoria:'cooperativos', disponible:true,  descripcion:'Giren juntos y dejen que el azar elija el plan de hoy.' },
    { id:'mascota',    nombre:'Mascota Virtual',       icono:'🐱', categoria:'cooperativos', disponible:true, descripcion:'Cuiden a Chokurei entre los dos: comida, juego y mimos.' },
    { id:'arbol',      nombre:'Nuestro Árbol',         icono:'🌳', categoria:'cooperativos', disponible:false, descripcion:'Cada gesto lindo lo hace crecer, de semilla a árbol florecido.' },
    { id:'refugio',    nombre:'El Refugio',            icono:'🏡', categoria:'cooperativos', disponible:false, descripcion:'Diseñen juntos un patio virtual con lo que van ganando.' },
    { id:'puntoencuentro', nombre:'Punto de Encuentro', icono:'📍', categoria:'cooperativos', disponible:false, descripcion:'La línea de tiempo viva de todo lo que construyeron acá.' },
    { id:'dibujayadivina', nombre:'Dibuja y Adivina',  icono:'🎨', categoria:'cooperativos', disponible:false, descripcion:'Uno dibuja con el dedo, el otro adivina la palabra.' },
    { id:'cartas',     nombre:'Carta para abrir después', icono:'💌', categoria:'cooperativos', disponible:false, descripcion:'Escribí una carta que se abre recién en la fecha que elijas.' },
];

window.obtenerJuegosDeCategoria = function(categoriaId){
    return window.JUEGOS.filter(j => j.categoria === categoriaId);
};
window.obtenerCategoria = function(categoriaId){
    return window.CATEGORIAS.find(c => c.id === categoriaId);
};
