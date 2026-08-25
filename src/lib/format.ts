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
