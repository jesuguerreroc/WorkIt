import { Link, Navigate, useParams } from 'react-router'
import { Flame, PartyPopper } from 'lucide-react'
import { ButtonLink } from '@/components/ui/Button'
import { FullScreenStatus } from '@/components/ui/FullScreenStatus'
import { useAuth } from '@/features/auth/authContext'
import { computeStreaks } from '@/features/streaks/streaks'
import { countedWorkouts } from '@/features/streaks/achievements'
import { useToday } from '@/hooks/useToday'
import { useLiveWorkout, useWorkoutHistory } from './useWorkouts'
import { WorkoutReport } from './WorkoutReport'

export function WorkoutSummaryPage() {
  const { id = '' } = useParams()
  const { profile } = useAuth()
  const live = useLiveWorkout(id)
  const { workouts } = useWorkoutHistory()
  const today = useToday()

  if (live.status === 'loading') return <FullScreenStatus variant="loading" title="Preparando el resumen…" />
  if (!live.workout) return <Navigate to="/app" replace />
  if (live.workout.status !== 'completed') return <Navigate to={`/app/entrenar/${id}`} replace />

  const workout = live.workout
  // Include this session even if the history listener has not received it yet.
  const all = [workout, ...workouts.filter((w) => w.id !== workout.id)]
  const streak = computeStreaks(countedWorkouts(all).map((w) => w.localDate), today)

  return (
    <div className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-6 px-4 pt-[calc(2rem+env(safe-area-inset-top))] pb-8">
      <header className="motion-safe:animate-rise">
        <PartyPopper className="size-10 text-primary" aria-hidden="true" />
        <h1 className="mt-3 font-display text-5xl leading-none font-bold uppercase">
          {workout.source === 'manual' ? 'Entrenamiento guardado' : '¡Entrenamiento completado!'}
        </h1>
        <p className="mt-2 text-muted">{workout.routineName}</p>
      </header>

      {streak.current > 0 && (
        <p className="flex items-center gap-3 rounded-2xl bg-surface-2 p-4 font-semibold">
          <Flame className="size-6 text-primary" aria-hidden="true" />
          {streak.current === 1 ? 'Racha: 1 día' : `Racha: ${streak.current} días seguidos`}
          {streak.current === streak.best && streak.best > 1 && <span className="text-primary">· ¡tu mejor racha!</span>}
        </p>
      )}

      <WorkoutReport workout={workout} unit={profile?.weightUnit ?? workout.weightUnit} />

      <div className="flex flex-col gap-3 sm:flex-row">
        <ButtonLink to="/app" size="lg">
          Ir al inicio
        </ButtonLink>
        <ButtonLink to="/app/progreso?vista=historial" size="lg" variant="secondary">
          Ver historial
        </ButtonLink>
      </div>
      <p className="text-sm text-muted">
        Cambios de esta sesión (series, descansos, ejercicios añadidos) no modifican tu rutina.{' '}
        <Link to="/app/rutinas" className="underline">
          Editar rutinas
        </Link>
      </p>
    </div>
  )
}
