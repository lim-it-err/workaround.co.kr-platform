import assert from 'node:assert/strict'
import { test } from 'node:test'
import { VOYAGES } from '../../data/voyage.js'
import { EMPTY_RECORD, EMPTY_SETTLEMENT, formatAmount, routeRows, settlementRow, voyageYear } from './liteVoyage.js'

test('연도·금액 꼴', () => {
  assert.equal(voyageYear(VOYAGES[0]), '2026')
  assert.equal(formatAmount(777.101), '777.1만원')
  assert.equal(formatAmount(undefined), '')
})

test('중부유럽 결산은 데이터에서 계산', () => {
  const row = settlementRow(VOYAGES[0])
  assert.equal(row.summary, '777.1만원')
  assert.equal(row.extra.length, 3)
  assert.match(row.extra[0], /^1인당 388\.6만원$/)
  assert.match(row.extra[1], /^사전 결제 650\.0만원$/)
  assert.match(row.extra[2], /^현지 지출 127\.1만원$/)
})

test('노선 줄: DAY n · 도시 · 첫 줄, 마지막은 결산', () => {
  const rows = routeRows(VOYAGES[0])
  assert.equal(rows.length, VOYAGES[0].days.length + 1)
  assert.equal(rows[0].label, 'DAY 1')
  assert.equal(rows[0].city, '프라하')
  assert.ok(rows[0].summary.length > 0 && rows[0].summary !== EMPTY_RECORD)
  assert.ok(rows[0].extra.length <= 3)
  assert.equal(rows.at(-1).label, '결산')
})

test('기록·결산 없는 여행도 깨지지 않는다', () => {
  const rows = routeRows(VOYAGES[1])
  assert.equal(rows.length, 1)
  assert.equal(rows[0].summary, EMPTY_SETTLEMENT)
  const empty = routeRows({ days: [{ city: 'x' }] })
  assert.equal(empty[0].summary, EMPTY_RECORD)
})
