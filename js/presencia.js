// ============================================================
// presencia.js — todo lo "en vivo" entre los dos celulares. Se usa en
// juegos.html y en index.html (se arranca con iniciarEnVivo(yo, pagina)).
//
//  1) Presencia: cada uno avisa cada 15 s que tiene la app abierta (y en
//     qué juego está). Antes sólo se avisaba adentro de un juego y al
//     cerrar la app el otro lo seguía viendo "jugando" hasta 40 s; ahora
//     al pasar a segundo plano o cerrar se avisa al instante.
//     - Inicio: puntito verde sobre el planeta Juegos + aviso cuando el
//       otro se conecta.
//     - Juegos: chip "🟢 Carito conectada" arriba, y adentro de cada juego
//       una barra con "Carito está acá / no está" y los botones.
//  2) Invitaciones: "🎮 Invitar" adentro de un juego le muestra al otro
//     un cartel (en cualquier pantalla de la app) con Aceptar / Ahora no.
//     Si no está conectado, además se abre WhatsApp con el link directo.
//  3) Reacciones: emojis que le aparecen flotando al otro en su pantalla.
//  4) Pantalla siempre prendida mientras hay un juego abierto (Wake Lock),
//     así el celular no se bloquea en medio de una partida.
//
// Todo vive en la colección 'juegos' (presencia, invitacion, reaccion),
// como el resto de la app. Las horas son ahoraSync() (js/reloj.js).
// ============================================================
(function () {
    const estilos = document.createElement('style');
    estilos.textContent = `
        .chip-en-linea{ display:inline-flex; align-items:center; gap:5px; font-size:0.72rem; padding:3px 9px; border-radius:12px;
            background:rgba(168,237,170,0.14); border:1px solid rgba(120,220,140,0.5); color:inherit; white-space:nowrap; }
        .punto-en-linea{ width:8px; height:8px; border-radius:50%; background:#5fdc7a; box-shadow:0 0 6px #5fdc7a; animation:latidoEnLinea 2s ease-in-out infinite; }
        @keyframes latidoEnLinea{ 50%{ opacity:0.45; } }
        .barra-en-vivo{ display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin:-6px 0 12px; padding:8px 12px; border-radius:14px;
            background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.12); font-size:0.8rem; }
        .barra-en-vivo .estado-en-vivo{ flex:1; min-width:140px; display:flex; align-items:center; gap:6px; }
        .barra-en-vivo .punto-gris{ width:8px; height:8px; border-radius:50%; background:#888; }
        .barra-en-vivo .punto-amarillo{ width:8px; height:8px; border-radius:50%; background:#f5d06a; }
        .barra-en-vivo button{ border:1px solid rgba(255,255,255,0.2); background:rgba(255,255,255,0.07); color:inherit; border-radius:12px;
            padding:6px 10px; font-size:0.8rem; cursor:pointer; font-family:inherit; }
        .barra-en-vivo button.destacado{ background:linear-gradient(135deg,#ffb3c6,#c9b6ff); color:#22182b; border:none; font-weight:700; }
        .selector-reacciones{ display:flex; gap:4px; width:100%; justify-content:center; }
        .selector-reacciones button{ font-size:1.3rem; padding:4px 8px; }
        .selector-frases{ display:flex; gap:5px; width:100%; flex-wrap:wrap; justify-content:center; }
        .selector-frases button{ font-size:0.75rem; padding:5px 9px; border-radius:999px; }
        .frase-flotante{ position:fixed; left:50%; top:18%; z-index:16500; pointer-events:none; transform:translateX(-50%);
            max-width:80vw; padding:12px 18px; border-radius:22px 22px 22px 6px; font-weight:700; font-size:1.05rem; text-align:center;
            background:linear-gradient(135deg,#ffb3c6,#c9b6ff); color:#22182b; box-shadow:0 10px 30px rgba(0,0,0,0.45);
            animation:entrarFrase 0.4s cubic-bezier(0.34,1.56,0.64,1); }
        .frase-flotante.propia{ top:auto; bottom:16%; border-radius:22px 22px 6px 22px; font-size:0.9rem; opacity:0.9; }
        .frase-flotante small{ display:block; font-size:0.7rem; font-weight:600; opacity:0.75; }
        @keyframes entrarFrase{ from{ opacity:0; transform:translate(-50%,10px) scale(0.6); } to{ opacity:1; transform:translate(-50%,0) scale(1); } }
        .aviso-juntos-ahora{ display:flex; align-items:center; justify-content:space-between; gap:10px; width:100%; margin-bottom:12px; padding:12px 14px;
            border-radius:16px; border:1px solid rgba(120,220,140,0.6); background:linear-gradient(135deg, rgba(95,220,122,0.18), rgba(201,182,255,0.18));
            color:inherit; font-family:inherit; font-size:0.85rem; cursor:pointer; text-align:left; }
        .aviso-juntos-ahora b{ white-space:nowrap; padding:7px 12px; border-radius:12px; background:linear-gradient(135deg,#ffb3c6,#c9b6ff); color:#22182b; }
        .reaccion-flotante{ position:fixed; bottom:12%; z-index:16000; pointer-events:none; font-size:2.6rem;
            animation:subirReaccion 2.4s ease-out forwards; will-change:transform, opacity; }
        @keyframes subirReaccion{ 0%{ transform:translateY(0) scale(0.6); opacity:0; } 15%{ opacity:1; transform:translateY(-8vh) scale(1.1); }
            100%{ transform:translateY(-62vh) scale(1); opacity:0; } }
        .cartel-en-vivo{ position:fixed; left:50%; top:calc(14px + env(safe-area-inset-top, 0px)); transform:translateX(-50%); z-index:17000;
            width:min(92vw, 380px); padding:14px 16px; border-radius:18px; color:#fdf6f0; font-family:'Montserrat',sans-serif;
            background:rgba(36,26,51,0.97); border:1px solid rgba(201,182,255,0.6); box-shadow:0 12px 40px rgba(0,0,0,0.5);
            animation:entrarCartel 0.35s ease; }
        .cartel-en-vivo .titulo{ font-size:0.95rem; font-weight:700; margin-bottom:4px; }
        .cartel-en-vivo .sub{ font-size:0.8rem; opacity:0.75; margin-bottom:10px; }
        .cartel-en-vivo .fila{ display:flex; gap:8px; }
        .cartel-en-vivo button{ flex:1; padding:10px; border-radius:12px; font-size:0.88rem; cursor:pointer; font-family:inherit; border:1px solid rgba(255,255,255,0.2); background:transparent; color:inherit; }
        .cartel-en-vivo button.si{ background:linear-gradient(135deg,#ffb3c6,#c9b6ff); color:#22182b; border:none; font-weight:700; }
        @keyframes entrarCartel{ from{ opacity:0; transform:translate(-50%,-14px); } to{ opacity:1; transform:translate(-50%,0); } }
        .planeta-juegos.rival-en-linea::after{ content:''; position:absolute; top:4px; left:4px; width:11px; height:11px; border-radius:50%;
            background:#5fdc7a; box-shadow:0 0 8px #5fdc7a; animation:latidoEnLinea 2s ease-in-out infinite; }
        html[data-tema="claro"] .barra-en-vivo{ background:rgba(0,0,0,0.04); border-color:rgba(0,0,0,0.12); }
        html[data-tema="claro"] .barra-en-vivo button{ border-color:rgba(0,0,0,0.2); background:rgba(0,0,0,0.04); }
    `;
    document.head.appendChild(estilos);
})();

