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
const testClockTime = new Date('2026-09-15T12:00:00.000Z')
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

async function setup(t, {
  width,
  height,
  reducedMotion = 'no-preference',
  theme = 'dark',
  seenAt = '',
  storageUnavailable = false,
  randomValue = 0.1
}) {
  const context = await browser.newContext({ viewport: { width, height }, reducedMotion })
  const page = await context.newPage()
  await page.clock.install({ time: testClockTime })
  await page.clock.pauseAt(testClockTime)
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
  await page.addInitScript(({ selectedTheme, splashSeenAt, blockSplashStorage, fixedRandomValue }) => {
    // Keep the flip count and stagger representative but repeatable under parallel CPU load.
    Math.random = () => fixedRandomValue
    window.localStorage.setItem('workaround-theme', selectedTheme)
    if (splashSeenAt) window.localStorage.setItem('splash:seen', splashSeenAt)
    if (blockSplashStorage) {
      const nativeGetItem = Storage.prototype.getItem
      const nativeSetItem = Storage.prototype.setItem
      Storage.prototype.getItem = function getItem(key) {
        if (key === 'splash:seen') throw new DOMException('storage unavailable')
        return nativeGetItem.call(this, key)
      }
      Storage.prototype.setItem = function setItem(key, value) {
        if (key === 'splash:seen') throw new DOMException('storage unavailable')
        return nativeSetItem.call(this, key, value)
      }
    }
  }, {
    selectedTheme: theme,
    splashSeenAt: seenAt,
    blockSplashStorage: storageUnavailable,
    fixedRandomValue: randomValue
  })
  await page.goto(base)
  await page.locator('.splash-stage').waitFor()
  return page
}

function clockTime(offsetMs = 0) {
  return new Date(testClockTime.getTime() + offsetMs).toISOString()
}

