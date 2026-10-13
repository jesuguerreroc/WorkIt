import { addDays, dateFromKey, daysBetween } from '@/lib/dates'
import type { Weekday } from '@/types/profile'

/**
 * Streak rules (see the product brief, section 12):
 * 1. Only finished sessions with real activity count (callers pass those dates).
 * 2. Several sessions on one day count once (dates are de-duplicated).
 * 3. Back-dated sessions simply add their day; duplicates never inflate the streak.
 * 4. The streak is derived from unique local calendar days.
 * 5. Training today extends the streak.
 * 6. If today has no session yet, the streak is still alive (not shown as lost).
 * 7. Strict mode: if the last session was before yesterday, the streak is 0.
 * 8. Month/year boundaries and DST are handled by working on "YYYY-MM-DD" keys.
 * 9. Keys are local days, never UTC.
 * 10. Future dates (clock skew, bad input) are ignored.
 *
 * Flexible mode (opt-in): days that are not planned training days never break the
 * streak, and up to `allowedMisses` planned days in a row may be skipped. Skipped
 * days never add to the count — only trained days do.
 */

export interface StreakOptions {
  mode: 'strict' | 'flexible'
  /** ISO weekdays the user plans to train. Empty = every day counts as planned. */
  plannedDays: Weekday[]
  /** Flexible mode: consecutive planned days that may be missed without breaking. */
  allowedMisses: number
}

export const STRICT: StreakOptions = { mode: 'strict', plannedDays: [], allowedMisses: 0 }

export interface StreakInfo {
  current: number
  best: number
  trainedToday: boolean
  /** True when the streak is alive and today is still open. */
  pendingToday: boolean
  lastDay: string | null
  /** Unique, sorted training days up to today. */
  days: string[]
  /** Streak length reached on each training day, in order (for milestones). */
  runs: Array<{ day: string; run: number }>
}

/** ISO weekday (1 = Monday … 7 = Sunday) of a date key. */
function weekdayOf(key: string): Weekday {
  return (((dateFromKey(key).getDay() + 6) % 7) + 1) as Weekday
}

export function computeStreaks(dates: Iterable<string>, today: string, options: StreakOptions = STRICT): StreakInfo {
  const days = [...new Set(dates)].filter((d) => daysBetween(d, today) >= 0).sort()
  const lastDay = days.at(-1) ?? null
  const trainedToday = lastDay === today
  const runs: StreakInfo['runs'] = []
  let best = 0
  let current = 0

  if (options.mode === 'strict') {
    let run = 0
    let previous: string | null = null
    for (const day of days) {
      run = previous !== null && daysBetween(previous, day) === 1 ? run + 1 : 1
      runs.push({ day, run })
      best = Math.max(best, run)
      previous = day
    }
    const alive = lastDay !== null && (lastDay === today || lastDay === addDays(today, -1))
    current = alive ? run : 0
  } else if (days.length > 0) {
    const trained = new Set(days)
    const planned = (day: string) => options.plannedDays.length === 0 || options.plannedDays.includes(weekdayOf(day))
    let run = 0
    let missed = 0
    for (let day = days[0]; day <= today; day = addDays(day, 1)) {
      if (trained.has(day)) {
        run += 1
        missed = 0
        runs.push({ day, run })
        best = Math.max(best, run)
      } else if (day !== today && planned(day)) {
        missed += 1
        if (missed > options.allowedMisses) run = 0
      }
    }
    current = run
  }

  return { current, best, trainedToday, pendingToday: current > 0 && !trainedToday, lastDay, days, runs }
}

/** First day on which a streak of `length` was reached, or null. */
export function firstDayReachingStreak(streak: StreakInfo, length: number): string | null {
  return streak.runs.find((r) => r.run >= length)?.day ?? null
}
