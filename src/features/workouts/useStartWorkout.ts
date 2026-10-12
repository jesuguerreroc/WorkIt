import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '@/features/auth/authContext'
import { baseWorkout, createWorkout, deleteWorkout, workoutFromRoutine } from '@/services/workoutService'
import type { Routine } from '@/types/routine'
import type { Workout } from '@/types/workout'
import { localSession, newerWorkout } from './localSession'
import { useWorkoutHistory } from './useWorkouts'

export function workoutPath(id: string) {
  return `/app/entrenar/${id}`
}

/**
 * The session in progress, if any: from Firestore or only on this device
 * (started or edited offline and not uploaded yet).
 */
export function useActiveWorkout() {
  const { user } = useAuth()
  const { workouts, status } = useWorkoutHistory()
  const active = useMemo(() => {
    const remote = workouts.find((w) => w.status === 'active') ?? null
    if (!user) return remote
    const local = localSession
      .list(user.uid)
      .filter((w) => w.status === 'active')
      .sort((a, b) => b.startedAt - a.startedAt)[0]
    if (!local) return remote
    const remoteCopy = workouts.find((w) => w.id === local.id) ?? null
    // A local copy that the server already has as completed is stale.
    if (remoteCopy && remoteCopy.status === 'completed' && remoteCopy.revision >= local.revision) return remote
    return remote && remote.id !== local.id ? remote : newerWorkout(local, remoteCopy)
  }, [workouts, user])
  return { active, history: workouts, status }
}

/**
 * Starts a session from a routine (or empty). Never creates a second active
 * session: if one exists, `conflict` is set so the UI can offer to continue it or
 * discard it first.
 */
export function useStartWorkout() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const { active, history } = useActiveWorkout()
  const [conflict, setConflict] = useState<{ routine: Routine | null; active: Workout } | null>(null)
  const [busy, setBusy] = useState(false)

  const create = useCallback(
    (routine: Routine | null) => {
      if (!user) return
      const unit = profile?.weightUnit ?? 'kg'
      const now = Date.now()
      const workout = routine
        ? workoutFromRoutine(routine, history, unit, now)
        : baseWorkout({ routineId: null, routineName: 'Entrenamiento libre', exercises: [], unit, now, source: 'live' })
      // Device copy first: the session works even if the upload has to wait for a connection.
      localSession.save(user.uid, workout)
      createWorkout(user.uid, workout).catch((error) => {
        if (import.meta.env.DEV) console.error('[WorkIt] createWorkout', error)
      })
      navigate(workoutPath(workout.id))
    },
    [user, profile, history, navigate],
  )

  const start = useCallback(
    (routine: Routine | null) => {
      if (active) setConflict({ routine, active })
      else create(routine)
    },
    [active, create],
  )

  const continueActive = useCallback(() => {
    if (!conflict) return
    navigate(workoutPath(conflict.active.id))
    setConflict(null)
  }, [conflict, navigate])

  const discardAndStart = useCallback(async () => {
    if (!conflict || !user) return
    setBusy(true)
    localSession.clear(user.uid, conflict.active.id)
    deleteWorkout(user.uid, conflict.active.id).catch(() => {})
    const routine = conflict.routine
    setConflict(null)
    setBusy(false)
    create(routine)
  }, [conflict, user, create])

  return { start, active, history, conflict, busy, continueActive, discardAndStart, cancel: () => setConflict(null) }
}
