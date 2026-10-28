// ==================== ROSCO (tipo Pasapalabra) ====================
// Los dos juegan el mismo rosco, cada uno en su celu y con su reloj
// (150 segundos desde que toca "Empezar"). Una definición por letra:
// "Empieza con…" o "Contiene la…". Se puede pasar ("¡Pasapalabra!") y
// volver después. Gana quien acierte más (si empatan, quien erró menos).
const SEGUNDOS_ROSCO = 150;
const LETRAS_ROSCO = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'l', 'm', 'n', 'ñ', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'x', 'y', 'z'];
// [letra, 'e' empieza | 'c' contiene, definición, respuesta(s) separadas por |]
const BANCO_ROSCO = [
    ['a', 'e', 'Insecto que fabrica miel.', 'abeja'], ['a', 'e', 'Planta grande con tronco y ramas.', 'arbol'], ['a', 'e', 'Lo que se siente por alguien a quien se quiere mucho.', 'amor'],
    ['b', 'e', 'Embarcación que flota y navega.', 'barco|bote'], ['b', 'e', 'Lo que se da con los labios.', 'beso'], ['b', 'e', 'Mujer con escoba y sombrero puntiagudo de los cuentos.', 'bruja'],
    ['c', 'e', 'Animal con joroba que cruza el desierto.', 'camello'], ['c', 'e', 'Lugar donde se vive con la familia.', 'casa'], ['c', 'e', 'Bebida caliente, oscura, que despierta a la mañana.', 'cafe'],
    ['d', 'e', 'Reptil gigante que vivió hace millones de años.', 'dinosaurio'], ['d', 'e', 'Séptimo día de la semana, el del asado.', 'domingo'], ['d', 'e', 'Cubo con puntitos del 1 al 6.', 'dado'],
    ['e', 'e', 'Animal enorme con trompa.', 'elefante'], ['e', 'e', 'Superficie que refleja tu imagen.', 'espejo'], ['e', 'e', 'Astro que brilla de noche en el cielo.', 'estrella'],
    ['f', 'e', 'Celebración con música, baile y amigos.', 'fiesta'], ['f', 'e', 'Lo que hace la vela al prenderse, da calor y luz.', 'fuego'], ['f', 'e', 'Parte de la planta con pétalos de colores.', 'flor'],
    ['g', 'e', 'Animal de compañía que ronronea.', 'gato'], ['g', 'e', 'Instrumento de seis cuerdas.', 'guitarra'], ['g', 'e', 'Lo que se grita cuando la pelota entra al arco.', 'gol'],
    ['h', 'e', 'Postre frío que se come en cucurucho.', 'helado'], ['h', 'e', 'Agua congelada.', 'hielo'], ['h', 'e', 'Lo que pone la gallina.', 'huevo'],
    ['i', 'e', 'Porción de tierra rodeada de agua.', 'isla'], ['i', 'e', 'Lo que tiene alguien creativo cuando se le prende la lamparita.', 'idea'], ['i', 'e', 'Estación del año más fría.', 'invierno'],
    ['j', 'e', 'Animal africano de cuello larguísimo.', 'jirafa'], ['j', 'e', 'Lugar con plantas y flores en una casa.', 'jardin'], ['j', 'e', 'Lo que se hace con el Truco o el UNO.', 'jugar|juego'],
    ['l', 'e', 'Satélite de la Tierra que se ve de noche.', 'luna'], ['l', 'e', 'Se hojea y se lee.', 'libro'], ['l', 'e', 'Rey de la selva.', 'leon'],
    ['m', 'e', 'Infusión argentina que se toma con bombilla.', 'mate'], ['m', 'e', 'Gran masa de agua salada.', 'mar'], ['m', 'e', 'Fruta roja o verde, la de Blancanieves.', 'manzana'],
    ['n', 'e', 'Agua helada que cae del cielo en copos.', 'nieve'], ['n', 'e', 'Parte del día cuando está oscuro.', 'noche'], ['n', 'e', 'Masa blanca que flota en el cielo.', 'nube'],
    ['ñ', 'c', 'Lo que se hace al dormir y a veces se recuerda.', 'sueño'], ['ñ', 'c', 'Celebración que se festeja una vez por año con torta.', 'cumpleaños'], ['ñ', 'c', 'Estación del año en que caen las hojas.', 'otoño'],
    ['o', 'e', 'Animal grande y peludo que hiberna.', 'oso'], ['o', 'e', 'Movimiento del mar que rompe en la playa.', 'ola'], ['o', 'e', 'Parte del cuerpo con la que se escucha.', 'oreja|oido'],
    ['p', 'e', 'Lugar con arena junto al mar.', 'playa'], ['p', 'e', 'Comida redonda con muzzarella.', 'pizza'], ['p', 'e', 'Ave que no vuela y vive en el frío.', 'pinguino'],
    ['q', 'e', 'Lácteo amarillo que aman los ratones.', 'queso'], ['q', 'e', 'Lo que se dice para preguntar "¿cuál cosa?".', 'que'], ['q', 'e', 'Lo que se hace cuando a alguien se lo ama: …-er.', 'querer'],
    ['r', 'e', 'Aparato que da la hora.', 'reloj'], ['r', 'e', 'Lo que se le hace a alguien en su cumpleaños.', 'regalo'], ['r', 'e', 'Flor con espinas, símbolo del amor.', 'rosa'],
    ['s', 'e', 'Estrella que nos da luz y calor.', 'sol'], ['s', 'e', 'Mueble para sentarse.', 'silla'], ['s', 'e', 'Mujer mitad pez de las leyendas.', 'sirena'],
    ['t', 'e', 'Postre de cumpleaños con velitas.', 'torta'], ['t', 'e', 'Transporte que va por las vías.', 'tren'], ['t', 'e', 'Animal lento con caparazón.', 'tortuga'],
    ['u', 'e', 'Juego de cartas de colores donde hay que gritar su nombre.', 'uno'], ['u', 'e', 'Fruta pequeña con la que se hace el vino.', 'uva'], ['u', 'e', 'Lo que hay en las puntas de los dedos.', 'uña|uñas'],
    ['v', 'e', 'Estación del año más calurosa.', 'verano'], ['v', 'e', 'Lo que se hace al irse de vacaciones lejos.', 'viaje|viajar'], ['v', 'e', 'Abertura en la pared por donde entra la luz.', 'ventana'],
    ['x', 'c', 'Instrumento de placas que se toca con palitos.', 'xilofon|xilofono'], ['x', 'c', 'Lo que se rinde en la escuela para aprobar.', 'examen'], ['x', 'c', 'Vehículo amarillo que se para con la mano.', 'taxi'],
    ['y', 'e', 'Lácteo cremoso, a veces con frutas.', 'yogur|yogurt'], ['y', 'c', 'Lugar con arena y mar donde se toma sol.', 'playa'], ['y', 'c', 'Animal de campo, macho de la vaca, que tira del arado.', 'buey'],
    ['z', 'e', 'Animal astuto de cola peluda.', 'zorro'], ['z', 'e', 'Calzado que se pone en los pies.', 'zapato|zapatilla'], ['z', 'c', 'Sirve para escribir y se le saca punta.', 'lapiz'],
];
const normalizarRosco = (t) => String(t || '').toLowerCase().trim().replace(/á/g, 'a').replace(/é/g, 'e').replace(/í/g, 'i').replace(/ó/g, 'o').replace(/[úü]/g, 'u');
function preguntasRosco() {
    return LETRAS_ROSCO.map(l => { const ops = BANCO_ROSCO.map((p, i) => [p, i]).filter(([p]) => p[0] === l); return ops[Math.floor(Math.random() * ops.length)][1]; });
}
const vacioRosco = () => ({ estado: '.'.repeat(LETRAS_ROSCO.length), actual: 0, inicio: null, fin: false });
const aciertosRosco = (j) => [...j.estado].filter(c => c === 'o').length;
const erroresRosco = (j) => [...j.estado].filter(c => c === 'x').length;
let _timerRosco = null;

