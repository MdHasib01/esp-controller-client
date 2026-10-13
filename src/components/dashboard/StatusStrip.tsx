import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartTooltip, KeyRow } from '@/components/dashboard/ChartTooltip'
import { TIMELINE_DISPLAY, TIMELINE_STATES } from '@/lib/timelineDisplay'
import { stripSegments, type DashboardRange } from '@/lib/timelineMath'
import { formatLongDuration, formatSpan } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { TimelineSegment } from '@/lib/types'

const TICK_FMT: Record<DashboardRange, Intl.DateTimeFormatOptions> = {
  '24h': { hour: 'numeric' },
  '7d': { weekday: 'short' },
  '30d': { month: 'short', day: 'numeric' },
}

/**
 * One horizontal band across the range, each period drawn at its true
 * position and length. Outages get a minimum visible width — at 30 days a
 * one-minute cut would otherwise be sub-pixel — and the tooltip carries the
 * exact times.
 */
export function StatusStrip({
  segments,
  from,
  now,
  range,
}: {
  segments: TimelineSegment[]
  from: number
  now: number
  range: DashboardRange
}) {
  const [hovered, setHovered] = useState<number | null>(null)
  const parts = stripSegments(segments, from, now, now)
  const active = hovered !== null ? parts[hovered] : null

  const tickFmt = new Intl.DateTimeFormat(undefined, TICK_FMT[range])
  const ticks = [0, 0.25, 0.5, 0.75].map((f) => ({
    f,
    label: tickFmt.format(new Date(from + f * (now - from))),
  }))

  return (
    <Card>
      <CardHeader className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <CardTitle>Status timeline</CardTitle>
          <CardDescription>Every connected, unreachable and power cut period</CardDescription>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
          {TIMELINE_STATES.map((state) => (
            <KeyRow
              key={state}
              swatchClassName={TIMELINE_DISPLAY[state].fillClassName}
              label={TIMELINE_DISPLAY[state].label}
            />
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative" onPointerLeave={() => setHovered(null)}>
          {active && (
            <ChartTooltip x={active.left + active.width / 2}>
              <KeyRow
                swatchClassName={TIMELINE_DISPLAY[active.segment.state].fillClassName}
                label={TIMELINE_DISPLAY[active.segment.state].label}
                value={formatLongDuration(active.segment.endedAt ? active.segment.durationMs : now - new Date(active.segment.startedAt).getTime())}
              />
              <p className="mt-1 text-muted-foreground">
                {formatSpan(active.segment.startedAt, active.segment.endedAt, now)}
              </p>
            </ChartTooltip>
          )}

          <div
            className="relative h-10 overflow-hidden rounded-md bg-muted"
            role="img"
            aria-label="Status timeline — see Recent periods for the full list"
          >
            {parts.map((part, i) => {
              const outage = part.segment.state !== 'connected'
              return (
                <div
                  key={`${part.segment.state}-${part.segment.startedAt}`}
                  className={cn(
                    'absolute inset-y-0 cursor-pointer transition-opacity',
                    TIMELINE_DISPLAY[part.segment.state].fillClassName,
                    // 2px surface gap on the leading edge separates touching periods
                    i > 0 && 'border-l-2 border-card',
                    hovered !== null && hovered !== i && 'opacity-50',
                    outage && 'z-10'
                  )}
                  style={{
                    left: `${part.left * 100}%`,
                    width: outage ? `max(${part.width * 100}%, 4px)` : `${part.width * 100}%`,
                  }}
                  onPointerEnter={() => setHovered(i)}
                />
              )
            })}
          </div>
        </div>

        <div className="relative mt-2 h-4 text-[11px] text-muted-foreground">
          {ticks.map((t) => (
            <span
              key={t.f}
              className={cn('absolute', (t.f === 0.25 || t.f === 0.75) && 'hidden sm:inline')}
              style={{ left: `${t.f * 100}%` }}
            >
              {t.label}
            </span>
          ))}
          <span className="absolute right-0">Now</span>
        </div>
      </CardContent>
    </Card>
  )
}
