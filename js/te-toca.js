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
    pingpong: (d) => (d.fase === 'respondiendo' || d.fase === 'eligiendo') && d.turno ? [{ quien: d.turno, que: d.fase === 'respondiendo' ? 'pregunta' : 'preguntar' }] : [],
    ahorcado: (d) => d.fase === 'jugando' && d.adivinador ? [{ quien: d.adivinador, que: 'turno' }] : [],
    // Juegos nuevos (js/juegos/base-turnos.js): todos usan fase 'jugando' + turno.
    gomoku: _porTurno('jugando'),
    mancala: _porTurno('jugando'),
    serpientes: _porTurno('jugando'),
    parchis: _porTurno('jugando'),
    domino: _porTurno('jugando'),
    backgammon: _porTurno('jugando'),
    guerra: _porTurno('jugando'),
    blackjack: _porTurno('jugando'),
    poker: _porTurno('jugando'),
    codigo: _porTurno('jugando'),
    onda: _porTurno('jugando'),
    faros: _porTurno('jugando'),
    damaschinas: _porTurno('jugando'),
    quoridor: _porTurno('jugando'),
    exquisito: _porTurno('jugando'),
    mastermind: _porTurno('jugando'),
    hex: _porTurno('jugando'),
    fosforos: _porTurno('jugando'),
    chancho: _porTurno('jugando'),
};

const TEXTO_QUE_TE_TOCA = {
    turno: 'tu turno',
    listo: 'te está esperando para empezar',
    colocar: 'ubicá tu flota',
    responder: 'te cantaron, respondé',
    adivinar: '¿cuál es la mentira?',
    pregunta: 'te hicieron una pregunta',
    preguntar: 'te toca preguntar',
};

let _teTocaYo = null;
let _teTocaEstados = {};      // juegoId -> { pendientes, firma }
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

// Desde cuándo está la partida así: la primera vez que este celular vio
// el estado actual (si nadie jugó, la firma no cambia). Con más de un
// día quieta, la tarjeta lo dice y el botón de WhatsApp pasa a "Recordale".
const DIA_TE_TOCA = 24 * 60 * 60 * 1000;
function _desdeTeToca(juego, firma){
    let m = {};
    try { m = JSON.parse(localStorage.getItem('teTocaDesde') || '{}'); } catch (e) { m = {}; }
    if (!m[juego] || m[juego].firma !== firma) {
        m[juego] = { firma, ts: Date.now() };
        try { localStorage.setItem('teTocaDesde', JSON.stringify(m)); } catch (e) { /* sin almacenamiento */ }
    }
    return m[juego].ts;
}
function diasQuietaTeToca(juego){
    const e = _teTocaEstados[juego];
    if (!e || !e.desde) return 0;
    return Math.floor((Date.now() - e.desde) / DIA_TE_TOCA);
}
function _textoDiasTeToca(n){ return n === 1 ? 'hace 1 día' : `hace ${n} días`; }

// Lista actual: [{ juego, quien, que }], sin las ocultas.
function pendientesTeToca(){
    const ocultos = _leerOcultosTeToca();
    const res = [];
    Object.entries(_teTocaEstados).forEach(([juego, e]) => {
        if (ocultos[juego] && ocultos[juego] === e.firma) return;
        e.pendientes.forEach(p => res.push({ juego, ...p }));
    });
    return res;
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
            const pendientes = d ? DETECTORES_TE_TOCA[juego](d) : [];
            const antes = _teTocaEstados[juego];
            const firma = d ? _firmaTeToca(d) : '';
            _teTocaEstados[juego] = { pendientes, firma, desde: pendientes.length ? _desdeTeToca(juego, firma) : null };
            const meTocabaAntes = !!antes && antes.pendientes.some(p => p.quien === yo);
            const meTocaAhora = pendientes.some(p => p.quien === yo);
            if (_teTocaPrimeraVez[juego] && meTocaAhora && !meTocabaAntes) _notificarTeToca(juego, pendientes.find(p => p.quien === yo));
            _teTocaPrimeraVez[juego] = true;
            if (_teTocaAlCambiar) _teTocaAlCambiar(pendientesTeToca());
        }, (err) => console.warn('te-toca: no se pudo escuchar', juego, err));
        _teTocaUnsubs.push(unsub);
    });
}

