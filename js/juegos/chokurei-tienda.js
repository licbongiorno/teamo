// ============================================================
// chokurei-tienda.js — la tiendita de Chokurei: ropa, muebles y
// juguetes que se compran con los puntos ⭐ compartidos.
//
// Lo comprado queda en el documento de la mascota:
//   inventario: { <id>: true }   equipado: { ropa, cama, cuadro, alfombra }
// Los muebles y juguetes aparecen en la habitación y Chokurei los usa
// solo: se mete en la caja, afila las uñas en el rascador, le pega a la
// pelota, salta sobre el ratón de juguete, juega con la pluma.
// ============================================================
const TIENDA_CHOKUREI = [
    // Ropa (se pone una a la vez)
    { id: 'bufanda',   tipo: 'ropa',     nombre: 'Bufanda rayada', emoji: '🧣', costo: 20 },
    { id: 'gorrolana', tipo: 'ropa',     nombre: 'Gorro de lana',  emoji: '🧶', costo: 25 },
    { id: 'capa',      tipo: 'ropa',     nombre: 'Capa de héroe',  emoji: '🦸', costo: 40 },
    { id: 'calabaza',  tipo: 'ropa',     nombre: 'Disfraz de calabaza', emoji: '🎃', costo: 35 },
    { id: 'navidad',   tipo: 'ropa',     nombre: 'Gorro navideño', emoji: '🎅', costo: 30 },
    // Muebles
    { id: 'caja',      tipo: 'mueble',   nombre: 'Caja de cartón', emoji: '📦', costo: 15, desc: 'Se mete adentro (obvio).' },
    { id: 'rascador',  tipo: 'mueble',   nombre: 'Rascador',       emoji: '🪵', costo: 30, desc: 'Para afilar las uñas sin romper nada.' },
    { id: 'cama-nube', tipo: 'cama',     nombre: 'Cama nube',      emoji: '☁️', costo: 25 },
    { id: 'cama-corazon', tipo: 'cama',  nombre: 'Cama corazón',   emoji: '💗', costo: 25 },
    { id: 'cuadro-nosotros', tipo: 'cuadro', nombre: 'Cuadro "nosotros"', emoji: '💑', costo: 10 },
    { id: 'cuadro-luna', tipo: 'cuadro', nombre: 'Cuadro de luna', emoji: '🌙', costo: 10 },
    { id: 'cuadro-pez', tipo: 'cuadro',  nombre: 'Cuadro de pescado', emoji: '🐠', costo: 10 },
    { id: 'alfombra-arcoiris', tipo: 'alfombra', nombre: 'Alfombra arcoíris', emoji: '🌈', costo: 20 },
    { id: 'alfombra-menta', tipo: 'alfombra', nombre: 'Alfombra menta', emoji: '🍃', costo: 15 },
    // Juguetes
    { id: 'pelota',    tipo: 'juguete',  nombre: 'Pelotita',       emoji: '⚽', costo: 10 },
    { id: 'raton',     tipo: 'juguete',  nombre: 'Ratón de juguete', emoji: '🐭', costo: 12 },
    { id: 'pluma',     tipo: 'juguete',  nombre: 'Pluma',          emoji: '🪶', costo: 15 },
];
const SECCIONES_TIENDA = [
    { id: 'ropa', nombre: '👕 Ropa', tipos: ['ropa'] },
    { id: 'muebles', nombre: '🛋️ Muebles', tipos: ['mueble', 'cama', 'cuadro', 'alfombra'] },
    { id: 'juguetes', nombre: '🧸 Juguetes', tipos: ['juguete'] },
];

