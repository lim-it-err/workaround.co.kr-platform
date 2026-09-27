import assert from 'node:assert/strict'
import { VOYAGE } from './voyage.js'

const allowedStatuses = new Set(['current', 'alternative', 'superseded', 'reverify'])
const requiredCoverageIds = [
  'final-schedule',
  'route-alternatives',
  'stay-lengths',
  'concert-cut',
  'crowd-rest',
  'flight',
  'rental',
  'luggage',
  'bath',
  'budgets-hotels',
  'night-view',
  'slow-travel'
]

assert.equal(VOYAGE.days.length, 11, '기존 11일 일정이 유지되어야 한다')
assert.equal(VOYAGE.flights.outbound.code, 'OZ545', '출국편 기준값이 유지되어야 한다')
assert.equal(VOYAGE.flights.inbound.code, 'OZ546', '귀국편 기준값이 유지되어야 한다')
assert.equal(VOYAGE.rental.pickup.time, '16:30', '렌터카 인수 기준값이 유지되어야 한다')
assert.equal(VOYAGE.budget.plan, 850, '850만 원 계획값이 유지되어야 한다')
assert.equal(VOYAGE.budget.ceiling, 950, '950만 원 상한값이 유지되어야 한다')

assert.equal(new Set(VOYAGE.budgetScenarios.map((item) => item.id)).size, VOYAGE.budgetScenarios.length, '예산안 ID는 고유해야 한다')
assert.deepEqual(VOYAGE.budgetScenarios.map((item) => item.total), [750, 800, 850, 950], '예산 4단계가 모두 있어야 한다')

assert.equal(VOYAGE.lodgingCandidates.length, 18, '숙소 후보는 18개여야 한다')
assert.equal(new Set(VOYAGE.lodgingCandidates.map((item) => item.id)).size, 18, '숙소 후보 ID는 고유해야 한다')
for (const lodging of VOYAGE.lodgingCandidates) {
  assert.ok(lodging.city, `${lodging.id}: 도시가 필요하다`)
  assert.ok([750, 800, 850].includes(lodging.tier), `${lodging.id}: 예산 단계가 필요하다`)
  assert.ok(lodging.caution, `${lodging.id}: 주의사항이 필요하다`)
  assert.ok(allowedStatuses.has(lodging.status), `${lodging.id}: 허용된 상태가 필요하다`)
}

assert.deepEqual(VOYAGE.sourceCoverage.map((item) => item.id), requiredCoverageIds, '원문 커버리지 주제가 빠짐없이 순서대로 있어야 한다')
for (const coverage of VOYAGE.sourceCoverage) {
  assert.ok(allowedStatuses.has(coverage.status), `${coverage.id}: 허용된 상태가 필요하다`)
  assert.equal(coverage.implemented, true, `${coverage.id}: 미반영 상태이면 안 된다`)
  assert.ok(coverage.surface, `${coverage.id}: 노출 화면이 필요하다`)
}

assert.deepEqual(VOYAGE.daySessions.map((session) => session.date), ['2026-09-08', '2026-09-09', '2026-09-10', '2026-09-11'], '1~4일차 상세 세션이 필요하다')
for (const session of VOYAGE.daySessions) {
  assert.ok(session.timeline.length >= 4, `${session.id}: 현장 시간표가 필요하다`)
  assert.ok(session.branches.length >= 4, `${session.id}: 상황별 분기가 필요하다`)
  assert.ok(Object.values(session.checklist).flat().length >= 6, `${session.id}: 현장 체크리스트가 필요하다`)
}

console.log('voyage coverage: 12/12, lodging: 18, day sessions: 4, regressions: pass')
