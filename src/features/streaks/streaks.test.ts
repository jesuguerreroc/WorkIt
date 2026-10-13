import { describe, expect, it } from 'vitest'
import { addDays, daysBetween, isValidDateKey, localDateKey, startOfWeek } from '@/lib/dates'
import type { Weekday } from '@/types/profile'
import { computeStreaks, firstDayReachingStreak } from './streaks'

describe('date keys', () => {
  it('uses the LOCAL calendar day, not UTC', () => {
    // 23:30 local time stays on the same local day whatever the time zone.
    expect(localDateKey(new Date(2026, 9, 12, 23, 30))).toBe('2026-10-12')
    expect(localDateKey(new Date(2026, 9, 13, 0, 5))).toBe('2026-10-13')
  })

  it('adds days across month and year boundaries', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01')
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2027-01-01', -1)).toBe('2026-12-31')
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29') // leap year
  })

  it('counts whole days across DST changes', () => {
    // Europe and the Americas change clocks in March/October-November; days stay 1 apart.
    expect(daysBetween('2026-03-28', '2026-03-29')).toBe(1)
    expect(daysBetween('2026-10-24', '2026-10-26')).toBe(2)
    expect(daysBetween('2026-11-01', '2026-11-02')).toBe(1)
  })

  it('finds the Monday of the week', () => {
    expect(startOfWeek('2026-10-12')).toBe('2026-10-12') // Monday
    expect(startOfWeek('2026-10-18')).toBe('2026-10-12') // Sunday
    expect(startOfWeek('2027-01-01')).toBe('2026-12-28') // Friday, previous year
  })

  it('validates date keys', () => {
    expect(isValidDateKey('2026-02-29')).toBe(false)
    expect(isValidDateKey('2028-02-29')).toBe(true)
    expect(isValidDateKey('2026-13-01')).toBe(false)
    expect(isValidDateKey('26-1-1')).toBe(false)
  })
})

describe('computeStreaks', () => {
  const today = '2026-10-12'

  it('starts at zero with no sessions', () => {
    expect(computeStreaks([], today)).toMatchObject({ current: 0, best: 0, trainedToday: false, lastDay: null })
  })

  it('rule 5: training today extends the streak', () => {
    const s = computeStreaks(['2026-10-10', '2026-10-11', '2026-10-12'], today)
    expect(s).toMatchObject({ current: 3, best: 3, trainedToday: true, pendingToday: false })
  })

  it('rule 6: yesterday’s streak stays alive while today is still open', () => {
    const s = computeStreaks(['2026-10-10', '2026-10-11'], today)
    expect(s).toMatchObject({ current: 2, trainedToday: false, pendingToday: true })
  })

  it('rule 7: a gap before yesterday breaks the streak but keeps the record', () => {
    const s = computeStreaks(['2026-10-01', '2026-10-02', '2026-10-03', '2026-10-10'], today)
    expect(s).toMatchObject({ current: 0, best: 3, pendingToday: false })
  })

  it('rule 2/10: several sessions on the same day count once', () => {
    const s = computeStreaks(['2026-10-12', '2026-10-12', '2026-10-11', '2026-10-11', '2026-10-11'], today)
    expect(s.current).toBe(2)
    expect(s.days).toEqual(['2026-10-11', '2026-10-12'])
  })

  it('rule 3: a back-dated session fills its day without duplicating', () => {
    const before = computeStreaks(['2026-10-10', '2026-10-12'], today)
    expect(before.current).toBe(1)
    const after = computeStreaks(['2026-10-10', '2026-10-12', '2026-10-11'], today)
    expect(after.current).toBe(3)
    const again = computeStreaks(['2026-10-10', '2026-10-12', '2026-10-11', '2026-10-11'], today)
    expect(again.current).toBe(3)
  })

  it('rule 8: streaks cross month and year boundaries', () => {
    expect(computeStreaks(['2026-09-30', '2026-10-01'], '2026-10-01').current).toBe(2)
    expect(computeStreaks(['2026-12-30', '2026-12-31', '2027-01-01'], '2027-01-01').current).toBe(3)
  })

  it('order of input does not matter', () => {
    expect(computeStreaks(['2026-10-12', '2026-10-10', '2026-10-11'], today).current).toBe(3)
  })

  it('ignores future dates (clock skew or bad data)', () => {
    const s = computeStreaks(['2026-10-12', '2026-10-13', '2026-10-14'], today)
    expect(s).toMatchObject({ current: 1, best: 1, lastDay: '2026-10-12' })
  })

  it('tracks the best streak across separate runs', () => {
    const s = computeStreaks(['2026-09-01', '2026-09-02', '2026-09-03', '2026-09-04', '2026-10-11', '2026-10-12'], today)
    expect(s).toMatchObject({ current: 2, best: 4 })
  })
})

describe('firstDayReachingStreak', () => {
  it('returns the day a milestone was first reached', () => {
    const s = computeStreaks(['2026-10-01', '2026-10-02', '2026-10-04', '2026-10-05', '2026-10-06'], '2026-10-12')
    expect(firstDayReachingStreak(s, 3)).toBe('2026-10-06')
    expect(firstDayReachingStreak(s, 2)).toBe('2026-10-02')
    expect(firstDayReachingStreak(s, 7)).toBeNull()
  })
})

describe('flexible streaks', () => {
  // Plan Monday–Friday; 2026-10-05 is a Monday.
  const flex = (allowedMisses: number) => ({ mode: 'flexible' as const, plannedDays: [1, 2, 3, 4, 5] as Weekday[], allowedMisses })

  it('skipping one planned day keeps the streak but does not count it', () => {
    // Mon, Tue, (skip Wed), Thu, Fri
    const s = computeStreaks(['2026-10-05', '2026-10-06', '2026-10-08', '2026-10-09'], '2026-10-09', flex(1))
    expect(s.current).toBe(4)
  })

  it('unplanned days (weekend) never break it', () => {
    const s = computeStreaks(['2026-10-08', '2026-10-09', '2026-10-12'], '2026-10-12', flex(0))
    expect(s.current).toBe(3)
  })

  it('missing more planned days in a row than allowed breaks it', () => {
    // Mon, Tue, then miss Wed+Thu (2 > 1 allowed), Fri
    const s = computeStreaks(['2026-10-05', '2026-10-06', '2026-10-09'], '2026-10-09', flex(1))
    expect(s).toMatchObject({ current: 1, best: 2 })
  })

  it('today being open never counts as a miss', () => {
    const s = computeStreaks(['2026-10-08', '2026-10-09'], '2026-10-12', flex(0))
    expect(s).toMatchObject({ current: 2, pendingToday: true, trainedToday: false })
  })

  it('strict mode keeps the original rules', () => {
    expect(computeStreaks(['2026-10-05', '2026-10-06', '2026-10-08'], '2026-10-08').current).toBe(1)
  })
})
