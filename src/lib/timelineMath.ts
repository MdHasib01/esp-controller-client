import type { TimelineSegment, TimelineState } from '@/lib/types'

export type DashboardRange = '24h' | '7d' | '30d'

export const RANGE_LABEL: Record<DashboardRange, string> = {
  '24h': 'Last 24 hours',
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
}

export interface Bucket {
  start: number
  end: number
  ms: Record<TimelineState, number>
}

/**
 * Bucket boundaries for a range, aligned to local clock hours (24h) or local
 * midnights (7d/30d) so columns line up with how people read time. The last
 * bucket is the current hour/day and ends at its natural boundary.
 */
export function rangeBuckets(range: DashboardRange, now: number): { start: number; end: number }[] {
  const d = new Date(now)
  if (range === '24h') {
    d.setMinutes(0, 0, 0)
    const lastStart = d.getTime()
    return Array.from({ length: 24 }, (_, i) => {
      const start = lastStart - (23 - i) * 3_600_000
      return { start, end: start + 3_600_000 }
    })
  }

  const days = range === '7d' ? 7 : 30
  d.setHours(0, 0, 0, 0)
  return Array.from({ length: days }, (_, i) => {
    const s = new Date(d)
    s.setDate(d.getDate() - (days - 1 - i))
    const e = new Date(s)
    e.setDate(s.getDate() + 1) // DST-safe, unlike +24h
    return { start: s.getTime(), end: e.getTime() }
  })
}

/** Start of the first bucket — the `from` the dashboard queries with. */
export function rangeStart(range: DashboardRange, now: number): number {
  return rangeBuckets(range, now)[0].start
}

function segmentEnd(segment: TimelineSegment, now: number): number {
  return segment.endedAt ? new Date(segment.endedAt).getTime() : now
}

/** Time spent in each state per bucket, clipped to the bucket and to now. */
export function fillBuckets(
  segments: TimelineSegment[],
  bounds: { start: number; end: number }[],
  now: number
): Bucket[] {
  const buckets = bounds.map((b) => ({
    ...b,
    ms: { connected: 0, unreachable: 0, power_cut: 0 } as Record<TimelineState, number>,
  }))

  for (const segment of segments) {
    const sStart = new Date(segment.startedAt).getTime()
    const sEnd = Math.min(segmentEnd(segment, now), now)
    for (const bucket of buckets) {
      const overlap = Math.min(sEnd, bucket.end) - Math.max(sStart, bucket.start)
      if (overlap > 0) bucket.ms[segment.state] += overlap
    }
  }
  return buckets
}

/** Segments clipped to [from, to] as fractions of that window, for the strip chart. */
export function stripSegments(
  segments: TimelineSegment[],
  from: number,
  to: number,
  now: number
): { segment: TimelineSegment; left: number; width: number }[] {
  const span = to - from
  return segments
    .map((segment) => {
      const start = Math.max(new Date(segment.startedAt).getTime(), from)
      const end = Math.min(segmentEnd(segment, now), to)
      return { segment, left: (start - from) / span, width: (end - start) / span }
    })
    .filter((s) => s.width > 0)
}

/** A "nice" axis max (1/2/5 × 10ⁿ in the unit) at or above the data max. */
export function niceMax(value: number, unitMs: number): number {
  const units = value / unitMs
  if (units <= 0) return unitMs
  const magnitude = 10 ** Math.floor(Math.log10(units))
  const step = [1, 2, 5, 10].find((m) => m * magnitude >= units) ?? 10
  return step * magnitude * unitMs
}
