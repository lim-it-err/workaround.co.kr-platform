import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createRequire } from 'node:module'
import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { newSeoulContext } from '../e2eContext.mjs'
import { OPERATING_NOTES, OPERATING_NOTES_UPDATED } from '../data/workNotes/operatingModel.js'

// TKT-195 · D-033: 정적 공개본(Pages base)에서 Work Manager 가 운영 노트로 열린다.
// 이 파일은 Pages-base dist 를 스스로 띄운다(WORK_NOTES_TEST_URL 로 외부 서버 지정 가능).
const { chromium } = createRequire(import.meta.url)('playwright')
const publicBase = '/workaround.co.kr-platform/'
const distRoot = fileURLToPath(new URL('../../dist/', import.meta.url))
let base = process.env.WORK_NOTES_TEST_URL || ''
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
  const decodedPath = decodeURIComponent(url.pathname)
  const relativePath = decodedPath.startsWith(publicBase)
    ? decodedPath.slice(publicBase.length)
    : decodedPath.replace(/^\/+/, '')
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

async function setup(t, scenario) {
  const context = await newSeoulContext(browser, {
    viewport: { width: scenario.width, height: scenario.height },
    reducedMotion: 'reduce'
  })
  const page = await context.newPage()
  const errors = []
  const apiRequests = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => {
    if (['error', 'warning'].includes(message.type())) errors.push(message.text())
  })
  page.on('request', request => {
    if (new URL(request.url()).pathname.includes('/api/')) apiRequests.push(request.url())
  })
  await page.addInitScript(theme => localStorage.setItem('workaround-theme', theme), scenario.theme)
  t.after(async () => {
    await context.close()
    assert.deepEqual(errors, [], '브라우저 오류나 경고가 없어야 한다')
    assert.deepEqual(apiRequests, [], '정적 공개본은 API를 호출하지 않아야 한다')
  })
  return page
}

async function assertNoOverflow(page) {
  const values = await page.evaluate(() => ['html', 'body', '.page-scroller'].map(selector => {
    const element = document.querySelector(selector)
    return [selector, element ? Math.max(0, element.scrollWidth - element.clientWidth) : 0]
  }))
  assert.ok(values.every(([, value]) => value === 0), `가로 overflow: ${JSON.stringify(values)}`)
}

async function assertNotesRendered(page, scenario) {
  await page.locator('.work-notes').waitFor()
  assert.equal(await page.getByRole('heading', { level: 1, name: '운영 노트', exact: true }).count(), 1)
  assert.equal((await page.locator('.work-notes-head small').textContent()).trim(), `갱신 ${OPERATING_NOTES_UPDATED}`)

  assert.equal(OPERATING_NOTES.length, 10, '운영 노트는 절 10개')
  assert.deepEqual(
    await page.locator('.work-note h2').allTextContents(),
    OPERATING_NOTES.map(note => note.title)
  )
  for (const status of ['확정', '제안', '할 일']) {
    assert.equal(
      await page.locator('.work-note-badge', { hasText: new RegExp(`^${status}$`) }).count(),
      OPERATING_NOTES.filter(note => note.status === status).length,
      `${status} 배지 수`
    )
  }
  assert.equal(await page.locator('.work-note-points > li').count(), OPERATING_NOTES.reduce((sum, note) => sum + note.points.length, 0))

  // 절 접기: 1440 은 모두 펼침, 375 는 첫 절만 펼침.
  const openStates = await page.locator('.work-note').evaluateAll(items => items.map(item => item.open))
  assert.deepEqual(openStates, OPERATING_NOTES.map((_, index) => scenario.width >= 900 || index === 0), `절 펼침 상태 ${openStates}`)

  // 흐름: 모든 폭에서 단계별 세로 목록이 아니라 화살표로 이어진 문장. 375 는 줄바꿈된다.
  for (const note of OPERATING_NOTES.filter(item => item.flow)) {
    const flow = page.locator(`[data-note-id="${note.id}"] .work-note-flow`)
    if (await flow.isVisible()) {
      const box = await flow.evaluate(element => {
        const lineHeight = parseFloat(getComputedStyle(element).lineHeight)
        return { height: element.getBoundingClientRect().height, lineHeight, display: getComputedStyle(element.querySelector('li')).display }
      })
      assert.equal(box.display, 'inline', `${note.id}: 흐름 단계는 인라인이어야 한다`)
      assert.ok(box.height <= box.lineHeight * (note.flow.length - 1) + 1, `${note.id}: 흐름이 단계별 세로 목록이다 ${JSON.stringify(box)}`)
      if (scenario.width >= 900) assert.ok(box.height <= box.lineHeight * 2 + 1, `${note.id}: 데스크톱 흐름은 1~2줄 ${box.height}`)
    }
  }

  // 접힌 상태 375 전체 높이 ≤ 2,000px (상단바 포함 문서 높이).
  if (scenario.width < 900) {
    const height = await page.evaluate(() => document.querySelector('.work-notes').getBoundingClientRect().height)
    assert.ok(height <= 2000, `375 운영 노트 높이 ${height}px > 2000`)
  }

  assert.equal(await page.locator('.tone-page-hero, .tone-work-manager-details, .tone-support-details').count(), 0, '정적 공개본은 실행 영역을 렌더하지 않는다')
  assert.equal((await page.locator('.work-ops-collapsed').textContent()).trim(), '집 PC 연결 시 사용')
  assert.equal(await page.locator('.junction-access-toast').count(), 0)
  await assertNoOverflow(page)
}

