export const DRAFT_STORAGE_KEY = 'advisor.drafts.v1'

export function draftKey(missionId, mode = 'developer') {
  return `${missionId}:${mode}`
}

function readCollection(storage) {
  const raw = storage.getItem(DRAFT_STORAGE_KEY)
  if (!raw) return {}
  const parsed = JSON.parse(raw)
  return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
}

export function readDraft(missionId, mode = 'developer', storage = localStorage) {
  const entry = readCollection(storage)[draftKey(missionId, mode)]
  if (!entry || typeof entry !== 'object') return null
  return {
    files: Array.isArray(entry.files)
      ? entry.files.map((file) => ({ name: String(file?.name ?? ''), body: String(file?.body ?? '') }))
      : [],
    description: String(entry.description ?? ''),
    updatedAt: String(entry.updatedAt ?? ''),
  }
}

export function writeDraft({ missionId, mode = 'developer', files, description, now = new Date() }, storage = localStorage) {
  const collection = readCollection(storage)
  const entry = {
    files: files.map((file) => ({ name: String(file?.name ?? ''), body: String(file?.body ?? '') })),
    description: String(description ?? ''),
    updatedAt: now.toISOString(),
  }
  collection[draftKey(missionId, mode)] = entry
  storage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(collection))
  return entry
}

export function clearDraftThrough(missionId, mode, submittedAt, storage = localStorage) {
  const collection = readCollection(storage)
  const key = draftKey(missionId, mode)
  const entry = collection[key]
  if (!entry) return false

  const draftTime = Date.parse(entry.updatedAt)
  const submitTime = submittedAt instanceof Date ? submittedAt.getTime() : Date.parse(submittedAt)
  if (!Number.isFinite(draftTime) || !Number.isFinite(submitTime) || draftTime > submitTime) return false

  delete collection[key]
  if (Object.keys(collection).length) storage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(collection))
  else storage.removeItem(DRAFT_STORAGE_KEY)
  return true
}
