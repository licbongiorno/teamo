// ==================== MAPA DE NUESTROS LUGARES ====================
// Version simplificada: una lista de lugares importantes, agrupados
// por categoría (no es un mapa geográfico real con coordenadas, para
// no depender de una API externa con clave propia).
const CATEGORIAS_MAPA = [
    { id: 'recuerdo', nombre: 'Recuerdos', icono: '💭' },
    { id: 'futuro', nombre: 'Para visitar', icono: '🧭' },
    { id: 'importante', nombre: 'Lugares importantes', icono: '📍' },
];

function iniciarMapa(){
    if (window._unsubMapa) window._unsubMapa();
    const q = window.query(window.collection(window.db, 'juegos'), window.where('tipo', '==', 'lugar-mapa'));
    window._unsubMapa = window.onSnapshot(q, (snap) => {
        const lugares = [];
        snap.forEach(d => lugares.push({ id: d.id, ...d.data() }));
        lugares.sort((a, b) => (b.creadoEn || 0) - (a.creadoEn || 0));
        renderMapa(lugares);
    }, (err) => {
        console.error('Error de Firestore en mapa:', err);
        document.getElementById('contenido-mapa').innerHTML = `<div class="panel texto-centro texto-tenue">⚠️ No se pudo conectar (${err.code || 'error'}).</div>`;
    });
}

function renderMapa(lugares){
    const cont = document.getElementById('contenido-mapa');
    let html = `<div class="panel texto-centro">
        <p class="texto-tenue">Nuestros lugares: dónde se conocieron, dónde se van a encontrar, lugares que quieren visitar algún día.</p>
        <button class="btn-principal" onclick="mostrarFormularioMapa()">📍 Agregar un lugar</button>
    </div>
    <div id="form-lugar-mapa"></div>`;

    CATEGORIAS_MAPA.forEach(cat => {
        const delGrupo = lugares.filter(l => l.categoria === cat.id);
        html += `<div class="panel"><div class="texto-tenue" style="margin-bottom:10px;">${cat.icono} ${cat.nombre} (${delGrupo.length})</div>`;
        if (delGrupo.length) {
            delGrupo.forEach(l => {
                html += `<div style="padding:10px 0; border-bottom:1px solid rgba(255,255,255,0.08);">
                    <div style="font-weight:600;">${escaparHtml(l.nombre)}</div>
                    ${l.descripcion ? `<div class="texto-tenue" style="font-size:0.85rem; margin-top:2px;">${escaparHtml(l.descripcion)}</div>` : ''}
                    <div class="texto-tenue" style="font-size:0.7rem; margin-top:4px;">Agregado por ${nombreJugador(l.autor)}</div>
                </div>`;
            });
        } else {
            html += `<p class="texto-tenue" style="font-size:0.85rem;">Todavía no hay ninguno en esta categoría.</p>`;
        }
        html += `</div>`;
    });

    cont.innerHTML = html;
}

function mostrarFormularioMapa(){
    const cont = document.getElementById('form-lugar-mapa');
    if (!cont) return;
    cont.innerHTML = `<div class="panel">
        <input type="text" id="input-nombre-lugar" placeholder="Nombre del lugar" autocomplete="off"
            style="width:100%; padding:10px; border-radius:10px; border:1px solid var(--borde); background:rgba(255,255,255,0.06); color:var(--texto); margin-bottom:8px;">
        <textarea id="input-desc-lugar" rows="2" placeholder="¿Por qué es importante? (opcional)" maxlength="300"
            style="width:100%; box-sizing:border-box; background:rgba(255,255,255,0.06); border:1px solid var(--borde); border-radius:10px; padding:10px; color:var(--texto); font-family:var(--fuente-texto); resize:vertical; margin-bottom:8px;"></textarea>
        <div class="btn-fila" style="margin-bottom:10px;">
            ${CATEGORIAS_MAPA.map(c => `<button class="btn-secundario" id="cat-btn-${c.id}" onclick="elegirCategoriaMapa('${c.id}')">${c.icono} ${c.nombre}</button>`).join('')}
        </div>
        <button class="btn-principal" onclick="agregarLugarMapa()">Agregar</button>
    </div>`;
}

let _categoriaElegidaMapa = 'importante';
function elegirCategoriaMapa(id){
    _categoriaElegidaMapa = id;
    vibrarJ(8);
    CATEGORIAS_MAPA.forEach(c => {
        const btn = document.getElementById('cat-btn-' + c.id);
        if (btn) btn.classList.toggle('opcion-elegida', c.id === id);
    });
}

async function agregarLugarMapa(){
    const nombre = document.getElementById('input-nombre-lugar').value.trim();
    const descripcion = document.getElementById('input-desc-lugar').value.trim();
    if (!nombre) return;
    vibrarJ(12);
    await window.addDoc(window.collection(window.db, 'juegos'), {
        tipo: 'lugar-mapa', nombre, descripcion, categoria: _categoriaElegidaMapa,
        autor: miIdentidad, creadoEn: Date.now()
    });
    if (typeof registrarEvento === 'function') {
        registrarEvento('cuidado_compartido', `${nombreJugador(miIdentidad)} agregó "${nombre}" al Mapa de Nuestros Lugares`);
    }
    document.getElementById('form-lugar-mapa').innerHTML = '';
}
