import type { UserProfile } from '@/types/profile'
import { STRICT, type StreakOptions } from './streaks'

/** Streak rules chosen in the user's profile. */
export function streakOptionsOf(profile: UserProfile | null): StreakOptions {
  if (!profile || profile.streakMode !== 'flexible') return STRICT
  return { mode: 'flexible', plannedDays: profile.trainingDays, allowedMisses: profile.streakAllowedMisses }
}
