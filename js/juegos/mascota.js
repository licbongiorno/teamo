// ==================== MASCOTA VIRTUAL (Chokurei) ====================
const DECAY_POR_HORA = 4; // % que baja cada estadística por hora real

function refMascota(){ return window.doc(window.db, 'juegos', 'mascota'); }

function iniciarMascota(){
    if (window._unsubMascota) window._unsubMascota();
    window._unsubMascota = window.onSnapshot(refMascota(), (snap) => {
        renderMascota(snap.exists() ? snap.data() : null);
    }, (err) => {
        console.error('Error de Firestore en mascota:', err);
        document.getElementById('contenido-mascota').innerHTML = `<div class="panel texto-centro texto-tenue">⚠️ No se pudo conectar (${err.code || 'error'}).</div>`;
    });
}

function valorConDecaimiento(valorGuardado, actualizadoEn){
    if (valorGuardado == null) return 100;
    const horas = (Date.now() - (actualizadoEn || Date.now())) / 3600000;
    return Math.max(0, Math.round(valorGuardado - horas * DECAY_POR_HORA));
}

function haceCuanto(ms){
    if (!ms) return '';
    const minutos = Math.floor((Date.now() - ms) / 60000);
    if (minutos < 1) return 'recién';
    if (minutos < 60) return `hace ${minutos} min`;
    const horas = Math.floor(minutos / 60);
    if (horas < 24) return `hace ${horas} h`;
    const dias = Math.floor(horas / 24);
    return `hace ${dias} día${dias === 1 ? '' : 's'}`;
}

function renderMascota(estado){
    const cont = document.getElementById('contenido-mascota');
    if (!estado) estado = {};

    const hambre = valorConDecaimiento(estado.hambre ?? 100, estado.hambreActualizada);
    const diversion = valorConDecaimiento(estado.diversion ?? 100, estado.diversionActualizada);
    const carino = valorConDecaimiento(estado.carino ?? 100, estado.carinoActualizada);
    const promedio = (hambre + diversion + carino) / 3;
    const minimo = Math.min(hambre, diversion, carino);

    let cara = '😺';
    if (minimo < 25) cara = '😿';
    else if (minimo < 55) cara = '🙀';
    else if (promedio > 85) cara = '😻';

    const historial = (estado.historial || []).slice(-5).reverse();

    cont.innerHTML = `
        <div class="panel texto-centro">
            <div class="escena-jardin">${cara}</div>
            <div class="texto-tenue" style="margin-bottom:14px;">Chokurei</div>
            <div class="medidor-jardin">
                <div style="display:flex; justify-content:space-between; font-size:0.75rem; margin-bottom:3px;"><span>🐟 Hambre</span><span>${hambre}%</span></div>
                <div class="barra-medidor"><div class="relleno-medidor relleno-agua" style="width:${hambre}%;"></div></div>
            </div>
            <div class="medidor-jardin">
                <div style="display:flex; justify-content:space-between; font-size:0.75rem; margin-bottom:3px;"><span>🧶 Diversión</span><span>${diversion}%</span></div>
                <div class="barra-medidor"><div class="relleno-medidor relleno-sol" style="width:${diversion}%;"></div></div>
            </div>
            <div class="medidor-jardin">
                <div style="display:flex; justify-content:space-between; font-size:0.75rem; margin-bottom:3px;"><span>🖐️ Cariño</span><span>${carino}%</span></div>
                <div class="barra-medidor"><div class="relleno-medidor" style="width:${carino}%; background:linear-gradient(90deg,var(--rosa),var(--lila));"></div></div>
            </div>
        </div>
        <div class="btn-fila" style="margin-bottom:14px;">
            <button class="btn-secundario" onclick="cuidarMascota('hambre')">Alimentar 🐟</button>
            <button class="btn-secundario" onclick="cuidarMascota('diversion')">Jugar 🧶</button>
            <button class="btn-secundario" onclick="cuidarMascota('carino')">Mimar 🖐️</button>
        </div>
        <div class="panel historial-kaizen">
            ${historial.length
                ? historial.map(h => `${nombreJugador(h.autor)} le ${h.tipo === 'hambre' ? 'dio de comer' : h.tipo === 'diversion' ? 'jugó con Chokurei' : 'hizo mimos'} ${haceCuanto(h.timestamp)}`).join('<br>')
                : 'Todavía nadie cuidó a Chokurei hoy.'}
        </div>
    `;
}

async function cuidarMascota(tipo){
    vibrarJ(15);
    const estado = await new Promise(res => { const u = window.onSnapshot(refMascota(), s => { u(); res(s.exists() ? s.data() : {}); }); });
    const ahora = Date.now();
    const historial = [...(estado.historial || []), { tipo, autor: miIdentidad, timestamp: ahora }].slice(-10);
    const campoValor = tipo; // 'hambre' | 'diversion' | 'carino'
    const campoFecha = tipo + 'Actualizada';
    await window.setDoc(refMascota(), { [campoValor]: 100, [campoFecha]: ahora, historial }, { merge: true });
}
