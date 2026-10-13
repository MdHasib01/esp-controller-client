import { PlugZap, Wifi, WifiOff, type LucideIcon } from 'lucide-react'
import type { TimelineState } from '@/lib/types'

interface TimelineDisplay {
  label: string
  /** Shown under the label — what this state means. */
  hint: string
  icon: LucideIcon
  /** Pill / tinted-surface styling (tint + border + readable ink). */
  className: string
  /** Solid fill for chart marks and dots. */
  fillClassName: string
  /** Soft wash for hero backgrounds. */
  washClassName: string
}

// Colors come from the fixed status palette (--status-*), and every use
// pairs them with the icon + label so state never rides on color alone.
export const TIMELINE_DISPLAY: Record<TimelineState, TimelineDisplay> = {
  connected: {
    label: 'Connected',
    hint: 'Device online and reporting',
    icon: Wifi,
    className: 'border-status-good/30 bg-status-good/10 text-emerald-700',
    fillClassName: 'bg-status-good',
    washClassName: 'from-status-good/15',
  },
  unreachable: {
    label: 'Unreachable',
    hint: 'No signal — came back without losing power',
    icon: WifiOff,
    className: 'border-status-warning/40 bg-status-warning/15 text-amber-700',
    fillClassName: 'bg-status-warning',
    washClassName: 'from-status-warning/20',
  },
  power_cut: {
    label: 'Power Cut',
    hint: 'Board lost power — confirmed by its power-on boot',
    icon: PlugZap,
    className: 'border-status-critical/30 bg-status-critical/10 text-red-700',
    fillClassName: 'bg-status-critical',
    washClassName: 'from-status-critical/15',
  },
}

/** Fixed legend/stack order: best to worst. */
export const TIMELINE_STATES: TimelineState[] = ['connected', 'unreachable', 'power_cut']
