import { describe, expect, it } from 'vitest'
import { calculateExactResult } from './calculator'
import { calculateUnified, type ProfileType } from './unifiedCalculator'

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
    expect(r.gostIntersectionMatched).toBe(false)
    expect(r.status).toBe('LGS2_NONSTANDARD')
    expect(r.technologyModelValidated).toBe(true)
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
      shelfWidthA: 120,
      shelfWidthB: 120,
      flangeC1: 27,
      flangeC2: 27,
      pricePerTon: 160000,
    })

    expect(r.lgs2StripAllowed).toBe(false)
    expect(r.status).toBe('UNAVAILABLE')
    expect(r.reasons.join(' ')).toMatch(/180–625/)
  })

  it('automatically recognises a profile from the GOST/LGS-2 intersection', () => {
    const r = calculateUnified({
      mode: 'GOST',
      profileType: 'PGS',
      thickness: 2,
      wallHeight: 200,
      shelfWidthA: 70,
      shelfWidthB: 70,
      flangeC1: 18,
      flangeC2: 18,
      pricePerTon: 160000,
    })

    expect(r.gostIntersectionMatched).toBe(true)
    expect(r.status).toBe('GOST_LGS2')
  })

  it('recognises asymmetric Z geometry from the GOST/LGS-2 intersection', () => {
    const r = calculateUnified({
      mode: 'GOST',
      profileType: 'PZ',
      thickness: 2,
      wallHeight: 200,
      shelfWidthA: 70,
      shelfWidthB: 67,
      flangeC1: 18,
      flangeC2: 18,
      pricePerTon: 160000,
    })

    expect(r.gostIntersectionMatched).toBe(true)
    expect(r.status).toBe('GOST_LGS2')
  })

  it('classifies a producible arbitrary LGS-2 profile as nonstandard', () => {
    const r = calculateUnified({
      mode: 'LGS2',
      profileType: 'PGS',
      thickness: 1.5,
      wallHeight: 211,
      shelfWidthA: 71,
      shelfWidthB: 71,
      flangeC1: 19,
      flangeC2: 19,
      pricePerTon: 160000,
    })

    expect(r.lgs2StripAllowed).toBe(true)
    expect(r.gostIntersectionMatched).toBe(false)
    expect(r.status).toBe('LGS2_NONSTANDARD')
  })

  it('matches the legacy GPS engine across all thicknesses and representative PP/PGS/PZ limits', () => {
    const thicknesses = [1, 1.2, 1.5, 2, 2.5, 3]
    const geometries: Array<{
      profileType: ProfileType
      wallHeight: number
      shelfWidthA: number
      shelfWidthB: number
      flangeC: number
    }> = [
      { profileType: 'PP', wallHeight: 100, shelfWidthA: 40, shelfWidthB: 40, flangeC: 0 },
      { profileType: 'PP', wallHeight: 225, shelfWidthA: 70, shelfWidthB: 70, flangeC: 0 },
      { profileType: 'PP', wallHeight: 350, shelfWidthA: 100, shelfWidthB: 100, flangeC: 0 },
      { profileType: 'PGS', wallHeight: 100, shelfWidthA: 40, shelfWidthB: 40, flangeC: 13 },
      { profileType: 'PGS', wallHeight: 225, shelfWidthA: 70, shelfWidthB: 70, flangeC: 20 },
      { profileType: 'PGS', wallHeight: 350, shelfWidthA: 100, shelfWidthB: 100, flangeC: 27 },
      { profileType: 'PZ', wallHeight: 100, shelfWidthA: 40, shelfWidthB: 40, flangeC: 13 },
      { profileType: 'PZ', wallHeight: 225, shelfWidthA: 70, shelfWidthB: 65, flangeC: 20 },
      { profileType: 'PZ', wallHeight: 350, shelfWidthA: 100, shelfWidthB: 95, flangeC: 27 },
    ]

    for (const thickness of thicknesses) {
      for (const g of geometries) {
        const legacy = calculateExactResult({
          ...g,
          thickness,
          pricePerTon: 160000,
          // Production rule from the long-running Excel calculator:
          // 1.0–2.5 mm -> 1250 mm mother coil; 3.0 mm -> 1000 mm.
          rollWidthOverride: thickness === 2.5 ? 1250 : undefined,
        })

        const unified = calculateUnified({
          mode: 'LGS2',
          profileType: g.profileType,
          thickness,
          wallHeight: g.wallHeight,
          shelfWidthA: g.shelfWidthA,
          shelfWidthB: g.shelfWidthB,
          flangeC1: g.flangeC,
          flangeC2: g.flangeC,
          pricePerTon: 160000,
        })

        expect(unified.technologicalDevelopment).toBeCloseTo(legacy.razvertka, 9)
        expect(unified.productionWeightPerMeter).toBeCloseTo(legacy.weightPerMeter, 9)
        expect(unified.rollWidth).toBe(legacy.rollWidth)
        expect(unified.countFromRoll).toBe(legacy.countFromRoll)
        expect(unified.wasteMm).toBeCloseTo(legacy.wasteMm, 9)
        expect(unified.wastePercentage).toBeCloseTo(legacy.wastePercentage, 9)
        expect(unified.priceNoWaste).toBeCloseTo(legacy.priceNoWaste, 9)
        expect(unified.priceWithWaste).toBeCloseTo(legacy.priceWithWaste, 9)
        expect(unified.technologyModelValidated).toBe(true)
      }
    }
  })

  it('keeps the expected theoretical-vs-technological development delta for PP/PGS/PZ', () => {
    const cases: Array<{ profileType: ProfileType; expectedDelta: number; flangeC: number }> = [
      { profileType: 'PP', expectedDelta: -3, flangeC: 0 },
      { profileType: 'PGS', expectedDelta: -6, flangeC: 20 },
      { profileType: 'PZ', expectedDelta: -6, flangeC: 20 },
    ]

    for (const c of cases) {
      const r = calculateUnified({
        mode: 'LGS2',
        profileType: c.profileType,
        thickness: 1.5,
        wallHeight: 200,
        shelfWidthA: 70,
        shelfWidthB: c.profileType === 'PZ' ? 65 : 70,
        flangeC1: c.flangeC,
        flangeC2: c.flangeC,
        pricePerTon: 160000,
      })
      expect(r.developmentDeltaMm).toBeCloseTo(c.expectedDelta, 9)
    }
  })

  it('calculates Sigma geometry from the LGS-2 specification', () => {
    const r = calculateUnified({
      mode: 'LGS2',
      profileType: 'SIGMA',
      thickness: 1.5,
      wallHeight: 200,
      shelfWidthA: 65,
      shelfWidthB: 65,
      flangeC1: 20,
      flangeC2: 20,
      pricePerTon: 160000,
    })

    expect(r.lgs2StripAllowed).toBe(true)
    expect(r.gostIntersectionMatched).toBe(false)
    expect(r.status).toBe('LGS2_NONSTANDARD')
    expect(r.sigmaGeometry).toMatchObject({ S: 20, h1: 62, h2: 37, F: 12.5, E: 69 })
    expect(r.technologicalDevelopment).toBeGreaterThan(180)
    expect(r.technologicalDevelopment).toBeLessThan(625)
    expect(r.theoreticalDevelopment).toBeGreaterThan(r.technologicalDevelopment)
    expect(r.technologyModelValidated).toBe(false)
    expect(r.technologyModelNote).toMatch(/техкарт/)
  })

  it('accepts all three fixed Sigma heights from the LGS-2 specification', () => {
    const expected = [
      [200, 62, 37],
      [245, 72, 47],
      [300, 102, 77],
    ] as const

    for (const [H, h1, h2] of expected) {
      const r = calculateUnified({
        mode: 'LGS2',
        profileType: 'SIGMA',
        thickness: 2,
        wallHeight: H,
        shelfWidthA: 80,
        shelfWidthB: 80,
        flangeC1: 20,
        flangeC2: 20,
        pricePerTon: 160000,
      })
      expect(r.sigmaGeometry?.h1).toBe(h1)
      expect(r.sigmaGeometry?.h2).toBe(h2)
      expect(r.reasons.join(' ')).not.toMatch(/H должен/)
    }
  })

  it('rejects an unsupported Sigma height', () => {
    const r = calculateUnified({
      mode: 'LGS2',
      profileType: 'SIGMA',
      thickness: 2,
      wallHeight: 220,
      shelfWidthA: 80,
      shelfWidthB: 80,
      flangeC1: 20,
      flangeC2: 20,
      pricePerTon: 160000,
    })

    expect(r.lgs2StripAllowed).toBe(false)
    expect(r.status).toBe('UNAVAILABLE')
    expect(r.reasons.join(' ')).toMatch(/200, 245 или 300/)
  })
})
