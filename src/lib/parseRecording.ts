const RACE_START_LINE = /^\s*\d+\s+\$B\b/

/** End-of-race idle $F: both race timers 00:00:00, last quoted field whitespace-only. */
const IDLE_END_RACE_F =
  /^\s*\d+\s+\$F,0,"00:00:00","[^"]*","00:00:00","\s*"\s*$/

const B_LINE_LABEL =
  /^\s*\d+\s+\$B\s*,\s*([^,]+)\s*,\s*"([^"]*)"/

export function isRaceStartLine(line: string): boolean {
  return RACE_START_LINE.test(line)
}

export function isIdleEndRaceFLine(line: string): boolean {
  return IDLE_END_RACE_F.test(line)
}

export function filterExportLines(lines: readonly string[]): string[] {
  return lines.filter((line) => !isIdleEndRaceFLine(line))
}

function parseFirstColumnTimestamp(line: string): number | null {
  const m = /^\s*(\d+)/.exec(line)
  if (!m) return null
  const n = Number(m[1])
  return Number.isFinite(n) ? n : null
}

/** Subtract min(first column) so each exported race starts at timestamp 0. Lines without a leading integer are unchanged. */
export function shiftFirstColumnTimestampsToZero(
  lines: readonly string[],
): string[] {
  let minTs: number | null = null
  for (const line of lines) {
    const t = parseFirstColumnTimestamp(line)
    if (t !== null) minTs = minTs === null ? t : Math.min(minTs, t)
  }
  if (minTs === null) return [...lines]

  return lines.map((line) => {
    const m = /^(\s*)(\d+)/.exec(line)
    if (!m) return line
    const ts = Number(m[2])
    if (!Number.isFinite(ts)) return line
    return m[1] + String(ts - minTs) + line.slice(m[0].length)
  })
}

function parseRaceLabelFromBLine(line: string): { id: string; title: string } {
  const m = B_LINE_LABEL.exec(line)
  if (m) {
    return { id: m[1].trim(), title: m[2] }
  }
  return { id: '', title: '' }
}

export type ParsedRace = {
  index: number
  displayName: string
  safeSlug: string
  exportLines: string[]
  messageCount: number
  tickMin: number | null
  tickMax: number | null
  tickSpan: number | null
}

export type ParseRecordingResult =
  | { kind: 'empty' }
  | { kind: 'no-races' }
  | { kind: 'ok'; races: ParsedRace[] }

function statsForLines(lines: readonly string[]): {
  messageCount: number
  tickMin: number | null
  tickMax: number | null
  tickSpan: number | null
} {
  let tickMin: number | null = null
  let tickMax: number | null = null
  for (const line of lines) {
    const t = parseFirstColumnTimestamp(line)
    if (t === null) continue
    tickMin = tickMin === null ? t : Math.min(tickMin, t)
    tickMax = tickMax === null ? t : Math.max(tickMax, t)
  }
  const tickSpan =
    tickMin !== null && tickMax !== null ? tickMax - tickMin : null
  return {
    messageCount: lines.length,
    tickMin,
    tickMax,
    tickSpan,
  }
}

function sanitizeSlugPart(s: string): string {
  return s
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)
}

export function parseRecording(text: string): ParseRecordingResult {
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  if (normalized.trim() === '') {
    return { kind: 'empty' }
  }

  const lines = normalized.split('\n')
  const bIndices: number[] = []
  for (let i = 0; i < lines.length; i++) {
    if (isRaceStartLine(lines[i])) bIndices.push(i)
  }

  if (bIndices.length === 0) {
    return { kind: 'no-races' }
  }

  type RawSeg = {
    raceId: string
    displayName: string
    safeSlug: string
    rawLines: string[]
  }

  const rawSegments: RawSeg[] = []
  for (let r = 0; r < bIndices.length; r++) {
    const start = bIndices[r]
    const endExclusive =
      r + 1 < bIndices.length ? bIndices[r + 1] : lines.length
    const rawSegment = lines.slice(start, endExclusive)
    const bLine = lines[bIndices[r]]
    const { id, title } = parseRaceLabelFromBLine(bLine)
    const slugFromTitle = sanitizeSlugPart(title || id || `race-${r + 1}`)
    const safeSlug = slugFromTitle || `race-${r + 1}`
    const displayName =
      title && id
        ? `${id} — ${title}`
        : title || id || `Race ${r + 1}`

    rawSegments.push({
      raceId: id,
      displayName,
      safeSlug,
      rawLines: rawSegment,
    })
  }

  const mergedRaw: RawSeg[] = []
  for (const seg of rawSegments) {
    const prev = mergedRaw[mergedRaw.length - 1]
    const canMerge =
      prev !== undefined &&
      prev.raceId !== '' &&
      seg.raceId !== '' &&
      prev.raceId === seg.raceId
    if (canMerge) {
      prev.rawLines.push(...seg.rawLines)
    } else {
      mergedRaw.push({
        raceId: seg.raceId,
        displayName: seg.displayName,
        safeSlug: seg.safeSlug,
        rawLines: [...seg.rawLines],
      })
    }
  }

  const races: ParsedRace[] = mergedRaw.map((seg, i) => {
    const exportLines = shiftFirstColumnTimestampsToZero(
      filterExportLines(seg.rawLines),
    )
    const stats = statsForLines(exportLines)
    return {
      index: i + 1,
      displayName: seg.displayName,
      safeSlug: seg.safeSlug,
      exportLines,
      ...stats,
    }
  })

  return { kind: 'ok', races }
}

export function joinExportText(lines: readonly string[]): string {
  if (lines.length === 0) return ''
  return lines.join('\n') + '\n'
}
