import { useState } from 'react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Logo } from '@/components/ui/Logo'
import { useAuth } from '@/features/auth/authContext'
import { saveProfilePreferences, skipOnboarding } from '@/services/profileService'
import { preferencesOf } from './preferences'
import { ProfileForm } from './ProfileForm'

/**
 * First-run setup. Optional by design: "Omitir por ahora" goes straight to the app.
 * Leaving is handled by RequireAuth once onboardingStatus stops being "pending".
 */
export function OnboardingPage() {
  const { user, profile } = useAuth()
  const [skipping, setSkipping] = useState(false)
  const [skipError, setSkipError] = useState<string>()

  if (!user || !profile) return null

  const skip = async () => {
    setSkipping(true)
    setSkipError(undefined)
    try {
      await skipOnboarding(user.uid)
    } catch {
      setSkipError('No se pudo continuar. Revisa tu conexión e inténtalo de nuevo.')
      setSkipping(false)
    }
  }

  return (
    <div className="min-h-dvh pt-[env(safe-area-inset-top)]">
      <header className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
        <Logo to="/app" />
        <Button variant="ghost" onClick={skip} loading={skipping}>
          Omitir por ahora
        </Button>
      </header>

      <main className="mx-auto max-w-3xl px-4 pt-6 pb-16 sm:px-6">
        <p className="text-sm font-semibold tracking-widest text-primary uppercase">Bienvenida</p>
        <h1 className="mt-2 font-display text-4xl leading-[0.95] font-bold uppercase sm:text-5xl">
          Configura tu entrenamiento
        </h1>
        <p className="mt-3 max-w-xl text-muted">
          Todo es opcional y podrás cambiarlo cuando quieras desde tu perfil.
        </p>

        {skipError && (
          <Alert tone="error" className="mt-6">
            {skipError}
          </Alert>
        )}

        <div className="mt-10">
          <ProfileForm
            initial={preferencesOf(profile)}
            submitLabel="Guardar y empezar"
            onSubmit={(preferences) => saveProfilePreferences(user.uid, preferences, 'completed')}
          />
        </div>
      </main>
    </div>
  )
}
