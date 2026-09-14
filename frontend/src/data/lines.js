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
    label: { x: 612, y: 220, anchor: 'start' },
    paths: ['M386 345 L576.5 235', 'M388 370 L594.9 445.5'],
    stations: [
      {
        code: 'B',
        nameKo: '블로그 본선',
        mapName: '블로그',
        lineClass: 'line-b',
        page: 'blogArchive',
        status: '읽고 쓰는 기록',
        map: { x: 455.3, y: 305, labelX: 471, labelY: 270, anchor: 'start' },
        mapStops: [
          { x: 498.6, y: 280, labelX: 506, labelY: 300, label: '아카이브', anchor: 'start' },
          { x: 533.2, y: 260, labelX: 541, labelY: 280, label: '글 상세', anchor: 'start' },
          { x: 567.8, y: 240, labelX: 576, labelY: 260, label: '스튜디오', anchor: 'start' }
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
        map: { x: 463.4, y: 397.6, labelX: 482, labelY: 428, anchor: 'start' },
        mapStops: [
          { x: 585.6, y: 442.1, labelX: 595, labelY: 466, label: '노선도', anchor: 'start' }
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
    label: { x: 400, y: 640, anchor: 'start' },
    paths: [
      'M375 388 L460 533.2',
      'M356 390 L316.6 606.2',
      'M340 380 L239.8 480.2',
      'M332 367 L195.8 404'
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
        map: { x: 415, y: 455.3, labelX: 433, labelY: 462, anchor: 'start' },
        mapStops: [
          { x: 440, y: 498.6, labelX: 452, labelY: 504, label: '코스 · 미션', anchor: 'start' }
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
        map: { x: 340.9, y: 468.3, labelX: 316, labelY: 476, anchor: 'end' },
        mapStops: [
          { x: 332.2, y: 517.6, labelX: 316, labelY: 526, label: '격납고', anchor: 'end' },
          { x: 325.2, y: 557, labelX: 315, labelY: 561, label: '엘베 · 택시', anchor: 'end' },
          { x: 318.3, y: 596.4, labelX: 308, labelY: 600, label: '화이트채플', anchor: 'end' }
        ],
        sublinks: [
          { label: '격납고', page: 'simhub' },
          { label: '엘리베이터', page: 'elevator' },
          { label: '택시', page: 'taxi' },
          { label: '화이트채플', page: 'simhub' }
        ]
      },
      {
        code: 'D',
        nameKo: '발견',
        mapName: '발견',
        lineClass: 'line-d',
        page: null,
        status: '연장 예정',
        upcoming: true,
        targetVersion: 'v0.8.0',
        pathIndex: 2,
        map: { x: 282.2, y: 437.8, labelX: 266, labelY: 420, anchor: 'end' }
      },
      {
        code: 'P',
        nameKo: '취향',
        mapName: '취향',
        lineClass: 'line-p',
        page: null,
        status: '연장 예정',
        upcoming: true,
        targetVersion: 'v0.9.0',
        pathIndex: 3,
        map: { x: 253.7, y: 388.5, labelX: 236, labelY: 378, anchor: 'end' }
      }
    ]
  },
  {
    id: 'depot',
    nameKo: '기지선',
    colorToken: 'junction-depot',
    textColorToken: 'line-w-text',
    order: 'Work → Runtime · 보호 구역',
    label: { x: 150, y: 232, anchor: 'end' },
    paths: ['M335 346 L186.8 260', 'M350 333 L291.6 172'],
    stations: [
      {
        code: 'W',
        nameKo: 'Work Manager',
        mapName: 'Work',
        lineClass: 'line-w',
        page: 'work',
        status: '보호 구역',
        map: { x: 264.7, y: 305, labelX: 248, labelY: 292, anchor: 'end' },
        mapStops: [
          { x: 221.4, y: 280, labelX: 246, labelY: 332, label: '작업 흐름', anchor: 'end' }
        ]
      },
      {
        code: 'R',
        nameKo: 'Runtime Board',
        mapName: 'Runtime',
        lineClass: 'line-r',
        page: 'runtime',
        status: '보호 구역',
        map: { x: 322.4, y: 256.6, labelX: 306, labelY: 243, anchor: 'end' },
        mapStops: [
          { x: 305.3, y: 209.6, labelX: 296, labelY: 200, label: '실행 상태', anchor: 'end' }
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
