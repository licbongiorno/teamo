// ==================== TRIVIA RELÁMPAGO ====================
// La misma pregunta para los dos (se elige con una fórmula a partir
// del número de ronda, mismo patrón que Cálculo Mental Rayo). El
// primero en tocar la respuesta correcta suma el punto. A 5 gana.
const META_TRIVIA = 5;
// Banco por temas (t). La respuesta correcta va siempre primera (c: 0)
// porque las opciones se mezclan igual en cada ronda (barajarRnd), así
// es más fácil revisar que cada respuesta sea la correcta.
const BANCO_TRIVIA = [
    {"t": "Geografía", "p": "¿Cuál es la capital de Japón?", "o": ["Tokio", "Seúl", "Pekín", "Bangkok"], "c": 0},
    {"t": "Geografía", "p": "¿Cuál es el océano más grande?", "o": ["Pacífico", "Atlántico", "Índico", "Ártico"], "c": 0},
    {"t": "Geografía", "p": "¿En qué continente está Egipto?", "o": ["África", "Asia", "Europa", "Oceanía"], "c": 0},
    {"t": "Geografía", "p": "¿Cuál es la capital de Australia?", "o": ["Canberra", "Sídney", "Melbourne", "Perth"], "c": 0},
    {"t": "Geografía", "p": "¿Cuál es el país más grande del mundo por superficie?", "o": ["Rusia", "Canadá", "China", "Estados Unidos"], "c": 0},
    {"t": "Geografía", "p": "¿Cuál es la montaña más alta del mundo?", "o": ["Everest", "K2", "Aconcagua", "Kilimanjaro"], "c": 0},
    {"t": "Geografía", "p": "¿Cuál es la capital de Canadá?", "o": ["Ottawa", "Toronto", "Montreal", "Vancouver"], "c": 0},
    {"t": "Geografía", "p": "¿Qué país tiene forma de bota?", "o": ["Italia", "Grecia", "Portugal", "Croacia"], "c": 0},
    {"t": "Geografía", "p": "¿Cuál es el desierto cálido más grande del mundo?", "o": ["Sahara", "Atacama", "Gobi", "Kalahari"], "c": 0},
    {"t": "Geografía", "p": "¿Cuál es la capital de Brasil?", "o": ["Brasilia", "Río de Janeiro", "San Pablo", "Salvador"], "c": 0},
    {"t": "Geografía", "p": "¿En qué país está la Torre Eiffel?", "o": ["Francia", "Bélgica", "Suiza", "Italia"], "c": 0},
    {"t": "Geografía", "p": "¿Cuál es la capital de Perú?", "o": ["Lima", "Cusco", "Quito", "La Paz"], "c": 0},
    {"t": "Geografía", "p": "¿Qué río atraviesa Londres?", "o": ["Támesis", "Sena", "Danubio", "Rin"], "c": 0},
    {"t": "Geografía", "p": "¿Cuál es el país más poblado de Sudamérica?", "o": ["Brasil", "Argentina", "Colombia", "Perú"], "c": 0},
    {"t": "Geografía", "p": "¿Cuál es la capital de Chile?", "o": ["Santiago", "Valparaíso", "Concepción", "Antofagasta"], "c": 0},
    {"t": "Geografía", "p": "¿En qué continente está Mongolia?", "o": ["Asia", "Europa", "África", "Oceanía"], "c": 0},
    {"t": "Geografía", "p": "¿Cuál es la capital de Uruguay?", "o": ["Montevideo", "Punta del Este", "Colonia", "Salto"], "c": 0},
    {"t": "Geografía", "p": "¿Qué país tiene más pirámides antiguas?", "o": ["Sudán", "Egipto", "México", "Perú"], "c": 0},
    {"t": "Geografía", "p": "¿Cuál es la capital de Alemania?", "o": ["Berlín", "Múnich", "Fráncfort", "Hamburgo"], "c": 0},
    {"t": "Geografía", "p": "¿Cuál es la capital de Colombia?", "o": ["Bogotá", "Medellín", "Cali", "Cartagena"], "c": 0},
    {"t": "Geografía", "p": "¿Qué país es conocido como 'la tierra del sol naciente'?", "o": ["Japón", "China", "Corea del Sur", "Tailandia"], "c": 0},
    {"t": "Geografía", "p": "¿Cuál es la capital de Egipto?", "o": ["El Cairo", "Alejandría", "Luxor", "Giza"], "c": 0},
    {"t": "Geografía", "p": "¿En qué país está Machu Picchu?", "o": ["Perú", "Bolivia", "Ecuador", "Chile"], "c": 0},
    {"t": "Geografía", "p": "¿Cuál es la capital de España?", "o": ["Madrid", "Barcelona", "Sevilla", "Valencia"], "c": 0},
    {"t": "Geografía", "p": "¿Qué estrecho separa Europa de África?", "o": ["Gibraltar", "Bósforo", "Magallanes", "Bering"], "c": 0},
    {"t": "Geografía", "p": "¿Cuál es la isla más grande del mundo?", "o": ["Groenlandia", "Australia", "Madagascar", "Borneo"], "c": 0},
    {"t": "Geografía", "p": "¿Cuál es la capital de México?", "o": ["Ciudad de México", "Guadalajara", "Monterrey", "Cancún"], "c": 0},
    {"t": "Geografía", "p": "¿En qué país está la ciudad de Marrakech?", "o": ["Marruecos", "Túnez", "Argelia", "Egipto"], "c": 0},
    {"t": "Argentina", "p": "¿Cuál es la montaña más alta de América?", "o": ["Aconcagua", "Ojos del Salado", "Fitz Roy", "Lanín"], "c": 0},
    {"t": "Argentina", "p": "¿En qué año se declaró la independencia argentina?", "o": ["1816", "1810", "1806", "1853"], "c": 0},
    {"t": "Argentina", "p": "¿En qué ciudad se declaró la independencia argentina?", "o": ["San Miguel de Tucumán", "Buenos Aires", "Córdoba", "Rosario"], "c": 0},
    {"t": "Argentina", "p": "¿Quién creó la bandera argentina?", "o": ["Manuel Belgrano", "José de San Martín", "Mariano Moreno", "Domingo Sarmiento"], "c": 0},
    {"t": "Argentina", "p": "¿Qué se celebra el 25 de mayo?", "o": ["La Revolución de Mayo", "La Independencia", "El Día de la Bandera", "El Día de la Tradición"], "c": 0},
    {"t": "Argentina", "p": "¿En qué provincia están las Cataratas del Iguazú?", "o": ["Misiones", "Corrientes", "Entre Ríos", "Formosa"], "c": 0},
    {"t": "Argentina", "p": "¿Cuál es la capital de la provincia de Córdoba?", "o": ["Córdoba", "Villa Carlos Paz", "Río Cuarto", "Villa María"], "c": 0},
    {"t": "Argentina", "p": "¿En qué provincia está el glaciar Perito Moreno?", "o": ["Santa Cruz", "Chubut", "Tierra del Fuego", "Neuquén"], "c": 0},
    {"t": "Argentina", "p": "¿Cuál es la ciudad más austral de Argentina?", "o": ["Ushuaia", "Río Gallegos", "Río Grande", "El Calafate"], "c": 0},
    {"t": "Argentina", "p": "¿Quién escribió el 'Martín Fierro'?", "o": ["José Hernández", "Jorge Luis Borges", "Domingo Sarmiento", "Leopoldo Lugones"], "c": 0},
    {"t": "Argentina", "p": "¿Quién escribió 'Rayuela'?", "o": ["Julio Cortázar", "Ernesto Sabato", "Jorge Luis Borges", "Manuel Puig"], "c": 0},
    {"t": "Argentina", "p": "¿Qué científico argentino ganó el Nobel de Medicina en 1947?", "o": ["Bernardo Houssay", "Luis Federico Leloir", "César Milstein", "René Favaloro"], "c": 0},
    {"t": "Argentina", "p": "¿Qué se celebra el 20 de junio en Argentina?", "o": ["El Día de la Bandera", "El Día de la Independencia", "El Día del Padre", "El Día del Maestro"], "c": 0},
    {"t": "Argentina", "p": "¿Cuál es la flor nacional argentina?", "o": ["El ceibo", "El jacarandá", "La rosa", "El lapacho"], "c": 0},
    {"t": "Argentina", "p": "¿En qué provincia está la Quebrada de Humahuaca?", "o": ["Jujuy", "Salta", "Tucumán", "Catamarca"], "c": 0},
    {"t": "Argentina", "p": "¿Cuál es el río que pasa por Buenos Aires y la separa de Uruguay?", "o": ["Río de la Plata", "Paraná", "Uruguay", "Salado"], "c": 0},
    {"t": "Argentina", "p": "¿Qué ave es símbolo nacional argentino?", "o": ["El hornero", "El cóndor", "El ñandú", "El colibrí"], "c": 0},
    {"t": "Argentina", "p": "¿Quién cruzó los Andes con el Ejército de los Andes?", "o": ["José de San Martín", "Manuel Belgrano", "Martín Miguel de Güemes", "Juan Manuel de Rosas"], "c": 0},
    {"t": "Argentina", "p": "¿Cuál es la capital de Mendoza?", "o": ["Mendoza", "San Rafael", "Godoy Cruz", "Malargüe"], "c": 0},
    {"t": "Argentina", "p": "¿En qué barrio porteño está Caminito?", "o": ["La Boca", "San Telmo", "Palermo", "Recoleta"], "c": 0},
    {"t": "Argentina", "p": "¿Qué cirujano argentino desarrolló la técnica del bypass coronario?", "o": ["René Favaloro", "Bernardo Houssay", "Luis Agote", "César Milstein"], "c": 0},
    {"t": "Argentina", "p": "¿Qué argentino inventó un método de transfusión de sangre citrada?", "o": ["Luis Agote", "René Favaloro", "Ladislao Biro", "Raúl Pateras Pescara"], "c": 0},
    {"t": "Argentina", "p": "¿Qué inventó Ladislao Biro en Argentina?", "o": ["La birome", "El colectivo", "El dulce de leche", "La huella digital"], "c": 0},
    {"t": "Argentina", "p": "¿Cuál es la provincia más grande de Argentina por superficie?", "o": ["Buenos Aires", "Santa Cruz", "Chubut", "Córdoba"], "c": 0},
    {"t": "Argentina", "p": "¿Cuál es la capital de la provincia de Buenos Aires?", "o": ["La Plata", "Mar del Plata", "Bahía Blanca", "CABA"], "c": 0},
    {"t": "Argentina", "p": "¿Cuántas provincias tiene Argentina?", "o": ["23", "20", "24", "25"], "c": 0},
    {"t": "Ciencia", "p": "¿Cuántos huesos tiene el cuerpo humano adulto?", "o": ["206", "186", "226", "246"], "c": 0},
    {"t": "Ciencia", "p": "¿Cuál es el planeta más grande del sistema solar?", "o": ["Júpiter", "Saturno", "Neptuno", "Urano"], "c": 0},
    {"t": "Ciencia", "p": "¿Cuál es el metal líquido a temperatura ambiente?", "o": ["Mercurio", "Plomo", "Estaño", "Zinc"], "c": 0},
    {"t": "Ciencia", "p": "¿Qué gas es el más abundante en el aire?", "o": ["Nitrógeno", "Oxígeno", "Dióxido de carbono", "Hidrógeno"], "c": 0},
    {"t": "Ciencia", "p": "¿Qué instrumento mide la temperatura?", "o": ["Termómetro", "Barómetro", "Altímetro", "Manómetro"], "c": 0},
    {"t": "Ciencia", "p": "¿Cuál es el hueso más largo del cuerpo humano?", "o": ["Fémur", "Húmero", "Tibia", "Radio"], "c": 0},
    {"t": "Ciencia", "p": "¿Cuál es el símbolo químico del oro?", "o": ["Au", "Ag", "Or", "Go"], "c": 0},
    {"t": "Ciencia", "p": "¿Cuál es el símbolo químico del agua?", "o": ["H₂O", "CO₂", "O₂", "NaCl"], "c": 0},
    {"t": "Ciencia", "p": "¿Qué planeta es conocido como el planeta rojo?", "o": ["Marte", "Venus", "Júpiter", "Mercurio"], "c": 0},
    {"t": "Ciencia", "p": "¿Cuál es el planeta más cercano al Sol?", "o": ["Mercurio", "Venus", "Marte", "Tierra"], "c": 0},
    {"t": "Ciencia", "p": "¿Cuántos planetas tiene el sistema solar?", "o": ["8", "7", "9", "10"], "c": 0},
    {"t": "Ciencia", "p": "¿A qué temperatura hierve el agua al nivel del mar?", "o": ["100 °C", "90 °C", "80 °C", "120 °C"], "c": 0},
    {"t": "Ciencia", "p": "¿Qué órgano bombea la sangre?", "o": ["El corazón", "El hígado", "Los pulmones", "Los riñones"], "c": 0},
    {"t": "Ciencia", "p": "¿Cuál es el órgano más grande del cuerpo humano?", "o": ["La piel", "El hígado", "El cerebro", "El intestino"], "c": 0},
    {"t": "Ciencia", "p": "¿Qué parte de la planta hace la fotosíntesis principalmente?", "o": ["Las hojas", "Las raíces", "Las flores", "El tallo"], "c": 0},
    {"t": "Ciencia", "p": "¿Quién propuso la teoría de la relatividad?", "o": ["Albert Einstein", "Isaac Newton", "Galileo Galilei", "Nikola Tesla"], "c": 0},
    {"t": "Ciencia", "p": "¿Qué científica ganó dos premios Nobel en ciencias distintas?", "o": ["Marie Curie", "Rosalind Franklin", "Ada Lovelace", "Lise Meitner"], "c": 0},
    {"t": "Ciencia", "p": "¿Cuál es la velocidad aproximada de la luz?", "o": ["300.000 km/s", "30.000 km/s", "3.000 km/s", "3.000.000 km/s"], "c": 0},
    {"t": "Ciencia", "p": "¿Qué tipo de animal es la ballena?", "o": ["Mamífero", "Pez", "Anfibio", "Reptil"], "c": 0},
    {"t": "Ciencia", "p": "¿Cuántas patas tiene una araña?", "o": ["8", "6", "10", "12"], "c": 0},
    {"t": "Ciencia", "p": "¿Cuántas patas tiene un insecto?", "o": ["6", "4", "8", "10"], "c": 0},
    {"t": "Ciencia", "p": "¿Qué gas exhalamos al respirar?", "o": ["Dióxido de carbono", "Oxígeno", "Helio", "Metano"], "c": 0},
    {"t": "Ciencia", "p": "¿Cuál es el satélite natural de la Tierra?", "o": ["La Luna", "Fobos", "Europa", "Titán"], "c": 0},
    {"t": "Ciencia", "p": "¿Qué estudia la botánica?", "o": ["Las plantas", "Los animales", "Las rocas", "Las estrellas"], "c": 0},
    {"t": "Ciencia", "p": "¿Cuál es el elemento químico con símbolo 'O'?", "o": ["Oxígeno", "Oro", "Osmio", "Oganesón"], "c": 0},
    {"t": "Ciencia", "p": "¿Qué vitamina produce el cuerpo con la luz del sol?", "o": ["Vitamina D", "Vitamina C", "Vitamina A", "Vitamina B12"], "c": 0},
    {"t": "Ciencia", "p": "¿Cuál es la estrella más cercana a la Tierra?", "o": ["El Sol", "Próxima Centauri", "Sirio", "Betelgeuse"], "c": 0},
    {"t": "Ciencia", "p": "¿Qué planeta tiene los anillos más visibles?", "o": ["Saturno", "Júpiter", "Urano", "Neptuno"], "c": 0},
    {"t": "Ciencia", "p": "¿Cuántos cromosomas tiene normalmente una célula humana?", "o": ["46", "23", "44", "48"], "c": 0},
    {"t": "Ciencia", "p": "¿Cuál es el animal terrestre más rápido?", "o": ["Guepardo", "León", "Caballo", "Avestruz"], "c": 0},
    {"t": "Ciencia", "p": "¿Cuál es el animal más grande del planeta?", "o": ["La ballena azul", "El elefante africano", "El tiburón ballena", "La jirafa"], "c": 0},
    {"t": "Ciencia", "p": "¿Qué animal es el único mamífero capaz de volar?", "o": ["El murciélago", "La ardilla voladora", "El colibrí", "El pingüino"], "c": 0},
    {"t": "Ciencia", "p": "¿Cuántos corazones tiene un pulpo?", "o": ["3", "1", "2", "4"], "c": 0},
    {"t": "Historia", "p": "¿En qué año llegó Colón a América?", "o": ["1492", "1500", "1453", "1519"], "c": 0},
    {"t": "Historia", "p": "¿En qué año terminó la Segunda Guerra Mundial?", "o": ["1945", "1939", "1918", "1950"], "c": 0},
    {"t": "Historia", "p": "¿En qué año cayó el Muro de Berlín?", "o": ["1989", "1991", "1979", "1985"], "c": 0},
    {"t": "Historia", "p": "¿Qué civilización construyó Machu Picchu?", "o": ["Los incas", "Los mayas", "Los aztecas", "Los olmecas"], "c": 0},
    {"t": "Historia", "p": "¿Quién fue el primer ser humano en pisar la Luna?", "o": ["Neil Armstrong", "Buzz Aldrin", "Yuri Gagarin", "Michael Collins"], "c": 0},
    {"t": "Historia", "p": "¿En qué año el ser humano llegó a la Luna?", "o": ["1969", "1959", "1972", "1965"], "c": 0},
    {"t": "Historia", "p": "¿Quién fue el primer ser humano en viajar al espacio?", "o": ["Yuri Gagarin", "Neil Armstrong", "John Glenn", "Valentina Tereshkova"], "c": 0},
    {"t": "Historia", "p": "¿Qué imperio construyó el Coliseo?", "o": ["El romano", "El griego", "El egipcio", "El persa"], "c": 0},
    {"t": "Historia", "p": "¿En qué año comenzó la Revolución Francesa?", "o": ["1789", "1776", "1810", "1848"], "c": 0},
    {"t": "Historia", "p": "¿Quién pintó la Capilla Sixtina?", "o": ["Miguel Ángel", "Leonardo da Vinci", "Rafael", "Donatello"], "c": 0},
    {"t": "Historia", "p": "¿Qué barco se hundió en 1912 tras chocar con un iceberg?", "o": ["El Titanic", "El Lusitania", "El Britannic", "El Queen Mary"], "c": 0},
    {"t": "Historia", "p": "¿Quién inventó la imprenta de tipos móviles en Europa?", "o": ["Johannes Gutenberg", "Leonardo da Vinci", "Galileo Galilei", "Martín Lutero"], "c": 0},
    {"t": "Historia", "p": "¿Qué civilización inventó la escritura cuneiforme?", "o": ["Los sumerios", "Los egipcios", "Los chinos", "Los griegos"], "c": 0},
    {"t": "Historia", "p": "¿Quién fue Cleopatra?", "o": ["Reina de Egipto", "Emperatriz romana", "Reina de Persia", "Faraona de Nubia"], "c": 0},
    {"t": "Historia", "p": "¿Qué país regaló la Estatua de la Libertad a Estados Unidos?", "o": ["Francia", "Inglaterra", "España", "Italia"], "c": 0},
    {"t": "Historia", "p": "¿Quién fue Nelson Mandela?", "o": ["Presidente de Sudáfrica", "Rey de Etiopía", "Presidente de Kenia", "Primer ministro de Nigeria"], "c": 0},
    {"t": "Historia", "p": "¿En qué ciudad se celebraron los primeros Juegos Olímpicos modernos (1896)?", "o": ["Atenas", "París", "Londres", "Roma"], "c": 0},
    {"t": "Historia", "p": "¿Qué muralla se construyó para proteger a China de invasiones?", "o": ["La Gran Muralla", "El Muro de Adriano", "La Muralla Roja", "El Muro de Berlín"], "c": 0},
    {"t": "Historia", "p": "¿Cómo se llamaba el barco de Darwin en su gran viaje?", "o": ["Beagle", "Santa María", "Endeavour", "Victoria"], "c": 0},
    {"t": "Historia", "p": "¿Quién fue el primer presidente de Estados Unidos?", "o": ["George Washington", "Abraham Lincoln", "Thomas Jefferson", "John Adams"], "c": 0},
    {"t": "Arte", "p": "¿Quién pintó la Mona Lisa?", "o": ["Leonardo da Vinci", "Miguel Ángel", "Rafael", "Botticelli"], "c": 0},
    {"t": "Arte", "p": "¿Quién pintó 'La noche estrellada'?", "o": ["Vincent van Gogh", "Claude Monet", "Pablo Picasso", "Salvador Dalí"], "c": 0},
    {"t": "Arte", "p": "¿Quién escribió 'Don Quijote de la Mancha'?", "o": ["Miguel de Cervantes", "Lope de Vega", "Francisco de Quevedo", "Federico García Lorca"], "c": 0},
    {"t": "Arte", "p": "¿Quién escribió 'Cien años de soledad'?", "o": ["Gabriel García Márquez", "Mario Vargas Llosa", "Isabel Allende", "Pablo Neruda"], "c": 0},
    {"t": "Arte", "p": "¿Quién escribió 'Romeo y Julieta'?", "o": ["William Shakespeare", "Charles Dickens", "Oscar Wilde", "Jane Austen"], "c": 0},
    {"t": "Arte", "p": "¿Quién pintó el 'Guernica'?", "o": ["Pablo Picasso", "Joan Miró", "Salvador Dalí", "Diego Velázquez"], "c": 0},
    {"t": "Arte", "p": "¿Quién escribió 'El Principito'?", "o": ["Antoine de Saint-Exupéry", "Julio Verne", "Victor Hugo", "Albert Camus"], "c": 0},
    {"t": "Arte", "p": "¿Qué escritor creó a Sherlock Holmes?", "o": ["Arthur Conan Doyle", "Agatha Christie", "Edgar Allan Poe", "Charles Dickens"], "c": 0},
    {"t": "Arte", "p": "¿Quién escribió la saga de Harry Potter?", "o": ["J. K. Rowling", "J. R. R. Tolkien", "Suzanne Collins", "Stephenie Meyer"], "c": 0},
    {"t": "Arte", "p": "¿Quién escribió 'El Señor de los Anillos'?", "o": ["J. R. R. Tolkien", "C. S. Lewis", "George R. R. Martin", "Philip Pullman"], "c": 0},
    {"t": "Arte", "p": "¿Qué pintora mexicana es famosa por sus autorretratos?", "o": ["Frida Kahlo", "Tarsila do Amaral", "Remedios Varo", "Leonora Carrington"], "c": 0},
    {"t": "Arte", "p": "¿Qué poeta chileno ganó el Nobel en 1971?", "o": ["Pablo Neruda", "Gabriela Mistral", "Vicente Huidobro", "Nicanor Parra"], "c": 0},
    {"t": "Arte", "p": "¿Quién escribió 'El Aleph'?", "o": ["Jorge Luis Borges", "Julio Cortázar", "Adolfo Bioy Casares", "Ernesto Sabato"], "c": 0},
    {"t": "Arte", "p": "¿Quién creó a Mafalda?", "o": ["Quino", "Fontanarrosa", "Liniers", "Caloi"], "c": 0},
    {"t": "Arte", "p": "¿En qué museo está la Mona Lisa?", "o": ["El Louvre", "El Prado", "El MoMA", "Los Uffizi"], "c": 0},
    {"t": "Arte", "p": "¿Quién escribió 'La Odisea'?", "o": ["Homero", "Sófocles", "Virgilio", "Platón"], "c": 0},
    {"t": "Arte", "p": "¿Quién esculpió 'El David'?", "o": ["Miguel Ángel", "Donatello", "Bernini", "Rodin"], "c": 0},
    {"t": "Arte", "p": "¿Quién escribió '1984'?", "o": ["George Orwell", "Aldous Huxley", "Ray Bradbury", "H. G. Wells"], "c": 0},
    {"t": "Música", "p": "¿Cuántas cuerdas tiene una guitarra clásica?", "o": ["6", "4", "5", "7"], "c": 0},
    {"t": "Música", "p": "¿En qué país se originó el tango?", "o": ["Argentina", "España", "Brasil", "Cuba"], "c": 0},
    {"t": "Música", "p": "¿Qué banda inglesa grabó 'Hey Jude'?", "o": ["The Beatles", "The Rolling Stones", "Queen", "Pink Floyd"], "c": 0},
    {"t": "Música", "p": "¿Quién era el cantante de Queen?", "o": ["Freddie Mercury", "Elton John", "David Bowie", "Mick Jagger"], "c": 0},
    {"t": "Música", "p": "¿Quién compuso 'Para Elisa'?", "o": ["Beethoven", "Mozart", "Bach", "Chopin"], "c": 0},
    {"t": "Música", "p": "¿Cuántas teclas tiene un piano estándar?", "o": ["88", "76", "64", "100"], "c": 0},
    {"t": "Música", "p": "¿Quién cantaba 'De música ligera' con Soda Stereo?", "o": ["Gustavo Cerati", "Charly García", "Fito Páez", "Luis Alberto Spinetta"], "c": 0},
    {"t": "Música", "p": "¿Quién es conocido como 'el Rey del Pop'?", "o": ["Michael Jackson", "Elvis Presley", "Prince", "Freddie Mercury"], "c": 0},
    {"t": "Música", "p": "¿Quién es conocido como 'el Rey del Rock'?", "o": ["Elvis Presley", "Chuck Berry", "Mick Jagger", "Little Richard"], "c": 0},
    {"t": "Música", "p": "¿Qué instrumento tocaba Astor Piazzolla?", "o": ["Bandoneón", "Piano", "Violín", "Guitarra"], "c": 0},
    {"t": "Música", "p": "¿Qué cantante argentina es conocida como 'La Negra'?", "o": ["Mercedes Sosa", "Soledad Pastorutti", "Lali", "Tini"], "c": 0},
    {"t": "Música", "p": "¿Qué banda grabó 'Bohemian Rhapsody'?", "o": ["Queen", "The Beatles", "Led Zeppelin", "ABBA"], "c": 0},
    {"t": "Música", "p": "¿De qué país es la banda ABBA?", "o": ["Suecia", "Noruega", "Dinamarca", "Finlandia"], "c": 0},
    {"t": "Música", "p": "¿Quién compuso 'Las cuatro estaciones'?", "o": ["Antonio Vivaldi", "Johann Sebastian Bach", "Mozart", "Haydn"], "c": 0},
    {"t": "Música", "p": "¿Quién canta 'Shape of You'?", "o": ["Ed Sheeran", "Bruno Mars", "Justin Bieber", "Harry Styles"], "c": 0},
    {"t": "Música", "p": "¿Cuántas notas musicales hay en la escala básica (do, re, mi…)?", "o": ["7", "5", "8", "12"], "c": 0},
    {"t": "Música", "p": "¿Qué cantante colombiana grabó 'Hips Don't Lie'?", "o": ["Shakira", "Karol G", "Sofía Reyes", "Thalía"], "c": 0},
    {"t": "Música", "p": "¿En qué ciudad se originó el grupo The Beatles?", "o": ["Liverpool", "Londres", "Manchester", "Birmingham"], "c": 0},
    {"t": "Cine y TV", "p": "¿Qué película argentina ganó el Oscar en 2010?", "o": ["El secreto de sus ojos", "Relatos salvajes", "Nueve reinas", "Argentina, 1985"], "c": 0},
    {"t": "Cine y TV", "p": "¿Qué película argentina ganó el Oscar en 1986?", "o": ["La historia oficial", "Camila", "Esperando la carroza", "El hijo de la novia"], "c": 0},
    {"t": "Cine y TV", "p": "¿Cómo se llama el muñeco vaquero de 'Toy Story'?", "o": ["Woody", "Buzz", "Rex", "Jessie"], "c": 0},
    {"t": "Cine y TV", "p": "¿Qué película tiene la frase 'Que la Fuerza te acompañe'?", "o": ["Star Wars", "Star Trek", "Matrix", "Avatar"], "c": 0},
    {"t": "Cine y TV", "p": "¿En qué ciudad vive Batman?", "o": ["Ciudad Gótica", "Metrópolis", "Nueva York", "Central City"], "c": 0},
    {"t": "Cine y TV", "p": "¿Cómo se llama el león protagonista de 'El Rey León'?", "o": ["Simba", "Mufasa", "Scar", "Nala"], "c": 0},
    {"t": "Cine y TV", "p": "¿Qué serie trata de un profesor de química que fabrica drogas?", "o": ["Breaking Bad", "Narcos", "Ozark", "The Wire"], "c": 0},
    {"t": "Cine y TV", "p": "¿En qué serie aparece el Café Central Perk?", "o": ["Friends", "How I Met Your Mother", "Seinfeld", "The Big Bang Theory"], "c": 0},
    {"t": "Cine y TV", "p": "¿Quién dirigió 'Titanic' (1997)?", "o": ["James Cameron", "Steven Spielberg", "Christopher Nolan", "Ridley Scott"], "c": 0},
    {"t": "Cine y TV", "p": "¿Cómo se llama la familia amarilla de Springfield?", "o": ["Los Simpson", "Los Griffin", "Los Picapiedra", "Los Supersónicos"], "c": 0},
    {"t": "Cine y TV", "p": "¿Qué superhéroe es Peter Parker?", "o": ["Spider-Man", "Iron Man", "Batman", "Superman"], "c": 0},
    {"t": "Cine y TV", "p": "¿Qué superhéroe es Tony Stark?", "o": ["Iron Man", "Capitán América", "Thor", "Hulk"], "c": 0},
    {"t": "Cine y TV", "p": "¿En qué película aparece Jack Sparrow?", "o": ["Piratas del Caribe", "Hook", "La isla del tesoro", "Waterworld"], "c": 0},
    {"t": "Cine y TV", "p": "¿Cómo se llama la reina de hielo de 'Frozen'?", "o": ["Elsa", "Anna", "Ariel", "Rapunzel"], "c": 0},
    {"t": "Cine y TV", "p": "¿Qué actor protagonizó 'Forrest Gump'?", "o": ["Tom Hanks", "Tom Cruise", "Robin Williams", "Kevin Costner"], "c": 0},
    {"t": "Cine y TV", "p": "¿Qué serie española trata de un gran robo a la Fábrica de Moneda?", "o": ["La casa de papel", "Élite", "Vis a vis", "El ministerio del tiempo"], "c": 0},
    {"t": "Cine y TV", "p": "¿Cómo se llama el mago protagonista de 'El Señor de los Anillos' que es gris y luego blanco?", "o": ["Gandalf", "Saruman", "Dumbledore", "Merlín"], "c": 0},
    {"t": "Cine y TV", "p": "¿Qué película animada tiene un pez payaso que se pierde?", "o": ["Buscando a Nemo", "El espanta tiburones", "La sirenita", "Moana"], "c": 0},
    {"t": "Cine y TV", "p": "¿Qué actor argentino protagonizó 'Nueve reinas' y 'El secreto de sus ojos'?", "o": ["Ricardo Darín", "Guillermo Francella", "Leonardo Sbaraglia", "Gastón Pauls"], "c": 0},
    {"t": "Cine y TV", "p": "¿Qué serie tiene la frase 'Se acerca el invierno'?", "o": ["Game of Thrones", "Vikings", "The Witcher", "The Crown"], "c": 0},
    {"t": "Deportes", "p": "¿Cuántos minutos dura un partido de fútbol (sin descuento)?", "o": ["90", "80", "100", "120"], "c": 0},
    {"t": "Deportes", "p": "¿Cuántos jugadores tiene un equipo de fútbol en cancha?", "o": ["11", "10", "9", "12"], "c": 0},
    {"t": "Deportes", "p": "¿En qué año ganó Argentina su tercer Mundial de fútbol?", "o": ["2022", "2018", "2014", "1986"], "c": 0},
    {"t": "Deportes", "p": "¿En qué país se jugó el Mundial 2022?", "o": ["Catar", "Rusia", "Brasil", "Emiratos Árabes"], "c": 0},
    {"t": "Deportes", "p": "¿Cuántos Mundiales de fútbol ganó Argentina?", "o": ["3", "2", "4", "1"], "c": 0},
    {"t": "Deportes", "p": "¿Cuántos jugadores tiene un equipo de básquet en cancha?", "o": ["5", "6", "7", "4"], "c": 0},
    {"t": "Deportes", "p": "¿Cuántos jugadores tiene un equipo de vóley en cancha?", "o": ["6", "5", "7", "8"], "c": 0},
    {"t": "Deportes", "p": "¿En qué deporte se usa un 'birdie'?", "o": ["Golf", "Tenis", "Bádminton", "Polo"], "c": 0},
    {"t": "Deportes", "p": "¿Cada cuántos años se hacen los Juegos Olímpicos de verano?", "o": ["4", "2", "3", "5"], "c": 0},
    {"t": "Deportes", "p": "¿Qué tenista argentino ganó el US Open 2009?", "o": ["Juan Martín del Potro", "Gastón Gaudio", "Guillermo Vilas", "David Nalbandian"], "c": 0},
    {"t": "Deportes", "p": "¿Cómo se llama la selección argentina de rugby?", "o": ["Los Pumas", "Los Leones", "Los Cóndores", "Los Gauchos"], "c": 0},
    {"t": "Deportes", "p": "¿Cómo se llama la selección femenina argentina de hockey?", "o": ["Las Leonas", "Las Pumas", "Las Panteras", "Las Águilas"], "c": 0},
    {"t": "Deportes", "p": "¿Cuántos anillos tiene el símbolo olímpico?", "o": ["5", "4", "6", "7"], "c": 0},
    {"t": "Deportes", "p": "¿En qué deporte se destacó Manu Ginóbili?", "o": ["Básquet", "Tenis", "Fútbol", "Rugby"], "c": 0},
    {"t": "Deportes", "p": "¿Cuánto mide una maratón?", "o": ["42,195 km", "40 km", "21 km", "50 km"], "c": 0},
    {"t": "Deportes", "p": "¿Qué piloto argentino fue cinco veces campeón de Fórmula 1?", "o": ["Juan Manuel Fangio", "Carlos Reutemann", "Franco Colapinto", "José Froilán González"], "c": 0},
    {"t": "Deportes", "p": "¿En qué deporte se juega el Abierto de Palermo?", "o": ["Polo", "Tenis", "Golf", "Pato"], "c": 0},
    {"t": "Deportes", "p": "¿Cuál es el deporte nacional de Argentina?", "o": ["El pato", "El fútbol", "El polo", "El truco"], "c": 0},
    {"t": "Variedades", "p": "¿Cuántos lados tiene un hexágono?", "o": ["6", "5", "7", "8"], "c": 0},
    {"t": "Variedades", "p": "¿Cuántos colores tiene el arcoíris?", "o": ["7", "5", "6", "8"], "c": 0},
    {"t": "Variedades", "p": "¿Cuál es el idioma con más hablantes nativos?", "o": ["Mandarín", "Inglés", "Español", "Hindi"], "c": 0},
    {"t": "Variedades", "p": "¿Cuántos días tiene un año bisiesto?", "o": ["366", "365", "364", "360"], "c": 0},
    {"t": "Variedades", "p": "¿Cuántos segundos tiene una hora?", "o": ["3600", "600", "1200", "6000"], "c": 0},
    {"t": "Variedades", "p": "¿Con cuántas cartas se juega al truco?", "o": ["40", "48", "52", "36"], "c": 0},
    {"t": "Variedades", "p": "¿Cuál es el resultado de 7 × 8?", "o": ["56", "54", "48", "64"], "c": 0},
    {"t": "Variedades", "p": "¿Cuánto es la raíz cuadrada de 144?", "o": ["12", "14", "11", "16"], "c": 0},
    {"t": "Variedades", "p": "¿Cuántos grados tiene un ángulo recto?", "o": ["90", "45", "180", "100"], "c": 0},
    {"t": "Variedades", "p": "¿Qué número romano es la 'L'?", "o": ["50", "100", "500", "10"], "c": 0},
    {"t": "Variedades", "p": "¿Qué número romano es la 'M'?", "o": ["1000", "500", "100", "5000"], "c": 0},
    {"t": "Variedades", "p": "¿Cuál es la moneda de Japón?", "o": ["Yen", "Yuan", "Won", "Rupia"], "c": 0},
    {"t": "Variedades", "p": "¿Cuál es la moneda del Reino Unido?", "o": ["Libra esterlina", "Euro", "Dólar", "Franco"], "c": 0},
    {"t": "Variedades", "p": "¿De qué fruta se hace el guacamole?", "o": ["Palta", "Mango", "Banana", "Kiwi"], "c": 0},
    {"t": "Variedades", "p": "¿Qué ingrediente principal tiene el hummus?", "o": ["Garbanzos", "Lentejas", "Porotos", "Arvejas"], "c": 0},
    {"t": "Variedades", "p": "¿De qué país es originaria la pizza margarita?", "o": ["Italia", "Estados Unidos", "Grecia", "Francia"], "c": 0},
    {"t": "Variedades", "p": "¿De qué país es típico el sushi?", "o": ["Japón", "China", "Corea", "Tailandia"], "c": 0},
    {"t": "Variedades", "p": "¿Qué se festeja el 14 de febrero?", "o": ["San Valentín", "Día de la Amistad", "Día de la Primavera", "Día de la Mujer"], "c": 0},
    {"t": "Variedades", "p": "¿Qué día empieza la primavera en Argentina (por tradición)?", "o": ["21 de septiembre", "21 de marzo", "21 de junio", "21 de diciembre"], "c": 0},
    {"t": "Variedades", "p": "¿Cuántos días tiene febrero en un año no bisiesto?", "o": ["28", "29", "30", "27"], "c": 0},
    {"t": "Variedades", "p": "¿Qué empresa creó el iPhone?", "o": ["Apple", "Samsung", "Google", "Microsoft"], "c": 0},
    {"t": "Variedades", "p": "¿Qué significa la sigla 'www' en internet?", "o": ["World Wide Web", "World Web Wide", "Wide World Web", "Web World Wide"], "c": 0},
    {"t": "Variedades", "p": "¿Cuál es el color que se forma al mezclar azul y amarillo?", "o": ["Verde", "Violeta", "Naranja", "Marrón"], "c": 0},
    {"t": "Variedades", "p": "¿Cuál es el color que se forma al mezclar rojo y blanco?", "o": ["Rosa", "Naranja", "Violeta", "Bordó"], "c": 0},
    {"t": "Variedades", "p": "¿Cuántas horas tiene una semana?", "o": ["168", "144", "160", "172"], "c": 0},
    {"t": "Variedades", "p": "¿Cuál es el plural de 'lápiz'?", "o": ["Lápices", "Lápizes", "Lápiz", "Lapizes"], "c": 0}
];

