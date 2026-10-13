import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { ArrowLeft, CalendarCheck, CircleHelp, Flame } from 'lucide-react'
import { Dialog } from '@/components/ui/Dialog'
import { ActivityCalendar } from '@/features/progress/ActivityCalendar'
import { useWorkoutHistory } from '@/features/workouts/useWorkouts'
import { useToday } from '@/hooks/useToday'
import { countedWorkouts } from './achievements'
import { computeStreaks } from './streaks'
import { streakOptionsOf } from './streakOptions'
import { useAuth } from '@/features/auth/authContext'
import { StreakWeek } from './StreakWeek'

export function StreakPage() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const flexible = profile?.streakMode === 'flexible'
  const today = useToday()
  const { workouts, status } = useWorkoutHistory()
  const [help, setHelp] = useState(false)
  const counted = useMemo(() => countedWorkouts(workouts), [workouts])
  const streak = useMemo(() => computeStreaks(counted.map((w) => w.localDate), today, streakOptionsOf(profile)), [counted, today, profile])
  const trained = useMemo(() => new Set(streak.days), [streak.days])

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/app'))}
          aria-label="Volver"
          className="-ml-2 flex size-11 items-center justify-center rounded-xl hover:bg-surface-2"
        >
          <ArrowLeft className="size-6" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => setHelp(true)}
          aria-label="Cómo funciona la racha"
          className="-mr-2 flex size-11 items-center justify-center rounded-xl hover:bg-surface-2"
        >
          <CircleHelp className="size-6" aria-hidden="true" />
        </button>
      </div>

      <section className="rounded-[2rem] bg-surface p-4 sm:p-6" aria-labelledby="streak-title">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-display text-7xl leading-none font-bold tabular-nums">{status === 'loading' ? '–' : streak.current}</p>
            <h1 id="streak-title" className="mt-1 text-xl font-semibold">
              {streak.current === 1 ? 'Día de racha' : 'Días de racha'}
            </h1>
          </div>
          <Flame
            className={streak.current > 0 ? 'size-28 fill-primary/20 text-primary drop-shadow-[0_0_24px_rgb(197_240_53/0.35)]' : 'size-28 text-border-strong'}
            strokeWidth={1.5}
            aria-hidden="true"
          />
        </div>
        <p className="mt-3 text-sm text-muted">
          {streak.trainedToday
            ? 'Hoy ya has entrenado. ¡Sigue así!'
            : streak.pendingToday
              ? 'Tu racha sigue viva: entrena hoy para alargarla.'
              : 'Entrena hoy para empezar una nueva racha.'}
        </p>
        <div className="mt-5">
          <StreakWeek trainedDays={trained} today={today} />
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-3xl border border-border glass p-4">
          <p className="flex items-center gap-2 font-display text-3xl font-bold">
            <Flame className="size-5 text-primary" aria-hidden="true" />
            {streak.best}
          </p>
          <p className="text-muted">Mejor racha</p>
        </div>
        <div className="rounded-3xl border border-border glass p-4">
          <p className="flex items-center gap-2 font-display text-3xl font-bold">
            <CalendarCheck className="size-5 text-primary" aria-hidden="true" />
            {streak.days.length}
          </p>
          <p className="text-muted">Días entrenados</p>
        </div>
      </div>

      <ActivityCalendar workouts={workouts} today={today} />

      <Dialog
        open={help}
        onClose={() => setHelp(false)}
        title="Cómo funciona la racha"
        description="Es una motivación para crear hábito, no una obligación ni una recomendación médica."
      >
        <ul className="flex list-disc flex-col gap-2 pl-5 text-muted">
          <li>Suma un día cada día de calendario con al menos un entrenamiento terminado con alguna serie completada.</li>
          <li>Varios entrenamientos el mismo día cuentan como uno.</li>
          <li>Si hoy aún no has entrenado, tu racha de ayer sigue viva hasta que acabe el día.</li>
          {flexible ? (
            <>
              <li>Tienes la racha flexible: los días que no son de entrenamiento en tu perfil nunca la rompen.</li>
              <li>
                Puedes saltarte {profile?.streakAllowedMisses ?? 1} {profile?.streakAllowedMisses === 1 ? 'día planificado' : 'días planificados'}{' '}
                seguidos sin perderla, pero esos días no suman.
              </li>
            </>
          ) : (
            <li>Si pasa un día entero sin entrenar, la racha vuelve a empezar; tu mejor racha se conserva.</li>
          )}
          <li>Puedes cambiar el tipo de racha en Perfil → Preferencias.</li>
          <li>Los entrenamientos que registres después (de días anteriores) también cuentan para su día.</li>
          <li>Descansar es parte del progreso: los días con luna son descansos.</li>
        </ul>
      </Dialog>
    </div>
  )
}
