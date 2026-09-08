// ==================== LETRAS COMPARTIDAS (cadáver exquisito) ====================
// Cada "escritura" es un documento dentro de la misma colección 'juegos'
// (con tipo:'escritura'), así no hace falta agregar otra colección a las
// Reglas de Firestore. Se turnan para escribir un fragmento cada uno,
// cada quien con su color, y queda guardada con su título para releerla
// o retomarla después. "Nueva escritura" siempre es posible.
function refEscritura(id){ return window.doc(window.db, 'juegos', id); }

function iniciarLetras(){
    mostrarListaEscrituras();
}

function mostrarListaEscrituras(){
    if (window._unsubEscrituraActual) { window._unsubEscrituraActual(); window._unsubEscrituraActual = null; }
    const cont = document.getElementById('contenido-letras');
    cont.innerHTML = `<div class="panel texto-centro texto-tenue">Cargando…</div>`;

    if (window._unsubLetrasLista) window._unsubLetrasLista();
    const q = window.query(window.collection(window.db, 'juegos'), window.where('tipo', '==', 'escritura'));
    window._unsubLetrasLista = window.onSnapshot(q, (snap) => {
        const escrituras = [];
        snap.forEach(d => escrituras.push({ id: d.id, ...d.data() }));
        escrituras.sort((a, b) => (b.creadaEn || 0) - (a.creadaEn || 0));
        renderListaEscrituras(escrituras);
    }, (err) => {
        console.error('Error de Firestore en letras:', err);
        cont.innerHTML = `<div class="panel texto-centro texto-tenue">⚠️ No se pudo conectar (${err.code || 'error'}).</div>`;
    });
}

function renderListaEscrituras(escrituras){
    const cont = document.getElementById('contenido-letras');
    let html = `<div class="panel texto-centro">
        <p class="texto-tenue">Cadáver exquisito: uno escribe un poco, después le toca al otro, así hasta donde quieran.</p>
        <button class="btn-principal" onclick="mostrarFormularioEscritura()">✍️ Nueva escritura</button>
    </div>
    <div id="form-nueva-escritura"></div>`;

    if (escrituras.length) {
        html += `<div class="lista-escrituras">`;
        escrituras.forEach(e => {
            const cantidad = (e.fragmentos || []).length;
            const esMiTurno = e.estado === 'activa' && e.turno === miIdentidad;
            html += `<div class="item-escritura" onclick="abrirEscritura('${e.id}')">
                <div class="info-escritura">
                    <div class="titulo-escritura">${e.titulo}</div>
                    <div class="detalle-escritura">${cantidad} fragmento${cantidad === 1 ? '' : 's'}${esMiTurno ? ' · tu turno' : ''}</div>
                </div>
                <span class="badge-estado ${e.estado === 'activa' ? 'badge-activa' : 'badge-terminada'}">${e.estado === 'activa' ? 'En curso' : 'Terminada'}</span>
            </div>`;
        });
        html += `</div>`;
    } else {
        html += `<div class="panel texto-centro texto-tenue">Todavía no escribieron nada juntos. ¡Arranquen la primera!</div>`;
    }

    cont.innerHTML = html;
}

function mostrarFormularioEscritura(){
    const cont = document.getElementById('form-nueva-escritura');
    cont.innerHTML = `
        <div class="panel">
            <input type="text" id="input-titulo-escritura" placeholder="Título de la escritura" autocomplete="off" maxlength="60"
                style="width:100%; padding:12px; border-radius:12px; border:1px solid var(--borde); background:rgba(255,255,255,0.06); color:var(--texto); font-size:1rem; margin-bottom:10px; text-align:center;">
            <button class="btn-principal" onclick="crearEscritura()">Empezar a escribir</button>
        </div>`;
    setTimeout(() => document.getElementById('input-titulo-escritura').focus(), 100);
}

