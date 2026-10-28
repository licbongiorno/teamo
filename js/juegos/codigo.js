// ==================== CÓDIGO SECRETO EN PAREJA ====================
// Cooperativo (tipo Codenames Duet). Hay 25 palabras. Cada uno tiene su
// propia clave secreta: 9 son sus agentes 🟩 (algunas coinciden con las
// del otro) y 3 son asesinos ☠️. Por turnos, uno da una pista de UNA
// palabra y un número; el otro toca palabras:
//   - agente de quien dio la pista → se descubre y puede seguir tocando,
//   - neutral → se termina el turno,
//   - asesino → pierden los dos.
// Ganan si descubren los 15 agentes antes de que se acaben las 9 pistas.
const PISTAS_CODIGO = 9;
const PALABRAS_CODIGO = ['luna', 'sol', 'playa', 'montaña', 'río', 'bosque', 'gato', 'perro', 'pájaro', 'pez', 'caballo', 'león', 'mono', 'oso',
    'manzana', 'pan', 'queso', 'chocolate', 'café', 'mate', 'helado', 'pizza', 'torta', 'miel', 'limón', 'tomate', 'papa', 'huevo',
    'casa', 'puerta', 'ventana', 'cama', 'silla', 'mesa', 'espejo', 'llave', 'lámpara', 'reloj', 'libro', 'carta', 'foto', 'regalo',
    'auto', 'tren', 'avión', 'barco', 'bici', 'colectivo', 'cohete', 'globo', 'mapa', 'brújula', 'valija', 'pasaporte',
    'guitarra', 'piano', 'tambor', 'canción', 'baile', 'teatro', 'cine', 'circo', 'fiesta', 'disfraz', 'máscara', 'corona',
    'rey', 'reina', 'pirata', 'bruja', 'fantasma', 'dragón', 'sirena', 'robot', 'astronauta', 'doctor', 'chef', 'payaso',
    'fuego', 'agua', 'hielo', 'nieve', 'lluvia', 'trueno', 'viento', 'nube', 'arcoíris', 'estrella', 'planeta', 'cometa',
    'corazón', 'beso', 'abrazo', 'sueño', 'secreto', 'promesa', 'anillo', 'flor', 'rosa', 'árbol', 'hoja', 'semilla',
    'escuela', 'oficina', 'hospital', 'banco', 'iglesia', 'castillo', 'puente', 'torre', 'faro', 'isla', 'desierto', 'volcán',
    'fútbol', 'pelota', 'red', 'gol', 'medalla', 'carrera', 'pileta', 'ola', 'arena', 'caracol', 'perla', 'tesoro',
    'teléfono', 'computadora', 'cámara', 'radio', 'tele', 'internet', 'batería', 'cable', 'botón', 'pantalla',
    'zapato', 'sombrero', 'bufanda', 'anteojos', 'paraguas', 'mochila', 'billetera', 'collar', 'guante', 'pijama',
    'noche', 'mañana', 'domingo', 'verano', 'invierno', 'navidad', 'cumpleaños', 'vacaciones', 'luna de miel', 'aniversario',
    'dinosaurio', 'mariposa', 'abeja', 'hormiga', 'araña', 'tortuga', 'conejo', 'pingüino', 'jirafa', 'elefante', 'ballena', 'pulpo'];

