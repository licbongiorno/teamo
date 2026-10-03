// ============================================================
// te-toca.js — "¡Te toca!": avisa en qué juegos por turnos le toca
// jugar a cada uno, sin tener que entrar juego por juego a fijarse.
//
// Escucha en vivo el documento de cada juego por turnos (son pocos y
// chicos; si el juego está abierto, Firestore comparte la misma
// escucha, no baja los datos dos veces) y arma la lista de:
//   - partidas donde ME toca (turno mío, o el otro ya está listo y
//     falta que yo toque "Estoy listo"),
//   - partidas donde estoy esperando al otro, con un botón para
//     avisarle por WhatsApp.
//
// Se usa en juegos.html (tarjeta arriba del menú) y en index.html
// (globito sobre el planeta Juegos). Si la pestaña está en segundo
// plano y aparece un turno nuevo, muestra una notificación del
// sistema (si la persona la habilitó).
//
// Una partida abandonada podría quedar "te toca" para siempre: por
// eso cada aviso se puede ocultar con ✕, y vuelve a aparecer sólo
// cuando esa partida cambia.
// ============================================================

var NUMEROS_WHATSAPP_PAREJA = { nico: '5493516575261', carito: '5491170131229' };

// Para cada juego: lista de { quien, que } con quién tiene que hacer
// algo ahora y qué.
// "esperando" con uno solo anotado: le toca al otro tocar "Estoy listo".
function _faltaListo(d){
    if (d.fase !== 'esperando') return [];
    const l = d.listos || {};
    if (l.nico && !l.carito) return [{ quien: 'carito', que: 'listo' }];
    if (l.carito && !l.nico) return [{ quien: 'nico', que: 'listo' }];
    return [];
}
function _otroTeToca(x){ return x === 'nico' ? 'carito' : 'nico'; }
// Juegos de revisión cruzada: a cada uno le falta confirmar su revisión.
function _faltaRevisar(fase){
    return (d) => d.fase === fase
        ? ['nico', 'carito'].filter(x => !d['confirmado' + (x === 'nico' ? 'Nico' : 'Carito')]).map(x => ({ quien: x, que: 'revisar' }))
        : _faltaListo(d);
}
function _porTurno(fase){
    return (d) => d.fase === fase && (d.turno === 'nico' || d.turno === 'carito')
        ? [{ quien: d.turno, que: 'turno' }]
        : _faltaListo(d);
}
const DETECTORES_TE_TOCA = {
    tateti: _porTurno('jugando'),
    conecta4: _porTurno('jugando'),
    damas: _porTurno('jugando'),
    ajedrez: _porTurno('jugando'),
    reversi: _porTurno('jugando'),
    cajitas: _porTurno('jugando'),
    generala: _porTurno('jugando'),
    uno: _porTurno('jugando'),
    escoba: _porTurno('jugando'),
    chinchon: _porTurno('jugando'),
    batallanaval: (d) => {
        if (d.fase === 'colocando') {
            const l = d.listos || {};
            return ['nico', 'carito'].filter(x => !l[x]).map(x => ({ quien: x, que: 'colocar' }));
        }
        return _porTurno('atacando')(d);
    },
    truco: (d) => {
        if (d.fase === 'jugando') {
            const c = d.cantoPendiente;
            const quien = c ? (c.de === 'nico' ? 'carito' : 'nico') : d.jugadorEnTurno;
            return quien ? [{ quien, que: c ? 'responder' : 'turno' }] : [];
        }
        return _faltaListo(d);
    },
    mentiroso: _porTurno('jugando'),
    dosverdades: (d) => d.fase === 'adivinando' && d.autor ? [{ quien: d.autor === 'nico' ? 'carito' : 'nico', que: 'adivinar' }] : [],
    ahorcado: (d) => d.fase === 'jugando' && d.adivinador ? [{ quien: d.adivinador, que: 'turno' }] : [],
    veinte: (d) => {
        if (d.fase === 'pensando' && d.pensador) return [{ quien: d.pensador, que: 'pensar' }];
        if (d.fase !== 'jugando' || !d.pensador) return [];
        const ultima = (d.preguntas || [])[(d.preguntas || []).length - 1];
        return ultima && ultima.respuesta == null
            ? [{ quien: d.pensador, que: 'contestar' }]
            : [{ quien: _otroTeToca(d.pensador), que: 'preguntar' }];
    },
    verdadoreto: (d) => {
        if (!d.turno) return [];
        if (d.fase === 'eligiendo' || d.fase === 'esperando_respuesta') return [{ quien: d.turno, que: d.fase === 'eligiendo' ? 'elegir' : 'contestar' }];
        if (d.fase === 'bloqueado') return [{ quien: _otroTeToca(d.turno), que: 'leer' }];
        if (d.fase === 'reto_activo') return [{ quien: _otroTeToca(d.turno), que: 'validar' }];
        return [];
    },
    palabras: _faltaRevisar('revisando'),
    tuttifrutti: _faltaRevisar('corrigiendo'),
};

