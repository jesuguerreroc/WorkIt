import { useEffect, useState } from 'react'
import { Check, Timer } from 'lucide-react'
import { cn } from '@/lib/cn'
import { MockFrame } from './MockFrame'

const sets = [
  { n: 1, previous: '60 × 10', kg: '62,5', reps: '10', done: true },
  { n: 2, previous: '60 × 9', kg: '62,5', reps: '9', done: true },
  { n: 3, previous: '60 × 8', kg: '62,5', reps: '', done: false },
]

export function WorkoutMockup({ className }: { className?: string }) {
  return (
    <MockFrame
      className={className}
      label="Ejemplo de sesión activa en WorkIt: press de banca con tres series, peso, repeticiones y temporizador de descanso."
    >
      <div className="flex flex-col gap-4 p-4 pt-5">
        <div>
          <p className="text-[0.6875rem] font-semibold tracking-wider text-primary uppercase">En curso · 32:14</p>
          <p className="mt-0.5 font-display text-xl leading-tight font-bold uppercase">Rutina A</p>
          <p className="text-xs text-muted">Pecho, hombros y tríceps</p>
        </div>

        <div className="rounded-2xl border border-border bg-surface-2 p-3">
          <div className="flex items-baseline justify-between gap-2">
            <p className="font-semibold">Press de banca</p>
            <p className="text-xs whitespace-nowrap text-muted">3 × 8–12</p>
          </div>

          <div className="mt-3 grid grid-cols-[0.75rem_minmax(0,1fr)_2.75rem_2.25rem_1.75rem] items-center gap-x-1.5 gap-y-2 text-xs">
            <span className="text-subtle">#</span>
            <span className="text-subtle">Anterior</span>
            <span className="text-center text-subtle">kg</span>
            <span className="text-center text-subtle">Reps</span>
            <span />
            {sets.map((set) => (
              <SetRow key={set.n} {...set} />
            ))}
          </div>
        </div>

        <RestTimer />

        <div className="rounded-2xl border border-border bg-surface-2 p-3 opacity-70">
          <p className="font-semibold">Press inclinado con mancuernas</p>
          <p className="mt-1 text-xs text-muted">3 × 8–12 · 90 s de descanso</p>
        </div>
      </div>
    </MockFrame>
  )
}

const REST_SECONDS = 90

/** Decorative countdown that loops; frozen at 1:24 when the user prefers reduced motion. */
function RestTimer() {
  const [remaining, setRemaining] = useState(84)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = window.setInterval(() => {
      setRemaining((value) => (value <= 1 ? REST_SECONDS : value - 1))
    }, 1000)
    return () => window.clearInterval(id)
  }, [])

  const minutes = Math.floor(remaining / 60)
  const seconds = String(remaining % 60).padStart(2, '0')

  return (
    <div className="flex items-center gap-3 rounded-2xl bg-primary-soft p-3">
      <Timer className="size-5 text-primary" aria-hidden="true" />
      <div className="flex-1">
        <p className="text-xs text-muted">Descanso</p>
        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-3">
          <div
            className="h-full origin-left rounded-full bg-primary transition-transform duration-1000 ease-linear"
            style={{ transform: `scaleX(${remaining / REST_SECONDS})` }}
          />
        </div>
      </div>
      <p className="font-display text-xl font-bold tabular-nums">
        {minutes}:{seconds}
      </p>
    </div>
  )
}

function SetRow({ n, previous, kg, reps, done }: (typeof sets)[number]) {
  return (
    <>
      <span className="font-semibold text-muted tabular-nums">{n}</span>
      <span className="truncate text-muted tabular-nums">{previous}</span>
      <span
        className={cn(
          'rounded-md py-1.5 text-center font-semibold tabular-nums',
          done ? 'bg-surface-3' : 'bg-surface-3 ring-1 ring-primary',
        )}
      >
        {kg}
      </span>
      <span className="rounded-md bg-surface-3 py-1.5 text-center font-semibold tabular-nums">
        {reps || <span className="text-subtle">–</span>}
      </span>
      <span
        className={cn(
          'flex size-7 items-center justify-center rounded-md',
          done
            ? 'bg-primary text-on-primary opacity-0 group-data-[visible=true]/frame:animate-pop'
            : 'border border-control',
        )}
        style={done ? { animationDelay: `${300 + n * 200}ms` } : undefined}
      >
        {done && <Check className="size-4" strokeWidth={3} aria-hidden="true" />}
      </span>
    </>
  )
}
