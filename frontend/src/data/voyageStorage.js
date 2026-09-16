const LEGACY_STORAGE_KEYS = {
  archive: ['workaround-voyage-archive', 'workaround-voyage-archive:east-europe-2026'],
  checklist: ['workaround-voyage-checklist', 'workaround-voyage-checklist:east-europe-2026']
}

export function voyageStorageKey(voyageId, area) {
  return `voyage:${voyageId}:${area}`
}

export function migrateLegacyVoyageStorage(storage, voyageId = 'east-europe-2026') {
  if (!storage || voyageId !== 'east-europe-2026') {
    return []
  }

  const migrated = []
  for (const [area, legacyKeys] of Object.entries(LEGACY_STORAGE_KEYS)) {
    const nextKey = voyageStorageKey(voyageId, area)
    const existingValue = storage.getItem(nextKey)
    const legacyEntry = legacyKeys
      .map((key) => [key, storage.getItem(key)])
      .find(([, value]) => value !== null)

    if (existingValue === null && legacyEntry) {
      storage.setItem(nextKey, legacyEntry[1])
      migrated.push(area)
    }

    for (const legacyKey of legacyKeys) {
      storage.removeItem(legacyKey)
    }
  }

  return migrated
}

export function migrateVoyageDayStorage(storage, voyage) {
  if (!storage || !voyage?.id || !Array.isArray(voyage.days)) return false

  const nextKey = voyageStorageKey(voyage.id, 'days')
  const archiveKey = voyageStorageKey(voyage.id, 'archive')
  if (storage.getItem(nextKey) !== null) return false

  let archive
  try {
    archive = JSON.parse(storage.getItem(archiveKey) || '{}')
  } catch (error) {
    return false
  }

  const notes = archive?.notes && typeof archive.notes === 'object' ? archive.notes : {}
  const stamps = new Set(Array.isArray(archive?.stamps) ? archive.stamps : [])
  const cityChain = String(voyage.subtitle || '').split(' → ').filter(Boolean)
  const records = {}
  const lastDayByCity = new Map()
  let cursor = 0

  cityChain.forEach((city, index) => {
    const previousDay = lastDayByCity.get(city)
    const startIndex = Math.max(cursor, previousDay == null ? 0 : previousDay + 1)
    const matchedIndex = voyage.days.findIndex((day, dayIndex) => (
      dayIndex >= startIndex && String(day.city || '').includes(city)
    ))
    const dayIndex = matchedIndex >= 0 ? matchedIndex : Math.min(cursor, voyage.days.length - 1)
    const day = voyage.days[dayIndex]
    if (!day?.date) return

    cursor = dayIndex
    lastDayByCity.set(city, dayIndex)
    const stopId = `stop-${index + 1}`
    const note = typeof notes[stopId] === 'string' ? notes[stopId] : ''
    if (note || stamps.has(stopId)) {
      records[day.date] = {
        note,
        stamped: stamps.has(stopId)
      }
    }
  })

  if (!Object.keys(records).length) return false
  storage.setItem(nextKey, JSON.stringify({ records }))
  return true
}
