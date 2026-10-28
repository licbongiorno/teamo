// ==================== MASCOTA VIRTUAL (Chokurei) ====================
// Tamagotchi cooperativo: 4 necesidades que decaen con el tiempo real,
// comida variada, nivel/XP con etapas de vida (bebé → joven → adulto),
// estados de ánimo, enfermedad por abandono prolongado, cumpleaños anual
// y fiestas. Los dos cuidan a la misma mascota.
//
// Chokurei ahora es un personaje animado (js/juegos/chokurei-rig.js)
// que vive en una habitación: camina, se lava, bosteza, se duerme de
// noche, persigue mariposas, sigue tu dedo con la mirada, y reacciona a
// todo lo que le hacen:
//  - Comer: arrastrá la comida hasta él (o tocala) y la va a comer.
//  - Jugar: puntero láser — mové el dedo por la habitación y lo persigue.
//  - Mimos: acaricialo con el dedo: cierra los ojos, ronronea, corazones.
//  - Baño: frotalo con la esponja hasta llenarlo de espuma, se enjuaga y
//    se sacude.
//  - Dormir: apaga la luz y se va a su camita.
// Cuando el otro lo cuida desde su celular, en el tuyo se ve la misma
// animación. Además hay una rutina diaria (comer, jugar, mimos y baño)
// que, completa entre los dos, suma racha de días y puntos.
//
// La habitación se arma UNA vez; los cambios de Firestore sólo actualizan
// los medidores y el ánimo (antes se rehacía todo el HTML y no podía
// haber animaciones continuas).
const DECAY_HAMBRE = 5;    // % por hora real
const DECAY_DIVERSION = 4;
const DECAY_CARINO = 3;
const DECAY_HIGIENE = 2;
const HORAS_PARA_ENFERMAR = 10; // horas seguidas con una necesidad en 0

const COMIDAS_CHOKUREI = [
    { id: 'pescado', nombre: 'Pescado', emoji: '🐟', costo: 0, efectos: { hambre: 35 } },
    { id: 'torta',   nombre: 'Torta',   emoji: '🍰', costo: 5, efectos: { hambre: 40, diversion: 20, higiene: -10 } },
    { id: 'salmon',  nombre: 'Salmón premium', emoji: '🍣', costo: 8, efectos: { hambre: 50, carino: 10 } },
];

const ETAPAS_CHOKUREI = [
    { nivelDesde: 1, id: 'bebe',   nombre: 'bebé' },
    { nivelDesde: 3, id: 'joven',  nombre: 'joven' },
    { nivelDesde: 6, id: 'adulto', nombre: 'adulto' },
];
// Accesorios que va ganando con los niveles (se acumulan).
const ACCESORIOS_CHOKUREI = [
    { nivelDesde: 3, id: 'mono',     nombre: 'moño 🎀' },
    { nivelDesde: 6, id: 'corona',   nombre: 'corona 👑' },
    { nivelDesde: 9, id: 'anteojos', nombre: 'anteojos de sol 🕶️' },
];
const RUTINA_CHOKUREI = [
    { id: 'comer', emoji: '🐟', nombre: 'Comer' },
    { id: 'jugar', emoji: '🧶', nombre: 'Jugar' },
    { id: 'mimos', emoji: '🖐️', nombre: 'Mimos' },
    { id: 'banio', emoji: '🧼', nombre: 'Baño' },
];

function refMascota(){ return window.doc(window.db, 'juegos', 'mascota'); }

let _ck = null;                 // el personaje animado
let _estadoMascota = {};        // último documento recibido
let _derivadoMascota = null;    // necesidades/ánimo calculados
let _modoMascota = null;        // null | 'laser' | 'banio'
let _ultimoHistorialVisto = null;
let _despiertoHastaMascota = 0; // si lo despertaron de noche, no se vuelve a dormir enseguida
let _regaloEvaluadoEstaVisita = false;
let _nivelVistoMascota = null;

function iniciarMascota(){
    _regaloEvaluadoEstaVisita = false;
    _ultimoHistorialVisto = null;
    _nivelVistoMascota = null;
    _modoMascota = null;
    if (window._unsubMascota) window._unsubMascota();
    window._unsubMascota = window.onSnapshot(refMascota(), (snap) => {
        renderMascota(snap.exists() ? snap.data() : {});
    }, (err) => {
        console.error('Error de Firestore en mascota:', err);
        document.getElementById('contenido-mascota').innerHTML = `<div class="panel texto-centro texto-tenue">⚠️ No se pudo conectar (${err.code || 'error'}).</div>`;
    });
    if (window._unsubPuntosMascota) window._unsubPuntosMascota();
    window._unsubPuntosMascota = window.escucharPuntos((p) => { window._puntosMascota = p; _actualizarPuntosMascota(); });
    // Al cerrar el juego, navegacion.js corta todo lo que empieza con _unsub:
    // así también se frenan la habitación y el personaje.
    window._unsubEscenaMascota = () => { _desarmarEscenaMascota(); };
}

function valorConDecaimiento(valorGuardado, actualizadoEn, decayPorHora){
    if (valorGuardado == null) return 100;
    const horas = (ahoraSync() - (actualizadoEn || ahoraSync())) / 3600000;
    return Math.max(0, Math.round(valorGuardado - horas * decayPorHora));
}

// Hace cuánto que una necesidad está clavada en 0 (para la enfermedad).
// Se reconstruye el momento en el que el valor cruzó el cero a partir
// del último valor guardado y su velocidad de caída.
function horasEnCero(valorGuardado, actualizadoEn, decayPorHora){
    if (valorGuardado == null || !actualizadoEn) return 0;
    const horasHastaCero = valorGuardado / decayPorHora;
    const momentoCero = actualizadoEn + horasHastaCero * 3600000;
    return Math.max(0, (ahoraSync() - momentoCero) / 3600000);
}

function haceCuanto(ms){
    if (!ms) return '';
    const minutos = Math.floor((ahoraSync() - ms) / 60000);
    if (minutos < 1) return 'recién';
    if (minutos < 60) return `hace ${minutos} min`;
    const horas = Math.floor(minutos / 60);
    if (horas < 24) return `hace ${horas} h`;
    const dias = Math.floor(horas / 24);
    return `hace ${dias} día${dias === 1 ? '' : 's'}`;
}

function fechaISO(d){ return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }

function etapaDeNivel(nivel){
    let etapa = ETAPAS_CHOKUREI[0];
    for (const e of ETAPAS_CHOKUREI) if (nivel >= e.nivelDesde) etapa = e;
    return etapa;
}

