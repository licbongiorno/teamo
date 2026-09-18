// ==================== PALABRA EXPLOSIVA ====================
const CATEGORIAS_PALABRA_EXPLOSIVA = [
    "Frutas",
    "Países",
    "Animales",
    "Colores",
    "Comidas",
    "Ciudades",
    "Marcas",
    "Profesiones",
    "Deportes",
    "Instrumentos musicales",
    "Nombres de persona",
    "Películas",
    "Series de TV",
    "Objetos de cocina",
    "Prendas de ropa",
    "Partes del cuerpo",
    "Bebidas",
    "Flores",
    "Insectos",
    "Planetas",
    "Ríos",
    "Montañas",
    "Herramientas",
    "Muebles",
    "Juguetes",
    "Postres",
    "Verduras",
    "Medios de transporte",
    "Emociones",
    "Deportes olímpicos",
    "Superhéroes",
    "Videojuegos",
    "Redes sociales",
    "Materias escolares",
    "Estaciones del año",
    "Signos del zodíaco",
    "Elementos químicos",
    "Idiomas",
    "Continentes",
    "Océanos",
    "Razas de perro",
    "Razas de gato",
    "Tipos de música",
    "Bandas o cantantes",
    "Cadenas de comida rápida",
    "Aplicaciones de celular",
    "Marcas de auto",
    "Personajes de dibujos animados",
    "Cuentos infantiles",
    "Palabras en inglés",
    "Útiles escolares",
    "Electrodomésticos",
    "Tipos de queso",
    "Tipos de pasta",
    "Especias",
    "Piedras preciosas",
    "Metales",
    "Constelaciones",
    "Dioses de la mitología",
    "Monumentos famosos",
    "Capitales del mundo",
    "Ríos de Argentina",
    "Provincias argentinas",
    "Equipos de fútbol",
    "Marcas de ropa",
    "Tipos de baile",
    "Estilos de música",
    "Juegos de mesa",
    "Dulces y golosinas",
    "Tipos de pan",
    "Herramientas de cocina",
    "Partes de una casa",
    "Cosas de la playa",
    "Cosas de la montaña",
    "Cosas del espacio",
    "Cosas del mar",
    "Series animadas",
    "Villanos de película",
    "Princesas de Disney",
    "Objetos redondos",
    "Cosas que vuelan",
    "Cosas que hacen ruido",
    "Cosas frías",
    "Cosas calientes",
    "Cosas dulces",
    "Cosas puntiagudas",
    "Profesiones de la salud",
    "Materias de la facultad",
    "Marcas de celulares",
    "Tipos de sombrero",
    "Cosas de un cumpleaños",
    "Cosas de una boda",
    "Cosas de Navidad",
    "Objetos de oficina",
    "Herramientas de jardín",
    "Tipos de baile latino",
    "Nombres de canciones",
    "Cosas que se guardan en una heladera",
    "Objetos de un baño",
    "Cosas que hacen los gatos"
];
const LETRAS_PALABRA_EXPLOSIVA = "ABCDEFGHIJKLMNOPRSTU".split("");
const DURACION_PE = 30;

function refPalabraExplosiva(){ return window.doc(window.db, 'juegos', 'palabraexplosiva'); }

let _palabraExplosivaFaseAnterior = null;
function iniciarPalabraExplosiva(){
    _palabraExplosivaFaseAnterior = null;
    if (window._unsubPalabraExplosiva) window._unsubPalabraExplosiva();
    window._unsubPalabraExplosiva = window.onSnapshot(refPalabraExplosiva(), (snap) => {
        const datos = snap.exists() ? snap.data() : null;
        if (datos && datos.fase === 'revelado' && _palabraExplosivaFaseAnterior === 'jugando' && window.sfx) window.sfx.revelar();
        _palabraExplosivaFaseAnterior = datos ? datos.fase : null;
        renderPalabraExplosiva(datos);
    }, (err) => {
        console.error('Error de Firestore en palabraexplosiva:', err);
        document.getElementById('contenido-palabraexplosiva').innerHTML = `<div class="panel texto-centro texto-tenue">⚠️ No se pudo conectar (${err.code || 'error'}).</div>`;
    });
}

