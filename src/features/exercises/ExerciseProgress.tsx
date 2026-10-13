import { useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { ChevronRight } from 'lucide-react'
import { Select } from '@/components/ui/Select'
import { useAuth } from '@/features/auth/authContext'
import { ChartFrame, SingleLineChart } from '@/features/progress/charts'
import { exerciseSeries } from '@/features/progress/progressData'
import { countedWorkouts } from '@/features/streaks/achievements'
import { formatVolume } from '@/features/workouts/format'
import { useWorkoutHistory } from '@/features/workouts/useWorkouts'
import { bestsByExercise, fromKg, isWorkingSet, roundWeight } from '@/features/workouts/workoutMath'
import { useToday } from '@/hooks/useToday'
import { addDays, formatShortDate } from '@/lib/dates'
import { formatNumber } from '@/lib/numbers'
import { exerciseKey, type Exercise } from '@/types/exercise'

type Metric = 'volume' | 'topWeight' | 'bestReps'
type Period = '30' | '90' | 'all'

const integer = new Intl.NumberFormat('es', { maximumFractionDigits: 0 })

/** The user's own numbers for one exercise: totals, records and a chart. */
export function ExerciseStats({ exercise }: { exercise: Exercise }) {
  const { profile } = useAuth()
  const unit = profile?.weightUnit ?? 'kg'
  const today = useToday()
  const { workouts, status } = useWorkoutHistory()
  const [metric, setMetric] = useState<Metric>('volume')
  const [period, setPeriod] = useState<Period>('90')

  const all = useMemo(() => exerciseSeries(workouts, exercise.key, unit), [workouts, exercise.key, unit])
  const bests = useMemo(() => bestsByExercise(workouts).get(exercise.key), [workouts, exercise.key])
  const from = period === 'all' ? null : addDays(today, -Number(period))
  const series = all.filter((p) => !from || p.date >= from)
  const values = series.map((p) => (metric === 'volume' ? p.volume : metric === 'topWeight' ? p.topWeight : p.bestReps)).filter((v): v is number => v !== null)
  const average = values.length ? values.reduce((a, b) => a + b, 0) / values.length : null
  const metricUnit = metric === 'bestReps' ? 'reps' : unit

  if (status === 'loading') return <p className="text-muted">Cargando tus estadísticas…</p>
  if (all.length === 0) {
    return (
      <p className="rounded-3xl border border-dashed border-border-strong p-6 text-center text-muted">
        Todavía no has hecho este ejercicio. Cuando completes series con él, aquí verás tu progreso.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Veces realizado">{all.length}</Stat>
        <Stat label="Peso máximo">{bests && bests.weightKg > 0 ? `${formatNumber(roundWeight(fromKg(bests.weightKg, unit)))} ${unit}` : '—'}</Stat>
        <Stat label="Mejor serie">{bests && bests.setVolumeKg > 0 ? formatVolume(bests.setVolumeKg, unit) : '—'}</Stat>
        <Stat label="Última vez">{formatShortDate(all[all.length - 1].date)}</Stat>
      </dl>

      <div className="grid grid-cols-2 gap-3">
        <Select
          label="Métrica"
          value={metric}
          onChange={(e) => setMetric(e.target.value as Metric)}
          options={[
            { value: 'volume', label: 'Volumen por sesión' },
            { value: 'topWeight', label: 'Peso máximo' },
            { value: 'bestReps', label: 'Repeticiones máximas' },
          ]}
        />
        <Select
          label="Periodo"
          value={period}
          onChange={(e) => setPeriod(e.target.value as Period)}
          options={[
            { value: '30', label: 'Último mes' },
            { value: '90', label: 'Últimos 3 meses' },
            { value: 'all', label: 'Todo' },
          ]}
        />
      </div>

      <ChartFrame
        title={
          average === null
            ? 'Sin datos en este periodo'
            : `Media: ${metric === 'bestReps' ? integer.format(average) : formatNumber(Math.round(average * 10) / 10)} ${metricUnit}`
        }
        subtitle={
          metric === 'volume'
            ? 'Peso × repeticiones de tus series de trabajo en cada sesión'
            : metric === 'topWeight'
              ? 'Tu serie de trabajo más pesada en cada sesión (carga levantada, no peso corporal)'
              : 'La serie con más repeticiones en cada sesión'
        }
        empty={series.length < 2 ? 'Necesitas al menos 2 sesiones en este periodo para ver la evolución.' : null}
        table={{
          columns: ['Fecha', metricUnit],
          rows: series.map((p) => [p.label, (metric === 'volume' ? p.volume : metric === 'topWeight' ? p.topWeight : p.bestReps) ?? '—']),
        }}
      >
        <SingleLineChart data={series} dataKey={metric} unit={metricUnit} />
      </ChartFrame>
    </div>
  )
}

/** Every completed session that included this exercise, newest first. */
export function ExerciseHistory({ exercise }: { exercise: Exercise }) {
  const { workouts, status } = useWorkoutHistory()
  const sessions = useMemo(
    () =>
      countedWorkouts(workouts)
        .map((w) => ({
          workout: w,
          sets: w.exercises.filter((e) => exerciseKey(e.exercise) === exercise.key).flatMap((e) => e.sets.filter(isWorkingSet)),
        }))
        .filter((s) => s.sets.length > 0)
        .reverse(),
    [workouts, exercise.key],
  )

  if (status === 'loading') return <p className="text-muted">Cargando historial…</p>
  if (sessions.length === 0) {
    return <p className="rounded-3xl border border-dashed border-border-strong p-6 text-center text-muted">Sin sesiones con este ejercicio todavía.</p>
  }

  return (
    <ul className="flex flex-col gap-2">
      {sessions.map(({ workout, sets }) => (
        <li key={workout.id}>
          <Link to={`/app/historial/${workout.id}`} className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4 hover:border-primary/40">
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">{formatShortDate(workout.localDate)}</span>
              <span className="block text-sm text-muted">{workout.routineName}</span>
              <span className="mt-1 block text-sm tabular-nums">
                {sets.map((s) => (s.weight ? `${formatNumber(s.weight)}×${s.reps}` : `${s.reps} reps`)).join(' · ')}
                {sets.some((s) => s.weight) ? ` ${workout.weightUnit}` : ''}
              </span>
            </span>
            <ChevronRight className="size-5 shrink-0 text-muted" aria-hidden="true" />
          </Link>
        </li>
      ))}
    </ul>
  )
}

function Stat({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl bg-surface p-4">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="mt-1 font-display text-2xl font-bold">{children}</dd>
    </div>
  )
}
