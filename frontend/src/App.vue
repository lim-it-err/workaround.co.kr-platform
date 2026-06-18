<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const SPLASH_DURATION_MS = 10000
const TEST_ROUTE_PATH = '/test'
const TESTABLE_PAGES = ['junction', 'elevator', 'work', 'runtime']
const BOARD_READY_STORAGE_KEY = 'workaround-ready-lane'
const THEME_STORAGE_KEY = 'workaround-theme'
const TOKEN_STORAGE_KEY = 'workaround-work-manager-token'
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
  '도시는 콘크리트보다 눈치로 먼저 굴러갑니다.',
  '효율은 숫자로 증명되지만, 배려는 퇴근길 표정으로 남습니다.',
  '오늘도 문명은 닫힘 버튼 앞에서 인내심을 시험합니다.',
  '관리자 몰래 내맘대로 홈페이지 로딩하는 중.',
  '야근은 계획표에 없었지만, 엘리베이터는 이미 알고 있었습니다.',
  '퇴근은 자유지만, 회의실 문은 늘 한 박자 늦게 열립니다.',
  '도시 행정은 서류로 움직이고, 사람 마음은 엘리베이터 속도로 흔들립니다.',
  '누군가는 위로 올라가고, 누군가는 집에 가고 싶어 합니다.',
  '오늘의 생산성은 커피와 양심 사이에서 타협 중입니다.',
  '건물은 높아졌고, 체력은 공용 자산처럼 빠르게 소진되었습니다.',
  '친절은 버튼보다 먼저 눌려야 한다는 주장이 접수되었습니다.',
  '시민의 하루를 가볍게 만들기 위해 무거운 레이어를 정리하는 중입니다.',
  '회의는 길었고, 귀가는 아직 API로 자동화되지 않았습니다.',
  '삶의 로딩 화면은 길지만, 농담은 그 사이를 버티게 합니다.',
  '사람들은 위층을 원하지만, 마음은 늘 집 방향을 찾고 있습니다.',
  '도착 예정은 숫자지만, 기다림의 감각은 늘 비정량적입니다.',
  '오늘의 허브는 길찾기보다 마음 정리에 조금 더 도움을 주는 중입니다.',
  '일정표는 빽빽한데, 마음의 배차 간격은 아직 조정 중입니다.',
  '불편은 민원으로 접수되고, 피로는 조용히 퇴근 버스에 탑승합니다.',
  '헤일 메리급 일정 변경이 감지되었습니다. 모두 침착을 유지해 주세요.',
  '관리자는 차분함을 요청했고, 화면은 약간의 유머로 응답했습니다.',
  '도시는 늘 급하지만, 좋은 시스템은 사람을 덜 급하게 만듭니다.'
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

const isTestRoute = ref(readIsTestRoute())
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
const demandPreset = ref('normal')
const demandIntensity = ref(55)
const dragTicketId = ref('')
const readyTicketIds = ref(readReadyTicketIds())
const healthState = ref(fallbackHealth)
const runtimeState = ref(fallbackRuntime)
const servicesState = ref([])
const workBoardState = ref(fallbackWorkBoard)
const elevatorState = ref(fallbackElevatorState)

const splashRows = [
  { label: 'route', value: 'workaround central', accent: 'line-w' },
  { label: 'next', value: 'seoul subway portal', accent: 'line-e' },
  { label: 'platform', value: 'main junction', accent: 'line-r' },
  { label: 'status', value: 'transfer in ten seconds', accent: 'line-p' }
]

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

const lineCards = computed(() => {
  const elevatorSummary = elevatorState.value.summary || fallbackElevatorState.summary
  const backlogCount = countWorkTicketsByStatus('backlog')
  const startedCount = countWorkTicketsByStatus('started')
  const readyCount = readyColumnTickets.value.length
  const runtimeNodes = runtimeState.value.nodes || []
  const degradedCount = runtimeNodes.filter((node) => node.availability !== 'online').length

  return [
    {
      key: 'elevator',
      page: 'elevator',
      lineNo: '4',
      lineCode: 'Line E',
      name: 'Elevator Station',
      summary: '23층 다중 엘리베이터 시뮬레이터',
      detail: `${elevatorSummary.waitingPassengers ?? 0}명 대기, ${elevatorSummary.onboardPassengers ?? 0}명 탑승, ${elevatorSummary.movingElevators ?? 0}대 이동 중`,
      status: elevatorState.value.mode === 'live-traffic-loop' ? '실시간 운행' : '저하 운행',
      accent: 'line-e',
      cta: '플랫폼 입장',
      tickets: ['TKT-011', 'TKT-021', 'TKT-035']
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
      tickets: ['TKT-039', 'TKT-040', 'TKT-041']
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
      lineNo: '9',
      lineCode: 'Future',
      name: 'Public / Arcade',
      summary: '후속 시뮬레이터와 공개 포털 확장',
      detail: '택시 시뮬레이터, Flash Game, 공개 사이트 레일은 허브에서 분기만 보여줍니다.',
      status: '차기 확장',
      accent: 'line-p',
      cta: '허브 유지',
      tickets: ['TKT-024', 'TKT-028', 'TKT-029']
    }
  ]
})

