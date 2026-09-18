// ==================== SIMÓN DICE A DOS ====================
// Los dos ven la MISMA secuencia de colores, que crece un color por
// nivel (se genera con una semilla fija por partida, así los dos
// calculan exactamente la misma secuencia sin tener que guardarla
// entera en Firestore). Después la repiten cada uno en su pantalla;
// el primero que se equivoca pierde. Si los dos la completan bien,
// sube el nivel y la secuencia crece uno más.
const COLORES_SIMON = ['celeste', 'rosa', 'lila', 'verde'];
const PASO_SIMON_MS = 550;

function refSimon(){ return window.doc(window.db, 'juegos', 'simon'); }

function secuenciaCompletaSimon(semilla){
    const rng = window.rngRonda(semilla);
    const secuencia = [];
    for (let i = 0; i < 25; i++) secuencia.push(window.elegirRnd(rng, COLORES_SIMON));
    return secuencia;
}

function _capSimon(id){ return id === 'nico' ? 'Nico' : 'Carito'; }

let _simonFaseAnterior = null;
function iniciarSimon(){
    _simonFaseAnterior = null;
    _simonNivelMontado = 0;
    _simonInputIdx = 0;
    _simonBloqueado = false;
    if (window._unsubSimon) window._unsubSimon();
    window._unsubSimon = window.onSnapshot(refSimon(), (snap) => {
        const datos = snap.exists() ? snap.data() : null;
        if (datos && datos.fase === 'terminado' && _simonFaseAnterior === 'jugando' && window.sfx) {
            window.sfx[datos.ganador === miIdentidad ? 'victoria' : 'derrota']();
            if (window.fx && datos.ganador === miIdentidad) window.fx.confeti();
        }
        _simonFaseAnterior = datos ? datos.fase : null;
        renderSimon(datos);
    }, (err) => {
        console.error('Error de Firestore en simón dice:', err);
        document.getElementById('contenido-simon').innerHTML = `<div class="panel texto-centro texto-tenue">⚠️ No se pudo conectar (${err.code || 'error'}).</div>`;
    });
}

let _cuentaRegresivaSimon = null;
let _timerMuestraSimon = null;
let _simonNivelMontado = 0;
let _simonInputIdx = 0;
let _simonBloqueado = false;
let _simonEstadoActual = null;

