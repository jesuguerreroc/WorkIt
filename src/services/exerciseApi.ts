import { exerciseNameTranslations } from '@/features/exercises/nameTranslations'
import {
  exerciseKey,
  type EquipmentType,
  type Exercise,
  type ExerciseLevel,
  type ExerciseType,
  type Muscle,
} from '@/types/exercise'

/**
 * Exercise catalogue provider: Free Exercise DB (https://github.com/yuhonas/free-exercise-db),
 * released under the Unlicense (public domain), which allows commercial use and redistribution.
 *
 * The dataset JSON is bundled in /public/data (copied from the pinned commit below) so the app
 * works offline and has no third-party rate limits. Images are served from jsDelivr at the same
 * pinned commit, so the catalogue cannot change underneath stored routines.
 *
 * Why not ExerciseDB: its free tier is non-commercial only and rate-limited (verified: blocked with
 * Cloudflare 1015 after ~25 requests). See docs/EXERCISES.md.
 */
export const exerciseProvider = {
  name: 'Free Exercise DB',
  url: 'https://github.com/yuhonas/free-exercise-db',
  license: 'Unlicense (dominio público)',
  commit: 'f00c92c7dcf1216a928a52c3706c7ce8e2f71ed5',
} as const

const DATA_URL = '/data/exercises.json'
const IMAGE_BASE = `https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@${exerciseProvider.commit}/exercises/`
const REQUEST_TIMEOUT_MS = 15_000

/** Shape of one entry in the provider's exercises.json. */
export interface ProviderExercise {
  id: string
  name: string
  force: string | null
  level: string | null
  mechanic: string | null
  equipment: string | null
  primaryMuscles: string[]
  secondaryMuscles: string[]
  instructions: string[]
  category: string
  images: string[]
}

const muscleMap: Record<string, Muscle> = {
  abdominals: 'abdominals',
  abductors: 'abductors',
  adductors: 'adductors',
  biceps: 'biceps',
  calves: 'calves',
  chest: 'chest',
  forearms: 'forearms',
  glutes: 'glutes',
  hamstrings: 'hamstrings',
  lats: 'lats',
  'lower back': 'lower_back',
  'middle back': 'middle_back',
  neck: 'neck',
  quadriceps: 'quadriceps',
  shoulders: 'shoulders',
  traps: 'traps',
  triceps: 'triceps',
}

const equipmentMap: Record<string, EquipmentType> = {
  barbell: 'barbell',
  dumbbell: 'dumbbell',
  'e-z curl bar': 'ez_bar',
  kettlebells: 'kettlebell',
  cable: 'cable',
  machine: 'machine',
  bands: 'bands',
  'body only': 'bodyweight',
  'medicine ball': 'medicine_ball',
  'exercise ball': 'exercise_ball',
  'foam roll': 'foam_roll',
  other: 'other',
}

const typeMap: Record<string, ExerciseType> = {
  strength: 'strength',
  stretching: 'stretching',
  cardio: 'cardio',
  plyometrics: 'plyometrics',
  powerlifting: 'powerlifting',
  'olympic weightlifting': 'olympic_weightlifting',
  strongman: 'strongman',
}

const levelMap: Record<string, ExerciseLevel> = {
  beginner: 'beginner',
  intermediate: 'intermediate',
  expert: 'expert',
}

function mapMuscles(values: string[]): Muscle[] {
  return [...new Set(values.map((value) => muscleMap[value]).filter((m): m is Muscle => Boolean(m)))]
}

/** Converts a provider entry into the internal model. Unknown values degrade gracefully. */
export function normalizeCatalogExercise(raw: ProviderExercise): Exercise {
  const ref = { source: 'catalog' as const, id: raw.id }
  const translated = exerciseNameTranslations[raw.name]
  return {
    ref,
    key: exerciseKey(ref),
    name: translated ?? raw.name,
    originalName: translated ? raw.name : null,
    primaryMuscles: mapMuscles(raw.primaryMuscles ?? []),
    secondaryMuscles: mapMuscles(raw.secondaryMuscles ?? []),
    equipment: raw.equipment ? (equipmentMap[raw.equipment] ?? 'other') : 'none',
    type: typeMap[raw.category] ?? 'strength',
    level: raw.level ? (levelMap[raw.level] ?? null) : null,
    instructions: (raw.instructions ?? []).filter((step) => step.trim() !== ''),
    instructionsLanguage: 'en',
    images: (raw.images ?? []).map((path) => IMAGE_BASE + path.split('/').map(encodeURIComponent).join('/')),
    suggestedSets: null,
    suggestedRepsMin: null,
    suggestedRepsMax: null,
  }
}

export class ExerciseCatalogError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ExerciseCatalogError'
  }
}

let catalog: Promise<Exercise[]> | null = null

/**
 * Loads and normalises the full catalogue once per session (in-memory cache).
 * A failed load is not cached, so callers can retry.
 */
export function loadExerciseCatalog(): Promise<Exercise[]> {
  catalog ??= fetchCatalog().catch((error) => {
    catalog = null
    throw error
  })
  return catalog
}

async function fetchCatalog(): Promise<Exercise[]> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  try {
    const response = await fetch(DATA_URL, { signal: controller.signal })
    if (!response.ok) throw new ExerciseCatalogError(`HTTP ${response.status}`)
    const raw = (await response.json()) as ProviderExercise[]
    if (!Array.isArray(raw)) throw new ExerciseCatalogError('Formato de datos inesperado')
    return raw.map(normalizeCatalogExercise)
  } catch (error) {
    if (error instanceof ExerciseCatalogError) throw error
    throw new ExerciseCatalogError(
      navigator.onLine ? 'No se pudo cargar la biblioteca de ejercicios.' : 'Sin conexión: no se pudo cargar la biblioteca.',
    )
  } finally {
    clearTimeout(timer)
  }
}

export async function getCatalogExercise(id: string): Promise<Exercise | undefined> {
  return (await loadExerciseCatalog()).find((exercise) => exercise.ref.id === id)
}
