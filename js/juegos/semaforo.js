// ==================== EL SEMÁFORO ====================
// No es una carrera de quién es más rápido: es al revés. 5 semáforos,
// cada uno espera su propio verde (el mismo instante real para los
// dos, calculado desde horaInicio así no hace falta ida y vuelta por
// Firestore) y toca apenas lo ve. Al final se comparan los reflejos de
// los dos — cuanto más parecidos los tiempos, más "sincronizados"
// salieron. Tocar antes de verde es un semáforo perdido (anticiparon).
const TOTAL_RONDAS_SEMAFORO = 5;
const DURACION_VENTANA_SEMAFORO = 4500; // ms que dura cada semáforo (rojo + verde + margen)
const DEMORA_VERDE_MIN = 1200;
const DEMORA_VERDE_RANGO = 2000; // el verde aparece entre 1200 y 3200ms después de arrancar el semáforo

function refSemaforo(){ return window.doc(window.db, 'juegos', 'semaforo'); }

let _semaforoFaseAnterior = null;
function iniciarSemaforo(){
    if (window._detenerRondaSemaforo) { window._detenerRondaSemaforo(); window._detenerRondaSemaforo = null; }
    const cont = document.getElementById('contenido-semaforo');
    if (cont) delete cont.dataset.jugandoLocal;
    _semaforoFaseAnterior = null;
    if (window._unsubSemaforo) window._unsubSemaforo();
    window._unsubSemaforo = window.onSnapshot(refSemaforo(), (snap) => {
        const datos = snap.exists() ? snap.data() : null;
        if (datos && datos.fase === 'terminado' && _semaforoFaseAnterior && _semaforoFaseAnterior !== 'terminado' && window.sfx) window.sfx.revelar();
        _semaforoFaseAnterior = datos ? datos.fase : null;
        renderSemaforo(datos);
    }, (err) => {
        console.error('Error de Firestore en semáforo:', err);
        if (cont && cont.dataset.jugandoLocal !== '1') {
            cont.innerHTML = `<div class="panel texto-centro texto-tenue">⚠️ No se pudo conectar (${err.code || 'error'}).</div>`;
        }
    });
}

let _cuentaRegresivaSemaforo = null;
function renderSemaforo(estado){
    const cont = document.getElementById('contenido-semaforo');
    if (cont.dataset.jugandoLocal === '1') return;
    if (_cuentaRegresivaSemaforo) { clearTimeout(_cuentaRegresivaSemaforo); _cuentaRegresivaSemaforo = null; }

    if (!estado || estado.fase === 'esperando') {
        const listoYo = estado?.listos?.[miIdentidad];
        const listoRival = estado?.listos?.[miRival];
        cont.innerHTML = `<div class="panel texto-centro">
            <p class="texto-tenue">5 semáforos. Esperen el verde y toquen apenas aparece — tocar antes es semáforo perdido. Al final vemos qué tan sincronizados están sus reflejos.</p>
            <div class="texto-tenue" style="margin-bottom:10px;">
                ${nombreJugador(miIdentidad)}: ${listoYo ? '✅ listo/a' : '⏳ esperando'}<br>
                ${nombreJugador(miRival)}: ${listoRival ? '✅ listo/a' : '⏳ esperando'}
            </div>
            <button class="btn-principal" ${listoYo ? 'disabled style="opacity:0.5;"' : ''} onclick="marcarListoSemaforo()">${listoYo ? 'Esperando…' : '¡Estoy listo/a! 🚦'}</button>
        </div>`;
        if (listoYo && listoRival) iniciarRondaArcadeSiCorresponde(refSemaforo(), 'semaforo', TOTAL_RONDAS_SEMAFORO * DURACION_VENTANA_SEMAFORO, {});
        return;
    }

    if (estado.fase === 'jugando') {
        const restante = (estado.horaInicio || Date.now()) - Date.now();
        if (restante > -500) {
            if (!estado.horaInicio) repararRondaArcadeSiCorresponde(refSemaforo(), 'semaforo');
            cont.innerHTML = htmlCuentaRegresivaArcade(restante);
            _cuentaRegresivaSemaforo = setTimeout(() => renderSemaforo(estado), msHastaProximoTickArcade(restante));
            return;
        }
        jugarRondasSemaforo(estado.horaInicio);
        return;
    }

    if (estado.fase === 'terminado') {
        cont.innerHTML = renderResultadoFinalSemaforo(estado.resultadosNico || [], estado.resultadosCarito || []);
    }
}