for (const scenario of [
  { width: 375, height: 812, theme: 'dark' },
  { width: 375, height: 812, theme: 'light' },
  { width: 1440, height: 900, theme: 'dark' },
  { width: 1440, height: 900, theme: 'light' }
]) {
  test(`${scenario.width}px ${scenario.theme}: /work 직접 진입·새로고침이 운영 노트를 연다`, async t => {
    const page = await setup(t, scenario)

    await page.goto(`${base}work`)
    await assertNotesRendered(page, scenario)
    assert.equal(new URL(page.url()).pathname, `${publicBase}work`)
    if (process.env.WORK_NOTES_SCREENSHOT_DIR) {
      await page.screenshot({
        path: `${process.env.WORK_NOTES_SCREENSHOT_DIR}/work-${scenario.width}-${scenario.theme}.png`,
        fullPage: true
      })
    }

    await page.reload()
    await assertNotesRendered(page, scenario)
    assert.equal(new URL(page.url()).pathname, `${publicBase}work`)
  })

  test(`${scenario.width}px ${scenario.theme}: W 역은 잠금 없이 열리고 Runtime 은 잠금을 유지한다`, async t => {
    const page = await setup(t, scenario)

    await page.goto(`${base}sim`)
    await page.locator('.tone-sim-page').waitFor()
    await page.goto(`${base}runtime`)
    await page.locator('.junction-overview').waitFor()
    assert.equal(new URL(page.url()).pathname, publicBase, 'Runtime 직접 주소는 환승 홀로 돌아간다')

    const workRow = page.locator('.junction-route-row').filter({ hasText: 'Work Manager' })
    assert.equal(await workRow.locator('.junction-route-status').textContent(), '운영 노트')
    assert.equal(await workRow.evaluate(element => element.classList.contains('protected') || element.classList.contains('restricted')), false)
    assert.equal(await page.locator('.junction-station[data-station-code="W"]').evaluate(element => element.classList.contains('restricted')), false)
    assert.equal(await page.locator('.junction-station[data-station-code="R"]').evaluate(element => element.classList.contains('restricted')), true)

    await workRow.click()
    await page.locator('.work-notes').waitFor()
    assert.equal(new URL(page.url()).pathname, `${publicBase}work`)
    assert.equal(await page.locator('.junction-access-toast').count(), 0)
    await assertNoOverflow(page)

    // 뒤로가기 → 환승 홀, 거기서 Runtime 은 여전히 토스트
    await page.goBack()
    await page.locator('.junction-overview').waitFor()
    await page.locator('.junction-route-row').filter({ hasText: 'Runtime Board' }).click()
    assert.equal(await page.locator('.junction-access-toast').textContent(), '보호 구역 · 준비 중')
    assert.equal(new URL(page.url()).pathname, publicBase)
    if (process.env.WORK_NOTES_SCREENSHOT_DIR) {
      await page.screenshot({
        path: `${process.env.WORK_NOTES_SCREENSHOT_DIR}/home-${scenario.width}-${scenario.theme}.png`,
        fullPage: true
      })
    }
  })
}
