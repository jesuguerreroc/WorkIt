import type { EquipmentType, Exercise, ExerciseType, MuscleGroup } from '@/types/exercise'
import { searchSynonyms } from './searchSynonyms'
import { equipmentLabels, muscleGroupMembers, muscleLabels } from './taxonomy'

export interface ExerciseFilters {
  query: string
  group: MuscleGroup | null
  equipment: EquipmentType | null
  type: ExerciseType | null
}

export const emptyFilters: ExerciseFilters = { query: '', group: null, equipment: null, type: null }

/** Lowercase, accent-free, punctuation collapsed to single spaces. */
export function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

const haystacks = new WeakMap<Exercise, string>()

function haystackOf(exercise: Exercise): string {
  let value = haystacks.get(exercise)
  if (value === undefined) {
    value = normalizeText(
      [
        exercise.name,
        exercise.originalName ?? '',
        ...exercise.primaryMuscles.map((m) => muscleLabels[m]),
        equipmentLabels[exercise.equipment],
      ].join(' '),
    )
    haystacks.set(exercise, value)
  }
  return value
}

function tokenMatches(token: string, haystack: string): boolean {
  if (haystack.includes(token)) return true
  return (searchSynonyms[token] ?? []).some((synonym) => haystack.includes(normalizeText(synonym)))
}

/**
 * Filters and ranks exercises. Every query word must match (directly or through a
 * Spanish→English synonym). Without a query, exercises with a reviewed Spanish
 * name come first so the common ones are easy to find.
 */
export function filterExercises(exercises: Exercise[], filters: ExerciseFilters): Exercise[] {
  const tokens = normalizeText(filters.query).split(' ').filter(Boolean)
  const groupMembers = filters.group ? muscleGroupMembers[filters.group] : null
  const fullQuery = tokens.join(' ')

  const scored: Array<{ exercise: Exercise; score: number }> = []
  for (const exercise of exercises) {
    if (groupMembers && !exercise.primaryMuscles.some((m) => groupMembers.includes(m))) continue
    if (filters.equipment && exercise.equipment !== filters.equipment) continue
    if (filters.type && exercise.type !== filters.type) continue

    const haystack = haystackOf(exercise)
    if (tokens.length && !tokens.every((token) => tokenMatches(token, haystack))) continue

    const name = normalizeText(exercise.name)
    let score = exercise.originalName ? 1 : 0
    if (fullQuery && name.startsWith(fullQuery)) score += 4
    else if (fullQuery && name.includes(fullQuery)) score += 2
    scored.push({ exercise, score })
  }

  return scored
    .sort((a, b) => b.score - a.score || a.exercise.name.localeCompare(b.exercise.name, 'es'))
    .map((entry) => entry.exercise)
}

export function hasActiveFilters(filters: ExerciseFilters): boolean {
  return Boolean(filters.query.trim() || filters.group || filters.equipment || filters.type)
}
