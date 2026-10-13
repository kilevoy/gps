import { useMemo, useState } from 'react'
import { calculateUnified, getSigmaGeometry, type CalculatorMode, type ProfileType } from './lib/unifiedCalculator'

const thicknesses = [1, 1.2, 1.5, 2, 2.5, 3]
const sigmaHeights = [200, 245, 300]

function fmt(value: number, digits = 2) {
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value)
}

function statusText(status: string) {
  if (status === 'GOST_LGS2') return 'ГОСТ + LGS-2'
  if (status === 'GOST_ONLY') return 'ГОСТ / недоступен LGS-2'
  if (status === 'LGS2_NONSTANDARD') return 'Нестандарт LGS-2'
  return 'Недоступен'
}

function statusClass(status: string) {
  if (status === 'GOST_LGS2') return 'border-emerald-200 bg-emerald-50 text-emerald-800'
  if (status === 'LGS2_NONSTANDARD') return 'border-sky-200 bg-sky-50 text-sky-800'
  if (status === 'GOST_ONLY') return 'border-amber-200 bg-amber-50 text-amber-800'
  return 'border-rose-200 bg-rose-50 text-rose-800'
}

function Metric({ label, value, note, accent = false }: { label: string; value: string; note: string; accent?: boolean }) {
  return (
    <div className={`rounded-2xl border p-5 ${accent ? 'border-slate-800 bg-slate-900 text-white' : 'border-slate-200 bg-white'}`}>
      <div className={`text-xs font-bold uppercase tracking-[0.16em] ${accent ? 'text-slate-300' : 'text-slate-500'}`}>{label}</div>
      <div className="mt-2 text-3xl font-extrabold tracking-tight">{value}</div>
      <div className={`mt-2 text-xs leading-5 ${accent ? 'text-slate-300' : 'text-slate-500'}`}>{note}</div>
    </div>
  )
}

