import { useId } from 'react'
import type { ProfileType } from '../lib/constants'

export type DimensionKey = 'H' | 'a' | 'B' | 'C' | 't'

interface Props {
  profile: ProfileType
  /** Какой размер сейчас в фокусе — будет подсвечен */
  highlight?: DimensionKey | null
  /** Числовые значения — выводятся прямо у выносок */
  values?: Partial<Record<DimensionKey, number | string>>
  className?: string
}

/**
 * Стилизованные технические схемы холодногнутых профилей.
 * SVG нарисован в координатах ~ 360×440, viewBox адаптируется под профиль.
 * При наведении/фокусе на поле в форме соответствующий размер подсвечивается.
 */
export function ProfileSchemaSvg({ profile, highlight = null, values, className }: Props) {
  const id = useId()
  const arrowId = `arrow-${id}`
  const highlightArrowId = `arrow-hl-${id}`

  const isActive = (k: DimensionKey) => highlight === k

  const stroke = 'currentColor'
  const dimColor = '#94a3b8'
  const highlightColor = '#3b62ee'

  // Числовые значения убраны со схемы — на чертеже остаются только символы.
  // Параметр values принимаем для обратной совместимости, но игнорируем.
  void values
  const text = (_k: DimensionKey, fallback: string) => fallback

  return (
    <svg
      role="img"
      aria-label={`Схема профиля ${profile}`}
      viewBox="0 0 360 460"
      className={className}
      style={{ color: 'currentColor' }}
    >
      <defs>
        <marker
          id={arrowId}
          viewBox="0 0 10 10"
          refX="5"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M0,0 L10,5 L0,10 z" fill={dimColor} />
        </marker>
        <marker
          id={highlightArrowId}
          viewBox="0 0 10 10"
          refX="5"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M0,0 L10,5 L0,10 z" fill={highlightColor} />
        </marker>
      </defs>

      {profile === 'PP' && (
        <PPDrawing
          stroke={stroke}
          dimColor={dimColor}
          highlightColor={highlightColor}
          arrow={`url(#${arrowId})`}
          arrowHl={`url(#${highlightArrowId})`}
          isActive={isActive}
          text={text}
        />
      )}
      {profile === 'PGS' && (
        <PGSDrawing
          stroke={stroke}
          dimColor={dimColor}
          highlightColor={highlightColor}
          arrow={`url(#${arrowId})`}
          arrowHl={`url(#${highlightArrowId})`}
          isActive={isActive}
          text={text}
        />
      )}
      {profile === 'PZ' && (
        <ZDrawing
          stroke={stroke}
          dimColor={dimColor}
          highlightColor={highlightColor}
          arrow={`url(#${arrowId})`}
          arrowHl={`url(#${highlightArrowId})`}
          isActive={isActive}
          text={text}
        />
      )}
    </svg>
  )
}

interface DrawingProps {
  stroke: string
  dimColor: string
  highlightColor: string
  arrow: string
  arrowHl: string
  isActive: (k: DimensionKey) => boolean
  text: (k: DimensionKey, fallback: string) => string
}

