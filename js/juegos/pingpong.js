// ==================== PING PONG DE PREGUNTAS ====================
// Preguntas de ida y vuelta, por turnos: uno elige una pregunta (de una
// categoría o "sorpresa") y se la manda al otro; el otro la responde y
// ahora le toca a él/ella elegir la próxima para devolverla. Cada
// pelotazo se puede mandar por WhatsApp con la respuesta + la pregunta
// nueva y un link que abre el juego directo.
//
// Las preguntas NUNCA se repiten: el documento guarda "usadas" (los ids
// de todas las que ya salieron, mandadas o salteadas con "Otra"). Cuando
// se terminan todas, se puede barajar de nuevo.
//
// La partida vive en un solo documento (juegos/pingpong); cada pregunta
// respondida queda además guardada como tipo:'pingpong-ronda' para el
// historial. El banco está en js/juegos/pingpong-banco.js.

function refPingPong(){ return window.doc(window.db, 'juegos', 'pingpong'); }

// Mismo hash que se usó para chequear que no haya colisiones al armar
// el banco: el id de cada pregunta es su texto hasheado, así se pueden
// agregar preguntas en cualquier lugar del banco sin mezclar las usadas.
function _idPreguntaPingPong(texto){
    let h = 5381;
    for (let i = 0; i < texto.length; i++) h = ((h * 33) ^ texto.charCodeAt(i)) >>> 0;
    return h.toString(36);
}

let _ppIndice = null;          // [{ id, nombre, icono, preguntas:[{ id, texto }] }]
let _estadoPingPong = null;
let _ppCategoria = 'sorpresa'; // categoría elegida para sacar la próxima
let _ppCandidata = null;       // { id, texto, cat } que estoy por mandar
let _ppEscribiendoPropia = false;
let _ppVista = 'juego';        // 'juego' | 'historial'
let _ppCategoriasAbiertas = false;

function _indicePingPong(){
    if (_ppIndice) return _ppIndice;
    _ppIndice = (window.PINGPONG_CATEGORIAS || []).map(c => ({
        id: c.id, nombre: c.nombre, icono: c.icono,
        preguntas: c.preguntas.map(texto => ({ id: _idPreguntaPingPong(texto), texto }))
    }));
    return _ppIndice;
}
function _catPingPong(id){ return _indicePingPong().find(c => c.id === id); }
function _totalPingPong(){ return _indicePingPong().reduce((n, c) => n + c.preguntas.length, 0); }
function _usadasPingPong(){ return new Set(_estadoPingPong?.usadas || []); }
function _restantesPingPong(cat, usadas){ return cat.preguntas.filter(p => !usadas.has(p.id)); }

function iniciarPingPong(){
    if (window._unsubPingPong) window._unsubPingPong();
    _ppCandidata = null;
    _ppEscribiendoPropia = false;
    _ppVista = 'juego';
    let faseAnterior = null;
    window._unsubPingPong = window.onSnapshot(refPingPong(), (snap) => {
        const datos = snap.exists() ? snap.data() : null;
        // Sonido cuando me llega una pregunta nueva o me responden.
        if (faseAnterior !== null && datos && datos.turno === miIdentidad && datos.fase !== faseAnterior && window.sfx) window.sfx.cartaFlip();
        faseAnterior = datos ? datos.fase : null;
        _estadoPingPong = datos;
        // Si la candidata que tenía en pantalla ya salió (la mandó o la
        // salteó en otro dispositivo), se descarta.
        if (_ppCandidata && _usadasPingPong().has(_ppCandidata.id)) _ppCandidata = null;
        if (_ppVista === 'juego') renderPingPong();
    }, (err) => {
        console.error('Error de Firestore en pingpong:', err);
        document.getElementById('contenido-pingpong').innerHTML = `<div class="panel texto-centro texto-tenue">⚠️ No se pudo conectar (${err.code || 'error'}).</div>`;
    });
}

