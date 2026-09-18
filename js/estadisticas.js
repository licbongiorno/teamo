// ============================================================
// estadisticas.js - pantalla "Nuestra Historia": junta los
// contadores que ya alimenta logros.js, los puntos compartidos y
// la racha, en un solo resumen. Ademas muestra la grilla de logros
// (desbloqueados y pendientes).
// ============================================================
async function _leerDocUnaVez(coleccionId){
    const ref = window.doc(window.db, 'juegos', coleccionId);
    const snap = await new Promise((res) => { const u = window.onSnapshot(ref, s => { u(); res(s); }); });
    return snap.exists() ? snap.data() : {};
}

const _ETIQUETAS_CONTADOR = {
    gano_truco: { icono: '🃏', nombre: 'Partidas de truco' },
    gano_ajedrez: { icono: '♟️', nombre: 'Partidas de ajedrez' },
    gano_damas: { icono: '⚫', nombre: 'Partidas de damas' },
    reflexion_completada: { icono: '💭', nombre: 'Rondas de reflexion reveladas' },
    carta_indagacion: { icono: '🌙', nombre: 'Cartas de indagacion' },
    espejo_respondido: { icono: '🪞', nombre: 'Rondas de El Espejo' },
    mentegemela_coincidencia: { icono: '👯', nombre: 'Coincidencias en Mente Gemela' },
    carta_tiempo_enviada: { icono: '💌', nombre: 'Cartas para abrir despues' },
    letra_agregada: { icono: '🪶', nombre: 'Fragmentos escritos juntos' },
    dibujo_completado: { icono: '🎨', nombre: 'Dibujos adivinados' },
};

// Guardado para que descargarNuestraHistoria() no tenga que volver a
// pedir todo (racha/puntos/logros) — sólo agrega gratitud/deseos/muro,
// que esta pantalla no necesita para su propio resumen.
let _ultimoResumenEstadisticas = null;

async function iniciarEstadisticas(){
    const cont = document.getElementById('contenido-estadisticas');
    cont.innerHTML = `<div class="panel texto-centro texto-tenue">Cargando…</div>`;
    registrarEvento('visita_estadisticas', `${nombreJugador(miIdentidad)} miro Nuestra Historia`);

    const [contadores, logrosDoc, puntos, racha] = await Promise.all([
        _leerDocUnaVez('contadores'),
        _leerDocUnaVez('logros'),
        new Promise((res) => { if (window.escucharPuntos) { const u = window.escucharPuntos((p) => { res(p); }); } else res({}); }),
        _leerDocUnaVez('racha'),
    ]);

    _ultimoResumenEstadisticas = { contadores, desbloqueados: logrosDoc.desbloqueados || {}, puntos: puntos || {}, racha };
    renderEstadisticas(contadores, logrosDoc.desbloqueados || {}, puntos || {}, racha);
}

// Categorías de eventos que cuentan para el "nivel de variedad": jugar
// siempre lo mismo no suma niveles, probar cosas distintas sí. Cada
// tipo de evento de _ETIQUETAS_CONTADOR + los géneros de juego más
// generales (arcade, cooperativos) sumados por registrarEvento en otros
// lados quedan afuera a propósito — el nivel mide variedad de EXPERIENCIA
// (charla profunda, tablero, escritura, etc), no cuántos juegos distintos.
const _CATEGORIAS_VARIEDAD = {
    gano_truco: 'tablero', gano_ajedrez: 'tablero', gano_damas: 'tablero', gano_partida: 'tablero',
    reflexion_completada: 'conexion', carta_indagacion: 'conexion', espejo_respondido: 'conexion', mentegemela_coincidencia: 'conexion',
    carta_tiempo_enviada: 'cuidado', cuidado_compartido: 'cuidado',
    letra_agregada: 'creativo', dibujo_completado: 'creativo',
};
const _NIVELES_VARIEDAD = [
    { desde: 0, nombre: 'Recién arrancando' },
    { desde: 1, nombre: 'Curiosos' },
    { desde: 2, nombre: 'Exploradores' },
    { desde: 3, nombre: 'Compinches' },
    { desde: 4, nombre: 'Equipo completo' },
];
function calcularNivelVariedad(contadores){
    const categoriasConActividad = new Set(
        Object.entries(contadores)
            .filter(([tipo, valor]) => valor > 0 && _CATEGORIAS_VARIEDAD[tipo])
            .map(([tipo]) => _CATEGORIAS_VARIEDAD[tipo])
    );
    const n = categoriasConActividad.size;
    let nivel = _NIVELES_VARIEDAD[0];
    for (const nv of _NIVELES_VARIEDAD) if (n >= nv.desde) nivel = nv;
    return { nivel: _NIVELES_VARIEDAD.indexOf(nivel) + 1, nombre: nivel.nombre, categorias: n, total: 4 };
}

