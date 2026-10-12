import { describe, expect, it } from 'vitest'
import type { Workout } from '@/types/workout'
import { exerciseSeries, exercisesInHistory, filterByDate, monthCalendar, weeklyBuckets } from './progressData'

let n = 0
const w = (day: string, weight: number | null, reps: number, extra: Partial<Workout> = {}): Workout => ({
  id: `w${n++}`,
  routineId: null,
  routineName: 'R',
  status: 'completed',
  source: 'live',
  startedAt: new Date(`${day}T10:00:00`).getTime(),
  endedAt: new Date(`${day}T11:00:00`).getTime(),
  localDate: day,
  pausedAt: null,
  pausedMs: 0,
  exercises: [
    {
      id: `e${n}`,
      exercise: { source: 'catalog', id: 'bench', name: 'Press de banca' },
      repsMin: 8,
      repsMax: 12,
      restBetweenSets: 90,
      restAfterExercise: 120,
      notes: '',
      sets: [{ id: `s${n}`, weight, reps, done: true, warmup: false, completedAt: 0 }],
    },
  ],
  notes: '',
  weightUnit: 'kg',
  exerciseKeys: ['catalog:bench'],
  summary: null,
  revision: 1,
  ...extra,
})

describe('weeklyBuckets', () => {
  it('groups by Monday-based weeks, includes empty weeks, oldest first', () => {
    const list = [w('2026-10-12', 60, 10), w('2026-10-13', 60, 10), w('2026-10-05', 50, 10)]
    const buckets = weeklyBuckets(list, '2026-10-14', 3, 'kg')
    expect(buckets.map((b) => b.weekStart)).toEqual(['2026-09-28', '2026-10-05', '2026-10-12'])
    expect(buckets.map((b) => b.sessions)).toEqual([0, 1, 2])
    expect(buckets[2].volume).toBe(1200)
  })

  it('ignores active and invalid sessions', () => {
    const list = [w('2026-10-12', 60, 10, { status: 'active' }), w('2026-10-12', 60, 0)]
    expect(weeklyBuckets(list, '2026-10-12', 1, 'kg')[0].sessions).toBe(0)
  })
})

describe('monthCalendar', () => {
  it('pads to Monday and marks trained, today and future days', () => {
    // October 2026 starts on a Thursday → 3 empty cells.
    const cells = monthCalendar(2026, 9, [w('2026-10-12', 60, 10), w('2026-10-12', 60, 10)], '2026-10-12')
    expect(cells.slice(0, 3)).toEqual([null, null, null])
    const twelfth = cells.find((c) => c?.day === 12)!
    expect(twelfth).toMatchObject({ trained: true, isToday: true, sessions: 2 })
    expect(cells.find((c) => c?.day === 20)?.isFuture).toBe(true)
    expect(cells.filter(Boolean)).toHaveLength(31)
  })
})

describe('exercise progress', () => {
  const list = [w('2026-10-01', 55, 10), w('2026-10-05', 60, 8), w('2026-10-08', null, 12)]

  it('lists exercises from history', () => {
    expect(exercisesInHistory(list)).toEqual([{ key: 'catalog:bench', name: 'Press de banca', sessions: 3 }])
  })

  it('builds one point per session with top weight in the user unit', () => {
    const series = exerciseSeries(list, 'catalog:bench', 'kg')
    expect(series.map((p) => p.topWeight)).toEqual([55, 60, null])
    expect(series.map((p) => p.bestReps)).toEqual([10, 8, 12])
    expect(exerciseSeries(list, 'catalog:bench', 'lb')[1].topWeight).toBeCloseTo(132.3, 1)
  })

  it('filters history by inclusive date range', () => {
    expect(filterByDate(list, '2026-10-05', '2026-10-08').map((x) => x.localDate)).toEqual(['2026-10-08', '2026-10-05'])
  })
})
