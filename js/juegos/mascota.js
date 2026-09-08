// ==================== MASCOTA VIRTUAL: CHOKUREI 2.0 ====================
const DECAY = { hambre: 4, diversion: 5, carino: 3, energia: 2 }; // % por hora

const DICCIONARIO = {
    hambre: {
        normal: ["le sirvió su platito de croquetas 🥣", "le dio un sobrecito jugoso 🥫"],
        critico: ["¡CRÍTICO! Le dio atún premium recién abierto 🐟✨"],
        fallo: ["intentó alimentarlo, pero Chokurei lo miró con desdén (Empacho) 😾"]
    },
    diversion: {
        normal: ["lo persiguió por la casa con el láser 🔴", "le tiró un ratoncito 🐁"],
        critico: ["¡CRÍTICO! Armó un fuerte de cajas de cartón épico 📦✨"],
        fallo: ["quiso jugar, pero Chokurei prefirió mirar a la pared 🧱"]
    },
    carino: {
        normal: ["le rascó la barbilla 🐾", "le hizo mimos en la panza 💤"],
        critico: ["¡CRÍTICO! Logró un ronroneo de motor V8 😻✨"],
        fallo: ["fue a abrazarlo y se ligó un arañazo táctico 💥"]
    }
};

function refMascota(){ return window.doc(window.db, 'juegos', 'mascota'); }

function iniciarMascota(){
    if (window._unsubMascota) window._unsubMascota();
    window._unsubMascota = window.onSnapshot(refMascota(), (snap) => {
        renderMascota(snap.exists() ? snap.data() : null);
    }, (err) => console.error('Error de Firestore:', err));
}

function valorConDecaimiento(valorGuardado, actualizadoEn, tasa){
    if (valorGuardado == null) return 100;
    const horas = (Date.now() - (actualizadoEn || Date.now())) / 3600000;
    return Math.max(0, Math.round(valorGuardado - horas * tasa));
}

function calcularNivel(xp) {
    return Math.floor(Math.sqrt((xp || 0) / 50)) + 1; // Curva de nivel clásica
}

function obtenerEstado(estado) {
    const hora = new Date().getHours();
    const esDeNoche = hora < 6 || hora > 22;
    
    if (estado.energia < 20) return { cara: '💤', texto: 'Chokurei está profundamente dormido. No lo despiertes.' };
    if (estado.hambre < 25) return { cara: '😾', texto: '¡Alerta roja! El plato está vacío y hay riesgo de motín.' };
    if (estado.diversion < 25) return { cara: '😼', texto: 'Modo caza activado. Tus tobillos están en peligro.' };
    if (esDeNoche && estado.energia > 80) return { cara: '👁️', texto: '¡Zoomies nocturnos! Corriendo a la velocidad de la luz.' };
    
    const promedio = (estado.hambre + estado.diversion + estado.carino) / 3;
    if (promedio > 85) return { cara: '😻', texto: 'Un gatito feliz, panzón y satisfecho.' };
    return { cara: '😺', texto: 'Haciendo cosas de gato. Todo normal.' };
}

function renderMascota(dbData){
    const cont = document.getElementById('contenido-mascota');
    if (!dbData) dbData = {};

    // Cálculos dinámicos
    const estado = {
        hambre: valorConDecaimiento(dbData.hambre ?? 100, dbData.hambreAct, DECAY.hambre),
        diversion: valorConDecaimiento(dbData.diversion ?? 100, dbData.diversionAct, DECAY.diversion),
        carino: valorConDecaimiento(dbData.carino ?? 100, dbData.carinoAct, DECAY.carino),
        energia: valorConDecaimiento(dbData.energia ?? 100, dbData.energiaAct, DECAY.energia)
    };
    
    const xp = dbData.xp || 0;
    const nivel = calcularNivel(xp);
    const animo = obtenerEstado(estado);
    const historial = (dbData.historial || []).slice(-6).reverse();

    cont.innerHTML = `
        <div class="panel texto-centro" style="position: relative;">
            <div style="position: absolute; top: 10px; right: 10px; font-weight: bold; color: var(--acento);">Nivel ${nivel}</div>
            <div id="cara-chokurei" class="escena-jardin" style="font-size: 4rem; transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);">
                ${animo.cara}
            </div>
            <div class="texto-fuerte" style="margin-bottom:2px;">Chokurei</div>
            <div class="texto-tenue" style="font-style: italic; font-size: 0.85rem; margin-bottom:14px; min-height: 20px;">
                "${animo.texto}"
            </div>
            
            ${['hambre', 'diversion', 'carino', 'energia'].map(stat => `
                <div class="medidor-jardin">
                    <div style="display:flex; justify-content:space-between; font-size:0.75rem; margin-bottom:3px; text-transform: capitalize;">
                        <span>${stat === 'energia' ? '⚡' : stat === 'hambre' ? '🐟' : stat === 'diversion' ? '🧶' : '🖐️'} ${stat}</span>
                        <span>${estado[stat]}%</span>
                    </div>
                    <div class="barra-medidor">
                        <div class="relleno-medidor" style="width:${estado[stat]}%; 
                        background:${stat === 'energia' ? '#f1c40f' : stat === 'hambre' ? 'var(--agua)' : stat === 'diversion' ? 'var(--sol)' : 'linear-gradient(90deg,var(--rosa),var(--lila))'}; 
                        transition: width 0.8s ease-out;"></div>
                    </div>
                </div>
            `).join('')}
        </div>

        <div class="btn-fila" style="margin-bottom:14px; gap: 8px; display: flex; justify-content: center; flex-wrap: wrap;">
            <button class="btn-secundario" onclick="cuidarMascota('hambre')">Alimentar 🐟</button>
            <button class="btn-secundario" onclick="cuidarMascota('diversion')">Jugar 🧶</button>
            <button class="btn-secundario" onclick="cuidarMascota('carino')">Mimar 🖐️</button>
            <button class="btn-secundario" onclick="cuidarMascota('dormir')">Hacer dormir 🌙</button>
        </div>

        <div class="panel historial-kaizen" style="font-size: 0.85rem; line-height: 1.4; max-height: 150px; overflow-y: auto;">
            ${historial.length
                ? historial.map(h => `<strong>${h.autor}</strong> ${h.accion}`).join('<hr style="margin: 4px 0; opacity: 0.2;">')
                : 'Diario de a bordo: Nadie me ha hecho caso hoy.'}
        </div>
    `;
}

