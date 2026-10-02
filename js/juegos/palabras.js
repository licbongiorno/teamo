// ==================== BATALLA DE PALABRAS ====================
// Estilo Boggle: misma grilla de 4x4 letras para los dos, 90 segundos
// para encontrar palabras uniendo letras vecinas (también en diagonal,
// sin repetir casilla). La app verifica sola que cada palabra se pueda
// armar en la grilla; si la palabra EXISTE lo deciden ustedes en la
// revisión cruzada (no hay diccionario), igual que en Tutti Frutti.
// Puntaje (como el Boggle): las palabras que encontraron los dos no
// suman; el resto según el largo: 3-4 letras 1, 5 → 2, 6 → 3, 7 → 5,
// 8 o más → 11.
// Todas las transiciones van en transacciones; cada palabra se agrega
// con arrayUnion a la lista propia (no se pisan entre los dos).
const DURACION_PALABRAS = 90000;
const ESPERA_REVISION_PALABRAS_MS = 2500;
// Letras con peso según su frecuencia en castellano ('Qu' va junta).
const BOLSA_PALABRAS = ('AAAAAAAAAAAA' + 'EEEEEEEEEEEE' + 'OOOOOOOOO' + 'IIIIII' + 'SSSSSSS' + 'RRRRRR' + 'NNNNNN' +
    'LLLLL' + 'DDDDD' + 'TTTT' + 'CCCC' + 'UUUU' + 'MMM' + 'PPP' + 'BB' + 'GG' + 'VV' + 'YY' + 'FF' + 'HH' + 'JZÑX').split('').concat(['Qu']);

function refPalabras(){ return window.doc(window.db, 'juegos', 'palabras'); }
function _campoPal(base, j){ return base + (j === 'nico' ? 'Nico' : 'Carito'); }

function normalizarPalabra(t){
    // Saca tildes pero respeta la Ñ.
    return String(t || '').toUpperCase().replace(/Ñ/g, '\u0001').normalize('NFD')
        .replace(/[̀-ͯ]/g, '').replace(/\u0001/g, 'Ñ').replace(/[^A-ZÑ]/g, '');
}

function generarGrillaPalabras(){
    let grilla;
    do {
        grilla = Array.from({ length: 16 }, () => BOLSA_PALABRAS[Math.floor(Math.random() * BOLSA_PALABRAS.length)]);
    } while (grilla.filter(l => 'AEIOU'.includes(l[0])).length < 5); // que haya vocales suficientes
    return grilla;
}

// ¿Se puede armar la palabra uniendo casillas vecinas sin repetir?
function palabraEnGrilla(grilla, palabra){
    const p = normalizarPalabra(palabra);
    const fichas = grilla.map(l => normalizarPalabra(l));
    const usadas = new Array(16).fill(false);
    const buscar = (idx, pos) => {
        const f = fichas[idx];
        if (!p.startsWith(f, pos)) return false;
        const sig = pos + f.length;
        if (sig === p.length) return true;
        usadas[idx] = true;
        const fila = Math.floor(idx / 4), col = idx % 4;
        for (let df = -1; df <= 1; df++) for (let dc = -1; dc <= 1; dc++) {
            const nf = fila + df, nc = col + dc;
            if ((df || dc) && nf >= 0 && nf < 4 && nc >= 0 && nc < 4 && !usadas[nf * 4 + nc] && buscar(nf * 4 + nc, sig)) { usadas[idx] = false; return true; }
        }
        usadas[idx] = false;
        return false;
    };
    return p.length >= 3 && fichas.some((_, i) => buscar(i, 0));
}

function puntosPorLargo(palabra){
    const n = normalizarPalabra(palabra).length;
    if (n <= 4) return 1;
    if (n === 5) return 2;
    if (n === 6) return 3;
    if (n === 7) return 5;
    return 11;
}

// Puntaje de la ronda: { nico: {total, detalle:{palabra:puntos}}, carito: {...} }
function calcularPuntosPalabras(estado){
    const res = {};
    const listas = { nico: estado.palabrasNico || [], carito: estado.palabrasCarito || [] };
    ['nico', 'carito'].forEach(j => {
        const otro = j === 'nico' ? 'carito' : 'nico';
        const rechazadas = estado[_campoPal('rechazos', otro)] || [];
        const detalle = {};
        let total = 0;
        listas[j].forEach(p => {
            let pts = 0;
            if (palabraEnGrilla(estado.grilla, p) && !rechazadas.includes(p) && !listas[otro].includes(p)) pts = puntosPorLargo(p);
            detalle[p] = pts;
            total += pts;
        });
        res[j] = { total, detalle };
    });
    return res;
}

