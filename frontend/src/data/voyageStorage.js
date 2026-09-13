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
