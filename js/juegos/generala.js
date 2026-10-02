// ==================== GENERALA ====================
// 5 dados, hasta 3 tiradas por turno (podés guardar los que quieras
// entre tirada y tirada) y después anotás en una categoría de tu
// planilla (o tachás una con 0). Cada uno tiene 11 categorías; cuando
// las dos planillas están completas, gana el que sumó más.
// Puntajes argentinos clásicos: escalera 20 (25 servida), full 30 (35),
// póker 40 (45), generala 50 (servida 60), doble generala 100.
// Tirar y anotar van por jugadaSegura (js/jugada-segura.js): los dados
// se tiran adentro de la transacción, así nadie puede tirar dos veces
// con un doble toque ni anotar fuera de turno.
const CATEGORIAS_GENERALA = [
    { id: 'n1', nombre: 'Unos' }, { id: 'n2', nombre: 'Doses' }, { id: 'n3', nombre: 'Treses' },
    { id: 'n4', nombre: 'Cuatros' }, { id: 'n5', nombre: 'Cincos' }, { id: 'n6', nombre: 'Seises' },
    { id: 'escalera', nombre: 'Escalera' }, { id: 'full', nombre: 'Full' }, { id: 'poker', nombre: 'Póker' },
    { id: 'generala', nombre: 'Generala' }, { id: 'doble', nombre: 'Doble generala' },
];
const CARAS_DADO = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

function refGenerala(){ return window.doc(window.db, 'juegos', 'generala'); }

// Puntos que vale anotar los dados en una categoría (servida = salió en
// la primera tirada del turno).
function puntosGenerala(dados, cat, servida, planilla){
    const cuenta = [0, 0, 0, 0, 0, 0, 0];
    dados.forEach(d => cuenta[d]++);
    const grupos = cuenta.slice(1).filter(Boolean).sort((a, b) => b - a);
    if (cat[0] === 'n') { const n = +cat[1]; return cuenta[n] * n; }
    if (cat === 'escalera') {
        const ord = [...dados].sort((a, b) => a - b).join('');
        return (ord === '12345' || ord === '23456' || ord === '13456') ? (servida ? 25 : 20) : 0;
    }
    if (cat === 'full') return (grupos[0] === 3 && grupos[1] === 2) ? (servida ? 35 : 30) : 0;
    if (cat === 'poker') return grupos[0] >= 4 ? (servida ? 45 : 40) : 0;
    if (cat === 'generala') return grupos[0] === 5 ? (servida ? 60 : 50) : 0;
    if (cat === 'doble') return (grupos[0] === 5 && (planilla?.generala || 0) > 0) ? 100 : 0;
    return 0;
}
function totalPlanilla(p){ return Object.values(p || {}).reduce((t, v) => t + (v || 0), 0); }
function planillaCompleta(p){ return CATEGORIAS_GENERALA.every(c => p && p[c.id] !== undefined && p[c.id] !== null); }
function tirarDado(){ return 1 + Math.floor(Math.random() * 6); }

let _generalaFaseAnterior = null;
function iniciarGenerala(){
    if (window._unsubGenerala) window._unsubGenerala();
    _generalaFaseAnterior = null;
    window._unsubGenerala = window.onSnapshot(refGenerala(), (snap) => {
        const datos = snap.exists() ? snap.data() : null;
        if (datos && datos.fase === 'terminado' && _generalaFaseAnterior === 'jugando' && window.sfx) {
            if (datos.ganador === 'empate') window.sfx.empate();
            else window.sfx[datos.ganador === miIdentidad ? 'victoria' : 'derrota']();
            if (window.fx && datos.ganador === miIdentidad) window.fx.confeti();
        }
        _generalaFaseAnterior = datos ? datos.fase : null;
        renderGenerala(datos);
    }, (err) => {
        console.error('Error de Firestore en generala:', err);
        document.getElementById('contenido-generala').innerHTML = `<div class="panel texto-centro texto-tenue">⚠️ No se pudo conectar (${err.code || 'error'}).</div>`;
    });
}

