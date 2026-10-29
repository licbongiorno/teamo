// ==================== HISTORIA A DOS VOCES ====================
// Arranca con un comienzo sorpresa y se turnan para escribir una frase
// cada uno (10 en total). A veces aparece una palabra que hay que usar
// sí o sí. Al final se lee la historia entera, le ponen título y queda
// guardada (juegos/historias, las últimas 10) y en el álbum de momentos.
const FRASES_HISTORIA = 10;
const COMIENZOS_HISTORIA = [
    'Era una noche de tormenta y alguien tocó el timbre tres veces…',
    'Cuando abrimos la heladera, había un pingüino mirándonos.',
    'El mapa del tesoro estaba escrito en el reverso de un ticket del súper.',
    'Esa mañana nos despertamos y el gato hablaba perfecto castellano.',
    'El avión aterrizó en una isla que no figuraba en ningún mapa.',
    'Ganamos un viaje, pero el premio tenía una condición muy rara.',
    'En el fondo del ropero encontramos una puerta que antes no estaba.',
    'Un día el wifi se cortó para siempre en toda la ciudad.',
    'La carta llegó con veinte años de atraso y venía a nuestro nombre.',
    'Nos tocó cuidar por un fin de semana al dragón del vecino.',
    'El colectivo dobló en una esquina y de repente estábamos en 1985.',
    'La receta de la abuela tenía un ingrediente secreto… y estaba vivo.',
];
const PALABRAS_HISTORIA = ['paraguas', 'mate', 'dinosaurio', 'bicicleta', 'luna', 'empanada', 'espejo', 'globo', 'abuela', 'trompeta', 'helado', 'fantasma', 'tren', 'pirata', 'medialuna', 'robot', 'faro', 'pantuflas', 'volcán', 'tango'];
const _sinTildeHist = (t) => String(t).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
let _historiasGuardadas = [];

const Historia = JuegoTurnos.crear({
    id: 'historia',
    emojiListo: '📖',
    intro: `Escriban una historia entre los dos: una frase cada uno, ${FRASES_HISTORIA} en total, arrancando con un comienzo sorpresa. Si aparece una ✨ palabra obligatoria, ¡hay que usarla! Al final le ponen título.`,
    inicial: () => ({ comienzo: COMIENZOS_HISTORIA[Math.floor(Math.random() * COMIENZOS_HISTORIA.length)], frases: [], palabra: '', etapa: 'escribir', titulo: '', turno: Math.random() < 0.5 ? 'nico' : 'carito' }),
    tituloFin: (e) => `📖 «${JuegoTurnos.esc(e.titulo)}»`,
    textoTurno: (e) => e.etapa === 'titulo' ? '✍️ Ponele título a la historia' : '✍️ Tu turno: escribí la frase que sigue',
    render(e, c) {
        const esc = JuegoTurnos.esc;
        let h = `<div class="historia-texto"><p class="comienzo">${esc(e.comienzo)}</p>${e.frases.map(f => `<span class="de-${f.por}">${esc(f.t)}</span> `).join('')}</div>
            <div class="texto-centro texto-tenue" style="font-size:0.78rem;">${e.frases.length}/${FRASES_HISTORIA} frases · <span class="de-nico">${nombreJugador('nico')}</span> · <span class="de-carito">${nombreJugador('carito')}</span></div>`;
        if (e.fase === 'terminado') {
            h += `<div class="btn-fila"><button class="btn-secundario" onclick="compartirHistoria()">📤 Mandarla por WhatsApp</button><button class="btn-secundario" onclick="verHistoriasAnteriores()">📚 Las anteriores</button></div>`;
            return h;
        }
        if (!c.miTurno) return h + `<div class="panel texto-centro texto-tenue destello">${nombreJugador(e.turno)} está escribiendo… ✍️</div>`;
        if (e.etapa === 'titulo') {
            return h + `<div class="entrada-enc"><input id="input-historia" maxlength="60" placeholder="El título de la historia…"><button class="btn-principal" onclick="titularHistoria()">Listo</button></div>`;
        }
        h += `${e.palabra ? `<div class="silaba-enc">✨ Palabra obligatoria: <b>${esc(e.palabra)}</b></div>` : ''}
            <textarea id="input-historia" class="textarea-historia" rows="3" maxlength="220" placeholder="Y entonces…"></textarea>
            <button class="btn-principal" onclick="escribirHistoria()">${e.frases.length === FRASES_HISTORIA - 1 ? '🏁 Escribir el final' : 'Agregar mi frase'}</button>`;
        return h;
    }
});

