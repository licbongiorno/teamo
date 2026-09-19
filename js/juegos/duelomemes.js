// ==================== DUELO DE MEMES ====================
// Cada uno escribe su propio "meme" (texto + emoji, sin imágenes de
// verdad — esto no tiene ni necesita subida de archivos) y el otro lo
// califica con una escala de risa. Con el tiempo se arma un promedio
// por persona: quién hace reír más al otro. Mismo truco de siempre:
// documentos tipo:'meme' dentro de la colección 'juegos', sin tocar
// las Reglas de Firestore.
const ESCALA_RISA_MEMES = [
    { valor: 1, emoji: '😐', etiqueta: 'nada' },
    { valor: 2, emoji: '🙂', etiqueta: 'una sonrisa' },
    { valor: 3, emoji: '😂', etiqueta: 'me reí' },
    { valor: 4, emoji: '🤣', etiqueta: 'me maté' },
    { valor: 5, emoji: '💀', etiqueta: 'no puedo más' },
];

function _escaparTextoMeme(texto){
    const div = document.createElement('div');
    div.innerText = texto == null ? '' : String(texto);
    return div.innerHTML;
}

function refMeme(id){ return window.doc(window.db, 'juegos', id); }

function iniciarDueloMemes(){
    mostrarListaMemes();
}

function mostrarListaMemes(){
    const cont = document.getElementById('contenido-duelomemes');
    if (!cont) return;
    cont.innerHTML = `<div class="panel texto-centro texto-tenue">Cargando…</div>`;
    if (window._unsubMemes) window._unsubMemes();
    const q = window.query(window.collection(window.db, 'juegos'), window.where('tipo', '==', 'meme'));
    window._unsubMemes = window.onSnapshot(q, (snap) => {
        const memes = [];
        snap.forEach(d => memes.push({ id: d.id, ...d.data() }));
        memes.sort((a, b) => (b.creadoEn || 0) - (a.creadoEn || 0));
        renderListaMemes(memes);
    }, (err) => {
        console.error('Error de Firestore en duelo de memes:', err);
        cont.innerHTML = `<div class="panel texto-centro texto-tenue">⚠️ No se pudo conectar (${err.code || 'error'}).</div>`;
    });
}

function _promedioRisa(memes, autor){
    const calificados = memes.filter(m => m.autor === autor && typeof m.risa === 'number');
    if (!calificados.length) return null;
    const suma = calificados.reduce((s, m) => s + m.risa, 0);
    return { promedio: (suma / calificados.length).toFixed(1), cantidad: calificados.length };
}

function _emojiParaValor(valor){
    const e = ESCALA_RISA_MEMES.find(e => e.valor === valor);
    return e ? e.emoji : '❔';
}

