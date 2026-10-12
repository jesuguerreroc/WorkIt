import { Navigate, Outlet, useLocation, type Location } from 'react-router'
import { Button } from '@/components/ui/Button'
import { FullScreenStatus } from '@/components/ui/FullScreenStatus'
import { useAuth } from '@/features/auth/authContext'
import { signOut } from '@/services/authService'

export const ONBOARDING_PATH = '/app/bienvenida'

/**
 * Gate for the private area. Waits for the session and the profile, sends
 * visitors to /login (remembering where they were going) and new accounts to onboarding.
 */
export function RequireAuth() {
  const { status, profile, profileError, retryProfile } = useAuth()
  const location = useLocation()

  if (status === 'loading') return <FullScreenStatus variant="loading" title="Cargando tu sesión…" />
  if (status === 'signedOut') return <Navigate to="/login" replace state={{ from: location }} />

  if (profileError) {
    return (
      <FullScreenStatus variant="error" title="No pudimos cargar tu cuenta">
        <p>{profileError}</p>
        <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
          <Button onClick={retryProfile}>Reintentar</Button>
          <Button variant="secondary" onClick={() => void signOut()}>
            Cerrar sesión
          </Button>
        </div>
      </FullScreenStatus>
    )
  }
  if (!profile) return <FullScreenStatus variant="loading" title="Preparando tu perfil…" />

  const onOnboarding = location.pathname === ONBOARDING_PATH
  if (profile.onboardingStatus === 'pending' && !onOnboarding) return <Navigate to={ONBOARDING_PATH} replace />
  if (profile.onboardingStatus !== 'pending' && onOnboarding) return <Navigate to="/app" replace />

  return <Outlet />
}

/** Auth screens: once signed in, continue to the page the user originally asked for. */
export function PublicOnly() {
  const { status } = useAuth()
  const location = useLocation()

  if (status === 'signedIn') {
    const from = (location.state as { from?: Location } | null)?.from
    const target = from && from.pathname.startsWith('/app') ? `${from.pathname}${from.search}` : '/app'
    return <Navigate to={target} replace />
  }
  // While the session is still resolving, show the form: it reacts as soon as status changes.
  return <Outlet />
}
