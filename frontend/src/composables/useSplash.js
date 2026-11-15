import { computed, onBeforeUnmount, ref } from 'vue'
import { pickSplashTicker } from '../data/splashTicker.js'

const SPLASH_DURATION_MS = 5500
const SPLASH_PHRASE_INTERVAL_MS = 1660
const SPLASH_TICKER_INTERVAL_MS = 1500
const SPLASH_RETURN_DURATION_MS = 2500
const SPLASH_RETURN_SETTLE_LIMIT_MS = 1600
const SPLASH_RETURN_READING_MS = 1000
const SPLASH_RETURN_MAX_DURATION_MS = 2800
export const SPLASH_DOOR_OPENING_MS = 500
const SPLASH_SEEN_STORAGE_KEY = 'splash:seen'
const SPLASH_SEEN_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000

const splashPhrases = ['WORKING AROUND', 'MIND THE GAP', 'DOORS OPENING']
const splashCellCount = Math.max(...splashPhrases.map((phrase) => phrase.length))
const splashLatinCharset = ' ABCDEFGHIJKLMNOPQRSTUVWXYZ'

/**
 * 스플래시(플랩 보드·티커·재방문·자동 전환 타이머)의 상태와 타이머.
 * - prefersReducedMotion: App 이 소유한 ref (라우트 문 전환과 공유).
 * - isActive(): 지금 스플래시 화면이 떠 있는지(라이브 라우트 + page === 'splash').
 * - onTransition({ reducedMotion }): 자동 전환 시각이 되면 호출. 문 열기 시작/페이지 전환은 App 이 한다.
 * 타이머는 이 composable 의 onBeforeUnmount 에서 정리한다.
 */
