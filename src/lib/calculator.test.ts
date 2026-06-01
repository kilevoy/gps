import { describe, expect, it } from 'vitest'
import { calculateExactResult, type CalculatorInput, type ProfileType } from './calculator'

const baseInput: CalculatorInput = {
  profileType: 'PP',
  thickness: 1.2,
  wallHeight: 200,
  shelfWidthA: 60,
  shelfWidthB: 60,
  flangeC: 20,
  pricePerTon: 160000,
}

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

  it('throws on unsupported profile type', () => {
    expect(() =>
      calculateExactResult({ ...baseInput, profileType: 'XX' as unknown as ProfileType }),
    ).toThrow(/Unsupported profile type/)
  })
})

describe('инварианты расчёта для всех профилей', () => {
  const profiles: ProfileType[] = ['PP', 'PGS', 'PZ']

  it.each(profiles)('профиль %s: согласованные метрики', (profileType) => {
    const r = calculateExactResult({ ...baseInput, profileType })

    // развёртка положительная
    expect(r.razvertka).toBeGreaterThan(0)
    // количество из рулона = floor(ширина рулона / развёртка)
    expect(r.countFromRoll).toBe(Math.floor(r.rollWidth / r.razvertka))
    // отход в пределах [0, 100)
    expect(r.wastePercentage).toBeGreaterThanOrEqual(0)
    expect(r.wastePercentage).toBeLessThan(100)
    // вес погонного метра = развёртка/1000 * удельный вес
    expect(r.weightPerMeter).toBeCloseTo((r.razvertka / 1000) * r.specificWeight, 6)
    // цена с учётом отхода не меньше цены без отхода
    expect(r.priceWithWaste).toBeGreaterThanOrEqual(r.priceNoWaste - 1e-6)
  })

  it('более толстый металл тяжелее на погонный метр', () => {
    const thin = calculateExactResult({ ...baseInput, thickness: 1 })
    const thick = calculateExactResult({ ...baseInput, thickness: 2 })
    expect(thick.weightPerMeter).toBeGreaterThan(thin.weightPerMeter)
  })
})
