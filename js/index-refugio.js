        // ============================================================
        // NUESTRO REFUGIO — chat + muro, usando la conexión a Firebase
        // del bloque <script type="module"> de más arriba (window.db).
        // La clave de acceso ("nico" / "carito") identifica quién es
        // quién, sin pasos extra. Es la misma llave para chat y muro.
        // ============================================================

        const capitulos = [
            {
                numero: "I",
                titulo: "Lo que sos para mí",
                frases: [
                    "Sos mi corazón de chocolate.", "Sos todo lo que esta bien.", "Sos mi todo.",
                    "Sos mi paz en medio del caos.", "Sos mi lugar seguro.", "Sos la casualidad más linda.",
                    "Sos la luz que ilumina mi camino.", "Sos mi sueño hecho realidad.",
                    "Sos el motivo de mis mejores sonrisas.", "Sos la flor más hermosa de mi jardín.",
                    "Sos la melodía que no puedo dejar de escuchar.", "Sos mi principio y mi final.",
                    "Sos el arte que quiero admirar toda la vida.", "Sos mi persona favorita en el mundo.",
                    "Sos el milagro que tanto esperé.", "Sos mi destino.", "Sos la pieza que le faltaba a mi rompecabezas.",
                    "Sos mi rayito de sol en días nublados.", "Sos el amor que nunca supe que necesitaba.", "Sos mi hogar.",
                    "Sos la reina de mi corazón.", "Sos mi mayor tesoro.", "Sos la respuesta a todas mis oraciones.",
                    "Sos mi oasis.", "Sos el poema más lindo que leí.", "Sos mi aventura favorita.",
                    "Sos el fuego que abriga mi alma.", "Sos mi confidente y mi amor.", "Sos mi inspiración constante.",
                    "Sos la estrella que más brilla en mi cielo.", "Sos mi presente y mi futuro.",
                    "Sos la magia que le faltaba a mis días.", "Sos mi otra mitad.", "Sos mi locura más linda.",
                    "Sos el latido de mi corazón.", "Sos el regalo más lindo que me dio la vida.", "Sos mi brújula.",
                    "Sos la dueña de mis pensamientos.", "Sos mi calma y mi tempestad.",
                    "Sos mi vida, mi alma.", "Sos mi to-do.", "Sos una hermosa persona, amor.",
                    "Para mí sos única.", "Quién iba a decir que un scroll cualquiera en Facebook nos iba a traer hasta acá."
                ]
            },
            {
                numero: "II",
                titulo: "Lo que siento cuando estás cerca",
                frases: [
                    "Te admiro.", "Cada rincón de mi alma te pertenece.", "Te elijo hoy y todos los días de mi vida.",
                    "Amo la forma en la que me mirás.", "Hacés que el mundo sea más hermoso.",
                    "Mi corazón late más fuerte cuando estás cerca.", "Tus abrazos son mi refugio.",
                    "Me enamoro de vos todos los días.", "Nadie me hace sentir como vos.", "Tu sonrisa es mi debilidad.",
                    "Echar raíces con vos es lo que más deseo.", "Con vos, cada momento es magia.",
                    "Amo cada pequeño detalle tuyo.", "Me hacés ser una mejor persona.",
                    "Mi vida tiene sentido porque estás vos.", "Te pienso desde que despierto hasta que duermo.",
                    "Tu voz es mi sonido favorito.", "Con vos, el tiempo se detiene.", "Amo lo que somos juntos.",
                    "Me haces sentir invencible.", "Tus besos son mi medicina.", "Amo tu forma de ver la vida.",
                    "Me das una paz infinita.", "Amo tus virtudes y tus defectos.", "Con vos lo tengo todo.",
                    "Hacés que mi alma baile.", "Me enseñaste lo que es amar de verdad.",
                    "Amo la tranquilidad que me transmitís.", "Me haces volar sin alas.",
                    "Amo despertar y saber que existís.", "Me llenás el alma de colores.", "Amo amarte.",
                    "Con vos, hasta el silencio es hermoso.", "Me hacés sentir pleno.", "Amo compartir mi vida con vos.",
                    "Con vos todo es perfecto.",
                    "Te amo mucho, mucho, mucho.", "Carito, te pienso todo el día.", "Nunca conocí a alguien como vos."
                ]
            },
            {
                numero: "III",
                titulo: "Lo que quiero para nosotros",
                frases: [
                    "Quiero que sanes.", "Quiero llenarte de besos...", "Quiero fundirme en un abrazo con vos.",
                    "Quiero envejecer con vos.", "Quiero la vida entera con vos.", "Quiero despertar a tu lado cada mañana.",
                    "Quiero construir nuestro propio universo.", "Quiero cuidarte siempre.", "Quiero perderme en tu mirada.",
                    "Quiero caminar de tu mano siempre.", "Quiero llenarte de mimos todos los días.",
                    "Quiero escribir nuestra historia juntos.", "Quiero hacerte feliz cada segundo.",
                    "Quiero escucharte reír por el resto de mi vida.", "Quiero besarte hasta quedarme sin aliento.",
                    "Quiero ser tu refugio cuando llueva.", "Quiero abrazarte y no soltarte nunca.",
                    "Quiero que crezcamos juntos.", "Quiero ser el motivo de tus alegrías.",
                    "Quiero perderme con vos en cualquier parte.", "Quiero ser tu compañero de vida.",
                    "Quiero darte lo mejor de mí.", "Quiero ver pasar los años a tu lado.", "Quiero acariciar tu alma.",
                    "Quiero amarte en todas tus facetas.",
                    "Amor mío, lo quiero todo con vos.", "Algún día vamos a contar 'cómo conocí a Carito'."
                ]
            }
        ];

        const fraseFinal = ["Sos el amor de mi vida, Carito.", "Quiero que seas eterna.", "Simplemente... Te amo con toda mi alma."];

        // Array plano de todas las frases de los 3 capítulos (mantiene compatibilidad con el botón "al azar")
        const frasesRomanticas = capitulos.flatMap(cap => cap.frases);

        const coloresPasteles = ['#ffdde1', '#ee9ca7', '#ffecd2', '#fcb69f', '#cfd9df', '#e2ebf0', '#fbc2eb', '#a18cd1', '#ff9a9e', '#fecfef', '#f6d5f7', '#fbc7d4'];

        // Optimización mobile: en pantallas chicas o táctiles se generan menos
        // elementos decorativos por pantalla (los círculos con blur y los brillos
        // son caros para GPUs de gama media/baja). Se calcula una sola vez.
        const RECURSOS_LIMITADOS = window.innerWidth <= 640 ||
            (typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches);
        const PREFIERE_MENOS_MOVIMIENTO = typeof window.matchMedia === 'function' &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        const contenedor = document.getElementById('contenedor');
        const pista = document.getElementById('pista-pantallas');

        let indiceGlobal = 0;
        const destinosIndice = []; // { id, etiqueta, titulo, detalle } usados para armar la pantalla de Índice

        // La pantalla de Índice es la página 2 del libro (justo después de
        // la puerta de entrada). Se crea vacía acá para que quede en el
        // orden correcto dentro de la pista; su contenido se arma más
        // abajo, una vez que ya sabemos todos los capítulos disponibles.
        const pantallaIndice = document.createElement('section');
        pantallaIndice.className = 'pantalla pantalla-indice';
        pantallaIndice.id = 'pantalla-indice';
        pantallaIndice.dataset.tipo = 'indice';
        pista.appendChild(pantallaIndice);

        capitulos.forEach(cap => {
            // Pantalla portada del capítulo
            const portada = document.createElement('section');
            portada.className = 'pantalla portada-capitulo placeholder';
            portada.id = `capitulo-${cap.numero}`;
            portada.dataset.tipo = 'portada';
            portada.innerHTML = `
                <div class="capitulo-numero">Capítulo ${cap.numero}</div>
                <h2 class="capitulo-titulo">${cap.titulo}</h2>
                <div class="capitulo-indicador">✨ Deslizá para continuar ✨</div>
            `;
            pista.appendChild(portada);
            destinosIndice.push({
                id: portada.id, etiqueta: String(cap.numero), tipo: 'capitulo',
                titulo: cap.titulo, detalle: `${cap.frases.length} mensajes`
            });

            cap.frases.forEach(frase => {
                const index = indiceGlobal;
                const sec = document.createElement('section');
                sec.className = 'pantalla placeholder fondo-animado';
                sec.id = `frase-${index + 1}`;
                sec.dataset.index = index;
                sec.dataset.tipo = 'frase';

                const c1 = coloresPasteles[index % coloresPasteles.length];
                const c2 = coloresPasteles[(index + 3) % coloresPasteles.length];
                const c3 = coloresPasteles[(index + 5) % coloresPasteles.length];
                const c4 = coloresPasteles[(index + 8) % coloresPasteles.length];
                sec.style.background = `linear-gradient(-45deg, ${c1}, ${c2}, ${c3}, ${c4})`;
                sec.style.animationDelay = `-${(index * 3) % 15}s`;

                pista.appendChild(sec);
                indiceGlobal++;
            });
        });

        // Pantalla de cuenta regresiva: la primera vez que se van a ver en persona
        const cuentaSec = document.createElement('section');
        cuentaSec.className = 'pantalla pantalla-cuenta-regresiva placeholder';
        cuentaSec.id = 'pantalla-cuenta-regresiva';
        cuentaSec.dataset.tipo = 'cuenta';
        cuentaSec.innerHTML = `
            <div class="cuenta-contenido">
                <div class="cuenta-subtitulo" id="cuenta-subtitulo">Cuenta regresiva</div>
                <h2 class="cuenta-titulo" id="cuenta-titulo">La primera vez que nos vamos a ver</h2>
                <div class="cuenta-numeros" id="cuenta-numeros">
                    <div class="cuenta-bloque"><span class="cuenta-valor" id="cr-dias">00</span><span class="cuenta-etiqueta">días</span></div>
                    <div class="cuenta-bloque"><span class="cuenta-valor" id="cr-horas">00</span><span class="cuenta-etiqueta">hs</span></div>
                    <div class="cuenta-bloque"><span class="cuenta-valor" id="cr-min">00</span><span class="cuenta-etiqueta">min</span></div>
                    <div class="cuenta-bloque"><span class="cuenta-valor" id="cr-seg">00</span><span class="cuenta-etiqueta">seg</span></div>
                </div>
                <div class="cuenta-fecha" id="cuenta-fecha">25 de agosto de 2026, 12 hs</div>
                <p class="cuenta-frase" id="cuenta-frase">Cada segundo que pasa, estoy más cerca de abrazarte 💫</p>
                <button class="btn-ver-boleto" onclick="abrirBoleto(event)">✈️ Ver nuestro pasaje</button>
                <p class="cuenta-mensaje" id="cuenta-mensaje"></p>
            </div>
        `;
        pista.appendChild(cuentaSec);
        destinosIndice.push({ id: cuentaSec.id, etiqueta: '⏰', tipo: 'cuenta', titulo: 'Cuenta regresiva', detalle: 'Nuestro primer encuentro' });

        // Decoración romántica: corazones y círculos flotando, igual que en el resto de las pantallas
        const simbolosCuenta = ['💗', '✨', '🤍', '💫'];
        for (let i = 0; i < 5; i++) {
            const brillo = document.createElement('div');
            brillo.className = 'brillo-flotante';
            brillo.innerText = simbolosCuenta[i % simbolosCuenta.length];
            brillo.style.left = (Math.random() * 85) + '%';
            brillo.style.top = (Math.random() * 85) + '%';
            brillo.style.animationDuration = `${Math.random() * 3 + 4}s`;
            brillo.style.animationDelay = `${Math.random() * 3}s`;
            cuentaSec.appendChild(brillo);
        }
        for (let i = 0; i < 3; i++) {
            const circulo = document.createElement('div');
            circulo.className = 'circulo-flotante';
            const size = Math.random() * 20 + 20;
            circulo.style.width = `${size}vw`;
            circulo.style.height = `${size}vw`;
            circulo.style.left = (Math.random() * 80 - 10) + '%';
            circulo.style.top = (Math.random() * 80 - 10) + '%';
            circulo.style.background = 'rgba(255,105,180,0.25)';
            circulo.style.setProperty('--flotar-x', `${Math.random() * 60 - 30}px`);
            circulo.style.setProperty('--flotar-y', `${Math.random() * 60 - 30}px`);
            circulo.style.animationDuration = `${Math.random() * 6 + 8}s`;
            cuentaSec.appendChild(circulo);
        }

        // Pantalla final especial (el cierre)
        const finalSec = document.createElement('section');
        finalSec.className = 'pantalla final-especial placeholder';
        finalSec.id = 'final-especial';
        finalSec.dataset.tipo = 'final';
        finalSec.innerHTML = `
            <div class="final-brillo"></div>
            <div class="final-contenido">
                <div class="final-lineas" id="final-lineas"></div>
                <div class="final-foto">
                    <img src="https://i.postimg.cc/QtLY0Cnx/78df8d38-6373-43d9-9323-70ba109c8c91.png" alt="Carito llena de mensajes de amor" loading="lazy" decoding="async">
                </div>
                <div class="final-firma">Tu Nico,<br>por siempre tuyo</div>
                <button class="beso-boton" id="boton-beso" onclick="enviarBeso()">💋 Tocá para un beso</button>
                <button class="beso-boton" style="margin-top: 15px; background: rgba(255,255,255,0.15);" onclick="abrirMuro()">📜 Entrar a nuestro Muro</button>
                <button class="beso-boton" style="margin-top: 15px; background: rgba(255,255,255,0.15);" onclick="abrirCielo(event)">🌌 Ver nuestro cielo</button>
                <p class="postdata-final" id="postdata-final">P.D.: esto recién empieza...</p>
            </div>
        `;
        pista.appendChild(finalSec);
        destinosIndice.push({ id: finalSec.id, tipo: 'final', titulo: 'Cierre', detalle: 'El final (que es un comienzo)' });

        // Se arma el contenido de la pantalla de Índice ahora que ya
        // existen todas las páginas del libro: una tarjeta por capítulo,
        // más la cuenta regresiva y el cierre, cada una con salto directo.
        (function construirPantallaIndice() {
            const tarjetas = destinosIndice.map(destino => {
                const icono = destino.tipo === 'capitulo' ? destino.etiqueta
                    : destino.tipo === 'cuenta' ? '⏰' : '💌';
                return `
                    <button type="button" class="tarjeta-indice" data-destino="${destino.id}" aria-label="Ir a ${destino.titulo}">
                        <span class="numero-indice">${icono}</span>
                        <span>
                            <span class="titulo-indice">${destino.titulo}</span>
                            <span class="detalle-indice">${destino.detalle}</span>
                        </span>
                    </button>`;
            }).join('');

            pantallaIndice.innerHTML = `
                <h1 class="indice-titulo">Índice</h1>
                <p class="indice-subtitulo">Tocá un capítulo para entrar</p>
                <div class="lista-indice">${tarjetas}</div>
            `;

            // Botón real + touchend con preventDefault: en Android, cuando hay
            // otro listener de touch en un ancestro (acá, el swipe del libro
            // en #contenedor), el "click" sintético a veces se pierde o llega
            // tarde. Resolviendo la acción directo en touchend evitamos
            // depender de esa síntesis, y el preventDefault frena el click
            // fantasma que vendría después (así no se ejecuta doble).
            pantallaIndice.querySelectorAll('.tarjeta-indice').forEach(tarjeta => {
                let yaEjecutado = false;
                const ejecutar = () => {
                    if (yaEjecutado) return;
                    yaEjecutado = true;
                    irAId(tarjeta.dataset.destino);
                    setTimeout(() => { yaEjecutado = false; }, 500);
                };
                tarjeta.addEventListener('touchend', (e) => { e.preventDefault(); ejecutar(); }, { passive: false });
                tarjeta.addEventListener('click', ejecutar);
            });
        })();

        // Unos corazones flotando suave y constante en la pantalla final, para que se sienta viva
        const simbolosFinal = ['💗', '✨', '🤍'];
        for (let i = 0; i < 5; i++) {
            const brillo = document.createElement('div');
            brillo.className = 'brillo-flotante';
            brillo.innerText = simbolosFinal[i % simbolosFinal.length];
            brillo.style.left = (Math.random() * 85) + '%';
            brillo.style.top = (Math.random() * 85) + '%';
            brillo.style.animationDuration = `${Math.random() * 3 + 4}s`;
            brillo.style.animationDelay = `${Math.random() * 3}s`;
            finalSec.appendChild(brillo);
        }

        function construirPantalla(seccion, index) {
            if (PREFIERE_MENOS_MOVIMIENTO) {
                // Se saltea toda la decoración animada: solo queda la tarjeta con el mensaje
                const tarjetaSimple = document.createElement('div');
                tarjetaSimple.className = 'tarjeta-cristal';
                const textoSimple = document.createElement('h1');
                textoSimple.className = 'texto-romantico';
                tarjetaSimple.appendChild(textoSimple);
                seccion.appendChild(tarjetaSimple);
                textoSimple.innerText = frasesRomanticas[index];
                return;
            }

            // Círculos difuminados flotando de fondo (efecto aurora romántico)
            const numCirculos = RECURSOS_LIMITADOS ? 2 : 3;
            const coloresCirculo = ['rgba(255,255,255,0.55)', 'rgba(255,105,180,0.35)', 'rgba(255,219,235,0.5)'];
            for (let i = 0; i < numCirculos; i++) {
                const circulo = document.createElement('div');
                circulo.className = 'circulo-flotante';
                const size = Math.random() * 20 + 20; // 20 - 40 vw aprox controlado en vw
                circulo.style.width = `${size}vw`;
                circulo.style.height = `${size}vw`;
                circulo.style.left = (Math.random() * 80 - 10) + '%';
                circulo.style.top = (Math.random() * 80 - 10) + '%';
                circulo.style.background = coloresCirculo[i % coloresCirculo.length];
                circulo.style.setProperty('--flotar-x', `${Math.random() * 60 - 30}px`);
                circulo.style.setProperty('--flotar-y', `${Math.random() * 60 - 30}px`);
                circulo.style.animationDuration = `${Math.random() * 6 + 8}s`;
                seccion.appendChild(circulo);
            }

            // Brillitos/corazones flotando suavemente
            const simbolos = ['✨', '💗', '🤍', '💫'];
            const numBrillos = RECURSOS_LIMITADOS ? (Math.floor(Math.random() * 2) + 2) : (Math.floor(Math.random() * 3) + 3);
            for (let i = 0; i < numBrillos; i++) {
                const brillo = document.createElement('div');
                brillo.className = 'brillo-flotante';
                brillo.innerText = simbolos[Math.floor(Math.random() * simbolos.length)];
                brillo.style.left = (Math.random() * 90) + '%';
                brillo.style.top = (Math.random() * 90) + '%';
                brillo.style.animationDuration = `${Math.random() * 3 + 3}s`;
                brillo.style.animationDelay = `${Math.random() * 3}s`;
                seccion.appendChild(brillo);
            }

            const frasesDecoFondo = ['Amo a Carito', 'Sos el amor de mi vida', 'Nico y Caro', 'Por siempre, siempre, siempre'];
            const numAmoCarito = RECURSOS_LIMITADOS ? Math.floor(Math.random() * 2) : (Math.floor(Math.random() * 2) + 1);
            for(let i=0; i<numAmoCarito; i++) {
                const deco = document.createElement('div');
                deco.className = 'deco-amo-carito';
                deco.innerText = frasesDecoFondo[Math.floor(Math.random() * frasesDecoFondo.length)];
                deco.style.fontSize = `clamp(3rem, ${Math.random() * 5 + 5}vw, 8rem)`;
                deco.style.left = (Math.random() * 80 - 5) + '%';
                deco.style.top = (Math.random() * 80 - 5) + '%';
                deco.style.transform = `rotate(${Math.random() * 60 - 30}deg)`;
                seccion.appendChild(deco);
            }

            const tarjeta = document.createElement('div');
            tarjeta.className = 'tarjeta-cristal';
            const texto = document.createElement('h1');
            texto.className = 'texto-romantico';
            
            tarjeta.appendChild(texto);
            seccion.appendChild(tarjeta);

            // Efecto máquina de escribir (rápido)
            escribirTexto(texto, frasesRomanticas[index]);
        }

        function escribirTexto(elemento, texto, velocidad = 20, callback) {
            elemento.innerHTML = '';
            const cursor = document.createElement('span');
            cursor.className = 'cursor-escritura';
            elemento.appendChild(cursor);

            let i = 0;
            function paso() {
                if (i < texto.length) {
                    cursor.insertAdjacentText('beforebegin', texto.charAt(i));
                    i++;
                    setTimeout(paso, velocidad);
                } else {
                    setTimeout(() => cursor.remove(), 900);
                    if (callback) setTimeout(callback, 500);
                }
            }
            paso();
        }

        let finalYaConstruido = false;
        function construirFinal(seccion) {
            if (finalYaConstruido) return;
            finalYaConstruido = true;

            const contenedorLineas = document.getElementById('final-lineas');
            let i = 0;

            function escribirSiguienteLinea() {
                if (i >= fraseFinal.length) {
                    setTimeout(() => {
                        seccion.classList.add('final-completo');
                        if (typeof lanzarExplosionCanvas === 'function') lanzarExplosionCanvas();
                    }, 400);
                    return;
                }
                const p = document.createElement('p');
                p.className = `final-linea final-linea-${i + 1}`;
                contenedorLineas.appendChild(p);
                escribirTexto(p, fraseFinal[i], 28, () => {
                    i++;
                    setTimeout(escribirSiguienteLinea, 500);
                });
            }
            escribirSiguienteLinea();
        }

        let besoEnviado = false;
        function enviarBeso() {
            if (besoEnviado) return;
            besoEnviado = true;
            vibrar([40, 80, 40, 80, 220]); // como un latido de corazón

            const btn = document.getElementById('boton-beso');
            btn.innerText = '💋 Beso enviado';
            btn.classList.add('enviado');

            const rect = btn.getBoundingClientRect();
            for (let i = 0; i < 6; i++) {
                setTimeout(() => {
                    lanzarCorazonSutil(rect.left + rect.width / 2 + (Math.random() * 50 - 25), rect.top + (Math.random() * 10 - 5));
                }, i * 90);
            }

            lanzarLluviaDeBesos();

            setTimeout(() => {
                document.getElementById('postdata-final').classList.add('mostrar');
            }, 700);
        }

        // ============================================================
        // MOTOR GENÉRICO DE LLUVIAS DE EMOJIS/TEXTO
        // El tiempo de limpieza del contenedor se calcula a partir de la
        // duración y demora máximas reales, para que nada se corte a mitad de camino.
        // ============================================================
        function crearLluvia(config) {
            const {
                contenedorClase, itemClase, cantidad: cantidadPedida, generarItem,
                duracionBase = 2.6, duracionVariable = 2.0, demoraMax = 1.6, giroMax = 70
            } = config;
            // En celulares de gama media/baja, menos partículas simultáneas
            // (cada una toca un sonido con Web Audio) evita que se trabe la animación.
            const cantidad = RECURSOS_LIMITADOS ? Math.round(cantidadPedida * 0.6) : cantidadPedida;

            const contenedor = document.createElement('div');
            contenedor.className = contenedorClase;
            document.body.appendChild(contenedor);

            for (let i = 0; i < cantidad; i++) {
                const { texto, tamano } = generarItem(i);
                const item = document.createElement('span');
                item.className = itemClase;
                item.textContent = texto;
                item.style.left = (Math.random() * 100) + 'vw';
                item.style.fontSize = tamano + 'rem';
                item.style.setProperty('--giro', (Math.random() * giroMax * 2 - giroMax) + 'deg');
                item.style.animationDuration = (duracionBase + Math.random() * duracionVariable) + 's';
                const demoraItem = Math.random() * demoraMax;
                item.style.animationDelay = demoraItem + 's';
                contenedor.appendChild(item);

                // Cada partícula suena y vibra apenas un poquito al empezar a caer
                setTimeout(() => {
                    reproducirSonidoCaida();
                    vibrar(8);
                }, demoraItem * 1000);
            }

            // Tiempo máximo real que puede tardar la última partícula + margen de seguridad
            const tiempoMaximo = (duracionBase + duracionVariable + demoraMax) * 1000 + 400;
            setTimeout(() => contenedor.remove(), tiempoMaximo);
        }

        function lanzarLluviaDeBesos() {
            crearLluvia({
                contenedorClase: 'lluvia-besos', itemClase: 'beso-cayendo', cantidad: 55,
                generarItem: () => ({
                    texto: ['💋', '💕', '💖', '💗'][Math.floor(Math.random() * 4)],
                    tamano: 1.1 + Math.random() * 1.6
                })
            });
        }

        // ============================================================
        // ÍCONOS INTERACTIVOS DEL MENÚ: Te amo / Beso / Abrazo / Dulces
        // ============================================================
        function cerrarMenuPrincipal() {
            const menu = document.getElementById('menu-principal');
            if (menu) menu.classList.remove('abierto');
        }

        const teAmoIdiomas = [
            "Te amo", "I love you", "Je t'aime", "Ti amo", "Eu te amo", "Ich liebe dich",
            "愛してる", "사랑해", "我爱你", "Я тебя люблю", "أحبك", "Σ' αγαπώ",
            "Seni seviyorum", "Ik hou van je", "Kocham cię", "Eu iubesc",
            "Jag älskar dig", "Rakastan sinua", "Anh yêu em", "Mahal kita"
        ];

        function lanzarLluviaTeAmo(event) {
            if (event) event.stopPropagation();
            vibrar([25, 50, 25, 50, 90]);
            cerrarMenuPrincipal();
            crearLluvia({
                contenedorClase: 'lluvia-teamo', itemClase: 'teamo-cayendo', cantidad: 45, giroMax: 30,
                generarItem: () => {
                    const esCorazon = Math.random() < 0.25;
                    return esCorazon
                        ? { texto: ['❤️', '💗', '💖', '💕'][Math.floor(Math.random() * 4)], tamano: 1.2 + Math.random() * 1.4 }
                        : { texto: teAmoIdiomas[Math.floor(Math.random() * teAmoIdiomas.length)], tamano: 0.85 + Math.random() * 0.55 };
                }
            });
        }

        function lanzarLluviaBesosMenu(event) {
            if (event) event.stopPropagation();
            vibrar([30, 60, 30]);
            cerrarMenuPrincipal();
            lanzarLluviaDeBesos();
        }

        function lanzarLluviaAbrazos(event) {
            if (event) event.stopPropagation();
            vibrar([30, 50, 30, 50, 80]);
            cerrarMenuPrincipal();
            crearLluvia({
                contenedorClase: 'lluvia-abrazos', itemClase: 'abrazo-cayendo', cantidad: 50,
                generarItem: () => ({
                    texto: ['🤗', '💞', '💗', '🫂'][Math.floor(Math.random() * 4)],
                    tamano: 1.2 + Math.random() * 1.5
                })
            });
        }

        function lanzarLluviaChocolate(event) {
            if (event) event.stopPropagation();
            vibrar([25, 45, 25]);
            cerrarMenuPrincipal();
            crearLluvia({
                contenedorClase: 'lluvia-dulces', itemClase: 'dulce-cayendo', cantidad: 50,
                generarItem: () => ({
                    texto: ['🍫', '🍪', '🍩'][Math.floor(Math.random() * 3)],
                    tamano: 1.2 + Math.random() * 1.4
                })
            });
        }

        function lanzarLluviaFlores(event) {
            if (event) event.stopPropagation();
            vibrar([25, 45, 25]);
            cerrarMenuPrincipal();
            crearLluvia({
                contenedorClase: 'lluvia-dulces', itemClase: 'dulce-cayendo', cantidad: 50,
                generarItem: () => ({
                    texto: ['🌸', '🌷', '🌹', '🌺', '🪻'][Math.floor(Math.random() * 5)],
                    tamano: 1.2 + Math.random() * 1.4
                })
            });
        }

        function lanzarLluviaEstrellas(event) {
            if (event) event.stopPropagation();
            vibrar([25, 45, 25]);
            cerrarMenuPrincipal();
            crearLluvia({
                contenedorClase: 'lluvia-dulces', itemClase: 'dulce-cayendo', cantidad: 50,
                generarItem: () => ({
                    texto: ['✨', '🌟', '⭐', '☀️'][Math.floor(Math.random() * 4)],
                    tamano: 1.1 + Math.random() * 1.3
                })
            });
        }

        try {
            if (typeof IntersectionObserver === 'function') {
                const observer = new IntersectionObserver((entradas) => {
                    entradas.forEach(entrada => {
                        const sec = entrada.target;
                        if (entrada.isIntersecting) {
                            if (sec.classList.contains('placeholder')) {
                                try {
                                    if (sec.dataset.tipo === 'frase') {
                                        construirPantalla(sec, parseInt(sec.dataset.index));
                                    } else if (sec.dataset.tipo === 'final') {
                                        construirFinal(sec);
                                    }
                                } catch (errorConstruccion) {
                                    // Si el armado de ESTA pantalla falla, no debe frenar
                                    // la navegación general ni el resto de las pantallas.
                                    console.error('No se pudo construir una pantalla:', errorConstruccion);
                                }
                                sec.classList.remove('placeholder');
                            }
                            if ((sec.dataset.tipo === 'portada' || sec.dataset.tipo === 'cuenta') && !sec.dataset.vibrado) {
                                sec.dataset.vibrado = '1';
                                vibrar([25, 60, 25]); // un latido suave al llegar a un nuevo capítulo
                            }
                            sec.classList.add('visible');
                        } else {
                            sec.classList.remove('visible'); 
                        }
                    });
                }, { root: contenedor, rootMargin: '0px 100%', threshold: 0.1 }); 

                document.querySelectorAll('.pantalla.placeholder').forEach(sec => observer.observe(sec));
            } else {
                // Navegador sin soporte a IntersectionObserver: construimos todas las pantallas de una
                document.querySelectorAll('.pantalla.placeholder').forEach(sec => {
                    try {
                        if (sec.dataset.tipo === 'frase') construirPantalla(sec, parseInt(sec.dataset.index));
                        else if (sec.dataset.tipo === 'final') construirFinal(sec);
                    } catch (errorConstruccion) {
                        console.error('No se pudo construir una pantalla:', errorConstruccion);
                    }
                    sec.classList.remove('placeholder');
                    sec.classList.add('visible');
                });
            }
        } catch (errorObserver) {
            // Si algo falla acá, no debe frenar el resto del script (preguntas, deseos, etc.)
            console.error('Error al iniciar el observador de pantallas:', errorObserver);
        }


        // CANVAS
        const canvas = document.getElementById('canvas-particulas');
        const ctx = canvas.getContext('2d');
        let particulas = [];
        let particulasActivas = false;
        let mouse = { x: -1000, y: -1000 };

        function ajustarCanvas() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
        window.addEventListener('resize', ajustarCanvas); ajustarCanvas();
        window.addEventListener('mousemove', (e) => { mouse.x = e.clientX; mouse.y = e.clientY; });
        window.addEventListener('touchmove', (e) => { mouse.x = e.touches[0].clientX; mouse.y = e.touches[0].clientY; }, {passive: true});

        // Si la pestaña queda en segundo plano, se corta el requestAnimationFrame:
        // nada de seguir animando partículas invisibles y gastando batería.
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                particulasPausadasPorFoco = particulasActivas;
                particulasActivas = false;
            } else if (particulasPausadasPorFoco) {
                particulasPausadasPorFoco = false;
                particulasActivas = true;
                animarParticulas();
            }
        });
        let particulasPausadasPorFoco = false;

        class Particula {
            constructor(x, y, esExplosion = false) {
                this.x = x || Math.random() * canvas.width;
                this.y = y || canvas.height + 50;
                this.size = Math.random() * 15 + 10;
                this.velocidadY = esExplosion ? (Math.random() * -15 - 5) : (Math.random() * -2 - 1);
                this.velocidadX = esExplosion ? (Math.random() * 20 - 10) : (Math.random() * 2 - 1);
                this.gravedad = esExplosion ? 0.3 : -0.01; 
                this.friccion = 0.98;
                this.tipo = ['❤️','✨','💖','🌸','⭐'][Math.floor(Math.random() * 5)];
                this.opacidad = 1;
                this.rotacion = Math.random() * 360;
                this.rotacionVel = (Math.random() - 0.5) * 5;
            }
            actualizar() {
                this.velocidadY += this.gravedad;
                this.velocidadX *= this.friccion;
                this.x += this.velocidadX;
                this.y += this.velocidadY;
                this.rotacion += this.rotacionVel;

                let dx = mouse.x - this.x; let dy = mouse.y - this.y;
                let distancia = Math.sqrt(dx * dx + dy * dy);
                if (distancia < 100) { this.x -= dx * 0.05; this.y -= dy * 0.05; }
                if(this.y < -50 || this.opacidad <= 0) this.reiniciar();
            }
            reiniciar() {
                this.y = canvas.height + 50; this.x = Math.random() * canvas.width;
                this.velocidadY = Math.random() * -2 - 1; this.velocidadX = Math.random() * 2 - 1;
                this.gravedad = -0.02; this.opacidad = 1;
            }
            dibujar() {
                ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.rotacion * Math.PI / 180);
                ctx.globalAlpha = this.opacidad; ctx.font = `${this.size}px Arial`;
                ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(this.tipo, 0, 0); ctx.restore();
            }
        }

        function animarParticulas() {
            if(!particulasActivas) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particulas.forEach(p => { p.actualizar(); p.dibujar(); });
            requestAnimationFrame(animarParticulas);
        }

        // Techo de partículas simultáneas: las explosiones se reciclan en
        // partículas ambiente que flotan "para siempre", así que sin límite
        // el array crecería sin parar en una sesión larga (cada toque suma
        // más). Al tocar el techo, se descartan las más viejas primero.
        const MAX_PARTICULAS = 160;
        function agregarParticulas(nuevas) {
            particulas.push(...nuevas);
            const exceso = particulas.length - MAX_PARTICULAS;
            if (exceso > 0) particulas.splice(0, exceso);
        }

        function lanzarExplosionCanvas() {
            canvas.classList.add('activo'); particulasActivas = true;
            const nuevas = [];
            for(let i=0; i<60; i++) nuevas.push(new Particula(canvas.width/2, canvas.height/2 + 50, true));
            for(let i=0; i<40; i++) nuevas.push(new Particula(null, null, false));
            agregarParticulas(nuevas);
            animarParticulas();
        }

        // Detalle romántico: un corazoncito sutil donde toques la pantalla (fuera de botones y controles)
        function lanzarCorazonSutil(x, y) {
            canvas.classList.add('activo'); particulasActivas = true;
            const nuevas = [];
            for (let i = 0; i < 3; i++) {
                const p = new Particula(x, y, true);
                p.tipo = ['💗','✨','💫'][Math.floor(Math.random() * 3)];
                p.size = Math.random() * 8 + 12;
                p.velocidadY = Math.random() * -4 - 2;
                p.velocidadX = Math.random() * 3 - 1.5;
                p.gravedad = 0.08;
                nuevas.push(p);
            }
            agregarParticulas(nuevas);
            animarParticulas();
        }

        document.addEventListener('pointerdown', (event) => {
            const objetivo = event.target;
            if (objetivo.closest('button, input, .btn, .btn-azar, .reproductor-flotante, .menu-principal, .puerta, a')) return;
            lanzarCorazonSutil(event.clientX, event.clientY);
        }, { passive: true });

        // CUENTA REGRESIVA: 25 de agosto de 2026 a las 13hs, la primera vez que se ven en persona
        const fechaEncuentro = new Date(2026, 7, 25, 12, 0, 0);
        let intervaloCuentaRegresiva = null;

        let modoAscendenteActivado = false;

        function setTextoSiExiste(id, texto) {
            const el = document.getElementById(id);
            if (el) el.innerText = texto;
        }

        function actualizarCuentaRegresiva() {
            const elDias = document.getElementById('cr-dias');
            const elDiasFlotante = document.getElementById('fr-dias');
            if (!elDias && !elDiasFlotante) return; // todavía no se construyó ninguna de las dos pantallas

            const ahora = new Date();
            let diff = fechaEncuentro - ahora;

            if (diff <= 0) {
                // Ya nos vimos en persona: el reloj se da vuelta y empieza a contar
                // hace cuánto empezó nuestra historia en el plano real.
                if (!modoAscendenteActivado) {
                    modoAscendenteActivado = true;
                    setTextoSiExiste('cuenta-subtitulo', 'Desde que nos vimos');
                    setTextoSiExiste('cuenta-titulo', 'Nuestra historia en el mundo real');
                    setTextoSiExiste('cuenta-fecha', 'Empezó el 25 de agosto de 2026, 12 hs');
                    setTextoSiExiste('cuenta-frase', 'Cada segundo que pasa, esto es más real 💫');
                    setTextoSiExiste('fr-subtitulo', 'Desde que nos vimos');
                    setTextoSiExiste('fr-titulo', 'Nuestro segundo cero');
                    setTextoSiExiste('fr-fecha', 'Empezó el 25 de agosto de 2026, 12 hs');
                    const msj = document.getElementById('cuenta-mensaje');
                    if (msj) {
                        msj.innerText = '¡Hoy es el día! 🎉';
                        msj.style.display = 'block';
                        setTimeout(() => { msj.style.display = 'none'; }, 5000);
                    }
                }

                let transcurrido = ahora - fechaEncuentro;
                const dias = Math.floor(transcurrido / 86400000); transcurrido -= dias * 86400000;
                const horas = Math.floor(transcurrido / 3600000); transcurrido -= horas * 3600000;
                const min = Math.floor(transcurrido / 60000); transcurrido -= min * 60000;
                const seg = Math.floor(transcurrido / 1000);

                setTextoSiExiste('cr-dias', dias);
                setTextoSiExiste('cr-horas', String(horas).padStart(2, '0'));
                setTextoSiExiste('cr-min', String(min).padStart(2, '0'));
                setTextoSiExiste('cr-seg', String(seg).padStart(2, '0'));
                setTextoSiExiste('fr-dias', dias);
                setTextoSiExiste('fr-horas', String(horas).padStart(2, '0'));
                setTextoSiExiste('fr-min', String(min).padStart(2, '0'));
                setTextoSiExiste('fr-seg', String(seg).padStart(2, '0'));
                return;
            }

            const dias = Math.floor(diff / 86400000); diff -= dias * 86400000;
            const horas = Math.floor(diff / 3600000); diff -= horas * 3600000;
            const min = Math.floor(diff / 60000); diff -= min * 60000;
            const seg = Math.floor(diff / 1000);

            setTextoSiExiste('cr-dias', dias);
            setTextoSiExiste('cr-horas', String(horas).padStart(2, '0'));
            setTextoSiExiste('cr-min', String(min).padStart(2, '0'));
            setTextoSiExiste('cr-seg', String(seg).padStart(2, '0'));
            setTextoSiExiste('fr-dias', dias);
            setTextoSiExiste('fr-horas', String(horas).padStart(2, '0'));
            setTextoSiExiste('fr-min', String(min).padStart(2, '0'));
            setTextoSiExiste('fr-seg', String(seg).padStart(2, '0'));
        }
        actualizarCuentaRegresiva();
        intervaloCuentaRegresiva = setInterval(actualizarCuentaRegresiva, 1000);

        // AUDIO FX
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        let audioCtx;
        function iniciarAudio() { if (!audioCtx) audioCtx = new AudioContext(); }

        function reproducirGolpeMaderaMaciza() {
            iniciarAudio();
            const oscBase = audioCtx.createOscillator(); const oscResonancia = audioCtx.createOscillator();
            const filtroBase = audioCtx.createBiquadFilter(); const gainNode = audioCtx.createGain();
            oscBase.type = 'sine'; oscBase.frequency.setValueAtTime(65, audioCtx.currentTime); oscBase.frequency.exponentialRampToValueAtTime(30, audioCtx.currentTime + 0.1);
            oscResonancia.type = 'triangle'; oscResonancia.frequency.setValueAtTime(120, audioCtx.currentTime); oscResonancia.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.05);
            filtroBase.type = 'lowpass'; filtroBase.frequency.setValueAtTime(400, audioCtx.currentTime); filtroBase.frequency.exponentialRampToValueAtTime(80, audioCtx.currentTime + 0.1);
            gainNode.gain.setValueAtTime(1, audioCtx.currentTime); gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);
            oscBase.connect(filtroBase); oscResonancia.connect(filtroBase); filtroBase.connect(gainNode); gainNode.connect(audioCtx.destination);
            oscBase.start(); oscResonancia.start(); oscBase.stop(audioCtx.currentTime + 0.15); oscResonancia.stop(audioCtx.currentTime + 0.15);
        }

        function reproducirAcordeMagico() {
            iniciarAudio();
            const frecuencias = [523.25, 659.25, 783.99, 987.77]; 
            frecuencias.forEach((freq, index) => {
                const osc = audioCtx.createOscillator(); const gain = audioCtx.createGain();
                osc.type = 'sine'; osc.frequency.value = freq + (Math.random() * 2 - 1); 
                gain.gain.setValueAtTime(0, audioCtx.currentTime); gain.gain.linearRampToValueAtTime(0.15, audioCtx.currentTime + 0.5 + (index * 0.1)); gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 4.5);
                osc.connect(gain); gain.connect(audioCtx.destination); osc.start(audioCtx.currentTime); osc.stop(audioCtx.currentTime + 5);
            });
        }

        // Sonido suave y dulce para cada emoji/partícula que cae en las lluvias
        // (una campanita chiquita y breve, en el mismo espíritu que el "toc toc" de la puerta)
        function reproducirSonidoCaida() {
            try {
                iniciarAudio();
                const ahora = audioCtx.currentTime;
                const notas = [659.25, 783.99, 880, 987.77, 1046.5]; // Mi, Sol, La, Si, Do (pentatónica, siempre suena dulce)
                const freq = notas[Math.floor(Math.random() * notas.length)];

                const filtro = audioCtx.createBiquadFilter();
                filtro.type = 'lowpass';
                filtro.frequency.setValueAtTime(2600, ahora);
                filtro.Q.value = 0.5;

                const gain = audioCtx.createGain();
                gain.gain.setValueAtTime(0, ahora);
                gain.gain.linearRampToValueAtTime(0.03, ahora + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.0001, ahora + 0.22);

                // Fundamental + un armónico suave una octava arriba, para un toque de campanita cálida
                const oscBase = audioCtx.createOscillator();
                oscBase.type = 'sine'; oscBase.frequency.setValueAtTime(freq, ahora);
                const oscArmonico = audioCtx.createOscillator();
                oscArmonico.type = 'sine'; oscArmonico.frequency.setValueAtTime(freq * 2, ahora);
                const gainArmonico = audioCtx.createGain();
                gainArmonico.gain.value = 0.25;

                let salida = filtro;
                if (typeof audioCtx.createStereoPanner === 'function') {
                    const panner = audioCtx.createStereoPanner();
                    panner.pan.value = Math.random() * 1.2 - 0.6; // un poquito de espacio, nunca a un extremo
                    filtro.connect(panner);
                    salida = panner;
                }

                oscBase.connect(filtro);
                oscArmonico.connect(gainArmonico); gainArmonico.connect(filtro);
                salida.connect(gain); gain.connect(audioCtx.destination);

                oscBase.start(ahora); oscArmonico.start(ahora);
                oscBase.stop(ahora + 0.24); oscArmonico.stop(ahora + 0.24);
            } catch (e) { /* silencioso */ }
        }

        // ==================== REPRODUCTOR DE MÚSICA ====================
        // (Migrado a js/inicio/reproductor.js, cargado bajo demanda: la API
        // de YouTube ya no se pide sola al abrir la página.)
        let temporizadorAutoColapso = null;

        async function toggleReproductor(event) {
            if (event) event.stopPropagation();
            vibrar(15);
            const repFlotante = document.getElementById('reproductor-flotante');
            const estaAbierto = repFlotante.classList.toggle('abierto');
            clearTimeout(temporizadorAutoColapso);
            if (estaAbierto) {
                // Si nadie interactúa, se recoge solo a los pocos segundos para no tapar la pantalla
                temporizadorAutoColapso = setTimeout(() => repFlotante.classList.remove('abierto'), 6000);
                if (!window._featureCargada_reproductor) {
                    try {
                        await window.asegurarFeatureCargada('reproductor');
                        window._featureCargada_reproductor = true;
                        iniciarReproductorInterno();
                    } catch (err) { console.error('No se pudo cargar el Reproductor:', err); }
                }
            }
        }

        document.addEventListener('click', (event) => {
            const repFlotante = document.getElementById('reproductor-flotante');
            if (repFlotante.classList.contains('abierto') && !repFlotante.contains(event.target)) {
                repFlotante.classList.remove('abierto');
                clearTimeout(temporizadorAutoColapso);
            }
            const chatFlotante = document.getElementById('chat-flotante');
            const modalAcceso = document.getElementById('modal-acceso');
            const dentroDelModalAcceso = modalAcceso.contains(event.target);
            if (chatFlotante.classList.contains('abierto') && !chatFlotante.contains(event.target) && !dentroDelModalAcceso) {
                chatFlotante.classList.remove('abierto');
            }
            const gratitudFlotante = document.getElementById('gratitud-flotante');
            if (gratitudFlotante.classList.contains('abierto') && !gratitudFlotante.contains(event.target) && !dentroDelModalAcceso) {
                gratitudFlotante.classList.remove('abierto');
            }
            const deseosFlotante = document.getElementById('deseos-flotante');
            if (deseosFlotante.classList.contains('abierto') && !deseosFlotante.contains(event.target) && !dentroDelModalAcceso) {
                deseosFlotante.classList.remove('abierto');
            }
            const preguntasFlotante = document.getElementById('preguntas-flotante');
            if (preguntasFlotante.classList.contains('abierto') && !preguntasFlotante.contains(event.target)) {
                preguntasFlotante.classList.remove('abierto');
            }
            const relojFlotante = document.getElementById('reloj-flotante');
            if (relojFlotante.classList.contains('abierto') && !relojFlotante.contains(event.target)) {
                relojFlotante.classList.remove('abierto');
            }
            const menuPrincipal = document.getElementById('menu-principal');
            if (menuPrincipal.classList.contains('abierto') && !menuPrincipal.contains(event.target)) {
                menuPrincipal.classList.remove('abierto');
            }
        });

        // VIBRACIÓN TÁCTIL (funciona solo en celulares compatibles; en el resto no rompe nada)
        function vibrar(patron) {
            try {
                if (navigator.vibrate) navigator.vibrate(patron);
            } catch (e) { /* silencioso */ }
        }
        window.vibrarJ = vibrar; // alias: el motor de reflexión (reusado de los juegos) usa este nombre

        // Mensaje secreto: tocando el corazón de la casa iluminada aparece una frase distinta cada vez
        const secretosCasa = [
            "Sos mi persona favorita en este mundo. Siempre.",
            "Cada vez que pienso en vos, sonrío solo.",
            "Esto es solo un poquito de lo que siento.",
            "Gracias por existir, Carito.",
            "No hay nada de vos que no ame."
        ];
        let indiceSecreto = 0;
        let temporizadorSecreto = null;

        function revelarSecreto(event) {
            if (!document.getElementById('luz-interior').classList.contains('iluminar')) return;
            if (event) event.stopPropagation();
            vibrar(20);

            const el = document.getElementById('secreto-puerta');
            el.innerText = secretosCasa[indiceSecreto % secretosCasa.length];
            indiceSecreto++;
            el.classList.add('mostrar');

            clearTimeout(temporizadorSecreto);
            temporizadorSecreto = setTimeout(() => el.classList.remove('mostrar'), 3200);
        }

        // INTERACCION
        let golpeando = false;
        let pasoActual = 1;
        let conversacionActiva = false;

        function interaccionPuerta(event) {
            if (golpeando || conversacionActiva || document.getElementById('puerta-id').classList.contains('abierta')) return;
            document.getElementById('mensaje-final').style.display = 'none';
            document.getElementById('marco-exterior').classList.add('oculto-pista');
            pasoActual = 1; golpeando = true; conversacionActiva = true;

            const toc1 = document.getElementById('toc1'); const toc2 = document.getElementById('toc2');
            reproducirGolpeMaderaMaciza(); vibrar(30);
            toc1.style.left = (event.clientX - 50) + 'px'; toc1.style.top = (event.clientY - 40) + 'px';
            toc1.classList.add('mostrar'); setTimeout(() => toc1.classList.remove('mostrar'), 300);
            if (typeof lanzarCorazonSutil === 'function') lanzarCorazonSutil(event.clientX, event.clientY);

            setTimeout(() => {
                reproducirGolpeMaderaMaciza(); vibrar(30);
                toc2.style.left = (event.clientX + 30) + 'px'; toc2.style.top = (event.clientY - 20) + 'px';
                toc2.classList.add('mostrar'); setTimeout(() => toc2.classList.remove('mostrar'), 300);
                if (typeof lanzarCorazonSutil === 'function') lanzarCorazonSutil(event.clientX + 30, event.clientY - 20);
            }, 500);

            setTimeout(() => {
                document.getElementById('pregunta1').classList.add('mostrar');
                setTimeout(() => { document.getElementById('botones').classList.add('mostrar'); golpeando = false; }, 700);
            }, 1200);
        }

        const mensajesNo = [
            "Ok, vuelvo en un rato...",
            "Tengo algo que me urge decirte... 👀",
            "En serio, esto no puede esperar 🥺",
            "Última oportunidad de decir que sí (mentira, hay más) 😏",
            "Bueno, entro igual. No hay escapatoria 💛"
        ];
        let contadorNo = 0;

        function responder(opcion, event) {
            vibrar(opcion === 'SI' ? [15, 40, 15] : 15);
            if (opcion === 'SI' && event && event.target && typeof lanzarCorazonSutil === 'function') {
                const rect = event.target.getBoundingClientRect();
                lanzarCorazonSutil(rect.left + rect.width / 2, rect.top);
            }
            document.getElementById('botones').classList.remove('mostrar');
            if (opcion === 'NO') {
                document.getElementById('pregunta1').classList.remove('mostrar'); document.getElementById('pregunta2').classList.remove('mostrar');
                const esUltimo = contadorNo >= mensajesNo.length - 1;
                const msjNo = mensajesNo[Math.min(contadorNo, mensajesNo.length - 1)];
                contadorNo++;
                setTimeout(() => {
                    const elMsj = document.getElementById('mensaje-final');
                    elMsj.innerText = msjNo;
                    elMsj.style.display = 'block';
                    if (esUltimo) {
                        // Remate del chiste: entra igual, como si hubiera dicho que sí
                        setTimeout(() => {
                            elMsj.style.display = 'none';
                            pasoActual = 2;
                            responder('SI', null);
                        }, 1800);
                    } else {
                        // La conversación sigue sola: vuelve a preguntar sin repetir el toc-toc
                        setTimeout(() => {
                            elMsj.style.display = 'none';
                            pasoActual = 1;
                            document.getElementById('pregunta1').classList.add('mostrar');
                            document.getElementById('botones').classList.add('mostrar');
                        }, 1800);
                    }
                }, 300);
            } 
            else if (opcion === 'SI') {
                if (pasoActual === 1) {
                    document.getElementById('pregunta1').classList.remove('mostrar'); pasoActual = 2; 
                    setTimeout(() => { document.getElementById('pregunta2').classList.add('mostrar'); document.getElementById('botones').classList.add('mostrar'); }, 500);
                } 
                else if (pasoActual === 2) {
                    document.getElementById('pregunta2').classList.remove('mostrar'); document.getElementById('luz-interior').classList.add('iluminar');

                    setTimeout(() => {
                        document.getElementById('puerta-id').classList.add('abierta');
                        vibrar([40, 60, 40, 60, 120]); // el momento más emotivo
                        reproducirAcordeMagico(); lanzarExplosionCanvas();

                        // A partir de acá, en vez de esperar quietos con la puerta
                        // abierta y recién después mostrar el universo de golpe, toda
                        // la escena de la puerta se disuelve/acerca (como si avanzáramos
                        // hacia adentro) mientras arranca el salto a las estrellas — ver
                        // mostrarUniversoCorazonConViaje().
                        setTimeout(mostrarUniversoCorazonConViaje, 400);
                    }, 400);
                }
            }
        }

        function mostrarUniversoCorazon() {
            const universo = document.getElementById('universo-corazon');
            universo.style.display = 'flex';
            document.getElementById('scroll-aviso').style.display = 'none';
            setTimeout(() => universo.classList.add('activo'), 50);
            if (typeof window.iniciarUniversoEstrellas === 'function') window.iniciarUniversoEstrellas();
        }

        // Todas las burbujas flotantes (chat, muro, gratitud, etc.) quedan
        // "listas" para que sus paneles funcionen apenas alguien las toque
        // desde el universo — pero nada se dispara ni se abre solo.
        function mostrarBurbujasFlotantes() {
            const repFlotante = document.getElementById('reproductor-flotante');
            repFlotante.style.display = 'flex';
            setTimeout(() => repFlotante.classList.add('mostrar'), 100);

            const chatFlotante = document.getElementById('chat-flotante');
            chatFlotante.style.display = 'flex';
            setTimeout(() => chatFlotante.classList.add('mostrar'), 150);

            const muroFlotante = document.getElementById('muro-flotante');
            muroFlotante.style.display = 'flex';
            setTimeout(() => muroFlotante.classList.add('mostrar'), 200);

            const gratitudFlotante = document.getElementById('gratitud-flotante');
            gratitudFlotante.style.display = 'flex';
            setTimeout(() => gratitudFlotante.classList.add('mostrar'), 250);

            const deseosFlotante = document.getElementById('deseos-flotante');
            deseosFlotante.style.display = 'flex';
            setTimeout(() => deseosFlotante.classList.add('mostrar'), 300);

            const preguntasFlotante = document.getElementById('preguntas-flotante');
            preguntasFlotante.style.display = 'flex';
            setTimeout(() => preguntasFlotante.classList.add('mostrar'), 350);

            const relojFlotante = document.getElementById('reloj-flotante');
            relojFlotante.style.display = 'flex';
            setTimeout(() => relojFlotante.classList.add('mostrar'), 400);

            const sorpresaFlotante = document.getElementById('sorpresa-flotante');
            sorpresaFlotante.style.display = 'flex';
            setTimeout(() => sorpresaFlotante.classList.add('mostrar'), 450);
        }

        // Sólo para el momento exacto de abrir la puerta por primera vez:
        // en vez de mostrar el universo de golpe, arranca el "salto a las
        // estrellas" (iniciarViajeEstrellas en universo-3d.js) — la escena
        // de la puerta se disuelve, el cielo del universo ya está
        // dibujando el salto, y el título/corazón/burbujas recién
        // aparecen cuando el salto está por terminar. volverAlUniverso()
        // y entrarALaCarta() siguen usando la mostrarUniversoCorazon()
        // de siempre (instantánea) — el viaje es sólo para la puerta.
        function mostrarUniversoCorazonConViaje() {
            document.querySelector('.pantalla-puerta').classList.add('viaje-salida');

            const universo = document.getElementById('universo-corazon');
            universo.style.display = 'flex';
            universo.classList.add('viaje');
            document.getElementById('scroll-aviso').style.display = 'none';
            setTimeout(() => universo.classList.add('activo'), 50);

            const alTerminarViaje = () => {
                universo.classList.remove('viaje');
                mostrarBurbujasFlotantes();
            };
            if (typeof window.iniciarViajeEstrellas === 'function') {
                window.iniciarViajeEstrellas(alTerminarViaje);
            } else {
                // Respaldo por si universo-3d.js todavía no cargó: el
                // universo igual aparece, sin el efecto del salto.
                if (typeof window.iniciarUniversoEstrellas === 'function') window.iniciarUniversoEstrellas();
                setTimeout(alTerminarViaje, 300);
            }
        }

        // Entrar al libro es una elección: se toca "La Carta" en el corazón,
        // nunca se abre ni avanza solo.
        function entrarALaCarta(event) {
            if (event) event.stopPropagation();
            vibrar(15);
            const universo = document.getElementById('universo-corazon');
            universo.classList.remove('activo');
            setTimeout(() => { universo.style.display = 'none'; }, 500);
            if (typeof window.detenerUniversoEstrellas === 'function') window.detenerUniversoEstrellas();

            document.getElementById('contenedor').classList.add('activo');
            document.getElementById('scroll-aviso').style.display = 'block';
            document.getElementById('nav-pantallas').classList.add('mostrar');

            const btnIndiceRapido = document.getElementById('btn-indice-rapido');
            btnIndiceRapido.classList.add('mostrar');
            setTimeout(() => btnIndiceRapido.classList.add('visible-suave'), 100);

            const btnAutoAvance = document.getElementById('btn-auto-avance');
            btnAutoAvance.classList.add('mostrar');
            setTimeout(() => btnAutoAvance.classList.add('visible-suave'), 150);

            const btnAzar = document.getElementById('btn-azar');
            btnAzar.style.display = 'flex'; setTimeout(() => btnAzar.classList.add('mostrar'), 100);

            const menuPrincipal = document.getElementById('menu-principal');
            menuPrincipal.style.display = 'flex';
            setTimeout(() => menuPrincipal.classList.add('mostrar'), 200);
        }

        // Vuelve a la constelación-corazón desde el libro (o desde cualquier panel abierto).
        function volverAlUniverso(event) {
            if (event) event.stopPropagation();
            vibrar(12);
            document.getElementById('contenedor').classList.remove('activo');
            document.getElementById('nav-pantallas').classList.remove('mostrar');

            const btnIndiceRapido = document.getElementById('btn-indice-rapido');
            btnIndiceRapido.classList.remove('mostrar', 'visible-suave');
            const btnAutoAvance = document.getElementById('btn-auto-avance');
            btnAutoAvance.classList.remove('mostrar', 'visible-suave');
            const btnAzar = document.getElementById('btn-azar');
            btnAzar.classList.remove('mostrar'); btnAzar.style.display = 'none';

            document.getElementById('menu-principal').classList.remove('mostrar');

            mostrarUniversoCorazon();
        }

        // El núcleo del corazón manda una sorpresa al azar entre los seis efectos existentes:
        // recompensa variable, cada toque puede traer algo distinto.
        function lanzarSorpresaAleatoria(event) {
            if (event) event.stopPropagation();
            const efectos = [lanzarLluviaTeAmo, lanzarLluviaBesosMenu, lanzarLluviaAbrazos, lanzarLluviaChocolate, lanzarLluviaFlores, lanzarLluviaEstrellas];
            const elegido = efectos[Math.floor(Math.random() * efectos.length)];
            if (typeof elegido === 'function') elegido(event);
        }

        // ==========================================
        // MOTOR DE BASE DE DATOS: CHAT Y MURO
        // ==========================================

        let miIdentidad = localStorage.getItem("identidadRefugio");
        let miRival = miIdentidad === 'nico' ? 'carito' : (miIdentidad === 'carito' ? 'nico' : null);
        function nombreJugador(id) { return id === 'carito' ? 'Carito' : 'Nico'; }
        // Este archivo se ejecuta al cargar la página, antes de que el
        // portón de acceso (js/auth-gate.js) confirme quién es — así que
        // en el momento en que se lee arriba, identidadRefugio todavía
        // puede no existir en localStorage aunque el usuario recién haya
        // entrado. auth-gate.js dispara este evento apenas confirma, así
        // que lo escuchamos para no quedarnos con miIdentidad/miRival en
        // null para el resto de la sesión (rompía chat, gratitud, muro, etc.)
        document.addEventListener('acceso-concedido', (e) => {
            miIdentidad = e.detail.usuario;
            miRival = miIdentidad === 'nico' ? 'carito' : 'nico';
            iniciarEscuchaChatNoLeidos(); // ya tiene su propio guard, no se duplica si ya había arrancado
        });
        // chatIniciado, muroIniciado, gratitudIniciado y deseosIniciado
        // ahora viven en sus propios módulos (js/inicio/*.js).
        let accionPendiente = null; // 'chat', 'muro', 'gratitud' o 'deseos'

        // --- Sistema de acceso y seguridad ---
        function requerirIdentidad(accion) {
            if (miIdentidad) {
                ejecutarAccion(accion);
            } else {
                accionPendiente = accion;
                document.getElementById('modal-acceso').classList.remove('oculto');
                setTimeout(() => document.getElementById('input-clave').focus(), 100);
            }
        }

        function verificarIdentidad() {
            let clave = document.getElementById('input-clave').value.toLowerCase().trim();
            if (clave === "nico" || clave === "carito") {
                vibrar(15);
                miIdentidad = clave;
                miRival = miIdentidad === 'nico' ? 'carito' : 'nico';
                localStorage.setItem("identidadRefugio", miIdentidad);
                iniciarEscuchaChatNoLeidos();
                document.getElementById('modal-acceso').classList.add('oculto');
                document.getElementById('input-clave').value = '';
                document.getElementById('error-clave').innerText = "";
                if (accionPendiente) ejecutarAccion(accionPendiente);
            } else {
                vibrar([10, 40, 10]);
                document.getElementById('error-clave').innerText = "Llave incorrecta. Solo nuestro amor puede abrir esto.";
                document.getElementById('input-clave').value = '';
            }
        }

        function verificarEnterAcceso(e) { if (e.key === "Enter") verificarIdentidad(); }

        function ejecutarAccion(accion) {
            if (accion === 'chat') cargarChatSiHaceFalta();
            if (accion === 'muro') cargarMuroSiHaceFalta();
            if (accion === 'gratitud') cargarFeatureFlotanteSiHaceFalta('gratitud', 'gratitud-flotante', 'abrirGratitudInterno');
            if (accion === 'deseos') cargarFeatureFlotanteSiHaceFalta('deseos', 'deseos-flotante', 'abrirDeseosInterno');
            if (accion === 'ticket') cargarTicketSiHaceFalta();
            if (accion === 'sanacion') cargarSanacionSiHaceFalta();
            if (accion === 'preguntas') cargarPreguntasIndexSiHaceFalta();
        }

        // --- Lógica del chat privado ---
        // --- Menú principal único: desplegar/contraer y disparar la opción elegida ---
        function toggleMenuPrincipal(event) {
            if (event) event.stopPropagation();
            document.getElementById('menu-principal').classList.toggle('abierto');
        }

        function ejecutarOpcionMenu(event, opcion) {
            if (event) event.stopPropagation();
            document.getElementById('menu-principal').classList.remove('abierto');
            switch (opcion) {
                case 'musica': toggleReproductor(event); break;
                case 'chat': toggleChat(event); break;
                case 'muro': abrirMuro(event); break;
                case 'gratitud': toggleGratitud(event); break;
                case 'deseos': toggleDeseos(event); break;
                case 'preguntas': togglePreguntas(event); break;
                case 'reloj': toggleReloj(event); break;
                case 'ticket': toggleTicket(event); break;
                case 'sanacion': toggleSanacion(event); break;
            }
        }

        function toggleChat(event) {
            if (event) event.stopPropagation();
            const chatFlotante = document.getElementById('chat-flotante');
            if (chatFlotante.classList.contains('abierto')) {
                chatFlotante.classList.remove('abierto');
            } else {
                marcarChatComoVisto();
                requerirIdentidad('chat');
            }
        }

        async function cargarChatSiHaceFalta() {
            document.getElementById('chat-flotante').classList.add('abierto');
            if (window._featureCargada_chat) { abrirChatInterno(); return; }
            try {
                await window.asegurarFeatureCargada('chat');
                window._featureCargada_chat = true;
                abrirChatInterno();
            } catch (err) { console.error('No se pudo cargar el Chat:', err); }
        }

        /* function abrirChatInterno() -> migrado a js/inicio/ */


        /* async function enviarMensajeChat() -> migrado a js/inicio/ */


        /* function verificarEnterChat(e) -> migrado a js/inicio/ */


        // ==================== INDICADOR DE MENSAJE NUEVO ====================
        // iniciarEscuchaChatNoLeidos, marcarChatComoNoLeido y
        // marcarChatComoVisto viven en js/chat-comun.js (compartido con
        // juegos.html) — antes "visto" se guardaba sólo en el localStorage
        // de cada uno, así que un dispositivo nunca sabía si el OTRO ya
        // había leído; ahora es un recibo compartido en Firestore.

        // Si ya sabíamos quiénes somos de una visita anterior (miIdentidad
        // viene de localStorage), arrancamos la escucha ya mismo, sin
        // esperar a que se abra el chat ni se pida la llave de nuevo —
        // pero primero hay que esperar a que termine el login anónimo
        // (ver el módulo de Firebase más arriba), si es que no terminó ya.
        function _arrancarEscuchaChatSiCorresponde() {
            if (miIdentidad) iniciarEscuchaChatNoLeidos();
        }
        if (window._firebaseListoIndex) _arrancarEscuchaChatSiCorresponde();
        else document.addEventListener('firebase-listo-index', _arrancarEscuchaChatSiCorresponde, { once: true });

        // Devuelve "Hoy", "Ayer" o la fecha en formato "12 de agosto" (con año si no es el actual),
        // igual que los separadores de fecha de WhatsApp.
        /* function etiquetaFechaChat(fecha) -> migrado a js/inicio/ */
        

        // --- Lógica del Muro en el Tiempo ---
        function abrirMuro(event) { if (event) event.stopPropagation(); requerirIdentidad('muro'); }
        function cerrarMuro() { document.getElementById('modal-muro').classList.add('oculto'); }
        async function cargarMuroSiHaceFalta() {
            if (window._featureCargada_muro) { abrirMuroInterno(); return; }
            try {
                await window.asegurarFeatureCargada('muro');
                window._featureCargada_muro = true;
                abrirMuroInterno();
            } catch (err) { console.error('No se pudo cargar el Muro:', err); }
        }

        // ================== EDICIÓN Y BORRADO (Muro, Gratitud, Deseos) ==================
        // Cada tarjeta/fila que le pertenece a la identidad actual (nico/carito)
        // recibe botones de editar y borrar. Reutilizable para las 3 colecciones.
        function crearFilaAcciones(coleccion, id, textoEl, mensajeConfirmacionBorrado) {
            const fila = document.createElement('div');
            fila.className = 'fila-acciones-item';
            const btnEditar = document.createElement('button');
            btnEditar.type = 'button'; btnEditar.className = 'btn-accion-item';
            btnEditar.innerText = '✏️ Editar'; btnEditar.setAttribute('aria-label', 'Editar este mensaje');
            btnEditar.onclick = (e) => { e.stopPropagation(); iniciarEdicionInline(coleccion, id, textoEl, fila); };
            const btnBorrar = document.createElement('button');
            btnBorrar.type = 'button'; btnBorrar.className = 'btn-accion-item borrar';
            btnBorrar.innerText = '🗑️ Borrar'; btnBorrar.setAttribute('aria-label', 'Borrar este mensaje');
            btnBorrar.onclick = (e) => { e.stopPropagation(); borrarItem(coleccion, id, mensajeConfirmacionBorrado); };
            fila.appendChild(btnEditar); fila.appendChild(btnBorrar);
            return fila;
        }

        function iniciarEdicionInline(coleccion, id, textoEl, filaAccionesOriginal) {
            const contenedorPadre = textoEl.parentElement;
            if (!contenedorPadre) return;

            const textarea = document.createElement('textarea');
            textarea.className = 'textarea-edicion-item';
            textarea.value = textoEl.innerText;
            textarea.rows = 2;
            textarea.maxLength = 300;

            const filaBotones = document.createElement('div');
            filaBotones.className = 'fila-acciones-item';
            const btnGuardar = document.createElement('button');
            btnGuardar.type = 'button'; btnGuardar.className = 'btn-accion-item'; btnGuardar.innerText = 'Guardar';
            const btnCancelar = document.createElement('button');
            btnCancelar.type = 'button'; btnCancelar.className = 'btn-accion-item'; btnCancelar.innerText = 'Cancelar';

            function restaurarVistaOriginal() {
                if (textarea.parentElement) textarea.replaceWith(textoEl);
                if (filaBotones.parentElement) filaBotones.remove();
                if (filaAccionesOriginal) filaAccionesOriginal.style.display = '';
            }

            btnCancelar.onclick = (e) => { e.stopPropagation(); restaurarVistaOriginal(); };
            btnGuardar.onclick = async (e) => {
                e.stopPropagation();
                const nuevoTexto = textarea.value.trim();
                if (!nuevoTexto) return;
                vibrar(12);
                btnGuardar.disabled = true; btnGuardar.innerText = 'Guardando...';
                try {
                    await window.updateDoc(window.doc(window.db, coleccion, id), { texto: nuevoTexto });
                    // El listener onSnapshot de cada lista re-renderiza solo con el nuevo texto
                } catch (err) {
                    console.error('Error editando mensaje:', err);
                    btnGuardar.disabled = false; btnGuardar.innerText = 'Guardar';
                }
            };
            textarea.addEventListener('click', (e) => e.stopPropagation());
            textarea.addEventListener('keydown', (e) => e.stopPropagation());

            filaBotones.appendChild(btnGuardar);
            filaBotones.appendChild(btnCancelar);
            if (filaAccionesOriginal) filaAccionesOriginal.style.display = 'none';
            textoEl.replaceWith(textarea);
            contenedorPadre.insertBefore(filaBotones, textarea.nextSibling);
            textarea.focus();
        }

        async function borrarItem(coleccion, id, mensajeConfirmacion) {
            const confirmado = window.confirm(mensajeConfirmacion || '¿Borrar este mensaje para siempre?');
            if (!confirmado) return;
            vibrar(15);
            try {
                await window.deleteDoc(window.doc(window.db, coleccion, id));
                // El listener onSnapshot de cada lista quita la tarjeta solo
            } catch (err) { console.error('Error borrando mensaje:', err); }
        }

        /* function abrirMuroInterno() -> migrado a js/inicio/ */
        

        /* async function guardarEnMuro() -> migrado a js/inicio/ */
        

        function viajarAlAzar() {
            vibrar(18);
            const numeroAleatorio = Math.floor(Math.random() * frasesRomanticas.length) + 1;
            const seccionDestino = document.getElementById(`frase-${numeroAleatorio}`);
            const btn = document.getElementById('btn-azar');
            btn.style.transform = 'scale(0.9)'; setTimeout(() => btn.style.transform = '', 150);
            const pantallas = obtenerPantallas();
            const indiceDestino = pantallas.indexOf(seccionDestino);
            if (indiceDestino !== -1) irAPantalla(indiceDestino);
        }

        // ============================================================
        // NAVEGACIÓN ENTRE PÁGINAS (scroll horizontal nativo + botones)
        // El paginado lo maneja el navegador con CSS Scroll Snap (eje X).
        // Las funciones de acá abajo solo llevan el foco calculando
        // offsetLeft + contenedor.scrollTo() (nada de scrollIntoView ni
        // de transform a mano): así el swipe, los botones ‹ › y el
        // auto-avance usan todos el mismo motor de scroll nativo, que es
        // el que mejor funciona en Android real.
        // ============================================================
        let indicePantallaActual = 0;

        function obtenerPantallas() {
            return Array.from(document.querySelectorAll('#pista-pantallas .pantalla'));
        }

        function indiceActualPantalla() {
            return indicePantallaActual;
        }

        function irAPantalla(indice) {
            const pantallas = obtenerPantallas();
            if (!pantallas.length) return;
            const destino = Math.max(0, Math.min(pantallas.length - 1, indice));
            contenedor.scrollTo({ left: pantallas[destino].offsetLeft, top: 0, behavior: 'smooth' });
            vibrar(10);
            pausarAutoAvance();
        }

        function irAId(id) {
            const el = document.getElementById(id);
            if (!el) return;
            contenedor.scrollTo({ left: el.offsetLeft, top: 0, behavior: 'smooth' });
            vibrar(10);
            pausarAutoAvance();
            document.getElementById('menu-principal') && document.getElementById('menu-principal').classList.remove('abierto');
        }

        // Resalta el botón de acceso rápido al índice cuando estamos
        // parados justo en la página del Índice.
        function actualizarIndiceVisual(idx) {
            const pantallas = obtenerPantallas();
            const objetivo = pantallas[idx];
            if (!objetivo) return;
            const btnIndice = document.getElementById('btn-indice-rapido');
            if (btnIndice) btnIndice.classList.toggle('activo-indice', objetivo.id === 'pantalla-indice');
        }

        function pantallaSiguiente() { irAPantalla(indiceActualPantalla() + 1); }
        function pantallaAnterior() { irAPantalla(indiceActualPantalla() - 1); }

        // Seguimiento de la página actual: como ahora el swipe es scroll
        // nativo (la persona puede deslizar libre sin pasar por
        // irAPantalla), necesitamos un observer aparte para saber en qué
        // página quedamos después de cada gesto, y así actualizar el botón
        // de índice y el corte del auto-avance.
        (function configurarSeguimientoDePagina() {
            if (typeof IntersectionObserver !== 'function') return;
            const pantallas = obtenerPantallas();
            const seguidor = new IntersectionObserver((entradas) => {
                entradas.forEach(entrada => {
                    if (!entrada.isIntersecting || entrada.intersectionRatio < 0.6) return;
                    const idx = pantallas.indexOf(entrada.target);
                    if (idx === -1) return;
                    indicePantallaActual = idx;
                    actualizarIndiceVisual(idx);
                });
            }, { root: contenedor, threshold: 0.6 });
            pantallas.forEach(sec => seguidor.observe(sec));
        })();

        // El scroll nativo también reinicia el auto-avance apenas la
        // persona interactúa a mano (swipe, trackpad, lo que sea).
        let temporizadorScrollUsuario = null;
        contenedor.addEventListener('scroll', () => {
            clearTimeout(temporizadorScrollUsuario);
            temporizadorScrollUsuario = setTimeout(() => { if (autoAvanceActivo) pausarAutoAvance(); }, 120);
        }, { passive: true });

        // Rueda del mouse (desktop): el scroll nativo es horizontal, pero
        // la rueda vertical del mouse no se traduce sola a ese eje en la
        // mayoría de los navegadores, así que la convertimos a mano.
        (function configurarRuedaMouse() {
            contenedor.addEventListener('wheel', (e) => {
                if (!contenedor.classList.contains('activo')) return;
                if (e.target && e.target.closest && e.target.closest(
                    '.mensajes-chat, .lista-gratitud, .lista-deseos, .cuerpo-preguntas, .muro-pantalla, .lista-indice, input, textarea, select'
                )) return;
                const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
                if (Math.abs(delta) < 4) return;
                contenedor.scrollBy({ left: delta, top: 0, behavior: 'auto' });
            }, { passive: true });
        })();

        // ================== AUTO-AVANCE (reproducir / pausar mensajes) ==================
        // Arranca en pausa por defecto: las pantallas NO pasan solas.
        // La persona decide cuándo darle play con el botón ▶️/⏸️ flotante.
        let autoAvanceActivo = false;
        let temporizadorAutoAvance = null;
        const INTERVALO_AUTO_AVANCE = 4500;

        function programarAutoAvance() {
            clearTimeout(temporizadorAutoAvance);
            if (!autoAvanceActivo) return;
            temporizadorAutoAvance = setTimeout(() => {
                const pantallas = obtenerPantallas();
                if (indicePantallaActual < pantallas.length - 1) {
                    pantallaSiguiente(); // pantallaSiguiente -> irAPantalla ya reprograma el próximo tick al final
                }
            }, INTERVALO_AUTO_AVANCE);
        }

        function pausarAutoAvance() {
            clearTimeout(temporizadorAutoAvance);
            if (autoAvanceActivo) programarAutoAvance();
        }

        // Botón ▶️/⏸️: la persona decide si los mensajes pasan solos o no.
        function toggleAutoAvance(event) {
            if (event) event.stopPropagation();
            autoAvanceActivo = !autoAvanceActivo;
            const btn = document.getElementById('btn-auto-avance');
            if (btn) {
                btn.textContent = autoAvanceActivo ? '⏸️' : '▶️';
                btn.setAttribute('aria-label', autoAvanceActivo ? 'Pausar avance automático' : 'Reproducir avance automático');
            }
            if (autoAvanceActivo) { vibrar(10); programarAutoAvance(); }
            else { vibrar(10); clearTimeout(temporizadorAutoAvance); }
        }

        // ================== RINCÓN DE LA GRATITUD ==================
        // (Migrado a js/inicio/gratitud.js, cargado bajo demanda.)
        function toggleGratitud(event) {
            if (event) event.stopPropagation();
            abrirFeatureFlotante('gratitud', 'gratitud-flotante', 'abrirGratitudInterno', 'gratitud');
        }

        // ================== LISTA DE DESEOS JUNTOS (BUCKET LIST) ==================
        // (Migrado a js/inicio/deseos.js, cargado bajo demanda.)
        function toggleDeseos(event) {
            if (event) event.stopPropagation();
            abrirFeatureFlotante('deseos', 'deseos-flotante', 'abrirDeseosInterno', 'deseos');
        }

        // ================== PREGUNTAS PARA NOSOTROS ==================
        // (El banco de 284 preguntas y la lógica de mostrar/enviar se
        // migraron a js/inicio/preguntas.js, cargado bajo demanda —
        // ver togglePreguntas() más abajo.)

        async function togglePreguntas(event) {
            if (event) event.stopPropagation();
            const preguntasFlotante = document.getElementById('preguntas-flotante');
            const estabaAbierto = preguntasFlotante.classList.toggle('abierto');
            if (!estabaAbierto) return;
            if (!miIdentidad) { preguntasFlotante.classList.remove('abierto'); requerirIdentidad('preguntas'); return; }
            await cargarPreguntasIndexSiHaceFalta();
        }

        async function cargarPreguntasIndexSiHaceFalta() {
            // Si veníamos de pedir la llave, el panel todavía no se abrió: lo abrimos ahora.
            const preguntasFlotante = document.getElementById('preguntas-flotante');
            preguntasFlotante.classList.add('abierto');
            if (window._preguntasIndexIniciado) return;
            const cont = document.getElementById('contenido-preguntasindex');
            cont.innerHTML = '<div class="panel texto-centro texto-tenue">Cargando…</div>';
            try {
                await window.asegurarFeatureCargada('preguntasindex');
                window._preguntasIndexIniciado = true;
                iniciarReflexionGenerico('preguntasindex');
            } catch (err) {
                console.error('No se pudo cargar Preguntas:', err);
                cont.innerHTML = '<div class="panel texto-centro texto-tenue">⚠️ No se pudo cargar. Revisá tu conexión e intentá de nuevo.</div>';
            }
        }

        // ================== TICKETS DIARIOS DE PAREJA (365 vales) ==================
        // (Migrado a js/inicio/ticket.js, cargado bajo demanda.)
        function toggleTicket(event) {
            if (event) event.stopPropagation();
            const modal = document.getElementById('modal-ticket');
            if (!modal.classList.contains('oculto')) {
                if (typeof cerrarTicket === 'function') cerrarTicket();
                else modal.classList.add('oculto');
            } else {
                requerirIdentidad('ticket');
            }
        }

        async function cargarTicketSiHaceFalta() {
            if (window._featureCargada_ticket) { abrirTicketInterno(); return; }
            try {
                await window.asegurarFeatureCargada('ticket');
                window._featureCargada_ticket = true;
                abrirTicketInterno();
            } catch (err) {
                console.error('No se pudo cargar Ticket Diario:', err);
            }
        }

        // ================== CAMINO DE SANACIÓN ==================
        // (Migrado a js/inicio/sanacion.js, cargado bajo demanda.)
        function toggleSanacion(event) {
            if (event) event.stopPropagation();
            const modal = document.getElementById('modal-sanacion');
            if (!modal.classList.contains('oculto')) {
                if (typeof cerrarSanacion === 'function') cerrarSanacion();
                else modal.classList.add('oculto');
            } else {
                requerirIdentidad('sanacion');
            }
        }

        async function cargarSanacionSiHaceFalta() {
            if (window._featureCargada_sanacion) { abrirSanacionInterno(); return; }
            try {
                await window.asegurarFeatureCargada('sanacion');
                window._featureCargada_sanacion = true;
                abrirSanacionInterno();
            } catch (err) {
                console.error('No se pudo cargar Camino de Sanación:', err);
            }
        }

        // ================== RELOJ / CUENTA REGRESIVA FLOTANTE ==================
        function toggleReloj(event) {
            if (event) event.stopPropagation();
            document.getElementById('reloj-flotante').classList.toggle('abierto');
        }

        // ==================== BOLETO DE AVIÓN DORADO ====================
        // (Migrado a js/inicio/boleto.js, cargado bajo demanda.)
        async function abrirBoleto(event) {
            if (event) event.stopPropagation();
            if (window._featureCargada_boleto) { abrirBoletoInterno(event); return; }
            try {
                await window.asegurarFeatureCargada('boleto');
                window._featureCargada_boleto = true;
                abrirBoletoInterno(event);
            } catch (err) { console.error('No se pudo cargar el Boleto:', err); }
        }

        // ==================== EL CIELO DE NUESTRO PRIMER DÍA ====================
        // (Migrado a js/inicio/cielo.js, cargado bajo demanda.)
        async function abrirCielo(event) {
            if (event) event.stopPropagation();
            if (window._featureCargada_cielo) { abrirCieloInterno(event); return; }
            try {
                await window.asegurarFeatureCargada('cielo');
                window._featureCargada_cielo = true;
                abrirCieloInterno(event);
            } catch (err) { console.error('No se pudo cargar El Cielo:', err); }
        }

        // FRASES DE AMOR FLOTANTES: aparecen cada tanto, solas, en toda la app
        // ============================================================
        const frasesDeAmorFlotantes = [
            "Cada estrella de este cielo lleva tu nombre.",
            "Contigo, hasta el universo se queda corto.",
            "Sos mi lugar favorito en cualquier mapa.",
            "Te elijo hoy y te elegiría en cada vida.",
            "Mi corazón encontró casa en el tuyo.",
            "Con vos todo se siente como un para siempre.",
            "Sos el motivo de mis mejores días.",
            "Te amo un poquito más que ayer.",
            "Nuestro amor es mi constelación favorita.",
            "Gracias por ser mi persona en este universo."
        ];
        let indiceFraseAnterior = -1;
        function mostrarFraseDeAmorFlotante() {
            const el = document.getElementById('frase-flotante-amor');
            if (!el) return;
            let indice;
            do { indice = Math.floor(Math.random() * frasesDeAmorFlotantes.length); }
            while (indice === indiceFraseAnterior && frasesDeAmorFlotantes.length > 1);
            indiceFraseAnterior = indice;
            el.textContent = frasesDeAmorFlotantes[indice];
            requestAnimationFrame(() => el.classList.add('mostrar'));
            setTimeout(() => el.classList.remove('mostrar'), 5200);
        }
        function iniciarCicloFrasesDeAmor() {
            if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
            setTimeout(function ciclo() {
                mostrarFraseDeAmorFlotante();
                const espera = 16000 + Math.random() * 9000; // cada 16-25s aprox
                setTimeout(ciclo, espera);
            }, 9000); // primera aparición a los 9s, para no saturar la intro
        }
        iniciarCicloFrasesDeAmor();
