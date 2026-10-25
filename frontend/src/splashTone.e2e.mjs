// Run against the Pages-base preview. Playwright must be installed or exposed
// through NODE_PATH; all assertions stay inside the local static build.
import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createRequire } from 'node:module'
import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { newSeoulContext } from './e2eContext.mjs'

const { chromium } = createRequire(import.meta.url)('playwright')
const publicBase = '/workaround.co.kr-platform/'
const distRoot = fileURLToPath(new URL('../dist/', import.meta.url))
const testClockTime = new Date('2026-09-15T12:00:00.000Z')
const firstVisitDurationMs = 5500
const phraseIntervalMs = 1660
const returnVisitDurationMs = 2500
const returnVisitSettleLimitMs = 1600
const returnVisitMaximumMs = 2800
const doorOpeningMs = 500
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
  const context = await newSeoulContext(browser, { viewport: { width, height }, reducedMotion })
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
    if (fixedRandomValue !== null) Math.random = () => fixedRandomValue
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
  const untilDoorOpeningMs = Math.max(0, remainingMs - doorOpeningMs)
  if (untilDoorOpeningMs > 0) {
    await page.clock.runFor(untilDoorOpeningMs - 1)
    assert.equal(await page.locator('.splash-stage').count(), 1, '문 열림 시작 직전에는 스플래시가 남아야 한다')
    await page.clock.runFor(1)
  }
  await page.locator('.door-transition.opening').waitFor()
  assert.equal(await page.locator('.door-panel').count(), 2, '환승 홀을 두 장의 문이 열며 드러내야 한다')
  assert.equal(await page.locator('.splash-stage').count(), 1, '문 열림 중에는 마지막 문구가 뒤에 남아야 한다')
  await page.clock.runFor(doorOpeningMs - 1)
  assert.equal(await page.locator('.door-transition').count(), 1, '총 전환 시각 직전에는 문 열림이 남아야 한다')
  assert.equal(await page.locator('.splash-stage').count(), 1, '문 열림이 끝나기 전에는 마지막 문구를 제거하지 않아야 한다')
  await page.clock.runFor(1)
  await page.locator('.door-transition').waitFor({ state: 'detached' })
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
      .trim(),
    renderedBottomPhrase: [...document.querySelectorAll('.flap-static.flap-bottom b')]
      .map(element => element.textContent)
      .join('')
      .replace(/\s/g, ' ')
      .trim()
  }))
}

async function waitForOpeningToSettle(page, maximumMs, stepMs = 20) {
  return waitForPhraseToSettle(page, 'DOORS OPENING', maximumMs, stepMs)
}

async function waitForPhraseToSettle(page, phrase, maximumMs, stepMs = 20) {
  let elapsedMs = 0
  while (elapsedMs <= maximumMs) {
    const state = await snapshot(page)
    if (
      state.renderedPhrase === phrase
      && state.renderedBottomPhrase === phrase
      && state.runningCells === 0
    ) return elapsedMs
    await page.clock.runFor(stepMs)
    elapsedMs += stepMs
  }
  assert.fail(`${phrase}이 ${maximumMs}ms 안에 정착해야 한다`)
}

async function waitForSplashRemoval(page, maximumMs, stepMs = 20) {
  let elapsedMs = 0
  while (elapsedMs <= maximumMs) {
    if (await page.locator('.splash-stage').count() === 0) return elapsedMs
    await page.clock.runFor(stepMs)
    elapsedMs += stepMs
  }
  assert.fail(`스플래시 DOM이 ${maximumMs}ms 안에 제거돼야 한다`)
}

