import { type CalculationResult } from '../lib/calculator'
import { WASTE_OK_THRESHOLD } from '../lib/constants'
import { formatNumber, formatPrice, type ProfileNameInput, buildProfileName } from '../lib/formatters'
import { MetricCard } from './MetricCard'

interface Props {
  result: CalculationResult | null
  serverError: string
  nameInput: ProfileNameInput
  schema?: React.ReactNode
}

export function ResultPanel({ result, serverError, nameInput, schema }: Props) {
  const wasteState = !result
    ? 'neutral'
    : result.wastePercentage > WASTE_OK_THRESHOLD
      ? 'danger'
      : 'good'

  return (
    <div>
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="h-display text-xl">Результат расчёта</h2>
        {result && (
          <span
            className={`chip ${wasteState === 'danger' ? '' : ''}`}
            style={{
              background:
                wasteState === 'danger'
                  ? 'color-mix(in srgb, #fecdd3 80%, transparent)'
                  : 'color-mix(in srgb, #bbf7d0 80%, transparent)',
              color: wasteState === 'danger' ? '#9f1239' : '#166534',
              borderColor: 'transparent',
            }}
          >
            {wasteState === 'danger'
              ? `Отход > ${WASTE_OK_THRESHOLD}%`
              : `Отход ≤ ${WASTE_OK_THRESHOLD}%`}
          </span>
        )}
      </header>

      {serverError && (
        <div
          className="mb-4 rounded-2xl p-3 text-sm font-semibold"
          style={{
            background: 'color-mix(in srgb, #fecdd3 60%, transparent)',
            color: '#9f1239',
            border: '1px solid color-mix(in srgb, #fda4af 60%, transparent)',
          }}
        >
          {serverError}
        </div>
      )}

      {!result && !serverError && (
        <div className="surface-soft p-8 text-center text-sm text-ink-500 dark:text-ink-300">
          Заполните параметры — расчёт выполняется автоматически.
        </div>
      )}

      {result && (
        <div
          className="space-y-4 rounded-2xl p-3 transition-colors"
          style={{
            background:
              wasteState === 'danger'
                ? 'color-mix(in srgb, #fecdd3 35%, transparent)'
                : 'color-mix(in srgb, #bbf7d0 35%, transparent)',
            border: `1px solid ${
              wasteState === 'danger'
                ? 'color-mix(in srgb, #fda4af 70%, transparent)'
                : 'color-mix(in srgb, #86efac 70%, transparent)'
            }`,
          }}
        >
          <div
            className="rounded-2xl border p-4"
            style={{
              borderColor: 'color-mix(in srgb, var(--color-ink-200) 70%, transparent)',
              background: 'color-mix(in srgb, var(--color-brand-50) 50%, transparent)',
            }}
          >
            <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-500 dark:text-ink-300">
              Профиль
            </p>
            <p className="mt-2 text-lg font-extrabold tracking-tight text-ink-900 dark:text-ink-50">
              {buildProfileName(nameInput)}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <MetricCard label="Развёртка L" value={`${formatNumber(result.razvertka, 1)} мм`} />
            <MetricCard
              label="В рулоне помещается"
              value={result.fitsInRoll ? `${formatNumber(result.countFromRoll, 0)} шт` : 'не помещается'}
              hint={`ширина рулона ${formatNumber(result.rollWidth, 0)} мм`}
            />
            <MetricCard label="Отход" value={`${formatNumber(result.wasteMm)} мм`} />
            <MetricCard label="Отход, %" value={`${formatNumber(result.wastePercentage)} %`} />
            <MetricCard label="Вес 1 пог.м" value={`${formatNumber(result.weightPerMeter, 2)} кг`} />
            <MetricCard
              label="Длина прямых участков"
              value={`${formatNumber(result.straightLength)} мм`}
              hint={`+ дуги от ${result.bendsCount} гибов: ${formatNumber(result.bendsAddition)} мм`}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <MetricCard label="Цена без отхода" value={`${formatPrice(result.priceNoWaste)} руб/м`} />
            <MetricCard label="Цена с отходом" value={`${formatPrice(result.priceWithWaste)} руб/м`} emphasize />
          </div>

          {schema && (
            <div
              className="rounded-2xl border p-4 flex justify-center"
              style={{
                borderColor: 'color-mix(in srgb, var(--color-ink-200) 70%, transparent)',
                background: 'color-mix(in srgb, var(--color-ink-50) 60%, transparent)',
              }}
            >
              {schema}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
