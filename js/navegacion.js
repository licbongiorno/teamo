// ==================== NAVEGACIÓN ENTRE JUEGOS ====================
// Juegos viejos que arrancan con una función global iniciarX() (los
// nuevos se registran solos en window.INICIAR_JUEGO).
const ARRANQUE_JUEGOS = {
    ahorcado: 'iniciarAhorcado', frutas: 'iniciarFrutas', truco: 'iniciarTruco', letras: 'iniciarLetras', damas: 'iniciarDamas',
    ajedrez: 'iniciarAjedrez', jardin: 'iniciarJardin', indagacion: 'iniciarIndagacion', ruleta: 'iniciarRuleta', verdadoreto: 'iniciarVerdadOReto',
    tateti: 'iniciarTateti', conecta4: 'iniciarConecta4', reversi: 'iniciarReversi', mentiroso: 'iniciarMentiroso',
    dosverdades: 'iniciarDosVerdades', pingpong: 'iniciarPingPong', cajitas: 'iniciarCajitas', generala: 'iniciarGenerala',
    tuttifrutti: 'iniciarTuttiFrutti', palabras: 'iniciarPalabras', reflejos: 'iniciarReflejos', mascota: 'iniciarMascota', escoba: 'iniciarEscoba',
    batallanaval: 'iniciarBatallaNaval', espejo: 'iniciarEspejo', mentiraverdad: 'iniciarMentiraVerdad', mentegemela: 'iniciarMenteGemela',
    adn: 'iniciarAdn', palabraexplosiva: 'iniciarPalabraExplosiva', memoria: 'iniciarMemoria', adivinaquien: 'iniciarAdivinaQuien',
    tiraafloja: 'iniciarTiraAfloja', arbol: 'iniciarArbol', refugio: 'iniciarRefugio', puntoencuentro: 'iniciarPuntoEncuentro',
    dibujayadivina: 'iniciarDibujaYAdivina', cartas: 'iniciarCartas', capsula: 'iniciarCapsula', mapa: 'iniciarMapa',
    escaperoom: 'iniciarEscapeRoom', ruedapremios: 'iniciarRuedaPremios', termometro: 'iniciarTermometro', veinte: 'iniciarVeinte',
    estadisticas: 'iniciarEstadisticas', ranking: 'iniciarRanking', sudoku: 'iniciarSudoku', uno: 'iniciarUno', chinchon: 'iniciarChinchon',
    burbujas: 'iniciarBurbujas', bombas: 'iniciarBombas', pinatas: 'iniciarPinatas', carreraglobos: 'iniciarCarreraGlobos', ritmo: 'iniciarRitmo',
    bloques: 'iniciarBloques', cocodrilos: 'iniciarCocodrilos', pesca: 'iniciarPesca', ladrillos: 'iniciarLadrillos', calculo: 'iniciarCalculo',
    stroop: 'iniciarStroop', anagramas: 'iniciarAnagramas', tipeo: 'iniciarTipeo', topo: 'iniciarTopo', blancomovil: 'iniciarBlancoMovil',
    buscaminas: 'iniciarBuscaminas', ppt: 'iniciarPPT', trivia: 'iniciarTrivia', quientienerazon: 'iniciarQuienTieneRazon',
    menumisterioso: 'iniciarMenuMisterioso', semaforo: 'iniciarSemaforo', serenata: 'iniciarSerenata', debeuna: 'iniciarDebeUna',
    duelomemes: 'iniciarDueloMemes', traductorenojos: 'iniciarTraductorEnojos', barometro: 'iniciarBarometro', capsulavoz: 'iniciarCapsulaVoz',
    nostalgia: 'iniciarNostalgia', simon: 'iniciarSimon', memoriarelampago: 'iniciarMemoriaRelampago',
};
async function abrirJuego(juego){
    vibrarJ(12);
    if (window.sfx) window.sfx.abrirJuego();
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

    // Cada juego arranca con su función (tabla de abajo) o, los nuevos, por el registro.
    const arranque = ARRANQUE_JUEGOS[juego] && window[ARRANQUE_JUEGOS[juego]];
    if (typeof arranque === 'function') arranque();

    // Los juegos de "responder y revelar" comparten un mismo motor
    // genérico (js/motor-reflexion.js): todos arrancan igual, sólo
    // cambia su configuración (banco de preguntas y textos).
    const JUEGOS_MOTOR_REFLEXION = ['dilema', 'quehariassi', 'futuro', 'maquinatiempo', 'antesdedormir', 'album', 'nuncapregunte', 'conoceme', 'detective', 'destino', 'decisiones', 'trivianosotros', 'batallacanciones', 'queprefieres', 'masprobable', 'completafrase', 'preguntadia', 'tepreguntoyo', 'treintayseis', 'mapaamor'];
    if (JUEGOS_MOTOR_REFLEXION.includes(juego)) iniciarReflexionGenerico(juego);

    // Los juegos nuevos se registran solos (js/juegos/base-turnos.js).
    if (window.INICIAR_JUEGO && window.INICIAR_JUEGO[juego]) window.INICIAR_JUEGO[juego]();

    // Presencia: mientras estamos en un juego (no en el menú), avisamos
    // cada tanto que estamos acá, para que el otro vea "está jugando
    // ahora" si entra en simultáneo.
    if (typeof iniciarLatidoPresencia === 'function' && juego !== 'menu') iniciarLatidoPresencia(juego);
    // Deja constancia en la URL de qué juego está abierto, así un link
    // desde una página de categoría (categorias/*.html) puede llevar
    // directo a un juego con ?juego=id, y el botón "atrás" del navegador
    // también tiene sentido.
    const params = new URLSearchParams(window.location.search);
    params.set('juego', juego);
    history.replaceState(null, '', '?' + params.toString());
    document.dispatchEvent(new CustomEvent('juego-abierto', { detail: juego }));
}
function cerrarJuego(){
    vibrarJ(12);
    if (window.sfx) window.sfx.cerrarJuego();
    detenerListenersActivos();
    if (typeof detenerLatidoPresencia === 'function') detenerLatidoPresencia();
    if (typeof detenerCronometroTurno === 'function') detenerCronometroTurno();
    document.querySelectorAll('.pantalla-juego').forEach(p => p.classList.remove('activa'));
    document.getElementById('pantalla-menu').classList.add('activa');
    const params = new URLSearchParams(window.location.search);
    params.delete('juego');
    const query = params.toString();
    history.replaceState(null, '', query ? '?' + query : window.location.pathname);
    // El menú (favoritos, seguir jugando, sugerencia) se actualiza al volver.
    document.dispatchEvent(new CustomEvent('juego-cerrado'));
}
// Escuchas que pertenecen al menú (no a un juego) y tienen que seguir
// vivas aunque se cierre el juego.
const _ESCUCHAS_PERMANENTES = ['_unsubDesafioSemanal'];
const _TEMPORIZADORES_JUEGOS = {
    _loopFrutas: 'cuadro', _loopBurbujas: 'cuadro', _loopPesca: 'cuadro',
    _timerFrutas: 'reloj', _intervaloJardin: 'reloj', _intervaloTA: 'reloj', _timerPE: 'reloj', _tickRitmoTimeout: 'reloj', _tickLadrillos: 'reloj',
    _loopGlobos: 'reloj', _timerPinatas: 'reloj', _timerCocodrilos: 'reloj', _spawnLoopCocodrilos: 'reloj', _timerCaidaBloques: 'reloj',
    _detenerRondaPinatas: 'funcion', _resizeHandlerPesca: 'resize',
};
function detenerListenersActivos(){
    // Antes acá se cortaban sólo 5 escuchas; las de los otros ~70 juegos
    // quedaban abiertas para siempre después de cerrarlos (bajando datos
    // y redibujando pantallas ocultas en cada cambio). Con varios juegos
    // abiertos en una misma visita, la app se ponía cada vez más lenta.
    // Ahora se corta toda escucha de juego (window._unsub*). Cada juego
    // vuelve a abrir la suya en su iniciar*() al reabrirlo.
    Object.keys(window).forEach((clave) => {
        if (!clave.startsWith('_unsub') || _ESCUCHAS_PERMANENTES.includes(clave)) return;
        const fn = window[clave];
        if (typeof fn === 'function') { try { fn(); } catch (e) { /* ya estaba cortada */ } }
        window[clave] = null;
    });
    // Bucles y temporizadores de los juegos viejos que no se llaman _unsub*.
    Object.entries(_TEMPORIZADORES_JUEGOS).forEach(([clave, tipo]) => {
        const v = window[clave];
        if (!v) return;
        try {
            if (tipo === 'cuadro') cancelAnimationFrame(v);
            else if (tipo === 'reloj') clearTimeout(v); // sirve igual para setInterval
            else if (tipo === 'funcion') v();
            else if (tipo === 'resize') window.removeEventListener('resize', v);
        } catch (e) { /* ya estaba cortado */ }
        window[clave] = null;
    });
}

