import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createRequire } from 'node:module'
import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { newSeoulContext } from '../e2eContext.mjs'

const { chromium } = createRequire(import.meta.url)('playwright')
const publicBase = '/workaround.co.kr-platform/'
const distRoot = fileURLToPath(new URL('../../dist/', import.meta.url))
let base = process.env.ETS2_TEST_URL || ''
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

async function setup(t, { width, height, theme, beforePage } = {}) {
  const context = await newSeoulContext(browser, { viewport: { width, height }, reducedMotion: 'reduce' })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => {
    if (['error', 'warning'].includes(message.type())) errors.push(message.text())
  })
  await page.addInitScript(selectedTheme => localStorage.setItem('workaround-theme', selectedTheme), theme)
  if (beforePage) await beforePage(page)
  t.after(async () => {
    await context.close()
    assert.deepEqual(errors, [], '브라우저 오류나 경고가 없어야 한다')
  })
  return page
}

async function openLive(page) {
  await page.goto(`${base}ets2`)
  await page.locator('.ets2-live-page').waitFor()
  await page.locator('.ets2-frame-shell img').waitFor()
}

async function assertNoOverflow(page) {
  const values = await page.evaluate(() => ['html', 'body', '.portal-stage', '.page-scroller', '.ets2-live-page']
    .map(selector => {
      const element = document.querySelector(selector)
      return [selector, element ? Math.max(0, element.scrollWidth - element.clientWidth) : 0]
    }))
  assert.ok(values.every(([, value]) => value === 0), `가로 overflow: ${JSON.stringify(values)}`)
}

async function capture(page, name) {
  if (!process.env.ETS2_SCREENSHOT_DIR) return
  await page.screenshot({ path: `${process.env.ETS2_SCREENSHOT_DIR}/${name}.png`, fullPage: true })
}

test('샘플 프레임은 2초마다 빈 화면 없이 교체되고 주행 값과 연결 끊김 대시를 순환한다', async t => {
  const page = await setup(t, { width: 375, height: 812, theme: 'dark' })
  await openLive(page)
  await capture(page, 'ets2-375-dark')
  const frame = page.locator('.ets2-frame-shell img')
  assert.match(await frame.getAttribute('src'), /frame-1\.svg$/)
  assert.match(await frame.getAttribute('alt'), /^유로트럭 화면, \d+초 전$/)
  assert.match(await page.locator('.ets2-freshness').textContent(), /^샘플 화면 · 실제 주행 정보 아님/)
  assert.match(await page.locator('.ets2-telemetry').innerText(), /82 km\/h[\s\S]*80 km\/h[\s\S]*90 km\/h[\s\S]*14\.2 km[\s\S]*감시 중/)

  await page.waitForFunction(() => document.querySelector('.ets2-live-page')?.dataset.frameSequence === '2')
  assert.ok((await frame.getAttribute('src')).length > 0, '교체 중 img src가 비면 안 된다')
  assert.match(await frame.getAttribute('src'), /frame-2\.svg$/)

  await page.waitForFunction(() => document.querySelector('.ets2-live-page')?.dataset.frameSequence === '3')
  assert.ok((await frame.getAttribute('src')).length > 0, '연결 끊김 메타에서도 마지막 프레임은 남아야 한다')
  const values = await page.locator('.ets2-telemetry dd').allTextContents()
  assert.deepEqual(values, ['—', '—', '—', '—', '—'])
  assert.equal(await page.locator('.ets2-live-page').getAttribute('data-poll-ms'), '2000')
  await assertNoOverflow(page)
})

test('샘플 순환은 체류 시간이 길어져도 capturedAt을 갱신해 정지 화면처럼 보이지 않는다', async t => {
  const page = await setup(t, {
    width: 1440,
    height: 900,
    theme: 'light',
    beforePage: page => page.addInitScript(() => {
      const realNow = Date.now.bind(Date)
      let offset = 0
      Date.now = () => realNow() + offset
      window.__advanceEts2Clock = milliseconds => { offset += milliseconds }
    })
  })
  await openLive(page)
  await page.evaluate(() => window.__advanceEts2Clock(31_000))
  await page.waitForFunction(() => document.querySelector('.ets2-live-page')?.dataset.frameSequence === '2')
  assert.equal(await page.locator('.ets2-frame-shell.stale').count(), 0)
  assert.equal(await page.locator('.ets2-frame-alert').count(), 0)
  assert.equal(await page.locator('.ets2-live-page').getAttribute('data-poll-ms'), '2000')
  assert.match(await page.locator('.ets2-freshness').textContent(), /^샘플 화면 · 실제 주행 정보 아님 · [0-9]+초 전/)
  await capture(page, 'ets2-1440-light-sample-long-stay')
  await assertNoOverflow(page)
})

test('프레임 로드가 세 번 연속 실패하면 같은 페이지에서 관제 신호 없음을 알린다', async t => {
  const page = await setup(t, { width: 375, height: 812, theme: 'light' })
  await openLive(page)
  await page.evaluate(() => {
    window.Image = class BrokenPreloadImage {
      set src(value) {
        this.value = value
        setTimeout(() => this.onerror?.(new Event('error')), 0)
      }
    }
  })
  await page.getByRole('alert').waitFor({ timeout: 7000 })
  assert.equal(await page.getByRole('alert').textContent(), '관제 신호 없음')
  assert.match(new URL(page.url()).pathname, /\/ets2$/)
  assert.equal(await page.locator('.ets2-frame-shell.signal-lost').count(), 1)
  assert.equal(await page.locator('.ets2-last-received').textContent(), '주행 값 · 마지막 수신 정보')
  assert.equal(await page.locator('.ets2-telemetry').getAttribute('aria-label'), '마지막 수신 주행 정보')
  await capture(page, 'ets2-375-light-signal-lost')
  await assertNoOverflow(page)
})

test('격납고와 환승 홀 소역에서 진입하고 정적 주소 새로고침을 유지한다', async t => {
  const page = await setup(t, { width: 1440, height: 900, theme: 'dark' })
  await page.goto(`${base}sim`)
  const ets2Row = page.locator('.tone-service-row').filter({ hasText: '유로트럭 관제' })
  await ets2Row.getByRole('button', { name: '관제 보기', exact: true }).click()
  await page.locator('.ets2-live-page').waitFor()
  assert.match(new URL(page.url()).pathname, /\/ets2$/)
  await page.reload()
  await page.locator('.ets2-live-page').waitFor()

  await page.getByRole('button', { name: '환승 홀', exact: true }).click()
  const smallStop = page.locator('.junction-page-stop').filter({ hasText: /^유로트럭$/ })
  assert.equal(await smallStop.count(), 1)
  await smallStop.click()
  await page.locator('.ets2-live-page').waitFor()
  assert.match(new URL(page.url()).pathname, /\/ets2$/)
  await capture(page, 'ets2-1440-dark')
  await assertNoOverflow(page)
})
