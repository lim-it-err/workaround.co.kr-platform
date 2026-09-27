import { describe, expect, it } from 'vitest'
import { JAVA21_SWIPE_CHOICES, swipeCardsJava21 } from '../swipeCardsJava21.js'

function sentenceCount(text) {
  return (text.match(/[.!?](?:\s|$)/g) ?? []).length
}

describe('TKT-158 Java 21 · Spring Boot 3 판정 덱', () => {
  it('20장과 좋다 10·고친다 10 균형을 지킨다', () => {
    expect(swipeCardsJava21).toHaveLength(20)
    expect(swipeCardsJava21.filter((card) => card.correct === 'good')).toHaveLength(10)
    expect(swipeCardsJava21.filter((card) => card.correct === 'fix')).toHaveLength(10)
    expect(new Set(swipeCardsJava21.map((card) => card.id)).size).toBe(20)
  })

  it('코드·이유·해설과 컴파일 자체 검토 메타데이터가 규칙을 지킨다', () => {
    for (const card of swipeCardsJava21) {
      expect(card.code.split('\n').length, card.id).toBeLessThanOrEqual(8)
      expect(sentenceCount(card.reason), card.id).toBe(1)
      expect(sentenceCount(card.explain), card.id).toBeGreaterThan(0)
      expect(sentenceCount(card.explain), card.id).toBeLessThanOrEqual(2)
      expect(['compiles', 'intentional-error'], card.id).toContain(card.compileStatus)
      expect(card.compileNote.trim(), card.id).not.toBe('')
      expect(card.choices, card.id).toEqual(JAVA21_SWIPE_CHOICES)
      expect(card.choices.some((choice) => choice.key === card.correct), card.id).toBe(true)
    }
  })

  it('요구된 여덟 주제를 모두 포함한다', () => {
    expect(new Set(swipeCardsJava21.map((card) => card.topic))).toEqual(new Set([
      'record', 'sealed', 'switch 패턴 매칭', 'virtual threads',
      '@Transactional 경계', 'Optional', '불변 컬렉션', 'var',
    ]))
  })
})
