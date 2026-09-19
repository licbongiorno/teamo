// ==================== EL BARÓMETRO DE DISCUSIÓN ====================
// No es un juego: es un botón de pánico para cuando hace falta hablar
// en serio y las cosas están tensas. Reglas de discusión sana + un
// indicador de "de quién es el turno de hablar" (para no interrumpirse)
// + un timer de enfriamiento compartido, sincronizado en vivo entre
// los dos. Un solo documento 'juegos/barometro', sin transacciones
// (bajo riesgo de choque: esto lo usan de a uno por vez, hablando).
function refBarometro(){ return window.doc(window.db, 'juegos', 'barometro'); }

const REGLAS_BAROMETRO = [
    'Hablen de a uno por vez — el que no tiene el turno, escucha.',
    'Usen "yo siento" en vez de "vos siempre" o "vos nunca".',
    'Si alguien necesita una pausa, se la dan sin discutir.',
    'El objetivo es entenderse, no ganar la discusión.',
];

let _intervaloBarometro = null;

function iniciarBarometro(){
    if (_intervaloBarometro) { clearInterval(_intervaloBarometro); _intervaloBarometro = null; }
    if (window._unsubBarometro) window._unsubBarometro();
    window._unsubBarometro = window.onSnapshot(refBarometro(), (snap) => {
        renderBarometro(snap.exists() ? snap.data() : {});
    }, (err) => {
        console.error('Error de Firestore en el barómetro:', err);
        document.getElementById('contenido-barometro').innerHTML = `<div class="panel texto-centro texto-tenue">⚠️ No se pudo conectar (${err.code || 'error'}).</div>`;
    });
}

function renderBarometro(estado){
    const cont = document.getElementById('contenido-barometro');
    if (_intervaloBarometro) { clearInterval(_intervaloBarometro); _intervaloBarometro = null; }

    let html = `<div class="panel texto-centro">
        <p class="texto-tenue">Para cuando hace falta hablar en serio y las cosas están tensas.</p>
    </div>
    <div class="panel">
        <p class="texto-tenue" style="margin:0 0 8px;">📋 Reglas de oro</p>
        ${REGLAS_BAROMETRO.map((r, i) => `<p style="margin:0 0 6px; font-size:0.9rem;">${i + 1}. ${r}</p>`).join('')}
    </div>`;

    const turnoDe = estado.turnoDe || null;
    html += `<div class="panel texto-centro">
        <p class="texto-tenue" style="margin:0 0 8px;">🎙️ Turno para hablar</p>
        <p style="font-size:1.1rem; margin:0 0 10px;">${turnoDe ? `Le toca a ${nombreJugador(turnoDe)}` : 'Todavía no eligieron'}</p>
        <div class="btn-fila">
            <button class="btn-secundario" ${turnoDe === miIdentidad ? 'disabled style="opacity:0.5;"' : ''} onclick="tomarTurnoBarometro()">Es mi turno</button>
            <button class="btn-secundario" ${turnoDe === miRival ? 'disabled style="opacity:0.5;"' : ''} onclick="pasarTurnoBarometro()">Le paso el turno</button>
        </div>
    </div>`;

    const pausaHasta = estado.pausaHasta || 0;
    const enPausa = pausaHasta > Date.now();
    if (enPausa) {
        html += `<div class="panel texto-centro" id="panel-pausa-barometro">
            <p class="texto-tenue" style="margin:0 0 6px;">🌬️ Tómense un respiro</p>
            <p style="font-size:1.6rem; margin:0;" id="reloj-pausa-barometro">--:--</p>
        </div>`;
    } else {
        html += `<div class="panel texto-centro">
            <button class="btn-principal" onclick="pedirPausaBarometro()">⏸️ Pedir una pausa de 10 minutos</button>
        </div>`;
    }

    cont.innerHTML = html;

    if (enPausa) {
        const actualizarReloj = () => {
            const restanteMs = pausaHasta - Date.now();
            const relojEl = document.getElementById('reloj-pausa-barometro');
            if (!relojEl) { if (_intervaloBarometro) { clearInterval(_intervaloBarometro); _intervaloBarometro = null; } return; }
            if (restanteMs <= 0) {
                relojEl.innerText = '¿Listos? 💜';
                if (_intervaloBarometro) { clearInterval(_intervaloBarometro); _intervaloBarometro = null; }
                return;
            }
            const totalSeg = Math.ceil(restanteMs / 1000);
            const mm = String(Math.floor(totalSeg / 60)).padStart(2, '0');
            const ss = String(totalSeg % 60).padStart(2, '0');
            relojEl.innerText = `${mm}:${ss}`;
        };
        actualizarReloj();
        _intervaloBarometro = setInterval(actualizarReloj, 1000);
    }
}

async function tomarTurnoBarometro(){
    vibrarJ(12);
    try { await window.setDoc(refBarometro(), { turnoDe: miIdentidad }, { merge: true }); }
    catch (e) { console.error('No se pudo tomar el turno:', e); }
}

async function pasarTurnoBarometro(){
    vibrarJ(12);
    try { await window.setDoc(refBarometro(), { turnoDe: miRival }, { merge: true }); }
    catch (e) { console.error('No se pudo pasar el turno:', e); }
}

async function pedirPausaBarometro(){
    vibrarJ([15, 30, 15]);
    try { await window.setDoc(refBarometro(), { pausaHasta: Date.now() + 10 * 60 * 1000 }, { merge: true }); }
    catch (e) { console.error('No se pudo pedir la pausa:', e); }
}
