// ============================================================
// favoritos.js — para encontrar rápido a qué jugar entre tantos juegos.
//  - ⭐ en el encabezado de cada juego para marcarlo como favorito (se
//    guarda en este celu). En el menú: "⭐ Favoritos" y "🕘 Últimos".
//  - Filtros rápidos en el menú, con las etiquetas del catálogo: ⚡ En vivo ·
//    🤖 Contra la compu · 📱 Misma pantalla · 🤝 En equipo · ⏱️ Cortitos …
//  - "Seguir jugando": lo último que abrieron, con cuándo.
//  - En la hoja ❓ de cada juego: el cara a cara (quién ganó más veces).
// ============================================================
(function () {
    const CLAVE = 'juegosFavoritos';
    // Las etiquetas salen del catálogo (js/juegos-data.js → etiquetasJuego).
    const ORDEN_FILTROS = ['vivo', 'compu', 'mismaPantalla', 'equipo', 'corto', 'turnos', 'charla'];
    const MAX_CHIPS = 12;
    let filtro = null, ranking = null, verTodos = false;

    const leer = () => { try { return JSON.parse(localStorage.getItem(CLAVE) || '[]'); } catch (e) { return []; } };
    const guardar = (l) => { try { localStorage.setItem(CLAVE, JSON.stringify(l)); } catch (e) { /* nada */ } };
    const info = (id) => (window.JUEGOS || []).find(j => j.id === id && j.disponible && document.getElementById('pantalla-' + id));
    const chip = (j) => `<button class="chip-juego" onclick="abrirJuego('${j.id}')"><span>${j.icono}</span>${j.nombre}</button>`;
    const hace = (ts) => { const d = Math.floor((Date.now() - ts) / 86400000); return d <= 0 ? 'hoy' : d === 1 ? 'ayer' : `hace ${d} d`; };
    const tarjetita = (j, ts) => `<button class="tarjetita-juego" onclick="abrirJuego('${j.id}')"><span class="ic">${window.iconoJuegoHTML ? window.iconoJuegoHTML(j) : j.icono}</span><b>${j.nombre}</b><small>${hace(ts)}</small></button>`;

    function alternar(id){
        const l = leer(), i = l.indexOf(id);
        if (i >= 0) l.splice(i, 1); else l.unshift(id);
        guardar(l.slice(0, 24));
        if (window.sfx) window.sfx.click();
        ponerEstrellas(); render();
    }
    function ponerEstrellas(){
        const favs = leer();
        (window.JUEGOS || []).forEach(j => {
            const fila = document.querySelector(`#pantalla-${j.id} .fila-superior-juego`);
            if (!fila) return;
            let b = fila.querySelector('.btn-favorito');
            if (!b) {
                b = document.createElement('button');
                b.type = 'button'; b.className = 'btn-reglas btn-favorito';
                b.onclick = () => alternar(j.id);
                fila.insertBefore(b, fila.querySelector('.btn-apuesta') || fila.querySelector('.btn-reglas') || fila.querySelector('.btn-compu') || fila.querySelector('.btn-cerrar-juego'));
            }
            const es = favs.includes(j.id);
            b.textContent = es ? '⭐' : '☆';
            b.title = es ? 'Sacar de favoritos' : 'Marcar como favorito';
            b.setAttribute('aria-pressed', es);
            b.classList.toggle('activa', es);
        });
    }
    function render(){
        const cont = document.getElementById('favoritos-menu');
        if (!cont) return;
        const favs = leer().map(info).filter(Boolean);
        const abiertos = window.juegosAbiertosEn ? window.juegosAbiertosEn() : {};
        const ultimos = Object.entries(abiertos).sort((a, b) => b[1] - a[1]).map(([id, ts]) => [info(id), ts]).filter(([j]) => j).slice(0, 8);
        let h = `<div class="filtros-rapidos deslizable">${ORDEN_FILTROS.map(k => `<button class="${filtro === k ? 'activa' : ''}" onclick="filtroRapidoJuegos('${k}')">${window.ETIQUETAS_JUEGO[k].t}</button>`).join('')}</div>`;
        if (filtro) {
            const lista = window.juegosConEtiqueta(filtro).filter(j => info(j.id)).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
            if (filtro === 'vivo' && typeof window.armarTorneoEnVivo === 'function') h += `<button class="btn-secundario btn-torneo-vivo" onclick="armarTorneoEnVivo()">🏆 Armar un torneo en vivo (5 juegos, podio y premio)</button>`;
            const visibles = verTodos ? lista : lista.slice(0, MAX_CHIPS);
            h += `<div class="fila-chips envolver">${visibles.map(chip).join('') || '<span class="texto-tenue">Nada por acá.</span>'}${lista.length > visibles.length ? `<button class="chip-juego ver-mas" onclick="verTodosFiltroJuegos()">Ver los ${lista.length} ▾</button>` : ''}</div>`;
        }
        // Seguir jugando: lo último que abrieron, en tarjetitas que se deslizan
        if (ultimos.length) h += `<div class="separador-seccion">🕘 Seguir jugando</div><div class="fila-seguir">${ultimos.map(([j, ts]) => tarjetita(j, ts)).join('')}</div>`;
        if (favs.length) h += `<div class="separador-seccion">⭐ Favoritos</div><div class="fila-chips">${favs.map(chip).join('')}</div>`;
        cont.innerHTML = h;
    }
    // Cara a cara: quién ganó más veces este juego (ranking.porJuego).
    function htmlCaraACara(juego){
        const r = ranking && ranking.porJuego && ranking.porJuego[juego];
        if (!r || !((r.nico || 0) + (r.carito || 0))) return '';
        const n = r.nico || 0, c = r.carito || 0;
        const nom = (q) => typeof nombreJugador === 'function' ? nombreJugador(q) : q;
        const lider = n === c ? '¡Van parejos!' : `Va ganando ${nom(n > c ? 'nico' : 'carito')}`;
        return `<div class="cara-a-cara"><div>🆚 Cara a cara</div><b>${nom('nico')} ${n} — ${c} ${nom('carito')}</b><small>${lider}</small>
            <div class="barra-cara"><i style="width:${Math.round(n * 100 / (n + c))}%"></i></div></div>`;
    }
    function escucharRanking(){
        if (!window.db || !window.onSnapshot) return false;
        const orig = window._onSnapshotSinCompu || window.onSnapshot;
        orig(window.doc(window.db, 'juegos', 'ranking'), (s) => { ranking = s.exists() ? s.data() : null; }, () => {});
        return true;
    }
    function arrancar(){
        ponerEstrellas(); render();
        if (!escucharRanking()) { let n = 0; const t = setInterval(() => { if (escucharRanking() || ++n > 60) clearInterval(t); }, 500); }
        // Al volver al menú se actualizan los "últimos" (antes se revisaba cada 4 s).
        document.addEventListener('juego-cerrado', () => setTimeout(render, 30));
    }

    window.filtroRapidoJuegos = (k) => { filtro = filtro === k ? null : k; verTodos = false; if (window.sfx) window.sfx.click(); render(); };
    window.verTodosFiltroJuegos = () => { verTodos = true; render(); };
    window.alternarFavoritoJuego = alternar;
    window.caraACaraJuego = htmlCaraACara;
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', arrancar);
    else arrancar();
})();
