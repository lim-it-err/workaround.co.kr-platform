import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createRequire } from 'node:module'
import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const { chromium } = createRequire(import.meta.url)('playwright')
const publicBase = '/workaround.co.kr-platform/'
const distRoot = fileURLToPath(new URL('../../dist/', import.meta.url))
const storageKey = 'workaround-blog-posts'
const posts = [
  {
    id: 'tone-latest',
    slug: 'city-speed',
    title: '낯선 도시에서 속도를 고르는 법',
    summary: '여행 일정은 많이 보는 목록이 아니라, 오늘의 선택을 돕는 지도였다.',
    bodyMarkdown: '좋은 일정은 다음 선택을 쉽게 만드는 단서가 충분한 계획이었다.\n\n> 여행의 속도는 기억할 장면의 밀도로 정한다.\n\n<img src=x onerror="window.blogXss=1">\n\n[위험](javascript:alert(1))',
    status: 'published',
    tags: ['여행', '도시', '기록', '숨김 분류'],
    createdAt: '2026-09-09T08:00:00.000Z',
    updatedAt: '2026-09-09T08:00:00.000Z',
    publishedAt: '2026-09-09T08:00:00.000Z'
  },
  {
    id: 'tone-first-day',
    slug: 'one-win-first-day',
    title: '첫날에는 하나만 성공하기',
    summary: '첫날의 기준을 한 가지로 줄인 기록.',
    bodyMarkdown: '첫날은 한 장소만 제대로 기억해도 충분하다.',
    status: 'published',
    tags: ['여행'],
    createdAt: '2026-09-08T08:00:00.000Z',
    updatedAt: '2026-09-08T08:00:00.000Z',
    publishedAt: '2026-09-08T08:00:00.000Z'
  },
  {
    id: 'tone-offline',
    slug: 'offline-work',
    title: '오프라인에서도 이어지는 작업',
    summary: '연결이 없어도 기록은 이어진다.',
    bodyMarkdown: '로컬에 먼저 남기고 연결 뒤에 이어간다.',
    status: 'published',
    tags: ['개발'],
    createdAt: '2026-09-04T08:00:00.000Z',
    updatedAt: '2026-09-04T08:00:00.000Z',
    publishedAt: '2026-09-04T08:00:00.000Z'
  },
  {
    id: 'tone-draft',
    slug: 'private-draft',
    title: '비공개 초안',
    summary: '공개 화면에 보이면 안 된다.',
    bodyMarkdown: '초안 본문',
    status: 'draft',
    tags: ['초안'],
    createdAt: '2026-09-10T08:00:00.000Z',
    updatedAt: '2026-09-10T08:00:00.000Z',
    publishedAt: ''
  },
  {
    id: 'tone-archived',
    slug: 'private-archived',
    title: '보관된 글',
    summary: '공개 화면에 보이면 안 된다.',
    bodyMarkdown: '보관 본문',
    status: 'archived',
    tags: ['보관'],
    createdAt: '2026-09-01T08:00:00.000Z',
    updatedAt: '2026-09-11T08:00:00.000Z',
    publishedAt: '2026-09-01T08:00:00.000Z'
  }
]
let base = process.env.BLOG_TEST_URL || ''
let browser
let server

before(async () => {
  if (!base) {
    server = createServer(serveStaticBuild)
    await new Promise((resolve, reject) => {
      server.once('error', reject)
      server.listen(0, '127.0.0.1', resolve)
    })
    base = `http://127.0.0.1:${server.address().port}${publicBase}`
  }
  browser = await chromium.launch({ headless: true })
})

after(async () => {
  await browser?.close()
  if (server) await new Promise(resolve => server.close(resolve))
})

async function serveStaticBuild(request, response) {
  const url = new URL(request.url, 'http://127.0.0.1')
  const decodedPath = decodeURIComponent(url.pathname)
  const relativePath = decodedPath.startsWith(publicBase)
    ? decodedPath.slice(publicBase.length)
    : decodedPath.replace(/^\/+/, '')
  let filePath = join(distRoot, relativePath || 'index.html')
  try {
    if ((await stat(filePath)).isDirectory()) filePath = join(filePath, 'index.html')
  } catch {
    filePath = join(distRoot, 'index.html')
  }
  const contentTypes = {
    '.css': 'text/css',
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.svg': 'image/svg+xml'
  }
  response.writeHead(200, { 'content-type': contentTypes[extname(filePath)] || 'application/octet-stream' })
  response.end(await readFile(filePath))
}

async function setup(t, scenario) {
  const context = await browser.newContext({
    viewport: { width: scenario.width, height: scenario.height },
    reducedMotion: 'reduce'
  })
  const page = await context.newPage()
  const errors = []
  const apiRequests = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => {
    if (['error', 'warning'].includes(message.type())) errors.push(message.text())
  })
  page.on('request', request => {
    if (new URL(request.url()).pathname.includes('/api/')) apiRequests.push(request.url())
  })
  await page.addInitScript(({ posts, storageKey, theme }) => {
    localStorage.setItem(storageKey, JSON.stringify(posts))
    localStorage.setItem('workaround-theme', theme)
  }, { posts, storageKey, theme: scenario.theme })
  t.after(async () => {
    await context.close()
    assert.deepEqual(errors, [], '브라우저 오류나 경고가 없어야 한다')
    assert.deepEqual(apiRequests, [], '정적 글 화면은 API를 호출하지 않아야 한다')
  })
  await page.goto(`${base}blog-district`)
  await page.getByRole('heading', { name: posts[0].title, exact: true }).waitFor()
  return page
}

