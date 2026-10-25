// 환승 홀 단일 소스 (D-015 / TKT-111)
// 세 노선의 지도 좌표와 실제 이동 목록이 이 구조를 함께 사용한다.

import { VOYAGES } from './voyage.js'
import { pickPantrySets } from './pantry/index.js'

export const JUNCTION = { x: 360, y: 360 }

// 블로그 본선(B) 운행 스위치 — D-031 (PO 2026-10-25 "블로그는 다시 내려").
// false 인 동안 홈 노선도의 B 역·소역 3·노선 목록 행이 사라지고, 기록선은 환승 홀 → 여행 이 된다.
// /blog · /blog/* · /blog-district · /studio 직접 진입은 App.vue 가 환승 홀로 돌려보낸다.
// 복귀: true 로 바꾸고 블로그·스튜디오 E2E 의 skip 이 풀리는지 확인한다. 컴포넌트·데이터는 지우지 않는다.
export const BLOG_LINE_OPEN = false

const BLOG_STATION = {
  code: 'B',
  nameKo: '블로그 본선',
  mapName: '블로그',
  lineClass: 'line-b',
  page: 'blogArchive',
  status: '읽고 쓰는 기록',
  map: { x: 250, y: 360, labelX: 250, labelY: 336, anchor: 'middle' },
  mapStops: [
    { x: 200, y: 360, labelX: 200, labelY: 384, label: '아카이브', anchor: 'middle' },
    { x: 160, y: 360, labelX: 160, labelY: 344, label: '글 상세', anchor: 'middle' },
    { x: 120, y: 360, labelX: 120, labelY: 384, label: '스튜디오', anchor: 'middle' }
  ],
  sublinks: [
    { label: '공개 아카이브', page: 'blogArchive' },
    { label: '글 상세', page: 'blogPost' },
    { label: 'Writing Studio', page: 'writingStudio' }
  ]
}

const currentVoyage = VOYAGES.find((voyage) => voyage.status === 'boarding') || VOYAGES[0]
const pantryDate = new Date()
const pantryDateKey = `${pantryDate.getFullYear()}-${String(pantryDate.getMonth() + 1).padStart(2, '0')}-${String(pantryDate.getDate()).padStart(2, '0')}`
const todayPantry = pickPantrySets(pantryDateKey).main

