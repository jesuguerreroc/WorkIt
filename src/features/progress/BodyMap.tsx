import { useMemo, useState } from 'react'
import { useAllExercises } from '@/features/exercises/useExercises'
import { muscleLabels } from '@/features/exercises/taxonomy'
import { cn } from '@/lib/cn'
import { formatNumber } from '@/lib/numbers'
import type { Muscle } from '@/types/exercise'
import type { Workout } from '@/types/workout'
import { muscleLevel, setsByMuscle } from './progressData'

/*
 * Stylised front/back silhouette drawn for WorkIt (no third-party artwork).
 * Both figures share one 120×230 coordinate system centred on x = 60.
 */
type Region = { muscle: Muscle; d: string }

const FRONT: Region[] = [
  { muscle: 'neck', d: 'M55 29h10v9H55z' },
  { muscle: 'traps', d: 'M55 36Q48 38 42 42L55 42Z' },
  { muscle: 'traps', d: 'M65 36Q72 38 78 42L65 42Z' },
  { muscle: 'shoulders', d: 'M42 43Q31 43 29 55Q29 61 32 64Q38 56 45 52Z' },
  { muscle: 'shoulders', d: 'M78 43Q89 43 91 55Q91 61 88 64Q82 56 75 52Z' },
  { muscle: 'chest', d: 'M59 44L46 44Q41 50 42 60Q46 67 59 66Z' },
  { muscle: 'chest', d: 'M61 44L74 44Q79 50 78 60Q74 67 61 66Z' },
  { muscle: 'biceps', d: 'M31 66Q36 60 41 62Q42 72 39 82Q34 86 30 82Q28 74 31 66Z' },
  { muscle: 'biceps', d: 'M89 66Q84 60 79 62Q78 72 81 82Q86 86 90 82Q92 74 89 66Z' },
  { muscle: 'forearms', d: 'M29 86Q34 88 39 86Q38 100 33 114L27 114Q25 100 29 86Z' },
  { muscle: 'forearms', d: 'M91 86Q86 88 81 86Q82 100 87 114L93 114Q95 100 91 86Z' },
  { muscle: 'abdominals', d: 'M52 69h7v9.5h-7zM61 69h7v9.5h-7zM52 80h7v9.5h-7zM61 80h7v9.5h-7zM52 91h7v9.5h-7zM61 91h7v9.5h-7zM52 102h16v6Q60 113 52 108Z' },
  { muscle: 'abdominals', d: 'M45 68Q49 68 50 70L50 104Q46 100 44 92Q43 80 45 68Z' },
  { muscle: 'abdominals', d: 'M75 68Q71 68 70 70L70 104Q74 100 76 92Q77 80 75 68Z' },
  { muscle: 'abductors', d: 'M42 108Q46 104 49 110L47 128Q42 124 41 116Z' },
  { muscle: 'abductors', d: 'M78 108Q74 104 71 110L73 128Q78 124 79 116Z' },
  { muscle: 'adductors', d: 'M58 114L58 140Q54 136 52 124Q53 116 58 114Z' },
  { muscle: 'adductors', d: 'M62 114L62 140Q66 136 68 124Q67 116 62 114Z' },
  { muscle: 'quadriceps', d: 'M49 112Q53 116 51 128Q55 142 57 146Q56 160 52 166L45 166Q40 150 41 132Q42 120 49 112Z' },
  { muscle: 'quadriceps', d: 'M71 112Q67 116 69 128Q65 142 63 146Q64 160 68 166L75 166Q80 150 79 132Q78 120 71 112Z' },
  { muscle: 'calves', d: 'M44 178Q49 176 53 178Q53 196 50 212L46 212Q42 196 44 178Z' },
  { muscle: 'calves', d: 'M76 178Q71 176 67 178Q67 196 70 212L74 212Q78 196 76 178Z' },
]

const BACK: Region[] = [
  { muscle: 'neck', d: 'M55 29h10v6H55z' },
  { muscle: 'traps', d: 'M60 32L68 36L80 43L66 48L60 58L54 48L40 43L52 36Z' },
  { muscle: 'shoulders', d: 'M42 43Q31 43 29 55Q29 61 32 64Q38 56 45 52Z' },
  { muscle: 'shoulders', d: 'M78 43Q89 43 91 55Q91 61 88 64Q82 56 75 52Z' },
  { muscle: 'middle_back', d: 'M54 50L60 60L66 50L69 54L66 74L54 74L51 54Z' },
  { muscle: 'lats', d: 'M49 52L52 56L53 76L57 78L57 90Q50 96 46 92Q42 76 44 60Z' },
  { muscle: 'lats', d: 'M71 52L68 56L67 76L63 78L63 90Q70 96 74 92Q78 76 76 60Z' },
  { muscle: 'lower_back', d: 'M57 77L63 77L63 90L68 94L68 103Q60 107 52 103L52 94L57 90Z' },
  { muscle: 'triceps', d: 'M31 66Q36 60 41 62Q42 72 39 82Q34 86 30 82Q28 74 31 66Z' },
  { muscle: 'triceps', d: 'M89 66Q84 60 79 62Q78 72 81 82Q86 86 90 82Q92 74 89 66Z' },
  { muscle: 'forearms', d: 'M29 86Q34 88 39 86Q38 100 33 114L27 114Q25 100 29 86Z' },
  { muscle: 'forearms', d: 'M91 86Q86 88 81 86Q82 100 87 114L93 114Q95 100 91 86Z' },
  { muscle: 'glutes', d: 'M59 106L59 126Q50 130 44 124Q42 112 48 106Z' },
  { muscle: 'glutes', d: 'M61 106L61 126Q70 130 76 124Q78 112 72 106Z' },
  { muscle: 'hamstrings', d: 'M44 128Q51 132 58 129Q57 150 53 166L46 166Q41 148 44 128Z' },
  { muscle: 'hamstrings', d: 'M76 128Q69 132 62 129Q63 150 67 166L74 166Q79 148 76 128Z' },
  { muscle: 'calves', d: 'M44 172Q49 168 54 172Q55 188 51 202L46 202Q42 188 44 172Z' },
  { muscle: 'calves', d: 'M76 172Q71 168 66 172Q65 188 69 202L74 202Q78 188 76 172Z' },
]

