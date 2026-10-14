import type { ReactNode } from 'react'
import { Trophy } from 'lucide-react'
import { formatDuration } from '@/lib/dates'
import { formatNumber } from '@/lib/numbers'
import type { WeightUnit } from '@/types/profile'
import type { Workout } from '@/types/workout'
import { formatVolume, recordText } from './format'
import { isWorkingSet } from './workoutMath'

/** Stats, records and the sets of a completed session. */
export function WorkoutReport({ workout, unit }: { workout: Workout; unit: WeightUnit }) {
  const summary = workout.summary
  return (
    <div className="flex flex-col gap-6">
      {summary && (
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <Stat label="Duración">{summary.durationSec !== null ? formatDuration(summary.durationSec) : '—'}</Stat>
          <Stat label="Ejercicios">{summary.exercisesDone}</Stat>
          <Stat label="Series">{summary.setsDone}</Stat>
          <Stat label="Repeticiones">{summary.totalReps}</Stat>
          <Stat label="Volumen" hint="Peso × reps de las series de trabajo">
            {formatVolume(summary.volumeKg, unit)}
          </Stat>
        </dl>
      )}

      {summary && summary.records.length > 0 && (
        <section aria-labelledby="records-title" className="rounded-3xl border border-primary/40 bg-primary-soft p-5">
          <h2 id="records-title" className="flex items-center gap-2 text-lg leading-snug font-semibold">
            <Trophy className="size-6 text-primary" aria-hidden="true" />
            {summary.records.length === 1 ? 'Nuevo récord personal' : `${summary.records.length} récords personales`}
          </h2>
          <ul className="mt-3 flex flex-col gap-2">
            {summary.records.map((hit) => (
              <li key={hit.exerciseKey}>
                <span className="font-semibold">{hit.exerciseName}</span>
                <span className="block text-sm text-muted">{recordText(hit, unit)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="sets-title" className="flex flex-col gap-3">
        <h2 id="sets-title" className="text-lg leading-snug font-semibold">
          Series registradas
        </h2>
        {workout.exercises.map((exercise) => {
          const done = exercise.sets.filter((s) => s.done)
          if (done.length === 0) return null
          let n = 0
          return (
            <article key={exercise.id} className="rounded-2xl border border-border bg-surface p-4">
              <h3 className="font-semibold">{exercise.exercise.name}</h3>
              <ol className="mt-2 flex flex-wrap gap-2 text-sm">
                {done.map((set) => {
                  if (!set.warmup) n++
                  return (
                    <li
                      key={set.id}
                      className={`rounded-lg px-2 py-1 tabular-nums ${isWorkingSet(set) ? 'bg-surface-2' : 'bg-warning-soft text-warning'}`}
                    >
                      {set.warmup ? 'C' : n}: {set.weight ? `${formatNumber(set.weight)} ${workout.weightUnit} × ` : ''}
                      {set.reps} reps
                    </li>
                  )
                })}
              </ol>
              {exercise.notes && <p className="mt-2 text-sm text-muted">Nota: {exercise.notes}</p>}
            </article>
          )
        })}
        {workout.notes && <p className="rounded-2xl bg-surface-2 p-4 text-sm text-muted">Notas: {workout.notes}</p>}
        <p className="text-xs text-subtle">C = serie de calentamiento (no cuenta para el volumen ni los récords).</p>
      </section>
    </div>
  )
}

function Stat({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4" title={hint}>
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="mt-1 font-display text-3xl font-bold tabular-nums">{children}</dd>
    </div>
  )
}
