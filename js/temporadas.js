// ============================================================
// temporadas.js — campeonato del mes y hazañas por juego.
//
// 🏆 Campeonato del mes: cada mes toca un juego (el mismo para los
// dos, elegido por el mes, como el "juego de la semana"). Las
// victorias de ese juego cuentan para el campeonato: el primero en
// ganar 3 (mejor de 5) es campeón del mes, se lleva 50 puntos y queda
// en el palmarés. Todo vive en juegos/campeonato.
//
// ⭐ Hazañas: logros especiales que salen de una jugada (ganar con un
// vale cuatro, generala servida, chinchón, mate rápido...). Se suman
// al catálogo de logros de siempre (logros.js) y los detecta
// observar(juego, estado), que llama cada juego al redibujar,
// comparando con el estado anterior. Se anotan sólo en el celular de
// quien hizo la hazaña, así no se cuentan dos veces.
// Contra la compu no cuenta nada de esto.
// ============================================================
(function () {
    const JUEGOS_CAMPEONATO = ['truco', 'escoba', 'chinchon', 'uno', 'ajedrez', 'damas', 'conecta4', 'reversi', 'generala', 'mentiroso', 'cajitas', 'batallanaval', 'tateti'];
    const META_CAMPEONATO = 3;
    const PREMIO_CAMPEONATO = 50;
    const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

    const enCompu = () => typeof window.modoCompu === 'function' && !!window.modoCompu();
    const nombre = (q) => q === 'carito' ? 'Carito' : 'Nico';
    const campeonDe = (q) => q === 'carito' ? 'campeona' : 'campeón';
    function mesActual() {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    }
    function nombreMes(mes) { return MESES[Number(mes.split('-')[1]) - 1] || mes; }
    function juegoDelMes(mes) {
        const clave = 'campeonato:' + (mes || mesActual());
        let h = 0;
        for (let i = 0; i < clave.length; i++) h = (h * 31 + clave.charCodeAt(i)) >>> 0;
        return JUEGOS_CAMPEONATO[h % JUEGOS_CAMPEONATO.length];
    }
    const infoJuego = (id) => (window.JUEGOS || []).find(j => j.id === id) || { icono: '🎮', nombre: id };
    const ref = () => window.doc(window.db, 'juegos', 'campeonato');

    // ==================== HAZAÑAS ====================
    const HAZANAS = [
        { id: 'hz_vale4', nombre: 'Vale cuatro', icono: '4️⃣', tipo: 'hz_vale4', umbral: 1, descripcion: 'Ganar una mano de Truco con un Vale Cuatro querido.' },
        { id: 'hz_envido33', nombre: 'Treinta y tres', icono: '🔢', tipo: 'hz_envido33', umbral: 1, descripcion: 'Ganar un envido con 33, lo máximo.' },
        { id: 'hz_truco_paliza', nombre: 'Paliza', icono: '🧹', tipo: 'hz_truco_paliza', umbral: 1, descripcion: 'Ganar una partida de Truco sin que el otro anote ni un tanto.' },
        { id: 'hz_3escobas', nombre: 'Barrendero/a', icono: '🧹', tipo: 'hz_3escobas', umbral: 1, descripcion: 'Hacer 3 escobas en una misma partida de Escoba.' },
        { id: 'hz_chinchon', nombre: '¡Chinchón!', icono: '🃑', tipo: 'hz_chinchon', umbral: 1, descripcion: 'Cerrar una ronda de Chinchón sin ninguna carta suelta.' },
        { id: 'hz_generala_servida', nombre: 'Generala servida', icono: '🎲', tipo: 'hz_generala_servida', umbral: 1, descripcion: 'Sacar generala en la primera tirada.' },
        { id: 'hz_doble_generala', nombre: 'Doble generala', icono: '🎲', tipo: 'hz_doble_generala', umbral: 1, descripcion: 'Anotar una doble generala.' },
        { id: 'hz_mate_rapido', nombre: 'Mate relámpago', icono: '⚡', tipo: 'hz_mate_rapido', umbral: 1, descripcion: 'Dar jaque mate en 20 jugadas o menos.' },
        { id: 'hz_uno_final4', nombre: 'Final con +4', icono: '🌈', tipo: 'hz_uno_final4', umbral: 1, descripcion: 'Ganar al UNO tirando un +4 como última carta.' },
        { id: 'hz_c4_diagonal', nombre: 'En diagonal', icono: '↗️', tipo: 'hz_c4_diagonal', umbral: 1, descripcion: 'Ganar un Conecta 4 con una línea en diagonal.' },
        { id: 'hz_mentiroso_invicto', nombre: 'Cara de póker', icono: '😐', tipo: 'hz_mentiroso_invicto', umbral: 1, descripcion: 'Ganar al Mentiroso sin perder ni un dado.' },
        { id: 'hz_reversi_esquinas', nombre: 'Dueño/a de las esquinas', icono: '🔲', tipo: 'hz_reversi_esquinas', umbral: 1, descripcion: 'Ganar al Reversi con las 4 esquinas.' },
        { id: 'hz_damas_invicto', nombre: 'Intocable', icono: '🛡️', tipo: 'hz_damas_invicto', umbral: 1, descripcion: 'Ganar a las Damas sin perder ninguna ficha.' },
        { id: 'hz_campeon', nombre: 'Campeones del mes', icono: '🏆', tipo: 'hz_campeon', umbral: 1, descripcion: 'Ganar un campeonato del mes.' },
    ];
    if (Array.isArray(window.CATALOGO_LOGROS)) HAZANAS.forEach(h => { if (!window.CATALOGO_LOGROS.some(l => l.id === h.id)) window.CATALOGO_LOGROS.push(h); });

    const terminoAhora = (p, e) => e.fase === 'terminado' && p.fase && p.fase !== 'terminado';
    const DETECTORES = {
        truco(p, e) {
            const res = [];
            if (p.fase === 'jugando' && (e.fase === 'mano_terminada' || e.fase === 'terminado') && p.trucoQueridoNivel === 3) {
                const g = ['nico', 'carito'].find(q => (e.puntajes?.[q] || 0) - (p.puntajes?.[q] || 0) >= 4);
                if (g) res.push(['hz_vale4', g]);
            }
            const nueva = (e.historial || []).filter(h => !(p.historial || []).includes(h));
            nueva.forEach(h => { const m = /^Envido querido: gana (Nico|Carito) con 33/.exec(h); if (m) res.push(['hz_envido33', m[1].toLowerCase()]); });
            if (terminoAhora(p, e) && e.ganadorPartida) {
                const otro = e.ganadorPartida === 'nico' ? 'carito' : 'nico';
                if ((e.puntajes?.[otro] || 0) === 0) res.push(['hz_truco_paliza', e.ganadorPartida]);
            }
            return res;
        },
        escoba(p, e) {
            return [['nico', 'escobasNico'], ['carito', 'escobasCarito']]
                .filter(([, c]) => (e[c] || 0) >= 3 && (p[c] || 0) < 3).map(([q]) => ['hz_3escobas', q]);
        },
        chinchon(p, e) {
            const r = e.resultado;
            return p.fase === 'jugando' && e.fase === 'revelado' && r && r.chinchonPerfecto && r.ganador ? [['hz_chinchon', r.ganador]] : [];
        },
        generala(p, e) {
            const res = [];
            ['nico', 'carito'].forEach(q => {
                const a = (p.planillas || {})[q] || {}, b = (e.planillas || {})[q] || {};
                if (b.generala === 60 && a.generala !== 60) res.push(['hz_generala_servida', q]);
                if (b.doble === 100 && a.doble !== 100) res.push(['hz_doble_generala', q]);
            });
            return res;
        },
        ajedrez(p, e) {
            return terminoAhora(p, e) && e.motivoFin === 'jaque mate' && (e.jugadas || []).length && e.jugadas.length <= 40 && e.ganador ? [['hz_mate_rapido', e.ganador]] : [];
        },
        uno(p, e) {
            const top = (e.descarte || [])[(e.descarte || []).length - 1];
            return terminoAhora(p, e) && e.ganador && top === 'comodin+4' ? [['hz_uno_final4', e.ganador]] : [];
        },
        conecta4(p, e) {
            const l = [...(e.lineaGanadora || [])].sort((a, b) => a - b);
            if (!terminoAhora(p, e) || !e.ganador || e.ganador === 'empate' || l.length < 4) return [];
            const paso = l[1] - l[0];
            return (paso === 6 || paso === 8) && l.every((x, i) => i === 0 || x - l[i - 1] === paso) ? [['hz_c4_diagonal', e.ganador]] : [];
        },
        mentiroso(p, e) {
            if (!terminoAhora(p, e) || !e.ganador) return [];
            return (e[e.ganador === 'nico' ? 'dadosNico' : 'dadosCarito'] || []).length >= 5 ? [['hz_mentiroso_invicto', e.ganador]] : [];
        },
        reversi(p, e) {
            if (!terminoAhora(p, e) || !e.ganador || e.ganador === 'empate') return [];
            return [0, 7, 56, 63].every(i => e.tablero[i] === e.ganador) ? [['hz_reversi_esquinas', e.ganador]] : [];
        },
        damas(p, e) {
            if (!terminoAhora(p, e) || !e.ganador) return [];
            const letra = e.ganador === 'nico' ? 'n' : 'c';
            return (e.tablero || []).filter(x => x && x[0] === letra).length >= 12 ? [['hz_damas_invicto', e.ganador]] : [];
        },
    };
    const previos = {};
    function observar(juego, estado) {
        if (!estado || enCompu() || !DETECTORES[juego]) { delete previos[juego]; return; }
        const p = previos[juego];
        previos[juego] = JSON.parse(JSON.stringify(estado));
        if (!p) return;
        let logradas = [];
        try { logradas = DETECTORES[juego](p, estado); } catch (e) { console.warn('hazañas:', e); }
        logradas.forEach(([tipo, quien]) => {
            if (quien === miIdentidad && typeof window.sumarContadorYVerificarLogros === 'function') window.sumarContadorYVerificarLogros(tipo);
        });
    }

    // ==================== CAMPEONATO ====================
    async function contarVictoria(juegoId, ganador) {
        if (enCompu() || !window.db || (ganador !== 'nico' && ganador !== 'carito')) return;
        const mes = mesActual();
        if (juegoId !== juegoDelMes(mes)) return;
        let campeon = null;
        try {
            await window.runTransaction(window.db, async (tx) => {
                campeon = null;
                const snap = await tx.get(ref());
                const d = snap.exists() ? snap.data() : {};
                const palmares = { ...(d.palmares || {}) };
                // Mes nuevo: si el anterior quedó sin campeón, se guarda cómo terminó.
                if (d.mes && d.mes !== mes && !palmares[d.mes]) palmares[d.mes] = { juego: d.juego, ganador: null, nico: d.victorias?.nico || 0, carito: d.victorias?.carito || 0 };
                const base = d.mes === mes ? d : { mes, juego: juegoId, victorias: { nico: 0, carito: 0 }, ganador: null };
                if (base.ganador) { tx.set(ref(), { ...base, palmares }); return; }
                const v = { nico: base.victorias?.nico || 0, carito: base.victorias?.carito || 0 };
                v[ganador]++;
                let nuevoGanador = null;
                if (v[ganador] >= META_CAMPEONATO) {
                    nuevoGanador = ganador;
                    palmares[mes] = { juego: juegoId, ganador, nico: v.nico, carito: v.carito };
                    campeon = ganador;
                }
                tx.set(ref(), { mes, juego: juegoId, victorias: v, ganador: nuevoGanador, palmares });
            });
            if (campeon) {
                if (typeof window.sumarPuntos === 'function') window.sumarPuntos(campeon, PREMIO_CAMPEONATO);
                if (typeof window.verificarLogroDeValor === 'function') window.verificarLogroDeValor('hz_campeon', 1);
            }
        } catch (e) { console.warn('No se pudo anotar en el campeonato:', e); }
    }
    function envolverRegistrarVictoria() {
        const orig = window.registrarVictoria;
        if (typeof orig !== 'function' || orig._temporadas) return;
        const nueva = function (juegoId, ganador) {
            const r = orig.apply(this, arguments);
            contarVictoria(juegoId, ganador);
            return r;
        };
        nueva._temporadas = true;
        window.registrarVictoria = nueva;
    }

    let estadoCamp = null, ganadorVisto;
    function datosDelMes() {
        const mes = mesActual();
        const d = estadoCamp || {};
        const vigente = d.mes === mes;
        return {
            mes, juego: juegoDelMes(mes),
            victorias: vigente ? (d.victorias || { nico: 0, carito: 0 }) : { nico: 0, carito: 0 },
            ganador: vigente ? d.ganador : null,
            palmares: d.palmares || {}
        };
    }
    function render() {
        const c = datosDelMes();
        const j = infoJuego(c.juego);
        const tarjeta = document.getElementById('campeonato-mes');
        if (tarjeta) {
            const anteriores = Object.entries(c.palmares).filter(([m]) => m !== c.mes).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 4);
            const punto = (q) => `<span class="camp-puntos">${[0, 1, 2].map(i => `<i class="${i < c.victorias[q] ? 'lleno' : ''}"></i>`).join('')}</span>`;
            tarjeta.innerHTML = `<div class="panel campeonato-tarjeta${c.ganador ? ' con-campeon' : ''}">
                <div class="texto-tenue" style="font-size:0.78rem;">🏆 Campeonato de ${nombreMes(c.mes)} · al mejor de 5</div>
                <button class="camp-juego" onclick="abrirJuego('${c.juego}')">${j.icono} ${j.nombre}</button>
                ${c.ganador
                    ? `<div class="camp-campeon">👑 ¡${nombre(c.ganador)} es ${campeonDe(c.ganador)} del mes! <span class="texto-tenue">(+${PREMIO_CAMPEONATO} puntos)</span></div>`
                    : `<div class="camp-marcador"><span>💙 Nico ${punto('nico')}</span><b>${c.victorias.nico} — ${c.victorias.carito}</b><span>${punto('carito')} Carito 💖</span></div>
                       <div class="texto-tenue" style="font-size:0.72rem;">Cada partida de ${j.nombre} que ganen este mes cuenta. El primero en ganar 3 se lleva la copa.</div>`}
                ${anteriores.length ? `<div class="camp-palmares">${anteriores.map(([m, x]) => `<span>${nombreMes(m).slice(0, 3)}: ${x.ganador ? `🏆 ${nombre(x.ganador)}` : 'sin campeón'} <small>${infoJuego(x.juego).icono}</small></span>`).join('')}</div>` : ''}
            </div>`;
        }
        // Aviso dentro del juego del mes.
        document.querySelectorAll('.franja-campeonato').forEach(f => f.remove());
        const fila = document.querySelector(`#pantalla-${c.juego} .fila-superior-juego`);
        if (fila) {
            const f = document.createElement('div');
            f.className = 'franja-campeonato';
            f.innerHTML = c.ganador ? `🏆 Juego del campeonato de ${nombreMes(c.mes)} · ganó ${nombre(c.ganador)}`
                : `🏆 Esta partida cuenta para el campeonato de ${nombreMes(c.mes)} · Nico ${c.victorias.nico} — ${c.victorias.carito} Carito`;
            const despues = fila.parentElement.querySelector('.franja-compu') || fila;
            despues.insertAdjacentElement('afterend', f);
        }
    }
    function escuchar() {
        if (!window.db || !window.onSnapshot) return false;
        envolverRegistrarVictoria();
        const orig = window._onSnapshotSinCompu || window.onSnapshot;
        orig(ref(), (snap) => {
            estadoCamp = snap.exists() ? snap.data() : null;
            const g = datosDelMes().ganador;
            if (ganadorVisto === null && g && window.animJuegos) {
                window.animJuegos.cartel(`🏆 ¡${nombre(g).toUpperCase()} ${campeonDe(g).toUpperCase()}!`, { sub: `Campeonato de ${nombreMes(mesActual())}`, color: g === 'nico' ? '#a8d8ff' : '#ffb3c6', dur: 2400, sonido: 'victoria' });
                if (window.fx) window.fx.confeti(60);
            }
            ganadorVisto = g || null;
            render();
        }, () => render());
        return true;
    }
    function arrancar() {
        render();
        if (escuchar()) return;
        let intentos = 0;
        const t = setInterval(() => { if (escuchar() || ++intentos > 60) clearInterval(t); }, 500);
    }

    window.temporadas = { observar, juegoDelMes, contarVictoria };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', arrancar);
    else arrancar();
})();
