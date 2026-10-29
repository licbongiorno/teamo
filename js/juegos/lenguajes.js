// ==================== LENGUAJES DEL AMOR ====================
// Un test cortito (15 pares de opciones) para cada uno, a solas. Cuando
// los dos lo hicieron, se ven los resultados comparados y consejos para
// "llenarle el tanque" al otro. Doc juegos/lenguajes:
// { nico: {r: 'PTRS…', fecha}, carito: {…} }  (una letra por respuesta)
const LENGUAJES_AMOR = {
    P: { nombre: 'Palabras de afirmación', icono: '💬', color: '#ffb3c6', tip: 'Decíselo en palabras: un mensaje lindo en el medio del día, un "qué bien lo hiciste", un te amo sin motivo.' },
    T: { nombre: 'Tiempo de calidad', icono: '⏳', color: '#a8d8ff', tip: 'Regalale atención: un rato juntos sin celular, una charla larga, una cita planeada sólo para los dos.' },
    R: { nombre: 'Regalos', icono: '🎁', color: '#f5d9a0', tip: 'Los detalles cuentan: algo chiquito que muestre que te acordaste, aunque sea su antojo favorito.' },
    S: { nombre: 'Actos de servicio', icono: '🛠️', color: '#b5e8c8', tip: 'Ayudá con lo que le pesa: cocinar después de un día largo, un trámite, una tarea de la casa sin que lo pida.' },
    C: { nombre: 'Contacto físico', icono: '🤗', color: '#d7b8ff', tip: 'El cuerpo también habla: abrazos largos, besos al llegar, mimos en el sillón, caminar de la mano.' },
};
const PARES_LENGUAJES = [
    ['P', 'Que me diga que está orgulloso/a de mí', 'T', 'Pasar una tarde entera juntos, sin celulares'],
    ['R', 'Que me sorprenda con un regalito sin motivo', 'S', 'Que me resuelva una tarea que me pesa'],
    ['C', 'Un abrazo largo cuando llego cansado/a', 'P', 'Un mensaje lindo en el medio del día'],
    ['T', 'Que planee una salida sólo para los dos', 'R', 'Que me traiga algo que le hizo acordarse de mí'],
    ['S', 'Que me cocine cuando tuve un día largo', 'C', 'Que me agarre la mano cuando caminamos'],
    ['P', 'Que me diga "te amo" sin que se lo pida', 'R', 'Recibir una carta o un detalle hecho a mano'],
    ['T', 'Una charla larga y profunda, con atención total', 'S', 'Que me ayude a ordenar sin que se lo pida'],
    ['C', 'Mimos en el sillón mirando una serie', 'R', 'Un regalo de cumpleaños pensado con tiempo'],
    ['P', 'Que me diga que confía en mí', 'S', 'Que se ocupe de algo para que yo pueda descansar'],
    ['T', 'Hacer algo nuevo juntos, una aventura', 'C', 'Un beso apenas nos vemos'],
    ['P', 'Que reconozca mis esfuerzos en voz alta', 'C', 'Que me haga masajes o me acaricie el pelo'],
    ['R', 'Que me traiga mi antojo favorito', 'T', 'Una videollamada larga sólo para charlar'],
    ['S', 'Que se acuerde de algo que me importa sin que se lo recuerde', 'P', 'Que me diga cosas lindas delante de otros'],
    ['C', 'Dormir abrazados', 'T', 'Un desayuno tranquilo juntos, sin apuro'],
    ['R', 'Una sorpresa en una fecha especial', 'S', 'Que me lleve o me busque cuando lo necesito'],
];
let _lenguajesDatos = null, _lenguajesRespuestas = [], _lenguajesRehaciendo = false, _lenguajesEnTest = false;

function _refLenguajes(){ return window.doc(window.db, 'juegos', 'lenguajes'); }
function _conteoLenguajes(r){
    const c = { P: 0, T: 0, R: 0, S: 0, C: 0 };
    [...(r || '')].forEach(k => { if (c[k] != null) c[k]++; });
    return c;
}
function _ordenLenguajes(r){ const c = _conteoLenguajes(r); return Object.keys(c).sort((a, b) => c[b] - c[a]); }

function iniciarLenguajes(){
    _lenguajesRespuestas = []; _lenguajesRehaciendo = false; _lenguajesEnTest = false;
    const cont = document.getElementById('contenido-lenguajes');
    cont.innerHTML = `<div class="panel texto-centro texto-tenue">Cargando…</div>`;
    if (window._unsubLenguajes) window._unsubLenguajes();
    window._unsubLenguajes = window.onSnapshot(_refLenguajes(), (snap) => {
        const antes = _lenguajesDatos && _lenguajesDatos[miRival];
        _lenguajesDatos = snap.exists() ? snap.data() : {};
        if (!antes && _lenguajesDatos[miRival] && _lenguajesDatos[miIdentidad] && window.sfx) window.sfx.revelar();
        renderLenguajes();
    }, (err) => { cont.innerHTML = `<div class="panel texto-centro texto-tenue">⚠️ No se pudo conectar (${err.code || 'error'}).</div>`; });
}

function _barrasLenguajes(r){
    const c = _conteoLenguajes(r), max = PARES_LENGUAJES.length * 2 / 5;
    return _ordenLenguajes(r).map(k => `<div class="barra-lenguaje"><span>${LENGUAJES_AMOR[k].icono} ${LENGUAJES_AMOR[k].nombre}</span>
        <div><i style="width:${Math.round(Math.min(1, c[k] / max) * 100)}%; background:${LENGUAJES_AMOR[k].color};"></i></div><b>${c[k]}</b></div>`).join('');
}

