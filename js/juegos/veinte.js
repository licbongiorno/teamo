// ==================== 20 PREGUNTAS ====================
// Uno piensa algo (persona, objeto, lugar), el otro hace preguntas de
// sí/no hasta adivinar (o hasta gastar las 20 preguntas).
function refVeinte(){ return window.doc(window.db, 'juegos', 'veinte'); }

function iniciarVeinte(){
    if (window._unsubVeinte) window._unsubVeinte();
    window._unsubVeinte = window.onSnapshot(refVeinte(), (snap) => {
        renderVeinte(snap.exists() ? snap.data() : null);
    }, (err) => {
        console.error('Error de Firestore en 20 preguntas:', err);
        document.getElementById('contenido-veinte').innerHTML = `<div class="panel texto-centro texto-tenue">⚠️ No se pudo conectar (${err.code || 'error'}).</div>`;
    });
}

function renderVeinte(estado){
    const cont = document.getElementById('contenido-veinte');

    if (!estado || estado.fase === 'terminado') {
        cont.innerHTML = `<div class="panel texto-centro">
            <p class="texto-tenue">Uno piensa algo (persona, objeto o lugar) y el otro hace preguntas de sí/no hasta adivinar. Máximo 20 preguntas.</p>
            ${estado && estado.fase === 'terminado' ? `<div class="texto-tenue" style="margin-bottom:10px;">La respuesta anterior era: <b>${escaparHtml(estado.palabra || '')}</b></div>` : ''}
            <button class="btn-principal" onclick="empezarVeinte()">🤔 Yo pienso algo</button>
        </div>`;
        return;
    }

    const soyPensador = estado.pensador === miIdentidad;

    if (estado.fase === 'pensando') {
        if (soyPensador) {
            cont.innerHTML = `<div class="panel">
                <p class="texto-tenue">Pensá algo (persona, objeto o lugar) y escribilo. ${nombreJugador(miRival)} no lo va a ver, sólo va a poder preguntar.</p>
                <input type="text" id="input-palabra-veinte" placeholder="Lo que pensaste..." autocomplete="off"
                    style="width:100%; padding:12px; border-radius:12px; border:1px solid var(--borde); background:rgba(255,255,255,0.06); color:var(--texto); margin-bottom:10px; text-align:center;">
                <button class="btn-principal" onclick="confirmarPalabraVeinte()">Listo, ya pensé algo</button>
            </div>`;
        } else {
            cont.innerHTML = `<div class="panel texto-centro texto-tenue destello">${nombreJugador(estado.pensador)} está pensando algo…</div>`;
        }
        return;
    }

    // fase 'jugando'
    const preguntas = estado.preguntas || [];
    let html = `<div class="panel texto-centro">
        <div class="texto-tenue">${soyPensador ? `${nombreJugador(miRival)} está adivinando` : 'Preguntá algo que se responda sí o no'}</div>
        <div style="font-size:1.2rem; margin-top:6px;">${preguntas.length} / 20 preguntas</div>
    </div>`;

    if (preguntas.length) {
        html += `<div class="panel"><div class="lista-escrituras">`;
        preguntas.forEach(p => {
            html += `<div class="item-escritura" style="cursor:default;">
                <div class="info-escritura"><div class="titulo-escritura">${escaparHtml(p.pregunta)}</div>
                <div class="detalle-escritura">${p.respuesta || 'Sin responder'}</div></div>
            </div>`;
        });
        html += `</div></div>`;
    }

    const ultimaSinResponder = preguntas.length && !preguntas[preguntas.length - 1].respuesta;

    if (soyPensador) {
        if (ultimaSinResponder) {
            html += `<div class="panel texto-centro">
                <p style="margin:0 0 10px;">${escaparHtml(preguntas[preguntas.length - 1].pregunta)}</p>
                <div class="btn-fila">
                    <button class="btn-secundario" onclick="responderVeinte('Sí')">Sí</button>
                    <button class="btn-secundario" onclick="responderVeinte('No')">No</button>
                    <button class="btn-secundario" onclick="responderVeinte('Más o menos')">Más o menos</button>
                </div>
            </div>`;
        }
        html += `<div class="panel texto-centro"><button class="btn-secundario" onclick="rendirseVeinte()">🏳️ Revelar y terminar</button></div>`;
    } else {
        if (!ultimaSinResponder && preguntas.length < 20) {
            html += `<div class="panel">
                <input type="text" id="input-pregunta-veinte" placeholder="¿Es algo que...?" autocomplete="off"
                    style="width:100%; padding:10px; border-radius:10px; border:1px solid var(--borde); background:rgba(255,255,255,0.06); color:var(--texto); margin-bottom:8px;"
                    onkeydown="if(event.key==='Enter') preguntarVeinte()">
                <button class="btn-principal" onclick="preguntarVeinte()">Preguntar</button>
            </div>
            <div class="panel">
                <input type="text" id="input-adivinanza-veinte" placeholder="¿Ya sabés qué es? Escribilo acá" autocomplete="off"
                    style="width:100%; padding:10px; border-radius:10px; border:1px solid var(--borde); background:rgba(255,255,255,0.06); color:var(--texto); margin-bottom:8px;">
                <button class="btn-secundario" onclick="adivinarVeinte()">🎯 Adivinar</button>
            </div>`;
        } else if (preguntas.length >= 20) {
            html += `<div class="panel texto-centro texto-tenue">Se acabaron las 20 preguntas. Podés arriesgar una última adivinanza:</div>
            <div class="panel">
                <input type="text" id="input-adivinanza-veinte" placeholder="¿Qué es?" autocomplete="off"
                    style="width:100%; padding:10px; border-radius:10px; border:1px solid var(--borde); background:rgba(255,255,255,0.06); color:var(--texto); margin-bottom:8px;">
                <button class="btn-principal" onclick="adivinarVeinte()">🎯 Última adivinanza</button>
            </div>`;
        } else {
            html += `<div class="panel texto-centro texto-tenue">Esperando la respuesta…</div>`;
        }
    }

    cont.innerHTML = html;
}

