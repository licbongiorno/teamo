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
        .marca-visto-chat{ font-size:0.65rem; opacity:0.6; margin-top:3px; text-align:right; }
        @keyframes zumbidoSacudida{
            0%,100%{ transform:translate(0,0); }
            10%{ transform:translate(-8px,0); } 20%{ transform:translate(8px,0); }
            30%{ transform:translate(-8px,2px); } 40%{ transform:translate(8px,-2px); }
            50%{ transform:translate(-6px,0); } 60%{ transform:translate(6px,0); }
            70%{ transform:translate(-4px,0); } 80%{ transform:translate(4px,0); } 90%{ transform:translate(-2px,0); }
        }
        .zumbido-sacudida{ animation:zumbidoSacudida 0.6s ease; }
    `;
    document.head.appendChild(estilos);
})();

function _refChatVisto(){ return window.doc(window.db, 'juegos', 'chat-visto'); }
function _refZumbido(){ return window.doc(window.db, 'juegos', 'zumbido'); }

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
        window._miUltimoVistoChat = datos[miIdentidad] || 0;
        window._vistoRivalChat = datos[miRival] || 0;
        if (typeof window.actualizarChecksVistoChat === 'function') window.actualizarChecksVistoChat();
    }, (err) => console.error('Error escuchando visto del chat:', err));
}

async function marcarChatComoVisto(){
    if (!miIdentidad) return;
    marcarChatComoNoLeido(false);
    window._miUltimoVistoChat = Date.now();
    try {
        await window.setDoc(_refChatVisto(), { [miIdentidad]: window._miUltimoVistoChat }, { merge: true });
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
    const q = window.query(
        window.collection(window.db, 'chat'),
        window.orderBy('timestamp', 'desc'),
        window.limit(1)
    );
    window.onSnapshot(q, (snapshot) => {
        if (snapshot.empty) return;
        const msg = snapshot.docs[0].data();
        if (msg.autor === miIdentidad) return; // mensaje propio, no cuenta como no leído
        const fecha = msg.timestamp && msg.timestamp.toMillis ? msg.timestamp.toMillis() : Date.now();
        const chatFlotante = document.getElementById('chat-flotante');
        const abierto = chatFlotante && chatFlotante.classList.contains('abierto');
        if (fecha > window._miUltimoVistoChat && !abierto) marcarChatComoNoLeido(true);
    }, (err) => console.error('Error escuchando no leídos del chat:', err));
}
window.iniciarEscuchaChatNoLeidos = iniciarEscuchaChatNoLeidos;

// ==================== ZUMBIDO (estilo MSN) ====================
const COOLDOWN_ZUMBIDO_MS = 12000;
let _ultimoZumbidoEnviado = 0;
// Arranca en "ahora": así un zumbido viejo que ya estaba guardado no
// dispara el efecto de nuevo apenas se conecta el listener.
let _ultimoZumbidoVisto = Date.now();
let _unsubZumbido = null;

function iniciarEscuchaZumbido(){
    if (_unsubZumbido || !miIdentidad) return;
    _unsubZumbido = window.onSnapshot(_refZumbido(), (snap) => {
        if (!snap.exists()) return;
        const datos = snap.data();
        if (datos.de === miIdentidad || !datos.enviadoEn) return;
        if (datos.enviadoEn <= _ultimoZumbidoVisto) return;
        _ultimoZumbidoVisto = datos.enviadoEn;
        dispararEfectoZumbido();
    }, (err) => console.error('Error escuchando zumbido:', err));
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
        await window.setDoc(_refZumbido(), { de: miIdentidad, enviadoEn: ahora });
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
