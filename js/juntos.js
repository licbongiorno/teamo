// ============================================================
// juntos.js — jugar juntos aunque estén lejos.
//  - "¡Juguemos juntos!": cuando el otro está conectado, una hoja con
//    juegos para arrancar ya (invita y abre el juego en un toque).
//  - Cita de juegos fija: eligen día y hora de la semana (juegos/cita).
//    El menú muestra cuánto falta y, cuando llega la hora, propone
//    arrancar la Noche de juegos; ese día aparece un aviso al entrar.
// ============================================================
(function () {
    const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    // Para jugar ya: mezcla de en vivo (están los dos) y por turnos.
    const PARA_YA = ['truco', 'uno', 'onda', 'mente', 'sopa', 'rosco', 'codigo', 'dibujayadivina', 'tiraafloja', 'calculo', 'parchis', 'generala', 'palabras', 'trivia'];
    const info = (id) => (window.JUEGOS || []).find(j => j.id === id);
    const ref = () => window.doc(window.db, 'juegos', 'cita');
    let cita = null, editando = false;

    // ---------- ¡Juguemos juntos! ----------
    function abrirJugarJuntos() {
        cerrar();
        const disponibles = PARA_YA.filter(id => info(id) && document.getElementById('pantalla-' + id));
        const elegidos = disponibles.sort(() => Math.random() - 0.5).slice(0, 6);
        const fondo = document.createElement('div');
        fondo.className = 'compu-selector-fondo juntos-fondo';
        fondo.onclick = (ev) => { if (ev.target === fondo) cerrar(); };
        fondo.innerHTML = `<div class="compu-selector panel" role="dialog" aria-label="Jugar juntos">
            <div class="compu-selector-titulo">🎮 ¿A qué jugamos ahora?</div>
            <div class="texto-tenue" style="font-size:0.8rem; margin-bottom:6px;">Le llega la invitación al toque y se abre el juego.</div>
            <div class="juntos-grilla">${elegidos.map(id => { const j = info(id); return `<button type="button" onclick="jugarJuntosYa('${id}')"><span>${j.icono}</span>${j.nombre}</button>`; }).join('')}</div>
            ${typeof window.abrirCitaDeJuegos === 'function' ? `<button type="button" class="btn-principal" style="margin-top:10px;" onclick="cerrarJugarJuntos(); abrirCitaDeJuegos()">🕯️ Mejor armemos una cita de juegos</button>` : ''}
            <button type="button" class="btn-secundario" style="margin-top:8px;" onclick="abrirJugarJuntos()">🎲 Otras opciones</button>
            <button type="button" class="btn-secundario" style="margin-top:8px;" onclick="cerrarJugarJuntos()">Cancelar</button>
        </div>`;
        document.body.appendChild(fondo);
    }
    function cerrar() { document.querySelectorAll('.juntos-fondo').forEach(x => x.remove()); }
    function jugarJuntosYa(id) {
        cerrar();
        if (typeof window.invitarAJugar === 'function') window.invitarAJugar(id);
        if (typeof window.abrirJuego === 'function') window.abrirJuego(id);
    }

    // ---------- Cita de juegos fija ----------
    function proximaCita(c, desde) {
        const [h, m] = (c.hora || '21:00').split(':').map(Number);
        const d = new Date(desde);
        d.setHours(h, m, 0, 0);
        let dias = (c.dia - d.getDay() + 7) % 7;
        // Si es hoy pero ya pasaron 3 horas desde la hora, la próxima es la semana que viene.
        if (dias === 0 && desde - d.getTime() > 3 * 3600000) dias = 7;
        d.setDate(d.getDate() + dias);
        return d;
    }
    function textoFalta(fecha, ahora) {
        const ms = fecha.getTime() - ahora;
        if (ms <= 0) return 'ahora';
        const horas = Math.round(ms / 3600000);
        if (horas < 1) return `en ${Math.max(1, Math.round(ms / 60000))} minutos`;
        if (horas < 20) return `en ${horas} hora${horas === 1 ? '' : 's'}`;
        const dias = Math.round(ms / 86400000);
        return dias <= 1 ? 'mañana' : `en ${dias} días`;
    }
    function render() {
        const cont = document.getElementById('cita-semanal');
        if (!cont) return;
        const ahora = Date.now();
        if (editando || !cita || cita.dia == null) {
            if (!editando) {
                cont.innerHTML = `<button class="cita-tarjeta vacia" onclick="editarCitaJuegos()">📅 ¿Armamos una <b>cita de juegos</b> fija cada semana? <span>Elegir día</span></button>`;
                return;
            }
            const d = cita && cita.dia != null ? cita.dia : 4, hora = (cita && cita.hora) || '21:00';
            cont.innerHTML = `<div class="panel cita-tarjeta">
                <div style="margin-bottom:8px;">📅 Nuestra cita de juegos:</div>
                <div class="cita-form"><select id="cita-dia">${DIAS.map((n, i) => `<option value="${i}" ${i === d ? 'selected' : ''}>${n}</option>`).join('')}</select>
                <input id="cita-hora" type="time" value="${hora}"></div>
                <div class="btn-fila" style="margin-top:8px;"><button class="btn-principal" onclick="guardarCitaJuegos()">Guardar</button>
                ${cita && cita.dia != null ? `<button class="btn-secundario" onclick="quitarCitaJuegos()">Quitar</button>` : ''}
                <button class="btn-secundario" onclick="editarCitaJuegos(false)">Cancelar</button></div></div>`;
            return;
        }
        const prox = proximaCita(cita, ahora);
        const enCurso = ahora >= prox.getTime() - 30 * 60000 && ahora <= prox.getTime() + 3 * 3600000;
        cont.innerHTML = enCurso
            ? `<div class="panel cita-tarjeta hoy"><div style="font-size:1rem; font-weight:700;">🕯️ ¡Es la hora de la cita de juegos!</div>
                <div class="btn-fila" style="margin-top:8px;">${typeof window.abrirCitaDeJuegos === 'function' ? `<button class="btn-principal" onclick="abrirCitaDeJuegos()">🕯️ Armar la cita</button>` : ''}
                <button class="btn-secundario" onclick="abrirJugarJuntos()">🎮 Elegir juego</button></div></div>`
            : `<button class="cita-tarjeta" onclick="editarCitaJuegos()">🕯️ Cita de juegos: los <b>${DIAS[cita.dia]}</b> a las <b>${cita.hora}</b> · ${textoFalta(prox, ahora)} <span>Cambiar</span></button>`;
    }
    function avisoDelDia() {
        if (!cita || cita.dia == null || new Date().getDay() !== cita.dia) return;
        const clave = 'citaAvisada-' + new Date().toDateString();
        try { if (localStorage.getItem(clave)) return; localStorage.setItem(clave, '1'); } catch (e) { return; }
        if (typeof window.mostrarCartelEnVivo === 'function') {
            window.mostrarCartelEnVivo({ titulo: `🕯️ Hoy es la cita de juegos`, sub: `A las ${cita.hora}. ¡No se olviden! 💖`, duracion: 6000 });
        }
    }
    async function guardar() {
        const dia = Number(document.getElementById('cita-dia')?.value);
        const hora = document.getElementById('cita-hora')?.value || '21:00';
        editando = false;
        try { await window.setDoc(ref(), { dia, hora, por: typeof miIdentidad !== 'undefined' ? miIdentidad : null, cuando: Date.now() }); } catch (e) { console.warn('No se pudo guardar la cita:', e); }
        if (window.sfx) window.sfx.acierto();
    }
    async function quitar() {
        editando = false;
        try { await window.setDoc(ref(), { dia: null, hora: null }); } catch (e) { /* nada */ }
    }

    function escuchar() {
        if (!window.db || !window.onSnapshot) return false;
        const orig = window._onSnapshotSinCompu || window.onSnapshot;
        let primera = true;
        orig(ref(), (snap) => {
            cita = snap.exists() ? snap.data() : null;
            render();
            if (primera) { primera = false; avisoDelDia(); }
        }, () => render());
        setInterval(render, 60000);
        return true;
    }
    function arrancar() {
        render();
        if (escuchar()) return;
        let n = 0;
        const t = setInterval(() => { if (escuchar() || ++n > 60) clearInterval(t); }, 500);
    }

    window.abrirJugarJuntos = abrirJugarJuntos;
    window.cerrarJugarJuntos = cerrar;
    window.jugarJuntosYa = jugarJuntosYa;
    window.editarCitaJuegos = (si) => { editando = si !== false; render(); };
    window.guardarCitaJuegos = guardar;
    window.quitarCitaJuegos = quitar;
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', arrancar);
    else arrancar();
})();
