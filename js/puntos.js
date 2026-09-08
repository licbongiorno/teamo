// ============================================================
// puntos.js — puntaje acumulado entre Nico y Carito, compartido
// entre todos los juegos que quieran sumar (ganar una partida,
// completar una reflexión, cuidar la mascota, etc.). Vive en el
// mismo documento 'juegos/puntos-globales' (misma colección
// 'juegos' de siempre, así no hace falta tocar las Reglas de
// Firestore de nuevo).
// ============================================================

function refPuntos(){ return window.doc(window.db, 'juegos', 'puntos-globales'); }

// Suma 'cantidad' puntos a 'jugador' ('nico'|'carito'). Uso típico:
//   await sumarPuntos(miIdentidad, 3);
async function sumarPuntos(jugador, cantidad){
    if (!jugador || !cantidad) return;
    try {
        const snap = await new Promise((res, rej) => {
            const u = window.onSnapshot(refPuntos(), s => { u(); res(s); }, e => { u(); rej(e); });
        });
        const actual = snap.exists() ? (snap.data()[jugador] || 0) : 0;
        await window.setDoc(refPuntos(), { [jugador]: actual + cantidad }, { merge: true });
    } catch (e) {
        console.warn('No se pudo sumar puntos:', e);
    }
}

// Se suscribe a los puntos en vivo. callback recibe {nico, carito}.
// Devuelve la función para des-suscribirse.
function escucharPuntos(callback){
    return window.onSnapshot(refPuntos(), (snap) => {
        callback(snap.exists() ? { nico: snap.data().nico || 0, carito: snap.data().carito || 0 } : { nico: 0, carito: 0 });
    }, (err) => console.warn('No se pudieron leer los puntos:', err));
}

window.sumarPuntos = sumarPuntos;
window.escucharPuntos = escucharPuntos;
