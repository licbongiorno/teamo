// ============================================================
// chat-comun.js — todo lo que el chat necesita en las dos pantallas
// donde vive (index.html y juegos.html), para no duplicar esta
// lógica en cada una:
//   1) Recibo de lectura compartido: antes "visto" sólo se guardaba
//      en el localStorage de cada uno, así que un dispositivo nunca
//      podía saber si el OTRO ya había leído un mensaje. Ahora se
//      guarda en un documento compartido de Firestore, así los dos
//      lados ven si el mensaje llegó a leerse (✓✓ estilo WhatsApp).
//   2) El indicador de "mensaje nuevo" en la burbuja de chat, que
//      ahora usa ese mismo recibo compartido.
//   3) El zumbido: un aviso al estilo del "Nudge" del viejo MSN
//      Messenger — sacude la pantalla del otro para llamarle la
//      atención, con un enfriamiento para que no se pueda spamear.
//   4) "Pensé en vos": lo opuesto del zumbido a propósito — un
//      corazón que sube despacio y se desvanece, sin vibración fuerte
//      ni sonido, para un gesto tierno que no interrumpe nada.
//
// Este archivo se auto-inyecta su propio <style> al cargarse, así
// funciona igual en juegos.html (que carga css/global.css) y en
// index.html (que carga css/refugio.css) sin tener que duplicar las
// reglas en los dos lados.
// ============================================================
(function () {
    const estilos = document.createElement('style');
    estilos.textContent = `
        .btn-zumbido-chat{ background:none; border:none; font-size:1.05rem; cursor:pointer; touch-action:manipulation; padding:0 4px; color:#ffc2d9; }
        .btn-zumbido-chat:disabled{ opacity:0.4; font-size:0.72rem; cursor:default; }
        .btn-pense-en-vos{ background:none; border:none; font-size:1.05rem; cursor:pointer; touch-action:manipulation; padding:0 4px; color:#ff9fc0; }
        .btn-pense-en-vos:disabled{ opacity:0.4; font-size:0.72rem; cursor:default; }
        .marca-visto-chat{ font-size:0.65rem; opacity:0.6; margin-top:3px; text-align:right; }
        @keyframes zumbidoSacudida{
            0%,100%{ transform:translate(0,0); }
            10%{ transform:translate(-8px,0); } 20%{ transform:translate(8px,0); }
            30%{ transform:translate(-8px,2px); } 40%{ transform:translate(8px,-2px); }
            50%{ transform:translate(-6px,0); } 60%{ transform:translate(6px,0); }
            70%{ transform:translate(-4px,0); } 80%{ transform:translate(4px,0); } 90%{ transform:translate(-2px,0); }
        }
        .zumbido-sacudida{ animation:zumbidoSacudida 0.6s ease; }
        .pense-en-vos-corazon{
            position:fixed; left:50%; bottom:18%; transform:translateX(-50%);
            font-size:2.6rem; z-index:99998; pointer-events:none;
            animation:penseEnVosSubir 3.2s ease-out forwards;
            filter:drop-shadow(0 0 12px rgba(255,159,192,0.7));
        }
        @keyframes penseEnVosSubir{
            0%{ opacity:0; transform:translateX(-50%) translateY(0) scale(0.6); }
            15%{ opacity:1; transform:translateX(-50%) translateY(-20px) scale(1.15); }
            30%{ transform:translateX(-50%) translateY(-40px) scale(1); }
            100%{ opacity:0; transform:translateX(-50%) translateY(-220px) scale(1.05); }
        }
        @media (prefers-reduced-motion: reduce){
            .pense-en-vos-corazon{ animation:none; opacity:0.9; bottom:40%; }
        }
    `;
    document.head.appendChild(estilos);
})();

function _refChatVisto(){ return window.doc(window.db, 'juegos', 'chat-visto'); }
function _refZumbido(){ return window.doc(window.db, 'juegos', 'zumbido'); }
function _refPenseEnVos(){ return window.doc(window.db, 'juegos', 'pense-en-vos'); }

// vibrarJ existe en juegos.html (js/usuario.js), vibrar existe en
// index.html (js/index-refugio.js) — probamos la que haya.
function _vibrarChat(patron){
    if (typeof window.vibrarJ === 'function') window.vibrarJ(patron);
    else if (typeof window.vibrar === 'function') window.vibrar(patron);
}

// ==================== RECIBO DE LECTURA COMPARTIDO ====================
// Colgadas de window (no "let" sueltas) para que chat.js/inicio/chat.js
// las puedan leer sin depender de que compartan el mismo scope global
// de script clásico.
window._miUltimoVistoChat = 0;
window._vistoRivalChat = 0;
let _unsubChatVisto = null;