function _momentoDelDia(){
    const h = new Date().getHours();
    return (h >= 21 || h < 7) ? 'noche' : (h >= 18 ? 'tarde' : 'dia');
}

// Todo lo que se calcula a partir del documento.
function _derivarMascota(estado){
    const hambre = valorConDecaimiento(estado.hambre ?? 100, estado.hambreActualizada, DECAY_HAMBRE);
    const diversion = valorConDecaimiento(estado.diversion ?? 100, estado.diversionActualizada, DECAY_DIVERSION);
    const carino = valorConDecaimiento(estado.carino ?? 100, estado.carinoActualizada, DECAY_CARINO);
    const higiene = valorConDecaimiento(estado.higiene ?? 100, estado.higieneActualizada, DECAY_HIGIENE);
    const promedio = (hambre + diversion + carino + higiene) / 4;
    const minimo = Math.min(hambre, diversion, carino, higiene);
    const enferma = [
        horasEnCero(estado.hambre ?? 100, estado.hambreActualizada, DECAY_HAMBRE),
        horasEnCero(estado.diversion ?? 100, estado.diversionActualizada, DECAY_DIVERSION),
        horasEnCero(estado.carino ?? 100, estado.carinoActualizada, DECAY_CARINO),
        horasEnCero(estado.higiene ?? 100, estado.higieneActualizada, DECAY_HIGIENE),
    ].some(h => h >= HORAS_PARA_ENFERMAR);
    const fiestaActiva = !!(estado.fiestaHasta && estado.fiestaHasta > ahoraSync());
    const xp = estado.xp || 0;
    const nivel = Math.floor(xp / 50) + 1;
    let mood = { id: 'contento', emoji: '😺', msg: 'Chokurei está tranquilo.' };
    if (fiestaActiva) mood = { id: 'fiesta', emoji: '🥳', msg: '¡Chokurei está de fiesta!' };
    else if (enferma) mood = { id: 'enferma', emoji: '🤒', msg: 'Chokurei no se siente bien. Necesita medicina 💊.' };
    else if (promedio < 20) mood = { id: 'deprimido', emoji: '😭', msg: 'Chokurei está pasando un momento difícil. Mimos y juego lo van a ayudar 💜.' };
    else if (minimo < 30 || promedio < 45) mood = { id: 'triste', emoji: '😿', msg: 'Chokurei extraña más atención.' };
    else if (promedio > 88) mood = { id: 'feliz', emoji: '😻', msg: '¡Chokurei está feliz de la vida!' };
    const hoy = new Date();
    const nacimiento = new Date(estado.nacioEn || ahoraSync());
    const esCumple = hoy.getMonth() === nacimiento.getMonth() && hoy.getDate() === nacimiento.getDate();
    return {
        hambre, diversion, carino, higiene, promedio, minimo, enferma, fiestaActiva, xp, nivel, xpEnNivel: xp % 50,
        etapa: etapaDeNivel(nivel), accesorios: ACCESORIOS_CHOKUREI.filter(a => nivel >= a.nivelDesde).map(a => a.id), mood,
        esCumple, yaFestejadoHoy: estado.ultimoCumpleFestejado === fechaISO(hoy),
        edadDias: Math.floor((ahoraSync() - (estado.nacioEn || ahoraSync())) / 86400000),
        rutinaHoy: estado.rutina && estado.rutina.fecha === fechaISO(hoy) ? estado.rutina : { hechos: {} },
        racha: estado.rachaDias || { n: 0 },
    };
}

function renderMascota(estado){
    // Primera vez que alguien abre a Chokurei: queda registrado su "nacimiento"
    // para festejarle el cumpleaños todos los años.
    if (!estado.nacioEn) {
        const ahora = ahoraSync();
        window.setDoc(refMascota(), { nacioEn: ahora }, { merge: true });
        estado = { ...estado, nacioEn: ahora };
    }
    _estadoMascota = estado;
    const d = _derivarMascota(estado);
    _derivadoMascota = d;

    // Regalito aleatorio: se sortea una sola vez por visita, como mucho cada 3 horas.
    if (!_regaloEvaluadoEstaVisita) {
        _regaloEvaluadoEstaVisita = true;
        const puedeHaberRegalo = !estado.ultimoRegalo || (ahoraSync() - estado.ultimoRegalo) > 3 * 3600000;
        window._hayRegaloMascota = puedeHaberRegalo && Math.random() < 0.18;
    }

    if (!_ck || !document.body.contains(_ck.actor)) _armarEscenaMascota();
    _actualizarEscenaMascota(d, estado);
    _reaccionarAlHistorial(estado);
    // Subió de nivel (lo vea quien lo vea): animación de evolución.
    if (_nivelVistoMascota !== null && d.nivel > _nivelVistoMascota) {
        _ck.evolucionar();
        const nuevos = ACCESORIOS_CHOKUREI.filter(a => a.nivelDesde === d.nivel);
        _ck.decir(nuevos.length ? `¡Nivel ${d.nivel}! Gané ${nuevos[0].nombre}` : `¡Nivel ${d.nivel}! ✨`, 3000);
    }
    _nivelVistoMascota = d.nivel;
}

