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
import { StateTiles } from '@/components/dashboard/StateTiles'
import { DeleteRowButton } from '@/components/history/DeleteRowButton'
import { useDeleteSegmentMutation } from '@/hooks/useDeviceQueries'
import { useNowTick } from '@/hooks/useNowTick'
import { END_REASON_LABEL } from '@/lib/connectionDisplay'
import { TIMELINE_DISPLAY } from '@/lib/timelineDisplay'
import { formatDateTime, formatLongDuration } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { TimelineSegment, TimelineSummary } from '@/lib/types'

function segmentDuration(segment: TimelineSegment, now: number): number {
  return segment.endedAt ? segment.durationMs : now - new Date(segment.startedAt).getTime()
}

function StateBadge({ segment }: { segment: TimelineSegment }) {
  const display = TIMELINE_DISPLAY[segment.state]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium',
        display.className
      )}
    >
      <display.icon className="size-3.5" />
      {display.label}
    </span>
  )
}

function EndedCell({ segment }: { segment: TimelineSegment }) {
  if (!segment.endedAt) return <Badge variant="outline">ongoing</Badge>
  return <span>{formatDateTime(segment.endedAt)}</span>
}

function detail(segment: TimelineSegment): string {
  if (segment.state !== 'connected') return TIMELINE_DISPLAY[segment.state].hint
  const parts: string[] = []
  if (segment.sessions && segment.sessions > 1) parts.push(`${segment.sessions} sessions`)
  if (segment.endReason) parts.push(`ended: ${END_REASON_LABEL[segment.endReason]}`)
  return parts.length ? parts.join(' · ') : '—'
}

export function TimelineSummaryRow({ summary }: { summary: TimelineSummary }) {
  return <StateTiles summary={summary} />
}

// The ongoing period drives the live timer, so only finished ones can go.
function DeleteSegmentButton({
  segment,
  onDelete,
}: {
  segment: TimelineSegment
  onDelete: (segment: TimelineSegment) => Promise<void>
}) {
  if (!segment.endedAt) return null
  return (
    <DeleteRowButton
      title={`Delete this ${TIMELINE_DISPLAY[segment.state].label.toLowerCase()} period?`}
      description={`${formatDateTime(segment.startedAt)} → ${formatDateTime(segment.endedAt)} will be removed from the status timeline and dashboard charts.`}
      onConfirm={() => onDelete(segment)}
    />
  )
}

export function TimelineList({
  deviceId,
  segments,
  isLoading,
}: {
  deviceId: string | undefined
  segments: TimelineSegment[]
  isLoading: boolean
}) {
  // Keeps the ongoing period's duration ticking.
  const now = useNowTick(1000)
  const deleteSegment = useDeleteSegmentMutation(deviceId)
  const onDelete = async (segment: TimelineSegment) => {
    await deleteSegment.mutateAsync(segment)
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

  if (segments.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          No connected or power cut periods in this range.
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
              <TableHead>Status</TableHead>
              <TableHead>Started</TableHead>
              <TableHead>Ended</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Details</TableHead>
              <TableHead className="w-10">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {segments.map((segment) => (
              <TableRow key={`${segment.state}-${segment.startedAt}`}>
                <TableCell>
                  <StateBadge segment={segment} />
                </TableCell>
                <TableCell className="text-sm">{formatDateTime(segment.startedAt)}</TableCell>
                <TableCell className="text-sm">
                  <EndedCell segment={segment} />
                </TableCell>
                <TableCell
                  className="text-sm font-medium tabular-nums"
                >
                  {formatLongDuration(segmentDuration(segment, now))}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{detail(segment)}</TableCell>
                <TableCell className="text-right">
                  <DeleteSegmentButton segment={segment} onDelete={onDelete} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile */}
      <div className="space-y-2 md:hidden">
        {segments.map((segment) => (
          <Card key={`${segment.state}-${segment.startedAt}`}>
            <CardContent className="space-y-2 py-3">
              <div className="flex items-center justify-between">
                <StateBadge segment={segment} />
                <div className="flex items-center gap-1">
                  <span className="text-sm font-medium tabular-nums">
                    {formatLongDuration(segmentDuration(segment, now))}
                  </span>
                  <DeleteSegmentButton segment={segment} onDelete={onDelete} />
                </div>
              </div>
              <p className="text-sm">
                {formatDateTime(segment.startedAt)} →{' '}
                {segment.endedAt ? formatDateTime(segment.endedAt) : 'now'}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  )
}
