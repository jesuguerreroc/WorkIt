import { staggerDelay } from '@/lib/motion'
import { useInView } from '@/hooks/useInView'
import { SectionHeading } from './SectionHeading'

const steps = [
  {
    title: 'Organiza tu rutina',
    text: 'Elige tus ejercicios, define series, repeticiones y descansos, y asigna los días en que entrenas.',
  },
  {
    title: 'Registra tu entrenamiento',
    text: 'En el gimnasio, anota el peso y las repeticiones de cada serie mientras el temporizador controla tu descanso.',
  },
  {
    title: 'Observa tu progreso',
    text: 'Consulta tu historial, tus récords y tu racha para saber cómo evolucionas semana a semana.',
  },
]

const STEP_DELAY = 180

export function HowItWorks() {
  const [listRef, inView] = useInView<HTMLOListElement>()

  return (
    <section aria-labelledby="como-funciona-title" className="bg-surface py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading id="como-funciona-title" eyebrow="Cómo funciona" title="Tres pasos. Cada semana." />

        <ol ref={listRef} data-visible={inView} className="group/steps mt-12 grid gap-8 md:grid-cols-3 md:gap-6">
          {steps.map((step, index) => (
            <li key={step.title} className="group">
              {/* The bar draws left to right, one step after another. */}
              <span
                className="block h-0.5 origin-left scale-x-0 bg-primary transition-transform duration-700 ease-out-quart group-data-[visible=true]/steps:scale-x-100"
                style={{ transitionDelay: `${index * STEP_DELAY}ms` }}
                aria-hidden="true"
              />
              <div className="reveal pt-6" style={staggerDelay(index, STEP_DELAY)}>
                <span
                  className="inline-block font-display text-6xl leading-none font-bold text-primary tabular-nums transition-transform duration-300 ease-out-quart group-hover:-translate-y-1"
                  aria-hidden="true"
                >
                  {String(index + 1).padStart(2, '0')}
                </span>
                <h3 className="mt-4 font-display text-2xl font-bold uppercase">{step.title}</h3>
                <p className="mt-2 text-muted">{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
