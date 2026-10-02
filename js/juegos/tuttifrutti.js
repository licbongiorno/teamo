// ==================== TUTTI FRUTTI EN VIVO ====================
// Los dos reciben la misma letra y 5 categorías. Cada uno completa en
// su pantalla; el primero que llena todo puede cantar "¡BASTA!" y la
// ronda se corta para los dos (lo que el otro tenía escrito se guarda
// igual). Después cada uno revisa las respuestas del otro y puede
// rechazar las que no valgan. Puntaje por categoría: 10 si es válida,
// 5 si los dos pusieron lo mismo, 20 si el otro no tiene una válida.
// Las transiciones (basta, confirmar, rechazar) van en transacciones.
const LETRAS_TUTTI = 'ABCDEFGHIJLMNOPRSTUV'.split('');
const CATEGORIAS_TUTTI = [
    'Nombre', 'Animal', 'País o ciudad', 'Comida', 'Color', 'Fruta o verdura', 'Cosa',
    'Profesión', 'Marca', 'Película o serie', 'Cantante o banda', 'Deporte',
    'Parte del cuerpo', 'Objeto de la casa', 'Algo que se regala', 'Lugar para una cita',
    'Apodo cariñoso', 'Planta o flor', 'Prenda de ropa', 'Algo que hay en la playa',
];
const ESPERA_REVISION_TUTTI_MS = 3000;

function refTutti(){ return window.doc(window.db, 'juegos', 'tuttifrutti'); }
function _campoTutti(base, j){ return base + (j === 'nico' ? 'Nico' : 'Carito'); }
function normalizarTutti(t){
    return String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
}
function empiezaConLetraTutti(t, letra){
    const n = normalizarTutti(t);
    return n.length > 1 && n[0] === letra.toLowerCase();
}

// ¿Vale la respuesta i de "jugador"? (no vacía, empieza con la letra y
// el otro no la rechazó).
function esValidaTutti(estado, jugador, i){
    const resp = (estado[_campoTutti('respuestas', jugador)] || [])[i];
    if (!empiezaConLetraTutti(resp, estado.letra)) return false;
    const otro = jugador === 'nico' ? 'carito' : 'nico';
    return !(estado[_campoTutti('rechazos', otro)] || []).includes(i);
}
function calcularPuntosTutti(estado){
    const puntos = { nico: [], carito: [] };
    for (let i = 0; i < 5; i++) {
        const vN = esValidaTutti(estado, 'nico', i), vC = esValidaTutti(estado, 'carito', i);
        const iguales = vN && vC && normalizarTutti(estado.respuestasNico[i]) === normalizarTutti(estado.respuestasCarito[i]);
        puntos.nico.push(!vN ? 0 : (iguales ? 5 : (vC ? 10 : 20)));
        puntos.carito.push(!vC ? 0 : (iguales ? 5 : (vN ? 10 : 20)));
    }
    return puntos;
}

// Estado local de la ronda que se está jugando en este dispositivo.
let _tuttiRondaDibujada = null;   // ronda cuyo formulario ya está en pantalla
let _tuttiMias = ['', '', '', '', ''];
let _tuttiTimerGuardar = null;
let _tuttiRondaVolcada = null;    // ronda en la que ya guardé mis respuestas tras el "basta"
let _tuttiCorrigiendoDesde = {};  // ronda -> hora local en que vi el "basta"
let _tuttiFaseAnterior = null;

function iniciarTuttiFrutti(){
    if (window._unsubTuttiFrutti) window._unsubTuttiFrutti();
    _tuttiRondaDibujada = null;
    _tuttiFaseAnterior = null;
    window._unsubTuttiFrutti = window.onSnapshot(refTutti(), (snap) => {
        const datos = snap.exists() ? snap.data() : null;
        if (datos && datos.fase === 'corrigiendo' && _tuttiFaseAnterior === 'jugando') {
            vibrarJ([20, 40, 20]);
            if (window.sfx) window.sfx.explosion();
        }
        _tuttiFaseAnterior = datos ? datos.fase : null;
        renderTuttiFrutti(datos);
    }, (err) => {
        console.error('Error de Firestore en tutti frutti:', err);
        document.getElementById('contenido-tuttifrutti').innerHTML = `<div class="panel texto-centro texto-tenue">⚠️ No se pudo conectar (${err.code || 'error'}).</div>`;
    });
}

