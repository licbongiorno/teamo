        import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
        import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, memoryLocalCache, enableNetwork, disableNetwork, collection, addDoc, onSnapshot, query, where, orderBy, limit, serverTimestamp, doc, updateDoc, deleteDoc, setDoc, runTransaction, increment, arrayUnion, arrayRemove, deleteField } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
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
        // Persistencia offline: si la señal en la clínica es débil o nula, la app sigue
        // mostrando la última fecha/mensaje que se sincronizó, sin pantalla en blanco.
        // Antes se usaba enableIndexedDbPersistence (obsoleto): con la página abierta
        // en dos pestañas, la segunda quedaba sin caché y a veces sin sincronizar.
        // persistentMultipleTabManager comparte la caché entre pestañas.
        // experimentalAutoDetectLongPolling: en redes móviles que "retienen" la
        // conexión, los cambios del otro llegaban tarde o recién al actualizar.
        let db;
        try {
            db = initializeFirestore(app, {
                experimentalAutoDetectLongPolling: true,
                localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
            });
        } catch (err) {
            console.warn('No se pudo activar la persistencia offline de Firestore:', err);
            db = initializeFirestore(app, { experimentalAutoDetectLongPolling: true, localCache: memoryLocalCache() });
        }
        const auth = getAuth(app);

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
        window.deleteField = deleteField;

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

        // ==================== RECONEXIÓN AL VOLVER A LA APP ====================
        // Igual que en js/firebase.js (juegos.html): al bloquear la pantalla o dejar
        // la app en segundo plano, el navegador corta la conexión y al volver
        // Firestore puede tardar decenas de segundos en reconectar. Mientras tanto
        // no llegaban los mensajes del otro y parecía que había que actualizar.
        let _ultimaReconexion = 0;
        async function reconectarFirestore(){
            const ahora = Date.now();
            if (ahora - _ultimaReconexion < 3000) return;
            _ultimaReconexion = ahora;
            try { await disableNetwork(db); await enableNetwork(db); }
            catch (e) { console.warn('No se pudo reconectar Firestore:', e); }
        }
        let _ocultaDesde = 0;
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') { _ocultaDesde = Date.now(); return; }
            if (_ocultaDesde && Date.now() - _ocultaDesde > 5000) reconectarFirestore();
        });
        window.addEventListener('online', reconectarFirestore);
        window.addEventListener('pageshow', (e) => { if (e.persisted) reconectarFirestore(); });
        window.reconectarFirestore = reconectarFirestore;
