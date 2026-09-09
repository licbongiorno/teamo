// ==================== AHORCADO ====================
const ABECEDARIO = "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ".split("");

function normalizarLetra(l){
    return l.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
}

// Si tenemos el formulario de "proponer palabra" abierto, no lo pisamos
// con cada snapshot que llega de Firestore (antes: si te llegaba una
// actualización mientras tipeabas tu palabra nueva, el formulario se
// borraba solo y tenías que volver a intentarlo, sin ningún aviso).
let _formularioAhorcadoAbierto = false;

function iniciarAhorcado(){
    _formularioAhorcadoAbierto = false;
    const ref = window.doc(window.db, 'juegos', 'ahorcado');
    if (window._unsubAhorcado) window._unsubAhorcado();
    window._unsubAhorcado = window.onSnapshot(ref, (snap) => {
        renderAhorcado(snap.exists() ? snap.data() : null);
    }, (err) => {
        console.error('Error de Firestore en ahorcado:', err);
        document.getElementById('contenido-ahorcado').innerHTML = `<div class="panel texto-centro texto-tenue">⚠️ No se pudo conectar (${err.code || 'error'}). Si el error dice "permission-denied", hay que sumar la colección "juegos" a las Reglas de Firestore.</div>`;
    });
}

function renderAhorcado(estado){
    const cont = document.getElementById('contenido-ahorcado');

    // Mientras el formulario de "proponer palabra" está abierto, sólo lo
    // pisamos si de verdad arrancó una partida nueva (fase 'jugando') o si
    // no hay ninguna partida — cualquier otro snapshot de por medio (por
    // ejemplo, ecos del propio guardado) no debe borrar lo que se está tipeando.
    if (_formularioAhorcadoAbierto && estado && estado.fase === 'jugando') {
        _formularioAhorcadoAbierto = false;
    } else if (_formularioAhorcadoAbierto && estado) {
        return;
    }

    if (!estado || estado.fase === 'terminado_reiniciar') {
        cont.innerHTML = `
            <div class="panel texto-centro">
                <p class="texto-tenue">No hay ninguna partida activa. Proponé una palabra para que ${miRival === 'carito' ? 'Carito' : 'Nico'} la adivine.</p>
                <button class="btn-principal" onclick="mostrarFormularioPalabra()">✍️ Proponer una palabra</button>
            </div>
            <div id="form-palabra-ahorcado"></div>
        `;
        return;
    }

    const soyProponente = estado.proponente === miIdentidad;
    const palabra = estado.palabra || "";
    const letrasIntentadas = estado.letrasIntentadas || [];
    const erroresMax = estado.erroresMax || 6;
    const errores = estado.errores || 0;

    const dibujos = [
        `\n \n \n \n \n=====`,
        `  ____\n |\n |\n |\n |\n=====`,
        `  ____\n |    |\n |\n |\n |\n=====`,
        `  ____\n |    |\n |    😵\n |\n |\n=====`,
        `  ____\n |    |\n |    😵\n |    |\n |\n=====`,
        `  ____\n |    |\n |    😵\n |   /|\n |\n=====`,
        `  ____\n |    |\n |    😵\n |   /|\\\n |   / \n=====`
    ];

    // La fase ya viene decidida por quien adivinó la última letra (ver
    // intentarLetra), así los dos lados ven exactamente el mismo resultado
    // sin depender de que cada pantalla la recalcule por su cuenta.
    const fase = estado.fase;

    const visual = palabra.split("").map(ch => {
        if (ch === " ") return "&nbsp;&nbsp;";
        const norm = normalizarLetra(ch);
        const mostrar = fase !== 'jugando' || letrasIntentadas.includes(norm);
        return mostrar ? ch.toUpperCase() : "_";
    }).join(" ");

    let html = `<div class="panel texto-centro">
        <div class="texto-tenue" style="margin-bottom:8px;">${soyProponente ? '👀 Vos elegiste la palabra' : '🎯 Te toca adivinar'} ${estado.categoria ? '· Pista: ' + estado.categoria : ''}</div>
        <pre style="font-family:monospace; font-size:0.85rem; opacity:0.75; margin:4px 0 10px;">${dibujos[Math.min(errores, dibujos.length-1)]}</pre>
        <div style="font-size:1.6rem; letter-spacing:3px; font-family:monospace; margin-bottom:10px; word-break:break-all;">${visual}</div>
        <div class="texto-tenue">Errores: ${errores} / ${erroresMax}</div>
    </div>`;

    if (fase === 'jugando' && !soyProponente) {
        html += `<div class="panel"><div style="display:grid; grid-template-columns:repeat(7,1fr); gap:6px;">`;
        ABECEDARIO.forEach(letra => {
            const usada = letrasIntentadas.includes(letra);
            html += `<button class="btn-secundario" style="padding:8px 0; font-size:0.85rem; ${usada ? 'opacity:0.3;' : ''}" ${usada ? 'disabled' : ''} onclick="intentarLetra('${letra}')">${letra}</button>`;
        });
        html += `</div></div>`;
    } else if (fase === 'jugando' && soyProponente) {
        html += `<div class="panel texto-centro texto-tenue">Esperando que adivine, letra por letra…</div>`;
    }

    if (fase === 'ganado' || fase === 'perdido') {
        html += `<div class="panel texto-centro">
            <div style="font-size:1.3rem; margin-bottom:6px;">${fase === 'ganado' ? '🎉 ¡Adivinada!' : '💀 Se acabaron los intentos'}</div>
            <div class="texto-tenue" style="margin-bottom:12px;">La palabra era: <b>${palabra.toUpperCase()}</b></div>
            <button class="btn-principal" onclick="reiniciarAhorcado()">🧹 Limpiar y jugar otra</button>
        </div>
        <div id="form-palabra-ahorcado"></div>`;
    }

    cont.innerHTML = html;
}

