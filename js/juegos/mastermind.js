// ==================== DESCIFRÁ EL CÓDIGO (Mastermind en duelo) ====================
// Cada uno elige en secreto un código de 4 colores (de 6, se pueden repetir).
// Por turnos tratan de adivinar el código del otro: ⚫ = color justo en su
// lugar, ⚪ = color que está pero en otro lugar. Gana quien lo descifra en
// menos intentos (si los dos lo sacan en la misma vuelta, empate).
// Códigos como texto de 4 dígitos del 0 al 5.
const COLORES_MM = ['🔴', '🟠', '🟡', '🟢', '🔵', '🟣'];
const MAX_INTENTOS_MM = 10;
let _codigoMM = '';

function pistaMM(secreto, intento){
    let negras = 0;
    const s = {}, g = {};
    for (let i = 0; i < 4; i++) {
        if (secreto[i] === intento[i]) negras++;
        else { s[secreto[i]] = (s[secreto[i]] || 0) + 1; g[intento[i]] = (g[intento[i]] || 0) + 1; }
    }
    let blancas = 0;
    Object.keys(g).forEach(k => { blancas += Math.min(g[k], s[k] || 0); });
    return { b: negras, w: blancas };
}
const TODOS_MM = (() => { const l = []; for (let i = 0; i < 1296; i++) l.push(i.toString(6).padStart(4, '0')); return l; })();

const Mastermind = JuegoTurnos.crear({
    id: 'mastermind',
    emojiListo: '🎯',
    intro: `Elegí un código secreto de 4 colores y tratá de descifrar el del otro antes que él. ⚫ = color en su lugar · ⚪ = color que está, pero en otro lugar. Tenés ${MAX_INTENTOS_MM} intentos.`,
    inicial: () => { const p = Math.random() < 0.5 ? 'nico' : 'carito'; return { etapa: 'secreto', secretos: { nico: '', carito: '' }, intentos: { nico: [], carito: [] }, primero: p, turno: p, resuelto: {} }; },
    sinTurno: false,
    textoTurno: (e) => e.etapa === 'secreto' ? '🔒 Elegí tu código secreto' : '🎯 Tu turno: adiviná el código',
    render(e, c) {
        const fila = (codigo, pista) => `<div class="fila-mm"><span class="codigo-mm">${[...codigo].map(d => COLORES_MM[d]).join('')}</span>${pista ? `<span class="pista-mm">${'⚫'.repeat(pista.b)}${'⚪'.repeat(pista.w)}${'·'.repeat(4 - pista.b - pista.w)}</span>` : ''}</div>`;
        let h = '';
        if (e.etapa === 'secreto') {
            if (e.secretos[c.yo]) return `<div class="panel texto-centro">Tu código: <span class="codigo-mm">${[...e.secretos[c.yo]].map(d => COLORES_MM[d]).join('')}</span><br><span class="texto-tenue">Esperando que ${nombreJugador(c.rival)} elija el suyo…</span></div>`;
            return `<div class="panel texto-centro"><b>🔒 Elegí tu código secreto</b><div class="codigo-mm grande">${[0, 1, 2, 3].map(i => _codigoMM[i] != null ? COLORES_MM[_codigoMM[i]] : '⚪').join('')}</div>
                ${paletaMM()}<div class="btn-fila"><button class="btn-secundario" onclick="borrarMM()">↩️</button><button class="btn-principal" ${_codigoMM.length === 4 ? '' : 'disabled style="opacity:0.5;"'} onclick="guardarSecretoMM()">Guardar mi código</button></div></div>`;
        }
        const mios = e.intentos[c.yo] || [], suyos = e.intentos[c.rival] || [];
        h += `<div class="tableros-mm"><div class="panel"><div class="texto-tenue" style="font-size:0.78rem;">Tus intentos (código de ${nombreJugador(c.rival)})</div>
            ${mios.map(x => fila(x.g, x)).join('') || '<div class="texto-tenue" style="font-size:0.8rem;">Todavía ninguno</div>'}
            ${e.fase === 'terminado' ? `<div class="texto-tenue" style="font-size:0.78rem; margin-top:6px;">Era: ${fila(e.secretos[c.rival])}</div>` : ''}</div>
            <div class="panel"><div class="texto-tenue" style="font-size:0.78rem;">Los de ${nombreJugador(c.rival)} con tu código ${[...e.secretos[c.yo]].map(d => COLORES_MM[d]).join('')}</div>
            ${suyos.map(x => fila(x.g, x)).join('') || '<div class="texto-tenue" style="font-size:0.8rem;">Todavía ninguno</div>'}</div></div>`;
        if (c.miTurno) {
            h += `<div class="panel texto-centro"><div class="codigo-mm grande">${[0, 1, 2, 3].map(i => _codigoMM[i] != null ? COLORES_MM[_codigoMM[i]] : '⚪').join('')}</div>${paletaMM()}
                <div class="btn-fila"><button class="btn-secundario" onclick="borrarMM()">↩️</button><button class="btn-principal" ${_codigoMM.length === 4 ? '' : 'disabled style="opacity:0.5;"'} onclick="adivinarMM()">Probar (${mios.length + 1}/${MAX_INTENTOS_MM})</button></div></div>`;
        }
        return h;
    },
    alDibujar(cont, e) { if (e.fase !== 'jugando' || e.turno !== miIdentidad) _codigoMM = ''; },
    compu: {
        paso(e, bot, yo, nivel) {
            if (e.fase !== 'jugando') return null;
            if (e.etapa === 'secreto') {
                if (e.secretos[bot]) return null;
                const s = TODOS_MM[Math.floor(Math.random() * 1296)];
                return () => { _codigoMM = s; return guardarSecretoMM(); };
            }
            if (e.turno !== bot) return null;
            const g = intentoCompuMM(e.intentos[bot] || [], nivel);
            return () => { _codigoMM = g; return adivinarMM(); };
        }
    }
});

