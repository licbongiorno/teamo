// ==================== ¿QUIÉN TIENE RAZÓN? ====================
// No es una partida única como los demás juegos: es un marcador
// PERMANENTE para esas discusiones tontas que se repiten para
// siempre (¿la piña va en la pizza? ¿se dobla el papel para adentro o
// para afuera?). Cada tema queda archivado con un contador de
// "victorias" por jugador que crece sin límite — ganar una vez no
// cierra el debate, es sólo un punto más en una guerra eterna y
// ridículamente seria. Los temas viven como documentos con
// tipo:'debate' dentro de la colección 'juegos' (mismo truco que ya
// usa Letras Compartidas), así no hace falta tocar las Reglas de
// Firestore para sumar una colección nueva.
function refTemaRazon(id){ return window.doc(window.db, 'juegos', id); }

function iniciarQuienTieneRazon(){
    mostrarListaTemasRazon();
}

function mostrarListaTemasRazon(){
    const cont = document.getElementById('contenido-quientienerazon');
    if (!cont) return;
    cont.innerHTML = `<div class="panel texto-centro texto-tenue">Cargando…</div>`;
    if (window._unsubTemasRazon) window._unsubTemasRazon();
    const q = window.query(window.collection(window.db, 'juegos'), window.where('tipo', '==', 'debate'));
    window._unsubTemasRazon = window.onSnapshot(q, (snap) => {
        const temas = [];
        snap.forEach(d => temas.push({ id: d.id, ...d.data() }));
        temas.sort((a, b) => (b.actualizadoEn || b.creadoEn || 0) - (a.actualizadoEn || a.creadoEn || 0));
        renderListaTemasRazon(temas);
    }, (err) => {
        console.error('Error de Firestore en quién tiene razón:', err);
        cont.innerHTML = `<div class="panel texto-centro texto-tenue">⚠️ No se pudo conectar (${err.code || 'error'}).</div>`;
    });
}

function _escaparTextoRazon(texto){
    const div = document.createElement('div');
    div.innerText = texto == null ? '' : String(texto);
    return div.innerHTML;
}

function renderListaTemasRazon(temas){
    const cont = document.getElementById('contenido-quientienerazon');
    let html = `<div class="panel texto-centro">
        <p class="texto-tenue">El marcador permanente de nuestras discusiones tontas. Cada "victoria" suma un punto más — el tema nunca se cierra.</p>
        <button class="btn-principal" onclick="mostrarFormularioTemaRazon()">⚖️ Archivar un tema nuevo</button>
    </div>
    <div id="form-nuevo-tema-razon"></div>`;

    if (temas.length) {
        temas.forEach(t => {
            const vNico = t.victoriasNico || 0, vCarito = t.victoriasCarito || 0;
            const total = vNico + vCarito;
            const pctNico = total ? Math.round((vNico / total) * 100) : 50;
            html += `<div class="panel tarjeta-razon">
                <div class="pregunta-razon">${_escaparTextoRazon(t.pregunta)}</div>
                <div class="barra-medidor barra-razon"><div class="relleno-medidor" style="width:${pctNico}%; background:linear-gradient(90deg,var(--celeste),var(--rosa));"></div></div>
                <div class="fila-votos-razon">
                    <button class="btn-voto-razon" onclick="votarTemaRazon('${t.id}','nico')">💙 Nico<span class="num-voto-razon">${vNico}</span></button>
                    <button class="btn-voto-razon" onclick="votarTemaRazon('${t.id}','carito')">💖 Carito<span class="num-voto-razon">${vCarito}</span></button>
                </div>
            </div>`;
        });
    } else {
        html += `<div class="panel texto-centro texto-tenue">Todavía no archivaron ninguna discusión. ¡Empiecen la primera guerra! 😜</div>`;
    }
    cont.innerHTML = html;
}

function mostrarFormularioTemaRazon(){
    const cont = document.getElementById('form-nuevo-tema-razon');
    if (!cont) return;
    cont.innerHTML = `<div class="panel">
        <textarea id="input-tema-razon" placeholder="¿Sobre qué discuten siempre? Ej: ¿La piña va en la pizza?" rows="2" maxlength="140" style="width:100%; box-sizing:border-box; font-family:var(--fuente-texto); background:rgba(255,255,255,0.06); color:var(--texto); border:1px solid var(--borde); border-radius:12px; padding:10px; resize:none;"></textarea>
        <button class="btn-principal" style="margin-top:8px;" onclick="crearTemaRazon()">Archivar</button>
    </div>`;
    const ta = document.getElementById('input-tema-razon');
    if (ta) ta.focus();
}

async function crearTemaRazon(){
    const input = document.getElementById('input-tema-razon');
    if (!input) return;
    const pregunta = input.value.trim();
    if (!pregunta || !miIdentidad) return;
    vibrarJ(12);
    try {
        await window.addDoc(window.collection(window.db, 'juegos'), {
            tipo: 'debate', pregunta, creadoPor: miIdentidad,
            victoriasNico: 0, victoriasCarito: 0,
            creadoEn: Date.now(), actualizadoEn: Date.now()
        });
        const form = document.getElementById('form-nuevo-tema-razon');
        if (form) form.innerHTML = '';
        if (typeof registrarEvento === 'function') registrarEvento('nuevo_tema_razon', `${nombreJugador(miIdentidad)} archivó una discusión nueva`);
    } catch (e) { console.error('No se pudo archivar el tema:', e); }
}

async function votarTemaRazon(id, jugador){
    vibrarJ(15);
    if (window.sfx) window.sfx.click();
    const campo = jugador === 'nico' ? 'victoriasNico' : 'victoriasCarito';
    try {
        await window.updateDoc(refTemaRazon(id), { [campo]: window.increment(1), actualizadoEn: Date.now() });
    } catch (e) { console.error('No se pudo sumar el voto:', e); }
}