function mostrarFormularioPalabra(){
    _formularioAhorcadoAbierto = true;
    const cont = document.getElementById('form-palabra-ahorcado');
    if (!cont) return;
    cont.innerHTML = `
        <div class="panel">
            <input type="text" id="input-palabra-secreta" placeholder="Escribí la palabra secreta" autocomplete="off"
                style="width:100%; padding:12px; border-radius:12px; border:1px solid var(--borde); background:rgba(255,255,255,0.06); color:var(--texto); font-size:1rem; margin-bottom:8px; text-align:center;">
            <input type="text" id="input-categoria-secreta" placeholder="Pista o categoría (opcional)" autocomplete="off"
                style="width:100%; padding:12px; border-radius:12px; border:1px solid var(--borde); background:rgba(255,255,255,0.06); color:var(--texto); font-size:0.9rem; margin-bottom:10px; text-align:center;">
            <button class="btn-principal" id="btn-empezar-partida-ahorcado" onclick="proponerPalabra()">Empezar partida</button>
            <div class="texto-tenue" id="error-palabra-ahorcado" style="margin-top:8px;"></div>
        </div>`;
    setTimeout(() => document.getElementById('input-palabra-secreta').focus(), 100);
}

async function proponerPalabra(){
    const inputPalabra = document.getElementById('input-palabra-secreta');
    const palabra = inputPalabra.value.trim();
    const categoria = document.getElementById('input-categoria-secreta').value.trim();
    if (!palabra) return;
    if (typeof vibrarJ === 'function') vibrarJ(12); // Validación por si no existe la función
    const boton = document.getElementById('btn-empezar-partida-ahorcado');
    const errorDiv = document.getElementById('error-palabra-ahorcado');
    if (boton) { boton.disabled = true; boton.innerText = 'Guardando…'; }
    const ref = window.doc(window.db, 'juegos', 'ahorcado');
    try {
        await window.setDoc(ref, {
            palabra: palabra,
            categoria: categoria,
            proponente: miIdentidad,
            adivinador: miRival,
            letrasIntentadas: [],
            erroresMax: 6,
            errores: 0,
            fase: 'jugando',
            actualizadoEn: window.serverTimestamp()
        });
        _formularioAhorcadoAbierto = false;
        // El propio onSnapshot va a redibujar la pantalla con la partida
        // ya arrancada apenas confirme la escritura.
    } catch (e) {
        console.error('Error al proponer palabra:', e);
        if (boton) { boton.disabled = false; boton.innerText = 'Empezar partida'; }
        if (errorDiv) errorDiv.innerText = `⚠️ No se pudo guardar (${e.code || 'error'}). Probá de nuevo.`;
    }
}

async function intentarLetra(letra){
    const ref = window.doc(window.db, 'juegos', 'ahorcado');
    const cont = document.getElementById('contenido-ahorcado');
    if (cont.dataset.bloqueado === '1') return;
    cont.dataset.bloqueado = '1';
    try {
        const snap = await new Promise((resolve) => {
            const unsub = window.onSnapshot(ref, (s) => { unsub(); resolve(s); });
        });
        const estado = snap.data();
        if (!estado || estado.fase !== 'jugando' || estado.letrasIntentadas.includes(letra)) return;
        const nuevasLetras = [...estado.letrasIntentadas, letra];
        const letrasPalabra = estado.palabra.split("").map(normalizarLetra);
        const acierto = letrasPalabra.includes(letra);
        const nuevosErrores = acierto ? estado.errores : estado.errores + 1;
        
        if (typeof vibrarJ === 'function') {
            vibrarJ(acierto ? 15 : [10,30,10]);
        }

        // Decidimos acá mismo, en la misma escritura, si esta letra termina
        // la partida (ganada o perdida) — así los dos lados quedan con
        // exactamente el mismo resultado guardado, sin que cada pantalla
        // tenga que recalcularlo por su cuenta.
        const erroresMax = estado.erroresMax || 6;
        const todasAdivinadas = letrasPalabra.every(l => l === ' ' || nuevasLetras.includes(l));
        let nuevaFase = 'jugando';
        if (todasAdivinadas) nuevaFase = 'ganado';
        else if (nuevosErrores >= erroresMax) nuevaFase = 'perdido';

        await window.updateDoc(ref, { letrasIntentadas: nuevasLetras, errores: nuevosErrores, fase: nuevaFase });
    } finally {
        cont.dataset.bloqueado = '0';
    }
}

async function reiniciarAhorcado() {
    const ref = window.doc(window.db, 'juegos', 'ahorcado');
    const cont = document.getElementById('contenido-ahorcado');
    
    // Bloqueo simple para evitar múltiples toques
    if (cont) cont.style.pointerEvents = 'none';
    
    try {
        await window.updateDoc(ref, { fase: 'terminado_reiniciar' });
    } catch (e) {
        console.error('Error al reiniciar el ahorcado:', e);
    } finally {
        if (cont) cont.style.pointerEvents = 'auto';
    }
}
