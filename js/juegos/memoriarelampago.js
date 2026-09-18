// ==================== MEMORIA RELÁMPAGO COMPARTIDA ====================
// Un mismo mazo de 16 cartas (8 parejas) boca abajo para los dos: el
// que arma una pareja se la lleva. Sólo puede haber una pareja "en
// evaluación" por vez en todo el tablero — si alguien da vuelta la
// segunda carta y no coincide, se ven un toque y se vuelven a tapar
// solas antes de que se pueda seguir jugando. Gana quien juntó más
// parejas cuando se termina el mazo.
const SIMBOLOS_MEMORIA = ['🍓', '🍋', '🍇', '🍉', '🍒', '🍑', '🍍', '🥝'];
const TOTAL_CARTAS_MEMORIA = SIMBOLOS_MEMORIA.length * 2;

function refMemoriaRelampago(){ return window.doc(window.db, 'juegos', 'memoriarelampago'); }

function barajaMemoria(semilla){
    const rng = window.rngRonda(semilla);
    const mazo = [...SIMBOLOS_MEMORIA, ...SIMBOLOS_MEMORIA];
    return window.barajarRnd(rng, mazo);
}

let _memoriaRelampagoFaseAnterior = null;
function iniciarMemoriaRelampago(){
    _memoriaRelampagoFaseAnterior = null;
    if (window._unsubMemoriaRelampago) window._unsubMemoriaRelampago();
    window._unsubMemoriaRelampago = window.onSnapshot(refMemoriaRelampago(), (snap) => {
        const datos = snap.exists() ? snap.data() : null;
        if (datos && datos.fase === 'terminado' && _memoriaRelampagoFaseAnterior === 'jugando' && window.sfx) {
            const p = datos.puntajes || { nico: 0, carito: 0 };
            if (p.nico === p.carito) window.sfx.empate();
            else window.sfx[(p.nico > p.carito ? 'nico' : 'carito') === miIdentidad ? 'victoria' : 'derrota']();
            if (window.fx && ((p.nico > p.carito ? 'nico' : 'carito') === miIdentidad)) window.fx.confeti();
        }
        _memoriaRelampagoFaseAnterior = datos ? datos.fase : null;
        renderMemoriaRelampago(datos);
    }, (err) => {
        console.error('Error de Firestore en memoria relámpago:', err);
        document.getElementById('contenido-memoriarelampago').innerHTML = `<div class="panel texto-centro texto-tenue">⚠️ No se pudo conectar (${err.code || 'error'}).</div>`;
    });
}

let _cuentaRegresivaMemoriaRelampago = null;
let _limpiezaProgramadaMemoria = null;

