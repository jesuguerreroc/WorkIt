import { useEffect, useState } from 'react'

/** Current time, refreshed every `interval` ms while `active`. */
export function useNow(interval = 1000, active = true): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!active) return
    const id = setInterval(() => setNow(Date.now()), interval)
    return () => clearInterval(id)
  }, [interval, active])
  return now
}
