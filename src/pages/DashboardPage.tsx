import { Link } from 'react-router-dom'
import { Zap } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusHero } from '@/components/dashboard/StatusHero'
import { WakeButton } from '@/components/dashboard/WakeButton'
import { CheckupToggle } from '@/components/dashboard/CheckupToggle'
import { LedToggle } from '@/components/dashboard/LedToggle'
import { StatsRow } from '@/components/dashboard/StatsRow'
import { RecentEvents } from '@/components/dashboard/RecentEvents'
import { useDeviceEventsQuery, useDeviceQuery, useDevicesQuery } from '@/hooks/useDeviceQueries'

export function DashboardPage() {
  const devicesQuery = useDevicesQuery()
  const firstDeviceId = devicesQuery.data?.[0]?.id
  const deviceQuery = useDeviceQuery(firstDeviceId)
  const eventsQuery = useDeviceEventsQuery(firstDeviceId, { limit: 10 })

  if (devicesQuery.isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-40 rounded-xl" />
      </div>
    )
  }

  if (!firstDeviceId || !deviceQuery.data) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-secondary">
            <Zap className="size-6" />
          </div>
          <div>
            <p className="font-medium">No ESP32 registered yet</p>
            <p className="text-sm text-muted-foreground">
              Add your device in Settings to start monitoring.
            </p>
          </div>
          <Button nativeButton={false} render={<Link to="/settings" />}>
            Go to Settings
          </Button>
        </CardContent>
      </Card>
    )
  }

  const device = deviceQuery.data
  const openEvent = eventsQuery.data?.events.find((e) => e.endedAt === null)

  return (
    <div className="space-y-4">
      <StatusHero device={device} openEvent={openEvent} />

      <div className="hidden gap-2 sm:flex">
        <WakeButton device={device} />
        <CheckupToggle device={device} />
      </div>

      <div className="sm:max-w-xs">
        <LedToggle device={device} />
      </div>

      <StatsRow deviceId={device.id} />

      <RecentEvents
        events={eventsQuery.data?.events ?? []}
        isLoading={eventsQuery.isPending}
        deviceId={device.id}
      />

      <div className="fixed inset-x-0 bottom-0 z-30 flex gap-2 border-t bg-background p-3 sm:hidden">
        <div className="flex-1">
          <WakeButton device={device} />
        </div>
        <div className="flex-1">
          <CheckupToggle device={device} />
        </div>
      </div>
    </div>
  )
}
