// ==================== CARRERA DE NATACIÓN (en vivo) ====================
// Una pileta de 25 m vista desde arriba, ida y vuelta (50 m). Se nada
// tocando ◀ y ▶ alternados, con ritmo: una brazada a tiempo empuja más,
// apurarse cansa y tocar dos veces el mismo lado te frena. Al llegar a la
// pared hay que tocar 🔄 para dar la vuelta (si te la comés, perdés un
// segundo). Gana el primero en tocar la pared del final; se guarda el
// récord de la pareja. Cada uno simula su nadador y manda los metros.
const W_NT = 240, H_NT = 352, LARGO_NT = 25, TOTAL_NT = 50, Y0_NT = 326, Y1_NT = 30;
const NT = { canvas: null, ctx: null, enlace: null, loop: null, estado: null, clave: null, yo: null, el: null, teclas: {}, antes: {}, ultimoEnvio: 0, ultimoTs: 0, llegue: false, fx: null, vis: {} };

const compuNt = () => { const m = typeof window.modoCompu === 'function' && window.modoCompu(); return m && m.juego === 'natacion' ? m : null; };
const nadadorNt = () => ({ d: 0, v: 0, lado: null, tBrazada: 0, vuelta: false, frenado: 0, brazo: 0, aviso: '', tAviso: 0 });
function reiniciarNt(e){
    NT.clave = e.clave;
    NT.yo = nadadorNt();
    NT.el = compuNt() ? Object.assign(nadadorNt(), { bot: true, prox: 0 }) : null;
    NT.llegue = false; NT.antes = {};
}
// Una brazada: calidad según el ritmo (el compás ideal es una cada 0,3–0,55 s).
function brazadaNt(n, lado, t){
    if (t < n.frenado) return;
    const inter = t - (n.tBrazada || 0);
    n.brazo = lado === 'izq' ? -1 : 1;
    if (lado === n.lado) { n.v *= 0.6; avisoNt(n, '¡Alterná los brazos!', t); n.tBrazada = t; return 'mal'; }
    const calidad = inter < 180 ? 0.3 : inter < 300 ? 0.55 : inter <= 550 ? 1 : inter <= 900 ? 0.8 : 0.65;
    n.v += 0.95 * calidad;
    n.lado = lado; n.tBrazada = t;
    if (calidad === 1) avisoNt(n, '', t);
    else if (inter < 300) avisoNt(n, 'Más tranqui, con ritmo', t);
    return calidad === 1 ? 'bien' : 'meh';
}
function avisoNt(n, txt, t){ n.aviso = txt; n.tAviso = t; }
function vueltaNt(n, t){
    if (n.vuelta || n.d < LARGO_NT - 2.5) return false;
    n.vuelta = true; n.d = LARGO_NT; n.v += 0.8; avisoNt(n, '¡Vueltón! 🔄', t); n.vueltaT = performance.now(); n.vueltaBuena = true;
    return true;
}
function moverNt(n, dt, t){
    const seg = dt / 60;
    n.v = Math.max(0, n.v - n.v * 1.2 * seg);
    n.d += n.v * seg;
    // Se comió la pared: un segundo quieto y da la vuelta igual.
    if (!n.vuelta && n.d >= LARGO_NT) { n.d = LARGO_NT; n.v = 0; n.vuelta = true; n.frenado = t + 1000; avisoNt(n, '¡Pum! Contra la pared', t); n.vueltaT = performance.now(); n.vueltaBuena = false; return 'pared'; }
    if (n.d >= TOTAL_NT) { n.d = TOTAL_NT; return 'meta'; }
}
function pasoNt(dt){
    const e = NT.estado, n = NT.yo;
    if (!e || e.fase !== 'jugando' || !n) return;
    const t = VivoComun.reloj('natacion');
    if (t < e.inicio) return;
    // Bordes de los botones: cada apretada es una brazada.
    for (const k of ['izq', 'der', 'vuelta']) {
        const ahora = !!NT.teclas[k];
        if (ahora && !NT.antes[k] && !NT.llegue) {
            if (k === 'vuelta') { if (vueltaNt(n, t) && window.sfx) window.sfx.acierto(); }
            else { const r = brazadaNt(n, k, t); vibrarJ(r === 'mal' ? 25 : 6); if (!(r !== 'mal' && window.sonarArcade && sonarArcade('chapuzon')) && window.sfx) window.sfx[r === 'mal' ? 'error' : 'toque'](); }
        }
        NT.antes[k] = ahora;
    }
    if (!NT.llegue) {
        const r = moverNt(n, dt, t);
        if (r === 'pared') { vibrarJ([30, 30]); if (window.sfx) window.sfx.error(); }
        if (r === 'meta') llegarNt();
    }
    const compu = compuNt();
    if (compu && NT.el) pensarCompuNt(NT.el, compu.nivel, dt, t);
}
// La compu nada con un compás fijo según el nivel (y a veces se equivoca).
function pensarCompuNt(n, nivel, dt, t){
    const c = { facil: { cada: 560, var: 160, error: 0.1, vuelta: 0.6 }, normal: { cada: 440, var: 70, error: 0.04, vuelta: 0.85 }, dificil: { cada: 380, var: 30, error: 0.01, vuelta: 1 } }[nivel] || { cada: 440, var: 70, error: 0.04, vuelta: 0.85 };
    if (n.llego) return;
    if (t >= (n.prox || 0)) {
        const lado = Math.random() < c.error ? (n.lado || 'izq') : (n.lado === 'izq' ? 'der' : 'izq');
        brazadaNt(n, lado, t);
        n.prox = t + c.cada + (Math.random() - 0.5) * c.var * 2;
    }
    if (!n.vuelta && n.d > LARGO_NT - 1.6 && n.d < LARGO_NT - 0.3 && Math.random() < c.vuelta * 0.2) vueltaNt(n, t);
    if (moverNt(n, dt, t) === 'meta') { n.llego = true; llegarNt(miRival); }
}
async function llegarNt(quien = miIdentidad){
    if (quien === miIdentidad) { if (NT.llegue) return; NT.llegue = true; if (window.sfx) window.sfx.victoria(); NT.enlace && NT.enlace.enviar('meta', { c: NT.clave }, true); if (NT.fx) { NT.fx.confeti(W_NT / 4 + 11, Y0_NT, 50); NT.fx.salpicadura(W_NT / 4 + 11, Y0_NT, undefined, 20, -Math.PI / 2); } }
    const clave = NT.clave, tiempo = VivoComun.reloj('natacion') - NT.estado.inicio;
    await Natacion.accionEnCola((e) => {
        if (e.clave !== clave) return null;
        const rec = e.record, nuevo = !rec || tiempo < rec.t;
        return { ganador: quien, motivo: `${nombreJugador(quien)} tocó primero la pared: ${(tiempo / 1000).toFixed(2)} s${nuevo ? ' · 🏅 ¡Récord de la pareja!' : ` · récord: ${(rec.t / 1000).toFixed(2)} s`}`, record: nuevo ? { t: Math.round(tiempo), q: quien } : rec };
    });
}
// Metros → altura en la pileta (de ida sube, de vuelta baja).
const yNt = (d) => d <= LARGO_NT ? Y0_NT - (d / LARGO_NT) * (Y0_NT - Y1_NT) : Y1_NT + ((d - LARGO_NT) / LARGO_NT) * (Y0_NT - Y1_NT);
function dibujarNt(){
    const c = NT.ctx, e = NT.estado;
    if (!c || !e) return;
    c.setTransform(2, 0, 0, 2, 0, 0);
    const t = Date.now(), pt = performance.now(), fx = NT.fx;
    if (fx) fx.antes(c);
    // Borde de la pileta con baldosas
    c.fillStyle = '#e4eef1'; c.fillRect(-10, -10, W_NT + 20, H_NT + 20);
    c.fillStyle = '#d2e0e5'; for (let y = 0; y < H_NT; y += 12) for (let x = (y / 12) % 2 ? 0 : 6; x < W_NT; x += 12) c.fillRect(x, y, 6, 6);
    const x0 = 22, x1 = W_NT - 22, carril = (x1 - x0) / 2, yTop = Y1_NT - 10, alto = Y0_NT - Y1_NT + 20;
    // Agua con degradé y reflejos que se mueven (cáusticas)
    const ga = c.createLinearGradient(0, yTop, 0, yTop + alto); ga.addColorStop(0, '#2f9fd6'); ga.addColorStop(1, '#46b6e3');
    c.fillStyle = ga; c.fillRect(x0, yTop, x1 - x0, alto);
    c.save(); c.beginPath(); c.rect(x0, yTop, x1 - x0, alto); c.clip();
    c.strokeStyle = 'rgba(255,255,255,0.16)'; c.lineWidth = 1.2;
    for (let i = 0; i < 14; i++) {
        const y = yTop + ((i * 29 + pt / 45) % alto);
        c.beginPath();
        for (let x = x0; x <= x1; x += 8) c.lineTo(x, y + Math.sin(x / 14 + pt / 500 + i) * 3);
        c.stroke();
    }
    // Líneas del fondo con la T al final
    c.fillStyle = 'rgba(15,55,105,0.45)';
    for (const k of [0, 1]) { const cx = x0 + carril * (k + 0.5); c.fillRect(cx - 2, Y1_NT + 6, 4, Y0_NT - Y1_NT - 12); c.fillRect(cx - 8, Y1_NT + 6, 16, 3); c.fillRect(cx - 8, Y0_NT - 9, 16, 3); }
    c.restore();
    // Corchera del medio que flota
    for (let y = yTop; y < yTop + alto; y += 7) { const bob = Math.sin(y / 9 + pt / 300) * 0.8; c.fillStyle = Math.floor(y / 7) % 3 === 0 ? '#e8496b' : Math.floor(y / 7) % 3 === 1 ? '#fff' : '#3d8bfd'; c.beginPath(); c.ellipse(x0 + carril + bob, y + 3, 3, 3.2, 0, 0, Math.PI * 2); c.fill(); }
    c.fillStyle = '#9fb3ba'; c.fillRect(x0 - 4, Y1_NT - 14, x1 - x0 + 8, 4); c.fillRect(x0 - 4, Y0_NT + 10, x1 - x0 + 8, 4);
    // Banderines a 5 m de cada pared (se mueven con el viento)
    for (const y of [yNt(LARGO_NT - 5), yNt(5)]) {
        c.strokeStyle = 'rgba(80,80,80,0.6)'; c.lineWidth = 0.6; c.beginPath(); c.moveTo(x0 - 6, y); c.lineTo(x1 + 6, y); c.stroke();
        for (let x = x0 - 4; x < x1 + 4; x += 10) { const v = Math.sin(x / 7 + pt / 200) * 1.2; c.fillStyle = (x / 10) % 2 < 1 ? '#f5d36b' : '#e8496b'; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 5 + v, y + 5); c.lineTo(x + 10, y); c.fill(); }
    }
    const nadador = (clave, n, carrilI, gorra, d) => {
        if (!n) return;
        const cx = x0 + carril * (carrilI + 0.5), cy = yNt(d), sube = d < LARGO_NT ? -1 : 1;
        const v = NT.vis[clave] || (NT.vis[clave] = { tb: 0, vt: 0, burb: 0 });
        // Una brazada nueva: salpica la mano que entra al agua.
        if (n.tBrazadaReal && n.tBrazadaReal !== v.tb) { v.tb = n.tBrazadaReal; fx && fx.salpicadura(cx + (n.brazo || 1) * 10, cy + sube * 12, undefined, 7, sube < 0 ? -Math.PI / 2 : Math.PI / 2); }
        // La vuelta: giro con espuma (o el golpe contra la pared).
        if (n.vueltaT && n.vueltaT !== v.vt) {
            v.vt = n.vueltaT;
            if (fx) { fx.salpicadura(cx, Y1_NT, undefined, 18, Math.PI / 2); fx.onda(cx, Y1_NT + 6, { radio: 22, vida: 600, achatar: 0.5 }); if (n.vueltaBuena) fx.texto(cx, Y1_NT + 26, '¡Vueltón!', { tam: 11, color: '#fff' }); else { fx.texto(cx, Y1_NT + 26, '¡PUM!', { tam: 13, color: '#ffd23a' }); if (clave === 'yo') fx.temblor(4, 300); } }
        }
        // Burbujitas detrás mientras nada rápido
        const vel = n.v || 0;
        if (fx && vel > 0.6 && pt - v.burb > 140 - Math.min(100, vel * 40)) { v.burb = pt; fx.burbujas(cx + (Math.random() - 0.5) * 6, cy - sube * 22, 1); }
        // Estela (la V que deja en el agua)
        c.strokeStyle = `rgba(255,255,255,${Math.min(0.45, vel * 0.2)})`; c.lineWidth = 1.2;
        c.beginPath(); c.moveTo(cx - 10, cy - sube * 30); c.lineTo(cx, cy - sube * 6); c.lineTo(cx + 10, cy - sube * 30); c.stroke();
        const giro = n.vueltaT ? Math.min(1, (pt - n.vueltaT) / 380) : 1;
        c.save(); c.translate(cx, cy);
        if (giro < 1) c.rotate(giro * Math.PI * (n.vueltaBuena ? 1 : 0.15));
        else if (sube > 0) c.rotate(Math.PI);
        // Cuerpo bajo el agua (más claro y ondulado)
        const ond = Math.sin(pt / 120) * 0.8;
        c.fillStyle = 'rgba(30,60,90,0.55)'; c.beginPath(); c.ellipse(ond, 12, 6, 13, 0, 0, Math.PI * 2); c.fill();
        // Piernas que patalean
        const pat = Math.sin(pt / 70) * 2.5 * Math.min(1, vel + 0.2);
        c.strokeStyle = 'rgba(242,201,160,0.75)'; c.lineWidth = 2.4; c.lineCap = 'round';
        c.beginPath(); c.moveTo(-2.5, 22); c.lineTo(-3 + pat, 30); c.stroke();
        c.beginPath(); c.moveTo(2.5, 22); c.lineTo(3 - pat, 30); c.stroke();
        // Brazos: el último que remó va adelante, el otro vuelve por arriba.
        const fase = Math.min(1, (t - (n.tBrazadaReal || 0)) / 380);
        c.strokeStyle = '#f2c9a0'; c.lineWidth = 3;
        for (const lado of [-1, 1]) {
            const adelante = lado === (n.brazo || 1) ? 1 - FxVivo.suave(fase) : FxVivo.suave(fase);
            c.beginPath(); c.moveTo(lado * 6, 2); c.quadraticCurveTo(lado * 12, -4 * adelante, lado * 5, -(6 + 12 * adelante)); c.stroke();
        }
        // Cabeza con gorra y antiparras
        c.fillStyle = gorra; c.beginPath(); c.arc(0, 0, 6.5, 0, Math.PI * 2); c.fill();
        c.fillStyle = 'rgba(255,255,255,0.5)'; c.beginPath(); c.arc(-2, -2.5, 2, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#20262e'; c.fillRect(-5, -1.2, 10, 2.4); c.fillStyle = '#7fe0ff'; c.fillRect(-4, -0.8, 3, 1.6); c.fillRect(1, -0.8, 3, 1.6);
        c.restore();
        // Aro de agua alrededor de la cabeza
        c.strokeStyle = 'rgba(255,255,255,0.5)'; c.lineWidth = 1; c.beginPath(); c.ellipse(cx, cy, 9 + Math.sin(pt / 160) * 1.2, 7, 0, 0, Math.PI * 2); c.stroke();
    };
    const yoCol = miIdentidad === 'nico' ? '#3d8bfd' : '#e8496b', elCol = miIdentidad === 'nico' ? '#e8496b' : '#3d8bfd';
    if (NT.el) {
        const o = NT.el;
        let d = o.d || 0;
        if (!o.bot) { const pos = VivoComun.suave(o); if (pos) d = Math.max(0, Math.min(TOTAL_NT, pos[0])); }
        o.rd = d;
        nadador('el', o, 1, elCol, d);
    }
    if (NT.yo) nadador('yo', NT.yo, 0, yoCol, NT.yo.d);
    if (fx) fx.dibujar(c);
    // Arriba: metros, tiempo y puesto (con barrita de progreso de cada uno)
    const yo = NT.yo, ahora = VivoComun.reloj('natacion'), falta = e.inicio - ahora;
    c.fillStyle = 'rgba(20,16,30,0.7)'; c.fillRect(0, 0, W_NT, 18);
    const barra = (d, col, y) => { c.fillStyle = 'rgba(255,255,255,0.15)'; c.fillRect(150, y, 70, 2.5); c.fillStyle = col; c.fillRect(150, y, 70 * d / TOTAL_NT, 2.5); };
    if (yo) barra(yo.d, yoCol, 5);
    if (NT.el) barra(NT.el.rd || 0, elCol, 10);
    c.fillStyle = '#fff'; c.font = 'bold 9px monospace';
    const seg = Math.max(0, (NT.llegue ? (NT.tLlegada || ahora) : ahora) - e.inicio) / 1000;
    if (yo) c.fillText(`${yo.d.toFixed(1)}m · ⏱${seg.toFixed(1)}s${NT.el ? (yo.d >= (NT.el.rd || 0) ? ' · 1°' : ' · 2°') : ''}`, 5, 12);
    if (e.record) { c.textAlign = 'right'; c.font = '7px monospace'; c.fillText(`🏅 ${(e.record.t / 1000).toFixed(1)}s`, W_NT - 4, 26); c.textAlign = 'left'; }
    // Compás: la barrita se pone verde cuando es buen momento para la próxima brazada.
    if (yo && falta <= 0 && !NT.llegue) {
        const inter = ahora - (yo.tBrazada || 0), bien = inter >= 300 && inter <= 550;
        c.fillStyle = 'rgba(20,16,30,0.55)'; c.beginPath(); c.roundRect ? c.roundRect(W_NT / 2 - 44, H_NT - 14, 88, 9, 4) : c.rect(W_NT / 2 - 44, H_NT - 14, 88, 9); c.fill();
        c.fillStyle = 'rgba(76,209,138,0.35)'; c.fillRect(W_NT / 2 - 42 + 84 * 300 / 900, H_NT - 12, 84 * 250 / 900, 5);
        c.fillStyle = bien ? '#4cd18a' : inter < 300 ? '#f5d36b' : '#9fb3ba'; c.fillRect(W_NT / 2 - 42, H_NT - 12, Math.min(84, inter / 900 * 84), 5);
        if (bien) { c.strokeStyle = 'rgba(76,209,138,0.9)'; c.lineWidth = 1; c.strokeRect(W_NT / 2 - 45, H_NT - 15, 90, 11); }
        if (!yo.vuelta && yo.d > LARGO_NT - 2.5) {
            const pulso = 1 + Math.sin(pt / 90) * 0.12;
            c.save(); c.translate(W_NT / 2, H_NT / 2); c.scale(pulso, pulso); c.fillStyle = '#fff'; c.strokeStyle = 'rgba(20,16,30,0.6)'; c.lineWidth = 3; c.textAlign = 'center'; c.font = 'bold 14px monospace'; c.strokeText('¡Tocá 🔄!', 0, 0); c.fillText('¡Tocá 🔄!', 0, 0); c.restore();
        }
        if (yo.aviso && ahora - yo.tAviso < 1200) { c.fillStyle = '#2a1f33'; c.textAlign = 'center'; c.font = 'bold 9px monospace'; c.fillText(yo.aviso, W_NT / 2, H_NT - 20); c.textAlign = 'left'; }
    }
    if (e.fase === 'jugando' && falta > 0) {
        const n = Math.ceil(falta / 1000), k = 1 - (falta % 1000) / 1000, esc = FxVivo.rebote(Math.min(1, k * 3));
        c.fillStyle = 'rgba(20,16,30,0.45)'; c.fillRect(0, H_NT / 2 - 28, W_NT, 48);
        c.save(); c.translate(W_NT / 2, H_NT / 2 - 4); c.scale(esc, esc); c.fillStyle = '#fff'; c.textAlign = 'center'; c.font = 'bold 26px monospace'; c.fillText(String(n), 0, 6); c.restore();
        c.fillStyle = '#fff'; c.textAlign = 'center'; c.font = '8px monospace'; c.fillText('◀ ▶ alternados, con ritmo · 🔄 en la pared', W_NT / 2, H_NT / 2 + 14); c.textAlign = 'left';
    } else if (NT.llegue && e.fase === 'jugando') { c.fillStyle = '#2a1f33'; c.textAlign = 'center'; c.font = 'bold 14px monospace'; c.fillText('🏁 ¡Tocaste la pared!', W_NT / 2, H_NT / 2); c.textAlign = 'left'; }
    if (fx) fx.despues(c);
    VivoComun.estado(c, W_NT, H_NT, NT.enlace, nombreJugador(miRival), e.fase === 'jugando' && falta < -500 && !NT.llegue);
}
function bucleNt(ts){
    const pantalla = document.getElementById('pantalla-natacion');
    if (!pantalla || !pantalla.classList.contains('activa')) { pararNt(); return; }
    if (VivoComun.pausa('natacion')) { NT.ultimoTs = 0; dibujarNt(); VivoComun.cartelPausa(NT.ctx); NT.loop = requestAnimationFrame(bucleNt); return; }
    const dt = Math.min(2.5, (ts - (NT.ultimoTs || ts)) / 16.67 || 1);
    NT.ultimoTs = ts;
    const antes = NT.yo && NT.yo.tBrazada;
    pasoNt(dt);
    if (NT.yo && NT.yo.tBrazada !== antes) NT.yo.tBrazadaReal = Date.now();
    if (NT.el && NT.el.bot && NT.el.tBrazada !== NT.el._tb) { NT.el._tb = NT.el.tBrazada; NT.el.tBrazadaReal = Date.now(); }
    if (NT.llegue && !NT.tLlegada) NT.tLlegada = VivoComun.reloj('natacion');
    if (NT.enlace && NT.yo && Date.now() - NT.ultimoEnvio > 60) {
        NT.ultimoEnvio = Date.now();
        NT.enlace.enviar('p', { d: +NT.yo.d.toFixed(2), v: +NT.yo.v.toFixed(2), b: NT.yo.brazo, tb: Math.round(NT.yo.tBrazada || 0), vu: NT.yo.vuelta ? (NT.yo.vueltaBuena ? 1 : 2) : 0, c: NT.clave });
    }
    if (NT.estado && NT.estado.fase === 'jugando') VivoComun.cuenta('NT', NT.estado.inicio);
    dibujarNt();
    NT.loop = requestAnimationFrame(bucleNt);
}
function arrancarNt(){
    NT.fx = NT.fx || FxVivo.crear();
    if (!NT.canvas) {
        NT.canvas = document.createElement('canvas');
        NT.canvas.width = W_NT * 2; NT.canvas.height = H_NT * 2; // a 2x: nítido en celus
        NT.canvas.className = 'lienzo-natacion';
        NT.ctx = NT.canvas.getContext('2d');
        NT.controles = VivoComun.botones([[{ k: 'izq', txt: '◀', aria: 'Brazo izquierdo' }, { k: 'der', txt: '▶', aria: 'Brazo derecho' }], { k: 'vuelta', txt: '🔄', clase: 'salto', aria: 'Dar la vuelta' }], NT.teclas);
    }
    if (!NT.teclado) NT.teclado = VivoComun.teclado('pantalla-natacion', { ArrowLeft: 'izq', KeyA: 'izq', ArrowRight: 'der', KeyD: 'der', Space: 'vuelta', ArrowUp: 'vuelta', KeyW: 'vuelta' }, NT.teclas);
    if (!NT.enlace && !compuNt()) {
        NT.enlace = EnlaceVivo.conectar('natacion', {
            alMensaje(t, d) {
                if (d.c !== NT.clave) return;
                if (t === 'p') {
                    const o = NT.el || (NT.el = {});
                    if (o.tb !== d.tb) o.tBrazadaReal = Date.now();
                    if (d.vu && !o.vuelta) { o.vueltaT = performance.now(); o.vueltaBuena = d.vu === 1; }
                    // Los metros pasan por la misma interpolación que las posiciones de los otros juegos.
                    VivoComun.recibir(o, { x: d.d, y: 0 });
                    Object.assign(o, { d: d.d, vd: d.v, v: d.v, brazo: d.b, tb: d.tb, vuelta: !!d.vu });
                }
            }
        });
    }
    if (!NT.loop) NT.loop = requestAnimationFrame(bucleNt);
    window._unsubLoopNatacion = pararNt;
}
function pararNt(){
    if (NT.loop) cancelAnimationFrame(NT.loop);
    NT.loop = null;
    if (NT.enlace) NT.enlace.cerrar();
    NT.enlace = null; Object.keys(NT.teclas).forEach(k => { NT.teclas[k] = false; });
}

