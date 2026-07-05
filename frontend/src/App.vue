<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const SPLASH_DURATION_MS = 10000
const TEST_ROUTE_PATH = '/test'
const VERSIONED_TEST_ROUTE_PATH = '/test/v0-5-0'
const LIVE_PAGES = [
  'junction',
  'simhub',
  'elevator',
  'taxi',
  'bloghub',
  'blogArchive',
  'blogPost',
  'writingStudio',
  'work',
  'runtime'
]
const TESTABLE_PAGES = ['junction', 'elevator', 'work', 'runtime']
const VERSIONED_TESTABLE_PAGES = ['junction', 'taxi', 'ops', 'signals']
const BOARD_READY_STORAGE_KEY = 'workaround-ready-lane'
const THEME_STORAGE_KEY = 'workaround-theme'
const TOKEN_STORAGE_KEY = 'workaround-work-manager-token'
const BLOG_POST_STORAGE_KEY = 'workaround-blog-posts'
const BLOG_ACTIVE_SLUG_STORAGE_KEY = 'workaround-blog-active-slug'
const BLOG_STUDIO_VIEW_STORAGE_KEY = 'workaround-blog-studio-view'
const BLOG_STUDIO_POST_STORAGE_KEY = 'workaround-blog-studio-post'
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
    version: 'infra / chore',
    title: '기반 정렬',
    summary: '툴체인, 호스팅, 문서/브랜치 정리'
  }
]

const tickerPool = [
  '에스컬레이터 방향 다수결로 정하는 중…',
  '지연 시간을 정성껏 반올림하는 중…',
  '출구 번호에 서열 매기는 중…',
  '계단과 에스컬레이터 화해시키는 중…',
  '손잡이 높이 만장일치로 조정하는 중…',
  '환승 저항을 0에 수렴시키는 중…',
  '첫차의 각오를 백업하는 중…',
  '노란 안전선 자존감 챙기는 중…',
  '막차 놓친 사람 위로 캐시 불러오는 중…',
  '냉방 온도 만장일치로 정하는 중…',
  '갈아타기 최단경로가 삐지지 않게 계산하는 중…',
  '승객들의 한숨을 열차 추진력으로 재활용하는 중…',
  '오늘 치 무표정을 표준 규격에 맞추는 중…',
  '지하철 손잡이 악력 등급 매기는 중…',
  '안내방송 성우에게 따뜻한 차 대접하는 중…',
  '노선 색깔끼리 안 싸우게 중재하는 중…',
  '엘리베이터에게 오늘 기분 물어보는 중…',
  '교통카드 잔액에 위로 건네는 중…',
  '개찰구에 오늘의 운세 심는 중…',
  '관리자 몰래 내맘대로 홈페이지 로딩하는 중.',
  '월요일의 사기를 롤백하는 중…',
  '오늘의 의욕을 절전 모드에서 깨우는 중…',
  '잔소리를 캐시에서 비우는 중…',
  '참을성 잔액을 조회하는 중…',
  '어제의 후회를 아카이브로 옮기는 중…',
  '점심 메뉴 결정권을 위임하는 중…',
  '침묵의 어색함을 반올림하는 중…',
  '오후 3시의 나른함을 격리하는 중…',
  '미룬 일들의 대기표를 재정렬하는 중…',
  '양심의 알림을 스누즈하는 중…',
  '표정 관리 모듈을 재기동하는 중…',
  '금요일의 설렘을 미리 당겨 쓰는 중…',
  '게으름에게 정당한 사유를 부여하는 중…',
  '눈꺼풀의 중력을 재협상하는 중…',
  '딴생각의 트래픽을 분산하는 중…',
  '하품의 도미노를 진압하는 중…',
  '실없는 농담의 품질을 검수하는 중…',
  '결심의 롤백 지점을 저장하는 중…'
]

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
    preset: 'commute',
    presetLabel: '출근',
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
const clockText = ref(formatClock())
const currentTicker = ref(tickerPool[0])
const selectedWorkTicketId = ref('')
const selectedCommand = ref('')
const commandNote = ref('')
const workManagerPassword = ref('')
const workManagerToken = ref(readStoredWorkManagerToken())
const workManagerMessage = ref('')
const workManagerError = ref('')
const metadataTargetVersion = ref('v0.4.0')
const metadataPriority = ref('P2')
const metadataDependencies = ref('')
const metadataMessage = ref('')
const metadataError = ref('')
const isUnlockingWorkManager = ref(false)
const isRunningCommand = ref(false)
const isSavingMetadata = ref(false)
const demandPreset = ref('commute')
const demandIntensity = ref(55)
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
const activeBlogSlug = ref(readStoredBlogSlug())
const studioViewMode = ref(readStoredStudioViewMode())
const studioPostId = ref(readStoredStudioPostId())
const studioState = ref(createEmptyStudioState())
const studioSlugTouched = ref(false)
const blogMessage = ref('')
const prefersReducedMotion = ref(false)
const splashReplayKey = ref(0)

const splashRows = [
  { label: 'route', value: 'workaround central', accent: 'line-w' },
  { label: 'next', value: 'seoul subway portal', accent: 'line-e' },
  { label: 'platform', value: 'main junction', accent: 'line-r' },
  { label: 'status', value: 'transfer in ten seconds', accent: 'line-p' }
]
const splashCellCount = Math.max(...splashRows.map((row) => row.value.length))

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
      lineNo: '9',
      lineCode: 'Line S',
      name: 'Sim Hub',
      summary: '엘리베이터와 택시 시뮬레이터 환승 허브',
      detail: `${elevatorCars.value.length}대 elevator · ${taxiState.value.activeRequests.length}건 taxi 요청 진행`,
      status: 'v0.5.0 live',
      accent: 'line-p',
      cta: '시뮬 허브 열기',
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

const currentRoute = computed(() => {
  if (isVersionedTestRoute.value && page.value === 'junction') {
    return {
      line: 'UI-v0.5.0 Prototype Junction',
      title: 'seoul simulation transfer hall',
      description: '실사용 포털을 건드리지 않고, 다음 시뮬레이터 승강장과 운영 확장 레일을 분리해 검토하는 가상 허브입니다.'
    }
  }

  if (isVersionedTestRoute.value && page.value === 'taxi') {
    return {
      line: 'Line T / Taxi District Lab',
      title: 'district demand and fleet board',
      description: '서울 지하철식 환승 UX 위에서 택시 수요, 차량, 리워드 루프를 새로 설계하는 시뮬레이터 승강장입니다.'
    }
  }

  if (isVersionedTestRoute.value && page.value === 'ops') {
    return {
      line: 'Line O / Crew Board',
      title: 'worker visibility and review rail',
      description: '누가 어떤 티켓을 잡았는지, 우선순위가 어떻게 반응해야 하는지 운영 확장 레일로 정리합니다.'
    }
  }

  if (isVersionedTestRoute.value && page.value === 'signals') {
    return {
      line: 'Line S / Signal Room',
      title: 'live vs prototype separation',
      description: '실사용 경로와 가상 디자인 레일의 경계, handoff, 검수 위치를 신호실처럼 고정합니다.'
    }
  }

  if (page.value === 'junction') {
    return {
      line: 'Main Junction',
      title: 'workaround central',
      description: '기능을 직접 실행하지 않고, 실제 페이지로 환승시키는 메인 허브입니다.'
    }
  }

  if (page.value === 'elevator') {
    return {
      line: 'Line E / Elevator Station',
      title: 'vertical dispatch platform',
      description: '23층 건물의 층별 대기 인원, car 적재량, 목적층 흐름을 실제 상태로 읽습니다.'
    }
  }

  if (page.value === 'simhub') {
    return {
      line: 'Line S / Sim Hub',
      title: 'simulation transfer hall',
      description: '메인 허브에서 시뮬레이션만 분리해 Elevator 와 Taxi 로 갈라지는 중간 환승면입니다.'
    }
  }

  if (page.value === 'taxi') {
    return {
      line: 'Line T / Taxi District Lab',
      title: 'district dispatch simulator',
      description: '9구역 수요, 차량 배치, 리워드/패널티 루프를 프런트 단독 코어로 돌립니다.'
    }
  }

  if (page.value === 'bloghub') {
    return {
      line: 'Line B / Blog District',
      title: 'archive and writing district',
      description: '긴 글 읽기와 글쓰기 스튜디오를 시뮬레이터와 다른 리듬으로 분리한 글 공간입니다.'
    }
  }

  if (page.value === 'blogArchive') {
    return {
      line: 'Line B / Public Archive',
      title: 'published post archive',
      description: '공개된 글만 모아 차분한 목록 리듬으로 읽는 아카이브 레일입니다.'
    }
  }

  if (page.value === 'blogPost') {
    return {
      line: 'Line B / Post Detail',
      title: activeBlogPost.value?.title || 'reading platform',
      description: '긴 글은 패널보다 문서처럼 읽혀야 하므로, 폭과 줄 간격을 차분하게 제한합니다.'
    }
  }

  if (page.value === 'writingStudio') {
    return {
      line: 'Line B / Writing Studio',
      title: 'draft, preview, publish',
      description: '작성 집중 레이어와 상태 레이어를 나눈 단일 작성자용 글쓰기 스튜디오입니다.'
    }
  }

  if (page.value === 'work') {
    return {
      line: 'Line W / Work Manager',
      title: 'operations control deck',
      description: '티켓 상태, Ready 표시, 상세 패널, preset command 를 운영실처럼 분리합니다.'
    }
  }

  return {
    line: 'Line R / Runtime Board',
    title: 'policy and runtime route',
    description: 'ion2, rtx5070, gateway 의 역할과 degraded 정책을 릴리스 레일 관점에서 정리합니다.'
  }
})