// ==================== LA HABITACIÓN ====================
function _armarEscenaMascota(){
    _desarmarEscenaMascota();
    const cont = document.getElementById('contenido-mascota');
    const estrellas = Array.from({ length: 7 }, () => `<i class="ck-estrella" style="left:${8 + Math.random() * 84}%; top:${8 + Math.random() * 70}%; animation-delay:${Math.random() * 2}s"></i>`).join('');
    cont.innerHTML = `
        <div id="ck-banner"></div>
        <div class="ck-habitacion" id="ck-habitacion" data-momento="${_momentoDelDia()}">
            <div class="ck-ventana"><div class="ck-astro"></div><div class="ck-nube"></div>${estrellas}</div>
            <div class="ck-cuadro">🐾</div>
            <div class="ck-zocalo"></div>
            <div class="ck-piso"></div>
            <div class="ck-alfombra"></div>
            <div class="ck-cama"></div>
            <div class="ck-planta">🪴</div>
            <div class="ck-plato"><span class="comida" id="ck-plato-comida"></span></div>
            <div class="ck-hud"><span class="ck-chip" id="ck-chip-nivel"></span><span class="ck-chip" id="ck-chip-racha"></span></div>
            <div class="ck-oscuro"></div>
            <div class="ck-capa" id="ck-capa"></div>
        </div>
        <div class="ck-bandeja">
            <span class="texto-tenue">Arrastrá la comida 👉</span>
            <button class="ck-comida" data-comida="pescado">🐟<small>gratis</small></button>
            <button class="ck-comida" data-comida="torta">🍰<small>5 ⭐</small></button>
            <button class="ck-comida" data-comida="salmon">🍣<small>8 ⭐</small></button>
        </div>
        <div class="texto-centro" style="margin:0 0 10px; font-size:0.85rem;" id="ck-animo"></div>
        <div class="barra-progreso-jardin" id="ck-xp" style="margin-bottom:12px;"><div class="relleno-progreso-jardin"></div></div>
        <div class="ck-medidores">
            ${[['hambre', '🐟', 'Hambre', '#8fd3ff'], ['diversion', '🧶', 'Diversión', '#ffd166'], ['carino', '💜', 'Cariño', '#ff9ec4'], ['higiene', '🫧', 'Higiene', '#a8edea']]
                .map(([id, e, n, c]) => `<div class="ck-medidor"><div class="ck-anillo" id="ck-anillo-${id}" style="--c:${c}"><span>${e}</span></div><span>${n} <b id="ck-valor-${id}"></b></span></div>`).join('')}
        </div>
        <div class="ck-acciones">
            <button class="ck-boton" onclick="darComidaMascota('pescado')"><b>🐟</b>Comer</button>
            <button class="ck-boton" onclick="empezarLaserMascota()"><b>🔴</b>Láser</button>
            <button class="ck-boton" onclick="mimarMascota()"><b>🖐️</b>Mimos</button>
            <button class="ck-boton" onclick="empezarBanioMascota()"><b>🧼</b>Baño</button>
            <button class="ck-boton" id="ck-boton-dormir" onclick="alternarSuenoMascota()"><b>💤</b>Dormir</button>
            <button class="ck-boton" id="ck-boton-medicina" onclick="darMedicinaMascota()" style="display:none;"><b>💊</b>Medicina</button>
            <button class="ck-boton" id="ck-boton-pelaje" onclick="alternarPelajesMascota()"><b>🎨</b>Pelaje</button>
        </div>
        <div id="ck-pelajes"></div>
        <div class="panel">
            <div style="display:flex; align-items:center; gap:10px;">
                <div style="flex:1; font-size:0.85rem;">🎉 Hacerle una fiesta<div class="texto-tenue">Llena todo al 100% por 2 horas · tenés <b id="ck-puntos">0</b> ⭐</div></div>
                <button class="ck-boton" style="width:auto; padding:8px 14px;" onclick="hacerFiestaMascota()"><b>🎉</b>15 ⭐</button>
            </div>
        </div>
        <div class="panel">
            <div style="display:flex; justify-content:space-between; font-size:0.85rem;"><b>📋 Rutina de hoy</b><span id="ck-racha-texto"></span></div>
            <div class="ck-rutina" id="ck-rutina"></div>
            <div class="texto-tenue" style="margin-top:6px; font-size:0.72rem;">Hagan las 4 entre los dos y suman racha + 5 puntos cada uno.</div>
        </div>
        <div class="panel historial-kaizen" id="ck-historial"></div>`;

    const hab = document.getElementById('ck-habitacion');
    _ck = crearChokurei(hab);
    _ck.ponerX(45);
    _prepararInteraccionesMascota(hab);
    _cicloVidaMascota();
    _actualizarPuntosMascota();
}

function _desarmarEscenaMascota(){
    clearTimeout(window._timerVidaMascota);
    if (window._pararModoMascota) { window._pararModoMascota(); window._pararModoMascota = null; }
    _modoMascota = null;
    if (_ck) { _ck.destruir(); _ck = null; }
}

function _actualizarEscenaMascota(d, estado){
    if (!_ck) return;
    _ck.estilo(estado.pelaje || 'negro', d.etapa.id, d.accesorios);
    if (!_modoMascota) _ck.animo(d.mood.id, { higiene: d.higiene });
    const hab = document.getElementById('ck-habitacion');
    if (hab) hab.dataset.momento = _momentoDelDia();
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.innerHTML = v; };
    set('ck-chip-nivel', `Nv ${d.nivel} · ${d.etapa.nombre}`);
    set('ck-chip-racha', d.racha.n ? `🔥 ${d.racha.n} día${d.racha.n === 1 ? '' : 's'}` : `${d.edadDias} días con nosotros`);
    set('ck-animo', `${d.mood.emoji} ${d.mood.msg}`);
    const xp = document.querySelector('#ck-xp .relleno-progreso-jardin');
    if (xp) xp.style.width = (d.xpEnNivel / 50 * 100) + '%';
    for (const k of ['hambre', 'diversion', 'carino', 'higiene']) {
        const an = document.getElementById('ck-anillo-' + k);
        if (an) { an.style.setProperty('--v', d[k]); an.classList.toggle('bajo', d[k] < 30); }
        set('ck-valor-' + k, d[k] + '%');
    }
    const med = document.getElementById('ck-boton-medicina');
    if (med) { med.style.display = d.enferma ? '' : 'none'; med.classList.toggle('destacado', d.enferma); }
    // Rutina del día
    set('ck-rutina', RUTINA_CHOKUREI.map(r => `<span class="${d.rutinaHoy.hechos?.[r.id] ? 'hecho' : ''}">${d.rutinaHoy.hechos?.[r.id] ? '✅' : r.emoji} ${r.nombre}</span>`).join(''));
    set('ck-racha-texto', d.racha.n ? `🔥 racha de ${d.racha.n} día${d.racha.n === 1 ? '' : 's'}` : '');
    // Cumpleaños / regalo
    let banner = '';
    if (d.esCumple && !d.yaFestejadoHoy) {
        banner = `<div class="chokurei-banner-cumple"><div style="font-size:1.8rem;">🎂🎉</div>
            <div style="font-weight:bold; margin:4px 0;">¡Feliz cumpleaños, Chokurei!</div>
            <button class="btn-principal" onclick="festejarCumpleMascota()">Festejar 🎂</button></div>`;
    }
    set('ck-banner', banner);
    if (window._hayRegaloMascota && hab && !hab.querySelector('.ck-regalo')) {
        const r = document.createElement('div');
        r.className = 'ck-regalo'; r.textContent = '🎁';
        r.onclick = (e) => { e.stopPropagation(); reclamarRegaloMascota(r); };
        hab.appendChild(r);
    }
    const historial = (estado.historial || []).slice(-6).reverse();
    set('ck-historial', historial.length ? historial.map(h => `${nombreJugador(h.autor)} ${h.detalle} ${haceCuanto(h.timestamp)}`).join('<br>') : 'Todavía nadie cuidó a Chokurei hoy.');
    const dormir = document.getElementById('ck-boton-dormir');
    if (dormir) dormir.innerHTML = _ck.dormido ? '<b>☀️</b>Despertar' : '<b>💤</b>Dormir';
}