async function measureFirstVisitReadTimes(page, { beforeRemovalScreenshotPath = '' } = {}) {
  const phrases = ['WORKING AROUND', 'MIND THE GAP', 'DOORS OPENING']
  const measurements = []
  let elapsedMs = 0
  for (const [index, phrase] of phrases.entries()) {
    const startsAtMs = index * phraseIntervalMs
    if (elapsedMs < startsAtMs) await page.clock.runFor(startsAtMs - elapsedMs)
    const settledAtMs = startsAtMs + await waitForPhraseToSettle(page, phrase, 1000)
    if (index === phrases.length - 1 && beforeRemovalScreenshotPath) {
      await page.screenshot({ path: beforeRemovalScreenshotPath })
    }
    const nextStartsAtMs = index === phrases.length - 1
      ? settledAtMs + await waitForSplashRemoval(page, firstVisitDurationMs - settledAtMs + 100)
      : (index + 1) * phraseIntervalMs
    measurements.push({
      phrase,
      settledAtMs,
      removedAtMs: index === phrases.length - 1 ? nextStartsAtMs : undefined,
      readingMs: nextStartsAtMs - settledAtMs
    })
    elapsedMs = settledAtMs
  }
  return measurements
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

test('375px: 반쪽 플랩 세 문구와 티커를 읽힌 뒤 5.5초에 전환한다', async t => {
  const page = await setup(t, { width: 375, height: 812 })
  assert.equal(await page.getByRole('heading', { name: 'workaround.co.kr', exact: true }).count(), 1)
  assert.equal(await page.getByText('곧 문이 열립니다', { exact: true }).count(), 1)
  assert.equal(await page.getByText('5.5초 후 자동 전환', { exact: true }).count(), 1)
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

  await page.clock.runFor(150)
  const first = await snapshot(page)
  assert.equal(first.phrase, 'WORKING AROUND')
  assert.equal(first.ticker, '에스컬레이터 방향 다수결로 정하는 중…')
  assert.ok(first.runningCells > 0, 'the retained half-panel engine is flipping')
  const firstSettledAtMs = 150 + await waitForPhraseToSettle(page, 'WORKING AROUND', 1000)
  assert.ok(phraseIntervalMs - firstSettledAtMs >= 700, `첫 문구 정지 노출 ${phraseIntervalMs - firstSettledAtMs}ms`)

  await page.clock.runFor(phraseIntervalMs - firstSettledAtMs)
  const secondSettledAtMs = phraseIntervalMs + await waitForPhraseToSettle(page, 'MIND THE GAP', 1000)
  const second = await snapshot(page)
  assert.equal(second.phrase, 'MIND THE GAP')
  assert.equal(second.ticker, '지연 시간을 정성껏 반올림하는 중…')
  assert.ok(phraseIntervalMs * 2 - secondSettledAtMs >= 700, `둘째 문구 정지 노출 ${phraseIntervalMs * 2 - secondSettledAtMs}ms`)

  await page.clock.runFor(phraseIntervalMs * 2 - secondSettledAtMs)
  const openingSettledAtMs = phraseIntervalMs * 2 + await waitForOpeningToSettle(page, 1000)
  const third = await snapshot(page)
  assert.equal(third.phrase, 'DOORS OPENING')
  assert.equal(third.ticker, '출구 번호에 서열 매기는 중…')
  assert.ok(firstVisitDurationMs - openingSettledAtMs >= 700, `마지막 문구 정지 노출 ${firstVisitDurationMs - openingSettledAtMs}ms`)
  assert.equal(third.overflow, 0)
  if (process.env.SPLASH_SCREENSHOT_DIR) {
    await page.screenshot({ path: `${process.env.SPLASH_SCREENSHOT_DIR}/splash-mobile-opening.png` })
  }
  await finishSplashAt(page, firstVisitDurationMs - openingSettledAtMs)
  const seenAt = await page.evaluate(() => window.localStorage.getItem('splash:seen'))
  assert.ok(Number.isFinite(Date.parse(seenAt)), '첫 방문 완료 시 ISO 방문 시각을 저장해야 한다')
  assert.equal(await page.locator('.station-topbar h2').textContent(), '환승 홀')
  assert.equal(Math.round((await page.locator('.station-topbar .site-loop-symbol').boundingBox()).width), 24)
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), 0)
})

