import type { ExerciseSource } from './exercise'
import type { Weekday } from './profile'

/** Limits shared by the editor, the service and firestore.rules. */
export const ROUTINE_LIMITS = {
  nameMax: 60,
  exercisesMax: 30,
  setsMin: 1,
  setsMax: 20,
  repsMin: 1,
  repsMax: 100,
  weightMax: 2000,
  restMin: 0,
  /** 15 minutes. */
  restMax: 900,
  notesMax: 300,
} as const

/** The +/- step for rest timers, in seconds. */
export const REST_STEP_SECONDS = 15

export const DEFAULT_PRESCRIPTION = {
  sets: 3,
  repsMin: 8,
  repsMax: 12,
  restBetweenSets: 90,
  restAfterExercise: 120,
} as const

/**
 * Reference to an exercise plus a snapshot of its name, so a routine can be shown
 * without loading the catalogue and survives a custom exercise being deleted.
 */
export interface ExerciseSnapshot {
  source: ExerciseSource
  id: string
  name: string
}

export interface RoutineExercise {
  /** Stable id inside the routine (React keys, reordering). */
  id: string
  exercise: ExerciseSnapshot
  sets: number
  repsMin: number
  repsMax: number
  /** Optional starting weight, in the user's unit. */
  weight: number | null
  /** Seconds of rest between two sets of this exercise. */
  restBetweenSets: number
  /** Seconds of rest after the last set, before the next exercise. */
  restAfterExercise: number
  notes: string
}

export type RoutineStatus = 'active' | 'archived'

export interface Routine {
  id: string
  name: string
  days: Weekday[]
  exercises: RoutineExercise[]
  status: RoutineStatus
  createdAt: Date | null
  updatedAt: Date | null
}

export type RoutineInput = Pick<Routine, 'name' | 'days' | 'exercises'>
