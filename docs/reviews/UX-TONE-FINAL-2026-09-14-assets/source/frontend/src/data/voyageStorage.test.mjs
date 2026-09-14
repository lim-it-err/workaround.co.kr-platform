import assert from 'node:assert/strict'
import test from 'node:test'
import { migrateLegacyVoyageStorage, migrateVoyageDayStorage, voyageStorageKey } from './voyageStorage.js'

function createStorage(entries = []) {
  const values = new Map(entries)
  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null
    },
    setItem(key, value) {
      values.set(key, String(value))
    },
    removeItem(key) {
      values.delete(key)
    }
  }
}

test('기존 동유럽 저장값을 여행 ID 프리픽스 키로 한 번 이행한다', () => {
  const storage = createStorage([
    ['workaround-voyage-archive:east-europe-2026', '{"notes":{"stop-1":"기록"}}'],
    ['workaround-voyage-checklist:east-europe-2026', '["flight"]']
  ])

  assert.deepEqual(migrateLegacyVoyageStorage(storage), ['archive', 'checklist'])
  assert.equal(storage.getItem(voyageStorageKey('east-europe-2026', 'archive')), '{"notes":{"stop-1":"기록"}}')
  assert.equal(storage.getItem(voyageStorageKey('east-europe-2026', 'checklist')), '["flight"]')
  assert.equal(storage.getItem('workaround-voyage-archive:east-europe-2026'), null)
  assert.deepEqual(migrateLegacyVoyageStorage(storage), [])
})

test('새 키가 있으면 기존 값을 덮어쓰지 않고 낡은 키만 제거한다', () => {
  const storage = createStorage([
    [voyageStorageKey('east-europe-2026', 'archive'), '{"notes":{"stop-1":"새 값"}}'],
    ['workaround-voyage-archive', '{"notes":{"stop-1":"옛 값"}}']
  ])

  assert.deepEqual(migrateLegacyVoyageStorage(storage), [])
  assert.equal(storage.getItem(voyageStorageKey('east-europe-2026', 'archive')), '{"notes":{"stop-1":"새 값"}}')
  assert.equal(storage.getItem('workaround-voyage-archive'), null)
})

test('다른 여행 ID는 동유럽 기존 키 이행 대상이 아니다', () => {
  const storage = createStorage([['workaround-voyage-archive', '{}']])
  assert.deepEqual(migrateLegacyVoyageStorage(storage, 'spain-2024-09'), [])
  assert.equal(storage.getItem('workaround-voyage-archive'), '{}')
})

test('도시별 기록을 같은 여행의 일차 actual 저장 구조로 이행한다', () => {
  const voyage = {
    id: 'sample',
    subtitle: '서울 → 빈 → 서울',
    days: [
      { date: '2026-01-01', city: '서울' },
      { date: '2026-01-02', city: '빈' },
      { date: '2026-01-03', city: '서울' }
    ]
  }
  const storage = createStorage([[
    voyageStorageKey('sample', 'archive'),
    JSON.stringify({ stamps: ['stop-2'], notes: { 'stop-2': '커피가 좋았다', 'stop-3': '귀국' } })
  ]])

  assert.equal(migrateVoyageDayStorage(storage, voyage), true)
  assert.deepEqual(JSON.parse(storage.getItem(voyageStorageKey('sample', 'days'))), {
    records: {
      '2026-01-02': { note: '커피가 좋았다', stamped: true },
      '2026-01-03': { note: '귀국', stamped: false }
    }
  })
  assert.equal(migrateVoyageDayStorage(storage, voyage), false, '새 구조가 있으면 덮어쓰지 않는다')
})
