// ============================================================
// compartir-imagen.js - genera una tarjeta prolija en un canvas
// (fondo con degrade, titulo, numero grande, subtitulo) y dispara
// la descarga como PNG. Pensado para resultados tipo "% de Mente
// Gemela" o "resultado de ADN de la Pareja".
// ============================================================
function generarTarjetaImagen({ titulo, numeroGrande, subtitulo, pie, nombreArchivo, respuestas }){
    const canvas = document.createElement('canvas');
    canvas.width = 800; canvas.height = 1000;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createLinearGradient(0, 0, 800, 1000);
    grad.addColorStop(0, '#241a33');
    grad.addColorStop(0.55, '#180f1e');
    grad.addColorStop(1, '#0b0812');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 800, 1000);
    // brillos suaves de fondo
    [[160, 180, '#ffb3c6'], [660, 820, '#a8d8ff'], [620, 240, '#c9b6ff']].forEach(([x, y, c]) => { const g = ctx.createRadialGradient(x, y, 10, x, y, 320); g.addColorStop(0, c + '30'); g.addColorStop(1, c + '00'); ctx.fillStyle = g; ctx.fillRect(0, 0, 800, 1000); });

    // marco suave
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 2;
    ctx.strokeRect(30, 30, 740, 940);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#fdf6f0';

    if (respuestas && respuestas.length) {
        // Pregunta arriba y una burbuja por respuesta
        ctx.font = 'italic 40px Georgia, serif';
        let y = envolverTexto(ctx, `“${titulo}”`, 400, 150, 640, 50) + 70;
        respuestas.forEach((r, k) => {
            ctx.font = '30px Arial, sans-serif';
            const lineas = partirLineas(ctx, r.texto, 600).slice(0, 7), alto = 70 + lineas.length * 40;
            const x0 = k % 2 ? 110 : 70, ancho = 620;
            ctx.fillStyle = r.color + '26'; ctx.strokeStyle = r.color + '99'; ctx.lineWidth = 2;
            redondeado(ctx, x0, y, ancho, alto, 26); ctx.fill(); ctx.stroke();
            ctx.textAlign = 'left'; ctx.fillStyle = r.color; ctx.font = 'bold 26px Arial, sans-serif'; ctx.fillText(r.quien, x0 + 28, y + 44);
            ctx.fillStyle = '#fdf6f0'; ctx.font = '30px Arial, sans-serif';
            lineas.forEach((l, i) => ctx.fillText(l, x0 + 28, y + 88 + i * 40));
            ctx.textAlign = 'center';
            y += alto + 30;
        });
    } else {
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
    }

    ctx.font = '24px Arial, sans-serif';
    ctx.fillStyle = 'rgba(253,246,240,0.65)';
    ctx.fillText(pie || 'Nuestros Juegos', 400, 940);

    // En el celu se abre "compartir" (WhatsApp, galería…); si no se puede, se descarga.
    const archivo = (nombreArchivo || 'resultado') + '.png';
    const descargar = () => { const link = document.createElement('a'); link.download = archivo; link.href = canvas.toDataURL('image/png'); link.click(); };
    if (!canvas.toBlob || !navigator.canShare) { descargar(); return; }
    canvas.toBlob((blob) => {
        try {
            const file = new File([blob], archivo, { type: 'image/png' });
            if (navigator.canShare({ files: [file] })) navigator.share({ files: [file], title: titulo }).catch((e) => { if (e && e.name !== 'AbortError') descargar(); });
            else descargar();
        } catch (e) { descargar(); }
    }, 'image/png');
}
function partirLineas(ctx, texto, maxAncho){
    const lineas = []; let linea = '';
    String(texto).split(/\s+/).forEach(p => { const prueba = linea ? linea + ' ' + p : p; if (ctx.measureText(prueba).width > maxAncho && linea) { lineas.push(linea); linea = p; } else linea = prueba; });
    if (linea) lineas.push(linea);
    return lineas;
}
function redondeado(ctx, x, y, w, h, r){ ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }

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
    return lineaY;
}

window.generarTarjetaImagen = generarTarjetaImagen;
