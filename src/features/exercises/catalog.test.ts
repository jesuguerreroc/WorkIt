import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { normalizeCatalogExercise, type ProviderExercise } from '@/services/exerciseApi'
import { MUSCLES } from '@/types/exercise'
import { exerciseNameTranslations } from './nameTranslations'
import { emptyFilters, filterExercises, normalizeText } from './search'

const raw = JSON.parse(readFileSync('public/data/exercises.json', 'utf8')) as ProviderExercise[]
const catalog = raw.map(normalizeCatalogExercise)
const byOriginal = (name: string) => catalog.find((e) => (e.originalName ?? e.name) === name)!

describe('bundled dataset', () => {
  it('has the expected size and unique ids', () => {
    expect(raw.length).toBeGreaterThan(800)
    expect(new Set(raw.map((e) => e.id)).size).toBe(raw.length)
  })

  it('every reviewed translation points to an existing exercise', () => {
    const names = new Set(raw.map((e) => e.name))
    const missing = Object.keys(exerciseNameTranslations).filter((name) => !names.has(name))
    expect(missing).toEqual([])
  })
})

describe('normalizeCatalogExercise', () => {
  it('maps every provider muscle to an internal code', () => {
    const providerMuscles = new Set(raw.flatMap((e) => [...e.primaryMuscles, ...e.secondaryMuscles]))
    const mapped = new Set(catalog.flatMap((e) => [...e.primaryMuscles, ...e.secondaryMuscles]))
    expect(mapped.size).toBe(providerMuscles.size)
    for (const muscle of mapped) expect(MUSCLES).toContain(muscle)
  })

  it('uses the Spanish name and keeps the original', () => {
    const bench = byOriginal('Barbell Bench Press - Medium Grip')
    expect(bench.name).toBe('Press de banca con barra')
    expect(bench.originalName).toBe('Barbell Bench Press - Medium Grip')
    expect(bench.key).toBe('catalog:Barbell_Bench_Press_-_Medium_Grip')
    expect(bench.equipment).toBe('barbell')
    expect(bench.primaryMuscles).toEqual(['chest'])
  })

  it('keeps untranslated names as they are, flagged by originalName = null', () => {
    const untranslated = catalog.find((e) => !exerciseNameTranslations[e.name] && e.originalName === null)!
    expect(untranslated.name).toBeTruthy()
  })

  it('builds pinned, URL-encoded image URLs', () => {
    const bench = byOriginal('Barbell Bench Press - Medium Grip')
    expect(bench.images).toHaveLength(2)
    expect(bench.images[0]).toMatch(/^https:\/\/cdn\.jsdelivr\.net\/gh\/yuhonas\/free-exercise-db@[0-9a-f]{40}\/exercises\//)
  })

  it('maps missing equipment to "none"', () => {
    expect(catalog.some((e) => e.equipment === 'none')).toBe(true)
  })
})

describe('filterExercises', () => {
  const search = (query: string, extra = {}) => filterExercises(catalog, { ...emptyFilters, query, ...extra })

  it('normalises accents and punctuation', () => {
    expect(normalizeText('Extensión de TRÍCEPS - polea')).toBe('extension de triceps polea')
  })

  it('finds exercises by their Spanish name', () => {
    expect(search('press de banca').map((e) => e.name)).toContain('Press de banca con barra')
  })

  it('understands Spanish words for untranslated names via synonyms', () => {
    const names = search('sentadilla mancuernas').map((e) => e.originalName ?? e.name)
    expect(names).toContain('Dumbbell Squat')
  })

  it('ranks names that start with the query first', () => {
    expect(search('curl martillo')[0].name.startsWith('Curl martillo')).toBe(true)
  })

  it('filters by muscle group using the group members', () => {
    const back = filterExercises(catalog, { ...emptyFilters, group: 'back' })
    expect(back.length).toBeGreaterThan(0)
    expect(back.every((e) => e.primaryMuscles.some((m) => ['lats', 'middle_back', 'lower_back', 'traps'].includes(m)))).toBe(true)
  })

  it('combines equipment and type filters', () => {
    const result = filterExercises(catalog, { ...emptyFilters, equipment: 'dumbbell', type: 'strength' })
    expect(result.every((e) => e.equipment === 'dumbbell' && e.type === 'strength')).toBe(true)
  })

  it('lists translated exercises first when there is no query', () => {
    const all = filterExercises(catalog, emptyFilters)
    const firstUntranslated = all.findIndex((e) => e.originalName === null)
    const lastTranslated = all.map((e) => e.originalName !== null).lastIndexOf(true)
    expect(lastTranslated).toBeLessThan(firstUntranslated)
  })

  it('returns nothing for gibberish', () => {
    expect(search('zzqqxx')).toEqual([])
  })
})
