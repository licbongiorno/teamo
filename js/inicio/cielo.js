// ==================== EL CIELO DE NUESTRO PRIMER DÍA ====================
// Migrado del index inline. abrirCieloInterno() es lo que llama el
// cargador (ver abrirCielo() en index.html). Usa fechaEncuentro, que
// sigue siendo global en el script principal (ver sección Reloj).

// EL CIELO DE NUESTRO PRIMER DÍA
        // ============================================================
        // Usa la misma fecha que la cuenta regresiva (fechaEncuentro).
        // Antes de esa fecha habla en futuro ("Así será"); después, en pasado ("Así fue").
        let cieloAnimId = null;

        function abrirCieloInterno(event) {
            if (event) event.stopPropagation();
            vibrar(15);
            document.getElementById('modal-cielo').classList.remove('oculto');

            const yaPaso = Date.now() >= fechaEncuentro.getTime();
            const textoCielo = document.getElementById('texto-cielo');
            const subtexto = document.getElementById('subtexto-cielo');
            if (yaPaso) {
                textoCielo.innerText = 'Así fue nuestro cielo';
                subtexto.innerText = 'El cielo que nos vio abrazarnos por fin, el 25 de agosto de 2026, en Buenos Aires';
            } else {
                textoCielo.innerText = 'Así será nuestro cielo';
                subtexto.innerText = 'El cielo que nos va a ver abrazarnos por fin, el 25 de agosto de 2026, en Buenos Aires';
            }

            dibujarConstelacion();
            window.addEventListener('resize', dibujarConstelacion);
        }

        function cerrarCielo() {
            document.getElementById('modal-cielo').classList.add('oculto');
            window.removeEventListener('resize', dibujarConstelacion);
            if (cieloAnimId) cancelAnimationFrame(cieloAnimId);
        }

        function dibujarConstelacion() {
            const canvas = document.getElementById('canvas-constelacion');
            const ctx = canvas.getContext('2d');
            const dpr = window.devicePixelRatio || 1;
            canvas.width = window.innerWidth * dpr;
            canvas.height = window.innerHeight * dpr;
            canvas.style.width = window.innerWidth + 'px';
            canvas.style.height = window.innerHeight + 'px';
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            const w = window.innerWidth, h = window.innerHeight;

            // Semilla fija (25/08/2026) para que el cielo sea siempre el mismo al volver a abrirlo
            let semilla = 20260825;
            function random() {
                semilla = (semilla * 9301 + 49297) % 233280;
                return semilla / 233280;
            }

            const estrellas = [];
            const cantidadEstrellas = 140;
            for (let i = 0; i < cantidadEstrellas; i++) {
                estrellas.push({
                    x: random() * w, y: random() * h,
                    r: random() * 1.6 + 0.4,
                    brillo: random(), velocidad: random() * 0.02 + 0.01
                });
            }

            // Constelación propia: un grupo de estrellas destacadas unidas por líneas
            const puntosConstelacion = [];
            const centroX = w * 0.5, centroY = h * 0.42;
            const numPuntos = 7;
            for (let i = 0; i < numPuntos; i++) {
                const angulo = (i / numPuntos) * Math.PI * 2 + random() * 0.5;
                const radio = Math.min(w, h) * (0.14 + random() * 0.12);
                puntosConstelacion.push({
                    x: centroX + Math.cos(angulo) * radio,
                    y: centroY + Math.sin(angulo) * radio * 0.7
                });
            }

            let t = 0;
            function frame() {
                t += 0.016;
                ctx.clearRect(0, 0, w, h);
                const grad = ctx.createRadialGradient(w/2, h*0.4, 0, w/2, h*0.4, Math.max(w,h)*0.8);
                grad.addColorStop(0, '#0a1128');
                grad.addColorStop(1, '#04060c');
                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, w, h);

                // Estrellas de fondo
                estrellas.forEach(e => {
                    const parpadeo = 0.5 + 0.5 * Math.sin(t * e.velocidad * 20 + e.brillo * 10);
                    ctx.beginPath();
                    ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(255,255,255,${0.3 + parpadeo * 0.6})`;
                    ctx.fill();
                });

                // Líneas de la constelación
                ctx.strokeStyle = 'rgba(150,180,255,0.5)';
                ctx.lineWidth = 1.2;
                ctx.beginPath();
                puntosConstelacion.forEach((p, i) => {
                    if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
                });
                ctx.closePath();
                ctx.stroke();

                // Puntos brillantes de la constelación
                puntosConstelacion.forEach(p => {
                    const pulso = 2.2 + Math.sin(t * 1.5) * 0.6;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, pulso, 0, Math.PI * 2);
                    ctx.fillStyle = '#ffe3ec';
                    ctx.shadowColor = 'rgba(255,182,193,0.9)';
                    ctx.shadowBlur = 12;
                    ctx.fill();
                    ctx.shadowBlur = 0;
                });

                cieloAnimId = requestAnimationFrame(frame);
            }
            if (cieloAnimId) cancelAnimationFrame(cieloAnimId);
            frame();
        }

        // ============================================================
        