/** Head, hands, knees and feet: context only, never coloured. */
const NEUTRAL = (
  <>
    <ellipse cx="60" cy="17" rx="10" ry="12" />
    <ellipse cx="30" cy="120" rx="4" ry="5" />
    <ellipse cx="90" cy="120" rx="4" ry="5" />
    <ellipse cx="48.5" cy="171.5" rx="5" ry="4" />
    <ellipse cx="71.5" cy="171.5" rx="5" ry="4" />
    <ellipse cx="48" cy="218" rx="5" ry="4" />
    <ellipse cx="72" cy="218" rx="5" ry="4" />
  </>
)

const LEVEL_FILL = ['fill-white/10', 'fill-primary/25', 'fill-primary/45', 'fill-primary/70', 'fill-primary'] as const
const LEVEL_BG = ['bg-white/10', 'bg-primary/25', 'bg-primary/45', 'bg-primary/70', 'bg-primary'] as const
const LEGEND = ['0', '1–3', '4–6', '7–9', '10+'] as const

const PERIODS = [
  { days: 7, label: '7 días' },
  { days: 30, label: '30 días' },
] as const

function Figure({ title, regions, levelOf, setsOf }: { title: string; regions: Region[]; levelOf: (m: Muscle) => number; setsOf: (m: Muscle) => number }) {
  return (
    <figure className="flex flex-1 flex-col items-center gap-1">
      <svg viewBox="0 0 120 230" className="w-full max-w-40" aria-hidden="true">
        <g className="fill-white/5">{NEUTRAL}</g>
        {regions.map((r, i) => (
          <path key={i} d={r.d} className={cn('stroke-canvas transition-colors duration-500', LEVEL_FILL[levelOf(r.muscle)])} strokeWidth="1">
            <title>{`${muscleLabels[r.muscle]}: ${formatNumber(setsOf(r.muscle))} series`}</title>
          </path>
        ))}
      </svg>
      <figcaption className="text-xs font-medium text-muted">{title}</figcaption>
    </figure>
  )
}

/** Front/back body coloured by working sets per muscle in the chosen period. */
export function BodyMap({ workouts, today }: { workouts: Workout[]; today: string }) {
  const [days, setDays] = useState<number>(7)
  const { resolve } = useAllExercises()
  const list = useMemo(
    () =>
      setsByMuscle(workouts, today, days, (ref) => {
        const exercise = resolve(ref)
        return exercise && { primary: exercise.primaryMuscles, secondary: exercise.secondaryMuscles }
      }),
    [workouts, today, days, resolve],
  )
  const sets = useMemo(() => new Map(list.map((m) => [m.muscle, m.sets])), [list])
  const setsOf = (m: Muscle) => sets.get(m) ?? 0
  // Colours always use sets per week, so 30 days is not "hotter" just for being longer.
  const levelOf = (m: Muscle) => muscleLevel((setsOf(m) * 7) / days)
  const top = list.slice(0, 6)

  return (
    <section aria-labelledby="bodymap-title" className="rounded-3xl border border-border glass p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="bodymap-title" className="text-lg leading-snug font-semibold">
            Músculos trabajados
          </h2>
          <p className="text-sm text-muted">Series de trabajo por músculo</p>
        </div>
        <div role="group" aria-label="Periodo" className="flex shrink-0 gap-1 rounded-full bg-surface-2 p-1">
          {PERIODS.map((p) => (
            <button
              key={p.days}
              type="button"
              aria-pressed={days === p.days}
              onClick={() => setDays(p.days)}
              className={cn(
                'min-h-9 rounded-full px-3 text-sm font-semibold',
                days === p.days ? 'bg-primary text-on-primary' : 'text-muted hover:text-fg',
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <Figure title="Frente" regions={FRONT} levelOf={levelOf} setsOf={setsOf} />
        <Figure title="Espalda" regions={BACK} levelOf={levelOf} setsOf={setsOf} />
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-muted" aria-hidden="true">
        <span>Series/semana:</span>
        {LEGEND.map((label, i) => (
          <span key={label} className="flex items-center gap-1">
            <span className={cn('size-3 rounded-sm', LEVEL_BG[i])} />
            {label}
          </span>
        ))}
      </div>

      {top.length === 0 ? (
        <p className="mt-4 text-center text-sm text-muted">Sin entrenamientos en los últimos {days} días.</p>
      ) : (
        <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm" aria-label={`Series por músculo en los últimos ${days} días`}>
          {top.map(({ muscle, sets: count }) => (
            <li key={muscle} className="flex items-center justify-between gap-2">
              <span className="flex min-w-0 items-center gap-2">
                <span className={cn('size-2.5 shrink-0 rounded-full', LEVEL_BG[levelOf(muscle)])} aria-hidden="true" />
                <span className="truncate">{muscleLabels[muscle]}</span>
              </span>
              <span className="font-semibold tabular-nums">{formatNumber(count)}</span>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3 text-xs text-subtle">Músculo principal = 1 serie; secundario = media serie.</p>
    </section>
  )
}
