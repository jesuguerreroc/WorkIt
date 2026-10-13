import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { Award, CalendarPlus, ChevronRight, Lock } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { useAuth } from '@/features/auth/authContext'
import { computeAchievements, countedWorkouts } from '@/features/streaks/achievements'
import { StreakTiles } from '@/features/streaks/StreakTiles'
import { computeStreaks } from '@/features/streaks/streaks'
import { streakOptionsOf } from '@/features/streaks/streakOptions'
import { formatVolume } from '@/features/workouts/format'
import { useWorkoutHistory } from '@/features/workouts/useWorkouts'
import { bestsByExercise, fromKg, roundWeight } from '@/features/workouts/workoutMath'
import { cn } from '@/lib/cn'
import { useToday } from '@/hooks/useToday'
import { formatDuration, formatShortDate } from '@/lib/dates'
import { formatNumber } from '@/lib/numbers'
import type { WeightUnit } from '@/types/profile'
import type { Workout } from '@/types/workout'
import { ActivityCalendar } from './ActivityCalendar'
import { ChartFrame, SingleBarChart, SingleLineChart } from './charts'
import { ManualWorkoutDialog } from './ManualWorkoutDialog'
import { exerciseSeries, exercisesInHistory, filterByDate, weeklyBuckets } from './progressData'

const VIEWS = [
  { id: 'resumen', label: 'Resumen' },
  { id: 'historial', label: 'Historial' },
  { id: 'ejercicios', label: 'Ejercicios' },
  { id: 'logros', label: 'Logros' },
] as const
type View = (typeof VIEWS)[number]['id']

export function ProgressPage() {
  const [params, setParams] = useSearchParams()
  const view = (VIEWS.find((v) => v.id === params.get('vista'))?.id ?? 'resumen') as View
  const { profile } = useAuth()
  const unit = profile?.weightUnit ?? 'kg'
  const { workouts, status } = useWorkoutHistory()
  const today = useToday()
  const counted = useMemo(() => countedWorkouts(workouts), [workouts])
  const streak = useMemo(() => computeStreaks(counted.map((w) => w.localDate), today, streakOptionsOf(profile)), [counted, today, profile])

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <header>
        <h1 className="font-display text-4xl font-bold uppercase">Progreso</h1>
        <p className="mt-1 text-muted">Basado solo en tus entrenamientos registrados.</p>
      </header>

      <nav aria-label="Secciones de progreso" className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div className="flex gap-1 rounded-2xl border border-border bg-surface p-1 sm:inline-flex">
          {VIEWS.map((v) => (
            <button
              key={v.id}
              type="button"
              aria-pressed={view === v.id}
              onClick={() => setParams(v.id === 'resumen' ? {} : { vista: v.id }, { replace: true })}
              className={cn(
                'min-h-11 flex-1 rounded-xl px-4 text-sm font-semibold whitespace-nowrap',
                view === v.id ? 'bg-surface-3 text-fg' : 'text-muted hover:text-fg',
              )}
            >
              {v.label}
            </button>
          ))}
        </div>
      </nav>

      {status === 'loading' && <p className="text-muted">Cargando tu historial…</p>}
      {status === 'error' && <Alert tone="error">No se pudo cargar tu historial. Revisa tu conexión.</Alert>}
      {status === 'ready' && view === 'resumen' && <Summary workouts={workouts} unit={unit} today={today} streak={streak} />}
      {status === 'ready' && view === 'historial' && <History workouts={workouts} unit={unit} />}
      {status === 'ready' && view === 'ejercicios' && <ExerciseProgress workouts={workouts} unit={unit} />}
      {status === 'ready' && view === 'logros' && <Achievements workouts={workouts} streak={streak} />}
    </div>
  )
}

