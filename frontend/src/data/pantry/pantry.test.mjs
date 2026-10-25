import assert from 'node:assert/strict'
import { test } from 'node:test'
import { PANTRY_DISHES, PANTRY_SETS, PANTRY_TAG_GROUPS, filterSetsByTags, nearestSetFor, setTags, timeTagOf } from './index.js'

const dishIds = new Set(PANTRY_DISHES.map((dish) => dish.id))
const DRINK_NAMES = /맥주|소주|막걸리|하이볼|와인|사케|청하|위스키/

test('세트·요리 id 는 중복이 없다', () => {
  assert.equal(new Set(PANTRY_SETS.map((set) => set.id)).size, PANTRY_SETS.length)
  assert.equal(dishIds.size, PANTRY_DISHES.length)
})

test('세트의 main·sides·soup 은 모두 dishes 에 있는 id 를 가리킨다', () => {
  for (const set of PANTRY_SETS) {
    const refs = [set.main, ...(set.sides || []), set.soup].filter(Boolean)
    assert.ok(set.main, `${set.id}: main 필수`)
    for (const id of refs) assert.ok(dishIds.has(id), `${set.id}: 없는 요리 id ${id}`)
  }
})

test('술 태그는 페어링 종류와 일치한다', () => {
  for (const set of PANTRY_SETS) {
    assert.ok(set.tags.includes(set.pairing.type), `${set.id}: 술 태그 ${set.pairing.type} 누락`)
  }
})

test('무알코올 대안(alt)과 무알코올 세트 본문에는 술 이름이 없다', () => {
  for (const set of PANTRY_SETS) {
    assert.doesNotMatch(set.pairing.alt, DRINK_NAMES, `${set.id}: alt 에 술 이름`)
    if (set.pairing.type === '무알코올') {
      assert.doesNotMatch(JSON.stringify(set), DRINK_NAMES, `${set.id}: 본문에 술 이름`)
    }
  }
})

const CHIP_TAGS = new Set(PANTRY_TAG_GROUPS.flatMap((group) => group.tags))
const TIME_TAGS = new Set(PANTRY_TAG_GROUPS.find((group) => group.id === 'time').tags)
const DRINK_TAGS = new Set(PANTRY_TAG_GROUPS.find((group) => group.id === 'drink').tags)

test('세트마다 태그가 6개 이상이다 (TKT-212)', () => {
  for (const set of PANTRY_SETS) assert.ok(set.tags.length >= 6, `${set.id}: 태그 ${set.tags.length}개`)
})

test('세트 tags 는 칩에 있는 태그뿐이고 중복·시간 태그 직접 기재가 없다', () => {
  assert.equal(CHIP_TAGS.size, 36)
  for (const set of PANTRY_SETS) {
    assert.equal(new Set(set.tags).size, set.tags.length, `${set.id}: 중복 태그`)
    for (const tag of set.tags) {
      assert.ok(CHIP_TAGS.has(tag), `${set.id}: 칩 밖 태그 ${tag}`)
      assert.ok(!TIME_TAGS.has(tag), `${set.id}: 시간 태그 ${tag} 는 minutes 로 계산`)
    }
  }
})

test('시간 태그는 minutes 와 일치한다', () => {
  assert.equal(timeTagOf(15), '15분 이내')
  assert.equal(timeTagOf(16), '25분 이내')
  assert.equal(timeTagOf(25), '25분 이내')
  assert.equal(timeTagOf(26), '30분 이상')
  for (const set of PANTRY_SETS) {
    const times = setTags(set).filter((tag) => TIME_TAGS.has(tag))
    assert.equal(times.length, 1, `${set.id}: 시간 태그 1개`)
    assert.equal(times[0], timeTagOf(set.minutes))
  }
})

test('해장 세트에는 무알코올 외의 술 태그가 없고, 무알코올은 다른 술과 함께 쓰지 않는다', () => {
  for (const set of PANTRY_SETS) {
    const drinks = set.tags.filter((tag) => DRINK_TAGS.has(tag))
    if (set.tags.includes('해장')) assert.deepEqual(drinks.filter((tag) => tag !== '무알코올'), [], `${set.id}: 해장+술`)
    if (drinks.includes('무알코올')) assert.equal(drinks.length, 1, `${set.id}: 무알코올+술`)
  }
})

test('가까운 상은 고른 재료를 담은 세트에서만 고르고, 재료를 담은 세트가 없으면 null', () => {
  const chicken = nearestSetFor(PANTRY_SETS, ['닭', '사케'])
  assert.ok(chicken.set.tags.includes('닭'), '닭+사케 → 닭 세트')
  const fish = nearestSetFor(PANTRY_SETS, ['생선·회', '막걸리'])
  assert.ok(fish.set.tags.includes('생선·회'), '생선·회+막걸리 → 생선·회 세트')
  assert.equal(filterSetsByTags(PANTRY_SETS, ['닭', '사케']).length, 0)
  const none = nearestSetFor(PANTRY_SETS.filter((set) => !set.tags.includes('두부')), ['두부', '맥주'])
  assert.equal(none.set, null)
  assert.equal(none.missing, '두부')
  assert.ok(nearestSetFor(PANTRY_SETS, ['해장', '맥주']).set, '재료 없으면 겹침 최대')
})
