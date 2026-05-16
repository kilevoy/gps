/**
 * Палитра «отхода» для тепловой карты подбора профиля.
 * Возвращаются hex для inline style (для согласованности светлой/тёмной темы
 * мы держим один набор тёплых тонов, контрастных на обоих фонах).
 */

export interface WasteColors {
  background: string
  text: string
}

export function getWasteColors(percentage: number, dark = false): WasteColors {
  if (percentage <= 5) {
    return dark
      ? { background: '#10381f', text: '#bbf7d0' }
      : { background: '#dcfce7', text: '#0f5132' }
  }
  if (percentage <= 10) {
    return dark
      ? { background: '#3a3008', text: '#fde68a' }
      : { background: '#fef9c3', text: '#713f12' }
  }
  if (percentage <= 20) {
    return dark
      ? { background: '#3a210a', text: '#fdba74' }
      : { background: '#fed7aa', text: '#7c2d12' }
  }
  if (percentage <= 35) {
    return dark
      ? { background: '#3b1722', text: '#fda4af' }
      : { background: '#fecdd3', text: '#7f1d1d' }
  }
  return dark
    ? { background: '#4b1421', text: '#fda4af' }
    : { background: '#fda4af', text: '#7f1d1d' }
}
