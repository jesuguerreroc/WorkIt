import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { Select } from '@/components/ui/Select'
import { useAuth } from '@/features/auth/authContext'
import { useRoutines } from '@/features/routines/useRoutines'
import { localSession } from '@/features/workouts/localSession'
import { useToday } from '@/hooks/useToday'
import { isValidDateKey } from '@/lib/dates'
import { baseWorkout, createWorkout, workoutFromRoutine } from '@/services/workoutService'
import type { Workout } from '@/types/workout'

/**
 * Log a session that happened on an earlier day (streak rule 3: back-dated
 * sessions join the history without duplicating days).
 */
export function ManualWorkoutDialog({ open, onClose, history }: { open: boolean; onClose: () => void; history: Workout[] }) {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const { routines } = useRoutines()
  const today = useToday()
  const [date, setDate] = useState(today)
  const [routineId, setRoutineId] = useState('')
  const valid = isValidDateKey(date) && date <= today

  const create = () => {
    if (!user || !valid) return
    const unit = profile?.weightUnit ?? 'kg'
    const routine = routines.find((r) => r.id === routineId)
    const draft = routine
      ? workoutFromRoutine(routine, history, unit, Date.now())
      : baseWorkout({ routineId: null, routineName: 'Entrenamiento libre', exercises: [], unit, now: Date.now(), source: 'manual' })
    const workout: Workout = {
      ...draft,
      source: 'manual',
      localDate: date,
      startedAt: new Date(`${date}T12:00:00`).getTime(),
    }
    localSession.save(user.uid, workout)
    createWorkout(user.uid, workout).catch(() => {})
    onClose()
    navigate(`/app/entrenar/${workout.id}`)
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Registrar entrenamiento pasado"
      description="Para sesiones que no registraste en su momento. Contarán para tu historial y tu racha del día elegido."
      actions={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={create} disabled={!valid}>
            Continuar
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="manual-date" className="text-sm font-medium">
            Fecha
          </label>
          <input
            id="manual-date"
            type="date"
            max={today}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            aria-invalid={!valid || undefined}
            className="min-h-11 rounded-xl border border-control bg-surface px-4 text-base text-fg [color-scheme:dark] focus:border-primary focus:ring-2 focus:ring-primary/30 focus:outline-none"
          />
          {!valid && <p className="text-sm text-danger">Elige una fecha de hoy o anterior.</p>}
        </div>
        <Select
          label="Rutina (opcional)"
          placeholder="Sin rutina: añadiré los ejercicios"
          options={routines.filter((r) => r.status === 'active').map((r) => ({ value: r.id, label: r.name }))}
          value={routineId}
          onChange={(e) => setRoutineId(e.target.value)}
        />
      </div>
    </Dialog>
  )
}
