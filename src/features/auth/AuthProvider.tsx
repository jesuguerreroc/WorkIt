import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { FirebaseError } from 'firebase/app'
import type { User } from 'firebase/auth'
import {
  consumeRedirectResult,
  getAuthErrorMessage,
  observeAuthState,
  reloadCurrentUser,
} from '@/services/authService'
import type { UserProfile } from '@/types/profile'
import { AuthContext, type AuthContextValue } from './authContext'

function profileErrorMessage(error: unknown): string {
  if (import.meta.env.DEV) console.error('[WorkIt] profile error', error)
  if (error instanceof FirebaseError) {
    if (error.code === 'unavailable') return 'No hay conexión con el servidor. Comprueba tu internet.'
    if (error.code === 'permission-denied') return 'No se pudo acceder a tu perfil por un problema de permisos.'
  }
  return 'No se pudo cargar tu perfil.'
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // undefined = Firebase has not reported the initial session yet.
  const [user, setUser] = useState<User | null | undefined>(undefined)
  // Bumped after reload() so the provider re-renders with the mutated User object.
  const [, setUserVersion] = useState(0)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [profileAttempt, setProfileAttempt] = useState(0)
  const [redirectError, setRedirectError] = useState<string | null>(null)

  useEffect(
    () =>
      observeAuthState((nextUser) => {
        setUser(nextUser)
        setProfile(null)
        setProfileError(null)
      }),
    [],
  )

  useEffect(() => {
    consumeRedirectResult().catch((error) => setRedirectError(getAuthErrorMessage(error)))
  }, [])

  useEffect(() => {
    if (!user) return
    let cancelled = false
    let unsubscribe: (() => void) | undefined
    let creating = false

    // Firestore is loaded on demand: visitors of the public pages never download it.
    import('@/services/profileService')
      .then(({ createProfileIfMissing, subscribeToProfile }) => {
        if (cancelled) return
        unsubscribe = subscribeToProfile(user.uid, {
          onProfile: (next) => {
            setProfile(next)
            setProfileError(null)
          },
          onMissing: () => {
            if (creating) return
            creating = true
            // One automatic retry covers transient failures right after sign-in
            // (e.g. the auth token reaching Firestore a moment late).
            createProfileIfMissing(user)
              .catch(() => new Promise((resolve) => setTimeout(resolve, 1000)).then(() => createProfileIfMissing(user)))
              .catch((error) => setProfileError(profileErrorMessage(error)))
          },
          onError: (error) => setProfileError(profileErrorMessage(error)),
        })
      })
      .catch((error) => !cancelled && setProfileError(profileErrorMessage(error)))

    return () => {
      cancelled = true
      unsubscribe?.()
    }
  }, [user, profileAttempt])

  const retryProfile = useCallback(() => {
    setProfileError(null)
    setProfileAttempt((n) => n + 1)
  }, [])

  const refreshUser = useCallback(async () => {
    await reloadCurrentUser()
    setUserVersion((n) => n + 1)
  }, [])

  // Not memoised on purpose: the provider only re-renders on its own state changes
  // (including the bump after reload()), and consumers must see fresh User fields.
  const value: AuthContextValue = {
    status: user === undefined ? 'loading' : user ? 'signedIn' : 'signedOut',
    user: user ?? null,
    profile,
    profileError,
    redirectError,
    retryProfile,
    refreshUser,
    }

  return <AuthContext value={value}>{children}</AuthContext>
}
