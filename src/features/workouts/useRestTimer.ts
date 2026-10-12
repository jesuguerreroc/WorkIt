import { useCallback, useEffect, useRef, useState } from 'react'
import { useNow } from '@/hooks/useNow'
import { REST_STEP_SECONDS } from '@/types/routine'
import { localSession, type RestTimerState } from './localSession'
import type { RestPlan } from './workoutActions'

let audio: AudioContext | null = null

/** Created during a tap (browsers only allow audio after a user gesture). */
function unlockAudio() {
  try {
    audio ??= new AudioContext()
    if (audio.state === 'suspended') void audio.resume()
  } catch {
    audio = null
  }
}

function beep() {
  if (!audio) return
  const start = audio.currentTime
  for (const offset of [0, 0.22, 0.44]) {
    const osc = audio.createOscillator()
    const gain = audio.createGain()
    osc.frequency.value = 880
    gain.gain.setValueAtTime(0.0001, start + offset)
    gain.gain.exponentialRampToValueAtTime(0.25, start + offset + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + offset + 0.16)
    osc.connect(gain).connect(audio.destination)
    osc.start(start + offset)
    osc.stop(start + offset + 0.18)
  }
}

/**
 * Rest countdown based on an end timestamp (robust to throttled background tabs
 * and screen locks), persisted on the device so a reload keeps it.
 */
export function useRestTimer(uid: string | undefined, workoutId: string) {
  const [rest, setRest] = useState<RestTimerState | null>(() => (uid ? localSession.loadRest(uid, workoutId) : null))
  const [justFinished, setJustFinished] = useState(false)
  const running = rest !== null && rest.endsAt !== null
  const now = useNow(250, running)
  const notified = useRef(false)

  const persist = useCallback(
    (next: RestTimerState | null) => {
      setRest(next)
      if (uid) localSession.saveRest(uid, workoutId, next)
    },
    [uid, workoutId],
  )

  const remainingMs = rest ? (rest.endsAt !== null ? Math.max(0, rest.endsAt - now) : (rest.pausedRemaining ?? 0)) : 0

  useEffect(() => {
    if (!rest || rest.endsAt === null || remainingMs > 0 || notified.current) return
    notified.current = true
    navigator.vibrate?.([200, 100, 200])
    beep()
    persist(null)
    setJustFinished(true)
    const id = setTimeout(() => setJustFinished(false), 4000)
    return () => clearTimeout(id)
  }, [rest, remainingMs, persist])

  const start = useCallback(
    (plan: RestPlan) => {
      unlockAudio()
      notified.current = false
      setJustFinished(false)
      persist({ endsAt: Date.now() + plan.seconds * 1000, pausedRemaining: null, total: plan.seconds, label: plan.label })
    },
    [persist],
  )

  /** ±15 s (or any delta). Never below zero; extending past the original length grows the bar. */
  const adjust = useCallback(
    (deltaSeconds: number) => {
      if (!rest) return
      unlockAudio()
      const remaining = Math.max(0, remainingMs + deltaSeconds * 1000)
      const total = Math.max(rest.total, Math.ceil(remaining / 1000))
      if (rest.endsAt === null) persist({ ...rest, pausedRemaining: remaining, total })
      else persist({ ...rest, endsAt: Date.now() + remaining, total })
    },
    [rest, remainingMs, persist],
  )

  const skip = useCallback(() => {
    notified.current = true
    persist(null)
  }, [persist])

  /** Freezes / resumes the countdown together with the session. */
  const freeze = useCallback(() => {
    if (rest && rest.endsAt !== null) persist({ ...rest, endsAt: null, pausedRemaining: Math.max(0, rest.endsAt - Date.now()) })
  }, [rest, persist])

  const unfreeze = useCallback(() => {
    if (rest && rest.endsAt === null) persist({ ...rest, endsAt: Date.now() + (rest.pausedRemaining ?? 0), pausedRemaining: null })
  }, [rest, persist])

  return { rest, remainingMs, justFinished, start, adjust, skip, freeze, unfreeze, step: REST_STEP_SECONDS }
}
