import type { ProfileType } from './unifiedCalculator'

type Range = [number, number]

interface PpRow { H: number; B: Range; T: number[] }
interface PgsRow { H: Range; B: Range; C: Range; T: Range }
interface PzRow { H: Range; B1: Range; B2: Range; C: Range; T: Range }

const EPS = 1e-6
const inRange = (v: number, r: Range) => v >= r[0] - EPS && v <= r[1] + EPS
const inList = (v: number, list: number[]) => list.some((x) => Math.abs(x - v) < EPS)

// Source: the existing LSTK calculator data set labelled “ГОСТ Р 58384 ∩ LGS-2”.
// These rows intentionally represent the usable GOST/LGS-2 intersection, not the full abstract GOST catalogue.
export const PZ_ROWS: readonly PzRow[] = [
  { H:[100,100], B1:[40,60], B2:[40,54], C:[16,20], T:[1,2.5] },
  { H:[100,100], B1:[65,80], B2:[57,72], C:[18,27], T:[1.5,3] },
  { H:[120,120], B1:[40,60], B2:[40,54], C:[16,20], T:[1,2.5] },
  { H:[120,120], B1:[65,80], B2:[57,72], C:[18,27], T:[1.5,3] },
  { H:[140,150], B1:[40,60], B2:[40,54], C:[16,20], T:[1,2.5] },
  { H:[140,140], B1:[65,80], B2:[57,72], C:[18,25], T:[1.5,3] },
  { H:[150,150], B1:[60,80], B2:[52,72], C:[18,25], T:[1.5,3] },
  { H:[160,160], B1:[70,80], B2:[67,72], C:[18,25], T:[1.5,3] },
  { H:[180,180], B1:[70,80], B2:[67,72], C:[18,25], T:[1.5,3] },
  { H:[200,200], B1:[70,80], B2:[67,72], C:[18,25], T:[1.5,3] },
  { H:[220,220], B1:[70,80], B2:[67,72], C:[18,25], T:[1.5,3] },
  { H:[240,240], B1:[80,90], B2:[72,82], C:[18,27], T:[1.5,3] },
  { H:[250,250], B1:[80,90], B2:[72,82], C:[18,27], T:[1.5,3] },
  { H:[260,260], B1:[80,100], B2:[72,92], C:[20,27], T:[2,3] },
  { H:[280,280], B1:[80,100], B2:[72,92], C:[20,27], T:[2,3] },
  { H:[300,300], B1:[90,100], B2:[82,95], C:[22,27], T:[2,3] },
  { H:[320,320], B1:[100,100], B2:[92,95], C:[22,27], T:[2,3] },
  { H:[340,340], B1:[100,100], B2:[92,95], C:[22,27], T:[2,3] },
  { H:[350,350], B1:[100,100], B2:[92,95], C:[22,27], T:[2,3] },
]

export const PGS_ROWS: readonly PgsRow[] = [
  { H:[100,100], B:[40,54], C:[16,20], T:[1,2.5] },
  { H:[100,100], B:[65,72], C:[18,27], T:[1.5,3] },
  { H:[120,120], B:[40,54], C:[16,20], T:[1,2.5] },
  { H:[120,120], B:[65,72], C:[18,27], T:[1.5,3] },
  { H:[140,150], B:[40,54], C:[16,20], T:[1,2.5] },
  { H:[140,140], B:[65,72], C:[18,25], T:[1.5,3] },
  { H:[150,150], B:[60,72], C:[18,25], T:[1.5,3] },
  { H:[160,160], B:[70,72], C:[18,25], T:[1.5,3] },
  { H:[180,180], B:[70,72], C:[18,25], T:[1.5,3] },
  { H:[200,200], B:[70,72], C:[18,25], T:[1.5,3] },
  { H:[220,220], B:[70,72], C:[18,25], T:[1.5,3] },
  { H:[240,240], B:[80,82], C:[18,27], T:[1.5,3] },
  { H:[250,250], B:[80,82], C:[18,27], T:[1.5,3] },
  { H:[260,260], B:[80,92], C:[20,27], T:[2,3] },
  { H:[280,280], B:[80,92], C:[20,27], T:[2,3] },
  { H:[300,300], B:[90,100], C:[22,27], T:[2,3] },
  { H:[320,320], B:[100,100], C:[22,27], T:[2,3] },
  { H:[340,340], B:[100,100], C:[22,27], T:[2,3] },
  { H:[350,350], B:[100,100], C:[22,27], T:[2,3] },
]

