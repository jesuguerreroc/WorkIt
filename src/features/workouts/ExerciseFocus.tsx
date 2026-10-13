import type { ReactNode } from 'react'
import { BookOpen, Check, Disc3, Minus, NotebookPen, Plus, Repeat, TrendingUp, X } from 'lucide-react'
import { NumericField } from '@/components/ui/NumericField'
import { ExerciseImage } from '@/features/exercises/ExerciseImage'
import { formatRest } from '@/features/routines/routineLogic'
import { cn } from '@/lib/cn'
import { formatDayMonth } from '@/lib/dates'
import { formatNumber } from '@/lib/numbers'
import type { WeightUnit } from '@/types/profile'
import { WORKOUT_LIMITS, type WorkoutExercise, type WorkoutSet } from '@/types/workout'
import type { ProgressionSuggestion } from './progression'
import type { PreviousPerformance } from './workoutMath'

interface ExerciseFocusProps {
  item: WorkoutExercise
  images: string[]
  unit: WeightUnit
  previous: PreviousPerformance | null
  suggestion: ProgressionSuggestion | null
  onSetChange: (setId: string, patch: Partial<WorkoutSet>) => void
  onToggleDone: (set: WorkoutSet) => void
  onAddSet: () => void
  onRemoveSet: (setId: string) => void
  onHowTo: () => void
  onReplace: () => void
  onOptions: () => void
  onPlates: () => void
  onApplySuggestion: (weight: number) => void
  onDismissSuggestion: () => void
}

function formatSet(set: WorkoutSet, unit: WeightUnit): string {
  const reps = set.reps ?? '–'
  return set.weight ? `${formatNumber(set.weight)}${unit === 'lb' ? ' lb' : ''} × ${reps}` : `${reps} reps`
}

const GRID = 'grid grid-cols-[2.75rem_minmax(0,1fr)_4.75rem_3.75rem_2.75rem] items-center gap-x-1.5'