async function escribirHistoria(){
    const t = (document.getElementById('input-historia')?.value || '').trim().replace(/\s+/g, ' ');
    if (t.length < 3) return;
    let error = null;
    const res = await Historia.jugar((e) => {
        error = null;
        if (e.etapa !== 'escribir') return null;
        if (e.palabra && !_sinTildeHist(t).includes(_sinTildeHist(e.palabra))) { error = `Tenés que usar "${e.palabra}"`; return null; }
        const frases = [...e.frases, { t: t.slice(0, 220), por: miIdentidad }];
        if (frases.length >= FRASES_HISTORIA) return { frases, palabra: '', etapa: 'titulo', turno: miRival };
        // Cada tanto, una palabra obligatoria para el otro.
        const palabra = Math.random() < 0.35 ? PALABRAS_HISTORIA[Math.floor(Math.random() * PALABRAS_HISTORIA.length)] : '';
        return { frases, palabra, turno: miRival };
    });
    if (!res) { if (error && window.animJuegos) window.animJuegos.cartel(error, { dur: 1300, sonido: false }); if (window.sfx) window.sfx.error(); return; }
    if (window.sfx) window.sfx.click();
}
async function titularHistoria(){
    const titulo = (document.getElementById('input-historia')?.value || '').replace(/[<>&"]/g, '').trim().slice(0, 60);
    if (titulo.length < 2) return;
    let fin = null;
    await Historia.jugar((e) => {
        if (e.etapa !== 'titulo') return null;
        fin = { ...e, titulo };
        return { titulo, ganador: 'empate', motivo: `🎉 Escribieron "${titulo}" entre los dos.` };
    });
    if (!fin) return;
    try {
        const ref = window.doc(window.db, 'juegos', 'historias');
        await window.runTransaction(window.db, async (tx) => {
            const s = await tx.get(ref);
            const lista = s.exists() ? (s.data().lista || []) : [];
            tx.set(ref, { lista: [...lista, { titulo: fin.titulo, comienzo: fin.comienzo, frases: fin.frases, fecha: Date.now() }].slice(-10) });
        });
    } catch (err) { console.warn('No se pudo guardar la historia:', err); }
}
function textoHistoria(e){ return `📖 ${e.titulo}\n\n${e.comienzo} ${e.frases.map(f => f.t).join(' ')}`; }
function compartirHistoria(){
    const e = Historia.estado;
    if (!e) return;
    window.open(`https://wa.me/?text=${encodeURIComponent(textoHistoria(e))}`, '_blank');
}
function verHistoriasAnteriores(){
    const unsub = window.onSnapshot(window.doc(window.db, 'juegos', 'historias'), (snap) => {
        setTimeout(() => unsub && unsub(), 0);
        _historiasGuardadas = snap.exists() ? (snap.data().lista || []) : [];
        document.querySelectorAll('.historias-fondo').forEach(x => x.remove());
        const esc = JuegoTurnos.esc;
        const fondo = document.createElement('div');
        fondo.className = 'compu-selector-fondo historias-fondo';
        fondo.onclick = (ev) => { if (ev.target === fondo) fondo.remove(); };
        fondo.innerHTML = `<div class="compu-selector panel" role="dialog" aria-label="Historias anteriores" style="max-height:80vh; overflow:auto;">
            <div class="compu-selector-titulo">📚 Nuestras historias</div>
            ${[..._historiasGuardadas].reverse().map(x => `<details class="historia-guardada"><summary><b>${esc(x.titulo)}</b> <span class="texto-tenue">${new Date(x.fecha).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}</span></summary>
                <div class="historia-texto"><p class="comienzo">${esc(x.comienzo)}</p>${(x.frases || []).map(f => `<span class="de-${f.por}">${esc(f.t)}</span> `).join('')}</div></details>`).join('') || '<p class="texto-tenue">Todavía no hay ninguna.</p>'}
            <button class="btn-secundario" style="margin-top:8px;" onclick="this.closest('.historias-fondo').remove()">Cerrar</button></div>`;
        document.body.appendChild(fondo);
    });
}