function renderMemoriaRelampago(estado){
    const cont = document.getElementById('contenido-memoriarelampago');
    if (_cuentaRegresivaMemoriaRelampago) { clearTimeout(_cuentaRegresivaMemoriaRelampago); _cuentaRegresivaMemoriaRelampago = null; }

    if (!estado || estado.fase === 'sin_partida') {
        const v = estado?.victorias || { nico: 0, carito: 0 };
        cont.innerHTML = `<div class="panel texto-centro">
            <p class="texto-tenue">Un mismo mazo para los dos: el que arma una pareja se la lleva. Gana quien junte más.</p>
            <div class="texto-tenue" style="margin:10px 0;">Partidas ganadas — Nico ${v.nico || 0} — Carito ${v.carito || 0}</div>
            <button class="btn-principal" onclick="marcarListoMemoriaRelampago()">Empezar</button>
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
            <button class="btn-principal" ${listoYo ? 'disabled style="opacity:0.5;"' : ''} onclick="marcarListoMemoriaRelampago()">${listoYo ? 'Esperando al otro…' : '¡Estoy listo/a! 🧠'}</button>
        </div>`;
        if (listoYo && listoRival) {
            iniciarRondaArcadeSiCorresponde(refMemoriaRelampago(), 'memoriarelampago', 0, {
                semilla: Date.now(), volteadas: [], resueltas: [], puntajes: { nico: 0, carito: 0 }
            });
        }
        return;
    }

    if (estado.fase === 'terminado') {
        const p = estado.puntajes || { nico: 0, carito: 0 };
        let msg = '🤝 ¡Empataron!';
        if (p.nico > p.carito) msg = miIdentidad === 'nico' ? '🏆 ¡Ganaste vos!' : `🏆 Ganó ${nombreJugador('nico')}`;
        else if (p.carito > p.nico) msg = miIdentidad === 'carito' ? '🏆 ¡Ganaste vos!' : `🏆 Ganó ${nombreJugador('carito')}`;
        cont.innerHTML = `<div class="panel texto-centro logro-animado">
            <div style="font-size:1.2rem; margin-bottom:6px;">${msg}</div>
            <div class="texto-tenue">Parejas — Nico ${p.nico || 0} — Carito ${p.carito || 0}</div>
            <button class="btn-principal" style="margin-top:14px;" onclick="revanchaMemoriaRelampago()">🔁 Otra ronda</button>
        </div>`;
        return;
    }

    const restante = (estado.horaInicio || Date.now()) - Date.now();
    if (restante > -500) {
        cont.innerHTML = htmlCuentaRegresivaArcade(restante);
        _cuentaRegresivaMemoriaRelampago = setTimeout(() => renderMemoriaRelampago(estado), restante > 0 ? Math.min(restante, 200) : 150);
        return;
    }

    const mazo = barajaMemoria(estado.semilla);
    const volteadas = estado.volteadas || [];
    const resueltas = estado.resueltas || [];
    const p = estado.puntajes || { nico: 0, carito: 0 };

    // Si quedaron 2 cartas volteadas sin coincidir, alguien tiene que
    // taparlas de nuevo después de un instante — cualquiera de los dos
    // dispositivos programa esa limpieza, la transacción de adentro es
    // idempotente así que no importa si los dos la programan.
    if (volteadas.length === 2 && mazo[volteadas[0]] !== mazo[volteadas[1]] && !_limpiezaProgramadaMemoria) {
        _limpiezaProgramadaMemoria = setTimeout(() => { _limpiezaProgramadaMemoria = null; limpiarVolteadasMemoria(); }, 900);
    }

    let html = `<div class="texto-tenue texto-centro" style="margin-bottom:8px;">Parejas — Nico ${p.nico || 0} — Carito ${p.carito || 0}</div>`;
    html += `<div class="tablero-juego" style="grid-template-columns:repeat(4,1fr); max-width:320px; margin:0 auto;">`;
    for (let i = 0; i < TOTAL_CARTAS_MEMORIA; i++) {
        const resuelta = resueltas.includes(i);
        const volteada = volteadas.includes(i);
        const visible = resuelta || volteada;
        let contenido = visible ? mazo[i] : '';
        html += `<div class="casilla-tablero ${visible ? 'casilla-clara' : 'casilla-oscura'} ${resuelta ? 'casilla-ganadora' : ''}" onclick="${visible ? '' : `voltearCartaMemoria(${i})`}">${contenido}</div>`;
    }
    html += `</div>`;
    cont.innerHTML = html;
}

async function marcarListoMemoriaRelampago(){
    vibrarJ(12);
    // Transacción (en vez de leer con onSnapshot y despues escribir
    // con merge suelto): si los dos tocan "listo" casi al mismo
    // tiempo, una lectura suelta puede no ver todavía la marca del
    // otro y la escritura de uno pisa la del otro, dejando la
    // partida esperando para siempre.
    await window.runTransaction(window.db, async (tx) => {
        const snap = await tx.get(refMemoriaRelampago());
        const estado = snap.exists() ? snap.data() : null;
        if (estado?.fase === 'esperando' && estado?.listos?.[miIdentidad]) return;
        tx.set(refMemoriaRelampago(), {
            fase: 'esperando',
            listos: { ...(estado?.listos || {}), [miIdentidad]: true },
            victorias: estado?.victorias || { nico: 0, carito: 0 }
        }, { merge: true });
    });
}