/* ---------- ПП ---------- */
function PPDrawing(p: DrawingProps) {
  // Контур ПП: верхняя короткая полка, длинная стенка, нижняя короткая полка
  // Координаты (мм условные → пиксели):
  const xLeft = 170
  const xRight = 280
  const yTop = 50
  const yBottom = 410
  const r = 8 // радиус скругления для красоты
  const t = 4 // толщина «листа»

  // Внешний контур, идём по часовой: верхняя полка слева направо → правая стенка вниз → нижняя полка влево
  const outer = `
    M ${xRight} ${yTop}
    L ${xLeft + r} ${yTop}
    Q ${xLeft} ${yTop} ${xLeft} ${yTop + r}
    L ${xLeft} ${yBottom - r}
    Q ${xLeft} ${yBottom} ${xLeft + r} ${yBottom}
    L ${xRight} ${yBottom}
  `
  const inner = `
    M ${xRight} ${yTop + t}
    L ${xLeft + r + t / 2} ${yTop + t}
    Q ${xLeft + t} ${yTop + t} ${xLeft + t} ${yTop + r + t / 2}
    L ${xLeft + t} ${yBottom - r - t / 2}
    Q ${xLeft + t} ${yBottom - t} ${xLeft + r + t / 2} ${yBottom - t}
    L ${xRight} ${yBottom - t}
  `

  return (
    <g>
      <text x="180" y="28" textAnchor="middle" fontFamily="Inter" fontWeight={800} fontSize="26" fill={p.stroke}>
        ПП (ТПП)
      </text>

      {/* Тело профиля */}
      <path d={outer} fill="none" stroke={p.stroke} strokeWidth={3} strokeLinejoin="round" />
      <path d={inner} fill="none" stroke={p.stroke} strokeWidth={2} strokeLinejoin="round" opacity={0.55} />

      {/* H (слева, вертикально) */}
      <Dimension
        active={p.isActive('H')}
        color={p.isActive('H') ? p.highlightColor : p.dimColor}
        arrow={p.isActive('H') ? p.arrowHl : p.arrow}
        x1={130} y1={yTop} x2={130} y2={yBottom}
        labelX={118} labelY={(yTop + yBottom) / 2}
        labelText={p.text('H', 'H')}
        labelRotate={-90}
      />

      {/* B (снизу, горизонтально) */}
      <Dimension
        active={p.isActive('a')}
        color={p.isActive('a') ? p.highlightColor : p.dimColor}
        arrow={p.isActive('a') ? p.arrowHl : p.arrow}
        x1={xLeft} y1={yBottom + 30} x2={xRight} y2={yBottom + 30}
        labelX={(xLeft + xRight) / 2} labelY={yBottom + 50}
        labelText={p.text('a', 'B')}
      />

      {/* t (справа, у нижней полки) */}
      <Dimension
        active={p.isActive('t')}
        color={p.isActive('t') ? p.highlightColor : p.dimColor}
        arrow={p.isActive('t') ? p.arrowHl : p.arrow}
        x1={xRight + 8} y1={yBottom - t} x2={xRight + 8} y2={yBottom}
        labelX={xRight + 22} labelY={yBottom + 4}
        labelText={p.text('t', 't')}
      />
    </g>
  )
}