// Calendario de los últimos 35 días (5 semanas): un cuadradito por día,
// resaltado si esa fecha está en el historial de racha compartida.
function renderCalendarioRacha(diasAmbos){
    const set = new Set(diasAmbos || []);
    const hoy = new Date();
    const celdas = [];
    for (let i = 34; i >= 0; i--) {
        const d = new Date(hoy);
        d.setDate(d.getDate() - i);
        const fecha = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        celdas.push({ fecha, jugado: set.has(fecha), esHoy: i === 0 });
    }
    return `<div class="panel">
        <div class="texto-tenue" style="margin-bottom:8px;">🗓️ Últimos 35 días jugando juntos</div>
        <div class="calendario-racha">
            ${celdas.map(c => `<div class="celda-racha ${c.jugado ? 'jugado' : ''} ${c.esHoy ? 'es-hoy' : ''}" title="${c.fecha}${c.jugado ? ' · jugaron los dos' : ''}"></div>`).join('')}
        </div>
    </div>`;
}

function renderEstadisticas(contadores, desbloqueados, puntos, racha){
    const cont = document.getElementById('contenido-estadisticas');

    let html = `<div class="panel texto-centro">
        <p style="font-family:var(--fuente-titulo); font-size:1.4rem; margin:0 0 6px;">Nuestra Historia</p>
        <p class="texto-tenue" style="margin:0 0 12px;">Todo lo que fueron construyendo juntos, en un solo lugar.</p>
        <button class="btn-secundario" id="btn-descargar-historia" onclick="descargarNuestraHistoria()">💌 Descargar como recuerdo</button>
    </div>`;

    html += `<div class="panel">
        <div style="display:flex; justify-content:space-around; text-align:center;">
            <div><div style="font-size:1.4rem;">🔥</div><div class="texto-tenue">${racha.rachaActual || 0} racha actual</div></div>
            <div><div style="font-size:1.4rem;">🏅</div><div class="texto-tenue">${racha.mejorRacha || 0} mejor racha</div></div>
            <div><div style="font-size:1.4rem;">💙💖</div><div class="texto-tenue">${(puntos.nico || 0) + (puntos.carito || 0)} puntos totales</div></div>
        </div>
    </div>`;

    html += renderCalendarioRacha(racha.diasAmbos);

    const nv = calcularNivelVariedad(contadores);
    html += `<div class="panel texto-centro">
        <div class="texto-tenue" style="margin-bottom:4px;">Nivel ${nv.nivel} de 5</div>
        <div style="font-family:var(--fuente-titulo); font-size:1.3rem;">${nv.nombre}</div>
        <div class="barra-progreso-jardin" style="margin-top:8px;"><div class="relleno-progreso-jardin barra-crecer" style="width:${(nv.categorias / nv.total) * 100}%;"></div></div>
        <div class="texto-tenue" style="margin-top:6px; font-size:0.75rem;">Probaron ${nv.categorias} de ${nv.total} tipos de juego distintos</div>
    </div>`;

    const filas = Object.keys(_ETIQUETAS_CONTADOR)
        .map(k => ({ ...(_ETIQUETAS_CONTADOR[k]), valor: contadores[k] || 0 }))
        .filter(f => f.valor > 0)
        .sort((a, b) => b.valor - a.valor);

    html += `<div class="panel"><div class="texto-tenue" style="margin-bottom:10px;">📊 Numeros</div>`;
    if (filas.length) {
        filas.forEach(f => {
            html += `<div style="display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px solid rgba(255,255,255,0.08); font-size:0.88rem;">
                <span>${f.icono} ${f.nombre}</span><b>${f.valor}</b>
            </div>`;
        });
    } else {
        html += `<p class="texto-tenue">Todavia no hay numeros para mostrar. Van a ir apareciendo a medida que jueguen.</p>`;
    }
    html += `</div>`;

    const total = window.CATALOGO_LOGROS.length;
    const desbloqueadosCant = window.CATALOGO_LOGROS.filter(l => desbloqueados[l.id]).length;
    html += `<div class="panel"><div class="texto-tenue" style="margin-bottom:10px;">🏆 Logros (${desbloqueadosCant}/${total})</div>
        <div class="grilla-logros">`;
    window.CATALOGO_LOGROS.forEach(l => {
        const logrado = !!desbloqueados[l.id];
        html += `<div class="tarjeta-logro ${logrado ? 'tarjeta-logro-desbloqueada' : 'tarjeta-logro-bloqueada'}" title="${l.descripcion}">
            <div class="tarjeta-logro-icono">${logrado ? l.icono : '🔒'}</div>
            <div class="tarjeta-logro-nombre">${l.nombre}</div>
        </div>`;
    });
    html += `</div></div>`;

    cont.innerHTML = html;
}

