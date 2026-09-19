// ==================== MODO NOSTALGIA ====================
// Arma un resumen del mes que acaba de terminar: cuántos días jugaron
// juntos, qué logros desbloquearon, cuánta actividad hubo. No guarda
// nada nuevo ni resetea contadores mes a mes — se calcula al vuelo a
// partir de datos que ya existen (racha.diasAmbos, logros.desbloqueados,
// el historial de eventos). navegacion.js avisa con un toast cuando
// arranca un mes nuevo y todavía no vieron el resumen del anterior.
function _mesAnteriorInfoNostalgia(){
    const hoy = new Date();
    const d = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
    const inicio = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
    const fin = new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime(); // exclusivo
    const nombreMes = d.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
    return { inicio, fin, nombreMes };
}

async function iniciarNostalgia(){
    const cont = document.getElementById('contenido-nostalgia');
    if (!cont) return;
    cont.innerHTML = `<div class="panel texto-centro texto-tenue">Armando el resumen…</div>`;
    const { inicio, fin, nombreMes } = _mesAnteriorInfoNostalgia();

    try {
        const [racha, logrosDoc, eventos] = await Promise.all([
            _leerDocUnaVez('racha'),
            _leerDocUnaVez('logros'),
            (typeof window.leerUltimosEventos === 'function') ? window.leerUltimosEventos(500) : Promise.resolve([]),
        ]);

        const diasDelMes = (racha.diasAmbos || []).filter(f => {
            const t = new Date(f + 'T00:00:00').getTime();
            return t >= inicio && t < fin;
        });

        const desbloqueados = logrosDoc.desbloqueados || {};
        const logrosDelMes = Object.keys(desbloqueados)
            .filter(id => desbloqueados[id] && desbloqueados[id].fecha >= inicio && desbloqueados[id].fecha < fin)
            .map(id => (window.CATALOGO_LOGROS || []).find(l => l.id === id))
            .filter(Boolean);

        const eventosDelMes = (eventos || []).filter(e => (e.creadoEn || 0) >= inicio && (e.creadoEn || 0) < fin);

        renderNostalgia(nombreMes, diasDelMes.length, logrosDelMes, eventosDelMes.length);
        registrarEvento('visita_nostalgia', `${nombreJugador(miIdentidad)} miró el resumen del mes`);
    } catch (e) {
        console.error('No se pudo armar el resumen de nostalgia:', e);
        cont.innerHTML = `<div class="panel texto-centro texto-tenue">⚠️ No se pudo armar el resumen. Probá de nuevo en un rato.</div>`;
    }
}

function renderNostalgia(nombreMes, cantDias, logrosDelMes, cantEventos){
    const cont = document.getElementById('contenido-nostalgia');
    const huboActividad = cantDias > 0 || logrosDelMes.length > 0 || cantEventos > 0;

    let html = `<div class="panel texto-centro logro-animado">
        <p style="font-size:1.8rem; margin:0 0 6px;">🎁</p>
        <p style="font-family:var(--fuente-titulo); font-size:1.3rem; margin:0;">Resumen de ${nombreMes}</p>
    </div>`;

    if (!huboActividad) {
        html += `<div class="panel texto-centro texto-tenue">No quedó registrado mucho ese mes — el que viene puede ser mejor. 💜</div>`;
        cont.innerHTML = html;
        return;
    }

    html += `<div class="panel">
        <div style="display:flex; justify-content:space-around; text-align:center;">
            <div><div style="font-size:1.4rem;">📅</div><div class="texto-tenue">${cantDias} día${cantDias === 1 ? '' : 's'} jugando juntos</div></div>
            <div><div style="font-size:1.4rem;">✨</div><div class="texto-tenue">${cantEventos} momento${cantEventos === 1 ? '' : 's'} guardados</div></div>
        </div>
    </div>`;

    if (logrosDelMes.length) {
        html += `<div class="panel"><div class="texto-tenue" style="margin-bottom:10px;">🏆 Logros de ese mes</div>
            <div class="grilla-logros">`;
        logrosDelMes.forEach(l => {
            html += `<div class="tarjeta-logro tarjeta-logro-desbloqueada" title="${l.descripcion}">
                <div class="tarjeta-logro-icono">${l.icono}</div>
                <div class="tarjeta-logro-nombre">${l.nombre}</div>
            </div>`;
        });
        html += `</div></div>`;
    }

    cont.innerHTML = html;
}
