// ==================== CARTA PARA ABRIR DESPUÉS ====================
function refCartaTiempo(id){ return window.doc(window.db, 'juegos', id); }

function iniciarCartas(){ mostrarListaCartas('recibidas'); }

let _tabActualCartas = 'recibidas';

function mostrarListaCartas(tab){
    _tabActualCartas = tab || _tabActualCartas;
    if (window._unsubCartasActual) { window._unsubCartasActual(); window._unsubCartasActual = null; }
    const cont = document.getElementById('contenido-cartas');
    cont.innerHTML = `<div class="panel texto-centro texto-tenue">Cargando…</div>`;
    if (window._unsubCartasLista) window._unsubCartasLista();
    const q = window.query(window.collection(window.db, 'juegos'), window.where('tipo', '==', 'carta-tiempo'));
    window._unsubCartasLista = window.onSnapshot(q, (snap) => {
        const cartas = [];
        snap.forEach(d => cartas.push({ id: d.id, ...d.data() }));
        cartas.sort((a, b) => (b.creadaEn || 0) - (a.creadaEn || 0));
        renderListaCartas(cartas);
    }, (err) => {
        console.error('Error de Firestore en cartas:', err);
        cont.innerHTML = `<div class="panel texto-centro texto-tenue">⚠️ No se pudo conectar (${err.code || 'error'}).</div>`;
    });
}

function renderListaCartas(cartas){
    const cont = document.getElementById('contenido-cartas');
    const recibidas = cartas.filter(c => c.destinatario === miIdentidad);
    const enviadas = cartas.filter(c => c.autor === miIdentidad);
    const lista = _tabActualCartas === 'recibidas' ? recibidas : enviadas;

    let html = `<div class="panel texto-centro">
        <p class="texto-tenue">Escribí una carta que se abre recién en la fecha que elijas.</p>
        <button class="btn-principal" onclick="mostrarFormularioCarta()">💌 Escribir una carta</button>
    </div>
    <div id="form-carta-tiempo"></div>
    <div class="tabs-deseos" style="display:flex; gap:6px; margin-bottom:12px;">
        <div class="tab-deseo ${_tabActualCartas === 'recibidas' ? 'activo' : ''}" onclick="mostrarListaCartas('recibidas')" style="flex:1; text-align:center; padding:8px; border-radius:12px; cursor:pointer; background:${_tabActualCartas === 'recibidas' ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.05)'};">📥 Recibidas</div>
        <div class="tab-deseo ${_tabActualCartas === 'enviadas' ? 'activo' : ''}" onclick="mostrarListaCartas('enviadas')" style="flex:1; text-align:center; padding:8px; border-radius:12px; cursor:pointer; background:${_tabActualCartas === 'enviadas' ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.05)'};">📤 Enviadas</div>
    </div>`;

    if (!lista.length) {
        html += `<div class="panel texto-centro texto-tenue">${_tabActualCartas === 'recibidas' ? 'Todavía no te llegó ninguna carta.' : 'Todavía no escribiste ninguna carta.'}</div>`;
    } else {
        html += `<div class="lista-escrituras">`;
        lista.forEach(c => {
            const puedeAbrir = Date.now() >= c.fechaApertura;
            const fechaTexto = new Date(c.fechaApertura).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' });
            if (_tabActualCartas === 'recibidas') {
                if (!puedeAbrir) {
                    html += `<div class="item-escritura" style="opacity:0.6; cursor:default;">
                        <div class="info-escritura"><div class="titulo-escritura">🔒 Carta cerrada</div><div class="detalle-escritura">Se abre el ${fechaTexto}</div></div>
                    </div>`;
                } else if (!c.abierta) {
                    html += `<div class="item-escritura destello" onclick="abrirCartaTiempo('${c.id}')">
                        <div class="info-escritura"><div class="titulo-escritura">💌 Hay una carta esperándote</div><div class="detalle-escritura">Tocá para abrirla</div></div>
                    </div>`;
                } else {
                    html += `<div class="item-escritura" onclick="abrirCartaTiempo('${c.id}')">
                        <div class="info-escritura"><div class="titulo-escritura">${c.texto.slice(0, 40)}${c.texto.length > 40 ? '…' : ''}</div><div class="detalle-escritura">Abierta el ${new Date(c.fechaAbierta).toLocaleDateString('es-AR')}</div></div>
                    </div>`;
                }
            } else {
                html += `<div class="item-escritura" onclick="abrirCartaTiempo('${c.id}')">
                    <div class="info-escritura"><div class="titulo-escritura">${c.abierta ? '📖 Ya la leyó' : puedeAbrir ? '📬 Disponible para leer' : '🔒 Todavía cerrada'}</div><div class="detalle-escritura">Se abre el ${fechaTexto}</div></div>
                </div>`;
            }
        });
        html += `</div>`;
    }
    cont.innerHTML = html;
}

