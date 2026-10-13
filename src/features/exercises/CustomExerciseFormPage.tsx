import { useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router'
import { ArrowLeft } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { ChoiceGroup } from '@/components/ui/ChoiceGroup'
import { FullScreenStatus } from '@/components/ui/FullScreenStatus'
import { Select } from '@/components/ui/Select'
import { TextField } from '@/components/ui/TextField'
import { Textarea } from '@/components/ui/Textarea'
import { useAuth } from '@/features/auth/authContext'
import {
  CUSTOM_EXERCISE_LIMITS as LIMITS,
  createCustomExercise,
  updateCustomExercise,
  type CustomExerciseInput,
} from '@/services/customExerciseService'
import { EQUIPMENT_TYPES, EXERCISE_TYPES, MUSCLES, type Exercise, type Muscle } from '@/types/exercise'
import { exerciseDetailPath } from './paths'
import { equipmentLabels, exerciseTypeLabels, muscleLabels } from './taxonomy'
import { useCustomExercises } from './useExercises'

type FormValues = {
  name: string
  primaryMuscle: Muscle | ''
  secondaryMuscles: Muscle[]
  equipment: CustomExerciseInput['equipment']
  type: CustomExerciseInput['type']
  instructions: string
  sets: string
  repsMin: string
  repsMax: string
}

type Errors = Partial<Record<'name' | 'primaryMuscle' | 'sets' | 'repsMin' | 'repsMax', string>>

const muscleOptions = [...MUSCLES]
  .sort((a, b) => muscleLabels[a].localeCompare(muscleLabels[b], 'es'))
  .map((m) => ({ value: m, label: muscleLabels[m] }))

function toValues(exercise?: Exercise): FormValues {
  return {
    name: exercise?.name ?? '',
    primaryMuscle: exercise?.primaryMuscles[0] ?? '',
    secondaryMuscles: exercise?.secondaryMuscles ?? [],
    equipment: exercise?.equipment ?? 'dumbbell',
    type: exercise?.type ?? 'strength',
    instructions: exercise?.instructions.join('\n') ?? '',
    sets: exercise?.suggestedSets?.toString() ?? '',
    repsMin: exercise?.suggestedRepsMin?.toString() ?? '',
    repsMax: exercise?.suggestedRepsMax?.toString() ?? '',
  }
}

function parseIntOrNull(value: string): number | null {
  const trimmed = value.trim()
  return trimmed === '' ? null : Number(trimmed)
}

function validateCustomExercise(values: FormValues): Errors {
  const errors: Errors = {}
  if (!values.name.trim()) errors.name = 'Ponle un nombre al ejercicio.'
  if (!values.primaryMuscle) errors.primaryMuscle = 'Elige el músculo principal.'
  const sets = parseIntOrNull(values.sets)
  const min = parseIntOrNull(values.repsMin)
  const max = parseIntOrNull(values.repsMax)
  if (sets !== null && (!Number.isInteger(sets) || sets < 1 || sets > LIMITS.setsMax))
    errors.sets = `Entre 1 y ${LIMITS.setsMax} series.`
  if (min !== null && (!Number.isInteger(min) || min < 1 || min > LIMITS.repsMax))
    errors.repsMin = `Entre 1 y ${LIMITS.repsMax}.`
  if (max !== null && (!Number.isInteger(max) || max < 1 || max > LIMITS.repsMax))
    errors.repsMax = `Entre 1 y ${LIMITS.repsMax}.`
  if (!errors.repsMin && !errors.repsMax && min !== null && max !== null && min > max)
    errors.repsMax = 'Debe ser mayor o igual que el mínimo.'
  return errors
}

export function CustomExerciseFormPage() {
  const { id } = useParams()
  const custom = useCustomExercises()
  if (!id) return <CustomExerciseForm />
  if (custom.status === 'loading') return <FullScreenStatus variant="loading" title="Cargando ejercicio…" />
  const exercise = custom.exercises.find((e) => e.ref.id === id)
  if (!exercise) return <Alert tone="error">Ejercicio no encontrado.</Alert>
  return <CustomExerciseForm exercise={exercise} />
}

function CustomExerciseForm({ exercise }: { exercise?: Exercise }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [values, setValues] = useState(() => toValues(exercise))
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string>()
  const errors = validateCustomExercise(values)
  const shown = submitted ? errors : {}

  const set = <K extends keyof FormValues>(key: K, value: FormValues[K]) => setValues((v) => ({ ...v, [key]: value }))

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setSubmitted(true)
    const firstInvalid = Object.keys(errors)[0]
    if (firstInvalid) {
      document.getElementById(`custom-${firstInvalid}`)?.focus()
      return
    }
    if (!user || saving) return
    setSaving(true)
    setSaveError(undefined)
    const input: CustomExerciseInput = {
      name: values.name,
      primaryMuscle: values.primaryMuscle as Muscle,
      secondaryMuscles: values.secondaryMuscles,
      equipment: values.equipment,
      type: values.type,
      instructions: values.instructions,
      suggestedSets: parseIntOrNull(values.sets),
      suggestedRepsMin: parseIntOrNull(values.repsMin),
      suggestedRepsMax: parseIntOrNull(values.repsMax) ?? parseIntOrNull(values.repsMin),
    }
    try {
      if (exercise) {
        await updateCustomExercise(user.uid, exercise.ref.id, input)
        navigate(exerciseDetailPath(exercise), { replace: true })
      } else {
        const newId = await createCustomExercise(user.uid, input)
        navigate(exerciseDetailPath({ source: 'custom', id: newId }), { replace: true })
      }
    } catch {
      setSaveError('No se pudo guardar. Revisa tu conexión e inténtalo de nuevo.')
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="inline-flex min-h-11 items-center gap-2 self-start font-semibold text-muted hover:text-fg"
      >
        <ArrowLeft className="size-5" aria-hidden="true" />
        Volver
      </button>
      <h1 className="text-[1.75rem] leading-tight font-bold tracking-tight sm:text-3xl">{exercise ? 'Editar ejercicio' : 'Nuevo ejercicio'}</h1>

      <form noValidate onSubmit={onSubmit} className="flex flex-col gap-7">
        <TextField
          id="custom-name"
          label="Nombre"
          maxLength={LIMITS.nameMax}
          value={values.name}
          onChange={(e) => set('name', e.target.value)}
          error={shown.name}
          className="sm:max-w-md"
        />

        <div className="grid gap-4 sm:grid-cols-3">
          <Select
            id="custom-primaryMuscle"
            label="Músculo principal"
            placeholder="Elige uno"
            options={muscleOptions}
            value={values.primaryMuscle}
            onChange={(e) => set('primaryMuscle', e.target.value as Muscle | '')}
            error={shown.primaryMuscle}
          />
          <Select
            label="Equipamiento"
            options={EQUIPMENT_TYPES.map((v) => ({ value: v, label: equipmentLabels[v] }))}
            value={values.equipment}
            onChange={(e) => set('equipment', e.target.value as FormValues['equipment'])}
          />
          <Select
            label="Tipo"
            options={EXERCISE_TYPES.map((v) => ({ value: v, label: exerciseTypeLabels[v] }))}
            value={values.type}
            onChange={(e) => set('type', e.target.value as FormValues['type'])}
          />
        </div>

        <ChoiceGroup
          legend="Músculos secundarios (opcional)"
          hint={`Hasta ${LIMITS.secondaryMax}.`}
          name="secondaryMuscles"
          type="checkbox"
          layout="chip"
          options={muscleOptions.filter((o) => o.value !== values.primaryMuscle)}
          selected={values.secondaryMuscles}
          onChange={(next) => next.length <= LIMITS.secondaryMax && set('secondaryMuscles', next)}
        />

        <fieldset className="flex flex-col gap-3">
          <legend className="text-sm font-semibold">Series y repeticiones sugeridas (opcional)</legend>
          <p className="-mt-1 text-sm text-muted">Se usarán como valores iniciales al añadirlo a una rutina.</p>
          <div className="grid grid-cols-3 gap-3 sm:max-w-md">
            <TextField id="custom-sets" label="Series" inputMode="numeric" value={values.sets} onChange={(e) => set('sets', e.target.value)} error={shown.sets} />
            <TextField id="custom-repsMin" label="Reps mín." inputMode="numeric" value={values.repsMin} onChange={(e) => set('repsMin', e.target.value)} error={shown.repsMin} />
            <TextField id="custom-repsMax" label="Reps máx." inputMode="numeric" value={values.repsMax} onChange={(e) => set('repsMax', e.target.value)} error={shown.repsMax} />
          </div>
        </fieldset>

        <Textarea
          label="Instrucciones (opcional)"
          hint="Un paso por línea."
          maxLength={LIMITS.instructionsMax}
          value={values.instructions}
          onChange={(e) => set('instructions', e.target.value)}
        />

        {saveError && <Alert tone="error">{saveError}</Alert>}
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button type="submit" size="lg" loading={saving}>
            {exercise ? 'Guardar cambios' : 'Crear ejercicio'}
          </Button>
          <Button variant="ghost" size="lg" onClick={() => navigate(-1)}>
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  )
}
