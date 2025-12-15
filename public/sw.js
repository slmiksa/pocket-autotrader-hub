// Service Worker for Push Notifications
const CACHE_NAME = 'pocket-trader-v3';

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

// Get notification URL based on type
function getNotificationUrl(data) {
  if (!data) return '/';
  
  switch (data.type) {
    case 'economic_event':
      return '/economic-calendar';
    case 'market_open':
    case 'market_close':
      return '/markets';
    case 'price_alert':
      return '/markets';
    case 'professional_signal':
      return '/professional-signals';
    default:
      return data.url || '/';
  }
}

// Push event - receives push notifications from server
self.addEventListener('push', (event) => {
  console.log('Push notification received:', event);

  let data = {
    title: '🔔 إشعار جديد',
    body: 'لديك إشعار جديد',
    icon: '/favicon.png',
    badge: '/favicon.png',
    requireInteraction: true,
    vibrate: [400, 100, 400, 100, 600],
  };

  let hasPayload = false;
  
  try {
    if (event.data) {
      const textData = event.data.text();
      if (textData && textData.length > 0) {
        try {
          const payload = JSON.parse(textData);
          data = { ...data, ...payload };
          hasPayload = true;
          console.log('Push payload:', payload);
        } catch (e) {
          data.body = textData;
          hasPayload = true;
        }
      }
    }
  } catch (e) {
    console.log('Error parsing push data:', e);
  }

  // If no payload (tickle push), show a generic notification
  if (!hasPayload) {
    console.log('Tickle push received - showing generic notification');
    data.title = '🔔 لديك إشعار جديد';
    data.body = 'افتح التطبيق لعرض التفاصيل';
  }

  // Set appropriate icon based on notification type
  let icon = '/favicon.png';
  let tag = 'notification-' + Date.now();
  
  if (data.data?.type === 'economic_event') {
    tag = 'economic-' + (data.data.eventId || Date.now());
  } else if (data.data?.type === 'market_open') {
    tag = 'market-open-' + (data.data.marketId || Date.now());
  } else if (data.data?.type === 'market_close') {
    tag = 'market-close-' + (data.data.marketId || Date.now());
  } else if (data.data?.type === 'price_alert') {
    tag = 'price-alert-' + Date.now();
  } else if (data.data?.type === 'professional_signal') {
    tag = 'signal-' + Date.now();
  } else if (data.data?.type === 'admin_broadcast') {
    tag = 'admin-' + Date.now();
  }

  const options = {
    body: data.body,
    icon: data.icon || icon,
    badge: data.badge || '/favicon.png',
    vibrate: data.vibrate || [400, 100, 400, 100, 600],
    requireInteraction: true,
    tag: data.tag || tag,
    renotify: true,
    data: data.data || {},
    actions: [
      { action: 'open', title: 'فتح التطبيق' },
      { action: 'close', title: 'إغلاق' }
    ],
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

  // Get URL based on notification type
  const urlToOpen = getNotificationUrl(data);

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
  } catch (error) {
    console.error('Error checking price alerts:', error);
  }
}

// Keep service worker alive for push notifications
self.addEventListener('fetch', (event) => {
  // Let all requests pass through - we don't cache
  event.respondWith(fetch(event.request));
});
