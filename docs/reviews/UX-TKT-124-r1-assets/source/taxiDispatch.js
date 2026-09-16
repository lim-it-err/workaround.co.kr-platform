// Taxi dispatch transitions are pure: callers own the clock and request creation.
// Nearest suitable cab, request ordering, graph routes and rewards are preserved.
export function cloneTaxiState(state) {
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

export function assignPendingTaxiRequests(state) {
  const nextState = cloneTaxiState(state)
  matchPendingTaxiRequests(nextState)
  return nextState
}

export function advanceTaxiFleet(state) {
  const nextState = cloneTaxiState(state)
  matchPendingTaxiRequests(nextState)

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
          taxi.route = buildTaxiRoute(nextState.zones, taxi.zoneId, request.destinationId).slice(1)
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
    taxi.positionLabel = findTaxiZone(nextState.zones, nextZone)?.name || nextZone

    if (taxi.status === 'to-origin' && taxi.zoneId === taxi.targetZoneId) {
      taxi.status = 'pickup'
    } else if (taxi.status === 'dropoff' && taxi.zoneId === taxi.targetZoneId && taxi.route.length === 0) {
      completeTaxiRequest(nextState, taxi)
    }
  }
  // Completion can free a cab during this tick; drain pending work immediately.
  matchPendingTaxiRequests(nextState)
  return nextState
}

function matchPendingTaxiRequests(state) {
  const pending = state.activeRequests
    .filter((request) => request.status === 'pending')
    .sort((left, right) => right.passengers - left.passengers || left.createdTick - right.createdTick)

  for (const request of pending) {
    const availableTaxi = pickBestTaxi(state, request)
    if (!availableTaxi) {
      continue
    }

    availableTaxi.assignedRequestId = request.id
    availableTaxi.targetZoneId = request.originId
    availableTaxi.route = buildTaxiRoute(state.zones, availableTaxi.zoneId, request.originId).slice(1)
    // Already at pickup: no movement event will arrive to advance to this state.
    availableTaxi.status = availableTaxi.route.length === 0 ? 'pickup' : 'to-origin'
    availableTaxi.progress = 0
    request.status = 'assigned'
    request.assignedTaxiId = availableTaxi.id
  }
}

function pickBestTaxi(state, request) {
  return [...state.taxis]
    .filter((taxi) => taxi.status === 'idle' && taxi.seats >= request.passengers)
    .sort((left, right) => {
      const leftDistance = buildTaxiRoute(state.zones, left.zoneId, request.originId).length
      const rightDistance = buildTaxiRoute(state.zones, right.zoneId, request.originId).length
      return leftDistance - rightDistance || left.id.localeCompare(right.id)
    })[0]
}

function buildTaxiRoute(zones, originId, destinationId) {
  if (originId === destinationId) {
    return [originId]
  }

  const visited = new Set([originId])
  const queue = [[originId]]
  while (queue.length > 0) {
    const path = queue.shift()
    const current = path[path.length - 1]
    const zone = findTaxiZone(zones, current)
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
  state.eventLog.unshift(`${taxi.id} 완료 · reward +${reward} · ${findTaxiZone(state.zones, completed.destinationId)?.name}`)
  state.eventLog = state.eventLog.slice(0, 12)
}

function findTaxiZone(zones, zoneId) {
  return zones.find((zone) => zone.id === zoneId) || null
}
