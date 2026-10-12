import { useState } from 'react'
import { ChevronLeft, ChevronRight, Moon } from 'lucide-react'
import { cn } from '@/lib/cn'
import { dateFromKey } from '@/lib/dates'
import type { Workout } from '@/types/workout'
import { countedWorkouts } from '@/features/streaks/achievements'
import { monthCalendar, monthTitle } from './progressData'

const WEEKDAYS = [
  ['L', 'lunes'],
  ['M', 'martes'],
  ['X', 'miércoles'],
  ['J', 'jueves'],
  ['V', 'viernes'],
  ['S', 'sábado'],
  ['D', 'domingo'],
] as const

/** Monthly view of training days. Trained days carry a check icon, not just color. */
export function ActivityCalendar({ workouts, today }: { workouts: Workout[]; today: string }) {
  const todayDate = dateFromKey(today)
  const [cursor, setCursor] = useState({ year: todayDate.getFullYear(), month: todayDate.getMonth() })
  const cells = monthCalendar(cursor.year, cursor.month, workouts, today)
  // Rest days only make sense from the first training day on (not before using the app).
  const firstDay = countedWorkouts(workouts)[0]?.localDate ?? null
  const trainedCount = cells.filter((c) => c?.trained).length
  const isCurrentMonth = cursor.year === todayDate.getFullYear() && cursor.month === todayDate.getMonth()

  const shift = (delta: number) =>
    setCursor(({ year, month }) => {
      const d = new Date(year, month + delta, 1)
      return { year: d.getFullYear(), month: d.getMonth() }
    })

  return (
    <section aria-labelledby="calendar-title" className="rounded-3xl border border-border bg-surface p-4 sm:p-5">
      <header className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => shift(-1)}
          aria-label="Mes anterior"
          className="flex size-11 items-center justify-center rounded-xl text-muted hover:bg-surface-2 hover:text-fg"
        >
          <ChevronLeft className="size-5" aria-hidden="true" />
        </button>
        <div className="text-center">
          <h3 id="calendar-title" className="font-semibold" aria-live="polite">
            {monthTitle(cursor.year, cursor.month)}
          </h3>
          <p className="text-sm text-muted">
            {trainedCount} {trainedCount === 1 ? 'día entrenado' : 'días entrenados'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => shift(1)}
          aria-label="Mes siguiente"
          disabled={isCurrentMonth}
          className="flex size-11 items-center justify-center rounded-xl text-muted hover:bg-surface-2 hover:text-fg disabled:opacity-30"
        >
          <ChevronRight className="size-5" aria-hidden="true" />
        </button>
      </header>

      <div className="mt-4 grid grid-cols-7 gap-y-1.5">
        {WEEKDAYS.map(([short, long]) => (
          <span key={long} aria-hidden="true" className="pb-1 text-center text-xs font-medium text-subtle">
            {short}
          </span>
        ))}
        {/* display: contents keeps each day a grid cell while preserving list semantics. */}
        <ol aria-label="Días del mes" className="contents">
          {cells.map((cell, i) => {
            if (cell === null) return <li key={`pad-${i}`} aria-hidden="true" />
            const column = i % 7
            // Consecutive trained days in the same week row are joined into one band.
            const joinLeft = cell.trained && column > 0 && cells[i - 1]?.trained
            const joinRight = cell.trained && column < 6 && cells[i + 1]?.trained
            const rest = !cell.trained && !cell.isFuture && !cell.isToday && firstDay !== null && cell.key > firstDay
            return (
              <li
                key={cell.key}
                aria-label={`${cell.day}${cell.trained ? `, entrenado${cell.sessions > 1 ? ` (${cell.sessions} sesiones)` : ''}` : rest ? ', descanso' : ''}${cell.isToday ? ', hoy' : ''}`}
                className="relative flex aspect-square items-center justify-center"
              >
                {(joinLeft || joinRight) && (
                  <span
                    aria-hidden="true"
                    className={cn(
                      'absolute inset-y-[12%] bg-primary/25',
                      joinLeft ? 'left-0' : 'left-1/2',
                      joinRight ? 'right-0' : 'right-1/2',
                    )}
                  />
                )}
                <span
                  aria-hidden="true"
                  className={cn(
                    'relative flex size-[84%] items-center justify-center rounded-full text-sm font-semibold tabular-nums',
                    cell.trained && 'bg-primary text-on-primary',
                    rest && 'border border-border-strong text-subtle',
                    !cell.trained && !rest && !cell.isFuture && !cell.isToday && 'text-subtle/70',
                    cell.isFuture && 'text-subtle/70',
                    cell.isToday && !cell.trained && 'border-2 border-fg text-fg',
                    cell.isToday && cell.trained && 'ring-2 ring-fg ring-offset-2 ring-offset-surface',
                  )}
                >
                  {rest ? <Moon className="size-4" /> : cell.day}
                </span>
              </li>
            )
          })}
        </ol>
      </div>
      <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded-full bg-primary" aria-hidden="true" /> Entrenado
        </span>
        <span className="flex items-center gap-1.5">
          <Moon className="size-3" aria-hidden="true" /> Descanso
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded ring-2 ring-fg" aria-hidden="true" /> Hoy
        </span>
      </p>
    </section>
  )
}
