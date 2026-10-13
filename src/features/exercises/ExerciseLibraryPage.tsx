import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Plus, SearchX } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Button, ButtonLink } from '@/components/ui/Button'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { cn } from '@/lib/cn'
import { exerciseProvider } from '@/services/exerciseApi'
import type { Exercise } from '@/types/exercise'
import { ExerciseCard } from './ExerciseCard'
import { ExerciseFilterBar } from './ExerciseFilterBar'
import { filterExercises, hasActiveFilters } from './search'
import { useCustomExercises, useExerciseCatalog } from './useExercises'
import { useFilterParams } from './useFilterParams'

const PAGE_SIZE = 24

export function ExerciseLibraryPage() {
  const { filters, view, setFilters, setView } = useFilterParams()
  const catalog = useExerciseCatalog()
  const custom = useCustomExercises()
  const query = useDebouncedValue(filters.query, 200)

  const source = view === 'custom' ? custom : catalog
  const results = useMemo(
    () => filterExercises(source.exercises, { ...filters, query }),
    [source.exercises, filters, query],
  )

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[1.75rem] leading-tight font-bold tracking-tight sm:text-3xl">Ejercicios</h1>
          <p className="mt-1 text-muted">Busca por nombre, músculo o equipamiento.</p>
        </div>
        <ButtonLink to="/app/ejercicios/nuevo" variant="secondary">
          <Plus className="size-4" aria-hidden="true" />
          Crear ejercicio
        </ButtonLink>
      </header>

      <div role="group" aria-label="Origen de los ejercicios" className="flex gap-1 rounded-2xl border border-border bg-surface p-1 sm:self-start">
        <ViewTab selected={view === 'catalog'} onSelect={() => setView('catalog')} label="Biblioteca" />
        <ViewTab
          selected={view === 'custom'}
          onSelect={() => setView('custom')}
          label={`Mis ejercicios${custom.status === 'ready' ? ` (${custom.exercises.length})` : ''}`}
        />
      </div>

      <ExerciseFilterBar filters={filters} onChange={setFilters} />

      <section aria-live="polite" aria-busy={source.status === 'loading'}>
        {source.status === 'loading' && <ResultsSkeleton />}

        {view === 'catalog' && catalog.status === 'error' && (
          <Alert tone="error" title="No se pudo cargar la biblioteca">
            <p>{catalog.error}</p>
            <Button variant="secondary" className="mt-3" onClick={catalog.retry}>
              Reintentar
            </Button>
          </Alert>
        )}
        {view === 'custom' && custom.status === 'error' && (
          <Alert tone="error">No se pudieron cargar tus ejercicios. Revisa tu conexión.</Alert>
        )}

        {source.status === 'ready' &&
          (results.length > 0 ? (
            <Results key={JSON.stringify({ ...filters, query, view })} exercises={results} />
          ) : view === 'custom' && !hasActiveFilters(filters) ? (
            <EmptyState
              title="Aún no has creado ejercicios"
              text="Añade los que no encuentres en la biblioteca. Podrás usarlos en tus rutinas igual que el resto."
              action={
                <ButtonLink to="/app/ejercicios/nuevo">
                  <Plus className="size-4" aria-hidden="true" />
                  Crear ejercicio
                </ButtonLink>
              }
            />
          ) : (
            <EmptyState
              title="Sin resultados"
              text="Prueba con otras palabras o quita algún filtro."
              action={
                <Button variant="secondary" onClick={() => setFilters({ query: '', group: null, equipment: null, type: null })}>
                  Limpiar filtros
                </Button>
              }
            />
          ))}
      </section>

      {view === 'catalog' && (
        <p className="border-t border-border pt-4 text-sm text-muted">
          Datos e imágenes de{' '}
          <a href={exerciseProvider.url} target="_blank" rel="noreferrer" className="text-fg underline underline-offset-4">
            {exerciseProvider.name}
          </a>{' '}
          ({exerciseProvider.license}). Los nombres en español son traducciones revisadas de WorkIt; las instrucciones
          se muestran en el idioma original.
        </p>
      )}
    </div>
  )
}

function ViewTab({ selected, onSelect, label }: { selected: boolean; onSelect: () => void; label: string }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={cn(
        'min-h-11 flex-1 rounded-xl px-4 text-sm font-semibold transition-colors sm:flex-none',
        selected ? 'bg-surface-3 text-fg' : 'text-muted hover:text-fg',
      )}
    >
      {label}
    </button>
  )
}

/** Renders results progressively: 24 at a time, more when the sentinel scrolls into view. */
function Results({ exercises }: { exercises: Exercise[] }) {
  const [visible, setVisible] = useState(PAGE_SIZE)
  const sentinel = useRef<HTMLDivElement>(null)
  const hasMore = visible < exercises.length

  useEffect(() => {
    const element = sentinel.current
    if (!element || !hasMore) return
    const observer = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setVisible((v) => v + PAGE_SIZE),
      { rootMargin: '600px 0px' },
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [hasMore])

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted">
        {exercises.length} {exercises.length === 1 ? 'ejercicio' : 'ejercicios'}
      </p>
      <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
        {exercises.slice(0, visible).map((exercise) => (
          <li key={exercise.key}>
            <ExerciseCard exercise={exercise} />
          </li>
        ))}
      </ul>
      {hasMore && (
        <div ref={sentinel} className="flex justify-center">
          <Button variant="secondary" onClick={() => setVisible((v) => v + PAGE_SIZE)}>
            Mostrar más
          </Button>
        </div>
      )}
    </div>
  )
}

function ResultsSkeleton() {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4" aria-label="Cargando ejercicios">
      {Array.from({ length: 8 }, (_, i) => (
        <li key={i} className="flex flex-col gap-3 rounded-3xl border border-border bg-surface p-3">
          <div className="aspect-[3/2] rounded-2xl bg-surface-2 motion-safe:animate-pulse" />
          <div className="h-4 w-3/4 rounded bg-surface-2 motion-safe:animate-pulse" />
          <div className="h-3 w-1/2 rounded bg-surface-2 motion-safe:animate-pulse" />
        </li>
      ))}
    </ul>
  )
}

function EmptyState({ title, text, action }: { title: string; text: string; action: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-border-strong px-6 py-12 text-center">
      <SearchX className="size-8 text-muted" aria-hidden="true" />
      <p className="text-lg leading-snug font-semibold">{title}</p>
      <p className="max-w-sm text-muted">{text}</p>
      <div className="mt-2">{action}</div>
    </div>
  )
}
