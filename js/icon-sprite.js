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

        '</defs>' +
        '</svg>';

    document.currentScript.insertAdjacentHTML('beforebegin', SPRITE);
})();