function paletaMM(){ return `<div class="paleta-mm">${COLORES_MM.map((col, i) => `<button onclick="colorMM(${i})">${col}</button>`).join('')}</div>`; }
function colorMM(i){ vibrarJ(6); if (_codigoMM.length < 4) _codigoMM += String(i); if (window.sfx) window.sfx.click(); Mastermind.redibujar(); }
function borrarMM(){ vibrarJ(6); _codigoMM = _codigoMM.slice(0, -1); Mastermind.redibujar(); }
async function guardarSecretoMM(){
    const s = _codigoMM;
    if (!/^[0-5]{4}$/.test(s)) return;
    // En la etapa del secreto los dos eligen a la vez (sin turno).
    await Mastermind.accion((e) => {
        if (e.etapa !== 'secreto' || e.secretos[miIdentidad]) return null;
        const secretos = { ...e.secretos, [miIdentidad]: s };
        return secretos.nico && secretos.carito ? { secretos, etapa: 'adivinar', turno: e.primero } : { secretos };
    });
    _codigoMM = '';
}
async function adivinarMM(){
    const g = _codigoMM;
    if (!/^[0-5]{4}$/.test(g)) return;
    let acerto = false;
    const res = await Mastermind.jugar((e) => {
        if (e.etapa !== 'adivinar') return null;
        const p = pistaMM(e.secretos[miRival], g);
        acerto = p.b === 4;
        const lista = [...(e.intentos[miIdentidad] || []), { g, b: p.b, w: p.w }];
        const intentos = { ...e.intentos, [miIdentidad]: lista };
        const resuelto = { ...(e.resuelto || {}), ...(acerto ? { [miIdentidad]: lista.length } : {}) };
        const soyPrimero = e.primero === miIdentidad;
        if (soyPrimero) {
            // El segundo siempre tiene su vuelta para empatar.
            return { intentos, resuelto, turno: miRival };
        }
        const rp = resuelto[miRival], rs = resuelto[miIdentidad];
        if (rp && rs) return { intentos, resuelto, ganador: 'empate', motivo: `¡Los dos lo descifraron en ${lista.length} intentos!` };
        if (rs) return { intentos, resuelto, ganador: miIdentidad, motivo: `Lo descifró en ${lista.length} intento${lista.length === 1 ? '' : 's'}.` };
        if (rp) return { intentos, resuelto, ganador: miRival, motivo: `Lo descifró en ${rp} intento${rp === 1 ? '' : 's'}.` };
        if (lista.length >= MAX_INTENTOS_MM) return { intentos, resuelto, ganador: 'empate', motivo: 'Nadie lo descifró en 10 intentos.' };
        return { intentos, resuelto, turno: miRival };
    });
    _codigoMM = '';
    if (res && window.sfx) acerto ? window.sfx.acierto() : window.sfx.toque();
}

// Compu: un código que encaje con todas las pistas que recibió. En difícil,
// el que mejor parte lo que queda (minimax de Knuth sobre los candidatos).
function intentoCompuMM(previos, nivel){
    if (!previos.length) return nivel === 'facil' ? TODOS_MM[Math.floor(Math.random() * 1296)] : '0011';
    let cand = TODOS_MM.filter(code => previos.every(p => { const q = pistaMM(code, p.g); return q.b === p.b && q.w === p.w; }));
    if (nivel === 'facil' && Math.random() < 0.5) {
        const ult = previos[previos.length - 1];
        cand = TODOS_MM.filter(code => { const q = pistaMM(code, ult.g); return q.b === ult.b && q.w === ult.w; });
    }
    if (!cand.length) return TODOS_MM[Math.floor(Math.random() * 1296)];
    if (nivel !== 'dificil' || cand.length <= 2 || cand.length > 400) return cand[Math.floor(Math.random() * cand.length)];
    let mejor = cand[0], mejorMax = Infinity;
    cand.forEach(g => {
        const part = {};
        cand.forEach(s => { const q = pistaMM(s, g); const k = q.b * 10 + q.w; part[k] = (part[k] || 0) + 1; });
        const m = Math.max(...Object.values(part));
        if (m < mejorMax) { mejorMax = m; mejor = g; }
    });
    return mejor;
}
