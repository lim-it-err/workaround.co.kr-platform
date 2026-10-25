// 배포 경로 규칙 단일 출처 (TKT-213).
// prepare-github-pages.mjs(복제·블로그 스위치) 와 smoke-pages.mjs(점검) 가 이 모듈만 import 한다.
// 경로 원천: frontend/src/staticRouting.js (LIVE_PAGE_PATHS), services/advisor/frontend/src/modules/missions/routes.js
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../')

// 잠금·운행 중단 경로: 복제하지 않고 404 셸로 둔다. (/blog* 는 prefix 규칙으로 별도 제외)
export const LOCKED_PATHS = ['/runtime', '/ets2/dev', '/blog', '/studio']

// Advisor 경로 아래에 놓이는 접두사
export const ADVISOR_PREFIX = '/advisor'

// 블로그 스위치(BLOG_LINE_OPEN)가 닫혀 있을 때 dist/mockups 에서 지우는 목업 파일
export const BLOG_MOCKUP_FILES = ['blog-archive.html', 'blog-post.html', 'writing-studio.html']

export function extractMainRoutePaths() {
  const content = readFileSync(resolve(projectRoot, 'frontend/src/staticRouting.js'), 'utf8')

  const match = content.match(/const LIVE_PAGE_PATHS = \{([\s\S]*?)\}/)
  if (!match) {
    throw new Error('Cannot find LIVE_PAGE_PATHS in staticRouting.js')
  }

  const paths = []
  // Match lines like: key: '/path',
  for (const line of match[1].split('\n')) {
    const pathMatch = line.match(/:\s*['"]([^'"]+)['"]/)
    if (pathMatch) {
      paths.push(pathMatch[1])
    }
  }
  return paths
}

export function extractAdvisorRoutePaths() {
  const content = readFileSync(resolve(projectRoot, 'services/advisor/frontend/src/modules/missions/routes.js'), 'utf8')

  // 파라미터·중첩이 없는 최상위 경로만 (/today, /learn ...). '/courses/:courseId/sim/:missionId' 같은 것은 제외.
  const paths = new Set()
  for (const match of content.matchAll(/path:\s*['"]([^'"]+)['"]/g)) {
    const path = match[1]
    if (!path.includes(':') && !path.includes('/')) {
      paths.add(`/${path}`)
    } else if (path.startsWith('/') && !path.slice(1).includes('/') && !path.includes(':')) {
      paths.add(path)
    }
  }
  return Array.from(paths)
}

// 복제 제외 판단: 루트, /blog*, LOCKED_PATHS
export function isExcludedMainPath(path) {
  return path === '/' || path === '' || path.startsWith('/blog') || LOCKED_PATHS.includes(path)
}

// index.html 복사본을 만들 메인 경로 (제외 규칙 적용)
export function copiedMainPaths() {
  return extractMainRoutePaths().filter((path) => !isExcludedMainPath(path))
}

// 복제 대상 전체: 메인 경로 + /advisor 아래 Advisor 경로
export function copiedPaths() {
  const paths = new Set(copiedMainPaths())
  for (const path of extractAdvisorRoutePaths()) {
    paths.add(`${ADVISOR_PREFIX}${path}`)
  }
  return Array.from(paths)
}

// 블로그 스위치 판단: lines.js 의 BLOG_LINE_OPEN
export function readBlogLineOpen() {
  const content = readFileSync(resolve(projectRoot, 'frontend/src/data/lines.js'), 'utf8')
  const match = content.match(/export\s+const\s+BLOG_LINE_OPEN\s*=\s*(true|false)/)
  if (!match) {
    throw new Error('Cannot find BLOG_LINE_OPEN in lines.js')
  }
  return match[1] === 'true'
}

// 블로그 스위치가 닫혔을 때 지울 목업 파일 판정 (명시 목록 또는 blog-*.html)
export function isBlogMockupFile(fileName) {
  return BLOG_MOCKUP_FILES.includes(fileName) || (fileName.startsWith('blog-') && fileName.endsWith('.html'))
}