// Juegos que guardan cada partida como un documento aparte dentro de
// 'juegos' (con un campo tipo): se escuchan con una consulta por tipo
// y cada documento pendiente es un aviso propio.
const COLECCIONES_TE_TOCA = {
    letras: {
        tipo: 'escritura', etiqueta: (d) => d.titulo,
        detectar: (d) => d.estado === 'activa' && d.turno ? [{ quien: d.turno, que: 'escribir' }] : [],
    },
    indagacion: {
        tipo: 'carta-indagacion',
        detectar: (d) => d.fase === 'necesita_respuesta' ? [{ quien: d.creadaPor, que: 'contestar' }]
            : d.fase === 'necesita_adivinanza' ? [{ quien: _otroTeToca(d.creadaPor), que: 'adivinar_respuesta' }] : [],
    },
    serenata: {
        tipo: 'serenata',
        detectar: (d) => d.estado === 'esperando' && d.autor ? [{ quien: _otroTeToca(d.autor), que: 'adivinar_cancion' }] : [],
    },
    duelomemes: {
        tipo: 'meme',
        detectar: (d) => d.estado === 'esperando' && d.autor ? [{ quien: _otroTeToca(d.autor), que: 'calificar' }] : [],
    },
};

const TEXTO_QUE_TE_TOCA = {
    turno: 'tu turno',
    listo: 'te está esperando para empezar',
    colocar: 'ubicá tu flota',
    responder: 'te cantaron, respondé',
    adivinar: '¿cuál es la mentira?',
    pensar: 'pensá algo para que adivine',
    contestar: 'te toca contestar',
    preguntar: 'te toca preguntar',
    elegir: '¿verdad o reto?',
    leer: 'tenés una respuesta para leer',
    validar: 'validá el reto',
    revisar: 'falta tu revisión',
    escribir: 'te toca escribir',
    adivinar_respuesta: '¿qué habrá respondido?',
    adivinar_cancion: '¿qué canción es?',
    calificar: 'calificá el meme',
};

let _teTocaYo = null;
let _teTocaEstados = {};      // clave -> { juego, etiqueta, pendientes, firma } (clave = juego, o juego:docId)
let _teTocaUnsubs = [];       // a propósito no empieza con _unsub: navegacion.js no la corta
let _teTocaAlCambiar = null;
let _teTocaPrimeraVez = {};   // para no notificar lo que ya estaba al abrir

function _leerOcultosTeToca(){
    try { return JSON.parse(localStorage.getItem('teTocaOcultos') || '{}'); } catch (e) { return {}; }
}
function _guardarOcultosTeToca(o){
    try { localStorage.setItem('teTocaOcultos', JSON.stringify(o)); } catch (e) { /* sin almacenamiento */ }
}

// Firma barata del estado de la partida: si cambia, el aviso oculto
// vuelve a mostrarse.
function _firmaTeToca(d){
    const s = JSON.stringify(d);
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
    return String(h);
}

