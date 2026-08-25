import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useDeviceStatsQuery } from '@/hooks/useDeviceQueries'
import { formatDuration } from '@/lib/format'
import type { StatsRange } from '@/lib/types'

const RANGE_LABEL: Record<StatsRange, string> = { '24h': '24h', '7d': '7d', '30d': '30d' }

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold tracking-tight">{value}</p>
      </CardContent>
    </Card>
  )
}

export function StatsRow({ deviceId }: { deviceId: string }) {
  const [range, setRange] = useState<StatsRange>('24h')
  const stats = useDeviceStatsQuery(deviceId, range)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-muted-foreground">Stats</h2>
        <Tabs value={range} onValueChange={(v) => setRange(v as StatsRange)}>
          <TabsList>
            {(Object.keys(RANGE_LABEL) as StatsRange[]).map((r) => (
              <TabsTrigger key={r} value={r}>
                {RANGE_LABEL[r]}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.isPending ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
        ) : stats.isError ? (
          <p className="col-span-full text-sm text-destructive">Failed to load stats.</p>
        ) : (
          <>
            <StatTile label="Uptime" value={`${stats.data.uptimePercent}%`} />
            <StatTile label="Outages" value={String(stats.data.outageCount)} />
            <StatTile label="Total downtime" value={formatDuration(stats.data.totalDowntimeMs)} />
            <StatTile label="Longest outage" value={formatDuration(stats.data.longestOutageMs)} />
          </>
        )}
      </div>
    </div>
  )
}