function renderListaMemes(memes){
    const cont = document.getElementById('contenido-duelomemes');
    const paraCalificar = memes.filter(m => m.autor === miRival && m.estado === 'esperando');
    const propiosEsperando = memes.filter(m => m.autor === miIdentidad && m.estado === 'esperando');
    const calificados = memes.filter(m => m.estado === 'calificado');

    const promNico = _promedioRisa(memes, 'nico');
    const promCarito = _promedioRisa(memes, 'carito');

    let html = `<div class="panel texto-centro">
        <p class="texto-tenue">Escribí tu mejor meme (texto + emoji), el otro lo califica con la escala de risa.</p>
        ${(promNico || promCarito) ? `<div style="display:flex; justify-content:space-around; margin-top:10px;">
            <div>💙 ${nombreJugador('nico')}<br><b>${promNico ? `${promNico.promedio} ⭐ (${promNico.cantidad})` : '—'}</b></div>
            <div>💖 ${nombreJugador('carito')}<br><b>${promCarito ? `${promCarito.promedio} ⭐ (${promCarito.cantidad})` : '—'}</b></div>
        </div>` : ''}
        <button class="btn-principal" style="margin-top:10px;" onclick="mostrarFormularioMeme()">😂 Nuevo meme</button>
    </div>
    <div id="form-nuevo-meme"></div>`;

    if (paraCalificar.length) {
        html += `<div class="texto-tenue" style="margin:10px 4px 4px;">🎭 Para calificar (${paraCalificar.length})</div>`;
        paraCalificar.forEach(m => {
            html += `<div class="panel">
                <p style="margin:0 0 10px;">${_escaparTextoMeme(m.texto)}</p>
                <div style="display:flex; justify-content:space-between; gap:4px;">
                    ${ESCALA_RISA_MEMES.map(e => `<button class="btn-secundario" style="flex:1; padding:8px 2px; font-size:1.3rem;" title="${e.etiqueta}" onclick="calificarMeme('${m.id}',${e.valor})">${e.emoji}</button>`).join('')}
                </div>
            </div>`;
        });
    }
    if (propiosEsperando.length) {
        html += `<div class="texto-tenue" style="margin:10px 4px 4px;">⏳ Esperando calificación (${propiosEsperando.length})</div>`;
        propiosEsperando.forEach(m => {
            html += `<div class="panel texto-tenue">${_escaparTextoMeme(m.texto)}</div>`;
        });
    }
    if (!paraCalificar.length && !propiosEsperando.length && !calificados.length) {
        html += `<div class="panel texto-centro texto-tenue">Todavía no hay memes. ¡Arranquen! 🎬</div>`;
    }
    if (calificados.length) {
        html += `<div class="texto-tenue" style="margin:14px 4px 4px;">📜 Historial (${calificados.length})</div>`;
        calificados.forEach(m => {
            html += `<div class="panel">
                <p class="texto-tenue" style="margin:0 0 4px;">de ${nombreJugador(m.autor)}</p>
                <p style="margin:0 0 6px;">${_escaparTextoMeme(m.texto)}</p>
                <p style="margin:0; font-size:1.3rem;">${_emojiParaValor(m.risa)}</p>
            </div>`;
        });
    }
    cont.innerHTML = html;
}

function mostrarFormularioMeme(){
    const cont = document.getElementById('form-nuevo-meme');
    if (!cont) return;
    cont.innerHTML = `<div class="panel">
        <textarea id="input-texto-meme" placeholder="Escribí tu meme (texto + emoji vale todo)" rows="3" maxlength="200" style="width:100%; box-sizing:border-box; font-family:var(--fuente-texto); background:rgba(255,255,255,0.06); color:var(--texto); border:1px solid var(--borde); border-radius:12px; padding:10px; resize:none;"></textarea>
        <button class="btn-principal" style="margin-top:8px;" onclick="crearMeme()">Mandar</button>
    </div>`;
    const ta = document.getElementById('input-texto-meme');
    if (ta) ta.focus();
}

async function crearMeme(){
    const input = document.getElementById('input-texto-meme');
    if (!input || !miIdentidad) return;
    const texto = input.value.trim();
    if (!texto) return;
    vibrarJ(12);
    try {
        await window.addDoc(window.collection(window.db, 'juegos'), {
            tipo: 'meme', autor: miIdentidad, texto, estado: 'esperando', risa: null,
            creadoEn: Date.now(),
        });
        const form = document.getElementById('form-nuevo-meme');
        if (form) form.innerHTML = '';
        if (typeof registrarEvento === 'function') registrarEvento('nuevo_meme', `${nombreJugador(miIdentidad)} mandó un meme nuevo`);
    } catch (e) { console.error('No se pudo mandar el meme:', e); }
}

async function calificarMeme(id, valor){
    vibrarJ(15);
    if (window.sfx) window.sfx.click();
    try {
        await window.updateDoc(refMeme(id), { risa: valor, estado: 'calificado' });
    } catch (e) { console.error('No se pudo calificar el meme:', e); }
}