async function finishSplashAt(page, remainingMs) {
  await page.clock.runFor(remainingMs - 1)
  assert.equal(await page.locator('.splash-stage').count(), 1, '정확한 전환 시각 직전에는 스플래시가 남아야 한다')
  await page.clock.runFor(1)
  await page.clock.resume()
  await page.locator('.splash-stage').waitFor({ state: 'detached', timeout: 2000 })
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

async function waitForOpeningToSettle(page, maximumMs, stepMs = 20) {
  let elapsedMs = 0
  while (elapsedMs <= maximumMs) {
    const state = await snapshot(page)
    if (state.renderedPhrase === 'DOORS OPENING' && state.runningCells === 0) return elapsedMs
    await page.clock.runFor(stepMs)
    elapsedMs += stepMs
  }
  assert.fail(`DOORS OPENING이 ${maximumMs}ms 안에 정착해야 한다`)
}

async function splashPanelSurface(page) {
  return page.locator('.splash-panel').evaluate(element => {
    const style = getComputedStyle(element)
    return {
      backgroundColor: style.backgroundColor,
      backgroundImage: style.backgroundImage,
      borderColor: style.borderTopColor,
      borderStyle: style.borderTopStyle,
      borderWidth: style.borderTopWidth
    }
  })
}

test('375px: the existing split-flap engine runs three phrases and tickers before the 10-second transition', async t => {
  const page = await setup(t, { width: 375, height: 812 })
  assert.equal(await page.getByRole('heading', { name: 'workaround.co.kr', exact: true }).count(), 1)
  assert.equal(await page.getByText('곧 문이 열립니다', { exact: true }).count(), 1)
  assert.equal(await page.getByText('10초 후 자동 전환', { exact: true }).count(), 1)
  assert.equal(await page.locator('.site-loop-symbol').count(), 1)
  assert.equal(await page.locator('.site-loop-symbol path').getAttribute('d'), 'M58 18.55 A33 33 0 1 1 38 18.55')
  assert.equal(await page.locator('.arrival-grid, .splash-door-panel, .splash-flap-word').count(), 0)
  assert.equal(await page.getByRole('button', { name: '다시 재생', exact: true }).count(), 1)
  assert.equal(await page.getByRole('img', { name: 'WORKING AROUND', exact: true }).count(), 1)
  await page.keyboard.press('Tab')
  const replayButton = page.getByRole('button', { name: '다시 재생', exact: true })
  const activeAfterTab = await page.evaluate(() => document.activeElement?.outerHTML || '')
  assert.equal(await replayButton.evaluate(element => element === document.activeElement), true, activeAfterTab)
  assert.notEqual(await replayButton.evaluate(element => getComputedStyle(element).outlineStyle), 'none')

  const boardGeometry = await page.evaluate(() => {
    const board = document.querySelector('.splash-flap-board').getBoundingClientRect()
    const cell = document.querySelector('.splash-flap-row .flap-cell').getBoundingClientRect()
    return { boardHeight: board.height, cellHeight: cell.height }
  })
  assert.ok(boardGeometry.boardHeight <= boardGeometry.cellHeight + 27, '플랩 보드는 한 줄과 24px 여백만 가져야 한다')
  const tickerStyle = await page.locator('.splash-ticker-strip').evaluate(element => {
    const style = getComputedStyle(element)
    return {
      background: style.backgroundColor,
      borderRadius: style.borderRadius,
      borderTop: style.borderTopStyle,
      borderBottom: style.borderBottomStyle,
      direction: style.flexDirection
    }
  })
  assert.equal(tickerStyle.background, 'rgba(0, 0, 0, 0)')
  assert.equal(tickerStyle.borderRadius, '0px')
  assert.equal(tickerStyle.borderTop, 'solid')
  assert.equal(tickerStyle.borderBottom, 'solid')
  assert.equal(tickerStyle.direction, 'row')
  assert.deepEqual(await splashPanelSurface(page), {
    backgroundColor: 'rgba(0, 0, 0, 0)',
    backgroundImage: 'none',
    borderColor: 'rgba(0, 0, 0, 0)',
    borderStyle: 'solid',
    borderWidth: '0px'
  })

  await page.clock.runFor(400)
  const first = await snapshot(page)
  assert.equal(first.phrase, 'WORKING AROUND')
  assert.equal(first.ticker, '에스컬레이터 방향 다수결로 정하는 중…')
  assert.ok(first.runningCells > 0, 'the retained half-panel engine is flipping')
  await page.clock.runFor(3100)
  const second = await snapshot(page)
  assert.equal(second.phrase, 'MIND THE GAP')
  assert.equal(second.ticker, '지연 시간을 정성껏 반올림하는 중…')
  await page.clock.runFor(3300)
  const third = await snapshot(page)
  assert.equal(third.phrase, 'DOORS OPENING')
  assert.equal(third.ticker, '출구 번호에 서열 매기는 중…')
  await page.clock.runFor(2500)
  const opening = await snapshot(page)
  assert.equal(opening.renderedPhrase, 'DOORS OPENING')
  assert.equal(opening.overflow, 0)
  if (process.env.SPLASH_SCREENSHOT_DIR) {
    await page.screenshot({ path: `${process.env.SPLASH_SCREENSHOT_DIR}/splash-mobile-opening.png` })
  }
  await finishSplashAt(page, 700)
  const seenAt = await page.evaluate(() => window.localStorage.getItem('splash:seen'))
  assert.ok(Number.isFinite(Date.parse(seenAt)), '첫 방문 완료 시 ISO 방문 시각을 저장해야 한다')
  assert.equal(await page.locator('.station-topbar h2').textContent(), '환승 홀')
  assert.equal(Math.round((await page.locator('.station-topbar .site-loop-symbol').boundingBox()).width), 24)
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), 0)
})

