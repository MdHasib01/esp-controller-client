import { useEffect, useState } from 'react'

/** Re-renders the calling component every `intervalMs` — for live-ticking durations/timestamps. */
export function useNowTick(intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])

  return now
}