const elevatorSummary = computed(() => elevatorState.value.summary || fallbackElevatorState.summary)
const elevatorDemand = computed(() => elevatorState.value.demand || fallbackElevatorState.demand)
const elevatorCars = computed(() => elevatorState.value.elevators || fallbackElevatorState.elevators)

const elevatorFloorRows = computed(() => {
  const building = elevatorState.value.building || fallbackElevatorState.building
  const floorQueues = elevatorState.value.floorQueues || []
  const queueMap = new Map(floorQueues.map((entry) => [Number(entry.floor), entry]))
  const floors = []
  for (let floor = building.maxFloor; floor >= building.minFloor; floor -= 1) {
    const queue = queueMap.get(floor) || {
      floor,
      up: 0,
      down: 0,
      topDestinations: { up: [], down: [] }
    }
    floors.push({
      floor,
      up: queue.up ?? 0,
      down: queue.down ?? 0,
      topUp: formatTopDestinations(queue.topDestinations?.up),
      topDown: formatTopDestinations(queue.topDestinations?.down)
    })
  }
  return floors
})

const elevatorArrivals = computed(() => {
  const completedCalls = elevatorState.value.completedCalls || []
  if (completedCalls.length > 0) {
    return completedCalls.slice(-8).reverse().map((entry) => {
      const car = entry.assignedElevatorId || entry.assignedElevatorIds?.[0] || 'E?'
      const count = entry.passengerCount ?? 1
      return `${car} · ${entry.floor}F · ${entry.direction === 'down' ? '하행' : '상행'} ${count}명 처리`
    })
  }

  const completedPassengers = elevatorState.value.completedPassengers || []
  if (completedPassengers.length > 0) {
    return completedPassengers.slice(-8).reverse().map((passenger) => {
      return `${passenger.assignedElevatorId || 'E?'} · ${passenger.originFloor}F -> ${passenger.destinationFloor}F · 1명 도착`
    })
  }

  return [
    '최근 도착 로그가 아직 없습니다.',
    '수요를 올리거나 상행/하행 1명 추가를 눌러 흐름을 확인해 주세요.'
  ]
})

const simHubCards = computed(() => [
  {
    key: 'elevator',
    page: 'elevator',
    lineNo: '4',
    lineCode: 'Line E',
    name: 'Elevator Station',
    summary: `${elevatorSummary.value.waitingPassengers}명 대기 · ${elevatorCars.value.length}대 운행`,
    detail: '23층 수직 보드, 수요 프리셋, car 수 조절, 연속 위치 확인',
    status: elevatorState.value.mode === 'live-traffic-loop' ? '실시간 루프' : '저하 운행',
    accent: 'line-e',
    cta: '엘리베이터 열기',
    tickets: ['TKT-049']
  },
  {
    key: 'taxi',
    page: 'taxi',
    lineNo: '9',
    lineCode: 'Line T',
    name: 'Taxi District Lab',
    summary: `${taxiState.value.activeRequests.length}건 진행 · reward ${formatSignedValue(taxiRewardSummary.value.net)}`,
    detail: '9구역 수요, 랜덤/수동 호출, 배차와 리워드를 같은 보드에서 본다.',
    status: 'frontend core',
    accent: 'line-p',
    cta: '택시 승강장 열기',
    tickets: ['TKT-024', 'TKT-025']
  },
  {
    key: 'blog',
    page: 'bloghub',
    lineNo: 'B',
    lineCode: 'Line B',
    name: 'Blog District',
    summary: `${publishedBlogPosts.value.length}편 공개 · draft ${draftBlogPosts.value.length}편`,
    detail: '공개 아카이브, 글 상세, Writing Studio 를 한 라인으로 잇는다.',
    status: 'seed archive',
    accent: 'line-b',
    cta: '블로그 라인 열기',
    tickets: ['TKT-050', 'TKT-051', 'TKT-052']
  }
])

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
    { label: 'active requests', value: String(taxiState.value.activeRequests.length) },
    { label: 'completed rides', value: String(completed.length) },
    { label: 'avg wait', value: `${averageWait.toFixed(1)}s` },
    { label: 'fleet', value: String(taxiFleet.value.length) }
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
  const published = publishedBlogPosts.value
  if (published.length === 0) {
    return null
  }
  return published.find((post) => post.slug === activeBlogSlug.value) || published[0]
})
const activeBlogPostIndex = computed(() =>
  publishedBlogPosts.value.findIndex((post) => post.slug === activeBlogPost.value?.slug)
)
const adjacentBlogPosts = computed(() => ({
  previous:
    activeBlogPostIndex.value >= 0 ? publishedBlogPosts.value[activeBlogPostIndex.value + 1] || null : null,
  next:
    activeBlogPostIndex.value > 0 ? publishedBlogPosts.value[activeBlogPostIndex.value - 1] || null : null
}))
const blogHeroStats = computed(() => {
  const latestPublished = publishedBlogPosts.value[0]
  return [
    { label: 'published', value: String(publishedBlogPosts.value.length) },
    { label: 'draft', value: String(draftBlogPosts.value.length) },
    { label: 'archived', value: String(archivedBlogPosts.value.length) },
    { label: 'last publish', value: latestPublished ? formatDate(latestPublished.publishedAt) : '없음' }
  ]
})
const studioPreviewHtml = computed(() => renderMarkdownToHtml(studioState.value.bodyMarkdown))
const studioWordCount = computed(() => countWords(studioState.value.bodyMarkdown))
const studioReadingMinutes = computed(() => Math.max(1, Math.ceil(studioWordCount.value / 230)))

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
      helper: 'worker agent 다른 작업 중...',
      tickets: readyTickets
    },
    {
      status: 'started',
      label: 'Started',
      helper: '실제 worker 수행 구간',
      tickets: normalized.get('started')?.tickets || []
    },
    {
      status: 'need_review',
      label: 'Need Review',
      helper: 'PM agent 확인중...',
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
const splashDisplayRows = computed(() =>
  splashRows.map((row, rowIndex) => ({
    ...row,
    cells: row.value
      .padEnd(splashCellCount, ' ')
      .split('')
      .map((character, charIndex) => ({
        key: `${splashReplayKey.value}-${row.label}-${rowIndex}-${charIndex}`,
        display: character === ' ' ? '\u00A0' : character
      }))
  }))
)

let splashTimer
let clockTimer
let tickerTimer
let portalRefreshTimer
let elevatorRefreshTimer
let taxiSimulationTimer
let reducedMotionMediaQuery
let reducedMotionMediaListener

watch(theme, (nextTheme) => {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme)
  }
})

watch(workManagerToken, (nextToken) => {
  if (typeof window === 'undefined') {
    return
  }

  if (nextToken) {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, nextToken)
  } else {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY)
  }
})

watch(blogPosts, (nextPosts) => {
  persistBlogPosts(nextPosts)
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
    if (studioSlugTouched.value && studioState.value.slug) {
      return
    }
    studioState.value.slug = slugify(nextTitle)
  }
)

onMounted(async () => {
  if (!isTestRoute.value) {
    scheduleSplashTransition()
  } else {
    syncTestLocation()
  }

  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    reducedMotionMediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    prefersReducedMotion.value = reducedMotionMediaQuery.matches
    reducedMotionMediaListener = (event) => {
      prefersReducedMotion.value = event.matches
    }
    if (typeof reducedMotionMediaQuery.addEventListener === 'function') {
      reducedMotionMediaQuery.addEventListener('change', reducedMotionMediaListener)
    } else if (typeof reducedMotionMediaQuery.addListener === 'function') {
      reducedMotionMediaQuery.addListener(reducedMotionMediaListener)
    }
  }

  currentTicker.value = pickNextTicker([])
  tickerTimer = window.setInterval(() => {
    currentTicker.value = pickNextTicker([currentTicker.value])
  }, 2600)

  clockTimer = window.setInterval(() => {
    clockText.value = formatClock()
  }, 1000)

  await loadPortalData()
  initializeBlogWorkspace()

  portalRefreshTimer = window.setInterval(() => {
    loadPortalData({ refreshElevator: false })
  }, 8000)

  elevatorRefreshTimer = window.setInterval(() => {
    loadElevatorState()
  }, 900)

  taxiSimulationTimer = window.setInterval(() => {
    advanceTaxiSimulation()
  }, 1200)
})

onBeforeUnmount(() => {
  window.clearTimeout(splashTimer)
  window.clearInterval(clockTimer)
  window.clearInterval(tickerTimer)
  window.clearInterval(portalRefreshTimer)
  window.clearInterval(elevatorRefreshTimer)
  window.clearInterval(taxiSimulationTimer)
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
    intensity: demandIntensity.value
  })
  await loadElevatorState()
}

async function updateDemandIntensity(nextValue) {
  const intensity = Number(nextValue)
  demandIntensity.value = intensity
  await postElevatorJson('/api/services/elevator-service/api/demand', {
    preset: demandPreset.value,
    intensity
  })
}

