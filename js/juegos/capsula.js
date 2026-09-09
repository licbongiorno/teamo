// ==================== CÁPSULA DEL TIEMPO ====================
// Como "Carta para Abrir Después" pero colaborativa: los dos van
// agregando notas/predicciones a UNA cápsula compartida, hasta la
// fecha que elijan. Se abre sola cuando llega el día.
function refCapsula(){ return window.doc(window.db, 'juegos', 'capsula'); }

function iniciarCapsula(){
    if (window._unsubCapsula) window._unsubCapsula();
    window._unsubCapsula = window.onSnapshot(refCapsula(), (snap) => {
        renderCapsula(snap.exists() ? snap.data() : null);
    }, (err) => {
        console.error('Error de Firestore en cápsula:', err);
        document.getElementById('contenido-capsula').innerHTML = `<div class="panel texto-centro texto-tenue">⚠️ No se pudo conectar (${err.code || 'error'}).</div>`;
    });
}

function renderCapsula(estado){
    const cont = document.getElementById('contenido-capsula');

    if (!estado) {
        cont.innerHTML = `<div class="panel texto-centro">
            <p class="texto-tenue">Una cápsula del tiempo para los dos: van agregando notas, fotos en palabras o predicciones, y se abre sola el día que elijan.</p>
            <div class="texto-tenue" style="margin-bottom:6px;">¿Cuándo se abre?</div>
            <div class="btn-fila" style="margin-bottom:10px;">
                <button class="btn-secundario" onclick="crearCapsula(30)">1 mes</button>
                <button class="btn-secundario" onclick="crearCapsula(90)">3 meses</button>
                <button class="btn-secundario" onclick="crearCapsula(365)">1 año</button>
            </div>
        </div>`;
        return;
    }

    const abierta = Date.now() >= estado.fechaApertura;
    const items = estado.items || [];

    if (!abierta) {
        const dias = Math.ceil((estado.fechaApertura - Date.now()) / 86400000);
        cont.innerHTML = `<div class="panel texto-centro">
            <div style="font-size:2rem;">📦</div>
            <div class="texto-tenue">Sellada hasta el ${new Date(estado.fechaApertura).toLocaleDateString('es-AR', { day:'2-digit', month:'long', year:'numeric' })}</div>
            <div style="font-size:1.1rem; margin-top:6px;">Faltan ${dias} día${dias === 1 ? '' : 's'}</div>
            <div class="texto-tenue" style="margin-top:6px;">${items.length} cosa${items.length === 1 ? '' : 's'} adentro</div>
        </div>
        <div class="panel">
            <textarea id="input-item-capsula" rows="3" placeholder="Agregá una nota, un deseo, una predicción..." maxlength="500"
                style="width:100%; box-sizing:border-box; background:rgba(255,255,255,0.06); border:1px solid var(--borde); border-radius:14px; padding:12px; color:var(--texto); font-family:var(--fuente-texto); font-size:0.9rem; resize:vertical; margin-bottom:10px;"></textarea>
            <button class="btn-principal" onclick="agregarItemCapsula()">Meter en la cápsula</button>
        </div>`;
        return;
    }

    let html = `<div class="panel texto-centro logro-animado">
        <div style="font-size:2rem;">🎉📦</div>
        <div style="font-family:var(--fuente-titulo); font-size:1.3rem;">¡Se abrió la cápsula!</div>
    </div>`;
    if (items.length) {
        html += `<div class="panel">`;
        items.forEach(it => {
            const fecha = it.ts ? new Date(it.ts).toLocaleDateString('es-AR', { day:'2-digit', month:'short' }) : '';
            html += `<div style="padding:10px 0; border-bottom:1px solid rgba(255,255,255,0.08);">
                <div class="texto-tenue" style="font-size:0.7rem;">${nombreJugador(it.autor)} · ${fecha}</div>
                <div style="margin-top:4px;">${escaparHtml(it.texto)}</div>
            </div>`;
        });
        html += `</div>`;
    } else {
        html += `<div class="panel texto-centro texto-tenue">Quedó vacía. La próxima le meten algo.</div>`;
    }
    html += `<div class="panel texto-centro">
        <div class="texto-tenue" style="margin-bottom:8px;">Sellar una cápsula nueva:</div>
        <div class="btn-fila">
            <button class="btn-secundario" onclick="crearCapsula(30)">1 mes</button>
            <button class="btn-secundario" onclick="crearCapsula(90)">3 meses</button>
            <button class="btn-secundario" onclick="crearCapsula(365)">1 año</button>
        </div>
    </div>`;
    cont.innerHTML = html;
}

async function crearCapsula(dias){
    vibrarJ(12);
    await window.setDoc(refCapsula(), {
        fechaApertura: Date.now() + dias * 86400000, items: [], creadaEn: Date.now()
    });
}

async function agregarItemCapsula(){
    const input = document.getElementById('input-item-capsula');
    const texto = input.value.trim();
    if (!texto) return;
    vibrarJ(12);
    const snap = await new Promise(res => { const u = window.onSnapshot(refCapsula(), s => { u(); res(s); }); });
    const data = snap.data();
    if (!data || Date.now() >= data.fechaApertura) return;
    const items = [...(data.items || []), { autor: miIdentidad, texto, ts: Date.now() }];
    await window.updateDoc(refCapsula(), { items });
    input.value = '';
    if (typeof registrarEvento === 'function') {
        registrarEvento('cuidado_compartido', `${nombreJugador(miIdentidad)} agregó algo a la Cápsula del Tiempo`);
    }
}
