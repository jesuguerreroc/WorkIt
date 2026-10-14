import { addDays, formatDayMonth, localDateKey, startOfWeek } from '@/lib/dates'
import { countedWorkouts } from '@/features/streaks/achievements'
import { fromKg, isWorkingSet, roundWeight, toKg, workoutVolumeKg } from '@/features/workouts/workoutMath'
import { estimateOneRepMax } from '@/features/workouts/strength'
import { exerciseKey, type ExerciseRef, type Muscle } from '@/types/exercise'
import type { WeightUnit } from '@/types/profile'
import type { Workout } from '@/types/workout'

export interface WeekBucket {
  weekStart: string
  label: string
  sessions: number
  /** In the user's unit. */
  volume: number
}

/** Sessions and volume per Monday-based week, oldest first, including empty weeks. */
export function weeklyBuckets(workouts: Workout[], today: string, weeks: number, unit: WeightUnit): WeekBucket[] {
  const current = startOfWeek(today)
  const buckets = Array.from({ length: weeks }, (_, i) => {
    const weekStart = addDays(current, -7 * (weeks - 1 - i))
    return { weekStart, label: formatDayMonth(weekStart), sessions: 0, volumeKg: 0 }
  })
  const index = new Map(buckets.map((b, i) => [b.weekStart, i]))
  for (const workout of countedWorkouts(workouts)) {
    const i = index.get(startOfWeek(workout.localDate))
    if (i === undefined) continue
    buckets[i].sessions++
    buckets[i].volumeKg += workoutVolumeKg(workout)
  }
  return buckets.map(({ volumeKg, ...b }) => ({ ...b, volume: Math.round(fromKg(volumeKg, unit)) }))
}

export interface CalendarCell {
  key: string
  day: number
  trained: boolean
  isToday: boolean
  isFuture: boolean
  sessions: number
}

/** Month grid (Monday first) with null padding before day 1. */
export function monthCalendar(year: number, month: number, workouts: Workout[], today: string): Array<CalendarCell | null> {
  const counts = new Map<string, number>()
  for (const w of countedWorkouts(workouts)) counts.set(w.localDate, (counts.get(w.localDate) ?? 0) + 1)
  const first = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const offset = (first.getDay() + 6) % 7
  const cells: Array<CalendarCell | null> = Array.from({ length: offset }, () => null)
  for (let day = 1; day <= daysInMonth; day++) {
    const key = localDateKey(new Date(year, month, day))
    const sessions = counts.get(key) ?? 0
    cells.push({ key, day, trained: sessions > 0, isToday: key === today, isFuture: key > today, sessions })
  }
  return cells
}

export interface ExerciseOption {
  key: string
  name: string
  sessions: number
}

/** Exercises that appear in completed sessions, most trained first. */
export function exercisesInHistory(workouts: Workout[]): ExerciseOption[] {
  const map = new Map<string, ExerciseOption>()
  for (const workout of countedWorkouts(workouts)) {
    const seen = new Set<string>()
    for (const e of workout.exercises) {
      if (!e.sets.some(isWorkingSet)) continue
      const key = exerciseKey(e.exercise)
      if (seen.has(key)) continue
      seen.add(key)
      const entry = map.get(key) ?? { key, name: e.exercise.name, sessions: 0 }
      entry.sessions++
      map.set(key, entry)
    }
  }
  return [...map.values()].sort((a, b) => b.sessions - a.sessions || a.name.localeCompare(b.name, 'es'))
}

export interface ExercisePoint {
  date: string
  label: string
  /** Heaviest working set, in the user's unit (null for bodyweight-only sessions). */
  topWeight: number | null
  /** Most reps in a working set. */
  bestReps: number
  /** Σ weight × reps for this exercise in the session, in the user's unit. */
  volume: number
  /** Best estimated 1RM of the session, in the user's unit (null if no set qualifies). */
  e1rm: number | null
}