function _actualizarPuntosMascota(){
    const el = document.getElementById('ck-puntos');
    if (el) el.textContent = (window._puntosMascota || {})[miIdentidad] || 0;
}

// Cuando el OTRO cuida a Chokurei, en este celular se ve la animación.
function _reaccionarAlHistorial(estado){
    const ultimo = (estado.historial || []).slice(-1)[0];
    if (!ultimo) return;
    const primeraVez = _ultimoHistorialVisto === null;
    if (!primeraVez && ultimo.timestamp > _ultimoHistorialVisto && ultimo.autor !== miIdentidad && _ck && !_modoMascota) {
        const det = ultimo.detalle || '';
        if (/le dio medicina/.test(det)) _ck.alegrarse();
        else if (/le dio/.test(det)) { _llenarPlato(COMIDAS_CHOKUREI.find(c => det.includes(c.nombre.toLowerCase()))?.emoji || '🐟'); _ck.comer().then(_vaciarPlato); }
        else if (/jugó/.test(det)) _ck.jugarCon();
        else if (/mimos/.test(det)) _ck.ronronear(2);
        else if (/bañó/.test(det)) _ck.sacudirse();
        else if (/fiesta|cumpleaños/.test(det)) { _ck.bailar(); if (window.fx) window.fx.confeti(); }
        if (typeof mostrarCartelEnVivo === 'function') mostrarCartelEnVivo({ titulo: `🐱 ${nombreJugador(ultimo.autor)} ${det}`, duracion: 3000 });
    }
    _ultimoHistorialVisto = Math.max(_ultimoHistorialVisto || 0, ultimo.timestamp || 0);
}

// ==================== VIDA PROPIA ====================
// Cada pocos segundos Chokurei hace algo solo, según cómo está.
function _cicloVidaMascota(){
    clearTimeout(window._timerVidaMascota);
    window._timerVidaMascota = setTimeout(async () => {
        if (!_ck || !document.body.contains(_ck.actor)) return;
        const d = _derivadoMascota;
        const hab = document.getElementById('ck-habitacion');
        const luces = hab && hab.classList.contains('luces-apagadas');
        if (!_modoMascota && !_ck.ocupado && d) {
            _ck.animo(d.mood.id, { higiene: d.higiene }); // vuelve a la cara de su ánimo
            const deNoche = _momentoDelDia() === 'noche';
            if (_ck.dormido) {
                if (!luces && !deNoche && Math.random() < 0.3) { await _ck.despertar(); _ck.estirarse(); }
            } else if ((luces || (deNoche && Date.now() > _despiertoHastaMascota)) && Math.random() < 0.6) {
                await _ck.bostezar(); await _ck.dormir(); _actualizarEscenaMascota(d, _estadoMascota);
            } else {
                _comportamientoMascota(d);
            }
        }
        _cicloVidaMascota();
    }, 3500 + Math.random() * 4500);
}

function _comportamientoMascota(d){
    const ck = _ck;
    const r = Math.random();
    if (d.mood.id === 'enferma') { if (r < 0.5) ck.tiritar(); else ck.decir('No me siento bien… 🤒', 2200); return; }
    if (d.mood.id === 'fiesta' && r < 0.5) { ck.bailar(); return; }
    // Necesidades: avisa lo que le falta.
    if (d.hambre < 35 && r < 0.45) { ck.caminarA(76).then(() => ck.maullar('Tengo hambre 🐟')); return; }
    if (d.higiene < 15 && r < 0.4) { ck.particula('🪰', { dx: 40, dy: -30, dur: 2200 }); ck.decir('Necesito un baño… 🫧', 2000); return; }
    if (d.carino < 35 && r < 0.4) { ck.decir(['Te extrañé… 🥺', '¿Mimos? 🖐️', 'Prrr…?'][Math.floor(Math.random() * 3)], 2200); return; }
    if (d.diversion < 35 && r < 0.4) { ck.decir('¡Estoy aburrido! 🔴', 2000); return; }
    if (d.mood.id === 'triste' || d.mood.id === 'deprimido') { if (r < 0.5) ck.caminarA(20 + Math.random() * 20); return; }
    // Contento: un poco de todo.
    if (r < 0.32) ck.caminarA(15 + Math.random() * 70);
    else if (r < 0.46) ck.lavarse();
    else if (r < 0.56) ck.estirarse();
    else if (r < 0.64) ck.bostezar();
    else if (r < 0.74) _mariposaMascota();
    else if (r < 0.82) ck.maullar();
    else if (d.mood.id === 'feliz' && r < 0.92) ck.alegrarse();
}

// Una mariposa cruza la habitación y Chokurei la persigue.
function _mariposaMascota(){
    const hab = document.getElementById('ck-habitacion');
    if (!hab || !_ck) return;
    const m = document.createElement('div');
    m.className = 'ck-mariposa'; m.textContent = '🦋';
    hab.appendChild(m);
    const desdeIzq = Math.random() < 0.5;
    let pos = { x: desdeIzq ? -5 : 105, y: 45 };
    const parar = _ck.seguir(() => pos.x);
    const inicio = performance.now();
    (function volar(t){
        const k = (t - inicio) / 5000;
        pos = { x: desdeIzq ? -5 + k * 110 : 105 - k * 110, y: 40 + Math.sin(k * 18) * 12 };
        m.style.left = pos.x + '%'; m.style.top = pos.y + '%';
        if (k < 1 && _ck) requestAnimationFrame(volar);
        else { m.remove(); parar(); if (_ck && Math.random() < 0.5) _ck.saltar(28); }
    })(inicio);
}