/** The current exercise: large demo, actions and its sets table. */
export function ExerciseFocus(props: ExerciseFocusProps) {
  const { item, images, unit, previous, suggestion } = props
  const target = item.repsMin === item.repsMax ? `${item.repsMin}` : `${item.repsMin}–${item.repsMax}`
  let workingNumber = 0

  return (
    <section aria-labelledby="current-exercise" className="flex flex-col gap-4">
      <div className="px-4">
        <ExerciseImage
          key={item.exercise.id}
          images={images}
          alt={`Demostración de ${item.exercise.name}`}
          animated
          className="mx-auto max-w-xl rounded-3xl"
        />
      </div>

      <div className="flex flex-col gap-3 px-4">
        <div>
          <h1 id="current-exercise" className="text-2xl leading-tight font-semibold">
            {item.exercise.name}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {item.sets.length} × {target} · Descanso {formatRest(item.restBetweenSets)} entre series ·{' '}
            {formatRest(item.restAfterExercise)} al cambiar
          </p>
        </div>

        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
          <Chip onClick={props.onHowTo} icon={<BookOpen className="size-4" aria-hidden="true" />}>
            Cómo se hace
          </Chip>
          <Chip onClick={props.onReplace} icon={<Repeat className="size-4" aria-hidden="true" />}>
            Reemplazar
          </Chip>
          <Chip onClick={props.onPlates} icon={<Disc3 className="size-4" aria-hidden="true" />}>
            Discos
          </Chip>
          <Chip onClick={props.onOptions} icon={<NotebookPen className="size-4" aria-hidden="true" />}>
            Notas y descansos
          </Chip>
        </div>

        {suggestion && (
          <div className="flex items-start gap-3 rounded-2xl bg-primary-soft p-3">
            <TrendingUp className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
            <p className="flex-1 text-sm">
              Llegaste al máximo de repeticiones en las {suggestion.sessions} últimas sesiones con{' '}
              {formatNumber(suggestion.currentWeight)} {suggestion.unit}. Si la técnica fue buena, prueba{' '}
              <strong>
                {formatNumber(suggestion.suggestedWeight)} {suggestion.unit}
              </strong>
              .
            </p>
            <button
              type="button"
              onClick={() => props.onApplySuggestion(suggestion.suggestedWeight)}
              className="min-h-11 shrink-0 rounded-xl bg-primary px-3 text-sm font-semibold text-on-primary"
            >
              Aplicar
            </button>
            <button
              type="button"
              onClick={props.onDismissSuggestion}
              aria-label="Ignorar sugerencia"
              className="flex size-11 shrink-0 items-center justify-center rounded-xl text-muted hover:text-fg"
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          </div>
        )}

        {previous && (
          <p className="text-xs text-subtle">Anterior = tu sesión del {formatDayMonth(previous.localDate)}</p>
        )}
      </div>

      <div className="border-y border-border bg-surface">
        <div className={cn(GRID, 'px-4 py-2 text-xs font-semibold tracking-wider text-subtle uppercase')} aria-hidden="true">
          <span className="text-center">Serie</span>
          <span>Anterior</span>
          <span className="text-center">{unit}</span>
          <span className="text-center">Reps</span>
          <span />
        </div>
        <ol className="flex flex-col">
          {item.sets.map((set, index) => {
            if (!set.warmup) workingNumber++
            const label = set.warmup ? 'Calentamiento' : `Serie ${workingNumber}`
            const prev = previous?.sets[index]
            return (
              <li
                key={set.id}
                className={cn(GRID, 'px-4 py-1.5 transition-colors', set.done && 'bg-primary-soft')}
              >
                <button
                  type="button"
                  onClick={() => props.onSetChange(set.id, { warmup: !set.warmup })}
                  aria-pressed={set.warmup}
                  aria-label={`${label}. ${set.warmup ? 'Quitar marca de calentamiento' : 'Marcar como calentamiento'}`}
                  className={cn(
                    'flex size-11 items-center justify-center rounded-xl font-display text-xl font-bold tabular-nums',
                    set.warmup ? 'bg-warning-soft text-warning' : 'text-fg hover:bg-surface-2',
                  )}
                >
                  {set.warmup ? 'C' : workingNumber}
                </button>
                <span className="truncate text-sm text-muted tabular-nums">{prev ? formatSet(prev, previous!.unit) : '—'}</span>
                <NumericField
                  label={`${label}: peso en ${unit}`}
                  hideLabel
                  mode="decimal"
                  value={set.weight}
                  placeholder={prev?.weight ? formatNumber(prev.weight) : '—'}
                  onChange={(weight) => props.onSetChange(set.id, { weight })}
                  inputClassName={cn('min-h-12 text-xl', set.done && 'border-transparent bg-transparent')}
                />
                <NumericField
                  label={`${label}: repeticiones`}
                  hideLabel
                  value={set.reps}
                  placeholder={String(prev?.reps ?? item.repsMax)}
                  onChange={(reps) => props.onSetChange(set.id, { reps })}
                  inputClassName={cn('min-h-12 text-xl', set.done && 'border-transparent bg-transparent')}
                />
                <button
                  type="button"
                  onClick={() => props.onToggleDone(set)}
                  aria-pressed={set.done}
                  aria-label={set.done ? `${label} completada. Pulsa para desmarcar` : `Completar ${label.toLowerCase()}`}
                  className={cn(
                    'flex size-11 items-center justify-center rounded-full border-2 transition-colors',
                    set.done ? 'border-primary bg-primary text-on-primary' : 'border-control text-control hover:border-primary hover:text-primary',
                  )}
                >
                  <Check className="size-5" strokeWidth={3} aria-hidden="true" />
                </button>
              </li>
            )
          })}
        </ol>
        <div className="flex gap-2 px-4 py-3">
          <button
            type="button"
            onClick={props.onAddSet}
            disabled={item.sets.length >= WORKOUT_LIMITS.setsMax}
            className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-surface-2 text-sm font-semibold hover:bg-surface-3 disabled:opacity-40"
          >
            <Plus className="size-4" aria-hidden="true" />
            Añadir serie
          </button>
          <button
            type="button"
            onClick={() => {
              const last = item.sets.at(-1)
              if (last) props.onRemoveSet(last.id)
            }}
            disabled={item.sets.length === 0}
            className="flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold text-muted hover:bg-surface-2 hover:text-fg disabled:opacity-40"
          >
            <Minus className="size-4" aria-hidden="true" />
            Quitar última
          </button>
        </div>
      </div>
      {item.notes && <p className="mx-4 rounded-xl bg-surface-2 px-3 py-2 text-sm text-muted">Nota: {item.notes}</p>}
    </section>
  )
}

function Chip({ onClick, icon, children }: { onClick: () => void; icon: ReactNode; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-11 shrink-0 items-center gap-2 rounded-full bg-surface-2 px-4 text-sm font-semibold whitespace-nowrap transition-colors hover:bg-surface-3"
    >
      {icon}
      {children}
    </button>
  )
}
