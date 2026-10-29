// ==================== TABÚ Y MÍMICA (cooperativo, para jugar juntos) ====================
// Para cuando están juntos (o por videollamada). Uno ve la palabra y la
// explica en 60 segundos: en Tabú, sin decir las 4 prohibidas; en Mímica,
// sin hablar. El que explica marca ✅ acertó, ❌ se le escapó una
// prohibida o ⏭️ pasar. 4 turnos (2 cada uno) y suman juntos contra su récord.
const SEGUNDOS_TABU = 60, TURNOS_TABU = 4;
const BANCO_TABU = [
    'mate|bombilla,yerba,termo,tomar', 'asado|carne,parrilla,domingo,fuego', 'empanada|horno,carne,masa,repulgue', 'dulce de leche|alfajor,untar,leche,dulce',
    'colectivo|bondi,pasaje,parada,chofer', 'subte|tren,estación,línea,abajo', 'fútbol|pelota,gol,cancha,Messi', 'tango|bailar,Gardel,bandoneón,milonga',
    'playa|arena,mar,sol,verano', 'montaña|nieve,subir,alta,cerro', 'cumpleaños|torta,velas,regalo,fiesta', 'navidad|árbol,regalos,diciembre,papá noel',
    'pizza|muzzarella,horno,porción,queso', 'helado|frío,cucurucho,gusto,heladería', 'café|taza,cafetera,negro,mañana', 'medialuna|factura,desayuno,manteca,croissant',
    'perro|ladrar,mascota,guau,cucha', 'gato|maullar,miau,mascota,bigotes', 'pingüino|frío,blanco y negro,hielo,ave', 'jirafa|cuello,largo,manchas,África',
    'elefante|trompa,grande,orejas,gris', 'mariposa|alas,volar,oruga,colores', 'dinosaurio|extinto,jurásico,grande,fósil', 'tiburón|mar,dientes,pez,aleta',
    'avión|volar,aeropuerto,piloto,alas', 'bicicleta|pedalear,ruedas,manubrio,andar', 'barco|mar,navegar,agua,capitán', 'cohete|espacio,despegar,luna,nave',
    'celular|teléfono,llamar,pantalla,mensaje', 'computadora|teclado,pantalla,mouse,internet', 'televisión|tele,canal,control,mirar', 'heladera|frío,cocina,comida,freezer',
    'paraguas|lluvia,mojarse,abrir,agua', 'anteojos|ver,lentes,ojos,vista', 'reloj|hora,tiempo,muñeca,agujas', 'espejo|reflejo,mirarse,vidrio,baño',
    'beso|labios,boca,dar,amor', 'abrazo|brazos,apretar,cariño,dar', 'casamiento|boda,novia,anillo,iglesia', 'luna de miel|viaje,casados,boda,después',
    'cita|salir,pareja,cena,romántica', 'carta de amor|escribir,papel,te amo,sobre', 'anillo|dedo,compromiso,oro,casarse', 'serenata|cantar,ventana,guitarra,noche',
    'doctor|médico,hospital,enfermo,receta', 'bombero|fuego,incendio,manguera,camión', 'maestra|escuela,alumnos,clase,enseñar', 'cocinero|cocinar,chef,restaurante,comida',
    'payaso|circo,nariz,reír,maquillaje', 'mago|magia,truco,sombrero,conejo', 'pirata|barco,tesoro,parche,loro', 'fantasma|sábana,susto,muerto,boo',
    'superhéroe|poderes,capa,salvar,volar', 'princesa|corona,castillo,rey,cuento', 'vampiro|sangre,colmillos,Drácula,noche', 'robot|máquina,metal,inteligencia,mover',
    'cine|película,pantalla,pochoclo,ver', 'teatro|obra,actor,escenario,función', 'concierto|música,banda,cantar,recital', 'museo|cuadros,arte,exposición,visitar',
    'biblioteca|libros,leer,silencio,prestar', 'supermercado|comprar,changuito,caja,góndola', 'farmacia|remedio,medicamento,receta,pastilla', 'peluquería|pelo,cortar,tijera,peinado',
    'dormir|cama,sueño,noche,almohada', 'bostezar|sueño,boca,cansado,abrir', 'estornudar|achís,nariz,resfrío,alergia', 'roncar|dormir,ruido,nariz,noche',
    'cocinar|comida,olla,receta,fuego', 'bailar|música,pareja,mover,baile', 'nadar|agua,pileta,brazos,natación', 'manejar|auto,volante,conducir,ruta',
    'sacar una foto|cámara,celular,flash,foto', 'lavar los platos|cocina,agua,detergente,esponja', 'planchar|ropa,arrugas,caliente,camisa', 'regar las plantas|agua,jardín,maceta,flores',
    'arcoíris|colores,lluvia,cielo,sol', 'tormenta|lluvia,rayos,truenos,viento', 'nieve|frío,blanca,invierno,copos', 'volcán|lava,erupción,montaña,fuego',
    'guitarra|cuerdas,tocar,instrumento,acordes', 'piano|teclas,blancas y negras,tocar,instrumento', 'batería|tambores,platillos,palillos,golpear', 'micrófono|cantar,voz,hablar,sonido',
    'chocolate|cacao,dulce,marrón,tableta', 'pochoclo|maíz,cine,explotar,dulce', 'sushi|arroz,pescado,japonés,palitos', 'milanesa|carne,pan rallado,huevo,frita',
    'alfajor|dulce de leche,galletita,chocolate,maicena', 'tostada|pan,desayuno,tostadora,manteca', 'sopa|cuchara,caliente,caldo,plato hondo', 'ensalada|lechuga,tomate,verdura,aceite',
    'vacaciones|viajar,descansar,verano,valija', 'valija|ropa,viaje,equipaje,ruedas', 'mapa|lugar,calles,encontrar,papel', 'brújula|norte,dirección,aguja,perderse',
    'mariachi|México,sombrero,cantar,trompeta', 'cumbia|bailar,música,ritmo,tropical', 'karaoke|cantar,letra,micrófono,pantalla', 'disco|bailar,boliche,luces,noche',
];
let _timerTabu = null;

