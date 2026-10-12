import { addDays, daysBetween } from '@/lib/dates'

/**
 * Streak rules (see the product brief, section 12):
 * 1. Only finished sessions with real activity count (callers pass those dates).
 * 2. Several sessions on one day count once (dates are de-duplicated).
 * 3. Back-dated sessions simply add their day; duplicates never inflate the streak.
 * 4. The streak is derived from unique local calendar days.
 * 5. Training today extends the streak.
 * 6. If today has no session yet, yesterday's streak is still alive (not shown as lost).
 * 7. If the last session was before yesterday, the current streak is 0.
 * 8. Month/year boundaries and DST are handled by working on "YYYY-MM-DD" keys.
 * 9. Keys are local days, never UTC.
 * 10. Future dates (clock skew, bad input) are ignored.
 */

export interface StreakInfo {
  current: number
  best: number
  trainedToday: boolean
  /** True when the streak continues from yesterday and today is still open. */
  pendingToday: boolean
  lastDay: string | null
  /** Unique, sorted training days up to today. */
  days: string[]
}

export function computeStreaks(dates: Iterable<string>, today: string): StreakInfo {
  const days = [...new Set(dates)].filter((d) => daysBetween(d, today) >= 0).sort()

  let best = 0
  let run = 0
  let previous: string | null = null
  for (const day of days) {
    run = previous !== null && daysBetween(previous, day) === 1 ? run + 1 : 1
    best = Math.max(best, run)
    previous = day
  }

  const lastDay = days.at(-1) ?? null
  const trainedToday = lastDay === today
  const yesterday = addDays(today, -1)
  const alive = lastDay !== null && (lastDay === today || lastDay === yesterday)

  return {
    current: alive ? run : 0,
    best,
    trainedToday,
    pendingToday: alive && !trainedToday,
    lastDay,
    days,
  }
}

/** First day on which a streak of `length` consecutive days was reached, or null. */
export function firstDayReachingStreak(days: string[], length: number): string | null {
  let run = 0
  let previous: string | null = null
  for (const day of [...new Set(days)].sort()) {
    run = previous !== null && daysBetween(previous, day) === 1 ? run + 1 : 1
    if (run >= length) return day
    previous = day
  }
  return null
}
