// 환승 홀 단일 소스 (D-015 / TKT-111)
// 세 노선의 지도 좌표와 실제 이동 목록이 이 구조를 함께 사용한다.

import { VOYAGES } from './voyage.js'

export const JUNCTION = { x: 360, y: 360 }

const currentVoyage = VOYAGES.find((voyage) => voyage.status === 'boarding') || VOYAGES[0]

export const JUNCTION_LINES = [
  {
    id: 'archive',
    nameKo: '기록선',
    colorToken: 'junction-archive',
    textColorToken: 'line-b-text',
    order: '환승 홀 → 블로그 → 여행',
    label: { x: 640, y: 364, anchor: 'start' },
    paths: ['M90 360 L630 360'],
    stations: [
      {
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
      },
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
    order: 'Advisor → 미스터리 트레인 → 발견 → 취향',
    label: { x: 612, y: 104, anchor: 'start' },
    paths: [
      'M360 360 L607.5 112.5',
      'M360 360 L204.4 515.6'
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
        rowStops: '격납고 2대 대기',
        map: { x: 501.4, y: 218.6, labelX: 518, labelY: 232, anchor: 'start' },
        mapStops: [
          { x: 522.6, y: 197.4, labelX: 536, labelY: 210, label: '격납고', page: 'simhub', anchor: 'start' },
          { x: 543.8, y: 176.2, labelX: 557, labelY: 189, label: '엘리베이터', page: 'elevator', staticAccess: 'server', anchor: 'start' },
          { x: 565.1, y: 154.9, labelX: 578, labelY: 168, label: '택시', page: 'taxi', anchor: 'start' },
          { x: 586.3, y: 133.7, labelX: 600, labelY: 147, label: '화이트채플', access: 'planned', upcoming: true, anchor: 'start' }
        ],
        sublinks: [
          { label: '격납고', page: 'simhub' },
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
        nameKo: '취향',
        mapName: '취향',
        lineClass: 'line-p',
        page: null,
        status: '연장 예정',
        access: 'planned',
        upcoming: true,
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
