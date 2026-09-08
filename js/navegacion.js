// ==================== NAVEGACIÓN ENTRE JUEGOS ====================
function abrirJuego(juego){
    vibrarJ(12);
    const pantalla = document.getElementById('pantalla-' + juego);
    if (!pantalla) return; // juego todavía no disponible
    document.querySelectorAll('.pantalla-juego').forEach(p => p.classList.remove('activa'));
    pantalla.classList.add('activa');
    if (juego === 'ahorcado') iniciarAhorcado();
    if (juego === 'frutas') iniciarFrutas();
    if (juego === 'truco') iniciarTruco();
    if (juego === 'letras') iniciarLetras();
    if (juego === 'damas') iniciarDamas();
    if (juego === 'ajedrez') iniciarAjedrez();
    if (juego === 'jardin') iniciarJardin();
    if (juego === 'indagacion') iniciarIndagacion();
    if (juego === 'ruleta') iniciarRuleta();
    if (juego === 'verdadoreto') iniciarVerdadOReto();
    // Deja constancia en la URL de qué juego está abierto, así un link
    // desde una página de categoría (categorias/*.html) puede llevar
    // directo a un juego con ?juego=id, y el botón "atrás" del navegador
    // también tiene sentido.
    const params = new URLSearchParams(window.location.search);
    params.set('juego', juego);
    history.replaceState(null, '', '?' + params.toString());
}
function cerrarJuego(){
    vibrarJ(12);
    detenerListenersActivos();
    document.querySelectorAll('.pantalla-juego').forEach(p => p.classList.remove('activa'));
    document.getElementById('pantalla-menu').classList.add('activa');
    const params = new URLSearchParams(window.location.search);
    params.delete('juego');
    const query = params.toString();
    history.replaceState(null, '', query ? '?' + query : window.location.pathname);
}
function detenerListenersActivos(){
    if (window._unsubAhorcado) { window._unsubAhorcado(); window._unsubAhorcado = null; }
    if (window._unsubFrutas) { window._unsubFrutas(); window._unsubFrutas = null; }
    if (window._unsubTruco) { window._unsubTruco(); window._unsubTruco = null; }
    if (window._unsubLetrasLista) { window._unsubLetrasLista(); window._unsubLetrasLista = null; }
    if (window._unsubEscrituraActual) { window._unsubEscrituraActual(); window._unsubEscrituraActual = null; }
    if (window._loopFrutas) { cancelAnimationFrame(window._loopFrutas); window._loopFrutas = null; }
    if (window._timerFrutas) { clearInterval(window._timerFrutas); window._timerFrutas = null; }
    if (window._unsubDamas) { window._unsubDamas(); window._unsubDamas = null; }
    if (window._unsubAjedrez) { window._unsubAjedrez(); window._unsubAjedrez = null; }
    if (window._unsubJardin) { window._unsubJardin(); window._unsubJardin = null; }
    if (window._intervaloJardin) { clearInterval(window._intervaloJardin); window._intervaloJardin = null; }
    if (window._unsubIndagacionLista) { window._unsubIndagacionLista(); window._unsubIndagacionLista = null; }
    if (window._unsubIndagacionActual) { window._unsubIndagacionActual(); window._unsubIndagacionActual = null; }
    if (window._unsubRuleta) { window._unsubRuleta(); window._unsubRuleta = null; }
    if (window._unsubVerdadOReto) { window._unsubVerdadOReto(); window._unsubVerdadOReto = null; }
}

function renderMenuPrincipal(){
    const gridCat = document.getElementById('grid-categorias');
    if (gridCat && window.CATEGORIAS) {
        gridCat.innerHTML = window.CATEGORIAS.map(c => {
            const cantidad = window.obtenerJuegosDeCategoria(c.id).filter(j => j.disponible).length;
            return `<a class="tarjeta-categoria" href="categorias/${c.id}.html">
                <span class="icono-categoria">${c.icono}</span>
                <span class="nombre-categoria">${c.nombre}</span>
                <span class="cantidad-categoria">${cantidad} disponible${cantidad === 1 ? '' : 's'}</span>
            </a>`;
        }).join('');
    }
    const listaDisp = document.getElementById('lista-disponibles');
    if (listaDisp && window.JUEGOS) {
        const disponibles = window.JUEGOS.filter(j => j.disponible);
        listaDisp.innerHTML = disponibles.map(j => `
            <div class="tarjeta-juego" onclick="abrirJuego('${j.id}')">
                <div class="icono-juego">${j.icono}</div>
                <div class="info-juego">
                    <h3>${j.nombre}</h3>
                    <p>${j.descripcion}</p>
                </div>
            </div>`).join('');
    }
}

function iniciarJuegos(){
    renderMenuPrincipal();
    // Si venimos de una página de categoría con ?juego=id, entramos
    // directo a ese juego en vez de mostrar el menú principal.
    const params = new URLSearchParams(window.location.search);
    const juegoPedido = params.get('juego');
    if (juegoPedido && document.getElementById('pantalla-' + juegoPedido)) {
        abrirJuego(juegoPedido);
    }
}
