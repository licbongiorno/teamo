// ============================================================
// noche.js — "Noche de juegos": una sesión de 4 duelos en vivo
// elegidos al azar, con un marcador general y un campeón de la noche.
//
// Vive en un solo documento (juegos/noche). No hace falta tocar cada
// juego: registrarVictoria (historial.js), que ya llaman todos los
// duelos al terminar una partida, avisa acá con nocheRegistrarResultado;
// si ese juego es el que tocaba en la noche, suma el punto y pasa al
// siguiente. Al avanzar, a los dos les aparece un cartel con el
// resultado y un botón para ir directo al próximo juego.
// ============================================================
const JUEGOS_NOCHE = ['calculo', 'trivia', 'tipeo', 'anagramas', 'stroop', 'reflejos', 'ppt', 'burbujas', 'bombas', 'pinatas',
    'topo', 'blancomovil', 'carreraglobos', 'ritmo', 'simon', 'memoriarelampago', 'buscaminas', 'tiraafloja', 'bloques'];
const CANTIDAD_JUEGOS_NOCHE = 4;

// ---------- Cita de juegos ----------
// Una noche guiada: eligen cuánto tiempo tienen y el humor, y se arma un
// recorrido de 3 a 5 juegos. Va en el mismo doc (modo: 'cita'). Los
// juegos sin ganador (charla, cooperativos) se pasan con "Listo, siguiente".
// Minutos aproximados de cada juego que puede entrar en una cita.
const MINUTOS_CITA = {
    calculo: 3, trivia: 4, reflejos: 3, tiraafloja: 3, ppt: 3, anagramas: 3, rosco: 6, sopa: 4, palabras: 4, palabradia: 6,
    truco: 20, uno: 12, generala: 15, escoba: 15, chinchon: 15, batallanaval: 15, tateti: 5, conecta4: 8, damas: 15, reversi: 12,
    mente: 8, codigo: 15, onda: 10, dibujayadivina: 10, memoria: 6, tuttifrutti: 8,
    treintayseis: 10, mapaamor: 8, lenguajes: 8, conoceme: 6, espejo: 6, futuro: 8, nuncapregunte: 8, quehariassi: 6,
    dilema: 5, queprefieres: 5, masprobable: 5, maquinatiempo: 8, antesdedormir: 8,
};
const HUMORES_CITA = {
    tranqui: { nombre: 'Tranqui', icono: '☕', juegos: ['mente', 'codigo', 'onda', 'dibujayadivina', 'memoria', 'palabradia', 'tateti', 'generala', 'escoba', 'conecta4'] },
    competitivo: { nombre: 'Competitivo', icono: '🔥', juegos: ['truco', 'uno', 'calculo', 'trivia', 'reflejos', 'tiraafloja', 'rosco', 'sopa', 'palabras', 'generala', 'chinchon', 'batallanaval', 'ppt', 'anagramas', 'reversi'] },
    romantico: { nombre: 'Romántico', icono: '🌹', juegos: ['treintayseis', 'mapaamor', 'onda', 'mente', 'conoceme', 'espejo', 'futuro', 'dibujayadivina', 'lenguajes'] },
    charla: { nombre: 'De charla', icono: '💬', juegos: ['nuncapregunte', 'quehariassi', 'dilema', 'treintayseis', 'mapaamor', 'futuro', 'maquinatiempo', 'queprefieres', 'masprobable'] },
};
const CIERRES_CITA = [
    '¿Cuál fue tu momento favorito de esta cita?', '¿Qué aprendiste de mí esta noche?', '¿Qué te gustaría que repitamos la próxima vez?',
    'Contame algo que te hizo reír hoy.', '¿Qué es lo que más te gusta de jugar conmigo?', 'Si esta noche fuera una canción, ¿cuál sería?',
    '¿Qué te gustaría agradecerme de esta semana?', 'Elegí una palabra para describir esta cita y contame por qué.',
];
let _citaMinutos = 45, _citaHumor = 'tranqui', _citaPrevia = null;

