// ==================== AHORCADO ====================
const ABECEDARIO = "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ".split("");

function normalizarLetra(l){
    return l.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
}

function iniciarAhorcado(){
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

    const letrasPalabra = palabra.split("").map(normalizarLetra);
    const todasAdivinadas = letrasPalabra.every(l => l === " " || letrasIntentadas.includes(l));

    let fase = estado.fase;
    if (fase === 'jugando' && todasAdivinadas) fase = 'ganado';
    if (fase === 'jugando' && errores >= erroresMax) fase = 'perdido';

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
            <button class="btn-principal" onclick="mostrarFormularioPalabra()">🔁 Jugar de nuevo</button>
        </div>
        <div id="form-palabra-ahorcado"></div>`;
    }

    cont.innerHTML = html;
}

function mostrarFormularioPalabra(){
    const cont = document.getElementById('form-palabra-ahorcado');
    if (!cont) return;
    cont.innerHTML = `
        <div class="panel">
            <input type="text" id="input-palabra-secreta" placeholder="Escribí la palabra secreta" autocomplete="off"
                style="width:100%; padding:12px; border-radius:12px; border:1px solid var(--borde); background:rgba(255,255,255,0.06); color:var(--texto); font-size:1rem; margin-bottom:8px; text-align:center;">
            <input type="text" id="input-categoria-secreta" placeholder="Pista o categoría (opcional)" autocomplete="off"
                style="width:100%; padding:12px; border-radius:12px; border:1px solid var(--borde); background:rgba(255,255,255,0.06); color:var(--texto); font-size:0.9rem; margin-bottom:10px; text-align:center;">
            <button class="btn-principal" onclick="proponerPalabra()">Empezar partida</button>
        </div>`;
    setTimeout(() => document.getElementById('input-palabra-secreta').focus(), 100);
}

async function proponerPalabra(){
    const palabra = document.getElementById('input-palabra-secreta').value.trim();
    const categoria = document.getElementById('input-categoria-secreta').value.trim();
    if (!palabra) return;
    vibrarJ(12);
    const ref = window.doc(window.db, 'juegos', 'ahorcado');
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
}

async function intentarLetra(letra){
    const ref = window.doc(window.db, 'juegos', 'ahorcado');
    // Se relee el estado actual vía el listener; para evitar condiciones de carrera
    // simples (dos toques rápidos) alcanza con tomar el último snapshot renderizado.
    const cont = document.getElementById('contenido-ahorcado');
    if (cont.dataset.bloqueado === '1') return;
    cont.dataset.bloqueado = '1';
    try {
        const snap = await new Promise((resolve) => {
            const unsub = window.onSnapshot(ref, (s) => { unsub(); resolve(s); });
        });
        const estado = snap.data();
        if (!estado || estado.letrasIntentadas.includes(letra)) return;
        const nuevasLetras = [...estado.letrasIntentadas, letra];
        const letrasPalabra = estado.palabra.split("").map(normalizarLetra);
        const acierto = letrasPalabra.includes(letra);
        const nuevosErrores = acierto ? estado.errores : estado.errores + 1;
        vibrarJ(acierto ? 15 : [10,30,10]);
        await window.updateDoc(ref, { letrasIntentadas: nuevasLetras, errores: nuevosErrores });
    } finally {
        cont.dataset.bloqueado = '0';
    }
}
