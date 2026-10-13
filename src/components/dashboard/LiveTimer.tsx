import { Link } from 'react-router-dom'
import { HelpCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useDeviceTimelineQuery } from '@/hooks/useDeviceQueries'
import { useNowTick } from '@/hooks/useNowTick'
import { TIMELINE_DISPLAY } from '@/lib/timelineDisplay'
import { formatClock, formatDateTime, formatLongDuration } from '@/lib/format'
import { cn } from '@/lib/utils'

function startOfTodayIso(): string {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

export function LiveTimer({ deviceId }: { deviceId: string }) {
  const now = useNowTick(1000)
  // Recomputed every tick, but only changes at midnight — so the query key
  // rolls over to the new day on its own.
  const timeline = useDeviceTimelineQuery(deviceId, { from: startOfTodayIso(), limit: 1 })

  if (timeline.isPending) return <Skeleton className="h-44 rounded-xl" />
  if (timeline.isError) {
    return <p className="text-sm text-destructive">Failed to load the connection timer.</p>
  }

  const { current, summary } = timeline.data

  if (!current) {
    return (
      <Card>
        <CardContent className="flex items-center gap-3 py-6 text-muted-foreground">
          <HelpCircle className="size-5" />
          <p className="text-sm">The device hasn't connected yet — the timer starts on its first connection.</p>
        </CardContent>
      </Card>
    )
  }

  const display = TIMELINE_DISPLAY[current.state]
  const Icon = display.icon
  const elapsedMs = now - new Date(current.since).getTime()

  // The summary was computed at fetch time; keep today's total for the
  // current state ticking along with the timer between refetches.
  const sinceFetchMs = Math.max(0, now - timeline.dataUpdatedAt)
  const todayConnectedMs = summary.connectedMs + (current.state === 'connected' ? sinceFetchMs : 0)
  const todayPowerCutMs = summary.powerCutMs + (current.state === 'power_cut' ? sinceFetchMs : 0)

  return (
    <Card className={cn('border', display.className)}>
      <CardContent className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <Icon className={cn('size-5', current.state === 'power_cut' && 'animate-pulse')} />
            <span className="text-sm font-medium">
              {current.state === 'connected' ? 'Connected for' : 'Power cut for'}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            nativeButton={false}
            render={<Link to={`/history?deviceId=${deviceId}`} />}
          >
            History
          </Button>
        </div>

        <div>
          <p className="font-mono text-4xl font-semibold tracking-tight tabular-nums sm:text-5xl">
            {formatClock(elapsedMs)}
          </p>
          <p className="mt-1 text-xs opacity-80">since {formatDateTime(current.since)}</p>
        </div>

        <div className="grid grid-cols-2 gap-3 border-t border-current/15 pt-3 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Connected today</p>
            <p className={cn('font-medium', TIMELINE_DISPLAY.connected.textClassName)}>
              {formatLongDuration(todayConnectedMs)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">
              Power cut today{summary.powerCutCount ? ` (${summary.powerCutCount}×)` : ''}
            </p>
            <p className={cn('font-medium', TIMELINE_DISPLAY.power_cut.textClassName)}>
              {formatLongDuration(todayPowerCutMs)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
