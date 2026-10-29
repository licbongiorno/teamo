// ============================================================
// apuestas.js — apuestas cariñosas.
// En los juegos clásicos y de competencia aparece un botón 💝 para
// "poner algo en juego" (un masajito, elegir la peli, lavar los platos…
// o un premio escrito a mano). Cuando la partida termina con ganador,
// el premio pasa a "Premios por cobrar" (tarjeta en el menú) hasta que
// se marca "¡Cobrado! 💌". Contra la compu no se apuesta.
// Doc juegos/apuestas: { activas: {[juego]: {premio, de, ts}},
//                        porCobrar: [{id, juego, premio, ganador, perdedor, fecha, cobrado}] }
// ============================================================
(function () {
    const PREMIOS = ['💆 Un masajito', '🎬 Elegir la peli', '🍽️ Lavar los platos', '💋 Un beso a domicilio', '☕ Un desayuno en la cama', '🍫 Un antojo dulce', '🎶 Elegir la música del auto', '🤗 Un abrazo de 20 segundos'];
    const CATEGORIAS = ['clasicos', 'competencia', 'duelos', 'rapidos'];
    const ref = () => window.doc(window.db, 'juegos', 'apuestas');
    const nombre = (q) => typeof nombreJugador === 'function' ? nombreJugador(q) : (q === 'nico' ? 'Nico' : 'Carito');
    const esc = (t) => String(t == null ? '' : t).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
    const info = (id) => (window.JUEGOS || []).find(j => j.id === id);
    let datos = { activas: {}, porCobrar: [] }, primera = true;

    const enCompu = () => typeof window.modoCompu === 'function' && !!window.modoCompu();

    // ---------- Hoja para elegir el premio ----------
    function abrir(juego) {
        cerrar();
        if (enCompu()) {
            if (window.mostrarCartelEnVivo) window.mostrarCartelEnVivo({ titulo: '💝 Contra la compu no se apuesta', sub: 'Las apuestas cariñosas son sólo entre ustedes 😉', duracion: 3500 });
            return;
        }
        const activa = (datos.activas || {})[juego];
        const fondo = document.createElement('div');
        fondo.className = 'compu-selector-fondo apuestas-fondo';
        fondo.onclick = (ev) => { if (ev.target === fondo) cerrar(); };
        fondo.innerHTML = `<div class="compu-selector panel" role="dialog" aria-label="Apuesta cariñosa">
            <div class="compu-selector-titulo">💝 ¿Qué ponemos en juego?</div>
            ${activa ? `<div class="apuesta-actual">Ya está en juego: <b>${esc(activa.premio)}</b><br><small>La puso ${esc(nombre(activa.de))}</small></div>` : ''}
            <div class="texto-tenue" style="font-size:0.8rem; margin-bottom:6px;">El que gane esta partida, cobra.</div>
            <div class="apuestas-grilla">${PREMIOS.map((p, i) => `<button type="button" onclick="ponerApuesta('${juego}', ${i})">${p}</button>`).join('')}</div>
            <div class="apuesta-propia"><input id="apuesta-texto" maxlength="60" placeholder="✍️ O escribí el tuyo…"><button type="button" class="btn-principal" onclick="ponerApuesta('${juego}', -1)">Poner</button></div>
            ${activa ? `<button type="button" class="btn-secundario" style="margin-top:8px;" onclick="quitarApuesta('${juego}')">Sacar la apuesta</button>` : ''}
            <button type="button" class="btn-secundario" style="margin-top:8px;" onclick="cerrarApuestas()">Cancelar</button>
        </div>`;
        document.body.appendChild(fondo);
    }
    function cerrar() { document.querySelectorAll('.apuestas-fondo').forEach(x => x.remove()); }

    async function poner(juego, i) {
        let premio = i >= 0 ? PREMIOS[i] : (document.getElementById('apuesta-texto')?.value || '').trim();
        if (!premio) { document.getElementById('apuesta-texto')?.focus(); return; }
        premio = premio.slice(0, 60);
        cerrar();
        try {
            await window.runTransaction(window.db, async (tx) => {
                const s = await tx.get(ref());
                const d = s.exists() ? s.data() : {};
                tx.set(ref(), { ...d, activas: { ...(d.activas || {}), [juego]: { premio, de: typeof miIdentidad !== 'undefined' ? miIdentidad : null, ts: Date.now() } }, porCobrar: d.porCobrar || [] });
            });
            if (window.sfx) window.sfx.acierto();
        } catch (e) { console.warn('No se pudo poner la apuesta:', e); }
    }
    async function quitar(juego) {
        cerrar();
        try {
            await window.runTransaction(window.db, async (tx) => {
                const s = await tx.get(ref());
                if (!s.exists()) return;
                const d = s.data(), activas = { ...(d.activas || {}) };
                delete activas[juego];
                tx.set(ref(), { ...d, activas });
            });
        } catch (e) { /* nada */ }
    }
    async function cobrar(id) {
        try {
            await window.runTransaction(window.db, async (tx) => {
                const s = await tx.get(ref());
                if (!s.exists()) return;
                const d = s.data();
                tx.set(ref(), { ...d, porCobrar: (d.porCobrar || []).map(p => p.id === id ? { ...p, cobrado: Date.now() } : p) });
            });
            if (window.fx && window.fx.confeti) window.fx.confeti(30);
        } catch (e) { /* nada */ }
    }

    // ---------- Al terminar la partida ----------
    async function adjudicar(juego, ganador) {
        if (enCompu() || !window.db || (ganador !== 'nico' && ganador !== 'carito')) return;
        if (!(datos.activas || {})[juego]) return;
        let ganado = null;
        try {
            await window.runTransaction(window.db, async (tx) => {
                ganado = null;
                const s = await tx.get(ref());
                if (!s.exists()) return;
                const d = s.data(), activas = { ...(d.activas || {}) }, a = activas[juego];
                if (!a) return; // ya la cobró el otro celular
                delete activas[juego];
                const premio = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, juego, premio: a.premio, ganador, perdedor: ganador === 'nico' ? 'carito' : 'nico', fecha: Date.now(), cobrado: null };
                tx.set(ref(), { ...d, activas, porCobrar: [...(d.porCobrar || []), premio].slice(-40) });
                ganado = premio;
            });
            if (ganado && window.guardarMomento) window.guardarMomento({ id: 'ap-' + ganado.id, juego, icono: '💝', titulo: `${nombre(ganador)} se ganó: ${ganado.premio}`, sub: `Apuesta cariñosa · lo paga ${nombre(ganado.perdedor)}`, quien: ganador });
        } catch (e) { console.warn('No se pudo adjudicar la apuesta:', e); }
    }
    function envolverRegistrarVictoria() {
        const orig = window.registrarVictoria;
        if (typeof orig !== 'function' || orig._apuestas) return;
        const nueva = function (juegoId, ganador) {
            const r = orig.apply(this, arguments);
            adjudicar(juegoId, ganador);
            return r;
        };
        Object.keys(orig).forEach(k => { nueva[k] = orig[k]; });
        nueva._apuestas = true;
        window.registrarVictoria = nueva;
    }

    // ---------- Dibujo ----------
    function ponerBotones() {
        (window.JUEGOS || []).filter(j => CATEGORIAS.includes(j.categoria)).forEach(j => {
            const pantalla = document.getElementById('pantalla-' + j.id);
            const fila = pantalla && pantalla.querySelector('.fila-superior-juego');
            if (!fila || fila.querySelector('.btn-apuesta')) return;
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'btn-reglas btn-apuesta';
            b.title = 'Poner algo en juego';
            b.setAttribute('aria-label', 'Apuesta cariñosa');
            b.textContent = '💝';
            b.onclick = () => abrir(j.id);
            fila.insertBefore(b, fila.querySelector('.btn-reglas') || fila.querySelector('.btn-compu') || fila.querySelector('.btn-cerrar-juego'));
            const tira = document.createElement('div');
            tira.className = 'apuesta-tira';
            tira.dataset.juego = j.id;
            tira.hidden = true;
            fila.insertAdjacentElement('afterend', tira);
        });
    }
    function renderTiras() {
        const compu = enCompu();
        document.querySelectorAll('.apuesta-tira').forEach(t => {
            const a = (datos.activas || {})[t.dataset.juego];
            t.hidden = !a || compu;
            if (a) t.innerHTML = `💝 En juego: <b>${esc(a.premio)}</b>`;
            const b = t.previousElementSibling && t.previousElementSibling.querySelector('.btn-apuesta');
            if (b) b.classList.toggle('activa', !!a);
        });
    }
    function renderTarjeta() {
        const cont = document.getElementById('premios-por-cobrar');
        if (!cont) return;
        const pend = (datos.porCobrar || []).filter(p => !p.cobrado).slice(-6).reverse();
        if (!pend.length) { cont.innerHTML = ''; return; }
        cont.innerHTML = `<div class="panel premios-tarjeta"><div class="premios-titulo">💝 Premios por cobrar</div>
            ${pend.map(p => { const j = info(p.juego); return `<div class="premio-fila"><div><b>${esc(nombre(p.ganador))}</b> se ganó ${esc(p.premio)}<small>${j ? `${j.icono} ${esc(j.nombre)} · ` : ''}lo paga ${esc(nombre(p.perdedor))}</small></div>
                <button type="button" class="btn-secundario" onclick="cobrarPremio('${esc(p.id)}')">¡Cobrado! 💌</button></div>`; }).join('')}</div>`;
    }
    function render() { renderTiras(); renderTarjeta(); }

    function escuchar() {
        if (!window.db || !window.onSnapshot) return false;
        envolverRegistrarVictoria();
        const orig = window._onSnapshotSinCompu || window.onSnapshot;
        let vistos = null;
        orig(ref(), (snap) => {
            datos = snap.exists() ? { activas: {}, porCobrar: [], ...snap.data() } : { activas: {}, porCobrar: [] };
            const ids = (datos.porCobrar || []).map(p => p.id);
            if (vistos && !primera) {
                (datos.porCobrar || []).filter(p => !vistos.includes(p.id) && !p.cobrado).forEach(p => {
                    if (window.animJuegos && window.animJuegos.cartel) {
                        window.animJuegos.cartel(`💝 ¡${esc(nombre(p.ganador)).toUpperCase()} SE GANÓ!`, { sub: esc(p.premio), color: p.ganador === 'nico' ? '#a8d8ff' : '#ffb3c6', dur: 2600 });
                    } else if (window.mostrarCartelEnVivo) {
                        window.mostrarCartelEnVivo({ titulo: `💝 ¡${nombre(p.ganador)} se ganó: ${p.premio}!`, duracion: 4000 });
                    }
                });
            }
            vistos = ids;
            primera = false;
            render();
        }, () => render());
        setInterval(renderTiras, 2000); // por si entran o salen del modo compu
        return true;
    }
    function arrancar() {
        ponerBotones();
        render();
        if (escuchar()) return;
        let n = 0;
        const t = setInterval(() => { if (escuchar() || ++n > 60) clearInterval(t); }, 500);
    }

    window.abrirApuesta = abrir;
    window.cerrarApuestas = cerrar;
    window.ponerApuesta = poner;
    window.quitarApuesta = quitar;
    window.cobrarPremio = cobrar;
    window.apuestas = { adjudicar, render, datos: () => datos };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', arrancar);
    else arrancar();
})();
