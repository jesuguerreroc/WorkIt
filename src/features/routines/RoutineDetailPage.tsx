import { useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { ArrowLeft, ChevronRight, Dumbbell, Pencil, Play, Plus } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { FullScreenStatus } from '@/components/ui/FullScreenStatus'
import { exerciseDetailPath } from '@/features/exercises/paths'
import { muscleGroupLabels, muscleGroupOf, muscleLabels } from '@/features/exercises/taxonomy'
import { useAllExercises } from '@/features/exercises/useExercises'
import { weekdayOptions } from '@/features/profile/profileOptions'
import { StartConflictDialog } from '@/features/workouts/StartConflictDialog'
import { useStartWorkout } from '@/features/workouts/useStartWorkout'
import type { Exercise, MuscleGroup } from '@/types/exercise'
import type { Routine } from '@/types/routine'
import { estimateRoutineMinutes, formatRest } from './routineLogic'
import { useRoutines } from './useRoutines'

export function RoutineDetailPage() {
  const { id } = useParams()
  const { routines, status } = useRoutines()
  if (status === 'loading') return <FullScreenStatus variant="loading" title="Cargando rutina…" />
  const routine = routines.find((r) => r.id === id)
  if (!routine) return <Alert tone="error">Rutina no encontrada.</Alert>
  return <RoutineDetail routine={routine} />
}

/** Share of sets per muscle group (primary muscles), highest first. */
function muscleDistribution(routine: Routine, resolve: (ref: Routine['exercises'][number]['exercise']) => Exercise | undefined) {
  const sets = new Map<MuscleGroup, number>()
  let total = 0
  for (const item of routine.exercises) {
    const groups = new Set(
      (resolve(item.exercise)?.primaryMuscles ?? []).map(muscleGroupOf).filter((g): g is MuscleGroup => g !== null),
    )
    for (const group of groups) {
      sets.set(group, (sets.get(group) ?? 0) + item.sets)
      total += item.sets
    }
  }
  return [...sets.entries()]
    .map(([group, count]) => ({ group, percent: total ? Math.round((count / total) * 100) : 0 }))
    .sort((a, b) => b.percent - a.percent)
}

function RoutineDetail({ routine }: { routine: Routine }) {
  const navigate = useNavigate()
  const starter = useStartWorkout()
  const { resolve } = useAllExercises()
  const minutes = estimateRoutineMinutes(routine.exercises)
  const distribution = useMemo(() => muscleDistribution(routine, resolve), [routine, resolve])
  const days = weekdayOptions.filter((o) => routine.days.includes(o.value)).map((o) => o.ariaLabel)
  const archived = routine.status === 'archived'

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5 pb-28">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/app/rutinas'))}
          aria-label="Volver"
          className="-ml-2 flex size-11 items-center justify-center rounded-xl hover:bg-surface-2"
        >
          <ArrowLeft className="size-6" aria-hidden="true" />
        </button>
        <Link
          to={`/app/rutinas/${routine.id}/editar`}
          className="-mr-2 flex min-h-11 items-center gap-2 rounded-xl px-3 font-semibold text-muted hover:bg-surface-2 hover:text-fg"
        >
          <Pencil className="size-4" aria-hidden="true" />
          Editar
        </Link>
      </div>

      <header>
        <h1 className="text-[1.75rem] leading-tight font-bold tracking-tight sm:text-3xl">{routine.name}</h1>
        <p className="mt-2 text-muted">
          {routine.exercises.length} {routine.exercises.length === 1 ? 'ejercicio' : 'ejercicios'} · ≈ {minutes} min
          {days.length > 0 && <> · {days.join(', ')}</>}
        </p>
        <p className="text-xs text-subtle">Duración estimada con tus descansos configurados.</p>
      </header>

      {distribution.length > 0 && (
        <section aria-labelledby="distribution-title">
          <h2 id="distribution-title" className="text-lg font-semibold">
            Distribución muscular
          </h2>
          <ul className="-mx-4 mt-3 flex gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
            {distribution.map(({ group, percent }) => (
              <li key={group} className="flex min-w-36 shrink-0 flex-col gap-2 rounded-2xl bg-surface p-3">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-semibold">{muscleGroupLabels[group]}</span>
                  <span className="rounded-full bg-surface-2 px-2 py-0.5 text-sm font-semibold tabular-nums">{percent}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-surface-3" aria-hidden="true">
                  <div className="h-full origin-left rounded-full bg-primary" style={{ transform: `scaleX(${percent / 100})` }} />
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-subtle">Porcentaje de series por músculo principal.</p>
        </section>
      )}

      <section aria-labelledby="exercises-title">
        <div className="flex items-center justify-between">
          <h2 id="exercises-title" className="text-lg font-semibold">
            {routine.exercises.length} {routine.exercises.length === 1 ? 'Ejercicio' : 'Ejercicios'}
          </h2>
          <Link
            to={`/app/rutinas/${routine.id}/editar`}
            aria-label="Añadir o cambiar ejercicios"
            className="flex size-11 items-center justify-center rounded-xl bg-surface hover:bg-surface-2"
          >
            <Plus className="size-5" aria-hidden="true" />
          </Link>
        </div>
        <ol className="mt-2 flex flex-col divide-y divide-border">
          {routine.exercises.map((item) => {
            const exercise = resolve(item.exercise)
            const muscles = exercise ? [...exercise.primaryMuscles, ...exercise.secondaryMuscles].slice(0, 3).map((m) => muscleLabels[m]) : []
            const reps = item.repsMin === item.repsMax ? item.repsMin : `${item.repsMin}–${item.repsMax}`
            return (
              <li key={item.id}>
                <Link to={exerciseDetailPath(item.exercise)} className="flex items-center gap-4 py-3 hover:text-primary">
                  <span className="relative size-16 shrink-0 overflow-hidden rounded-2xl bg-white">
                    {exercise?.images[0] ? (
                      <img src={exercise.images[0]} alt="" loading="lazy" className="size-full object-cover" />
                    ) : (
                      <span className="flex size-full items-center justify-center bg-surface-2 text-subtle">
                        <Dumbbell className="size-6" aria-hidden="true" />
                      </span>
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block leading-snug font-semibold">{item.exercise.name}</span>
                    {muscles.length > 0 && <span className="block truncate text-sm text-muted">{muscles.join(', ')}</span>}
                    <span className="block text-sm text-subtle tabular-nums">
                      {item.sets} × {reps} · descanso {formatRest(item.restBetweenSets)}
                    </span>
                  </span>
                  <ChevronRight className="size-5 shrink-0 text-muted" aria-hidden="true" />
                </Link>
              </li>
            )
          })}
        </ol>
      </section>

      {!archived && routine.exercises.length > 0 && (
        <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30 px-4 pb-3 lg:bottom-0 lg:left-64 lg:pb-6">
          <div className="mx-auto max-w-3xl">
            <Button size="lg" className="w-full shadow-2xl shadow-black/60" onClick={() => starter.start(routine)}>
              <Play className="size-5 fill-current" aria-hidden="true" />
              Empezar entrenamiento
            </Button>
          </div>
        </div>
      )}
      <StartConflictDialog starter={starter} />
    </div>
  )
}
