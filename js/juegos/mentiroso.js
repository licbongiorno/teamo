// ==================== MENTIROSO (DADOS) ====================
// El "Perudo"/"Dudo" de a dos. Cada uno arranca con 5 dados que sólo ve
// él. Por turnos se apuesta cuántos dados de una cara hay ENTRE LOS DOS
// cubiletes ("hay cuatro 5"): cada apuesta tiene que subir la cantidad,
// o mantenerla con una cara más alta. Los 1 (ases) son comodines y
// cuentan para cualquier cara, por eso no se apuesta a los 1.
// En vez de subir se puede decir "¡Dudo!": se levantan los cubiletes y
// si la apuesta no se cumple pierde un dado quien apostó; si se cumple,
// lo pierde quien dudó. Quien pierde un dado empieza la ronda siguiente.
// Quien se queda sin dados pierde la partida.
// Todo va por jugadaSegura (js/jugada-segura.js): turno, validez de la
// apuesta y resultado se deciden en la misma transacción.
const DADOS_INICIALES_MENTIROSO = 5;
const CARAS_DADO_MENTIROSO = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

function refMentiroso(){ return window.doc(window.db, 'juegos', 'mentiroso'); }

function tirarDadosMentiroso(n){
    return Array.from({ length: n }, () => 1 + Math.floor(Math.random() * 6));
}
function campoDadosMentiroso(j){ return j === 'nico' ? 'dadosNico' : 'dadosCarito'; }

// Cuántos dados de esa cara hay entre los dos (los 1 cuentan como comodín).
function contarCaraMentiroso(dadosNico, dadosCarito, cara){
    return [...(dadosNico || []), ...(dadosCarito || [])].filter(d => d === cara || d === 1).length;
}

// ¿La apuesta nueva sube a la anterior?
function apuestaValidaMentiroso(anterior, cantidad, cara, totalDados){
    if (!(cara >= 2 && cara <= 6) || !(cantidad >= 1) || cantidad > totalDados) return false;
    if (!anterior) return true;
    return cantidad > anterior.cantidad || (cantidad === anterior.cantidad && cara > anterior.cara);
}

let _mentirosoFaseAnterior = null;
let _estadoMentiroso = null;
let _apuestaElegidaMentiroso = { cantidad: 1, cara: 2 };

function iniciarMentiroso(){
    if (window._unsubMentiroso) window._unsubMentiroso();
    _mentirosoFaseAnterior = null;
    window._unsubMentiroso = window.onSnapshot(refMentiroso(), (snap) => {
        const datos = snap.exists() ? snap.data() : null;
        if (datos && _mentirosoFaseAnterior === 'jugando' && window.sfx) {
            if (datos.fase === 'terminado') {
                window.sfx[datos.ganador === miIdentidad ? 'victoria' : 'derrota']();
                if (window.fx && datos.ganador === miIdentidad) window.fx.confeti();
            } else if (datos.fase === 'revelado') {
                window.sfx.revelar();
            }
        }
        _mentirosoFaseAnterior = datos ? datos.fase : null;
        _estadoMentiroso = datos;
        // Arranca el selector justo arriba de la apuesta vigente.
        if (datos && datos.fase === 'jugando') {
            const a = datos.apuesta;
            _apuestaElegidaMentiroso = a
                ? (a.cara < 6 ? { cantidad: a.cantidad, cara: a.cara + 1 } : { cantidad: a.cantidad + 1, cara: 2 })
                : { cantidad: 1, cara: 2 };
        }
        renderMentiroso(datos);
    }, (err) => {
        console.error('Error de Firestore en mentiroso:', err);
        document.getElementById('contenido-mentiroso').innerHTML = `<div class="panel texto-centro texto-tenue">⚠️ No se pudo conectar (${err.code || 'error'}).</div>`;
    });
}

