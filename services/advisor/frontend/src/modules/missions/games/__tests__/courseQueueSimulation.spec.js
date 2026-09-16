import { describe, expect, it } from 'vitest'
import { vienna1900Sims } from '../../data/courseVienna1900.js'
import { budapestBathsSims } from '../../data/courseBudapestBaths.js'
import { runEntryQueueScenario } from '../courseQueueSimulation.js'

describe('비엔나 입장 대기열 전체 실행 집계', () => {
  it.each(['09', '10'])('%s시 도착·처리·대기와 대기시간을 전체 완료 건으로 집계한다', (hour) => {
    const result = runEntryQueueScenario(vienna1900Sims[0], {
      hour,
      counters: 3,
      prebookedRatio: 0.35,
    })

    expect(result.completed).toBeLessThanOrEqual(result.arrivals)
    expect(result.completed + result.unprocessed).toBe(result.arrivals)
    expect(result.completed).toBeGreaterThan(16)
    expect(result.averageWaitSeconds).toBeGreaterThanOrEqual(0)
    expect(result.maxWaitSeconds).toBeGreaterThanOrEqual(result.averageWaitSeconds)
  })

  it('10시·창구 3개·예약 35%에서 명목 처리량에 맞게 대기가 폭발하지 않는다', () => {
    const result = runEntryQueueScenario(vienna1900Sims[0], {
      hour: '10',
      counters: 3,
      prebookedRatio: 0.35,
    })

    expect(result.averageWaitSeconds).toBeLessThanOrEqual(120)
    expect(result.serviceSeconds).toBe(34.5)
    expect(result.utilizationPercent).toBe(53.7)
  })

  it('같은 조건을 다시 실행하면 확률 도착과 결과가 완전히 같다', () => {
    const options = { hour: '11', counters: 3, prebookedRatio: 0.35 }
    const first = runEntryQueueScenario(vienna1900Sims[0], options)
    const second = runEntryQueueScenario(vienna1900Sims[0], options)

    expect(second).toEqual(first)
  })

  it('고정 시드에서 이용률 50%→70%→90% 순으로 평균 대기가 증가한다', () => {
    const scenario = {
      arrivals: [
        { hour: '50', perMin: 1 },
        { hour: '70', perMin: 1.4 },
        { hour: '90', perMin: 1.8 },
      ],
      counters: 2,
      serviceSecPerVisitor: 60,
      prebookedRatio: 0,
    }
    const results = ['50', '70', '90'].map((hour) => runEntryQueueScenario(scenario, { hour }))

    expect(results.map((result) => result.utilizationPercent)).toEqual([50, 70, 90])
    expect(results[0].averageWaitSeconds).toBeLessThan(results[1].averageWaitSeconds)
    expect(results[1].averageWaitSeconds).toBeLessThan(results[2].averageWaitSeconds)
  })

  it('11시에는 대기가 생기고 창구 1개에서는 시간 내 미처리가 누적된다', () => {
    const regular = runEntryQueueScenario(vienna1900Sims[0], {
      hour: '11',
      counters: 3,
      prebookedRatio: 0.35,
    })
    const saturated = runEntryQueueScenario(vienna1900Sims[0], {
      hour: '11',
      counters: 1,
      prebookedRatio: 0.35,
    })

    expect(regular.averageWaitSeconds).toBeGreaterThan(0)
    expect(saturated.averageWaitSeconds).toBeGreaterThan(regular.averageWaitSeconds)
    expect(saturated.unprocessed).toBeGreaterThan(0)
  })

  it('창구 추가와 예약 확대의 이용률·대기 감소 방향이 일치한다', () => {
    const baseline = runEntryQueueScenario(vienna1900Sims[0], {
      hour: '10',
      counters: 1,
      prebookedRatio: 0.35,
    })
    const extraCounter = runEntryQueueScenario(vienna1900Sims[0], {
      hour: '10',
      counters: 2,
      prebookedRatio: 0.35,
    })
    const morePrebooked = runEntryQueueScenario(vienna1900Sims[0], {
      hour: '10',
      counters: 1,
      prebookedRatio: 0.6,
    })

    expect(extraCounter.utilizationPercent).toBeLessThan(baseline.utilizationPercent)
    expect(morePrebooked.utilizationPercent).toBeLessThan(baseline.utilizationPercent)
    expect(extraCounter.averageWaitSeconds).toBeLessThan(baseline.averageWaitSeconds)
    expect(morePrebooked.averageWaitSeconds).toBeLessThan(baseline.averageWaitSeconds)
    expect(extraCounter.utilizationPercent).toBeLessThan(morePrebooked.utilizationPercent)
    expect(extraCounter.averageWaitSeconds).toBeLessThan(morePrebooked.averageWaitSeconds)
  })
})

describe('부다페스트 온천 08–09시 고정 시드 큐', () => {
  it.each(['08', '09'])('%s시 집계는 도착 ≥ 처리이고 정규화 이용률은 0..1이다', (hour) => {
    const result = runEntryQueueScenario(budapestBathsSims[0], { hour, counters: 2 })
    const normalizedUtilization = result.utilizationPercent / 100

    expect(result.arrivals).toBeGreaterThanOrEqual(result.completed)
    expect(result.completed + result.unprocessed).toBe(result.arrivals)
    expect(normalizedUtilization).toBeGreaterThanOrEqual(0)
    expect(normalizedUtilization).toBeLessThanOrEqual(1)
  })

  it.each(['08', '09'])('%s시에는 창구를 2개에서 3개로 늘리면 평균 대기가 줄어든다', (hour) => {
    const twoCounters = runEntryQueueScenario(budapestBathsSims[0], { hour, counters: 2 })
    const threeCounters = runEntryQueueScenario(budapestBathsSims[0], { hour, counters: 3 })

    expect(threeCounters.averageWaitSeconds).toBeLessThan(twoCounters.averageWaitSeconds)
    expect(threeCounters.utilizationPercent).toBeLessThan(twoCounters.utilizationPercent)
  })
})
