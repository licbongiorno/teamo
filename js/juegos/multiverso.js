// ==================== MULTIVERSO ARCADE ====================
// Minijuegos espaciales cooperativos para dos en LA MISMA pantalla
// (mismo celu o compu). Cuatro modos con físicas distintas, power-ups que
// mejoran a las dos naves, Bomba Nova de a dos, ranking de parejas en
// Firestore y música ambiente que se pone tensa en combate.
//
// Arquitectura (cada pieza en su archivo, en js/juegos/multiverso/):
//   mv-audio.js    AudioManager (Web Audio: efectos y música generativa)
//   mv-entrada.js  teclado de dos jugadores + multitouch por zonas
//   mv-fondo.js    espacio en parallax, nebulosas y agujero negro
//   mv-ranking.js  Tabla de Clasificación de Parejas (Firestore)
//   mv-naves.js    naves, disparos, power-ups y sinergia
//   mv-modos.js    Invasión, Supervivencia Orbital, Carrera Nebulosa y Exoplaneta
//   este archivo   máquina de estados (menú → jugando ⇄ pausa → fin) y
//                  el único requestAnimationFrame del juego.
// Efectos (partículas, temblor, destellos) con js/fx-vivo.js.
(function () {
    const ALTO_MUNDO = 540;
    const MV = {
        canvas: null, ctx: null, entrada: null, fondo: null, fx: null, loop: null, ultimoTs: 0,
        estado: null, nombreEstado: null, datos: {}, escala: 1, dpr: 1, W: 0, H: ALTO_MUNDO, ox: 0, oy: 0, cortarRanking: null, ranking: [], filtro: null,
    };

    // ---------- Tamaño: el lienzo llena el lugar disponible y el mundo se adapta ----------
    function medir() {
        const host = document.getElementById('mv-host');
        if (!host || !MV.canvas) return;
        const ancho = host.clientWidth || 360, encuadre = document.body.classList.contains('encuadre');
        const arriba = MV.canvas.getBoundingClientRect().top;
        const libre = window.innerHeight - Math.max(0, arriba + (encuadre ? 0 : window.scrollY)) - 8;
        const alto = Math.max(260, Math.min(encuadre ? libre : Math.max(libre, window.innerHeight * 0.6), ancho * 1.9));
        MV.dpr = Math.min(2, window.devicePixelRatio || 1);
        if (MV.canvas.style.height !== alto + 'px') MV.canvas.style.height = alto + 'px';
        MV.canvas.width = Math.round(ancho * MV.dpr); MV.canvas.height = Math.round(alto * MV.dpr);
        if (MV.J) {
            // Durante una partida el mundo no cambia de forma: se escala y centra.
            MV.escala = Math.min(ancho / MV.J.W, alto / MV.J.H);
            MV.ox = (ancho - MV.J.W * MV.escala) / 2; MV.oy = (alto - MV.J.H * MV.escala) / 2;
        } else {
            MV.escala = alto / ALTO_MUNDO; MV.H = ALTO_MUNDO; MV.W = Math.max(280, Math.min(1100, ancho / MV.escala)); MV.ox = (ancho - MV.W * MV.escala) / 2; MV.oy = 0;
        }
    }

    // ---------- Máquina de estados ----------
    const ESTADOS = {
        menu: {
            entrar() {
                MV.J = null; MV.modo = null; medir();
                window.MVAudio && MVAudio.musica('menu');
                panel(htmlMenu());
                escucharRanking();
            },
            actualizar() {},
            dibujar(c, t) {
                MV.fondo.dibujar(c, MV.W, MV.H, t * 8, t * 3, t / 1000);
                // Dos navecitas dando vueltas, unidas por un rayo
                const cx = MV.W / 2, cy = MV.H * 0.17, a = t / 900;
                const p = [[cx + Math.cos(a) * 40, cy + Math.sin(a) * 14], [cx - Math.cos(a) * 40, cy - Math.sin(a) * 14]];
                c.globalCompositeOperation = 'lighter'; c.strokeStyle = 'rgba(180,230,255,0.4)'; c.lineWidth = 2; c.beginPath(); c.moveTo(...p[0]); c.lineTo(...p[1]); c.stroke(); c.globalCompositeOperation = 'source-over';
                p.forEach(([x, y], j) => { c.fillStyle = MVNaves.COLORES[j].base; c.beginPath(); c.arc(x, y, 5, 0, Math.PI * 2); c.fill(); });
            },
            salir() { if (MV.cortarRanking) { MV.cortarRanking(); MV.cortarRanking = null; } },
        },
        jugando: {
            entrar(d) {
                if (!MV.J) {
                    medir();
                    MV.fx.limpiar();
                    MV.J = MVNaves.crearJuego(MV.W, MV.H, MV.fx);
                    MV.J.fondo = MV.fondo;
                    MV.modo = MVModos.crear(d.modo, MV.J);
                    MV.inicio = performance.now();
                    medir();
                }
                panel(htmlJuego());
                window.MVAudio && MVAudio.musica(MV.modo.musica);
            },
            actualizar(dt) {
                const J = MV.J;
                if (!J) return;
                const ent = [MV.entrada.leer(0), MV.entrada.leer(1)];
                MV.ultimaEntrada = ent;
                MV.modo.actualizar(dt, ent);
                if (J.fin) cambiar('fin');
            },
            dibujar(c, t) {
                const J = MV.J;
                if (!J) return;
                MV.fondo.dibujar(c, J.W, J.H, MV.modo.camX, MV.modo.camY, t / 1000);
                MV.fx.antes(c);
                MV.modo.dibujar(c);
                J.dibujarComun(c);
                MV.fx.dibujar(c);
                MV.fx.despues(c);
                J.dibujarHud(c, MV.modo.hud());
                // Cartel de arranque con los controles
                const k = (performance.now() - MV.inicio) / 3200;
                if (k < 1) {
                    c.globalAlpha = Math.min(1, (1 - k) * 2.5);
                    c.fillStyle = 'rgba(5,4,20,0.6)'; c.fillRect(0, J.H * 0.55, J.W, 62);
                    c.fillStyle = '#fff'; c.textAlign = 'center'; c.font = 'bold 15px sans-serif'; c.fillText(`${MV.modo.icono} ${MV.modo.nombre}`, J.W / 2, J.H * 0.55 + 20);
                    c.font = '9px sans-serif'; c.fillStyle = '#c8d8ff';
                    const lineas = MV.entrada.zonas().tactil ? ['Cada uno en su mitad: arrastrá para mover', 'otro dedo o un toque dispara · doble toque = dash · ★ juntos = Nova'] : ['J1: W A S D + Espacio (Q Nova, E dash)', 'J2: flechas + Enter (Shift der. Nova, Ctrl der. dash)'];
                    lineas.forEach((l, i) => c.fillText(l, J.W / 2, J.H * 0.55 + 36 + i * 12));
                    c.globalAlpha = 1; c.textAlign = 'left';
                }
            },
            salir() {},
        },
        pausa: {
            entrar() { panel(htmlPausa()); window.MVAudio && MVAudio.musica('menu'); },
            actualizar() {},
            dibujar(c, t) { ESTADOS.jugando.dibujar(c, t); c.fillStyle = 'rgba(5,4,20,0.55)'; c.fillRect(0, 0, MV.J.W, MV.J.H); },
            salir() {},
        },
        fin: {
            entrar() {
                window.MVAudio && (MVAudio.musica('exploracion'), MVAudio.sfx('explosion', { tam: 1 }));
                const J = MV.J;
                MV.resultado = { modo: MV.modo.id, j1: J.naves[0].puntos, j2: J.naves[1].puntos, puntos: J.puntosPareja(), nivel: J.nivel, guardado: false };
                panel(htmlFin());
                escucharRanking(MV.modo.id);
                setTimeout(() => { const i = document.getElementById('mv-equipo'); if (i && !('ontouchstart' in window)) i.focus(); }, 300);
            },
            actualizar(dt) { /* el espacio sigue moviéndose de fondo */ MV.modo.camY -= 0.3 * dt; },
            dibujar(c, t) { const J = MV.J; MV.fondo.dibujar(c, J.W, J.H, MV.modo.camX, MV.modo.camY, t / 1000); MV.fx.antes(c); MV.fx.dibujar(c); MV.fx.despues(c); },
            salir() { if (MV.cortarRanking) { MV.cortarRanking(); MV.cortarRanking = null; } },
        },
    };
    function cambiar(nombre, datos = {}) {
        if (MV.estado && MV.estado.salir) MV.estado.salir();
        MV.nombreEstado = nombre; MV.estado = ESTADOS[nombre];
        MV.estado.entrar(datos);
    }

    // ---------- Bucle único ----------
    function bucle(ts) {
        const pantalla = document.getElementById('pantalla-multiverso');
        if (!pantalla || !pantalla.classList.contains('activa')) { parar(); return; }
        const dt = Math.min(2.5, (ts - (MV.ultimoTs || ts)) / 16.67 || 1);
        MV.ultimoTs = ts;
        const c = MV.ctx;
        // Si entró o salió del encuadre, el lugar disponible cambió.
        const enc = document.body.classList.contains('encuadre');
        if (enc !== MV.encAnt) { MV.encAnt = enc; setTimeout(medir, 30); setTimeout(medir, 300); }
        // El próximo cuadro se pide antes, así un error suelto nunca frena el juego.
        MV.loop = requestAnimationFrame(bucle);
        try {
            MV.estado.actualizar(dt);
            c.setTransform(1, 0, 0, 1, 0, 0);
            c.fillStyle = '#05030f'; c.fillRect(0, 0, MV.canvas.width, MV.canvas.height);
            c.setTransform(MV.escala * MV.dpr, 0, 0, MV.escala * MV.dpr, MV.ox * MV.dpr, MV.oy * MV.dpr);
            c.save(); c.beginPath(); c.rect(0, 0, MV.J ? MV.J.W : MV.W, MV.J ? MV.J.H : MV.H); c.clip();
            MV.estado.dibujar(c, ts);
            c.restore();
            if (MV.nombreEstado === 'jugando') dibujarControlesTactiles(c);
        } catch (err) {
            if (!MV.errorAvisado) { MV.errorAvisado = true; console.error('multiverso:', err); }
            try { c.restore(); } catch (e) { /* nada */ }
        }
    }
    function parar() {
        if (MV.loop) cancelAnimationFrame(MV.loop);
        MV.loop = null;
        window.MVAudio && MVAudio.musica(null);
        if (MV.cortarRanking) { MV.cortarRanking(); MV.cortarRanking = null; }
        if (MV.entrada) MV.entrada.limpiar();
    }
    // Joysticks y botones ★ dibujados donde están los dedos (en píxeles de pantalla).
    function dibujarControlesTactiles(c) {
        const z = MV.entrada.zonas();
        if (!z.tactil) return;
        c.setTransform(MV.dpr, 0, 0, MV.dpr, 0, 0);
        c.strokeStyle = 'rgba(255,255,255,0.08)'; c.setLineDash([4, 8]); c.beginPath();
        if (z.acostado) { c.moveTo(z.w / 2, 30); c.lineTo(z.w / 2, z.h - 10); } else { c.moveTo(10, z.h / 2); c.lineTo(z.w - 10, z.h / 2); }
        c.stroke(); c.setLineDash([]);
        for (const j of z.joys) {
            const col = MVNaves.COLORES[j.j].base, rad = Math.max(34, Math.min(z.w, z.h) * 0.09);
            c.strokeStyle = col + '88'; c.lineWidth = 2; c.beginPath(); c.arc(j.x0, j.y0, rad, 0, Math.PI * 2); c.stroke();
            const dx = j.x - j.x0, dy = j.y - j.y0, m = Math.hypot(dx, dy), f = m > rad ? rad / m : 1;
            c.fillStyle = col + 'aa'; c.beginPath(); c.arc(j.x0 + dx * f, j.y0 + dy * f, rad * 0.42, 0, Math.PI * 2); c.fill();
        }
        const nova = MV.J ? MV.J.sin.nova : 0;
        z.botones.forEach((b, j) => {
            const col = MVNaves.COLORES[j].base;
            c.fillStyle = z.especial[j] ? col + '99' : 'rgba(255,255,255,0.08)'; c.beginPath(); c.arc(b.x, b.y, b.r, 0, Math.PI * 2); c.fill();
            c.strokeStyle = nova >= 1 ? '#ffd23a' : col + '88'; c.lineWidth = 3; c.beginPath(); c.arc(b.x, b.y, b.r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * nova); c.stroke();
            c.fillStyle = '#fff'; c.font = `bold ${Math.round(b.r * 0.8)}px sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('★', b.x, b.y + 1);
        });
        c.textAlign = 'left'; c.textBaseline = 'alphabetic';
    }

    // ---------- Paneles HTML de cada estado ----------
    function panel(html) { const p = document.getElementById('mv-panel'); if (p) { p.innerHTML = html; p.style.display = html ? '' : 'none'; } }
    const esc = (t) => String(t).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
    function htmlRanking() {
        const filas = MV.ranking;
        const tabs = [['', 'Todos'], ...MVModos.LISTA.map(id => [id, MVModos.INFO[id].icono])].map(([id, txt]) => `<button class="mv-tab ${(MV.filtro || '') === id ? 'activo' : ''}" onclick="MVJuego.filtrar('${id}')">${txt}</button>`).join('');
        const cuerpo = filas == null ? '<div class="texto-tenue">No se pudo leer el ranking.</div>' : !filas.length ? '<div class="texto-tenue">Todavía no hay récords. ¡Sean los primeros!</div>'
            : `<ol class="mv-ranking">${filas.map((r, i) => `<li class="${MV.resultado && MV.resultado.id === r.id ? 'mio' : ''}"><span class="pos">${['🥇', '🥈', '🥉'][i] || (i + 1)}</span><span class="eq">${esc(r.equipo)}</span><span class="md">${(MVModos.INFO[r.modo] || {}).icono || ''}</span><b>${r.puntos.toLocaleString('es-AR')}</b></li>`).join('')}</ol>`;
        return `<div class="mv-tabs">${tabs}</div>${cuerpo}`;
    }
    function htmlMenu() {
        return `<div class="mv-menu">
            <div class="mv-titulo">🌌 Multiverso Arcade</div>
            <div class="texto-tenue mv-sub">Para jugar de a dos en la misma pantalla. Todo lo que junta uno, ayuda a los dos.</div>
            <div class="mv-modos">${MVModos.LISTA.map(id => { const m = MVModos.INFO[id]; return `<button class="mv-modo" onclick="MVJuego.jugar('${id}')"><span class="ic">${m.icono}</span><b>${m.nombre}</b><small>${m.desc}</small></button>`; }).join('')}</div>
            <details class="mv-ayuda"><summary>🎮 Controles y power-ups</summary>
                <p><b>Teclado:</b> J1 W A S D + Espacio (Q Nova, E dash) · J2 flechas + Enter (Shift der. Nova, Ctrl der. o / dash).</p>
                <p><b>Celu:</b> cada uno en su mitad (acostado: izquierda y derecha). Arrastrá para mover, otro dedo o un toque para disparar, doble toque para el dash y ★ para la Nova.</p>
                <p><b>Power-ups compartidos:</b> II Láseres Gemelos · » Hiperfuego · ⬡ Escudo Vinculado (absorbe un golpe a cualquiera) · ✦ carga Nova · + Rescate. La <b>Bomba Nova</b> limpia la pantalla si los dos tocan ★ a la vez.</p>
            </details>
            <div class="mv-sub2">🏆 Tabla de Clasificación de Parejas</div>
            <div id="mv-tabla">${htmlRanking()}</div>
        </div>`;
    }
    function htmlJuego() { return ''; }
    function htmlPausa() {
        return `<div class="mv-menu mv-centro"><div class="mv-titulo">⏸ Pausa</div>
            <button class="btn-principal" onclick="MVJuego.seguir()">▶ Seguir</button>
            <button class="btn-secundario" onclick="MVJuego.terminar()">🏁 Terminar y guardar</button>
            <button class="btn-secundario" onclick="MVJuego.menu()">↩ Volver al menú</button></div>`;
    }
    function htmlFin() {
        const r = MV.resultado, guardado = localStorage.getItem('mvEquipo') || `${typeof nombreJugador === 'function' ? nombreJugador('nico') : 'Nico'} & ${typeof nombreJugador === 'function' ? nombreJugador('carito') : 'Carito'}`;
        return `<div class="mv-menu mv-centro">
            <div class="mv-titulo">${MV.J.vivas().length ? '🏁 ¡Fin de la misión!' : '💥 Misión terminada'}</div>
            <div class="mv-puntos"><span style="color:${MVNaves.COLORES[0].base}">J1 ${r.j1.toLocaleString('es-AR')}</span> + <span style="color:${MVNaves.COLORES[1].base}">J2 ${r.j2.toLocaleString('es-AR')}</span></div>
            <div class="mv-total">Puntaje de Pareja<br><b>${r.puntos.toLocaleString('es-AR')}</b></div>
            <div id="mv-guardar">${r.guardado ? '<div class="texto-tenue">✅ ¡Guardado!</div>' : `<input id="mv-equipo" maxlength="24" value="${esc(guardado)}" placeholder="Nombre del equipo" onkeydown="if(event.key==='Enter') MVJuego.guardar()"><button class="btn-principal" onclick="MVJuego.guardar()">💾 Guardar récord</button>`}</div>
            <div class="mv-sub2">🏆 Top 10 · ${MVModos.INFO[r.modo].nombre}</div>
            <div id="mv-tabla">${htmlRanking()}</div>
            <div class="mv-botones"><button class="btn-principal" onclick="MVJuego.jugar('${r.modo}')">🔁 Otra vez</button><button class="btn-secundario" onclick="MVJuego.menu()">↩ Menú</button></div>
        </div>`;
    }
    function escucharRanking(modo) {
        if (MV.cortarRanking) MV.cortarRanking();
        MV.filtro = modo || MV.filtro || null;
        MV.cortarRanking = MVRanking.escuchar((filas) => { MV.ranking = filas; const t = document.getElementById('mv-tabla'); if (t) t.innerHTML = htmlRanking(); }, MV.filtro);
    }

    // ---------- Acciones de los botones ----------
    window.MVJuego = {
        jugar(modo) {
            window.MVAudio && (MVAudio.iniciar(), MVAudio.sfx('click'));
            // En celus y tablets chicas la partida arranca en pantalla completa (se sale con ✕ Salir del encuadre).
            const tactil = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
            if (tactil && Math.min(window.innerWidth, window.innerHeight) < 700 && window.VivoComun && !document.body.classList.contains('encuadre')) VivoComun.encuadrar(true, false);
            const arrancar = () => { MV.J = null; cambiar('jugando', { modo }); };
            if (tactil) setTimeout(arrancar, 120); else arrancar();
        },
        pausar() { if (MV.nombreEstado === 'jugando') cambiar('pausa'); else if (MV.nombreEstado === 'pausa') cambiar('jugando'); },
        seguir() { cambiar('jugando'); },
        terminar() { if (MV.J) { MV.J.fin = true; cambiar('fin'); } },
        menu() { cambiar('menu'); },
        filtrar(id) { MV.filtro = id || null; escucharRanking(id || null); },
        async guardar() {
            const i = document.getElementById('mv-equipo'), r = MV.resultado;
            if (!i || !r || r.guardado) return;
            const equipo = i.value.trim() || 'Pareja sin nombre';
            try { localStorage.setItem('mvEquipo', equipo); } catch (e) { /* nada */ }
            const caja = document.getElementById('mv-guardar'); if (caja) caja.innerHTML = '<div class="texto-tenue">Guardando…</div>';
            try {
                const ref = await MVRanking.guardar({ equipo, puntos: r.puntos, modo: r.modo, j1: r.j1, j2: r.j2, nivel: r.nivel });
                r.guardado = true; r.id = ref && ref.id;
                if (caja) caja.innerHTML = '<div class="texto-tenue">✅ ¡Récord guardado!</div>';
                window.MVAudio && MVAudio.sfx('sinergia');
                if (window.fx && window.fx.confeti) window.fx.confeti();
                const t = document.getElementById('mv-tabla'); if (t) t.innerHTML = htmlRanking();
            } catch (e) { console.warn(e); if (caja) caja.innerHTML = '<div class="texto-tenue">⚠️ No se pudo guardar. Probá de nuevo.</div><button class="btn-principal" onclick="MVJuego.reintentar()">Reintentar</button>'; }
        },
        reintentar() { const caja = document.getElementById('mv-guardar'); if (caja) caja.innerHTML = `<input id="mv-equipo" maxlength="24" value="${esc(localStorage.getItem('mvEquipo') || '')}"><button class="btn-principal" onclick="MVJuego.guardar()">💾 Guardar récord</button>`; },
        _estado: () => MV, // para pruebas
    };

    function iniciarMultiverso() {
        const cont = document.getElementById('contenido-multiverso');
        if (!cont) return;
        if (!MV.canvas) {
            MV.canvas = document.createElement('canvas');
            MV.canvas.id = 'lienzo-multiverso';
            MV.canvas.className = 'lienzo-multiverso';
            MV.ctx = MV.canvas.getContext('2d');
            MV.fondo = MVFondo.crear(Math.floor(Math.random() * 1e6));
            MV.fx = FxVivo.crear({ max: 420 });
            MV.entrada = MVEntrada.crear(MV.canvas, { activo: () => MV.nombreEstado === 'jugando' || MV.nombreEstado === 'pausa', alPrimerGesto: () => window.MVAudio && MVAudio.iniciar() });
            window.addEventListener('resize', () => setTimeout(medir, 80));
            // Teclas de pausa (Esc o P) y pausa automática si se va de la pantalla
            window.addEventListener('keydown', (ev) => { if ((ev.code === 'Escape' || ev.code === 'KeyP') && document.getElementById('pantalla-multiverso')?.classList.contains('activa') && (MV.nombreEstado === 'jugando' || MV.nombreEstado === 'pausa')) { ev.preventDefault(); MVJuego.pausar(); } });
            document.addEventListener('visibilitychange', () => { if (document.hidden && MV.nombreEstado === 'jugando') cambiar('pausa'); });
            // Cualquier toque o tecla en la pantalla habilita el audio (lo pide el navegador)
            document.addEventListener('pointerdown', () => window.MVAudio && MVAudio.iniciar(), { passive: true });
        }
        cont.innerHTML = `<div id="mv-host" class="mv-host"><div class="mv-barra"><button type="button" class="mv-btn" onclick="MVJuego.pausar()" title="Pausa (Esc)">⏸</button></div><div id="mv-panel" class="mv-panel"></div></div>`;
        const host = cont.querySelector('#mv-host');
        host.insertBefore(MV.canvas, host.querySelector('#mv-panel'));
        // Encuadre (js/vivo-comun.js): ⛶ deja el juego fijo en toda la pantalla. El tamaño
        // del lienzo lo calcula medir() (por eso el área de ajuste no existe).
        if (window.VivoComun) VivoComun.montar('multiverso', null, cont, { fase: 'menu' }, { area: '#mv-sin-ajuste' });
        medir();
        cambiar('menu');
        if (!MV.loop) { MV.ultimoTs = 0; MV.loop = requestAnimationFrame(bucle); }
        window._unsubLoopMultiverso = parar;
        setTimeout(medir, 50);
    }
    window.INICIAR_JUEGO = window.INICIAR_JUEGO || {};
    window.INICIAR_JUEGO.multiverso = iniciarMultiverso;
    window._multiverso = MV; // para pruebas
})();
