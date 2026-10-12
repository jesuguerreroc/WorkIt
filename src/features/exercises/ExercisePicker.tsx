import { useMemo, useState } from 'react'
import { Check } from 'lucide-react'
import { Link } from 'react-router'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { cn } from '@/lib/cn'
import type { Exercise } from '@/types/exercise'
import { ExerciseFilterBar } from './ExerciseFilterBar'
import { emptyFilters, filterExercises, type ExerciseFilters } from './search'
import { equipmentLabels, muscleLabels } from './taxonomy'
import { useCustomExercises, useExerciseCatalog } from './useExercises'

interface ExercisePickerProps {
  open: boolean
  onClose: () => void
  onAdd: (exercises: Exercise[]) => void
  /** Keys already present, marked so the user does not add them twice by accident. */
  existingKeys?: Set<string>
  title?: string
  /** Pick exactly one exercise (e.g. "Reemplazar"). */
  single?: boolean
}

const STEP = 40

/** Multi-select exercise chooser (catalogue + custom), used by the routine editor and live workouts. */
export function ExercisePicker({ open, onClose, onAdd, existingKeys, title = 'Añadir ejercicios', single = false }: ExercisePickerProps) {
  const catalog = useExerciseCatalog()
  const custom = useCustomExercises()
  const [view, setView] = useState<'catalog' | 'custom'>('catalog')
  const [filters, setFilters] = useState<ExerciseFilters>(emptyFilters)
  const [selected, setSelected] = useState<Map<string, Exercise>>(new Map())
  const [limit, setLimit] = useState(STEP)
  const query = useDebouncedValue(filters.query, 200)

  const source = view === 'custom' ? custom : catalog
  const results = useMemo(() => filterExercises(source.exercises, { ...filters, query }), [source.exercises, filters, query])

  const close = () => {
    setSelected(new Map())
    setFilters(emptyFilters)
    setLimit(STEP)
    onClose()
  }

  const toggle = (exercise: Exercise) =>
    setSelected((current) => {
      const next = new Map(current)
      if (next.has(exercise.key)) next.delete(exercise.key)
      else {
        if (single) next.clear()
        next.set(exercise.key, exercise)
      }
      return next
    })

  return (
    <Dialog
      open={open}
      onClose={close}
      variant="sheet"
      title={title}
      description={single ? 'Elige el ejercicio que lo sustituirá.' : 'Elige uno o varios. Se añadirán en el orden en que los marques.'}
      actions={
        <>
          <Button variant="ghost" onClick={close}>
            Cancelar
          </Button>
          <Button
            disabled={selected.size === 0}
            onClick={() => {
              onAdd([...selected.values()])
              close()
            }}
          >
            {single
              ? 'Reemplazar'
              : selected.size === 0
              ? 'Añadir'
              : `Añadir ${selected.size} ${selected.size === 1 ? 'ejercicio' : 'ejercicios'}`}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div role="group" aria-label="Origen" className="flex gap-1 rounded-2xl border border-border bg-canvas p-1">
          {(['catalog', 'custom'] as const).map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={view === v}
              onClick={() => {
                setView(v)
                setLimit(STEP)
              }}
              className={cn(
                'min-h-11 flex-1 rounded-xl text-sm font-semibold',
                view === v ? 'bg-surface-3 text-fg' : 'text-muted hover:text-fg',
              )}
            >
              {v === 'catalog' ? 'Biblioteca' : 'Mis ejercicios'}
            </button>
          ))}
        </div>

        <ExerciseFilterBar
          filters={filters}
          onChange={(next) => {
            setFilters(next)
            setLimit(STEP)
          }}
          idPrefix="picker"
        />

        {source.status === 'loading' && <p className="py-6 text-center text-muted">Cargando ejercicios…</p>}
        {source.status === 'error' && <Alert tone="error">No se pudieron cargar los ejercicios.</Alert>}
        {source.status === 'ready' && results.length === 0 && (
          <p className="py-6 text-center text-muted">
            {view === 'custom' && source.exercises.length === 0 ? (
              <>
                Aún no tienes ejercicios propios.{' '}
                <Link to="/app/ejercicios/nuevo" className="text-primary underline">
                  Crear uno
                </Link>
              </>
            ) : (
              'Sin resultados para esta búsqueda.'
            )}
          </p>
        )}

        {source.status === 'ready' && results.length > 0 && (
          <ul className="flex flex-col gap-2" aria-label="Resultados">
            {results.slice(0, limit).map((exercise) => {
              const checked = selected.has(exercise.key)
              const inRoutine = existingKeys?.has(exercise.key)
              return (
                <li key={exercise.key}>
                  <label
                    className={cn(
                      'flex min-h-16 cursor-pointer items-center gap-3 rounded-2xl border p-2 pr-3 transition-colors',
                      'has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-primary',
                      checked ? 'border-primary bg-primary-soft' : 'border-border bg-canvas hover:border-control',
                    )}
                  >
                    <input type="checkbox" checked={checked} onChange={() => toggle(exercise)} className="sr-only" />
                    <span className="relative aspect-[3/2] w-20 shrink-0 overflow-hidden rounded-xl bg-white">
                      {exercise.images[0] ? (
                        <img src={exercise.images[0]} alt="" loading="lazy" className="size-full object-cover" />
                      ) : (
                        <span className="flex size-full items-center justify-center bg-surface-2 text-xs text-subtle">—</span>
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold">{exercise.name}</span>
                      <span className="block text-sm text-muted">
                        {[exercise.primaryMuscles.map((m) => muscleLabels[m]).join(', '), equipmentLabels[exercise.equipment]]
                          .filter(Boolean)
                          .join(' · ')}
                        {inRoutine && <span className="text-primary"> · Ya añadido</span>}
                      </span>
                    </span>
                    <span
                      aria-hidden="true"
                      className={cn(
                        'flex size-7 shrink-0 items-center justify-center rounded-lg border',
                        checked ? 'border-primary bg-primary text-on-primary' : 'border-control',
                      )}
                    >
                      {checked && <Check className="size-4" strokeWidth={3} />}
                    </span>
                  </label>
                </li>
              )
            })}
          </ul>
        )}
        {source.status === 'ready' && results.length > limit && (
          <Button variant="secondary" onClick={() => setLimit((l) => l + STEP)} className="self-center">
            Mostrar más ({results.length - limit} restantes)
          </Button>
        )}
      </div>
    </Dialog>
  )
}
