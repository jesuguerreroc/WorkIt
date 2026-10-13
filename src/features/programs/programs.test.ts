import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { exerciseNameTranslations } from '@/features/exercises/nameTranslations'
import type { ProviderExercise } from '@/services/exerciseApi'
import { PROGRAMS } from './programs'

const catalog = JSON.parse(readFileSync('public/data/exercises.json', 'utf8')) as ProviderExercise[]
const byId = new Map(catalog.map((e) => [e.id, e]))

describe('program templates', () => {
  it('only use exercises that exist in the bundled catalogue, with their Spanish name', () => {
    for (const program of PROGRAMS) {
      for (const workout of program.workouts) {
        for (const item of workout.exercises) {
          const exercise = byId.get(item.id)
          expect(exercise, `${program.id}/${workout.name}: ${item.id}`).toBeDefined()
          expect(exerciseNameTranslations[exercise!.name]).toBe(item.name)
        }
      }
    }
  })

  it('have valid prescriptions and unique ids', () => {
    expect(new Set(PROGRAMS.map((p) => p.id)).size).toBe(PROGRAMS.length)
    for (const item of PROGRAMS.flatMap((p) => p.workouts.flatMap((w) => w.exercises))) {
      expect(item.repsMin).toBeLessThanOrEqual(item.repsMax)
      expect(item.sets).toBeGreaterThan(0)
    }
  })
})
