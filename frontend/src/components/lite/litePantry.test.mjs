import assert from 'node:assert/strict'
import { test } from 'node:test'
import { PANTRY_SETS, setTags } from '../../data/pantry/index.js'
import { buildQuestions, candidatesFor, describeSet, pickSet } from './litePantry.js'

test('질문 3개, 각 질문 끝에 상관없음, 모든 옵션이 실제 세트에 쓰인다', () => {
  const qs = buildQuestions()
  assert.equal(qs.length, 3)
  assert.deepEqual(qs[0].options.slice(0, 3).map((o) => o.label), ['15분 이내', '25분 이내', '30분 이상'])
  for (const q of qs) {
    assert.equal(q.options[q.options.length - 1].label, '상관없음')
    for (const o of q.options.slice(0, -1)) assert.ok(PANTRY_SETS.some((s) => setTags(s).includes(o.tag)), o.tag)
  }
  assert.ok(qs[2].options.every((o) => o.tag === null || ['평일', '주말', '야식', '해장', '한잔'].includes(o.tag)))
})

test('상관없음 3번 = 전체 세트', () => {
  const r = candidatesFor([null, null, null])
  assert.equal(r.exact, true)
  assert.equal(r.sets.length, PANTRY_SETS.length)
})

test('조합 결과는 그 태그를 모두 가진 세트', () => {
  const r = candidatesFor(['25분 이내', '김치', null])
  assert.ok(r.sets.length > 0)
  for (const s of r.sets) assert.ok(['25분 이내', '김치'].every((t) => setTags(s).includes(t)))
})

test('0건 조합은 가까운 상 하나 또는 empty', () => {
  const r = candidatesFor(['15분 이내', '김치', '해장'], PANTRY_SETS.filter((s) => s.id === 'autumn-sunday'))
  assert.equal(r.exact, false)
  assert.equal(r.empty, false)
  assert.equal(r.sets.length, 1)
  const none = candidatesFor(['15분 이내', '두부', '해장'], [])
  assert.equal(none.empty, true)
  assert.equal(pickSet(none.sets), null)
})

test('pickSet: 난수 고정, 본 것은 후보가 남는 한 안 나오고 소진되면 마지막만 피한다', () => {
  const c = [{ id: 'a' }, { id: 'b' }, { id: 'c' }]
  assert.equal(pickSet(c, [], () => 0).id, 'a')
  assert.equal(pickSet(c, [], () => 0.999).id, 'c')
  assert.equal(pickSet(c, ['a'], () => 0).id, 'b')
  assert.equal(pickSet(c, ['a', 'b', 'c'], () => 0).id, 'a')
  assert.equal(pickSet(c, ['c', 'a', 'b'], () => 0.999).id, 'c')
  assert.equal(pickSet([{ id: 'x' }], ['x']).id, 'x')
})

test('describeSet: 제목·분·원·주메뉴 이름·술 한 줄', () => {
  const d = describeSet(PANTRY_SETS[0])
  assert.equal(d.title, PANTRY_SETS[0].title)
  assert.match(d.meta, /분 · .*원$/)
  assert.ok(d.mainName && d.mainName !== PANTRY_SETS[0].main)
  assert.ok(d.drink && d.alt)
})
