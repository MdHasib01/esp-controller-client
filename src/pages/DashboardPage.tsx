import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Zap } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { StatusHero } from '@/components/dashboard/StatusHero'
import { ControlsCard } from '@/components/dashboard/ControlsCard'
import { StateTiles } from '@/components/dashboard/StateTiles'
import { StatusStrip } from '@/components/dashboard/StatusStrip'
import { DowntimeChart } from '@/components/dashboard/DowntimeChart'
import { RecentPeriods } from '@/components/dashboard/RecentPeriods'
import { useDeviceQuery, useDevicesQuery, useDeviceTimelineQuery } from '@/hooks/useDeviceQueries'
import { useNowTick } from '@/hooks/useNowTick'
import {
  RANGE_LABEL,
  fillBuckets,
  rangeBuckets,
  type DashboardRange,
} from '@/lib/timelineMath'

const RANGES: DashboardRange[] = ['24h', '7d', '30d']

function DashboardSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Skeleton className="h-56 rounded-xl lg:col-span-2" />
      <Skeleton className="h-56 rounded-xl" />
      <Skeleton className="h-36 rounded-xl lg:col-span-3" />
      <Skeleton className="h-72 rounded-xl lg:col-span-3" />
    </div>
  )
}

export function DashboardPage() {
  const [range, setRange] = useState<DashboardRange>('24h')
  const tick = useNowTick(1000)

  const devicesQuery = useDevicesQuery()
  const firstDeviceId = devicesQuery.data?.[0]?.id
  const deviceQuery = useDeviceQuery(firstDeviceId)

  // Bucket bounds only move on the hour / at midnight, so the query key (and
  // the fetch) stays put between those boundaries despite the 1s tick.
  const bounds = rangeBuckets(range, tick)
  const from = bounds[0].start
  const timelineQuery = useDeviceTimelineQuery(firstDeviceId, {
    from: new Date(from).toISOString(),
    limit: 'all',
  })

  if (devicesQuery.isPending || (firstDeviceId && deviceQuery.isPending)) {
    return <DashboardSkeleton />
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
  const timeline = timelineQuery.data

  // Live durations are measured against the server's clock, so a phone
  // whose clock is a few minutes off still shows the right timer.
  const skew = timeline ? new Date(timeline.serverNow).getTime() - timelineQuery.dataUpdatedAt : 0
  const now = tick + skew

  return (
    <div className="space-y-4 md:space-y-5">
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {timeline || timelineQuery.isError ? (
            <StatusHero device={device} current={timeline?.current ?? null} now={now} />
          ) : (
            <Skeleton className="h-56 rounded-xl" />
          )}
        </div>
        <ControlsCard device={device} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div>
          <h2 className="text-base font-semibold tracking-tight">Overview</h2>
          <p className="text-xs text-muted-foreground">{RANGE_LABEL[range]}</p>
        </div>
        <Tabs value={range} onValueChange={(v) => setRange(v as DashboardRange)}>
          <TabsList>
            {RANGES.map((r) => (
              <TabsTrigger key={r} value={r} className="px-3">
                {r}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {timelineQuery.isError ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-destructive">
            Failed to load the status history.
          </CardContent>
        </Card>
      ) : !timeline ? (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            {RANGES.map((r) => (
              <Skeleton key={r} className="h-36 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-36 rounded-xl" />
          <Skeleton className="h-72 rounded-xl" />
        </div>
      ) : (
        <>
          <StateTiles summary={timeline.summary} />
          <StatusStrip segments={timeline.segments} from={from} now={now} range={range} />
          <div className="grid gap-4 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <DowntimeChart buckets={fillBuckets(timeline.segments, bounds, now)} range={range} />
            </div>
            <div className="lg:col-span-2">
              <RecentPeriods segments={timeline.segments} now={now} deviceId={device.id} />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
