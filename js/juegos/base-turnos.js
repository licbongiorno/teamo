// ============================================================
// base-turnos.js — base compartida de los juegos de mesa nuevos.
//
// Cada juego nuevo (Gomoku, Mancala, Parchís...) sólo define sus
// reglas y cómo se dibuja; esto resuelve lo de siempre:
//  - "los dos listos" para arrancar (transacción: nunca se reparte dos veces),
//  - jugadas a prueba de doble toque (jugadaSegura) chequeando fase y turno,
//  - fin de partida: ganador, marcador de victorias, sonidos, confeti,
//    ranking (registrarVictoria) y revancha con un toque,
//  - modo contra la compu (si el juego trae cerebro), "te toca",
//    abandonar partida y el animador de fichas/cartas.
//
// Uso:
//   const G = JuegoTurnos.crear({ id:'gomoku', intro:'...', emojiListo:'⚫',
//       inicial(previo){ return { tablero:[...], turno:'nico' }; },
//       render(e, c){ return '<html del tablero>'; },   // c: { yo, rival, miTurno }
//       compu: { paso(e, bot, yo, nivel){ return () => G.jugar(...) } } });
//   G.jugar((e) => cambios | null)   → en tu turno; cambios.ganador termina la partida.
//   G.accion((e) => cambios | null)  → sin chequear turno (juegos simultáneos).
// ============================================================
(function () {
    const nombre = (q) => typeof nombreJugador === 'function' ? nombreJugador(q) : q;
    const otroDe = (q) => q === 'nico' ? 'carito' : 'nico';
    const enCompu = () => typeof window.modoCompu === 'function' && !!window.modoCompu();

    function crear(cfg) {
        const id = cfg.id;
        const ref = () => window.doc(window.db, 'juegos', id);
        let faseAnterior = null, ultimo = null;

        function leer() {
            return new Promise(res => { const u = window.onSnapshot(ref(), s => { u(); res(s.exists() ? s.data() : null); }); });
        }
        function estadoNuevo(previo, listos) {
            const base = cfg.inicial(previo || {});
            return {
                fase: 'jugando', listos, ganador: null, motivo: null,
                victorias: (previo && previo.victorias) || { nico: 0, carito: 0 },
                turno: base.turno || (Math.random() < 0.5 ? 'nico' : 'carito'),
                ...base,
            };
        }
        async function marcarListo() {
            if (typeof vibrarJ === 'function') vibrarJ(12);
            if (window.sfx) window.sfx.click();
            await window.runTransaction(window.db, async (tx) => {
                const snap = await tx.get(ref());
                const e = snap.exists() ? snap.data() : null;
                if (e && e.fase === 'jugando') return;
                if (e && e.fase === 'esperando' && e.listos && e.listos[miIdentidad]) return;
                const listos = { ...((e && e.fase === 'esperando' && e.listos) || {}), [miIdentidad]: true };
                if (listos.nico && listos.carito) tx.set(ref(), estadoNuevo(e, listos));
                else tx.set(ref(), { fase: 'esperando', listos, victorias: (e && e.victorias) || { nico: 0, carito: 0 } });
            });
        }
        // Revancha: quien la pide ya queda listo; contra la compu no se
        // invita a nadie de verdad.
        async function revancha() {
            if (!enCompu() && typeof window.invitarAJugar === 'function') window.invitarAJugar(id, 'revancha');
            await marcarListo();
        }
        function cerrar(e, cambios) {
            if (!cambios || !cambios.ganador) return cambios;
            const v = { ...(e.victorias || { nico: 0, carito: 0 }) };
            if (cambios.ganador === 'nico' || cambios.ganador === 'carito') v[cambios.ganador] = (v[cambios.ganador] || 0) + 1;
            return { ...cambios, fase: 'terminado', victorias: v, listos: {} };
        }
        async function despues(res) {
            if (!res || !res.cambios || res.cambios.fase !== 'terminado') return;
            const g = res.cambios.ganador;
            if (typeof registrarVictoria === 'function') registrarVictoria(id, g === 'nico' || g === 'carito' ? g : null);
            const m = res.cambios.motivo;
            if (g === 'empate' && typeof m === 'string' && m.startsWith('🎉') && window.guardarMomento) {
                const info = (window.JUEGOS || []).find(j => j.id === id);
                window.guardarMomento({ juego: id, icono: '🤝', titulo: `¡Lo lograron juntos en ${info ? info.nombre : id}!`, sub: m.replace(/^🎉\s*/, '') });
            }
            if ((g === 'nico' || g === 'carito') && typeof registrarEvento === 'function') {
                const info = (window.JUEGOS || []).find(j => j.id === id);
                registrarEvento('gano_partida', `${nombre(g)} ganó al ${info ? info.nombre : id}`);
            }
        }
        async function jugar(calcular) {
            const res = await window.jugadaSegura(ref(), (e) => {
                if (!e || e.fase !== 'jugando' || e.turno !== miIdentidad) return null;
                return cerrar(e, calcular(e));
            });
            await despues(res);
            return res;
        }
        async function accion(calcular) {
            const res = await window.jugadaSegura(ref(), (e) => {
                if (!e || e.fase !== 'jugando') return null;
                return cerrar(e, calcular(e));
            });
            await despues(res);
            return res;
        }

        function render(e) {
            ultimo = e;
            const cont = document.getElementById('contenido-' + id);
            if (!cont) return;
            const v = (e && e.victorias) || { nico: 0, carito: 0 };
            const marcador = `<div class="texto-tenue texto-centro" style="margin-bottom:6px;">Partidas: ${nombre('nico')} ${v.nico || 0} — ${nombre('carito')} ${v.carito || 0}</div>`;
            if (!e || e.fase === 'esperando' || !e.fase) {
                const ly = e && e.listos && e.listos[miIdentidad], lr = e && e.listos && e.listos[miRival];
                cont.innerHTML = marcador + `<div class="panel texto-centro">
                    <p class="texto-tenue">${cfg.intro}</p>
                    <div class="texto-tenue" style="margin-bottom:10px;">${nombre(miIdentidad)}: ${ly ? '✅ listo/a' : '⏳ esperando'}<br>${nombre(miRival)}: ${lr ? '✅ listo/a' : '⏳ esperando'}</div>
                    <button class="btn-principal" ${ly ? 'disabled style="opacity:0.5;"' : ''} onclick="JuegoTurnos.listo('${id}')">${ly ? 'Esperando al otro…' : `¡Estoy listo/a! ${cfg.emojiListo || '🎲'}`}</button>
                    ${cfg.extraEspera ? cfg.extraEspera(e) : ''}
                </div>`;
                return;
            }
            const c = { yo: miIdentidad, rival: miRival, miTurno: e.fase === 'jugando' && e.turno === miIdentidad };
            let html = marcador;
            if (e.fase === 'terminado') {
                const titulo = cfg.tituloFin ? cfg.tituloFin(e) : e.ganador === 'empate' || !e.ganador ? '🤝 ¡Empate!' : `🏆 ¡Ganó ${nombre(e.ganador)}!`;
                html += `<div class="panel texto-centro logro-animado">
                    <div style="font-size:1.25rem;">${titulo}</div>
                    ${e.motivo ? `<div class="texto-tenue" style="margin-top:4px;">${e.motivo}</div>` : ''}
                    <button class="btn-principal" style="margin-top:12px;" onclick="JuegoTurnos.revancha('${id}')">🔁 Revancha</button>
                </div>`;
            } else if (!cfg.sinTurno && e.turno) {
                html += `<div class="info-turno-tablero">${c.miTurno ? (cfg.textoTurno ? cfg.textoTurno(e, c) : '🎯 Tu turno') : `Turno de ${nombre(e.turno)}…`}</div>`;
            }
            html += cfg.render(e, c);
            if (e.aviso) html += `<div class="panel texto-tenue texto-centro" style="font-size:0.8rem;">${e.aviso}</div>`;
            cont.innerHTML = html;
            if (cfg.alDibujar) cfg.alDibujar(cont, e, c);
        }
        function iniciar() {
            faseAnterior = null;
            const clave = '_unsub' + id.charAt(0).toUpperCase() + id.slice(1);
            if (window[clave]) window[clave]();
            window[clave] = window.onSnapshot(ref(), (snap) => {
                const e = snap.exists() ? snap.data() : null;
                if (e && e.fase === 'terminado' && faseAnterior === 'jugando' && window.sfx) {
                    if (!e.ganador || e.ganador === 'empate') window.sfx.empate();
                    else window.sfx[e.ganador === miIdentidad ? 'victoria' : 'derrota']();
                    if (window.fx && e.ganador === miIdentidad) window.fx.confeti();
                }
                faseAnterior = e ? e.fase : null;
                render(e);
            }, (err) => {
                const cont = document.getElementById('contenido-' + id);
                if (cont) cont.innerHTML = `<div class="panel texto-centro texto-tenue">⚠️ No se pudo conectar (${err.code || 'error'}).</div>`;
            });
        }

        const api = { id, ref, leer, jugar, accion, marcarListo, revancha, iniciar, redibujar: () => render(ultimo), get estado() { return ultimo; } };
        JUEGOS_REGISTRADOS[id] = api;
        window.INICIAR_JUEGO = window.INICIAR_JUEGO || {};
        window.INICIAR_JUEGO[id] = iniciar;
        if (typeof JUEGOS_ABANDONABLES !== 'undefined') JUEGOS_ABANDONABLES[id] = { fase: 'esperando', listos: {} };
        if (cfg.compu && typeof window.registrarCerebroCompu === 'function') {
            window.registrarCerebroCompu(id, { listo: () => marcarListo(), paso: cfg.compu.paso });
        }
        return api;
    }

    const JUEGOS_REGISTRADOS = {};
    window.JuegoTurnos = {
        crear,
        listo: (id) => JUEGOS_REGISTRADOS[id] && JUEGOS_REGISTRADOS[id].marcarListo(),
        revancha: (id) => JUEGOS_REGISTRADOS[id] && JUEGOS_REGISTRADOS[id].revancha(),
        de: (id) => JUEGOS_REGISTRADOS[id],
        // Para texto que escribe la gente (pistas, respuestas) antes de meterlo en el HTML.
        esc: (t) => String(t == null ? '' : t).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch])),
        otroDe,
    };
})();