test('실난수 4환경: 첫 방문 각 문구 0.7초·재방문 최종 문구 1초를 확보한다', async t => {
  const cases = [
    { name: '375-dark', width: 375, height: 812, theme: 'dark' },
    { name: '375-light', width: 375, height: 812, theme: 'light' },
    { name: '1440-dark', width: 1440, height: 900, theme: 'dark' },
    { name: '1440-light', width: 1440, height: 900, theme: 'light' }
  ]
  const report = []

  for (const environment of cases) {
    const firstPage = await setup(t, { ...environment, randomValue: null })
    const firstVisit = await measureFirstVisitReadTimes(firstPage, {
      beforeRemovalScreenshotPath: process.env.SPLASH_SCREENSHOT_DIR
        ? `${process.env.SPLASH_SCREENSHOT_DIR}/splash-${environment.name}.png`
        : ''
    })
    for (const measurement of firstVisit) {
      assert.ok(
        measurement.readingMs >= 700,
        `${environment.name} ${measurement.phrase} 정지 노출 ${measurement.readingMs}ms`
      )
    }
    assert.ok(
      firstVisit.at(-1).removedAtMs >= firstVisitDurationMs
      && firstVisit.at(-1).removedAtMs <= firstVisitDurationMs + 20,
      `${environment.name} 실제 DOM 제거 ${firstVisit.at(-1).removedAtMs}ms`
    )
    await firstPage.clock.runFor(32)
    assert.equal((await snapshot(firstPage)).overflow, 0, `${environment.name} 첫 방문 overflow`)
    const returnPage = await setup(t, {
      ...environment,
      seenAt: clockTime(-60_000),
      randomValue: null
    })
    const settledAtMs = await waitForOpeningToSettle(returnPage, returnVisitSettleLimitMs)
    const transitionAtMs = Math.min(
      returnVisitMaximumMs,
      Math.max(returnVisitDurationMs, settledAtMs + 1000)
    )
    assert.ok(settledAtMs <= returnVisitSettleLimitMs, `${environment.name} 재방문 정착 ${settledAtMs}ms`)
    assert.ok(transitionAtMs - settledAtMs >= 1000, `${environment.name} 재방문 정지 노출 ${transitionAtMs - settledAtMs}ms`)
    assert.equal((await snapshot(returnPage)).overflow, 0, `${environment.name} 재방문 overflow`)
    report.push({
      environment: environment.name,
      firstVisit: firstVisit.map(({ phrase, readingMs }) => ({ phrase, readingMs })),
      returnVisit: { settledAtMs, readingMs: transitionAtMs - settledAtMs }
    })
  }
  console.log(`splash real-random timing: ${JSON.stringify(report)}`)
})

test('recent visit: DOORS OPENING 정착 뒤 1초 이상 읽히고 2.5초에 전환한다', async t => {
  const previousSeenAt = clockTime(-60_000)
  const page = await setup(t, { width: 375, height: 812, seenAt: previousSeenAt })
  const returnDurationMs = returnVisitDurationMs

  assert.ok(returnDurationMs >= 2500 && returnDurationMs <= 2800)
  assert.equal(await page.getByText('2.5초 후 자동 전환', { exact: true }).count(), 1)
  await page.clock.runFor(150)
  const state = await snapshot(page)
  assert.equal(state.phrase, 'DOORS OPENING')
  assert.equal(state.ticker, '출구 번호에 서열 매기는 중…')
  assert.ok(state.runningCells > 0, '재방문도 기존 반쪽 플랩 엔진으로 마지막 문구를 재생해야 한다')
  const settledAtMs = 150 + await waitForOpeningToSettle(page, returnVisitSettleLimitMs - 150)
  const transitionAtMs = Math.min(returnVisitMaximumMs, Math.max(returnDurationMs, settledAtMs + 1000))
  assert.ok(transitionAtMs - settledAtMs >= 1000, `정착 뒤 노출 ${transitionAtMs - settledAtMs}ms`)
  if (process.env.SPLASH_SCREENSHOT_DIR) {
    await page.screenshot({ path: `${process.env.SPLASH_SCREENSHOT_DIR}/splash-mobile-return.png` })
  }
  await finishSplashAt(page, transitionAtMs - settledAtMs)
  const refreshedSeenAt = await page.evaluate(() => window.localStorage.getItem('splash:seen'))
  assert.ok(Date.parse(refreshedSeenAt) > Date.parse(previousSeenAt), '재방문 완료 시각을 갱신해야 한다')
})

