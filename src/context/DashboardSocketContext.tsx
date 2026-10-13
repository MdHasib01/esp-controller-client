import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { useQueryClient, type QueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { WS_BASE_URL, getFreshAccessToken } from '@/api/client'
import { useAuth } from '@/context/AuthContext'
import { playAlertSound } from '@/lib/alertSound'
import { formatDuration } from '@/lib/format'
import { showNativeAlert } from '@/lib/pushNotifications'
import type { DashboardSocketMessage, Device, LiveStatus, PowerAlert } from '@/lib/types'

export type SocketStatus = 'connecting' | 'open' | 'closed'

const SocketStatusContext = createContext<SocketStatus>('closed')

export function useDashboardSocketStatus(): SocketStatus {
  return useContext(SocketStatusContext)
}

// The server pings every 15s; this much silence means the socket is dead
// even if the browser still calls it open.
const SILENCE_TIMEOUT_MS = 40_000
// On returning to the tab, a socket this quiet is assumed to have died in
// the background (mobile browsers freeze them without closing).
const STALE_ON_RESUME_MS = 20_000

function handleMessage(msg: DashboardSocketMessage, queryClient: QueryClient) {
  switch (msg.type) {
    case 'live_status':
      queryClient.setQueryData<LiveStatus>(['device-live', msg.deviceId], {
        current: msg.current,
        serverNow: msg.serverNow,
        receivedAt: Date.now(),
      })
      break
    case 'device_status':
      queryClient.setQueryData(['device', msg.device.id], msg.device)
      queryClient.setQueryData<Device[]>(['devices'], (old) =>
        old?.some((d) => d.id === msg.device.id)
          ? old.map((d) => (d.id === msg.device.id ? msg.device : d))
          : old
      )
      break
    case 'power_event':
      queryClient.invalidateQueries({ queryKey: ['device-events', msg.event.device] })
      queryClient.invalidateQueries({ queryKey: ['device-stats', msg.event.device] })
      // An outage opening/closing changes how the live gap is labelled.
      queryClient.invalidateQueries({ queryKey: ['device-timeline', msg.event.device] })
      break
    case 'connection_event':
      queryClient.invalidateQueries({ queryKey: ['device-connections', msg.connection.device] })
      queryClient.invalidateQueries({ queryKey: ['device-timeline', msg.connection.device] })
      queryClient.invalidateQueries({ queryKey: ['device-stats', msg.connection.device] })
      break
    case 'wake_ack':
      toast(msg.success ? 'PC wake command acknowledged by ESP32' : 'ESP32 failed to send the wake signal')
      break
    case 'power_alert':
      showPowerAlert(msg.alert)
      break
  }
}

const alertTimeFmt = new Intl.DateTimeFormat(undefined, {
  hour: 'numeric',
  minute: '2-digit',
  second: '2-digit',
})

function showPowerAlert(alert: PowerAlert) {
  playAlertSound(alert.kind)
  const time = alertTimeFmt.format(new Date(alert.at))
  const suffix = alert.test ? ' (test)' : ''
  const message =
    alert.kind === 'cut'
      ? { title: `⚡ Power cut${suffix}`, body: `${alert.device.name} lost power at ${time}` }
      : {
          title: `✅ Power is back${suffix}`,
          body: `${alert.device.name} came back at ${time} · was off for ${formatDuration(alert.durationMs)}`,
        }

  if (alert.kind === 'cut') toast.error(message.title, { description: message.body, duration: 15_000 })
  else toast.success(message.title, { description: message.body, duration: 10_000 })

  void showNativeAlert(alert, message)
}

export function DashboardSocketProvider({ children }: { children: ReactNode }) {
  const { status: authStatus } = useAuth()
  const queryClient = useQueryClient()
  const [socketStatus, setSocketStatus] = useState<SocketStatus>('closed')
  const attemptRef = useRef(0)

  useEffect(() => {
    if (authStatus !== 'authenticated') return

    let ws: WebSocket | null = null
    let connecting = false
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined
    let silenceTimer: ReturnType<typeof setTimeout> | undefined
    let cancelled = false
    let hasOpened = false
    let forceTokenRefresh = false
    let lastMessageAt = 0

    function markAlive() {
      lastMessageAt = Date.now()
      clearTimeout(silenceTimer)
      silenceTimer = setTimeout(() => dropSocket(), SILENCE_TIMEOUT_MS)
    }

    // Detaches first: a dead socket's close event can take ages to arrive.
    function dropSocket(closeCode?: number) {
      clearTimeout(silenceTimer)
      if (ws) {
        ws.onopen = ws.onmessage = ws.onclose = ws.onerror = null
        ws.close()
        ws = null
      }
      setSocketStatus('closed')
      if (cancelled) return
      if (closeCode === 4001) forceTokenRefresh = true
      const delay = Math.min(10_000, 1000 * 2 ** attemptRef.current)
      attemptRef.current += 1
      clearTimeout(reconnectTimer)
      reconnectTimer = setTimeout(connect, delay)
    }

    async function connect() {
      clearTimeout(reconnectTimer)
      if (cancelled || ws || connecting) return
      connecting = true
      setSocketStatus('connecting')

      // The access token lasts 15 minutes — reconnecting after a longer drop
      // with the old one just gets rejected.
      const token = await getFreshAccessToken(forceTokenRefresh)
      connecting = false
      if (cancelled || ws) return
      if (!token) return dropSocket()
      forceTokenRefresh = false

      const socket = new WebSocket(`${WS_BASE_URL}/ws/dashboard?token=${encodeURIComponent(token)}`)
      ws = socket
      markAlive()

      socket.onopen = () => {
        attemptRef.current = 0
        setSocketStatus('open')
        markAlive()
        // Anything pushed while disconnected was missed — catch up.
        if (hasOpened) void queryClient.invalidateQueries()
        hasOpened = true
      }
      socket.onmessage = (event) => {
        markAlive()
        try {
          handleMessage(JSON.parse(event.data), queryClient)
        } catch {
          // ignore malformed frames
        }
      }
      socket.onclose = (event) => dropSocket(event.code)
      socket.onerror = () => socket.close()
    }

    // Back in the tab or back online: reconnect now rather than after the
    // backoff, and don't trust a socket that went quiet in the background.
    function resume() {
      if (cancelled || document.visibilityState !== 'visible') return
      if (ws && Date.now() - lastMessageAt < STALE_ON_RESUME_MS) return
      attemptRef.current = 0
      if (ws) dropSocket()
      void connect()
    }

    void connect()
    document.addEventListener('visibilitychange', resume)
    window.addEventListener('online', resume)

    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', resume)
      window.removeEventListener('online', resume)
      clearTimeout(reconnectTimer)
      clearTimeout(silenceTimer)
      if (ws) {
        ws.onopen = ws.onmessage = ws.onclose = ws.onerror = null
        ws.close()
      }
    }
  }, [authStatus, queryClient])

  return (
    <SocketStatusContext.Provider value={socketStatus}>{children}</SocketStatusContext.Provider>
  )
}
