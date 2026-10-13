import { useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { CalendarDays, ChevronRight, Dumbbell, Flame, ListChecks, Moon, Play, Plus, Timer } from 'lucide-react'
import { Button, ButtonLink } from '@/components/ui/Button'
import { useAuth } from '@/features/auth/authContext'
import { isoWeekday, weekdayName } from '@/features/profile/profileOptions'
import { weeklyBuckets } from '@/features/progress/progressData'
import { estimateRoutineMinutes } from '@/features/routines/routineLogic'
import { useRoutines } from '@/features/routines/useRoutines'
import { countedWorkouts } from '@/features/streaks/achievements'
import { StreakWeek } from '@/features/streaks/StreakWeek'
import { computeStreaks } from '@/features/streaks/streaks'
import { StartConflictDialog } from '@/features/workouts/StartConflictDialog'
import { useStartWorkout, workoutPath } from '@/features/workouts/useStartWorkout'
import { formatDuration, formatLongDate, formatShortDate, localDateKey } from '@/lib/dates'
import type { Routine } from '@/types/routine'

const integer = new Intl.NumberFormat('es', { maximumFractionDigits: 0 })

/** Home: today's plan, streak and this week's real numbers. Nothing is invented. */
export function DashboardPage() {
  const { profile } = useAuth()
  const [today] = useState(() => new Date())
  const todayKey = localDateKey(today)
  const weekday = isoWeekday(today)
  const unit = profile?.weightUnit ?? 'kg'
  const { routines, status: routinesStatus } = useRoutines()
  const starter = useStartWorkout()
  const { active, history } = starter

  const counted = useMemo(() => countedWorkouts(history), [history])
  const streak = useMemo(() => computeStreaks(counted.map((w) => w.localDate), todayKey), [counted, todayKey])
  // Volume here is already in the user's unit.
  const thisWeek = useMemo(() => weeklyBuckets(history, todayKey, 1, unit)[0], [history, todayKey, unit])
  const trainedDays = useMemo(() => new Set(streak.days), [streak.days])
  const recent = useMemo(() => [...counted].reverse().slice(0, 3), [counted])

  const activeRoutines = routines.filter((r) => r.status === 'active')
  const todays = activeRoutines.filter((r) => r.days.includes(weekday))
  const name = profile?.displayName.trim()
  const plannedDays = profile?.trainingDays.length ?? 0

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <header className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-muted first-letter:uppercase">{formatLongDate(today)}</p>
          <h1 className="mt-1 font-display text-4xl font-bold uppercase sm:text-5xl">{name ? `Hola, ${name}` : 'Hola'}</h1>
        </div>
        <Link
          to="/app/racha"
          aria-label={`Racha: ${streak.current} ${streak.current === 1 ? 'día' : 'días'}. Ver detalles`}
          className="flex min-h-11 shrink-0 items-center gap-1.5 rounded-full bg-surface px-4 font-display text-2xl font-bold tabular-nums hover:bg-surface-2"
        >
          <Flame className={streak.current > 0 ? 'size-6 fill-primary/30 text-primary' : 'size-6 text-subtle'} aria-hidden="true" />
          {streak.current}
        </Link>
      </header>

      {active && (
        <Link
          to={workoutPath(active.id)}
          className="flex items-center gap-4 rounded-3xl border border-primary/50 bg-primary-soft p-5 transition-colors hover:bg-primary/20"
        >
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-on-primary">
            <Timer className="size-6" aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-primary">Entrenamiento en curso</span>
            <span className="block truncate text-lg font-semibold">{active.routineName}</span>
          </span>
          <span className="flex items-center gap-1 font-semibold">
            Continuar <ChevronRight className="size-5" aria-hidden="true" />
          </span>
        </Link>
      )}

      <section aria-labelledby="today-title" className="rounded-3xl border border-border bg-surface p-5 sm:p-7">
        <p id="today-title" className="text-sm font-semibold tracking-wider text-primary uppercase">
          Hoy
        </p>
        {routinesStatus === 'loading' ? (
          <p className="mt-2 text-muted">Cargando tus rutinas…</p>
        ) : activeRoutines.length === 0 ? (
          <FirstSteps />
        ) : todays.length > 0 ? (
          <div className="mt-2 flex flex-col gap-5">
            {todays.map((routine) => (
              <TodayRoutine key={routine.id} routine={routine} onStart={() => starter.start(routine)} disabled={Boolean(active)} />
            ))}
          </div>
        ) : (
          <div className="mt-2 flex flex-col gap-4">
            <p className="flex items-center gap-3 font-display text-3xl font-bold uppercase">
              <Moon className="size-7 text-muted" aria-hidden="true" />
              Sin rutina programada
            </p>
            <p className="text-muted">
              {plannedDays > 0 && !profile?.trainingDays.includes(weekday)
                ? `${weekdayName(weekday)} no es uno de tus días de entrenamiento. Descansar también forma parte del progreso. Si aun así quieres entrenar:`
                : 'Ninguna de tus rutinas tiene asignado este día. Si quieres entrenar, elige una:'}
            </p>
            <ul className="flex flex-col gap-2">
              {activeRoutines.slice(0, 4).map((routine) => (
                <li key={routine.id} className="flex items-center gap-3 rounded-2xl bg-surface-2 p-3">
                  <span className="min-w-0 flex-1 truncate font-semibold">{routine.name}</span>
                  <Button variant="secondary" onClick={() => starter.start(routine)} disabled={Boolean(active)}>
                    <Play className="size-4 fill-current" aria-hidden="true" />
                    Empezar
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <Link
        to="/app/racha"
        className="block rounded-[2rem] bg-surface p-5 transition-colors hover:bg-surface-2 sm:p-6"
        aria-label={`Racha de ${streak.current} días, mejor racha ${streak.best}. Ver calendario de racha`}
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-display text-6xl leading-none font-bold tabular-nums">{streak.current}</p>
            <p className="mt-1 font-semibold">{streak.current === 1 ? 'Día de racha' : 'Días de racha'}</p>
            <p className="text-sm text-muted">Mejor racha: {streak.best}</p>
          </div>
          <Flame
            className={streak.current > 0 ? 'size-16 fill-primary/20 text-primary' : 'size-16 text-border-strong'}
            strokeWidth={1.5}
            aria-hidden="true"
          />
        </div>
        <div className="mt-4">
          <StreakWeek trainedDays={trainedDays} today={todayKey} />
        </div>
      </Link>

      {counted.length === 0 ? (
        <section className="rounded-3xl border border-dashed border-border-strong p-6 sm:p-8">
          <h2 className="font-display text-2xl font-bold uppercase">Tu actividad</h2>
          <p className="mt-2 max-w-lg text-muted">
            Todavía no hay entrenamientos completados. Tu racha, tus sesiones de la semana y tu volumen aparecerán aquí
            cuando termines tu primera sesión.
          </p>
        </section>
      ) : (
        <div className="grid gap-4">
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <Tile label="Sesiones esta semana">
                {thisWeek.sessions}
                {plannedDays > 0 && <span className="text-2xl text-subtle">/{plannedDays}</span>}
              </Tile>
              <Tile label="Volumen esta semana">
                {integer.format(thisWeek.volume)}
                <span className="ml-1 text-2xl text-subtle">{unit}</span>
              </Tile>
            </div>
            <section aria-labelledby="recent-title" className="rounded-3xl border border-border bg-surface p-5">
              <div className="flex items-center justify-between">
                <h2 id="recent-title" className="font-semibold">
                  Últimos entrenamientos
                </h2>
                <Link to="/app/progreso?vista=historial" className="text-sm font-semibold text-primary hover:underline">
                  Ver todo
                </Link>
              </div>
              <ul className="mt-2 flex flex-col divide-y divide-border">
                {recent.map((w) => (
                  <li key={w.id}>
                    <Link to={`/app/historial/${w.id}`} className="flex min-h-14 items-center gap-3 py-2 hover:text-primary">
                      <span className="min-w-0 flex-1">
                        <span className="block truncate">{w.routineName}</span>
                        <span className="block text-sm text-muted">
                          {formatShortDate(w.localDate)}
                          {w.summary?.durationSec ? ` · ${formatDuration(w.summary.durationSec)}` : ''}
                        </span>
                      </span>
                      <ChevronRight className="size-4 text-muted" aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      )}

      <nav aria-label="Accesos rápidos" className="grid grid-cols-2 gap-3">
        <QuickLink to="/app/rutinas" icon={<ListChecks className="size-5" aria-hidden="true" />} label="Mis rutinas" />
        <QuickLink to="/app/ejercicios" icon={<Dumbbell className="size-5" aria-hidden="true" />} label="Ejercicios" />
      </nav>

      <StartConflictDialog starter={starter} />
    </div>
  )
}

function TodayRoutine({ routine, onStart, disabled }: { routine: Routine; onStart: () => void; disabled: boolean }) {
  const sets = routine.exercises.reduce((sum, e) => sum + e.sets, 0)
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <Link to={`/app/rutinas/${routine.id}`} className="group block">
          <p className="font-display text-3xl leading-tight font-bold uppercase group-hover:text-primary">{routine.name}</p>
          <p className="flex items-center gap-1 text-muted">
            {routine.exercises.length} ejercicios · {sets} series · ≈ {estimateRoutineMinutes(routine.exercises)} min
            <span className="ml-1 font-semibold text-primary">Ver rutina</span>
            <ChevronRight className="size-4 text-primary" aria-hidden="true" />
          </p>
        </Link>
      </div>
      <Button size="lg" onClick={onStart} disabled={disabled || routine.exercises.length === 0}>
        <Play className="size-5 fill-current" aria-hidden="true" />
        Comenzar entrenamiento
      </Button>
    </div>
  )
}

function FirstSteps() {
  return (
    <div className="mt-2 flex flex-col gap-4">
      <p className="font-display text-3xl font-bold uppercase">Crea tu primera rutina</p>
      <p className="max-w-lg text-muted">
        Elige ejercicios, series, repeticiones y descansos. Después, empieza a entrenar desde aquí cada día que toque.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <ButtonLink to="/app/rutinas/nueva">
          <Plus className="size-4" aria-hidden="true" />
          Crear rutina
        </ButtonLink>
        <ButtonLink to="/app/rutinas" variant="secondary">
          <CalendarDays className="size-4" aria-hidden="true" />
          Usar una rutina de ejemplo
        </ButtonLink>
      </div>
    </div>
  )
}

function Tile({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-3xl border border-border bg-surface p-4 sm:p-5">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 font-display text-4xl font-bold">{children}</p>
    </div>
  )
}

function QuickLink({ to, icon, label }: { to: string; icon: ReactNode; label: string }) {
  return (
    <Link
      to={to}
      className="flex min-h-14 items-center gap-3 rounded-2xl border border-border bg-surface px-4 font-semibold transition-colors hover:border-primary/40 hover:bg-surface-2"
    >
      <span className="text-primary">{icon}</span>
      {label}
      <ChevronRight className="ml-auto size-4 text-muted" aria-hidden="true" />
    </Link>
  )
}
