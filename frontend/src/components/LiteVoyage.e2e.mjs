import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createRequire } from 'node:module'
import { createServer } from 'node:http'
import { mkdir, readFile, stat } from 'node:fs/promises'
import { extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { newSeoulContext } from '../e2eContext.mjs'

// TKT-229: lite 여행 — 목록 → 노선 한 줄 → 결산, Esc 한 단계씩 위.
const { chromium } = createRequire(import.meta.url)('playwright')
const publicBase = '/workaround.co.kr-platform/'
const distRoot = fileURLToPath(new URL('../../dist/', import.meta.url))
const SHOT_DIR = process.env.LITE_VOYAGE_SHOT_DIR || ''
let base = process.env.LITE_VOYAGE_TEST_URL || ''
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

async function setup(t, viewport) {
  const context = await newSeoulContext(browser, { viewport, reducedMotion: 'reduce' })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => {
    if (['error', 'warning'].includes(message.type())) errors.push(message.text())
  })
  await page.addInitScript(() => {
    localStorage.setItem('splash:seen', new Date().toISOString())
    localStorage.setItem('workaround-view', 'lite')
  })
  t.after(async () => {
    await context.close()
    assert.deepEqual(errors, [], '브라우저 오류나 경고가 없어야 한다')
  })
  return page
}

const crumb = page => page.locator('[data-lite-crumb]').textContent()
const onRow = page => page.locator('[data-lite-voyage-route] li.on').first()

async function noOverflow(page) {
  for (const sel of ['html', 'body', '.page-scroller', '.lite-screen', '[data-lite-scroll]']) {
    assert.equal(await page.evaluate(s => { const e = document.querySelector(s); return e ? Math.max(0, e.scrollWidth - e.clientWidth) : 0 }, sel), 0, `${sel} 가로 넘침 없음`)
  }
}

for (const viewport of VIEWPORTS) {
  const tag = `${viewport.width}px`

  test(`${tag} 환승 홀 → 여행 → Enter → ↓ 끝까지 → 결산 777.1 / Esc 두 번 → 환승 홀`, async t => {
    const page = await setup(t, viewport)
    await page.goto(`${base}voyage`)
    await page.locator('[data-lite-voyage-list]').waitFor()
    assert.equal(await crumb(page), '여행')
    const options = page.locator('[data-lite-voyage-list] li')
    assert.equal(await options.count(), 3)
    assert.equal(await options.first().getAttribute('aria-selected'), 'true', '첫 여행이 선택된 채 시작')
    assert.match(await options.first().textContent(), /중부유럽 순환선\s*2026/)
    for (let i = 0; i < 3; i++) assert.ok((await options.nth(i).boundingBox()).height >= 44, '목록 줄 44px 이상')
    await noOverflow(page)
    await page.waitForTimeout(300)
    if (SHOT_DIR) await page.screenshot({ path: `${SHOT_DIR}/voyage-list-${viewport.width}.png` })

    await page.keyboard.press('Enter')
    await page.locator('[data-lite-voyage-route]').waitFor()
    assert.equal(await crumb(page), '여행 › 중부유럽 순환선')
    const rows = page.locator('[data-lite-voyage-route] > li')
    assert.equal(await rows.count(), 12, '11일 + 결산')
    assert.match(await rows.first().textContent(), /DAY 1\s*┃?\s*프라하/)
    assert.equal(await page.locator('[data-lite-voyage-route] li.on').count(), 1, '고른 줄 하나만 펼침')
    for (let i = 0; i < 12; i++) assert.ok((await rows.nth(i).boundingBox()).height >= 44, `${i} 줄 44px 이상`)
    for (let i = 0; i < 3; i++) await page.keyboard.press('ArrowDown')
    assert.match(await onRow(page).textContent(), /DAY 4/)
    assert.ok(await onRow(page).locator('.lv-extra p').count() >= 1, '고른 줄은 기록이 더 펼쳐진다')
    assert.equal(await page.locator('.lv-extra').count(), 1)
    await noOverflow(page)
    const sumX = await page.locator('[data-lite-voyage-route] > li:not(.settle) .lv-sum').evaluateAll(els => els.map(e => Math.round(e.getBoundingClientRect().left)))
    if (viewport.width >= 481) assert.equal(new Set(sumX).size, 1, `요약 시작 열이 모든 줄에서 같다: ${sumX}`)
    const extraH = await page.locator('.lv-extra').evaluate(e => e.getBoundingClientRect().height)
    assert.ok(extraH <= 6 * 26, `펼친 기록 높이 ${extraH}`)
    assert.equal(await page.locator('[data-row="settlement"]').textContent().then(t => t.includes('■')), false, '결산 줄에 장식 글리프 없음')
    await page.waitForTimeout(300)
    if (SHOT_DIR) await page.screenshot({ path: `${SHOT_DIR}/voyage-route-${viewport.width}.png` })

    for (let i = 0; i < 12; i++) await page.keyboard.press('ArrowDown')
    const settle = onRow(page)
    assert.equal(await settle.getAttribute('data-row'), 'settlement')
    const text = await settle.textContent()
    assert.match(text, /777\.1만원/)
    assert.match(text, /1인당 388\.6만원/)
    assert.match(text, /사전 결제 650\.0만원/)
    assert.match(text, /현지 지출 127\.1만원/)
    await noOverflow(page)
    await page.waitForTimeout(300)
    if (SHOT_DIR) await page.screenshot({ path: `${SHOT_DIR}/voyage-settlement-${viewport.width}.png` })

    await page.keyboard.press('Escape')
    await page.locator('[data-lite-voyage-list]').waitFor()
    assert.equal(await crumb(page), '여행')
    await page.keyboard.press('Escape')
    await page.locator('.hall[data-hall="lite"]').waitFor()
  })

  test(`${tag} 기록 없는 여행(아이슬란드)도 깨지지 않는다 · 포인터 두 번 = 진입`, async t => {
    const page = await setup(t, viewport)
    await page.goto(`${base}voyage`)
    await page.locator('[data-lite-voyage-list]').waitFor()
    await page.keyboard.press('ArrowDown')
    assert.match(await page.locator('[data-lite-voyage-list] [aria-selected="true"]').textContent(), /아이슬란드/)
    await page.keyboard.press('Enter')
    await page.locator('[data-lite-voyage-route]').waitFor()
    assert.equal(await crumb(page), '여행 › 아이슬란드')
    assert.equal(await page.locator('[data-lite-voyage-empty]').textContent(), '기록 정리 중')
    assert.match(await onRow(page).textContent(), /결산.*결산 정리 중/)
    await noOverflow(page)
    await page.keyboard.press('Escape')
    await page.locator('[data-lite-voyage-list]').waitFor()
    assert.match(await page.locator('[data-lite-voyage-list] [aria-selected="true"]').textContent(), /아이슬란드/, '돌아오면 고른 여행 그대로')

    const spain = page.locator('[data-voyage]').nth(2)
    await spain.click()
    assert.equal(await page.locator('[data-lite-voyage-route]').count(), 0, '첫 클릭은 선택만')
    await spain.click()
    await page.locator('[data-lite-voyage-route]').waitFor()
    assert.equal(await crumb(page), '여행 › 스페인')
    await page.locator('[data-lite-back]').click()
    await page.locator('[data-lite-voyage-list]').waitFor()
  })
}
