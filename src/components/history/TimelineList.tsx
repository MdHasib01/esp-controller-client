import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
  if (segment.state === 'power_cut') return '—'
  const parts: string[] = []
  if (segment.sessions && segment.sessions > 1) parts.push(`${segment.sessions} sessions`)
  if (segment.endReason) parts.push(`ended: ${END_REASON_LABEL[segment.endReason]}`)
  return parts.length ? parts.join(' · ') : '—'
}

function SummaryTile({
  label,
  value,
  className,
}: {
  label: string
  value: string
  className?: string
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className={cn('text-2xl font-semibold tracking-tight', className)}>{value}</p>
      </CardContent>
    </Card>
  )
}

export function TimelineSummaryRow({ summary }: { summary: TimelineSummary }) {
  const totalMs = summary.connectedMs + summary.powerCutMs
  const connectedPct = totalMs ? (summary.connectedMs / totalMs) * 100 : 0

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <SummaryTile
          label="Total connected"
          value={formatLongDuration(summary.connectedMs)}
          className={TIMELINE_DISPLAY.connected.textClassName}
        />
        <SummaryTile
          label="Total power cut"
          value={formatLongDuration(summary.powerCutMs)}
          className={TIMELINE_DISPLAY.power_cut.textClassName}
        />
        <SummaryTile label="Power cuts" value={String(summary.powerCutCount)} />
        <SummaryTile
          label="Longest power cut"
          value={formatLongDuration(summary.longestPowerCutMs)}
        />
      </div>

      {totalMs > 0 && (
        <div className="space-y-1.5">
          <div className="flex h-2.5 overflow-hidden rounded-full bg-muted">
            <div
              className={TIMELINE_DISPLAY.connected.barClassName}
              style={{ width: `${connectedPct}%` }}
            />
            <div className={cn('flex-1', TIMELINE_DISPLAY.power_cut.barClassName)} />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{connectedPct.toFixed(1)}% connected</span>
            <span>{(100 - connectedPct).toFixed(1)}% power cut</span>
          </div>
        </div>
      )}
    </div>
  )
}

export function TimelineList({
  segments,
  isLoading,
}: {
  segments: TimelineSegment[]
  isLoading: boolean
}) {
  // Keeps the ongoing period's duration ticking.
  const now = useNowTick(1000)

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
                  className={cn(
                    'text-sm font-medium tabular-nums',
                    TIMELINE_DISPLAY[segment.state].textClassName
                  )}
                >
                  {formatLongDuration(segmentDuration(segment, now))}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{detail(segment)}</TableCell>
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
                <span
                  className={cn(
                    'text-sm font-medium tabular-nums',
                    TIMELINE_DISPLAY[segment.state].textClassName
                  )}
                >
                  {formatLongDuration(segmentDuration(segment, now))}
                </span>
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
