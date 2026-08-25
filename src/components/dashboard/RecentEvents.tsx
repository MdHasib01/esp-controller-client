import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { EVENT_DISPLAY } from '@/lib/eventDisplay'
import { formatDuration, formatRelativeTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { PowerEvent } from '@/lib/types'

function EventRow({ event }: { event: PowerEvent }) {
  const display = EVENT_DISPLAY[event.type]
  const Icon = display.icon
  const durationMs = event.durationMs ?? Date.now() - new Date(event.startedAt).getTime()

  return (
    <li className="flex items-center gap-3 py-2.5">
      <div className={cn('flex size-8 shrink-0 items-center justify-center rounded-full border', display.className)}>
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{display.label}</span>
          {!event.endedAt && (
            <Badge variant="outline" className="text-[10px]">
              ongoing
            </Badge>
          )}
        </div>
        <p className="truncate text-xs text-muted-foreground">
          {formatRelativeTime(event.startedAt)} · {formatDuration(durationMs)}
        </p>
      </div>
    </li>
  )
}

export function RecentEvents({
  events,
  isLoading,
  deviceId,
}: {
  events: PowerEvent[]
  isLoading: boolean
  deviceId: string
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="text-base">Recent events</CardTitle>
        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          render={<Link to={`/history?deviceId=${deviceId}`} />}
        >
          View all
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No events yet.</p>
        ) : (
          <ul className="divide-y">
            {events.map((event) => (
              <EventRow key={event._id} event={event} />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