export function useSplash({ prefersReducedMotion, isActive, onTransition }) {
  const currentTicker = ref('')
  const currentSplashPhrase = ref(splashPhrases[0])
  const isReturnVisitSplash = ref(false)
  const splashDurationMs = ref(SPLASH_DURATION_MS)
  const splashBoardCells = ref(
    Array.from({ length: splashCellCount }, (_, index) => createSplashCellState(`splash-${index}`))
  )
  const splashAutoTransitionLabel = computed(() => `${splashDurationMs.value / 1000}초 후 자동 전환`)

  let splashTimer
  let splashAnimationRunId = 0
  let splashAnimationTimers = []
  const splashTickerShown = new Set()
  let splashRunStartedAtMs = 0
  let splashTickerIndex = 0
  let settledSplashRunId = 0

  function createSplashCellState(key) {
    return {
      key,
      currentCharacter: ' ',
      topStatic: displaySplashCharacter(' '),
      bottomStatic: displaySplashCharacter(' '),
      topFlip: displaySplashCharacter(' '),
      bottomFlip: displaySplashCharacter(' '),
      isRunning: false,
      isSettling: false,
      durationMs: '330ms'
    }
  }

  function readRecentSplashVisit() {
    if (typeof window === 'undefined') {
      return false
    }

    try {
      const seenAt = window.localStorage.getItem(SPLASH_SEEN_STORAGE_KEY)
      if (!seenAt) {
        return false
      }
      const seenAtMs = Date.parse(seenAt)
      if (!Number.isFinite(seenAtMs) || Date.now() - seenAtMs >= SPLASH_SEEN_MAX_AGE_MS) {
        window.localStorage.removeItem(SPLASH_SEEN_STORAGE_KEY)
        return false
      }
      return true
    } catch (error) {
      return false
    }
  }

  function markSplashVisitComplete() {
    if (typeof window === 'undefined') {
      return
    }

    try {
      window.localStorage.setItem(SPLASH_SEEN_STORAGE_KEY, new Date().toISOString())
    } catch (error) {
      // 저장할 수 없는 환경은 다음 방문도 첫 방문 흐름으로 시작한다.
    }
  }

  function setSplashVisitMode(returnVisit) {
    isReturnVisitSplash.value = returnVisit
    splashDurationMs.value = returnVisit ? SPLASH_RETURN_DURATION_MS : SPLASH_DURATION_MS
  }

  function displaySplashCharacter(character) {
    return character === ' ' ? '\u00A0' : character
  }

  function centerSplashPhrase(phrase) {
    const leftPadding = Math.floor((splashCellCount - phrase.length) / 2)
    return `${' '.repeat(leftPadding)}${phrase}`.padEnd(splashCellCount, ' ')
  }

  function updateSplashCellDisplay(cell, character) {
    const display = displaySplashCharacter(character)
    cell.currentCharacter = character
    cell.topStatic = display
    cell.bottomStatic = display
    cell.topFlip = display
    cell.bottomFlip = display
    cell.isRunning = false
    cell.isSettling = false
  }

  function resetSplashBoard() {
    splashBoardCells.value.forEach((cell) => updateSplashCellDisplay(cell, ' '))
  }

  function setSplashBoardToPhrase(phrase) {
    const target = centerSplashPhrase(phrase)
    splashBoardCells.value.forEach((cell, index) => {
      updateSplashCellDisplay(cell, target.charAt(index) || ' ')
    })
    currentSplashPhrase.value = phrase
  }

  function buildSplashFlipSequence(targetCharacter, charIndex, compact = false) {
    const spins =
      targetCharacter === ' '
        ? (Math.random() < 0.3 ? 1 : 0)
        : compact
          ? 1 + (charIndex % 2)
          : 1 + (charIndex % 2) + Math.floor(Math.random() * 2)
    const sequence = []
    for (let spinIndex = 0; spinIndex < spins; spinIndex += 1) {
      sequence.push(splashLatinCharset.charAt(1 + Math.floor(Math.random() * (splashLatinCharset.length - 1))))
    }
    sequence.push(targetCharacter)
    return sequence
  }

  function queueSplashAnimation(callback, delayMs) {
    const timer = window.setTimeout(() => {
      splashAnimationTimers = splashAnimationTimers.filter((entry) => entry !== timer)
      callback()
    }, delayMs)
    splashAnimationTimers.push(timer)
  }

  function clearSplashAnimationTimers() {
    splashAnimationTimers.forEach((timer) => window.clearTimeout(timer))
    splashAnimationTimers = []
  }

  function animateSplashCellFlip(cell, nextCharacter, durationMs, settle, runId, onComplete) {
    if (runId !== splashAnimationRunId) {
      return
    }
    if (nextCharacter === cell.currentCharacter) {
      onComplete()
      return
    }

    const currentDisplay = displaySplashCharacter(cell.currentCharacter)
    const nextDisplay = displaySplashCharacter(nextCharacter)
    cell.topStatic = nextDisplay
    cell.bottomStatic = currentDisplay
    cell.topFlip = currentDisplay
    cell.bottomFlip = nextDisplay
    cell.durationMs = `${Math.round(durationMs)}ms`
    cell.isRunning = false
    cell.isSettling = settle

    queueSplashAnimation(() => {
      if (runId !== splashAnimationRunId) {
        return
      }
      cell.isRunning = true
      queueSplashAnimation(() => {
        if (runId !== splashAnimationRunId) {
          return
        }
        updateSplashCellDisplay(cell, nextCharacter)
        onComplete()
      }, Math.round(durationMs * (settle ? 1.18 : 1.02)) + 20)
    }, 0)
  }

  function playSplashCellSequence(cell, sequence, stepDurationMs, runId, index = 0, onComplete = () => {}) {
    if (runId !== splashAnimationRunId) {
      return
    }
    const nextCharacter = sequence[index]
    const isLast = index === sequence.length - 1
    const durationMs = isLast ? 180 : stepDurationMs

    animateSplashCellFlip(cell, nextCharacter, durationMs, isLast, runId, () => {
      if (!isLast) {
        playSplashCellSequence(cell, sequence, stepDurationMs, runId, index + 1, onComplete)
      } else {
        onComplete()
      }
    })
  }

  function markReturnSplashSettled(runId) {
    if (
      runId !== splashAnimationRunId
      || settledSplashRunId === runId
      || !isReturnVisitSplash.value
      || currentSplashPhrase.value !== splashPhrases.at(-1)
    ) {
      return
    }
    settledSplashRunId = runId
    const settledAtMs = Math.max(0, Date.now() - splashRunStartedAtMs)
    const transitionAtMs = Math.min(
      SPLASH_RETURN_MAX_DURATION_MS,
      Math.max(SPLASH_RETURN_DURATION_MS, settledAtMs + SPLASH_RETURN_READING_MS)
    )
    splashDurationMs.value = transitionAtMs
    scheduleSplashTransition()
  }

  function animateSplashPhrase(phrase, runId) {
    if (runId !== splashAnimationRunId) {
      return
    }
    const target = centerSplashPhrase(phrase)
    const compact = isReturnVisitSplash.value
    let pendingCells = splashBoardCells.value.length
    currentSplashPhrase.value = phrase
    splashBoardCells.value.forEach((cell, charIndex) => {
      const targetCharacter = target.charAt(charIndex) || ' '
      const delayMs = compact
        ? 80 + charIndex * 16
        : 100 + charIndex * 22
      const stepDurationMs = compact
        ? 42
        : 48
      const sequence = buildSplashFlipSequence(targetCharacter, charIndex, compact)
      queueSplashAnimation(() => {
        playSplashCellSequence(cell, sequence, stepDurationMs, runId, 0, () => {
          pendingCells -= 1
          if (pendingCells === 0) markReturnSplashSettled(runId)
        })
      }, delayMs)
    })
  }

  // 스플래시 티커 문구를 바꾸는 유일한 곳이다. 선택 규칙은 data/splashTicker.js 의 pickSplashTicker.
  function rotateSplashTicker(runId) {
    if (runId !== splashAnimationRunId) {
      return
    }
    currentTicker.value = pickSplashTicker(currentTicker.value, splashTickerShown, Math.random, splashTickerIndex, isReturnVisitSplash.value)
    splashTickerIndex += 1
    queueSplashAnimation(() => rotateSplashTicker(runId), SPLASH_TICKER_INTERVAL_MS)
  }

  function playSplashFlap() {
    splashAnimationRunId += 1
    const runId = splashAnimationRunId
    splashRunStartedAtMs = Date.now()
    settledSplashRunId = 0
    clearSplashAnimationTimers()
    const phraseEntries = isReturnVisitSplash.value
      ? [{ phrase: splashPhrases.at(-1), delayMs: 0 }]
      : splashPhrases.map((phrase, phraseIndex) => ({
          phrase,
          delayMs: phraseIndex * SPLASH_PHRASE_INTERVAL_MS
        }))
    // 티커는 플랩 문구와 분리해 회전한다. 모션이 아니라 텍스트 교체이므로 reduced-motion 에서도 돈다.
    splashTickerShown.clear()
    splashTickerIndex = 0
    rotateSplashTicker(runId)

    if (prefersReducedMotion.value) {
      setSplashBoardToPhrase(phraseEntries[0].phrase)
      return
    }

    resetSplashBoard()
    if (isReturnVisitSplash.value) {
      queueSplashAnimation(() => {
        if (runId === splashAnimationRunId && settledSplashRunId !== runId) {
          clearSplashAnimationTimers()
          setSplashBoardToPhrase(splashPhrases.at(-1))
          markReturnSplashSettled(runId)
        }
      }, SPLASH_RETURN_SETTLE_LIMIT_MS)
    }
    phraseEntries.forEach(({ phrase, delayMs }) => {
      queueSplashAnimation(() => {
        animateSplashPhrase(phrase, runId)
      }, delayMs)
    })
  }


  function scheduleSplashTransition() {
    window.clearTimeout(splashTimer)
    const elapsedMs = Math.max(0, Date.now() - splashRunStartedAtMs)
    const doorOpeningMs = prefersReducedMotion.value ? 0 : SPLASH_DOOR_OPENING_MS
    const remainingMs = Math.max(0, splashDurationMs.value - elapsedMs - doorOpeningMs)
    splashTimer = window.setTimeout(() => {
      clearSplashAnimationTimers()
      markSplashVisitComplete()
      onTransition({ reducedMotion: prefersReducedMotion.value })
    }, remainingMs)
  }


  // 첫 진입: 재방문 여부를 읽고 한 번 재생·전환 예약한다.
  function start() {
    setSplashVisitMode(readRecentSplashVisit())
    playSplashFlap()
    scheduleSplashTransition()
  }

  // 모션 설정이 바뀌면 같은 화면에서 다시 그린다(전환 예약은 그대로).
  function restartForMotionChange() {
    if (isActive()) {
      playSplashFlap()
    }
  }

  // `다시 재생`: 첫 방문 흐름으로 되돌려 다시 재생하고 자동 전환을 새로 예약한다.
  function replay() {
    setSplashVisitMode(false)
    playSplashFlap()
    if (isActive()) {
      scheduleSplashTransition()
    }
  }

  // 라우트가 바뀌거나 언마운트될 때 대기 중인 전환·애니메이션 타이머를 모두 끊는다.
  function cancel() {
    window.clearTimeout(splashTimer)
    clearSplashAnimationTimers()
  }

  onBeforeUnmount(cancel)

  return {
    currentTicker,
    currentSplashPhrase,
    splashBoardCells,
    splashAutoTransitionLabel,
    start,
    replay,
    restartForMotionChange,
    cancel
  }
}
