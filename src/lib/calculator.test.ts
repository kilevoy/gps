import { describe, expect, it } from 'vitest'
import { calculateExactResult, calculateOrderSummary, findOptimalProfiles } from './calculator'

describe('calculateExactResult', () => {
  it('calculates PP profile metrics and price correctly', () => {
    const result = calculateExactResult({
      profileType: 'PP',
      thickness: 1.2,
      wallHeight: 200,
      shelfWidthA: 60,
      shelfWidthB: 60,
      flangeC: 0,
      pricePerTon: 160000,
    })

    expect(result.rollWidth).toBe(1250)
    expect(result.countFromRoll).toBe(3)
    expect(result.razvertka).toBeCloseTo(314.338, 3)
    expect(result.wasteMm).toBeCloseTo(306.986, 3)
    expect(result.wastePercentage).toBeCloseTo(24.559, 3)
    expect(result.weightPerMeter).toBeCloseTo(2.901, 3)
    expect(result.priceNoWaste).toBeCloseTo(464.23, 2)
    expect(result.priceWithWaste).toBeCloseTo(615.36, 3)
  })

  it('throws when thickness is not supported', () => {
    expect(() =>
      calculateExactResult({
        profileType: 'PP',
        thickness: 9.9,
        wallHeight: 200,
        shelfWidthA: 60,
        shelfWidthB: 60,
        flangeC: 0,
        pricePerTon: 160000,
      }),
    ).toThrow(/Unsupported thickness/)
  })
})

describe('findOptimalProfiles', () => {
  it('returns sorted options with waste below 10%', () => {
    const options = findOptimalProfiles({
      profileType: 'PP',
      thickness: 1.0,
      wallHeight: 100,
      shelfWidthA: 50,
      shelfWidthB: 50,
      flangeC: 0,
      pricePerTon: 160000,
    })

    expect(options.length).toBeGreaterThan(0)
    expect(options.every((item) => item.wastePercentage < 10)).toBe(true)

    for (let index = 1; index < options.length; index += 1) {
      expect(options[index - 1].priceWithWaste).toBeLessThanOrEqual(options[index].priceWithWaste)
    }
  })
})

describe('calculateOrderSummary', () => {
  it('calculates order totals for selected profile', () => {
    const profile = calculateExactResult({
      profileType: 'PP',
      thickness: 1.0,
      wallHeight: 100,
      shelfWidthA: 50,
      shelfWidthB: 50,
      flangeC: 0,
      pricePerTon: 160000,
    })

    const summary = calculateOrderSummary(profile, 100, 6)
    expect(summary.totalLinearMeters).toBe(600)
    expect(summary.finalSum).toBeGreaterThan(summary.orderSum)
    expect(summary.requiredRollLength).toBeGreaterThan(0)
  })
})
