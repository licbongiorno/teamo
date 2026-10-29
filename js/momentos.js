// ============================================================
// momentos.js — Álbum de momentos épicos.
// Cuando pasa algo para recordar (una hazaña, un campeonato, una apuesta
// ganada, una misión cooperativa cumplida, un "¡en el blanco!", un sueño
// cumplido, un nivel nuevo de pareja…) se guarda una tarjetita en
// juegos/momentos. Se ven en una línea de tiempo (juego "momentos" y
// Punto de Encuentro) y cada una se puede compartir como imagen.
// Doc: { lista: [{id, icono, titulo, sub, juego, quien, fecha}] }
// ============================================================
(function () {
    const MAX = 150;
    const ref = () => window.doc(window.db, 'juegos', 'momentos');
    const esc = (t) => String(t == null ? '' : t).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
    const enCompu = () => typeof window.modoCompu === 'function' && !!window.modoCompu();
    const info = (id) => (window.JUEGOS || []).find(j => j.id === id);
    let lista = [], escuchando = false;

    // Guarda un momento (no se repite si ya hay uno con el mismo id).
    async function guardar(m) {
        if (!m || enCompu() || !window.db || !window.runTransaction) return;
        const id = String(m.id || `${m.juego || 'm'}-${Date.now().toString(36)}`).slice(0, 80);
        const nuevo = { id, icono: m.icono || '✨', titulo: String(m.titulo || '').slice(0, 90), sub: String(m.sub || '').slice(0, 160), juego: m.juego || null, quien: m.quien || null, fecha: Date.now() };
        try {
            await window.runTransaction(window.db, async (tx) => {
                const s = await tx.get(ref());
                const l = s.exists() ? (s.data().lista || []) : [];
                if (l.some(x => x.id === id)) return;
                tx.set(ref(), { lista: [...l, nuevo].slice(-MAX) });
            });
        } catch (e) { console.warn('No se pudo guardar el momento:', e); }
    }

    function escuchar(cb) {
        if (!window.db || !window.onSnapshot) return null;
        const orig = window._onSnapshotSinCompu || window.onSnapshot;
        return orig(ref(), (snap) => { lista = snap.exists() ? (snap.data().lista || []) : []; cb(lista); }, () => cb(lista));
    }
    function fechaLarga(ts) { return new Date(ts).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' }); }
    function tarjeta(m) {
        const j = m.juego && info(m.juego);
        return `<div class="momento-tarjeta" data-aj-id="mom-${esc(m.id)}">
            <div class="momento-icono">${esc(m.icono)}</div>
            <div class="momento-texto"><b>${esc(m.titulo)}</b>${m.sub ? `<span>${esc(m.sub)}</span>` : ''}
                <small>${new Date(m.fecha).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}${j ? ` · ${j.icono} ${esc(j.nombre)}` : ''}</small></div>
            <button type="button" class="momento-compartir" title="Compartir" aria-label="Compartir" onclick="compartirMomento('${esc(m.id)}')">📤</button>
        </div>`;
    }
    // Para Punto de Encuentro: los últimos momentos.
    function htmlUltimos(n) {
        const l = [...lista].sort((a, b) => b.fecha - a.fecha).slice(0, n || 4);
        if (!l.length) return '';
        return `<div class="panel"><div class="texto-tenue" style="margin-bottom:8px;">📸 Últimos momentos épicos</div>${l.map(tarjeta).join('')}
            <button class="btn-secundario" style="margin-top:8px;" onclick="abrirJuego('momentos')">Ver el álbum completo</button></div>`;
    }

    // ---------- Pantalla del álbum ----------
    function iniciarAlbum() {
        const cont = document.getElementById('contenido-momentos');
        cont.innerHTML = `<div class="panel texto-centro texto-tenue">Cargando…</div>`;
        if (window._unsubMomentos) window._unsubMomentos();
        window._unsubMomentos = escuchar(renderAlbum);
    }
    function renderAlbum() {
        const cont = document.getElementById('contenido-momentos');
        if (!cont) return;
        const l = [...lista].sort((a, b) => b.fecha - a.fecha);
        if (!l.length) {
            cont.innerHTML = `<div class="panel texto-centro"><div style="font-size:2.4rem;">📸</div>
                <p class="texto-tenue">Todavía no hay momentos épicos. Se guardan solos cuando pasa algo para recordar: una hazaña, un campeonato, una apuesta ganada, una misión cumplida juntos…</p></div>`;
            return;
        }
        let h = `<div class="panel texto-centro"><b>${l.length}</b> momento${l.length === 1 ? '' : 's'} para recordar 💞</div>`;
        let mesPrevio = '';
        l.forEach(m => {
            const mes = new Date(m.fecha).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
            if (mes !== mesPrevio) { h += `<div class="separador-seccion">${mes}</div>`; mesPrevio = mes; }
            h += tarjeta(m);
        });
        cont.innerHTML = h;
    }

    // ---------- Compartir como imagen ----------
    function imagen(m) {
        const cv = document.createElement('canvas');
        cv.width = 800; cv.height = 800;
        const g = cv.getContext('2d');
        const grad = g.createLinearGradient(0, 0, 800, 800);
        grad.addColorStop(0, '#2e2140'); grad.addColorStop(1, '#120c18');
        g.fillStyle = grad; g.fillRect(0, 0, 800, 800);
        g.strokeStyle = 'rgba(255,179,198,0.4)'; g.lineWidth = 3; g.strokeRect(28, 28, 744, 744);
        g.textAlign = 'center'; g.textBaseline = 'middle';
        g.font = '150px serif'; g.fillText(m.icono || '✨', 400, 230);
        g.fillStyle = '#fdf6f0'; g.font = 'bold 46px Georgia, serif';
        const lineas = (texto, y, ancho, alto) => {
            const palabras = String(texto).split(' '); let linea = '', yy = y;
            palabras.forEach(p => { const prueba = linea + p + ' '; if (g.measureText(prueba).width > ancho && linea) { g.fillText(linea.trim(), 400, yy); linea = p + ' '; yy += alto; } else linea = prueba; });
            g.fillText(linea.trim(), 400, yy); return yy;
        };
        let y = lineas(m.titulo, 400, 640, 56);
        if (m.sub) { g.font = '30px sans-serif'; g.fillStyle = 'rgba(253,246,240,0.85)'; lineas(m.sub, y + 70, 620, 40); }
        const j = m.juego && info(m.juego);
        g.font = '26px sans-serif'; g.fillStyle = 'rgba(253,246,240,0.6)';
        g.fillText(`${j ? j.nombre + ' · ' : ''}${fechaLarga(m.fecha)}`, 400, 700);
        g.fillText('Nico 💙 Carito 💖', 400, 740);
        return cv;
    }
    async function compartir(id) {
        const m = lista.find(x => x.id === id);
        if (!m) return;
        if (typeof vibrarJ === 'function') vibrarJ(10);
        const cv = imagen(m);
        const texto = `${m.icono} ${m.titulo}${m.sub ? ' — ' + m.sub : ''}`;
        try {
            const blob = await new Promise(r => cv.toBlob(r, 'image/png'));
            const archivo = new File([blob], 'momento.png', { type: 'image/png' });
            if (navigator.canShare && navigator.canShare({ files: [archivo] })) { await navigator.share({ files: [archivo], text: texto }); return; }
        } catch (e) { if (e && e.name === 'AbortError') return; }
        const a = document.createElement('a');
        a.download = 'momento.png'; a.href = cv.toDataURL('image/png'); a.click();
        window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank');
    }

    function arrancar() {
        if (escuchando) return true;
        if (!window.db || !window.onSnapshot) return false;
        escuchando = true;
        escuchar(() => { if (typeof window.renderPuntoEncuentro === 'function' && document.getElementById('pantalla-puntoencuentro')?.classList.contains('activa')) window.renderPuntoEncuentro(); });
        return true;
    }
    if (!arrancar()) { let n = 0; const t = setInterval(() => { if (arrancar() || ++n > 60) clearInterval(t); }, 500); }

    window.guardarMomento = guardar;
    window.compartirMomento = compartir;
    window.momentos = { htmlUltimos, lista: () => lista, imagen };
    window.INICIAR_JUEGO = window.INICIAR_JUEGO || {};
    window.INICIAR_JUEGO.momentos = iniciarAlbum;
})();
