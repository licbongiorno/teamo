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
        </div>`;
        return;
    }
    const m = d.marcador || { nico: 0, carito: 0 };
    const resultados = d.resultados || [];
    const lista = d.juegos.map((j, i) => {
        const r = resultados[i];
        const marca = r ? (r.ganador ? `✅ ${nombreJugador(r.ganador)}` : '🤝 empate') : (i === resultados.length && d.activa ? '▶ ahora' : '');
        return `<div class="fila-noche${i === resultados.length && d.activa ? ' actual' : ''}"><span>${_juegoNoche(j)}</span><small>${marca}</small></div>`;
    }).join('');
    let pie;
    if (d.activa) {
        const actual = d.juegos[resultados.length];
        pie = `<button class="btn-principal" onclick="abrirJuego('${actual}')">▶ Jugar ${_juegoNoche(actual)}</button>
            <button class="btn-secundario" style="margin-top:8px;" onclick="terminarNocheDeJuegos()">Terminar la noche</button>`;
    } else {
        const campeon = d.campeon ? `🏆 ${nombreJugador(d.campeon)} ganó la noche` : '🤝 ¡La noche terminó empatada!';
        pie = `<div class="texto-centro" style="font-size:1.1rem; margin:6px 0 10px;">${campeon}</div>
            <button class="btn-secundario" onclick="armarNocheDeJuegos()">✨ Armar otra noche</button>`;
    }
    cont.innerHTML = `<div class="panel tarjeta-noche">
        <div class="titulo-noche">🌙 Noche de juegos · Nico ${m.nico || 0} — Carito ${m.carito || 0}</div>
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
async function nocheRegistrarResultado(juegoId, ganador){
    if (!_estadoNoche || !_estadoNoche.activa) return;
    try {
        await window.runTransaction(window.db, async (tx) => {
            const snap = await tx.get(refNoche());
            const d = snap.exists() ? snap.data() : null;
            if (!d || !d.activa) return;
            const resultados = [...(d.resultados || [])];
            if (d.juegos[resultados.length] !== juegoId) return; // no es el juego que tocaba
            resultados.push({ juego: juegoId, ganador: ganador || null });
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
    const quien = r && r.ganador ? `Ganó ${nombreJugador(r.ganador)}` : 'Empate';
    if (!d.activa) {
        mostrarCartelEnVivo({ titulo: d.campeon ? `🏆 ¡${nombreJugador(d.campeon)} ganó la Noche de juegos!` : '🤝 ¡La noche terminó empatada!',
            sub: `Nico ${m.nico || 0} — Carito ${m.carito || 0}`, duracion: 7000 });
        if (d.campeon === miIdentidad && window.fx) window.fx.confeti();
        return;
    }
    const siguiente = d.juegos[d.resultados.length];
    mostrarCartelEnVivo({
        clave: 'noche', titulo: `🌙 ${quien} · Nico ${m.nico || 0} — Carito ${m.carito || 0}`,
        sub: `Siguiente: ${_juegoNoche(siguiente)}`, si: '▶ Ir', no: 'Después',
        alSi: () => { if (typeof cerrarJuego === 'function') cerrarJuego(); abrirJuego(siguiente); }, duracion: 15000
    });
}

window.iniciarNocheDeJuegos = iniciarNocheDeJuegos;
window.armarNocheDeJuegos = armarNocheDeJuegos;
window.terminarNocheDeJuegos = terminarNocheDeJuegos;
window.nocheRegistrarResultado = nocheRegistrarResultado;
