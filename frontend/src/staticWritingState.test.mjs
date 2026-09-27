import assert from 'node:assert/strict'
import {
  BLOG_POST_STORAGE_KEY,
  buildVoyageDayBackup,
  buildWritingBackup,
  parseVoyageDayBackup,
  safeWriteJson
} from './staticWritingState.js'

class MemoryStorage {
  constructor(entries = {}) {
    this.entries = new Map(Object.entries(entries))
  }

  getItem(key) {
    return this.entries.get(key) ?? null
  }

  setItem(key, value) {
    this.entries.set(key, value)
  }
}

const voyageKey = 'workaround-voyage-archive:central-europe-2026'
const storage = new MemoryStorage({
  [voyageKey]: JSON.stringify({ stamps: ['stop-1'], notes: { 'stop-1': '프라하 도착' } }),
  [BLOG_POST_STORAGE_KEY]: JSON.stringify([
    { id: 'draft-1', status: 'draft', title: '첫날' },
    { id: 'published-1', status: 'published', title: '공개 글' }
  ])
})

assert.equal(safeWriteJson(storage, 'sample', { ok: true }), true)
assert.deepEqual(JSON.parse(storage.getItem('sample')), { ok: true })

const backup = buildWritingBackup(storage, voyageKey, '2026-09-09T12:00:00.000Z')
assert.deepEqual(backup.travel.stamps, ['stop-1'])
assert.deepEqual(backup.travel.notes, { 'stop-1': '프라하 도착' })
assert.deepEqual(backup.blogDrafts.map((post) => post.id), ['draft-1'])

storage.setItem('voyage:east-europe-2026:days', JSON.stringify({
  records: { '2026-09-10': { note: '저녁 산책', stops: { 'meal-2-0': { krwAmount: '70000' } } } }
}))
const voyageBackup = buildVoyageDayBackup(
  storage,
  'voyage:east-europe-2026:days',
  'east-europe-2026',
  '2026-09-14T12:00:00.000Z'
)
assert.equal(voyageBackup.format, 'workaround-voyage-day-records')
assert.equal(voyageBackup.records['2026-09-10'].stops['meal-2-0'].krwAmount, '70000')
assert.deepEqual(parseVoyageDayBackup(JSON.stringify(voyageBackup), 'east-europe-2026'), voyageBackup.records)
assert.throws(() => parseVoyageDayBackup(JSON.stringify(voyageBackup), 'spain-2024'), /다른 여행/)

const failingStorage = { setItem() { throw new Error('quota') } }
assert.equal(safeWriteJson(failingStorage, 'sample', {}), false)

console.log('static writing: persistence and combined backup pass')
