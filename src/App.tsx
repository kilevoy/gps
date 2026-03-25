import { zodResolver } from '@hookform/resolvers/zod'
import { type ChangeEvent, type ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import {
  calculateExactResult,
  calculateOrderSummary,
  findOptimalProfiles,
  type CalculatorInput,
  type ExactProfileResult,
  type OptimizationResult,
  type ProfileType,
} from './lib/calculator'
import { findPopularStripsFromWaste, parseStripData, type StripRecord } from './lib/stripData'

const thicknessOptions = [1, 1.2, 1.5, 2, 2.5, 3]
const stripStorageKey = 'gps-strip-data-v1'
const stripInfoKey = 'gps-strip-info-v1'

interface StripCacheInfo {
  timestamp: string
  recordCount: number
  filename: string
}

const formSchema = z
  .object({
    profileType: z.enum(['PP', 'PGS', 'PZ']),
    thickness: z.number().refine((v) => thicknessOptions.includes(v), 'Недопустимая толщина'),
    wallHeight: z.number().min(100, 'Высота: 100-350 мм').max(350, 'Высота: 100-350 мм'),
    shelfWidthA: z.number().min(40, 'Полка A: 40-100 мм').max(100, 'Полка A: 40-100 мм'),
    shelfWidthB: z.number().min(40, 'Полка B: 40-95 мм').max(95, 'Полка B: 40-95 мм'),
    flangeC: z.number().min(13, 'Отгибка C: 13-27 мм').max(27, 'Отгибка C: 13-27 мм'),
    pricePerTon: z.number().positive('Цена должна быть больше 0'),
  })
  .superRefine((value, ctx) => {
    if (value.profileType !== 'PZ' && value.shelfWidthB !== value.shelfWidthA) {
      ctx.addIssue({
        path: ['shelfWidthB'],
        code: z.ZodIssueCode.custom,
        message: 'Для ПП/ПГС полка B должна быть равна A.',
      })
    }
    if (value.profileType === 'PP' && value.flangeC !== 0) {
      ctx.addIssue({
        path: ['flangeC'],
        code: z.ZodIssueCode.custom,
        message: 'Для ПП отгибка C должна быть 0.',
      })
    }
  })

type FormData = z.infer<typeof formSchema>

function formatNumber(value: number, digits = 2): string {
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value)
}

function profileLabel(value: ProfileType): string {
  if (value === 'PZ') return 'ПZ'
  if (value === 'PGS') return 'ПГС'
  return 'ПП'
}

function getRangesByProfile(type: ProfileType): { a: string; b: string; c: string } {
  if (type === 'PP') return { a: '40-100', b: '40-100', c: '-' }
  if (type === 'PGS') return { a: '40-100', b: '40-100', c: '13-27' }
  return { a: '40-100', b: '40-95', c: '13-27' }
}

function drawProfile(type: ProfileType): string {
  if (type === 'PZ') return 'M 16 80 L 48 80 L 48 64 L 88 64 L 88 28 L 120 28'
  if (type === 'PGS') return 'M 16 76 L 16 24 L 96 24 L 96 40 L 120 40 L 120 76 L 96 76'
  return 'M 16 80 L 16 24 L 120 24 L 120 80'
}

