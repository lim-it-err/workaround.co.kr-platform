import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createRequire } from 'node:module'
import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const { chromium } = createRequire(import.meta.url)('playwright')
const publicBase = '/workaround.co.kr-platform/'
const distRoot = fileURLToPath(new URL('../dist/', import.meta.url))
let base = process.env.STATIC_ROUTING_TEST_URL || ''
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
  await page.addInitScript(theme => localStorage.setItem('workaround-theme', theme), scenario.theme)
  t.after(async () => {
    await context.close()
    assert.deepEqual(errors, [], '브라우저 오류나 경고가 없어야 한다')
    assert.deepEqual(apiRequests, [], '정적 공개본은 API를 호출하지 않아야 한다')
  })
  return page
}

async function assertNoOverflow(page) {
  const values = await page.evaluate(() => ['html', 'body', '.page-scroller'].map(selector => {
    const element = document.querySelector(selector)
    return [selector, element ? Math.max(0, element.scrollWidth - element.clientWidth) : 0]
  }))
  assert.ok(values.every(([, value]) => value === 0), `가로 overflow: ${JSON.stringify(values)}`)
}

for (const scenario of [
  { width: 375, height: 812, theme: 'dark' },
  { width: 375, height: 812, theme: 'light' },
  { width: 1440, height: 900, theme: 'dark' },
  { width: 1440, height: 900, theme: 'light' }
]) {
  test(`${scenario.width}px ${scenario.theme}: 격납고·택시 공개, 서버 시뮬·보호 구역 경계`, async t => {
    const page = await setup(t, scenario)

    await page.goto(`${base}sim`)
    await page.locator('.tone-sim-page').waitFor()
    assert.match(page.url(), /\/sim$/)
    assert.equal(await page.locator('.tone-page-hero.static-sim-locked').count(), 1)
    assert.equal(await page.locator('.tone-page-hero').getByRole('button', { name: /서버 시뮬/ }).textContent(), '준비 중')
    assert.equal(await page.locator('.tone-service-row').getByRole('button', { name: '시작', exact: true }).count(), 1)
    await page.locator('.tone-page-hero').getByRole('button').click()
    assert.match(page.url(), /\/sim$/)
    assert.equal(await page.locator('.junction-access-toast').textContent(), '서버 시뮬 · 정적 공개본에서는 준비 중')
    if (process.env.STATIC_ROUTING_SCREENSHOT_DIR) {
      await page.screenshot({
        path: `${process.env.STATIC_ROUTING_SCREENSHOT_DIR}/static-sim-${scenario.width}-${scenario.theme}.png`,
        fullPage: true
      })
    }

    await page.goto(`${base}elevator`)
    await page.locator('.elevator-tone-page').waitFor()
    assert.match(page.url(), /\/elevator$/)
    assert.equal((await page.locator('.static-preview-hairline').textContent()).trim(), '정적 공개본 — 서버 시뮬은 준비 중, 화면만 봅니다')
    assert.ok(await page.getByText('화면 미리보기', { exact: true }).count() > 0)
    assert.equal(await page.locator('.static-sim-preview').getAttribute('inert'), '')
    if (process.env.STATIC_ROUTING_SCREENSHOT_DIR) {
      await page.screenshot({
        path: `${process.env.STATIC_ROUTING_SCREENSHOT_DIR}/static-elevator-${scenario.width}-${scenario.theme}.png`,
        fullPage: true
      })
    }

    await page.goto(`${base}taxi`)
    await page.locator('.taxi-timetable').waitFor()
    assert.match(page.url(), /\/taxi$/)
    const taxiBefore = await page.locator('.taxi-timetable').innerText()
    await page.waitForTimeout(5000)
    assert.notEqual(await page.locator('.taxi-timetable').innerText(), taxiBefore, '택시 지표가 5초 안에 변해야 한다')
    if (process.env.STATIC_ROUTING_SCREENSHOT_DIR) {
      await page.screenshot({
        path: `${process.env.STATIC_ROUTING_SCREENSHOT_DIR}/static-taxi-${scenario.width}-${scenario.theme}.png`,
        fullPage: true
      })
    }

    for (const protectedPath of ['work', 'runtime']) {
      await page.goto(`${base}${protectedPath}`)
      await page.locator('.junction-overview').waitFor()
      assert.equal(new URL(page.url()).pathname, publicBase)
    }

    assert.equal(await page.locator('.junction-sublinks').filter({ has: page.getByText('격납고', { exact: true }) }).locator(':scope > *').count(), 4)
    assert.equal(await page.locator('.junction-sublinks > .static-server').textContent(), '엘리베이터')
    assert.equal(await page.locator('.junction-sublinks > .planned').textContent(), '화이트채플')
    assert.equal(await page.locator('.junction-page-stop.static-server').count(), 1)
    assert.equal(await page.locator('.junction-page-stop.planned').filter({ hasText: '화이트채플' }).count(), 1)
    const expectedDimOpacity = scenario.theme === 'light' ? '0.8' : '0.55'
    assert.equal(
      await page.locator('.junction-page-stop.static-server').evaluate(element => getComputedStyle(element).opacity),
      expectedDimOpacity
    )
    assert.equal(
      await page.locator('.junction-page-stop').filter({ hasText: '택시' }).evaluate(element => getComputedStyle(element).opacity),
      '1'
    )
    const initialUrl = page.url()
    await page.locator('.junction-sublinks > .static-server').click()
    assert.equal(page.url(), initialUrl)
    assert.equal(await page.locator('.junction-access-toast').textContent(), '서버 시뮬 · 정적 공개본에서는 준비 중')

    if (scenario.width < 900) {
      assert.equal(await page.locator('.mobile-quick-nav').getByRole('button', { name: '승강장', exact: true }).count(), 1)
    }
    await assertNoOverflow(page)
    if (process.env.STATIC_ROUTING_SCREENSHOT_DIR) {
      await page.screenshot({
        path: `${process.env.STATIC_ROUTING_SCREENSHOT_DIR}/static-scope-${scenario.width}-${scenario.theme}.png`,
        fullPage: true
      })
    }
  })
}