// Lista actual: [{ clave, juego, etiqueta, quien, que }], sin las ocultas.
function pendientesTeToca(){
    const ocultos = _leerOcultosTeToca();
    const res = [];
    Object.entries(_teTocaEstados).forEach(([clave, e]) => {
        if (ocultos[clave] && ocultos[clave] === e.firma) return;
        e.pendientes.forEach(p => res.push({ clave, juego: e.juego, etiqueta: e.etiqueta, ...p }));
    });
    return res;
}

// Guarda el estado de un aviso y notifica si ahora me toca y antes no.
function _actualizarClaveTeToca(clave, juego, d, pendientes, etiqueta){
    const yo = _teTocaYo;
    const antes = _teTocaEstados[clave];
    _teTocaEstados[clave] = { juego, etiqueta: etiqueta || null, pendientes, firma: d ? _firmaTeToca(d) : '' };
    const meTocabaAntes = !!antes && antes.pendientes.some(p => p.quien === yo);
    const meToca = pendientes.find(p => p.quien === yo);
    if (_teTocaPrimeraVez[juego] && meToca && !meTocabaAntes) _notificarTeToca(juego, meToca);
}

function iniciarTeToca(yo, alCambiar){
    if (yo !== 'nico' && yo !== 'carito') return;
    _teTocaAlCambiar = alCambiar;
    if (!window.db) {
        // Firebase todavía no terminó de arrancar: se reintenta solo.
        const reintentar = () => iniciarTeToca(yo, alCambiar);
        document.addEventListener('firebase-listo', reintentar, { once: true });
        document.addEventListener('firebase-listo-index', reintentar, { once: true });
        return;
    }
    if (_teTocaYo === yo && _teTocaUnsubs.length) { alCambiar(pendientesTeToca()); return; }
    _teTocaYo = yo;
    _teTocaUnsubs.forEach(u => { try { u(); } catch (e) {} });
    _teTocaUnsubs = [];
    _teTocaEstados = {};
    _teTocaPrimeraVez = {};
    Object.keys(DETECTORES_TE_TOCA).forEach((juego) => {
        const unsub = window.onSnapshot(window.doc(window.db, 'juegos', juego), (snap) => {
            const d = snap.exists() ? snap.data() : null;
            _actualizarClaveTeToca(juego, juego, d, d ? DETECTORES_TE_TOCA[juego](d) : []);
            _teTocaPrimeraVez[juego] = true;
            if (_teTocaAlCambiar) _teTocaAlCambiar(pendientesTeToca());
        }, (err) => console.warn('te-toca: no se pudo escuchar', juego, err));
        _teTocaUnsubs.push(unsub);
    });
    if (!window.query || !window.where || !window.collection) return;
    Object.entries(COLECCIONES_TE_TOCA).forEach(([juego, cfg]) => {
        const q = window.query(window.collection(window.db, 'juegos'), window.where('tipo', '==', cfg.tipo));
        const unsub = window.onSnapshot(q, (snap) => {
            const vistos = new Set();
            snap.forEach((docSnap) => {
                const d = docSnap.data();
                const pendientes = cfg.detectar(d);
                const clave = `${juego}:${docSnap.id}`;
                if (!pendientes.length && !_teTocaEstados[clave]) return; // nada que avisar ni que limpiar
                vistos.add(clave);
                _actualizarClaveTeToca(clave, juego, d, pendientes, cfg.etiqueta ? cfg.etiqueta(d) : null);
            });
            // Documentos borrados: se sacan de la lista.
            Object.keys(_teTocaEstados).forEach((clave) => {
                if (clave.startsWith(juego + ':') && !vistos.has(clave)) delete _teTocaEstados[clave];
            });
            _teTocaPrimeraVez[juego] = true;
            if (_teTocaAlCambiar) _teTocaAlCambiar(pendientesTeToca());
        }, (err) => console.warn('te-toca: no se pudo escuchar', juego, err));
        _teTocaUnsubs.push(unsub);
    });
}

