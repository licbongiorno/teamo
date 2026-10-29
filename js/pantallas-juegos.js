// ============================================================
// pantallas-juegos.js — arma la pantalla de cada juego (encabezado con
// el título y la ✕, y el #contenido-<id> donde se dibuja) a partir del
// catálogo (js/juegos-data.js). Antes eran 150 bloques iguales escritos
// a mano en juegos.html. Se ejecuta mientras se lee la página, en el
// lugar donde estaban, así todo lo que busca #pantalla-<id> al cargar
// ya las encuentra.
// ============================================================
(function () {
    // Títulos que no son "ícono + nombre" del catálogo.
    const TITULOS = {
        truco: '🃏 Truco', ajedrez: '♞ Ajedrez', fuegoagua: '🔥💧 Fuego y Agua', mascota: '🐱 Chokurei',
        cartas: '💌 Carta para Abrir Después', estadisticas: '📊 Nuestra Historia', ranking: '🏆 Ranking general',
    };
    const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const ids = [...(window.JUEGOS || []).map(j => j.id), 'estadisticas', 'ranking'];
    const html = ids.map(id => {
        const j = (window.JUEGOS || []).find(x => x.id === id);
        const titulo = TITULOS[id] || (j ? `${j.icono} ${j.nombre}` : id);
        return `<div id="pantalla-${id}" class="pantalla-juego">
        <div class="fila-superior-juego">
            <span class="titulo-juego">${esc(titulo)}</span>
            <button class="btn-cerrar-juego" onclick="cerrarJuego()">✕</button>
        </div>
        <div id="contenido-${id}"></div>
    </div>`;
    }).join('\n');
    document.currentScript.insertAdjacentHTML('beforebegin', html);
})();