export default function UnifiedApp() {
  const [mode, setMode] = useState<CalculatorMode>('GOST')
  const [profileType, setProfileType] = useState<ProfileType>('PGS')
  const [thickness, setThickness] = useState(2)
  const [wallHeight, setWallHeight] = useState(200)
  const [shelfWidthA, setShelfWidthA] = useState(70)
  const [shelfWidthB, setShelfWidthB] = useState(70)
  const [flangeC1, setFlangeC1] = useState(18)
  const [flangeC2, setFlangeC2] = useState(18)
  const [pricePerTon, setPricePerTon] = useState(145000)

  function selectProfile(next: ProfileType) {
    setProfileType(next)
    if (next === 'SIGMA') {
      setMode('LGS2')
      setWallHeight(200)
      setShelfWidthA(65)
      setShelfWidthB(65)
      setFlangeC1(20)
      setFlangeC2(20)
    }
  }

  const result = useMemo(() => {
    try {
      const symmetricShelf = profileType === 'PP' || profileType === 'PGS'
      return calculateUnified({
        mode,
        profileType,
        thickness,
        wallHeight,
        shelfWidthA,
        shelfWidthB: symmetricShelf ? shelfWidthA : shelfWidthB,
        flangeC1: profileType === 'PP' ? 0 : flangeC1,
        flangeC2: profileType === 'PP' ? 0 : flangeC2,
        pricePerTon,
      })
    } catch {
      return null
    }
  }, [mode, profileType, thickness, wallHeight, shelfWidthA, shelfWidthB, flangeC1, flangeC2, pricePerTon])

  const sketchB = profileType === 'PP' || profileType === 'PGS' ? shelfWidthA : shelfWidthB

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-6 overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
          <div className="grid gap-6 p-6 lg:grid-cols-[1fr_auto] lg:items-end lg:p-8">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.22em] text-orange-700">ИНСИ · ЛСТК · единое расчётное ядро</div>
              <h1 className="mt-3 font-['Exo_2'] text-3xl font-bold tracking-tight sm:text-4xl">Калькулятор ГОСТ + LGS-2</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                Один профиль — две модели расчёта: инженерная геометрия и производственная технология LGS-2. Раскрой и коммерческий вес считаются по проверенной логике GPS.
              </p>
            </div>
            <div className="inline-flex rounded-2xl border border-slate-200 bg-slate-100 p-1.5">
              {(['GOST', 'LGS2'] as CalculatorMode[]).map((item) => {
                const disabled = item === 'GOST' && profileType === 'SIGMA'
                return (
                  <button
                    key={item}
                    type="button"
                    disabled={disabled}
                    title={disabled ? 'Sigma сейчас доступна только в режиме LGS-2' : undefined}
                    onClick={() => setMode(item)}
                    className={`rounded-xl px-5 py-2.5 text-sm font-extrabold transition ${mode === item ? 'bg-slate-900 text-white shadow' : 'text-slate-600 hover:text-slate-950'} disabled:cursor-not-allowed disabled:opacity-35`}
                  >
                    {item === 'GOST' ? 'ГОСТ' : 'LGS-2'}
                  </button>
                )
              })}
            </div>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
          <section className="h-fit rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm lg:sticky lg:top-5">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-extrabold">Параметры профиля</h2>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{mode === 'GOST' ? 'нормативный режим' : 'возможности станка'}</span>
            </div>

            <div className="space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">Тип профиля</span>
                <select className="input" value={profileType} onChange={(e) => selectProfile(e.target.value as ProfileType)}>
                  <option value="PP">ПП / U</option>
                  <option value="PGS">ПГС / C</option>
                  <option value="PZ">ПZ / Z</option>
                  <option value="SIGMA">ПГС-Сигма / Sigma · LGS-2</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">Толщина t, мм</span>
                <select className="input" value={thickness} onChange={(e) => setThickness(Number(e.target.value))}>
                  {thicknesses.map((t) => <option key={t} value={t}>{t.toFixed(1)}</option>)}
                </select>
              </label>

              <div className="grid grid-cols-2 gap-3">
                {profileType === 'SIGMA' ? (
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">H, мм</span>
                    <select className="input" value={wallHeight} onChange={(e) => setWallHeight(Number(e.target.value))}>
                      {sigmaHeights.map((H) => <option key={H} value={H}>{H}</option>)}
                    </select>
                  </label>
                ) : (
                  <NumberField label="H, мм" value={wallHeight} setValue={setWallHeight} />
                )}

                <NumberField label={profileType === 'PZ' ? 'B₁ / A, мм' : profileType === 'SIGMA' ? 'A, мм' : 'B / A, мм'} value={shelfWidthA} setValue={setShelfWidthA} />
                {(profileType === 'PZ' || profileType === 'SIGMA') && <NumberField label={profileType === 'SIGMA' ? 'B, мм' : 'B₂, мм'} value={shelfWidthB} setValue={setShelfWidthB} />}
                {profileType !== 'PP' && <NumberField label="C₁, мм" value={flangeC1} setValue={setFlangeC1} />}
                {profileType !== 'PP' && <NumberField label="C₂, мм" value={flangeC2} setValue={setFlangeC2} />}
              </div>

              <NumberField label="Цена, ₽/т" value={pricePerTon} setValue={setPricePerTon} />
            </div>

            <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-xs leading-5 text-slate-600">
              <b>ГОСТ</b> проверяется по перенесённому набору «ГОСТ Р 58384 ∩ LGS-2». <b>LGS-2</b> проверяется отдельно по ограничениям оборудования и ширине технологической полосы 180–625 мм.
            </div>
          </section>

          <section className="space-y-6">
            {result ? (
              <>
                <div className={`rounded-[24px] border p-5 ${statusClass(result.status)}`}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-bold uppercase tracking-[0.16em] opacity-70">Статус профиля</div>
                      <div className="mt-1 text-xl font-extrabold">{statusText(result.status)}</div>
                    </div>
                    <div className="flex gap-2 text-xs font-bold">
                      <span className="rounded-full border border-current/20 px-3 py-1.5">ГОСТ: {result.gostIntersectionMatched ? 'да' : 'нет'}</span>
                      <span className="rounded-full border border-current/20 px-3 py-1.5">LGS-2: {result.lgs2StripAllowed ? 'да' : 'нет'}</span>
                    </div>
                  </div>
                  {result.reasons.length > 0 && <div className="mt-3 text-sm">{result.reasons.join(' · ')}</div>}
                </div>

                {!result.technologyModelValidated && (
                  <div className="rounded-[24px] border border-amber-300 bg-amber-50 p-5 text-amber-950">
                    <div className="text-xs font-extrabold uppercase tracking-[0.16em] text-amber-700">Требуется производственная верификация</div>
                    <div className="mt-2 text-sm leading-6">{result.technologyModelNote}</div>
                  </div>
                )}

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <Metric label="Теоретическая развёртка" value={`${fmt(result.theoreticalDevelopment)} мм`} note="Нейтральная линия, инженерная геометрия" />
                  <Metric label="Ширина заготовки LGS-2" value={`${fmt(result.technologicalDevelopment)} мм`} note={result.technologyModelValidated ? 'Технологическая формула GPS / оборудование' : 'Предварительная модель Sigma — до сверки с техкартой'} accent />
                  <Metric label="Теоретическая масса" value={`${fmt(result.theoreticalWeightPerMeter, 3)} кг/м`} note="Номинальная толщина, ρ = 7850 кг/м³" />
                  <Metric label="Производственная масса" value={`${fmt(result.productionWeightPerMeter, 3)} кг/м`} note="Фактический удельный вес GPS / 1С" accent />
                </div>

                <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                  <ProfileSketch
                    profileType={profileType}
                    H={wallHeight}
                    A={shelfWidthA}
                    B={sketchB}
                    C1={profileType === 'PP' ? 0 : flangeC1}
                    C2={profileType === 'PP' ? 0 : flangeC2}
                  />

                  <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="text-lg font-extrabold">Сравнение моделей</h2>
                    <div className="mt-5 space-y-4">
                      <CompareRow label="Δ развёртки" value={`${fmt(result.developmentDeltaMm)} мм`} sub={`${fmt(result.developmentDeltaPct)} %`} />
                      <CompareRow label="Δ массы" value={`${fmt(result.weightDeltaKgPerM, 3)} кг/м`} sub={`${fmt(result.weightDeltaPct)} %`} />
                      <CompareRow label="Внутренний радиус R" value={`${fmt(result.internalRadius, 1)} мм`} sub={`Rнейтр. ${fmt(result.neutralRadius, 2)} мм`} />
                      <CompareRow label="Удельный вес производства" value={`${fmt(result.productionKgM2, 5)} кг/м²`} sub={`теория ${fmt(result.theoreticalKgM2, 5)} кг/м²`} />
                      {result.sigmaGeometry && <CompareRow label="Sigma S / F" value={`${fmt(result.sigmaGeometry.S, 0)} / ${fmt(result.sigmaGeometry.F, 1)} мм`} sub={`h₁ ${result.sigmaGeometry.h1} · h₂ ${result.sigmaGeometry.h2}`} />}
                    </div>
                  </div>
                </div>

                <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="text-lg font-extrabold">Раскрой и цена</h2>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                    <SmallMetric label="Материнский рулон" value={`${fmt(result.rollWidth, 0)} мм`} />
                    <SmallMetric label="Полос из рулона" value={`${result.countFromRoll} шт.`} />
                    <SmallMetric label="Остаток" value={`${fmt(result.wasteMm)} мм`} />
                    <SmallMetric label="Отход" value={`${fmt(result.wastePercentage)} %`} />
                    <SmallMetric label="Цена без отхода" value={`${fmt(result.priceNoWaste)} ₽/м`} />
                    <SmallMetric label="Цена с отходом" value={`${fmt(result.priceWithWaste)} ₽/м`} />
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-[28px] border border-rose-200 bg-rose-50 p-6 text-rose-800">Не удалось выполнить расчёт с выбранными параметрами.</div>
            )}
          </section>
        </div>
      </div>
    </main>
  )
}

