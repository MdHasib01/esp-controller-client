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
