// ==================== CARRERA DE GLOBOS ====================
// Duelo en tiempo real: tocá lo más rápido posible para inflar tu
// globo y que avance HORIZONTAL. El primero en llegar a la meta gana.
// Máximo 30 segundos por las dudas (si nadie llega, gana quien esté más lejos).
const DURACION_MAX_GLOBOS = 30000;
const TOQUES_PARA_GANAR_GLOBOS = 40;

function refCarreraGlobos(){ return window.doc(window.db, 'juegos', 'carreraglobos'); }

function iniciarCarreraGlobos(){
    const cont = document.getElementById('contenido-carreraglobos');
    if (cont) delete cont.dataset.jugandoLocal;
    if (window._unsubCarreraGlobos) window._unsubCarreraGlobos();
    window._unsubCarreraGlobos = window.onSnapshot(refCarreraGlobos(), (snap) => {
        renderCarreraGlobos(snap.exists() ? snap.data() : null);
    }, (err) => {
        console.error('Error de Firestore en carrera de globos:', err);
        if (cont && cont.dataset.jugandoLocal !== '1') {
            cont.innerHTML = `<div class="panel texto-centro texto-tenue">⚠️ No se pudo conectar (${err.code || 'error'}).</div>`;
        }
    });
}

let _cuentaRegresivaGlobos = null;

function renderCarreraGlobos(estado){
    const cont = document.getElementById('contenido-carreraglobos');
    if (cont.dataset.jugandoLocal === '1') return;
    if (_cuentaRegresivaGlobos) { clearTimeout(_cuentaRegresivaGlobos); _cuentaRegresivaGlobos = null; }

    if (!estado || estado.fase === 'esperando') {
        const listoYo = estado?.listos?.[miIdentidad];
        const listoRival = estado?.listos?.[miRival];
        const v = estado?.victorias || { nico: 0, carito: 0 };
        cont.innerHTML = `<div class="panel texto-centro">
            <p class="texto-tenue">Tocá lo más rápido posible para inflar tu globo. El primero en llegar a la meta gana la carrera.</p>
            <div class="texto-tenue" style="margin:10px 0;">Carreras ganadas — Nico ${v.nico || 0} — Carito ${v.carito || 0}</div>
            <div class="texto-tenue" style="margin-bottom:10px;">
                ${nombreJugador(miIdentidad)}: ${listoYo ? '✅ listo/a' : '⏳ esperando'}<br>
                ${nombreJugador(miRival)}: ${listoRival ? '✅ listo/a' : '⏳ esperando'}
            </div>
            <button class="btn-principal" ${listoYo ? 'disabled style="opacity:0.5;"' : ''} onclick="marcarListoCarreraGlobos()">${listoYo ? 'Esperando…' : '¡Estoy listo/a! 🎈'}</button>
        </div>`;
        if (listoYo && listoRival) iniciarRondaArcadeSiCorresponde(refCarreraGlobos(), 'carreraglobos', DURACION_MAX_GLOBOS, { progresoNico: 0, progresoCarito: 0, ganador: null });
        return;
    }

    if (estado.fase === 'jugando') {
        const restante = (estado.horaInicio || Date.now()) - Date.now();
        if (restante > 0) {
            cont.innerHTML = `<div class="panel texto-centro" style="font-size:2rem;">${Math.ceil(restante / 1000)}</div>`;
            _cuentaRegresivaGlobos = setTimeout(() => renderCarreraGlobos(estado), Math.min(restante, 200));
            return;
        }
        jugarRondaCarreraGlobos(estado.horaFin);
        return;
    }

    if (estado.fase === 'terminado') {
        const v = estado.victorias || { nico: 0, carito: 0 };
        cont.innerHTML = `<div class="panel texto-centro logro-animado">
            <div style="font-size:1.2rem; margin-bottom:6px;">${estado.ganador ? `🏆 ¡Ganó ${nombreJugador(estado.ganador)}!` : '🤝 Nadie llegó a tiempo'}</div>
            <div class="texto-tenue">Carreras ganadas — Nico ${v.nico} — Carito ${v.carito}</div>
            <button class="btn-principal" style="margin-top:14px;" onclick="revanchaCarreraGlobos()">🔁 Otra carrera</button>
        </div>`;
    }
}

async function marcarListoCarreraGlobos(){
    vibrarJ(12);
    await marcarListoArcade(refCarreraGlobos(), { victorias: (await leerVictoriasCarreraGlobos()) });
}
async function leerVictoriasCarreraGlobos(){
    const snap = await new Promise(res => { const u = window.onSnapshot(refCarreraGlobos(), s => { u(); res(s); }); });
    const data = snap.exists() ? snap.data() : null;
    return data?.victorias || { nico: 0, carito: 0 };
}