function renderSimon(estado){
    const cont = document.getElementById('contenido-simon');
    if (_cuentaRegresivaSimon) { clearTimeout(_cuentaRegresivaSimon); _cuentaRegresivaSimon = null; }
    if (_timerMuestraSimon) { clearTimeout(_timerMuestraSimon); _timerMuestraSimon = null; }

    if (!estado || estado.fase === 'sin_partida') {
        const v = estado?.victorias || { nico: 0, carito: 0 };
        cont.innerHTML = `<div class="panel texto-centro">
            <p class="texto-tenue">Miren la secuencia de colores y después repitanla cada uno en su pantalla. Se pone un color más larga cada nivel. El primero que se equivoca pierde.</p>
            <div class="texto-tenue" style="margin:10px 0;">Partidas ganadas — Nico ${v.nico || 0} — Carito ${v.carito || 0}</div>
            <button class="btn-principal" onclick="marcarListoSimon()">Empezar</button>
        </div>`;
        return;
    }

    if (estado.fase === 'esperando') {
        const listoYo = estado.listos?.[miIdentidad];
        const listoRival = estado.listos?.[miRival];
        cont.innerHTML = `<div class="panel texto-centro">
            <div class="texto-tenue" style="margin-bottom:10px;">
                ${nombreJugador(miIdentidad)}: ${listoYo ? '✅ listo/a' : '⏳ esperando'}<br>
                ${nombreJugador(miRival)}: ${listoRival ? '✅ listo/a' : '⏳ esperando'}
            </div>
            <button class="btn-principal" ${listoYo ? 'disabled style="opacity:0.5;"' : ''} onclick="marcarListoSimon()">${listoYo ? 'Esperando al otro…' : '¡Estoy listo/a! 🔴'}</button>
        </div>`;
        if (listoYo && listoRival) {
            iniciarRondaArcadeSiCorresponde(refSimon(), 'simon', 0, {
                semilla: Date.now(), nivel: 1, horaMuestraInicio: Date.now() + 3500,
                completoNico: null, completoCarito: null, perdedor: null, ganador: null
            });
        }
        return;
    }

    if (estado.fase === 'terminado') {
        const v = estado.victorias || { nico: 0, carito: 0 };
        cont.innerHTML = `<div class="panel texto-centro logro-animado">
            <div style="font-size:1.2rem; margin-bottom:8px;">🏆 ¡Ganó ${nombreJugador(estado.ganador)}! (llegaron al nivel ${estado.nivel || 1})</div>
            <div class="texto-tenue">Partidas ganadas — Nico ${v.nico || 0} — Carito ${v.carito || 0}</div>
            <button class="btn-principal" style="margin-top:14px;" onclick="revanchaSimon()">🔁 Revancha</button>
        </div>`;
        return;
    }

    // Cuenta regresiva inicial (una sola vez, antes del nivel 1).
    const restanteInicio = (estado.horaInicio || Date.now()) - Date.now();
    if (restanteInicio > -500) {
        cont.innerHTML = htmlCuentaRegresivaArcade(restanteInicio);
        _cuentaRegresivaSimon = setTimeout(() => renderSimon(estado), restanteInicio > 0 ? Math.min(restanteInicio, 200) : 150);
        return;
    }

    _simonEstadoActual = estado;
    const nivel = estado.nivel || 1;
    const secuencia = secuenciaCompletaSimon(estado.semilla).slice(0, nivel);

    // ¿Ya completé este nivel? Sólo queda esperar al otro.
    const completoYo = estado[`completo${_capSimon(miIdentidad)}`] === nivel;
    if (completoYo) {
        cont.innerHTML = `<div class="panel texto-centro">
            <div style="font-size:1.1rem; margin-bottom:8px;">✅ ¡Bien! Nivel ${nivel} completado.</div>
            <div class="texto-tenue">Esperando a ${nombreJugador(miRival)}…</div>
        </div>`;
        _simonNivelMontado = 0;
        return;
    }

    const elapsedMuestra = Date.now() - (estado.horaMuestraInicio || Date.now());
    const duracionMuestra = nivel * PASO_SIMON_MS + 350;

    if (elapsedMuestra < 0) {
        // Pausa breve entre el fin de un nivel y el arranque del siguiente.
        cont.innerHTML = `<div class="panel texto-centro"><div class="texto-tenue">Nivel ${nivel} — preparate…</div></div>`;
        _timerMuestraSimon = setTimeout(() => renderSimon(estado), Math.min(-elapsedMuestra, 200));
        return;
    }

    if (elapsedMuestra < duracionMuestra) {
        _simonNivelMontado = 0;
        const idx = Math.floor(elapsedMuestra / PASO_SIMON_MS);
        const enStep = elapsedMuestra % PASO_SIMON_MS;
        const encendido = idx < nivel && enStep < 350 ? secuencia[idx] : null;
        cont.innerHTML = `<div class="panel texto-centro">
            <div class="texto-tenue" style="margin-bottom:10px;">Nivel ${nivel} — miren la secuencia…</div>
            <div class="grilla-simon">${COLORES_SIMON.map(c => `<div class="pad-simon pad-${c} ${encendido === c ? 'pad-simon-prendido' : ''}"></div>`).join('')}</div>
        </div>`;
        _timerMuestraSimon = setTimeout(() => renderSimon(estado), 90);
        return;
    }

    // Fase de repetir: se arma el pad una sola vez por nivel (si no, un
    // snapshot que llega porque el rival completó el suyo reconstruiría
    // todo y perderíamos el progreso local ya tocado).
    if (_simonNivelMontado === nivel) return;
    _simonNivelMontado = nivel;
    _simonInputIdx = 0;
    _simonBloqueado = false;
    cont.innerHTML = `<div class="panel texto-centro">
        <div class="texto-tenue" style="margin-bottom:10px;">Tu turno: repetí la secuencia (${nivel} ${nivel === 1 ? 'color' : 'colores'})</div>
        <div class="grilla-simon">${COLORES_SIMON.map(c => `<div class="pad-simon pad-${c}" id="pad-simon-${c}" onclick="tocarColorSimon('${c}')"></div>`).join('')}</div>
    </div>`;
}

