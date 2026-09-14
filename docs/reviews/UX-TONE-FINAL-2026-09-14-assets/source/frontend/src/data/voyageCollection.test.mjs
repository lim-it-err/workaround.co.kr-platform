import assert from 'node:assert/strict'
import { VOYAGE, VOYAGES, findVoyageById } from './voyage.js'

assert.deepEqual(
  VOYAGES.map((voyage) => voyage.id),
  ['east-europe-2026', 'iceland-2025-09', 'spain-2024-09'],
  '여행은 최신순으로 세 건이어야 한다'
)
assert.equal(new Set(VOYAGES.map((voyage) => voyage.id)).size, VOYAGES.length, '여행 ID는 고유해야 한다')
assert.equal(VOYAGE.id, 'east-europe-2026', 'boarding 여행이 호환 VOYAGE 별칭이어야 한다')
assert.equal(VOYAGE.status, 'boarding', '현재 동유럽 여행은 운행 중이어야 한다')
assert.equal(findVoyageById('iceland-2025-09')?.title, '아이슬란드')
assert.equal(findVoyageById('missing'), null)

for (const voyage of VOYAGES) {
  assert.ok(['planned', 'boarding', 'arrived'].includes(voyage.status), `${voyage.id}: 유효한 여행 상태가 필요하다`)
  assert.ok(voyage.period?.start && voyage.period?.end, `${voyage.id}: 기간이 필요하다`)
  assert.ok(Array.isArray(voyage.cities), `${voyage.id}: 도시 배열이 필요하다`)
}

for (const voyageId of ['iceland-2025-09', 'spain-2024-09']) {
  const voyage = findVoyageById(voyageId)
  assert.equal(voyage.status, 'arrived')
  assert.equal(voyage.period.approximate, true)
  assert.equal(voyage.summary, '내용 준비 중')
  assert.deepEqual(voyage.days, [])
}

console.log('voyage collection: 3/3, current alias and arrived skeletons pass')
