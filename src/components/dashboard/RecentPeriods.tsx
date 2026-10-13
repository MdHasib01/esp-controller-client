import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TIMELINE_DISPLAY } from '@/lib/timelineDisplay'
import { formatLongDuration, formatSpan } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { TimelineSegment } from '@/lib/types'

export function RecentPeriods({
  segments,
  now,
  deviceId,
}: {
  segments: TimelineSegment[]
  now: number
  deviceId: string
}) {
  const recent = segments.slice(-6).reverse()

  return (
    <Card className="h-full">
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Recent periods</CardTitle>
        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          render={<Link to={`/history?deviceId=${deviceId}`} />}
        >
          View all
          <ChevronRight className="size-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {recent.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Nothing recorded yet.</p>
        ) : (
          <ul className="space-y-1">
            {recent.map((segment) => {
              const display = TIMELINE_DISPLAY[segment.state]
              const Icon = display.icon
              const durationMs = segment.endedAt
                ? segment.durationMs
                : now - new Date(segment.startedAt).getTime()
              return (
                <li
                  key={`${segment.state}-${segment.startedAt}`}
                  className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted/60"
                >
                  <span
                    className={cn(
                      'flex size-8 shrink-0 items-center justify-center rounded-lg border',
                      display.className
                    )}
                  >
                    <Icon className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 text-sm font-medium">
                      {display.label}
                      {!segment.endedAt && (
                        <span className="rounded-full bg-foreground px-1.5 py-px text-[10px] font-semibold text-background">
                          NOW
                        </span>
                      )}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {formatSpan(segment.startedAt, segment.endedAt, now)}
                    </p>
                  </div>
                  <span className="text-sm font-medium tabular-nums">
                    {formatLongDuration(durationMs)}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
