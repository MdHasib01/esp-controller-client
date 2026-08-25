import { AlertTriangle, CheckCircle2, HelpCircle, Wrench } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { formatDuration, formatRelativeTime } from '@/lib/format'
import { useNowTick } from '@/hooks/useNowTick'
import type { Device, PowerEvent } from '@/lib/types'

interface StatusHeroProps {
  device: Device
  openEvent?: PowerEvent
}

const STATUS_CONFIG = {
  checkup: {
    label: 'Checkup Mode',
    icon: Wrench,
    className: 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400',
  },
  power_cut: {
    label: 'Power Cut',
    icon: AlertTriangle,
    className: 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400 animate-pulse',
  },
  ok: {
    label: 'Online',
    icon: CheckCircle2,
    className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  },
  unknown: {
    label: 'Unreachable',
    icon: HelpCircle,
    className: 'border-border bg-muted text-muted-foreground',
  },
} as const

function resolveStatusKey(device: Device): keyof typeof STATUS_CONFIG {
  if (device.checkup.active) return 'checkup'
  if (device.powerState === 'power_cut') return 'power_cut'
  if (device.powerState === 'ok') return 'ok'
  return 'unknown'
}

export function StatusHero({ device, openEvent }: StatusHeroProps) {
  const now = useNowTick(1000)
  const key = resolveStatusKey(device)
  const { label, icon: Icon, className } = STATUS_CONFIG[key]

  const liveDurationMs = openEvent ? now - new Date(openEvent.startedAt).getTime() : null

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div
            className={cn(
              'flex size-14 shrink-0 items-center justify-center rounded-full border',
              className
            )}
          >
            <Icon className="size-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight">{device.name}</h1>
              <span
                className={cn(
                  'rounded-full border px-2.5 py-0.5 text-xs font-medium',
                  className
                )}
              >
                {label}
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Last heartbeat {formatRelativeTime(device.lastHeartbeatAt)}
              {liveDurationMs !== null && (
                <>
                  {' '}
                  · {key === 'checkup' ? 'checkup' : 'outage'} ongoing for{' '}
                  <span className="font-medium text-foreground">
                    {formatDuration(liveDurationMs)}
                  </span>
                </>
              )}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
