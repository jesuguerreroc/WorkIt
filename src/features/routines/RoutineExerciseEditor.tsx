import type { ReactNode } from 'react'
import { ArrowDown, ArrowUp, Trash2 } from 'lucide-react'
import { Link } from 'react-router'
import { NumericField } from '@/components/ui/NumericField'
import { Stepper } from '@/components/ui/Stepper'
import { exerciseDetailPath } from '@/features/exercises/paths'
import { REST_STEP_SECONDS, ROUTINE_LIMITS as L, type RoutineExercise } from '@/types/routine'
import type { WeightUnit } from '@/types/profile'
import { formatRest } from './routineLogic'

interface RoutineExerciseEditorProps {
  item: RoutineExercise
  index: number
  total: number
  unit: WeightUnit
  error?: string
  onChange: (item: RoutineExercise) => void
  onMove: (delta: number) => void
  onRemove: () => void
}

/** Settings for one exercise inside a routine. Rest times step by ±15 s. */
export function RoutineExerciseEditor({ item, index, total, unit, error, onChange, onMove, onRemove }: RoutineExerciseEditorProps) {
  const set = <K extends keyof RoutineExercise>(key: K, value: RoutineExercise[K]) => onChange({ ...item, [key]: value })
  const name = item.exercise.name

  return (
    <article
      aria-label={`${index + 1}. ${name}`}
      className={`rounded-3xl border bg-surface p-4 sm:p-5 ${error ? 'border-danger/60' : 'border-border'}`}
    >
      <header className="flex items-start gap-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-soft font-display text-lg font-bold text-primary tabular-nums">
          {index + 1}
        </span>
        <div className="min-w-0 flex-1 pt-0.5">
          <h3 className="leading-snug font-semibold">
            <Link to={exerciseDetailPath(item.exercise)} className="hover:text-primary hover:underline">
              {name}
            </Link>
          </h3>
        </div>
        <div className="-mt-1 -mr-2 flex shrink-0">
          <IconButton label={`Subir ${name}`} disabled={index === 0} onClick={() => onMove(-1)}>
            <ArrowUp className="size-5" aria-hidden="true" />
          </IconButton>
          <IconButton label={`Bajar ${name}`} disabled={index === total - 1} onClick={() => onMove(1)}>
            <ArrowDown className="size-5" aria-hidden="true" />
          </IconButton>
          <IconButton label={`Quitar ${name} de la rutina`} onClick={onRemove}>
            <Trash2 className="size-5" aria-hidden="true" />
          </IconButton>
        </div>
      </header>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stepper
          label="Series"
          value={item.sets}
          min={L.setsMin}
          max={L.setsMax}
          onChange={(v) => set('sets', v)}
        />
        <fieldset className="flex flex-col gap-1.5">
          <legend className="mb-1.5 text-sm font-medium text-muted">Repeticiones</legend>
          <div className="flex items-center gap-2">
            <NumericField
              label="Mínimo de repeticiones"
              hideLabel
              value={item.repsMin}
              onChange={(v) => set('repsMin', v ?? 0)}
              className="flex-1"
            />
            <span className="text-muted" aria-hidden="true">
              –
            </span>
            <NumericField
              label="Máximo de repeticiones"
              hideLabel
              value={item.repsMax}
              onChange={(v) => set('repsMax', v ?? 0)}
              className="flex-1"
            />
          </div>
        </fieldset>
        <NumericField
          label="Peso inicial (opcional)"
          mode="decimal"
          suffix={unit}
          placeholder="—"
          value={item.weight}
          onChange={(v) => set('weight', v)}
        />
        <div className="hidden lg:block" />
        <Stepper
          label="Descanso entre series"
          value={item.restBetweenSets}
          min={L.restMin}
          max={L.restMax}
          step={REST_STEP_SECONDS}
          unitLabel="segundos"
          format={formatRest}
          onChange={(v) => set('restBetweenSets', v)}
        />
        <Stepper
          label="Descanso antes del siguiente ejercicio"
          value={item.restAfterExercise}
          min={L.restMin}
          max={L.restMax}
          step={REST_STEP_SECONDS}
          unitLabel="segundos"
          format={formatRest}
          onChange={(v) => set('restAfterExercise', v)}
        />
      </div>

      {error && (
        <p role="alert" className="mt-3 text-sm text-danger">
          {error}
        </p>
      )}
    </article>
  )
}

function IconButton({ label, disabled, onClick, children }: { label: string; disabled?: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="flex size-11 items-center justify-center rounded-xl text-muted transition-colors hover:bg-surface-2 hover:text-fg disabled:opacity-30"
    >
      {children}
    </button>
  )
}
