// ============================================================
// compartir-imagen.js - genera una tarjeta prolija en un canvas
// (fondo con degrade, titulo, numero grande, subtitulo) y dispara
// la descarga como PNG. Pensado para resultados tipo "% de Mente
// Gemela" o "resultado de ADN de la Pareja".
// ============================================================
function generarTarjetaImagen({ titulo, numeroGrande, subtitulo, pie, nombreArchivo }){
    const canvas = document.createElement('canvas');
    canvas.width = 800; canvas.height = 1000;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createLinearGradient(0, 0, 800, 1000);
    grad.addColorStop(0, '#241a33');
    grad.addColorStop(0.55, '#180f1e');
    grad.addColorStop(1, '#0b0812');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 800, 1000);

    // marco suave
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 2;
    ctx.strokeRect(30, 30, 740, 940);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#fdf6f0';

    ctx.font = '48px Georgia, serif';
    envolverTexto(ctx, titulo, 400, 220, 620, 56);

    ctx.font = 'bold 160px Georgia, serif';
    const gradTexto = ctx.createLinearGradient(200, 0, 600, 0);
    gradTexto.addColorStop(0, '#ffb3c6');
    gradTexto.addColorStop(0.5, '#c9b6ff');
    gradTexto.addColorStop(1, '#a8d8ff');
    ctx.fillStyle = gradTexto;
    ctx.fillText(numeroGrande, 400, 460);

    ctx.fillStyle = '#fdf6f0';
    ctx.font = '32px Arial, sans-serif';
    envolverTexto(ctx, subtitulo, 400, 560, 620, 40);

    ctx.font = '24px Arial, sans-serif';
    ctx.fillStyle = 'rgba(253,246,240,0.65)';
    ctx.fillText(pie || 'Nuestros Juegos', 400, 940);

    const link = document.createElement('a');
    link.download = (nombreArchivo || 'resultado') + '.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
}

function envolverTexto(ctx, texto, x, y, maxAncho, alturaLinea){
    const palabras = String(texto).split(' ');
    let linea = '';
    let lineaY = y;
    palabras.forEach((palabra) => {
        const pruebaLinea = linea + palabra + ' ';
        if (ctx.measureText(pruebaLinea).width > maxAncho && linea) {
            ctx.fillText(linea, x, lineaY);
            linea = palabra + ' ';
            lineaY += alturaLinea;
        } else {
            linea = pruebaLinea;
        }
    });
    ctx.fillText(linea, x, lineaY);
}

window.generarTarjetaImagen = generarTarjetaImagen;