let _palabrasRondaDibujada = null;
let _palabrasMias = [];
let _palabrasTimer = null;
let _palabrasRevisionDesde = {};
let _palabrasFaseAnterior = null;

function iniciarPalabras(){
    if (window._unsubPalabras) window._unsubPalabras();
    _palabrasRondaDibujada = null;
    _palabrasFaseAnterior = null;
    window._unsubPalabras = window.onSnapshot(refPalabras(), (snap) => {
        const datos = snap.exists() ? snap.data() : null;
        if (datos && datos.fase === 'revisando' && _palabrasFaseAnterior === 'jugando') {
            vibrarJ([20, 40, 20]);
            if (window.sfx) window.sfx.explosion();
        }
        _palabrasFaseAnterior = datos ? datos.fase : null;
        renderPalabras(datos);
    }, (err) => {
        console.error('Error de Firestore en batalla de palabras:', err);
        document.getElementById('contenido-palabras').innerHTML = `<div class="panel texto-centro texto-tenue">⚠️ No se pudo conectar (${err.code || 'error'}).</div>`;
    });
}

function _escPal(t){ return String(t || '').replace(/[<>&"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c])); }

function htmlGrillaPalabras(grilla, clickeable){
    return `<div class="grilla-palabras">${grilla.map((l, i) =>
        `<button class="ficha-palabras" ${clickeable ? `onclick="tocarFichaPalabras(${i})"` : 'disabled'}>${l}</button>`).join('')}</div>`;
}

function renderPalabras(estado){
    const cont = document.getElementById('contenido-palabras');
    if (!cont) return;
    if (_palabrasTimer && (!estado || estado.fase !== 'jugando')) { clearTimeout(_palabrasTimer); _palabrasTimer = null; }
    const puntajes = estado?.puntajes || { nico: 0, carito: 0 };
    const marcador = `<div class="texto-tenue texto-centro" style="margin-bottom:8px;">Nico ${puntajes.nico || 0} — Carito ${puntajes.carito || 0}</div>`;

    if (!estado || estado.fase === 'esperando' || estado.fase === 'resultado') {
        _palabrasRondaDibujada = null;
        const listoYo = estado?.listos?.[miIdentidad];
        const listoRival = estado?.listos?.[miRival];
        let html = marcador;
        if (estado?.fase === 'resultado') html += htmlResultadoPalabras(estado);
        else html += `<div class="panel texto-centro"><p class="texto-tenue">Misma grilla para los dos y 90 segundos: armá palabras de 3 letras o más uniendo letras vecinas (también en diagonal), sin repetir casilla. Las que encuentran los dos no suman. Al final se revisan entre ustedes.</p></div>`;
        html += `<div class="panel texto-centro">
            <div class="texto-tenue" style="margin-bottom:10px;">
                ${nombreJugador(miIdentidad)}: ${listoYo ? '✅ listo/a' : '⏳ esperando'}<br>
                ${nombreJugador(miRival)}: ${listoRival ? '✅ listo/a' : '⏳ esperando'}
            </div>
            <button class="btn-principal" ${listoYo ? 'disabled style="opacity:0.5;"' : ''} onclick="marcarListoPalabras()">${listoYo ? 'Esperando al otro…' : (estado?.fase === 'resultado' ? 'Otra ronda 🔠' : '¡Estoy listo/a! 🔠')}</button>
        </div>`;
        cont.innerHTML = html;
        return;
    }

    if (estado.fase === 'jugando') {
        const restanteInicio = estado.horaInicio - Date.now();
        if (restanteInicio > -300) {
            cont.innerHTML = marcador + htmlCuentaRegresivaArcade(restanteInicio);
            if (_palabrasTimer) clearTimeout(_palabrasTimer);
            _palabrasTimer = setTimeout(() => renderPalabras(estado), msHastaProximoTickArcade(restanteInicio));
            return;
        }
        if (_palabrasRondaDibujada !== estado.horaInicio) {
            // Se arma una sola vez por ronda (si no, se borraría lo que
            // estás escribiendo con cada actualización).
            _palabrasRondaDibujada = estado.horaInicio;
            _palabrasMias = [...(estado[_campoPal('palabras', miIdentidad)] || [])];
            cont.innerHTML = marcador + `<div class="panel texto-centro">
                <div id="tiempo-palabras" class="texto-tenue"></div>
                ${htmlGrillaPalabras(estado.grilla, true)}
                <div class="fila-input-palabras">
                    <input type="text" id="input-palabras" maxlength="16" autocomplete="off" autocapitalize="characters" placeholder="Escribí o tocá letras" onkeydown="if(event.key==='Enter') enviarPalabra()">
                    <button class="btn-secundario" style="width:auto;" onclick="document.getElementById('input-palabras').value=''">⌫</button>
                    <button class="btn-principal" style="width:auto;" onclick="enviarPalabra()">✓</button>
                </div>
                <div id="aviso-palabras" class="texto-tenue" style="font-size:0.8rem; min-height:1.2em;"></div>
                <div id="lista-mis-palabras" class="lista-palabras"></div>
                <div id="progreso-rival-palabras" class="texto-tenue" style="font-size:0.8rem; margin-top:6px;"></div>
            </div>`;
            dibujarMisPalabras();
        }
        const rival = (estado[_campoPal('palabras', miRival)] || []).length;
        const prog = document.getElementById('progreso-rival-palabras');
        if (prog) prog.innerText = `${nombreJugador(miRival)} lleva ${rival} palabra${rival === 1 ? '' : 's'}`;
        tickTiempoPalabras(estado);
        return;
    }

    if (estado.fase === 'revisando') {
        _palabrasRondaDibujada = null;
        const ronda = estado.horaInicio;
        if (!_palabrasRevisionDesde[ronda]) _palabrasRevisionDesde[ronda] = Date.now();
        cont.innerHTML = marcador + htmlRevisionPalabras(estado);
        const falta = ESPERA_REVISION_PALABRAS_MS - (Date.now() - _palabrasRevisionDesde[ronda]);
        if (falta > 0) setTimeout(() => {
            const b = document.getElementById('btn-confirmar-palabras');
            if (b && !estado[_campoPal('confirmado', miIdentidad)]) { b.disabled = false; b.style.opacity = ''; b.innerText = '✅ Listo, revisé'; }
        }, falta);
    }
}

function tickTiempoPalabras(estado){
    if (_palabrasTimer) clearTimeout(_palabrasTimer);
    const restante = estado.horaFin - Date.now();
    const el = document.getElementById('tiempo-palabras');
    if (el) el.innerText = restante > 0 ? `⏱️ ${Math.ceil(restante / 1000)} s` : '⏱️ ¡Tiempo!';
    if (restante <= 0) { terminarTiempoPalabras(); return; }
    _palabrasTimer = setTimeout(() => tickTiempoPalabras(estado), Math.min(1000, restante));
}

function dibujarMisPalabras(){
    const el = document.getElementById('lista-mis-palabras');
    if (!el) return;
    el.innerHTML = _palabrasMias.length
        ? _palabrasMias.map(p => `<span class="chip-palabra">${_escPal(p)} <small>+${puntosPorLargo(p)}</small></span>`).join('')
        : '<span class="texto-tenue" style="font-size:0.8rem;">Todavía no encontraste ninguna.</span>';
}

function tocarFichaPalabras(i){
    const input = document.getElementById('input-palabras');
    const fichas = document.querySelectorAll('.ficha-palabras');
    if (!input || !fichas[i]) return;
    input.value += fichas[i].innerText.toUpperCase();
    vibrarJ(5);
}

async function enviarPalabra(){
    const input = document.getElementById('input-palabras');
    const aviso = document.getElementById('aviso-palabras');
    if (!input) return;
    const palabra = normalizarPalabra(input.value);
    input.value = '';
    input.focus();
    const avisar = (t) => { if (aviso) aviso.innerText = t; };
    const ronda = _palabrasRondaDibujada;
    if (palabra.length < 3) { avisar('Tiene que tener 3 letras o más.'); return; }
    if (_palabrasMias.includes(palabra)) { avisar(`Ya tenés "${palabra}".`); return; }
    const estado = await new Promise(res => { const u = window.onSnapshot(refPalabras(), s => { u(); res(s.exists() ? s.data() : null); }); });
    if (!estado || estado.fase !== 'jugando' || estado.horaInicio !== ronda || Date.now() > estado.horaFin) { avisar('Se terminó el tiempo.'); return; }
    if (!palabraEnGrilla(estado.grilla, palabra)) {
        avisar(`"${palabra}" no se puede armar con letras vecinas.`);
        vibrarJ([10, 30, 10]);
        if (window.sfx) window.sfx.error();
        return;
    }
    _palabrasMias.push(palabra);
    dibujarMisPalabras();
    avisar(`✓ ${palabra} (+${puntosPorLargo(palabra)})`);
    vibrarJ(10);
    if (window.sfx) window.sfx.acierto();
    window.updateDoc(refPalabras(), { [_campoPal('palabras', miIdentidad)]: window.arrayUnion(palabra) })
        .catch(e => console.warn('No se pudo guardar la palabra:', e));
}

async function terminarTiempoPalabras(){
    const ref = refPalabras();
    await window.runTransaction(window.db, async (tx) => {
        const snap = await tx.get(ref);
        const e = snap.exists() ? snap.data() : null;
        if (!e || e.fase !== 'jugando' || Date.now() < e.horaFin) return;
        tx.update(ref, { fase: 'revisando' });
    }).catch(() => {});
}

function htmlRevisionPalabras(estado){
    const mias = estado[_campoPal('palabras', miIdentidad)] || [];
    const suyas = estado[_campoPal('palabras', miRival)] || [];
    const misRechazos = estado[_campoPal('rechazos', miIdentidad)] || [];
    const meRechazo = estado[_campoPal('rechazos', miRival)] || [];
    const confirmeYo = !!estado[_campoPal('confirmado', miIdentidad)];
    const confirmoRival = !!estado[_campoPal('confirmado', miRival)];
    const esperando = (Date.now() - (_palabrasRevisionDesde[estado.horaInicio] || Date.now())) < ESPERA_REVISION_PALABRAS_MS;
    const chip = (p, rechazada, repetida, boton) =>
        `<span class="chip-palabra${rechazada ? ' chip-rechazada' : ''}${repetida ? ' chip-repetida' : ''}">${_escPal(p)}${repetida ? ' <small>(los dos)</small>' : ''}${boton || ''}</span>`;
    let html = `<div class="panel texto-centro">
        <div style="font-size:1.1rem;">⏱️ ¡Tiempo!</div>
        <div class="texto-tenue" style="font-size:0.8rem;">Tocá ✓/✗ en las palabras de ${nombreJugador(miRival)} que no existan. Las que encontraron los dos no suman.</div>
        ${htmlGrillaPalabras(estado.grilla, false)}
    </div>
    <div class="panel"><div class="texto-tenue" style="margin-bottom:6px;">Las de ${nombreJugador(miRival)} (${suyas.length})</div><div class="lista-palabras">`;
    html += suyas.length ? suyas.map(p => {
        const repetida = mias.includes(p);
        const rechazada = misRechazos.includes(p);
        const boton = (!repetida && !confirmeYo) ? ` <button class="btn-rechazo-tutti" onclick="rechazarPalabra('${p}')">${rechazada ? '✗' : '✓'}</button>` : '';
        return chip(p, rechazada, repetida, boton);
    }).join('') : '<span class="texto-tenue">No encontró ninguna.</span>';
    html += `</div></div><div class="panel"><div class="texto-tenue" style="margin-bottom:6px;">Las tuyas (${mias.length})</div><div class="lista-palabras">`;
    html += mias.length ? mias.map(p => chip(p, meRechazo.includes(p), suyas.includes(p), '')).join('') : '<span class="texto-tenue">No encontraste ninguna.</span>';
    html += `</div></div><div class="panel texto-centro">`;
    if (confirmeYo) html += `<div class="texto-tenue destello">${confirmoRival ? 'Calculando…' : `Esperando que ${nombreJugador(miRival)} termine de revisar…`}</div>`;
    else html += `<button class="btn-principal" id="btn-confirmar-palabras" ${esperando ? 'disabled style="opacity:0.5;"' : ''} onclick="confirmarRevisionPalabras()">${esperando ? 'Juntando palabras…' : '✅ Listo, revisé'}</button>`;
    html += `</div>`;
    return html;
}

function htmlResultadoPalabras(estado){
    const r = estado.puntosRonda || { nico: { total: 0, detalle: {} }, carito: { total: 0, detalle: {} } };
    const lista = (j) => {
        const d = r[j]?.detalle || {};
        const ps = Object.keys(d).sort((a, b) => d[b] - d[a] || b.length - a.length);
        return ps.length ? ps.map(p => `<span class="chip-palabra${d[p] ? '' : ' chip-rechazada'}">${_escPal(p)} <small>+${d[p]}</small></span>`).join('') : '<span class="texto-tenue">—</span>';
    };
    const ganador = ganadorPorPuntos({ nico: r.nico?.total || 0, carito: r.carito?.total || 0 });
    return `<div class="panel texto-centro">
        <div style="font-size:1.15rem; margin-bottom:6px;">${ganador ? `🏆 Ronda para ${nombreJugador(ganador)}` : '🤝 Ronda empatada'}</div>
        <div>Nico +${r.nico?.total || 0} — Carito +${r.carito?.total || 0}</div>
    </div>
    <div class="panel"><div class="texto-tenue" style="margin-bottom:6px;">💙 Nico</div><div class="lista-palabras">${lista('nico')}</div></div>
    <div class="panel"><div class="texto-tenue" style="margin-bottom:6px;">💖 Carito</div><div class="lista-palabras">${lista('carito')}</div></div>`;
}

async function marcarListoPalabras(){
    vibrarJ(12);
    const ref = refPalabras();
    await window.runTransaction(window.db, async (tx) => {
        const snap = await tx.get(ref);
        const estado = snap.exists() ? snap.data() : null;
        if (estado && (estado.fase === 'jugando' || estado.fase === 'revisando')) return;
        if (estado?.listos?.[miIdentidad]) return;
        const listos = { ...(estado?.listos || {}), [miIdentidad]: true };
        const puntajes = estado?.puntajes || { nico: 0, carito: 0 };
        if (listos.nico && listos.carito) {
            const horaInicio = Date.now() + 3000;
            tx.set(ref, {
                fase: 'jugando', listos: {}, puntajes, horaInicio, horaFin: horaInicio + DURACION_PALABRAS,
                grilla: generarGrillaPalabras(),
                palabrasNico: [], palabrasCarito: [], rechazosNico: [], rechazosCarito: [],
                confirmadoNico: false, confirmadoCarito: false, puntosRonda: null
            });
        } else if (estado?.fase === 'resultado') {
            tx.update(ref, { listos });
        } else {
            tx.set(ref, { fase: 'esperando', listos, puntajes }, { merge: true });
        }
    });
}

async function rechazarPalabra(palabra){
    vibrarJ(8);
    const campo = _campoPal('rechazos', miIdentidad);
    const ref = refPalabras();
    await window.runTransaction(window.db, async (tx) => {
        const snap = await tx.get(ref);
        const e = snap.exists() ? snap.data() : null;
        if (!e || e.fase !== 'revisando' || e[_campoPal('confirmado', miIdentidad)]) return;
        const lista = [...(e[campo] || [])];
        const pos = lista.indexOf(palabra);
        if (pos >= 0) lista.splice(pos, 1); else lista.push(palabra);
        tx.update(ref, { [campo]: lista });
    }).catch(e => console.warn('No se pudo marcar la palabra:', e));
}

async function confirmarRevisionPalabras(){
    vibrarJ(12);
    const ref = refPalabras();
    let cerro = null;
    await window.runTransaction(window.db, async (tx) => {
        cerro = null;
        const snap = await tx.get(ref);
        const e = snap.exists() ? snap.data() : null;
        if (!e || e.fase !== 'revisando') return;
        const cambios = { [_campoPal('confirmado', miIdentidad)]: true };
        if (e[_campoPal('confirmado', miRival)]) {
            const puntosRonda = calcularPuntosPalabras(e);
            const puntajes = { ...(e.puntajes || { nico: 0, carito: 0 }) };
            puntajes.nico = (puntajes.nico || 0) + puntosRonda.nico.total;
            puntajes.carito = (puntajes.carito || 0) + puntosRonda.carito.total;
            Object.assign(cambios, { fase: 'resultado', puntosRonda, puntajes, listos: {} });
            cerro = puntosRonda;
        }
        tx.update(ref, cambios);
    }).catch(e => console.warn('No se pudo confirmar la revisión:', e));
    if (cerro) {
        const ganador = ganadorPorPuntos({ nico: cerro.nico.total, carito: cerro.carito.total });
        if (typeof registrarEvento === 'function') registrarEvento('gano_partida', ganador ? `${nombreJugador(ganador)} ganó una ronda de Batalla de Palabras` : 'Empataron una ronda de Batalla de Palabras');
        if (typeof registrarVictoria === 'function') registrarVictoria('palabras', ganador);
    }
}
