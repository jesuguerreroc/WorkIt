import { Search, X } from 'lucide-react'
import { Select } from '@/components/ui/Select'
import { cn } from '@/lib/cn'
import { EQUIPMENT_TYPES, EXERCISE_TYPES, MUSCLE_GROUPS, type MuscleGroup } from '@/types/exercise'
import { hasActiveFilters, type ExerciseFilters } from './search'
import { equipmentLabels, exerciseTypeLabels, muscleGroupLabels } from './taxonomy'

interface ExerciseFilterBarProps {
  filters: ExerciseFilters
  onChange: (filters: ExerciseFilters) => void
  /** Id prefix so two bars (page + picker) never clash. */
  idPrefix?: string
}

const equipmentOptions = EQUIPMENT_TYPES.map((value) => ({ value, label: equipmentLabels[value] }))
const typeOptions = EXERCISE_TYPES.map((value) => ({ value, label: exerciseTypeLabels[value] }))

export function ExerciseFilterBar({ filters, onChange, idPrefix = 'filters' }: ExerciseFilterBarProps) {
  const set = (patch: Partial<ExerciseFilters>) => onChange({ ...filters, ...patch })

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <label htmlFor={`${idPrefix}-query`} className="sr-only">
          Buscar ejercicio
        </label>
        <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted" aria-hidden="true" />
        <input
          id={`${idPrefix}-query`}
          type="search"
          inputMode="search"
          autoComplete="off"
          placeholder="Buscar: press banca, sentadilla, remo…"
          value={filters.query}
          onChange={(event) => set({ query: event.target.value })}
          className="block min-h-12 w-full rounded-xl border border-control bg-surface pr-12 pl-12 text-base text-fg placeholder:text-subtle focus:border-primary focus:ring-2 focus:ring-primary/30 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
        />
        {filters.query && (
          <button
            type="button"
            onClick={() => set({ query: '' })}
            aria-label="Borrar búsqueda"
            className="absolute top-1/2 right-1 flex size-11 -translate-y-1/2 items-center justify-center rounded-lg text-muted hover:text-fg"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        )}
      </div>

      <fieldset className="min-w-0">
        <legend className="sr-only">Grupo muscular</legend>
        {/* Scrolls horizontally on small screens instead of wrapping into many rows. */}
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0">
          <GroupChip label="Todos" checked={filters.group === null} onSelect={() => set({ group: null })} name={`${idPrefix}-group`} />
          {MUSCLE_GROUPS.map((group: MuscleGroup) => (
            <GroupChip
              key={group}
              label={muscleGroupLabels[group]}
              checked={filters.group === group}
              onSelect={() => set({ group })}
              name={`${idPrefix}-group`}
            />
          ))}
        </div>
      </fieldset>

      <div className="grid grid-cols-2 gap-3 sm:flex sm:items-end">
        <Select
          id={`${idPrefix}-equipment`}
          label="Equipamiento"
          options={equipmentOptions}
          placeholder="Cualquiera"
          value={filters.equipment ?? ''}
          onChange={(event) => set({ equipment: (event.target.value || null) as ExerciseFilters['equipment'] })}
          className="sm:w-56"
        />
        <Select
          id={`${idPrefix}-type`}
          label="Tipo"
          options={typeOptions}
          placeholder="Cualquiera"
          value={filters.type ?? ''}
          onChange={(event) => set({ type: (event.target.value || null) as ExerciseFilters['type'] })}
          className="sm:w-48"
        />
        {hasActiveFilters(filters) && (
          <button
            type="button"
            onClick={() => onChange({ query: '', group: null, equipment: null, type: null })}
            className="col-span-2 min-h-11 justify-self-start rounded-lg text-sm font-semibold text-primary underline-offset-4 hover:underline sm:px-2"
          >
            Limpiar filtros
          </button>
        )}
      </div>
    </div>
  )
}

function GroupChip({ label, checked, onSelect, name }: { label: string; checked: boolean; onSelect: () => void; name: string }) {
  return (
    <label
      className={cn(
        'flex min-h-11 shrink-0 cursor-pointer items-center rounded-full border px-4 text-sm font-semibold whitespace-nowrap transition-colors select-none',
        'has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-primary',
        checked ? 'border-primary bg-primary text-on-primary' : 'border-border-strong text-muted hover:border-control hover:text-fg',
      )}
    >
      <input type="radio" name={name} checked={checked} onChange={onSelect} className="sr-only" />
      {label}
    </label>
  )
}
