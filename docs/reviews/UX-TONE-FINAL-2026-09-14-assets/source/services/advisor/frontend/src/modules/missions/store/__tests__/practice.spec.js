import { beforeEach, describe, expect, it, vi } from 'vitest'

function storage() {
  const values = new Map()
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
    clear: () => values.clear(),
  }
}

describe('연습 모드 로컬 상태', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.stubGlobal('localStorage', storage())
  })

  it('데일리 키를 건드리지 않고 연습 전용 키에만 기록한다', async () => {
    localStorage.setItem('advisor.learner.v1', JSON.stringify({
      seasons: {
        activeId: 'season-2026-08-03',
        byId: {
          'season-2026-08-03': {
            id: 'season-2026-08-03',
            start: '2026-08-03',
            end: '2026-08-30',
            gains: [{ source: 'daily' }],
            closedAt: null,
            ending: null,
          },
        },
        pendingGains: [],
      },
    }))
    const { usePractice, PRACTICE_STORAGE_KEY } = await import('../practice.js')
    const practice = usePractice()

    practice.recordAttempt('minimal-repro', 'minimal-repro-01', 'recommended')

    expect(JSON.parse(localStorage.getItem('advisor.learner.v1')).seasons.byId['season-2026-08-03'].gains).toHaveLength(1)
    expect(JSON.parse(localStorage.getItem(PRACTICE_STORAGE_KEY)).completed['minimal-repro']).toEqual(['minimal-repro-01'])
  })

  it('게임 하나의 연습 기록만 선택적으로 지운다', async () => {
    const { usePractice } = await import('../practice.js')
    const practice = usePractice()
    practice.recordAttempt('minimal-repro', 'minimal-repro-01')
    practice.recordAttempt('bulkheads', 'bulkheads-01')

    practice.clearGame('minimal-repro')

    expect(practice.completedIds('minimal-repro')).toEqual([])
    expect(practice.completedIds('bulkheads')).toEqual(['bulkheads-01'])
  })
})
