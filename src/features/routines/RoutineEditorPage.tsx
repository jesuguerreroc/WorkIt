import { useMemo, useState, type FormEvent } from 'react'
import { useBlocker, useLocation, useNavigate, useParams } from 'react-router'
import { ArrowLeft, Plus } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { ChoiceGroup } from '@/components/ui/ChoiceGroup'
import { ConfirmDialog } from '@/components/ui/Dialog'
import { FullScreenStatus } from '@/components/ui/FullScreenStatus'
import { TextField } from '@/components/ui/TextField'
import { useAuth } from '@/features/auth/authContext'
import { ExercisePicker } from '@/features/exercises/ExercisePicker'
import { weekdayOptions } from '@/features/profile/profileOptions'
import { createRoutine, updateRoutine } from '@/services/routineService'
import { exerciseKey } from '@/types/exercise'
import { ROUTINE_LIMITS, type Routine, type RoutineExercise, type RoutineInput } from '@/types/routine'
import { hasRoutineErrors, moveItem, routineExerciseFrom, validateRoutine } from './routineLogic'
import { RoutineExerciseEditor } from './RoutineExerciseEditor'
import { useRoutines } from './useRoutines'

/** Location state accepted by /app/rutinas/nueva (e.g. from "Añadir a una rutina"). */
export interface NewRoutineState {
  initialExercises?: RoutineExercise[]
}

export function RoutineEditorPage() {
  const { id } = useParams()
  const { routines, status } = useRoutines()
  const location = useLocation()

  if (!id) {
    const initial = (location.state as NewRoutineState | null)?.initialExercises ?? []
    return <RoutineEditor initial={{ name: '', days: [], exercises: initial }} />
  }
  if (status === 'loading') return <FullScreenStatus variant="loading" title="Cargando rutina…" />
  const routine = routines.find((r) => r.id === id)
  if (!routine) return <Alert tone="error">Rutina no encontrada.</Alert>
  return <RoutineEditor routine={routine} initial={{ name: routine.name, days: routine.days, exercises: routine.exercises }} />
}