async function empezarVeinte(){
    vibrarJ(12);
    await window.setDoc(refVeinte(), { fase: 'pensando', pensador: miIdentidad, palabra: null, preguntas: [] });
}

async function confirmarPalabraVeinte(){
    const input = document.getElementById('input-palabra-veinte');
    const texto = input.value.trim();
    if (!texto) return;
    vibrarJ(12);
    await window.updateDoc(refVeinte(), { fase: 'jugando', palabra: texto });
}

async function preguntarVeinte(){
    const input = document.getElementById('input-pregunta-veinte');
    const texto = input.value.trim();
    if (!texto) return;
    vibrarJ(10);
    const snap = await new Promise(res => { const u = window.onSnapshot(refVeinte(), s => { u(); res(s); }); });
    const data = snap.data();
    const preguntas = [...(data.preguntas || []), { pregunta: texto, respuesta: null }];
    await window.updateDoc(refVeinte(), { preguntas });
}

async function responderVeinte(respuesta){
    vibrarJ(10);
    const snap = await new Promise(res => { const u = window.onSnapshot(refVeinte(), s => { u(); res(s); }); });
    const data = snap.data();
    const preguntas = [...(data.preguntas || [])];
    if (!preguntas.length) return;
    preguntas[preguntas.length - 1] = { ...preguntas[preguntas.length - 1], respuesta };
    await window.updateDoc(refVeinte(), { preguntas });
}

async function adivinarVeinte(){
    const input = document.getElementById('input-adivinanza-veinte');
    const intento = input.value.trim();
    if (!intento) return;
    vibrarJ([15, 30, 15]);
    const snap = await new Promise(res => { const u = window.onSnapshot(refVeinte(), s => { u(); res(s); }); });
    const data = snap.data();
    const acierto = intento.toLowerCase() === (data.palabra || '').toLowerCase();
    await window.updateDoc(refVeinte(), {
        fase: 'terminado',
        preguntas: [...(data.preguntas || []), { pregunta: `¿Es "${intento}"?`, respuesta: acierto ? '🎉 ¡Sí, correcto!' : 'No 😅' }]
    });
    if (typeof registrarEvento === 'function') {
        registrarEvento('cuidado_compartido', acierto ? `Adivinaron en 20 Preguntas` : `Jugaron una ronda de 20 Preguntas`);
    }
}

async function rendirseVeinte(){
    vibrarJ(10);
    await window.updateDoc(refVeinte(), { fase: 'terminado' });
}
