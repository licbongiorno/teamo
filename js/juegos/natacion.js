// ==================== CARRERA DE NATACIÓN (en vivo) ====================
// Una pileta de 25 m vista desde arriba, ida y vuelta (50 m). Se nada
// tocando ◀ y ▶ alternados, con ritmo: una brazada a tiempo empuja más,
// apurarse cansa y tocar dos veces el mismo lado te frena. Al llegar a la
// pared hay que tocar 🔄 para dar la vuelta (si te la comés, perdés un
// segundo). Gana el primero en tocar la pared del final; se guarda el
// récord de la pareja. Cada uno simula su nadador y manda los metros.
const W_NT = 240, H_NT = 352, LARGO_NT = 25, TOTAL_NT = 50, Y0_NT = 326, Y1_NT = 30;
const NT = { canvas: null, ctx: null, enlace: null, loop: null, estado: null, clave: null, yo: null, el: null, teclas: {}, antes: {}, ultimoEnvio: 0, ultimoTs: 0, llegue: false };

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
    n.vuelta = true; n.d = LARGO_NT; n.v += 0.8; avisoNt(n, '¡Vueltón! 🔄', t);
    return true;
}
function moverNt(n, dt, t){
    const seg = dt / 60;
    n.v = Math.max(0, n.v - n.v * 1.2 * seg);
    n.d += n.v * seg;
    // Se comió la pared: un segundo quieto y da la vuelta igual.
    if (!n.vuelta && n.d >= LARGO_NT) { n.d = LARGO_NT; n.v = 0; n.vuelta = true; n.frenado = t + 1000; avisoNt(n, '¡Pum! Contra la pared', t); return 'pared'; }
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
            else { const r = brazadaNt(n, k, t); vibrarJ(r === 'mal' ? 25 : 6); if (window.sfx) window.sfx[r === 'mal' ? 'error' : 'toque'](); }
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
    if (quien === miIdentidad) { if (NT.llegue) return; NT.llegue = true; if (window.sfx) window.sfx.victoria(); NT.enlace && NT.enlace.enviar('meta', { c: NT.clave }, true); }
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
    const t = Date.now();
    c.fillStyle = '#d9e6ea'; c.fillRect(0, 0, W_NT, H_NT);
    // Agua
    const x0 = 22, x1 = W_NT - 22, carril = (x1 - x0) / 2;
    c.fillStyle = '#3fa9d8'; c.fillRect(x0, Y1_NT - 10, x1 - x0, Y0_NT - Y1_NT + 20);
    c.strokeStyle = 'rgba(255,255,255,0.18)'; c.lineWidth = 1;
    for (let i = 0; i < 9; i++) { const y = Y1_NT + ((i * 37 + t / 40) % (Y0_NT - Y1_NT)); c.beginPath(); c.moveTo(x0, y); c.quadraticCurveTo(x0 + carril, y + 4, x1, y); c.stroke(); }
    // Líneas del fondo y corcheras
    c.fillStyle = 'rgba(20,60,110,0.4)'; c.fillRect(x0 + carril / 2 - 2, Y1_NT + 6, 4, Y0_NT - Y1_NT - 12); c.fillRect(x0 + carril * 1.5 - 2, Y1_NT + 6, 4, Y0_NT - Y1_NT - 12);
    for (let y = Y1_NT - 10; y < Y0_NT + 10; y += 8) { c.fillStyle = (y / 8) % 2 ? '#e8496b' : '#fff'; c.fillRect(x0 + carril - 2, y, 4, 6); }
    c.fillStyle = '#9fb3ba'; c.fillRect(x0 - 4, Y1_NT - 14, x1 - x0 + 8, 4); c.fillRect(x0 - 4, Y0_NT + 10, x1 - x0 + 8, 4);
    // Banderines a 5 m de cada pared
    c.fillStyle = '#f5d36b'; for (const y of [yNt(LARGO_NT - 5), yNt(5)]) for (let x = x0; x < x1; x += 10) { c.beginPath(); c.moveTo(x, y); c.lineTo(x + 5, y + 4); c.lineTo(x + 10, y); c.fill(); }
    const nadador = (n, carrilI, gorra) => {
        if (!n) return;
        const d = n.rd != null ? n.rd : n.d, cx = x0 + carril * (carrilI + 0.5), cy = yNt(d), sube = d < LARGO_NT ? -1 : 1;
        c.fillStyle = 'rgba(255,255,255,0.35)'; c.beginPath(); c.ellipse(cx, cy - sube * 10, 12, 5, 0, 0, Math.PI * 2); c.fill();
        // Brazos: el último que remó va adelante.
        const fase = Math.min(1, (t - (n.tBrazadaReal || 0)) / 350);
        c.strokeStyle = '#f2c9a0'; c.lineWidth = 3; c.lineCap = 'round';
        for (const lado of [-1, 1]) {
            const adelante = lado === (n.brazo || 1) ? 1 - fase : fase;
            c.beginPath(); c.moveTo(cx + lado * 6, cy); c.lineTo(cx + lado * 11, cy + sube * (4 + 12 * adelante)); c.stroke();
        }
        c.fillStyle = '#2a4a66'; c.beginPath(); c.ellipse(cx, cy - sube * 10, 6, 12, 0, 0, Math.PI * 2); c.fill();
        c.fillStyle = gorra; c.beginPath(); c.arc(cx, cy, 6.5, 0, Math.PI * 2); c.fill();
        c.fillStyle = 'rgba(255,255,255,0.7)'; c.fillRect(cx - 4, cy - 1, 8, 2);
    };
    const yoCol = miIdentidad === 'nico' ? '#3d8bfd' : '#e8496b', elCol = miIdentidad === 'nico' ? '#e8496b' : '#3d8bfd';
    if (NT.el) { const o = NT.el; if (!o.bot && o.d != null) o.rd = o.rd == null ? o.d : o.rd + (o.d + (o.vd || 0) * Math.min(0.15, (performance.now() - (o.t || 0)) / 1000) - o.rd) * 0.35; nadador(o, 1, elCol); }
    nadador(NT.yo, 0, yoCol);
    // Arriba: metros, tiempo y puesto
    const yo = NT.yo, ahora = VivoComun.reloj('natacion'), falta = e.inicio - ahora;
    c.fillStyle = 'rgba(20,16,30,0.6)'; c.fillRect(0, 0, W_NT, 16);
    c.fillStyle = '#fff'; c.font = 'bold 9px monospace';
    const seg = Math.max(0, (NT.llegue ? (NT.tLlegada || ahora) : ahora) - e.inicio) / 1000;
    if (yo) c.fillText(`${yo.d.toFixed(1)} / ${TOTAL_NT} m · ⏱ ${seg.toFixed(1)} s${NT.el ? (yo.d >= (NT.el.d || 0) ? ' · 1°' : ' · 2°') : ''}`, 5, 11);
    if (e.record) { c.textAlign = 'right'; c.fillText(`🏅 ${(e.record.t / 1000).toFixed(1)}s`, W_NT - 14, 11); c.textAlign = 'left'; }
    // Compás: la barrita se pone verde cuando es buen momento para la próxima brazada.
    if (yo && falta <= 0 && !NT.llegue) {
        const inter = ahora - (yo.tBrazada || 0), bien = inter >= 300 && inter <= 550;
        c.fillStyle = 'rgba(20,16,30,0.5)'; c.fillRect(W_NT / 2 - 40, H_NT - 12, 80, 6);
        c.fillStyle = bien ? '#4cd18a' : inter < 300 ? '#f5d36b' : '#9fb3ba'; c.fillRect(W_NT / 2 - 40, H_NT - 12, Math.min(80, inter / 550 * 80), 6);
        if (!yo.vuelta && yo.d > LARGO_NT - 2.5) { c.fillStyle = '#fff'; c.textAlign = 'center'; c.font = 'bold 12px monospace'; c.fillText('¡Tocá 🔄!', W_NT / 2, H_NT / 2); c.textAlign = 'left'; }
        if (yo.aviso && ahora - yo.tAviso < 1200) { c.fillStyle = '#2a1f33'; c.textAlign = 'center'; c.font = 'bold 9px monospace'; c.fillText(yo.aviso, W_NT / 2, H_NT - 18); c.textAlign = 'left'; }
    }
    if (e.fase === 'jugando' && falta > 0) { c.fillStyle = 'rgba(20,16,30,0.5)'; c.fillRect(0, H_NT / 2 - 24, W_NT, 40); c.fillStyle = '#fff'; c.textAlign = 'center'; c.font = 'bold 22px monospace'; c.fillText(String(Math.ceil(falta / 1000)), W_NT / 2, H_NT / 2 + 2); c.font = '8px monospace'; c.fillText('◀ ▶ alternados, con ritmo · 🔄 en la pared', W_NT / 2, H_NT / 2 + 12); c.textAlign = 'left'; }
    else if (NT.llegue && e.fase === 'jugando') { c.fillStyle = '#2a1f33'; c.textAlign = 'center'; c.font = 'bold 14px monospace'; c.fillText('🏁 ¡Tocaste la pared!', W_NT / 2, H_NT / 2); c.textAlign = 'left'; }
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
        NT.enlace.enviar('p', { d: +NT.yo.d.toFixed(2), v: +NT.yo.v.toFixed(2), b: NT.yo.brazo, tb: Math.round(NT.yo.tBrazada || 0), c: NT.clave });
    }
    if (NT.estado && NT.estado.fase === 'jugando') VivoComun.cuenta('NT', NT.estado.inicio);
    dibujarNt();
    NT.loop = requestAnimationFrame(bucleNt);
}
function arrancarNt(){
    if (!NT.canvas) {
        NT.canvas = document.createElement('canvas');
        NT.canvas.width = W_NT; NT.canvas.height = H_NT;
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
                    Object.assign(o, { d: d.d, vd: d.v, brazo: d.b, tb: d.tb, t: performance.now(), visto: Date.now() });
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