// ==================== INTERACCIONES CON EL DEDO ====================
function _prepararInteraccionesMascota(hab){
    const actor = _ck.actor;
    // Tocar y acariciar: si casi no se movió el dedo es un toque; si se
    // frota, son mimos (corazones donde pasa el dedo, ronroneo, y al
    // juntar suficientes caricias cuenta como "mimos" de verdad).
    let apoyado = false, recorrido = 0, ultimo = null, ronroneando = false, corazonCada = 0, tocadasSeguidas = 0, ultimaTocada = 0;
    actor.addEventListener('pointerdown', (e) => {
        if (_modoMascota) return;
        apoyado = true; recorrido = 0; ultimo = { x: e.clientX, y: e.clientY };
        actor.setPointerCapture?.(e.pointerId);
    });
    actor.addEventListener('pointermove', (e) => {
        if (!apoyado || _modoMascota) return;
        const dd = Math.hypot(e.clientX - ultimo.x, e.clientY - ultimo.y);
        ultimo = { x: e.clientX, y: e.clientY };
        recorrido += dd; corazonCada += dd;
        if (recorrido > 60 && !ronroneando && !_ck.dormido) { ronroneando = true; _ck.ronronear(2.2).then(() => { ronroneando = false; }); }
        if (corazonCada > 45) {
            corazonCada = 0;
            const rc = hab.getBoundingClientRect();
            const p = document.createElement('div');
            p.className = 'ck-particula'; p.textContent = Math.random() < 0.7 ? '💜' : '💕';
            p.style.left = (e.clientX - rc.left) + 'px'; p.style.top = (e.clientY - rc.top) + 'px';
            hab.appendChild(p);
            p.animate([{ transform: 'translate(-50%,-50%) scale(0.5)', opacity: 1 }, { transform: 'translate(-50%,-160%) scale(1.1)', opacity: 0 }], { duration: 900 }).finished.then(() => p.remove());
        }
        if (recorrido > 900) { recorrido = -100000; mimarMascota(true); }
    });
    const soltar = () => {
        if (!apoyado) return;
        apoyado = false;
        if (recorrido >= 0 && recorrido < 12) {
            // Un toque.
            const ahora = Date.now();
            tocadasSeguidas = ahora - ultimaTocada < 900 ? tocadasSeguidas + 1 : 1;
            ultimaTocada = ahora;
            vibrarJ(8);
            if (_ck.dormido) { _despiertoHastaMascota = Date.now() + 10 * 60000; _ck.despertar().then(() => _ck.maullar('😾 ¡Estaba durmiendo!')); _actualizarEscenaMascota(_derivadoMascota, _estadoMascota); }
            else if (tocadasSeguidas >= 7) { tocadasSeguidas = 0; _ck.animo('triste'); _ck.maullar('¡Basta! 😾'); setTimeout(() => _ck && _ck.animo(_derivadoMascota.mood.id, { higiene: _derivadoMascota.higiene }), 2500); }
            else { const r = Math.random(); if (r < 0.4) _ck.maullar(); else if (r < 0.7) _ck.alegrarse(); else _ck.saltar(); }
        }
    };
    actor.addEventListener('pointerup', soltar);
    actor.addEventListener('pointercancel', soltar);

    // Comida: arrastrar desde el botón hasta Chokurei (o tocar y vuela sola).
    document.querySelectorAll('#contenido-mascota [data-comida]').forEach(btn => {
        btn.addEventListener('pointerdown', (e) => _arrastrarComida(e, btn.dataset.comida, btn));
    });
}

function _arrastrarComida(e, comidaId, btn){
    if (_modoMascota) return;
    const item = COMIDAS_CHOKUREI.find(c => c.id === comidaId);
    if (!item) return;
    e.preventDefault();
    const fly = document.createElement('div');
    fly.className = 'ck-objeto-volando'; fly.textContent = item.emoji;
    fly.style.left = e.clientX + 'px'; fly.style.top = e.clientY + 'px';
    document.body.appendChild(fly);
    const inicio = { x: e.clientX, y: e.clientY };
    let movio = false;
    const mover = (ev) => { if (Math.hypot(ev.clientX - inicio.x, ev.clientY - inicio.y) > 8) movio = true; fly.style.left = ev.clientX + 'px'; fly.style.top = ev.clientY + 'px'; };
    const soltar = (ev) => {
        window.removeEventListener('pointermove', mover);
        window.removeEventListener('pointerup', soltar);
        window.removeEventListener('pointercancel', soltar);
        const hab = document.getElementById('ck-habitacion');
        const rh = hab ? hab.getBoundingClientRect() : null;
        const enHab = rh && ev.clientX >= rh.left && ev.clientX <= rh.right && ev.clientY >= rh.top && ev.clientY <= rh.bottom;
        if (movio && !enHab) { fly.remove(); return; } // lo soltó afuera: cancelado
        // Vuela hasta el plato.
        const plato = document.querySelector('.ck-plato');
        const rp = plato ? plato.getBoundingClientRect() : { left: ev.clientX, top: ev.clientY, width: 0 };
        fly.animate([{ left: fly.style.left, top: fly.style.top }, { left: (rp.left + rp.width / 2) + 'px', top: (rp.top - 4) + 'px' }], { duration: 380, easing: 'ease-in', fill: 'forwards' })
            .finished.then(() => { fly.remove(); darComidaMascota(comidaId); });
    };
    window.addEventListener('pointermove', mover);
    window.addEventListener('pointerup', soltar);
    window.addEventListener('pointercancel', soltar);
}

function _llenarPlato(emoji){ const c = document.getElementById('ck-plato-comida'); if (c) c.textContent = emoji; }
function _vaciarPlato(){ const c = document.getElementById('ck-plato-comida'); if (c) c.textContent = ''; }

