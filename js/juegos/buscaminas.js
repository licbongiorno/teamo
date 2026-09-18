// ==================== BUSCAMINAS RELÁMPAGO ====================
// Un mismo tablero de 30 celdas (5 minas escondidas) para los dos a
// la vez: el primero que pisa una mina pierde la ronda. Si se
// despliega todo el tablero sin que nadie pise una mina, gana quien
// destapó más celdas. Mejor de 3 rondas.
const FILAS_BUSCAMINAS = 5, COLUMNAS_BUSCAMINAS = 6;
const TOTAL_CELDAS_BUSCAMINAS = FILAS_BUSCAMINAS * COLUMNAS_BUSCAMINAS;
const MINAS_BUSCAMINAS = 5;
const META_RONDAS_BUSCAMINAS = 2; // mejor de 3

function refBuscaminas(){ return window.doc(window.db, 'juegos', 'buscaminas'); }

function generarMinas(semilla){
    const rng = window.rngRonda(semilla);
    const indices = window.barajarRnd(rng, Array.from({ length: TOTAL_CELDAS_BUSCAMINAS }, (_, i) => i));
    return indices.slice(0, MINAS_BUSCAMINAS);
}

let _buscaminasFaseAnterior = null;
function iniciarBuscaminas(){
    _buscaminasFaseAnterior = null;
    if (window._unsubBuscaminas) window._unsubBuscaminas();
    window._unsubBuscaminas = window.onSnapshot(refBuscaminas(), (snap) => {
        const datos = snap.exists() ? snap.data() : null;
        if (datos && datos.fase === 'terminado' && _buscaminasFaseAnterior === 'jugando' && window.sfx) {
            window.sfx[datos.ganadorRonda === miIdentidad ? 'victoria' : 'derrota']();
            if (window.fx && datos.ganadorRonda === miIdentidad) window.fx.confeti();
        }
        _buscaminasFaseAnterior = datos ? datos.fase : null;
        renderBuscaminas(datos);
    }, (err) => {
        console.error('Error de Firestore en buscaminas:', err);
        document.getElementById('contenido-buscaminas').innerHTML = `<div class="panel texto-centro texto-tenue">⚠️ No se pudo conectar (${err.code || 'error'}).</div>`;
    });
}

let _cuentaRegresivaBuscaminas = null;
function renderBuscaminas(estado){
    const cont = document.getElementById('contenido-buscaminas');
    if (_cuentaRegresivaBuscaminas) { clearTimeout(_cuentaRegresivaBuscaminas); _cuentaRegresivaBuscaminas = null; }

    if (!estado || estado.fase === 'sin_partida') {
        const rg = estado?.rondasGanadas || { nico: 0, carito: 0 };
        cont.innerHTML = `<div class="panel texto-centro">
            <p class="texto-tenue">Mismo tablero para los dos: el primero que pisa una mina pierde la ronda. Mejor de 3.</p>
            <div class="texto-tenue" style="margin:10px 0;">Rondas ganadas — Nico ${rg.nico || 0} — Carito ${rg.carito || 0}</div>
            <button class="btn-principal" onclick="marcarListoBuscaminas()">Empezar</button>
        </div>`;
        return;
    }

    if (estado.fase === 'esperando') {
        const listoYo = estado.listos?.[miIdentidad];
        const listoRival = estado.listos?.[miRival];
        const rg = estado.rondasGanadas || { nico: 0, carito: 0 };
        cont.innerHTML = `<div class="panel texto-centro">
            <div class="texto-tenue" style="margin:6px 0 10px;">Rondas ganadas — Nico ${rg.nico || 0} — Carito ${rg.carito || 0}</div>
            <div class="texto-tenue" style="margin-bottom:10px;">
                ${nombreJugador(miIdentidad)}: ${listoYo ? '✅ listo/a' : '⏳ esperando'}<br>
                ${nombreJugador(miRival)}: ${listoRival ? '✅ listo/a' : '⏳ esperando'}
            </div>
            <button class="btn-principal" ${listoYo ? 'disabled style="opacity:0.5;"' : ''} onclick="marcarListoBuscaminas()">${listoYo ? 'Esperando al otro…' : '¡Estoy listo/a! 💣'}</button>
        </div>`;
        if (listoYo && listoRival) {
            iniciarRondaArcadeSiCorresponde(refBuscaminas(), 'buscaminas', 0, {
                semillaMinas: Date.now(),
                reveladas: [],
                reveladasPor: { nico: 0, carito: 0 },
                ganadorRonda: null
            });
        }
        return;
    }

    if (estado.fase === 'terminado') {
        const rg = estado.rondasGanadas || { nico: 0, carito: 0 };
        const terminoMatch = (rg.nico || 0) >= META_RONDAS_BUSCAMINAS || (rg.carito || 0) >= META_RONDAS_BUSCAMINAS;
        cont.innerHTML = `<div class="panel texto-centro logro-animado">
            <div style="font-size:1.2rem; margin-bottom:8px;">${estado.pisoMina ? `💥 ${nombreJugador(estado.ganadorRonda === miIdentidad ? miRival : miIdentidad)} pisó una mina` : '🏁 Tablero despejado'} — ¡Ganó ${nombreJugador(estado.ganadorRonda)} la ronda!</div>
            <div class="texto-tenue">Rondas ganadas — Nico ${rg.nico || 0} — Carito ${rg.carito || 0}</div>
            <button class="btn-principal" style="margin-top:14px;" onclick="revanchaBuscaminas()">${terminoMatch ? '🔁 Nueva partida' : '➡️ Siguiente ronda'}</button>
        </div>`;
        return;
    }

    const restante = (estado.horaInicio || Date.now()) - Date.now();
    if (restante > -500) {
        cont.innerHTML = htmlCuentaRegresivaArcade(restante);
        _cuentaRegresivaBuscaminas = setTimeout(() => renderBuscaminas(estado), restante > 0 ? Math.min(restante, 200) : 150);
        return;
    }

    const minas = generarMinas(estado.semillaMinas);
    const reveladas = estado.reveladas || [];
    const rg = estado.rondasGanadas || { nico: 0, carito: 0 };
    let html = `<div class="texto-tenue texto-centro" style="margin-bottom:8px;">Rondas — Nico ${rg.nico || 0} — Carito ${rg.carito || 0} · mejor de 3</div>`;
    html += `<div class="tablero-juego" style="grid-template-columns:repeat(${COLUMNAS_BUSCAMINAS},1fr); max-width:340px; margin:0 auto;">`;
    for (let i = 0; i < TOTAL_CELDAS_BUSCAMINAS; i++) {
        const revelada = reveladas.includes(i);
        const esMina = minas.includes(i);
        let contenido = '';
        if (revelada) contenido = esMina ? '💥' : '·';
        html += `<div class="casilla-tablero ${revelada ? 'casilla-clara' : 'casilla-oscura'}" onclick="${revelada ? '' : `revelarCeldaBuscaminas(${i})`}">${contenido}</div>`;
    }
    html += `</div>`;
    cont.innerHTML = html;
}

