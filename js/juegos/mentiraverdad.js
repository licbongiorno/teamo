// ==================== MENTIRA O VERDAD ====================
function refMentiraVerdad(){ return window.doc(window.db, 'juegos', 'mentiraverdad'); }

function iniciarMentiraVerdad(){
    if (window._unsubMentiraVerdad) window._unsubMentiraVerdad();
    window._unsubMentiraVerdad = window.onSnapshot(refMentiraVerdad(), (snap) => {
        renderMentiraVerdad(snap.exists() ? snap.data() : null);
    }, (err) => {
        console.error('Error de Firestore en mentiraverdad:', err);
        document.getElementById('contenido-mentiraverdad').innerHTML = `<div class="panel texto-centro texto-tenue">⚠️ No se pudo conectar (${err.code || 'error'}).</div>`;
    });
}

function renderMentiraVerdad(estado){
    const cont = document.getElementById('contenido-mentiraverdad');
    if (!estado) estado = { fase: 'inicio', puntajes: { nico: 0, carito: 0 } };
    const p = estado.puntajes || { nico: 0, carito: 0 };

    let html = `<div class="panel"><div style="display:flex; justify-content:space-between; font-size:0.9rem;">
        <span>Nico: <b>${p.nico || 0}</b></span><span>Carito: <b>${p.carito || 0}</b></span>
    </div></div>`;

    if (!estado.fase || estado.fase === 'inicio' || estado.fase === 'revelado') {
        html += `<div class="panel texto-centro">
            <p class="texto-tenue">Escribí 3 afirmaciones sobre vos: 2 verdaderas y 1 mentira. El otro tiene que adivinar cuál es la mentira.</p>
            <button class="btn-principal" onclick="crearRondaMentiraVerdad()">Escribir mis 3 afirmaciones</button>
        </div>`;
        if (estado.fase === 'revelado') {
            html += `<div class="panel">
                <div class="texto-tenue" style="margin-bottom:8px;">Última ronda (de ${nombreJugador(estado.creador)}):</div>
                ${estado.afirmaciones.map((a, i) => `<p style="margin:4px 0; ${i === estado.indiceMentira ? 'color:var(--rosa);' : ''}">${i === estado.indiceMentira ? '🎭 ' : '✅ '}${a}</p>`).join('')}
                <p class="texto-tenue" style="margin-top:8px;">${estado.eleccionRival === estado.indiceMentira ? `${nombreJugador(estado.adivinador)} acertó ✅` : `${nombreJugador(estado.adivinador)} no acertó ❌`}</p>
            </div>`;
        }
        cont.innerHTML = html;
        return;
    }

    if (estado.fase === 'creando') {
        if (estado.creador === miIdentidad) {
            html += `<div class="panel">
                <p class="texto-tenue" style="margin-bottom:8px;">Escribí 3 afirmaciones y marcá cuál es la mentira:</p>
                ${[0, 1, 2].map(i => `
                    <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
                        <input type="radio" name="mentira-radio" id="mentira-radio-${i}" value="${i}" ${i === 0 ? 'checked' : ''} style="width:auto;">
                        <input type="text" id="afirmacion-${i}" placeholder="Afirmación ${i + 1}" maxlength="140"
                            style="flex:1; padding:10px; border-radius:10px; border:1px solid var(--borde); background:rgba(255,255,255,0.06); color:var(--texto); font-size:0.88rem;">
                    </div>`).join('')}
                <button class="btn-principal" onclick="enviarAfirmacionesMentiraVerdad()">Enviar</button>
            </div>`;
        } else {
            html += `<div class="panel texto-centro texto-tenue">🔒 ${nombreJugador(estado.creador)} está escribiendo sus 3 afirmaciones…</div>`;
        }
    } else if (estado.fase === 'adivinando') {
        if (estado.adivinador === miIdentidad) {
            html += `<div class="panel"><p class="texto-tenue" style="margin-bottom:10px;">¿Cuál es la mentira de ${nombreJugador(estado.creador)}?</p>
                ${estado.afirmaciones.map((a, i) => `<button class="btn-secundario" style="margin-bottom:8px; text-align:left;" onclick="adivinarMentiraVerdad(${i})">${a}</button>`).join('')}
            </div>`;
        } else {
            html += `<div class="panel texto-centro texto-tenue">Esperando que ${nombreJugador(estado.adivinador)} elija…</div>`;
        }
    }

    cont.innerHTML = html;
}

async function crearRondaMentiraVerdad(){
    vibrarJ(12);
    const estado = await new Promise(res => { const u = window.onSnapshot(refMentiraVerdad(), s => { u(); res(s.exists() ? s.data() : null); }); });
    if (estado && estado.fase === 'creando') return; // ya hay alguien escribiendo
    await window.setDoc(refMentiraVerdad(), {
        fase: 'creando', creador: miIdentidad, adivinador: miRival,
        afirmaciones: [], indiceMentira: null, eleccionRival: null,
        puntajes: estado?.puntajes || { nico: 0, carito: 0 }
    }, { merge: true });
}

async function enviarAfirmacionesMentiraVerdad(){
    const afirmaciones = [0, 1, 2].map(i => document.getElementById(`afirmacion-${i}`).value.trim());
    if (afirmaciones.some(a => !a)) return;
    const indiceMentira = parseInt(document.querySelector('input[name="mentira-radio"]:checked').value, 10);
    vibrarJ(12);
    await window.updateDoc(refMentiraVerdad(), { afirmaciones, indiceMentira, fase: 'adivinando' });
}

async function adivinarMentiraVerdad(idx){
    vibrarJ([15, 30, 15]);
    const estado = await new Promise(res => { const u = window.onSnapshot(refMentiraVerdad(), s => { u(); res(s.exists() ? s.data() : null); }); });
    if (!estado || estado.fase !== 'adivinando') return;
    const acerto = idx === estado.indiceMentira;
    const puntajes = { ...(estado.puntajes || { nico: 0, carito: 0 }) };
    if (acerto) puntajes[miIdentidad] = (puntajes[miIdentidad] || 0) + 2;
    await window.updateDoc(refMentiraVerdad(), { eleccionRival: idx, fase: 'revelado', puntajes });
}
