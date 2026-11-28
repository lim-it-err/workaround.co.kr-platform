export const E2E_TIMEZONE_ID = 'Asia/Seoul'
export const E2E_LOCALE = 'ko-KR'

export function newSeoulContext(browser, options = {}) {
  return browser.newContext({
    ...options,
    timezoneId: E2E_TIMEZONE_ID,
    locale: E2E_LOCALE
  })
}

// TKT-235: 파일마다 기대하는 빌드(root-base / Pages-base)가 다르다. 맞지 않는 dist 로 돌리면 타임아웃만 길게 나므로
// 전제가 안 맞을 때는 이유를 적어 skip 한다. 전체 게이트는 `npm --prefix frontend run e2e:all`(scripts/run-e2e.mjs)이다.
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

// dist/index.html 의 에셋 경로로 빌드 종류를 판별한다: 'pages' | 'root' | ''(dist 없음).
export async function readDistKind(distRoot) {
  try {
    const html = await readFile(join(distRoot, 'index.html'), 'utf8')
    return html.includes('/workaround.co.kr-platform/') ? 'pages' : 'root'
  } catch {
    return ''
  }
}

export async function fileExists(path) {
  try {
    await readFile(path)
    return true
  } catch {
    return false
  }
}

export async function isReachable(url) {
  try {
    await fetch(url, { signal: AbortSignal.timeout(1500) })
    return true
  } catch {
    return false
  }
}
