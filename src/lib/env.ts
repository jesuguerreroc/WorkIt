/**
 * Typed access to public (VITE_*) environment variables.
 * Only browser-safe values belong here: these are bundled into the client.
 */

const firebaseKeys = {
  apiKey: 'VITE_FIREBASE_API_KEY',
  authDomain: 'VITE_FIREBASE_AUTH_DOMAIN',
  projectId: 'VITE_FIREBASE_PROJECT_ID',
  storageBucket: 'VITE_FIREBASE_STORAGE_BUCKET',
  messagingSenderId: 'VITE_FIREBASE_MESSAGING_SENDER_ID',
  appId: 'VITE_FIREBASE_APP_ID',
} as const

type FirebaseWebConfig = Record<keyof typeof firebaseKeys, string>

function read(key: string): string | undefined {
  const value = (import.meta.env as Record<string, string | undefined>)[key]
  return value && value.trim() !== '' ? value.trim() : undefined
}

const firebaseConfig = Object.fromEntries(
  Object.entries(firebaseKeys).map(([field, key]) => [field, read(key)]),
) as Partial<FirebaseWebConfig>

export const env = {
  /** Optional public contact address shown in the footer. */
  contactEmail: read('VITE_CONTACT_EMAIL'),
  /** Firebase web variables that are still missing. Empty when fully configured. */
  missingFirebaseKeys: Object.entries(firebaseKeys)
    .filter(([field]) => !firebaseConfig[field as keyof FirebaseWebConfig])
    .map(([, key]) => key),
  /** Connect to the local Auth/Firestore emulators instead of the real project. */
  useFirebaseEmulators: read('VITE_USE_FIREBASE_EMULATORS') === 'true',
}

export const isFirebaseConfigured = env.missingFirebaseKeys.length === 0

/** The Firebase web config. Only call after checking `isFirebaseConfigured`. */
export function getFirebaseWebConfig(): FirebaseWebConfig {
  if (!isFirebaseConfigured) throw new Error(`Missing Firebase env: ${env.missingFirebaseKeys.join(', ')}`)
  return firebaseConfig as FirebaseWebConfig
}
