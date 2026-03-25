export interface StripRecord {
  name: string
  width: number
  thickness: number
  steelGrade: string
  consumption: number
  balance: number
}

interface ParsedName {
  width: number | null
  thickness: number | null
  steelGrade: string | null
}

export function parseStripData(fileContent: string): StripRecord[] {
  const lines = fileContent.split('\n')
  const dataRegex = /^Штрипс\s/i
  const result: StripRecord[] = []

  for (const line of lines) {
    const trimmedLine = line.trim()
    if (!dataRegex.test(trimmedLine)) continue

    const rawParts = trimmedLine.split('\t').map((p) => p.trim())
    const name = rawParts[0]
    if (!name) continue

    const consumption = parseNumber(rawParts[1] || '0')
    const balance = parseNumber(rawParts[2] || '0')
    const parsed = parseNameDetails(name)

    if (parsed.width && parsed.thickness && parsed.steelGrade) {
      result.push({
        name: name.replace(/, п\.м$/i, '').trim(),
        width: parsed.width,
        thickness: parsed.thickness,
        steelGrade: parsed.steelGrade,
        consumption,
        balance,
      })
    }
  }

  return result
}

export function findPopularStripsFromWaste(
  strips: StripRecord[],
  availableWasteWidth: number,
  targetThickness: number,
): StripRecord[] {
  const suitable = strips.filter((strip) => {
    const thicknessMatch = Math.abs(strip.thickness - targetThickness) < 0.001
    return thicknessMatch && strip.width <= availableWasteWidth
  })

  suitable.sort((left, right) => {
    if (right.width !== left.width) return right.width - left.width
    return right.consumption - left.consumption
  })

  return suitable.slice(0, 5)
}

function parseNumber(numStr: string): number {
  if (!numStr) return 0
  return parseFloat(numStr.replace(/\s/g, '').replace(',', '.')) || 0
}

function parseNameDetails(name: string): ParsedName {
  let width: number | null = null
  let thickness: number | null = null
  let steelGrade: string | null = null

  const steelMatch = name.match(/\((08ПС|П350|П390)\)/)
  if (steelMatch) {
    steelGrade = steelMatch[1]
  }

  let widthMatch = name.match(/\s-\s*([0-9,.]+)/)
  if (widthMatch) {
    width = parseNumber(widthMatch[1])
  } else {
    widthMatch = name.match(/^Штрипс\s+([0-9,.]+)/)
    if (widthMatch) {
      width = parseNumber(widthMatch[1])
    }
  }

  const numbersBeforeSteel = steelMatch ? name.substring(0, steelMatch.index) : name
  const thicknessMatches = numbersBeforeSteel.match(/[х*]\s*([0-9,.]+)/g)

  if (thicknessMatches && thicknessMatches.length > 0) {
    const lastMatch = thicknessMatches[thicknessMatches.length - 1]
    thickness = parseNumber(lastMatch.substring(1))
  } else {
    const specialThickMatch = name.match(/Оцинк\.\s*([0-9,.]+)/i)
    if (specialThickMatch) {
      thickness = parseNumber(specialThickMatch[1])
    }
  }

  if (width && width < 10) {
    width = width * 1000
  }

  return { width, thickness, steelGrade }
}
