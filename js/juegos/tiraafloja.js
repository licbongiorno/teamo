// ==================== TIRA Y AFLOJA ====================
// posicion: 0 = gana Nico, 100 = gana Carito, 50 = centro.
function refTiraAfloja(){ return window.doc(window.db, 'juegos', 'tiraafloja'); }

function iniciarTiraAfloja(){
    if (window._unsubTiraAfloja) window._unsubTiraAfloja();
    window._unsubTiraAfloja = window.onSnapshot(refTiraAfloja(), (snap) => {
        renderTiraAfloja(snap.exists() ? snap.data() : null);
    }, (err) => {
        console.error('Error de Firestore en tiraafloja:', err);
        document.getElementById('contenido-tiraafloja').innerHTML = `<div class="panel texto-centro texto-tenue">⚠️ No se pudo conectar (${err.code || 'error'}).</div>`;
    });
}

let _toquesLocalesTA = 0;

function renderTiraAfloja(estado){
    const cont = document.getElementById('contenido-tiraafloja');
    if (window._intervaloTA) { clearInterval(window._intervaloTA); window._intervaloTA = null; }

    if (!estado || estado.fase === 'sin_partida') {
        cont.innerHTML = `<div class="panel texto-centro">
            <p class="texto-tenue">Toques rápidos para llevar el corazón a tu lado. Nico empuja hacia arriba, Carito hacia abajo.</p>
            <button class="btn-principal" onclick="nuevaPartidaTiraAfloja()">Empezar</button>
        </div>`;
        return;
    }

    if (estado.fase === 'terminado') {
        const p = estado.puntajes || { nico: 0, carito: 0 };
        cont.innerHTML = `<div class="panel texto-centro logro-animado">
            <div style="font-size:1.2rem; margin-bottom:8px;">🏆 ¡Ganó ${nombreJugador(estado.ganador)}!</div>
            <div class="texto-tenue">Nico ${p.nico || 0} — Carito ${p.carito || 0}</div>
            <button class="btn-principal" style="margin-top:14px;" onclick="nuevaPartidaTiraAfloja()">🔁 Revancha</button>
        </div>`;
        return;
    }

    const pos = estado.posicion ?? 50;
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
    const area = document.getElementById('area-toque-ta');
    if (area) { area.classList.remove('sacudir'); void area.offsetWidth; area.classList.add('sacudir'); }
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

async function nuevaPartidaTiraAfloja(){
    vibrarJ(12);
    _toquesLocalesTA = 0;
    const snap = await new Promise(res => { const u = window.onSnapshot(refTiraAfloja(), s => { u(); res(s); }); });
    const anterior = snap.exists() ? snap.data() : null;
    await window.setDoc(refTiraAfloja(), {
        fase: 'jugando', posicion: 50, ganador: null, puntajes: anterior?.puntajes || { nico: 0, carito: 0 }
    });
}