/* ---------- ПГС ---------- */
function PGSDrawing(p: DrawingProps) {
  const xLeft = 170
  const xRight = 290
  const yTop = 50
  const yBottom = 410
  const cLen = 24 // длина отгибки на схеме
  const r = 8
  const t = 4

  // Контур: верхняя отгибка ↓, верхняя полка ←, стенка ↓, нижняя полка →, нижняя отгибка ↓
  const outer = `
    M ${xRight} ${yTop + cLen}
    L ${xRight} ${yTop + r}
    Q ${xRight} ${yTop} ${xRight - r} ${yTop}
    L ${xLeft + r} ${yTop}
    Q ${xLeft} ${yTop} ${xLeft} ${yTop + r}
    L ${xLeft} ${yBottom - r}
    Q ${xLeft} ${yBottom} ${xLeft + r} ${yBottom}
    L ${xRight - r} ${yBottom}
    Q ${xRight} ${yBottom} ${xRight} ${yBottom - r}
    L ${xRight} ${yBottom - cLen}
  `
  const inner = `
    M ${xRight - t} ${yTop + cLen}
    L ${xRight - t} ${yTop + r + t / 2}
    Q ${xRight - t} ${yTop + t} ${xRight - r - t / 2} ${yTop + t}
    L ${xLeft + r + t / 2} ${yTop + t}
    Q ${xLeft + t} ${yTop + t} ${xLeft + t} ${yTop + r + t / 2}
    L ${xLeft + t} ${yBottom - r - t / 2}
    Q ${xLeft + t} ${yBottom - t} ${xLeft + r + t / 2} ${yBottom - t}
    L ${xRight - r - t / 2} ${yBottom - t}
    Q ${xRight - t} ${yBottom - t} ${xRight - t} ${yBottom - r - t / 2}
    L ${xRight - t} ${yBottom - cLen}
  `

  return (
    <g>
      <text x="180" y="28" textAnchor="middle" fontFamily="Inter" fontWeight={800} fontSize="26" fill={p.stroke}>
        ПГС
      </text>

      <path d={outer} fill="none" stroke={p.stroke} strokeWidth={3} strokeLinejoin="round" />
      <path d={inner} fill="none" stroke={p.stroke} strokeWidth={2} strokeLinejoin="round" opacity={0.55} />

      {/* H */}
      <Dimension
        active={p.isActive('H')}
        color={p.isActive('H') ? p.highlightColor : p.dimColor}
        arrow={p.isActive('H') ? p.arrowHl : p.arrow}
        x1={130} y1={yTop} x2={130} y2={yBottom}
        labelX={118} labelY={(yTop + yBottom) / 2}
        labelText={p.text('H', 'H')}
        labelRotate={-90}
      />

      {/* B (внизу) */}
      <Dimension
        active={p.isActive('a')}
        color={p.isActive('a') ? p.highlightColor : p.dimColor}
        arrow={p.isActive('a') ? p.arrowHl : p.arrow}
        x1={xLeft} y1={yBottom + 30} x2={xRight} y2={yBottom + 30}
        labelX={(xLeft + xRight) / 2} labelY={yBottom + 50}
        labelText={p.text('a', 'B')}
      />

      {/* C (справа сверху, вертикально по верхней отгибке) */}
      <Dimension
        active={p.isActive('C')}
        color={p.isActive('C') ? p.highlightColor : p.dimColor}
        arrow={p.isActive('C') ? p.arrowHl : p.arrow}
        x1={xRight + 24} y1={yTop} x2={xRight + 24} y2={yTop + cLen}
        labelX={xRight + 38} labelY={yTop + cLen / 2 + 4}
        labelText={p.text('C', 'C')}
      />

      {/* t (в центре стенки) */}
      <Dimension
        active={p.isActive('t')}
        color={p.isActive('t') ? p.highlightColor : p.dimColor}
        arrow={p.isActive('t') ? p.arrowHl : p.arrow}
        x1={xLeft - 28} y1={(yTop + yBottom) / 2} x2={xLeft + t} y2={(yTop + yBottom) / 2}
        labelX={xLeft - 40} labelY={(yTop + yBottom) / 2 - 6}
        labelText={p.text('t', 't')}
        labelAnchor="end"
      />
    </g>
  )
}

