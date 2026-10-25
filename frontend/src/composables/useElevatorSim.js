import { computed, onBeforeUnmount, ref, watch } from 'vue'

const ELEVATOR_API = '/api/services/elevator-service/api'
const ELEVATOR_REFRESH_INTERVAL_MS = 900

function directionGlyph(direction) {
  if (direction === 'up') return '↑'
  if (direction === 'down') return '↓'
  return '·'
}

function readElevatorTickerDefault() {
  return typeof window === 'undefined' || window.innerWidth > 760
}

/**
 * 엘리베이터 시뮬(상태 폴링·수요 조절·파생 값)의 상태와 타이머.
 * - fallbackState: 서버가 없거나 실패할 때 쓰는 정지 화면 상태. App.vue 에 남아 있다(SimTone·taxiDispatch E2E 가
 *   App.vue 소스에서 이 const 를 잘라 읽는다).
 * - fetchJson: App 의 JSON 요청 헬퍼.
 * 900ms 폴링은 startPolling() 으로 시작하고 이 composable 의 onBeforeUnmount 에서 정리한다.
 */
export function useElevatorSim({ fallbackState, fetchJson }) {
  const demandPreset = ref('normal')
  const demandIntensity = ref(55)
  const elevatorTickerOpen = ref(readElevatorTickerDefault())
  const elevatorState = ref(fallbackState)
  const elevatorCarCount = ref(fallbackState.elevators.length)

  let elevatorRefreshTimer

  const elevatorSummary = computed(() => elevatorState.value.summary || fallbackState.summary)
  const elevatorDemand = computed(() => elevatorState.value.demand || fallbackState.demand)
  const elevatorCars = computed(() => elevatorState.value.elevators || fallbackState.elevators)
  const elevatorBuilding = computed(() => elevatorState.value.building || fallbackState.building)

  const elevatorFloorRows = computed(() => {
    const building = elevatorState.value.building || fallbackState.building
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

  async function loadElevatorState() {
    try {
      elevatorState.value = await fetchJson(`${ELEVATOR_API}/state`)
    } catch (error) {
      elevatorState.value = fallbackState
    }
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

  async function updateElevatorCarCount(nextCount) {
    const elevatorCount = Number(nextCount)
    elevatorCarCount.value = elevatorCount
    await postElevatorJson(`${ELEVATOR_API}/config`, {
      elevatorCount
    })
    await loadElevatorState()
  }

  async function applyDemandPreset(nextPreset) {
    demandPreset.value = nextPreset
    await postElevatorJson(`${ELEVATOR_API}/demand`, {
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
    await postElevatorJson(`${ELEVATOR_API}/demand`, {
      preset: demandPreset.value,
      intensity
    })
  }

  async function addPassengerAtFloor({ floor, direction }) {
    await postElevatorJson(`${ELEVATOR_API}/passenger`, {
      floor,
      direction
    })
    await loadElevatorState()
  }

  async function resetElevator() {
    await postElevatorJson(`${ELEVATOR_API}/reset`, {})
    await loadElevatorState()
  }

  function startPolling() {
    window.clearInterval(elevatorRefreshTimer)
    elevatorRefreshTimer = window.setInterval(() => {
      loadElevatorState()
    }, ELEVATOR_REFRESH_INTERVAL_MS)
  }

  onBeforeUnmount(() => {
    window.clearInterval(elevatorRefreshTimer)
  })

  return {
    demandPreset,
    demandIntensity,
    elevatorTickerOpen,
    elevatorState,
    elevatorCarCount,
    elevatorSummary,
    elevatorDemand,
    elevatorCars,
    elevatorBuilding,
    elevatorFloorRows,
    elevatorAverageWaitSeconds,
    elevatorEvents,
    loadElevatorState,
    updateElevatorCarCount,
    applyDemandPreset,
    activateElevatorPage,
    updateDemandIntensity,
    addPassengerAtFloor,
    resetElevator,
    startPolling
  }
}
