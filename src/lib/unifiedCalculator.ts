import { matchesGostLgs2Intersection } from './gostRules'

export type ProfileType = 'PP' | 'PGS' | 'PZ'
export type CalculatorMode = 'GOST' | 'LGS2'
export type AvailabilityStatus = 'GOST_LGS2' | 'GOST_ONLY' | 'LGS2_NONSTANDARD' | 'UNAVAILABLE'

export interface UnifiedCalculatorInput {
  mode: CalculatorMode
  profileType: ProfileType
  thickness: number
  wallHeight: number
  shelfWidthA: number
  shelfWidthB: number
  flangeC1: number
  flangeC2?: number
  pricePerTon: number
}

export interface MaterialData {
  t: number
  rb: number
  rollWidth: number
  productionKgM2: number
  theoreticalKgM2: number
  radiusSource: 'LGS2_SPEC' | 'GPS_PRODUCTION'
}

export interface UnifiedCalculationResult {
  status: AvailabilityStatus
  reasons: string[]
  gostIntersectionMatched: boolean
  internalRadius: number
  neutralRadius: number
  theoreticalDevelopment: number
  technologicalDevelopment: number
  developmentDeltaMm: number
  developmentDeltaPct: number
  theoreticalWeightPerMeter: number
  productionWeightPerMeter: number
  weightDeltaKgPerM: number
  weightDeltaPct: number
  rollWidth: number
  countFromRoll: number
  wasteMm: number
  wastePercentage: number
  priceNoWaste: number
  priceWithWaste: number
  productionKgM2: number
  theoreticalKgM2: number
  lgs2StripAllowed: boolean
}

const MATERIALS: Record<string, MaterialData> = {
  '1': { t: 1.0, rb: 3.0, rollWidth: 1250, productionKgM2: 7.5056, theoreticalKgM2: 7.85, radiusSource: 'LGS2_SPEC' },
  '1.2': { t: 1.2, rb: 3.2, rollWidth: 1250, productionKgM2: 9.2304, theoreticalKgM2: 9.42, radiusSource: 'GPS_PRODUCTION' },
  '1.5': { t: 1.5, rb: 3.5, rollWidth: 1250, productionKgM2: 11.852, theoreticalKgM2: 11.775, radiusSource: 'LGS2_SPEC' },
  '2': { t: 2.0, rb: 4.0, rollWidth: 1250, productionKgM2: 15.67696, theoreticalKgM2: 15.7, radiusSource: 'LGS2_SPEC' },
  '2.5': { t: 2.5, rb: 4.5, rollWidth: 1250, productionKgM2: 19.62, theoreticalKgM2: 19.625, radiusSource: 'GPS_PRODUCTION' },
  '3': { t: 3.0, rb: 5.0, rollWidth: 1000, productionKgM2: 23.5, theoreticalKgM2: 23.55, radiusSource: 'LGS2_SPEC' },
}

function materialFor(thickness: number): MaterialData {
  const key = Number(thickness).toString()
  const material = MATERIALS[key]
  if (!material) throw new Error(`Unsupported thickness: ${thickness}`)
  return material
}

function validateLgs2(input: UnifiedCalculatorInput, techDevelopment: number): string[] {
  const reasons: string[] = []
  const { profileType, wallHeight: H, shelfWidthA: A, shelfWidthB: B, flangeC1: C1 } = input
  const C2 = input.flangeC2 ?? C1

  if (H < 100 || H > 350) reasons.push('H вне диапазона LGS-2: 100–350 мм')
  if (A < 40 || A > 100) reasons.push('A вне диапазона LGS-2: 40–100 мм')

  if (profileType === 'PZ') {
    if (B < 40 || B > 95) reasons.push('B вне диапазона Z-профиля LGS-2: 40–95 мм')
  } else if (B < 40 || B > 100) {
    reasons.push('B вне диапазона LGS-2: 40–100 мм')
  }

  if (profileType !== 'PP') {
    if (C1 < 13 || C1 > 27) reasons.push('C1 вне диапазона LGS-2: 13–27 мм')
    if (C2 < 13 || C2 > 27) reasons.push('C2 вне диапазона LGS-2: 13–27 мм')
  }

  if (techDevelopment < 180 || techDevelopment > 625) {
    reasons.push('Ширина заготовки вне допустимого диапазона LGS-2: 180–625 мм')
  }

  return reasons
}

