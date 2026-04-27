/* Service Worker PWA - TuBarber */
const CACHE_NAME = 'tubarber-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(Promise.resolve());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name)))
    )
  );
  self.clients.claim();
});

self.addEventListener('push', (event) => {
  if (!event.data) return;
  let data = { title: '', body: '', url: '/' };
  try {
    data = event.data.json();
  } catch (_) {}
  event.waitUntil(
    self.registration.showNotification(data.title || 'Nueva reserva', {
      body: data.body || 'Toca para abrir tu agenda',
      icon: '/icon-512.png',
      badge: '/icon-512.png',
      tag: 'tubarber-reserva',
      data: { url: data.url || '/acceso' },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/acceso';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Buscar una ventana del mismo origen para enfocarla y navegar.
      for (const c of clientList) {
        if (c.url.startsWith(self.location.origin)) {
          c.focus();
          if (c.navigate) return c.navigate(url);
          return;
        }
      }
      // Si no hay ventana abierta, abrir una nueva.
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    })
  );
});