async function marcarListoSimon(){
    vibrarJ(12);
    const estado = await new Promise(res => { const u = window.onSnapshot(refSimon(), s => { u(); res(s.exists() ? s.data() : null); }); });
    await window.setDoc(refSimon(), {
        fase: 'esperando',
        listos: { ...(estado?.listos || {}), [miIdentidad]: true },
        victorias: estado?.victorias || { nico: 0, carito: 0 }
    }, { merge: true });
}

function tocarColorSimon(color){
    if (_simonBloqueado || !_simonEstadoActual) return;
    const nivel = _simonEstadoActual.nivel || 1;
    const secuencia = secuenciaCompletaSimon(_simonEstadoActual.semilla).slice(0, nivel);
    const pad = document.getElementById('pad-simon-' + color);
    if (pad) { pad.classList.add('pad-simon-prendido'); setTimeout(() => pad.classList.remove('pad-simon-prendido'), 180); }
    if (secuencia[_simonInputIdx] === color) {
        vibrarJ(10);
        if (window.sfx) window.sfx.toque();
        _simonInputIdx++;
        if (_simonInputIdx >= secuencia.length) {
            _simonBloqueado = true;
            marcarCompletoSimon(nivel);
        }
    } else {
        _simonBloqueado = true;
        fallarSimon();
    }
}

async function marcarCompletoSimon(nivel){
    const ref = refSimon();
    await window.runTransaction(window.db, async (tx) => {
        const snap = await tx.get(ref);
        const data = snap.data();
        if (!data || data.fase !== 'jugando' || (data.nivel || 1) !== nivel || data.perdedor) return;
        const campoPropio = `completo${_capSimon(miIdentidad)}`;
        if (data[campoPropio] === nivel) return;
        const updates = { [campoPropio]: nivel };
        const campoRival = `completo${_capSimon(miRival)}`;
        if (data[campoRival] === nivel) {
            updates.nivel = nivel + 1;
            updates.horaMuestraInicio = Date.now() + 900;
            updates.completoNico = null;
            updates.completoCarito = null;
        }
        tx.update(ref, updates);
    });
}

async function fallarSimon(){
    vibrarJ([10, 30, 10]);
    if (window.sfx) window.sfx.error();
    if (window.fx) window.fx.sacudirJuego();
    const ref = refSimon();
    await window.runTransaction(window.db, async (tx) => {
        const snap = await tx.get(ref);
        const data = snap.data();
        if (!data || data.fase !== 'jugando' || data.perdedor) return;
        const victorias = { ...(data.victorias || { nico: 0, carito: 0 }) };
        victorias[miRival] = (victorias[miRival] || 0) + 1;
        tx.update(ref, { fase: 'terminado', perdedor: miIdentidad, ganador: miRival, victorias });
    });
    if (typeof registrarEvento === 'function') {
        registrarEvento('gano_partida', `Jugaron Simón Dice a Dos`);
    }
}

async function revanchaSimon(){
    vibrarJ(10);
    _simonNivelMontado = 0;
    const estado = await new Promise(res => { const u = window.onSnapshot(refSimon(), s => { u(); res(s.exists() ? s.data() : null); }); });
    await window.setDoc(refSimon(), { fase: 'esperando', listos: {}, victorias: estado?.victorias || { nico: 0, carito: 0 } });
}