export default function App() {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [exactResult, setExactResult] = useState<ExactProfileResult | null>(null)
  const [optimizationResults, setOptimizationResults] = useState<OptimizationResult[]>([])
  const [popularStrips, setPopularStrips] = useState<StripRecord[]>([])
  const [selectedProfile, setSelectedProfile] = useState<ExactProfileResult | null>(null)
  const [stripData, setStripData] = useState<StripRecord[]>([])
  const [stripInfo, setStripInfo] = useState<StripCacheInfo | null>(null)
  const [uploadMessage, setUploadMessage] = useState<string>('')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [orderQuantity, setOrderQuantity] = useState<number>(100)
  const [orderLength, setOrderLength] = useState<number>(6)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      profileType: 'PP',
      thickness: 1.0,
      wallHeight: 120,
      shelfWidthA: 50,
      shelfWidthB: 50,
      flangeC: 0,
      pricePerTon: 160000,
    },
  })

  const profileType = watch('profileType')
  const ranges = getRangesByProfile(profileType)

  useEffect(() => {
    const storedData = localStorage.getItem(stripStorageKey)
    const storedInfo = localStorage.getItem(stripInfoKey)

    if (storedData) {
      try {
        const records = JSON.parse(storedData) as StripRecord[]
        setStripData(records)
      } catch {
        setStripData([])
      }
    }

    if (storedInfo) {
      try {
        setStripInfo(JSON.parse(storedInfo) as StripCacheInfo)
      } catch {
        setStripInfo(null)
      }
    }
  }, [])

  useEffect(() => {
    if (profileType === 'PP') {
      setValue('flangeC', 0)
      setValue('shelfWidthB', watch('shelfWidthA'))
      return
    }

    if (profileType === 'PGS') {
      setValue('shelfWidthB', watch('shelfWidthA'))
      if (watch('flangeC') === 0) {
        setValue('flangeC', 15)
      }
      return
    }

    if (watch('flangeC') === 0) {
      setValue('flangeC', 15)
    }
  }, [profileType, setValue, watch])

  const orderSummary = useMemo(() => {
    if (!selectedProfile) return null
    if (orderQuantity <= 0 || orderLength <= 0) return null
    return calculateOrderSummary(selectedProfile, orderQuantity, orderLength)
  }, [selectedProfile, orderQuantity, orderLength])

  const wasteState = useMemo(() => {
    if (!exactResult) return 'neutral'
    if (exactResult.wastePercentage > 10) return 'danger'
    return 'good'
  }, [exactResult])

  const onCalculate = (values: FormData): void => {
    setErrorMessage('')
    setUploadMessage('')

    try {
      const input: CalculatorInput = {
        ...values,
        shelfWidthB: values.profileType === 'PZ' ? values.shelfWidthB : values.shelfWidthA,
        flangeC: values.profileType === 'PP' ? 0 : values.flangeC,
      }

      const exact = calculateExactResult(input)
      const optimized = findOptimalProfiles(input)
      const recommended = findPopularStripsFromWaste(stripData, exact.wasteMm, input.thickness)

      setExactResult(exact)
      setOptimizationResults(optimized)
      setPopularStrips(recommended)
      setSelectedProfile(exact)
    } catch (error) {
      setExactResult(null)
      setOptimizationResults([])
      setPopularStrips([])
      setSelectedProfile(null)
      setErrorMessage(error instanceof Error ? error.message : 'Не удалось выполнить расчет.')
    }
  }

  const onFileUpload = async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const bytes = new Uint8Array(await file.arrayBuffer())
      let content = ''
      try {
        content = new TextDecoder('windows-1251').decode(bytes)
      } catch {
        content = new TextDecoder('utf-8').decode(bytes)
      }

      const parsed = parseStripData(content)
      if (parsed.length === 0) {
        setUploadMessage('Не удалось распознать строки штрипса в файле.')
        return
      }

      const info: StripCacheInfo = {
        timestamp: new Date().toISOString(),
        recordCount: parsed.length,
        filename: file.name,
      }

      localStorage.setItem(stripStorageKey, JSON.stringify(parsed))
      localStorage.setItem(stripInfoKey, JSON.stringify(info))

      setStripData(parsed)
      setStripInfo(info)
      setUploadMessage(`Файл загружен: ${parsed.length} записей.`)
    } catch {
      setUploadMessage('Ошибка чтения файла.')
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const clearStripCache = (): void => {
    localStorage.removeItem(stripStorageKey)
    localStorage.removeItem(stripInfoKey)
    setStripData([])
    setStripInfo(null)
    setPopularStrips([])
    setUploadMessage('Кэш остатков очищен.')
  }

  return (
    <main className="min-h-screen bg-[#edf1f7] px-3 py-4 font-sans text-slate-900 sm:px-5 sm:py-6">
      <div className="mx-auto max-w-[1320px] space-y-4">
        <header className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">Калькулятор профилей ИНСИ</h1>
              <p className="text-xs text-slate-500">Быстро, бесплатно, с оптимизацией отходов и учетом остатков</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge text="GitHub Pages" tone="blue" />
              <Badge text="v2.0" tone="gray" />
            </div>
          </div>
        </header>

        <div className="grid gap-4 xl:grid-cols-[340px_1fr_320px]">
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-700">Параметры расчета</h2>
            <form className="space-y-3" onSubmit={handleSubmit(onCalculate)}>
              <Field label="Тип профиля" error={errors.profileType?.message}>
                <select className="input" {...register('profileType')}>
                  <option value="PP">ПП</option>
                  <option value="PGS">ПГС</option>
                  <option value="PZ">ПZ</option>
                </select>
              </Field>

              <Field label="Толщина, мм" error={errors.thickness?.message}>
                <select className="input" {...register('thickness', { valueAsNumber: true })}>
                  {thicknessOptions.map((value) => (
                    <option key={value} value={value}>
                      {value.toFixed(1)}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Высота стенки, мм" error={errors.wallHeight?.message}>
                <input className="input" type="number" {...register('wallHeight', { valueAsNumber: true })} />
              </Field>

              <Field label={profileType === 'PZ' ? 'Полка A, мм' : 'Полки A и B, мм'} error={errors.shelfWidthA?.message}>
                <input className="input" type="number" {...register('shelfWidthA', { valueAsNumber: true })} />
              </Field>

              {profileType === 'PZ' && (
                <Field label="Полка B, мм" error={errors.shelfWidthB?.message}>
                  <input className="input" type="number" {...register('shelfWidthB', { valueAsNumber: true })} />
                </Field>
              )}

              {profileType !== 'PP' && (
                <Field label="Отгибка C, мм" error={errors.flangeC?.message}>
                  <input className="input" type="number" {...register('flangeC', { valueAsNumber: true })} />
                </Field>
              )}

              <Field label="Цена за тонну, руб." error={errors.pricePerTon?.message}>
                <input className="input" type="number" {...register('pricePerTon', { valueAsNumber: true })} />
              </Field>

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-2 w-full rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? 'Считаем...' : 'Рассчитать'}
              </button>
            </form>
          </section>

          <section className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-700">Технические характеристики</h2>
              <div className="grid gap-3 lg:grid-cols-[1fr_140px]">
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600">
                      <th className="border border-slate-200 px-2 py-2 text-left">Профиль</th>
                      <th className="border border-slate-200 px-2 py-2">H/mm</th>
                      <th className="border border-slate-200 px-2 py-2">A/mm</th>
                      <th className="border border-slate-200 px-2 py-2">B/mm</th>
                      <th className="border border-slate-200 px-2 py-2">C/mm</th>
                      <th className="border border-slate-200 px-2 py-2">T/mm</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-slate-200 px-2 py-2 text-left font-semibold">{profileLabel(profileType)}</td>
                      <td className="border border-slate-200 px-2 py-2 text-center">100-350</td>
                      <td className="border border-slate-200 px-2 py-2 text-center">{ranges.a}</td>
                      <td className="border border-slate-200 px-2 py-2 text-center">{ranges.b}</td>
                      <td className="border border-slate-200 px-2 py-2 text-center">{ranges.c}</td>
                      <td className="border border-slate-200 px-2 py-2 text-center">1.0-3.0</td>
                    </tr>
                  </tbody>
                </table>
                <div className="flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 p-2">
                  <svg width="120" height="80" viewBox="0 0 136 96" fill="none" aria-hidden="true">
                    <rect x="2" y="2" width="132" height="92" rx="10" fill="white" stroke="#d1d5db" />
                    <path d={drawProfile(profileType)} stroke="#2563eb" strokeWidth="6" strokeLinecap="round" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700">Результат расчета</h2>
                {exactResult && <Badge text={wasteState === 'danger' ? 'Отход > 10%' : 'Отход <= 10%'} tone={wasteState === 'danger' ? 'red' : 'green'} />}
              </div>

              {errorMessage && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{errorMessage}</div>
              )}

              {!exactResult && !errorMessage && (
                <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-8 text-center text-sm text-slate-500">
                  Введите параметры и нажмите «Рассчитать»
                </div>
              )}

              {exactResult && (
                <div className={`rounded-xl border p-3 ${wasteState === 'danger' ? 'border-rose-300 bg-rose-50' : 'border-emerald-300 bg-emerald-50'}`}>
                  <p className="mb-3 text-center text-sm font-bold text-slate-800">{exactResult.productName}</p>
                  <dl className="grid grid-cols-[1fr_auto] gap-y-1.5 text-xs">
                    <dt className="text-slate-600">Ширина рулона:</dt>
                    <dd className="font-semibold">{formatNumber(exactResult.rollWidth, 0)} мм</dd>
                    <dt className="text-slate-600">Ширина развертки:</dt>
                    <dd className="font-semibold">{formatNumber(exactResult.razvertka, 2)} мм</dd>
                    <dt className="text-slate-600">Количество из рулона:</dt>
                    <dd className="font-semibold">{formatNumber(exactResult.countFromRoll, 0)} шт</dd>
                    <dt className="text-slate-600">Отход:</dt>
                    <dd className="font-semibold">
                      {formatNumber(exactResult.wasteMm, 2)} мм ({formatNumber(exactResult.wastePercentage, 2)}%)
                    </dd>
                    <dt className="text-slate-600">Вес 1 пог.м:</dt>
                    <dd className="font-semibold">{formatNumber(exactResult.weightPerMeter, 3)} кг</dd>
                    <dt className="text-slate-600">Цена БЕЗ отхода:</dt>
                    <dd className="font-semibold">{formatNumber(exactResult.priceNoWaste, 2)} руб/м</dd>
                    <dt className="text-slate-800 font-bold">Цена С отходом:</dt>
                    <dd className="font-bold text-blue-700">{formatNumber(exactResult.priceWithWaste, 2)} руб/м</dd>
                  </dl>
                  <div className="mt-3 text-right">
                    <button
                      type="button"
                      onClick={() => setSelectedProfile(exactResult)}
                      className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                        selectedProfile?.productName === exactResult.productName
                          ? 'bg-blue-700 text-white'
                          : 'border border-blue-700 text-blue-700 hover:bg-blue-700 hover:text-white'
                      }`}
                    >
                      Выбрать
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>

          <section className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-700">Подбор штрипса из отхода</h2>

              <div className="mb-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt"
                  className="mb-2 block w-full text-xs text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-blue-700 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-blue-800"
                  onChange={onFileUpload}
                />
                {stripInfo && (
                  <div className="space-y-1 text-xs text-slate-600">
                    <p>
                      Загружено: <span className="font-semibold">{new Date(stripInfo.timestamp).toLocaleString('ru-RU')}</span>
                    </p>
                    <p>
                      Записей: <span className="font-semibold">{stripInfo.recordCount}</span>
                    </p>
                    <p>
                      Файл: <span className="font-semibold">{stripInfo.filename}</span>
                    </p>
                    <button type="button" onClick={clearStripCache} className="mt-1 rounded-md border border-rose-300 px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50">
                      Очистить данные
                    </button>
                  </div>
                )}
                {uploadMessage && <p className="mt-2 text-xs font-medium text-emerald-700">{uploadMessage}</p>}
              </div>

              <div className="max-h-[340px] space-y-2 overflow-y-auto pr-1">
                {popularStrips.length === 0 && (
                  <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-8 text-center text-xs text-slate-500">
                    Выполните расчет для рекомендаций или загрузите остатки
                  </div>
                )}
                {popularStrips.map((strip) => (
                  <article key={`${strip.name}-${strip.width}`} className="rounded-lg border border-slate-200 px-3 py-2 hover:border-blue-300 hover:bg-blue-50">
                    <p className="truncate text-xs font-semibold text-slate-800">{strip.name}</p>
                    <p className="mt-1 flex items-center justify-between text-[11px] text-slate-600">
                      <span>{formatNumber(strip.width, 1)} мм</span>
                      <span>{Math.round(strip.consumption).toLocaleString('ru-RU')} п.м</span>
                    </p>
                  </article>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-700">Оформление заказа</h2>
              {!selectedProfile && <p className="text-xs text-slate-500">Сначала выберите профиль в блоке результата или таблице оптимизации.</p>}
              {selectedProfile && (
                <div className="space-y-3">
                  <p className="rounded-lg bg-slate-50 px-2 py-1.5 text-xs font-semibold text-slate-700">{selectedProfile.productName}</p>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="text-xs text-slate-600">
                      Кол-во, шт
                      <input
                        type="number"
                        min={1}
                        value={orderQuantity}
                        onChange={(event) => setOrderQuantity(Number(event.target.value))}
                        className="input mt-1"
                      />
                    </label>
                    <label className="text-xs text-slate-600">
                      Длина, м
                      <input
                        type="number"
                        min={0.1}
                        step={0.1}
                        value={orderLength}
                        onChange={(event) => setOrderLength(Number(event.target.value))}
                        className="input mt-1"
                      />
                    </label>
                  </div>

                  {orderSummary && (
                    <dl className="grid grid-cols-[1fr_auto] gap-y-1 text-xs">
                      <dt className="text-slate-600">Общий метраж:</dt>
                      <dd className="font-semibold">{formatNumber(orderSummary.totalLinearMeters, 2)} м</dd>
                      <dt className="text-slate-600">Вес продукции:</dt>
                      <dd className="font-semibold">{formatNumber(orderSummary.totalProductWeightKg, 2)} кг</dd>
                      <dt className="text-slate-600">Сумма за продукцию:</dt>
                      <dd className="font-semibold">{formatNumber(orderSummary.orderSum, 2)} руб</dd>
                      <dt className="text-slate-600">Упаковка (2%):</dt>
                      <dd className="font-semibold">{formatNumber(orderSummary.packagingSum, 2)} руб</dd>
                      <dt className="font-bold text-slate-800">Итого:</dt>
                      <dd className="font-bold text-blue-700">{formatNumber(orderSummary.finalSum, 2)} руб</dd>
                    </dl>
                  )}
                </div>
              )}
            </div>
          </section>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-700">Оптимальные варианты (отход до 10%)</h2>
          {optimizationResults.length === 0 && (
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-8 text-center text-sm text-slate-500">
              Пока нет данных. Выполните расчет.
            </div>
          )}
          {optimizationResults.length > 0 && (
            <div className="max-h-[54vh] overflow-auto rounded-lg border border-slate-200">
              <table className="w-full min-w-[980px] border-collapse text-xs">
                <thead className="sticky top-0 z-10 bg-slate-100 text-slate-700">
                  <tr>
                    <th className="border border-slate-200 px-2 py-2 text-left">Название профиля</th>
                    <th className="border border-slate-200 px-2 py-2">A</th>
                    <th className="border border-slate-200 px-2 py-2">B</th>
                    <th className="border border-slate-200 px-2 py-2">C</th>
                    <th className="border border-slate-200 px-2 py-2">Развертка</th>
                    <th className="border border-slate-200 px-2 py-2">Кол-во</th>
                    <th className="border border-slate-200 px-2 py-2">Отход мм</th>
                    <th className="border border-slate-200 px-2 py-2">Отход %</th>
                    <th className="border border-slate-200 px-2 py-2">Вес кг/м</th>
                    <th className="border border-slate-200 px-2 py-2">Без отхода</th>
                    <th className="border border-slate-200 px-2 py-2">С отходом</th>
                    <th className="border border-slate-200 px-2 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {optimizationResults.map((item) => {
                    const isBest = item.wastePercentage <= 3
                    const isSelected = selectedProfile?.productName === item.productName
                    return (
                      <tr key={item.productName + item.a + item.b + item.c} className={`${isBest ? 'bg-emerald-50' : 'bg-white'} ${isSelected ? 'ring-2 ring-blue-400' : ''}`}>
                        <td className="border border-slate-200 px-2 py-1.5 text-left font-medium">{item.productName}</td>
                        <td className="border border-slate-200 px-2 py-1.5 text-center">{item.a}</td>
                        <td className="border border-slate-200 px-2 py-1.5 text-center">{item.profileType === 'PZ' ? item.b : '-'}</td>
                        <td className="border border-slate-200 px-2 py-1.5 text-center">{item.profileType === 'PP' ? '-' : item.c}</td>
                        <td className="border border-slate-200 px-2 py-1.5 text-center">{formatNumber(item.razvertka, 2)}</td>
                        <td className="border border-slate-200 px-2 py-1.5 text-center">{item.countFromRoll}</td>
                        <td className="border border-slate-200 px-2 py-1.5 text-center">{formatNumber(item.wasteMm, 2)}</td>
                        <td className="border border-slate-200 px-2 py-1.5 text-center">{formatNumber(item.wastePercentage, 2)}</td>
                        <td className="border border-slate-200 px-2 py-1.5 text-center">{formatNumber(item.weightPerMeter, 3)}</td>
                        <td className="border border-slate-200 px-2 py-1.5 text-center">{formatNumber(item.priceNoWaste, 2)}</td>
                        <td className="border border-slate-200 px-2 py-1.5 text-center">{formatNumber(item.priceWithWaste, 2)}</td>
                        <td className="border border-slate-200 px-2 py-1.5 text-center">
                          <button
                            type="button"
                            onClick={() => setSelectedProfile(item)}
                            className={`rounded-md px-2 py-1 text-xs font-semibold ${
                              isSelected ? 'bg-blue-700 text-white' : 'border border-blue-700 text-blue-700 hover:bg-blue-700 hover:text-white'
                            }`}
                          >
                            Выбрать
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}

function Field(props: { label: string; error?: string; children: ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">{props.label}</span>
      {props.children}
      {props.error && <p className="field-error">{props.error}</p>}
    </label>
  )
}

function Badge(props: { text: string; tone: 'blue' | 'gray' | 'green' | 'red' }) {
  const tones: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-700',
    gray: 'bg-slate-100 text-slate-700',
    green: 'bg-emerald-100 text-emerald-700',
    red: 'bg-rose-100 text-rose-700',
  }

  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${tones[props.tone]}`}>{props.text}</span>
}
