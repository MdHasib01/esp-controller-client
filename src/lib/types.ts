export type PowerState = 'unknown' | 'ok' | 'power_cut' | 'checkup'
export type DeviceStatus = 'online' | 'offline'
export type PowerEventType = 'outage' | 'device_offline' | 'checkup'
export type StatsRange = '24h' | '7d' | '30d'

export interface Device {
  id: string
  deviceId: string
  name: string
  status: DeviceStatus
  powerState: PowerState
  lastHeartbeatAt: string | null
  lastSeenOnlineAt: string | null
  wakeTarget: { mac: string | null; label: string | null }
  checkup: { active: boolean; startedAt: string | null; note: string | null }
  led: { blinking: boolean }
  restart: { intervalMinutes: number | null }
}

export interface PowerEvent {
  _id: string
  device: string
  type: PowerEventType
  startedAt: string
  endedAt: string | null
  durationMs: number | null
  resolvedAutomatically: boolean | null
  note: string | null
  createdAt: string
}

export type ConnectionEndReason =
  | 'planned_restart'
  | 'timeout'
  | 'replaced'
  | 'disconnected'
  | 'server_restart'

export interface ConnectionLog {
  _id: string
  device: string
  connectedAt: string
  disconnectedAt: string | null
  durationMs: number | null
  endReason: ConnectionEndReason | null
  closeCode: number | null
  resetReason: string | null
  firstSinceBoot: boolean | null
  bootToConnectMs: number | null
  rssi: number | null
  ip: string | null
}

export interface DeviceStats {
  range: StatsRange
  outageCount: number
  totalDowntimeMs: number
  longestOutageMs: number
  uptimePercent: number
  connectionCount: number
  powerOnBootCount: number
  avgBootToConnectMs: number | null
}

export type DashboardSocketMessage =
  | { type: 'device_status'; device: Device }
  | { type: 'power_event'; event: PowerEvent }
  | { type: 'wake_ack'; deviceId: string; success: boolean }
  | { type: 'connection_event'; connection: ConnectionLog }
