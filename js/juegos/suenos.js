// ==================== LISTA DE SUEÑOS COMPARTIDA ====================
// La bucket list de los dos: sueños por categoría, "🙋 me animo" de cada
// uno y, cuando lo cumplen, la fecha y una fotito chiquita de recuerdo.
// Doc juegos/suenos: { items: [{id, texto, cat, por, creado, animan:{nico,carito}, cumplido, conFoto}] }
// Cada foto va en su propio doc (juegos/sueno-foto-<id>) para no inflar la lista.
const CATS_SUENOS = {
    viajes: '✈️ Viajes', aventura: '🎢 Aventuras', hogar: '🏡 Hogar', sabores: '🍽️ Sabores', aprender: '🎨 Aprender', nosotros: '💞 Nosotros',
};
const IDEAS_SUENOS = [
    ['viajes', 'Ver una aurora boreal'], ['viajes', 'Un viaje en auto sin rumbo fijo'], ['aventura', 'Saltar en paracaídas'],
    ['aventura', 'Dormir en una carpa bajo las estrellas'], ['hogar', 'Tener una plantita que sobreviva un año'], ['sabores', 'Aprender a hacer pastas caseras juntos'],
    ['aprender', 'Tomar clases de baile'], ['nosotros', 'Escribirnos una carta para abrir en 10 años'], ['sabores', 'Probar la comida de 5 países distintos'],
    ['aventura', 'Ver un amanecer desde una montaña'], ['nosotros', 'Plantar un árbol juntos'], ['aprender', 'Aprender a decir "te amo" en 10 idiomas'],
];
let _suenosDatos = { items: [] }, _suenosVista = 'pendientes', _suenosFiltro = null;
const _fotosSuenos = {};

function _refSuenos(){ return window.doc(window.db, 'juegos', 'suenos'); }
function _refFotoSueno(id){ return window.doc(window.db, 'juegos', 'sueno-foto-' + id); }
function _escSuenos(t){ return String(t ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch])); }

function iniciarSuenos(){
    const cont = document.getElementById('contenido-suenos');
    cont.innerHTML = `<div class="panel texto-centro texto-tenue">Cargando…</div>`;
    if (window._unsubSuenos) window._unsubSuenos();
    window._unsubSuenos = window.onSnapshot(_refSuenos(), (snap) => {
        _suenosDatos = snap.exists() ? { items: [], ...snap.data() } : { items: [] };
        renderSuenos();
    }, (err) => { cont.innerHTML = `<div class="panel texto-centro texto-tenue">⚠️ No se pudo conectar (${err.code || 'error'}).</div>`; });
}

// Cambios a la lista siempre en transacción (los dos pueden tocar a la vez).
async function _cambiarSuenos(fn){
    try {
        await window.runTransaction(window.db, async (tx) => {
            const s = await tx.get(_refSuenos());
            const d = s.exists() ? { items: [], ...s.data() } : { items: [] };
            const items = fn(d.items.map(x => ({ ...x })));
            if (items) tx.set(_refSuenos(), { ...d, items });
        });
    } catch (e) { console.error('No se pudo guardar la lista de sueños:', e); }
}

