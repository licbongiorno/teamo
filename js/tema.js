// ============================================================
// tema.js - alterna entre el tema oscuro (por defecto) y uno claro,
// persistido en localStorage. Se aplica sobre <html data-tema="claro">
// para que el CSS (ver css/global.css) pinte todo de nuevo.
// ============================================================
function aplicarTemaGuardado(){
    const guardado = localStorage.getItem('temaJuegos');
    if (guardado === 'claro') document.documentElement.setAttribute('data-tema', 'claro');
    actualizarBotonTema();
}

function alternarTema(){
    vibrarJ(10);
    const actual = document.documentElement.getAttribute('data-tema');
    if (actual === 'claro') {
        document.documentElement.removeAttribute('data-tema');
        localStorage.setItem('temaJuegos', 'oscuro');
    } else {
        document.documentElement.setAttribute('data-tema', 'claro');
        localStorage.setItem('temaJuegos', 'claro');
    }
    actualizarBotonTema();
}

function actualizarBotonTema(){
    const btn = document.getElementById('btn-tema');
    if (!btn) return;
    const esClaro = document.documentElement.getAttribute('data-tema') === 'claro';
    btn.innerText = esClaro ? '🌙' : '☀️';
    btn.title = esClaro ? 'Pasar a tema oscuro' : 'Pasar a tema claro';
}

window.alternarTema = alternarTema;
window.aplicarTemaGuardado = aplicarTemaGuardado;
