export type ProfileType = 'PP' | 'PGS' | 'PZ'

export interface CalculatorInput {
  profileType: ProfileType
  thickness: number
  wallHeight: number
  shelfWidthA: number
  shelfWidthB: number
  flangeC: number
  pricePerTon: number
}

export interface MaterialData {
  t: number
  rb: number
  rollWidth: number
  specificWeight: number
}

export interface ProfileMetrics {
  razvertka: number
  weightPerMeter: number
  rollWidth: number
  countFromRoll: number
  wasteMm: number
  wastePercentage: number
  specificWeight: number
}

export interface ExactProfileResult extends ProfileMetrics {
  productName: string
  profileType: ProfileType
  h: number
  a: number
  b: number
  c: number
  t: number
  priceNoWaste: number
  priceWithWaste: number
}

export type OptimizationResult = ExactProfileResult

export interface OrderSummary {
  totalLinearMeters: number
  totalProductWeightKg: number
  orderSum: number
  packagingSum: number
  finalSum: number
  requiredRollLength: number
  rawMaterialWeightKg: number
  rawMaterialWeightTons: number
}

const MATERIALS: Record<string, MaterialData> = {
  '1': { t: 1.0, rb: 3.0, rollWidth: 1250, specificWeight: 7.5056 },
  '1.2': { t: 1.2, rb: 3.2, rollWidth: 1250, specificWeight: 9.2304 },
  '1.5': { t: 1.5, rb: 3.5, rollWidth: 1250, specificWeight: 11.852 },
  '2': { t: 2.0, rb: 4.0, rollWidth: 1250, specificWeight: 15.67696 },
  '2.5': { t: 2.5, rb: 4.5, rollWidth: 1000, specificWeight: 19.62 },
  '3': { t: 3.0, rb: 5.0, rollWidth: 1000, specificWeight: 23.5 },
}

function round(value: number, digits = 3): number {
  const p = 10 ** digits
  return Math.round(value * p) / p
}

export function getMaterialData(thickness: number): MaterialData {
  const key = Number(thickness).toString()
  const material = MATERIALS[key]
  if (!material) {
    throw new Error(`Unsupported thickness: ${thickness}`)
  }
  return material
}

function buildNormalizedInput(input: CalculatorInput): Omit<CalculatorInput, 'pricePerTon'> {
  const normalizedB = input.profileType === 'PZ' ? input.shelfWidthB : input.shelfWidthA
  const normalizedC = input.profileType === 'PP' ? 0 : input.flangeC

  return {
    profileType: input.profileType,
    thickness: input.thickness,
    wallHeight: input.wallHeight,
    shelfWidthA: input.shelfWidthA,
    shelfWidthB: normalizedB,
    flangeC: normalizedC,
  }
}

function ensureGeometry(input: Omit<CalculatorInput, 'pricePerTon'>, material: MaterialData): void {
  const minLine = material.rb + material.t
  if (input.wallHeight <= 2 * minLine) {
    throw new Error('Высота стенки слишком мала для выбранной толщины и радиуса гиба.')
  }

  if (input.shelfWidthA <= minLine) {
    throw new Error('Полка A слишком мала для выбранной толщины.')
  }

  if (input.profileType === 'PZ' && input.shelfWidthB <= minLine) {
    throw new Error('Полка B слишком мала для выбранной толщины.')
  }

  if (input.profileType !== 'PP' && input.flangeC <= minLine) {
    throw new Error('Отгибка C слишком мала для выбранной толщины.')
  }
}

export function generateProductName(input: Omit<CalculatorInput, 'pricePerTon'>): string {
  const { profileType, wallHeight, shelfWidthA, shelfWidthB, flangeC, thickness } = input
  let dimensions = `${wallHeight}x${shelfWidthA}`

  if (profileType === 'PZ') {
    dimensions += `x${shelfWidthB}`
  }
  if (profileType !== 'PP') {
    dimensions += `x${flangeC}`
  }

  const thicknessStr = Number(thickness).toFixed(1).replace('.', ',')
  const steelGrade = Number(thickness) >= 1.2 ? ' П350' : ''
  const profileLabel = profileType === 'PZ' ? 'ПZ' : profileType

  return `${profileLabel} ${dimensions} без перфор. ${thicknessStr}${steelGrade} (Оцинк.)`
}

export function calculateProfileMetrics(
  normalized: Omit<CalculatorInput, 'pricePerTon'>,
  material: MaterialData,
): ProfileMetrics {
  ensureGeometry(normalized, material)

  const { profileType, wallHeight: h, shelfWidthA: a, shelfWidthB: b, flangeC: c } = normalized
  const { rb, specificWeight, rollWidth, t } = material

  let bendsCount: number
  let l1: number

  switch (profileType) {
    case 'PP':
      bendsCount = 2
      l1 = h - 2 * (rb + t) + 2 * (a - (rb + t))
      break
    case 'PGS':
      bendsCount = 4
      l1 = h - 2 * (rb + t) + 2 * (a - 2 * (rb + t)) + 2 * (c - (rb + t))
      break
    case 'PZ':
      bendsCount = 4
      l1 = h - 2 * (rb + t) + (a - 2 * (rb + t)) + (b - 2 * (rb + t)) + 2 * (c - (rb + t))
      break
    default:
      throw new Error('Unsupported profile type')
  }

  const rcp = rb + t / 2
  const l0 = bendsCount * (Math.PI * rcp / 2)
  const razvertka = l0 + l1
  const weightPerMeter = (razvertka / 1000) * specificWeight

  const countFromRoll = rollWidth > 0 ? Math.floor(rollWidth / razvertka) : 0
  const wasteMm = rollWidth > 0 ? rollWidth - countFromRoll * razvertka : 0
  const wastePercentage = rollWidth > 0 && countFromRoll > 0 ? (wasteMm / rollWidth) * 100 : 100

  return {
    razvertka: round(razvertka, 3),
    weightPerMeter: round(weightPerMeter, 6),
    rollWidth,
    countFromRoll,
    wasteMm: round(wasteMm, 3),
    wastePercentage: round(wastePercentage, 3),
    specificWeight,
  }
}