function armarRecorridoCita(minutos, humor){
    const pool = HUMORES_CITA[humor].juegos.filter(id => document.getElementById('pantalla-' + id)).sort(() => Math.random() - 0.5);
    const juegos = [];
    let suma = 0;
    for (const id of pool) {
        if (juegos.length >= 5) break;
        const m = MINUTOS_CITA[id] || 8;
        if (suma + m <= minutos * 1.15) { juegos.push(id); suma += m; }
    }
    // Al menos 3: si no alcanza el tiempo, se completa con los más cortos.
    const cortos = pool.filter(id => !juegos.includes(id)).sort((a, b) => (MINUTOS_CITA[a] || 8) - (MINUTOS_CITA[b] || 8));
    while (juegos.length < 3 && cortos.length) { const id = cortos.shift(); juegos.push(id); suma += MINUTOS_CITA[id] || 8; }
    return { juegos, minutos: suma };
}
function abrirCitaDeJuegos(){
    vibrarJ(12);
    document.querySelectorAll('.cita-fondo').forEach(x => x.remove());
    const fondo = document.createElement('div');
    fondo.className = 'compu-selector-fondo cita-fondo';
    fondo.onclick = (ev) => { if (ev.target === fondo) fondo.remove(); };
    document.body.appendChild(fondo);
    _renderHojaCita();
}
function _renderHojaCita(){
    const fondo = document.querySelector('.cita-fondo');
    if (!fondo) return;
    const prev = _citaPrevia = armarRecorridoCita(_citaMinutos, _citaHumor);
    fondo.innerHTML = `<div class="compu-selector panel" role="dialog" aria-label="Cita de juegos">
        <div class="compu-selector-titulo">🕯️ Armemos una cita de juegos</div>
        <div class="texto-tenue" style="font-size:0.82rem; margin:4px 0;">¿Cuánto tiempo tienen?</div>
        <div class="elegir-cita">${[20, 45, 90].map(m => `<button class="${_citaMinutos === m ? 'activa' : ''}" onclick="elegirCita('minutos', ${m})">${m} min</button>`).join('')}</div>
        <div class="texto-tenue" style="font-size:0.82rem; margin:8px 0 4px;">¿De qué humor están?</div>
        <div class="elegir-cita">${Object.entries(HUMORES_CITA).map(([k, h]) => `<button class="${_citaHumor === k ? 'activa' : ''}" onclick="elegirCita('humor', '${k}')">${h.icono}<br>${h.nombre}</button>`).join('')}</div>
        <div class="recorrido-cita" onclick="_renderHojaCita()">${prev.juegos.map((id, i) => `<span>${i + 1}. ${_juegoNoche(id)}</span>`).join('')}<small>≈ ${prev.minutos} minutos · 🎲 tocá para sortear otro recorrido</small></div>
        <button class="btn-principal" onclick="empezarCitaDeJuegos()">💞 Empezar la cita</button>
        <button class="btn-secundario" style="margin-top:8px;" onclick="document.querySelectorAll('.cita-fondo').forEach(x => x.remove())">Cancelar</button>
    </div>`;
}
function elegirCita(que, valor){
    vibrarJ(8);
    if (que === 'minutos') _citaMinutos = valor; else _citaHumor = valor;
    _renderHojaCita();
}
function empezarCitaDeJuegos(){
    if (_estadoNoche && _estadoNoche.activa && !confirm('Ya hay una noche en curso. ¿Empezar la cita desde cero?')) return;
    document.querySelectorAll('.cita-fondo').forEach(x => x.remove());
    const { juegos } = _citaPrevia || armarRecorridoCita(_citaMinutos, _citaHumor);
    _citaPrevia = null;
    if (typeof invitarAJugar === 'function') invitarAJugar(juegos[0]);
    window.setDoc(refNoche(), {
        id: Date.now().toString(36), modo: 'cita', humor: _citaHumor, minutos: _citaMinutos, activa: true, juegos, resultados: [],
        marcador: { nico: 0, carito: 0 }, cierre: CIERRES_CITA[Math.floor(Math.random() * CIERRES_CITA.length)],
        creadaPor: miIdentidad, creadaEn: Date.now()
    }).then(() => {
        if (window.sfx) window.sfx.logro();
        if (typeof cerrarJuego === 'function' && document.querySelector('.pantalla-juego.activa:not(#pantalla-menu)')) cerrarJuego();
        abrirJuego(juegos[0]);
    }).catch(e => console.error('No se pudo armar la cita:', e));
}
// "Listo, siguiente": para los juegos de la cita que no tienen ganador.
async function siguienteEnCita(){
    vibrarJ(12);
    const d = _estadoNoche;
    if (!d || !d.activa) return;
    await nocheRegistrarResultado(d.juegos[(d.resultados || []).length], null, true);
}
// Pregunta de cierre: se responde con el motor de reflexión ("Lo que nunca te pregunté").
async function responderCierreCita(){
    const d = _estadoNoche;
    if (!d || !d.cierre) return;
    try {
        const id = 'reflexion-nuncapregunte-cita-' + d.id;
        await window.runTransaction(window.db, async (tx) => {
            const ref = window.doc(window.db, 'juegos', id);
            const snap = await tx.get(ref);
            if (snap.exists()) return;
            tx.set(ref, { tipo: 'reflexion-nuncapregunte', pregunta: d.cierre, creadaEn: Date.now(), fase: 'respondiendo', respuestas: { nico: null, carito: null }, sorteo: null });
        });
        const params = new URLSearchParams(location.search);
        params.set('juego', 'nuncapregunte'); params.set('carta', id);
        history.replaceState(null, '', '?' + params.toString());
        abrirJuego('nuncapregunte');
    } catch (e) { console.error('No se pudo abrir la pregunta de cierre:', e); }
}
// Tira dentro del juego de la cita: en qué paso van y el botón para seguir.
function _barraCita(){
    let barra = document.getElementById('barra-cita');
    const d = _estadoNoche;
    const activa = document.querySelector('.pantalla-juego.activa');
    const actual = d && d.activa ? d.juegos[(d.resultados || []).length] : null;
    const enJuego = activa && actual && activa.id === 'pantalla-' + actual;
    if (!enJuego || (window.modoCompu && window.modoCompu())) { if (barra) barra.remove(); return; }
    if (!barra) {
        barra = document.createElement('div');
        barra.id = 'barra-cita';
        document.body.appendChild(barra);
    }
    const n = (d.resultados || []).length;
    const html = `<span>${d.modo === 'cita' ? '🕯️ Cita' : '🌙 Noche'} · ${n + 1} de ${d.juegos.length}</span><button onclick="siguienteEnCita()">✅ Listo, siguiente</button>`;
    if (barra.innerHTML !== html) barra.innerHTML = html;
}
setInterval(_barraCita, 1000);