async function marcarListoSemaforo(){
    vibrarJ(12);
    await marcarListoArcade(refSemaforo(), {});
}

function jugarRondasSemaforo(horaInicio){
    const cont = document.getElementById('contenido-semaforo');
    cont.dataset.jugandoLocal = '1';
    cont.innerHTML = `<div class="panel texto-centro">
        <div class="texto-tenue" style="margin-bottom:10px;">Semáforo <span id="ronda-semaforo">1</span>/${TOTAL_RONDAS_SEMAFORO}</div>
        <div class="semaforo-luz semaforo-roja" id="luz-semaforo" onclick="tocarSemaforo()">
            <span id="emoji-semaforo">🔴</span>
            <span class="semaforo-texto" id="texto-semaforo">Esperá el verde…</span>
        </div>
    </div>`;
    arrancarRondasSemaforo(horaInicio);
}

function arrancarRondasSemaforo(horaInicio){
    let ronda = 0;
    let resultados = [];
    let horaVerde = 0, tocado = false;
    let timeoutVerde = null, timeoutFinVentana = null, timeoutSiguiente = null;

    function pintarRonda(){
        const rEl = document.getElementById('ronda-semaforo');
        if (rEl) rEl.innerText = ronda + 1;
        const luz = document.getElementById('luz-semaforo');
        const emoji = document.getElementById('emoji-semaforo');
        const texto = document.getElementById('texto-semaforo');
        if (luz) { luz.classList.remove('semaforo-verde'); luz.classList.add('semaforo-roja'); }
        if (emoji) emoji.innerText = '🔴';
        if (texto) texto.innerText = 'Esperá el verde…';
    }

    function ponerVerde(){
        const luz = document.getElementById('luz-semaforo');
        const emoji = document.getElementById('emoji-semaforo');
        const texto = document.getElementById('texto-semaforo');
        if (luz) { luz.classList.remove('semaforo-roja'); luz.classList.add('semaforo-verde'); }
        if (emoji) emoji.innerText = '🟢';
        if (texto) texto.innerText = '¡TOCÁ YA!';
        if (window.sfx) window.sfx.toque();
    }

    function jugarSiguiente(){
        if (ronda >= TOTAL_RONDAS_SEMAFORO) { finalizarSemaforo(resultados); return; }
        tocado = false;
        pintarRonda();
        const inicioVentana = horaInicio + ronda * DURACION_VENTANA_SEMAFORO;
        const rng = rngRonda(Math.floor(horaInicio / 977) + ronda * 7919);
        const demoraVerde = DEMORA_VERDE_MIN + Math.floor(rng() * DEMORA_VERDE_RANGO);
        horaVerde = inicioVentana + demoraVerde;
        timeoutVerde = setTimeout(ponerVerde, Math.max(0, horaVerde - Date.now()));
        timeoutFinVentana = setTimeout(() => {
            if (!tocado) {
                tocado = true;
                resultados.push({ escapado: true });
                vibrarJ(8);
            }
            ronda++;
            timeoutSiguiente = setTimeout(jugarSiguiente, 50);
        }, Math.max(0, (inicioVentana + DURACION_VENTANA_SEMAFORO) - Date.now()));
    }

    window.tocarSemaforo = function(){
        if (tocado) return;
        tocado = true;
        clearTimeout(timeoutFinVentana);
        const ahora = Date.now();
        if (ahora < horaVerde) {
            resultados.push({ anticipado: true });
            vibrarJ([10, 10, 10]);
            const luz = document.getElementById('luz-semaforo');
            const texto = document.getElementById('texto-semaforo');
            if (texto) texto.innerText = '¡Muy pronto! 😅';
            if (luz) luz.classList.add('semaforo-shake');
        } else {
            resultados.push({ ms: ahora - horaVerde });
            vibrarJ(15);
            const texto = document.getElementById('texto-semaforo');
            if (texto) texto.innerText = `${ahora - horaVerde}ms ⚡`;
        }
        clearTimeout(timeoutVerde);
        ronda++;
        timeoutSiguiente = setTimeout(jugarSiguiente, 700);
    };

    window._detenerRondaSemaforo = function(){
        clearTimeout(timeoutVerde); clearTimeout(timeoutFinVentana); clearTimeout(timeoutSiguiente);
    };

    jugarSiguiente();
}