// ==================== PANTALLA PRINCIPAL ====================
function renderPingPong(){
    const cont = document.getElementById('contenido-pingpong');
    if (!cont) return;
    // Si estoy escribiendo una respuesta o una pregunta propia, no se
    // pierde lo tipeado cuando llega un cambio del otro.
    const borrador = {};
    cont.querySelectorAll('textarea').forEach(t => { borrador[t.id] = t.value; });
    const enfocado = document.activeElement && cont.contains(document.activeElement) ? document.activeElement.id : null;

    const e = _estadoPingPong;
    const otro = nombreJugador(miRival);
    const usadas = _usadasPingPong();
    const total = _totalPingPong();
    let html = `<div class="texto-tenue texto-centro" style="margin-bottom:8px;">🏓 ${e?.pelotazos || 0} pelotazo${(e?.pelotazos || 0) === 1 ? '' : 's'} · ${usadas.size} de ${total} preguntas usadas</div>`;

    // Lo último que pasó (la respuesta que me dieron, o que di).
    if (e?.ultima) html += _htmlUltimaPingPong(e.ultima);

    const meToca = !e || !e.fase || e.turno === miIdentidad;
    if (e?.fase === 'respondiendo') {
        const cat = _catPingPong(e.pregunta?.cat);
        const etiqueta = cat ? `${cat.icono} ${cat.nombre}` : '✍️ Pregunta propia';
        if (e.turno === miIdentidad) {
            html += `<div class="panel flip-carta tarjeta-pingpong">
                <div class="texto-tenue" style="margin-bottom:6px;">${nombreJugador(e.de)} te pregunta · ${etiqueta}</div>
                <p class="pregunta-pingpong">${escaparHtml(e.pregunta.texto)}</p>
                <textarea id="respuesta-pingpong" class="textarea-pingpong" rows="4" maxlength="800" placeholder="Tu respuesta…"></textarea>
                <button class="btn-principal" onclick="responderPingPong()">🏓 Responder y devolver</button>
                <button class="btn-secundario" style="margin-top:8px;" onclick="pasarPingPong()">🙈 Paso, que me pregunte otra</button>
            </div>`;
        } else {
            html += `<div class="panel tarjeta-pingpong">
                <div class="texto-tenue" style="margin-bottom:6px;">Le preguntaste a ${otro} · ${etiqueta}</div>
                <p class="pregunta-pingpong">${escaparHtml(e.pregunta.texto)}</p>
                <div class="texto-tenue texto-centro destello" style="margin-top:10px;">Esperando que ${otro} responda…</div>
            </div>
            <button class="btn-secundario btn-wa-pingpong" onclick="recordarPingPongWhatsApp()">${_iconoWaPingPong()} Recordale por WhatsApp</button>`;
        }
    } else if (meToca) {
        html += _htmlElegirPingPong(usadas);
    } else {
        html += `<div class="panel texto-centro">
            <div style="font-size:1.6rem;">🏓</div>
            <p>${otro} está eligiendo una pregunta para vos…</p>
        </div>
        <button class="btn-secundario btn-wa-pingpong" onclick="avisarTurnoPingPongWhatsApp()">${_iconoWaPingPong()} Avisale que le toca</button>`;
    }

    html += `<button class="btn-secundario" style="margin-top:14px;" onclick="verHistorialPingPong()">📜 Todas las preguntas y respuestas</button>`;
    cont.innerHTML = html;

    Object.entries(borrador).forEach(([id, valor]) => { const t = document.getElementById(id); if (t) t.value = valor; });
    if (enfocado) { const el = document.getElementById(enfocado); if (el) el.focus(); }
}

function _iconoWaPingPong(){ return `<svg class="icono-svg" style="color:#25D366;"><use href="#icono-whatsapp"></use></svg>`; }

function _htmlUltimaPingPong(u){
    const cat = _catPingPong(u.cat);
    const quien = u.por === miIdentidad ? 'Vos' : nombreJugador(u.por);
    const cuerpo = u.paso
        ? `<p class="texto-tenue" style="margin:6px 0 0;">🙈 ${quien === 'Vos' ? 'Pasaste' : quien + ' pasó'} esta pregunta.</p>`
        : `<p class="respuesta-pingpong">${escaparHtml(u.respuesta)}</p>`;
    return `<div class="panel ultima-pingpong">
        <div class="texto-tenue">${cat ? cat.icono : '✍️'} ${nombreJugador(u.de)} preguntó:</div>
        <div style="margin:4px 0 8px; font-weight:600;">${escaparHtml(u.pregunta)}</div>
        ${u.paso ? '' : `<div class="texto-tenue">${u.por === miIdentidad ? 'Respondiste:' : quien + ' respondió:'}</div>`}
        ${cuerpo}
    </div>`;
}

