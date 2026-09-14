const SESSION_MINUTES = 60
const SESSION_SECONDS = SESSION_MINUTES * 60
const DEFAULT_QUEUE_SEED = 19000511

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

function mulberry32(seed) {
  let state = seed >>> 0
  return () => {
    state += 0x6D2B79F5
    let value = state
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

function stochasticArrivalTimes(perMinute, seed) {
  const ratePerSecond = perMinute / 60
  if (ratePerSecond <= 0) return []

  const random = mulberry32(seed)
  const arrivals = []
  let arrivedAt = 0
  const safetyLimit = Math.ceil(perMinute * SESSION_MINUTES * 10) + 100

  while (arrivals.length < safetyLimit) {
    const sample = Math.max(Number.EPSILON, random())
    arrivedAt += -Math.log(sample) / ratePerSecond
    if (arrivedAt >= SESSION_SECONDS) break
    arrivals.push(arrivedAt)
  }

  return arrivals
}

/**
 * A reproducible stochastic multi-counter queue.
 *
 * Exponential inter-arrival times use a fixed seed. Each counter becomes
 * available as soon as its service time ends, so the displayed service time
 * remains the effective service time—there is no vehicle travel or return leg.
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
  const rawSeed = Number(options.seed ?? sim.seed ?? DEFAULT_QUEUE_SEED)
  const seed = Number.isFinite(rawSeed) ? Math.trunc(rawSeed) >>> 0 : DEFAULT_QUEUE_SEED
  const arrivalTimes = stochasticArrivalTimes(arrival.perMin, seed)
  const utilizationPercent = Number((
    (arrival.perMin * serviceSeconds * 100) / (60 * counters)
  ).toFixed(1))
  const availableAt = Array.from({ length: counters }, () => 0)
  const waits = []
  let completed = 0

  for (const arrivedAt of arrivalTimes) {
    const counterIndex = earliestCounter(availableAt)
    const startsAt = Math.max(arrivedAt, availableAt[counterIndex])
    waits.push(Math.max(0, startsAt - arrivedAt))
    if (startsAt <= SESSION_SECONDS) completed += 1
    availableAt[counterIndex] = startsAt + serviceSeconds
  }

  const averageWaitSeconds = waits.length
    ? Math.round(waits.reduce((sum, value) => sum + value, 0) / waits.length)
    : 0

  return {
    hour,
    arrivals: arrivalTimes.length,
    completed,
    unprocessed: arrivalTimes.length - completed,
    counters,
    prebookedRatio,
    averageWaitSeconds,
    maxWaitSeconds: waits.length ? Math.round(Math.max(...waits)) : 0,
    serviceSeconds,
    utilizationPercent,
    seed,
  }
}
