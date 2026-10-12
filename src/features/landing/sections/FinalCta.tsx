import { Link } from 'react-router'
import { ArrowRight, Dumbbell } from 'lucide-react'
import { ButtonLink } from '@/components/ui/Button'
import { Reveal } from '@/components/ui/Reveal'

export function FinalCta() {
  return (
    <section aria-labelledby="cta-title" className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal>
          <div className="group relative overflow-hidden rounded-3xl bg-primary px-6 py-14 text-on-primary sm:px-12 sm:py-20">
            <Dumbbell
              className="pointer-events-none absolute -right-10 -bottom-12 size-72 -rotate-12 text-on-primary/10 transition-transform duration-700 ease-out-quart group-hover:-translate-x-4 group-hover:rotate-12 sm:size-96"
              strokeWidth={1.5}
              aria-hidden="true"
            />
            <h2
              id="cta-title"
              className="relative max-w-3xl font-display text-5xl leading-[0.92] font-bold tracking-tight uppercase sm:text-7xl"
            >
              Tu próxima sesión empieza aquí.
            </h2>
            <p className="relative mt-5 max-w-xl text-lg font-medium text-on-primary/80">
              Crea tu cuenta gratis, monta tu primera rutina y registra tu primer entrenamiento.
            </p>
            <div className="relative mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink
                to="/registro"
                size="lg"
                variant="inverse"
                className="group/cta focus-visible:outline-on-primary"
              >
                Comenzar gratis
                <ArrowRight
                  className="size-5 transition-transform duration-200 group-hover/cta:translate-x-1"
                  aria-hidden="true"
                />
              </ButtonLink>
              <Link
                to="/login"
                className="inline-flex min-h-13 items-center justify-center rounded-xl px-6 font-semibold underline-offset-4 hover:underline focus-visible:outline-on-primary"
              >
                Ya tengo cuenta
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
