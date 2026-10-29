// ============================================================
// favoritos.js — para encontrar rápido a qué jugar entre tantos juegos.
//  - ⭐ en el encabezado de cada juego para marcarlo como favorito (se
//    guarda en este celu). En el menú: "⭐ Favoritos" y "🕘 Últimos".
//  - Filtros rápidos en el menú: ⚡ En vivo · 🎲 Por turnos · 🤝 En equipo
//    · ⏱️ Cortitos · 💬 Para charlar.
//  - En la hoja ❓ de cada juego: el cara a cara (quién ganó más veces).
// ============================================================
(function () {
    const CLAVE = 'juegosFavoritos';
    const EN_VIVO = ['aventura', 'fuegoagua', 'autitos', 'voley', 'snake2', 'pongcoop', 'tanques', 'pescavivo', 'obstaculos', 'hockey', 'motos', 'bombitas', 'cocina', 'cifras', 'sopa', 'tabu', 'reflejos', 'tuttifrutti', 'palabras', 'dibujayadivina', 'mente', 'rosco', 'palabradia'];
    const EQUIPO = ['aventura', 'laberinto', 'cocina', 'faros', 'mente', 'codigo', 'onda', 'emojipelis', 'tabu', 'historia', 'exquisito', 'pesca', 'escaperoom', 'sudoku'];
    const CORTOS = ['obstaculos', 'fosforos', 'chancho', 'tateti', 'ppt', 'reflejos', 'calculo', 'trivia', 'sopa', 'palabradia', 'cifras', 'hockey', 'motos', 'mastermind'];
    const FILTROS = {
        vivo: { t: '⚡ En vivo', ids: () => [...EN_VIVO, ...(typeof JUEGOS_QUE_USAN_ARCADE_COMUN !== 'undefined' ? JUEGOS_QUE_USAN_ARCADE_COMUN : [])] },
        turnos: { t: '🎲 Por turnos', ids: () => (window.JUEGOS || []).filter(j => j.categoria === 'clasicos').map(j => j.id) },
        equipo: { t: '🤝 En equipo', ids: () => [...EQUIPO, ...(window.JUEGOS || []).filter(j => j.categoria === 'cooperativosvivo').map(j => j.id)] },
        cortos: { t: '⏱️ Cortitos', ids: () => [...CORTOS, ...Object.entries(typeof MINUTOS_CITA !== 'undefined' ? MINUTOS_CITA : {}).filter(([, m]) => m <= 5).map(([id]) => id)] },
        charla: { t: '💬 Para charlar', ids: () => (window.JUEGOS || []).filter(j => j.categoria === 'reflexion' || j.categoria === 'conexion').map(j => j.id) },
    };
    let filtro = null, ranking = null;

    const leer = () => { try { return JSON.parse(localStorage.getItem(CLAVE) || '[]'); } catch (e) { return []; } };
    const guardar = (l) => { try { localStorage.setItem(CLAVE, JSON.stringify(l)); } catch (e) { /* nada */ } };
    const info = (id) => (window.JUEGOS || []).find(j => j.id === id && j.disponible && document.getElementById('pantalla-' + id));
    const chip = (j) => `<button class="chip-juego" onclick="abrirJuego('${j.id}')"><span>${j.icono}</span>${j.nombre}</button>`;

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
        let abiertos = {};
        try { abiertos = JSON.parse(localStorage.getItem('juegosAbiertosEn') || '{}'); } catch (e) { /* nada */ }
        const ultimos = Object.entries(abiertos).sort((a, b) => b[1] - a[1]).map(([id]) => info(id)).filter(j => j && !favs.includes(j)).slice(0, 6);
        let h = '';
        if (favs.length) h += `<div class="separador-seccion">⭐ Favoritos</div><div class="fila-chips">${favs.map(chip).join('')}</div>`;
        if (ultimos.length) h += `<div class="separador-seccion">🕘 Últimos que abriste</div><div class="fila-chips">${ultimos.map(chip).join('')}</div>`;
        h += `<div class="filtros-rapidos">${Object.entries(FILTROS).map(([k, f]) => `<button class="${filtro === k ? 'activa' : ''}" onclick="filtroRapidoJuegos('${k}')">${f.t}</button>`).join('')}</div>`;
        if (filtro) {
            const ids = [...new Set(FILTROS[filtro].ids())];
            const lista = ids.map(info).filter(Boolean).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
            h += `<div class="fila-chips envolver">${lista.map(chip).join('') || '<span class="texto-tenue">Nada por acá.</span>'}</div>`;
        }
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
        // Al volver al menú se actualizan los "últimos".
        setInterval(() => { if (document.getElementById('pantalla-menu')?.classList.contains('activa')) render(); }, 4000);
    }

    window.filtroRapidoJuegos = (k) => { filtro = filtro === k ? null : k; if (window.sfx) window.sfx.click(); render(); };
    window.alternarFavoritoJuego = alternar;
    window.caraACaraJuego = htmlCaraACara;
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', arrancar);
    else arrancar();
})();
