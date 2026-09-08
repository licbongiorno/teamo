// ==================== ATRAPAR FRUTAS ====================
// Juego ASINCRÓNICO de SUPERVIVENCIA: cada quien juega su ronda cuando quiera,
// sin límite de tiempo, con 3 vidas. Se guarda el MEJOR puntaje de cada uno y se comparan.
const VIDAS_INICIALES_FRUTAS = 3;
const FRUTAS_EMOJI = ['🍎','🍊','🍋','🍇','🍓','🍉','🍑','🍒'];
const PROB_CORAZON_FRUTAS = 0.10;   // probabilidad de que caiga un corazón en vez de fruta
const PROB_CHOCOLATE_FRUTAS = 0.07; // probabilidad de que caiga un chocolate en vez de fruta

function refFrutas(){ return window.doc(window.db, 'juegos', 'frutas'); }

function iniciarFrutas(){
    const contInicial = document.getElementById('contenido-frutas');
    if (contInicial) delete contInicial.dataset.jugandoLocal;
    if (window._unsubFrutas) window._unsubFrutas();
    window._unsubFrutas = window.onSnapshot(refFrutas(), (snap) => {
        renderFrutas(snap.exists() ? snap.data() : null);
    }, (err) => {
        console.error('Error de Firestore en frutas:', err);
        const cont = document.getElementById('contenido-frutas');
        if (cont && cont.dataset.jugandoLocal !== '1') {
            cont.innerHTML = `<div class="panel texto-centro texto-tenue">⚠️ No se pudo conectar (${err.code || 'error'}). Si el error dice "permission-denied", hay que sumar la colección "juegos" a las Reglas de Firestore.</div>`;
        }
    });
}

function renderFrutas(estado){
    const cont = document.getElementById('contenido-frutas');
    // Mientras haya una ronda local corriendo, no se reconstruye el DOM
    // (los snapshots por nuestros propios updateDoc no deben reiniciar el canvas).
    if (cont.dataset.jugandoLocal === '1') return;

    const mejorYo = estado?.mejores?.[miIdentidad] || 0;
    const mejorRival = estado?.mejores?.[miRival] || 0;
    let comparacion = 'Todavía nadie jugó una ronda.';
    if (mejorYo || mejorRival) {
        if (mejorYo > mejorRival) comparacion = '🏆 Vas ganando vos';
        else if (mejorRival > mejorYo) comparacion = `🏆 Va ganando ${nombreJugadorFrutas(miRival)}`;
        else comparacion = '🤝 Están empatados';
    }

    cont.innerHTML = `
        <div class="panel texto-centro">
            <p class="texto-tenue">Modo supervivencia: empezás con 3 vidas ❤️. Si se te cae una fruta, perdés una vida. Atrapá corazones para sumar vidas y evitá los chocolates 🍫, ¡te dejan sin ninguna! Cada uno juega cuando quiere — se compara el mejor puntaje de cada uno.</p>
            <div style="display:flex; justify-content:space-around; margin:14px 0;">
                <div><div class="texto-tenue" style="font-size:0.75rem;">Vos</div><div style="font-size:1.5rem;">${mejorYo} 🍓</div></div>
                <div><div class="texto-tenue" style="font-size:0.75rem;">${nombreJugadorFrutas(miRival)}</div><div style="font-size:1.5rem;">${mejorRival} 🍓</div></div>
            </div>
            <div class="texto-tenue" style="margin-bottom:12px;">${comparacion}</div>
            <button class="btn-principal" onclick="jugarRondaFrutas()">${mejorYo ? '🔁 Jugar de nuevo' : '¡Jugar! 🍓'}</button>
        </div>`;
}
function nombreJugadorFrutas(id){ return id === 'carito' ? 'Carito' : 'Nico'; }

function jugarRondaFrutas(){
    vibrarJ(12);
    const cont = document.getElementById('contenido-frutas');
    cont.dataset.jugandoLocal = '1';
    cont.innerHTML = `
        <div class="panel">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; font-size:0.9rem;">
                <span>Puntaje: <b id="marcador-yo-frutas">0</b> 🍓</span>
                <span id="vidas-frutas" style="font-size:1rem;">${'❤️'.repeat(VIDAS_INICIALES_FRUTAS)}</span>
            </div>
            <div style="position:relative; width:100%; aspect-ratio:3/4; max-height:60vh; background:rgba(0,0,0,0.25); border-radius:14px; overflow:hidden; touch-action:none;" id="area-frutas">
                <canvas id="canvas-frutas" style="position:absolute; inset:0; width:100%; height:100%;"></canvas>
            </div>
            <p class="texto-tenue texto-centro" style="margin-top:8px;">Deslizá el dedo (o el mouse) para mover la canasta 🧺 — ¡sobrevive lo más que puedas!</p>
        </div>`;
    arrancarCanvasFrutas();
}

