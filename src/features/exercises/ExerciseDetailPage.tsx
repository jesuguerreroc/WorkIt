import { useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Button, ButtonLink } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/Dialog'
import { FullScreenStatus } from '@/components/ui/FullScreenStatus'
import { useAuth } from '@/features/auth/authContext'
import { AddToRoutineButton } from '@/features/routines/AddToRoutineButton'
import { deleteCustomExercise } from '@/services/customExerciseService'
import { exerciseProvider } from '@/services/exerciseApi'
import type { Exercise } from '@/types/exercise'
import { ExerciseImage } from './ExerciseImage'
import { ExerciseHistory, ExerciseStats } from './ExerciseProgress'
import { equipmentLabels, exerciseTypeLabels, levelLabels, muscleLabels } from './taxonomy'
import { useCustomExercises, useExerciseCatalog } from './useExercises'

export function ExerciseDetailPage() {
  const { source, id = '' } = useParams()
  const catalog = useExerciseCatalog()
  const custom = useCustomExercises()
  const isCustom = source === 'custom'
  const list = isCustom ? custom : catalog

  if (source !== 'catalog' && source !== 'custom') return <NotFound />
  if (list.status === 'loading') return <FullScreenStatus variant="loading" title="Cargando ejercicio…" />
  if (list.status === 'error') {
    return (
      <Alert tone="error" title="No se pudo cargar el ejercicio">
        Revisa tu conexión e inténtalo de nuevo.
      </Alert>
    )
  }

  const exercise = list.exercises.find((e) => e.ref.id === id)
  if (!exercise) return <NotFound />
  return <ExerciseDetail exercise={exercise} />
}

function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-start gap-4">
      <BackLink />
      <Alert tone="error" title="Ejercicio no encontrado">
        Puede que se haya eliminado o que el enlace no sea correcto.
      </Alert>
    </div>
  )
}

function BackLink() {
  const navigate = useNavigate()
  return (
    <button
      type="button"
      // Back keeps the library's filters (they live in the previous URL).
      onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/app/ejercicios'))}
      className="inline-flex min-h-11 items-center gap-2 font-semibold text-muted hover:text-fg"
    >
      <ArrowLeft className="size-5" aria-hidden="true" />
      Ejercicios
    </button>
  )
}

const TABS = [
  { id: 'resumen', label: 'Resumen' },
  { id: 'guia', label: 'Guía' },
  { id: 'historial', label: 'Historial' },
] as const

