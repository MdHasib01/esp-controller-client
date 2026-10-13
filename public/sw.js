// Service worker: shows power cut / power back push notifications even when
// the dashboard isn't open. Payloads come from backend/src/services/pushService.js
// with raw ISO times, formatted here in the viewer's locale and time zone.

const timeFmt = new Intl.DateTimeFormat(undefined, {
  hour: 'numeric',
  minute: '2-digit',
  second: '2-digit',
})
const dateFmt = new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric' })

function formatAt(iso) {
  const date = new Date(iso)
  return `${timeFmt.format(date)} · ${dateFmt.format(date)}`
}

function formatDuration(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const parts = []
  if (hours) parts.push(`${hours}h`)
  if (minutes) parts.push(`${minutes}m`)
  if (!hours && seconds) parts.push(`${seconds}s`)
  return parts.length ? parts.join(' ') : '0s'
}

function buildNotification(alert) {
  const name = alert.device?.name ?? 'ESP32'
  switch (alert.kind) {
    case 'cut':
      return {
        title: '⚡ Power cut',
        body: `${name} lost power at ${formatAt(alert.at)}`,
        tag: `power-cut-${alert.at}`,
        vibrate: [400, 150, 400, 150, 400],
        requireInteraction: true,
      }
    case 'restored':
      return {
        title: '✅ Power is back',
        body: `${name} came back at ${formatAt(alert.at)}\nWas off for ${formatDuration(alert.durationMs)}`,
        tag: `power-back-${alert.at}`,
        vibrate: [150, 80, 150],
        requireInteraction: false,
      }
    default:
      return {
        title: '🔔 Test notification',
        body: `Notifications are working · ${formatAt(alert.at ?? new Date().toISOString())}`,
        tag: 'power-test',
        vibrate: [150],
        requireInteraction: false,
      }
  }
}

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))

// Each alert has a unique tag, so when the same alert arrives both by push
// and from an open dashboard tab, the second one replaces the first instead
// of showing twice.
function showAlert(alert) {
  const built = buildNotification(alert)
  const { title, ...rest } = alert.test && alert.kind ? { ...built, title: `${built.title} (test)` } : built
  return self.registration.showNotification(title, {
    ...rest,
    icon: '/logo.png',
    badge: '/favicon.svg',
    silent: false,
    timestamp: alert.at ? new Date(alert.at).getTime() : Date.now(),
    data: { url: '/' },
  })
}

self.addEventListener('push', (event) => {
  let alert = {}
  try {
    alert = event.data ? event.data.json() : {}
  } catch {
    // fall through to the generic notification
  }
  event.waitUntil(showAlert(alert))
})

// An open dashboard forwards alerts it receives over its live socket, so a
// native notification appears even on browsers where push isn't set up.
self.addEventListener('message', (event) => {
  if (event.data?.type === 'show-power-alert') event.waitUntil(showAlert(event.data.alert))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = new URL(event.notification.data?.url ?? '/', self.location.origin).href
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((c) => c.url.startsWith(self.location.origin))
      if (existing) return existing.focus()
      return self.clients.openWindow(url)
    })
  )
})
