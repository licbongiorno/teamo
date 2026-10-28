// ==================== PALABRA DEL DÍA ====================
// Tipo Wordle: una palabra de 5 letras por día, la misma para los dos
// (sale de la fecha). 6 intentos. Cada letra se pinta 🟩 si está en su
// lugar, 🟨 si está en otro lugar y gris si no está. Cada uno juega
// cuando quiere y después comparan quién la sacó en menos intentos.
// Todo vive en juegos/palabradia → dias[AAAA-MM-DD][nico|carito].
const PALABRAS_DIA = ['abeja', 'abril', 'acero', 'actor', 'aguja', 'amigo', 'apoyo', 'arbol', 'arena', 'arroz', 'avion', 'ayuda', 'bahia', 'baile',
    'balsa', 'banco', 'barco', 'beber', 'besar', 'bicho', 'bolsa', 'brazo', 'broma', 'bruja', 'buceo', 'burro', 'cable', 'cabra', 'cacao', 'calle',
    'calma', 'campo', 'canal', 'canoa', 'canto', 'carne', 'carta', 'casco', 'cazar', 'cebra', 'cerdo', 'cerca', 'chica', 'chico', 'cielo', 'cinco',
    'cisne', 'clima', 'coche', 'color', 'comer', 'copas', 'coral', 'corte', 'crema', 'cuero', 'dados', 'danza', 'dedos', 'deseo', 'disco', 'dulce',
    'enero', 'feliz', 'fideo', 'fiera', 'flaco', 'fresa', 'fruta', 'fuego', 'fuera', 'gafas', 'ganso', 'garra', 'gatos', 'globo', 'gordo', 'gorra',
    'grano', 'gusto', 'hacha', 'hielo', 'hogar', 'hojas', 'horno', 'hotel', 'huevo', 'humor', 'igual', 'jamon', 'jarra', 'joven', 'juego', 'jugar',
    'junio', 'julio', 'labio', 'lapiz', 'largo', 'leche', 'lejos', 'libro', 'lindo', 'lista', 'litro', 'llama', 'llave', 'lleno', 'lobos', 'lugar',
    'luces', 'madre', 'magia', 'mango', 'manos', 'manta', 'marco', 'mareo', 'mayor', 'media', 'mejor', 'melon', 'menta', 'metro', 'miedo', 'mirar',
    'monte', 'moras', 'mosca', 'motor', 'mundo', 'museo', 'nadar', 'naipe', 'negro', 'nieve', 'noche', 'novia', 'novio', 'nubes', 'nuevo', 'oasis',
    'opera', 'orden', 'oreja', 'osito', 'otoño', 'padre', 'pagar', 'palma', 'pasto', 'patio', 'pausa', 'pecas', 'pedal', 'peine', 'perla', 'perro',
    'piano', 'picar', 'pilas', 'pinza', 'pista', 'plato', 'playa', 'plaza', 'pluma', 'pollo', 'poema', 'polvo', 'prado', 'primo', 'pulpo', 'punto',
    'queso', 'radio', 'ramas', 'raton', 'reina', 'reloj', 'remar', 'robot', 'rocas', 'rubio', 'ruido', 'rumbo', 'sabor', 'salsa', 'salto', 'selva',
    'señal', 'siete', 'silla', 'sobre', 'sueño', 'suelo', 'tabla', 'tacos', 'tango', 'tarde', 'tarta', 'techo', 'tejer', 'tenis', 'tigre', 'tinta',
    'tirar', 'tomar', 'torre', 'torta', 'trago', 'trapo', 'tribu', 'trigo', 'trono', 'truco', 'union', 'vacas', 'valle', 'vapor', 'vasos', 'veloz',
    'verde', 'viaje', 'video', 'viejo', 'vivir', 'volar', 'yerba', 'yogur', 'zorro', 'beso', 'abrazo'].filter(p => [...p].length === 5);
const INTENTOS_DIA = 6;
const TECLAS_DIA = ['qwertyuiop', 'asdfghjklñ', '<zxcvbnm>'];

