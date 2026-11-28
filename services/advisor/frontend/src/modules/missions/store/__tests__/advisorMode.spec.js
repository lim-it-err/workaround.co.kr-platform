import { afterEach, describe, expect, it, vi } from 'vitest'
import { detectMode, healthUrl, modeFromHealth } from '../advisorMode.js'

const ok = (body) => async () => ({ ok: true, json: async () => body })

describe('advisorMode — /health 로 모드 판별', () => {
  afterEach(() => vi.useRealTimers())

  it('API 주소의 오리진 + /health 를 조회한다', () => {
    expect(healthUrl('http://localhost:8080/api/advisor')).toBe('http://localhost:8080/health')
  })

  it.each([
    ['claude', 'local-claude', '로컬 · Claude 리뷰', true],
    ['ollama', 'local-ollama', '로컬 · Ollama 리뷰', true],
    ['mock', 'local-practice', '로컬 · 연습 리뷰', false],
  ])('profile %s → %s', async (profile, kind, label, llm) => {
    const mode = await detectMode({ fetchImpl: ok({ status: 'ok', profile }) })
    expect(mode).toMatchObject({ kind, label, llm, local: true })
  })

  it('profile 누락(구버전 백엔드)은 로컬 · 연습', async () => {
    const mode = await detectMode({ fetchImpl: ok({ status: 'ok', service: 'advisor' }) })
    expect(mode).toMatchObject({ kind: 'local-practice', llm: false, local: true })
    expect(modeFromHealth(null).kind).toBe('local-practice')
  })

  it('네트워크 실패 → 배포 · 연습', async () => {
    const mode = await detectMode({ fetchImpl: async () => { throw new TypeError('fetch failed') } })
    expect(mode).toMatchObject({ kind: 'deploy-practice', label: '배포 · 연습 리뷰', local: false })
  })

  it('비정상 HTTP 응답 → 배포 · 연습', async () => {
    const mode = await detectMode({ fetchImpl: async () => ({ ok: false, json: async () => ({}) }) })
    expect(mode.kind).toBe('deploy-practice')
  })

  it('타임아웃: 응답이 오지 않으면 abort 후 배포 · 연습', async () => {
    vi.useFakeTimers()
    const hanging = (url, { signal }) => new Promise((_, reject) => {
      signal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')))
    })
    const pending = detectMode({ fetchImpl: hanging, timeoutMs: 1500 })
    await vi.advanceTimersByTimeAsync(1500)
    expect((await pending).kind).toBe('deploy-practice')
  })
})
