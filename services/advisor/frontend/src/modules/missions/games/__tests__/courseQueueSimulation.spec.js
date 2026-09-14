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
})
