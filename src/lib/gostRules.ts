import type { ProfileType } from './unifiedCalculator'

type Range = [number, number]

interface PpRow { H: number; B: Range; T: Range }
interface CRow { H: Range; B1: Range; B2: Range; C: Range; T: Range }
interface ZRow { H: Range; B1: Range; B2: Range; C: Range; T: Range }

const EPS = 1e-6
const inRange = (v: number, r: Range) => v >= r[0] - EPS && v <= r[1] + EPS

// ГОСТ Р 58384-2019, приложение А, таблица А.1 — равнополочный швеллер.
// Здесь хранится полный нормативный сортамент таблицы, а не только пересечение с LGS-2.
export const GOST_PP_ROWS: readonly PpRow[] = [
  { H:80, B:[40,40], T:[1,2.5] }, { H:80, B:[60,60], T:[1.5,3] },
  { H:89, B:[40,65], T:[1.5,2] }, { H:92, B:[40,65], T:[1.2,2] },
  { H:100, B:[40,65], T:[1,2.5] }, { H:104, B:[50,50], T:[1,2] },
  { H:110, B:[40,40], T:[1,3] }, { H:120, B:[50,50], T:[1.5,2.5] },
  { H:122, B:[35,35], T:[1.5,2] }, { H:124, B:[50,50], T:[1,2] },
  { H:140, B:[40,65], T:[1,2.5] }, { H:145, B:[45,45], T:[1,1.5] },
  { H:150, B:[40,70], T:[1,3.9] }, { H:152, B:[35,65], T:[1,2] },
  { H:154, B:[40,55], T:[1,2] }, { H:160, B:[50,60], T:[1.5,2] },
  { H:170, B:[45,50], T:[1,1.5] }, { H:172, B:[35,40], T:[1,2] },
  { H:174, B:[50,50], T:[1,2] }, { H:179, B:[50,50], T:[1,2] },
  { H:180, B:[50,80], T:[1.5,3.9] }, { H:195, B:[45,55], T:[1,2] },
  { H:200, B:[40,70], T:[1,3.9] }, { H:202, B:[35,55], T:[1,2] },
  { H:204, B:[45,50], T:[1,2] }, { H:220, B:[60,70], T:[1.5,2.5] },
  { H:250, B:[40,100], T:[1,3.9] }, { H:252, B:[35,35], T:[1,2] },
  { H:254, B:[40,65], T:[1,2] }, { H:256, B:[60,60], T:[2,3] },
  { H:282, B:[35,35], T:[1,2] }, { H:284, B:[50,50], T:[1,2] },
  { H:300, B:[40,100], T:[1,3.9] }, { H:304, B:[50,60], T:[1.5,3] },
  { H:306, B:[40,60], T:[1,2] }, { H:350, B:[40,120], T:[1.5,3.9] },
  { H:354, B:[50,50], T:[2,2] },
]

// ГОСТ Р 58384-2019, приложение А, таблица А.2 — C-образный профиль.
export const GOST_PGS_ROWS: readonly CRow[] = [
  { H:[80,80], T:[1.5,3.9], B1:[50,60], B2:[43,63], C:[16,20] },
  { H:[80,80], T:[1,2.5], B1:[35,50], B2:[30,45], C:[12,18] },
  { H:[100,100], T:[1.5,3.9], B1:[65,80], B2:[57,72], C:[18,27] },
  { H:[100,100], T:[1,2.5], B1:[40,60], B2:[35,54], C:[16,20] },
  { H:[120,120], T:[1.5,3.9], B1:[65,80], B2:[57,72], C:[18,27] },
  { H:[120,120], T:[1,2.5], B1:[40,60], B2:[35,54], C:[16,20] },
  { H:[140,140], T:[1.5,3.9], B1:[65,80], B2:[57,72], C:[18,25] },
  { H:[140,150], T:[1,2.5], B1:[40,60], B2:[35,54], C:[16,20] },
  { H:[150,150], T:[1.5,3.9], B1:[60,80], B2:[52,72], C:[18,25] },
  { H:[160,160], T:[1.5,3.9], B1:[70,80], B2:[67,72], C:[18,25] },
  { H:[180,180], T:[1.5,3.9], B1:[70,80], B2:[67,72], C:[18,25] },
  { H:[200,200], T:[1.5,3.9], B1:[70,80], B2:[67,72], C:[18,25] },
  { H:[220,220], T:[1.5,3.9], B1:[70,80], B2:[67,72], C:[18,25] },
  { H:[240,240], T:[1.5,3.9], B1:[80,90], B2:[72,82], C:[18,30] },
  { H:[250,250], T:[1.5,3.9], B1:[80,90], B2:[72,82], C:[18,30] },
  { H:[260,260], T:[2,3.9], B1:[80,100], B2:[72,92], C:[20,30] },
  { H:[280,280], T:[2,3.9], B1:[80,100], B2:[72,92], C:[20,30] },
  { H:[300,300], T:[2,3.9], B1:[90,110], B2:[82,102], C:[22,30] },
  { H:[320,320], T:[2,3.9], B1:[100,120], B2:[92,112], C:[22,30] },
  { H:[340,340], T:[2,3.9], B1:[100,120], B2:[92,112], C:[22,30] },
  { H:[350,350], T:[2,3.9], B1:[100,120], B2:[92,112], C:[22,30] },
  { H:[360,360], T:[2.5,3.9], B1:[100,130], B2:[92,122], C:[22,32] },
  { H:[380,380], T:[2.5,3.9], B1:[100,140], B2:[92,132], C:[22,36] },
  { H:[400,400], T:[2.5,3.9], B1:[100,140], B2:[92,132], C:[22,36] },
]

// ГОСТ Р 58384-2019, приложение А, таблица А.3 — Z-образный профиль.
export const GOST_PZ_ROWS: readonly ZRow[] = GOST_PGS_ROWS

export interface GostProfileInput {
  profileType: ProfileType
  thickness: number
  wallHeight: number
  shelfWidthA: number
  shelfWidthB: number
  flangeC1: number
  flangeC2?: number
}

/** Нормативная проверка ГОСТ Р 58384-2019 без учёта возможностей LGS-2. */
export function matchesGostProfile(input: GostProfileInput): boolean {
  if (input.profileType === 'SIGMA') return false

  const H = input.wallHeight
  const B1 = input.shelfWidthA
  const B2 = input.shelfWidthB
  const C1 = input.flangeC1
  const C2 = input.flangeC2 ?? C1
  const t = input.thickness

  if (input.profileType === 'PP') {
    if (Math.abs(B1 - B2) > EPS) return false
    return GOST_PP_ROWS.some((r) => Math.abs(r.H - H) < EPS && inRange(B1, r.B) && inRange(t, r.T))
  }

  const rows = input.profileType === 'PGS' ? GOST_PGS_ROWS : GOST_PZ_ROWS
  return rows.some((r) =>
    inRange(H, r.H) &&
    inRange(t, r.T) &&
    inRange(B1, r.B1) &&
    inRange(B2, r.B2) &&
    inRange(C1, r.C) &&
    inRange(C2, r.C),
  )
}

// Совместимость со старым именем: LGS-2 теперь проверяется отдельно в unifiedCalculator.
export const matchesGostLgs2Intersection = matchesGostProfile