const _VENTANA_PRESENCIA_MS = 35000;
const _LATIDO_PRESENCIA_MS = 15000;
const _VIGENCIA_INVITACION_MS = 120000;

let _evYo = null, _evOtro = null, _evPagina = null;
let _evJuego = null;            // juego abierto ahora en este celular
let _evRival = null;            // { juego, pagina, actualizadoEn, visible }
let _intervaloPresencia = null;
let _evIniciado = false;

function _refPresencia(){ return window.doc(window.db, 'juegos', 'presencia'); }
function _refInvitacion(){ return window.doc(window.db, 'juegos', 'invitacion'); }
function _refReaccion(){ return window.doc(window.db, 'juegos', 'reaccion'); }
function _ahoraEv(){ return typeof ahoraSync === 'function' ? ahoraSync() : Date.now(); }
function _nombreEv(id){ return id === 'carito' ? 'Carito' : 'Nico'; }
function _juegoEv(id){
    const j = (window.JUEGOS || []).find(x => x.id === id);
    return j ? { icono: j.icono, nombre: j.nombre } : { icono: '🎮', nombre: id };
}
function _idEv(){ return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
function _vibrarEv(p){ if (navigator.vibrate) { try { navigator.vibrate(p); } catch (e) {} } }
function _enlaceJuegoEv(juego){ return location.origin + location.pathname.replace(/[^/]*$/, '') + 'juegos.html?juego=' + encodeURIComponent(juego); }
function _escEv(t){ return String(t ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

// ==================== ARRANQUE ====================
function iniciarEnVivo(yo, pagina){
    if (yo !== 'nico' && yo !== 'carito') return;
    if (!window.db) {
        const reintentar = () => iniciarEnVivo(yo, pagina);
        document.addEventListener('firebase-listo', reintentar, { once: true });
        document.addEventListener('firebase-listo-index', reintentar, { once: true });
        return;
    }
    if (_evIniciado) return;
    _evIniciado = true;
    _evYo = yo; _evOtro = yo === 'nico' ? 'carito' : 'nico'; _evPagina = pagina;
    _latirPresencia();
    _intervaloPresencia = setInterval(() => { if (document.visibilityState === 'visible') _latirPresencia(); }, _LATIDO_PRESENCIA_MS);
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') { _latirPresencia(); if (_evJuego) pedirPantallaPrendida(); }
        else _latirPresencia(false);
    });
    // Al cerrar la pestaña/app: "me fui" al instante (si llega a salir).
    window.addEventListener('pagehide', () => _latirPresencia(false));
    _escucharPresencia();
    _escucharInvitaciones();
    _escucharReacciones();
    // Cada 10 s se re-evalúa si el otro sigue "fresco" aunque no cambie el documento.
    setInterval(_avisarCambioPresencia, 10000);
}

// ==================== 1) PRESENCIA ====================
function _latirPresencia(visible){
    if (!_evYo || !window.db) return;
    const v = visible !== undefined ? visible : document.visibilityState === 'visible';
    window.setDoc(_refPresencia(), {
        [_evYo]: { juego: v ? (_evJuego || null) : null, pagina: _evPagina, visible: v, actualizadoEn: _ahoraEv() }
    }, { merge: true }).catch(() => { /* la presencia no es crítica */ });
}

// Lo usa navegacion.js al abrir/cerrar un juego (mismos nombres de antes).
function iniciarLatidoPresencia(juegoId){
    _evJuego = juegoId || null;
    _latirPresencia();
    if (_evJuego) { pedirPantallaPrendida(); renderBarraEnVivo(); }
}
function detenerLatidoPresencia(){
    _evJuego = null;
    _latirPresencia();
    liberarPantallaPrendida();
}

function estadoRivalEnVivo(){
    const r = _evRival;
    const conectado = !!(r && r.visible !== false && (_ahoraEv() - (r.actualizadoEn || 0)) < _VENTANA_PRESENCIA_MS);
    return { conectado, juego: conectado ? (r.juego || null) : null, pagina: conectado ? r.pagina : null };
}

let _evConectadoAntes = null;
let _evDesconectadoDesde = 0;
function _escucharPresencia(){
    window.onSnapshot(_refPresencia(), (snap) => {
        _evRival = snap.exists() ? (snap.data()[_evOtro] || null) : null;
        _avisarCambioPresencia();
    }, (err) => console.warn('Error escuchando presencia:', err));
}

function _avisarCambioPresencia(){
    const est = estadoRivalEnVivo();
    // Aviso cuando el otro recién se conecta (no al abrir la app si ya
    // estaba, ni si sólo salió un ratito a otra app y volvió).
    if (_evConectadoAntes === true && !est.conectado) _evDesconectadoDesde = Date.now();
    if (_evConectadoAntes === false && est.conectado && Date.now() - _evDesconectadoDesde > 120000) {
        mostrarCartelEnVivo({ titulo: `🟢 ${_nombreEv(_evOtro)} se conectó`, sub: est.juego ? `Está en ${_juegoEv(est.juego).icono} ${_juegoEv(est.juego).nombre}` : 'Está con la app abierta ahora', duracion: 4000 });
    }
    _evConectadoAntes = est.conectado;
    renderAvisoPresencia(est.juego);
    _renderChipEnLinea(est);
    renderBarraEnVivo();
}

// Menú de juegos: "Carito está jugando X ahora — tocá para sumarte".
function renderAvisoPresencia(juegoId){
    const cont = document.getElementById('aviso-presencia');
    if (!cont) return;
    if (!juegoId) {
        // Conectado/a pero en el menú: invitación grande a jugar juntos ya.
        const est = estadoRivalEnVivo();
        cont.innerHTML = est.conectado && typeof abrirJugarJuntos === 'function'
            ? `<button class="aviso-juntos-ahora" onclick="abrirJugarJuntos()"><span>💚 ${_nombreEv(_evOtro)} está ${_evOtro === 'carito' ? 'conectada' : 'conectado'} ahora</span><b>🎮 ¡Juguemos juntos!</b></button>`
            : '';
        return;
    }
    const j = _juegoEv(juegoId);
    cont.innerHTML = `<div class="aviso-presencia-activo" onclick="abrirJuego('${juegoId}')">
        ${_nombreEv(_evOtro)} está jugando ${j.icono} ${j.nombre} ahora — tocá para sumarte
    </div>`;
}

// Juegos: chip en el encabezado. Inicio: puntito verde en el planeta Juegos.
function _renderChipEnLinea(est){
    const chip = document.getElementById('chip-en-linea');
    if (chip) chip.innerHTML = est.conectado ? `<span class="chip-en-linea"><span class="punto-en-linea"></span>${_nombreEv(_evOtro)}</span>` : '';
    const planeta = document.querySelector('.planeta-juegos');
    if (planeta) {
        planeta.classList.toggle('rival-en-linea', est.conectado);
        if (est.conectado) planeta.setAttribute('aria-description', `${_nombreEv(_evOtro)} está conectado/a`);
    }
}

// Barra adentro del juego abierto.
let _evReaccionesAbiertas = false;
function renderBarraEnVivo(){
    if (!_evJuego || !_evYo) return;
    const pantalla = document.getElementById('pantalla-' + _evJuego);
    if (!pantalla || !(window.JUEGOS || []).some(j => j.id === _evJuego)) return;
    let barra = pantalla.querySelector('.barra-en-vivo');
    if (!barra) {
        barra = document.createElement('div');
        barra.className = 'barra-en-vivo';
        const fila = pantalla.querySelector('.fila-superior-juego');
        if (fila) fila.after(barra); else pantalla.prepend(barra);
    }
    const est = estadoRivalEnVivo();
    const otro = _nombreEv(_evOtro);
    let estado;
    if (est.juego === _evJuego) estado = `<span class="punto-en-linea"></span> ${otro} está acá`;
    else if (est.conectado) estado = `<span class="punto-amarillo"></span> ${otro} está ${est.juego ? `en ${_juegoEv(est.juego).nombre}` : 'conectado/a'}`;
    else estado = `<span class="punto-gris"></span> ${otro} no está conectado/a`;
    const invitar = est.juego === _evJuego ? '' : `<button class="destacado" onclick="invitarAJugar('${_evJuego}')">🎮 Invitar</button>`;
    const abandonar = JUEGOS_ABANDONABLES[_evJuego] && typeof partidaEnCursoTeToca === 'function' && partidaEnCursoTeToca(_evJuego)
        ? `<button onclick="abandonarPartida('${_evJuego}')" aria-label="Abandonar la partida">🏳️</button>` : '';
    barra.innerHTML = `<span class="estado-en-vivo">${estado}</span>${invitar}${abandonar}
        <button onclick="alternarReaccionesEnVivo()" aria-label="Mandar una reacción">😊</button>
        ${_evReaccionesAbiertas ? `<div class="selector-reacciones">${REACCIONES_EN_VIVO.map(e => `<button onclick="enviarReaccionEnVivo('${e}')">${e}</button>`).join('')}</div>
        <div class="selector-frases">${FRASES_EN_VIVO.map((f, i) => `<button onclick="enviarFraseEnVivo(${i})">${f}</button>`).join('')}</div>` : ''}`;
}
function alternarReaccionesEnVivo(){
    _evReaccionesAbiertas = !_evReaccionesAbiertas;
    renderBarraEnVivo();
}

// ==================== 2) INVITACIONES ====================
// tipo: 'invitacion' (botón Invitar) o 'revancha' (después de una partida).
// Tiene que llamarse directo desde el toque: si el otro no está
// conectado se abre WhatsApp, y el navegador sólo lo permite en el
// mismo toque (no después de esperar a Firestore).
function invitarAJugar(juego, tipo){
    if (!_evYo || !juego) return;
    _vibrarEv(12);
    const est = estadoRivalEnVivo();
    const j = _juegoEv(juego);
    const esRevancha = tipo === 'revancha';
    // Si el otro ya está en este juego, para la revancha alcanza con que
    // vea la pantalla de "listo": no hace falta cartel ni aviso.
    if (esRevancha && est.juego === juego) return;
    if (!esRevancha && !est.conectado && typeof NUMEROS_WHATSAPP_PAREJA !== 'undefined' && NUMEROS_WHATSAPP_PAREJA[_evOtro]) {
        const texto = `${j.icono} ${esRevancha ? `¡Quiero la revancha en ${j.nombre}!` : `¿Jugamos ${j.nombre} ahora?`} Te estoy esperando 😏\n${_enlaceJuegoEv(juego)}`;
        window.open(`https://wa.me/${NUMEROS_WHATSAPP_PAREJA[_evOtro]}?text=${encodeURIComponent(texto)}`, '_blank');
    }
    window.setDoc(_refInvitacion(), {
        id: _idEv(), de: _evYo, para: _evOtro, juego, tipo: tipo || 'invitacion',
        creada: _ahoraEv(), estado: 'pendiente'
    }).then(() => {
        mostrarCartelEnVivo({ titulo: `📨 ${esRevancha ? 'Le pediste la revancha' : 'Invitación enviada'} a ${_nombreEv(_evOtro)}`,
            sub: est.juego === juego ? 'Ya está acá: sólo falta que toque listo.' : est.conectado ? 'Le apareció en la pantalla. Esperando que acepte…' : esRevancha ? 'No está conectado/a: la va a ver al entrar.' : 'No está conectado/a: le llega por WhatsApp y la va a ver al entrar.', duracion: 3500 });
    }).catch(e => console.warn('No se pudo mandar la invitación:', e));
}

let _evInvitacionMostrada = null;
let _evRespuestaAvisada = null;
function _escucharInvitaciones(){
    window.onSnapshot(_refInvitacion(), (snap) => {
        const inv = snap.exists() ? snap.data() : null;
        if (!inv) return;
        const vigente = (_ahoraEv() - (inv.creada || 0)) < _VIGENCIA_INVITACION_MS;
        // Me invitaron.
        if (inv.para === _evYo && inv.estado === 'pendiente' && vigente && _evInvitacionMostrada !== inv.id) {
            // Si ya estoy en ese juego, la acepto solo.
            if (_evJuego === inv.juego) { responderInvitacion(inv.id, 'vista'); return; }
            _evInvitacionMostrada = inv.id;
            _mostrarInvitacionRecibida(inv);
        }
        // Respondieron mi invitación.
        if (inv.de === _evYo && (inv.estado === 'aceptada' || inv.estado === 'rechazada') && _evRespuestaAvisada !== inv.id && vigente) {
            _evRespuestaAvisada = inv.id;
            const j = _juegoEv(inv.juego);
            mostrarCartelEnVivo(inv.estado === 'aceptada'
                ? { titulo: `🎉 ${_nombreEv(_evOtro)} aceptó`, sub: `Está entrando a ${j.icono} ${j.nombre}`, duracion: 3500 }
                : { titulo: `🙈 ${_nombreEv(_evOtro)}: ahora no`, sub: 'Quizás más tarde', duracion: 3000 });
            if (inv.estado === 'aceptada' && window.sfx && window.sfx.logro) window.sfx.logro();
        }
        // Si la contestó en otro dispositivo, se saca el cartel.
        if (inv.para === _evYo && inv.estado !== 'pendiente') _cerrarCartel('invitacion-' + inv.id);
    }, (err) => console.warn('Error escuchando invitaciones:', err));
}

function _mostrarInvitacionRecibida(inv){
    const j = _juegoEv(inv.juego);
    const titulo = inv.tipo === 'revancha' ? `🔁 ${_nombreEv(inv.de)} quiere la revancha` : `🎮 ${_nombreEv(inv.de)} te invita a jugar`;
    mostrarCartelEnVivo({
        clave: 'invitacion-' + inv.id, titulo, sub: `${j.icono} ${j.nombre} · ahora mismo`,
        si: '¡Vamos!', no: 'Ahora no',
        alSi: () => responderInvitacion(inv.id, true), alNo: () => responderInvitacion(inv.id, false),
        duracion: _VIGENCIA_INVITACION_MS - (_ahoraEv() - inv.creada)
    });
    _vibrarEv([30, 60, 30, 60, 30]);
    if (window.sfx && window.sfx.logro) window.sfx.logro();
    // Con la app en segundo plano: notificación del sistema (si la habilitó).
    if (document.hidden && 'Notification' in window && Notification.permission === 'granted') {
        const opciones = { body: `${j.icono} ${j.nombre}`, tag: 'invitacion', icon: location.pathname.replace(/[^/]*$/, '') + 'icons/icon-192.png', data: { url: _enlaceJuegoEv(inv.juego) } };
        if (navigator.serviceWorker && navigator.serviceWorker.ready) navigator.serviceWorker.ready.then(r => r.showNotification(titulo, opciones)).catch(() => {});
        else { try { new Notification(titulo, opciones); } catch (e) {} }
    }
}

// acepta: true / false, o 'vista' (ya estaba en ese juego: no hay que
// llevarlo a ningún lado ni avisarle nada a quien invitó).
async function responderInvitacion(id, acepta){
    const silencioso = acepta === 'vista';
    let juego = null;
    try {
        await window.runTransaction(window.db, async (tx) => {
            const snap = await tx.get(_refInvitacion());
            const inv = snap.exists() ? snap.data() : null;
            if (!inv || inv.id !== id || inv.estado !== 'pendiente') return;
            juego = inv.juego;
            tx.update(_refInvitacion(), { estado: silencioso ? 'vista' : (acepta ? 'aceptada' : 'rechazada'), respondida: _ahoraEv() });
        });
    } catch (e) { console.warn('No se pudo responder la invitación:', e); }
    _cerrarCartel('invitacion-' + id);
    if (!acepta || !juego || silencioso) return;
    if (typeof abrirJuego === 'function' && document.getElementById('pantalla-' + juego)) {
        // Si estaba en otro juego, se cierra bien (escuchas, cronómetros) antes de cambiar.
        if (_evJuego && _evJuego !== juego && typeof cerrarJuego === 'function') cerrarJuego();
        abrirJuego(juego);
    }
    else location.href = _enlaceJuegoEv(juego);
}

// ==================== REVANCHA CON UN TOQUE ====================
// Antes "Revancha" dejaba el juego en "esperando" con nadie listo: los
// dos tenían que volver a tocar "Estoy listo". Ahora el que pide la
// revancha ya queda listo, y al otro le llega el pedido (si está en el
// juego le basta con tocar listo; si no, le aparece el cartel). Si el
// otro ya había pedido la revancha, sólo se suma la marca de listo
// (antes el segundo "Revancha" borraba el pedido del primero).
// base: los campos que el juego conserva entre partidas (victorias, etc).
async function revanchaUnToque(ref, juegoId, base){
    const yo = _evYo || miIdentidad;
    invitarAJugar(juegoId, 'revancha');
    try {
        await window.runTransaction(window.db, async (tx) => {
            const snap = await tx.get(ref);
            const d = snap.exists() ? snap.data() : null;
            if (d && d.fase === 'esperando') {
                tx.set(ref, { listos: { ...(d.listos || {}), [yo]: true } }, { merge: true });
                return;
            }
            tx.set(ref, { ...(base || {}), fase: 'esperando', listos: { [yo]: true } });
        });
    } catch (e) { console.error('No se pudo pedir la revancha:', e); }
}
window.revanchaUnToque = revanchaUnToque;

// ==================== ABANDONAR UNA PARTIDA POR TURNOS ====================
// Antes, si una partida de Ajedrez, UNO, Truco… quedaba colgada (el otro
// no juega más), no había forma limpia de cerrarla. Ahora "🏳️" la deja
// lista para empezar otra; la victoria se la lleva el otro. Sólo toca
// fase/listos: marcadores y récords del juego quedan.
// Valor: cómo queda el documento para "empezar de nuevo" en cada juego.
const _REINICIO_ESPERANDO = { fase: 'esperando', listos: {} };
const JUEGOS_ABANDONABLES = {
    tateti: _REINICIO_ESPERANDO, conecta4: _REINICIO_ESPERANDO, damas: _REINICIO_ESPERANDO, ajedrez: _REINICIO_ESPERANDO,
    reversi: _REINICIO_ESPERANDO, cajitas: _REINICIO_ESPERANDO, generala: _REINICIO_ESPERANDO, uno: _REINICIO_ESPERANDO,
    escoba: _REINICIO_ESPERANDO, chinchon: _REINICIO_ESPERANDO, batallanaval: _REINICIO_ESPERANDO, truco: _REINICIO_ESPERANDO,
    mentiroso: _REINICIO_ESPERANDO, ahorcado: { fase: 'terminado_reiniciar' },
};
async function abandonarPartida(juego){
    const otro = _evOtro || (miIdentidad === 'nico' ? 'carito' : 'nico');
    if (!JUEGOS_ABANDONABLES[juego] || !confirm(`¿Abandonar esta partida? Se la lleva ${_nombreEv(otro)} y quedan listos para empezar otra.`)) return;
    _vibrarEv([15, 30, 15]);
    const ref = window.doc(window.db, 'juegos', juego);
    let abandonada = false;
    try {
        await window.runTransaction(window.db, async (tx) => {
            abandonada = false;
            const snap = await tx.get(ref);
            if (!snap.exists() || !partidaEnCursoDesdeDatos(juego, snap.data())) return;
            // update (no set con merge): así "listos" queda vacío de verdad.
            tx.update(ref, { ...JUEGOS_ABANDONABLES[juego], abandonadaPor: _evYo || miIdentidad });
            abandonada = true;
        });
    } catch (e) { console.error('No se pudo abandonar la partida:', e); return; }
    if (!abandonada) return;
    if (typeof registrarVictoria === 'function') registrarVictoria(juego, otro);
    if (typeof registrarEvento === 'function') registrarEvento('gano_partida', `${_nombreEv(_evYo || miIdentidad)} abandonó ${_juegoEv(juego).nombre}: gana ${_nombreEv(otro)}`);
    mostrarCartelEnVivo({ titulo: '🏳️ Partida abandonada', sub: 'Ya pueden empezar otra cuando quieran.', duracion: 3000 });
}
window.abandonarPartida = abandonarPartida;

// ==================== CARTELES ====================
const _evCarteles = {};
function mostrarCartelEnVivo({ clave, titulo, sub, si, no, alSi, alNo, duracion }){
    const k = clave || _idEv();
    _cerrarCartel(k);
    document.querySelectorAll('.cartel-en-vivo').forEach(c => c.remove()); // uno por vez
    const el = document.createElement('div');
    el.className = 'cartel-en-vivo';
    el.innerHTML = `<div class="titulo">${_escEv(titulo)}</div>${sub ? `<div class="sub">${_escEv(sub)}</div>` : ''}
        ${si ? `<div class="fila"><button class="no">${_escEv(no || 'Cerrar')}</button><button class="si">${_escEv(si)}</button></div>` : ''}`;
    if (si) {
        el.querySelector('.si').onclick = () => { _cerrarCartel(k); if (alSi) alSi(); };
        el.querySelector('.no').onclick = () => { _cerrarCartel(k); if (alNo) alNo(); };
    } else el.onclick = () => _cerrarCartel(k);
    document.body.appendChild(el);
    _evCarteles[k] = { el, timer: setTimeout(() => _cerrarCartel(k), Math.max(1500, duracion || 4000)) };
}
function _cerrarCartel(k){
    const c = _evCarteles[k];
    if (!c) return;
    clearTimeout(c.timer);
    c.el.remove();
    delete _evCarteles[k];
}

// ==================== 3) REACCIONES ====================
const REACCIONES_EN_VIVO = ['😂', '😱', '😍', '🔥', '😤', '👏'];
let _evUltimaReaccion = 0;
function enviarReaccionEnVivo(emoji){
    if (!_evYo) return;
    const ahora = Date.now();
    if (ahora - _evUltimaReaccion < 700) return;
    _evUltimaReaccion = ahora;
    _vibrarEv(8);
    _lanzarReaccion(emoji, true);
    window.setDoc(_refReaccion(), { id: _idEv(), de: _evYo, emoji, juego: _evJuego || null }).catch(() => {});
}

// Provocaciones y mimos: frases fijas (se manda sólo el número, así
// nunca viaja texto libre al HTML del otro).
const FRASES_EN_VIVO = ['¡Te voy a ganar! 😏', '¡Jugaste bárbaro! 💖', 'Dale que te toca 👀', '¡Revancha! 🔥', 'Estoy pensando… 🤔', 'No puede ser 😂', 'Te amo igual 😘', '¡Qué suerte tenés! 🍀'];
function enviarFraseEnVivo(i){
    if (!_evYo || !FRASES_EN_VIVO[i]) return;
    const ahora = Date.now();
    if (ahora - _evUltimaReaccion < 700) return;
    _evUltimaReaccion = ahora;
    _vibrarEv(8);
    _lanzarFrase(FRASES_EN_VIVO[i], true);
    _evReaccionesAbiertas = false;
    renderBarraEnVivo();
    window.setDoc(_refReaccion(), { id: _idEv(), de: _evYo, frase: i, juego: _evJuego || null }).catch(() => {});
}
function _lanzarFrase(texto, propia){
    document.querySelectorAll('.frase-flotante').forEach(x => x.remove());
    const el = document.createElement('div');
    el.className = 'frase-flotante' + (propia ? ' propia' : '');
    el.innerHTML = `${propia ? '' : `<small>${_escEv(_nombreEv(_evOtro))}</small>`}${_escEv(texto)}`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), propia ? 1800 : 3200);
}

