import { reactive } from 'vue'

export const PRACTICE_STORAGE_KEY = 'advisor.practice.v1'

function defaults() {
  return {
    completed: {},
    attempts: {},
    last: null,
    filters: { query: '', onlyUnseen: false },
    inflight: { duration: 10, taste: 'random', showSeen: false, retryOnly: false, fontScale: 1, lineHeight: 1.65 },
  }
}

export function loadPractice(storage = localStorage) {
  try {
    const saved = JSON.parse(storage.getItem(PRACTICE_STORAGE_KEY)) ?? {}
    const base = defaults()
    return {
      ...base,
      ...saved,
      completed: saved.completed ?? {},
      attempts: saved.attempts ?? {},
      filters: { ...base.filters, ...(saved.filters ?? {}) },
      inflight: { ...base.inflight, ...(saved.inflight ?? {}) },
    }
  } catch {
    return defaults()
  }
}

const state = reactive(loadPractice())

function persist() {
  localStorage.setItem(PRACTICE_STORAGE_KEY, JSON.stringify(state))
}

export function usePractice() {
  return {
    state,
    completedIds(gameId) {
      return state.completed[gameId] ?? []
    },
    isCompleted(gameId, roundId) {
      return (state.completed[gameId] ?? []).includes(roundId)
    },
    recordAttempt(gameId, roundId, choiceKey = 'read') {
      const key = `${gameId}:${roundId}`
      state.attempts[key] = [...(state.attempts[key] ?? []), { choiceKey, at: new Date().toISOString() }]
      const ids = (state.completed[gameId] ??= [])
      if (!ids.includes(roundId)) ids.push(roundId)
      state.last = { gameId, roundId, at: new Date().toISOString() }
      persist()
    },
    remember(gameId, roundId) {
      state.last = { gameId, roundId, at: new Date().toISOString() }
      persist()
    },
    setFilters(patch) {
      Object.assign(state.filters, patch)
      persist()
    },
    setInflight(patch) {
      Object.assign(state.inflight, patch)
      persist()
    },
    clearGame(gameId) {
      delete state.completed[gameId]
      for (const key of Object.keys(state.attempts)) {
        if (key.startsWith(`${gameId}:`)) delete state.attempts[key]
      }
      if (state.last?.gameId === gameId) state.last = null
      persist()
    },
  }
}
