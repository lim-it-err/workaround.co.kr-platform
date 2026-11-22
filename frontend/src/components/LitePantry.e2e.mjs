import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createRequire } from 'node:module'
import { createServer } from 'node:http'
import { mkdir, readFile, stat } from 'node:fs/promises'
import { extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { newSeoulContext } from '../e2eContext.mjs'
import { PANTRY_SETS, filterSetsByTags, findDish, setTags } from '../data/pantry/index.js'

// TKT-231: lite 자취 밥상 — 질문 3개 → 무작위 한 상. /pantry 로 직접 진입(lite 는 localStorage).
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
const TITLES = PANTRY_SETS.map(set => set.title)

async function setup(t, viewport, random) {
  const context = await newSeoulContext(browser, { viewport, reducedMotion: 'reduce' })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => {
    if (['error', 'warning'].includes(message.type())) errors.push(message.text())
  })
  await page.addInitScript(({ random }) => {
    localStorage.setItem('splash:seen', new Date().toISOString())
    localStorage.setItem('workaround-view', 'lite')
    if (random !== null) { let n = 0; const seq = random; Math.random = () => seq[n++ % seq.length] }
  }, { random: random ?? null })
  t.after(async () => {
    await context.close()
    assert.deepEqual(errors, [], '브라우저 오류나 경고가 없어야 한다')
  })
  await page.goto(`${base}pantry`)
  await page.locator('[data-lite-screen]').waitFor()
  return page
}

const selected = page => page.locator('[data-pantry-question] [aria-selected="true"]').textContent()
const title = page => page.locator('[data-pantry-title]').textContent()
const step = page => page.locator('[data-pantry-step]').textContent()

// answers: 질문별 ↓ 횟수
async function answer(page, downs) {
  for (const n of downs) {
    for (let i = 0; i < n; i++) await page.keyboard.press('ArrowDown')
    await page.keyboard.press('Enter')
  }
  await page.locator('[data-pantry-result]').waitFor()
}

