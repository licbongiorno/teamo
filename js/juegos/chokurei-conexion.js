// ============================================================
// chokurei-conexion.js — Chokurei como puente entre los dos, y sus
// costumbres de todos los días:
//  💌 Mensajes escondidos: uno le deja una notita y, cuando el otro
//     entra, Chokurei se la entrega con su sobrecito.
//  🎁 Regalos: algo de la tienda comprado PARA el otro, que queda
//     envuelto en la habitación hasta que lo abra.
//  🥺 Te extraño: si uno no entra hace 2 días, Chokurei mira por la
//     ventana esperándolo. Y cuando vuelve, la bienvenida es enorme.
//  ☀️ Horarios: a la mañana pide el desayuno; a la tarde duerme la
//     siesta al sol.
//  🎵 Música: baila con su cajita de música o con la que suena en el
//     reproductor del inicio (si está abierto en otra pestaña).
// ============================================================
(window.CHOKUREI_MODULOS = window.CHOKUREI_MODULOS || []).push(function (Chokurei) {
    const otro = () => (miIdentidad === 'nico' ? 'carito' : 'nico');
    const DOS_DIAS = 2 * 86400000;
    let entregando = false;

    Chokurei.on('armar', () => {
        Chokurei.agregarBoton('💌', 'Mensaje', "abrirPanelChokurei('mensajes')");
        Chokurei.agregarBoton('🎵', 'Música', 'musicaChokurei()');
        const h = Chokurei.hab();
        if (h && !h.querySelector('.ck-sol')) h.insertAdjacentHTML('afterbegin', '<div class="ck-sol"></div>');
        // Bienvenida si yo no venía hace mucho (si no, horarios).
        setTimeout(() => {
            const ck = Chokurei.ck;
            if (!ck) return;
            const ant = Chokurei.visitaAnterior;
            if (ant && ahoraSync() - ant > DOS_DIAS) {
                Chokurei.bienvenidaDada = true;
                ck.zoomies();
                ck.maullar(`¡¡VOLVISTE!! 😻 ¡Te extrañé un montón!`, 'mimoso');
                for (let i = 0; i < 10; i++) setTimeout(() => ck.particula(['💖', '💕', '😻'][i % 3], { dx: (Math.random() - 0.5) * 160, dur: 1600, tam: 1.3 }), i * 150);
                if (window.fx) window.fx.confeti();
                return;
            }
            const h = new Date().getHours(), clave = 'ckBuenDia-' + Chokurei.fechaISO(new Date());
            let yaSaludo = false; try { yaSaludo = !!localStorage.getItem(clave); localStorage.setItem(clave, '1'); } catch (e) {}
            if (h >= 6 && h < 11 && !yaSaludo) { ck.estirarse(); setTimeout(() => ck.maullar('¡Buen día! ☀️ ¿Desayunamos? 🥣', 'pidiendo'), 1500); }
        }, 4200);
        // Entregas pendientes (mensajes y regalos).
        setTimeout(revisarEntregas, 6500);
        escucharMusicaDelInicio();
    });
    Chokurei.on('actualizar', () => { if (!entregando) setTimeout(revisarEntregas, 1500); pintarRegalos(); pintarSol(); });

    // ==================== 💌 MENSAJES ESCONDIDOS ====================
    Chokurei.paneles.mensajes = () => {
        const notas = Chokurei.estado.notas || [];
        const mias = notas.filter(n => n.de === miIdentidad).slice(-6).reverse();
        const recibidas = notas.filter(n => n.para === miIdentidad && n.entregada).slice(-6).reverse();
        const fecha = (t) => new Date(t).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
        const esc = (t) => (typeof escaparHtml === 'function' ? escaparHtml(t) : String(t));
        return `<div style="text-align:center; margin-bottom:8px;"><b>💌 Dejale un mensaje a ${nombreJugador(otro())}</b></div>
            <div class="texto-tenue" style="font-size:0.72rem; margin-bottom:8px;">Chokurei lo guarda y se lo entrega cuando ${nombreJugador(otro())} entre a verlo.</div>
            <textarea id="ck-nota" class="textarea-pingpong" rows="3" maxlength="300" placeholder="Ej: dale un beso a ${nombreJugador(otro())} de mi parte 😘"></textarea>
            <button class="btn-principal" onclick="dejarNotaChokurei()">💌 Dárselo a Chokurei</button>
            ${mias.length ? `<div style="margin-top:12px; font-size:0.8rem;"><b>Tus mensajes</b>${mias.map(n => `<div class="ck-nota-fila">${n.entregada ? '✅' : '📬'} "${esc(n.texto)}" <small>${n.entregada ? 'entregado ' + fecha(n.entregadaEn || n.en) : 'esperando a ' + nombreJugador(otro())}</small></div>`).join('')}</div>` : ''}
            ${recibidas.length ? `<div style="margin-top:12px; font-size:0.8rem;"><b>Los que te trajo</b>${recibidas.map(n => `<div class="ck-nota-fila">💌 "${esc(n.texto)}" <small>de ${nombreJugador(n.de)} · ${fecha(n.en)}</small></div>`).join('')}</div>` : ''}`;
    };
    window.dejarNotaChokurei = async () => {
        const t = (document.getElementById('ck-nota')?.value || '').trim();
        if (t.length < 2) return;
        vibrarJ(12);
        await window.runTransaction(window.db, async (tx) => {
            const snap = await tx.get(Chokurei.ref());
            const notas = [...((snap.exists() ? snap.data().notas : null) || []), { id: Date.now().toString(36), de: miIdentidad, para: otro(), texto: t, en: ahoraSync(), entregada: false }].slice(-30);
            tx.set(Chokurei.ref(), { notas }, { merge: true });
        });
        const ck = Chokurei.ck;
        if (ck) { ck.particula('💌', { dy: -40, dur: 1200, tam: 1.5 }); ck.maullar(`¡Se lo doy a ${nombreJugador(otro())}! 💌`, 'mimoso'); }
        refrescarPanelChokurei();
    };

    async function revisarEntregas(){
        const ck = Chokurei.ck, e = Chokurei.estado;
        if (!ck || entregando || Chokurei.modo) return;
        const nota = (e.notas || []).find(n => n.para === miIdentidad && !n.entregada);
        if (!nota) return;
        entregando = true;
        try {
            if (ck.dormido) await ck.despertar();
            await ck.caminarA(50);
            ck.mirarAlFrente();
            ck.particula('💌', { dy: -30, dur: 1500, tam: 1.8 });
            await ck.maullar(`¡Tengo algo para vos de parte de ${nombreJugador(nota.de)}! 💌`, 'mimoso');
            await new Promise(r => setTimeout(r, 900));
            mostrarCarta(nota);
            let ok = false;
            await window.runTransaction(window.db, async (tx) => {
                ok = false;
                const snap = await tx.get(Chokurei.ref());
                const d = snap.exists() ? snap.data() : {};
                const notas = (d.notas || []).map(n => n.id === nota.id && !n.entregada ? (ok = true, { ...n, entregada: true, entregadaEn: ahoraSync() }) : n);
                if (ok) tx.set(Chokurei.ref(), { notas, contadores: { ...(d.contadores || {}), mensajes: ((d.contadores || {}).mensajes || 0) + 1 } }, { merge: true });
            });
            if (ok) Chokurei.aplicarCuidado({ carino: 10 }, `recibió un mensajito de ${nombreJugador(nota.de)} a través de Chokurei 💌`, 3);
        } finally { entregando = false; }
    }
    function mostrarCarta(nota){
        const esc = (t) => (typeof escaparHtml === 'function' ? escaparHtml(t) : String(t));
        const v = document.createElement('div');
        v.className = 'ck-visor';
        v.innerHTML = `<div class="ck-carta"><div class="sobre">💌</div><div class="de">De ${nombreJugador(nota.de)}, para vos:</div><div class="texto">${esc(nota.texto)}</div><div class="firma">— entregado por Chokurei 🐾</div></div>
            <button class="btn-principal" style="width:auto; padding:10px 22px;">💖 Gracias, Chokurei</button>`;
        v.onclick = (ev) => { if (ev.target.tagName === 'BUTTON' || ev.target === v) { v.remove(); Chokurei.ck?.alegrarse(); } };
        document.body.appendChild(v);
        if (window.fx) window.fx.confeti();
        if (window.sonidosChokurei) sonidosChokurei.brillo();
    }

    // ==================== 🎁 REGALOS ====================
    window.regalarTiendaChokurei = async (id) => {
        const item = (typeof TIENDA_CHOKUREI !== 'undefined' ? TIENDA_CHOKUREI : []).find(i => i.id === id);
        if (!item) return;
        vibrarJ(12);
        const pagado = await Chokurei.gastarPuntos(item.costo);
        if (!pagado) { if (window.sfx) window.sfx.error(); Chokurei.ck?.decir('Faltan puntitos 🥺', 1800); return; }
        if (window.sfx) window.sfx.moneda();
        await window.runTransaction(window.db, async (tx) => {
            const snap = await tx.get(Chokurei.ref());
            const regalos = [...((snap.exists() ? snap.data().regalos : null) || []), { id: Date.now().toString(36), de: miIdentidad, para: otro(), item: id, en: ahoraSync(), abierto: false }].slice(-20);
            tx.set(Chokurei.ref(), { regalos }, { merge: true });
        });
        Chokurei.ck?.maullar(`¡Lo envuelvo para ${nombreJugador(otro())}! 🎁`, 'mimoso');
        if (typeof mostrarCartelEnVivo === 'function') mostrarCartelEnVivo({ titulo: `🎁 Regalo para ${nombreJugador(otro())}`, sub: `${item.emoji} ${item.nombre}: va a estar envuelto en la habitación hasta que lo abra`, duracion: 3500 });
        refrescarPanelChokurei();
    };
    function pintarRegalos(){
        const h = Chokurei.hab();
        if (!h) return;
        const pendientes = (Chokurei.estado.regalos || []).filter(r => !r.abierto);
        h.querySelectorAll('.ck-regalo-envuelto').forEach(el => { if (!pendientes.some(r => r.id === el.dataset.id)) el.remove(); });
        pendientes.forEach((r, i) => {
            if (h.querySelector(`.ck-regalo-envuelto[data-id="${r.id}"]`)) return;
            const el = document.createElement('div');
            el.className = 'ck-regalo-envuelto'; el.dataset.id = r.id;
            el.style.left = (60 + i * 9) + '%';
            el.innerHTML = `🎁<small>${r.para === miIdentidad ? 'para vos 💝' : 'para ' + nombreJugador(r.para)}</small>`;
            el.onclick = (ev) => { ev.stopPropagation(); if (r.para === miIdentidad) abrirRegalo(r, el); else Chokurei.ck?.decir(`Es de ${nombreJugador(r.para)}, ¡no se toca! 😼`, 1600); };
            h.insertBefore(el, h.querySelector('.ck-oscuro'));
        });
    }
    async function abrirRegalo(r, el){
        const item = (typeof TIENDA_CHOKUREI !== 'undefined' ? TIENDA_CHOKUREI : []).find(i => i.id === r.item);
        vibrarJ([15, 30, 15]);
        let ok = false;
        await window.runTransaction(window.db, async (tx) => {
            ok = false;
            const snap = await tx.get(Chokurei.ref());
            const d = snap.exists() ? snap.data() : {};
            const regalos = (d.regalos || []).map(x => x.id === r.id && !x.abierto ? (ok = true, { ...x, abierto: true, abiertoEn: ahoraSync() }) : x);
            if (!ok) return;
            const cambios = { regalos, inventario: { ...(d.inventario || {}), [r.item]: true } };
            if (item && ['ropa', 'cama', 'cuadro', 'alfombra'].includes(item.tipo)) cambios.equipado = { ...(d.equipado || {}), [item.tipo]: r.item };
            tx.set(Chokurei.ref(), cambios, { merge: true });
        });
        if (!ok) return;
        el.animate([{ transform: 'translateX(-50%) scale(1)' }, { transform: 'translateX(-50%) scale(1.6) rotate(15deg)', opacity: 0 }], { duration: 500 }).finished.then(() => el.remove());
        if (window.fx) window.fx.confeti();
        if (window.sonidosChokurei) sonidosChokurei.brillo();
        Chokurei.ck?.alegrarse();
        if (item && typeof mostrarCartelEnVivo === 'function') mostrarCartelEnVivo({ titulo: `🎁 ¡${nombreJugador(r.de)} te regaló ${item.emoji} ${item.nombre}!`, sub: 'Ya está en la habitación de Chokurei', duracion: 4500 });
        if (item) Chokurei.aplicarCuidado({ diversion: 15 }, `abrió el regalo de ${nombreJugador(r.de)}: ${item.nombre.toLowerCase()} ${item.emoji}`, 5);
    }

    // ==================== 🥺 TE EXTRAÑO ====================
    // Si el otro no entra hace 2 días, Chokurei lo espera mirando por la ventana.
    Chokurei.comportamientos.push(() => {
        const v = (Chokurei.estado.visitas || {})[otro()];
        if (!v || ahoraSync() - v < DOS_DIAS || Math.random() > 0.6) return false;
        const ck = Chokurei.ck;
        const dias = Math.floor((ahoraSync() - v) / 86400000);
        ck.caminarA(24).then(() => {
            ck.animo('triste');
            ck.maullar(`¿Dónde está ${nombreJugador(otro())}? 🥺 Hace ${dias} días que no viene…`, 'triste');
            if (typeof mostrarCartelEnVivo === 'function') mostrarCartelEnVivo({ titulo: `🥺 Chokurei extraña a ${nombreJugador(otro())}`, sub: 'Mandale un mensajito de parte de él', si: '📲 Escribirle', no: 'Después', alSi: () => window.escribirDeParteDeChokurei && window.escribirDeParteDeChokurei(), duracion: 8000 });
        });
        return true;
    });

    // ==================== ☀️ SIESTA AL SOL ====================
    function pintarSol(){
        const s = Chokurei.hab()?.querySelector('.ck-sol');
        if (!s) return;
        const h = new Date().getHours();
        s.classList.toggle('visible', h >= 12 && h < 18);
    }
    Chokurei.comportamientos.push(() => {
        const h = new Date().getHours();
        if (h < 13 || h >= 17 || Math.random() > 0.35) return false;
        const ck = Chokurei.ck;
        ck.decir('Un solcito y una siesta… ☀️💤', 2000);
        ck.dormir().then(() => setTimeout(() => { if (Chokurei.ck && Chokurei.ck.dormido && !Chokurei.hab()?.classList.contains('luces-apagadas')) { Chokurei.ck.despertar().then(() => Chokurei.ck && Chokurei.ck.estirarse()); } }, 25000));
        return true;
    });

    // ==================== 🎵 MÚSICA ====================
    let bailando = false;
    window.musicaChokurei = () => {
        const ck = Chokurei.ck;
        if (!ck || bailando) return;
        vibrarJ(10);
        if (typeof window.sonidoSilenciado === 'function' && window.sonidoSilenciado()) { ck.decir('El sonido está apagado 🔇', 1800); return; }
        bailando = true;
        if (ck.dormido) ck.despertar();
        ck.decir('¡Mi canción! 🎶', 1600);
        const dur = sonidosChokurei.musica((i) => Chokurei.ck && Chokurei.ck.golpe(i));
        setTimeout(() => { bailando = false; Chokurei.ck?.alegrarse(); }, dur + 200);
        Chokurei.aplicarCuidado({ diversion: 10 }, 'le puso música a Chokurei 🎵', 2);
    };
    // Si el reproductor del inicio está sonando (otra pestaña), baila.
    function escucharMusicaDelInicio(){
        let intervalo = null, golpe = 0;
        const ponerBaile = (sonando) => {
            clearInterval(intervalo);
            if (!sonando) return;
            Chokurei.ck?.decir('¡Me encanta esta canción! 🎶', 2000);
            intervalo = setInterval(() => {
                const ck = Chokurei.ck;
                if (!ck || !document.body.contains(ck.actor)) return clearInterval(intervalo);
                if (!Chokurei.modo && !ck.ocupado && !bailando) ck.golpe(golpe++);
            }, 520);
        };
        try {
            const m = JSON.parse(localStorage.getItem('musicaRefugio') || 'null');
            if (m && m.sonando && Date.now() - m.t < 6 * 60000) ponerBaile(true);
        } catch (e) {}
        try {
            if (window._canalMusicaChokurei) window._canalMusicaChokurei.close();
            window._canalMusicaChokurei = new BroadcastChannel('refugio-musica');
            window._canalMusicaChokurei.onmessage = (ev) => ponerBaile(!!(ev.data && ev.data.sonando));
        } catch (e) { /* navegador sin BroadcastChannel */ }
        window.addEventListener('storage', (ev) => { if (ev.key === 'musicaRefugio') { try { ponerBaile(JSON.parse(ev.newValue).sonando); } catch (e) {} } });
    }
});
