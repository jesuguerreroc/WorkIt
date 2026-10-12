import { Check, Dumbbell, Moon } from 'lucide-react'
import { addDays, startOfWeek } from '@/lib/dates'
import { cn } from '@/lib/cn'

const LABELS = [
  ['LU', 'lunes'],
  ['MA', 'martes'],
  ['MI', 'miércoles'],
  ['JU', 'jueves'],
  ['VI', 'viernes'],
  ['SA', 'sábado'],
  ['DO', 'domingo'],
] as const

/** Monday–Sunday of the current week: ✓ trained, moon = rest (past), dumbbell = still ahead. */
export function StreakWeek({ trainedDays, today }: { trainedDays: Set<string>; today: string }) {
  const monday = startOfWeek(today)
  return (
    <ol className="grid grid-cols-7 gap-1" aria-label="Esta semana">
      {LABELS.map(([short, long], i) => {
        const key = addDays(monday, i)
        const trained = trainedDays.has(key)
        const past = key < today
        const isToday = key === today
        const state = trained ? 'entrenado' : past ? 'descanso' : isToday ? 'hoy, pendiente' : 'próximo'
        return (
          <li key={key} className="flex flex-col items-center gap-2" aria-label={`${long}: ${state}`}>
            <span aria-hidden="true" className={cn('text-xs font-semibold', isToday ? 'text-fg' : 'text-muted')}>
              {short}
            </span>
            <span
              aria-hidden="true"
              className={cn(
                'flex size-10 items-center justify-center rounded-full border-2 sm:size-12',
                trained && 'border-primary bg-primary text-on-primary shadow-[0_0_16px] shadow-primary/40',
                !trained && isToday && 'border-fg text-fg',
                !trained && !isToday && 'border-border-strong text-subtle',
              )}
            >
              {trained ? (
                <Check className="size-5" strokeWidth={3} />
              ) : past ? (
                <Moon className="size-4" />
              ) : (
                <Dumbbell className="size-4" />
              )}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