test('recent visit: DOORS OPENING settles for at least 1 second before the 3.8-second transition', async t => {
  const previousSeenAt = clockTime(-60_000)
  const page = await setup(t, { width: 375, height: 812, seenAt: previousSeenAt })
  const returnDurationMs = 3800

  assert.ok(returnDurationMs >= 3600 && returnDurationMs <= 4000)
  assert.equal(await page.getByText('3.8초 후 자동 전환', { exact: true }).count(), 1)
  await page.clock.runFor(300)
  const state = await snapshot(page)
  assert.equal(state.phrase, 'DOORS OPENING')
  assert.equal(state.ticker, '출구 번호에 서열 매기는 중…')
  assert.ok(state.runningCells > 0, '재방문도 기존 반쪽 플랩 엔진으로 마지막 문구를 재생해야 한다')
  const settledAtMs = 300 + await waitForOpeningToSettle(page, 2500)
  assert.ok(returnDurationMs - settledAtMs >= 1000, `정착 뒤 노출 ${returnDurationMs - settledAtMs}ms`)
  if (process.env.SPLASH_SCREENSHOT_DIR) {
    await page.screenshot({ path: `${process.env.SPLASH_SCREENSHOT_DIR}/splash-mobile-return.png` })
  }
  await finishSplashAt(page, returnDurationMs - settledAtMs)
  const refreshedSeenAt = await page.evaluate(() => window.localStorage.getItem('splash:seen'))
  assert.ok(Date.parse(refreshedSeenAt) > Date.parse(previousSeenAt), '재방문 완료 시각을 갱신해야 한다')
})

test('recent visit worst random: settlement stays within 2.8 seconds and transition waits a full second', async t => {
  const page = await setup(t, {
    width: 375,
    height: 812,
    seenAt: clockTime(-60_000),
    randomValue: 0.99
  })
  const settledAtMs = await waitForOpeningToSettle(page, 2800)
  const transitionAtMs = Math.max(3800, settledAtMs + 1000)
  const settled = await snapshot(page)

  assert.ok(settledAtMs <= 2800, `최악 난수 정착 ${settledAtMs}ms`)
  assert.ok(transitionAtMs <= 4000, `재방문 총 시간 ${transitionAtMs}ms`)
  assert.equal(settled.renderedPhrase, 'DOORS OPENING')
  assert.equal(settled.overflow, 0)
  if (process.env.SPLASH_SCREENSHOT_DIR) {
    await page.screenshot({ path: `${process.env.SPLASH_SCREENSHOT_DIR}/splash-mobile-return-worst.png` })
  }
  await finishSplashAt(page, transitionAtMs - settledAtMs)
})

test('recent visit replay: 다시 재생 restores the full 10-second sequence', async t => {
  const page = await setup(t, {
    width: 1440,
    height: 900,
    seenAt: clockTime(-60_000)
  })

  assert.equal(await page.getByText('3.8초 후 자동 전환', { exact: true }).count(), 1)
  await page.getByRole('button', { name: '다시 재생', exact: true }).click()
  assert.equal(await page.getByText('10초 후 자동 전환', { exact: true }).count(), 1)
  await page.clock.runFor(3700)
  const middle = await snapshot(page)
  assert.equal(middle.phrase, 'MIND THE GAP')
  assert.equal(middle.ticker, '지연 시간을 정성껏 반올림하는 중…')
  assert.equal(await page.locator('.splash-stage').count(), 1, '재생 뒤에는 재방문 단축 타이머가 취소돼야 한다')
  if (process.env.SPLASH_SCREENSHOT_DIR) {
    await page.screenshot({ path: `${process.env.SPLASH_SCREENSHOT_DIR}/splash-desktop-replay.png` })
  }
  await finishSplashAt(page, 6300)
})

