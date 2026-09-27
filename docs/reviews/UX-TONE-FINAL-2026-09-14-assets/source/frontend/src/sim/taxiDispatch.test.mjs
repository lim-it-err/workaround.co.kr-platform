import assert from 'node:assert/strict'
import { test } from 'node:test'
import { advanceTaxiFleet, assignPendingTaxiRequests } from './taxiDispatch.js'

const zones = [
  { id: 'a', name: 'A', neighbors: ['b'] },
  { id: 'b', name: 'B', neighbors: ['a', 'c'] },
  { id: 'c', name: 'C', neighbors: ['b'] }
]
const cab = (id = 'Cab-01', zoneId = 'a', overrides = {}) => ({
  id, zoneId, targetZoneId: zoneId, status: 'idle', seats: 4, passengerCount: 0,
  assignedRequestId: '', route: [], progress: 0, stepDuration: 1,
  positionLabel: zoneId.toUpperCase(), ...overrides
})
const request = (id = 'R1', overrides = {}) => ({
  id, originId: 'a', destinationId: 'c', passengers: 2, createdTick: 0,
  source: 'manual', status: 'pending', assignedTaxiId: '', pickedUpAt: 0, ...overrides
})
const state = (taxis = [cab()], activeRequests = [request()]) => ({
  clock: { elapsedSeconds: 0 }, zones, taxis, activeRequests,
  completedRequests: [], score: { reward: 0, penalty: 12 }, eventLog: []
})
const tick = value => advanceTaxiFleet({ ...value, clock: { elapsedSeconds: value.clock.elapsedSeconds + 1.2 } })
const freeze = value => {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(freeze)
    Object.freeze(value)
  }
  return value
}

test('idle cab + pending request: matches immediately without mutating input', () => {
  const initial = freeze(state([cab('Cab-01', 'c')]))
  const result = assignPendingTaxiRequests(initial)
  assert.equal(initial.activeRequests[0].status, 'pending')
  assert.equal(initial.taxis[0].status, 'idle')
  assert.equal(result.activeRequests[0].status, 'assigned')
  assert.equal(result.activeRequests[0].assignedTaxiId, 'Cab-01')
  assert.equal(result.taxis[0].assignedRequestId, 'R1')
  assert.deepEqual(result.taxis[0].route, ['b', 'a'])
})

test('same-zone pickup has no travel leg and never strands an assigned request', () => {
  let result = assignPendingTaxiRequests(state())
  assert.equal(result.taxis[0].status, 'pickup')
  assert.deepEqual(result.taxis[0].route, [])
  result = tick(result)
  assert.equal(result.activeRequests[0].status, 'onboard')
  assert.equal(result.taxis[0].status, 'dropoff')
  assert.equal(result.taxis[0].zoneId, 'a')
  for (let index = 0; index < 8; index++) result = tick(result)
  assert.equal(result.activeRequests.length, 0)
  assert.deepEqual(result.completedRequests.map(item => item.id), ['R1'])
  assert.equal(result.taxis[0].status, 'idle')
  assert.equal(result.taxis[0].assignedRequestId, '')
})

test('all busy + queued request: first completed cab is reassigned in that same tick', () => {
  const initial = freeze(state([
    cab('Cab-01', 'a', { status: 'dropoff', targetZoneId: 'b', assignedRequestId: 'R1', route: ['b'], passengerCount: 2 })
  ], [
    request('R1', { status: 'onboard', destinationId: 'b', assignedTaxiId: 'Cab-01' }),
    request('R2', { originId: 'b' })
  ]))
  const waiting = assignPendingTaxiRequests(initial)
  assert.equal(waiting.activeRequests[1].status, 'pending')
  const result = tick(waiting)
  assert.equal(result.completedRequests[0].id, 'R1')
  assert.equal(result.activeRequests[0].id, 'R2')
  assert.equal(result.activeRequests[0].status, 'assigned')
  assert.equal(result.activeRequests[0].assignedTaxiId, 'Cab-01')
  assert.equal(result.taxis[0].assignedRequestId, 'R2')
  assert.equal(result.taxis[0].status, 'pickup')
  assert.equal(initial.completedRequests.length, 0)
})

test('nearest cab with sufficient seats wins; equal distances retain stable cab-ID order', () => {
  const result = assignPendingTaxiRequests(state([
    cab('Cab-00', 'a', { seats: 1 }), cab('Cab-02', 'b'), cab('Cab-01', 'b'), cab('Cab-03', 'c')
  ]))
  assert.equal(result.activeRequests[0].assignedTaxiId, 'Cab-01')
  assert.equal(result.taxis[0].status, 'idle')
})

test('request priority remains passenger count, then creation time', () => {
  const result = assignPendingTaxiRequests(state([cab()], [
    request('small', { passengers: 1, createdTick: 0 }),
    request('new-large', { passengers: 4, createdTick: 2 }),
    request('old-large', { passengers: 4, createdTick: 1 })
  ]))
  assert.equal(result.taxis[0].assignedRequestId, 'old-large')
})

test('movement still waits for hop progress; capacity and reward rules are unchanged', () => {
  let result = assignPendingTaxiRequests(state([cab('Cab-01', 'a', { stepDuration: 2 })], [request('R1', { originId: 'b' })]))
  result = tick(result)
  assert.equal(result.taxis[0].zoneId, 'a')
  assert.equal(result.taxis[0].progress, 1)
  result = tick(result)
  assert.equal(result.taxis[0].zoneId, 'b')
  assert.equal(result.taxis[0].status, 'pickup')
  for (let index = 0; index < 6; index++) result = tick(result)
  assert.equal(result.completedRequests.length, 1)
  const completed = result.completedRequests[0]
  assert.equal(completed.reward, Math.max(8, 42 - completed.waitSeconds - completed.tripSeconds + completed.passengers * 3))
  assert.equal(result.score.reward, completed.reward)
  assert.equal(result.score.penalty, 12)
  const reward = result.score.reward
  for (let index = 0; index < 5; index++) result = tick(result)
  assert.equal(result.completedRequests.length, 1)
  assert.equal(result.score.reward, reward)
})

test('manual burst and automatic requests share one queue and all drain without orphan assignments', () => {
  let result = state([cab('Cab-01', 'a'), cab('Cab-02', 'c')], Array.from({ length: 8 }, (_, index) => request(`R${index}`, {
    source: index % 2 ? 'manual' : 'auto', createdTick: index, originId: index % 2 ? 'a' : 'c', destinationId: 'b'
  })))
  result.clock.elapsedSeconds = 10
  result = assignPendingTaxiRequests(result)
  for (let index = 0; index < 60; index++) {
    result = tick(result)
    for (const item of result.activeRequests.filter(item => item.status !== 'pending')) {
      const owner = result.taxis.find(taxi => taxi.id === item.assignedTaxiId)
      assert.equal(owner.assignedRequestId, item.id)
      assert.notEqual(owner.status, 'idle')
    }
  }
  assert.equal(result.activeRequests.length, 0)
  assert.equal(result.completedRequests.length, 8)
  assert.equal(new Set(result.completedRequests.map(item => item.id)).size, 8)
})

test('no capacity leaves the request pending; adding a suitable idle cab matches it', () => {
  const initial = state([cab('Cab-01', 'a', { seats: 1 })], [request('R1', { passengers: 4 })])
  const waiting = assignPendingTaxiRequests(initial)
  assert.equal(waiting.activeRequests[0].status, 'pending')
  waiting.taxis.push(cab('Cab-02', 'b'))
  const result = assignPendingTaxiRequests(waiting)
  assert.equal(result.activeRequests[0].assignedTaxiId, 'Cab-02')
})