function Summary({
  workouts,
  unit,
  today,
  streak,
}: {
  workouts: Workout[]
  unit: WeightUnit
  today: string
  streak: ReturnType<typeof computeStreaks>
}) {
  const weeks = useMemo(() => weeklyBuckets(workouts, today, 8, unit), [workouts, today, unit])
  const noData = weeks.every((w) => w.sessions === 0) ? 'Aún no hay entrenamientos en las últimas 8 semanas.' : null

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="flex flex-col gap-4">
        <StreakTiles streak={streak} />
        <ActivityCalendar workouts={workouts} today={today} />
      </div>
      <div className="flex flex-col gap-4">
        <ChartFrame
          title="Sesiones por semana"
          subtitle="Últimas 8 semanas (lunes a domingo)"
          empty={noData}
          table={{ columns: ['Semana del', 'Sesiones'], rows: weeks.map((w) => [w.label, w.sessions]) }}
        >
          <SingleBarChart data={weeks} dataKey="sessions" unit="sesiones" />
        </ChartFrame>
        <ChartFrame
          title="Volumen semanal"
          subtitle={`Peso × repeticiones de las series de trabajo, en ${unit}`}
          empty={noData}
          table={{ columns: ['Semana del', `Volumen (${unit})`], rows: weeks.map((w) => [w.label, w.volume]) }}
        >
          <SingleBarChart data={weeks} dataKey="volume" unit={unit} />
        </ChartFrame>
        <p className="text-xs text-muted">
          El volumen mide el trabajo realizado; por sí solo no demuestra ganancia muscular.
        </p>
      </div>
    </div>
  )
}

