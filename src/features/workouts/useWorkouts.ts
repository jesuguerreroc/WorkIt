import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '@/features/auth/authContext'
import { saveWorkout, subscribeToWorkout, subscribeToWorkouts } from '@/services/workoutService'
import type { Workout } from '@/types/workout'
import { localSession, newerWorkout } from './localSession'

/** Recent workouts (newest first), live from Firestore. */
export function useWorkoutHistory() {
  const { user } = useAuth()
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')

  useEffect(() => {
    if (!user) return
    return subscribeToWorkouts(
      user.uid,
      (list) => {
        setWorkouts(list)
        setStatus('ready')
      },
      () => setStatus('error'),
    )
  }, [user])

  return { workouts, status }
}

export type SyncState = 'saved' | 'saving' | 'offline' | 'error'

const SAVE_DELAY_MS = 600

/**
 * The session being edited. Every change is written to the device at once and
 * to Firestore after a short pause; the newest copy (by revision) wins on load.
 */
export function useLiveWorkout(id: string) {
  const { user } = useAuth()
  const uid = user?.uid
  const [workout, setWorkout] = useState<Workout | null>(() => (uid ? localSession.load(uid, id) : null))
  const [status, setStatus] = useState<'loading' | 'ready' | 'missing' | 'error'>(workout ? 'ready' : 'loading')
  const [sync, setSync] = useState<SyncState>('saved')
  const latest = useRef<Workout | null>(workout)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pushedRevision = useRef(0)

  const push = useCallback(async () => {
    timer.current = null
    const current = latest.current
    if (!uid || !current || current.revision <= pushedRevision.current) return
    setSync(navigator.onLine ? 'saving' : 'offline')
    try {
      await saveWorkout(uid, current)
      pushedRevision.current = Math.max(pushedRevision.current, current.revision)
      if (latest.current?.revision === current.revision) setSync('saved')
    } catch {
      setSync('error')
    }
  }, [uid])

  // Server copy: adopt it only when it is newer than what we have locally.
  useEffect(() => {
    if (!uid) return
    return subscribeToWorkout(
      uid,
      id,
      (remote, pending) => {
        const chosen = newerWorkout(latest.current, remote)
        if (!chosen) {
          setStatus('missing')
          return
        }
        if (chosen !== latest.current) {
          latest.current = chosen
          setWorkout(chosen)
          localSession.save(uid, chosen)
        }
        if (remote) pushedRevision.current = Math.max(pushedRevision.current, remote.revision)
        // The device copy is ahead (e.g. edited offline last time): send it.
        if (remote && chosen.revision > remote.revision && !timer.current) timer.current = setTimeout(push, SAVE_DELAY_MS)
        if (!pending && remote && chosen.revision <= remote.revision) setSync('saved')
        setStatus('ready')
      },
      () => setStatus((s) => (latest.current ? s : 'error')),
    )
  }, [uid, id, push])

  // Flush pending changes when the app goes to the background.
  useEffect(() => {
    const flush = () => {
      if (document.visibilityState === 'hidden' && timer.current) {
        clearTimeout(timer.current)
        void push()
      }
    }
    document.addEventListener('visibilitychange', flush)
    return () => {
      document.removeEventListener('visibilitychange', flush)
      if (timer.current) {
        clearTimeout(timer.current)
        void push()
      }
    }
  }, [push])

  const update = useCallback(
    (change: (current: Workout) => Workout) => {
      const current = latest.current
      if (!current || !uid) return
      const next = { ...change(current), revision: current.revision + 1 }
      latest.current = next
      setWorkout(next)
      localSession.save(uid, next)
      setSync(navigator.onLine ? 'saving' : 'offline')
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(push, SAVE_DELAY_MS)
    },
    [uid, push],
  )

  /** Saves immediately (used when finishing) and waits for the server. */
  const commit = useCallback(
    async (final: Workout) => {
      if (!uid) return
      if (timer.current) clearTimeout(timer.current)
      timer.current = null
      latest.current = final
      setWorkout(final)
      localSession.save(uid, final)
      setSync('saving')
      await saveWorkout(uid, final)
      pushedRevision.current = final.revision
      setSync('saved')
    },
    [uid],
  )

  return { workout, status, sync, update, commit }
}
