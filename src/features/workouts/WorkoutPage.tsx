import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router'
import { ChevronDown, ChevronLeft, ChevronRight, Cloud, CloudOff, LoaderCircle, Pause, Play, Trash2, TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog, Dialog } from '@/components/ui/Dialog'
import { FullScreenStatus } from '@/components/ui/FullScreenStatus'
import { Stepper } from '@/components/ui/Stepper'
import { Textarea } from '@/components/ui/Textarea'
import { useAuth } from '@/features/auth/authContext'
import { ExercisePicker } from '@/features/exercises/ExercisePicker'
import { exerciseDetailPath } from '@/features/exercises/paths'
import { ExerciseImage } from '@/features/exercises/ExerciseImage'
import { useAllExercises } from '@/features/exercises/useExercises'
import { formatRest } from '@/features/routines/routineLogic'
import { useNow } from '@/hooks/useNow'
import { formatClock, formatShortDate } from '@/lib/dates'
import { completeWorkout, deleteWorkout } from '@/services/workoutService'
import { exerciseKey } from '@/types/exercise'
import { REST_STEP_SECONDS, ROUTINE_LIMITS } from '@/types/routine'
import { WORKOUT_LIMITS, type Workout, type WorkoutExercise, type WorkoutSet } from '@/types/workout'
import { localSession } from './localSession'
import { suggestProgression } from './progression'
import { RestTimerBar } from './RestTimerBar'
import { useRestTimer } from './useRestTimer'
import { useLiveWorkout, useWorkoutHistory, type SyncState } from './useWorkouts'
import { ExerciseCarousel } from './ExerciseCarousel'
import { ExerciseFocus } from './ExerciseFocus'
import * as actions from './workoutActions'
import { elapsedSeconds, isValidWorkout, previousPerformance } from './workoutMath'

export function WorkoutPage() {
  const { id = '' } = useParams()
  const live = useLiveWorkout(id)

  if (live.status === 'loading') return <FullScreenStatus variant="loading" title="Abriendo entrenamiento…" />
  if (live.status === 'missing' || live.status === 'error' || !live.workout) {
    return (
      <FullScreenStatus variant="error" title="Entrenamiento no encontrado">
        <p>Puede que se haya descartado en otro dispositivo.</p>
        <Link to="/app" className="mt-4 inline-block font-semibold text-primary underline">
          Volver al inicio
        </Link>
      </FullScreenStatus>
    )
  }
  if (live.workout.status === 'completed') return <Navigate to={`/app/entrenar/${id}/resumen`} replace />
  return <LiveWorkout workout={live.workout} live={live} />
}

/** Keeps the screen on during the session where supported (Screen Wake Lock API). */
function useWakeLock(enabled: boolean) {
  useEffect(() => {
    if (!enabled || !('wakeLock' in navigator)) return
    let lock: WakeLockSentinel | null = null
    const acquire = () => {
      if (document.visibilityState === 'visible') navigator.wakeLock.request('screen').then((l) => (lock = l)).catch(() => {})
    }
    acquire()
    document.addEventListener('visibilitychange', acquire)
    return () => {
      document.removeEventListener('visibilitychange', acquire)
      void lock?.release()
    }
  }, [enabled])
}