function htmlDadosMentiroso(dados){
    return `<div class="fila-dados-generala">${(dados || []).map(d => `<span class="dado-generala dado-mentiroso" aria-label="Dado ${d}">${CARAS_DADO_MENTIROSO[d]}</span>`).join('')}</div>`;
}
function htmlTapadosMentiroso(n){
    return `<div class="fila-dados-generala">${Array.from({ length: n }, () => `<span class="dado-generala dado-mentiroso dado-tapado">?</span>`).join('')}</div>`;
}
function textoApuestaMentiroso(a){
    return `${a.cantidad} × ${CARAS_DADO_MENTIROSO[a.cara]} <span class="texto-tenue">(${a.cantidad} ${a.cantidad === 1 ? 'dado' : 'dados'} de ${a.cara})</span>`;
}

function renderMentiroso(estado){
    const cont = document.getElementById('contenido-mentiroso');
    if (!cont) return;
    const victorias = estado?.victorias || { nico: 0, carito: 0 };
    const cabecera = `<div class="texto-tenue texto-centro" style="margin-bottom:6px;">Partidas: Nico ${victorias.nico || 0} — Carito ${victorias.carito || 0}</div>`;

    if (!estado || estado.fase === 'esperando') {
        const listoYo = estado?.listos?.[miIdentidad];
        const listoRival = estado?.listos?.[miRival];
        cont.innerHTML = cabecera + `<div class="panel texto-centro">
            <p class="texto-tenue">Cada uno tiene 5 dados que sólo ve él. Por turnos apuesten cuántos dados de una cara hay entre los dos (los ⚀ son comodines). Subí la apuesta o decí <b>¡Dudo!</b>: quien se equivoca pierde un dado. Gana quien se queda con dados.</p>
            <div class="texto-tenue" style="margin-bottom:10px;">
                ${nombreJugador(miIdentidad)}: ${listoYo ? '✅ listo/a' : '⏳ esperando'}<br>
                ${nombreJugador(miRival)}: ${listoRival ? '✅ listo/a' : '⏳ esperando'}
            </div>
            <button class="btn-principal" ${listoYo ? 'disabled style="opacity:0.5;"' : ''} onclick="marcarListoMentiroso()">${listoYo ? 'Esperando al otro…' : '¡Estoy listo/a! 🎲'}</button>
        </div>`;
        return;
    }

    const misDados = estado[campoDadosMentiroso(miIdentidad)] || [];
    const cantRival = (estado[campoDadosMentiroso(miRival)] || []).length;
    let html = cabecera;

    if (estado.fase === 'revelado' || estado.fase === 'terminado') {
        const r = estado.resultado || {};
        html += `<div class="panel texto-centro logro-animado">
            <div class="texto-tenue">${nombreJugador(r.dudo)} dudó de la apuesta de ${nombreJugador(r.aposto)}:</div>
            <div style="font-size:1.1rem; margin:6px 0;">${r.apuesta ? textoApuestaMentiroso(r.apuesta) : ''}</div>
            <div>Había <b>${r.total}</b> → ${r.cumplida ? '✅ la apuesta se cumplía' : '❌ la apuesta era mentira'}</div>
            <div style="margin-top:6px;">${nombreJugador(r.perdedor)} pierde un dado</div>
        </div>
        <div class="panel"><div class="texto-tenue texto-centro">💙 Nico</div>${htmlDadosMentiroso(r.dadosNico)}
            <div class="texto-tenue texto-centro" style="margin-top:8px;">💖 Carito</div>${htmlDadosMentiroso(r.dadosCarito)}</div>`;
        if (estado.fase === 'terminado') {
            html += `<div class="panel texto-centro"><div style="font-size:1.2rem; margin-bottom:10px;">🏆 ¡Ganó ${nombreJugador(estado.ganador)}!</div>
                <button class="btn-principal" onclick="reiniciarMentiroso()">🔁 Revancha</button></div>`;
        } else {
            html += `<button class="btn-principal" onclick="siguienteRondaMentiroso()">Siguiente ronda ▶️</button>`;
        }
        cont.innerHTML = html;
        return;
    }

    // fase 'jugando'
    const esMiTurno = estado.turno === miIdentidad;
    const a = estado.apuesta;
    const total = misDados.length + cantRival;
    html += `<div class="panel texto-centro">
        <div class="texto-tenue">Tus dados (${misDados.length})</div>${htmlDadosMentiroso(misDados)}
        <div class="texto-tenue" style="margin-top:10px;">${nombreJugador(miRival)} (${cantRival})</div>${htmlTapadosMentiroso(cantRival)}
    </div>
    <div class="panel texto-centro">
        <div class="texto-tenue">Apuesta actual</div>
        <div style="font-size:1.2rem; margin-top:4px;">${a ? `${textoApuestaMentiroso(a)}<div class="texto-tenue" style="font-size:0.8rem;">de ${nombreJugador(a.de)}</div>` : '—'}</div>
    </div>
    <div class="info-turno-tablero">${esMiTurno ? '🎯 Tu turno' : `Turno de ${nombreJugador(estado.turno)}…`}</div>`;

    if (esMiTurno) {
        const e = _apuestaElegidaMentiroso;
        const valida = apuestaValidaMentiroso(a, e.cantidad, e.cara, total);
        html += `<div class="panel texto-centro">
            <div class="selector-apuesta-mentiroso">
                <button class="btn-secundario" onclick="cambiarApuestaMentiroso('cantidad', -1)" aria-label="Menos">−</button>
                <span class="valor-apuesta-mentiroso">${e.cantidad}</span>
                <button class="btn-secundario" onclick="cambiarApuestaMentiroso('cantidad', 1)" aria-label="Más">+</button>
                <span class="texto-tenue">×</span>
                <button class="btn-secundario" onclick="cambiarApuestaMentiroso('cara', -1)" aria-label="Cara anterior">‹</button>
                <span class="valor-apuesta-mentiroso">${CARAS_DADO_MENTIROSO[e.cara]}</span>
                <button class="btn-secundario" onclick="cambiarApuestaMentiroso('cara', 1)" aria-label="Cara siguiente">›</button>
            </div>
            <div class="btn-fila" style="margin-top:10px;">
                <button class="btn-principal" ${valida ? '' : 'disabled style="opacity:0.4;"'} onclick="apostarMentiroso()">Apostar</button>
                ${a ? `<button class="btn-secundario" onclick="dudarMentiroso()">🤨 ¡Dudo!</button>` : ''}
            </div>
            ${valida ? '' : `<div class="texto-tenue" style="font-size:0.78rem; margin-top:6px;">Tiene que superar la apuesta actual (más dados, o los mismos con una cara más alta).</div>`}
        </div>`;
    }
    cont.innerHTML = html;
}

