import { describe, expect, it } from 'vitest'
import { PLATE_SETS, platesPerSide } from './plates'

describe('platesPerSide', () => {
  it('loads the exact weight with standard kg plates', () => {
    expect(platesPerSide(100, 20, PLATE_SETS.kg)).toEqual({ perSide: [25, 15], achieved: 100, remainder: 0 })
    expect(platesPerSide(82.5, 20, PLATE_SETS.kg)).toEqual({ perSide: [25, 5, 1.25], achieved: 82.5, remainder: 0 })
  })

  it('returns an empty bar when the target equals the bar', () => {
    expect(platesPerSide(20, 20, PLATE_SETS.kg)).toEqual({ perSide: [], achieved: 20, remainder: 0 })
  })

  it('reports the closest lower weight when it cannot be exact', () => {
    expect(platesPerSide(61, 20, PLATE_SETS.kg)).toMatchObject({ achieved: 60, remainder: 1 })
  })

  it('respects the plates the gym actually has', () => {
    expect(platesPerSide(100, 20, [20, 10, 5])).toEqual({ perSide: [20, 20], achieved: 100, remainder: 0 })
  })

  it('works in pounds and rejects targets below the bar', () => {
    expect(platesPerSide(225, 45, PLATE_SETS.lb)?.perSide).toEqual([45, 45])
    expect(platesPerSide(15, 20, PLATE_SETS.kg)).toBeNull()
  })
})
