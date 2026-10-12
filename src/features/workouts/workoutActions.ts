import { newId } from '@/features/routines/routineLogic'
import { routineExerciseFrom } from '@/features/routines/routineLogic'
import type { Exercise } from '@/types/exercise'
import { WORKOUT_LIMITS, type Workout, type WorkoutExercise, type WorkoutSet } from '@/types/workout'

/** Pure state transitions for a live session. Each returns a new Workout. */

function mapExercise(workout: Workout, exerciseId: string, change: (e: WorkoutExercise) => WorkoutExercise): Workout {
  return { ...workout, exercises: workout.exercises.map((e) => (e.id === exerciseId ? change(e) : e)) }
}

export function updateSet(workout: Workout, exerciseId: string, setId: string, patch: Partial<WorkoutSet>): Workout {
  return mapExercise(workout, exerciseId, (e) => ({
    ...e,
    sets: e.sets.map((s) => (s.id === setId ? { ...s, ...patch } : s)),
  }))
}

export function setDone(workout: Workout, exerciseId: string, setId: string, done: boolean, now: number): Workout {
  return updateSet(workout, exerciseId, setId, { done, completedAt: done ? now : null })
}

/** Adds a set copying the last set's weight (the usual case at the gym). */
export function addSet(workout: Workout, exerciseId: string): Workout {
  return mapExercise(workout, exerciseId, (e) => {
    if (e.sets.length >= WORKOUT_LIMITS.setsMax) return e
    const last = e.sets.at(-1)
    return {
      ...e,
      sets: [...e.sets, { id: newId(), weight: last?.weight ?? null, reps: null, done: false, warmup: false, completedAt: null }],
    }
  })
}

export function removeSet(workout: Workout, exerciseId: string, setId: string): Workout {
  return mapExercise(workout, exerciseId, (e) => ({ ...e, sets: e.sets.filter((s) => s.id !== setId) }))
}

export function updateExercise(workout: Workout, exerciseId: string, patch: Partial<WorkoutExercise>): Workout {
  return mapExercise(workout, exerciseId, (e) => ({ ...e, ...patch }))
}

export function removeExercise(workout: Workout, exerciseId: string): Workout {
  return { ...workout, exercises: workout.exercises.filter((e) => e.id !== exerciseId) }
}

/** Adds exercises to the session only; the routine is never modified. */
export function addExercises(workout: Workout, exercises: Exercise[]): Workout {
  const added: WorkoutExercise[] = exercises.map((exercise) => {
    const item = routineExerciseFrom(exercise)
    return {
      id: newId(),
      exercise: item.exercise,
      repsMin: item.repsMin,
      repsMax: item.repsMax,
      restBetweenSets: item.restBetweenSets,
      restAfterExercise: item.restAfterExercise,
      notes: '',
      sets: Array.from({ length: item.sets }, () => ({
        id: newId(),
        weight: null,
        reps: null,
        done: false,
        warmup: false,
        completedAt: null,
      })),
    }
  })
  return { ...workout, exercises: [...workout.exercises, ...added].slice(0, WORKOUT_LIMITS.exercisesMax) }
}

/** Sets the weight of every set that is not done yet (used by progression suggestions). */
export function applyWeightToPendingSets(workout: Workout, exerciseId: string, weight: number): Workout {
  return mapExercise(workout, exerciseId, (e) => ({
    ...e,
    sets: e.sets.map((s) => (s.done || s.warmup ? s : { ...s, weight })),
  }))
}

export function pause(workout: Workout, now: number): Workout {
  return workout.pausedAt !== null ? workout : { ...workout, pausedAt: now }
}

export function resume(workout: Workout, now: number): Workout {
  if (workout.pausedAt === null) return workout
  return { ...workout, pausedAt: null, pausedMs: workout.pausedMs + Math.max(0, now - workout.pausedAt) }
}

export interface RestPlan {
  seconds: number
  /** What comes after the rest, e.g. "Serie 3 · Press de banca". */
  label: string
  kind: 'between_sets' | 'between_exercises'
}

/**
 * Rest to start after completing a set:
 * - more sets left in this exercise → its "rest between sets";
 * - exercise finished and another one pending → its "rest before the next exercise";
 * - nothing left (or a 0 s rest configured) → no timer.
 * Call with the workout *after* the set was marked done.
 */
export function restAfterCompleting(workout: Workout, exerciseId: string): RestPlan | null {
  const index = workout.exercises.findIndex((e) => e.id === exerciseId)
  const exercise = workout.exercises[index]
  if (!exercise) return null

  const nextSetIndex = exercise.sets.findIndex((s) => !s.done)
  if (nextSetIndex !== -1) {
    if (exercise.restBetweenSets <= 0) return null
    return {
      seconds: exercise.restBetweenSets,
      label: `Serie ${nextSetIndex + 1} · ${exercise.exercise.name}`,
      kind: 'between_sets',
    }
  }

  // Next exercise with pending sets: first those after this one, then any earlier one.
  const ordered = [...workout.exercises.slice(index + 1), ...workout.exercises.slice(0, index)]
  const next = ordered.find((e) => e.sets.some((s) => !s.done))
  if (!next || exercise.restAfterExercise <= 0) return null
  return { seconds: exercise.restAfterExercise, label: `Siguiente: ${next.exercise.name}`, kind: 'between_exercises' }
}

export function pendingSetCount(workout: Workout): number {
  return workout.exercises.reduce((sum, e) => sum + e.sets.filter((s) => !s.done).length, 0)
}

/**
 * Swaps the exercise at `exerciseId` for another one (session only). Keeps the
 * number of sets and the rest times; logged values are cleared because they
 * belonged to the previous exercise.
 */
export function replaceExercise(workout: Workout, exerciseId: string, exercise: Exercise): Workout {
  const replacement = addExercises({ ...workout, exercises: [] }, [exercise]).exercises[0]
  return mapExercise(workout, exerciseId, (e) => ({
    ...e,
    exercise: replacement.exercise,
    repsMin: replacement.repsMin,
    repsMax: replacement.repsMax,
    notes: '',
    sets: e.sets.map((s) => ({ ...s, weight: null, reps: null, done: false, warmup: false, completedAt: null })),
  }))
}