function mostrarFormularioCarta(){
    const cont = document.getElementById('form-carta-tiempo');
    cont.innerHTML = `<div class="panel">
        <textarea id="texto-carta-tiempo" rows="4" placeholder="Escribí tu carta..." maxlength="1500"
            style="width:100%; box-sizing:border-box; background:rgba(255,255,255,0.06); border:1px solid var(--borde); border-radius:14px; padding:12px; color:var(--texto); font-family:var(--fuente-texto); font-size:0.9rem; resize:vertical; margin-bottom:10px;"></textarea>
        <div class="texto-tenue" style="margin-bottom:6px;">¿Cuándo se abre?</div>
        <div class="btn-fila" style="margin-bottom:8px;">
            <button class="btn-secundario" onclick="elegirPlazoCarta(1)">Mañana</button>
            <button class="btn-secundario" onclick="elegirPlazoCarta(7)">En 7 días</button>
            <button class="btn-secundario" onclick="elegirPlazoCarta(30)">En 30 días</button>
        </div>
        <input type="date" id="fecha-personalizada-carta" style="width:100%; padding:10px; border-radius:10px; border:1px solid var(--borde); background:rgba(255,255,255,0.06); color:var(--texto); margin-bottom:10px;">
        <button class="btn-principal" onclick="enviarCartaTiempo()">Sellar y enviar</button>
    </div>`;
}

let _plazoSeleccionadoCarta = null;
function elegirPlazoCarta(dias){
    _plazoSeleccionadoCarta = dias;
    vibrarJ(8);
    document.getElementById('fecha-personalizada-carta').value = '';
}

async function enviarCartaTiempo(){
    const texto = document.getElementById('texto-carta-tiempo').value.trim();
    if (!texto) return;
    const fechaInput = document.getElementById('fecha-personalizada-carta').value;
    let fechaApertura;
    if (fechaInput) {
        fechaApertura = new Date(fechaInput + 'T09:00:00').getTime();
    } else if (_plazoSeleccionadoCarta) {
        fechaApertura = Date.now() + _plazoSeleccionadoCarta * 86400000;
    } else {
        fechaApertura = Date.now() + 86400000; // por defecto, mañana
    }
    vibrarJ([15, 30, 15]);
    await window.addDoc(window.collection(window.db, 'juegos'), {
        tipo: 'carta-tiempo', autor: miIdentidad, destinatario: miRival, texto,
        creadaEn: Date.now(), fechaApertura, abierta: false, fechaAbierta: null
    });
    if (typeof registrarEvento === 'function') {
        registrarEvento('carta_tiempo_enviada', `${nombreJugador(miIdentidad)} mandó una carta para abrir después`);
    }
    _plazoSeleccionadoCarta = null;
    mostrarListaCartas('enviadas');
}

function abrirCartaTiempo(id){
    vibrarJ(10);
    if (window._unsubCartasLista) { window._unsubCartasLista(); window._unsubCartasLista = null; }
    if (window._unsubCartasActual) window._unsubCartasActual();
    window._unsubCartasActual = window.onSnapshot(refCartaTiempo(id), (snap) => {
        if (!snap.exists()) { mostrarListaCartas(); return; }
        renderCartaTiempoAbierta({ id: snap.id, ...snap.data() });
    }, (err) => console.error(err));
}

async function renderCartaTiempoAbierta(c){
    const cont = document.getElementById('contenido-cartas');
    const puedeVer = Date.now() >= c.fechaApertura;
    if (!puedeVer) { mostrarListaCartas(); return; }

    if (c.destinatario === miIdentidad && !c.abierta) {
        await window.updateDoc(refCartaTiempo(c.id), { abierta: true, fechaAbierta: Date.now() });
        return; // el propio onSnapshot va a re-renderizar con abierta:true
    }

    cont.innerHTML = `<button class="btn-secundario" style="margin-bottom:12px;" onclick="mostrarListaCartas()">⬅️ Todas las cartas</button>
        <div class="panel flip-carta">
            <div class="texto-tenue" style="margin-bottom:10px;">De ${nombreJugador(c.autor)} para ${nombreJugador(c.destinatario)}</div>
            <p style="line-height:1.6; white-space:pre-wrap;">${c.texto}</p>
        </div>`;
}