function History({ workouts, unit }: { workouts: Workout[]; unit: WeightUnit }) {
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [manualOpen, setManualOpen] = useState(false)
  const list = useMemo(() => filterByDate(workouts, from || null, to || null), [workouts, from, to])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <DateInput id="from" label="Desde" value={from} onChange={setFrom} />
        <DateInput id="to" label="Hasta" value={to} onChange={setTo} />
        {(from || to) && (
          <button type="button" onClick={() => { setFrom(''); setTo('') }} className="min-h-11 self-start font-semibold text-primary hover:underline sm:self-end">
            Quitar fechas
          </button>
        )}
        <Button variant="secondary" className="sm:ml-auto" onClick={() => setManualOpen(true)}>
          <CalendarPlus className="size-4" aria-hidden="true" />
          Registrar entrenamiento pasado
        </Button>
      </div>

      {list.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-border-strong p-8 text-center text-muted">
          {from || to ? 'No hay entrenamientos en esas fechas.' : 'Todavía no has completado ningún entrenamiento.'}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {list.map((w) => (
            <li key={w.id}>
              <Link
                to={`/app/historial/${w.id}`}
                className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-4 hover:border-primary/40 hover:bg-surface-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{w.routineName}</p>
                  <p className="text-sm text-muted">
                    {formatShortDate(w.localDate)}
                    {w.summary?.durationSec ? ` · ${formatDuration(w.summary.durationSec)}` : ''}
                    {w.summary ? ` · ${w.summary.setsDone} series · ${formatVolume(w.summary.volumeKg, unit)}` : ''}
                    {w.source === 'manual' ? ' · registrado después' : ''}
                  </p>
                </div>
                {(w.summary?.records.length ?? 0) > 0 && (
                  <Award className="size-5 shrink-0 text-primary" aria-label="Con récord personal" />
                )}
                <ChevronRight className="size-5 shrink-0 text-muted" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      )}
      <ManualWorkoutDialog open={manualOpen} onClose={() => setManualOpen(false)} history={workouts} />
    </div>
  )
}

function DateInput({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={`history-${id}`} className="text-sm font-medium">
        {label}
      </label>
      <input
        id={`history-${id}`}
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-11 rounded-xl border border-control bg-surface px-4 text-base text-fg [color-scheme:dark] focus:border-primary focus:ring-2 focus:ring-primary/30 focus:outline-none"
      />
    </div>
  )
}

function ExerciseProgress({ workouts, unit }: { workouts: Workout[]; unit: WeightUnit }) {
  const options = useMemo(() => exercisesInHistory(workouts), [workouts])
  const [selected, setSelected] = useState('')
  const key = selected || options[0]?.key || ''
  const series = useMemo(() => (key ? exerciseSeries(workouts, key, unit) : []), [workouts, key, unit])
  const bests = useMemo(() => bestsByExercise(workouts).get(key), [workouts, key])
  const hasWeights = series.some((p) => p.topWeight !== null)

  if (options.length === 0) {
    return (
      <p className="rounded-3xl border border-dashed border-border-strong p-8 text-center text-muted">
        Completa entrenamientos para ver la evolución de cada ejercicio.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <Select
        label="Ejercicio"
        options={options.map((o) => ({ value: o.key, label: `${o.name} (${o.sessions} ${o.sessions === 1 ? 'sesión' : 'sesiones'})` }))}
        value={key}
        onChange={(e) => setSelected(e.target.value)}
        className="sm:max-w-md"
      />
      {bests && (
        <dl className="grid grid-cols-3 gap-3">
          <Record label="Peso máximo">{bests.weightKg > 0 ? `${formatNumber(roundWeight(fromKg(bests.weightKg, unit)))} ${unit}` : '—'}</Record>
          <Record label="Mejor serie">{bests.setVolumeKg > 0 ? formatVolume(bests.setVolumeKg, unit) : '—'}</Record>
          <Record label="Más reps">{bests.reps}</Record>
        </dl>
      )}
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartFrame
          title={hasWeights ? 'Peso máximo por sesión' : 'Repeticiones máximas por sesión'}
          subtitle={hasWeights ? `Serie de trabajo más pesada, en ${unit}. Es la carga levantada, no tu peso corporal.` : 'Ejercicio sin carga registrada'}
          empty={series.length < 2 ? 'Necesitas al menos 2 sesiones con este ejercicio para ver su evolución.' : null}
          table={{
            columns: ['Fecha', hasWeights ? `Peso (${unit})` : 'Reps'],
            rows: series.map((p) => [p.label, hasWeights ? (p.topWeight === null ? '—' : formatNumber(p.topWeight)) : p.bestReps]),
          }}
        >
          <SingleLineChart data={series} dataKey={hasWeights ? 'topWeight' : 'bestReps'} unit={hasWeights ? unit : 'reps'} />
        </ChartFrame>
        <ChartFrame
          title="Repeticiones máximas por sesión"
          subtitle="La serie de trabajo con más repeticiones"
          empty={series.length < 2 ? 'Necesitas al menos 2 sesiones con este ejercicio.' : null}
          table={{ columns: ['Fecha', 'Reps'], rows: series.map((p) => [p.label, p.bestReps]) }}
        >
          <SingleBarChart data={series} dataKey="bestReps" unit="reps" />
        </ChartFrame>
      </div>
    </div>
  )
}

function Record({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-3 sm:p-4">
      <dt className="text-xs text-muted sm:text-sm">{label}</dt>
      <dd className="mt-1 font-display text-2xl font-bold sm:text-3xl">{children}</dd>
    </div>
  )
}

function Achievements({ workouts, streak }: { workouts: Workout[]; streak: ReturnType<typeof computeStreaks> }) {
  const list = computeAchievements(workouts, streak)
  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {list.map((a) => (
        <li
          key={a.id}
          className={cn('flex gap-4 rounded-3xl border p-4', a.achievedOn ? 'border-primary/40 bg-primary-soft' : 'border-border bg-surface')}
        >
          <span
            className={cn(
              'flex size-12 shrink-0 items-center justify-center rounded-2xl',
              a.achievedOn ? 'bg-primary text-on-primary' : 'bg-surface-2 text-subtle',
            )}
          >
            {a.achievedOn ? <Award className="size-6" aria-hidden="true" /> : <Lock className="size-5" aria-hidden="true" />}
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold">{a.title}</p>
            <p className="text-sm text-muted">
              {a.achievedOn ? `Conseguido el ${formatShortDate(a.achievedOn)}` : a.description}
            </p>
            {!a.achievedOn && (
              <div
                className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-3"
                role="progressbar"
                aria-label={`Progreso de ${a.title}`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(a.progress * 100)}
              >
                <div className="h-full origin-left rounded-full bg-primary" style={{ transform: `scaleX(${a.progress})` }} />
              </div>
            )}
          </div>
        </li>
      ))}
    </ul>
  )
}