function hoyDia() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
function palabraDelDia(dia) {
    let h = 0;
    for (const ch of 'palabra:' + dia) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    return PALABRAS_DIA[h % PALABRAS_DIA.length];
}
// 'v' verde, 'a' amarillo, '-' gris (con letras repetidas bien contadas).
function pintarDia(intento, sol) {
    const a = [...intento], s = [...sol], res = Array(5).fill('-'), quedan = {};
    a.forEach((ch, i) => { if (ch === s[i]) res[i] = 'v'; else quedan[s[i]] = (quedan[s[i]] || 0) + 1; });
    a.forEach((ch, i) => { if (res[i] !== 'v' && quedan[ch]) { res[i] = 'a'; quedan[ch]--; } });
    return res.join('');
}
const refDia = () => window.doc(window.db, 'juegos', 'palabradia');
let _estadoDia = null, _escribiendoDia = '';

function datosDiaDe(e, q, dia) { return ((e && e.dias && e.dias[dia]) || {})[q] || { intentos: [], fin: false, gano: false }; }
function rachaDia(e, q) {
    let n = 0;
    const d = new Date();
    for (let k = 0; k < 60; k++) {
        const dia = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const x = datosDiaDe(e, q, dia);
        if (x.gano) n++; else if (k > 0 || x.fin) break;
        d.setDate(d.getDate() - 1);
    }
    return n;
}

function renderDia() {
    const cont = document.getElementById('contenido-palabradia');
    if (!cont) return;
    const dia = hoyDia(), sol = palabraDelDia(dia);
    const yo = miIdentidad, el = miRival;
    const mio = datosDiaDe(_estadoDia, yo, dia), suyo = datosDiaDe(_estadoDia, el, dia);
    let h = `<div class="texto-centro texto-tenue" style="font-size:0.8rem;">📅 ${dia.split('-').reverse().join('/')} · Racha: vos ${rachaDia(_estadoDia, yo)} 🔥 · ${nombreJugador(el)} ${rachaDia(_estadoDia, el)} 🔥</div>`;
    h += '<div class="grilla-dia">';
    for (let f = 0; f < INTENTOS_DIA; f++) {
        const palabra = mio.intentos[f] || (f === mio.intentos.length && !mio.fin ? _escribiendoDia : '');
        const colores = mio.intentos[f] ? pintarDia(mio.intentos[f], sol) : '';
        h += `<div class="fila-dia${f === mio.intentos.length - 1 ? ' recien' : ''}">${[...Array(5)].map((_, i) => `<span class="letra-dia ${colores ? 'c-' + colores[i] : ''}${palabra[i] && !colores ? ' llena' : ''}" style="--i:${i}">${(palabra[i] || '').toUpperCase()}</span>`).join('')}</div>`;
    }
    h += '</div>';
    if (mio.fin) {
        h += `<div class="panel texto-centro"><div style="font-size:1.05rem;">${mio.gano ? `🎉 ¡La sacaste en ${mio.intentos.length}!` : `😅 Era <b>${sol.toUpperCase()}</b>`}</div><div class="texto-tenue" style="font-size:0.8rem; margin-top:4px;">Mañana hay otra.</div></div>`;
    } else {
        const usadas = {};
        mio.intentos.forEach(p => { const c = pintarDia(p, sol); [...p].forEach((ch, i) => { const v = c[i]; if (v === 'v' || (v === 'a' && usadas[ch] !== 'v') || !usadas[ch]) usadas[ch] = v; }); });
        h += '<div class="teclado-dia">' + TECLAS_DIA.map(fila => `<div>${[...fila].map(t => t === '<' ? `<button class="tecla-dia ancha" onclick="teclaDia('borrar')">⌫</button>` : t === '>' ? `<button class="tecla-dia ancha" onclick="teclaDia('enter')">OK</button>` : `<button class="tecla-dia ${usadas[t] ? 'c-' + usadas[t] : ''}" onclick="teclaDia('${t}')">${t.toUpperCase()}</button>`).join('')}</div>`).join('') + '</div>';
    }
    // Lo del otro: los colores siempre; las palabras recién cuando terminaste.
    h += `<div class="panel"><div class="texto-tenue" style="margin-bottom:6px;">${nombreJugador(el)} ${suyo.fin ? (suyo.gano ? `la sacó en ${suyo.intentos.length} 🎉` : 'no la sacó 😅') : suyo.intentos.length ? `va por el intento ${suyo.intentos.length}…` : 'todavía no jugó'}</div>
        <div class="mini-dia">${suyo.intentos.map(p => `<div>${[...pintarDia(p, sol)].map(c => c === 'v' ? '🟩' : c === 'a' ? '🟨' : '⬜').join('')}${mio.fin ? ` <small>${p.toUpperCase()}</small>` : ''}</div>`).join('')}</div>
        ${!suyo.fin ? `<button class="btn-secundario" style="margin-top:8px;" onclick="invitarAJugar && invitarAJugar('palabradia')">📲 Avisale que juegue</button>` : ''}</div>`;
    cont.innerHTML = h;
    const recien = cont.querySelector('.fila-dia.recien');
    if (recien && cont.dataset.diaVisto !== String(mio.intentos.length)) {
        const primera = cont.dataset.diaVisto === undefined;
        cont.dataset.diaVisto = String(mio.intentos.length);
        if (!primera) recien.querySelectorAll('.letra-dia').forEach((l, i) => l.animate([{ transform: 'rotateX(90deg)' }, { transform: 'none' }], { duration: 380, delay: i * 160, fill: 'backwards' }));
    }
}