const Tabu = JuegoTurnos.crear({
    id: 'tabu',
    emojiListo: '🗣️',
    intro: `Para jugar juntos (o por videollamada). Uno ve la palabra y la explica en ${SEGUNDOS_TABU} segundos: en Tabú sin decir las prohibidas, en Mímica ¡sin hablar! ${TURNOS_TABU} turnos y suman juntos.`,
    inicial: (previo) => ({ turnoN: 1, etapa: 'listo', modo: 'tabu', mazo: [...BANCO_TABU.keys()].sort(() => Math.random() - 0.5), idx: 0, puntos: 0, enTurno: 0, record: previo.record || 0, inicio: null, turno: Math.random() < 0.5 ? 'nico' : 'carito' }),
    tituloFin: (e) => e.motivo && e.motivo.startsWith('🎉') ? '🗣️ ¡Récord!' : `🗣️ ${e.puntos} palabras juntos`,
    textoTurno: (e) => e.etapa === 'listo' ? '🗣️ Te toca explicar' : '⏱️ ¡Explicá!',
    render(e, c) {
        const esc = JuegoTurnos.esc;
        const explica = e.turno === c.yo;
        let h = `<div class="texto-centro" style="font-size:0.85rem;">Turno ${e.turnoN}/${TURNOS_TABU} · ⭐ ${e.puntos} juntos${e.record ? ` · récord ${e.record}` : ''}</div>`;
        if (e.etapa === 'listo') {
            if (!explica) return h + `<div class="panel texto-centro">Ahora explica <b>${nombreJugador(e.turno)}</b>. ¡Preparate para adivinar! 🤔</div>`;
            return h + `<div class="panel texto-centro"><b>Te toca explicar</b><div class="texto-tenue" style="font-size:0.8rem; margin:4px 0 10px;">${nombreJugador(c.rival)} adivina en voz alta. Elegí el modo:</div>
                <div class="btn-fila"><button class="btn-principal" onclick="empezarTabu('tabu')">🗣️ Tabú</button><button class="btn-principal" onclick="empezarTabu('mimica')">🤸 Mímica</button></div></div>`;
        }
        const [pal, proh] = BANCO_TABU[e.mazo[e.idx % e.mazo.length]].split('|');
        h += `<div class="silaba-enc">${e.modo === 'mimica' ? '🤸 Mímica' : '🗣️ Tabú'} · ✅ ${e.enTurno} <span>⏱️ <b id="reloj-tabu">${SEGUNDOS_TABU}</b>s</span></div>`;
        if (!explica) return h + `<div class="panel texto-centro destello" style="font-size:1.2rem;">¡Adiviná lo que ${e.modo === 'mimica' ? 'actúa' : 'explica'} ${nombreJugador(e.turno)}! 🤔</div>`;
        h += `<div class="carta-tabu" data-aj-id="tabu-${e.idx}"><div class="palabra-tabu">${esc(pal.toUpperCase())}</div>
            ${e.modo === 'tabu' ? `<div class="prohibidas-tabu">${proh.split(',').map(p => `<span>🚫 ${esc(p)}</span>`).join('')}</div>` : '<div class="texto-tenue">¡Sin hablar ni hacer ruidos!</div>'}</div>
            <div class="botones-tabu"><button class="si" onclick="marcarTabu('si')">✅ Acertó</button><button class="no" onclick="marcarTabu('no')">❌ ${e.modo === 'tabu' ? 'Dije una prohibida' : 'Hablé'}</button><button onclick="marcarTabu('pasar')">⏭️ Pasar</button></div>`;
        return h;
    },
    alDibujar(cont, e) {
        clearInterval(_timerTabu);
        if (e.fase !== 'jugando' || e.etapa !== 'jugando') return;
        const tic = () => {
            const quedan = Math.max(0, Math.ceil(SEGUNDOS_TABU - (window.ahoraSync() - e.inicio) / 1000));
            const r = document.getElementById('reloj-tabu');
            if (r) { r.textContent = quedan; r.parentElement.classList.toggle('apurado', quedan <= 10); }
            if (quedan <= 0) { clearInterval(_timerTabu); terminarTurnoTabu(); }
        };
        tic();
        _timerTabu = setInterval(tic, 500);
        window._unsubTimerTabu = () => clearInterval(_timerTabu);
    }
});

