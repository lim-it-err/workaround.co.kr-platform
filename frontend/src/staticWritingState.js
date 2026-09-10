export const LOCAL_WRITING_NOTICE = '이 브라우저에만 저장됩니다. 다른 기기와 동기화되지 않습니다.'
export const LOCAL_WRITING_HELP = '브라우저 데이터를 지우거나 시크릿 모드를 사용하면 기록이 사라질 수 있으며, 다른 기기에서는 이어지지 않습니다.'
export const BLOG_POST_STORAGE_KEY = 'workaround-blog-posts'

function readJson(storage, key, fallback) {
  try {
    const raw = storage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch (error) {
    return fallback
  }
}

export function safeWriteJson(storage, key, value) {
  try {
    storage.setItem(key, JSON.stringify(value))
    return true
  } catch (error) {
    return false
  }
}

export function buildWritingBackup(storage, voyageStorageKey, exportedAt = new Date().toISOString()) {
  const voyage = readJson(storage, voyageStorageKey, {})
  const posts = readJson(storage, BLOG_POST_STORAGE_KEY, [])
  return {
    format: 'workaround-local-writing',
    version: 1,
    exportedAt,
    travel: {
      stamps: Array.isArray(voyage.stamps) ? voyage.stamps : [],
      notes: voyage.notes && typeof voyage.notes === 'object' ? voyage.notes : {}
    },
    blogDrafts: Array.isArray(posts) ? posts.filter((post) => post?.status === 'draft') : []
  }
}

export function downloadWritingBackup(storage, voyageStorageKey, browser = globalThis) {
  const backup = buildWritingBackup(storage, voyageStorageKey)
  const blob = new browser.Blob([`${JSON.stringify(backup, null, 2)}\n`], { type: 'application/json' })
  const objectUrl = browser.URL.createObjectURL(blob)
  const anchor = browser.document.createElement('a')
  const date = backup.exportedAt.slice(0, 10)
  anchor.href = objectUrl
  anchor.download = `workaround-writing-backup-${date}.json`
  browser.document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  browser.URL.revokeObjectURL(objectUrl)
  return anchor.download
}
