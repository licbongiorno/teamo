// ==================== PAC-NEÓN DE A DOS (cooperativo en vivo) ====================
// Un Pac-Man para los dos al mismo tiempo, cada uno desde su celu, en un
// laberinto distinto en cada nivel (js/juegos/pacman/pm-laberinto.js).
//
//  - Rescate: si un fantasma te atrapa quedás CAUTIVO (casi sin poder
//    moverte) y aparece un Núcleo de Rescate en el laberinto. Tu pareja tiene
//    10 segundos para agarrarlo y liberarte. Si no llega, o si la atrapan a
//    ella también, recién ahí se pierde una vida (son 3, compartidas).
//  - Píldora vinculada: si uno se come una píldora, los DOS quedan con poder
//    para comer fantasmas, unidos por un hilo de energía.
//  - Dash cooperativo: si se chocan entre ustedes, los dos salen disparados un ratito.
//  - Puntaje de pareja (puntos + fantasmas de los dos) y Tabla de Clasificación de Parejas.
//
// Módulos (js/juegos/pacman/): pm-laberinto (MazeGenerator), pm-entidades
// (movimiento e IA), pm-dibujo (Renderer), pm-entrada (InputHandler),
// pm-red (NetworkManager) y pm-ranking. El sonido es js/audio-arcade.js
// (AudioManager compartido) y los efectos js/fx-vivo.js.
// El estado general (nivel, semilla, vidas, fin) va en Firestore con
// JuegoTurnos; lo que se mueve va por la conexión directa.
(function () {
    const T = PMDibujo.T, PX = T; // las posiciones viajan en "píxeles" (casilla × 16): así el túnel se ve como salto
    const COLORES = [{ color: '#5ad1ff', oscuro: '#1a6f9a' }, { color: '#ff6bd5', oscuro: '#9a1f7a' }];
    const CICLO = [7, 20, 7, 20, 5, 20, 5, 1e9]; // segundos: disperso, caza, disperso, caza…
    const PM = {
        canvas: null, rend: null, fx: null, red: null, entrada: null, loop: null, ultimoTs: 0,
        estado: null, clave: null, lab: null, host: false, jYo: 0, pacs: [], fantasmas: [], ghostsVistos: [],
        modoI: 0, modoT: 0, power: 0, powerTotal: 7000, combo: 0, core: null, puntos: 0, vidas: 3, nivel: 1, comidos: 0,
        hitstop: 0, resetHasta: 0, ultimaPos: 0, ultimaFoto: 0, ultimoPuntos: 0, lote: [], fin: false, sonidoT: {}, cartel: null,
    };
    window._pacman = PM; // para pruebas
    const sonar = (n, o) => window.AudioArcade && AudioArcade.sfx(n, o);
    const reloj = () => VivoComun.reloj('pacman');
    const jDe = (q) => q === 'nico' ? 0 : 1;
    const distancia = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

    // ---------- Nivel ----------
    function cargarNivel(e) {
        PM.clave = e.semilla + ':' + e.nivel + ':' + e.clave;
        PM.lab = PMLaberinto.generar(e.semilla);
        PM.host = e.host === miIdentidad;
        PM.jYo = jDe(miIdentidad);
        PM.nivel = e.nivel; PM.vidas = e.vidas; PM.puntos = e.puntos || 0; PM.comidos = e.comidos || 0;
        PM.power = 0; PM.combo = 0; PM.core = null; PM.hitstop = 0; PM.resetHasta = 0; PM.lote = []; PM.fin = false; PM.modoI = 0; PM.modoT = 0;
        PM.powerTotal = Math.max(3000, 7000 - (e.nivel - 1) * 600);
        PM.pacs = [0, 1].map(j => ({ j, x: 0, y: 0, dir: [0, 0], quiere: null, cautivo: false, inv: 0, dash: 0, cdDash: 0, ...COLORES[j] }));
        ponerEnSalida();
        PM.fantasmas = PMEnt.crearFantasmas(PM.lab);
        PM.ghostsVistos = []; // el invitado los ve recién con la primera foto del anfitrión
        if (PM.red) PM.red.clave = PM.clave;
        if (PM.fx) PM.fx.limpiar();
    }
    function ponerEnSalida() {
        PM.pacs.forEach(p => { const [x, y] = PM.lab.salidas[p.j]; Object.assign(p, { x, y, tx: null, ty: null, dir: [p.j ? 1 : -1, 0], quiere: null, cautivo: false, dash: 0 }); });
        PM.pacs[1 - PM.jYo].net = {}; // lo que llega por la red del otro Pac (en "píxeles")
    }
    const velocidades = () => {
        const n = PM.nivel - 1;
        return { pac: Math.min(8, 6.6 * (1 + 0.04 * n)), caza: Math.min(7.6, 6 * (1 + 0.05 * n)), asustado: 3.6, ojos: 13, tunel: 3.4 };
    };

    // ---------- Mi Pac (en los dos celus, sin esperar a la red) ----------
    function pasoMio(dt) {
        const p = PM.pacs[PM.jYo], v = velocidades();
        p.inv = Math.max(0, p.inv - dt * 1000); p.dash = Math.max(0, p.dash - dt * 1000); p.cdDash = Math.max(0, p.cdDash - dt * 1000);
        const vel = v.pac * (p.dash > 0 ? 1.6 : 1) * (p.cautivo ? 0.12 : 1);
        PMEnt.darVuelta(p);
        const x0 = p.x, y0 = p.y;
        PMEnt.mover(PM.lab, p, vel, dt, (e) => PMEnt.elegirPac(PM.lab, e));
        p.quieto = Math.abs(p.x - x0) + Math.abs(p.y - y0) < 1e-4;
        if (p.cautivo) return;
        // Comer: cuando pasa cerca del centro de una casilla
        const cx = Math.round(p.x), cy = Math.round(p.y);
        if (Math.abs(p.x - cx) + Math.abs(p.y - cy) < 0.45) {
            const k = ((cy * PM.lab.W) + ((cx + PM.lab.W) % PM.lab.W));
            if (PM.lab.puntos.has(k)) { PM.lab.puntos.delete(k); sonar('waka'); if (PM.host) { PM.puntos += 10; PM.lote.push(k); } else PM.red && PM.red.comer(k); }
            if (PM.lab.pildoras.has(k)) { PM.lab.pildoras.delete(k); efectoPildora(cx, cy); if (PM.host) { PM.puntos += 50; PM.lote.push(k); activarPoder(); } else PM.red && PM.red.comer(k); }
        }
        // Dash cooperativo: si se chocan entre ustedes
        const o = PM.pacs[1 - PM.jYo], op = posOtro();
        if (op && !o.cautivo && p.cdDash <= 0 && Math.hypot(op[0] - p.x, op[1] - p.y) < 0.85) {
            p.dash = 1200; p.cdDash = 3200;
            sonar('sinergia'); vibrar(15);
            PM.fx && PM.fx.particulas({ x: (p.x + 0.5) * T, y: (p.y + 0.5) * T, n: 16, color: ['#5ad1ff', '#ff6bd5', '#ffffff'], vel: 3, vida: 450, grav: 0, tam: 2.2 });
            PM.fx && PM.fx.texto((p.x + 0.5) * T, p.y * T - 4, '¡DASH!', { tam: 10, color: '#fff' });
        }
    }
    // Dónde está el otro (en casillas), para el dash y para el anfitrión.
    function posOtro() {
        const n = PM.pacs[1 - PM.jYo].net;
        if (!n || n.x == null) return null;
        return [n.x / PX, n.y / PX];
    }

    // ---------- Anfitrión: fantasmas, colisiones, rescate, vidas ----------
    function activarPoder() {
        PM.power = PM.powerTotal; PM.combo = 0;
        PM.fantasmas.forEach(f => { if (f.estado === 'caza') { f.estado = 'asustado'; if (f.dir) { f.tx = f.tx - f.dir[0]; f.ty = f.ty - f.dir[1]; f.dir = [-f.dir[0], -f.dir[1]]; } } });
        PM.red && PM.red.evento('poder', {});
        sonar('pildora'); sonar('sinergia');
    }
    function pacsParaIA() {
        const yo = PM.pacs[PM.jYo], o = PM.pacs[1 - PM.jYo], op = posOtro();
        const lista = [{ j: yo.j, x: Math.round(yo.x), y: Math.round(yo.y), dir: yo.dir, cautivo: yo.cautivo }];
        if (op) lista.push({ j: o.j, x: Math.round(op[0]), y: Math.round(op[1]), dir: o.dirR || [0, 0], cautivo: o.cautivo });
        return lista;
    }
    function pasoHost(dt) {
        const v = velocidades();
        if (PM.power > 0) {
            PM.power -= dt * 1000;
            if (PM.power <= 0) { PM.power = 0; PM.combo = 0; PM.fantasmas.forEach(f => { if (f.estado === 'asustado') f.estado = 'caza'; }); }
        } else {
            PM.modoT += dt;
            if (PM.modoT > CICLO[PM.modoI]) { PM.modoT = 0; PM.modoI = Math.min(CICLO.length - 1, PM.modoI + 1); PM.fantasmas.forEach(f => { if (f.estado === 'caza' && f.dir && f.tx != null) { f.tx -= f.dir[0]; f.ty -= f.dir[1]; f.dir = [-f.dir[0], -f.dir[1]]; } }); }
        }
        const modo = PM.modoI % 2 === 0 ? 'disperso' : 'caza';
        PMEnt.pensarFantasmas(PM.lab, PM.fantasmas, pacsParaIA(), dt, modo, v);
        // El otro Pac: su posición la manda su celu
        const o = PM.pacs[1 - PM.jYo], op = posOtro();
        o.inv = Math.max(0, o.inv - dt * 1000);
        const todos = [{ p: PM.pacs[PM.jYo], x: PM.pacs[PM.jYo].x, y: PM.pacs[PM.jYo].y }];
        if (op) todos.push({ p: o, x: op[0], y: op[1] });
        for (const { p, x, y } of todos) for (const f of PM.fantasmas) {
            if (f.estado === 'casa' || f.estado === 'ojos') continue;
            if (Math.hypot(f.x - x, f.y - y) > 0.62) continue;
            if (f.estado === 'asustado') comerFantasma(f);
            else if (!p.cautivo && p.inv <= 0 && PM.resetHasta <= reloj()) atrapar(p);
        }
        // Núcleo de rescate
        if (PM.core) {
            PM.core.resto -= dt * 1000;
            const libre = todos.find(t => !t.p.cautivo);
            if (libre && Math.hypot(libre.x - PM.core.x, libre.y - PM.core.y) < 0.7) rescatar();
            else if (PM.core.resto <= 0) perderVida('⌛ No llegó el rescate');
        }
        // ¿Nivel limpio?
        if (!PM.lab.puntos.size && !PM.lab.pildoras.size && !PM.pasandoNivel) siguienteNivel();
    }
    function comerFantasma(f) {
        f.estado = 'ojos'; PM.combo++;
        const pts = 200 * Math.pow(2, Math.min(3, PM.combo - 1));
        PM.puntos += pts; PM.comidos++;
        const d = { x: f.x, y: f.y, pts };
        PM.red && PM.red.evento('fantasma', d);
        efectoFantasma(d);
    }
    function atrapar(p) {
        const otro = PM.pacs[1 - p.j];
        if (otro.cautivo) { p.cautivo = true; perderVida('💥 ¡Los atraparon a los dos!'); return; }
        p.cautivo = true;
        // El núcleo aparece lejos del cautivo, en un pasillo con punto o vacío (no en la casa)
        const libres = [];
        for (let y = 1; y < PM.lab.H - 1; y++) for (let x = 1; x < PM.lab.W - 1; x++) if (PM.lab.m[y][x] === 1) { const d = Math.abs(x - Math.round(p.j === PM.jYo ? p.x : posOtro()[0])) + Math.abs(y - Math.round(p.j === PM.jYo ? p.y : posOtro()[1])); if (d > 7) libres.push([x, y]); }
        const [cx, cy] = libres[Math.floor(Math.random() * libres.length)] || PM.lab.casa.afuera;
        PM.core = { x: cx, y: cy, resto: 10000 };
        const d = { j: p.j, x: cx, y: cy };
        PM.red && PM.red.evento('atrapado', d);
        efectoAtrapado(d);
    }
    function rescatar() {
        PM.core = null;
        PM.pacs.forEach(p => { p.cautivo = false; p.inv = 2200; });
        PM.puntos += 100;
        PM.red && PM.red.evento('rescate', {});
        efectoRescate();
    }
    function perderVida(porque) {
        if (PM.resetHasta > reloj()) return;
        PM.core = null; PM.power = 0; PM.combo = 0;
        PM.vidas--;
        const hasta = reloj() + 2600, d = { vidas: PM.vidas, hasta, porque };
        PM.red && PM.red.evento('vida', d);
        efectoVida(d);
        if (PM.vidas <= 0) { finPartida(); return; }
        PM.fantasmas = PMEnt.crearFantasmas(PM.lab);
    }
    async function siguienteNivel() {
        PM.pasandoNivel = true;
        const bonus = 500 * PM.nivel;
        PM.puntos += bonus;
        PM.red && PM.red.evento('nivel', { bonus });
        efectoNivel({ bonus });
        const clave = PM.clave, puntos = PM.puntos, vidas = PM.vidas, comidos = PM.comidos;
        await PacmanJ.accionEnCola((e) => {
            if (e.semilla + ':' + e.nivel + ':' + e.clave !== clave) return null;
            return { nivel: e.nivel + 1, semilla: Math.floor(Math.random() * 1e9), puntos, vidas: Math.min(5, vidas + (e.nivel % 3 === 0 ? 1 : 0)), comidos, inicio: reloj() + 3200 };
        });
        PM.pasandoNivel = false;
    }
    async function finPartida() {
        if (PM.fin) return;
        PM.fin = true;
        const clave = PM.clave, puntos = PM.puntos, nivel = PM.nivel, comidos = PM.comidos;
        setTimeout(() => PacmanJ.accionEnCola((e) => {
            if (e.semilla + ':' + e.nivel + ':' + e.clave !== clave) return null;
            return { ganador: 'empate', motivo: `Puntaje de pareja: ${puntos.toLocaleString('es-AR')} · llegaron al nivel ${nivel} · ${comidos} fantasmas`, puntos, nivel, comidos };
        }), 1800);
    }
    // La foto que el anfitrión le manda al otro (en "píxeles" de casilla × 16)
    function foto() {
        const yo = PM.pacs[PM.jYo], r = (n) => Math.round(n * PX * 10) / 10;
        return {
            h: [r(yo.x), r(yo.y), yo.dir[0], yo.dir[1], yo.dash > 0 ? 1 : 0],
            g: PM.fantasmas.map(f => [r(f.x), r(f.y + (f.yv || 0)), f.estado, f.dir ? f.dir[0] : 0, f.dir ? f.dir[1] : 0]),
            pw: Math.round(PM.power), pt: PM.powerTotal, cap: PM.pacs.map(p => p.cautivo ? 1 : 0), inv: PM.pacs.map(p => Math.round(p.inv)),
            core: PM.core ? [PM.core.x, PM.core.y, Math.round(PM.core.resto)] : 0, sc: PM.puntos, v: PM.vidas,
        };
    }

    // ---------- Invitado: lo que llega del anfitrión ----------
    function alFoto(s) {
        const o = PM.pacs[1 - PM.jYo];
        o.net = VivoComun.recibir(o.net, { x: s.h[0], y: s.h[1] });
        o.dirR = [s.h[2], s.h[3]]; o.dashR = s.h[4];
        s.g.forEach((g, i) => { const f = PM.ghostsVistos[i] || (PM.ghostsVistos[i] = {}); VivoComun.recibir(f, { x: g[0], y: g[1] }); f.estado = g[2]; f.dir = [g[3], g[4]]; f.color = PMEnt.DATOS[i].color; });
        PM.power = s.pw; PM.powerTotal = s.pt; PM.puntos = s.sc; PM.vidas = s.v;
        PM.core = s.core ? { x: s.core[0], y: s.core[1], resto: s.core[2] } : null;
        PM.pacs.forEach((p, j) => { p.cautivo = !!s.cap[j]; if (j === PM.jYo) p.inv = Math.max(p.inv, s.inv[j]); });
    }
    function alPos(d) {
        const o = PM.pacs[1 - PM.jYo];
        o.net = VivoComun.recibir(o.net, { x: d.x, y: d.y });
        o.dirR = [d.dx, d.dy]; o.dashR = d.dsh;
    }
    // Lo que se comió el otro (el anfitrión valida y suma)
    function alComer(k) {
        if (!PM.host) return;
        if (PM.lab.puntos.has(k)) { PM.lab.puntos.delete(k); PM.puntos += 10; }
        else if (PM.lab.pildoras.has(k)) { PM.lab.pildoras.delete(k); PM.puntos += 50; const x = k % PM.lab.W, y = (k / PM.lab.W) | 0; efectoPildora(x, y); activarPoder(); }
    }
    function alPuntos(l) { l.forEach(k => { if (PM.lab.pildoras.has(k)) { const x = k % PM.lab.W, y = (k / PM.lab.W) | 0; efectoPildora(x, y); } PM.lab.puntos.delete(k); PM.lab.pildoras.delete(k); }); }
    function alEvento(k, d) {
        if (k === 'fantasma') efectoFantasma(d);
        if (k === 'atrapado') efectoAtrapado(d);
        if (k === 'rescate') efectoRescate();
        if (k === 'vida') efectoVida(d);
        if (k === 'nivel') efectoNivel(d);
        if (k === 'poder') { sonar('pildora'); sonar('sinergia'); }
    }

    // ---------- Efectos (iguales en los dos celus) ----------
    const vibrar = (p) => typeof vibrarJ === 'function' && vibrarJ(p);
    function efectoPildora(x, y) {
        const fx = PM.fx; if (!fx) return;
        fx.particulas({ x: (x + 0.5) * T, y: (y + 0.5) * T, n: 24, color: ['#fff3b0', '#5ad1ff', '#ff6bd5'], vel: 3.2, vida: 600, grav: 0, tam: 2.2 });
        fx.onda((x + 0.5) * T, (y + 0.5) * T, { color: 'rgba(255,240,180,0.9)', radio: 40, vida: 500 });
    }
    function efectoFantasma(d) {
        PM.hitstop = 100; // congelamiento de 0,1 s
        sonar('comeFantasma'); vibrar(20);
        const fx = PM.fx; if (!fx) return;
        fx.particulas({ x: (d.x + 0.5) * T, y: (d.y + 0.5) * T, n: 18, color: ['#3a5bff', '#9fb4ff', '#ffffff'], vel: 3, vida: 500, grav: 0, tam: 2 });
        fx.texto((d.x + 0.5) * T, d.y * T, String(d.pts), { tam: 11, color: '#7dd8ff' });
        fx.temblor(2.5, 160);
    }
    function efectoAtrapado(d) {
        sonar('atrapado'); vibrar([40, 40, 40]);
        const fx = PM.fx;
        if (fx) { fx.temblor(5, 380); fx.flash('rgba(255,60,90,0.3)', 200); }
        const mia = d.j === PM.jYo;
        PM.cartel = { texto: mia ? '¡Te atraparon!' : `¡Atraparon a ${nombreJugador(d.j === 0 ? 'nico' : 'carito')}!`, sub: mia ? 'Esperá el rescate…' : '¡Agarrá el núcleo verde! Tenés 10 segundos', color: '#ff8fa3', hasta: performance.now() + 1800, desde: performance.now() };
    }
    function efectoRescate() {
        sonar('rescate'); vibrar([20, 30, 20]);
        const fx = PM.fx;
        if (fx) PM.pacs.forEach(p => { const pos = p.j === PM.jYo ? [p.x, p.y] : (posOtroDibujo() || [p.x, p.y]); fx.particulas({ x: (pos[0] + 0.5) * T, y: (pos[1] + 0.5) * T, n: 26, color: ['#7dffc8', '#ffffff', p.color], vel: 3.4, vida: 700, grav: 0, tam: 2.3 }); fx.estrellitas((pos[0] + 0.5) * T, (pos[1] + 0.5) * T, 8, ['#7dffc8', '#fff']); });
        PM.cartel = { texto: '💚 ¡Rescate!', color: '#7dffc8', hasta: performance.now() + 1200, desde: performance.now() };
    }
    function efectoVida(d) {
        sonar('derrota'); vibrar([60, 40, 60]);
        PM.resetHasta = d.hasta; PM.vidas = d.vidas;
        if (PM.fx) { PM.fx.temblor(7, 500); PM.fx.flash('rgba(255,40,70,0.35)', 260); }
        PM.cartel = { texto: d.vidas > 0 ? `💔 Perdieron una vida` : '💀 Sin vidas', sub: d.porque, color: '#ff6b9a', hasta: performance.now() + 2400, desde: performance.now() };
        if (d.vidas > 0) setTimeout(() => { if (PM.lab) { PM.pacs[PM.jYo].tx = null; ponerEnSalida(); PM.pacs.forEach(p => { p.cautivo = false; p.inv = 1500; }); } }, 900);
    }
    function efectoNivel(d) {
        sonar('nivel');
        if (PM.fx) PM.fx.confeti(PM.lab.W * T / 2, PM.lab.H * T / 2, 70);
        PM.cartel = { texto: `🏁 ¡Nivel ${PM.nivel} completo!`, sub: `+${d.bonus} de bonus · se arma un laberinto nuevo…`, color: '#ffe9b8', hasta: performance.now() + 2800, desde: performance.now() };
    }
    function posOtroDibujo() { const n = PM.pacs[1 - PM.jYo].net; if (!n || n.x == null) return null; const pos = VivoComun.suave(n); return pos ? [pos[0] / PX, pos[1] / PX] : null; }

    // ---------- Bucle ----------
    function bucle(ts) {
        const pantalla = document.getElementById('pantalla-pacman');
        if (!pantalla || !pantalla.classList.contains('activa')) { parar(); return; }
        PM.loop = requestAnimationFrame(bucle);
        const dt = Math.min(0.05, (ts - (PM.ultimoTs || ts)) / 1000 || 0.016);
        PM.ultimoTs = ts;
        const e = PM.estado;
        // Al entrar o salir del encuadre cambia el lugar disponible
        const enc = document.body.classList.contains('encuadre');
        if (enc !== PM.encAnt) { PM.encAnt = enc; setTimeout(() => PM.rend && PM.rend.medir(), 60); setTimeout(() => PM.rend && PM.rend.medir(), 400); }
        try {
            if (e && e.fase === 'jugando' && PM.lab && !VivoComun.pausa('pacman')) {
                const quieto = reloj() < Math.max(e.inicio || 0, PM.resetHasta) || PM.fin;
                if (PM.hitstop > 0) PM.hitstop -= dt * 1000;
                else if (!quieto) {
                    pasoMio(dt);
                    if (PM.host) pasoHost(dt);
                }
                enviar(quieto);
                sonidosDeFondo();
            }
            dibujar();
        } catch (err) { if (!PM.errorAvisado) { PM.errorAvisado = true; console.error('pacman:', err); } }
    }
    function enviar(quieto) {
        const ahora = performance.now(), yo = PM.pacs[PM.jYo];
        if (!PM.red) return;
        if (PM.host) {
            if (ahora - PM.ultimaFoto > 66) { PM.ultimaFoto = ahora; PM.red.foto(foto()); }
            if (PM.lote.length && ahora - PM.ultimoPuntos > 100) { PM.ultimoPuntos = ahora; PM.red.puntos(PM.lote.splice(0)); }
        } else if (ahora - PM.ultimaPos > 50) {
            PM.ultimaPos = ahora;
            PM.red.pos({ x: Math.round(yo.x * PX * 10) / 10, y: Math.round(yo.y * PX * 10) / 10, dx: yo.dir[0], dy: yo.dir[1], dsh: yo.dash > 0 ? 1 : 0 });
        }
    }
    function sonidosDeFondo() {
        const ahora = performance.now(), st = PM.sonidoT;
        if (PM.pacs.some(p => p.cautivo)) { if (ahora - (st.latido || 0) > 720) { st.latido = ahora; sonar('latido'); } }
        else if (!PM.power && ahora - (st.sirena || 0) > 520) { st.sirena = ahora; sonar('sirena'); }
    }
    function dibujar() {
        if (!PM.lab || !PM.rend) return;
        const e = PM.estado, t = performance.now();
        const yo = PM.pacs[PM.jYo], o = PM.pacs[1 - PM.jYo], op = posOtroDibujo();
        const pacs = [{ ...yo, mio: true, dash: yo.dash > 0 }];
        if (op) pacs.push({ ...o, x: op[0], y: op[1], dir: o.dirR || o.dir, dash: !!o.dashR, quieto: false });
        const fantasmas = PM.host ? PM.fantasmas : PM.ghostsVistos.filter(f => f.x != null).map(f => { const pos = VivoComun.suave(f); return { ...f, x: pos[0] / PX, y: pos[1] / PX }; });
        let cartel = null;
        const falta = e && e.fase === 'jugando' ? (e.inicio || 0) - reloj() : 0;
        if (falta > 0) { const n = Math.ceil(falta / 1000); cartel = { texto: n > 3 ? '¡Listos!' : String(n), sub: `Nivel ${PM.nivel} · deslizá el dedo para girar`, k: 1 - (falta % 1000) / 1000, color: '#ffe9b8' }; }
        else if (PM.cartel && t < PM.cartel.hasta) cartel = { ...PM.cartel, k: (t - PM.cartel.desde) / 400 };
        PM.rend.dibujar({ lab: PM.lab, pacs, fantasmas, power: PM.power, powerTotal: PM.powerTotal, core: PM.core, fx: PM.fx, hud: { puntos: PM.puntos, vidas: PM.vidas, nivel: PM.nivel }, cartel });
        const c = PM.canvas.getContext('2d'), esc = PM.rend.escala;
        c.setTransform(esc, 0, 0, esc, 0, 0);
        VivoComun.estado(c, PM.lab.W * T, PM.lab.H * T + PMDibujo.HUD, PM.red && PM.red.enlace, nombreJugador(miRival), !!(e && e.fase === 'jugando' && falta < -800));
        if (VivoComun.pausa('pacman')) VivoComun.cartelPausa(c);
    }
    function arrancar() {
        PM.fx = PM.fx || FxVivo.crear({ max: 260 });
        if (!PM.canvas) {
            PM.canvas = document.createElement('canvas');
            PM.canvas.className = 'lienzo-pacman';
            PM.rend = PMDibujo.crear(PM.canvas);
            PM.entrada = PMEntrada.crear(PM.canvas, (d) => { const p = PM.pacs[PM.jYo]; if (p) { p.quiere = d; vibrar(4); } }, () => document.getElementById('pantalla-pacman')?.classList.contains('activa'));
            window.addEventListener('resize', () => setTimeout(() => PM.rend && PM.rend.medir(), 100));
        }
        if (!PM.red) { PM.red = PMRed.conectar({ alPos, alFoto, alEvento, alComer, alPuntos }); PM.red.clave = PM.clave; }
        if (!PM.loop) { PM.ultimoTs = 0; PM.loop = requestAnimationFrame(bucle); }
        window._unsubLoopPacman = parar;
    }
    function parar() {
        if (PM.loop) cancelAnimationFrame(PM.loop);
        PM.loop = null;
        if (PM.red) PM.red.cerrar();
        PM.red = null;
    }

    // ---------- Ranking ----------
    let cortarRanking = null, ranking = [];
    const esc = (t) => String(t).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
    function htmlRanking() {
        if (ranking == null) return '<div class="texto-tenue">No se pudo leer el ranking.</div>';
        if (!ranking.length) return '<div class="texto-tenue">Todavía no hay récords. ¡Sean los primeros!</div>';
        return `<ol class="mv-ranking">${ranking.map((r, i) => `<li><span class="pos">${['🥇', '🥈', '🥉'][i] || i + 1}</span><span class="eq">${esc(r.equipo)}</span><span class="md">N${r.nivel || 1}</span><b>${(r.puntos || 0).toLocaleString('es-AR')}</b></li>`).join('')}</ol>`;
    }
    function escucharRanking() {
        if (cortarRanking || !window.PMRanking) return;
        cortarRanking = PMRanking.escuchar((filas) => { ranking = filas; document.querySelectorAll('.pm-tabla').forEach(el => { el.innerHTML = htmlRanking(); }); });
    }
    window.guardarRankingPacman = async function () {
        const e = PM.estado, input = document.getElementById('pm-equipo'), caja = document.getElementById('pm-guardar');
        if (!e || !input) return;
        const equipo = input.value.trim() || 'Pareja sin nombre';
        try { localStorage.setItem('pmEquipo', equipo); } catch (_) { /* nada */ }
        caja.innerHTML = '<div class="texto-tenue">Guardando…</div>';
        try {
            await PMRanking.guardar(`p-${e.clave}-${e.semilla}`, { equipo, puntos: e.puntos, nivel: e.nivel, fantasmas: e.comidos });
            caja.innerHTML = '<div class="texto-tenue">✅ ¡Récord guardado!</div>';
            sonar('sinergia'); if (window.fx && window.fx.confeti) window.fx.confeti();
        } catch (err) { caja.innerHTML = '<div class="texto-tenue">⚠️ No se pudo guardar. Probá de nuevo.</div>'; }
    };
    const equipoGuardado = () => { try { return localStorage.getItem('pmEquipo'); } catch (_) { return null; } };

    const PacmanJ = JuegoTurnos.crear({
        id: 'pacman',
        sinTurno: true,
        emojiListo: '🟡',
        intro: 'Un Pac-Man de a dos, cada uno desde su celu y en un laberinto nuevo cada nivel. Si un fantasma atrapa a uno, el otro tiene 10 segundos para agarrar el Núcleo de Rescate 💚. La píldora les da poder a los dos, y si se chocan entre ustedes salen disparados. ¡Cómanse todos los puntos!',
        inicial: () => ({ semilla: Math.floor(Math.random() * 1e9), nivel: 1, vidas: 3, puntos: 0, comidos: 0, host: miIdentidad, clave: Math.random().toString(36).slice(2, 7), inicio: window.ahoraSync() + 4200, turno: null }),
        extraEspera: () => { setTimeout(escucharRanking, 0); return `<div class="mv-sub2" style="margin-top:12px;">🏆 Tabla de Clasificación de Parejas</div><div class="pm-tabla">${htmlRanking()}</div>`; },
        tituloFin: () => '👾 ¡Fin de la partida!',
        render(e) {
            if (e.fase === 'terminado') {
                setTimeout(escucharRanking, 0);
                return `<div class="panel texto-centro"><div class="mv-total">Puntaje de Pareja<br><b>${(e.puntos || 0).toLocaleString('es-AR')}</b></div>
                    <div id="pm-guardar"><input id="pm-equipo" class="input-buscador" maxlength="24" style="margin:8px 0;" value="${esc(equipoGuardado() || `${nombreJugador('nico')} & ${nombreJugador('carito')}`)}" placeholder="Nombre del equipo"><button class="btn-principal" onclick="guardarRankingPacman()">💾 Guardar récord</button></div>
                    <div class="mv-sub2">🏆 Tabla de Clasificación de Parejas</div><div class="pm-tabla">${htmlRanking()}</div></div>`;
            }
            return `<div id="pacman-host"></div><div class="texto-centro texto-tenue" style="font-size:0.75rem;">Vos sos ${miIdentidad === 'nico' ? 'el azul' : 'la rosa'} · deslizá el dedo (o flechas) y doblás solo en la próxima esquina</div>`;
        },
        alDibujar(cont, e) {
            PM.estado = e;
            const host = cont.querySelector('#pacman-host');
            if (!host) return;
            VivoComun.montar('pacman', PacmanJ, host, e, { area: '.lienzo-pacman' });
            if (PM.clave !== e.semilla + ':' + e.nivel + ':' + e.clave) cargarNivel(e);
            if (e.fase === 'jugando') arrancar();
            if (PM.canvas) { host.appendChild(PM.canvas); PM.rend.medir(); }
        }
    });
})();
