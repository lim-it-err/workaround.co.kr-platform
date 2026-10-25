import assert from 'node:assert/strict'
import test from 'node:test'

import { BLOG_LINE_OPEN, JUNCTION, JUNCTION_LINES, LINES } from './lines.js'

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

test('환승 홀은 세 노선과 정류장을 단일 구조로 제공한다 (블로그 본선 스위치 D-031)', () => {
  assert.deepEqual(JUNCTION_LINES.map((line) => line.nameKo), ['기록선', '실험선', '기지선'])
  // 열림: B V A S D P W R (여덟) / 닫힘(D-031): V A S D P W R (일곱)
  const expected = BLOG_LINE_OPEN
    ? ['B', 'V', 'A', 'S', 'D', 'P', 'W', 'R']
    : ['V', 'A', 'S', 'D', 'P', 'W', 'R']
  assert.equal(LINES.length, expected.length)
  assert.deepEqual(LINES.map((line) => line.code), expected)
  assert.deepEqual(LINES.filter((line) => line.upcoming).map((line) => line.code), ['D'])
})

test('블로그 본선 스위치는 기록선 안내 문구와 경로를 함께 바꾼다', () => {
  const archive = JUNCTION_LINES.find((line) => line.id === 'archive')
  assert.equal(archive.order, BLOG_LINE_OPEN ? '환승 홀 → 블로그 → 여행' : '환승 홀 → 여행')
  assert.deepEqual(archive.paths, [BLOG_LINE_OPEN ? 'M90 360 L630 360' : 'M290 360 L630 360'])
  assert.equal(archive.stations.some((station) => station.code === 'B'), BLOG_LINE_OPEN)
  const hasBlogLink = LINES.some((station) => [station, ...(station.sublinks ?? []), ...(station.mapStops ?? [])]
    .some((link) => ['blogArchive', 'blogPost', 'writingStudio', 'bloghub'].includes(link.page)))
  assert.equal(hasBlogLink, BLOG_LINE_OPEN, '닫힌 동안 블로그·스튜디오로 가는 링크 정의가 없어야 한다')
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

test('취향선 P는 자취 밥상으로 개통되고 오늘의 추천을 알린다', () => {
  const pantry = LINES.find((line) => line.code === 'P')
  assert.equal(pantry.nameKo, '자취 밥상')
  assert.equal(pantry.page, 'pantry')
  assert.equal(pantry.upcoming, undefined)
  assert.equal(pantry.access, undefined)
  assert.match(pantry.status, /^오늘의 한 상: .+/)
})

test('미스터리 트레인은 격납고·유로트럭·개발자·엘리베이터·택시·화이트채플 경계를 명시한다', () => {
  const simulation = LINES.find((line) => line.code === 'S')
  assert.deepEqual(simulation.mapStops.map((stop) => stop.label), [
    '격납고',
    '유로트럭',
    '유로트럭 개발자',
    '엘리베이터',
    '택시',
    '화이트채플'
  ])
  assert.equal(simulation.mapStops.find((stop) => stop.label === '유로트럭').page, 'ets2')
  assert.equal(simulation.sublinks.find((link) => link.label === '유로트럭').page, 'ets2')
  assert.equal(simulation.mapStops.find((stop) => stop.label === '유로트럭 개발자').staticAccess, 'server')
  assert.equal(simulation.sublinks.find((link) => link.label === '유로트럭 개발자').staticAccess, 'server')
  assert.equal(simulation.mapStops.find((stop) => stop.page === 'elevator').staticAccess, 'server')
  assert.equal(simulation.sublinks.find((link) => link.page === 'elevator').staticAccess, 'server')
  assert.equal(simulation.mapStops.find((stop) => stop.label === '화이트채플').access, 'planned')
  assert.equal(simulation.sublinks.find((link) => link.label === '화이트채플').access, 'planned')
})

test('유로트럭 두 소역은 미스터리 트레인에서 위로 뻗는 수직 지선에 놓인다', () => {
  const lab = JUNCTION_LINES.find((line) => line.id === 'lab')
  const simulation = lab.stations.find((station) => station.code === 'S')
  const truckStops = simulation.mapStops.filter((stop) => stop.pathIndex === 2)

  assert.equal(lab.paths[2], 'M501.4 218.6 L501.4 96')
  assert.deepEqual(truckStops.map((stop) => ({
    label: stop.label,
    x: stop.x,
    y: stop.y,
    labelX: stop.labelX,
    labelY: stop.labelY,
    anchor: stop.anchor
  })), [
    { label: '유로트럭', x: 501.4, y: 150, labelX: 487, labelY: 154, anchor: 'end' },
    { label: '유로트럭 개발자', x: 501.4, y: 105, labelX: 487, labelY: 109, anchor: 'end' }
  ])
})

test('세 노선 본선은 환승 홀을 통과하고 역·소역은 선언한 본선 또는 지선 위에 놓인다', () => {
  for (const line of JUNCTION_LINES) {
    const segments = line.paths.map(parseSegment)
    const route = segments[0]

    assert.ok(
      pointLineDistance(JUNCTION, route) < 0.5,
      `${line.nameKo}가 환승 홀을 통과해야 한다`,
    )
    for (const [pathIndex, segment] of segments.entries()) {
      if (pathIndex === 0) continue
      assert.ok(
        pointLineDistance(segment.start, route) < 0.5,
        `${line.nameKo} ${pathIndex}번 지선은 본선에서 시작해야 한다`,
      )
    }
    for (const station of line.stations) {
      const stationRoute = segments[station.pathIndex ?? 0]
      assert.ok(
        pointLineDistance(station.map, stationRoute) < 0.5,
        `${line.nameKo} ${station.code} 큰 역이 노선 위에 있어야 한다`,
      )
      for (const stop of station.mapStops ?? []) {
        const stopRoute = segments[stop.pathIndex ?? station.pathIndex ?? 0]
        assert.ok(
          pointLineDistance(stop, stopRoute) < 0.5,
          `${line.nameKo} ${station.code} ${stop.label} 작은 역이 노선 위에 있어야 한다`,
        )
      }
    }
  }
})
