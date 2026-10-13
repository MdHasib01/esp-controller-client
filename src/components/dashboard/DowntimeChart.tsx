import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartTooltip, KeyRow } from '@/components/dashboard/ChartTooltip'
import { TIMELINE_DISPLAY } from '@/lib/timelineDisplay'
import type { Bucket, DashboardRange } from '@/lib/timelineMath'
import { formatDuration, formatLongDuration } from '@/lib/format'
import { cn } from '@/lib/utils'

const MIN = 60_000
const HOUR = 60 * MIN
// Axis maxima whose halves are also clean ticks.
const AXIS_STEPS = [2, 4, 10, 20, 30, 60, 120, 240, 360, 720, 1440].map((m) => m * MIN)

// Power cut sits on the baseline (the story), unreachable stacks above it.
const STACK = ['power_cut', 'unreachable'] as const

const BUCKET_FMT: Record<DashboardRange, Intl.DateTimeFormatOptions> = {
  '24h': { hour: 'numeric' },
  '7d': { weekday: 'short' },
  '30d': { day: 'numeric' },
}
const TOOLTIP_FMT: Record<DashboardRange, Intl.DateTimeFormatOptions> = {
  '24h': { weekday: 'short', hour: 'numeric', minute: '2-digit' },
  '7d': { weekday: 'long', month: 'short', day: 'numeric' },
  '30d': { weekday: 'short', month: 'short', day: 'numeric' },
}
// Which bucket labels to print so they never collide.
const LABEL_EVERY: Record<DashboardRange, number> = { '24h': 4, '7d': 1, '30d': 5 }

export function DowntimeChart({ buckets, range }: { buckets: Bucket[]; range: DashboardRange }) {
  const [hovered, setHovered] = useState<number | null>(null)

  const downtime = buckets.map((b) => b.ms.power_cut + b.ms.unreachable)
  const maxDowntime = Math.max(0, ...downtime)
  const axisMax = AXIS_STEPS.find((s) => s >= maxDowntime) ?? 24 * HOUR
  const hasDowntime = maxDowntime > 0

  const labelFmt = new Intl.DateTimeFormat(undefined, BUCKET_FMT[range])
  const tooltipFmt = new Intl.DateTimeFormat(undefined, TOOLTIP_FMT[range])
  const active = hovered !== null ? buckets[hovered] : null

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <CardTitle>Downtime per {range === '24h' ? 'hour' : 'day'}</CardTitle>
          <CardDescription>How long the device was down, and why</CardDescription>
        </div>
        <div className="flex gap-4 text-xs">
          {STACK.map((state) => (
            <KeyRow
              key={state}
              swatchClassName={TIMELINE_DISPLAY[state].fillClassName}
              label={TIMELINE_DISPLAY[state].label}
            />
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {!hasDowntime ? (
          <div className="flex h-48 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
            No downtime in this range — connected the whole time.
          </div>
        ) : (
          <div className="flex gap-2">
            {/* Y axis */}
            <div className="relative h-48 w-9 shrink-0 text-right text-[11px] text-muted-foreground">
              {[1, 0.5, 0].map((f) => (
                <span
                  key={f}
                  className="absolute right-0 -translate-y-1/2"
                  style={{ top: `${(1 - f) * 100}%` }}
                >
                  {f === 0 ? '0' : formatDuration(axisMax * f)}
                </span>
              ))}
            </div>

            <div className="min-w-0 flex-1">
              <div className="relative h-48" onPointerLeave={() => setHovered(null)}>
                {/* Gridlines */}
                {[0, 0.5, 1].map((f) => (
                  <div
                    key={f}
                    className="absolute inset-x-0 border-t border-border"
                    style={{ top: `${f * 100}%` }}
                  />
                ))}

                {active && hovered !== null && (
                  <ChartTooltip x={(hovered + 0.5) / buckets.length}>
                    <p className="mb-1.5 font-medium">{tooltipFmt.format(new Date(active.start))}</p>
                    <div className="space-y-1">
                      {(['power_cut', 'unreachable', 'connected'] as const).map((state) => (
                        <KeyRow
                          key={state}
                          swatchClassName={TIMELINE_DISPLAY[state].fillClassName}
                          label={TIMELINE_DISPLAY[state].label}
                          value={formatLongDuration(active.ms[state])}
                        />
                      ))}
                    </div>
                  </ChartTooltip>
                )}

                <div className="absolute inset-0 flex">
                  {buckets.map((bucket, i) => (
                    // The whole column slot is the hit target, not just the bar.
                    <div
                      key={bucket.start}
                      className={cn(
                        'flex h-full flex-1 cursor-pointer flex-col-reverse items-center',
                        hovered === i && 'bg-muted/60'
                      )}
                      onPointerEnter={() => setHovered(i)}
                    >
                      <div className="flex w-full max-w-6 flex-col-reverse gap-0.5 px-px">
                        {STACK.map((state, si) => {
                          const ms = bucket.ms[state]
                          if (!ms) return null
                          const isTop = si === STACK.length - 1 || !bucket.ms[STACK[si + 1]]
                          return (
                            <div
                              key={state}
                              className={cn(
                                TIMELINE_DISPLAY[state].fillClassName,
                                isTop && 'rounded-t-[4px]'
                              )}
                              // Floor of 2px so a short outage still shows up.
                              style={{ height: `max(${(ms / axisMax) * 192}px, 2px)` }}
                            />
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* X labels */}
              <div className="mt-2 flex text-[11px] text-muted-foreground">
                {buckets.map((bucket, i) => (
                  // Centered + nowrap: a label wider than its column spills evenly to both sides.
                  <span key={bucket.start} className="flex min-w-0 flex-1 justify-center whitespace-nowrap">
                    {(buckets.length - 1 - i) % LABEL_EVERY[range] === 0
                      ? labelFmt.format(new Date(bucket.start))
                      : ''}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