function renderGenerala(estado){
    const cont = document.getElementById('contenido-generala');
    if (!cont) return;
    if (!estado || estado.fase === 'esperando') {
        const listoYo = estado?.listos?.[miIdentidad];
        const listoRival = estado?.listos?.[miRival];
        cont.innerHTML = `<div class="panel texto-centro">
            <p class="texto-tenue">Hasta 3 tiradas por turno: tocá los dados para guardarlos y volvé a tirar el resto. Después anotá en tu planilla. Gana quien sume más al completar las 11 categorías.</p>
            <div class="texto-tenue" style="margin-bottom:10px;">
                ${nombreJugador(miIdentidad)}: ${listoYo ? '✅ listo/a' : '⏳ esperando'}<br>
                ${nombreJugador(miRival)}: ${listoRival ? '✅ listo/a' : '⏳ esperando'}
            </div>
            <button class="btn-principal" ${listoYo ? 'disabled style="opacity:0.5;"' : ''} onclick="marcarListoGenerala()">${listoYo ? 'Esperando al otro…' : '¡Estoy listo/a! 🎲'}</button>
        </div>`;
        return;
    }

    const planillas = estado.planillas || { nico: {}, carito: {} };
    const victorias = estado.victorias || { nico: 0, carito: 0 };
    const esMiTurno = estado.fase === 'jugando' && estado.turno === miIdentidad;
    const dados = estado.dados || [];
    const guardados = estado.guardados || [false, false, false, false, false];
    const tiradas = estado.tiradas || 0;

    let html = `<div class="texto-tenue texto-centro" style="margin-bottom:6px;">Partidas: Nico ${victorias.nico || 0} — Carito ${victorias.carito || 0}</div>`;
    if (estado.fase === 'terminado') {
        html += `<div class="panel texto-centro">
            <div style="font-size:1.2rem; margin-bottom:6px;">${estado.ganador === 'empate' ? '🤝 ¡Empate!' : `🏆 ¡Ganó ${nombreJugador(estado.ganador)}!`}</div>
            <div class="texto-tenue">Nico ${totalPlanilla(planillas.nico)} — Carito ${totalPlanilla(planillas.carito)}</div>
            <button class="btn-principal" style="margin-top:12px;" onclick="reiniciarGenerala()">🔁 Revancha</button>
        </div>`;
    } else {
        html += `<div class="info-turno-tablero">${esMiTurno ? `🎯 Tu turno — tirada ${tiradas} de 3` : `Turno de ${nombreJugador(estado.turno)}… (tirada ${tiradas} de 3)`}</div>`;
        html += `<div class="panel texto-centro">
            <div class="fila-dados-generala">
                ${dados.length ? dados.map((d, i) => `<button class="dado-generala${guardados[i] ? ' dado-guardado' : ''}" ${esMiTurno && tiradas > 0 && tiradas < 3 ? '' : 'disabled'} onclick="guardarDadoGenerala(${i})" aria-label="Dado ${d}${guardados[i] ? ' (guardado)' : ''}">${CARAS_DADO[d]}</button>`).join('')
                    : '<span class="texto-tenue">Todavía no se tiraron los dados.</span>'}
            </div>
            ${esMiTurno && tiradas > 0 && tiradas < 3 ? '<div class="texto-tenue" style="font-size:0.75rem; margin-top:6px;">Tocá un dado para guardarlo (no se vuelve a tirar).</div>' : ''}
            ${esMiTurno && tiradas < 3 ? `<button class="btn-principal" style="margin-top:10px;" onclick="tirarGenerala()">🎲 ${tiradas === 0 ? 'Tirar' : 'Volver a tirar'}</button>` : ''}
        </div>`;
        if (estado.aviso) html += `<div class="texto-tenue texto-centro" style="margin-bottom:8px;">${estado.aviso}</div>`;
    }

    // Planilla: las dos columnas. En mi turno (ya con dados tirados),
    // las categorías libres muestran cuánto valdría anotar ahí.
    const puedoAnotar = esMiTurno && tiradas > 0;
    html += `<div class="panel"><table class="planilla-generala"><thead><tr><th></th><th>Nico</th><th>Carito</th></tr></thead><tbody>`;
    CATEGORIAS_GENERALA.forEach(c => {
        const celda = (j) => {
            const v = planillas[j]?.[c.id];
            if (v !== undefined && v !== null) return `<td>${v === 0 ? '✗' : v}</td>`;
            if (j === miIdentidad && puedoAnotar) {
                const pts = puntosGenerala(dados, c.id, tiradas === 1, planillas[j]);
                return `<td><button class="btn-anotar-generala${pts ? '' : ' anotar-tachar'}" onclick="anotarGenerala('${c.id}')">${pts ? '+' + pts : 'tachar'}</button></td>`;
            }
            return '<td class="texto-tenue">·</td>';
        };
        html += `<tr><td>${c.nombre}</td>${celda('nico')}${celda('carito')}</tr>`;
    });
    html += `<tr class="fila-total-generala"><td>Total</td><td>${totalPlanilla(planillas.nico)}</td><td>${totalPlanilla(planillas.carito)}</td></tr>`;
    html += `</tbody></table></div>`;
    cont.innerHTML = html;
}

async function marcarListoGenerala(){
    vibrarJ(12);
    const ref = refGenerala();
    await window.runTransaction(window.db, async (tx) => {
        const snap = await tx.get(ref);
        const estado = snap.exists() ? snap.data() : null;
        if (estado?.fase === 'jugando' || estado?.listos?.[miIdentidad]) return;
        const listos = { ...(estado?.listos || {}), [miIdentidad]: true };
        const victorias = estado?.victorias || { nico: 0, carito: 0 };
        if (listos.nico && listos.carito) {
            tx.set(ref, {
                fase: 'jugando', listos, turno: Math.random() < 0.5 ? 'nico' : 'carito',
                dados: [], guardados: [false, false, false, false, false], tiradas: 0,
                planillas: { nico: {}, carito: {} }, ganador: null, aviso: null, victorias
            });
        } else {
            tx.set(ref, { fase: 'esperando', listos, victorias }, { merge: true });
        }
    });
}

