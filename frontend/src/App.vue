<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import StationHeader from './components/StationHeader.vue'
import JunctionMap from './components/JunctionMap.vue'
import StatusBadge from './components/StatusBadge.vue'
import VoyageView from './components/VoyageView.vue'
import WritingStudio from './components/WritingStudio.vue'
import Pantry from './components/Pantry.vue'
import Ets2Live from './components/Ets2Live.vue'
import Ets2Dev from './components/Ets2Dev.vue'
import { SiteLoopSymbol } from './components/tone/index.js'
import { BLOG_LINE_OPEN, LINES } from './data/lines.js'
import SplashView from './components/pages/SplashView.vue'
import SimHubView from './components/pages/SimHubView.vue'
import ElevatorView from './components/pages/ElevatorView.vue'
import TaxiView from './components/pages/TaxiView.vue'
import WorkView from './components/pages/WorkView.vue'
import RuntimeView from './components/pages/RuntimeView.vue'
import BlogHubView from './components/pages/BlogHubView.vue'
import BlogArchiveView from './components/pages/BlogArchiveView.vue'
import BlogPostView from './components/pages/BlogPostView.vue'
import { SPLASH_DOOR_OPENING_MS, useSplash } from './composables/useSplash.js'
import { useElevatorSim } from './composables/useElevatorSim.js'
import { useTaxiSim } from './composables/useTaxiSim.js'
import { useWorkManager } from './composables/useWorkManager.js'
import { useBlogStore } from './composables/useBlogStore.js'
import { VOYAGE } from './data/voyage.js'
import { migrateLegacyVoyageStorage, voyageStorageKey } from './data/voyageStorage.js'
import {
  buildLivePath,
  normalizeBasePath,
  readLiveRoute,
  STATIC_UNAVAILABLE_LIVE_PAGES,
  stripBasePath,
  withBasePath
} from './staticRouting.js'

const FIRST_ROUTE_DOOR_TIMING = Object.freeze({ closeMs: 450, holdMs: 200, openMs: 350 })
const REPEAT_ROUTE_DOOR_TIMING = Object.freeze({ closeMs: 270, holdMs: 120, openMs: 210 })
const APP_BASE_PATH = normalizeBasePath(import.meta.env.BASE_URL)
const TEST_ROUTE_PATH = withBasePath('/test', APP_BASE_PATH)
const VERSIONED_TEST_ROUTE_PATH = withBasePath('/test/v0-5-0', APP_BASE_PATH)
const ETS2_DEV_TEST_API = typeof window !== 'undefined'
  && ['127.0.0.1', 'localhost', '[::1]'].includes(window.location.hostname)
  ? String(window.__WORKAROUND_ETS2_DEV_TEST_API__ || '')
  : ''