function cambiarApuestaMentiroso(campo, delta){
    vibrarJ(8);
    const e = _apuestaElegidaMentiroso;
    if (campo === 'cantidad') e.cantidad = Math.max(1, Math.min(DADOS_INICIALES_MENTIROSO * 2, e.cantidad + delta));
    else e.cara = Math.max(2, Math.min(6, e.cara + delta));
    // Redibuja con el último estado conocido (sin consultar a Firestore).
    if (_estadoMentiroso) renderMentiroso(_estadoMentiroso);
}

async function marcarListoMentiroso(){
    vibrarJ(12);
    const ref = refMentiroso();
    await window.runTransaction(window.db, async (tx) => {
        const snap = await tx.get(ref);
        const estado = snap.exists() ? snap.data() : null;
        if (estado?.fase === 'jugando' || estado?.fase === 'revelado' || estado?.listos?.[miIdentidad]) return;
        const listos = { ...(estado?.listos || {}), [miIdentidad]: true };
        const victorias = estado?.victorias || { nico: 0, carito: 0 };
        if (listos.nico && listos.carito) {
            tx.set(ref, {
                fase: 'jugando', listos, victorias,
                dadosNico: tirarDadosMentiroso(DADOS_INICIALES_MENTIROSO),
                dadosCarito: tirarDadosMentiroso(DADOS_INICIALES_MENTIROSO),
                turno: Math.random() < 0.5 ? 'nico' : 'carito',
                apuesta: null, resultado: null, ganador: null
            });
        } else {
            tx.set(ref, { fase: 'esperando', listos, victorias }, { merge: true });
        }
    });
}

