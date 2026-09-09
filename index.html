<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="theme-color" content="#0b0a17">
    <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='.9em' font-size='90'%3E%E2%9D%A4%EF%B8%8F%3C/text%3E%3C/svg%3E">
    <title>Para Carito, el amor de mi vida</title>
    <meta name="description" content="Una cartita interactiva para Carito, el amor de mi vida.">
    <meta property="og:title" content="Para Carito, el amor de mi vida">
    <meta property="og:description" content="Tocá la puerta... 💕">
    <meta property="og:type" content="website">
    <meta http-equiv="Content-Security-Policy" content="
        default-src 'self' 'unsafe-inline' 'unsafe-eval' https:;
        script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.gstatic.com https://apis.google.com https://www.youtube.com https://s.ytimg.com;
        frame-src 'self' https://www.youtube.com;
        connect-src 'self' data: blob: https://*.firebaseio.com https://*.googleapis.com wss://*.firebaseio.com https://www.gstatic.com https://www.youtube.com;
        style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
        font-src 'self' https://fonts.gstatic.com;
        img-src 'self' data: https:;
    ">
    <link href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&family=Montserrat:ital,wght@0,300;0,500;1,400&display=swap" rel="stylesheet">
    <link rel="preconnect" href="https://www.youtube.com">
    <link rel="preconnect" href="https://s.ytimg.com">
    <link rel="preconnect" href="https://i.ytimg.com">
    <link rel="dns-prefetch" href="https://www.youtube.com">
    <style>
        :root {
            --color-bg-oscuro: #180f1e;
            --color-madera-base: #3a2313;
            --fuente-titulo: 'Dancing Script', cursive;
            --fuente-texto: 'Montserrat', sans-serif;
        }

        html, body {
            margin: 0; padding: 0; height: 100%;
            background-color: var(--color-bg-oscuro); 
            font-family: var(--fuente-texto);
            color: #333; 
            overflow: hidden;
            overscroll-behavior: none;
            -webkit-tap-highlight-color: transparent;
            -webkit-touch-callout: none;
            -webkit-text-size-adjust: 100%;
        }

        /* Compatibilidad móvil: nada de selección de texto accidental ni "flash" al tocar */
        * { -webkit-tap-highlight-color: transparent; }
        button, .btn, .puerta, .btn-azar, .burbuja-reproductor, .beso-boton, .controles-audio button, .barra-progreso-container, #barra-progreso, #volumen {
            -webkit-user-select: none; user-select: none;
        }

        .contenedor-scroll {
            height: 100vh;
            height: 100dvh;
            width: 100vw;
            overflow: hidden;
            overscroll-behavior: none;
            position: relative;
            z-index: 10;
            scrollbar-width: none;
            -ms-overflow-style: none;
        }
        .contenedor-scroll::-webkit-scrollbar { display: none; }

        /* Scrollbar fina y prolija para los paneles flotantes (chat, gratitud, deseos, etc.) */
        .mensajes-chat, .lista-gratitud, .lista-deseos, .cuerpo-preguntas, .muro-pantalla {
            scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.22) transparent;
        }
        .mensajes-chat::-webkit-scrollbar, .lista-gratitud::-webkit-scrollbar,
        .lista-deseos::-webkit-scrollbar, .cuerpo-preguntas::-webkit-scrollbar,
        .muro-pantalla::-webkit-scrollbar { width: 5px; }
        .mensajes-chat::-webkit-scrollbar-thumb, .lista-gratitud::-webkit-scrollbar-thumb,
        .lista-deseos::-webkit-scrollbar-thumb, .cuerpo-preguntas::-webkit-scrollbar-thumb,
        .muro-pantalla::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.22); border-radius: 10px; }
        .mensajes-chat, .lista-gratitud, .lista-deseos, .cuerpo-preguntas, .muro-pantalla { scroll-behavior: smooth; }

        /* Scroll horizontal 100% nativo (CSS Scroll Snap sobre el eje X).
           Antes esto se manejaba a mano con touchstart/touchend + transform,
           pero en Android real ese listener manual competía con el touch
           nativo del navegador y terminaba comiéndose los toques (funcionaba
           en mouse/modo escritorio porque ahí no hay touch de por medio).
           Dejando que el navegador maneje el gesto con su propio motor de
           scroll —el mismo que usa para cualquier scroll normal— se evita
           ese conflicto de raíz. Recién se activa con la clase .activo,
           para no romper la introducción con la puerta. */
        .contenedor-scroll.activo {
            overflow-x: scroll;
            overflow-y: hidden;
            scroll-snap-type: x mandatory;
            -webkit-overflow-scrolling: touch;
            touch-action: pan-x;
        }

        .pista-pantallas {
            height: 100%;
            display: flex;
            flex-direction: row;
            flex-wrap: nowrap;
            width: max-content;
        }

        .pantalla {
            height: 100vh;
            height: 100dvh;
            width: 100vw;
            flex: 0 0 100vw;
            display: flex; flex-direction: column;
            justify-content: center; align-items: center;
            position: relative;
            background: transparent;
            scroll-snap-align: start;
            scroll-snap-stop: normal;
            content-visibility: auto;
            contain-intrinsic-size: 100vw 100vh;
        }
        /* La pantalla visible nunca debe saltarse el render, aunque el navegador la considere "lejos" */
        .pantalla.visible { content-visibility: visible; }

        #canvas-particulas {
            position: fixed;
            top: 0; left: 0;
            width: 100vw; height: 100vh; height: 100dvh;
            pointer-events: none; 
            z-index: 5;
            opacity: 0;
            transition: opacity 2s ease;
        }
        #canvas-particulas.activo { opacity: 1; }

        /* Viñeta cálida y estática (sin animación): oscurece apenas los bordes y deja
           un resplandor tenue como de vela hacia el centro-abajo, para que todo se
           sienta más íntimo y la mirada vaya naturalmente al texto. No se mueve ni
           parpadea; es puramente atmosférica. */
        #vineta-calida {
            position: fixed; inset: 0; z-index: 3; pointer-events: none;
            background:
                radial-gradient(ellipse 120% 70% at 50% 115%, rgba(255,180,140,0.10), transparent 60%),
                radial-gradient(ellipse 140% 100% at 50% 50%, transparent 55%, rgba(0,0,0,0.35) 100%);
        }

        /* ============================================================
           ESTRELLAS FUGACES DE FONDO: cruzan la pantalla cada tanto,
           atraviesan toda la app (por detrás del contenido).
           ============================================================ */
        .capa-estrellas-fugaces {
            position: fixed; inset: 0; z-index: 4; pointer-events: none;
            overflow: hidden;
        }
        .estrella-fugaz {
            position: absolute; top: -10%; left: 0;
            width: 3px; height: 3px; border-radius: 50%;
            background: #fdf6f0;
            box-shadow: 0 0 6px 1px rgba(255,255,255,0.9);
            opacity: 0;
        }
        .estrella-fugaz::before {
            content: ''; position: absolute; top: 50%; right: 0;
            width: 90px; height: 1.5px; transform: translateY(-50%);
            background: linear-gradient(to left, rgba(255,255,255,0.85), transparent);
        }
        .ef-1 { left: 12%; top: -6%; animation: cruzarFugaz 8.5s ease-in linear infinite; animation-delay: 1.2s; }
        .ef-2 { left: 55%; top: -6%; animation: cruzarFugaz 9.5s ease-in linear infinite; animation-delay: 6.8s;
                background: #ffd8ea; box-shadow: 0 0 6px 1px rgba(255,208,226,0.9); }
        .ef-2::before { background: linear-gradient(to left, rgba(255,208,226,0.85), transparent); }
        .ef-3 { left: 78%; top: -6%; animation: cruzarFugaz 7.8s ease-in linear infinite; animation-delay: 13.4s; }
        .ef-4 { left: 32%; top: -6%; animation: cruzarFugaz 10.2s ease-in linear infinite; animation-delay: 19.6s;
                background: #cdbdfb; box-shadow: 0 0 6px 1px rgba(205,189,251,0.9); }
        .ef-4::before { background: linear-gradient(to left, rgba(205,189,251,0.85), transparent); }
        @keyframes cruzarFugaz {
            0% { opacity: 0; transform: translate(0, 0) rotate(215deg); }
            2% { opacity: 1; }
            16% { opacity: 1; transform: translate(-38vw, 42vh) rotate(215deg); }
            22% { opacity: 0; transform: translate(-46vw, 50vh) rotate(215deg); }
            100% { opacity: 0; transform: translate(-46vw, 50vh) rotate(215deg); }
        }

        /* ============================================================
           CORAZONES AMBIENTE: suben despacio de fondo, en toda la app.
           ============================================================ */
        .capa-corazones-ambiente {
            position: fixed; inset: 0; z-index: 4; pointer-events: none; overflow: hidden;
        }
        .corazon-ambiente {
            position: absolute; bottom: -8%;
            font-size: clamp(0.9rem, 3vw, 1.3rem);
            opacity: 0; filter: drop-shadow(0 0 6px rgba(255,194,217,0.6));
            animation: ascenderCorazon linear infinite;
        }
        .ca-1 { left: 8%;  animation-duration: 17s; animation-delay: 0s; }
        .ca-2 { left: 88%; animation-duration: 21s; animation-delay: 4s; }
        .ca-3 { left: 22%; animation-duration: 19s; animation-delay: 9s; }
        .ca-4 { left: 68%; animation-duration: 16s; animation-delay: 13s; }
        .ca-5 { left: 45%; animation-duration: 23s; animation-delay: 18s; }
        @keyframes ascenderCorazon {
            0% { opacity: 0; transform: translate(0, 0) rotate(-6deg) scale(0.85); }
            10% { opacity: 0.75; }
            50% { transform: translate(14px, -50vh) rotate(6deg) scale(1); }
            88% { opacity: 0.6; }
            100% { opacity: 0; transform: translate(-10px, -102vh) rotate(-4deg) scale(0.9); }
        }
        @media (prefers-reduced-motion: reduce) { .capa-corazones-ambiente { display: none; } }
        .frase-flotante-amor {
            position: fixed; left: 50%; z-index: 6;
            top: calc(16px + env(safe-area-inset-top, 0px));
            transform: translate(-50%, -8px);
            max-width: min(86vw, 340px);
            text-align: center; pointer-events: none;
            font-family: var(--fuente-titulo); font-size: clamp(1.05rem, 4.6vw, 1.35rem);
            color: #ffe6ef; text-shadow: 0 0 12px rgba(255,194,217,0.65), 0 0 24px rgba(199,179,250,0.4);
            opacity: 0; transition: opacity 1.4s ease, transform 1.4s ease;
        }
        .frase-flotante-amor.mostrar { opacity: 1; transform: translate(-50%, 0); }

        .pantalla-puerta {
            background: radial-gradient(circle at center, #1a2530, #020304);
            perspective: 1500px; 
            color: white;
            z-index: 20;
        }

        .pantalla { background-size: 300% 300%; }
        .fondo-animado { animation: flotarGradiente 16s ease-in-out infinite; overflow: hidden; }
        @keyframes flotarGradiente {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }

        .circulo-flotante {
            position: absolute;
            border-radius: 50%;
            filter: blur(35px);
            pointer-events: none;
            z-index: 0;
            animation: flotarCirculo ease-in-out infinite alternate;
            will-change: transform;
        }
        /* En celulares el blur grande es carísimo para la GPU: se reduce el radio */
        @media (max-width: 640px) {
            .circulo-flotante { filter: blur(18px); }
        }
        /* Teléfonos angostos: con 9 íconos alrededor del corazón, sin este
           ajuste se pueden llegar a superponer un poco entre sí. */
        @media (max-width: 380px) {
            .lienzo-corazon { width: 88vw; }
            .punto-corazon { width: clamp(38px, 13vw, 44px); height: clamp(38px, 13vw, 44px); }
            .punto-corazon .planeta-icono { font-size: clamp(0.8rem, 3.4vw, 0.95rem); }
            .punto-corazon .planeta-nombre { display: none; } /* el ícono solo alcanza para identificarlo */
            .planeta-carta { width: clamp(48px, 16.5vw, 54px); height: clamp(48px, 16.5vw, 54px); }
            .planeta-carta .planeta-icono { font-size: clamp(1.05rem, 4.2vw, 1.25rem); }
        }
        /* Gente sensible al movimiento: se apagan las animaciones decorativas no esenciales */
        @media (prefers-reduced-motion: reduce) {
            .circulo-flotante, .brillo-flotante, .fondo-animado, .portada-capitulo::before,
            .pantalla-cuenta-regresiva::before, .final-brillo, .burbuja-menu, .burbuja-chat,
            .burbuja-reloj, .btn-azar, .estrella-fugaz { animation: none !important; }
            .capa-estrellas-fugaces, .frase-flotante-amor { display: none !important; }
            .puerta { transition-duration: 0.4s !important; }
        }
        @keyframes flotarCirculo {
            0% { transform: translate(0, 0) scale(1); }
            100% { transform: translate(var(--flotar-x, 20px), var(--flotar-y, -25px)) scale(1.1); }
        }

        .brillo-flotante {
            position: absolute;
            font-size: clamp(1rem, 3vw, 1.6rem);
            opacity: 0.5;
            pointer-events: none;
            z-index: 0;
            animation: derivarBrillo ease-in-out infinite;
        }
        @keyframes derivarBrillo {
            0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.35; }
            50% { transform: translateY(-18px) rotate(15deg); opacity: 0.65; }
        }

        .marco-exterior {
            padding: clamp(10px, 3vw, 25px); 
            background: #111;
            border-radius: 12px 12px 0 0;
            box-shadow: 0 40px 80px rgba(0,0,0,0.9), inset 0 0 20px rgba(0,0,0,0.9);
            position: relative; 
            width: clamp(220px, 70vw, 320px); 
            height: clamp(380px, 65vh, 500px);
            border-left: clamp(8px, 2vw, 15px) solid #0a0a0a; 
            border-right: clamp(8px, 2vw, 15px) solid #151515; 
            border-top: clamp(8px, 2vw, 15px) solid #0d0d0d;
        }

        .interior-casa {
            position: absolute; top: 0; left: 0; right: 0; bottom: 0;
            background: radial-gradient(circle, #fdf6f0, #ffb8cf, #ffd8ea);
            box-shadow: inset 0 0 80px rgba(255, 184, 207, 1);
            z-index: 1; display: flex; justify-content: center; align-items: center;
            overflow: hidden; opacity: 0; transition: opacity 1.5s ease;
        }
        .interior-casa.iluminar { opacity: 1; cursor: pointer; touch-action: manipulation; }
        .interior-casa .foto-puerta {
            width: clamp(90px, 32vw, 150px); height: clamp(90px, 32vw, 150px);
            border-radius: 50%; object-fit: cover;
            border: 3px solid rgba(255,255,255,0.9);
            animation: latido 1.6s infinite;
            position: relative; z-index: 1;
        }

        .secreto-puerta {
            position: fixed; top: 10%; left: 50%; transform: translate(-50%, -12px);
            background: rgba(0,0,0,0.6); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
            color: #ffe6ef; font-family: var(--fuente-titulo); font-size: clamp(1.15rem, 4.5vw, 1.7rem);
            padding: 12px 26px; border-radius: 30px; border: 1px solid rgba(255,255,255,0.25);
            box-shadow: 0 10px 25px rgba(0,0,0,0.5);
            opacity: 0; pointer-events: none; transition: opacity 0.6s ease, transform 0.6s ease;
            z-index: 30; text-align: center; max-width: 82vw;
        }
        .secreto-puerta.mostrar { opacity: 1; transform: translate(-50%, 0); }

        .puerta {
            width: 100%; height: 100%;
            background: var(--color-madera-base); 
            background-image: linear-gradient(90deg, rgba(0,0,0,0.6) 0%, transparent 15%, transparent 85%, rgba(0,0,0,0.6) 100%), 
                              linear-gradient(rgba(255,255,255,0.05) 0%, rgba(0,0,0,0.7) 100%);
            border: 2px solid #140b06; position: absolute; top: 0; left: 0;
            cursor: pointer;
            box-shadow: inset 0 0 50px rgba(0,0,0,0.95), 10px 0 20px rgba(0,0,0,0.7);
            transform-origin: left center;
            transition: transform 2.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 2.2s ease, filter 2.2s ease;
            display: flex; flex-direction: column; justify-content: space-around; align-items: center;
            padding: 5% 0; box-sizing: border-box; z-index: 2; transform-style: preserve-3d;
            touch-action: manipulation;
        }

        .puerta.abierta {
            transform: rotateY(-105deg) skewY(-2deg);
            box-shadow: inset 0 0 20px rgba(0,0,0,0.9), 30px 15px 50px rgba(0,0,0,0.8);
            filter: brightness(0.3);
        }

        .panel {
            width: 76%; height: 22%; background: #2b1a0e;
            border: 3px solid #140b06; border-bottom-color: #4a2e1a; border-right-color: #4a2e1a;
            box-shadow: inset 8px 8px 20px rgba(0,0,0,0.95); border-radius: 4px;
        }
        .panel-largo { height: 40%; }
        
        .pomo {
            width: clamp(20px, 6vw, 30px); height: clamp(20px, 6vw, 30px);
            background: radial-gradient(circle at 30% 30%, #fbdcb5, #d35400, #5e2c00);
            border-radius: 50%; position: absolute; right: 8%; top: 52%;
            box-shadow: -4px 6px 10px rgba(0,0,0,0.9), inset -2px -2px 5px rgba(0,0,0,0.7);
        }

        .pista-tocar {
            position: absolute; bottom: -14%; left: 50%; transform: translateX(-50%);
            color: rgba(255,255,255,0.75); font-size: clamp(0.8rem, 2.8vw, 1rem);
            font-family: var(--fuente-texto); white-space: nowrap;
            opacity: 0; pointer-events: none; z-index: 3;
            animation: aparecerPista 1s ease forwards 3.5s, rebote 1.8s infinite 3.5s;
            text-shadow: 0 0 10px rgba(0,0,0,0.9);
        }
        .marco-exterior.oculto-pista .pista-tocar { display: none; }
        @keyframes aparecerPista { to { opacity: 1; } }

        .texto-toc {
            position: absolute; font-size: clamp(2.5rem, 8vw, 4rem); font-weight: bold; color: #ff9d85;
            text-shadow: 0 0 20px rgba(255, 157, 133, 0.9), 3px 3px 6px #000;
            pointer-events: none; opacity: 0; transform: scale(0.5);
            transition: opacity 0.3s ease, transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); 
            z-index: 10;
        }
        .texto-toc.mostrar { opacity: 1; transform: scale(1.1); }

        .interfaz { margin-top: clamp(20px, 5vh, 40px); height: 100px; display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 5; }
        
        .texto-dinamico {
            font-size: clamp(1.2rem, 4vw, 1.8rem); margin-bottom: 15px; opacity: 0; transform: translateY(-10px);
            transition: all 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            font-style: italic; text-align: center; display: none; text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
        }
        .texto-dinamico.mostrar { opacity: 1; transform: translateY(0); display: block; }

        .contenedor-botones { display: none; gap: clamp(15px, 4vw, 30px); }
        .contenedor-botones.mostrar { display: flex; }
        
        .btn {
            background: rgba(255, 255, 255, 0.05); color: white; border: 1px solid rgba(255,255,255,0.2);
            backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
            padding: clamp(8px, 2vw, 12px) clamp(20px, 5vw, 40px); 
            font-size: clamp(1rem, 3vw, 1.2rem); border-radius: 30px;
            cursor: pointer; transition: transform 0.3s ease, box-shadow 0.3s ease, background 0.3s ease; 
            font-family: var(--fuente-texto); text-transform: uppercase; letter-spacing: 1px;
            touch-action: manipulation;
        }
        .btn:hover { transform: translateY(-3px); box-shadow: 0 8px 25px rgba(0,0,0,0.6); background: rgba(255,255,255,0.15); }
        .btn-si { background: rgba(231, 76, 60, 0.7); border-color: #ff7979; }
        .btn-si:hover { background: rgba(255, 157, 133, 0.9); box-shadow: 0 0 25px rgba(255, 157, 133, 0.8); }

        .mensaje-final { font-size: clamp(1.1rem, 3.5vw, 1.4rem); color: #f1c40f; font-style: italic; display: none; }
        .indicador-scroll { color: #fdf6f0; font-size: clamp(1rem, 3vw, 1.3rem); animation: rebote 1.5s infinite; margin-top: 15px; display: none; text-align: center; background: rgba(0,0,0,0.5); padding: 10px 25px; border-radius: 25px; backdrop-filter: blur(5px); }

        .tarjeta-cristal {
            background: rgba(255, 255, 255, 0.12);
            backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
            border: 1px solid rgba(255, 255, 255, 0.4);
            border-radius: 24px;
            padding: clamp(25px, 6vw, 50px) clamp(20px, 5vw, 40px);
            width: clamp(260px, 85vw, 800px);
            text-align: center;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15), inset 0 0 0 1px rgba(255,255,255,0.2);
            opacity: 0; transform: translateY(40px) scale(0.95);
            transition: all 1s cubic-bezier(0.25, 1, 0.5, 1);
            z-index: 10;
        }
        
        .pantalla.visible .tarjeta-cristal {
            opacity: 1; transform: translateY(0) scale(1);
        }

        .texto-romantico {
            font-size: clamp(2.5rem, 8vw, 5.5rem); 
            color: #d1657e;
            text-shadow: 2px 2px 6px rgba(255, 255, 255, 0.8);
            font-family: var(--fuente-titulo);
            line-height: 1.2; margin: 0;
        }

        .cursor-escritura {
            display: inline-block;
            width: 0.06em;
            height: 0.9em;
            background: #d1657e;
            margin-left: 3px;
            vertical-align: middle;
            animation: parpadearCursor 0.8s step-end infinite;
        }
        @keyframes parpadearCursor { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }

        .deco-amo-carito {
            position: absolute; font-family: var(--fuente-titulo);
            color: rgba(209, 101, 126, 0.08); pointer-events: none; z-index: 0;
            white-space: nowrap; user-select: none;
        }

        .btn-azar {
            position: fixed;
            bottom: calc(clamp(20px, 5vh, 40px) + env(safe-area-inset-bottom, 0px));
            right: calc(clamp(15px, 5vw, 40px) + env(safe-area-inset-right, 0px));
            background: linear-gradient(135deg, #ffb8cf, #ffd8ea);
            color: #d1657e; font-weight: bold; font-size: clamp(0.8rem, 2.5vw, 1.2rem);
            border: none; border-radius: 50px; padding: clamp(10px, 3vw, 18px) clamp(16px, 5vw, 30px);
            box-shadow: 0 10px 25px rgba(255, 184, 207, 0.5);
            cursor: pointer; z-index: 9995; pointer-events: auto;
            display: none; transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            font-family: var(--fuente-texto);
            align-items: center; gap: 8px;
            animation: resplandorBoton 2s infinite alternate;
            touch-action: manipulation;
            max-width: calc(100vw - 30px);
        }
        .btn-azar.mostrar { display: flex; animation: aparecerSuave 1s forwards, resplandorBoton 2s infinite alternate; }
        .btn-azar:hover { transform: scale(1.08) translateY(-5px); }

        /* Navegación garantizada entre pantallas (a los costados, estilo "pasar página") */
        .nav-pantallas {
            position: fixed; inset: 0;
            z-index: 9990; pointer-events: none;
            display: none;
        }
        .nav-pantallas.mostrar { display: block; }
        .nav-flecha {
            position: absolute; top: 50%; transform: translateY(-50%);
            width: 50px; height: 50px; border-radius: 50%;
            background: rgba(0,0,0,0.45);
            backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.22);
            color: rgba(255,255,255,0.9); font-size: 1.7rem; line-height: 1;
            display: flex; align-items: center; justify-content: center;
            cursor: pointer; touch-action: manipulation; pointer-events: auto;
            opacity: 0.65;
            transition: transform 0.2s ease, opacity 0.2s ease, background 0.2s ease;
        }
        .nav-flecha:active { transform: translateY(-50%) scale(0.85); opacity: 0.95; background: rgba(0,0,0,0.6); }
        /* Separadas del borde extremo: muy pegado al canto, Android suele robarse el toque
           para su gesto de "volver atrás", así que las alejamos un poco más adentro. */
        .nav-anterior { left: calc(14px + env(safe-area-inset-left, 0px)); }
        .nav-siguiente { right: calc(14px + env(safe-area-inset-right, 0px)); }


        /* Reproductor de Sonidos Flotante: burbuja colapsable + panel */
        .reproductor-flotante {
            position: fixed;
            bottom: calc(clamp(16px, 4.5vh, 36px) + env(safe-area-inset-bottom, 0px));
            left: calc(clamp(12px, 5vw, 40px) + env(safe-area-inset-left, 0px));
            z-index: 900;
            display: none;
            flex-direction: column-reverse;
            align-items: flex-start;
            gap: 12px;
        }
        .reproductor-flotante.mostrar { display: flex; }

        /* La burbuja: siempre chica, siempre en su rincón, nunca invade el resto de la pantalla */
        .burbuja-reproductor {
            width: 52px; height: 52px; border-radius: 50%;
            background: rgba(0, 0, 0, 0.55);
            backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
            border: 1px solid rgba(255, 255, 255, 0.25);
            box-shadow: 0 8px 20px rgba(0,0,0,0.5);
            display: flex; align-items: center; justify-content: center;
            font-size: 1.4rem; cursor: pointer; touch-action: manipulation;
            flex-shrink: 0;
            transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease;
            animation: aparecerSuave 0.8s forwards;
        }
        .burbuja-reproductor:active { transform: scale(0.9); }
        .burbuja-reproductor.sonando {
            animation: latidoBurbuja 1.4s ease-in-out infinite;
            box-shadow: 0 8px 20px rgba(255, 184, 207, 0.55);
            border-color: rgba(255, 184, 207, 0.6);
        }
        @keyframes latidoBurbuja {
            0%, 100% { transform: scale(1); }
            14% { transform: scale(1.09); }
            28% { transform: scale(1); }
            42% { transform: scale(1.05); }
            70% { transform: scale(1); }
        }

        .panel-reproductor {
            background: rgba(0, 0, 0, 0.6);
            backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 20px; padding: clamp(10px, 3vw, 15px) clamp(14px, 4vw, 25px);
            display: flex; flex-direction: column; align-items: center; gap: 10px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.5);
            color: white; font-family: var(--fuente-texto);
            width: clamp(160px, 55vw, 230px);
            box-sizing: border-box;
            transform-origin: bottom left;
            opacity: 0; transform: scale(0.85) translateY(10px);
            max-height: 0; overflow: hidden; padding-top: 0; padding-bottom: 0; margin: 0; border-width: 0;
            pointer-events: none;
            transition: opacity 0.3s ease, transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), max-height 0.35s ease, padding 0.35s ease, border-width 0.35s ease;
        }
        .reproductor-flotante.abierto .panel-reproductor {
            opacity: 1; transform: scale(1) translateY(0);
            max-height: 260px; padding-top: clamp(10px, 3vw, 15px); padding-bottom: clamp(10px, 3vw, 15px);
            border-width: 1px;
            pointer-events: auto;
        }
        
        .info-cancion { font-size: clamp(0.8rem, 3vw, 0.95rem); font-weight: bold; text-shadow: 1px 1px 3px rgba(0,0,0,0.8); text-align: center; max-width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #ffb8cf; }

        .barra-progreso-container { display: flex; align-items: center; gap: 8px; width: 100%; }
        .barra-progreso-container .tiempo { font-size: 0.65rem; color: rgba(255,255,255,0.75); min-width: 28px; text-align: center; }
        #barra-progreso { -webkit-appearance: none; appearance: none; flex: 1; height: 4px; border-radius: 2px; background: rgba(255,255,255,0.25); accent-color: #ffb8cf; cursor: pointer; touch-action: none; }
        #barra-progreso::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 16px; height: 16px; border-radius: 50%; background: #ffb8cf; box-shadow: 0 0 6px rgba(255,184,207,0.9); cursor: pointer; }
        #barra-progreso::-moz-range-thumb { width: 16px; height: 16px; border-radius: 50%; background: #ffb8cf; border: none; box-shadow: 0 0 6px rgba(255,184,207,0.9); cursor: pointer; }

        .controles-audio { display: flex; gap: clamp(6px, 3vw, 15px); align-items: center; justify-content: center; width: 100%; }
        .controles-audio button { background: none; border: none; color: white; font-size: clamp(1.1rem, 4vw, 1.3rem); cursor: pointer; transition: transform 0.2s, color 0.2s; padding: 8px; min-width: 32px; min-height: 32px; touch-action: manipulation; }
        .controles-audio button:hover, .controles-audio button:active { transform: scale(1.2); color: #ffb8cf; }
        .controles-audio .btn-toggle.activo { color: #ffb8cf; text-shadow: 0 0 8px rgba(255, 184, 207, 0.8); }
        
        .control-volumen { display: flex; align-items: center; gap: 8px; width: 100%; }
        .control-volumen span { font-size: 1rem; }
        #volumen { width: 100%; accent-color: #ffb8cf; cursor: pointer; }

        @keyframes latido { 0%, 100% { transform: scale(1); filter: drop-shadow(0 0 15px #ff6b81); } 50% { transform: scale(1.15); filter: drop-shadow(0 0 40px #ff4757); } }

        /* ============ NUESTRO REFUGIO: acceso, chat y muro en el tiempo ============ */

        /* --- Componentes compartidos (cristal) --- */
        .modal-cristal, .muro-pantalla {
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; height: 100dvh;
            background: rgba(5, 8, 10, 0.85);
            backdrop-filter: blur(15px); -webkit-backdrop-filter: blur(15px);
            z-index: 10000; display: flex; flex-direction: column;
            opacity: 1; transition: opacity 0.5s ease;
        }
        /* visibility (no display:none) para que la transición de opacidad se
           vea completa al cerrar cualquier modal, en vez de cortarse de golpe */
        .oculto { opacity: 0; visibility: hidden; pointer-events: none; transition: opacity 0.4s ease, visibility 0s 0.4s; }

        /* --- Acceso secreto --- */
        .modal-cristal { justify-content: center; align-items: center; display: flex; padding: 20px; box-sizing: border-box; }
        .tarjeta-acceso {
            background: rgba(255,255,255,0.05); border: 1px solid rgba(255,194,217,0.3);
            padding: clamp(22px, 6vw, 32px); border-radius: 20px; text-align: center; color: white;
            box-shadow: 0 15px 40px rgba(0,0,0,0.5); font-family: var(--fuente-texto);
            animation: aparecerSuave 0.5s forwards;
            width: min(90vw, 340px); box-sizing: border-box;
        }
        .tarjeta-acceso h3 { font-family: var(--fuente-titulo); font-size: clamp(1.6rem, 6vw, 2rem); color: #ffc2d9; margin: 0 0 10px; }
        .tarjeta-acceso p { font-size: 0.9rem; color: rgba(255,255,255,0.75); margin: 0; }
        .tarjeta-acceso input {
            width: 100%; box-sizing: border-box; padding: 12px; margin: 15px 0 0; border-radius: 10px;
            border: 1px solid rgba(255,255,255,0.2); background: rgba(0,0,0,0.3); color: white;
            text-align: center; font-size: 1.05rem; font-family: var(--fuente-texto);
        }
        .tarjeta-acceso button {
            background: #ffc2d9; color: #1a1015; padding: 10px 25px; border-radius: 20px; border: none;
            font-weight: bold; cursor: pointer; margin-top: 14px; font-family: var(--fuente-texto);
            touch-action: manipulation; width: 100%;
        }
        .error-texto { color: #ff9d85; font-size: 0.82rem; margin-top: 10px; min-height: 1.2em; }

        /* --- Burbuja + panel de chat: widget fijo abajo a la derecha,
               como el clásico botón de WhatsApp de una empresa, pero
               es nuestro chat interno --- */
        .chat-flotante {
            position: fixed;
            bottom: calc(clamp(16px, 4.5vh, 24px) + env(safe-area-inset-bottom, 0px));
            right: calc(clamp(12px, 5vw, 24px) + env(safe-area-inset-right, 0px));
            z-index: 9997;
            display: none; flex-direction: column; align-items: flex-end; gap: 15px;
        }
        .chat-flotante.mostrar { display: flex; }
        .chat-flotante.abierto { z-index: 10050; }
        .burbuja-chat {
            position: relative;
            width: 58px; height: 58px; border-radius: 50%;
            background: radial-gradient(circle at 32% 28%, rgba(184,232,201,0.5), rgba(178,212,255,0.32) 70%);
            border: 1px solid rgba(184,232,201,0.5); box-shadow: 0 6px 24px rgba(178,212,255,0.4);
            display: flex; align-items: center; justify-content: center; font-size: 1.55rem; cursor: pointer;
            animation: aparecerSuave 0.8s forwards, latidoBurbuja 3s infinite;
            backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); touch-action: manipulation;
            transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.3s, border-color 0.3s, box-shadow 0.3s;
        }
        .burbuja-chat:active { transform: scale(0.9); }
        /* Mensaje nuevo sin leer: la burbuja cambia de color y late más
           rápido, más un punto rojo arriba a la derecha, hasta que se abre el chat. */
        .burbuja-chat.no-leido {
            background: radial-gradient(circle at 32% 28%, rgba(255,138,164,0.65), rgba(255,90,130,0.45) 70%);
            border-color: rgba(255,138,164,0.75); box-shadow: 0 6px 26px rgba(255,90,130,0.55);
            animation: aparecerSuave 0.8s forwards, latidoBurbuja 1.1s infinite;
        }
        .burbuja-chat.no-leido::after {
            content: ''; position: absolute; top: 1px; right: 1px; width: 15px; height: 15px;
            border-radius: 50%; background: #ff4d6d; border: 2px solid rgba(15,10,20,0.9);
            animation: aparecerSuave 0.3s forwards;
        }
        .panel-chat {
            position: absolute; bottom: calc(100% + 15px); right: 0;
            background: rgba(15, 10, 20, 0.9); border: 1px solid rgba(255,194,217,0.2);
            border-radius: 24px; width: min(88vw, 330px); height: min(65vh, 460px);
            display: flex; flex-direction: column; box-shadow: 0 20px 50px rgba(0,0,0,0.8);
            transform-origin: bottom right; opacity: 0; transform: scale(0.9) translateY(10px);
            pointer-events: none; transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .chat-flotante.abierto .panel-chat { opacity: 1; transform: scale(1) translateY(0); pointer-events: auto; }
        .header-chat {
            padding: 14px 18px; border-bottom: 1px solid rgba(255,255,255,0.08);
            display: flex; justify-content: space-between; align-items: center; color: #ffc2d9; font-family: var(--fuente-texto);
        }
        .titulo-chat { font-size: 0.95rem; font-weight: bold; }
        .btn-cerrar-chat { background: none; border: none; color: white; font-size: 1.1rem; cursor: pointer; touch-action: manipulation; }
        .mensajes-chat { flex: 1; padding: 14px; overflow-y: auto; -webkit-overflow-scrolling: touch; touch-action: pan-y; overscroll-behavior: contain; display: flex; flex-direction: column; gap: 10px; }
        .mensajes-chat .sin-mensajes { font-size: 0.82rem; color: rgba(255,255,255,0.55); font-style: italic; text-align: center; margin: auto; }
        .burbuja-msg {
            max-width: 82%; padding: 9px 14px; border-radius: 18px; font-family: var(--fuente-texto);
            font-size: 0.88rem; line-height: 1.4; animation: aparecerSuave 0.3s forwards; color: white; word-wrap: break-word;
        }
        .msg-carito { background: rgba(255, 184, 207, 0.18); }
        .msg-nico { background: rgba(178, 212, 255, 0.18); }
        .msg-propio { border-bottom-right-radius: 4px; align-self: flex-end; }
        .msg-otro { border-bottom-left-radius: 4px; align-self: flex-start; }
        .separador-fecha-chat {
            align-self: center; font-size: 0.68rem; letter-spacing: 0.02em; color: rgba(255,255,255,0.6);
            background: rgba(255,255,255,0.08); padding: 4px 13px; border-radius: 12px;
            font-family: var(--fuente-texto); margin: 4px 0 2px; animation: aparecerSuave 0.3s forwards;
            text-transform: capitalize;
        }
        .input-chat-area { padding: 10px 14px calc(10px + env(safe-area-inset-bottom, 0px)); display: flex; gap: 8px; border-top: 1px solid rgba(255,255,255,0.08); }
        #input-chat {
            flex: 1; min-width: 0; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12);
            border-radius: 20px; padding: 11px 14px; color: white; font-family: var(--fuente-texto); outline: none; font-size: 0.9rem;
        }
        .btn-enviar-chat {
            background: linear-gradient(135deg, #ffb8cf, #ffd8ea); border: none; border-radius: 50%;
            width: 40px; height: 40px; flex-shrink: 0; display: flex; align-items: center; justify-content: center;
            cursor: pointer; touch-action: manipulation; font-size: 0.95rem;
        }

        /* --- Burbuja flotante del Muro --- */
        .muro-flotante {
            position: fixed;
            top: calc(clamp(16px, 4.5vh, 24px) + env(safe-area-inset-top, 0px));
            left: calc(clamp(28px, 9vw, 40px) + env(safe-area-inset-left, 0px));
            z-index: 9999;
            display: none;
        }
        .muro-flotante.mostrar { display: flex; }
        .burbuja-muro {
            width: 52px; height: 52px; border-radius: 50%; background: rgba(0,0,0,0.7);
            border: 1px solid rgba(178,212,255,0.5); box-shadow: 0 5px 20px rgba(178,212,255,0.25);
            display: flex; align-items: center; justify-content: center; font-size: 1.4rem; cursor: pointer;
            animation: aparecerSuave 0.8s forwards; backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
            touch-action: manipulation; transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .burbuja-muro:active { transform: scale(0.9); }

        /* --- Burbuja flotante: Rincón de la Gratitud (columna, debajo del chat) --- */
        .gratitud-flotante {
            position: fixed;
            top: calc(clamp(16px, 4.5vh, 24px) + env(safe-area-inset-top, 0px) + 76px);
            right: calc(clamp(12px, 5vw, 24px) + env(safe-area-inset-right, 0px));
            z-index: 9998;
            display: none; flex-direction: column; align-items: flex-end; gap: 15px;
        }
        .gratitud-flotante.mostrar { display: flex; }
        .gratitud-flotante.abierto { z-index: 10050; }
        .burbuja-gratitud {
            width: 52px; height: 52px; border-radius: 50%; background: rgba(0,0,0,0.7);
            border: 1px solid rgba(245,217,168,0.5); box-shadow: 0 5px 20px rgba(245,217,168,0.25);
            display: flex; align-items: center; justify-content: center; font-size: 1.4rem; cursor: pointer;
            animation: aparecerSuave 0.8s forwards; backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
            touch-action: manipulation; transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .burbuja-gratitud:active { transform: scale(0.9); }
        .panel-gratitud {
            position: absolute; top: calc(100% + 15px); right: 0;
            background: rgba(15, 10, 20, 0.9); border: 1px solid rgba(245,217,168,0.25);
            border-radius: 24px; width: min(88vw, 330px); height: min(65vh, 460px);
            display: flex; flex-direction: column; box-shadow: 0 20px 50px rgba(0,0,0,0.8);
            transform-origin: top right; opacity: 0; transform: scale(0.9) translateY(-10px);
            pointer-events: none; transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .gratitud-flotante.abierto .panel-gratitud { opacity: 1; transform: scale(1) translateY(0); pointer-events: auto; }
        .header-gratitud {
            padding: 14px 18px; border-bottom: 1px solid rgba(255,255,255,0.08);
            display: flex; justify-content: space-between; align-items: center; color: #f5d9a0; font-family: var(--fuente-texto);
        }
        .titulo-gratitud { font-size: 0.95rem; font-weight: bold; }
        .btn-cerrar-gratitud { background: none; border: none; color: white; font-size: 1.1rem; cursor: pointer; touch-action: manipulation; }
        .lista-gratitud { flex: 1; padding: 14px; overflow-y: auto; -webkit-overflow-scrolling: touch; touch-action: pan-y; overscroll-behavior: contain; display: flex; flex-direction: column; gap: 10px; }
        .lista-gratitud .sin-mensajes { font-size: 0.82rem; color: rgba(255,255,255,0.55); font-style: italic; text-align: center; margin: auto; }
        .tarjeta-gratitud { padding: 10px 14px; border-radius: 14px; background: rgba(245,217,168,0.1); font-family: var(--fuente-texto); }
        .tarjeta-gratitud .gr-autor { font-size: 0.75rem; color: #f5d9a0; font-weight: bold; margin-bottom: 3px; }
        .tarjeta-gratitud .gr-texto { font-size: 0.9rem; color: white; line-height: 1.4; }
        .tarjeta-gratitud .gr-fecha { font-size: 0.68rem; color: rgba(255,255,255,0.4); margin-top: 4px; }
        .fila-acciones-item { display: flex; justify-content: flex-end; gap: 6px; margin-top: 6px; }
        .btn-accion-item {
            background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.18);
            color: rgba(255,255,255,0.85); font-size: 0.72rem; padding: 5px 10px; border-radius: 12px;
            cursor: pointer; touch-action: manipulation; font-family: var(--fuente-texto);
        }
        .btn-accion-item:active { transform: scale(0.94); }
        .btn-accion-item.borrar { color: #ffb8cf; border-color: rgba(255,184,207,0.4); }
        .textarea-edicion-item {
            width: 100%; box-sizing: border-box; background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.2);
            border-radius: 10px; padding: 8px 10px; color: white; font-family: var(--fuente-texto); font-size: 0.9rem;
            resize: vertical; outline: none; line-height: 1.4;
        }
        .input-gratitud-area { padding: 10px 14px calc(10px + env(safe-area-inset-bottom, 0px)); display: flex; gap: 8px; border-top: 1px solid rgba(255,255,255,0.08); }
        #input-gratitud {
            flex: 1; min-width: 0; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12);
            border-radius: 20px; padding: 11px 14px; color: white; font-family: var(--fuente-texto); outline: none; font-size: 0.9rem;
        }
        .btn-enviar-gratitud {
            background: linear-gradient(135deg, #ffe29f, #ffa99f); border: none; border-radius: 50%;
            width: 40px; height: 40px; flex-shrink: 0; display: flex; align-items: center; justify-content: center;
            cursor: pointer; touch-action: manipulation; font-size: 0.95rem;
        }

        /* --- Burbuja flotante: Lista de Deseos / Bucket List (columna, debajo del muro) --- */
        .deseos-flotante {
            position: fixed;
            top: calc(clamp(16px, 4.5vh, 24px) + env(safe-area-inset-top, 0px) + 76px);
            left: calc(clamp(28px, 9vw, 40px) + env(safe-area-inset-left, 0px));
            z-index: 9998;
            display: none; flex-direction: column; align-items: flex-start; gap: 15px;
        }
        .deseos-flotante.mostrar { display: flex; }
        .deseos-flotante.abierto { z-index: 10050; }
        .burbuja-deseos {
            width: 52px; height: 52px; border-radius: 50%; background: rgba(0,0,0,0.7);
            border: 1px solid rgba(184,232,201,0.5); box-shadow: 0 5px 20px rgba(184,232,201,0.25);
            display: flex; align-items: center; justify-content: center; font-size: 1.4rem; cursor: pointer;
            animation: aparecerSuave 0.8s forwards; backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
            touch-action: manipulation; transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .burbuja-deseos:active { transform: scale(0.9); }
        .panel-deseos {
            position: absolute; top: calc(100% + 15px); left: 0;
            background: rgba(15, 10, 20, 0.9); border: 1px solid rgba(184,232,201,0.25);
            border-radius: 24px; width: min(88vw, 330px); height: min(65vh, 460px);
            display: flex; flex-direction: column; box-shadow: 0 20px 50px rgba(0,0,0,0.8);
            transform-origin: top left; opacity: 0; transform: scale(0.9) translateY(-10px);
            pointer-events: none; transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .deseos-flotante.abierto .panel-deseos { opacity: 1; transform: scale(1) translateY(0); pointer-events: auto; }
        .header-deseos {
            padding: 14px 18px; border-bottom: 1px solid rgba(255,255,255,0.08);
            display: flex; justify-content: space-between; align-items: center; color: #b8e8c9; font-family: var(--fuente-texto);
        }
        .titulo-deseos { font-size: 0.95rem; font-weight: bold; }
        .btn-cerrar-deseos { background: none; border: none; color: white; font-size: 1.1rem; cursor: pointer; touch-action: manipulation; }
        .tabs-deseos { display: flex; gap: 6px; padding: 10px 14px 0; }
        .tab-deseo {
            flex: 1; text-align: center; padding: 7px 4px; border-radius: 12px; font-size: 0.75rem;
            font-family: var(--fuente-texto); color: rgba(255,255,255,0.55); background: rgba(255,255,255,0.05);
            cursor: pointer; touch-action: manipulation; border: 1px solid rgba(255,255,255,0.08);
            transition: all 0.25s ease; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .tab-deseo.activo { color: #05080a; background: linear-gradient(135deg, #b8e8c9, #b8e8e0); font-weight: bold; border-color: transparent; }
        .lista-deseos { flex: 1; padding: 14px; overflow-y: auto; -webkit-overflow-scrolling: touch; touch-action: pan-y; overscroll-behavior: contain; display: flex; flex-direction: column; gap: 8px; }
        .lista-deseos .sin-mensajes { font-size: 0.82rem; color: rgba(255,255,255,0.55); font-style: italic; text-align: center; margin: auto; }
        .fila-deseo {
            display: flex; align-items: center; gap: 10px; padding: 9px 12px; border-radius: 12px;
            background: rgba(184,232,201,0.08); font-family: var(--fuente-texto); cursor: pointer; touch-action: manipulation;
            animation: aparecerSuave 0.3s forwards; transition: transform 0.2s ease, background 0.2s ease;
        }
        .fila-deseo:active { transform: scale(0.98); }
        .fila-deseo .check-deseo { font-size: 1.2rem; flex-shrink: 0; }
        .fila-deseo { flex-wrap: wrap; }
        .fila-deseo .texto-deseo { font-size: 0.88rem; color: white; line-height: 1.35; flex: 1; }
        .fila-deseo .fila-acciones-item { flex-basis: 100%; }
        .fila-deseo .textarea-edicion-item { flex-basis: 100%; }
        .fila-deseo.cumplido { background: linear-gradient(135deg, rgba(245,217,168,0.12), rgba(255,184,207,0.06)); border: 1px solid rgba(245,217,168,0.22); }
        .fila-deseo.cumplido .texto-deseo { text-decoration: none; color: rgba(255,255,255,0.82); font-style: italic; }
        .input-deseos-area { padding: 10px 14px calc(10px + env(safe-area-inset-bottom, 0px)); display: flex; gap: 8px; border-top: 1px solid rgba(255,255,255,0.08); }
        #input-deseo {
            flex: 1; min-width: 0; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12);
            border-radius: 20px; padding: 11px 14px; color: white; font-family: var(--fuente-texto); outline: none; font-size: 0.9rem;
        }
        .btn-enviar-deseo {
            background: linear-gradient(135deg, #b8e8c9, #b8e8e0); border: none; border-radius: 50%;
            width: 40px; height: 40px; flex-shrink: 0; display: flex; align-items: center; justify-content: center;
            cursor: pointer; touch-action: manipulation; font-size: 0.95rem;
        }

        /* --- Burbuja flotante: Preguntas para nosotros --- */
        .preguntas-flotante {
            position: fixed;
            bottom: calc(clamp(20px, 5vh, 40px) + env(safe-area-inset-bottom, 0px) + 92px);
            right: calc(clamp(15px, 5vw, 40px) + env(safe-area-inset-right, 0px));
            z-index: 1001;
            display: none; flex-direction: column; align-items: flex-end; gap: 15px;
        }
        /* Cuando el panel está abierto, sube muy por encima de cualquier otra burbuja vecina
           (reloj, chat, etc.) para que nunca le tapen los botones de "otra pregunta" / "enviar" */
        .preguntas-flotante.abierto { z-index: 10050; }
        .preguntas-flotante.mostrar { display: flex; }
        .burbuja-preguntas {
            width: 52px; height: 52px; border-radius: 50%; background: rgba(0,0,0,0.7);
            border: 1px solid rgba(199,179,250,0.5); box-shadow: 0 5px 20px rgba(199,179,250,0.25);
            display: flex; align-items: center; justify-content: center; font-size: 1.4rem; cursor: pointer;
            animation: aparecerSuave 0.8s forwards; backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
            touch-action: manipulation; transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .burbuja-preguntas:active { transform: scale(0.9); }
        .panel-preguntas {
            position: absolute; bottom: calc(100% + 15px); right: 0;
            background: rgba(15, 10, 20, 0.92); border: 1px solid rgba(199,179,250,0.25);
            border-radius: 24px; width: min(88vw, 330px); max-height: min(60vh, 420px);
            display: flex; flex-direction: column; box-shadow: 0 20px 50px rgba(0,0,0,0.8);
            transform-origin: bottom right; opacity: 0; transform: scale(0.9) translateY(10px);
            pointer-events: none; transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .preguntas-flotante.abierto .panel-preguntas { opacity: 1; transform: scale(1) translateY(0); pointer-events: auto; }
        .header-preguntas {
            padding: 14px 18px; border-bottom: 1px solid rgba(255,255,255,0.08);
            display: flex; justify-content: space-between; align-items: center; color: #c7b3fa; font-family: var(--fuente-texto);
        }
        .titulo-preguntas { font-size: 0.95rem; font-weight: bold; }
        .btn-cerrar-preguntas { background: none; border: none; color: white; font-size: 1.1rem; cursor: pointer; touch-action: manipulation; }
        .cuerpo-preguntas { padding: 20px 18px; overflow-y: auto; -webkit-overflow-scrolling: touch; touch-action: pan-y; overscroll-behavior: contain; }
        .pregunta-categoria { font-size: 0.72rem; letter-spacing: 0.05em; text-transform: uppercase; color: #c7b3fa; margin-bottom: 10px; }
        .pregunta-texto { font-family: var(--fuente-titulo); font-size: clamp(1.15rem, 4vw, 1.4rem); color: white; line-height: 1.35; }
        .pie-preguntas { padding: 12px 18px calc(14px + env(safe-area-inset-bottom, 0px)); border-top: 1px solid rgba(255,255,255,0.08); }
        .btn-otra-pregunta {
            width: 100%; padding: 12px; border-radius: 20px; border: none; cursor: pointer; touch-action: manipulation;
            background: linear-gradient(135deg, #c7b3fa, #a5b4fc); color: #2a1a3d; font-weight: bold; font-family: var(--fuente-texto);
        }
        .fila-envio-whatsapp { display: flex; gap: 8px; margin-top: 10px; }
        .btn-enviar-whatsapp {
            flex: 1; padding: 10px 6px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.15); cursor: pointer;
            touch-action: manipulation; background: rgba(37,211,102,0.15); color: white; font-size: 0.78rem;
            font-weight: bold; font-family: var(--fuente-texto);
        }

        /* --- Burbuja flotante: Reloj / Cuenta regresiva (apilado sobre las preguntas) --- */
        .reloj-flotante {
            position: fixed;
            bottom: calc(clamp(20px, 5vh, 40px) + env(safe-area-inset-bottom, 0px) + 168px);
            right: calc(clamp(15px, 5vw, 40px) + env(safe-area-inset-right, 0px));
            z-index: 1001;
            display: none; flex-direction: column; align-items: flex-end; gap: 15px;
        }
        .reloj-flotante.mostrar { display: flex; }
        .reloj-flotante.abierto { z-index: 10050; }
        .burbuja-reloj {
            width: 52px; height: 52px; border-radius: 50%; background: rgba(0,0,0,0.7);
            border: 1px solid rgba(255,194,217,0.5); box-shadow: 0 5px 20px rgba(255,194,217,0.25);
            display: flex; align-items: center; justify-content: center; font-size: 1.4rem; cursor: pointer;
            animation: aparecerSuave 0.8s forwards, latidoBurbuja 3s infinite; backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
            touch-action: manipulation; transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .burbuja-reloj:active { transform: scale(0.9); }
        .panel-reloj {
            position: absolute; bottom: calc(100% + 15px); right: 0;
            background: rgba(15, 10, 20, 0.92); border: 1px solid rgba(255,194,217,0.25);
            border-radius: 24px; width: min(88vw, 320px); padding: 22px 20px;
            box-shadow: 0 20px 50px rgba(0,0,0,0.8); text-align: center;
            transform-origin: bottom right; opacity: 0; transform: scale(0.9) translateY(10px);
            pointer-events: none; transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .reloj-flotante.abierto .panel-reloj { opacity: 1; transform: scale(1) translateY(0); pointer-events: auto; }
        .header-reloj { display: flex; justify-content: flex-end; margin-bottom: 4px; }
        .btn-cerrar-reloj { background: none; border: none; color: white; font-size: 1.1rem; cursor: pointer; touch-action: manipulation; }
        .fr-subtitulo { font-family: var(--fuente-texto); font-size: 0.78rem; letter-spacing: 0.05em; text-transform: uppercase; color: #ffc2d9; }
        .fr-titulo { font-family: var(--fuente-titulo); font-size: clamp(1rem, 4vw, 1.3rem); color: white; margin: 6px 0 14px; line-height: 1.3; }
        .fr-numeros { display: flex; justify-content: center; gap: 10px; }
        .fr-bloque { display: flex; flex-direction: column; align-items: center; }
        .fr-valor { font-family: var(--fuente-titulo); font-size: clamp(1.4rem, 6vw, 1.9rem); color: #ffc2d9; }
        .fr-etiqueta { font-family: var(--fuente-texto); font-size: 0.65rem; color: rgba(255,255,255,0.6); text-transform: uppercase; }
        .fr-fecha { font-family: var(--fuente-texto); font-size: 0.75rem; font-style: italic; color: rgba(255,255,255,0.5); margin-top: 14px; }

        /* --- Constelación-corazón: agrupa muro, gratitud, deseos, preguntas, reloj y música --- */
        /* El chat tiene su propio widget fijo abajo a la derecha (como un chat de soporte),
           por eso su burbuja NO se oculta. La música se abre desde el corazón. */
        .burbuja-muro, .burbuja-gratitud, .burbuja-deseos, .burbuja-preguntas, .burbuja-reloj {
            display: none !important;
        }
        /* ============================================================
           CONSOLIDACIÓN DE BOTONES FLOTANTES
           Las burbujas individuales (muro, gratitud, deseos, preguntas,
           reloj, música) dejan de mostrarse como círculos sueltos en
           pantalla: ahora se disparan únicamente desde los puntos del
           universo-corazón. El chat es la excepción: vive como widget
           propio, siempre visible. No se toca la lógica JS de cada
           panel, solo se oculta su "gatillo" visual propio, conservando
           el tamaño de su contenedor para no romper el posicionamiento
           (absolute) de los paneles que cuelgan de él.
           ============================================================ */
        .burbuja-muro, .burbuja-gratitud, .burbuja-deseos,
        .burbuja-preguntas, .burbuja-reloj, .burbuja-reproductor {
            visibility: hidden;
            pointer-events: none;
        }

        /* ============================================================
           ÍNDICE (tabla de contenidos, como pantalla principal del libro)
           Pantalla principal de Índice (tabla de contenidos): reemplaza al
           viejo menú lateral. Es la página 2 del libro (después de la
           puerta) y desde ahí se salta directo a cualquier capítulo.
           ============================================================ */
        .pantalla-indice {
            padding: calc(32px + env(safe-area-inset-top, 0px)) 24px calc(32px + env(safe-area-inset-bottom, 0px));
            box-sizing: border-box;
            text-align: center;
            background: radial-gradient(circle at 50% 15%, rgba(255,194,217,0.14), transparent 60%), #0c0810;
        }
        .indice-titulo {
            font-family: var(--fuente-titulo); font-weight: 400;
            font-size: clamp(1.8rem, 7vw, 2.6rem); color: #fdf6f0; margin: 0 0 8px;
            text-shadow: 0 2px 14px rgba(0,0,0,0.35);
        }
        .indice-subtitulo {
            font-family: var(--fuente-texto); color: rgba(255,255,255,0.55);
            font-size: 0.85rem; margin: 0 0 26px; letter-spacing: 0.03em;
        }
        .lista-indice {
            display: flex; flex-direction: column; gap: 12px;
            width: min(88vw, 380px);
            max-height: min(54vh, 420px);
            overflow-y: auto; -webkit-overflow-scrolling: touch; touch-action: pan-y;
            padding: 4px 4px 4px 0;
        }
        .tarjeta-indice {
            display: flex; align-items: center; gap: 14px;
            width: 100%; box-sizing: border-box;
            padding: 15px 18px; border-radius: 18px;
            background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.15);
            backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
            cursor: pointer; touch-action: manipulation; pointer-events: auto;
            text-align: left; -webkit-user-select: none; user-select: none;
            font-family: var(--fuente-texto); margin: 0; appearance: none; -webkit-appearance: none;
            transition: transform 0.2s ease, background 0.2s ease;
        }
        .tarjeta-indice:active { transform: scale(0.97); background: rgba(255,255,255,0.12); }
        .tarjeta-indice .numero-indice {
            width: 38px; height: 38px; border-radius: 50%; flex-shrink: 0;
            background: rgba(255,184,207,0.25); border: 1px solid rgba(255,255,255,0.3);
            display: flex; align-items: center; justify-content: center;
            font-family: var(--fuente-titulo); font-size: 1.05rem; color: #ffe6ef;
        }
        .tarjeta-indice > span:last-child { display: flex; flex-direction: column; gap: 2px; }
        .tarjeta-indice .titulo-indice { font-family: var(--fuente-texto); color: #fdf6f0; font-size: 0.95rem; font-weight: 600; }
        .tarjeta-indice .detalle-indice { font-family: var(--fuente-texto); color: rgba(255,255,255,0.5); font-size: 0.75rem; }

        /* Botón de acceso rápido: vuelve al Índice desde cualquier página del libro */
        .btn-indice-rapido {
            position: fixed;
            top: calc(84px + env(safe-area-inset-top, 0px));
            right: calc(10px + env(safe-area-inset-right, 0px));
            z-index: 9995;
            width: 44px; height: 44px; border-radius: 50%;
            background: rgba(10, 8, 14, 0.4);
            backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
            border: 1px solid rgba(255,255,255,0.22);
            display: none; align-items: center; justify-content: center;
            font-size: 1.15rem; color: #ffe6ef; cursor: pointer;
            touch-action: manipulation; pointer-events: auto;
            opacity: 0; transition: opacity 0.6s ease, transform 0.2s ease;
        }
        .btn-indice-rapido.mostrar { display: flex; }
        .btn-indice-rapido.visible-suave { opacity: 1; }
        .btn-indice-rapido:active { transform: scale(0.88); }
        .btn-indice-rapido.activo-indice {
            background: rgba(255, 184, 207, 0.55);
            border-color: rgba(255,255,255,0.7);
            box-shadow: 0 0 14px rgba(255,184,207,0.6);
        }
        .btn-auto-avance {
            top: calc(84px + 54px + env(safe-area-inset-top, 0px));
        }

        /* Legibilidad: sombras suaves para texto dinámico sobre fondos animados */
        .texto-romantico, .capitulo-titulo, .cuenta-titulo, .cuenta-subtitulo,
        .cuenta-fecha, .cuenta-frase, .final-firma, #pregunta1, #pregunta2,
        #mensaje-final, .capitulo-indicador {
            text-shadow: 0 2px 14px rgba(0,0,0,0.35), 0 1px 3px rgba(0,0,0,0.45);
        }

        .menu-principal {
            position: fixed;
            top: calc(clamp(16px, 4.5vh, 24px) + env(safe-area-inset-top, 0px));
            left: calc(clamp(12px, 5vw, 24px) + env(safe-area-inset-left, 0px));
            z-index: 9999;
            display: none;
        }
        .menu-principal.mostrar { display: flex; }
        .burbuja-menu {
            width: 52px; height: 52px; border-radius: 50%;
            background: radial-gradient(circle at 32% 28%, rgba(148,131,224,0.55), rgba(0,0,0,0.75) 68%);
            border: 1px solid rgba(199,179,250,0.55); box-shadow: 0 5px 22px rgba(148,131,224,0.35);
            display: flex; align-items: center; justify-content: center; font-size: 1.35rem; cursor: pointer;
            animation: aparecerSuave 0.8s forwards, latidoBurbuja 3.4s infinite;
            backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); touch-action: manipulation;
            transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .burbuja-menu:active { transform: scale(0.88) rotate(-8deg); }

        /* ============================================================
           UNIVERSO-CORAZÓN: la pantalla que aparece al abrir la puerta.
           Todo lo demás (el libro incluido) es un punto más para tocar;
           nada se abre ni suena solo.
           ============================================================ */
        .universo-corazon {
            position: fixed; inset: 0; z-index: 500;
            display: none; flex-direction: column; align-items: center; justify-content: flex-start;
            padding: calc(30px + env(safe-area-inset-top, 0px)) 18px calc(120px + env(safe-area-inset-bottom, 0px));
            overflow-y: auto; overflow-x: hidden; -webkit-overflow-scrolling: touch; touch-action: pan-y; box-sizing: border-box;
            background:
                radial-gradient(1.5px 1.5px at 10% 15%, rgba(255,255,255,0.7) 1px, transparent 0),
                radial-gradient(1px 1px at 85% 8%, rgba(255,255,255,0.5) 1px, transparent 0),
                radial-gradient(1.5px 1.5px at 92% 35%, rgba(255,255,255,0.6) 1px, transparent 0),
                radial-gradient(1px 1px at 6% 55%, rgba(255,255,255,0.45) 1px, transparent 0),
                radial-gradient(1.5px 1.5px at 22% 92%, rgba(255,255,255,0.5) 1px, transparent 0),
                radial-gradient(1px 1px at 78% 88%, rgba(255,255,255,0.4) 1px, transparent 0),
                radial-gradient(1.5px 1.5px at 55% 45%, rgba(255,255,255,0.35) 1px, transparent 0),
                radial-gradient(ellipse 90% 55% at 50% 0%, rgba(148,131,224,0.16), transparent 62%),
                radial-gradient(ellipse 90% 55% at 50% 100%, rgba(255,184,207,0.12), transparent 62%),
                var(--color-bg-oscuro);
            opacity: 0; transition: opacity 0.7s ease;
        }
        .universo-corazon::before {
            content: '';
            position: absolute; inset: 0; pointer-events: none;
            background: radial-gradient(ellipse 70% 45% at 50% 25%, rgba(255,208,226,0.10), transparent 65%);
            animation: respirarUniverso 7s ease-in-out infinite;
        }
        @keyframes respirarUniverso { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }
        @media (prefers-reduced-motion: reduce) { .universo-corazon::before { animation: none; } }
        .estrellas-titilantes { position: absolute; inset: 0; pointer-events: none; z-index: 0; }
        .estrellas-titilantes::before, .estrellas-titilantes::after {
            content: ''; position: absolute; inset: 0;
            background-image:
                radial-gradient(1.4px 1.4px at 8% 22%, #fdf6f0 1px, transparent 0),
                radial-gradient(1px 1px at 18% 68%, #fdf6f0 1px, transparent 0),
                radial-gradient(1.4px 1.4px at 27% 40%, #fdf6f0 1px, transparent 0),
                radial-gradient(1px 1px at 38% 80%, #fdf6f0 1px, transparent 0),
                radial-gradient(1.4px 1.4px at 47% 12%, #fdf6f0 1px, transparent 0),
                radial-gradient(1px 1px at 58% 55%, #fdf6f0 1px, transparent 0),
                radial-gradient(1.4px 1.4px at 66% 30%, #fdf6f0 1px, transparent 0),
                radial-gradient(1px 1px at 74% 75%, #fdf6f0 1px, transparent 0),
                radial-gradient(1.4px 1.4px at 84% 18%, #fdf6f0 1px, transparent 0),
                radial-gradient(1px 1px at 92% 62%, #fdf6f0 1px, transparent 0);
            animation: titilarEstrellas 3.6s ease-in-out infinite;
        }
        .estrellas-titilantes::after {
            background-image:
                radial-gradient(1px 1px at 14% 48%, #fdf6f0 1px, transparent 0),
                radial-gradient(1.4px 1.4px at 23% 85%, #fdf6f0 1px, transparent 0),
                radial-gradient(1px 1px at 33% 15%, #fdf6f0 1px, transparent 0),
                radial-gradient(1.4px 1.4px at 44% 60%, #fdf6f0 1px, transparent 0),
                radial-gradient(1px 1px at 54% 30%, #fdf6f0 1px, transparent 0),
                radial-gradient(1.4px 1.4px at 63% 78%, #fdf6f0 1px, transparent 0),
                radial-gradient(1px 1px at 71% 10%, #fdf6f0 1px, transparent 0),
                radial-gradient(1.4px 1.4px at 80% 50%, #fdf6f0 1px, transparent 0),
                radial-gradient(1px 1px at 88% 88%, #fdf6f0 1px, transparent 0),
                radial-gradient(1.4px 1.4px at 96% 35%, #fdf6f0 1px, transparent 0);
            animation-delay: 1.8s;
        }
        @keyframes titilarEstrellas { 0%, 100% { opacity: 0.2; } 50% { opacity: 1; } }
        @media (prefers-reduced-motion: reduce) { .estrellas-titilantes::before, .estrellas-titilantes::after { animation: none; opacity: 0.6; } }
        .universo-corazon.mostrar { display: flex; }
        .universo-corazon.activo { opacity: 1; }
        .universo-titulo-principal {
            font-family: var(--fuente-titulo); font-size: clamp(1.7rem, 8vw, 2.3rem);
            text-align: center; margin: 4px 0 2px;
            flex-shrink: 0; position: relative; z-index: 1;
            background: linear-gradient(90deg, #ffc2d9, #fdf6f05e1, #c7b3fa, #ffc2d9);
            background-size: 300% 100%;
            -webkit-background-clip: text; background-clip: text; color: transparent; -webkit-text-fill-color: transparent;
            filter: drop-shadow(0 0 18px rgba(255,194,217,0.45));
            animation: brilloTituloUniverso 6s linear infinite;
        }
        @keyframes brilloTituloUniverso { 0% { background-position: 0% 50%; } 100% { background-position: 300% 50%; } }
        @media (prefers-reduced-motion: reduce) { .universo-titulo-principal { animation: none; } }
        .universo-subtitulo-principal {
            font-family: var(--fuente-texto); font-style: italic; font-size: 0.78rem;
            color: rgba(255,255,255,0.55); text-align: center; margin: 0 0 22px; letter-spacing: 0.01em;
            flex-shrink: 0; max-width: 320px; position: relative; z-index: 1;
        }
        .lienzo-corazon {
            position: relative; width: min(84vw, 380px); aspect-ratio: 11 / 10;
            flex-shrink: 0; margin: 0 auto;
        }
        .lienzo-corazon::before {
            content: '';
            position: absolute; left: 50%; top: 50%; width: 135%; height: 135%;
            transform: translate(-50%, -50%);
            background: radial-gradient(ellipse 55% 50% at 50% 42%, rgba(255,184,207,0.4), rgba(199,179,250,0.2) 55%, transparent 75%);
            filter: blur(28px);
            pointer-events: none;
            animation: latirAuraCorazon 4.5s ease-in-out infinite;
        }
        @keyframes latirAuraCorazon {
            0%, 100% { opacity: 0.55; transform: translate(-50%, -50%) scale(0.94); }
            50% { opacity: 1; transform: translate(-50%, -50%) scale(1.06); }
        }
        @media (prefers-reduced-motion: reduce) { .lienzo-corazon::before { animation: none; opacity: 0.7; } }
        .lienzo-corazon svg { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
        .trazo-corazon {
            fill: none; stroke: url(#gradienteCorazon); stroke-width: 0.55; opacity: 0.5;
            filter: drop-shadow(0 0 5px rgba(255,184,207,0.55));
            animation: respirarCorazon 4.5s ease-in-out infinite;
        }
        @keyframes respirarCorazon { 0%, 100% { opacity: 0.35; } 50% { opacity: 0.72; } }
        /* Brillo viajero: un destello recorre el contorno del corazón como una
           constelación que se enciende de a ratos, no todo el tiempo. */
        .trazo-corazon-brillo {
            fill: none;
            stroke: #fdf6f0fff;
            stroke-width: 1;
            stroke-linecap: round;
            stroke-dasharray: 10 90;
            filter: drop-shadow(0 0 3px #fdf6f0) drop-shadow(0 0 8px rgba(255,208,226,0.95)) drop-shadow(0 0 16px rgba(199,179,250,0.8));
            opacity: 0;
            animation: recorrerCorazon 12s ease-in-out infinite;
        }
        @keyframes recorrerCorazon {
            0% { opacity: 0; stroke-dashoffset: 0; }
            4% { opacity: 1; }
            54% { opacity: 1; stroke-dashoffset: -100; }
            60% { opacity: 0; stroke-dashoffset: -100; }
            100% { opacity: 0; stroke-dashoffset: -100; }
        }
        @media (prefers-reduced-motion: reduce) {
            .trazo-corazon-brillo { display: none; }
        }
        .punto-corazon {
            position: absolute; transform: translate(-50%, -50%);
            width: clamp(44px, 14.5vw, 62px); height: clamp(44px, 14.5vw, 62px); border-radius: 50%; color: #fdf6f0;
            display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px;
            font-family: var(--fuente-texto); text-align: center; cursor: pointer; touch-action: manipulation;
            border: 1px solid rgba(255,255,255,0.18); box-sizing: border-box; padding: 0 3px;
            animation: latidoBurbuja 3.6s infinite;
            transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.35s ease;
        }
        .punto-corazon:active { transform: translate(-50%, -50%) scale(0.88); box-shadow: 0 0 24px rgba(255,194,217,0.65); }
        .punto-corazon .planeta-icono { font-size: clamp(0.95rem, 3.8vw, 1.35rem); }
        .punto-corazon .planeta-nombre { font-size: clamp(0.4rem, 1.7vw, 0.54rem); font-weight: 600; line-height: 1.1; letter-spacing: 0.01em; }
        .planeta-carta {
            width: clamp(54px, 18.5vw, 80px); height: clamp(54px, 18.5vw, 80px);
            background: radial-gradient(circle at 32% 28%, rgba(255,230,190,0.6), rgba(255,184,207,0.32) 70%);
            box-shadow: 0 0 24px rgba(255,205,150,0.4); border-color: rgba(255,227,194,0.55);
        }
        .planeta-carta .planeta-icono { font-size: clamp(1.25rem, 4.8vw, 1.7rem); }
        .planeta-carta .planeta-nombre { font-size: clamp(0.46rem, 1.9vw, 0.6rem); }
        .planeta-musica { background: radial-gradient(circle at 32% 28%, rgba(255,214,168,0.5), rgba(255,138,158,0.28) 70%); box-shadow: 0 0 16px rgba(255,184,207,0.25); }
        .planeta-muro { background: radial-gradient(circle at 32% 28%, rgba(255,227,194,0.48), rgba(180,120,60,0.3) 70%); box-shadow: 0 0 16px rgba(212,163,115,0.25); }
        .planeta-gratitud { background: radial-gradient(circle at 32% 28%, rgba(255,226,159,0.5), rgba(255,169,159,0.28) 70%); box-shadow: 0 0 16px rgba(245,217,168,0.25); }
        .planeta-deseos { background: radial-gradient(circle at 32% 28%, rgba(184,232,201,0.48), rgba(168,237,234,0.28) 70%); box-shadow: 0 0 16px rgba(184,232,201,0.25); }
        .planeta-preguntas { background: radial-gradient(circle at 32% 28%, rgba(216,196,255,0.5), rgba(148,131,224,0.3) 70%); box-shadow: 0 0 16px rgba(148,131,224,0.25); }
        .planeta-reloj { background: radial-gradient(circle at 32% 28%, rgba(255,214,178,0.5), rgba(255,157,133,0.3) 70%); box-shadow: 0 0 16px rgba(255,157,133,0.25); }
        .planeta-ticket { background: radial-gradient(circle at 32% 28%, rgba(245,217,168,0.5), rgba(217,162,115,0.3) 70%); box-shadow: 0 0 16px rgba(240,217,160,0.25); }
        .planeta-sanacion { background: radial-gradient(circle at 32% 28%, rgba(184,232,201,0.5), rgba(148,131,224,0.28) 70%); box-shadow: 0 0 16px rgba(184,232,201,0.25); }
        .planeta-juegos { background: radial-gradient(circle at 32% 28%, rgba(178,212,255,0.5), rgba(255,179,198,0.28) 70%); box-shadow: 0 0 16px rgba(178,212,255,0.25); }
        /* Widget fijo abajo a la izquierda, en el mismo nivel que el chat (abajo a la derecha) */
        .sorpresa-flotante {
            position: fixed;
            bottom: calc(clamp(16px, 4.5vh, 24px) + env(safe-area-inset-bottom, 0px));
            left: calc(clamp(12px, 5vw, 24px) + env(safe-area-inset-left, 0px));
            z-index: 9997;
            display: none;
        }
        .sorpresa-flotante.mostrar { display: flex; }
        .nucleo-corazon {
            position: relative; transform: none;
            width: 50px; height: 50px; border-radius: 50%;
            background: radial-gradient(circle at 35% 30%, rgba(255,255,255,0.55), rgba(148,131,224,0.4) 55%, rgba(255,184,207,0.35) 100%);
            border: 1px solid rgba(255,255,255,0.45); box-shadow: 0 0 22px rgba(255,182,255,0.45);
            display: flex; align-items: center; justify-content: center; font-size: 1.4rem; cursor: pointer;
            touch-action: manipulation; animation: latidoBurbuja 2.3s infinite;
            transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.35s ease;
        }
        .nucleo-corazon:active { transform: scale(0.85); box-shadow: 0 0 28px rgba(255,182,255,0.75); }
        .nucleo-corazon::after {
            content: '';
            position: absolute; inset: -10px; border-radius: 50%;
            border: 1.5px solid rgba(255,208,226,0.55);
            animation: aroMagico 2.6s ease-out infinite;
            pointer-events: none;
        }
        @keyframes aroMagico {
            0% { transform: scale(0.85); opacity: 0.9; }
            100% { transform: scale(1.5); opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) { .nucleo-corazon::after { animation: none; display: none; } }
        .extras-corazon {
            margin-top: 26px; display: flex; flex-direction: column; align-items: center; gap: 6px;
            flex-shrink: 0; width: 100%;
        }
        .extras-titulo {
            font-family: var(--fuente-texto); font-size: 0.68rem; color: rgba(255,255,255,0.5);
            text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 4px;
        }
        .separador-romantico {
            display: flex; align-items: center; justify-content: center; gap: 8px;
            color: rgba(199,179,250,0.55); font-size: 0.7rem; margin: 4px 0 2px; letter-spacing: 2px;
        }
        .fila-iconos-interactivos { display: flex; justify-content: center; gap: 14px; padding: 4px 0 2px; }
        .icono-interactivo {
            width: 50px; height: 50px; border-radius: 50%; border: 1px solid rgba(199,179,250,0.35);
            background: rgba(255,255,255,0.06); font-size: 1.5rem; cursor: pointer; touch-action: manipulation;
            display: flex; align-items: center; justify-content: center;
            transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.2s ease;
            animation: latidoBurbuja 3.2s infinite;
        }
        .icono-interactivo:active { transform: scale(0.82); background: rgba(148,131,224,0.25); }

        /* Botón "volver al universo" flotante, visible solo dentro del libro o de un panel */
        .btn-volver-universo {
            width: 46px; height: 46px; border-radius: 50%;
            background: radial-gradient(circle at 32% 28%, rgba(148,131,224,0.5), rgba(0,0,0,0.75) 68%);
            border: 1px solid rgba(199,179,250,0.5); box-shadow: 0 5px 18px rgba(148,131,224,0.3);
            display: flex; align-items: center; justify-content: center; font-size: 1.15rem; cursor: pointer;
            touch-action: manipulation; backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
            transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .btn-volver-universo:active { transform: scale(0.88); }

        /* --- Muro en el tiempo --- */
        .muro-pantalla { padding: 20px; overflow-y: auto; -webkit-overflow-scrolling: touch; touch-action: pan-y; overscroll-behavior: contain; box-sizing: border-box; }
        .muro-header { display: flex; justify-content: space-between; align-items: center; padding: 10px 8px clamp(20px, 4vh, 30px); gap: 12px; flex-wrap: wrap; }
        .muro-titulo { font-family: var(--fuente-titulo); font-size: clamp(1.8rem, 6vw, 3.2rem); color: #ffc2d9; margin: 0; text-shadow: 0 0 20px rgba(255,184,207,0.5); }
        .muro-cerrar {
            background: rgba(255,255,255,0.1); color: white; border: 1px solid rgba(255,255,255,0.2);
            padding: 8px 20px; border-radius: 20px; cursor: pointer; font-family: var(--fuente-texto); touch-action: manipulation;
        }
        .muro-input-container {
            max-width: 800px; margin: 0 auto clamp(30px, 5vh, 40px); background: rgba(255,255,255,0.03);
            padding: clamp(16px, 4vw, 20px); border-radius: 20px; border: 1px solid rgba(255,194,217,0.2);
            display: flex; flex-direction: column; align-items: flex-end; gap: 14px; width: 100%; box-sizing: border-box;
        }
        #texto-muro {
            width: 100%; box-sizing: border-box; background: rgba(0,0,0,0.15); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px;
            padding: 12px; color: white; font-family: var(--fuente-texto); font-size: 1rem; resize: vertical; outline: none; line-height: 1.5;
        }
        #texto-muro::placeholder { color: rgba(255,255,255,0.4); }
        .btn-publicar-muro {
            background: #ffc2d9; color: #1a1015; border: none; padding: 10px 24px; border-radius: 20px;
            cursor: pointer; font-family: var(--fuente-texto); font-weight: bold; touch-action: manipulation;
        }
        .btn-publicar-muro:disabled { opacity: 0.6; cursor: default; }
        .muro-grid {
            display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 260px), 1fr)); gap: 18px;
            max-width: 1000px; margin: 0 auto; width: 100%; padding-bottom: 50px;
        }
        .muro-grid .sin-notas { grid-column: 1 / -1; text-align: center; color: rgba(255,255,255,0.55); font-style: italic; font-family: var(--fuente-texto); padding: 30px 0; }
        .tarjeta-nota {
            background: rgba(255,255,255,0.05); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.1); padding: 22px; border-radius: 15px;
            display: flex; flex-direction: column; gap: 14px; color: white;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3); transition: transform 0.3s ease;
            animation: aparecerSuave 0.4s forwards;
        }
        .tarjeta-nota:hover { transform: translateY(-5px); }
        .nota-carito { border-top: 4px solid #ffb8cf; }
        .nota-nico { border-top: 4px solid #b2d4ff; }
        .nota-autor { font-family: var(--fuente-titulo); font-size: 1.4rem; color: #ffc2d9; }
        .nota-texto { font-family: var(--fuente-texto); font-size: 0.95rem; line-height: 1.6; white-space: pre-wrap; flex: 1; }
        .nota-fecha { font-family: var(--fuente-texto); font-size: 0.78rem; color: rgba(255,255,255,0.4); text-align: right; }

        @keyframes rebote { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        @keyframes aparecerSuave { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes resplandorBoton { from { box-shadow: 0 5px 15px rgba(255, 184, 207, 0.4); } to { box-shadow: 0 15px 35px rgba(255, 184, 207, 0.8); } }


        /* PORTADAS DE CAPÍTULO */
        .portada-capitulo {
            background: radial-gradient(ellipse at center, #3a1220 0%, #1a0810 60%, #0a0408 100%);
            color: #fdf6f0;
            overflow: hidden;
        }
        .portada-capitulo::before {
            content: '';
            position: absolute; inset: 0;
            background: radial-gradient(circle at 30% 30%, rgba(255,184,207,0.15), transparent 50%),
                        radial-gradient(circle at 70% 70%, rgba(209,101,126,0.12), transparent 50%);
            animation: flotarGradiente 12s ease-in-out infinite;
            background-size: 200% 200%;
        }
        .capitulo-numero {
            font-family: var(--fuente-texto); text-transform: uppercase; letter-spacing: 4px;
            font-size: clamp(0.75rem, 2.5vw, 1rem); color: #ffb8cf;
            opacity: 0; transform: translateY(20px); transition: all 0.9s ease 0.1s;
            position: relative; z-index: 1;
        }
        .capitulo-titulo {
            font-family: var(--fuente-titulo); font-size: clamp(2.5rem, 9vw, 5rem);
            margin: 15px 0 30px; text-align: center; padding: 0 20px;
            background: linear-gradient(90deg, #ffc2d9, #fdf6f05e1, #ffb8cf, #ffc2d9);
            background-size: 300% 100%;
            -webkit-background-clip: text; background-clip: text; color: transparent; -webkit-text-fill-color: transparent;
            filter: drop-shadow(0 0 22px rgba(255,157,133,0.4));
            opacity: 0; transform: translateY(25px); transition: opacity 0.9s ease 0.35s, transform 0.9s ease 0.35s;
            animation: brilloTituloUniverso 7s linear infinite;
            position: relative; z-index: 1;
        }
        @media (prefers-reduced-motion: reduce) { .capitulo-titulo { animation: none; } }
        .capitulo-indicador {
            font-size: clamp(0.85rem, 2.5vw, 1.05rem); color: rgba(255,255,255,0.65);
            animation: rebote 1.8s infinite;
            opacity: 0; transform: translateY(20px); transition: all 0.9s ease 0.6s;
            position: relative; z-index: 1;
        }
        .portada-capitulo.visible .capitulo-numero,
        .portada-capitulo.visible .capitulo-titulo,
        .portada-capitulo.visible .capitulo-indicador {
            opacity: 1; transform: translateY(0);
        }

        /* PANTALLA CUENTA REGRESIVA (primer encuentro en persona) */
        .pantalla-cuenta-regresiva {
            background: radial-gradient(ellipse at center, #2b1130 0%, #170a1e 55%, #05030a 100%);
            color: #fdf6f0; overflow: hidden;
        }
        .pantalla-cuenta-regresiva::before {
            content: '';
            position: absolute; inset: 0;
            background: radial-gradient(circle at 30% 30%, rgba(255,184,207,0.18), transparent 50%),
                        radial-gradient(circle at 70% 70%, rgba(255,184,207,0.15), transparent 50%);
            animation: flotarGradiente 14s ease-in-out infinite;
            background-size: 200% 200%;
        }
        .cuenta-contenido {
            position: relative; z-index: 1;
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            padding: 0 clamp(20px, 6vw, 60px); text-align: center;
        }
        .cuenta-subtitulo {
            font-family: var(--fuente-texto); text-transform: uppercase; letter-spacing: 3px;
            font-size: clamp(0.75rem, 2.5vw, 1rem); color: #ffb8cf;
        }
        .cuenta-titulo {
            font-family: var(--fuente-titulo); font-size: clamp(2rem, 7vw, 3.6rem);
            margin: 10px 0 clamp(20px, 4vh, 34px);
            text-shadow: 0 0 25px rgba(255, 157, 133, 0.5);
        }
        .cuenta-numeros { display: flex; gap: clamp(10px, 3vw, 22px); justify-content: center; flex-wrap: wrap; }
        .cuenta-bloque {
            display: flex; flex-direction: column; align-items: center;
            background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.2);
            backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
            border-radius: 16px; padding: clamp(10px, 3vw, 16px) clamp(12px, 3.5vw, 18px);
            min-width: clamp(56px, 15vw, 78px);
        }
        .cuenta-valor { font-size: clamp(1.6rem, 6vw, 2.6rem); font-weight: bold; color: #ffc2d9; font-family: var(--fuente-texto); }
        .cuenta-etiqueta { font-size: clamp(0.65rem, 2vw, 0.8rem); text-transform: uppercase; letter-spacing: 1px; color: rgba(255,255,255,0.7); margin-top: 4px; }
        .cuenta-fecha { margin-top: clamp(18px, 4vh, 28px); font-style: italic; color: rgba(255,255,255,0.65); font-size: clamp(0.85rem, 2.5vw, 1.05rem); }
        .cuenta-frase {
            margin-top: clamp(10px, 2.5vh, 16px); font-family: var(--fuente-titulo);
            font-size: clamp(1.15rem, 4vw, 1.7rem); color: #ffc2d9;
            text-shadow: 0 0 18px rgba(255,184,207,0.5);
            animation: brillarTextoTierno 5s ease-in-out infinite;
        }
        .cuenta-mensaje { display: none; margin-top: clamp(14px, 3vh, 20px); font-family: var(--fuente-titulo); font-size: clamp(1.5rem, 6vw, 2.4rem); color: #ff9d85; }

        .cuenta-subtitulo, .cuenta-titulo, .cuenta-numeros, .cuenta-fecha, .cuenta-frase {
            opacity: 0; transform: translateY(20px); transition: all 0.9s ease;
        }
        .pantalla-cuenta-regresiva.visible .cuenta-subtitulo { opacity: 1; transform: translateY(0); transition-delay: 0.1s; }
        .pantalla-cuenta-regresiva.visible .cuenta-titulo { opacity: 1; transform: translateY(0); transition-delay: 0.3s; }
        .pantalla-cuenta-regresiva.visible .cuenta-numeros { opacity: 1; transform: translateY(0); transition-delay: 0.5s; }
        .pantalla-cuenta-regresiva.visible .cuenta-fecha { opacity: 1; transform: translateY(0); transition-delay: 0.7s; }
        .pantalla-cuenta-regresiva.visible .cuenta-frase { opacity: 1; transform: translateY(0); transition-delay: 0.95s; }

        /* PANTALLA FINAL ESPECIAL */
        .final-especial {
            background: radial-gradient(ellipse at center, #4a1428 0%, #1f0812 55%, #050205 100%);
            color: #fdf6f0; overflow: hidden;
        }
        .final-brillo {
            position: absolute; inset: -20%;
            background: radial-gradient(circle at 50% 45%, rgba(255,184,207,0.35), transparent 55%);
            animation: flotarGradiente 10s ease-in-out infinite;
            background-size: 200% 200%;
            pointer-events: none;
        }
        .final-contenido {
            position: relative; z-index: 1;
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            padding: 0 clamp(20px, 6vw, 60px); text-align: center;
        }
        .final-lineas { display: flex; flex-direction: column; gap: clamp(10px, 2.5vh, 22px); align-items: center; }
        .final-linea {
            font-family: var(--fuente-titulo); margin: 0;
            text-shadow: 0 0 25px rgba(255, 184, 207, 0.7);
            color: #fdf6f0;
        }
        .final-linea-1, .final-linea-2 { font-size: clamp(1.8rem, 6vw, 3.2rem); }
        .final-linea-3 { font-size: clamp(2.2rem, 7.5vw, 4rem); color: #ffc2d9; animation: brillarTextoTierno 5s ease-in-out infinite; }
        @keyframes brillarTextoTierno {
            0%, 100% { text-shadow: 0 0 14px rgba(255,184,207,0.4); }
            50% { text-shadow: 0 0 30px rgba(255,194,217,0.85), 0 0 46px rgba(199,179,250,0.35); }
        }
        @media (prefers-reduced-motion: reduce) { .cuenta-frase, .final-linea-3 { animation: none; } }
        .final-firma {
            margin-top: clamp(25px, 5vh, 45px); font-family: var(--fuente-texto); font-style: italic;
            font-size: clamp(0.9rem, 2.5vw, 1.15rem); color: rgba(255,255,255,0.6);
            opacity: 0; transition: opacity 1.5s ease 0.5s;
        }
        .final-especial.final-completo .final-firma { opacity: 1; }

        .final-foto {
            margin-top: clamp(18px, 4vh, 30px);
            padding: 10px 10px 22px 10px;
            background: #fdf6f0;
            border-radius: 6px;
            box-shadow: 0 15px 45px rgba(0,0,0,0.45), 0 0 30px rgba(255,184,207,0.25);
            transform: rotate(-3deg);
            opacity: 0; translate: 0 10px;
            transition: opacity 1.3s ease 0.9s, translate 1.3s ease 0.9s;
        }
        .final-especial.final-completo .final-foto { opacity: 1; translate: 0 0; }
        .final-foto img {
            display: block;
            width: clamp(190px, 55vw, 300px);
            height: auto;
            border-radius: 2px;
        }

        .beso-boton {
            margin-top: clamp(20px, 4vh, 34px);
            background: rgba(255, 255, 255, 0.08);
            border: 1px solid rgba(255, 194, 217, 0.5);
            color: #ffc2d9; padding: clamp(10px, 2.5vw, 14px) clamp(22px, 6vw, 32px);
            border-radius: 40px; font-family: var(--fuente-texto);
            font-size: clamp(0.85rem, 2.5vw, 1.05rem); letter-spacing: 0.5px;
            cursor: pointer; touch-action: manipulation; position: relative; z-index: 1;
            opacity: 0; transform: translateY(10px);
            transition: opacity 1s ease 1.8s, transform 1s ease 1.8s, background 0.3s ease;
            animation: resplandorBeso 2.5s ease-in-out infinite;
        }
        .final-especial.final-completo .beso-boton { opacity: 1; transform: translateY(0); }
        .beso-boton:active { transform: scale(0.94); }
        .beso-boton.enviado { opacity: 0.55; pointer-events: none; animation: none; }
        @keyframes resplandorBeso {
            0%, 100% { box-shadow: 0 0 12px rgba(255, 184, 207, 0.3); }
            50% { box-shadow: 0 0 26px rgba(255, 184, 207, 0.75); }
        }

        /* ============ BOLETO DE AVIÓN DORADO ============ */
        .btn-ver-boleto {
            margin-top: 18px; background: rgba(255,255,255,0.08); border: 1px solid rgba(240,217,160,0.5);
            color: #f0d9a0; padding: 10px 22px; border-radius: 30px; font-family: var(--fuente-texto);
            font-size: clamp(0.78rem, 2.3vw, 0.95rem); cursor: pointer; touch-action: manipulation;
            letter-spacing: 0.4px; animation: resplandorBoton 2.4s infinite alternate;
        }
        .modal-boleto {
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; height: 100dvh;
            background: rgba(5,8,10,0.92); backdrop-filter: blur(15px); -webkit-backdrop-filter: blur(15px);
            z-index: 10000; display: flex; align-items: center; justify-content: center; padding: 20px; box-sizing: border-box;
            opacity: 1; transition: opacity 0.4s ease, visibility 0s;
        }
        .modal-boleto .btn-cerrar-boleto {
            position: absolute; top: calc(18px + env(safe-area-inset-top, 0px)); right: 18px;
            background: none; border: none; color: white; font-size: 1.4rem; cursor: pointer; touch-action: manipulation; z-index: 3;
        }
        .pase-abordar {
            width: min(92vw, 380px); border-radius: 16px; overflow: hidden; position: relative;
            background: linear-gradient(135deg, #1a1305, #2b2008 40%, #1a1305);
            border: 1px solid rgba(240,217,160,0.5); box-shadow: 0 30px 70px rgba(0,0,0,0.7);
            transform: scale(0.9); opacity: 0; transition: opacity 0.6s ease, transform 0.6s cubic-bezier(0.34,1.2,0.64,1);
            font-family: var(--fuente-texto); color: #f5e3bd;
        }
        .pase-abordar.mostrar { opacity: 1; transform: scale(1); }
        .pase-holograma {
            position: absolute; inset: 0; pointer-events: none; mix-blend-mode: overlay; opacity: 0.55;
            background: linear-gradient(115deg, transparent 20%, rgba(255,255,255,0.55) var(--holo-x, 50%), transparent 65%),
                        linear-gradient(200deg, rgba(180,255,240,0.25), transparent 40%, rgba(255,200,240,0.25));
            transition: background-position 0.15s ease;
        }
        .pase-header { padding: 18px 20px 12px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px dashed rgba(240,217,160,0.4); }
        .pase-aerolinea { font-family: var(--fuente-titulo); font-size: 1.4rem; color: #f0d9a0; }
        .pase-clase { font-size: 0.65rem; letter-spacing: 0.1em; text-transform: uppercase; color: rgba(245,227,189,0.6); }
        .pase-cuerpo { padding: 18px 20px; display: flex; flex-direction: column; gap: 16px; }
        .pase-ruta { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
        .pase-ciudad { text-align: center; flex: 1; }
        .pase-ciudad .codigo { font-family: var(--fuente-titulo); font-size: clamp(1.4rem, 6vw, 1.9rem); color: #fdf6f0; display: block; }
        .pase-ciudad .nombre { font-size: 0.7rem; color: rgba(245,227,189,0.75); }
        .pase-avion { font-size: 1.3rem; color: #f0d9a0; }
        .pase-datos { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 10px; padding-top: 8px; border-top: 1px dashed rgba(240,217,160,0.4); }
        .pase-dato .etiqueta { font-size: 0.62rem; text-transform: uppercase; letter-spacing: 0.06em; color: rgba(245,227,189,0.55); display: block; margin-bottom: 2px; }
        .pase-dato .valor { font-size: 0.92rem; color: #fdf6f0; font-weight: 600; }
        .pase-footer { padding: 14px 20px calc(16px + env(safe-area-inset-bottom, 0px)); border-top: 1px dashed rgba(240,217,160,0.4); font-size: 0.68rem; color: rgba(245,227,189,0.55); text-align: center; font-style: italic; }
        .pista-boleto { margin-top: 16px; color: rgba(255,255,255,0.45); font-size: 0.75rem; text-align: center; }

        /* ============ TICKET DIARIO DE PAREJA ============ */
        .modal-ticket {
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; height: 100dvh;
            background: rgba(5,8,10,0.92); backdrop-filter: blur(15px); -webkit-backdrop-filter: blur(15px);
            z-index: 10000; display: flex; align-items: center; justify-content: center; padding: 20px; box-sizing: border-box;
        }
        .modal-ticket .btn-cerrar-ticket {
            position: absolute; top: calc(18px + env(safe-area-inset-top, 0px)); right: 18px;
            background: none; border: none; color: white; font-size: 1.4rem; cursor: pointer; touch-action: manipulation; z-index: 3;
        }
        .ticket-tarjeta {
            width: min(92vw, 380px); max-height: 85vh; overflow-y: auto; border-radius: 20px; position: relative;
            background: linear-gradient(160deg, #17121a, #241a29 45%, #17121a);
            border: 1px solid rgba(255,194,217,0.35); box-shadow: 0 30px 70px rgba(0,0,0,0.7);
            transform: scale(0.9); opacity: 0; transition: opacity 0.5s ease, transform 0.5s cubic-bezier(0.34,1.2,0.64,1), border-color 0.4s ease, box-shadow 0.4s ease;
            padding: 26px 22px; text-align: center; font-family: var(--fuente-texto); color: #f5f0ff; box-sizing: border-box;
        }
        .ticket-tarjeta.mostrar { opacity: 1; transform: scale(1); }
        .ticket-tarjeta.nivel-bronce { border-color: rgba(217,162,115,0.6); box-shadow: 0 30px 70px rgba(0,0,0,0.7), 0 0 30px rgba(217,162,115,0.15); }
        .ticket-tarjeta.nivel-plata  { border-color: rgba(214,214,224,0.6); box-shadow: 0 30px 70px rgba(0,0,0,0.7), 0 0 30px rgba(214,214,224,0.15); }
        .ticket-tarjeta.nivel-oro    { border-color: rgba(240,217,160,0.7); box-shadow: 0 30px 70px rgba(0,0,0,0.7), 0 0 30px rgba(240,217,160,0.2); }

        .ticket-titulo { font-family: var(--fuente-titulo); font-size: 1.5rem; color: #ffd9ad; margin: 0 0 4px; }
        .ticket-subtitulo { font-size: 0.8rem; color: rgba(255,255,255,0.55); margin: 0 0 18px; }

        .ticket-vista-sobre { display: flex; flex-direction: column; align-items: center; gap: 16px; }
        .ticket-sobre-icono { font-size: 4rem; cursor: pointer; transition: transform 0.2s ease; touch-action: manipulation; line-height: 1; }
        .ticket-sobre-icono:active { transform: scale(0.9); }
        .ticket-sobre-icono.abriendose { animation: sobreAbriendose 0.55s ease forwards; }
        @keyframes sobreAbriendose {
            0% { transform: scale(1) rotate(0deg); }
            30% { transform: scale(1.15) rotate(-6deg); }
            60% { transform: scale(1.25) rotate(6deg); }
            100% { transform: scale(0.2) rotate(0deg); opacity: 0; }
        }
        .btn-abrir-sobre {
            background: rgba(255,255,255,0.08); border: 1px solid rgba(245,217,168,0.5);
            color: #ffd9ad; padding: 10px 24px; border-radius: 30px; font-family: var(--fuente-texto);
            font-size: 0.88rem; cursor: pointer; touch-action: manipulation; animation: resplandorBoton 2.4s infinite alternate;
        }

        .ticket-mensaje-repetido {
            font-size: 0.8rem; color: rgba(255,255,255,0.6); font-style: italic; margin: 0 0 14px; display: none;
        }

        .ticket-vista-revelado { display: none; flex-direction: column; align-items: center; gap: 12px; animation: aparecerSuave 0.5s ease forwards; }
        .ticket-nivel-etiqueta {
            display: inline-block; padding: 5px 16px; border-radius: 20px; font-size: 0.78rem; font-weight: 600; letter-spacing: 0.03em;
        }
        .nivel-bronce .ticket-nivel-etiqueta { background: rgba(217,162,115,0.18); border: 1px solid rgba(217,162,115,0.6); color: #e0a370; }
        .nivel-plata .ticket-nivel-etiqueta  { background: rgba(214,214,224,0.18); border: 1px solid rgba(214,214,224,0.6); color: #e8e8f0; }
        .nivel-oro .ticket-nivel-etiqueta    { background: rgba(240,217,160,0.18); border: 1px solid rgba(240,217,160,0.7); color: #f0d9a0; }

        #ticket-texto { font-size: 1.02rem; line-height: 1.55; color: #fdf6f0; margin: 4px 0 8px; }

        .ticket-botones-whatsapp { display: flex; gap: 10px; width: 100%; margin-top: 4px; }
        .ticket-botones-whatsapp .btn-enviar-whatsapp { flex: 1; }

        /* ============ CAMINO DE SANACIÓN ============ */
        .modal-sanacion {
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; height: 100dvh;
            background: rgba(5,10,9,0.92); backdrop-filter: blur(15px); -webkit-backdrop-filter: blur(15px);
            z-index: 10000; display: flex; align-items: center; justify-content: center; padding: 20px;
            box-sizing: border-box; touch-action: manipulation;
        }
        .btn-cerrar-sanacion {
            position: absolute; top: calc(18px + env(safe-area-inset-top, 0px)); right: 18px;
            background: none; border: none; color: white; font-size: 1.4rem; cursor: pointer; touch-action: manipulation; z-index: 3;
        }
        .sanacion-tarjeta {
            width: min(92vw, 400px); max-height: 88vh; overflow-y: auto; -webkit-overflow-scrolling: touch;
            border-radius: 22px; position: relative; touch-action: manipulation;
            background: linear-gradient(160deg, #0f1a15, #17251d 45%, #0f1a15);
            border: 1px solid rgba(180,255,210,0.25); box-shadow: 0 30px 70px rgba(0,0,0,0.7);
            padding: 26px 22px; text-align: center; font-family: var(--fuente-texto); color: #f2f8f4; box-sizing: border-box;
        }
        .sanacion-titulo { font-family: var(--fuente-titulo); font-size: 1.5rem; color: #bcecc9; margin: 0 0 4px; }
        .sanacion-subtitulo { font-size: 0.8rem; color: rgba(255,255,255,0.55); margin: 0 0 16px; }

        /* --- Corazón de cristal --- */
        .corazon-cristal-contenedor {
            width: min(170px, 48vw); margin: 0 auto 6px;
            --sanacion-luz-abajo: #a993e6; --sanacion-luz-arriba: #c7b3fa;
        }
        .svg-corazon-cristal { width: 100%; height: auto; overflow: visible; }
        .corazon-cristal-latido { transform-origin: 100px 100px; animation: latidoCristal 2.6s ease-in-out infinite; }
        @keyframes latidoCristal { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.035); } }
        .corazon-cristal-contorno {
            fill: rgba(255,255,255,0.03); stroke: rgba(255,255,255,0.55); stroke-width: 1.5;
        }
        .relleno-luz-sanacion {
            transform-origin: 100px 183px;
            transform: scaleY(var(--nivel-luz, 0));
            transition: transform 1.6s cubic-bezier(0.34, 1.05, 0.64, 1), fill 1s ease;
            opacity: 0.92;
        }
        .icono-vida-sanacion { font-size: 26px; opacity: 0.92; animation: latidoCristal 2.6s ease-in-out infinite; }
        .sanacion-etapa-texto { font-family: var(--fuente-titulo); font-size: 1rem; color: #ffd9ad; margin-top: 6px; }

        /* El color de la luz (--sanacion-luz-abajo / --sanacion-luz-arriba) se fija por JS
           según la etapa, directo en el style del contenedor: más fría al empezar, más cálida
           y dorada cerca de la meta. */

        .sanacion-mensaje-card { padding: 12px 14px; margin: 10px 0 16px; }
        #sanacion-mensaje-texto { font-family: var(--fuente-texto); font-size: 0.9rem; line-height: 1.55; color: #f5f0ff; margin: 0; }

        .sanacion-calendario { display: flex; flex-direction: column; gap: 14px; margin-bottom: 16px; }
        .sanacion-parada, .sanacion-meta {
            background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
            border-radius: 14px; padding: 12px 14px;
        }
        .sanacion-parada-etiqueta { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.05em; color: rgba(255,255,255,0.55); margin-bottom: 4px; }
        .sanacion-parada-fecha { font-family: var(--fuente-titulo); font-size: 1.15rem; color: #ffd9ad; }
        .sanacion-parada-cuenta { font-size: 0.78rem; color: rgba(255,255,255,0.65); margin-top: 2px; }

        .btn-editar-fecha {
            margin-top: 10px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15);
            border-radius: 20px; padding: 5px 14px; color: #f2f8f4; font-size: 0.78rem;
            font-family: var(--fuente-texto); cursor: pointer; touch-action: manipulation;
        }
        .sanacion-edicion-fecha {
            display: flex; gap: 8px; margin-top: 10px; justify-content: center; flex-wrap: wrap;
        }
        .sanacion-edicion-fecha input[type="date"] {
            background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.2);
            border-radius: 8px; padding: 6px 8px; color: white; font-family: var(--fuente-texto);
            font-size: 0.85rem; touch-action: manipulation;
        }
        .sanacion-edicion-fecha button {
            background: #bcecc9; border: none; border-radius: 8px; padding: 6px 12px;
            color: #0f1a15; font-weight: bold; font-size: 0.8rem; cursor: pointer; touch-action: manipulation;
        }
        .sanacion-edicion-nota { font-size: 0.7rem; color: rgba(255,255,255,0.4); margin: 8px 0 0; font-style: italic; }

        .sanacion-frase-motivadora {
            padding: 14px 16px; font-family: var(--fuente-titulo); font-style: italic;
            font-size: 1rem; color: #ffd9ad; line-height: 1.4;
        }

        .sanacion-vista-victoria { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 14px 6px; }
        .sanacion-victoria-icono { font-size: 3rem; animation: latidoCristal 2s ease-in-out infinite; }
        .sanacion-victoria-titulo { font-family: var(--fuente-titulo); font-size: 1.3rem; color: #ffd9ad; margin: 0; }
        .sanacion-victoria-texto { font-size: 0.88rem; line-height: 1.6; color: #f5f0ff; margin: 0; }

        /* ============ CIELO DE NUESTRO PRIMER DÍA ============ */
        .btn-ver-cielo {
            margin-top: 15px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2);
            color: white; padding: 10px 22px; border-radius: 30px; font-family: var(--fuente-texto);
            font-size: clamp(0.8rem, 2.3vw, 0.95rem); cursor: pointer; touch-action: manipulation;
        }
        .modal-cielo {
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; height: 100dvh;
            background: #04060c; z-index: 10000; display: flex; flex-direction: column; align-items: center; justify-content: center;
            opacity: 1; transition: opacity 0.4s ease, visibility 0s;
        }
        #canvas-constelacion { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }
        .modal-cielo .btn-cerrar-cielo {
            position: absolute; top: calc(18px + env(safe-area-inset-top, 0px)); right: 18px;
            background: none; border: none; color: white; font-size: 1.4rem; cursor: pointer; touch-action: manipulation; z-index: 3;
        }
        .texto-cielo {
            position: relative; z-index: 2; text-align: center; padding: 0 24px;
            font-family: var(--fuente-titulo); color: #fdf6f0; font-size: clamp(1.2rem, 5vw, 1.8rem);
            text-shadow: 0 0 20px rgba(120,150,255,0.6); max-width: 600px; line-height: 1.4;
            opacity: 0; animation: aparecerSuave 1.5s ease 0.6s forwards;
        }
        .subtexto-cielo {
            position: relative; z-index: 2; font-family: var(--fuente-texto); color: rgba(255,255,255,0.55);
            font-size: 0.8rem; margin-top: 10px; opacity: 0; animation: aparecerSuave 1.5s ease 1.2s forwards;
        }

        .postdata-final {
            margin-top: clamp(14px, 3vh, 22px); font-family: var(--fuente-titulo);
            font-size: clamp(1.1rem, 4vw, 1.7rem); color: #ffe6ef; position: relative; z-index: 1;
            opacity: 0; transform: translateY(8px);
            transition: opacity 1s ease, transform 1s ease;
        }
        .postdata-final.mostrar { opacity: 1; transform: translateY(0); }

        /* --- Lluvia de besos al final --- */
        .lluvia-besos { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; height: 100dvh; overflow: hidden; pointer-events: none; z-index: 15000; }
        .beso-cayendo {
            position: absolute; top: -60px; will-change: transform, opacity;
            animation-name: caerBeso; animation-timing-function: ease-in; animation-fill-mode: forwards;
        }
        @keyframes caerBeso {
            0% { transform: translateY(0) rotate(0deg); opacity: 0; }
            8% { opacity: 1; }
            100% { transform: translateY(115vh) rotate(var(--giro, 60deg)); opacity: 0.9; }
        }

        /* --- Lluvia de "Te amo" en distintos idiomas --- */
        .lluvia-teamo { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; height: 100dvh; overflow: hidden; pointer-events: none; z-index: 15000; }
        .teamo-cayendo {
            position: absolute; top: -60px; will-change: transform, opacity;
            font-family: var(--fuente-titulo); color: #ffc2d9; text-shadow: 0 0 12px rgba(255,105,135,0.8);
            white-space: nowrap; animation-name: caerTeAmo; animation-timing-function: ease-in; animation-fill-mode: forwards;
        }
        @keyframes caerTeAmo {
            0% { transform: translateY(0) rotate(0deg); opacity: 0; }
            8% { opacity: 1; }
            100% { transform: translateY(115vh) rotate(var(--giro, 20deg)); opacity: 0.85; }
        }

        /* --- Lluvia de abrazos --- */
        .lluvia-abrazos { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; height: 100dvh; overflow: hidden; pointer-events: none; z-index: 15000; }
        .abrazo-cayendo {
            position: absolute; top: -60px; will-change: transform, opacity;
            animation-name: caerAbrazo; animation-timing-function: ease-in; animation-fill-mode: forwards;
        }
        @keyframes caerAbrazo {
            0% { transform: translateY(0) rotate(0deg); opacity: 0; }
            8% { opacity: 1; }
            100% { transform: translateY(115vh) rotate(var(--giro, 60deg)); opacity: 0.9; }
        }

        /* --- Lluvia de dulces (chocolate / helado / dulces) --- */
        .lluvia-dulces { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; height: 100dvh; overflow: hidden; pointer-events: none; z-index: 15000; }
        .dulce-cayendo {
            position: absolute; top: -60px; will-change: transform, opacity;
            animation-name: caerBeso; animation-timing-function: ease-in; animation-fill-mode: forwards;
        }

        /* ==================== PING PONG DE PREGUNTAS ====================
           Clases mínimas para que el motor de reflexión (reusado de los
           juegos) se vea bien acá. Todo escopado bajo #contenido-preguntasindex
           para no pisar ningún estilo existente de la página (en particular,
           ".panel" ya se usa para los paneles de madera de la puerta). */
        #contenido-preguntasindex .panel {
            background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.12);
            border-radius: 16px; padding: 16px; margin-bottom: 12px; width: auto; height: auto; box-shadow: none;
        }
        #contenido-preguntasindex .texto-centro { text-align: center; }
        #contenido-preguntasindex .texto-tenue { opacity: 0.65; font-size: 0.85rem; }
        #contenido-preguntasindex .btn-principal, #contenido-preguntasindex .btn-secundario {
            font-family: var(--fuente-texto); border-radius: 14px; padding: 12px 18px; font-size: 0.92rem;
            cursor: pointer; touch-action: manipulation; border: none; width: 100%; box-sizing: border-box;
        }
        #contenido-preguntasindex .btn-principal {
            background: linear-gradient(135deg, #ff8fa3, #ffb8cf); color: #2b1220; font-weight: 600;
            box-shadow: 0 8px 20px rgba(255, 143, 163, 0.35);
        }
        #contenido-preguntasindex .btn-secundario {
            background: rgba(255,255,255,0.08); color: #fdf6f0; border: 1px solid rgba(255,255,255,0.18);
        }
        #contenido-preguntasindex .btn-fila { display: flex; gap: 8px; }
        #contenido-preguntasindex .btn-fila .btn-secundario, #contenido-preguntasindex .btn-fila .btn-principal { flex: 1; }
        #contenido-preguntasindex .badge-estado { font-size: 0.68rem; padding: 3px 9px; border-radius: 10px; }
        #contenido-preguntasindex .badge-activa { background: rgba(255,184,207,0.18); border: 1px solid rgba(255,184,207,0.5); }
        #contenido-preguntasindex .badge-terminada { background: rgba(180,255,200,0.15); border: 1px solid rgba(180,255,200,0.4); }
        #contenido-preguntasindex .lista-escrituras { display: flex; flex-direction: column; gap: 8px; }
        #contenido-preguntasindex .item-escritura {
            background: rgba(255,255,255,0.04); border-radius: 12px; padding: 10px 12px; cursor: pointer;
            display: flex; justify-content: space-between; align-items: center; gap: 8px;
        }
        #contenido-preguntasindex .titulo-escritura { font-size: 0.85rem; }
        #contenido-preguntasindex .detalle-escritura { font-size: 0.7rem; opacity: 0.6; margin-top: 2px; }
        #contenido-preguntasindex .flip-carta {
            background: linear-gradient(135deg, rgba(255,143,163,0.12), rgba(201,182,255,0.12));
            border: 1px solid rgba(255,255,255,0.15); animation: aparecerSuave 0.4s ease;
        }
        #contenido-preguntasindex .reflexion-reveal { animation: aparecerSuave 0.5s ease; }
        #contenido-preguntasindex .logro-animado { animation: reboteLogroPreguntas 0.5s ease; }
        #contenido-preguntasindex .destello { animation: destelloPreguntas 1.6s ease-in-out infinite; }
        @keyframes reboteLogroPreguntas { 0% { transform: scale(0.9); opacity: 0; } 60% { transform: scale(1.03); opacity: 1; } 100% { transform: scale(1); } }
        @keyframes destelloPreguntas { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }

    </style>
</head>

<body>

    <div id="vineta-calida"></div>
    <canvas id="canvas-particulas"></canvas>

    <!-- Estrellas fugaces de fondo: cruzan la pantalla cada tanto, puramente decorativas -->
    <div class="capa-estrellas-fugaces" aria-hidden="true">
        <span class="estrella-fugaz ef-1"></span>
        <span class="estrella-fugaz ef-2"></span>
        <span class="estrella-fugaz ef-3"></span>
        <span class="estrella-fugaz ef-4"></span>
    </div>

    <!-- Corazoncitos que ascienden despacio de fondo, en toda la app -->
    <div class="capa-corazones-ambiente" aria-hidden="true">
        <span class="corazon-ambiente ca-1">💗</span>
        <span class="corazon-ambiente ca-2">💫</span>
        <span class="corazon-ambiente ca-3">💖</span>
        <span class="corazon-ambiente ca-4">✨</span>
        <span class="corazon-ambiente ca-5">💕</span>
    </div>

    <!-- Frase de amor que aparece cada tanto, flotando, sin molestar los botones -->
    <div id="frase-flotante-amor" class="frase-flotante-amor" aria-hidden="true"></div>

    <div id="contenedor" class="contenedor-scroll">
        <div id="pista-pantallas" class="pista-pantallas">
        <section class="pantalla pantalla-puerta">
            <div class="marco-exterior" id="marco-exterior">
                <div id="luz-interior" class="interior-casa" onclick="revelarSecreto(event)">
                    <img class="foto-puerta" src="https://i.postimg.cc/QtLY0Cnx/78df8d38-6373-43d9-9323-70ba109c8c91.png" alt="Carito" loading="lazy" decoding="async">
                </div>
                <div id="puerta-id" class="puerta" onclick="interaccionPuerta(event)">
                    <div class="panel"></div>
                    <div class="pomo"></div>
                    <div class="panel panel-largo"></div>
                </div>
                <div class="pista-tocar">👆 Tocá la puerta</div>
            </div>

            <div id="secreto-puerta" class="secreto-puerta"></div>
            
            <div id="toc1" class="texto-toc">¡TOC!</div>
            <div id="toc2" class="texto-toc">...¡TOC!</div>

            <div class="interfaz">
                <div id="pregunta1" class="texto-dinamico">¿Hay alguien ahí?</div>
                <div id="pregunta2" class="texto-dinamico">¿Está Carito, el amor de mi vida?</div>
                
                <div id="botones" class="contenedor-botones">
                    <button class="btn btn-si" onclick="responder('SI', event)">Sí</button>
                    <button class="btn btn-no" onclick="responder('NO', event)">No</button>
                </div>

                <div id="mensaje-final" class="mensaje-final"></div>
                <div id="scroll-aviso" class="indicador-scroll">✨ ¡Abre la puerta! Deslizá 👉</div>
            </div>
        </section>
        </div>
    </div>

    <!-- Reproductor de Audio Flotante: burbuja colapsable + panel, no compite con el botón mágico -->
    <div id="reproductor-flotante" class="reproductor-flotante">
        <div class="panel-reproductor" id="panel-reproductor">
            <div class="info-cancion" id="info-cancion">🎵 Cargando...</div>
            <div class="barra-progreso-container">
                <span class="tiempo" id="tiempo-actual">0:00</span>
                <input type="range" id="barra-progreso" min="0" max="100" value="0" step="0.1">
                <span class="tiempo" id="tiempo-total">0:00</span>
            </div>
            <div class="controles-audio">
                <button id="btn-random" class="btn-toggle" onclick="toggleRandom()" title="Aleatorio" aria-label="Reproducción aleatoria">🔀</button>
                <button onclick="cambiarCancion(-1)" title="Anterior" aria-label="Canción anterior">⏮</button>
                <button id="btn-play-pause" onclick="togglePlayPause()" title="Pausar/Reproducir" aria-label="Pausar o reproducir">⏸</button>
                <button onclick="cambiarCancion(1)" title="Siguiente" aria-label="Canción siguiente">⏭</button>
                <button id="btn-repeat" class="btn-toggle" onclick="toggleRepeat()" title="Repetir" aria-label="Repetir canción">🔁</button>
            </div>
            <div class="control-volumen">
                <span>🔉</span>
                <input type="range" id="volumen" min="0" max="1" step="0.05" value="0.8" onchange="cambiarVolumen(this.value)" oninput="cambiarVolumen(this.value)">
                <span>🔊</span>
            </div>
        </div>
        <div class="burbuja-reproductor" id="burbuja-reproductor" onclick="toggleReproductor(event)" title="Nuestra música" role="button" aria-label="Abrir reproductor de música">🎵</div>
    </div>
    <!-- Player de YouTube embebido: queda oculto visualmente pero vive en la misma página,
         no abre la app ni una pestaña nueva. Reproduce nuestra playlist de YouTube Music. -->
    <div id="yt-audio-player" style="position:fixed; bottom:0; right:0; width:1px; height:1px; opacity:0.01; pointer-events:none; overflow:hidden; z-index:-1;" aria-hidden="true"></div>

    <!-- Botón para volver a la constelación desde el libro o cualquier panel -->
    <div id="menu-principal" class="menu-principal">
        <div class="burbuja-menu" id="burbuja-menu" onclick="volverAlUniverso(event)" title="Volver al universo" role="button" aria-label="Volver a nuestro universo">🌌</div>
    </div>

    <!-- UNIVERSO-CORAZÓN: aparece al abrir la puerta. Cada punto es una elección;
         nada se reproduce ni se abre solo, incluyendo el libro. -->
    <div id="universo-corazon" class="universo-corazon">
        <div class="estrellas-titilantes" aria-hidden="true"></div>
        <div class="universo-titulo-principal">Nuestro universo</div>
        <div class="universo-subtitulo-principal">Cada estrella es un pedacito nuestro. Elegí cuál explorar 💫</div>
        <div class="lienzo-corazon">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none">
                <defs>
                    <linearGradient id="gradienteCorazon" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="#ffb3c6" />
                        <stop offset="50%" stop-color="#c9b6ff" />
                        <stop offset="100%" stop-color="#a8edea" />
                    </linearGradient>
                </defs>
                <path class="trazo-corazon" d="M 50.0,25.0 L 50.02,24.58 L 50.19,23.35 L 50.62,21.41 L 51.43,18.89 L 52.72,15.97 L 54.54,12.87 L 56.92,9.8 L 59.85,7.0 L 63.28,4.67 L 67.14,2.98 L 71.32,2.06 L 75.67,2.01 L 80.05,2.85 L 84.3,4.58 L 88.23,7.14 L 91.71,10.43 L 94.58,14.33 L 96.72,18.71 L 98.04,23.42 L 98.48,28.33 L 98.04,33.33 L 96.72,38.32 L 94.58,43.22 L 91.71,48.0 L 88.23,52.62 L 84.3,57.1 L 80.05,61.43 L 75.67,65.63 L 71.32,69.72 L 67.14,73.69 L 63.28,77.54 L 59.85,81.24 L 56.92,84.74 L 54.54,88.0 L 52.72,90.94 L 51.43,93.47 L 50.62,95.54 L 50.19,97.07 L 50.02,98.02 L 50.0,98.33 L 49.98,98.02 L 49.81,97.07 L 49.38,95.54 L 48.57,93.47 L 47.28,90.94 L 45.46,88.0 L 43.08,84.74 L 40.15,81.24 L 36.72,77.54 L 32.86,73.69 L 28.68,69.72 L 24.33,65.63 L 19.95,61.43 L 15.7,57.1 L 11.77,52.62 L 8.29,48.0 L 5.42,43.22 L 3.28,38.32 L 1.96,33.33 L 1.52,28.33 L 1.96,23.42 L 3.28,18.71 L 5.42,14.33 L 8.29,10.43 L 11.77,7.14 L 15.7,4.58 L 19.95,2.85 L 24.33,2.01 L 28.68,2.06 L 32.86,2.98 L 36.72,4.67 L 40.15,7.0 L 43.08,9.8 L 45.46,12.87 L 47.28,15.97 L 48.57,18.89 L 49.38,21.41 L 49.81,23.35 L 49.98,24.58 L 50.0,25.0 Z" />
                <!-- Brillo viajero: recorre la línea del corazón como una constelación que se enciende de a ratos -->
                <path class="trazo-corazon-brillo" pathLength="100" d="M 50.0,25.0 L 50.02,24.58 L 50.19,23.35 L 50.62,21.41 L 51.43,18.89 L 52.72,15.97 L 54.54,12.87 L 56.92,9.8 L 59.85,7.0 L 63.28,4.67 L 67.14,2.98 L 71.32,2.06 L 75.67,2.01 L 80.05,2.85 L 84.3,4.58 L 88.23,7.14 L 91.71,10.43 L 94.58,14.33 L 96.72,18.71 L 98.04,23.42 L 98.48,28.33 L 98.04,33.33 L 96.72,38.32 L 94.58,43.22 L 91.71,48.0 L 88.23,52.62 L 84.3,57.1 L 80.05,61.43 L 75.67,65.63 L 71.32,69.72 L 67.14,73.69 L 63.28,77.54 L 59.85,81.24 L 56.92,84.74 L 54.54,88.0 L 52.72,90.94 L 51.43,93.47 L 50.62,95.54 L 50.19,97.07 L 50.02,98.02 L 50.0,98.33 L 49.98,98.02 L 49.81,97.07 L 49.38,95.54 L 48.57,93.47 L 47.28,90.94 L 45.46,88.0 L 43.08,84.74 L 40.15,81.24 L 36.72,77.54 L 32.86,73.69 L 28.68,69.72 L 24.33,65.63 L 19.95,61.43 L 15.7,57.1 L 11.77,52.62 L 8.29,48.0 L 5.42,43.22 L 3.28,38.32 L 1.96,33.33 L 1.52,28.33 L 1.96,23.42 L 3.28,18.71 L 5.42,14.33 L 8.29,10.43 L 11.77,7.14 L 15.7,4.58 L 19.95,2.85 L 24.33,2.01 L 28.68,2.06 L 32.86,2.98 L 36.72,4.67 L 40.15,7.0 L 43.08,9.8 L 45.46,12.87 L 47.28,15.97 L 48.57,18.89 L 49.38,21.41 L 49.81,23.35 L 49.98,24.58 L 50.0,25.0 Z" />
            </svg>
            <button class="punto-corazon planeta-carta" style="left:84.3%;top:4.6%" onclick="entrarALaCarta(event)"><span class="planeta-icono">📘</span><span class="planeta-nombre">El Libro</span></button>
            <button class="punto-corazon planeta-gratitud" style="left:15.7%;top:4.6%" onclick="ejecutarOpcionMenu(event, 'gratitud')"><span class="planeta-icono">💛</span><span class="planeta-nombre">Gratitud</span></button>
            <button class="punto-corazon planeta-musica" style="left:91.7%;top:48.0%" onclick="ejecutarOpcionMenu(event, 'musica')"><span class="planeta-icono">🎵</span><span class="planeta-nombre">Música</span></button>
            <button class="punto-corazon planeta-preguntas" style="left:8.3%;top:48.0%" onclick="ejecutarOpcionMenu(event, 'preguntas')"><span class="planeta-icono">❓</span><span class="planeta-nombre">Preguntas</span></button>
            <button class="punto-corazon planeta-muro" style="left:67.1%;top:73.7%" onclick="ejecutarOpcionMenu(event, 'muro')"><span class="planeta-icono">📜</span><span class="planeta-nombre">Muro</span></button>
            <button class="punto-corazon planeta-deseos" style="left:32.9%;top:73.7%" onclick="ejecutarOpcionMenu(event, 'deseos')"><span class="planeta-icono">🌠</span><span class="planeta-nombre">Deseos</span></button>
            <button class="punto-corazon planeta-reloj" style="left:50%;top:98.3%" onclick="ejecutarOpcionMenu(event, 'reloj')"><span class="planeta-icono">⏰</span><span class="planeta-nombre">Cuenta&nbsp;regresiva</span></button>
            <button class="punto-corazon planeta-ticket" style="left:50%;top:16%" onclick="ejecutarOpcionMenu(event, 'ticket')"><span class="planeta-icono">🎟️</span><span class="planeta-nombre">Ticket&nbsp;Diario</span></button>
            <button class="punto-corazon planeta-sanacion" style="left:1.96%;top:23.42%" onclick="ejecutarOpcionMenu(event, 'sanacion')"><span class="planeta-icono">🌿</span><span class="planeta-nombre">Sanación</span></button>
            <button class="punto-corazon planeta-juegos" style="left:98.04%;top:23.42%" onclick="location.href='juegos.html'"><span class="planeta-icono">🎮</span><span class="planeta-nombre">Juegos</span></button>
        </div>
    </div>

    <!-- Botón "Sorpresa" como widget fijo, abajo a la izquierda, en paralelo al chat (abajo a la derecha) -->
    <div id="sorpresa-flotante" class="sorpresa-flotante">
        <button class="nucleo-corazon" onclick="lanzarSorpresaAleatoria(event)" title="Sorpresa" aria-label="Mandar una sorpresa al azar">🎁</button>
    </div>

    <button id="btn-azar" class="btn-azar" onclick="viajarAlAzar()">
        <span>✨ Mensaje Mágico</span>
    </button>

    <!-- Acceso rápido de vuelta al Índice (tabla de contenidos), visible desde cualquier página del libro -->
    <button id="btn-indice-rapido" class="btn-indice-rapido" onclick="irAId('pantalla-indice')" title="Volver al índice" aria-label="Volver al índice">🔖</button>

    <!-- Reproducir / pausar el avance automático de los mensajes -->
    <button id="btn-auto-avance" class="btn-indice-rapido btn-auto-avance" onclick="toggleAutoAvance(event)" title="Reproducir avance automático" aria-label="Reproducir avance automático">▶️</button>

    <!-- Navegación garantizada entre pantallas: funciona siempre, aunque el swipe nativo falle en algún celular -->
    <div class="nav-pantallas" id="nav-pantallas">
        <button class="nav-flecha nav-anterior" onclick="pantallaAnterior()" title="Mensaje anterior" aria-label="Ir al mensaje anterior">‹</button>
        <button class="nav-flecha nav-siguiente" onclick="pantallaSiguiente()" title="Mensaje siguiente" aria-label="Ir al mensaje siguiente">›</button>
    </div>

    <!-- Burbuja flotante para entrar al Muro desde cualquier pantalla -->
    <div id="muro-flotante" class="muro-flotante">
        <div class="burbuja-muro" onclick="abrirMuro(event)" title="Nuestro Muro en el Tiempo" role="button" aria-label="Abrir el Muro">📜</div>
    </div>


    <!-- ====== RINCÓN DE LA GRATITUD (Hoy te amo por...) ====== -->
    <div id="gratitud-flotante" class="gratitud-flotante">
        <div class="panel-gratitud" id="panel-gratitud">
            <div class="header-gratitud">
                <span class="titulo-gratitud">Hoy te amo por... 💛</span>
                <button class="btn-cerrar-gratitud" onclick="toggleGratitud(event)">✕</button>
            </div>
            <div class="lista-gratitud" id="lista-gratitud"></div>
            <div class="input-gratitud-area">
                <input type="text" id="input-gratitud" placeholder="Hoy te amo por..." maxlength="140" autocomplete="off" onkeypress="verificarEnterGratitud(event)">
                <button class="btn-enviar-gratitud" onclick="guardarGratitud()">➤</button>
            </div>
        </div>
        <div class="burbuja-gratitud" id="burbuja-gratitud" onclick="toggleGratitud(event)" title="Rincón de la gratitud" role="button" aria-label="Abrir el rincón de la gratitud">💛</div>
    </div>

    <!-- ====== LISTA DE DESEOS JUNTOS (Bucket List) ====== -->
    <div id="deseos-flotante" class="deseos-flotante">
        <div class="panel-deseos" id="panel-deseos">
            <div class="header-deseos">
                <span class="titulo-deseos">Nuestra lista de deseos 🌠</span>
                <button class="btn-cerrar-deseos" onclick="toggleDeseos(event)">✕</button>
            </div>
            <div class="tabs-deseos">
                <div class="tab-deseo activo" id="tab-deseo-pendientes" onclick="cambiarTabDeseos('pendientes')">🤍 Para soñar</div>
                <div class="tab-deseo" id="tab-deseo-cumplidos" onclick="cambiarTabDeseos('cumplidos')">💗 Ya los vivimos</div>
            </div>
            <div class="lista-deseos" id="lista-deseos"></div>
            <div class="input-deseos-area">
                <input type="text" id="input-deseo" placeholder="Un sueño para cumplir juntos..." maxlength="140" autocomplete="off" onkeypress="verificarEnterDeseo(event)">
                <button class="btn-enviar-deseo" onclick="agregarDeseo()">➤</button>
            </div>
        </div>
        <div class="burbuja-deseos" id="burbuja-deseos" onclick="toggleDeseos(event)" title="Lista de deseos juntos" role="button" aria-label="Abrir la lista de deseos juntos">🌠</div>
    </div>

    <!-- ====== PREGUNTAS PARA NOSOTROS (Ping Pong) ====== -->
    <div id="preguntas-flotante" class="preguntas-flotante">
        <div class="panel-preguntas" id="panel-preguntas">
            <div class="header-preguntas">
                <span class="titulo-preguntas">Preguntas para nosotros ❓</span>
                <button class="btn-cerrar-preguntas" onclick="togglePreguntas(event)">✕</button>
            </div>
            <div class="cuerpo-preguntas">
                <div id="contenido-preguntasindex"></div>
            </div>
        </div>
        <div class="burbuja-preguntas" id="burbuja-preguntas" onclick="togglePreguntas(event)" title="Preguntas para nosotros" role="button" aria-label="Abrir preguntas para la pareja">❓</div>
    </div>

    <!-- ====== RELOJ / CUENTA REGRESIVA FLOTANTE ====== -->
    <div id="reloj-flotante" class="reloj-flotante">
        <div class="panel-reloj" id="panel-reloj">
            <div class="header-reloj">
                <button class="btn-cerrar-reloj" onclick="toggleReloj(event)">✕</button>
            </div>
            <div class="fr-subtitulo" id="fr-subtitulo">Cuenta regresiva</div>
            <div class="fr-titulo" id="fr-titulo">La primera vez que nos vamos a ver</div>
            <div class="fr-numeros">
                <div class="fr-bloque"><span class="fr-valor" id="fr-dias">00</span><span class="fr-etiqueta">días</span></div>
                <div class="fr-bloque"><span class="fr-valor" id="fr-horas">00</span><span class="fr-etiqueta">hs</span></div>
                <div class="fr-bloque"><span class="fr-valor" id="fr-min">00</span><span class="fr-etiqueta">min</span></div>
                <div class="fr-bloque"><span class="fr-valor" id="fr-seg">00</span><span class="fr-etiqueta">seg</span></div>
            </div>
            <div class="fr-fecha" id="fr-fecha">25 de agosto de 2026, 12 hs</div>
            <a class="btn-ver-boleto" href="https://drive.google.com/uc?export=download&id=1cq1pwYt6iyr96WBC2oJldx05mWZojnXR" target="_blank" rel="noopener" style="text-decoration: none; display: inline-block;">🎫 Ver mi boleto real</a>
        </div>
        <div class="burbuja-reloj" id="burbuja-reloj" onclick="toggleReloj(event)" title="Cuenta regresiva" role="button" aria-label="Ver cuenta regresiva">⏰</div>
    </div>

    <!-- ====== MODAL: BOLETO DE AVIÓN DORADO ====== -->
    <div id="modal-boleto" class="modal-boleto oculto">
        <button class="btn-cerrar-boleto" onclick="cerrarBoleto()">✕</button>
        <div>
            <div class="pase-abordar" id="pase-abordar">
                <div class="pase-holograma" id="pase-holograma"></div>
                <div class="pase-header">
                    <span class="pase-aerolinea">Nico & Carito ✈️</span>
                    <span class="pase-clase">Clase Amor Eterno</span>
                </div>
                <div class="pase-cuerpo">
                    <div class="pase-ruta">
                        <div class="pase-ciudad"><span class="codigo">DIST</span><span class="nombre">La distancia</span></div>
                        <div class="pase-avion">✈️</div>
                        <div class="pase-ciudad"><span class="codigo">ABZO</span><span class="nombre">Nuestro abrazo</span></div>
                    </div>
                    <div class="pase-datos">
                        <div class="pase-dato"><span class="etiqueta">Pasajero</span><span class="valor">Nico & Carito</span></div>
                        <div class="pase-dato"><span class="etiqueta">Vuelo</span><span class="valor">6 AÑOS</span></div>
                        <div class="pase-dato"><span class="etiqueta">Fecha</span><span class="valor">25 AGO 2026</span></div>
                        <div class="pase-dato"><span class="etiqueta">Hora</span><span class="valor">12:00 hs</span></div>
                        <div class="pase-dato"><span class="etiqueta">Puerta</span><span class="valor">CORAZÓN</span></div>
                        <div class="pase-dato"><span class="etiqueta">Asiento</span><span class="valor">JUNTOS</span></div>
                    </div>
                </div>
                <div class="pase-footer">Embarque prioritario: nos esperamos toda la vida por esto.</div>
            </div>
            <div class="pista-boleto">Mové el celular o el mouse para ver el brillo ✨</div>
        </div>
    </div>

    <!-- ====== MODAL: TICKET DIARIO DE PAREJA ====== -->
    <div id="modal-ticket" class="modal-ticket oculto">
        <button class="btn-cerrar-ticket" onclick="cerrarTicket()">✕</button>
        <div class="ticket-tarjeta" id="ticket-tarjeta">
            <div class="ticket-titulo">Ticket Diario 🎟️</div>
            <div class="ticket-subtitulo">Un vale nuevo cada día, para pedirnos cosas lindas</div>

            <p class="ticket-mensaje-repetido" id="ticket-mensaje-repetido">¡Ya raspaste tu ticket de hoy! Volvé mañana para descubrir el siguiente.</p>

            <!-- Sobre cerrado: se muestra cuando todavía no se abrió el ticket del día -->
            <div class="ticket-vista-sobre" id="ticket-vista-sobre">
                <div class="ticket-sobre-icono" id="ticket-sobre-icono" onclick="abrirSobreDelDia()">✉️</div>
                <button class="btn-abrir-sobre" onclick="abrirSobreDelDia()">Abrir mi ticket de hoy</button>
            </div>

            <!-- Ticket revelado: nivel + frase + envío directo -->
            <div class="ticket-vista-revelado" id="ticket-vista-revelado">
                <span class="ticket-nivel-etiqueta" id="ticket-nivel-etiqueta"></span>
                <p id="ticket-texto"></p>
                <div class="ticket-botones-whatsapp">
                    <button class="btn-enviar-whatsapp nico" onclick="enviarTicketWhatsApp('nico')">Exigir a Nico 💙</button>
                    <button class="btn-enviar-whatsapp carito" onclick="enviarTicketWhatsApp('carito')">Exigir a Carito 💖</button>
                </div>
            </div>
        </div>
    </div>

    <!-- ====== MODAL: CAMINO DE SANACIÓN ====== -->
    <div id="modal-sanacion" class="modal-sanacion oculto">
        <button class="btn-cerrar-sanacion" onclick="cerrarSanacion()">✕</button>
        <div class="sanacion-tarjeta" id="sanacion-tarjeta">

            <!-- Vista normal: corazón de cristal + calendario + mensaje del día -->
            <div id="sanacion-vista-normal">
                <div class="sanacion-titulo">Camino de Sanación 🌿</div>
                <div class="sanacion-subtitulo">Un pasito a la vez. Estoy con vos en cada uno.</div>

                <div class="corazon-cristal-contenedor">
                    <svg id="svg-corazon-cristal" class="svg-corazon-cristal" viewBox="0 0 200 200" data-etapa="1" aria-hidden="true">
                        <defs>
                            <clipPath id="clip-corazon-cristal">
                                <path d="M100,175 C40,130 10,90 10,58 C10,28 34,8 62,8 C80,8 94,18 100,34 C106,18 120,8 138,8 C166,8 190,28 190,58 C190,90 160,130 100,175 Z" />
                            </clipPath>
                            <linearGradient id="luz-sanacion" x1="0" y1="1" x2="0" y2="0">
                                <stop offset="0%" stop-color="var(--sanacion-luz-abajo)" />
                                <stop offset="100%" stop-color="var(--sanacion-luz-arriba)" />
                            </linearGradient>
                            <filter id="glow-cristal" x="-50%" y="-50%" width="200%" height="200%">
                                <feGaussianBlur stdDeviation="6" result="blur" />
                                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                            </filter>
                        </defs>
                        <g class="corazon-cristal-latido">
                            <path class="corazon-cristal-contorno" d="M100,175 C40,130 10,90 10,58 C10,28 34,8 62,8 C80,8 94,18 100,34 C106,18 120,8 138,8 C166,8 190,28 190,58 C190,90 160,130 100,175 Z" />
                            <g clip-path="url(#clip-corazon-cristal)">
                                <rect id="relleno-luz-sanacion" class="relleno-luz-sanacion" x="0" y="0" width="200" height="200" fill="url(#luz-sanacion)" filter="url(#glow-cristal)" />
                            </g>
                            <text x="100" y="106" text-anchor="middle" class="icono-vida-sanacion">🌿</text>
                        </g>
                    </svg>
                    <div class="sanacion-etapa-texto" id="sanacion-etapa-texto">Sesión 1 de 6</div>
                </div>

                <div class="tarjeta-cristal sanacion-mensaje-card" id="sanacion-mensaje-card">
                    <p id="sanacion-mensaje-texto"></p>
                </div>

                <div class="sanacion-calendario">
                    <div class="sanacion-parada">
                        <div class="sanacion-parada-etiqueta">Próxima parada</div>
                        <div class="sanacion-parada-fecha" id="sanacion-proxima-fecha">—</div>
                        <div class="sanacion-parada-cuenta" id="sanacion-proxima-cuenta"></div>
                        <button class="btn-editar-fecha" onclick="toggleEdicionFecha()" title="Editar la fecha de la próxima sesión">✏️ Editar fecha</button>
                        <div class="sanacion-edicion-fecha oculto" id="sanacion-edicion-fecha">
                            <input type="date" id="input-proxima-fecha" touch-action="manipulation">
                            <button onclick="guardarProximaFecha()">Guardar</button>
                        </div>
                        <p class="sanacion-edicion-nota">Si la cambiás, el resto de las fechas se recalculan solas cada 21 días.</p>
                    </div>

                    <div class="sanacion-meta">
                        <div class="sanacion-parada-etiqueta">La línea de meta</div>
                        <div class="sanacion-parada-fecha" id="sanacion-meta-fecha">—</div>
                        <div class="sanacion-parada-cuenta" id="sanacion-meta-cuenta"></div>
                    </div>
                </div>

                <div class="tarjeta-cristal sanacion-frase-motivadora" id="sanacion-frase-motivadora"></div>
            </div>

            <!-- Vista victoria: se muestra sola al llegar/superar la Q6 -->
            <div id="sanacion-vista-victoria" class="sanacion-vista-victoria" style="display:none;">
                <div class="sanacion-victoria-icono">🌸</div>
                <h3 class="sanacion-victoria-titulo">¡Lo lograste, mi amor!</h3>
                <p class="sanacion-victoria-texto">Hoy brillás con toda tu luz. Este camino ya es parte de nuestra historia, y lo que viene es solo vida, salud y nosotros dos. Te amo eternamente.</p>
            </div>
        </div>
    </div>

    <!-- ====== MODAL: EL CIELO DE NUESTRO PRIMER DÍA ====== -->
    <div id="modal-cielo" class="modal-cielo oculto">
        <button class="btn-cerrar-cielo" onclick="cerrarCielo()">✕</button>
        <canvas id="canvas-constelacion"></canvas>
        <div class="texto-cielo" id="texto-cielo">Así será nuestro cielo</div>
        <div class="subtexto-cielo" id="subtexto-cielo">25 de agosto de 2026 · Buenos Aires, Argentina</div>
    </div>

    <!-- ====== MODAL DE ACCESO (llave secreta compartida) ====== -->
    <div id="modal-acceso" class="modal-cristal oculto">
        <div class="tarjeta-acceso">
            <h3>Nuestra Llave Secreta 🗝️</h3>
            <p>Escribí tu nombre (nico o carito)</p>
            <form onsubmit="return false;">
                <input type="password" id="input-clave" placeholder="Tu nombre..." autocomplete="off" onkeypress="verificarEnterAcceso(event)">
                <button onclick="verificarIdentidad()">Entrar</button>
            </form>
            <div id="error-clave" class="error-texto"></div>
        </div>
    </div>

    <!-- ====== CHAT FLOTANTE (estilo cristal) ====== -->
    <div id="chat-flotante" class="chat-flotante">
        <div class="panel-chat" id="panel-chat">
            <div class="header-chat">
                <span class="titulo-chat">Nuestro Chat 💬</span>
                <button class="btn-cerrar-chat" onclick="toggleChat(event)">✕</button>
            </div>
            <div class="mensajes-chat" id="mensajes-chat"></div>
            <div class="input-chat-area">
                <input type="text" id="input-chat" placeholder="Escribí un mensajito..." autocomplete="off" onkeypress="verificarEnterChat(event)">
                <button class="btn-enviar-chat" onclick="enviarMensajeChat()">➤</button>
            </div>
        </div>
        <div class="burbuja-chat" id="burbuja-chat" onclick="toggleChat(event)" title="Abrir chat" role="button" aria-label="Abrir nuestro chat privado">💬</div>
    </div>

    <!-- ====== MURO EN EL TIEMPO (pantalla completa) ====== -->
    <div id="modal-muro" class="muro-pantalla oculto">
        <div class="muro-header">
            <h2 class="muro-titulo">Nuestro Refugio en el Tiempo</h2>
            <button class="muro-cerrar" onclick="cerrarMuro()">✕ Volver</button>
        </div>

        <div class="muro-input-container">
            <textarea id="texto-muro" placeholder="Dejá una carta, un pensamiento o un recuerdo para la eternidad..." rows="3"></textarea>
            <button class="btn-publicar-muro" onclick="guardarEnMuro()">Inmortalizar mensaje ✨</button>
        </div>

        <div class="muro-grid" id="contenedor-tarjetas-muro"></div>
    </div>

    <!-- FIREBASE (Proyecto Carolina) -->
    <script type="module">
        import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
        import { getFirestore, collection, addDoc, onSnapshot, query, where, orderBy, limit, serverTimestamp, doc, updateDoc, deleteDoc, setDoc, enableIndexedDbPersistence } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

        const firebaseConfig = {
            apiKey: "AIzaSyDDvrgXpSxaraqTj83ingY3xa-AT8ywxV4",
            authDomain: "carolina-634a1.firebaseapp.com",
            projectId: "carolina-634a1",
            storageBucket: "carolina-634a1.firebasestorage.app",
            messagingSenderId: "80980917854",
            appId: "1:80980917854:web:15a9f9a238ed2bd7c0becf",
            measurementId: "G-VDJ7B6SDW4"
        };

        const app = initializeApp(firebaseConfig);
        const db = getFirestore(app);

        // Persistencia offline: si la señal en la clínica es débil o nula, la app sigue
        // mostrando la última fecha/mensaje que se sincronizó, sin pantalla en blanco.
        enableIndexedDbPersistence(db).catch((err) => {
            console.warn('No se pudo activar la persistencia offline de Firestore:', err.code);
        });

        window.db = db;
        window.collection = collection;
        window.addDoc = addDoc;
        window.onSnapshot = onSnapshot;
        window.query = query;
        window.where = where;
        window.orderBy = orderBy;
        window.limit = limit;
        window.serverTimestamp = serverTimestamp;
        window.doc = doc;
        window.updateDoc = updateDoc;
        window.deleteDoc = deleteDoc;
        window.setDoc = setDoc;

        console.log("🔥 Conectado con éxito a Carolina");
    </script>

    <!-- Cargador liviano para las secciones que ya se migraron al patrón
         de "carga bajo demanda" (por ahora sólo Preguntas). -->
    <script src="js/inicio-cargador.js?v=1"></script>

    <script>
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

                        setTimeout(() => {
                            // Todas las burbujas quedan "listas" (mostrar) para que sus paneles
                            // funcionen apenas alguien las toque desde el universo — pero nada
                            // se dispara ni se abre solo, incluido el libro.
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

                            // La constelación-corazón es la nueva puerta de entrada:
                            // cada quien elige qué tocar, incluida "La Carta".
                            mostrarUniversoCorazon();
                        }, 2000);
                    }, 400);
                }
            }
        }

        function mostrarUniversoCorazon() {
            const universo = document.getElementById('universo-corazon');
            universo.style.display = 'flex';
            document.getElementById('scroll-aviso').style.display = 'none';
            setTimeout(() => universo.classList.add('activo'), 50);
        }

        // Entrar al libro es una elección: se toca "La Carta" en el corazón,
        // nunca se abre ni avanza solo.
        function entrarALaCarta(event) {
            if (event) event.stopPropagation();
            vibrar(15);
            const universo = document.getElementById('universo-corazon');
            universo.classList.remove('activo');
            setTimeout(() => { universo.style.display = 'none'; }, 500);

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
        // A diferencia del listener de arriba (que sólo arranca la primera vez
        // que se ABRE el panel), este escucha el último mensaje todo el tiempo,
        // desde que sabemos quiénes somos — así detecta mensajes nuevos del
        // otro aunque nunca hayamos abierto el chat en esta sesión.
        let _escuchaNoLeidosIniciada = false;

        function iniciarEscuchaChatNoLeidos() {
            if (_escuchaNoLeidosIniciada || !miIdentidad) return;
            _escuchaNoLeidosIniciada = true;
            const q = window.query(
                window.collection(window.db, "chat"),
                window.orderBy("timestamp", "desc"),
                window.limit(1)
            );
            window.onSnapshot(q, (snapshot) => {
                if (snapshot.empty) return;
                const msg = snapshot.docs[0].data();
                if (msg.autor === miIdentidad) return; // mensaje propio, no cuenta como no leído
                const fecha = msg.timestamp && msg.timestamp.toMillis ? msg.timestamp.toMillis() : Date.now();
                const visto = Number(localStorage.getItem("chatVistoHasta_" + miIdentidad) || 0);
                const chatFlotante = document.getElementById("chat-flotante");
                const abierto = chatFlotante && chatFlotante.classList.contains("abierto");
                if (fecha > visto && !abierto) marcarChatComoNoLeido(true);
            }, (err) => console.error("Error escuchando no leídos del chat:", err));
        }

        function marcarChatComoNoLeido(hayNoLeido) {
            const burbuja = document.getElementById("burbuja-chat");
            if (burbuja) burbuja.classList.toggle("no-leido", hayNoLeido);
        }

        function marcarChatComoVisto() {
            if (!miIdentidad) return;
            localStorage.setItem("chatVistoHasta_" + miIdentidad, String(Date.now()));
            marcarChatComoNoLeido(false);
        }

        // Si ya sabíamos quiénes somos de una visita anterior (miIdentidad
        // viene de localStorage), arrancamos la escucha ya mismo, sin
        // esperar a que se abra el chat ni se pida la llave de nuevo.
        if (miIdentidad) iniciarEscuchaChatNoLeidos();

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
    </script>
</body>
</html>