// ==================== JUGAR: PUNTERO LÁSER ====================
function empezarLaserMascota(){
    if (_modoMascota || !_ck) return;
    vibrarJ(12);
    _modoMascota = 'laser';
    const hab = document.getElementById('ck-habitacion');
    const capa = document.getElementById('ck-capa');
    capa.classList.add('activa');
    capa.innerHTML = `<div class="ck-laser" style="left:70%; top:80%"></div><div class="ck-modo-texto">🔴 Mové el dedo: ¡que lo atrape! · <span id="ck-laser-n">0</span></div>`;
    const punto = capa.querySelector('.ck-laser');
    let objetivo = { x: 70, y: 80 }, atrapadas = 0, ultimaAtrapada = 0, tocando = false;
    const mover = (ev) => {
        const r = hab.getBoundingClientRect();
        objetivo = { x: Math.max(4, Math.min(96, (ev.clientX - r.left) / r.width * 100)), y: Math.max(8, Math.min(96, (ev.clientY - r.top) / r.height * 100)) };
        punto.style.left = objetivo.x + '%'; punto.style.top = objetivo.y + '%';
    };
    capa.onpointerdown = (ev) => { tocando = true; mover(ev); };
    capa.onpointermove = mover;
    capa.onpointerup = () => { tocando = false; };
    // Si nadie mueve el dedo, el láser se mueve solo, para que igual juegue.
    const auto = setInterval(() => {
        if (tocando) return;
        objetivo = { x: 12 + Math.random() * 76, y: 62 + Math.random() * 30 };
        punto.style.left = objetivo.x + '%'; punto.style.top = objetivo.y + '%';
    }, 1300);
    const parar = _ck.seguir(() => objetivo.x);
    const chequeo = setInterval(() => {
        if (!_ck) return;
        if (Math.abs(_ck.x - objetivo.x) < 5 && objetivo.y > 55 && Date.now() - ultimaAtrapada > 900) {
            ultimaAtrapada = Date.now();
            atrapadas++;
            const n = document.getElementById('ck-laser-n'); if (n) n.textContent = atrapadas;
            sonidosChokurei.atrapar(); vibrarJ(15);
            _ck.saltar(30); _ck.particula('💥', { dy: -30, dur: 700 });
            // Se escapa a otro lado.
            if (!tocando) { objetivo = { x: _ck.x > 50 ? 15 + Math.random() * 25 : 60 + Math.random() * 25, y: 70 + Math.random() * 22 }; punto.style.left = objetivo.x + '%'; punto.style.top = objetivo.y + '%'; }
        }
    }, 80);
    const fin = setTimeout(terminar, 15000);
    function terminar(){
        clearInterval(auto); clearInterval(chequeo); clearTimeout(fin); parar();
        capa.classList.remove('activa'); capa.innerHTML = ''; capa.onpointerdown = capa.onpointermove = capa.onpointerup = null;
        window._pararModoMascota = null;
        _modoMascota = null;
        if (!_ck) return;
        _ck.decir(atrapadas ? `¡Lo atrapé ${atrapadas} ${atrapadas === 1 ? 'vez' : 'veces'}! 😹` : '¡Casi! 😼', 2500);
        _ck.alegrarse();
        jugarConMascota(Math.min(60, 25 + atrapadas * 6), atrapadas);
    }
    window._pararModoMascota = () => { clearInterval(auto); clearInterval(chequeo); clearTimeout(fin); parar(); _modoMascota = null; };
}

// ==================== BAÑO CON ESPUMA ====================
function empezarBanioMascota(){
    if (_modoMascota || !_ck) return;
    vibrarJ(12);
    _modoMascota = 'banio';
    const hab = document.getElementById('ck-habitacion');
    const capa = document.getElementById('ck-capa');
    _ck.despertar();
    _ck.caminarA(50).then(() => { if (_ck) { _ck.animo('triste'); _ck.decir('😾 ¿Agua? ¿En serio?', 2200); } });
    capa.classList.add('activa');
    capa.innerHTML = `<div class="ck-esponja" style="left:80%; top:30%">🧽</div><div class="ck-modo-texto">🧽 Frotalo hasta llenarlo de espuma</div><div class="ck-barra-modo"><div></div></div>`;
    const esponja = capa.querySelector('.ck-esponja'), barra = capa.querySelector('.ck-barra-modo > div');
    const espumas = [];
    const META = 26;
    let apoyado = false, ultimo = null;
    capa.onpointerdown = (ev) => { apoyado = true; ultimo = { x: ev.clientX, y: ev.clientY }; mover(ev); };
    capa.onpointerup = () => { apoyado = false; };
    capa.onpointermove = mover;
    function mover(ev){
        const r = hab.getBoundingClientRect();
        esponja.style.left = (ev.clientX - r.left) + 'px'; esponja.style.top = (ev.clientY - r.top) + 'px';
        if (!apoyado || !_ck) return;
        if (Math.hypot(ev.clientX - ultimo.x, ev.clientY - ultimo.y) < 18) return;
        ultimo = { x: ev.clientX, y: ev.clientY };
        const ra = _ck.actor.getBoundingClientRect();
        if (ev.clientX < ra.left || ev.clientX > ra.right || ev.clientY < ra.top + ra.height * 0.15 || ev.clientY > ra.bottom) return;
        espumas.push(_ck.espuma(ev.clientX, ev.clientY));
        sonidosChokurei.burbuja();
        barra.style.width = Math.min(100, espumas.length / META * 100) + '%';
        if (espumas.length === META) enjuagar();
    }
    async function enjuagar(){
        capa.onpointerdown = capa.onpointermove = capa.onpointerup = null;
        capa.querySelector('.ck-modo-texto').textContent = '🚿 ¡A enjuagar!';
        esponja.remove();
        for (let i = 0; i < 26; i++) setTimeout(() => {
            const g = document.createElement('div'); g.className = 'ck-particula'; g.textContent = '💧';
            g.style.left = (30 + Math.random() * 40) + '%'; g.style.top = '0%'; hab.appendChild(g);
            g.animate([{ transform: 'translateY(0)', opacity: 1 }, { transform: `translateY(${hab.clientHeight * 0.8}px)`, opacity: 0.2 }], { duration: 700, easing: 'ease-in' }).finished.then(() => g.remove());
        }, i * 50);
        await new Promise(r => setTimeout(r, 900));
        espumas.forEach((b, i) => setTimeout(() => b.animate([{ opacity: 1 }, { opacity: 0, transform: 'translate(-50%,-50%) scale(1.6)' }], { duration: 250 }).finished.then(() => b.remove()), i * 25));
        await new Promise(r => setTimeout(r, 700));
        capa.classList.remove('activa'); capa.innerHTML = '';
        window._pararModoMascota = null;
        _modoMascota = null;
        banarMascota();
        if (!_ck) return;
        await _ck.sacudirse();
        _ck.decir('¡Brillante! ✨', 2000);
    }
    window._pararModoMascota = () => { espumas.forEach(b => b.remove()); _modoMascota = null; };
}

// ==================== DORMIR ====================
async function alternarSuenoMascota(){
    if (!_ck || _modoMascota) return;
    vibrarJ(10);
    const hab = document.getElementById('ck-habitacion');
    if (_ck.dormido || hab.classList.contains('luces-apagadas')) {
        hab.classList.remove('luces-apagadas');
        _despiertoHastaMascota = Date.now() + 15 * 60000;
        await _ck.despertar(); _ck.estirarse();
    } else {
        hab.classList.add('luces-apagadas');
        _ck.decir('Buenas noches 🌙', 1500);
        await _ck.bostezar(); await _ck.dormir();
    }
    if (_derivadoMascota) _actualizarEscenaMascota(_derivadoMascota, _estadoMascota);
}

