import { Flame, Play } from 'lucide-react'
import { MockFrame } from './MockFrame'

// Illustrative weekly working volume, in kg (Mon → Sun). 0 = rest day.
const week = [
  { day: 'L', kg: 8200 },
  { day: 'M', kg: 0 },
  { day: 'X', kg: 9100 },
  { day: 'J', kg: 0 },
  { day: 'V', kg: 7600 },
  { day: 'S', kg: 0 },
  { day: 'D', kg: 0 },
]
const max = Math.max(...week.map((d) => d.kg))

const recent = [
  { name: 'Rutina C · Pierna', meta: 'Ayer · 58 min' },
  { name: 'Rutina B · Espalda y bíceps', meta: 'Hace 3 días · 52 min' },
]

export function DashboardMockup({ className }: { className?: string }) {
  return (
    <MockFrame
      variant="panel"
      className={className}
      label="Ejemplo del panel principal de WorkIt: entrenamiento del día, racha, sesiones de la semana, volumen semanal y últimos entrenamientos."
    >
      <div className="grid gap-3 p-4 pt-5 sm:grid-cols-[1.4fr_1fr] sm:p-5">
        <div className="flex flex-col gap-3">
          <div>
            <p className="text-xs text-muted">Viernes</p>
            <p className="font-display text-2xl font-bold uppercase">Hoy toca pecho</p>
          </div>

          <div className="rounded-2xl border border-border bg-surface-2 p-4">
            <p className="text-xs font-semibold tracking-wider text-primary uppercase">Programado</p>
            <p className="mt-1 text-lg font-semibold">Rutina A · Pecho, hombros y tríceps</p>
            <p className="text-sm text-muted">4 ejercicios · 12 series</p>
            <span className="mt-3 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary">
              <Play className="size-4 fill-current" aria-hidden="true" />
              Comenzar entrenamiento
            </span>
          </div>

          <div className="rounded-2xl border border-border bg-surface-2 p-4">
            <div className="flex items-baseline justify-between">
              <p className="text-sm font-semibold">Volumen semanal</p>
              <p className="text-xs text-muted">kg · series de trabajo</p>
            </div>
            <div className="mt-3 flex h-24 items-end gap-2">
              {week.map((d, i) => (
                <div key={d.day} className="flex h-full flex-1 flex-col items-center gap-1.5">
                  <div className="flex w-full flex-1 items-end">
                    {/* Bars grow from the baseline when the panel scrolls into view. */}
                    <div
                      className={
                        d.kg
                          ? 'w-full origin-bottom scale-y-0 rounded-md bg-primary transition-transform duration-700 ease-out-quart group-data-[visible=true]/frame:scale-y-100'
                          : 'w-full rounded-md bg-surface-3'
                      }
                      style={{
                        height: d.kg ? `${(d.kg / max) * 100}%` : '4px',
                        transitionDelay: `${150 + i * 90}ms`,
                      }}
                    />
                  </div>
                  <span className="text-[0.625rem] text-subtle">{d.day}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-border bg-surface-2 p-3">
              <Flame className="size-4 text-primary" aria-hidden="true" />
              <p className="mt-1 font-display text-3xl font-bold">5</p>
              <p className="text-xs text-muted">días de racha</p>
            </div>
            <div className="rounded-2xl border border-border bg-surface-2 p-3">
              <p className="text-xs text-muted">Esta semana</p>
              <p className="mt-1 font-display text-3xl font-bold">
                3<span className="text-lg text-subtle">/4</span>
              </p>
              <p className="text-xs text-muted">sesiones</p>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-surface-2 p-4">
            <p className="text-sm font-semibold">Últimos entrenamientos</p>
            <ul className="mt-2 flex flex-col divide-y divide-border">
              {recent.map((r) => (
                <li key={r.name} className="py-2">
                  <p className="text-sm">{r.name}</p>
                  <p className="text-xs text-muted">{r.meta}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </MockFrame>
  )
}
