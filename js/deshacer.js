// ============================================================
// deshacer.js — "↩️ Pedir deshacer" para Ajedrez y Damas.
//
// Cada jugada guarda en el documento cómo estaba el tablero justo
// antes (pilaDeshacer, las últimas 2 jugadas). Quien movió puede
// pedir deshacer; el otro acepta o no. Si el otro ya contestó con su
// jugada, se deshacen las dos (la tuya y su respuesta) — así también
// sirve contra la compu, que siempre acepta.
// ============================================================
(function () {
    const CAMPOS = {
        ajedrez: ['tablero', 'enroques', 'alPaso', 'medioMov', 'turno', 'jaque', 'ultimoMov', 'jugadas'],
        damas: ['tablero', 'turno', 'jugadas'],
    };
    const ref = (juego) => window.doc(window.db, 'juegos', juego);
    const log = (e, msg) => [...(e.historial || []), msg].slice(-6);

    // Para sumar a los cambios de una jugada: cómo estaba todo antes.
    function guardarAntes(juego, actual, por) {
        const foto = { por };
        CAMPOS[juego].forEach(c => { foto[c] = actual[c] === undefined ? null : actual[c]; });
        return { pilaDeshacer: [...(actual.pilaDeshacer || []).slice(-1), foto], pedidoDeshacer: null };
    }

    function cuantasDeshacer(e, yo) {
        const pila = e.pilaDeshacer || [];
        if (!pila.length || e.fase !== 'jugando') return 0;
        if (pila[pila.length - 1].por === yo) return 1;
        if (pila.length >= 2 && pila[pila.length - 2].por === yo) return 2;
        return 0;
    }

    async function pedir(juego) {
        vibrarJ(10);
        const res = await window.jugadaSegura(ref(juego), (e) => {
            if (!e || e.pedidoDeshacer) return null;
            const n = cuantasDeshacer(e, miIdentidad);
            if (!n) return null;
            return { pedidoDeshacer: { de: miIdentidad, cuantas: n } };
        });
        if (res && window.sfx) window.sfx.click();
    }
    async function cancelar(juego) {
        await window.jugadaSegura(ref(juego), (e) => (e && e.pedidoDeshacer && e.pedidoDeshacer.de === miIdentidad) ? { pedidoDeshacer: null } : null);
    }
    async function responder(juego, acepta) {
        vibrarJ(12);
        const res = await window.jugadaSegura(ref(juego), (e) => {
            const p = e && e.pedidoDeshacer;
            if (!p || p.de !== miRival || e.fase !== 'jugando') return null;
            if (!acepta) return { pedidoDeshacer: null, historial: log(e, `${nombreJugador(miIdentidad)} no aceptó deshacer.`) };
            const pila = e.pilaDeshacer || [];
            const n = Math.min(p.cuantas || 1, pila.length);
            if (!n) return { pedidoDeshacer: null };
            const foto = { ...pila[pila.length - n] };
            delete foto.por;
            return {
                ...foto, pilaDeshacer: pila.slice(0, pila.length - n), pedidoDeshacer: null,
                historial: log(e, n === 1 ? `↩️ Se deshizo la última jugada de ${nombreJugador(p.de)}.` : `↩️ Se deshicieron las dos últimas jugadas (la de ${nombreJugador(p.de)} y la respuesta).`)
            };
        });
        if (res && window.sfx) window.sfx[acepta ? 'swoosh' : 'toque']();
    }

    // Lo que se muestra abajo del tablero.
    function html(juego, e) {
        if (!e || e.fase !== 'jugando') return '';
        const p = e.pedidoDeshacer;
        if (p && p.de === miRival) {
            return `<div class="panel texto-centro ayuda-deshacer">
                <div style="margin-bottom:8px;">↩️ ${nombreJugador(miRival)} te pide deshacer ${p.cuantas === 2 ? 'su jugada y tu respuesta' : 'su última jugada'}</div>
                <div class="btn-fila"><button class="btn-principal" onclick="responderDeshacer('${juego}', true)">Dale 👍</button>
                <button class="btn-secundario" onclick="responderDeshacer('${juego}', false)">No</button></div></div>`;
        }
        if (p && p.de === miIdentidad) {
            return `<div class="panel texto-centro texto-tenue ayuda-deshacer">⏳ Esperando que ${nombreJugador(miRival)} acepte deshacer…
                <button class="btn-secundario" style="width:auto; margin-left:6px; padding:4px 10px;" onclick="cancelarDeshacer('${juego}')">Cancelar</button></div>`;
        }
        const n = cuantasDeshacer(e, miIdentidad);
        if (!n) return '';
        return `<button class="btn-secundario" style="margin-top:10px;" onclick="pedirDeshacer('${juego}')">↩️ Pedir deshacer${n === 2 ? ' (tu jugada y la del otro)' : ''}</button>`;
    }

    window.deshacer = { guardarAntes, html, cuantas: cuantasDeshacer };
    window.pedirDeshacer = pedir;
    window.cancelarDeshacer = cancelar;
    window.responderDeshacer = responder;
})();
