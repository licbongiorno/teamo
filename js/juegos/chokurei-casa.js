// ============================================================
// chokurei-casa.js — la casa de Chokurei:
//  🏠 Ambientes: cuarto, jardín (nivel 4), cocina (nivel 6) y balcón
//     (nivel 8). Se elige arriba de la habitación y lo ven los dos.
//  🐦 Visitas: un pajarito en la ventana, un ratón que cruza o el perro
//     del vecino; Chokurei reacciona a cada uno.
//  🌱 La plantita: hay que regarla (una vez por día crece); si pasan
//     3 días sin agua se marchita. Regarla también riega el Jardín
//     Compartido (mismo cálculo que js/juegos/jardin.js).
//  ⚽ Pelota de a dos: se la pasan de un celular al otro y Chokurei
//     corre en el medio intentando atraparla.
// ============================================================
const AMBIENTES_CHOKUREI = [
    { id: 'cuarto', nombre: 'Cuarto', emoji: '🛏️', nivel: 1 },
    { id: 'jardin', nombre: 'Jardín', emoji: '🌳', nivel: 4 },
    { id: 'cocina', nombre: 'Cocina', emoji: '🍳', nivel: 6 },
    { id: 'balcon', nombre: 'Balcón', emoji: '🌆', nivel: 8 },
];
const ETAPAS_PLANTITA = [
    { desde: 0, emoji: '🌱', nombre: 'brotecito' },
    { desde: 1, emoji: '🌿', nombre: 'plantita' },
    { desde: 3, emoji: '🪴', nombre: 'planta' },
    { desde: 5, emoji: '🌷', nombre: '¡con flor!' },
    { desde: 8, emoji: '🌸', nombre: 'arbusto florido' },
];

