import { useState } from 'react'
import { NavLink, Outlet } from 'react-router'
import { ChartLine, Dumbbell, House, ListChecks, LogOut, UserRound, type LucideIcon } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'
import { useAuth } from '@/features/auth/authContext'
import { cn } from '@/lib/cn'
import { signOut } from '@/services/authService'

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
}

// Max five destinations so the mobile bottom bar stays usable.
const navItems: NavItem[] = [
  { to: '/app', label: 'Inicio', icon: House, end: true },
  { to: '/app/rutinas', label: 'Rutinas', icon: ListChecks },
  { to: '/app/ejercicios', label: 'Ejercicios', icon: Dumbbell },
  { to: '/app/progreso', label: 'Progreso', icon: ChartLine },
  { to: '/app/perfil', label: 'Perfil', icon: UserRound },
]

/** Current account and sign-out, pinned to the bottom of the desktop rail. */
function SidebarAccount() {
  const { user, profile } = useAuth()
  const [signingOut, setSigningOut] = useState(false)

  const handleSignOut = async () => {
    setSigningOut(true)
    try {
      await signOut()
    } catch {
      setSigningOut(false)
    }
  }

  return (
    <div className="mt-auto flex flex-col gap-2 border-t border-border pt-4">
      <div className="min-w-0 px-3">
        <p className="truncate font-semibold">{profile?.displayName.trim() || 'Tu cuenta'}</p>
        <p className="truncate text-sm text-muted">{user?.email}</p>
      </div>
      <button
        type="button"
        onClick={handleSignOut}
        disabled={signingOut}
        className="flex min-h-11 items-center gap-3 rounded-xl px-3 font-medium text-muted transition-colors hover:bg-surface-2 hover:text-fg disabled:opacity-50"
      >
        <LogOut className="size-5" aria-hidden="true" />
        {signingOut ? 'Cerrando sesión…' : 'Cerrar sesión'}
      </button>
    </div>
  )
}

/**
 * Authenticated layout: side rail on desktop (lg+), bottom tab bar on mobile.
 */
export function AppShell() {
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[16rem_1fr]">
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-border glass px-4 py-6 lg:flex">
        <Logo to="/app" className="px-2" />
        <nav aria-label="Principal" className="mt-10">
          <ul className="flex flex-col gap-1">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    cn(
                      'flex min-h-11 items-center gap-3 rounded-xl px-3 font-medium transition-colors',
                      isActive ? 'bg-primary-soft text-primary' : 'text-muted hover:bg-surface-2 hover:text-fg',
                    )
                  }
                >
                  <item.icon className="size-5" aria-hidden="true" />
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <SidebarAccount />
      </aside>

      <div className="flex min-h-dvh flex-col">
        <header className="sticky top-0 z-30 flex items-center glass border-b border-border px-4 pt-[env(safe-area-inset-top)] lg:hidden">
          <div className="flex h-12 items-center">
            <Logo to="/app" />
          </div>
        </header>
        {/* Bottom padding keeps content clear of the fixed tab bar and the home indicator. */}
        <main className="flex-1 px-4 pt-4 pb-[calc(4.25rem+env(safe-area-inset-bottom))] sm:px-6 lg:px-10 lg:pt-10 lg:pb-10">
          <Outlet />
        </main>
      </div>

      <nav
        aria-label="Principal"
        className="fixed inset-x-0 bottom-0 z-40 glass-strong border-t border-border pb-[max(0.25rem,calc(env(safe-area-inset-bottom)-0.75rem))] backdrop-blur-md lg:hidden"
      >
        <ul className="grid grid-cols-5">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'flex min-h-[3.25rem] flex-col items-center justify-center gap-0.5 text-[0.65rem] font-semibold transition-colors',
                    isActive ? 'text-primary' : 'text-muted hover:text-fg',
                  )
                }
              >
                <item.icon className="size-[1.375rem]" aria-hidden="true" />
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
