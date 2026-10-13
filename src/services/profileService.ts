import {
  doc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  updateDoc,
  type DocumentSnapshot,
  type FirestoreError,
  type Unsubscribe,
} from 'firebase/firestore'
import type { User } from 'firebase/auth'
import { getDb } from '@/lib/firestore'
import {
  DISPLAY_NAME_MAX_LENGTH,
  PROFILE_SCHEMA_VERSION,
  type OnboardingStatus,
  type ProfilePreferences,
  type UserProfile,
} from '@/types/profile'

function profileRef(uid: string) {
  return doc(getDb(), 'users', uid)
}

function toProfile(snapshot: DocumentSnapshot): UserProfile {
  // 'estimate' fills pending server timestamps with the local clock instead of null.
  const data = snapshot.data({ serverTimestamps: 'estimate' }) ?? {}
  return {
    displayName: data.displayName ?? '',
    goal: data.goal ?? null,
    level: data.level ?? null,
    trainingDays: data.trainingDays ?? [],
    equipment: data.equipment ?? [],
    weightUnit: data.weightUnit ?? 'kg',
    streakMode: data.streakMode ?? 'strict',
    streakAllowedMisses: data.streakAllowedMisses ?? 1,
    onboardingStatus: data.onboardingStatus ?? 'pending',
    createdAt: data.createdAt?.toDate?.() ?? null,
    updatedAt: data.updatedAt?.toDate?.() ?? null,
    schemaVersion: data.schemaVersion ?? PROFILE_SCHEMA_VERSION,
  }
}

/**
 * Creates `users/{uid}` with defaults if it does not exist yet. The transaction
 * makes concurrent first logins (two tabs) safe: only one create wins.
 */
export async function createProfileIfMissing(user: User): Promise<void> {
  const ref = profileRef(user.uid)
  await runTransaction(getDb(), async (transaction) => {
    const existing = await transaction.get(ref)
    if (existing.exists()) return
    transaction.set(ref, {
      // Google accounts bring a name; email accounts start empty and fill it in onboarding.
      displayName: (user.displayName ?? '').trim().slice(0, DISPLAY_NAME_MAX_LENGTH),
      goal: null,
      level: null,
      trainingDays: [],
      equipment: [],
      weightUnit: 'kg',
      streakMode: 'strict',
      streakAllowedMisses: 1,
      onboardingStatus: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      schemaVersion: PROFILE_SCHEMA_VERSION,
    })
  })
}

interface ProfileSubscription {
  onProfile: (profile: UserProfile) => void
  /** Called when the document does not exist on the server (not when it is merely uncached). */
  onMissing: () => void
  onError: (error: FirestoreError) => void
}

export function subscribeToProfile(uid: string, handlers: ProfileSubscription): Unsubscribe {
  return onSnapshot(
    profileRef(uid),
    (snapshot) => {
      if (snapshot.exists()) handlers.onProfile(toProfile(snapshot))
      else if (!snapshot.metadata.fromCache) handlers.onMissing()
    },
    handlers.onError,
  )
}

export async function saveProfilePreferences(
  uid: string,
  preferences: ProfilePreferences,
  onboardingStatus?: OnboardingStatus,
): Promise<void> {
  await updateDoc(profileRef(uid), {
    displayName: preferences.displayName.trim().slice(0, DISPLAY_NAME_MAX_LENGTH),
    goal: preferences.goal,
    level: preferences.level,
    // Sorted and de-duplicated so the stored value is canonical.
    trainingDays: [...new Set(preferences.trainingDays)].sort((a, b) => a - b),
    equipment: [...new Set(preferences.equipment)],
    weightUnit: preferences.weightUnit,
    streakMode: preferences.streakMode,
    streakAllowedMisses: preferences.streakAllowedMisses,
    ...(onboardingStatus ? { onboardingStatus } : {}),
    updatedAt: serverTimestamp(),
  })
}

export async function skipOnboarding(uid: string): Promise<void> {
  await updateDoc(profileRef(uid), { onboardingStatus: 'skipped', updatedAt: serverTimestamp() })
}
