// ==================== CIFRAS (duelo en vivo) ====================
// Los dos tienen los mismos 6 números y una meta. Con sumas, restas,
// multiplicaciones y divisiones exactas (cada número se usa una vez) hay
// que acercarse lo más posible en 60 segundos. Las cuentas se arman en el
// celu de cada uno; al terminar se manda el resultado y el camino.
const SEGUNDOS_CIFRAS = 60;
const OPS_CIFRAS = { '+': (a, b) => a + b, '−': (a, b) => a - b, '×': (a, b) => a * b, '÷': (a, b) => (b && a % b === 0 ? a / b : null) };
let _cifras = null, _timerCifras = null; // estado local: {clave, fichas:[{v,usada}], sel, op, pasos:[]}

function sortearCifras(){
    const grandes = [25, 50, 75, 100].sort(() => Math.random() - 0.5), chicos = [];
    for (let i = 1; i <= 10; i++) chicos.push(i, i);
    chicos.sort(() => Math.random() - 0.5);
    const g = Math.random() < 0.5 ? 1 : 2;
    return { numeros: [...grandes.slice(0, g), ...chicos.slice(0, 6 - g)], objetivo: 101 + Math.floor(Math.random() * 899) };
}
// Lo más cerca que se puede llegar (para la compu y para mostrar al final).
function mejorCifras(numeros, objetivo, limite){
    let mejor = { v: numeros[0], d: Math.abs(numeros[0] - objetivo), pasos: [] }, cuenta = 0;
    numeros.forEach(n => { if (Math.abs(n - objetivo) < mejor.d) mejor = { v: n, d: Math.abs(n - objetivo), pasos: [] }; });
    (function buscar(lista, pasos){
        if (mejor.d === 0 || ++cuenta > (limite || 200000)) return;
        for (let i = 0; i < lista.length; i++) for (let j = 0; j < lista.length; j++) {
            if (i === j) continue;
            for (const [op, f] of Object.entries(OPS_CIFRAS)) {
                const a = lista[i], b = lista[j];
                if ((op === '+' || op === '×') && i > j) continue;
                const r = f(a, b);
                if (r == null || r <= 0 || (op === '×' && (a === 1 || b === 1)) || (op === '÷' && b === 1)) continue;
                const p = [...pasos, `${a} ${op} ${b} = ${r}`];
                if (Math.abs(r - objetivo) < mejor.d) mejor = { v: r, d: Math.abs(r - objetivo), pasos: p };
                buscar([...lista.filter((_, k) => k !== i && k !== j), r], p);
                if (mejor.d === 0) return;
            }
        }
    })(numeros, []);
    return mejor;
}

const Cifras = JuegoTurnos.crear({
    id: 'cifras',
    sinTurno: true,
    emojiListo: '🔢',
    intro: `Los mismos 6 números y una meta para los dos. Combiná los números con + − × ÷ (cada uno una sola vez) para llegar lo más cerca posible en ${SEGUNDOS_CIFRAS} segundos. ¡Gana el más cercano!`,
    inicial: () => ({ ...sortearCifras(), inicio: window.ahoraSync(), entregas: {}, turno: null, clave: Math.random().toString(36).slice(2, 7) }),
    tituloFin: (e) => !e.ganador || e.ganador === 'empate' ? '🤝 ¡Empate!' : `🏆 ¡Ganó ${nombreJugador(e.ganador)}!`,
    render(e, c) {
        if (!_cifras || _cifras.clave !== e.clave) _cifras = { clave: e.clave, fichas: e.numeros.map(v => ({ v, usada: false })), sel: null, op: null, pasos: [] };
        const mia = e.entregas[c.yo], suya = e.entregas[c.rival];
        let h = `<div class="meta-cifras"><span class="texto-tenue">Meta</span><b>${e.objetivo}</b></div>
            <div class="texto-centro" style="font-size:0.85rem;">⏱️ <b id="reloj-cifras">${SEGUNDOS_CIFRAS}</b>s · ${suya ? `✅ ${nombreJugador(c.rival)} ya mandó` : `${nombreJugador(c.rival)} está calculando…`}</div>`;
        if (e.fase === 'terminado') {
            const fila = (q) => { const x = e.entregas[q]; return x ? `<div class="entrega-cifras"><b>${nombreJugador(q)}: ${x.v}</b> <span class="texto-tenue">(a ${Math.abs(x.v - e.objetivo)})</span><small>${(x.pasos || []).map(JuegoTurnos.esc).join(' · ') || 'sin cuentas'}</small></div>` : `<div class="entrega-cifras">${nombreJugador(q)}: no mandó nada</div>`; };
            h += fila('nico') + fila('carito');
            if (e.solucion) h += `<div class="entrega-cifras texto-tenue"><b>💡 Se podía: ${e.solucion.v}</b><small>${e.solucion.pasos.join(' · ')}</small></div>`;
            return h;
        }
        if (mia) return h + `<div class="panel texto-centro">Mandaste <b>${mia.v}</b> (a ${Math.abs(mia.v - e.objetivo)} de la meta). Esperando a ${nombreJugador(c.rival)}…</div>`;
        const visibles = _cifras.fichas.map((f, i) => ({ ...f, i })).filter(f => !f.usada);
        const mejorLocal = visibles.reduce((m, f) => Math.abs(f.v - e.objetivo) < Math.abs(m - e.objetivo) ? f.v : m, visibles[0] ? visibles[0].v : 0);
        h += `<div class="fichas-cifras">${visibles.map(f => `<button class="${_cifras.sel === f.i ? 'elegida' : ''}" onclick="tocarCifra(${f.i})" data-aj-id="cif-${f.i}">${f.v}</button>`).join('')}</div>
            <div class="ops-cifras">${Object.keys(OPS_CIFRAS).map(o => `<button class="${_cifras.op === o ? 'elegida' : ''}" onclick="opCifras('${o}')">${o}</button>`).join('')}</div>
            <div class="pasos-cifras">${_cifras.pasos.map(p => `<span>${p.txt}</span>`).join('') || '<span class="texto-tenue">Elegí un número, una operación y otro número.</span>'}</div>
            <div class="btn-fila"><button class="btn-secundario" ${_cifras.pasos.length ? '' : 'disabled'} onclick="deshacerCifras()">↩️ Deshacer</button>
            <button class="btn-principal" onclick="mandarCifras()">✅ Mandar ${mejorLocal}</button></div>`;
        return h;
    },
    alDibujar(cont, e) {
        clearInterval(_timerCifras);
        if (e.fase !== 'jugando') return;
        const tic = () => {
            const quedan = Math.max(0, Math.ceil(SEGUNDOS_CIFRAS - (window.ahoraSync() - e.inicio) / 1000));
            const r = document.getElementById('reloj-cifras');
            if (r) r.textContent = quedan;
            if (quedan <= 0) { clearInterval(_timerCifras); if (!e.entregas[miIdentidad]) mandarCifras(); else cerrarCifras(); }
        };
        tic();
        _timerCifras = setInterval(tic, 500);
        window._unsubTimerCifras = () => clearInterval(_timerCifras);
    },
    compu: {
        paso(e, bot, yo, nivel) {
            if (e.fase !== 'jugando' || e.entregas[bot]) return null;
            const pasado = (window.ahoraSync() - e.inicio) / 1000;
            const espera = nivel === 'facil' ? 40 : nivel === 'normal' ? 30 : 20;
            if (pasado < espera) return { esperar: (espera - pasado) * 1000 };
            return () => {
                const m = mejorCifras(e.numeros, e.objetivo, nivel === 'facil' ? 300 : nivel === 'normal' ? 4000 : 200000);
                return entregarCifras(m.v, m.pasos);
            };
        }
    }
});

