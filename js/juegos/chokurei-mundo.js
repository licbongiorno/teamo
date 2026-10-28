// ============================================================
// chokurei-mundo.js — personalidad de Chokurei y el mundo alrededor:
//  - Memoria: saluda distinto según quién entra y quién lo cuida más;
//    tiene una comida y un juego favoritos que hay que descubrir.
//  - Ficha: sus datos, favoritos, medallas y la fecha de aniversario.
//  - Clima real en la ventana (Open-Meteo, sin clave) de la ciudad de
//    quien mira.
//  - Fechas especiales: Halloween, Navidad, Año Nuevo, San Valentín y
//    el aniversario de ustedes decoran la habitación solas.
//  - 📸 Fotos: guarda la escena tal cual se ve en un álbum compartido.
//  - 📲 Un mensajito por WhatsApp "de parte de Chokurei".
// ============================================================

// Ciudades para el clima de la ventana. Cada uno elige la suya en la
// Ficha; hasta que elijan, Nico = Córdoba y Carito = Berazategui.
const CIUDADES_CHOKUREI = {
    cordoba:     { nombre: 'Córdoba',       lat: -31.42, lon: -64.18 },
    buenosaires: { nombre: 'Buenos Aires',  lat: -34.60, lon: -58.38 },
    berazategui: { nombre: 'Berazategui',   lat: -34.76, lon: -58.21 },
    rosario:     { nombre: 'Rosario',       lat: -32.95, lon: -60.66 },
    laplata:     { nombre: 'La Plata',      lat: -34.92, lon: -57.95 },
    mardelplata: { nombre: 'Mar del Plata', lat: -38.00, lon: -57.56 },
    mendoza:     { nombre: 'Mendoza',       lat: -32.89, lon: -68.84 },
    tucuman:     { nombre: 'Tucumán',       lat: -26.81, lon: -65.22 },
    salta:       { nombre: 'Salta',         lat: -24.79, lon: -65.41 },
    neuquen:     { nombre: 'Neuquén',       lat: -38.95, lon: -68.06 },
    bariloche:   { nombre: 'Bariloche',     lat: -41.13, lon: -71.31 },
    santafe:     { nombre: 'Santa Fe',      lat: -31.63, lon: -60.70 },
    montevideo:  { nombre: 'Montevideo',    lat: -34.90, lon: -56.16 },
};
const CIUDAD_POR_DEFECTO_CHOKUREI = { nico: 'cordoba', carito: 'berazategui' };

