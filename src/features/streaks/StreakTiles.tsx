import { Flame, Trophy } from 'lucide-react'
import type { StreakInfo } from './streaks'

/** Current and best streak. The message never treats a rest day as a lost streak. */
export function StreakTiles({ streak }: { streak: StreakInfo }) {
  const message = streak.trainedToday
    ? 'Hoy ya has entrenado.'
    : streak.pendingToday
      ? 'Tu racha sigue viva: entrena hoy para alargarla.'
      : streak.best > 0
        ? 'Empieza una nueva racha con tu próxima sesión.'
        : 'Tu racha empieza con tu primer entrenamiento.'

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="rounded-3xl bg-primary p-4 text-on-primary sm:p-5">
        <Flame className="size-6" aria-hidden="true" />
        <p className="mt-2 font-display text-5xl leading-none font-bold">{streak.current}</p>
        <p className="mt-1 font-semibold">{streak.current === 1 ? 'día de racha' : 'días de racha'}</p>
      </div>
      <div className="rounded-3xl border border-border glass p-4 sm:p-5">
        <Trophy className="size-6 text-primary" aria-hidden="true" />
        <p className="mt-2 font-display text-5xl leading-none font-bold">{streak.best}</p>
        <p className="mt-1 text-muted">mejor racha</p>
      </div>
      <p className="col-span-2 text-sm text-muted">
        {message} La racha cuenta días consecutivos con al menos una sesión completada; es una motivación, no una
        obligación de entrenar a diario.
      </p>
    </div>
  )
}
