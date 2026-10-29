// ==================== DIBUJO EXQUISITO ====================
// El cadáver exquisito de toda la vida: entre los dos dibujan un bicho en
// tres partes (cabeza, cuerpo, piernas) sin ver lo que dibujó el otro.
// Sólo se ve una tirita del borde de abajo de la parte anterior, para
// saber dónde seguir. Al final se revela el monstruo entero.
// Cada parte se guarda como imagen chiquita (JPEG) en el mismo doc.
const PARTES_EXQ = [{ n: 'la cabeza', i: '🧠' }, { n: 'el cuerpo', i: '👕' }, { n: 'las piernas', i: '🦵' }];
const COLORES_EXQ = ['#2a1f33', '#e8496b', '#3d8bfd', '#2fb36d', '#f2b134', '#8e5bd9'];
const ANCHO_EXQ = 480, ALTO_EXQ = 300, TIRA_EXQ = 34;
let _exq = { color: COLORES_EXQ[0], grosor: 5, trazos: 0, clave: null };

const Exquisito = JuegoTurnos.crear({
    id: 'exquisito',
    emojiListo: '🖍️',
    intro: 'Dibujan un monstruo entre los dos, en tres partes: cabeza, cuerpo y piernas. Nadie ve lo que dibujó el otro: sólo una tirita del borde para saber dónde seguir. ¡Al final se revela entero!',
    inicial: () => { const a = Math.random() < 0.5 ? 'nico' : 'carito'; return { paso: 0, artistas: [a, a === 'nico' ? 'carito' : 'nico', a], partes: ['', '', ''], tira: '', turno: a }; },
    tituloFin: () => '🎨 ¡Nació un monstruo!',
    textoTurno: (e) => `🎨 Te toca dibujar ${PARTES_EXQ[e.paso].n}`,
    render(e, c) {
        if (e.fase === 'terminado') {
            return `<div class="monstruo-exq">${e.partes.map((p, k) => `<img src="${p}" alt="${PARTES_EXQ[k].n}" data-aj-id="exq-${k}">`).join('')}</div>
                <div class="texto-centro texto-tenue" style="font-size:0.8rem;">${PARTES_EXQ.map((p, k) => `${p.i} ${nombreJugador(e.artistas[k])}`).join(' · ')}</div>
                <div class="btn-fila"><button class="btn-secundario" onclick="descargarExquisito()">💾 Guardar el monstruo</button></div>`;
        }
        const pasos = PARTES_EXQ.map((p, k) => `<span class="${k < e.paso ? 'hecho' : k === e.paso ? 'ahora' : ''}">${p.i} ${p.n.replace(/^(la|el|las) /, '')}</span>`).join('');
        let h = `<div class="pasos-exq">${pasos}</div>`;
        if (!c.miTurno) return h + `<div class="panel texto-centro texto-tenue destello">${nombreJugador(e.turno)} está dibujando ${PARTES_EXQ[e.paso].n}… ¡no espíes! 🙈</div>`;
        h += `<div class="lienzo-exq-caja">${e.tira ? `<img class="tira-exq" src="${e.tira}" alt="Borde de la parte anterior">` : ''}
            <canvas id="lienzo-exq" width="${ANCHO_EXQ}" height="${ALTO_EXQ}"></canvas></div>
            <div class="texto-tenue texto-centro" style="font-size:0.75rem;">${e.tira ? 'Arriba ves el borde de lo que dibujó el otro: seguí desde ahí.' : 'Dibujá la cabeza y llegá hasta el borde de abajo (el cuello).'}${e.paso < 2 ? ' Dejá tu dibujo tocando el borde de abajo.' : ''}</div>
            <div class="paleta-exq">${COLORES_EXQ.map(col => `<button style="background:${col}" class="${_exq.color === col ? 'elegido' : ''}" onclick="colorExq('${col}')" aria-label="Color"></button>`).join('')}
                <button class="grosor ${_exq.grosor > 6 ? 'elegido' : ''}" onclick="grosorExq()">${_exq.grosor > 6 ? '⬤' : '•'}</button>
                <button class="grosor" onclick="borrarExq()" title="Borrar todo">🧽</button></div>
            <button class="btn-principal" onclick="terminarParteExq()">✅ Listo, ${e.paso < 2 ? 'pasarle al otro' : 'revelar el monstruo'}</button>`;
        return h;
    },
    alDibujar(cont, e, c) {
        if (e.fase !== 'jugando' || !c || !c.miTurno) return;
        const clave = `${e.paso}-${e.turno}`;
        const cv = document.getElementById('lienzo-exq');
        if (!cv) return;
        // Al redibujar (otro color, etc.) se conserva lo dibujado.
        if (_exq.clave === clave && _exq.imagen) { const img = new Image(); img.onload = () => cv.getContext('2d').drawImage(img, 0, 0); img.src = _exq.imagen; }
        else { _exq.clave = clave; _exq.trazos = 0; _exq.imagen = null; limpiarExq(cv); }
        prepararLienzoExq(cv);
    }
});