(window.CHOKUREI_MODULOS = window.CHOKUREI_MODULOS || []).push(function (Chokurei) {
    const otro = () => (miIdentidad === 'nico' ? 'carito' : 'nico');
    const elegirFijo = (lista, semilla) => lista[Math.abs(Math.floor(semilla / 86400000)) % lista.length];
    const favoritos = () => {
        const n = Chokurei.estado.nacioEn || 1;
        return { comida: elegirFijo(COMIDAS_CHOKUREI, n), juego: typeof JUEGOS_CHOKUREI !== 'undefined' ? elegirFijo(JUEGOS_CHOKUREI, n * 7 + 3) : null };
    };
    const descubiertos = () => Chokurei.estado.descubiertos || {};

    // ==================== SALUDO SEGÚN QUIÉN ENTRA ====================
    Chokurei.on('armar', () => {
        setTimeout(() => {
            const ck = Chokurei.ck, e = Chokurei.estado;
            if (!ck || ck.dormido) return;
            const c = e.cuidados || {};
            const yo = miIdentidad, nombre = nombreJugador(yo);
            const favorito = (c[yo] || 0) > (c[otro()] || 0) && (c[yo] || 0) >= 5;
            ck.maullar(favorito ? `¡Mi humano favorito! ${nombre} 💕` : `¡${nombre} volvió! 💕`);
        }, 1600);
        aplicarFechas();
        aplicarClima();
    });

    // ==================== FAVORITOS ====================
    Chokurei.on('comer', (item) => {
        const fav = favoritos().comida;
        if (!fav || item.id !== fav.id || !Chokurei.ck) return;
        const ck = Chokurei.ck;
        ck.decir(`¡${item.emoji} es MI FAVORITA! 😻`, 2600);
        for (let i = 0; i < 6; i++) setTimeout(() => ck.particula(i % 2 ? '😻' : '💖', { dx: (Math.random() - 0.5) * 100, dur: 1400 }), i * 120);
        if (!descubiertos().comida) {
            window.setDoc(Chokurei.ref(), { descubiertos: { comida: true } }, { merge: true });
            if (typeof mostrarCartelEnVivo === 'function') mostrarCartelEnVivo({ titulo: `🔍 ¡Descubriste su comida favorita: ${item.emoji}!`, sub: 'Quedó anotada en la ficha de Chokurei', duracion: 4000 });
        }
        Chokurei.aplicarCuidado({ carino: 10 }, `descubrió que a Chokurei le encanta ${item.nombre.toLowerCase()}`, 3);
    });
    Chokurei.on('juego-terminado', ({ juego }) => {
        const fav = favoritos().juego;
        if (!fav || juego !== fav.id) return;
        Chokurei.ck?.decir(`¡${fav.nombre} es mi juego favorito! 💕`, 2600);
        if (!descubiertos().juego) {
            window.setDoc(Chokurei.ref(), { descubiertos: { juego: true } }, { merge: true });
            if (typeof mostrarCartelEnVivo === 'function') setTimeout(() => mostrarCartelEnVivo({ titulo: `🔍 ¡Su juego favorito es ${fav.emoji} ${fav.nombre}!`, sub: 'Quedó anotado en la ficha', duracion: 4000 }), 3000);
        }
    });

    // ==================== FICHA ====================
    Chokurei.paneles.ficha = () => {
        const e = Chokurei.estado, d = Chokurei.d || {};
        const c = e.cuidados || {}, fav = favoritos(), des = descubiertos();
        const nac = new Date(e.nacioEn || Date.now());
        const humano = (c.nico || 0) === (c.carito || 0) ? 'Los dos por igual 💞' : `${nombreJugador((c.nico || 0) > (c.carito || 0) ? 'nico' : 'carito')} (por poquito)`;
        const med = e.medallas || [];
        const fila = (a, b) => `<div class="ck-ficha-fila"><span>${a}</span><b>${b}</b></div>`;
        return `<div style="text-align:center; margin-bottom:8px;"><b>📜 Ficha de Chokurei</b></div>
            ${fila('🎂 Nació', nac.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' }))}
            ${fila('⏳ Edad', `${d.edadDias ?? 0} días`)}
            ${fila('⭐ Nivel', `${d.nivel ?? 1} (${d.etapa ? d.etapa.nombre : 'bebé'})`)}
            ${fila('🎨 Pelaje', (PELAJES_CHOKUREI[e.pelaje || 'negro'] || {}).nombre || '')}
            ${fila('🫶 Humano favorito', humano)}
            ${fila('🧮 Cuidados', `Nico ${c.nico || 0} · Carito ${c.carito || 0}`)}
            ${fila('🍽️ Comida favorita', des.comida ? `${fav.comida.emoji} ${fav.comida.nombre}` : '❓ ¿Cuál será? Probá darle de todo')}
            ${fila('🎮 Juego favorito', des.juego && fav.juego ? `${fav.juego.emoji} ${fav.juego.nombre}` : '❓ Jugá a todo y vas a ver')}
            ${fila('🔥 Mejor racha', `${(e.rachaDias || {}).mejor || 0} días`)}
            ${fila('🏅 Medallas', med.length ? `${med.length} (Nico ${med.filter(m => m.quien === 'nico').length} · Carito ${med.filter(m => m.quien === 'carito').length})` : 'Todavía ninguna')}
            <div class="ck-ficha-fila"><span>🌦️ Mi ciudad (clima)</span><select onchange="elegirCiudadChokurei(this.value)" style="background:var(--bg-oscuro); color:var(--texto); border:1px solid var(--borde); border-radius:8px; padding:3px 6px;">
                ${Object.entries(CIUDADES_CHOKUREI).map(([id, c]) => `<option value="${id}" ${id === ((e.ciudades || {})[miIdentidad] || CIUDAD_POR_DEFECTO_CHOKUREI[miIdentidad]) ? 'selected' : ''}>${c.nombre}</option>`).join('')}
            </select></div>
            <div class="ck-ficha-fila"><span>💞 Nuestro aniversario</span><input type="date" id="ck-aniversario" value="${e.aniversarioFecha || ''}" onchange="guardarAniversarioChokurei(this.value)" style="background:transparent; color:var(--texto); border:1px solid var(--borde); border-radius:8px; padding:3px 6px;"></div>
            <div class="texto-tenue" style="font-size:0.7rem; margin-top:6px;">Ese día la habitación se decora sola y Chokurei los saluda 💕</div>`;
    };
    window.elegirCiudadChokurei = async (id) => {
        if (!CIUDADES_CHOKUREI[id]) return;
        await window.setDoc(Chokurei.ref(), { ciudades: { [miIdentidad]: id } }, { merge: true });
        setTimeout(aplicarClima, 400);
    };
    window.guardarAniversarioChokurei = async (valor) => {
        if (!valor) return;
        await window.setDoc(Chokurei.ref(), { aniversarioFecha: valor }, { merge: true });
        Chokurei.ck?.decir('¡Anotado! 💞', 1800);
        aplicarFechas();
    };

    // ==================== FECHAS ESPECIALES ====================
    function fechaEspecial(){
        const h = new Date(), m = h.getMonth() + 1, dia = h.getDate();
        const aniv = Chokurei.estado.aniversarioFecha;
        if (aniv && aniv.slice(5) === `${String(m).padStart(2, '0')}-${String(dia).padStart(2, '0')}`) return 'aniversario';
        if (m === 10 && dia >= 24) return 'halloween';
        if ((m === 12 && dia === 31) || (m === 1 && dia === 1)) return 'anionuevo';
        if (m === 12 && dia <= 26) return 'navidad';
        if (m === 2 && dia >= 7 && dia <= 14) return 'sanvalentin';
        return null;
    }
    let fechaAplicada;
    function aplicarFechas(){
        const hab = Chokurei.hab();
        if (!hab) return;
        const f = fechaEspecial();
        hab.dataset.fecha = f || '';
        Chokurei.ropaDeTemporada = f === 'halloween' ? 'calabaza' : f === 'navidad' ? 'navidad' : null;
        if (f !== 'navidad' && Chokurei.ck) Chokurei.ck.suenos = ['🐟', '💕', '🦋', '🧶', '👫', '🌙', '🍣'];
        hab.querySelectorAll('.ck-deco').forEach(x => x.remove());
        const deco = (html, estilo, clase) => { const el = document.createElement('div'); el.className = 'ck-deco ' + (clase || ''); el.innerHTML = html; el.setAttribute('style', estilo); hab.insertBefore(el, hab.querySelector('.ck-oscuro')); };
        if (f === 'halloween') {
            deco('🎃', 'left:44%; bottom:28%; font-size:1.7rem;');
            deco('🎃', 'left:3%; bottom:31%; font-size:1.3rem;');
            deco('🦇', 'left:60%; top:16%; font-size:1.2rem;', 'ck-murcielago');
            deco('🕸️', 'right:0; top:0; font-size:2rem;');
        } else if (f === 'navidad') {
            deco('🎄', 'left:38%; bottom:28%; font-size:3.2rem;');
            deco('', 'left:0; right:0; top:2%; height:10px;', 'ck-guirnalda');
            deco('🎁', 'left:46%; bottom:30%; font-size:1.2rem;');
            if (Chokurei.ck) Chokurei.ck.suenos = ['🎁', '🎄', '⭐', '🍪', '🦌'];
        } else if (f === 'sanvalentin' || f === 'aniversario') {
            deco('💕 💗 💞 💖 💕 💗 💞 💖', 'left:0; right:0; top:1%; text-align:center; font-size:0.9rem; letter-spacing:4px;');
            deco('🌹', 'left:44%; bottom:29%; font-size:1.5rem;');
            if (f === 'aniversario') deco('¡Feliz aniversario! 💞', 'left:50%; top:42%; transform:translateX(-50%); font-weight:700; color:#fff; background:#ff7aa2cc; padding:4px 12px; border-radius:12px; font-size:0.85rem; white-space:nowrap;');
        } else if (f === 'anionuevo') {
            deco('🎆', 'left:12%; top:12%; font-size:1.6rem;', 'ck-murcielago');
            deco('🥂', 'left:44%; bottom:29%; font-size:1.5rem;');
        }
        if (f && f !== fechaAplicada && Chokurei.ck) {
            const frases = { halloween: '¡Feliz Halloween! 🎃 ¿Dulce o truco?', navidad: '¡Feliz Navidad! 🎄', sanvalentin: 'Feliz San Valentín 💕', anionuevo: '¡Feliz año nuevo! 🥂', aniversario: '¡Feliz aniversario, mis humanos! 💞' };
            // Después del saludo y de una posible bienvenida (chokurei-conexion.js), que tienen prioridad.
            setTimeout(() => Chokurei.ck && !Chokurei.bienvenidaDada && Chokurei.ck.decir(frases[f], 3200), 8500);
        }
        fechaAplicada = f;
    }
    Chokurei.on('actualizar', () => { const hab = Chokurei.hab(); if (hab && (hab.dataset.fecha || '') !== (fechaEspecial() || '')) aplicarFechas(); });

    // ==================== CLIMA REAL ====================
    // Clima de una ciudad (Open-Meteo), con caché de 30 min por ciudad.
    async function obtenerClima(idCiudad){
        const ciudad = CIUDADES_CHOKUREI[idCiudad];
        if (!ciudad) return null;
        const clave = 'climaChokurei-' + idCiudad;
        let datos = null;
        try { datos = JSON.parse(sessionStorage.getItem(clave) || 'null'); } catch (e) {}
        if (datos && Date.now() - datos.t < 30 * 60000) return datos;
        try {
            const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${ciudad.lat}&longitude=${ciudad.lon}&current=temperature_2m,weather_code,is_day`);
            const j = await r.json();
            datos = { t: Date.now(), temp: Math.round(j.current.temperature_2m), codigo: j.current.weather_code, esDeDia: j.current.is_day !== 0 };
            try { sessionStorage.setItem(clave, JSON.stringify(datos)); } catch (e) {}
            return datos;
        } catch (e) { return null; /* sin internet o bloqueado */ }
    }
    const ciudadDe = (quien) => (Chokurei.estado.ciudades || {})[quien] || CIUDAD_POR_DEFECTO_CHOKUREI[quien];
    function tipoDeClima(c){
        return c >= 95 ? 'tormenta' : (c >= 71 && c <= 77) || c === 85 || c === 86 ? 'nieve' : (c >= 51 && c <= 67) || (c >= 80 && c <= 82) ? 'lluvia' : c >= 2 ? 'nublado' : 'despejado';
    }
    const iconoClima = (tipo, deDia) => ({ tormenta: '⛈️', nieve: '🌨️', lluvia: '🌧️', nublado: '☁️', despejado: deDia ? '☀️' : '🌙' }[tipo]);

    async function aplicarClima(){
        const idCiudad = ciudadDe(miIdentidad);
        const ciudad = CIUDADES_CHOKUREI[idCiudad];
        if (!ciudad || !Chokurei.hab()) return;
        aplicarClimaDelOtro();
        const datos = await obtenerClima(idCiudad);
        const h = Chokurei.hab();
        if (!datos || !h) return;
        const tipo = tipoDeClima(datos.codigo);
        const icono = iconoClima(tipo, h.dataset.momento !== 'noche');
        h.dataset.clima = tipo;
        let chip = h.querySelector('.ck-chip-clima');
        if (!chip) { chip = document.createElement('div'); chip.className = 'ck-chip ck-chip-clima'; (h.querySelector('.ck-ventana') || h).appendChild(chip); }
        chip.textContent = `${icono} ${datos.temp}°`;
        chip.title = `${ciudad.nombre}: ${datos.temp}°`;
        if (tipo === 'lluvia' || tipo === 'tormenta') {
            const v = h.querySelector('.ck-ventana');
            if (v && !v.querySelector('.ck-lluvia')) v.insertAdjacentHTML('beforeend', '<div class="ck-lluvia"></div>');
            if (Chokurei.ck) setTimeout(() => Chokurei.ck && Chokurei.ck.decir('Llueve… ideal para mimos ☔', 2400), 7000);
        }
        if (datos.temp <= 10 && Chokurei.ck && !(Chokurei.estado.equipado || {}).ropa) setTimeout(() => Chokurei.ck && Chokurei.ck.decir('Brrr, hace frío 🥶 ¿Una bufanda?', 2400), 9000);
        if (datos.temp >= 30 && Chokurei.ck) setTimeout(() => Chokurei.ck && Chokurei.ck.decir('Qué calor… 🥵', 2200), 9000);
    }

    // El clima de la ciudad del otro: un cartelito debajo de la habitación
    // para saber cómo está el día del otro lado.
    async function aplicarClimaDelOtro(){
        const quien = otro(), idCiudad = ciudadDe(quien), ciudad = CIUDADES_CHOKUREI[idCiudad];
        if (!ciudad) return;
        const datos = await obtenerClima(idCiudad);
        const h = Chokurei.hab();
        if (!datos || !h) return;
        let el = document.getElementById('ck-clima-otro');
        if (!el) {
            el = document.createElement('div');
            el.id = 'ck-clima-otro'; el.className = 'ck-clima-otro';
            const bandeja = document.querySelector('#contenido-mascota .ck-bandeja');
            (bandeja || h).insertAdjacentElement(bandeja ? 'beforebegin' : 'afterend', el);
        }
        const tipo = tipoDeClima(datos.codigo), icono = iconoClima(tipo, datos.esDeDia);
        const mismaCiudad = idCiudad === ciudadDe(miIdentidad);
        const nombre = nombreJugador(quien);
        const comentario = tipo === 'tormenta' ? `hay tormenta donde está ${nombre}, mandale un abrazo 🫂`
            : tipo === 'lluvia' ? `llueve donde está ${nombre} ☔`
            : tipo === 'nieve' ? `¡nieva donde está ${nombre}! ❄️`
            : datos.temp <= 8 ? `hace frío donde está ${nombre} 🥶`
            : datos.temp >= 30 ? `hace calor donde está ${nombre} 🥵`
            : tipo === 'despejado' && datos.esDeDia ? `lindo día donde está ${nombre} 😎` : '';
        el.innerHTML = `<span>📍 En la ciudad de ${nombre}${mismaCiudad ? '' : ` (${ciudad.nombre})`}: <b>${icono} ${datos.temp}°</b></span>${comentario ? `<small>${comentario}</small>` : ''}`;
        if (comentario && (tipo === 'tormenta' || tipo === 'lluvia' || tipo === 'nieve') && Chokurei.ck) {
            setTimeout(() => Chokurei.ck && Chokurei.ck.decir(`${comentario.charAt(0).toUpperCase()}${comentario.slice(1)}`, 2600), 12000);
        }
    }
    // Si el otro cambia su ciudad, se actualiza el cartelito.
    let ciudadOtroVista = null;
    Chokurei.on('actualizar', () => {
        const c = ciudadDe(otro());
        if (ciudadOtroVista !== null && c !== ciudadOtroVista) aplicarClimaDelOtro();
        ciudadOtroVista = c;
    });

    // ==================== 📸 FOTOS Y ÁLBUM ====================
    // Dibuja la habitación en un canvas (formas simples + los emojis que
    // haya) y encima el SVG de Chokurei con los estilos calculados en ese
    // instante, así queda con la pose y la cara exactas del momento.
    async function capturarEscena(){
        const hab = Chokurei.hab(), ck = Chokurei.ck;
        const r = hab.getBoundingClientRect();
        const W = 720, esc = W / r.width, H = Math.round(r.height * esc);
        const cv = document.createElement('canvas'); cv.width = W; cv.height = H + 70;
        const g = cv.getContext('2d');
        const mom = hab.dataset.momento;
        const pared = mom === 'noche' ? ['#4a3d6b', '#352c4f'] : mom === 'tarde' ? ['#fbd9c4', '#e9bccb'] : ['#f7dfe8', '#e3c7dd'];
        let gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, pared[0]); gr.addColorStop(1, pared[1]);
        g.fillStyle = gr; g.fillRect(0, 0, W, H);
        const rect = (sel, color, radio) => { const el = hab.querySelector(sel); if (!el) return; const b = el.getBoundingClientRect(); g.fillStyle = color; g.beginPath(); if (g.roundRect) g.roundRect((b.left - r.left) * esc, (b.top - r.top) * esc, b.width * esc, b.height * esc, radio || 0); else g.rect((b.left - r.left) * esc, (b.top - r.top) * esc, b.width * esc, b.height * esc); g.fill(); };
        rect('.ck-piso', mom === 'noche' ? '#7a5c4a' : '#c99b7a');
        rect('.ck-ventana', '#ffffff', 12);
        const v = hab.querySelector('.ck-ventana').getBoundingClientRect();
        g.fillStyle = mom === 'noche' ? '#1d1a45' : mom === 'tarde' ? '#ffb88a' : '#a8dcff';
        g.fillRect((v.left - r.left) * esc + 6, (v.top - r.top) * esc + 6, v.width * esc - 12, v.height * esc - 12);
        rect('.ck-alfombra', '#f9a8c0', 200);
        rect('.ck-cama', '#c9a2ff', 60);
        rect('.ck-plato', '#ff8fab', 12);
        rect('.ck-cuadro', '#ffffff', 6);
        // Emojis sueltos de la habitación (planta, juguetes, decoración, regalo…)
        hab.querySelectorAll('.ck-planta, .ck-juguete, .ck-deco, .ck-mueble-caja, .ck-cuadro, .ck-plato .comida, .ck-regalo').forEach(el => {
            const t = (el.textContent || '').trim();
            if (!t || t.length > 24) return;
            const b = el.getBoundingClientRect(), fs = parseFloat(getComputedStyle(el).fontSize) * esc;
            g.font = `${fs}px sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
            g.fillText(t, (b.left - r.left + b.width / 2) * esc, (b.top - r.top + b.height / 2) * esc);
        });
        // Chokurei: SVG con estilos en línea.
        const svg = ck.actor.querySelector('svg');
        const copia = svg.cloneNode(true);
        const orig = [svg, ...svg.querySelectorAll('*')], dest = [copia, ...copia.querySelectorAll('*')];
        const props = ['fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'opacity', 'display', 'transform', 'transform-origin', 'transform-box', 'visibility'];
        orig.forEach((o, i) => { const cs = getComputedStyle(o); dest[i].setAttribute('style', props.map(p => `${p}:${cs.getPropertyValue(p)}`).join(';')); });
        const sb = svg.getBoundingClientRect();
        copia.setAttribute('width', sb.width); copia.setAttribute('height', sb.height);
        const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(copia));
        await new Promise((res) => { const img = new Image(); img.onload = () => { g.drawImage(img, (sb.left - r.left) * esc, (sb.top - r.top) * esc, sb.width * esc, sb.height * esc); res(); }; img.onerror = res; img.src = url; });
        // Pie de foto
        g.fillStyle = '#fffaf5'; g.fillRect(0, H, W, 70);
        g.fillStyle = '#3b2c45'; g.font = 'bold 26px Georgia, serif'; g.textAlign = 'left'; g.textBaseline = 'middle';
        g.fillText('Chokurei 🐾', 24, H + 35);
        g.font = '20px sans-serif'; g.textAlign = 'right';
        g.fillText(new Date().toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' }) + ' · por ' + nombreJugador(miIdentidad), W - 24, H + 35);
        // Miniatura para el álbum (liviana) + la foto grande, que se guarda aparte.
        const mini = document.createElement('canvas'); mini.width = 240; mini.height = Math.round(240 * cv.height / cv.width);
        mini.getContext('2d').drawImage(cv, 0, 0, mini.width, mini.height);
        return { grande: cv.toDataURL('image/jpeg', 0.78), mini: mini.toDataURL('image/jpeg', 0.7) };
    }
    window.sacarFotoChokurei = async () => {
        const hab = Chokurei.hab();
        if (!hab || !Chokurei.ck) return;
        vibrarJ(15);
        if (window.sonidosChokurei) sonidosChokurei.brillo();
        const flash = document.createElement('div'); flash.className = 'ck-flash'; hab.appendChild(flash);
        setTimeout(() => flash.remove(), 500);
        try {
            const { grande, mini } = await capturarEscena();
            // El álbum baja sólo las miniaturas (~8 KB cada una); la foto grande
            // vive en otro documento y se pide recién al abrirla.
            const ref = await window.addDoc(window.collection(window.db, 'juegos'), { tipo: 'chokurei-foto-grande', img: grande });
            await window.addDoc(window.collection(window.db, 'juegos'), { tipo: 'chokurei-foto', mini, grandeId: ref.id, autor: miIdentidad, en: ahoraSync() });
            Chokurei.emitir('foto');
            window.setDoc(Chokurei.ref(), { contadores: { fotos: window.increment(1) } }, { merge: true }).catch(() => {});
            Chokurei.ck.expresion('guino', 1500);
            Chokurei.ck.decir('¡Salí divino! 📸', 1800);
            if (typeof mostrarCartelEnVivo === 'function') mostrarCartelEnVivo({ titulo: '📸 Foto guardada en el álbum', sub: 'Tocá 📒 Álbum para verla', duracion: 2500 });
        } catch (e) {
            console.error('No se pudo sacar la foto:', e);
            Chokurei.ck.decir('Uy, la foto salió movida 😿', 1800);
        }
    };
    let fotos = null, mostrarFotos = 24;
    window.masFotosChokurei = () => { mostrarFotos += 24; refrescarPanelChokurei(); };
    Chokurei.paneles.album = () => {
        if (fotos === null) {
            fotos = [];
            const q = window.query(window.collection(window.db, 'juegos'), window.where('tipo', '==', 'chokurei-foto'));
            if (window._unsubAlbumChokurei) window._unsubAlbumChokurei();
            window._unsubAlbumChokurei = window.onSnapshot(q, (snap) => {
                fotos = [];
                snap.forEach(d => fotos.push({ id: d.id, ...d.data() }));
                fotos.sort((a, b) => (b.en || 0) - (a.en || 0));
                refrescarPanelChokurei();
            }, () => {});
            return '<div class="texto-centro texto-tenue">Cargando el álbum…</div>';
        }
        return `<div style="text-align:center; margin-bottom:8px;"><b>📒 Álbum de Chokurei</b></div>
            ${fotos.length ? `<div class="ck-album">${fotos.slice(0, mostrarFotos).map(f => `<img src="${f.mini || f.img}" alt="Foto de Chokurei" loading="lazy" onclick="verFotoChokurei('${f.id}')">`).join('')}</div>
                ${fotos.length > mostrarFotos ? `<button class="btn-secundario" style="margin-top:8px;" onclick="masFotosChokurei()">Ver más fotos (${fotos.length - mostrarFotos})</button>` : ''}`
                : '<div class="texto-centro texto-tenue">Todavía no hay fotos. Tocá 📸 cuando haga algo lindo.</div>'}`;
    };
    window.verFotoChokurei = async (id) => {
        const f0 = (fotos || []).find(x => x.id === id);
        if (!f0) return;
        let f = f0;
        // Las fotos nuevas guardan la grande aparte: se baja recién ahora.
        if (!f0.img && f0.grandeId) {
            const g = await new Promise(res => { const u = window.onSnapshot(window.doc(window.db, 'juegos', f0.grandeId), s => { u(); res(s.exists() ? s.data() : null); }, () => res(null)); });
            f = { ...f0, img: g ? g.img : f0.mini };
        }
        const fondo = document.createElement('div');
        fondo.className = 'ck-visor';
        fondo.innerHTML = `<img src="${f.img}" alt="Foto de Chokurei">
            <div class="texto-tenue" style="color:#fff;">📸 ${nombreJugador(f.autor)} · ${new Date(f.en).toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })}</div>
            <div class="btn-fila" style="width:min(92vw,420px);"><button class="btn-secundario" data-a="cerrar">Cerrar</button><button class="btn-principal" data-a="compartir">Compartir 📲</button></div>
            ${f.autor === miIdentidad && typeof window.deleteDoc === 'function' ? '<button class="btn-secundario" data-a="borrar" style="width:auto; padding:6px 12px; font-size:0.75rem;">🗑️ Borrar</button>' : ''}`;
        fondo.onclick = async (ev) => {
            const a = ev.target.dataset.a;
            if (ev.target === fondo || a === 'cerrar') fondo.remove();
            if (a === 'compartir') {
                const blob = await (await fetch(f.img)).blob();
                const archivo = new File([blob], 'chokurei.jpg', { type: 'image/jpeg' });
                if (navigator.canShare && navigator.canShare({ files: [archivo] })) navigator.share({ files: [archivo], title: 'Chokurei', text: 'Mirá a Chokurei 🐾' }).catch(() => {});
                else { const l = document.createElement('a'); l.href = f.img; l.download = 'chokurei.jpg'; l.click(); }
            }
            if (a === 'borrar' && confirm('¿Borrar esta foto del álbum?')) {
                await window.deleteDoc(window.doc(window.db, 'juegos', f.id));
                if (f.grandeId) window.deleteDoc(window.doc(window.db, 'juegos', f.grandeId)).catch(() => {});
                fondo.remove();
            }
        };
        document.body.appendChild(fondo);
    };

    // ==================== 📲 MENSAJE DE PARTE DE CHOKUREI ====================
    window.escribirDeParteDeChokurei = () => {
        const d = Chokurei.d;
        const numero = typeof NUMEROS_WHATSAPP_PAREJA !== 'undefined' && NUMEROS_WHATSAPP_PAREJA[otro()];
        if (!d || !numero) return;
        vibrarJ(10);
        const necesidades = [];
        if (d.hambre < 40) necesidades.push('tengo hambre 🐟');
        if (d.diversion < 40) necesidades.push('estoy aburrido 🧶');
        if (d.carino < 40) necesidades.push('quiero mimos 🖐️');
        if (d.higiene < 40) necesidades.push('necesito un bañito 🫧');
        const nombre = nombreJugador(otro());
        let texto;
        if (d.enferma) texto = `Miau… soy Chokurei 🤒 No me siento muy bien y necesito medicina. ¿Venís a cuidarme, ${nombre}?`;
        else if (necesidades.length) texto = `Miau, soy Chokurei 🐱 ${necesidades.join(', ')}. ¿Venís un ratito, ${nombre}? Te extraño 💜`;
        else texto = ['Miau 💕 Soy Chokurei. Solo quería decirte que ' + nombreJugador(miIdentidad) + ' te quiere mucho (y yo también).',
            `Prrr… ${nombre}, estoy re feliz hoy 😻 ¿Pasás a jugar conmigo?`,
            'Miau 🐾 Me sacaron una foto divina, vení a verla al álbum 📸'][Math.floor(Math.random() * 3)];
        const enlace = location.origin + location.pathname.replace(/[^/]*$/, '') + 'juegos.html?juego=mascota';
        window.open(`https://wa.me/${numero}?text=${encodeURIComponent(texto + '\n' + enlace)}`, '_blank');
        Chokurei.ck?.maullar('¡Le mandé un mensajito! 📲');
    };
});
