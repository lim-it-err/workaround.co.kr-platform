import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import vm from 'node:vm'

const { chromium } = createRequire(import.meta.url)('playwright')
const base = process.env.SIM_TONE_TEST_URL || 'http://127.0.0.1:4175'
const source = await readFile(new URL('../App.vue', import.meta.url), 'utf8')
const fixtures = Object.fromEntries(
  ['fallbackHealth', 'fallbackRuntime', 'fallbackWorkBoard', 'fallbackElevatorState'].map((name) => {
    const expression = source.split(`const ${name} = `)[1].split('\n\nconst ')[0]
    return [name, vm.runInNewContext(`(${expression})`)]
  })
)

let browser

before(async () => {
  browser = await chromium.launch({ headless: true })
})

after(async () => {
  await browser?.close()
})

function elevatorFixture(refreshCount) {
  const fixture = structuredClone(fixtures.fallbackElevatorState)
  fixture.tick = refreshCount
  fixture.summary.waitingPassengers = refreshCount % 10
  fixture.summary.movingElevators = 1
  fixture.elevators[0].status = 'moving'
  fixture.elevators[0].direction = 'up'
  fixture.elevators[0].position = 2 + (refreshCount % 19)
  fixture.elevators[0].currentFloor = Math.round(fixture.elevators[0].position)
  return fixture
}

async function setup(t, { path, theme, width, controlledClock = true }) {
  const context = await browser.newContext({
    viewport: { width, height: width === 375 ? 812 : 900 },
    reducedMotion: 'reduce'
  })
  const page = await context.newPage()
  const errors = []
  let elevatorRefreshCount = 0

  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (['error', 'warning'].includes(message.type())) errors.push(message.text())
  })
  await page.addInitScript((selectedTheme) => {
    localStorage.setItem('workaround-theme', selectedTheme)
  }, theme)
  await page.route('**/api/**', async (route) => {
    const pathname = new URL(route.request().url()).pathname
    let body = { ok: true }
    if (pathname === '/api/health') body = fixtures.fallbackHealth
    if (pathname === '/api/runtime') body = fixtures.fallbackRuntime
    if (pathname === '/api/work-manager/board') body = fixtures.fallbackWorkBoard
    if (pathname === '/api/services') body = { services: [] }
    if (pathname.endsWith('/api/state')) body = elevatorFixture(elevatorRefreshCount++)
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify(body) })
  })
  if (controlledClock) {
    const now = new Date('2026-09-14T00:00:00Z')
    await page.clock.install({ time: now })
    await page.clock.pauseAt(now)
  }
  t.after(async () => {
    await context.close()
    assert.deepEqual(errors, [], '브라우저 오류나 경고가 없어야 한다')
  })
  await page.goto(`${base}/${path}`)
  await page.locator('.sim-tone-page').waitFor()
  return page
}

async function assertNoPageOverflow(page) {
  const values = await page.evaluate(() => ['html', 'body', '.portal-stage', '.page-scroller', '.feature-shell']
    .map((selector) => {
      const element = document.querySelector(selector)
      return [selector, element ? Math.max(0, element.scrollWidth - element.clientWidth) : 0]
    }))
  for (const [selector, overflow] of values) {
    assert.equal(overflow, 0, `${selector} 가로 넘침이 없어야 한다`)
  }
}

async function css(page, selector, property) {
  return page.locator(selector).first().evaluate((element, key) => getComputedStyle(element)[key], property)
}

const scenarios = [
  { width: 375, theme: 'dark' },
  { width: 1440, theme: 'light' }
]

for (const scenario of scenarios) {
  test(`${scenario.width}px ${scenario.theme}: 엘리베이터는 캔버스와 시각표 행으로 읽힌다`, async (t) => {
    const page = await setup(t, { path: 'elevator', ...scenario })
    await page.locator('.station-center').getByRole('heading', { name: '멈춘 엘리베이터', exact: true }).waitFor()
    assert.equal(await page.locator('.elevator-metrics article').count(), 4)
    assert.equal(await css(page, '.elevator-metrics article', 'backgroundColor'), 'rgba(0, 0, 0, 0)')
    assert.equal(await css(page, '.elevator-metrics article', 'borderRadius'), '0px')
    assert.notEqual(await css(page, '.elevator-cross-section', 'backgroundColor'), 'rgba(0, 0, 0, 0)')
    assert.notEqual(await css(page, '.elevator-presets .chip-button', 'backgroundColor'), 'rgba(0, 0, 0, 0)')
    await assertNoPageOverflow(page)
    if (process.env.SIM_TONE_SCREENSHOT_DIR) {
      await page.screenshot({ path: `${process.env.SIM_TONE_SCREENSHOT_DIR}/elevator-${scenario.width}-${scenario.theme}.png`, fullPage: true })
    }
  })

  test(`${scenario.width}px ${scenario.theme}: 택시는 지도 캔버스와 시각표 행으로 읽힌다`, async (t) => {
    const page = await setup(t, { path: 'taxi', ...scenario })
    await page.locator('.station-center').getByRole('heading', { name: '심야 택시', exact: true }).waitFor()
    assert.equal(await page.locator('.taxi-tone-page .eyebrow').count(), 0)
    assert.equal(await page.locator('.taxi-timetable article').count(), 4)
    assert.equal(await page.locator('.district-card').count(), 9)
    assert.equal(await css(page, '.taxi-timetable article', 'backgroundColor'), 'rgba(0, 0, 0, 0)')
    assert.equal(await css(page, '.taxi-tone-page .reward-card', 'borderRadius'), '0px')
    assert.notEqual(await css(page, '.district-card', 'backgroundColor'), 'rgba(0, 0, 0, 0)')
    assert.notEqual(await css(page, '.queue-buttons .primary-button', 'backgroundColor'), 'rgba(0, 0, 0, 0)')
    await assertNoPageOverflow(page)
    if (process.env.SIM_TONE_SCREENSHOT_DIR) {
      await page.screenshot({ path: `${process.env.SIM_TONE_SCREENSHOT_DIR}/taxi-${scenario.width}-${scenario.theme}.png`, fullPage: true })
    }
  })
}

test('무인 30초 동안 엘리베이터와 택시 화면이 모두 변한다', async (t) => {
  const [elevatorPage, taxiPage] = await Promise.all([
    setup(t, { path: 'elevator', theme: 'dark', width: 1280, controlledClock: false }),
    setup(t, { path: 'taxi', theme: 'dark', width: 1280, controlledClock: false })
  ])
  const elevatorBefore = await elevatorPage.locator('.elevator-metrics').innerText()
  const taxiBefore = await taxiPage.locator('.taxi-timetable').innerText()
  await new Promise((resolve) => setTimeout(resolve, 30500))
  assert.notEqual(await elevatorPage.locator('.elevator-metrics').innerText(), elevatorBefore)
  assert.notEqual(await taxiPage.locator('.taxi-timetable').innerText(), taxiBefore)
  assert.ok(await taxiPage.locator('.prototype-rule-card').filter({ hasText: '보상' }).count() > 0)
})
