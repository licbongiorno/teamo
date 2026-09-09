// ==================== EL JARDÍN COMPARTIDO ====================
// Juego cooperativo ASINCRÓNICO: no hace falta que ambos estén conectados a la vez.
// Los medidores de agua y sol no bajan con un setInterval continuo: se guarda el
// timestamp del último riego/sol y, al abrir el juego, se calcula cuánto bajaron
// según el tiempo real transcurrido (5% por cada hora).
const DECAIMIENTO_POR_HORA_JARDIN = 5;   // % que baja cada medidor por cada hora real transcurrida
const CRECIMIENTO_POR_CUIDADO_JARDIN = 2; // % de progreso que suma cada riego o sol
const FERTILIZANTE_POR_KAIZEN = 10;       // % de progreso que suma un logro del Tablero Kaizen

const ETAPAS_JARDIN = [
    { min: 0,  emoji: '🌰', nombre: 'Semilla' },
    { min: 15, emoji: '🌱', nombre: 'Brote' },
    { min: 35, emoji: '🌿', nombre: 'Planta pequeña' },
    { min: 60, emoji: '🌳', nombre: 'Árbol en crecimiento' },
    { min: 85, emoji: '✨', nombre: 'A punto de florecer' }
];

function refJardin(){ return window.doc(window.db, 'juegos', 'jardin'); }

function etapaJardinActual(progreso){
    let etapa = ETAPAS_JARDIN[0];
    for (const e of ETAPAS_JARDIN) { if (progreso >= e.min) etapa = e; }
    return etapa;
}

// Calcula el nivel actual de un medidor (0-100) a partir del timestamp de la
// última vez que se repuso al 100%, sin depender de ningún setInterval que baje valores.
function nivelActualJardin(timestampGuardado){
    if (!timestampGuardado) return 100;
    const ms = timestampGuardado.toDate ? timestampGuardado.toDate().getTime() : timestampGuardado;
    const horasTranscurridas = Math.max(0, (Date.now() - ms) / 3600000);
    return Math.max(0, Math.round(100 - horasTranscurridas * DECAIMIENTO_POR_HORA_JARDIN));
}

function iniciarJardin(){
    if (window._unsubJardin) window._unsubJardin();
    if (window._intervaloJardin) { clearInterval(window._intervaloJardin); window._intervaloJardin = null; }

    window._unsubJardin = window.onSnapshot(refJardin(), async (snap) => {
        if (!snap.exists()) {
            try {
                await window.setDoc(refJardin(), {
                    progreso: 0,
                    formaElegida: null,
                    historial: [],
                    ultimoRiego: window.serverTimestamp(),
                    ultimoSol: window.serverTimestamp()
                });
            } catch (e) { console.error('Error creando el jardín:', e); }
            return;
        }
        window._estadoJardinActual = snap.data();
        renderJardin(window._estadoJardinActual);
    }, (err) => {
        console.error('Error de Firestore en jardín:', err);
        document.getElementById('contenido-jardin').innerHTML = `<div class="panel texto-centro texto-tenue">⚠️ No se pudo conectar (${err.code || 'error'}). Si el error dice "permission-denied", hay que sumar la colección "juegos" a las Reglas de Firestore.</div>`;
    });

    // Refresca los medidores cada 30s (para que se vean bajar aunque nadie los toque),
    // reusando el último estado recibido, sin volver a pedirle nada a Firestore.
    window._intervaloJardin = setInterval(() => {
        if (window._estadoJardinActual) renderJardin(window._estadoJardinActual);
    }, 30000);
}

function renderJardin(estado){
    const cont = document.getElementById('contenido-jardin');
    if (!cont) return;

    const progreso = Math.max(0, Math.min(100, estado.progreso || 0));
    const agua = nivelActualJardin(estado.ultimoRiego);
    const sol = nivelActualJardin(estado.ultimoSol);
    const etapa = etapaJardinActual(progreso);
    const formaElegida = estado.formaElegida;
    const historial = estado.historial || [];

    let emojiEscena = etapa.emoji;
    let nombreEscena = etapa.nombre;
    if (formaElegida === 'lapacho') { emojiEscena = '🌳🌸'; nombreEscena = 'Lapacho en flor'; }
    else if (formaElegida === 'enamorada') { emojiEscena = '🧱🌺'; nombreEscena = 'Enamorada del muro'; }

    let html = `
        <div class="panel texto-centro">
            <div class="escena-jardin">${emojiEscena}</div>
            <div style="font-size:1.05rem; margin-bottom:4px;">${nombreEscena}</div>
            <div class="texto-tenue" style="margin-bottom:2px;">${formaElegida ? '🌟 Etapa máxima alcanzada, entre los dos' : `Progreso de crecimiento: ${progreso}%`}</div>
            ${!formaElegida ? `<div class="barra-progreso-jardin"><div class="relleno-progreso-jardin" style="width:${progreso}%;"></div></div>` : ''}
        </div>

        <div class="panel">
            <div class="medidor-jardin">
                <div class="texto-tenue" style="margin-bottom:4px;">💧 Agua: ${agua}%</div>
                <div class="barra-medidor"><div class="relleno-medidor relleno-agua" style="width:${agua}%;"></div></div>
            </div>
            <div class="medidor-jardin" style="margin-bottom:0;">
                <div class="texto-tenue" style="margin-bottom:4px;">☀️ Sol: ${sol}%</div>
                <div class="barra-medidor"><div class="relleno-medidor relleno-sol" style="width:${sol}%;"></div></div>
            </div>
            <div class="btn-fila" style="margin-top:12px;">
                <button class="btn-principal" onclick="regarJardin()">Regar 💧</button>
                <button class="btn-principal" onclick="darSolJardin()">Dar Sol ☀️</button>
            </div>
        </div>`;

    if (!formaElegida && progreso >= 100) {
        html += `
        <div class="panel texto-centro">
            <div style="margin-bottom:8px;">🌟 ¡La planta está lista para su forma final! Elijan juntos:</div>
            <div class="opciones-forma-final">
                <div class="tarjeta-forma-final" onclick="elegirFormaJardin('lapacho')">
                    <div style="font-size:2rem;">🌳🌸</div>
                    <div style="font-size:0.82rem; margin-top:4px;">Lapacho en flor</div>
                </div>
                <div class="tarjeta-forma-final" onclick="elegirFormaJardin('enamorada')">
                    <div style="font-size:2rem;">🧱🌺</div>
                    <div style="font-size:0.82rem; margin-top:4px;">Enamorada del muro</div>
                </div>
            </div>
        </div>`;
    }

    html += `
        <div class="panel">
            <div style="font-weight:700; margin-bottom:8px;">🏆 Logros del Tablero Kaizen</div>
            <p class="texto-tenue" style="margin:0 0 10px;">Cuando uno de los dos cumpla un objetivo personal o familiar en la vida real, regístrenlo acá y sumen fertilizante 🧪 al crecimiento del jardín.</p>
            <button class="btn-secundario" onclick="mostrarFormularioKaizenJardin()">🧪 Registrar un logro</button>
            <div id="form-kaizen-jardin"></div>
            ${historial.length ? `<div class="historial-kaizen" style="margin-top:12px;">${historial.slice(-6).map(h => '• ' + escaparHtml(h)).join('<br>')}</div>` : ''}
        </div>`;

    if (formaElegida) {
        html += `<button class="btn-secundario" onclick="reiniciarJardin()">🌰 Plantar una semilla nueva</button>`;
    }

    cont.innerHTML = html;
}