function renderSuenos(){
    const cont = document.getElementById('contenido-suenos');
    if (!cont) return;
    const items = _suenosDatos.items || [];
    const cumplidos = items.filter(x => x.cumplido), pendientes = items.filter(x => !x.cumplido);
    const lista = (_suenosVista === 'cumplidos' ? cumplidos.sort((a, b) => b.cumplido - a.cumplido) : pendientes.sort((a, b) => b.creado - a.creado))
        .filter(x => !_suenosFiltro || x.cat === _suenosFiltro);
    let h = `<div class="panel">
        <div class="texto-centro" style="margin-bottom:8px;"><b>${cumplidos.length}</b> ${cumplidos.length === 1 ? 'cumplido' : 'cumplidos'} de <b>${items.length}</b> ${items.length === 1 ? 'sueño' : 'sueños'}</div>
        <div class="progreso-orden"><div style="width:${items.length ? Math.round(cumplidos.length * 100 / items.length) : 0}%"></div></div>
        <div class="sueno-nuevo"><input id="sueno-texto" maxlength="90" placeholder="✨ Un sueño para cumplir juntos…">
        <select id="sueno-cat">${Object.entries(CATS_SUENOS).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select></div>
        <div class="btn-fila" style="margin-top:8px;"><button class="btn-principal" onclick="agregarSueno()">Agregar</button>
        <button class="btn-secundario" onclick="ideaSueno()">💡 Dame una idea</button></div>
    </div>
    <div class="pestanas-suenos"><button class="${_suenosVista === 'pendientes' ? 'activa' : ''}" onclick="vistaSuenos('pendientes')">🌠 Por cumplir (${pendientes.length})</button>
        <button class="${_suenosVista === 'cumplidos' ? 'activa' : ''}" onclick="vistaSuenos('cumplidos')">✅ Cumplidos (${cumplidos.length})</button></div>
    <div class="filtro-suenos"><button class="${!_suenosFiltro ? 'activa' : ''}" onclick="filtrarSuenos(null)">Todos</button>${Object.entries(CATS_SUENOS).map(([k, v]) => `<button class="${_suenosFiltro === k ? 'activa' : ''}" onclick="filtrarSuenos('${k}')">${v.split(' ')[0]}</button>`).join('')}</div>`;
    if (!lista.length) {
        h += `<div class="panel texto-centro texto-tenue">${_suenosVista === 'cumplidos' ? 'Todavía no cumplieron ninguno… ¡a ponerse las pilas! 💪' : (items.length ? 'Nada por acá.' : 'Todavía no hay sueños. Escriban el primero 🌠')}</div>`;
    }
    lista.forEach(x => {
        const animan = x.animan || {};
        const yoMeAnimo = !!animan[miIdentidad], elSeAnima = !!animan[miRival];
        h += `<div class="panel sueno-item${x.cumplido ? ' cumplido' : ''}" data-aj-id="sueno-${_escSuenos(x.id)}">
            <div class="sueno-cat">${CATS_SUENOS[x.cat] || '✨'} · de ${nombreJugador(x.por)}</div>
            <div class="sueno-texto">${_escSuenos(x.texto)}</div>`;
        if (x.cumplido) {
            h += `<div class="texto-tenue" style="font-size:0.8rem;">✅ Cumplido el ${new Date(x.cumplido).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                ${x.conFoto ? `<img class="sueno-foto" id="foto-sueno-${_escSuenos(x.id)}" alt="Foto del sueño cumplido" ${_fotosSuenos[x.id] ? `src="${_fotosSuenos[x.id]}"` : ''}>` : ''}
                <div class="btn-fila" style="margin-top:6px;"><label class="btn-secundario sueno-btn-foto">📷 ${x.conFoto ? 'Cambiar foto' : 'Agregar foto'}<input type="file" accept="image/*" hidden onchange="fotoSueno('${_escSuenos(x.id)}', this)"></label>
                <button class="btn-secundario" onclick="descumplirSueno('${_escSuenos(x.id)}')">↩️ No era</button></div>`;
        } else {
            h += `<div class="sueno-animan">${yoMeAnimo ? '🙋 Vos te animás' : ''}${yoMeAnimo && elSeAnima ? ' · ' : ''}${elSeAnima ? `🙋 ${nombreJugador(miRival)} se anima` : ''}${yoMeAnimo && elSeAnima ? ' · 🔥 ¡Los dos!' : ''}</div>
                <div class="btn-fila"><button class="btn-secundario" onclick="animarmeSueno('${_escSuenos(x.id)}')">${yoMeAnimo ? '🙅 Ya no' : '🙋 ¡Me animo!'}</button>
                <button class="btn-principal" onclick="cumplirSueno('${_escSuenos(x.id)}')">✅ ¡Cumplido!</button>
                ${x.por === miIdentidad ? `<button class="btn-secundario" title="Borrar" onclick="borrarSueno('${_escSuenos(x.id)}')">🗑️</button>` : ''}</div>`;
        }
        h += `</div>`;
    });
    cont.innerHTML = h;
    if (_suenosVista === 'cumplidos') lista.filter(x => x.conFoto && !_fotosSuenos[x.id]).forEach(x => _cargarFotoSueno(x.id));
}