function iniciarEscuchaChatVisto(){
    if (_unsubChatVisto || !miIdentidad) return;
    _unsubChatVisto = window.onSnapshot(_refChatVisto(), (snap) => {
        const datos = snap.exists() ? snap.data() : {};
        // Mientras la escritura propia está pendiente, el serverTimestamp
        // todavía no tiene valor: se conserva la hora local optimista.
        const mio = _msVistoChat(datos[miIdentidad]);
        if (mio) window._miUltimoVistoChat = Math.max(window._miUltimoVistoChat, mio);
        window._vistoRivalChat = _msVistoChat(datos[miRival]);
        if (typeof window.actualizarChecksVistoChat === 'function') window.actualizarChecksVistoChat();
    }, (err) => console.error('Error escuchando visto del chat:', err));
}

// El "visto" se guarda con la hora del SERVIDOR (serverTimestamp), la
// misma que tienen los mensajes. Antes se guardaba Date.now() del
// celular: si uno de los dos tenía la hora un poco corrida, el "Visto
// ✓✓" no aparecía nunca, o el aviso de mensaje nuevo no se iba (o no
// aparecía). Acepta también el formato viejo (número).
function _msVistoChat(v){
    if (!v) return 0;
    if (typeof v === 'number') return v;
    if (typeof v.toMillis === 'function') return v.toMillis();
    return 0;
}
let _ultimaMarcaVistoChat = 0;
let _timerVistoChat = null;
async function marcarChatComoVisto(){
    if (!miIdentidad) return;
    marcarChatComoNoLeido(false);
    // Optimista mientras llega la hora real del servidor: lo más nuevo
    // entre la hora local y el último mensaje que ya vimos.
    window._miUltimoVistoChat = Math.max(window._miUltimoVistoChat, Date.now(), window._ultimoMensajeChatMs || 0);
    // Como mucho una escritura cada 2 s (se llama con cada mensaje que
    // llega mientras el chat está abierto).
    const ahora = Date.now();
    const espera = 2000 - (ahora - _ultimaMarcaVistoChat);
    if (espera > 0) {
        // No se pierde: se guarda apenas pasa el intervalo.
        if (!_timerVistoChat) _timerVistoChat = setTimeout(() => { _timerVistoChat = null; marcarChatComoVisto(); }, espera);
        return;
    }
    _ultimaMarcaVistoChat = ahora;
    try {
        await window.setDoc(_refChatVisto(), { [miIdentidad]: window.serverTimestamp() }, { merge: true });
    } catch (e) { console.warn('No se pudo guardar el visto del chat:', e); }
}
window.marcarChatComoVisto = marcarChatComoVisto;

function marcarChatComoNoLeido(hayNoLeido){
    const burbuja = document.getElementById('burbuja-chat');
    if (burbuja) burbuja.classList.toggle('no-leido', hayNoLeido);
}
window.marcarChatComoNoLeido = marcarChatComoNoLeido;

// A diferencia de la escucha de arriba (que arranca recién cuando se
// ABRE el chat), esta corre todo el tiempo desde que sabemos quiénes
// somos, para detectar mensajes nuevos aunque el chat nunca se haya
// abierto en esta sesión.
let _escuchaNoLeidosIniciada = false;
function iniciarEscuchaChatNoLeidos(){
    if (_escuchaNoLeidosIniciada || !miIdentidad) return;
    _escuchaNoLeidosIniciada = true;
    iniciarEscuchaChatVisto();
    iniciarEscuchaZumbido();
    iniciarEscuchaPenseEnVos();
    const q = window.query(
        window.collection(window.db, 'chat'),
        window.orderBy('timestamp', 'desc'),
        window.limit(1)
    );
    window.onSnapshot(q, (snapshot) => {
        if (snapshot.empty) return;
        const msg = snapshot.docs[0].data();
        const fecha = msg.timestamp && msg.timestamp.toMillis ? msg.timestamp.toMillis() : Date.now();
        window._ultimoMensajeChatMs = Math.max(window._ultimoMensajeChatMs || 0, fecha);
        if (msg.autor === miIdentidad) return; // mensaje propio, no cuenta como no leído
        const chatFlotante = document.getElementById('chat-flotante');
        const abierto = chatFlotante && chatFlotante.classList.contains('abierto');
        if (fecha > window._miUltimoVistoChat && !abierto) marcarChatComoNoLeido(true);
    }, (err) => console.error('Error escuchando no leídos del chat:', err));
}
window.iniciarEscuchaChatNoLeidos = iniciarEscuchaChatNoLeidos;