test('expired or unavailable storage falls back to the first-visit flow', async t => {
  const expiredPage = await setup(t, {
    width: 375,
    height: 812,
    reducedMotion: 'reduce',
    theme: 'light',
    seenAt: clockTime(-31 * 24 * 60 * 60 * 1000)
  })
  assert.equal(await expiredPage.getByText('10초 후 자동 전환', { exact: true }).count(), 1)
  assert.equal(await expiredPage.getByRole('img', { name: 'WORKING AROUND', exact: true }).count(), 1)
  assert.equal(await expiredPage.evaluate(() => window.localStorage.getItem('splash:seen')), null)
  if (process.env.SPLASH_SCREENSHOT_DIR) {
    await expiredPage.screenshot({ path: `${process.env.SPLASH_SCREENSHOT_DIR}/splash-mobile-light.png` })
  }

  const blockedPage = await setup(t, {
    width: 375,
    height: 812,
    reducedMotion: 'reduce',
    seenAt: clockTime(),
    storageUnavailable: true
  })
  assert.equal(await blockedPage.getByText('10초 후 자동 전환', { exact: true }).count(), 1)
  assert.equal(await blockedPage.getByRole('img', { name: 'WORKING AROUND', exact: true }).count(), 1)
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
  assert.deepEqual(await splashPanelSurface(page), {
    backgroundColor: 'rgba(0, 0, 0, 0)',
    backgroundImage: 'none',
    borderColor: 'rgba(0, 0, 0, 0)',
    borderStyle: 'solid',
    borderWidth: '0px'
  })
  if (process.env.SPLASH_SCREENSHOT_DIR) {
    await page.screenshot({ path: `${process.env.SPLASH_SCREENSHOT_DIR}/splash-desktop-reduced.png` })
  }
})

test('16px·32px·SVG 파비콘은 Pages base와 열린 기점 형태를 보존한다', async t => {
  const page = await setup(t, { width: 375, height: 812, reducedMotion: 'reduce', theme: 'dark' })
  const links = await page.locator('link[rel="icon"]').evaluateAll(elements => elements.map(element => ({
    type: element.type,
    sizes: element.sizes.value,
    path: new URL(element.href).pathname
  })))
  assert.deepEqual(links, [
    { type: 'image/svg+xml', sizes: '', path: `${publicBase}favicon.svg` },
    { type: 'image/png', sizes: '32x32', path: `${publicBase}favicon-32x32.png` },
    { type: 'image/png', sizes: '16x16', path: `${publicBase}favicon-16x16.png` }
  ])

  const assets = await page.evaluate(async filenames => Promise.all(filenames.map(filename => new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve({ filename, width: image.naturalWidth, height: image.naturalHeight })
    image.onerror = reject
    image.src = filename
  }))), [`${publicBase}favicon-16x16.png`, `${publicBase}favicon-32x32.png`])
  assert.deepEqual(assets.map(asset => [asset.width, asset.height]), [[16, 16], [32, 32]])
  const svg = await page.evaluate(path => fetch(path).then(response => response.text()), `${publicBase}favicon.svg`)
  assert.match(svg, /M59 20 A33 33 0 1 1 37 20/)
  assert.match(svg, /prefers-color-scheme: light/)

  if (process.env.SPLASH_SCREENSHOT_DIR) {
    await page.evaluate(paths => {
      const preview = document.createElement('section')
      preview.className = 'favicon-preview'
      preview.innerHTML = `<div class="dark"><img src="${paths[0]}" alt="16px dark"><img src="${paths[1]}" alt="32px dark"></div><div class="light"><img src="${paths[0]}" alt="16px light"><img src="${paths[1]}" alt="32px light"></div>`
      preview.style.cssText = 'position:fixed;inset:20px auto auto 20px;z-index:9999;display:grid;grid-template-columns:1fr 1fr;border:1px solid #7c8aa0;background:#0d131c'
      for (const row of preview.children) row.style.cssText = 'width:120px;height:80px;display:flex;align-items:center;justify-content:center;gap:18px'
      preview.lastElementChild.style.background = '#f7f9fc'
      document.body.appendChild(preview)
    }, [`${publicBase}favicon-16x16.png`, `${publicBase}favicon-32x32.png`])
    await page.locator('.favicon-preview').screenshot({ path: `${process.env.SPLASH_SCREENSHOT_DIR}/favicon-16-32-dark-light.png` })
  }
})
