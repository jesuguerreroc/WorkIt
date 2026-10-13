import { describe, expect, it } from 'vitest'
import { parseNumber } from '@/lib/numbers'
import { adjustRest, exampleRoutineExercises, formatRest, hasRoutineErrors, moveItem, validateRoutine } from './routineLogic'

describe('rest helpers', () => {
  it('formats seconds as m:ss', () => {
    expect(formatRest(90)).toBe('1:30')
    expect(formatRest(45)).toBe('0:45')
    expect(formatRest(0)).toBe('0:00')
  })

  it('adjusts by ±15 s within 0–15 min', () => {
    expect(adjustRest(90, 15)).toBe(105)
    expect(adjustRest(90, -15)).toBe(75)
    expect(adjustRest(10, -15)).toBe(0)
    expect(adjustRest(895, 15)).toBe(900)
  })
})

describe('moveItem', () => {
  it('reorders without mutating and clamps at the ends', () => {
    const list = ['a', 'b', 'c']
    expect(moveItem(list, 0, 1)).toEqual(['b', 'a', 'c'])
    expect(moveItem(list, 2, -1)).toEqual(['a', 'c', 'b'])
    expect(moveItem(list, 0, -1)).toBe(list)
    expect(list).toEqual(['a', 'b', 'c'])
  })
})

describe('validateRoutine', () => {
  const items = exampleRoutineExercises()

  it('accepts the example routine', () => {
    expect(hasRoutineErrors(validateRoutine({ name: 'Rutina A', days: [1, 3], exercises: items }))).toBe(false)
  })

  it('requires a name and at least one exercise', () => {
    const errors = validateRoutine({ name: '  ', days: [], exercises: [] })
    expect(errors.name).toBeDefined()
    expect(errors.exercises).toBeDefined()
  })

  it('flags invalid items by id', () => {
    const bad = { ...items[0], repsMin: 12, repsMax: 8 }
    const errors = validateRoutine({ name: 'X', days: [], exercises: [bad, { ...items[1], sets: 0 }, { ...items[2], weight: -5 }] })
    expect(Object.keys(errors.items)).toHaveLength(3)
    expect(errors.items[bad.id]).toMatch(/mínimo/)
  })
})

describe('parseNumber', () => {
  it('accepts comma and dot decimals', () => {
    expect(parseNumber('62,5', 'decimal')).toBe(62.5)
    expect(parseNumber('62.5', 'decimal')).toBe(62.5)
    expect(parseNumber('', 'decimal')).toBeNull()
    expect(parseNumber('6a', 'decimal')).toBeUndefined()
    expect(parseNumber('8.5', 'integer')).toBeUndefined()
  })
})

describe('estimateRoutineMinutes', () => {
  it('adds set work time and configured rests, rounded to 5 min', async () => {
    const { estimateRoutineMinutes } = await import('./routineLogic')
    // Example routine: 12 sets × 45 s = 9 min, rests 2×(120+90+60+60) s = 11 min, 3 changes × 120 s = 6 min → 26 → 25.
    expect(estimateRoutineMinutes(exampleRoutineExercises())).toBe(25)
    expect(estimateRoutineMinutes([])).toBe(5)
  })
})
