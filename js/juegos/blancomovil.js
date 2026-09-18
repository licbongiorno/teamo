// ==================== BLANCO MÓVIL ====================
// Duelo en tiempo real, 25 segundos, mismo patrón que Derribá Piñatas/
// Topo Veloz (cada uno juega su tablero en paralelo, puntaje en vivo,
// gana quien sumó más). La diferencia acá es la PRECISIÓN: un anillo
// se va cerrando sobre un blanco — tocarlo justo cuando el anillo está
// más cerca del centro da más puntos que tocarlo apenas aparece.
const DURACION_BLANCO = 25000;
const DURACION_ANILLO = 1000;
const MOMENTO_IDEAL = 720; // ms desde que aparece hasta el mejor momento para tocar

function refBlancoMovil(){ return window.doc(window.db, 'juegos', 'blancomovil'); }

let _blancoMovilFaseAnterior = null;
function iniciarBlancoMovil(){
    if (window._detenerRondaBlancoMovil) { window._detenerRondaBlancoMovil(); window._detenerRondaBlancoMovil = null; }
    const cont = document.getElementById('contenido-blancomovil');
    if (cont) delete cont.dataset.jugandoLocal;
    _blancoMovilFaseAnterior = null;
    if (window._unsubBlancoMovil) window._unsubBlancoMovil();
    window._unsubBlancoMovil = window.onSnapshot(refBlancoMovil(), (snap) => {
        const datos = snap.exists() ? snap.data() : null;
        if (datos && datos.fase === 'terminado' && _blancoMovilFaseAnterior && _blancoMovilFaseAnterior !== 'terminado' && window.sfx) {
            const p = datos.puntajes || { nico: 0, carito: 0 };
            if (p.nico === p.carito) window.sfx.empate();
            else window.sfx[(p.nico > p.carito ? 'nico' : 'carito') === miIdentidad ? 'victoria' : 'derrota']();
            if (window.fx && ((p.nico > p.carito ? 'nico' : 'carito') === miIdentidad)) window.fx.confeti();
        }
        _blancoMovilFaseAnterior = datos ? datos.fase : null;
        renderBlancoMovil(datos);
    }, (err) => {
        console.error('Error de Firestore en blanco móvil:', err);
        if (cont && cont.dataset.jugandoLocal !== '1') {
            cont.innerHTML = `<div class="panel texto-centro texto-tenue">⚠️ No se pudo conectar (${err.code || 'error'}).</div>`;
        }
    });
}

let _cuentaRegresivaBlancoMovil = null;
function renderBlancoMovil(estado){
    const cont = document.getElementById('contenido-blancomovil');
    if (cont.dataset.jugandoLocal === '1') return;
    if (_cuentaRegresivaBlancoMovil) { clearTimeout(_cuentaRegresivaBlancoMovil); _cuentaRegresivaBlancoMovil = null; }

    if (!estado || estado.fase === 'esperando') {
        const listoYo = estado?.listos?.[miIdentidad];
        const listoRival = estado?.listos?.[miRival];
        const p = estado?.puntajes || { nico: 0, carito: 0 };
        cont.innerHTML = `<div class="panel texto-centro">
            <p class="texto-tenue">25 segundos. Un anillo se cierra sobre el blanco — tocalo lo más cerca posible del centro para sumar más puntos.</p>
            <div class="texto-tenue" style="margin:10px 0;">Nico ${p.nico || 0} — Carito ${p.carito || 0}</div>
            <div class="texto-tenue" style="margin-bottom:10px;">
                ${nombreJugador(miIdentidad)}: ${listoYo ? '✅ listo/a' : '⏳ esperando'}<br>
                ${nombreJugador(miRival)}: ${listoRival ? '✅ listo/a' : '⏳ esperando'}
            </div>
            <button class="btn-principal" ${listoYo ? 'disabled style="opacity:0.5;"' : ''} onclick="marcarListoBlancoMovil()">${listoYo ? 'Esperando…' : '¡Estoy listo/a! 🎯'}</button>
        </div>`;
        if (listoYo && listoRival) iniciarRondaArcadeSiCorresponde(refBlancoMovil(), 'blancomovil', DURACION_BLANCO, { puntajeVivoNico: 0, puntajeVivoCarito: 0 });
        return;
    }

    if (estado.fase === 'jugando') {
        const restante = (estado.horaInicio || Date.now()) - Date.now();
        if (restante > -500) {
            cont.innerHTML = htmlCuentaRegresivaArcade(restante);
            _cuentaRegresivaBlancoMovil = setTimeout(() => renderBlancoMovil(estado), restante > 0 ? Math.min(restante, 200) : 150);
            return;
        }
        jugarRondaBlancoMovil(estado.horaFin);
        return;
    }

    if (estado.fase === 'terminado') {
        const p = estado.puntajes || { nico: 0, carito: 0 };
        let msg = '🤝 ¡Empataron!';
        if (p.nico > p.carito) msg = miIdentidad === 'nico' ? '🏆 ¡Ganaste vos!' : `🏆 Ganó ${nombreJugador('nico')}`;
        else if (p.carito > p.nico) msg = miIdentidad === 'carito' ? '🏆 ¡Ganaste vos!' : `🏆 Ganó ${nombreJugador('carito')}`;
        cont.innerHTML = `<div class="panel texto-centro logro-animado">
            <div style="font-size:1.2rem; margin-bottom:6px;">${msg}</div>
            <div class="texto-tenue">Nico ${p.nico} — Carito ${p.carito}</div>
            <button class="btn-principal" style="margin-top:14px;" onclick="revanchaBlancoMovil()">🔁 Otra ronda</button>
        </div>`;
    }
}

