import { describe, expect, it } from 'vitest'
import { matchesGostProfile } from './gostRules'
import { calculateUnified } from './unifiedCalculator'

describe('ГОСТ Р 58384-2019 assortment', () => {
  it('recognises a ГОСТ channel that is outside LGS-2 by height', () => {
    const input = {
      mode: 'GOST' as const,
      profileType: 'PP' as const,
      thickness: 2,
      wallHeight: 354,
      shelfWidthA: 50,
      shelfWidthB: 50,
      flangeC1: 0,
      flangeC2: 0,
      pricePerTon: 160000,
    }

    expect(matchesGostProfile(input)).toBe(true)
    const r = calculateUnified(input)
    expect(r.gostIntersectionMatched).toBe(true)
    expect(r.lgs2StripAllowed).toBe(false)
    expect(r.status).toBe('GOST_ONLY')
  })

  it('recognises a ГОСТ C-profile with unequal B1/B2', () => {
    const input = {
      profileType: 'PGS' as const,
      thickness: 2,
      wallHeight: 200,
      shelfWidthA: 75,
      shelfWidthB: 70,
      flangeC1: 20,
      flangeC2: 20,
    }

    expect(matchesGostProfile(input)).toBe(true)
  })

  it('allows C1 and C2 to differ when both are inside the same ГОСТ range', () => {
    const input = {
      profileType: 'PZ' as const,
      thickness: 2,
      wallHeight: 200,
      shelfWidthA: 75,
      shelfWidthB: 70,
      flangeC1: 18,
      flangeC2: 24,
    }

    expect(matchesGostProfile(input)).toBe(true)
  })

  it('recognises full ГОСТ ranges that exceed LGS-2 flange limits', () => {
    const input = {
      mode: 'GOST' as const,
      profileType: 'PZ' as const,
      thickness: 2.5,
      wallHeight: 320,
      shelfWidthA: 110,
      shelfWidthB: 100,
      flangeC1: 30,
      flangeC2: 30,
      pricePerTon: 160000,
    }

    expect(matchesGostProfile(input)).toBe(true)
    const r = calculateUnified(input)
    expect(r.status).toBe('GOST_ONLY')
    expect(r.reasons.join(' ')).toMatch(/LGS-2/)
  })

  it('keeps Sigma outside the selected ГОСТ families', () => {
    expect(matchesGostProfile({
      profileType: 'SIGMA',
      thickness: 2,
      wallHeight: 200,
      shelfWidthA: 80,
      shelfWidthB: 80,
      flangeC1: 20,
      flangeC2: 20,
    })).toBe(false)
  })
})
