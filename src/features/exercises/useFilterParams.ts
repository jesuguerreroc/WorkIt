import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router'
import { EQUIPMENT_TYPES, EXERCISE_TYPES, MUSCLE_GROUPS, type EquipmentType, type ExerciseType, type MuscleGroup } from '@/types/exercise'
import type { ExerciseFilters } from './search'

function pick<T extends string>(value: string | null, allowed: readonly T[]): T | null {
  return value && (allowed as readonly string[]).includes(value) ? (value as T) : null
}

/**
 * Library filters stored in the URL (?q=&grupo=&equipo=&tipo=&vista=), so going
 * back from an exercise keeps the search and results can be shared or bookmarked.
 */
export function useFilterParams() {
  const [params, setParams] = useSearchParams()

  const filters = useMemo<ExerciseFilters>(
    () => ({
      query: params.get('q') ?? '',
      group: pick<MuscleGroup>(params.get('grupo'), MUSCLE_GROUPS),
      equipment: pick<EquipmentType>(params.get('equipo'), EQUIPMENT_TYPES),
      type: pick<ExerciseType>(params.get('tipo'), EXERCISE_TYPES),
    }),
    [params],
  )
  const view: 'catalog' | 'custom' = params.get('vista') === 'propios' ? 'custom' : 'catalog'

  const update = useCallback(
    (next: ExerciseFilters, nextView = view) => {
      const entries: Array<[string, string]> = []
      if (next.query) entries.push(['q', next.query])
      if (next.group) entries.push(['grupo', next.group])
      if (next.equipment) entries.push(['equipo', next.equipment])
      if (next.type) entries.push(['tipo', next.type])
      if (nextView === 'custom') entries.push(['vista', 'propios'])
      // replace: typing should not create one history entry per keystroke.
      setParams(new URLSearchParams(entries), { replace: true })
    },
    [setParams, view],
  )

  return { filters, view, setFilters: update, setView: (v: 'catalog' | 'custom') => update(filters, v) }
}
