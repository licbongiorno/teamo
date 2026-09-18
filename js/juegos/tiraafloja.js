// ==================== TIRA Y AFLOJA ====================
// posicion: 0 = gana Nico, 100 = gana Carito, 50 = centro.
// Es una carrera de toques en tiempo real: antes arrancaba apenas
// uno tocaba "Empezar", sin esperar al otro (se podía "ganar" solo,
// jugando contra nadie). Ahora sigue el mismo patrón "ambos listos"
// + cuenta regresiva de los demás duelos en vivo (ver arcade-comun.js).
function refTiraAfloja(){ return window.doc(window.db, 'juegos', 'tiraafloja'); }

let _tiraAflojaFaseAnterior = null;
function iniciarTiraAfloja(){
    _taRondaMontada = false;
    _tiraAflojaFaseAnterior = null;
    if (window._unsubTiraAfloja) window._unsubTiraAfloja();
    window._unsubTiraAfloja = window.onSnapshot(refTiraAfloja(), (snap) => {
        const datos = snap.exists() ? snap.data() : null;
        if (datos && datos.fase === 'terminado' && _tiraAflojaFaseAnterior === 'jugando' && window.sfx) {
            window.sfx[datos.ganador === miIdentidad ? 'victoria' : 'derrota']();
            if (window.fx && (datos.ganador === miIdentidad)) window.fx.confeti();
        }
        _tiraAflojaFaseAnterior = datos ? datos.fase : null;
        renderTiraAfloja(datos);
    }, (err) => {
        console.error('Error de Firestore en tiraafloja:', err);
        document.getElementById('contenido-tiraafloja').innerHTML = `<div class="panel texto-centro texto-tenue">⚠️ No se pudo conectar (${err.code || 'error'}).</div>`;
    });
}

let _toquesLocalesTA = 0;
let _taRondaMontada = false;
let _cuentaRegresivaTA = null;

function renderTiraAfloja(estado){
    const cont = document.getElementById('contenido-tiraafloja');
    if (_cuentaRegresivaTA) { clearTimeout(_cuentaRegresivaTA); _cuentaRegresivaTA = null; }
    if (window._intervaloTA) { clearInterval(window._intervaloTA); window._intervaloTA = null; }

    if (!estado || estado.fase === 'sin_partida') {
        _taRondaMontada = false;
        cont.innerHTML = `<div class="panel texto-centro">
            <p class="texto-tenue">Toques rápidos para llevar el corazón a tu lado. Nico empuja hacia arriba, Carito hacia abajo.</p>
            <button class="btn-principal" onclick="marcarListoTiraAfloja()">Empezar</button>
        </div>`;
        return;
    }

    if (estado.fase === 'esperando') {
        _taRondaMontada = false;
        const listoYo = estado.listos?.[miIdentidad];
        const listoRival = estado.listos?.[miRival];
        const p = estado.puntajes || { nico: 0, carito: 0 };
        cont.innerHTML = `<div class="panel texto-centro">
            <p class="texto-tenue">Toques rápidos para llevar el corazón a tu lado. Nico empuja hacia arriba, Carito hacia abajo.</p>
            <div class="texto-tenue" style="margin:10px 0;">Nico ${p.nico || 0} — Carito ${p.carito || 0}</div>
            <div class="texto-tenue" style="margin-bottom:10px;">
                ${nombreJugador(miIdentidad)}: ${listoYo ? '✅ listo/a' : '⏳ esperando'}<br>
                ${nombreJugador(miRival)}: ${listoRival ? '✅ listo/a' : '⏳ esperando'}
            </div>
            <button class="btn-principal" ${listoYo ? 'disabled style="opacity:0.5;"' : ''} onclick="marcarListoTiraAfloja()">${listoYo ? 'Esperando al otro…' : '¡Estoy listo/a! ❤️'}</button>
        </div>`;
        if (listoYo && listoRival) iniciarRondaArcadeSiCorresponde(refTiraAfloja(), 'tiraafloja', 0, { posicion: 50, ganador: null });
        return;
    }

    if (estado.fase === 'terminado') {
        _taRondaMontada = false;
        const p = estado.puntajes || { nico: 0, carito: 0 };
        cont.innerHTML = `<div class="panel texto-centro logro-animado">
            <div style="font-size:1.2rem; margin-bottom:8px;">🏆 ¡Ganó ${nombreJugador(estado.ganador)}!</div>
            <div class="texto-tenue">Nico ${p.nico || 0} — Carito ${p.carito || 0}</div>
            <button class="btn-principal" style="margin-top:14px;" onclick="revanchaTiraAfloja()">🔁 Revancha</button>
        </div>`;
        return;
    }

    // fase === 'jugando'
    const restante = (estado.horaInicio || Date.now()) - Date.now();
    if (restante > -500) {
        cont.innerHTML = htmlCuentaRegresivaArcade(restante);
        _cuentaRegresivaTA = setTimeout(() => renderTiraAfloja(estado), restante > 0 ? Math.min(restante, 200) : 150);
        return;
    }

    const pos = estado.posicion ?? 50;

    // Este render se dispara con CADA actualización de posición, incluidas
    // las que llegan por los toques del rival (comparten el mismo
    // documento). Antes esto reconstruía toda la pantalla y ponía
    // _toquesLocalesTA en 0 en cada una de esas actualizaciones — como acá
    // se juega tocando en tiempo real, eso borraba toques propios recién
    // hechos que todavía no se habían sincronizado (cada 300ms). Ahora la
    // pantalla se arma una sola vez por ronda y las actualizaciones
    // siguientes sólo mueven la barra.
    if (_taRondaMontada) {
        const barra = document.getElementById('barra-ta');
        if (barra) barra.style.top = pos + '%';
        window._intervaloTA = setInterval(() => sincronizarTiraAfloja(), 300);
        return;
    }
    _taRondaMontada = true;
    _toquesLocalesTA = 0;
    let html = `<div class="panel texto-centro">
        <div class="texto-tenue" style="margin-bottom:10px;">Nico ⬆️ — tocá lo más rápido que puedas — ⬇️ Carito</div>
        <div style="position:relative; height:min(50vh,340px); width:60px; margin:0 auto; background:rgba(255,255,255,0.06); border-radius:30px; overflow:hidden;">
            <div id="barra-ta" style="position:absolute; left:0; top:${pos}%; width:100%; height:14%; transform:translateY(-50%); display:flex; align-items:center; justify-content:center; font-size:1.8rem; transition:top 0.25s ease;">❤️</div>
        </div>
    </div>
    <div class="area-reflejos area-espera" id="area-toque-ta" onclick="tocarTiraAfloja()" style="height:min(30vh,220px); margin-top:14px;">
        <div class="texto-reflejos" style="font-size:1.3rem;">TOCÁ ACÁ</div>
    </div>`;
    cont.innerHTML = html;

    window._intervaloTA = setInterval(() => sincronizarTiraAfloja(), 300);
}

