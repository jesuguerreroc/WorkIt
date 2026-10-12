import type { Workout } from '@/types/workout'

/**
 * Device copy of the active session and its rest timer (localStorage), so a
 * reload, a crash or a dropped connection never loses logged sets. Firestore is
 * the shared copy; `revision` decides which one is newer.
 */

export interface RestTimerState {
  /** Epoch ms when the rest ends (null while paused). */
  endsAt: number | null
  /** Remaining ms captured when the session was paused. */
  pausedRemaining: number | null
  /** Initial length, for the progress bar (seconds). */
  total: number
  /** What comes next, e.g. "Serie 3 · Press de banca". */
  label: string
}

const sessionKey = (uid: string, id: string) => `workit:session:${uid}:${id}`
const restKey = (uid: string, id: string) => `workit:rest:${uid}:${id}`

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function write(key: string, value: unknown) {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage full or blocked (private mode): Firestore remains the source of truth.
  }
}

export const localSession = {
  load: (uid: string, id: string) => read<Workout>(sessionKey(uid, id)),
  save: (uid: string, workout: Workout) => write(sessionKey(uid, workout.id), workout),
  loadRest: (uid: string, id: string) => read<RestTimerState>(restKey(uid, id)),
  saveRest: (uid: string, id: string, rest: RestTimerState | null) => write(restKey(uid, id), rest),
  clear: (uid: string, id: string) => {
    write(sessionKey(uid, id), null)
    write(restKey(uid, id), null)
  },
  /** Sessions stored on this device for this user (e.g. started offline). */
  list: (uid: string): Workout[] => {
    const prefix = `workit:session:${uid}:`
    const found: Workout[] = []
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith(prefix)) {
          const workout = read<Workout>(key)
          if (workout) found.push(workout)
        }
      }
    } catch {
      // Storage unavailable.
    }
    return found
  },
}

/** Picks the newer of the device and server copies. */
export function newerWorkout(local: Workout | null, remote: Workout | null): Workout | null {
  if (!local) return remote
  if (!remote) return local
  return local.revision > remote.revision ? local : remote
}
