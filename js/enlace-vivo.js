// ============================================================
// enlace-vivo.js — conexión directa entre los dos celulares (WebRTC)
// para los juegos en vivo de verdad (posiciones 20 veces por segundo).
// Firestore sólo se usa para "presentarse" (offer/answer/ICE) en el doc
// juegos/rtc-<sala>. Nico siempre ofrece y Carito responde (así nunca
// se pisan las dos ofertas). Si en 8 segundos no hay conexión directa
// (algunas redes móviles no la dejan), se pasa a un respaldo por
// Firestore: posiciones a 4 por segundo y eventos en una lista corta.
//
// Uso:
//   const enlace = EnlaceVivo.conectar('aventura', { alMensaje(tipo, datos){}, alEstado(estado){} });
//   enlace.enviar('pos', {...});            // rápido, se puede perder (lo nuevo pisa a lo viejo)
//   enlace.enviar('moneda', {...}, true);   // confiable: llega sí o sí, una vez
//   enlace.estado → 'conectando' | 'directo' | 'respaldo' | 'cerrado'
//   enlace.cerrar();
// ============================================================
(function () {
    const ICE = [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }];
    const ESPERA_DIRECTO = 8000, HZ_RESPALDO = 250;
    const ahora = () => (typeof window.ahoraSync === 'function' ? window.ahoraSync() : Date.now());
    const enCompu = () => typeof window.modoCompu === 'function' && !!window.modoCompu();

    function conectar(sala, cb) {
        const yo = miIdentidad, otro = miRival;
        const ofrezco = yo === 'nico';
        const refSala = window.doc(window.db, 'juegos', 'rtc-' + sala);
        const refPos = (q) => window.doc(window.db, 'juegos', `vivo-${sala}-${q}`);
        const onSnap = window._onSnapshotSinCompu || window.onSnapshot;
        let pc = null, rapido = null, seguro = null, sesion = null, iceVistos = 0, cerrado = false;
        let estado = 'conectando', timerRespaldo = null, ultimaPosRespaldo = 0, posPendiente = null, timerPos = null;
        const vistosEv = new Set(), cola = [];
        const unsubs = [];

        const avisarEstado = (e) => { if (estado === e) return; estado = e; api.estado = e; try { cb.alEstado && cb.alEstado(e); } catch (err) { console.warn(err); } };
        const recibir = (raw) => {
            let m; try { m = typeof raw === 'string' ? JSON.parse(raw) : raw; } catch (e) { return; }
            if (!m || !m.t) return;
            if (m.id) { if (vistosEv.has(m.id)) return; vistosEv.add(m.id); }
            try { cb.alMensaje && cb.alMensaje(m.t, m.d); } catch (err) { console.warn('enlace-vivo:', err); }
        };

        // ---------- WebRTC ----------
        function nuevoPc() {
            if (pc) try { pc.close(); } catch (e) { /* nada */ }
            pc = new RTCPeerConnection({ iceServers: ICE });
            iceVistos = 0;
            pc.onicecandidate = (ev) => {
                if (!ev.candidate || !sesion) return;
                const c = ev.candidate.toJSON ? ev.candidate.toJSON() : { candidate: ev.candidate.candidate, sdpMid: ev.candidate.sdpMid, sdpMLineIndex: ev.candidate.sdpMLineIndex };
                const s = sesion;
                window.runTransaction(window.db, async (tx) => {
                    const snap = await tx.get(refSala);
                    const d = snap.exists() ? snap.data() : {};
                    if (d.sesion !== s) return;
                    const ice = { ...(d.ice || {}) };
                    ice[yo] = [...(ice[yo] || []), { candidate: c.candidate || '', sdpMid: c.sdpMid ?? null, sdpMLineIndex: c.sdpMLineIndex ?? null }];
                    tx.set(refSala, { ...d, ice });
                }).catch(() => {});
            };
            pc.onconnectionstatechange = () => {
                if (pc && (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') && estado === 'directo') pasarARespaldo();
            };
            const enganchar = (canal) => {
                canal.onmessage = (ev) => recibir(ev.data);
                canal.onopen = () => {
                    if (rapido && seguro && rapido.readyState === 'open' && seguro.readyState === 'open') {
                        clearTimeout(timerRespaldo);
                        avisarEstado('directo');
                        cola.splice(0).forEach(m => seguro.send(m));
                    }
                };
            };
            if (ofrezco) {
                rapido = pc.createDataChannel('rapido', { ordered: false, maxRetransmits: 0 });
                seguro = pc.createDataChannel('seguro', { ordered: true });
                enganchar(rapido); enganchar(seguro);
            } else {
                pc.ondatachannel = (ev) => {
                    if (ev.channel.label === 'rapido') rapido = ev.channel; else seguro = ev.channel;
                    enganchar(ev.channel);
                };
            }
        }
        async function agregarIce(lista) {
            for (; iceVistos < (lista || []).length; iceVistos++) {
                try { await pc.addIceCandidate(lista[iceVistos]); } catch (e) { /* candidato viejo */ }
            }
        }
        async function ofrecer() {
            sesion = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
            nuevoPc();
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            await window.setDoc(refSala, { sesion, offer: { type: offer.type, sdp: offer.sdp }, answer: null, ice: { nico: [], carito: [] }, ts: ahora() });
        }
        function escucharSala() {
            unsubs.push(onSnap(refSala, async (snap) => {
                if (cerrado) return;
                const d = snap.exists() ? snap.data() : null;
                if (!d) return;
                try {
                    if (ofrezco) {
                        // Carito pidió una oferta nueva (entró después o recargó).
                        if (d.pide && d.pide > (d.ts || 0) && estado !== 'directo') { await ofrecer(); return; }
                        if (d.sesion === sesion && d.answer && pc && !pc.currentRemoteDescription) await pc.setRemoteDescription(d.answer);
                        if (d.sesion === sesion && pc && pc.currentRemoteDescription) await agregarIce((d.ice || {})[otro]);
                    } else {
                        if (d.offer && d.sesion !== sesion && ahora() - (d.ts || 0) < 10 * 60000) {
                            sesion = d.sesion;
                            nuevoPc();
                            await pc.setRemoteDescription(d.offer);
                            const ans = await pc.createAnswer();
                            await pc.setLocalDescription(ans);
                            const s = sesion;
                            await window.runTransaction(window.db, async (tx) => {
                                const sn = await tx.get(refSala);
                                const dd = sn.exists() ? sn.data() : {};
                                if (dd.sesion !== s) return;
                                tx.set(refSala, { ...dd, answer: { type: ans.type, sdp: ans.sdp } });
                            });
                        }
                        if (d.sesion === sesion && pc && pc.currentRemoteDescription) await agregarIce((d.ice || {})[otro]);
                    }
                } catch (e) { console.warn('enlace-vivo señal:', e); }
            }, () => {}));
        }

        // ---------- Respaldo por Firestore ----------
        function pasarARespaldo() {
            if (cerrado || estado === 'respaldo') return;
            avisarEstado('respaldo');
            unsubs.push(onSnap(refPos(otro), (snap) => {
                if (!snap.exists()) return;
                const d = snap.data();
                if (d.pos) recibir({ t: 'pos', d: d.pos });
                (d.ev || []).forEach(m => recibir(m));
            }, () => {}));
            cola.splice(0).forEach(m => enviarRespaldoEvento(JSON.parse(m)));
        }
        function escribirPosRespaldo() {
            timerPos = null;
            if (!posPendiente || cerrado) return;
            const pos = posPendiente; posPendiente = null;
            ultimaPosRespaldo = Date.now();
            window.setDoc(refPos(yo), { pos }, { merge: true }).catch(() => {});
        }
        function enviarRespaldoEvento(m) {
            window.runTransaction(window.db, async (tx) => {
                const s = await tx.get(refPos(yo));
                const d = s.exists() ? s.data() : {};
                tx.set(refPos(yo), { ...d, ev: [...(d.ev || []), m].slice(-30) });
            }).catch(() => {});
        }

        const api = {
            estado,
            enviar(tipo, datos, confiable) {
                if (cerrado) return;
                const m = { t: tipo, d: datos };
                if (confiable) m.id = yo[0] + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
                if (estado === 'directo') {
                    const canal = confiable ? seguro : rapido;
                    if (canal && canal.readyState === 'open') { try { canal.send(JSON.stringify(m)); } catch (e) { /* lleno */ } }
                    return;
                }
                if (estado === 'respaldo') {
                    if (confiable) { enviarRespaldoEvento(m); return; }
                    posPendiente = datos;
                    if (!timerPos) timerPos = setTimeout(escribirPosRespaldo, Math.max(0, HZ_RESPALDO - (Date.now() - ultimaPosRespaldo)));
                    return;
                }
                if (confiable) cola.push(JSON.stringify(m)); // se manda apenas haya conexión
            },
            cerrar() {
                if (cerrado) return;
                cerrado = true;
                clearTimeout(timerRespaldo); clearTimeout(timerPos);
                unsubs.forEach(u => { try { u(); } catch (e) { /* nada */ } });
                try { pc && pc.close(); } catch (e) { /* nada */ }
                avisarEstado('cerrado');
            }
        };

        if (enCompu() || typeof RTCPeerConnection === 'undefined') {
            setTimeout(pasarARespaldo, 0);
            return api;
        }
        escucharSala();
        if (ofrezco) ofrecer().catch(e => { console.warn('enlace-vivo:', e); pasarARespaldo(); });
        else window.setDoc(refSala, { pide: ahora() + 1 }, { merge: true }).catch(() => {});
        timerRespaldo = setTimeout(pasarARespaldo, ESPERA_DIRECTO);
        return api;
    }

    window.EnlaceVivo = { conectar };
})();