// Mismo criterio que el zumbido del chat: lo que ya estaba guardado al
// conectar no dispara nada; de ahí en más, cada id nuevo del otro sí.
function _escucharReacciones(){
    let sincronizado = false, ultimoId = null;
    window.onSnapshot(_refReaccion(), { includeMetadataChanges: true }, (snap) => {
        const d = snap.exists() ? snap.data() : null;
        const id = d ? d.id : null;
        if (!sincronizado) { ultimoId = id; if (!snap.metadata.fromCache) sincronizado = true; return; }
        if (!d || id === ultimoId) return;
        ultimoId = id;
        if (d.de === _evYo) return;
        if (typeof d.frase === 'number' && FRASES_EN_VIVO[d.frase]) { _lanzarFrase(FRASES_EN_VIVO[d.frase], false); _vibrarEv([10, 30, 10]); return; }
        if (!REACCIONES_EN_VIVO.includes(d.emoji)) return;
        _lanzarReaccion(d.emoji, false);
        _vibrarEv(15);
    }, (err) => console.warn('Error escuchando reacciones:', err));
}

function _lanzarReaccion(emoji, propia){
    const cantidad = propia ? 1 : 5;
    for (let i = 0; i < cantidad; i++) {
        const el = document.createElement('div');
        el.className = 'reaccion-flotante';
        el.textContent = emoji;
        el.style.left = (propia ? 80 : 15 + Math.random() * 70) + 'vw';
        el.style.animationDelay = (i * 0.12) + 's';
        if (propia) el.style.fontSize = '1.8rem';
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 2600 + i * 120);
    }
}