function claveCodigo() {
    // 3 agentes compartidos, 6 sólo de Nico, 6 sólo de Carito; asesinos
    // repartidos como en el Duet (uno compartido, otros que para el otro son agentes o neutrales).
    const idx = [...Array(25).keys()].sort(() => Math.random() - 0.5);
    const comp = idx.slice(0, 3), soloN = idx.slice(3, 9), soloC = idx.slice(9, 15), resto = idx.slice(15);
    const n = Array(25).fill('n'), c = Array(25).fill('n');
    [...comp, ...soloN].forEach(i => { n[i] = 'v'; });
    [...comp, ...soloC].forEach(i => { c[i] = 'v'; });
    const asesinoComun = resto[0];
    n[asesinoComun] = 'x'; c[asesinoComun] = 'x';
    n[soloC[0]] = 'x'; n[resto[1]] = 'x';
    c[soloN[0]] = 'x'; c[resto[2]] = 'x';
    return { nico: n.join(''), carito: c.join('') };
}
const totalAgentesCodigo = (e) => [...Array(25).keys()].filter(i => e.claves.nico[i] === 'v' || e.claves.carito[i] === 'v').length;
const encontradosCodigo = (e) => [...e.revelado].filter(ch => ch === 'v').length;

const Codigo = JuegoTurnos.crear({
    id: 'codigo',
    emojiListo: '🕵️',
    intro: 'Cooperativo: cada uno ve sus agentes 🟩 y asesinos ☠️ secretos entre 25 palabras. Por turnos, dale al otro una pista de una palabra y un número para que encuentre tus agentes. ¡Cuidado con los asesinos! Ganan si encuentran los 15 agentes con 9 pistas.',
    inicial: () => {
        const palabras = [...PALABRAS_CODIGO].sort(() => Math.random() - 0.5).slice(0, 25);
        return { palabras, claves: claveCodigo(), revelado: '.'.repeat(25), neutras: { nico: '0'.repeat(25), carito: '0'.repeat(25) }, etapa: 'pista', pista: null, pistasQuedan: PISTAS_CODIGO, aciertosTurno: 0 };
    },
    tituloFin: (e) => e.ganador === 'empate' && e.motivo && e.motivo.startsWith('🎉') ? '🕵️ ¡Misión cumplida!' : '💀 Misión fallida',
    textoTurno: (e) => e.etapa === 'pista' ? '🎯 Dale una pista al otro' : '🎯 Tocá las palabras de la pista',
    render(e, c) {
        const yo = c.yo, miClave = e.claves[yo];
        const daPista = e.etapa === 'pista' ? e.turno : (e.turno === 'nico' ? 'carito' : 'nico');
        const adivino = e.etapa === 'adivinar' && c.miTurno;
        let h = `<div class="texto-centro texto-tenue" style="font-size:0.8rem;">🟩 Agentes: ${encontradosCodigo(e)} de ${totalAgentesCodigo(e)} · Pistas que quedan: ${e.pistasQuedan}</div>`;
        if (e.pista) h += `<div class="pista-onda">💬 ${nombreJugador(daPista)}: "${JuegoTurnos.esc(e.pista.texto)}" · ${e.pista.num}</div>`;
        h += '<div class="grilla-codigo">';
        e.palabras.forEach((p, i) => {
            const r = e.revelado[i];
            const neutraDe = ['nico', 'carito'].filter(q => e.neutras[q][i] === '1');
            const clases = ['carta-codigo'];
            if (r === 'v') clases.push('agente');
            else if (r === 'x') clases.push('asesino');
            else { if (miClave[i] === 'v') clases.push('mi-agente'); if (miClave[i] === 'x') clases.push('mi-asesino'); }
            if (neutraDe.length && r === '.') clases.push('neutra');
            const tocable = adivino && r !== 'v' && e.neutras[daPista][i] !== '1';
            h += `<button class="${clases.join(' ')}" ${tocable ? `onclick="tocarCodigo(${i})"` : 'disabled'}>${p}${neutraDe.length && r === '.' ? `<small>nada para ${neutraDe.map(q => nombreJugador(q)).join(' y ')}</small>` : ''}</button>`;
        });
        h += '</div><div class="texto-tenue texto-centro" style="font-size:0.72rem;">Borde verde = tus agentes · borde rojo = tus asesinos (sólo los ves vos)</div>';
        if (e.fase === 'jugando' && c.miTurno && e.etapa === 'pista') {
            h += `<div class="panel"><input id="pista-codigo" class="input-texto" maxlength="24" placeholder="Una sola palabra…" autocomplete="off">
                <div class="btn-fila" style="margin-top:8px;">${[1, 2, 3, 4].map(n => `<button class="btn-secundario" style="width:auto;" onclick="darPistaCodigo(${n})">${n}</button>`).join('')}</div>
                <div class="texto-tenue" style="font-size:0.75rem; margin-top:4px;">Escribí la pista y tocá a cuántas palabras se refiere.</div></div>`;
        } else if (adivino) {
            h += `<div class="texto-centro"><button class="btn-secundario" onclick="terminarCodigo()">✋ Ya está, terminar turno</button></div>`;
        } else if (e.fase === 'jugando') h += `<div class="panel texto-centro texto-tenue">${e.etapa === 'pista' ? `${nombreJugador(e.turno)} está pensando la pista…` : `${nombreJugador(e.turno)} está adivinando…`}</div>`;
        return h;
    },
});

