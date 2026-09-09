// ==================== BOLETO DE AVIÓN DORADO ====================
// Migrado del index inline. abrirBoletoInterno() es lo que llama el
// cargador (ver abrirBoleto() en index.html), la primera vez que se
// abre. No requiere identidad (es de acceso libre, como antes).

// BOLETO DE AVIÓN DORADO
        // ============================================================
        function abrirBoletoInterno(event) {
            if (event) event.stopPropagation();
            vibrar(15);
            const modal = document.getElementById('modal-boleto');
            modal.classList.remove('oculto');
            setTimeout(() => document.getElementById('pase-abordar').classList.add('mostrar'), 60);
            window.addEventListener('deviceorientation', actualizarHolograma);
            modal.addEventListener('mousemove', actualizarHologramaMouse);
            modal.addEventListener('touchmove', actualizarHologramaTouch);
        }

        function cerrarBoleto() {
            const modal = document.getElementById('modal-boleto');
            document.getElementById('pase-abordar').classList.remove('mostrar');
            setTimeout(() => modal.classList.add('oculto'), 300);
            window.removeEventListener('deviceorientation', actualizarHolograma);
            modal.removeEventListener('mousemove', actualizarHologramaMouse);
            modal.removeEventListener('touchmove', actualizarHologramaTouch);
        }

        function actualizarHolograma(e) {
            const porcentaje = Math.max(0, Math.min(100, 50 + (e.gamma || 0) * 1.5));
            document.getElementById('pase-holograma').style.setProperty('--holo-x', porcentaje + '%');
        }
        function actualizarHologramaMouse(e) {
            const rect = e.currentTarget.getBoundingClientRect();
            const porcentaje = ((e.clientX - rect.left) / rect.width) * 100;
            document.getElementById('pase-holograma').style.setProperty('--holo-x', porcentaje + '%');
        }
        function actualizarHologramaTouch(e) {
            if (!e.touches || !e.touches[0]) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const porcentaje = ((e.touches[0].clientX - rect.left) / rect.width) * 100;
            document.getElementById('pase-holograma').style.setProperty('--holo-x', porcentaje + '%');
        }

        // ============================================================
        