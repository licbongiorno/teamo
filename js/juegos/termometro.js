// ==================== TERMÓMETRO DEL DÍA ====================
// Check-in diario liviano: cada uno marca del 1 al 10 cómo está hoy.
// Queda un historial de los últimos 14 días, uno junto al otro.
function refTermometro(id){ return window.doc(window.db, 'juegos', id); }
function _hoyTermometro(){
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function iniciarTermometro(){
    if (window._unsubTermometro) window._unsubTermometro();
    const q = window.query(window.collection(window.db, 'juegos'), window.where('tipo', '==', 'termometro-dia'));
    window._unsubTermometro = window.onSnapshot(q, (snap) => {
        const registros = [];
        snap.forEach(d => registros.push({ id: d.id, ...d.data() }));
        registros.sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''));
        renderTermometro(registros);
    }, (err) => {
        console.error('Error de Firestore en termómetro:', err);
        document.getElementById('contenido-termometro').innerHTML = `<div class="panel texto-centro texto-tenue">⚠️ No se pudo conectar (${err.code || 'error'}).</div>`;
    });
}

const EMOJIS_TERMOMETRO = ['😢','😔','😕','😐','🙂','😊','😄','😁','🤩','🥰'];

function renderTermometro(registros){
    const cont = document.getElementById('contenido-termometro');
    const hoy = _hoyTermometro();
    const deHoy = registros.filter(r => r.fecha === hoy);
    const miDeHoy = deHoy.find(r => r.autor === miIdentidad);

    let html = `<div class="panel texto-centro">
        <p class="texto-tenue">¿Cómo estás hoy? Del 1 al 10.</p>`;
    if (miDeHoy) {
        html += `<div style="font-size:2.4rem; margin:10px 0;">${EMOJIS_TERMOMETRO[miDeHoy.valor - 1]}</div>
            <div class="texto-tenue">Marcaste ${miDeHoy.valor}/10 hoy. Podés cambiarlo si querés:</div>`;
    }
    html += `<div style="display:grid; grid-template-columns:repeat(5,1fr); gap:6px; margin-top:10px;">
        ${EMOJIS_TERMOMETRO.map((e, i) => `<button class="btn-secundario ${miDeHoy && miDeHoy.valor === i+1 ? 'opcion-elegida' : ''}" style="padding:10px 0; font-size:1.1rem;" onclick="marcarTermometro(${i+1})">${e}<br><span style="font-size:0.65rem;">${i+1}</span></button>`).join('')}
    </div></div>`;

    html += `<div class="panel texto-centro">
        <div class="texto-tenue" style="margin-bottom:8px;">Hoy</div>
        <div style="display:flex; justify-content:space-around;">
            <div><div style="font-size:1.6rem;">${(() => { const n = deHoy.find(r=>r.autor==='nico'); return n ? EMOJIS_TERMOMETRO[n.valor-1] : '❔'; })()}</div><div class="texto-tenue">Nico</div></div>
            <div><div style="font-size:1.6rem;">${(() => { const c = deHoy.find(r=>r.autor==='carito'); return c ? EMOJIS_TERMOMETRO[c.valor-1] : '❔'; })()}</div><div class="texto-tenue">Carito</div></div>
        </div>
    </div>`;

    html += `<div class="panel"><div class="texto-tenue" style="margin-bottom:10px;">Últimos días</div>`;
    const fechas = [...new Set(registros.map(r => r.fecha))].slice(0, 14);
    if (fechas.length) {
        fechas.forEach(f => {
            const n = registros.find(r => r.fecha === f && r.autor === 'nico');
            const c = registros.find(r => r.fecha === f && r.autor === 'carito');
            const fechaTexto = new Date(f + 'T12:00:00').toLocaleDateString('es-AR', { day:'2-digit', month:'short' });
            html += `<div style="display:flex; justify-content:space-between; align-items:center; padding:6px 0; border-bottom:1px solid rgba(255,255,255,0.08); font-size:0.85rem;">
                <span class="texto-tenue">${fechaTexto}</span>
                <span>${n ? EMOJIS_TERMOMETRO[n.valor-1] : '—'} &nbsp; ${c ? EMOJIS_TERMOMETRO[c.valor-1] : '—'}</span>
            </div>`;
        });
    } else {
        html += `<p class="texto-tenue">Todavía no hay registros.</p>`;
    }
    html += `</div>`;

    cont.innerHTML = html;
}

async function marcarTermometro(valor){
    vibrarJ(10);
    const hoy = _hoyTermometro();
    try {
        const q = window.query(window.collection(window.db, 'juegos'), window.where('tipo', '==', 'termometro-dia'));
        const snap = await new Promise((res) => { const u = window.onSnapshot(q, s => { u(); res(s); }); });
        let idExistente = null;
        snap.forEach(d => { const data = d.data(); if (data.fecha === hoy && data.autor === miIdentidad) idExistente = d.id; });
        if (idExistente) {
            await window.updateDoc(refTermometro(idExistente), { valor });
        } else {
            await window.addDoc(window.collection(window.db, 'juegos'), {
                tipo: 'termometro-dia', fecha: hoy, autor: miIdentidad, valor, creadoEn: Date.now()
            });
            if (typeof registrarEvento === 'function') {
                registrarEvento('cuidado_compartido', `${nombreJugador(miIdentidad)} marcó cómo está hoy`);
            }
        }
    } catch (e) {
        console.error('No se pudo guardar el termómetro:', e);
    }
}
