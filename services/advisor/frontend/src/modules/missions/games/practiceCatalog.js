import cards from '../data/sampleCards.js'
import swipeData from '../data/sampleSwipeCards.js'
import probeData from '../data/sampleProbeRounds.js'
import boundaryData from '../data/sampleBoundaryRounds.js'
import caseData from '../data/sampleCaseFiles.js'
import { newGameCatalog } from '../data/inflightContent.js'

function cardRound(card, type) {
  return {
    ...card,
    type,
    title: card.bookTitle ?? card.filmTitle,
    situation: card.insight ?? card.scene,
    explanation: card.csLink ?? card.systemReading,
    minutes: 3,
    fork: cards.cardForks[card.id] ?? null,
  }
}

function game(id, title, emoji, description, minutes, rounds, type = id) {
  return { id, title, emoji, description, minutes, type, rounds: rounds.map((round) => ({ ...round, type, minutes: round.minutes ?? minutes })) }
}

export const practiceCatalog = [
  game('reading', '독서 카드', '📖', '책의 통찰을 시스템 설계 질문으로 바꿉니다.', 3, cards.readingCards.map((card) => cardRound(card, 'reading')), 'reading'),
  game('cinema', '시사회 카드', '🎬', '영화 장면을 구조·운영의 언어로 읽습니다.', 3, cards.cinemaCards.map((card) => cardRound(card, 'cinema')), 'cinema'),
  game('swipe', '머지 or 반려', '🃏', '코드와 계약의 경계를 판정합니다.', 5, swipeData.swipeCards, 'swipe'),
  game('probe', '한 번만 물어본다면', '🔬', '가설을 가장 많이 줄이는 관측을 고릅니다.', 5, probeData.probeRounds, 'probe'),
  game('boundary', '경계선 한 칸', '✂️', '실패가 머물 트랜잭션 경계를 선택합니다.', 5, boundaryData.boundaryRounds, 'boundary'),
  game('case', '사건 파일', '🕵️', '5개 단서를 자유롭게 열어 근본 원인을 추리합니다.', 30, caseData.caseFiles, 'case'),
  ...newGameCatalog.map((entry) => game(entry.id, entry.title, entry.emoji, entry.description, entry.minutes, entry.rounds, 'choice')),
]

export function getPracticeGame(gameId) {
  return practiceCatalog.find((entry) => entry.id === gameId) ?? null
}

export function getPracticeRound(gameId, roundId) {
  const selectedGame = getPracticeGame(gameId)
  if (!selectedGame) return null
  return selectedGame.rounds.find((round) => round.id === roundId) ?? selectedGame.rounds[0] ?? null
}

export function nextPracticeRound(selectedGame, roundId, completed = [], mode = 'next') {
  if (!selectedGame?.rounds?.length) return null
  if (mode === 'random') {
    const alternatives = selectedGame.rounds.filter((round) => round.id !== roundId)
    return alternatives[Math.floor(Math.random() * alternatives.length)] ?? selectedGame.rounds[0]
  }
  if (mode === 'unseen') {
    return selectedGame.rounds.find((round) => !completed.includes(round.id)) ?? selectedGame.rounds[0]
  }
  const index = selectedGame.rounds.findIndex((round) => round.id === roundId)
  return selectedGame.rounds[(index + 1 + selectedGame.rounds.length) % selectedGame.rounds.length]
}