async function voltearCartaMemoria(indice){
    const ref = refMemoriaRelampago();
    const resultado = await window.runTransaction(window.db, async (tx) => {
        const snap = await tx.get(ref);
        const data = snap.data();
        if (!data || data.fase !== 'jugando') return { valido: false };
        const resueltas = data.resueltas || [];
        const volteadas = data.volteadas || [];
        if (resueltas.includes(indice) || volteadas.includes(indice)) return { valido: false };
        if (volteadas.length >= 2) return { valido: false }; // ya hay una pareja evaluándose
        const mazo = barajaMemoria(data.semilla);
        const nuevasVolteadas = [...volteadas, indice];
        if (nuevasVolteadas.length < 2) {
            tx.update(ref, { volteadas: nuevasVolteadas });
            return { valido: true, resuelto: false };
        }
        const [a, b] = nuevasVolteadas;
        if (mazo[a] === mazo[b]) {
            const nuevasResueltas = [...resueltas, a, b];
            const puntajes = { ...(data.puntajes || { nico: 0, carito: 0 }) };
            puntajes[miIdentidad] = (puntajes[miIdentidad] || 0) + 1;
            const updates = { volteadas: [], resueltas: nuevasResueltas, puntajes };
            if (nuevasResueltas.length >= TOTAL_CARTAS_MEMORIA) {
                updates.fase = 'terminado';
                const victorias = { ...(data.victorias || { nico: 0, carito: 0 }) };
                const ganador = puntajes.nico === puntajes.carito ? null : (puntajes.nico > puntajes.carito ? 'nico' : 'carito');
                if (ganador) victorias[ganador] = (victorias[ganador] || 0) + 1;
                updates.victorias = victorias;
            }
            tx.update(ref, updates);
            return { valido: true, resuelto: true, pareja: true };
        }
        tx.update(ref, { volteadas: nuevasVolteadas });
        return { valido: true, resuelto: true, pareja: false };
    });
    if (!resultado.valido) return;
    vibrarJ(8);
    if (window.sfx) window.sfx.cartaFlip();
    if (resultado.resuelto) {
        if (resultado.pareja) {
            vibrarJ([15, 30, 15]);
            if (window.sfx) window.sfx.acierto();
            if (typeof registrarEvento === 'function') {
                registrarEvento('gano_partida', `Jugaron Memoria Relámpago Compartida`);
            }
        } else {
            if (window.sfx) window.sfx.error();
        }
    }
}

// Idempotente a propósito: si dos dispositivos programan la limpieza,
// la segunda llamada no encuentra nada para tapar y no hace nada.
async function limpiarVolteadasMemoria(){
    const ref = refMemoriaRelampago();
    await window.runTransaction(window.db, async (tx) => {
        const snap = await tx.get(ref);
        const data = snap.data();
        if (!data || data.fase !== 'jugando') return;
        const volteadas = data.volteadas || [];
        if (volteadas.length !== 2) return;
        const mazo = barajaMemoria(data.semilla);
        if (mazo[volteadas[0]] === mazo[volteadas[1]]) return; // por las dudas, no tapar una pareja
        tx.update(ref, { volteadas: [] });
    });
}

async function revanchaMemoriaRelampago(){
    vibrarJ(10);
    const estado = await new Promise(res => { const u = window.onSnapshot(refMemoriaRelampago(), s => { u(); res(s.exists() ? s.data() : null); }); });
    await window.setDoc(refMemoriaRelampago(), { fase: 'esperando', listos: {}, victorias: estado?.victorias || { nico: 0, carito: 0 } });
}