function refNoche(){ return window.doc(window.db, 'juegos', 'noche'); }
let _estadoNoche = null;
let _nocheIndiceVisto = null;

function iniciarNocheDeJuegos(){
    if (window._escuchaNoche || !window.db) return; // a propósito no empieza con _unsub: es del menú, no de un juego
    window._escuchaNoche = window.onSnapshot(refNoche(), (snap) => {
        const d = snap.exists() ? snap.data() : null;
        const antes = _nocheIndiceVisto;
        _estadoNoche = d;
        _nocheIndiceVisto = d ? (d.resultados || []).length : null;
        if (antes !== null && d && d.id && _nocheIndiceVisto > antes) _avisarAvanceNoche(d);
        renderNocheDeJuegos();
    }, (err) => console.warn('Error escuchando la Noche de juegos:', err));
}

function _juegoNoche(id){
    const j = (window.JUEGOS || []).find(x => x.id === id);
    return j ? `${j.icono} ${j.nombre}` : id;
}

function renderNocheDeJuegos(){
    const cont = document.getElementById('noche-juegos');
    if (!cont) return;
    const d = _estadoNoche;
    const recienTerminada = d && !d.activa && d.campeon !== undefined && Date.now() - (d.terminadaEn || 0) < 12 * 3600000;
    if (!d || (!d.activa && !recienTerminada)) {
        cont.innerHTML = `<div class="panel tarjeta-noche">
            <div class="titulo-noche">🌙 Noche de juegos</div>
            <div class="texto-tenue" style="margin-bottom:10px;">${CANTIDAD_JUEGOS_NOCHE} duelos en vivo al azar, uno atrás del otro. Gana la noche quien gane más.</div>
            <button class="btn-principal" onclick="armarNocheDeJuegos()">✨ Armar la noche</button>
            <button class="btn-secundario" style="margin-top:8px;" onclick="abrirCitaDeJuegos()">🕯️ Mejor una cita: elegimos tiempo y humor</button>
        </div>`;
        return;
    }
    const m = d.marcador || { nico: 0, carito: 0 };
    const resultados = d.resultados || [];
    const lista = d.juegos.map((j, i) => {
        const r = resultados[i];
        const marca = r ? (r.ganador ? `✅ ${nombreJugador(r.ganador)}` : r.manual ? '💞 listo' : '🤝 empate') : (i === resultados.length && d.activa ? '▶ ahora' : '');
        return `<div class="fila-noche${i === resultados.length && d.activa ? ' actual' : ''}"><span>${_juegoNoche(j)}</span><small>${marca}</small></div>`;
    }).join('');
    let pie;
    if (d.activa) {
        const actual = d.juegos[resultados.length];
        pie = `<button class="btn-principal" onclick="abrirJuego('${actual}')">▶ Jugar ${_juegoNoche(actual)}</button>
            <button class="btn-secundario" style="margin-top:8px;" onclick="siguienteEnCita()">⏭️ Ya lo jugamos: siguiente</button>
            <button class="btn-secundario" style="margin-top:8px;" onclick="terminarNocheDeJuegos()">Terminar ${d.modo === 'cita' ? 'la cita' : 'la noche'}</button>`;
    } else {
        const competitivos = resultados.filter(r => r.ganador).length;
        const campeon = d.campeon ? `🏆 ${nombreJugador(d.campeon)} ganó la ${d.modo === 'cita' ? 'cita' : 'noche'}` : (competitivos || d.modo !== 'cita' ? '🤝 ¡Terminó empatada!' : '💞 ¡Qué linda cita!');
        pie = `<div class="texto-centro" style="font-size:1.1rem; margin:6px 0 10px;">${campeon}</div>
            ${d.modo === 'cita' && d.cierre ? `<div class="cierre-cita">💭 Para cerrar: <b>${d.cierre}</b><br><button class="btn-principal" style="margin-top:8px;" onclick="responderCierreCita()">Responder juntos</button></div>` : ''}
            <div class="btn-fila" style="margin-top:8px;"><button class="btn-secundario" onclick="armarNocheDeJuegos()">✨ Otra noche</button><button class="btn-secundario" onclick="abrirCitaDeJuegos()">🕯️ Otra cita</button></div>`;
    }
    cont.innerHTML = `<div class="panel tarjeta-noche">
        <div class="titulo-noche">${d.modo === 'cita' ? `🕯️ Cita ${(HUMORES_CITA[d.humor] || {}).icono || ''} ${(HUMORES_CITA[d.humor] || {}).nombre || ''}` : '🌙 Noche de juegos'} · Nico ${m.nico || 0} — Carito ${m.carito || 0}</div>
        ${lista}
        <div style="margin-top:10px;">${pie}</div>
    </div>`;
}

