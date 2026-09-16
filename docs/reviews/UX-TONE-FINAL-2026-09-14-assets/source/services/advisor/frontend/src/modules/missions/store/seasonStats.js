export const SEASON_LENGTH_DAYS = 28
export const SEASON_STAT_KEYS = ['vision', 'voice', 'judgment', 'culture']

const DAY_MS = 86_400_000

export function localDateKey(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function dateSerial(dateKey) {
  const [year, month, day] = String(dateKey).split('-').map(Number)
  if (!year || !month || !day) return Number.NaN
  return Date.UTC(year, month - 1, day) / DAY_MS
}

function dateFromSerial(serial) {
  const date = new Date(serial * DAY_MS)
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`
}

function dayOffset(seasonStart, dateKey) {
  return dateSerial(dateKey) - dateSerial(seasonStart)
}

export function seasonId(seasonStart) {
  return `season-${seasonStart}`
}

export function seasonEndDate(seasonStart) {
  return dateFromSerial(dateSerial(seasonStart) + SEASON_LENGTH_DAYS - 1)
}

// 구 seasonStats 객체를 읽는 동안만 쓰는 호환 정규화다. 저장은 seasons 모델만 사용한다.
export function normalizeSeasonStats(raw, today = new Date()) {
  const seasonStart = Number.isFinite(dateSerial(raw?.seasonStart))
    ? raw.seasonStart
    : localDateKey(today)

  return {
    seasonStart,
    gains: Array.isArray(raw?.gains) ? raw.gains.map((gain) => ({ ...gain })) : [],
  }
}

function normalizeSeason(raw, fallbackId, today) {
  const fallbackStart = String(fallbackId).replace(/^season-/, '')
  const start = Number.isFinite(dateSerial(raw?.start))
    ? raw.start
    : Number.isFinite(dateSerial(fallbackStart))
      ? fallbackStart
      : localDateKey(today)
  const id = seasonId(start)
  return {
    id,
    start,
    end: Number.isFinite(dateSerial(raw?.end)) ? raw.end : seasonEndDate(start),
    gains: Array.isArray(raw?.gains) ? raw.gains.map((gain) => ({ ...gain })) : [],
    closedAt: raw?.closedAt ?? null,
    ending: raw?.ending?.id
      ? { id: raw.ending.id, title: raw.ending.title ?? '' }
      : null,
  }
}

export function normalizeSeasons(raw, legacySeasonStats, today = new Date()) {
  const byId = {}
  if (raw?.byId && typeof raw.byId === 'object') {
    for (const [rawId, entry] of Object.entries(raw.byId)) {
      if (!entry || typeof entry !== 'object') continue
      const normalized = normalizeSeason(entry, rawId, today)
      byId[normalized.id] = normalized
    }
    const activeId = typeof raw.activeId === 'string' && byId[raw.activeId]
      ? raw.activeId
      : null
    return {
      activeId,
      byId,
      pendingGains: Array.isArray(raw.pendingGains)
        ? raw.pendingGains.map((gain) => ({ ...gain }))
        : [],
    }
  }

  if (legacySeasonStats && typeof legacySeasonStats === 'object') {
    const legacy = normalizeSeasonStats(legacySeasonStats, today)
    const id = seasonId(legacy.seasonStart)
    byId[id] = normalizeSeason({
      start: legacy.seasonStart,
      gains: legacy.gains,
      closedAt: null,
      ending: null,
    }, id, today)
    return { activeId: id, byId, pendingGains: [] }
  }

  return { activeId: null, byId, pendingGains: [] }
}

export function activeSeason(seasons) {
  return seasons?.activeId ? seasons.byId?.[seasons.activeId] ?? null : null
}

export function recordSeasonGain(season, { date = localDateKey(), stat, amount, source }) {
  if (!season) return { ok: false, reason: 'no-season' }
  const start = season.start ?? season.seasonStart
  const offset = dayOffset(start, date)
  if (!SEASON_STAT_KEYS.includes(stat) || !Number.isFinite(amount) || amount <= 0 || !source) {
    return { ok: false, reason: 'invalid' }
  }
  if (!Number.isFinite(offset) || offset < 0) return { ok: false, reason: 'outside' }
  if (offset >= SEASON_LENGTH_DAYS) return { ok: false, reason: 'ended' }
  if (season.gains.some((gain) => gain.date === date && gain.source === source)) {
    return { ok: false, reason: 'duplicate' }
  }

  const gain = { date, stat, amount, source }
  season.gains.push(gain)
  return { ok: true, gain }
}

export function seasonTotals(season) {
  const totals = Object.fromEntries(SEASON_STAT_KEYS.map((stat) => [stat, 0]))
  if (!season) return totals
  const start = season.start ?? season.seasonStart
  for (const gain of season.gains ?? []) {
    const offset = dayOffset(start, gain.date)
    if (SEASON_STAT_KEYS.includes(gain.stat) && offset >= 0 && offset < SEASON_LENGTH_DAYS) {
      totals[gain.stat] += Number(gain.amount) || 0
    }
  }
  return totals
}

export function lifetimeTotals(seasons) {
  const totals = Object.fromEntries(SEASON_STAT_KEYS.map((stat) => [stat, 0]))
  for (const season of Object.values(seasons?.byId ?? {})) {
    const current = seasonTotals(season)
    for (const stat of SEASON_STAT_KEYS) totals[stat] += current[stat]
  }
  return totals
}

export function seasonTiming(seasonStart, today = new Date()) {
  const todayKey = localDateKey(today)
  const elapsed = dayOffset(seasonStart, todayKey)
  const remaining = Math.max(0, SEASON_LENGTH_DAYS - 1 - elapsed)
  return {
    today: todayKey,
    endDate: seasonEndDate(seasonStart),
    day: Math.min(SEASON_LENGTH_DAYS, Math.max(1, elapsed + 1)),
    ended: elapsed >= SEASON_LENGTH_DAYS,
    dDay: elapsed >= SEASON_LENGTH_DAYS ? '종료' : remaining === 0 ? 'D-Day' : `D-${remaining}`,
  }
}

export function countPerfectDays(routineHistory, seasonStart) {
  return Object.entries(routineHistory ?? {}).filter(([date, completed]) => {
    const offset = dayOffset(seasonStart, date)
    if (offset < 0 || offset >= SEASON_LENGTH_DAYS) return false
    const weekday = new Date(`${date}T00:00:00`).getDay()
    const slotCount = weekday === 0 || weekday === 6 ? 2 : 3
    return Number(completed) >= slotCount
  }).length
}

export function selectSeasonEnding(endings, totals, perfectDays) {
  const hidden = endings.find((ending) => ending.condition.type === 'hidden')
  if (perfectDays >= 24 && hidden) return hidden

  const ranked = SEASON_STAT_KEYS
    .map((stat) => ({ stat, value: totals[stat] ?? 0 }))
    .sort((a, b) => b.value - a.value)
  const total = ranked.reduce((sum, entry) => sum + entry.value, 0)

  if (total >= 40 && ranked[0].value >= ranked[1].value * 1.5) {
    const dominant = endings.find(
      (ending) => ending.condition.type === 'dominant' && ending.condition.stat === ranked[0].stat,
    )
    if (dominant) return dominant
  }

  if (total >= 60 && ranked[ranked.length - 1].value >= ranked[0].value / 2) {
    const balanced = endings.find((ending) => ending.condition.type === 'balanced')
    if (balanced) return balanced
  }

  return endings.find((ending) => ending.condition.type === 'quiet') ?? null
}

export function lockSeasonEnding(season, routineHistory, endings, today = new Date()) {
  if (!season || season.ending || !seasonTiming(season.start, today).ended) return false
  const selected = selectSeasonEnding(
    endings,
    seasonTotals(season),
    countPerfectDays(routineHistory, season.start),
  )
  if (!selected) return false
  season.ending = { id: selected.id, title: selected.title }
  return true
}

function endingDetails(ending, endings) {
  if (!ending) return null
  return endings.find((candidate) => candidate.id === ending.id) ?? ending
}

export function buildSeasonOverview(season, routineHistory, endings, today = new Date()) {
  if (!season) return null
  const totals = seasonTotals(season)
  const perfectDays = countPerfectDays(routineHistory, season.start)
  return {
    ...seasonTiming(season.start, today),
    id: season.id,
    seasonStart: season.start,
    totals,
    total: Object.values(totals).reduce((sum, value) => sum + value, 0),
    perfectDays,
    recentGains: [...season.gains].reverse().slice(0, 10),
    ending: endingDetails(season.ending, endings),
    closedAt: season.closedAt,
  }
}

export function startNewSeason(seasons, now = new Date()) {
  const current = activeSeason(seasons)
  if (current && !seasonTiming(current.start, now).ended) {
    return { ok: false, reason: 'active' }
  }

  const today = localDateKey(now)
  const id = seasonId(today)
  if (seasons.byId[id]) return { ok: false, reason: 'exists' }
  if (current) current.closedAt = now.toISOString()

  const season = {
    id,
    start: today,
    end: seasonEndDate(today),
    gains: [],
    closedAt: null,
    ending: null,
  }
  seasons.byId[id] = season
  seasons.activeId = id

  const pending = [...(seasons.pendingGains ?? [])]
  seasons.pendingGains = []
  let retried = 0
  for (const gain of pending) {
    const result = recordSeasonGain(season, { ...gain, date: today })
    if (result.ok) retried += 1
    else seasons.pendingGains.push(gain)
  }
  return { ok: true, season, retried }
}
