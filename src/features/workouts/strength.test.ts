import { describe, expect, it } from 'vitest'
import type { Workout } from '@/types/workout'
import { bestOneRepMax, estimateOneRepMax, repRecords } from './strength'

const session = (day: string, sets: Array<[number, number]>, extra: Partial<Workout> = {}): Workout => ({
  id: day,
  routineId: null,
  routineName: 'R',
  status: 'completed',
  source: 'live',
  startedAt: new Date(`${day}T10:00:00`).getTime(),
  endedAt: null,
  localDate: day,
  pausedAt: null,
  pausedMs: 0,
  exercises: [
    {
      id: 'e',
      exercise: { source: 'catalog', id: 'bench', name: 'Press' },
      repsMin: 8,
      repsMax: 12,
      restBetweenSets: 90,
      restAfterExercise: 120,
      notes: '',
      sets: sets.map(([weight, reps], i) => ({ id: `${day}-${i}`, weight, reps, done: true, warmup: false, completedAt: 0 })),
    },
  ],
  notes: '',
  weightUnit: 'kg',
  exerciseKeys: ['catalog:bench'],
  summary: null,
  revision: 1,
  ...extra,
})

describe('estimateOneRepMax', () => {
  it('uses Epley and the weight itself for a single', () => {
    expect(estimateOneRepMax(100, 1)).toBe(100)
    expect(estimateOneRepMax(100, 10)).toBeCloseTo(133.3, 1)
  })

  it('gives no estimate for very high reps or no load', () => {
    expect(estimateOneRepMax(50, 15)).toBeNull()
    expect(estimateOneRepMax(0, 5)).toBeNull()
  })
})

describe('strength records', () => {
  const history = [session('2026-10-01', [[80, 8], [80, 6]]), session('2026-10-05', [[90, 3], [70, 12], [60, 20]])]

  it('finds the best estimated 1RM and the set it comes from', () => {
    // 80×8 → 101.3 ; 90×3 → 99 ; 70×12 → 98 ; 60×20 → ignored
    expect(bestOneRepMax(history, 'catalog:bench', 'kg')).toEqual({ value: 101.3, weight: 80, reps: 8, date: '2026-10-01' })
  })

  it('lists the heaviest weight for at least N reps', () => {
    const records = repRecords(history, 'catalog:bench', 'kg')
    expect(records.map((r) => [r.reps, r.weight])).toEqual([
      [1, 90],
      [3, 90],
      [5, 80],
      [8, 80],
      [10, 70],
      [12, 70],
    ])
  })

  it('converts to the user unit', () => {
    expect(repRecords(history, 'catalog:bench', 'lb')[0].weight).toBeCloseTo(198.4, 1)
  })
})
