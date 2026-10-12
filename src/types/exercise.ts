/**
 * Internal exercise model. The UI only ever sees this shape; provider data is
 * normalised in src/services/exerciseApi.ts and user-created exercises in
 * src/services/customExerciseService.ts.
 */

/** Detailed muscles, as language-neutral codes. */
export const MUSCLES = [
  'abdominals',
  'abductors',
  'adductors',
  'biceps',
  'calves',
  'chest',
  'forearms',
  'glutes',
  'hamstrings',
  'lats',
  'lower_back',
  'middle_back',
  'neck',
  'quadriceps',
  'shoulders',
  'traps',
  'triceps',
] as const
export type Muscle = (typeof MUSCLES)[number]

/** The 11 muscle groups offered as library filters. */
export const MUSCLE_GROUPS = [
  'chest',
  'back',
  'shoulders',
  'biceps',
  'triceps',
  'forearms',
  'quadriceps',
  'hamstrings',
  'glutes',
  'calves',
  'abs',
] as const
export type MuscleGroup = (typeof MUSCLE_GROUPS)[number]

export const EQUIPMENT_TYPES = [
  'barbell',
  'dumbbell',
  'ez_bar',
  'kettlebell',
  'cable',
  'machine',
  'bands',
  'bodyweight',
  'medicine_ball',
  'exercise_ball',
  'foam_roll',
  'other',
  'none',
] as const
export type EquipmentType = (typeof EQUIPMENT_TYPES)[number]

export const EXERCISE_TYPES = [
  'strength',
  'stretching',
  'cardio',
  'plyometrics',
  'powerlifting',
  'olympic_weightlifting',
  'strongman',
] as const
export type ExerciseType = (typeof EXERCISE_TYPES)[number]

export type ExerciseLevel = 'beginner' | 'intermediate' | 'expert'
export type ExerciseSource = 'catalog' | 'custom'

/** Stable reference stored in routines and workouts. */
export interface ExerciseRef {
  source: ExerciseSource
  id: string
}

export interface Exercise {
  ref: ExerciseRef
  /** `${source}:${id}`, unique across sources. */
  key: string
  /** Spanish name when a verified translation exists, otherwise the original. */
  name: string
  /** Provider's original name, set only when `name` is a translation. */
  originalName: string | null
  primaryMuscles: Muscle[]
  secondaryMuscles: Muscle[]
  equipment: EquipmentType
  type: ExerciseType
  level: ExerciseLevel | null
  instructions: string[]
  /** Language of `instructions` (provider texts are in English). */
  instructionsLanguage: 'es' | 'en'
  /** Demonstration frames, in order. Empty when the exercise has no images. */
  images: string[]
  /** Suggested prescription (custom exercises only). */
  suggestedSets: number | null
  suggestedRepsMin: number | null
  suggestedRepsMax: number | null
}

export function exerciseKey(ref: ExerciseRef): string {
  return `${ref.source}:${ref.id}`
}