// ==================== SEÑALES EN VIVO (zumbido / pensé en vos) ====================
// Antes se comparaba la hora del celular que MANDA (enviadoEn) con la
// hora del celular que RECIBE: si el reloj del que manda estaba un poco
// atrasado, la señal se descartaba y al otro nunca le llegaba. Ahora:
// cada envío tiene un id único; lo que ya estaba guardado al conectar
// (o llegó mientras no estábamos) se toma como punto de partida y no
// dispara nada, y de ahí en más cualquier id nuevo del otro dispara.
function _escucharSenalChat(ref, nombre, alRecibir){
    let sincronizado = false;
    let ultimoId = null;
    return window.onSnapshot(ref, { includeMetadataChanges: true }, (snap) => {
        const datos = snap.exists() ? snap.data() : null;
        const id = datos ? (datos.id || String(datos.enviadoEn || '')) : null;
        if (!sincronizado) {
            ultimoId = id;
            if (!snap.metadata.fromCache) sincronizado = true;
            return;
        }
        if (!datos || id === ultimoId) return;
        ultimoId = id;
        if (datos.de === miIdentidad) return;
        alRecibir();
    }, (err) => console.error(`Error escuchando ${nombre}:`, err));
}
function _idSenalChat(){ return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }

// ==================== ZUMBIDO (estilo MSN) ====================
const COOLDOWN_ZUMBIDO_MS = 12000;
let _ultimoZumbidoEnviado = 0;
let _unsubZumbido = null;

function iniciarEscuchaZumbido(){
    if (_unsubZumbido || !miIdentidad) return;
    _unsubZumbido = _escucharSenalChat(_refZumbido(), 'zumbido', dispararEfectoZumbido);
}

function dispararEfectoZumbido(){
    document.body.classList.remove('zumbido-sacudida');
    void document.body.offsetWidth;
    document.body.classList.add('zumbido-sacudida');
    _vibrarChat([30, 60, 30, 60, 30, 60, 80]);
    if (window.sfx && window.sfx.error) window.sfx.error();
    setTimeout(() => document.body.classList.remove('zumbido-sacudida'), 650);
}

async function enviarZumbido(){
    if (!miIdentidad) return;
    const ahora = Date.now();
    if (ahora - _ultimoZumbidoEnviado < COOLDOWN_ZUMBIDO_MS) return;
    _ultimoZumbidoEnviado = ahora;
    _vibrarChat([20, 40, 20]);
    _actualizarBotonZumbido();
    try {
        await window.setDoc(_refZumbido(), { de: miIdentidad, enviadoEn: ahora, id: _idSenalChat() });
    } catch (e) {
        console.warn('No se pudo enviar el zumbido:', e);
        _ultimoZumbidoEnviado = 0;
        _actualizarBotonZumbido();
    }
}
window.enviarZumbido = enviarZumbido;

function _actualizarBotonZumbido(){
    const btn = document.getElementById('btn-zumbido-chat');
    if (!btn) return;
    const restante = COOLDOWN_ZUMBIDO_MS - (Date.now() - _ultimoZumbidoEnviado);
    if (restante <= 0) { btn.disabled = false; btn.innerText = '📳'; return; }
    btn.disabled = true;
    btn.innerText = Math.ceil(restante / 1000) + 's';
    setTimeout(_actualizarBotonZumbido, 250);
}

// ==================== "PENSÉ EN VOS" (latido silencioso) ====================
// A propósito lo opuesto del zumbido: nada de vibración fuerte ni
// sonido ni sacudida — sólo un corazón que sube despacio y se
// desvanece, para decir "estás en mi cabeza" sin interrumpir nada del
// otro lado.
const COOLDOWN_PENSE_MS = 8000;
let _ultimoPenseEnviado = 0;
let _unsubPenseEnVos = null;

function iniciarEscuchaPenseEnVos(){
    if (_unsubPenseEnVos || !miIdentidad) return;
    _unsubPenseEnVos = _escucharSenalChat(_refPenseEnVos(), '"pensé en vos"', dispararEfectoPenseEnVos);
}

function dispararEfectoPenseEnVos(){
    const corazon = document.createElement('div');
    corazon.className = 'pense-en-vos-corazon';
    corazon.textContent = '💗';
    document.body.appendChild(corazon);
    setTimeout(() => corazon.remove(), 3200);
    // Vibración mínima, más para "avisar sin gritar" que para llamar
    // la atención — nada comparable a la del zumbido.
    _vibrarChat([12]);
}

