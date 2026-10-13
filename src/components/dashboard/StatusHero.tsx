import { HelpCircle, Wrench } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { TIMELINE_DISPLAY } from '@/lib/timelineDisplay'
import { formatClock, formatRelativeTime, formatWhen } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Device, Timeline } from '@/lib/types'

const TIMER_LABEL = {
  connected: 'Connected for',
  unreachable: 'Unreachable for',
  power_cut: 'Power cut for',
} as const

export function StatusHero({
  device,
  current,
  now,
}: {
  device: Device
  current: Timeline['current']
  now: number
}) {
  if (!current) {
    return (
      <Card className="h-full">
        <CardContent className="flex h-full flex-col justify-center gap-3 py-8">
          <h1 className="text-xl font-semibold tracking-tight">{device.name}</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <HelpCircle className="size-4" />
            Waiting for the first connection — the timer starts when the device comes online.
          </div>
        </CardContent>
      </Card>
    )
  }

  const display = TIMELINE_DISPLAY[current.state]
  const Icon = display.icon
  const elapsedMs = now - new Date(current.since).getTime()

  return (
    <Card
      className={cn(
        'relative h-full bg-linear-to-br via-card to-card ring-1 ring-foreground/10',
        display.washClassName
      )}
    >
      <CardContent className="flex h-full flex-col gap-5 py-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-lg font-semibold tracking-tight">{device.name}</h1>
          <div className="flex flex-wrap items-center gap-1.5">
            {device.checkup.active && (
              <span className="inline-flex items-center gap-1 rounded-full border border-status-warning/40 bg-status-warning/15 px-2.5 py-1 text-xs font-medium text-amber-700 dark:text-amber-400">
                <Wrench className="size-3.5" />
                Checkup
              </span>
            )}
            <span
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold',
                display.className
              )}
            >
              <span className="relative flex size-2">
                <span
                  className={cn(
                    'absolute inline-flex size-full animate-ping rounded-full opacity-60',
                    display.fillClassName
                  )}
                />
                <span className={cn('relative inline-flex size-2 rounded-full', display.fillClassName)} />
              </span>
              {display.label}
            </span>
          </div>
        </div>

        <div className="flex items-end gap-4">
          <div
            className={cn(
              'hidden size-14 shrink-0 items-center justify-center rounded-2xl border sm:flex',
              display.className
            )}
          >
            <Icon className="size-7" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-muted-foreground">{TIMER_LABEL[current.state]}</p>
            <p
              className="text-5xl font-semibold tracking-tight tabular-nums sm:text-6xl"
              aria-live="off"
            >
              {formatClock(elapsedMs)}
            </p>
          </div>
        </div>

        <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span>Since {formatWhen(current.since, now)}</span>
          <span>Last heartbeat {formatRelativeTime(device.lastHeartbeatAt)}</span>
          <span className="w-full sm:w-auto">{display.hint}</span>
        </div>
      </CardContent>
    </Card>
  )
}