function _htmlElegirPingPong(usadas){
    const otro = nombreJugador(miRival);
    const cats = _indicePingPong();
    const quedanTotal = cats.reduce((n, c) => n + _restantesPingPong(c, usadas).length, 0);
    if (!quedanTotal) {
        return `<div class="panel texto-centro logro-animado">
            <div style="font-size:1.8rem;">🏆</div>
            <p>¡Usaron las ${_totalPingPong()} preguntas! Ya no queda ninguna sin salir.</p>
            <button class="btn-principal" onclick="barajarPingPong()">🔀 Barajar el mazo de nuevo</button>
        </div>`;
    }
    if (_ppCategoria !== 'sorpresa') {
        const c = _catPingPong(_ppCategoria);
        if (!c || !_restantesPingPong(c, usadas).length) _ppCategoria = 'sorpresa';
    }
    const chip = (id, icono, nombre, quedan) => `<button class="chip-pingpong${_ppCategoria === id ? ' activo' : ''}" ${quedan === 0 ? 'disabled' : ''} onclick="elegirCategoriaPingPong('${id}')">${icono} ${nombre}${quedan === null ? '' : ` <small>${quedan || '✓'}</small>`}</button>`;
    // Las categorías van plegadas abajo, así la pregunta queda a la vista.
    const actual = _ppCategoria === 'sorpresa' ? '🎲 Sorpresa' : (() => { const c = _catPingPong(_ppCategoria); return `${c.icono} ${c.nombre}`; })();
    const categorias = `<details class="panel categorias-pingpong"${_ppCategoriasAbiertas ? ' open' : ''} ontoggle="_ppCategoriasAbiertas = this.open">
        <summary>📂 Categoría: <b>${actual}</b></summary>
        <div class="chips-pingpong">
            ${chip('sorpresa', '🎲', 'Sorpresa', null)}
            ${cats.map(c => chip(c.id, c.icono, c.nombre, _restantesPingPong(c, usadas).length)).join('')}
        </div>
    </details>`;
    let html = `<div class="texto-centro" style="margin-bottom:10px;">🏓 Te toca preguntarle a ${otro}</div>`;

    if (_ppEscribiendoPropia) {
        html += `<div class="panel">
            <p class="texto-tenue" style="margin:0 0 8px;">✍️ Escribí tu propia pregunta para ${otro}:</p>
            <textarea id="propia-pingpong" class="textarea-pingpong" rows="3" maxlength="300" placeholder="¿Qué le querés preguntar?"></textarea>
            <button class="btn-principal btn-wa-pingpong" onclick="mandarPropiaPingPong(true)">${_iconoWaPingPong()} Mandar por WhatsApp</button>
            <div class="btn-fila" style="margin-top:8px;">
                <button class="btn-secundario" onclick="cancelarPropiaPingPong()">Volver</button>
                <button class="btn-secundario" onclick="mandarPropiaPingPong(false)">Sólo en la app</button>
            </div>
            <div id="error-pingpong" class="texto-tenue texto-centro" style="margin-top:6px;"></div>
        </div>`;
        return html;
    }

    if (!_ppCandidata) _ppCandidata = _sacarPingPong(usadas);
    const c = _ppCandidata;
    const cat = c && _catPingPong(c.cat);
    if (c) {
        html += `<div class="panel flip-carta tarjeta-pingpong">
            <div class="texto-tenue" style="margin-bottom:6px;">${cat.icono} ${cat.nombre}</div>
            <p class="pregunta-pingpong">${escaparHtml(c.texto)}</p>
            <button class="btn-principal btn-wa-pingpong" onclick="mandarPingPong(true)">${_iconoWaPingPong()} Mandársela por WhatsApp</button>
            <div class="btn-fila" style="margin-top:8px;">
                <button class="btn-secundario" onclick="otraPingPong()">🔄 Otra</button>
                <button class="btn-secundario" onclick="mandarPingPong(false)">Sólo en la app</button>
            </div>
        </div>`;
    }
    html += categorias;
    html += `<button class="btn-secundario" onclick="escribirPropiaPingPong()">✍️ Prefiero escribir la mía</button>`;
    return html;
}

// Saca una pregunta que nunca salió. En "sorpresa" primero se elige una
// categoría al azar (entre las que tienen preguntas) y después una
// pregunta de esa categoría, para que no salgan siempre de las más
// grandes.
function _sacarPingPong(usadas){
    let cats = _indicePingPong().filter(c => _restantesPingPong(c, usadas).length);
    if (_ppCategoria !== 'sorpresa') cats = cats.filter(c => c.id === _ppCategoria);
    if (!cats.length) return null;
    const cat = cats[Math.floor(Math.random() * cats.length)];
    const quedan = _restantesPingPong(cat, usadas);
    const p = quedan[Math.floor(Math.random() * quedan.length)];
    return { id: p.id, texto: p.texto, cat: cat.id };
}

function elegirCategoriaPingPong(id){
    vibrarJ(8);
    if (_ppCategoria === id && id !== 'sorpresa') return;
    _ppCategoria = id;
    _ppCandidata = null;
    renderPingPong();
}