function teclaDia(t) {
    const dia = hoyDia(), mio = datosDiaDe(_estadoDia, miIdentidad, dia);
    if (mio.fin) return;
    if (t === 'borrar') _escribiendoDia = _escribiendoDia.slice(0, -1);
    else if (t === 'enter') { if ([..._escribiendoDia].length === 5) mandarIntentoDia(_escribiendoDia); else if (window.fx) window.fx.sacudirJuego(); return; }
    else if ([..._escribiendoDia].length < 5) _escribiendoDia += t;
    if (window.sfx) window.sfx.toque();
    renderDia();
}
async function mandarIntentoDia(palabra) {
    const dia = hoyDia(), sol = palabraDelDia(dia), yo = miIdentidad;
    let gano = false, fin = false;
    await window.runTransaction(window.db, async (tx) => {
        const snap = await tx.get(refDia());
        const d = snap.exists() ? snap.data() : {};
        const dias = { ...(d.dias || {}) };
        const hoy = { ...(dias[dia] || {}) };
        const mio = { ...(hoy[yo] || { intentos: [], fin: false, gano: false }) };
        if (mio.fin) return;
        mio.intentos = [...mio.intentos, palabra];
        gano = palabra === sol; fin = gano || mio.intentos.length >= INTENTOS_DIA;
        mio.gano = gano; mio.fin = fin;
        hoy[yo] = mio; dias[dia] = hoy;
        // Se guardan sólo los últimos 45 días.
        Object.keys(dias).sort().slice(0, -45).forEach(k => delete dias[k]);
        tx.set(refDia(), { dias });
    });
    _escribiendoDia = '';
    if (window.sfx) setTimeout(() => window.sfx[gano ? 'victoria' : fin ? 'derrota' : 'cartaFlip'](), 900);
    if (gano && window.fx) setTimeout(() => window.fx.confeti(), 1000);
    if (fin && typeof registrarEvento === 'function') registrarEvento('gano_partida', `${nombreJugador(yo)} ${gano ? 'sacó' : 'jugó'} la Palabra del Día`);
}
function iniciarPalabraDia() {
    _escribiendoDia = '';
    if (window._unsubPalabradia) window._unsubPalabradia();
    window._unsubPalabradia = window.onSnapshot(refDia(), (snap) => { _estadoDia = snap.exists() ? snap.data() : {}; renderDia(); });
    // Teclado físico (compu).
    if (!window._teclaDiaFisica) {
        window._teclaDiaFisica = (ev) => {
            if (!document.getElementById('pantalla-palabradia')?.classList.contains('activa')) return;
            if (ev.target && ev.target.tagName === 'INPUT') return;
            const k = ev.key.toLowerCase();
            if (k === 'enter') teclaDia('enter'); else if (k === 'backspace') teclaDia('borrar'); else if (/^[a-zñ]$/.test(k)) teclaDia(k);
        };
        document.addEventListener('keydown', window._teclaDiaFisica);
    }
}
window.INICIAR_JUEGO = window.INICIAR_JUEGO || {};
window.INICIAR_JUEGO.palabradia = iniciarPalabraDia;
