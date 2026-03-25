import { describe, expect, it } from 'vitest'
import { findPopularStripsFromWaste, parseStripData } from './stripData'

describe('parseStripData', () => {
  it('parses 1C strip report lines', () => {
    const source = [
      'Штрипс 100х50 (П350) - 195\t12 000\t450',
      'Штрипс 100х50 (П350) - 210\t8 000\t100',
      'Не строка штрипса\t1\t2',
    ].join('\n')

    const rows = parseStripData(source)
    expect(rows.length).toBe(2)
    expect(rows[0].name).toContain('Штрипс')
    expect(rows[0].thickness).toBe(50)
  })
})

describe('findPopularStripsFromWaste', () => {
  it('returns top strips that fit waste and thickness', () => {
    const strips = [
      { name: 'A', width: 180, thickness: 1.2, steelGrade: 'П350', consumption: 1000, balance: 50 },
      { name: 'B', width: 170, thickness: 1.2, steelGrade: 'П350', consumption: 2000, balance: 20 },
      { name: 'C', width: 220, thickness: 1.2, steelGrade: 'П350', consumption: 3000, balance: 30 },
    ]

    const result = findPopularStripsFromWaste(strips, 200, 1.2)
    expect(result.length).toBe(2)
    expect(result[0].name).toBe('A')
  })
})