async function empezarTabu(modo){
    vibrarJ(12);
    await Tabu.jugar((e) => e.etapa === 'listo' ? { etapa: 'jugando', modo, inicio: window.ahoraSync(), enTurno: 0 } : null);
    if (window.sfx) window.sfx.revelar ? window.sfx.revelar() : window.sfx.click();
}
async function marcarTabu(que){
    vibrarJ(que === 'si' ? [10, 20, 10] : 10);
    await Tabu.jugar((e) => {
        if (e.etapa !== 'jugando') return null;
        const extra = que === 'si' ? 1 : 0;
        return { idx: e.idx + 1, enTurno: e.enTurno + extra, puntos: e.puntos + extra };
    });
    if (window.sfx) que === 'si' ? window.sfx.acierto() : que === 'no' ? window.sfx.error() : window.sfx.click();
}
async function terminarTurnoTabu(){
    await Tabu.accion((e) => {
        if (e.etapa !== 'jugando' || (window.ahoraSync() - e.inicio) / 1000 < SEGUNDOS_TABU) return null;
        const resumen = `⏱️ ${nombreJugador(e.turno)} hizo adivinar ${e.enTurno}.`;
        if (e.turnoN >= TURNOS_TABU) {
            const nuevo = e.puntos > (e.record || 0);
            return { etapa: 'fin', record: Math.max(e.record || 0, e.puntos), aviso: resumen, ganador: 'empate', motivo: nuevo ? `🎉 ¡Nuevo récord: ${e.puntos} palabras!` : `Adivinaron ${e.puntos} (récord: ${e.record}).` };
        }
        return { etapa: 'listo', turnoN: e.turnoN + 1, idx: e.idx + 1, turno: e.turno === 'nico' ? 'carito' : 'nico', aviso: resumen };
    });
}