// ============================================================
// DESCARGAR "NUESTRA HISTORIA" — un archivo .html autocontenido con
// todo lo que fueron guardando (gratitud, deseos, muro) más el resumen
// de esta pantalla, para tener de recuerdo aparte de Firestore. Se abre
// como cualquier página web (en el celular o la computadora) y desde
// ahí se puede "Imprimir → Guardar como PDF" si quieren un PDF.
// ============================================================
function _escaparHtml(texto){
    const div = document.createElement('div');
    div.innerText = texto == null ? '' : String(texto);
    return div.innerHTML;
}

// Lectura de una colección completa, una sola vez (no queda escuchando
// como sí hacen gratitud.js/deseos.js/muro.js para sus pantallas en
// vivo) — mismo patrón que _leerDocUnaVez de acá arriba, pero para una
// colección entera en vez de un solo documento.
function _leerColeccionUnaVez(nombreColeccion, campoOrden, direccion){
    return new Promise((res) => {
        const q = window.query(window.collection(window.db, nombreColeccion), window.orderBy(campoOrden, direccion || 'asc'));
        const u = window.onSnapshot(q, (snap) => {
            u();
            res(snap.docs.map(d => d.data()));
        }, () => { u(); res([]); });
    });
}

function _formatearFechaHistoria(valor){
    if (!valor) return '';
    if (typeof valor === 'string') return valor;
    if (valor.toDate) return valor.toDate().toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });
    return '';
}

function _seccionHistoria(titulo, notas, vacioTexto){
    if (!notas.length) return `<section class="seccion"><h2>${titulo}</h2><p class="vacio">${vacioTexto}</p></section>`;
    const items = notas.map(n => `
        <div class="nota nota-${n.autor === 'carito' ? 'carito' : 'nico'}">
            <div class="nota-cabecera">
                <span class="nota-autor">${n.autor === 'carito' ? 'Carito 💖' : 'Nico 💙'}</span>
                <span class="nota-fecha">${_escaparHtml(_formatearFechaHistoria(n.fecha))}</span>
            </div>
            <div class="nota-texto">${_escaparHtml(n.texto)}</div>
        </div>`).join('');
    return `<section class="seccion"><h2>${titulo}</h2>${items}</section>`;
}

function _seccionDeseosHistoria(deseos){
    if (!deseos.length) return `<section class="seccion"><h2>✨ Deseos compartidos</h2><p class="vacio">Todavía no escribieron ningún deseo.</p></section>`;
    const items = deseos.map(d => `
        <div class="nota nota-${d.autor === 'carito' ? 'carito' : 'nico'} ${d.cumplido ? 'cumplido' : ''}">
            <div class="nota-cabecera">
                <span class="nota-autor">${d.autor === 'carito' ? 'Carito 💖' : 'Nico 💙'}</span>
                <span class="nota-estado">${d.cumplido ? '💗 Cumplido' : '🤍 Pendiente'}</span>
            </div>
            <div class="nota-texto">${_escaparHtml(d.texto)}</div>
        </div>`).join('');
    return `<section class="seccion"><h2>✨ Deseos compartidos</h2>${items}</section>`;
}

async function descargarNuestraHistoria(){
    const btn = document.getElementById('btn-descargar-historia');
    if (btn) { btn.disabled = true; btn.innerText = 'Armando el recuerdo…'; }
    vibrarJ(10);
    try {
        const [gratitud, deseos, muro] = await Promise.all([
            _leerColeccionUnaVez('gratitud', 'timestamp', 'asc'),
            _leerColeccionUnaVez('deseos', 'timestamp', 'asc'),
            _leerColeccionUnaVez('muro', 'timestamp', 'asc'),
        ]);

        const resumen = _ultimoResumenEstadisticas || { racha: {}, puntos: {}, desbloqueados: {} };
        const totalLogros = window.CATALOGO_LOGROS ? window.CATALOGO_LOGROS.length : 0;
        const logrosCant = window.CATALOGO_LOGROS ? window.CATALOGO_LOGROS.filter(l => resumen.desbloqueados[l.id]).length : 0;
        const hoy = new Date().toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });

        const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Nuestra Historia</title>
