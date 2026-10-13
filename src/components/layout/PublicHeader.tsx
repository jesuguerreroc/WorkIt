import { useEffect, useState } from 'react'
import { Menu, X } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'
import { ButtonLink } from '@/components/ui/Button'
import { useAuth } from '@/features/auth/authContext'
import { cn } from '@/lib/cn'
import { landingSections } from './landingSections'

export function PublicHeader() {
  const signedIn = useAuth().status === 'signedIn'
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false)
    const onResize = () => window.matchMedia('(min-width: 768px)').matches && setOpen(false)
    window.addEventListener('keydown', onKey)
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('resize', onResize)
    }
  }, [open])

  return (
    <header
      className={cn(
        'sticky top-0 z-40 border-b pt-[env(safe-area-inset-top)] transition-colors duration-200',
        scrolled || open ? 'glass border-border' : 'border-transparent',
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />

        <nav aria-label="Secciones" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {landingSections.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className="relative inline-flex min-h-11 items-center rounded-lg px-3 text-[0.9375rem] font-medium text-muted transition-colors after:absolute after:inset-x-3 after:bottom-2 after:h-0.5 after:origin-left after:scale-x-0 after:rounded-full after:bg-primary after:transition-transform after:duration-300 after:ease-out-quart hover:text-fg hover:after:scale-x-100"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {signedIn ? (
            <ButtonLink to="/app">Ir a mi panel</ButtonLink>
          ) : (
            <>
              <ButtonLink to="/login" variant="ghost">
                Iniciar sesión
              </ButtonLink>
              <ButtonLink to="/registro">Comenzar gratis</ButtonLink>
            </>
          )}
        </div>

        <button
          type="button"
          className="-mr-2 flex size-11 items-center justify-center rounded-lg text-fg md:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X className="size-6" aria-hidden="true" /> : <Menu className="size-6" aria-hidden="true" />}
        </button>
      </div>

      <div id="mobile-menu" hidden={!open} className="border-t border-border px-4 pt-2 pb-6 md:hidden">
        <nav aria-label="Secciones">
          <ul className="flex flex-col">
            {landingSections.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex min-h-12 items-center border-b border-border text-lg font-medium"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="mt-6 grid gap-3">
          {signedIn ? (
            <ButtonLink to="/app" size="lg">
              Ir a mi panel
            </ButtonLink>
          ) : (
            <>
              <ButtonLink to="/registro" size="lg">
                Comenzar gratis
              </ButtonLink>
              <ButtonLink to="/login" variant="secondary" size="lg">
                Iniciar sesión
              </ButtonLink>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