async function reiniciarGenerala(){
    vibrarJ(12);
    const ref = refGenerala();
    await window.runTransaction(window.db, async (tx) => {
        const snap = await tx.get(ref);
        const estado = snap.exists() ? snap.data() : null;
        if (estado && estado.fase === 'jugando') return;
        tx.set(ref, { fase: 'esperando', listos: {}, victorias: estado?.victorias || { nico: 0, carito: 0 } });
    });
}

async function tirarGenerala(){
    const res = await window.jugadaSegura(refGenerala(), (estado) => {
        if (!estado || estado.fase !== 'jugando' || estado.turno !== miIdentidad) return null;
        const tiradas = estado.tiradas || 0;
        if (tiradas >= 3) return null;
        const guardados = tiradas === 0 ? [false, false, false, false, false] : (estado.guardados || [false, false, false, false, false]);
        const anteriores = estado.dados || [];
        const dados = [0, 1, 2, 3, 4].map(i => (guardados[i] && anteriores[i]) ? anteriores[i] : tirarDado());
        return { dados, guardados, tiradas: tiradas + 1, aviso: null };
    });
    if (!res) return;
    vibrarJ([8, 20, 8]);
    if (window.sfx) window.sfx.dado();
}

// Transacción propia (sin el candado de jugadaSegura): si tocás dos
// dados seguidos rápido, se guardan los dos en vez de ignorar el segundo.
async function guardarDadoGenerala(i){
    vibrarJ(6);
    const ref = refGenerala();
    await window.runTransaction(window.db, async (tx) => {
        const snap = await tx.get(ref);
        const estado = snap.exists() ? snap.data() : null;
        if (!estado || estado.fase !== 'jugando' || estado.turno !== miIdentidad) return;
        const tiradas = estado.tiradas || 0;
        if (tiradas === 0 || tiradas >= 3) return;
        const guardados = [...(estado.guardados || [false, false, false, false, false])];
        guardados[i] = !guardados[i];
        tx.update(ref, { guardados });
    }).catch(e => console.warn('No se pudo guardar el dado:', e));
}

async function anotarGenerala(cat){
    const res = await window.jugadaSegura(refGenerala(), (estado) => {
        if (!estado || estado.fase !== 'jugando' || estado.turno !== miIdentidad) return null;
        const tiradas = estado.tiradas || 0;
        if (tiradas === 0) return null;
        const planillas = { nico: { ...(estado.planillas?.nico || {}) }, carito: { ...(estado.planillas?.carito || {}) } };
        const mia = planillas[miIdentidad];
        if (mia[cat] !== undefined && mia[cat] !== null) return null;
        const pts = puntosGenerala(estado.dados, cat, tiradas === 1, mia);
        mia[cat] = pts;
        const nombreCat = CATEGORIAS_GENERALA.find(c => c.id === cat)?.nombre || cat;
        const updates = {
            planillas, dados: [], guardados: [false, false, false, false, false], tiradas: 0,
            aviso: pts ? `${nombreJugador(miIdentidad)} anotó ${pts} en ${nombreCat}${tiradas === 1 && ['escalera', 'full', 'poker', 'generala'].includes(cat) ? ' (¡servida!)' : ''}.` : `${nombreJugador(miIdentidad)} tachó ${nombreCat}.`
        };
        // Si el otro todavía tiene categorías libres, le toca; si no (ya
        // completó), sigo yo hasta completar la mía.
        if (!planillaCompleta(planillas[miRival])) updates.turno = miRival;
        else updates.turno = miIdentidad;
        if (planillaCompleta(planillas.nico) && planillaCompleta(planillas.carito)) {
            const tN = totalPlanilla(planillas.nico), tC = totalPlanilla(planillas.carito);
            updates.fase = 'terminado';
            updates.ganador = tN === tC ? 'empate' : (tN > tC ? 'nico' : 'carito');
            if (updates.ganador !== 'empate') {
                const v = { ...(estado.victorias || { nico: 0, carito: 0 }) };
                v[updates.ganador] = (v[updates.ganador] || 0) + 1;
                updates.victorias = v;
            }
        }
        return updates;
    });
    if (!res) return;
    const pts = res.cambios.planillas[miIdentidad][cat];
    vibrarJ(pts ? [12, 25, 12] : 10);
    if (window.sfx) window.sfx[pts >= 40 ? 'logro' : (pts ? 'acierto' : 'toque')]();
    if (pts >= 50 && window.fx) window.fx.confeti();
    if (res.cambios.fase === 'terminado' && res.cambios.ganador !== 'empate' && typeof registrarEvento === 'function') {
        registrarEvento('gano_partida', `${nombreJugador(res.cambios.ganador)} ganó a la Generala`);
        if (typeof registrarVictoria === 'function') registrarVictoria('generala', res.cambios.ganador);
    }
}
