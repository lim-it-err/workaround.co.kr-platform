// 로컬 모드 · 배포 버전 구분 (TKT-237, D-039).
// 같은 화면이 어디에 붙었는지(내 맥 백엔드 / 브라우저 안 연습)를 /health 로 한 번 조회해 알려준다.
import { reactive } from 'vue'

export const API_BASE = import.meta.env.VITE_ADVISOR_API ?? 'http://localhost:8080/api/advisor'
export const HEALTH_TIMEOUT_MS = 1_500
export const POLL_INTERVAL_MS = 60_000
export const LOCAL_COMMAND = './local.sh claude'

const MODES = {
  'local-claude': { kind: 'local-claude', local: true, llm: true, label: '로컬 · Claude 리뷰' },
  'local-ollama': { kind: 'local-ollama', local: true, llm: true, label: '로컬 · Ollama 리뷰' },
  'local-practice': { kind: 'local-practice', local: true, llm: false, label: '로컬 · 연습 리뷰' },
  'deploy-practice': { kind: 'deploy-practice', local: false, llm: false, label: '배포 · 연습 리뷰' },
}

export function healthUrl(apiBase = API_BASE) {
  try {
    const base = typeof location !== 'undefined' ? location.href : 'http://localhost/'
    return `${new URL(apiBase, base).origin}/health`
  } catch {
    return null
  }
}

// 순수 판별 — 응답이 없거나 이상하면 배포·연습, profile 누락(구버전 백엔드)은 로컬·연습.
export function modeFromHealth(data) {
  const profile = data && typeof data.profile === 'string' ? data.profile.toLowerCase() : ''
  if (profile === 'claude') return { ...MODES['local-claude'], profile }
  if (profile === 'ollama') return { ...MODES['local-ollama'], profile }
  return { ...MODES['local-practice'], profile: profile || null }
}

export async function detectMode({ fetchImpl, timeoutMs = HEALTH_TIMEOUT_MS, apiBase = API_BASE } = {}) {
  const doFetch = fetchImpl ?? (typeof fetch === 'function' ? fetch.bind(globalThis) : null)
  const url = healthUrl(apiBase)
  if (!doFetch || !url) return { ...MODES['deploy-practice'], profile: null }
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await doFetch(url, { signal: controller.signal })
    if (!res.ok) return { ...MODES['deploy-practice'], profile: null }
    let data = null
    try { data = await res.json() } catch { /* 본문이 JSON 이 아니어도 서버는 있다 */ }
    return modeFromHealth(data)
  } catch {
    return { ...MODES['deploy-practice'], profile: null }
  } finally {
    clearTimeout(timer)
  }
}

// 첫 조회 전에는 배포·연습으로 가정(가장 보수적) — checked 로 구분한다.
export const advisorMode = reactive({ ...MODES['deploy-practice'], profile: null, checked: false })

export async function refreshMode(options) {
  const next = await detectMode(options)
  Object.assign(advisorMode, next, { checked: true })
  return advisorMode
}

let pollTimer = null
let users = 0

// 화면 진입 시 호출. 탭이 보일 때만 60초마다 다시 조회한다. 반환 함수로 해제.
export function startModePolling() {
  users += 1
  if (users === 1) {
    refreshMode()
    pollTimer = setInterval(() => {
      if (typeof document === 'undefined' || document.visibilityState === 'visible') refreshMode()
    }, POLL_INTERVAL_MS)
  } else if (!advisorMode.checked) {
    refreshMode()
  }
  return () => {
    users = Math.max(0, users - 1)
    if (users === 0 && pollTimer) {
      clearInterval(pollTimer)
      pollTimer = null
    }
  }
}

// 리뷰가 어디서 만들어졌는지 — 'llm' | 'practice'. 연습 리뷰 표식에 쓴다.
export function currentReviewSource() {
  return advisorMode.checked && advisorMode.llm ? 'llm' : 'practice'
}