function refTrivia(){ return window.doc(window.db, 'juegos', 'trivia'); }

function problemaTrivia(ronda){
    const rng = window.rngRonda(ronda * 275604 + 41);
    const base = BANCO_TRIVIA[Math.floor(rng() * BANCO_TRIVIA.length)];
    const opciones = base.o.map((texto, i) => ({ texto, correcta: i === base.c }));
    window.barajarRnd(rng, opciones);
    return { pregunta: base.p, tema: base.t, opciones };
}

let _triviaFaseAnterior = null;
function iniciarTrivia(){
    _triviaFaseAnterior = null;
    if (window._unsubTrivia) window._unsubTrivia();
    window._unsubTrivia = window.onSnapshot(refTrivia(), (snap) => {
        const datos = snap.exists() ? snap.data() : null;
        if (datos && datos.fase === 'terminado' && _triviaFaseAnterior === 'jugando' && window.sfx) {
            window.sfx[datos.ganador === miIdentidad ? 'victoria' : 'derrota']();
            if (window.fx && datos.ganador === miIdentidad) window.fx.confeti();
        }
        _triviaFaseAnterior = datos ? datos.fase : null;
        renderTrivia(datos);
    }, (err) => {
        console.error('Error de Firestore en trivia:', err);
        document.getElementById('contenido-trivia').innerHTML = `<div class="panel texto-centro texto-tenue">⚠️ No se pudo conectar (${err.code || 'error'}).</div>`;
    });
}