function ocultarTeToca(juego){
    const e = _teTocaEstados[juego];
    if (!e) return;
    const o = _leerOcultosTeToca();
    o[juego] = e.firma;
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
function avisarPorWhatsAppTeToca(juego){
    if (typeof vibrarJ === 'function') vibrarJ(10);
    const otro = _teTocaYo === 'nico' ? 'carito' : 'nico';
    const numero = NUMEROS_WHATSAPP_PAREJA[otro];
    if (!numero) return;
    const j = _nombreJuegoTeToca(juego);
    const p = (_teTocaEstados[juego]?.pendientes || []).find(x => x.quien === otro);
    const base = location.origin + location.pathname.replace(/[^/]*$/, '');
    const enlace = `${base}juegos.html?juego=${encodeURIComponent(juego)}`;
    const dias = diasQuietaTeToca(juego);
    const frase = dias >= 1 ? `hace ${dias === 1 ? 'un día' : dias + ' días'} que te espero 🥺, te toca jugar` : p && p.que === 'listo' ? 'te estoy esperando para jugar' : p && p.que === 'responder' ? 'te canté, ¡respondé!' : p && p.que === 'pregunta' ? 'te mandé una pregunta' : p && p.que === 'preguntar' ? 'te toca preguntarme algo' : 'te toca jugar';
    const texto = `${j.icono} ${frase} en ${j.nombre} 😏\n${enlace}`;
    window.open(`https://wa.me/${numero}?text=${encodeURIComponent(texto)}`, '_blank');
}

// ==================== TARJETA (juegos.html) ====================
function renderTarjetaTeToca(pendientes){
    const cont = document.getElementById('te-toca');
    if (!cont) return;
    const yo = _teTocaYo;
    const mios = pendientes.filter(p => p.quien === yo);
    const delOtro = pendientes.filter(p => p.quien !== yo && !mios.some(m => m.juego === p.juego));
    if (!mios.length && !delOtro.length) { cont.innerHTML = ''; return; }
    const otro = _nombrePersonaTeToca(yo === 'nico' ? 'carito' : 'nico');
    let html = `<div class="panel tarjeta-te-toca">`;
    if (mios.length) {
        html += `<div class="titulo-te-toca">🎯 ¡Te toca!</div>`;
        html += mios.map(p => {
            const j = _nombreJuegoTeToca(p.juego);
            const dias = diasQuietaTeToca(p.juego);
            const texto = (p.que === 'listo' ? `${otro} ${TEXTO_QUE_TE_TOCA.listo}` : TEXTO_QUE_TE_TOCA[p.que]) + (dias >= 1 ? ` · 😴 ${_textoDiasTeToca(dias)}` : '');
            return `<div class="fila-te-toca mia">
                <button class="abrir-te-toca" onclick="abrirJuego('${p.juego}')"><span>${j.icono} ${j.nombre}</span><small>${texto}</small></button>
                <button class="cerrar-te-toca" aria-label="Ocultar" onclick="ocultarTeToca('${p.juego}')">✕</button>
            </div>`;
        }).join('');
    }
    if (delOtro.length) {
        html += `<div class="subtitulo-te-toca">⏳ Esperando a ${otro}</div>`;
        html += delOtro.map(p => {
            const j = _nombreJuegoTeToca(p.juego);
            const dias = diasQuietaTeToca(p.juego);
            return `<div class="fila-te-toca${dias >= 1 ? ' dormida' : ''}">
                <button class="abrir-te-toca" onclick="abrirJuego('${p.juego}')"><span>${j.icono} ${j.nombre}</span>${dias >= 1 ? `<small>😴 sin jugar ${_textoDiasTeToca(dias)}</small>` : ''}</button>
                <button class="btn-whatsapp-te-toca" onclick="avisarPorWhatsAppTeToca('${p.juego}')">📲 ${dias >= 1 ? 'Recordale' : 'Avisale'}</button>
                <button class="cerrar-te-toca" aria-label="Ocultar" onclick="ocultarTeToca('${p.juego}')">✕</button>
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

// ¿Hay una partida en curso de este juego? (alguien tiene que jugar, y
// no es sólo "esperando que el otro toque listo"). La usa el botón
// "Abandonar" de presencia.js.
function partidaEnCursoTeToca(juego){
    const e = _teTocaEstados[juego];
    return !!(e && e.pendientes.some(p => p.que !== 'listo'));
}
window.partidaEnCursoTeToca = partidaEnCursoTeToca;
// Lo mismo pero mirando un documento recién leído (adentro de una transacción).
window.partidaEnCursoDesdeDatos = (juego, d) => !!(d && DETECTORES_TE_TOCA[juego] && DETECTORES_TE_TOCA[juego](d).some(p => p.que !== 'listo'));
window.iniciarTeToca = iniciarTeToca;
window.renderGloboTeToca = renderGloboTeToca;
window.pendientesTeToca = pendientesTeToca;
window.ocultarTeToca = ocultarTeToca;
window.activarAvisosTeToca = activarAvisosTeToca;
window.avisarPorWhatsAppTeToca = avisarPorWhatsAppTeToca;
window.renderTarjetaTeToca = renderTarjetaTeToca;
window.actualizarTituloTeToca = actualizarTituloTeToca;
