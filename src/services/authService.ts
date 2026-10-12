import { FirebaseError } from 'firebase/app'
import {
  createUserWithEmailAndPassword,
  getRedirectResult,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth'
import { env, isFirebaseConfigured } from '@/lib/env'
import { getFirebase } from '@/lib/firebase'

/**
 * Authentication boundary used by the UI. Every failure surfaces as an Error
 * whose `message` is a user-facing Spanish sentence (see getAuthErrorMessage).
 */

export class AuthUnavailableError extends Error {
  constructor() {
    super('El servicio de cuentas no está configurado todavía. Inténtalo más adelante.')
    this.name = 'AuthUnavailableError'
    // Configuration details are for developers only, never shown in the UI.
    if (import.meta.env.DEV) {
      console.warn(`[WorkIt] Firebase sin configurar. Faltan: ${env.missingFirebaseKeys.join(', ')}. Ver .env.example`)
    }
  }
}

function auth() {
  if (!isFirebaseConfigured) throw new AuthUnavailableError()
  return getFirebase().auth
}

export interface Credentials {
  email: string
  password: string
}

export function observeAuthState(callback: (user: User | null) => void): () => void {
  if (!isFirebaseConfigured) {
    callback(null)
    return () => {}
  }
  return onAuthStateChanged(auth(), callback)
}

export async function signIn({ email, password }: Credentials): Promise<void> {
  await signInWithEmailAndPassword(auth(), email, password)
}

export async function register({ email, password }: Credentials): Promise<void> {
  const { user } = await createUserWithEmailAndPassword(auth(), email, password)
  // Verification is encouraged, not required; a failure here must not undo the signup.
  try {
    await sendEmailVerification(user)
  } catch (error) {
    if (import.meta.env.DEV) console.warn('[WorkIt] No se pudo enviar la verificación', error)
  }
}

/**
 * Google sign-in. Also creates the account on first use, so login and register share it.
 * Uses a popup and falls back to a full-page redirect when popups are blocked.
 * Resolves silently if the user closes the popup.
 */
export async function signInWithGoogle(): Promise<void> {
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({ prompt: 'select_account' })
  try {
    await signInWithPopup(auth(), provider)
  } catch (error) {
    const code = error instanceof FirebaseError ? error.code : ''
    if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') return
    if (code === 'auth/popup-blocked' || code === 'auth/operation-not-supported-in-this-environment') {
      await signInWithRedirect(auth(), provider)
      return
    }
    throw error
  }
}

/** Surfaces an error from a previous redirect sign-in, if any. */
export async function consumeRedirectResult(): Promise<void> {
  if (!isFirebaseConfigured) return
  await getRedirectResult(auth())
}

export async function sendPasswordReset(email: string): Promise<void> {
  try {
    await sendPasswordResetEmail(auth(), email)
  } catch (error) {
    // Never reveal whether an account exists for this email.
    if (error instanceof FirebaseError && error.code === 'auth/user-not-found') return
    throw error
  }
}

export async function resendVerificationEmail(): Promise<void> {
  const user = auth().currentUser
  if (user && !user.emailVerified) await sendEmailVerification(user)
}

/** Refreshes the cached user (e.g. emailVerified after clicking the link). */
export async function reloadCurrentUser(): Promise<User | null> {
  const user = auth().currentUser
  if (!user) return null
  await user.reload()
  return auth().currentUser
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth())
}

const messages: Record<string, string> = {
  'auth/invalid-credential': 'Correo o contraseña incorrectos.',
  'auth/wrong-password': 'Correo o contraseña incorrectos.',
  'auth/user-not-found': 'Correo o contraseña incorrectos.',
  'auth/invalid-email': 'El correo no tiene un formato válido.',
  'auth/email-already-in-use': 'Ya existe una cuenta con ese correo. Inicia sesión o recupera tu contraseña.',
  'auth/weak-password': 'La contraseña es demasiado débil. Usa al menos 8 caracteres con letras y números.',
  'auth/too-many-requests': 'Demasiados intentos seguidos. Espera unos minutos y vuelve a intentarlo.',
  'auth/network-request-failed': 'No hay conexión. Comprueba tu internet y vuelve a intentarlo.',
  'auth/user-disabled': 'Esta cuenta está desactivada.',
  'auth/operation-not-allowed': 'Este método de acceso no está habilitado todavía.',
  'auth/account-exists-with-different-credential':
    'Ya tienes una cuenta con este correo usando otro método. Inicia sesión con tu correo y contraseña.',
  'auth/unauthorized-domain': 'Este dominio no está autorizado para iniciar sesión.',
  'auth/popup-blocked': 'El navegador bloqueó la ventana de Google. Permite las ventanas emergentes e inténtalo de nuevo.',
  'auth/requires-recent-login': 'Por seguridad, vuelve a iniciar sesión y repite la operación.',
}

export function getAuthErrorMessage(error: unknown): string {
  if (error instanceof AuthUnavailableError) return error.message
  if (error instanceof FirebaseError) {
    if (import.meta.env.DEV) console.warn('[WorkIt] auth error', error.code)
    return messages[error.code] ?? 'No se pudo completar la operación. Inténtalo de nuevo.'
  }
  return 'No se pudo completar la operación. Inténtalo de nuevo.'
}
