<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import StationHeader from './components/StationHeader.vue'
import JunctionMap from './components/JunctionMap.vue'
import ElevatorCrossSection from './components/ElevatorCrossSection.vue'
import StatusBadge from './components/StatusBadge.vue'
import VoyageView from './components/VoyageView.vue'
import WritingStudio from './components/WritingStudio.vue'
import { SiteLoopSymbol } from './components/tone/index.js'
import { LINES } from './data/lines.js'
import { advanceTaxiFleet, assignPendingTaxiRequests, cloneTaxiState } from './sim/taxiDispatch.js'
import { VOYAGE } from './data/voyage.js'
import { migrateLegacyVoyageStorage, voyageStorageKey } from './data/voyageStorage.js'
import {
  buildLivePath,
  normalizeBasePath,
  readLiveRoute,
  stripBasePath,
  withBasePath
} from './staticRouting.js'
import {
  BLOG_POST_STORAGE_KEY,
  downloadWritingBackup,
  safeWriteJson
} from './staticWritingState.js'

const SPLASH_DURATION_MS = 10000
const APP_BASE_PATH = normalizeBasePath(import.meta.env.BASE_URL)
const TEST_ROUTE_PATH = withBasePath('/test', APP_BASE_PATH)
const VERSIONED_TEST_ROUTE_PATH = withBasePath('/test/v0-5-0', APP_BASE_PATH)
const isStaticMode = import.meta.env.VITE_STATIC_MODE === 'true' || APP_BASE_PATH !== '/'
const STATIC_UNAVAILABLE_PAGES = new Set(['simhub', 'elevator', 'taxi', 'work', 'runtime', 'ops', 'signals'])
const LIVE_PAGES = [
  'junction',
  'simhub',
  'elevator',
  'taxi',
  'bloghub',
  'blogArchive',
  'blogPost',
  'writingStudio',
  'voyage',
  'work',
  'runtime'
]
const TESTABLE_PAGES = ['junction', 'elevator', 'work', 'runtime']
const VERSIONED_TESTABLE_PAGES = ['junction', 'taxi', 'ops', 'signals']
const BOARD_READY_STORAGE_KEY = 'workaround-ready-lane'
const THEME_STORAGE_KEY = 'workaround-theme'
const TOKEN_STORAGE_KEY = 'workaround-work-manager-token'
const TOKEN_EXPIRY_STORAGE_KEY = 'workaround-work-manager-token-expires-at'
const BLOG_ACTIVE_SLUG_STORAGE_KEY = 'workaround-blog-active-slug'
const BLOG_STUDIO_VIEW_STORAGE_KEY = 'workaround-blog-studio-view'
const BLOG_STUDIO_POST_STORAGE_KEY = 'workaround-blog-studio-post'
const VOYAGE_ARCHIVE_STORAGE_KEY = voyageStorageKey(VOYAGE.id, 'archive')
let fallbackEntityIdCounter = 0
const TARGET_VERSION_OPTIONS = ['v0.4.0', 'v0.5.0', 'v0.5.1', 'v0.6.0', 'infra', 'chore']
const WORK_ROADMAP_ITEMS = [
  {
    version: 'v0.4.0',
    title: '운영 포털 구조 복구',
    summary: 'Work Manager 메타데이터, command gate, 페이지 분리'
  },
  {
    version: 'v0.5.0',
    title: '시뮬레이션 포털 확장',
    summary: '택시 시뮬레이터 진입, worker 가시화, DB 준비'
  },
  {
    version: '인프라 / 잡무',
    title: '기반 정렬',
    summary: '툴체인, 호스팅, 문서/브랜치 정리'
  }
]

const splashTickerMessages = [
  '에스컬레이터 방향 다수결로 정하는 중…',
  '지연 시간을 정성껏 반올림하는 중…',
  '출구 번호에 서열 매기는 중…'
]

const splashPhrases = ['WORKING AROUND', 'MIND THE GAP', 'DOORS OPENING']
const splashCellCount = Math.max(...splashPhrases.map((phrase) => phrase.length))
const splashLatinCharset = ' ABCDEFGHIJKLMNOPQRSTUVWXYZ'

const fallbackHealth = {
  status: 'degraded',
  services: [],
  tickets: {
    queued: 0,
    running: 0,
    waiting_llm: 0,
    retrying: 0,
    completed: 0
  }
}

const fallbackRuntime = {
  nodes: [
    {
      nodeId: 'ion2',
      role: 'local-control',
      availability: 'online',
      handles: ['gateway', 'worker execution'],
      defaultFor: ['light services', 'fallback control path']
    },
    {
      nodeId: 'rtx5070',
      role: 'external-inference',
      availability: 'degraded',
      handles: ['ollama inference', 'heavy model jobs'],
      defaultFor: ['llm tickets', 'gpu-backed inference']
    }
  ],
  routingRules: [],
  ollama: {
    status: 'unavailable'
  }
}

const fallbackWorkBoard = {
  columns: [
    { status: 'backlog', label: 'Backlog', tickets: [] },
    { status: 'started', label: 'Started', tickets: [] },
    { status: 'need_review', label: 'Need Review', tickets: [] },
    { status: 'finished', label: 'Finished', tickets: [] }
  ],
  activityFeed: [],
  commandHistory: [],
  actions: {
    authRequired: true,
    commandBridgeReady: false,
    commandPresets: []
  }
}

const fallbackElevatorState = {
  service: 'elevator-service',
  mode: 'live-traffic-loop',
  building: {
    minFloor: 1,
    maxFloor: 23,
    totalFloors: 23
  },
  elevators: [
    {
      id: 'E1',
      currentFloor: 2,
      position: 2,
      direction: 'up',
      status: 'idle',
      queue: [],
      passengers: [],
      capacity: 20,
      currentLoad: 0,
      nextTarget: null
    },
    {
      id: 'E2',
      currentFloor: 8,
      position: 8,
      direction: 'idle',
      status: 'idle',
      queue: [],
      passengers: [],
      capacity: 20,
      currentLoad: 0,
      nextTarget: null
    },
    {
      id: 'E3',
      currentFloor: 14,
      position: 14,
      direction: 'idle',
      status: 'idle',
      queue: [],
      passengers: [],
      capacity: 20,
      currentLoad: 0,
      nextTarget: null
    },
    {
      id: 'E4',
      currentFloor: 20,
      position: 20,
      direction: 'down',
      status: 'idle',
      queue: [],
      passengers: [],
      capacity: 20,
      currentLoad: 0,
      nextTarget: null
    }
  ],
  waitingPassengers: [],
  completedPassengers: [],
  completedCalls: [],
  floorQueues: [],
  demand: {
    preset: 'normal',
    presetLabel: '보통',
    intensity: 55,
    autoMode: true,
    stepSeconds: 0.35
  },
  summary: {
    activeHallCalls: 0,
    movingElevators: 0,
    idleElevators: 4,
    waitingPassengers: 0,
    onboardPassengers: 0,
    loadRatio: 0
  }
}

const TAXI_ZONE_DEFINITIONS = [
  { id: 'north', name: '연남', accent: 'line-w', demandLabel: '카페 환승', neighbors: ['center', 'west'] },
  { id: 'west', name: '홍대입구', accent: 'line-e', demandLabel: '야간 회전', neighbors: ['north', 'center', 'southwest'] },
  { id: 'center', name: '을지로', accent: 'line-r', demandLabel: '업무 밀집', neighbors: ['north', 'west', 'east', 'south', 'harbor', 'hill'] },
  { id: 'east', name: '성수', accent: 'line-p', demandLabel: '창고형 픽업', neighbors: ['center', 'southeast', 'hill'] },
  { id: 'southwest', name: '여의도', accent: 'line-w', demandLabel: '퇴근 러시', neighbors: ['west', 'south', 'harbor'] },
  { id: 'south', name: '강남', accent: 'line-r', demandLabel: '과밀 수요', neighbors: ['southwest', 'center', 'southeast', 'hill'] },
  { id: 'southeast', name: '잠실', accent: 'line-e', demandLabel: '행사장 유입', neighbors: ['east', 'south'] },
  { id: 'harbor', name: '용산', accent: 'line-p', demandLabel: '역세권 환승', neighbors: ['center', 'southwest'] },
  { id: 'hill', name: '한남', accent: 'line-r', demandLabel: '심야 이동', neighbors: ['center', 'east', 'south'] }
]

const BLOG_STATUS_LABELS = {
  draft: 'draft',
  published: 'published',
  archived: 'archived'
}

const testRouteMode = ref(readTestRouteMode())
const isTestRoute = computed(() => testRouteMode.value !== 'live')
const isLegacyTestRoute = computed(() => testRouteMode.value === 'v040')
const isVersionedTestRoute = computed(() => testRouteMode.value === 'v050')
const page = ref(readInitialPage())
const theme = ref(readInitialTheme())
const selectedWorkTicketId = ref('')
const selectedCommand = ref('')
const commandNote = ref('')
const workManagerPassword = ref('')
const initialWorkManagerSession = readStoredWorkManagerSession()
const workManagerToken = ref(initialWorkManagerSession.token)
const workManagerTokenExpiresAt = ref(initialWorkManagerSession.expiresAt)
const workManagerMessage = ref('')
const workManagerError = ref(
  initialWorkManagerSession.expired
    ? '이전 command gate 세션이 만료되어 다시 잠갔습니다. 재인증해 주세요.'
    : ''
)
const metadataTargetVersion = ref('v0.4.0')
const metadataPriority = ref('P2')
const metadataDependencies = ref('')
const metadataMessage = ref('')
const metadataError = ref('')
const isUnlockingWorkManager = ref(false)
const isRunningCommand = ref(false)
const isSavingMetadata = ref(false)
const demandPreset = ref('normal')
const demandIntensity = ref(55)
const elevatorTickerOpen = ref(readElevatorTickerDefault())
const dragTicketId = ref('')
const readyTicketIds = ref(readReadyTicketIds())
const healthState = ref(fallbackHealth)
const runtimeState = ref(fallbackRuntime)
const servicesState = ref([])
const workBoardState = ref(fallbackWorkBoard)
const elevatorState = ref(fallbackElevatorState)
const elevatorCarCount = ref(fallbackElevatorState.elevators.length)
const taxiState = ref(createInitialTaxiState())
const taxiManualOrigin = ref(TAXI_ZONE_DEFINITIONS[0].id)
const taxiManualDestination = ref(TAXI_ZONE_DEFINITIONS[5].id)
const taxiManualPassengers = ref(2)
const taxiMessage = ref('')
const blogPosts = ref(readStoredBlogPosts())
const activeBlogSlug = ref(readInitialBlogSlug() || readStoredBlogSlug())
const studioViewMode = ref(readStoredStudioViewMode())
const studioPostId = ref(readStoredStudioPostId())
const studioState = ref(createEmptyStudioState())
const studioDirty = ref(false)
const studioLastSavedAt = ref('')
const studioSavePhase = ref('saved')
const writingBackupMessage = ref('')
const staticModeMessage = ref('')
const blogMessage = ref('')
const prefersReducedMotion = ref(false)
const currentTickerIndex = ref(0)
const currentSplashPhrase = ref(splashPhrases[0])
const splashBoardCells = ref(
  Array.from({ length: splashCellCount }, (_, index) => createSplashCellState(`splash-${index}`))
)
const currentTicker = computed(() => splashTickerMessages[currentTickerIndex.value])

const orchestratorSlices = [
  {
    name: 'Hub Shell',
    ticket: 'TKT-041',
    body: '메인 허브는 선택과 이동만 맡고, 실제 조작은 개별 플랫폼 페이지로 분리합니다.'
  },
  {
    name: 'Elevator Station',
    ticket: 'TKT-011 / TKT-021 / TKT-035',
    body: '23층 수직 보드, 승객 단위 대기열, car 정원 20명, 연속 이동 위치를 실제 데이터로 보여줍니다.'
  },
  {
    name: 'Work Manager',
    ticket: 'TKT-039 / TKT-040',
    body: 'Backlog/Ready/Started/Need Review/Finished 흐름과 티켓 상세, preset command 구역을 한 운영 화면으로 묶습니다.'
  },
  {
    name: 'Runtime Board',
    ticket: 'TKT-037',
    body: '릴리스 레일, 노드 가용성, 오프로드 규칙을 별도 시스템 페이지에서 정리합니다.'
  },
  {
    name: 'Mobile Flow',
    ticket: 'TKT-041',
    body: '축소판이 아니라 카드 스택과 엄지 범위 CTA 우선 흐름으로 다시 배치합니다.'
  },
  {
    name: 'Copy Mood',
    ticket: 'TKT-046',
    body: '플랩 문구는 생활 유머, 도시 감각, 약한 자기풍자를 섞어 같은 문구가 바로 반복되지 않게 돌립니다.'
  }
]

const mobileCheckpoints = [
  '허브에서는 큰 영웅 카드보다 실제 진입 카드가 먼저 보입니다.',
  '메인 복귀와 기능 진입 버튼은 엄지 범위 안에 남겨 둡니다.',
  '작은 화면에서도 축소판이 아니라 재배치된 카드 순서로 읽힙니다.'
]

const testCheckpoints = [
  '기본 검수 경로는 /test 이고 스플래시를 건너뜁니다.',
  '실사용 경로 / 는 더미가 아니라 실제 API 연결 화면을 유지합니다.',
  '특정 화면 확인은 /test?view=junction|elevator|work|runtime 를 사용합니다.'
]

const versionedTestCheckpoints = [
  'UI-v0.5.0 프로토타입은 /test/v0-5-0 아래에서만 검토합니다.',
  '기존 /test?view=... 검수 레일과 섞지 않고 별도 가상 동선으로 유지합니다.',
  '메인 허브는 선택과 이동만 맡고, Taxi / Ops / Signals 는 한 단계 더 들어가서 봅니다.',
  '모바일에서는 허브 카드, 구역 지도, 운행 카드가 세로 리듬으로 다시 쌓여야 합니다.'
]

const v050RouteCards = [
  {
    key: 'taxi',
    page: 'taxi',
    lineNo: '9',
    lineCode: 'Line T',
    name: 'Taxi District Lab',
    summary: '가상 도시 수요와 차량 배치를 다루는 새 승강장',
    detail: '서울 지하철 환승 UX를 유지한 채 지도형 시뮬레이터를 열고, 요청/배차/리워드를 같은 보드에서 읽습니다.',
    status: 'v0.5.0 core',
    accent: 'line-p',
    cta: '택시 승강장 입장',
    tickets: ['TKT-024', 'TKT-025']
  },
  {
    key: 'ops',
    page: 'ops',
    lineNo: '2',
    lineCode: 'Line O',
    name: 'Crew Board',
    summary: 'worker 가시화와 운영 반응 레일',
    detail: '누가 어떤 티켓을 잡았는지, Ready 이후 반응이 어떻게 보일지 별도 운영 면으로 설계합니다.',
    status: 'worker visibility',
    accent: 'line-w',
    cta: '운영 확장 보기',
    tickets: ['TKT-042', 'TKT-043']
  },
  {
    key: 'signals',
    page: 'signals',
    lineNo: '1',
    lineCode: 'Line S',
    name: 'Signal Room',
    summary: '실사용 포털과 가상 레일 분리 규칙',
    detail: '실사용 / 는 유지하고, 실험용 화면은 /test/v0-5-0 에서만 순환시키는 검수 구조를 고정합니다.',
    status: 'review rail',
    accent: 'line-r',
    cta: '신호실 보기',
    tickets: ['UI-v0.5.0', 'orchestrator handoff']
  }
]

const v050ExperienceRules = [
  {
    title: '허브는 라우터만 맡는다',
    body: '메인에서는 실제 시뮬레이터를 펼치지 않고, 어떤 실험 승강장으로 들어갈지만 보여줍니다.'
  },
  {
    title: '택시 시뮬레이터는 지도 감각이 먼저 읽혀야 한다',
    body: '표만 나열하는 대신 구역, 수요, 차량, 리워드의 관계를 한 화면에서 따라갈 수 있어야 합니다.'
  },
  {
    title: '운영 확장은 별도 승강장으로 뺀다',
    body: 'worker 가시화, 우선순위 반응, 신호 규칙은 기존 Work Manager 와 섞지 않고 한 단계 더 분리합니다.'
  }
]

const v050MobileFlow = [
  '1. 환승 허브에서 오늘 볼 승강장을 먼저 고른다.',
  '2. 택시 구역 지도와 핵심 지표가 먼저 오고, 세부 카드가 아래로 이어진다.',
  '3. worker 가시화와 신호 규칙은 별도 카드 묶음으로 읽어 피로를 줄인다.'
]

const taxiDistricts = [
  { name: '연남', demand: '퇴근 환승', requests: 14, fleet: 6, eta: '02:10', accent: 'line-w' },
  { name: '을지로', demand: '야간 회전', requests: 11, fleet: 5, eta: '01:45', accent: 'line-r' },
  { name: '성수', demand: '창고형 픽업', requests: 8, fleet: 4, eta: '02:40', accent: 'line-e' },
  { name: '강남', demand: '과밀 수요', requests: 17, fleet: 7, eta: '03:15', accent: 'line-p' },
  { name: '잠실', demand: '행사장 유입', requests: 9, fleet: 4, eta: '02:55', accent: 'line-r' },
  { name: '여의도', demand: '업무 종료파', requests: 12, fleet: 5, eta: '02:20', accent: 'line-w' }
]

const taxiRewardCards = [
  { label: '평균 대기', value: '02:24', body: '목표는 2분대 유지, 4분을 넘기면 감점 레일로 전환합니다.' },
  { label: '현재 리워드', value: '+128', body: '짧은 대기와 높은 합승률이 보상에 직접 반영됩니다.' },
  { label: '추가 배치 페널티', value: '-12', body: '차량을 무리하게 늘리면 운영비 패널티가 즉시 쌓입니다.' }
]

const taxiFleetCards = [
  { id: 'Cab-12', zone: '을지로', state: 'pickup', passengers: '2 / 4', eta: '01:20', reward: '+12', accent: 'line-r' },
  { id: 'Cab-21', zone: '강남', state: 'dropoff', passengers: '3 / 4', eta: '00:55', reward: '+18', accent: 'line-p' },
  { id: 'Cab-08', zone: '연남', state: 'reposition', passengers: '0 / 4', eta: '02:05', reward: '-4', accent: 'line-w' },
  { id: 'Cab-33', zone: '잠실', state: 'queue hold', passengers: '1 / 4', eta: '01:42', reward: '+7', accent: 'line-e' }
]

const taxiFlowCards = [
  {
    title: '요청 생성',
    body: '구역 단위 랜덤 요청과 수동 입력이 같이 들어옵니다.'
  },
  {
    title: '차량 배정',
    body: '가까운 차량만이 아니라 현재 적재, 이동 방향, 추가 배치 비용을 함께 봅니다.'
  },
  {
    title: '리워드 반영',
    body: '처리 시간과 불필요한 배차가 같은 보드에서 바로 점수화됩니다.'
  }
]

const opsCrewCards = [
  {
    worker: 'worker-alpha',
    lane: 'Ready -> Started',
    focus: 'TKT-024',
    note: '택시 요청 생성기와 수요 프리셋 진입점 분리',
    accent: 'line-p'
  },
  {
    worker: 'worker-beta',
    lane: 'Started',
    focus: 'TKT-042',
    note: 'worker 가시화 카드와 Ready 반응 표시 구조 검증',
    accent: 'line-w'
  },
  {
    worker: 'designer',
    lane: 'Need Review',
    focus: 'UI-v0.5.0',
    note: '모바일 재배치와 허브-승강장 경계 유지',
    accent: 'line-r'
  }
]

