import type { UseFormRegister, FieldErrors } from 'react-hook-form'
import { RANGES, THICKNESS_OPTIONS, type ProfileType } from '../lib/constants'
import { formatThickness } from '../lib/formatters'
import type { FormData } from '../lib/schema'
import type { DimensionKey } from './ProfileSchemaSvg'

interface Props {
  register: UseFormRegister<FormData>
  errors: FieldErrors<FormData>
  profileType: ProfileType
  onFocus: (k: DimensionKey | null) => void
}

export function ParamsForm({ register, errors, profileType, onFocus }: Props) {
  const showShelfB = profileType === 'PZ'
  const showFlangeC = profileType !== 'PP'

  return (
    <form className="space-y-4" onMouseLeave={() => onFocus(null)}>
      <Field label="Тип профиля">
        <select className="input" {...register('profileType')}>
          <option value="PP">ПП — П-образный</option>
          <option value="PGS">ПГС</option>
          <option value="PZ">Z</option>
        </select>
      </Field>

      <Field label="Толщина металла, мм" hint="t — справочное, влияет на радиус гиба и удельный вес">
        <div onFocus={() => onFocus('t')} onMouseEnter={() => onFocus('t')}>
          <select className="input" {...register('thickness', { valueAsNumber: true })}>
            {THICKNESS_OPTIONS.map((v) => (
              <option key={v} value={v}>
                {formatThickness(v)} мм
              </option>
            ))}
          </select>
        </div>
      </Field>

      <Field
        label={`Высота стенки H, мм`}
        hint={`диапазон ${RANGES.H.min}–${RANGES.H.max}`}
        error={errors.wallHeight?.message}
      >
        <input
          className={`input tabular ${errors.wallHeight ? 'input-invalid' : ''}`}
          type="number"
          step={1}
          min={RANGES.H.min}
          max={RANGES.H.max}
          onFocus={() => onFocus('H')}
          onMouseEnter={() => onFocus('H')}
          {...register('wallHeight', { valueAsNumber: true })}
        />
      </Field>

      <Field
        label={profileType === 'PZ' ? 'Полка a (верхняя), мм' : 'Полка B, мм'}
        hint={`диапазон ${RANGES.a.min}–${RANGES.a.max}`}
        error={errors.shelfWidthA?.message}
      >
        <input
          className={`input tabular ${errors.shelfWidthA ? 'input-invalid' : ''}`}
          type="number"
          step={1}
          min={RANGES.a.min}
          max={RANGES.a.max}
          onFocus={() => onFocus('a')}
          onMouseEnter={() => onFocus('a')}
          {...register('shelfWidthA', { valueAsNumber: true })}
        />
      </Field>

      {showShelfB && (
        <Field
          label="Полка B (нижняя), мм"
          hint={`диапазон ${RANGES.B.min}–${RANGES.B.max}. У Z может отличаться от a.`}
          error={errors.shelfWidthB?.message}
        >
          <input
            className={`input tabular ${errors.shelfWidthB ? 'input-invalid' : ''}`}
            type="number"
            step={1}
            min={RANGES.B.min}
            max={RANGES.B.max}
            onFocus={() => onFocus('B')}
            onMouseEnter={() => onFocus('B')}
            {...register('shelfWidthB', { valueAsNumber: true })}
          />
        </Field>
      )}

      {showFlangeC && (
        <Field
          label="Отгибка C, мм"
          hint={`диапазон ${RANGES.C.min}–${RANGES.C.max}`}
          error={errors.flangeC?.message}
        >
          <input
            className={`input tabular ${errors.flangeC ? 'input-invalid' : ''}`}
            type="number"
            step={1}
            min={RANGES.C.min}
            max={RANGES.C.max}
            onFocus={() => onFocus('C')}
            onMouseEnter={() => onFocus('C')}
            {...register('flangeC', { valueAsNumber: true })}
          />
        </Field>
      )}

      <Field
        label="Цена за тонну, руб"
        hint="без НДС, для расчёта стоимости 1 пог. метра"
        error={errors.pricePerTon?.message}
      >
        <input
          className={`input tabular ${errors.pricePerTon ? 'input-invalid' : ''}`}
          type="number"
          step={500}
          min={0}
          {...register('pricePerTon', { valueAsNumber: true })}
        />
      </Field>
    </form>
  )
}

interface FieldProps {
  label: string
  hint?: string
  error?: string
  children: React.ReactNode
}
function Field({ label, hint, error, children }: FieldProps) {
  return (
    <label className="block">
      <span className="field-label">{label}</span>
      {children}
      {error ? <p className="field-error">{error}</p> : hint ? <p className="field-hint">{hint}</p> : null}
    </label>
  )
}
