import { PROFILE_LABELS, type ProfileType } from './constants'

const ru = (digits: number) =>
  new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })

export function formatNumber(value: number, digits = 2): string {
  if (!Number.isFinite(value)) return '—'
  return ru(digits).format(value)
}

export function formatThickness(value: number): string {
  return Number(value).toFixed(1).replace('.', ',')
}

export function formatPrice(value: number): string {
  if (!Number.isFinite(value)) return '—'
  return ru(2).format(value)
}

export interface ProfileNameInput {
  profileType: ProfileType
  wallHeight: number
  shelfWidthA: number
  shelfWidthB: number
  flangeC: number
  thickness: number
}

export function buildProfileName(p: ProfileNameInput): string {
  const profile = PROFILE_LABELS[p.profileType]
  const t = formatThickness(p.thickness)

  if (p.profileType === 'PP') {
    return `${profile} ${p.wallHeight}×${p.shelfWidthA} без перфор. ${t} (Оцинк.)`
  }
  if (p.profileType === 'PGS') {
    return `${profile} ${p.wallHeight}×${p.shelfWidthA}×${p.flangeC} без перфор. ${t} (Оцинк.)`
  }
  // Z
  return `${profile} ${p.wallHeight}×${p.shelfWidthA}×${p.shelfWidthB}×${p.flangeC} без перфор. ${t} (Оцинк.)`
}