const opsTransitionCards = [
  {
    title: 'Ready 이후 누가 집는지 보이게 한다',
    body: '작업자는 더 이상 추상적 상태가 아니라, 담당 worker 와 최근 반응으로 읽혀야 합니다.'
  },
  {
    title: '우선순위는 즉시 시각 반응을 가져야 한다',
    body: 'P1 이면 보드 상단이 아니라 알림 레일, 담당자 카드, 대기 타이머까지 함께 흔들려야 합니다.'
  },
  {
    title: 'DB 전환 준비는 UI 에서 흔적을 남긴다',
    body: '파일 기반 저장이라도 기록 위치와 마지막 반영 시각을 보여 나중의 전환 비용을 줄입니다.'
  }
]

const signalCards = [
  {
    name: '실사용 레일',
    status: 'keep live',
    body: '기본 경로 / 는 실제 gateway 와 service 상태를 읽는 포털로 유지합니다.',
    accent: 'line-r'
  },
  {
    name: '가상 디자인 레일',
    status: 'prototype',
    body: 'UI-v0.5.0 더미는 /test/v0-5-0 아래에서만 돌려 기존 검수 경로와 충돌을 막습니다.',
    accent: 'line-p'
  },
  {
    name: '오케스트레이터 handoff',
    status: 'review first',
    body: '디자인 변경점은 design/orchestrator_review 에 append 하고, 합의 후 review_done 으로 넘깁니다.',
    accent: 'line-w'
  }
]

const simHubLine = LINES.find((line) => line.page === 'simhub')

const lineCards = computed(() => {
  const elevatorSummary = elevatorState.value.summary || fallbackElevatorState.summary
  const backlogCount = countWorkTicketsByStatus('backlog')
  const startedCount = countWorkTicketsByStatus('started')
  const readyCount = readyColumnTickets.value.length
  const runtimeNodes = runtimeState.value.nodes || []
  const degradedCount = runtimeNodes.filter((node) => node.availability !== 'online').length

  return [
    {
      key: 'simhub',
      page: 'simhub',
      lineNo: simHubLine.code,
      lineCode: `Line ${simHubLine.code}`,
      name: simHubLine.nameKo,
      summary: simHubLine.rowStops,
      detail: '엘리베이터 · 택시',
      status: simHubLine.subtitle,
      accent: simHubLine.lineClass,
      cta: '격납고 열기',
      tickets: ['TKT-024', 'TKT-025']
    },
    {
      key: 'elevator',
      page: 'elevator',
      lineNo: '4',
      lineCode: 'Line E',
      name: 'Elevator Station',
      summary: '23층 다중 엘리베이터 시뮬레이터',
      detail: `${elevatorSummary.waitingPassengers ?? 0}명 대기, ${elevatorSummary.onboardPassengers ?? 0}명 탑승, ${elevatorCars.value.length}대 구성`,
      status: elevatorState.value.mode === 'live-traffic-loop' ? '실시간 운행' : '저하 운행',
      accent: 'line-e',
      cta: '플랫폼 입장',
      tickets: ['TKT-011', 'TKT-021', 'TKT-035', 'TKT-049']
    },
    {
      key: 'work',
      page: 'work',
      lineNo: '2',
      lineCode: 'Line W',
      name: 'Work Manager',
      summary: '오케스트레이터 운영 보드',
      detail: `Backlog ${backlogCount}, Ready ${readyCount}, Started ${startedCount}`,
      status: workBoardState.value.actions?.commandBridgeReady ? '명령 브리지 준비' : '조회 전용 또는 저하',
      accent: 'line-w',
      cta: '운영 보드 열기',
      tickets: ['TKT-039', 'TKT-040', 'TKT-041', 'TKT-042', 'TKT-043']
    },
    {
      key: 'bloghub',
      page: 'bloghub',
      lineNo: 'B',
      lineCode: 'Line B',
      name: 'Blog District',
      summary: '공개 아카이브와 Writing Studio',
      detail: `${publishedBlogPosts.value.length}편 공개, ${draftBlogPosts.value.length}편 초안`,
      status: 'v0.6.0 seed',
      accent: 'line-b',
      cta: '글 공간 열기',
      tickets: ['TKT-050', 'TKT-051', 'TKT-052']
    },
    {
      key: 'runtime',
      page: 'runtime',
      lineNo: '1',
      lineCode: 'Line R',
      name: 'Runtime Board',
      summary: '노드, 오프로드, degraded 정책',
      detail: `노드 ${runtimeNodes.length}개, 저하 ${degradedCount}개, Ollama ${runtimeState.value.ollama?.status ?? 'unknown'}`,
      status: degradedCount > 0 ? '부분 저하' : '정상',
      accent: 'line-r',
      cta: '런타임 보기',
      tickets: ['TKT-037', 'TKT-038', 'TKT-030']
    },
    {
      key: 'future',
      page: 'junction',
      lineNo: 'A',
      lineCode: 'Future',
      name: 'Public / Arcade',
      summary: '후속 시뮬레이터와 공개 포털 확장',
      detail: 'Flash Game, image upload, 공개 확장 레일은 현재 허브에서 다음 순서만 안내합니다.',
      status: '차기 확장',
      accent: 'line-p',
      cta: '허브 유지',
      tickets: ['TKT-028', 'TKT-029', 'TKT-053']
    }
  ]
})

const heroMetrics = computed(() => [
  { label: 'services', value: String(servicesState.value.length || 0) },
  { label: 'queued tickets', value: String(healthState.value.tickets?.queued ?? 0) },
  { label: 'waiting pax', value: String(elevatorState.value.summary?.waitingPassengers ?? 0) }
])

const v050HeroMetrics = computed(() => [
  { label: 'live services', value: String(servicesState.value.length || 0) },
  { label: 'queued tickets', value: String(healthState.value.tickets?.queued ?? 0) },
  { label: 'prototype routes', value: String(v050RouteCards.length) }
])

const testView = computed(() => {
  if (!isLegacyTestRoute.value) {
    return null
  }
  return normalizeTestView(page.value)
})

const currentTestUrl = computed(() => {
  if (!isTestRoute.value) {
    return ''
  }

  if (isVersionedTestRoute.value) {
    return `${VERSIONED_TEST_ROUTE_PATH}/${normalizeVersionedTestView(page.value)}`
  }

  return `${TEST_ROUTE_PATH}?view=${normalizeTestView(page.value)}`
})

const activeTestCheckpoints = computed(() => {
  return isVersionedTestRoute.value ? versionedTestCheckpoints : testCheckpoints
})

const TOPBAR_LINES = {
  junction: ['line-w', 'W'],
  simhub: [simHubLine.lineClass, simHubLine.code],
  elevator: ['line-e', 'E'],
  taxi: ['line-t', 'T'],
  bloghub: ['line-b', 'B'],
  blogArchive: ['line-b', 'B'],
  blogPost: ['line-b', 'B'],
  writingStudio: ['line-b', 'B'],
  voyage: ['line-v', 'V'],
  work: ['line-w', 'W'],
  runtime: ['line-r', 'R'],
  ops: ['line-w', 'W'],
  signals: ['line-r', 'R']
}
const topbarLineClass = computed(() => (TOPBAR_LINES[page.value] || ['', 'W'])[0])
const topbarLetter = computed(() => (TOPBAR_LINES[page.value] || ['', 'W'])[1])

const currentRoute = computed(() => {
  if (isVersionedTestRoute.value && page.value === 'junction') {
    return {
      line: 'UI-v0.5.0 Prototype Junction',
      title: '시뮬레이션 환승 홀',
      description: '실사용 포털을 건드리지 않고, 다음 시뮬레이터 승강장과 운영 확장 레일을 분리해 검토하는 가상 허브입니다.'
    }
  }

  if (isVersionedTestRoute.value && page.value === 'taxi') {
    return {
      line: 'Line T / Taxi District Lab',
      title: '지역 수요·차량 현황',
      description: '서울 지하철식 환승 UX 위에서 택시 수요, 차량, 리워드 루프를 새로 설계하는 시뮬레이터 승강장입니다.'
    }
  }

  if (isVersionedTestRoute.value && page.value === 'ops') {
    return {
      line: 'Line O / Crew Board',
      title: '작업자·검수 현황',
      description: '누가 어떤 티켓을 잡았는지, 우선순위가 어떻게 반응해야 하는지 운영 확장 레일로 정리합니다.'
    }
  }

  if (isVersionedTestRoute.value && page.value === 'signals') {
    return {
      line: 'Line S / Signal Room',
      title: '실사용·목업 경계',
      description: '실사용 경로와 가상 디자인 레일의 경계, handoff, 검수 위치를 신호실처럼 고정합니다.'
    }
  }

  if (page.value === 'junction') {
    return {
      line: 'Main Junction',
      title: '환승 홀',
      description: '기능을 직접 실행하지 않고, 실제 페이지로 환승시키는 메인 허브입니다.'
    }
  }

  if (page.value === 'elevator') {
    return {
      line: 'Line E / Elevator Station',
      title: '멈춘 엘리베이터',
      description: '23층 건물의 층별 대기 인원, 승강기 적재량, 목적층 흐름을 실제 상태로 읽습니다.'
    }
  }

  if (page.value === 'simhub') {
    return {
      line: `Line S / ${simHubLine.nameEn}`,
      title: simHubLine.nameKo,
      description: simHubLine.subtitle
    }
  }

  if (page.value === 'taxi') {
    return {
      line: 'Line T / Taxi District Lab',
      title: '심야 택시',
      description: '9구역 수요, 차량 배치, 보상/패널티 루프를 화면 안에서 관찰합니다.'
    }
  }

  if (page.value === 'bloghub') {
    return {
      line: 'Line B / Blog District',
      title: '글 보관소와 스튜디오',
      description: '긴 글 읽기와 글쓰기 스튜디오를 시뮬레이터와 다른 리듬으로 분리한 글 공간입니다.'
    }
  }

  if (page.value === 'blogArchive') {
    return {
      line: 'Line B / Public Archive',
      title: '공개 글 보관소',
      description: '공개된 글만 모아 차분한 목록 리듬으로 읽는 아카이브 레일입니다.'
    }
  }

  if (page.value === 'blogPost') {
    return {
      line: 'Line B / Post Detail',
      title: activeBlogPost.value?.title || '글 읽기',
      description: '긴 글은 패널보다 문서처럼 읽혀야 하므로, 폭과 줄 간격을 차분하게 제한합니다.'
    }
  }

  if (page.value === 'writingStudio') {
    return {
      line: 'Line B / Writing Studio',
      title: '초안·미리보기·발행',
      description: '작성 집중 레이어와 상태 레이어를 나눈 단일 작성자용 글쓰기 스튜디오입니다.'
    }
  }

  if (page.value === 'voyage') {
    return {
      line: 'Line V / Voyage',
      title: '여행 노선',
      description: '진행 중인 여행과 지난 여행의 기록을 한 흐름에서 확인합니다.'
    }
  }

  if (page.value === 'work') {
    return {
      line: 'Line W / Work Manager',
      title: '운영 관제실',
      description: '티켓 상태, Ready 표시, 상세 패널, preset command 를 운영실처럼 분리합니다.'
    }
  }

  return {
    line: 'Line R / Runtime Board',
    title: '정책과 실행환경',
    description: 'ion2, rtx5070, gateway 의 역할과 degraded 정책을 릴리스 레일 관점에서 정리합니다.'
  }
})

const elevatorSummary = computed(() => elevatorState.value.summary || fallbackElevatorState.summary)
const elevatorDemand = computed(() => elevatorState.value.demand || fallbackElevatorState.demand)
const elevatorCars = computed(() => elevatorState.value.elevators || fallbackElevatorState.elevators)
const elevatorBuilding = computed(() => elevatorState.value.building || fallbackElevatorState.building)

const elevatorFloorRows = computed(() => {
  const building = elevatorState.value.building || fallbackElevatorState.building
  const floorQueues = elevatorState.value.floorQueues || []
  const queueMap = new Map(floorQueues.map((entry) => [Number(entry.floor), entry]))
  const floors = []
  for (let floor = building.maxFloor; floor >= building.minFloor; floor -= 1) {
    const queue = queueMap.get(floor) || {
      floor,
      up: 0,
      down: 0
    }
    floors.push({
      floor,
      up: queue.up ?? 0,
      down: queue.down ?? 0
    })
  }
  return floors
})

const elevatorAverageWaitSeconds = computed(() => {
  const waitingPassengers = elevatorState.value.waitingPassengers || []
  if (waitingPassengers.length === 0) {
    return 0
  }

  const currentTick = Number(elevatorState.value.tick || 0)
  const stepSeconds = Number(elevatorDemand.value.stepSeconds || 0.35)
  const totalWaitSeconds = waitingPassengers.reduce((total, passenger) => {
    return total + Math.max(currentTick - Number(passenger.requestedAtTick || currentTick), 0) * stepSeconds
  }, 0)
  return Math.round(totalWaitSeconds / waitingPassengers.length)
})

const elevatorEvents = computed(() => {
  const boarded = elevatorCars.value.flatMap((car) => {
    return (car.passengers || []).map((passenger) => ({
      tick: Number(passenger.boardedAtTick || 0),
      text: `${passenger.originFloor}F 탑승 → ${car.id}`
    }))
  })
  const arrived = (elevatorState.value.completedPassengers || []).map((passenger) => ({
    tick: Number(passenger.servedAtTick || 0),
    text: `${passenger.servedByElevatorId || passenger.assignedElevatorId || 'E?'} ${passenger.destinationFloor}F 도착`
  }))
  const events = [...boarded, ...arrived]
    .filter((event) => event.tick > 0)
    .sort((left, right) => right.tick - left.tick)
    .slice(0, 8)

  if (events.length > 0) {
    return events.map((event) => event.text)
  }

  return elevatorCars.value.slice(0, 4).map((car) => {
    const floor = Number(car.position ?? car.currentFloor).toFixed(1)
    return `${car.id} ${floor}F ${directionGlyph(car.direction) || '대기'}`
  })
})

const simHubCards = computed(() => [
  {
    key: 'elevator',
    page: 'elevator',
    lineNo: 'E',
    name: 'Elevator Station',
    displayName: '멈춘 엘리베이터',
    kicker: '추천 시나리오 · 시스템 설계',
    summary: '재시도와 상태 복구를 설계합니다.',
    status: elevatorState.value.mode === 'live-traffic-loop' ? '실시간 루프' : '저하 운행',
    accent: 'line-e',
    cta: '시작'
  },
  {
    key: 'taxi',
    page: 'taxi',
    lineNo: 'T',
    name: 'Taxi District Lab',
    displayName: '심야 택시',
    summary: '제한된 정보로 안전한 선택을 만듭니다.',
    status: '제품 판단',
    accent: 'line-t',
    cta: '시작'
  }
])
const featuredSimCard = computed(() => simHubCards.value[0])
const secondarySimCards = computed(() => simHubCards.value.slice(1))

function runtimeStatusMeta(value) {
  const status = String(value || '').trim().toLowerCase()
  if (['online', 'available', 'ok', 'healthy'].includes(status)) {
    return { label: '정상', warning: false }
  }
  if (status === 'degraded') {
    return { label: '지연', warning: true }
  }
  if (['unavailable', 'offline'].includes(status)) {
    return { label: '중단', warning: true }
  }
  return { label: '확인 중', warning: true }
}

function runtimeMetric(source) {
  const responseTime = [source?.responseTimeMs, source?.latencyMs, source?.durationMs]
    .map(Number)
    .find(value => Number.isFinite(value) && value >= 0)
  return responseTime === undefined ? '' : `${Math.round(responseTime)} ms`
}

function runtimeToneRow({ key, label, detail, source, status }) {
  const meta = runtimeStatusMeta(status)
  const metric = runtimeMetric(source)
  return {
    key,
    label,
    detail,
    status: metric ? `${meta.label} · ${metric}` : meta.label,
    warning: meta.warning
  }
}

const runtimeToneRows = computed(() => [
  runtimeToneRow({
    key: 'gateway',
    label: '웹 화면',
    detail: 'gateway',
    source: healthState.value,
    status: healthState.value.status
  }),
  runtimeToneRow({
    key: 'ollama',
    label: '인공지능 응답',
    detail: 'Ollama',
    source: runtimeState.value.ollama,
    status: runtimeState.value.ollama?.status
  }),
  ...(runtimeState.value.nodes || []).map((node) => runtimeToneRow({
    key: node.nodeId,
    label: node.nodeId,
    detail: node.role,
    source: node,
    status: node.availability
  }))
])
const runtimeNeedsAttention = computed(() => runtimeToneRows.value.some((row) => row.warning))

const taxiZones = computed(() => taxiState.value.zones)
const taxiFleet = computed(() => taxiState.value.taxis)
const taxiActiveRequests = computed(() => taxiState.value.activeRequests)
const taxiCompletedRequests = computed(() =>
  [...taxiState.value.completedRequests].slice(-8).reverse()
)
const taxiRewardSummary = computed(() => ({
  reward: taxiState.value.score.reward,
  penalty: taxiState.value.score.penalty,
  net: taxiState.value.score.reward - taxiState.value.score.penalty
}))
const taxiDashboardMetrics = computed(() => {
  const completed = taxiState.value.completedRequests
  const averageWait =
    completed.length > 0
      ? completed.reduce((sum, item) => sum + (item.waitSeconds || 0), 0) / completed.length
      : 0
  return [
    { label: '진행 중 호출', value: String(taxiState.value.activeRequests.length) },
    { label: '완료 운행', value: String(completed.length) },
    { label: '평균 대기', value: `${averageWait.toFixed(1)}초` },
    { label: '운행 차량', value: String(taxiFleet.value.length) }
  ]
})
const taxiZoneCards = computed(() =>
  taxiZones.value.map((zone) => {
    const pending = taxiActiveRequests.value.filter((request) => request.originId === zone.id).length
    const nearbyFleet = taxiFleet.value.filter(
      (taxi) => taxi.zoneId === zone.id || taxi.targetZoneId === zone.id
    ).length
    return {
      ...zone,
      pending,
      nearbyFleet
    }
  })
)
const taxiRequestQueue = computed(() =>
  [...taxiActiveRequests.value]
    .sort((left, right) => {
      const leftWeight = left.status === 'pending' ? 0 : 1
      const rightWeight = right.status === 'pending' ? 0 : 1
      if (leftWeight !== rightWeight) {
        return leftWeight - rightWeight
      }
      return right.createdTick - left.createdTick
    })
    .slice(0, 6)
)

const publishedBlogPosts = computed(() =>
  [...blogPosts.value]
    .filter((post) => post.status === 'published')
    .sort((left, right) => String(right.publishedAt || '').localeCompare(String(left.publishedAt || '')))
)
const draftBlogPosts = computed(() =>
  [...blogPosts.value]
    .filter((post) => post.status === 'draft')
    .sort((left, right) => String(right.updatedAt || '').localeCompare(String(left.updatedAt || '')))
)
const archivedBlogPosts = computed(() =>
  [...blogPosts.value]
    .filter((post) => post.status === 'archived')
    .sort((left, right) => String(right.updatedAt || '').localeCompare(String(left.updatedAt || '')))
)
const activeBlogPost = computed(() => {
  if (!activeBlogSlug.value) {
    return null
  }
  return publishedBlogPosts.value.find((post) => post.slug === activeBlogSlug.value) || null
})
const latestPublishedBlogPost = computed(() => publishedBlogPosts.value[0] || null)
const blogArchiveYears = computed(() => {
  const groups = new Map()
  publishedBlogPosts.value.forEach((post) => {
    const year = new Date(post.publishedAt).getFullYear()
    const label = Number.isFinite(year) ? year : '날짜 미정'
    if (!groups.has(label)) {
      groups.set(label, [])
    }
    groups.get(label).push(post)
  })
  return Array.from(groups, ([year, posts]) => ({ year, posts }))
})
const studioPreviewHtml = computed(() =>
  renderMarkdownToHtml(studioState.value.bodyMarkdown, studioState.value.tables)
)

