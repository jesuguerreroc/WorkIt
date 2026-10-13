import { useState, type FormEvent, type ReactNode } from 'react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { ChoiceGroup } from '@/components/ui/ChoiceGroup'
import { TextField } from '@/components/ui/TextField'
import { DISPLAY_NAME_MAX_LENGTH, type ProfilePreferences } from '@/types/profile'
import { equipmentOptions, goalOptions, levelOptions, unitOptions, weekdayOptions } from './profileOptions'

interface ProfileFormProps {
  initial: ProfilePreferences
  submitLabel: string
  onSubmit: (preferences: ProfilePreferences) => Promise<void>
  /** Message announced after a successful save; omit when the page navigates away instead. */
  successMessage?: string
  /** Extra actions rendered next to the submit button (e.g. "Omitir"). */
  secondaryAction?: ReactNode
  /** Disable submit until something changes (profile page). */
  requireChanges?: boolean
}

function same(a: ProfilePreferences, b: ProfilePreferences): boolean {
  const norm = (p: ProfilePreferences) =>
    JSON.stringify({
      ...p,
      displayName: p.displayName.trim(),
      trainingDays: [...p.trainingDays].sort(),
      equipment: [...p.equipment].sort(),
    })
  return norm(a) === norm(b)
}

/** Every field is optional: the user can save with whatever they choose to fill in. */
export function ProfileForm({
  initial,
  submitLabel,
  onSubmit,
  successMessage,
  secondaryAction,
  requireChanges = false,
}: ProfileFormProps) {
  const [values, setValues] = useState(initial)
  const [saved, setSaved] = useState(initial)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<{ tone: 'success' | 'error'; message: string }>()

  const set = <K extends keyof ProfilePreferences>(key: K, value: ProfilePreferences[K]) => {
    setValues((current) => ({ ...current, [key]: value }))
    setStatus(undefined)
  }

  const unchanged = same(values, saved)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (saving) return
    setSaving(true)
    setStatus(undefined)
    try {
      await onSubmit(values)
      setSaved(values)
      if (successMessage) setStatus({ tone: 'success', message: successMessage })
    } catch (error) {
      if (import.meta.env.DEV) console.error('[WorkIt] profile save failed', error)
      setStatus({ tone: 'error', message: 'No se pudieron guardar los cambios. Revisa tu conexión e inténtalo de nuevo.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      <TextField
        label="Nombre visible"
        hint="Así te saludaremos en la app."
        autoComplete="nickname"
        maxLength={DISPLAY_NAME_MAX_LENGTH}
        value={values.displayName}
        onChange={(event) => set('displayName', event.target.value)}
        className="sm:max-w-md"
      />

      <ChoiceGroup
        legend="Objetivo principal"
        name="goal"
        type="radio"
        layout="card"
        options={goalOptions}
        selected={values.goal ? [values.goal] : []}
        onChange={([goal]) => set('goal', goal ?? null)}
      />

      <ChoiceGroup
        legend="Nivel"
        name="level"
        type="radio"
        layout="card"
        options={levelOptions}
        selected={values.level ? [values.level] : []}
        onChange={([level]) => set('level', level ?? null)}
      />

      <ChoiceGroup
        legend="Días disponibles para entrenar"
        hint="Los usaremos para proponerte qué toca cada día."
        name="trainingDays"
        type="checkbox"
        layout="day"
        options={weekdayOptions}
        selected={values.trainingDays}
        onChange={(days) => set('trainingDays', days)}
      />

      <ChoiceGroup
        legend="Equipamiento habitual"
        name="equipment"
        type="checkbox"
        layout="chip"
        options={equipmentOptions}
        selected={values.equipment}
        onChange={(equipment) => set('equipment', equipment)}
      />

      <ChoiceGroup
        legend="Unidad de peso"
        name="weightUnit"
        type="radio"
        layout="chip"
        options={unitOptions}
        selected={[values.weightUnit]}
        onChange={([unit]) => unit && set('weightUnit', unit)}
      />

      <ChoiceGroup
        legend="Tipo de racha"
        name="streakMode"
        type="radio"
        layout="card"
        options={[
          { value: 'strict', label: 'Estricta', description: 'Cuenta días seguidos entrenando.' },
          {
            value: 'flexible',
            label: 'Flexible',
            description: 'Los días que no entrenas según tu plan no la rompen; saltarte alguno suelto tampoco.',
          },
        ]}
        selected={[values.streakMode]}
        onChange={([mode]) => mode && set('streakMode', mode)}
      />

      {values.streakMode === 'flexible' && (
        <ChoiceGroup
          legend="Días planificados que puedes saltarte seguidos"
          hint={
            values.trainingDays.length === 0
              ? 'Consejo: elige arriba tus días de entrenamiento; si no, todos los días cuentan como planificados.'
              : 'Esos días no suman a la racha, pero tampoco la rompen.'
          }
          name="streakAllowedMisses"
          type="radio"
          layout="chip"
          options={[0, 1, 2].map((n) => ({ value: n, label: n === 0 ? 'Ninguno' : String(n) }))}
          selected={[values.streakAllowedMisses]}
          onChange={([n]) => n !== undefined && set('streakAllowedMisses', n)}
        />
      )}

      <div className="flex flex-col gap-4">
        {status && <Alert tone={status.tone}>{status.message}</Alert>}
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button type="submit" size="lg" loading={saving} disabled={requireChanges && unchanged}>
            {submitLabel}
          </Button>
          {secondaryAction}
        </div>
      </div>
    </form>
  )
}
