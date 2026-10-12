import { useEffect, useState } from 'react'
import { useAuth } from '@/features/auth/authContext'
import { subscribeToRoutines } from '@/services/routineService'
import type { Routine } from '@/types/routine'

/** All the user's routines (active and archived), live from Firestore. */
export function useRoutines() {
  const { user } = useAuth()
  const [routines, setRoutines] = useState<Routine[]>([])
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')

  useEffect(() => {
    if (!user) return
    return subscribeToRoutines(
      user.uid,
      (list) => {
        setRoutines(list)
        setStatus('ready')
      },
      () => setStatus('error'),
    )
  }, [user])

  return { routines, status }
}
