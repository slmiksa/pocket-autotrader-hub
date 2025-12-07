// Service Worker for Push Notifications
const CACHE_NAME = 'pocket-trader-v2';

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

// Push event - receives push notifications from server
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
      console.log('Push payload:', payload);
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
    requireInteraction: true, // Keep notification until user interacts
    tag: data.tag || 'price-alert-' + Date.now(),
    renotify: true, // Vibrate even if same tag
    data: data.data || {},
    actions: [
      { action: 'open', title: 'فتح التطبيق' },
      { action: 'close', title: 'إغلاق' }
    ],
    silent: false, // Allow sound
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

// Message from main app
self.addEventListener('message', (event) => {
  console.log('Service Worker received message:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  // Handle showing notification from app
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, body, data } = event.data;
    self.registration.showNotification(title, {
      body,
      icon: '/favicon.png',
      badge: '/favicon.png',
      vibrate: [400, 100, 400, 100, 600],
      requireInteraction: true,
      tag: 'app-notification-' + Date.now(),
      renotify: true,
      data: data || {},
      silent: false,
    });
  }
});

// Background sync for offline support
self.addEventListener('sync', (event) => {
  console.log('Background sync:', event.tag);
  
  if (event.tag === 'check-price-alerts') {
    event.waitUntil(checkPriceAlerts());
  }
});

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
  console.log('Periodic sync:', event.tag);
  
  if (event.tag === 'check-price-alerts') {
    event.waitUntil(checkPriceAlerts());
  }
});

// Check price alerts in background
async function checkPriceAlerts() {
  try {
    console.log('Checking price alerts in background...');
    // This would need the Supabase URL - for now just log
    // Background checks are handled by the main app when open
  } catch (error) {
    console.error('Error checking price alerts:', error);
  }
}

// Keep service worker alive for push notifications
self.addEventListener('fetch', (event) => {
  // Let all requests pass through - we don't cache
  event.respondWith(fetch(event.request));
});
