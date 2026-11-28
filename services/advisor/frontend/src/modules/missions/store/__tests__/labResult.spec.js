import { describe, expect, it, vi } from 'vitest'
import { fetchLabResult, labGradeBase, relativeTime } from '../labResult.js'

const OK = { missionId: 'm1', commit: 'abcdef1234', gradedAt: '2026-11-28T00:00:00Z', compiled: true, tests: 4, passed: 3, cases: [] }
const res = (body, ok = true) => ({ ok, status: ok ? 200 : 404, text: async () => body })

describe('fetchLabResult', () => {
  it('정상: result 와 review 를 읽고 주소는 lab/<id> 브랜치', async () => {
    const f = vi.fn(async (url) => (url.includes('result.json') ? res(JSON.stringify(OK)) : res('# 리뷰')))
    const out = await fetchLabResult('m1', { fetchImpl: f })
    expect(out.result.passed).toBe(3)
    expect(out.review).toBe('# 리뷰')
    expect(f.mock.calls[0][0]).toBe(`${labGradeBase('m1')}/result.json`)
    expect(labGradeBase('m1')).toBe('https://raw.githubusercontent.com/lim-it-err/workaround.co.kr-platform/lab/m1/labs/advisor/m1/.grade')
  })
  it('review 가 없어도 result 만 돌려준다', async () => {
    const f = async (url) => (url.includes('result.json') ? res(JSON.stringify(OK)) : res('', false))
    expect((await fetchLabResult('m1', { fetchImpl: f })).review).toBeNull()
  })
  it('bust 는 ?t= 쿼리를 붙인다', async () => {
    const f = vi.fn(async () => res(JSON.stringify(OK)))
    await fetchLabResult('m1', { fetchImpl: f, bust: true })
    expect(f.mock.calls[0][0]).toMatch(/result\.json\?t=\d+$/)
  })
  it('404 는 null', async () => {
    expect(await fetchLabResult('m1', { fetchImpl: async () => res('', false) })).toBeNull()
  })
  it('네트워크 오류는 null', async () => {
    expect(await fetchLabResult('m1', { fetchImpl: async () => { throw new Error('net') } })).toBeNull()
  })
  it('이상 JSON·형식 불일치는 null', async () => {
    expect(await fetchLabResult('m1', { fetchImpl: async () => res('{oops') })).toBeNull()
    expect(await fetchLabResult('m1', { fetchImpl: async () => res('{"a":1}') })).toBeNull()
    expect(await fetchLabResult('m1', { fetchImpl: async () => res('[]') })).toBeNull()
  })
  it('컴파일 실패 결과는 유효', async () => {
    const out = await fetchLabResult('m1', { fetchImpl: async (u) => (u.includes('result') ? res('{"compiled":false,"buildTail":"x"}') : res('', false)) })
    expect(out.result.compiled).toBe(false)
  })
  it('타임아웃이면 null', async () => {
    const f = (url, { signal }) => new Promise((_, rej) => signal.addEventListener('abort', () => rej(new Error('abort'))))
    expect(await fetchLabResult('m1', { fetchImpl: f, timeoutMs: 20 })).toBeNull()
  })
})

describe('relativeTime', () => {
  const now = Date.parse('2026-11-28T12:00:00Z')
  it.each([
    ['2026-11-28T11:59:40Z', '방금'],
    ['2026-11-28T11:50:00Z', '10분 전'],
    ['2026-11-28T09:00:00Z', '3시간 전'],
    ['2026-11-26T12:00:00Z', '2일 전'],
    ['bad', ''],
  ])('%s → %s', (iso, exp) => expect(relativeTime(iso, now)).toBe(exp))
})