function armarNocheDeJuegos(){
    vibrarJ(15);
    if (_estadoNoche && _estadoNoche.activa && !confirm('Ya hay una noche en curso. ¿Empezar otra desde cero?')) return;
    const disponibles = JUEGOS_NOCHE.filter(id => document.getElementById('pantalla-' + id));
    const juegos = [];
    while (juegos.length < CANTIDAD_JUEGOS_NOCHE && disponibles.length) {
        juegos.push(disponibles.splice(Math.floor(Math.random() * disponibles.length), 1)[0]);
    }
    // Invitación al primer juego (en el mismo toque, por si hay que abrir WhatsApp).
    if (typeof invitarAJugar === 'function') invitarAJugar(juegos[0]);
    window.setDoc(refNoche(), {
        id: Date.now().toString(36), activa: true, juegos, resultados: [], marcador: { nico: 0, carito: 0 },
        creadaPor: miIdentidad, creadaEn: Date.now()
    }).then(() => { if (window.sfx) window.sfx.logro(); })
      .catch(e => console.error('No se pudo armar la noche:', e));
}

async function terminarNocheDeJuegos(){
    if (!confirm('¿Terminar la noche ahora? Gana quien vaya ganando.')) return;
    try {
        await window.runTransaction(window.db, async (tx) => {
            const snap = await tx.get(refNoche());
            const d = snap.exists() ? snap.data() : null;
            if (!d || !d.activa) return;
            tx.update(refNoche(), { activa: false, campeon: ganadorPorPuntos(d.marcador), terminadaEn: Date.now() });
        });
    } catch (e) { console.error('No se pudo terminar la noche:', e); }
}

