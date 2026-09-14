const SESSION_MINUTES = 60
const SESSION_SECONDS = SESSION_MINUTES * 60

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Number(value) || 0))
}

function earliestCounter(availableAt) {
  let selected = 0
  for (let index = 1; index < availableAt.length; index += 1) {
    if (availableAt[index] < availableAt[selected]) selected = index
  }
  return selected
}

/**
 * A deterministic multi-counter queue.
 *
 * Visitors are spaced evenly across the selected hour. Each counter becomes
 * available as soon as its service time ends, so the displayed service time is
 * the effective service time—there is no vehicle travel or return leg.
 */
export function runEntryQueueScenario(sim, options = {}) {
  const hour = String(options.hour ?? sim?.arrivals?.[0]?.hour ?? '')
  const arrival = sim?.arrivals?.find((entry) => entry.hour === hour)
  if (!sim || !arrival) return null

  const counters = Math.round(clamp(options.counters ?? sim.counters, 1, 8))
  const prebookedRatio = clamp(options.prebookedRatio ?? sim.prebookedRatio, 0, 1)
  const serviceSeconds = Number((
    (sim.serviceSecPerVisitor * (1 - prebookedRatio))
    + (15 * prebookedRatio)
  ).toFixed(2))
  const expectedArrivals = Math.round(arrival.perMin * SESSION_MINUTES)
  const utilizationPercent = Number((
    (arrival.perMin * serviceSeconds * 100) / (60 * counters)
  ).toFixed(1))
  const availableAt = Array.from({ length: counters }, () => 0)
  const waits = []

  for (let index = 0; index < expectedArrivals; index += 1) {
    const arrivedAt = (index * SESSION_SECONDS) / expectedArrivals
    const counterIndex = earliestCounter(availableAt)
    const startsAt = Math.max(arrivedAt, availableAt[counterIndex])
    waits.push(Math.max(0, startsAt - arrivedAt))
    availableAt[counterIndex] = startsAt + serviceSeconds
  }

  const averageWaitSeconds = waits.length
    ? Math.round(waits.reduce((sum, value) => sum + value, 0) / waits.length)
    : 0

  return {
    hour,
    arrivals: expectedArrivals,
    completed: expectedArrivals,
    waiting: 0,
    counters,
    prebookedRatio,
    averageWaitSeconds,
    maxWaitSeconds: waits.length ? Math.round(Math.max(...waits)) : 0,
    serviceSeconds,
    utilizationPercent,
  }
}
