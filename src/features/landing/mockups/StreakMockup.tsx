import { Flame, Trophy } from 'lucide-react'
import { cn } from '@/lib/cn'
import { MockFrame } from './MockFrame'

// Illustrative month: 30 days starting on a Wednesday (offset 2 in a Monday-first grid).
const OFFSET = 2
const DAYS = 30
const TODAY = 19
const TRAINED = new Set([2, 3, 5, 6, 8, 9, 10, 12, 13, 15, 16, 17, 18, 19])
const WEEKDAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

export function StreakMockup({ className }: { className?: string }) {
  return (
    <MockFrame
      className={className}
      label="Ejemplo de la pantalla de rachas de WorkIt: racha actual, récord de racha y calendario mensual de entrenamientos."
    >
      <div className="flex flex-col gap-4 p-4 pt-5">
        <p className="text-[0.6875rem] font-semibold tracking-wider text-muted uppercase">Constancia</p>

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-2xl bg-primary p-3 text-on-primary">
            <Flame className="size-5" aria-hidden="true" />
            <p className="mt-2 font-display text-4xl leading-none font-bold">5</p>
            <p className="text-xs font-semibold">días de racha</p>
          </div>
          <div className="rounded-2xl border border-border bg-surface-2 p-3">
            <Trophy className="size-5 text-primary" aria-hidden="true" />
            <p className="mt-2 font-display text-4xl leading-none font-bold">9</p>
            <p className="text-xs text-muted">récord</p>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface-2 p-3">
          <p className="mb-2 text-sm font-semibold">Este mes</p>
          <div className="grid grid-cols-7 gap-1 text-center text-[0.625rem]">
            {WEEKDAYS.map((day) => (
              <span key={day} className="pb-1 text-subtle">
                {day}
              </span>
            ))}
            {Array.from({ length: OFFSET }, (_, i) => (
              <span key={`pad-${i}`} />
            ))}
            {Array.from({ length: DAYS }, (_, i) => {
              const day = i + 1
              return (
                <span
                  key={day}
                  className={cn(
                    'flex aspect-square items-center justify-center rounded-md font-semibold tabular-nums',
                    TRAINED.has(day) &&
                      'bg-primary text-on-primary opacity-0 group-data-[visible=true]/frame:animate-pop',
                    !TRAINED.has(day) && day <= TODAY && 'bg-surface-3 text-muted',
                    day > TODAY && 'text-subtle',
                    day === TODAY && 'ring-2 ring-fg ring-offset-1 ring-offset-surface-2',
                  )}
                  // Trained days light up in order, like the streak being built.
                  style={TRAINED.has(day) ? { animationDelay: `${200 + day * 45}ms` } : undefined}
                >
                  {day}
                </span>
              )
            })}
          </div>
        </div>
      </div>
    </MockFrame>
  )
}
