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
import { SPLASH_TICKER_POOL, pickSplashTicker } from './data/splashTicker.js'

const { chromium } = createRequire(import.meta.url)('playwright')
const publicBase = '/workaround.co.kr-platform/'
const distRoot = fileURLToPath(new URL('../dist/', import.meta.url))
const testClockTime = new Date('2026-09-15T12:00:00.000Z')
const firstVisitDurationMs = 5500
const phraseIntervalMs = 1660
const tickerIntervalMs = 1500
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
  await page.addInitScript(({ selectedTheme, splashSeenAt, blockSplashStorage, fixedRandomValue, tickerMs }) => {
    // Keep the flip count and stagger representative but repeatable under parallel CPU load.
    if (fixedRandomValue !== null) Math.random = () => fixedRandomValue
    // 티커 관측: 화면에 나타난 티커 문구를 가상 시계 시각과 함께 기록하고, 티커 주기 타이머가 남아 있는지 센다.
    window.__tickerLog = []
    new MutationObserver(() => {
      const text = document.querySelector('.ticker-copy')?.textContent
      if (text && text !== window.__tickerLog.at(-1)?.text) window.__tickerLog.push({ at: Date.now(), text })
    }).observe(document, { subtree: true, childList: true, characterData: true })
    window.__tickerTimers = new Set()
    const nativeSetTimeout = window.setTimeout
    const nativeClearTimeout = window.clearTimeout
    window.setTimeout = function setTimeout(callback, delay, ...args) {
      if (delay !== tickerMs) return nativeSetTimeout(callback, delay, ...args)
      const id = nativeSetTimeout((...callbackArgs) => {
        window.__tickerTimers.delete(id)
        return callback(...callbackArgs)
      }, delay, ...args)
      window.__tickerTimers.add(id)
      return id
    }
    window.clearTimeout = function clearTimeout(id) {
      window.__tickerTimers.delete(id)
      return nativeClearTimeout(id)
    }
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
    fixedRandomValue: randomValue,
    tickerMs: tickerIntervalMs
  })
  await page.goto(base)
  await page.locator('.splash-stage').waitFor()
  return page
}

function clockTime(offsetMs = 0) {
  return new Date(testClockTime.getTime() + offsetMs).toISOString()
}

async function tickerLog(page) {
  return (await page.evaluate(() => window.__tickerLog))
    .map(({ at, text }) => ({ atMs: at - testClockTime.getTime(), text }))
}

function assertTickerInPool(ticker, label) {
  assert.ok(SPLASH_TICKER_POOL.includes(ticker), `${label}: 티커 "${ticker}" 는 풀(39개)에 있어야 한다`)
}

