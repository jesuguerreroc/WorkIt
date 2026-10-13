import type { Exercise } from '@/types/exercise'
import {
  DEFAULT_PRESCRIPTION,
  ROUTINE_LIMITS as L,
  type RoutineExercise,
  type RoutineInput,
} from '@/types/routine'

export function newId(): string {
  return crypto.randomUUID()
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

/** A routine entry for `exercise`, using its suggested prescription when it has one. */
export function routineExerciseFrom(exercise: Exercise): RoutineExercise {
  const repsMin = exercise.suggestedRepsMin ?? DEFAULT_PRESCRIPTION.repsMin
  return {
    id: newId(),
    exercise: { source: exercise.ref.source, id: exercise.ref.id, name: exercise.name },
    sets: exercise.suggestedSets ?? DEFAULT_PRESCRIPTION.sets,
    repsMin,
    repsMax: Math.max(repsMin, exercise.suggestedRepsMax ?? DEFAULT_PRESCRIPTION.repsMax),
    weight: null,
    restBetweenSets: DEFAULT_PRESCRIPTION.restBetweenSets,
    restAfterExercise: DEFAULT_PRESCRIPTION.restAfterExercise,
    notes: '',
  }
}

/** Moves the item at `from` by `delta` positions (bounded). Returns a new array. */
export function moveItem<T>(items: T[], from: number, delta: number): T[] {
  const to = clamp(from + delta, 0, items.length - 1)
  if (to === from) return items
  const next = [...items]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

export function adjustRest(seconds: number, delta: number): number {
  return clamp(seconds + delta, L.restMin, L.restMax)
}

/** "1:30", "0:45", "15:00". */
export function formatRest(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export type RoutineErrors = {
  name?: string
  exercises?: string
  items: Record<string, string | undefined>
}

/** Validates a routine before saving. Item errors are keyed by RoutineExercise.id. */
export function validateRoutine(routine: RoutineInput): RoutineErrors {
  const errors: RoutineErrors = { items: {} }
  const name = routine.name.trim()
  if (!name) errors.name = 'Ponle un nombre a la rutina.'
  else if (name.length > L.nameMax) errors.name = `Máximo ${L.nameMax} caracteres.`
  if (routine.exercises.length === 0) errors.exercises = 'Añade al menos un ejercicio.'
  if (routine.exercises.length > L.exercisesMax) errors.exercises = `Máximo ${L.exercisesMax} ejercicios por rutina.`

  for (const item of routine.exercises) {
    const problem = !Number.isInteger(item.sets) || item.sets < L.setsMin || item.sets > L.setsMax
      ? `Las series deben estar entre ${L.setsMin} y ${L.setsMax}.`
      : !Number.isInteger(item.repsMin) || !Number.isInteger(item.repsMax) || item.repsMin < L.repsMin || item.repsMax > L.repsMax
        ? `Las repeticiones deben estar entre ${L.repsMin} y ${L.repsMax}.`
        : item.repsMin > item.repsMax
          ? 'El mínimo de repeticiones no puede superar al máximo.'
          : item.weight !== null && (!Number.isFinite(item.weight) || item.weight < 0 || item.weight > L.weightMax)
            ? `El peso debe estar entre 0 y ${L.weightMax}.`
            : undefined
    if (problem) errors.items[item.id] = problem
  }
  return errors
}

export function hasRoutineErrors(errors: RoutineErrors): boolean {
  return Boolean(errors.name || errors.exercises || Object.values(errors.items).some(Boolean))
}

/** The example routine from the product brief. Clearly named as an example once created. */
export function exampleRoutineExercises(): RoutineExercise[] {
  const item = (id: string, name: string, repsMin: number, repsMax: number, restBetweenSets: number): RoutineExercise => ({
    id: newId(),
    exercise: { source: 'catalog', id, name },
    sets: 3,
    repsMin,
    repsMax,
    weight: null,
    restBetweenSets,
    restAfterExercise: 120,
    notes: '',
  })
  return [
    item('Barbell_Bench_Press_-_Medium_Grip', 'Press de banca con barra', 8, 12, 120),
    item('Incline_Dumbbell_Press', 'Press inclinado con mancuernas', 8, 12, 90),
    item('Side_Lateral_Raise', 'Elevaciones laterales', 12, 15, 60),
    item('Triceps_Pushdown', 'Extensión de tríceps en polea', 10, 15, 60),
  ]
}

/** Rough working time of one set, used only for the duration estimate. */
export const SECONDS_PER_SET = 45

/**
 * Estimated minutes for a routine: work time per set plus the configured rests
 * (between sets, and between exercises except after the last one). Rounded to 5 min.
 */
export function estimateRoutineMinutes(exercises: RoutineExercise[]): number {
  let seconds = 0
  exercises.forEach((e, i) => {
    seconds += e.sets * SECONDS_PER_SET + Math.max(0, e.sets - 1) * e.restBetweenSets
    if (i < exercises.length - 1) seconds += e.restAfterExercise
  })
  return Math.max(5, Math.round(seconds / 60 / 5) * 5)
}