function jugarAlAzar(){
    vibrarJ(15);
    if (window.sfx) window.sfx.dado();
    if (!window.JUEGOS) return;
    const disponibles = window.JUEGOS.filter(j => j.disponible);
    if (!disponibles.length) return;
    // Si ya hay un juego abierto, lo excluye para no repetir el mismo.
    const params = new URLSearchParams(window.location.search);
    const actual = params.get('juego');
    const candidatos = disponibles.filter(j => j.id !== actual);
    const lista = candidatos.length ? candidatos : disponibles;
    const elegido = lista[Math.floor(Math.random() * lista.length)];
    abrirJuego(elegido.id);
}

function renderMenuPrincipal(){
    const gridCat = document.getElementById('grid-categorias');
    if (gridCat && window.CATEGORIAS) {
        gridCat.innerHTML = window.CATEGORIAS.map(c => {
            const cantidad = window.obtenerJuegosDeCategoria(c.id).filter(j => j.disponible).length;
            return `<a class="tarjeta-categoria" href="categorias/index.html?c=${c.id}" style="--color-cat:${c.color};">
                <svg class="icono-svg icono-categoria"><use href="#${c.iconoSvg}"></use></svg>
                <span class="nombre-categoria">${c.nombre}</span>
                <span class="cantidad-categoria">${cantidad} disponible${cantidad === 1 ? '' : 's'}</span>
            </a>`;
        }).join('');
    }
    // Antes acá abajo se listaban TODOS los juegos disponibles (~58),
    // duplicando uno por uno lo que ya se puede recorrer por categoría
    // apenas un tap más abajo. En vez de esa lista larga y genérica,
    // se destaca uno solo por día — la misma sugerencia para los dos,
    // pensada como punto de partida ("¿a qué jugamos hoy?") y no como
    // otro catálogo repetido.
    const destacadoEl = document.getElementById('destacado-hoy');
    if (destacadoEl && typeof window.renderRecomendador === 'function') {
        window.renderRecomendador(); // js/recomendador.js: elige según el momento
    } else if (destacadoEl && window.JUEGOS) {
        const disponibles = window.JUEGOS.filter(j => j.disponible);
        if (disponibles.length) {
            const hoy = new Date();
            const semilla = hoy.getFullYear() * 372 + (hoy.getMonth() + 1) * 31 + hoy.getDate();
            const elegido = disponibles[semilla % disponibles.length];
            destacadoEl.innerHTML = window.tarjetaJuegoHTML(elegido, { destacado: true });
        }
    }
}