// 한 방문의 티커 관측 기록 검증: 풀 포함 · 서로 다른 티커 ≥minDistinct · 연속 동일 0 · 방문 안 중복 0 · 1.5초 간격.
// 같은 문구가 연속으로 뽑히면 DOM 이 바뀌지 않아 기록에 남지 않으므로, "연속 동일 0" 은 간격이 정확히 1.5초씩인지로도 확인한다.
function assertTickerRotation(log, label, { minCount = 4, maxCount = 4, minDistinct = 3 } = {}) {
  const texts = log.map(entry => entry.text)
  assert.ok(
    log.length >= minCount && log.length <= maxCount,
    `${label}: 티커 ${log.length}개 관측 (${minCount}~${maxCount}개 기대) ${JSON.stringify(log)}`
  )
  texts.forEach(text => assertTickerInPool(text, label))
  assert.ok(new Set(texts).size >= minDistinct, `${label}: 서로 다른 티커 ${new Set(texts).size}개 (≥${minDistinct} 기대)`)
  assert.equal(new Set(texts).size, texts.length, `${label}: 한 방문 안에서 이미 나온 티커가 다시 나오면 안 된다`)
  log.slice(1).forEach((entry, index) => {
    assert.notEqual(entry.text, log[index].text, `${label}: 연속 동일 티커`)
    assert.equal(entry.atMs - log[index].atMs, tickerIntervalMs, `${label}: ${index + 1}→${index + 2}번째 티커 간격`)
  })
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
  assert.equal(await page.locator('.splash-stage').count(), 0, '문 열림 중에는 스플래시가 아니라 환승 홀이 뒤에 있어야 한다')
  assert.equal(await page.locator('.station-topbar h2').count(), 1, '문 열림 중 환승 홀 제목이 DOM 에 있어야 한다')
  await page.clock.runFor(doorOpeningMs - 1)
  assert.equal(await page.locator('.door-transition').count(), 1, '총 전환 시각 직전에는 문 열림이 남아야 한다')
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

test('티커 선택기: 직전 반복 0 · 방문 안 중복 0 · 39개를 다 쓰면 초기화한다', () => {
  assert.equal(SPLASH_TICKER_POOL.length, 39)
  assert.equal(new Set(SPLASH_TICKER_POOL).size, 39, '풀에 중복 문구가 없어야 한다')
  assert.deepEqual(SPLASH_TICKER_POOL.slice(0, 3), [
    '에스컬레이터 방향 다수결로 정하는 중…',
    '지연 시간을 정성껏 반올림하는 중…',
    '출구 번호에 서열 매기는 중…'
  ], '기존 고정 문구 3개는 풀의 1~3번이다')
  assert.deepEqual(SPLASH_TICKER_POOL.slice(36), [
    '실없는 농담의 품질을 검수하는 중…',
    '결심의 롤백 지점을 저장하는 중…',
    '직장인들 화가 취미로 오르는 중…'
  ], '이력의 마지막 3개(TKT-186 r2 I1)가 풀 끝에 있어야 한다')

  const randoms = {
    '실난수': Math.random,
    '항상 0': () => 0,
    '항상 1에 가까움': () => 0.9999999,
    '정확히 1(경계)': () => 1
  }
  for (const [name, random] of Object.entries(randoms)) {
    const shown = new Set()
    let previous = ''
    let sinceReset = []
    for (let pick = 1; pick <= 150; pick += 1) {
      const message = pickSplashTicker(previous, shown, random)
      assertTickerInPool(message, `${name} ${pick}번째`)
      assert.notEqual(message, previous, `${name} ${pick}번째: 직전 문구 반복`)
      // 39개를 다 쓰면 shown 이 비워지고 새 사이클이 시작된다. 한 사이클 안에서는 중복이 없어야 한다.
      if (shown.size === 1 && pick > 1) sinceReset = []
      assert.ok(!sinceReset.includes(message), `${name} ${pick}번째: 같은 사이클 안 중복`)
      sinceReset.push(message)
      previous = message
    }
  }

  const shown = new Set()
  const firstCycle = []
  for (let pick = 0; pick < 39; pick += 1) firstCycle.push(pickSplashTicker('', shown))
  assert.equal(new Set(firstCycle).size, 39, '39번을 뽑으면 풀 전체가 한 번씩 나와야 한다')
  const afterReset = pickSplashTicker(firstCycle.at(-1), shown)
  assert.notEqual(afterReset, firstCycle.at(-1), '초기화 직후에도 직전 문구는 반복하지 않는다')
  assert.deepEqual([...shown], [afterReset], '초기화 뒤 shown 에는 새로 뽑은 문구만 남는다')
})

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
  assertTickerInPool(first.ticker, '375 첫 방문 0.15초')
  assert.equal(
    await page.locator('.splash-ticker-strip').getAttribute('aria-live'),
    'off',
    '1.5초마다 바뀌는 티커를 스크린리더가 매번 읽지 않도록 aria-live=off'
  )
  assert.ok(first.runningCells > 0, 'the retained half-panel engine is flipping')
  const firstSettledAtMs = 150 + await waitForPhraseToSettle(page, 'WORKING AROUND', 1000)
  assert.ok(phraseIntervalMs - firstSettledAtMs >= 700, `첫 문구 정지 노출 ${phraseIntervalMs - firstSettledAtMs}ms`)

  await page.clock.runFor(phraseIntervalMs - firstSettledAtMs)
  const secondSettledAtMs = phraseIntervalMs + await waitForPhraseToSettle(page, 'MIND THE GAP', 1000)
  const second = await snapshot(page)
  assert.equal(second.phrase, 'MIND THE GAP')
  assertTickerInPool(second.ticker, '375 첫 방문 둘째 문구')
  assert.notEqual(second.ticker, first.ticker, '둘째 문구 시점에는 티커가 한 번 이상 바뀌어 있어야 한다')
  assert.ok(phraseIntervalMs * 2 - secondSettledAtMs >= 700, `둘째 문구 정지 노출 ${phraseIntervalMs * 2 - secondSettledAtMs}ms`)

  await page.clock.runFor(phraseIntervalMs * 2 - secondSettledAtMs)
  const openingSettledAtMs = phraseIntervalMs * 2 + await waitForOpeningToSettle(page, 1000)
  const third = await snapshot(page)
  assert.equal(third.phrase, 'DOORS OPENING')
  assertTickerInPool(third.ticker, '375 첫 방문 셋째 문구')
  assert.notEqual(third.ticker, second.ticker, '셋째 문구 시점에는 티커가 다시 바뀌어 있어야 한다')
  assert.ok(firstVisitDurationMs - openingSettledAtMs >= 700, `마지막 문구 정지 노출 ${firstVisitDurationMs - openingSettledAtMs}ms`)
  assert.equal(third.overflow, 0)
  if (process.env.SPLASH_SCREENSHOT_DIR) {
    await page.screenshot({ path: `${process.env.SPLASH_SCREENSHOT_DIR}/splash-mobile-opening.png` })
  }
  await finishSplashAt(page, firstVisitDurationMs - openingSettledAtMs)
  assertTickerRotation(await tickerLog(page), '375 첫 방문 5.5초')
  assert.equal(await page.evaluate(() => window.__tickerTimers.size), 0, '환승 홀 전환 뒤 티커 타이머가 남으면 안 된다')
  const seenAt = await page.evaluate(() => window.localStorage.getItem('splash:seen'))
  assert.ok(Number.isFinite(Date.parse(seenAt)), '첫 방문 완료 시 ISO 방문 시각을 저장해야 한다')
  assert.equal(await page.locator('.station-topbar h2').textContent(), '환승 홀')
  assert.equal(Math.round((await page.locator('.station-topbar .site-loop-symbol').boundingBox()).width), 24)
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), 0)
})

