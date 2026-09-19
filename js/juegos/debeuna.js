// ==================== TE DEBO UNA ====================
// Marcador de favores: cuando alguien hace algo lindo por el otro,
// queda anotado como una "deuda" pendiente — el que la recibió puede
// "cobrarla" cuando quiera. No hay apuro ni penalidad, es sólo un
// registro cariñoso de gestos que no se quieren olvidar. Mismo truco
// que ¿Quién Tiene Razón?/Serenata a Ciegas: documentos tipo:'debeuna'
// dentro de la colección 'juegos', sin tocar las Reglas de Firestore.
function _escaparTextoDebeUna(texto){
    const div = document.createElement('div');
    div.innerText = texto == null ? '' : String(texto);
    return div.innerHTML;
}

function refDebeUna(id){ return window.doc(window.db, 'juegos', id); }

function iniciarDebeUna(){
    mostrarListaDebeUna();
}

function mostrarListaDebeUna(){
    const cont = document.getElementById('contenido-debeuna');
    if (!cont) return;
    cont.innerHTML = `<div class="panel texto-centro texto-tenue">Cargando…</div>`;
    if (window._unsubDebeUna) window._unsubDebeUna();
    const q = window.query(window.collection(window.db, 'juegos'), window.where('tipo', '==', 'debeuna'));
    window._unsubDebeUna = window.onSnapshot(q, (snap) => {
        const items = [];
        snap.forEach(d => items.push({ id: d.id, ...d.data() }));
        items.sort((a, b) => (b.creadoEn || 0) - (a.creadoEn || 0));
        renderListaDebeUna(items);
    }, (err) => {
        console.error('Error de Firestore en te debo una:', err);
        cont.innerHTML = `<div class="panel texto-centro texto-tenue">⚠️ No se pudo conectar (${err.code || 'error'}).</div>`;
    });
}

function _htmlItemDebeUna(item){
    const soyYoElQueDebe = item.de === miIdentidad;
    const pendiente = item.estado !== 'cobrado';
    const fila = `<div class="panel">
        <p style="margin:0 0 6px;">${soyYoElQueDebe ? `Le debés una a ${nombreJugador(item.para)}` : `${nombreJugador(item.de)} te debe una`}</p>
        <p class="texto-tenue" style="margin:0 0 8px;">${_escaparTextoDebeUna(item.motivo)}</p>
        ${pendiente
            ? (soyYoElQueDebe
                ? `<span class="texto-tenue" style="font-size:0.85rem;">⏳ Pendiente</span>`
                : `<button class="btn-secundario" onclick="cobrarDebeUna('${item.id}')">✅ Cobrarla</button>`)
            : `<span class="texto-tenue" style="font-size:0.85rem;">✅ Cobrada</span>`}
    </div>`;
    return fila;
}

function renderListaDebeUna(items){
    const cont = document.getElementById('contenido-debeuna');
    const pendientesQueDebo = items.filter(i => i.de === miIdentidad && i.estado !== 'cobrado');
    const pendientesQueMeDeben = items.filter(i => i.para === miIdentidad && i.estado !== 'cobrado');
    const historial = items.filter(i => i.estado === 'cobrado');

    let html = `<div class="panel texto-centro">
        <p class="texto-tenue">Anotá los favores para no olvidarlos — el otro los cobra cuando quiere.</p>
        <div class="btn-fila" style="margin-top:10px;">
            <button class="btn-secundario" onclick="mostrarFormularioDebeUna('yo')">Le debo una</button>
            <button class="btn-secundario" onclick="mostrarFormularioDebeUna('rival')">Me debe una</button>
        </div>
    </div>
    <div id="form-nuevo-debeuna"></div>`;

    if (pendientesQueMeDeben.length) {
        html += `<div class="texto-tenue" style="margin:10px 4px 4px;">💝 Te deben (${pendientesQueMeDeben.length})</div>`;
        pendientesQueMeDeben.forEach(i => { html += _htmlItemDebeUna(i); });
    }
    if (pendientesQueDebo.length) {
        html += `<div class="texto-tenue" style="margin:10px 4px 4px;">📝 Debés (${pendientesQueDebo.length})</div>`;
        pendientesQueDebo.forEach(i => { html += _htmlItemDebeUna(i); });
    }
    if (!pendientesQueMeDeben.length && !pendientesQueDebo.length) {
        html += `<div class="panel texto-centro texto-tenue">No hay deudas pendientes. ¡Al día! 🎉</div>`;
    }
    if (historial.length) {
        html += `<div class="texto-tenue" style="margin:14px 4px 4px;">📜 Historial (${historial.length})</div>`;
        historial.forEach(i => { html += _htmlItemDebeUna(i); });
    }
    cont.innerHTML = html;
}

function mostrarFormularioDebeUna(direccion){
    const cont = document.getElementById('form-nuevo-debeuna');
    if (!cont) return;
    const titulo = direccion === 'yo' ? `Le vas a deber una a ${nombreJugador(miRival)}` : `${nombreJugador(miRival)} te va a deber una`;
    cont.innerHTML = `<div class="panel">
        <p class="texto-tenue" style="margin:0 0 8px;">${titulo}</p>
        <textarea id="input-motivo-debeuna" placeholder="¿Por qué? Ej: por bancarme toda la semana con el mudanza" rows="2" maxlength="140" style="width:100%; box-sizing:border-box; font-family:var(--fuente-texto); background:rgba(255,255,255,0.06); color:var(--texto); border:1px solid var(--borde); border-radius:12px; padding:10px; resize:none;"></textarea>
        <button class="btn-principal" style="margin-top:8px;" onclick="crearDebeUna('${direccion}')">Anotar</button>
    </div>`;
    const ta = document.getElementById('input-motivo-debeuna');
    if (ta) ta.focus();
}

async function crearDebeUna(direccion){
    const input = document.getElementById('input-motivo-debeuna');
    if (!input || !miIdentidad) return;
    const motivo = input.value.trim();
    if (!motivo) return;
    vibrarJ(12);
    const de = direccion === 'yo' ? miIdentidad : miRival;
    const para = direccion === 'yo' ? miRival : miIdentidad;
    try {
        await window.addDoc(window.collection(window.db, 'juegos'), {
            tipo: 'debeuna', de, para, motivo, estado: 'pendiente',
            creadoEn: Date.now(),
        });
        const form = document.getElementById('form-nuevo-debeuna');
        if (form) form.innerHTML = '';
        if (typeof registrarEvento === 'function') registrarEvento('nueva_deuda', `${nombreJugador(miIdentidad)} anotó un "te debo una"`);
    } catch (e) { console.error('No se pudo anotar la deuda:', e); }
}

async function cobrarDebeUna(id){
    vibrarJ([15, 30, 15]);
    if (window.sfx) window.sfx.moneda();
    try {
        await window.updateDoc(refDebeUna(id), { estado: 'cobrado', cobradoEn: Date.now() });
    } catch (e) { console.error('No se pudo cobrar la deuda:', e); }
}