const workWorkerSummary = computed(() => {
  const summary = workBoardState.value.workerSummary
  if (Array.isArray(summary) && summary.length > 0) {
    return summary
  }

  const startedTickets = workBoardColumns.value.find((column) => column.status === 'started')?.tickets || []
  return [
    {
      workerId: 'ion2-worker',
      status: startedTickets.length > 0 ? 'active' : 'idle',
      currentTicketIds: startedTickets.map((ticket) => ticket.id),
      focus: startedTickets.length > 0 ? 'Started lane ownership' : 'Ready pick 대기'
    }
  ]
})

const workPriorityPolicy = computed(() => {
  return (
    workBoardState.value.priorityPolicy || {
      queueSource: 'docs/tickets/board.md backlog',
      automaticRange: ['우선순위 힌트 계산', 'Started owner 표시'],
      manualRange: ['실제 착수 결정', 'Need Review 이후 종료 판정'],
      nextCandidates: readyColumnTickets.value
        .concat(workBoardColumns.value.find((column) => column.status === 'backlog')?.tickets || [])
        .slice(0, 4)
        .map((ticket) => `${ticket.id} ${ticket.priority}`)
    }
  )
})

const workPersistence = computed(() => {
  return (
    workBoardState.value.persistence || {
      mode: 'memory-fallback',
      filePath: 'gateway/data/work-manager-store.json',
      auditEventCount: 0,
      lastAuditAt: '',
      targetDatabase: 'embedded-h2'
    }
  )
})

const workBoardColumns = computed(() => {
  const normalized = new Map(
    (workBoardState.value.columns || []).map((column) => [column.status, column])
  )

  const backlogSource = normalized.get('backlog')?.tickets || []
  const safeReadyIds = readyTicketIds.value.filter((ticketId) =>
    backlogSource.some((ticket) => ticket.id === ticketId)
  )
  if (safeReadyIds.length !== readyTicketIds.value.length) {
    readyTicketIds.value = safeReadyIds
    persistReadyTicketIds(safeReadyIds)
  }

  const readySet = new Set(safeReadyIds)
  const backlogTickets = backlogSource.filter((ticket) => !readySet.has(ticket.id))
  const readyTickets = backlogSource.filter((ticket) => readySet.has(ticket.id))

  return [
    {
      status: 'backlog',
      label: 'Backlog',
      helper: '아직 선점되지 않은 작업',
      tickets: backlogTickets
    },
    {
      status: 'ready',
      label: 'Ready',
      helper: '다른 작업이 끝나기를 기다림',
      tickets: readyTickets
    },
    {
      status: 'started',
      label: 'Started',
      helper: '담당자가 수행 중',
      tickets: normalized.get('started')?.tickets || []
    },
    {
      status: 'need_review',
      label: 'Need Review',
      helper: 'PM 확인 대기',
      tickets: normalized.get('need_review')?.tickets || []
    },
    {
      status: 'finished',
      label: 'Finished',
      helper: '검수 완료 및 히스토리 반영',
      tickets: normalized.get('finished')?.tickets || []
    }
  ]
})

const readyColumnTickets = computed(() =>
  workBoardColumns.value.find((column) => column.status === 'ready')?.tickets || []
)

const workToneRows = computed(() => [
  { status: 'need_review', label: '검토 대기', shortStatus: '검토' },
  { status: 'started', label: '진행 중', shortStatus: '진행' },
  { status: 'ready', label: '다음 작업', shortStatus: '대기' }
].map((item) => {
  const column = workBoardColumns.value.find((candidate) => candidate.status === item.status)
  return {
    ...item,
    count: column?.tickets.length || 0,
    helper: column?.helper || ''
  }
}))

const allWorkTickets = computed(() => workBoardColumns.value.flatMap((column) => column.tickets))

const selectedWorkTicket = computed(() => {
  const ticket =
    allWorkTickets.value.find((candidate) => candidate.id === selectedWorkTicketId.value) ||
    allWorkTickets.value[0] ||
    null
  if (!ticket) {
    return null
  }

  const lane = workBoardColumns.value.find((column) =>
    column.tickets.some((candidate) => candidate.id === ticket.id)
  )

  return {
    ...ticket,
    lane: lane?.label || ticket.status
  }
})

const workVersionSummary = computed(() => {
  const versionCount = new Map()
  for (const ticket of allWorkTickets.value) {
    const key = ticket.targetVersion || 'unknown'
    versionCount.set(key, (versionCount.get(key) || 0) + 1)
  }
  return Array.from(versionCount.entries()).sort(([left], [right]) => left.localeCompare(right))
})

const workTargetVersionOptions = computed(() => {
  const values = new Set(TARGET_VERSION_OPTIONS)
  if (selectedWorkTicket.value?.targetVersion) {
    values.add(selectedWorkTicket.value.targetVersion)
  }
  return Array.from(values)
})

const workVersionHeader = computed(() => ({
  focusVersion: selectedWorkTicket.value?.targetVersion || 'v0.4.0',
  developmentCeiling: 'v0.5.0',
  activeRange: 'v0.4.0 -> v0.5.0',
  selectedPriority: selectedWorkTicket.value?.priority || 'P?'
}))

const commandPresets = computed(() => workBoardState.value.actions?.commandPresets || [])
const activityFeed = computed(() => workBoardState.value.activityFeed || [])
const commandHistory = computed(() => workBoardState.value.commandHistory || [])

let splashTimer
let portalRefreshTimer
let elevatorRefreshTimer
let taxiSimulationTimer
let workManagerExpiryTimer
let studioAutosaveTimer
let studioSavedSnapshot = ''
let reducedMotionMediaQuery
let reducedMotionMediaListener
let splashAnimationRunId = 0
let splashAnimationTimers = []

watch(theme, (nextTheme) => {
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme)
    } catch (error) {
      // 테마 저장 실패는 현재 화면 사용을 막지 않는다.
    }
  }
})

watch(
  [workManagerToken, workManagerTokenExpiresAt],
  ([nextToken, nextExpiresAt]) => {
    persistWorkManagerSession(nextToken, nextExpiresAt)
    scheduleWorkManagerExpiration()
  },
  { immediate: true }
)

watch(blogPosts, (nextPosts) => {
  if (!persistBlogPosts(nextPosts) && page.value === 'writingStudio') {
    studioSavePhase.value = 'error'
  }
}, { deep: true })

watch(activeBlogSlug, (nextSlug) => {
  persistBlogSlug(nextSlug)
})

watch(studioViewMode, (nextMode) => {
  persistStudioViewMode(nextMode)
})

watch(studioPostId, (nextId) => {
  persistStudioPostId(nextId)
})

watch(
  () => elevatorDemand.value,
  (nextDemand) => {
    if (!nextDemand) {
      return
    }
    demandPreset.value = nextDemand.preset || 'normal'
    demandIntensity.value = nextDemand.intensity ?? 55
  },
  { immediate: true, deep: true }
)

watch(
  () => elevatorCars.value.length,
  (nextCount) => {
    if (nextCount > 0) {
      elevatorCarCount.value = nextCount
    }
  },
  { immediate: true }
)

watch(
  () => allWorkTickets.value.map((ticket) => ticket.id).join(','),
  () => {
    if (!selectedWorkTicketId.value && allWorkTickets.value.length > 0) {
      selectedWorkTicketId.value = allWorkTickets.value[0].id
      selectedCommand.value = commandPresets.value[0]?.action || ''
      return
    }

    if (
      selectedWorkTicketId.value &&
      !allWorkTickets.value.some((ticket) => ticket.id === selectedWorkTicketId.value)
    ) {
      selectedWorkTicketId.value = allWorkTickets.value[0]?.id || ''
    }
  },
  { immediate: true }
)

watch(
  () => [
    selectedWorkTicket.value?.id || '',
    selectedWorkTicket.value?.targetVersion || '',
    selectedWorkTicket.value?.priority || '',
    selectedWorkTicket.value?.dependencies || selectedWorkTicket.value?.prerequisites || ''
  ].join('|'),
  () => {
    metadataTargetVersion.value = selectedWorkTicket.value?.targetVersion || 'v0.4.0'
    metadataPriority.value = selectedWorkTicket.value?.priority || 'P2'
    metadataDependencies.value =
      selectedWorkTicket.value?.dependencies || selectedWorkTicket.value?.prerequisites || ''
    metadataMessage.value = ''
    metadataError.value = ''
  },
  { immediate: true }
)

watch(
  () => commandPresets.value.map((preset) => preset.action).join(','),
  () => {
    if (!selectedCommand.value && commandPresets.value.length > 0) {
      selectedCommand.value = commandPresets.value[0].action
    }
  },
  { immediate: true }
)

watch(
  () => studioState.value.title,
  (nextTitle) => {
    if (studioState.value.slugLocked && studioState.value.slug) {
      return
    }
    studioState.value.slug = slugify(nextTitle)
  }
)

watch(
  () => createStudioEditableSnapshot(studioState.value),
  (nextSnapshot) => {
    if (!studioSavedSnapshot) {
      studioSavedSnapshot = nextSnapshot
      return
    }
    studioDirty.value = nextSnapshot !== studioSavedSnapshot
    if (studioDirty.value) {
      scheduleStudioAutosave()
    }
  },
  { flush: 'post' }
)

function createSplashCellState(key) {
  return {
    key,
    currentCharacter: ' ',
    topStatic: displaySplashCharacter(' '),
    bottomStatic: displaySplashCharacter(' '),
    topFlip: displaySplashCharacter(' '),
    bottomFlip: displaySplashCharacter(' '),
    isRunning: false,
    isSettling: false,
    durationMs: '330ms'
  }
}

function displaySplashCharacter(character) {
  return character === ' ' ? '\u00A0' : character
}

function centerSplashPhrase(phrase) {
  const leftPadding = Math.floor((splashCellCount - phrase.length) / 2)
  return `${' '.repeat(leftPadding)}${phrase}`.padEnd(splashCellCount, ' ')
}

function updateSplashCellDisplay(cell, character) {
  const display = displaySplashCharacter(character)
  cell.currentCharacter = character
  cell.topStatic = display
  cell.bottomStatic = display
  cell.topFlip = display
  cell.bottomFlip = display
  cell.isRunning = false
  cell.isSettling = false
}

function resetSplashBoard() {
  splashBoardCells.value.forEach((cell) => updateSplashCellDisplay(cell, ' '))
}

function setSplashBoardToPhrase(phrase) {
  const target = centerSplashPhrase(phrase)
  splashBoardCells.value.forEach((cell, index) => {
    updateSplashCellDisplay(cell, target.charAt(index) || ' ')
  })
  currentSplashPhrase.value = phrase
}

function randomSplashRange(min, max) {
  return min + Math.random() * (max - min)
}

function buildSplashFlipSequence(targetCharacter, charIndex) {
  const spins =
    targetCharacter === ' ' ? (Math.random() < 0.3 ? 1 : 0) : 3 + (charIndex % 3) + Math.floor(Math.random() * 4)
  const sequence = []
  for (let spinIndex = 0; spinIndex < spins; spinIndex += 1) {
    sequence.push(splashLatinCharset.charAt(1 + Math.floor(Math.random() * (splashLatinCharset.length - 1))))
  }
  sequence.push(targetCharacter)
  return sequence
}

function queueSplashAnimation(callback, delayMs) {
  const timer = window.setTimeout(() => {
    splashAnimationTimers = splashAnimationTimers.filter((entry) => entry !== timer)
    callback()
  }, delayMs)
  splashAnimationTimers.push(timer)
}

function clearSplashAnimationTimers() {
  splashAnimationTimers.forEach((timer) => window.clearTimeout(timer))
  splashAnimationTimers = []
}

function animateSplashCellFlip(cell, nextCharacter, durationMs, settle, runId, onComplete) {
  if (runId !== splashAnimationRunId) {
    return
  }
  if (nextCharacter === cell.currentCharacter) {
    onComplete()
    return
  }

  const currentDisplay = displaySplashCharacter(cell.currentCharacter)
  const nextDisplay = displaySplashCharacter(nextCharacter)
  cell.topStatic = nextDisplay
  cell.bottomStatic = currentDisplay
  cell.topFlip = currentDisplay
  cell.bottomFlip = nextDisplay
  cell.durationMs = `${Math.round(durationMs)}ms`
  cell.isRunning = false
  cell.isSettling = settle

  queueSplashAnimation(() => {
    if (runId !== splashAnimationRunId) {
      return
    }
    cell.isRunning = true
    queueSplashAnimation(() => {
      if (runId !== splashAnimationRunId) {
        return
      }
      updateSplashCellDisplay(cell, nextCharacter)
      onComplete()
    }, Math.round(durationMs * 1.58) + 96)
  }, 0)
}

function playSplashCellSequence(cell, sequence, stepDurationMs, runId, index = 0) {
  if (runId !== splashAnimationRunId) {
    return
  }
  const nextCharacter = sequence[index]
  const isLast = index === sequence.length - 1
  const durationMs = isLast ? 330 : stepDurationMs

  animateSplashCellFlip(cell, nextCharacter, durationMs, isLast, runId, () => {
    if (!isLast) {
      playSplashCellSequence(cell, sequence, stepDurationMs, runId, index + 1)
    }
  })
}

function animateSplashPhrase(phrase, runId) {
  if (runId !== splashAnimationRunId) {
    return
  }
  const target = centerSplashPhrase(phrase)
  currentSplashPhrase.value = phrase
  splashBoardCells.value.forEach((cell, charIndex) => {
    const targetCharacter = target.charAt(charIndex) || ' '
    const delayMs = 180 + charIndex * 45 + randomSplashRange(0, 36)
    const stepDurationMs = 82 + randomSplashRange(-8, 12)
    const sequence = buildSplashFlipSequence(targetCharacter, charIndex)
    queueSplashAnimation(() => {
      playSplashCellSequence(cell, sequence, stepDurationMs, runId)
    }, delayMs)
  })
}

function playSplashFlap() {
  splashAnimationRunId += 1
  const runId = splashAnimationRunId
  clearSplashAnimationTimers()
  currentTickerIndex.value = 0

  if (prefersReducedMotion.value) {
    setSplashBoardToPhrase(splashPhrases[0])
    return
  }

  resetSplashBoard()
  splashPhrases.forEach((phrase, phraseIndex) => {
    queueSplashAnimation(() => {
      currentTickerIndex.value = phraseIndex
      animateSplashPhrase(phrase, runId)
    }, phraseIndex * 3300)
  })
}

onMounted(async () => {
  migrateLegacyVoyageStorage(window.localStorage)
  window.addEventListener('beforeunload', handleStudioBeforeUnload)
  window.addEventListener('popstate', handleLocationPopState)
  if (typeof window.matchMedia === 'function') {
    reducedMotionMediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    prefersReducedMotion.value = reducedMotionMediaQuery.matches
    reducedMotionMediaListener = (event) => {
      prefersReducedMotion.value = event.matches
      if (!isTestRoute.value && page.value === 'splash') {
        playSplashFlap()
      }
    }
    if (typeof reducedMotionMediaQuery.addEventListener === 'function') {
      reducedMotionMediaQuery.addEventListener('change', reducedMotionMediaListener)
    } else if (typeof reducedMotionMediaQuery.addListener === 'function') {
      reducedMotionMediaQuery.addListener(reducedMotionMediaListener)
    }
  }

  if (!isTestRoute.value && page.value === 'splash') {
    playSplashFlap()
    scheduleSplashTransition()
  } else if (!isTestRoute.value) {
    syncLiveLocation({ replace: true })
  } else {
    syncTestLocation()
  }

  initializeBlogWorkspace()
  if (!isStaticMode) {
    await loadPortalData()
    if (page.value === 'elevator') {
      await activateElevatorPage()
    }
    portalRefreshTimer = window.setInterval(() => {
      loadPortalData({ refreshElevator: false })
    }, 8000)
    elevatorRefreshTimer = window.setInterval(() => {
      loadElevatorState()
    }, 900)
    taxiSimulationTimer = window.setInterval(() => {
      advanceTaxiSimulation()
    }, 1200)
  }
})

onBeforeUnmount(() => {
  window.clearTimeout(splashTimer)
  clearSplashAnimationTimers()
  window.clearInterval(portalRefreshTimer)
  window.clearInterval(elevatorRefreshTimer)
  window.clearInterval(taxiSimulationTimer)
  window.clearTimeout(workManagerExpiryTimer)
  window.clearTimeout(studioAutosaveTimer)
  window.removeEventListener('beforeunload', handleStudioBeforeUnload)
  window.removeEventListener('popstate', handleLocationPopState)
  if (reducedMotionMediaQuery && reducedMotionMediaListener) {
    if (typeof reducedMotionMediaQuery.removeEventListener === 'function') {
      reducedMotionMediaQuery.removeEventListener('change', reducedMotionMediaListener)
    } else if (typeof reducedMotionMediaQuery.removeListener === 'function') {
      reducedMotionMediaQuery.removeListener(reducedMotionMediaListener)
    }
  }
})

async function loadPortalData(options = { refreshElevator: true }) {
  await Promise.allSettled([
    loadHealthState(),
    loadRuntimeState(),
    loadServicesState(),
    loadWorkBoardState(),
    options.refreshElevator ? loadElevatorState() : Promise.resolve()
  ])
}

async function loadHealthState() {
  try {
    healthState.value = await fetchJson('/api/health')
  } catch (error) {
    healthState.value = fallbackHealth
  }
}

async function loadRuntimeState() {
  try {
    runtimeState.value = await fetchJson('/api/runtime')
  } catch (error) {
    runtimeState.value = fallbackRuntime
  }
}

async function loadServicesState() {
  try {
    const response = await fetchJson('/api/services')
    servicesState.value = response.services || []
  } catch (error) {
    servicesState.value = []
  }
}

async function loadWorkBoardState() {
  try {
    workBoardState.value = await fetchJson('/api/work-manager/board')
  } catch (error) {
    workBoardState.value = fallbackWorkBoard
  }
}

async function loadElevatorState() {
  try {
    elevatorState.value = await fetchJson('/api/services/elevator-service/api/state')
  } catch (error) {
    elevatorState.value = fallbackElevatorState
  }
}

async function updateElevatorCarCount(nextCount) {
  const elevatorCount = Number(nextCount)
  elevatorCarCount.value = elevatorCount
  await postElevatorJson('/api/services/elevator-service/api/config', {
    elevatorCount
  })
  await loadElevatorState()
}

async function applyDemandPreset(nextPreset) {
  demandPreset.value = nextPreset
  await postElevatorJson('/api/services/elevator-service/api/demand', {
    preset: nextPreset,
    intensity: demandIntensity.value,
    autoMode: true
  })
  await loadElevatorState()
}

async function activateElevatorPage() {
  const livePreset = ['quiet', 'normal', 'busy'].includes(elevatorDemand.value.preset)
    ? elevatorDemand.value.preset
    : 'normal'
  await applyDemandPreset(livePreset)
}

