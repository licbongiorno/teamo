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
    deleteField, collection, addDoc, query, where, orderBy
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

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

window.db = db;
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

// Todos los juegos y utilidades comparten la MISMA colección 'juegos'
// (cada documento se distingue por su id o por un campo 'tipo'), así
// evitamos tener que sumar una colección nueva a las Reglas de
// Firestore cada vez que agregamos un juego.
window._refJuegos = (idODoc) => doc(db, 'juegos', idODoc);

// Avisa al resto de los scripts (usuario.js espera esto) que Firebase
// ya está listo, por si algo necesita esperar explícitamente.
window._firebaseListo = true;
document.dispatchEvent(new Event('firebase-listo'));

console.log("🔥 Juegos conectados a Carolina");