// ==================== 4) PANTALLA SIEMPRE PRENDIDA ====================
let _evWakeLock = null;
async function pedirPantallaPrendida(){
    if (!('wakeLock' in navigator) || _evWakeLock || document.visibilityState !== 'visible') return;
    try {
        _evWakeLock = await navigator.wakeLock.request('screen');
        _evWakeLock.addEventListener('release', () => { _evWakeLock = null; });
    } catch (e) { _evWakeLock = null; /* sin permiso o batería baja: no pasa nada */ }
}
function liberarPantallaPrendida(){
    if (_evWakeLock) { _evWakeLock.release().catch(() => {}); _evWakeLock = null; }
}

// Compatibilidad: navegacion.js llamaba a esto al entrar al menú.
function iniciarEscuchaPresencia(){
    if (typeof miIdentidad !== 'undefined' && miIdentidad) iniciarEnVivo(miIdentidad, 'juegos');
}

window.iniciarEnVivo = iniciarEnVivo;
window.iniciarLatidoPresencia = iniciarLatidoPresencia;
window.detenerLatidoPresencia = detenerLatidoPresencia;
window.iniciarEscuchaPresencia = iniciarEscuchaPresencia;
window.estadoRivalEnVivo = estadoRivalEnVivo;
window.invitarAJugar = invitarAJugar;
window.responderInvitacion = responderInvitacion;
window.mostrarCartelEnVivo = mostrarCartelEnVivo;
window.enviarReaccionEnVivo = enviarReaccionEnVivo;
window.enviarFraseEnVivo = enviarFraseEnVivo;
window.alternarReaccionesEnVivo = alternarReaccionesEnVivo;
window.renderBarraEnVivo = renderBarraEnVivo;
window.pedirPantallaPrendida = pedirPantallaPrendida;
window.liberarPantallaPrendida = liberarPantallaPrendida;
