import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createRequire } from 'node:module'
import { createServer } from 'node:http'
import { mkdir, readFile, stat } from 'node:fs/promises'
import { extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { newSeoulContext } from '../e2eContext.mjs'
import { OPERATING_NOTES, OPERATING_NOTES_UPDATED } from '../data/workNotes/operatingModel.js'

// TKT-232: lite 운영 노트 — 목차 → 한 절씩 읽기. 환승 홀 위치에 기대지 않고 /work + lite 로 직접 들어간다.
const { chromium } = createRequire(import.meta.url)('playwright')
const publicBase = '/workaround.co.kr-platform/'
const distRoot = fileURLToPath(new URL('../../dist/', import.meta.url))
const SHOT_DIR = process.env.LITE_WORK_SCREENSHOT_DIR || ''
let base = process.env.LITE_WORK_TEST_URL || ''
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

async function setup(t, viewport, colorScheme = 'light') {
  const context = await newSeoulContext(browser, { viewport, reducedMotion: 'reduce', colorScheme })
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

async function openWork(page) {
  await page.goto(`${base}work`)
  await page.locator('[data-lite-screen][aria-label="운영 노트"]').waitFor()
  await page.locator('[data-work-toc]').waitFor()
}

const selectedIndex = page => page.locator('[data-note-index][aria-selected="true"]').getAttribute('data-note-index')
const stepText = page => page.locator('.nt-step').textContent()
const readTitle = page => page.locator('.nt-read-title').evaluate(el => el.childNodes[0].textContent.trim())

async function assertNoOverflow(page) {
  const values = await page.evaluate(() => ['html', 'body', '.page-scroller', '.lite-screen'].map(selector => {
    const element = document.querySelector(selector)
    return [selector, element ? Math.max(0, element.scrollWidth - element.clientWidth) : 0]
  }))
  assert.ok(values.every(([, value]) => value === 0), `가로 overflow: ${JSON.stringify(values)}`)
}

for (const viewport of VIEWPORTS) {
  const tag = `${viewport.width}px`

  test(`${tag} lite 운영 노트: 목차 항목 수 = OPERATING_NOTES, 첫 줄 선택, 줄 높이 44px 이상, 가로 넘침 0`, async t => {
    const page = await setup(t, viewport)
    await openWork(page)
    assert.equal(await page.locator('[data-lite-crumb]').textContent(), '운영 노트')
    assert.equal(await page.locator('[data-lite-keys]').textContent(), '↑↓ 고르기 · Enter 읽기 · Esc 뒤로')
    assert.equal((await page.locator('.nt-updated').textContent()).trim(), `갱신 ${OPERATING_NOTES_UPDATED}`)

    const rows = page.locator('[data-note-index]')
    assert.equal(await rows.count(), OPERATING_NOTES.length, '목차 항목 수')
    assert.deepEqual(await rows.locator('.nt-name').allTextContents(), OPERATING_NOTES.map(note => note.title))
    assert.deepEqual(await rows.locator('.nt-badge').allTextContents(), OPERATING_NOTES.map(note => note.status))
    assert.equal(await selectedIndex(page), '0', '첫 줄이 선택된 채 시작')
    for (let index = 0; index < OPERATING_NOTES.length; index += 1) {
      const box = await rows.nth(index).boundingBox()
      assert.ok(box.height >= 44, `${index}번 줄 높이 ${box.height}`)
    }
    await assertNoOverflow(page)
    await page.waitForTimeout(300)
    if (SHOT_DIR) await page.screenshot({ path: `${SHOT_DIR}/lite-work-toc-${viewport.width}.png` })
  })

  test(`${tag} lite 운영 노트: 키만으로 목차 → 절 → 앞뒤 절 → Esc 목차(고르던 줄 유지) → Esc 환승 홀`, async t => {
    const page = await setup(t, viewport)
    await openWork(page)
    await page.keyboard.press('ArrowDown')
    assert.equal(await selectedIndex(page), '1')
    await page.keyboard.press('Enter')
    await page.locator('[data-work-read]').waitFor()
    assert.equal(await stepText(page), `2/${OPERATING_NOTES.length}`)
    assert.equal(await readTitle(page), OPERATING_NOTES[1].title)
    assert.equal(await page.locator('[data-lite-keys]').textContent(), '←→ 앞뒤 절 · ↑↓ 본문 · Esc 목차')
    assert.equal(await page.locator('.nt-points > li').count(), OPERATING_NOTES[1].points.length)

    await page.keyboard.press('ArrowRight')
    assert.equal(await stepText(page), `3/${OPERATING_NOTES.length}`)
    assert.equal(await readTitle(page), OPERATING_NOTES[2].title)
    await page.keyboard.press('ArrowLeft')
    await page.keyboard.press('ArrowLeft')
    assert.equal(await stepText(page), `1/${OPERATING_NOTES.length}`)
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('ArrowRight')

    await page.keyboard.press('Escape')
    await page.locator('[data-work-toc]').waitFor()
    assert.equal(await selectedIndex(page), '2', '목차에서 고르던 줄 유지')
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowUp')
    await page.keyboard.press('Enter')
    await page.locator('[data-work-read]').waitFor()
    assert.equal(await readTitle(page), OPERATING_NOTES[2].title)

    await page.keyboard.press('Escape')
    await page.locator('[data-work-toc]').waitFor()
    await page.keyboard.press('Escape')
    await page.locator('.hall[data-hall="lite"]').waitFor()
    assert.equal(await page.locator('[data-lite-screen]').count(), 0, '환승 홀로 나간다')
  })

  test(`${tag} lite 운영 노트: 흐름은 → 한 줄, 흐름 없는 절은 흐름 줄 없음, ‹ 뒤로 = 목차 → 환승 홀`, async t => {
    const page = await setup(t, viewport)
    await openWork(page)
    const flowIndex = OPERATING_NOTES.findIndex(note => note.flow?.length)
    const plainIndex = OPERATING_NOTES.findIndex(note => !note.flow?.length)
    assert.ok(flowIndex >= 0 && plainIndex >= 0, '흐름 있는 절과 없는 절이 모두 있다')

    for (let i = 0; i < flowIndex; i += 1) await page.keyboard.press('ArrowDown')
    await page.keyboard.press('Enter')
    await page.locator('[data-work-read]').waitFor()
    assert.equal(await page.locator('.nt-flow').textContent(), OPERATING_NOTES[flowIndex].flow.join(' → '))

    await page.locator('[data-lite-back]').click()
    await page.locator('[data-work-toc]').waitFor()
    assert.equal(await selectedIndex(page), String(flowIndex), '‹ 뒤로는 목차, 고르던 줄 유지')

    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowUp')
    for (let i = 0; i < plainIndex - flowIndex; i += 1) await page.keyboard.press('ArrowDown')
    await page.keyboard.press('Enter')
    await page.locator('[data-work-read]').waitFor()
    assert.equal(await page.locator('.nt-flow').count(), 0, '흐름 없는 절은 흐름 줄이 없다')

    await page.locator('[data-lite-back]').click()
    await page.locator('[data-work-toc]').waitFor()
    await page.locator('[data-lite-back]').click()
    await page.locator('.hall[data-hall="lite"]').waitFor()
  })

  test(`${tag} lite 운영 노트 실렌더 캡처: 목차와 절 (테마는 단일 — TKT-218 로 라이트 테마 없음)`, async t => {
    if (!SHOT_DIR) return
    const page = await setup(t, viewport)
    await openWork(page)
    await page.waitForTimeout(300)
    await page.screenshot({ path: `${SHOT_DIR}/lite-work-toc-${viewport.width}.png` })
    await page.keyboard.press('Enter')
    await page.locator('[data-work-read]').waitFor()
    await page.waitForTimeout(300)
    await page.screenshot({ path: `${SHOT_DIR}/lite-work-read-${viewport.width}.png` })
    await assertNoOverflow(page)
  })
}
