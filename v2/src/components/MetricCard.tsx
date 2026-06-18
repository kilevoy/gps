interface Props {
  label: string
  value: string
  hint?: string
  emphasize?: boolean
}

export function MetricCard({ label, value, hint, emphasize = false }: Props) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        emphasize
          ? 'border-brand-200 bg-brand-50/70 dark:border-brand-700/60 dark:bg-brand-700/20'
          : 'border-ink-200 bg-white dark:border-ink-700/60 dark:bg-ink-800/60'
      }`}
      style={{
        borderColor: emphasize
          ? 'color-mix(in srgb, var(--color-brand-300) 70%, transparent)'
          : 'color-mix(in srgb, var(--color-ink-200) 80%, transparent)',
      }}
    >
      <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-500 dark:text-ink-300">
        {label}
      </p>
      <p
        className={`mt-1 tabular ${
          emphasize
            ? 'text-2xl font-extrabold text-brand-700 dark:text-brand-200'
            : 'text-xl font-bold text-ink-900 dark:text-ink-50'
        }`}
      >
        {value}
      </p>
      {hint && <p className="mt-1 text-[11px] font-medium text-ink-400 dark:text-ink-400">{hint}</p>}
    </div>
  )
}
