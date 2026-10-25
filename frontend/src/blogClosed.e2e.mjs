// D-031 블로그 본선 운행 중단 — 직접 주소·뒤로가기가 환승 홀로 돌아오고, 어디에도 블로그/스튜디오 문구가 없다.
//
// 두 빌드를 각자 띄워 확인한다.
//   - Pages base : frontend/dist      (npm run build -- --base=/workaround.co.kr-platform/)
//   - root base  : frontend/dist-root (vite build --outDir dist-root) — 다른 위치면 BLOG_CLOSED_ROOT_DIST 로 지정
// Playwright 는 NODE_PATH=services/advisor/frontend/node_modules 로 찾는다.
// 스위치(data/lines.js BLOG_LINE_OPEN)가 켜져 있으면 이 스위트는 의미가 없어 skip 한다.
import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createRequire } from 'node:module'
import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { newSeoulContext } from './e2eContext.mjs'
import { BLOG_LINE_OPEN } from './data/lines.js'

const { chromium } = createRequire(import.meta.url)('playwright')
const skip = BLOG_LINE_OPEN ? '블로그 본선이 열려 있다(BLOG_LINE_OPEN=true)' : false
const CLOSED_MESSAGE = '블로그 노선은 운행을 멈췄습니다'
const BANNED = /블로그|Writing Studio|스튜디오/i
const BLOG_ADDRESSES = ['blog', 'blog/why-blog-district-needs-its-own-rhythm', 'blog/없는-글', 'blog-district', 'studio']

const builds = [
  { name: 'Pages base', publicBase: '/workaround.co.kr-platform/', distRoot: fileURLToPath(new URL('../dist/', import.meta.url)) },
  {
    name: 'root base',
    publicBase: '/',
    distRoot: process.env.BLOG_CLOSED_ROOT_DIST || fileURLToPath(new URL('../dist-root/', import.meta.url))
  }
]
const viewports = [
  { width: 375, height: 812 },
  { width: 1440, height: 900 }
]

let browser
const servers = []

before(async () => {
  if (skip) return
  for (const build of builds) {
    try {
      await stat(join(build.distRoot, 'index.html'))
    } catch {
      throw new Error(`${build.name} 빌드가 없습니다: ${build.distRoot} — vite build 를 먼저 실행하세요`)
    }
    const server = createServer((request, response) => serveBuild(build, request, response))
    await new Promise((resolve, reject) => {
      server.once('error', reject)
      server.listen(0, '127.0.0.1', resolve)
    })
    build.origin = `http://127.0.0.1:${server.address().port}`
    servers.push(server)
  }
  browser = await chromium.launch({ headless: true })
})

after(async () => {
  await browser?.close()
  await Promise.all(servers.map(server => new Promise(resolve => server.close(resolve))))
})

