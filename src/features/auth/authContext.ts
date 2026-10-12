import { createContext, useContext } from 'react'
import type { User } from 'firebase/auth'
import type { UserProfile } from '@/types/profile'

export type AuthStatus = 'loading' | 'signedOut' | 'signedIn'

export interface AuthContextValue {
  status: AuthStatus
  user: User | null
  /** null while loading, or if it could not be loaded (see profileError). */
  profile: UserProfile | null
  profileError: string | null
  /** Error left by a Google redirect sign-in, shown on the auth screens. */
  redirectError: string | null
  retryProfile: () => void
  /** Reloads the Firebase user (e.g. after verifying the email) and re-renders. */
  refreshUser: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside <AuthProvider>')
  return value
}