// "Otra": la que se saltea también cuenta como usada, así no vuelve a salir.
async function otraPingPong(){
    vibrarJ(10);
    if (window.sfx) window.sfx.cartaFlip();
    const saltada = _ppCandidata;
    _ppCandidata = null;
    renderPingPong();
    if (!saltada) return;
    try {
        await window.setDoc(refPingPong(), { usadas: window.arrayUnion(saltada.id) }, { merge: true });
    } catch (e) { console.error('No se pudo marcar la pregunta como usada:', e); }
}

function escribirPropiaPingPong(){
    vibrarJ(10);
    _ppEscribiendoPropia = true;
    renderPingPong();
    setTimeout(() => { const t = document.getElementById('propia-pingpong'); if (t) t.focus(); }, 80);
}
function cancelarPropiaPingPong(){
    _ppEscribiendoPropia = false;
    renderPingPong();
}

function mandarPropiaPingPong(conWhatsApp){
    const texto = (document.getElementById('propia-pingpong')?.value || '').trim();
    const error = document.getElementById('error-pingpong');
    if (texto.length < 5) { if (error) error.innerText = 'Escribí una pregunta un poco más larga.'; return; }
    _enviarPingPong({ id: null, texto, cat: 'propia' }, conWhatsApp);
}

function mandarPingPong(conWhatsApp){
    if (!_ppCandidata) return;
    _enviarPingPong(_ppCandidata, conWhatsApp);
}

// WhatsApp se abre ANTES de guardar: si se abre después de esperar a
// Firestore, el navegador del celular lo bloquea como ventana emergente.
function _enviarPingPong(pregunta, conWhatsApp){
    vibrarJ(12);
    if (window.sfx) window.sfx.click();
    const e = _estadoPingPong;
    if (e && e.fase === 'respondiendo') return;
    if (e && e.fase && e.turno !== miIdentidad) return;
    if (conWhatsApp) {
        const u = e?.ultima;
        let texto = '';
        // Si lo último fue mi respuesta, va en el mismo mensaje: la
        // pelota vuelve con la respuesta y la pregunta nueva.
        if (u && u.por === miIdentidad) {
            texto += u.paso
                ? `🙈 Pasé tu pregunta "${u.pregunta}"\n\n`
                : `💬 Tu pregunta: "${u.pregunta}"\nMi respuesta: ${u.respuesta}\n\n`;
        }
        texto += `🏓 Ahora te pregunto yo:\n${pregunta.texto}\n\nRespondeme en la app y devolvemela: ${_enlacePingPong()}`;
        _abrirWhatsAppPingPong(texto);
    }
    const ref = refPingPong();
    window.conCandado(ref.path, () => window.runTransaction(window.db, async (tx) => {
        const snap = await tx.get(ref);
        const d = snap.exists() ? snap.data() : {};
        if (d.fase === 'respondiendo' || (d.fase && d.turno !== miIdentidad)) return;
        const usadas = d.usadas || [];
        tx.set(ref, {
            fase: 'respondiendo',
            turno: miRival,
            de: miIdentidad,
            pregunta: { texto: pregunta.texto, cat: pregunta.cat },
            usadas: pregunta.id && !usadas.includes(pregunta.id) ? [...usadas, pregunta.id] : usadas,
            enviadaEn: ahoraSync()
        }, { merge: true });
    })).then(() => {
        _ppCandidata = null;
        _ppEscribiendoPropia = false;
        renderPingPong();
    }).catch(err => console.error('No se pudo mandar la pregunta:', err));
}

async function responderPingPong(){
    const texto = (document.getElementById('respuesta-pingpong')?.value || '').trim();
    if (!texto) return;
    await _cerrarRondaPingPong(texto, false);
}

async function pasarPingPong(){
    if (!confirm('¿Pasás esta pregunta? Te toca a vos elegir la próxima.')) return;
    await _cerrarRondaPingPong(null, true);
}

