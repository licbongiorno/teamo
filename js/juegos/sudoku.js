// ==================== SUDOKU DE A DOS ====================
// Cooperativo: los dos completan celdas a la vez, sin esperar
// turnos. La solución se arma en el momento a partir de una grilla
// base válida (fórmula clásica de patrón), revuelta con una mezcla
// de bandas/pilas/dígitos que preserva la validez — así cada partida
// es distinta sin necesitar un generador/solver pesado.
const _BASE_SUDOKU = (() => {
    const base = 3, side = 9;
    const patron = (r, c) => (base * (r % base) + Math.floor(r / base) + c) % side;
    const grid = [];
    for (let r = 0; r < side; r++) { const fila = []; for (let c = 0; c < side; c++) fila.push(patron(r, c)); grid.push(fila); }
    return grid;
})();

function _barajarSudoku(arr){
    arr = [...arr];
    for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; }
    return arr;
}

function generarSolucionSudoku(){
    const bandas = _barajarSudoku([0, 1, 2]);
    let filasOrden = [];
    bandas.forEach(b => { _barajarSudoku([0, 1, 2]).forEach(d => filasOrden.push(b * 3 + d)); });
    let g = filasOrden.map(r => _BASE_SUDOKU[r]);
    const pilas = _barajarSudoku([0, 1, 2]);
    let colsOrden = [];
    pilas.forEach(p => { _barajarSudoku([0, 1, 2]).forEach(d => colsOrden.push(p * 3 + d)); });
    g = g.map(fila => colsOrden.map(c => fila[c]));
    if (Math.random() < 0.5) {
        const t = [];
        for (let c = 0; c < 9; c++) { const fila = []; for (let r = 0; r < 9; r++) fila.push(g[r][c]); t.push(fila); }
        g = t;
    }
    const mapa = _barajarSudoku([0, 1, 2, 3, 4, 5, 6, 7, 8]);
    const plano = [];
    g.forEach(fila => fila.forEach(v => plano.push(mapa[v] + 1)));
    return plano; // array plano de 81, índice = fila*9+col
}

const HUECOS_SUDOKU = 45; // celdas en blanco (de 81) — dificultad media para jugar entre dos

function refSudoku(){ return window.doc(window.db, 'juegos', 'sudoku'); }

let _sudokuFaseAnterior = null;
function iniciarSudoku(){
    _sudokuFaseAnterior = null;
    _seleccionSudoku = null;
    if (window._unsubSudoku) window._unsubSudoku();
    window._unsubSudoku = window.onSnapshot(refSudoku(), (snap) => {
        const datos = snap.exists() ? snap.data() : null;
        if (datos && datos.fase === 'terminado' && _sudokuFaseAnterior === 'jugando' && window.sfx) {
            window.sfx.logro();
            if (window.fx) window.fx.confeti();
        }
        _sudokuFaseAnterior = datos ? datos.fase : null;
        renderSudoku(datos);
    }, (err) => {
        console.error('Error de Firestore en sudoku:', err);
        const cont = document.getElementById('contenido-sudoku');
        if (cont) cont.innerHTML = `<div class="panel texto-centro texto-tenue">⚠️ No se pudo conectar (${err.code || 'error'}).</div>`;
    });
}

async function nuevoSudoku(){
    vibrarJ(12);
    if (window.sfx) window.sfx.swoosh();
    const solucion = generarSolucionSudoku();
    const indices = _barajarSudoku(Array.from({ length: 81 }, (_, i) => i)).slice(0, HUECOS_SUDOKU);
    const huecos = new Set(indices);
    const celdas = solucion.map((v, i) => huecos.has(i) ? 0 : v);
    const dados = solucion.map((_, i) => !huecos.has(i));
    await window.setDoc(refSudoku(), {
        fase: 'jugando', solucion, celdas, dados, autorCelda: new Array(81).fill(null), creadoEn: Date.now()
    });
}

let _seleccionSudoku = null;

