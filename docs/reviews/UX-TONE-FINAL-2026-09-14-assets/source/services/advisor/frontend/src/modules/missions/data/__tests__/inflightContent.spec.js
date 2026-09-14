import { describe, expect, it } from 'vitest'
import cards from '../sampleCards.js'
import swipeData from '../sampleSwipeCards.js'
import probeData from '../sampleProbeRounds.js'
import boundaryData from '../sampleBoundaryRounds.js'
import caseData from '../sampleCaseFiles.js'
import { extraMissions, inflightUnitCount, newGameCatalog } from '../inflightContent.js'

describe('TKT-098 기내 콘텐츠 팩', () => {
  it('기존 5종 확장 목표와 100개 신규 단위를 충족한다', () => {
    expect(cards.readingCards).toHaveLength(20)
    expect(cards.cinemaCards).toHaveLength(16)
    expect(swipeData.swipeCards).toHaveLength(36)
    expect(probeData.probeRounds).toHaveLength(15)
    expect(boundaryData.boundaryRounds).toHaveLength(12)
    expect(caseData.caseFiles).toHaveLength(8)
    expect(caseData.caseFiles.flatMap((caseFile) => caseFile.days)).toHaveLength(40)
    expect(inflightUnitCount).toBe(130)
  })

  it('ID 중복·빈 해설·깨진 선택 참조가 없다', () => {
    const collections = [
      cards.readingCards, cards.cinemaCards, swipeData.swipeCards,
      probeData.probeRounds, boundaryData.boundaryRounds, caseData.caseFiles,
      extraMissions, ...newGameCatalog.map((game) => game.rounds),
    ]
    for (const collection of collections) {
      const ids = collection.map((entry) => entry.id)
      expect(new Set(ids).size).toBe(ids.length)
    }
    expect(swipeData.swipeCards.every((round) => round.explain?.trim())).toBe(true)
    expect(probeData.probeRounds.every((round) => round.resolution?.trim() && round.probes.some((probe) => probe.key === round.bestProbeKey))).toBe(true)
    expect(boundaryData.boundaryRounds.every((round) => round.recommendNote?.trim() && round.outcomes[round.recommendedKey])).toBe(true)
    expect(caseData.caseFiles.every((caseFile) => caseFile.finale.explanation?.trim() && caseFile.finale.options.some((option) => option.key === caseFile.finale.answerKey))).toBe(true)
  })

  it('신규 게임 3종에 각 8개 완결 판이 있다', () => {
    expect(newGameCatalog.map((game) => game.id)).toEqual(['minimal-repro', 'concurrency-sequencing', 'bulkheads'])
    for (const game of newGameCatalog) {
      expect(game.rounds).toHaveLength(8)
      for (const round of game.rounds) {
        expect(round.situation).toBeTruthy()
        expect(round.choices).toHaveLength(3)
        expect(round.choices.every((choice) => choice.immediate && choice.aftermath)).toBe(true)
        expect(round.explanation).toBeTruthy()
      }
    }
  })

  it('신규 도메인 6개가 난이도 균형과 구현·검토 필드를 갖춘다', () => {
    expect(extraMissions).toHaveLength(6)
    expect(extraMissions.map((mission) => mission.difficulty).sort()).toEqual(['Easy', 'Easy', 'Hard', 'Hard', 'Normal', 'Normal'])
    for (const mission of extraMissions) {
      expect(mission.briefing.content).toContain('합성 학습 시나리오')
      expect(mission.requirements.join(' ')).toContain('코드 판독')
      expect(mission.requirements.join(' ')).toContain('설계 리뷰')
      expect(mission.requirements.join(' ')).toContain('실제 수정')
      expect(mission.rubric.reduce((sum, item) => sum + item.weight, 0)).toBe(100)
      expect(mission.plannerReview.dimensions.length).toBeGreaterThanOrEqual(4)
    }
  })
})