/** One point per session for an exercise, oldest first (load progression — not body weight). */
export function exerciseSeries(workouts: Workout[], key: string, unit: WeightUnit): ExercisePoint[] {
  const points: ExercisePoint[] = []
  for (const workout of countedWorkouts(workouts)) {
    const sets = workout.exercises.filter((e) => exerciseKey(e.exercise) === key).flatMap((e) => e.sets.filter(isWorkingSet))
    if (sets.length === 0) continue
    const weightsKg = sets.filter((s) => s.weight && s.weight > 0).map((s) => toKg(s.weight!, workout.weightUnit))
    const volumeKg = sets.reduce((sum, s) => sum + (s.weight ? toKg(s.weight, workout.weightUnit) * (s.reps ?? 0) : 0), 0)
    points.push({
      date: workout.localDate,
      label: formatDayMonth(workout.localDate),
      topWeight: weightsKg.length ? roundWeight(fromKg(Math.max(...weightsKg), unit)) : null,
      bestReps: Math.max(...sets.map((s) => s.reps ?? 0)),
      volume: Math.round(fromKg(volumeKg, unit)),
      e1rm: (() => {
        const values = sets
          .map((s) => (s.weight ? estimateOneRepMax(toKg(s.weight, workout.weightUnit), s.reps ?? 0) : null))
          .filter((v): v is number => v !== null)
        return values.length ? roundWeight(fromKg(Math.max(...values), unit)) : null
      })(),
    })
  }
  return points
}

/** Completed sessions within an inclusive date range (keys), newest first. */
export function filterByDate(workouts: Workout[], from: string | null, to: string | null): Workout[] {
  return workouts
    .filter((w) => w.status === 'completed')
    .filter((w) => (!from || w.localDate >= from) && (!to || w.localDate <= to))
    .sort((a, b) => b.localDate.localeCompare(a.localDate) || b.startedAt - a.startedAt)
}

export function monthTitle(year: number, month: number): string {
  const text = new Intl.DateTimeFormat('es', { month: 'long', year: 'numeric' }).format(new Date(year, month, 1))
  return text.charAt(0).toUpperCase() + text.slice(1)
}


export interface MuscleSets {
  muscle: Muscle
  /** Working sets: 1 per set for a primary muscle, 0.5 for a secondary one. */
  sets: number
}

/**
 * Working sets per muscle in the `days` days up to `today` (inclusive).
 * `musclesOf` returns undefined for exercises that no longer exist (e.g. a
 * deleted custom exercise); those are skipped.
 */
export function setsByMuscle(
  workouts: Workout[],
  today: string,
  days: number,
  musclesOf: (ref: ExerciseRef) => { primary: readonly Muscle[]; secondary: readonly Muscle[] } | undefined,
): MuscleSets[] {
  const from = addDays(today, -(days - 1))
  const totals = new Map<Muscle, number>()
  for (const workout of countedWorkouts(workouts)) {
    if (workout.localDate < from || workout.localDate > today) continue
    for (const exercise of workout.exercises) {
      const sets = exercise.sets.filter(isWorkingSet).length
      const muscles = sets > 0 ? musclesOf(exercise.exercise) : undefined
      if (!muscles) continue
      for (const m of new Set(muscles.primary)) totals.set(m, (totals.get(m) ?? 0) + sets)
      for (const m of new Set(muscles.secondary)) if (!muscles.primary.includes(m)) totals.set(m, (totals.get(m) ?? 0) + sets / 2)
    }
  }
  return [...totals].map(([muscle, sets]) => ({ muscle, sets })).sort((a, b) => b.sets - a.sets)
}

/** Colour level 0–4 from sets per week (about 10+ weekly sets is a common target). */
export function muscleLevel(weeklySets: number): 0 | 1 | 2 | 3 | 4 {
  if (weeklySets <= 0) return 0
  if (weeklySets < 4) return 1
  if (weeklySets < 7) return 2
  if (weeklySets < 10) return 3
  return 4
}
