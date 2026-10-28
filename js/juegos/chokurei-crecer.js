// ============================================================
// chokurei-crecer.js — Chokurei crece con ustedes:
//  🎓 Trucos que aprende practicando (dar la patita, sentarse, girar,
//     saludar, besito, hacerse el muerto). Una vez aprendidos, se los
//     piden con un botón.
//  📖 Diario: cada día queda escrito como si lo escribiera él (el texto
//     lo arma mascota.js al cambiar de día; acá se muestra).
//  ✨ Evolución especial al nivel 15: votan entre los dos su forma.
//  🏆 Logros con insignias y el ranking de quién lo cuidó más en la semana.
// ============================================================
const TRUCOS_CHOKUREI = [
    { id: 'patita',   nombre: 'Dar la patita',    emoji: '🐾', nivel: 1 },
    { id: 'sentarse', nombre: 'Sentarse',         emoji: '🪑', nivel: 2 },
    { id: 'girar',    nombre: 'Dar una vuelta',   emoji: '🌀', nivel: 3 },
    { id: 'saludar',  nombre: 'Saludar',          emoji: '👋', nivel: 4 },
    { id: 'besito',   nombre: 'Tirar un besito',  emoji: '😘', nivel: 5 },
    { id: 'muerto',   nombre: 'Hacerse el muerto', emoji: '💫', nivel: 6 },
];
const PRACTICAS_TRUCO = 5;
const FORMAS_CHOKUREI = [
    { id: 'angel',      nombre: 'Gatito ángel',  emoji: '😇' },
    { id: 'mago',       nombre: 'Gato mago',     emoji: '🧙' },
    { id: 'astronauta', nombre: 'Gato astronauta', emoji: '🧑‍🚀' },
    { id: 'pirata',     nombre: 'Gato pirata',   emoji: '🏴‍☠️' },
];
const NIVEL_FORMA_ESPECIAL = 15;

