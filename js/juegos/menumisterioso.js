// ==================== MENÚ MISTERIOSO ====================
// A cada uno le toca un trío de ingredientes al azar (pueden repetirse
// entre los dos, eso es parte de la gracia) y tiene que inventar un
// plato imaginario que los use a todos. Nadie ve lo que escribió el
// otro hasta que los dos mandaron el suyo — mismo patrón "responder y
// revelar a la vez" que ya usa ADN de la Pareja.
const INGREDIENTES_MENU = [
    '🍓 Frutillas', '🧂 Sal marina', '🌶️ Ají picante', '🍯 Miel', '🧀 Queso azul',
    '🍍 Ananá', '🥥 Coco rallado', '☕ Café molido', '🍫 Chocolate amargo', '🌰 Castañas',
    '🍋 Limón', '🧄 Ajo', '🌿 Menta fresca', '🥜 Maní', '🍭 Caramelo',
    '🥒 Pepinillos', '🍄 Hongos', '🌽 Choclo', '🍆 Berenjena', '🫐 Arándanos',
    '🍺 Cerveza', '🍷 Vino tinto', '🥓 Panceta', '🍞 Pan rallado', '🧈 Manteca',
    '🍬 Golosinas surtidas', '🌭 Salchicha', '🍣 Wasabi', '🥨 Pretzels', '🍿 Pop corn',
    '🧇 Waffle', '🍩 Dona', '🍕 Extra queso', '🥭 Mango', '🍉 Sandía',
    '🫚 Jengibre', '🍪 Galletitas', '🥑 Palta', '🍊 Mandarina', '🧊 Hielo',
];

function refMenuMisterioso(){ return window.doc(window.db, 'juegos', 'menumisterioso'); }

function _elegirIngredientesAlAzar(cantidad){
    const copia = [...INGREDIENTES_MENU];
    for (let i = copia.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copia[i], copia[j]] = [copia[j], copia[i]];
    }
    return copia.slice(0, cantidad);
}

function _escaparTextoMenu(texto){
    const div = document.createElement('div');
    div.innerText = texto == null ? '' : String(texto);
    return div.innerHTML;
}

let _menuFaseAnterior = null;
function iniciarMenuMisterioso(){
    _menuFaseAnterior = null;
    if (window._unsubMenuMisterioso) window._unsubMenuMisterioso();
    window._unsubMenuMisterioso = window.onSnapshot(refMenuMisterioso(), (snap) => {
        const datos = snap.exists() ? snap.data() : null;
        if (datos && datos.fase === 'revelado' && _menuFaseAnterior === 'jugando' && window.sfx) window.sfx.revelar();
        _menuFaseAnterior = datos ? datos.fase : null;
        renderMenuMisterioso(datos);
    }, (err) => {
        console.error('Error de Firestore en menú misterioso:', err);
        document.getElementById('contenido-menumisterioso').innerHTML = `<div class="panel texto-centro texto-tenue">⚠️ No se pudo conectar (${err.code || 'error'}).</div>`;
    });
}

let _platoLocalMenu = '';

