// Service Worker for Push Notifications
const CACHE_NAME = 'pocket-trader-v1';

// Install event
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(clients.claim());
});

// Push event - receives push notifications
self.addEventListener('push', (event) => {
  console.log('Push notification received:', event);

  let data = {
    title: '🔔 تنبيه سعري',
    body: 'لديك تنبيه جديد',
    icon: '/favicon.png',
    badge: '/favicon.png',
    requireInteraction: true,
    vibrate: [400, 100, 400, 100, 600],
  };

  try {
    if (event.data) {
      const payload = event.data.json();
      data = { ...data, ...payload };
    }
  } catch (e) {
    console.log('Error parsing push data:', e);
    if (event.data) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/favicon.png',
    badge: data.badge || '/favicon.png',
    vibrate: data.vibrate || [400, 100, 400, 100, 600],
    requireInteraction: data.requireInteraction !== false,
    tag: data.tag || 'price-alert',
    renotify: true,
    data: data.data || {},
    actions: [
      { action: 'open', title: 'فتح التطبيق' },
      { action: 'close', title: 'إغلاق' }
    ],
    // Play sound
    silent: false,
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  event.notification.close();

  const action = event.action;
  const data = event.notification.data;

  if (action === 'close') {
    return;
  }

  // Open or focus the app
  const urlToOpen = data?.url || '/markets';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          if (urlToOpen) {
            client.navigate(urlToOpen);
          }
          return;
        }
      }
      // Open new window if none found
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Notification close event
self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event);
});

// Background sync for offline support
self.addEventListener('sync', (event) => {
  console.log('Background sync:', event.tag);
});

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'check-price-alerts') {
    console.log('Periodic sync: checking price alerts');
    event.waitUntil(checkPriceAlerts());
  }
});

async function checkPriceAlerts() {
  try {
    const response = await fetch('/api/check-alerts');
    const data = await response.json();
    console.log('Price alerts checked:', data);
  } catch (error) {
    console.error('Error checking price alerts:', error);
  }
}
