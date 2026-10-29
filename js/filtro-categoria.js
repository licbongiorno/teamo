// ==================== PÁGINA DE CATEGORÍA ====================
// categorias/index.html?c=<id>: lista los juegos de una categoría con la
// misma tarjeta que el menú (js/juegos-data.js → tarjetaJuegoHTML), con
// buscador, filtro por etiqueta (🤖 compu, ⚡ en vivo, …) y orden.
// Las páginas viejas (categorias/clasicos.html, etc.) redirigen acá.
(function(){
    const params = new URLSearchParams(location.search);
    const cat = window.obtenerCategoria(params.get('c')) || window.CATEGORIAS[0];
    let etiqueta = null;
    const norm = (t) => (t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

    function armar(){
        document.title = `${cat.nombre} — Nuestros Juegos`;
        document.getElementById('pagina-categoria').style.setProperty('--color-cat', cat.color);
        document.getElementById('titulo-categoria').innerHTML = `<svg class="icono-svg"><use href="#${cat.iconoSvg}"></use></svg> ${cat.nombre}`;
        document.getElementById('subtitulo-categoria').textContent = cat.desc || '';
        document.getElementById('otras-categorias').innerHTML = window.CATEGORIAS.map(c =>
            `<a href="index.html?c=${c.id}" class="${c.id === cat.id ? 'activa' : ''}" style="--color-cat:${c.color};">${c.icono} ${c.nombre}</a>`).join('');
        // Sólo las etiquetas que tiene algún juego de esta categoría
        const juegos = window.obtenerJuegosDeCategoria(cat.id).filter(j => j.disponible);
        const hay = Object.keys(window.ETIQUETAS_JUEGO).filter(k => juegos.some(j => window.etiquetasJuego(j.id).has(k)) && !juegos.every(j => window.etiquetasJuego(j.id).has(k)));
        document.getElementById('filtros-categoria').innerHTML = hay.map(k => `<button type="button" data-k="${k}" onclick="etiquetaCategoria('${k}')">${window.ETIQUETAS_JUEGO[k].t}</button>`).join('');
        filtrarCategoria();
    }
    function filtrarCategoria(){
        const q = norm(document.getElementById('buscador-categoria').value), orden = document.getElementById('orden-categoria').value;
        const ab = window.juegosAbiertosEn();
        let lista = window.obtenerJuegosDeCategoria(cat.id).filter(j => j.disponible)
            .filter(j => !q || norm(j.nombre).includes(q) || norm(j.descripcion).includes(q))
            .filter(j => !etiqueta || window.etiquetasJuego(j.id).has(etiqueta));
        if (orden === 'nombre') lista.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
        if (orden === 'recientes') lista.sort((a, b) => (ab[b.id] || 0) - (ab[a.id] || 0));
        if (orden === 'nunca') lista.sort((a, b) => (ab[a.id] ? 1 : 0) - (ab[b.id] ? 1 : 0));
        document.querySelectorAll('#filtros-categoria button').forEach(b => b.classList.toggle('activa', b.dataset.k === etiqueta));
        const cont = document.getElementById('lista-juegos-categoria');
        cont.innerHTML = lista.length ? lista.map(j => window.tarjetaJuegoHTML(j, { href: '../juegos.html?juego=' })).join('')
            : `<p class="texto-tenue texto-centro">${q || etiqueta ? 'No encontramos ningún juego así.' : 'Todavía no hay juegos acá.'}</p>`;
    }
    window.filtrarCategoria = filtrarCategoria;
    window.etiquetaCategoria = (k) => { etiqueta = etiqueta === k ? null : k; filtrarCategoria(); };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', armar); else armar();
})();
