import { apiClient } from './client'
import type {
  ConnectionLog,
  Device,
  DeviceStats,
  PowerEvent,
  PowerEventType,
  StatsRange,
  Timeline,
  TimelineState,
  TimelineSummary,
} from '@/lib/types'

export async function listDevices(): Promise<Device[]> {
  const { data } = await apiClient.get<{ devices: Device[] }>('/devices')
  return data.devices
}

export async function getDevice(id: string): Promise<Device> {
  const { data } = await apiClient.get<{ device: Device }>(`/devices/${id}`)
  return data.device
}

export interface CreateDeviceInput {
  deviceId: string
  name: string
  wakeTarget?: { mac?: string; label?: string }
}

export async function createDevice(
  body: CreateDeviceInput
): Promise<{ device: Device; apiKey: string }> {
  const { data } = await apiClient.post<{ device: Device; apiKey: string }>('/devices', body)
  return data
}

export async function updateDevice(
  id: string,
  body: {
    name?: string
    wakeTarget?: { mac?: string | null; label?: string | null }
    restart?: { intervalMinutes: number | null }
  }
): Promise<Device> {
  const { data } = await apiClient.patch<{ device: Device }>(`/devices/${id}`, body)
  return data.device
}

export async function wakeDevice(id: string): Promise<void> {
  await apiClient.post(`/devices/${id}/wake`)
}

export async function setDeviceLed(id: string, value: boolean): Promise<Device> {
  const { data } = await apiClient.post<{ device: Device }>(`/devices/${id}/led`, { value })
  return data.device
}

export async function startCheckup(id: string, note?: string): Promise<Device> {
  const { data } = await apiClient.post<{ device: Device }>(`/devices/${id}/checkup/start`, {
    note,
  })
  return data.device
}

export async function endCheckup(id: string): Promise<Device> {
  const { data } = await apiClient.post<{ device: Device }>(`/devices/${id}/checkup/end`)
  return data.device
}

export interface EventsQuery {
  page?: number
  limit?: number
  type?: PowerEventType
  from?: string
  to?: string
}

export interface EventsResult {
  events: PowerEvent[]
  total: number
  page: number
  limit: number
}

export async function getDeviceEvents(id: string, params: EventsQuery): Promise<EventsResult> {
  const { data } = await apiClient.get<EventsResult>(`/devices/${id}/events`, { params })
  return data
}

export interface ConnectionsQuery {
  page?: number
  limit?: number
  from?: string
  to?: string
}

export interface ConnectionsResult {
  connections: ConnectionLog[]
  total: number
  page: number
  limit: number
}

export async function getDeviceConnections(
  id: string,
  params: ConnectionsQuery
): Promise<ConnectionsResult> {
  const { data } = await apiClient.get<ConnectionsResult>(`/devices/${id}/connections`, { params })
  return data
}

export interface TimelineQuery {
  page?: number
  // "all": every period in range, oldest first (for charts)
  limit?: number | 'all'
  from?: string
  to?: string
}

const TIMELINE_STATES: TimelineState[] = ['connected', 'unreachable', 'power_cut']

export async function getDeviceTimeline(id: string, params: TimelineQuery): Promise<Timeline> {
  const { data } = await apiClient.get<Timeline>(`/devices/${id}/timeline`, { params })

  // Fill any state the server didn't send (e.g. a backend deployed before
  // 'unreachable' existed) with zeros, so the dashboard degrades instead of
  // crashing on summary[state].ms.
  const raw = (data.summary ?? {}) as Partial<TimelineSummary>
  const summary = {} as TimelineSummary
  for (const state of TIMELINE_STATES) {
    summary[state] = { ms: 0, count: 0, longestMs: 0, ...raw[state] }
  }

  return {
    ...data,
    summary,
    segments: (data.segments ?? []).filter((s) => TIMELINE_STATES.includes(s.state)),
    serverNow: data.serverNow ?? new Date().toISOString(),
  }
}

export async function getDeviceStats(id: string, range: StatsRange): Promise<DeviceStats> {
  const { data } = await apiClient.get<DeviceStats>(`/devices/${id}/stats`, { params: { range } })
  return data
}
