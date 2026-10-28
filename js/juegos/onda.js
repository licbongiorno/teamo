// ==================== LA ONDA ====================
// Cooperativo, tipo Wavelength. En cada ronda uno es "el de la pista":
// ve una escala (de "frío" a "caliente") y dónde está el blanco, y
// escribe una pista. El otro mueve el dial adonde cree que cae. Cuanto
// más cerca, más puntos suman entre los dos. Se turnan durante 8 rondas.
const RONDAS_ONDA = 8;
const ESCALAS_ONDA = [
    ['Frío', 'Caliente'], ['Aburrido', 'Divertido'], ['Barato', 'Caro'], ['Fácil', 'Difícil'], ['Feo', 'Lindo'],
    ['Silencioso', 'Ruidoso'], ['Salado', 'Dulce'], ['Antiguo', 'Moderno'], ['Inútil', 'Útil'], ['Tranquilo', 'Estresante'],
    ['Romántico', 'Nada romántico'], ['Mala idea', 'Buena idea'], ['Para la mañana', 'Para la noche'], ['Infantil', 'Adulto'],
    ['Sobrevalorado', 'Subestimado'], ['Muy común', 'Muy raro'], ['Sano', 'Insano'], ['Triste', 'Feliz'], ['Pequeño', 'Enorme'],
    ['Lento', 'Rápido'], ['Suave', 'Áspero'], ['Mal regalo', 'Gran regalo'], ['Introvertido', 'Extrovertido'], ['Cómodo', 'Incómodo'],
    ['Seguro', 'Peligroso'], ['Clásico', 'Moderno'], ['Olvidable', 'Inolvidable'], ['Perro', 'Gato'], ['Ciudad', 'Campo'],
    ['Verano', 'Invierno'], ['Ordenado', 'Desordenado'], ['Para una cita', 'Para nada una cita'], ['Mentirita piadosa', 'Mentira grave'],
    ['Real', 'Imaginario'], ['Débil', 'Fuerte'], ['Tierno', 'Terrorífico'], ['Picante leve', 'Picante extremo'], ['Rutina', 'Aventura'],
    ['Comida de todos los días', 'Comida de fiesta'], ['Cosa de Nico', 'Cosa de Carito'], ['Necesario', 'Capricho'], ['Ridículo', 'Elegante'],
];
function puntosOnda(objetivo, dial) {
    const d = Math.abs(objetivo - dial);
    return d <= 5 ? 4 : d <= 12 ? 3 : d <= 20 ? 2 : 0;
}
function rondaOnda(n, quien) {
    return { ronda: n, etapa: 'pista', turno: quien, escala: ESCALAS_ONDA[Math.floor(Math.random() * ESCALAS_ONDA.length)], objetivo: 4 + Math.floor(Math.random() * 93), pista: '', dial: null };
}
function htmlDialOnda(e, mostrarObjetivo, dialPropio) {
    const zona = (desde, hasta, cls) => `<span class="zona-onda ${cls}" style="left:${Math.max(0, desde)}%;width:${Math.min(100, hasta) - Math.max(0, desde)}%"></span>`;
    let h = `<div class="dial-onda"><div class="escala-onda"><span>⬅️ ${e.escala[0]}</span><span>${e.escala[1]} ➡️</span></div><div class="barra-onda">`;
    if (mostrarObjetivo) h += zona(e.objetivo - 20, e.objetivo + 20, 'z2') + zona(e.objetivo - 12, e.objetivo + 12, 'z3') + zona(e.objetivo - 5, e.objetivo + 5, 'z4');
    const d = dialPropio != null ? dialPropio : e.dial;
    if (d != null) h += `<span class="aguja-onda" style="left:${d}%"></span>`;
    return h + '</div></div>';
}
let _dialOnda = 50;