const Rosco = JuegoTurnos.crear({
    id: 'rosco',
    sinTurno: true,
    emojiListo: '🅰️',
    intro: `El mismo rosco para los dos: una palabra por cada letra, en ${SEGUNDOS_ROSCO} segundos. Escribí la respuesta o decí "¡Pasapalabra!" para volver después. Gana quien acierte más.`,
    inicial: () => ({ preguntas: preguntasRosco(), jugadores: { nico: vacioRosco(), carito: vacioRosco() }, turno: null }),
    tituloFin: (e) => e.ganador === 'empate' ? '🤝 ¡Empate en el rosco!' : `🏆 ¡${nombreJugador(e.ganador)} gana el rosco!`,
    render(e, c) {
        const yo = c.yo, el = c.rival, j = e.jugadores[yo], o = e.jugadores[el];
        let h = `<div class="rosco">${LETRAS_ROSCO.map((l, i) => {
            const ang = (i / LETRAS_ROSCO.length) * Math.PI * 2 - Math.PI / 2;
            const st = j.estado[i];
            return `<span class="letra-rosco ${st === 'o' ? 'bien' : st === 'x' ? 'mal' : ''}${!j.fin && j.inicio && i === j.actual ? ' actual' : ''}" style="left:${50 + Math.cos(ang) * 44}%;top:${50 + Math.sin(ang) * 44}%">${l.toUpperCase()}</span>`;
        }).join('')}<div class="centro-rosco"><b id="reloj-rosco">${j.inicio && !j.fin ? '' : j.fin ? '🏁' : SEGUNDOS_ROSCO}</b><small>✅ ${aciertosRosco(j)} · ❌ ${erroresRosco(j)}</small></div></div>`;
        if (e.fase === 'jugando' && !j.inicio) h += `<div class="texto-centro"><button class="btn-principal" onclick="empezarRosco()">▶️ Empezar mi rosco</button></div>`;
        else if (e.fase === 'jugando' && !j.fin) {
            const p = BANCO_ROSCO[e.preguntas[j.actual]];
            h += `<div class="panel texto-centro"><div class="texto-tenue">${p[1] === 'e' ? 'Empieza con' : 'Contiene la'} <b class="letra-grande-rosco">${p[0].toUpperCase()}</b></div>
                <div style="margin:8px 0; font-size:1.02rem;">${p[2]}</div>
                <input id="resp-rosco" class="input-texto" autocomplete="off" autocapitalize="off" placeholder="Tu respuesta…" onkeydown="if(event.key==='Enter') responderRosco()">
                <div class="btn-fila" style="margin-top:8px;"><button class="btn-principal" onclick="responderRosco()">Responder</button><button class="btn-secundario" onclick="pasapalabraRosco()">¡Pasapalabra!</button></div></div>`;
        } else if (e.fase === 'jugando') h += `<div class="panel texto-centro">Terminaste con ${aciertosRosco(j)} aciertos. ${o.fin ? '' : `Esperando a ${nombreJugador(el)}…`}</div>`;
        h += `<div class="texto-centro texto-tenue" style="font-size:0.8rem;">${nombreJugador(el)}: ${o.inicio ? `✅ ${aciertosRosco(o)} · ❌ ${erroresRosco(o)}${o.fin ? ' · terminó' : ' · jugando…'}` : 'todavía no empezó'}</div>`;
        if (e.fase === 'terminado') h += `<div class="panel texto-tenue" style="font-size:0.78rem; line-height:1.6;">${e.preguntas.map((pi, i) => { const p = BANCO_ROSCO[pi]; return `<b>${p[0].toUpperCase()}</b>: ${p[3].split('|')[0]}`; }).join(' · ')}</div>`;
        return h;
    },
    alDibujar(cont, e) {
        clearInterval(_timerRosco);
        const j = e.jugadores[miIdentidad];
        if (e.fase !== 'jugando' || !j.inicio || j.fin) return;
        const input = cont.querySelector('#resp-rosco');
        if (input) setTimeout(() => input.focus(), 50);
        const tic = () => {
            const quedan = Math.max(0, Math.ceil(SEGUNDOS_ROSCO - (window.ahoraSync() - j.inicio) / 1000));
            const r = document.getElementById('reloj-rosco');
            if (r) r.textContent = quedan;
            if (quedan <= 0) { clearInterval(_timerRosco); terminarRosco(); }
        };
        tic();
        _timerRosco = setInterval(tic, 500);
        window._unsubTimerRosco = () => clearInterval(_timerRosco);
    }
});