function _cargarFotoSueno(id){
    const unsub = window.onSnapshot(_refFotoSueno(id), (snap) => {
        if (snap.exists()) {
            _fotosSuenos[id] = snap.data().img;
            const img = document.getElementById('foto-sueno-' + id);
            if (img) img.src = _fotosSuenos[id];
        }
        setTimeout(() => unsub && unsub(), 0);
    }, () => {});
}

function vistaSuenos(v){ vibrarJ(8); _suenosVista = v; renderSuenos(); }
function filtrarSuenos(c){ vibrarJ(8); _suenosFiltro = c; renderSuenos(); }
function ideaSueno(){
    const usados = new Set((_suenosDatos.items || []).map(x => x.texto));
    const libres = IDEAS_SUENOS.filter(([, t]) => !usados.has(t));
    const [cat, texto] = (libres.length ? libres : IDEAS_SUENOS)[Math.floor(Math.random() * (libres.length || IDEAS_SUENOS.length))];
    const i = document.getElementById('sueno-texto'), c = document.getElementById('sueno-cat');
    if (i) i.value = texto;
    if (c) c.value = cat;
}
async function agregarSueno(){
    const texto = (document.getElementById('sueno-texto')?.value || '').trim().slice(0, 90);
    const cat = document.getElementById('sueno-cat')?.value || 'nosotros';
    if (texto.length < 3) { document.getElementById('sueno-texto')?.focus(); return; }
    vibrarJ(12);
    if (window.sfx) window.sfx.acierto();
    _suenosVista = 'pendientes';
    const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
    await _cambiarSuenos(items => [...items, { id, texto, cat, por: miIdentidad, creado: Date.now(), animan: { [miIdentidad]: true }, cumplido: null, conFoto: false }]);
}
async function animarmeSueno(id){
    vibrarJ(10);
    await _cambiarSuenos(items => items.map(x => x.id === id ? { ...x, animan: { ...(x.animan || {}), [miIdentidad]: !(x.animan || {})[miIdentidad] } } : x));
}
async function cumplirSueno(id){
    vibrarJ([20, 40, 20]);
    if (window.fx) window.fx.confeti(60);
    if (window.sfx) window.sfx.victoria ? window.sfx.victoria() : window.sfx.acierto();
    const x = (_suenosDatos.items || []).find(y => y.id === id);
    await _cambiarSuenos(items => items.map(y => y.id === id ? { ...y, cumplido: Date.now() } : y));
    if (x && typeof registrarEvento === 'function') registrarEvento('sueno_cumplido', `Cumplieron un sueño: ${x.texto}`);
    _suenosVista = 'cumplidos';
    renderSuenos();
}
async function descumplirSueno(id){
    if (!confirm('¿Lo volvemos a la lista de sueños por cumplir?')) return;
    await _cambiarSuenos(items => items.map(y => y.id === id ? { ...y, cumplido: null } : y));
}
async function borrarSueno(id){
    if (!confirm('¿Borrar este sueño de la lista?')) return;
    await _cambiarSuenos(items => items.filter(y => y.id !== id));
}
// La foto se achica a 360px de lado y JPEG liviano (~20-30 KB).
function fotoSueno(id, input){
    const f = input.files && input.files[0];
    if (!f) return;
    const img = new Image();
    img.onload = async () => {
        const lado = 360, k = Math.min(1, lado / Math.max(img.width, img.height));
        const cv = document.createElement('canvas');
        cv.width = Math.round(img.width * k); cv.height = Math.round(img.height * k);
        cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
        let calidad = 0.7, url = cv.toDataURL('image/jpeg', calidad);
        while (url.length > 40000 && calidad > 0.3) { calidad -= 0.1; url = cv.toDataURL('image/jpeg', calidad); }
        try {
            await window.setDoc(_refFotoSueno(id), { img: url, por: miIdentidad, fecha: Date.now() });
            _fotosSuenos[id] = url;
            await _cambiarSuenos(items => items.map(y => y.id === id ? { ...y, conFoto: true } : y));
            renderSuenos();
        } catch (e) { console.error('No se pudo guardar la foto:', e); }
    };
    // Con FileReader (data:) porque la CSP de la página no deja cargar blob:.
    const lector = new FileReader();
    lector.onload = () => { img.src = lector.result; };
    lector.readAsDataURL(f);
}

window.INICIAR_JUEGO = window.INICIAR_JUEGO || {};
window.INICIAR_JUEGO.suenos = iniciarSuenos;
