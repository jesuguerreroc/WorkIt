import { exerciseKey } from '@/types/exercise'
import type { WeightUnit } from '@/types/profile'
import type { RecordHit, Workout, WorkoutExercise, WorkoutSet, WorkoutSummary } from '@/types/workout'

/** Exact pound → kilogram factor. */
export const KG_PER_LB = 0.45359237

export function toKg(weight: number, unit: WeightUnit): number {
  return unit === 'lb' ? weight * KG_PER_LB : weight
}

export function fromKg(kg: number, unit: WeightUnit): number {
  return unit === 'lb' ? kg / KG_PER_LB : kg
}

/** Rounds for display: at most one decimal, no trailing ",0". */
export function roundWeight(value: number): number {
  return Math.round(value * 10) / 10
}

/** A set that counts for volume and records: completed, not a warm-up, with reps. */
export function isWorkingSet(set: WorkoutSet): boolean {
  return set.done && !set.warmup && (set.reps ?? 0) > 0
}

/** A session counts (streaks, history) only if at least one set was completed with reps. */
export function isValidWorkout(workout: Pick<Workout, 'exercises'>): boolean {
  return workout.exercises.some((e) => e.sets.some((s) => s.done && (s.reps ?? 0) > 0))
}

export function setVolumeKg(set: WorkoutSet, unit: WeightUnit): number {
  if (!isWorkingSet(set) || !set.weight || set.weight <= 0) return 0
  return toKg(set.weight, unit) * (set.reps ?? 0)
}

/** Σ weight × reps of working sets, in kg (never mixes units, never counts warm-ups). */
export function workoutVolumeKg(workout: Pick<Workout, 'exercises' | 'weightUnit'>): number {
  let total = 0
  for (const exercise of workout.exercises) {
    for (const set of exercise.sets) total += setVolumeKg(set, workout.weightUnit)
  }
  return total
}

/** Active training time in seconds, excluding pauses. */
export function elapsedSeconds(
  workout: Pick<Workout, 'startedAt' | 'endedAt' | 'pausedAt' | 'pausedMs'>,
  now: number,
): number {
  const end = workout.endedAt ?? now
  const pausedNow = workout.pausedAt !== null ? end - workout.pausedAt : 0
  return Math.max(0, Math.floor((end - workout.startedAt - workout.pausedMs - pausedNow) / 1000))
}

interface Bests {
  weightKg: number
  reps: number
  setVolumeKg: number
}

/** Best values per exercise across completed sessions (working sets only). */
export function bestsByExercise(history: Workout[], excludeId?: string): Map<string, Bests> {
  const bests = new Map<string, Bests>()
  for (const workout of history) {
    if (workout.status !== 'completed' || workout.id === excludeId) continue
    for (const exercise of workout.exercises) {
      const key = exerciseKey(exercise.exercise)
      for (const set of exercise.sets) {
        if (!isWorkingSet(set)) continue
        const current = bests.get(key) ?? { weightKg: 0, reps: 0, setVolumeKg: 0 }
        const weightKg = set.weight ? toKg(set.weight, workout.weightUnit) : 0
        bests.set(key, {
          weightKg: Math.max(current.weightKg, weightKg),
          reps: Math.max(current.reps, set.reps ?? 0),
          setVolumeKg: Math.max(current.setVolumeKg, setVolumeKg(set, workout.weightUnit)),
        })
      }
    }
  }
  return bests
}

const EPSILON = 1e-6

/**
 * New personal records in `workout` compared with earlier sessions. An exercise
 * with no previous history sets a baseline instead of a record.
 */
export function detectRecords(workout: Workout, history: Workout[]): RecordHit[] {
  const previous = bestsByExercise(history.filter((w) => w.startedAt < workout.startedAt), workout.id)
  const current = bestsByExercise([{ ...workout, status: 'completed' }])
  const hits: RecordHit[] = []

  for (const exercise of workout.exercises) {
    const key = exerciseKey(exercise.exercise)
    const before = previous.get(key)
    const now = current.get(key)
    if (!before || !now || hits.some((h) => h.exerciseKey === key)) continue
    const name = exercise.exercise.name
    if (now.weightKg > before.weightKg + EPSILON && before.weightKg > 0) {
      hits.push({ exerciseKey: key, exerciseName: name, kind: 'weight', value: now.weightKg, previous: before.weightKg })
    } else if (now.setVolumeKg > before.setVolumeKg + EPSILON && before.setVolumeKg > 0) {
      hits.push({ exerciseKey: key, exerciseName: name, kind: 'set_volume', value: now.setVolumeKg, previous: before.setVolumeKg })
    } else if (now.weightKg === 0 && before.weightKg === 0 && now.reps > before.reps) {
      // Bodyweight exercises: more reps is the record.
      hits.push({ exerciseKey: key, exerciseName: name, kind: 'reps', value: now.reps, previous: before.reps })
    }
  }
  return hits
}

