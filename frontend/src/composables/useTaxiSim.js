import { computed, onBeforeUnmount, ref } from 'vue'
import { advanceTaxiFleet, assignPendingTaxiRequests, cloneTaxiState } from '../sim/taxiDispatch.js'

const TAXI_SIMULATION_INTERVAL_MS = 1200

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

export function findTaxiZone(zoneId) {
  return TAXI_ZONE_DEFINITIONS.find((zone) => zone.id === zoneId) || null
}

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value))
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

function createTaxiRequest({ id, originId, destinationId, passengers, createdTick, source }) {
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

function shouldSpawnAutoTaxiRequest(state) {
  state.autoSpawnCounter += 1
  return state.autoSpawnCounter % 4 === 0 && state.activeRequests.length < 7
}

function pickTaxiZoneId(state, excludedIds = []) {
  const excluded = new Set(excludedIds)
  const candidates = state.zones.filter((zone) => !excluded.has(zone.id))
  const sequence = state.sequence % candidates.length
  return candidates[sequence]?.id || state.zones[0].id
}

/**
 * 택시 시뮬(상태·1.2초 틱·수동 호출)의 상태와 타이머.
 * - createEntityId: App 이 블로그와 공유하는 id 생성기.
 * 틱은 start() 로 시작하고(페이지와 무관하게 계속 돈다) 이 composable 의 onBeforeUnmount 에서 정리한다.
 */
export function useTaxiSim({ createEntityId }) {
  const taxiState = ref(createInitialTaxiState())
  const taxiManualOrigin = ref(TAXI_ZONE_DEFINITIONS[0].id)
  const taxiManualDestination = ref(TAXI_ZONE_DEFINITIONS[5].id)
  const taxiManualPassengers = ref(2)
  const taxiMessage = ref('')

  let taxiSimulationTimer

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

  function spawnTaxiRequest(state, options = {}) {
    const originId = options.originId || pickTaxiZoneId(state, [])
    const destinationId = options.destinationId || pickTaxiZoneId(state, [originId])
    const passengers = clamp(Number(options.passengers || (1 + (state.sequence % 4))), 1, 4)
    state.sequence += 1
    const request = createTaxiRequest({
      id: createEntityId('REQ'),
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

  function start() {
    window.clearInterval(taxiSimulationTimer)
    taxiSimulationTimer = window.setInterval(() => {
      advanceTaxiSimulation()
    }, TAXI_SIMULATION_INTERVAL_MS)
  }

  onBeforeUnmount(() => {
    window.clearInterval(taxiSimulationTimer)
  })

  return {
    taxiState,
    taxiManualOrigin,
    taxiManualDestination,
    taxiManualPassengers,
    taxiMessage,
    taxiZones,
    taxiFleet,
    taxiActiveRequests,
    taxiCompletedRequests,
    taxiRewardSummary,
    taxiDashboardMetrics,
    taxiZoneCards,
    taxiRequestQueue,
    submitManualTaxiRequest,
    addTaxiFleetUnit,
    start
  }
}