test('recent visit worst random: settlement stays within 1.6 seconds and transition waits a full second', async t => {
  const page = await setup(t, {
    width: 375,
    height: 812,
    seenAt: clockTime(-60_000),
    randomValue: 0.99
  })
  const settledAtMs = await waitForOpeningToSettle(page, returnVisitSettleLimitMs)
  const transitionAtMs = Math.min(returnVisitMaximumMs, Math.max(returnVisitDurationMs, settledAtMs + 1000))
  const settled = await snapshot(page)

  assert.ok(settledAtMs <= returnVisitSettleLimitMs, `최악 난수 정착 ${settledAtMs}ms`)
  assert.ok(transitionAtMs <= returnVisitMaximumMs, `재방문 총 시간 ${transitionAtMs}ms`)
  assert.equal(settled.renderedPhrase, 'DOORS OPENING')
  assert.equal(settled.overflow, 0)
  if (process.env.SPLASH_SCREENSHOT_DIR) {
    await page.screenshot({ path: `${process.env.SPLASH_SCREENSHOT_DIR}/splash-mobile-return-worst.png` })
  }
  await finishSplashAt(page, transitionAtMs - settledAtMs)
})

test('recent visit replay: 다시 재생 restores the full 5.5-second sequence', async t => {
  const page = await setup(t, {
    width: 1440,
    height: 900,
    seenAt: clockTime(-60_000)
  })

  assert.equal(await page.getByText('2.5초 후 자동 전환', { exact: true }).count(), 1)
  await page.getByRole('button', { name: '다시 재생', exact: true }).click()
  assert.equal(await page.getByText('5.5초 후 자동 전환', { exact: true }).count(), 1)
  await page.clock.runFor(1800)
  const middle = await snapshot(page)
  assert.equal(middle.phrase, 'MIND THE GAP')
  assert.equal(middle.ticker, '지연 시간을 정성껏 반올림하는 중…')
  assert.equal(await page.locator('.splash-stage').count(), 1, '재생 뒤에는 재방문 단축 타이머가 취소돼야 한다')
  if (process.env.SPLASH_SCREENSHOT_DIR) {
    await page.screenshot({ path: `${process.env.SPLASH_SCREENSHOT_DIR}/splash-desktop-replay.png` })
  }
  await finishSplashAt(page, 3700)
})

