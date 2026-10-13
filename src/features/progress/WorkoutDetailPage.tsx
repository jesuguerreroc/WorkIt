import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Button, ButtonLink } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/Dialog'
import { FullScreenStatus } from '@/components/ui/FullScreenStatus'
import { useAuth } from '@/features/auth/authContext'
import { useWorkoutHistory } from '@/features/workouts/useWorkouts'
import { WorkoutReport } from '@/features/workouts/WorkoutReport'
import { formatLongDate, dateFromKey } from '@/lib/dates'
import { deleteWorkout } from '@/services/workoutService'

export function WorkoutDetailPage() {
  const { id = '' } = useParams()
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const { workouts, status } = useWorkoutHistory()
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string>()

  if (status === 'loading') return <FullScreenStatus variant="loading" title="Cargando entrenamiento…" />
  const workout = workouts.find((w) => w.id === id && w.status === 'completed')
  if (!workout) return <Alert tone="error">Entrenamiento no encontrado.</Alert>

  const remove = async () => {
    if (!user) return
    setDeleting(true)
    try {
      await deleteWorkout(user.uid, workout.id)
      navigate('/app/progreso?vista=historial', { replace: true })
    } catch {
      setError('No se pudo eliminar. Revisa tu conexión.')
      setDeleting(false)
      setConfirming(false)
    }
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <button
        type="button"
        onClick={() => navigate('/app/progreso?vista=historial')}
        className="inline-flex min-h-11 items-center gap-2 self-start font-semibold text-muted hover:text-fg"
      >
        <ArrowLeft className="size-5" aria-hidden="true" />
        Historial
      </button>
      <header>
        <p className="text-muted first-letter:uppercase">{formatLongDate(dateFromKey(workout.localDate))}</p>
        <h1 className="text-[1.75rem] leading-tight font-bold tracking-tight sm:text-3xl">{workout.routineName}</h1>
        {workout.source === 'manual' && <p className="text-sm text-muted">Registrado después de la sesión.</p>}
      </header>
      <WorkoutReport workout={workout} unit={profile?.weightUnit ?? workout.weightUnit} />
      {error && <Alert tone="error">{error}</Alert>}
      <div className="flex flex-col gap-2 sm:flex-row">
      <ButtonLink to={`/app/entrenar/${workout.id}?editar=1`} variant="secondary">
        <Pencil className="size-4" aria-hidden="true" />
        Editar series
      </ButtonLink>
      <Button variant="dangerGhost" onClick={() => setConfirming(true)}>
        <Trash2 className="size-4" aria-hidden="true" />
        Eliminar entrenamiento
      </Button>
      </div>
      <ConfirmDialog
        open={confirming}
        title="Eliminar entrenamiento"
        description="Se borrará del historial. Tus rachas, récords y gráficos se recalcularán sin él."
        confirmLabel="Eliminar"
        tone="danger"
        busy={deleting}
        onConfirm={remove}
        onCancel={() => setConfirming(false)}
      />
    </div>
  )
}
