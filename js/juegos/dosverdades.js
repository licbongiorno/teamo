// ==================== DOS VERDADES Y UNA MENTIRA ====================
// "Verdadero o falso sobre mí": uno escribe tres frases sobre sí mismo
// (dos verdaderas y una inventada) y el otro tiene que adivinar cuál es
// la mentira. Si la descubre, suma el que adivinó; si no, suma el que
// lo engañó. Las frases se pueden mandar por WhatsApp con un link que
// abre el juego directo.
// La ronda vive en un solo documento; arrancarla y elegir van en
// transacción para que nadie pise una ronda en curso ni elija dos veces.

function refDosVerdades(){ return window.doc(window.db, 'juegos', 'dosverdades'); }

let _dosVerdadesFaseAnterior = null;
let _formularioDosVerdadesAbierto = false;
let _estadoDosVerdades = null;

function iniciarDosVerdades(){
    if (window._unsubDosVerdades) window._unsubDosVerdades();
    _dosVerdadesFaseAnterior = null;
    _formularioDosVerdadesAbierto = false;
    window._unsubDosVerdades = window.onSnapshot(refDosVerdades(), (snap) => {
        const datos = snap.exists() ? snap.data() : null;
        if (datos && datos.fase === 'revelado' && _dosVerdadesFaseAnterior === 'adivinando' && window.sfx) window.sfx.revelar();
        _dosVerdadesFaseAnterior = datos ? datos.fase : null;
        _estadoDosVerdades = datos;
        renderDosVerdades(datos);
    }, (err) => {
        console.error('Error de Firestore en dosverdades:', err);
        document.getElementById('contenido-dosverdades').innerHTML = `<div class="panel texto-centro texto-tenue">⚠️ No se pudo conectar (${err.code || 'error'}).</div>`;
    });
}

function renderDosVerdades(estado){
    const cont = document.getElementById('contenido-dosverdades');
    if (!cont) return;
    // Mientras se escriben las frases, sólo se pisa el formulario si el
    // otro arrancó una ronda (así no se borra lo que se está tipeando).
    if (_formularioDosVerdadesAbierto) {
        if (estado && estado.fase === 'adivinando') _formularioDosVerdadesAbierto = false;
        else return;
    }
    const p = estado?.puntajes || { nico: 0, carito: 0 };
    let html = `<div class="texto-tenue texto-centro" style="margin-bottom:6px;">Nico ${p.nico || 0} — Carito ${p.carito || 0}</div>`;

    if (!estado || !estado.fase || estado.fase === 'sin_ronda') {
        html += `<div class="panel texto-centro">
            <p class="texto-tenue">Escribí tres cosas sobre vos: dos verdaderas y una inventada. ${nombreJugador(miRival)} tiene que descubrir cuál es la mentira.</p>
            <button class="btn-principal" onclick="abrirFormularioDosVerdades()">✍️ Escribir mis 3 frases</button>
        </div>`;
        cont.innerHTML = html;
        return;
    }

    const frases = estado.frases || [];
    const soyAutor = estado.autor === miIdentidad;

    if (estado.fase === 'adivinando') {
        if (soyAutor) {
            html += `<div class="panel">
                <div class="texto-tenue texto-centro" style="margin-bottom:8px;">Tus frases (la mentira es la marcada con 🤥):</div>
                ${frases.map((f, i) => `<div class="frase-dosverdades">${i === estado.mentira ? '🤥' : '✅'} ${escaparHtml(f)}</div>`).join('')}
                <div class="texto-tenue texto-centro destello" style="margin-top:10px;">Esperando que ${nombreJugador(miRival)} adivine…</div>
            </div>
            <button class="btn-secundario" style="width:100%;" onclick="mandarDosVerdadesWhatsApp()">📲 Mandáselas por WhatsApp</button>`;
        } else {
            html += `<div class="panel">
                <div class="texto-centro" style="margin-bottom:8px;">${nombreJugador(estado.autor)} dice… ¿cuál es la mentira? 🤔</div>
                ${frases.map((f, i) => `<button class="opcion-dosverdades" onclick="elegirMentiraDosVerdades(${i})">${escaparHtml(f)}</button>`).join('')}
            </div>`;
        }
        cont.innerHTML = html;
        return;
    }

    // revelado
    const acerto = estado.eleccion === estado.mentira;
    const adivinador = estado.autor === 'nico' ? 'carito' : 'nico';
    html += `<div class="panel texto-centro logro-animado">
        <div style="font-size:1.1rem; margin-bottom:8px;">${acerto ? `🕵️ ¡${nombreJugador(adivinador)} descubrió la mentira!` : `😏 ¡${nombreJugador(estado.autor)} engañó a ${nombreJugador(adivinador)}!`}</div>
        ${frases.map((f, i) => `<div class="frase-dosverdades${i === estado.mentira ? ' frase-mentira' : ''}">${i === estado.mentira ? '🤥' : '✅'} ${escaparHtml(f)}${i === estado.eleccion ? ' <span class="texto-tenue">← elegida</span>' : ''}</div>`).join('')}
    </div>
    <button class="btn-principal" onclick="abrirFormularioDosVerdades()">✍️ Ahora escribo yo</button>`;
    cont.innerHTML = html;
}