const Natacion = JuegoTurnos.crear({
    id: 'natacion',
    sinTurno: true,
    emojiListo: '🏊',
    compu: { paso: () => null }, // la compu nada adentro del bucle (pensarCompuNt)
    conservar: ['record'],
    intro: 'Carrera de natación en vivo, 50 m (ida y vuelta): tocá ◀ y ▶ alternados y con ritmo para nadar (apurarse cansa, repetir brazo frena). En la pared, ¡tocá 🔄 para dar la vuelta! Gana el primero en tocar la pared del final.',
    inicial: (previo) => ({ record: (previo && previo.record) || null, clave: Math.random().toString(36).slice(2, 7), inicio: window.ahoraSync() + 3000, turno: null }),
    render() { return `<div id="natacion-host"></div><div class="texto-centro texto-tenue" style="font-size:0.75rem;">Tu andarivel es el de la izquierda. Seguí el compás: la barrita de abajo se pone verde.</div>`; },
    alDibujar(cont, e) {
        NT.estado = e;
        const host = cont.querySelector('#natacion-host');
        if (!host) return;
        VivoComun.montar('natacion', Natacion, host, e);
        if (NT.clave !== e.clave) reiniciarNt(e);
        if (e.fase === 'jugando') { arrancarNt(); host.appendChild(NT.canvas); host.appendChild(NT.controles); }
        else if (NT.canvas) { host.appendChild(NT.canvas); dibujarNt(); }
    }
});
window._natacion = NT; // para pruebas