let _palabrasLocalesPE = [];

function renderPalabraExplosiva(estado){
    const cont = document.getElementById('contenido-palabraexplosiva');
    if (window._timerPE) { clearInterval(window._timerPE); window._timerPE = null; }

    if (!estado || estado.fase === 'sin_ronda') {
        cont.innerHTML = `<div class="panel texto-centro">
            <p class="texto-tenue">Una letra, una categoría, 30 segundos. Sumás 1 punto por palabra compartida y 2 por exclusiva.</p>
            <button class="btn-principal" onclick="nuevaRondaPalabraExplosiva()">Empezar ronda</button>
        </div>`;
        return;
    }

    const yaEnvie = !!estado[`palabras${miIdentidad === 'nico' ? 'Nico' : 'Carito'}`];

    if (estado.fase === 'revelado') {
        // Set para que repetir la misma palabra varias veces no infle el
        // puntaje (antes cada repetición sumaba de nuevo).
        const pNico = [...new Set((estado.palabrasNico || []).map(p => p.toLowerCase().trim()).filter(Boolean))];
        const pCarito = [...new Set((estado.palabrasCarito || []).map(p => p.toLowerCase().trim()).filter(Boolean))];
        let puntosNico = 0, puntosCarito = 0;
        const compartidas = pNico.filter(p => pCarito.includes(p));
        pNico.forEach(p => { puntosNico += pCarito.includes(p) ? 1 : 2; });
        pCarito.forEach(p => { puntosCarito += pNico.includes(p) ? 1 : 2; });

        let html = `<div class="panel texto-centro logro-animado">
            <div class="texto-tenue">Categoría: ${estado.categoria} · Letra: ${estado.letra}</div>
            <div style="font-size:1.4rem; margin-top:8px;">Nico ${puntosNico} — Carito ${puntosCarito}</div>
        </div>
        <div class="panel"><span class="texto-tenue" style="font-size:0.75rem;">Palabras de Nico:</span><p style="margin:4px 0 12px;">${pNico.join(', ') || '(ninguna)'}</p>
        <span class="texto-tenue" style="font-size:0.75rem;">Palabras de Carito:</span><p style="margin:4px 0;">${pCarito.join(', ') || '(ninguna)'}</p></div>`;
        if (compartidas.length) html += `<div class="panel texto-tenue">Compartidas: ${compartidas.join(', ')}</div>`;
        html += `<button class="btn-principal" onclick="nuevaRondaPalabraExplosiva()">🔁 Otra ronda</button>`;
        cont.innerHTML = html;
        return;
    }

    if (yaEnvie) {
        cont.innerHTML = `<div class="panel texto-centro texto-tenue destello">Enviaste tus palabras. Esperando a ${nombreJugador(miRival)}…</div>`;
        return;
    }

    const restante = Math.max(0, DURACION_PE - Math.floor((Date.now() - estado.inicioEn) / 1000));
    let html = `<div class="panel texto-centro">
        <div class="texto-tenue">Categoría</div>
        <div style="font-family:var(--fuente-titulo); font-size:1.4rem;">${estado.categoria}</div>
        <div class="texto-tenue" style="margin-top:6px;">Empiezan con la letra</div>
        <div style="font-family:var(--fuente-titulo); font-size:2rem; color:var(--rosa);">${estado.letra}</div>
        <div id="cronometro-pe" style="font-family:monospace; font-size:1.2rem; margin-top:8px;">${restante}s</div>
    </div>
    <div class="panel">
        <div style="display:flex; gap:8px; margin-bottom:10px;">
            <input type="text" id="input-palabra-pe" placeholder="Escribí una palabra..." autocomplete="off"
                style="flex:1; padding:10px; border-radius:10px; border:1px solid var(--borde); background:rgba(255,255,255,0.06); color:var(--texto);"
                onkeydown="if(event.key==='Enter') agregarPalabraPE()">
            <button class="btn-secundario" style="width:auto;" onclick="agregarPalabraPE()">+</button>
        </div>
        <div style="display:flex; flex-wrap:wrap; gap:6px; margin-bottom:12px;">
            ${_palabrasLocalesPE.map((p, i) => `<span class="badge-estado badge-activa" style="cursor:pointer;" onclick="quitarPalabraPE(${i})">${p} ✕</span>`).join('')}
        </div>
        <button class="btn-principal" onclick="enviarPalabraExplosiva()">Enviar mis palabras</button>
    </div>`;
    cont.innerHTML = html;

    let _ultimoSegPE = null;
    window._timerPE = setInterval(() => {
        const r = Math.max(0, DURACION_PE - Math.floor((Date.now() - estado.inicioEn) / 1000));
        const el = document.getElementById('cronometro-pe');
        if (el) el.innerText = r + 's';
        if (r !== _ultimoSegPE) {
            _ultimoSegPE = r;
            if (window.sfx && r > 0 && r <= 5) window.sfx.tick();
        }
        if (r <= 0) {
            clearInterval(window._timerPE); window._timerPE = null;
            if (window.sfx) window.sfx.explosion();
            enviarPalabraExplosiva();
        }
    }, 500);
}