async function addPassenger(direction) {
  const originFloor = direction === 'up' ? 1 : elevatorState.value.building?.maxFloor || 23
  await postElevatorJson('/api/services/elevator-service/api/passenger', {
    floor: originFloor,
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
    spawnTaxiRequest(nextState, {
      source: 'auto'
    })
  }

  assignPendingTaxiRequests(nextState)

  for (const taxi of nextState.taxis) {
    if (taxi.route.length === 0) {
      if (taxi.status === 'pickup' && taxi.assignedRequestId) {
        const request = nextState.activeRequests.find((item) => item.id === taxi.assignedRequestId)
        if (request) {
          request.status = 'onboard'
          request.pickedUpAt = nextState.clock.elapsedSeconds
          taxi.status = 'dropoff'
          taxi.passengerCount = request.passengers
          taxi.targetZoneId = request.destinationId
          taxi.route = buildTaxiRoute(taxi.zoneId, request.destinationId).slice(1)
        }
      } else if (taxi.status === 'dropoff' && taxi.assignedRequestId) {
        completeTaxiRequest(nextState, taxi)
      } else {
        taxi.status = 'idle'
      }
      continue
    }

    taxi.progress += 1
    if (taxi.progress < taxi.stepDuration) {
      continue
    }

    taxi.progress = 0
    const nextZone = taxi.route.shift()
    if (!nextZone) {
      continue
    }
    taxi.zoneId = nextZone
    taxi.positionLabel = findTaxiZone(nextZone)?.name || nextZone

    if (taxi.status === 'to-origin' && taxi.zoneId === taxi.targetZoneId) {
      taxi.status = 'pickup'
    } else if (taxi.status === 'dropoff' && taxi.zoneId === taxi.targetZoneId && taxi.route.length === 0) {
      completeTaxiRequest(nextState, taxi)
    }
  }

  taxiState.value = nextState
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
  assignPendingTaxiRequests(nextState)
  taxiState.value = nextState
  taxiMessage.value = '수동 호출을 추가했습니다.'
}

function addTaxiFleetUnit() {
  const nextState = cloneTaxiState(taxiState.value)
  const homeZone = TAXI_ZONE_DEFINITIONS[nextState.taxis.length % TAXI_ZONE_DEFINITIONS.length]
  nextState.taxis.push(createTaxiCab(nextState.taxis.length + 1, homeZone.id))
  nextState.score.penalty += 12
  nextState.eventLog.unshift(`차량 추가 배치 · ${homeZone.name} · penalty -12`)
  nextState.eventLog = nextState.eventLog.slice(0, 12)
  assignPendingTaxiRequests(nextState)
  taxiState.value = nextState
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
  const blank = createEmptyStudioState()
  studioState.value = blank
  studioPostId.value = blank.id
  studioSlugTouched.value = false
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
  populateStudio(post)
  openPage('writingStudio')
}

function populateStudio(post) {
  studioState.value = {
    id: post.id,
    title: post.title,
    slug: post.slug,
    summary: post.summary,
    bodyMarkdown: post.bodyMarkdown,
    status: post.status,
    tags: [...(post.tags || [])].join(', '),
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    publishedAt: post.publishedAt || ''
  }
  studioPostId.value = post.id
  studioSlugTouched.value = false
}

function setStudioSlug(value) {
  studioSlugTouched.value = true
  studioState.value.slug = slugify(value)
}

function saveStudioDraft() {
  persistStudioPost('draft')
  blogMessage.value = '초안을 저장했습니다.'
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

function persistStudioPost(nextStatus) {
  const nowIso = new Date().toISOString()
  const title = studioState.value.title.trim()
  const summary = studioState.value.summary.trim()
  const bodyMarkdown = studioState.value.bodyMarkdown.trim()
  if (!title || !summary || !bodyMarkdown) {
    blogMessage.value = '제목, 요약, 본문을 모두 입력해야 저장할 수 있습니다.'
    return null
  }

  const current = blogPosts.value.find((post) => post.id === studioState.value.id)
  const createdAt = current?.createdAt || nowIso
  const status = nextStatus || studioState.value.status || 'draft'
  const slug = ensureUniqueSlug(
    studioState.value.slug || studioState.value.title,
    current?.id || studioState.value.id
  )
  const publishedAt =
    status === 'published' ? current?.publishedAt || studioState.value.publishedAt || nowIso : ''

  const nextPost = {
    id: current?.id || studioState.value.id || createEntityId('post'),
    slug,
    title,
    summary,
    bodyMarkdown,
    status,
    tags: studioState.value.tags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean),
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

  blogPosts.value = nextPosts
  populateStudio(nextPost)
  return nextPost
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
    workManagerToken.value = response.token || ''
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

  if (!workManagerToken.value) {
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

  if (!workManagerToken.value) {
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
    workManagerError.value = error.message || '명령 실행에 실패했습니다.'
  } finally {
    isRunningCommand.value = false
  }
}

function logoutWorkManager() {
  workManagerToken.value = ''
  workManagerMessage.value = 'Command gate 를 잠갔습니다.'
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
  splashReplayKey.value += 1
  if (!isTestRoute.value && page.value === 'splash') {
    scheduleSplashTransition()
  }
}

function openPage(nextPage) {
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
  syncTestLocation()
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

function skipSplash() {
  window.clearTimeout(splashTimer)
  openPage('junction')
}

function scheduleSplashTransition() {
  window.clearTimeout(splashTimer)
  splashTimer = window.setTimeout(() => {
    page.value = 'junction'
  }, SPLASH_DURATION_MS)
}

function directionGlyph(direction) {
  if (direction === 'up') return '↑'
  if (direction === 'down') return '↓'
  return '·'
}

function isCarNearFloor(position, floor) {
  return Math.abs(Number(position ?? 0) - floor) < 0.55
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

function cloneTaxiState(state) {
  return {
    ...state,
    clock: { ...state.clock },
    zones: state.zones.map((zone) => ({ ...zone })),
    taxis: state.taxis.map((taxi) => ({ ...taxi, route: [...taxi.route] })),
    activeRequests: state.activeRequests.map((request) => ({ ...request })),
    completedRequests: state.completedRequests.map((request) => ({ ...request })),
    score: { ...state.score },
    eventLog: [...state.eventLog]
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

function assignPendingTaxiRequests(state) {
  const pending = state.activeRequests
    .filter((request) => request.status === 'pending')
    .sort((left, right) => right.passengers - left.passengers || left.createdTick - right.createdTick)

  for (const request of pending) {
    const availableTaxi = pickBestTaxi(state, request)
    if (!availableTaxi) {
      continue
    }

    availableTaxi.assignedRequestId = request.id
    availableTaxi.status = 'to-origin'
    availableTaxi.targetZoneId = request.originId
    availableTaxi.route = buildTaxiRoute(availableTaxi.zoneId, request.originId).slice(1)
    availableTaxi.progress = 0
    request.status = 'assigned'
    request.assignedTaxiId = availableTaxi.id
  }
}

function pickBestTaxi(state, request) {
  return [...state.taxis]
    .filter((taxi) => taxi.status === 'idle' && taxi.seats >= request.passengers)
    .sort((left, right) => {
      const leftDistance = buildTaxiRoute(left.zoneId, request.originId).length
      const rightDistance = buildTaxiRoute(right.zoneId, request.originId).length
      return leftDistance - rightDistance || left.id.localeCompare(right.id)
    })[0]
}

function buildTaxiRoute(originId, destinationId) {
  if (originId === destinationId) {
    return [originId]
  }

  const visited = new Set([originId])
  const queue = [[originId]]
  while (queue.length > 0) {
    const path = queue.shift()
    const current = path[path.length - 1]
    const zone = findTaxiZone(current)
    for (const neighbor of zone?.neighbors || []) {
      if (visited.has(neighbor)) {
        continue
      }
      const nextPath = [...path, neighbor]
      if (neighbor === destinationId) {
        return nextPath
      }
      visited.add(neighbor)
      queue.push(nextPath)
    }
  }
  return [originId, destinationId]
}

function completeTaxiRequest(state, taxi) {
  const requestIndex = state.activeRequests.findIndex((item) => item.id === taxi.assignedRequestId)
  if (requestIndex < 0) {
    taxi.status = 'idle'
    taxi.assignedRequestId = ''
    taxi.passengerCount = 0
    return
  }

  const request = state.activeRequests[requestIndex]
  const completed = {
    ...request,
    status: 'completed',
    completedAt: state.clock.elapsedSeconds,
    waitSeconds: Number((request.pickedUpAt - request.createdTick).toFixed(1)),
    tripSeconds: Number((state.clock.elapsedSeconds - request.pickedUpAt).toFixed(1))
  }
  const reward = Math.max(8, 42 - completed.waitSeconds - completed.tripSeconds + (completed.passengers * 3))
  state.score.reward += reward
  state.completedRequests.push({ ...completed, reward })
  state.completedRequests = state.completedRequests.slice(-16)
  state.activeRequests.splice(requestIndex, 1)
  taxi.status = 'idle'
  taxi.assignedRequestId = ''
  taxi.passengerCount = 0
  taxi.targetZoneId = taxi.zoneId
  taxi.route = []
  state.eventLog.unshift(`${taxi.id} 완료 · reward +${reward} · ${findTaxiZone(completed.destinationId)?.name}`)
  state.eventLog = state.eventLog.slice(0, 12)
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
    tags: '',
    createdAt: nowIso,
    updatedAt: nowIso,
    publishedAt: ''
  }
}

function createEntityId(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
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

function renderMarkdownToHtml(markdown) {
  const lines = escapeHtml(String(markdown || '')).replace(/\r\n/g, '\n').split('\n')
  const html = []
  let inList = false
  let inCode = false

  for (const line of lines) {
    if (line.startsWith('```')) {
      if (inList) {
        html.push('</ul>')
        inList = false
      }
      html.push(inCode ? '</code></pre>' : '<pre class="post-code"><code>')
      inCode = !inCode
      continue
    }

    if (inCode) {
      html.push(`${line}\n`)
      continue
    }

    if (!line.trim()) {
      if (inList) {
        html.push('</ul>')
        inList = false
      }
      continue
    }

    if (line.startsWith('- ')) {
      if (!inList) {
        html.push('<ul>')
        inList = true
      }
      html.push(`<li>${inlineMarkdown(line.slice(2))}</li>`)
      continue
    }

    if (inList) {
      html.push('</ul>')
      inList = false
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
      html.push(`<blockquote>${inlineMarkdown(line.slice(2))}</blockquote>`)
      continue
    }

    html.push(`<p>${inlineMarkdown(line)}</p>`)
  }

  if (inList) {
    html.push('</ul>')
  }
  if (inCode) {
    html.push('</code></pre>')
  }

  return html.join('')
}

function inlineMarkdown(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
}

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
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

function formatClock() {
  return new Date().toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

function formatTopDestinations(destinations) {
  if (!Array.isArray(destinations) || destinations.length === 0) {
    return '없음'
  }
  return destinations
    .slice(0, 2)
    .map((entry) => `${entry.floor}F ${entry.count}명`)
    .join(', ')
}

function formatLoadRatio(value) {
  const ratio = Number(value || 0)
  return `${Math.round(ratio * 100)}%`
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
  const data = text ? JSON.parse(text) : {}
  if (!response.ok) {
    throw new Error(data.message || data.error || response.statusText || 'Request failed')
  }
  return data
}

function readInitialTheme() {
  if (typeof window === 'undefined') {
    return 'dark'
  }

  const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
  if (stored === 'light' || stored === 'dark') {
    return stored
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
  const mode = readTestRouteMode()
  if (mode === 'live') {
    return 'splash'
  }
  if (mode === 'v050') {
    return normalizeVersionedTestView(readVersionedTestViewParam())
  }
  return normalizeTestView(readTestViewParam())
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

  const parts = window.location.pathname.split('/').filter(Boolean)
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

function pickNextTicker(excluded = []) {
  const blocked = new Set(excluded)
  const candidates = tickerPool.filter((line) => !blocked.has(line))
  const nextPool = candidates.length > 0 ? candidates : tickerPool
  return nextPool[Math.floor(Math.random() * nextPool.length)]
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
  window.localStorage.setItem(BOARD_READY_STORAGE_KEY, JSON.stringify(ticketIds))
}

function readStoredWorkManagerToken() {
  if (typeof window === 'undefined') {
    return ''
  }
  return window.localStorage.getItem(TOKEN_STORAGE_KEY) || ''
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
    return
  }
  window.localStorage.setItem(BLOG_POST_STORAGE_KEY, JSON.stringify(posts))
}

function readStoredBlogSlug() {
  if (typeof window === 'undefined') {
    return ''
  }
  return window.localStorage.getItem(BLOG_ACTIVE_SLUG_STORAGE_KEY) || ''
}

function persistBlogSlug(slug) {
  if (typeof window === 'undefined') {
    return
  }
  if (slug) {
    window.localStorage.setItem(BLOG_ACTIVE_SLUG_STORAGE_KEY, slug)
    return
  }
  window.localStorage.removeItem(BLOG_ACTIVE_SLUG_STORAGE_KEY)
}

function readStoredStudioViewMode() {
  if (typeof window === 'undefined') {
    return 'split'
  }
  return window.localStorage.getItem(BLOG_STUDIO_VIEW_STORAGE_KEY) || 'split'
}

function persistStudioViewMode(mode) {
  if (typeof window === 'undefined') {
    return
  }
  window.localStorage.setItem(BLOG_STUDIO_VIEW_STORAGE_KEY, mode)
}

function readStoredStudioPostId() {
  if (typeof window === 'undefined') {
    return ''
  }
  return window.localStorage.getItem(BLOG_STUDIO_POST_STORAGE_KEY) || ''
}

function persistStudioPostId(postId) {
  if (typeof window === 'undefined') {
    return
  }
  if (postId) {
    window.localStorage.setItem(BLOG_STUDIO_POST_STORAGE_KEY, postId)
    return
  }
  window.localStorage.removeItem(BLOG_STUDIO_POST_STORAGE_KEY)
}
</script>

<template>
  <div class="app-shell" :data-theme="theme">
    <transition name="fade" mode="out-in">
      <section v-if="page === 'splash'" class="splash-stage">
        <div class="splash-panel">
          <div class="splash-top">
            <div class="line-badge line-w">2</div>
            <div>
              <p class="eyebrow">Seoul Subway Portal</p>
              <h1>workaround central</h1>
            </div>
            <div class="clock-box">
              <span>transfer</span>
              <strong>{{ clockText }}</strong>
            </div>
          </div>

          <div class="flap-board" :class="{ 'reduced-motion': prefersReducedMotion }">
            <div
              v-for="(row, rowIndex) in splashDisplayRows"
              :key="row.label"
              class="flap-row"
              :class="row.accent"
            >
              <span class="flap-label">{{ row.label }}</span>
              <div class="flap-values">
                <span
                  v-for="(cell, charIndex) in row.cells"
                  :key="cell.key"
                  class="flap-cell"
                  :class="[row.accent, { run: !prefersReducedMotion }]"
                  :style="{ '--row-order': rowIndex, '--tile-order': charIndex }"
                >
                  <span class="flap-half flap-static flap-top"><b>{{ cell.display }}</b></span>
                  <span class="flap-half flap-static flap-bottom"><b>{{ cell.display }}</b></span>
                  <span class="flap-half flap-dynamic flap-top-flip"><b>{{ cell.display }}</b></span>
                  <span class="flap-half flap-dynamic flap-bottom-flip"><b>{{ cell.display }}</b></span>
                </span>
              </div>
            </div>
          </div>

          <div class="ticker-strip">
            <span class="ticker-label">notice</span>
            <span class="ticker-copy">{{ currentTicker }}</span>
          </div>

          <div class="arrival-grid">
            <article>
              <span>main page</span>
              <strong>10초 후 자동 전환</strong>
            </article>
            <article>
              <span>runtime</span>
              <strong>{{ runtimeState.ollama?.status || 'unknown' }}</strong>
            </article>
            <article>
              <span>mobile</span>
              <strong>세로 카드 스택 우선</strong>
            </article>
          </div>
        </div>

        <div class="splash-actions">
          <p>메인 페이지는 대시보드가 아니라 환승 허브로 동작하고, 실제 기능은 각 플랫폼에서 이어집니다.</p>
          <button type="button" class="ghost-button" @click="replaySplashFlap">다시 재생</button>
          <button type="button" class="ghost-button" @click="skipSplash">바로 환승 홀로 이동</button>
        </div>
      </section>

      <main v-else class="portal-stage">
        <header class="portal-header">
          <div>
            <p class="eyebrow">{{ currentRoute.line }}</p>
            <h2>{{ currentRoute.title }}</h2>
            <p class="header-copy">{{ currentRoute.description }}</p>
          </div>

          <div class="header-actions">
            <button
              v-if="page !== 'junction'"
              type="button"
              class="primary-button"
              @click="openPage('junction')"
            >
              Main page 환승 홀로
            </button>
            <button type="button" class="ghost-button" @click="toggleTheme">
              {{ theme === 'dark' ? '라이트 모드' : '다크 모드' }}
            </button>
          </div>
        </header>

        <section class="wayfinding-bar">
          <span>현재 위치 {{ currentRoute.line }}</span>
          <span>서비스 {{ servicesState.length }}개 연결</span>
          <span>gateway {{ healthState.status }}</span>
          <span>Exit 1 Main page</span>
        </section>

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
              <section class="platform-banner line-p">
                <div>
                  <p class="eyebrow">Line T / Taxi District Lab</p>
                  <h3>가상 도시 수요 보드</h3>
                  <p>
                    `v0.5.0` 택시 시뮬레이터는 표만 많은 화면이 아니라, 구역과 요청과 차량의 관계가 먼저 보이는
                    승강장이어야 합니다. 지도 감각, 리워드, 차량 재배치 비용을 한 레일에서 같이 읽습니다.
                  </p>
                </div>

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
              <section class="platform-banner line-w">
                <div>
                  <p class="eyebrow">Line O / Crew Board</p>
                  <h3>worker 가시화 확장</h3>
                  <p>
                    `v0.4.0` Work Manager 가 상태와 command gate 를 복구했다면, `v0.5.0` 은 누가 어떤 티켓을 집었는지와
                    우선순위가 실제 반응으로 어떻게 이어지는지를 보이게 해야 합니다.
                  </p>
                </div>

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
              <section class="platform-banner line-r">
                <div>
                  <p class="eyebrow">Line S / Signal Room</p>
                  <h3>실사용 레일과 가상 레일의 분리</h3>
                  <p>
                    이번 버전의 핵심은 새 디자인을 빠르게 보되, 기존 실사용 경로를 절대 덮어쓰지 않는 것입니다.
                    오케스트레이터는 이 신호실을 보고 어디를 구현하고 어디를 문서 review 로 남길지 구분합니다.
                  </p>
                </div>

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
            <section class="hero-panel">
              <div>
                <p class="eyebrow">Transfer Hall</p>
                <h3>메인에서는 길을 고르고, 실제 조작은 각 승강장으로 들어가서 합니다.</h3>
                <p>
                  허브는 지금 연결된 상태를 요약해서 보여주는 구간입니다. Elevator, Work Manager,
                  Runtime 은 각자의 책임을 가진 페이지에서만 자세히 노출합니다.
                </p>
              </div>

              <div class="hero-metrics">
                <article v-for="metric in heroMetrics" :key="metric.label">
                  <span>{{ metric.label }}</span>
                  <strong>{{ metric.value }}</strong>
                </article>
              </div>
            </section>

            <section class="section-block">
              <div class="section-head">
                <div>
                  <p class="eyebrow">Route Cards</p>
                  <h3>노선 입구</h3>
                </div>
                <span>메인에서는 실제 시뮬레이터 표와 운영 보드를 직접 펼치지 않습니다.</span>
              </div>

              <div class="line-grid">
                <article
                  v-for="card in lineCards"
                  :key="card.key"
                  class="line-card"
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

                  <button
                    type="button"
                    class="line-cta"
                    :disabled="card.page === 'junction'"
                    @click="openPage(card.page)"
                  >
                    {{ card.cta }}
                  </button>
                </article>
              </div>
            </section>

            <section class="section-block">
              <div class="section-head">
                <div>
                  <p class="eyebrow">Orchestrator Review</p>
                  <h3>티켓 슬라이스 힌트</h3>
                </div>
                <span>디자인 더미는 `/test` 에 남기고, 실제 포털은 여기에서 다시 살아 있는 데이터를 유지합니다.</span>
              </div>

              <div class="slice-grid">
                <article v-for="slice in orchestratorSlices" :key="slice.name" class="slice-card">
                  <div class="slice-top">
                    <strong>{{ slice.name }}</strong>
                    <span>{{ slice.ticket }}</span>
                  </div>
                  <p>{{ slice.body }}</p>
                </article>
              </div>
            </section>

            <section class="section-block split-layout">
              <article class="rail-map-panel">
                <div class="section-head">
                  <div>
                    <p class="eyebrow">Transfer Map</p>
                    <h3>허브 노선도</h3>
                  </div>
                </div>

                <div class="rail-strip">
                  <div class="rail-line"></div>
                  <div class="station-node left-0">
                    <span class="station-badge line-r">1</span>
                    <strong>Runtime</strong>
                  </div>
                  <div class="station-node left-25">
                    <span class="station-badge line-w">2</span>
                    <strong>Main Junction</strong>
                  </div>
                  <div class="station-node left-46">
                    <span class="station-badge line-p">9</span>
                    <strong>Sim Hub</strong>
                  </div>
                  <div class="station-node left-66">
                    <span class="station-badge line-e">4</span>
                    <strong>Elevator</strong>
                  </div>
                  <div class="station-node left-86">
                    <span class="station-badge line-b">B</span>
                    <strong>Blog</strong>
                  </div>
                </div>

                <p class="rail-caption">
                  메인은 환승 홀이고, 기능 페이지는 승강장입니다. 허브가 길어질수록 포털은 흐려지고, 승강장이 분명할수록 사용성은 좋아집니다.
                </p>
              </article>

              <article class="mobile-panel">
                <div class="section-head">
                  <div>
                    <p class="eyebrow">Mobile First</p>
                    <h3>모바일 동선</h3>
                  </div>
                </div>

                <div class="mobile-stack-preview">
                  <div class="mobile-card">1. 현재 상태</div>
                  <div class="mobile-card">2. 노선 선택</div>
                  <div class="mobile-card">3. 기능 진입</div>
                </div>

                <ul class="check-list">
                  <li v-for="item in mobileCheckpoints" :key="item">{{ item }}</li>
                </ul>
              </article>
            </section>
          </section>

          <section v-else-if="page === 'simhub'" class="feature-shell">
            <section class="platform-banner line-p">
              <div>
                <p class="eyebrow">Line S / Sim Hub</p>
                <h3>시뮬레이션만 따로 모은 환승 허브</h3>
                <p>
                  메인 허브를 다시 거대한 조작판으로 되돌리지 않고, 실제 시뮬레이터 선택과 상태 요약만 담당하는
                  중간 환승면입니다. Elevator 는 품질 개선 패치가 붙었고, Taxi 는 프런트 단독 코어로 바로 들어갑니다.
                </p>
              </div>

              <div class="banner-stats">
                <article>
                  <span>simulation lines</span>
                  <strong>{{ simHubCards.length }}</strong>
                </article>
                <article>
                  <span>taxi requests</span>
                  <strong>{{ taxiState.activeRequests.length }}</strong>
                </article>
                <article>
                  <span>elevator cars</span>
                  <strong>{{ elevatorCars.length }}</strong>
                </article>
              </div>
            </section>

            <section class="section-block">
              <div class="section-head">
                <div>
                  <p class="eyebrow">Transfer Cards</p>
                  <h3>시뮬 레일 선택</h3>
                </div>
                <span>Main Junction 에서는 분기만 보여주고, 실제 상태는 여기에서 한 번 더 요약합니다.</span>
              </div>

              <div class="line-grid">
                <article
                  v-for="card in simHubCards"
                  :key="card.key"
                  class="line-card"
                  :class="card.accent"
                >
                  <div class="line-card-top">
                    <div class="line-mark">
                      <span class="line-round" :class="card.accent">{{ card.lineNo }}</span>
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
          </section>

          <section v-else-if="page === 'elevator'" class="feature-shell">
            <section class="platform-banner line-e">
              <div>
                <p class="eyebrow">Line E / Elevator Station</p>
                <h3>23층 수직 승강장</h3>
                <p>
                  승객 수, 목적층, 현재 적재 인원, 층 사이 연속 위치를 실제 시뮬레이터 상태로 읽습니다.
                  수동 버튼은 상행/하행 1명 추가 단위로 동작하고, step 은 디버그 보조 제어로만 남깁니다.
                </p>
              </div>

              <div class="banner-stats">
                <article>
                  <span>demand</span>
                  <strong>{{ elevatorDemand.presetLabel }}</strong>
                </article>
                <article>
                  <span>moving cars</span>
                  <strong>{{ elevatorSummary.movingElevators }}</strong>
                </article>
                <article>
                  <span>waiting pax</span>
                  <strong>{{ elevatorSummary.waitingPassengers }}</strong>
                </article>
              </div>
            </section>

            <section class="section-block elevator-layout">
              <article class="surface-panel">
                <div class="section-head">
                  <div>
                    <p class="eyebrow">Demand Control</p>
                    <h3>수요 분포와 승객 추가</h3>
                  </div>
                </div>

                <div class="preset-row">
                  <button
                    v-for="preset in ['commute', 'lunch', 'evening']"
                    :key="preset"
                    type="button"
                    class="chip-button"
                    :class="{ active: demandPreset === preset }"
                    @click="applyDemandPreset(preset)"
                  >
                    {{
                      preset === 'commute'
                        ? '출근'
                        : preset === 'lunch'
                          ? '식사'
                          : '저녁'
                    }}
                  </button>
                </div>

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
                    <span>car 수 {{ elevatorCarCount }}</span>
                    <input
                      class="range-input"
                      type="range"
                      min="2"
                      max="6"
                      :value="elevatorCarCount"
                      @change="updateElevatorCarCount($event.target.value)"
                    />
                  </label>

                  <div class="queue-buttons">
                    <button type="button" class="primary-button" @click="addPassenger('up')">상행 1명 추가</button>
                    <button type="button" class="ghost-button" @click="addPassenger('down')">하행 1명 추가</button>
                    <button type="button" class="ghost-button" @click="resetElevator">리셋</button>
                  </div>
                </div>

                <div class="info-stack">
                  <article>
                    <span>active hall calls</span>
                    <strong>{{ elevatorSummary.activeHallCalls }}</strong>
                  </article>
                  <article>
                    <span>onboard pax</span>
                    <strong>{{ elevatorSummary.onboardPassengers }}</strong>
                  </article>
                  <article>
                    <span>load ratio</span>
                    <strong>{{ formatLoadRatio(elevatorSummary.loadRatio) }}</strong>
                  </article>
                </div>
              </article>

              <article class="surface-panel">
                <div class="section-head">
                  <div>
                    <p class="eyebrow">Car State</p>
                    <h3>shaft 상태</h3>
                  </div>
                </div>

                <div class="car-stack">
                  <article v-for="car in elevatorCars" :key="car.id" class="car-card">
                    <div class="car-top">
                      <strong>{{ car.id }}</strong>
                      <span>{{ directionGlyph(car.direction) }} {{ Number(car.position ?? car.currentFloor).toFixed(2) }}F</span>
                    </div>
                    <p>{{ car.status }} · 다음 {{ car.nextTarget || '대기' }}</p>
                    <div class="load-track">
                      <span :style="{ width: `${((car.currentLoad || 0) / (car.capacity || 20)) * 100}%` }"></span>
                    </div>
                    <small>{{ car.currentLoad || 0 }} / {{ car.capacity || 20 }} passengers</small>
                    <div class="passenger-dot-row">
                      <span
                        v-for="index in Math.min(car.currentLoad || 0, 10)"
                        :key="`${car.id}-dot-${index}`"
                        class="passenger-dot"
                      ></span>
                      <small v-if="(car.currentLoad || 0) > 10">+{{ (car.currentLoad || 0) - 10 }}</small>
                    </div>
                    <div class="position-track">
                      <span
                        :style="{
                          left: `${(((Number(car.position ?? car.currentFloor) - 1) / Math.max(1, (elevatorState.building?.maxFloor || 23) - 1)) * 100).toFixed(1)}%`
                        }"
                      ></span>
                    </div>
                    <small class="position-note">queue {{ car.queue?.join(', ') || '없음' }}</small>
                  </article>
                </div>
              </article>
            </section>

            <section class="section-block">
              <div class="section-head">
                <div>
                  <p class="eyebrow">Dispatch Grid</p>
                  <h3>층별 대기와 shaft 위치</h3>
                </div>
                <span>정원 초과는 대기 인원으로 남고, car 위치는 연속 값 기준으로 반영합니다.</span>
              </div>

              <div class="dispatch-table">
                <div
                  class="dispatch-head"
                  :style="{ gridTemplateColumns: `70px minmax(150px, 1.6fr) repeat(${elevatorCars.length}, minmax(54px, 0.64fr))` }"
                >
                  <span>floor</span>
                  <span>queue</span>
                  <span v-for="car in elevatorCars" :key="`${car.id}-head`">{{ car.id }}</span>
                </div>

                <div
                  v-for="row in elevatorFloorRows"
                  :key="row.floor"
                  class="dispatch-row"
                  :style="{ gridTemplateColumns: `70px minmax(150px, 1.6fr) repeat(${elevatorCars.length}, minmax(54px, 0.64fr))` }"
                >
                  <span class="floor-chip">{{ row.floor }}F</span>
                  <div class="queue-chip" :class="{ hotspot: row.up + row.down > 0 }">
                    <strong>상행 {{ row.up }}명 · 하행 {{ row.down }}명</strong>
                    <small>up {{ row.topUp }} / down {{ row.topDown }}</small>
                  </div>
                  <div
                    v-for="car in elevatorCars"
                    :key="`${car.id}-${row.floor}`"
                    class="shaft-cell"
                    :class="{ occupied: isCarNearFloor(car.position ?? car.currentFloor, row.floor) }"
                  >
                    <span v-if="isCarNearFloor(car.position ?? car.currentFloor, row.floor)">{{ car.id }}</span>
                  </div>
                </div>
              </div>
            </section>

            <section class="section-block">
              <div class="section-head">
                <div>
                  <p class="eyebrow">Recent Arrivals</p>
                  <h3>최근 도착 로그</h3>
                </div>
              </div>

              <div class="arrival-log">
                <article v-for="entry in elevatorArrivals" :key="entry">{{ entry }}</article>
              </div>
            </section>
          </section>

          <section v-else-if="page === 'taxi'" class="feature-shell">
            <section class="platform-banner line-p">
              <div>
                <p class="eyebrow">Line T / Taxi District Lab</p>
                <h3>9구역 택시 시뮬레이터 코어</h3>
                <p>
                  랜덤 호출과 수동 호출을 같이 넣고, 가장 가까우면서 정원 여유가 있는 차량이 먼저 움직입니다.
                  처리 시간은 reward 로, 차량 추가는 penalty 로 누적됩니다.
                </p>
              </div>

              <div class="banner-stats">
                <article v-for="metric in taxiDashboardMetrics" :key="metric.label">
                  <span>{{ metric.label }}</span>
                  <strong>{{ metric.value }}</strong>
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
                  <span>실지도 대신 9구역 추상 메쉬를 사용해 이동 이유를 읽을 수 있게 합니다.</span>
                </div>

                <div class="district-grid">
                  <article
                    v-for="zone in taxiZoneCards"
                    :key="zone.id"
                    class="district-card"
                    :class="zone.accent"
                  >
                    <div class="district-top">
                      <strong>{{ zone.name }}</strong>
                      <span>{{ zone.pending }} req</span>
                    </div>
                    <p>{{ zone.demandLabel }}</p>
                    <small>nearby fleet {{ zone.nearbyFleet }} · neighbors {{ zone.neighbors.length }}</small>
                  </article>
                </div>
              </article>

              <article class="surface-panel">
                <div class="section-head">
                  <div>
                    <p class="eyebrow">Request Console</p>
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
                    <span>reward</span>
                    <strong>{{ formatSignedValue(taxiRewardSummary.reward) }}</strong>
                    <p>짧은 처리 시간과 안정적인 배차가 보상으로 쌓입니다.</p>
                  </article>
                  <article class="reward-card">
                    <span>penalty</span>
                    <strong>{{ formatSignedValue(-taxiRewardSummary.penalty) }}</strong>
                    <p>차량 추가 배치 시 운영비 패널티가 즉시 반영됩니다.</p>
                  </article>
                  <article class="reward-card">
                    <span>net</span>
                    <strong>{{ formatSignedValue(taxiRewardSummary.net) }}</strong>
                    <p>보상과 패널티를 합친 현재 시뮬레이터 점수입니다.</p>
                  </article>
                </div>

                <p v-if="taxiMessage" class="status-copy ok">{{ taxiMessage }}</p>
              </article>
            </section>

            <section class="section-block split-layout">
              <article class="surface-panel">
                <div class="section-head">
                  <div>
                    <p class="eyebrow">Fleet Strip</p>
                    <h3>차량 상태</h3>
                  </div>
                </div>

                <div class="fleet-grid">
                  <article v-for="cab in taxiFleet" :key="cab.id" class="fleet-card">
                    <div class="fleet-top">
                      <strong>{{ cab.id }}</strong>
                      <span>{{ cab.status }}</span>
                    </div>
                    <p>{{ findTaxiZone(cab.zoneId)?.name }} -> {{ findTaxiZone(cab.targetZoneId)?.name }}</p>
                    <small>{{ cab.passengerCount }} / {{ cab.seats }} passengers · route {{ cab.route.length }} hops</small>
                    <strong class="fleet-reward">{{ cab.assignedRequestId || 'idle' }}</strong>
                  </article>
                </div>
              </article>

              <article class="surface-panel">
                <div class="section-head">
                  <div>
                    <p class="eyebrow">Request Queue</p>
                    <h3>진행 중 호출</h3>
                  </div>
                </div>

                <div class="prototype-rule-list">
                  <article v-for="request in taxiRequestQueue" :key="request.id" class="prototype-rule-card">
                    <strong>{{ request.id }} · {{ request.status }}</strong>
                    <p>
                      {{ findTaxiZone(request.originId)?.name }} -> {{ findTaxiZone(request.destinationId)?.name }}
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
                    <p class="eyebrow">Recent Trips</p>
                    <h3>최근 완료 호출</h3>
                  </div>
                </div>

                <div class="prototype-rule-list">
                  <article v-for="request in taxiCompletedRequests" :key="request.id" class="prototype-rule-card">
                    <strong>{{ request.id }} · reward {{ formatSignedValue(request.reward) }}</strong>
                    <p>
                      wait {{ request.waitSeconds }}s · trip {{ request.tripSeconds }}s ·
                      {{ findTaxiZone(request.originId)?.name }} -> {{ findTaxiZone(request.destinationId)?.name }}
                    </p>
                  </article>
                </div>
              </article>

              <article class="surface-panel">
                <div class="section-head">
                  <div>
                    <p class="eyebrow">Ops Log</p>
                    <h3>이벤트 로그</h3>
                  </div>
                </div>

                <div class="arrival-log">
                  <article v-for="entry in taxiState.eventLog" :key="entry">{{ entry }}</article>
                </div>
              </article>
            </section>
          </section>

          <section v-else-if="page === 'bloghub'" class="feature-shell blog-shell">
            <section class="platform-banner line-b">
              <div>
                <p class="eyebrow">Line B / Blog District</p>
                <h3>읽기와 쓰기를 위한 조용한 승강장</h3>
                <p>
                  공개 아카이브는 차분한 목록 리듬으로, Writing Studio 는 편집과 미리보기를 분리한 집중 화면으로
                  구성했습니다. published 만 공개되고 draft 는 Studio 안에서만 보입니다.
                </p>
              </div>

              <div class="banner-stats">
                <article v-for="item in blogHeroStats" :key="item.label">
                  <span>{{ item.label }}</span>
                  <strong>{{ item.value }}</strong>
                </article>
              </div>
            </section>

            <section class="section-block split-layout">
              <article class="surface-panel">
                <div class="section-head">
                  <div>
                    <p class="eyebrow">Public Entry</p>
                    <h3>공개 읽기 레일</h3>
                  </div>
                </div>

                <div class="line-grid">
                  <article v-for="post in publishedBlogPosts.slice(0, 2)" :key="post.id" class="archive-card">
                    <div class="archive-top">
                      <span class="status-chip">{{ BLOG_STATUS_LABELS[post.status] }}</span>
                      <small>{{ formatDate(post.publishedAt) }}</small>
                    </div>
                    <strong>{{ post.title }}</strong>
                    <p>{{ post.summary }}</p>
                    <div class="line-ticket-row">
                      <span v-for="tag in post.tags" :key="`${post.id}-${tag}`" class="ticket-tag">#{{ tag }}</span>
                    </div>
                    <button type="button" class="ghost-button" @click="openBlogPost(post.slug)">글 읽기</button>
                  </article>
                </div>

                <div class="queue-buttons">
                  <button type="button" class="primary-button" @click="openBlogArchive">Public Archive 열기</button>
                </div>
              </article>

              <article class="surface-panel">
                <div class="section-head">
                  <div>
                    <p class="eyebrow">Writing Studio</p>
                    <h3>초안과 발행 흐름</h3>
                  </div>
                </div>

                <div class="prototype-rule-list">
                  <article class="prototype-rule-card">
                    <strong>draft</strong>
                    <p>아직 공개되지 않는 작성 중 글. Studio 에서만 노출됩니다.</p>
                  </article>
                  <article class="prototype-rule-card">
                    <strong>published</strong>
                    <p>아카이브와 글 상세에 즉시 연결되는 공개 상태입니다.</p>
                  </article>
                  <article class="prototype-rule-card">
                    <strong>archived</strong>
                    <p>삭제가 아니라 보관. 기본 공개 목록에서는 제외됩니다.</p>
                  </article>
                </div>

                <div class="queue-buttons">
                  <button type="button" class="primary-button" @click="openPage('writingStudio')">Studio 열기</button>
                  <button type="button" class="ghost-button" @click="createNewStudioPost()">새 글 만들기</button>
                </div>
              </article>
            </section>
          </section>

          <section v-else-if="page === 'blogArchive'" class="feature-shell blog-shell">
            <section class="section-block reading-shell">
              <div class="section-head archive-head">
                <div>
                  <p class="eyebrow">Public Archive</p>
                  <h3>공개 글 목록</h3>
                </div>
                <span>published 상태만 공개 목록에 노출됩니다.</span>
              </div>

              <div class="archive-list">
                <article v-for="post in publishedBlogPosts" :key="post.id" class="archive-card archive-list-card">
                  <div class="archive-top">
                    <span class="status-chip">{{ BLOG_STATUS_LABELS[post.status] }}</span>
                    <small>{{ formatDate(post.publishedAt) }}</small>
                  </div>
                  <strong>{{ post.title }}</strong>
                  <p>{{ post.summary }}</p>
                  <div class="line-ticket-row">
                    <span v-for="tag in post.tags" :key="`${post.id}-${tag}`" class="ticket-tag">#{{ tag }}</span>
                  </div>
                  <button type="button" class="ghost-button" @click="openBlogPost(post.slug)">글 읽기</button>
                </article>
              </div>
            </section>
          </section>

          <section v-else-if="page === 'blogPost'" class="feature-shell blog-shell">
            <article v-if="activeBlogPost" class="reading-shell post-shell">
              <div class="post-meta-line">
                <span>{{ formatDate(activeBlogPost.createdAt) }}</span>
                <span>{{ formatDate(activeBlogPost.updatedAt) }} 수정</span>
                <span>{{ formatDate(activeBlogPost.publishedAt) }} 발행</span>
              </div>

              <header class="post-header">
                <span class="status-chip">{{ BLOG_STATUS_LABELS[activeBlogPost.status] }}</span>
                <h3>{{ activeBlogPost.title }}</h3>
                <p class="post-summary">{{ activeBlogPost.summary }}</p>
                <div class="line-ticket-row">
                  <span v-for="tag in activeBlogPost.tags" :key="`${activeBlogPost.id}-${tag}`" class="ticket-tag">#{{ tag }}</span>
                </div>
              </header>

              <div class="markdown-body" v-html="renderMarkdownToHtml(activeBlogPost.bodyMarkdown)"></div>

              <footer class="post-footer-nav">
                <button v-if="adjacentBlogPosts.previous" type="button" class="ghost-button" @click="openBlogPost(adjacentBlogPosts.previous.slug)">
                  이전 글
                </button>
                <button type="button" class="primary-button" @click="openBlogArchive">아카이브로</button>
                <button v-if="adjacentBlogPosts.next" type="button" class="ghost-button" @click="openBlogPost(adjacentBlogPosts.next.slug)">
                  다음 글
                </button>
              </footer>
            </article>
          </section>

          <section v-else-if="page === 'writingStudio'" class="feature-shell blog-shell">
            <section class="platform-banner line-b">
              <div>
                <p class="eyebrow">Line B / Writing Studio</p>
                <h3>{{ studioState.title || '새 글 초안' }}</h3>
                <p>
                  제목, slug, 요약, Markdown 본문을 저장하고 preview 와 publish 상태를 같은 데이터 모델로 연결합니다.
                </p>
              </div>

              <div class="banner-stats">
                <article>
                  <span>status</span>
                  <strong>{{ BLOG_STATUS_LABELS[studioState.status] }}</strong>
                </article>
                <article>
                  <span>words</span>
                  <strong>{{ studioWordCount }}</strong>
                </article>
                <article>
                  <span>reading</span>
                  <strong>{{ studioReadingMinutes }} min</strong>
                </article>
              </div>
            </section>

            <section class="section-block studio-shell">
              <aside class="studio-sidebar">
                <div class="section-head">
                  <div>
                    <p class="eyebrow">Draft Shelf</p>
                    <h3>초안 목록</h3>
                  </div>
                </div>

                <div class="preset-column">
                  <button type="button" class="command-card" @click="createNewStudioPost(false)">
                    <strong>새 글 초안</strong>
                    <p>지금 편집 중인 글과 별도로 새 draft 를 시작합니다.</p>
                  </button>
                  <button
                    v-for="post in draftBlogPosts"
                    :key="post.id"
                    type="button"
                    class="command-card"
                    :class="{ active: studioPostId === post.id }"
                    @click="openStudioForPost(post.id)"
                  >
                    <strong>{{ post.title }}</strong>
                    <p>{{ formatDate(post.updatedAt) }} 수정 · {{ post.summary }}</p>
                  </button>
                </div>
              </aside>

              <div class="studio-main">
                <div class="studio-toolbar">
                  <div class="test-route-actions">
                    <button type="button" class="ghost-button" @click="studioViewMode = 'split'">Split</button>
                    <button type="button" class="ghost-button" @click="studioViewMode = 'edit'">Edit</button>
                    <button type="button" class="ghost-button" @click="studioViewMode = 'preview'">Preview</button>
                  </div>

                  <div class="command-actions">
                    <button type="button" class="ghost-button" @click="saveStudioDraft">draft 저장</button>
                    <button type="button" class="primary-button" @click="publishStudioPost">publish</button>
                    <button type="button" class="ghost-button" @click="archiveStudioPost">archive</button>
                  </div>
                </div>

                <div class="studio-grid" :data-view="studioViewMode">
                  <div class="studio-editor">
                    <label class="input-block">
                      <span>제목</span>
                      <input v-model="studioState.title" class="text-input" type="text" placeholder="글 제목" />
                    </label>

                    <label class="input-block">
                      <span>slug</span>
                      <input
                        :value="studioState.slug"
                        class="text-input"
                        type="text"
                        placeholder="slug"
                        @input="setStudioSlug($event.target.value)"
                      />
                    </label>

                    <label class="input-block">
                      <span>요약</span>
                      <textarea v-model="studioState.summary" class="textarea-input" rows="3" placeholder="짧은 요약"></textarea>
                    </label>

                    <label class="input-block">
                      <span>태그</span>
                      <input v-model="studioState.tags" class="text-input" type="text" placeholder="tag1, tag2" />
                    </label>

                    <label class="input-block">
                      <span>Markdown 본문</span>
                      <textarea
                        v-model="studioState.bodyMarkdown"
                        class="textarea-input studio-textarea"
                        rows="18"
                        placeholder="## 본문"
                      ></textarea>
                    </label>
                  </div>

                  <article class="studio-preview reading-shell">
                    <div class="post-meta-line">
                      <span>{{ studioState.slug || 'slug 미정' }}</span>
                      <span>{{ BLOG_STATUS_LABELS[studioState.status] }}</span>
                      <span>{{ formatDate(studioState.updatedAt) }}</span>
                    </div>
                    <header class="post-header">
                      <h3>{{ studioState.title || '미리보기 제목' }}</h3>
                      <p class="post-summary">{{ studioState.summary || '요약을 입력하면 여기에서 보입니다.' }}</p>
                    </header>
                    <div class="markdown-body" v-html="studioPreviewHtml"></div>
                  </article>
                </div>

                <p v-if="blogMessage" class="status-copy ok">{{ blogMessage }}</p>
              </div>
            </section>
          </section>

          <section v-else-if="page === 'work'" class="feature-shell">
            <section class="platform-banner line-w">
              <div>
                <p class="eyebrow">Line W / Work Manager</p>
                <h3>운영 보드 승강장</h3>
                <p>
                  `Backlog` 와 `Ready` 는 프런트에서 분리해 보여주고, 실제 파일 기반 상태 전이는 현재 gateway 계약을
                  따릅니다. command 영역은 preset action + memo 조합만 허용합니다.
                </p>
              </div>

              <div class="banner-stats">
                <article>
                  <span>lanes</span>
                  <strong>5</strong>
                </article>
                <article>
                  <span>selected</span>
                  <strong>{{ selectedWorkTicket?.id || 'none' }}</strong>
                </article>
                <article>
                  <span>command gate</span>
                  <strong>{{ workManagerToken ? 'unlocked' : 'locked' }}</strong>
                </article>
              </div>
            </section>

            <section class="section-block">
              <div class="section-head">
                <div>
                  <p class="eyebrow">Version Header</p>
                  <h3>목표 버전과 로드맵 요약</h3>
                </div>
                <span>`v0.4.0` 레일 안의 작업과 이후 후보 버전을 한 화면에서 읽습니다.</span>
              </div>

              <div class="version-strip">
                <article v-for="[version, count] in workVersionSummary" :key="version" class="version-chip-card">
                  <strong>{{ version }}</strong>
                  <small>{{ count }} tickets</small>
                </article>
              </div>

              <div class="version-strip version-focus-strip">
                <article class="version-chip-card version-focus-card">
                  <strong>{{ workVersionHeader.focusVersion }}</strong>
                  <small>current focus</small>
                </article>
                <article class="version-chip-card">
                  <strong>{{ workVersionHeader.developmentCeiling }}</strong>
                  <small>development ceiling</small>
                </article>
                <article class="version-chip-card">
                  <strong>{{ workVersionHeader.activeRange }}</strong>
                  <small>active range</small>
                </article>
                <article class="version-chip-card">
                  <strong>{{ workVersionHeader.selectedPriority }}</strong>
                  <small>selected ticket priority</small>
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
                    <p class="eyebrow">Worker Visibility</p>
                    <h3>Started ownership</h3>
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
                    <p class="eyebrow">Priority Policy</p>
                    <h3>자동/수동 경계</h3>
                  </div>
                </div>

                <div class="prototype-rule-list">
                  <article class="prototype-rule-card">
                    <strong>queue source</strong>
                    <p>{{ workPriorityPolicy.queueSource }}</p>
                  </article>
                  <article class="prototype-rule-card">
                    <strong>automatic</strong>
                    <p>{{ (workPriorityPolicy.automaticRange || []).join(', ') }}</p>
                  </article>
                  <article class="prototype-rule-card">
                    <strong>manual</strong>
                    <p>{{ (workPriorityPolicy.manualRange || []).join(', ') }}</p>
                  </article>
                </div>
              </article>
            </section>

            <section class="section-block split-layout">
              <article class="surface-panel">
                <div class="section-head">
                  <div>
                    <p class="eyebrow">Persistence</p>
                    <h3>파일 저장과 DB 전환 기준</h3>
                  </div>
                </div>

                <div class="info-stack">
                  <article>
                    <span>mode</span>
                    <strong>{{ workPersistence.mode }}</strong>
                  </article>
                  <article>
                    <span>audit file</span>
                    <strong>{{ workPersistence.filePath }}</strong>
                  </article>
                  <article>
                    <span>target db</span>
                    <strong>{{ workPersistence.targetDatabase }}</strong>
                  </article>
                  <article>
                    <span>audit events</span>
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
                    <p class="eyebrow">Next Pick Hint</p>
                    <h3>우선순위 반응 예상</h3>
                  </div>
                </div>

                <ul class="check-list">
                  <li v-for="item in workPriorityPolicy.nextCandidates || []" :key="item">{{ item }}</li>
                </ul>
              </article>
            </section>

            <section class="section-block work-layout">
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
                      <small>{{ column.tickets.length }} tickets</small>
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
                    <p class="eyebrow">Ticket Detail</p>
                    <h3>{{ selectedWorkTicket?.id || '선택 없음' }}</h3>
                  </div>
                </div>

                <div v-if="selectedWorkTicket" class="detail-stack">
                  <article>
                    <span>lane</span>
                    <strong>{{ selectedWorkTicket.lane }}</strong>
                  </article>
                  <article>
                    <span>target version</span>
                    <strong>{{ selectedWorkTicket.targetVersion }}</strong>
                  </article>
                  <article class="detail-editor">
                    <span>edit target version</span>
                    <select v-model="metadataTargetVersion" class="select-input">
                      <option v-for="version in workTargetVersionOptions" :key="version" :value="version">
                        {{ version }}
                      </option>
                    </select>
                  </article>
                  <article>
                    <span>priority</span>
                    <strong>{{ selectedWorkTicket.priority || '없음' }}</strong>
                  </article>
                  <article class="detail-editor">
                    <span>edit priority</span>
                    <select v-model="metadataPriority" class="select-input">
                      <option value="P1">P1</option>
                      <option value="P2">P2</option>
                      <option value="P3">P3</option>
                      <option value="P4">P4</option>
                      <option value="P5">P5</option>
                    </select>
                  </article>
                  <article>
                    <span>progress decision</span>
                    <strong>{{ selectedWorkTicket.progressDecision || '없음' }}</strong>
                  </article>
                  <article>
                    <span>goal</span>
                    <p>{{ selectedWorkTicket.goal || '없음' }}</p>
                  </article>
                  <article>
                    <span>work items</span>
                    <p>{{ selectedWorkTicket.workItems || '없음' }}</p>
                  </article>
                  <article>
                    <span>deliverables</span>
                    <p>{{ selectedWorkTicket.deliverables || '없음' }}</p>
                  </article>
                  <article>
                    <span>prerequisites</span>
                    <p>{{ selectedWorkTicket.prerequisites || '없음' }}</p>
                  </article>
                  <article>
                    <span>dependencies</span>
                    <p>{{ selectedWorkTicket.dependencies || selectedWorkTicket.prerequisites || '없음' }}</p>
                  </article>
                  <article class="detail-editor detail-editor-wide">
                    <span>edit dependencies</span>
                    <textarea
                      v-model="metadataDependencies"
                      class="textarea-input"
                      rows="4"
                      placeholder="TKT-039 또는 선행 티켓/의존성 메모를 적습니다."
                    ></textarea>
                  </article>
                  <article>
                    <span>questions</span>
                    <p>{{ selectedWorkTicket.questions || '없음' }}</p>
                  </article>
                  <article>
                    <span>review memo</span>
                    <p>{{ selectedWorkTicket.reviewMemo || '없음' }}</p>
                  </article>
                  <article>
                    <span>PR prep memo</span>
                    <p>{{ selectedWorkTicket.prPreparationMemo || '없음' }}</p>
                  </article>
                  <article>
                    <span>notes</span>
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
                    <p class="eyebrow">Command Zone</p>
                    <h3>preset bridge</h3>
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
                  <button type="button" class="primary-button" :disabled="isRunningCommand || !selectedCommand" @click="submitPresetCommand">
                    {{ isRunningCommand ? '큐 등록 중...' : 'preset command 전송' }}
                  </button>
                </div>

                <div class="feed-block">
                  <strong>activity feed</strong>
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
                      <span>command</span>
                      <small>{{ formatTimestamp(entry.createdAt) }}</small>
                    </div>
                    <p>{{ entry.label }}</p>
                    <small>{{ entry.note || entry.message }}</small>
                  </article>
                </div>
              </aside>
            </section>
          </section>

          <section v-else class="feature-shell">
            <section class="platform-banner line-r">
              <div>
                <p class="eyebrow">Line R / Runtime Board</p>
                <h3>노드 정책 보드</h3>
                <p>
                  릴리스 레일과 런타임 레일을 같이 봅니다. GitHub Release 는 태그 기반으로 만들 수 있지만,
                  현재 저장소에는 실제 GitHub Release 생성 단계가 아직 연결되어 있지 않습니다.
                </p>
              </div>

              <div class="banner-stats">
                <article>
                  <span>gateway</span>
                  <strong>{{ healthState.status }}</strong>
                </article>
                <article>
                  <span>rtx5070</span>
                  <strong>{{ runtimeState.ollama?.status || 'unknown' }}</strong>
                </article>
                <article>
                  <span>queued</span>
                  <strong>{{ healthState.tickets?.queued ?? 0 }}</strong>
                </article>
              </div>
            </section>

            <section class="section-block">
              <div class="section-head">
                <div>
                  <p class="eyebrow">Runtime Nodes</p>
                  <h3>운영 노드</h3>
                </div>
              </div>

              <div class="runtime-grid">
                <article v-for="node in runtimeState.nodes" :key="node.nodeId" class="runtime-card">
                  <div class="runtime-top">
                    <strong>{{ node.nodeId }}</strong>
                    <span class="status-chip">{{ node.availability }}</span>
                  </div>
                  <p>{{ node.role }}</p>
                  <small>{{ (node.handles || []).join(', ') }}</small>
                </article>
              </div>
            </section>

            <section class="section-block split-layout">
              <article class="surface-panel">
                <div class="section-head">
                  <div>
                    <p class="eyebrow">Routing Rules</p>
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
                    <p class="eyebrow">Release Path</p>
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
          </section>
        </div>
      </main>
    </transition>
  </div>
</template>
