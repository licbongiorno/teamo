// ============================================================
// recomendador.js — "¿A qué jugamos?" en el lugar de la sugerencia
// del día. Elige según el momento:
//  - si alguno marcó un día bajón en el termómetro: algo tierno o en equipo,
//  - si el otro está conectado: algo en vivo para jugar ya,
//  - de noche: algo tranqui para antes de dormir,
//  - juegos nuevos que todavía no abrieron,
//  - lo que hace mucho que no juegan (se anota en este celu al abrir un juego).
// Muestra una sugerencia grande con el porqué y dos alternativas.
// ============================================================
(function () {
    const TIERNOS = ['mente', 'codigo', 'onda', 'antesdedormir', 'lenguajes', 'suenos', 'mapaamor', 'dibujayadivina', 'treintayseis'];
    const EN_VIVO = ['truco', 'uno', 'onda', 'mente', 'sopa', 'rosco', 'codigo', 'dibujayadivina', 'tiraafloja', 'calculo', 'trivia', 'palabras', 'generala', 'reflejos', 'ppt'];
    const DE_NOCHE = ['antesdedormir', 'treintayseis', 'preguntadia', 'mapaamor', 'nuncapregunte', 'mente'];
    const CLAVE = 'juegosAbiertosEn';
    const termo = { nico: null, carito: null };
    let semillaAlt = Math.random();

    const info = (id) => (window.JUEGOS || []).find(j => j.id === id && j.disponible);
    const existe = (id) => info(id) && document.getElementById('pantalla-' + id);
    const nombre = (q) => typeof nombreJugador === 'function' ? nombreJugador(q) : q;
    const otro = () => (typeof miRival !== 'undefined' && miRival) || null;
    function abiertos() { try { return JSON.parse(localStorage.getItem(CLAVE) || '{}'); } catch (e) { return {}; } }
    function anotar(id) {
        if (!info(id)) return;
        const a = abiertos(); a[id] = Date.now();
        try { localStorage.setItem(CLAVE, JSON.stringify(a)); } catch (e) { /* nada */ }
    }
    // El mismo día sale la misma sugerencia (no cambia cada vez que vuelven al menú).
    function delDia(lista, extra) {
        const ok = lista.filter(existe);
        if (!ok.length) return null;
        const d = new Date();
        const n = d.getFullYear() * 372 + d.getMonth() * 31 + d.getDate() + (extra || 0);
        return ok[n % ok.length];
    }
    function diasDesde(ts) { return Math.floor((Date.now() - ts) / 86400000); }

    function candidatos() {
        const c = [], ab = abiertos(), hora = new Date().getHours();
        const bajos = ['nico', 'carito'].filter(q => termo[q] != null && termo[q] <= 4);
        if (bajos.length) {
            const quien = bajos.length === 2 ? 'Los dos marcaron' : `${bajos[0] === (typeof miIdentidad !== 'undefined' ? miIdentidad : '') ? 'Marcaste' : nombre(bajos[0]) + ' marcó'}`;
            c.push({ id: delDia(TIERNOS), por: `💛 ${quien} que hoy no es el mejor día: algo tierno y en equipo.` });
        }
        const est = typeof estadoRivalEnVivo === 'function' ? estadoRivalEnVivo() : { conectado: false };
        if (est.conectado && otro()) c.push({ id: delDia(EN_VIVO, 3), por: `🟢 ${nombre(otro())} está conectado/a ahora: ¡algo en vivo para jugar ya!`.replace('conectado/a', otro() === 'carito' ? 'conectada' : 'conectado') });
        if (hora >= 22 || hora < 3) c.push({ id: delDia(DE_NOCHE, 1), por: '🌙 Ya es de noche: algo tranqui para antes de dormir.' });
        const nuevos = (window.JUEGOS || []).filter(j => j.nuevo && existe(j.id) && !ab[j.id]).map(j => j.id);
        if (nuevos.length) c.push({ id: delDia(nuevos, 2), por: '✨ ¡Todavía no lo probaste! Es nuevo.' });
        const viejos = (window.JUEGOS || []).filter(j => existe(j.id) && ab[j.id] && diasDesde(ab[j.id]) >= 7).sort((a, b) => ab[a.id] - ab[b.id]).map(j => j.id);
        if (viejos.length) c.push({ id: viejos[0], por: `⏳ Hace ${diasDesde(ab[viejos[0]])} días que no lo abrís.` });
        const todos = (window.JUEGOS || []).filter(j => j.disponible && existe(j.id)).map(j => j.id);
        c.push({ id: delDia(todos), por: '🎲 La sugerencia del día.' });
        // Sin repetidos, en orden de prioridad.
        const vistos = new Set();
        return c.filter(x => x.id && !vistos.has(x.id) && vistos.add(x.id));
    }

    function render() {
        const cont = document.getElementById('destacado-hoy');
        if (!cont || !window.JUEGOS) return;
        const c = candidatos();
        if (!c.length) return;
        const [p, ...resto] = c;
        const j = info(p.id);
        // Alternativas: lo que quedó de las reglas + algún otro al azar.
        const extras = (window.JUEGOS || []).filter(x => x.disponible && existe(x.id) && !c.some(y => y.id === x.id));
        const alt = [...resto.map(x => x.id)];
        while (alt.length < 2 && extras.length) alt.push(extras.splice(Math.floor(semillaAlt * extras.length) % extras.length, 1)[0].id);
        cont.innerHTML = `${window.tarjetaJuegoHTML(j, { destacado: true })}
            <div class="motivo-sugerencia">${p.por}</div>
            <div class="alternativas-sugerencia"><span>O si no:</span>${alt.slice(0, 2).map(id => { const x = info(id); return `<button onclick="abrirJuego('${id}')">${x.icono} ${x.nombre}</button>`; }).join('')}
                <button title="Otras ideas" onclick="otraSugerencia()">🔄</button><button title="Uno al azar" onclick="jugarAlAzar()">🎲 Al azar</button></div>`;
    }

    function escucharTermometro() {
        if (!window.db || !window.onSnapshot) return false;
        const d = new Date();
        const hoy = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const orig = window._onSnapshotSinCompu || window.onSnapshot;
        ['nico', 'carito'].forEach(q => {
            orig(window.doc(window.db, 'juegos', `termometro-${hoy}-${q}`), (snap) => {
                termo[q] = snap.exists() ? snap.data().valor : null;
                render();
            }, () => {});
        });
        return true;
    }
    function envolverAbrirJuego() {
        const orig = window.abrirJuego;
        if (typeof orig !== 'function' || orig._recomendador) return false;
        const nueva = function (id) { anotar(id); return orig.apply(this, arguments); };
        Object.keys(orig).forEach(k => { nueva[k] = orig[k]; });
        nueva._recomendador = true;
        window.abrirJuego = nueva;
        return true;
    }
    function arrancar() {
        envolverAbrirJuego();
        render();
        let n = 0;
        if (!escucharTermometro()) { const t = setInterval(() => { if (escucharTermometro() || ++n > 60) clearInterval(t); }, 500); }
        // Al volver al menú se actualiza; la presencia cambia sola, así que también se revisa cada tanto.
        document.addEventListener('juego-cerrado', () => setTimeout(render, 30));
        setInterval(() => { if (!document.hidden && document.getElementById('pantalla-menu')?.classList.contains('activa')) render(); }, 60000);
    }

    window.otraSugerencia = () => { semillaAlt = Math.random(); if (window.sfx) window.sfx.click(); render(); };
    window.renderRecomendador = render;
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', arrancar);
    else arrancar();
})();