// La llama registrarVictoria (historial.js) cada vez que termina una
// partida de cualquier juego. ganador puede ser null (empate).
async function nocheRegistrarResultado(juegoId, ganador, manual){
    if (!_estadoNoche || !_estadoNoche.activa) return;
    if (!manual && window.modoCompu && window.modoCompu()) return; // contra la compu no cuenta
    try {
        await window.runTransaction(window.db, async (tx) => {
            const snap = await tx.get(refNoche());
            const d = snap.exists() ? snap.data() : null;
            if (!d || !d.activa) return;
            const resultados = [...(d.resultados || [])];
            if (d.juegos[resultados.length] !== juegoId) return; // no es el juego que tocaba
            resultados.push({ juego: juegoId, ganador: ganador || null, ...(manual ? { manual: true } : {}) });
            const marcador = { ...(d.marcador || { nico: 0, carito: 0 }) };
            if (ganador) marcador[ganador] = (marcador[ganador] || 0) + 1;
            const fin = resultados.length >= d.juegos.length;
            tx.update(refNoche(), { resultados, marcador, ...(fin ? { activa: false, campeon: ganadorPorPuntos(marcador), terminadaEn: Date.now() } : {}) });
        });
    } catch (e) { console.warn('No se pudo anotar el resultado en la Noche de juegos:', e); }
}

function _avisarAvanceNoche(d){
    if (typeof mostrarCartelEnVivo !== 'function') return;
    const r = (d.resultados || [])[d.resultados.length - 1];
    const m = d.marcador || { nico: 0, carito: 0 };
    const quien = r && r.ganador ? `Ganó ${nombreJugador(r.ganador)}` : (r && r.manual ? '¡Listo!' : 'Empate');
    if (!d.activa && d.modo === 'cita') {
        mostrarCartelEnVivo({ titulo: d.campeon ? `🏆 ¡${nombreJugador(d.campeon)} ganó la cita!` : '💞 ¡Terminó la cita!', sub: d.cierre ? `Para cerrar: ${d.cierre}` : '', duracion: 8000 });
        if (window.fx) window.fx.confeti();
        return;
    }
    if (!d.activa) {
        mostrarCartelEnVivo({ titulo: d.campeon ? `🏆 ¡${nombreJugador(d.campeon)} ganó la Noche de juegos!` : '🤝 ¡La noche terminó empatada!',
            sub: `Nico ${m.nico || 0} — Carito ${m.carito || 0}`, duracion: 7000 });
        if (d.campeon === miIdentidad && window.fx) window.fx.confeti();
        return;
    }
    const siguiente = d.juegos[d.resultados.length];
    mostrarCartelEnVivo({
        clave: 'noche', titulo: `${d.modo === 'cita' ? '🕯️' : '🌙'} ${quien} · Nico ${m.nico || 0} — Carito ${m.carito || 0}`,
        sub: `Siguiente: ${_juegoNoche(siguiente)}`, si: '▶ Ir', no: 'Después',
        alSi: () => { if (typeof cerrarJuego === 'function') cerrarJuego(); abrirJuego(siguiente); }, duracion: 15000
    });
}

window.iniciarNocheDeJuegos = iniciarNocheDeJuegos;
window.armarNocheDeJuegos = armarNocheDeJuegos;
window.terminarNocheDeJuegos = terminarNocheDeJuegos;
window.nocheRegistrarResultado = nocheRegistrarResultado;
window.abrirCitaDeJuegos = abrirCitaDeJuegos;
window.elegirCita = elegirCita;
window.empezarCitaDeJuegos = empezarCitaDeJuegos;
window.siguienteEnCita = siguienteEnCita;
window.responderCierreCita = responderCierreCita;
window.HUMORES_CITA = HUMORES_CITA;
window._renderHojaCita = _renderHojaCita;
