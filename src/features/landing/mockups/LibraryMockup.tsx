import { Dumbbell, Search } from 'lucide-react'
import { cn } from '@/lib/cn'
import { MockFrame } from './MockFrame'

const filters = ['Todos', 'Pecho', 'Espalda', 'Hombros', 'Piernas']

const exercises = [
  { name: 'Press de banca', muscles: 'Pecho · Tríceps, hombro anterior', gear: 'Barra' },
  { name: 'Remo con barra', muscles: 'Espalda · Bíceps, deltoides posterior', gear: 'Barra' },
  { name: 'Elevaciones laterales', muscles: 'Hombros', gear: 'Mancuernas' },
]

export function LibraryMockup({ className }: { className?: string }) {
  return (
    <MockFrame
      className={className}
      label="Ejemplo de la biblioteca de ejercicios de WorkIt: buscador, filtros por grupo muscular y fichas con músculos y equipamiento."
    >
      <div className="flex flex-col gap-3 p-4 pt-5">
        <p className="font-display text-xl font-bold uppercase">Ejercicios</p>

        <div className="flex items-center gap-2 rounded-xl border border-control bg-canvas px-3 py-2.5 text-sm text-subtle">
          <Search className="size-4" aria-hidden="true" />
          Buscar ejercicio
        </div>

        <div className="flex gap-1.5 overflow-hidden">
          {filters.map((f, i) => (
            <span
              key={f}
              className={cn(
                'shrink-0 rounded-full px-3 py-1 text-xs font-semibold',
                i === 1 ? 'bg-primary text-on-primary' : 'border border-border-strong text-muted',
              )}
            >
              {f}
            </span>
          ))}
        </div>

        <ul className="flex flex-col gap-2">
          {exercises.map((ex) => (
            <li key={ex.name} className="flex gap-3 rounded-2xl border border-border bg-surface-2 p-2.5">
              {/* Placeholder slot where the licensed demo image will render. */}
              <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-surface-3">
                <Dumbbell className="size-6 text-subtle" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{ex.name}</p>
                <p className="truncate text-xs text-muted">{ex.muscles}</p>
                <p className="mt-0.5 text-[0.6875rem] text-subtle">{ex.gear}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </MockFrame>
  )
}