async function updateDemandIntensity(nextValue) {
  const intensity = Number(nextValue)
  demandIntensity.value = intensity
  await postElevatorJson('/api/services/elevator-service/api/demand', {
    preset: demandPreset.value,
    intensity
  })
}

async function addPassengerAtFloor({ floor, direction }) {
  await postElevatorJson('/api/services/elevator-service/api/passenger', {
    floor,
    direction
  })
  await loadElevatorState()
}

async function resetElevator() {
  await postElevatorJson('/api/services/elevator-service/api/reset', {})
  await loadElevatorState()
}

function initializeBlogWorkspace() {
  if (blogPosts.value.length === 0) {
    blogPosts.value = createSeedBlogPosts()
  }

  if (!activeBlogSlug.value && publishedBlogPosts.value.length > 0) {
    activeBlogSlug.value = publishedBlogPosts.value[0].slug
  }

  if (studioPostId.value) {
    const existing = blogPosts.value.find((post) => post.id === studioPostId.value)
    if (existing) {
      populateStudio(existing)
      return
    }
  }

  if (draftBlogPosts.value.length > 0) {
    populateStudio(draftBlogPosts.value[0])
    return
  }

  createNewStudioPost(false)
}

function advanceTaxiSimulation() {
  const nextState = cloneTaxiState(taxiState.value)
  nextState.clock.elapsedSeconds += 1.2

  if (shouldSpawnAutoTaxiRequest(nextState)) {
    spawnTaxiRequest(nextState, { source: 'auto' })
  }

  taxiState.value = advanceTaxiFleet(nextState)
}

function submitManualTaxiRequest() {
  if (taxiManualOrigin.value === taxiManualDestination.value) {
    taxiMessage.value = '출발지와 도착지는 달라야 합니다.'
    return
  }

  const nextState = cloneTaxiState(taxiState.value)
  spawnTaxiRequest(nextState, {
    originId: taxiManualOrigin.value,
    destinationId: taxiManualDestination.value,
    passengers: Number(taxiManualPassengers.value),
    source: 'manual'
  })
  taxiState.value = assignPendingTaxiRequests(nextState)
  taxiMessage.value = '수동 호출을 추가했습니다.'
}

function addTaxiFleetUnit() {
  const nextState = cloneTaxiState(taxiState.value)
  const homeZone = TAXI_ZONE_DEFINITIONS[nextState.taxis.length % TAXI_ZONE_DEFINITIONS.length]
  nextState.taxis.push(createTaxiCab(nextState.taxis.length + 1, homeZone.id))
  nextState.score.penalty += 12
  nextState.eventLog.unshift(`차량 추가 배치 · ${homeZone.name} · penalty -12`)
  nextState.eventLog = nextState.eventLog.slice(0, 12)
  taxiState.value = assignPendingTaxiRequests(nextState)
  taxiMessage.value = '차량을 추가했고 운영 패널티를 반영했습니다.'
}

function openBlogArchive() {
  if (!activeBlogSlug.value && publishedBlogPosts.value.length > 0) {
    activeBlogSlug.value = publishedBlogPosts.value[0].slug
  }
  openPage('blogArchive')
}

function openBlogPost(slug) {
  activeBlogSlug.value = slug
  openPage('blogPost')
}

function createNewStudioPost(moveToStudio = true) {
  if (page.value === 'writingStudio' && !prepareStudioTransition()) {
    return
  }
  const blank = createEmptyStudioState()
  studioState.value = blank
  studioPostId.value = blank.id
  markStudioSaved('', blank)
  blogMessage.value = ''
  if (moveToStudio) {
    openPage('writingStudio')
  }
}

function openStudioForPost(postId) {
  const post = blogPosts.value.find((candidate) => candidate.id === postId)
  if (!post) {
    return
  }
  if (page.value === 'writingStudio' && postId !== studioPostId.value && !prepareStudioTransition()) {
    return
  }
  populateStudio(post)
  openPage('writingStudio')
}

function populateStudio(post) {
  const slugLocked =
    typeof post.slugLocked === 'boolean'
      ? post.slugLocked
      : Boolean(post.slug && post.slug !== slugify(post.title))
  studioState.value = {
    id: post.id,
    title: post.title,
    slug: post.slug,
    summary: post.summary,
    bodyMarkdown: post.bodyMarkdown,
    status: post.status,
    tags: [...(post.tags || [])].join(', '),
    slugLocked,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    publishedAt: post.publishedAt || '',
    tables: normalizeStudioTables(post.tables)
  }
  studioPostId.value = post.id
  markStudioSaved(post.updatedAt || '', studioState.value)
}

function setStudioSlug(value) {
  studioState.value.slugLocked = true
  studioState.value.slug = slugify(value)
}

function updateStudioField(field, value) {
  blogMessage.value = ''
  if (field === 'slug') {
    setStudioSlug(value)
  } else if (['title', 'bodyMarkdown', 'summary', 'tags'].includes(field)) {
    studioState.value[field] = value
  } else if (field === 'tables' && Array.isArray(value)) {
    studioState.value.tables = normalizeStudioTables(value)
  }
}

function saveStudioDraft() {
  const saved = persistStudioPost(studioState.value.status || 'draft')
  if (!saved) {
    return
  }
  blogMessage.value = saved.status === 'published' ? '변경사항을 저장했습니다.' : '초안을 저장했습니다.'
}

function publishStudioPost() {
  const saved = persistStudioPost('published')
  if (!saved) {
    return
  }
  activeBlogSlug.value = saved.slug
  blogMessage.value = '글을 발행했고 공개 아카이브에 반영했습니다.'
  openPage('blogPost')
}

function archiveStudioPost() {
  const saved = persistStudioPost('archived')
  if (!saved) {
    return
  }
  blogMessage.value = '글을 보관 상태로 전환했습니다.'
  openPage('bloghub')
}

function restoreArchivedPost(postId, nextStatus) {
  const targetStatus = nextStatus === 'published' ? 'published' : 'draft'
  const postIndex = blogPosts.value.findIndex((post) => post.id === postId && post.status === 'archived')
  if (postIndex < 0) {
    return
  }

  const post = blogPosts.value[postIndex]
  if (
    targetStatus === 'published' &&
    (!String(post.summary || '').trim() || !String(post.bodyMarkdown || '').trim())
  ) {
    blogMessage.value = '공개 복원 전 요약과 본문이 필요합니다.'
    return
  }

  const restoredPost = {
    ...post,
    status: targetStatus,
    updatedAt: new Date().toISOString(),
    publishedAt:
      targetStatus === 'published' ? post.publishedAt || new Date().toISOString() : post.publishedAt || ''
  }
  const nextPosts = [...blogPosts.value]
  nextPosts.splice(postIndex, 1, restoredPost)
  persistBlogPosts(nextPosts)
  blogPosts.value = nextPosts

  if (studioPostId.value === restoredPost.id) {
    populateStudio(restoredPost)
  }
  blogMessage.value =
    targetStatus === 'published' ? '보관 글을 다시 공개했습니다.' : '보관 글을 초안으로 복원했습니다.'
}

function unpublishStudioPost() {
  if (studioState.value.status !== 'published') {
    return
  }
  const saved = persistStudioPost('draft')
  if (saved) {
    blogMessage.value = '발행을 취소하고 초안으로 전환했습니다.'
  }
}

function persistStudioPost(nextStatus, options = {}) {
  studioSavePhase.value = 'saving'
  const nowIso = new Date().toISOString()
  const title = studioState.value.title.trim()
  const summary = studioState.value.summary.trim()
  const bodyMarkdown = studioState.value.bodyMarkdown.trim()
  const current = blogPosts.value.find((post) => post.id === studioState.value.id)
  const status = nextStatus || current?.status || studioState.value.status || 'draft'
  if (!title) {
    studioSavePhase.value = 'error'
    if (!options.silent) {
      blogMessage.value = '제목을 입력하면 저장할 수 있습니다.'
    }
    return null
  }
  if (status === 'published' && (!summary || !bodyMarkdown)) {
    studioSavePhase.value = 'error'
    if (!options.silent) {
      blogMessage.value = '발행하려면 요약과 본문을 입력해 주세요.'
    }
    return null
  }

  const createdAt = current?.createdAt || nowIso
  const slug = ensureUniqueSlug(
    studioState.value.slug || studioState.value.title,
    current?.id || studioState.value.id
  )
  const publishedAt =
    current?.publishedAt || studioState.value.publishedAt || (status === 'published' ? nowIso : '')

  const nextPost = {
    id: current?.id || studioState.value.id || createEntityId('post'),
    slug,
    title,
    summary,
    bodyMarkdown,
    status,
    slugLocked: Boolean(studioState.value.slugLocked || current?.slugLocked),
    tags: studioState.value.tags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean),
    tables: normalizeStudioTables(studioState.value.tables),
    createdAt,
    updatedAt: nowIso,
    publishedAt
  }

  const existingIndex = blogPosts.value.findIndex((post) => post.id === nextPost.id)
  const nextPosts = [...blogPosts.value]
  if (existingIndex >= 0) {
    nextPosts.splice(existingIndex, 1, nextPost)
  } else {
    nextPosts.unshift(nextPost)
  }

  const postsSaved = persistBlogPosts(nextPosts)
  const targetSaved = persistStudioPostId(nextPost.id)
  if (!postsSaved || !targetSaved) {
    studioSavePhase.value = 'error'
    if (!options.silent) {
      blogMessage.value = '브라우저 저장 공간을 확인해 주세요.'
    }
    return null
  }
  blogPosts.value = nextPosts
  populateStudio(nextPost)
  return nextPost
}

function createStudioEditableSnapshot(state) {
  return JSON.stringify({
    id: state.id,
    title: state.title,
    slug: state.slug,
    slugLocked: Boolean(state.slugLocked),
    summary: state.summary,
    tags: state.tags,
    bodyMarkdown: state.bodyMarkdown,
    tables: normalizeStudioTables(state.tables),
    status: state.status,
    publishedAt: state.publishedAt
  })
}

function markStudioSaved(savedAt, state = studioState.value) {
  window.clearTimeout(studioAutosaveTimer)
  studioSavedSnapshot = createStudioEditableSnapshot(state)
  studioDirty.value = false
  studioLastSavedAt.value = savedAt
  studioSavePhase.value = 'saved'
}

function scheduleStudioAutosave() {
  if (typeof window === 'undefined') {
    return
  }
  window.clearTimeout(studioAutosaveTimer)
  studioSavePhase.value = 'saving'
  studioAutosaveTimer = window.setTimeout(() => {
    flushStudioAutosave()
  }, 800)
}

function flushStudioAutosave() {
  if (!studioDirty.value) {
    return true
  }
  window.clearTimeout(studioAutosaveTimer)
  const saved = persistStudioPost(studioState.value.status || 'draft', { silent: true })
  return Boolean(saved)
}

function backupLocalWriting() {
  writingBackupMessage.value = ''
  if (studioDirty.value && !flushStudioAutosave()) {
    writingBackupMessage.value = '저장 실패를 해결한 뒤 다시 시도해 주세요.'
    return
  }
  try {
    downloadWritingBackup(window.localStorage, VOYAGE_ARCHIVE_STORAGE_KEY)
    writingBackupMessage.value = '백업 파일을 내려받았습니다.'
  } catch (error) {
    writingBackupMessage.value = '백업 파일을 만들지 못했습니다.'
  }
}

function prepareStudioTransition() {
  if (!studioDirty.value || flushStudioAutosave()) {
    return true
  }
  window.clearTimeout(studioAutosaveTimer)
  return window.confirm('제목 없는 변경은 저장되지 않습니다. 이 화면을 나갈까요?')
}

function handleStudioBeforeUnload(event) {
  if (page.value !== 'writingStudio' || !studioDirty.value || flushStudioAutosave()) {
    return
  }
  event.preventDefault()
  event.returnValue = ''
}

async function postElevatorJson(url, body) {
  try {
    await fetchJson(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })
  } catch (error) {
    // Keep the UI usable even when the live simulator is down.
  }
}

async function unlockWorkManager() {
  if (!workManagerPassword.value.trim()) {
    workManagerError.value = '비밀번호를 입력해야 합니다.'
    return
  }

  isUnlockingWorkManager.value = true
  workManagerError.value = ''
  workManagerMessage.value = ''
  try {
    const response = await fetchJson('/api/work-manager/auth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        password: workManagerPassword.value
      })
    })
    const session = resolveWorkManagerAuthSession(response)
    if (!session) {
      throw new Error('인증 응답에 유효한 세션 만료 시각이 없습니다.')
    }
    workManagerToken.value = session.token
    workManagerTokenExpiresAt.value = session.expiresAt
    workManagerPassword.value = ''
    workManagerMessage.value = response.message || 'Command gate unlocked'
    await loadWorkBoardState()
  } catch (error) {
    workManagerError.value = error.message || '비밀번호 확인에 실패했습니다.'
  } finally {
    isUnlockingWorkManager.value = false
  }
}

async function saveWorkTicketMetadata() {
  if (!selectedWorkTicket.value?.id) {
    metadataError.value = '먼저 수정할 티켓을 선택해야 합니다.'
    return
  }

  if (!hasActiveWorkManagerSession()) {
    metadataError.value = '먼저 command gate 를 열어야 메타데이터를 저장할 수 있습니다.'
    return
  }

  isSavingMetadata.value = true
  metadataError.value = ''
  metadataMessage.value = ''
  try {
    const response = await fetchJson(`/api/work-manager/tickets/${selectedWorkTicket.value.id}/metadata`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Work-Manager-Token': workManagerToken.value
      },
      body: JSON.stringify({
        targetVersion: metadataTargetVersion.value,
        priority: metadataPriority.value,
        dependencies: metadataDependencies.value
      })
    })
    metadataMessage.value = response.message || '티켓 메타데이터를 저장했습니다.'
    if (response.board) {
      workBoardState.value = response.board
    } else {
      await loadWorkBoardState()
    }
  } catch (error) {
    if (handleWorkManagerAuthorizationError(error, 'metadata')) {
      return
    }
    metadataError.value = error.message || '티켓 메타데이터 저장에 실패했습니다.'
  } finally {
    isSavingMetadata.value = false
  }
}

async function submitPresetCommand() {
  if (!selectedCommand.value) {
    workManagerError.value = '프리셋 액션을 선택해야 합니다.'
    return
  }

  if (!hasActiveWorkManagerSession()) {
    workManagerError.value = '먼저 command gate 를 열어야 합니다.'
    return
  }

  isRunningCommand.value = true
  workManagerError.value = ''
  workManagerMessage.value = ''
  try {
    const response = await fetchJson('/api/work-manager/commands', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Work-Manager-Token': workManagerToken.value
      },
      body: JSON.stringify({
        action: selectedCommand.value,
        note: commandNote.value,
        relatedTicketId: selectedWorkTicket.value?.id || ''
      })
    })
    workManagerMessage.value = response.message || 'Preset command was queued'
    commandNote.value = ''
    await loadWorkBoardState()
  } catch (error) {
    if (handleWorkManagerAuthorizationError(error, 'command')) {
      return
    }
    workManagerError.value = error.message || '명령 실행에 실패했습니다.'
  } finally {
    isRunningCommand.value = false
  }
}

function logoutWorkManager() {
  clearWorkManagerSession()
  workManagerMessage.value = 'Command gate 를 잠갔습니다.'
}

function hasActiveWorkManagerSession() {
  if (!workManagerToken.value) {
    return false
  }
  if (isExpiredWorkManagerSession(workManagerTokenExpiresAt.value)) {
    lockWorkManagerSession('Command gate 세션이 만료되었습니다. 다시 인증해 주세요.')
    return false
  }
  return true
}

function handleWorkManagerAuthorizationError(error, target) {
  if (error?.status !== 401) {
    return false
  }

  const message = 'Command gate 세션이 만료되었거나 유효하지 않습니다. 다시 인증해 주세요.'
  lockWorkManagerSession(message)
  if (target === 'metadata') {
    metadataError.value = message
  }
  return true
}

function lockWorkManagerSession(message) {
  clearWorkManagerSession()
  workManagerMessage.value = ''
  workManagerError.value = message
}

function clearWorkManagerSession() {
  workManagerToken.value = ''
  workManagerTokenExpiresAt.value = ''
  if (typeof window !== 'undefined') {
    window.clearTimeout(workManagerExpiryTimer)
    window.localStorage.removeItem(TOKEN_STORAGE_KEY)
    window.localStorage.removeItem(TOKEN_EXPIRY_STORAGE_KEY)
  }
}

function scheduleWorkManagerExpiration() {
  if (typeof window === 'undefined') {
    return
  }

  window.clearTimeout(workManagerExpiryTimer)
  if (!workManagerToken.value) {
    return
  }

  const expiresAtMs = Date.parse(workManagerTokenExpiresAt.value)
  const remainingMs = expiresAtMs - Date.now()
  if (!Number.isFinite(expiresAtMs) || remainingMs <= 0) {
    lockWorkManagerSession('Command gate 세션이 만료되었습니다. 다시 인증해 주세요.')
    return
  }

  workManagerExpiryTimer = window.setTimeout(() => {
    lockWorkManagerSession('Command gate 세션이 만료되었습니다. 다시 인증해 주세요.')
  }, remainingMs)
}

function countWorkTicketsByStatus(status) {
  return (
    workBoardColumns.value.find((column) => column.status === status)?.tickets.length || 0
  )
}

function selectWorkTicket(ticketId) {
  selectedWorkTicketId.value = ticketId
}

function toggleTheme() {
  theme.value = theme.value === 'dark' ? 'light' : 'dark'
}

function replaySplashFlap() {
  playSplashFlap()
  if (!isTestRoute.value && page.value === 'splash') {
    scheduleSplashTransition()
  }
}

function openPage(nextPage) {
  if (isStaticMode && STATIC_UNAVAILABLE_PAGES.has(nextPage)) {
    staticModeMessage.value = '정적 공개본에서는 사용할 수 없음'
    if (page.value !== 'junction') {
      page.value = 'junction'
      syncBrowserLocation()
    }
    return
  }
  staticModeMessage.value = ''
  if (page.value === 'writingStudio' && nextPage !== 'writingStudio' && !prepareStudioTransition()) {
    return
  }
  if (nextPage === 'blogPost' && !activeBlogSlug.value && publishedBlogPosts.value.length > 0) {
    activeBlogSlug.value = publishedBlogPosts.value[0].slug
  }
  if (nextPage === 'writingStudio' && !studioPostId.value) {
    createNewStudioPost(false)
  }
  if (isVersionedTestRoute.value) {
    page.value = normalizeVersionedTestView(nextPage)
  } else if (isLegacyTestRoute.value) {
    page.value = normalizeTestView(nextPage)
  } else {
    page.value = normalizeLivePage(nextPage)
  }
  syncBrowserLocation()
  if (page.value === 'elevator') {
    void activateElevatorPage()
  }
  window.requestAnimationFrame(() => {
    document.querySelector('.page-scroller')?.scrollTo({ top: 0, behavior: 'smooth' })
  })
}

function switchTestRouteMode(nextMode, nextPage = 'junction') {
  testRouteMode.value = nextMode
  page.value =
    nextMode === 'v050' ? normalizeVersionedTestView(nextPage) : normalizeTestView(nextPage)
  syncTestLocation()
  window.requestAnimationFrame(() => {
    document.querySelector('.page-scroller')?.scrollTo({ top: 0, behavior: 'smooth' })
  })
}

