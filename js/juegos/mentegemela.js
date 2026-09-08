// ==================== MENTE GEMELA ====================
const PREGUNTAS_MENTEGEMELA = [
    { texto: "¿Cuál elegís para una tarde libre?", opciones: ["Peli", "Charla", "Salir a caminar"] },
    { texto: "¿Café o té?", opciones: ["Café", "Té", "Ninguno"] },
    { texto: "¿Mañana o noche?", opciones: ["Mañana", "Noche"] },
    { texto: "¿Playa o montaña?", opciones: ["Playa", "Montaña", "Ciudad"] },
    { texto: "¿Plan espontáneo o planeado?", opciones: ["Espontáneo", "Planeado"] },
    { texto: "¿Dulce o salado?", opciones: ["Dulce", "Salado", "Ambos"] },
    { texto: "¿Perro o gato?", opciones: ["Perro", "Gato", "Ninguno"] },
    { texto: "¿Verano o invierno?", opciones: ["Verano", "Invierno"] },
    { texto: "¿Serie o película?", opciones: ["Serie", "Película"] },
    { texto: "¿Ahorrar o gastar en experiencias?", opciones: ["Ahorrar", "Gastar en experiencias"] },
    { texto: "¿Silencio o música de fondo?", opciones: ["Silencio", "Música"] },
    { texto: "¿Madrugar o trasnochar?", opciones: ["Madrugar", "Trasnochar"] },
    { texto: "¿Ciudad grande o pueblo chico?", opciones: ["Ciudad grande", "Pueblo chico"] },
    { texto: "¿Reír o llorar en una peli?", opciones: ["Reír", "Llorar"] },
    { texto: "¿Cocinar o pedir delivery?", opciones: ["Cocinar", "Delivery"] },
];

function refMenteGemela(){ return window.doc(window.db, 'juegos', 'mentegemela'); }

function iniciarMenteGemela(){
    if (window._unsubMenteGemela) window._unsubMenteGemela();
    window._unsubMenteGemela = window.onSnapshot(refMenteGemela(), (snap) => {
        renderMenteGemela(snap.exists() ? snap.data() : null);
    }, (err) => {
        console.error('Error de Firestore en mentegemela:', err);
        document.getElementById('contenido-mentegemela').innerHTML = `<div class="panel texto-centro texto-tenue">⚠️ No se pudo conectar (${err.code || 'error'}).</div>`;
    });
}

let _respuestasLocalesMG = [];

function renderMenteGemela(estado){
    const cont = document.getElementById('contenido-mentegemela');
    if (!estado || estado.fase === 'sin_ronda') {
        cont.innerHTML = `<div class="panel texto-centro">
            <p class="texto-tenue">5 preguntas rápidas. Cuando ambos terminen, se ve el % de coincidencia.</p>
            <button class="btn-principal" onclick="nuevaRondaMenteGemela()">Empezar</button>
        </div>`;
        return;
    }

    const yaEnvie = !!estado[`respuestas${miIdentidad === 'nico' ? 'Nico' : 'Carito'}`];

    if (estado.fase === 'revelado') {
        const rNico = estado.respuestasNico, rCarito = estado.respuestasCarito;
        const coincidencias = rNico.filter((r, i) => r === rCarito[i]).length;
        const pct = Math.round((coincidencias / estado.preguntas.length) * 100);
        let html = `<div class="panel texto-centro logro-animado">
            <div style="font-size:2rem;">${pct}%</div>
            <div class="texto-tenue">de Mente Gemela</div>
        </div><div class="panel">`;
        estado.preguntas.forEach((p, i) => {
            const coincide = rNico[i] === rCarito[i];
            html += `<div style="padding:8px 0; border-bottom:1px solid rgba(255,255,255,0.08);">
                <div style="font-size:0.85rem; margin-bottom:4px;">${coincide ? '✅' : '❌'} ${p.texto}</div>
                <div class="texto-tenue" style="font-size:0.78rem;">Nico: ${p.opciones[rNico[i]]} · Carito: ${p.opciones[rCarito[i]]}</div>
            </div>`;
        });
        html += `</div><button class="btn-principal" onclick="nuevaRondaMenteGemela()">🔁 Otro set de preguntas</button>`;
        cont.innerHTML = html;
        return;
    }

    if (yaEnvie) {
        cont.innerHTML = `<div class="panel texto-centro texto-tenue destello">Ya respondiste las 5. Esperando a ${nombreJugador(miRival)}…</div>`;
        return;
    }

    if (_respuestasLocalesMG.length !== estado.preguntas.length) {
        _respuestasLocalesMG = new Array(estado.preguntas.length).fill(null);
    }

    let html = '';
    estado.preguntas.forEach((p, i) => {
        html += `<div class="panel">
            <p style="margin:0 0 10px; font-size:0.95rem;">${i + 1}. ${p.texto}</p>
            <div style="display:flex; gap:8px; flex-wrap:wrap;">
                ${p.opciones.map((op, oi) => `<button class="btn-secundario ${_respuestasLocalesMG[i] === oi ? 'opcion-elegida' : ''}" style="width:auto; flex:1; min-width:80px;" onclick="elegirMenteGemela(${i},${oi})">${op}</button>`).join('')}
            </div>
        </div>`;
    });
    const todasRespondidas = _respuestasLocalesMG.every(r => r !== null);
    html += `<button class="btn-principal" ${todasRespondidas ? '' : 'style="opacity:0.4;" disabled'} onclick="enviarMenteGemela()">Enviar mis respuestas</button>`;
    cont.innerHTML = html;
}

function elegirMenteGemela(i, oi){
    vibrarJ(8);
    _respuestasLocalesMG[i] = oi;
    refrescarVistaMG();
}
async function refrescarVistaMG(){
    const snap = await new Promise(res => { const u = window.onSnapshot(refMenteGemela(), s => { u(); res(s); }); });
    if (snap.exists()) renderMenteGemela(snap.data());
}

async function nuevaRondaMenteGemela(){
    vibrarJ(12);
    const preguntas = [...PREGUNTAS_MENTEGEMELA].sort(() => Math.random() - 0.5).slice(0, 5);
    _respuestasLocalesMG = [];
    await window.setDoc(refMenteGemela(), {
        fase: 'jugando', preguntas, respuestasNico: null, respuestasCarito: null
    });
}

async function enviarMenteGemela(){
    vibrarJ([15, 30, 15]);
    const campo = miIdentidad === 'nico' ? 'respuestasNico' : 'respuestasCarito';
    const snap = await new Promise(res => { const u = window.onSnapshot(refMenteGemela(), s => { u(); res(s); }); });
    const data = snap.data();
    const otroLisos = miIdentidad === 'nico' ? data.respuestasCarito : data.respuestasNico;
    await window.updateDoc(refMenteGemela(), {
        [campo]: [..._respuestasLocalesMG],
        ...(otroLisos ? { fase: 'revelado' } : {})
    });
}
