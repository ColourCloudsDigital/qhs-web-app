// Service Worker for Qaras Hotels
const CACHE_NAME = 'qaras-hotels-v1';
const OFFLINE_URL = '/offline.html';
const STATIC_ASSETS = [
  '/',
  '/offline.html',
  '/assets/icons/offline.png',
  '/assets/icons/online.png',
  '/assets/icons/download.png',
  '/assets/icons/notification.png',
  '/assets/images/logo-dark.svg',
  '/assets/images/logo-light.svg',
];

// Store sync queue in IndexedDB
const DB_NAME = 'qaras-hotels-offline-queue';
const STORE_NAME = 'sync-queue';

// Open IndexedDB
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    
    request.onerror = event => {
      console.error('IndexedDB error:', event.target.error);
      reject(event.target.error);
    };
    
    request.onsuccess = event => {
      resolve(event.target.result);
    };
    
    request.onupgradeneeded = event => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

// Add item to sync queue
async function addToSyncQueue(item) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.add({
      ...item,
      timestamp: Date.now()
    });
    
    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
}

// Process items from sync queue
async function processQueue() {
  const db = await openDB();
  const transaction = db.transaction(STORE_NAME, 'readwrite');
  const store = transaction.objectStore(STORE_NAME);
  const request = store.getAll();
  
  request.onsuccess = async () => {
    const items = request.result;
    if (!items || items.length === 0) return;
    
    for (const item of items) {
      try {
        const response = await fetch(item.url, {
          method: item.method,
          headers: item.headers,
          body: item.body,
        });
        
        if (response.ok) {
          // If successful, remove from queue
          store.delete(item.id);
        }
      } catch (error) {
        console.error('Failed to sync item:', error);
      }
    }
  };
}

// Install the service worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Opened cache');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  
  // Skip waiting to activate the new service worker immediately
  self.skipWaiting();
});

// Activate the service worker
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            // Delete old caches
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // Claim all clients to ensure the new service worker takes effect immediately
  self.clients.claim();
});

// Fetch events - handle offline requests
self.addEventListener('fetch', event => {
  // Clone the request to use it multiple times
  const request = event.request.clone();
  const url = new URL(request.url);
  
  // Only handle GET requests or requests to our own origin
  if (request.method !== 'GET' || url.origin !== self.location.origin) {
    // For API calls that failed, store them for later sync
    if (request.method !== 'GET' && !navigator.onLine) {
      event.respondWith(
        (async () => {
          try {
            // Clone the request to save it to the queue
            const requestToCache = request.clone();
            
            // Create a serializable version of the request
            const serializedRequest = {
              url: requestToCache.url,
              method: requestToCache.method,
              headers: Array.from(requestToCache.headers.entries()),
              body: await requestToCache.text(),
            };
            
            // Add to sync queue
            await addToSyncQueue(serializedRequest);
            
            // Return a response indicating the request was queued
            return new Response(JSON.stringify({ 
              message: 'Request queued for sync when online',
              success: true,
              offlineQueued: true,
            }), {
              headers: { 'Content-Type': 'application/json' }
            });
          } catch (error) {
            console.error('Error queuing request:', error);
            // Return a generic error response
            return new Response(JSON.stringify({ 
              error: 'Failed to process offline request',
              success: false 
            }), {
              status: 503,
              headers: { 'Content-Type': 'application/json' }
            });
          }
        })()
      );
      return;
    }
    
    // Skip non-GET requests or requests to other origins
    return;
  }
  
  // For GET requests, try to serve from cache first, then network, then offline page
  event.respondWith(
    caches.match(request).then(cachedResponse => {
      if (cachedResponse) {
        // Return cached response
        return cachedResponse;
      }
      
      // Try fetching from network
      return fetch(request).then(response => {
        // Don't cache if response is not valid
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        
        // Clone the response
        const responseToCache = response.clone();
        
        // Add to cache
        caches.open(CACHE_NAME).then(cache => {
          cache.put(request, responseToCache);
        });
        
        return response;
      }).catch(() => {
        // Network failed, serve offline page for HTML requests
        if (request.headers.get('accept').includes('text/html')) {
          return caches.match(OFFLINE_URL);
        }
        
        // For other resources, just return an error
        return new Response('Network error', { status: 503 });
      });
    })
  );
});

// Background sync
self.addEventListener('sync', event => {
  if (event.tag === 'sync-queue') {
    event.waitUntil(processQueue());
  }
});

// Listen for push notifications
self.addEventListener('push', event => {
  const data = event.data.json();
  
  const options = {
    body: data.body,
    icon: data.icon || '/assets/icons/notification.png',
    badge: '/assets/icons/notification.png',
    data: {
      url: data.url || '/'
    }
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(clientList => {
      // Check if there's already a window to navigate to
      for (const client of clientList) {
        if (client.url === event.notification.data.url && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Otherwise, open a new window
      if (clients.openWindow) {
        return clients.openWindow(event.notification.data.url);
      }
    })
  );
});