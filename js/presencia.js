// ============================================================
// presencia.js - avisa si el otro esta jugando algo ahora mismo,
// para invitar a sumarse en vivo. Un solo documento en 'juegos'
// (id 'presencia') con el juego actual de cada uno y cuando se
// actualizo por ultima vez. Si pasaron mas de 40s sin actualizarse,
// se considera que ya no esta ahi (sin necesidad de "avisar" al salir).
// ============================================================
const _VENTANA_PRESENCIA_MS = 40000;
let _intervaloPresencia = null;

function _refPresencia(){ return window.doc(window.db, 'juegos', 'presencia'); }

async function marcarPresencia(juegoId){
    if (!miIdentidad || !window.db) return;
    try {
        await window.setDoc(_refPresencia(), {
            [miIdentidad]: { juego: juegoId || null, actualizadoEn: Date.now() }
        }, { merge: true });
    } catch (e) { /* silencioso: la presencia no es critica */ }
}

function iniciarLatidoPresencia(juegoId){
    detenerLatidoPresencia();
    marcarPresencia(juegoId);
    _intervaloPresencia = setInterval(() => marcarPresencia(juegoId), 20000);
}

function detenerLatidoPresencia(){
    if (_intervaloPresencia) { clearInterval(_intervaloPresencia); _intervaloPresencia = null; }
    marcarPresencia(null);
}

// Escucha permanente (arranca una sola vez) para mostrar el avisito
// en el menu principal cuando el otro esta jugando algo en vivo.
let _escuchaPresenciaIniciada = false;

function iniciarEscuchaPresencia(){
    if (_escuchaPresenciaIniciada || !miIdentidad) return;
    _escuchaPresenciaIniciada = true;
    window.onSnapshot(_refPresencia(), (snap) => {
        if (!snap.exists()) { renderAvisoPresencia(null); return; }
        const datos = snap.data();
        const delRival = datos[miRival];
        if (!delRival || !delRival.juego) { renderAvisoPresencia(null); return; }
        const fresco = (Date.now() - (delRival.actualizadoEn || 0)) < _VENTANA_PRESENCIA_MS;
        renderAvisoPresencia(fresco ? delRival.juego : null);
    }, (err) => console.warn('Error escuchando presencia:', err));
}

function renderAvisoPresencia(juegoId){
    const cont = document.getElementById('aviso-presencia');
    if (!cont) return;
    if (!juegoId) { cont.innerHTML = ''; return; }
    const juego = (window.JUEGOS || []).find(j => j.id === juegoId);
    const nombreJ = juego ? juego.nombre : juegoId;
    const icono = juego ? juego.icono : '🎮';
    cont.innerHTML = `<div class="aviso-presencia-activo" onclick="abrirJuego('${juegoId}')">
        ${nombreJugador(miRival)} esta jugando ${icono} ${nombreJ} ahora - tocá para sumarte
    </div>`;
}

window.iniciarLatidoPresencia = iniciarLatidoPresencia;
window.detenerLatidoPresencia = detenerLatidoPresencia;
window.iniciarEscuchaPresencia = iniciarEscuchaPresencia;