let _cuentaRegresivaTrivia = null;
function renderTrivia(estado){
    const cont = document.getElementById('contenido-trivia');
    if (_cuentaRegresivaTrivia) { clearTimeout(_cuentaRegresivaTrivia); _cuentaRegresivaTrivia = null; }

    if (!estado || estado.fase === 'sin_partida') {
        const v = estado?.victorias || { nico: 0, carito: 0 };
        cont.innerHTML = `<div class="panel texto-centro">
            <p class="texto-tenue">La misma pregunta para los dos, el primero en tocar la respuesta correcta suma el punto. A ${META_TRIVIA} gana.</p>
            <div class="texto-tenue" style="margin:10px 0;">Partidas ganadas — Nico ${v.nico || 0} — Carito ${v.carito || 0}</div>
            <button class="btn-principal" onclick="marcarListoTrivia()">Empezar</button>
        </div>`;
        return;
    }

    if (estado.fase === 'esperando') {
        const listoYo = estado.listos?.[miIdentidad];
        const listoRival = estado.listos?.[miRival];
        cont.innerHTML = `<div class="panel texto-centro">
            <div class="texto-tenue" style="margin-bottom:10px;">
                ${nombreJugador(miIdentidad)}: ${listoYo ? '✅ listo/a' : '⏳ esperando'}<br>
                ${nombreJugador(miRival)}: ${listoRival ? '✅ listo/a' : '⏳ esperando'}
            </div>
            <button class="btn-principal" ${listoYo ? 'disabled style="opacity:0.5;"' : ''} onclick="marcarListoTrivia()">${listoYo ? 'Esperando al otro…' : '¡Estoy listo/a! 🧠'}</button>
        </div>`;
        if (listoYo && listoRival) iniciarRondaArcadeSiCorresponde(refTrivia(), 'trivia', 0, { ronda: 1, puntajes: { nico: 0, carito: 0 }, ganador: null, fallos: {} });
        return;
    }

    if (estado.fase === 'terminado') {
        const p = estado.puntajes || { nico: 0, carito: 0 };
        cont.innerHTML = `<div class="panel texto-centro logro-animado">
            <div style="font-size:1.2rem; margin-bottom:8px;">🏆 ¡Ganó ${nombreJugador(estado.ganador)}!</div>
            <div class="texto-tenue">Nico ${p.nico || 0} — Carito ${p.carito || 0}</div>
            <button class="btn-principal" style="margin-top:14px;" onclick="revanchaTrivia()">🔁 Revancha</button>
        </div>`;
        return;
    }

    const restante = (estado.horaInicio || Date.now()) - Date.now();
    if (restante > -500) {
        if (!estado.horaInicio) repararRondaArcadeSiCorresponde(refTrivia(), 'trivia');
        cont.innerHTML = htmlCuentaRegresivaArcade(restante);
        _cuentaRegresivaTrivia = setTimeout(() => renderTrivia(estado), msHastaProximoTickArcade(restante));
        return;
    }

    const p = estado.puntajes || { nico: 0, carito: 0 };
    const ronda = estado.ronda || 1;
    const prob = problemaTrivia(ronda);
    const yoFalle = estado.fallos?.[miIdentidad] === ronda;
    const rivalFallo = estado.fallos?.[miRival] === ronda;
    cont.innerHTML = `<div class="texto-tenue texto-centro" style="margin-bottom:8px;">Nico ${p.nico || 0} — Carito ${p.carito || 0} · a ${META_TRIVIA}</div>
    <div class="panel texto-centro">
        ${prob.tema ? `<div class="texto-tenue" style="font-size:0.75rem; text-transform:uppercase; letter-spacing:0.05em;">${prob.tema}</div>` : ''}
        <div style="font-size:1.05rem; margin:6px 0 16px; line-height:1.4;">${prob.pregunta}</div>
        <div style="display:grid; grid-template-columns:repeat(2,1fr); gap:10px;">
            ${prob.opciones.map(o => `<button class="btn-secundario" style="padding:14px 6px; font-size:0.9rem;${yoFalle ? ' opacity:0.4;' : ''}" ${yoFalle ? 'disabled' : ''} onclick="responderTrivia(${ronda}, '${o.texto.replace(/'/g, "\\'")}')">${o.texto}</button>`).join('')}
        </div>
        ${yoFalle ? `<div class="texto-tenue" style="margin-top:12px;">❌ Fallaste esta. Si ${nombreJugador(miRival)} también falla, pasamos a la siguiente.</div>` : (rivalFallo ? `<div class="texto-tenue" style="margin-top:12px;">😏 ${nombreJugador(miRival)} ya falló esta pregunta.</div>` : '')}
    </div>`;
}

async function marcarListoTrivia(){
    vibrarJ(12);
    // Transacción (en vez de leer con onSnapshot y despues escribir
    // con merge suelto): si los dos tocan "listo" casi al mismo
    // tiempo, una lectura suelta puede no ver todavía la marca del
    // otro y la escritura de uno pisa la del otro, dejando la
    // partida esperando para siempre.
    await window.runTransaction(window.db, async (tx) => {
        const snap = await tx.get(refTrivia());
        const estado = snap.exists() ? snap.data() : null;
        if (estado?.fase === 'esperando' && estado?.listos?.[miIdentidad]) return;
        tx.set(refTrivia(), {
            fase: 'esperando',
            listos: { ...(estado?.listos || {}), [miIdentidad]: true },
            victorias: estado?.victorias || { nico: 0, carito: 0 }
        }, { merge: true });
    });
}

async function responderTrivia(rondaEsperada, textoElegido){
    const ref = refTrivia();
    const resultado = await window.runTransaction(window.db, async (tx) => {
        const snap = await tx.get(ref);
        const data = snap.data();
        if (!data || data.fase !== 'jugando' || (data.ronda || 1) !== rondaEsperada) return { acierto: false };
        const ronda = data.ronda || 1;
        // Quien ya falló esta pregunta no puede volver a intentar (antes
        // no había castigo y se podían tocar las 4 opciones hasta acertar).
        const fallos = { ...(data.fallos || {}) };
        if (fallos[miIdentidad] === ronda) return { acierto: false, yaFallo: true };
        const prob = problemaTrivia(ronda);
        const opcion = prob.opciones.find(o => o.texto === textoElegido);
        if (!opcion || !opcion.correcta) {
            fallos[miIdentidad] = ronda;
            // Si fallaron los dos, nadie suma y se pasa a la siguiente.
            if (fallos[miRival] === ronda) tx.update(ref, { fallos: {}, ronda: ronda + 1 });
            else tx.update(ref, { fallos });
            return { acierto: false };
        }
        const puntajes = { ...(data.puntajes || { nico: 0, carito: 0 }) };
        puntajes[miIdentidad] = (puntajes[miIdentidad] || 0) + 1;
        const gano = puntajes[miIdentidad] >= META_TRIVIA;
        const updates = { puntajes, ronda: ronda + 1, fallos: {} };
        if (gano) {
            updates.fase = 'terminado'; updates.ganador = miIdentidad;
            const victorias = { ...(data.victorias || { nico: 0, carito: 0 }) };
            victorias[miIdentidad] = (victorias[miIdentidad] || 0) + 1;
            updates.victorias = victorias;
        }
        tx.update(ref, updates);
        return { acierto: true, gano };
    });
    if (resultado.acierto) {
        vibrarJ(15);
        if (window.sfx) window.sfx.acierto();
        if (resultado.gano && typeof registrarEvento === 'function') {
            registrarEvento('gano_partida', `${nombreJugador(miIdentidad)} ganó Trivia Relámpago`);
        }
    } else if (!resultado.yaFallo) {
        vibrarJ([10, 30, 10]);
        if (window.sfx) window.sfx.error();
        if (window.fx) window.fx.sacudirJuego();
    }
}

async function revanchaTrivia(){
    vibrarJ(10);
    const estado = await new Promise(res => { const u = window.onSnapshot(refTrivia(), s => { u(); res(s.exists() ? s.data() : null); }); });
    await window.setDoc(refTrivia(), { fase: 'esperando', listos: {}, victorias: estado?.victorias || { nico: 0, carito: 0 } });
}
