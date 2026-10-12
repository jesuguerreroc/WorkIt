import { initializeApp, type FirebaseApp } from 'firebase/app'
import { connectAuthEmulator, getAuth, type Auth } from 'firebase/auth'
import { env, getFirebaseWebConfig } from './env'

/**
 * Single place where Firebase is initialised. Auth lives here because every
 * page needs the session state; Firestore lives in ./firestore so it is only
 * downloaded once someone is signed in (keeps the public landing light).
 */

interface FirebaseServices {
  app: FirebaseApp
  auth: Auth
}

let services: FirebaseServices | undefined

export function getFirebase(): FirebaseServices {
  if (services) return services

  const app = initializeApp(getFirebaseWebConfig())
  const auth = getAuth(app)
  auth.languageCode = 'es'
  if (env.useFirebaseEmulators) connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })

  services = { app, auth }
  return services
}
