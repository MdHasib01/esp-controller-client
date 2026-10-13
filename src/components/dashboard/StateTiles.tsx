import { Card, CardContent } from '@/components/ui/card'
import { TIMELINE_DISPLAY, TIMELINE_STATES } from '@/lib/timelineDisplay'
import { formatLongDuration } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { TimelineState, TimelineSummary } from '@/lib/types'

const COUNT_NOUN: Record<TimelineState, [string, string]> = {
  connected: ['session', 'sessions'],
  unreachable: ['time', 'times'],
  power_cut: ['cut', 'cuts'],
}

export function StateTiles({ summary }: { summary: TimelineSummary }) {
  const totalMs = TIMELINE_STATES.reduce((sum, s) => sum + summary[s].ms, 0)

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {TIMELINE_STATES.map((state) => {
        const display = TIMELINE_DISPLAY[state]
        const Icon = display.icon
        const { ms, count, longestMs } = summary[state]
        const share = totalMs ? (ms / totalMs) * 100 : 0
        const [one, many] = COUNT_NOUN[state]

        return (
          <Card key={state} size="sm">
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'flex size-7 items-center justify-center rounded-lg border',
                      display.className
                    )}
                  >
                    <Icon className="size-3.5" />
                  </span>
                  <span className="text-sm font-medium">{display.label}</span>
                </div>
                <span className="text-sm font-medium text-muted-foreground tabular-nums">
                  {share.toFixed(share >= 99.95 || share === 0 ? 0 : 1)}%
                </span>
              </div>

              <p className="text-2xl font-semibold tracking-tight tabular-nums">
                {formatLongDuration(ms)}
              </p>

              {/* Meter: share of the range spent in this state. */}
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn('h-full rounded-full', display.fillClassName)}
                  style={{ width: `${share}%` }}
                />
              </div>

              <p className="text-xs text-muted-foreground">
                {count} {count === 1 ? one : many}
                {count > 0 && <> · longest {formatLongDuration(longestMs)}</>}
              </p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
