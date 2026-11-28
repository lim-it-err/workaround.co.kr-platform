import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createRequire } from 'node:module'
import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { fileExists, newSeoulContext } from '../e2eContext.mjs'

const advisorRequire = createRequire(new URL('../../../services/advisor/frontend/package.json', import.meta.url))
const { chromium } = advisorRequire('playwright')
const publicBase = '/workaround.co.kr-platform/'
const advisorBase = `${publicBase}advisor/`
const distRoot = process.env.VOYAGE_ADVISOR_DIST_ROOT || fileURLToPath(new URL('../../dist/', import.meta.url))
let base = process.env.VOYAGE_ADVISOR_TEST_URL || ''
// Advisor 화면은 Advisor 프런트 빌드가 dist/advisor 에 합쳐져 있어야 열린다(정적 서빙에서 없으면 진입 후 빈 화면).
// 합쳐지지 않은 dist 면 이유를 적어 skip 한다. 전체 게이트는 `npm --prefix frontend run e2e:all` 이 합쳐 준다.
const ADVISOR_SKIP = base || (await fileExists(join(distRoot, 'advisor', 'index.html')))
  ? false
  : 'dist/advisor 가 없다(Advisor 빌드 미포함) — e2e:all 로 실행'
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
  const pathname = decodeURIComponent(url.pathname)
  const relativePath = pathname.startsWith(publicBase)
    ? pathname.slice(publicBase.length)
    : pathname.replace(/^\/+/, '')
  let filePath = join(distRoot, relativePath || 'index.html')
  try {
    if ((await stat(filePath)).isDirectory()) filePath = join(filePath, 'index.html')
  } catch {
    filePath = join(distRoot, pathname.startsWith(advisorBase) ? 'advisor/index.html' : 'index.html')
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

// 라이트 테마는 TKT-218(D-036)에서 없앴다(저장값이 light 여도 검은 화면). 폭 두 개만 본다.
for (const scenario of [
  { width: 375, height: 812, theme: 'dark' },
  { width: 1440, height: 900, theme: 'dark' }
]) {
  test(`${scenario.width}px ${scenario.theme}: 벨베데레와 Advisor 미션을 왕복한다`, { skip: ADVISOR_SKIP }, async t => {
    const context = await newSeoulContext(browser, {
      viewport: { width: scenario.width, height: scenario.height },
      reducedMotion: 'reduce'
    })
    const page = await context.newPage()
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    page.on('console', message => {
      if (['error', 'warning'].includes(message.type())) errors.push(message.text())
    })
    await page.addInitScript(theme => localStorage.setItem('workaround-theme', theme), scenario.theme)
    // TKT-237: Advisor 가 모드 배지용으로 localhost:8080/health 를 조회한다. 백엔드 없는 테스트에서 연결 거부가
    // 콘솔 오류로 남지 않게 막아 둔다(배지 문구는 이 테스트의 대상이 아니다).
    await page.route('http://localhost:8080/**', route => route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }))
    t.after(async () => {
      await context.close()
      assert.deepEqual(errors, [], '왕복 중 브라우저 오류나 경고가 없어야 한다')
    })

    await page.goto(`${base}voyage`)
    await page.getByRole('heading', { name: '중부유럽 순환선', exact: true }).waitFor()
    await page.getByRole('button', { name: /^7일차/ }).click()
    const belvedereRow = page.locator('#voyage-stop-day-6-belvedere')
    const transferLink = belvedereRow.getByRole('link', { name: /이걸로 미션 만들기/ })
    assert.equal(
      await transferLink.locator('.site-loop-symbol path').getAttribute('d'),
      'M58 18.55 A33 33 0 1 1 38 18.55',
      '여행 환승 링크는 D-018 C 심볼을 사용해야 한다'
    )
    await transferLink.click()

    await page.getByRole('heading', { name: '비엔나 1900', exact: true }).waitFor()
    assert.match(page.url(), /\/advisor\/courses\/vienna-1900$/)
    await page.locator('[data-mission-id="v1900-f-belvedere-route"]').click()
    await page.getByRole('heading', { name: '벨베데레를 연대순으로 걷기', exact: true }).waitFor()
    assert.equal(
      await page.locator('svg.voyage-return__loop path').getAttribute('d'),
      'M58 18.55 A33 33 0 1 1 38 18.55',
      'Advisor 역방향 링크도 D-018 C 심볼을 사용해야 한다'
    )
    if (process.env.VOYAGE_ADVISOR_SCREENSHOT_DIR) {
      await page.screenshot({
        path: `${process.env.VOYAGE_ADVISOR_SCREENSHOT_DIR}/advisor-mission-${scenario.width}-${scenario.theme}.png`,
        fullPage: true
      })
    }
    await page.getByRole('link', { name: /이 미션의 정류장/ }).click()

    const returnedDetail = page.getByRole('dialog', { name: '벨베데레 상궁' })
    await returnedDetail.waitFor()
    assert.match(page.url(), /\/voyage$/, '딥링크를 소비한 뒤 여행 표준 URL로 정리되어야 한다')
    assert.equal(await page.getByRole('button', { name: /^7일차/ }).getAttribute('aria-current'), 'date')
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true)
    if (process.env.VOYAGE_ADVISOR_SCREENSHOT_DIR) {
      await page.screenshot({
        path: `${process.env.VOYAGE_ADVISOR_SCREENSHOT_DIR}/voyage-return-${scenario.width}-${scenario.theme}.png`,
        fullPage: true
      })
    }

    await returnedDetail.getByRole('button', { name: '상세 닫기', exact: true }).click()
    await page.getByRole('button', { name: /^1일차/ }).click()
    assert.equal(await page.locator('.route-transfer-link').count(), 0, '연결 없는 정차역에는 환승 링크가 없어야 한다')
  })
}
