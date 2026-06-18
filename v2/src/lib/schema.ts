import { z } from 'zod'
import {
  DEFAULT_PRICE_PER_TON,
  RANGES,
  THICKNESS_OPTIONS,
  type ProfileType,
} from './constants'

const thicknessValues = THICKNESS_OPTIONS as readonly number[]

export const profileTypeSchema = z.enum(['PP', 'PGS', 'PZ'])

export const formSchema = z.object({
  profileType: profileTypeSchema,
  thickness: z
    .number()
    .refine((v) => thicknessValues.includes(v), 'Недопустимая толщина'),
  wallHeight: z
    .number()
    .min(RANGES.H.min, `Высота: ${RANGES.H.min}–${RANGES.H.max} мм`)
    .max(RANGES.H.max, `Высота: ${RANGES.H.min}–${RANGES.H.max} мм`),
  shelfWidthA: z
    .number()
    .min(RANGES.a.min, `Полка a: ${RANGES.a.min}–${RANGES.a.max} мм`)
    .max(RANGES.a.max, `Полка a: ${RANGES.a.min}–${RANGES.a.max} мм`),
  shelfWidthB: z
    .number()
    .min(RANGES.B.min, `Полка B: ${RANGES.B.min}–${RANGES.B.max} мм`)
    .max(RANGES.B.max, `Полка B: ${RANGES.B.min}–${RANGES.B.max} мм`),
  flangeC: z
    .number()
    .min(RANGES.C.min, `Отгибка C: ${RANGES.C.min}–${RANGES.C.max} мм`)
    .max(RANGES.C.max, `Отгибка C: ${RANGES.C.min}–${RANGES.C.max} мм`),
  pricePerTon: z.number().positive('Цена должна быть больше 0'),
})

export type FormData = z.infer<typeof formSchema>

export const defaultFormValues: FormData = {
  profileType: 'PP' as ProfileType,
  thickness: 1.2,
  wallHeight: 200,
  shelfWidthA: 60,
  shelfWidthB: 60,
  flangeC: 15,
  pricePerTon: DEFAULT_PRICE_PER_TON,
}
