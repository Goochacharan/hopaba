// Service Worker for Push Notifications
const CACHE_NAME = 'hopaba-notifications-v1';

// Install event
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(self.clients.claim());
});

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('Push event received:', event);
  
  let notificationData = {
    title: 'New Message',
    body: 'You have received a new message',
    icon: '/lovable-uploads/92aaa562-a180-460d-9f71-3b12d541c349.png',
    badge: '/lovable-uploads/92aaa562-a180-460d-9f71-3b12d541c349.png',
    tag: 'message-notification',
    requireInteraction: true,
    actions: [
      {
        action: 'view',
        title: 'View Message',
        icon: '/lovable-uploads/92aaa562-a180-460d-9f71-3b12d541c349.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/lovable-uploads/92aaa562-a180-460d-9f71-3b12d541c349.png'
      }
    ]
  };

  // If push event has data, parse it
  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        ...notificationData,
        ...data
      };
    } catch (e) {
      console.error('Error parsing push data:', e);
    }
  }

  const promiseChain = self.registration.showNotification(
    notificationData.title,
    {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      requireInteraction: notificationData.requireInteraction,
      actions: notificationData.actions,
      data: notificationData.data || {}
    }
  );

  event.waitUntil(promiseChain);
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  // Default action or 'view' action
  const conversationId = event.notification.data?.conversationId;
  const urlToOpen = conversationId 
    ? `/messages/${conversationId}` 
    : '/messages';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window/tab open with the target URL
        for (const client of clientList) {
          if (client.url.includes(urlToOpen) && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Check if there's any window/tab open
        for (const client of clientList) {
          if ('focus' in client) {
            client.focus();
            return client.navigate(urlToOpen);
          }
        }
        
        // If no window/tab is open, open a new one
        if (self.clients.openWindow) {
          return self.clients.openWindow(urlToOpen);
        }
      })
  );
});

// Background sync for offline message sending (future enhancement)
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync-messages') {
    console.log('Background sync for messages');
    // Future: Handle offline message queue
  }
});

// Handle messages from the main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker received message:', event.data);
  
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, body, conversationId, senderName } = event.data;
    
    self.registration.showNotification(title, {
      body: body,
      icon: '/lovable-uploads/92aaa562-a180-460d-9f71-3b12d541c349.png',
      badge: '/lovable-uploads/92aaa562-a180-460d-9f71-3b12d541c349.png',
      tag: `message-${conversationId}`,
      requireInteraction: true,
      actions: [
        {
          action: 'view',
          title: 'View Message',
          icon: '/lovable-uploads/92aaa562-a180-460d-9f71-3b12d541c349.png'
        },
        {
          action: 'close',
          title: 'Close',
          icon: '/lovable-uploads/92aaa562-a180-460d-9f71-3b12d541c349.png'
        }
      ],
      data: {
        conversationId: conversationId,
        senderName: senderName
      }
    });
  }
}); 