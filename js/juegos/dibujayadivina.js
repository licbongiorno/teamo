// ==================== DIBUJA Y ADIVINA ====================
const PALABRAS_DIBUJAR = [
    "Casa",
    "Sol",
    "Árbol",
    "Corazón",
    "Gato",
    "Perro",
    "Pescado",
    "Auto",
    "Bicicleta",
    "Avión",
    "Barco",
    "Flor",
    "Estrella",
    "Luna",
    "Nube",
    "Lluvia",
    "Paraguas",
    "Sombrero",
    "Reloj",
    "Libro",
    "Lápiz",
    "Silla",
    "Mesa",
    "Puerta",
    "Ventana",
    "Escalera",
    "Puente",
    "Montaña",
    "Río",
    "Playa",
    "Ola",
    "Pelota",
    "Guitarra",
    "Piano",
    "Tambor",
    "Micrófono",
    "Cámara",
    "Celular",
    "Computadora",
    "Televisor",
    "Taza",
    "Plato",
    "Tenedor",
    "Cuchara",
    "Pizza",
    "Hamburguesa",
    "Helado",
    "Torta",
    "Manzana",
    "Banana",
    "Uva",
    "Sandía",
    "Zanahoria",
    "Robot",
    "Cohete",
    "Planeta",
    "Volcán",
    "Castillo",
    "Corona",
    "Llave",
    "Candado",
    "Anillo",
    "Regalo",
    "Globo",
    "Vela",
    "Bandera",
    "Semáforo",
    "Escoba",
    "Tijera",
    "Martillo",
    "Destornillador",
    "Bombilla",
    "Enchufe",
    "Pila",
    "Imán",
    "Escudo",
    "Espada",
    "Dragón",
    "Fantasma",
    "Bruja",
    "Vampiro",
    "Momia",
    "Dinosaurio",
    "Elefante",
    "León",
    "Jirafa",
    "Tortuga",
    "Rana",
    "Mariposa",
    "Abeja",
    "Araña",
    "Serpiente",
    "Pingüino",
    "Búho",
    "Loro",
    "Delfín",
    "Ballena",
    "Pulpo",
    "Cangrejo",
    "Estrella de mar",
    "Nieve",
    "Muñeco de nieve",
    "Iglú",
    "Cactus",
    "Molino de viento",
    "Faro",
    "Ancla"
];
const COLORES_DIBUJAR = ['#fdf6f0', '#ffb3c6', '#a8d8ff', '#f5d9a0'];

function refDibujaYAdivina(){ return window.doc(window.db, 'juegos', 'dibujayadivina'); }

function iniciarDibujaYAdivina(){
    if (window._unsubDibujaYAdivina) window._unsubDibujaYAdivina();
    window._unsubDibujaYAdivina = window.onSnapshot(refDibujaYAdivina(), (snap) => {
        renderDibujaYAdivina(snap.exists() ? snap.data() : null);
    }, (err) => {
        console.error('Error de Firestore en dibujayadivina:', err);
        document.getElementById('contenido-dibujayadivina').innerHTML = `<div class="panel texto-centro texto-tenue">⚠️ No se pudo conectar (${err.code || 'error'}).</div>`;
    });
}

let _colorActualDibujo = COLORES_DIBUJAR[0];
let _dibujando = false;
let _trazoActual = null;
let _canvasListo = false;

function renderDibujaYAdivina(estado){
    const cont = document.getElementById('contenido-dibujayadivina');
    if (!estado || estado.fase === 'sin_partida') {
        _canvasListo = false;
        cont.innerHTML = `<div class="panel texto-centro">
            <p class="texto-tenue">Uno dibuja con el dedo, el otro adivina. Al acertar, se cambian los roles.</p>
            <button class="btn-principal" onclick="nuevaPartidaDibujaYAdivina()">Empezar</button>
        </div>`;
        return;
    }

    const soyDibujante = estado.dibujante === miIdentidad;
    const p = estado.puntajes || { nico: 0, carito: 0 };

    let html = `<div class="panel texto-centro">
        <div style="display:flex; justify-content:space-between; font-size:0.85rem;"><span>Nico ${p.nico || 0}</span><span>Carito ${p.carito || 0}</span></div>
        <div class="texto-tenue" style="margin-top:6px;">${soyDibujante ? `Tu palabra: ${estado.palabra}` : `${nombreJugador(estado.dibujante)} está dibujando…`}</div>
    </div>`;

    html += `<div style="position:relative; width:100%; max-width:340px; aspect-ratio:1; margin:0 auto 12px; background:rgba(255,255,255,0.04); border:1px solid var(--borde); border-radius:16px; touch-action:none; overflow:hidden;">
        <canvas id="canvas-dibujo" style="position:absolute; inset:0; width:100%; height:100%;"></canvas>
    </div>`;

    if (soyDibujante) {
        html += `<div class="btn-fila" style="margin-bottom:10px;">
            ${COLORES_DIBUJAR.map(c => `<button onclick="elegirColorDibujo('${c}')" style="width:auto; flex:1; height:36px; border-radius:10px; border:2px solid ${_colorActualDibujo === c ? 'var(--rosa)' : 'transparent'}; background:${c};"></button>`).join('')}
        </div>
        <button class="btn-secundario" onclick="limpiarLienzoDibujo()">🧹 Limpiar lienzo</button>`;
    } else {
        html += `<div class="panel">
            <div style="display:flex; gap:8px;">
                <input type="text" id="input-adivinar-dibujo" placeholder="¿Qué es?" autocomplete="off"
                    style="flex:1; padding:10px; border-radius:10px; border:1px solid var(--borde); background:rgba(255,255,255,0.06); color:var(--texto);"
                    onkeydown="if(event.key==='Enter') adivinarDibujo()">
                <button class="btn-principal" style="width:auto;" onclick="adivinarDibujo()">Adivinar</button>
            </div>
        </div>`;
    }

    cont.innerHTML = html;
    configurarCanvasDibujo(estado, soyDibujante);
}

