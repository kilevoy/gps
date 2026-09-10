import { matchesGostLgs2Intersection } from './gostRules'

export type ProfileType = 'PP' | 'PGS' | 'PZ' | 'SIGMA'
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

export interface SigmaGeometry {
  S: number
  h1: number
  h2: number
  F: number
  E: number
  slopeAngleDeg: number
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
  technologyModelValidated: boolean
  technologyModelNote: string
  sigmaGeometry?: SigmaGeometry
}

const MATERIALS: Record<string, MaterialData> = {
  '1': { t: 1.0, rb: 3.0, rollWidth: 1250, productionKgM2: 7.5056, theoreticalKgM2: 7.85, radiusSource: 'LGS2_SPEC' },
  '1.2': { t: 1.2, rb: 3.2, rollWidth: 1250, productionKgM2: 9.2304, theoreticalKgM2: 9.42, radiusSource: 'GPS_PRODUCTION' },
  '1.5': { t: 1.5, rb: 3.5, rollWidth: 1250, productionKgM2: 11.852, theoreticalKgM2: 11.775, radiusSource: 'LGS2_SPEC' },
  '2': { t: 2.0, rb: 4.0, rollWidth: 1250, productionKgM2: 15.67696, theoreticalKgM2: 15.7, radiusSource: 'LGS2_SPEC' },
  '2.5': { t: 2.5, rb: 4.5, rollWidth: 1250, productionKgM2: 19.62, theoreticalKgM2: 19.625, radiusSource: 'GPS_PRODUCTION' },
  '3': { t: 3.0, rb: 5.0, rollWidth: 1000, productionKgM2: 23.5, theoreticalKgM2: 23.55, radiusSource: 'LGS2_SPEC' },
}

const SIGMA_BY_H: Record<number, { h1: number; h2: number }> = {
  200: { h1: 62, h2: 37 },
  245: { h1: 72, h2: 47 },
  300: { h1: 102, h2: 77 },
}

function materialFor(thickness: number): MaterialData {
  const key = Number(thickness).toString()
  const material = MATERIALS[key]
  if (!material) throw new Error(`Unsupported thickness: ${thickness}`)
  return material
}

export function getSigmaGeometry(H: number): SigmaGeometry | null {
  const row = SIGMA_BY_H[H]
  if (!row) return null
  const S = 20
  const F = (row.h1 - row.h2) / 2
  const E = (H - row.h1) / 2
  const slopeAngleDeg = Math.atan2(S, F) * 180 / Math.PI
  return { S, h1: row.h1, h2: row.h2, F, E, slopeAngleDeg }
}

function validateLgs2(input: UnifiedCalculatorInput, techDevelopment: number): string[] {
  const reasons: string[] = []
  const { profileType, wallHeight: H, shelfWidthA: A, shelfWidthB: B, flangeC1: C1 } = input
  const C2 = input.flangeC2 ?? C1

  if (profileType === 'SIGMA') {
    if (!SIGMA_BY_H[H]) reasons.push('Sigma LGS-2: H должен быть 200, 245 или 300 мм')
    if (A < 60 || A > 100) reasons.push('Sigma LGS-2: A вне диапазона 60–100 мм')
    if (B < 60 || B > 100) reasons.push('Sigma LGS-2: B вне диапазона 60–100 мм')
    if (C1 < 17 || C1 > 27) reasons.push('Sigma LGS-2: C1 вне диапазона 17–27 мм')
    if (C2 < 17 || C2 > 27) reasons.push('Sigma LGS-2: C2 вне диапазона 17–27 мм')
  } else {
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
  }

  if (techDevelopment < 180 || techDevelopment > 625) {
    reasons.push('Ширина заготовки вне допустимого диапазона LGS-2: 180–625 мм')
  }

  return reasons
}

function sigmaDevelopments(input: UnifiedCalculatorInput, material: MaterialData) {
  const H = input.wallHeight
  const A = input.shelfWidthA
  const B = input.shelfWidthB
  const C1 = input.flangeC1
  const C2 = input.flangeC2 ?? C1
  const geometry = getSigmaGeometry(H)
  const t = material.t
  const rb = material.rb
  const rn = rb + t / 2

  if (!geometry) {
    return { technologicalDevelopment: 0, theoreticalDevelopment: 0, rn, sigmaGeometry: undefined }
  }

  const alpha = geometry.slopeAngleDeg * Math.PI / 180
  const diagonal = Math.hypot(geometry.F, geometry.S)
  const sharpLength = C1 + A + geometry.E + diagonal + geometry.h2 + diagonal + geometry.E + B + C2

  const bendAngles = [Math.PI / 2, Math.PI / 2, alpha, alpha, alpha, alpha, Math.PI / 2, Math.PI / 2]
  const tangentSetback = (radius: number, angle: number) => radius * Math.tan(angle / 2)
  const arcLength = bendAngles.reduce((sum, angle) => sum + rn * angle, 0)
  const techSetbacks = bendAngles.reduce((sum, angle) => sum + 2 * tangentSetback(rb + t, angle), 0)
  const theorySetbacks = bendAngles.reduce((sum, angle) => sum + 2 * tangentSetback(rn, angle), 0)

  return {
    technologicalDevelopment: sharpLength - techSetbacks + arcLength,
    theoreticalDevelopment: sharpLength - theorySetbacks + arcLength,
    rn,
    sigmaGeometry: geometry,
  }
}

function developments(input: UnifiedCalculatorInput, material: MaterialData) {
  if (input.profileType === 'SIGMA') return sigmaDevelopments(input, material)

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

  return { technologicalDevelopment, theoreticalDevelopment, rn, sigmaGeometry: undefined }
}

export function calculateUnified(input: UnifiedCalculatorInput): UnifiedCalculationResult {
  const material = materialFor(input.thickness)
  const { technologicalDevelopment, theoreticalDevelopment, rn, sigmaGeometry } = developments(input, material)
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

  const technologyModelValidated = input.profileType !== 'SIGMA'
  const technologyModelNote = technologyModelValidated
    ? 'ПП/ПГС/ПZ: технологическая модель воспроизводит проверенную логику GPS.'
    : 'Sigma: геометрия взята из спецификации LGS-2; технологическая развёртка обобщает GPS-модель на наклонные гибы и требует сверки с фактической техкартой/шириной полосы.'

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
    technologyModelValidated,
    technologyModelNote,
    sigmaGeometry,
  }
}

export function getMaterialTable(): Readonly<Record<string, MaterialData>> {
  return MATERIALS
}