function ProfileSketch({ profileType, H, A, B, C1, C2 }: { profileType: ProfileType; H: number; A: number; B: number; C1: number; C2: number }) {
  const points = useMemo(() => {
    if (profileType === 'PP') return [[A, 0], [0, 0], [0, H], [B, H]] as [number, number][]
    if (profileType === 'PGS') return [[A, C1], [A, 0], [0, 0], [0, H], [B, H], [B, H - C2]] as [number, number][]
    if (profileType === 'PZ') return [[-B, C2], [-B, 0], [0, 0], [0, H], [A, H], [A, H - C1]] as [number, number][]

    const g = getSigmaGeometry(H)
    if (!g) return [] as [number, number][]
    return [
      [-C1, A], [0, A], [0, 0], [g.E, 0], [g.E + g.F, g.S],
      [g.E + g.F + g.h2, g.S], [g.E + 2 * g.F + g.h2, 0], [H, 0], [H, B], [H + C2, B],
    ] as [number, number][]
  }, [profileType, H, A, B, C1, C2])

  if (!points.length) return null
  const xs = points.map((p) => p[0])
  const ys = points.map((p) => p[1])
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  const width = Math.max(maxX - minX, 1)
  const height = Math.max(maxY - minY, 1)
  const padX = Math.max(width * 0.16, 20)
  const padY = Math.max(height * 0.18, 20)
  const svgPoints = points.map(([x, y]) => `${x},${-y}`).join(' ')
  const viewBox = `${minX - padX} ${-maxY - padY} ${width + padX * 2} ${height + padY * 2}`

  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold">Живое сечение</h2>
          <p className="mt-1 text-xs text-slate-500">Номинальная геометрия · размеры меняются вместе с вводом</p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{profileType === 'SIGMA' ? 'Sigma LGS-2' : profileType}</span>
      </div>
      <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-[linear-gradient(#e2e8f0_1px,transparent_1px),linear-gradient(90deg,#e2e8f0_1px,transparent_1px)] bg-[size:20px_20px] p-3">
        <svg viewBox={viewBox} className="h-[280px] w-full" role="img" aria-label={`Сечение профиля ${profileType}`}>
          <polyline points={svgPoints} fill="none" stroke="currentColor" strokeWidth={Math.max(width, height) / 100} strokeLinecap="round" strokeLinejoin="round" className="text-slate-900" />
          {points.map(([x, y], index) => <circle key={index} cx={x} cy={-y} r={Math.max(width, height) / 120} className="fill-orange-600" />)}
        </svg>
      </div>
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs font-semibold text-slate-500">
        <span>H {H} мм</span><span>A {A} мм</span>{profileType !== 'PGS' && profileType !== 'PP' && <span>B {B} мм</span>}{profileType !== 'PP' && <span>C₁/C₂ {C1}/{C2} мм</span>}
      </div>
    </div>
  )
}

function NumberField({ label, value, setValue }: { label: string; value: number; setValue: (value: number) => void }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">{label}</span>
      <input className="input" type="number" value={value} onChange={(e) => setValue(Number(e.target.value))} />
    </label>
  )
}

function CompareRow({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3 last:border-0 last:pb-0">
      <div className="text-sm font-semibold text-slate-600">{label}</div>
      <div className="text-right"><b>{value}</b><div className="text-xs text-slate-400">{sub}</div></div>
    </div>
  )
}

function SmallMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{label}</div>
      <div className="mt-2 text-lg font-extrabold">{value}</div>
    </div>
  )
}
