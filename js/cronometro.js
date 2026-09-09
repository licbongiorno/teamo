// ============================================================
// cronometro.js - cronometro visual de "tiempo en este turno",
// puramente cosmetico (no fuerza a nadie a jugar mas rapido, no se
// sincroniza entre dispositivos). Se reinicia solo cuando cambia
// el turno. Pensado para Ajedrez y Damas.
// ============================================================
let _cronoTurnoDesde = null;
let _cronoTurnoValorPrevio = null;
let _cronoIntervalo = null;

function actualizarCronometroTurno(elementoId, turnoActual){
    if (turnoActual !== _cronoTurnoValorPrevio) {
        _cronoTurnoValorPrevio = turnoActual;
        _cronoTurnoDesde = Date.now();
    }
    if (_cronoIntervalo) clearInterval(_cronoIntervalo);
    const pintar = () => {
        const el = document.getElementById(elementoId);
        if (!el) { clearInterval(_cronoIntervalo); return; }
        const segundos = Math.floor((Date.now() - _cronoTurnoDesde) / 1000);
        const m = Math.floor(segundos / 60);
        const s = segundos % 60;
        el.innerText = `⏱️ ${m}:${String(s).padStart(2, '0')}`;
    };
    pintar();
    _cronoIntervalo = setInterval(pintar, 1000);
}

function detenerCronometroTurno(){
    if (_cronoIntervalo) { clearInterval(_cronoIntervalo); _cronoIntervalo = null; }
    _cronoTurnoDesde = null;
    _cronoTurnoValorPrevio = null;
}

window.actualizarCronometroTurno = actualizarCronometroTurno;
window.detenerCronometroTurno = detenerCronometroTurno;
