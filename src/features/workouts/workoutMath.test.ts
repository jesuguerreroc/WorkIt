import { describe, expect, it } from 'vitest'
import type { Workout, WorkoutExercise, WorkoutSet } from '@/types/workout'
import { computeAchievements } from '@/features/streaks/achievements'
import { suggestProgression } from './progression'
import {
  detectRecords,
  elapsedSeconds,
  isValidWorkout,
  previousPerformance,
  summarizeWorkout,
  toKg,
  workoutVolumeKg,
} from './workoutMath'

let seq = 0
const set = (weight: number | null, reps: number | null, extra: Partial<WorkoutSet> = {}): WorkoutSet => ({
  id: `s${seq++}`,
  weight,
  reps,
  done: true,
  warmup: false,
  completedAt: 0,
  ...extra,
})

const exercise = (id: string, sets: WorkoutSet[], repsMax = 12): WorkoutExercise => ({
  id: `e-${id}-${seq++}`,
  exercise: { source: 'catalog', id, name: id },
  repsMin: 8,
  repsMax,
  restBetweenSets: 90,
  restAfterExercise: 120,
  notes: '',
  sets,
})

const workout = (id: string, day: string, exercises: WorkoutExercise[], extra: Partial<Workout> = {}): Workout => ({
  id,
  routineId: null,
  routineName: 'Test',
  status: 'completed',
  source: 'live',
  startedAt: new Date(`${day}T10:00:00`).getTime(),
  endedAt: new Date(`${day}T11:00:00`).getTime(),
  localDate: day,
  pausedAt: null,
  pausedMs: 0,
  exercises,
  notes: '',
  weightUnit: 'kg',
  exerciseKeys: exercises.map((e) => `catalog:${e.exercise.id}`),
  summary: null,
  revision: 1,
  ...extra,
})

describe('volume', () => {
  it('sums weight × reps of completed working sets only', () => {
    const w = workout('w', '2026-10-12', [
      exercise('bench', [set(60, 10), set(60, 8), set(40, 10, { warmup: true }), set(60, 10, { done: false })]),
    ])
    expect(workoutVolumeKg(w)).toBe(60 * 10 + 60 * 8)
  })

  it('converts pounds so units never mix', () => {
    const w = workout('w', '2026-10-12', [exercise('bench', [set(100, 10)])], { weightUnit: 'lb' })
    expect(workoutVolumeKg(w)).toBeCloseTo(toKg(100, 'lb') * 10, 5)
  })

  it('ignores bodyweight sets without load', () => {
    const w = workout('w', '2026-10-12', [exercise('pullups', [set(null, 10)])])
    expect(workoutVolumeKg(w)).toBe(0)
  })
})

describe('validity and duration', () => {
  it('needs at least one completed set with reps', () => {
    expect(isValidWorkout(workout('w', '2026-10-12', [exercise('a', [set(60, null), set(60, 5, { done: false })])]))).toBe(false)
    expect(isValidWorkout(workout('w', '2026-10-12', [exercise('a', [set(null, 12)])]))).toBe(true)
  })

  it('excludes paused time, including an ongoing pause', () => {
    const base = { startedAt: 0, endedAt: null, pausedAt: null, pausedMs: 60_000 }
    expect(elapsedSeconds(base, 600_000)).toBe(540)
    expect(elapsedSeconds({ ...base, pausedAt: 500_000 }, 600_000)).toBe(440)
  })
})