function ExerciseDetail({ exercise }: { exercise: Exercise }) {
  const isCustom = exercise.ref.source === 'custom'
  const [tab, setTab] = useState<(typeof TABS)[number]['id']>('resumen')

  return (
    <article className="mx-auto flex max-w-5xl flex-col gap-6">
      <BackLink />

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr] lg:items-start">
        <ExerciseImage images={exercise.images} alt={`Demostración de ${exercise.name}`} animated />

        <div className="flex flex-col gap-5">
          <header>
            <h1 className="font-display text-4xl leading-none font-bold uppercase">{exercise.name}</h1>
            {exercise.originalName && (
              <p className="mt-2 text-sm text-muted">
                Nombre original: <span lang="en">{exercise.originalName}</span>
              </p>
            )}
            {isCustom && <p className="mt-2 text-sm text-primary">Ejercicio personalizado</p>}
          </header>

          <div className="flex flex-wrap gap-2">
            <Tag>{exerciseTypeLabels[exercise.type]}</Tag>
            <Tag>{equipmentLabels[exercise.equipment]}</Tag>
            {exercise.level && <Tag>{levelLabels[exercise.level]}</Tag>}
          </div>

          <dl className="grid gap-4 sm:grid-cols-2">
            <Info label="Músculo principal">
              {exercise.primaryMuscles.map((m) => muscleLabels[m]).join(', ') || 'Sin especificar'}
            </Info>
            <Info label="Músculos secundarios">
              {exercise.secondaryMuscles.map((m) => muscleLabels[m]).join(', ') || 'Ninguno'}
            </Info>
            {isCustom && exercise.suggestedSets && (
              <Info label="Prescripción sugerida">
                {exercise.suggestedSets} series
                {exercise.suggestedRepsMin
                  ? ` de ${exercise.suggestedRepsMin}${exercise.suggestedRepsMax && exercise.suggestedRepsMax !== exercise.suggestedRepsMin ? `–${exercise.suggestedRepsMax}` : ''} repeticiones`
                  : ''}
              </Info>
            )}
          </dl>

          <div className="flex flex-col gap-3 sm:flex-row">
            <AddToRoutineButton exercise={exercise} />
            {isCustom && <CustomActions exercise={exercise} />}
          </div>
        </div>
      </div>

      <div role="tablist" aria-label="Secciones del ejercicio" className="flex gap-1 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls={`panel-${t.id}`}
            onClick={() => setTab(t.id)}
            className={`-mb-px min-h-12 flex-1 border-b-2 px-3 font-semibold transition-colors sm:flex-none ${tab === t.id ? 'border-primary text-fg' : 'border-transparent text-muted hover:text-fg'}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
        {tab === 'resumen' && <ExerciseStats exercise={exercise} />}
        {tab === 'guia' && (
        <section aria-labelledby="instructions-title" className="rounded-3xl bg-surface p-5 sm:p-6">
          <h2 id="instructions-title" className="font-display text-2xl font-bold uppercase">
            Cómo se hace
          </h2>
          {exercise.instructions.length === 0 ? (
            <p className="mt-2 text-muted">No hay instrucciones para este ejercicio.</p>
          ) : (
            <>
              {exercise.instructionsLanguage === 'en' && (
                <p className="mt-1 text-sm text-muted">Instrucciones de la fuente original, en inglés.</p>
              )}
              <ol className="mt-4 flex flex-col gap-3" lang={exercise.instructionsLanguage}>
                {exercise.instructions.map((step, index) => (
                  <li key={index} className="flex gap-3">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-bold text-primary tabular-nums">
                      {index + 1}
                    </span>
                    <span className="text-muted">{step}</span>
                  </li>
                ))}
              </ol>
            </>
          )}
        </section>

        )}
        {tab === 'historial' && <ExerciseHistory exercise={exercise} />}
      </div>

      {!isCustom && (
        <p className="text-sm text-muted">
          Fuente:{' '}
          <a href={exerciseProvider.url} target="_blank" rel="noreferrer" className="text-fg underline underline-offset-4">
            {exerciseProvider.name}
          </a>{' '}
          ({exerciseProvider.license}).
        </p>
      )}
    </article>
  )
}

function CustomActions({ exercise }: { exercise: Exercise }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string>()

  const remove = async () => {
    if (!user) return
    setDeleting(true)
    try {
      await deleteCustomExercise(user.uid, exercise.ref.id)
      navigate('/app/ejercicios?vista=propios', { replace: true })
    } catch {
      setError('No se pudo eliminar. Revisa tu conexión e inténtalo de nuevo.')
      setDeleting(false)
      setConfirming(false)
    }
  }

  return (
    <>
      <ButtonLink to={`/app/ejercicios/propios/${exercise.ref.id}/editar`} variant="secondary">
        <Pencil className="size-4" aria-hidden="true" />
        Editar
      </ButtonLink>
      <Button variant="ghost" onClick={() => setConfirming(true)}>
        <Trash2 className="size-4" aria-hidden="true" />
        Eliminar
      </Button>
      {error && <Alert tone="error">{error}</Alert>}
      <ConfirmDialog
        open={confirming}
        title="Eliminar ejercicio"
        description={
          <>
            Se eliminará «{exercise.name}». Las rutinas y entrenamientos que ya lo usan lo conservarán con su nombre.{' '}
            <Link to="/app/rutinas" className="underline">
              Ver rutinas
            </Link>
          </>
        }
        confirmLabel="Eliminar"
        tone="danger"
        busy={deleting}
        onConfirm={remove}
        onCancel={() => setConfirming(false)}
      />
    </>
  )
}

function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-border-strong px-3 py-1 text-sm font-medium text-muted">{children}</span>
  )
}

function Info({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="mt-0.5 font-semibold">{children}</dd>
    </div>
  )
}