function ocultarTeToca(clave){
    const e = _teTocaEstados[clave];
    if (!e) return;
    const o = _leerOcultosTeToca();
    o[clave] = e.firma;
    _guardarOcultosTeToca(o);
    if (_teTocaAlCambiar) _teTocaAlCambiar(pendientesTeToca());
}

function _nombreJuegoTeToca(id){
    const j = (window.JUEGOS || []).find(x => x.id === id);
    return j ? { icono: j.icono, nombre: j.nombre } : { icono: '🎮', nombre: id };
}
function _nombrePersonaTeToca(x){ return x === 'carito' ? 'Carito' : 'Nico'; }

// ==================== AVISOS DEL SISTEMA ====================
function _notificarTeToca(juego, pendiente){
    if (!document.hidden) return; // con la app a la vista ya se ve la tarjeta
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    const j = _nombreJuegoTeToca(juego);
    const titulo = `🎯 ¡Te toca en ${j.nombre}!`;
    const cuerpo = pendiente.que === 'listo'
        ? `${_nombrePersonaTeToca(pendiente.quien === 'nico' ? 'carito' : 'nico')} ${TEXTO_QUE_TE_TOCA.listo}.`
        : `${j.icono} ${TEXTO_QUE_TE_TOCA[pendiente.que] || 'tu turno'}`;
    const base = location.pathname.replace(/[^/]*$/, '');
    const opciones = { body: cuerpo, tag: 'te-toca-' + juego, icon: base + 'icons/icon-192.png', data: { url: base + 'juegos.html?juego=' + juego } };
    if (navigator.serviceWorker && navigator.serviceWorker.ready) {
        navigator.serviceWorker.ready.then(reg => reg.showNotification(titulo, opciones)).catch(() => {
            try { new Notification(titulo, opciones); } catch (e) {}
        });
    } else {
        try { new Notification(titulo, opciones); } catch (e) {}
    }
}

function puedePedirAvisosTeToca(){
    return ('Notification' in window) && Notification.permission === 'default';
}
async function activarAvisosTeToca(){
    if (!('Notification' in window)) return;
    try { await Notification.requestPermission(); } catch (e) {}
    if (_teTocaAlCambiar) _teTocaAlCambiar(pendientesTeToca());
}

// ==================== WHATSAPP ====================
function avisarPorWhatsAppTeToca(clave){
    if (typeof vibrarJ === 'function') vibrarJ(10);
    const otro = _teTocaYo === 'nico' ? 'carito' : 'nico';
    const numero = NUMEROS_WHATSAPP_PAREJA[otro];
    const e = _teTocaEstados[clave];
    if (!numero || !e) return;
    const juego = e.juego;
    const j = _nombreJuegoTeToca(juego);
    const p = (e.pendientes || []).find(x => x.quien === otro);
    const base = location.origin + location.pathname.replace(/[^/]*$/, '');
    const enlace = `${base}juegos.html?juego=${encodeURIComponent(juego)}`;
    const frase = p && p.que === 'listo' ? 'te estoy esperando para jugar' : p && p.que === 'responder' ? 'te canté, ¡respondé!' : 'te toca jugar';
    const texto = `${j.icono} ${frase} en ${j.nombre}${e.etiqueta ? ` ("${e.etiqueta}")` : ''} 😏\n${enlace}`;
    window.open(`https://wa.me/${numero}?text=${encodeURIComponent(texto)}`, '_blank');
}