(window.CHOKUREI_MODULOS = window.CHOKUREI_MODULOS || []).push(function (Chokurei) {
    const otro = () => (miIdentidad === 'nico' ? 'carito' : 'nico');
    const hab = () => Chokurei.hab();
    const xDe = (el) => { const h = hab().getBoundingClientRect(), r = el.getBoundingClientRect(); return (r.left + r.width / 2 - h.left) / h.width * 100; };

    Chokurei.on('armar', () => {
        const h = hab();
        h.insertAdjacentHTML('beforebegin', '<div class="ck-ambientes" id="ck-ambientes"></div>');
        Chokurei.agregarBoton('💧', 'Regar', 'regarPlantitaChokurei()');
        if (!h.querySelector('.ck-plantita')) {
            const p = document.createElement('div');
            p.className = 'ck-plantita'; p.title = 'La plantita de Chokurei';
            p.onclick = (e) => { e.stopPropagation(); regarPlantitaChokurei(); };
            h.insertBefore(p, h.querySelector('.ck-oscuro'));
        }
        if (typeof JUEGOS_CHOKUREI !== 'undefined' && !JUEGOS_CHOKUREI.some(j => j.id === 'pelota')) {
            JUEGOS_CHOKUREI.push({ id: 'pelota', nombre: 'Pelota de a dos', emoji: '⚽', desc: 'Pásensela de un celular al otro sin que Chokurei la atrape.' });
        }
        Chokurei.miniJuegos.pelota = pelotaDeADos;
        escucharVivo();
        programarVisita();
    });

    // ==================== 🏠 AMBIENTES ====================
    let ambienteAplicado = null;
    Chokurei.on('actualizar', ({ d, estado }) => {
        const amb = estado.ambiente && AMBIENTES_CHOKUREI.some(a => a.id === estado.ambiente && d.nivel >= a.nivel) ? estado.ambiente : 'cuarto';
        const barra = document.getElementById('ck-ambientes');
        if (barra) barra.innerHTML = AMBIENTES_CHOKUREI.map(a => {
            const bloq = d.nivel < a.nivel;
            return `<button class="${a.id === amb ? 'activo' : ''}" ${bloq ? 'disabled' : ''} onclick="cambiarAmbienteChokurei('${a.id}')" title="${bloq ? 'Se desbloquea en el nivel ' + a.nivel : a.nombre}">${bloq ? '🔒' : a.emoji} ${a.nombre}</button>`;
        }).join('');
        if (amb !== ambienteAplicado) aplicarAmbiente(amb);
        pintarPlantita(estado);
    });
    function aplicarAmbiente(id){
        const h = hab();
        if (!h) return;
        ambienteAplicado = id;
        h.dataset.ambiente = id;
        h.querySelectorAll('.ck-amb').forEach(x => x.remove());
        const deco = (html, estilo, clase) => { const el = document.createElement('div'); el.className = 'ck-amb ' + (clase || ''); el.innerHTML = html; if (estilo) el.setAttribute('style', estilo); h.insertBefore(el, h.firstChild); };
        if (id === 'jardin') {
            deco('', '', 'ck-cerca');
            deco('🌳', 'left:2%; bottom:30%; font-size:4.2rem;');
            deco('🌷', 'left:30%; bottom:30%; font-size:1.3rem;'); deco('🌼', 'left:50%; bottom:31%; font-size:1.1rem;'); deco('🌻', 'left:72%; bottom:30%; font-size:1.4rem;');
            deco('☁️', 'left:40%; top:8%; font-size:2rem;', 'ck-nube-libre');
        } else if (id === 'cocina') {
            deco('', '', 'ck-mesada');
            deco('<div class="puerta"></div><div class="puerta abajo"></div>', '', 'ck-heladera');
            deco('🍳', 'left:34%; bottom:47%; font-size:1.3rem;'); deco('🥛', 'left:44%; bottom:47%; font-size:1.2rem;'); deco('🐠', 'left:54%; bottom:46%; font-size:1.2rem;', 'ck-pecera');
        } else if (id === 'balcon') {
            deco('', '', 'ck-ciudad');
            deco('', '', 'ck-baranda');
            deco('🌵', 'left:3%; bottom:28%; font-size:2rem;'); deco('🌺', 'right:4%; bottom:28%; font-size:1.7rem;');
        }
        if (Chokurei.ck) Chokurei.ck.decir({ jardin: '¡Pasto! 🌿 ¡Mariposas!', cocina: '¿Hay salmón? 🍣', balcon: 'Qué linda vista 🌆', cuarto: 'Mi camita 💤' }[id], 2000);
    }
    window.cambiarAmbienteChokurei = async (id) => {
        vibrarJ(8);
        await window.setDoc(Chokurei.ref(), { ambiente: id }, { merge: true });
    };
    // Cosas que hace según dónde está.
    Chokurei.comportamientos.push(() => {
        const amb = ambienteAplicado, ck = Chokurei.ck;
        if (amb === 'jardin' && Math.random() < 0.5) { ck.caminarA(20 + Math.random() * 60, true).then(() => ck.perseguirCola()); return true; }
        if (amb === 'cocina' && Math.random() < 0.5) {
            const hel = hab().querySelector('.ck-heladera');
            if (hel) ck.caminarA(xDe(hel) - 6).then(() => { ck.mirarA('derecha'); ck.maullar('¿Hay salmón? 🍣', 'pidiendo'); });
            return true;
        }
        if (amb === 'balcon' && Math.random() < 0.5) { visitaPajarito(); return true; }
        return false;
    });

    // ==================== 🐦 VISITAS ====================
    function programarVisita(){
        clearTimeout(window._timerVisitaChokurei);
        window._timerVisitaChokurei = setTimeout(() => {
            if (!hab() || !Chokurei.ck) return;
            if (!Chokurei.modo && !Chokurei.ck.ocupado && !Chokurei.ck.dormido) [visitaPajarito, visitaRaton, visitaPerro][Math.floor(Math.random() * 3)]();
            programarVisita();
        }, 70000 + Math.random() * 110000);
    }
    function lugarVentana(){
        const v = hab().querySelector(ambienteAplicado === 'jardin' ? '.ck-cerca' : '.ck-ventana');
        if (!v || getComputedStyle(v).display === 'none') return { x: 25, y: 30 };
        const h = hab().getBoundingClientRect(), r = v.getBoundingClientRect();
        return { x: (r.left + r.width * 0.7 - h.left) / h.width * 100, y: (r.bottom - h.top) / h.height * 100 - 4 };
    }
    function visitante(emoji, desde, hasta, ms){
        const el = document.createElement('div');
        el.className = 'ck-visita'; el.textContent = emoji;
        hab().appendChild(el);
        const a = el.animate([{ left: desde.x + '%', top: desde.y + '%' }, { left: hasta.x + '%', top: hasta.y + '%' }], { duration: ms, easing: 'ease-out', fill: 'forwards' });
        return { el, llegada: a.finished.catch(() => {}) };
    }
    async function visitaPajarito(){
        const ck = Chokurei.ck, lugar = lugarVentana();
        const p = visitante('🐦', { x: -10, y: 5 }, lugar, 1600);
        await p.llegada;
        await ck.caminarA(lugar.x);
        ck.expresion('sorprendido', 2200);
        ck.maullar('¡Ek ek ek! 😼', 'mimoso');
        setTimeout(() => {
            p.el.animate([{ left: lugar.x + '%', top: lugar.y + '%' }, { left: '110%', top: '-10%' }], { duration: 1200, fill: 'forwards' }).finished.then(() => p.el.remove());
            setTimeout(() => ck && ck.saltar(30), 200);
        }, 2600);
    }
    async function visitaRaton(){
        const ck = Chokurei.ck;
        const r = visitante('🐭', { x: 105, y: 88 }, { x: -8, y: 88 }, 3200);
        r.el.style.transform = 'translate(-50%,-50%) scaleX(1)';
        let pos = 105;
        const t0 = performance.now();
        const parar = ck.seguir(() => pos);
        (function seguirRaton(t){ pos = 105 - (t - t0) / 3200 * 113; if (pos > -8 && Chokurei.ck) requestAnimationFrame(seguirRaton); })(t0);
        ck.expresion('sorprendido', 1500);
        await r.llegada;
        parar(); r.el.remove();
        if (Chokurei.ck) { ck.saltar(20); ck.decir('¡Se me escapó! 😾', 1800); }
    }
    async function visitaPerro(){
        const ck = Chokurei.ck, lugar = lugarVentana();
        const p = visitante('🐶', { x: lugar.x, y: lugar.y + 20 }, { x: lugar.x, y: lugar.y }, 700);
        p.el.classList.add('ck-perro');
        await p.llegada;
        if (window.sonidosChokurei) setTimeout(() => sonidosChokurei.salto(), 100);
        const guau = document.createElement('div'); guau.className = 'ck-particula'; guau.textContent = '¡Guau!'; guau.style.left = lugar.x + '%'; guau.style.top = (lugar.y - 12) + '%'; hab().appendChild(guau);
        setTimeout(() => guau.remove(), 1200);
        ck.expresion('enojado', 2500);
        ck.decir('¡Fshhh! 😾', 2000);
        await ck.saltar(16);
        setTimeout(() => { p.el.animate([{ top: lugar.y + '%' }, { top: (lugar.y + 25) + '%', opacity: 0 }], { duration: 600, fill: 'forwards' }).finished.then(() => p.el.remove()); setTimeout(() => ck && ck.decir('Y no vuelvas 😤', 1600), 700); }, 2200);
    }
    Chokurei.visita = (tipo) => ({ pajarito: visitaPajarito, raton: visitaRaton, perro: visitaPerro })[tipo]?.();

    // ==================== 🌱 PLANTITA ====================
    function etapaPlantita(pl){
        const dias = pl.crecimiento || 0;
        const marchita = pl.ultimoRiego && (Date.now() - new Date(pl.ultimoRiego + 'T12:00:00').getTime()) > 3.5 * 86400000;
        let e = ETAPAS_PLANTITA[0];
        for (const x of ETAPAS_PLANTITA) if (dias >= x.desde) e = x;
        return { ...e, marchita, dias };
    }
    function pintarPlantita(estado){
        const el = hab()?.querySelector('.ck-plantita');
        if (!el) return;
        const e = etapaPlantita(estado.planta || {});
        const regadaHoy = (estado.planta || {}).ultimoRiego === Chokurei.fechaISO(new Date());
        el.innerHTML = `<span class="tallo">${e.marchita ? '🥀' : e.emoji}</span><span class="maceta"></span>${regadaHoy ? '' : '<span class="gota">💧</span>'}`;
        el.title = e.marchita ? 'La plantita se está marchitando… ¡regala!' : `Plantita (${e.nombre}) · ${regadaHoy ? 'ya la regaron hoy' : 'tiene sed'}`;
    }
    window.regarPlantitaChokurei = async () => {
        const ck = Chokurei.ck, el = hab()?.querySelector('.ck-plantita');
        if (!ck || !el) return;
        vibrarJ(10);
        const hoy = Chokurei.fechaISO(new Date());
        let resultado = null;
        await window.runTransaction(window.db, async (tx) => {
            resultado = null;
            const snap = await tx.get(Chokurei.ref());
            const pl = (snap.exists() ? snap.data().planta : null) || {};
            if (pl.ultimoRiego === hoy) { resultado = 'yaRegada'; return; }
            const e = etapaPlantita(pl);
            const crecimiento = e.marchita ? Math.floor((pl.crecimiento || 0) / 2) : (pl.crecimiento || 0) + 1;
            const floreceRecien = crecimiento >= 5 && (pl.crecimiento || 0) < 5;
            tx.set(Chokurei.ref(), { planta: { crecimiento, ultimoRiego: hoy, flores: (pl.flores || 0) + (floreceRecien ? 1 : 0) } }, { merge: true });
            resultado = floreceRecien ? 'flor' : e.marchita ? 'revive' : 'crece';
        });
        // Gotitas
        for (let i = 0; i < 6; i++) setTimeout(() => { const g = document.createElement('div'); g.className = 'ck-particula'; g.textContent = '💧'; const r = el.getBoundingClientRect(), h = hab().getBoundingClientRect(); g.style.left = (r.left - h.left + r.width / 2 + (Math.random() - 0.5) * 20) + 'px'; g.style.top = (r.top - h.top - 10) + 'px'; hab().appendChild(g); g.animate([{ transform: 'translateY(0)', opacity: 1 }, { transform: 'translateY(30px)', opacity: 0 }], { duration: 600 }).finished.then(() => g.remove()); }, i * 90);
        if (resultado === 'yaRegada') { ck.decir('Ya la regaron hoy 🌱 ¡Mañana más!', 1800); return; }
        await ck.caminarA(xDe(el) + 8);
        ck.mirarA('izquierda');
        if (resultado === 'flor') {
            ck.alegrarse(); ck.decir('¡FLORECIÓ! 🌷😻', 2500);
            if (window.fx) window.fx.confeti();
        } else ck.decir(resultado === 'revive' ? 'Uf, casi se nos muere 😅' : '¡Crece! 🌱', 1800);
        regarJardinCompartido();
        await Chokurei.aplicarCuidado({ diversion: 5 }, resultado === 'flor' ? 'regó la plantita de Chokurei y ¡floreció! 🌷' : 'regó la plantita de Chokurei 🌱', 4);
    };
    // Mismo riego que el Jardín Compartido (js/juegos/jardin.js → regarJardin).
    async function regarJardinCompartido(){
        try {
            const ref = window.doc(window.db, 'juegos', 'jardin');
            await window.runTransaction(window.db, async (tx) => {
                const snap = await tx.get(ref);
                if (!snap.exists()) return;
                const e = snap.data();
                const progreso = e.formaElegida ? (e.progreso || 0) : Math.min(100, (e.progreso || 0) + 2);
                tx.update(ref, { ultimoRiego: window.serverTimestamp(), progreso });
            });
        } catch (e) { /* si el jardín no existe todavía, no pasa nada */ }
    }

    // ==================== ⚽ PELOTA DE A DOS ====================
    // Todo vive en juegos/mascota-vivo → pelota: { tiene, de, para, lanzadaEn,
    // intercepta, xIntercepta, racha, id }. Cada celular dibuja la pelota con
    // la hora sincronizada: la primera mitad del vuelo cruza la pantalla de
    // quien la tira (de izquierda a derecha) y la segunda la de quien la
    // recibe (entra por la derecha y llega a su lado, a la izquierda).
    const VUELO_MS = 2600, MITAD = VUELO_MS / 2, MARGEN_ATRAPAR_MS = 1400;
    const refVivo = () => window.doc(window.db, 'juegos', 'mascota-vivo');
    let pelota = null, enJuego = null;
    function escucharVivo(){
        if (window._unsubPelotaChokurei) window._unsubPelotaChokurei();
        window._unsubPelotaChokurei = window.onSnapshot(refVivo(), (snap) => {
            pelota = snap.exists() ? (snap.data().pelota || null) : null;
            if (enJuego) enJuego.alCambiar();
        }, () => {});
    }
    const escribirPelota = (p) => window.setDoc(refVivo(), { pelota: p }, { merge: true }).catch(() => {});

    function pelotaDeADos(){
        const enVivo = typeof estadoRivalEnVivo === 'function' ? estadoRivalEnVivo() : { juego: null };
        if (enVivo.juego !== 'mascota') {
            Chokurei.ck?.decir(`Necesito a ${nombreJugador(otro())} acá también 🥺`, 2200);
            if (typeof mostrarCartelEnVivo === 'function') mostrarCartelEnVivo({ titulo: '⚽ La pelota se juega de a dos', sub: `${nombreJugador(otro())} tiene que estar con Chokurei.`, si: 'Invitar', no: 'Después', alSi: () => typeof invitarAJugar === 'function' && invitarAJugar('mascota'), duracion: 7000 });
            return;
        }
        const m = Chokurei.modoMiniJuego('pelota', '⚽ Racha');
        m.capa.insertAdjacentHTML('beforeend', '<div class="ck-pelota">⚽</div><div class="ck-pelota-ayuda"></div><button class="ck-pelota-salir">Terminar</button>');
        const bola = m.capa.querySelector('.ck-pelota'), ayuda = m.capa.querySelector('.ck-pelota-ayuda');
        const ck = Chokurei.ck;
        let bolaX = 12, raf = null, timeoutPerdida = null, mejorRacha = 0;
        const parar = ck.seguir(() => bolaX);
        // Si nadie tiene la pelota (o es vieja), la agarro yo.
        if (!pelota || !pelota.tiene || (pelota.lanzadaEn && ahoraSync() - pelota.lanzadaEn > 15000 && !pelota.tiene)) escribirPelota({ tiene: miIdentidad, racha: 0, id: Date.now() });
        function ponerBola(x, y){ bolaX = x; bola.style.left = x + '%'; bola.style.top = (y || 82) + '%'; }
        function tirar(){
            if (!pelota || pelota.tiene !== miIdentidad) return;
            vibrarJ(12); if (window.sonidosChokurei) sonidosChokurei.salto();
            escribirPelota({ tiene: null, de: miIdentidad, para: otro(), lanzadaEn: ahoraSync() + 150, intercepta: Math.random() < 0.22, xIntercepta: 30 + Math.random() * 40, racha: pelota.racha || 0, id: Date.now() });
        }
        bola.onpointerdown = (ev) => { ev.stopPropagation(); if (pelota && pelota.tiene === miIdentidad) tirar(); else atrapar(); };
        m.capa.querySelector('.ck-pelota-salir').onclick = (ev) => { ev.stopPropagation(); terminar(); };
        function atrapar(){
            if (!pelota || pelota.para !== miIdentidad || pelota.tiene) return;
            const t = ahoraSync() - pelota.lanzadaEn;
            if (t < MITAD + 400 || t > VUELO_MS + MARGEN_ATRAPAR_MS || pelota.intercepta) return;
            clearTimeout(timeoutPerdida);
            vibrarJ(15); if (window.sonidosChokurei) sonidosChokurei.atrapar();
            const racha = (pelota.racha || 0) + 1;
            mejorRacha = Math.max(mejorRacha, racha);
            escribirPelota({ tiene: miIdentidad, racha, id: Date.now() });
        }
        function animar(){
            cancelAnimationFrame(raf);
            const p = pelota;
            if (!p) return;
            const el = document.getElementById('ck-mini-n'); if (el) el.textContent = p.racha || 0;
            mejorRacha = Math.max(mejorRacha, p.racha || 0);
            if (p.tiene) {
                const mia = p.tiene === miIdentidad;
                ponerBola(mia ? 12 : 92, 82);
                bola.style.opacity = mia ? 1 : 0.35;
                ayuda.textContent = mia ? '👆 Tocá la pelota para tirarla' : `Esperando que ${nombreJugador(otro())} la tire…`;
                return;
            }
            bola.style.opacity = 1;
            const soyLanzador = p.de === miIdentidad;
            ayuda.textContent = soyLanzador ? '¡Allá va! ⚽' : '¡Atrapala cuando llegue! 👇';
            (function cuadro(){
                const t = ahoraSync() - p.lanzadaEn;
                if (soyLanzador) {
                    if (t < 0) ponerBola(12, 82);
                    else if (t <= MITAD) { const k = t / MITAD; ponerBola(12 + k * 98, 82 - Math.sin(k * Math.PI) * 45); }
                    else { ponerBola(115, 60); return; }
                } else {
                    if (t < MITAD) { ponerBola(115, 60); }
                    else {
                        const k = Math.min(1, (t - MITAD) / MITAD);
                        const x = 110 - k * 96;
                        if (p.intercepta && x <= p.xIntercepta) { ponerBola(p.xIntercepta, 70); return; }
                        ponerBola(x, 82 - Math.sin(k * Math.PI) * 45);
                        if (k >= 1) return;
                    }
                }
                raf = requestAnimationFrame(cuadro);
            })();
            // Lo que pasa al final del vuelo lo decide SÓLO quien recibe (o, si no está, quien tiró).
            clearTimeout(timeoutPerdida);
            if (!soyLanzador && p.intercepta) {
                const cuando = p.lanzadaEn + MITAD + (110 - p.xIntercepta) / 96 * MITAD - ahoraSync();
                timeoutPerdida = setTimeout(() => {
                    if (pelota !== p) return;
                    ck.saltar(32); ck.decir('¡Mía! 😼⚽', 1800);
                    setTimeout(() => escribirPelota({ tiene: miIdentidad, racha: 0, id: Date.now() }), 1800);
                }, Math.max(0, cuando));
            } else if (!soyLanzador) {
                timeoutPerdida = setTimeout(() => {
                    if (pelota !== p || pelota.tiene) return;
                    ck.decir('¡Se te escapó! 🙀', 1600);
                    escribirPelota({ tiene: miIdentidad, racha: 0, id: Date.now() });
                }, Math.max(0, p.lanzadaEn + VUELO_MS + MARGEN_ATRAPAR_MS - ahoraSync()));
            } else {
                timeoutPerdida = setTimeout(() => { if (pelota === p && !pelota.tiene) escribirPelota({ tiene: miIdentidad, racha: 0, id: Date.now() }); }, Math.max(0, p.lanzadaEn + VUELO_MS + MARGEN_ATRAPAR_MS + 4000 - ahoraSync()));
            }
            // Chokurei en la pantalla de quien tiró ve la pelota irse y la sigue un poco.
            if (soyLanzador && p.intercepta) setTimeout(() => ck.decir('¡Voy! 🏃', 900), MITAD * 0.6);
        }
        function terminar(){
            cancelAnimationFrame(raf); clearTimeout(timeoutPerdida); parar();
            enJuego = null;
            const r = mejorRacha;
            m.sumar(r - m.puntos); // el récord de la pelota es la mejor racha de pases
            m.terminar(r ? `¡Mejor racha: ${r} pases! ⚽` : '¡Otra vez! ⚽');
        }
        enJuego = { alCambiar: animar };
        window._pararModoMascota = () => { cancelAnimationFrame(raf); clearTimeout(timeoutPerdida); parar(); enJuego = null; Chokurei.modo = null; };
        animar();
    }
});