test('375/1440 다크·라이트: 티커 문구 길이가 달라도 제목·플랩이 밀리지 않고 알림 라벨은 한 줄이다', async t => {
  const cases = [
    { name: '375-dark', width: 375, height: 812, theme: 'dark' },
    { name: '375-light', width: 375, height: 812, theme: 'light' },
    { name: '1440-dark', width: 1440, height: 900, theme: 'dark' },
    { name: '1440-light', width: 1440, height: 900, theme: 'light' }
  ]
  // 375 에서 2줄이 되는 가장 긴 두 문구(REV r1 B1). 풀 전체(39개)로도 같은 단언을 건다.
  const longMessages = [
    '갈아타기 최단경로가 삐지지 않게 계산하는 중…',
    '승객들의 한숨을 열차 추진력으로 재활용하는 중…'
  ]
  longMessages.forEach(message => assertTickerInPool(message, '긴 문구'))
  const messages = [...longMessages, ...SPLASH_TICKER_POOL.filter(message => !longMessages.includes(message))]

  for (const environment of cases) {
    const page = await setup(t, environment)
    // 플랩이 마지막 문구로 정착한 뒤(문 열림 전) 시계를 세워 두고 티커 문구만 바꿔 가며 잰다.
    await page.clock.runFor(4500)
    const measured = []
    for (const [index, message] of messages.entries()) {
      const layout = await page.evaluate(text => {
        document.querySelector('.ticker-copy').textContent = text
        const rect = selector => document.querySelector(selector).getBoundingClientRect()
        const label = document.querySelector('.ticker-label')
        const labelStyle = getComputedStyle(label)
        const strip = rect('.splash-ticker-strip')
        const textRange = document.createRange()
        textRange.selectNodeContents(document.querySelector('.ticker-copy'))
        const textRect = textRange.getBoundingClientRect()
        return {
          titleY: rect('.splash-top h1').top,
          boardY: rect('.splash-flap-board').top,
          stripHeight: strip.height,
          labelHeight: label.clientHeight,
          labelLineHeight: parseFloat(labelStyle.lineHeight) || parseFloat(labelStyle.fontSize) * 1.6,
          textCenterOffset: (textRect.top + textRect.bottom) / 2 - (strip.top + strip.bottom) / 2,
          replayBottom: rect('.splash-actions .ghost-button').bottom,
          overflow: document.documentElement.scrollWidth - innerWidth
        }
      }, message)
      measured.push({ message, ...layout })
      if (index < longMessages.length && process.env.SPLASH_SCREENSHOT_DIR) {
        await page.screenshot({ path: `${process.env.SPLASH_SCREENSHOT_DIR}/r2-long${index + 1}-${environment.name}.png` })
      }
    }
    const reference = measured.at(-1)
    for (const layout of measured) {
      const label = `${environment.name} "${layout.message}"`
      assert.equal(layout.titleY, reference.titleY, `${label}: 제목 y 가 문구 길이에 따라 움직이면 안 된다`)
      assert.equal(layout.boardY, reference.boardY, `${label}: 플랩 보드 y 가 움직이면 안 된다`)
      assert.equal(layout.stripHeight, reference.stripHeight, `${label}: 티커 strip 높이는 문구와 무관하게 같아야 한다`)
      assert.ok(layout.labelHeight <= Math.ceil(layout.labelLineHeight) + 1, `${label}: 알림 라벨이 한 줄이어야 한다 (${layout.labelHeight}px)`)
      assert.ok(Math.abs(layout.textCenterOffset) <= 2, `${label}: 문구가 strip 세로 가운데여야 한다 (${layout.textCenterOffset}px)`)
      assert.ok(layout.replayBottom <= environment.height, `${label}: 다시 재생 버튼이 화면(${environment.height}px) 안에 있어야 한다 (${layout.replayBottom}px)`)
      assert.equal(layout.overflow, 0, `${label}: 가로 overflow`)
    }
    if (environment.width === 375) {
      // 두 줄 예약: 한 줄(24px)짜리 strip 보다 한 줄 더 높다. 1440 은 기존 한 줄 높이를 유지한다.
      assert.ok(reference.stripHeight >= 70, `${environment.name} strip 은 두 줄 높이를 예약해야 한다 (${reference.stripHeight}px)`)
    } else {
      assert.ok(reference.stripHeight <= 55, `${environment.name} strip 은 기존 한 줄 높이여야 한다 (${reference.stripHeight}px)`)
    }
    console.log(`ticker layout ${environment.name}: ${JSON.stringify({
      titleY: reference.titleY,
      boardY: reference.boardY,
      stripHeight: reference.stripHeight,
      replayBottom: reference.replayBottom,
      messages: measured.length
    })}`)
  }
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
    assertTickerRotation(await tickerLog(firstPage), `${environment.name} 첫 방문 실난수`)
    assert.equal(await firstPage.evaluate(() => window.__tickerTimers.size), 0, `${environment.name} 티커 타이머 잔류`)
    for (const measurement of firstVisit) {
      assert.ok(
        measurement.readingMs >= 700,
        `${environment.name} ${measurement.phrase} 정지 노출 ${measurement.readingMs}ms`
      )
    }
    assert.ok(
      // TKT-201: 문이 닫힌 채 환승 홀로 바꾸므로 스플래시 DOM 은 문 열림 시작(5.5초-0.5초)에 사라진다.
      firstVisit.at(-1).removedAtMs >= firstVisitDurationMs - doorOpeningMs
      && firstVisit.at(-1).removedAtMs <= firstVisitDurationMs - doorOpeningMs + 20,
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
    assertTickerInPool((await snapshot(returnPage)).ticker, `${environment.name} 재방문`)
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
  assertTickerInPool(state.ticker, '재방문 0.15초')
  assert.ok(state.runningCells > 0, '재방문도 기존 반쪽 플랩 엔진으로 마지막 문구를 재생해야 한다')
  const settledAtMs = 150 + await waitForOpeningToSettle(page, returnVisitSettleLimitMs - 150)
  const transitionAtMs = Math.min(returnVisitMaximumMs, Math.max(returnDurationMs, settledAtMs + 1000))
  assert.ok(transitionAtMs - settledAtMs >= 1000, `정착 뒤 노출 ${transitionAtMs - settledAtMs}ms`)
  if (process.env.SPLASH_SCREENSHOT_DIR) {
    await page.screenshot({ path: `${process.env.SPLASH_SCREENSHOT_DIR}/splash-mobile-return.png` })
  }
  await finishSplashAt(page, transitionAtMs - settledAtMs)
  assertTickerRotation(await tickerLog(page), '재방문 2.5초', { minCount: 2, maxCount: 2, minDistinct: 2 })
  assert.equal(await page.evaluate(() => window.__tickerTimers.size), 0, '재방문 전환 뒤 티커 타이머가 남으면 안 된다')
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
  const returnRunTickerCount = (await tickerLog(page)).length
  await page.getByRole('button', { name: '다시 재생', exact: true }).click()
  assert.equal(await page.getByText('5.5초 후 자동 전환', { exact: true }).count(), 1)
  await page.clock.runFor(1800)
  const middle = await snapshot(page)
  assert.equal(middle.phrase, 'MIND THE GAP')
  assertTickerInPool(middle.ticker, '다시 재생 1.8초')
  assert.equal(await page.locator('.splash-stage').count(), 1, '재생 뒤에는 재방문 단축 타이머가 취소돼야 한다')
  if (process.env.SPLASH_SCREENSHOT_DIR) {
    await page.screenshot({ path: `${process.env.SPLASH_SCREENSHOT_DIR}/splash-desktop-replay.png` })
  }
  await finishSplashAt(page, 3700)
  assertTickerRotation((await tickerLog(page)).slice(returnRunTickerCount), '다시 재생 5.5초')
  assert.equal(await page.evaluate(() => window.__tickerTimers.size), 0, '다시 재생 전환 뒤 티커 타이머가 남으면 안 된다')
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
  assertTickerInPool(state.ticker, '1440 라이트 reduced-motion 0초')
  assert.equal(state.runningCells, 0)
  assert.equal(state.overflow, 0)
  assert.equal(await page.locator('.site-loop-symbol').count(), 1)
  // 티커 텍스트 교체는 모션이 아니므로 reduced-motion 에서도 1.5초마다 계속되고, 플랩은 정적 표시를 유지한다.
  await page.clock.runFor(tickerIntervalMs * 3)
  const rotated = await snapshot(page)
  assert.equal(rotated.phrase, 'WORKING AROUND')
  assert.equal(rotated.renderedPhrase, 'WORKING AROUND')
  assert.equal(rotated.runningCells, 0)
  assertTickerRotation(await tickerLog(page), '1440 라이트 reduced-motion 4.5초', { minCount: 4, maxCount: 4 })
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

test('TKT-201 문 열림 중간(250ms): 뒤에 환승 홀 노선도가 있고 스플래시 플랩은 없다', async t => {
  const cases = [
    { name: '375', width: 375, height: 812 },
    { name: '1440', width: 1440, height: 900 }
  ]
  for (const environment of cases) {
    const page = await setup(t, { ...environment, seenAt: clockTime(-60_000) })
    const settledAtMs = await waitForOpeningToSettle(page, returnVisitSettleLimitMs)
    const splashTotalMs = Math.min(returnVisitMaximumMs, Math.max(returnVisitDurationMs, settledAtMs + 1000))
    await page.clock.runFor(Math.max(0, splashTotalMs - settledAtMs - doorOpeningMs - 1))
    await page.clock.runFor(1)
    await page.locator('.door-transition.opening').waitFor()
    await page.clock.runFor(250)
    assert.equal(await page.locator('.door-transition.opening').count(), 1, '250ms 시점에도 문 열림 중')
    assert.equal(await page.locator('.splash-stage').count(), 0, '스플래시 플랩이 DOM 에 없어야 한다')
    assert.equal(await page.getByText('DOORS OPENING', { exact: true }).count(), 0, 'DOORS OPENING 문구가 보이면 안 된다')
    assert.ok(await page.locator('.junction-map').count() >= 1, '환승 홀 노선도가 문 뒤에 있어야 한다')
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), 0)
    const layering = await page.evaluate(() => {
      const door = getComputedStyle(document.querySelector('.door-transition')).zIndex
      const map = document.querySelector('.junction-map')
      return { door: Number(door), mapZ: Number(getComputedStyle(map).zIndex) || 0 }
    })
    assert.ok(layering.door > layering.mapZ, '문 레이어가 페이지 위에 있어야 한다')
    // 가상 시계는 CSS 전환을 진행시키지 않으므로 문짝 애니메이션을 250ms 지점으로 고정해 캡처한다.
    await page.evaluate(() => document.querySelectorAll('.door-panel').forEach(panel => {
      panel.getAnimations().forEach(animation => { animation.pause(); animation.currentTime = 250 })
    }))
    await page.screenshot({ path: `/private/tmp/tkt201/door-opening-mid-${environment.name}.png` })
    await page.clock.runFor(250)
    await page.locator('.door-transition').waitFor({ state: 'detached' })
    assert.equal(
      await page.locator('.station-topbar h2').evaluate(element => element === document.activeElement),
      true
    )
  }
})