// Respondí (o pasé): la pelota vuelve, y ahora me toca elegir a mí.
async function _cerrarRondaPingPong(respuesta, paso){
    vibrarJ(12);
    const ref = refPingPong();
    let ronda = null;
    try {
        await window.conCandado(ref.path, () => window.runTransaction(window.db, async (tx) => {
            ronda = null;
            const snap = await tx.get(ref);
            const d = snap.exists() ? snap.data() : null;
            if (!d || d.fase !== 'respondiendo' || d.turno !== miIdentidad) return;
            ronda = { pregunta: d.pregunta.texto, cat: d.pregunta.cat, de: d.de, por: miIdentidad, respuesta, paso, en: ahoraSync() };
            tx.update(ref, {
                fase: 'eligiendo', turno: miIdentidad, pregunta: null, ultima: ronda,
                pelotazos: (d.pelotazos || 0) + (paso ? 0 : 1)
            });
        }));
    } catch (e) {
        console.error('No se pudo guardar la respuesta:', e);
        return;
    }
    if (!ronda) return;
    _ppCandidata = null;
    if (window.sfx) window.sfx.revelar();
    try {
        await window.addDoc(window.collection(window.db, 'juegos'), { tipo: 'pingpong-ronda', ...ronda });
    } catch (e) { console.warn('No se pudo guardar en el historial del ping pong:', e); }
    if (!paso && typeof registrarEvento === 'function') {
        registrarEvento('reflexion_completada', `${nombreJugador(miIdentidad)} respondió una pregunta del Ping Pong`);
    }
}

async function barajarPingPong(){
    if (!confirm('¿Barajar de nuevo? Las preguntas van a poder volver a salir (el historial no se borra).')) return;
    vibrarJ([15, 30, 15]);
    if (window.sfx) window.sfx.dado();
    try {
        await window.setDoc(refPingPong(), { usadas: [] }, { merge: true });
    } catch (e) { console.error('No se pudo barajar:', e); }
}

// ==================== WHATSAPP ====================
function _enlacePingPong(){ return `${location.origin}${location.pathname}?juego=pingpong`; }
function _abrirWhatsAppPingPong(texto){
    const numero = (typeof NUMEROS_WHATSAPP_PAREJA !== 'undefined') && NUMEROS_WHATSAPP_PAREJA[miRival];
    if (!numero) return;
    window.open(`https://wa.me/${numero}?text=${encodeURIComponent(texto)}`, '_blank');
}
function recordarPingPongWhatsApp(){
    vibrarJ(10);
    const p = _estadoPingPong?.pregunta;
    if (!p) return;
    _abrirWhatsAppPingPong(`🏓 Te estoy esperando con esta pregunta:\n${p.texto}\n\nRespondeme acá: ${_enlacePingPong()}`);
}
function avisarTurnoPingPongWhatsApp(){
    vibrarJ(10);
    _abrirWhatsAppPingPong(`🏓 Te toca mandarme una pregunta en el Ping Pong 😏\n${_enlacePingPong()}`);
}

// ==================== HISTORIAL ====================
function verHistorialPingPong(){
    vibrarJ(10);
    _ppVista = 'historial';
    const cont = document.getElementById('contenido-pingpong');
    cont.innerHTML = `<div class="panel texto-centro texto-tenue">Cargando…</div>`;
    if (window._unsubPingPongHistorial) window._unsubPingPongHistorial();
    const q = window.query(window.collection(window.db, 'juegos'), window.where('tipo', '==', 'pingpong-ronda'));
    window._unsubPingPongHistorial = window.onSnapshot(q, (snap) => {
        if (_ppVista !== 'historial') return;
        const rondas = [];
        snap.forEach(d => rondas.push(d.data()));
        rondas.sort((a, b) => (b.en || 0) - (a.en || 0));
        let html = `<button class="btn-secundario" style="margin-bottom:12px;" onclick="volverPingPong()">⬅️ Volver al ping pong</button>`;
        if (!rondas.length) {
            html += `<div class="panel texto-centro texto-tenue">Todavía no respondieron ninguna pregunta.</div>`;
        } else {
            html += `<div class="texto-tenue texto-centro" style="margin-bottom:8px;">${rondas.filter(r => !r.paso).length} respuestas guardadas</div>`;
            html += rondas.map(r => {
                const cat = _catPingPong(r.cat);
                const fecha = r.en ? new Date(r.en).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' }) : '';
                return `<div class="panel ultima-pingpong">
                    <div class="texto-tenue">${cat ? cat.icono : '✍️'} ${nombreJugador(r.de)} → ${nombreJugador(r.por)} · ${fecha}</div>
                    <div style="margin:4px 0 6px; font-weight:600;">${escaparHtml(r.pregunta)}</div>
                    ${r.paso ? `<div class="texto-tenue">🙈 La pasó</div>` : `<p class="respuesta-pingpong">${escaparHtml(r.respuesta)}</p>`}
                </div>`;
            }).join('');
        }
        cont.innerHTML = html;
    }, (err) => console.error('Error de Firestore en historial del ping pong:', err));
}

function volverPingPong(){
    vibrarJ(10);
    if (window._unsubPingPongHistorial) { window._unsubPingPongHistorial(); window._unsubPingPongHistorial = null; }
    _ppVista = 'juego';
    renderPingPong();
}
