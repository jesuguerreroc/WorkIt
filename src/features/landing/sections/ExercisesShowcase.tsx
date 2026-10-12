import { Check } from 'lucide-react'
import { Reveal } from '@/components/ui/Reveal'
import { Tilt } from '@/components/ui/Tilt'
import { useInView } from '@/hooks/useInView'
import { staggerDelay } from '@/lib/motion'
import { LibraryMockup } from '../mockups/LibraryMockup'
import { SectionHeading } from './SectionHeading'

const muscleGroups = [
  'Pecho',
  'Espalda',
  'Hombros',
  'Bíceps',
  'Tríceps',
  'Antebrazos',
  'Cuádriceps',
  'Isquiotibiales',
  'Glúteos',
  'Pantorrillas',
  'Abdominales',
]

const points = [
  'Búsqueda por nombre y filtros por músculo, equipamiento y tipo de ejercicio.',
  'Fichas con músculos principales y secundarios, equipamiento e instrucciones.',
  'Tus propios ejercicios, con foto opcional, disponibles en rutinas e historial.',
]

export function ExercisesShowcase() {
  const [listRef, inView] = useInView<HTMLUListElement>()

  return (
    <section id="ejercicios" aria-labelledby="ejercicios-title" className="py-20 sm:py-28">
      <div className="mx-auto grid max-w-6xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-2">
        <div>
          <SectionHeading id="ejercicios-title" eyebrow="Ejercicios" title="Encuentra el ejercicio y sabe cómo hacerlo.">
            Una biblioteca organizada por grupos musculares para montar tus rutinas sin buscar fuera de la app.
          </SectionHeading>

          <ul ref={listRef} data-visible={inView} className="mt-8 flex flex-col gap-3">
            {points.map((point, index) => (
              <li key={point} className="reveal flex gap-3" style={staggerDelay(index, 120)}>
                <Check className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
                <span>{point}</span>
              </li>
            ))}
          </ul>

          <div className="mt-8">
            <p className="text-sm font-semibold text-muted">Grupos musculares</p>
            <p className="mt-2 leading-relaxed text-fg">{muscleGroups.join(' · ')}</p>
          </div>
        </div>

        <Reveal className="flex justify-center lg:justify-end" delay={150}>
          <Tilt>
            <div className="parallax-near">
              <LibraryMockup />
            </div>
          </Tilt>
        </Reveal>
      </div>
    </section>
  )
}
