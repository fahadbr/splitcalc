/**
 * Service Worker for Running Split Calculator
 *
 * Caching Policy:
 * - Caches app shell assets only (HTML, CSS, JS, manifest, icons)
 * - Uses cache-first strategy for offline support
 * - No dynamic content caching (all data stored in localStorage)
 */

const CACHE_NAME = 'splitcalc-v1';
const APP_SHELL_ASSETS = [
  '/index.html',
  '/styles.css',
  '/app.js',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

/**
 * Install event - cache app shell assets
 */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(APP_SHELL_ASSETS);
      })
      .then(() => {
        return self.skipWaiting();
      })
  );
});

/**
 * Activate event - clean up old caches
 */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== CACHE_NAME)
            .map((cacheName) => caches.delete(cacheName))
        );
      })
      .then(() => {
        return self.clients.claim();
      })
  );
});

/**
 * Fetch event - serve from cache first, fall back to network
 */
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached response if found
        if (response) {
          return response;
        }

        // Otherwise fetch from network
        return fetch(event.request)
          .then((response) => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            // Optionally cache successful responses for app shell assets
            caches.open(CACHE_NAME)
              .then((cache) => {
                if (APP_SHELL_ASSETS.includes(new URL(event.request.url).pathname)) {
                  cache.put(event.request, responseToCache);
                }
              });

            return response;
          })
          .catch(() => {
            // Network failed, try to serve from cache anyway
            return caches.match(event.request);
          });
      })
  );
});
