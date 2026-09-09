// ==================== ESCOBA DE 15 ====================
function crearMazoEscoba(){
    const palos = ['espada','basto','oro','copa'];
    const numeros = [1,2,3,4,5,6,7,10,11,12];
    let mazo = [];
    palos.forEach(p => numeros.forEach(n => mazo.push(p + '_' + n)));
    for (let i = mazo.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [mazo[i], mazo[j]] = [mazo[j], mazo[i]];
    }
    return mazo;
}
function numEscoba(c){ return parseInt(c.split('_')[1]); }
function paloEscoba(c){ return c.split('_')[0]; }
function valorEscoba(c){
    const n = numEscoba(c);
    if (n <= 7) return n;
    if (n === 10) return 8;
    if (n === 11) return 9;
    return 10; // Rey (12)
}
function nombreCartaEscoba(c){
    const n = numEscoba(c), p = paloEscoba(c);
    const nombresNum = {1:'As', 10:'Sota', 11:'Caballo', 12:'Rey'};
    const nombresPalo = {espada:'🗡️', basto:'🌳', oro:'🪙', copa:'🏆'};
    return `${nombresNum[n] || n}${nombresPalo[p]}`;
}

function refEscoba(){ return window.doc(window.db, 'juegos', 'escoba'); }

function iniciarEscoba(){
    if (window._unsubEscoba) window._unsubEscoba();
    window._unsubEscoba = window.onSnapshot(refEscoba(), (snap) => {
        renderEscoba(snap.exists() ? snap.data() : null);
    }, (err) => {
        console.error('Error de Firestore en escoba:', err);
        document.getElementById('contenido-escoba').innerHTML = `<div class="panel texto-centro texto-tenue">⚠️ No se pudo conectar (${err.code || 'error'}).</div>`;
    });
}

let _seleccionMesaEscoba = [];
let _cartaManoEscoba = null;

async function nuevaPartidaEscoba(){
    vibrarJ(12);
    const mazo = crearMazoEscoba();
    const mesa = mazo.splice(0, 4);
    const manoNico = mazo.splice(0, 3);
    const manoCarito = mazo.splice(0, 3);
    await window.setDoc(refEscoba(), {
        fase: 'jugando', mazo, mesa, manoNico, manoCarito,
        bazasNico: [], bazasCarito: [], escobasNico: 0, escobasCarito: 0,
        turno: 'nico', ultimoQueLevanto: null, puntajes: null, historial: []
    });
}

function renderEscoba(estado){
    const cont = document.getElementById('contenido-escoba');
    if (!estado || estado.fase === 'sin_partida') {
        cont.innerHTML = `<div class="panel texto-centro">
            <p class="texto-tenue">Mazo español. Sumá 15 combinando una carta de tu mano con las de la mesa.</p>
            <button class="btn-principal" onclick="nuevaPartidaEscoba()">Empezar partida</button>
        </div>`;
        return;
    }

    if (estado.fase === 'terminado') {
        const p = estado.puntajes || { nico: 0, carito: 0 };
        cont.innerHTML = `<div class="panel texto-centro">
            <div style="font-size:1.2rem; margin-bottom:8px;">${p.nico === p.carito ? '🤝 ¡Empate!' : `🏆 ¡Ganó ${nombreJugador(p.nico > p.carito ? 'nico' : 'carito')}!`}</div>
            <div class="texto-tenue">Nico ${p.nico} — Carito ${p.carito}</div>
            <div class="texto-tenue" style="margin:8px 0 14px;">Escobas: Nico ${estado.escobasNico || 0} · Carito ${estado.escobasCarito || 0}</div>
            <button class="btn-principal" onclick="nuevaPartidaEscoba()">🔁 Jugar de nuevo</button>
        </div>`;
        return;
    }

    _seleccionMesaEscoba = _seleccionMesaEscoba.filter(c => (estado.mesa || []).includes(c));
    if (_cartaManoEscoba && !(estado[`mano${miIdentidad === 'nico' ? 'Nico' : 'Carito'}`] || []).includes(_cartaManoEscoba)) _cartaManoEscoba = null;

    const miMano = estado[`mano${miIdentidad === 'nico' ? 'Nico' : 'Carito'}`] || [];
    const esMiTurno = estado.turno === miIdentidad;
    const sumaSeleccion = (_cartaManoEscoba ? valorEscoba(_cartaManoEscoba) : 0) + _seleccionMesaEscoba.reduce((t, c) => t + valorEscoba(c), 0);
    const puedeLevantar = esMiTurno && _cartaManoEscoba && _seleccionMesaEscoba.length > 0 && sumaSeleccion === 15;

    let html = `<div class="panel">
        <div style="display:flex; justify-content:space-between; font-size:0.85rem; margin-bottom:4px;">
            <span>Nico: ${(estado.bazasNico || []).length} cartas</span>
            <span>Mazo: ${(estado.mazo || []).length}</span>
            <span>Carito: ${(estado.bazasCarito || []).length} cartas</span>
        </div>
        <div class="info-turno-tablero">${esMiTurno ? '🎯 Tu turno' : `Turno de ${nombreJugador(estado.turno)}…`}</div>
    </div>`;

    html += `<div class="panel"><div class="texto-tenue" style="margin-bottom:8px;">Mesa (tocá para sumar 15):</div>
        <div style="display:flex; flex-wrap:wrap; gap:8px;">
        ${(estado.mesa || []).map(c => `<button class="btn-secundario" style="width:auto; padding:8px 10px; ${_seleccionMesaEscoba.includes(c) ? 'border-color:var(--rosa); background:rgba(255,179,198,0.15);' : ''}" onclick="toggleMesaEscoba('${c}')">${nombreCartaEscoba(c)}</button>`).join('') || '<span class="texto-tenue">vacía</span>'}
        </div></div>`;

    html += `<div class="panel"><div class="texto-tenue" style="margin-bottom:8px;">Tu mano ${sumaSeleccion ? `(suma actual: ${sumaSeleccion})` : ''}:</div>
        <div style="display:flex; gap:8px; flex-wrap:wrap;">
        ${miMano.map(c => `<button class="btn-secundario" style="width:auto; padding:8px 10px; ${_cartaManoEscoba === c ? 'border-color:var(--celeste); background:rgba(168,216,255,0.15);' : ''} ${esMiTurno ? '' : 'opacity:0.5;'}" ${esMiTurno ? '' : 'disabled'} onclick="elegirManoEscoba('${c}')">${nombreCartaEscoba(c)}</button>`).join('')}
        </div>
        <div class="btn-fila" style="margin-top:10px;">
            <button class="btn-principal" ${puedeLevantar ? '' : 'style="opacity:0.4;" disabled'} onclick="levantarEscoba()">Levantar 🧹</button>
            <button class="btn-secundario" ${esMiTurno && _cartaManoEscoba ? '' : 'style="opacity:0.4;" disabled'} onclick="tirarEscoba()">Tirar carta</button>
        </div>
    </div>`;

    if (estado.historial && estado.historial.length) {
        html += `<div class="panel texto-tenue" style="font-size:0.72rem; line-height:1.6;">${estado.historial.slice(-4).map(h => '• ' + h).join('<br>')}</div>`;
    }

    cont.innerHTML = html;
}

