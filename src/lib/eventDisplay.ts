import { AlertTriangle, PlugZap, Wrench, type LucideIcon } from 'lucide-react'
import type { PowerEventType } from '@/lib/types'

interface EventDisplay {
  label: string
  icon: LucideIcon
  className: string
}

export const EVENT_DISPLAY: Record<PowerEventType, EventDisplay> = {
  outage: {
    label: 'Power Cut',
    icon: PlugZap,
    className: 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400',
  },
  device_offline: {
    label: 'Device Unreachable',
    icon: AlertTriangle,
    className: 'border-orange-500/30 bg-orange-500/10 text-orange-600 dark:text-orange-400',
  },
  checkup: {
    label: 'Checkup',
    icon: Wrench,
    className: 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400',
  },
}
