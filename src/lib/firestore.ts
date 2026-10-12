import { connectFirestoreEmulator, getFirestore, type Firestore } from 'firebase/firestore'
import { env } from './env'
import { getFirebase } from './firebase'

/**
 * Firestore instance. Imported only by data services, which are loaded
 * lazily, so the SDK never ships with the public pages.
 *
 * Uses the default in-memory cache for now: a persistent offline cache needs
 * per-account cleanup on sign-out and is planned with the PWA work.
 */

let db: Firestore | undefined

export function getDb(): Firestore {
  if (db) return db
  db = getFirestore(getFirebase().app)
  if (env.useFirebaseEmulators) connectFirestoreEmulator(db, '127.0.0.1', 8080)
  return db
}