export const PP_ROWS: readonly PpRow[] = [
  { H:100, B:[43,65], T:[1,1.2,1.5,2,2.5] },
  { H:104, B:[50,50], T:[1,1.2,1.5,2] },
  { H:110, B:[40,40], T:[1,1.2,1.5,2,2.5] },
  { H:120, B:[50,50], T:[1.5,2,2.5] },
  { H:124, B:[50,50], T:[1,1.2,1.5,2] },
  { H:140, B:[40,65], T:[1,1.2,1.5,2,2.5] },
  { H:145, B:[45,45], T:[1,1.2,1.5] },
  { H:150, B:[40,70], T:[1,1.2,1.5,2,2.5,3] },
  { H:152, B:[40,65], T:[1,1.2,1.5,2] },
  { H:154, B:[40,55], T:[1,1.2,1.5,2] },
  { H:160, B:[50,60], T:[1.5,2] },
  { H:170, B:[45,50], T:[1,1.2,1.5] },
  { H:172, B:[40,40], T:[1,1.2,1.5,2] },
  { H:174, B:[50,50], T:[1,1.2,1.5,2] },
  { H:179, B:[50,50], T:[1,1.2,1.5,2] },
  { H:180, B:[50,80], T:[1.5,2,2.5,3] },
  { H:195, B:[45,55], T:[1,1.2,1.5,2] },
  { H:200, B:[40,70], T:[1,1.2,1.5,2,2.5,3] },
  { H:202, B:[40,55], T:[1,1.2,1.5,2] },
  { H:204, B:[45,50], T:[1,1.2,1.5,2] },
  { H:220, B:[60,70], T:[1.5,2,2.5] },
  { H:250, B:[40,100], T:[1,1.2,1.5,2,2.5,3] },
  { H:254, B:[40,65], T:[1,1.2,1.5,2] },
  { H:256, B:[60,60], T:[2,2.5,3] },
  { H:284, B:[50,50], T:[1,1.2,1.5,2] },
  { H:300, B:[40,100], T:[1,1.2,1.5,2,2.5,3] },
  { H:304, B:[50,60], T:[1.5,2,2.5,3] },
  { H:306, B:[40,60], T:[1,1.2,1.5,2] },
  { H:350, B:[40,100], T:[1.5,2,2.5,3] },
]

export interface GostProfileInput {
  profileType: ProfileType
  thickness: number
  wallHeight: number
  shelfWidthA: number
  shelfWidthB: number
  flangeC1: number
  flangeC2?: number
}

export function matchesGostLgs2Intersection(input: GostProfileInput): boolean {
  if (input.profileType === 'SIGMA') return false

  const H = input.wallHeight
  const A = input.shelfWidthA
  const B = input.shelfWidthB
  const C1 = input.flangeC1
  const C2 = input.flangeC2 ?? C1
  const t = input.thickness

  if (input.profileType === 'PP') {
    if (Math.abs(A - B) > EPS) return false
    return PP_ROWS.some((r) => Math.abs(r.H - H) < EPS && inRange(A, r.B) && inList(t, r.T))
  }

  // The inherited LSTK data set defines one C range for both edge bends.
  if (Math.abs(C1 - C2) > EPS) return false

  if (input.profileType === 'PGS') {
    if (Math.abs(A - B) > EPS) return false
    return PGS_ROWS.some((r) => inRange(H, r.H) && inRange(A, r.B) && inRange(C1, r.C) && inRange(t, r.T))
  }

  return PZ_ROWS.some((r) =>
    inRange(H, r.H) && inRange(A, r.B1) && inRange(B, r.B2) && inRange(C1, r.C) && inRange(t, r.T),
  )
}