const isStaticMode = !ETS2_DEV_TEST_API && (import.meta.env.VITE_STATIC_MODE === 'true' || APP_BASE_PATH !== '/')
const STATIC_UNAVAILABLE_PAGES = new Set(STATIC_UNAVAILABLE_LIVE_PAGES)
const STATIC_DIRECT_PREVIEW_PAGES = new Set(['ets2Dev'])
// 블로그 본선(D-031): lines.js 의 BLOG_LINE_OPEN 이 꺼져 있으면 이 화면들은 환승 홀로 돌려보낸다.
const BLOG_LINE_PAGES = new Set(['bloghub', 'blogArchive', 'blogPost', 'writingStudio'])
const BLOG_CLOSED_MESSAGE = '블로그 노선은 운행을 멈췄습니다'
const BLOG_CLOSED_NOTICE_MS = 2500
let pendingBlogClosedNotice = false // 첫 진입이 막힌 블로그 주소였으면 마운트 뒤 안내를 한 번 띄운다
function isBlogClosedPage(pageName) {
  return !BLOG_LINE_OPEN && BLOG_LINE_PAGES.has(pageName)
}
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
  'pantry',
  'ets2',
  'ets2Dev',
  'work',
  'runtime'
]
const TESTABLE_PAGES = ['junction', 'elevator', 'work', 'runtime']
const VERSIONED_TESTABLE_PAGES = ['junction', 'taxi', 'ops', 'signals']
const THEME_STORAGE_KEY = 'workaround-theme'
const VOYAGE_ARCHIVE_STORAGE_KEY = voyageStorageKey(VOYAGE.id, 'archive')
let fallbackEntityIdCounter = 0


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
// 기지선(Work Manager·Runtime) 상태·인증 세션·타이머는 useWorkManager 가 소유한다(TKT-209).
const workManager = useWorkManager({
  fetchJson,
  fallbacks: { health: fallbackHealth, runtime: fallbackRuntime, workBoard: fallbackWorkBoard }
})
const {
  healthState,
  runtimeState,
  servicesState,
  workBoardState,
  readyColumnTickets,
  countWorkTicketsByStatus,
  loadHealthState,
  loadRuntimeState,
  loadServicesState,
  loadWorkBoardState
} = workManager
// 블로그 저장소(글 목록·활성 슬러그·Writing Studio 상태·자동저장)는 useBlogStore 가 소유한다(TKT-210).
// D-031 주소 가드(BLOG_LINE_OPEN·닫힌 주소 토스트)는 라우팅이라 이 파일에 남는다.
const blogStore = useBlogStore({
  page,
  openPage,
  createEntityId,
  initialSlug: readInitialBlogSlug(),
  voyageArchiveStorageKey: VOYAGE_ARCHIVE_STORAGE_KEY
})
const {
  activeBlogSlug,
  activeBlogPost,
  studioViewMode,
  studioPostId,
  studioState,
  studioLastSavedAt,
  studioSavePhase,
  writingBackupMessage,
  blogMessage,
  publishedBlogPosts,
  draftBlogPosts,
  archivedBlogPosts,
  studioPreviewHtml,
  initializeBlogWorkspace,
  createNewStudioPost,
  openStudioForPost,
  updateStudioField,
  publishStudioPost,
  archiveStudioPost,
  unpublishStudioPost,
  restoreArchivedPost,
  backupLocalWriting,
  prepareStudioTransition,
  openBlogArchive,
  setStudioViewMode,
  clearBlogMessage
} = blogStore
const staticModeMessage = ref('')
const blogClosedNotice = ref('')
const prefersReducedMotion = ref(false)
const doorTransition = ref({
  active: false,
  phase: 'idle',
  durationMs: 0,
  lineClass: 'line-w',
  label: ''
})
// 스플래시 상태·타이머는 useSplash 가 소유한다. 문 열기/페이지 전환은 라우트 문 전환과 공유하므로 여기서 한다.
const splash = useSplash({
  prefersReducedMotion,
  isActive: () => !isTestRoute.value && page.value === 'splash',
  onTransition: handleSplashTransition
})
const { currentTicker, currentSplashPhrase, splashBoardCells, splashAutoTransitionLabel } = splash
// 엘리베이터·택시 시뮬 상태/타이머는 각 composable 이 소유한다(화면과 무관하게 계속 돌고, 환승 홀 카드도 읽는다).
const elevator = useElevatorSim({ fallbackState: fallbackElevatorState, fetchJson })
const { elevatorState, elevatorCars, loadElevatorState, activateElevatorPage } = elevator
const taxi = useTaxiSim({ createEntityId })
const simHubView = ref(null)

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
  pantry: ['line-p', 'P'],
  ets2: ['line-s', 'S'],
  ets2Dev: ['line-s', 'S'],
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

  if (page.value === 'pantry') {
    return {
      line: '취향선',
      title: '자취 밥상',
      description: '오늘의 한 상과 빠른 대안을 골라 장보기와 식탁 기록까지 이어 갑니다.'
    }
  }

  if (page.value === 'ets2') {
    return {
      line: '실험선 S',
      title: '유로트럭 관제',
      description: '최근 주행 화면과 신선도, 읽기 전용 주행 정보를 한 장면으로 확인합니다.'
    }
  }

  if (page.value === 'ets2Dev') {
    return {
      line: '실험선 S · 보호 구역',
      title: '유로트럭 개발자',
      description: '로컬 PoC의 주행 상태, 감시와 복구, 게임 제어를 한곳에서 확인합니다.'
    }
  }

  if (page.value === 'work') {
    return {
      line: 'Line W / Work Manager',
      title: '운영 노트',
      description: '티켓 상태, Ready 표시, 상세 패널, preset command 를 운영실처럼 분리합니다.'
    }
  }

  return {
    line: 'Line R / Runtime Board',
    title: '정책과 실행환경',
    description: 'ion2, rtx5070, gateway 의 역할과 degraded 정책을 릴리스 레일 관점에서 정리합니다.'
  }
})