function tocarTiraAfloja(){
    _toquesLocalesTA++;
    vibrarJ(6);
    if (window.sfx) window.sfx.tick();
    const area = document.getElementById('area-toque-ta');
    if (area) { area.classList.remove('sacudir'); void area.offsetWidth; area.classList.add('sacudir'); }
}

async function marcarListoTiraAfloja(){
    vibrarJ(12);
    // Transacción (en vez de leer con onSnapshot y despues escribir
    // con merge suelto): si los dos tocan "listo" casi al mismo
    // tiempo, una lectura suelta puede no ver todavía la marca del
    // otro y la escritura de uno pisa la del otro, dejando la
    // partida esperando para siempre.
    await window.runTransaction(window.db, async (tx) => {
        const snap = await tx.get(refTiraAfloja());
        const estado = snap.exists() ? snap.data() : null;
        if (estado?.fase === 'esperando' && estado?.listos?.[miIdentidad]) return;
        tx.set(refTiraAfloja(), {
            fase: 'esperando',
            listos: { ...(estado?.listos || {}), [miIdentidad]: true },
            puntajes: estado?.puntajes || { nico: 0, carito: 0 }
        }, { merge: true });
    });
}

async function sincronizarTiraAfloja(){
    if (_toquesLocalesTA === 0) return;
    const toques = _toquesLocalesTA;
    _toquesLocalesTA = 0;
    const snap = await new Promise(res => { const u = window.onSnapshot(refTiraAfloja(), s => { u(); res(s); }); });
    const data = snap.data();
    if (!data || data.fase !== 'jugando') return;
    const direccion = miIdentidad === 'nico' ? -1 : 1;
    let nuevaPos = (data.posicion ?? 50) + direccion * toques * 1.5;
    nuevaPos = Math.max(0, Math.min(100, nuevaPos));

    let updates = { posicion: nuevaPos };
    if (nuevaPos <= 0 || nuevaPos >= 100) {
        const ganador = nuevaPos <= 0 ? 'nico' : 'carito';
        const puntajes = { ...(data.puntajes || { nico: 0, carito: 0 }) };
        puntajes[ganador] = (puntajes[ganador] || 0) + 1;
        updates.fase = 'terminado'; updates.ganador = ganador; updates.puntajes = puntajes;
        vibrarJ([20, 40, 20, 40, 80]);
    }
    await window.updateDoc(refTiraAfloja(), updates);
}

async function revanchaTiraAfloja(){
    vibrarJ(10);
    _toquesLocalesTA = 0;
    const snap = await new Promise(res => { const u = window.onSnapshot(refTiraAfloja(), s => { u(); res(s); }); });
    const anterior = snap.exists() ? snap.data() : null;
    await window.setDoc(refTiraAfloja(), {
        fase: 'esperando', listos: {}, puntajes: anterior?.puntajes || { nico: 0, carito: 0 }
    });
}
