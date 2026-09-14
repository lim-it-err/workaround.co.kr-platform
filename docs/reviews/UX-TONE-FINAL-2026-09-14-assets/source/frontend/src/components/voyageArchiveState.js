import { safeWriteJson } from '../staticWritingState.js'

export function buildVoyageStops(voyage, todayKey) {
  const cityChain = voyage.subtitle.split(' → ')
  const lastDayByCity = new Map()
  let cursor = 0

  return cityChain.map((city, index) => {
    const previousDay = lastDayByCity.get(city)
    const startIndex = Math.max(cursor, previousDay == null ? 0 : previousDay + 1)
    const matchedIndex = voyage.days.findIndex((day, dayIndex) => (
      dayIndex >= startIndex && day.city.includes(city)
    ))
    const dayIndex = matchedIndex >= 0 ? matchedIndex : Math.min(cursor, voyage.days.length - 1)
    const day = voyage.days[dayIndex]

    cursor = dayIndex
    lastDayByCity.set(city, dayIndex)

    return {
      id: `stop-${index + 1}`,
      order: index + 1,
      city,
      date: day.date,
      dow: day.dow,
      visited: day.date <= todayKey
    }
  })
}

export function readVoyageArchiveState(storage, key, validIds) {
  try {
    const parsed = JSON.parse(storage.getItem(key) || '{}')
    const stamps = Array.isArray(parsed.stamps)
      ? Array.from(new Set(parsed.stamps.filter((id) => validIds.has(id))))
      : []
    const notes = Object.fromEntries(Object.entries(parsed.notes || {}).filter(([id, value]) => (
      validIds.has(id) && typeof value === 'string'
    )))
    return { stamps, notes }
  } catch (error) {
    return { stamps: [], notes: {} }
  }
}

export function writeVoyageArchiveState(storage, key, state) {
  return safeWriteJson(storage, key, state)
}