function siguientePendienteRosco(estado, desde) {
    for (let k = 1; k <= LETRAS_ROSCO.length; k++) { const i = (desde + k) % LETRAS_ROSCO.length; if (estado[i] === '.') return i; }
    return -1;
}
function cerrarRosco(e, jugadores) {
    if (!jugadores.nico.fin || !jugadores.carito.fin) return { jugadores };
    const an = aciertosRosco(jugadores.nico), ac = aciertosRosco(jugadores.carito);
    let g = an === ac ? (erroresRosco(jugadores.nico) === erroresRosco(jugadores.carito) ? 'empate' : erroresRosco(jugadores.nico) < erroresRosco(jugadores.carito) ? 'nico' : 'carito') : an > ac ? 'nico' : 'carito';
    return { jugadores, ganador: g, motivo: `Aciertos: ${nombreJugador('nico')} ${an} — ${ac} ${nombreJugador('carito')}` };
}
async function empezarRosco() {
    await Rosco.accion((e) => {
        const j = e.jugadores[miIdentidad];
        if (j.inicio) return null;
        return { jugadores: { ...e.jugadores, [miIdentidad]: { ...j, inicio: window.ahoraSync() } } };
    });
}
async function responderRosco() {
    const resp = normalizarRosco(document.getElementById('resp-rosco')?.value);
    if (!resp) return;
    let bien = false;
    await Rosco.accion((e) => {
        const j = { ...e.jugadores[miIdentidad] };
        if (j.fin || !j.inicio) return null;
        const p = BANCO_ROSCO[e.preguntas[j.actual]];
        bien = p[3].split('|').some(r => normalizarRosco(r) === resp);
        j.estado = j.estado.slice(0, j.actual) + (bien ? 'o' : 'x') + j.estado.slice(j.actual + 1);
        const sig = siguientePendienteRosco(j.estado, j.actual);
        if (sig < 0) j.fin = true; else j.actual = sig;
        return cerrarRosco(e, { ...e.jugadores, [miIdentidad]: j });
    });
    if (window.sfx) window.sfx[bien ? 'acierto' : 'error']();
}
async function pasapalabraRosco() {
    if (window.sfx) window.sfx.swoosh();
    await Rosco.accion((e) => {
        const j = { ...e.jugadores[miIdentidad] };
        if (j.fin) return null;
        const sig = siguientePendienteRosco(j.estado, j.actual);
        if (sig < 0 || sig === j.actual) return null;
        j.actual = sig;
        return { jugadores: { ...e.jugadores, [miIdentidad]: j } };
    });
}
async function terminarRosco() {
    await Rosco.accion((e) => {
        const j = e.jugadores[miIdentidad];
        if (j.fin) return null;
        return cerrarRosco(e, { ...e.jugadores, [miIdentidad]: { ...j, fin: true } });
    });
}