async function darPistaCodigo(num) {
    const texto = (document.getElementById('pista-codigo')?.value || '').trim();
    if (!texto || /\s/.test(texto)) { if (window.animJuegos) window.animJuegos.cartel('Una sola palabra 😉', { dur: 1000, sonido: 'error' }); return; }
    await Codigo.jugar((e) => e.etapa === 'pista' ? { etapa: 'adivinar', pista: { texto, num }, turno: miRival, aciertosTurno: 0 } : null);
    if (window.sfx) window.sfx.pop();
}
// Termina el turno de adivinar: se gasta una pista y el que adivinaba pasa a dar la próxima.
function cerrarTurnoCodigo(e, cambios) {
    const quedan = e.pistasQuedan - 1;
    const est = { ...e, ...cambios };
    if (encontradosCodigo(est) >= totalAgentesCodigo(est)) return { ...cambios, ganador: 'empate', motivo: '🎉 ¡Encontraron a los 15 agentes!' };
    if (quedan <= 0) return { ...cambios, pistasQuedan: 0, ganador: 'empate', motivo: `Se acabaron las pistas: encontraron ${encontradosCodigo(est)} de ${totalAgentesCodigo(est)}.` };
    return { ...cambios, pistasQuedan: quedan, etapa: 'pista', pista: null, turno: miIdentidad };
}
async function tocarCodigo(i) {
    vibrarJ(10);
    const res = await Codigo.jugar((e) => {
        if (e.etapa !== 'adivinar' || e.revelado[i] === 'v') return null;
        const da = miRival, tipo = e.claves[da][i];
        if (tipo === 'x') { const rev = e.revelado.slice(0, i) + 'x' + e.revelado.slice(i + 1); return { revelado: rev, ganador: 'empate', motivo: `☠️ "${e.palabras[i]}" era un asesino. ¡A intentarlo de nuevo!` }; }
        if (tipo === 'v') {
            const rev = e.revelado.slice(0, i) + 'v' + e.revelado.slice(i + 1);
            const est = { ...e, revelado: rev };
            if (encontradosCodigo(est) >= totalAgentesCodigo(est)) return { revelado: rev, ganador: 'empate', motivo: '🎉 ¡Encontraron a los 15 agentes!' };
            return { revelado: rev, aciertosTurno: (e.aciertosTurno || 0) + 1 };
        }
        const neutras = { ...e.neutras, [da]: e.neutras[da].slice(0, i) + '1' + e.neutras[da].slice(i + 1) };
        return cerrarTurnoCodigo(e, { neutras });
    });
    if (res && window.sfx) window.sfx[res.cambios.revelado && res.cambios.revelado[i] === 'v' ? 'acierto' : res.cambios.revelado ? 'explosion' : 'toque']();
}
async function terminarCodigo() {
    await Codigo.jugar((e) => e.etapa === 'adivinar' ? cerrarTurnoCodigo(e, {}) : null);
}