/* ---------- Z ---------- */
function ZDrawing(p: DrawingProps) {
  // Z: верхняя полка идёт вправо от стенки, нижняя — влево от стенки.
  const xWall = 200 // вертикальная стенка (по центру)
  const xRightTop = 320 // правый край верхней полки
  const xLeftBot = 80 // левый край нижней полки
  const yTop = 50
  const yBottom = 410
  const cLen = 24
  const r = 8
  const t = 4

  // Контур (внешний путь, идём от верхней правой отгибки → влево по верхней полке → вниз по стенке → влево по нижней полке → вниз по нижней отгибке)
  const outer = `
    M ${xRightTop} ${yTop + cLen}
    L ${xRightTop} ${yTop + r}
    Q ${xRightTop} ${yTop} ${xRightTop - r} ${yTop}
    L ${xWall + r} ${yTop}
    Q ${xWall} ${yTop} ${xWall} ${yTop + r}
    L ${xWall} ${yBottom - r}
    Q ${xWall} ${yBottom} ${xWall - r} ${yBottom}
    L ${xLeftBot + r} ${yBottom}
    Q ${xLeftBot} ${yBottom} ${xLeftBot} ${yBottom - r}
    L ${xLeftBot} ${yBottom - cLen}
  `
  const inner = `
    M ${xRightTop} ${yTop + cLen}
    L ${xRightTop} ${yTop + r + t / 2}
    Q ${xRightTop} ${yTop + t} ${xRightTop - r - t / 2} ${yTop + t}
    L ${xWall + r + t / 2} ${yTop + t}
    Q ${xWall + t} ${yTop + t} ${xWall + t} ${yTop + r + t / 2}
    L ${xWall + t} ${yBottom - r - t / 2}
    Q ${xWall + t} ${yBottom - t} ${xWall - r + t / 2} ${yBottom - t}
    L ${xLeftBot + r + t / 2} ${yBottom - t}
    Q ${xLeftBot + t} ${yBottom - t} ${xLeftBot + t} ${yBottom - r - t / 2}
    L ${xLeftBot + t} ${yBottom - cLen}
  `

  return (
    <g>
      <text x="200" y="28" textAnchor="middle" fontFamily="Inter" fontWeight={800} fontSize="26" fill={p.stroke}>
        Z
      </text>

      <path d={outer} fill="none" stroke={p.stroke} strokeWidth={3} strokeLinejoin="round" />
      <path d={inner} fill="none" stroke={p.stroke} strokeWidth={2} strokeLinejoin="round" opacity={0.55} />

      {/* H — слева */}
      <Dimension
        active={p.isActive('H')}
        color={p.isActive('H') ? p.highlightColor : p.dimColor}
        arrow={p.isActive('H') ? p.arrowHl : p.arrow}
        x1={50} y1={yTop} x2={50} y2={yBottom}
        labelX={38} labelY={(yTop + yBottom) / 2}
        labelText={p.text('H', 'H')}
        labelRotate={-90}
      />

      {/* a — сверху (полка верхняя) */}
      <Dimension
        active={p.isActive('a')}
        color={p.isActive('a') ? p.highlightColor : p.dimColor}
        arrow={p.isActive('a') ? p.arrowHl : p.arrow}
        x1={xWall} y1={yTop - 26} x2={xRightTop} y2={yTop - 26}
        labelX={(xWall + xRightTop) / 2} labelY={yTop - 32}
        labelText={p.text('a', 'a')}
      />

      {/* B — снизу (полка нижняя) */}
      <Dimension
        active={p.isActive('B')}
        color={p.isActive('B') ? p.highlightColor : p.dimColor}
        arrow={p.isActive('B') ? p.arrowHl : p.arrow}
        x1={xLeftBot} y1={yBottom + 30} x2={xWall} y2={yBottom + 30}
        labelX={(xLeftBot + xWall) / 2} labelY={yBottom + 50}
        labelText={p.text('B', 'B')}
      />

      {/* C — у верхней отгибки */}
      <Dimension
        active={p.isActive('C')}
        color={p.isActive('C') ? p.highlightColor : p.dimColor}
        arrow={p.isActive('C') ? p.arrowHl : p.arrow}
        x1={xRightTop + 24} y1={yTop} x2={xRightTop + 24} y2={yTop + cLen}
        labelX={xRightTop + 38} labelY={yTop + cLen / 2 + 4}
        labelText={p.text('C', 'C')}
      />

      {/* t — у стенки в центре */}
      <Dimension
        active={p.isActive('t')}
        color={p.isActive('t') ? p.highlightColor : p.dimColor}
        arrow={p.isActive('t') ? p.arrowHl : p.arrow}
        x1={xWall + 28} y1={(yTop + yBottom) / 2} x2={xWall - t} y2={(yTop + yBottom) / 2}
        labelX={xWall + 40} labelY={(yTop + yBottom) / 2 - 6}
        labelText={p.text('t', 't')}
      />
    </g>
  )
}

/* ---------- Размер с двунаправленной стрелкой ---------- */

interface DimProps {
  x1: number
  y1: number
  x2: number
  y2: number
  labelX: number
  labelY: number
  labelText: string
  labelAnchor?: 'start' | 'middle' | 'end'
  labelRotate?: number
  active: boolean
  color: string
  arrow: string
}

function Dimension(p: DimProps) {
  const transform =
    p.labelRotate !== undefined ? `rotate(${p.labelRotate} ${p.labelX} ${p.labelY})` : undefined

  return (
    <g style={{ transition: 'opacity 0.15s ease' }} opacity={p.active ? 1 : 0.85}>
      <line
        x1={p.x1}
        y1={p.y1}
        x2={p.x2}
        y2={p.y2}
        stroke={p.color}
        strokeWidth={p.active ? 1.6 : 1}
        markerStart={p.arrow}
        markerEnd={p.arrow}
      />
      <text
        x={p.labelX}
        y={p.labelY}
        fill={p.color}
        fontFamily="Inter"
        fontSize={p.active ? 18 : 16}
        fontWeight={p.active ? 800 : 800}
        textAnchor={p.labelAnchor ?? 'middle'}
        transform={transform}
      >
        {p.labelText}
      </text>
    </g>
  )
}