test('expired or unavailable storage falls back to the first-visit flow', async t => {
  const expiredPage = await setup(t, {
    width: 375,
    height: 812,
    reducedMotion: 'reduce',
    theme: 'light',
    seenAt: clockTime(-31 * 24 * 60 * 60 * 1000)
  })
  assert.equal(await expiredPage.getByText('5.5초 후 자동 전환', { exact: true }).count(), 1)
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
  assert.equal(await blockedPage.getByText('5.5초 후 자동 전환', { exact: true }).count(), 1)
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

test('375/1440 다크·라이트: 출발 문 3단계와 이후 0.6초 상태 머신을 10회 유지한다', async t => {
  const cases = [
    { name: '375-dark', width: 375, height: 812, theme: 'dark' },
    { name: '375-light', width: 375, height: 812, theme: 'light' },
    { name: '1440-dark', width: 1440, height: 900, theme: 'dark' },
    { name: '1440-light', width: 1440, height: 900, theme: 'light' }
  ]

  for (const environment of cases) {
    const page = await setup(t, {
      ...environment,
      seenAt: clockTime(-60_000)
    })
    const settledAtMs = await waitForOpeningToSettle(page, returnVisitSettleLimitMs)
    const splashTotalMs = Math.min(
      returnVisitMaximumMs,
      Math.max(returnVisitDurationMs, settledAtMs + 1000)
    )
    await finishSplashAt(page, splashTotalMs - settledAtMs)

    const rememberedJunctionTop = await page.locator('.page-scroller').evaluate(element => {
      const target = Math.min(240, Math.max(0, element.scrollHeight - element.clientHeight))
      element.scrollTo({ top: target })
      return element.scrollTop
    })
    const pantryRow = page.locator('.junction-route-row').filter({ hasText: '자취 밥상' })
    await pantryRow.click()
    await page.clock.runFor(225)
    assert.equal(await page.locator('.door-transition.closing').count(), 1)
    assert.equal(await page.locator('.door-panel').count(), 2)
    assert.equal(
      await page.locator('.door-transition').evaluate(element => getComputedStyle(element).pointerEvents),
      'none'
    )
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), 0)
    await page.clock.runFor(225)
    assert.equal(await page.locator('.door-transition.closed').count(), 1)
    assert.equal(await page.getByText('DOORS CLOSING', { exact: true }).count(), 1)

    await page.clock.runFor(375)
    assert.equal(await page.locator('.door-transition.opening').count(), 1)
    assert.equal(await page.locator('.station-topbar h2').textContent(), '자취 밥상')

    await page.clock.runFor(175)
    await page.locator('.door-transition').waitFor({ state: 'detached' })
    assert.equal(
      await page.locator('.station-topbar h2').evaluate(element => element === document.activeElement),
      true,
      '전환 뒤 새 화면 제목으로 포커스가 이동해야 한다'
    )

    if (environment.name !== '375-dark') continue
    for (let moveIndex = 1; moveIndex < 10; moveIndex += 1) {
      if (moveIndex % 2 === 1) {
        await page.getByRole('button', { name: '환승 홀', exact: true }).click()
      } else {
        await page.locator('.junction-route-row').filter({ hasText: '자취 밥상' }).click()
      }
      await page.clock.runFor(599)
      assert.equal(await page.locator('.door-transition').count(), 1, `${moveIndex + 1}번째 이동 0.6초 직전 문짝`)
      await page.clock.runFor(1)
      await page.locator('.door-transition').waitFor({ state: 'detached' })
      assert.equal(await page.locator('.door-panel').count(), 0, `${moveIndex + 1}번째 이동 잔상 0`)
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), 0)
      if (moveIndex === 1) {
        assert.equal(
          await page.locator('.page-scroller').evaluate(element => Math.round(element.scrollTop)),
          Math.round(rememberedJunctionTop),
          '환승 홀 복귀 시 이전 본문 스크롤 위치를 보존해야 한다'
        )
      }
    }
  }
})

