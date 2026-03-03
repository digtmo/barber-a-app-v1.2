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
      if (clientList.length) {
        const c = clientList[0];
        if (c.navigate) c.navigate(url);
        c.focus();
      } else if (self.clients.openWindow) {
        self.clients.openWindow(url);
      }
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});