describe('records', () => {
  const history = [workout('h1', '2026-10-01', [exercise('bench', [set(60, 10), set(60, 9)])])]

  it('detects a heavier weight', () => {
    const now = workout('now', '2026-10-12', [exercise('bench', [set(62.5, 8)])])
    expect(detectRecords(now, history)).toEqual([
      expect.objectContaining({ exerciseKey: 'catalog:bench', kind: 'weight', value: 62.5, previous: 60 }),
    ])
  })

  it('detects a better set (weight × reps) at the same weight', () => {
    const now = workout('now', '2026-10-12', [exercise('bench', [set(60, 12)])])
    expect(detectRecords(now, history)[0]).toMatchObject({ kind: 'set_volume', value: 720, previous: 600 })
  })

  it('does not call a first-ever exercise a record', () => {
    const now = workout('now', '2026-10-12', [exercise('squat', [set(100, 5)])])
    expect(detectRecords(now, history)).toEqual([])
  })

  it('ignores later sessions and warm-ups', () => {
    const later = workout('later', '2026-10-20', [exercise('bench', [set(80, 5)])])
    const now = workout('now', '2026-10-12', [exercise('bench', [set(62.5, 8), set(100, 1, { warmup: true })])])
    expect(detectRecords(now, [...history, later])).toEqual([expect.objectContaining({ value: 62.5 })])
  })

  it('summarises a session', () => {
    const start = new Date('2026-10-12T18:00:00').getTime()
    const now = workout('now', '2026-10-12', [exercise('bench', [set(62.5, 8), set(62.5, 8)])], {
      startedAt: start,
      endedAt: null,
    })
    const summary = summarizeWorkout(now, history, start + 45 * 60_000)
    expect(summary).toMatchObject({ durationSec: 2700, exercisesDone: 1, setsDone: 2, totalReps: 16, volumeKg: 1000 })
    expect(summary.records).toHaveLength(1)
  })
})

describe('previousPerformance', () => {
  it('returns the latest earlier session with that exercise', () => {
    const a = workout('a', '2026-10-01', [exercise('bench', [set(55, 10)])])
    const b = workout('b', '2026-10-05', [exercise('bench', [set(60, 10)])])
    const c = workout('c', '2026-10-08', [exercise('squat', [set(100, 5)])])
    const prev = previousPerformance([a, b, c], 'catalog:bench')
    expect(prev?.workoutId).toBe('b')
    expect(prev?.sets[0].weight).toBe(60)
  })
})

describe('suggestProgression', () => {
  const session = (id: string, day: string, reps: number[], weight = 60) =>
    workout(id, day, [exercise('bench', reps.map((r) => set(weight, r)), 12)])

  it('suggests +2.5 kg after two sessions at the top of the range', () => {
    const history = [session('a', '2026-10-01', [12, 12, 12]), session('b', '2026-10-05', [12, 12, 13])]
    expect(suggestProgression(history, 'catalog:bench', 'kg')).toEqual({ currentWeight: 60, suggestedWeight: 62.5, unit: 'kg', sessions: 2 })
  })

  it('suggests +5 lb for pound users', () => {
    const history = [session('a', '2026-10-01', [12, 12]), session('b', '2026-10-05', [12, 12])]
    expect(suggestProgression(history, 'catalog:bench', 'lb')?.suggestedWeight).toBeCloseTo(137.3, 1)
  })

  it('needs every working set at the top of the range', () => {
    const history = [session('a', '2026-10-01', [12, 12, 12]), session('b', '2026-10-05', [12, 11, 12])]
    expect(suggestProgression(history, 'catalog:bench', 'kg')).toBeNull()
  })

  it('needs two sessions and the same load', () => {
    expect(suggestProgression([session('a', '2026-10-01', [12, 12])], 'catalog:bench', 'kg')).toBeNull()
    const history = [session('a', '2026-10-01', [12, 12], 57.5), session('b', '2026-10-05', [12, 12], 60)]
    expect(suggestProgression(history, 'catalog:bench', 'kg')).toBeNull()
  })
})

describe('achievements', () => {
  it('derives milestones from valid completed sessions', () => {
    const days = ['2026-10-01', '2026-10-02', '2026-10-03']
    const sessions = days.map((d, i) => workout(`w${i}`, d, [exercise('bench', [set(60, 10)])]))
    const invalid = workout('x', '2026-10-04', [exercise('bench', [set(60, 10, { done: false })])])
    const list = computeAchievements([...sessions, invalid], 3)
    expect(list.find((a) => a.id === 'sessions-1')?.achievedOn).toBe('2026-10-01')
    expect(list.find((a) => a.id === 'sessions-10')?.achievedOn).toBeNull()
    expect(list.find((a) => a.id === 'streak-3')?.achievedOn).toBe('2026-10-03')
    expect(list.find((a) => a.id === 'streak-7')?.progress).toBeCloseTo(3 / 7)
  })
})
