// ============================================================
// jugada-segura.js — candado para las jugadas de los juegos por turnos.
//
// Antes cada jugada hacía "leer el estado → chequear que sea mi turno
// → escribir", con la lectura afuera de una transacción. Si alguien
// tocaba dos veces rápido (o dos casillas seguidas), los dos toques
// leían el MISMO estado viejo (todavía "es tu turno"), pasaban los dos
// el chequeo y se escribían las dos jugadas: en el Ta-Te-Ti se podían
// poner dos marcas en un mismo turno y ganar con trampa. Lo mismo
// pasaba en Conecta 4, Damas, Ajedrez, UNO, Escoba, Chinchón, etc.
//
// Dos capas de protección:
//  1. Candado local: mientras una jugada de ese documento está en
//     curso en este dispositivo, cualquier otro toque se ignora.
//  2. Transacción: el estado se relee del servidor adentro de la
//     transacción y la jugada sólo se escribe si las reglas (turno,
//     casilla libre, etc.) se siguen cumpliendo con ese estado fresco.
//     Si el otro jugador escribió en el medio, Firestore reintenta
//     con el estado nuevo y el chequeo vuelve a correr.
// ============================================================

const _candadosJugada = new Set();

// Ejecuta fn() sólo si no hay otra acción en curso con la misma clave.
// Devuelve lo que devuelva fn(), o null si se ignoró el toque.
window.conCandado = async function (clave, fn) {
    if (_candadosJugada.has(clave)) return null;
    _candadosJugada.add(clave);
    try {
        return await fn();
    } finally {
        _candadosJugada.delete(clave);
    }
};

// calcular(estado) (puede ser async) recibe el estado RECIÉN LEÍDO del servidor y tiene
// que devolver el objeto de cambios a escribir (como en updateDoc), o
// null/undefined si la jugada no es válida con ese estado. Tiene que
// ser una función sin efectos secundarios (sin sonidos, sin tocar
// variables globales): Firestore puede llamarla más de una vez si hay
// un conflicto. Los sonidos/vibraciones van DESPUÉS, según el resultado.
//
// Devuelve { estado, cambios } si se escribió, o null si no.
window.jugadaSegura = function (ref, calcular) {
    return window.conCandado(ref.path, async () => {
        try {
            return await window.runTransaction(window.db, async (tx) => {
                const snap = await tx.get(ref);
                const estado = snap.exists() ? snap.data() : null;
                const cambios = await calcular(estado);
                if (!cambios) return null;
                tx.update(ref, cambios);
                return { estado, cambios };
            });
        } catch (e) {
            console.error('No se pudo guardar la jugada:', e);
            return null;
        }
    });
};
