import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { ListPlus } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { useAuth } from '@/features/auth/authContext'
import { appendExerciseToRoutine } from '@/services/routineService'
import type { Exercise } from '@/types/exercise'
import { ROUTINE_LIMITS } from '@/types/routine'
import type { NewRoutineState } from './RoutineEditorPage'
import { routineExerciseFrom } from './routineLogic'
import { useRoutines } from './useRoutines'

/** "Añadir a una rutina" from an exercise's detail page. */
export function AddToRoutineButton({ exercise }: { exercise: Exercise }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { routines, status } = useRoutines()
  const [open, setOpen] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [result, setResult] = useState<{ tone: 'success' | 'error'; text: string; routineId?: string }>()
  const active = routines.filter((r) => r.status === 'active')

  const add = async (routineId: string) => {
    const routine = active.find((r) => r.id === routineId)
    if (!user || !routine) return
    setBusyId(routineId)
    try {
      await appendExerciseToRoutine(user.uid, routine, routineExerciseFrom(exercise))
      setResult({ tone: 'success', text: `Añadido a «${routine.name}».`, routineId })
      setOpen(false)
    } catch {
      setResult({ tone: 'error', text: 'No se pudo añadir. Revisa tu conexión.' })
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <Button size="lg" onClick={() => setOpen(true)}>
        <ListPlus className="size-5" aria-hidden="true" />
        Añadir a una rutina
      </Button>
      {result && (
        <Alert tone={result.tone}>
          {result.text}{' '}
          {result.routineId && (
            <Link to={`/app/rutinas/${result.routineId}/editar`} className="font-semibold text-fg underline">
              Ajustar series y descansos
            </Link>
          )}
        </Alert>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} title="Añadir a una rutina" description={exercise.name}>
        <div className="flex flex-col gap-2">
          {status === 'loading' && <p className="text-muted">Cargando rutinas…</p>}
          {status === 'ready' && active.length === 0 && <p className="text-muted">Todavía no tienes rutinas activas.</p>}
          {active.map((routine) => {
            const full = routine.exercises.length >= ROUTINE_LIMITS.exercisesMax
            const already = routine.exercises.some((e) => e.exercise.source === exercise.ref.source && e.exercise.id === exercise.ref.id)
            return (
              <button
                key={routine.id}
                type="button"
                disabled={busyId !== null || full}
                onClick={() => add(routine.id)}
                className="flex min-h-16 w-full flex-col items-start justify-center rounded-2xl border border-border px-4 py-2 text-left hover:border-primary/50 hover:bg-surface-2 disabled:opacity-50"
              >
                <span className="font-semibold">{busyId === routine.id ? 'Añadiendo…' : routine.name}</span>
                <span className="text-sm text-muted">
                  {routine.exercises.length} ejercicios
                  {already && ' · ya lo incluye'}
                  {full && ' · completa'}
                </span>
              </button>
            )
          })}
          <Button
            variant="secondary"
            className="mt-2"
            onClick={() =>
              navigate('/app/rutinas/nueva', {
                state: { initialExercises: [routineExerciseFrom(exercise)] } satisfies NewRoutineState,
              })
            }
          >
            Nueva rutina con este ejercicio
          </Button>
        </div>
      </Dialog>
    </div>
  )
}
