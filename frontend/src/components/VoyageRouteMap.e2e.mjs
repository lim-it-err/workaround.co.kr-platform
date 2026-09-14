import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createRequire } from 'node:module'
import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const { chromium } = createRequire(import.meta.url)('playwright')
const publicBase = '/workaround.co.kr-platform/'
const distRoot = process.env.VOYAGE_ROUTE_DIST_ROOT || fileURLToPath(new URL('../../dist/', import.meta.url))
let base = process.env.VOYAGE_ROUTE_TEST_URL || ''
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
  const relativePath = decodeURIComponent(url.pathname).startsWith(publicBase)
    ? decodeURIComponent(url.pathname).slice(publicBase.length)
    : ''
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
    if (new URL(request.url()).pathname.startsWith('/api')) apiRequests.push(request.url())
  })
  await page.addInitScript(theme => localStorage.setItem('workaround-theme', theme), scenario.theme)
  t.after(async () => {
    await context.close()
    assert.deepEqual(errors, [], '브라우저 오류나 경고가 없어야 한다')
    assert.deepEqual(apiRequests, [], '정적 여행 화면은 API를 호출하지 않아야 한다')
  })
  await page.goto(`${base}voyage`)
  await page.getByRole('heading', { name: '중부유럽 순환선', exact: true }).waitFor()
  return page
}

async function overflow(page) {
  return page.evaluate(() => ['html', 'body', '.page-scroller', '.voyage-route-map'].map(selector => {
    const element = document.querySelector(selector)
    return [selector, element ? Math.max(0, element.scrollWidth - element.clientWidth) : 0]
  }))
}

for (const scenario of [
  { width: 375, height: 812, theme: 'dark' },
  { width: 1440, height: 900, theme: 'light' }
]) {
  test(`${scenario.width}px ${scenario.theme}: 지리 노선, 키보드 일차 선택, 정차역 상세`, async t => {
    const page = await setup(t, scenario)
    assert.equal(await page.locator('.route-station').count(), 9)
    assert.equal(await page.locator('.route-segment').count(), 8)
    assert.match(await page.getByText('740km', { exact: false }).first().textContent(), /740km/)
    assert.match(await page.getByText('523만원', { exact: false }).first().textContent(), /523만원/)

    const dayBox = await page.locator('.route-day-panel').boundingBox()
    if (process.env.VOYAGE_ROUTE_SCREENSHOT_DIR) {
      await page.screenshot({
        path: `${process.env.VOYAGE_ROUTE_SCREENSHOT_DIR}/voyage-route-initial-${scenario.width}-${scenario.theme}.png`,
        fullPage: true
      })
    }
    if (scenario.width < 900) {
      assert.equal(await page.locator('.route-map-panel').isVisible(), false, '모바일 첫 진입에서는 지도가 접혀야 한다')
      await page.getByRole('button', { name: '노선도 펼치기', exact: true }).click()
      const mapBox = await page.locator('.route-map-panel').boundingBox()
      assert.ok(dayBox.y < mapBox.y, '모바일에서는 오늘 카드가 지도보다 먼저 와야 한다')
    } else {
      const mapBox = await page.locator('.route-map-panel').boundingBox()
      assert.ok(mapBox.x < dayBox.x && Math.abs(mapBox.y - dayBox.y) < 10, '데스크톱에서는 지도와 일차 카드가 나란해야 한다')
    }

    const dayThreeSegment = page.getByRole('link', { name: /^DAY 3 ·/ }).first()
    await dayThreeSegment.focus()
    await page.keyboard.press('Enter')
    await page.getByRole('heading', { name: '첫 장거리·체스키크룸로프', exact: true }).waitFor()
    assert.equal(await page.locator('.route-segment--active').count(), 1)

    await page.getByRole('button', { name: /Papa's/ }).click()
    const detail = page.getByRole('dialog')
    await detail.waitFor()
    assert.match(await detail.textContent(), /스비치코바 \+ 립 \+ 코젤/)
    assert.match(await detail.textContent(), /66,500원/)
    assert.match(await detail.textContent(), /사진이 아직 없습니다/)
    assert.equal(await detail.getByRole('link', { name: /구글 지도에서 열기/ }).getAttribute('target'), '_blank')

    if (process.env.VOYAGE_ROUTE_SCREENSHOT_DIR) {
      await page.screenshot({
        path: `${process.env.VOYAGE_ROUTE_SCREENSHOT_DIR}/voyage-route-detail-${scenario.width}-${scenario.theme}.png`
      })
    }

    await detail.getByRole('button', { name: '상세 닫기', exact: true }).click()
    await page.getByRole('link', { name: /^비엔나 ·/ }).click()
    await page.getByRole('dialog').waitFor()
    assert.match(await page.getByRole('dialog').textContent(), /Pan Kee/)
    await page.keyboard.press('Escape')
    assert.equal(await page.getByRole('dialog').count(), 0)

    await page.getByRole('button', { name: /^9일차/ }).click()
    assert.equal(await page.locator('.route-segment--active').count(), 2)
    for (const [selector, value] of await overflow(page)) {
      assert.equal(value, 0, `${selector} 가로 넘침이 없어야 한다`)
    }

    if (process.env.VOYAGE_ROUTE_SCREENSHOT_DIR) {
      await page.screenshot({
        path: `${process.env.VOYAGE_ROUTE_SCREENSHOT_DIR}/voyage-route-${scenario.width}-${scenario.theme}.png`,
        fullPage: true
      })
    }

    await page.getByRole('button', { name: 'DAY 0 출발 전 준비', exact: true }).click()
    await page.getByRole('heading', { name: '여행 준비', exact: true }).waitFor()
    if (process.env.VOYAGE_ROUTE_SCREENSHOT_DIR) {
      await page.screenshot({
        path: `${process.env.VOYAGE_ROUTE_SCREENSHOT_DIR}/voyage-route-day0-${scenario.width}-${scenario.theme}.png`,
        fullPage: true
      })
    }
    const flightCheck = page.getByRole('checkbox', { name: /항공권 OZ545/ })
    await flightCheck.check()
    assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('voyage:east-europe-2026:checklist'))), ['flight'])

    await page.getByRole('button', { name: '← 여행 목록', exact: true }).click()
    await page.getByRole('heading', { name: '여행 목록', exact: true }).waitFor()
  })
}
