import {
  advanceTaxiFleet,
  assignPendingTaxiRequests,
} from '../../../../../../../frontend/src/sim/taxiDispatch.js'

const TICK_SECONDS = 15
const SESSION_MINUTES = 60

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Number(value) || 0))
}

function createState(counterCount, serviceSeconds) {
  const stepDuration = Math.max(1, Math.ceil(serviceSeconds / TICK_SECONDS))
  return {
    clock: { elapsedSeconds: 0 },
    zones: [
      { id: 'entry', name: '입구', neighbors: ['gallery'] },
      { id: 'gallery', name: '전시장', neighbors: ['entry'] },
    ],
    taxis: Array.from({ length: counterCount }, (_, index) => ({
      id: `Counter-${String(index + 1).padStart(2, '0')}`,
      zoneId: 'entry',
      targetZoneId: 'entry',
      positionLabel: '입구',
      seats: 1,
      passengerCount: 0,
      status: 'idle',
      assignedRequestId: '',
      route: [],
      progress: 0,
      stepDuration,
    })),
    activeRequests: [],
    completedRequests: [],
    score: { reward: 0, penalty: 0 },
    eventLog: [],
  }
}

function request(id, createdTick) {
  return {
    id,
    originId: 'entry',
    destinationId: 'gallery',
    passengers: 1,
    source: 'course',
    status: 'pending',
    assignedTaxiId: '',
    pickedUpAt: 0,
    createdTick,
  }
}

export function runEntryQueueScenario(sim, options = {}) {
  const hour = String(options.hour ?? sim?.arrivals?.[0]?.hour ?? '')
  const arrival = sim?.arrivals?.find((entry) => entry.hour === hour)
  if (!sim || !arrival) return null

  const counters = Math.round(clamp(options.counters ?? sim.counters, 1, 8))
  const prebookedRatio = clamp(options.prebookedRatio ?? sim.prebookedRatio, 0, 1)
  const serviceSeconds = (sim.serviceSecPerVisitor * (1 - prebookedRatio)) + (15 * prebookedRatio)
  const expectedArrivals = Math.round(arrival.perMin * SESSION_MINUTES)
  const sessionTicks = (SESSION_MINUTES * 60) / TICK_SECONDS
  let state = createState(counters, serviceSeconds)
  let created = 0

  for (let tick = 1; tick <= sessionTicks; tick += 1) {
    state.clock.elapsedSeconds = tick * TICK_SECONDS
    const shouldExist = Math.floor((expectedArrivals * tick) / sessionTicks)
    while (created < shouldExist) {
      created += 1
      state.activeRequests.push(request(`Visitor-${String(created).padStart(3, '0')}`, state.clock.elapsedSeconds))
    }
    state = advanceTaxiFleet(assignPendingTaxiRequests(state))
  }

  const drainLimit = sessionTicks * 2
  for (let tick = 0; state.activeRequests.length && tick < drainLimit; tick += 1) {
    state.clock.elapsedSeconds += TICK_SECONDS
    state = advanceTaxiFleet(assignPendingTaxiRequests(state))
  }

  const waits = state.completedRequests.map((entry) => entry.waitSeconds)
  const averageWaitSeconds = waits.length
    ? Math.round(waits.reduce((sum, value) => sum + value, 0) / waits.length)
    : 0

  return {
    hour,
    arrivals: expectedArrivals,
    completed: state.completedRequests.length,
    waiting: state.activeRequests.length,
    counters,
    prebookedRatio,
    averageWaitSeconds,
    maxWaitSeconds: waits.length ? Math.max(...waits) : 0,
    serviceSeconds: Math.round(serviceSeconds),
  }
}
