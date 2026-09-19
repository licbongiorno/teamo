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
// iconoSvg: id de <symbol> en js/icon-sprite.js (ver renderMenuPrincipal
// en navegacion.js y categorias/*.html, que arman el <svg><use> con esto).
window.CATEGORIAS = [
    { id: 'clasicos',     nombre: 'Clásicos',     icono: '🃏', iconoSvg: 'icono-cartas',    color: '#a8d8ff' },
    { id: 'competencia',  nombre: 'Competencia',  icono: '⚡', iconoSvg: 'icono-rayo',      color: '#ffb3c6' },
    { id: 'conexion',     nombre: 'Conexión',     icono: '💬', iconoSvg: 'icono-chat',      color: '#c9b6ff' },
    { id: 'reflexion',    nombre: 'Reflexión',    icono: '🌙', iconoSvg: 'icono-luna',      color: '#a8edea' },
    { id: 'cuidado',          nombre: 'Cuidado Compartido', icono: '🌱', iconoSvg: 'icono-brote',    color: '#b8e8c9' },
    { id: 'cooperativosvivo', nombre: 'Cooperativos en Vivo', icono: '🤝', iconoSvg: 'icono-personas', color: '#f5d9a0' },
];

window.JUEGOS = [
    // ---- CLÁSICOS ----
    { id:'ahorcado',   nombre:'Ahorcado',            icono:'🔤', iconoSvg:'icono-horca', categoria:'clasicos',    disponible:true,  descripcion:'Uno propone una palabra secreta, el otro la adivina letra por letra.' },
    { id:'truco',      nombre:'Truco Argentino',     icono:'🃏', iconoSvg:'icono-cartas', categoria:'clasicos',    disponible:true,  descripcion:'El clásico de a dos, con envido y truco, reglas reales.' },
    { id:'damas',      nombre:'Damas',                icono:'⚫', iconoSvg:'icono-ficha-dama', categoria:'clasicos',    disponible:true,  descripcion:'El tablero de siempre, con damas voladoras al coronar.' },
    { id:'ajedrez',    nombre:'Ajedrez',              icono:'♟️', iconoSvg:'icono-peon', categoria:'clasicos',    disponible:true,  descripcion:'Partida completa: enroque, al paso, jaque y jaque mate.' },
    { id:'tateti',     nombre:'Ta-Te-Ti Infinito',   icono:'❌', iconoSvg:'icono-grilla-equis', categoria:'clasicos',    disponible:true, descripcion:'Tres en línea, pero cada jugador sólo tiene 3 marcas activas.' },
    { id:'conecta4',   nombre:'Conecta 4',            icono:'🔴', iconoSvg:'icono-cuatro-en-linea', categoria:'clasicos',    disponible:true, descripcion:'El clásico de las fichas que caen, a 4 en línea.' },
    { id:'escoba',     nombre:'Escoba de 15',        icono:'🧹', iconoSvg:'icono-escoba', categoria:'clasicos',    disponible:true, descripcion:'Cartas españolas: sumá 15 y levantá la mesa.' },
    { id:'batallanaval', nombre:'Batalla Naval',      icono:'🚢', iconoSvg:'icono-barco', categoria:'clasicos',    disponible:true, descripcion:'Ubicá tu flota y hundí la del otro por turnos.' },

    // ---- COMPETENCIA ----
    { id:'frutas',     nombre:'Atrapar Frutas',       icono:'🍓', iconoSvg:'icono-manzana', categoria:'competencia', disponible:true,  descripcion:'30 segundos atrapando frutas. Se compara el mejor puntaje.' },
    { id:'reflejos',   nombre:'Duelo de Reflejos',    icono:'💥', iconoSvg:'icono-rayo', categoria:'competencia', disponible:true, descripcion:'Esperá la señal y tocá lo más rápido posible.' },
    { id:'tiraafloja', nombre:'Tira y Afloja',        icono:'❤️', iconoSvg:'icono-soga', categoria:'competencia', disponible:true, descripcion:'Toques rápidos para llevar el corazón a tu lado.' },
    { id:'palabraexplosiva', nombre:'Palabra Explosiva', icono:'💣', iconoSvg:'icono-bomba', categoria:'competencia', disponible:true, descripcion:'Una letra, una categoría, 30 segundos para anotar palabras.' },
    { id:'memoria',    nombre:'Memoria de Emojis',    icono:'🧠', iconoSvg:'icono-mosaico', categoria:'competencia', disponible:true, descripcion:'Memorizá la secuencia antes de que desaparezca.' },
    { id:'adivinaquien', nombre:'Adivina Quién',      icono:'❓', iconoSvg:'icono-rostro-interrogante', categoria:'competencia', disponible:true, descripcion:'Personaje secreto en emojis: preguntá y arriesgá.' },
    { id:'decisiones', nombre:'Duelo de Decisiones',  icono:'🎯', iconoSvg:'icono-cruce', categoria:'competencia', disponible:true, descripcion:'Situaciones con 4 opciones: ¿eligen lo mismo?' },
    { id:'quientienerazon', nombre:'¿Quién Tiene Razón?', icono:'⚖️', iconoSvg:'icono-balanza', categoria:'competencia', disponible:true, descripcion:'El marcador permanente de sus discusiones tontas. Nunca se cierra el debate.' },

    // ---- CONEXIÓN ----
    { id:'indagacion', nombre:'Cartas de Indagación', icono:'🌙', iconoSvg:'icono-luna', categoria:'conexion',    disponible:true,  descripcion:'Preguntas profundas para antes de dormir: respondé y adiviná qué respondió el otro.' },
    { id:'verdadoreto', nombre:'Verdad o Reto',       icono:'🔥', iconoSvg:'icono-llama', categoria:'conexion',    disponible:true,  descripcion:'El clásico de siempre, con preguntas y retos pensados para nosotros.' },
    { id:'conoceme',   nombre:'¿Cuánto me conocés?',  icono:'🧩', iconoSvg:'icono-rompecabezas', categoria:'conexion',    disponible:true, descripcion:'Elegí qué haría el otro y comparen qué tanto se conocen.' },
    { id:'mentegemela', nombre:'Mente Gemela',        icono:'👯', iconoSvg:'icono-gemelos', categoria:'conexion',    disponible:true, descripcion:'5 preguntas de opción múltiple: ¿qué % de coincidencia tienen?' },
    { id:'adn',        nombre:'ADN de la Pareja',      icono:'🧬', iconoSvg:'icono-adn', categoria:'conexion',    disponible:true, descripcion:'20 preguntas que arman un perfil visual de la relación.' },
    { id:'mentiraverdad', nombre:'Mentira o Verdad',  icono:'🎭', iconoSvg:'icono-mascara', categoria:'conexion',    disponible:true, descripcion:'Tres afirmaciones, una es mentira. ¿La descubrís?' },
    { id:'detective',  nombre:'Detective de Nosotros', icono:'🔍', iconoSvg:'icono-lupa', categoria:'conexion',    disponible:true, descripcion:'Pistas sobre momentos que vivieron juntos, a adivinar entre los dos.' },
    { id:'nuncapregunte', nombre:'Lo que nunca te pregunté', icono:'💭', iconoSvg:'icono-globo-pensamiento', categoria:'conexion', disponible:true, descripcion:'Preguntas inesperadas para conversaciones profundas.' },

    // ---- REFLEXIÓN ----
    { id:'espejo',     nombre:'El Espejo',             icono:'🪞', iconoSvg:'icono-espejo-mano', categoria:'reflexion',   disponible:true, descripcion:'Respondé y predecí qué respondió el otro. Sin diagnósticos, sólo curiosidad.' },
    { id:'dilema',     nombre:'El Dilema Imposible',   icono:'⚖️', iconoSvg:'icono-balanza', categoria:'reflexion',   disponible:true, descripcion:'Dos opciones igual de difíciles. No hay respuesta correcta.' },
    { id:'quehariassi', nombre:'¿Qué harías si...?',  icono:'🤯', iconoSvg:'icono-remolino', categoria:'reflexion',   disponible:true, descripcion:'Situaciones absurdas, románticas y filosóficas para responder.' },
    { id:'futuro',     nombre:'Nuestro Futuro',        icono:'🔮', iconoSvg:'icono-bola-cristal', categoria:'reflexion',   disponible:true, descripcion:'10 rondas imaginando cómo se ven juntos más adelante.' },
    { id:'maquinatiempo', nombre:'Máquina del Tiempo', icono:'⏳', iconoSvg:'icono-reloj-arena', categoria:'reflexion',   disponible:true, descripcion:'Recuerdos compartidos: ¿tienen la misma memoria de un momento?' },
    { id:'antesdedormir', nombre:'Antes de Dormir',    icono:'🌜', iconoSvg:'icono-luna-zzz', categoria:'reflexion',   disponible:true, descripcion:'Rutina nocturna de 5 preguntas: emoción, gratitud y algo divertido.' },
    { id:'album',      nombre:'Nuestro Álbum Invisible', icono:'📸', iconoSvg:'icono-camara', categoria:'reflexion', disponible:true, descripcion:'Describan escenas que guardarían para siempre, sin fotos de verdad.' },
    { id:'destino',    nombre:'El Destino Decide',     icono:'🎡', iconoSvg:'icono-ruleta', categoria:'reflexion',   disponible:true, descripcion:'Voten un plan; si no coinciden, decide la ruleta.' },

    // ---- COOPERATIVOS ----
    { id:'letras',     nombre:'Letras Compartidas',    icono:'🪶', iconoSvg:'icono-pluma', categoria:'cooperativosvivo', disponible:true,  descripcion:'Cadáver exquisito: escriben una historia de a turnos, cada uno con su color.' },
    { id:'jardin',     nombre:'El Jardín Compartido',  icono:'🌱', iconoSvg:'icono-brote', categoria:'cuidado', disponible:true,  descripcion:'Riéguenlo y cuídenlo entre los dos para verlo florecer.' },
    { id:'ruleta',     nombre:'Ruleta de Citas',       icono:'🎡', iconoSvg:'icono-ruleta', categoria:'cooperativosvivo', disponible:true,  descripcion:'Giren juntos y dejen que el azar elija el plan de hoy.' },
    { id:'mascota',    nombre:'Mascota Virtual',       icono:'🐱', iconoSvg:'icono-pata', categoria:'cuidado', disponible:true, descripcion:'Cuiden a Chokurei entre los dos: comida, juego y mimos.' },
    { id:'arbol',      nombre:'Nuestro Árbol',         icono:'🌳', iconoSvg:'icono-arbol', categoria:'cuidado', disponible:true, descripcion:'Cada gesto lindo lo hace crecer, de semilla a árbol florecido.' },
    { id:'refugio',    nombre:'El Refugio',            icono:'🏡', iconoSvg:'icono-casa', categoria:'cuidado', disponible:true, descripcion:'Diseñen juntos un patio virtual con lo que van ganando.' },
    { id:'puntoencuentro', nombre:'Punto de Encuentro', icono:'📍', iconoSvg:'icono-pin-mapa', categoria:'cuidado', disponible:true, descripcion:'La línea de tiempo viva de todo lo que construyeron acá.' },
    { id:'dibujayadivina', nombre:'Dibuja y Adivina',  icono:'🎨', iconoSvg:'icono-paleta', categoria:'cooperativosvivo', disponible:true, descripcion:'Uno dibuja con el dedo, el otro adivina la palabra.' },
    { id:'menumisterioso', nombre:'Menú Misterioso',  icono:'🍳', iconoSvg:'icono-olla', categoria:'cooperativosvivo', disponible:true, descripcion:'3 ingredientes al azar para cada uno: inventen un plato imaginario y revélenlo a la vez.' },
    { id:'semaforo',       nombre:'El Semáforo',       icono:'🚦', iconoSvg:'icono-semaforo', categoria:'competencia', disponible:true, descripcion:'5 semáforos: esperen el verde y toquen. Al final vemos qué tan sincronizados están sus reflejos.' },
    { id:'cartas',     nombre:'Carta para abrir después', icono:'💌', iconoSvg:'icono-sobre', categoria:'cuidado', disponible:true, descripcion:'Escribí una carta que se abre recién en la fecha que elijas.' },
    { id:'capsula',    nombre:'Cápsula del Tiempo',    icono:'📦', iconoSvg:'icono-capsula', categoria:'cuidado', disponible:true, descripcion:'Vayan agregando notas y predicciones a una cápsula que se abre sola en la fecha que elijan.' },
    { id:'mapa',       nombre:'Mapa de Nuestros Lugares', icono:'🗺️', iconoSvg:'icono-mapa-doblado', categoria:'cuidado', disponible:true, descripcion:'Guarden lugares importantes: recuerdos, lugares para visitar y sitios clave.' },
    { id:'escaperoom', nombre:'Escape Room Virtual',   icono:'🔓', iconoSvg:'icono-candado', categoria:'cooperativosvivo', disponible:true, descripcion:'3 etapas de acertijos para resolver juntos y "escapar".' },
    { id:'ruedapremios', nombre:'Rueda de Premios',    icono:'🎡', iconoSvg:'icono-ruleta', categoria:'conexion',    disponible:true, descripcion:'Giren la rueda: mitad premios tiernos, mitad picantes.' },
    { id:'termometro', nombre:'Termómetro del Día',    icono:'🌡️', iconoSvg:'icono-termometro', categoria:'conexion',    disponible:true, descripcion:'Marquen del 1 al 10 cómo están hoy. Queda un historial de los últimos días.' },
    { id:'veinte',     nombre:'20 Preguntas',          icono:'❔', iconoSvg:'icono-signo-veinte', categoria:'clasicos',    disponible:true, descripcion:'Uno piensa algo, el otro pregunta sí/no hasta adivinar.' },
    { id:'trivianosotros', nombre:'Trivia de Nosotros', icono:'🧠', iconoSvg:'icono-pregunta', categoria:'conexion',   disponible:true, descripcion:'Preguntas sobre gustos y costumbres de cada uno.' },
    { id:'batallacanciones', nombre:'Batalla de Canciones', icono:'🎵', iconoSvg:'icono-nota-musical', categoria:'competencia', disponible:true, descripcion:'Sale un tema, cada uno propone una canción que le calce.' },
    { id:'sudoku',     nombre:'Sudoku de a Dos',       icono:'🧩', iconoSvg:'icono-sudoku', categoria:'cooperativosvivo', disponible:true, descripcion:'Sudoku colaborativo: los dos completan celdas a la vez, sin esperar turnos.' },
    { id:'uno',        nombre:'UNO',                   icono:'🎴', iconoSvg:'icono-piezas-uno', categoria:'clasicos',    disponible:true, descripcion:'El clásico juego de cartas, de a dos.' },
    { id:'chinchon',   nombre:'Chinchón',               icono:'🃑', iconoSvg:'icono-baraja-espanola', categoria:'clasicos',    disponible:true, descripcion:'El clásico juego de cartas español: armá grupos y escaleras para cerrar la mano.' },
    { id:'burbujas',   nombre:'Rompe Burbujas',        icono:'🫧', iconoSvg:'icono-burbujas', categoria:'competencia', disponible:true, descripcion:'Duelo en vivo: tocá las burbujas, evitá los pinches. Gana quien tenga más puntos en 30 segundos.' },
    { id:'bombas',     nombre:'Esquivá las Bombas',    icono:'💣', iconoSvg:'icono-bomba', categoria:'competencia', disponible:true, descripcion:'Duelo en vivo: atrapá corazones, evitá las bombas.' },
    { id:'pinatas',    nombre:'Derribá Piñatas',       icono:'🎯', iconoSvg:'icono-pinata', categoria:'competencia', disponible:true, descripcion:'Duelo en vivo: tocá las piñatas antes de que se vayan. Los combos multiplican los puntos.' },
    { id:'carreraglobos', nombre:'Carrera de Globos',  icono:'🎈', iconoSvg:'icono-globo-carrera', categoria:'competencia', disponible:true, descripcion:'Tocá lo más rápido posible para inflar tu globo. El primero en llegar a la meta gana.' },
    { id:'ritmo',      nombre:'Ritmo a Dúo',           icono:'🥁', iconoSvg:'icono-tambor', categoria:'competencia', disponible:true, descripcion:'Tocá al compás de un pulso que se repite. Gana quien tenga mejor puntería.' },
    { id:'bloques',    nombre:'Batalla de Bloques',    icono:'🧱', iconoSvg:'icono-bloques-tetris', categoria:'competencia', disponible:true, descripcion:'Tipo Tetris de a dos: cada uno en su propia grilla, mandándose líneas de basura entre sí.' },
    { id:'cocodrilos', nombre:'Martillo de Cocodrilos', icono:'🐊', iconoSvg:'icono-cocodrilo', categoria:'cooperativosvivo', disponible:true, descripcion:'Cooperativo en vivo: los dos martillan el mismo tablero. ¿Llegan a la meta juntos?' },
    { id:'pesca',      nombre:'Pesca Cooperativa',     icono:'🎣', iconoSvg:'icono-anzuelo', categoria:'cooperativosvivo', disponible:true, descripcion:'Cooperativo en vivo: entre los dos, pesquen los peces que cruzan la pantalla.' },
    { id:'ladrillos',  nombre:'Rompe Ladrillos a Dúo', icono:'🧱', iconoSvg:'icono-ladrillos', categoria:'cooperativosvivo', disponible:true, descripcion:'Cooperativo: una pared compartida, ¿cuánto tardan los dos en dejarla limpia?' },

    // ---- DUELOS EN TIEMPO REAL (tanda 1) ----
    { id:'calculo',    nombre:'Cálculo Mental Rayo',   icono:'🧮', iconoSvg:'icono-calculadora', categoria:'competencia', disponible:true, descripcion:'Duelo en vivo: la misma cuenta para los dos, el primero en tocar la respuesta correcta suma el punto.' },
    { id:'stroop',     nombre:'Stroop a Dos',          icono:'🎨', iconoSvg:'icono-gotas-color', categoria:'competencia', disponible:true, descripcion:'Duelo en vivo: tocá el color de la tinta, no el que dice la palabra. Más difícil de lo que parece.' },
    { id:'anagramas',  nombre:'Carrera de Anagramas',  icono:'🔤', iconoSvg:'icono-letras-caoticas', categoria:'competencia', disponible:true, descripcion:'Duelo en vivo: letras desordenadas, el primero en escribir la palabra correcta gana la ronda.' },
    { id:'tipeo',      nombre:'Tipeo Relámpago',       icono:'⌨️', iconoSvg:'icono-teclado', categoria:'competencia', disponible:true, descripcion:'Duelo en vivo: la misma frase para los dos, el primero en escribirla igual suma el punto.' },

    // ---- DUELOS EN TIEMPO REAL (tanda 2) ----
    { id:'topo',        nombre:'Topo Veloz',           icono:'🐹', iconoSvg:'icono-topo', categoria:'competencia', disponible:true, descripcion:'Duelo en vivo: el topo aparece en un pozo al azar, tocalo antes de que se esconda.' },
    { id:'blancomovil', nombre:'Blanco Móvil',         icono:'🎯', iconoSvg:'icono-diana', categoria:'competencia', disponible:true, descripcion:'Duelo en vivo: un anillo se cierra sobre el blanco, tocalo lo más cerca posible del centro.' },
    { id:'buscaminas',  nombre:'Buscaminas Relámpago', icono:'💣', iconoSvg:'icono-mina', categoria:'competencia', disponible:true, descripcion:'Mismo tablero para los dos: el primero que pisa una mina pierde la ronda.' },

    // ---- DUELOS EN TIEMPO REAL (tanda 3) ----
    { id:'ppt',              nombre:'Piedra, Papel o Tijera', icono:'✊', iconoSvg:'icono-puno', categoria:'competencia', disponible:true, descripcion:'El clásico de toda la vida, pero llevando la cuenta. Mejor de 5.' },
    { id:'trivia',           nombre:'Trivia Relámpago',       icono:'🧠', iconoSvg:'icono-rayo-pregunta', categoria:'competencia', disponible:true, descripcion:'Duelo en vivo: la misma pregunta para los dos, el primero en acertar suma el punto.' },
    { id:'simon',            nombre:'Simón Dice a Dos',       icono:'🔴', iconoSvg:'icono-cuatro-colores', categoria:'competencia', disponible:true, descripcion:'Miren la secuencia de colores y repitanla cada uno en su pantalla. Crece un color por nivel.' },
    { id:'memoriarelampago', nombre:'Memoria Relámpago',      icono:'🍓', iconoSvg:'icono-cartas-rayo', categoria:'competencia', disponible:true, descripcion:'Un mismo mazo para los dos: el que arma una pareja se la lleva. Gana quien junte más.' },
];

window.obtenerJuegosDeCategoria = function(categoriaId){
    return window.JUEGOS.filter(j => j.categoria === categoriaId);
};
window.obtenerCategoria = function(categoriaId){
    return window.CATEGORIAS.find(c => c.id === categoriaId);
};
