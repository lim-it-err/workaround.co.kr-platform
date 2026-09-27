import { describe, expect, it, vi } from 'vitest'
import { getPracticeGame, nextPracticeRound, practiceCatalog, standalonePracticeCatalog } from '../practiceCatalog.js'

describe('전체 게임 연습 카탈로그', () => {
  it('기존·신규 게임을 모두 노출한다', () => {
    expect(practiceCatalog.map((game) => game.id)).toEqual([
      'reading', 'cinema', 'swipe', 'probe', 'boundary', 'case',
      'minimal-repro', 'concurrency-sequencing', 'bulkheads',
      'v1900-a-style-classifier', 'v1900-4-succession',
      'v1900-3-secession-hang', 'v1900-2-gold-damage', 'v1900-d-perspective',
    ])
    expect(practiceCatalog.every((game) => game.rounds.length > 0)).toBe(true)
    expect(standalonePracticeCatalog).toHaveLength(9)
    expect(standalonePracticeCatalog.reduce((sum, game) => sum + game.rounds.length, 0)).toBe(131)
  })

  it('다음·미열람·무작위 이동을 계산한다', () => {
    const game = getPracticeGame('minimal-repro')
    expect(nextPracticeRound(game, game.rounds[0].id).id).toBe(game.rounds[1].id)
    expect(nextPracticeRound(game, game.rounds[0].id, [game.rounds[0].id], 'unseen').id).toBe(game.rounds[1].id)
    vi.spyOn(Math, 'random').mockReturnValue(0)
    expect(nextPracticeRound(game, game.rounds[0].id, [], 'random').id).toBe(game.rounds[1].id)
  })
})
