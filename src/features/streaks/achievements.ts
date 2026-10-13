import type { Workout } from '@/types/workout'
import { isValidWorkout } from '@/features/workouts/workoutMath'
import { firstDayReachingStreak, type StreakInfo } from './streaks'

/**
 * Achievements are derived from the workout history every time (never stored),
 * so they can never drift from the real data — deleting a session updates them.
 */

export interface Achievement {
  id: string
  title: string
  description: string
  kind: 'streak' | 'sessions'
  target: number
  /** Day it was earned ("YYYY-MM-DD"), or null if not yet. */
  achievedOn: string | null
  progress: number
}

export const STREAK_MILESTONES = [3, 7, 14, 30] as const
export const SESSION_MILESTONES = [1, 10, 25, 50, 100] as const

/** Completed sessions with real activity, oldest first. */
export function countedWorkouts(workouts: Workout[]): Workout[] {
  return workouts
    .filter((w) => w.status === 'completed' && isValidWorkout(w))
    .sort((a, b) => a.localDate.localeCompare(b.localDate) || a.startedAt - b.startedAt)
}

export function computeAchievements(workouts: Workout[], streak: StreakInfo): Achievement[] {
  const counted = countedWorkouts(workouts)

  const streaks: Achievement[] = STREAK_MILESTONES.map((target) => ({
    id: `streak-${target}`,
    title: `Racha de ${target} días`,
    description: `Entrena ${target} días seguidos.`,
    kind: 'streak',
    target,
    achievedOn: firstDayReachingStreak(streak, target),
    progress: Math.min(1, streak.best / target),
  }))

  const sessions: Achievement[] = SESSION_MILESTONES.map((target) => ({
    id: `sessions-${target}`,
    title: target === 1 ? 'Primer entrenamiento' : `${target} entrenamientos`,
    description: target === 1 ? 'Completa tu primera sesión.' : `Completa ${target} sesiones.`,
    kind: 'sessions',
    target,
    achievedOn: counted[target - 1]?.localDate ?? null,
    progress: Math.min(1, counted.length / target),
  }))

  return [...sessions, ...streaks]
}
