import { exerciseKey } from '@/types/exercise'
import type { WeightUnit } from '@/types/profile'
import type { Workout } from '@/types/workout'
import { fromKg, isWorkingSet, roundWeight, toKg } from './workoutMath'

/** Increment suggested when the top of the rep range is reached consistently. */
export const PROGRESSION_STEP: Record<WeightUnit, number> = { kg: 2.5, lb: 5 }
/** Consecutive sessions that must hit the top of the range. */
export const SESSIONS_REQUIRED = 2

export interface ProgressionSuggestion {
  /** Weight used in those sessions, in the user's unit. */
  currentWeight: number
  suggestedWeight: number
  unit: WeightUnit
  sessions: number
}

/**
 * Simple, explainable rule (no AI): if in each of the last 2 sessions with this
 * exercise every working set reached the top of its rep range with the same
 * weight, suggest a small increase. It is a suggestion the user can accept,
 * change or ignore; the app cannot judge technique.
 */
export function suggestProgression(history: Workout[], key: string, unit: WeightUnit): ProgressionSuggestion | null {
  const sessions = history
    .filter((w) => w.status === 'completed')
    .map((w) => ({ workout: w, exercise: w.exercises.find((e) => exerciseKey(e.exercise) === key) }))
    .filter((s): s is { workout: Workout; exercise: NonNullable<typeof s.exercise> } => Boolean(s.exercise))
    .sort((a, b) => b.workout.startedAt - a.workout.startedAt)
    .slice(0, SESSIONS_REQUIRED)

  if (sessions.length < SESSIONS_REQUIRED) return null

  const weightsKg: number[] = []
  for (const { workout, exercise } of sessions) {
    const working = exercise.sets.filter((s) => !s.warmup)
    if (working.length === 0 || !working.every((s) => isWorkingSet(s) && (s.reps ?? 0) >= exercise.repsMax)) return null
    const top = Math.max(...working.map((s) => s.weight ?? 0))
    if (top <= 0 || !working.every((s) => s.weight === top)) return null
    weightsKg.push(toKg(top, workout.weightUnit))
  }
  // Same load in both sessions (within rounding, even if units differ).
  if (Math.abs(weightsKg[0] - weightsKg[1]) > 0.05) return null

  const currentWeight = roundWeight(fromKg(weightsKg[0], unit))
  return {
    currentWeight,
    suggestedWeight: roundWeight(currentWeight + PROGRESSION_STEP[unit]),
    unit,
    sessions: SESSIONS_REQUIRED,
  }
}
