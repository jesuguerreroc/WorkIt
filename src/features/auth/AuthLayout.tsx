import type { ReactNode } from 'react'
import { Check } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'
import { Alert } from '@/components/ui/Alert'
import { isFirebaseConfigured } from '@/lib/env'

const highlights = [
  'Rutinas a tu medida, sin hojas de cálculo',
  'Peso y repeticiones de cada serie',
  'Rachas y récords basados en tu historial real',
]

interface AuthLayoutProps {
  title: string
  description: string
  children: ReactNode
  footer: ReactNode
}

export function AuthLayout({ title, description, children, footer }: AuthLayoutProps) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
      <div className="flex flex-col px-4 py-6 sm:px-8">
        <header>
          <Logo />
        </header>

        <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">
          <h1 className="font-display text-4xl font-bold tracking-tight uppercase sm:text-5xl">{title}</h1>
          <p className="mt-2 text-muted">{description}</p>

          {!isFirebaseConfigured && (
            <Alert className="mt-6" title="Vista previa">
              Las cuentas todavía no están conectadas. Puedes revisar el formulario, pero aún no se
              creará ni abrirá ninguna sesión.
            </Alert>
          )}

          <div className="mt-8">{children}</div>
          <div className="mt-8 text-center text-sm text-muted">{footer}</div>
        </main>
      </div>

      <aside
        className="relative hidden overflow-hidden border-l border-border bg-surface lg:flex lg:flex-col lg:justify-end lg:p-12"
        aria-label="Qué ofrece WorkIt"
      >
        <div
          className="pointer-events-none absolute -top-32 -right-32 size-[28rem] rounded-full bg-primary/10 blur-3xl"
          aria-hidden="true"
        />
        <p className="relative font-display text-6xl leading-[0.95] font-bold uppercase xl:text-7xl">
          Cada serie
          <br />
          <span className="text-primary">cuenta.</span>
        </p>
        <ul className="relative mt-8 flex flex-col gap-3">
          {highlights.map((item) => (
            <li key={item} className="flex items-center gap-3 text-muted">
              <span className="flex size-6 items-center justify-center rounded-full bg-primary-soft">
                <Check className="size-4 text-primary" aria-hidden="true" />
              </span>
              {item}
            </li>
          ))}
        </ul>
      </aside>
    </div>
  )
}