export const JUNCTION_LINES = [
  {
    id: 'archive',
    nameKo: '기록선',
    colorToken: 'junction-archive',
    textColorToken: 'line-b-text',
    order: BLOG_LINE_OPEN ? '환승 홀 → 블로그 → 여행' : '환승 홀 → 여행',
    label: { x: 640, y: 364, anchor: 'start' },
    // 블로그가 내려가 있어도 노선은 환승 홀을 직선으로 통과한다(r16). 왼쪽은 역 없는 짧은 꼬리.
    paths: [BLOG_LINE_OPEN ? 'M90 360 L630 360' : 'M290 360 L630 360'],
    stations: [
      ...(BLOG_LINE_OPEN ? [BLOG_STATION] : []),
      {
        code: 'V',
        nameKo: '여행 노선',
        mapName: '여행',
        lineClass: 'line-v',
        page: 'voyage',
        status: '여정과 기억',
        rowStops: currentVoyage.title,
        map: { x: 470, y: 360, labelX: 470, labelY: 336, anchor: 'middle' },
        mapStops: [
          { x: 520, y: 360, labelX: 520, labelY: 384, label: '노선도', anchor: 'middle' }
        ],
        sublinks: [
          { label: '노선도', page: 'voyage' }
        ]
      }
    ]
  },
  {
    id: 'lab',
    nameKo: '실험선',
    colorToken: 'junction-lab',
    textColorToken: 'line-d-text',
    order: 'Advisor → 미스터리 트레인 → 발견 → 자취 밥상',
    label: { x: 612, y: 104, anchor: 'start' },
    paths: [
      'M360 360 L607.5 112.5',
      'M360 360 L204.4 515.6',
      'M501.4 218.6 L501.4 96'
    ],
    stations: [
      {
        code: 'A',
        nameKo: 'Developer Advisor',
        mapName: 'Advisor',
        lineClass: 'line-d',
        page: null,
        entryPath: '/advisor/',
        render: 'static',
        status: '코스 · 미션',
        upcoming: false,
        map: { x: 437.8, y: 282.2, labelX: 454, labelY: 296, anchor: 'start' },
        mapStops: [
          { x: 466.1, y: 253.9, labelX: 480, labelY: 268, label: '코스 · 미션', anchor: 'start' }
        ]
      },
      {
        code: 'S',
        nameKo: '미스터리 트레인',
        mapName: '미스터리 트레인',
        lineClass: 'line-s',
        page: 'simhub',
        status: '격납고',
        subtitle: '심야 임시 운행',
        rowStops: '격납고 3대 대기',
        map: { x: 501.4, y: 218.6, labelX: 518, labelY: 232, anchor: 'start' },
        mapStops: [
          { x: 522.6, y: 197.4, labelX: 536, labelY: 210, label: '격납고', page: 'simhub', anchor: 'start' },
          { x: 501.4, y: 150, labelX: 487, labelY: 154, label: '유로트럭', page: 'ets2', pathIndex: 2, anchor: 'end' },
          { x: 501.4, y: 105, labelX: 487, labelY: 109, label: '유로트럭 개발자', page: 'ets2Dev', pathIndex: 2, staticAccess: 'server', staticMessage: '개발자 페이지 · 로컬 전용', anchor: 'end' },
          { x: 565.1, y: 154.9, labelX: 578, labelY: 168, label: '엘리베이터', page: 'elevator', staticAccess: 'server', anchor: 'start' },
          { x: 586.3, y: 133.7, labelX: 600, labelY: 104, label: '택시', page: 'taxi', anchor: 'end' },
          { x: 607.5, y: 112.5, labelX: 620, labelY: 126, label: '화이트채플', access: 'planned', upcoming: true, anchor: 'start' }
        ],
        sublinks: [
          { label: '격납고', page: 'simhub' },
          { label: '유로트럭', page: 'ets2' },
          { label: '유로트럭 개발자', page: 'ets2Dev', staticAccess: 'server', staticMessage: '개발자 페이지 · 로컬 전용' },
          { label: '엘리베이터', page: 'elevator', staticAccess: 'server' },
          { label: '택시', page: 'taxi' },
          { label: '화이트채플', access: 'planned', upcoming: true }
        ]
      },
      {
        code: 'D',
        nameKo: '발견',
        mapName: '발견',
        lineClass: 'line-d',
        page: null,
        status: '연장 예정',
        access: 'planned',
        upcoming: true,
        targetVersion: 'v0.8.0',
        pathIndex: 1,
        map: { x: 282.2, y: 437.8, labelX: 266, labelY: 432, anchor: 'end' }
      },
      {
        code: 'P',
        nameKo: '자취 밥상',
        mapName: '자취 밥상',
        lineClass: 'line-p',
        page: 'pantry',
        status: `오늘의 한 상: ${todayPantry.title}`,
        targetVersion: 'v0.9.0',
        pathIndex: 1,
        map: { x: 232.7, y: 487.3, labelX: 216, labelY: 482, anchor: 'end' }
      }
    ]
  },
  {
    id: 'depot',
    nameKo: '기지선',
    colorToken: 'junction-depot',
    textColorToken: 'line-w-text',
    order: 'Work → Runtime · 보호 구역',
    label: { x: 504, y: 512, anchor: 'start' },
    paths: ['M225.6 225.6 L494.4 494.4'],
    stations: [
      {
        code: 'W',
        nameKo: 'Work Manager',
        mapName: 'Work',
        lineClass: 'line-w',
        page: 'work',
        status: '보호 구역',
        access: 'protected',
        map: { x: 437.8, y: 437.8, labelX: 428, labelY: 452, anchor: 'end' },
        mapStops: [
          { x: 466.1, y: 466.1, labelX: 452, labelY: 480, label: '작업 흐름', anchor: 'end' }
        ]
      },
      {
        code: 'R',
        nameKo: 'Runtime Board',
        mapName: 'Runtime',
        lineClass: 'line-r',
        page: 'runtime',
        status: '보호 구역',
        access: 'protected',
        map: { x: 282.2, y: 282.2, labelX: 266, labelY: 290, anchor: 'end' },
        mapStops: [
          { x: 254, y: 254, labelX: 238, labelY: 262, label: '실행 상태', anchor: 'end' }
        ]
      }
    ]
  }
]

// 기존 App/staticRouting 소비자 호환용 평탄 목록.
export const LINES = JUNCTION_LINES.flatMap((line) =>
  line.stations.map((station) => ({
    ...station,
    kind: 'station',
    groupId: line.id,
    groupName: line.nameKo,
    groupColorToken: line.colorToken
  }))
)
