const CACHE_NAME = "tareas-cache-v1";
const urlsToCache = [
  "/",
  "/index.html",
  "/main.js",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
  "/fallback.html",  // Asegúrate de tener esta página para mostrar en caso de fallos.
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

// Intercepción de peticiones para servir desde caché o red
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      if (response) {
        return response;  // Si el recurso está en caché, lo devuelve.
      }

      // Intentar obtener el recurso desde la red y almacenarlo en caché si es exitoso
      return fetch(event.request)
        .then(networkResponse => {
          // Solo cachear respuestas exitosas (status 200) y métodos GET
          if (networkResponse && networkResponse.status === 200 && event.request.method === 'GET') {
            return caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, networkResponse.clone());  // Almacena en caché
              return networkResponse;  // Devuelve la respuesta de la red
            });
          }
          return networkResponse;  // Si no es exitoso o no es GET, simplemente devuelve la respuesta de la red
        })
        .catch(err => {
          console.error('Fetch fallido, recurso no disponible:', err);
          // Devuelve el fallback si no se encuentra el recurso en caché ni en la red
          return caches.match('/fallback.html');
        });
    })
  );
});