async function marcarListoBlancoMovil(){
    vibrarJ(12);
    await marcarListoArcade(refBlancoMovil(), { puntajes: (await leerPuntajesBlancoMovil()) });
}
async function leerPuntajesBlancoMovil(){
    const snap = await new Promise(res => { const u = window.onSnapshot(refBlancoMovil(), s => { u(); res(s); }); });
    const data = snap.exists() ? snap.data() : null;
    return data?.puntajes || { nico: 0, carito: 0 };
}

function jugarRondaBlancoMovil(horaFin){
    const cont = document.getElementById('contenido-blancomovil');
    cont.dataset.jugandoLocal = '1';
    cont.innerHTML = `
        <div class="panel">
            <div style="display:flex; justify-content:space-between; font-size:0.9rem; margin-bottom:8px;">
                <span>Vos: <b id="marcador-yo-blanco">0</b> <span id="ultimo-tiro-blanco" class="texto-tenue"></span></span>
                <span id="tiempo-blanco">25s</span>
                <span>${nombreJugador(miRival)}: <b id="marcador-rival-blanco">0</b></span>
            </div>
            <div style="position:relative; width:100%; aspect-ratio:4/3; max-height:55vh; background:rgba(0,0,0,0.25); border-radius:14px; overflow:hidden;" id="area-blanco"></div>
        </div>`;
    arrancarBlancoMovil(horaFin);
}