(window.CHOKUREI_MODULOS = window.CHOKUREI_MODULOS || []).push(function (Chokurei) {
    let seccion = 'ropa';
    const tiene = (id) => !!(Chokurei.estado.inventario || {})[id];
    const equipado = () => Chokurei.estado.equipado || {};

    // ---------- La habitación ----------
    Chokurei.on('actualizar', ({ estado }) => {
        const hab = Chokurei.hab(), ck = Chokurei.ck;
        if (!hab || !ck) return;
        const eq = estado.equipado || {}, inv = estado.inventario || {};
        ck.vestir(eq.ropa || Chokurei.ropaDeTemporada || null);
        const cama = hab.querySelector('.ck-cama');
        if (cama) cama.dataset.estilo = eq.cama || '';
        const alf = hab.querySelector('.ck-alfombra');
        if (alf) alf.dataset.estilo = eq.alfombra || '';
        const cuadro = hab.querySelector('.ck-cuadro');
        if (cuadro) cuadro.textContent = (TIENDA_CHOKUREI.find(i => i.id === eq.cuadro) || { emoji: '🐾' }).emoji;
        // Muebles y juguetes: se agregan una sola vez.
        const poner = (id, clase, html, estilo) => {
            if (!inv[id] || hab.querySelector('.' + clase)) return;
            const el = document.createElement('div');
            el.className = clase; el.innerHTML = html; if (estilo) el.setAttribute('style', estilo);
            hab.insertBefore(el, hab.querySelector('.ck-oscuro'));
        };
        poner('caja', 'ck-mueble-caja', '<div class="frente">📦</div>');
        poner('rascador', 'ck-mueble-rascador', '<div class="poste"></div><div class="base"></div>');
        poner('pelota', 'ck-juguete ck-juguete-pelota', '⚽', 'left:62%');
        poner('raton', 'ck-juguete ck-juguete-raton', '🐭', 'left:40%');
        poner('pluma', 'ck-juguete ck-juguete-pluma', '🪶', 'left:30%');
    });

    // ---------- Lo que hace solo con sus cosas ----------
    const xDe = (el) => { const h = Chokurei.hab().getBoundingClientRect(), r = el.getBoundingClientRect(); return (r.left + r.width / 2 - h.left) / h.width * 100; };
    Chokurei.comportamientos.push(() => {
        const caja = Chokurei.hab()?.querySelector('.ck-mueble-caja');
        if (!caja || Math.random() > 0.5) return false;
        (async () => {
            const ck = Chokurei.ck;
            await ck.caminarA(xDe(caja));
            await ck.saltar(24);
            ck.meterse(true);
            caja.classList.add('ocupada');
            ck.decir(['Si quepo, me quedo 📦', 'Mi castillo 🏰', '🙈'][Math.floor(Math.random() * 3)], 2200);
            setTimeout(() => { if (!Chokurei.ck) return; caja.classList.remove('ocupada'); Chokurei.ck.meterse(false); Chokurei.ck.saltar(20); }, 5500);
        })();
        return true;
    });
    Chokurei.comportamientos.push(() => {
        const r = Chokurei.hab()?.querySelector('.ck-mueble-rascador');
        if (!r || Math.random() > 0.5) return false;
        Chokurei.ck.caminarA(xDe(r) + 6).then(() => { Chokurei.ck.mirarA('izquierda'); return Chokurei.ck.rascar(); });
        return true;
    });
    Chokurei.comportamientos.push(() => {
        const juguetes = [...(Chokurei.hab()?.querySelectorAll('.ck-juguete') || [])];
        if (!juguetes.length) return false;
        const j = juguetes[Math.floor(Math.random() * juguetes.length)];
        (async () => {
            const ck = Chokurei.ck;
            const x = xDe(j);
            await ck.caminarA(x + (x > 50 ? -7 : 7), j.classList.contains('ck-juguete-raton'));
            ck.mirarA(x > ck.x ? 'derecha' : 'izquierda');
            if (j.classList.contains('ck-juguete-raton')) { await ck.saltar(26); ck.decir('¡Te atrapé! 🐭', 1500); }
            else await ck.manotazo();
            // El juguete sale rodando / volando.
            const destino = 12 + Math.random() * 76;
            j.animate([{ left: j.style.left || x + '%', transform: 'rotate(0)' }, { left: destino + '%', transform: `rotate(${destino > x ? 540 : -540}deg)` }], { duration: 900, easing: 'cubic-bezier(.2,.8,.3,1)', fill: 'forwards' })
                .finished.then(() => { j.style.left = destino + '%'; j.getAnimations().forEach(a => a.cancel()); });
            if (window.sonidosChokurei) sonidosChokurei.salto();
            ck.particula('✨', { dx: 30, dur: 800 });
        })();
        return true;
    });

    // ---------- El panel de la tienda ----------
    Chokurei.paneles.tienda = () => {
        const puntos = (window._puntosMascota || {})[miIdentidad] || 0;
        const eq = equipado();
        const sec = SECCIONES_TIENDA.find(x => x.id === seccion);
        const items = TIENDA_CHOKUREI.filter(i => sec.tipos.includes(i.tipo));
        return `<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;"><b>🛍️ Tiendita de Chokurei</b><span class="ck-chip">⭐ ${puntos}</span></div>
            <div class="ck-pestanas">${SECCIONES_TIENDA.map(x => `<button class="${x.id === seccion ? 'activa' : ''}" onclick="seccionTiendaChokurei('${x.id}')">${x.nombre}</button>`).join('')}</div>
            <div class="ck-tienda-grilla">${items.map(i => {
                const lo = tiene(i.id);
                const puesto = (i.tipo === 'ropa' && eq.ropa === i.id) || (i.tipo === 'cama' && eq.cama === i.id) || (i.tipo === 'cuadro' && eq.cuadro === i.id) || (i.tipo === 'alfombra' && eq.alfombra === i.id);
                const equipable = ['ropa', 'cama', 'cuadro', 'alfombra'].includes(i.tipo);
                const boton = !lo ? `<button class="btn-principal" ${puntos < i.costo ? 'disabled style="opacity:0.45"' : ''} onclick="comprarTiendaChokurei('${i.id}')">${i.costo} ⭐</button>`
                    : equipable ? `<button class="btn-secundario" onclick="equiparTiendaChokurei('${i.id}')">${puesto ? 'Sacar' : 'Usar'}</button>`
                    : `<span class="texto-tenue">✅ En la habitación</span>`;
                return `<div class="ck-item${puesto ? ' puesto' : ''}"><div class="emoji">${i.emoji}</div><div class="nombre">${i.nombre}</div>${i.desc ? `<div class="texto-tenue" style="font-size:0.65rem;">${i.desc}</div>` : ''}${boton}</div>`;
            }).join('')}</div>
            <div class="texto-tenue" style="font-size:0.72rem; margin-top:8px;">Los puntos se ganan jugando en la app. Lo que compra uno es de los dos.</div>`;
    };
    window.seccionTiendaChokurei = (id) => { seccion = id; refrescarPanelChokurei(); };
    window.comprarTiendaChokurei = async (id) => {
        const item = TIENDA_CHOKUREI.find(i => i.id === id);
        if (!item || tiene(id)) return;
        vibrarJ(12);
        const pagado = await Chokurei.gastarPuntos(item.costo);
        if (!pagado) { if (window.sfx) window.sfx.error(); Chokurei.ck?.decir('Faltan puntitos 🥺', 1800); return; }
        if (window.sfx) window.sfx.moneda();
        const cambios = { inventario: { [id]: true } };
        if (['ropa', 'cama', 'cuadro', 'alfombra'].includes(item.tipo)) cambios.equipado = { [item.tipo]: id };
        await window.setDoc(Chokurei.ref(), cambios, { merge: true });
        await Chokurei.aplicarCuidado({ diversion: 10 }, `le compró ${item.nombre.toLowerCase()} ${item.emoji} a Chokurei`, 3);
        const ck = Chokurei.ck;
        if (ck) { ck.alegrarse(); ck.decir(`¡${item.emoji} para mí! 💕`, 2200); }
        if (window.fx) window.fx.confeti();
    };
    window.equiparTiendaChokurei = async (id) => {
        const item = TIENDA_CHOKUREI.find(i => i.id === id);
        if (!item) return;
        vibrarJ(8);
        const actual = equipado()[item.tipo];
        await window.setDoc(Chokurei.ref(), { equipado: { [item.tipo]: actual === id ? null : id } }, { merge: true });
        if (Chokurei.ck && actual !== id) { Chokurei.ck.expresion('guino', 1300); Chokurei.ck.decir('¿Cómo me queda? 😼', 1800); }
    };
});
