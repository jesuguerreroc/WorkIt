import { PublicHeader } from '@/components/layout/PublicHeader'
import { PublicFooter } from '@/components/layout/PublicFooter'
import { Hero } from './sections/Hero'
import { Features } from './sections/Features'
import { HowItWorks } from './sections/HowItWorks'
import { ExercisesShowcase } from './sections/ExercisesShowcase'
import { ProgressPreview } from './sections/ProgressPreview'
import { FinalCta } from './sections/FinalCta'

export function LandingPage() {
  return (
    <>
      <a
        href="#contenido"
        className="sr-only z-50 rounded-lg bg-primary px-4 py-3 font-semibold text-on-primary focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Saltar al contenido
      </a>
      <PublicHeader />
      <main id="contenido">
        <Hero />
        <Features />
        <HowItWorks />
        <ExercisesShowcase />
        <ProgressPreview />
        <FinalCta />
      </main>
      <PublicFooter />
    </>
  )
}
