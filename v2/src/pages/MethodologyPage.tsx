import { MATERIALS, PROFILE_FULL_NAMES, RANGES, type ProfileType } from '../lib/constants'
import { ProfileSchemaSvg } from '../components/ProfileSchemaSvg'

export function MethodologyPage() {
  return (
    <div className="space-y-6">
      <section className="surface p-6 lg:p-8">
        <h1 className="h-display mb-2 text-3xl">Методика расчёта</h1>
        <p className="max-w-3xl text-sm text-ink-600 dark:text-ink-300">
          Калькулятор рассчитывает развёртку холодногнутого профиля, оптимальное число
          полос из рулона, отход, вес и стоимость 1 пог. метра. Формулы учитывают
          радиус гиба и смещение нейтральной линии металла.
        </p>
      </section>

      <section className="surface p-6 lg:p-8">
        <h2 className="h-display mb-4 text-2xl">Обозначения</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Notation symbol="H" desc="Высота стенки профиля, мм" />
          <Notation symbol="a" desc="Ширина верхней полки (для Z), полки B (для ПП и ПГС)" />
          <Notation symbol="B" desc="Ширина нижней полки (только Z; у ПП/ПГС B = a)" />
          <Notation symbol="C" desc="Длина отгибки на конце полки (ПГС, Z), мм" />
          <Notation symbol="t" desc="Толщина металла, мм" />
          <Notation symbol="rb" desc="Внутренний радиус гиба, зависит от t" />
          <Notation symbol="L" desc="Длина развёртки заготовки, мм" />
          <Notation symbol="W" desc="Ширина рулона, мм" />
          <Notation symbol="γ" desc="Удельный вес рулона выбранной ширины, кг/м" />
        </div>
      </section>

      <section className="surface p-6 lg:p-8">
        <h2 className="h-display mb-4 text-2xl">Принцип расчёта</h2>
        <ol className="list-decimal space-y-3 pl-5 text-sm leading-relaxed text-ink-700 dark:text-ink-200">
          <li>
            Определяем материальные параметры по толщине: радиус гиба{' '}
            <Math>r_b</Math>, ширину рулона <Math>W</Math> и удельный вес <Math>γ</Math>.
          </li>
          <li>
            Считаем сумму прямых участков заготовки <Math>L_{`пр`}</Math>. Каждая гибка{' '}
            «съедает» с прилегающего участка по{' '}
            <Math>{`(r_b + t)`}</Math> с каждой стороны (компенсация смещения нейтрального
            слоя при гибке на 90°).
          </li>
          <li>
            К прямым участкам добавляем длину дуг по нейтральной линии. Радиус нейтральной
            линии: <Math>{`R_n = r_b + t/2`}</Math>. Длина одной четверти окружности:{' '}
            <Math>{`π·R_n / 2`}</Math>. Сумма всех гибов:{' '}
            <Math>{`L_g = N · π·R_n / 2`}</Math>.
          </li>
          <li>
            Полная развёртка: <Math>{`L = L_пр + L_g`}</Math>.
          </li>
          <li>
            Раскрой рулона: число полос{' '}
            <Math>{`n = ⌊W / L⌋`}</Math>, отход{' '}
            <Math>{`Δ = W − n·L`}</Math>, в процентах{' '}
            <Math>{`Δ% = 100·Δ/W`}</Math>.
          </li>
          <li>
            Вес 1 пог. метра профиля: <Math>{`m = (L/1000) · γ`}</Math>, кг/м.
          </li>
          <li>
            Цена 1 пог. метра без учёта отхода:{' '}
            <Math>{`P_0 = m · (Цена_т / 1000)`}</Math>.
          </li>
          <li>
            Цена с учётом отхода (раскладываем стоимость всей ширины рулона на{' '}
            <Math>n</Math> полос):{' '}
            <Math>{`P_w = γ · (W/1000) · (Цена_т / 1000) / n`}</Math>.
          </li>
        </ol>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <ProfileMethod
          type="PP"
          formula={
            <>
              <code className="block">N = 2</code>
              <code className="block">L_пр = (H − 2(r_b + t)) + 2(a − (r_b + t))</code>
            </>
          }
          notes="П-образный профиль без отгибок. Развёртка — стенка + 2 полки, без концевых отгибок."
        />
        <ProfileMethod
          type="PGS"
          formula={
            <>
              <code className="block">N = 4</code>
              <code className="block">
                L_пр = (H − 2(r_b + t)) + 2(a − 2(r_b + t)) + 2(C − (r_b + t))
              </code>
            </>
          }
          notes="П-образный с отгибками. Каждая полка теряет по две гибки (к стенке и к отгибке), каждая отгибка — одну."
        />
        <ProfileMethod
          type="PZ"
          formula={
            <>
              <code className="block">N = 4</code>
              <code className="block">
                L_пр = (H − 2(r_b + t)) + (a − 2(r_b + t)) + (B − 2(r_b + t)) + 2(C − (r_b + t))
              </code>
            </>
          }
          notes="Z-профиль с разными полками a и B. При a = B формула совпадает с ПГС."
        />
      </section>

      <section className="surface p-6 lg:p-8">
        <h2 className="h-display mb-4 text-2xl">Справочные данные по толщинам</h2>
        <div className="overflow-x-auto thin-scroll">
          <table className="w-full min-w-[560px] border-separate border-spacing-0 text-sm">
            <thead>
              <tr className="text-left">
                <Th>Толщина t, мм</Th>
                <Th>Радиус гиба r_b, мм</Th>
                <Th>Ширина рулона W, мм</Th>
                <Th>Удельный вес γ, кг/м</Th>
              </tr>
            </thead>
            <tbody className="tabular">
              {Object.values(MATERIALS).map((m) => (
                <tr key={m.t}>
                  <Td>{m.t.toFixed(1)}</Td>
                  <Td>{m.rb.toFixed(1)}</Td>
                  <Td>{m.rollWidth}</Td>
                  <Td>{m.specificWeight}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="surface p-6 lg:p-8">
        <h2 className="h-display mb-4 text-2xl">Допустимые диапазоны</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Range label="Высота H" min={RANGES.H.min} max={RANGES.H.max} />
          <Range label="Полка a" min={RANGES.a.min} max={RANGES.a.max} />
          <Range label="Полка B (Z)" min={RANGES.B.min} max={RANGES.B.max} />
          <Range label="Отгибка C" min={RANGES.C.min} max={RANGES.C.max} />
        </div>
        <p className="mt-3 text-xs text-ink-500 dark:text-ink-300">
          Диапазоны соответствуют технологическим возможностям профилегибочного станка.
          За пределами этих границ форма выдаст ошибку.
        </p>
      </section>

      <section className="surface p-6 lg:p-8">
        <h2 className="h-display mb-4 text-2xl">Признак выгодного раскроя</h2>
        <p className="text-sm leading-relaxed text-ink-700 dark:text-ink-200">
          Принято: если отход <Math>Δ% ≤ 5%</Math>, раскрой считается выгодным. Тепловая карта
          подбора профиля показывает <Math>Δ%</Math> для всех допустимых сочетаний{' '}
          <Math>H</Math> и <Math>a</Math> при текущей толщине, типе профиля и отгибке —
          можно «глазами» найти лучший вариант, кликнуть и подставить в форму.
        </p>
      </section>

      <section className="surface p-6 lg:p-8">
        <h2 className="h-display mb-4 text-2xl">Ограничения и оговорки</h2>
        <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-ink-700 dark:text-ink-200">
          <li>
            Расчёт выполняется по геометрии без учёта пружинения металла — для
            технологической карты гибки нужно вводить корректировку <Math>K_s</Math>.
          </li>
          <li>
            Удельный вес <Math>γ</Math> приведён для оцинкованного стального проката
            расчётной плотности 7850 кг/м³ и относится к ширине рулона, указанной в
            таблице справочных данных.
          </li>
          <li>
            Цена за тонну вводится без НДС. Стоимость с учётом отхода пересчитывает
            цену всей полосы рулона на число «годных» заготовок.
          </li>
          <li>
            Для Z-профиля одинаковые <Math>a</Math> и <Math>B</Math> допустимы — расчёт
            при этом совпадает с ПГС с тем же <Math>a</Math> и <Math>C</Math>.
          </li>
        </ul>
      </section>
    </div>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th
      className="border-b border-ink-200 px-3 py-2 text-xs font-bold uppercase tracking-wider text-ink-500 dark:border-ink-700/60 dark:text-ink-300"
    >
      {children}
    </th>
  )
}
function Td({ children }: { children: React.ReactNode }) {
  return (
    <td className="border-b border-ink-100 px-3 py-2 text-ink-800 dark:border-ink-700/40 dark:text-ink-100">
      {children}
    </td>
  )
}
function Notation({ symbol, desc }: { symbol: string; desc: string }) {
  return (
    <div className="surface-soft p-3">
      <div className="flex items-baseline gap-2">
        <span className="font-mono text-base font-extrabold text-brand-700 dark:text-brand-200">
          {symbol}
        </span>
        <span className="text-xs text-ink-600 dark:text-ink-300">{desc}</span>
      </div>
    </div>
  )
}
function Range({ label, min, max }: { label: string; min: number; max: number }) {
  return (
    <div className="surface-soft p-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-ink-500 dark:text-ink-300">
        {label}
      </p>
      <p className="mt-1 tabular text-base font-extrabold text-ink-900 dark:text-ink-50">
        {min} – {max} мм
      </p>
    </div>
  )
}
function Math({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-md bg-ink-100/70 px-1.5 py-0.5 font-mono text-[0.85em] font-semibold text-ink-800 dark:bg-ink-700/40 dark:text-ink-100">
      {children}
    </span>
  )
}
function ProfileMethod({
  type,
  formula,
  notes,
}: {
  type: ProfileType
  formula: React.ReactNode
  notes: string
}) {
  return (
    <article className="surface p-5">
      <header className="mb-3 flex items-center gap-2">
        <span className="chip chip-brand">{type}</span>
        <h3 className="h-display text-lg">{PROFILE_FULL_NAMES[type]}</h3>
      </header>
      <div className="flex justify-center pb-3">
        <ProfileSchemaSvg profile={type} className="h-40 w-auto" />
      </div>
      <div className="space-y-1 rounded-xl bg-ink-100/50 p-3 font-mono text-[0.78rem] leading-relaxed text-ink-800 dark:bg-ink-700/30 dark:text-ink-100">
        {formula}
      </div>
      <p className="mt-3 text-xs text-ink-500 dark:text-ink-300">{notes}</p>
    </article>
  )
}
