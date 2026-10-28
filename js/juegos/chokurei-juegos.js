// ============================================================
// chokurei-juegos.js — mini-juegos de Chokurei y todo lo que se juega
// de a dos al mismo tiempo.
//
// Mini-juegos (cada uno con su récord y medalla si se supera):
//  🔴 Láser (está en mascota.js)  🐟 Pescar  🪶 Pluma  🙈 Escondidas
//
// De a dos, en vivo (documento juegos/mascota-vivo, como un canal):
//  - Láser: el puntito del otro aparece en tu pantalla (en celeste) y
//    Chokurei corre hacia el que tenga más cerca. Las atrapadas suman
//    para los dos.
//  - Baño: la espuma que hace el otro aparece en tu Chokurei y suma.
//  - Mimos: si los dos lo acarician a la vez → "💞 ¡Mimos de a dos!".
// ============================================================
const JUEGOS_CHOKUREI = [
    { id: 'laser',      nombre: 'Láser',      emoji: '🔴', desc: 'Mové el dedo: lo persigue. ¡De a dos se juega mejor!' },
    { id: 'pescar',     nombre: 'Pescar',     emoji: '🐟', desc: 'Tocá los peces que pasan y Chokurei los atrapa. El 🐡 dorado vale 3.' },
    { id: 'pluma',      nombre: 'Pluma',      emoji: '🪶', desc: 'Mové la varita: salta para atrapar la pluma cuando está bajita.' },
    { id: 'escondidas', nombre: 'Escondidas', emoji: '🙈', desc: 'Se esconde detrás de algo. ¿Dónde está? 5 rondas.' },
];

