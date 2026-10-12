import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/features/auth/authContext'
import { loadExerciseCatalog } from '@/services/exerciseApi'
import { subscribeToCustomExercises } from '@/services/customExerciseService'
import type { Exercise, ExerciseRef } from '@/types/exercise'
import { exerciseKey } from '@/types/exercise'

type Status = 'loading' | 'ready' | 'error'

/** The bundled catalogue, loaded on first use and cached for the session. */
export function useExerciseCatalog() {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [status, setStatus] = useState<Status>('loading')
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false
    loadExerciseCatalog()
      .then((list) => {
        if (cancelled) return
        setExercises(list)
        setStatus('ready')
      })
      .catch((err: Error) => {
        if (cancelled) return
        setError(err.message)
        setStatus('error')
      })
    return () => {
      cancelled = true
    }
  }, [attempt])

  const retry = useCallback(() => {
    setStatus('loading')
    setError(null)
    setAttempt((n) => n + 1)
  }, [])

  return { exercises, status, error, retry }
}

/** The signed-in user's custom exercises, kept in sync with Firestore. */
export function useCustomExercises() {
  const { user } = useAuth()
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [status, setStatus] = useState<Status>('loading')

  useEffect(() => {
    if (!user) return
    return subscribeToCustomExercises(
      user.uid,
      (list) => {
        setExercises(list)
        setStatus('ready')
      },
      () => setStatus('error'),
    )
  }, [user])

  return { exercises, status }
}

/** Catalogue + custom exercises, with lookup by reference. */
export function useAllExercises() {
  const catalog = useExerciseCatalog()
  const custom = useCustomExercises()

  const byKey = useMemo(() => {
    const map = new Map<string, Exercise>()
    for (const exercise of catalog.exercises) map.set(exercise.key, exercise)
    for (const exercise of custom.exercises) map.set(exercise.key, exercise)
    return map
  }, [catalog.exercises, custom.exercises])

  const resolve = useCallback((ref: ExerciseRef) => byKey.get(exerciseKey(ref)), [byKey])

  return { catalog, custom, resolve }
}
