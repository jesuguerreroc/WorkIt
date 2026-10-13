import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { ArrowLeft, ChevronRight, Dumbbell, FolderOpen, Plus } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/features/auth/authContext'
import { useExerciseCatalog } from '@/features/exercises/useExercises'
import { weekdayOptions } from '@/features/profile/profileOptions'
import { estimateRoutineMinutes, newId } from '@/features/routines/routineLogic'
import { useRoutines } from '@/features/routines/useRoutines'
import { cn } from '@/lib/cn'
import { createRoutine } from '@/services/routineService'
import type { RoutineExercise } from '@/types/routine'
import { PROGRAMS, programCategoryLabels, type Program, type ProgramCategory, type ProgramWorkout } from './programs'

function toRoutineExercises(workout: ProgramWorkout): RoutineExercise[] {
  return workout.exercises.map((item) => ({
    id: newId(),
    exercise: { source: 'catalog', id: item.id, name: item.name },
    sets: item.sets,
    repsMin: item.repsMin,
    repsMax: item.repsMax,
    weight: null,
    restBetweenSets: item.rest,
    restAfterExercise: 120,
    notes: '',
  }))
}

function useImages() {
  const { exercises } = useExerciseCatalog()
  return useMemo(() => new Map(exercises.map((e) => [e.ref.id, e.images[0]])), [exercises])
}

/** 2×2 mosaic with the first exercise of each workout. */
function Mosaic({ program, images, className }: { program: Program; images: Map<string, string | undefined>; className?: string }) {
  const ids = program.workouts.map((w) => w.exercises[0].id).slice(0, 4)
  return (
    <span className={cn('grid shrink-0 grid-cols-2 gap-0.5 overflow-hidden rounded-2xl bg-surface-2', className)} aria-hidden="true">
      {Array.from({ length: 4 }, (_, i) => {
        const src = ids[i] ? images.get(ids[i]) : undefined
        return src ? (
          <img key={i} src={src} alt="" loading="lazy" className="aspect-square size-full bg-white object-cover" />
        ) : (
          <span key={i} className="flex aspect-square items-center justify-center bg-surface-3 text-subtle">
            <Dumbbell className="size-4" />
          </span>
        )
      })}
    </span>
  )
}