async function crearEscritura(){
    const titulo = document.getElementById('input-titulo-escritura').value.trim();
    if (!titulo) return;
    vibrarJ(12);
    const docRef = await window.addDoc(window.collection(window.db, 'juegos'), {
        tipo: 'escritura',
        titulo: titulo,
        creadaPor: miIdentidad,
        creadaEn: Date.now(),
        turno: miIdentidad,
        estado: 'activa',
        fragmentos: []
    });
    abrirEscritura(docRef.id);
}

function abrirEscritura(id){
    vibrarJ(10);
    if (window._unsubLetrasLista) { window._unsubLetrasLista(); window._unsubLetrasLista = null; }
    if (window._unsubEscrituraActual) window._unsubEscrituraActual();
    window._escrituraActualId = id;
    window._unsubEscrituraActual = window.onSnapshot(refEscritura(id), (snap) => {
        if (!snap.exists()) { mostrarListaEscrituras(); return; }
        renderEscritura({ id: snap.id, ...snap.data() });
    }, (err) => {
        console.error('Error de Firestore en escritura:', err);
    });
}

function renderEscritura(e){
    const cont = document.getElementById('contenido-letras');
    const fragmentos = e.fragmentos || [];
    let html = `<button class="btn-secundario" style="margin-bottom:12px;" onclick="mostrarListaEscrituras()">⬅️ Todas las escrituras</button>
    <div class="panel"><div class="titulo-juego" style="font-size:1.2rem; margin-bottom:10px;">${e.titulo}</div>
    <div class="texto-escritura">`;

    if (fragmentos.length) {
        fragmentos.forEach(f => {
            html += `<div class="fragmento fragmento-${f.autor}">
                <span class="autor-fragmento">${nombreJugadorFrutas(f.autor)}</span>${escaparHtml(f.texto)}
            </div>`;
        });
    } else {
        html += `<p class="texto-tenue">Todavía no hay ningún fragmento. ¡Empezá vos!</p>`;
    }
    html += `</div></div>`;

    if (e.estado === 'terminada') {
        html += `<div class="panel texto-centro texto-tenue">Esta escritura fue dada por terminada. Podés releerla cuando quieras, o empezar una nueva.</div>`;
    } else if (e.turno === miIdentidad) {
        html += `<div class="panel">
            <textarea id="input-fragmento" rows="3" placeholder="Seguí la escritura con tu parte..." maxlength="600"></textarea>
            <button class="btn-principal" onclick="agregarFragmento()">Agregar mi parte</button>
        </div>
        <button class="btn-secundario" onclick="finalizarEscritura()">🏁 Dar por terminada esta escritura</button>`;
    } else {
        html += `<div class="panel texto-centro texto-tenue">Le toca escribir a ${nombreJugadorFrutas(e.turno)}…</div>
        <button class="btn-secundario" onclick="finalizarEscritura()">🏁 Dar por terminada esta escritura</button>`;
    }

    cont.innerHTML = html;
}

function escaparHtml(texto){
    const div = document.createElement('div');
    div.innerText = texto;
    return div.innerHTML;
}

async function agregarFragmento(){
    const input = document.getElementById('input-fragmento');
    const texto = input.value.trim();
    if (!texto || !window._escrituraActualId) return;
    vibrarJ(12);
    const id = window._escrituraActualId;
    const snap = await new Promise(res => { const u = window.onSnapshot(refEscritura(id), s => { u(); res(s); }); });
    if (!snap.exists()) return;
    const e = snap.data();
    if (e.turno !== miIdentidad || e.estado !== 'activa') return;
    const nuevosFragmentos = [...(e.fragmentos || []), { autor: miIdentidad, texto, ts: Date.now() }];
    const siguienteTurno = miIdentidad === 'nico' ? 'carito' : 'nico';
    await window.updateDoc(refEscritura(id), { fragmentos: nuevosFragmentos, turno: siguienteTurno });
}

async function finalizarEscritura(){
    if (!window._escrituraActualId) return;
    vibrarJ([10,30,10]);
    await window.updateDoc(refEscritura(window._escrituraActualId), { estado: 'terminada' });
}
