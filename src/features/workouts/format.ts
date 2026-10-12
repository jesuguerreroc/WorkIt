import { formatShortDate } from '@/lib/dates'
import type { WeightUnit } from '@/types/profile'
import type { Workout } from '@/types/workout'
import { fromKg } from './workoutMath'

export function formatVolume(kg: number, unit: WeightUnit): string {
  return `${new Intl.NumberFormat('es', { maximumFractionDigits: 0 }).format(fromKg(kg, unit))} ${unit}`
}

export function workoutTitle(workout: Workout): string {
  return `${workout.routineName} · ${formatShortDate(workout.localDate)}`
}