function limpiarExq(cv){ const g = cv.getContext('2d'); g.fillStyle = '#fffdf8'; g.fillRect(0, 0, cv.width, cv.height); }
function prepararLienzoExq(cv){
    const g = cv.getContext('2d');
    let ant = null;
    const punto = (ev) => { const r = cv.getBoundingClientRect(); return { x: (ev.clientX - r.left) * cv.width / r.width, y: (ev.clientY - r.top) * cv.height / r.height }; };
    cv.onpointerdown = (ev) => { ev.preventDefault(); cv.setPointerCapture && cv.setPointerCapture(ev.pointerId); ant = punto(ev); g.beginPath(); g.fillStyle = _exq.color; g.arc(ant.x, ant.y, _exq.grosor / 2, 0, Math.PI * 2); g.fill(); };
    cv.onpointermove = (ev) => {
        if (!ant) return;
        const p = punto(ev);
        g.strokeStyle = _exq.color; g.lineWidth = _exq.grosor; g.lineCap = 'round'; g.lineJoin = 'round';
        g.beginPath(); g.moveTo(ant.x, ant.y); g.lineTo(p.x, p.y); g.stroke();
        ant = p;
    };
    cv.onpointerup = cv.onpointercancel = cv.onpointerleave = () => { if (ant) { _exq.trazos++; _exq.imagen = cv.toDataURL('image/png'); } ant = null; };
}
function colorExq(col){ vibrarJ(5); _exq.color = col; Exquisito.redibujar(); }
function grosorExq(){ vibrarJ(5); _exq.grosor = _exq.grosor > 6 ? 5 : 12; Exquisito.redibujar(); }
function borrarExq(){ if (!confirm('¿Borrar todo tu dibujo?')) return; const cv = document.getElementById('lienzo-exq'); if (cv) limpiarExq(cv); _exq.trazos = 0; _exq.imagen = null; }

async function terminarParteExq(){
    const cv = document.getElementById('lienzo-exq');
    if (!cv) return;
    if (!_exq.trazos && !confirm('¿Mandar la parte sin dibujar nada?')) return;
    vibrarJ(12);
    const img = cv.toDataURL('image/jpeg', 0.72);
    // La tirita: el borde de abajo, para que el otro sepa dónde seguir.
    const t = document.createElement('canvas'); t.width = ANCHO_EXQ; t.height = TIRA_EXQ;
    t.getContext('2d').drawImage(cv, 0, ALTO_EXQ - TIRA_EXQ, ANCHO_EXQ, TIRA_EXQ, 0, 0, ANCHO_EXQ, TIRA_EXQ);
    const tira = t.toDataURL('image/jpeg', 0.7);
    const res = await Exquisito.jugar((e) => {
        const partes = [...e.partes]; partes[e.paso] = img;
        if (e.paso >= 2) return { partes, tira: '', ganador: 'empate', motivo: '🎉 Cabeza, cuerpo y piernas: ¡acá está el bicho completo!' };
        return { partes, tira, paso: e.paso + 1, turno: e.artistas[e.paso + 1] };
    });
    if (res) { _exq.imagen = null; _exq.clave = null; if (window.sfx) window.sfx.acierto(); }
}
// Las tres partes en una sola imagen, para guardarla.
function descargarExquisito(){
    const e = Exquisito.estado;
    if (!e) return;
    const cv = document.createElement('canvas'); cv.width = ANCHO_EXQ; cv.height = ALTO_EXQ * 3;
    const g = cv.getContext('2d');
    let listas = 0;
    e.partes.forEach((p, k) => { const img = new Image(); img.onload = () => { g.drawImage(img, 0, k * ALTO_EXQ); if (++listas === 3) { const a = document.createElement('a'); a.download = 'monstruo.jpg'; a.href = cv.toDataURL('image/jpeg', 0.85); a.click(); } }; img.src = p; });
}