function arrancarCanvasFrutas(){
    const canvas = document.getElementById('canvas-frutas');
    if (!canvas) return;

    const area = document.getElementById('area-frutas');
    const ctx = canvas.getContext('2d');
    function ajustarTamano(){
        canvas.width = area.clientWidth;
        canvas.height = area.clientHeight;
    }
    ajustarTamano();
    const onResize = () => ajustarTamano();
    window.addEventListener('resize', onResize);

    let canastaX = canvas.width / 2;
    const canastaAncho = 60, canastaAlto = 34;
    let objetos = [];
    let puntaje = 0;
    let vidas = VIDAS_INICIALES_FRUTAS;
    let terminando = false;

    function moverCanasta(clientX){
        const rect = canvas.getBoundingClientRect();
        canastaX = Math.max(canastaAncho/2, Math.min(canvas.width - canastaAncho/2, clientX - rect.left));
    }
    const onTouchMove = (e) => { e.preventDefault(); if (e.touches[0]) moverCanasta(e.touches[0].clientX); };
    const onMouseMove = (e) => moverCanasta(e.clientX);
    area.addEventListener('touchmove', onTouchMove, { passive:false });
    area.addEventListener('mousemove', onMouseMove);

    function actualizarVidasUI(){
        const el = document.getElementById('vidas-frutas');
        if (el) el.innerText = vidas > 0 ? '❤️'.repeat(vidas) : '💔';
    }

    function spawnObjeto(){
        const azar = Math.random();
        let tipo = 'fruta';
        if (azar < PROB_CHOCOLATE_FRUTAS) tipo = 'chocolate';
        else if (azar < PROB_CHOCOLATE_FRUTAS + PROB_CORAZON_FRUTAS) tipo = 'corazon';
        const emoji = tipo === 'chocolate' ? '🍫' : tipo === 'corazon' ? '❤️' : FRUTAS_EMOJI[Math.floor(Math.random() * FRUTAS_EMOJI.length)];
        objetos.push({
            x: Math.random() * (canvas.width - 30) + 15,
            y: -20,
            vel: 1.6 + Math.random() * 2.2,
            emoji, tipo
        });
    }
    let spawnAcumulado = 0;

    async function terminarPartida(){
        if (terminando) return;
        terminando = true;
        clearInterval(window._timerFrutas);
        if (window._loopFrutas) cancelAnimationFrame(window._loopFrutas);
        window.removeEventListener('resize', onResize);
        area.removeEventListener('touchmove', onTouchMove);
        area.removeEventListener('mousemove', onMouseMove);
        await finalizarRondaFrutas(puntaje);
    }

    function loop(){
        ctx.clearRect(0,0,canvas.width,canvas.height);
        spawnAcumulado++;
        if (spawnAcumulado > 42) { spawnObjeto(); spawnAcumulado = 0; }

        ctx.font = '28px sans-serif';
        ctx.textAlign = 'center';
        for (let i = objetos.length - 1; i >= 0; i--) {
            const f = objetos[i];
            f.y += f.vel;
            ctx.fillText(f.emoji, f.x, f.y);
            const distX = Math.abs(f.x - canastaX);
            const distY = Math.abs(f.y - (canvas.height - 26));
            if (distX < canastaAncho/2 && distY < canastaAlto/2 && f.y > 0) {
                objetos.splice(i,1);
                if (f.tipo === 'chocolate') {
                    vidas = 0;
                    actualizarVidasUI();
                    vibrarJ([20,40,20,40,20]);
                    terminarPartida();
                    break;
                } else if (f.tipo === 'corazon') {
                    vidas++;
                    actualizarVidasUI();
                    vibrarJ(15);
                } else {
                    puntaje++;
                    const marcador = document.getElementById('marcador-yo-frutas');
                    if (marcador) marcador.innerText = puntaje;
                    vibrarJ(10);
                }
            } else if (f.y > canvas.height + 20) {
                objetos.splice(i,1);
                if (f.tipo === 'fruta') {
                    vidas--;
                    actualizarVidasUI();
                    vibrarJ([10,30,10]);
                    if (vidas <= 0) { terminarPartida(); break; }
                }
            }
        }

        ctx.font = '38px sans-serif';
        ctx.fillText('🧺', canastaX, canvas.height - 8);

        if (!terminando) window._loopFrutas = requestAnimationFrame(loop);
    }
    loop();
}

async function finalizarRondaFrutas(puntajeObtenido){
    vibrarJ([15,30,15]);
    let mejorAnterior = 0;
    let esNuevoMejor = false;
    try {
        const snap = await new Promise((resolve, reject) => {
            const u = window.onSnapshot(refFrutas(), s => { u(); resolve(s); }, e => { u(); reject(e); });
        });
        mejorAnterior = snap.exists() ? (snap.data().mejores?.[miIdentidad] || 0) : 0;
        if (puntajeObtenido > mejorAnterior) {
            esNuevoMejor = true;
            await window.setDoc(refFrutas(), { mejores: { [miIdentidad]: puntajeObtenido } }, { merge: true });
        }
    } catch (e) {
        console.error('No se pudo guardar el puntaje de frutas:', e);
    }

    const cont = document.getElementById('contenido-frutas');
    cont.innerHTML = `
        <div class="panel texto-centro">
            <div style="font-size:1.3rem; margin-bottom:8px;">${esNuevoMejor ? '🎉 ¡Nuevo mejor puntaje!' : '💔 Te quedaste sin vidas'}</div>
            <div style="font-size:1.8rem; margin-bottom:6px;">${puntajeObtenido} 🍓</div>
            <div class="texto-tenue" style="margin-bottom:14px;">${esNuevoMejor ? '' : `Tu mejor puntaje sigue siendo ${Math.max(mejorAnterior, puntajeObtenido)}.`}</div>
            <button class="btn-principal" onclick="volverAMenuFrutas()">Volver</button>
        </div>`;
    // Ya no estamos en una ronda local: el próximo snapshot puede reconstruir el DOM normalmente.
    delete cont.dataset.jugandoLocal;
}

function volverAMenuFrutas(){
    vibrarJ(10);
    const cont = document.getElementById('contenido-frutas');
    delete cont.dataset.jugandoLocal;
    iniciarFrutas();
}
