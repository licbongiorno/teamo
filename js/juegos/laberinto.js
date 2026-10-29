// ==================== LABERINTO A CIEGAS (cooperativo) ====================
// Uno es el guía: ve el laberinto entero. El otro es el piloto: mueve la
// ficha pero no ve las paredes (sólo las que ya chocó). El guía manda
// señales de flechitas (o se hablan por el chat). Cada choque cuesta una
// vida; al llegar a la meta pasan de nivel y se cambian los roles.
// Celdas: un dígito hex por celda con las paredes que tiene (1=N 2=E 4=S 8=O).
const NIVELES_LABERINTO = [5, 6, 6, 7, 8];
const VIDAS_LABERINTO = 6;
const DIRS_LABERINTO = { N: [0, -1, 1, 4], E: [1, 0, 2, 8], S: [0, 1, 4, 1], O: [-1, 0, 8, 2] };
const FLECHAS_LABERINTO = { N: '⬆️', E: '➡️', S: '⬇️', O: '⬅️' };

function armarLaberinto(n){
    const p = Array(n * n).fill(15), visto = Array(n * n).fill(false), pila = [0];
    visto[0] = true;
    while (pila.length) {
        const i = pila[pila.length - 1], x = i % n, y = Math.floor(i / n);
        const vecinos = Object.values(DIRS_LABERINTO).map(([dx, dy, b, ob]) => [x + dx, y + dy, b, ob])
            .filter(([a, b]) => a >= 0 && a < n && b >= 0 && b < n && !visto[b * n + a]);
        if (!vecinos.length) { pila.pop(); continue; }
        const [a, b, bit, obit] = vecinos[Math.floor(Math.random() * vecinos.length)];
        const j = b * n + a;
        p[i] &= ~bit; p[j] &= ~obit; visto[j] = true; pila.push(j);
    }
    return p.map(v => v.toString(16)).join('');
}
function nivelLaberinto(nivel, guia){
    const n = NIVELES_LABERINTO[nivel - 1];
    return { nivel, n, paredes: armarLaberinto(n), pos: 0, meta: n * n - 1, guia, conocidas: '', senal: '', pasos: 0 };
}

const Laberinto = JuegoTurnos.crear({
    id: 'laberinto',
    sinTurno: true,
    emojiListo: '🧭',
    intro: `Juegan en equipo. El guía ve el laberinto; el piloto mueve la ficha a ciegas. Lleguen a la meta ⭐ sin gastar las ${VIDAS_LABERINTO} vidas: cada choque contra una pared cuesta una. En cada nivel se cambian los roles.`,
    inicial: () => ({ ...nivelLaberinto(1, Math.random() < 0.5 ? 'nico' : 'carito'), vidas: VIDAS_LABERINTO, turno: null }),
    tituloFin: (e) => e.motivo && e.motivo.startsWith('🎉') ? '🧭 ¡Salieron del laberinto!' : '💥 Se acabaron las vidas',
    render(e, c) {
        const soyGuia = e.guia === c.yo, n = e.n;
        const piloto = e.guia === 'nico' ? 'carito' : 'nico';
        const conocidas = new Set((e.conocidas || '').split(',').filter(Boolean));
        let h = `<div class="texto-centro" style="font-size:0.9rem;">Nivel ${e.nivel}/${NIVELES_LABERINTO.length} · ${'❤️'.repeat(e.vidas)}${'🖤'.repeat(Math.max(0, VIDAS_LABERINTO - e.vidas))}</div>
            <div class="texto-centro texto-tenue" style="font-size:0.8rem; margin-bottom:6px;">${soyGuia ? `🗺️ Sos el guía: ${nombreJugador(piloto)} no ve las paredes` : `🙈 Sos el piloto: seguí las señales de ${nombreJugador(e.guia)}`}</div>`;
        h += `<div class="laberinto${soyGuia ? ' guia' : ''}" style="--n:${n}">`;
        for (let i = 0; i < n * n; i++) {
            const w = parseInt(e.paredes[i], 16);
            // El piloto sólo ve las paredes que ya chocó (y el borde).
            const x = i % n, y = Math.floor(i / n);
            const ve = (bit, d) => soyGuia ? (w & bit) : ((w & bit) && (conocidas.has(i + d) || (d === 'N' && y === 0) || (d === 'S' && y === n - 1) || (d === 'O' && x === 0) || (d === 'E' && x === n - 1)));
            const cls = [ve(1, 'N') ? 'pn' : '', ve(2, 'E') ? 'pe' : '', ve(4, 'S') ? 'ps' : '', ve(8, 'O') ? 'po' : ''].join(' ');
            h += `<div class="celda-lab ${cls}">${i === e.pos ? `<span class="ficha-lab" data-aj-id="ficha-lab">🐾</span>` : i === e.meta ? '⭐' : ''}</div>`;
        }
        h += `</div>`;
        h += `<div class="senal-lab">${e.senal ? `📡 Señal: <b>${[...e.senal].map(d => FLECHAS_LABERINTO[d]).join(' ')}</b>` : '📡 Sin señales todavía'}</div>`;
        if (e.fase === 'jugando') {
            const pad = (fn) => `<div class="pad-lab"><span></span><button onclick="${fn}('N')">⬆️</button><span></span>
                <button onclick="${fn}('O')">⬅️</button><span></span><button onclick="${fn}('E')">➡️</button>
                <span></span><button onclick="${fn}('S')">⬇️</button><span></span></div>`;
            if (soyGuia) {
                h += `<div class="texto-tenue texto-centro" style="font-size:0.8rem;">Armá una señal (hasta 6 flechas) y mandala:</div>
                    <div class="texto-centro senal-armando">${[..._senalLab].map(d => FLECHAS_LABERINTO[d]).join(' ') || '—'}</div>
                    ${pad('agregarSenalLab')}
                    <div class="btn-fila"><button class="btn-secundario" onclick="borrarSenalLab()">Borrar</button><button class="btn-principal" onclick="mandarSenalLab()">📡 Mandar</button></div>`;
            } else {
                h += pad('moverLab');
            }
        }
        return h;
    },
    alDibujar(cont, e) {
        if (e.fase !== 'jugando' || e.guia !== miIdentidad) _senalLab = '';
    }
});
let _senalLab = '';