test('375/1440 다크·라이트: 실제 CSS 시간의 닫힘 중·닫힘·열림 3컷이 불투명 문짝을 유지한다', async t => {
  const cases = [
    { name: '375-dark', width: 375, height: 812, theme: 'dark' },
    { name: '375-light', width: 375, height: 812, theme: 'light' },
    { name: '1440-dark', width: 1440, height: 900, theme: 'dark' },
    { name: '1440-light', width: 1440, height: 900, theme: 'light' }
  ]

  for (const environment of cases) {
    const context = await newSeoulContext(browser, {
      viewport: { width: environment.width, height: environment.height },
      reducedMotion: 'no-preference'
    })
    const page = await context.newPage()
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    page.on('console', message => {
      if (['error', 'warning'].includes(message.type())) errors.push(message.text())
    })
    await page.addInitScript(theme => localStorage.setItem('workaround-theme', theme), environment.theme)
    await page.goto(`${base}pantry`)
    await page.locator('.pantry-page').waitFor()

    await page.getByRole('button', { name: '환승 홀', exact: true }).click()
    await page.waitForTimeout(225)
    const closingRects = await page.locator('.door-panel').evaluateAll(elements => elements.map(element => {
      const rect = element.getBoundingClientRect()
      return { left: rect.left, right: rect.right, width: rect.width, background: getComputedStyle(element).backgroundColor }
    }))
    assert.equal(closingRects.length, 2)
    assert.ok(closingRects[0].right > 0 && closingRects[0].right < environment.width / 2 + 2)
    assert.ok(closingRects[1].left > environment.width / 2 - 2 && closingRects[1].left < environment.width)
    assert.ok(closingRects.every(rect => !['rgba(0, 0, 0, 0)', 'transparent'].includes(rect.background)))
    if (process.env.SPLASH_SCREENSHOT_DIR) {
      await page.screenshot({ path: `${process.env.SPLASH_SCREENSHOT_DIR}/doors-real-${environment.name}-closing.png` })
    }

    await page.waitForTimeout(275)
    const closedRects = await page.locator('.door-panel').evaluateAll(elements => elements.map(element => {
      const rect = element.getBoundingClientRect()
      return { left: Math.round(rect.left), right: Math.round(rect.right) }
    }))
    assert.deepEqual(closedRects, [
      { left: 0, right: Math.round(environment.width / 2 + 1) },
      { left: Math.round(environment.width / 2 - 1), right: environment.width }
    ])
    assert.equal(await page.getByText('DOORS CLOSING', { exact: true }).count(), 1)
    if (process.env.SPLASH_SCREENSHOT_DIR) {
      await page.screenshot({ path: `${process.env.SPLASH_SCREENSHOT_DIR}/doors-real-${environment.name}-closed.png` })
    }

    await page.waitForTimeout(325)
    assert.equal(await page.locator('.door-transition.opening').count(), 1)
    assert.equal(await page.locator('.station-topbar h2').textContent(), '환승 홀')
    if (process.env.SPLASH_SCREENSHOT_DIR) {
      await page.screenshot({ path: `${process.env.SPLASH_SCREENSHOT_DIR}/doors-real-${environment.name}-opening.png` })
    }

    await page.waitForTimeout(225)
    await page.locator('.door-transition').waitFor({ state: 'detached' })
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), 0)
    await context.close()
    assert.deepEqual(errors, [], `${environment.name} 브라우저 오류나 경고 0`)
  }
})

test('스플래시 목업은 JavaScript 없이 CSS 문 연출과 일반 링크만 사용한다', async t => {
  const context = await newSeoulContext(browser, { viewport: { width: 375, height: 812 } })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => {
    if (['error', 'warning'].includes(message.type())) errors.push(message.text())
  })
  t.after(async () => {
    await context.close()
    assert.deepEqual(errors, [], '목업 브라우저 오류나 경고 0')
  })

  await page.goto(`${base}mockups/splash.html`)
  assert.equal(await page.locator('script').count(), 0, '정적 목업은 script 0이어야 한다')
  assert.equal(await page.getByText('5.5초 후 자동 전환', { exact: true }).count(), 1)
  assert.equal(
    await page.locator('.mockup-door.left').evaluate(element => getComputedStyle(element).animationName),
    'arrival-left'
  )
  if (process.env.SPLASH_SCREENSHOT_DIR) {
    await page.screenshot({ path: `${process.env.SPLASH_SCREENSHOT_DIR}/mockup-375-css-only.png` })
  }
  assert.ok(
    (await page.getByRole('link', { name: '환승 홀 →', exact: true }).getAttribute('href')).endsWith('home.html'),
    '환승 홀 이동은 클릭 가로채기 없는 일반 링크여야 한다'
  )
  await page.getByRole('link', { name: '문 닫힘 보기', exact: true }).click()
  assert.equal(new URL(page.url()).hash, '#door-closing')
  assert.equal(
    await page.locator('.mockup-door.left').evaluate(element => getComputedStyle(element).animationName),
    'demo-close-left'
  )
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