function LiveWorkout({ workout, live }: { workout: Workout; live: ReturnType<typeof useLiveWorkout> }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { workouts: history } = useWorkoutHistory()
  const manual = workout.source === 'manual'
  const paused = workout.pausedAt !== null
  const timer = useRestTimer(user?.uid, workout.id)
  const now = useNow(1000, !manual && !paused)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [optionsFor, setOptionsFor] = useState<string | null>(null)
  const [finishOpen, setFinishOpen] = useState(false)
  const [discardOpen, setDiscardOpen] = useState(false)
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const [finishing, setFinishing] = useState(false)
  const [howTo, setHowTo] = useState(false)
  const [replacing, setReplacing] = useState(false)
  const { resolve } = useAllExercises()
  // Start on the first exercise with pending sets (e.g. when resuming a session).
  const [current, setCurrent] = useState(() => Math.max(0, workout.exercises.findIndex((e) => e.sets.some((s) => !s.done))))
  useWakeLock(!manual)
  const index = Math.min(current, Math.max(0, workout.exercises.length - 1))
  const item = workout.exercises[index] as WorkoutExercise | undefined
  const resolved = item ? resolve(item.exercise) : undefined
  const totalSets = workout.exercises.reduce((sum, e) => sum + e.sets.length, 0)
  const doneSets = workout.exercises.reduce((sum, e) => sum + e.sets.filter((s) => s.done).length, 0)

  const unit = workout.weightUnit
  const pastHistory = useMemo(() => history.filter((w) => w.id !== workout.id), [history, workout.id])

  const perExercise = useMemo(
    () =>
      new Map(
        workout.exercises.map((e) => {
          const key = exerciseKey(e.exercise)
          return [
            e.id,
            {
              previous: previousPerformance(pastHistory, key, { beforeTime: workout.startedAt }),
              suggestion: dismissed.has(key) ? null : suggestProgression(pastHistory, key, unit),
            },
          ]
        }),
      ),
    [workout.exercises, workout.startedAt, pastHistory, dismissed, unit],
  )

  const toggleDone = (item: WorkoutExercise, setId: string, done: boolean) => {
    const previous = perExercise.get(item.id)?.previous
    let next: Workout | null = null
    // Computed from the latest state inside update(), so fast consecutive taps never overwrite each other.
    live.update((current) => {
      const exercise = current.exercises.find((e) => e.id === item.id)
      const index = exercise?.sets.findIndex((s) => s.id === setId) ?? -1
      const target = exercise?.sets[index]
      // Empty fields take the values shown as placeholders (last session, else the target),
      // so one tap logs a repeated set. They stay visible and editable.
      const prevSet = previous?.sets[index]
      const fill: Partial<WorkoutSet> = {}
      if (done && target?.reps === null) fill.reps = prevSet?.reps ?? item.repsMax
      if (done && target?.weight === null && prevSet?.weight && previous?.unit === current.weightUnit) fill.weight = prevSet.weight
      next = actions.setDone(actions.updateSet(current, item.id, setId, fill), item.id, setId, done, Date.now())
      return next
    })
    if (!done || !next) return
    const after: Workout = next
    // Last set of this exercise: move on to the next exercise with pending sets.
    const position = after.exercises.findIndex((e) => e.id === item.id)
    if (after.exercises[position]?.sets.every((s) => s.done)) {
      const all = [...after.exercises.keys()]
      const order = all.slice(position + 1).concat(all.slice(0, position))
      const nextIndex = order.find((i) => after.exercises[i].sets.some((s) => !s.done))
      if (nextIndex !== undefined) setCurrent(nextIndex)
    }
    if (manual) return
    const plan = actions.restAfterCompleting(after, item.id)
    if (plan) timer.start(plan)
    else timer.skip()
  }

  const togglePause = () => {
    if (paused) {
      live.update((w) => actions.resume(w, Date.now()))
      timer.unfreeze()
    } else {
      live.update((w) => actions.pause(w, Date.now()))
      timer.freeze()
    }
  }

  const finish = async () => {
    if (!user) return
    setFinishing(true)
    const completed = completeWorkout(workout, pastHistory, Date.now())
    timer.skip()
    try {
      // Device copy updated at once; the upload completes in the background if offline.
      live.commit(completed).then(() => localSession.clear(user.uid, completed.id)).catch(() => {})
    } finally {
      navigate(`/app/entrenar/${workout.id}/resumen`, { replace: true })
    }
  }

  const discard = () => {
    if (!user) return
    timer.skip()
    localSession.clear(user.uid, workout.id)
    deleteWorkout(user.uid, workout.id).catch(() => {})
    navigate('/app', { replace: true })
  }

  const optionsItem = workout.exercises.find((e) => e.id === optionsFor) ?? null
  const valid = isValidWorkout(workout)
  const pending = actions.pendingSetCount(workout)

  return (
    <div className={`min-h-dvh ${timer.rest || timer.justFinished ? 'pb-48' : 'pb-16'}`}>
      <header className="sticky top-0 z-30 bg-canvas/95 pt-[env(safe-area-inset-top)] backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-2 px-4 py-2">
          <Link
            to="/app"
            aria-label="Minimizar (el entrenamiento seguirá en curso)"
            title="Minimizar: el entrenamiento seguirá en curso"
            className="-ml-2 flex size-11 shrink-0 items-center justify-center rounded-xl text-fg hover:bg-surface-2"
          >
            <ChevronDown className="size-6" aria-hidden="true" />
          </Link>
          <div className="min-w-0 flex-1">
            {manual ? (
              <p className="truncate font-semibold">Registro del {formatShortDate(workout.localDate)}</p>
            ) : (
              <p className="font-display text-3xl leading-none font-bold tabular-nums" aria-label="Tiempo de entrenamiento">
                {formatClock(elapsedSeconds(workout, now))}
              </p>
            )}
            <p className="flex min-w-0 items-center gap-2 text-xs text-muted">
              <span className="truncate">{paused ? 'En pausa' : workout.routineName}</span>
              <SyncBadge sync={live.sync} />
            </p>
          </div>
          {!manual && (
            <button
              type="button"
              onClick={togglePause}
              aria-label={paused ? 'Reanudar entrenamiento' : 'Pausar entrenamiento'}
              className="flex size-11 shrink-0 items-center justify-center rounded-full text-fg hover:bg-surface-2"
            >
              {paused ? <Play className="size-5 fill-current" aria-hidden="true" /> : <Pause className="size-5" aria-hidden="true" />}
            </button>
          )}
          <Button variant="secondary" onClick={() => setFinishOpen(true)}>
            {manual ? 'Guardar' : 'Terminar'}
          </Button>
        </div>
        {/* Overall progress: completed sets / total sets. */}
        <div
          className="h-0.5 bg-border"
          role="progressbar"
          aria-label="Series completadas"
          aria-valuemin={0}
          aria-valuemax={totalSets}
          aria-valuenow={doneSets}
        >
          <div
            className="h-full origin-left bg-primary transition-transform duration-500"
            style={{ transform: `scaleX(${totalSets ? doneSets / totalSets : 0})` }}
          />
        </div>
      </header>

      <main className="mx-auto flex max-w-3xl flex-col gap-4 pt-2">
        {paused && (
          <div className="mx-4 flex items-center gap-3 rounded-2xl border border-warning/40 bg-warning-soft p-3">
            <p className="flex-1 text-sm font-semibold">En pausa: el tiempo no corre.</p>
            <Button onClick={togglePause}>
              <Play className="size-4 fill-current" aria-hidden="true" />
              Reanudar
            </Button>
          </div>
        )}

        <ExerciseCarousel
          exercises={workout.exercises}
          current={index}
          imageFor={(e) => resolve(e.exercise)?.images[0]}
          onSelect={setCurrent}
          onAdd={() => setPickerOpen(true)}
          canAdd={workout.exercises.length < WORKOUT_LIMITS.exercisesMax}
        />

        {!item ? (
          <div className="mx-4 rounded-3xl border border-dashed border-border-strong p-6 text-center text-muted">
            Añade el primer ejercicio para empezar a registrar series.
          </div>
        ) : (
          <ExerciseFocus
            key={item.id}
            item={item}
            images={resolved?.images ?? []}
            unit={unit}
            previous={perExercise.get(item.id)?.previous ?? null}
            suggestion={perExercise.get(item.id)?.suggestion ?? null}
            onSetChange={(setId, patch) => live.update((w) => actions.updateSet(w, item.id, setId, patch))}
            onToggleDone={(set) => toggleDone(item, set.id, !set.done)}
            onAddSet={() => live.update((w) => actions.addSet(w, item.id))}
            onRemoveSet={(setId) => live.update((w) => actions.removeSet(w, item.id, setId))}
            onHowTo={() => setHowTo(true)}
            onReplace={() => setReplacing(true)}
            onOptions={() => setOptionsFor(item.id)}
            onApplySuggestion={(weight) => live.update((w) => actions.applyWeightToPendingSets(w, item.id, weight))}
            onDismissSuggestion={() => setDismissed((d) => new Set(d).add(exerciseKey(item.exercise)))}
          />
        )}

        {workout.exercises.length > 1 && (
          <div className="flex gap-2 px-4">
            <Button variant="ghost" className="flex-1" disabled={index === 0} onClick={() => setCurrent(index - 1)}>
              <ChevronLeft className="size-4" aria-hidden="true" />
              Anterior
            </Button>
            <Button
              variant="secondary"
              className="flex-1"
              disabled={index >= workout.exercises.length - 1}
              onClick={() => setCurrent(index + 1)}
            >
              Siguiente ejercicio
              <ChevronRight className="size-4" aria-hidden="true" />
            </Button>
          </div>
        )}

        <div className="flex flex-col gap-4 px-4 pt-4">
          <Textarea
            label="Notas de la sesión (opcional)"
            maxLength={WORKOUT_LIMITS.notesMax}
            value={workout.notes}
            onChange={(e) => live.update((w) => ({ ...w, notes: e.target.value }))}
          />
          <button
            type="button"
            onClick={() => setDiscardOpen(true)}
            className="flex min-h-11 items-center gap-2 self-center rounded-xl px-4 text-sm font-semibold text-danger hover:bg-danger-soft"
          >
            <Trash2 className="size-4" aria-hidden="true" />
            Descartar entrenamiento
          </button>
        </div>
      </main>

      {!manual && <RestTimerBar timer={timer} paused={paused} />}

      <ExercisePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        existingKeys={new Set(workout.exercises.map((e) => exerciseKey(e.exercise)))}
        onAdd={(exercises) => {
          live.update((w) => actions.addExercises(w, exercises))
          setCurrent(workout.exercises.length)
        }}
      />

      {item && (
        <ExercisePicker
          open={replacing}
          single
          title={`Reemplazar «${item.exercise.name}»`}
          onClose={() => setReplacing(false)}
          existingKeys={new Set(workout.exercises.map((e) => exerciseKey(e.exercise)))}
          onAdd={([exercise]) => exercise && live.update((w) => actions.replaceExercise(w, item.id, exercise))}
        />
      )}

      {item && (
        <Dialog open={howTo} onClose={() => setHowTo(false)} title={item.exercise.name} description="Cómo se hace">
          <div className="flex flex-col gap-4">
            <ExerciseImage images={resolved?.images ?? []} alt={`Demostración de ${item.exercise.name}`} animated />
            {resolved && resolved.instructions.length > 0 ? (
              <>
                {resolved.instructionsLanguage === 'en' && (
                  <p className="text-sm text-muted">Instrucciones de la fuente original, en inglés.</p>
                )}
                <ol className="flex list-decimal flex-col gap-2 pl-5 text-muted" lang={resolved.instructionsLanguage}>
                  {resolved.instructions.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ol>
              </>
            ) : (
              <p className="text-muted">No hay instrucciones para este ejercicio.</p>
            )}
          </div>
        </Dialog>
      )}

      {optionsItem && (
        <ExerciseOptionsDialog
          item={optionsItem}
          onClose={() => setOptionsFor(null)}
          onChange={(patch) => live.update((w) => actions.updateExercise(w, optionsItem.id, patch))}
          onRemove={() => {
            live.update((w) => actions.removeExercise(w, optionsItem.id))
            setOptionsFor(null)
          }}
        />
      )}

      <Dialog
        open={finishOpen}
        onClose={() => setFinishOpen(false)}
        title={valid ? (manual ? 'Guardar entrenamiento' : 'Terminar entrenamiento') : 'No hay series completadas'}
        description={
          valid ? (
            pending > 0 ? (
              <>Tienes {pending} {pending === 1 ? 'serie sin completar; no contará' : 'series sin completar; no contarán'} en tus estadísticas.</>
            ) : (
              '¡Todas las series completadas!'
            )
          ) : (
            'Marca al menos una serie como completada para guardar el entrenamiento, o descártalo.'
          )
        }
        actions={
          valid ? (
            <>
              <Button variant="ghost" onClick={() => setFinishOpen(false)}>
                Seguir entrenando
              </Button>
              <Button onClick={finish} loading={finishing}>
                {manual ? 'Guardar' : 'Terminar'}
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => { setFinishOpen(false); setDiscardOpen(true) }}>
                Descartar
              </Button>
              <Button onClick={() => setFinishOpen(false)}>Seguir entrenando</Button>
            </>
          )
        }
      />

      <ConfirmDialog
        open={discardOpen}
        title="Descartar entrenamiento"
        description="Se borrarán todas las series de esta sesión. No contará para tu historial ni tu racha."
        confirmLabel="Descartar"
        tone="danger"
        onConfirm={discard}
        onCancel={() => setDiscardOpen(false)}
      />
    </div>
  )
}

