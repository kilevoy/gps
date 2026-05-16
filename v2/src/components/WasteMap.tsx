import { useMemo } from 'react'
import { calculateExactResult } from '../lib/calculator'
import { PROFILE_LABELS, RANGES, type ProfileType } from '../lib/constants'
import { formatNumber, formatThickness } from '../lib/formatters'
import { getWasteColors } from '../lib/wasteColors'
import type { FormData } from '../lib/schema'

interface Props {
  values: FormData
  isDark: boolean
  linkAB: boolean
  onLinkABChange: (v: boolean) => void
  onPick: (cell: { wallHeight: number; shelfWidthA: number }) => void
  onFlangeChange: (v: number) => void
  onShelfBChange: (v: number) => void
}

export function WasteMap({
  values,
  isDark,
  linkAB,
  onLinkABChange,
  onPick,
  onFlangeChange,
  onShelfBChange,
}: Props) {
  const profileType: ProfileType = values.profileType
  const showFlangeC = profileType !== 'PP'
  const showShelfB = profileType === 'PZ'

  const wallHeights = useMemo(
    () => buildTicks(RANGES.H.min, RANGES.H.max, RANGES.H.step),
    [],
  )
  const shelfWidths = useMemo(
    () => buildTicks(RANGES.a.min, RANGES.a.max, RANGES.a.step),
    [],
  )

  const map = useMemo(() => {
    return wallHeights.map((wallHeight) =>
      shelfWidths.map((shelfWidthA) => {
        const next = calculateExactResult({
          ...values,
          wallHeight,
          shelfWidthA,
          // ПП/ПГС: B = a (полок одна и та же ширина).
          // Z: если установлена связка a=B — тоже B = a, иначе B зафиксирован пользователем.
          shelfWidthB:
            profileType === 'PZ' && !linkAB ? values.shelfWidthB : shelfWidthA,
        })
        return {
          wallHeight,
          shelfWidthA,
          wastePercentage: next.wastePercentage,
          fitsInRoll: next.fitsInRoll,
        }
      }),
    )
  }, [profileType, values, wallHeights, shelfWidths, linkAB])

  return (
    <div>
      <header className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="h-display text-xl">Подбор выгодного профиля</h2>
          <span className="chip chip-brand">{PROFILE_LABELS[profileType]}</span>
          <span className="chip">t {formatThickness(values.thickness)} мм</span>
          {showFlangeC && <span className="chip">C {formatNumber(values.flangeC, 0)} мм</span>}
          {profileType === 'PZ' && (
            <span className="chip">
              B {linkAB ? '= a' : `${formatNumber(values.shelfWidthB, 0)} мм`}
            </span>
          )}
        </div>
        <Legend />
      </header>

      <p className="mb-3 text-xs font-medium text-ink-500 dark:text-ink-300">
        По оси X — полка a, по оси Y — высота стенки H. Клик по ячейке подставит размеры в форму.
      </p>

      {(showFlangeC || showShelfB) && (
        <div className="mb-4 grid gap-3 sm:grid-cols-2">
          {showFlangeC && (
            <SliderCard
              label="Отгибка C"
              value={values.flangeC}
              min={RANGES.C.min}
              max={RANGES.C.max}
              step={RANGES.C.step}
              accent="amber"
              onChange={onFlangeChange}
            />
          )}
          {showShelfB && (
            <SliderCard
              label="Полка B"
              value={values.shelfWidthB}
              min={RANGES.B.min}
              max={RANGES.B.max}
              step={RANGES.B.step}
              accent="brand"
              disabled={linkAB}
              onChange={onShelfBChange}
              afterLabel={
                <label className="flex items-center gap-1.5 text-xs font-bold text-brand-800 dark:text-brand-200 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="h-3.5 w-3.5 accent-brand-600"
                    checked={linkAB}
                    onChange={(e) => onLinkABChange(e.target.checked)}
                  />
                  a = B
                </label>
              }
            />
          )}
        </div>
      )}

      <div className="overflow-x-auto thin-scroll">
        <table className="w-full table-fixed border-separate border-spacing-0.5 sm:border-spacing-1">
          <thead>
            <tr>
              <th className="w-12 px-1 py-2 text-right text-[10px] font-bold uppercase text-ink-400 sm:w-16 sm:text-xs">
                H \ a
              </th>
              {shelfWidths.map((w) => (
                <th
                  key={w}
                  className="px-0.5 py-2 text-center text-[10px] font-bold uppercase text-ink-400 sm:text-xs"
                >
                  {w}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {map.map((row) => (
              <tr key={row[0].wallHeight}>
                <th className="px-1 py-1 text-right text-[10px] font-bold text-ink-400 sm:text-xs">
                  {row[0].wallHeight}
                </th>
                {row.map((cell) => {
                  const isSelected =
                    cell.wallHeight === values.wallHeight &&
                    cell.shelfWidthA === values.shelfWidthA
                  const colors = getWasteColors(cell.wastePercentage, isDark)
                  return (
                    <td key={`${cell.wallHeight}-${cell.shelfWidthA}`} className="p-0.5">
                      <button
                        type="button"
                        onClick={() => onPick(cell)}
                        title={`H ${cell.wallHeight} мм, a ${cell.shelfWidthA} мм: ${formatNumber(
                          cell.wastePercentage,
                        )}%${!cell.fitsInRoll ? ' (не помещается в рулон)' : ''}`}
                        className={`flex h-7 w-full cursor-pointer items-center justify-center rounded-md text-[10px] font-extrabold transition hover:scale-[1.05] hover:shadow-md focus:outline-none focus:ring-2 sm:h-9 sm:rounded-lg sm:text-xs ${
                          isSelected ? 'ring-2 ring-offset-1 ring-offset-white dark:ring-offset-ink-900' : ''
                        }`}
                        style={{
                          background: colors.background,
                          color: colors.text,
                          boxShadow: isSelected ? '0 0 0 2px var(--color-brand-500)' : undefined,
                        }}
                      >
                        {cell.fitsInRoll ? formatNumber(cell.wastePercentage, 1) : '×'}
                      </button>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-center text-xs font-bold uppercase tracking-wider text-ink-400">
        Полка a, мм
      </p>
    </div>
  )
}

function Legend() {
  const ranges = [
    { label: '0–5%', color: '#dcfce7' },
    { label: '5–10%', color: '#fef9c3' },
    { label: '10–20%', color: '#fed7aa' },
    { label: '20–35%', color: '#fecdd3' },
    { label: '> 35%', color: '#fda4af' },
  ]
  return (
    <div className="flex flex-wrap gap-1.5">
      {ranges.map((r) => (
        <span
          key={r.label}
          className="rounded-full px-2.5 py-0.5 text-[11px] font-bold text-ink-700"
          style={{ background: r.color }}
        >
          {r.label}
        </span>
      ))}
    </div>
  )
}

function buildTicks(min: number, max: number, step: number): number[] {
  const ticks: number[] = []
  for (let v = min; v <= max + 1e-6; v += step) {
    ticks.push(Number(v.toFixed(2)))
  }
  return ticks
}

interface SliderCardProps {
  label: string
  value: number
  min: number
  max: number
  step: number
  accent: 'amber' | 'brand'
  disabled?: boolean
  afterLabel?: React.ReactNode
  onChange: (v: number) => void
}

function SliderCard({
  label,
  value,
  min,
  max,
  step,
  accent,
  disabled = false,
  afterLabel,
  onChange,
}: SliderCardProps) {
  const palette =
    accent === 'amber'
      ? {
          bg: 'color-mix(in srgb, #fef3c7 60%, transparent)',
          border: 'color-mix(in srgb, #fcd34d 60%, transparent)',
          text: '#78350f',
        }
      : {
          bg: 'color-mix(in srgb, var(--color-brand-100) 60%, transparent)',
          border: 'color-mix(in srgb, var(--color-brand-300) 50%, transparent)',
          text: 'var(--color-brand-800)',
        }

  return (
    <div
      className="rounded-2xl p-4"
      style={{
        background: palette.bg,
        border: `1px solid ${palette.border}`,
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-sm font-extrabold" style={{ color: palette.text }}>
            {label}
          </span>
          {afterLabel}
        </div>
        <span className="chip" style={{ background: '#fff', color: '#0f172a' }}>
          {formatNumber(value, 0)} мм
        </span>
      </div>
      <input
        type="range"
        className="slider"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
      />
      <div
        className="mt-2 flex justify-between text-xs font-bold"
        style={{ color: palette.text, opacity: 0.7 }}
      >
        <span>{min} мм</span>
        <span>{max} мм</span>
      </div>
    </div>
  )
}