function RoutineEditor({ routine, initial }: { routine?: Routine; initial: RoutineInput }) {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [values, setValues] = useState<RoutineInput>(initial)
  const [savedSnapshot, setSavedSnapshot] = useState(() => JSON.stringify(initial))
  const [pickerOpen, setPickerOpen] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string>()

  const errors = validateRoutine(values)
  const dirty = JSON.stringify(values) !== savedSnapshot
  const blocker = useBlocker(({ currentLocation, nextLocation }) => dirty && !saving && currentLocation.pathname !== nextLocation.pathname)
  const existingKeys = useMemo(() => new Set(values.exercises.map((e) => exerciseKey(e.exercise))), [values.exercises])

  const setExercises = (update: (items: RoutineExercise[]) => RoutineExercise[]) =>
    setValues((v) => ({ ...v, exercises: update(v.exercises) }))

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setSubmitted(true)
    if (hasRoutineErrors(errors)) {
      const target = errors.name ? 'routine-name' : errors.exercises ? 'routine-exercises' : `item-${Object.keys(errors.items).find((k) => errors.items[k])}`
      document.getElementById(target)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      if (errors.name) document.getElementById('routine-name')?.focus()
      return
    }
    if (!user || saving) return
    setSaving(true)
    setSaveError(undefined)
    try {
      if (routine) await updateRoutine(user.uid, routine.id, values)
      else await createRoutine(user.uid, values)
      setSavedSnapshot(JSON.stringify(values))
      navigate('/app/rutinas', { replace: true })
    } catch {
      setSaveError('No se pudo guardar la rutina. Revisa tu conexión e inténtalo de nuevo.')
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-5 pb-24">
      <button
        type="button"
        onClick={() => navigate('/app/rutinas')}
        className="inline-flex min-h-11 items-center gap-2 self-start font-semibold text-muted hover:text-fg"
      >
        <ArrowLeft className="size-5" aria-hidden="true" />
        Rutinas
      </button>
      <h1 className="text-[1.75rem] leading-tight font-bold tracking-tight sm:text-3xl">{routine ? 'Editar rutina' : 'Nueva rutina'}</h1>

      <form noValidate onSubmit={onSubmit} className="flex flex-col gap-8">
        <TextField
          id="routine-name"
          label="Nombre"
          placeholder="Ej.: Rutina A — Pecho, hombros y tríceps"
          maxLength={ROUTINE_LIMITS.nameMax}
          value={values.name}
          onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
          error={submitted ? errors.name : undefined}
          className="sm:max-w-xl"
        />

        <ChoiceGroup
          legend="Días de entrenamiento (opcional)"
          hint="El panel te propondrá esta rutina esos días."
          name="routine-days"
          type="checkbox"
          layout="day"
          options={weekdayOptions}
          selected={values.days}
          onChange={(days) => setValues((v) => ({ ...v, days }))}
        />

        <section aria-labelledby="routine-exercises-title" id="routine-exercises" className="flex flex-col gap-4">
          <div className="flex items-end justify-between gap-4">
            <h2 id="routine-exercises-title" className="text-lg leading-snug font-semibold">
              Ejercicios{values.exercises.length > 0 && ` (${values.exercises.length})`}
            </h2>
          </div>
          {submitted && errors.exercises && <Alert tone="error">{errors.exercises}</Alert>}

          {values.exercises.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border-strong p-6 text-center text-muted">
              Esta rutina aún no tiene ejercicios.
            </div>
          ) : (
            <ol className="flex flex-col gap-3">
              {values.exercises.map((item, index) => (
                <li key={item.id} id={`item-${item.id}`}>
                  <RoutineExerciseEditor
                    item={item}
                    index={index}
                    total={values.exercises.length}
                    unit={profile?.weightUnit ?? 'kg'}
                    error={submitted ? errors.items[item.id] : undefined}
                    onChange={(next) => setExercises((items) => items.map((i) => (i.id === item.id ? next : i)))}
                    onMove={(delta) => setExercises((items) => moveItem(items, index, delta))}
                    onRemove={() => setExercises((items) => items.filter((i) => i.id !== item.id))}
                  />
                </li>
              ))}
            </ol>
          )}

          <Button
            variant="secondary"
            size="lg"
            onClick={() => setPickerOpen(true)}
            disabled={values.exercises.length >= ROUTINE_LIMITS.exercisesMax}
          >
            <Plus className="size-5" aria-hidden="true" />
            Añadir ejercicios
          </Button>
        </section>

        {saveError && <Alert tone="error">{saveError}</Alert>}

        {/* Sticky save bar: always reachable on long routines, above the mobile tab bar. */}
        <div className="sticky bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-30 -mx-4 flex gap-3 border-t border-border glass px-4 py-3 backdrop-blur lg:bottom-0 lg:mx-0 lg:rounded-2xl lg:border">
          <Button type="submit" size="lg" loading={saving} className="flex-1 sm:flex-none">
            {routine ? 'Guardar cambios' : 'Crear rutina'}
          </Button>
          <Button variant="ghost" size="lg" onClick={() => navigate('/app/rutinas')}>
            Cancelar
          </Button>
        </div>
      </form>

      <ExercisePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        existingKeys={existingKeys}
        onAdd={(exercises) =>
          setExercises((items) => [...items, ...exercises.map(routineExerciseFrom)].slice(0, ROUTINE_LIMITS.exercisesMax))
        }
      />

      <ConfirmDialog
        open={blocker.state === 'blocked'}
        title="¿Salir sin guardar?"
        description="Perderás los cambios de esta rutina."
        confirmLabel="Salir sin guardar"
        tone="danger"
        onConfirm={() => blocker.proceed?.()}
        onCancel={() => blocker.reset?.()}
      />
    </div>
  )
}
