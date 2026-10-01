import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createDevice,
  endCheckup,
  getDevice,
  getDeviceConnections,
  getDeviceEvents,
  getDeviceStats,
  listDevices,
  setDeviceLed,
  startCheckup,
  updateDevice,
  wakeDevice,
  type ConnectionsQuery,
  type CreateDeviceInput,
  type EventsQuery,
} from '@/api/devices'
import type { StatsRange } from '@/lib/types'

export function useDevicesQuery() {
  return useQuery({ queryKey: ['devices'], queryFn: listDevices })
}

export function useDeviceQuery(id: string | undefined) {
  return useQuery({
    queryKey: ['device', id],
    queryFn: () => getDevice(id as string),
    enabled: Boolean(id),
  })
}

export function useDeviceEventsQuery(id: string | undefined, params: EventsQuery) {
  return useQuery({
    queryKey: ['device-events', id, params],
    queryFn: () => getDeviceEvents(id as string, params),
    enabled: Boolean(id),
  })
}

export function useDeviceConnectionsQuery(id: string | undefined, params: ConnectionsQuery) {
  return useQuery({
    queryKey: ['device-connections', id, params],
    queryFn: () => getDeviceConnections(id as string, params),
    enabled: Boolean(id),
  })
}

export function useDeviceStatsQuery(id: string | undefined, range: StatsRange) {
  return useQuery({
    queryKey: ['device-stats', id, range],
    queryFn: () => getDeviceStats(id as string, range),
    enabled: Boolean(id),
    refetchInterval: 30_000,
  })
}

export function useCreateDeviceMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateDeviceInput) => createDevice(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] })
    },
  })
}

export function useWakeDeviceMutation(id: string | undefined) {
  return useMutation({ mutationFn: () => wakeDevice(id as string) })
}

export function useSetLedMutation(id: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (value: boolean) => setDeviceLed(id as string, value),
    onSuccess: (device) => {
      queryClient.setQueryData(['device', id], device)
    },
  })
}

export function useStartCheckupMutation(id: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (note?: string) => startCheckup(id as string, note),
    onSuccess: (device) => {
      queryClient.setQueryData(['device', id], device)
      queryClient.invalidateQueries({ queryKey: ['devices'] })
    },
  })
}

export function useEndCheckupMutation(id: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => endCheckup(id as string),
    onSuccess: (device) => {
      queryClient.setQueryData(['device', id], device)
      queryClient.invalidateQueries({ queryKey: ['devices'] })
    },
  })
}

export function useUpdateDeviceMutation(id: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: Parameters<typeof updateDevice>[1]) => updateDevice(id as string, body),
    onSuccess: (device) => {
      queryClient.setQueryData(['device', id], device)
      queryClient.invalidateQueries({ queryKey: ['devices'] })
    },
  })
}