export function ProgramsPage() {
  const images = useImages()
  const [category, setCategory] = useState<ProgramCategory | 'all'>('all')
  const list = PROGRAMS.filter((p) => category === 'all' || p.category === category)

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <Link to="/app/rutinas" className="inline-flex min-h-11 items-center gap-2 self-start font-semibold text-muted hover:text-fg">
        <ArrowLeft className="size-5" aria-hidden="true" />
        Rutinas
      </Link>
      <header>
        <h1 className="text-[1.75rem] leading-tight font-bold tracking-tight sm:text-3xl">Explorar programas</h1>
        <p className="mt-1 text-muted">Plantillas listas para usar. Al añadir una, sus entrenamientos se convierten en rutinas tuyas que puedes editar.</p>
      </header>

      <div role="group" aria-label="Categoría" className="flex flex-wrap gap-2">
        {(['all', 'gym', 'basic'] as const).map((c) => (
          <button
            key={c}
            type="button"
            aria-pressed={category === c}
            onClick={() => setCategory(c)}
            className={cn(
              'min-h-11 rounded-full border px-4 text-sm font-semibold',
              category === c ? 'border-primary bg-primary text-on-primary' : 'border-border-strong text-muted hover:text-fg',
            )}
          >
            {c === 'all' ? 'Todos' : programCategoryLabels[c]}
          </button>
        ))}
      </div>

      <ul className="flex flex-col divide-y divide-border">
        {list.map((program) => (
          <li key={program.id}>
            <Link to={`/app/programas/${program.id}`} className="flex items-center gap-4 py-3 hover:text-primary">
              <Mosaic program={program} images={images} className="size-20" />
              <span className="min-w-0 flex-1">
                <span className="block text-lg leading-snug font-semibold">{program.name}</span>
                <span className="flex items-center gap-1.5 text-sm text-muted">
                  <FolderOpen className="size-4" aria-hidden="true" />
                  Programa · {program.workouts.length} entrenamientos
                </span>
                <span className="block text-sm text-subtle">
                  {program.level} · {program.focus}
                </span>
              </span>
              <ChevronRight className="size-5 shrink-0 text-muted" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
      <p className="text-xs text-subtle">Plantillas generales de entrenamiento; ajústalas a tu nivel. No sustituyen el consejo de un profesional.</p>
    </div>
  )
}

export function ProgramDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const images = useImages()
  const { routines } = useRoutines()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()
  const program = PROGRAMS.find((p) => p.id === id)

  if (!program) return <Alert tone="error">Programa no encontrado.</Alert>

  const routineName = (w: ProgramWorkout) => `${program.short} · ${w.name}`
  const alreadyAdded = program.workouts.every((w) => routines.some((r) => r.name === routineName(w) && r.status === 'active'))

  const add = async () => {
    if (!user || busy) return
    setBusy(true)
    setError(undefined)
    try {
      for (const workout of program.workouts) {
        await createRoutine(user.uid, { name: routineName(workout), days: workout.days, exercises: toRoutineExercises(workout) })
      }
      navigate('/app/rutinas', { replace: true })
    } catch {
      setError('No se pudieron crear las rutinas. Revisa tu conexión e inténtalo de nuevo.')
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5 pb-28">
      <Link to="/app/programas" className="inline-flex min-h-11 items-center gap-2 self-start font-semibold text-muted hover:text-fg">
        <ArrowLeft className="size-5" aria-hidden="true" />
        Programas
      </Link>
      <header className="flex items-start gap-4">
        <Mosaic program={program} images={images} className="size-24" />
        <div className="min-w-0">
          <h1 className="text-[1.75rem] leading-tight font-bold tracking-tight sm:text-3xl">{program.name}</h1>
          <p className="mt-2 text-sm text-muted">
            {programCategoryLabels[program.category]} · {program.level} · {program.focus}
          </p>
        </div>
      </header>
      <p className="text-muted">{program.description}</p>

      {program.workouts.map((workout) => (
        <section key={workout.name} aria-label={workout.name} className="rounded-3xl bg-surface p-4 sm:p-5">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-lg leading-snug font-semibold">{workout.name}</h2>
            <p className="shrink-0 text-sm text-muted">
              {workout.exercises.length} ejercicios · ≈ {estimateRoutineMinutes(toRoutineExercises(workout))} min
            </p>
          </div>
          <p className="text-sm text-subtle">
            Días sugeridos: {weekdayOptions.filter((o) => workout.days.includes(o.value)).map((o) => o.ariaLabel).join(', ')}
          </p>
          <ol className="mt-3 flex flex-col gap-2">
            {workout.exercises.map((item) => (
              <li key={item.id}>
                <Link to={`/app/ejercicios/catalog/${encodeURIComponent(item.id)}`} className="flex items-center gap-3 hover:text-primary">
                  <span className="size-12 shrink-0 overflow-hidden rounded-xl bg-white">
                    {images.get(item.id) && <img src={images.get(item.id)} alt="" loading="lazy" className="size-full object-cover" />}
                  </span>
                  <span className="min-w-0 flex-1 text-sm">
                    <span className="block font-semibold">{item.name}</span>
                    <span className="text-muted tabular-nums">
                      {item.sets} × {item.repsMin === item.repsMax ? item.repsMin : `${item.repsMin}–${item.repsMax}`}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      ))}

      {error && <Alert tone="error">{error}</Alert>}
      <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30 px-4 pb-3 lg:bottom-0 lg:left-64 lg:pb-6">
        <div className="mx-auto flex max-w-3xl flex-col gap-1">
          {alreadyAdded && <p className="rounded-xl bg-surface-2 px-3 py-2 text-center text-sm text-muted">Ya tienes estas rutinas. Añadirlo otra vez creará copias.</p>}
          <Button size="lg" className="w-full shadow-2xl shadow-black/60" onClick={add} loading={busy}>
            <Plus className="size-5" aria-hidden="true" />
            Añadir {program.workouts.length} rutinas a las mías
          </Button>
        </div>
      </div>
    </div>
  )
}
