import { apiClient } from './client'
import type { Device, DeviceStats, PowerEvent, PowerEventType, StatsRange } from '@/lib/types'

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
  body: { name?: string; wakeTarget?: { mac?: string | null; label?: string | null } }
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

export async function getDeviceStats(id: string, range: StatsRange): Promise<DeviceStats> {
  const { data } = await apiClient.get<DeviceStats>(`/devices/${id}/stats`, { params: { range } })
  return data
}