async function serveBuild(build, request, response) {
  const url = new URL(request.url, 'http://127.0.0.1')
  const decodedPath = decodeURIComponent(url.pathname)
  const relativePath = decodedPath.startsWith(build.publicBase)
    ? decodedPath.slice(build.publicBase.length)
    : decodedPath.replace(/^\/+/, '')
  let filePath = join(build.distRoot, relativePath || 'index.html')
  try {
    if ((await stat(filePath)).isDirectory()) filePath = join(filePath, 'index.html')
  } catch {
    filePath = join(build.distRoot, 'index.html')
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

async function setup(t, build, viewport) {
  const context = await newSeoulContext(browser, { viewport, reducedMotion: 'reduce' })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => {
    // root base 는 live 모드라 /api 호출이 정적 서버에서 실패한다 — 리소스 로드 실패 로그는 이 스위트의 관심사가 아니다.
    if (message.type() === 'error' && !/Failed to load resource/.test(message.text())) errors.push(message.text())
  })
  await page.route('**/api/**', route => route.fulfill({
    status: 503,
    contentType: 'application/json',
    body: JSON.stringify({ error: 'offline-test' })
  }))
  await page.addInitScript(() => localStorage.setItem('workaround-theme', 'dark'))
  t.after(async () => {
    await context.close()
    assert.deepEqual(errors, [], '잡히지 않은 브라우저 오류가 없어야 한다')
  })
  return { page, home: `${build.origin}${build.publicBase}`, homePath: build.publicBase }
}

// 렌더 텍스트와 접근 이름·링크 주소를 모아 안내 토스트 문구만 빼고 돌려준다.
async function renderedSurface(page) {
  return page.evaluate(closedMessage => {
    const root = document.body.cloneNode(true)
    root.querySelectorAll('[data-blog-closed-notice]').forEach(element => element.remove())
    const names = [...root.querySelectorAll('[aria-label], [title], [alt]')]
      .flatMap(element => [element.getAttribute('aria-label'), element.getAttribute('title'), element.getAttribute('alt')])
      .filter(Boolean)
    const hrefs = [...root.querySelectorAll('a[href]')].map(element => element.getAttribute('href'))
    // innerText 는 detached 노드에서 비므로 textContent 로 읽는다 (숨김 텍스트까지 포함해 더 엄격하다).
    return { text: root.textContent.replace(closedMessage, ''), names, hrefs }
  }, CLOSED_MESSAGE)
}

async function assertJunctionWithNotice(page, build, label) {
  await page.locator('.junction-overview').waitFor()
  const toast = page.locator('[data-blog-closed-notice]')
  await toast.waitFor()
  assert.equal(await toast.textContent(), CLOSED_MESSAGE, `${label}: 안내 문구는 한 줄 그대로`)
  assert.equal(await toast.getAttribute('role'), 'status')
  assert.equal(await toast.getAttribute('aria-live'), 'polite')
  assert.equal(await page.locator('.junction-access-toast').count(), 1, `${label}: 토스트는 하나여야 한다`)
  assert.equal(new URL(page.url()).pathname, build.publicBase, `${label}: 주소는 환승 홀 주소로 교체돼야 한다`)
  assert.equal(new URL(page.url()).search, '')

  const box = await toast.boundingBox()
  const viewport = page.viewportSize()
  assert.ok(
    box.x >= 0 && box.y >= 0 && box.x + box.width <= viewport.width && box.y + box.height <= viewport.height,
    `${label}: 토스트가 화면 안에 있어야 한다 ${JSON.stringify(box)}`
  )
  const lines = await toast.evaluate(element => {
    const style = getComputedStyle(element)
    const padding = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom)
    const border = parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth)
    return (element.getBoundingClientRect().height - padding - border) / parseFloat(style.lineHeight)
  })
  assert.ok(lines < 1.5, `${label}: 토스트는 한 줄이어야 한다 (${lines.toFixed(2)}줄)`)
}

async function assertNoBlogSurface(page, label) {
  const { text, names, hrefs } = await renderedSurface(page)
  assert.doesNotMatch(text, BANNED, `${label}: 렌더 텍스트에 블로그/스튜디오가 없어야 한다`)
  assert.deepEqual(names.filter(name => BANNED.test(name)), [], `${label}: 접근 이름에 블로그/스튜디오가 없어야 한다`)
  assert.deepEqual(
    hrefs.filter(href => /(^|\/)(blog|blog-district|studio)(\/|$|\?)/.test(href)),
    [],
    `${label}: 블로그/스튜디오로 가는 링크가 없어야 한다`
  )
}