<link href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&family=Montserrat:wght@400;600;700&display=swap" rel="stylesheet">
<style>
    :root{ --rosa:#ffb3c6; --lila:#c9b6ff; --celeste:#a8d8ff; --verde:#a8edea; --texto:#3a2e40; }
    *{ box-sizing:border-box; }
    body{
        margin:0; padding:0; font-family:'Montserrat',sans-serif; color:var(--texto);
        background:radial-gradient(ellipse 140% 60% at 50% 0%, #fff6f9 0%, #fdf3ea 55%, #f3e2d3 100%);
    }
    .contenedor{ max-width:640px; margin:0 auto; padding:40px 22px 80px; }
    .portada{ text-align:center; margin-bottom:40px; }
    .portada h1{ font-family:'Dancing Script',cursive; font-size:3rem; margin:0 0 6px;
        background:linear-gradient(90deg,var(--rosa),var(--lila),var(--celeste)); -webkit-background-clip:text; background-clip:text; color:transparent; }
    .portada p{ opacity:0.7; margin:0; font-style:italic; }
    .resumen{ display:flex; justify-content:center; gap:22px; flex-wrap:wrap; margin:26px 0 44px;
        background:rgba(255,255,255,0.5); border-radius:18px; padding:18px; }
    .resumen div{ text-align:center; min-width:90px; }
    .resumen .num{ font-size:1.5rem; font-weight:700; }
    .resumen .etq{ font-size:0.72rem; opacity:0.65; text-transform:uppercase; letter-spacing:0.03em; }
    .seccion{ margin-bottom:38px; }
    .seccion h2{ font-family:'Dancing Script',cursive; font-size:1.7rem; margin:0 0 16px;
        border-bottom:2px solid rgba(255,179,198,0.4); padding-bottom:8px; }
    .vacio{ opacity:0.6; font-style:italic; font-size:0.9rem; }
    .nota{ background:#fff; border-radius:14px; padding:14px 16px; margin-bottom:10px;
        border-left:4px solid var(--celeste); box-shadow:0 2px 10px rgba(0,0,0,0.05); }
    .nota-carito{ border-left-color:var(--rosa); }
    .nota-nico{ border-left-color:var(--celeste); }
    .nota.cumplido{ opacity:0.75; background:#fffaf0; }
    .nota-cabecera{ display:flex; justify-content:space-between; font-size:0.78rem; opacity:0.65; margin-bottom:6px; }
    .nota-texto{ font-size:0.95rem; line-height:1.5; white-space:pre-wrap; }
    .pie{ text-align:center; margin-top:50px; font-family:'Dancing Script',cursive; font-size:1.3rem; opacity:0.75; }
    @media print{ body{ background:#fff; } .nota{ box-shadow:none; border:1px solid #eee; border-left-width:4px; } }
</style>
</head>
<body>
<div class="contenedor">
    <div class="portada">
        <h1>Nuestra Historia</h1>
        <p>Nico 💙 &amp; Carito 💖 — descargado el ${hoy}</p>
    </div>

    <div class="resumen">
        <div><div class="num">🔥 ${resumen.racha.rachaActual || 0}</div><div class="etq">Racha actual</div></div>
        <div><div class="num">🏅 ${resumen.racha.mejorRacha || 0}</div><div class="etq">Mejor racha</div></div>
        <div><div class="num">🏆 ${logrosCant}/${totalLogros}</div><div class="etq">Logros</div></div>
        <div><div class="num">💛 ${gratitud.length}</div><div class="etq">Gratitudes</div></div>
        <div><div class="num">🕊️ ${muro.length}</div><div class="etq">Recuerdos</div></div>
    </div>

    ${_seccionHistoria('💛 Rincón de la Gratitud', gratitud, 'Todavía no escribieron ninguna gratitud.')}
    ${_seccionDeseosHistoria(deseos)}
    ${_seccionHistoria('🕊️ Muro en el Tiempo', muro, 'Todavía no guardaron ningún recuerdo.')}

    <div class="pie">Con todo nuestro amor 💕</div>
</div>
</body>
</html>`;

        const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'nuestra-historia.html';
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 2000);
        vibrarJ([15, 30, 15]);
    } catch (e) {
        console.error('No se pudo armar el recuerdo:', e);
        alert('No se pudo armar el archivo. Probá de nuevo en un ratito.');
    } finally {
        if (btn) { btn.disabled = false; btn.innerText = '💌 Descargar como recuerdo'; }
    }
}
window.descargarNuestraHistoria = descargarNuestraHistoria;
