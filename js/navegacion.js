// ==================== NAVEGACIÓN ENTRE JUEGOS ====================
async function abrirJuego(juego){
    vibrarJ(12);
    const pantalla = document.getElementById('pantalla-' + juego);
    if (!pantalla) return; // juego todavía no disponible
    document.querySelectorAll('.pantalla-juego').forEach(p => p.classList.remove('activa'));
    pantalla.classList.add('activa');

    // El código de cada juego se descarga recién ahora, la primera vez
    // que se abre (ver js/cargador-juegos.js). Si ya se abrió antes en
    // esta sesión, esto resuelve al toque y no se nota.
    const contenido = document.getElementById('contenido-' + juego);
    const yaTieneContenido = contenido && contenido.innerHTML.trim().length > 0;
    if (contenido && !yaTieneContenido) {
        contenido.innerHTML = '<div class="panel texto-centro texto-tenue">Cargando…</div>';
    }
    try {
        await window.asegurarJuegoCargado(juego);
    } catch (err) {
        console.error('Error cargando el juego', juego, err);
        if (contenido) contenido.innerHTML = '<div class="panel texto-centro texto-tenue">⚠️ No se pudo cargar este juego. Revisá tu conexión e intentá de nuevo.</div>';
        return;
    }

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
    if (juego === 'tateti') iniciarTateti();
    if (juego === 'conecta4') iniciarConecta4();
    if (juego === 'reflejos') iniciarReflejos();
    if (juego === 'mascota') iniciarMascota();
    if (juego === 'escoba') iniciarEscoba();
    if (juego === 'batallanaval') iniciarBatallaNaval();
    if (juego === 'espejo') iniciarEspejo();
    if (juego === 'mentiraverdad') iniciarMentiraVerdad();

    // Los juegos de "responder y revelar" comparten un mismo motor
    // genérico (js/motor-reflexion.js): todos arrancan igual, sólo
    // cambia su configuración (banco de preguntas y textos).
    const JUEGOS_MOTOR_REFLEXION = ['dilema', 'quehariassi', 'futuro', 'maquinatiempo', 'antesdedormir', 'album', 'nuncapregunte', 'conoceme', 'detective', 'destino', 'decisiones'];
    if (JUEGOS_MOTOR_REFLEXION.includes(juego)) iniciarReflexionGenerico(juego);

    if (juego === 'mentegemela') iniciarMenteGemela();
    if (juego === 'adn') iniciarAdn();
    if (juego === 'palabraexplosiva') iniciarPalabraExplosiva();
    if (juego === 'memoria') iniciarMemoria();
    if (juego === 'adivinaquien') iniciarAdivinaQuien();
    if (juego === 'tiraafloja') iniciarTiraAfloja();
    if (juego === 'arbol') iniciarArbol();
    if (juego === 'refugio') iniciarRefugio();
    if (juego === 'puntoencuentro') iniciarPuntoEncuentro();
    if (juego === 'dibujayadivina') iniciarDibujaYAdivina();
    if (juego === 'cartas') iniciarCartas();
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
    if (window._unsubTateti) { window._unsubTateti(); window._unsubTateti = null; }
    if (window._unsubConecta4) { window._unsubConecta4(); window._unsubConecta4 = null; }
    if (window._unsubReflejos) { window._unsubReflejos(); window._unsubReflejos = null; }
    if (window._unsubMascota) { window._unsubMascota(); window._unsubMascota = null; }
    if (window._unsubEscoba) { window._unsubEscoba(); window._unsubEscoba = null; }
    if (window._unsubBatallaNaval) { window._unsubBatallaNaval(); window._unsubBatallaNaval = null; }
    if (window._unsubEspejoLista) { window._unsubEspejoLista(); window._unsubEspejoLista = null; }
    if (window._unsubEspejoActual) { window._unsubEspejoActual(); window._unsubEspejoActual = null; }
    if (window._unsubMentiraVerdad) { window._unsubMentiraVerdad(); window._unsubMentiraVerdad = null; }

    // Listeners del motor de reflexión: usan claves dinámicas por
    // juego (_unsubReflexionLista_<id> / _unsubReflexionActual_<id>),
    // así que se barren todos juntos en vez de listarlos uno por uno.
    Object.keys(window).forEach((k) => {
        if ((k.startsWith('_unsubReflexionLista_') || k.startsWith('_unsubReflexionActual_')) && typeof window[k] === 'function') {
            window[k](); window[k] = null;
        }
    });

    if (window._unsubMenteGemela) { window._unsubMenteGemela(); window._unsubMenteGemela = null; }
    if (window._unsubAdn) { window._unsubAdn(); window._unsubAdn = null; }
    if (window._unsubPalabraExplosiva) { window._unsubPalabraExplosiva(); window._unsubPalabraExplosiva = null; }
    if (window._unsubMemoria) { window._unsubMemoria(); window._unsubMemoria = null; }
    if (window._unsubAdivinaQuien) { window._unsubAdivinaQuien(); window._unsubAdivinaQuien = null; }
    if (window._unsubTiraAfloja) { window._unsubTiraAfloja(); window._unsubTiraAfloja = null; }
    if (window._intervaloTA) { clearInterval(window._intervaloTA); window._intervaloTA = null; }
    if (window._timerPE) { clearInterval(window._timerPE); window._timerPE = null; }
    if (window._unsubArbol) { window._unsubArbol(); window._unsubArbol = null; }
    if (window._unsubRefugio) { window._unsubRefugio(); window._unsubRefugio = null; }
    if (window._unsubPuntosRefugio) { window._unsubPuntosRefugio(); window._unsubPuntosRefugio = null; }
    if (window._unsubPuntosEncuentro) { window._unsubPuntosEncuentro(); window._unsubPuntosEncuentro = null; }
    if (window._unsubDibujaYAdivina) { window._unsubDibujaYAdivina(); window._unsubDibujaYAdivina = null; }
    if (window._unsubCartasLista) { window._unsubCartasLista(); window._unsubCartasLista = null; }
    if (window._unsubCartasActual) { window._unsubCartasActual(); window._unsubCartasActual = null; }
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
