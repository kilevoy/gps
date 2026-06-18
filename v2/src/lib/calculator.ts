import { MATERIALS, type MaterialData, type ProfileType } from './constants'

export type { ProfileType, MaterialData }

export interface CalculatorInput {
  profileType: ProfileType
  /** Толщина, мм */
  thickness: number
  /** Высота стенки H, мм */
  wallHeight: number
  /** Ширина полки a, мм (для ПП — единственная полка) */
  shelfWidthA: number
  /** Ширина полки B, мм (только Z; для ПП/ПГС игнорируется) */
  shelfWidthB: number
  /** Отгибка C, мм (только ПГС и Z) */
  flangeC: number
  /** Цена за тонну, руб */
  pricePerTon: number
}

export interface CalculationResult {
  /** Ширина рулона, мм */
  rollWidth: number
  /** Длина развёртки L, мм */
  razvertka: number
  /** Прямые участки (сумма), мм */
  straightLength: number
  /** Прибавка от радиусов гибов, мм */
  bendsAddition: number
  /** Количество гибов */
  bendsCount: number
  /** Сколько полос профиля помещается в рулоне */
  countFromRoll: number
  /** Влезает ли вообще одна полоса в рулон */
  fitsInRoll: boolean
  /** Отход рулона при таком раскрое, мм */
  wasteMm: number
  /** Отход в процентах от ширины рулона */
  wastePercentage: number
  /** Вес 1 пог. метра профиля, кг */
  weightPerMeter: number
  /** Цена 1 пог. метра без учёта отхода, руб */
  priceNoWaste: number
  /** Цена 1 пог. метра с учётом отхода, руб */
  priceWithWaste: number
  /** Удельный вес рулона, кг/м */
  specificWeight: number
}

function getMaterialData(thickness: number): MaterialData {
  // Нормализуем ключ: 1 -> "1.0", 1.2 -> "1.2"
  const key = thickness.toFixed(1)
  const material = MATERIALS[key]
  if (!material) {
    throw new Error(`Толщина ${thickness} мм не поддерживается`)
  }
  return material
}

interface Geometry {
  bendsCount: number
  /** Сумма «полезных» прямых участков заготовки */
  straightLength: number
}

/**
 * Геометрия развёртки. Логика: каждая «полка» в развёртке считается как
 * её внешний размер минус смещение нейтральной линии у каждой смежной гибки.
 * Смещение на одну гибку: (rb + t) — это половина внешнего расхода металла,
 * формула эквивалентна расчётной базе старой версии калькулятора.
 *
 *   ПП  (П-образный, без отгибок):
 *     • 2 гиба
 *     • H + 2·a  − потери на 2 гиба от стенки и по 1 на каждую полку
 *
 *   ПГС (П-образный с отгибками):
 *     • 4 гиба
 *     • H + 2·a + 2·C
 *
 *   Z:
 *     • 4 гиба
 *     • H + a + B + 2·C   (полки a и B могут быть разными)
 */
function geometry(input: CalculatorInput, m: MaterialData): Geometry {
  const { profileType, wallHeight, shelfWidthA, shelfWidthB, flangeC } = input
  const k = m.rb + m.t // вычитаемое на каждую гибку, контактирующую с участком

  switch (profileType) {
    case 'PP': {
      // Стенка теряет по 2 (rb+t), полки — по 1 (rb+t)
      return {
        bendsCount: 2,
        straightLength: wallHeight - 2 * k + 2 * (shelfWidthA - k),
      }
    }
    case 'PGS': {
      // Стенка − 2k; каждая полка − 2k (две гибки на полку); каждая отгибка − 1k
      return {
        bendsCount: 4,
        straightLength:
          wallHeight - 2 * k + 2 * (shelfWidthA - 2 * k) + 2 * (flangeC - k),
      }
    }
    case 'PZ': {
      // У Z верхняя и нижняя полки разные. Каждая полка — 1 гибка к стенке + 1 к отгибке = 2k.
      return {
        bendsCount: 4,
        straightLength:
          wallHeight - 2 * k +
          (shelfWidthA - 2 * k) +
          (shelfWidthB - 2 * k) +
          2 * (flangeC - k),
      }
    }
  }
}

export function calculateExactResult(input: CalculatorInput): CalculationResult {
  const m = getMaterialData(input.thickness)
  const { bendsCount, straightLength } = geometry(input, m)

  // Прибавка от закруглений: длина дуги по нейтральной линии
  // R_neutral = rb + t/2; четверть окружности = π·R/2 на одну гибку 90°
  const rNeutral = m.rb + m.t / 2
  const bendsAddition = bendsCount * ((Math.PI * rNeutral) / 2)
  const razvertka = straightLength + bendsAddition

  const countFromRoll = razvertka > 0 ? Math.floor(m.rollWidth / razvertka) : 0
  const fitsInRoll = countFromRoll > 0
  const wasteMm = fitsInRoll ? m.rollWidth - countFromRoll * razvertka : m.rollWidth
  const wastePercentage = (wasteMm / m.rollWidth) * 100
  const weightPerMeter = (razvertka / 1000) * m.specificWeight

  const pricePerKg = input.pricePerTon / 1000
  const priceNoWaste = weightPerMeter * pricePerKg
  const rollPricePerM = m.specificWeight * (m.rollWidth / 1000) * pricePerKg
  const priceWithWaste = fitsInRoll ? rollPricePerM / countFromRoll : Number.POSITIVE_INFINITY

  return {
    rollWidth: m.rollWidth,
    razvertka,
    straightLength,
    bendsAddition,
    bendsCount,
    countFromRoll,
    fitsInRoll,
    wasteMm,
    wastePercentage,
    weightPerMeter,
    priceNoWaste,
    priceWithWaste,
    specificWeight: m.specificWeight,
  }
}