function renderLenguajes(){
    const cont = document.getElementById('contenido-lenguajes');
    if (!cont) return;
    const d = _lenguajesDatos || {}, mio = d[miIdentidad], suyo = d[miRival];
    if (!mio || _lenguajesRehaciendo) {
        if (!_lenguajesEnTest) {
            cont.innerHTML = `<div class="panel texto-centro">
                <p class="texto-tenue">Cada persona siente el amor de una manera distinta. Con 15 preguntas rápidas descubrís cuál es tu lenguaje del amor, y cuando ${nombreJugador(miRival)} lo haga también, ven los dos resultados juntos.</p>
                <div style="font-size:2rem; margin:6px 0;">${Object.values(LENGUAJES_AMOR).map(l => l.icono).join(' ')}</div>
                <button class="btn-principal" onclick="empezarLenguajes()">Empezar el test</button>
                ${suyo ? `<div class="texto-tenue" style="font-size:0.8rem; margin-top:8px;">✅ ${nombreJugador(miRival)} ya lo hizo: te está esperando.</div>` : ''}
            </div>`;
            return;
        }
        const n = _lenguajesRespuestas.length;
        const [ka, ta, kb, tb] = PARES_LENGUAJES[n];
        cont.innerHTML = `<div class="panel texto-centro">
            <div class="progreso-orden"><div style="width:${Math.round(n * 100 / PARES_LENGUAJES.length)}%"></div></div>
            <div class="texto-tenue" style="font-size:0.8rem;">${n + 1} de ${PARES_LENGUAJES.length}</div>
            <p style="font-family:var(--fuente-titulo); font-size:1.15rem; margin:10px 0 14px;">¿Qué te llega más al corazón?</p>
            <button class="opcion-lenguaje" onclick="elegirLenguaje('${ka}')">${ta}</button>
            <button class="opcion-lenguaje" onclick="elegirLenguaje('${kb}')">${tb}</button>
        </div>`;
        return;
    }
    const miTop = LENGUAJES_AMOR[_ordenLenguajes(mio.r)[0]];
    let h = `<div class="panel texto-centro logro-animado"><div class="texto-tenue" style="font-size:0.8rem;">Tu lenguaje principal</div>
        <div style="font-size:2.4rem;">${miTop.icono}</div><div style="font-family:var(--fuente-titulo); font-size:1.3rem;">${miTop.nombre}</div></div>
        <div class="panel"><div class="texto-tenue" style="font-size:0.8rem; margin-bottom:6px;">Vos</div>${_barrasLenguajes(mio.r)}</div>`;
    if (suyo) {
        const suTop = _ordenLenguajes(suyo.r);
        h += `<div class="panel"><div class="texto-tenue" style="font-size:0.8rem; margin-bottom:6px;">${nombreJugador(miRival)}</div>${_barrasLenguajes(suyo.r)}</div>
            <div class="panel"><b>💡 Para llenarle el tanque a ${nombreJugador(miRival)}</b>
            ${suTop.slice(0, 2).map(k => `<p style="margin:8px 0 0;">${LENGUAJES_AMOR[k].icono} <b>${LENGUAJES_AMOR[k].nombre}:</b> ${LENGUAJES_AMOR[k].tip}</p>`).join('')}</div>`;
        if (suTop[0] === _ordenLenguajes(mio.r)[0]) h += `<div class="panel texto-centro">💞 ¡Hablan el mismo idioma del amor!</div>`;
    } else {
        h += `<div class="panel texto-centro texto-tenue destello">Cuando ${nombreJugador(miRival)} haga el test, van a ver los dos resultados juntos.</div>`;
    }
    h += `<button class="btn-secundario" onclick="rehacerLenguajes()">🔄 Volver a hacer el test</button>`;
    cont.innerHTML = h;
}

function empezarLenguajes(){
    vibrarJ(10);
    _lenguajesEnTest = true;
    _lenguajesRespuestas = [];
    renderLenguajes();
}
async function elegirLenguaje(k){
    vibrarJ(10);
    if (window.sfx) window.sfx.click();
    if (!_lenguajesEnTest || !LENGUAJES_AMOR[k]) return;
    _lenguajesRespuestas.push(k);
    if (_lenguajesRespuestas.length < PARES_LENGUAJES.length) { renderLenguajes(); return; }
    const r = _lenguajesRespuestas.join('');
    _lenguajesRespuestas = []; _lenguajesEnTest = false; _lenguajesRehaciendo = false;
    try {
        await window.runTransaction(window.db, async (tx) => {
            const s = await tx.get(_refLenguajes());
            tx.set(_refLenguajes(), { ...(s.exists() ? s.data() : {}), [miIdentidad]: { r, fecha: Date.now() } });
        });
        if (window.fx) window.fx.confeti(40);
        if (typeof registrarEvento === 'function') registrarEvento('reflexion_completada', 'Descubrió su lenguaje del amor');
    } catch (e) { console.error('No se pudo guardar el test:', e); }
    renderLenguajes();
}
function rehacerLenguajes(){
    _lenguajesRehaciendo = true;
    _lenguajesEnTest = false;
    _lenguajesRespuestas = [];
    renderLenguajes();
}

window.INICIAR_JUEGO = window.INICIAR_JUEGO || {};
window.INICIAR_JUEGO.lenguajes = iniciarLenguajes;