function agregarPalabraPE(){
    const input = document.getElementById('input-palabra-pe');
    const val = input.value.trim();
    if (!val) return;
    _palabrasLocalesPE.push(val);
    input.value = '';
    vibrarJ(8);
    if (window.sfx) window.sfx.pop();
    refrescarVistaPE();
}
function quitarPalabraPE(i){ _palabrasLocalesPE.splice(i, 1); refrescarVistaPE(); }
async function refrescarVistaPE(){
    const snap = await new Promise(res => { const u = window.onSnapshot(refPalabraExplosiva(), s => { u(); res(s); }); });
    if (snap.exists()) renderPalabraExplosiva(snap.data());
}

async function nuevaRondaPalabraExplosiva(){
    vibrarJ(12);
    _palabrasLocalesPE = [];
    const categoria = CATEGORIAS_PALABRA_EXPLOSIVA[Math.floor(Math.random() * CATEGORIAS_PALABRA_EXPLOSIVA.length)];
    const letra = LETRAS_PALABRA_EXPLOSIVA[Math.floor(Math.random() * LETRAS_PALABRA_EXPLOSIVA.length)];
    await window.setDoc(refPalabraExplosiva(), {
        fase: 'jugando', categoria, letra, inicioEn: Date.now(),
        palabrasNico: null, palabrasCarito: null
    });
}

async function enviarPalabraExplosiva(){
    if (window._timerPE) { clearInterval(window._timerPE); window._timerPE = null; }
    vibrarJ([15, 30, 15]);
    const campo = miIdentidad === 'nico' ? 'palabrasNico' : 'palabrasCarito';
    const ref = refPalabraExplosiva();
    // Transacción: el auto-envío por el cronómetro compartido hace que
    // los dos disparen esto casi en el mismo instante cuando se acaba
    // el tiempo — con una lectura suelta, ninguno veía todavía las
    // palabras del otro y la ronda quedaba trabada sin revelarse.
    await window.runTransaction(window.db, async (tx) => {
        const snap = await tx.get(ref);
        const data = snap.data();
        if (data[campo]) return; // ya se había enviado (por el timeout, por ejemplo)
        const otro = miIdentidad === 'nico' ? data.palabrasCarito : data.palabrasNico;
        tx.update(ref, { [campo]: [..._palabrasLocalesPE], ...(otro ? { fase: 'revelado' } : {}) });
    });
}
