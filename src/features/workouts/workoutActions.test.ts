import { describe, expect, it } from 'vitest'
import type { Workout, WorkoutExercise } from '@/types/workout'
import { addSet, applyWeightToPendingSets, pause, restAfterCompleting, resume, setDone } from './workoutActions'
import { elapsedSeconds } from './workoutMath'

const ex = (id: string, name: string, sets: number, restBetweenSets = 90, restAfterExercise = 150): WorkoutExercise => ({
  id,
  exercise: { source: 'catalog', id, name },
  repsMin: 8,
  repsMax: 12,
  restBetweenSets,
  restAfterExercise,
  notes: '',
  sets: Array.from({ length: sets }, (_, i) => ({ id: `${id}-${i}`, weight: 60, reps: 10, done: false, warmup: false, completedAt: null })),
})

const base = (exercises: WorkoutExercise[]): Workout => ({
  id: 'w',
  routineId: null,
  routineName: 'R',
  status: 'active',
  source: 'live',
  startedAt: 0,
  endedAt: null,
  localDate: '2026-10-12',
  pausedAt: null,
  pausedMs: 0,
  exercises,
  notes: '',
  weightUnit: 'kg',
  exerciseKeys: [],
  summary: null,
  revision: 1,
})

describe('restAfterCompleting', () => {
  it('uses the rest between sets while the exercise has sets left', () => {
    const w = setDone(base([ex('bench', 'Press', 3), ex('row', 'Remo', 3)]), 'bench', 'bench-0', true, 1)
    expect(restAfterCompleting(w, 'bench')).toEqual({ seconds: 90, label: 'Serie 2 · Press', kind: 'between_sets' })
  })

  it('uses the rest before the next exercise after the last set', () => {
    let w = base([ex('bench', 'Press', 2), ex('row', 'Remo', 3)])
    w = setDone(w, 'bench', 'bench-0', true, 1)
    w = setDone(w, 'bench', 'bench-1', true, 2)
    expect(restAfterCompleting(w, 'bench')).toEqual({ seconds: 150, label: 'Siguiente: Remo', kind: 'between_exercises' })
  })

  it('points to an earlier exercise that still has pending sets', () => {
    let w = base([ex('bench', 'Press', 1), ex('row', 'Remo', 1)])
    w = setDone(w, 'row', 'row-0', true, 1)
    expect(restAfterCompleting(w, 'row')?.label).toBe('Siguiente: Press')
  })

  it('starts no timer when everything is done or the rest is 0 s', () => {
    let w = base([ex('bench', 'Press', 1)])
    w = setDone(w, 'bench', 'bench-0', true, 1)
    expect(restAfterCompleting(w, 'bench')).toBeNull()
    const noRest = setDone(base([ex('a', 'A', 2, 0)]), 'a', 'a-0', true, 1)
    expect(restAfterCompleting(noRest, 'a')).toBeNull()
  })
})

describe('session edits', () => {
  it('adds a set copying the last weight', () => {
    const w = addSet(base([ex('bench', 'Press', 2)]), 'bench')
    expect(w.exercises[0].sets).toHaveLength(3)
    expect(w.exercises[0].sets[2]).toMatchObject({ weight: 60, reps: null, done: false })
  })

  it('applies a suggested weight only to pending working sets', () => {
    let w = setDone(base([ex('bench', 'Press', 3)]), 'bench', 'bench-0', true, 1)
    w = applyWeightToPendingSets(w, 'bench', 62.5)
    expect(w.exercises[0].sets.map((s) => s.weight)).toEqual([60, 62.5, 62.5])
  })

  it('pause and resume exclude the paused time', () => {
    let w = base([])
    w = pause(w, 60_000)
    w = resume(w, 180_000)
    expect(w.pausedMs).toBe(120_000)
    expect(elapsedSeconds(w, 300_000)).toBe(180)
    expect(pause(pause(w, 1), 2).pausedAt).toBe(1) // idempotent
  })
})

describe('replaceExercise', () => {
  it('swaps the exercise, keeps the set count and clears logged values', async () => {
    const { replaceExercise } = await import('./workoutActions')
    const w = setDone(base([ex('bench', 'Press', 3)]), 'bench', 'bench-0', true, 1)
    const exercise = {
      ref: { source: 'catalog' as const, id: 'Pushups' }, key: 'catalog:Pushups', name: 'Flexiones', originalName: 'Pushups',
      primaryMuscles: [], secondaryMuscles: [], equipment: 'bodyweight' as const, type: 'strength' as const, level: null,
      instructions: [], instructionsLanguage: 'en' as const, images: [], suggestedSets: null, suggestedRepsMin: null, suggestedRepsMax: null,
    }
    const next = replaceExercise(w, 'bench', exercise)
    expect(next.exercises[0].exercise.name).toBe('Flexiones')
    expect(next.exercises[0].sets).toHaveLength(3)
    expect(next.exercises[0].sets.every((s) => !s.done && s.reps === null)).toBe(true)
  })
})
