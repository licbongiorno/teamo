// ============================================================
// firebase.js — conexión única a Firestore para todo "Nuestros Juegos".
// Es un <script type="module">, así que corre una sola vez y expone
// todo lo necesario en window.* para que el resto de los archivos
// (usuario.js, navegacion.js, js/juegos/*.js), que son scripts
// clásicos (no módulos) por simplicidad y compatibilidad entre ellos,
// puedan usar Firestore sin tener que repetir imports en cada uno.
// ============================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import {
    getFirestore, doc, setDoc, updateDoc, onSnapshot, serverTimestamp,
    deleteField, collection, addDoc, query, where, orderBy, limit
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyDDvrgXpSxaraqTj83ingY3xa-AT8ywxV4",
    authDomain: "carolina-634a1.firebaseapp.com",
    projectId: "carolina-634a1",
    storageBucket: "carolina-634a1.firebasestorage.app",
    messagingSenderId: "80980917854",
    appId: "1:80980917854:web:15a9f9a238ed2bd7c0becf",
    measurementId: "G-VDJ7B6SDW4"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

window.db = db;
window.auth = auth;
window.doc = doc;
window.setDoc = setDoc;
window.updateDoc = updateDoc;
window.onSnapshot = onSnapshot;
window.serverTimestamp = serverTimestamp;
window.deleteField = deleteField;
window.collection = collection;
window.addDoc = addDoc;
window.query = query;
window.where = where;
window.orderBy = orderBy;
window.limit = limit;

// Todos los juegos y utilidades comparten la MISMA colección 'juegos'
// (cada documento se distingue por su id o por un campo 'tipo'), así
// evitamos tener que sumar una colección nueva a las Reglas de
// Firestore cada vez que agregamos un juego.
window._refJuegos = (idODoc) => doc(db, 'juegos', idODoc);

// Paso 1 de seguridad: login anónimo automático. Por ahora las Reglas
// de Firestore siguen abiertas (if true), así que esto todavía no
// bloquea a nadie — es la base para, en un paso siguiente, exigir
// "request.auth != null" en las Reglas y cerrar la puerta a cualquiera
// que sólo tenga la URL.
//
// Ojo con el orden: 'firebase-listo' recién se dispara DESPUÉS de que
// el login anónimo confirma (onAuthStateChanged), no apenas arranca el
// módulo — así ningún juego intenta leer/escribir antes de estar
// autenticado.
onAuthStateChanged(auth, (user) => {
    if (!user) return; // todavía no logueó; el siguiente evento sí va a traer el user
    window._miUid = user.uid;
    window._firebaseListo = true;
    document.dispatchEvent(new Event('firebase-listo'));
    console.log("🔥 Juegos conectados a Carolina (sesión anónima " + user.uid.slice(0, 6) + "…)");
});

signInAnonymously(auth).catch((err) => {
    console.error('No se pudo iniciar la sesión anónima:', err);
});