(window.CHOKUREI_MODULOS = window.CHOKUREI_MODULOS || []).push(function (Chokurei) {
    const otro = () => (miIdentidad === 'nico' ? 'carito' : 'nico');

    Chokurei.on('armar', ({ cont }) => {
        Chokurei.agregarBoton('🎓', 'Trucos', "abrirPanelChokurei('trucos')");
        Chokurei.agregarBoton('📖', 'Diario', "abrirPanelChokurei('diario')");
        Chokurei.agregarBoton('🏆', 'Logros', "abrirPanelChokurei('logros')");
        const bandeja = cont.querySelector('.ck-bandeja');
        if (bandeja && !document.getElementById('ck-evolucion')) bandeja.insertAdjacentHTML('afterend', '<div id="ck-evolucion"></div>');
    });

    // ==================== 🎓 TRUCOS ====================
    let ultimaPractica = 0;
    Chokurei.paneles.trucos = () => {
        const tr = Chokurei.estado.trucos || {}, nivel = (Chokurei.d || {}).nivel || 1;
        return `<div style="text-align:center; margin-bottom:8px;"><b>🎓 Trucos de Chokurei</b></div>
            <div class="texto-tenue" style="font-size:0.72rem; margin-bottom:8px;">Practiquen entre los dos: cada vez que le sale suma un paso. Con ${PRACTICAS_TRUCO} lo aprende para siempre.</div>
            ${TRUCOS_CHOKUREI.map(t => {
                const e = tr[t.id] || {};
                const bloqueado = nivel < t.nivel;
                const prog = Math.min(PRACTICAS_TRUCO, e.exitos || 0);
                return `<div class="ck-fila-juego" style="cursor:default;">
                    <span class="emoji">${bloqueado ? '🔒' : t.emoji}</span>
                    <span class="info"><b>${t.nombre}</b><small>${bloqueado ? `Se desbloquea en el nivel ${t.nivel}` : e.aprendido ? '✅ ¡Lo sabe!' : `${'🟣'.repeat(prog)}${'⚪'.repeat(PRACTICAS_TRUCO - prog)}`}</small></span>
                    ${bloqueado ? '' : e.aprendido ? `<button class="btn-principal" style="width:auto; padding:7px 12px;" onclick="pedirTrucoChokurei('${t.id}')">¡Hacelo!</button>`
                        : `<button class="btn-secundario" style="width:auto; padding:7px 12px;" onclick="practicarTrucoChokurei('${t.id}')">Practicar</button>`}
                </div>`;
            }).join('')}`;
    };
    window.practicarTrucoChokurei = async (id) => {
        const ck = Chokurei.ck, t = TRUCOS_CHOKUREI.find(x => x.id === id);
        if (!ck || !t || Chokurei.modo || Date.now() - ultimaPractica < 2500) return;
        ultimaPractica = Date.now();
        vibrarJ(10);
        const e = (Chokurei.estado.trucos || {})[id] || {};
        const exito = Math.random() < 0.35 + (e.exitos || 0) * 0.13;
        if (!exito) {
            const fallas = [() => { ck.expresion('sorprendido', 1200); ck.decir('¿Eh? ¿Qué cosa? 🤔', 1600); }, () => { ck.bostezar(); ck.decir('Mmm… paja 😴', 1500); }, () => { ck.lavarse(); ck.decir('Primero me lavo 😼', 1500); }, () => { ck.perseguirCola(); }];
            fallas[Math.floor(Math.random() * fallas.length)]();
            return;
        }
        ck.truco(id);
        if (window.sonidosChokurei) sonidosChokurei.brillo();
        let aprendio = false;
        await window.runTransaction(window.db, async (tx) => {
            aprendio = false;
            const snap = await tx.get(Chokurei.ref());
            const tr = (snap.exists() ? snap.data().trucos : null) || {};
            const actual = tr[id] || {};
            if (actual.aprendido) return;
            const exitos = (actual.exitos || 0) + 1;
            aprendio = exitos >= PRACTICAS_TRUCO;
            tx.set(Chokurei.ref(), { trucos: { [id]: { exitos, aprendido: aprendio } } }, { merge: true });
        });
        if (aprendio) {
            if (window.fx) window.fx.confeti();
            if (typeof mostrarCartelEnVivo === 'function') mostrarCartelEnVivo({ titulo: `🎓 ¡Chokurei aprendió a ${t.nombre.toLowerCase()}!`, sub: 'Ahora se lo pueden pedir cuando quieran', duracion: 4000 });
            await Chokurei.aplicarCuidado({ diversion: 15 }, `le enseñó a Chokurei el truco "${t.nombre}" ${t.emoji}`, 15);
        }
    };
    window.pedirTrucoChokurei = (id) => {
        const ck = Chokurei.ck;
        if (!ck || Chokurei.modo) return;
        vibrarJ(10);
        if (Math.random() < 0.1) { ck.decir('Ahora no tengo ganas 😼', 1600); ck.expresion('guino', 1000); return; }
        ck.truco(id);
    };
    // A veces hace un truco aprendido solo, para lucirse.
    Chokurei.comportamientos.push(() => {
        const sabidos = TRUCOS_CHOKUREI.filter(t => ((Chokurei.estado.trucos || {})[t.id] || {}).aprendido);
        if (!sabidos.length || Math.random() > 0.3) return false;
        Chokurei.ck.truco(sabidos[Math.floor(Math.random() * sabidos.length)].id);
        return true;
    });

    // ==================== 📖 DIARIO ====================
    Chokurei.paneles.diario = () => {
        const e = Chokurei.estado, diario = e.diario || {};
        const fechas = Object.keys(diario).sort().reverse();
        const lindo = (f) => new Date(f + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
        const hoy = e.registroHoy && e.registroHoy.fecha === Chokurei.fechaISO(new Date()) && e.registroHoy.eventos?.length && window._escribirDiarioMascota
            ? `<div class="ck-diario-entrada hoy"><div class="fecha">✏️ Hoy (lo sigo escribiendo…)</div>${window._escribirDiarioMascota(e.registroHoy, e)}</div>` : '';
        return `<div style="text-align:center; margin-bottom:8px;"><b>📖 Querido diario… — Chokurei</b></div>
            <div class="ck-diario">${hoy}${fechas.map(f => `<div class="ck-diario-entrada"><div class="fecha">${lindo(f)}</div>${diario[f]}</div>`).join('') || (hoy ? '' : '<div class="texto-centro texto-tenue">Todavía no escribí nada. Cuídenme hoy y mañana les cuento 🐾</div>')}</div>`;
    };

    // ==================== ✨ EVOLUCIÓN ESPECIAL ====================
    Chokurei.on('actualizar', ({ d, estado }) => {
        const ck = Chokurei.ck;
        if (ck) ck.forma(estado.formaEspecial || null);
        const cont = document.getElementById('ck-evolucion');
        if (!cont) return;
        if (estado.formaEspecial || d.nivel < NIVEL_FORMA_ESPECIAL) { cont.innerHTML = ''; return; }
        const votos = (estado.evolucion || {}).votos || {};
        const mio = votos[miIdentidad], suyo = votos[otro()];
        const nombreForma = (id) => { const f = FORMAS_CHOKUREI.find(x => x.id === id); return f ? `${f.emoji} ${f.nombre}` : ''; };
        cont.innerHTML = `<div class="panel ck-evolucion">
            <b>✨ ¡Chokurei puede evolucionar!</b>
            <div class="texto-tenue" style="font-size:0.75rem; margin:4px 0 8px;">Voten los dos su forma especial. Cuando coincidan, se transforma.</div>
            <div class="ck-formas">${FORMAS_CHOKUREI.map(f => `<button class="${mio === f.id ? 'elegido' : ''}" onclick="votarFormaChokurei('${f.id}')"><span>${f.emoji}</span>${f.nombre}${suyo === f.id ? `<small>voto de ${nombreJugador(otro())}</small>` : ''}</button>`).join('')}</div>
            ${mio && suyo && mio !== suyo ? `<div class="texto-tenue" style="font-size:0.75rem; margin-top:8px;">Votaron distinto: vos ${nombreForma(mio)}, ${nombreJugador(otro())} ${nombreForma(suyo)}. <a href="#" onclick="votarFormaChokurei('${suyo}'); return false;">Elegir lo de ${nombreJugador(otro())}</a></div>` : ''}
        </div>`;
    });
    window.votarFormaChokurei = async (id) => {
        vibrarJ(10);
        let elegida = null;
        await window.runTransaction(window.db, async (tx) => {
            elegida = null;
            const snap = await tx.get(Chokurei.ref());
            const e = snap.exists() ? snap.data() : {};
            if (e.formaEspecial) return;
            const votos = { ...((e.evolucion || {}).votos || {}), [miIdentidad]: id };
            const cambios = { evolucion: { votos } };
            if (votos.nico && votos.nico === votos.carito) { cambios.formaEspecial = id; elegida = id; }
            tx.set(Chokurei.ref(), cambios, { merge: true });
        });
        if (elegida) {
            Chokurei.ck?.evolucionar();
            const f = FORMAS_CHOKUREI.find(x => x.id === elegida);
            if (typeof mostrarCartelEnVivo === 'function') mostrarCartelEnVivo({ titulo: `✨ ¡Chokurei ahora es ${f.nombre} ${f.emoji}!`, duracion: 5000 });
            Chokurei.aplicarCuidado({ diversion: 30, carino: 30 }, `eligió con su pareja que Chokurei evolucione a ${f.nombre.toLowerCase()} ${f.emoji}`, 20);
        } else Chokurei.ck?.decir('¡Voto anotado! Falta el otro 🗳️', 1800);
    };

    // ==================== 🏆 LOGROS ====================
    const LOGROS = [
        { id: 'comer100',   emoji: '🍽️', nombre: 'Gordito feliz',   desc: '100 comidas',        valor: (e) => (e.contadores || {}).comer || 0, meta: 100 },
        { id: 'mimos100',   emoji: '🖐️', nombre: 'Mimoso',          desc: '100 mimos',          valor: (e) => (e.contadores || {}).mimos || 0, meta: 100 },
        { id: 'banio30',    emoji: '🫧', nombre: 'Limpito',          desc: '30 baños',           valor: (e) => (e.contadores || {}).banio || 0, meta: 30 },
        { id: 'jugar50',    emoji: '🧶', nombre: 'Juguetón',         desc: '50 juegos',          valor: (e) => (e.contadores || {}).jugar || 0, meta: 50 },
        { id: 'peces500',   emoji: '🎣', nombre: 'Gran pescador',    desc: '500 peces pescados', valor: (e) => (e.contadores || {}).peces || 0, meta: 500 },
        { id: 'racha7',     emoji: '🔥', nombre: 'Una semana juntos', desc: '7 días de racha',   valor: (e) => (e.rachaDias || {}).mejor || 0, meta: 7 },
        { id: 'racha30',    emoji: '🌋', nombre: 'Inseparables',     desc: '30 días de racha',   valor: (e) => (e.rachaDias || {}).mejor || 0, meta: 30 },
        { id: 'nivel10',    emoji: '⭐', nombre: 'Gato grande',      desc: 'Llegar al nivel 10', valor: (e) => Math.floor((e.xp || 0) / 50) + 1, meta: 10 },
        { id: 'nivel15',    emoji: '✨', nombre: 'Leyenda',          desc: 'Llegar al nivel 15', valor: (e) => Math.floor((e.xp || 0) / 50) + 1, meta: 15 },
        { id: 'fotos10',    emoji: '📸', nombre: 'Modelo',           desc: '10 fotos',           valor: (e) => (e.contadores || {}).fotos || 0, meta: 10 },
        { id: 'trucos',     emoji: '🎓', nombre: 'Gato de circo',    desc: 'Aprender los 6 trucos', valor: (e) => Object.values(e.trucos || {}).filter(t => t.aprendido).length, meta: 6 },
        { id: 'medallas5',  emoji: '🏅', nombre: 'Campeones',        desc: '5 medallas',         valor: (e) => (e.medallas || []).length, meta: 5 },
        { id: 'tienda10',   emoji: '🛍️', nombre: 'Consentido',       desc: '10 cosas de la tienda', valor: (e) => Object.keys(e.inventario || {}).length, meta: 10 },
        { id: 'mensajes10', emoji: '💌', nombre: 'Cartero',          desc: 'Entregar 10 mensajes', valor: (e) => (e.contadores || {}).mensajes || 0, meta: 10 },
        { id: 'favoritos',  emoji: '🔍', nombre: 'Lo conocen bien',  desc: 'Descubrir sus 2 favoritos', valor: (e) => (e.descubiertos || {}).comida && (e.descubiertos || {}).juego ? 1 : 0, meta: 1 },
        { id: 'flor',       emoji: '🌸', nombre: 'Mano verde',       desc: 'Que la plantita florezca', valor: (e) => (e.planta || {}).flores || 0, meta: 1 },
    ];
    let logrosVistos = null;
    Chokurei.on('actualizar', ({ estado }) => {
        const ganados = estado.logros || {};
        const nuevos = LOGROS.filter(l => !ganados[l.id] && l.valor(estado) >= l.meta);
        if (logrosVistos === null) { logrosVistos = true; }
        if (nuevos.length) {
            const hoy = Chokurei.fechaISO(new Date());
            window.setDoc(Chokurei.ref(), { logros: Object.fromEntries(nuevos.map(l => [l.id, hoy])) }, { merge: true }).catch(() => {});
            nuevos.forEach((l, i) => setTimeout(() => {
                if (typeof mostrarCartelEnVivo === 'function') mostrarCartelEnVivo({ titulo: `🏆 Logro desbloqueado: ${l.emoji} ${l.nombre}`, sub: l.desc, duracion: 4000 });
                if (window.fx) window.fx.confeti();
            }, i * 4500));
        }
        premiarSemanaPasada(estado);
    });
    Chokurei.paneles.logros = () => {
        const e = Chokurei.estado, ganados = e.logros || {};
        const sem = e.semanaCuidados && e.semanaCuidados.semana === Chokurei.semana() ? e.semanaCuidados : { nico: 0, carito: 0 };
        const pas = e.semanaPasada;
        const lider = (sem.nico || 0) === (sem.carito || 0) ? 'Van empatados 🤝' : `Va ganando ${nombreJugador((sem.nico || 0) > (sem.carito || 0) ? 'nico' : 'carito')}`;
        return `<div style="text-align:center; margin-bottom:8px;"><b>🏆 Logros de Chokurei</b> <span class="ck-chip">${Object.keys(ganados).length}/${LOGROS.length}</span></div>
            <div class="ck-ranking">
                <b>📅 ¿Quién lo cuidó más esta semana?</b>
                <div class="ck-ranking-barras">
                    ${['nico', 'carito'].map(q => { const n = sem[q] || 0, max = Math.max(1, sem.nico || 0, sem.carito || 0); return `<div><span>${nombreJugador(q)}</span><div class="barra"><div style="width:${n / max * 100}%"></div></div><b>${n}</b></div>`; }).join('')}
                </div>
                <div class="texto-tenue" style="font-size:0.72rem;">${lider} · el que gane la semana se lleva +10 ⭐${pas && pas.ganador ? ` · La semana pasada ganó ${nombreJugador(pas.ganador)} 👑` : ''}</div>
            </div>
            <div class="ck-logros">${LOGROS.map(l => {
                const v = Math.min(l.meta, l.valor(e));
                return `<div class="ck-logro${ganados[l.id] ? ' ganado' : ''}"><span class="emoji">${ganados[l.id] ? l.emoji : '🔒'}</span><b>${l.nombre}</b><small>${l.desc}</small>
                    ${ganados[l.id] ? `<small>✅ ${ganados[l.id]}</small>` : `<div class="barra"><div style="width:${v / l.meta * 100}%"></div></div><small>${v}/${l.meta}</small>`}</div>`;
            }).join('')}</div>`;
    };

    // Al empezar una semana nueva, el que más lo cuidó la anterior gana +10 ⭐ (una sola vez).
    let premiando = false;
    async function premiarSemanaPasada(estado){
        const p = estado.semanaPasada;
        if (!p || p.premiada || premiando) return;
        premiando = true;
        let ganador = null;
        try {
            await window.runTransaction(window.db, async (tx) => {
                ganador = null;
                const snap = await tx.get(Chokurei.ref());
                const sp = snap.exists() ? snap.data().semanaPasada : null;
                if (!sp || sp.premiada) return;
                ganador = (sp.nico || 0) === (sp.carito || 0) ? 'empate' : ((sp.nico || 0) > (sp.carito || 0) ? 'nico' : 'carito');
                tx.set(Chokurei.ref(), { semanaPasada: { premiada: true, ganador: ganador === 'empate' ? null : ganador } }, { merge: true });
            });
        } catch (e) { premiando = false; return; }
        premiando = false;
        if (!ganador || !window.sumarPuntos) return;
        if (ganador === 'empate') { window.sumarPuntos('nico', 5); window.sumarPuntos('carito', 5); }
        else window.sumarPuntos(ganador, 10);
        if (typeof mostrarCartelEnVivo === 'function') mostrarCartelEnVivo({ titulo: ganador === 'empate' ? '🤝 La semana pasada empataron cuidando a Chokurei' : `👑 ${nombreJugador(ganador)} fue quien más cuidó a Chokurei la semana pasada`, sub: ganador === 'empate' ? '+5 ⭐ para cada uno' : '+10 ⭐', duracion: 5000 });
    }
});