let portalRefreshTimer
let blogClosedNoticeTimer
let reducedMotionMediaQuery
let reducedMotionMediaListener
let doorTransitionRunId = 0
let doorTransitionTimers = []
let completedRouteDoorTransitions = 0
const pageScrollPositions = new Map()

watch(theme, (nextTheme) => {
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme)
    } catch (error) {
      // 테마 저장 실패는 현재 화면 사용을 막지 않는다.
    }
  }
})


onMounted(async () => {
  migrateLegacyVoyageStorage(window.localStorage)
  window.addEventListener('popstate', handleLocationPopState)
  if (typeof window.matchMedia === 'function') {
    reducedMotionMediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    prefersReducedMotion.value = reducedMotionMediaQuery.matches
    reducedMotionMediaListener = (event) => {
      prefersReducedMotion.value = event.matches
      splash.restartForMotionChange()
    }
    if (typeof reducedMotionMediaQuery.addEventListener === 'function') {
      reducedMotionMediaQuery.addEventListener('change', reducedMotionMediaListener)
    } else if (typeof reducedMotionMediaQuery.addListener === 'function') {
      reducedMotionMediaQuery.addListener(reducedMotionMediaListener)
    }
  }

  if (!isTestRoute.value && page.value === 'splash') {
    splash.start()
  } else if (!isTestRoute.value) {
    syncLiveLocation({ replace: true })
    if (pendingBlogClosedNotice) {
      pendingBlogClosedNotice = false
      showBlogClosedNotice()
    }
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
    elevator.startPolling()
  }
  taxi.start()
})

