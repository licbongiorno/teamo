// ============================================================
// sw.js — service worker para poder instalar el sitio como app y que
// abra algo (aunque sea la cáscara) sin conexión. A propósito NO cachea
// nada de Firebase/Firestore ni de YouTube: eso lo maneja el SDK de
// Firebase y siempre tiene que pedirse en vivo, sea o no la
// primera visita.
//
// Estrategia:
//  - "app shell" (páginas y estilos base): se precachean en la
//    instalación para que el sitio abra sin conexión.
//  - resto de archivos propios del sitio (los ~58 juegos, imágenes,
//    etc.): "stale-while-revalidate" — se sirven del caché al toque
//    si ya se visitaron, y de fondo se actualiza el caché para la
//    próxima vez, sin tener que listar acá cada archivo nuevo.
//  - todo lo que no sea del mismo origen (Firebase, YouTube, fonts de
//    Google) se ignora: pasa directo a la red, tal como si no hubiera
//    service worker.
// ============================================================
const VERSION = 'refugio-v1';
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
        caches.match(request).then((cacheado) => {
            const enRed = fetch(request).then((respuesta) => {
                if (respuesta && respuesta.ok) {
                    const copia = respuesta.clone();
                    caches.open(CACHE_RUNTIME).then((cache) => cache.put(request, copia));
                }
                return respuesta;
            }).catch(() => cacheado); // sin conexión: lo que haya en caché

            return cacheado || enRed;
        })
    );
});