function arrancarBlancoMovil(horaFin){
    const area = document.getElementById('area-blanco');
    if (!area) return;
    let puntaje = 0, terminando = false, idBlancoActual = 0;
    let spawnTimeout = null, unsubRival = null;

    unsubRival = window.onSnapshot(refBlancoMovil(), (snap) => {
        const data = snap.exists() ? snap.data() : null;
        const el = document.getElementById('marcador-rival-blanco');
        if (el && data) el.innerText = data[miRival === 'nico' ? 'puntajeVivoNico' : 'puntajeVivoCarito'] || 0;
    });

    function spawnBlanco(){
        if (terminando) return;
        idBlancoActual++;
        const miId = idBlancoActual;
        const nacio = Date.now();
        const cont = document.createElement('div');
        cont.style.cssText = `position:absolute; left:${8 + Math.random() * 74}%; top:${8 + Math.random() * 68}%; width:56px; height:56px;`;
        cont.innerHTML = `
            <div style="position:absolute; inset:0; border-radius:50%; background:radial-gradient(circle, var(--rosa) 0%, var(--rosa) 22%, transparent 24%);"></div>
            <div class="anillo-blanco"></div>`;
        cont.onclick = () => {
            if (idBlancoActual !== miId) return;
            const elapsed = Date.now() - nacio;
            const distancia = Math.abs(elapsed - MOMENTO_IDEAL);
            const puntos = distancia < 90 ? 3 : distancia < 220 ? 2 : 1;
            idBlancoActual++; // invalida este blanco para que no se pueda re-tocar
            cont.remove();
            puntaje += puntos;
            vibrarJ(puntos === 3 ? [10, 15, 10] : 10);
            if (window.sfx) window.sfx[puntos === 3 ? 'acierto' : 'toque']();
            const m = document.getElementById('marcador-yo-blanco');
            if (m) m.innerText = puntaje;
            const u = document.getElementById('ultimo-tiro-blanco');
            if (u) { u.innerText = puntos === 3 ? '¡Perfecto! +3' : `+${puntos}`; }
            sincronizarPuntajeEnVivo(refBlancoMovil(), miIdentidad === 'nico' ? 'puntajeVivoNico' : 'puntajeVivoCarito', puntaje);
            if (!terminando) spawnTimeout = setTimeout(spawnBlanco, 200 + Math.random() * 300);
        };
        area.appendChild(cont);
        setTimeout(() => {
            if (idBlancoActual !== miId) return;
            idBlancoActual++;
            if (cont.isConnected) cont.remove();
            if (!terminando) spawnTimeout = setTimeout(spawnBlanco, 200 + Math.random() * 300);
        }, DURACION_ANILLO + 150);
    }
    spawnTimeout = setTimeout(spawnBlanco, 400);

    function tick(){
        const el = document.getElementById('tiempo-blanco');
        const seg = Math.max(0, Math.ceil((horaFin - Date.now()) / 1000));
        if (el) el.innerText = seg + 's';
        if (Date.now() >= horaFin) { terminar(); return; }
        window._timerBlancoMovil = setTimeout(tick, 200);
    }
    tick();

    window._detenerRondaBlancoMovil = function pararTimersBlancoMovil(){
        terminando = true;
        if (spawnTimeout) clearTimeout(spawnTimeout);
        if (window._timerBlancoMovil) { clearTimeout(window._timerBlancoMovil); window._timerBlancoMovil = null; }
        if (unsubRival) unsubRival();
    };

    async function terminar(){
        if (terminando) return;
        window._detenerRondaBlancoMovil();
        window._detenerRondaBlancoMovil = null;
        area.innerHTML = '';
        await finalizarRondaBlancoMovil(puntaje);
    }
}

async function finalizarRondaBlancoMovil(puntajeObtenido){
    vibrarJ([15, 30, 15]);
    try {
        const campo = miIdentidad === 'nico' ? 'terminoNico' : 'terminoCarito';
        const campoPtos = miIdentidad === 'nico' ? 'ptsFinalesNico' : 'ptsFinalesCarito';
        await window.updateDoc(refBlancoMovil(), { [campo]: true, [campoPtos]: puntajeObtenido });
        const snap = await new Promise(res => { const u = window.onSnapshot(refBlancoMovil(), s => { u(); res(s); }); });
        const data = snap.data();
        if (data.terminoNico && data.terminoCarito) {
            const puntajes = { nico: data.ptsFinalesNico || 0, carito: data.ptsFinalesCarito || 0 };
            await window.updateDoc(refBlancoMovil(), { fase: 'terminado', puntajes });
            if (typeof registrarEvento === 'function') {
                registrarEvento('gano_partida', `Jugaron Blanco Móvil (${puntajes.nico} - ${puntajes.carito})`);
            }
        }
    } catch (e) {
        console.error('No se pudo finalizar la ronda de blanco móvil:', e);
    }
    const cont = document.getElementById('contenido-blancomovil');
    delete cont.dataset.jugandoLocal;
}

async function revanchaBlancoMovil(){
    vibrarJ(10);
    const puntajes = await leerPuntajesBlancoMovil();
    await window.setDoc(refBlancoMovil(), { fase: 'esperando', listos: {}, puntajes });
}
