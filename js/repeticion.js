// ============================================================
// repeticion.js — "🎬 Ver la partida de nuevo" (Ajedrez y Damas).
//
// Cada jugada queda guardada en estado.jugadas; acá se rearma la
// partida desde el tablero inicial y se puede pasar jugada por jugada
// o dejarla correr sola, como una repetición.
// ============================================================
(function () {
    let cuadros = [], actual = 0, timer = null, juegoAbierto = null;

    function leer(juego) {
        return new Promise(res => {
            const u = window.onSnapshot(window.doc(window.db, 'juegos', juego), s => { u(); res(s.exists() ? s.data() : null); });
        });
    }

    // Arma la lista de tableros: [{ tablero, desde, a, texto }]
    function cuadrosAjedrez(jugadas) {
        let e = { tablero: crearTableroInicialAjedrez(), enroques: { ...ENROQUES_INICIALES_AJEDREZ }, alPaso: null, medioMov: 0 };
        const res = [{ tablero: e.tablero, texto: 'Arranca la partida' }];
        jugadas.forEach((j, i) => {
            const pieza = e.tablero[j.d];
            const mov = pieza && movimientosLegalesAjedrez(e, j.d).find(m => m.a === j.a);
            if (!mov) return;
            const n = aplicarMovimientoAjedrez(e, j.d, mov, j.c);
            e = { ...e, ...n };
            const quien = pieza[0] === 'n' ? 'Blancas' : 'Negras';
            let texto = `${quien}: ${NOMBRES_PIEZAS_AJEDREZ[pieza[1]]}`;
            if (mov.tipo === 'enroqueCorto') texto = `${quien}: enroque corto`;
            else if (mov.tipo === 'enroqueLargo') texto = `${quien}: enroque largo`;
            else if (n.capturada) texto += ` come ${NOMBRES_PIEZAS_AJEDREZ[n.capturada[1]]}`;
            const rival = pieza[0] === 'n' ? 'c' : 'n';
            if (reyEnJaqueAjedrez(e.tablero, rival)) texto += ' · ¡jaque!';
            res.push({ tablero: e.tablero, desde: j.d, a: j.a, texto: `${i + 1}. ${texto}` });
        });
        return res;
    }
    function cuadrosDamas(jugadas) {
        let t = crearTableroInicialDamas();
        const res = [{ tablero: t, texto: 'Arranca la partida' }];
        jugadas.forEach((j, i) => {
            const n = [...t];
            const pieza = n[j.d];
            n[j.d] = null;
            if (j.x != null) n[j.x] = null;
            n[j.a] = j.p || pieza;
            t = n;
            const quien = (j.p || pieza || 'n')[0] === 'n' ? 'Blancas' : 'Negras';
            res.push({ tablero: t, desde: j.d, a: j.a, texto: `${i + 1}. ${quien}: ${j.x != null ? 'come una ficha' : 'mueve'}${j.p && j.p.length > 1 && pieza && pieza.length === 1 ? ' · ¡corona! 👑' : ''}` });
        });
        return res;
    }

    const LLENA = { '♙': '♟', '♘': '♞', '♗': '♝', '♖': '♜', '♕': '♛', '♔': '♚' };
    function htmlTablero(juego, c) {
        const girar = juego === 'ajedrez' && miIdentidad === 'carito';
        let h = '<div class="tablero-juego repeticion-tablero">';
        for (let vr = 0; vr < 8; vr++) for (let vc = 0; vc < 8; vc++) {
            const row = girar ? 7 - vr : vr, col = girar ? 7 - vc : vc;
            const i = row * 8 + col;
            const p = c.tablero[i];
            let clases = 'casilla-tablero ' + ((row + col) % 2 ? 'casilla-oscura' : 'casilla-clara');
            if (i === c.desde || i === c.a) clases += ' casilla-ultimo-mov';
            let pieza = '';
            if (p && juego === 'ajedrez') {
                const g = EMOJI_PIEZAS_AJEDREZ[p];
                pieza = `<span class="pieza-tablero ${p[0] === 'n' ? 'aj-pieza-blanca' : 'aj-pieza-negra'}">${(LLENA[g] || g) + '︎'}</span>`;
            } else if (p) {
                pieza = `<span class="ficha-damas ${p[0] === 'n' ? 'blanca' : 'negra'}${p.length > 1 ? ' coronada' : ''}"></span>`;
            }
            h += `<div class="${clases}">${pieza}</div>`;
        }
        return h + '</div>';
    }

    function dibujar() {
        const hoja = document.querySelector('.repeticion-hoja');
        if (!hoja) return;
        const c = cuadros[actual];
        hoja.querySelector('.repeticion-zona').innerHTML = htmlTablero(juegoAbierto, c);
        hoja.querySelector('.repeticion-texto').textContent = c.texto;
        hoja.querySelector('.repeticion-cuenta').textContent = `${actual} / ${cuadros.length - 1}`;
        hoja.querySelector('.repeticion-barra').value = actual;
        hoja.querySelector('.repeticion-play').textContent = timer ? '⏸' : '▶️';
        // La pieza que se movió entra deslizándose desde su casilla de origen.
        if (c.a != null && !(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)) {
            const celdas = hoja.querySelectorAll('.repeticion-tablero > div');
            const girar = juegoAbierto === 'ajedrez' && miIdentidad === 'carito';
            const pos = (i) => girar ? 63 - i : i;
            const destino = celdas[pos(c.a)], origen = celdas[pos(c.desde)];
            const pieza = destino && destino.firstElementChild;
            if (pieza && origen) {
                const r1 = origen.getBoundingClientRect(), r2 = destino.getBoundingClientRect();
                pieza.style.position = 'relative'; pieza.style.zIndex = 5;
                pieza.animate([{ transform: `translate(${r1.left - r2.left}px,${r1.top - r2.top}px)` }, { transform: 'none' }], { duration: 320, easing: 'cubic-bezier(0.3,0.8,0.3,1)' });
            }
        }
    }
    function ir(n) {
        actual = Math.max(0, Math.min(cuadros.length - 1, n));
        if (actual === cuadros.length - 1) pausar();
        dibujar();
    }
    function pausar() { clearInterval(timer); timer = null; }
    function playPausa() {
        if (timer) { pausar(); dibujar(); return; }
        if (actual >= cuadros.length - 1) actual = 0;
        timer = setInterval(() => ir(actual + 1), 1100);
        ir(actual + 1);
    }

    async function abrir(juego) {
        cerrar();
        const e = await leer(juego);
        const jugadas = (e && e.jugadas) || [];
        if (!jugadas.length) return;
        juegoAbierto = juego;
        cuadros = juego === 'ajedrez' ? cuadrosAjedrez(jugadas) : cuadrosDamas(jugadas);
        actual = 0;
        const fondo = document.createElement('div');
        fondo.className = 'compu-selector-fondo repeticion-fondo';
        fondo.onclick = (ev) => { if (ev.target === fondo) cerrar(); };
        fondo.innerHTML = `<div class="compu-selector panel repeticion-hoja" role="dialog" aria-label="Repetición de la partida">
            <div class="compu-selector-titulo">🎬 Repetición · <span class="repeticion-cuenta"></span></div>
            <div class="repeticion-zona"></div>
            <div class="repeticion-texto texto-centro"></div>
            <input type="range" class="repeticion-barra" min="0" max="${cuadros.length - 1}" value="0" oninput="irRepeticion(+this.value)" aria-label="Jugada">
            <div class="btn-fila repeticion-controles">
                <button class="btn-secundario" onclick="irRepeticion(0)" aria-label="Al principio">⏮</button>
                <button class="btn-secundario" onclick="irRepeticion(null, -1)" aria-label="Anterior">◀</button>
                <button class="btn-principal repeticion-play" onclick="playRepeticion()" aria-label="Reproducir">▶️</button>
                <button class="btn-secundario" onclick="irRepeticion(null, 1)" aria-label="Siguiente">▶</button>
                <button class="btn-secundario" onclick="irRepeticion(${cuadros.length - 1})" aria-label="Al final">⏭</button>
            </div>
            <button class="btn-secundario" style="margin-top:8px;" onclick="cerrarRepeticion()">Cerrar</button>
        </div>`;
        document.body.appendChild(fondo);
        dibujar();
        playPausa();
    }
    function cerrar() { pausar(); document.querySelectorAll('.repeticion-fondo').forEach(x => x.remove()); }

    window.abrirRepeticion = abrir;
    window.cerrarRepeticion = cerrar;
    window.playRepeticion = playPausa;
    window.irRepeticion = (n, delta) => { pausar(); ir(n == null ? actual + delta : n); };
})();