function SyncBadge({ sync }: { sync: SyncState }) {
  const content = {
    saved: { icon: Cloud, text: 'Guardado', cls: 'text-muted' },
    saving: { icon: LoaderCircle, text: 'Guardando…', cls: 'text-muted' },
    offline: { icon: CloudOff, text: 'Sin conexión · guardado en el dispositivo', cls: 'text-warning' },
    error: { icon: TriangleAlert, text: 'Error al sincronizar · guardado en el dispositivo', cls: 'text-danger' },
  }[sync]
  const Icon = content.icon
  return (
    <span role="status" className={`inline-flex min-w-0 items-center gap-1 ${content.cls}`}>
      <Icon className={`size-3.5 shrink-0 ${sync === 'saving' ? 'animate-spin' : ''}`} aria-hidden="true" />
      <span className="truncate">{content.text}</span>
    </span>
  )
}

/** Session-only settings for one exercise: rest times (±15 s), notes, remove. */
function ExerciseOptionsDialog({
  item,
  onClose,
  onChange,
  onRemove,
}: {
  item: WorkoutExercise
  onClose: () => void
  onChange: (patch: Partial<WorkoutExercise>) => void
  onRemove: () => void
}) {
  const [confirmRemove, setConfirmRemove] = useState(false)
  return (
    <>
      <Dialog
        open={!confirmRemove}
        onClose={onClose}
        title={item.exercise.name}
        description="Estos cambios solo afectan a esta sesión; tu rutina no se modifica."
        actions={<Button onClick={onClose}>Listo</Button>}
      >
        <div className="flex flex-col gap-5">
          <Stepper
            label="Descanso entre series"
            value={item.restBetweenSets}
            min={ROUTINE_LIMITS.restMin}
            max={ROUTINE_LIMITS.restMax}
            step={REST_STEP_SECONDS}
            unitLabel="segundos"
            format={formatRest}
            size="lg"
            onChange={(restBetweenSets) => onChange({ restBetweenSets })}
          />
          <Stepper
            label="Descanso antes del siguiente ejercicio"
            value={item.restAfterExercise}
            min={ROUTINE_LIMITS.restMin}
            max={ROUTINE_LIMITS.restMax}
            step={REST_STEP_SECONDS}
            unitLabel="segundos"
            format={formatRest}
            size="lg"
            onChange={(restAfterExercise) => onChange({ restAfterExercise })}
          />
          <Textarea
            label="Notas del ejercicio"
            maxLength={WORKOUT_LIMITS.exerciseNotesMax}
            value={item.notes}
            onChange={(e) => onChange({ notes: e.target.value })}
          />
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link to={exerciseDetailPath(item.exercise)} className="flex min-h-11 items-center font-semibold text-primary underline-offset-4 hover:underline">
              Ver cómo se hace
            </Link>
            <Button variant="dangerGhost" className="sm:ml-auto" onClick={() => setConfirmRemove(true)}>
              <Trash2 className="size-4" aria-hidden="true" />
              Quitar de esta sesión
            </Button>
          </div>
        </div>
      </Dialog>
      <ConfirmDialog
        open={confirmRemove}
        title="Quitar ejercicio"
        description={`Se quitará «${item.exercise.name}» y sus series de esta sesión.`}
        confirmLabel="Quitar"
        tone="danger"
        onConfirm={onRemove}
        onCancel={() => setConfirmRemove(false)}
      />
    </>
  )
}
