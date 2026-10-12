import { useState } from 'react'
import { CircleCheck, LogOut, MailWarning } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/features/auth/authContext'
import { getAuthErrorMessage, resendVerificationEmail, signOut } from '@/services/authService'
import { saveProfilePreferences } from '@/services/profileService'
import { preferencesOf } from './preferences'
import { ProfileForm } from './ProfileForm'

export function ProfilePage() {
  const { user, profile } = useAuth()
  if (!user || !profile) return null

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-10">
      <h1 className="font-display text-4xl font-bold uppercase">Perfil</h1>

      <AccountSection />

      <section aria-labelledby="preferences-title" className="flex flex-col gap-6">
        <div>
          <h2 id="preferences-title" className="font-display text-2xl font-bold uppercase">
            Preferencias de entrenamiento
          </h2>
          <p className="mt-1 text-sm text-muted">Todos los campos son opcionales.</p>
        </div>
        <ProfileForm
          initial={preferencesOf(profile)}
          submitLabel="Guardar cambios"
          successMessage="Cambios guardados."
          requireChanges
          onSubmit={(preferences) => saveProfilePreferences(user.uid, preferences)}
        />
      </section>
    </div>
  )
}

function AccountSection() {
  const { user, refreshUser } = useAuth()
  const [status, setStatus] = useState<{ tone: 'success' | 'error' | 'info'; message: string }>()
  const [busy, setBusy] = useState<'resend' | 'check' | 'signout' | null>(null)
  if (!user) return null

  const usesPassword = user.providerData.some((provider) => provider.providerId === 'password')
  const providers = user.providerData.map((p) => (p.providerId === 'google.com' ? 'Google' : 'correo y contraseña'))

  const run = async (action: 'resend' | 'check' | 'signout', task: () => Promise<void>) => {
    setBusy(action)
    setStatus(undefined)
    try {
      await task()
    } catch (error) {
      setStatus({ tone: 'error', message: getAuthErrorMessage(error) })
    } finally {
      setBusy(null)
    }
  }

  return (
    <section aria-labelledby="account-title" className="rounded-3xl border border-border bg-surface p-5 sm:p-6">
      <h2 id="account-title" className="font-display text-2xl font-bold uppercase">
        Cuenta
      </h2>
      <dl className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-sm text-muted">Correo</dt>
          <dd className="mt-0.5 font-medium break-all">{user.email}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted">Acceso con</dt>
          <dd className="mt-0.5 font-medium first-letter:uppercase">{[...new Set(providers)].join(' y ')}</dd>
        </div>
      </dl>

      {usesPassword && (
        <div className="mt-5 flex flex-col gap-3 border-t border-border pt-5">
          {user.emailVerified ? (
            <p className="flex items-center gap-2 text-sm">
              <CircleCheck className="size-5 text-primary" aria-hidden="true" />
              Correo verificado
            </p>
          ) : (
            <>
              <p className="flex items-start gap-2 text-sm">
                <MailWarning className="mt-0.5 size-5 shrink-0 text-warning" aria-hidden="true" />
                Tu correo aún no está verificado. Revisa tu bandeja de entrada (y la de spam).
              </p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  variant="secondary"
                  loading={busy === 'resend'}
                  disabled={busy !== null}
                  onClick={() =>
                    run('resend', async () => {
                      await resendVerificationEmail()
                      setStatus({ tone: 'success', message: 'Te hemos enviado un nuevo correo de verificación.' })
                    })
                  }
                >
                  Reenviar correo
                </Button>
                <Button
                  variant="ghost"
                  loading={busy === 'check'}
                  disabled={busy !== null}
                  onClick={() =>
                    run('check', async () => {
                      await refreshUser()
                      setStatus({ tone: 'info', message: 'Estado de verificación actualizado.' })
                    })
                  }
                >
                  Ya lo verifiqué
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      {status && (
        <Alert tone={status.tone} className="mt-4">
          {status.message}
        </Alert>
      )}

      <div className="mt-5 border-t border-border pt-5">
        <Button
          variant="secondary"
          loading={busy === 'signout'}
          disabled={busy !== null}
          onClick={() => run('signout', signOut)}
        >
          <LogOut className="size-4" aria-hidden="true" />
          Cerrar sesión
        </Button>
      </div>
    </section>
  )
}
