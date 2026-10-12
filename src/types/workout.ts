import type { WeightUnit } from './profile'
import type { ExerciseSnapshot } from './routine'

/**
 * A training session at users/{uid}/workouts/{id}.
 * Times are epoch milliseconds from the device clock (they must work offline);
 * `localDate` is the user's calendar day ("YYYY-MM-DD"), used for streaks so a
 * late-night session never moves to another day because of UTC.
 */

export const WORKOUT_LIMITS = {
  exercisesMax: 40,
  setsMax: 30,
  notesMax: 1000,
  exerciseNotesMax: 300,
} as const

export interface WorkoutSet {
  id: string
  weight: number | null
  reps: number | null
  done: boolean
  warmup: boolean
  completedAt: number | null
}

export interface WorkoutExercise {
  id: string
  exercise: ExerciseSnapshot
  repsMin: number
  repsMax: number
  restBetweenSets: number
  restAfterExercise: number
  notes: string
  sets: WorkoutSet[]
}

export type WorkoutStatus = 'active' | 'completed'
export type WorkoutSource = 'live' | 'manual'

export type RecordKind = 'weight' | 'reps' | 'set_volume'

export interface RecordHit {
  exerciseKey: string
  exerciseName: string
  kind: RecordKind
  /** New best (kg for weight/set_volume, reps for reps). */
  value: number
  previous: number
}

export interface WorkoutSummary {
  /** null for manually logged sessions without a known duration. */
  durationSec: number | null
  exercisesDone: number
  setsDone: number
  totalReps: number
  /** Σ weight × reps of completed working sets, in kg. */
  volumeKg: number
  records: RecordHit[]
}

export interface Workout {
  id: string
  routineId: string | null
  routineName: string
  status: WorkoutStatus
  source: WorkoutSource
  startedAt: number
  endedAt: number | null
  localDate: string
  /** When the session was paused (null if running). */
  pausedAt: number | null
  /** Total paused time so far. */
  pausedMs: number
  exercises: WorkoutExercise[]
  notes: string
  weightUnit: WeightUnit
  /** `${source}:${id}` of every exercise, for lookups. */
  exerciseKeys: string[]
  summary: WorkoutSummary | null
  /** Increases on every local change; the higher one wins when local and remote copies differ. */
  revision: number
}
