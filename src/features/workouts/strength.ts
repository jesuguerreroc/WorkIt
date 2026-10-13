import { countedWorkouts } from '@/features/streaks/achievements'
import { exerciseKey } from '@/types/exercise'
import type { WeightUnit } from '@/types/profile'
import type { Workout } from '@/types/workout'
import { fromKg, isWorkingSet, roundWeight, toKg } from './workoutMath'

/** Rep counts shown in the "records by reps" table. */
export const REP_TARGETS = [1, 3, 5, 8, 10, 12] as const

/** Above this many reps the 1RM formulas are unreliable, so no estimate is given. */
export const MAX_REPS_FOR_ESTIMATE = 12

/**
 * Estimated one-rep max (Epley: weight × (1 + reps / 30)). A single rep is the
 * weight itself. It is an estimate, never a measured value.
 */
export function estimateOneRepMax(weight: number, reps: number): number | null {
  if (weight <= 0 || reps < 1 || reps > MAX_REPS_FOR_ESTIMATE) return null
  return reps === 1 ? weight : weight * (1 + reps / 30)
}

interface WorkingSet {
  kg: number
  reps: number
  date: string
}

function workingSets(workouts: Workout[], key: string): WorkingSet[] {
  const sets: WorkingSet[] = []
  for (const workout of countedWorkouts(workouts)) {
    for (const exercise of workout.exercises) {
      if (exerciseKey(exercise.exercise) !== key) continue
      for (const set of exercise.sets) {
        if (isWorkingSet(set) && set.weight && set.weight > 0) {
          sets.push({ kg: toKg(set.weight, workout.weightUnit), reps: set.reps ?? 0, date: workout.localDate })
        }
      }
    }
  }
  return sets
}

export interface OneRepMax {
  /** In the user's unit. */
  value: number
  /** The set it comes from. */
  weight: number
  reps: number
  date: string
}

export function bestOneRepMax(workouts: Workout[], key: string, unit: WeightUnit): OneRepMax | null {
  let best: { e1rmKg: number; set: WorkingSet } | null = null
  for (const set of workingSets(workouts, key)) {
    const e1rm = estimateOneRepMax(set.kg, set.reps)
    if (e1rm !== null && (!best || e1rm > best.e1rmKg)) best = { e1rmKg: e1rm, set }
  }
  if (!best) return null
  return {
    value: roundWeight(fromKg(best.e1rmKg, unit)),
    weight: roundWeight(fromKg(best.set.kg, unit)),
    reps: best.set.reps,
    date: best.set.date,
  }
}

export interface RepRecord {
  reps: number
  /** Heaviest weight lifted for at least `reps` reps, in the user's unit (null if never). */
  weight: number | null
  date: string | null
}

/** Best weight for at least 1, 3, 5, 8, 10 and 12 reps. */
export function repRecords(workouts: Workout[], key: string, unit: WeightUnit): RepRecord[] {
  const sets = workingSets(workouts, key)
  return REP_TARGETS.map((target) => {
    let best: WorkingSet | null = null
    for (const set of sets) if (set.reps >= target && (!best || set.kg > best.kg)) best = set
    return { reps: target, weight: best ? roundWeight(fromKg(best.kg, unit)) : null, date: best?.date ?? null }
  })
}