function alternarPelajesMascota(){
    const cont = document.getElementById('ck-pelajes');
    if (!cont) return;
    if (cont.innerHTML) { cont.innerHTML = ''; return; }
    const actual = _estadoMascota.pelaje || 'negro';
    cont.innerHTML = `<div class="panel texto-centro"><div class="texto-tenue">¿De qué color es Chokurei?</div><div class="ck-pelajes">
        ${Object.entries(PELAJES_CHOKUREI).map(([id, p]) => `<button class="${id === actual ? 'elegido' : ''}" title="${p.nombre}" style="background:linear-gradient(135deg,${p.pelo} 55%,${p.puntas} 56%)" onclick="elegirPelajeMascota('${id}')"></button>`).join('')}
    </div></div>`;
}
async function elegirPelajeMascota(id){
    vibrarJ(10);
    document.getElementById('ck-pelajes').innerHTML = '';
    await window.setDoc(refMascota(), { pelaje: id }, { merge: true });
    if (_ck) _ck.alegrarse();
}

// ==================== ESCRITURAS (Firestore) ====================
// Aplica efectos a las 4 necesidades (piso 0, techo 100), suma XP,
// marca la rutina del día y deja constancia en el historial. Si con
// esto se completa la rutina, suma racha y puntos para los dos.
async function _aplicarCuidadoMascota(efectos, detalle, xpGanada, rutinaId){
    // Transacción: si los dos lo cuidaban casi a la vez, la acción de uno
    // pisaba la del otro.
    const ref = refMascota();
    const hoy = fechaISO(new Date());
    let completoRutina = false, subioNivel = null;
    await window.runTransaction(window.db, async (tx) => {
        completoRutina = false; subioNivel = null;
        const snap = await tx.get(ref);
        const estado = snap.exists() ? snap.data() : {};
        const ahora = ahoraSync();
        let xp = xpGanada;
        const actualizaciones = {};
        const decays = { hambre: DECAY_HAMBRE, diversion: DECAY_DIVERSION, carino: DECAY_CARINO, higiene: DECAY_HIGIENE };
        for (const campo of Object.keys(decays)) {
            const actual = valorConDecaimiento(estado[campo] ?? 100, estado[campo + 'Actualizada'], decays[campo]);
            const delta = efectos[campo] || 0;
            if (delta !== 0) {
                actualizaciones[campo] = Math.max(0, Math.min(100, actual + delta));
                actualizaciones[campo + 'Actualizada'] = ahora;
            }
        }
        const historial = [...(estado.historial || []), { detalle, autor: miIdentidad, timestamp: ahora }];
        if (rutinaId) {
            const rutina = estado.rutina && estado.rutina.fecha === hoy ? { ...estado.rutina, hechos: { ...estado.rutina.hechos } } : { fecha: hoy, hechos: {}, premiada: false };
            rutina.hechos[rutinaId] = true;
            if (!rutina.premiada && RUTINA_CHOKUREI.every(r => rutina.hechos[r.id])) {
                rutina.premiada = true;
                completoRutina = true;
                const ayer = fechaISO(new Date(Date.now() - 86400000));
                const previa = estado.rachaDias || { n: 0 };
                const n = previa.ultima === ayer ? (previa.n || 0) + 1 : previa.ultima === hoy ? previa.n || 1 : 1;
                actualizaciones.rachaDias = { n, ultima: hoy, mejor: Math.max(n, previa.mejor || 0) };
                xp += 20;
                historial.push({ detalle: `completó la rutina del día con Chokurei 📋 (racha de ${n})`, autor: miIdentidad, timestamp: ahora + 1 });
            }
            actualizaciones.rutina = rutina;
        }
        actualizaciones.xp = (estado.xp || 0) + xp;
        const nivelAntes = Math.floor((estado.xp || 0) / 50) + 1, nivelDespues = Math.floor(actualizaciones.xp / 50) + 1;
        if (nivelDespues > nivelAntes) {
            const eA = etapaDeNivel(nivelAntes), eD = etapaDeNivel(nivelDespues);
            subioNivel = eD.id !== eA.id ? `¡Chokurei creció y ahora es ${eD.nombre}! (nivel ${nivelDespues})` : `Chokurei subió a nivel ${nivelDespues} 🎉`;
            historial.push({ detalle: subioNivel, autor: miIdentidad, timestamp: ahora + 2 });
        }
        actualizaciones.historial = historial.slice(-15);
        tx.set(ref, actualizaciones, { merge: true });
    });
    if (subioNivel) {
        vibrarJ([15, 30, 15, 30, 60]);
        if (window.sfx) window.sfx.logro();
        if (window.fx) window.fx.confeti();
        if (typeof registrarEvento === 'function') registrarEvento('cuidado_compartido', subioNivel);
    }
    if (completoRutina) {
        if (window.sumarPuntos) { window.sumarPuntos('nico', 5); window.sumarPuntos('carito', 5); }
        if (window.fx) window.fx.confeti();
        if (window.sfx) window.sfx.logro();
        if (typeof mostrarCartelEnVivo === 'function') mostrarCartelEnVivo({ titulo: '📋 ¡Rutina completa!', sub: '+5 puntos para cada uno y un día más de racha 🔥', duracion: 4000 });
        if (typeof registrarEvento === 'function') registrarEvento('cuidado_compartido', 'Completaron la rutina del día de Chokurei');
    }
}

async function darComidaMascota(comidaId){
    const item = COMIDAS_CHOKUREI.find(c => c.id === comidaId);
    if (!item) return;
    vibrarJ(12);
    if (item.costo > 0) {
        const pagado = await _gastarPuntosMascota(item.costo);
        if (!pagado) {
            vibrarJ([10, 30, 10]); if (window.sfx) window.sfx.error();
            if (_ck) _ck.decir(`Faltan puntos para ${item.emoji} 🥺`, 2000);
            return;
        }
    }
    if (window.sfx) window.sfx.moneda();
    _llenarPlato(item.emoji);
    if (_ck) _ck.comer(item.emoji).then(_vaciarPlato);
    await _aplicarCuidadoMascota(item.efectos, `le dio ${item.nombre.toLowerCase()} a Chokurei`, 5, 'comer');
}

async function jugarConMascota(cuanto, atrapadas){
    vibrarJ(12);
    await _aplicarCuidadoMascota({ diversion: cuanto || 40 }, atrapadas ? `jugó al láser con Chokurei (lo atrapó ${atrapadas} veces)` : 'jugó con Chokurei', 5 + Math.min(10, atrapadas || 0), 'jugar');
}

