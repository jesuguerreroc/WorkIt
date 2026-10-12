import { Dumbbell, Flame, Library, ListChecks, Trophy, type LucideIcon } from 'lucide-react'
import { staggerDelay } from '@/lib/motion'
import { useInView } from '@/hooks/useInView'
import { cn } from '@/lib/cn'
import { SectionHeading } from './SectionHeading'

interface Feature {
  icon: LucideIcon
  title: string
  text: string
  wide?: boolean
}

const features: Feature[] = [
  {
    icon: ListChecks,
    title: 'Rutinas personalizadas',
    text: 'Crea tantas rutinas como necesites: elige los días, el orden de los ejercicios, las series, el rango de repeticiones y el descanso.',
    wide: true,
  },
  {
    icon: Library,
    title: 'Biblioteca de ejercicios',
    text: 'Busca por músculo o equipamiento y añade también tus propios ejercicios.',
  },
  {
    icon: Dumbbell,
    title: 'Peso y repeticiones',
    text: 'Registra cada serie en segundos y consulta lo que levantaste la última vez.',
  },
  {
    icon: Flame,
    title: 'Rachas de entrenamiento',
    text: 'Días consecutivos y tu mejor racha, calculados a partir de sesiones completadas de verdad.',
  },
  {
    icon: Trophy,
    title: 'Estadísticas y récords',
    text: 'Evolución de cargas, volumen semanal y récords personales con tus propios datos.',
  },
]

export function Features() {
  const [listRef, inView] = useInView<HTMLUListElement>()

  return (
    <section id="funciones" aria-labelledby="funciones-title" className="border-t border-border py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          id="funciones-title"
          eyebrow="Funciones"
          title="Todo lo que necesitas en el gimnasio. Nada que estorbe."
        />

        <ul ref={listRef} data-visible={inView} className="mt-12 grid gap-4 md:grid-cols-3">
          {features.map(({ icon: Icon, title, text, wide }, index) => (
            <li key={title} className={cn('reveal', wide && 'md:col-span-2')} style={staggerDelay(index)}>
              <div className="group flex h-full flex-col rounded-3xl border border-border bg-surface p-6 transition-[translate,border-color,background-color] duration-300 ease-out-quart hover:-translate-y-1 hover:border-primary/40 hover:bg-surface-2 sm:p-8">
                <span className="flex size-12 items-center justify-center rounded-2xl bg-primary-soft transition-[background-color,rotate,scale] duration-300 ease-out-quart group-hover:scale-110 group-hover:-rotate-6 group-hover:bg-primary">
                  <Icon
                    className="size-6 text-primary transition-colors duration-300 group-hover:text-on-primary"
                    aria-hidden="true"
                  />
                </span>
                <h3 className="mt-6 font-display text-2xl font-bold uppercase">{title}</h3>
                <p className="mt-2 max-w-md text-muted">{text}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