function agregarSenalLab(d){ vibrarJ(6); if (_senalLab.length < 6) _senalLab += d; Laberinto.redibujar(); }
function borrarSenalLab(){ vibrarJ(6); _senalLab = ''; Laberinto.redibujar(); }
async function mandarSenalLab(){
    if (!_senalLab) return;
    const s = _senalLab;
    const res = await Laberinto.accion((e) => e.guia === miIdentidad ? { senal: s } : null);
    if (res) { _senalLab = ''; if (window.sfx) window.sfx.click(); }
}
async function moverLab(d){
    vibrarJ(8);
    let choque = false, llego = false;
    const res = await Laberinto.accion((e) => {
        if (e.guia === miIdentidad) return null;
        const n = e.n, x = e.pos % n, y = Math.floor(e.pos / n), w = parseInt(e.paredes[e.pos], 16);
        const [dx, dy, bit] = DIRS_LABERINTO[d];
        choque = !!(w & bit) || x + dx < 0 || x + dx >= n || y + dy < 0 || y + dy >= n;
        llego = false;
        if (choque) {
            const vidas = e.vidas - 1;
            const conocidas = [...new Set([...(e.conocidas || '').split(',').filter(Boolean), e.pos + d])].join(',');
            if (vidas <= 0) return { vidas: 0, conocidas, ganador: 'empate', motivo: `Llegaron hasta el nivel ${e.nivel}.` };
            return { vidas, conocidas, aviso: '💥 ¡Pared!' };
        }
        const pos = (y + dy) * n + x + dx;
        if (pos !== e.meta) return { pos, pasos: (e.pasos || 0) + 1, aviso: null };
        llego = true;
        if (e.nivel >= NIVELES_LABERINTO.length) return { pos, ganador: 'empate', motivo: `🎉 ¡Pasaron los ${NIVELES_LABERINTO.length} niveles con ${e.vidas} vida${e.vidas === 1 ? '' : 's'}!` };
        // Nivel siguiente: se cambian los roles.
        return { ...nivelLaberinto(e.nivel + 1, e.guia === 'nico' ? 'carito' : 'nico'), aviso: `⭐ ¡Nivel ${e.nivel} superado! Ahora guía ${nombreJugador(e.guia === 'nico' ? 'carito' : 'nico')}.` };
    });
    if (!res || !window.sfx) return;
    if (choque) window.sfx.error(); else if (llego) window.sfx.acierto(); else window.sfx.seleccionar && window.sfx.seleccionar();
}
