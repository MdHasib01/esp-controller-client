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
import { DeleteRowButton } from '@/components/history/DeleteRowButton'
import { useDeleteEventMutation } from '@/hooks/useDeviceQueries'
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

// Ongoing events are still being tracked, so only finished ones can go.
function DeleteEventButton({
  event,
  onDelete,
}: {
  event: PowerEvent
  onDelete: (eventId: string) => Promise<void>
}) {
  if (!event.endedAt) return null
  return (
    <DeleteRowButton
      title={`Delete this ${EVENT_DISPLAY[event.type].label.toLowerCase()} event?`}
      description={`The event from ${formatDateTime(event.startedAt)} will be removed from the power events list.`}
      onConfirm={() => onDelete(event._id)}
    />
  )
}

export function EventList({
  deviceId,
  events,
  isLoading,
}: {
  deviceId: string | undefined
  events: PowerEvent[]
  isLoading: boolean
}) {
  const deleteEvent = useDeleteEventMutation(deviceId)
  const onDelete = async (eventId: string) => {
    await deleteEvent.mutateAsync(eventId)
  }

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
              <TableHead className="w-10">
                <span className="sr-only">Actions</span>
              </TableHead>
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
                  <TableCell className="text-right">
                    <DeleteEventButton event={event} onDelete={onDelete} />
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
                  <div className="flex items-center gap-1">
                    <ResolutionBadge event={event} />
                    <DeleteEventButton event={event} onDelete={onDelete} />
                  </div>
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