function configurarCanvasDibujo(estado, soyDibujante){
    const canvas = document.getElementById('canvas-dibujo');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width; canvas.height = rect.height;

    function redibujarTodo(){
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        (estado.trazos || []).forEach(t => {
            if (t.puntos.length < 2) return;
            ctx.beginPath();
            ctx.strokeStyle = t.color; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
            ctx.moveTo(t.puntos[0].x * canvas.width, t.puntos[0].y * canvas.height);
            t.puntos.slice(1).forEach(p => ctx.lineTo(p.x * canvas.width, p.y * canvas.height));
            ctx.stroke();
        });
    }
    redibujarTodo();

    if (!soyDibujante || _canvasListo) return;
    _canvasListo = true;

    function posRelativa(e){
        const r = canvas.getBoundingClientRect();
        const cx = e.touches ? e.touches[0].clientX : e.clientX;
        const cy = e.touches ? e.touches[0].clientY : e.clientY;
        return { x: (cx - r.left) / r.width, y: (cy - r.top) / r.height };
    }
    function empezar(e){
        e.preventDefault();
        _dibujando = true;
        _trazoActual = { color: _colorActualDibujo, puntos: [posRelativa(e)] };
    }
    function mover(e){
        if (!_dibujando) return;
        e.preventDefault();
        _trazoActual.puntos.push(posRelativa(e));
        const p1 = _trazoActual.puntos[_trazoActual.puntos.length - 2];
        const p2 = _trazoActual.puntos[_trazoActual.puntos.length - 1];
        if (p1) {
            ctx.beginPath(); ctx.strokeStyle = _trazoActual.color; ctx.lineWidth = 4; ctx.lineCap = 'round';
            ctx.moveTo(p1.x * canvas.width, p1.y * canvas.height);
            ctx.lineTo(p2.x * canvas.width, p2.y * canvas.height);
            ctx.stroke();
        }
    }
    async function terminar(){
        if (!_dibujando) return;
        _dibujando = false;
        if (_trazoActual && _trazoActual.puntos.length > 1) {
            const snap = await new Promise(res => { const u = window.onSnapshot(refDibujaYAdivina(), s => { u(); res(s); }); });
            const data = snap.data();
            if (data) {
                const trazos = [...(data.trazos || []), _trazoActual];
                await window.updateDoc(refDibujaYAdivina(), { trazos });
            }
        }
        _trazoActual = null;
    }
    canvas.addEventListener('touchstart', empezar, { passive: false });
    canvas.addEventListener('touchmove', mover, { passive: false });
    canvas.addEventListener('touchend', terminar);
    canvas.addEventListener('mousedown', empezar);
    canvas.addEventListener('mousemove', mover);
    canvas.addEventListener('mouseup', terminar);
    canvas.addEventListener('mouseleave', terminar);
}

function elegirColorDibujo(c){ _colorActualDibujo = c; vibrarJ(8); document.querySelectorAll('#contenido-dibujayadivina .btn-fila button').forEach(b => {}); refrescarVistaDibujo(); }
async function refrescarVistaDibujo(){
    const snap = await new Promise(res => { const u = window.onSnapshot(refDibujaYAdivina(), s => { u(); res(s); }); });
    if (snap.exists()) { _canvasListo = false; renderDibujaYAdivina(snap.data()); }
}

async function limpiarLienzoDibujo(){
    vibrarJ(12);
    _canvasListo = false;
    await window.updateDoc(refDibujaYAdivina(), { trazos: [] });
}

function elegirPalabraNueva(excluir){
    let palabra;
    do { palabra = PALABRAS_DIBUJAR[Math.floor(Math.random() * PALABRAS_DIBUJAR.length)]; } while (palabra === excluir);
    return palabra;
}

async function nuevaPartidaDibujaYAdivina(){
    vibrarJ(12);
    _canvasListo = false;
    await window.setDoc(refDibujaYAdivina(), {
        fase: 'jugando', dibujante: 'nico', palabra: elegirPalabraNueva(null),
        trazos: [], puntajes: { nico: 0, carito: 0 }
    });
}

async function adivinarDibujo(){
    const input = document.getElementById('input-adivinar-dibujo');
    const intento = input.value.trim().toLowerCase();
    if (!intento) return;
    const snap = await new Promise(res => { const u = window.onSnapshot(refDibujaYAdivina(), s => { u(); res(s); }); });
    const data = snap.data();
    if (!data || data.dibujante === miIdentidad) return;
    input.value = '';
    if (intento !== data.palabra.toLowerCase()) { vibrarJ([10, 30, 10]); return; }

    vibrarJ([15, 30, 15]);
    const puntajes = { ...(data.puntajes || { nico: 0, carito: 0 }) };
    puntajes.nico = (puntajes.nico || 0) + 1;
    puntajes.carito = (puntajes.carito || 0) + 1;
    _canvasListo = false;
    await window.setDoc(refDibujaYAdivina(), {
        fase: 'jugando', dibujante: miIdentidad, palabra: elegirPalabraNueva(data.palabra),
        trazos: [], puntajes
    });
}
