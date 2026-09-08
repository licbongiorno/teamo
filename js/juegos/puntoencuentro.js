// ==================== PUNTO DE ENCUENTRO ====================
// Álbum vivo: junta los puntos compartidos (puntos.js) y la línea de
// tiempo de momentos (historial.js) que van dejando el resto de los
// juegos. No modifica la lógica de ningún otro juego.
async function iniciarPuntoEncuentro(){
    const cont = document.getElementById('contenido-puntoencuentro');
    cont.innerHTML = `<div class="panel texto-centro texto-tenue">Cargando…</div>`;

    registrarEvento('visita', `${nombreJugador(miIdentidad)} pasó por Punto de Encuentro`);

    if (window._unsubPuntosEncuentro) window._unsubPuntosEncuentro();
    window._unsubPuntosEncuentro = window.escucharPuntos((p) => { window._puntosEncuentro = p; renderPuntoEncuentro(); });

    window._eventosEncuentro = await leerUltimosEventos(30);
    renderPuntoEncuentro();
}

function renderPuntoEncuentro(){
    const cont = document.getElementById('contenido-puntoencuentro');
    const puntos = window._puntosEncuentro || { nico: 0, carito: 0 };
    const eventos = window._eventosEncuentro || [];

    let html = `<div class="panel texto-centro">
        <p style="font-family:var(--fuente-titulo); font-size:1.3rem; margin:0 0 10px;">Nuestro álbum vivo</p>
        <div style="display:flex; justify-content:space-around;">
            <div><div style="font-size:1.4rem;">💙</div><div class="texto-tenue">Nico: ${puntos.nico || 0}</div></div>
            <div><div style="font-size:1.4rem;">💖</div><div class="texto-tenue">Carito: ${puntos.carito || 0}</div></div>
            <div><div style="font-size:1.4rem;">🏆</div><div class="texto-tenue">${(puntos.nico || 0) + (puntos.carito || 0)} en total</div></div>
        </div>
    </div>`;

    html += `<div class="panel"><div class="texto-tenue" style="margin-bottom:10px;">🕰️ Línea de tiempo</div>`;
    if (eventos.length) {
        eventos.forEach(e => {
            const fecha = e.creadoEn ? new Date(e.creadoEn).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' }) : '';
            html += `<div style="padding:8px 0; border-bottom:1px solid rgba(255,255,255,0.08); font-size:0.85rem;">
                <span class="texto-tenue" style="font-size:0.7rem;">${fecha}</span><br>${e.detalle || e.evento}
            </div>`;
        });
    } else {
        html += `<p class="texto-tenue">Todavía no hay momentos registrados. Van a ir apareciendo a medida que jueguen.</p>`;
    }
    html += `</div>`;

    cont.innerHTML = html;
}
