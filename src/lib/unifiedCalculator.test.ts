import { describe, expect, it } from 'vitest'
import { calculateUnified } from './unifiedCalculator'

describe('unified calculator regression', () => {
  it('preserves GPS technological result for PGS 250x70x70x20 t1.5', () => {
    const r = calculateUnified({
      mode: 'LGS2',
      profileType: 'PGS',
      thickness: 1.5,
      wallHeight: 250,
      shelfWidthA: 70,
      shelfWidthB: 70,
      flangeC1: 20,
      flangeC2: 20,
      pricePerTon: 160000,
      gostMatched: false,
    })

    expect(r.internalRadius).toBe(3.5)
    expect(r.neutralRadius).toBe(4.25)
    expect(r.technologicalDevelopment).toBeCloseTo(416.7035, 3)
    expect(r.theoreticalDevelopment).toBeCloseTo(422.7035, 3)
    expect(r.developmentDeltaMm).toBeCloseTo(-6, 6)
    expect(r.productionWeightPerMeter).toBeCloseTo(4.9387, 3)
    expect(r.rollWidth).toBe(1250)
    expect(r.countFromRoll).toBe(2)
    expect(r.wasteMm).toBeCloseTo(416.593, 2)
    expect(r.wastePercentage).toBeCloseTo(33.327, 2)
  })

  it('uses 1250 mm mother coil for 2.5 mm steel', () => {
    const r = calculateUnified({
      mode: 'LGS2',
      profileType: 'PP',
      thickness: 2.5,
      wallHeight: 200,
      shelfWidthA: 60,
      shelfWidthB: 60,
      flangeC1: 0,
      pricePerTon: 160000,
    })

    expect(r.rollWidth).toBe(1250)
  })

  it('uses 1000 mm mother coil only for 3.0 mm steel', () => {
    const r = calculateUnified({
      mode: 'LGS2',
      profileType: 'PP',
      thickness: 3,
      wallHeight: 200,
      shelfWidthA: 60,
      shelfWidthB: 60,
      flangeC1: 0,
      pricePerTon: 160000,
    })

    expect(r.rollWidth).toBe(1000)
  })

  it('keeps production and theoretical masses separate', () => {
    const r = calculateUnified({
      mode: 'LGS2',
      profileType: 'PGS',
      thickness: 1.5,
      wallHeight: 150,
      shelfWidthA: 45,
      shelfWidthB: 45,
      flangeC1: 15,
      flangeC2: 15,
      pricePerTon: 160000,
    })

    expect(r.technologicalDevelopment).toBeCloseTo(256.7035, 3)
    expect(r.theoreticalDevelopment).toBeCloseTo(262.7035, 3)
    expect(r.productionWeightPerMeter).toBeCloseTo(3.04245, 4)
    expect(r.theoreticalWeightPerMeter).toBeCloseTo(3.09333, 4)
  })

  it('rejects a technological strip wider than 625 mm', () => {
    const r = calculateUnified({
      mode: 'LGS2',
      profileType: 'PGS',
      thickness: 1.5,
      wallHeight: 350,
      shelfWidthA: 100,
      shelfWidthB: 100,
      flangeC1: 27,
      flangeC2: 27,
      pricePerTon: 160000,
    })

    expect(r.lgs2StripAllowed).toBe(false)
    expect(r.status).toBe('UNAVAILABLE')
    expect(r.reasons.join(' ')).toMatch(/180–625/)
  })

  it('marks a GOST profile that is also producible on LGS-2', () => {
    const r = calculateUnified({
      mode: 'GOST',
      profileType: 'PGS',
      thickness: 1.5,
      wallHeight: 250,
      shelfWidthA: 70,
      shelfWidthB: 70,
      flangeC1: 20,
      flangeC2: 20,
      pricePerTon: 160000,
      gostMatched: true,
    })

    expect(r.status).toBe('GOST_LGS2')
  })
})
