import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { EVENT_DISPLAY } from '@/lib/eventDisplay'
import { formatDateTime, formatDuration } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { PowerEvent } from '@/lib/types'

function ResolutionBadge({ event }: { event: PowerEvent }) {
  if (!event.endedAt) return <Badge variant="outline">ongoing</Badge>
  return (
    <Badge variant="secondary">
      {event.resolvedAutomatically ? 'auto-resolved' : 'manually ended'}
    </Badge>
  )
}

export function EventList({ events, isLoading }: { events: PowerEvent[]; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          No events match these filters.
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      {/* Desktop */}
      <div className="hidden overflow-x-auto rounded-lg border md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Started</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Resolution</TableHead>
              <TableHead>Note</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((event) => {
              const display = EVENT_DISPLAY[event.type]
              const durationMs = event.durationMs ?? Date.now() - new Date(event.startedAt).getTime()
              return (
                <TableRow key={event._id}>
                  <TableCell>
                    <span
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium',
                        display.className
                      )}
                    >
                      <display.icon className="size-3.5" />
                      {display.label}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm">{formatDateTime(event.startedAt)}</TableCell>
                  <TableCell className="text-sm">{formatDuration(durationMs)}</TableCell>
                  <TableCell>
                    <ResolutionBadge event={event} />
                  </TableCell>
                  <TableCell className="max-w-48 truncate text-sm text-muted-foreground">
                    {event.note ?? '—'}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* Mobile */}
      <div className="space-y-2 md:hidden">
        {events.map((event) => {
          const display = EVENT_DISPLAY[event.type]
          const durationMs = event.durationMs ?? Date.now() - new Date(event.startedAt).getTime()
          return (
            <Card key={event._id}>
              <CardContent className="space-y-2 py-3">
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium',
                      display.className
                    )}
                  >
                    <display.icon className="size-3.5" />
                    {display.label}
                  </span>
                  <ResolutionBadge event={event} />
                </div>
                <p className="text-sm">{formatDateTime(event.startedAt)}</p>
                <p className="text-sm text-muted-foreground">Duration: {formatDuration(durationMs)}</p>
                {event.note && <p className="text-sm text-muted-foreground">{event.note}</p>}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </>
  )
}
