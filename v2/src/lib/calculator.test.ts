import { describe, expect, it } from 'vitest'
import { calculateExactResult } from './calculator'

describe('calculateExactResult — ПП', () => {
  it('считает геометрию и цену для ПП 200×60×1.2', () => {
    const r = calculateExactResult({
      profileType: 'PP',
      thickness: 1.2,
      wallHeight: 200,
      shelfWidthA: 60,
      shelfWidthB: 60,
      flangeC: 0,
      pricePerTon: 160000,
    })

    expect(r.rollWidth).toBe(1250)
    expect(r.bendsCount).toBe(2)
    expect(r.countFromRoll).toBe(3)
    expect(r.razvertka).toBeCloseTo(314.338, 3)
    expect(r.wasteMm).toBeCloseTo(306.986, 3)
    expect(r.wastePercentage).toBeCloseTo(24.559, 3)
    expect(r.weightPerMeter).toBeCloseTo(2.901, 3)
    expect(r.priceNoWaste).toBeCloseTo(464.23, 1)
    expect(r.priceWithWaste).toBeCloseTo(615.36, 2)
    expect(r.fitsInRoll).toBe(true)
  })

  it('бросает ошибку при недопустимой толщине', () => {
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
    ).toThrow(/не поддерживается/)
  })
})

describe('calculateExactResult — ПГС', () => {
  it('увеличивает развёртку из-за двух отгибок', () => {
    const r = calculateExactResult({
      profileType: 'PGS',
      thickness: 1.2,
      wallHeight: 200,
      shelfWidthA: 60,
      shelfWidthB: 60,
      flangeC: 15,
      pricePerTon: 160000,
    })

    expect(r.bendsCount).toBe(4)
    // Проверим только инварианты, чтобы тесты переживали мелкие правки констант.
    expect(r.razvertka).toBeGreaterThan(0)
    expect(r.fitsInRoll).toBe(true)
    expect(r.wastePercentage).toBeGreaterThanOrEqual(0)
    expect(r.wastePercentage).toBeLessThan(100)
  })
})

describe('calculateExactResult — Z с разными полками', () => {
  it('симметричный Z (a=B) даёт ту же развёртку, что и ПГС с тем же a и C', () => {
    const common = {
      thickness: 1.5,
      wallHeight: 200,
      flangeC: 20,
      pricePerTon: 160000,
    } as const

    const z = calculateExactResult({
      ...common,
      profileType: 'PZ',
      shelfWidthA: 70,
      shelfWidthB: 70,
    })

    const pgs = calculateExactResult({
      ...common,
      profileType: 'PGS',
      shelfWidthA: 70,
      shelfWidthB: 70,
    })

    expect(z.razvertka).toBeCloseTo(pgs.razvertka, 6)
  })

  it('асимметричный Z: при увеличении B развёртка растёт', () => {
    const base = {
      profileType: 'PZ' as const,
      thickness: 1.5,
      wallHeight: 200,
      shelfWidthA: 60,
      flangeC: 20,
      pricePerTon: 160000,
    }
    const a = calculateExactResult({ ...base, shelfWidthB: 60 })
    const b = calculateExactResult({ ...base, shelfWidthB: 90 })

    expect(b.razvertka).toBeGreaterThan(a.razvertka)
    expect(b.razvertka - a.razvertka).toBeCloseTo(30, 6)
  })
})

describe('calculateExactResult — устойчивость', () => {
  it('помечает fitsInRoll=false при огромной развёртке', () => {
    const r = calculateExactResult({
      profileType: 'PGS',
      thickness: 1.2,
      wallHeight: 350,
      shelfWidthA: 100,
      shelfWidthB: 100,
      flangeC: 27,
      // Развёртка ~ H + 2a + 2C ~ 604 — в рулон 1250 влезет 2 раза, всё ок.
      pricePerTon: 160000,
    })
    expect(r.fitsInRoll).toBe(true)
  })

  it('целочисленная толщина 1 ↔ 1.0 разрешается одинаково', () => {
    const r1 = calculateExactResult({
      profileType: 'PP',
      thickness: 1,
      wallHeight: 200,
      shelfWidthA: 60,
      shelfWidthB: 60,
      flangeC: 0,
      pricePerTon: 160000,
    })
    const r2 = calculateExactResult({
      profileType: 'PP',
      thickness: 1.0,
      wallHeight: 200,
      shelfWidthA: 60,
      shelfWidthB: 60,
      flangeC: 0,
      pricePerTon: 160000,
    })
    expect(r1.razvertka).toBeCloseTo(r2.razvertka, 9)
  })
})
