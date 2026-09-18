// ==================== TIPEO RELÁMPAGO ====================
// Aparece una frase, el primero en escribirla igual gana el punto.
// Mismo patrón de ronda determinista que Cálculo Mental Rayo/Carrera
// de Anagramas, comparando texto normalizado. A 4 puntos (las frases
// son más largas, conviene una partida más corta).
const META_TIPEO = 4;
const BANCO_FRASES_TIPEO = [
    'el amor no se mide en palabras',
    'hoy es un buen dia para reirse',
    'cada momento juntos cuenta',
    'la paciencia es una forma de cariño',
    'las cosas simples son las que importan',
    'un abrazo a tiempo cura casi todo',
    'seguimos sumando recuerdos',
    'el tiempo compartido no se pierde',
    'seguimos eligiendonos cada dia',
    'seguimos siendo equipo',
    'la costumbre linda de estar bien',
    'nada como reirse juntos de algo tonto',
];

function refTipeo(){ return window.doc(window.db, 'juegos', 'tipeo'); }

function normalizarFraseTipeo(t){
    return (t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim().replace(/\s+/g, ' ');
}

function fraseTipeo(ronda){
    const rng = window.rngRonda(ronda * 486187 + 17);
    return window.elegirRnd(rng, BANCO_FRASES_TIPEO);
}

let _tipeoFaseAnterior = null;
function iniciarTipeo(){
    _tipeoFaseAnterior = null;
    if (window._unsubTipeo) window._unsubTipeo();
    window._unsubTipeo = window.onSnapshot(refTipeo(), (snap) => {
        const datos = snap.exists() ? snap.data() : null;
        if (datos && datos.fase === 'terminado' && _tipeoFaseAnterior === 'jugando' && window.sfx) {
            window.sfx[datos.ganador === miIdentidad ? 'victoria' : 'derrota']();
            if (window.fx && datos.ganador === miIdentidad) window.fx.confeti();
        }
        _tipeoFaseAnterior = datos ? datos.fase : null;
        renderTipeo(datos);
    }, (err) => {
        console.error('Error de Firestore en tipeo:', err);
        document.getElementById('contenido-tipeo').innerHTML = `<div class="panel texto-centro texto-tenue">⚠️ No se pudo conectar (${err.code || 'error'}).</div>`;
    });
}

let _cuentaRegresivaTipeo = null;
function renderTipeo(estado){
    const cont = document.getElementById('contenido-tipeo');
    if (_cuentaRegresivaTipeo) { clearTimeout(_cuentaRegresivaTipeo); _cuentaRegresivaTipeo = null; }

    if (!estado || estado.fase === 'sin_partida') {
        const v = estado?.victorias || { nico: 0, carito: 0 };
        cont.innerHTML = `<div class="panel texto-centro">
            <p class="texto-tenue">Escribí la frase que aparece, igualita. El primero en terminarla bien suma el punto. A ${META_TIPEO} puntos gana.</p>
            <div class="texto-tenue" style="margin:10px 0;">Partidas ganadas — Nico ${v.nico || 0} — Carito ${v.carito || 0}</div>
            <button class="btn-principal" onclick="marcarListoTipeo()">Empezar</button>
        </div>`;
        return;
    }

    if (estado.fase === 'esperando') {
        const listoYo = estado.listos?.[miIdentidad];
        const listoRival = estado.listos?.[miRival];
        cont.innerHTML = `<div class="panel texto-centro">
            <div class="texto-tenue" style="margin-bottom:10px;">
                ${nombreJugador(miIdentidad)}: ${listoYo ? '✅ listo/a' : '⏳ esperando'}<br>
                ${nombreJugador(miRival)}: ${listoRival ? '✅ listo/a' : '⏳ esperando'}
            </div>
            <button class="btn-principal" ${listoYo ? 'disabled style="opacity:0.5;"' : ''} onclick="marcarListoTipeo()">${listoYo ? 'Esperando al otro…' : '¡Estoy listo/a! ⌨️'}</button>
        </div>`;
        if (listoYo && listoRival) iniciarRondaArcadeSiCorresponde(refTipeo(), 'tipeo', 0, { ronda: 1, puntajes: { nico: 0, carito: 0 }, ganador: null });
        return;
    }

    if (estado.fase === 'terminado') {
        const p = estado.puntajes || { nico: 0, carito: 0 };
        cont.innerHTML = `<div class="panel texto-centro logro-animado">
            <div style="font-size:1.2rem; margin-bottom:8px;">🏆 ¡Ganó ${nombreJugador(estado.ganador)}!</div>
            <div class="texto-tenue">Nico ${p.nico || 0} — Carito ${p.carito || 0}</div>
            <button class="btn-principal" style="margin-top:14px;" onclick="revanchaTipeo()">🔁 Revancha</button>
        </div>`;
        return;
    }

    const restante = (estado.horaInicio || Date.now()) - Date.now();
    if (restante > -500) {
        cont.innerHTML = htmlCuentaRegresivaArcade(restante);
        _cuentaRegresivaTipeo = setTimeout(() => renderTipeo(estado), restante > 0 ? Math.min(restante, 200) : 150);
        return;
    }

    const p = estado.puntajes || { nico: 0, carito: 0 };
    const ronda = estado.ronda || 1;
    const frase = fraseTipeo(ronda);
    cont.innerHTML = `<div class="texto-tenue texto-centro" style="margin-bottom:8px;">Nico ${p.nico || 0} — Carito ${p.carito || 0} · a ${META_TIPEO}</div>
    <div class="panel texto-centro">
        <div style="font-size:1.1rem; margin:6px 0 16px; line-height:1.5;">"${frase}"</div>
        <input type="text" id="input-tipeo" placeholder="Escribila acá..." autocomplete="off"
            style="width:100%; padding:12px; border-radius:12px; border:1px solid var(--borde); background:rgba(255,255,255,0.06); color:var(--texto); font-size:0.95rem; margin-bottom:10px; text-align:center;"
            onkeydown="if(event.key==='Enter') responderTipeo(${ronda})">
        <button class="btn-principal" onclick="responderTipeo(${ronda})">Listo</button>
    </div>`;
    setTimeout(() => document.getElementById('input-tipeo')?.focus(), 50);
}

async function marcarListoTipeo(){
    vibrarJ(12);
    const estado = await new Promise(res => { const u = window.onSnapshot(refTipeo(), s => { u(); res(s.exists() ? s.data() : null); }); });
    await window.setDoc(refTipeo(), {
        fase: 'esperando',
        listos: { ...(estado?.listos || {}), [miIdentidad]: true },
        victorias: estado?.victorias || { nico: 0, carito: 0 }
    }, { merge: true });
}

async function responderTipeo(rondaEsperada){
    const input = document.getElementById('input-tipeo');
    const intento = normalizarFraseTipeo(input ? input.value : '');
    if (!intento) return;
    const ref = refTipeo();
    const resultado = await window.runTransaction(window.db, async (tx) => {
        const snap = await tx.get(ref);
        const data = snap.data();
        if (!data || data.fase !== 'jugando' || (data.ronda || 1) !== rondaEsperada) return { acierto: false };
        const frase = fraseTipeo(data.ronda || 1);
        if (intento !== normalizarFraseTipeo(frase)) return { acierto: false };
        const puntajes = { ...(data.puntajes || { nico: 0, carito: 0 }) };
        puntajes[miIdentidad] = (puntajes[miIdentidad] || 0) + 1;
        const gano = puntajes[miIdentidad] >= META_TIPEO;
        const updates = { puntajes, ronda: (data.ronda || 1) + 1 };
        if (gano) {
            updates.fase = 'terminado'; updates.ganador = miIdentidad;
            const victorias = { ...(data.victorias || { nico: 0, carito: 0 }) };
            victorias[miIdentidad] = (victorias[miIdentidad] || 0) + 1;
            updates.victorias = victorias;
        }
        tx.update(ref, updates);
        return { acierto: true, gano };
    });
    if (resultado.acierto) {
        vibrarJ(15);
        if (window.sfx) window.sfx.acierto();
        if (resultado.gano && typeof registrarEvento === 'function') {
            registrarEvento('gano_partida', `${nombreJugador(miIdentidad)} ganó Tipeo Relámpago`);
        }
    } else {
        vibrarJ([10, 30, 10]);
        if (window.sfx) window.sfx.error();
        if (window.fx) window.fx.sacudir(input);
    }
}

async function revanchaTipeo(){
    vibrarJ(10);
    const estado = await new Promise(res => { const u = window.onSnapshot(refTipeo(), s => { u(); res(s.exists() ? s.data() : null); }); });
    await window.setDoc(refTipeo(), { fase: 'esperando', listos: {}, victorias: estado?.victorias || { nico: 0, carito: 0 } });
}