for (const build of builds) {
  for (const viewport of viewports) {
    const title = `${build.name} ${viewport.width}px`

    test(`${title}: 블로그·스튜디오 직접 주소는 환승 홀로 돌아오고 한 줄 안내가 뜬다`, { skip }, async t => {
      const { page, home } = await setup(t, build, viewport)

      for (const address of BLOG_ADDRESSES) {
        const label = `${title} /${address}`
        await page.goto(`${home}${address}`)
        await assertJunctionWithNotice(page, build, label)
        await assertNoBlogSurface(page, label)
        assert.equal(await page.locator('.junction-station').count(), 7, `${label}: 노선도 큰 역은 일곱 개`)
        assert.equal(await page.locator('[data-station-code="B"]').count(), 0)
        assert.equal(await page.locator('.writer-page, .blog-shell, .writing-room').count(), 0, `${label}: 블로그 화면이 렌더되면 안 된다`)
        if (address === BLOG_ADDRESSES[0] && process.env.BLOG_CLOSED_SCREENSHOT_DIR) {
          const slug = build.name === 'Pages base' ? 'pages' : 'root'
          await page.screenshot({ path: `${process.env.BLOG_CLOSED_SCREENSHOT_DIR}/blog-entry-toast-${slug}-${viewport.width}.png` })
        }
      }

      // 안내는 일정 시간 뒤 사라진다 (기존 접근 토스트와 같은 2.5초).
      await page.waitForTimeout(2800)
      assert.equal(await page.locator('.junction-access-toast').count(), 0, '토스트는 2.5초 뒤 제거돼야 한다')
    })

    test(`${title}: 주소 교체(replace) — 뒤로 가면 블로그 주소가 아니라 직전 화면이다`, { skip }, async t => {
      const { page, home } = await setup(t, build, viewport)
      await page.goto(`${home}voyage`)
      await page.getByRole('heading', { name: '중부유럽 순환선', exact: true }).waitFor()

      await page.goto(`${home}blog`)
      await assertJunctionWithNotice(page, build, `${title} 교체`)
      await page.goBack()
      await page.getByRole('heading', { name: '중부유럽 순환선', exact: true }).waitFor()
      assert.equal(new URL(page.url()).pathname, `${build.publicBase}voyage`)
    })

    test(`${title}: 뒤로가기(popstate)로 블로그 주소에 닿아도 환승 홀로 돌아온다`, { skip }, async t => {
      const { page, home } = await setup(t, build, viewport)
      await page.goto(`${home}voyage`)
      await page.getByRole('heading', { name: '중부유럽 순환선', exact: true }).waitFor()

      // 예전 북마크·히스토리 항목이 남아 있는 상황: 히스토리에 블로그 주소를 끼워 넣고, 앱 안에서 환승 홀로 이동한다.
      await page.evaluate(path => history.pushState({ page: 'blogArchive' }, '', path), `${build.publicBase}blog`)
      await page.getByRole('button', { name: '환승 홀', exact: true }).click()
      await page.locator('.junction-overview').waitFor()
      assert.equal(await page.locator('[data-blog-closed-notice]').count(), 0, '아직 블로그 주소에 닿지 않았다')

      await page.goBack() // → /blog 항목: popstate
      await assertJunctionWithNotice(page, build, `${title} popstate`)
      await assertNoBlogSurface(page, `${title} popstate`)

      // 앞으로가기도 같다: 교체된 환승 홀 항목 뒤에 글 상세 주소를 끼우고, 뒤로 갔다 앞으로 간다.
      await page.evaluate(path => history.pushState({ page: 'blogPost', blogSlug: 'x' }, '', path), `${build.publicBase}blog/x`)
      await page.goBack()
      await page.locator('[data-blog-closed-notice]').waitFor({ state: 'detached' })
      await page.goForward()
      await assertJunctionWithNotice(page, build, `${title} popstate 앞으로`)
    })

    test(`${title}: 환승 홀·여행·자취 밥상·격납고·유로트럭 어디에도 블로그/스튜디오 진입점이 없다`, { skip }, async t => {
      const { page, home } = await setup(t, build, viewport)

      for (const path of ['voyage', 'pantry', 'sim', 'ets2']) {
        await page.goto(`${home}${path}`)
        await page.locator('.portal-stage').waitFor()
        await assertNoBlogSurface(page, `${title} /${path}`)
        if (viewport.width <= 760) {
          assert.deepEqual(
            (await page.locator('.mobile-quick-nav button').allTextContents()).map(text => text.trim()),
            ['노선도', '승강장'],
            `${title} /${path}: 모바일 빠른 환승에 아카이브 버튼이 없어야 한다`
          )
        }
      }

      await page.goto(`${home}voyage`)
      await page.getByRole('button', { name: '환승 홀', exact: true }).click()
      await page.locator('.junction-overview').waitFor()
      await assertNoBlogSurface(page, `${title} 환승 홀`)
      assert.equal(await page.locator('[data-blog-closed-notice]').count(), 0, '환승 홀에서 정상 이동할 때는 안내가 뜨지 않는다')
      assert.deepEqual(
        await page.locator('.junction-route-group').first().locator('h3, p').allTextContents(),
        ['기록선', '환승 홀 → 여행'],
        '기록선 안내 문구'
      )
      if (process.env.BLOG_CLOSED_SCREENSHOT_DIR) {
        const slug = build.name === 'Pages base' ? 'pages' : 'root'
        await page.screenshot({ path: `${process.env.BLOG_CLOSED_SCREENSHOT_DIR}/home-${slug}-${viewport.width}.png`, fullPage: true })
      }
    })
  }
}