async function marcarListoBuscaminas(){
    vibrarJ(12);
    // Transacción (en vez de leer con onSnapshot y despues escribir
    // con merge suelto): si los dos tocan "listo" casi al mismo
    // tiempo, una lectura suelta puede no ver todavía la marca del
    // otro y la escritura de uno pisa la del otro, dejando la
    // partida esperando para siempre.
    await window.runTransaction(window.db, async (tx) => {
        const snap = await tx.get(refBuscaminas());
        const estado = snap.exists() ? snap.data() : null;
        if (estado?.fase === 'esperando' && estado?.listos?.[miIdentidad]) return;
        tx.set(refBuscaminas(), {
            fase: 'esperando',
            listos: { ...(estado?.listos || {}), [miIdentidad]: true },
            rondasGanadas: estado?.rondasGanadas || { nico: 0, carito: 0 }
        }, { merge: true });
    });
}

async function revelarCeldaBuscaminas(indice){
    const ref = refBuscaminas();
    const resultado = await window.runTransaction(window.db, async (tx) => {
        const snap = await tx.get(ref);
        const data = snap.data();
        if (!data || data.fase !== 'jugando') return { valido: false };
        const reveladas = data.reveladas || [];
        if (reveladas.includes(indice)) return { valido: false };
        const minas = generarMinas(data.semillaMinas);
        const nuevasReveladas = [...reveladas, indice];
        const updates = { reveladas: nuevasReveladas };
        if (minas.includes(indice)) {
            // Pisó una mina: pierde esta ronda, gana el rival.
            const rondasGanadas = { ...(data.rondasGanadas || { nico: 0, carito: 0 }) };
            rondasGanadas[miRival] = (rondasGanadas[miRival] || 0) + 1;
            updates.fase = 'terminado'; updates.ganadorRonda = miRival; updates.pisoMina = true; updates.rondasGanadas = rondasGanadas;
            tx.update(ref, updates);
            return { valido: true, mina: true };
        }
        const reveladasPor = { ...(data.reveladasPor || { nico: 0, carito: 0 }) };
        reveladasPor[miIdentidad] = (reveladasPor[miIdentidad] || 0) + 1;
        updates.reveladasPor = reveladasPor;
        const celdasSeguras = TOTAL_CELDAS_BUSCAMINAS - MINAS_BUSCAMINAS;
        if (nuevasReveladas.length >= celdasSeguras) {
            // Tablero despejado sin bajas: gana quien destapó más.
            const ganadorRonda = reveladasPor.nico === reveladasPor.carito ? miIdentidad : (reveladasPor.nico > reveladasPor.carito ? 'nico' : 'carito');
            const rondasGanadas = { ...(data.rondasGanadas || { nico: 0, carito: 0 }) };
            rondasGanadas[ganadorRonda] = (rondasGanadas[ganadorRonda] || 0) + 1;
            updates.fase = 'terminado'; updates.ganadorRonda = ganadorRonda; updates.pisoMina = false; updates.rondasGanadas = rondasGanadas;
        }
        tx.update(ref, updates);
        return { valido: true, mina: false };
    });
    if (!resultado.valido) return;
    if (resultado.mina) {
        vibrarJ([20, 40, 20, 40, 80]);
        if (window.sfx) window.sfx.explosion();
        if (window.fx) window.fx.sacudirJuego();
    } else {
        vibrarJ(8);
        if (window.sfx) window.sfx.toque();
        if (typeof registrarEvento === 'function') {
            registrarEvento('gano_partida', `Jugaron Buscaminas Relámpago`);
        }
    }
}

async function revanchaBuscaminas(){
    vibrarJ(10);
    const estado = await new Promise(res => { const u = window.onSnapshot(refBuscaminas(), s => { u(); res(s.exists() ? s.data() : null); }); });
    const rg = estado?.rondasGanadas || { nico: 0, carito: 0 };
    const terminoMatch = (rg.nico || 0) >= META_RONDAS_BUSCAMINAS || (rg.carito || 0) >= META_RONDAS_BUSCAMINAS;
    await window.setDoc(refBuscaminas(), {
        fase: 'esperando', listos: {},
        rondasGanadas: terminoMatch ? { nico: 0, carito: 0 } : rg
    });
}
