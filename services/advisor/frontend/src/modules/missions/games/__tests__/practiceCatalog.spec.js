import { describe, expect, it, vi } from 'vitest'
import { getPracticeGame, nextPracticeRound, practiceCatalog } from '../practiceCatalog.js'

describe('전체 게임 연습 카탈로그', () => {
  it('기존·신규 게임을 모두 노출한다', () => {
    expect(practiceCatalog.map((game) => game.id)).toEqual([
      'reading', 'cinema', 'swipe', 'probe', 'boundary', 'case',
      'minimal-repro', 'concurrency-sequencing', 'bulkheads',
    ])
    expect(practiceCatalog.every((game) => game.rounds.length > 0)).toBe(true)
  })

  it('다음·미열람·무작위 이동을 계산한다', () => {
    const game = getPracticeGame('minimal-repro')
    expect(nextPracticeRound(game, game.rounds[0].id).id).toBe(game.rounds[1].id)
    expect(nextPracticeRound(game, game.rounds[0].id, [game.rounds[0].id], 'unseen').id).toBe(game.rounds[1].id)
    vi.spyOn(Math, 'random').mockReturnValue(0)
    expect(nextPracticeRound(game, game.rounds[0].id, [], 'random').id).toBe(game.rounds[1].id)
  })
})