async function finalizarSemaforo(resultados){
    window._detenerRondaSemaforo = null;
    vibrarJ([15, 30, 15]);
    try {
        const campo = miIdentidad === 'nico' ? 'resultadosNico' : 'resultadosCarito';
        await window.updateDoc(refSemaforo(), { [campo]: resultados });
        const snap = await new Promise(res => { const u = window.onSnapshot(refSemaforo(), s => { u(); res(s); }); });
        const data = snap.data();
        if (data.resultadosNico && data.resultadosCarito) {
            await window.updateDoc(refSemaforo(), { fase: 'terminado' });
            if (typeof registrarEvento === 'function') registrarEvento('gano_partida', 'Jugaron El Semáforo');
        }
    } catch (e) {
        console.error('No se pudo finalizar el semáforo:', e);
    }
    const cont = document.getElementById('contenido-semaforo');
    if (cont) delete cont.dataset.jugandoLocal;
}

function _calcularSincroniaSemaforo(resNico, resCarito){
    const diffs = [];
    const detalle = [];
    for (let i = 0; i < TOTAL_RONDAS_SEMAFORO; i++) {
        const a = resNico[i], b = resCarito[i];
        if (a && typeof a.ms === 'number' && b && typeof b.ms === 'number') {
            const diff = Math.abs(a.ms - b.ms);
            diffs.push(diff);
            detalle.push({ ronda: i + 1, msNico: a.ms, msCarito: b.ms, diff });
        } else {
            detalle.push({ ronda: i + 1, msNico: a?.ms, msCarito: b?.ms, anticipadoNico: !!a?.anticipado, anticipadoCarito: !!b?.anticipado, escapadoNico: !!a?.escapado, escapadoCarito: !!b?.escapado });
        }
    }
    const promedio = diffs.length ? diffs.reduce((s, d) => s + d, 0) / diffs.length : null;
    const pct = promedio === null ? null : Math.max(0, Math.min(100, Math.round(100 - promedio / 5)));
    return { detalle, promedio, pct };
}

function renderResultadoFinalSemaforo(resNico, resCarito){
    const { detalle, promedio, pct } = _calcularSincroniaSemaforo(resNico, resCarito);
    let mensaje = 'No hubo suficientes semáforos limpios para medir sincronía. ¡Prueben de nuevo!';
    if (pct !== null) {
        if (pct >= 90) mensaje = '🔮 Casi telepatía. Están hechos el uno para el otro.';
        else if (pct >= 70) mensaje = '💞 Muy sincronizados.';
        else if (pct >= 40) mensaje = '🙂 Vamos bien, con lo suyo.';
        else mensaje = '😂 Un caos total, pero con estilo.';
    }
    let filas = '';
    detalle.forEach(d => {
        const txtNico = typeof d.msNico === 'number' ? `${d.msNico}ms` : (d.anticipadoNico ? '⚡ anticipó' : (d.escapadoNico ? '💤 se escapó' : '—'));
        const txtCarito = typeof d.msCarito === 'number' ? `${d.msCarito}ms` : (d.anticipadoCarito ? '⚡ anticipó' : (d.escapadoCarito ? '💤 se escapó' : '—'));
        filas += `<div style="display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px solid var(--borde); font-size:0.9rem;">
            <span class="texto-tenue">Semáforo ${d.ronda}</span><span>${nombreJugador('nico')}: ${txtNico}</span><span>${nombreJugador('carito')}: ${txtCarito}</span>
        </div>`;
    });
    return `<div class="panel texto-centro logro-animado">
        <p style="font-family:var(--fuente-titulo); font-size:1.3rem; margin:0 0 6px;">${pct !== null ? pct + '% de sincronía' : 'Sincronía'}</p>
        <p class="texto-tenue" style="margin:0;">${mensaje}</p>
    </div>
    <div class="panel">${filas}</div>
    <button class="btn-principal" onclick="revanchaSemaforo()">🔁 Otra vuelta</button>`;
}

async function revanchaSemaforo(){
    vibrarJ(10);
    await window.setDoc(refSemaforo(), { fase: 'esperando', listos: {} });
}
