// ============================================================
// sw.js — service worker para poder instalar el sitio como app y que
// abra algo (aunque sea la cáscara) sin conexión. A propósito NO cachea
// nada de Firebase/Firestore ni de YouTube: eso lo maneja el SDK de
// Firebase y siempre tiene que pedirse en vivo, sea o no la
// primera visita.
//
// Estrategia: "red primero, caché como respaldo" para todo lo propio
// del sitio. Antes esto era "stale-while-revalidate" (servía lo
// cacheado al toque y actualizaba el caché recién para la PRÓXIMA
// visita) — con eso, quien tenía la app instalada podía quedarse
// viendo una versión vieja del sitio indefinidamente (faltaban
// funciones nuevas, o quedaban bugs ya arreglados) porque cada visita
// mostraba lo que se había guardado la visita ANTERIOR, nunca lo más
// nuevo. Ahora se pide la red primero siempre que haya conexión, y
// sólo se usa lo cacheado si falla (sin conexión). Esto sacrifica algo
// de velocidad/ahorro de datos a cambio de que las actualizaciones
// lleguen siempre, que para una app de dos personas pesa mucho más.
const VERSION = 'refugio-v2';
const CACHE_SHELL = VERSION + '-shell';
const CACHE_RUNTIME = VERSION + '-runtime';

const APP_SHELL = [
    './index.html',
    './juegos.html',
    './manifest.json',
    './css/global.css',
    './css/juegos.css',
    './css/mobile.css',
    './css/auth-gate.css',
    './js/auth-gate.js',
    './icons/icon-192.png',
    './icons/icon-512.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_SHELL)
            .then((cache) => cache.addAll(APP_SHELL))
            .catch(() => {}) // si algo del shell falla (offline en la primera instalación), no rompe el resto
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((nombres) => Promise.all(
            nombres
                .filter((nombre) => nombre !== CACHE_SHELL && nombre !== CACHE_RUNTIME)
                .map((nombre) => caches.delete(nombre))
        ))
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    const request = event.request;
    if (request.method !== 'GET') return;

    const url = new URL(request.url);
    if (url.origin !== self.location.origin) return; // Firebase, YouTube, fonts, etc. van directo a la red

    event.respondWith(
        fetch(request).then((respuesta) => {
            if (respuesta && respuesta.ok) {
                const copia = respuesta.clone();
                caches.open(CACHE_RUNTIME).then((cache) => cache.put(request, copia));
            }
            return respuesta;
        }).catch(() => caches.match(request)) // sin conexión: lo último que se haya guardado
    );
});
