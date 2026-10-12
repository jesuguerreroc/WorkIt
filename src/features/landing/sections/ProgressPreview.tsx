import { CalendarDays, Flame, TrendingUp } from 'lucide-react'
import { Reveal } from '@/components/ui/Reveal'
import { Tilt } from '@/components/ui/Tilt'
import { useInView } from '@/hooks/useInView'
import { staggerDelay } from '@/lib/motion'
import { DashboardMockup } from '../mockups/DashboardMockup'
import { WorkoutMockup } from '../mockups/WorkoutMockup'
import { SectionHeading } from './SectionHeading'

const facts = [
  {
    icon: Flame,
    title: 'Rachas justas',
    text: 'Varias sesiones el mismo día cuentan como un solo día, y tu racha de ayer sigue en pie mientras hoy aún puedas entrenar.',
  },
  {
    icon: TrendingUp,
    title: 'Progreso por ejercicio',
    text: 'Volumen calculado solo con series de trabajo y récords detectados a partir de tu historial.',
  },
  {
    icon: CalendarDays,
    title: 'Descansar también cuenta',
    text: 'La racha es una motivación, no una obligación de entrenar todos los días.',
  },
]

export function ProgressPreview() {
  const [listRef, inView] = useInView<HTMLUListElement>()

  return (
    <section id="progreso" aria-labelledby="progreso-title" className="border-t border-border bg-surface py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading id="progreso-title" eyebrow="Progreso" title="Tu panel. Tu sesión. Tus números.">
          Un panel que te dice qué toca hoy y una pantalla de entrenamiento pensada para usarse entre series.
        </SectionHeading>

        <div className="mt-12 grid items-start gap-8 lg:grid-cols-[1.6fr_1fr]">
          <Reveal>
            <Tilt surfaceClassName="tilt-soft">
              <DashboardMockup />
            </Tilt>
          </Reveal>
          <Reveal className="hidden justify-center lg:flex" delay={150}>
            <Tilt>
              <div className="parallax-near">
                <WorkoutMockup />
              </div>
            </Tilt>
          </Reveal>
        </div>

        <ul ref={listRef} data-visible={inView} className="mt-14 grid gap-8 md:grid-cols-3">
          {facts.map(({ icon: Icon, title, text }, index) => (
            <li key={title} className="reveal group" style={staggerDelay(index, 120)}>
              <Icon
                className="size-6 text-primary transition-transform duration-300 ease-out-quart group-hover:-translate-y-0.5 group-hover:scale-110"
                aria-hidden="true"
              />
              <h3 className="mt-3 text-lg font-semibold">{title}</h3>
              <p className="mt-1 text-muted">{text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
