// ============================================================
// universo-3d.js — cielo estrellado con profundidad real (3 capas con
// parallax), estrellas fugaces y una inclinación 3D del corazón que
// responde al dedo/mouse (o "respira" sola si nadie lo toca). Todo con
// <canvas> 2D + CSS 3D transforms — sin librerías externas: este sitio
// no tiene build ni bundler, y cualquier CDN (three.js incluido) es un
// punto de falla más si algún día queda inaccesible, además de pesar
// bastante para una sola pantalla. Con el canvas a mano se consigue
// prácticamente el mismo efecto (profundidad, brillo, movimiento) con
// cero dependencias y mejor rendimiento en celulares viejos.
//
// Se arranca/apaga desde mostrarUniversoCorazon() / entrarALaCarta()
// (ver index.html) para no gastar batería dibujando de fondo cuando
// esta pantalla no se ve.
// ============================================================
(function () {
    var canvas = null, ctx = null;
    var capas = [];
    var fugaces = [];
    var proximaFugazEn = 0;
    var animando = false;
    var rafId = null;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var anchoCss = 0, altoCss = 0;
    var reducirMovimiento = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ---------------- Estrellas con profundidad (parallax) ----------------
    var CONFIG_CAPAS = [
        { cantidad: 55, radioMin: 0.4, radioMax: 1.0, velocidad: 2, parallax: 6,  brilloMax: 0.55 }, // lejanas
        { cantidad: 35, radioMin: 0.8, radioMax: 1.6, velocidad: 5, parallax: 14, brilloMax: 0.8  }, // medias
        { cantidad: 18, radioMin: 1.3, radioMax: 2.3, velocidad: 9, parallax: 26, brilloMax: 1.0  }  // cercanas
    ];

    function crearCapas() {
        capas = CONFIG_CAPAS.map(function (cfg) {
            var estrellas = [];
            for (var i = 0; i < cfg.cantidad; i++) {
                estrellas.push({
                    x: Math.random(), y: Math.random(),
                    r: cfg.radioMin + Math.random() * (cfg.radioMax - cfg.radioMin),
                    fase: Math.random() * Math.PI * 2,
                    freq: 0.6 + Math.random() * 1.1,
                    tinte: Math.random() < 0.15 ? 'lila' : (Math.random() < 0.3 ? 'rosa' : 'blanco')
                });
            }
            return { cfg: cfg, estrellas: estrellas };
        });
    }

    function colorEstrella(tinte, alfa) {
        if (tinte === 'lila') return 'rgba(201,182,255,' + alfa + ')';
        if (tinte === 'rosa') return 'rgba(255,194,217,' + alfa + ')';
        return 'rgba(253,246,240,' + alfa + ')';
    }

    // ---------------- Planetas (fondo, decorativos, tonos pasteles) ----------------
    // Mismos colores que ya usa el resto del sitio (rosa/lila/menta/melocotón
    // pastel) para que se sienta parte del mismo universo, no algo pegado.
    var PLANETAS = [
        { xFrac: 0.14, yFrac: 0.12, r: 20, centro: '#fff0f6', borde: '#ffb3c6', anillo: false, parallax: 32, freq: 0.7, fase: 0.3 },
        { xFrac: 0.87, yFrac: 0.58, r: 15, centro: '#f2ecff', borde: '#c9b6ff', anillo: true, parallax: 28, freq: 0.55, fase: 1.8 },
        { xFrac: 0.16, yFrac: 0.88, r: 11, centro: '#eafffb', borde: '#a8edea', anillo: false, parallax: 24, freq: 0.85, fase: 3.1 }
    ];

    function dibujarPlanetas(t) {
        PLANETAS.forEach(function (p) {
            var bobY = reducirMovimiento ? 0 : Math.sin(t / 1000 * p.freq + p.fase) * 4;
            var px = p.xFrac * anchoCss + parallaxX * p.parallax;
            var py = p.yFrac * altoCss + bobY + parallaxY * p.parallax;

            if (p.anillo) {
                ctx.save();
                ctx.translate(px, py);
                ctx.rotate(-0.35);
                ctx.scale(1, 0.32);
                ctx.beginPath();
                ctx.arc(0, 0, p.r * 1.75, 0, Math.PI * 2);
                ctx.strokeStyle = 'rgba(201,182,255,0.55)';
                ctx.lineWidth = 2.2;
                ctx.stroke();
                ctx.restore();
            }

            var grad = ctx.createRadialGradient(px - p.r * 0.35, py - p.r * 0.35, p.r * 0.1, px, py, p.r);
            grad.addColorStop(0, p.centro);
            grad.addColorStop(1, p.borde);
            ctx.save();
            ctx.shadowColor = p.borde;
            ctx.shadowBlur = 14;
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(px, py, p.r, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
    }

    // ---------------- Sol (glow suave, un solo foco cálido pastel) ----------------
    var SOL = { xFrac: 0.82, yFrac: 0.1, r: 17, fase: 0 };

    function dibujarSol(t) {
        var px = SOL.xFrac * anchoCss + parallaxX * 20;
        var py = SOL.yFrac * altoCss + parallaxY * 20;
        var pulso = reducirMovimiento ? 1 : 0.9 + 0.1 * Math.sin(t / 1000 * 0.6);

        var halo = ctx.createRadialGradient(px, py, 0, px, py, SOL.r * 5.5 * pulso);
        halo.addColorStop(0, 'rgba(255,224,179,0.5)');
        halo.addColorStop(0.4, 'rgba(255,214,214,0.16)');
        halo.addColorStop(1, 'rgba(255,214,214,0)');
        ctx.save();
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(px, py, SOL.r * 5.5 * pulso, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        var nucleo = ctx.createRadialGradient(px - SOL.r * 0.3, py - SOL.r * 0.3, 1, px, py, SOL.r);
        nucleo.addColorStop(0, '#fffdf5');
        nucleo.addColorStop(1, '#ffd8a8');
        ctx.save();
        ctx.fillStyle = nucleo;
        ctx.beginPath();
        ctx.arc(px, py, SOL.r * pulso, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    // ---------------- Meteoritos (campo lento, distinto de las fugaces) ----------------
    // Rocas chiquitas a la deriva, con sombreado en dos tonos (no un
    // trazo de luz como las fugaces) — dan sensación de profundidad y
    // movimiento constante sin robarle protagonismo al corazón.
    var meteoros = [];
    function crearMeteoros() {
        meteoros = [];
        for (var i = 0; i < 5; i++) {
            meteoros.push({
                x: Math.random(), y: Math.random(),
                r: 2.5 + Math.random() * 3.5,
                velX: (0.006 + Math.random() * 0.01) * (Math.random() < 0.5 ? 1 : -1),
                velY: 0.004 + Math.random() * 0.008,
                rot: Math.random() * Math.PI * 2,
                velRot: (Math.random() < 0.5 ? 1 : -1) * (0.2 + Math.random() * 0.3),
                tinte: Math.random() < 0.5 ? ['#ffd9ea', '#ffb3c6'] : ['#e4dbff', '#c9b6ff']
            });
        }
    }

    function dibujarMeteoros(dtSeg) {
        meteoros.forEach(function (m) {
            if (!reducirMovimiento) {
                m.x = (m.x + m.velX * dtSeg + 1) % 1;
                m.y = (m.y + m.velY * dtSeg + 1) % 1;
                m.rot += m.velRot * dtSeg;
            }
            var px = m.x * anchoCss + parallaxX * 18;
            var py = m.y * altoCss + parallaxY * 18;
            ctx.save();
            ctx.translate(px, py);
            ctx.rotate(m.rot);
            var grad = ctx.createLinearGradient(-m.r, -m.r, m.r, m.r);
            grad.addColorStop(0, m.tinte[0]);
            grad.addColorStop(1, m.tinte[1]);
            ctx.fillStyle = grad;
            ctx.globalAlpha = 0.75;
            ctx.beginPath();
            // Piedrita con lados un poco irregulares en vez de un círculo perfecto.
            ctx.moveTo(m.r, 0);
            ctx.lineTo(m.r * 0.3, m.r * 0.9);
            ctx.lineTo(-m.r * 0.8, m.r * 0.5);
            ctx.lineTo(-m.r * 0.9, -m.r * 0.4);
            ctx.lineTo(m.r * 0.2, -m.r);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        });
    }

    // ---------------- Estrellas fugaces ----------------
    function programarProximaFugaz(t) {
        proximaFugazEn = t + 2600 + Math.random() * 5200;
    }

    function lanzarFugaz(t) {
        // Entra por arriba (a veces por un costado) y cruza en diagonal,
        // como una fugaz real — nunca dos veces exactamente igual.
        var desdeArriba = Math.random() < 0.7;
        var x0 = desdeArriba ? Math.random() * anchoCss : (Math.random() < 0.5 ? -20 : anchoCss + 20);
        var y0 = desdeArriba ? -20 : Math.random() * altoCss * 0.5;
        var angulo = (Math.PI * 0.18) + Math.random() * (Math.PI * 0.18); // baja hacia la derecha, distintas pendientes
        if (!desdeArriba && x0 > anchoCss) angulo = Math.PI - angulo; // si entra por la derecha, cruza hacia la izquierda
        var velocidad = 900 + Math.random() * 500; // px/seg
        fugaces.push({
            x: x0, y: y0,
            vx: Math.cos(angulo) * velocidad, vy: Math.sin(angulo) * velocidad,
            nacida: t, vida: 750 + Math.random() * 350,
            largo: 90 + Math.random() * 70
        });
    }

    function dibujarFugaces(t) {
        if (t >= proximaFugazEn && fugaces.length < 2) {
            lanzarFugaz(t);
            programarProximaFugaz(t);
        }
        for (var i = fugaces.length - 1; i >= 0; i--) {
            var f = fugaces[i];
            var edad = t - f.nacida;
            if (edad > f.vida) { fugaces.splice(i, 1); continue; }
            var progreso = edad / f.vida;
            var x = f.x + f.vx * (edad / 1000);
            var y = f.y + f.vy * (edad / 1000);
            var dir = Math.atan2(f.vy, f.vx);
            var colaX = x - Math.cos(dir) * f.largo;
            var colaY = y - Math.sin(dir) * f.largo;
            var opacidad = progreso < 0.15 ? (progreso / 0.15) : (1 - (progreso - 0.15) / 0.85);

            var grad = ctx.createLinearGradient(colaX, colaY, x, y);
            grad.addColorStop(0, 'rgba(255,255,255,0)');
            grad.addColorStop(0.55, 'rgba(255,236,214,' + (0.35 * opacidad) + ')');
            grad.addColorStop(1, 'rgba(255,255,255,' + (0.95 * opacidad) + ')');

            ctx.save();
            ctx.strokeStyle = grad;
            ctx.lineWidth = 1.6;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(colaX, colaY);
            ctx.lineTo(x, y);
            ctx.stroke();

            // Punto brillante en la cabeza, con resplandor real (shadowBlur)
            ctx.shadowColor = 'rgba(255,244,224,' + opacidad + ')';
            ctx.shadowBlur = 10;
            ctx.fillStyle = 'rgba(255,255,255,' + opacidad + ')';
            ctx.beginPath();
            ctx.arc(x, y, 1.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    // ---------------- Viaje a las estrellas (al abrir la puerta) ----------------
    // Efecto "salto a hiperespacio": un puñado de estrellas nace cerca
    // del centro (donde está la luz de la puerta) y sale disparada hacia
    // afuera, cada una dibujada como una raya (no un punto) que se
    // alarga con la velocidad — el mismo truco visual de cualquier
    // "warp speed" de película, con canvas 2D puro. Se desacelera solas
    // hasta fundirse en el cielo tranquilo de siempre, así la transición
    // se siente continua y no un corte entre dos animaciones distintas.
    var enViaje = false, viajeInicioT = 0;
    var DURACION_VIAJE_MS = 2000;
    var warpStars = [];

    function crearWarpStars() {
        warpStars = [];
        var cantidad = reducirMovimiento ? 0 : 90;
        for (var i = 0; i < cantidad; i++) {
            warpStars.push({
                angulo: Math.random() * Math.PI * 2,
                // Arrancan a distintas distancias del centro (no todas
                // juntas en el mismo punto) y con su propia velocidad
                // base, así no se ven como un anillo perfecto sino como
                // un campo de estrellas real.
                dist: Math.random() * 40,
                velBase: 260 + Math.random() * 420,
                grosor: 0.6 + Math.random() * 1.3,
                tinte: Math.random() < 0.2 ? 'lila' : (Math.random() < 0.4 ? 'rosa' : 'blanco')
            });
        }
    }

    // Suaviza el arranque y sobre todo el final (para que la desaceleración
    // se sienta natural y no como si las estrellas frenaran en seco).
    function easeOutCubic(x) { return 1 - Math.pow(1 - x, 3); }

    function dibujarWarpStars(t, progreso) {
        var cx = anchoCss / 2, cy = altoCss * 0.42;
        // Intensidad: fuerte al principio, se apaga sobre el final del
        // viaje (así el cielo normal ya se ve bastante antes de que las
        // rayas desaparezcan del todo, y el corte no se nota).
        var intensidad = Math.max(0, 1 - easeOutCubic(progreso));
        if (intensidad <= 0.01) return;
        var factorVel = 1 + intensidad * 3.2; // más rápido al principio del salto
        warpStars.forEach(function (s) {
            s.dist += s.velBase * factorVel * 0.016;
            var maxDist = Math.max(anchoCss, altoCss) * 0.75;
            if (s.dist > maxDist) { s.dist = Math.random() * 30; s.angulo = Math.random() * Math.PI * 2; }
            var dx = Math.cos(s.angulo), dy = Math.sin(s.angulo);
            var x = cx + dx * s.dist, y = cy + dy * s.dist;
            var largo = 14 + s.dist * 0.22 * intensidad; // raya más larga cuanto más "rápido" va
            var x0 = x - dx * largo, y0 = y - dy * largo;
            var alfa = intensidad * (0.35 + 0.65 * Math.min(s.dist / 90, 1));
            var grad = ctx.createLinearGradient(x0, y0, x, y);
            grad.addColorStop(0, colorEstrella(s.tinte, 0));
            grad.addColorStop(1, colorEstrella(s.tinte, alfa));
            ctx.save();
            ctx.strokeStyle = grad;
            ctx.lineWidth = s.grosor;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(x0, y0);
            ctx.lineTo(x, y);
            ctx.stroke();
            ctx.restore();
        });

        // Destello inicial: un resplandor cálido que se apaga rápido,
        // como si la luz de la puerta siguiera ahí un instante.
        var flash = Math.max(0, 1 - progreso / 0.35);
        if (flash > 0.01) {
            var halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(anchoCss, altoCss) * 0.6);
            halo.addColorStop(0, 'rgba(255,232,214,' + (0.55 * flash) + ')');
            halo.addColorStop(0.4, 'rgba(255,194,217,' + (0.22 * flash) + ')');
            halo.addColorStop(1, 'rgba(255,194,217,0)');
            ctx.save();
            ctx.fillStyle = halo;
            ctx.fillRect(0, 0, anchoCss, altoCss);
            ctx.restore();
        }
    }

    window.iniciarViajeEstrellas = function (alTerminar) {
        // Sin animaciones (prefers-reduced-motion): salteamos el salto y
        // vamos directo al cielo tranquilo — lo mismo que ya hace el
        // resto del sitio en esta situación.
        if (reducirMovimiento) {
            window.iniciarUniversoEstrellas();
            if (typeof alTerminar === 'function') alTerminar();
            return;
        }
        window.iniciarUniversoEstrellas();
        crearWarpStars();
        enViaje = true;
        viajeInicioT = performance.now();
        if (typeof alTerminar === 'function') {
            // Se llama un poco antes de que el viaje termine del todo,
            // así el corazón/título aparecen mientras las últimas rayas
            // todavía se apagan — no esperan a un corte seco.
            setTimeout(alTerminar, DURACION_VIAJE_MS * 0.72);
        }
    };

    // ---------------- Loop principal ----------------
    var parallaxX = 0, parallaxY = 0; // -1..1, viene del tilt del corazón
    var ultimoFrameT = 0;

    function dibujarFrame(t) {
        if (!animando) return;
        var dtSeg = ultimoFrameT ? Math.min((t - ultimoFrameT) / 1000, 0.1) : 0;
        ultimoFrameT = t;
        ctx.clearRect(0, 0, anchoCss, altoCss);

        var progresoViaje = 1;
        if (enViaje) {
            progresoViaje = Math.min((t - viajeInicioT) / DURACION_VIAJE_MS, 1);
            if (progresoViaje >= 1) enViaje = false;
        }
        // El cielo de siempre se desvanece adentro desde el principio del
        // viaje (no espera a que el salto termine), así la transición es
        // un cruce entre las dos animaciones y no una atrás de la otra.
        var alfaCieloNormal = enViaje ? Math.min(progresoViaje / 0.6, 1) : 1;

        ctx.save();
        ctx.globalAlpha = alfaCieloNormal;
        dibujarSol(t);
        dibujarPlanetas(t);

        capas.forEach(function (capa) {
            var cfg = capa.cfg;
            capa.estrellas.forEach(function (s) {
                // Quien pidió menos movimiento: cielo quieto, sin titilar,
                // sin derivar y sin fugaces (mismo criterio que ya usa el
                // resto del sitio con .estrella-fugaz / prefers-reduced-motion).
                var alfa = reducirMovimiento
                    ? cfg.brilloMax * 0.7
                    : (cfg.brilloMax * 0.35) + cfg.brilloMax * 0.65 * (0.5 + 0.5 * Math.sin(t / 1000 * s.freq + s.fase));
                var derivaY = reducirMovimiento ? 0 : (t / 1000 * cfg.velocidad) % (altoCss + 20);
                var px = s.x * anchoCss + parallaxX * cfg.parallax;
                var py = ((s.y * altoCss + derivaY) % (altoCss + 20)) - 10 + parallaxY * cfg.parallax;
                ctx.beginPath();
                ctx.fillStyle = colorEstrella(s.tinte, alfa);
                ctx.arc(px, py, s.r, 0, Math.PI * 2);
                ctx.fill();
            });
        });

        dibujarMeteoros(dtSeg);
        if (!reducirMovimiento) dibujarFugaces(t);
        ctx.restore();

        if (enViaje) dibujarWarpStars(t, progresoViaje);

        rafId = requestAnimationFrame(dibujarFrame);
    }

    // ---------------- Tamaño / resize ----------------
    function ajustarTamano() {
        if (!canvas) return;
        var cont = canvas.parentElement;
        if (!cont) return;
        anchoCss = cont.clientWidth;
        altoCss = cont.clientHeight;
        canvas.width = Math.max(1, anchoCss * dpr);
        canvas.height = Math.max(1, altoCss * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    // ---------------- Inclinación 3D del corazón (tacto/mouse + deriva sola) ----------------
    var lienzo = null;
    var tiltObjetivoX = 0, tiltObjetivoY = 0; // grados
    var tiltActualX = 0, tiltActualY = 0;
    var interactuando = false;
    var ultimaInteraccion = 0;

    function aplicarTiltInmediato() {
        if (!lienzo) return;
        // Suavizado simple (easing) para que el tilt no salte de golpe.
        tiltActualX += (tiltObjetivoX - tiltActualX) * 0.08;
        tiltActualY += (tiltObjetivoY - tiltActualY) * 0.08;
        lienzo.style.setProperty('--tilt-x', tiltActualX.toFixed(2) + 'deg');
        lienzo.style.setProperty('--tilt-y', tiltActualY.toFixed(2) + 'deg');
        parallaxX = tiltActualY / 14; // el corazón inclinado hacia la derecha = "cámara" mirando hacia allá
        parallaxY = -tiltActualX / 14;
    }

    function onPuntero(clientX, clientY) {
        if (!lienzo) return;
        var rect = lienzo.getBoundingClientRect();
        var relX = (clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
        var relY = (clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
        relX = Math.max(-1, Math.min(1, relX));
        relY = Math.max(-1, Math.min(1, relY));
        tiltObjetivoY = relX * 10;
        tiltObjetivoX = -relY * 10;
        interactuando = true;
        ultimaInteraccion = performance.now();
    }

    function onPunteroMueve(e) {
        var p = e.touches && e.touches[0] ? e.touches[0] : e;
        onPuntero(p.clientX, p.clientY);
    }
    function onPunteroSale() {
        interactuando = false;
    }

    function loopTilt(t) {
        if (!animando) return;
        if (reducirMovimiento) {
            // Nada de deriva automática ni parallax para quien pidió menos
            // movimiento — el corazón queda quieto, sólo reacciona si lo tocan.
        } else if (!interactuando && t - ultimaInteraccion > 1200) {
            // Nadie lo está tocando: deriva suave y continua, como flotando.
            tiltObjetivoY = Math.sin(t / 3200) * 6;
            tiltObjetivoX = Math.cos(t / 4100) * 4;
        }
        aplicarTiltInmediato();
        requestAnimationFrame(loopTilt);
    }

    // ---------------- API pública ----------------
    window.iniciarUniversoEstrellas = function () {
        var primeraVez = !canvas;
        if (primeraVez) {
            canvas = document.getElementById('universo-canvas-estrellas');
            lienzo = document.getElementById('lienzo-corazon-3d');
            if (!canvas) return;
            ctx = canvas.getContext('2d');
            crearCapas();
            crearMeteoros();
            window.addEventListener('resize', ajustarTamano);
            if (lienzo) {
                lienzo.addEventListener('pointermove', onPunteroMueve);
                lienzo.addEventListener('pointerleave', onPunteroSale);
                lienzo.addEventListener('touchmove', onPunteroMueve, { passive: true });
                lienzo.addEventListener('touchend', onPunteroSale);
            }
        }
        ajustarTamano();
        if (animando) return;
        animando = true;
        ultimoFrameT = 0;
        fugaces = [];
        programarProximaFugaz(performance.now());
        rafId = requestAnimationFrame(dibujarFrame);
        // El loop de inclinación se relanza cada vez que se muestra esta
        // pantalla (se corta solo en loopTilt cuando animando pasa a false),
        // así que no alcanza con arrancarlo una sola vez la primera vez.
        requestAnimationFrame(loopTilt);
    };

    window.detenerUniversoEstrellas = function () {
        animando = false;
        if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    };

    // ---------------- Pausa automática cuando un panel tapa el cielo ----------------
    // Antes esto sólo se apagaba al entrar a "El Libro" (entrarALaCarta).
    // Pero Gratitud, Deseos, Preguntas, Ticket, Sanación, Reloj y el Chat
    // se abren ENCIMA de la constelación-corazón sin que nadie llame a
    // detenerUniversoEstrellas() — el cielo (estrellas + planetas + sol +
    // meteoritos, cada uno recalculando sus degradés 60 veces por
    // segundo) seguía dibujándose de fondo, invisible, compitiendo por el
    // hilo principal con cosas como escribir en el Muro. Un
    // MutationObserver mirando estos contenedores puntuales evita tener
    // que tocar cada función abrir/cerrar de cada panel por separado (son
    // ocho, con convenciones de clase distintas entre sí).
    // "El Libro" (#contenedor) queda afuera de esta lista a propósito:
    // a diferencia de estos paneles, nunca usa display:none para
    // mostrarse/ocultarse (siempre ocupa toda la pantalla en el DOM, así
    // el universo lo tapa por encima con position:fixed), así que
    // offsetParent lo vería "visible" todo el tiempo y el universo nunca
    // volvería a arrancar. Esa transición ya la maneja directamente
    // entrarALaCarta()/volverAlUniverso() en index-refugio.js.
    var IDS_PANELES_SOBRE_UNIVERSO = [
        'chat-flotante', 'modal-muro', 'gratitud-flotante', 'deseos-flotante',
        'preguntas-flotante', 'modal-ticket', 'modal-sanacion', 'reloj-flotante'
    ];

    // Ojo con esto: los "*-flotante" (chat/gratitud/deseos/preguntas/
    // reloj) tienen DOS niveles — la burbuja circular queda con
    // style.display:flex para siempre apenas se abre la puerta (así se
    // ve el ícono todo el tiempo), y recién ".abierto" indica si el
    // PANEL de adentro está expandido. Si sólo mirara offsetParent, la
    // burbuja siempre visible haría que esto piense que el panel está
    // abierto para siempre después del primer toque. modal-muro/
    // modal-ticket/modal-sanacion en cambio son de un solo nivel:
    // aparecen y desaparecen enteros con la clase "oculto".
    function elementoConsideradoAbierto(id) {
        var el = document.getElementById(id);
        if (!el) return false;
        if (el.classList.contains('oculto')) return false;
        if (el.classList.contains('abierto')) return true;
        if (id.indexOf('-flotante') !== -1) return false; // burbuja visible, panel cerrado
        // offsetParent no sirve acá: por spec da null en TODO elemento
        // position:fixed (como estos modales) esté o no visible en
        // realidad, así que en vez de eso se mira el display calculado.
        return getComputedStyle(el).display !== 'none';
    }

    function algunPanelVisible() {
        return IDS_PANELES_SOBRE_UNIVERSO.some(elementoConsideradoAbierto);
    }

    function reevaluarPausaUniverso() {
        var universo = document.getElementById('universo-corazon');
        var universoActivo = universo && universo.classList.contains('activo');
        if (algunPanelVisible()) {
            window.detenerUniversoEstrellas();
        } else if (universoActivo) {
            // Sólo retoma si la constelación sigue siendo la pantalla de
            // fondo — si el panel que se cerró en realidad reveló "El
            // Libro" u otra pantalla, esa pantalla se encarga de arrancar
            // lo que le corresponda por su cuenta.
            window.iniciarUniversoEstrellas();
        }
    }

    var _observerPanelesArrancado = false;
    function iniciarObservadorPaneles() {
        if (_observerPanelesArrancado) return;
        _observerPanelesArrancado = true;
        var observer = new MutationObserver(reevaluarPausaUniverso);
        IDS_PANELES_SOBRE_UNIVERSO.forEach(function (id) {
            var el = document.getElementById(id);
            if (el) observer.observe(el, { attributes: true, attributeFilter: ['class', 'style'] });
        });
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', iniciarObservadorPaneles);
    } else {
        iniciarObservadorPaneles();
    }
})();