function developments(input: UnifiedCalculatorInput, material: MaterialData) {
  const { profileType, wallHeight: H, shelfWidthA: A, shelfWidthB: B, flangeC1: C1 } = input
  const C2 = input.flangeC2 ?? C1
  const t = material.t
  const rb = material.rb
  const rn = rb + t / 2

  let bends = 0
  let technologicalStraights = 0
  let theoreticalRawLength = 0

  if (profileType === 'PP') {
    bends = 2
    technologicalStraights = (H - 2 * (rb + t)) + (A - (rb + t)) + (B - (rb + t))
    theoreticalRawLength = H + A + B
  } else {
    bends = 4
    technologicalStraights =
      (H - 2 * (rb + t)) +
      (A - 2 * (rb + t)) +
      (B - 2 * (rb + t)) +
      (C1 - (rb + t)) +
      (C2 - (rb + t))
    theoreticalRawLength = H + A + B + C1 + C2
  }

  const arcLength = bends * (Math.PI * rn / 2)
  const technologicalDevelopment = technologicalStraights + arcLength
  const theoreticalDevelopment = theoreticalRawLength - bends * 2 * rn + arcLength

  return { technologicalDevelopment, theoreticalDevelopment, rn }
}

export function calculateUnified(input: UnifiedCalculatorInput): UnifiedCalculationResult {
  const material = materialFor(input.thickness)
  const { technologicalDevelopment, theoreticalDevelopment, rn } = developments(input, material)
  const reasons = validateLgs2(input, technologicalDevelopment)
  const lgs2StripAllowed = reasons.length === 0
  const gostIntersectionMatched = matchesGostLgs2Intersection(input)

  let status: AvailabilityStatus
  if (gostIntersectionMatched && lgs2StripAllowed) status = 'GOST_LGS2'
  else if (gostIntersectionMatched) status = 'GOST_ONLY'
  else if (lgs2StripAllowed) status = 'LGS2_NONSTANDARD'
  else status = 'UNAVAILABLE'

  const theoreticalWeightPerMeter = (theoreticalDevelopment / 1000) * material.theoreticalKgM2
  const productionWeightPerMeter = (technologicalDevelopment / 1000) * material.productionKgM2

  const countFromRoll = technologicalDevelopment > 0 ? Math.floor(material.rollWidth / technologicalDevelopment) : 0
  const wasteMm = countFromRoll > 0 ? material.rollWidth - countFromRoll * technologicalDevelopment : material.rollWidth
  const wastePercentage = (wasteMm / material.rollWidth) * 100

  const pricePerKg = input.pricePerTon / 1000
  const priceNoWaste = productionWeightPerMeter * pricePerKg
  const rollPricePerM = material.productionKgM2 * (material.rollWidth / 1000) * pricePerKg
  const priceWithWaste = countFromRoll > 0 ? rollPricePerM / countFromRoll : priceNoWaste

  const developmentDeltaMm = technologicalDevelopment - theoreticalDevelopment
  const developmentDeltaPct = theoreticalDevelopment !== 0 ? (developmentDeltaMm / theoreticalDevelopment) * 100 : 0
  const weightDeltaKgPerM = productionWeightPerMeter - theoreticalWeightPerMeter
  const weightDeltaPct = theoreticalWeightPerMeter !== 0 ? (weightDeltaKgPerM / theoreticalWeightPerMeter) * 100 : 0

  return {
    status,
    reasons,
    gostIntersectionMatched,
    internalRadius: material.rb,
    neutralRadius: rn,
    theoreticalDevelopment,
    technologicalDevelopment,
    developmentDeltaMm,
    developmentDeltaPct,
    theoreticalWeightPerMeter,
    productionWeightPerMeter,
    weightDeltaKgPerM,
    weightDeltaPct,
    rollWidth: material.rollWidth,
    countFromRoll,
    wasteMm,
    wastePercentage,
    priceNoWaste,
    priceWithWaste,
    productionKgM2: material.productionKgM2,
    theoreticalKgM2: material.theoreticalKgM2,
    lgs2StripAllowed,
  }
}

export function getMaterialTable(): Readonly<Record<string, MaterialData>> {
  return MATERIALS
}
