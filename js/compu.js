// ============================================================
// compu.js — jugar contra la compu (🤖) en los juegos de mesa por
// turnos, para cuando el otro está ocupado o dormido.
//
// Cómo funciona, sin reescribir ningún juego:
//  - La partida contra la compu vive en un documento aparte
//    (juegos/<juego>-compu-<yo>): se intercepta window.doc para ese
//    juego, así la partida de los dos no se toca nunca.
//  - La compu juega "sentándose" un instante en la silla del otro: se
//    intercambian miIdentidad/miRival, se llama a la MISMA función que
//    usaría la otra persona (jugarCartaTruco, jugarConecta4, ...) y se
//    vuelve a la normalidad. Mientras tanto se frenan los redibujos de
//    ese documento (para no mostrar la mano de la compu ni un segundo) y
//    se tapan los toques. Las reglas son exactamente las del juego.
//  - Las victorias contra la compu no cuentan en el ranking de pareja,
//    la Noche de juegos ni el historial: se guardan aparte, por nivel.
//  - La compu nunca espía: decide sólo con sus cartas/dados y lo que
//    está a la vista en la mesa.
// ============================================================
(function () {
    const NIVELES = {
        facil: { nombre: 'Fácil', emoji: '😊', desc: 'Para practicar tranqui' },
        normal: { nombre: 'Normal', emoji: '🙂', desc: 'Juega bien, a veces se equivoca' },
        dificil: { nombre: 'Difícil', emoji: '😈', desc: 'Piensa varias jugadas adelante' },
    };
    let modo = null; // { juego, nivel, yo, bot }
    let enSilla = false; // la compu está jugando ahora mismo
    const pendientes = new Map();
    let unsubBot = null, estadoBot = null, ocupado = false, timerBot = null;
    const intentos = new Map();

    const esperar = (ms) => new Promise(r => setTimeout(r, ms));
    const azar = (a) => a[Math.floor(Math.random() * a.length)];
    const firma = (e) => JSON.stringify(e || null);
    function nombreCompu() { return 'la Compu 🤖'; }
    const NOMBRE_REAL = { nico: 'Nico', carito: 'Carito' };

    // ==================== ENVOLTURAS ====================
    let instalado = false;
    function instalar() {
        if (instalado || !window.doc || !window.onSnapshot) return;
        instalado = true;
        const docOrig = window.doc;
        window.doc = function (db, col, id, ...resto) {
            if (modo && col === 'juegos' && id === modo.juego && resto.length === 0) id = `${id}-compu-${modo.yo}`;
            return docOrig.call(this, db, col, id, ...resto);
        };
        const snapOrig = window.onSnapshot;
        window._onSnapshotSinCompu = snapOrig;
        window.onSnapshot = function (ref, ...args) {
            const i = args.findIndex(a => typeof a === 'function');
            // Las lecturas que hace la propia compu mientras juega pasan derecho.
            if (i < 0 || enSilla || !ref || typeof ref.path !== 'string' || !ref.path.includes('-compu-')) return snapOrig.call(this, ref, ...args);
            const cb = args[i];
            const clave = {};
            args[i] = function (snap) {
                if (enSilla) { pendientes.set(clave, () => cb(snap)); return; }
                return cb(snap);
            };
            return snapOrig.call(this, ref, ...args);
        };
        envolver('vibrarJ', (orig) => function () { if (!enSilla) return orig.apply(this, arguments); });
        envolver('nombreJugador', (orig) => function (id) { return (modo && id === modo.bot) ? nombreCompu() : orig.apply(this, arguments); });
        envolver('registrarEvento', (orig) => function () { if (!modo) return orig.apply(this, arguments); });
        envolver('registrarVictoria', (orig) => function (juegoId, ganador) {
            if (!modo) return orig.apply(this, arguments);
            anotarRecord(modo.juego, modo.nivel, ganador === modo.yo ? 'g' : ganador === modo.bot ? 'p' : null);
        });
        envolver('cerrarJuego', (orig) => function () { const r = orig.apply(this, arguments); if (modo) salirSinReabrir(); return r; });
        envolver('abrirJuego', (orig) => function (juego) { if (modo && juego !== modo.juego) salirSinReabrir(); return orig.apply(this, arguments); });
    }
    function envolver(nombre, hacer) {
        const orig = window[nombre];
        if (typeof orig !== 'function' || orig._compu) return;
        const nueva = hacer(orig);
        nueva._compu = true;
        window[nombre] = nueva;
    }

    // La compu se sienta en la silla del otro, juega y se levanta.
    async function comoRival(accion) {
        if (!modo) return;
        const yo = modo.yo, bot = modo.bot;
        enSilla = true;
        bloqueo(true);
        miIdentidad = bot; miRival = yo;
        try {
            await Promise.race([accion(), esperar(6000)]);
        } catch (e) {
            console.warn('compu: no pudo jugar', e);
        } finally {
            miIdentidad = yo; miRival = bot;
            enSilla = false;
            bloqueo(false);
            const lista = [...pendientes.values()];
            pendientes.clear();
            lista.forEach(f => { try { f(); } catch (e) { console.warn(e); } });
        }
    }
    let capaBloqueo = null;
    function bloqueo(si) {
        if (!capaBloqueo) {
            capaBloqueo = document.createElement('div');
            capaBloqueo.className = 'compu-bloqueo';
            document.body.appendChild(capaBloqueo);
        }
        capaBloqueo.style.display = si ? 'block' : 'none';
    }

    // ==================== RÉCORDS ====================
    function leerRecords() { try { return JSON.parse(localStorage.getItem('recordCompu') || '{}'); } catch (e) { return {}; } }
    function anotarRecord(juego, nivel, res) {
        if (!res) return;
        const r = leerRecords();
        r[juego] = r[juego] || {};
        r[juego][nivel] = r[juego][nivel] || { g: 0, p: 0 };
        r[juego][nivel][res]++;
        try { localStorage.setItem('recordCompu', JSON.stringify(r)); } catch (e) { /* sin lugar */ }
        actualizarFranja();
    }
    function textoRecord(juego, nivel) {
        const x = (leerRecords()[juego] || {})[nivel];
        return x && (x.g || x.p) ? `Le ganaste ${x.g} · te ganó ${x.p}` : 'Todavía no jugaron';
    }

    // ==================== BUCLE DE LA COMPU ====================
    function escucharBot() {
        pararBot();
        const ref = window.doc(window.db, 'juegos', modo.juego);
        unsubBot = window._onSnapshotSinCompu(ref, (snap) => {
            estadoBot = snap.exists() ? snap.data() : null;
            programar();
        });
    }
    function pararBot() {
        if (unsubBot) { try { unsubBot(); } catch (e) { /* ya estaba */ } }
        unsubBot = null; estadoBot = null;
        clearTimeout(timerBot);
        intentos.clear();
    }
    function programar() {
        clearTimeout(timerBot);
        if (!modo || ocupado) return;
        const cerebro = CEREBROS[modo.juego];
        if (!cerebro || !estadoBot) return;
        const pausa = 650 + Math.random() * 700;
        timerBot = setTimeout(async () => {
            if (!modo || ocupado) return;
            const e = estadoBot;
            const accion = decidir(cerebro, e);
            if (!accion) return;
            // Juegos en vivo: el cerebro puede pedir "pensar" un rato antes de jugar.
            if (typeof accion === 'object' && accion.esperar) { timerBot = setTimeout(programar, Math.min(accion.esperar, 4000)); return; }
            // Si la misma jugada sobre el mismo estado no cambió nada dos
            // veces, se frena (no hay que quedarse trabado en un bucle).
            const f = firma(e);
            const n = (intentos.get(f) || 0) + 1;
            intentos.set(f, n);
            if (n > 2) { console.warn('compu: jugada sin efecto, me freno', modo.juego); return; }
            ocupado = true;
            try { await comoRival(() => accion()); } finally { ocupado = false; }
            setTimeout(programar, 400);
        }, pausa);
    }
    function decidir(cerebro, e) {
        const { yo, bot, nivel } = modo;
        if (!e) return null;
        if (e.fase === 'esperando' || e.fase === 'sin_partida' || !e.fase) {
            if (e.listos && e.listos[yo] && !e.listos[bot]) return () => (typeof cerebro.listo === 'function' ? cerebro.listo() : window[cerebro.listo]());
            return null;
        }
        // La compu siempre acepta deshacer: es para practicar.
        if (e.pedidoDeshacer && e.pedidoDeshacer.de === yo && typeof window.responderDeshacer === 'function') return () => window.responderDeshacer(modo.juego, true);
        try { return cerebro.paso(e, bot, yo, nivel); } catch (err) { console.warn('compu: error pensando', err); return null; }
    }

    // ==================== ENTRAR / SALIR ====================
    async function jugarContraCompu(juego, nivel) {
        instalar();
        cerrarSelector();
        if (typeof detenerListenersActivos === 'function') detenerListenersActivos();
        pararBot();
        const yo = miIdentidad, bot = miRival;
        if (!yo || !bot) return;
        modo = { juego, nivel, yo, bot };
        try { localStorage.setItem('nivelCompu', nivel); } catch (e) { /* nada */ }
        actualizarFranja();
        await window.abrirJuego(juego);
        escucharBot();
    }
    async function volverAJugarConPareja() {
        const juego = modo && modo.juego;
        if (typeof detenerListenersActivos === 'function') detenerListenersActivos();
        salirSinReabrir();
        if (juego) await window.abrirJuego(juego);
    }
    function salirSinReabrir() {
        pararBot();
        modo = null;
        actualizarFranja();
    }

    // ==================== INTERFAZ ====================
    function ponerBotones() {
        [...new Set([...Object.keys(CEREBROS), ...CON_CEREBRO_DIFERIDO])].forEach(juego => {
            const fila = document.querySelector(`#pantalla-${juego} .fila-superior-juego`);
            if (!fila || fila.querySelector('.btn-compu')) return;
            const b = document.createElement('button');
            b.className = 'btn-compu';
            b.type = 'button';
            b.title = 'Jugar contra la compu';
            b.innerHTML = '🤖 <span>vs compu</span>';
            b.onclick = () => abrirSelector(juego);
            fila.insertBefore(b, fila.querySelector('.btn-cerrar-juego'));
            const franja = document.createElement('div');
            franja.className = 'franja-compu oculto';
            fila.insertAdjacentElement('afterend', franja);
        });
    }
    function actualizarFranja() {
        document.querySelectorAll('.franja-compu').forEach(f => f.classList.add('oculto'));
        document.querySelectorAll('.btn-compu').forEach(b => b.classList.remove('activo'));
        if (!modo) return;
        const pantalla = document.getElementById('pantalla-' + modo.juego);
        if (!pantalla) return;
        const f = pantalla.querySelector('.franja-compu');
        const n = NIVELES[modo.nivel];
        pantalla.querySelector('.btn-compu')?.classList.add('activo');
        if (!f) return;
        f.innerHTML = `<span>🤖 Contra la compu · <b>${n.emoji} ${n.nombre}</b> <span class="texto-tenue">· ${textoRecord(modo.juego, modo.nivel)}</span></span>
            <button type="button" onclick="volverAJugarConPareja()">Jugar con ${NOMBRE_REAL[modo.bot]}</button>`;
        f.classList.remove('oculto');
    }
    function abrirSelector(juego) {
        cerrarSelector();
        const ultimo = (() => { try { return localStorage.getItem('nivelCompu') || 'normal'; } catch (e) { return 'normal'; } })();
        const fondo = document.createElement('div');
        fondo.className = 'compu-selector-fondo';
        fondo.onclick = (ev) => { if (ev.target === fondo) cerrarSelector(); };
        const titulo = (window.JUEGOS || []).find(j => j.id === juego)?.nombre || juego;
        fondo.innerHTML = `<div class="compu-selector panel" role="dialog" aria-label="Jugar contra la compu">
            <div class="compu-selector-titulo">🤖 ${titulo} contra la compu</div>
            <div class="texto-tenue" style="font-size:0.8rem; margin-bottom:10px;">Para practicar o jugar cuando ${NOMBRE_REAL[miRival]} no está. No cuenta en el ranking de ustedes.</div>
            ${Object.entries(NIVELES).map(([id, n]) => `<button type="button" class="compu-nivel${id === ultimo ? ' elegido' : ''}" onclick="jugarContraCompu('${juego}','${id}')">
                <span class="compu-nivel-emoji">${n.emoji}</span>
                <span><b>${n.nombre}</b><br><span class="texto-tenue">${n.desc} · ${textoRecord(juego, id)}</span></span>
            </button>`).join('')}
            ${modo && modo.juego === juego ? `<button type="button" class="btn-secundario" style="margin-top:8px;" onclick="volverAJugarConPareja()">Volver a jugar con ${NOMBRE_REAL[miRival]}</button>` : ''}
            <button type="button" class="btn-secundario" style="margin-top:8px;" onclick="cerrarSelectorCompu()">Cancelar</button>
        </div>`;
        document.body.appendChild(fondo);
    }
    function cerrarSelector() { document.querySelectorAll('.compu-selector-fondo').forEach(x => x.remove()); }

    // ==================== CEREBROS ====================
    // paso(estado, bot, yo, nivel) → función a ejecutar en la silla del
    // otro, o null si no le toca hacer nada.

    // ---------- TRUCO ----------
    function fuerzaTruco(e, bot) {
        const jugadas = e.cartasJugadas.filter(c => c.jugador === bot).map(c => c.carta);
        const quedan = e.cartas[bot].filter(c => !jugadas.includes(c));
        const gr = e.ganadoresRonda || [];
        const gane = gr.filter(g => g === bot).length, perdi = gr.filter(g => g && g !== bot && g !== 'parda').length;
        const vals = quedan.map(valorTruco).sort((a, b) => b - a);
        const prom = vals.length ? vals.reduce((t, v) => t + v, 0) / vals.length : 0;
        return { quedan, vals, fuerza: (vals[0] || 0) * 0.6 + prom * 0.4 + 3 * gane - 3 * perdi, gane, perdi };
    }
    const truco = {
        listo: 'marcarListoTruco',
        paso(e, bot, yo, nivel) {
            if (e.fase !== 'jugando') return null;
            const canto = e.cantoPendiente;
            const env = calcularEnvido(e.cartas[bot]);
            const f = fuerzaTruco(e, bot);
            const r = Math.random();
            if (canto && canto.de === yo) {
                if (canto.familia === 'envido') {
                    const falta = canto.tipo === 'falta_envido';
                    const umbral = nivel === 'facil' ? 24 + r * 6 : falta ? 30 : (nivel === 'dificil' ? 26 : 27);
                    const subir = opcionesEnvidoSiguientes(e.envidoCadena).filter(o => o !== canto.tipo && o !== 'falta_envido');
                    if (nivel !== 'facil' && env >= 31 && subir.length && r < 0.6) return () => escalarEnvido(azar(subir));
                    return env >= umbral ? () => responderQuieroTruco() : () => responderNoQuieroTruco();
                }
                const umbral = nivel === 'facil' ? 6.5 + r * 3 : nivel === 'dificil' ? 8.3 : 8.8;
                if (nivel !== 'facil' && canto.nivel < 3 && f.fuerza >= 11 && r < 0.55) return () => escalarTruco();
                if (nivel === 'dificil' && canto.nivel < 3 && r < 0.06) return () => escalarTruco(); // un farol de vez en cuando
                return f.fuerza >= umbral ? () => responderQuieroTruco() : () => responderNoQuieroTruco();
            }
            if (canto || e.jugadorEnTurno !== bot) return null;
            if (e.conFlor && tieneFlorTruco(e.cartas[bot]) && !(e.florCantada || {})[bot]) return () => cantarFlorTruco();
            const puedeEnvido = e.rondaActual === 1 && !e.envidoResuelto && e.trucoNivel === 0 && e.envidoCadena.length === 0;
            if (puedeEnvido) {
                const umbral = nivel === 'facil' ? 29 : nivel === 'dificil' ? 27 : 28;
                if (env >= umbral && r < 0.85) return () => cantarEnvido(env >= 32 && nivel !== 'facil' ? 'real_envido' : 'envido');
                if (nivel === 'dificil' && env < 22 && r < 0.08) return () => cantarEnvido('envido');
            }
            const puedeTruco = e.trucoNivel < 3 && !(e.trucoNivel > 0 && e.trucoUltimoCantadoPor === bot);
            if (puedeTruco) {
                const umbral = nivel === 'facil' ? 11.5 : nivel === 'dificil' ? 9.8 : 10.5;
                if ((f.fuerza >= umbral && r < 0.7) || (nivel === 'dificil' && r < 0.07)) return () => cantarTruco();
            }
            // Qué carta tirar
            const enMesa = e.cartasJugadas.find(c => c.ronda === e.rondaActual && c.jugador === yo);
            const ordenadas = [...f.quedan].sort((a, b) => valorTruco(a) - valorTruco(b));
            let carta;
            if (nivel === 'facil' && r < 0.4) carta = azar(ordenadas);
            else if (enMesa) {
                const v = valorTruco(enMesa.carta);
                carta = ordenadas.find(c => valorTruco(c) > v) || ordenadas[0];
                // Si ya gané una ronda y no llego, no tiro una buena al pedo.
            } else if (e.rondaActual === 1) {
                carta = ordenadas.length === 3 ? ordenadas[1] : ordenadas[ordenadas.length - 1];
                if (nivel === 'dificil' && valorTruco(ordenadas[2]) >= 12) carta = ordenadas[1];
            } else {
                carta = f.gane > f.perdi ? ordenadas[0] : ordenadas[ordenadas.length - 1];
            }
            return () => jugarCartaTruco(carta);
        }
    };

    // ---------- ESCOBA ----------
    function subconjuntos(cartas) {
        const res = [];
        const n = Math.min(cartas.length, 12);
        for (let m = 1; m < (1 << n); m++) res.push(cartas.filter((_, i) => m & (1 << i)));
        return res;
    }
    const escoba = {
        listo: 'marcarListoEscoba',
        paso(e, bot, yo, nivel) {
            if (e.fase !== 'jugando' || e.turno !== bot) return null;
            const mano = e[bot === 'nico' ? 'manoNico' : 'manoCarito'] || [];
            if (!mano.length) return null;
            const mesa = e.mesa || [];
            const suma = (l) => l.reduce((t, c) => t + valorEscoba(c), 0);
            const opciones = [];
            mano.forEach(c => subconjuntos(mesa).forEach(s => {
                if (valorEscoba(c) + suma(s) !== 15) return;
                const quedan = mesa.filter(x => !s.includes(x));
                const todas = [c, ...s];
                let pts = todas.length * 0.5 + todas.filter(x => paloEscoba(x) === 'oro').length * 0.6
                    + (todas.includes('oro_7') ? 3 : 0) + todas.filter(x => numEscoba(x) === 7).length * 0.5;
                if (!quedan.length) pts += 5;
                const resto = suma(quedan);
                if (nivel !== 'facil' && quedan.length && resto >= 5 && resto <= 14) pts -= 2; // le dejo escoba servida
                opciones.push({ c, s, pts });
            }));
            if (opciones.length && !(nivel === 'facil' && Math.random() < 0.25)) {
                opciones.sort((a, b) => b.pts - a.pts);
                const o = nivel === 'facil' ? azar(opciones) : opciones[0];
                return () => conSeleccionEscoba(o.c, o.s, () => levantarEscoba());
            }
            // Tirar: la que menos le sirva al otro.
            const puntaje = (c) => {
                const resto = suma(mesa) + valorEscoba(c);
                let p = valorEscoba(c) * 0.1;
                if (c === 'oro_7') p += 5;
                if (paloEscoba(c) === 'oro') p += 0.8;
                if (numEscoba(c) === 7) p += 1;
                if (nivel !== 'facil' && resto >= 5 && resto <= 14) p += 3;
                return p;
            };
            const c = nivel === 'facil' ? azar(mano) : [...mano].sort((a, b) => puntaje(a) - puntaje(b))[0];
            return () => conSeleccionEscoba(c, [], () => tirarEscoba());
        }
    };
    async function conSeleccionEscoba(carta, mesa, fn) {
        const antes = [_cartaManoEscoba, _seleccionMesaEscoba];
        _cartaManoEscoba = carta; _seleccionMesaEscoba = [...mesa];
        try { await fn(); } finally { _cartaManoEscoba = antes[0]; _seleccionMesaEscoba = antes[1]; }
    }

    // ---------- CHINCHÓN ----------
    const chinchon = {
        listo: 'marcarListoChinchon',
        paso(e, bot, yo, nivel) {
            if (e.fase !== 'jugando' || e.turno !== bot) return null;
            const mano = e[bot === 'nico' ? 'manoNico' : 'manoCarito'] || [];
            const mejorDescarte = (cartas) => {
                let mejor = null;
                cartas.forEach((c, i) => {
                    const p = mejorParticion(cartas.filter((_, j) => j !== i));
                    const v = p.deadwood * 10 - valorChinchon(c) * 0.1;
                    if (!mejor || v < mejor.v) mejor = { i, p, v };
                });
                return mejor;
            };
            if (!e.yaRobo) {
                const top = (e.descarte || [])[e.descarte.length - 1];
                if (!top || nivel === 'facil' && Math.random() < 0.5) return () => robarChinchon('mazo');
                const conTop = mejorDescarte([...mano, top]);
                const sinTop = mejorParticion(mano).deadwood;
                const gana = conTop && conTop.p.deadwood < sinTop - (nivel === 'dificil' ? 2 : 3) && conTop.i !== mano.length;
                return () => robarChinchon(gana ? 'descarte' : 'mazo');
            }
            const m = mejorDescarte(mano);
            if (!m) return null;
            const umbral = nivel === 'facil' ? 3 : nivel === 'dificil' ? 10 : 7; // cerrar temprano suele convenir
            const puedeCerrar = m.p.sueltas.length <= 1;
            if (puedeCerrar && (m.p.deadwood <= umbral || m.p.sueltas.length === 0)) return () => conSeleccionChinchon(m.i, () => cerrarChinchon());
            const i = nivel === 'facil' && Math.random() < 0.3 ? Math.floor(Math.random() * mano.length) : m.i;
            return () => conSeleccionChinchon(i, () => descartarChinchon());
        }
    };
    async function conSeleccionChinchon(i, fn) {
        const antes = _seleccionManoChinchon;
        _seleccionManoChinchon = i;
        try { await fn(); } finally { _seleccionManoChinchon = antes; }
    }

    // ---------- UNO ----------
    const uno = {
        listo: 'marcarListoUno',
        paso(e, bot, yo, nivel) {
            if (e.fase !== 'jugando' || e.turno !== bot) return null;
            const mano = e[bot === 'nico' ? 'manoNico' : 'manoCarito'] || [];
            const rival = (e[yo === 'nico' ? 'manoNico' : 'manoCarito'] || []).length;
            const top = e.descarte[e.descarte.length - 1];
            const jugables = mano.map((c, i) => ({ c, i })).filter(({ c }) =>
                esComodinUno(c) || colorUno(c) === e.colorActual || valorUno(c) === valorUno(top));
            if (!jugables.length) return () => robarCartaUno();
            const cuenta = {};
            mano.forEach(c => { const col = colorUno(c); if (col) cuenta[col] = (cuenta[col] || 0) + 1; });
            const colorFavorito = Object.keys(cuenta).sort((a, b) => cuenta[b] - cuenta[a])[0] || azar(COLORES_UNO);
            const valor = ({ c }) => {
                const v = valorUno(c);
                let p = 0;
                if (esComodinUno(c)) p -= 6; // los comodines se guardan
                if (v === '+2' || v === 'salto' || v === 'reversa' || c === 'comodin+4') p += rival <= 2 ? 8 : 1;
                if (colorUno(c) === colorFavorito) p += 1;
                if (/^\d$/.test(v)) p += Number(v) * 0.1;
                return p;
            };
            const elegida = nivel === 'facil' ? azar(jugables) : [...jugables].sort((a, b) => valor(b) - valor(a))[0];
            const color = esComodinUno(elegida.c) ? (nivel === 'facil' ? azar(COLORES_UNO) : colorFavorito) : colorUno(elegida.c);
            return () => confirmarJugadaUno(e, elegida.i, color);
        }
    };

    // ---------- AJEDREZ ----------
    const VALOR_PIEZA = { P: 100, N: 320, B: 330, R: 500, Q: 900, K: 0 };
    function evaluarAjedrez(tablero, color) {
        let s = 0;
        for (let i = 0; i < 64; i++) {
            const p = tablero[i];
            if (!p) continue;
            const f = Math.floor(i / 8), c = i % 8;
            let v = VALOR_PIEZA[p[1]];
            const centro = 3.5 - Math.max(Math.abs(f - 3.5), Math.abs(c - 3.5));
            if (p[1] === 'N' || p[1] === 'B') v += centro * 8;
            if (p[1] === 'P') v += (p[0] === 'n' ? 6 - f : f - 1) * 8 + (c >= 2 && c <= 5 ? 6 : 0);
            if (p[1] === 'Q') v += centro * 2;
            s += p[0] === color ? v : -v;
        }
        return s;
    }
    function movimientosDe(estado, color) {
        const res = [];
        for (let i = 0; i < 64; i++) {
            const p = estado.tablero[i];
            if (!p || p[0] !== color) continue;
            movimientosLegalesAjedrez(estado, i).forEach(mov => res.push({ desde: i, mov, captura: estado.tablero[mov.a] ? VALOR_PIEZA[estado.tablero[mov.a][1]] : 0 }));
        }
        return res.sort((a, b) => b.captura - a.captura);
    }
    function negamaxAjedrez(estado, color, prof, alfa, beta) {
        const movs = movimientosDe(estado, color);
        if (!movs.length) return reyEnJaqueAjedrez(estado.tablero, color) ? -100000 - prof : 0;
        if (prof === 0) return evaluarAjedrez(estado.tablero, color);
        let mejor = -Infinity;
        for (const m of movs) {
            const n = aplicarMovimientoAjedrez(estado, m.desde, m.mov, 'Q');
            const v = -negamaxAjedrez({ ...estado, ...n }, otroColorAjedrez(color), prof - 1, -beta, -alfa);
            if (v > mejor) mejor = v;
            if (v > alfa) alfa = v;
            if (alfa >= beta) break;
        }
        return mejor;
    }
    const ajedrez = {
        listo: 'marcarListoAjedrez',
        paso(e, bot, yo, nivel) {
            if (e.fase !== 'jugando' || e.turno !== bot) return null;
            const color = colorDeJugadorAjedrez(bot);
            const movs = movimientosDe(e, color);
            if (!movs.length) return null;
            const prof = nivel === 'facil' ? 0 : nivel === 'normal' ? 1 : 2;
            let mejor = null;
            movs.forEach(m => {
                const n = aplicarMovimientoAjedrez(e, m.desde, m.mov, 'Q');
                let v = -negamaxAjedrez({ ...e, ...n }, otroColorAjedrez(color), prof, -Infinity, Infinity);
                v += (Math.random() - 0.5) * (nivel === 'facil' ? 260 : nivel === 'normal' ? 30 : 8);
                if (!mejor || v > mejor.v) mejor = { ...m, v };
            });
            return () => confirmarMovimientoAjedrez(mejor.desde, mejor.mov.a, 'Q', e.tablero);
        }
    };

    // ---------- DAMAS ----------
    function jugadasDamas(tablero, jugador) {
        const res = [];
        for (let i = 0; i < 64; i++) {
            if (!esPropiaFichaDamas(tablero[i], jugador)) continue;
            const { simples, capturas } = movimientosPosiblesDamas(tablero, i, jugador);
            capturas.forEach(c => res.push({ desde: i, a: c.destino, captura: c, capturas }));
            simples.forEach(a => res.push({ desde: i, a, captura: null, capturas }));
        }
        return res;
    }
    function aplicarDamas(tablero, j, jugador) {
        const t = [...tablero];
        const p = t[j.desde];
        t[j.desde] = null;
        if (j.captura) t[j.captura.capturada] = null;
        const fila = Math.floor(j.a / 8);
        t[j.a] = (!esDamaCoronada(p) && ((jugador === 'nico' && fila === 7) || (jugador === 'carito' && fila === 0))) ? p + 'D' : p;
        return t;
    }
    function evaluarDamas(t, jugador) {
        let s = 0;
        t.forEach((p, i) => {
            if (!p) return;
            const fila = Math.floor(i / 8);
            const mia = esPropiaFichaDamas(p, jugador);
            let v = esDamaCoronada(p) ? 3 : 1 + 0.06 * (p[0] === 'n' ? fila : 7 - fila);
            s += mia ? v : -v;
        });
        return s;
    }
    function negamaxDamas(t, jugador, otro, prof, alfa, beta) {
        if (!t.some(p => esPropiaFichaDamas(p, jugador))) return -1000;
        if (prof === 0) return evaluarDamas(t, jugador);
        const js = jugadasDamas(t, jugador);
        if (!js.length) return -500;
        js.sort((a, b) => (b.captura ? 1 : 0) - (a.captura ? 1 : 0));
        let mejor = -Infinity;
        for (const j of js) {
            const v = -negamaxDamas(aplicarDamas(t, j, jugador), otro, jugador, prof - 1, -beta, -alfa);
            if (v > mejor) mejor = v;
            if (v > alfa) alfa = v;
            if (alfa >= beta) break;
        }
        return mejor;
    }
    const damas = {
        listo: 'marcarListoDamas',
        paso(e, bot, yo, nivel) {
            if (e.fase !== 'jugando' || e.turno !== bot) return null;
            const js = jugadasDamas(e.tablero, bot);
            if (!js.length) return null;
            const prof = nivel === 'facil' ? 1 : nivel === 'normal' ? 3 : 5;
            let mejor = null;
            js.forEach(j => {
                let v = -negamaxDamas(aplicarDamas(e.tablero, j, bot), yo, bot, prof - 1, -Infinity, Infinity);
                v += (Math.random() - 0.5) * (nivel === 'facil' ? 1.6 : 0.1);
                if (!mejor || v > mejor.v) mejor = { ...j, v };
            });
            return async () => {
                const antes = [_damasSeleccion, _damasDestinos, _damasCapturasActuales];
                _damasSeleccion = mejor.desde; _damasDestinos = [mejor.a]; _damasCapturasActuales = mejor.captura ? [mejor.captura] : [];
                try { await seleccionarCasillaDamas(mejor.a); } finally { [_damasSeleccion, _damasDestinos, _damasCapturasActuales] = antes; }
            };
        }
    };

    // ---------- CONECTA 4 ----------
    function puntuarVentanaC4(v, yo, otro) {
        const m = v.filter(x => x === yo).length, o = v.filter(x => x === otro).length, vac = v.filter(x => !x).length;
        if (m === 4) return 100000;
        if (m === 3 && vac === 1) return 50;
        if (m === 2 && vac === 2) return 6;
        if (o === 3 && vac === 1) return -60;
        if (o === 2 && vac === 2) return -5;
        return 0;
    }
    function evaluarC4(t, yo, otro) {
        let s = 0;
        for (let f = 0; f < FILAS_C4; f++) if (t[f * COLS_C4 + 3] === yo) s += 4;
        const celda = (f, c) => t[f * COLS_C4 + c];
        for (let f = 0; f < FILAS_C4; f++) for (let c = 0; c < COLS_C4; c++) {
            [[0, 1], [1, 0], [1, 1], [1, -1]].forEach(([df, dc]) => {
                const fin = [f + df * 3, c + dc * 3];
                if (fin[0] < 0 || fin[0] >= FILAS_C4 || fin[1] < 0 || fin[1] >= COLS_C4) return;
                s += puntuarVentanaC4([0, 1, 2, 3].map(k => celda(f + df * k, c + dc * k)), yo, otro);
            });
        }
        return s;
    }
    function negamaxC4(t, yo, otro, prof, alfa, beta) {
        const cols = [3, 2, 4, 1, 5, 0, 6].filter(c => filaLibreC4(t, c) !== -1);
        if (!cols.length) return 0;
        if (prof === 0) return evaluarC4(t, yo, otro);
        let mejor = -Infinity;
        for (const c of cols) {
            const f = filaLibreC4(t, c);
            const n = [...t]; n[f * COLS_C4 + c] = yo;
            const v = lineaGanadoraC4(n, f, c, yo) ? 1000000 + prof : -negamaxC4(n, otro, yo, prof - 1, -beta, -alfa);
            if (v > mejor) mejor = v;
            if (v > alfa) alfa = v;
            if (alfa >= beta) break;
        }
        return mejor;
    }
    const conecta4 = {
        listo: 'marcarListoConecta4',
        paso(e, bot, yo, nivel) {
            if (e.fase !== 'jugando' || e.turno !== bot) return null;
            const t = e.tablero;
            const cols = [3, 2, 4, 1, 5, 0, 6].filter(c => filaLibreC4(t, c) !== -1);
            if (!cols.length) return null;
            const prof = nivel === 'facil' ? 1 : nivel === 'normal' ? 3 : 6;
            let mejor = null;
            cols.forEach(c => {
                const f = filaLibreC4(t, c);
                const n = [...t]; n[f * COLS_C4 + c] = bot;
                let v = lineaGanadoraC4(n, f, c, bot) ? 1e7 : -negamaxC4(n, yo, bot, prof, -Infinity, Infinity);
                v += (Math.random() - 0.5) * (nivel === 'facil' ? 400 : 2);
                if (!mejor || v > mejor.v) mejor = { c, v };
            });
            return () => jugarConecta4(mejor.c);
        }
    };

    // ---------- TA-TE-TI INFINITO (cada uno tiene 3 marcas) ----------
    function jugarTatetiSim(t, colas, idx, j) {
        const n = [...t], cs = { ...colas, [j]: [...colas[j], idx] };
        if (cs[j].length > 3) n[cs[j].shift()] = null;
        n[idx] = j;
        return { t: n, colas: cs };
    }
    function negamaxTateti(t, colas, j, otro, prof, alfa, beta) {
        if (prof === 0) return 0;
        let mejor = -Infinity;
        for (let i = 0; i < 9; i++) {
            if (t[i]) continue;
            const s = jugarTatetiSim(t, colas, i, j);
            const v = ganadorTateti(s.t, j) ? 100 + prof : -negamaxTateti(s.t, s.colas, otro, j, prof - 1, -beta, -alfa);
            if (v > mejor) mejor = v;
            if (v > alfa) alfa = v;
            if (alfa >= beta) break;
        }
        return mejor === -Infinity ? 0 : mejor;
    }
    const tateti = {
        listo: 'marcarListoTateti',
        paso(e, bot, yo, nivel) {
            if (e.fase !== 'jugando' || e.turno !== bot) return null;
            const t = e.tablero, colas = { nico: [...(e.colas?.nico || [])], carito: [...(e.colas?.carito || [])] };
            const libres = t.map((x, i) => x ? -1 : i).filter(i => i >= 0);
            const prof = nivel === 'facil' ? 1 : nivel === 'normal' ? 3 : 7;
            let mejor = null;
            libres.forEach(i => {
                const s = jugarTatetiSim(t, colas, i, bot);
                let v = ganadorTateti(s.t, bot) ? 1000 : -negamaxTateti(s.t, s.colas, yo, bot, prof, -Infinity, Infinity);
                v += (i === 4 ? 0.5 : 0) + Math.random() * (nivel === 'facil' ? 150 : 0.3);
                if (!mejor || v > mejor.v) mejor = { i, v };
            });
            return mejor ? () => jugarTateti(mejor.i) : null;
        }
    };

    // ---------- REVERSI ----------
    const PESOS_REVERSI = [
        100, -20, 10, 5, 5, 10, -20, 100, -20, -50, -2, -2, -2, -2, -50, -20, 10, -2, 1, 1, 1, 1, -2, 10, 5, -2, 1, 0, 0, 1, -2, 5,
        5, -2, 1, 0, 0, 1, -2, 5, 10, -2, 1, 1, 1, 1, -2, 10, -20, -50, -2, -2, -2, -2, -50, -20, 100, -20, 10, 5, 5, 10, -20, 100];
    function evaluarReversi(t, j, otro) {
        let s = 0;
        t.forEach((x, i) => { if (x === j) s += PESOS_REVERSI[i]; else if (x === otro) s -= PESOS_REVERSI[i]; });
        return s + 4 * (jugadasPosiblesReversi(t, j).length - jugadasPosiblesReversi(t, otro).length);
    }
    function ponerReversi(t, i, j) {
        const n = [...t]; n[i] = j;
        volteosReversi(t, i, j).forEach(k => { n[k] = j; });
        return n;
    }
    function negamaxReversi(t, j, otro, prof, alfa, beta) {
        if (prof === 0) return evaluarReversi(t, j, otro);
        const js = jugadasPosiblesReversi(t, j);
        if (!js.length) return -negamaxReversi(t, otro, j, prof - 1, -beta, -alfa);
        let mejor = -Infinity;
        for (const i of js) {
            const v = -negamaxReversi(ponerReversi(t, i, j), otro, j, prof - 1, -beta, -alfa);
            if (v > mejor) mejor = v;
            if (v > alfa) alfa = v;
            if (alfa >= beta) break;
        }
        return mejor;
    }
    const reversi = {
        listo: 'marcarListoReversi',
        paso(e, bot, yo, nivel) {
            if (e.fase !== 'jugando' || e.turno !== bot) return null;
            const js = jugadasPosiblesReversi(e.tablero, bot);
            if (!js.length) return null;
            let elegida;
            if (nivel === 'facil') {
                // Golosa: la que más da vuelta, con algo de azar.
                elegida = Math.random() < 0.4 ? azar(js) : [...js].sort((a, b) => volteosReversi(e.tablero, b, bot).length - volteosReversi(e.tablero, a, bot).length)[0];
            } else {
                const prof = nivel === 'normal' ? 1 : 3;
                let mejor = null;
                js.forEach(i => {
                    const v = -negamaxReversi(ponerReversi(e.tablero, i, bot), yo, bot, prof, -Infinity, Infinity) + Math.random();
                    if (!mejor || v > mejor.v) mejor = { i, v };
                });
                elegida = mejor.i;
            }
            return () => jugarReversi(elegida);
        }
    };

    // ---------- GENERALA ----------
    const BASE_CAT_GENERALA = { n1: 3, n2: 6, n3: 9, n4: 12, n5: 15, n6: 18, escalera: 20, full: 30, poker: 40, generala: 50, doble: 60 };
    function libresGenerala(p) { return CATEGORIAS_GENERALA.map(c => c.id).filter(id => p[id] === undefined || p[id] === null); }
    function mejorAnotacion(dados, planilla, tiradas, nivel) {
        let mejor = null;
        libresGenerala(planilla).forEach(cat => {
            const pts = puntosGenerala(dados, cat, tiradas === 1, planilla);
            // Vale más anotar cerca de lo "esperable" de la categoría; tachar,
            // mejor las que casi nunca salen.
            let v = pts ? pts - BASE_CAT_GENERALA[cat] * 0.55 : -BASE_CAT_GENERALA[cat] * (cat === 'doble' || cat === 'generala' ? 0.12 : 0.5);
            if (nivel === 'facil') v = pts + Math.random() * 10;
            if (!mejor || v > mejor.v) mejor = { cat, pts, v };
        });
        return mejor;
    }
    function queGuardar(dados, planilla) {
        const libres = libresGenerala(planilla);
        const cuenta = [0, 0, 0, 0, 0, 0, 0];
        dados.forEach(d => cuenta[d]++);
        const distintos = [...new Set(dados)].sort((a, b) => a - b);
        const tramo = (desde) => [desde, desde + 1, desde + 2, desde + 3].every(x => distintos.includes(x));
        if (libres.includes('escalera') && Math.max(...cuenta) <= 2 && (tramo(1) || tramo(2) || tramo(3))) {
            const desde = tramo(2) ? 2 : tramo(1) ? 1 : 3;
            const usados = new Set();
            return dados.map(d => { if (d >= desde && d < desde + 4 && !usados.has(d)) { usados.add(d); return true; } return false; });
        }
        let cara = 6, max = -1;
        for (let n = 6; n >= 1; n--) {
            const val = cuenta[n] * 10 + (libres.includes('n' + n) ? n : 0);
            if (val > max) { max = val; cara = n; }
        }
        return dados.map(d => d === cara);
    }
    const generala = {
        listo: 'marcarListoGenerala',
        paso(e, bot, yo, nivel) {
            if (e.fase !== 'jugando' || e.turno !== bot) return null;
            const planilla = (e.planillas || {})[bot] || {};
            const tiradas = e.tiradas || 0;
            if (tiradas === 0) return () => tirarGenerala();
            const dados = e.dados || [];
            const anot = mejorAnotacion(dados, planilla, tiradas, nivel);
            const grande = anot && anot.pts >= (nivel === 'facil' ? 30 : 25) && ['escalera', 'full', 'poker', 'generala', 'doble'].includes(anot.cat);
            if (tiradas >= 3 || grande) return () => anotarGenerala(anot.cat);
            const quiero = nivel === 'facil' && Math.random() < 0.3 ? dados.map(() => Math.random() < 0.4) : queGuardar(dados, planilla);
            return async () => {
                const actuales = e.guardados || [false, false, false, false, false];
                for (let i = 0; i < 5; i++) if (!!actuales[i] !== !!quiero[i]) await guardarDadoGenerala(i);
                await esperar(350);
                await tirarGenerala();
            };
        }
    };

    // ---------- MENTIROSO ----------
    function probAlMenos(n, k, p) {
        if (k <= 0) return 1;
        if (k > n) return 0;
        let total = 0;
        const comb = (a, b) => { let r = 1; for (let i = 1; i <= b; i++) r = r * (a - b + i) / i; return r; };
        for (let i = k; i <= n; i++) total += comb(n, i) * Math.pow(p, i) * Math.pow(1 - p, n - i);
        return total;
    }
    const mentiroso = {
        listo: 'marcarListoMentiroso',
        paso(e, bot, yo, nivel) {
            if (e.fase !== 'jugando' || e.turno !== bot) return null;
            const mios = e[campoDadosMentiroso(bot)] || [];
            const otros = (e[campoDadosMentiroso(yo)] || []).length;
            const total = mios.length + otros;
            const tengo = (cara) => mios.filter(d => d === cara || d === 1).length;
            const prob = (q, cara) => probAlMenos(otros, q - tengo(cara), 1 / 3);
            const a = e.apuesta;
            const umbralDudar = nivel === 'facil' ? 0.25 + Math.random() * 0.2 : nivel === 'dificil' ? 0.42 : 0.36;
            if (a && a.de === yo && prob(a.cantidad, a.cara) < umbralDudar) return () => dudarMentiroso();
            // Subir: entre las apuestas válidas, la más creíble (preferentemente con mis caras).
            const opciones = [];
            for (let cara = 2; cara <= 6; cara++) {
                for (let q = 1; q <= total; q++) {
                    if (!apuestaValidaMentiroso(a, q, cara, total)) continue;
                    opciones.push({ q, cara, p: prob(q, cara) });
                    break; // la mínima válida para esa cara alcanza
                }
            }
            if (!opciones.length) return a ? () => dudarMentiroso() : null;
            opciones.sort((x, y) => y.p - x.p || x.q - y.q);
            let elegida = opciones[0];
            if (nivel === 'facil') elegida = azar(opciones.slice(0, 3));
            if (a && elegida.p < (nivel === 'dificil' ? 0.3 : 0.25)) return () => dudarMentiroso();
            // Sin apuesta previa, la compu fuerte arranca un poco más arriba.
            if (!a && nivel !== 'facil') {
                const extra = Math.max(0, Math.floor(otros / 3) - (nivel === 'dificil' ? 0 : 1));
                const q = Math.min(total, tengo(elegida.cara) + extra) || 1;
                if (apuestaValidaMentiroso(null, q, elegida.cara, total)) elegida = { ...elegida, q };
            }
            return async () => {
                const antes = _apuestaElegidaMentiroso;
                _apuestaElegidaMentiroso = { cantidad: elegida.q, cara: elegida.cara };
                try { await apostarMentiroso(); } finally { _apuestaElegidaMentiroso = antes; }
            };
        }
    };

    const CEREBROS = { truco, escoba, chinchon, uno, ajedrez, damas, conecta4, tateti, reversi, generala, mentiroso };
    // Juegos nuevos: el botón aparece de entrada y el cerebro llega con el
    // archivo del juego (base-turnos.js llama a registrarCerebroCompu).
    const CON_CEREBRO_DIFERIDO = ['gomoku', 'mancala', 'serpientes', 'parchis', 'domino', 'backgammon', 'guerra', 'blackjack', 'poker', 'damaschinas', 'quoridor', 'cifras', 'mastermind', 'hex', 'fosforos', 'chancho', 'sieteymedio', 'pescar', 'voley', 'hockey', 'pongcoop', 'snake2'];
    window.registrarCerebroCompu = (id, cerebro) => { CEREBROS[id] = cerebro; ponerBotones(); if (modo && modo.juego === id) programar(); };

    window.jugarContraCompu = jugarContraCompu;
    window.volverAJugarConPareja = volverAJugarConPareja;
    window.cerrarSelectorCompu = cerrarSelector;
    window.modoCompu = () => modo;
    window._compuPensar = (juego, e, bot, yo, nivel) => CEREBROS[juego].paso(e, bot, yo, nivel); // para pruebas
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ponerBotones);
    else ponerBotones();
})();
