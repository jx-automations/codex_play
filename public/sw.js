// OutreachFlow Service Worker
// Caches static assets (cache-first), passes everything else to network.
// Also handles push notification display for follow-up reminders.

const CACHE_NAME = "outreachflow-v1";

// Static assets to precache on install
const PRECACHE_URLS = ["/", "/today", "/offline.html"];

// ── Install ──────────────────────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

// ── Activate ─────────────────────────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ── Fetch ─────────────────────────────────────────────────────────────────────
// Strategy:
//   • Firestore / googleapis / identitytoolkit → network-only (never cache)
//   • _next/static and other immutable assets → cache-first
//   • Navigation requests → network-first, fall back to cached "/" or offline page
//   • Everything else → network-first
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and cross-origin requests we shouldn't intercept
  if (request.method !== "GET") return;
  if (
    url.hostname.includes("firestore.googleapis.com") ||
    url.hostname.includes("identitytoolkit.googleapis.com") ||
    url.hostname.includes("securetoken.googleapis.com") ||
    url.hostname.includes("firebase")
  ) {
    return; // let Firebase SDK handle its own requests
  }

  // Cache-first for immutable _next/static assets
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((c) => c.put(request, clone));
            }
            return response;
          })
      )
    );
    return;
  }

  // Network-first for everything else (HTML pages, API routes)
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok && request.destination === "document") {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((c) => c.put(request, clone));
        }
        return response;
      })
      .catch(() =>
        caches.match(request).then(
          (cached) =>
            cached ||
            caches.match("/offline.html") ||
            new Response("Offline — open OutreachFlow when back online.", {
              headers: { "Content-Type": "text/plain" },
            })
        )
      )
  );
});

// ── Push Notifications ────────────────────────────────────────────────────────
self.addEventListener("push", (event) => {
  if (!event.data) return;
  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: "OutreachFlow", body: event.data.text() };
  }

  const options = {
    body: data.body || "You have follow-ups due today.",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    vibrate: [100, 50, 100],
    data: { url: data.url || "/app/today" },
    actions: [
      { action: "open", title: "View today" },
      { action: "dismiss", title: "Dismiss" },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || "OutreachFlow", options)
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  if (event.action === "dismiss") return;

  const targetUrl = event.notification.data?.url || "/app/today";
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        for (const client of windowClients) {
          if ("focus" in client) {
            client.navigate(targetUrl);
            return client.focus();
          }
        }
        return clients.openWindow(targetUrl);
      })
  );
});
