import { useEffect, useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'
import { calculateExactResult, type CalculationResult } from '../lib/calculator'
import { type ProfileType } from '../lib/constants'
import { defaultFormValues, formSchema, type FormData } from '../lib/schema'
import { ParamsForm } from '../components/ParamsForm'
import { ProfileSchemaSvg, type DimensionKey } from '../components/ProfileSchemaSvg'
import { ResultPanel } from '../components/ResultPanel'
import { WasteMap } from '../components/WasteMap'

interface Props {
  isDark: boolean
}

export function CalculatorPage({ isDark }: Props) {
  const {
    register,
    control,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: defaultFormValues,
  })

  const watched = useWatch({ control }) as Partial<FormData>
  const profileType = (watched.profileType ?? 'PP') as ProfileType
  const [highlight, setHighlight] = useState<DimensionKey | null>(null)
  const [linkAB, setLinkAB] = useState(false)

  // Если a и B связаны — B всегда следует за a
  useEffect(() => {
    if (!linkAB) return
    if (profileType !== 'PZ') return
    const a = Number(watched.shelfWidthA)
    if (!Number.isFinite(a)) return
    if (Number(watched.shelfWidthB) !== a) {
      setValue('shelfWidthB', a, { shouldValidate: true, shouldDirty: true })
    }
  }, [linkAB, profileType, watched.shelfWidthA, watched.shelfWidthB, setValue])

  const normalized = useMemo<FormData | null>(() => {
    const parsed = formSchema.safeParse(watched)
    if (!parsed.success) return null
    const data = parsed.data
    const isZ = data.profileType === 'PZ'
    return {
      ...data,
      shelfWidthB: !isZ || linkAB ? data.shelfWidthA : data.shelfWidthB,
      flangeC: data.profileType === 'PP' ? 0 : data.flangeC,
    }
  }, [watched, linkAB])

  const calculation = useMemo<{
    result: CalculationResult | null
    serverError: string
  }>(() => {
    if (!normalized) return { result: null, serverError: '' }
    try {
      return { result: calculateExactResult(normalized), serverError: '' }
    } catch (e) {
      return {
        result: null,
        serverError: e instanceof Error ? e.message : 'Не удалось выполнить расчёт',
      }
    }
  }, [normalized])

  const nameInput = useMemo(
    () => {
      const a = Number(watched.shelfWidthA ?? defaultFormValues.shelfWidthA)
      const bRaw = Number(watched.shelfWidthB ?? defaultFormValues.shelfWidthB)
      return {
        profileType,
        wallHeight: Number(watched.wallHeight ?? defaultFormValues.wallHeight),
        shelfWidthA: a,
        shelfWidthB: profileType === 'PZ' && !linkAB ? bRaw : a,
        flangeC: Number(watched.flangeC ?? defaultFormValues.flangeC),
        thickness: Number(watched.thickness ?? defaultFormValues.thickness),
      }
    },
    [watched, profileType, linkAB],
  )

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(360px,440px)_minmax(0,1fr)]">
        <section className="surface p-6">
          <h2 className="h-display mb-4 text-xl">Параметры</h2>
          <ParamsForm
            register={register}
            errors={errors}
            profileType={profileType}
            onFocus={setHighlight}
          />
        </section>

        <section className="surface p-6">
          <ResultPanel
            result={calculation.result}
            serverError={calculation.serverError}
            nameInput={nameInput}
            schema={
              <ProfileSchemaSvg
                profile={profileType}
                highlight={highlight}
                className="w-full max-w-[360px]"
              />
            }
          />
        </section>
      </div>

      <section className="surface p-6">
        {normalized ? (
          <WasteMap
            values={normalized}
            isDark={isDark}
            linkAB={linkAB}
            onLinkABChange={setLinkAB}
            onPick={(cell) => {
              setValue('wallHeight', cell.wallHeight, { shouldValidate: true, shouldDirty: true })
              setValue('shelfWidthA', cell.shelfWidthA, { shouldValidate: true, shouldDirty: true })
              if (profileType !== 'PZ' || linkAB) {
                setValue('shelfWidthB', cell.shelfWidthA, { shouldValidate: true, shouldDirty: true })
              }
            }}
            onFlangeChange={(v) =>
              setValue('flangeC', v, { shouldValidate: true, shouldDirty: true })
            }
            onShelfBChange={(v) =>
              setValue('shelfWidthB', v, { shouldValidate: true, shouldDirty: true })
            }
          />
        ) : (
          <div className="surface-soft p-8 text-center text-sm text-ink-500 dark:text-ink-300">
            Заполните параметры — здесь появится тепловая карта подбора.
          </div>
        )}
      </section>
    </div>
  )
}