function toggleMesaEscoba(c){
    const i = _seleccionMesaEscoba.indexOf(c);
    if (i === -1) _seleccionMesaEscoba.push(c); else _seleccionMesaEscoba.splice(i, 1);
    vibrarJ(8);
    refrescarVistaEscoba();
}
function elegirManoEscoba(c){
    _cartaManoEscoba = (_cartaManoEscoba === c) ? null : c;
    vibrarJ(8);
    refrescarVistaEscoba();
}
async function refrescarVistaEscoba(){
    const snap = await new Promise(res => { const u = window.onSnapshot(refEscoba(), s => { u(); res(s); }); });
    if (snap.exists()) renderEscoba(snap.data());
}

function pushLogEscoba(estado, msg){ return [...(estado?.historial || []), msg].slice(-6); }

async function repartirSiHaceFaltaEscoba(estado){
    const manoNico = [...estado.manoNico], manoCarito = [...estado.manoCarito], mazo = [...estado.mazo];
    if (manoNico.length === 0 && manoCarito.length === 0 && mazo.length > 0) {
        manoNico.push(...mazo.splice(0, 3));
        manoCarito.push(...mazo.splice(0, 3));
    }
    return { manoNico, manoCarito, mazo };
}

async function finalizarSiCorrespondeEscoba(estado, manoNico, manoCarito, mazo, mesa, bazasNico, bazasCarito){
    if (manoNico.length === 0 && manoCarito.length === 0 && mazo.length === 0) {
        // se acabó el mazo: las cartas que queden en la mesa son para quien levantó último
        let mesaFinal = mesa;
        let bNico = bazasNico, bCarito = bazasCarito;
        if (mesaFinal.length && estado.ultimoQueLevanto) {
            if (estado.ultimoQueLevanto === 'nico') bNico = [...bazasNico, ...mesaFinal];
            else bCarito = [...bazasCarito, ...mesaFinal];
            mesaFinal = [];
        }
        const puntos = { nico: 0, carito: 0 };
        if (bNico.length !== bCarito.length) puntos[bNico.length > bCarito.length ? 'nico' : 'carito'] += 1;
        const orosNico = bNico.filter(c => paloEscoba(c) === 'oro').length;
        const orosCarito = bCarito.filter(c => paloEscoba(c) === 'oro').length;
        if (orosNico !== orosCarito) puntos[orosNico > orosCarito ? 'nico' : 'carito'] += 1;
        if (bNico.includes('oro_7')) puntos.nico += 1;
        if (bCarito.includes('oro_7')) puntos.carito += 1;
        puntos.nico += estado.escobasNico || 0;
        puntos.carito += estado.escobasCarito || 0;
        return { terminado: true, mesa: mesaFinal, bazasNico: bNico, bazasCarito: bCarito, puntajes: puntos };
    }
    return { terminado: false, mesa, bazasNico, bazasCarito };
}

