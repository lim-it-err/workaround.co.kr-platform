import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createRequire } from 'node:module'
import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const { chromium } = createRequire(import.meta.url)('playwright')
const publicBase = '/workaround.co.kr-platform/'
const distRoot = process.env.VOYAGE_REPLAY_DIST_ROOT || fileURLToPath(new URL('../../dist/', import.meta.url))
let base = process.env.VOYAGE_REPLAY_TEST_URL || ''
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
    : decodeURIComponent(url.pathname).replace(/^\/+/, '')
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
  const extension = extname(filePath)
  let content = await readFile(filePath)
  if (extension === '.js' && request.headers.referer?.includes('arrived-test=1')) {
    content = Buffer.from(content.toString().replace('status:"boarding"', 'status:"arrived"'))
  }
  response.writeHead(200, { 'content-type': contentTypes[extension] || 'application/octet-stream' })
  response.end(content)
}

async function setup(t, scenario) {
  const context = await browser.newContext({
    viewport: { width: scenario.width, height: scenario.height },
    reducedMotion: scenario.reducedMotion
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
    assert.deepEqual(apiRequests, [], '정적 회고 화면은 API를 호출하지 않아야 한다')
  })
  await page.goto(`${base}voyage${scenario.arrived ? '?arrived-test=1' : ''}`)
  if (scenario.arrived) {
    await page.getByRole('heading', { name: '여행 목록', exact: true }).waitFor({ timeout: 15000 })
    await page.getByRole('button', { name: /중부유럽 순환선/ }).click()
  }
  await page.locator('.route-heading').getByRole('heading', { name: '중부유럽 순환선', exact: true }).waitFor({ timeout: 15000 })
  return page
}

async function assertNoOverflow(page) {
  const overflow = await page.evaluate(() => ['html', 'body', '.page-scroller', '.voyage-route-map'].map(selector => {
    const element = document.querySelector(selector)
    return [selector, element ? Math.max(0, element.scrollWidth - element.clientWidth) : 0]
  }))
  for (const [selector, value] of overflow) assert.equal(value, 0, `${selector} 가로 넘침이 없어야 한다`)
}

test('운행 중 여행에는 회고 재생을 노출하지 않는다', async t => {
  const page = await setup(t, { width: 1440, height: 900, theme: 'light', reducedMotion: 'no-preference', arrived: false })
  assert.equal(await page.locator('.route-replay').count(), 0)
})

test('1440px light: 재생·일시정지·2단 속도와 일차 자동 전환', async t => {
  const page = await setup(t, { width: 1440, height: 900, theme: 'light', reducedMotion: 'no-preference', arrived: true })

  assert.equal(await page.getByRole('button', { name: '여정 재생 시작', exact: true }).isVisible(), true)
  assert.equal(await page.getByRole('button', { name: '보통', exact: true }).getAttribute('aria-pressed'), 'true')
  await page.getByRole('button', { name: '여정 재생 시작', exact: true }).click()
  await page.waitForTimeout(350)
  assert.equal(await page.locator('.route-replay-marker').count(), 1)
  assert.match(await page.locator('.route-replay__summary span').textContent(), /1일차 재생 중/)

  await page.getByRole('button', { name: '여정 재생 일시정지', exact: true }).click()
  const pausedDay = await page.locator('.route-day-tabs button[aria-current="date"]').getAttribute('aria-label')
  const pausedTransform = await page.locator('.route-replay-marker').evaluate(element => getComputedStyle(element).transform)
  await page.waitForTimeout(1300)
  assert.equal(await page.locator('.route-day-tabs button[aria-current="date"]').getAttribute('aria-label'), pausedDay)
  assert.equal(await page.locator('.route-replay-marker').evaluate(element => getComputedStyle(element).transform), pausedTransform)

  await page.getByRole('button', { name: '빠르게', exact: true }).click()
  assert.equal(await page.getByRole('button', { name: '빠르게', exact: true }).getAttribute('aria-pressed'), 'true')
  await page.getByRole('button', { name: '여정 재생 시작', exact: true }).click()
  await page.waitForTimeout(1400)
  assert.notEqual(await page.locator('.route-day-tabs button[aria-current="date"]').getAttribute('aria-label'), pausedDay)
  await assertNoOverflow(page)

  if (process.env.VOYAGE_REPLAY_SCREENSHOT_DIR) {
    await page.screenshot({
      path: `${process.env.VOYAGE_REPLAY_SCREENSHOT_DIR}/voyage-replay-1440-light.png`,
      fullPage: true
    })
  }
})

test('375px dark reduced motion: 지도 자동 전개와 단계식 이동', async t => {
  const page = await setup(t, { width: 375, height: 812, theme: 'dark', reducedMotion: 'reduce', arrived: true })
  assert.equal(await page.locator('.route-map-panel').isVisible(), false)

  await page.getByRole('button', { name: '빠르게', exact: true }).click()
  await page.getByRole('button', { name: '여정 재생 시작', exact: true }).click()
  await page.locator('.route-map-panel').waitFor({ state: 'visible' })
  await page.waitForTimeout(350)
  assert.equal(await page.locator('.route-replay-marker').evaluate(element => getComputedStyle(element).transitionDuration), '0s')
  assert.match(await page.locator('.route-replay__summary span').textContent(), /1일차 재생 중/)
  await page.waitForTimeout(1300)
  assert.notEqual(await page.locator('.route-day-tabs button[aria-current="date"]').getAttribute('aria-label'), '1일차 프라하')
  await assertNoOverflow(page)

  if (process.env.VOYAGE_REPLAY_SCREENSHOT_DIR) {
    await page.screenshot({
      path: `${process.env.VOYAGE_REPLAY_SCREENSHOT_DIR}/voyage-replay-375-dark-reduced.png`,
      fullPage: true
    })
  }
})