// desdeCaricia: ya se hizo la animación frotándolo con el dedo.
let _ultimoMimoMascota = 0;
async function mimarMascota(desdeCaricia){
    vibrarJ(12);
    if (!desdeCaricia && _ck) {
        // Una manito que lo acaricia sola.
        const hab = document.getElementById('ck-habitacion');
        const mano = document.createElement('div');
        mano.className = 'ck-particula'; mano.textContent = '🖐️'; mano.style.fontSize = '2rem';
        const ra = _ck.actor.getBoundingClientRect(), rh = hab.getBoundingClientRect();
        mano.style.left = (ra.left - rh.left + ra.width / 2) + 'px'; mano.style.top = (ra.top - rh.top + ra.height * 0.18) + 'px';
        hab.appendChild(mano);
        mano.animate([{ transform: 'translate(-90%,-50%) rotate(-10deg)' }, { transform: 'translate(-10%,-30%) rotate(10deg)' }], { duration: 450, iterations: 4, direction: 'alternate' }).finished.then(() => mano.remove());
        _ck.ronronear(2);
    }
    // Las caricias con el dedo cuentan como mimos como mucho una vez por minuto.
    if (desdeCaricia && Date.now() - _ultimoMimoMascota < 60000) return;
    _ultimoMimoMascota = Date.now();
    await _aplicarCuidadoMascota({ carino: 40 }, 'le hizo mimos a Chokurei', 5, 'mimos');
}
async function banarMascota(){
    vibrarJ(12);
    await _aplicarCuidadoMascota({ higiene: 50 }, 'bañó a Chokurei', 5, 'banio');
}
async function darMedicinaMascota(){
    vibrarJ([15, 30, 15]);
    if (window.sfx) window.sfx.acierto();
    if (_ck) { _ck.particula('💊', { desde: 'boca', dy: -10, dur: 700 }); _ck.decir('Puaj… 😖 ¡Pero gracias!', 2200); setTimeout(() => _ck && _ck.alegrarse(), 1200); }
    const estado = await new Promise(res => { const u = window.onSnapshot(refMascota(), s => { u(); res(s.exists() ? s.data() : {}); }); });
    const decays = { hambre: DECAY_HAMBRE, diversion: DECAY_DIVERSION, carino: DECAY_CARINO, higiene: DECAY_HIGIENE };
    const efectos = {};
    for (const campo of Object.keys(decays)) {
        const actual = valorConDecaimiento(estado[campo] ?? 100, estado[campo + 'Actualizada'], decays[campo]);
        if (actual < 60) efectos[campo] = 60 - actual;
    }
    await _aplicarCuidadoMascota(efectos, 'le dio medicina a Chokurei', 8);
}

async function hacerFiestaMascota(){
    vibrarJ(12);
    const pagado = await _gastarPuntosMascota(15);
    if (!pagado) { vibrarJ([10, 30, 10]); if (window.sfx) window.sfx.error(); if (_ck) _ck.decir('Faltan puntos para la fiesta 🥺', 2000); return; }
    if (window.sfx) window.sfx.logro();
    if (window.fx) window.fx.confeti();
    if (_ck) _ck.bailar();
    const ref = refMascota();
    await window.runTransaction(window.db, async (tx) => {
        const snap = await tx.get(ref);
        const estado = snap.exists() ? snap.data() : {};
        const ahora = ahoraSync();
        const historial = [...(estado.historial || []), { detalle: 'organizó una fiesta para Chokurei 🎉', autor: miIdentidad, timestamp: ahora }].slice(-15);
        tx.set(ref, {
            hambre: 100, hambreActualizada: ahora,
            diversion: 100, diversionActualizada: ahora,
            carino: 100, carinoActualizada: ahora,
            higiene: 100, higieneActualizada: ahora,
            fiestaHasta: ahora + 2 * 3600000,
            xp: window.increment(10),
            historial
        }, { merge: true });
    });
    if (typeof registrarEvento === 'function') registrarEvento('cuidado_compartido', 'Organizaron una fiesta para Chokurei');
}

async function festejarCumpleMascota(){
    vibrarJ([15, 30, 15]);
    if (window.sfx) window.sfx.logro();
    if (window.fx) window.fx.confeti();
    if (_ck) _ck.bailar();
    const hoy = fechaISO(new Date());
    // Transacción: si los dos tocaban "festejar" a la vez, se festejaba dos veces.
    const ref = refMascota();
    let festejo = false;
    await window.runTransaction(window.db, async (tx) => {
        festejo = false;
        const snap = await tx.get(ref);
        const estado = snap.exists() ? snap.data() : {};
        if (estado.ultimoCumpleFestejado === hoy) return;
        const ahora = ahoraSync();
        const historial = [...(estado.historial || []), { detalle: '¡festejó el cumpleaños de Chokurei! 🎂', autor: miIdentidad, timestamp: ahora }].slice(-15);
        tx.set(ref, { ultimoCumpleFestejado: hoy, xp: window.increment(15), historial }, { merge: true });
        festejo = true;
    });
    if (!festejo) return;
    if (window.sumarPuntos) { window.sumarPuntos('nico', 10); window.sumarPuntos('carito', 10); }
    if (typeof registrarEvento === 'function') registrarEvento('cuidado_compartido', 'Festejaron el cumpleaños de Chokurei');
}

async function reclamarRegaloMascota(el){
    vibrarJ([10, 20, 10]);
    if (window.sfx) window.sfx.moneda();
    window._hayRegaloMascota = false;
    if (el) {
        el.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.5) rotate(10deg)', opacity: 0 }], { duration: 400 }).finished.then(() => el.remove());
        if (_ck) { sonidosChokurei.brillo(); _ck.decir('¡Es para vos! +3 ⭐', 2200); _ck.alegrarse(); }
    }
    await window.setDoc(refMascota(), { ultimoRegalo: ahoraSync() }, { merge: true });
    if (window.sumarPuntos) window.sumarPuntos(miIdentidad, 3);
}

// Transacción sobre el pozo de puntos compartido (mismo patrón que "El
// Refugio"): si no alcanza, no descuenta nada y devuelve false.
async function _gastarPuntosMascota(costo){
    const puntosRef = window.doc(window.db, 'juegos', 'puntos-globales');
    const resultado = await window.runTransaction(window.db, async (tx) => {
        const snap = await tx.get(puntosRef);
        const puntos = snap.exists() ? snap.data() : { nico: 0, carito: 0 };
        if ((puntos[miIdentidad] || 0) < costo) return false;
        tx.set(puntosRef, { [miIdentidad]: (puntos[miIdentidad] || 0) - costo }, { merge: true });
        return true;
    });
    return resultado;
}
