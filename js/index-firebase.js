        import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
        import { getFirestore, collection, addDoc, onSnapshot, query, where, orderBy, limit, serverTimestamp, doc, updateDoc, deleteDoc, setDoc, enableIndexedDbPersistence, runTransaction, increment, arrayUnion, arrayRemove } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
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

        // Persistencia offline: si la señal en la clínica es débil o nula, la app sigue
        // mostrando la última fecha/mensaje que se sincronizó, sin pantalla en blanco.
        enableIndexedDbPersistence(db).catch((err) => {
            console.warn('No se pudo activar la persistencia offline de Firestore:', err.code);
        });

        window.db = db;
        window.auth = auth;
        window.collection = collection;
        window.addDoc = addDoc;
        window.onSnapshot = onSnapshot;
        window.query = query;
        window.where = where;
        window.orderBy = orderBy;
        window.limit = limit;
        window.serverTimestamp = serverTimestamp;
        window.doc = doc;
        window.updateDoc = updateDoc;
        window.deleteDoc = deleteDoc;
        window.setDoc = setDoc;
        window.runTransaction = runTransaction;
        window.increment = increment;
        window.arrayUnion = arrayUnion;
        window.arrayRemove = arrayRemove;

        // Paso 1 de seguridad: login anónimo automático (ver misma explicación
        // en js/firebase.js, el que usa juegos.html). Acá el script clásico de
        // abajo no tenía ningún "esperá a que esté listo" — lo agregamos ahora
        // para que nada intente usar window.db antes de estar autenticado.
        window._firebaseListoIndex = false;
        onAuthStateChanged(auth, (user) => {
            if (!user) return;
            window._miUid = user.uid;
            window._firebaseListoIndex = true;
            document.dispatchEvent(new Event('firebase-listo-index'));
            console.log("🔥 Conectado con éxito a Carolina (sesión anónima " + user.uid.slice(0, 6) + "…)");
        });

        signInAnonymously(auth).catch((err) => {
            console.error('No se pudo iniciar la sesión anónima:', err);
        });