function abrirFormularioDosVerdades(){
    vibrarJ(12);
    _formularioDosVerdadesAbierto = true;
    const cont = document.getElementById('contenido-dosverdades');
    const input = (i) => `<div class="fila-form-dosverdades">
        <input type="text" id="frase-dosverdades-${i}" maxlength="140" placeholder="Frase ${i + 1}" autocomplete="off" class="input-dosverdades">
        <label class="marca-mentira-dosverdades"><input type="radio" name="mentira-dosverdades" value="${i}"> 🤥</label>
    </div>`;
    cont.innerHTML = `<div class="panel">
        <p class="texto-tenue texto-centro">Escribí tres frases sobre vos y marcá con 🤥 la que es mentira.</p>
        ${[0, 1, 2].map(input).join('')}
        <div class="btn-fila" style="margin-top:10px;">
            <button class="btn-secundario" onclick="cancelarFormularioDosVerdades()">Cancelar</button>
            <button class="btn-principal" id="btn-guardar-dosverdades" onclick="guardarFrasesDosVerdades()">Listo</button>
        </div>
        <div class="texto-tenue texto-centro" id="error-dosverdades" style="margin-top:8px;"></div>
    </div>`;
    setTimeout(() => { const el = document.getElementById('frase-dosverdades-0'); if (el) el.focus(); }, 100);
}

function cancelarFormularioDosVerdades(){
    _formularioDosVerdadesAbierto = false;
    renderDosVerdades(_estadoDosVerdades);
}

async function guardarFrasesDosVerdades(){
    const frases = [0, 1, 2].map(i => (document.getElementById('frase-dosverdades-' + i)?.value || '').trim());
    const marcada = document.querySelector('input[name="mentira-dosverdades"]:checked');
    const errorDiv = document.getElementById('error-dosverdades');
    if (frases.some(f => !f)) { if (errorDiv) errorDiv.innerText = 'Completá las tres frases.'; return; }
    if (!marcada) { if (errorDiv) errorDiv.innerText = 'Marcá con 🤥 cuál es la mentira.'; return; }
    vibrarJ(12);
    const boton = document.getElementById('btn-guardar-dosverdades');
    if (boton) { boton.disabled = true; boton.innerText = 'Guardando…'; }
    // Se mezclan para que la mentira no quede siempre en el mismo lugar.
    const orden = [0, 1, 2];
    for (let k = orden.length - 1; k > 0; k--) {
        const j = Math.floor(Math.random() * (k + 1));
        [orden[k], orden[j]] = [orden[j], orden[k]];
    }
    const mezcladas = orden.map(i => frases[i]);
    const mentira = orden.indexOf(Number(marcada.value));
    const ref = refDosVerdades();
    try {
        await window.runTransaction(window.db, async (tx) => {
            const snap = await tx.get(ref);
            const estado = snap.exists() ? snap.data() : null;
            if (estado && estado.fase === 'adivinando') return; // el otro ya arrancó una ronda
            let puntajes = estado?.puntajes;
            if (!puntajes) {
                // Primera ronda: se arranca con el marcador del juego viejo
                // "Mentira o Verdad", que se unificó con este (allá cada
                // acierto valía 2; acá vale 1).
                const viejo = await tx.get(window.doc(window.db, 'juegos', 'mentiraverdad'));
                const pv = viejo.exists() ? (viejo.data().puntajes || {}) : {};
                puntajes = { nico: Math.round((pv.nico || 0) / 2), carito: Math.round((pv.carito || 0) / 2) };
            }
            tx.set(ref, {
                fase: 'adivinando', autor: miIdentidad, frases: mezcladas, mentira, eleccion: null, puntajes
            });
        });
        _formularioDosVerdadesAbierto = false;
    } catch (e) {
        console.error('No se pudieron guardar las frases:', e);
        if (boton) { boton.disabled = false; boton.innerText = 'Listo'; }
        if (errorDiv) errorDiv.innerText = `⚠️ No se pudo guardar (${e.code || 'error'}). Probá de nuevo.`;
    }
}

async function elegirMentiraDosVerdades(i){
    const res = await window.jugadaSegura(refDosVerdades(), (estado) => {
        if (!estado || estado.fase !== 'adivinando' || estado.autor === miIdentidad) return null;
        const acerto = i === estado.mentira;
        const puntajes = { ...(estado.puntajes || { nico: 0, carito: 0 }) };
        const suma = acerto ? miIdentidad : estado.autor;
        puntajes[suma] = (puntajes[suma] || 0) + 1;
        return { fase: 'revelado', eleccion: i, puntajes };
    });
    if (!res) return;
    const acerto = i === res.estado.mentira;
    vibrarJ(acerto ? [15, 30, 15] : [10, 30, 10]);
    if (acerto && window.fx) window.fx.confeti();
    if (typeof registrarEvento === 'function') {
        registrarEvento('reflexion_completada', acerto
            ? `${nombreJugador(miIdentidad)} descubrió la mentira de ${nombreJugador(res.estado.autor)}`
            : `${nombreJugador(res.estado.autor)} engañó a ${nombreJugador(miIdentidad)} en Dos Verdades y una Mentira`);
    }
}

function mandarDosVerdadesWhatsApp(){
    vibrarJ(10);
    const numero = (typeof NUMEROS_WHATSAPP_PAREJA !== 'undefined') && NUMEROS_WHATSAPP_PAREJA[miRival];
    const frases = (_estadoDosVerdades && _estadoDosVerdades.frases) || [];
    if (!numero || !frases.length) return;
    const enlace = `${location.origin}${location.pathname}?juego=dosverdades`;
    const texto = `🤥 ${nombreJugador(miIdentidad)} te mandó "Dos verdades y una mentira":\n\n${frases.map((f, i) => `${i + 1}. ${f}`).join('\n')}\n\n¿Cuál es la mentira? Elegila en la app: ${enlace}`;
    window.open(`https://wa.me/${numero}?text=${encodeURIComponent(texto)}`, '_blank');
}