(window.CHOKUREI_MODULOS = window.CHOKUREI_MODULOS || []).push(function (Chokurei) {
    const refVivo = () => window.doc(window.db, 'juegos', 'mascota-vivo');
    const otro = () => (miIdentidad === 'nico' ? 'carito' : 'nico');
    let vivo = {};
    let ultimaEscritura = {};
    const escribirVivo = (campo, valor, cadaMs) => {
        const ahora = Date.now();
        if (ahora - (ultimaEscritura[campo] || 0) < (cadaMs || 150)) return;
        ultimaEscritura[campo] = ahora;
        window.setDoc(refVivo(), { [campo]: { [miIdentidad]: valor } }, { merge: true }).catch(() => {});
    };
    const fresco = (v, ms) => v && v.t && (ahoraSync() - v.t) < (ms || 1500);

    // ---------- Canal en vivo ----------
    Chokurei.on('armar', () => {
        if (window._unsubMascotaVivo) window._unsubMascotaVivo();
        window._unsubMascotaVivo = window.onSnapshot(refVivo(), (snap) => {
            vivo = snap.exists() ? snap.data() : {};
            _laserDelOtro();
            _espumaDelOtro();
        }, () => {});
    });

    // ===== Láser de a dos =====
    let puntoOtro = null, pararEspectador = null, chequeoOtro = null;
    Chokurei.laserDelOtro = () => {
        const l = vivo.laser && vivo.laser[otro()];
        return fresco(l) ? l : null;
    };
    Chokurei.on('laser', (pos) => escribirVivo('laser', { x: Math.round(pos.x * 10) / 10, y: Math.round(pos.y * 10) / 10, t: ahoraSync() }, 120));
    function _laserDelOtro(){
        const hab = Chokurei.hab();
        if (!hab) return;
        const l = Chokurei.laserDelOtro();
        if (!l) { if (puntoOtro) { puntoOtro.remove(); puntoOtro = null; } return; }
        if (!puntoOtro) {
            puntoOtro = document.createElement('div');
            puntoOtro.className = 'ck-laser ck-laser-otro';
            puntoOtro.title = 'Láser de ' + nombreJugador(otro());
            hab.appendChild(puntoOtro);
        }
        puntoOtro.style.left = l.x + '%'; puntoOtro.style.top = l.y + '%';
        // Si yo no estoy jugando, Chokurei igual persigue el láser del otro (y lo veo jugar).
        if (!Chokurei.modo && !pararEspectador && Chokurei.ck && !Chokurei.ck.ocupado) {
            pararEspectador = Chokurei.ck.seguir(() => Chokurei.laserDelOtro()?.x ?? null);
            let ultima = 0;
            chequeoOtro = setInterval(() => {
                const lo = Chokurei.laserDelOtro();
                if (!lo || Chokurei.modo) { clearInterval(chequeoOtro); if (pararEspectador) pararEspectador(); pararEspectador = null; if (puntoOtro && !lo) { puntoOtro.remove(); puntoOtro = null; } return; }
                if (Chokurei.ck && Math.abs(Chokurei.ck.x - lo.x) < 5 && lo.y > 55 && Date.now() - ultima > 900) { ultima = Date.now(); Chokurei.ck.saltar(26); }
            }, 120);
        }
    }

    // ===== Baño de a dos =====
    // Se mandan las últimas burbujas en tanda (no sólo la última): si no,
    // con varias seguidas al otro le llegaba una de cada cuatro.
    let misBurbujas = [], idBurbuja = 0, envioBurbujas = null;
    Chokurei.on('espuma', (p) => {
        misBurbujas = [...misBurbujas, { x: p.x, y: p.y, id: ++idBurbuja }].slice(-10);
        if (envioBurbujas) return;
        envioBurbujas = setTimeout(() => {
            envioBurbujas = null;
            window.setDoc(refVivo(), { banio: { [miIdentidad]: { lista: misBurbujas, sesion: sesionBanio, t: ahoraSync() } } }, { merge: true }).catch(() => {});
        }, 120);
    });
    let sesionBanio = Date.now(), vistasOtro = new Set();
    Chokurei.on('banio-empieza', () => { sesionBanio = Date.now(); misBurbujas = []; vistasOtro = new Set(); });
    function _espumaDelOtro(){
        const b = vivo.banio && vivo.banio[otro()];
        if (!fresco(b, 4000) || Chokurei.modo !== 'banio' || !Chokurei.agregarEspumaExterna) return;
        (b.lista || []).forEach(p => {
            const clave = b.sesion + ':' + p.id;
            if (vistasOtro.has(clave)) return;
            vistasOtro.add(clave);
            Chokurei.agregarEspumaExterna(p.x, p.y);
        });
    }

    // ===== Mimos de a dos =====
    let ultimoDeADos = 0;
    Chokurei.on('acariciando', () => {
        escribirVivo('caricia', { t: ahoraSync() }, 400);
        const c = vivo.caricia && vivo.caricia[otro()];
        if (fresco(c, 1500) && Date.now() - ultimoDeADos > 10 * 60000) {
            ultimoDeADos = Date.now();
            const ck = Chokurei.ck;
            if (ck) {
                ck.decir('💞 ¡Mimos de a dos!', 2500);
                for (let i = 0; i < 8; i++) setTimeout(() => ck.particula(i % 2 ? '💞' : '💜', { dx: (Math.random() - 0.5) * 120, dur: 1500, tam: 1.4 }), i * 120);
                if (window.sonidosChokurei) sonidosChokurei.ronroneo(2.5);
            }
            if (window.fx) window.fx.confeti();
            Chokurei.aplicarCuidado({ carino: 20 }, 'le hizo mimos de a dos a Chokurei 💞', 8);
        }
    });

    // ---------- Récords y medallas ----------
    async function guardarResultado(juegoId, puntos){
        let record = false;
        try {
            await window.runTransaction(window.db, async (tx) => {
                record = false;
                const snap = await tx.get(Chokurei.ref());
                const e = snap.exists() ? snap.data() : {};
                const r = (e.records || {})[juegoId] || {};
                const mejor = Math.max(r.nico || 0, r.carito || 0);
                const cambios = { records: { [juegoId]: { [miIdentidad]: Math.max(r[miIdentidad] || 0, puntos) } } };
                if (puntos > 0 && puntos > mejor) {
                    record = true;
                    cambios.medallas = [...(e.medallas || []), { juego: juegoId, quien: miIdentidad, puntos, fecha: Chokurei.fechaISO(new Date()) }].slice(-30);
                }
                tx.set(Chokurei.ref(), cambios, { merge: true });
            });
        } catch (e) { console.warn('No se pudo guardar el récord:', e); }
        const j = JUEGOS_CHOKUREI.find(x => x.id === juegoId);
        await Chokurei.aplicarCuidado({ diversion: Math.min(60, 25 + puntos * 5) }, `jugó a ${j.nombre.toLowerCase()} ${j.emoji} con Chokurei (${puntos} puntos${record ? ', ¡récord!' : ''})`, 5 + Math.min(10, puntos), 'jugar');
        if (record) {
            if (window.fx) window.fx.confeti();
            if (window.sfx) window.sfx.logro();
            if (typeof mostrarCartelEnVivo === 'function') mostrarCartelEnVivo({ titulo: `🏅 ¡Nuevo récord en ${j.nombre}!`, sub: `${puntos} puntos · ganaste una medalla`, duracion: 4000 });
        }
    }
    Chokurei.guardarResultado = guardarResultado;
    Chokurei.on('juego-terminado', ({ juego, puntos }) => guardarResultado(juego, puntos));

    Chokurei.paneles.juegos = () => {
        const rec = Chokurei.estado.records || {};
        const med = Chokurei.estado.medallas || [];
        const mias = med.filter(m => m.quien === miIdentidad).length, suyas = med.length - mias;
        const enVivo = typeof estadoRivalEnVivo === 'function' && estadoRivalEnVivo().juego === 'mascota';
        return `<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;"><b>🎮 Jugar con Chokurei</b><span class="ck-chip">🏅 ${nombreJugador(miIdentidad)} ${mias} · ${nombreJugador(otro())} ${suyas}</span></div>
            ${enVivo ? `<div class="texto-tenue" style="margin-bottom:8px;">💞 ${nombreJugador(otro())} también está con Chokurei: en el láser, el baño y los mimos juegan juntos.</div>` : ''}
            ${JUEGOS_CHOKUREI.map(j => {
                const r = rec[j.id] || {};
                return `<button class="ck-fila-juego" onclick="jugarMiniChokurei('${j.id}')">
                    <span class="emoji">${j.emoji}</span>
                    <span class="info"><b>${j.nombre}</b><small>${j.desc}</small></span>
                    <span class="record">🏆 ${Math.max(r.nico || 0, r.carito || 0)}<small>N ${r.nico || 0} · C ${r.carito || 0}</small></span>
                </button>`;
            }).join('')}`;
    };
    window.jugarMiniChokurei = (id) => {
        if (Chokurei.modo || !Chokurei.ck) return;
        abrirPanelChokurei('juegos'); // cierra el panel para ver la habitación
        Chokurei.hab().scrollIntoView({ behavior: 'smooth', block: 'center' });
        if (id === 'laser') return empezarLaserMascota();
        if (id === 'pescar') return pescar();
        if (id === 'pluma') return pluma();
        if (id === 'escondidas') return escondidas();
    };

    // Arranca un mini-juego en la capa de la habitación. Devuelve helpers.
    function modo(id, texto){
        vibrarJ(12);
        if (pararEspectador) { pararEspectador(); pararEspectador = null; clearInterval(chequeoOtro); }
        Chokurei.modo = id;
        if (Chokurei.ck.dormido) Chokurei.ck.despertar();
        const capa = document.getElementById('ck-capa');
        capa.classList.add('activa');
        capa.innerHTML = `<div class="ck-modo-texto">${texto} · <span id="ck-mini-n">0</span></div>`;
        let puntos = 0;
        const timers = [];
        return {
            capa, hab: Chokurei.hab(),
            sumar(n){ puntos += n || 1; const el = document.getElementById('ck-mini-n'); if (el) el.textContent = puntos; },
            get puntos(){ return puntos; },
            timer(fn, ms, repetir){ const t = repetir ? setInterval(fn, ms) : setTimeout(fn, ms); timers.push(t); return t; },
            terminar(frase){
                timers.forEach(t => { clearInterval(t); clearTimeout(t); });
                capa.classList.remove('activa'); capa.innerHTML = '';
                capa.onpointerdown = capa.onpointermove = capa.onpointerup = null;
                Chokurei.modo = null;
                window._pararModoMascota = null;
                if (Chokurei.ck) { Chokurei.ck.decir(frase, 2600); Chokurei.ck.alegrarse(); }
                guardarResultado(id, puntos);
            },
        };
    }

    // ===== 🐟 Pescar =====
    function pescar(){
        const m = modo('pescar', '🐟 Tocá los peces');
        const ck = Chokurei.ck;
        const peces = new Set();
        function soltarPez(){
            const dorado = Math.random() < 0.12;
            const p = document.createElement('div');
            p.className = 'ck-pez'; p.textContent = dorado ? '🐡' : (Math.random() < 0.5 ? '🐟' : '🐠');
            const deIzq = Math.random() < 0.5;
            const y = 52 + Math.random() * 36;
            p.style.top = y + '%';
            if (!deIzq) p.style.transform = 'translate(-50%,-50%) scaleX(-1)';
            m.capa.appendChild(p);
            const dur = (dorado ? 2200 : 3000 + Math.random() * 2500) * Math.max(0.55, 1 - m.puntos * 0.03);
            const a = p.animate([{ left: deIzq ? '-8%' : '108%' }, { left: deIzq ? '108%' : '-8%' }], { duration: dur, easing: 'linear', fill: 'forwards' });
            peces.add(p);
            a.finished.then(() => { peces.delete(p); p.remove(); }).catch(() => {});
            p.onpointerdown = async (ev) => {
                ev.stopPropagation();
                if (p.dataset.atrapado) return;
                p.dataset.atrapado = '1';
                const r = m.hab.getBoundingClientRect(), rp = p.getBoundingClientRect();
                const x = (rp.left + rp.width / 2 - r.left) / r.width * 100;
                a.pause();
                sonidosChokurei.atrapar(); vibrarJ(15);
                ck.caminarA(x, true).then(() => ck.saltar(30));
                p.animate([{ transform: p.style.transform || 'translate(-50%,-50%)' }, { transform: 'translate(-50%,-160%) scale(1.4) rotate(30deg)', opacity: 0 }], { duration: 500 }).finished.then(() => { peces.delete(p); p.remove(); });
                const splash = document.createElement('div'); splash.className = 'ck-particula'; splash.textContent = dorado ? '✨+3' : '💦';
                splash.style.left = x + '%'; splash.style.top = (rp.top - r.top) + 'px'; m.hab.appendChild(splash);
                splash.animate([{ opacity: 1, transform: 'translate(-50%,0)' }, { opacity: 0, transform: 'translate(-50%,-40px)' }], { duration: 800 }).finished.then(() => splash.remove());
                m.sumar(dorado ? 3 : 1);
            };
        }
        m.timer(soltarPez, 700, true);
        soltarPez();
        m.timer(() => { peces.forEach(p => p.remove()); m.terminar(m.puntos ? `¡${m.puntos} pescaditos! 😻` : '¿Y la cena? 😿'); }, 20000);
        window._pararModoMascota = () => { peces.forEach(p => p.remove()); Chokurei.modo = null; };
    }

    // ===== 🪶 Pluma en una varita =====
    function pluma(){
        const m = modo('pluma', '🪶 Mové la varita');
        m.capa.insertAdjacentHTML('beforeend', `<svg class="ck-varita" viewBox="0 0 100 100" preserveAspectRatio="none"><line id="ck-hilo" x1="50" y1="0" x2="50" y2="40"/></svg><div class="ck-pluma" style="left:50%; top:40%">🪶</div>`);
        const plumaEl = m.capa.querySelector('.ck-pluma'), hilo = m.capa.querySelector('#ck-hilo');
        let pos = { x: 50, y: 40 }, tocando = false, ultima = 0, ultimoMov = Date.now();
        const poner = () => { plumaEl.style.left = pos.x + '%'; plumaEl.style.top = pos.y + '%'; hilo.setAttribute('x1', 50 + (pos.x - 50) * 0.3); hilo.setAttribute('x2', pos.x); hilo.setAttribute('y2', pos.y); };
        const mover = (ev) => { const r = m.hab.getBoundingClientRect(); pos = { x: Math.max(6, Math.min(94, (ev.clientX - r.left) / r.width * 100)), y: Math.max(15, Math.min(85, (ev.clientY - r.top) / r.height * 100)) }; ultimoMov = Date.now(); poner(); };
        m.capa.onpointerdown = (ev) => { tocando = true; mover(ev); };
        m.capa.onpointermove = (ev) => { if (tocando || ev.pointerType === 'mouse') mover(ev); };
        m.capa.onpointerup = () => { tocando = false; };
        // Si nadie la mueve, se balancea sola.
        m.timer(() => { if (Date.now() - ultimoMov < 1200) return; pos = { x: 20 + Math.random() * 60, y: 30 + Math.random() * 45 }; poner(); }, 1400, true);
        const parar = Chokurei.ck.seguir(() => pos.x);
        m.timer(() => {
            const ck = Chokurei.ck;
            if (!ck) return;
            if (Math.abs(ck.x - pos.x) < 7 && pos.y > 55 && Date.now() - ultima > 1000) {
                ultima = Date.now();
                ck.saltar(36); sonidosChokurei.atrapar(); vibrarJ(15);
                plumaEl.animate([{ transform: 'translate(-50%,-50%) rotate(0)' }, { transform: 'translate(-50%,-50%) rotate(40deg) scale(1.3)' }, { transform: 'translate(-50%,-50%) rotate(0)' }], { duration: 400 });
                m.sumar(1);
                if (!tocando) { pos = { x: ck.x > 50 ? 15 + Math.random() * 25 : 60 + Math.random() * 25, y: 25 + Math.random() * 20 }; poner(); }
            }
        }, 80, true);
        m.timer(() => { parar(); m.terminar(m.puntos ? `¡Cacé la pluma ${m.puntos} veces! 😼` : 'Mañana la cazo 😾'); }, 20000);
        window._pararModoMascota = () => { parar(); Chokurei.modo = null; };
        poner();
    }

    // ===== 🙈 Escondidas =====
    function escondidas(){
        const m = modo('escondidas', '🙈 ¿Dónde está?');
        const ck = Chokurei.ck;
        const lugares = [
            { x: 14, emoji: '🧺' }, { x: 38, emoji: '🪴' }, { x: 62, emoji: '📦' }, { x: 86, emoji: '🛋️' },
        ];
        m.capa.insertAdjacentHTML('beforeend', lugares.map((l, i) => `<div class="ck-escondite" data-i="${i}" style="left:${l.x}%">${l.emoji}</div>`).join('') + '<div class="ck-telon"></div>');
        const escondites = [...m.capa.querySelectorAll('.ck-escondite')], telon = m.capa.querySelector('.ck-telon');
        let ronda = 0, donde = 0, esperando = false;
        async function nuevaRonda(){
            ronda++;
            if (ronda > 5) { ck.actor.style.visibility = ''; return m.terminar(m.puntos >= 4 ? `¡Me encontraste ${m.puntos} de 5! 🕵️` : `${m.puntos} de 5… ¡soy un ninja! 🥷`); }
            esperando = false;
            ck.actor.style.visibility = '';
            telon.textContent = `Ronda ${ronda} · ¡no espíes! 🙈`;
            telon.classList.add('visible');
            await new Promise(r => setTimeout(r, 1300));
            donde = Math.floor(Math.random() * lugares.length);
            ck.ponerX(lugares[donde].x);
            ck.actor.style.visibility = 'hidden';
            telon.classList.remove('visible');
            esperando = true;
            // Pista en las primeras rondas: el escondite tiembla un poquito.
            if (ronda <= 2) setTimeout(() => esperando && escondites[donde].animate([{ transform: 'translateX(-50%) rotate(0)' }, { transform: 'translateX(-50%) rotate(-6deg)' }, { transform: 'translateX(-50%) rotate(6deg)' }, { transform: 'translateX(-50%) rotate(0)' }], { duration: 400 }), 900);
            if (ronda <= 3 && Math.random() < 0.5) setTimeout(() => { if (esperando) { const c = document.createElement('div'); c.className = 'ck-particula'; c.textContent = '〰️'; c.style.left = (lugares[donde].x + 6) + '%'; c.style.top = '78%'; m.hab.appendChild(c); setTimeout(() => c.remove(), 900); } }, 1600);
        }
        escondites.forEach((el, i) => {
            el.onpointerdown = async (ev) => {
                ev.stopPropagation();
                if (!esperando) return;
                esperando = false;
                ck.actor.style.visibility = '';
                if (i === donde) {
                    m.sumar(1); sonidosChokurei.atrapar(); vibrarJ(15);
                    await ck.saltar(34);
                    ck.decir('¡Me encontraste! 😹', 1200);
                } else {
                    vibrarJ([10, 30, 10]);
                    el.animate([{ transform: 'translateX(-50%) scale(1)' }, { transform: 'translateX(-50%) scale(0.85)' }, { transform: 'translateX(-50%) scale(1)' }], { duration: 250 });
                    ck.expresion('guino', 1400);
                    ck.decir('¡Acá estaba! 😜', 1400);
                    sonidosChokurei.miau(true);
                }
                setTimeout(nuevaRonda, 1500);
            };
        });
        nuevaRonda();
        window._pararModoMascota = () => { if (Chokurei.ck) Chokurei.ck.actor.style.visibility = ''; Chokurei.modo = null; };
    }
});