function renderSudoku(estado){
    const cont = document.getElementById('contenido-sudoku');
    if (!cont) return;

    if (!estado) {
        cont.innerHTML = `<div class="panel texto-centro">
            <p class="texto-tenue">Completen la grilla entre los dos, al mismo tiempo, sin esperar turnos. Toquen una celda vacía y elijan el número.</p>
            <button class="btn-principal" onclick="nuevoSudoku()">Empezar</button>
        </div>`;
        return;
    }

    if (estado.fase === 'terminado') {
        cont.innerHTML = `<div class="panel texto-centro logro-animado">
            <div style="font-size:2rem;">🎉🧩</div>
            <div style="font-family:var(--fuente-titulo); font-size:1.3rem; margin:6px 0;">¡Completaron el Sudoku juntos!</div>
            <button class="btn-principal" onclick="nuevoSudoku()">🔁 Otra grilla</button>
        </div>`;
        return;
    }

    const completas = estado.celdas.filter(v => v !== 0).length;

    let html = `<div class="panel texto-centro">
        <div class="texto-tenue">${completas} / 81 celdas — entre los dos, cuando quieran</div>
    </div>`;

    html += `<div class="tablero-sudoku">`;
    for (let i = 0; i < 81; i++) {
        const fila = Math.floor(i / 9), col = i % 9;
        const valor = estado.celdas[i];
        const dado = estado.dados[i];
        const clases = ['celda-sudoku'];
        if (dado) clases.push('dada');
        if (!dado && valor) clases.push('llenada');
        if (_seleccionSudoku === i) clases.push('seleccionada');
        if (col % 3 === 0) clases.push('borde-izq');
        if (fila % 3 === 0) clases.push('borde-arr');
        html += `<div class="${clases.join(' ')}" onclick="${dado ? '' : `seleccionarCeldaSudoku(${i})`}">${valor || ''}</div>`;
    }
    html += `</div>`;

    if (_seleccionSudoku != null) {
        html += `<div class="panel texto-centro">
            <div class="texto-tenue" style="margin-bottom:8px;">Número para la celda elegida:</div>
            <div style="display:grid; grid-template-columns:repeat(9,1fr); gap:5px;">
                ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<button class="btn-secundario" style="padding:10px 0;" onclick="elegirNumeroSudoku(${n})">${n}</button>`).join('')}
            </div>
        </div>`;
    }

    cont.innerHTML = html;
}

function seleccionarCeldaSudoku(i){
    _seleccionSudoku = (_seleccionSudoku === i) ? null : i;
    vibrarJ(8);
    if (window.sfx) window.sfx.toque();
    refrescarVistaSudoku();
}
async function refrescarVistaSudoku(){
    const snap = await new Promise(res => { const u = window.onSnapshot(refSudoku(), s => { u(); res(s); }); });
    if (snap.exists()) renderSudoku(snap.data());
}

async function elegirNumeroSudoku(n){
    const i = _seleccionSudoku;
    if (i == null) return;
    const snap = await new Promise(res => { const u = window.onSnapshot(refSudoku(), s => { u(); res(s); }); });
    if (!snap.exists()) return;
    const estado = snap.data();
    if (estado.fase !== 'jugando' || estado.dados[i]) return;
    _seleccionSudoku = null;

    if (estado.solucion[i] !== n) {
        vibrarJ([10, 30, 10]);
        if (window.sfx) window.sfx.error();
        if (window.fx) window.fx.sacudirJuego();
        refrescarVistaSudoku();
        return;
    }
    vibrarJ(10);
    if (window.sfx) window.sfx.pop();
    const celdas = [...estado.celdas];
    const autorCelda = [...(estado.autorCelda || new Array(81).fill(null))];
    celdas[i] = n;
    autorCelda[i] = miIdentidad;
    const completo = celdas.every(v => v !== 0);
    const updates = { celdas, autorCelda };
    if (completo) updates.fase = 'terminado';
    await window.updateDoc(refSudoku(), updates);
    if (completo && typeof registrarEvento === 'function') {
        registrarEvento('cuidado_compartido', `Completaron un Sudoku de a Dos`);
    }
}
