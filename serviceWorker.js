const CACHE_NAME = 'van-dashboard-v1'
const urlsToCache = [
  '/VanIOT/',
  '/VanIOT/index.html',
  '/VanIOT/src/main.jsx',
]

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache).catch(() => {
        // Silently fail if some URLs can't be cached (e.g., dynamic assets)
        console.log('Some cache URLs were not available')
      })
    })
  )
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  self.clients.claim()
})

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests and chrome extensions
  if (!event.request.url.startsWith('http')) {
    return
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Don't cache non-successful responses
        if (!response || response.status !== 200 || response.type === 'error') {
          return response
        }

        // Clone the response
        const responseToCache = response.clone()

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache)
        })

        return response
      })
      .catch(() => {
        // Network request failed, try cache
        return caches.match(event.request).then((response) => {
          if (response) {
            return response
          }

          // Return a custom offline page if needed
          if (event.request.destination === 'document') {
            return caches.match('/VanIOT/index.html')
          }
        })
      })
  )
})
