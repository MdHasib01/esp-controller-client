import { deletePushSubscription, getPushPublicKey, savePushSubscription } from '@/api/push'
import type { PowerAlert } from '@/lib/types'

export type PushSupport =
  | 'supported'
  | 'unsupported' // no service worker / Push API (e.g. iOS Safari outside an installed home-screen app)
  | 'denied' // the user blocked notifications for this site

export function getPushSupport(): PushSupport {
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
    return 'unsupported'
  }
  return Notification.permission === 'denied' ? 'denied' : 'supported'
}

// The build id makes every deploy fetch a URL no CDN has cached yet;
// registering a new URL for the same scope replaces the old worker.
const SW_URL = `/sw.js?v=${import.meta.env.VITE_BUILD_ID}`

export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(SW_URL).catch((err) => {
      console.warn('[push] service worker registration failed', err)
    })
  })
}

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padded = (base64 + '='.repeat((4 - (base64.length % 4)) % 4))
    .replace(/-/g, '+')
    .replace(/_/g, '/')
  const raw = atob(padded)
  const bytes = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i)
  return bytes
}

// Always (re-)registers rather than reusing an existing registration, so a
// worker left over from an older deploy is swapped for this build's.
function getRegistration(): Promise<ServiceWorkerRegistration> {
  return navigator.serviceWorker.register(SW_URL)
}

export async function getCurrentSubscription(): Promise<PushSubscription | null> {
  if (getPushSupport() === 'unsupported') return null
  const registration = await navigator.serviceWorker.getRegistration('/')
  return (await registration?.pushManager.getSubscription()) ?? null
}

/** Asks for permission, subscribes this browser and registers it with the backend. */
export async function enablePush(): Promise<void> {
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') throw new Error('Notification permission was not granted')

  const { enabled, publicKey, missing } = await getPushPublicKey()
  if (!enabled || !publicKey) {
    const vars = missing?.length ? missing.join(', ') : 'VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY'
    throw new Error(`Server is missing ${vars} — add them to the backend env and restart it`)
  }

  let registration: ServiceWorkerRegistration
  try {
    registration = await getRegistration()
  } catch {
    // Usually the host answering /sw.js with index.html (SPA fallback),
    // which browsers refuse to register.
    throw new Error(
      "Service worker /sw.js isn't being served by the site — upload dist/sw.js and purge it from the CDN cache"
    )
  }
  await navigator.serviceWorker.ready
  const applicationServerKey = urlBase64ToUint8Array(publicKey)

  let subscription = await registration.pushManager.getSubscription()
  // A subscription made under a different server key can't receive our pushes.
  if (subscription && !sameKey(subscription.options.applicationServerKey, applicationServerKey)) {
    await subscription.unsubscribe()
    subscription = null
  }
  subscription ??= await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey })

  await savePushSubscription(subscription.toJSON())
}

function sameKey(a: ArrayBuffer | null, b: Uint8Array): boolean {
  if (!a || a.byteLength !== b.byteLength) return false
  const view = new Uint8Array(a)
  return view.every((byte, i) => byte === b[i])
}

/**
 * Re-registers this browser's existing subscription with the server. A
 * subscription can exist in the browser without the server knowing it (e.g.
 * the save request failed), which would show push as "on" while nothing is
 * ever delivered. Returns whether push is actually active.
 */
export async function syncPush(): Promise<boolean> {
  if (getPushSupport() !== 'supported' || Notification.permission !== 'granted') return false
  if (!(await getCurrentSubscription())) return false
  try {
    await enablePush()
    return true
  } catch {
    return false
  }
}

/**
 * Shows a native OS notification for an alert received over the dashboard
 * socket. Goes through the service worker so it uses the same title/text as
 * push (and replaces a duplicate push copy); falls back to the page-level
 * Notification API when no service worker is active.
 */
export async function showNativeAlert(alert: PowerAlert, fallback: { title: string; body: string }) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return
  const registration =
    'serviceWorker' in navigator ? await navigator.serviceWorker.getRegistration('/') : undefined
  if (registration?.active) {
    registration.active.postMessage({ type: 'show-power-alert', alert })
    return
  }
  new Notification(fallback.title, { body: fallback.body, icon: '/logo.png' })
}

export async function disablePush(): Promise<void> {
  const subscription = await getCurrentSubscription()
  if (!subscription) return
  await deletePushSubscription(subscription.endpoint).catch(() => {})
  await subscription.unsubscribe()
}
