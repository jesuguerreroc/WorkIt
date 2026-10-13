import type { WeightUnit } from '@/types/profile'

/** Common gym plates and bars per unit, heaviest first. */
export const PLATE_SETS: Record<WeightUnit, number[]> = {
  kg: [25, 20, 15, 10, 5, 2.5, 1.25],
  lb: [45, 35, 25, 10, 5, 2.5],
}
export const BAR_OPTIONS: Record<WeightUnit, number[]> = {
  kg: [20, 15, 10, 0],
  lb: [45, 35, 25, 0],
}

export interface PlateResult {
  /** Plates for ONE side of the bar, heaviest first. */
  perSide: number[]
  /** Total actually loaded (bar + both sides). */
  achieved: number
  /** target − achieved (> 0 when the exact weight is impossible with these plates). */
  remainder: number
}

const EPSILON = 1e-6

/**
 * Plates to load on each side to reach `target` with a bar of `bar` weight, using
 * the available plate sizes (unlimited pairs). Greedy from the heaviest plate,
 * which is exact for standard plate sets. Returns null if the target is below the bar.
 */
export function platesPerSide(target: number, bar: number, available: number[]): PlateResult | null {
  if (!Number.isFinite(target) || target < bar - EPSILON) return null
  let remaining = (target - bar) / 2
  const perSide: number[] = []
  for (const plate of [...available].sort((a, b) => b - a)) {
    while (plate > 0 && remaining >= plate - EPSILON) {
      perSide.push(plate)
      remaining -= plate
    }
  }
  const achieved = bar + 2 * perSide.reduce((sum, p) => sum + p, 0)
  return { perSide, achieved: Math.round(achieved * 100) / 100, remainder: Math.round((target - achieved) * 100) / 100 }
}
