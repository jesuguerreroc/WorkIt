import { Link } from 'react-router'
import { Logo } from '@/components/ui/Logo'
import { env } from '@/lib/env'
import { landingSections } from './landingSections'

const CURRENT_YEAR = new Date().getFullYear()

const linkClass = 'inline-flex min-h-11 items-center text-muted transition-colors hover:text-fg'

export function PublicFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-3 max-w-xs text-sm text-muted">
            Organiza tus rutinas, registra cada serie y sigue tu progreso.
          </p>
        </div>

        <nav aria-label="Producto">
          <p className="text-sm font-semibold">Producto</p>
          <ul className="mt-2">
            {landingSections.map((item) => (
              <li key={item.href}>
                <a href={item.href} className={linkClass}>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Cuenta">
          <p className="text-sm font-semibold">Cuenta</p>
          <ul className="mt-2">
            <li>
              <Link to="/registro" className={linkClass}>
                Crear cuenta
              </Link>
            </li>
            <li>
              <Link to="/login" className={linkClass}>
                Iniciar sesión
              </Link>
            </li>
            {env.contactEmail && (
              <li>
                <a href={`mailto:${env.contactEmail}`} className={linkClass}>
                  Contacto
                </a>
              </li>
            )}
          </ul>
        </nav>
      </div>

      <div className="border-t border-border">
        <p className="mx-auto max-w-6xl px-4 py-6 text-sm text-subtle sm:px-6">
          © {CURRENT_YEAR} WorkIt. La información de entrenamiento es orientativa y no sustituye el
          consejo de un profesional.
        </p>
      </div>
    </footer>
  )
}