function renderMenuMisterioso(estado){
    const cont = document.getElementById('contenido-menumisterioso');
    if (!estado || estado.fase === 'sin_ronda' || estado.fase === 'esperando') {
        const listoYo = estado?.listos?.[miIdentidad];
        const listoRival = estado?.listos?.[miRival];
        cont.innerHTML = `<div class="panel texto-centro">
            <p class="texto-tenue">Les toca a cada uno 3 ingredientes al azar. Inventen un plato (imaginario, no hace falta cocinarlo de verdad) que los use a los tres.</p>
            <div class="texto-tenue" style="margin-bottom:10px;">
                ${nombreJugador(miIdentidad)}: ${listoYo ? '✅ listo/a' : '⏳ esperando'}<br>
                ${nombreJugador(miRival)}: ${listoRival ? '✅ listo/a' : '⏳ esperando'}
            </div>
            <button class="btn-principal" ${listoYo ? 'disabled style="opacity:0.5;"' : ''} onclick="marcarListoMenuMisterioso()">${listoYo ? 'Esperando al otro…' : '¡Estoy listo/a! 🍳'}</button>
        </div>`;
        return;
    }

    const misIngredientes = estado[`ingredientes${miIdentidad === 'nico' ? 'Nico' : 'Carito'}`] || [];
    const yaEnvie = !!estado[`plato${miIdentidad === 'nico' ? 'Nico' : 'Carito'}`];

    if (estado.fase === 'revelado') {
        cont.innerHTML = `<div class="panel texto-centro logro-animado"><p style="font-family:var(--fuente-titulo); font-size:1.3rem;">¡A la mesa! 🍽️</p></div>
        <div class="panel">
            <p class="texto-tenue" style="margin:0 0 6px;">${nombreJugador('nico')} tenía: ${estado.ingredientesNico.join(' · ')}</p>
            <p style="margin:0; font-weight:700;">${_escaparTextoMenu(estado.platoNico)}</p>
        </div>
        <div class="panel">
            <p class="texto-tenue" style="margin:0 0 6px;">${nombreJugador('carito')} tenía: ${estado.ingredientesCarito.join(' · ')}</p>
            <p style="margin:0; font-weight:700;">${_escaparTextoMenu(estado.platoCarito)}</p>
        </div>
        <button class="btn-principal" onclick="reiniciarMenuMisterioso()">🔁 Otro menú</button>`;
        return;
    }

    if (yaEnvie) {
        cont.innerHTML = `<div class="panel texto-centro texto-tenue destello">Ya mandaste tu plato. Esperando a ${nombreJugador(miRival)}…</div>`;
        return;
    }

    cont.innerHTML = `<div class="panel">
        <p class="texto-tenue" style="margin:0 0 10px;">Tus ingredientes de hoy:</p>
        <p style="font-size:1.15rem; margin:0 0 14px;">${misIngredientes.join('  ·  ')}</p>
        <textarea id="input-plato-menu" placeholder="Describí el plato que armarías con esto…" rows="3" maxlength="200" style="width:100%; box-sizing:border-box; font-family:var(--fuente-texto); background:rgba(255,255,255,0.06); color:var(--texto); border:1px solid var(--borde); border-radius:12px; padding:10px; resize:none;">${_escaparTextoMenu(_platoLocalMenu)}</textarea>
        <button class="btn-principal" style="margin-top:10px;" onclick="enviarMenuMisterioso()">Enviar mi plato</button>
    </div>`;
    const ta = document.getElementById('input-plato-menu');
    if (ta) ta.oninput = () => { _platoLocalMenu = ta.value; };
}

async function marcarListoMenuMisterioso(){
    vibrarJ(12);
    _platoLocalMenu = '';
    const ref = refMenuMisterioso();
    await window.runTransaction(window.db, async (tx) => {
        const snap = await tx.get(ref);
        const estado = snap.exists() ? snap.data() : null;
        if (estado?.listos?.[miIdentidad]) return;
        const listos = { ...(estado?.listos || {}), [miIdentidad]: true };
        if (listos.nico && listos.carito) {
            tx.set(ref, {
                fase: 'jugando', listos: {},
                ingredientesNico: _elegirIngredientesAlAzar(3),
                ingredientesCarito: _elegirIngredientesAlAzar(3),
                platoNico: null, platoCarito: null,
            });
        } else {
            tx.set(ref, { fase: 'esperando', listos }, { merge: true });
        }
    });
}

async function reiniciarMenuMisterioso(){
    vibrarJ(12);
    await window.setDoc(refMenuMisterioso(), { fase: 'esperando', listos: {} });
}

async function enviarMenuMisterioso(){
    const input = document.getElementById('input-plato-menu');
    if (!input) return;
    const plato = input.value.trim();
    if (!plato) return;
    vibrarJ([15, 30, 15]);
    const campo = miIdentidad === 'nico' ? 'platoNico' : 'platoCarito';
    const snap = await new Promise(res => { const u = window.onSnapshot(refMenuMisterioso(), s => { u(); res(s); }); });
    const data = snap.data();
    const otro = miIdentidad === 'nico' ? data.platoCarito : data.platoNico;
    _platoLocalMenu = '';
    await window.updateDoc(refMenuMisterioso(), { [campo]: plato, ...(otro ? { fase: 'revelado' } : {}) });
}
