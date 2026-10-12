/**
 * User profile stored at `users/{uid}`. Field names and allowed values are
 * mirrored by `validProfile()` in firestore.rules: change both together.
 */

export const TRAINING_GOALS = ['muscle', 'strength', 'fat_loss', 'maintenance'] as const
export const EXPERIENCE_LEVELS = ['beginner', 'intermediate', 'advanced'] as const
export const WEIGHT_UNITS = ['kg', 'lb'] as const
export const EQUIPMENT = [
  'full_gym',
  'dumbbells',
  'barbell',
  'machines',
  'cables',
  'kettlebells',
  'bands',
  'bodyweight',
] as const
/** ISO weekday: 1 = Monday … 7 = Sunday. */
export const WEEKDAYS = [1, 2, 3, 4, 5, 6, 7] as const
export const ONBOARDING_STATUSES = ['pending', 'completed', 'skipped'] as const

export const PROFILE_SCHEMA_VERSION = 1
export const DISPLAY_NAME_MAX_LENGTH = 40

export type TrainingGoal = (typeof TRAINING_GOALS)[number]
export type ExperienceLevel = (typeof EXPERIENCE_LEVELS)[number]
export type WeightUnit = (typeof WEIGHT_UNITS)[number]
export type Equipment = (typeof EQUIPMENT)[number]
export type Weekday = (typeof WEEKDAYS)[number]
export type OnboardingStatus = (typeof ONBOARDING_STATUSES)[number]

/** Fields the user can edit. */
export interface ProfilePreferences {
  displayName: string
  goal: TrainingGoal | null
  level: ExperienceLevel | null
  trainingDays: Weekday[]
  equipment: Equipment[]
  weightUnit: WeightUnit
}

export interface UserProfile extends ProfilePreferences {
  onboardingStatus: OnboardingStatus
  createdAt: Date | null
  updatedAt: Date | null
  schemaVersion: number
}
