// Run against the Pages-base preview. Playwright must be installed or exposed
// through NODE_PATH; all assertions stay inside the local static build.
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
let base = process.env.SPLASH_TEST_URL || ''
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

async function setup(t, { width, height, reducedMotion = 'no-preference', theme = 'dark' }) {
  const context = await browser.newContext({ viewport: { width, height }, reducedMotion })
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
  t.after(async () => {
    await context.close()
    assert.deepEqual(errors, [], 'no browser errors or warnings')
    assert.deepEqual(apiRequests, [], 'static splash makes no API requests')
  })
  await page.addInitScript(selectedTheme => {
    window.localStorage.setItem('workaround-theme', selectedTheme)
  }, theme)
  await page.goto(base)
  await page.locator('.splash-stage').waitFor()
  return page
}

async function snapshot(page) {
  return page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth - innerWidth,
    phrase: document.querySelector('.flap-values')?.getAttribute('aria-label'),
    ticker: document.querySelector('.ticker-copy')?.textContent,
    runningCells: document.querySelectorAll('.flap-cell.run').length,
    renderedPhrase: [...document.querySelectorAll('.flap-static.flap-top b')]
      .map(element => element.textContent)
      .join('')
      .replace(/\s/g, ' ')
      .trim()
  }))
}

test('375px: the existing split-flap engine runs three phrases and tickers before the 10-second transition', async t => {
  const page = await setup(t, { width: 375, height: 812 })
  assert.equal(await page.getByRole('heading', { name: 'workaround.co.kr', exact: true }).count(), 1)
  assert.equal(await page.getByText('곧 문이 열립니다', { exact: true }).count(), 1)
  assert.equal(await page.getByText('10초 후 자동 전환', { exact: true }).count(), 1)
  assert.equal(await page.locator('.site-loop-symbol').count(), 1)
  assert.equal(await page.locator('.arrival-grid, .splash-door-panel, .splash-flap-word').count(), 0)
  assert.equal(await page.getByRole('button', { name: '다시 재생', exact: true }).count(), 1)
  assert.equal(await page.getByRole('img', { name: 'WORKING AROUND', exact: true }).count(), 1)
  await page.keyboard.press('Tab')
  const replayButton = page.getByRole('button', { name: '다시 재생', exact: true })
  assert.equal(await replayButton.evaluate(element => element === document.activeElement), true)
  assert.notEqual(await replayButton.evaluate(element => getComputedStyle(element).outlineStyle), 'none')

  await page.waitForTimeout(400)
  const first = await snapshot(page)
  assert.equal(first.phrase, 'WORKING AROUND')
  assert.equal(first.ticker, '에스컬레이터 방향 다수결로 정하는 중…')
  assert.ok(first.runningCells > 0, 'the retained half-panel engine is flipping')
  await page.waitForTimeout(3100)
  const second = await snapshot(page)
  assert.equal(second.phrase, 'MIND THE GAP')
  assert.equal(second.ticker, '지연 시간을 정성껏 반올림하는 중…')
  await page.waitForTimeout(3300)
  const third = await snapshot(page)
  assert.equal(third.phrase, 'DOORS OPENING')
  assert.equal(third.ticker, '출구 번호에 서열 매기는 중…')
  await page.waitForTimeout(2200)
  const opening = await snapshot(page)
  assert.equal(opening.renderedPhrase, 'DOORS OPENING')
  assert.equal(opening.overflow, 0)
  if (process.env.SPLASH_SCREENSHOT_DIR) {
    await page.screenshot({ path: `${process.env.SPLASH_SCREENSHOT_DIR}/splash-mobile-opening.png` })
  }
  await page.locator('.splash-stage').waitFor({ state: 'detached', timeout: 2500 })
  assert.equal(await page.locator('.station-topbar h2').textContent(), '환승 홀')
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), 0)
})

test('1440px light reduced motion: static first phrase, loop symbol and zero overflow', async t => {
  const page = await setup(t, { width: 1440, height: 900, reducedMotion: 'reduce', theme: 'light' })
  const state = await snapshot(page)
  assert.equal(state.phrase, 'WORKING AROUND')
  assert.equal(state.renderedPhrase, 'WORKING AROUND')
  assert.equal(state.ticker, '에스컬레이터 방향 다수결로 정하는 중…')
  assert.equal(state.runningCells, 0)
  assert.equal(state.overflow, 0)
  assert.equal(await page.locator('.site-loop-symbol').count(), 1)
  assert.equal(await page.locator('.app-shell').getAttribute('data-theme'), 'light')
  if (process.env.SPLASH_SCREENSHOT_DIR) {
    await page.screenshot({ path: `${process.env.SPLASH_SCREENSHOT_DIR}/splash-desktop-reduced.png` })
  }
})