function scheduleSplashTransition() {
  window.clearTimeout(splashTimer)
  splashTimer = window.setTimeout(() => {
    clearSplashAnimationTimers()
    page.value = 'junction'
    syncLiveLocation({ replace: true })
  }, SPLASH_DURATION_MS)
}

function directionGlyph(direction) {
  if (direction === 'up') return '↑'
  if (direction === 'down') return '↓'
  return '·'
}

function startTicketDrag(ticketId) {
  dragTicketId.value = ticketId
}

function dropIntoReady() {
  if (!dragTicketId.value) {
    return
  }
  if (!readyTicketIds.value.includes(dragTicketId.value)) {
    readyTicketIds.value = [...readyTicketIds.value, dragTicketId.value]
    persistReadyTicketIds(readyTicketIds.value)
  }
  dragTicketId.value = ''
}

function dropIntoBacklog() {
  if (!dragTicketId.value) {
    return
  }
  readyTicketIds.value = readyTicketIds.value.filter((ticketId) => ticketId !== dragTicketId.value)
  persistReadyTicketIds(readyTicketIds.value)
  dragTicketId.value = ''
}

function createInitialTaxiState() {
  return {
    clock: { elapsedSeconds: 0 },
    sequence: 3,
    autoSpawnCounter: 0,
    zones: TAXI_ZONE_DEFINITIONS.map((zone) => ({ ...zone })),
    taxis: [
      createTaxiCab(1, 'center'),
      createTaxiCab(2, 'south'),
      createTaxiCab(3, 'west'),
      createTaxiCab(4, 'east')
    ],
    activeRequests: [
      createTaxiRequest({
        id: 'REQ-001',
        originId: 'north',
        destinationId: 'south',
        passengers: 2,
        createdTick: 0,
        source: 'seed'
      }),
      createTaxiRequest({
        id: 'REQ-002',
        originId: 'harbor',
        destinationId: 'east',
        passengers: 1,
        createdTick: 2,
        source: 'seed'
      })
    ],
    completedRequests: [],
    score: { reward: 48, penalty: 8 },
    eventLog: ['시드 호출 2건 적재', '야간 시뮬레이터 코어 준비 완료']
  }
}

function createTaxiCab(index, zoneId) {
  return {
    id: `Cab-${String(index).padStart(2, '0')}`,
    zoneId,
    targetZoneId: zoneId,
    status: 'idle',
    seats: 4,
    passengerCount: 0,
    assignedRequestId: '',
    route: [],
    progress: 0,
    stepDuration: 1,
    positionLabel: findTaxiZone(zoneId)?.name || zoneId
  }
}

function createTaxiRequest({
  id = createEntityId('REQ'),
  originId,
  destinationId,
  passengers,
  createdTick,
  source
}) {
  return {
    id,
    originId,
    destinationId,
    passengers,
    createdTick,
    source,
    status: 'pending',
    assignedTaxiId: '',
    pickedUpAt: 0
  }
}

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value))
}

function shouldSpawnAutoTaxiRequest(state) {
  state.autoSpawnCounter += 1
  return state.autoSpawnCounter % 4 === 0 && state.activeRequests.length < 7
}

function spawnTaxiRequest(state, options = {}) {
  const originId = options.originId || pickTaxiZoneId(state, [])
  const destinationId = options.destinationId || pickTaxiZoneId(state, [originId])
  const passengers = clamp(Number(options.passengers || (1 + (state.sequence % 4))), 1, 4)
  state.sequence += 1
  const request = createTaxiRequest({
    originId,
    destinationId,
    passengers,
    createdTick: state.clock.elapsedSeconds,
    source: options.source || 'auto'
  })
  state.activeRequests.push(request)
  state.eventLog.unshift(
    `${request.source === 'manual' ? '수동' : '자동'} 호출 · ${findTaxiZone(originId)?.name} -> ${findTaxiZone(destinationId)?.name} · ${passengers}명`
  )
  state.eventLog = state.eventLog.slice(0, 12)
  return request
}

function pickTaxiZoneId(state, excludedIds = []) {
  const excluded = new Set(excludedIds)
  const candidates = state.zones.filter((zone) => !excluded.has(zone.id))
  const sequence = state.sequence % candidates.length
  return candidates[sequence]?.id || state.zones[0].id
}

function findTaxiZone(zoneId) {
  return TAXI_ZONE_DEFINITIONS.find((zone) => zone.id === zoneId) || null
}

function createSeedBlogPosts() {
  return [
    {
      id: 'post-001',
      slug: 'elevator-loop-after-midnight',
      title: '엘리베이터 루프를 밤에 다시 본 이유',
      summary: '숫자로는 멀쩡했지만 체감 이동이 불안정했던 이유를 프런트 폴링과 서비스 tick 관점에서 다시 정리했다.',
      bodyMarkdown: `## 왜 다시 봤는가

엘리베이터는 **도착 여부** 만 맞아도 되는 기능이 아니었습니다.
기다리는 사람에게는 이동의 *감각* 도 계약이었습니다.

> 한 층씩 오르는 것처럼 보여야 안심이 됩니다.

- 서비스 tick 간격
- 프런트 poll cadence
- 보간이 빠졌을 때 생기는 warp 체감

\`\`\`text
goal: floor warp를 줄이고도 live loop를 유지한다
\`\`\``,
      status: 'published',
      tags: ['elevator', 'frontend', 'ux'],
      createdAt: '2026-06-20T09:00:00.000Z',
      updatedAt: '2026-06-26T11:00:00.000Z',
      publishedAt: '2026-06-26T11:00:00.000Z'
    },
    {
      id: 'post-002',
      slug: 'why-blog-district-needs-its-own-rhythm',
      title: 'Blog District가 시뮬레이터와 다른 리듬이어야 하는 이유',
      summary: '긴 글 읽기 화면은 상태 배지와 운영 패널보다 폭, 줄간격, 조용한 대비가 먼저여야 한다.',
      bodyMarkdown: `## 읽기 화면은 다른 종류의 집중을 요구한다

시뮬레이터는 **조작과 상태 읽기** 가 중심입니다.
블로그는 **긴 호흡의 읽기와 쓰기** 가 중심입니다.

### 그래서 달라진 점

- 허브 카드는 남기되 장식은 줄인다.
- 본문 폭은 680px~760px 안에서 제한한다.
- Writing Studio는 편집과 preview를 분리한다.`,
      status: 'published',
      tags: ['blog', 'design'],
      createdAt: '2026-06-24T12:00:00.000Z',
      updatedAt: '2026-06-26T13:20:00.000Z',
      publishedAt: '2026-06-26T13:20:00.000Z'
    },
    {
      id: 'post-003',
      slug: 'draft-city-signal-notes',
      title: '도시 신호실 메모',
      summary: '아직 공개하지 않은 초안. 운영 레일과 공개 레일을 어떻게 분리할지 정리하는 중이다.',
      bodyMarkdown: `## Draft notes

아직 공개 전인 메모입니다.

- 공개 글은 archive에만 노출
- draft는 studio에서만 노출
- archived는 삭제가 아니라 보관`,
      status: 'draft',
      tags: ['draft', 'ops'],
      createdAt: '2026-06-26T15:00:00.000Z',
      updatedAt: '2026-06-26T18:10:00.000Z',
      publishedAt: ''
    }
  ]
}

function createEmptyStudioState() {
  const nowIso = new Date().toISOString()
  return {
    id: createEntityId('post'),
    title: '',
    slug: '',
    summary: '',
    bodyMarkdown: '## 새 글\n\n여기에서 본문을 시작합니다.',
    status: 'draft',
    slugLocked: false,
    tags: '',
    tables: [],
    createdAt: nowIso,
    updatedAt: nowIso,
    publishedAt: ''
  }
}

function createEntityId(prefix) {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return `${prefix}-${globalThis.crypto.randomUUID()}`
  }
  if (typeof globalThis.crypto?.getRandomValues === 'function') {
    const randomValues = globalThis.crypto.getRandomValues(new Uint32Array(2))
    return `${prefix}-${Array.from(randomValues, (value) => value.toString(36)).join('-')}`
  }
  fallbackEntityIdCounter += 1
  return `${prefix}-${Date.now().toString(36)}-${fallbackEntityIdCounter.toString(36)}`
}

function isBlogSeriesTag(tag) {
  return /^series\s*:\s*.+/i.test(String(tag || ''))
}

function visibleBlogTags(tags) {
  return (Array.isArray(tags) ? tags : []).filter((tag) => !isBlogSeriesTag(tag))
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9가-힣\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function ensureUniqueSlug(candidate, currentId) {
  const base = slugify(candidate) || `post-${Date.now()}`
  let next = base
  let index = 1
  while (blogPosts.value.some((post) => post.slug === next && post.id !== currentId)) {
    index += 1
    next = `${base}-${index}`
  }
  return next
}

function renderMarkdownToHtml(markdown, tables = []) {
  const lines = escapeHtml(String(markdown || '')).replace(/\r\n/g, '\n').split('\n')
  const html = []
  const studioTables = new Map(normalizeStudioTables(tables).map((table) => [table.id, table]))
  let inCode = false

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]
    if (line.startsWith('```')) {
      html.push(inCode ? '</code></pre>' : '<pre class="post-code"><code>')
      inCode = !inCode
      continue
    }

    if (inCode) {
      html.push(`${line}\n`)
      continue
    }

    if (!line.trim()) {
      continue
    }

    const studioTable = studioTables.get(parseStudioTableMarker(line))
    if (studioTable) {
      html.push(renderStudioTable(studioTable))
      continue
    }

    const listItem = parseMarkdownListItem(line)
    if (listItem) {
      const renderedList = renderMarkdownList(lines, index, listItem.indent, listItem.type)
      html.push(renderedList.html)
      index = renderedList.nextIndex - 1
      continue
    }

    if (line.startsWith('### ')) {
      html.push(`<h3>${inlineMarkdown(line.slice(4))}</h3>`)
      continue
    }

    if (line.startsWith('## ')) {
      html.push(`<h2>${inlineMarkdown(line.slice(3))}</h2>`)
      continue
    }

    if (line.startsWith('# ')) {
      html.push(`<h1>${inlineMarkdown(line.slice(2))}</h1>`)
      continue
    }

    if (line.startsWith('> ')) {
      const quoteLines = [line.slice(2)]
      while (lines[index + 1]?.startsWith('> ')) {
        index += 1
        quoteLines.push(lines[index].slice(2))
      }
      html.push(`<blockquote>${inlineMarkdown(quoteLines.join(' '))}</blockquote>`)
      continue
    }

    const paragraphLines = [line.trim()]
    while (lines[index + 1]?.trim() && !isMarkdownBlockStart(lines[index + 1])) {
      index += 1
      paragraphLines.push(lines[index].trim())
    }
    html.push(`<p>${inlineMarkdown(paragraphLines.join(' '))}</p>`)
  }
  if (inCode) {
    html.push('</code></pre>')
  }

  return html.join('')
}

function parseMarkdownListItem(line) {
  const match = line.replace(/\t/g, '    ').match(/^(\s*)([-+*]|\d+\.)\s+(.+)$/)
  if (!match) {
    return null
  }
  return {
    indent: match[1].length,
    type: /\d+\./.test(match[2]) ? 'ol' : 'ul',
    content: match[3]
  }
}

function renderMarkdownList(lines, startIndex, baseIndent, listType) {
  const html = [`<${listType}>`]
  let index = startIndex

  while (index < lines.length) {
    const item = parseMarkdownListItem(lines[index])
    if (!item || item.indent !== baseIndent || item.type !== listType) {
      break
    }

    html.push(`<li>${inlineMarkdown(item.content)}`)
    index += 1

    while (index < lines.length) {
      const child = parseMarkdownListItem(lines[index])
      if (!child || child.indent <= baseIndent) {
        break
      }
      const renderedChild = renderMarkdownList(lines, index, child.indent, child.type)
      html.push(renderedChild.html)
      index = renderedChild.nextIndex
    }

    html.push('</li>')
  }

  html.push(`</${listType}>`)
  return { html: html.join(''), nextIndex: index }
}

function isMarkdownBlockStart(line) {
  return (
    line.startsWith('```') ||
    /^(#{1,3})\s/.test(line) ||
    line.startsWith('> ') ||
    Boolean(parseMarkdownListItem(line)) ||
    Boolean(parseStudioTableMarker(line))
  )
}

function normalizeStudioTables(tables) {
  if (!Array.isArray(tables)) {
    return []
  }
  return tables
    .filter((table) => table && /^[a-z0-9-]+$/i.test(String(table.id || '')))
    .map((table, tableIndex) => {
      const headers = Array.isArray(table.headers) && table.headers.length > 0
        ? table.headers.map((value, columnIndex) => String(value || `열 ${columnIndex + 1}`))
        : ['열 1']
      const rows = Array.isArray(table.rows) && table.rows.length > 0
        ? table.rows.map((row) => headers.map((_, columnIndex) => String(row?.[columnIndex] || '')))
        : [headers.map(() => '')]
      return {
        id: String(table.id),
        caption: String(table.caption || `표 ${tableIndex + 1}`),
        headers,
        rows
      }
    })
}

function parseStudioTableMarker(line) {
  return String(line || '').trim().match(/^\[\[studio-table:([a-z0-9-]+)\]\]$/i)?.[1] || ''
}

function renderStudioTable(table) {
  const caption = inlineMarkdown(escapeHtml(table.caption))
  const head = table.headers
    .map((cell) => `<th scope="col">${inlineMarkdown(escapeHtml(cell))}</th>`)
    .join('')
  const body = table.rows
    .map((row) => `<tr>${row.map((cell) => `<td>${inlineMarkdown(escapeHtml(cell))}</td>`).join('')}</tr>`)
    .join('')
  return `<figure class="studio-table"><figcaption>${caption}</figcaption><div class="studio-table-scroll"><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div></figure>`
}

function inlineMarkdown(text) {
  const protectedTokens = []
  const protect = (value) => {
    const token = `\u0000${protectedTokens.length}\u0000`
    protectedTokens.push(value)
    return token
  }

  let rendered = String(text || '').replace(/`([^`\n]+)`/g, (_, code) => protect(`<code>${code}</code>`))

  rendered = rendered.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (_, alt, url) => {
    const safeUrl = allowedMarkdownImageUrl(url)
    if (!safeUrl) {
      return alt
    }
    const safeAlt = alt.replace(/[*_`]/g, '')
    return protect(`<img src="${safeUrl}" alt="${safeAlt}" loading="lazy">`)
  })

  rendered = rendered.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label, url) => {
    const safeUrl = allowedMarkdownUrl(url, ['http:', 'https:', 'mailto:'])
    if (!safeUrl) {
      return label
    }
    return protect(`<a href="${safeUrl}" rel="noopener noreferrer">${formatInlineMarkdown(label)}</a>`)
  })

  rendered = formatInlineMarkdown(rendered)
  return rendered.replace(/\u0000(\d+)\u0000/g, (_, index) => protectedTokens[Number(index)] || '')
}

function formatInlineMarkdown(text) {
  return text
    .replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>')
}

function allowedMarkdownUrl(value, allowedProtocols) {
  const candidate = String(value || '').trim()
  try {
    const parsed = new URL(candidate)
    return allowedProtocols.includes(parsed.protocol) ? candidate : ''
  } catch (error) {
    return ''
  }
}

