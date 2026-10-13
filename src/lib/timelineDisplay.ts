import { PlugZap, Wifi, type LucideIcon } from 'lucide-react'
import type { TimelineState } from '@/lib/types'

interface TimelineDisplay {
  label: string
  icon: LucideIcon
  className: string
  textClassName: string
  barClassName: string
}

export const TIMELINE_DISPLAY: Record<TimelineState, TimelineDisplay> = {
  connected: {
    label: 'Connected',
    icon: Wifi,
    className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    textClassName: 'text-emerald-600 dark:text-emerald-400',
    barClassName: 'bg-emerald-500',
  },
  power_cut: {
    label: 'Power Cut',
    icon: PlugZap,
    className: 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400',
    textClassName: 'text-red-600 dark:text-red-400',
    barClassName: 'bg-red-500',
  },
}