// ==================== TARJETA (juegos.html) ====================
function renderTarjetaTeToca(pendientes){
    const cont = document.getElementById('te-toca');
    if (!cont) return;
    const yo = _teTocaYo;
    const mios = pendientes.filter(p => p.quien === yo);
    const delOtro = pendientes.filter(p => p.quien !== yo && !mios.some(m => m.clave === p.clave));
    const esc = (t) => String(t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const nombreFila = (p, j) => `${j.icono} ${j.nombre}${p.etiqueta ? ` · <i>${esc(p.etiqueta)}</i>` : ''}`;
    if (!mios.length && !delOtro.length) { cont.innerHTML = ''; return; }
    const otro = _nombrePersonaTeToca(yo === 'nico' ? 'carito' : 'nico');
    let html = `<div class="panel tarjeta-te-toca">`;
    if (mios.length) {
        html += `<div class="titulo-te-toca">🎯 ¡Te toca!</div>`;
        html += mios.map(p => {
            const j = _nombreJuegoTeToca(p.juego);
            const texto = p.que === 'listo' ? `${otro} ${TEXTO_QUE_TE_TOCA.listo}` : TEXTO_QUE_TE_TOCA[p.que];
            return `<div class="fila-te-toca mia">
                <button class="abrir-te-toca" onclick="abrirJuego('${p.juego}')"><span>${nombreFila(p, j)}</span><small>${texto}</small></button>
                <button class="cerrar-te-toca" aria-label="Ocultar" onclick="ocultarTeToca('${p.clave}')">✕</button>
            </div>`;
        }).join('');
    }
    if (delOtro.length) {
        html += `<div class="subtitulo-te-toca">⏳ Esperando a ${otro}</div>`;
        html += delOtro.map(p => {
            const j = _nombreJuegoTeToca(p.juego);
            return `<div class="fila-te-toca">
                <button class="abrir-te-toca" onclick="abrirJuego('${p.juego}')"><span>${nombreFila(p, j)}</span></button>
                <button class="btn-whatsapp-te-toca" onclick="avisarPorWhatsAppTeToca('${p.clave}')">📲 Avisale</button>
                <button class="cerrar-te-toca" aria-label="Ocultar" onclick="ocultarTeToca('${p.clave}')">✕</button>
            </div>`;
        }).join('');
    }
    if (puedePedirAvisosTeToca()) {
        html += `<button class="btn-secundario btn-avisos-te-toca" onclick="activarAvisosTeToca()">🔔 Avisarme cuando me toque</button>`;
    }
    html += `</div>`;
    cont.innerHTML = html;
}

// Pestaña del navegador: "(2) …" cuando hay turnos tuyos pendientes.
let _tituloOriginalTeToca = null;
function actualizarTituloTeToca(pendientes){
    if (_tituloOriginalTeToca === null) _tituloOriginalTeToca = document.title;
    const n = pendientes.filter(p => p.quien === _teTocaYo).length;
    document.title = n ? `(${n}) 🎯 ${_tituloOriginalTeToca}` : _tituloOriginalTeToca;
}

// ==================== GLOBITO (index.html) ====================
// Número sobre el planeta Juegos con las partidas donde te toca.
function renderGloboTeToca(pendientes){
    const planeta = document.querySelector('.planeta-juegos');
    if (!planeta) return;
    const n = pendientes.filter(p => p.quien === _teTocaYo).length;
    let globo = planeta.querySelector('.globo-te-toca');
    if (!n) { if (globo) globo.remove(); planeta.removeAttribute('title'); return; }
    if (!globo) {
        globo = document.createElement('span');
        globo.className = 'globo-te-toca';
        planeta.appendChild(globo);
    }
    globo.textContent = n;
    planeta.title = n === 1 ? '¡Te toca en un juego!' : `¡Te toca en ${n} juegos!`;
}

window.iniciarTeToca = iniciarTeToca;
window.renderGloboTeToca = renderGloboTeToca;
window.pendientesTeToca = pendientesTeToca;
window.ocultarTeToca = ocultarTeToca;
window.activarAvisosTeToca = activarAvisosTeToca;
window.avisarPorWhatsAppTeToca = avisarPorWhatsAppTeToca;
window.renderTarjetaTeToca = renderTarjetaTeToca;
window.actualizarTituloTeToca = actualizarTituloTeToca;
