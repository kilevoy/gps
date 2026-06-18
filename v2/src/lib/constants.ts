/**
 * Единая точка истины для всех «справочных» значений калькулятора.
 * Используется и в Zod-схеме, и в калькуляторе, и в UI (слайдеры/таблицы).
 */

export type ProfileType = 'PP' | 'PGS' | 'PZ'

export interface MaterialData {
  /** Толщина металла, мм */
  t: number
  /** Радиус гиба по внутренней поверхности, мм */
  rb: number
  /** Ширина рулона, мм */
  rollWidth: number
  /** Удельный вес погонного метра рулона выбранной ширины, кг/м */
  specificWeight: number
}

/** Допустимые толщины и сопутствующие материальные параметры */
export const MATERIALS: Record<string, MaterialData> = {
  '1.0': { t: 1.0, rb: 3.0, rollWidth: 1250, specificWeight: 7.5056 },
  '1.2': { t: 1.2, rb: 3.2, rollWidth: 1250, specificWeight: 9.2304 },
  '1.5': { t: 1.5, rb: 3.5, rollWidth: 1250, specificWeight: 11.852 },
  '2.0': { t: 2.0, rb: 4.0, rollWidth: 1250, specificWeight: 15.67696 },
  '2.5': { t: 2.5, rb: 4.5, rollWidth: 1000, specificWeight: 19.62 },
  '3.0': { t: 3.0, rb: 5.0, rollWidth: 1000, specificWeight: 23.5 },
}

/** Толщины как числа (отсортированно). */
export const THICKNESS_OPTIONS = Object.values(MATERIALS)
  .map((m) => m.t)
  .sort((a, b) => a - b)

export const RANGES = {
  /** Высота стенки H */
  H: { min: 100, max: 350, step: 10 },
  /** Ширина полки a (верх Z / полка ПП и ПГС) */
  a: { min: 40, max: 100, step: 5 },
  /** Ширина полки B (низ Z) */
  B: { min: 40, max: 100, step: 5 },
  /** Отгибка C (только ПГС и Z) */
  C: { min: 13, max: 27, step: 1 },
  /** Цена за тонну — без жёстких границ */
  pricePerTon: { min: 1, max: 10_000_000, step: 1000 },
} as const

export const DEFAULT_PRICE_PER_TON = 160_000

export const PROFILE_LABELS: Record<ProfileType, string> = {
  PP: 'ПП',
  PGS: 'ПГС',
  PZ: 'Z',
}

export const PROFILE_FULL_NAMES: Record<ProfileType, string> = {
  PP: 'П-образный (ПП / ТПП)',
  PGS: 'ПГС с отгибками',
  PZ: 'Z-образный с отгибками',
}

/** Норматив отхода: до этого значения отход считается «приемлемым» */
export const WASTE_OK_THRESHOLD = 5