function tocarCifra(i){
    vibrarJ(6);
    const s = _cifras;
    if (s.sel == null || s.op == null || s.sel === i) { s.sel = s.sel === i ? null : i; s.op = s.sel == null ? null : s.op; Cifras.redibujar(); return; }
    const a = s.fichas[s.sel].v, b = s.fichas[i].v, r = OPS_CIFRAS[s.op](a, b);
    if (r == null || r <= 0) { if (window.sfx) window.sfx.error(); if (window.animJuegos) window.animJuegos.cartel(s.op === '÷' ? 'Tiene que dar exacto' : 'Tiene que dar positivo', { dur: 900, sonido: false }); return; }
    s.fichas[s.sel].usada = true; s.fichas[i].usada = true;
    s.fichas.push({ v: r, usada: false });
    s.pasos.push({ txt: `${a} ${s.op} ${b} = ${r}`, a: s.sel, b: i });
    s.sel = s.fichas.length - 1; s.op = null;
    if (window.sfx) window.sfx.click();
    if (r === Cifras.estado.objetivo && window.sfx) window.sfx.acierto();
    Cifras.redibujar();
}
function opCifras(o){ vibrarJ(6); if (_cifras.sel == null) return; _cifras.op = _cifras.op === o ? null : o; Cifras.redibujar(); }
function deshacerCifras(){
    const s = _cifras, p = s.pasos.pop();
    if (!p) return;
    s.fichas.pop(); s.fichas[p.a].usada = false; s.fichas[p.b].usada = false; s.sel = null; s.op = null;
    Cifras.redibujar();
}
async function mandarCifras(){
    const e = Cifras.estado;
    if (!e || e.fase !== 'jugando' || !_cifras) return;
    const libres = _cifras.fichas.filter(f => !f.usada);
    const v = libres.reduce((m, f) => Math.abs(f.v - e.objetivo) < Math.abs(m - e.objetivo) ? f.v : m, libres[0].v);
    await entregarCifras(v, _cifras.pasos.map(p => p.txt));
}
async function entregarCifras(v, pasos){
    vibrarJ(12);
    await Cifras.accion((e) => {
        if (e.entregas[miIdentidad]) return null;
        const entregas = { ...e.entregas, [miIdentidad]: { v, pasos: pasos.slice(0, 8), t: window.ahoraSync() } };
        return entregas.nico && entregas.carito ? finCifras(e, entregas) : { entregas };
    });
    if (window.sfx) window.sfx.click();
}
// Si se pasó el tiempo y el otro no mandó (se fue), se cierra igual.
async function cerrarCifras(){
    await Cifras.accion((e) => (window.ahoraSync() - e.inicio) / 1000 < SEGUNDOS_CIFRAS + 5 ? null : finCifras(e, e.entregas));
}
function finCifras(e, entregas){
    const d = (q) => entregas[q] ? Math.abs(entregas[q].v - e.objetivo) : Infinity;
    const dn = d('nico'), dc = d('carito');
    const ganador = dn === dc ? 'empate' : dn < dc ? 'nico' : 'carito';
    const sol = mejorCifras(e.numeros, e.objetivo, 60000);
    const motivo = ganador === 'empate' ? (dn === 0 ? '¡Los dos llegaron justo!' : 'Quedaron igual de cerca.') : d(ganador) === 0 ? '¡Llegó justo a la meta!' : `Quedó a ${d(ganador)} de la meta.`;
    return { entregas, ganador, motivo, solucion: { v: sol.v, pasos: sol.pasos } };
}