const Onda = JuegoTurnos.crear({
    id: 'onda',
    emojiListo: '📡',
    intro: `Cooperativo: uno ve dónde está el blanco en una escala ("de frío a caliente") y da una pista; el otro mueve el dial. Cuanto más cerca, más puntos suman juntos. ${RONDAS_ONDA} rondas, se turnan.`,
    inicial: () => { const q = Math.random() < 0.5 ? 'nico' : 'carito'; return { ...rondaOnda(1, q), puntos: 0, historial: [] }; },
    tituloFin: () => '📡 ¡Terminaron las rondas!',
    textoTurno: (e) => e.etapa === 'pista' ? '🎯 Te toca dar la pista' : e.etapa === 'adivinar' ? '🎯 Te toca adivinar' : '',
    render(e, c) {
        let h = `<div class="texto-centro texto-tenue" style="font-size:0.8rem;">Ronda ${e.ronda} de ${RONDAS_ONDA} · Juntos llevan <b>${e.puntos}</b> puntos</div>`;
        const daPista = e.etapa === 'pista' ? e.turno : (e.turno === 'nico' ? 'carito' : 'nico');
        if (e.etapa === 'pista') {
            if (c.miTurno) {
                h += `<div class="panel">${htmlDialOnda(e, true)}<p class="texto-tenue" style="font-size:0.8rem;">El blanco está en la zona dorada. Escribí algo que para vos caiga justo ahí en esta escala (una palabra, una cosa, una persona…).</p>
                    <input id="pista-onda" class="input-texto" maxlength="60" placeholder="Tu pista…" autocomplete="off">
                    <button class="btn-principal" style="margin-top:8px;" onclick="darPistaOnda()">Mandar pista 📡</button></div>`;
            } else h += `<div class="panel texto-centro">${htmlDialOnda(e, false)}<div class="texto-tenue">${nombreJugador(e.turno)} está pensando una pista…</div></div>`;
        } else if (e.etapa === 'adivinar') {
            h += `<div class="panel texto-centro"><div class="pista-onda">💬 "${JuegoTurnos.esc(e.pista)}"</div>`;
            if (c.miTurno) {
                h += `${htmlDialOnda(e, false, _dialOnda)}<input type="range" min="0" max="100" value="${_dialOnda}" class="slider-onda" oninput="moverDialOnda(this.value)" aria-label="Dial">
                    <button class="btn-principal" style="margin-top:8px;" onclick="adivinarOnda()">¡Acá! 🎯</button>`;
            } else h += `${htmlDialOnda(e, true)}<div class="texto-tenue">${nombreJugador(e.turno)} está moviendo el dial…</div>`;
            h += '</div>';
        } else if (e.etapa === 'revelado') {
            const p = puntosOnda(e.objetivo, e.dial);
            h += `<div class="panel texto-centro"><div class="pista-onda">💬 "${JuegoTurnos.esc(e.pista)}" · pista de ${nombreJugador(daPista)}</div>${htmlDialOnda(e, true)}
                <div class="resultado-onda">${['😅 Lejos', '', '👍 Cerca', '🔥 ¡Muy cerca!', '🎯 ¡En el blanco!'][p] || '😅 Lejos'} · +${p}</div>
                ${e.fase === 'jugando' ? `<button class="btn-principal" style="margin-top:8px;" onclick="siguienteOnda()">${e.ronda >= RONDAS_ONDA ? 'Ver resultado final' : 'Siguiente ronda ▶️'}</button>` : ''}</div>`;
        }
        if ((e.historial || []).length) h += `<div class="panel texto-tenue" style="font-size:0.72rem; line-height:1.6;">${e.historial.slice(-4).map(x => '• ' + JuegoTurnos.esc(x)).join('<br>')}</div>`;
        return h;
    },
    alDibujar(cont, e) {
        if (e.etapa !== 'revelado' || cont.dataset.ondaVisto === String(e.ronda)) return;
        const primera = cont.dataset.ondaVisto === undefined;
        cont.dataset.ondaVisto = String(e.ronda);
        if (primera) return;
        const aguja = cont.querySelector('.aguja-onda');
        if (aguja) aguja.animate([{ left: '50%' }, { left: e.dial + '%' }], { duration: 700, easing: 'cubic-bezier(0.3,1.4,0.5,1)' });
        const p = puntosOnda(e.objetivo, e.dial);
        if (p >= 3 && window.fx) setTimeout(() => window.fx.confeti(p === 4 ? 40 : 16), 600);
        if (window.sfx) setTimeout(() => window.sfx[p >= 3 ? 'logro' : p ? 'acierto' : 'error'](), 600);
    }
});

function moverDialOnda(v) {
    _dialOnda = Number(v);
    const a = document.querySelector('#contenido-onda .aguja-onda');
    if (a) a.style.left = _dialOnda + '%';
    else Onda.redibujar();
}
async function darPistaOnda() {
    const pista = (document.getElementById('pista-onda')?.value || '').trim();
    if (!pista) return;
    _dialOnda = 50;
    await Onda.jugar((e) => e.etapa === 'pista' ? { etapa: 'adivinar', pista, turno: miRival } : null);
    if (window.sfx) window.sfx.pop();
}
async function adivinarOnda() {
    await Onda.jugar((e) => {
        if (e.etapa !== 'adivinar') return null;
        const p = puntosOnda(e.objetivo, _dialOnda);
        return { etapa: 'revelado', dial: _dialOnda, puntos: e.puntos + p, historial: [...(e.historial || []), `${e.escala[0]}↔${e.escala[1]}: "${e.pista}" → +${p}`].slice(-8) };
    });
}
async function siguienteOnda() {
    await Onda.accion((e) => {
        if (e.etapa !== 'revelado') return null;
        if (e.ronda >= RONDAS_ONDA) {
            const max = RONDAS_ONDA * 4, p = e.puntos;
            const nivel = p >= max * 0.75 ? '🧠✨ ¡Telepatía total!' : p >= max * 0.5 ? '💞 Muy en sintonía' : p >= max * 0.25 ? '📻 Buena onda' : '📡 Hay que calibrar la antena';
            return { ganador: 'empate', motivo: `Juntos sumaron ${p} de ${max}. ${nivel}` };
        }
        // El que adivinó ahora da la pista.
        return rondaOnda(e.ronda + 1, e.turno);
    });
    _dialOnda = 50;
}
