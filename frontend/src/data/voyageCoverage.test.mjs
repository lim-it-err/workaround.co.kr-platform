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

const officialHosts = new Set([
  'www.szechenyibath.hu',
  'matyas-templom.hu',
  'bkk.hu',
  'doc.budavar.hu',
  'www.gotobrno.cz',
  'prague.eu',
  'www.sixt.cz',
  'www.budget.cz',
  'www.enterprise.com',
  'www.nationalcar.com',
  'www.prg.aero',
  'flyasiana.com'
])
for (const date of ['2026-09-15', '2026-09-16', '2026-09-17']) {
  const day = VOYAGE.days.find((item) => item.date === date)
  assert.ok(day, `${date}: 일정이 필요하다`)
  assert.ok(day.links.length >= 2, `${date}: 공식 링크가 2개 이상 필요하다`)
  for (const link of day.links) {
    assert.equal(link.checkedAt, '2026-09-15', `${date}: 링크 확인일이 필요하다`)
    assert.ok(link.label && link.note, `${date}: 링크 라벨과 현장 메모가 필요하다`)
    assert.equal(new URL(link.url).protocol, 'https:', `${date}: HTTPS 링크만 허용한다`)
    assert.ok(officialHosts.has(new URL(link.url).hostname), `${date}: 공식 사이트만 허용한다`)
  }
}
assert.deepEqual(VOYAGE.days.find((item) => item.date === '2026-09-14').links, [], '링크가 없는 날은 빈 배열이어야 한다')

const tailDays = Object.fromEntries(['2026-09-15', '2026-09-16', '2026-09-17']
  .map(date => [date, VOYAGE.days.find(day => day.date === date)]))
const noteFor = (date, label) => tailDays[date].links.find(link => link.label === label)?.note ?? ''
for (const value of [
  noteFor('2026-09-15', '세체니 온천 운영·예약'),
  noteFor('2026-09-15', '마차시 성당 입장 안내'),
  noteFor('2026-09-15', '부다 성 푸니쿨라'),
  noteFor('2026-09-15', '어부의 요새 상부 전망대')
]) assert.ok(value, '9/15 확인값 링크가 모두 필요하다')
assert.match(noteFor('2026-09-15', '세체니 온천 운영·예약'), /07:00~20:00.*13,200 Ft.*10,500 Ft.*15,200 Ft.*슬리퍼.*랩 풀/)
assert.match(noteFor('2026-09-15', '마차시 성당 입장 안내'), /09:00~17:00.*07:00·18:00/)
assert.match(noteFor('2026-09-15', '부다 성 푸니쿨라'), /08:00~22:00.*9\/7·9\/21/)
assert.match(noteFor('2026-09-15', '어부의 요새 상부 전망대'), /09:00~21:00.*1,500 Ft/)
assert.match(noteFor('2026-09-16', '비셰흐라드 방문 안내'), /연중.*19:00.*19:13.*묘지를 먼저/)
assert.match(noteFor('2026-09-16', 'Sixt 프라하 중앙역 반납'), /08:00~20:00.*Opletalova 53.*Bolzanova.*짐을 내리고/)
assert.match(noteFor('2026-09-16', 'Budget 프라하 중앙역 반납'), /08:00~20:00.*소지품/)
assert.match(noteFor('2026-09-16', 'Enterprise 프라하 중앙역 반납'), /08:00~18:00.*영업시간 외 반납/)
assert.match(noteFor('2026-09-16', 'National 프라하 중앙역 반납'), /운영시간은 공식 페이지에서 확인되지 않아.*확인이 남았습니다/)
assert.match(noteFor('2026-09-17', '프라하 공항 택스 리펀'), /T1.*키오스크.*Interchange.*최대 약 3시간/)
assert.match(noteFor('2026-09-17', '아시아나 프라하 체크인'), /T1 1층.*3시간 전.*50분 전.*셀프 체크인 키오스크.*18:50/)
assert.equal(VOYAGE.flights.inbound.dep, '18:50', 'OZ546 출발 시각은 PO 확인 전까지 유지해야 한다')

const preservedTailCopy = {
  '2026-09-15': [
    '세체니 온천 — 08~09시 입장이 혼잡 회피의 정답 (수영복 원단 래시가드 가능, 면 티셔츠 불가)',
    '어부의 요새·마차시 성당·부다 왕궁 언덕 (푸니쿨라 이용)',
    '여유 저녁 — 다음 날 장거리 전 짐 정리',
    '온천으로 하루를 열고 오후에 언덕. 여행 후반 회복 반나절.'
  ],
  '2026-09-16': [
    '09:00 출발 — 이날의 최대 변수는 도로가 아니라 출발 시각이다 (운전 3시간 20분)',
    '브르노 점심 (관광 없이 식사만, 노출 1시간 이내) → 13:30 출발 → 15:45 프라하 도착 → 렌터카 반납(짐 실은 채) → 체크인',
    '마지막 밤 — 비셰흐라드 노을 (현지인 산책 코스, 성벽 위 전경) 또는 못 가본 곳',
    '유일한 5시간대 운전일. 출국 전날이라 지연돼도 치명적이지 않다 — 이날 쓰라고 아껴둔 카드.'
  ],
  '2026-09-17': [
    '늦은 아침·짐 정리 → 체크아웃, 짐은 호텔 보관 → 몸만 가볍게 카페. 카를교를 제대로 보려면 08시 전 — 텅 비어 있다',
    '14:30 짐 찾기 → 택시(볼트/우버, 30~40분) → 15:30 공항 → 15:50 체크인',
    '18:50 OZ546 출발',
    '택스 리펀 물품이 있으면 캐리어 맨 위에 + 30분 일찍. 공항버스는 짐 동선 때문에 이 일정엔 안 맞다.'
  ]
}
for (const [date, copy] of Object.entries(preservedTailCopy)) {
  const day = tailDays[date]
  assert.deepEqual([day.am, day.pm, day.eve, day.tip], copy, `${date}: am/pm/eve/tip 원문을 유지해야 한다`)
  assert.doesNotMatch(day.links.map(link => `${link.label} ${link.note}`).join(' '), /\[확인\]/, `${date}: 화면 링크에 [확인]을 노출하면 안 된다`)
}

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

console.log('voyage coverage: 12/12, lodging: 18, day sessions: 4, tail links: 3 days, regressions: pass')
