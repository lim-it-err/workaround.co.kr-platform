import assert from 'node:assert/strict'
import { test } from 'node:test'
import { PANTRY_DISHES, PANTRY_SETS } from './index.js'

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

test('세트마다 태그가 12개 이상이라 조합이 넓게 맞는다 (TKT-206)', () => {
  for (const set of PANTRY_SETS) assert.ok(set.tags.length >= 12, `${set.id}: 태그 ${set.tags.length}개`)
})
