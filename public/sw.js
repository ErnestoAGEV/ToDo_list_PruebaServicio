const CACHE_NAME = "tareas-cache-v1";
const urlsToCache = [
  "/",
  "/index.html",
  "/main.js",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
  "https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css",
  "https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.min.js",
  "https://cdn.jsdelivr.net/npm/@popperjs/core@2.11.6/dist/umd/popper.min.js"
];

// Instalación del Service Worker y almacenamiento en caché
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log("Archivos cacheados correctamente");
      return cache.addAll(urlsToCache);
    }).catch(error => {
      console.error("Error al cachear archivos:", error);
    })
  );
});

// Activación del Service Worker y eliminación de cachés antiguas
self.addEventListener("activate", event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (!cacheWhitelist.includes(cacheName)) {
            console.log("Eliminando caché antigua:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      if (response) {
        return response;
      }
      
      // Intentar obtener desde la red, pero manejar errores
      return fetch(event.request)
        .then(networkResponse => {
          if (networkResponse && networkResponse.status === 200 && event.request.method === 'GET') {
            return caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, networkResponse.clone());
              return networkResponse;
            });
          }
          return networkResponse;  // Devuelve la respuesta de red
        })
        .catch(err => {
          console.error('Fetch fallido, recurso no disponible:', err);
          // Podrías retornar un recurso predeterminado si el fetch falla
          return caches.match('/fallback.html');  // Por ejemplo, una página de error o un fallback
        });
    })
  );
});