onBeforeUnmount(() => {
  clearDoorTransitionTimers()
  window.clearInterval(portalRefreshTimer)
  window.clearTimeout(blogClosedNoticeTimer)
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



function toggleTheme() {
  theme.value = theme.value === 'dark' ? 'light' : 'dark'
}

// D-031: 내려간 블로그 주소로 들어오면 환승 홀에서 한 줄만 알린다(접근 토스트 패턴 재사용).
function showBlogClosedNotice() {
  blogClosedNotice.value = BLOG_CLOSED_MESSAGE
  window.clearTimeout(blogClosedNoticeTimer)
  blogClosedNoticeTimer = window.setTimeout(() => {
    blogClosedNotice.value = ''
  }, BLOG_CLOSED_NOTICE_MS)
}

function openPage(nextPage) {
  if (isBlogClosedPage(nextPage)) {
    showBlogClosedNotice()
    if (page.value === 'junction') {
      return
    }
    nextPage = 'junction'
  }
  if (isStaticMode && STATIC_UNAVAILABLE_PAGES.has(nextPage)) {
    staticModeMessage.value = '정적 공개본에서는 사용할 수 없음'
    if (page.value !== 'junction') {
      page.value = 'junction'
      syncBrowserLocation()
    }
    return
  }
  simHubView.value?.clearNotice()
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
  const normalizedNextPage = isVersionedTestRoute.value
    ? normalizeVersionedTestView(nextPage)
    : isLegacyTestRoute.value
      ? normalizeTestView(nextPage)
      : normalizeLivePage(nextPage)
  if (normalizedNextPage === page.value) {
    focusCurrentPageHeading()
    return
  }
  if (prefersReducedMotion.value) {
    applyPageChange(normalizedNextPage)
    focusCurrentPageHeading()
    return
  }
  startRouteDoorTransition(normalizedNextPage)
}

function applyPageChange(nextPage, { replace = false } = {}) {
  const currentScroller = document.querySelector('.page-scroller')
  if (currentScroller && page.value !== 'splash') {
    pageScrollPositions.set(`${testRouteMode.value}:${page.value}`, currentScroller.scrollTop)
  }
  if (isVersionedTestRoute.value) {
    page.value = normalizeVersionedTestView(nextPage)
  } else if (isLegacyTestRoute.value) {
    page.value = normalizeTestView(nextPage)
  } else {
    page.value = normalizeLivePage(nextPage)
  }
  syncBrowserLocation({ replace })
  if (page.value === 'elevator' && !isStaticMode) {
    void activateElevatorPage()
  }
  window.requestAnimationFrame(() => {
    const savedTop = pageScrollPositions.get(`${testRouteMode.value}:${page.value}`) || 0
    document.querySelector('.page-scroller')?.scrollTo({ top: savedTop, behavior: 'auto' })
  })
}

function doorLineClassFor(pageName) {
  return (TOPBAR_LINES[pageName] || TOPBAR_LINES.junction)[0]
}

function queueDoorTransition(callback, delayMs) {
  const timer = window.setTimeout(() => {
    doorTransitionTimers = doorTransitionTimers.filter((entry) => entry !== timer)
    callback()
  }, delayMs)
  doorTransitionTimers.push(timer)
}

function clearDoorTransitionTimers() {
  doorTransitionTimers.forEach((timer) => window.clearTimeout(timer))
  doorTransitionTimers = []
}

function resetDoorTransition() {
  doorTransition.value = {
    active: false,
    phase: 'idle',
    durationMs: 0,
    lineClass: 'line-w',
    label: ''
  }
}

function focusCurrentPageHeading() {
  nextTick(() => {
    document.querySelector('.station-topbar h2')?.focus({ preventScroll: true })
  })
}

function startRouteDoorTransition(nextPage) {
  if (doorTransition.value.active) {
    return
  }
  clearDoorTransitionTimers()
  doorTransitionRunId += 1
  const runId = doorTransitionRunId
  const timing = completedRouteDoorTransitions === 0
    ? FIRST_ROUTE_DOOR_TIMING
    : REPEAT_ROUTE_DOOR_TIMING
  doorTransition.value = {
    active: true,
    phase: 'primed',
    durationMs: timing.closeMs,
    lineClass: doorLineClassFor(nextPage),
    label: ''
  }

  nextTick(() => {
    if (runId !== doorTransitionRunId) return
    document.querySelector('.door-left')?.getBoundingClientRect()
    doorTransition.value = { ...doorTransition.value, phase: 'closing' }
    queueDoorTransition(() => {
      if (runId !== doorTransitionRunId) return
      doorTransition.value = {
        ...doorTransition.value,
        phase: 'closed',
        durationMs: 0,
        label: 'DOORS CLOSING'
      }
      queueDoorTransition(() => {
        if (runId !== doorTransitionRunId) return
        applyPageChange(nextPage)
        doorTransition.value = {
          ...doorTransition.value,
          phase: 'opening',
          durationMs: timing.openMs,
          label: ''
        }
        queueDoorTransition(() => {
          if (runId !== doorTransitionRunId) return
          completedRouteDoorTransitions += 1
          resetDoorTransition()
          focusCurrentPageHeading()
        }, timing.openMs)
      }, timing.holdMs)
    }, timing.closeMs)
  })
}

function handleSplashTransition({ reducedMotion }) {
  if (reducedMotion) {
    applyPageChange('junction', { replace: true })
    focusCurrentPageHeading()
    return
  }
  startSplashDoorOpening()
}

function startSplashDoorOpening() {
  clearDoorTransitionTimers()
  doorTransitionRunId += 1
  const runId = doorTransitionRunId
  doorTransition.value = {
    active: true,
    phase: 'closed',
    durationMs: 0,
    lineClass: doorLineClassFor('junction'),
    label: ''
  }
  // TKT-201: 문이 닫힌 채로 먼저 환승 홀로 바꿔 두고, 다음 프레임에 문을 열어 환승 홀을 드러낸다.
  applyPageChange('junction', { replace: true })
  nextTick(() => {
    if (runId !== doorTransitionRunId) return
    document.querySelector('.door-left')?.getBoundingClientRect()
    doorTransition.value = {
      ...doorTransition.value,
      phase: 'opening',
      durationMs: SPLASH_DOOR_OPENING_MS
    }
    queueDoorTransition(() => {
      if (runId !== doorTransitionRunId) return
      resetDoorTransition()
      focusCurrentPageHeading()
    }, SPLASH_DOOR_OPENING_MS)
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

function countWords(text) {
  return String(text || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length
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
    if (route && isBlogClosedPage(route.page)) {
      pendingBlogClosedNotice = true
      return 'junction'
    }
    if (route && isStaticMode && STATIC_UNAVAILABLE_PAGES.has(route.page) && !STATIC_DIRECT_PREVIEW_PAGES.has(route.page)) {
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
  const route = readLiveRoute(window.location.pathname, APP_BASE_PATH)
  return route && !isBlogClosedPage(route.page) ? route.slug || '' : ''
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
  return LIVE_PAGES.includes(view) && !isBlogClosedPage(view) ? view : 'junction'
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

  splash.cancel()
  clearDoorTransitionTimers()
  doorTransitionRunId += 1
  resetDoorTransition()
  testRouteMode.value = nextMode

  if (nextMode === 'v050') {
    page.value = normalizeVersionedTestView(readVersionedTestViewParam())
  } else if (nextMode === 'v040') {
    page.value = normalizeTestView(readTestViewParam())
  } else {
    const liveRoute = readLiveRoute(window.location.pathname, APP_BASE_PATH)
    if (liveRoute && isBlogClosedPage(liveRoute.page)) {
      page.value = 'junction'
      syncLiveLocation({ replace: true })
      showBlogClosedNotice()
    } else if (liveRoute) {
      activeBlogSlug.value = liveRoute.slug
      page.value = isStaticMode && STATIC_UNAVAILABLE_PAGES.has(liveRoute.page) && !STATIC_DIRECT_PREVIEW_PAGES.has(liveRoute.page)
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

  if (page.value === 'elevator' && !isStaticMode) {
    void activateElevatorPage()
  }
  window.requestAnimationFrame(() => {
    document.querySelector('.page-scroller')?.scrollTo({ top: 0 })
  })
}


</script>

<template>
  <div
    class="app-shell"
    :class="{ 'door-transitioning': doorTransition.active }"
    :data-theme="theme"
    :aria-busy="doorTransition.active ? 'true' : undefined"
  >
    <div
      v-if="doorTransition.active"
      class="door-transition"
      :class="[doorTransition.phase, doorTransition.lineClass]"
      :style="{ '--door-duration': `${doorTransition.durationMs}ms` }"
      :data-phase="doorTransition.phase"
    >
      <span class="door-panel door-left" aria-hidden="true"></span>
      <span class="door-panel door-right" aria-hidden="true"></span>
      <span v-if="doorTransition.label" class="door-flap-label" role="status">{{ doorTransition.label }}</span>
    </div>

      <SplashView
        v-if="page === 'splash'"
        :cells="splashBoardCells"
        :phrase="currentSplashPhrase"
        :ticker="currentTicker"
        :auto-transition-label="splashAutoTransitionLabel"
        :prefers-reduced-motion="prefersReducedMotion"
        @replay="splash.replay"
      />

      <main v-else class="portal-stage" :class="{ 'writing-stage': page === 'writingStudio' }">
        <header class="station-topbar" :class="topbarLineClass">
          <SiteLoopSymbol v-if="page === 'junction'" />
          <span v-else class="roundel" :class="topbarLineClass">{{ topbarLetter }}</span>
          <h2 tabindex="-1">{{ page === 'writingStudio' ? '글쓰기' : currentRoute.title }}</h2>
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
              :static-mode="isStaticMode"
              @open="openPage"
            />

            <p v-if="staticModeMessage" class="junction-note static-mode-note" role="status">{{ staticModeMessage }}</p>

            <p
              v-if="blogClosedNotice"
              class="junction-access-toast"
              :style="{ '--toast-x': '50%', '--toast-y': 'calc(100vh - 84px)' }"
              data-blog-closed-notice
              role="status"
              aria-live="polite"
              aria-atomic="true"
            >{{ blogClosedNotice }}</p>
          </section>

          <SimHubView
            v-else-if="page === 'simhub'"
            ref="simHubView"
            :is-static-mode="isStaticMode"
            :elevator-live="elevatorState.mode === 'live-traffic-loop'"
            @open-page="openPage"
          />

          <VoyageView v-else-if="page === 'voyage'" @exit="openPage('junction')" />

          <Pantry v-else-if="page === 'pantry'" />

          <Ets2Live v-else-if="page === 'ets2'" />

          <Ets2Dev v-else-if="page === 'ets2Dev'" :static-mode="isStaticMode" />

          <ElevatorView
            v-else-if="page === 'elevator'"
            :sim="elevator"
            :is-static-mode="isStaticMode"
            :is-test-route="isTestRoute"
            :sim-hub-name="simHubLine.nameKo"
            @open-page="openPage"
          />

          <TaxiView
            v-else-if="page === 'taxi'"
            :sim="taxi"
            :is-test-route="isTestRoute"
            :sim-hub-name="simHubLine.nameKo"
            @open-page="openPage"
          />

          <BlogHubView v-else-if="page === 'bloghub'" :store="blogStore" @open-page="openPage" />

          <BlogArchiveView v-else-if="page === 'blogArchive'" :store="blogStore" />

          <BlogPostView v-else-if="page === 'blogPost'" :store="blogStore" />

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
            @update-view="setStudioViewMode"
            @exit="openPage('bloghub')"
            @publish="publishStudioPost"
            @archive="archiveStudioPost"
            @unpublish="unpublishStudioPost"
            @new-post="createNewStudioPost(false)"
            @open-post="openStudioForPost"
            @restore="restoreArchivedPost"
            @backup="backupLocalWriting"
            @clear-message="clearBlogMessage"
          />

          <WorkView v-else-if="page === 'work'" :manager="workManager" :is-static-mode="isStaticMode" />

          <RuntimeView v-else :manager="workManager" @refresh="loadPortalData" />

          <nav
            v-if="!isTestRoute"
            class="mobile-quick-nav"
            :class="{ 'mobile-quick-nav--blog-closed': !BLOG_LINE_OPEN }"
            aria-label="빠른 환승"
          >
            <button type="button" :class="{ active: page === 'junction' }" @click="openPage('junction')">노선도</button>
            <button
              v-if="BLOG_LINE_OPEN"
              type="button"
              :class="{ active: ['bloghub', 'blogArchive', 'blogPost', 'writingStudio'].includes(page) }"
              @click="openBlogArchive"
            >
              아카이브
            </button>
            <button
              type="button"
              :class="{ active: ['simhub', 'elevator', 'taxi', 'ets2', 'ets2Dev'].includes(page) }"
              @click="openPage('simhub')"
            >
              승강장
            </button>
          </nav>
        </div>
      </main>
  </div>
</template>
