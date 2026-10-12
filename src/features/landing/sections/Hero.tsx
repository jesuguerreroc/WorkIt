import { ArrowRight } from 'lucide-react'
import { ButtonLink } from '@/components/ui/Button'
import { buttonClasses } from '@/components/ui/buttonStyles'
import { Tilt } from '@/components/ui/Tilt'
import { WorkoutMockup } from '../mockups/WorkoutMockup'
import { StreakMockup } from '../mockups/StreakMockup'

export function Hero() {
  return (
    <section aria-labelledby="hero-title" className="relative overflow-hidden">
      {/* Single soft glow behind the product shots; no other gradients on the page. */}
      <div
        className="pointer-events-none absolute top-24 right-[-10%] size-[36rem] rounded-full bg-primary/10 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-4 pt-10 pb-20 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:pt-16 lg:pb-28">
        <div className="motion-safe:animate-rise">
          <p className="inline-flex items-center gap-2 rounded-full border border-border-strong px-3 py-1 text-sm font-medium text-muted">
            <span className="relative flex size-1.5" aria-hidden="true">
              <span className="absolute inline-flex size-full rounded-full bg-primary opacity-75 motion-safe:animate-ping" />
              <span className="relative inline-flex size-1.5 rounded-full bg-primary" />
            </span>
            Entrenamiento de fuerza, sin complicaciones
          </p>

          <h1
            id="hero-title"
            className="mt-6 font-display text-[3.25rem] leading-[0.92] font-bold tracking-tight uppercase sm:text-7xl lg:text-[5.5rem]"
          >
            Entrena con intención.
            <br />
            <span className="text-primary">Progresa de verdad.</span>
          </h1>

          <p className="mt-6 max-w-lg text-lg text-muted sm:text-xl">
            Organiza tus rutinas, registra cada repetición y convierte la constancia en resultados.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ButtonLink to="/registro" size="lg" className="group">
              Comenzar gratis
              <ArrowRight
                className="size-5 transition-transform duration-200 group-hover:translate-x-1"
                aria-hidden="true"
              />
            </ButtonLink>
            <a href="#funciones" className={buttonClasses('secondary', 'lg')}>
              Descubrir WorkIt
            </a>
          </div>
        </div>

        {/* Phones follow the pointer (Tilt) and spread apart on hover. */}
        <Tilt className="relative mx-auto h-[37rem] w-full max-w-md lg:max-w-[32rem]" surfaceClassName="relative">
          <div className="parallax-far absolute top-14 left-0 hidden sm:block">
            <div className="-rotate-6 opacity-90 transition-[translate,rotate,opacity] duration-500 ease-out-quart group-hover/tilt:-translate-x-6 group-hover/tilt:-rotate-[9deg] group-hover/tilt:opacity-100">
              <div className="motion-safe:animate-float [animation-delay:-3s]">
                <StreakMockup />
              </div>
            </div>
          </div>

          <div className="parallax-near absolute inset-x-0 top-0 flex justify-center sm:right-0 sm:left-auto">
            <div className="transition-[translate,rotate] duration-500 ease-out-quart sm:rotate-3 sm:group-hover/tilt:translate-x-4 sm:group-hover/tilt:rotate-6">
              <div className="motion-safe:animate-float">
                <WorkoutMockup />
              </div>
            </div>
          </div>
        </Tilt>
      </div>
    </section>
  )
}
