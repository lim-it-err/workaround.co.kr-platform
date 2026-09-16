import assert from 'node:assert/strict'
import test from 'node:test'

import { JUNCTION, JUNCTION_LINES, LINES } from './lines.js'

function parseSegment(path) {
  const values = path.match(/-?\d+(?:\.\d+)?/g)?.map(Number) ?? []
  assert.equal(values.length, 4, `직선 경로만 허용한다: ${path}`)
  return { start: { x: values[0], y: values[1] }, end: { x: values[2], y: values[3] } }
}

function pointLineDistance(point, segment) {
  const dx = segment.end.x - segment.start.x
  const dy = segment.end.y - segment.start.y
  return Math.abs(dy * point.x - dx * point.y
    + segment.end.x * segment.start.y - segment.end.y * segment.start.x) / Math.hypot(dx, dy)
}

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

test('세 노선은 환승 홀을 직선으로 통과하고 소속 역이 같은 선 위에 놓인다', () => {
  for (const line of JUNCTION_LINES) {
    const segments = line.paths.map(parseSegment)
    const route = segments[0]

    assert.ok(
      pointLineDistance(JUNCTION, route) < 0.5,
      `${line.nameKo}가 환승 홀을 통과해야 한다`,
    )
    for (const segment of segments) {
      assert.ok(pointLineDistance(segment.start, route) < 0.5)
      assert.ok(pointLineDistance(segment.end, route) < 0.5)
    }
    for (const station of line.stations) {
      assert.ok(
        pointLineDistance(station.map, route) < 0.5,
        `${line.nameKo} ${station.code} 큰 역이 노선 위에 있어야 한다`,
      )
      for (const stop of station.mapStops ?? []) {
        assert.ok(
          pointLineDistance(stop, route) < 0.5,
          `${line.nameKo} ${station.code} ${stop.label} 작은 역이 노선 위에 있어야 한다`,
        )
      }
    }
  }
})
