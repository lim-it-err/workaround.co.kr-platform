// Run against an isolated root-base preview. All API traffic uses local fixtures.
import assert from 'node:assert/strict'
import { before, after, test } from 'node:test'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import vm from 'node:vm'
const { chromium } = createRequire(import.meta.url)('playwright')
const base = process.env.TAXI_TEST_URL || 'http://127.0.0.1:4175'
const source = await readFile(new URL('../App.vue', import.meta.url), 'utf8')
const fixtures = Object.fromEntries(['fallbackHealth', 'fallbackRuntime', 'fallbackWorkBoard', 'fallbackElevatorState'].map(name => {
  const expression = source.split(`const ${name} = `)[1].split('\n\nconst ')[0]
  return [name, vm.runInNewContext(`(${expression})`)]
}))
let browser
before(async () => { browser = await chromium.launch({ headless: true }) })
after(async () => { await browser?.close() })

async function setup(t, { theme = 'dark', width = 375, controlledClock = true } = {}) {
  const context = await browser.newContext({ viewport: { width, height: width === 375 ? 812 : 1000 }, reducedMotion: 'reduce' })
  t.after(() => context.close())
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => { if (['error', 'warning'].includes(message.type())) errors.push(message.text()) })
  t.after(() => assert.deepEqual(errors, [], 'no browser errors or warnings'))
  if (controlledClock) {
    const now = new Date('2026-09-10T00:00:00Z')
    await page.clock.install({ time: now })
    await page.clock.pauseAt(now)
  }
  await page.addInitScript(theme => {
    localStorage.setItem('workaround-theme', theme)
    const original = window.setInterval.bind(window)
    window.setInterval = (callback, delay, ...args) => {
      const id = original(callback, delay, ...args)
      if (delay === 1200) window.__taxiClockReady = true
      return id
    }
  }, theme)
  await page.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname
    const fixture = path === '/api/health' ? fixtures.fallbackHealth
      : path === '/api/runtime' ? fixtures.fallbackRuntime
        : path === '/api/work-manager/board' ? fixtures.fallbackWorkBoard
          : path.endsWith('/api/state') ? fixtures.fallbackElevatorState : { services: [] }
    return route.fulfill({ json: fixture })
  })
  await page.goto(`${base}/taxi`)
  await page.getByRole('button', { name: '수동 호출 추가', exact: true }).waitFor()
  await page.waitForFunction(() => window.__taxiClockReady)
  return page
}

const panel = (page, title) => page.locator('.surface-panel').filter({ has: page.getByRole('heading', { name: title, exact: true }) })
const fleet = (page, id) => page.locator('.fleet-card').filter({ has: page.locator('.fleet-top strong', { hasText: id }) })
async function screenshot(page, name) {
  if (process.env.TAXI_SCREENSHOT_DIR) await page.screenshot({ path: `${process.env.TAXI_SCREENSHOT_DIR}/${name}.png` })
}
async function overflow(page) {
  const values = await page.evaluate(() => ['html', 'body', '.page-scroller', '.feature-shell'].map(selector => {
    const node = document.querySelector(selector)
    return node.scrollWidth - node.clientWidth
  }))
  assert.ok(values.every(value => value <= 0), `overflow: ${values}`)
}
for (const theme of ['dark', 'light']) {
  for (const width of [375, 1280]) {
    test(`manual same-zone + 6-request burst drains, ${theme} ${width}px`, async t => {
      const page = await setup(t, { theme, width })
      await page.getByLabel('출발지').selectOption('east')
      await page.getByLabel('도착지').selectOption('center')
      await page.getByRole('button', { name: '수동 호출 추가', exact: true }).click()
      const taxi = fleet(page, 'Cab-04')
      assert.equal(await taxi.locator('.fleet-top span').innerText(), 'pickup')
      const firstId = await taxi.locator('.fleet-reward').innerText()
      assert.match(await panel(page, '진행 중 호출').innerText(), new RegExp(`${firstId} · assigned`))
      await page.clock.runFor(1200)
      assert.equal(await taxi.locator('.fleet-top span').innerText(), 'dropoff')
      await page.clock.runFor(1200)
      assert.match(await panel(page, '최근 완료 호출').innerText(), new RegExp(firstId))
      assert.ok(!(await panel(page, '진행 중 호출').innerText()).includes(firstId))

      await page.getByLabel('출발지').selectOption('east')
      await page.getByLabel('도착지').selectOption('center')
      for (let index = 0; index < 6; index++) await page.getByRole('button', { name: '수동 호출 추가', exact: true }).click()
      const ids = await panel(page, '진행 중 호출').locator('.prototype-rule-card strong').allTextContents()
      const burstIds = ids.map(text => text.split(' · ')[0])
      assert.equal(burstIds.length, 6)
      assert.ok(ids.some(text => text.includes('pending')))
      await panel(page, '진행 중 호출').scrollIntoViewIfNeeded()
      await screenshot(page, `queue-before-${theme}-${width}`)
      const completed = new Set()
      for (let tick = 0; tick < 24; tick++) {
        await page.clock.runFor(1200)
        const rows = await panel(page, '최근 완료 호출').locator('.prototype-rule-card strong').allTextContents()
        for (const id of burstIds) if (rows.some(row => row.includes(id))) completed.add(id)
      }
      assert.deepEqual([...completed].sort(), [...burstIds].sort())
      const remaining = await panel(page, '진행 중 호출').innerText()
      assert.ok(burstIds.every(id => !remaining.includes(id)))
      await panel(page, '최근 완료 호출').scrollIntoViewIfNeeded()
      await screenshot(page, `completed-${theme}-${width}`)
      await panel(page, '차량 상태').scrollIntoViewIfNeeded()
      await screenshot(page, `fleet-${theme}-${width}`)
      await overflow(page)
      await page.evaluate(() => {
        window.scrollTo({ top: 0, behavior: 'instant' })
        document.querySelector('.page-scroller').scrollTo({ top: 0, behavior: 'instant' })
      })
      await screenshot(page, `taxi-${theme}-${width}`)
      await page.getByRole('button', { name: '미스터리 트레인으로 돌아가기', exact: true }).click()
      await page.locator('.tone-sim-page').waitFor()
      assert.equal(await page.locator('.tone-sim-page .tone-page-hero').count(), 1)
      assert.ok(await page.locator('.tone-sim-page .tone-service-row').count() > 0)
      assert.equal(await page.locator('.tone-page-hero').getByRole('heading', { name: '멈춘 엘리베이터', exact: true }).count(), 1)
      assert.equal(await page.locator('.tone-service-row').getByRole('heading', { name: '심야 택시', exact: true }).count(), 1)
    })
  }
}

test('unattended real 30 seconds visibly advances the taxi simulation', async t => {
  const page = await setup(t, { width: 1280, controlledClock: false })
  const before = await page.locator('.banner-stats').innerText()
  await screenshot(page, 'taxi-before-30s')
  await page.waitForTimeout(30500)
  assert.notEqual(await page.locator('.banner-stats').innerText(), before)
  const completed = await panel(page, '최근 완료 호출').locator('.prototype-rule-card').count()
  assert.ok(completed > 0)
  await screenshot(page, 'taxi-after-30s')
})
