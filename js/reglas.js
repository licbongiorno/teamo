// ============================================================
// reglas.js — botón ❓ "¿Cómo se juega?" en todos los juegos.
// Abre una hoja con el objetivo, el paso a paso y algún consejo. En el
// Truco suma la tabla de qué carta mata a cuál (con los naipes
// dibujados) y cómo se cuenta el envido.
// La primera vez que se abre un juego, el ❓ late para que se note.
// ============================================================
(function () {
    // Los juegos de "consigna → cada uno responde a solas → se revela
    // junto" (motor-reflexion.js) comparten el mismo paso a paso.
    const PASOS_REFLEXION = [
        'Elegí una consigna de la lista o tocá la sorpresa 🎲.',
        'Cada uno responde a solas: el otro no ve tu respuesta hasta que respondan los dos.',
        'Cuando los dos respondieron, se revela todo junto.',
        'Las rondas quedan guardadas para releerlas cuando quieran.'
    ];
    const VIVO = 'Los dos tienen que estar conectados al mismo tiempo: cada uno toca "Estoy listo/a" y arranca una cuenta regresiva para los dos.';

    const R = {
        // ---------- CLÁSICOS ----------
        truco: {
            objetivo: 'Llegar primero a 15 o 30 tantos (se elige antes de empezar).',
            pasos: [
                'Cada mano se reparten 3 cartas y se juegan hasta 3 rondas: en cada ronda gana la carta más alta (ver la tabla). Gana la mano quien gana 2 rondas.',
                'Si una ronda empata ("parda"), define la siguiente. Si empatan todas, gana el que es mano.',
                '<b>Envido</b> (sólo en la primera ronda, antes del truco): se canta Envido, Real Envido o Falta Envido. Si el otro quiere, gana quien tenga más envido.',
                '<b>Truco</b>: en tu turno podés cantar Truco (vale 2), y el otro puede subir a Retruco (3) y Vale Cuatro (4), o decir "No quiero" y te llevás lo que valía antes.',
                'Con flor activada: si tenés 3 cartas del mismo palo, cantala y sumás 3.',
                '"Irse al mazo" le da al otro los tantos de la mano.'
            ],
            tips: ['Los tantos se anotan con fosforitos: cada cuadradito con diagonal son 5.', 'Si no te sale bien la cuenta, abajo de todo está "Corregir puntaje".'],
            extra: 'truco'
        },
        escoba: {
            objetivo: 'Juntar más puntos levantando cartas que sumen 15.',
            pasos: [
                'Hay 4 cartas en la mesa y cada uno recibe 3. Cuando se acaban las manos, se reparten 3 más.',
                'En tu turno elegí una carta de tu mano y las de la mesa que sumen 15 con ella, y tocá "Levantar".',
                'Si no podés sumar 15, tocá una carta y "Tirar carta": queda en la mesa.',
                'Si levantás todas las cartas de la mesa, es <b>¡Escoba!</b>: un punto extra.'
            ],
            tabla: [['Carta', 'Vale'], ['1 a 7', 'su número'], ['Sota (10)', '8'], ['Caballo (11)', '9'], ['Rey (12)', '10']],
            puntos: ['+1 quien tenga más cartas', '+1 quien tenga más oros', '+1 quien tenga el 7 de oro 🪙', '+1 por cada escoba', 'Al final, lo que queda en la mesa se lo lleva el último que levantó.']
        },
        chinchon: {
            objetivo: 'Armar tu mano en grupos y escaleras y cerrar con lo menos posible suelto.',
            pasos: [
                'Cada uno arranca con 7 cartas. En tu turno robá una: del mazo o la de arriba de la mesa.',
                'Después descartá una (tocala y "Descartar").',
                '<b>Grupo</b>: 3 o 4 cartas del mismo número. <b>Escalera</b>: 3 o más del mismo palo, seguidas.',
                'Cuando te queda a lo sumo una carta suelta, podés <b>Cerrar</b>: se comparan los puntos sueltos y gana quien tenga menos.'
            ],
            puntos: ['Cerrar y ganar: +1', 'Cerrar sin ninguna carta suelta (¡chinchón!): +3', 'Las cartas sueltas valen su número; las figuras, 10.'],
            tips: ['Arriba de tu mano ves cuántos puntos sueltos te quedarían con la carta elegida.']
        },
        uno: {
            objetivo: 'Quedarte sin cartas antes que el otro.',
            pasos: [
                'Cada uno arranca con 7 cartas. En tu turno tirá una del mismo color o del mismo número/símbolo que la del pozo.',
                'Si no tenés ninguna, robá del mazo (tocá el mazo o "Robar carta") y pasa el turno.',
                '🚫 Salto y 🔄 Reversa: de a dos hacen lo mismo, volvés a jugar.',
                '+2: el otro roba 2 y volvés a jugar. Comodín 🌈: elegís el color. 🌈+4: además el otro roba 4.',
                'Cuando te queda una sola carta, ¡gritá UNO! 📣'
            ]
        },
        ajedrez: {
            objetivo: 'Dar jaque mate: que el rey del otro esté atacado y no tenga cómo escaparse.',
            pasos: [
                'Empiezan las blancas (Nico). Cada uno ve sus piezas abajo.',
                'Tocá una pieza tuya: se marcan las casillas a las que puede ir. Tocá el destino para moverla.',
                'Valen todas las reglas: enroque, captura al paso y coronación (elegís la pieza).',
                'Si no hay movimientos posibles y el rey no está en jaque, o sólo quedan los reyes, es tablas.'
            ],
            tips: ['El rey en jaque se marca en rojo.', 'Si se complica, podés rendirte con 🏳️.']
        },
        damas: {
            objetivo: 'Comerte todas las fichas del otro.',
            pasos: [
                'Las fichas avanzan en diagonal, una casilla, hacia el lado del otro.',
                'Para comer, saltá por encima de una ficha del otro a la casilla vacía de atrás.',
                'Acá comer no es obligatorio: elegís vos.',
                'Al llegar a la última fila, la ficha corona 👑 y se vuelve dama: se mueve y come a cualquier distancia en diagonal, hacia adelante y hacia atrás.'
            ]
        },
        tateti: {
            objetivo: 'Hacer tres en línea (horizontal, vertical o diagonal).',
            pasos: [
                'Por turnos, cada uno pone su marca: Nico la X, Carito la O.',
                'La vuelta de tuerca: cada uno tiene sólo 3 marcas. Al poner la cuarta, se borra tu marca más vieja (la que titila).',
                'Así nunca hay empate: hay que pensar qué se va a borrar.'
            ]
        },
        conecta4: {
            objetivo: 'Hacer 4 fichas en línea: horizontal, vertical o diagonal.',
            pasos: ['Por turnos, tocá una columna: la ficha cae hasta el fondo.', 'Si se llena el tablero sin 4 en línea, es empate.'],
            tips: ['Las columnas del medio dan más posibilidades.', 'Fijate siempre si el otro está por hacer 4 y bloquealo.']
        },
        reversi: {
            objetivo: 'Terminar con más fichas de tu color en el tablero.',
            pasos: [
                'Nico (celeste) empieza. Poné tu ficha de modo que encierre en línea recta una o más fichas del otro entre la tuya nueva y otra tuya.',
                'Las fichas encerradas se dan vuelta y pasan a ser tuyas. Sólo podés jugar donde des vuelta al menos una.',
                'Si no tenés jugadas, pasás solo. Termina cuando ninguno puede jugar.'
            ],
            tips: ['Las esquinas no se pueden dar vuelta nunca: ¡valen oro!']
        },
        cajitas: {
            objetivo: 'Cerrar más cajitas que el otro.',
            pasos: ['Por turno, trazá una línea entre dos puntos vecinos.', 'Si cerrás el cuarto lado de una cajita, es tuya y volvés a jugar.', 'Cuando no quedan líneas, gana quien tenga más cajitas.'],
            tips: ['Evitá trazar el tercer lado de una cajita: se la regalás al otro.']
        },
        batallanaval: {
            objetivo: 'Hundir toda la flota del otro antes de que hunda la tuya.',
            pasos: ['Cada uno toca "Estoy listo" y ubica su flota tocando 7 casillas del tablero.', 'Por turnos, tocá una casilla del radar para atacar: 💥 es tocado, 💦 es agua.', 'Abajo ves tu flota y dónde te atacó el otro.', 'Gana quien hunde todas las casillas de barco del otro.']
        },
        ahorcado: {
            objetivo: 'Adivinar la palabra antes de que se complete el muñeco.',
            pasos: ['Uno propone una palabra secreta (y si quiere, una pista).', 'El otro toca letras: si está, aparece en su lugar; si no, se dibuja una parte del muñeco.', 'Con 6 errores se completa el muñeco y se pierde.']
        },
        veinte: {
            objetivo: 'Adivinar lo que pensó el otro con preguntas de sí o no.',
            pasos: ['Uno piensa una persona, objeto o lugar y lo escribe (el otro no lo ve).', 'El otro hace preguntas de sí/no, que el primero responde.', 'Hay 20 preguntas como máximo para arriesgar y acertar.']
        },

        // ---------- COMPETENCIA ----------
        frutas: { objetivo: 'Atrapar la mayor cantidad de frutas.', pasos: ['Mové la canasta para atrapar las frutas que caen.', 'Arrancás con 3 vidas ❤️: si se te cae una fruta, perdés una.', 'Los corazones suman vidas; los chocolates 🍫 te dejan sin ninguna.', 'Cada uno juega cuando quiere: se compara el mejor puntaje.'] },
        reflejos: { objetivo: 'Tocar más rápido que el otro cuando aparece la señal.', pasos: [VIVO, 'Esperá: cuando la pantalla se pone roja, tocá lo más rápido que puedas.', 'Si tocás antes de tiempo, perdés la ronda.'] },
        tiraafloja: { objetivo: 'Llevar el corazón hasta tu lado.', pasos: [VIVO, 'Tocá lo más rápido que puedas: Nico empuja hacia arriba, Carito hacia abajo.', 'Gana quien lleva el corazón hasta su punta.'] },
        palabraexplosiva: { objetivo: 'Anotar más palabras que el otro.', pasos: ['Sale una letra y una categoría. Tienen 30 segundos.', 'Escribí todas las palabras que se te ocurran que empiecen con esa letra.', 'Cada palabra que sólo vos pusiste vale 2; si la pusieron los dos, 1.'] },
        memoria: { objetivo: 'Recordar la secuencia de emojis completa.', pasos: ['Tocá "Mostrar secuencia": la ves 3 segundos.', 'Después tocá los emojis en el mismo orden y "Enviar".', 'La secuencia se va alargando: 5 → 6 → 7 → 8 → 10.'] },
        adivinaquien: { objetivo: 'Adivinar el personaje secreto del otro antes que él el tuyo.', pasos: ['Cada uno recibe un personaje secreto hecho de emojis.', 'Háganse preguntas de sí/no por el chat 💬 para ir descartando.', 'Cuando estés seguro, arriesgá.'] },
        decisiones: { objetivo: 'Ver si eligen lo mismo ante situaciones con 4 opciones.', pasos: PASOS_REFLEXION },
        quientienerazon: { objetivo: 'Llevar la cuenta eterna de sus discusiones tontas.', pasos: ['Creá un tema (¿la piña va en la pizza?).', 'Cada vez que alguien "gana" esa discusión, sumale un punto.', 'El tema nunca se cierra: el marcador crece para siempre.'] },
        duelomemes: { objetivo: 'Hacer reír al otro.', pasos: ['Escribí tu meme: texto más emojis.', 'El otro lo califica con la escala de risa.', 'Se arma un promedio: ¿quién hace reír más?'] },
        semaforo: { objetivo: 'Tener reflejos lo más parecidos posible: no es una carrera.', pasos: [VIVO, 'Hay 5 semáforos: esperá el verde y tocá apenas aparece.', 'Tocar antes del verde es semáforo perdido.', 'Al final se ve qué tan sincronizados están.'] },
        burbujas: { objetivo: 'Sumar más puntos en 30 segundos.', pasos: [VIVO, 'Tocá las burbujas que cruzan la pantalla: suman.', 'Las de pinches 🌵 restan: ¡no las toques!'] },
        bombas: { objetivo: 'Sumar más puntos en 30 segundos.', pasos: [VIVO, 'Tocá los corazones: suman.', 'Las bombas restan si las tocás.'] },
        pinatas: { objetivo: 'Sumar más puntos en 30 segundos.', pasos: [VIVO, 'Las piñatas aparecen un instante: tocalas antes de que se vayan.', 'Tocar varias seguidas sin errar sube el combo y multiplica los puntos.'] },
        carreraglobos: { objetivo: 'Que tu globo llegue primero a la meta.', pasos: [VIVO, 'Tocá lo más rápido posible para inflar tu globo y que avance.', 'Si en 30 segundos nadie llega, gana el que esté más lejos.'] },
        ritmo: { objetivo: 'Tocar más justo que el otro al compás.', pasos: [VIVO, 'Un círculo late cada poco más de un segundo, 16 veces.', 'Tocá justo cuando se agranda del todo.', 'Gana quien tenga mejor puntería promedio.'] },
        bloques: { objetivo: 'Aguantar más que el otro sin que se te llene la grilla.', pasos: [VIVO, 'Cada uno tiene su grilla. Tocá una columna para mandar ahí el bloque que cae.', 'Al completar una fila, se limpia. Cada 2 filas, le mandás una fila de basura al otro.', 'Pierde quien se llena hasta arriba.'] },
        calculo: { objetivo: 'Llegar primero a 5 puntos.', pasos: [VIVO, 'Los dos ven la misma cuenta.', 'El primero en tocar la respuesta correcta suma el punto.'] },
        stroop: { objetivo: 'Llegar primero a los puntos de la partida.', pasos: [VIVO, 'Aparece el nombre de un color escrito con otra tinta (ROJO en azul).', 'Tocá el color de la TINTA, no el que dice la palabra.'] },
        anagramas: { objetivo: 'Llegar primero a los puntos de la partida.', pasos: [VIVO, 'Aparecen las letras de una palabra desordenadas.', 'El primero en escribirla bien suma el punto.'] },
        tipeo: { objetivo: 'Llegar primero a 4 puntos.', pasos: [VIVO, 'Aparece una frase: escribila igualita.', 'El primero en terminarla bien suma el punto.'] },
        topo: { objetivo: 'Pegarle a más topos en 25 segundos.', pasos: [VIVO, 'El topo asoma en un pozo al azar: tocalo antes de que se esconda.'] },
        blancomovil: { objetivo: 'Sumar más puntos de precisión en 25 segundos.', pasos: [VIVO, 'Un anillo se va cerrando sobre el blanco.', 'Cuanto más cerca del centro lo toques, más puntos.'] },
        buscaminas: { objetivo: 'No ser el primero en pisar una mina.', pasos: ['Los dos destapan casillas del mismo tablero, al mismo tiempo (hay 5 minas escondidas).', 'El primero que pisa una mina 💥 pierde la ronda.', 'Si se destapa todo sin minas, gana quien destapó más.', 'Mejor de 3 rondas.'] },
        ppt: { objetivo: 'Ganar 3 de 5 rondas.', pasos: ['Los dos eligen piedra, papel o tijera a solas.', 'Cuando eligieron los dos, se revela.', 'Piedra le gana a tijera, tijera a papel y papel a piedra.'] },
        trivia: { objetivo: 'Llegar primero a 5 puntos.', pasos: [VIVO, 'Los dos ven la misma pregunta.', 'El primero en tocar la respuesta correcta suma el punto.'] },
        simon: { objetivo: 'Aguantar más niveles que el otro.', pasos: ['Miren la secuencia de colores.', 'Después repitanla cada uno en su pantalla.', 'Cada nivel suma un color. El primero que se equivoca pierde.'] },
        memoriarelampago: { objetivo: 'Juntar más parejas que el otro.', pasos: ['Hay 16 cartas boca abajo, el mismo mazo para los dos.', 'Dá vuelta dos cartas: si son iguales, la pareja es tuya.', 'Si no coinciden, se ven un instante y se vuelven a tapar.'] },
        batallacanciones: { objetivo: 'Elegir la canción que mejor le calce a cada tema.', pasos: PASOS_REFLEXION },
        mentiroso: {
            objetivo: 'Ser el último con dados.',
            pasos: [
                'Cada uno tiene 5 dados que sólo ve él.',
                'Por turnos se apuesta cuántos dados de una cara hay entre los dos ("hay cuatro ⚄"). Los ⚀ son comodines y cuentan para cualquier cara.',
                'Cada apuesta tiene que subir la cantidad, o mantenerla con una cara más alta.',
                'En vez de subir, podés decir <b>¡Dudo!</b>: se levantan los cubiletes. Si la apuesta no se cumple, pierde un dado quien apostó; si se cumple, quien dudó.'
            ],
            tips: ['Con tus dados y la cantidad de dados del otro, calculá: cada dado suyo tiene 1 en 3 de servirle a una cara (esa cara o un ⚀).']
        },
        generala: {
            objetivo: 'Sumar más puntos al completar las 11 categorías.',
            pasos: ['En tu turno tenés hasta 3 tiradas.', 'Entre tirada y tirada, tocá los dados que querés guardar.', 'Al final anotá en una categoría libre de tu planilla, o tachá una con 0.'],
            tabla: [['Categoría', 'Puntos (servida)'], ['Unos a Seises', 'suma de esa cara'], ['Escalera', '20 (25)'], ['Full', '30 (35)'], ['Póker', '40 (45)'], ['Generala', '50 (60)'], ['Doble generala', '100']],
            tips: ['"Servida" es cuando sale en la primera tirada.', 'La doble generala sólo vale si ya anotaste una generala.']
        },
        palabras: { objetivo: 'Encontrar más palabras en la grilla.', pasos: ['Los dos tienen la misma grilla de 4×4 letras y 90 segundos.', 'Uní letras vecinas (también en diagonal) sin repetir casilla, para formar palabras de 3 letras o más.', 'Las palabras que encuentran los dos no suman.', 'Al final se revisan entre ustedes.'] },
        tuttifrutti: { objetivo: 'Sumar más puntos completando categorías con la letra.', pasos: ['Los dos reciben la misma letra y 5 categorías.', 'El primero que completa todo puede cantar <b>¡BASTA!</b> y se corta para los dos.', 'Después cada uno revisa las respuestas del otro y rechaza las que no valgan.'], puntos: ['Respuesta válida: 10', 'Los dos pusieron lo mismo: 5', 'El otro no tiene una válida en esa categoría: 20'] },

        // ---------- CONEXIÓN ----------
        indagacion: { objetivo: 'Conocerse más con preguntas profundas.', pasos: ['Quien crea la carta responde primero, a solas.', 'El otro tiene que adivinar qué respondió.', 'Se revelan las dos juntas y quedan guardadas para releer.'] },
        verdadoreto: { objetivo: 'Animarse a la verdad o cumplir el reto.', pasos: ['Elegí verdad o reto.', 'Respondé con sinceridad o cumplí el reto que toque.', 'Las respuestas quedan guardadas bajo llave 🔒 hasta que se revelen.'] },
        conoceme: { objetivo: 'Ver cuánto se conocen: elegí qué haría el otro.', pasos: PASOS_REFLEXION },
        mentegemela: { objetivo: 'Ver qué porcentaje de coincidencia tienen.', pasos: ['Respondan 5 preguntas de opción múltiple, cada uno a solas.', 'Cuando los dos terminan, se ve el % de coincidencia.'] },
        adn: { objetivo: 'Armar el "ADN" visual de la pareja.', pasos: ['Respondan 20 preguntas cada uno.', 'Al final se arma un perfil visual de la relación.', 'No es un test clínico: es pura curiosidad.'] },
        mentiraverdad: { objetivo: 'Descubrir cuál de las tres afirmaciones es mentira.', pasos: ['Uno escribe 3 afirmaciones sobre sí mismo: 2 verdaderas y 1 mentira (y marca cuál es).', 'El otro elige cuál cree que es la mentira.', 'Se revela si acertó.'] },
        detective: { objetivo: 'Adivinar entre los dos los momentos que vivieron juntos.', pasos: PASOS_REFLEXION },
        nuncapregunte: { objetivo: 'Charlar de cosas que nunca se preguntaron.', pasos: PASOS_REFLEXION },
        serenata: { objetivo: 'Adivinar la canción tarareada.', pasos: ['Uno graba hasta 12 segundos tarareando una canción, sin decir cuál es.', 'El otro la escucha a ciegas y arriesga qué tema es.', 'Después se revela el título.'] },
        traductorenojos: { objetivo: 'Bajar un cambio antes de una charla difícil.', pasos: ['Escribí cómo te sentís, tal cual, con toda la bronca.', 'Mirá cómo suena en una versión más calma.', 'Es sólo para vos: no se guarda ni se manda a ningún lado.'] },
        capsulavoz: { objetivo: 'Mandarse un mensajito de voz por día.', pasos: ['Grabá hasta 10 segundos, una vez por día.', 'Apenas el otro lo escucha, se borra para siempre.'] },
        ruedapremios: { objetivo: 'Ganarse un premio para el próximo encuentro.', pasos: ['Giren la rueda.', 'Mitad premios tiernos 🌸, mitad picantes 🌶️.', 'Cumplan el que toque.'] },
        termometro: { objetivo: 'Contarse cómo están cada día.', pasos: ['Marcá del 1 al 10 cómo estás hoy.', 'Queda el historial de los últimos 14 días, uno al lado del otro.'] },
        trivianosotros: { objetivo: 'Acertar los gustos y costumbres del otro.', pasos: PASOS_REFLEXION },
        queprefieres: { objetivo: 'Ver cuántas veces coinciden.', pasos: ['Aparecen dos opciones: cada uno elige a solas.', 'Al revelar se ve si coincidieron.', 'La lista lleva el marcador de coincidencias.'] },
        masprobable: { objetivo: 'Ver si piensan lo mismo de cada uno.', pasos: ['Aparece una situación: voten a solas quién de los dos es más probable que lo haga.', 'Si coinciden, punto para la pareja.'] },
        completafrase: { objetivo: 'Completar la misma frase cada uno a su manera.', pasos: ['Aparece una frase empezada.', 'Cada uno la completa a solas.', 'Se revelan juntas.'] },
        preguntadia: { objetivo: 'Responder la misma pregunta, una por día.', pasos: ['Cada día sale una pregunta nueva, la misma para los dos.', 'Respondan a solas y se revela junta.', 'Se la podés mandar al otro por WhatsApp.'] },
        dosverdades: { objetivo: 'Engañar al otro, o descubrir su mentira.', pasos: ['Escribí tres cosas sobre vos: dos verdaderas y una inventada.', 'El otro tiene que descubrir cuál es la mentira.', 'Si la descubre suma él; si no, sumás vos. Se puede mandar por WhatsApp.'] },
        pingpong: { objetivo: 'Ir y venir con preguntas que nunca se repiten.', pasos: ['Elegí una pregunta (por categoría o sorpresa) y mandásela al otro.', 'El otro la responde y elige la próxima para devolvértela.', 'Cada pelotazo se puede mandar por WhatsApp con un link que abre el juego.'] },
        tepreguntoyo: { objetivo: 'Hacerle al otro tu propia pregunta.', pasos: ['Escribí tu pregunta.', 'Los dos la responden a solas y se revela junta.', 'Mientras el otro no respondió, se la podés mandar por WhatsApp.'] },

        // ---------- REFLEXIÓN ----------
        espejo: { objetivo: 'Responder y adivinar qué respondió el otro.', pasos: ['Los dos responden a solas.', 'Además, cada uno trata de adivinar qué dijo el otro.', 'Se revela todo junto: respuesta, predicción y qué tan cerca estuvieron.'] },
        sieteymedio: { objetivo: 'Acercarte a 7½ sin pasarte, y llevarte 5 manos.', pasos: ['Del 1 al 7 las cartas valen su número; la sota, el caballo y el rey, medio punto.', 'En cada mano uno es la banca y el otro el punto (se van turnando).', 'El punto pide cartas o se planta; su primera carta queda tapada para la banca. Si se pasa de 7½, pierde.', 'Después juega la banca. Gana el más cercano a 7½; si empatan, gana la banca.'], tips: ['Con 5 o más, pensalo dos veces antes de pedir.'] },
        pescar: { objetivo: 'Armar más juegos (las cuatro cartas de un mismo número) que el otro.', pasos: ['Tocá una carta tuya para pedirle al otro ese número.', 'Si tiene, te da todas las de ese número y seguís pidiendo.', 'Si no tiene: "¡Pescá!", sacás una del pozo. Si sacaste justo lo que pediste, seguís; si no, le toca al otro.', 'Cuando juntás las cuatro, se bajan solas como un juego. Al terminar, gana quien tiene más juegos.'], tips: ['Acordate de lo que te pidió el otro: ¡seguro lo tiene!'] },
        mastermind: { objetivo: 'Descifrar el código secreto del otro en menos intentos.', pasos: ['Primero cada uno elige en secreto 4 colores (se pueden repetir).', 'Por turnos probás un código: ⚫ es un color en su lugar justo, ⚪ un color que está pero en otro lugar.', 'Si el que empezó lo descifra, el otro tiene su vuelta para empatar.', 'Hay 10 intentos cada uno.'], tips: ['Probá primero dos colores repetidos (por ejemplo 🔴🔴🟠🟠) para ir descartando.'] },
        hex: { objetivo: 'Unir tus dos bordes con un camino continuo de fichas.', pasos: ['Nico 🔵 une el borde de arriba con el de abajo; Carito 🩷 el de la izquierda con el de la derecha.', 'Por turnos ponen una ficha en cualquier hexágono libre.', 'Regla del cambio: después de la primera ficha, el otro puede quedársela en vez de jugar.'], tips: ['El centro vale oro.', 'Dos fichas con dos hexágonos libres en común ya están casi unidas: el otro no puede cortar las dos.'] },
        fosforos: { objetivo: 'No llevarte el último fósforo.', pasos: ['Hay cuatro filas: 1, 3, 5 y 7 fósforos.', 'En tu turno tocá un fósforo: se marcan ese y los de su derecha. Sacás todos los marcados (siempre de una sola fila).', 'Quien se lleva el último, pierde.'], tips: ['Tratá de dejarle al otro filas de a pares iguales…'] },
        chancho: { objetivo: `Llegar primero a ${'100'} puntos.`, pasos: ['En tu turno tirás el dado y vas sumando lo que sale.', 'Podés seguir tirando o plantarte: si te plantás, guardás lo del turno.', 'Si sale un 1 🐷, perdés todo lo del turno y le toca al otro.'], tips: ['Plantarse alrededor de 20 suele ser buena idea… salvo que vayas perdiendo por mucho.'] },
        damaschinas: { objetivo: 'Llevar tus 10 fichas a la punta de la estrella de enfrente antes que el otro.', pasos: ['Tocá una ficha tuya y después un agujero marcado.', 'Podés mover a un agujero vecino, o saltar por encima de cualquier ficha (tuya o del otro) a un agujero libre.', 'Los saltos se encadenan: si después de saltar podés volver a saltar, el agujero final también aparece marcado.', 'Ganás cuando la punta de enfrente queda llena con tus fichas (si el otro dejó alguna ahí, igual vale).'], tips: ['Armá "escaleras" con tus fichas para hacer saltos largos.', 'No dejes fichas rezagadas en tu casa.'] },
        quoridor: { objetivo: 'Llegar con tu peón a la otra punta del tablero antes que el otro.', pasos: ['En tu turno elegí: mover el peón un casillero (si el otro está pegado, lo saltás) o poner una pared.', 'Las paredes ocupan dos casilleros y frenan a los dos. Cada uno tiene 10.', 'Nunca se puede encerrar del todo a nadie: siempre tiene que quedar un camino.'], tips: ['Abajo te dice cuántos pasos le faltan a cada uno: si vas perdiendo la carrera, ¡poné paredes!', 'Guardá algunas paredes para el final.'] },
        cifras: { objetivo: 'Acercarte lo más posible a la meta con los 6 números.', pasos: ['Tocá un número, una operación y otro número: el resultado aparece como número nuevo.', 'Cada número se usa una sola vez. Las divisiones tienen que dar exacto.', 'Cuando quieras, tocá "Mandar": se manda el número más cercano que tengas. A los 60 segundos se manda solo.', 'Gana quien queda más cerca. Al final se ve una solución posible.'], tips: ['Primero buscá un número cerca de la meta multiplicando, y después ajustá sumando o restando.'] },
        encadenadas: { objetivo: 'Encadenar palabras sin quedarte sin ideas.', pasos: ['Cada palabra empieza con la última sílaba de la anterior: casa → sapo → pozo.', 'Tenés 30 segundos. Si no llegás, perdés una vida y se arranca con una palabra nueva.', 'No se pueden repetir palabras.', 'Si el otro pone una palabra que no existe, tocá "no existe": pierde una vida y te vuelve a tocar a vos.'], tips: ['Las sílabas difíciles (como "ción" o "llo") son un arma: ¡usalas!'] },
        exquisito: { objetivo: 'Dibujar juntos un monstruo sin ver lo del otro.', pasos: ['Uno dibuja la cabeza, el otro el cuerpo y el primero las piernas.', 'De la parte anterior sólo ves una tirita del borde de abajo, para saber dónde seguir.', 'Cuando se dibuja la última parte, se revela el monstruo entero.'], tips: ['Dejá que tu dibujo toque el borde de abajo: así el otro sabe por dónde seguir.'] },
        momentos: { objetivo: 'Guardar los momentos épicos que viven jugando.', pasos: ['No hay que hacer nada: los momentos se guardan solos (hazañas, campeonatos, apuestas ganadas, misiones cooperativas cumplidas, sueños cumplidos, niveles de pareja…).', 'Tocá 📤 en cualquiera para compartirlo como imagen.'], tips: ['Los últimos también aparecen en Punto de Encuentro.'] },
        laberinto: { objetivo: 'Salir juntos del laberinto, nivel tras nivel.', pasos: ['El guía ve todas las paredes; el piloto no ve ninguna (sólo las que ya chocó).', 'El guía arma señales de flechitas y las manda; también pueden hablarse por el chat.', 'El piloto mueve la ficha 🐾 hasta la ⭐. Cada choque cuesta una vida ❤️.', 'Al pasar de nivel se cambian los roles. Son 5 niveles.'], tips: ['Mandá de a pocas flechas: es más fácil seguirlas.'] },
        cocina: { objetivo: 'Servir 8 pedidos en 2 minutos, en equipo.', pasos: ['Cada uno tiene 4 ingredientes en su alacena; el otro tiene los otros 4.', 'El plato es compartido: los dos agregan lo suyo. Cuando el plato coincide con un pedido, sale servido.', 'Si alguien agrega algo que no va en ningún pedido, el plato se quema.', 'Si se vencen 3 pedidos, se cierra la cocina.'], tips: ['Los ingredientes que te tocan a vos aparecen resaltados en los pedidos.', 'Pónganse de acuerdo en qué pedido arman primero.'] },
        faros: { objetivo: 'Encender los 16 faros: cada color del 1 al 4, en orden.', pasos: ['Ves las cartas del otro, pero no las tuyas.', 'En tu turno elegí una: dar una pista (un color o un número, y se marcan todas las cartas del otro que coinciden), jugar una carta tuya, o descartar una para recuperar una pista.', 'Si jugás una carta que no sigue en su color, cae un rayo ⛈️. Con 3 rayos termina la partida.', 'Completar un color devuelve una pista. Cuando se acaba el mazo, cada uno juega un turno más.'], tips: ['Hay tres 1 de cada color pero un solo 4: ¡no descartes los 4!', 'Una pista bien dada vale más que una jugada arriesgada.'] },
        treintayseis: { objetivo: 'Conocerse más (y enamorarse más) con las 36 preguntas de Arthur Aron.', pasos: ['Las preguntas van en orden, en tres sets que van ganando en profundidad.', 'Cada uno responde a solas; cuando los dos respondieron, se revela.', 'Al terminar las 36, mírense a los ojos cuatro minutos sin hablar (por videollamada si están lejos).'], tips: ['Sin apuro: un set por noche es ideal.', 'Lo mejor pasa en la charla después de revelar.'] },
        mapaamor: { objetivo: 'Ver cuánto conocen el mundo del otro.', pasos: ['Cada ronda es sobre uno de los dos (se van turnando).', 'Esa persona escribe la verdad sobre sí misma y la otra escribe lo que cree.', 'Al revelar, quien contó la verdad dice si el otro acertó, casi, o ni cerca.'], tips: ['Arriba se ve el porcentaje de aciertos de cada uno.'] },
        lenguajes: { objetivo: 'Descubrir cómo siente el amor cada uno.', pasos: ['Respondé 15 preguntas eligiendo lo que más te llega al corazón.', 'Ves tu lenguaje principal al toque; cuando el otro también lo hace, aparecen los dos resultados y consejos.'], tips: ['Pueden repetir el test cada tanto: los lenguajes cambian con el tiempo.'] },
        suenos: { objetivo: 'Armar juntos la lista de cosas para hacer en la vida.', pasos: ['Escriban sueños por categoría (o pidan una idea 💡).', 'Marquen 🙋 "Me animo" en los que se animan.', 'Cuando lo cumplan, toquen ✅ y súmenle una fotito de recuerdo.'] },
        dilema: { objetivo: 'Elegir entre dos opciones igual de difíciles.', pasos: PASOS_REFLEXION, tips: ['No hay respuesta correcta: lo lindo es charlar por qué eligieron eso.'] },
        quehariassi: { objetivo: 'Imaginar qué haría cada uno.', pasos: PASOS_REFLEXION },
        futuro: { objetivo: 'Imaginar cómo se ven juntos más adelante.', pasos: PASOS_REFLEXION },
        maquinatiempo: { objetivo: 'Ver si recuerdan igual los momentos compartidos.', pasos: PASOS_REFLEXION },
        antesdedormir: { objetivo: 'Cerrar el día juntos.', pasos: PASOS_REFLEXION },
        album: { objetivo: 'Guardar escenas para siempre, sin fotos.', pasos: PASOS_REFLEXION },
        destino: { objetivo: 'Decidir un plan.', pasos: ['Voten el plan que prefieren, cada uno a solas.', 'Si coinciden, ¡listo! Si no, decide la ruleta.'] },
        nostalgia: { objetivo: 'Mirar el resumen del mes que terminó.', pasos: ['Se arma solo: días que jugaron juntos, logros y momentos guardados.'] },

        // ---------- CUIDADO Y COOPERATIVOS ----------
        letras: { objetivo: 'Escribir juntos una historia.', pasos: ['Uno escribe un fragmento, después le toca al otro, cada uno con su color.', 'Sigan hasta donde quieran: queda guardada con su título para retomarla.'] },
        jardin: { objetivo: 'Hacer florecer el jardín entre los dos.', pasos: ['Riéguenlo y denle sol: el agua y el sol bajan con el tiempo.', 'Cuando uno cumple un objetivo en la vida real, regístrenlo y suman fertilizante 🧪.'] },
        ruleta: { objetivo: 'Que el azar elija el plan.', pasos: ['Cualquiera de los dos gira la ruleta.', 'Sale un plan para hoy o para cuando puedan.'] },
        mascota: { objetivo: 'Cuidar a Chokurei entre los dos.', pasos: ['Dale de comer, jugá con él, hacele mimos y bañalo: sus necesidades bajan con el tiempo.', 'Crece con la experiencia: de bebé a adulto. Si lo descuidan mucho, se enferma.', 'Hay tienda, mini-juegos, trucos para enseñarle y su casa para decorar.'] },
        arbol: { objetivo: 'Hacer crecer el árbol con gestos lindos.', pasos: ['Cada gesto lindo que registran lo hace crecer, de semilla a árbol florecido.'] },
        debeuna: { objetivo: 'No olvidarse de los favores.', pasos: ['Cuando el otro hace algo lindo por vos, anotalo como un "te debo una".', 'El que la recibió la cobra cuando quiera.'] },
        barometro: { objetivo: 'Hablar en serio sin lastimarse.', pasos: ['Lean las reglas de discusión sana.', 'Usen el indicador de turno para hablar sin interrumpirse.', 'Si hace falta, activen el timer de enfriamiento: se ve en los dos celulares.'] },
        refugio: { objetivo: 'Diseñar juntos el patio.', pasos: ['Con los puntos que ganan en los juegos, compren cosas para el patio.', 'Los puntos son de los dos: comprar resta del pozo compartido.'] },
        puntoencuentro: { objetivo: 'Ver todo lo que construyeron acá.', pasos: ['Es la línea de tiempo viva: se llena sola con los momentos de los demás juegos.'] },
        dibujayadivina: { objetivo: 'Adivinar lo que dibuja el otro.', pasos: ['Uno dibuja con el dedo una palabra secreta: el otro lo ve en vivo.', 'El otro adivina la palabra.', 'Al acertar, se cambian los roles.'] },
        menumisterioso: { objetivo: 'Inventar el plato más original.', pasos: ['A cada uno le tocan 3 ingredientes al azar.', 'Inventá un plato imaginario que use los tres.', 'Se revelan los dos a la vez.'] },
        cartas: { objetivo: 'Escribirle al otro para el futuro.', pasos: ['Escribí una carta y elegí la fecha.', 'Recién ese día se puede abrir.'] },
        capsula: { objetivo: 'Llenar juntos una cápsula del tiempo.', pasos: ['Elijan la fecha de apertura.', 'Vayan agregando notas y predicciones entre los dos.', 'Se abre sola cuando llega el día.'] },
        mapa: { objetivo: 'Guardar los lugares importantes.', pasos: ['Agreguen lugares por categoría: dónde se conocieron, dónde se van a encontrar, lugares para visitar.'] },
        escaperoom: { objetivo: 'Resolver las 3 etapas y "escapar" juntos.', pasos: ['Los dos ven el mismo acertijo.', 'Cualquiera puede escribir la respuesta.', 'Si acierta, se desbloquea la siguiente etapa.'] },
        sudoku: { objetivo: 'Completar la grilla entre los dos.', pasos: ['Toquen una celda vacía y elijan el número: los dos juegan al mismo tiempo, sin turnos.', 'Cada fila, columna y cuadro de 3×3 tiene que tener del 1 al 9 sin repetir.'] },
        cocodrilos: { objetivo: 'Llegar juntos a la meta de golpes en 30 segundos.', pasos: [VIVO, 'Los dos martillan el mismo tablero de 9 pozos: pegale al cocodrilo que asome.'] },
        pesca: { objetivo: 'Pescar juntos la meta de peces en 30 segundos.', pasos: [VIVO, 'Tocá los peces que cruzan la pantalla. Cuantos más estén jugando, más peces.'] },
        ladrillos: { objetivo: 'Romper la pared lo más rápido posible, entre los dos.', pasos: [VIVO, 'Cada toque de cualquiera rompe un ladrillo.', 'Se guarda el mejor tiempo de la pareja.'] },

        // ---------- NUEVOS DE PAREJA Y PALABRAS ----------
        onda: { objetivo: 'Sumar juntos la mayor cantidad de puntos en 8 rondas.', pasos: ['El que da la pista ve una escala (por ejemplo "de frío a caliente") y dónde está el blanco.', 'Escribe una pista que para él caiga justo ahí: una cosa, una comida, una persona…', 'El otro mueve el dial adonde cree que está y toca "¡Acá!".', 'Se revela: en el centro del blanco son 4 puntos, cerca 3, más o menos 2. Después se cambian los roles.'], tips: ['No hay respuestas correctas: lo lindo es descubrir cómo piensa el otro.'] },
        codigo: { objetivo: 'Encontrar juntos a los 15 agentes antes de que se acaben las 9 pistas.', pasos: ['Hay 25 palabras. Cada uno ve su propia clave: bordes verdes = sus agentes, bordes rojos = sus asesinos.', 'El que da la pista escribe UNA palabra y un número ("fruta 2") para que el otro encuentre sus agentes.', 'El otro toca palabras: si es agente de quien dio la pista, se descubre y puede seguir; si es neutral, termina el turno; si es un asesino… ¡pierden los dos!', 'Se turnan para dar pistas. Cada turno de adivinar gasta una pista.'], tips: ['Algunos agentes son de los dos: ¡pueden aparecer en las pistas de cualquiera!'] },
        mente: { objetivo: 'Pasar los 8 niveles tirando las cartas en orden… sin hablar.', pasos: ['Los dos tienen que estar conectados al mismo tiempo.', 'En el nivel 1 cada uno tiene 1 carta del 1 al 100; en el nivel 2, dos; y así.', 'Hay que ir tirando al centro de menor a mayor: tocá el botón para tirar tu carta más baja cuando sientas que es el momento.', 'Si tirás una y el otro tenía una más baja, pierden una vida ❤️. Tienen 3.'], tips: ['Con números bajos se tira rápido; con números altos, se espera. ¡Sincronícense!'] },
        palabradia: { objetivo: 'Adivinar la palabra del día en la menor cantidad de intentos.', pasos: ['Hay una palabra de 5 letras por día, la misma para los dos.', 'Escribí una palabra y tocá OK. Cada letra se pinta: 🟩 está y en su lugar, 🟨 está pero en otro lugar, gris no está.', 'Tenés 6 intentos.', 'Después comparan: ves los colores del otro, y sus palabras cuando vos terminaste.'], tips: ['Mantené la racha 🔥 jugando todos los días.'] },
        rosco: { objetivo: 'Acertar más palabras que el otro en tu rosco.', pasos: ['Los dos tienen el mismo rosco, pero cada uno juega en su celu con su reloj (150 segundos desde que toca "Empezar").', 'Para cada letra hay una definición: la respuesta empieza con esa letra (o la contiene).', 'Escribila y tocá Responder, o decí "¡Pasapalabra!" para volver después.', 'Gana quien acierta más; si empatan, quien erró menos.'] },
        sopa: { objetivo: 'Ser el primero en encontrar las 8 palabras.', pasos: ['Los dos tienen la misma sopa de letras de un tema, con 3 minutos.', 'Para marcar una palabra tocá su primera letra y después la última.', 'Pueden estar en horizontal, vertical, diagonal o al revés.', 'Si se termina el tiempo, gana quien haya encontrado más.'] },

        // ---------- NUEVOS DE CARTAS ----------
        guerra: { objetivo: 'Quedarte con todas las cartas.', pasos: ['Cada uno tiene medio mazo boca abajo.', 'Los dos tocan "Dar vuelta" (cada uno cuando quiere): la carta más alta se lleva las dos.', 'Si empatan, ¡GUERRA!: cada uno pone 3 cartas boca abajo y da vuelta otra. La más alta se lleva todo.', 'Si después de 120 rondas nadie se quedó con todo, gana quien tenga más.'], tabla: [['Orden', ''], ['Más alta', 'A, K, Q, J, 10…'], ['Más baja', '2']] },
        blackjack: {
            objetivo: 'Terminar con más fichas que el otro después de 8 manos.',
            pasos: ['Los dos juegan contra la casa, cada uno con 100 fichas. Primero apuestan.', 'Reciben 2 cartas. En tu turno: <b>Pedir</b> otra carta, <b>Plantarse</b> o <b>Doblar</b> (doble apuesta y una sola carta más).', 'Si te pasás de 21, perdés la apuesta.', 'Después la casa pide cartas hasta tener 17 o más.', 'Si le ganás a la casa cobrás tu apuesta; con blackjack (21 con las dos primeras cartas) cobrás 1 y medio.'],
            tabla: [['Carta', 'Vale'], ['2 a 10', 'su número'], ['J, Q, K', '10'], ['As', '1 u 11 (lo que más te convenga)']],
            tips: ['Con 17 o más casi siempre conviene plantarse.', 'Si la casa muestra un 4, 5 o 6, es más probable que se pase.']
        },
        poker: {
            objetivo: 'Dejar al otro sin fichas (o tener más después de 15 manos).',
            pasos: ['Cada uno tiene 200 fichas. En cada mano se ponen las ciegas (5 y 10) y reciben 2 cartas que sólo ven ustedes.', 'Se apuesta en cuatro rondas: antes del flop, con el flop (3 cartas en la mesa), el turn (la 4ª) y el river (la 5ª).', 'En tu turno podés <b>pasar</b> (si nadie apostó), <b>igualar</b>, <b>subir</b>, ir <b>all-in</b> o <b>retirarte</b>.', 'Al final se muestran las cartas: gana la mejor combinación de 5 entre tus 2 y las 5 de la mesa.'],
            tabla: [['Mano (de mayor a menor)', ''], ['Escalera de color', '5 seguidas del mismo palo'], ['Póker', '4 iguales'], ['Full', 'trío + par'], ['Color', '5 del mismo palo'], ['Escalera', '5 seguidas'], ['Trío', '3 iguales'], ['Doble par', 'dos pares'], ['Par', '2 iguales'], ['Carta alta', 'nada de lo anterior']],
            tips: ['Abajo de tus cartas ves qué mano tenés en cada momento.']
        },

        // ---------- NUEVOS DE MESA ----------
        gomoku: { objetivo: 'Armar 5 piedras seguidas antes que el otro.', pasos: ['Por turnos, tocá una intersección vacía para poner tu piedra.', 'Valen las líneas horizontales, verticales y diagonales.', 'El primero en hacer 5 seguidas gana.'], tips: ['Un "cuatro abierto" (con lugar libre en las dos puntas) ya no se puede tapar: ¡cuidado!'] },
        mancala: {
            objetivo: 'Tener más semillas en tu granero al final.',
            pasos: ['Cada uno tiene 6 pozos (los de abajo son los tuyos) y un granero a la derecha.', 'Tocá un pozo tuyo: se levantan todas sus semillas y se siembran de a una hacia la derecha, saltando el granero del otro.', 'Si la última cae en tu granero, jugás de nuevo.', 'Si la última cae en un pozo tuyo vacío, te llevás esa y todas las del pozo de enfrente.', 'Cuando un lado se vacía, termina: lo que queda va a su dueño.'],
            tips: ['Contá las semillas: con la cantidad justa para llegar a tu granero, ganás un turno extra.']
        },
        serpientes: { objetivo: 'Llegar primero a la casilla 100.', pasos: ['Por turnos, tirá el dado y tu ficha avanza.', 'Si caés al pie de una escalera 🪜, subís. Si caés en la cabeza de una serpiente 🐍, bajás.', 'Hay que llegar justo al 100: si te pasás, rebotás para atrás.', 'Con un 6 volvés a tirar.'] },
        parchis: {
            objetivo: 'Llevar tus 4 fichas a la meta antes que el otro.',
            pasos: ['Tirá el dado. Con un 6 sacás una ficha de tu casa (y con cualquier 6 volvés a tirar).', 'Tocá la ficha que querés mover: avanza lo que salió en el dado.', 'Si caés donde hay una ficha del otro, te la comés y vuelve a su casa (y tirás otra vez). En las casillas ★ no se come.', 'Al dar la vuelta entrás a tu pasillo de color: hay que llegar justo a la meta.', 'Tres 6 seguidos pierden el turno.'],
            tips: ['Las fichas que brillan son las que se pueden mover con ese dado.']
        },
        domino: {
            objetivo: 'Quedarte sin fichas antes que el otro.',
            pasos: ['Cada uno arranca con 7 fichas; el resto queda en el pozo.', 'En tu turno, poné una ficha que tenga el mismo número que una de las puntas de la mesa.', 'Si entra en las dos puntas, elegís de qué lado.', 'Si no tenés ninguna, robá del pozo; si el pozo se acabó, pasás.', 'Si los dos pasan seguido es tranque: gana quien tenga menos puntos en la mano.']
        },
        backgammon: {
            objetivo: 'Sacar tus 15 fichas del tablero antes que el otro.',
            pasos: ['Tirá los dos dados: movés una ficha con cada dado (con dobles, cuatro movimientos).', 'Tocá una pila tuya y después el punto adonde va. No podés caer donde el otro tiene 2 o más.', 'Si caés sobre una ficha sola del otro, te la comés: va a la barra y tiene que volver a entrar antes de mover otra.', 'Cuando tus 15 fichas están en tu casa (el cuadrante de abajo a la derecha), las empezás a sacar.'],
            tips: ['Dos fichas juntas forman un punto seguro: no las pueden comer.', 'Los "pips" te dicen cuánto les falta a cada uno para terminar.']
        },
    };

    // Jerarquía del truco, de mayor a menor: [palo, número] (null = todos los palos).
    const JERARQUIA = [
        [['espada', 1]], [['basto', 1]], [['espada', 7]], [['oro', 7]],
        [[null, 3]], [[null, 2]], [['copa', 1], ['oro', 1]], [[null, 12]], [[null, 11]], [[null, 10]],
        [['copa', 7], ['basto', 7]], [[null, 6]], [[null, 5]], [[null, 4]]
    ];
    const PLURAL_NUM = { 10: 'las sotas', 11: 'los caballos', 12: 'los reyes' };
    function extraTruco() {
        const mini = (palo, n) => window.animJuegos && window.animJuegos.naipe ? `<span class="reglas-mini">${window.animJuegos.naipe(palo, n)}</span>` : '';
        const filas = JERARQUIA.map((grupo, i) => {
            const cartas = grupo.map(([p, n]) => p ? mini(p, n) : ['espada', 'basto', 'oro', 'copa'].map(x => mini(x, n)).join('')).join('');
            const nombre = grupo.map(([p, n]) => p ? `${n === 1 ? 'As' : n} de ${p}` : (PLURAL_NUM[n] || `los ${n}`)).join(' y ');
            return `<div class="reglas-jerarquia"><span class="reglas-pos">${i + 1}</span><span class="reglas-cartas">${cartas}</span><span>${nombre.replace('As de espada', 'As de espada (el ancho)').replace('As de basto', 'As de basto (el ancho falso)')}</span></div>`;
        }).join('');
        return `<h4>🃏 Qué carta mata a cuál (de mayor a menor)</h4>${filas}
            <h4>🔢 Cómo se cuenta el envido</h4>
            <ul class="reglas-lista">
                <li>Si tenés dos cartas del mismo palo: <b>20 + la suma</b> de esas dos.</li>
                <li>Las figuras (Sota, Caballo, Rey) valen 0 para el envido.</li>
                <li>Si no tenés dos del mismo palo, vale tu carta más alta (las figuras, 0).</li>
                <li>Ejemplos: 7 y 6 de oro = <b>33</b> (lo máximo) · 5 de copa y Rey de copa = <b>25</b> · 7 de espada, 4 de basto, 2 de oro = <b>7</b>.</li>
                <li>Si empatan, gana el que es mano.</li>
            </ul>
            <h4>💰 Cuánto vale cada canto</h4>
            <table class="reglas-tabla"><tr><th>Canto</th><th>Querido</th><th>No querido</th></tr>
                <tr><td>Envido</td><td>2</td><td>1</td></tr><tr><td>Real Envido</td><td>3</td><td>1</td></tr>
                <tr><td>Falta Envido</td><td>lo que le falta al que va ganando</td><td>1</td></tr>
                <tr><td>Envido + Envido</td><td>4</td><td>2</td></tr>
                <tr><td>Truco</td><td>2</td><td>1</td></tr><tr><td>Retruco</td><td>3</td><td>2</td></tr><tr><td>Vale Cuatro</td><td>4</td><td>3</td></tr>
                <tr><td>Flor</td><td colspan="2">3 al cantarla</td></tr></table>
            <div class="texto-tenue" style="font-size:0.75rem;">Si no se canta truco, la mano vale 1.</div>`;
    }

    function tabla(filas) {
        return `<table class="reglas-tabla">${filas.map((f, i) => `<tr>${f.map(c => i === 0 ? `<th>${c}</th>` : `<td>${c}</td>`).join('')}</tr>`).join('')}</table>`;
    }
    function abrirReglas(juego) {
        cerrarReglas();
        const r = R[juego];
        if (!r) return;
        marcarVisto(juego);
        const info = (window.JUEGOS || []).find(j => j.id === juego) || {};
        const fondo = document.createElement('div');
        fondo.className = 'compu-selector-fondo reglas-fondo';
        fondo.onclick = (ev) => { if (ev.target === fondo) cerrarReglas(); };
        fondo.innerHTML = `<div class="compu-selector panel reglas-hoja" role="dialog" aria-label="Cómo se juega">
            <div class="compu-selector-titulo">❓ ¿Cómo se juega ${info.nombre ? info.nombre : ''}?</div>
            <div class="reglas-objetivo">🎯 ${r.objetivo}</div>
            <h4>Paso a paso</h4>
            <ol class="reglas-lista">${r.pasos.map(p => `<li>${p}</li>`).join('')}</ol>
            ${r.tabla ? tabla(r.tabla) : ''}
            ${r.puntos ? `<h4>Puntos</h4><ul class="reglas-lista">${r.puntos.map(p => `<li>${p}</li>`).join('')}</ul>` : ''}
            ${r.extra === 'truco' ? extraTruco() : ''}
            ${r.tips ? `<div class="reglas-tips">${r.tips.map(t => `<div>💡 ${t}</div>`).join('')}</div>` : ''}
            ${typeof window.jugarContraCompu === 'function' && document.querySelector(`#pantalla-${juego} .btn-compu`) ? `<div class="texto-tenue" style="font-size:0.78rem; margin-top:10px;">🤖 ¿Querés practicar? Tocá "vs compu" arriba.</div>` : ''}
            <button type="button" class="btn-principal" style="margin-top:12px;" onclick="cerrarReglasJuego()">¡Entendido!</button>
        </div>`;
        document.body.appendChild(fondo);
    }
    function cerrarReglas() { document.querySelectorAll('.reglas-fondo').forEach(x => x.remove()); }

    function vistos() { try { return JSON.parse(localStorage.getItem('reglasVistas') || '[]'); } catch (e) { return []; } }
    function marcarVisto(juego) {
        const v = vistos();
        if (!v.includes(juego)) { v.push(juego); try { localStorage.setItem('reglasVistas', JSON.stringify(v)); } catch (e) { /* nada */ } }
        document.querySelectorAll(`#pantalla-${juego} .btn-reglas`).forEach(b => b.classList.remove('nuevo'));
    }

    function ponerBotones() {
        const v = vistos();
        Object.keys(R).forEach(juego => {
            const fila = document.querySelector(`#pantalla-${juego} .fila-superior-juego`);
            if (!fila || fila.querySelector('.btn-reglas')) return;
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'btn-reglas' + (v.includes(juego) ? '' : ' nuevo');
            b.title = '¿Cómo se juega?';
            b.setAttribute('aria-label', '¿Cómo se juega?');
            b.textContent = '❓';
            b.onclick = () => abrirReglas(juego);
            const antes = fila.querySelector('.btn-compu') || fila.querySelector('.btn-cerrar-juego');
            fila.insertBefore(b, antes);
        });
    }

    window.abrirReglasJuego = abrirReglas;
    window.cerrarReglasJuego = cerrarReglas;
    window.REGLAS_JUEGOS = R;
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ponerBotones);
    else ponerBotones();
})();
