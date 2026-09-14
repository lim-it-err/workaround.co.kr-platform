import assert from 'node:assert/strict'
import { EAST_EUROPE_2026 } from '../../data/voyages/east-europe-2026.js'
import {
  advisorTransferHref,
  applyStopRecords,
  buildDayTimeline,
  buildRouteSegments,
  cityDayIndexes,
  currentCityId,
  effectiveDaySpendTotal,
  findTripDayIndex,
  isGoogleMapsUrl,
  projectCity,
  routeGauges
} from './voyageRoute.js'

const voyage = EAST_EUROPE_2026
const todayIndex = findTripDayIndex(voyage, '2026-09-14')

assert.ok(voyage.days.every(day => day.plan && day.actual), '모든 일차가 plan/actual 단일 스키마를 가져야 한다')

assert.equal(voyage.cities.length, 9, '출발·복귀를 포함한 9개 정차역이 필요하다')
assert.equal(voyage.legs.length, 8, '9개 정차역을 잇는 8개 구간이 필요하다')
assert.equal(todayIndex, 6, '9월 14일은 7일차여야 한다')
assert.equal(currentCityId(voyage, todayIndex), 'vienna', '현재 구간 출발 도시가 현재 역이어야 한다')

const salzburg = projectCity(voyage.cities.find(city => city.id === 'salzburg'))
const budapest = projectCity(voyage.cities.find(city => city.id === 'budapest'))
const prague = projectCity(voyage.cities.find(city => city.id === 'prague'))
assert.ok(salzburg.x < budapest.x, '실제 경도처럼 잘츠부르크는 부다페스트보다 서쪽이어야 한다')
assert.ok(prague.y < budapest.y, '실제 위도처럼 프라하는 부다페스트보다 북쪽이어야 한다')

const segments = buildRouteSegments(voyage, todayIndex, 2)
assert.equal(segments[0].state, 'completed')
assert.equal(segments[0].active, true, '선택한 일차의 구간은 지도에서 강조되어야 한다')
assert.equal(segments.find(segment => segment.dayIndex === 6).state, 'current')
assert.equal(segments.at(-1).state, 'upcoming')

const gauges = routeGauges(voyage, todayIndex)
assert.deepEqual(
  { completedDistance: gauges.completedDistance, totalDistance: gauges.totalDistance, prepaid: gauges.prepaid, budgetPlan: gauges.budgetPlan },
  { completedDistance: 740, totalDistance: 1515, prepaid: 450, budgetPlan: 856 }
)
assert.ok(Math.abs(gauges.spent - 523.871) < 0.0001, '현재까지 선결제와 일차별 지출이 합산되어야 한다')

const dayThree = buildDayTimeline(voyage, 2)
assert.ok(dayThree.some(item => item.title.includes("Papa's") && item.kind === 'meal'))
assert.ok(dayThree.some(item => item.kind === 'branch'), '상황별 분기가 시간표에 유지되어야 한다')
assert.ok(buildDayTimeline(voyage, 6).length >= 3, '상세 세션이 없는 일차도 안전한 기본 시간표를 만든다')
const belvedere = buildDayTimeline(voyage, 6).find(item => item.stationId === 'day-6-belvedere')
assert.equal(belvedere.missions[0].missionId, 'v1900-f-belvedere-route')
assert.equal(
  advisorTransferHref(belvedere.missions[0], '/workaround.co.kr-platform/'),
  '/workaround.co.kr-platform/advisor/courses/vienna-1900'
)
assert.equal(buildDayTimeline(voyage, 0).some(item => item.missions.length), false, '연결 없는 정차역에는 환승 데이터가 없어야 한다')
assert.deepEqual(cityDayIndexes(voyage, voyage.cities.find(city => city.id === 'prague-return')), [8, 9])

const papa = dayThree.find(item => item.title.includes("Papa's"))
const stopRecords = {
  [papa.id]: {
    place: '현장 식당',
    dish: '굴라시',
    localAmount: '850',
    currency: 'CZK',
    krwAmount: '70000',
    note: '창가 자리',
    mapUrl: 'https://maps.app.goo.gl/example',
    photos: []
  }
}
const editedDayThree = applyStopRecords(dayThree, stopRecords)
assert.equal(editedDayThree.find(item => item.id === papa.id).title, '현장 식당 — 굴라시')
assert.equal(editedDayThree.find(item => item.id === papa.id).spendItem.amount, 7)
assert.ok(Math.abs(effectiveDaySpendTotal(voyage.days[2], dayThree, stopRecords) - 11.43) < 0.0001)
assert.equal(isGoogleMapsUrl('https://maps.google.com/?q=Prague'), true)
assert.equal(isGoogleMapsUrl('https://maps.app.goo.gl/example'), true)
assert.equal(isGoogleMapsUrl('https://example.com/map'), false)

console.log('voyage route: 9 stations, real projection, day cards and gauges pass')