// Buscador del menú principal: con más de 70 juegos en el catálogo,
// encontrar uno puntual por categoría se hace lento. Filtra por
// nombre (sin importar mayúsculas/acentos) y, mientras hay texto
// escrito, tapa el resto del menú (desafío, sugerencia, categorías)
// para no duplicar la pantalla.
function _normalizarBusquedaJuegos(t){
    return (t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}
function buscarJuegos(){
    const input = document.getElementById('buscador-juegos');
    const resultados = document.getElementById('resultados-busqueda-juegos');
    const seccionesNormales = document.getElementById('secciones-normales-menu');
    if (!input || !resultados) return;
    const q = _normalizarBusquedaJuegos(input.value);
    if (!q) {
        resultados.style.display = 'none';
        resultados.innerHTML = '';
        if (seccionesNormales) seccionesNormales.style.display = '';
        return;
    }
    if (seccionesNormales) seccionesNormales.style.display = 'none';
    resultados.style.display = '';
    // Por nombre primero; después los que lo dicen en la descripción (ej. "cartas", "fútbol").
    const disponibles = (window.JUEGOS || []).filter(j => j.disponible);
    const porNombre = disponibles.filter(j => _normalizarBusquedaJuegos(j.nombre).includes(q));
    const encontrados = [...porNombre, ...disponibles.filter(j => !porNombre.includes(j) && _normalizarBusquedaJuegos(j.descripcion).includes(q))];
    if (!encontrados.length) {
        resultados.innerHTML = '<p class="texto-tenue texto-centro">No encontramos ningún juego con ese nombre.</p>';
        return;
    }
    resultados.innerHTML = encontrados.slice(0, 30).map(j => window.tarjetaJuegoHTML(j)).join('');
}
window.buscarJuegos = buscarJuegos;

function iniciarJuegos(){
    renderMenuPrincipal();
    // "Nuestro progreso" recuerda si lo dejaron abierto
    const progreso = document.getElementById('nuestro-progreso');
    if (progreso) {
        try { progreso.open = localStorage.getItem('progresoAbierto') === '1'; } catch (e) { /* nada */ }
        progreso.addEventListener('toggle', () => { try { localStorage.setItem('progresoAbierto', progreso.open ? '1' : '0'); } catch (e) { /* nada */ } });
    }
    if (typeof aplicarTemaGuardado === 'function') aplicarTemaGuardado();
    if (typeof registrarActividadRacha === 'function') registrarActividadRacha();
    if (typeof iniciarDesafioSemanal === 'function') iniciarDesafioSemanal();
    if (typeof iniciarEscuchaPresencia === 'function') iniciarEscuchaPresencia();
    if (typeof iniciarNocheDeJuegos === 'function') iniciarNocheDeJuegos();
    if (typeof iniciarTeToca === 'function') {
        iniciarTeToca(miIdentidad, (p) => { renderTarjetaTeToca(p); actualizarTituloTeToca(p); if (typeof renderBarraEnVivo === 'function') renderBarraEnVivo(); });
    }
    _verificarNostalgiaNueva();
    // El indicador de "mensaje nuevo" en la burbuja de chat empieza a
    // escuchar apenas sabemos quiénes somos, no recién cuando se abre
    // el chat (así detecta mensajes que llegaron mientras no mirábamos).
    if (typeof iniciarEscuchaChatNoLeidos === 'function') iniciarEscuchaChatNoLeidos();
    // Si venimos de una página de categoría con ?juego=id, entramos
    // directo a ese juego en vez de mostrar el menú principal.
    const params = new URLSearchParams(window.location.search);
    const juegoPedido = params.get('juego');
    if (juegoPedido && document.getElementById('pantalla-' + juegoPedido)) {
        abrirJuego(juegoPedido);
    }
}

// ==================== AVISO DE MODO NOSTALGIA ====================
// Cuando arranca un mes nuevo (comparado con el último que vieron en
// este dispositivo), avisa con un toast que el resumen del mes
// anterior está listo. Se guarda en localStorage (por dispositivo,
// no compartido) — no hace falta tocar Firestore para esto, y cada
// uno lo ve una sola vez por mes en su propio teléfono.
function _verificarNostalgiaNueva(){
    try {
        const hoy = new Date();
        const claveMesActual = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
        const ultimaVista = localStorage.getItem('nostalgiaVista');
        if (ultimaVista === claveMesActual) return; // ya se mostró este mes en este dispositivo
        localStorage.setItem('nostalgiaVista', claveMesActual);
        if (!ultimaVista) return; // primera vez que se abre el sitio: no hay "mes pasado" que mostrar todavía
        _mostrarToastNostalgia();
    } catch (e) { /* localStorage puede fallar en modo privado; no rompe nada */ }
}

function _mostrarToastNostalgia(){
    const toast = document.createElement('div');
    toast.className = 'toast-logro';
    toast.style.cursor = 'pointer';
    toast.innerHTML = `<div class="toast-logro-icono">🎁</div>
        <div><div class="toast-logro-titulo">Modo Nostalgia</div><div class="toast-logro-nombre">Su resumen del mes pasado está listo</div></div>`;
    toast.onclick = () => { toast.remove(); abrirJuego('nostalgia'); };
    document.body.appendChild(toast);
    vibrarJ([15, 40, 15]);
    if (window.sfx) window.sfx.logro();
    setTimeout(() => toast.classList.add('toast-logro-salir'), 5500);
    setTimeout(() => toast.remove(), 6000);
}