async function apostarMentiroso(){
    const { cantidad, cara } = _apuestaElegidaMentiroso;
    const res = await window.jugadaSegura(refMentiroso(), (estado) => {
        if (!estado || estado.fase !== 'jugando' || estado.turno !== miIdentidad) return null;
        const total = (estado.dadosNico || []).length + (estado.dadosCarito || []).length;
        if (!apuestaValidaMentiroso(estado.apuesta, cantidad, cara, total)) return null;
        return { apuesta: { cantidad, cara, de: miIdentidad }, turno: miRival };
    });
    if (!res) { vibrarJ([10, 30, 10]); return; }
    vibrarJ(12);
    if (window.sfx) window.sfx.toque();
}

async function dudarMentiroso(){
    const res = await window.jugadaSegura(refMentiroso(), (estado) => {
        if (!estado || estado.fase !== 'jugando' || estado.turno !== miIdentidad) return null;
        const a = estado.apuesta;
        if (!a || a.de === miIdentidad) return null;
        const total = contarCaraMentiroso(estado.dadosNico, estado.dadosCarito, a.cara);
        const cumplida = total >= a.cantidad;
        const perdedor = cumplida ? miIdentidad : a.de;
        const campo = campoDadosMentiroso(perdedor);
        const quedan = (estado[campo] || []).length - 1;
        const cambios = {
            fase: quedan > 0 ? 'revelado' : 'terminado',
            resultado: {
                apuesta: { cantidad: a.cantidad, cara: a.cara }, aposto: a.de, dudo: miIdentidad,
                total, cumplida, perdedor,
                dadosNico: estado.dadosNico || [], dadosCarito: estado.dadosCarito || []
            },
            // El que perdió el dado empieza la ronda siguiente.
            turno: perdedor,
            [campo]: (estado[campo] || []).slice(0, Math.max(0, quedan)),
        };
        if (quedan <= 0) {
            const ganador = perdedor === 'nico' ? 'carito' : 'nico';
            const v = { ...(estado.victorias || { nico: 0, carito: 0 }) };
            v[ganador] = (v[ganador] || 0) + 1;
            cambios.ganador = ganador;
            cambios.victorias = v;
        }
        return cambios;
    });
    if (!res) { vibrarJ([10, 30, 10]); return; }
    vibrarJ([15, 30, 15]);
    if (res.cambios.fase === 'terminado') {
        const g = res.cambios.ganador;
        if (typeof registrarEvento === 'function') registrarEvento('gano_partida', `${nombreJugador(g)} ganó al Mentiroso`);
        if (typeof registrarVictoria === 'function') registrarVictoria('mentiroso', g);
    }
}

// Pasa de 'revelado' a una ronda nueva con los dados que le quedan a
// cada uno. Lo puede tocar cualquiera de los dos; la transacción evita
// que se tire dos veces.
async function siguienteRondaMentiroso(){
    vibrarJ(12);
    await window.jugadaSegura(refMentiroso(), (estado) => {
        if (!estado || estado.fase !== 'revelado') return null;
        return {
            fase: 'jugando', apuesta: null,
            dadosNico: tirarDadosMentiroso((estado.dadosNico || []).length),
            dadosCarito: tirarDadosMentiroso((estado.dadosCarito || []).length),
        };
    });
}

// Sólo con la partida terminada: nadie le reinicia al otro una partida en curso.
async function reiniciarMentiroso(){
    vibrarJ(12);
    const ref = refMentiroso();
    await window.runTransaction(window.db, async (tx) => {
        const snap = await tx.get(ref);
        const estado = snap.exists() ? snap.data() : null;
        if (estado && estado.fase !== 'terminado') return;
        tx.set(ref, { fase: 'esperando', listos: {}, victorias: estado?.victorias || { nico: 0, carito: 0 } });
    });
}
