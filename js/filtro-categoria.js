// ==================== FILTRO DE CATEGORÍA ====================
// Compartido por las 6 páginas categorias/*.html: filtra en vivo la
// lista de juegos ya renderizada, por nombre. Categorías como
// Competencia (25 juegos y sumando) se hacen largas de recorrer a
// simple vista, esto la achica mientras se escribe.
function normalizarBusquedaCategoria(t){
    return (t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}
function filtrarCategoria(){
    const input = document.getElementById('buscador-categoria');
    const cont = document.getElementById('lista-juegos-categoria');
    if (!input || !cont) return;
    const q = normalizarBusquedaCategoria(input.value);
    let algunoVisible = false;
    cont.querySelectorAll('.tarjeta-juego-cat').forEach((el) => {
        const nombre = normalizarBusquedaCategoria(el.querySelector('h3') ? el.querySelector('h3').innerText : '');
        const coincide = !q || nombre.includes(q);
        el.style.display = coincide ? '' : 'none';
        if (coincide) algunoVisible = true;
    });
    let aviso = document.getElementById('aviso-sin-resultados-categoria');
    if (!algunoVisible && q) {
        if (!aviso) {
            aviso = document.createElement('p');
            aviso.id = 'aviso-sin-resultados-categoria';
            aviso.className = 'texto-tenue texto-centro';
            aviso.innerText = 'No encontramos ningún juego con ese nombre.';
            cont.appendChild(aviso);
        }
    } else if (aviso) {
        aviso.remove();
    }
}
window.filtrarCategoria = filtrarCategoria;