const heroMetrics = computed(() => [
  { label: 'services', value: String(servicesState.value.length || 0) },
  { label: 'queued tickets', value: String(healthState.value.tickets?.queued ?? 0) },
  { label: 'waiting pax', value: String(elevatorState.value.summary?.waitingPassengers ?? 0) }
])

const testView = computed(() => {
  if (!isTestRoute.value) {
    return null
  }
  return normalizeTestView(page.value)
})

const currentRoute = computed(() => {
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

let splashTimer
let clockTimer
let tickerTimer
let portalRefreshTimer
let elevatorRefreshTimer

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

onMounted(async () => {
  if (!isTestRoute.value) {
    splashTimer = window.setTimeout(() => {
      page.value = 'junction'
    }, SPLASH_DURATION_MS)
  } else {
    syncTestLocation()
  }

  currentTicker.value = pickNextTicker([])
  tickerTimer = window.setInterval(() => {
    currentTicker.value = pickNextTicker([currentTicker.value])
  }, 2600)

  clockTimer = window.setInterval(() => {
    clockText.value = formatClock()
  }, 1000)

  await loadPortalData()

  portalRefreshTimer = window.setInterval(() => {
    loadPortalData({ refreshElevator: false })
  }, 8000)

  elevatorRefreshTimer = window.setInterval(() => {
    loadElevatorState()
  }, 1200)
})

onBeforeUnmount(() => {
  window.clearTimeout(splashTimer)
  window.clearInterval(clockTimer)
  window.clearInterval(tickerTimer)
  window.clearInterval(portalRefreshTimer)
  window.clearInterval(elevatorRefreshTimer)
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

function openPage(nextPage) {
  page.value = nextPage
  syncTestLocation()
  window.requestAnimationFrame(() => {
    document.querySelector('.page-scroller')?.scrollTo({ top: 0, behavior: 'smooth' })
  })
}

function skipSplash() {
  window.clearTimeout(splashTimer)
  openPage('junction')
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

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function readIsTestRoute() {
  return typeof window !== 'undefined' && window.location.pathname.startsWith(TEST_ROUTE_PATH)
}

function readInitialPage() {
  if (!readIsTestRoute()) {
    return 'splash'
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

function syncTestLocation() {
  if (!isTestRoute.value || typeof window === 'undefined') {
    return
  }

  const nextView = normalizeTestView(page.value)
  const nextUrl = new URL(window.location.href)
  nextUrl.pathname = TEST_ROUTE_PATH
  nextUrl.searchParams.set('view', nextView)
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

          <div class="flap-board">
            <div
              v-for="(row, rowIndex) in splashRows"
              :key="row.label"
              class="flap-row"
              :class="row.accent"
            >
              <span class="flap-label">{{ row.label }}</span>
              <div class="flap-values">
                <span
                  v-for="(character, charIndex) in row.value.split('')"
                  :key="`${row.label}-${rowIndex}-${charIndex}`"
                  class="flap-tile"
                  :style="{ '--row-order': rowIndex, '--tile-order': charIndex }"
                >
                  {{ character === ' ' ? '\u00A0' : character }}
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
                <h3>테스트 전용 진입점</h3>
              </div>
              <span>`/test` 는 검수용 더미 경로이고, 실제 사용자 흐름은 `/` 에서 계속 API와 연결됩니다.</span>
            </div>

            <div class="test-route-grid">
              <article class="test-route-card">
                <strong>현재 테스트 뷰</strong>
                <p>{{ testView }}</p>
                <small>URL `{{ TEST_ROUTE_PATH }}?view={{ testView }}`</small>
              </article>

              <article class="test-route-card">
                <strong>빠른 이동</strong>
                <div class="test-route-actions">
                  <button type="button" class="ghost-button" @click="openPage('junction')">허브</button>
                  <button type="button" class="ghost-button" @click="openPage('elevator')">Elevator</button>
                  <button type="button" class="ghost-button" @click="openPage('work')">Work</button>
                  <button type="button" class="ghost-button" @click="openPage('runtime')">Runtime</button>
                </div>
              </article>
            </div>

            <ul class="check-list">
              <li v-for="item in testCheckpoints" :key="item">{{ item }}</li>
            </ul>
          </section>

          <section v-if="page === 'junction'" class="junction-shell">
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
                  <div class="station-node left-35">
                    <span class="station-badge line-w">2</span>
                    <strong>Main Junction</strong>
                  </div>
                  <div class="station-node left-63">
                    <span class="station-badge line-e">4</span>
                    <strong>Elevator</strong>
                  </div>
                  <div class="station-node left-88">
                    <span class="station-badge line-p">9</span>
                    <strong>Future</strong>
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
                    v-for="preset in ['quiet', 'normal', 'busy']"
                    :key="preset"
                    type="button"
                    class="chip-button"
                    :class="{ active: demandPreset === preset }"
                    @click="applyDemandPreset(preset)"
                  >
                    {{ preset === 'quiet' ? '한산' : preset === 'busy' ? '혼잡' : '보통' }}
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
                <div class="dispatch-head">
                  <span>floor</span>
                  <span>queue</span>
                  <span>E1</span>
                  <span>E2</span>
                  <span>E3</span>
                  <span>E4</span>
                </div>

                <div v-for="row in elevatorFloorRows" :key="row.floor" class="dispatch-row">
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
