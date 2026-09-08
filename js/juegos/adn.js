// ==================== ADN DE LA PAREJA ====================
const DIMENSIONES_ADN = {
    conexion: { icono: '❤️', nombre: 'Conexión' },
    comprension: { icono: '🧠', nombre: 'Comprensión' },
    diversion: { icono: '😂', nombre: 'Diversión' },
    quimica: { icono: '🔥', nombre: 'Química' },
    aventura: { icono: '🌎', nombre: 'Aventura' },
    estabilidad: { icono: '🏡', nombre: 'Estabilidad' },
    profundidad: { icono: '💭', nombre: 'Profundidad' },
};
const PREGUNTAS_ADN = [
    { texto: "Un fin de semana ideal es...", opciones: [["Hablar hasta tarde", "conexion"], ["Resolver algo juntos", "comprension"], ["Reírnos sin parar", "diversion"]] },
    { texto: "Lo que más nos define es...", opciones: [["Nuestra química", "quimica"], ["Nuestra rutina compartida", "estabilidad"], ["Nuestras charlas profundas", "profundidad"]] },
    { texto: "Si pudiéramos, ahora mismo...", opciones: [["Viajaríamos sin plan", "aventura"], ["Nos quedaríamos hablando", "conexion"], ["Jugaríamos algo juntos", "diversion"]] },
    { texto: "Lo que más valoro de nosotros es...", opciones: [["Que nos entendemos sin hablar", "comprension"], ["Que siempre hay chispa", "quimica"], ["Que somos un lugar seguro", "estabilidad"]] },
    { texto: "Nuestra mejor versión aparece cuando...", opciones: [["Nos reímos de todo", "diversion"], ["Nos abrimos del todo", "profundidad"], ["Nos animamos a algo nuevo", "aventura"]] },
    { texto: "Lo que más extraño de vos es...", opciones: [["Tu forma de mirarme", "quimica"], ["Hablar de cualquier cosa", "conexion"], ["Tu forma de calmarme", "estabilidad"]] },
    { texto: "Si tuviéramos que definir el futuro, sería...", opciones: [["Una aventura constante", "aventura"], ["Una base sólida", "estabilidad"], ["Un aprendizaje mutuo", "comprension"]] },
    { texto: "Lo que más nos hace reír es...", opciones: [["Nuestros chistes internos", "diversion"], ["Recordar anécdotas", "conexion"], ["Las cosas random que hacemos", "aventura"]] },
    { texto: "Cuando estamos mal, lo que más ayuda es...", opciones: [["Que me entiendas sin explicar", "comprension"], ["Sentir estabilidad", "estabilidad"], ["Hablarlo a fondo", "profundidad"]] },
    { texto: "Lo que más nos atrae del otro es...", opciones: [["La atracción física", "quimica"], ["La mente del otro", "profundidad"], ["Las ganas de explorar juntos", "aventura"]] },
    { texto: "Un buen día juntos incluye...", opciones: [["Charla profunda", "profundidad"], ["Un montón de risas", "diversion"], ["Sentirnos en casa", "estabilidad"]] },
    { texto: "Lo que nos sostiene en la distancia es...", opciones: [["La conexión emocional", "conexion"], ["Entendernos aunque no estemos", "comprension"], ["Las ganas de más aventuras juntos", "aventura"]] },
];

function refAdn(){ return window.doc(window.db, 'juegos', 'adn'); }

function iniciarAdn(){
    if (window._unsubAdn) window._unsubAdn();
    window._unsubAdn = window.onSnapshot(refAdn(), (snap) => {
        renderAdn(snap.exists() ? snap.data() : null);
    }, (err) => {
        console.error('Error de Firestore en adn:', err);
        document.getElementById('contenido-adn').innerHTML = `<div class="panel texto-centro texto-tenue">⚠️ No se pudo conectar (${err.code || 'error'}).</div>`;
    });
}

let _respuestasLocalesAdn = [];