async function enviarPenseEnVos(){
    if (!miIdentidad) return;
    const ahora = Date.now();
    if (ahora - _ultimoPenseEnviado < COOLDOWN_PENSE_MS) return;
    _ultimoPenseEnviado = ahora;
    _actualizarBotonPenseEnVos();
    // Optimista: el propio corazoncito también se ve del lado de quien
    // lo manda, como confirmación de que salió.
    dispararEfectoPenseEnVos();
    try {
        await window.setDoc(_refPenseEnVos(), { de: miIdentidad, enviadoEn: ahora, id: _idSenalChat() });
    } catch (e) {
        console.warn('No se pudo enviar "pensé en vos":', e);
        _ultimoPenseEnviado = 0;
        _actualizarBotonPenseEnVos();
    }
}
window.enviarPenseEnVos = enviarPenseEnVos;

function _actualizarBotonPenseEnVos(){
    const btn = document.getElementById('btn-pense-en-vos');
    if (!btn) return;
    const restante = COOLDOWN_PENSE_MS - (Date.now() - _ultimoPenseEnviado);
    if (restante <= 0) { btn.disabled = false; btn.innerText = '💗'; return; }
    btn.disabled = true;
    btn.innerText = Math.ceil(restante / 1000) + 's';
    setTimeout(_actualizarBotonPenseEnVos, 250);
}

// ==================== MENSAJES DEL CHAT (común a los dos chats) ====================
// Antes cada chat pedía TODO el historial (orderBy asc, sin límite) cada
// vez que se abría, y lo volvía a dibujar entero con cada mensaje nuevo:
// cuanto más largo el chat, más lento abría y más tardaba en aparecer un
// mensaje. Ahora se piden sólo los últimos CHAT_TAM_PAGINA (los más
// nuevos, del lado del servidor) y "Ver mensajes anteriores" pide más.
const CHAT_TAM_PAGINA = 80;
let _limiteMensajesChat = CHAT_TAM_PAGINA;
let _unsubMensajesChat = null;
let _callbacksMensajesChat = null;

// onMensajes(mensajes, hayMas): mensajes = [{id, ...datos}] del más
// viejo al más nuevo.
function escucharMensajesChat(onMensajes, onError){
    _callbacksMensajesChat = { onMensajes, onError };
    if (_unsubMensajesChat) _unsubMensajesChat();
    const pedidos = _limiteMensajesChat;
    const q = window.query(
        window.collection(window.db, 'chat'),
        window.orderBy('timestamp', 'desc'),
        window.limit(pedidos)
    );
    _unsubMensajesChat = window.onSnapshot(q, (snapshot) => {
        const mensajes = [];
        snapshot.forEach(d => mensajes.push({ id: d.id, ...d.data() }));
        mensajes.reverse();
        onMensajes(mensajes, snapshot.size >= pedidos);
    }, (err) => {
        _unsubMensajesChat = null;
        if (onError) onError(err);
    });
}
window.escucharMensajesChat = escucharMensajesChat;

function cargarMensajesAnterioresChat(){
    if (!_callbacksMensajesChat) return;
    _limiteMensajesChat += CHAT_TAM_PAGINA;
    window._chatMantenerScroll = true;
    escucharMensajesChat(_callbacksMensajesChat.onMensajes, _callbacksMensajesChat.onError);
}
window.cargarMensajesAnterioresChat = cargarMensajesAnterioresChat;

// Botón "Ver mensajes anteriores" (va arriba de la lista si hay más).
function crearBotonAnterioresChat(){
    const b = document.createElement('button');
    b.className = 'btn-anteriores-chat';
    b.type = 'button';
    b.innerText = '⬆️ Ver mensajes anteriores';
    b.style.cssText = 'display:block; margin:6px auto 10px; padding:6px 14px; border-radius:14px; border:1px solid rgba(255,255,255,0.2); background:rgba(255,255,255,0.08); color:inherit; font-size:0.8rem; cursor:pointer;';
    b.onclick = (e) => { e.stopPropagation(); b.disabled = true; b.innerText = 'Cargando…'; cargarMensajesAnterioresChat(); };
    return b;
}
window.crearBotonAnterioresChat = crearBotonAnterioresChat;

// Scroll después de redibujar: antes se iba SIEMPRE al final, aunque
// estuvieras leyendo mensajes viejos. Ahora baja sólo si ya estabas
// cerca del final (o si el mensaje nuevo es tuyo); al cargar anteriores
// conserva la posición.
function ajustarScrollChat(contenedor, alturaAntes, scrollAntes, estabaAbajo, ultimoEsPropio){
    if (window._chatMantenerScroll) {
        window._chatMantenerScroll = false;
        contenedor.scrollTop = scrollAntes + (contenedor.scrollHeight - alturaAntes);
        return;
    }
    if (estabaAbajo || ultimoEsPropio) contenedor.scrollTop = contenedor.scrollHeight;
    else contenedor.scrollTop = scrollAntes;
}
window.ajustarScrollChat = ajustarScrollChat;