function _escTutti(t){ return (typeof escaparHtml === 'function') ? escaparHtml(String(t || '')) : String(t || '').replace(/</g, '&lt;'); }

function renderTuttiFrutti(estado){
    const cont = document.getElementById('contenido-tuttifrutti');
    if (!cont) return;
    const puntajes = estado?.puntajes || { nico: 0, carito: 0 };
    const marcador = `<div class="texto-tenue texto-centro" style="margin-bottom:8px;">Nico ${puntajes.nico || 0} — Carito ${puntajes.carito || 0}</div>`;

    if (!estado || estado.fase === 'esperando' || estado.fase === 'resultado') {
        _tuttiRondaDibujada = null;
        const listoYo = estado?.listos?.[miIdentidad];
        const listoRival = estado?.listos?.[miRival];
        let html = marcador;
        if (estado?.fase === 'resultado') html += htmlResultadoTutti(estado);
        else html += `<div class="panel texto-centro"><p class="texto-tenue">Misma letra y mismas categorías para los dos. El primero que completa todo puede cantar <b>¡BASTA!</b> y se corta para los dos. Después se revisan las respuestas entre ustedes.</p></div>`;
        html += `<div class="panel texto-centro">
            <div class="texto-tenue" style="margin-bottom:10px;">
                ${nombreJugador(miIdentidad)}: ${listoYo ? '✅ listo/a' : '⏳ esperando'}<br>
                ${nombreJugador(miRival)}: ${listoRival ? '✅ listo/a' : '⏳ esperando'}
            </div>
            <button class="btn-principal" ${listoYo ? 'disabled style="opacity:0.5;"' : ''} onclick="marcarListoTuttiFrutti()">${listoYo ? 'Esperando al otro…' : (estado?.fase === 'resultado' ? 'Otra ronda 🔤' : '¡Estoy listo/a! 🔤')}</button>
        </div>`;
        cont.innerHTML = html;
        return;
    }

    if (estado.fase === 'jugando') {
        const rivales = (estado[_campoTutti('respuestas', miRival)] || []).filter(r => normalizarTutti(r)).length;
        if (_tuttiRondaDibujada !== estado.ronda) {
            // El formulario se arma UNA vez por ronda: si se redibujara con
            // cada actualización, se borraría lo que estás escribiendo.
            _tuttiRondaDibujada = estado.ronda;
            _tuttiMias = [...(estado[_campoTutti('respuestas', miIdentidad)] || ['', '', '', '', ''])];
            while (_tuttiMias.length < 5) _tuttiMias.push('');
            cont.innerHTML = marcador + `<div class="panel texto-centro">
                <div class="texto-tenue">Ronda ${estado.ronda} — letra</div>
                <div class="letra-tutti">${estado.letra}</div>
                <div id="progreso-rival-tutti" class="texto-tenue" style="font-size:0.8rem;"></div>
            </div>
            <div class="panel">
                ${estado.categorias.map((c, i) => `<label class="campo-tutti"><span>${c}</span>
                    <input type="text" id="input-tutti-${i}" maxlength="40" autocomplete="off" value="${_escTutti(_tuttiMias[i]).replace(/"/g, '&quot;')}" oninput="escribirTuttiFrutti(${i}, this.value)"></label>`).join('')}
                <button class="btn-principal" id="btn-basta-tutti" style="margin-top:12px;" onclick="cantarBastaTuttiFrutti()">✋ ¡BASTA!</button>
                <div id="aviso-tutti" class="texto-tenue" style="font-size:0.8rem; margin-top:6px;"></div>
            </div>`;
        }
        const prog = document.getElementById('progreso-rival-tutti');
        if (prog) prog.innerText = `${nombreJugador(miRival)} lleva ${rivales} de 5`;
        actualizarBotonBastaTutti(estado.letra);
        return;
    }

    if (estado.fase === 'corrigiendo') {
        _tuttiRondaDibujada = null;
        // Si el "basta" lo cantó el otro, guardo YA lo que tenía escrito.
        if (_tuttiRondaVolcada !== estado.ronda && estado.bastaDe !== miIdentidad) {
            _tuttiRondaVolcada = estado.ronda;
            if (_tuttiTimerGuardar) { clearTimeout(_tuttiTimerGuardar); _tuttiTimerGuardar = null; }
            window.updateDoc(refTutti(), { [_campoTutti('respuestas', miIdentidad)]: [..._tuttiMias] }).catch(() => {});
        }
        if (!_tuttiCorrigiendoDesde[estado.ronda]) _tuttiCorrigiendoDesde[estado.ronda] = Date.now();
        cont.innerHTML = marcador + htmlRevisionTutti(estado);
        const falta = ESPERA_REVISION_TUTTI_MS - (Date.now() - _tuttiCorrigiendoDesde[estado.ronda]);
        if (falta > 0) setTimeout(() => {
            const b = document.getElementById('btn-confirmar-tutti');
            if (b && !estado[_campoTutti('confirmado', miIdentidad)]) { b.disabled = false; b.style.opacity = ''; b.innerText = '✅ Listo, revisé'; }
        }, falta);
    }
}

function htmlRevisionTutti(estado){
    const misResp = estado[_campoTutti('respuestas', miIdentidad)] || [];
    const susResp = estado[_campoTutti('respuestas', miRival)] || [];
    const misRechazos = estado[_campoTutti('rechazos', miIdentidad)] || [];
    const confirmeYo = !!estado[_campoTutti('confirmado', miIdentidad)];
    const confirmoRival = !!estado[_campoTutti('confirmado', miRival)];
    const esperando = (Date.now() - (_tuttiCorrigiendoDesde[estado.ronda] || Date.now())) < ESPERA_REVISION_TUTTI_MS;
    let html = `<div class="panel texto-centro">
        <div style="font-size:1.1rem;">✋ ¡${nombreJugador(estado.bastaDe)} cantó BASTA!</div>
        <div class="texto-tenue" style="font-size:0.8rem;">Letra ${estado.letra}. Tocá ✓/✗ en las respuestas de ${nombreJugador(miRival)} para aceptarlas o rechazarlas.</div>
    </div><div class="panel"><table class="planilla-generala tabla-tutti"><thead><tr><th></th><th>Vos</th><th>${nombreJugador(miRival)}</th></tr></thead><tbody>`;
    estado.categorias.forEach((c, i) => {
        const miaOk = empiezaConLetraTutti(misResp[i], estado.letra);
        const suyaOk = empiezaConLetraTutti(susResp[i], estado.letra);
        const rechazada = misRechazos.includes(i);
        const meRechazo = (estado[_campoTutti('rechazos', miRival)] || []).includes(i);
        html += `<tr><td>${c}</td>
            <td class="${!miaOk || meRechazo ? 'resp-invalida-tutti' : ''}">${_escTutti(misResp[i]) || '—'}${meRechazo ? ' <span title="Rechazada por el otro">✗</span>' : ''}</td>
            <td class="${!suyaOk || rechazada ? 'resp-invalida-tutti' : ''}">${_escTutti(susResp[i]) || '—'}
                ${suyaOk && !confirmeYo ? `<button class="btn-rechazo-tutti" onclick="rechazarTuttiFrutti(${i})">${rechazada ? '✗' : '✓'}</button>` : ''}</td></tr>`;
    });
    html += `</tbody></table></div><div class="panel texto-centro">`;
    if (confirmeYo) html += `<div class="texto-tenue destello">${confirmoRival ? 'Calculando…' : `Esperando que ${nombreJugador(miRival)} termine de revisar…`}</div>`;
    else html += `<button class="btn-principal" id="btn-confirmar-tutti" ${esperando ? 'disabled style="opacity:0.5;"' : ''} onclick="confirmarRevisionTuttiFrutti()">${esperando ? 'Guardando respuestas…' : '✅ Listo, revisé'}</button>`;
    html += `</div>`;
    return html;
}

function htmlResultadoTutti(estado){
    const p = estado.puntosRonda || { nico: [], carito: [] };
    const suma = (a) => (a || []).reduce((t, v) => t + v, 0);
    let html = `<div class="panel"><div class="texto-centro" style="margin-bottom:8px;">Ronda ${estado.ronda} — letra <b>${estado.letra}</b></div>
        <table class="planilla-generala tabla-tutti"><thead><tr><th></th><th>Nico</th><th>Carito</th></tr></thead><tbody>`;
    estado.categorias.forEach((c, i) => {
        html += `<tr><td>${c}</td>
            <td>${_escTutti((estado.respuestasNico || [])[i]) || '—'} <b>+${p.nico[i] || 0}</b></td>
            <td>${_escTutti((estado.respuestasCarito || [])[i]) || '—'} <b>+${p.carito[i] || 0}</b></td></tr>`;
    });
    html += `<tr class="fila-total-generala"><td>Ronda</td><td>${suma(p.nico)}</td><td>${suma(p.carito)}</td></tr></tbody></table></div>`;
    return html;
}

function actualizarBotonBastaTutti(letra){
    const btn = document.getElementById('btn-basta-tutti');
    if (!btn) return;
    const completas = _tuttiMias.filter(r => empiezaConLetraTutti(r, letra)).length;
    btn.disabled = completas < 5;
    btn.style.opacity = completas < 5 ? '0.5' : '';
    const aviso = document.getElementById('aviso-tutti');
    if (aviso) aviso.innerText = completas < 5 ? `Completá las 5 (con la ${letra}) para poder cantar basta. Llevás ${completas}.` : '¡Ya podés cantar basta!';
}

// Lo que escribís se guarda solo (cada ~1 s), así si el otro canta
// basta, cuenta lo que tenías.
function escribirTuttiFrutti(i, valor){
    _tuttiMias[i] = valor;
    const letra = document.querySelector('.letra-tutti')?.innerText || '';
    actualizarBotonBastaTutti(letra);
    if (_tuttiTimerGuardar) clearTimeout(_tuttiTimerGuardar);
    _tuttiTimerGuardar = setTimeout(() => {
        _tuttiTimerGuardar = null;
        const ronda = _tuttiRondaDibujada;
        const ref = refTutti();
        window.runTransaction(window.db, async (tx) => {
            const snap = await tx.get(ref);
            const e = snap.exists() ? snap.data() : null;
            if (!e || e.fase !== 'jugando' || e.ronda !== ronda) return;
            tx.update(ref, { [_campoTutti('respuestas', miIdentidad)]: [..._tuttiMias] });
        }).catch(() => {});
    }, 1000);
}

async function marcarListoTuttiFrutti(){
    vibrarJ(12);
    const ref = refTutti();
    await window.runTransaction(window.db, async (tx) => {
        const snap = await tx.get(ref);
        const estado = snap.exists() ? snap.data() : null;
        if (estado && (estado.fase === 'jugando' || estado.fase === 'corrigiendo')) return;
        if (estado?.listos?.[miIdentidad]) return;
        const listos = { ...(estado?.listos || {}), [miIdentidad]: true };
        const base = { puntajes: estado?.puntajes || { nico: 0, carito: 0 }, ronda: estado?.ronda || 0 };
        if (listos.nico && listos.carito) {
            const pool = [...CATEGORIAS_TUTTI].sort(() => Math.random() - 0.5);
            tx.set(ref, {
                ...base, fase: 'jugando', listos: {}, ronda: base.ronda + 1,
                letra: LETRAS_TUTTI[Math.floor(Math.random() * LETRAS_TUTTI.length)],
                categorias: pool.slice(0, 5),
                respuestasNico: ['', '', '', '', ''], respuestasCarito: ['', '', '', '', ''],
                rechazosNico: [], rechazosCarito: [], confirmadoNico: false, confirmadoCarito: false,
                bastaDe: null, puntosRonda: null
            });
        } else if (estado?.fase === 'resultado') {
            tx.update(ref, { listos });
        } else {
            tx.set(ref, { ...base, fase: 'esperando', listos }, { merge: true });
        }
    });
}

async function cantarBastaTuttiFrutti(){
    const ronda = _tuttiRondaDibujada;
    const mias = [..._tuttiMias];
    const res = await window.jugadaSegura(refTutti(), (estado) => {
        if (!estado || estado.fase !== 'jugando' || estado.ronda !== ronda) return null;
        if (mias.filter(r => empiezaConLetraTutti(r, estado.letra)).length < 5) return null;
        return { fase: 'corrigiendo', bastaDe: miIdentidad, [_campoTutti('respuestas', miIdentidad)]: mias };
    });
    if (res && _tuttiTimerGuardar) { clearTimeout(_tuttiTimerGuardar); _tuttiTimerGuardar = null; }
}

async function rechazarTuttiFrutti(i){
    vibrarJ(8);
    const campo = _campoTutti('rechazos', miIdentidad);
    const ref = refTutti();
    await window.runTransaction(window.db, async (tx) => {
        const snap = await tx.get(ref);
        const e = snap.exists() ? snap.data() : null;
        if (!e || e.fase !== 'corrigiendo' || e[_campoTutti('confirmado', miIdentidad)]) return;
        const lista = [...(e[campo] || [])];
        const pos = lista.indexOf(i);
        if (pos >= 0) lista.splice(pos, 1); else lista.push(i);
        tx.update(ref, { [campo]: lista });
    }).catch(e => console.warn('No se pudo marcar la respuesta:', e));
}

async function confirmarRevisionTuttiFrutti(){
    vibrarJ(12);
    const ref = refTutti();
    let cerro = null;
    await window.runTransaction(window.db, async (tx) => {
        cerro = null;
        const snap = await tx.get(ref);
        const e = snap.exists() ? snap.data() : null;
        if (!e || e.fase !== 'corrigiendo') return;
        const cambios = { [_campoTutti('confirmado', miIdentidad)]: true };
        if (e[_campoTutti('confirmado', miRival)]) {
            const puntosRonda = calcularPuntosTutti({ ...e, ...cambios });
            const puntajes = { ...(e.puntajes || { nico: 0, carito: 0 }) };
            puntajes.nico = (puntajes.nico || 0) + puntosRonda.nico.reduce((t, v) => t + v, 0);
            puntajes.carito = (puntajes.carito || 0) + puntosRonda.carito.reduce((t, v) => t + v, 0);
            Object.assign(cambios, { fase: 'resultado', puntosRonda, puntajes, listos: {} });
            cerro = puntosRonda;
        }
        tx.update(ref, cambios);
    }).catch(e => console.warn('No se pudo confirmar la revisión:', e));
    if (cerro && typeof registrarEvento === 'function') {
        registrarEvento('gano_partida', `Jugaron una ronda de Tutti Frutti`);
    }
    if (cerro && typeof registrarVictoria === 'function') registrarVictoria('tuttifrutti', ganadorPorPuntos({ nico: cerro.nico.reduce((t, v) => t + v, 0), carito: cerro.carito.reduce((t, v) => t + v, 0) }));
}