async function assertNoOverflow(page, selector) {
  const values = await page.evaluate(selector => ['html', 'body', '.page-scroller', selector].map(candidate => {
    const element = document.querySelector(candidate)
    return [candidate, element ? Math.max(0, element.scrollWidth - element.clientWidth) : 0]
  }), selector)
  for (const [candidate, value] of values) {
    assert.equal(value, 0, `${candidate} 가로 넘침이 없어야 한다`)
  }
}

for (const scenario of [
  { width: 375, height: 812, theme: 'dark' },
  { width: 1440, height: 900, theme: 'light' }
]) {
  test(`${scenario.width}px ${scenario.theme}: 허브·보관함·글 상세의 정적 읽기 흐름`, async t => {
    const page = await setup(t, scenario)

    assert.equal(await page.getByText('비공개 초안', { exact: true }).count(), 0)
    assert.equal(await page.getByText('보관된 글', { exact: true }).count(), 0)
    assert.equal(await page.getByText('9월 8일 · 여행', { exact: true }).count(), 1)
    assert.equal(await page.locator('.blog-tone-page').evaluate(element => element.getBoundingClientRect().width <= 760), true)
    const titleLinks = page.locator('.blog-text-link')
    assert.equal(await titleLinks.count(), 3)
    assert.equal(await titleLinks.evaluateAll(elements => elements.every(element => {
      const box = element.getBoundingClientRect()
      const style = getComputedStyle(element)
      return box.height >= 40
        && style.backgroundColor === 'rgba(0, 0, 0, 0)'
        && style.borderTopWidth === '0px'
    })), true, '최근 글 제목은 면 없이 40px 이상의 클릭 영역이어야 한다')
    for (const name of ['환승 홀', scenario.theme === 'dark' ? '라이트 모드' : '다크 모드']) {
      const box = await page.getByRole('button', { name, exact: true }).boundingBox()
      assert.ok(box.width >= 40 && box.height >= 40, `${name} 클릭 영역은 40px 이상이어야 한다`)
    }
    await assertNoOverflow(page, '.blog-tone-page')

    if (process.env.BLOG_SCREENSHOT_DIR) {
      await page.screenshot({
        path: `${process.env.BLOG_SCREENSHOT_DIR}/blog-hub-${scenario.width}-${scenario.theme}.png`,
        fullPage: true
      })
    }

    await page.getByRole('button', { name: '보관함', exact: true }).click()
    await page.getByRole('heading', { name: '생각이 지나간 자리', exact: true }).waitFor()
    assert.equal(new URL(page.url()).pathname, `${publicBase}blog`)
    assert.equal(await page.locator('.blog-archive-row').count(), 3)
    assert.equal(await page.getByText('2026년', { exact: true }).count(), 1)
    assert.equal(await page.getByText('비공개 초안', { exact: true }).count(), 0)
    assert.equal(await page.getByText('보관된 글', { exact: true }).count(), 0)
    await assertNoOverflow(page, '.blog-archive-page')

    if (process.env.BLOG_SCREENSHOT_DIR) {
      await page.screenshot({
        path: `${process.env.BLOG_SCREENSHOT_DIR}/blog-archive-${scenario.width}-${scenario.theme}.png`,
        fullPage: true
      })
    }

    await page.locator('.blog-archive-row').filter({ hasText: posts[0].title }).click()
    await page.locator('.post-body').waitFor()
    assert.equal(new URL(page.url()).pathname, `${publicBase}blog/${posts[0].slug}`)
    assert.equal(await page.locator('.post-detail').evaluate(element => element.getBoundingClientRect().width <= 720), true)
    assert.equal(await page.locator('.post-body script, .post-body [onerror], .post-body a[href^="javascript:"]').count(), 0)
    assert.equal(await page.evaluate(() => window.blogXss), undefined)
    assert.equal(await page.getByText('2026년 9월 9일 · 여행', { exact: true }).count(), 1)
    await page.reload()
    await page.locator('.post-body').waitFor()
    assert.match(await page.locator('.post-body').textContent(), /좋은 일정은/)
    await assertNoOverflow(page, '.post-detail')

    if (process.env.BLOG_SCREENSHOT_DIR) {
      await page.screenshot({
        path: `${process.env.BLOG_SCREENSHOT_DIR}/blog-post-${scenario.width}-${scenario.theme}.png`,
        fullPage: true
      })
    }

    await page.goto(`${base}blog/private-draft`)
    await page.locator('.blog-not-found').waitFor()
    await page.goto(`${base}blog/private-archived`)
    await page.locator('.blog-not-found').waitFor()
  })
}