function allowedMarkdownImageUrl(value) {
  const candidate = String(value || '').trim()
  if (
    candidate.length <= 2_100_000 &&
    /^data:image\/(?:png|jpeg|gif|webp|avif);base64,[a-z0-9+/]+={0,2}$/i.test(candidate)
  ) {
    return candidate
  }
  return allowedMarkdownUrl(candidate, ['http:', 'https:'])
}

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function countWords(text) {
  return String(text || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length
}

function formatSignedValue(value) {
  const numeric = Number(value || 0)
  return `${numeric >= 0 ? '+' : ''}${numeric}`
}

function formatTaxiEvent(entry) {
  return String(entry || '')
    .replaceAll('reward', '보상')
    .replaceAll('penalty', '패널티')
    .replaceAll(' -> ', ' → ')
}

function taxiStatusLabel(status) {
  return {
    idle: '대기',
    pending: '배차 대기',
    assigned: '배차됨',
    pickup: '승객에게 이동',
    dropoff: '목적지로 이동'
  }[status] || status
}

function formatDate(value) {
  if (!value) {
    return '없음'
  }
  try {
    return new Date(value).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  } catch (error) {
    return value
  }
}

function formatBlogDate(value) {
  if (!value) {
    return '날짜 미정'
  }
  try {
    return new Date(value).toLocaleDateString('ko-KR', {
      month: 'long',
      day: 'numeric'
    })
  } catch (error) {
    return value
  }
}

function formatBlogLongDate(value) {
  if (!value) {
    return '날짜 미정'
  }
  try {
    return new Date(value).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  } catch (error) {
    return value
  }
}

function blogCategory(post) {
  return visibleBlogTags(post?.tags)[0] || '기록'
}

function readElevatorTickerDefault() {
  return typeof window === 'undefined' || window.innerWidth > 760
}

function formatTimestamp(value) {
  if (!value) {
    return ''
  }
  try {
    return new Date(value).toLocaleString('ko-KR', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch (error) {
    return value
  }
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options)
  const text = await response.text()
  let data = {}
  try {
    data = text ? JSON.parse(text) : {}
  } catch (error) {
    data = {}
  }
  if (!response.ok) {
    const requestError = new Error(data.message || data.error || response.statusText || 'Request failed')
    requestError.status = response.status
    throw requestError
  }
  return data
}

function readInitialTheme() {
  if (typeof window === 'undefined') {
    return 'dark'
  }

  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
    if (stored === 'light' || stored === 'dark') {
      return stored
    }
  } catch (error) {
    return 'dark'
  }

  return 'dark'
}

function readIsTestRoute() {
  return typeof window !== 'undefined' && window.location.pathname.startsWith(TEST_ROUTE_PATH)
}

function readTestRouteMode() {
  if (typeof window === 'undefined') {
    return 'live'
  }

  if (window.location.pathname.startsWith(VERSIONED_TEST_ROUTE_PATH)) {
    return 'v050'
  }

  if (window.location.pathname.startsWith(TEST_ROUTE_PATH)) {
    return 'v040'
  }

  return 'live'
}

function readInitialPage() {
  if (typeof window === 'undefined') {
    return 'splash'
  }
  const mode = readTestRouteMode()
  if (mode === 'live') {
    const route = readLiveRoute(window.location.pathname, APP_BASE_PATH)
    if (route && isStaticMode && STATIC_UNAVAILABLE_PAGES.has(route.page)) {
      return 'junction'
    }
    return route?.page || 'splash'
  }
  if (mode === 'v050') {
    return normalizeVersionedTestView(readVersionedTestViewParam())
  }
  return normalizeTestView(readTestViewParam())
}

function readInitialBlogSlug() {
  if (typeof window === 'undefined' || readTestRouteMode() !== 'live') {
    return ''
  }
  return readLiveRoute(window.location.pathname, APP_BASE_PATH)?.slug || ''
}

function readTestViewParam() {
  if (typeof window === 'undefined') {
    return 'junction'
  }
  return new URLSearchParams(window.location.search).get('view') || 'junction'
}

function normalizeTestView(view) {
  return TESTABLE_PAGES.includes(view) ? view : 'junction'
}

function readVersionedTestViewParam() {
  if (typeof window === 'undefined') {
    return 'junction'
  }

  const parts = stripBasePath(window.location.pathname, APP_BASE_PATH).split('/').filter(Boolean)
  return parts[2] || 'junction'
}

function normalizeVersionedTestView(view) {
  return VERSIONED_TESTABLE_PAGES.includes(view) ? view : 'junction'
}

function normalizeLivePage(view) {
  return LIVE_PAGES.includes(view) ? view : 'junction'
}

function syncTestLocation() {
  if (!isTestRoute.value || typeof window === 'undefined') {
    return
  }

  const nextUrl = new URL(window.location.href)

  if (isVersionedTestRoute.value) {
    nextUrl.pathname = `${VERSIONED_TEST_ROUTE_PATH}/${normalizeVersionedTestView(page.value)}`
    nextUrl.search = ''
  } else {
    nextUrl.pathname = TEST_ROUTE_PATH
    nextUrl.searchParams.set('view', normalizeTestView(page.value))
  }

  window.history.replaceState({}, '', `${nextUrl.pathname}${nextUrl.search}`)
}

function syncBrowserLocation(options = {}) {
  if (isTestRoute.value) {
    syncTestLocation()
    return
  }
  syncLiveLocation(options)
}

function syncLiveLocation({ replace = false } = {}) {
  if (typeof window === 'undefined' || isTestRoute.value) {
    return
  }

  const nextUrl = new URL(window.location.href)
  nextUrl.pathname = buildLivePath(page.value, activeBlogSlug.value, APP_BASE_PATH)
  nextUrl.search = ''
  nextUrl.hash = ''

  const nextPath = `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`
  const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`
  const state = { page: page.value, blogSlug: activeBlogSlug.value }
  if (replace || nextPath === currentPath) {
    window.history.replaceState(state, '', nextPath)
  } else {
    window.history.pushState(state, '', nextPath)
  }
}

function handleLocationPopState(event) {
  const nextMode = readTestRouteMode()
  if (page.value === 'writingStudio' && nextMode === 'live' && !prepareStudioTransition()) {
    syncLiveLocation()
    return
  }

  window.clearTimeout(splashTimer)
  clearSplashAnimationTimers()
  testRouteMode.value = nextMode

  if (nextMode === 'v050') {
    page.value = normalizeVersionedTestView(readVersionedTestViewParam())
  } else if (nextMode === 'v040') {
    page.value = normalizeTestView(readTestViewParam())
  } else {
    const liveRoute = readLiveRoute(window.location.pathname, APP_BASE_PATH)
    if (liveRoute) {
      activeBlogSlug.value = liveRoute.slug
      page.value = isStaticMode && STATIC_UNAVAILABLE_PAGES.has(liveRoute.page)
        ? 'junction'
        : liveRoute.page
    } else {
      const statePage = normalizeLivePage(event.state?.page)
      page.value = statePage === 'blogArchive' || statePage === 'blogPost' ? 'junction' : statePage
      if (page.value === 'blogPost') {
        activeBlogSlug.value = event.state?.blogSlug || ''
      }
    }
  }

  if (page.value === 'elevator') {
    void activateElevatorPage()
  }
  window.requestAnimationFrame(() => {
    document.querySelector('.page-scroller')?.scrollTo({ top: 0 })
  })
}

function readReadyTicketIds() {
  if (typeof window === 'undefined') {
    return []
  }
  try {
    const raw = window.localStorage.getItem(BOARD_READY_STORAGE_KEY)
    const parsed = JSON.parse(raw || '[]')
    return Array.isArray(parsed) ? parsed.filter((value) => typeof value === 'string') : []
  } catch (error) {
    return []
  }
}

function persistReadyTicketIds(ticketIds) {
  if (typeof window === 'undefined') {
    return
  }
  try {
    window.localStorage.setItem(BOARD_READY_STORAGE_KEY, JSON.stringify(ticketIds))
  } catch (error) {
    // 조회 화면의 임시 Ready 상태 저장 실패는 정적 화면을 막지 않는다.
  }
}

function readStoredWorkManagerSession() {
  if (typeof window === 'undefined') {
    return { token: '', expiresAt: '', expired: false }
  }

  try {
    const token = window.localStorage.getItem(TOKEN_STORAGE_KEY) || ''
    const expiresAt = window.localStorage.getItem(TOKEN_EXPIRY_STORAGE_KEY) || ''
    if (token && !isExpiredWorkManagerSession(expiresAt)) {
      return { token, expiresAt, expired: false }
    }

    window.localStorage.removeItem(TOKEN_STORAGE_KEY)
    window.localStorage.removeItem(TOKEN_EXPIRY_STORAGE_KEY)
    return { token: '', expiresAt: '', expired: Boolean(token) }
  } catch (error) {
    return { token: '', expiresAt: '', expired: false }
  }
}

function persistWorkManagerSession(token, expiresAt) {
  if (typeof window === 'undefined') {
    return
  }

  try {
    if (token && !isExpiredWorkManagerSession(expiresAt)) {
      window.localStorage.setItem(TOKEN_STORAGE_KEY, token)
      window.localStorage.setItem(TOKEN_EXPIRY_STORAGE_KEY, expiresAt)
      return
    }

    window.localStorage.removeItem(TOKEN_STORAGE_KEY)
    window.localStorage.removeItem(TOKEN_EXPIRY_STORAGE_KEY)
  } catch (error) {
    // 정적 공개본에서는 저장소가 막혀도 여행·글쓰기 읽기를 유지한다.
  }
}

function resolveWorkManagerAuthSession(response) {
  const token = response?.token || ''
  const directExpiresAt = response?.expiresAt || ''
  const directExpiresAtMs = Date.parse(directExpiresAt)
  if (token && Number.isFinite(directExpiresAtMs) && directExpiresAtMs > Date.now()) {
    return { token, expiresAt: new Date(directExpiresAtMs).toISOString() }
  }

  const ttlMinutes = Number(response?.sessionTtlMinutes)
  if (token && Number.isFinite(ttlMinutes) && ttlMinutes > 0) {
    return {
      token,
      expiresAt: new Date(Date.now() + ttlMinutes * 60 * 1000).toISOString()
    }
  }
  return null
}

function isExpiredWorkManagerSession(expiresAt) {
  const expiresAtMs = Date.parse(expiresAt)
  return !Number.isFinite(expiresAtMs) || expiresAtMs <= Date.now()
}

function readStoredBlogPosts() {
  if (typeof window === 'undefined') {
    return createSeedBlogPosts()
  }
  try {
    const raw = window.localStorage.getItem(BLOG_POST_STORAGE_KEY)
    if (!raw) {
      return createSeedBlogPosts()
    }
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : createSeedBlogPosts()
  } catch (error) {
    return createSeedBlogPosts()
  }
}

function persistBlogPosts(posts) {
  if (typeof window === 'undefined') {
    return true
  }
  return safeWriteJson(window.localStorage, BLOG_POST_STORAGE_KEY, posts)
}

function readStoredBlogSlug() {
  if (typeof window === 'undefined') {
    return ''
  }
  try {
    return window.localStorage.getItem(BLOG_ACTIVE_SLUG_STORAGE_KEY) || ''
  } catch (error) {
    return ''
  }
}

function persistBlogSlug(slug) {
  if (typeof window === 'undefined') {
    return true
  }
  try {
    if (slug) {
      window.localStorage.setItem(BLOG_ACTIVE_SLUG_STORAGE_KEY, slug)
      return true
    }
    window.localStorage.removeItem(BLOG_ACTIVE_SLUG_STORAGE_KEY)
    return true
  } catch (error) {
    return false
  }
}

function readStoredStudioViewMode() {
  if (typeof window === 'undefined') {
    return 'edit'
  }
  try {
    return window.localStorage.getItem(BLOG_STUDIO_VIEW_STORAGE_KEY) === 'preview' ? 'preview' : 'edit'
  } catch (error) {
    return 'edit'
  }
}

function persistStudioViewMode(mode) {
  if (typeof window === 'undefined') {
    return true
  }
  try {
    window.localStorage.setItem(BLOG_STUDIO_VIEW_STORAGE_KEY, mode)
    return true
  } catch (error) {
    return false
  }
}

function readStoredStudioPostId() {
  if (typeof window === 'undefined') {
    return ''
  }
  try {
    return window.localStorage.getItem(BLOG_STUDIO_POST_STORAGE_KEY) || ''
  } catch (error) {
    return ''
  }
}

function persistStudioPostId(postId) {
  if (typeof window === 'undefined') {
    return true
  }
  try {
    if (postId) {
      window.localStorage.setItem(BLOG_STUDIO_POST_STORAGE_KEY, postId)
      return true
    }
    window.localStorage.removeItem(BLOG_STUDIO_POST_STORAGE_KEY)
    return true
  } catch (error) {
    return false
  }
}
</script>

<template>
  <div class="app-shell" :data-theme="theme">
    <transition name="fade" mode="out-in">
      <section v-if="page === 'splash'" class="splash-stage">
        <div class="splash-panel">
          <div class="splash-top">
            <SiteLoopSymbol size="large" />
            <div>
              <h1>workaround.co.kr</h1>
              <p class="splash-copy">곧 문이 열립니다</p>
            </div>
          </div>

          <div class="flap-board" :class="{ 'reduced-motion': prefersReducedMotion }">
            <div class="flap-row splash-flap-row">
              <div class="flap-values" role="img" :aria-label="currentSplashPhrase">
                <span
                  v-for="cell in splashBoardCells"
                  :key="cell.key"
                  class="flap-cell line-w"
                  :class="{ run: cell.isRunning && !prefersReducedMotion, settle: cell.isSettling }"
                  :style="{ '--flap-duration': cell.durationMs }"
                  aria-hidden="true"
                >
                  <span class="flap-half flap-static flap-top"><b>{{ cell.topStatic }}</b></span>
                  <span class="flap-half flap-static flap-bottom"><b>{{ cell.bottomStatic }}</b></span>
                  <span class="flap-half flap-dynamic flap-top-flip"><b>{{ cell.topFlip }}</b></span>
                  <span class="flap-half flap-dynamic flap-bottom-flip"><b>{{ cell.bottomFlip }}</b></span>
                </span>
              </div>
            </div>
          </div>

          <div class="ticker-strip" aria-live="polite">
            <span class="ticker-label">알림</span>
            <span class="ticker-copy">{{ currentTicker }}</span>
          </div>
        </div>

        <div class="splash-actions">
          <p>10초 후 자동 전환</p>
          <button type="button" class="ghost-button" @click="replaySplashFlap">다시 재생</button>
        </div>
      </section>

      <main v-else class="portal-stage" :class="{ 'writing-stage': page === 'writingStudio' }">
        <header class="station-topbar" :class="topbarLineClass">
          <SiteLoopSymbol v-if="page === 'junction'" />
          <span v-else class="roundel" :class="topbarLineClass">{{ topbarLetter }}</span>
          <h2>{{ page === 'writingStudio' ? '글쓰기' : currentRoute.title }}</h2>
          <div class="topbar-actions">
            <button
              v-if="page !== 'junction'"
              type="button"
              class="ghost-button"
              @click="openPage('junction')"
            >
              환승 홀
            </button>
            <button type="button" class="ghost-button" @click="toggleTheme" :aria-label="theme === 'dark' ? '라이트 모드' : '다크 모드'">
              {{ theme === 'dark' ? '☀' : '☾' }}
            </button>
          </div>
        </header>


        <div class="page-scroller">
          <section v-if="isTestRoute" class="test-route-banner">
            <div class="section-head">
              <div>
                <p class="eyebrow">QA Route</p>
                <h3>{{ isVersionedTestRoute ? 'v0.5.0 프로토타입 레일' : '테스트 전용 진입점' }}</h3>
              </div>
              <span>
                {{
                  isVersionedTestRoute
                    ? '`/test/v0-5-0` 는 신규 UI/UX 가상 레일이고, 실제 사용자 흐름은 `/` 에서 계속 API와 연결됩니다.'
                    : '`/test` 는 검수용 더미 경로이고, 실제 사용자 흐름은 `/` 에서 계속 API와 연결됩니다.'
                }}
              </span>
            </div>

            <div class="test-route-grid">
              <article class="test-route-card">
                <strong>현재 테스트 레일</strong>
                <p>{{ isVersionedTestRoute ? 'UI-v0.5.0 prototype' : testView }}</p>
                <small>URL `{{ currentTestUrl }}`</small>
              </article>

              <article class="test-route-card">
                <strong>빠른 이동</strong>
                <div class="test-route-actions">
                  <template v-if="isVersionedTestRoute">
                    <button type="button" class="ghost-button" @click="openPage('junction')">허브</button>
                    <button type="button" class="ghost-button" @click="openPage('taxi')">Taxi</button>
                    <button type="button" class="ghost-button" @click="openPage('ops')">Ops</button>
                    <button type="button" class="ghost-button" @click="openPage('signals')">Signals</button>
                  </template>
                  <template v-else>
                    <button type="button" class="ghost-button" @click="openPage('junction')">허브</button>
                    <button type="button" class="ghost-button" @click="openPage('elevator')">Elevator</button>
                    <button type="button" class="ghost-button" @click="openPage('work')">Work</button>
                    <button type="button" class="ghost-button" @click="openPage('runtime')">Runtime</button>
                  </template>
                </div>
              </article>

              <article class="test-route-card">
                <strong>레일 전환</strong>
                <div class="test-route-actions">
                  <button type="button" class="ghost-button" @click="switchTestRouteMode('v040', 'junction')">기존 /test</button>
                  <button type="button" class="ghost-button" @click="switchTestRouteMode('v050', 'junction')">/test/v0-5-0</button>
                </div>
              </article>
            </div>

            <ul class="check-list">
              <li v-for="item in activeTestCheckpoints" :key="item">{{ item }}</li>
            </ul>
          </section>

          <template v-if="isVersionedTestRoute">
            <section v-if="page === 'junction'" class="junction-shell prototype-shell">
              <section class="hero-panel prototype-hero">
                <div>
                  <p class="eyebrow">UI-v0.5.0 Junction</p>
                  <h3>메인 허브는 계속 라우터로 남기고, 새 시뮬레이터는 별도 승강장으로 확장합니다.</h3>
                  <p>
                    이 레일은 `v0.4.0` 실사용 포털을 덮지 않는 가상 화면입니다. 서울 지하철 환승 감각을 유지한 채
                    `Taxi District`, `Crew Board`, `Signal Room` 을 분리해 오케스트레이터가 티켓 단위로 나누기 쉽게
                    정리합니다.
                  </p>
                </div>

                <div class="hero-metrics">
                  <article v-for="metric in v050HeroMetrics" :key="metric.label">
                    <span>{{ metric.label }}</span>
                    <strong>{{ metric.value }}</strong>
                  </article>
                </div>
              </section>

              <section class="section-block">
                <div class="section-head">
                  <div>
                    <p class="eyebrow">Prototype Lines</p>
                    <h3>v0.5.0 승강장 분기</h3>
                  </div>
                  <span>기존 `/test?view=...` 와 섞지 않고 `/test/v0-5-0/...` 아래에서만 검토합니다.</span>
                </div>

                <div class="line-grid">
                  <article
                    v-for="card in v050RouteCards"
                    :key="card.key"
                    class="line-card prototype-card"
                    :class="card.accent"
                  >
                    <div class="line-card-top">
                      <div class="line-mark">
                        <span class="line-round">{{ card.lineNo }}</span>
                        <div>
                          <strong>{{ card.lineCode }}</strong>
                          <p>{{ card.name }}</p>
                        </div>
                      </div>
                      <span class="status-chip">{{ card.status }}</span>
                    </div>

                    <div class="line-copy">
                      <h4>{{ card.summary }}</h4>
                      <p>{{ card.detail }}</p>
                    </div>

                    <div class="line-ticket-row">
                      <span v-for="ticket in card.tickets" :key="ticket" class="ticket-tag">{{ ticket }}</span>
                    </div>

                    <button type="button" class="line-cta" @click="openPage(card.page)">
                      {{ card.cta }}
                    </button>
                  </article>
                </div>
              </section>

              <section class="section-block split-layout">
                <article class="surface-panel">
                  <div class="section-head">
                    <div>
                      <p class="eyebrow">UX Pivot</p>
                      <h3>이번 버전에서 바꾸는 점</h3>
                    </div>
                  </div>

                  <div class="prototype-rule-list">
                    <article v-for="rule in v050ExperienceRules" :key="rule.title" class="prototype-rule-card">
                      <strong>{{ rule.title }}</strong>
                      <p>{{ rule.body }}</p>
                    </article>
                  </div>
                </article>

                <article class="surface-panel">
                  <div class="section-head">
                    <div>
                      <p class="eyebrow">Mobile Route</p>
                      <h3>모바일 재배치 순서</h3>
                    </div>
                  </div>

                  <div class="mobile-stack-preview">
                    <div class="mobile-card">1. 허브 카드</div>
                    <div class="mobile-card">2. 구역 지도</div>
                    <div class="mobile-card">3. 운행 카드</div>
                  </div>

                  <ul class="check-list">
                    <li v-for="item in v050MobileFlow" :key="item">{{ item }}</li>
                  </ul>
                </article>
              </section>
            </section>

            <section v-else-if="page === 'taxi'" class="feature-shell prototype-shell">
              <StationHeader
                line-class="line-t"
                station-code="T01"
                title="가상 도시 수요 보드"
                title-en="TAXI DISTRICT LAB"
                prev-label="← 가상 레일"
                status="가상 레일 프로토"
                status-tone="warn"
                summary="9구역 · 수요 보드 목업"
                @exit="openPage('junction')"
              />
              <section class="station-lead">
                <p>`v0.5.0` 택시 시뮬레이터는 표만 많은 화면이 아니라, 구역과 요청과 차량의 관계가 먼저 보이는 승강장이어야 합니다. 지도 감각, 리워드, 차량 재배치 비용을 한 레일에서 같이 읽습니다.</p>
                <div class="banner-stats">
                <article>
                <span>districts</span>
                <strong>{{ taxiDistricts.length }}</strong>
                </article>
                <article>
                <span>active fleet</span>
                <strong>{{ taxiFleetCards.length }}</strong>
                </article>
                <article>
                <span>reward rail</span>
                <strong>live mock</strong>
                </article>
                </div>
              </section>

              <section class="section-block split-layout">
                <article class="surface-panel">
                  <div class="section-head">
                    <div>
                      <p class="eyebrow">District Mesh</p>
                      <h3>구역별 수요 지도</h3>
                    </div>
                    <span>서울 실지도를 그대로 쓰지 않고, 지하철식 구역 메쉬로 수요 흐름을 읽습니다.</span>
                  </div>

                  <div class="district-grid">
                    <article
                      v-for="district in taxiDistricts"
                      :key="district.name"
                      class="district-card"
                      :class="district.accent"
                    >
                      <div class="district-top">
                        <strong>{{ district.name }}</strong>
                        <span>{{ district.requests }} req</span>
                      </div>
                      <p>{{ district.demand }}</p>
                      <small>fleet {{ district.fleet }} · avg ETA {{ district.eta }}</small>
                    </article>
                  </div>
                </article>

                <article class="surface-panel">
                  <div class="section-head">
                    <div>
                      <p class="eyebrow">Reward Ledger</p>
                      <h3>점수와 비용</h3>
                    </div>
                  </div>

                  <div class="reward-grid">
                    <article v-for="item in taxiRewardCards" :key="item.label" class="reward-card">
                      <span>{{ item.label }}</span>
                      <strong>{{ item.value }}</strong>
                      <p>{{ item.body }}</p>
                    </article>
                  </div>
                </article>
              </section>

              <section class="section-block">
                <div class="section-head">
                  <div>
                    <p class="eyebrow">Fleet Strip</p>
                    <h3>차량 상태 카드</h3>
                  </div>
                </div>

                <div class="fleet-grid">
                  <article v-for="cab in taxiFleetCards" :key="cab.id" class="fleet-card" :class="cab.accent">
                    <div class="fleet-top">
                      <strong>{{ cab.id }}</strong>
                      <span>{{ cab.state }}</span>
                    </div>
                    <p>{{ cab.zone }}</p>
                    <small>{{ cab.passengers }} passengers · ETA {{ cab.eta }}</small>
                    <strong class="fleet-reward">{{ cab.reward }}</strong>
                  </article>
                </div>
              </section>

              <section class="section-block">
                <div class="section-head">
                  <div>
                    <p class="eyebrow">Flow Rail</p>
                    <h3>요청에서 리워드까지</h3>
                  </div>
                </div>

                <div class="prototype-rule-list">
                  <article v-for="item in taxiFlowCards" :key="item.title" class="prototype-rule-card">
                    <strong>{{ item.title }}</strong>
                    <p>{{ item.body }}</p>
                  </article>
                </div>
              </section>
            </section>

            <section v-else-if="page === 'ops'" class="feature-shell prototype-shell">
              <StationHeader
                line-class="line-w"
                station-code="W02"
                title="worker 가시화 확장"
                title-en="CREW BOARD"
                prev-label="← 가상 레일"
                status="가상 레일 프로토"
                status-tone="warn"
                summary="v0.5.0 · design first"
                @exit="openPage('junction')"
              />
              <section class="station-lead">
                <p>`v0.4.0` Work Manager 가 상태와 command gate 를 복구했다면, `v0.5.0` 은 누가 어떤 티켓을 집었는지와 우선순위가 실제 반응으로 어떻게 이어지는지를 보이게 해야 합니다.</p>
                <div class="banner-stats">
                <article>
                <span>visible crews</span>
                <strong>{{ opsCrewCards.length }}</strong>
                </article>
                <article>
                <span>focus version</span>
                <strong>v0.5.0</strong>
                </article>
                <article>
                <span>handoff</span>
                <strong>design first</strong>
                </article>
                </div>
              </section>

              <section class="section-block split-layout">
                <article class="surface-panel">
                  <div class="section-head">
                    <div>
                      <p class="eyebrow">Crew Visibility</p>
                      <h3>담당자 카드</h3>
                    </div>
                  </div>

                  <div class="crew-grid">
                    <article v-for="crew in opsCrewCards" :key="crew.worker" class="crew-card" :class="crew.accent">
                      <div class="fleet-top">
                        <strong>{{ crew.worker }}</strong>
                        <span>{{ crew.lane }}</span>
                      </div>
                      <p>{{ crew.focus }}</p>
                      <small>{{ crew.note }}</small>
                    </article>
                  </div>
                </article>

                <article class="surface-panel">
                  <div class="section-head">
                    <div>
                      <p class="eyebrow">Transition Logic</p>
                      <h3>운영 반응 규칙</h3>
                    </div>
                  </div>

                  <div class="prototype-rule-list">
                    <article v-for="item in opsTransitionCards" :key="item.title" class="prototype-rule-card">
                      <strong>{{ item.title }}</strong>
                      <p>{{ item.body }}</p>
                    </article>
                  </div>
                </article>
              </section>
            </section>

            <section v-else class="feature-shell prototype-shell">
              <StationHeader
                line-class="line-r"
                station-code="R02"
                title="실사용 레일과 가상 레일의 분리"
                title-en="SIGNAL ROOM"
                prev-label="← 가상 레일"
                status="가상 레일 프로토"
                status-tone="warn"
                summary="live / · legacy /test · proto /test/v0-5-0"
                @exit="openPage('junction')"
              />
              <section class="station-lead">
                <p>이번 버전의 핵심은 새 디자인을 빠르게 보되, 기존 실사용 경로를 절대 덮어쓰지 않는 것입니다. 오케스트레이터는 이 신호실을 보고 어디를 구현하고 어디를 문서 review 로 남길지 구분합니다.</p>
                <div class="banner-stats">
                <article>
                <span>live root</span>
                <strong>/</strong>
                </article>
                <article>
                <span>legacy review</span>
                <strong>/test</strong>
                </article>
                <article>
                <span>v0.5.0 proto</span>
                <strong>/test/v0-5-0</strong>
                </article>
                </div>
              </section>

              <section class="section-block split-layout">
                <article class="surface-panel">
                  <div class="section-head">
                    <div>
                      <p class="eyebrow">Signal Cards</p>
                      <h3>운용 규칙</h3>
                    </div>
                  </div>

                  <div class="signal-grid">
                    <article v-for="item in signalCards" :key="item.name" class="signal-card" :class="item.accent">
                      <strong>{{ item.name }}</strong>
                      <span>{{ item.status }}</span>
                      <p>{{ item.body }}</p>
                    </article>
                  </div>
                </article>

                <article class="surface-panel">
                  <div class="section-head">
                    <div>
                      <p class="eyebrow">Orchestrator Route</p>
                      <h3>어디를 보면 되는가</h3>
                    </div>
                  </div>

                  <ul class="check-list">
                    <li>`/` 에서는 현재 실사용 포털과 실제 API 연결 상태를 본다.</li>
                    <li>`/test` 에서는 `v0.4.0` 검수 더미와 기존 기능 페이지 분리를 확인한다.</li>
                    <li>`/test/v0-5-0/junction` 에서는 새 허브 구조와 택시 진입 레일을 본다.</li>
                    <li>`/test/v0-5-0/taxi`, `/ops`, `/signals` 에서 각 구현 슬라이스를 티켓으로 분리한다.</li>
                  </ul>
                </article>
              </section>
            </section>
          </template>

          <section v-else-if="page === 'junction'" class="junction-shell">
            <JunctionMap
              :disabled-pages="isStaticMode ? Array.from(STATIC_UNAVAILABLE_PAGES) : []"
              @open="openPage"
            />

            <p v-if="staticModeMessage" class="junction-note static-mode-note" role="status">{{ staticModeMessage }}</p>
          </section>

          <section v-else-if="page === 'simhub'" class="feature-shell tone-page tone-sim-page line-s">
            <section v-if="featuredSimCard" class="tone-page-hero" :class="featuredSimCard.accent">
              <small>{{ featuredSimCard.kicker }}</small>
              <h1>{{ featuredSimCard.displayName }}</h1>
              <p>{{ featuredSimCard.summary }}</p>
              <button type="button" class="primary-button" @click="openPage(featuredSimCard.page)">
                {{ featuredSimCard.cta }}
              </button>
            </section>

            <div class="tone-service-list" aria-label="격납고">
              <article
                v-for="card in secondarySimCards"
                :key="card.key"
                class="tone-service-row"
                :class="card.accent"
              >
                <span class="line-round" :class="card.accent" aria-hidden="true">{{ card.lineNo }}</span>
                <div>
                  <small>{{ card.status }}</small>
                  <h2>{{ card.displayName }}</h2>
                  <p>{{ card.summary }}</p>
                </div>
                <button type="button" class="ghost-button" @click="openPage(card.page)">
                  {{ card.cta }}
                </button>
              </article>
            </div>
          </section>

          <VoyageView v-else-if="page === 'voyage'" @exit="openPage('junction')" />

          <section v-else-if="page === 'elevator'" class="feature-shell sim-tone-page elevator-tone-page">
            <StationHeader
              line-class="line-e"
              station-code="E01"
              title="멈춘 엘리베이터"
              status="실시간 운행"
              status-tone="live"
              :summary="`23층 · 승강기 ${elevatorCars.length}대 · 정원 20명`"
              :prev-label="isTestRoute ? '← 환승 홀' : `← ${simHubLine.nameKo}`"
              :exit-label="isTestRoute ? '환승 홀로 나가기' : `${simHubLine.nameKo}으로 돌아가기`"
              @exit="openPage(isTestRoute ? 'junction' : 'simhub')"
            />

            <section class="section-block elevator-live-layout line-e">
              <ElevatorCrossSection
                :cars="elevatorCars"
                :floors="elevatorFloorRows"
                :min-floor="elevatorBuilding.minFloor"
                :max-floor="elevatorBuilding.maxFloor"
                @add-passenger="addPassengerAtFloor"
              />

              <aside class="elevator-control-panel">
                <div class="elevator-metrics" aria-label="엘리베이터 실시간 지표">
                  <article>
                    <span>대기</span>
                    <strong class="num">{{ elevatorSummary.waitingPassengers }}</strong>
                  </article>
                  <article>
                    <span>탑승</span>
                    <strong class="num">{{ elevatorSummary.onboardPassengers }}</strong>
                  </article>
                  <article>
                    <span>이동 중</span>
                    <strong class="num">{{ elevatorSummary.movingElevators }}</strong>
                  </article>
                  <article>
                    <span>평균 대기</span>
                    <strong class="num">{{ elevatorAverageWaitSeconds }}초</strong>
                  </article>
                </div>

                <section class="elevator-demand-panel">
                  <div class="section-head compact">
                    <h3>수요</h3>
                    <span>{{ elevatorDemand.presetLabel }}</span>
                  </div>
                  <div class="preset-row elevator-presets">
                    <button
                      v-for="preset in [
                        { id: 'quiet', label: '한산' },
                        { id: 'normal', label: '보통' },
                        { id: 'busy', label: '혼잡' }
                      ]"
                      :key="preset.id"
                      type="button"
                      class="chip-button"
                      :class="{ active: demandPreset === preset.id }"
                      @click="applyDemandPreset(preset.id)"
                    >
                      {{ preset.label }}
                    </button>
                  </div>
                </section>

                <details class="elevator-advanced">
                  <summary>고급 설정</summary>
                  <div class="control-grid">
                    <label class="input-block">
                      <span>강도 {{ demandIntensity }}</span>
                      <input
                        class="range-input"
                        type="range"
                        min="0"
                        max="100"
                        :value="demandIntensity"
                        @change="updateDemandIntensity($event.target.value)"
                      />
                    </label>
                    <label class="input-block">
                      <span>승강기 수 {{ elevatorCarCount }}</span>
                      <input
                        class="range-input"
                        type="range"
                        min="2"
                        max="6"
                        :value="elevatorCarCount"
                        @change="updateElevatorCarCount($event.target.value)"
                      />
                    </label>
                    <button type="button" class="ghost-button" @click="resetElevator">초기화</button>
                  </div>
                </details>

                <details
                  class="elevator-event-panel"
                  :open="elevatorTickerOpen"
                  @toggle="elevatorTickerOpen = $event.target.open"
                >
                  <summary>최근 운행 <span>최대 8건</span></summary>
                  <div class="elevator-event-list">
                    <article v-for="(entry, index) in elevatorEvents" :key="`${entry}-${index}`">
                      <span class="live-dot" aria-hidden="true"></span>
                      {{ entry }}
                    </article>
                  </div>
                </details>
              </aside>
            </section>
          </section>

          <section v-else-if="page === 'taxi'" class="feature-shell sim-tone-page taxi-tone-page">
            <StationHeader
              line-class="line-t"
              station-code="T01"
              title="심야 택시"
              status="실시간 운행"
              status-tone="live"
              summary="9구역 · 보상/패널티 누적"
              :prev-label="isTestRoute ? '← 환승 홀' : `← ${simHubLine.nameKo}`"
              :exit-label="isTestRoute ? '환승 홀로 나가기' : `${simHubLine.nameKo}으로 돌아가기`"
              @exit="openPage(isTestRoute ? 'junction' : 'simhub')"
            />
            <section class="station-lead taxi-timetable" aria-label="택시 실시간 지표">
              <div class="banner-stats">
                <article v-for="metric in taxiDashboardMetrics" :key="metric.label">
                  <span>{{ metric.label }}</span>
                  <strong class="num">{{ metric.value }}</strong>
                </article>
              </div>
            </section>

            <section class="section-block split-layout">
              <article class="surface-panel taxi-map-panel">
                <div class="section-head">
                  <div>
                    <h3>구역별 수요 지도</h3>
                  </div>
                  <span>9구역 흐름을 한눈에 관찰합니다.</span>
                </div>

                <div class="district-grid" aria-label="9구역 수요 시뮬레이션 캔버스">
                  <article
                    v-for="zone in taxiZoneCards"
                    :key="zone.id"
                    class="district-card"
                    :class="zone.accent"
                  >
                    <div class="district-top">
                      <strong>{{ zone.name }}</strong>
                      <span>호출 {{ zone.pending }}</span>
                    </div>
                    <p>{{ zone.demandLabel }}</p>
                    <small>인근 차량 {{ zone.nearbyFleet }} · 연결 구역 {{ zone.neighbors.length }}</small>
                  </article>
                </div>
              </article>

              <article class="surface-panel">
                <div class="section-head">
                  <div>
                    <h3>수동 호출 입력</h3>
                  </div>
                </div>

                <div class="control-grid">
                  <label class="input-block">
                    <span>출발지</span>
                    <select v-model="taxiManualOrigin" class="select-input">
                      <option v-for="zone in taxiZones" :key="`${zone.id}-origin`" :value="zone.id">
                        {{ zone.name }}
                      </option>
                    </select>
                  </label>

                  <label class="input-block">
                    <span>도착지</span>
                    <select v-model="taxiManualDestination" class="select-input">
                      <option v-for="zone in taxiZones" :key="`${zone.id}-destination`" :value="zone.id">
                        {{ zone.name }}
                      </option>
                    </select>
                  </label>

                  <label class="input-block">
                    <span>인원수 {{ taxiManualPassengers }}</span>
                    <input
                      v-model="taxiManualPassengers"
                      class="range-input"
                      type="range"
                      min="1"
                      max="4"
                    />
                  </label>
                </div>

                <div class="queue-buttons">
                  <button type="button" class="primary-button" @click="submitManualTaxiRequest">수동 호출 추가</button>
                  <button type="button" class="ghost-button" @click="addTaxiFleetUnit">차량 1대 추가</button>
                </div>

                <div class="reward-grid">
                  <article class="reward-card">
                    <span>보상</span>
                    <strong>{{ formatSignedValue(taxiRewardSummary.reward) }}</strong>
                    <p>빠른 배차 = 보상</p>
                  </article>
                  <article class="reward-card">
                    <span>패널티</span>
                    <strong>{{ formatSignedValue(-taxiRewardSummary.penalty) }}</strong>
                    <p>차량 추가 = 패널티</p>
                  </article>
                  <article class="reward-card">
                    <span>순점수</span>
                    <strong>{{ formatSignedValue(taxiRewardSummary.net) }}</strong>
                    <p>보상 − 패널티 = 순점수</p>
                  </article>
                </div>

                <p v-if="taxiMessage" class="status-copy ok">{{ taxiMessage }}</p>
              </article>
            </section>

            <section class="section-block split-layout">
              <article class="surface-panel">
                <div class="section-head">
                  <div>
                    <h3>차량 상태</h3>
                  </div>
                </div>

                <div class="fleet-grid">
                  <article v-for="cab in taxiFleet" :key="cab.id" class="fleet-card">
                    <div class="fleet-top">
                      <strong>{{ cab.id }}</strong>
                      <span class="taxi-state-token" :data-label="taxiStatusLabel(cab.status)">{{ cab.status }}</span>
                    </div>
                    <p>{{ findTaxiZone(cab.zoneId)?.name }} → {{ findTaxiZone(cab.targetZoneId)?.name }}</p>
                    <small>승객 {{ cab.passengerCount }} / {{ cab.seats }}명 · 남은 구간 {{ cab.route.length }}</small>
                    <strong class="fleet-reward">{{ cab.assignedRequestId || '배차 대기' }}</strong>
                  </article>
                </div>
              </article>

              <article class="surface-panel">
                <div class="section-head">
                  <div>
                    <h3>진행 중 호출</h3>
                  </div>
                </div>

                <div class="prototype-rule-list">
                  <article v-for="request in taxiRequestQueue" :key="request.id" class="prototype-rule-card">
                    <strong>
                      {{ request.id }} ·
                      <span class="taxi-state-token" :data-label="taxiStatusLabel(request.status)">{{ request.status }}</span>
                    </strong>
                    <p>
                      {{ findTaxiZone(request.originId)?.name }} → {{ findTaxiZone(request.destinationId)?.name }}
                      · {{ request.passengers }}명 · {{ request.assignedTaxiId || '배차 대기' }}
                    </p>
                  </article>
                </div>
              </article>
            </section>

            <section class="section-block split-layout">
              <article class="surface-panel">
                <div class="section-head">
                  <div>
                    <h3>최근 완료 호출</h3>
                  </div>
                </div>

                <div class="prototype-rule-list">
                  <article v-for="request in taxiCompletedRequests" :key="request.id" class="prototype-rule-card">
                    <strong>{{ request.id }} · 보상 {{ formatSignedValue(request.reward) }}</strong>
                    <p>
                      대기 {{ request.waitSeconds }}초 · 운행 {{ request.tripSeconds }}초 ·
                      {{ findTaxiZone(request.originId)?.name }} → {{ findTaxiZone(request.destinationId)?.name }}
                    </p>
                  </article>
                </div>
              </article>

              <article class="surface-panel">
                <div class="section-head">
                  <div>
                    <h3>이벤트 로그</h3>
                  </div>
                </div>

                <div class="arrival-log">
                  <article v-for="entry in taxiState.eventLog" :key="entry">{{ formatTaxiEvent(entry) }}</article>
                </div>
              </article>
            </section>
          </section>

          <section v-else-if="page === 'bloghub'" class="feature-shell blog-shell">
            <section class="blog-tone-page blog-hub-page">
              <section v-if="latestPublishedBlogPost" class="blog-tone-hero">
                <small>최근 글</small>
                <h1>
                  <button type="button" class="blog-text-link" @click="openBlogPost(latestPublishedBlogPost.slug)">
                    {{ latestPublishedBlogPost.title }}
                  </button>
                </h1>
                <p>{{ latestPublishedBlogPost.summary }}</p>
              </section>
              <section v-else class="blog-tone-hero">
                <small>최근 글</small>
                <h1>아직 공개된 글이 없습니다</h1>
                <p>첫 기록은 글쓰기에서 시작할 수 있습니다.</p>
              </section>

              <nav class="blog-tone-actions" aria-label="블로그 바로가기">
                <button type="button" class="ghost-button" @click="openPage('writingStudio')">새 글 쓰기</button>
                <button type="button" class="ghost-button" @click="openBlogArchive">보관함</button>
              </nav>

              <div class="blog-timetable" aria-label="최근 발행 글">
                <article v-for="post in publishedBlogPosts.slice(1, 4)" :key="post.id" class="blog-timetable-row">
                  <p class="blog-timetable-meta">
                    <time>{{ formatBlogDate(post.publishedAt) }}</time> · {{ blogCategory(post) }}
                  </p>
                  <h2>
                    <button type="button" class="blog-text-link" @click="openBlogPost(post.slug)">{{ post.title }}</button>
                  </h2>
                </article>
              </div>
            </section>
          </section>

          <section v-else-if="page === 'blogArchive'" class="feature-shell blog-shell">
            <section class="blog-tone-page blog-archive-page">
              <header class="blog-tone-hero">
                <small>글 보관함</small>
                <h1>생각이 지나간 자리</h1>
              </header>

              <section v-for="group in blogArchiveYears" :key="group.year" class="blog-year-group">
                <h2 class="blog-year-label">{{ group.year }}<template v-if="group.year !== '날짜 미정'">년</template></h2>
                <div class="blog-archive-timetable">
                  <button
                    v-for="post in group.posts"
                    :key="post.id"
                    type="button"
                    class="blog-archive-row"
                    @click="openBlogPost(post.slug)"
                  >
                    <time>{{ formatBlogDate(post.publishedAt) }}</time>
                    <strong>{{ post.title }}</strong>
                  </button>
                </div>
              </section>

              <p v-if="blogArchiveYears.length === 0" class="blog-empty-copy">아직 공개된 글이 없습니다.</p>
            </section>
          </section>

          <section v-else-if="page === 'blogPost'" class="feature-shell blog-shell">
            <article v-if="activeBlogPost" class="post-detail">
              <header class="post-tone-hero">
                <h1>{{ activeBlogPost.title }}</h1>
                <p>{{ formatBlogLongDate(activeBlogPost.publishedAt) }} · {{ blogCategory(activeBlogPost) }}</p>
              </header>

              <div class="markdown-body post-body" v-html="renderMarkdownToHtml(activeBlogPost.bodyMarkdown, activeBlogPost.tables)"></div>

              <footer class="post-foot-nav">
                <button type="button" class="post-nav-link" @click="openBlogArchive">← 보관함</button>
                <button type="button" class="post-nav-link" @click="openStudioForPost(activeBlogPost.id)">이어서 쓰기 →</button>
              </footer>
            </article>
            <article v-else class="blog-tone-page blog-not-found" role="status">
              <p class="eyebrow">찾을 수 없음</p>
              <h3>공개 글을 찾을 수 없습니다</h3>
              <p>주소가 바뀌었거나 보관된 글입니다.</p>
              <button type="button" class="ghost-button" @click="openBlogArchive">공개 글 목록</button>
            </article>
          </section>

          <WritingStudio
            v-else-if="page === 'writingStudio'"
            :state="studioState"
            :posts="[...draftBlogPosts, ...archivedBlogPosts]"
            :preview-html="studioPreviewHtml"
            :view-mode="studioViewMode"
            :save-phase="studioSavePhase"
            :saved-at="studioLastSavedAt"
            :message="blogMessage"
            :backup-message="writingBackupMessage"
            @update-field="updateStudioField"
            @update-view="studioViewMode = $event"
            @exit="openPage('bloghub')"
            @publish="publishStudioPost"
            @archive="archiveStudioPost"
            @unpublish="unpublishStudioPost"
            @new-post="createNewStudioPost(false)"
            @open-post="openStudioForPost"
            @restore="restoreArchivedPost"
            @backup="backupLocalWriting"
            @clear-message="blogMessage = ''"
          />

          <section v-else-if="page === 'work'" class="feature-shell tone-page tone-work-page line-w">
            <div class="tone-page-intro">
              <section class="tone-page-hero line-w">
                <div class="tone-hero-topline">
                  <small>지금 볼 것</small>
                  <span>보호 구역</span>
                </div>
                <h1>검토 대기 {{ workToneRows[0].count }}건</h1>
                <p>결정이 필요한 작업만 앞에 둡니다.</p>
              </section>

              <div class="tone-status-list" aria-label="작업 상태 요약">
                <div v-for="item in workToneRows" :key="item.status" class="tone-status-row">
                  <span class="tone-status-dot" :class="{ wait: item.status !== 'started' }" aria-hidden="true"></span>
                  <div>
                    <strong>{{ item.label }} {{ item.count }}건</strong>
                    <small>{{ item.helper }}</small>
                  </div>
                  <span>{{ item.shortStatus }}</span>
                </div>
              </div>
            </div>

            <details class="tone-support-details">
              <summary>버전·작업자·저장 기준</summary>
              <div class="tone-support-details__body">
            <section class="section-block">
              <div class="section-head">
                <div>
                  <p class="eyebrow">목표 버전</p>
                  <h3>목표 버전과 로드맵 요약</h3>
                </div>
                <span>`v0.4.0` 레일 안의 작업과 이후 후보 버전을 한 화면에서 읽습니다.</span>
              </div>

              <div class="version-strip">
                <article v-for="[version, count] in workVersionSummary" :key="version" class="version-chip-card">
                  <strong>{{ version }}</strong>
                  <small>티켓 {{ count }}건</small>
                </article>
              </div>

              <div class="version-strip version-focus-strip">
                <article class="version-chip-card version-focus-card">
                  <strong>{{ workVersionHeader.focusVersion }}</strong>
                  <small>현재 집중</small>
                </article>
                <article class="version-chip-card">
                  <strong>{{ workVersionHeader.developmentCeiling }}</strong>
                  <small>개발 상한</small>
                </article>
                <article class="version-chip-card">
                  <strong>{{ workVersionHeader.activeRange }}</strong>
                  <small>활성 범위</small>
                </article>
                <article class="version-chip-card">
                  <strong>{{ workVersionHeader.selectedPriority }}</strong>
                  <small>선택 티켓 우선순위</small>
                </article>
              </div>

              <div class="roadmap-summary-grid">
                <article v-for="item in WORK_ROADMAP_ITEMS" :key="item.version" class="roadmap-summary-card">
                  <span>{{ item.version }}</span>
                  <strong>{{ item.title }}</strong>
                  <p>{{ item.summary }}</p>
                </article>
              </div>
            </section>

            <section class="section-block split-layout">
              <article class="surface-panel">
                <div class="section-head">
                  <div>
                    <p class="eyebrow">담당 현황</p>
                    <h3>진행 중 담당</h3>
                  </div>
                  <span>Ready 이후 실제 worker 소유 구간을 카드로 분리해 보여줍니다.</span>
                </div>

                <div class="crew-grid">
                  <article v-for="crew in workWorkerSummary" :key="crew.workerId" class="crew-card line-w">
                    <div class="fleet-top">
                      <strong>{{ crew.workerId }}</strong>
                      <span>{{ crew.status }}</span>
                    </div>
                    <p>{{ crew.focus }}</p>
                    <small>{{ (crew.currentTicketIds || []).join(', ') || '현재 선점 없음' }}</small>
                  </article>
                </div>
              </article>

              <article class="surface-panel">
                <div class="section-head">
                  <div>
                    <p class="eyebrow">우선순위 정책</p>
                    <h3>자동/수동 경계</h3>
                  </div>
                </div>

                <div class="prototype-rule-list">
                  <article class="prototype-rule-card">
                    <strong>큐 출처</strong>
                    <p>{{ workPriorityPolicy.queueSource }}</p>
                  </article>
                  <article class="prototype-rule-card">
                    <strong>자동</strong>
                    <p>{{ (workPriorityPolicy.automaticRange || []).join(', ') }}</p>
                  </article>
                  <article class="prototype-rule-card">
                    <strong>수동</strong>
                    <p>{{ (workPriorityPolicy.manualRange || []).join(', ') }}</p>
                  </article>
                </div>
              </article>
            </section>

            <section class="section-block split-layout">
              <article class="surface-panel">
                <div class="section-head">
                  <div>
                    <p class="eyebrow">저장 방식</p>
                    <h3>파일 저장과 DB 전환 기준</h3>
                  </div>
                </div>

                <div class="info-stack">
                  <article>
                    <span>방식</span>
                    <strong>{{ workPersistence.mode }}</strong>
                  </article>
                  <article>
                    <span>감사 파일</span>
                    <strong>{{ workPersistence.filePath }}</strong>
                  </article>
                  <article>
                    <span>대상 DB</span>
                    <strong>{{ workPersistence.targetDatabase }}</strong>
                  </article>
                  <article>
                    <span>감사 기록</span>
                    <strong>{{ workPersistence.auditEventCount }}</strong>
                  </article>
                </div>

                <p class="status-copy">
                  마지막 감사 시각 {{ formatTimestamp(workPersistence.lastAuditAt) || '없음' }}
                </p>
              </article>

              <article class="surface-panel">
                <div class="section-head">
                  <div>
                    <p class="eyebrow">다음 작업 예상</p>
                    <h3>우선순위 반응 예상</h3>
                  </div>
                </div>

                <ul class="check-list">
                  <li v-for="item in workPriorityPolicy.nextCandidates || []" :key="item">{{ item }}</li>
                </ul>
              </article>
            </section>

              </div>
            </details>

            <details class="tone-work-manager-details">
              <summary>전체 작업 보드·지시</summary>
              <section class="section-block work-layout tone-work-layout">
              <div class="work-board">
                <article
                  v-for="column in workBoardColumns"
                  :key="column.status"
                  class="lane-card"
                  @dragover.prevent
                  @drop.prevent="column.status === 'ready' ? dropIntoReady() : column.status === 'backlog' ? dropIntoBacklog() : null"
                >
                  <div class="lane-head">
                    <div>
                      <strong>{{ column.label }}</strong>
                      <small>티켓 {{ column.tickets.length }}건</small>
                    </div>
                    <span class="lane-status">{{ column.helper }}</span>
                  </div>

                  <div class="lane-body">
                    <button
                      v-for="ticket in column.tickets"
                      :key="ticket.id"
                      type="button"
                      class="ticket-card"
                      :class="{ active: selectedWorkTicket?.id === ticket.id }"
                      :draggable="column.status === 'backlog' || column.status === 'ready'"
                      @dragstart="startTicketDrag(ticket.id)"
                      @click="selectWorkTicket(ticket.id)"
                    >
                      <div class="ticket-top">
                        <strong>{{ ticket.id }}</strong>
                        <span>{{ ticket.priority }}</span>
                      </div>
                      <p>{{ ticket.title }}</p>
                      <small>{{ ticket.targetVersion }} · {{ ticket.progressDecision }}</small>
                    </button>
                  </div>
                </article>
              </div>

              <aside class="detail-panel">
                <div class="section-head">
                  <div>
                    <h3>{{ selectedWorkTicket?.id || '선택 없음' }}</h3>
                  </div>
                </div>

                <div v-if="selectedWorkTicket" class="detail-stack">
                  <article>
                    <span>레인</span>
                    <strong>{{ selectedWorkTicket.lane }}</strong>
                  </article>
                  <article>
                    <span>목표 버전</span>
                    <strong>{{ selectedWorkTicket.targetVersion }}</strong>
                  </article>
                  <article class="detail-editor">
                    <span>목표 버전 수정</span>
                    <select v-model="metadataTargetVersion" class="select-input" aria-label="목표 버전 수정">
                      <option v-for="version in workTargetVersionOptions" :key="version" :value="version">
                        {{ version }}
                      </option>
                    </select>
                  </article>
                  <article>
                    <span>우선순위</span>
                    <strong>{{ selectedWorkTicket.priority || '없음' }}</strong>
                  </article>
                  <article class="detail-editor">
                    <span>우선순위 수정</span>
                    <select v-model="metadataPriority" class="select-input" aria-label="우선순위 수정">
                      <option value="P1">P1</option>
                      <option value="P2">P2</option>
                      <option value="P3">P3</option>
                      <option value="P4">P4</option>
                      <option value="P5">P5</option>
                    </select>
                  </article>
                  <article>
                    <span>진행 판정</span>
                    <strong>{{ selectedWorkTicket.progressDecision || '없음' }}</strong>
                  </article>
                  <article>
                    <span>목표</span>
                    <p>{{ selectedWorkTicket.goal || '없음' }}</p>
                  </article>
                  <article>
                    <span>작업 항목</span>
                    <p>{{ selectedWorkTicket.workItems || '없음' }}</p>
                  </article>
                  <article>
                    <span>산출물</span>
                    <p>{{ selectedWorkTicket.deliverables || '없음' }}</p>
                  </article>
                  <article>
                    <span>선행 조건</span>
                    <p>{{ selectedWorkTicket.prerequisites || '없음' }}</p>
                  </article>
                  <article>
                    <span>의존성</span>
                    <p>{{ selectedWorkTicket.dependencies || selectedWorkTicket.prerequisites || '없음' }}</p>
                  </article>
                  <article class="detail-editor detail-editor-wide">
                    <span>의존성 수정</span>
                    <textarea
                      v-model="metadataDependencies"
                      class="textarea-input"
                      rows="4"
                      aria-label="의존성 수정"
                      placeholder="TKT-039 또는 선행 티켓/의존성 메모를 적습니다."
                    ></textarea>
                  </article>
                  <article>
                    <span>질문</span>
                    <p>{{ selectedWorkTicket.questions || '없음' }}</p>
                  </article>
                  <article>
                    <span>검토 메모</span>
                    <p>{{ selectedWorkTicket.reviewMemo || '없음' }}</p>
                  </article>
                  <article>
                    <span>PR 준비 메모</span>
                    <p>{{ selectedWorkTicket.prPreparationMemo || '없음' }}</p>
                  </article>
                  <article>
                    <span>메모</span>
                    <p>{{ selectedWorkTicket.notes || '없음' }}</p>
                  </article>
                </div>

                <div v-if="selectedWorkTicket" class="detail-actions">
                  <p class="status-copy" :class="{ ok: !!workManagerToken, error: !workManagerToken }">
                    {{ workManagerToken ? 'command gate 가 열려 있어 메타데이터를 저장할 수 있습니다.' : '메타데이터 저장은 command gate 를 연 뒤에만 가능합니다.' }}
                  </p>
                  <div class="command-actions">
                    <button type="button" class="primary-button" :disabled="isSavingMetadata || !workManagerToken" @click="saveWorkTicketMetadata">
                      {{ isSavingMetadata ? '저장 중...' : '메타데이터 저장' }}
                    </button>
                  </div>
                  <p v-if="metadataMessage" class="status-copy ok">{{ metadataMessage }}</p>
                  <p v-if="metadataError" class="status-copy error">{{ metadataError }}</p>
                </div>
              </aside>

              <aside class="command-panel">
                <div class="section-head">
                  <div>
                    <h3>작업 지시</h3>
                  </div>
                </div>

                <div class="auth-panel">
                  <label class="input-block">
                    <span>공유 비밀번호</span>
                    <input
                      v-model="workManagerPassword"
                      class="text-input"
                      type="password"
                      placeholder="command gate 비밀번호"
                    />
                  </label>
                  <div class="command-actions">
                    <button type="button" class="primary-button" :disabled="isUnlockingWorkManager" @click="unlockWorkManager">
                      {{ isUnlockingWorkManager ? '확인 중...' : 'gate 열기' }}
                    </button>
                    <button v-if="workManagerToken" type="button" class="ghost-button" @click="logoutWorkManager">
                      잠그기
                    </button>
                  </div>
                  <p v-if="workManagerMessage" class="status-copy ok">{{ workManagerMessage }}</p>
                  <p v-if="workManagerError" class="status-copy error">{{ workManagerError }}</p>
                </div>

                <div class="preset-column">
                  <button
                    v-for="preset in commandPresets"
                    :key="preset.action"
                    type="button"
                    class="command-card"
                    :class="{ active: selectedCommand === preset.action }"
                    @click="selectedCommand = preset.action"
                  >
                    <strong>{{ preset.label }}</strong>
                    <p>{{ preset.description }}</p>
                  </button>
                </div>

                <label class="input-block">
                  <span>메모</span>
                  <textarea
                    v-model="commandNote"
                    class="textarea-input"
                    rows="4"
                    placeholder="지금까지 사용자와 AI가 합의한 맥락을 짧게 남깁니다."
                  ></textarea>
                </label>

                <div class="command-actions">
                  <button
                    type="button"
                    class="primary-button"
                    :disabled="isRunningCommand || !selectedCommand || !workManagerToken"
                    @click="submitPresetCommand"
                  >
                    {{ isRunningCommand ? '큐 등록 중...' : '미리 정한 명령 전송' }}
                  </button>
                </div>

                <div class="feed-block">
                  <strong>활동 기록</strong>
                  <article v-for="entry in activityFeed.slice(0, 6)" :key="entry.id" class="activity-entry">
                    <div class="feed-meta">
                      <span>{{ entry.type }}</span>
                      <small>{{ formatTimestamp(entry.timestamp) }}</small>
                    </div>
                    <p>{{ entry.title }}</p>
                    <small>{{ entry.summary }}</small>
                  </article>
                  <article v-for="entry in commandHistory.slice(0, 3)" :key="entry.id" class="activity-entry">
                    <div class="feed-meta">
                      <span>명령</span>
                      <small>{{ formatTimestamp(entry.createdAt) }}</small>
                    </div>
                    <p>{{ entry.label }}</p>
                    <small>{{ entry.note || entry.message }}</small>
                  </article>
                </div>
              </aside>
              </section>
            </details>
          </section>

          <section v-else class="feature-shell tone-page tone-runtime-page line-r">
            <section class="tone-page-hero line-r">
              <div class="tone-hero-topline">
                <small>주의가 필요한 신호</small>
                <span>보호 구역</span>
              </div>
              <h1>{{ runtimeNeedsAttention ? '응답 지연이 평소보다 깁니다' : '모든 실행 환경이 응답 중입니다' }}</h1>
              <p>{{ runtimeNeedsAttention ? '서비스는 동작 중이며 최근 10분의 변화입니다.' : '최근 확인한 실행 환경이 정상입니다.' }}</p>
            </section>

            <div class="tone-runtime-list" aria-label="실행 환경 상태">
              <div v-for="row in runtimeToneRows" :key="row.key" class="tone-runtime-row">
                <span class="tone-status-dot" :class="{ wait: row.warning }" aria-hidden="true"></span>
                <div>
                  <strong>{{ row.label }}</strong>
                  <small>{{ row.detail }}</small>
                </div>
                <span class="tone-runtime-metric">{{ row.status }}</span>
              </div>
            </div>

            <button type="button" class="ghost-button tone-refresh" @click="loadPortalData">상태 새로고침</button>

            <details class="tone-support-details tone-runtime-details">
              <summary>오프로드·배포 기준</summary>
              <div class="tone-support-details__body">
            <section class="section-block split-layout">
              <article class="surface-panel">
                <div class="section-head">
                  <div>
                    <p class="eyebrow">라우팅 규칙</p>
                    <h3>오프로드 정책</h3>
                  </div>
                </div>

                <ul class="rule-list">
                  <li v-for="rule in runtimeState.routingRules" :key="`${rule.when}-${rule.preferNode}`">
                    {{ rule.when }} -> {{ rule.preferNode }} / {{ rule.degradedFallback }}
                  </li>
                </ul>
              </article>

              <article class="surface-panel">
                <div class="section-head">
                  <div>
                    <p class="eyebrow">배포 경로</p>
                    <h3>배포 레일</h3>
                  </div>
                </div>

                <div class="path-steps">
                  <div>UI / docs 정리</div>
                  <div>티켓 acceptance 확인</div>
                  <div>tests / CI 확인</div>
                  <div>PR 정리</div>
                  <div>tag / release</div>
                </div>
              </article>
            </section>
              </div>
            </details>
          </section>

          <nav v-if="!isTestRoute" class="mobile-quick-nav" :class="{ static: isStaticMode }" aria-label="빠른 환승">
            <button type="button" :class="{ active: page === 'junction' }" @click="openPage('junction')">노선도</button>
            <button
              type="button"
              :class="{ active: ['bloghub', 'blogArchive', 'blogPost', 'writingStudio'].includes(page) }"
              @click="openBlogArchive"
            >
              아카이브
            </button>
            <button
              v-if="!isStaticMode"
              type="button"
              :class="{ active: ['simhub', 'elevator', 'taxi'].includes(page) }"
              @click="openPage('simhub')"
            >
              승강장
            </button>
          </nav>
        </div>
      </main>
    </transition>
  </div>
</template>
