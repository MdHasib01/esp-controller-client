import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * Floating tooltip for the dashboard charts. `x` is a 0–1 fraction across
 * the chart; it's clamped so the box never runs off either edge.
 */
export function ChartTooltip({ x, children }: { x: number; children: ReactNode }) {
  const align = x < 0.2 ? 'left' : x > 0.8 ? 'right' : 'center'
  return (
    <div
      role="tooltip"
      className={cn(
        'pointer-events-none absolute bottom-full z-20 mb-2 w-max max-w-64 rounded-lg border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-lg',
        align === 'center' && '-translate-x-1/2',
        align === 'right' && '-translate-x-full'
      )}
      style={{ left: `${x * 100}%` }}
    >
      {children}
    </div>
  )
}

/** Swatch + label + value row used inside tooltips and legends. */
export function KeyRow({
  swatchClassName,
  label,
  value,
}: {
  swatchClassName: string
  label: string
  value?: string
}) {
  return (
    <div className="flex items-center gap-2">
      <span className={cn('size-2.5 shrink-0 rounded-[3px]', swatchClassName)} />
      <span className="text-muted-foreground">{label}</span>
      {value !== undefined && <span className="ml-auto pl-3 font-medium tabular-nums">{value}</span>}
    </div>
  )
}