async function regarJardin(){
    vibrarJ(12);
    const estado = window._estadoJardinActual || {};
    const nuevoProgreso = estado.formaElegida ? (estado.progreso || 0) : Math.min(100, (estado.progreso || 0) + CRECIMIENTO_POR_CUIDADO_JARDIN);
    try {
        await window.updateDoc(refJardin(), {
            ultimoRiego: window.serverTimestamp(),
            progreso: nuevoProgreso
        });
        if (typeof registrarEvento === 'function') {
            registrarEvento('cuidado_compartido', `${nombreJugador(miIdentidad)} regó El Jardín Compartido`);
        }
    } catch (e) { console.error('Error regando el jardín:', e); }
}

async function darSolJardin(){
    vibrarJ(12);
    const estado = window._estadoJardinActual || {};
    const nuevoProgreso = estado.formaElegida ? (estado.progreso || 0) : Math.min(100, (estado.progreso || 0) + CRECIMIENTO_POR_CUIDADO_JARDIN);
    try {
        await window.updateDoc(refJardin(), {
            ultimoSol: window.serverTimestamp(),
            progreso: nuevoProgreso
        });
    } catch (e) { console.error('Error dando sol al jardín:', e); }
}

async function elegirFormaJardin(forma){
    vibrarJ([10,30,10]);
    const estado = window._estadoJardinActual;
    if (!estado || estado.formaElegida || (estado.progreso || 0) < 100) return;
    const nombreForma = forma === 'lapacho' ? 'un majestuoso Lapacho en flor 🌳🌸' : 'una gran Enamorada del muro 🧱🌺';
    try {
        await window.updateDoc(refJardin(), {
            formaElegida: forma,
            historial: pushLog(estado, `🌟 El jardín se convirtió en ${nombreForma}, entre los dos.`)
        });
    } catch (e) { console.error('Error eligiendo la forma final del jardín:', e); }
}

function mostrarFormularioKaizenJardin(){
    const cont = document.getElementById('form-kaizen-jardin');
    if (!cont) return;
    cont.innerHTML = `
        <div style="margin-top:10px;">
            <input type="text" id="input-objetivo-kaizen" placeholder="¿Qué objetivo cumpliste?" autocomplete="off"
                style="width:100%; padding:12px; border-radius:12px; border:1px solid var(--borde); background:rgba(255,255,255,0.06); color:var(--texto); font-size:0.9rem; margin-bottom:8px; text-align:center;">
            <button class="btn-principal" onclick="registrarKaizenJardin()">🧪 Sumar fertilizante</button>
        </div>`;
    setTimeout(() => document.getElementById('input-objetivo-kaizen')?.focus(), 100);
}

async function registrarKaizenJardin(){
    const input = document.getElementById('input-objetivo-kaizen');
    const objetivo = input ? input.value.trim() : '';
    if (!objetivo) return;
    vibrarJ([10,20,10]);
    const estado = window._estadoJardinActual || {};
    const nuevoProgreso = Math.min(100, (estado.progreso || 0) + FERTILIZANTE_POR_KAIZEN);
    const mensaje = `${nombreJugador(miIdentidad)} completó un objetivo ("${objetivo}") y aportó fertilizante 🧪`;
    try {
        await window.updateDoc(refJardin(), {
            progreso: nuevoProgreso,
            historial: pushLog(estado, mensaje)
        });
        const cont = document.getElementById('form-kaizen-jardin');
        if (cont) cont.innerHTML = '';
    } catch (e) { console.error('Error registrando logro Kaizen:', e); }
}

async function reiniciarJardin(){
    vibrarJ(12);
    try {
        await window.setDoc(refJardin(), {
            progreso: 0,
            formaElegida: null,
            historial: pushLog(window._estadoJardinActual, '🌰 Plantaron una semilla nueva, juntos otra vez.'),
            ultimoRiego: window.serverTimestamp(),
            ultimoSol: window.serverTimestamp()
        });
    } catch (e) { console.error('Error reiniciando el jardín:', e); }
}
