// ============================================================
// nivel-pareja.js — Nivel de pareja: experiencia compartida que sube
// jugando juntos (contra la compu no cuenta). Cada partida terminada,
// ronda revelada o sueño cumplido suma XP para los dos; los niveles
// tienen nombre y desbloquean diseños de mesa (ajustes-juego.js).
// Doc juegos/nivel: { xp, hoy: {fecha, xp}, claves: [últimas sumas, para no contar dos veces] }
// ============================================================
(function () {
    const NIVELES = [
        { xp: 0, nombre: 'Recién conocidos', icono: '🌱' },
        { xp: 100, nombre: 'Primera cita', icono: '🌷' },
        { xp: 250, nombre: 'Compañeros de juego', icono: '🎲' },
        { xp: 500, nombre: 'Dúo dinámico', icono: '⚡' },
        { xp: 900, nombre: 'Cómplices', icono: '🤞' },
        { xp: 1400, nombre: 'Equipo invencible', icono: '🛡️' },
        { xp: 2100, nombre: 'Almas gemelas', icono: '💞' },
        { xp: 3000, nombre: 'Leyendas del amor', icono: '👑' },
    ];
    // Lo que desbloquea cada nivel (los diseños viven en ajustes-juego.js).
    const PREMIOS = { 3: '🏖️ Mesa Playa', 5: '🍂 Mesa Otoño', 7: '💘 Mesa San Valentín', 8: '✨ Mesa Dorada' };
    const XP_EVENTO = { reflexion_completada: 6, sueno_cumplido: 25, cuidado_compartido: 3 };
    const XP_PARTIDA = 10, TOPE_DIARIO = 300;
    const ref = () => window.doc(window.db, 'juegos', 'nivel');
    const enCompu = () => typeof window.modoCompu === 'function' && !!window.modoCompu();
    let datos = null, nivelVisto = null;

    function nivelDe(xp) {
        let i = 0;
        NIVELES.forEach((n, k) => { if (xp >= n.xp) i = k; });
        return i + 1;
    }
    function hoy() { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; }

    // clave: evita que la misma partida sume dos veces (si la registran los dos celus).
    async function sumar(cant, clave) {
        if (enCompu() || !window.db || !window.runTransaction || !cant) return;
        try {
            await window.runTransaction(window.db, async (tx) => {
                const s = await tx.get(ref());
                const d = s.exists() ? s.data() : { xp: 0 };
                const claves = d.claves || [];
                if (clave && claves.includes(clave)) return;
                const dia = d.hoy && d.hoy.fecha === hoy() ? d.hoy : { fecha: hoy(), xp: 0 };
                const suma = Math.max(0, Math.min(cant, TOPE_DIARIO - dia.xp));
                if (!suma) return;
                tx.set(ref(), { xp: (d.xp || 0) + suma, hoy: { fecha: dia.fecha, xp: dia.xp + suma }, claves: clave ? [...claves, clave].slice(-30) : claves });
            });
        } catch (e) { console.warn('No se pudo sumar XP:', e); }
    }
    function envolver(nombreFn, alLlamar) {
        const orig = window[nombreFn];
        if (typeof orig !== 'function' || orig._nivel) return false;
        const nueva = function () { const r = orig.apply(this, arguments); try { alLlamar.apply(null, arguments); } catch (e) { /* nada */ } return r; };
        Object.keys(orig).forEach(k => { nueva[k] = orig[k]; });
        nueva._nivel = true;
        window[nombreFn] = nueva;
        return true;
    }

    function render() {
        const cont = document.getElementById('nivel-pareja');
        if (!cont) return;
        const xp = (datos && datos.xp) || 0, n = nivelDe(xp), actual = NIVELES[n - 1], sig = NIVELES[n];
        const pct = sig ? Math.round((xp - actual.xp) * 100 / (sig.xp - actual.xp)) : 100;
        const proximo = Object.keys(PREMIOS).map(Number).find(k => k > n);
        cont.innerHTML = `<div class="panel nivel-tarjeta">
            <div class="nivel-cabeza"><span class="nivel-icono">${actual.icono}</span>
                <div><div class="texto-tenue" style="font-size:0.75rem;">Nivel de pareja ${n}</div><b>${actual.nombre}</b></div>
                <span class="nivel-xp">${xp} XP</span></div>
            <div class="progreso-orden"><div style="width:${pct}%"></div></div>
            <div class="texto-tenue" style="font-size:0.75rem;">${sig ? `Faltan ${sig.xp - xp} XP para ${sig.icono} ${sig.nombre}` : '¡Llegaron al nivel máximo! 👑'}${proximo ? ` · En el nivel ${proximo}: ${PREMIOS[proximo]}` : ''}</div>
        </div>`;
    }
    function escuchar() {
        if (!window.db || !window.onSnapshot) return false;
        const orig = window._onSnapshotSinCompu || window.onSnapshot;
        orig(ref(), (snap) => {
            datos = snap.exists() ? snap.data() : { xp: 0 };
            const n = nivelDe(datos.xp || 0);
            if (nivelVisto !== null && n > nivelVisto) {
                const nv = NIVELES[n - 1];
                if (window.animJuegos && window.animJuegos.cartel) window.animJuegos.cartel(`${nv.icono} ¡NIVEL ${n}!`, { sub: `${nv.nombre}${PREMIOS[n] ? ' · Desbloquearon ' + PREMIOS[n] : ''}`, color: '#f5d9a0', dur: 2600, sonido: 'victoria' });
                if (window.fx) window.fx.confeti(80);
                if (window.guardarMomento) window.guardarMomento({ id: 'nivel-' + n, icono: nv.icono, titulo: `Llegaron al nivel ${n}: ${nv.nombre}`, sub: PREMIOS[n] ? `Desbloquearon ${PREMIOS[n]}` : '' });
            }
            nivelVisto = n;
            render();
        }, () => render());
        return true;
    }
    function arrancar() {
        render();
        // registrarVictoria: toda partida terminada (con o sin ganador).
        envolver('registrarVictoria', (juego) => sumar(XP_PARTIDA, `p-${juego}-${Math.floor(Date.now() / 30000)}`));
        envolver('registrarEvento', (tipo) => { if (XP_EVENTO[tipo]) sumar(XP_EVENTO[tipo], `e-${tipo}-${Math.floor(Date.now() / 30000)}`); });
        if (escuchar()) return;
        let k = 0;
        const t = setInterval(() => { if (escuchar() || ++k > 60) clearInterval(t); }, 500);
    }

    window.nivelPareja = { nivel: () => nivelDe((datos && datos.xp) || 0), xp: () => (datos && datos.xp) || 0, sumar, NIVELES, PREMIOS };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', arrancar);
    else arrancar();
})();
