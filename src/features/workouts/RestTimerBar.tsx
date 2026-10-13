import { BellRing, ChevronsRight, Timer } from 'lucide-react'
import { formatClock } from '@/lib/dates'
import type { useRestTimer } from './useRestTimer'

const round =
  'flex size-14 shrink-0 items-center justify-center rounded-full font-display text-lg font-bold tabular-nums transition-colors'

/** Floating rest pill: countdown, ±15 s and skip. */
export function RestTimerBar({ timer, paused }: { timer: ReturnType<typeof useRestTimer>; paused: boolean }) {
  const { rest, remainingMs, justFinished, dismiss, adjust, skip, step } = timer

  if (!rest && justFinished) {
    return (
      <div role="status" className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        <button
          type="button"
          onClick={dismiss}
          className="mx-auto flex w-full max-w-3xl items-center gap-3 rounded-full bg-primary px-6 py-4 text-left font-semibold text-on-primary shadow-2xl motion-safe:animate-rise"
        >
          <BellRing className="size-6" aria-hidden="true" />
          Descanso terminado. ¡A por la siguiente serie!
        </button>
      </div>
    )
  }
  if (!rest) return null

  const seconds = Math.ceil(remainingMs / 1000)
  const progress = rest.total > 0 ? Math.min(1, remainingMs / (rest.total * 1000)) : 0

  return (
    <section
      aria-label="Temporizador de descanso"
      className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]"
    >
      <div className="relative mx-auto max-w-3xl overflow-hidden rounded-[2rem] glass-strong border border-border-strong shadow-2xl shadow-black/70 motion-safe:animate-rise">
        <div className="absolute inset-x-0 top-0 h-1 bg-surface-3">
          <div
            className="h-full origin-left bg-primary transition-transform duration-300 ease-linear"
            style={{ transform: `scaleX(${progress})` }}
          />
        </div>
        <div className="flex items-center gap-2 py-3 pr-3 pl-5">
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 text-sm text-muted">
              <Timer className="size-4 text-primary" aria-hidden="true" />
              {paused ? 'Descanso en pausa' : 'Descanso'}
            </p>
            <p className="font-display text-4xl leading-none font-bold tabular-nums" aria-hidden="true">
              {formatClock(seconds)}
            </p>
            <p className="mt-0.5 truncate text-xs text-muted">{rest.label}</p>
            {/* Announced once per minute and in the last 10 s, not every second. */}
            <span className="sr-only" aria-live="polite">
              {seconds % 60 === 0 || seconds <= 10 ? `${seconds} segundos de descanso` : ''}
            </span>
          </div>
          <button type="button" onClick={() => adjust(-step)} className={`${round} bg-surface-3 hover:bg-control/40`} aria-label={`Restar ${step} segundos`}>
            −{step}s
          </button>
          <button type="button" onClick={() => adjust(step)} className={`${round} bg-surface-3 hover:bg-control/40`} aria-label={`Sumar ${step} segundos`}>
            +{step}s
          </button>
          <button type="button" onClick={skip} className={`${round} bg-primary text-on-primary hover:bg-primary-hover`} aria-label="Saltar descanso">
            <ChevronsRight className="size-7" aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  )
}
