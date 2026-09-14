import { describe, expect, it } from 'vitest'
import { vienna1900Sims } from '../../data/courseVienna1900.js'
import { runEntryQueueScenario } from '../courseQueueSimulation.js'

describe('비엔나 입장 대기열 전체 실행 집계', () => {
  it.each(['09', '10'])('%s시 도착·처리·대기와 대기시간을 전체 완료 건으로 집계한다', (hour) => {
    const result = runEntryQueueScenario(vienna1900Sims[0], {
      hour,
      counters: 3,
      prebookedRatio: 0.35,
    })

    expect(result.completed).toBeLessThanOrEqual(result.arrivals)
    expect(result.completed + result.waiting).toBe(result.arrivals)
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
