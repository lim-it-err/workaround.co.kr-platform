// 노선 단일 소스 (스펙 §3.3 / TKT-072·S2)
// JunctionMap(SVG)·route-rows 가 이 배열 하나를 공유한다.
// 신규 노선(D/P 등) 추가·좌표 조정은 이 파일 한 곳만 수정한다.
// 좌표계: viewBox 0 0 1000 460, 환승 홀 노드 = (300, 230).

import { VOYAGES } from './voyage.js'

export const JUNCTION = { x: 300, y: 230 }

const currentVoyage = VOYAGES.find((voyage) => voyage.status === 'boarding') || VOYAGES[0]

export const LINES = [
  {
    code: 'B',
    nameKo: '블로그 본선',
    nameEn: 'Blog District',
    lineClass: 'line-b',
    page: 'bloghub',
    kind: 'trunk',
    path: 'M300 230 H852',
    cap: 'M840 214 V246',
    stops: [
      { x: 472, y: 230, label: '공개 아카이브', page: 'blogArchive' },
      { x: 620, y: 230, label: '글 상세', page: 'bloghub' },
      { x: 772, y: 230, label: 'Writing Studio', terminus: true, page: 'writingStudio' }
    ],
    rowStops: '공개 아카이브 → 글 상세 → Writing Studio'
  },
  {
    code: 'A',
    nameKo: 'Developer Advisor',
    nameEn: 'Advisor',
    lineClass: 'line-a',
    page: null,
    entryPath: '/advisor/',
    render: 'static',
    status: '정적 이용 가능',
    kind: 'branch',
    upcoming: false,
    path: 'M300 230 L180 78 H96',
    chip: { x: 96, y: 78 },
    labelPos: { x: 96, y: 46, sub: 64, anchor: 'middle' }
  },
  {
    code: 'W',
    nameKo: 'Work Manager',
    nameEn: 'Work Manager',
    lineClass: 'line-w',
    page: 'work',
    kind: 'branch',
    path: 'M300 230 L180 140 H96',
    chip: { x: 96, y: 140 },
    labelPos: { x: 96, y: 108, sub: 126, anchor: 'middle' }
  },
  {
    code: 'R',
    nameKo: 'Runtime Board',
    nameEn: 'Runtime',
    lineClass: 'line-r',
    page: 'runtime',
    kind: 'branch',
    path: 'M300 230 L180 320 H96',
    chip: { x: 96, y: 320 },
    labelPos: { x: 96, y: 356, sub: 374, anchor: 'middle' }
  },
  {
    code: 'V',
    nameKo: '여행 노선',
    nameEn: 'Voyage',
    lineClass: 'line-v',
    page: 'voyage',
    kind: 'branch',
    upcoming: false,
    path: 'M300 230 L180 382 H96',
    chip: { x: 96, y: 382 },
    labelPos: { x: 96, y: 418, sub: 436, anchor: 'middle' },
    rowStops: currentVoyage.title
  },
  {
    code: 'D',
    nameKo: '발견 노선',
    nameEn: 'Discovery',
    lineClass: 'line-d',
    page: null,
    kind: 'branch',
    upcoming: true,
    targetVersion: 'v0.8.0',
    path: 'M300 230 L440 96 H600',
    chip: { x: 600, y: 96 },
    labelPos: { x: 622, y: 92, sub: 110, anchor: 'start' }
  },
  {
    code: 'S',
    nameKo: '미스터리 트레인',
    nameEn: 'Mystery Train',
    subtitle: '심야 임시 운행',
    lineClass: 'line-s',
    page: 'simhub',
    kind: 'branch',
    path: 'M300 230 L440 158 H600',
    chip: { x: 600, y: 158 },
    labelPos: { x: 622, y: 154, sub: 172, anchor: 'start' },
    rowStops: '격납고 2대 대기'
  },
  {
    code: 'P',
    nameKo: '취향 노선',
    nameEn: 'Palate',
    lineClass: 'line-p',
    page: null,
    kind: 'branch',
    upcoming: true,
    targetVersion: 'v0.9.0',
    path: 'M300 230 L440 364 H600',
    chip: { x: 600, y: 364 },
    labelPos: { x: 622, y: 360, sub: 378, anchor: 'start' }
  }
]