function withPricing(
  metrics: ProfileMetrics,
  material: MaterialData,
  pricePerTon: number,
): Pick<ExactProfileResult, 'priceNoWaste' | 'priceWithWaste'> {
  const pricePerKg = pricePerTon / 1000
  const priceNoWaste = metrics.weightPerMeter * pricePerKg
  const rollPricePerM = material.specificWeight * (material.rollWidth / 1000) * pricePerKg
  const priceWithWaste = metrics.countFromRoll > 0 ? rollPricePerM / metrics.countFromRoll : priceNoWaste

  return {
    priceNoWaste: round(priceNoWaste, 6),
    priceWithWaste: round(priceWithWaste, 6),
  }
}

export function calculateExactResult(input: CalculatorInput): ExactProfileResult {
  const normalized = buildNormalizedInput(input)
  const material = getMaterialData(input.thickness)
  const metrics = calculateProfileMetrics(normalized, material)
  const prices = withPricing(metrics, material, input.pricePerTon)

  return {
    productName: generateProductName(normalized),
    profileType: normalized.profileType,
    h: normalized.wallHeight,
    a: normalized.shelfWidthA,
    b: normalized.shelfWidthB,
    c: normalized.flangeC,
    t: normalized.thickness,
    ...metrics,
    ...prices,
  }
}

export function findOptimalProfiles(input: CalculatorInput): OptimizationResult[] {
  const normalized = buildNormalizedInput(input)
  const material = getMaterialData(input.thickness)

  const limits = { aMin: 40, aMax: 100, bMin: 40, bMax: 95, cMin: 13, cMax: 27 }
  const aMin = Math.max(limits.aMin, Math.round(normalized.shelfWidthA * 0.8))
  const aMax = Math.min(limits.aMax, Math.round(normalized.shelfWidthA * 1.2))
  const bMin = Math.max(limits.bMin, Math.round(normalized.shelfWidthB * 0.8))
  const bMax = Math.min(limits.bMax, Math.round(normalized.shelfWidthB * 1.2))

  const candidates: OptimizationResult[] = []

  for (let a = aMin; a <= aMax; a += 1) {
    if (normalized.profileType === 'PZ') {
      for (let b = bMin; b <= bMax; b += 1) {
        for (let c = limits.cMin; c <= limits.cMax; c += 1) {
          tryPushCandidate(candidates, material, input.pricePerTon, {
            ...normalized,
            shelfWidthA: a,
            shelfWidthB: b,
            flangeC: c,
          })
        }
      }
    } else if (normalized.profileType === 'PGS') {
      for (let c = limits.cMin; c <= limits.cMax; c += 1) {
        tryPushCandidate(candidates, material, input.pricePerTon, {
          ...normalized,
          shelfWidthA: a,
          shelfWidthB: a,
          flangeC: c,
        })
      }
    } else {
      tryPushCandidate(candidates, material, input.pricePerTon, {
        ...normalized,
        shelfWidthA: a,
        shelfWidthB: a,
        flangeC: 0,
      })
    }
  }

  candidates.sort((left, right) => left.priceWithWaste - right.priceWithWaste)
  return candidates.slice(0, 50)
}

function tryPushCandidate(
  target: OptimizationResult[],
  material: MaterialData,
  pricePerTon: number,
  candidate: Omit<CalculatorInput, 'pricePerTon'>,
): void {
  try {
    const metrics = calculateProfileMetrics(candidate, material)
    if (metrics.wastePercentage >= 10) return
    const prices = withPricing(metrics, material, pricePerTon)
    target.push({
      productName: generateProductName(candidate),
      profileType: candidate.profileType,
      h: candidate.wallHeight,
      a: candidate.shelfWidthA,
      b: candidate.shelfWidthB,
      c: candidate.flangeC,
      t: candidate.thickness,
      ...metrics,
      ...prices,
    })
  } catch {
    // Skip invalid geometry combinations.
  }
}

export function calculateOrderSummary(profile: ExactProfileResult, quantity: number, length: number): OrderSummary {
  const totalLinearMeters = quantity * length
  const totalProductWeightKg = totalLinearMeters * profile.weightPerMeter
  const orderSum = totalLinearMeters * profile.priceWithWaste
  const packagingSum = orderSum * 0.02
  const finalSum = orderSum + packagingSum

  const requiredRollLength = profile.countFromRoll > 0 ? totalLinearMeters / profile.countFromRoll : 0
  const rawMaterialWeightKg = requiredRollLength * (profile.rollWidth / 1000) * profile.specificWeight
  const rawMaterialWeightTons = rawMaterialWeightKg / 1000

  return {
    totalLinearMeters: round(totalLinearMeters, 3),
    totalProductWeightKg: round(totalProductWeightKg, 3),
    orderSum: round(orderSum, 3),
    packagingSum: round(packagingSum, 3),
    finalSum: round(finalSum, 3),
    requiredRollLength: round(requiredRollLength, 3),
    rawMaterialWeightKg: round(rawMaterialWeightKg, 3),
    rawMaterialWeightTons: round(rawMaterialWeightTons, 6),
  }
}
