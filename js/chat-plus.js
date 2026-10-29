// ============================================================
// chat-plus.js — Chat 2.0, igual en las dos pantallas (inicio y juegos).
//  - Una sola forma de dibujar los mensajes (antes estaba duplicada).
//  - Mantené apretado un mensaje (o clic derecho): reaccionar ❤️😂😮😢👍,
//    responder (queda la cita arriba) o borrar uno tuyo (hasta 10 min).
//  - "Escribiendo…" en vivo (doc juegos/chat-escribiendo).
//  - 📷 Fotos (se achican a ~45 KB) y 🎤 notas de voz (hasta 30 s), dentro
//    del mismo mensaje, como el resto de los audios de la app.
//  - 🎮 Invitar a jugar: una tarjeta con el juego y el botón "Jugar".
// Mensaje: {autor, texto, timestamp, tipo?: 'foto'|'audio'|'juego', foto?,
//   audio?, juego?, responde?: {id, autor, txt}, reacciones?: {nico, carito}, borrado?}
// ============================================================
(function () {
    const REACCIONES = ['❤️', '😂', '😮', '😢', '👍', '🔥'];
    const INVITABLES = ['truco', 'uno', 'aventura', 'onda', 'mente', 'hockey', 'motos', 'generala', 'tabu', 'emojipelis', 'damaschinas', 'faros'];
    const MAX_AUDIO = 30;
    let respondiendo = null, mensajesCache = [], grabador = null, timerGrabacion = null;
    const nombre = (q) => typeof nombreJugador === 'function' ? nombreJugador(q) : (q === 'nico' ? 'Nico' : 'Carito');
    const otroDe = () => (typeof miRival !== 'undefined' && miRival) || null;
    const yoSoy = () => (typeof miIdentidad !== 'undefined' && miIdentidad) || null;
    const ahora = () => (typeof window.ahoraSync === 'function' ? window.ahoraSync() : Date.now());
    const resumen = (m) => m.borrado ? 'Mensaje borrado' : m.tipo === 'foto' ? '📷 Foto' : m.tipo === 'audio' ? '🎤 Nota de voz' : m.tipo === 'juego' ? '🎮 Invitación a jugar' : String(m.texto || '').slice(0, 60);
    const vibrarC = (n) => { try { if (typeof vibrarJ === 'function') vibrarJ(n); else if (typeof vibrar === 'function') vibrar(n); } catch (e) { /* nada */ } };

    const estilos = document.createElement('style');
    estilos.textContent = `
        .burbuja-msg .cita-msg{ display:block; margin:-2px -4px 6px; padding:4px 8px; border-left:3px solid rgba(255,255,255,0.6); border-radius:8px; background:rgba(0,0,0,0.18); font-size:0.75rem; opacity:0.9; }
        .burbuja-msg .cita-msg b{ display:block; font-size:0.7rem; }
        .burbuja-msg img.foto-msg{ display:block; max-width:220px; width:100%; border-radius:10px; margin:2px 0; }
        .burbuja-msg audio{ display:block; width:220px; max-width:100%; height:36px; margin:2px 0; }
        .burbuja-msg.borrado{ font-style:italic; opacity:0.6; }
        .burbuja-msg .reacciones-msg{ position:absolute; bottom:-12px; right:8px; padding:1px 6px; border-radius:999px; background:#2a2235; border:1px solid rgba(255,255,255,0.15); font-size:0.8rem; line-height:1.3; }
        .burbuja-msg.con-reaccion{ margin-bottom:16px; }
        .burbuja-msg{ position:relative; -webkit-user-select:none; user-select:none; -webkit-touch-callout:none; }
        .tarjeta-juego-msg{ display:flex; align-items:center; gap:8px; margin-top:4px; }
        .tarjeta-juego-msg span{ font-size:1.7rem; }
        .tarjeta-juego-msg button{ margin-left:auto; padding:6px 12px; border-radius:999px; border:none; background:#fff; color:#2a1f33; font-weight:700; cursor:pointer; }
        .menu-msg-chat{ position:fixed; z-index:100001; padding:8px; border-radius:16px; background:#2a2235; border:1px solid rgba(255,255,255,0.15); box-shadow:0 8px 24px rgba(0,0,0,0.5); }
        .menu-msg-chat .fila-reac{ display:flex; gap:4px; margin-bottom:6px; }
        .menu-msg-chat .fila-reac button{ font-size:1.4rem; background:none; border:none; cursor:pointer; padding:2px 4px; border-radius:8px; }
        .menu-msg-chat .fila-reac button.elegida{ background:rgba(255,255,255,0.15); }
        .menu-msg-chat .accion{ display:block; width:100%; text-align:left; padding:7px 10px; border:none; border-radius:10px; background:none; color:#fdf6f0; font:inherit; font-size:0.88rem; cursor:pointer; }
        .menu-msg-chat .accion:hover{ background:rgba(255,255,255,0.08); }
        .barra-respuesta-chat{ display:flex; align-items:center; gap:8px; padding:6px 10px; font-size:0.78rem; border-top:1px solid rgba(255,255,255,0.08); background:rgba(255,255,255,0.04); }
        .barra-respuesta-chat span{ flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; opacity:0.85; }
        .barra-respuesta-chat button{ background:none; border:none; color:inherit; cursor:pointer; font-size:1rem; }
        .herramientas-chat{ display:flex; gap:2px; align-items:center; }
        .herramientas-chat button{ background:none; border:none; font-size:1.15rem; cursor:pointer; padding:4px; border-radius:10px; color:inherit; }
        .herramientas-chat button.grabando{ background:#e8496b; animation:latidoGrabando 1s ease-in-out infinite; }
        @keyframes latidoGrabando{ 50%{ opacity:0.6; } }
        .escribiendo-chat{ font-size:0.72rem; opacity:0.8; margin-left:6px; font-style:italic; }
        .hoja-invitar-chat{ display:grid; grid-template-columns:repeat(3, 1fr); gap:6px; margin:8px 0; }
        .hoja-invitar-chat button{ padding:8px 4px; border-radius:12px; border:1px solid rgba(255,255,255,0.12); background:rgba(255,255,255,0.05); color:inherit; font:inherit; font-size:0.75rem; cursor:pointer; }
        .hoja-invitar-chat button span{ display:block; font-size:1.4rem; }
    `;
    document.head.appendChild(estilos);

    // ---------- Dibujar ----------
    function crearBurbuja(msg){
        const yo = yoSoy();
        const div = document.createElement('div');
        div.className = `burbuja-msg ${msg.autor === 'carito' ? 'msg-carito' : 'msg-nico'} ${msg.autor === yo ? 'msg-propio' : 'msg-otro'}${msg.borrado ? ' borrado' : ''}`;
        div.dataset.id = msg.id || '';
        if (msg.borrado) { div.innerText = '🚫 Mensaje borrado'; return div; }
        if (msg.responde) {
            const cita = document.createElement('span');
            cita.className = 'cita-msg';
            const b = document.createElement('b'); b.innerText = nombre(msg.responde.autor);
            cita.appendChild(b); cita.appendChild(document.createTextNode(msg.responde.txt || ''));
            div.appendChild(cita);
        }
        if (msg.tipo === 'foto' && typeof msg.foto === 'string' && msg.foto.startsWith('data:image/')) {
            const img = document.createElement('img'); img.className = 'foto-msg'; img.alt = 'Foto'; img.src = msg.foto; img.loading = 'lazy';
            div.appendChild(img);
        } else if (msg.tipo === 'audio' && typeof msg.audio === 'string' && msg.audio.startsWith('data:audio/')) {
            const a = document.createElement('audio'); a.controls = true; a.preload = 'none'; a.src = msg.audio;
            div.appendChild(a);
        } else if (msg.tipo === 'juego') {
            const j = (window.JUEGOS || []).find(x => x.id === msg.juego);
            const t = document.createElement('div'); t.className = 'tarjeta-juego-msg';
            const ic = document.createElement('span'); ic.innerText = j ? j.icono : '🎮';
            const tx = document.createElement('div'); tx.innerText = `¿Jugamos a ${j ? j.nombre : 'algo'}?`;
            const bt = document.createElement('button'); bt.type = 'button'; bt.innerText = 'Jugar';
            bt.onclick = (ev) => { ev.stopPropagation(); irAJugarChat(msg.juego); };
            t.appendChild(ic); t.appendChild(tx); t.appendChild(bt);
            div.appendChild(t);
        }
        if (msg.texto && msg.tipo !== 'juego') {
            const s = document.createElement('span'); s.innerText = msg.texto;
            div.appendChild(s);
        }
        const reac = Object.values(msg.reacciones || {}).filter(r => REACCIONES.includes(r));
        if (reac.length) {
            const r = document.createElement('span'); r.className = 'reacciones-msg'; r.innerText = reac.join('');
            div.appendChild(r); div.classList.add('con-reaccion');
        }
        // Mantener apretado / clic derecho: menú del mensaje.
        let timer = null;
        div.addEventListener('pointerdown', () => { timer = setTimeout(() => abrirMenu(msg, div), 450); });
        ['pointerup', 'pointerleave', 'pointercancel', 'pointermove'].forEach(ev => div.addEventListener(ev, (e) => { if (ev === 'pointermove' && Math.abs(e.movementY) < 4) return; clearTimeout(timer); }));
        div.addEventListener('contextmenu', (e) => { e.preventDefault(); abrirMenu(msg, div); });
        return div;
    }
    function renderLista(contenedor, mensajes, hayMas, etiquetaFn){
        if (!contenedor) return;
        mensajesCache = mensajes;
        const alturaAntes = contenedor.scrollHeight, scrollAntes = contenedor.scrollTop;
        const estabaAbajo = alturaAntes - scrollAntes - contenedor.clientHeight < 80;
        if (!mensajes.length) { contenedor.innerHTML = '<p class="sin-mensajes">Este espacio está esperando nuestras primeras palabras... escribí vos 💌</p>'; return; }
        contenedor.innerHTML = '';
        if (hayMas && window.crearBotonAnterioresChat) contenedor.appendChild(window.crearBotonAnterioresChat());
        let ultimaEtiqueta = null, ultimoPropio = null, fechaPropia = null;
        const yo = yoSoy();
        mensajes.forEach((msg) => {
            const fecha = msg.timestamp && msg.timestamp.toDate ? msg.timestamp.toDate() : new Date();
            const etiqueta = etiquetaFn(fecha);
            if (etiqueta !== ultimaEtiqueta) {
                const sep = document.createElement('div'); sep.className = 'separador-fecha-chat'; sep.innerText = etiqueta;
                contenedor.appendChild(sep); ultimaEtiqueta = etiqueta;
            }
            const div = crearBurbuja(msg);
            contenedor.appendChild(div);
            if (msg.autor === yo) { ultimoPropio = div; fechaPropia = fecha.getTime(); }
        });
        if (ultimoPropio) {
            const marca = document.createElement('div'); marca.className = 'marca-visto-chat';
            marca.innerText = (fechaPropia && fechaPropia <= window._vistoRivalChat) ? 'Visto ✓✓' : 'Enviado ✓';
            ultimoPropio.appendChild(marca);
        }
        const ultimo = mensajes[mensajes.length - 1];
        if (window.ajustarScrollChat) window.ajustarScrollChat(contenedor, alturaAntes, scrollAntes, estabaAbajo, ultimo && ultimo.autor === yo);
    }

    // ---------- Menú de un mensaje ----------
    function cerrarMenu(){ document.querySelectorAll('.menu-msg-chat').forEach(x => x.remove()); }
    function abrirMenu(msg, div){
        if (!msg.id || msg.borrado) return;
        cerrarMenu();
        vibrarC(12);
        const yo = yoSoy();
        const menu = document.createElement('div');
        menu.className = 'menu-msg-chat';
        const mia = (msg.reacciones || {})[yo];
        const fila = document.createElement('div'); fila.className = 'fila-reac';
        REACCIONES.forEach(r => { const b = document.createElement('button'); b.type = 'button'; b.innerText = r; if (r === mia) b.classList.add('elegida'); b.onclick = (e) => { e.stopPropagation(); reaccionar(msg, r === mia ? null : r); cerrarMenu(); }; fila.appendChild(b); });
        menu.appendChild(fila);
        const accion = (txt, fn) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'accion'; b.innerText = txt; b.onclick = (e) => { e.stopPropagation(); fn(); cerrarMenu(); }; menu.appendChild(b); };
        accion('↩️ Responder', () => empezarRespuesta(msg));
        if (msg.texto && !msg.tipo) accion('📋 Copiar', () => { try { navigator.clipboard.writeText(msg.texto); } catch (e) { /* nada */ } });
        const ts = msg.timestamp && msg.timestamp.toMillis ? msg.timestamp.toMillis() : 0;
        if (msg.autor === yo && Date.now() - ts < 10 * 60000) accion('🗑️ Borrar para los dos', () => borrar(msg));
        document.body.appendChild(menu);
        const r = div.getBoundingClientRect();
        const mw = menu.offsetWidth, mh = menu.offsetHeight;
        menu.style.left = Math.max(8, Math.min(window.innerWidth - mw - 8, r.left + r.width / 2 - mw / 2)) + 'px';
        menu.style.top = (r.top - mh - 8 > 8 ? r.top - mh - 8 : Math.min(window.innerHeight - mh - 8, r.bottom + 8)) + 'px';
        setTimeout(() => document.addEventListener('pointerdown', function fuera(e) { if (!menu.contains(e.target)) { cerrarMenu(); document.removeEventListener('pointerdown', fuera); } }), 0);
    }
    async function reaccionar(msg, r){
        const yo = yoSoy();
        const reacciones = { ...(msg.reacciones || {}) };
        if (r) reacciones[yo] = r; else delete reacciones[yo];
        try { await window.updateDoc(window.doc(window.db, 'chat', msg.id), { reacciones }); } catch (e) { console.warn('No se pudo reaccionar:', e); }
    }
    async function borrar(msg){
        try { await window.updateDoc(window.doc(window.db, 'chat', msg.id), { borrado: true, texto: '', foto: null, audio: null, reacciones: {} }); } catch (e) { console.warn('No se pudo borrar:', e); }
    }

    // ---------- Responder ----------
    function barraRespuesta(){
        let b = document.querySelector('.barra-respuesta-chat');
        const area = document.querySelector('#chat-flotante .input-chat-area');
        if (!respondiendo) { if (b) b.remove(); return; }
        if (!b && area) { b = document.createElement('div'); b.className = 'barra-respuesta-chat'; area.parentNode.insertBefore(b, area); }
        if (!b) return;
        b.innerHTML = '';
        const s = document.createElement('span'); s.innerText = `↩️ ${nombre(respondiendo.autor)}: ${respondiendo.txt}`;
        const x = document.createElement('button'); x.type = 'button'; x.innerText = '✕'; x.onclick = () => { respondiendo = null; barraRespuesta(); };
        b.appendChild(s); b.appendChild(x);
    }
    function empezarRespuesta(msg){
        respondiendo = { id: msg.id, autor: msg.autor, txt: resumen(msg) };
        barraRespuesta();
        const i = document.getElementById('input-chat'); if (i) i.focus();
    }

    // ---------- Enviar ----------
    async function enviar(datos){
        const yo = yoSoy();
        if (!yo) return false;
        const doc = { autor: yo, texto: datos.texto || '', timestamp: window.serverTimestamp(), ...datos };
        if (respondiendo) doc.responde = respondiendo;
        respondiendo = null; barraRespuesta();
        marcarEscribiendo(false);
        await window.addDoc(window.collection(window.db, 'chat'), doc);
        return true;
    }

    // ---------- Escribiendo… ----------
    let ultimoAviso = 0, escribiendoOtro = 0, timerEscr = null;
    const refEscr = () => window.doc(window.db, 'juegos', 'chat-escribiendo');
    function marcarEscribiendo(si){
        const yo = yoSoy();
        if (!yo || !window.db) return;
        if (si && Date.now() - ultimoAviso < 2500) return;
        ultimoAviso = si ? Date.now() : 0;
        window.setDoc(refEscr(), { [yo]: si ? ahora() : 0 }, { merge: true }).catch(() => {});
    }
    function mostrarEscribiendo(){
        const header = document.querySelector('#chat-flotante .titulo-chat');
        if (!header) return;
        let s = header.querySelector('.escribiendo-chat');
        const activo = escribiendoOtro && ahora() - escribiendoOtro < 6000;
        if (!activo) { if (s) s.remove(); return; }
        if (!s) { s = document.createElement('span'); s.className = 'escribiendo-chat'; header.appendChild(s); }
        s.innerText = `${nombre(otroDe())} está escribiendo…`;
        clearTimeout(timerEscr); timerEscr = setTimeout(mostrarEscribiendo, 6100 - (ahora() - escribiendoOtro));
    }

    // ---------- Foto ----------
    function elegirFoto(){
        const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*';
        inp.onchange = () => { const f = inp.files && inp.files[0]; if (f) mandarFoto(f); };
        inp.click();
    }
    function mandarFoto(f){
        const lector = new FileReader();
        lector.onload = () => {
            const img = new Image();
            img.onload = async () => {
                const lado = 640, k = Math.min(1, lado / Math.max(img.width, img.height));
                const cv = document.createElement('canvas'); cv.width = Math.round(img.width * k); cv.height = Math.round(img.height * k);
                cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
                let q = 0.72, url = cv.toDataURL('image/jpeg', q);
                while (url.length > 60000 && q > 0.3) { q -= 0.08; url = cv.toDataURL('image/jpeg', q); }
                const texto = (document.getElementById('input-chat')?.value || '').trim();
                if (document.getElementById('input-chat')) document.getElementById('input-chat').value = '';
                try { await enviar({ tipo: 'foto', foto: url, texto }); } catch (e) { console.error('No se pudo mandar la foto:', e); }
            };
            img.src = lector.result;
        };
        lector.readAsDataURL(f);
    }

    // ---------- Nota de voz ----------
    function formatoAudio(){
        const c = ['audio/mp4;codecs=mp4a.40.2', 'audio/mp4', 'audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus'];
        if (!window.MediaRecorder || !MediaRecorder.isTypeSupported) return '';
        return c.find(t => MediaRecorder.isTypeSupported(t)) || '';
    }
    async function alternarGrabacion(boton){
        if (grabador) { grabador.stop(); return; }
        if (!navigator.mediaDevices || !window.MediaRecorder) { alert('Este celu no deja grabar audio desde acá 😕'); return; }
        let stream;
        try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); } catch (e) { alert('Necesito permiso para usar el micrófono 🎤'); return; }
        const tipo = formatoAudio();
        const partes = [];
        grabador = new MediaRecorder(stream, tipo ? { mimeType: tipo, audioBitsPerSecond: 24000 } : { audioBitsPerSecond: 24000 });
        grabador.ondataavailable = (e) => { if (e.data && e.data.size) partes.push(e.data); };
        grabador.onstop = () => {
            clearTimeout(timerGrabacion);
            stream.getTracks().forEach(t => t.stop());
            boton.classList.remove('grabando'); boton.innerText = '🎤';
            grabador = null;
            const blob = new Blob(partes, { type: tipo || 'audio/webm' });
            if (blob.size < 800) return; // muy cortito: se descarta
            const lector = new FileReader();
            lector.onload = () => enviar({ tipo: 'audio', audio: lector.result }).catch(e => console.error('No se pudo mandar el audio:', e));
            lector.readAsDataURL(blob);
        };
        grabador.start();
        boton.classList.add('grabando'); boton.innerText = '⏹️';
        vibrarC(15);
        timerGrabacion = setTimeout(() => grabador && grabador.stop(), MAX_AUDIO * 1000);
    }

    // ---------- Invitar a jugar ----------
    function irAJugarChat(id){
        if (typeof window.abrirJuego === 'function' && document.getElementById('pantalla-' + id)) {
            document.getElementById('chat-flotante')?.classList.remove('abierto');
            if (typeof cerrarJuego === 'function' && document.querySelector('.pantalla-juego.activa:not(#pantalla-menu)')) cerrarJuego();
            window.abrirJuego(id);
        } else location.href = 'juegos.html?juego=' + encodeURIComponent(id);
    }
    function abrirInvitar(){
        document.querySelectorAll('.invitar-chat-fondo').forEach(x => x.remove());
        const lista = INVITABLES.map(id => (window.JUEGOS || []).find(j => j.id === id)).filter(Boolean);
        const fondo = document.createElement('div');
        fondo.className = 'compu-selector-fondo invitar-chat-fondo';
        fondo.style.cssText = 'position:fixed; inset:0; z-index:100000; display:flex; align-items:flex-end; justify-content:center; background:rgba(0,0,0,0.55);';
        fondo.onclick = (ev) => { if (ev.target === fondo) fondo.remove(); };
        const hoja = document.createElement('div');
        hoja.className = 'compu-selector panel';
        hoja.style.cssText = 'width:100%; max-width:420px; margin-bottom:12px; padding:14px; border-radius:20px; background:#211a2b;';
        hoja.innerHTML = `<div style="font-weight:700; margin-bottom:4px;">🎮 ¿A qué lo/la invitás?</div><div class="hoja-invitar-chat"></div>`;
        const g = hoja.querySelector('.hoja-invitar-chat');
        lista.forEach(j => { const b = document.createElement('button'); b.type = 'button'; b.innerHTML = `<span>${j.icono}</span>`; b.appendChild(document.createTextNode(j.nombre)); b.onclick = () => { fondo.remove(); enviar({ tipo: 'juego', juego: j.id, texto: `🎮 ¿Jugamos a ${j.nombre}?` }).catch(() => {}); }; g.appendChild(b); });
        fondo.appendChild(hoja);
        document.body.appendChild(fondo);
    }

    // ---------- Montaje ----------
    function montar(){
        const area = document.querySelector('#chat-flotante .input-chat-area');
        if (!area || area.querySelector('.herramientas-chat')) return !!area;
        const h = document.createElement('div');
        h.className = 'herramientas-chat';
        h.innerHTML = `<button type="button" title="Mandar una foto" aria-label="Foto">📷</button><button type="button" title="Nota de voz" aria-label="Nota de voz">🎤</button>${window.JUEGOS ? '<button type="button" title="Invitar a jugar" aria-label="Invitar a jugar">🎮</button>' : ''}`;
        const [bf, ba, bj] = h.querySelectorAll('button');
        bf.onclick = elegirFoto; ba.onclick = () => alternarGrabacion(ba); if (bj) bj.onclick = abrirInvitar;
        area.insertBefore(h, area.firstChild);
        const input = document.getElementById('input-chat');
        if (input) input.addEventListener('input', () => marcarEscribiendo(!!input.value.trim()));
        return true;
    }
    function escucharEscribiendo(){
        if (!window.db || !window.onSnapshot) return false;
        window.onSnapshot(refEscr(), (snap) => { escribiendoOtro = snap.exists() ? (snap.data()[otroDe()] || 0) : 0; mostrarEscribiendo(); }, () => {});
        return true;
    }
    function arrancar(){
        let n = 0;
        const t = setInterval(() => { const ok1 = montar(); if ((ok1 && escucharEscribiendo()) || ++n > 80) clearInterval(t); }, 400);
    }

    window.renderListaChatComun = renderLista;
    window.enviarChatComun = enviar;
    window.irAJugarChat = irAJugarChat;
    window._chatPlus = { mensajes: () => mensajesCache, reaccionar, borrar, empezarRespuesta, mandarFoto, abrirInvitar };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', arrancar);
    else arrancar();
})();
