import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { useQueryClient, type QueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { WS_BASE_URL } from '@/api/client'
import { getAccessToken } from '@/api/tokenStore'
import { useAuth } from '@/context/AuthContext'
import { playAlertSound } from '@/lib/alertSound'
import { formatDuration } from '@/lib/format'
import { showNativeAlert } from '@/lib/pushNotifications'
import type { DashboardSocketMessage, Device, PowerAlert } from '@/lib/types'

export type SocketStatus = 'connecting' | 'open' | 'closed'

const SocketStatusContext = createContext<SocketStatus>('closed')

export function useDashboardSocketStatus(): SocketStatus {
  return useContext(SocketStatusContext)
}

function handleMessage(msg: DashboardSocketMessage, queryClient: QueryClient) {
  switch (msg.type) {
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
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null
    let cancelled = false

    function connect() {
      const token = getAccessToken()
      if (!token || cancelled) return

      setSocketStatus('connecting')
      ws = new WebSocket(`${WS_BASE_URL}/ws/dashboard?token=${encodeURIComponent(token)}`)

      ws.onopen = () => {
        attemptRef.current = 0
        setSocketStatus('open')
      }
      ws.onmessage = (event) => {
        try {
          handleMessage(JSON.parse(event.data), queryClient)
        } catch {
          // ignore malformed frames
        }
      }
      ws.onclose = () => {
        setSocketStatus('closed')
        if (cancelled) return
        const delay = Math.min(10_000, 1000 * 2 ** attemptRef.current)
        attemptRef.current += 1
        reconnectTimer = setTimeout(connect, delay)
      }
      ws.onerror = () => ws?.close()
    }

    connect()

    return () => {
      cancelled = true
      if (reconnectTimer) clearTimeout(reconnectTimer)
      ws?.close()
    }
  }, [authStatus, queryClient])

  return (
    <SocketStatusContext.Provider value={socketStatus}>{children}</SocketStatusContext.Provider>
  )
}