/**
 * Record set by one just-completed set, compared with earlier sessions and with
 * the other completed sets of this session (so a second, heavier set also counts).
 * Same rules as detectRecords; no history for the exercise means no record.
 */
export function liveRecord(workout: Workout, history: Workout[], exerciseId: string, setId: string): RecordHit | null {
  const exercise = workout.exercises.find((e) => e.id === exerciseId)
  const set = exercise?.sets.find((s) => s.id === setId)
  if (!exercise || !set || !isWorkingSet(set)) return null
  const key = exerciseKey(exercise.exercise)
  const past = bestsByExercise(history.filter((w) => w.startedAt < workout.startedAt), workout.id).get(key)
  if (!past) return null
  const session = bestsByExercise([
    { ...workout, status: 'completed', exercises: [{ ...exercise, sets: exercise.sets.filter((s) => s.id !== setId) }] },
  ]).get(key)
  const before = {
    weightKg: Math.max(past.weightKg, session?.weightKg ?? 0),
    reps: Math.max(past.reps, session?.reps ?? 0),
    setVolumeKg: Math.max(past.setVolumeKg, session?.setVolumeKg ?? 0),
  }
  const weightKg = set.weight ? toKg(set.weight, workout.weightUnit) : 0
  const volumeKg = setVolumeKg(set, workout.weightUnit)
  const name = exercise.exercise.name
  if (weightKg > before.weightKg + EPSILON && before.weightKg > 0) {
    return { exerciseKey: key, exerciseName: name, kind: 'weight', value: weightKg, previous: before.weightKg }
  }
  if (volumeKg > before.setVolumeKg + EPSILON && before.setVolumeKg > 0) {
    return { exerciseKey: key, exerciseName: name, kind: 'set_volume', value: volumeKg, previous: before.setVolumeKg }
  }
  if (weightKg === 0 && before.weightKg === 0 && (set.reps ?? 0) > before.reps) {
    return { exerciseKey: key, exerciseName: name, kind: 'reps', value: set.reps ?? 0, previous: before.reps }
  }
  return null
}

export function summarizeWorkout(workout: Workout, history: Workout[], now: number): WorkoutSummary {
  let setsDone = 0
  let totalReps = 0
  let exercisesDone = 0
  for (const exercise of workout.exercises) {
    const working = exercise.sets.filter(isWorkingSet)
    if (working.length) exercisesDone++
    setsDone += working.length
    totalReps += working.reduce((sum, s) => sum + (s.reps ?? 0), 0)
  }
  return {
    durationSec: workout.source === 'manual' ? null : elapsedSeconds(workout, now),
    exercisesDone,
    setsDone,
    totalReps,
    volumeKg: Math.round(workoutVolumeKg(workout) * 10) / 10,
    records: detectRecords(workout, history),
  }
}

export interface PreviousPerformance {
  workoutId: string
  localDate: string
  unit: WeightUnit
  sets: WorkoutSet[]
  repsMax: number
}

/** The last completed session that included this exercise (before `beforeTime`). */
export function previousPerformance(
  history: Workout[],
  key: string,
  options: { excludeId?: string; beforeTime?: number } = {},
): PreviousPerformance | null {
  let best: { workout: Workout; exercise: WorkoutExercise } | null = null
  for (const workout of history) {
    if (workout.status !== 'completed' || workout.id === options.excludeId) continue
    if (options.beforeTime !== undefined && workout.startedAt >= options.beforeTime) continue
    const exercise = workout.exercises.find((e) => exerciseKey(e.exercise) === key && e.sets.some(isWorkingSet))
    if (exercise && (!best || workout.startedAt > best.workout.startedAt)) best = { workout, exercise }
  }
  if (!best) return null
  return {
    workoutId: best.workout.id,
    localDate: best.workout.localDate,
    unit: best.workout.weightUnit,
    sets: best.exercise.sets.filter((s) => s.done && (s.reps ?? 0) > 0),
    repsMax: best.exercise.repsMax,
  }
}
