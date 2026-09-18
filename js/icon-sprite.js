// ============================================================
// icon-sprite.js — set propio de íconos SVG (línea, 24x24, trazo con
// currentColor), estilo minimalista tipo Lucide/Feather, para no
// depender de ninguna librería externa (los CDN de íconos están
// bloqueados desde donde se armó este sitio, así que en vez de meter
// una librería "a ciegas" sin poder probarla, se armó este set a
// mano — mismo resultado visual, cero dependencias, funciona offline).
//
// Uso: <svg class="icono-svg"><use href="#icono-libro"></use></svg>
// Este script se inserta a sí mismo (el <svg> con todos los <symbol>)
// justo antes de su propia etiqueta <script>, así que tiene que
// incluirse temprano en el <body>, antes de cualquier <use> que lo
// necesite (mismo lugar que auth-gate.js).
// ============================================================
(function () {
    var SPRITE = '' +
        '<svg xmlns="http://www.w3.org/2000/svg" style="position:absolute; width:0; height:0; overflow:hidden;" aria-hidden="true">' +
        '<defs>' +

        // --- Universo ---
        '<symbol id="icono-libro" viewBox="0 0 24 24"><path d="M3 5c2-1.5 5-1.5 9 0v14c-4-1.5-7-1.5-9 0V5Z"/><path d="M21 5c-2-1.5-5-1.5-9 0v14c4-1.5 7-1.5 9 0V5Z"/></symbol>' +
        '<symbol id="icono-corazon-chispa" viewBox="0 0 24 24"><path d="M12 19.3C5.6 14.6 3 11 3 8.3 3 5.9 4.9 4 7.3 4c1.7 0 3.2.9 4.2 2.6C12.5 4.9 14 4 15.7 4 18.1 4 20 5.9 20 8.3c0 2.7-2.6 6.3-9 11Z"/><path d="M19 2.2v3M17.5 3.7h3"/></symbol>' +
        '<symbol id="icono-nota-musical" viewBox="0 0 24 24"><path d="M9.5 17.5V4.8l10-2v12.2"/><circle cx="6.5" cy="17.5" r="3"/><circle cx="17" cy="14.5" r="3"/></symbol>' +
        '<symbol id="icono-pregunta" viewBox="0 0 24 24"><path d="M4 5h16a1.5 1.5 0 0 1 1.5 1.5v8A1.5 1.5 0 0 1 20 16H9l-4 3.2V16H4a1.5 1.5 0 0 1-1.5-1.5v-8A1.5 1.5 0 0 1 4 5Z"/><path d="M9.8 9.3c0-1.3 1.1-2.2 2.3-2.2 1.2 0 2.2.8 2.2 1.9 0 1.2-1 1.7-1.8 2.3-.6.4-.8.8-.8 1.5"/><circle cx="12" cy="14.6" r=".65" fill="currentColor" stroke="none"/></symbol>' +
        '<symbol id="icono-documento" viewBox="0 0 24 24"><path d="M6 3.5h8l5 5V20a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z"/><path d="M14 3.5v5h5"/><path d="M8 13h8M8 17h5"/></symbol>' +
        '<symbol id="icono-estrella-fugaz" viewBox="0 0 24 24"><path d="M13.5 3.5 14.9 7l3.6 1.4-3.6 1.4-1.4 3.6-1.4-3.6L8.5 8.4l3.6-1.4Z"/><path d="M4 19.5l5.5-1.8M3 15.7l3.6-1.2"/></symbol>' +
        '<symbol id="icono-reloj" viewBox="0 0 24 24"><circle cx="12" cy="12.5" r="8.5"/><path d="M12 7.5v5l3.3 1.9"/><path d="M9.5 2.2h5"/></symbol>' +
        '<symbol id="icono-ticket" viewBox="0 0 24 24"><path d="M4 8.5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2 1.7 1.7 0 0 0 0 3.4 2 2 0 0 1-2 2H6a2 2 0 0 1-2-2 1.7 1.7 0 0 0 0-3.4Z"/><path d="M14.5 6.7v1.8M14.5 10.9v1.8M14.5 15.1v1.6"/></symbol>' +
        '<symbol id="icono-hoja" viewBox="0 0 24 24"><path d="M5.5 20C5.5 10.6 12 4 20.5 4c0 8.6-6.6 15.1-15 16Z"/><path d="M7.7 17.8C9.8 12.6 13 8.7 18 6"/></symbol>' +
        '<symbol id="icono-gamepad" viewBox="0 0 24 24"><rect x="2" y="8" width="20" height="10.5" rx="5.25"/><path d="M7.2 10.8v4M5.2 12.8h4"/><circle cx="16" cy="11.6" r="1.05" fill="currentColor" stroke="none"/><circle cx="18.6" cy="14.2" r="1.05" fill="currentColor" stroke="none"/></symbol>' +
        '<symbol id="icono-galaxia" viewBox="0 0 24 24"><ellipse cx="12" cy="12" rx="9.3" ry="3.6" transform="rotate(-24 12 12)"/><circle cx="12" cy="12" r="2.6" fill="currentColor" stroke="none"/><circle cx="4.8" cy="5.6" r=".9" fill="currentColor" stroke="none"/><circle cx="19.2" cy="17.2" r=".7" fill="currentColor" stroke="none"/></symbol>' +
        '<symbol id="icono-regalo" viewBox="0 0 24 24"><rect x="3.5" y="9.5" width="17" height="11" rx="1"/><path d="M3.5 9.5h17v4h-17Z"/><path d="M12 9.5V20.5"/><path d="M12 9.5C9.2 9.5 7.8 6.8 9.3 5.1c1.4-1.5 2.7.6 2.7 4.4ZM12 9.5c2.8 0 4.2-2.7 2.7-4.4-1.4-1.5-2.7.6-2.7 4.4Z"/></symbol>' +

        // --- Juegos (shell + categorías) ---
        '<symbol id="icono-flecha-izq" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7"/></symbol>' +
        '<symbol id="icono-luna" viewBox="0 0 24 24"><path d="M20.2 14.7A8.6 8.6 0 1 1 9.4 3.9a7.1 7.1 0 0 0 10.8 10.8Z"/></symbol>' +
        '<symbol id="icono-sol" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4.3"/><path d="M12 2.5v3M12 18.5v3M4.4 4.4l2.1 2.1M17.5 17.5l2.1 2.1M2.5 12h3M18.5 12h3M4.4 19.6l2.1-2.1M17.5 6.5l2.1-2.1"/></symbol>' +
        '<symbol id="icono-grafico" viewBox="0 0 24 24"><path d="M2.5 20.5h19"/><path d="M5.5 20v-6M11.5 20V6M17.5 20v-9"/></symbol>' +
        '<symbol id="icono-dado" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="4"/><circle cx="8.5" cy="8.5" r="1.15" fill="currentColor" stroke="none"/><circle cx="15.5" cy="8.5" r="1.15" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.15" fill="currentColor" stroke="none"/><circle cx="8.5" cy="15.5" r="1.15" fill="currentColor" stroke="none"/><circle cx="15.5" cy="15.5" r="1.15" fill="currentColor" stroke="none"/></symbol>' +
        '<symbol id="icono-cartas" viewBox="0 0 24 24"><rect x="2.8" y="7.3" width="11.5" height="15" rx="2" transform="rotate(-10 8.5 14.8)"/><rect x="8.5" y="3" width="12.5" height="16.5" rx="2"/></symbol>' +
        '<symbol id="icono-rayo" viewBox="0 0 24 24"><path d="M13 2 4.5 13.5h5.7l-1 8L18 10h-5.7Z"/></symbol>' +
        '<symbol id="icono-chat" viewBox="0 0 24 24"><path d="M3 5.5h12.5a2 2 0 0 1 2 2v5.5a2 2 0 0 1-2 2H9L5 18v-3H3a1 1 0 0 1-1-1V6.5a1 1 0 0 1 1-1Z"/><path d="M21 10.3v4.4a2 2 0 0 1-2 2h-.7v2.6L15.8 17"/></symbol>' +
        '<symbol id="icono-personas" viewBox="0 0 24 24"><circle cx="8.3" cy="8" r="3.1"/><path d="M2.3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="17.3" cy="9" r="2.5"/><path d="M14.8 20.2c.1-2.7 1.7-4.9 3.8-5.5"/></symbol>' +
        '<symbol id="icono-brote" viewBox="0 0 24 24"><path d="M12 21V10.5"/><path d="M12 10.5C12 6.5 9 4.3 5 4.2c-.1 4.6 3 7.1 7 6.3Z"/><path d="M12 13.3c0-3.5 2.5-5.2 6-5.2.1 3.7-2.4 6-6 5.2Z"/></symbol>' +
        '<symbol id="icono-sonido" viewBox="0 0 24 24"><path d="M4 9.3h3.3L12 5.4v13.2l-4.7-3.9H4a1 1 0 0 1-1-1v-3.4a1 1 0 0 1 1-1Z"/><path d="M15.8 8.6a5 5 0 0 1 0 6.8M18.3 6a8.6 8.6 0 0 1 0 12"/></symbol>' +
        '<symbol id="icono-sonido-mute" viewBox="0 0 24 24"><path d="M4 9.3h3.3L12 5.4v13.2l-4.7-3.9H4a1 1 0 0 1-1-1v-3.4a1 1 0 0 1 1-1Z"/><path d="M16.3 9.7l4.2 4.6M20.5 9.7l-4.2 4.6"/></symbol>' +

        // --- Un ícono por juego (66 del catálogo) ---
        '<symbol id="icono-horca" viewBox="0 0 24 24"><path d="M4 21h9M6 21V3h9v3"/><circle cx="15" cy="8.5" r="2"/></symbol>' +
        '<symbol id="icono-peon" viewBox="0 0 24 24"><circle cx="12" cy="7" r="2.6"/><path d="M9 12h6l1.6 8h-9.2L9 12Z"/><path d="M7 20h10"/></symbol>' +
        '<symbol id="icono-ficha-dama" viewBox="0 0 24 24"><circle cx="12" cy="12" r="7.5"/><circle cx="12" cy="12" r="3.2"/></symbol>' +
        '<symbol id="icono-grilla-equis" viewBox="0 0 24 24"><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/><path d="M4.5 4.5l3.4 3.4m-3.4 0l3.4-3.4"/><circle cx="18" cy="18" r="2.6"/></symbol>' +
        '<symbol id="icono-cuatro-en-linea" viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="14" rx="2"/><circle cx="7" cy="16" r="1.7" fill="currentColor" stroke="none"/><circle cx="11.7" cy="12.5" r="1.7" fill="currentColor" stroke="none"/><circle cx="11.7" cy="16" r="1.7" fill="currentColor" stroke="none"/><circle cx="16.3" cy="16" r="1.7" fill="currentColor" stroke="none"/><path d="M11.7 2.5v5.5"/></symbol>' +
        '<symbol id="icono-escoba" viewBox="0 0 24 24"><path d="M15 3l6 6-8.5 8.5-3-3z"/><path d="M9.5 14.5L4 20m5.5-5.5l-1.5 6.5m1.5-6.5l3 4.5"/></symbol>' +
        '<symbol id="icono-barco" viewBox="0 0 24 24"><path d="M4 15h16l-2.3 5.5H6.3L4 15Z"/><path d="M12 15V4M9 7.5h6"/></symbol>' +
        '<symbol id="icono-manzana" viewBox="0 0 24 24"><path d="M12 8.3c-3.2 0-5.3 2.3-5.3 5.6 0 3.7 2.4 6.6 5.3 6.6s5.3-2.9 5.3-6.6c0-3.3-2.1-5.6-5.3-5.6Z"/><path d="M12 8.3V5.6M12 5.6c0-1.1 1-2 2.2-2"/></symbol>' +
        '<symbol id="icono-soga" viewBox="0 0 24 24"><path d="M2.5 6v3M2.5 7.5h4M21.5 6v3M21.5 7.5h-4"/><path d="M6.5 7.5c1.5-2 3-2 4 0s2.5 2 4 0 2.5-2 4 0"/></symbol>' +
        '<symbol id="icono-bomba" viewBox="0 0 24 24"><circle cx="11" cy="14.5" r="6.8"/><path d="M14.7 9.3l2-2m-.3 3.3l1.8-.7m-3.4-2.9l.6-1.8"/></symbol>' +
        '<symbol id="icono-mosaico" viewBox="0 0 24 24"><rect x="3" y="3" width="7.5" height="7.5" rx="1.4"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.4"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.4"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.4"/></symbol>' +
        '<symbol id="icono-rostro-interrogante" viewBox="0 0 24 24"><circle cx="12" cy="9" r="4.3"/><path d="M7.3 21c0-3.7 2.1-6.3 4.7-6.3s4.7 2.6 4.7 6.3"/><path d="M10.5 7.6c0-1.1.9-1.9 1.9-1.9 1.1 0 1.9.7 1.9 1.7 0 1-.9 1.4-1.5 1.9-.4.3-.6.6-.6 1.1" /><circle cx="12.2" cy="12.3" r=".55" fill="currentColor" stroke="none"/></symbol>' +
        '<symbol id="icono-cruce" viewBox="0 0 24 24"><path d="M12 3v7M12 21v-7M12 14l-7 5M12 14l7 5"/><circle cx="12" cy="14" r="1.8" fill="currentColor" stroke="none"/></symbol>' +
        '<symbol id="icono-mascara" viewBox="0 0 24 24"><path d="M3 8c2-2 5-3 9-3s7 1 9 3c0 6-3 12-9 12S3 14 3 8Z"/><circle cx="8.7" cy="10" r="1.1" fill="currentColor" stroke="none"/><circle cx="15.3" cy="10" r="1.1" fill="currentColor" stroke="none"/><path d="M9 15c1 1 5 1 6 0"/></symbol>' +
        '<symbol id="icono-lupa" viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.3 15.3 21 21"/></symbol>' +
        '<symbol id="icono-globo-pensamiento" viewBox="0 0 24 24"><path d="M4 9.5a6.5 6.5 0 0 1 13 0c0 3.6-2.9 6.5-6.5 6.5-1 0-1.9-.2-2.7-.6L4 17l1.3-3.4A6.5 6.5 0 0 1 4 9.5Z"/><circle cx="18.5" cy="19" r="1.1" fill="currentColor" stroke="none"/><circle cx="21" cy="21.5" r=".7" fill="currentColor" stroke="none"/></symbol>' +
        '<symbol id="icono-espejo-mano" viewBox="0 0 24 24"><circle cx="12" cy="9" r="6.5"/><path d="M12 15.5V21"/><path d="M8.7 7.8c.4-1.9 2-3.3 3.9-3.3"/></symbol>' +
        '<symbol id="icono-balanza" viewBox="0 0 24 24"><path d="M12 3v18M6 21h12"/><path d="M4 8h6M14 8h6"/><path d="M4 8l-2.3 5.2c1.1 1 3.5 1 4.6 0L4 8ZM20 8l-2.3 5.2c1.1 1 3.5 1 4.6 0L20 8Z"/></symbol>' +
        '<symbol id="icono-remolino" viewBox="0 0 24 24"><path d="M12 12a4 4 0 1 1-4-4"/><path d="M12 12a7.5 7.5 0 1 0-7.5-7.5"/><circle cx="12" cy="12" r=".9" fill="currentColor" stroke="none"/></symbol>' +
        '<symbol id="icono-bola-cristal" viewBox="0 0 24 24"><circle cx="12" cy="10.5" r="7"/><path d="M8.7 8a4 4 0 0 1 4-3" /><path d="M6 20.5h12M8.5 20.5l1-3M15.5 20.5l-1-3"/></symbol>' +
        '<symbol id="icono-reloj-arena" viewBox="0 0 24 24"><path d="M6 3h12M6 21h12"/><path d="M6.5 3c0 4 3 6 5.5 6.7C14.5 9 17.5 7 17.5 3M6.5 21c0-4 3-6 5.5-6.7C14.5 15 17.5 17 17.5 21"/></symbol>' +
        '<symbol id="icono-luna-zzz" viewBox="0 0 24 24"><path d="M15.3 4.2A6.7 6.7 0 1 0 19.8 15a5.6 5.6 0 0 1-4.5-10.8Z"/><path d="M17 3h4l-4 4h4"/></symbol>' +
        '<symbol id="icono-camara" viewBox="0 0 24 24"><path d="M3 8.5a1.5 1.5 0 0 1 1.5-1.5h2l1.3-2h8.4l1.3 2h2A1.5 1.5 0 0 1 21 8.5v10A1.5 1.5 0 0 1 19.5 20h-15A1.5 1.5 0 0 1 3 18.5v-10Z"/><circle cx="12" cy="13" r="3.6"/></symbol>' +
        '<symbol id="icono-ruleta" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 3v9l6.4 3.7M12 12 5.6 15.7"/><circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none"/></symbol>' +
        '<symbol id="icono-pluma" viewBox="0 0 24 24"><path d="M20 4c-7 1-13 5-15 15 10-2 14-8 15-15Z"/><path d="M5 19c2-4 5.5-8 11-11"/></symbol>' +
        '<symbol id="icono-pata" viewBox="0 0 24 24"><circle cx="12" cy="16" r="4"/><circle cx="6" cy="9.5" r="2"/><circle cx="11" cy="6.5" r="2"/><circle cx="16" cy="6.5" r="2"/><circle cx="19.5" cy="10.5" r="2"/></symbol>' +
        '<symbol id="icono-arbol" viewBox="0 0 24 24"><path d="M12 22v-7"/><circle cx="12" cy="9" r="6.3"/></symbol>' +
        '<symbol id="icono-casa" viewBox="0 0 24 24"><path d="M4 11 12 4l8 7"/><path d="M6 10v10h12V10"/><path d="M10 20v-5h4v5"/></symbol>' +
        '<symbol id="icono-pin-mapa" viewBox="0 0 24 24"><path d="M12 21s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12Z"/><circle cx="12" cy="9" r="2.4"/></symbol>' +
        '<symbol id="icono-paleta" viewBox="0 0 24 24"><path d="M12 3a9 8 0 0 0 0 16c1.4 0 1.7-1.5.7-2.2-1-.7-.6-2.3.8-2.3H16a5 4 0 0 0 5-4C21 6 17 3 12 3Z"/><circle cx="7.5" cy="10.5" r="1" fill="currentColor" stroke="none"/><circle cx="11" cy="7.5" r="1" fill="currentColor" stroke="none"/><circle cx="15.5" cy="8" r="1" fill="currentColor" stroke="none"/></symbol>' +
        '<symbol id="icono-sobre" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3.5 6 12 13 20.5 6"/></symbol>' +
        '<symbol id="icono-capsula" viewBox="0 0 24 24"><rect x="3.5" y="9.5" width="17" height="9" rx="2"/><path d="M8 9.5v9M16 9.5v9"/><path d="M12 5v4.5"/><path d="M9 5h6"/></symbol>' +
        '<symbol id="icono-mapa-doblado" viewBox="0 0 24 24"><path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z"/><path d="M9 4v14M15 6v14"/></symbol>' +
        '<symbol id="icono-candado" viewBox="0 0 24 24"><rect x="4.5" y="10.5" width="15" height="10" rx="2"/><path d="M7.5 10.5V7a4.5 4.5 0 0 1 9 0v3.5"/><circle cx="12" cy="15.5" r="1.4" fill="currentColor" stroke="none"/></symbol>' +
        '<symbol id="icono-termometro" viewBox="0 0 24 24"><path d="M12 3a2.2 2.2 0 0 0-2.2 2.2v9a4 4 0 1 0 4.4 0v-9A2.2 2.2 0 0 0 12 3Z"/><circle cx="12" cy="18" r="2" fill="currentColor" stroke="none"/></symbol>' +
        '<symbol id="icono-signo-veinte" viewBox="0 0 24 24"><path d="M4 5h16a1.5 1.5 0 0 1 1.5 1.5v8A1.5 1.5 0 0 1 20 16H9l-4 3.2V16H4a1.5 1.5 0 0 1-1.5-1.5v-8A1.5 1.5 0 0 1 4 5Z"/><text x="12" y="12.3" font-size="7.5" font-weight="700" text-anchor="middle" fill="currentColor" stroke="none">20</text></symbol>' +
        '<symbol id="icono-piezas-uno" viewBox="0 0 24 24"><rect x="2.5" y="5" width="8" height="14" rx="2" transform="rotate(-8 6.5 12)"/><rect x="13" y="5" width="8" height="14" rx="2" transform="rotate(8 17 12)"/></symbol>' +
        '<symbol id="icono-baraja-espanola" viewBox="0 0 24 24"><rect x="3" y="4" width="12" height="16" rx="2"/><path d="M9 7.5v9M6 9l3-1.5 3 1.5M6 15l3 1.5 3-1.5"/><rect x="13" y="7" width="8" height="12" rx="1.6" transform="rotate(12 17 13)"/></symbol>' +
        '<symbol id="icono-burbujas" viewBox="0 0 24 24"><circle cx="9" cy="13" r="6.5"/><circle cx="18" cy="7.5" r="3"/><path d="M6.7 10.3c.6-1 1.6-1.6 2.6-1.7"/></symbol>' +
        '<symbol id="icono-globo-carrera" viewBox="0 0 24 24"><path d="M12 3.5a5.5 5.5 0 0 1 5.5 5.5c0 3.5-2.5 6-4.3 7.3a1.7 1.7 0 0 1-2.4 0C9 14.9 6.5 12.4 6.5 9A5.5 5.5 0 0 1 12 3.5Z"/><path d="M12 16.3v3.2M10.3 21h3.4"/></symbol>' +
        '<symbol id="icono-tambor" viewBox="0 0 24 24"><ellipse cx="12" cy="7" rx="8" ry="3.2"/><path d="M4 7v9c0 1.8 3.6 3.2 8 3.2s8-1.4 8-3.2V7"/><path d="M5 16 2.5 21.5M19 16l2.5 5.5"/></symbol>' +
        '<symbol id="icono-bloques-tetris" viewBox="0 0 24 24"><path d="M3 21v-7h7v-4h11v11H3Z"/><path d="M10 14v-4M3 21h18M10 10h11"/></symbol>' +
        '<symbol id="icono-cocodrilo" viewBox="0 0 24 24"><path d="M2.5 14c2-3 5.5-4.5 10-4.5S20 12 21.5 14c-1.8 1-4 1.5-6.3 1.5H8.8c-2.3 0-4.5-.5-6.3-1.5Z"/><path d="M6 9.5V6M8.7 9.5V5.5M11.4 9.5V6" /><circle cx="17" cy="12" r=".8" fill="currentColor" stroke="none"/></symbol>' +
        '<symbol id="icono-anzuelo" viewBox="0 0 24 24"><path d="M9 3v9.5a4.5 4.5 0 1 0 7 3.7"/><circle cx="9" cy="3.8" r="1.3" fill="currentColor" stroke="none"/></symbol>' +
        '<symbol id="icono-ladrillos" viewBox="0 0 24 24"><rect x="2.5" y="4" width="19" height="16" rx="1.5"/><path d="M2.5 9.3h19M2.5 14.7h19M8 4v5.3M16 4v5.3M12 9.3v5.4M4.7 14.7V20M19.3 14.7V20"/></symbol>' +
        '<symbol id="icono-pinata" viewBox="0 0 24 24"><path d="M6 8.5a6 5.5 0 1 1 12 0c0 3-2.7 5.5-6 5.5s-6-2.5-6-5.5Z"/><path d="M12 14v7M9 17.5l-2 3.5M15 17.5l2 3.5M8 6.5l-2-3M16 6.5l2-3M12 3v2.5"/></symbol>' +
        '<symbol id="icono-llama" viewBox="0 0 24 24"><path d="M12 21c-4 0-6.5-2.7-6.5-6.2C5.5 11 8 8.7 8.7 5c1.8 2 2.3 4 2 5.8C12.5 9 13 6 12 3c4 2 7 6 7 10.5 0 4.2-2.8 7.5-7 7.5Z"/></symbol>' +
        '<symbol id="icono-rompecabezas" viewBox="0 0 24 24"><path d="M4 4h4.2a2.3 2.3 0 0 1 4.6 0H17a1 1 0 0 1 1 1v4.2a2.3 2.3 0 0 1 0 4.6V18a1 1 0 0 1-1 1h-4.2a2.3 2.3 0 0 1-4.6 0H4a1 1 0 0 1-1-1v-4.2a2.3 2.3 0 0 1 0-4.6V5a1 1 0 0 1 1-1Z"/></symbol>' +
        '<symbol id="icono-gemelos" viewBox="0 0 24 24"><circle cx="9" cy="8" r="4"/><circle cx="15" cy="8" r="4"/><path d="M3.5 20c0-3.6 2.5-6.5 5.5-6.5M20.5 20c0-3.6-2.5-6.5-5.5-6.5"/></symbol>' +
        '<symbol id="icono-adn" viewBox="0 0 24 24"><path d="M6 3c0 7 12 11 12 18M18 3c0 7-12 11-12 18"/><path d="M7.3 7h9.4M6.4 12h11.2M7.3 17h9.4"/></symbol>' +
        '<symbol id="icono-sudoku" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/><circle cx="6" cy="6" r=".9" fill="currentColor" stroke="none"/><circle cx="18" cy="12" r=".9" fill="currentColor" stroke="none"/><circle cx="12" cy="18" r=".9" fill="currentColor" stroke="none"/></symbol>' +

        '</defs>' +
        '</svg>';

    document.currentScript.insertAdjacentHTML('beforebegin', SPRITE);
})();