async function cuidarMascota(accionStr){
    if (typeof vibrarJ === 'function') vibrarJ(15);
    
    // Animación de impacto en la interfaz
    const caraUI = document.getElementById('cara-chokurei');
    if (caraUI) {
        caraUI.style.transform = "scale(1.4) rotate(" + (Math.random() > 0.5 ? 10 : -10) + "deg)";
        setTimeout(() => caraUI.style.transform = "scale(1) rotate(0deg)", 250);
    }

    const snap = await new Promise(res => { const u = window.onSnapshot(refMascota(), s => { u(); res(s); }); });
    const dbData = snap.exists() ? snap.data() : {};
    const ahora = Date.now();
    
    let textoElegido = "";
    let xpGanada = 0;
    const actualizacion = { [accionStr + 'Act']: ahora };

    if (accionStr === 'dormir') {
        const energiaActual = valorConDecaimiento(dbData.energia ?? 100, dbData.energiaAct, DECAY.energia);
        actualizacion.energia = Math.min(100, energiaActual + 50);
        textoElegido = "le preparó su camita y lo arropó 🌙";
        xpGanada = 5;
    } else {
        const valorActual = valorConDecaimiento(dbData[accionStr] ?? 100, dbData[accionStr + 'Act'], DECAY[accionStr]);
        const rand = Math.random();
        
        // Mecánica de Empacho/Rechazo (Si intentas llenarlo cuando ya está lleno)
        if (valorActual > 85 && rand > 0.3) {
            actualizacion[accionStr] = valorActual - 15; // ¡Castigo por sobreestimular!
            textoElegido = DICCIONARIO[accionStr].fallo[0];
            xpGanada = 0;
        } 
        // Mecánica de Golpe Crítico (15% probabilidad)
        else if (rand > 0.85) {
            actualizacion[accionStr] = Math.min(100, valorActual + 50);
            textoElegido = DICCIONARIO[accionStr].critico[0];
            xpGanada = 25;
        } 
        // Éxito Normal
        else {
            actualizacion[accionStr] = Math.min(100, valorActual + 25 + Math.floor(Math.random() * 10));
            const opciones = DICCIONARIO[accionStr].normal;
            textoElegido = opciones[Math.floor(Math.random() * opciones.length)];
            xpGanada = 10;
        }
    }

    // Actualizar XP y consumos secundarios (ej: jugar baja energía y da hambre)
    actualizacion.xp = (dbData.xp || 0) + xpGanada;
    if (accionStr === 'diversion' && xpGanada > 0) {
        actualizacion.energia = Math.max(0, valorConDecaimiento(dbData.energia ?? 100, dbData.energiaAct, DECAY.energia) - 15);
        actualizacion.hambre = Math.max(0, valorConDecaimiento(dbData.hambre ?? 100, dbData.hambreAct, DECAY.hambre) - 10);
        actualizacion.energiaAct = ahora;
        actualizacion.hambreAct = ahora;
    }

    const nuevoRegistro = { 
        accion: textoElegido + (xpGanada > 0 ? ` (+${xpGanada} XP)` : ''),
        autor: typeof miIdentidad !== 'undefined' ? miIdentidad : 'Jugador', 
        timestamp: ahora 
    };
    
    actualizacion.historial = [...(dbData.historial || []), nuevoRegistro].slice(-20);

    await window.setDoc(refMascota(), actualizacion, { merge: true });
}
