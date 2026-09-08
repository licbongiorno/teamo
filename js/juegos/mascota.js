// ==================== MASCOTA VIRTUAL (Chokurei) ====================
const DECAY_POR_HORA = 4; // % que baja cada estadística por hora real

// Textos divertidos aleatorios para el historial
const TEXTOS_ACCION = {
    hambre: ["le sirvió atún premium 🐟", "le dio un sobrecito jugoso 🥫", "compartió su pollito 🍗", "le llenó el platito de croquetas 🥣"],
    diversion: ["lo persiguió con el láser 🔴", "le tiró un ratón de juguete 🐁", "le armó un castillo con una caja de cartón 📦", "jugó a las escondidas 🫣"],
    carino: ["le rascó detrás de las orejas 👂", "se dejó 'amasar' la panza 🐾", "le hizo mimos hasta que se durmió 💤", "le dio besos en la frente 😽"]
};

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

function obtenerEstadoAnimo(hambre, diversion, carino, promedio, minimo) {
    if (minimo < 15) return { cara: '🙀', texto: '¡Alarma gatuna! ¡Hagan algo!' };
    if (hambre < 30) return { cara: '😾', texto: 'Humano, mi plato está vacío. Exijo comida.' };
    if (diversion < 30) return { cara: '😼', texto: 'Estoy tramando tirar algo de la mesa por aburrimiento...' };
    if (carino < 30) return { cara: '😿', texto: 'Me siento ignorado...' };
    if (promedio > 85) return { cara: '😻', texto: '*Prrrrrrrrrrr* (Motor de ronroneo al 100%)' };
    return { cara: '😺', texto: 'Todo en orden por aquí. Miau.' };
}

function renderMascota(estado){
    const cont = document.getElementById('contenido-mascota');
    if (!estado) estado = {};

    const hambre = valorConDecaimiento(estado.hambre ?? 100, estado.hambreActualizada);
    const diversion = valorConDecaimiento(estado.diversion ?? 100, estado.diversionActualizada);
    const carino = valorConDecaimiento(estado.carino ?? 100, estado.carinoActualizada);
    
    const promedio = Math.round((hambre + diversion + carino) / 3);
    const minimo = Math.min(hambre, diversion, carino);

    const animo = obtenerEstadoAnimo(hambre, diversion, carino, promedio, minimo);
    const historial = (estado.historial || []).slice(-6).reverse();

    cont.innerHTML = `
        <div class="panel texto-centro">
            <div id="cara-chokurei" class="escena-jardin" style="font-size: 4rem; transition: transform 0.2s;">
                ${animo.cara}
            </div>
            <div class="texto-fuerte" style="margin-bottom:4px;">Chokurei</div>
            <div class="texto-tenue" style="font-style: italic; font-size: 0.85rem; margin-bottom:14px;">
                "${animo.texto}"
            </div>
            
            <div class="medidor-jardin">
                <div style="display:flex; justify-content:space-between; font-size:0.75rem; margin-bottom:3px;">
                    <span>🐟 Hambre</span><span>${hambre}%</span>
                </div>
                <div class="barra-medidor"><div class="relleno-medidor relleno-agua" style="width:${hambre}%; transition: width 0.5s ease;"></div></div>
            </div>
            <div class="medidor-jardin">
                <div style="display:flex; justify-content:space-between; font-size:0.75rem; margin-bottom:3px;">
                    <span>🧶 Diversión</span><span>${diversion}%</span>
                </div>
                <div class="barra-medidor"><div class="relleno-medidor relleno-sol" style="width:${diversion}%; transition: width 0.5s ease;"></div></div>
            </div>
            <div class="medidor-jardin">
                <div style="display:flex; justify-content:space-between; font-size:0.75rem; margin-bottom:3px;">
                    <span>🖐️ Cariño</span><span>${carino}%</span>
                </div>
                <div class="barra-medidor"><div class="relleno-medidor" style="width:${carino}%; background:linear-gradient(90deg,var(--rosa),var(--lila)); transition: width 0.5s ease;"></div></div>
            </div>
        </div>

        <div class="btn-fila" style="margin-bottom:14px; gap: 8px; display: flex; justify-content: center;">
            <button class="btn-secundario" onclick="cuidarMascota('hambre')" ${hambre >= 100 ? 'disabled' : ''}>
                Alimentar 🐟
            </button>
            <button class="btn-secundario" onclick="cuidarMascota('diversion')" ${diversion >= 100 ? 'disabled' : ''}>
                Jugar 🧶
            </button>
            <button class="btn-secundario" onclick="cuidarMascota('carino')" ${carino >= 100 ? 'disabled' : ''}>
                Mimar 🖐️
            </button>
        </div>

        <div class="panel historial-kaizen" style="font-size: 0.85rem; line-height: 1.4;">
            ${historial.length
                ? historial.map(h => `<strong>${nombreJugador(h.autor)}</strong> ${h.accion} <span class="texto-tenue">(${haceCuanto(h.timestamp)})</span>`).join('<br>')
                : 'Nadie le ha prestado atención a Chokurei hoy... 😿'}
        </div>
    `;
}

async function cuidarMascota(tipo){
    if (typeof vibrarJ === 'function') vibrarJ(15);
    
    // Pequeño efecto visual en la cara (rebote)
    const caraUI = document.getElementById('cara-chokurei');
    if (caraUI) {
        caraUI.style.transform = "scale(1.3) translateY(-10px)";
        setTimeout(() => caraUI.style.transform = "scale(1) translateY(0)", 200);
    }

    const estado = await new Promise(res => { const u = window.onSnapshot(refMascota(), s => { u(); res(s.exists() ? s.data() : {}); }); });
    const ahora = Date.now();
    
    // Calcular el valor actual antes de sumar (para no pasarnos de 100)
    const campoFecha = tipo + 'Actualizada';
    const valorActual = valorConDecaimiento(estado[tipo] ?? 100, estado[campoFecha]);
    
    // Incrementar entre 25% y 40% al azar (¡hace que tengan que hacer clic más de una vez!)
    const incremento = Math.floor(Math.random() * 15) + 25; 
    const nuevoValor = Math.min(100, valorActual + incremento);

    // Seleccionar una frase aleatoria para el historial
    const opcionesTexto = TEXTOS_ACCION[tipo];
    const textoElegido = opcionesTexto[Math.floor(Math.random() * opcionesTexto.length)];

    const nuevoRegistro = { 
        tipo, 
        accion: textoElegido,
        autor: typeof miIdentidad !== 'undefined' ? miIdentidad : 'Alguien', 
        timestamp: ahora 
    };
    
    const historial = [...(estado.historial || []), nuevoRegistro].slice(-15); // Guardamos los últimos 15

    await window.setDoc(refMascota(), { 
        [tipo]: nuevoValor, 
        [campoFecha]: ahora, 
        historial 
    }, { merge: true });
}