for (const viewport of VIEWPORTS) {
  const tag = `${viewport.width}px`

  test(`${tag} 상관없음 3번 → PANTRY_SETS 중 하나의 제목, ↓ → 다른 제목, Enter → 처음부터`, async t => {
    const page = await setup(t, viewport, [0, 0.999])
    assert.equal(await page.locator('[data-lite-crumb]').textContent(), '자취 밥상')
    assert.equal(await step(page), '1/3')
    assert.equal(await page.locator('#pantry-lite-q').textContent(), '시간은 얼마나?')
    await answer(page, [3, 9, 5]) // 상관없음 = 각 질문 마지막 줄
    const first = await title(page)
    assert.ok(TITLES.includes(first), `제목이 실제 세트: ${first}`)
    assert.equal(first, PANTRY_SETS[0].title, 'Math.random=0 → 첫 후보')
    assert.equal(await page.locator('[data-pantry-count]').textContent(), `후보 ${PANTRY_SETS.length}개`)
    await page.keyboard.press('ArrowDown')
    const second = await title(page)
    assert.ok(TITLES.includes(second))
    assert.notEqual(second, first, '↓ 는 다른 상')
    for (const sel of ['[data-pantry-mood]', '[data-pantry-meta]', '[data-pantry-main]', '[data-pantry-drink]', '[data-pantry-alt]']) {
      assert.ok((await page.locator(sel).textContent()).trim().length > 0, sel)
    }
    assert.match(await page.locator('[data-pantry-meta]').textContent(), /^\d+분 · [\d,]+원$/)
    const set = PANTRY_SETS.find(s => s.title === second)
    assert.equal(await page.locator('[data-pantry-main]').textContent(), findDish(set.main).name)
    assert.equal(await page.locator('[data-lite-keys]').textContent(), '↓ 다른 상 · Enter 처음부터 · Esc 앞 질문')
    await page.waitForTimeout(300)
    if (SHOT_DIR) await page.screenshot({ path: `${SHOT_DIR}/pantry-result-${viewport.width}.png` })
    await page.keyboard.press('Enter')
    assert.equal(await step(page), '1/3', 'Enter = 처음부터')
    assert.equal(await selected(page), '15분 이내', '처음부터 = 답 초기화')
  })

  test(`${tag} 25분 이내 + 김치 → 결과는 그 태그를 모두 가진 세트, 본 것은 소진 전엔 반복 안 됨`, async t => {
    const page = await setup(t, viewport, [0.5, 0.1, 0.9])
    await answer(page, [1, 5, 5])
    const expected = filterSetsByTags(PANTRY_SETS, ['25분 이내', '김치'])
    assert.ok(expected.length >= 2)
    assert.equal(await page.locator('[data-pantry-count]').textContent(), `후보 ${expected.length}개`)
    assert.equal(await page.locator('[data-pantry-near]').count(), 0)
    const seen = []
    for (let i = 0; i < expected.length; i++) {
      const name = await title(page)
      const set = PANTRY_SETS.find(s => s.title === name)
      assert.ok(set && ['25분 이내', '김치'].every(tg => setTags(set).includes(tg)), `조건을 모두 가진 세트: ${name}`)
      assert.ok(!seen.includes(name), `소진 전 반복 없음: ${name}`)
      seen.push(name)
      await page.keyboard.press('ArrowDown')
    }
    assert.deepEqual([...seen].sort(), expected.map(s => s.title).sort())
  })

  test(`${tag} 0건 조합 → 가까운 상 + 안내 한 줄, Esc 로 한 단계씩 되돌아가며 답이 남는다, 1번 질문 Esc = 환승 홀`, async t => {
    const page = await setup(t, viewport)
    await answer(page, [0, 0, 1]) // 15분 이내 + 돼지고기 + 주말 = 정확히 맞는 상 없음
    assert.equal(filterSetsByTags(PANTRY_SETS, ['15분 이내', '돼지고기', '주말']).length, 0)
    assert.equal(await page.locator('[data-pantry-near]').textContent(), '딱 맞는 상은 없어 가까운 것')
    assert.ok(TITLES.includes(await title(page)), '결과가 비지 않는다')
    assert.equal(await page.locator('[data-pantry-count]').count(), 0)
    assert.equal(await page.locator('[data-lite-keys]').textContent(), 'Enter 처음부터 · Esc 앞 질문')
    const near = await title(page)
    await page.keyboard.press('ArrowDown')
    assert.equal(await title(page), near, '후보가 하나뿐이면 ↓ 는 그대로')

    await page.keyboard.press('Escape')
    assert.equal(await step(page), '3/3')
    assert.equal(await selected(page), '주말', '앞서 고른 답 유지')
    await page.keyboard.press('Escape')
    assert.equal(await step(page), '2/3')
    assert.equal(await selected(page), '돼지고기')
    await page.keyboard.press('Escape')
    assert.equal(await step(page), '1/3')
    assert.equal(await selected(page), '15분 이내')
    await page.keyboard.press('Escape')
    await page.locator('.hall[data-hall="lite"]').waitFor()
    assert.equal(await page.locator('[data-lite-screen]').count(), 0)
  })

  test(`${tag} 질문 화면 레이아웃 — 가로 넘침 0, 줄 높이 44px 이상, 포인터 두 번 = 다음`, async t => {
    const page = await setup(t, viewport)
    for (const sel of ['html', 'body', '.page-scroller', '.lite-screen']) {
      assert.equal(await page.evaluate(s => { const e = document.querySelector(s); return Math.max(0, e.scrollWidth - e.clientWidth) }, sel), 0, `${sel} 가로 넘침 없음`)
    }
    const heights = await page.locator('[data-pantry-option]').evaluateAll(els => els.map(e => e.getBoundingClientRect().height))
    assert.ok(heights.length >= 4 && heights.every(h => h >= 44), `줄 높이 ${heights}`)
    await page.waitForTimeout(300)
    if (SHOT_DIR) await page.screenshot({ path: `${SHOT_DIR}/pantry-question-${viewport.width}.png` })
    await page.locator('[data-pantry-option="25분 이내"]').click()
    assert.equal(await step(page), '1/3', '첫 클릭 = 선택만')
    assert.equal(await selected(page), '25분 이내')
    await page.locator('[data-pantry-option="25분 이내"]').click()
    assert.equal(await step(page), '2/3', '같은 줄 다시 = 다음')
    assert.equal(await page.locator('#pantry-lite-q').textContent(), '냉장고에 뭐가 있어?')
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('Enter')
    assert.equal(await page.locator('#pantry-lite-q').textContent(), '오늘은 어떤 날?')
    for (const sel of ['html', '.lite-screen']) {
      assert.equal(await page.evaluate(s => { const e = document.querySelector(s); return Math.max(0, e.scrollWidth - e.clientWidth) }, sel), 0)
    }
  })
}
