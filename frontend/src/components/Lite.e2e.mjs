import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createRequire } from 'node:module'
import { createServer } from 'node:http'
import { mkdir, readFile, stat } from 'node:fs/promises'
import { extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { newSeoulContext } from '../e2eContext.mjs'

// TKT-228: lite 공용 틀 — 환승 홀 → lite 자리표시 화면 → Esc/‹ 뒤로 → 환승 홀. 기본 보기·비대상 페이지는 기존 화면.
const { chromium } = createRequire(import.meta.url)('playwright')
const publicBase = '/workaround.co.kr-platform/'
const distRoot = fileURLToPath(new URL('../../dist/', import.meta.url))
const SHOT_DIR = process.env.LITE_SCREENSHOT_DIR || ''
let base = process.env.LITE_TEST_URL || ''
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
  if (SHOT_DIR) await mkdir(SHOT_DIR, { recursive: true })
})

after(async () => {
  await browser?.close()
  if (server) await new Promise(resolve => server.close(resolve))
})

async function serveStaticBuild(request, response) {
  const url = new URL(request.url, 'http://127.0.0.1')
  const decodedPath = decodeURIComponent(url.pathname)
  const relativePath = decodedPath.startsWith(publicBase) ? decodedPath.slice(publicBase.length) : decodedPath.replace(/^\/+/, '')
  let filePath = join(distRoot, relativePath || 'index.html')
  try {
    if ((await stat(filePath)).isDirectory()) filePath = join(filePath, 'index.html')
  } catch {
    filePath = join(distRoot, 'index.html')
  }
  const contentTypes = { '.css': 'text/css', '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml' }
  response.writeHead(200, { 'content-type': contentTypes[extname(filePath)] || 'application/octet-stream' })
  response.end(await readFile(filePath))
}

const VIEWPORTS = [{ width: 375, height: 812 }, { width: 1440, height: 900 }]
const SCREENS = [
  ['voyage', '여행'],
  ['pantry', '자취 밥상'],
  ['work', '운영 노트']
]

async function setup(t, viewport, { lite = true } = {}) {
  const context = await newSeoulContext(browser, { viewport, reducedMotion: 'reduce' })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => {
    if (['error', 'warning'].includes(message.type())) errors.push(message.text())
  })
  await page.addInitScript(({ lite }) => {
    localStorage.setItem('splash:seen', new Date().toISOString())
    localStorage.setItem('workaround-view', lite ? 'lite' : 'base')
  }, { lite })
  t.after(async () => {
    await context.close()
    assert.deepEqual(errors, [], '브라우저 오류나 경고가 없어야 한다')
  })
  return page
}

async function toHall(page) {
  await page.goto(`${base}voyage`)
  await page.getByRole('button', { name: '환승 홀', exact: true }).click()
  await page.locator('.hall[data-hall="lite"]').waitFor()
}

const selected = page => page.locator('.hall[data-hall="lite"] [aria-selected="true"]').textContent()

for (const viewport of VIEWPORTS) {
  const tag = `${viewport.width}px`

  test(`${tag} lite: 환승 홀 ↓ Enter → 자취 밥상 lite 틀(LiteScreen)이 그려짐, Esc → 환승 홀 목록이 키로 움직인다`, async t => {
    const page = await setup(t, viewport)
    await toHall(page)
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('Enter')
    await page.locator('[data-lite-screen]').waitFor()
    assert.match(new URL(page.url()).pathname, /\/pantry$/)
    assert.equal(await page.locator('[data-lite-back]').count(), 1, 'lite 틀의 뒤로 버튼이 있다')
    assert.equal(await page.locator('[data-lite-keys]').count(), 1, 'lite 틀의 키 안내 줄이 있다')
    assert.ok((await page.locator('[data-lite-back]').boundingBox()).height >= 44, '뒤로 버튼 44px 이상')
    for (const sel of ['html', 'body', '.page-scroller', '.lite-screen']) {
      assert.equal(await page.evaluate(s => { const e = document.querySelector(s); return Math.max(0, e.scrollWidth - e.clientWidth) }, sel), 0, `${sel} 가로 넘침 없음`)
    }
    await page.waitForTimeout(400)
    if (SHOT_DIR) await page.screenshot({ path: `${SHOT_DIR}/lite-placeholder-${viewport.width}.png` })

    await page.keyboard.press('Escape')
    await page.locator('.hall[data-hall="lite"]').waitFor()
    assert.equal(await page.locator('[data-lite-screen]').count(), 0)
    assert.match(new URL(page.url()).pathname, /\/(junction)?$/)
    const first = await selected(page)
    await page.keyboard.press('ArrowDown')
    assert.notEqual(await selected(page), first, '환승 홀 목록이 다시 키로 움직인다')
  })

  test(`${tag} lite: 3개 화면 각각 lite 틀(LiteScreen)이 그려짐, ‹ 뒤로 = 환승 홀`, async t => {
    const page = await setup(t, viewport)
    for (const [id, label] of SCREENS) {
      await page.goto(`${base}${id}`)
      await page.locator('[data-lite-screen]').waitFor()
      assert.equal(await page.locator('[data-lite-crumb]').textContent(), label, id)
      assert.equal(await page.locator('[data-lite-screen] [data-lite-back]').count(), 1, id)
    }
    await page.locator('[data-lite-back]').click()
    await page.locator('.hall[data-hall="lite"]').waitFor()
  })

  test(`${tag} lite: 유로트럭(/ets2)은 lite 틀이 아니라 기본 유로트럭 화면 그대로 (TKT-233)`, async t => {
    const page = await setup(t, viewport)
    await page.goto(`${base}ets2`)
    await page.locator('.station-topbar').waitFor()
    assert.equal(await page.locator('[data-lite-screen]').count(), 0, '유로트럭은 lite 틀이 없다')
    assert.equal(await page.locator('[data-lite-placeholder]').count(), 0)
  })

  test(`${tag} 기본 보기: 기존 화면 그대로 · lite 에서도 비대상 페이지는 기존 화면`, async t => {
    const base1 = await setup(t, viewport, { lite: false })
    await base1.goto(`${base}voyage`)
    await base1.locator('.station-topbar').waitFor()
    assert.equal(await base1.locator('[data-lite-screen]').count(), 0, '기본 보기에는 lite 틀이 없다')
    assert.equal(await base1.locator('[data-lite-placeholder]').count(), 0)

    const lite = await setup(t, viewport)
    await lite.goto(`${base}simhub`)
    await lite.locator('.station-topbar').waitFor()
    assert.equal(await lite.locator('[data-lite-screen]').count(), 0, '승강장은 lite 에서도 기존 화면')
  })
}
