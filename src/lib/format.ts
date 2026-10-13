export function formatDuration(ms: number): string {
  if (ms < 1000) return '0s'
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  const parts: string[] = []
  if (hours) parts.push(`${hours}h`)
  if (minutes) parts.push(`${minutes}m`)
  if (!hours && seconds) parts.push(`${seconds}s`)
  return parts.length ? parts.join(' ') : '0s'
}

export function formatRelativeTime(iso: string | null): string {
  if (!iso) return 'never'
  const diffMs = Date.now() - new Date(iso).getTime()
  if (diffMs < 5000) return 'just now'
  if (diffMs < 60000) return `${Math.floor(diffMs / 1000)}s ago`
  if (diffMs < 3600000) return `${Math.floor(diffMs / 60000)}m ago`
  if (diffMs < 86400000) return `${Math.floor(diffMs / 3600000)}h ago`
  return new Date(iso).toLocaleString()
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString()
}

/** Stopwatch-style "2d 03:04:05" / "03:04:05" for live timers. */
export function formatClock(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const days = Math.floor(totalSeconds / 86400)
  const pad = (n: number) => String(n).padStart(2, '0')
  const clock = [
    Math.floor((totalSeconds % 86400) / 3600),
    Math.floor((totalSeconds % 3600) / 60),
    totalSeconds % 60,
  ]
    .map(pad)
    .join(':')
  return days ? `${days}d ${clock}` : clock
}

/** Like formatDuration, but rolls hours into days for long totals. */
export function formatLongDuration(ms: number): string {
  ms = Math.max(0, ms)
  const days = Math.floor(ms / 86400000)
  if (!days) return formatDuration(ms)
  const rest = ms % 86400000
  return rest >= 60000 ? `${days}d ${formatDuration(rest)}` : `${days}d`
}

/** Local-midnight bounds for a "YYYY-MM-DD" date input, as ISO strings. */
export function dayStartIso(date: string): string {
  return new Date(`${date}T00:00:00`).toISOString()
}

export function dayEndIso(date: string): string {
  return new Date(`${date}T23:59:59.999`).toISOString()
}

const timeFmt = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' })
const dayFmt = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' })

function sameDay(a: Date, b: Date): boolean {
  return a.toDateString() === b.toDateString()
}

/** "Today 10:30 AM", "Yesterday 9:05 PM", "Oct 3, 4:12 PM". */
export function formatWhen(value: string | number | Date, now = Date.now()): string {
  const date = new Date(value)
  const today = new Date(now)
  const yesterday = new Date(now)
  yesterday.setDate(today.getDate() - 1)
  if (sameDay(date, today)) return `Today ${timeFmt.format(date)}`
  if (sameDay(date, yesterday)) return `Yesterday ${timeFmt.format(date)}`
  return `${dayFmt.format(date)}, ${timeFmt.format(date)}`
}

/** "Today 10:30 AM → 10:45 AM" — the end drops its day when it matches the start. */
export function formatSpan(start: string, end: string | null, now = Date.now()): string {
  if (!end) return `${formatWhen(start, now)} → now`
  const endLabel = sameDay(new Date(start), new Date(end))
    ? timeFmt.format(new Date(end))
    : formatWhen(end, now)
  return `${formatWhen(start, now)} → ${endLabel}`
}
