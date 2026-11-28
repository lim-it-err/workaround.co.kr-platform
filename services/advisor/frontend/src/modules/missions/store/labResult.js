// 온라인 채점 결과 — lab/<미션id> 브랜치의 .grade/result.json 을 공개 raw 주소에서 읽는다(TKT-245 형식).
// 실패(404·네트워크·시간 초과·JSON 이상)는 모두 조용히 null.

export const LAB_REPO = 'lim-it-err/workaround.co.kr-platform'
export const LAB_TIMEOUT_MS = 3000

export function labGradeBase(missionId) {
  const id = encodeURIComponent(missionId)
  return `https://raw.githubusercontent.com/${LAB_REPO}/lab/${id}/labs/advisor/${id}/.grade`
}

async function getText(url, fetchImpl, timeoutMs) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetchImpl(url, { signal: ctrl.signal, cache: 'no-store' })
    if (!res.ok) return null
    return await res.text()
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

function validResult(r) {
  if (!r || typeof r !== 'object' || Array.isArray(r)) return false
  if (r.compiled === false) return true
  return Number.isFinite(r.tests) && Number.isFinite(r.passed)
}

// 반환: { result, review } 또는 null. review 는 없으면 null. bust=true 면 `?t=` 로 raw 캐시를 건너뛴다.
export async function fetchLabResult(missionId, { bust = false, fetchImpl, timeoutMs = LAB_TIMEOUT_MS } = {}) {
  const doFetch = fetchImpl ?? ((...a) => fetch(...a))
  const q = bust ? `?t=${Date.now()}` : ''
  const base = labGradeBase(missionId)
  const [rawResult, rawReview] = await Promise.all([
    getText(`${base}/result.json${q}`, doFetch, timeoutMs),
    getText(`${base}/review.md${q}`, doFetch, timeoutMs),
  ])
  if (rawResult == null) return null
  let result
  try { result = JSON.parse(rawResult) } catch { return null }
  if (!validResult(result)) return null
  return { result, review: rawReview && rawReview.trim() ? rawReview : null }
}

export function relativeTime(iso, now = Date.now()) {
  const t = Date.parse(iso)
  if (!Number.isFinite(t)) return ''
  const sec = Math.max(0, Math.round((now - t) / 1000))
  if (sec < 60) return '방금'
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}분 전`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}시간 전`
  return `${Math.floor(hr / 24)}일 전`
}
