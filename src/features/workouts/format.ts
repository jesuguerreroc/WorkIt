import { formatShortDate } from '@/lib/dates'
import { formatNumber } from '@/lib/numbers'
import type { WeightUnit } from '@/types/profile'
import type { RecordHit, Workout } from '@/types/workout'
import { fromKg, roundWeight } from './workoutMath'

export function formatVolume(kg: number, unit: WeightUnit): string {
  return `${new Intl.NumberFormat('es', { maximumFractionDigits: 0 }).format(fromKg(kg, unit))} ${unit}`
}

export function workoutTitle(workout: Workout): string {
  return `${workout.routineName} · ${formatShortDate(workout.localDate)}`
}

export function recordText(hit: RecordHit, unit: WeightUnit): string {
  const w = (kg: number) => `${formatNumber(roundWeight(fromKg(kg, unit)))} ${unit}`
  if (hit.kind === 'weight') return `Peso máximo: ${w(hit.value)} (antes ${w(hit.previous)})`
  if (hit.kind === 'set_volume') return `Mejor serie (peso × reps): ${w(hit.value)} (antes ${w(hit.previous)})`
  return `Más repeticiones: ${hit.value} (antes ${hit.previous})`
}
