import { ButtonLink } from '@/components/ui/Button'
import { Logo } from '@/components/ui/Logo'

export function NotFoundPage() {
  return <StatusScreen code="404" title="Página no encontrada" text="La dirección no existe o se ha movido." />
}

interface StatusScreenProps {
  code: string
  title: string
  text: string
}

export function StatusScreen({ code, title, text }: StatusScreenProps) {
  return (
    <div className="flex min-h-dvh flex-col px-4 pt-[calc(1.5rem+env(safe-area-inset-top))] pb-6 sm:px-8">
      <Logo />
      <main className="flex flex-1 flex-col items-center justify-center text-center">
        <p className="font-display text-8xl font-bold text-primary">{code}</p>
        <h1 className="mt-2 font-display text-3xl font-bold uppercase">{title}</h1>
        <p className="mt-2 max-w-sm text-muted">{text}</p>
        <ButtonLink to="/" className="mt-8">
          Volver al inicio
        </ButtonLink>
      </main>
    </div>
  )
}
