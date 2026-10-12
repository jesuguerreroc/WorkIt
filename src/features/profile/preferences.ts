import type { ProfilePreferences, UserProfile } from '@/types/profile'

/** Editable subset of a stored profile. */
export function preferencesOf(profile: UserProfile): ProfilePreferences {
  return {
    displayName: profile.displayName,
    goal: profile.goal,
    level: profile.level,
    trainingDays: profile.trainingDays,
    equipment: profile.equipment,
    weightUnit: profile.weightUnit,
  }
}
