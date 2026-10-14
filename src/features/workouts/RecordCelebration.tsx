import { useEffect, type CSSProperties } from 'react'
import { Trophy } from 'lucide-react'
import type { WeightUnit } from '@/types/profile'
import type { RecordHit } from '@/types/workout'
import { recordText } from './format'

const VISIBLE_MS = 4000

/** 14 particles evenly around the trophy, alternating distance and colour. */
const PARTICLES = Array.from({ length: 14 }, (_, i) => {
  const angle = (i / 14) * Math.PI * 2
  const distance = i % 2 ? 46 : 64
  return { dx: Math.cos(angle) * distance, dy: Math.sin(angle) * distance, lime: i % 3 !== 0, delay: (i % 4) * 40 }
})

/** Live "new personal record" card, shown on top of the workout for a few seconds. */
export function RecordCelebration({ hit, unit, onClose }: { hit: RecordHit; unit: WeightUnit; onClose: () => void }) {
  useEffect(() => {
    const id = setTimeout(onClose, VISIBLE_MS)
    return () => clearTimeout(id)
  }, [onClose])

  return (
    <div role="status" className="pointer-events-none fixed inset-x-0 top-[calc(4.5rem+env(safe-area-inset-top))] z-50 flex justify-center px-4">
      <button
        type="button"
        onClick={onClose}
        className="pointer-events-auto flex w-full max-w-sm items-center gap-4 rounded-3xl border border-primary/50 glass-strong p-4 text-left shadow-2xl shadow-black/60 motion-safe:animate-pop"
      >
        <span className="relative flex size-14 shrink-0 items-center justify-center">
          <span className="absolute inset-0 rounded-full bg-primary/30 motion-safe:animate-ping" aria-hidden="true" />
          <span className="relative flex size-14 items-center justify-center rounded-full bg-primary text-on-primary">
            <Trophy className="size-7" aria-hidden="true" />
          </span>
          {PARTICLES.map((p, i) => (
            <span
              key={i}
              aria-hidden="true"
              className={`absolute top-1/2 left-1/2 -mt-1 -ml-1 size-2 rounded-full opacity-0 motion-safe:animate-burst ${p.lime ? 'bg-primary' : 'bg-fg'}`}
              style={{ '--dx': `${p.dx}px`, '--dy': `${p.dy}px`, animationDelay: `${p.delay}ms` } as CSSProperties}
            />
          ))}
        </span>
        <span className="min-w-0">
          <span className="block text-xs font-semibold tracking-wide text-primary uppercase">¡Nuevo récord personal!</span>
          <span className="block truncate font-semibold">{hit.exerciseName}</span>
          <span className="block text-sm text-muted">{recordText(hit, unit)}</span>
        </span>
      </button>
    </div>
  )
}