function renderAdn(estado){
    const cont = document.getElementById('contenido-adn');
    if (!estado || estado.fase === 'sin_ronda') {
        cont.innerHTML = `<div class="panel texto-centro">
            <p class="texto-tenue">${PREGUNTAS_ADN.length} preguntas para armar el "ADN" visual de la pareja. No es un test clínico, sólo curiosidad.</p>
            <button class="btn-principal" onclick="nuevaRondaAdn()">Empezar</button>
        </div>`;
        return;
    }

    const yaEnvie = !!estado[`respuestas${miIdentidad === 'nico' ? 'Nico' : 'Carito'}`];

    if (estado.fase === 'revelado') {
        const conteos = {};
        Object.keys(DIMENSIONES_ADN).forEach(k => conteos[k] = 0);
        [...estado.respuestasNico, ...estado.respuestasCarito].forEach(dim => { conteos[dim] = (conteos[dim] || 0) + 1; });
        const total = estado.respuestasNico.length + estado.respuestasCarito.length;

        let html = `<div class="panel texto-centro logro-animado"><p style="font-family:var(--fuente-titulo); font-size:1.3rem;">Nuestro ADN 🧬</p></div><div class="panel">`;
        Object.entries(DIMENSIONES_ADN).forEach(([k, d]) => {
            const pct = total ? Math.round((conteos[k] / total) * 100) : 0;
            html += `<div style="margin-bottom:12px;">
                <div style="display:flex; justify-content:space-between; font-size:0.85rem; margin-bottom:4px;"><span>${d.icono} ${d.nombre}</span><span>${pct}%</span></div>
                <div class="barra-medidor"><div class="relleno-medidor barra-crecer" style="width:${pct}%; background:linear-gradient(90deg,var(--rosa),var(--lila));"></div></div>
            </div>`;
        });
        html += `</div><button class="btn-principal" onclick="nuevaRondaAdn()">🔁 Otra ronda</button>`;
        cont.innerHTML = html;
        return;
    }

    if (yaEnvie) {
        cont.innerHTML = `<div class="panel texto-centro texto-tenue destello">Ya respondiste. Esperando a ${nombreJugador(miRival)}…</div>`;
        return;
    }

    if (_respuestasLocalesAdn.length !== PREGUNTAS_ADN.length) _respuestasLocalesAdn = new Array(PREGUNTAS_ADN.length).fill(null);

    let html = '';
    PREGUNTAS_ADN.forEach((p, i) => {
        html += `<div class="panel">
            <p style="margin:0 0 10px; font-size:0.92rem;">${i + 1}. ${p.texto}</p>
            <div style="display:flex; flex-direction:column; gap:6px;">
                ${p.opciones.map((op, oi) => `<button class="btn-secundario ${_respuestasLocalesAdn[i] === oi ? 'opcion-elegida' : ''}" style="text-align:left;" onclick="elegirAdn(${i},${oi})">${op[0]}</button>`).join('')}
            </div>
        </div>`;
    });
    const completo = _respuestasLocalesAdn.every(r => r !== null);
    html += `<button class="btn-principal" ${completo ? '' : 'style="opacity:0.4;" disabled'} onclick="enviarAdn()">Enviar mis respuestas</button>`;
    cont.innerHTML = html;
}

function elegirAdn(i, oi){
    vibrarJ(8);
    _respuestasLocalesAdn[i] = oi;
    refrescarVistaAdn();
}
async function refrescarVistaAdn(){
    const snap = await new Promise(res => { const u = window.onSnapshot(refAdn(), s => { u(); res(s); }); });
    if (snap.exists()) renderAdn(snap.data());
}

async function nuevaRondaAdn(){
    vibrarJ(12);
    _respuestasLocalesAdn = [];
    await window.setDoc(refAdn(), { fase: 'jugando', respuestasNico: null, respuestasCarito: null });
}

async function enviarAdn(){
    vibrarJ([15, 30, 15]);
    const dimensiones = _respuestasLocalesAdn.map((oi, i) => PREGUNTAS_ADN[i].opciones[oi][1]);
    const campo = miIdentidad === 'nico' ? 'respuestasNico' : 'respuestasCarito';
    const snap = await new Promise(res => { const u = window.onSnapshot(refAdn(), s => { u(); res(s); }); });
    const data = snap.data();
    const otro = miIdentidad === 'nico' ? data.respuestasCarito : data.respuestasNico;
    await window.updateDoc(refAdn(), { [campo]: dimensiones, ...(otro ? { fase: 'revelado' } : {}) });
}
