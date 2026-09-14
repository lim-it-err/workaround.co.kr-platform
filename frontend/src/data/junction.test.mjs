import assert from 'node:assert/strict'
import test from 'node:test'

import { JUNCTION_LINES, LINES } from './lines.js'

test('환승 홀은 세 노선과 여덟 정류장을 단일 구조로 제공한다', () => {
  assert.deepEqual(JUNCTION_LINES.map((line) => line.nameKo), ['기록선', '실험선', '기지선'])
  assert.equal(LINES.length, 8)
  assert.deepEqual(LINES.map((line) => line.code), ['B', 'V', 'A', 'S', 'D', 'P', 'W', 'R'])
  assert.deepEqual(LINES.filter((line) => line.upcoming).map((line) => line.code), ['D', 'P'])
})

test('개통 정류장은 모두 대표 목적지를 갖고 미개통 정류장은 이동하지 않는다', () => {
  for (const station of LINES.filter((line) => !line.upcoming)) {
    assert.ok(station.page || station.entryPath, `${station.code} 대표 목적지가 필요하다`)
  }
  for (const station of LINES.filter((line) => line.upcoming)) {
    assert.equal(station.page, null)
    assert.equal(station.entryPath, undefined)
  }
})

test('여행 노선은 통합 노선도 진입점 하나만 노출한다', () => {
  const voyage = LINES.find((line) => line.code === 'V')
  assert.deepEqual(voyage.mapStops.map((stop) => stop.label), ['노선도'])
  assert.deepEqual(voyage.sublinks.map((link) => link.label), ['노선도'])
})