function jugarRondaCarreraGlobos(horaFin){
    const cont = document.getElementById('contenido-carreraglobos');
    cont.dataset.jugandoLocal = '1';
    cont.innerHTML = `
        <div class="panel">
            <div id="tiempo-globos" class="texto-centro texto-tenue" style="margin-bottom:10px;">30s</div>
            <div class="texto-tenue" style="margin-bottom:4px;">Vos</div>
            <div style="position:relative; height:36px; background:rgba(255,255,255,0.06); border-radius:18px; margin-bottom:14px; overflow:hidden;">
                <div id="barra-yo-globos" style="position:absolute; left:0; top:0; height:100%; width:0%; background:linear-gradient(90deg,var(--rosa,#ffb3c6),var(--lila,#c9b6ff)); transition:width 0.15s;"></div>
                <div id="globo-yo" style="position:absolute; top:50%; transform:translate(-50%,-50%); left:0%; font-size:1.6rem;">🎈</div>
                <div style="position:absolute; right:6px; top:50%; transform:translateY(-50%); font-size:0.9rem;">🏁</div>
            </div>
            <div class="texto-tenue" style="margin-bottom:4px;">${nombreJugador(miRival)}</div>
            <div style="position:relative; height:36px; background:rgba(255,255,255,0.06); border-radius:18px; margin-bottom:16px; overflow:hidden;">
                <div id="barra-rival-globos" style="position:absolute; left:0; top:0; height:100%; width:0%; background:rgba(255,255,255,0.2); transition:width 0.3s;"></div>
                <div id="globo-rival" style="position:absolute; top:50%; transform:translate(-50%,-50%); left:0%; font-size:1.6rem;">🎈</div>
                <div style="position:absolute; right:6px; top:50%; transform:translateY(-50%); font-size:0.9rem;">🏁</div>
            </div>
            <button class="btn-principal" id="btn-inflar-globos" style="width:100%; padding:22px 0; font-size:1.1rem;" ontouchstart="event.preventDefault(); tocarCarreraGlobos();" onclick="tocarCarreraGlobos()">🎈 TOCÁ RÁPIDO</button>
        </div>`;
    arrancarCarreraGlobos(horaFin);
}

let _toquesLocalesGlobos = 0;
let _unsubRivalGlobos = null;
let _terminandoGlobos = false;

function arrancarCarreraGlobos(horaFin){
    _toquesLocalesGlobos = 0;
    _terminandoGlobos = false;
    if (_unsubRivalGlobos) _unsubRivalGlobos();
    _unsubRivalGlobos = window.onSnapshot(refCarreraGlobos(), (snap) => {
        const data = snap.exists() ? snap.data() : null;
        if (!data) return;
        const progresoRival = data[miRival === 'nico' ? 'progresoNico' : 'progresoCarito'] || 0;
        const pct = Math.min(100, (progresoRival / TOQUES_PARA_GANAR_GLOBOS) * 100);
        const barra = document.getElementById('barra-rival-globos');
        const globo = document.getElementById('globo-rival');
        if (barra) barra.style.width = pct + '%';
        if (globo) globo.style.left = `calc(${pct}% - ${pct > 90 ? 20 : 0}px)`;
        if (data.fase === 'terminado' && !_terminandoGlobos) { _terminandoGlobos = true; if (window._loopGlobos) clearInterval(window._loopGlobos); if (_unsubRivalGlobos) _unsubRivalGlobos(); renderCarreraGlobos(data); }
    });

    window._loopGlobos = setInterval(() => {
        const el = document.getElementById('tiempo-globos');
        const seg = Math.max(0, Math.ceil((horaFin - Date.now()) / 1000));
        if (el) el.innerText = seg + 's';
        if (Date.now() >= horaFin && !_terminandoGlobos) terminarCarreraGlobos(null);
    }, 200);
}

async function tocarCarreraGlobos(){
    if (_terminandoGlobos) return;
    _toquesLocalesGlobos++;
    vibrarJ(6);
    const pct = Math.min(100, (_toquesLocalesGlobos / TOQUES_PARA_GANAR_GLOBOS) * 100);
    const barra = document.getElementById('barra-yo-globos');
    const globo = document.getElementById('globo-yo');
    if (barra) barra.style.width = pct + '%';
    if (globo) globo.style.left = `calc(${pct}% - ${pct > 90 ? 20 : 0}px)`;
    sincronizarPuntajeEnVivo(refCarreraGlobos(), miIdentidad === 'nico' ? 'progresoNico' : 'progresoCarito', _toquesLocalesGlobos, 150);
    if (_toquesLocalesGlobos >= TOQUES_PARA_GANAR_GLOBOS) terminarCarreraGlobos(miIdentidad);
}

async function terminarCarreraGlobos(ganadorForzado){
    if (_terminandoGlobos) return;
    _terminandoGlobos = true;
    if (window._loopGlobos) clearInterval(window._loopGlobos);
    if (_unsubRivalGlobos) { _unsubRivalGlobos(); _unsubRivalGlobos = null; }
    try {
        const snap = await new Promise(res => { const u = window.onSnapshot(refCarreraGlobos(), s => { u(); res(s); }); });
        const data = snap.data();
        if (data.fase === 'terminado') { renderCarreraGlobos(data); return; }
        let ganador = ganadorForzado;
        if (!ganador) {
            const pNico = data.progresoNico || 0, pCarito = data.progresoCarito || 0;
            if (pNico > pCarito) ganador = 'nico';
            else if (pCarito > pNico) ganador = 'carito';
        }
        const victorias = { ...(data.victorias || { nico: 0, carito: 0 }) };
        if (ganador) victorias[ganador] = (victorias[ganador] || 0) + 1;
        await window.updateDoc(refCarreraGlobos(), {
            fase: 'terminado', ganador,
            [miIdentidad === 'nico' ? 'progresoNico' : 'progresoCarito']: _toquesLocalesGlobos,
            victorias
        });
        if (ganador && typeof registrarEvento === 'function') {
            registrarEvento('gano_partida', `${nombreJugador(ganador)} ganó la Carrera de Globos`);
        }
    } catch (e) {
        console.error('No se pudo terminar la carrera de globos:', e);
    }
    const cont = document.getElementById('contenido-carreraglobos');
    if (cont) delete cont.dataset.jugandoLocal;
}

async function revanchaCarreraGlobos(){
    vibrarJ(10);
    const victorias = await leerVictoriasCarreraGlobos();
    await window.setDoc(refCarreraGlobos(), { fase: 'esperando', listos: {}, victorias });
}