async function levantarEscoba(){
    if (!_cartaManoEscoba || !_seleccionMesaEscoba.length) return;
    vibrarJ([15, 30, 15]);
    const snap = await new Promise(res => { const u = window.onSnapshot(refEscoba(), s => { u(); res(s); }); });
    const data = snap.data();
    if (data.fase !== 'jugando' || data.turno !== miIdentidad) return;
    const campoMano = miIdentidad === 'nico' ? 'manoNico' : 'manoCarito';
    const campoBaza = miIdentidad === 'nico' ? 'bazasNico' : 'bazasCarito';
    if (!data[campoMano].includes(_cartaManoEscoba)) return;
    const suma = valorEscoba(_cartaManoEscoba) + _seleccionMesaEscoba.reduce((t, c) => t + valorEscoba(c), 0);
    if (suma !== 15) return;

    const mano = data[campoMano].filter(c => c !== _cartaManoEscoba);
    const mesaRestante = data.mesa.filter(c => !_seleccionMesaEscoba.includes(c));
    const bazas = [...data[campoBaza], _cartaManoEscoba, ..._seleccionMesaEscoba];
    let escobas = { escobasNico: data.escobasNico || 0, escobasCarito: data.escobasCarito || 0 };
    let mensaje = `${nombreJugador(miIdentidad)} levantó ${nombreCartaEscoba(_cartaManoEscoba)} + mesa (=15).`;
    if (mesaRestante.length === 0) {
        escobas[miIdentidad === 'nico' ? 'escobasNico' : 'escobasCarito']++;
        mensaje += ' ¡Escoba! 🧹';
    }

    let manoNico = miIdentidad === 'nico' ? mano : data.manoNico;
    let manoCarito = miIdentidad === 'carito' ? mano : data.manoCarito;
    let bazasNico = miIdentidad === 'nico' ? bazas : data.bazasNico;
    let bazasCarito = miIdentidad === 'carito' ? bazas : data.bazasCarito;
    let mazo = data.mazo;

    const repartido = await repartirSiHaceFaltaEscoba({ manoNico, manoCarito, mazo });
    manoNico = repartido.manoNico; manoCarito = repartido.manoCarito; mazo = repartido.mazo;

    const fin = await finalizarSiCorrespondeEscoba({ ...data, ultimoQueLevanto: miIdentidad, escobasNico: escobas.escobasNico, escobasCarito: escobas.escobasCarito }, manoNico, manoCarito, mazo, mesaRestante, bazasNico, bazasCarito);

    _cartaManoEscoba = null; _seleccionMesaEscoba = [];
    await window.updateDoc(refEscoba(), {
        manoNico, manoCarito, mazo, mesa: fin.mesa, bazasNico: fin.bazasNico, bazasCarito: fin.bazasCarito,
        ...escobas, ultimoQueLevanto: miIdentidad,
        turno: miIdentidad === 'nico' ? 'carito' : 'nico',
        historial: pushLogEscoba(data, mensaje),
        ...(fin.terminado ? { fase: 'terminado', puntajes: fin.puntajes } : {})
    });
    if (fin.terminado && typeof registrarEvento === 'function') {
        registrarEvento('gano_partida', `Terminaron una partida de Escoba de 15`);
    }
}

async function tirarEscoba(){
    if (!_cartaManoEscoba) return;
    vibrarJ(12);
    const snap = await new Promise(res => { const u = window.onSnapshot(refEscoba(), s => { u(); res(s); }); });
    const data = snap.data();
    if (data.fase !== 'jugando' || data.turno !== miIdentidad) return;
    const campoMano = miIdentidad === 'nico' ? 'manoNico' : 'manoCarito';
    if (!data[campoMano].includes(_cartaManoEscoba)) return;
    const cartaTirada = _cartaManoEscoba;

    const mano = data[campoMano].filter(c => c !== cartaTirada);
    const mesa = [...data.mesa, cartaTirada];
    let manoNico = miIdentidad === 'nico' ? mano : data.manoNico;
    let manoCarito = miIdentidad === 'carito' ? mano : data.manoCarito;
    let mazo = data.mazo;

    const repartido = await repartirSiHaceFaltaEscoba({ manoNico, manoCarito, mazo });
    manoNico = repartido.manoNico; manoCarito = repartido.manoCarito; mazo = repartido.mazo;

    const fin = await finalizarSiCorrespondeEscoba(data, manoNico, manoCarito, mazo, mesa, [...data.bazasNico], [...data.bazasCarito]);

    _cartaManoEscoba = null;
    await window.updateDoc(refEscoba(), {
        manoNico, manoCarito, mazo, mesa: fin.mesa, bazasNico: fin.bazasNico, bazasCarito: fin.bazasCarito,
        turno: miIdentidad === 'nico' ? 'carito' : 'nico',
        historial: pushLogEscoba(data, `${nombreJugador(miIdentidad)} tiró ${nombreCartaEscoba(cartaTirada)}.`),
        ...(fin.terminado ? { fase: 'terminado', puntajes: fin.puntajes } : {})
    });
    if (fin.terminado && typeof registrarEvento === 'function') {
        registrarEvento('gano_partida', `Terminaron una partida de Escoba de 15`);
    }
}
