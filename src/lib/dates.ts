/**
 * Calendar-day helpers. A "date key" is "YYYY-MM-DD" in the user's LOCAL time
 * zone. All streak and calendar logic works on date keys, never on UTC
 * timestamps, so a session at 23:30 counts for that evening's day.
 */
export const APP_LOCALE = 'es'

export function localDateKey(date: Date | number): string {
  const d = typeof date === 'number' ? new Date(date) : date
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Local midnight of a date key. */
export function dateFromKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** Adds calendar days (DST-safe: works on y/m/d, not on milliseconds). */
export function addDays(key: string, days: number): string {
  const date = dateFromKey(key)
  date.setDate(date.getDate() + days)
  return localDateKey(date)
}

/** Whole calendar days from `a` to `b` (b − a). */
export function daysBetween(a: string, b: string): number {
  const [ya, ma, da] = a.split('-').map(Number)
  const [yb, mb, db] = b.split('-').map(Number)
  return Math.round((Date.UTC(yb, mb - 1, db) - Date.UTC(ya, ma - 1, da)) / 86_400_000)
}

/** Monday of the week containing `key`. */
export function startOfWeek(key: string): string {
  const day = dateFromKey(key).getDay() // 0 = Sunday
  return addDays(key, -((day + 6) % 7))
}

export function isValidDateKey(key: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return false
  return localDateKey(dateFromKey(key)) === key
}

/** "lunes, 12 de octubre". */
export function formatLongDate(date: Date): string {
  return new Intl.DateTimeFormat(APP_LOCALE, { weekday: 'long', day: 'numeric', month: 'long' }).format(date)
}

/** "12 oct 2026". */
export function formatShortDate(key: string): string {
  return new Intl.DateTimeFormat(APP_LOCALE, { day: 'numeric', month: 'short', year: 'numeric' }).format(dateFromKey(key))
}

/** "12 oct". */
export function formatDayMonth(key: string): string {
  return new Intl.DateTimeFormat(APP_LOCALE, { day: 'numeric', month: 'short' }).format(dateFromKey(key))
}

/** "1:05:09" or "45:09". */
export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = String(s % 60).padStart(2, '0')
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`
}

/** "1 h 5 min" / "45 min". */
export function formatDuration(totalSeconds: number): string {
  const minutes = Math.round(totalSeconds / 60)
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m ? `${h} h ${m} min` : `${h} h`
}
